using System;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.Security.Authentication.Web;
using Windows.Storage;
using Windows.Storage.Pickers;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class SettingsPage : Page
    {
        private static readonly string[] WeekdayNames =
            { "", "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado" };

        private ProfileSettings _profile;

        public SettingsPage()
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

            _ = LoadUpdateStatusAsync();
        }

        private async System.Threading.Tasks.Task LoadUpdateStatusAsync()
        {
            string installed = UpdateCheckService.GetInstalledVersion();
            UpdateStatusText.Text = $"Versão instalada: {installed}. Verificando se há atualização...";
            UpdateCheckResult result = await UpdateCheckService.CheckAsync();
            if (!result.Success)
            {
                UpdateStatusText.Text = $"Versão instalada: {installed}. Não foi possível checar agora ({result.Error}).";
                DownloadUpdateButton.Visibility = Visibility.Collapsed;
                return;
            }
            if (result.UpdateAvailable)
            {
                UpdateStatusText.Text = $"Versão instalada: {installed}. Nova versão disponível: {result.Latest}.";
                DownloadUpdateButton.Visibility = Visibility.Visible;
            }
            else
            {
                UpdateStatusText.Text = $"Versão instalada: {installed}. Atualizado ✓";
                DownloadUpdateButton.Visibility = Visibility.Collapsed;
            }
        }

        private async void DownloadUpdate_Click(object sender, RoutedEventArgs e)
        {
            await Windows.System.Launcher.LaunchUriAsync(new Uri(UpdateCheckService.DownloadFileUrl));
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
                    30);
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
                    90);
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
                    20);
            }
        }

        private async void CalMp_Click(object sender, RoutedEventArgs e)
        {
            string url = CalendarLinkService.MorningPagesUrl(_profile.MorningPagesTime);
            await Windows.System.Launcher.LaunchUriAsync(new Uri(url));
        }

        private async void CalAd_Click(object sender, RoutedEventArgs e)
        {
            int.TryParse(_profile.ArtistDateDay, out int day);
            string url = CalendarLinkService.ArtistDateUrl(day == 0 ? 7 : day, _profile.ArtistDateTime);
            await Windows.System.Launcher.LaunchUriAsync(new Uri(url));
        }

        private async void CalCi_Click(object sender, RoutedEventArgs e)
        {
            int.TryParse(_profile.CheckinDay, out int day);
            string url = CalendarLinkService.CheckinUrl(day == 0 ? 7 : day, _profile.CheckinTime);
            await Windows.System.Launcher.LaunchUriAsync(new Uri(url));
        }

        private async void Export_Click(object sender, RoutedEventArgs e)
        {
            string json = await LocalDataStore.ExportAllDataAsync();
            FileSavePicker savePicker = new FileSavePicker
            {
                SuggestedFileName = $"artist-way-backup-{DateTime.Now:yyyy-MM-dd}",
            };
            savePicker.FileTypeChoices.Add("Arquivo JSON", new System.Collections.Generic.List<string> { ".json" });

            StorageFile file = await savePicker.PickSaveFileAsync();
            if (file != null)
            {
                await FileIO.WriteTextAsync(file, json);
            }
        }

        private async void Import_Click(object sender, RoutedEventArgs e)
        {
            FileOpenPicker openPicker = new FileOpenPicker();
            openPicker.FileTypeFilter.Add(".json");

            StorageFile file = await openPicker.PickSingleFileAsync();
            if (file == null)
            {
                return;
            }

            try
            {
                string text = await FileIO.ReadTextAsync(file);
                await LocalDataStore.ImportAllDataAsync(text);
                await LoadProfileIntoControlsAsync();
            }
            catch (Exception)
            {
                ContentDialog dialog = new ContentDialog
                {
                    Title = "Erro",
                    Content = "Não foi possível importar esse arquivo.",
                    CloseButtonText = "OK",
                };
                _ = dialog.ShowAsync();
            }
        }

        // Etapa A da sincronização entre aparelhos: pra registrar o app
        // como cliente nativo no Entra ID (login Microsoft via WAM), o
        // Azure precisa do SID do pacote como redirect URI
        // (ms-app://<SID>/). Não tem como descobrir esse valor sem rodar
        // no aparelho de verdade -- este botão só existe pra mostrar isso.
        private async void ShowPackageSid_Click(object sender, RoutedEventArgs e)
        {
            string sid = WebAuthenticationBroker.GetCurrentApplicationCallbackUri().ToString();
            ContentDialog dialog = new ContentDialog
            {
                Title = "Identificador do pacote",
                Content = "Copie esse valor e registre como redirect URI (plataforma \"Mobile and desktop applications\") no app registrado no Entra ID:\n\n" + sid,
                CloseButtonText = "OK",
            };
            await dialog.ShowAsync();
        }

        private async void Reset_Click(object sender, RoutedEventArgs e)
        {
            ContentDialog confirm = new ContentDialog
            {
                Title = "Resetar o app?",
                Content = "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer. Tem certeza?",
                PrimaryButtonText = "Resetar",
                CloseButtonText = "Cancelar",
                DefaultButton = ContentDialogButton.Close,
            };
            ContentDialogResult result = await confirm.ShowAsync();
            if (result != ContentDialogResult.Primary)
            {
                return;
            }

            await LocalDataStore.ResetAllAsync();
            MainPage.Current.BeginOnboarding();
        }

        private void OpenRoadRules_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(RegrasDaEstradaPage));
        }

        private void OpenPrinciples_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(PrincipiosBasicosPage));
        }
    }
}
