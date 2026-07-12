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
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadAsync();
        }

        private async Task LoadAsync()
        {
            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            _weekId = WeekCalculator.GetCurrentWeekId(profile);
            _weekKey = WeekCalculator.WeekKeyForOffset(profile, _weekId);
            SubText.Text = $"semana {_weekId}";

            _current = await LocalDataStore.GetArtistDateAsync(_weekKey) ?? new ArtistDateEntry();
            UpdateSummary();
        }

        private void UpdateSummary()
        {
            SummaryIdeaText.Text = string.IsNullOrWhiteSpace(_current.Idea)
                ? "Nenhuma ideia registrada ainda pra essa semana."
                : _current.Idea;
            MarkDoneButton.Content = _current.Done
                ? "✓ Artist Date dessa semana feito"
                : "Marcar como feito essa semana";
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
                    "Artist Date",
                    "Um encontro solo, só por prazer, para encher o poço criativo. Companheiro The Artist's Way.",
                    weekday,
                    time,
                    90,
                    UiHelper.GetElementRect((FrameworkElement)sender));
            }
        }

    }
}
