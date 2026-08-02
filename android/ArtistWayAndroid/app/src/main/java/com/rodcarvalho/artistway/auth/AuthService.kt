package com.rodcarvalho.artistway.auth

import android.content.Context
import android.util.Base64
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.tasks.await
import java.security.SecureRandom

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
            val credentialManager = CredentialManager.create(context)
            val credential = fetchGoogleCredential(credentialManager, context)

            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
            val authCredential = GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)

            FirebaseAuth.getInstance().signInWithCredential(authCredential).await()
            AuthOutcome(success = true)
        } catch (e: NoCredentialException) {
            AuthOutcome(
                success = false,
                errorMessage = "Nenhuma conta Google encontrada nesse aparelho. Confira em " +
                    "Configurações > Contas se há uma conta Google adicionada (não é a mesma " +
                    "coisa que estar logado num app específico) e se a Play Store está instalada.",
            )
        } catch (e: Exception) {
            AuthOutcome(success = false, errorMessage = e.message ?: "Login cancelado ou falhou.")
        }
    }

    // Tenta primeiro só contas que já autorizaram o app antes (mais rápido,
    // às vezes nem mostra tela nenhuma); se não achar nenhuma, tenta de novo
    // oferecendo todas as contas Google do aparelho — mesmo padrão
    // recomendado pelo guia oficial do Credential Manager.
    private suspend fun fetchGoogleCredential(credentialManager: CredentialManager, context: Context): CustomCredential {
        var lastError: Exception? = null
        for (filterByAuthorizedAccounts in listOf(true, false)) {
            try {
                val option = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(filterByAuthorizedAccounts)
                    .setServerClientId(WEB_CLIENT_ID)
                    .setNonce(generateSecureRandomNonce())
                    .build()
                val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
                val response = credentialManager.getCredential(context, request)
                val credential = response.credential
                if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    return credential
                }
                lastError = Exception("Credencial devolvida não é um Google ID token.")
            } catch (e: GetCredentialException) {
                lastError = e
            }
        }
        throw lastError ?: Exception("Nenhuma credencial Google encontrada.")
    }

    // Valor de uso único anti-replay — recomendado pelo guia oficial do
    // Credential Manager (mesmo sem verificação própria do lado servidor
    // aqui: quem valida o idToken é o Firebase Auth SDK em
    // signInWithCredential, mas incluir o nonce já evita reaproveitar uma
    // resposta de login antiga capturada por acidente).
    private fun generateSecureRandomNonce(byteLength: Int = 32): String {
        val randomBytes = ByteArray(byteLength)
        SecureRandom().nextBytes(randomBytes)
        return Base64.encodeToString(randomBytes, Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)
    }

    suspend fun signOut(context: Context) {
        FirebaseAuth.getInstance().signOut()
        // Limpa o estado guardado pelo Credential Manager (ex.: preferência
        // de login automático) — sem isso, o próximo login poderia tentar
        // reaproveitar a sessão anterior antes de mostrar a escolha de conta.
        try {
            CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
        } catch (e: Exception) {
            // Não crítico — o logout do Firebase já aconteceu.
        }
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
