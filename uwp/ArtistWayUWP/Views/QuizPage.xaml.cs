using System.Collections.Generic;
using System.Linq;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    // Tela genérica de quiz, dirigida por QUIZ_CONFIGS (www/js/data.js ->
    // Data/content.json -> ContentStore.Content.QuizConfigs). O parâmetro
    // de navegação é a chave do quiz (string), mesmo padrão do
    // NamedListPage. Cada tentativa vira um item novo no store "lists"
    // (mesma chave do quiz, append-only) -- histórico de tentativas, igual
    // ao Life Pie.
    public sealed partial class QuizPage : Page
    {
        private QuizConfig _quiz;
        private readonly List<List<RadioButton>> _questionButtons = new List<List<RadioButton>>();

        public QuizPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            string key = e.Parameter as string;
            _quiz = ContentStore.Content.QuizConfigs.Find(q => q.Key == key);
            TitleText.Text = _quiz.Title;
            SubText.Text = _quiz.Subtitle;
            BuildQuestions();
            _ = LoadHistoryAsync();
        }

        private void BuildQuestions()
        {
            QuestionsPanel.Children.Clear();
            _questionButtons.Clear();

            for (int qi = 0; qi < _quiz.Questions.Count; qi++)
            {
                QuizQuestion question = _quiz.Questions[qi];
                string groupName = "quizQuestion" + qi;

                QuestionsPanel.Children.Add(new TextBlock
                {
                    Text = (qi + 1) + ". " + question.Text,
                    TextWrapping = TextWrapping.Wrap,
                    Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                    Margin = new Thickness(0, qi == 0 ? 0 : 16, 0, 4),
                });

                StackPanel optionsPanel = new StackPanel { Orientation = Orientation.Horizontal };
                List<RadioButton> buttons = new List<RadioButton>();
                foreach (QuizOption option in question.Options)
                {
                    RadioButton radio = new RadioButton
                    {
                        Content = option.Label,
                        GroupName = groupName,
                        Tag = option.Value,
                        Margin = new Thickness(0, 0, 12, 0),
                    };
                    optionsPanel.Children.Add(radio);
                    buttons.Add(radio);
                }
                QuestionsPanel.Children.Add(optionsPanel);
                _questionButtons.Add(buttons);
            }
        }

        private async void SeeResult_Click(object sender, RoutedEventArgs e)
        {
            double total = 0;
            foreach (List<RadioButton> buttons in _questionButtons)
            {
                RadioButton selected = buttons.Find(b => b.IsChecked == true);
                if (selected == null)
                {
                    ResultText.Text = "Responda todas as perguntas pra ver o resultado.";
                    return;
                }
                total += (double)selected.Tag;
            }

            QuizBand band = _quiz.Bands.Find(b => total >= b.Min && total <= b.Max) ?? _quiz.Bands.LastOrDefault();
            ResultText.Text = band != null
                ? $"{total} pontos — {band.Label}. {band.Description}"
                : $"{total} pontos.";

            Dictionary<string, string> fields = new Dictionary<string, string>
            {
                ["score"] = total.ToString(),
                ["bandLabel"] = band?.Label ?? "",
                ["date"] = System.DateTime.Now.ToString("yyyy-MM-dd"),
            };
            await LocalDataStore.AddListItemAsync(_quiz.Key, fields);
            await LoadHistoryAsync();
        }

        private async System.Threading.Tasks.Task LoadHistoryAsync()
        {
            List<NamedListItem> items = await LocalDataStore.GetListItemsAsync(_quiz.Key);
            items.Sort((a, b) => string.CompareOrdinal(a.UpdatedAt, b.UpdatedAt));

            HistoryPanel.Children.Clear();
            for (int i = items.Count - 1; i >= 0; i--)
            {
                NamedListItem item = items[i];
                string date = item.Fields.ContainsKey("date") ? item.Fields["date"] : "";
                string score = item.Fields.ContainsKey("score") ? item.Fields["score"] : "";
                string band = item.Fields.ContainsKey("bandLabel") ? item.Fields["bandLabel"] : "";
                HistoryPanel.Children.Add(new TextBlock
                {
                    Text = $"{date} — {score} pontos ({band})",
                    Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                    Opacity = 0.85,
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, 0, 0, 4),
                });
            }
            HistoryCard.Visibility = items.Count > 0 ? Visibility.Visible : Visibility.Collapsed;
        }
    }
}
