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
        private ProfileSettings _profile;
        private WeekCursor _cursor;
        private bool _advanceMeansFinish;

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

            _profile = profile;
            WeekCursor cursor = await LocalDataStore.GetOrSeedWeekCursorAsync(profile);
            _cursor = cursor;
            int weekId = cursor.WeekId;
            _weekId = weekId;
            WeekContent week = ContentStore.Content.Weeks.FirstOrDefault(w => w.Id == weekId);
            string weekKey = WeekCalculator.WeekKeyForOffset(profile, weekId);

            int? dayCount = WeekCalculator.GetDayCount(profile);
            string dayCountLabel = dayCount.HasValue ? $"Dia {Math.Max(1, dayCount.Value)} de {WeekCalculator.ProgramLengthDays}" : null;
            GreetingText.Text = dayCountLabel
                ?? (string.IsNullOrEmpty(profile.Name) ? "seu companheiro de jornada" : $"Olá, {profile.Name}");

            bool maintenanceMode = profile.MaintenanceMode || WeekCalculator.IsProgramFinished(profile);
            MaintenanceCard.Visibility = maintenanceMode ? Visibility.Visible : Visibility.Collapsed;
            WeekCard.Visibility = maintenanceMode ? Visibility.Collapsed : Visibility.Visible;
            CheckinNudgeCard.Visibility = maintenanceMode ? Visibility.Collapsed : Visibility.Visible;

            bool cyclePending = !maintenanceMode && WeekCalculator.IsWeekCyclePending(cursor);
            WeekDecisionCard.Visibility = cyclePending ? Visibility.Visible : Visibility.Collapsed;
            if (cyclePending)
            {
                WeekSummary summary = await LocalDataStore.BuildWeekSummaryAsync(profile, cursor);
                WeekDecisionTitleText.Text = $"A Semana {cursor.WeekId} completou os 7 dias";
                WeekDecisionSummaryText.Text =
                    $"{summary.DoneCount}/{summary.TotalItems} tarefas concluídas · Morning Pages em {summary.MorningPagesDone}/7 dias · " +
                    $"Artist Date {(summary.ArtistDateDone ? "feito" : "não feito")} · check-in {(summary.CheckinDone ? "feito" : "não feito")}.";
                StayWeekButton.Content = $"Continuar na Semana {cursor.WeekId}";
                _advanceMeansFinish = cursor.WeekId >= 12;
                AdvanceWeekButton.Content = _advanceMeansFinish ? "Concluir o programa" : $"Ir para a Semana {cursor.WeekId + 1}";
            }

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
            DateTime weekStart = WeekCalculator.CurrentStreakWeekStart(profile, today);
            bool todayDone = false;
            for (int i = 0; i <= 6; i++)
            {
                DateTime d = weekStart.AddDays(i);
                string key = WeekCalculator.DateToStr(d);
                bool done = allMp.ContainsKey(key) && allMp[key];
                if (d == today)
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
                // Mesmo cálculo do PWA (dia do ano) — mostra a mesma frase
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
            bool showNudge = !maintenanceMode && lastActivity.HasValue && (DateTimeOffset.UtcNow - lastActivity.Value).TotalDays >= 3;
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
            await TileService.UpdateAsync();
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

        private async void StayWeek_Click(object sender, RoutedEventArgs e)
        {
            if (_profile == null)
            {
                return;
            }
            await LocalDataStore.DecideWeekCycleAsync(_profile, advance: false);
            await LoadAsync();
            await TileService.UpdateAsync();
        }

        private async void AdvanceWeek_Click(object sender, RoutedEventArgs e)
        {
            if (_profile == null)
            {
                return;
            }
            if (_advanceMeansFinish)
            {
                _profile.MaintenanceMode = true;
                await LocalDataStore.SetProfileAsync(_profile);
            }
            else
            {
                await LocalDataStore.DecideWeekCycleAsync(_profile, advance: true);
            }
            await LoadAsync();
            await TileService.UpdateAsync();
        }
    }
}
