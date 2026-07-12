using System;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using Windows.Data.Json;
using Windows.Storage;

namespace ArtistWayUWP.Services
{
    // Carrega Data/content.json (gerado a partir de www/js/data.js) uma
    // única vez na inicialização do app e expõe o conteúdo já tipado.
    public static class ContentStore
    {
        public static AppContent Content { get; private set; }

        public static async Task InitializeAsync()
        {
            if (Content != null)
            {
                return;
            }

            StorageFile file = await StorageFile.GetFileFromApplicationUriAsync(
                new Uri("ms-appx:///Data/content.json"));
            string text = await FileIO.ReadTextAsync(file);
            JsonObject root = JsonObject.Parse(text);

            AppContent content = new AppContent
            {
                CheckinCoreQuestions = ReadStringArray(root, "checkinCoreQuestions"),
                ArtistDateIdeas = ReadStringArray(root, "artistDateIdeas"),
                RoadRules = ReadStringArray(root, "roadRules"),
                BasicPrinciples = ReadStringArray(root, "basicPrinciples"),
                Affirmations = ReadStringArray(root, "affirmations"),
            };

            if (root.ContainsKey("beliefTable"))
            {
                foreach (JsonValue pairValue in root.GetNamedArray("beliefTable"))
                {
                    JsonObject pairObj = pairValue.GetObject();
                    content.BeliefTable.Add(new BeliefPair
                    {
                        Negative = pairObj.GetNamedString("negative"),
                        Positive = pairObj.GetNamedString("positive"),
                    });
                }
            }

            foreach (JsonValue weekValue in root.GetNamedArray("weeks"))
            {
                JsonObject weekObj = weekValue.GetObject();
                WeekContent week = new WeekContent
                {
                    Id = (int)weekObj.GetNamedNumber("id"),
                    Title = weekObj.GetNamedString("title"),
                    Intro = weekObj.GetNamedString("intro"),
                    CheckinBonus = weekObj.GetNamedString("checkinBonus"),
                    Essay = ReadStringArray(weekObj, "essay"),
                };

                foreach (JsonValue itemValue in weekObj.GetNamedArray("checklist"))
                {
                    JsonObject itemObj = itemValue.GetObject();
                    week.Checklist.Add(new ChecklistItem
                    {
                        Task = itemObj.GetNamedString("task"),
                        Detail = itemObj.GetNamedString("detail"),
                    });
                }

                content.Weeks.Add(week);
            }

            Content = content;
        }

        private static System.Collections.Generic.List<string> ReadStringArray(JsonObject obj, string key)
        {
            System.Collections.Generic.List<string> result = new System.Collections.Generic.List<string>();
            if (!obj.ContainsKey(key))
            {
                return result;
            }
            foreach (JsonValue value in obj.GetNamedArray(key))
            {
                result.Add(value.GetString());
            }
            return result;
        }
    }
}
