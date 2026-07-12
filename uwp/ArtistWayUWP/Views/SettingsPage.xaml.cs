using System;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.Storage;
using Windows.Storage.Pickers;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class SettingsPage : Page
    {
        private static readonly string[] WeekdayNames =
            { "", "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado" };

        private ProfileSettings _profile;
        private StorageFile _downloadedUpdateFile;

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
            UpdateThemeButtonsVisual();

            _ = LoadUpdateStatusAsync();
            RefreshSyncStatus();
        }

        private void UpdateThemeButtonsVisual()
        {
            string mode = _profile?.ThemeMode ?? "auto";
            SolidColorBrush accent = ThemeHelper.AccentBrush();

            SetThemeButtonSelected(ThemeLightButton, mode == "light", accent);
            SetThemeButtonSelected(ThemeDarkButton, mode == "dark", accent);
            SetThemeButtonSelected(ThemeAutoButton, mode == "auto", accent);
        }

        // Igual ao UpdateActiveTab do MainPage: nunca calcula o brush
        // "não selecionado" via Application.Current.Resources[...] (não
        // acompanha troca de tema em tempo real). ClearValue deixa o botão
        // herdar o Background/Foreground padrão dele mesmo, que é
        // theme-aware via {ThemeResource}.
        private static void SetThemeButtonSelected(Button button, bool selected, Brush accent)
        {
            if (selected)
            {
                button.Background = accent;
                button.Foreground = new SolidColorBrush(Windows.UI.Colors.White);
            }
            else
            {
                button.ClearValue(Button.BackgroundProperty);
                button.ClearValue(Button.ForegroundProperty);
            }
        }

        private async void ThemeMode_Click(object sender, RoutedEventArgs e)
        {
            string mode = (string)((Button)sender).Tag;
            _profile.ThemeMode = mode;
            ThemeModeService.Apply(mode);
            UpdateThemeButtonsVisual();
            await LocalDataStore.SetProfileAsync(_profile);
        }

        private void RefreshSyncStatus()
        {
            FirebaseSession session = SessionService.GetSession();
            if (session == null)
            {
                SyncStatusText.Text = "Não logado.";
                GoogleLoginButton.Visibility = Visibility.Visible;
                SignOutButton.Visibility = Visibility.Collapsed;
                return;
            }

            string who = !string.IsNullOrEmpty(session.Email) ? session.Email : session.Uid;
            SyncStatusText.Text = $"Logado como {who} ({session.Provider}).";
            GoogleLoginButton.Visibility = Visibility.Collapsed;
            SignOutButton.Visibility = Visibility.Visible;
        }

        // Sincroniza uma vez, na hora, logo depois do login -- as próximas
        // sincronizações acontecem sozinhas em segundo plano (debounce nas
        // mudanças locais + ao reabrir o app), sem precisar de outro botão.
        private async System.Threading.Tasks.Task RunInitialSyncAsync()
        {
            string result = await SyncService.SyncAllAsync();
            SyncStatusText.Text += " " + result;
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
            DownloadUpdateButton.IsEnabled = false;
            UpdateProgressBar.Value = 0;
            UpdateProgressBar.Visibility = Visibility.Visible;
            UpdateStatusText.Text = "Baixando atualização...";

            Progress<double> progress = new Progress<double>(p => UpdateProgressBar.Value = p);
            StorageFile file;
            try
            {
                file = await UpdateCheckService.DownloadUpdateAsync(progress);
            }
            catch (Exception ex)
            {
                UpdateProgressBar.Visibility = Visibility.Collapsed;
                DownloadUpdateButton.IsEnabled = true;
                UpdateStatusText.Text = $"Falha ao baixar a atualização: {ex.Message}";
                return;
            }

            UpdateProgressBar.Visibility = Visibility.Collapsed;
            DownloadUpdateButton.IsEnabled = true;

            if (file == null)
            {
                UpdateStatusText.Text = "Escolha uma pasta de download pra continuar.";
                return;
            }

            _downloadedUpdateFile = file;
            DownloadUpdateButton.Visibility = Visibility.Collapsed;
            InstallUpdateButton.Visibility = Visibility.Visible;
            UpdateStatusText.Text = "Atualização baixada — toque pra instalar.";
        }

        private async void InstallUpdate_Click(object sender, RoutedEventArgs e)
        {
            if (_downloadedUpdateFile == null)
            {
                return;
            }
            await Windows.System.Launcher.LaunchFileAsync(_downloadedUpdateFile);
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

        // Login com a tela de consentimento normal do Google ("ArtistWay quer
        // acessar sua Conta Google -- Permitir?"). Ao ter sucesso, guarda a
        // sessão no PasswordVault (SessionService) e atualiza o card -- é
        // essa persistência que faltava no teste anterior (fluxo de
        // dispositivo): antes o login funcionava mas nada ficava salvo.
        private async void GoogleLogin_Click(object sender, RoutedEventArgs e)
        {
            Button button = (Button)sender;
            string originalText = button.Content?.ToString();
            button.IsEnabled = false;
            button.Content = "Entrando...";

            AuthResult result = await AuthService.SignInWithGoogleConsentAsync();

            button.IsEnabled = true;
            button.Content = originalText;

            if (result.Success)
            {
                SessionService.SaveSession(result);
                RefreshSyncStatus();
                _ = RunInitialSyncAsync();
            }

            ContentDialog resultDialog = new ContentDialog
            {
                Title = result.Success ? "Login OK" : "Login falhou",
                Content = result.Success
                    ? $"Logado como {(!string.IsNullOrEmpty(result.FirebaseEmail) ? result.FirebaseEmail : result.FirebaseUid)}."
                    : result.ErrorMessage,
                CloseButtonText = "OK",
            };
            await resultDialog.ShowAsync();
        }

        private void SignOut_Click(object sender, RoutedEventArgs e)
        {
            SessionService.ClearSession();
            RefreshSyncStatus();
        }

        // Apaga o progresso (aparelho + nuvem, se logado) mas mantém a
        // sessão -- útil pra recomeçar o programa do zero sem precisar
        // logar de novo. A conta continua existindo, só fica vazia.
        private async void ClearData_Click(object sender, RoutedEventArgs e)
        {
            bool loggedIn = SessionService.GetSession() != null;
            ContentDialog confirm = new ContentDialog
            {
                Title = "Apagar todos os dados?",
                Content = loggedIn
                    ? "Isso apaga todo o progresso salvo nesse aparelho e na nuvem (a conta continua logada, só fica vazia). Não tem como desfazer. Tem certeza?"
                    : "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer. Tem certeza?",
                PrimaryButtonText = "Apagar dados",
                CloseButtonText = "Cancelar",
                DefaultButton = ContentDialogButton.Close,
            };
            if (await confirm.ShowAsync() != ContentDialogResult.Primary)
            {
                return;
            }

            await LocalDataStore.ResetAllAsync();
            if (loggedIn)
            {
                await SyncService.ClearCloudDataAsync();
            }
            MainPage.Current.BeginOnboarding();
        }

        // Reset completo: apaga o progresso (aparelho + nuvem) E sai da
        // conta -- pra quem quer entregar o aparelho pra outra pessoa ou
        // simplesmente começar com outro login.
        private async void FullReset_Click(object sender, RoutedEventArgs e)
        {
            bool loggedIn = SessionService.GetSession() != null;
            ContentDialog confirm = new ContentDialog
            {
                Title = "Resetar o app completamente?",
                Content = loggedIn
                    ? "Isso apaga todo o progresso (aparelho e nuvem) e sai da conta logada. Não tem como desfazer. Tem certeza?"
                    : "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer. Tem certeza?",
                PrimaryButtonText = "Resetar tudo",
                CloseButtonText = "Cancelar",
                DefaultButton = ContentDialogButton.Close,
            };
            if (await confirm.ShowAsync() != ContentDialogResult.Primary)
            {
                return;
            }

            await LocalDataStore.ResetAllAsync();
            if (loggedIn)
            {
                await SyncService.ClearCloudDataAsync();
                SessionService.ClearSession();
            }
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
