using System;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ArtistWayUWP.Views
{
    public sealed partial class OnboardingPage : Page
    {
        private static readonly string[] WeekdayNames =
            { "", "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado" };

        private int _step;
        private StackPanel[] _panels;

        public OnboardingPage()
        {
            this.InitializeComponent();
            _panels = new[] { WelcomePanel, NameDatePanel, RitualsPanel, FinishPanel };

            for (int i = 1; i <= 7; i++)
            {
                ArtistDateDayCombo.Items.Add(new ComboBoxItem { Content = WeekdayNames[i], Tag = i });
                CheckinDayCombo.Items.Add(new ComboBoxItem { Content = WeekdayNames[i], Tag = i });
            }

            DateTime suggestedStart = WeekCalculator.StartOfWeek(DateTime.Now.AddDays(7));
            StartDatePicker.Date = new DateTimeOffset(suggestedStart);
            MorningPagesTimePicker.Time = new TimeSpan(7, 0, 0);
            ArtistDateTimePicker.Time = new TimeSpan(16, 0, 0);
            CheckinTimePicker.Time = new TimeSpan(19, 0, 0);
            ArtistDateDayCombo.SelectedIndex = 6; // Sábado
            CheckinDayCombo.SelectedIndex = 6;

            ShowStep(0);
        }

        private void ShowStep(int step)
        {
            _step = step;
            for (int i = 0; i < _panels.Length; i++)
            {
                _panels[i].Visibility = i == step ? Visibility.Visible : Visibility.Collapsed;
            }
        }

        private void Next_Click(object sender, RoutedEventArgs e)
        {
            ShowStep(_step + 1);
        }

        private void Back_Click(object sender, RoutedEventArgs e)
        {
            ShowStep(_step - 1);
        }

        private async void Finish_Click(object sender, RoutedEventArgs e)
        {
            ProfileSettings profile = new ProfileSettings
            {
                Name = NameBox.Text.Trim(),
                StartDate = StartDatePicker.Date.ToString("yyyy-MM-dd"),
                MorningPagesTime = MorningPagesTimePicker.Time.ToString(@"hh\:mm"),
                ArtistDateDay = ((ComboBoxItem)ArtistDateDayCombo.SelectedItem)?.Tag.ToString() ?? "7",
                ArtistDateTime = ArtistDateTimePicker.Time.ToString(@"hh\:mm"),
                CheckinDay = ((ComboBoxItem)CheckinDayCombo.SelectedItem)?.Tag.ToString() ?? "7",
                CheckinTime = CheckinTimePicker.Time.ToString(@"hh\:mm"),
                Onboarded = true,
            };

            await LocalDataStore.SetProfileAsync(profile);
            NotificationService.ApplySettings(profile);

            MainPage.Current.CompleteOnboarding();
        }
    }
}
