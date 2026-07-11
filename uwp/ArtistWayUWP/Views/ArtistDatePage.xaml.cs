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
            IdeaBox.Text = _current.Idea ?? "";
            UpdateMarkButton();
        }

        private void UpdateMarkButton()
        {
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

        private async void MarkDone_Click(object sender, RoutedEventArgs e)
        {
            _current.Done = !_current.Done;
            _current.Idea = IdeaBox.Text;
            await LocalDataStore.SetArtistDateAsync(_weekKey, _current);
            UpdateMarkButton();
        }

        private async void AddCalendar_Click(object sender, RoutedEventArgs e)
        {
            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            if (profile == null || !int.TryParse(profile.ArtistDateDay, out int weekday))
            {
                weekday = 7;
            }
            string url = CalendarLinkService.ArtistDateUrl(weekday, profile?.ArtistDateTime ?? "16:00");
            await Windows.System.Launcher.LaunchUriAsync(new Uri(url));
        }
    }
}
