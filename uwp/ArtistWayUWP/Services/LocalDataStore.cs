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
            await WriteStoreAsync(SettingsFile, settings);
        }

        // ---------- morning pages ----------

        public static async Task<bool> ToggleMorningPageAsync(string dateStr)
        {
            JsonObject store = await ReadStoreAsync(MorningPagesFile);
            bool current = store.ContainsKey(dateStr) && store[dateStr].GetBoolean();
            bool next = !current;
            store[dateStr] = JsonValue.CreateBooleanValue(next);
            await WriteStoreAsync(MorningPagesFile, store);
            await TouchActivityAsync();
            return next;
        }

        public static async Task<Dictionary<string, bool>> GetAllMorningPagesAsync()
        {
            JsonObject store = await ReadStoreAsync(MorningPagesFile);
            Dictionary<string, bool> result = new Dictionary<string, bool>();
            foreach (KeyValuePair<string, IJsonValue> kv in store)
            {
                result[kv.Key] = kv.Value.GetBoolean();
            }
            return result;
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
            };
            store[weekStart] = entry;
            await WriteStoreAsync(ArtistDatesFile, store);
        }

        // ---------- checklist ----------

        private static string ChecklistKey(int weekId, int itemIndex) => $"w{weekId}-i{itemIndex}";

        public static async Task<bool> ToggleChecklistItemAsync(int weekId, int itemIndex)
        {
            JsonObject store = await ReadStoreAsync(ChecklistFile);
            string key = ChecklistKey(weekId, itemIndex);
            bool current = store.ContainsKey(key) && store[key].GetBoolean();
            bool next = !current;
            store[key] = JsonValue.CreateBooleanValue(next);
            await WriteStoreAsync(ChecklistFile, store);
            await TouchActivityAsync();
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
                if (kv.Key.StartsWith(prefix) && kv.Value.GetBoolean())
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
