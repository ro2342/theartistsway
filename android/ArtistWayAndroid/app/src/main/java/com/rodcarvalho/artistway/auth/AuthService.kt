package com.rodcarvalho.artistway.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.tasks.await

// "Web client ID" do mesmo projeto Firebase que UWP/PWA usam (do
// google-services.json, oauth_client com client_type 3) — é o que o
// Credential Manager precisa como serverClientId pra devolver um
// idToken que o Firebase aceita, mesmo sendo tecnicamente um client id
// "web" (é assim que o Google Identity Services funciona no Android:
// sempre pede um id token endereçado a um client id de servidor, nunca
// um "client id Android" de verdade).
private const val WEB_CLIENT_ID = "431486750791-tamak4eb84o2q8k2o45diqsj5osb4f97.apps.googleusercontent.com"

data class AuthOutcome(val success: Boolean, val errorMessage: String? = null)

// Login com Google via Credential Manager (a tela de escolha de conta
// já é resolvida pelo próprio sistema) + Firebase Auth SDK de verdade —
// bem mais simples que o par device-grant/consent-flow que o
// AuthService.cs precisa reimplementar na mão no UWP, porque lá não
// existe SDK do Firebase. O SDK cuida sozinho de persistir a sessão
// entre reinícios e renovar o token — não precisa de um SessionService
// próprio guardando refresh token feito à mão.
object AuthService {
    val currentUser: FirebaseUser?
        get() = FirebaseAuth.getInstance().currentUser

    suspend fun signInWithGoogle(context: Context): AuthOutcome {
        return try {
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(WEB_CLIENT_ID)
                .build()
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val credentialManager = CredentialManager.create(context)
            val response = credentialManager.getCredential(context, request)
            val credential = response.credential

            if (credential !is CustomCredential || credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                return AuthOutcome(success = false, errorMessage = "Credencial inesperada.")
            }
            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
            val authCredential = GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)

            FirebaseAuth.getInstance().signInWithCredential(authCredential).await()
            AuthOutcome(success = true)
        } catch (e: Exception) {
            AuthOutcome(success = false, errorMessage = e.message ?: "Login cancelado ou falhou.")
        }
    }

    fun signOut() {
        FirebaseAuth.getInstance().signOut()
    }

    // idToken atual, renovando sozinho se preciso — o SDK cuida do cache
    // e só bate na rede de novo quando o token realmente está perto de
    // vencer (mesma folga de segurança que o FirebaseSession.NeedsRefresh
    // do UWP tinha que calcular na mão).
    suspend fun currentIdToken(): String? {
        val user = currentUser ?: return null
        return user.getIdToken(false).await().token
    }
}
