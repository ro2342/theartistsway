using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using Windows.Data.Json;
using Windows.Storage;

namespace ArtistWayUWP.Services
{
    // Substitui a IndexedDB do PWA (www/js/db.js) por arquivos JSON dentro
    // de ApplicationData.Current.LocalFolder -- um arquivo por "store", no
    // mesmo desenho de STORES em db.js. Isso deixa export/import de backup
    // trivial: é literalmente empacotar/desempacotar esses arquivos.
    public static class LocalDataStore
    {
        private const string SettingsFile = "settings.json";
        private const string MorningPagesFile = "morningPages.json";
        private const string ArtistDatesFile = "artistDates.json";
        private const string ChecklistFile = "checklist.json";
        private const string CheckinsFile = "checkins.json";

        // ---------- infraestrutura ----------

        private static async Task<JsonObject> ReadStoreAsync(string fileName)
        {
            try
            {
                StorageFile file = await ApplicationData.Current.LocalFolder.GetFileAsync(fileName);
                string text = await FileIO.ReadTextAsync(file);
                if (string.IsNullOrWhiteSpace(text))
                {
                    return new JsonObject();
                }
                return JsonObject.Parse(text);
            }
            catch (FileNotFoundException)
            {
                return new JsonObject();
            }
        }

        private static async Task WriteStoreAsync(string fileName, JsonObject obj)
        {
            StorageFile file = await ApplicationData.Current.LocalFolder.CreateFileAsync(
                fileName, CreationCollisionOption.ReplaceExisting);
            await FileIO.WriteTextAsync(file, obj.Stringify());
        }

        // ---------- atividade (pro lembrete de Regras da Estrada) ----------

        public static async Task TouchActivityAsync()
        {
            JsonObject settings = await ReadStoreAsync(SettingsFile);
            settings["lastActivityAt"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.ToString("o"));
            await WriteStoreAsync(SettingsFile, settings);
        }

        public static async Task<DateTimeOffset?> GetLastActivityAsync()
        {
            JsonObject settings = await ReadStoreAsync(SettingsFile);
            if (settings.ContainsKey("lastActivityAt") && DateTimeOffset.TryParse(
                settings["lastActivityAt"].GetString(), out DateTimeOffset result))
            {
                return result;
            }
            return null;
        }

        // ---------- perfil ----------

        public static async Task<ProfileSettings> GetProfileAsync()
        {
            JsonObject settings = await ReadStoreAsync(SettingsFile);
            if (!settings.ContainsKey("profile"))
            {
                return null;
            }
            JsonObject p = settings["profile"].GetObject();
            return new ProfileSettings
            {
                Name = GetStringOrDefault(p, "name", ""),
                StartDate = GetStringOrDefault(p, "startDate", ""),
                MorningPagesTime = GetStringOrDefault(p, "morningPagesTime", "07:00"),
                ArtistDateDay = GetStringOrDefault(p, "artistDateDay", "7"),
                ArtistDateTime = GetStringOrDefault(p, "artistDateTime", "16:00"),
                CheckinDay = GetStringOrDefault(p, "checkinDay", "7"),
                CheckinTime = GetStringOrDefault(p, "checkinTime", "19:00"),
                Onboarded = p.ContainsKey("onboarded") && p["onboarded"].GetBoolean(),
                FontSize = GetStringOrDefault(p, "fontSize", "medium"),
            };
        }

        public static async Task SetProfileAsync(ProfileSettings profile)
        {
            JsonObject settings = await ReadStoreAsync(SettingsFile);
            JsonObject p = new JsonObject
            {
                ["name"] = JsonValue.CreateStringValue(profile.Name ?? ""),
                ["startDate"] = JsonValue.CreateStringValue(profile.StartDate ?? ""),
                ["morningPagesTime"] = JsonValue.CreateStringValue(profile.MorningPagesTime ?? ""),
                ["artistDateDay"] = JsonValue.CreateStringValue(profile.ArtistDateDay ?? ""),
                ["artistDateTime"] = JsonValue.CreateStringValue(profile.ArtistDateTime ?? ""),
                ["checkinDay"] = JsonValue.CreateStringValue(profile.CheckinDay ?? ""),
                ["checkinTime"] = JsonValue.CreateStringValue(profile.CheckinTime ?? ""),
                ["onboarded"] = JsonValue.CreateBooleanValue(profile.Onboarded),
                ["fontSize"] = JsonValue.CreateStringValue(profile.FontSize ?? "medium"),
            };
            settings["profile"] = p;
            // Carimba o blob inteiro de settings -- é o que o SyncService usa
            // pra decidir, na hora de mesclar com a nuvem, qual cópia (local
            // ou remota) é mais recente (ver Services/SyncService.cs).
            settings["_updatedAt"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.ToString("o"));
            await WriteStoreAsync(SettingsFile, settings);
            SyncScheduler.ScheduleSync();
        }

        // ---------- morning pages ----------

        public static async Task<bool> ToggleMorningPageAsync(string dateStr)
        {
            JsonObject store = await ReadStoreAsync(MorningPagesFile);
            bool current = ReadDoneFlag(store, dateStr);
            bool next = !current;
            store[dateStr] = new JsonObject
            {
                ["done"] = JsonValue.CreateBooleanValue(next),
                ["updatedAt"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.ToString("o")),
            };
            await WriteStoreAsync(MorningPagesFile, store);
            await TouchActivityAsync();
            SyncScheduler.ScheduleSync();
            return next;
        }

        public static async Task<Dictionary<string, bool>> GetAllMorningPagesAsync()
        {
            JsonObject store = await ReadStoreAsync(MorningPagesFile);
            Dictionary<string, bool> result = new Dictionary<string, bool>();
            foreach (KeyValuePair<string, IJsonValue> kv in store)
            {
                if (kv.Key == "_updatedAt")
                {
                    continue;
                }
                result[kv.Key] = ReadDoneFlag(store, kv.Key);
            }
            return result;
        }

        // Lê o campo "done" de um registro, aceitando tanto o formato novo
        // ({ done, updatedAt }) quanto o booleano solto de versões antigas
        // do app (antes da sincronização existir) -- não precisa de
        // migração ativa, só compatibilidade na leitura.
        private static bool ReadDoneFlag(JsonObject store, string key)
        {
            if (!store.ContainsKey(key))
            {
                return false;
            }
            IJsonValue value = store[key];
            if (value.ValueType == JsonValueType.Boolean)
            {
                return value.GetBoolean();
            }
            JsonObject entry = value.GetObject();
            return entry.ContainsKey("done") && entry["done"].GetBoolean();
        }

        // ---------- artist date ----------

        public static async Task<ArtistDateEntry> GetArtistDateAsync(string weekStart)
        {
            JsonObject store = await ReadStoreAsync(ArtistDatesFile);
            if (!store.ContainsKey(weekStart))
            {
                return null;
            }
            JsonObject entry = store[weekStart].GetObject();
            return new ArtistDateEntry
            {
                Done = entry.ContainsKey("done") && entry["done"].GetBoolean(),
                Idea = GetStringOrDefault(entry, "idea", ""),
            };
        }

        public static async Task SetArtistDateAsync(string weekStart, ArtistDateEntry data)
        {
            JsonObject store = await ReadStoreAsync(ArtistDatesFile);
            JsonObject entry = new JsonObject
            {
                ["done"] = JsonValue.CreateBooleanValue(data.Done),
                ["idea"] = JsonValue.CreateStringValue(data.Idea ?? ""),
                ["updatedAt"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.ToString("o")),
            };
            store[weekStart] = entry;
            await WriteStoreAsync(ArtistDatesFile, store);
            SyncScheduler.ScheduleSync();
        }

        // ---------- checklist ----------

        private static string ChecklistKey(int weekId, int itemIndex) => $"w{weekId}-i{itemIndex}";

        public static async Task<bool> ToggleChecklistItemAsync(int weekId, int itemIndex)
        {
            JsonObject store = await ReadStoreAsync(ChecklistFile);
            string key = ChecklistKey(weekId, itemIndex);
            bool current = ReadDoneFlag(store, key);
            bool next = !current;
            store[key] = new JsonObject
            {
                ["done"] = JsonValue.CreateBooleanValue(next),
                ["updatedAt"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.ToString("o")),
            };
            await WriteStoreAsync(ChecklistFile, store);
            await TouchActivityAsync();
            SyncScheduler.ScheduleSync();
            return next;
        }

        // Retorna só os itemIndex marcados como concluídos pra essa semana.
        public static async Task<HashSet<int>> GetDoneChecklistIndexesAsync(int weekId)
        {
            JsonObject store = await ReadStoreAsync(ChecklistFile);
            HashSet<int> result = new HashSet<int>();
            string prefix = $"w{weekId}-i";
            foreach (KeyValuePair<string, IJsonValue> kv in store)
            {
                if (kv.Key.StartsWith(prefix) && ReadDoneFlag(store, kv.Key))
                {
                    if (int.TryParse(kv.Key.Substring(prefix.Length), out int idx))
                    {
                        result.Add(idx);
                    }
                }
            }
            return result;
        }

        // ---------- check-ins ----------

        public static async Task<CheckinEntry> GetCheckinAsync(int weekId)
        {
            JsonObject store = await ReadStoreAsync(CheckinsFile);
            string key = weekId.ToString();
            if (!store.ContainsKey(key))
            {
                return null;
            }
            JsonObject entry = store[key].GetObject();
            CheckinEntry result = new CheckinEntry
            {
                SavedAt = GetStringOrDefault(entry, "savedAt", ""),
            };
            if (entry.ContainsKey("answers"))
            {
                foreach (KeyValuePair<string, IJsonValue> kv in entry["answers"].GetObject())
                {
                    result.Answers[kv.Key] = kv.Value.GetString();
                }
            }
            return result;
        }

        public static async Task SaveCheckinAsync(int weekId, Dictionary<string, string> answers)
        {
            JsonObject store = await ReadStoreAsync(CheckinsFile);
            JsonObject answersObj = new JsonObject();
            foreach (KeyValuePair<string, string> kv in answers)
            {
                answersObj[kv.Key] = JsonValue.CreateStringValue(kv.Value ?? "");
            }
            JsonObject entry = new JsonObject
            {
                ["answers"] = answersObj,
                ["savedAt"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.ToString("o")),
            };
            store[weekId.ToString()] = entry;
            await WriteStoreAsync(CheckinsFile, store);
            SyncScheduler.ScheduleSync();
        }

        // ---------- backup: exportar/importar ----------

        public static async Task<string> ExportAllDataAsync()
        {
            JsonObject bundle = new JsonObject
            {
                ["exportedAt"] = JsonValue.CreateStringValue(DateTimeOffset.UtcNow.ToString("o")),
                ["settings"] = await ReadStoreAsync(SettingsFile),
                ["morningPages"] = await ReadStoreAsync(MorningPagesFile),
                ["artistDates"] = await ReadStoreAsync(ArtistDatesFile),
                ["checklist"] = await ReadStoreAsync(ChecklistFile),
                ["checkins"] = await ReadStoreAsync(CheckinsFile),
            };
            return bundle.Stringify();
        }

        public static async Task ImportAllDataAsync(string json)
        {
            JsonObject bundle = JsonObject.Parse(json);
            if (bundle.ContainsKey("settings"))
            {
                await WriteStoreAsync(SettingsFile, bundle["settings"].GetObject());
            }
            if (bundle.ContainsKey("morningPages"))
            {
                await WriteStoreAsync(MorningPagesFile, bundle["morningPages"].GetObject());
            }
            if (bundle.ContainsKey("artistDates"))
            {
                await WriteStoreAsync(ArtistDatesFile, bundle["artistDates"].GetObject());
            }
            if (bundle.ContainsKey("checklist"))
            {
                await WriteStoreAsync(ChecklistFile, bundle["checklist"].GetObject());
            }
            if (bundle.ContainsKey("checkins"))
            {
                await WriteStoreAsync(CheckinsFile, bundle["checkins"].GetObject());
            }
        }

        // ---------- resetar ----------

        // Apaga todos os dados do usuário do aparelho (perfil, Morning
        // Pages, Artist Dates, checklist, check-ins). Não afeta
        // Data/content.json (conteúdo do livro, empacotado no app).
        public static async Task ResetAllAsync()
        {
            string[] files = { SettingsFile, MorningPagesFile, ArtistDatesFile, ChecklistFile, CheckinsFile };
            foreach (string fileName in files)
            {
                try
                {
                    StorageFile file = await ApplicationData.Current.LocalFolder.GetFileAsync(fileName);
                    await file.DeleteAsync();
                }
                catch (FileNotFoundException)
                {
                    // já não existia -- nada a apagar.
                }
            }
        }

        // ---------- acesso genérico por nome (usado pelo SyncService) ----------

        public static readonly string[] SyncStoreNames = { "settings", "morningPages", "artistDates", "checklist", "checkins" };

        private static string FileNameFor(string storeName)
        {
            switch (storeName)
            {
                case "settings": return SettingsFile;
                case "morningPages": return MorningPagesFile;
                case "artistDates": return ArtistDatesFile;
                case "checklist": return ChecklistFile;
                case "checkins": return CheckinsFile;
                default: throw new ArgumentException("Store desconhecido: " + storeName);
            }
        }

        public static Task<JsonObject> GetStoreForSyncAsync(string storeName) => ReadStoreAsync(FileNameFor(storeName));

        public static Task WriteStoreForSyncAsync(string storeName, JsonObject obj) => WriteStoreAsync(FileNameFor(storeName), obj);

        // ---------- helpers ----------

        private static string GetStringOrDefault(JsonObject obj, string key, string fallback)
        {
            if (obj.ContainsKey(key) && obj[key].ValueType == JsonValueType.String)
            {
                return obj[key].GetString();
            }
            return fallback;
        }
    }
}
