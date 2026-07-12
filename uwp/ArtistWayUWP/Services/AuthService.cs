using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Windows.Data.Json;
using Windows.Security.Authentication.Web;
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
        public string FirebaseEmail { get; set; }
        public string FirebaseDisplayName { get; set; }
        public string Provider { get; set; }
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

        // Cliente OAuth "TVs e dispositivos de entrada limitada" (Device
        // Authorization Grant) -- ver sincronizacao-nuvem-setup.md, Parte 6.
        // O Client ID não é sensível (é público em qualquer app instalado),
        // mas o Client Secret NUNCA fica em texto puro aqui -- o workflow
        // 02-build-appx.yml substitui o placeholder abaixo pelo valor real
        // (guardado como GitHub Actions secret) só no momento do build,
        // então nunca aparece no histórico do git deste repositório público.
        private const string GoogleClientId = "431486750791-e914tsjikjlp9e3vlaehlr8a86dj69lg.apps.googleusercontent.com";
        private const string GoogleClientSecret = "__GOOGLE_OAUTH_CLIENT_SECRET__";

        // Cliente OAuth "Desktop app" -- dá a tela de consentimento normal do
        // Google (nome do app, botão Permitir), via WebAuthenticationBroker +
        // redirecionamento loopback. Mesmo esquema de segredo: placeholder
        // substituído só no build (ver sincronizacao-nuvem-setup.md, Parte 7).
        private const string GoogleDesktopClientId = "431486750791-cm92iio4veer7ob4or7eqeg6qbb4t8af.apps.googleusercontent.com";
        private const string GoogleDesktopClientSecret = "__GOOGLE_OAUTH_DESKTOP_CLIENT_SECRET__";
        private const string GoogleDesktopRedirectUri = "http://127.0.0.1";

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

                return await ExchangeWithFirebaseAsync(idToken, "microsoft.com", "id_token");
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        // Fluxo de dispositivo (Device Authorization Grant) -- o mesmo que
        // Smart TVs usam: mostra um código e um link, o usuário confirma em
        // QUALQUER navegador (não precisa ser nesse aparelho), e o app fica
        // esperando. Sem Store, sem redirect URI -- diferente do WAM, que
        // esbarrou na exigência de associação com a Store.
        //
        // onCodeReady é chamado assim que o código chega, ANTES de começar a
        // esperar a confirmação, pra UI poder mostrar o código e/ou abrir o
        // navegador. Parâmetros: (verificationUrl, userCode, completeUrl).
        // completeUrl é a variante com o código já embutido (quando o Google
        // devolve verification_url_complete) -- pode vir null, nesse caso só
        // dá pra abrir a URL base e o usuário digita o código à mão.
        public static async Task<AuthResult> SignInWithGoogleAsync(Action<string, string, string> onCodeReady)
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    FormUrlEncodedContent deviceCodeRequest = new FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["client_id"] = GoogleClientId,
                        ["scope"] = "openid email profile",
                    });

                    HttpResponseMessage deviceResponse = await client.PostAsync("https://oauth2.googleapis.com/device/code", deviceCodeRequest);
                    string deviceResponseText = await deviceResponse.Content.ReadAsStringAsync();
                    if (!deviceResponse.IsSuccessStatusCode)
                    {
                        return new AuthResult { Success = false, ErrorMessage = $"Google device/code {(int)deviceResponse.StatusCode}: {deviceResponseText}" };
                    }

                    JsonObject deviceJson = JsonObject.Parse(deviceResponseText);
                    string deviceCode = deviceJson["device_code"].GetString();
                    string userCode = deviceJson["user_code"].GetString();
                    string verificationUrl = deviceJson["verification_url"].GetString();
                    // O nome exato desse campo varia entre "_url_" (como o
                    // resto da resposta do Google) e "_uri_" (como no RFC
                    // 8628) -- checa os dois pra não depender de qual dos
                    // dois o Google realmente devolve.
                    string completeUrl = null;
                    if (deviceJson.ContainsKey("verification_url_complete"))
                    {
                        completeUrl = deviceJson["verification_url_complete"].GetString();
                    }
                    else if (deviceJson.ContainsKey("verification_uri_complete"))
                    {
                        completeUrl = deviceJson["verification_uri_complete"].GetString();
                    }
                    double interval = deviceJson.ContainsKey("interval") ? deviceJson["interval"].GetNumber() : 5;
                    double expiresIn = deviceJson.ContainsKey("expires_in") ? deviceJson["expires_in"].GetNumber() : 1800;

                    onCodeReady?.Invoke(verificationUrl, userCode, completeUrl);

                    DateTime deadline = DateTime.UtcNow.AddSeconds(expiresIn);
                    while (DateTime.UtcNow < deadline)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(interval));

                        FormUrlEncodedContent tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
                        {
                            ["client_id"] = GoogleClientId,
                            ["client_secret"] = GoogleClientSecret,
                            ["device_code"] = deviceCode,
                            ["grant_type"] = "urn:ietf:params:oauth:grant-type:device_code",
                        });

                        HttpResponseMessage tokenResponse = await client.PostAsync("https://oauth2.googleapis.com/token", tokenRequest);
                        string tokenResponseText = await tokenResponse.Content.ReadAsStringAsync();
                        JsonObject tokenJson = JsonObject.Parse(tokenResponseText);

                        if (tokenResponse.IsSuccessStatusCode)
                        {
                            string idToken = tokenJson.ContainsKey("id_token") ? tokenJson["id_token"].GetString() : null;
                            string accessToken = tokenJson.ContainsKey("access_token") ? tokenJson["access_token"].GetString() : null;

                            if (!string.IsNullOrEmpty(idToken))
                            {
                                return await ExchangeWithFirebaseAsync(idToken, "google.com", "id_token");
                            }
                            if (!string.IsNullOrEmpty(accessToken))
                            {
                                return await ExchangeWithFirebaseAsync(accessToken, "google.com", "access_token");
                            }
                            return new AuthResult { Success = false, ErrorMessage = "Google não devolveu id_token nem access_token." };
                        }

                        string error = tokenJson.ContainsKey("error") ? tokenJson["error"].GetString() : null;
                        if (error == "authorization_pending")
                        {
                            continue;
                        }
                        if (error == "slow_down")
                        {
                            interval += 5;
                            continue;
                        }

                        // access_denied, expired_token, ou qualquer outro erro é definitivo.
                        return new AuthResult { Success = false, ErrorMessage = $"Google: {error}" };
                    }

                    return new AuthResult { Success = false, ErrorMessage = "Tempo esgotado esperando a confirmação do login." };
                }
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        // Tela de consentimento normal do Google ("ArtistWay quer acessar sua
        // Conta Google -- Permitir?"), via WebAuthenticationBroker + redirect
        // loopback (127.0.0.1). O broker do Windows intercepta essa URL de
        // volta sozinho, sem precisar de nenhum servidor local de verdade.
        public static async Task<AuthResult> SignInWithGoogleConsentAsync()
        {
            try
            {
                string authUrl = "https://accounts.google.com/o/oauth2/v2/auth" +
                    "?client_id=" + Uri.EscapeDataString(GoogleDesktopClientId) +
                    "&redirect_uri=" + Uri.EscapeDataString(GoogleDesktopRedirectUri) +
                    "&response_type=code" +
                    "&scope=" + Uri.EscapeDataString("openid email profile");

                WebAuthenticationResult result = await WebAuthenticationBroker.AuthenticateAsync(
                    WebAuthenticationOptions.None, new Uri(authUrl), new Uri(GoogleDesktopRedirectUri));

                if (result.ResponseStatus != WebAuthenticationStatus.Success)
                {
                    return new AuthResult { Success = false, ErrorMessage = $"Navegador: {result.ResponseStatus} ({result.ResponseErrorDetail})" };
                }

                Uri responseUri = new Uri(result.ResponseData);
                Dictionary<string, string> parsed = ParseQueryString(responseUri.Query.TrimStart('?'));

                if (parsed.ContainsKey("error"))
                {
                    return new AuthResult { Success = false, ErrorMessage = "Google: " + parsed["error"] };
                }
                if (!parsed.ContainsKey("code"))
                {
                    return new AuthResult { Success = false, ErrorMessage = "Resposta do Google sem código de autorização." };
                }

                using (HttpClient client = new HttpClient())
                {
                    FormUrlEncodedContent tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["code"] = parsed["code"],
                        ["client_id"] = GoogleDesktopClientId,
                        ["client_secret"] = GoogleDesktopClientSecret,
                        ["redirect_uri"] = GoogleDesktopRedirectUri,
                        ["grant_type"] = "authorization_code",
                    });

                    HttpResponseMessage tokenResponse = await client.PostAsync("https://oauth2.googleapis.com/token", tokenRequest);
                    string tokenResponseText = await tokenResponse.Content.ReadAsStringAsync();
                    if (!tokenResponse.IsSuccessStatusCode)
                    {
                        return new AuthResult { Success = false, ErrorMessage = $"Google token {(int)tokenResponse.StatusCode}: {tokenResponseText}" };
                    }

                    JsonObject tokenJson = JsonObject.Parse(tokenResponseText);
                    string idToken = tokenJson.ContainsKey("id_token") ? tokenJson["id_token"].GetString() : null;
                    string accessToken = tokenJson.ContainsKey("access_token") ? tokenJson["access_token"].GetString() : null;

                    if (!string.IsNullOrEmpty(idToken))
                    {
                        return await ExchangeWithFirebaseAsync(idToken, "google.com", "id_token");
                    }
                    if (!string.IsNullOrEmpty(accessToken))
                    {
                        return await ExchangeWithFirebaseAsync(accessToken, "google.com", "access_token");
                    }
                    return new AuthResult { Success = false, ErrorMessage = "Google não devolveu id_token nem access_token." };
                }
            }
            catch (Exception ex)
            {
                return new AuthResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        private static Dictionary<string, string> ParseQueryString(string query)
        {
            Dictionary<string, string> result = new Dictionary<string, string>();
            foreach (string pair in query.Split('&'))
            {
                if (string.IsNullOrEmpty(pair))
                {
                    continue;
                }
                string[] kv = pair.Split(new[] { '=' }, 2);
                result[Uri.UnescapeDataString(kv[0])] = kv.Length > 1 ? Uri.UnescapeDataString(kv[1]) : "";
            }
            return result;
        }

        private static async Task<AuthResult> ExchangeWithFirebaseAsync(string token, string providerId, string tokenParamName)
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    string url = $"https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key={FirebaseApiKey}";
                    string postBody = $"{tokenParamName}={Uri.EscapeDataString(token)}&providerId={providerId}";

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
                        FirebaseEmail = json.ContainsKey("email") ? json["email"].GetString() : null,
                        FirebaseDisplayName = json.ContainsKey("displayName") ? json["displayName"].GetString() : null,
                        Provider = providerId == "google.com" ? "Google" : providerId == "microsoft.com" ? "Microsoft" : providerId,
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
