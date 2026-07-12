using System;
using System.Collections.Generic;
using System.Linq;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class HomePage : Page
    {
        private int _weekId = 1;

        public HomePage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadAsync();
        }

        private async System.Threading.Tasks.Task LoadAsync()
        {
            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            if (profile == null)
            {
                return;
            }

            int weekId = WeekCalculator.GetCurrentWeekId(profile);
            _weekId = weekId;
            WeekContent week = ContentStore.Content.Weeks.FirstOrDefault(w => w.Id == weekId);
            string weekKey = WeekCalculator.WeekKeyForOffset(profile, weekId);

            GreetingText.Text = string.IsNullOrEmpty(profile.Name)
                ? "seu companheiro de jornada"
                : $"Olá, {profile.Name}";

            WeekLabelText.Text = $"Semana {weekId} de 12";
            WeekTitleText.Text = week?.Title ?? "";
            WeekIntroText.Text = week?.Intro ?? "";

            HashSet<int> doneIndexes = await LocalDataStore.GetDoneChecklistIndexesAsync(weekId);
            int totalItems = week?.Checklist.Count ?? 0;
            int doneCount = doneIndexes.Count(idx => idx < totalItems);
            int pct = totalItems > 0 ? (int)Math.Round(100.0 * doneCount / totalItems) : 0;
            WeekProgressBar.Value = pct;
            WeekProgressLabel.Text = $"{doneCount}/{totalItems} tarefas dessa semana concluídas";

            Dictionary<string, bool> allMp = await LocalDataStore.GetAllMorningPagesAsync();
            StreakPanel.Children.Clear();
            string[] weekdayLetters = { "D", "S", "T", "Q", "Q", "S", "S" };
            DateTime today = DateTime.Now.Date;
            bool todayDone = false;
            for (int i = 6; i >= 0; i--)
            {
                DateTime d = today.AddDays(-i);
                string key = WeekCalculator.DateToStr(d);
                bool done = allMp.ContainsKey(key) && allMp[key];
                if (i == 0)
                {
                    todayDone = done;
                }

                Border dot = new Border { Style = (Style)Resources["StreakDotStyle"] };
                if (done)
                {
                    dot.Background = ThemeHelper.AccentBrush();
                    dot.BorderThickness = new Thickness(0);
                }
                dot.Child = new TextBlock
                {
                    Text = weekdayLetters[(int)d.DayOfWeek],
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    FontSize = 12,
                };
                StreakPanel.Children.Add(dot);
            }

            ToggleMpButton.Content = todayDone ? "✓ Páginas de hoje feitas" : "Marcar páginas de hoje como feitas";

            List<string> affirmations = ContentStore.Content.Affirmations;
            if (affirmations.Count > 0)
            {
                // Mesmo cálculo do PWA (dia do ano) -- mostra a mesma frase
                // nos dois aparelhos no mesmo dia, sem precisar sincronizar
                // nada novo pra isso.
                int index = DateTime.Now.DayOfYear % affirmations.Count;
                AffirmationText.Text = affirmations[index];
            }

            ArtistDateEntry artistDate = await LocalDataStore.GetArtistDateAsync(weekKey);
            bool adDone = artistDate?.Done ?? false;
            ArtistDateStatusText.Text = adDone
                ? "Feito — " + (artistDate?.Idea ?? "")
                : "Ainda não rolou essa semana.";
            OpenArtistDateButton.Content = adDone ? "Ver / trocar" : "Planejar meu Artist Date";

            DateTimeOffset? lastActivity = await LocalDataStore.GetLastActivityAsync();
            bool showNudge = lastActivity.HasValue && (DateTimeOffset.UtcNow - lastActivity.Value).TotalDays >= 3;
            RoadRulesNudgeCard.Visibility = showNudge ? Visibility.Visible : Visibility.Collapsed;
        }

        private void OpenWeek_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(WeekDetailPage), _weekId);
        }

        private async void ToggleMp_Click(object sender, RoutedEventArgs e)
        {
            await LocalDataStore.ToggleMorningPageAsync(WeekCalculator.DateToStr(DateTime.Now.Date));
            await LoadAsync();
        }

        private void OpenArtistDate_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.NavigateToTab(typeof(ArtistDatePage));
        }

        private void OpenCheckin_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(CheckinPage), _weekId);
        }

        private void OpenRoadRules_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(RegrasDaEstradaPage));
        }
    }
}
