package com.rodcarvalho.artistway.sync

import com.rodcarvalho.artistway.auth.FirebaseConfig
import com.rodcarvalho.artistway.auth.FirebaseSession
import com.rodcarvalho.artistway.auth.SessionService
import com.rodcarvalho.artistway.data.LocalDataStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.time.Instant
import java.time.LocalTime

// Sincroniza os "stores" do LocalDataStore com o Firestore: puxa a
// versão da nuvem, mescla com a local registro a registro por
// updatedAt (quem for mais recente vence), grava o resultado local e
// sobe de volta — sempre nos dois sentidos, sempre idempotente. Porta
// quase linha a linha de SyncService.cs (UWP); HttpURLConnection puro
// em vez de uma lib de rede nova só pra essas 4 chamadas.
object SyncService {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun syncAll(): String = withContext(Dispatchers.IO) {
        val session = SessionService.getSession() ?: return@withContext "Não logado — nada pra sincronizar."
        val idToken = if (session.needsRefresh()) {
            refreshIdToken(session) ?: return@withContext "Sessão expirada — entre de novo."
        } else {
            session.idToken
        }

        try {
            for (storeName in LocalDataStore.SYNC_STORE_NAMES) {
                syncStore(idToken, session.uid, storeName)
            }
            "Sincronizado às ${LocalTime.now().withNano(0)}"
        } catch (e: Exception) {
            "Falha ao sincronizar (tentará de novo mais tarde): ${e.message}"
        }
    }

    // Apaga os dados da nuvem (todos os stores) sem mexer no login —
    // usado pelo reset "Apagar meus dados" (mantém o aparelho logado).
    suspend fun clearCloudData(): Boolean = withContext(Dispatchers.IO) {
        val session = SessionService.getSession() ?: return@withContext true
        val idToken = if (session.needsRefresh()) {
            refreshIdToken(session) ?: return@withContext false
        } else {
            session.idToken
        }

        try {
            for (storeName in LocalDataStore.SYNC_STORE_NAMES) {
                val conn = openConnection(docUrl(session.uid, storeName), "DELETE", idToken)
                val code = conn.responseCode
                conn.disconnect()
                if (code !in 200..299 && code != 404) return@withContext false
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    private suspend fun syncStore(idToken: String, uid: String, storeName: String) {
        val local = LocalDataStore.getStoreForSync(storeName)
        val remote = getRemoteStore(idToken, uid, storeName)
        val merged = if (storeName == "settings") {
            mergeWholeBlob(local, remote)
        } else {
            mergePerRecord(local, remote, if (storeName == "checkins") "savedAt" else "updatedAt")
        }
        LocalDataStore.writeStoreForSync(storeName, merged)
        putRemoteStore(idToken, uid, storeName, merged)
    }

    // — mesclagem —

    private fun mergeWholeBlob(local: JsonObject, remote: JsonObject): JsonObject {
        if (remote.isEmpty()) return local
        if (local.isEmpty()) return remote
        val localTs = parseTimestamp(local, "_updatedAt")
        val remoteTs = parseTimestamp(remote, "_updatedAt")
        return if (remoteTs.isAfter(localTs)) remote else local
    }

    private fun mergePerRecord(local: JsonObject, remote: JsonObject, tsField: String): JsonObject {
        val keys = LinkedHashSet<String>().apply { addAll(local.keys); addAll(remote.keys) }
        val merged = LinkedHashMap<String, JsonElement>()
        for (key in keys) {
            val hasLocal = local.containsKey(key)
            val hasRemote = remote.containsKey(key)
            merged[key] = when {
                hasLocal && hasRemote -> {
                    val localEntry = normalizeRecord(local.getValue(key))
                    val remoteEntry = normalizeRecord(remote.getValue(key))
                    val localTs = parseTimestamp(localEntry, tsField)
                    val remoteTs = parseTimestamp(remoteEntry, tsField)
                    if (remoteTs.isAfter(localTs)) remoteEntry else localEntry
                }
                hasLocal -> normalizeRecord(local.getValue(key))
                else -> normalizeRecord(remote.getValue(key))
            }
        }
        return JsonObject(merged)
    }

    // Registros de antes da sincronização existir vinham como booleano
    // solto (sem updatedAt) — normaliza pro formato novo, tratado como
    // "o mais antigo possível" na comparação.
    private fun normalizeRecord(value: JsonElement): JsonObject {
        if (value is JsonObject) return value
        val prim = value as? JsonPrimitive
        val boolValue = prim?.booleanOrNull
        return if (boolValue != null) buildJsonObject { put("done", boolValue) } else JsonObject(emptyMap())
    }

    private fun parseTimestamp(obj: JsonObject, field: String): Instant {
        val text = (obj[field] as? JsonPrimitive)?.takeIf { it.isString }?.content ?: return Instant.MIN
        return runCatching { Instant.parse(text) }.getOrDefault(Instant.MIN)
    }

    // — Firestore REST —
    // Cada store vira um documento com um único campo "data" (o JSON
    // inteiro do store, como string) — evita ter que traduzir pro
    // formato de tipos nativos do Firestore pra estruturas que, na
    // prática, o app só lê/escreve como blob.

    private fun docUrl(uid: String, storeName: String) =
        "https://firestore.googleapis.com/v1/projects/${FirebaseConfig.PROJECT_ID}/databases/(default)/documents/users/$uid/stores/$storeName"

    private fun getRemoteStore(idToken: String, uid: String, storeName: String): JsonObject {
        val conn = openConnection(docUrl(uid, storeName), "GET", idToken)
        val code = conn.responseCode
        if (code == 404) {
            conn.disconnect()
            return JsonObject(emptyMap())
        }
        if (code !in 200..299) {
            conn.disconnect()
            throw Exception("Firestore GET $storeName: $code")
        }
        val text = conn.inputStream.bufferedReader().use { it.readText() }
        conn.disconnect()
        val doc = json.parseToJsonElement(text).jsonObject
        val fields = doc["fields"] as? JsonObject ?: return JsonObject(emptyMap())
        val dataField = fields["data"] as? JsonObject ?: return JsonObject(emptyMap())
        val dataJson = (dataField["stringValue"] as? JsonPrimitive)?.content ?: return JsonObject(emptyMap())
        return json.parseToJsonElement(dataJson).jsonObject
    }

    private fun putRemoteStore(idToken: String, uid: String, storeName: String, data: JsonObject) {
        val body = buildJsonObject {
            put(
                "fields",
                buildJsonObject {
                    put("data", buildJsonObject { put("stringValue", data.toString()) })
                    put("updatedAt", buildJsonObject { put("timestampValue", Instant.now().toString()) })
                },
            )
        }
        val conn = openConnection(docUrl(uid, storeName), "PATCH", idToken)
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
        OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(body.toString()) }
        val code = conn.responseCode
        if (code !in 200..299) {
            val errorText = (conn.errorStream ?: conn.inputStream)?.bufferedReader()?.use { it.readText() }
            conn.disconnect()
            throw Exception("Firestore PATCH $storeName: $code $errorText")
        }
        conn.disconnect()
    }

    private fun openConnection(url: String, method: String, idToken: String): HttpURLConnection {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.setRequestProperty("Authorization", "Bearer $idToken")
        conn.connectTimeout = 15000
        conn.readTimeout = 15000
        return conn
    }

    // — renovação de token —

    private fun refreshIdToken(session: FirebaseSession): String? {
        return try {
            val body = "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(session.refreshToken, "UTF-8")
            val conn = URL("https://securetoken.googleapis.com/v1/token?key=${FirebaseConfig.API_KEY}").openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(body) }
            val code = conn.responseCode
            val text = (if (code in 200..299) conn.inputStream else conn.errorStream)?.bufferedReader()?.use { it.readText() }
            conn.disconnect()
            if (code !in 200..299 || text == null) return null

            val obj = json.parseToJsonElement(text).jsonObject
            val idToken = (obj["id_token"] as? JsonPrimitive)?.content ?: return null
            val expiresIn = (obj["expires_in"] as? JsonPrimitive)?.content?.toIntOrNull() ?: 3600
            SessionService.updateTokens(idToken, expiresIn)
            idToken
        } catch (e: Exception) {
            null
        }
    }
}
