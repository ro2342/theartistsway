package com.rodcarvalho.artistway.update

import android.content.Context
import android.content.pm.PackageManager
import com.rodcarvalho.artistway.data.ContentStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.net.HttpURLConnection
import java.net.URL

data class UpdateCheckResult(
    val success: Boolean,
    val latestVersionName: String? = null,
    val updateAvailable: Boolean = false,
    val error: String? = null,
)

// Substitui UpdateCheckService.cs (UWP): compara a versão instalada com
// app/android/version.json (publicado por 04-build-apk.yml). Como o
// sideload no Android não deixa um app se autoinstalar, o máximo que dá
// pra automatizar é baixar o APK e entregar pro instalador do sistema
// (ver UpdateDownloader), mesmo limite do UWP com o instalador nativo
// do Windows.
object UpdateCheckService {
    private const val VERSION_URL = "https://ro2342.github.io/theartistsway/app/android/version.json"
    const val DOWNLOAD_PAGE_URL = "https://ro2342.github.io/theartistsway/app/android/"
    const val DOWNLOAD_FILE_URL = "https://ro2342.github.io/theartistsway/app/android/app.apk"

    fun getInstalledVersionName(context: Context): String = try {
        context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "?"
    } catch (e: PackageManager.NameNotFoundException) {
        "?"
    }

    fun compareVersions(a: String, b: String): Int {
        val pa = a.split(".")
        val pb = b.split(".")
        val len = maxOf(pa.size, pb.size)
        for (i in 0 until len) {
            val na = pa.getOrNull(i)?.toIntOrNull() ?: 0
            val nb = pb.getOrNull(i)?.toIntOrNull() ?: 0
            if (na != nb) return na - nb
        }
        return 0
    }

    suspend fun check(context: Context): UpdateCheckResult = withContext(Dispatchers.IO) {
        try {
            val conn = URL(VERSION_URL).openConnection() as HttpURLConnection
            conn.connectTimeout = 10000
            conn.readTimeout = 10000
            val code = conn.responseCode
            if (code !in 200..299) {
                conn.disconnect()
                return@withContext UpdateCheckResult(success = false, error = ContentStore.s("updates.checkHttpError", "code" to code.toString()))
            }
            val text = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()

            val obj = Json.parseToJsonElement(text).jsonObject
            val latest = obj["versionName"]?.jsonPrimitive?.content
                ?: return@withContext UpdateCheckResult(success = false, error = ContentStore.s("updates.checkNoVersionName"))
            val installed = getInstalledVersionName(context)
            UpdateCheckResult(success = true, latestVersionName = latest, updateAvailable = compareVersions(latest, installed) > 0)
        } catch (e: Exception) {
            UpdateCheckResult(success = false, error = e.message)
        }
    }
}
