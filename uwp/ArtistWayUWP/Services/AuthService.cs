using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Windows.Data.Json;
using Windows.Security.Authentication.Web.Core;
using Windows.Security.Credentials;

namespace ArtistWayUWP.Services
{
    public sealed class AuthResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public string FirebaseUid { get; set; }
        public string FirebaseIdToken { get; set; }
        public string FirebaseRefreshToken { get; set; }
    }

    // Login com Microsoft via WAM (WebAuthenticationCoreManager) -- reaproveita
    // a conta Microsoft já logada no aparelho, sem abrir navegador. O token
    // obtido é trocado pelo login do Firebase via REST (Identity Toolkit),
    // já que não existe SDK oficial do Firebase pra UWP.
    public static class AuthService
    {
        // Application (client) ID do app registrado no Entra ID
        // (uwp/ArtistWayUWP -- ver sincronizacao-nuvem-setup.md).
        private const string MicrosoftClientId = "bf179c88-8388-4ffb-a90a-d8676d4e9513";

        // apiKey público do projeto Firebase (uwp/ArtistWayUWP/Data/firebase-config.json).
        private const string FirebaseApiKey = "AIzaSyD8xvN_LU11KY51em_RsCaksRmXDmlXF48";

        public static async Task<AuthResult> SignInWithMicrosoftAsync()
        {
            try
            {
                // Nem "common" nem "consumers" se comportaram direito nesse
                // Windows 10 Mobile (um foi pra conta errada, o outro nem
                // validou). O usuário confirmou que só existe UMA conta
                // Microsoft no aparelho (pessoal) -- sem ambiguidade nenhuma
                // pra resolver, então usa a sobrecarga sem authority e deixa
                // o próprio broker escolher a única conta disponível.
                WebAccountProvider provider = await WebAuthenticationCoreManager.FindAccountProviderAsync(
                    "https://login.microsoft.com");

                if (provider == null)
                {
                    return new AuthResult { Success = false, ErrorMessage = "Provedor de conta Microsoft não encontrado nesse aparelho." };
                }

                WebTokenRequest request = new WebTokenRequest(provider, "openid profile", MicrosoftClientId);
                WebTokenRequestResult result = await WebAuthenticationCoreManager.RequestTokenAsync(request);

                if (result.ResponseStatus != WebTokenRequestStatus.Success)
                {
                    string errorDetail = result.ResponseError != null
                        ? $" ({result.ResponseError.ErrorCode}: {result.ResponseError.ErrorMessage})"
                        : "";
                    return new AuthResult { Success = false, ErrorMessage = $"WAM: {result.ResponseStatus}{errorDetail}" };
                }

                if (result.ResponseData == null || result.ResponseData.Count == 0)
                {
                    return new AuthResult { Success = false, ErrorMessage = "WAM não devolveu nenhuma resposta." };
                }

                WebTokenResponse tokenResponse = result.ResponseData[0];
                string idToken = null;
                if (tokenResponse.Properties != null && tokenResponse.Properties.ContainsKey("id_token"))
                {
                    idToken = tokenResponse.Properties["id_token"];
                }
                if (string.IsNullOrEmpty(idToken))
                {
                    idToken = tokenResponse.Token;
                }

                if (string.IsNullOrEmpty(idToken))
                {
                    return new AuthResult { Success = false, ErrorMessage = "WAM não devolveu id_token nem access token." };
                }

                return await ExchangeWithFirebaseAsync(idToken, "microsoft.com");
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        private static async Task<AuthResult> ExchangeWithFirebaseAsync(string idToken, string providerId)
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    string url = $"https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key={FirebaseApiKey}";
                    string postBody = $"id_token={Uri.EscapeDataString(idToken)}&providerId={providerId}";

                    JsonObject payload = new JsonObject
                    {
                        ["postBody"] = JsonValue.CreateStringValue(postBody),
                        ["requestUri"] = JsonValue.CreateStringValue("http://localhost"),
                        ["returnIdpCredential"] = JsonValue.CreateBooleanValue(true),
                        ["returnSecureToken"] = JsonValue.CreateBooleanValue(true),
                    };

                    HttpContent content = new StringContent(payload.Stringify(), Encoding.UTF8, "application/json");
                    HttpResponseMessage response = await client.PostAsync(url, content);
                    string responseText = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                    {
                        return new AuthResult { Success = false, ErrorMessage = $"Firebase {(int)response.StatusCode}: {responseText}" };
                    }

                    JsonObject json = JsonObject.Parse(responseText);
                    return new AuthResult
                    {
                        Success = true,
                        FirebaseUid = json.ContainsKey("localId") ? json["localId"].GetString() : null,
                        FirebaseIdToken = json.ContainsKey("idToken") ? json["idToken"].GetString() : null,
                        FirebaseRefreshToken = json.ContainsKey("refreshToken") ? json["refreshToken"].GetString() : null,
                    };
                }
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, ErrorMessage = "Troca com Firebase falhou: " + ex.Message };
            }
        }
    }
}
