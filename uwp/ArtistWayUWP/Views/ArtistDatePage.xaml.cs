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
        private readonly DispatcherTimer _saveDebounceTimer;
        private bool _loaded;

        public ArtistDatePage()
        {
            this.InitializeComponent();
            _saveDebounceTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(700) };
            _saveDebounceTimer.Tick += SaveDebounceTimer_Tick;
            IdeaBox.TextChanged += IdeaBox_TextChanged;
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadAsync();
        }

        protected override void OnNavigatedFrom(NavigationEventArgs e)
        {
            base.OnNavigatedFrom(e);
            // Garante que a ideia digitada não se perde ao trocar de aba,
            // mesmo se o usuário nunca marcar "feito" -- planejar com
            // antecedência é um uso legítimo, não só registrar depois.
            _saveDebounceTimer.Stop();
            _ = SaveIdeaAsync();
        }

        private async Task LoadAsync()
        {
            _loaded = false;
            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            _weekId = WeekCalculator.GetCurrentWeekId(profile);
            _weekKey = WeekCalculator.WeekKeyForOffset(profile, _weekId);
            SubText.Text = $"semana {_weekId}";

            _current = await LocalDataStore.GetArtistDateAsync(_weekKey) ?? new ArtistDateEntry();
            IdeaBox.Text = _current.Idea ?? "";
            UpdateMarkButton();
            _loaded = true;
        }

        private void IdeaBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (!_loaded)
            {
                return;
            }
            _saveDebounceTimer.Stop();
            _saveDebounceTimer.Start();
        }

        private async void SaveDebounceTimer_Tick(object sender, object e)
        {
            _saveDebounceTimer.Stop();
            await SaveIdeaAsync();
        }

        private async Task SaveIdeaAsync()
        {
            if (_current == null || string.IsNullOrEmpty(_weekKey))
            {
                return;
            }
            _current.Idea = IdeaBox.Text;
            await LocalDataStore.SetArtistDateAsync(_weekKey, _current);
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
            _saveDebounceTimer.Stop();
            _current.Done = !_current.Done;
            await SaveIdeaAsync();
            UpdateMarkButton();
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
