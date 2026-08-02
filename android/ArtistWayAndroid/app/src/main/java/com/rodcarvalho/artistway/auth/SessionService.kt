package com.rodcarvalho.artistway.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.time.Instant

@Serializable
data class FirebaseSession(
    val uid: String,
    val idToken: String,
    val refreshToken: String,
    val provider: String,
    val email: String,
    val displayName: String,
    val idTokenExpiresAt: String,
) {
    // Um pouco de folga antes do vencimento de verdade, pra nunca correr
    // o risco do Firestore rejeitar por token vencido no meio de uma
    // chamada em andamento.
    fun needsRefresh(): Boolean {
        val expiresAt = runCatching { Instant.parse(idTokenExpiresAt) }.getOrNull() ?: return true
        return !Instant.now().isBefore(expiresAt.minusSeconds(60))
    }
}

// Guarda a sessão do login (uid/tokens do Firebase) em
// EncryptedSharedPreferences — criptografado pelo Android Keystore,
// diferente do resto dos dados do app (JSON simples em LocalDataStore),
// porque um refresh token equivale a uma senha. Mesmo papel do
// PasswordVault no UWP.
object SessionService {
    private const val PREFS_NAME = "artistway_session"
    private const val KEY_SESSION = "session"

    private lateinit var appContext: Context
    private val json = Json { ignoreUnknownKeys = true }

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    private fun prefs() = EncryptedSharedPreferences.create(
        appContext,
        PREFS_NAME,
        MasterKey.Builder(appContext).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    fun saveSession(session: FirebaseSession) {
        prefs().edit().putString(KEY_SESSION, json.encodeToString(FirebaseSession.serializer(), session)).apply()
    }

    // Chamado pelo SyncService depois de renovar o idToken via refresh
    // token (o refresh token em si não muda nesse fluxo do Firebase).
    fun updateTokens(idToken: String, expiresInSeconds: Int) {
        val current = getSession() ?: return
        val expiresAt = Instant.now().plusSeconds(if (expiresInSeconds > 0) expiresInSeconds.toLong() else 3600L)
        saveSession(current.copy(idToken = idToken, idTokenExpiresAt = expiresAt.toString()))
    }

    fun getSession(): FirebaseSession? {
        val text = prefs().getString(KEY_SESSION, null) ?: return null
        return runCatching { json.decodeFromString(FirebaseSession.serializer(), text) }.getOrNull()
    }

    fun clearSession() {
        prefs().edit().remove(KEY_SESSION).apply()
    }
}
