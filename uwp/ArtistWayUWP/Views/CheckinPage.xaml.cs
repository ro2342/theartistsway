using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class CheckinPage : Page
    {
        private int _weekId;
        private readonly List<TextBox> _answerBoxes = new List<TextBox>();

        public CheckinPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _weekId = e.Parameter is int id ? id : 1;
            _ = LoadAsync();
        }

        private async Task LoadAsync()
        {
            WeekContent week = ContentStore.Content.Weeks.FirstOrDefault(w => w.Id == _weekId);
            HeaderText.Text = $"Check-in — Semana {_weekId}";

            List<string> questions = new List<string>(ContentStore.Content.CheckinCoreQuestions);
            if (week != null)
            {
                questions.Add(week.CheckinBonus);
            }

            CheckinEntry existing = await LocalDataStore.GetCheckinAsync(_weekId);

            QuestionsPanel.Children.Clear();
            _answerBoxes.Clear();
            for (int i = 0; i < questions.Count; i++)
            {
                TextBlock label = new TextBlock
                {
                    Text = questions[i],
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, i == 0 ? 0 : 16, 0, 6),
                };
                TextBox box = new TextBox
                {
                    AcceptsReturn = true,
                    TextWrapping = TextWrapping.Wrap,
                    Height = 96,
                    Tag = i.ToString(),
                };
                if (existing != null && existing.Answers.TryGetValue(i.ToString(), out string ans))
                {
                    box.Text = ans;
                }
                QuestionsPanel.Children.Add(label);
                QuestionsPanel.Children.Add(box);
                _answerBoxes.Add(box);
            }
        }

        private async void Save_Click(object sender, RoutedEventArgs e)
        {
            Dictionary<string, string> answers = new Dictionary<string, string>();
            foreach (TextBox box in _answerBoxes)
            {
                answers[(string)box.Tag] = box.Text;
            }
            await LocalDataStore.SaveCheckinAsync(_weekId, answers);
            MainPage.Current.NavigateToTab(typeof(HomePage));
        }
    }
}
