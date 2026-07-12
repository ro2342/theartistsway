using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Windows.Data.Json;

namespace ArtistWayUWP.Services
{
    // Sincroniza os "stores" do LocalDataStore com o Firestore: puxa a
    // versão da nuvem, mescla com a local registro a registro por
    // updatedAt (quem for mais recente vence), grava o resultado local e
    // sobe de volta -- sempre nos dois sentidos, sempre idempotente. Sem
    // listener em tempo real: cada chamada é só um request/response HTTP
    // curto (ver "Decisões de arquitetura" em sincronizacao-nuvem-setup.md).
    public static class SyncService
    {
        private const string ProjectId = "theartistsway";

        public static async Task<string> SyncAllAsync()
        {
            FirebaseSession session = SessionService.GetSession();
            if (session == null)
            {
                return "Não logado -- nada pra sincronizar.";
            }

            string idToken = session.IdToken;
            if (session.NeedsRefresh)
            {
                idToken = await RefreshIdTokenAsync(session);
                if (idToken == null)
                {
                    return "Sessão expirada -- entre de novo.";
                }
            }

            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", idToken);
                    foreach (string storeName in LocalDataStore.SyncStoreNames)
                    {
                        await SyncStoreAsync(client, session.Uid, storeName);
                    }
                }
                return "Sincronizado às " + DateTimeOffset.Now.ToString("HH:mm");
            }
            catch (Exception ex)
            {
                return "Falha ao sincronizar (tentará de novo mais tarde): " + ex.Message;
            }
        }

        private static async Task SyncStoreAsync(HttpClient client, string uid, string storeName)
        {
            JsonObject local = await LocalDataStore.GetStoreForSyncAsync(storeName);
            JsonObject remote = await GetRemoteStoreAsync(client, uid, storeName);

            JsonObject merged = storeName == "settings"
                ? MergeWholeBlob(local, remote)
                : MergePerRecord(local, remote, TimestampFieldFor(storeName));

            await LocalDataStore.WriteStoreForSyncAsync(storeName, merged);
            await PutRemoteStoreAsync(client, uid, storeName, merged);
        }

        private static string TimestampFieldFor(string storeName) => storeName == "checkins" ? "savedAt" : "updatedAt";

        // ---------- mesclagem ----------

        private static JsonObject MergeWholeBlob(JsonObject local, JsonObject remote)
        {
            if (remote.Count == 0)
            {
                return local;
            }
            if (local.Count == 0)
            {
                return remote;
            }
            DateTimeOffset localTs = ParseTimestamp(local, "_updatedAt");
            DateTimeOffset remoteTs = ParseTimestamp(remote, "_updatedAt");
            return remoteTs > localTs ? remote : local;
        }

        private static JsonObject MergePerRecord(JsonObject local, JsonObject remote, string tsField)
        {
            JsonObject merged = new JsonObject();
            HashSet<string> keys = new HashSet<string>();
            foreach (KeyValuePair<string, IJsonValue> kv in local)
            {
                keys.Add(kv.Key);
            }
            foreach (KeyValuePair<string, IJsonValue> kv in remote)
            {
                keys.Add(kv.Key);
            }

            foreach (string key in keys)
            {
                bool hasLocal = local.ContainsKey(key);
                bool hasRemote = remote.ContainsKey(key);
                if (hasLocal && hasRemote)
                {
                    JsonObject localEntry = NormalizeRecord(local[key]);
                    JsonObject remoteEntry = NormalizeRecord(remote[key]);
                    DateTimeOffset localTs = ParseTimestamp(localEntry, tsField);
                    DateTimeOffset remoteTs = ParseTimestamp(remoteEntry, tsField);
                    merged[key] = remoteTs > localTs ? remoteEntry : localEntry;
                }
                else if (hasLocal)
                {
                    merged[key] = NormalizeRecord(local[key]);
                }
                else
                {
                    merged[key] = NormalizeRecord(remote[key]);
                }
            }
            return merged;
        }

        // Registros de antes da sincronização existir vinham como booleano
        // solto (sem updatedAt) -- normaliza pro formato novo, tratado como
        // "o mais antigo possível" na comparação (ParseTimestamp devolve
        // DateTimeOffset.MinValue quando falta o campo).
        private static JsonObject NormalizeRecord(IJsonValue value)
        {
            if (value.ValueType == JsonValueType.Object)
            {
                return value.GetObject();
            }
            JsonObject wrapped = new JsonObject();
            if (value.ValueType == JsonValueType.Boolean)
            {
                wrapped["done"] = JsonValue.CreateBooleanValue(value.GetBoolean());
            }
            return wrapped;
        }

        private static DateTimeOffset ParseTimestamp(JsonObject obj, string field)
        {
            if (obj.ContainsKey(field) && obj[field].ValueType == JsonValueType.String &&
                DateTimeOffset.TryParse(obj[field].GetString(), out DateTimeOffset result))
            {
                return result;
            }
            return DateTimeOffset.MinValue;
        }

        // ---------- Firestore REST ----------
        // Cada store vira um documento com um único campo "data" (o JSON
        // inteiro do store, como string) -- evita ter que traduzir pro
        // formato de tipos nativos do Firestore (mapValue/arrayValue/etc.)
        // pra estruturas que, na prática, o app só lê/escreve como blob.

        private static string DocUrl(string uid, string storeName) =>
            $"https://firestore.googleapis.com/v1/projects/{ProjectId}/databases/(default)/documents/users/{uid}/stores/{storeName}";

        private static async Task<JsonObject> GetRemoteStoreAsync(HttpClient client, string uid, string storeName)
        {
            HttpResponseMessage response = await client.GetAsync(DocUrl(uid, storeName));
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return new JsonObject();
            }
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Firestore GET {storeName}: {(int)response.StatusCode}");
            }

            string text = await response.Content.ReadAsStringAsync();
            JsonObject doc = JsonObject.Parse(text);
            if (!doc.ContainsKey("fields"))
            {
                return new JsonObject();
            }
            JsonObject fields = doc["fields"].GetObject();
            if (!fields.ContainsKey("data"))
            {
                return new JsonObject();
            }
            string dataJson = fields["data"].GetObject()["stringValue"].GetString();
            return JsonObject.Parse(dataJson);
        }

        private static async Task PutRemoteStoreAsync(HttpClient client, string uid, string storeName, JsonObject data)
        {
            JsonObject body = new JsonObject
            {
                ["fields"] = new JsonObject
                {
                    ["data"] = new JsonObject { ["stringValue"] = JsonValue.CreateStringValue(data.Stringify()) },
                    ["updatedAt"] = new JsonObject { ["timestampValue"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.ToString("o")) },
                },
            };

            HttpContent content = new StringContent(body.Stringify(), Encoding.UTF8, "application/json");
            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod("PATCH"), DocUrl(uid, storeName)) { Content = content };
            HttpResponseMessage response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                string errorText = await response.Content.ReadAsStringAsync();
                throw new Exception($"Firestore PATCH {storeName}: {(int)response.StatusCode} {errorText}");
            }
        }

        // ---------- renovação de token ----------

        private static async Task<string> RefreshIdTokenAsync(FirebaseSession session)
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    FormUrlEncodedContent body = new FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["grant_type"] = "refresh_token",
                        ["refresh_token"] = session.RefreshToken,
                    });
                    HttpResponseMessage response = await client.PostAsync(
                        $"https://securetoken.googleapis.com/v1/token?key={AuthService.FirebaseApiKey}", body);
                    string text = await response.Content.ReadAsStringAsync();
                    if (!response.IsSuccessStatusCode)
                    {
                        return null;
                    }

                    JsonObject json = JsonObject.Parse(text);
                    string idToken = json.ContainsKey("id_token") ? json["id_token"].GetString() : null;
                    int expiresIn = json.ContainsKey("expires_in") && int.TryParse(json["expires_in"].GetString(), out int e) ? e : 3600;
                    if (string.IsNullOrEmpty(idToken))
                    {
                        return null;
                    }
                    SessionService.UpdateTokens(idToken, expiresIn);
                    return idToken;
                }
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
