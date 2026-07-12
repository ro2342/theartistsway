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

        // Atalho pra ler UiStrings (www/js/data.js -> UI_STRINGS) com uma
        // rede de segurança: se a chave não existir no content.json (nunca
        // deveria acontecer, mas evita um crash bobo), devolve a própria
        // chave em vez de estourar exceção.
        public static string S(string key)
        {
            return Content != null && Content.UiStrings.ContainsKey(key) ? Content.UiStrings[key] : key;
        }

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

            if (root.ContainsKey("uiStrings"))
            {
                JsonObject uiStringsObj = root.GetNamedObject("uiStrings");
                foreach (string key in uiStringsObj.Keys)
                {
                    content.UiStrings[key] = uiStringsObj.GetNamedString(key);
                }
            }

            foreach (JsonValue toolValue in root.GetNamedArray("toolConfigs", new JsonArray()))
            {
                JsonObject toolObj = toolValue.GetObject();
                NamedListConfig tool = new NamedListConfig
                {
                    ListName = toolObj.GetNamedString("listName"),
                    Title = toolObj.GetNamedString("title"),
                    Subtitle = toolObj.GetNamedString("subtitle"),
                    Singleton = toolObj.ContainsKey("singleton") && toolObj.GetNamedBoolean("singleton"),
                };
                foreach (JsonValue fieldValue in toolObj.GetNamedArray("fields"))
                {
                    JsonObject fieldObj = fieldValue.GetObject();
                    tool.Fields.Add(new ListFieldConfig
                    {
                        Key = fieldObj.GetNamedString("key"),
                        Label = fieldObj.GetNamedString("label"),
                        Multiline = fieldObj.ContainsKey("multiline") && fieldObj.GetNamedBoolean("multiline"),
                    });
                }
                content.ToolConfigs.Add(tool);
            }

            foreach (JsonValue quizValue in root.GetNamedArray("quizConfigs", new JsonArray()))
            {
                JsonObject quizObj = quizValue.GetObject();
                QuizConfig quiz = new QuizConfig
                {
                    Key = quizObj.GetNamedString("key"),
                    Title = quizObj.GetNamedString("title"),
                    Subtitle = quizObj.GetNamedString("subtitle"),
                };
                foreach (JsonValue questionValue in quizObj.GetNamedArray("questions"))
                {
                    JsonObject questionObj = questionValue.GetObject();
                    QuizQuestion question = new QuizQuestion { Text = questionObj.GetNamedString("text") };
                    foreach (JsonValue optionValue in questionObj.GetNamedArray("options"))
                    {
                        JsonObject optionObj = optionValue.GetObject();
                        question.Options.Add(new QuizOption
                        {
                            Label = optionObj.GetNamedString("label"),
                            Value = optionObj.GetNamedNumber("value"),
                        });
                    }
                    quiz.Questions.Add(question);
                }
                foreach (JsonValue bandValue in quizObj.GetNamedArray("bands"))
                {
                    JsonObject bandObj = bandValue.GetObject();
                    quiz.Bands.Add(new QuizBand
                    {
                        Min = bandObj.GetNamedNumber("min"),
                        Max = bandObj.GetNamedNumber("max"),
                        Label = bandObj.GetNamedString("label"),
                        Description = bandObj.GetNamedString("description"),
                    });
                }
                content.QuizConfigs.Add(quiz);
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
