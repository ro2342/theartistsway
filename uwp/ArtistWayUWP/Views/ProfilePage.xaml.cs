using System;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    // Tela dedicada de perfil (nome, datas/horários, calendário do
    // Windows) — antes era a aba "Perfil" dentro de Ajustes, virou destino
    // próprio no painel de navegação (acima de Sincronizar) porque perfil
    // não é bem um "ajuste", é o próprio programa de 12 semanas da pessoa.
    public sealed partial class ProfilePage : Page
    {
        private static readonly string[] WeekdayNames =
            { "", "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado" };

        private ProfileSettings _profile;

        public ProfilePage()
        {
            this.InitializeComponent();
            PopulateWeekdayCombo(ArtistDateDayCombo);
            PopulateWeekdayCombo(CheckinDayCombo);
        }

        private static void PopulateWeekdayCombo(ComboBox combo)
        {
            for (int i = 1; i <= 7; i++)
            {
                combo.Items.Add(new ComboBoxItem { Content = WeekdayNames[i], Tag = i });
            }
        }

        private static void SelectWeekday(ComboBox combo, string value)
        {
            if (!int.TryParse(value, out int day))
            {
                day = 7;
            }
            foreach (object item in combo.Items)
            {
                if (item is ComboBoxItem cbi && (int)cbi.Tag == day)
                {
                    combo.SelectedItem = cbi;
                    return;
                }
            }
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadProfileIntoControlsAsync();
        }

        private async System.Threading.Tasks.Task LoadProfileIntoControlsAsync()
        {
            _profile = await LocalDataStore.GetProfileAsync() ?? new ProfileSettings();

            NameBox.Text = _profile.Name ?? "";
            if (DateTimeOffset.TryParse(_profile.StartDate, out DateTimeOffset startDate))
            {
                StartDatePicker.Date = startDate;
            }
            if (TimeSpan.TryParse(_profile.MorningPagesTime, out TimeSpan mpTime))
            {
                MorningPagesTimePicker.Time = mpTime;
            }
            if (TimeSpan.TryParse(_profile.ArtistDateTime, out TimeSpan adTime))
            {
                ArtistDateTimePicker.Time = adTime;
            }
            if (TimeSpan.TryParse(_profile.CheckinTime, out TimeSpan ciTime))
            {
                CheckinTimePicker.Time = ciTime;
            }
            SelectWeekday(ArtistDateDayCombo, _profile.ArtistDateDay);
            SelectWeekday(CheckinDayCombo, _profile.CheckinDay);
        }

        private async void SaveProfile_Click(object sender, RoutedEventArgs e)
        {
            _profile.Name = NameBox.Text.Trim();
            _profile.StartDate = StartDatePicker.Date.ToString("yyyy-MM-dd");
            _profile.MorningPagesTime = MorningPagesTimePicker.Time.ToString(@"hh\:mm");
            _profile.ArtistDateTime = ArtistDateTimePicker.Time.ToString(@"hh\:mm");
            _profile.CheckinTime = CheckinTimePicker.Time.ToString(@"hh\:mm");
            _profile.ArtistDateDay = ((ComboBoxItem)ArtistDateDayCombo.SelectedItem)?.Tag.ToString() ?? "7";
            _profile.CheckinDay = ((ComboBoxItem)CheckinDayCombo.SelectedItem)?.Tag.ToString() ?? "7";
            _profile.Onboarded = true;

            await LocalDataStore.SetProfileAsync(_profile);
            NotificationService.ApplySettings(_profile);

            ContentDialog dialog = new ContentDialog
            {
                Title = "Tudo certo",
                Content = "Ajustes salvos e lembretes atualizados.",
                CloseButtonText = "OK",
            };
            _ = dialog.ShowAsync();
        }

        private async void NativeCalMp_Click(object sender, RoutedEventArgs e)
        {
            if (TimeSpan.TryParse(_profile.MorningPagesTime, out TimeSpan time))
            {
                await AppointmentService.AddDailyAsync(
                    "Morning Pages",
                    "3 páginas à mão, sem reler. Companheiro The Artist's Way.",
                    time,
                    30,
                    UiHelper.GetElementRect((FrameworkElement)sender));
            }
        }

        private async void NativeCalAd_Click(object sender, RoutedEventArgs e)
        {
            int.TryParse(_profile.ArtistDateDay, out int day);
            if (TimeSpan.TryParse(_profile.ArtistDateTime, out TimeSpan time))
            {
                await AppointmentService.AddWeeklyAsync(
                    "Artist Date",
                    "Um encontro solo, só por prazer, para encher o poço criativo. Companheiro The Artist's Way.",
                    day == 0 ? 7 : day,
                    time,
                    90,
                    UiHelper.GetElementRect((FrameworkElement)sender));
            }
        }

        private async void NativeCalCi_Click(object sender, RoutedEventArgs e)
        {
            int.TryParse(_profile.CheckinDay, out int day);
            if (TimeSpan.TryParse(_profile.CheckinTime, out TimeSpan time))
            {
                await AppointmentService.AddWeeklyAsync(
                    "Check-in semanal",
                    "Revisar a semana: Morning Pages, Artist Date e reflexões. Companheiro The Artist's Way.",
                    day == 0 ? 7 : day,
                    time,
                    20,
                    UiHelper.GetElementRect((FrameworkElement)sender));
            }
        }
    }
}
