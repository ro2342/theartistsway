using System;
using Windows.Data.Json;
using Windows.Security.Credentials;

namespace ArtistWayUWP.Services
{
    public sealed class FirebaseSession
    {
        public string Uid { get; set; }
        public string IdToken { get; set; }
        public string RefreshToken { get; set; }
        public string Provider { get; set; }
        public string Email { get; set; }
        public string DisplayName { get; set; }
        public DateTimeOffset IdTokenExpiresAt { get; set; }

        // Um pouco de folga antes do vencimento de verdade, pra nunca correr
        // o risco de o Firestore rejeitar por token vencido no meio de uma
        // chamada em andamento.
        public bool NeedsRefresh => DateTimeOffset.UtcNow >= IdTokenExpiresAt.AddSeconds(-60);
    }

    // Guarda a sessão do login (uid/tokens do Firebase) no cofre de
    // credenciais do Windows (PasswordVault) — criptografado pelo sistema,
    // diferente do resto dos dados do app (JSON simples em LocalDataStore),
    // porque um refresh token equivale a uma senha.
    public static class SessionService
    {
        private const string Resource = "ArtistWayCompanion.FirebaseSession";
        private const string UserName = "session";

        public static void SaveSession(AuthResult result)
        {
            PasswordVault vault = new PasswordVault();
            RemoveExisting(vault);

            DateTimeOffset expiresAt = DateTimeOffset.UtcNow.AddSeconds(result.ExpiresInSeconds > 0 ? result.ExpiresInSeconds : 3600);
            JsonObject json = new JsonObject
            {
                ["uid"] = JsonValue.CreateStringValue(result.FirebaseUid ?? ""),
                ["idToken"] = JsonValue.CreateStringValue(result.FirebaseIdToken ?? ""),
                ["refreshToken"] = JsonValue.CreateStringValue(result.FirebaseRefreshToken ?? ""),
                ["provider"] = JsonValue.CreateStringValue(result.Provider ?? ""),
                ["email"] = JsonValue.CreateStringValue(result.FirebaseEmail ?? ""),
                ["displayName"] = JsonValue.CreateStringValue(result.FirebaseDisplayName ?? ""),
                ["idTokenExpiresAt"] = JsonValue.CreateStringValue(expiresAt.ToString("o")),
            };

            vault.Add(new PasswordCredential(Resource, UserName, json.Stringify()));
        }

        // Chamado pelo SyncService depois de renovar o idToken via refresh
        // token (o refresh token em si não muda nesse fluxo do Firebase).
        public static void UpdateTokens(string idToken, int expiresInSeconds)
        {
            FirebaseSession session = GetSession();
            if (session == null)
            {
                return;
            }

            PasswordVault vault = new PasswordVault();
            RemoveExisting(vault);

            JsonObject json = new JsonObject
            {
                ["uid"] = JsonValue.CreateStringValue(session.Uid ?? ""),
                ["idToken"] = JsonValue.CreateStringValue(idToken ?? ""),
                ["refreshToken"] = JsonValue.CreateStringValue(session.RefreshToken ?? ""),
                ["provider"] = JsonValue.CreateStringValue(session.Provider ?? ""),
                ["email"] = JsonValue.CreateStringValue(session.Email ?? ""),
                ["displayName"] = JsonValue.CreateStringValue(session.DisplayName ?? ""),
                ["idTokenExpiresAt"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds > 0 ? expiresInSeconds : 3600).ToString("o")),
            };

            vault.Add(new PasswordCredential(Resource, UserName, json.Stringify()));
        }

        public static FirebaseSession GetSession()
        {
            try
            {
                PasswordVault vault = new PasswordVault();
                PasswordCredential credential = vault.Retrieve(Resource, UserName);
                credential.RetrievePassword();
                JsonObject json = JsonObject.Parse(credential.Password);
                return new FirebaseSession
                {
                    Uid = json.GetNamedString("uid", ""),
                    IdToken = json.GetNamedString("idToken", ""),
                    RefreshToken = json.GetNamedString("refreshToken", ""),
                    Provider = json.GetNamedString("provider", ""),
                    Email = json.GetNamedString("email", ""),
                    DisplayName = json.GetNamedString("displayName", ""),
                    IdTokenExpiresAt = DateTimeOffset.TryParse(json.GetNamedString("idTokenExpiresAt", ""), out DateTimeOffset expiresAt)
                        ? expiresAt
                        : DateTimeOffset.UtcNow.AddSeconds(-1),
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public static void ClearSession()
        {
            RemoveExisting(new PasswordVault());
        }

        private static void RemoveExisting(PasswordVault vault)
        {
            try
            {
                vault.Remove(vault.Retrieve(Resource, UserName));
            }
            catch (Exception)
            {
                // não tinha sessão salva — nada a limpar.
            }
        }
    }
}
