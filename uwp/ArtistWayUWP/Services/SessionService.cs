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
    }

    // Guarda a sessão do login (uid/tokens do Firebase) no cofre de
    // credenciais do Windows (PasswordVault) -- criptografado pelo sistema,
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

            JsonObject json = new JsonObject
            {
                ["uid"] = JsonValue.CreateStringValue(result.FirebaseUid ?? ""),
                ["idToken"] = JsonValue.CreateStringValue(result.FirebaseIdToken ?? ""),
                ["refreshToken"] = JsonValue.CreateStringValue(result.FirebaseRefreshToken ?? ""),
                ["provider"] = JsonValue.CreateStringValue(result.Provider ?? ""),
                ["email"] = JsonValue.CreateStringValue(result.FirebaseEmail ?? ""),
                ["displayName"] = JsonValue.CreateStringValue(result.FirebaseDisplayName ?? ""),
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
                // não tinha sessão salva -- nada a limpar.
            }
        }
    }
}
