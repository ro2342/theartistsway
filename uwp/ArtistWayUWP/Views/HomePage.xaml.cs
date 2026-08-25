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
            string dayCountLabel = dayCount.HasValue
                ? ContentStore.S("home.greeting.dayCount", ("day", Math.Max(1, dayCount.Value).ToString()), ("total", WeekCalculator.ProgramLengthDays.ToString()))
                : null;
            GreetingText.Text = dayCountLabel
                ?? (string.IsNullOrEmpty(profile.Name) ? ContentStore.S("home.greeting.default") : ContentStore.S("home.greeting.withName", ("name", profile.Name)));

            bool maintenanceMode = profile.MaintenanceMode || WeekCalculator.IsProgramFinished(profile);
            MaintenanceCard.Visibility = maintenanceMode ? Visibility.Visible : Visibility.Collapsed;
            WeekCard.Visibility = maintenanceMode ? Visibility.Collapsed : Visibility.Visible;
            CheckinNudgeCard.Visibility = maintenanceMode ? Visibility.Collapsed : Visibility.Visible;
            MaintenanceTitleText.Text = ContentStore.S("home.maintenance.title");
            MaintenanceDescriptionText.Text = ContentStore.S("home.maintenance.description");

            bool cyclePending = !maintenanceMode && WeekCalculator.IsWeekCyclePending(cursor);
            WeekDecisionCard.Visibility = cyclePending ? Visibility.Visible : Visibility.Collapsed;
            if (cyclePending)
            {
                WeekSummary summary = await LocalDataStore.BuildWeekSummaryAsync(profile, cursor);
                WeekDecisionTitleText.Text = ContentStore.S("home.weekCycle.title", ("week", cursor.WeekId.ToString()));
                WeekDecisionSummaryText.Text = ContentStore.S(
                    "home.weekCycle.summary",
                    ("done", summary.DoneCount.ToString()),
                    ("total", summary.TotalItems.ToString()),
                    ("mp", summary.MorningPagesDone.ToString()),
                    ("adStatus", ContentStore.S(summary.ArtistDateDone ? "status.done" : "status.notDone")),
                    ("ciStatus", ContentStore.S(summary.CheckinDone ? "status.done" : "status.notDone")));
                StayWeekButton.Content = ContentStore.S("home.weekCycle.stayButton", ("week", cursor.WeekId.ToString()));
                _advanceMeansFinish = cursor.WeekId >= 12;
                AdvanceWeekButton.Content = _advanceMeansFinish
                    ? ContentStore.S("home.weekCycle.finishButton")
                    : ContentStore.S("home.weekCycle.advanceButton", ("week", (cursor.WeekId + 1).ToString()));
            }

            WeekLabelText.Text = ContentStore.S("home.week.label", ("week", weekId.ToString()));
            WeekTitleText.Text = week?.Title ?? "";
            WeekIntroText.Text = week?.Intro ?? "";
            OpenWeekButton.Content = ContentStore.S("home.week.openButton");

            HashSet<int> doneIndexes = await LocalDataStore.GetDoneChecklistIndexesAsync(weekId);
            int totalItems = week?.Checklist.Count ?? 0;
            int doneCount = doneIndexes.Count(idx => idx < totalItems);
            int pct = totalItems > 0 ? (int)Math.Round(100.0 * doneCount / totalItems) : 0;
            WeekProgressBar.Value = pct;
            WeekProgressLabel.Text = ContentStore.S("home.week.progress", ("done", doneCount.ToString()), ("total", totalItems.ToString()));

            MorningPagesTitleText.Text = ContentStore.S("home.morningPages.title");
            MorningPagesThisWeekText.Text = ContentStore.S("home.morningPages.thisWeek");
            MorningPagesHintText.Text = ContentStore.S("home.morningPages.hint");
            AffirmationLabelText.Text = ContentStore.S("home.affirmation.label");
            ArtistDateTitleText.Text = ContentStore.S("home.artistDate.title");
            CheckinPromptText.Text = ContentStore.S("home.checkin.prompt");
            OpenCheckinButton.Content = ContentStore.S("home.checkin.button", ("week", weekId.ToString()));
            RoadRulesPromptText.Text = ContentStore.S("home.roadRulesNudge.prompt");
            OpenRoadRulesButton.Content = ContentStore.S("home.roadRulesNudge.button");

            Dictionary<string, bool> allMp = await LocalDataStore.GetAllMorningPagesAsync();
            StreakPanel.Children.Clear();
            string[] weekdayLetters = ContentStore.S("home.morningPages.weekdayLetters").Split(',');
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

                // Bolinha tocável pra qualquer dia até hoje (não só "hoje")
                // — dá pra fazer check-in retroativo de um dia esquecido,
                // sem precisar de tela própria só pra isso. Dias futuros
                // ficam esmaecidos e sem toque (não dá pra marcar um dia
                // que ainda não aconteceu).
                if (d <= today)
                {
                    dot.Tapped += async (s, e) =>
                    {
                        await LocalDataStore.ToggleMorningPageAsync(key);
                        await LoadAsync();
                        await TileService.UpdateAsync();
                    };
                }
                else
                {
                    dot.Opacity = 0.4;
                }
                StreakPanel.Children.Add(dot);
            }

            ToggleMpButton.Content = todayDone ? ContentStore.S("home.morningPages.toggleOff") : ContentStore.S("home.morningPages.toggleOn");

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
                ? ContentStore.S("home.artistDate.doneSummary", ("idea", artistDate?.Idea ?? ""))
                : ContentStore.S("home.artistDate.notDoneSummary");
            OpenArtistDateButton.Content = adDone ? ContentStore.S("home.artistDate.viewButton") : ContentStore.S("home.artistDate.planButton");

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
