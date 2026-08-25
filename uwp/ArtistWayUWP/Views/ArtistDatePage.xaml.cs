using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class ArtistDatePage : Page
    {
        private int _weekId;
        private string _weekKey;
        private ArtistDateEntry _current;
        private readonly Random _rand = new Random();
        private readonly List<int> _usedIdeas = new List<int>();

        public ArtistDatePage()
        {
            this.InitializeComponent();
            DescriptionText.Text = ContentStore.S("artistDate.description");
            SummaryTitleText.Text = ContentStore.S("artistDate.summaryTitle");
            EditButton.Content = ContentStore.S("artistDate.editButton");
            IdeaBox.PlaceholderText = ContentStore.S("artistDate.ideaPlaceholder");
            ShuffleText.Text = ContentStore.S("artistDate.shuffleButton");
            SaveDateButton.Content = ContentStore.S("artistDate.saveButton");
            CancelEditButton.Content = ContentStore.S("common.cancel");
            AddCalendarButton.Content = ContentStore.S("artistDate.addWindowsCalendarButton");
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadAsync();
        }

        private async Task LoadAsync()
        {
            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            _weekId = WeekCalculator.GetWeekCursor(profile).WeekId;
            _weekKey = WeekCalculator.WeekKeyForOffset(profile, _weekId);
            SubText.Text = ContentStore.S("artistDate.weekLabel", "week", _weekId.ToString());

            _current = await LocalDataStore.GetArtistDateAsync(_weekKey) ?? new ArtistDateEntry();
            UpdateSummary();
        }

        private void UpdateSummary()
        {
            SummaryIdeaText.Text = string.IsNullOrWhiteSpace(_current.Idea)
                ? ContentStore.S("artistDate.noIdeaYet")
                : _current.Idea;
            MarkDoneButton.Content = _current.Done
                ? ContentStore.S("artistDate.doneButton")
                : ContentStore.S("artistDate.markDoneButton");
        }

        private void Shuffle_Click(object sender, RoutedEventArgs e)
        {
            List<string> ideas = ContentStore.Content.ArtistDateIdeas;
            if (ideas.Count == 0)
            {
                return;
            }
            if (_usedIdeas.Count >= ideas.Count)
            {
                _usedIdeas.Clear();
            }
            int idx;
            do
            {
                idx = _rand.Next(ideas.Count);
            } while (_usedIdeas.Contains(idx));
            _usedIdeas.Add(idx);
            IdeaBox.Text = ideas[idx];
        }

        private void Edit_Click(object sender, RoutedEventArgs e)
        {
            IdeaBox.Text = _current.Idea ?? "";
            SummaryCard.Visibility = Visibility.Collapsed;
            EditPanel.Visibility = Visibility.Visible;
        }

        private void CancelEdit_Click(object sender, RoutedEventArgs e)
        {
            EditPanel.Visibility = Visibility.Collapsed;
            SummaryCard.Visibility = Visibility.Visible;
        }

        private async void SaveDate_Click(object sender, RoutedEventArgs e)
        {
            _current.Idea = IdeaBox.Text;
            await LocalDataStore.SetArtistDateAsync(_weekKey, _current);
            UpdateSummary();
            EditPanel.Visibility = Visibility.Collapsed;
            SummaryCard.Visibility = Visibility.Visible;
        }

        private async void MarkDone_Click(object sender, RoutedEventArgs e)
        {
            _current.Done = !_current.Done;
            await LocalDataStore.SetArtistDateAsync(_weekKey, _current);
            UpdateSummary();
        }

        private async void AddNativeCalendar_Click(object sender, RoutedEventArgs e)
        {
            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            if (profile == null || !int.TryParse(profile.ArtistDateDay, out int weekday))
            {
                weekday = 7;
            }
            if (TimeSpan.TryParse(profile?.ArtistDateTime ?? "16:00", out TimeSpan time))
            {
                await AppointmentService.AddWeeklyAsync(
                    ContentStore.S("artistDate.calendarEventTitle"),
                    ContentStore.S("artistDate.calendarEventDescription"),
                    weekday,
                    time,
                    90,
                    UiHelper.GetElementRect((FrameworkElement)sender));
            }
        }

    }
}
