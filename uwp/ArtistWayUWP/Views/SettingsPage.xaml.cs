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
        // Só usado aqui pra tema e modo manutenção agora — os campos
        // editáveis de perfil (nome, datas, horários, calendário) viraram
        // a tela própria ProfilePage (Meu Perfil, no painel de navegação).
        private ProfileSettings _profile;
        private StorageFile _downloadedUpdateFile;

        public SettingsPage()
        {
            this.InitializeComponent();

            // Cache a instância no Frame em vez de recriar a página a cada
            // navegação — mesmo motivo do FerramentasPage: preserva a aba
            // do Pivot selecionada entre navegações.
            this.NavigationCacheMode = NavigationCacheMode.Enabled;

            // Títulos vêm de UI_STRINGS (www/js/data.js), fonte única
            // compartilhada com o PWA — ver ContentStore.S. O título grande
            // da página não repete mais aqui: o shell (MainPage) já mostra
            // "Ajustes" no cabeçalho fixo junto do hambúrguer.
            AppearanceTab.Header = ContentStore.S("settings.tabs.appearance");
            AppearanceDescriptionText.Text = ContentStore.S("settings.appearance.description");
            ThemeLightButton.Content = ContentStore.S("settings.appearance.themeLight");
            ThemeDarkButton.Content = ContentStore.S("settings.appearance.themeDark");
            ThemeAutoButton.Content = ContentStore.S("settings.appearance.themeAutoShort");
            DataSyncTab.Header = ContentStore.S("settings.tabs.dataSync");
            AdvancedTab.Header = ContentStore.S("settings.tabs.advanced");
            DataTitleText.Text = ContentStore.S("settings.data.title");
            DataDescriptionText.Text = ContentStore.S("settings.data.description");
            UpdatesTitleText.Text = ContentStore.S("settings.updates.title");
            SyncTitleText.Text = ContentStore.S("settings.sync.title");
            SyncDescriptionText.Text = ContentStore.S("settings.sync.description", "otherPlatform", ContentStore.S("settings.sync.otherPlatformName"));
            GoogleLoginButton.Content = ContentStore.S("settings.sync.loginButton");
            DownloadUpdateButton.Content = ContentStore.S("updates.downloadButton");
            InstallUpdateButton.Content = ContentStore.S("updates.installButton");
            MaintenanceTitleText.Text = ContentStore.S("settings.maintenance.title");
            MaintenanceDescriptionText.Text = ContentStore.S("settings.maintenance.description");
            DangerZoneTitleText.Text = ContentStore.S("settings.dangerZone.title");
            DangerZoneDescriptionText.Text = ContentStore.S("settings.dangerZone.description");
            ExportButton.Content = ContentStore.S("settings.export");
            ImportButton.Content = ContentStore.S("settings.import");
            SignOutButton.Content = ContentStore.S("settings.signOut");
            ClearDataText.Text = ContentStore.S("settings.clearData.button");
            FullResetText.Text = ContentStore.S("settings.fullReset.button");
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadProfileIntoControlsAsync();
        }

        private async System.Threading.Tasks.Task LoadProfileIntoControlsAsync()
        {
            _profile = await LocalDataStore.GetProfileAsync() ?? new ProfileSettings();

            UpdateThemeButtonsVisual();
            ToggleMaintenanceButton.Content = _profile.MaintenanceMode ? ContentStore.S("settings.maintenance.toggleOff") : ContentStore.S("settings.maintenance.toggleOn");

            _ = LoadUpdateStatusAsync();
            RefreshSyncStatus();
        }

        private async void ToggleMaintenance_Click(object sender, RoutedEventArgs e)
        {
            _profile.MaintenanceMode = !_profile.MaintenanceMode;
            ToggleMaintenanceButton.Content = _profile.MaintenanceMode ? ContentStore.S("settings.maintenance.toggleOff") : ContentStore.S("settings.maintenance.toggleOn");
            await LocalDataStore.SetProfileAsync(_profile);
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
                SyncStatusText.Text = ContentStore.S("settings.sync.statusNotLoggedIn");
                GoogleLoginButton.Visibility = Visibility.Visible;
                SignOutButton.Visibility = Visibility.Collapsed;
                return;
            }

            string who = !string.IsNullOrEmpty(session.Email) ? session.Email : session.Uid;
            SyncStatusText.Text = ContentStore.S("settings.sync.statusLoggedInWithProvider", "who", who, "provider", session.Provider);
            GoogleLoginButton.Visibility = Visibility.Collapsed;
            SignOutButton.Visibility = Visibility.Visible;
        }

        // Sincroniza uma vez, na hora, logo depois do login — as próximas
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
            UpdateStatusText.Text = ContentStore.S("updates.installedChecking", "version", installed);
            UpdateCheckResult result = await UpdateCheckService.CheckAsync();
            if (!result.Success)
            {
                UpdateStatusText.Text = ContentStore.S("updates.installedCheckFailedWithError", "version", installed, "error", result.Error);
                DownloadUpdateButton.Visibility = Visibility.Collapsed;
                return;
            }
            if (result.UpdateAvailable)
            {
                UpdateStatusText.Text = ContentStore.S("updates.installedNewVersionAvailable", "version", installed, "latest", result.Latest);
                DownloadUpdateButton.Visibility = Visibility.Visible;
            }
            else
            {
                UpdateStatusText.Text = ContentStore.S("updates.installedUpToDate", "version", installed);
                DownloadUpdateButton.Visibility = Visibility.Collapsed;
            }
        }

        private async void DownloadUpdate_Click(object sender, RoutedEventArgs e)
        {
            DownloadUpdateButton.IsEnabled = false;
            UpdateProgressBar.Value = 0;
            UpdateProgressBar.Visibility = Visibility.Visible;
            UpdateStatusText.Text = ContentStore.S("updates.downloading");

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
                UpdateStatusText.Text = ContentStore.S("updates.downloadFailed", "error", ex.Message);
                return;
            }

            UpdateProgressBar.Visibility = Visibility.Collapsed;
            DownloadUpdateButton.IsEnabled = true;

            if (file == null)
            {
                UpdateStatusText.Text = ContentStore.S("updates.chooseDownloadFolder");
                return;
            }

            _downloadedUpdateFile = file;
            DownloadUpdateButton.Visibility = Visibility.Collapsed;
            InstallUpdateButton.Visibility = Visibility.Visible;
            UpdateStatusText.Text = ContentStore.S("updates.downloadedReadyToInstall");
        }

        private async void InstallUpdate_Click(object sender, RoutedEventArgs e)
        {
            if (_downloadedUpdateFile == null)
            {
                return;
            }
            await Windows.System.Launcher.LaunchFileAsync(_downloadedUpdateFile);
        }

        private async void Export_Click(object sender, RoutedEventArgs e)
        {
            string json = await LocalDataStore.ExportAllDataAsync();
            FileSavePicker savePicker = new FileSavePicker
            {
                SuggestedFileName = $"artist-way-backup-{DateTime.Now:yyyy-MM-dd}",
            };
            savePicker.FileTypeChoices.Add(ContentStore.S("settings.backup.fileTypeJson"), new System.Collections.Generic.List<string> { ".json" });

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
                    Title = ContentStore.S("settings.backup.importErrorDialogTitle"),
                    Content = ContentStore.S("settings.backup.importErrorDialogMessage"),
                    CloseButtonText = ContentStore.S("common.ok"),
                };
                _ = dialog.ShowAsync();
            }
        }

        // Login com a tela de consentimento normal do Google ("ArtistWay quer
        // acessar sua Conta Google — Permitir?"). Ao ter sucesso, guarda a
        // sessão no PasswordVault (SessionService) e atualiza o card — é
        // essa persistência que faltava no teste anterior (fluxo de
        // dispositivo): antes o login funcionava mas nada ficava salvo.
        private async void GoogleLogin_Click(object sender, RoutedEventArgs e)
        {
            Button button = (Button)sender;
            string originalText = button.Content?.ToString();
            button.IsEnabled = false;
            button.Content = ContentStore.S("settings.sync.loggingIn");

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
                Title = result.Success ? ContentStore.S("settings.sync.dialogLoginOkTitle") : ContentStore.S("settings.sync.dialogLoginFailedTitle"),
                Content = result.Success
                    ? ContentStore.S("settings.sync.statusLoggedIn", "who", !string.IsNullOrEmpty(result.FirebaseEmail) ? result.FirebaseEmail : result.FirebaseUid)
                    : result.ErrorMessage,
                CloseButtonText = ContentStore.S("common.ok"),
            };
            await resultDialog.ShowAsync();
        }

        private void SignOut_Click(object sender, RoutedEventArgs e)
        {
            SessionService.ClearSession();
            RefreshSyncStatus();
        }

        // Apaga o progresso (aparelho + nuvem, se logado) mas mantém a
        // sessão — útil pra recomeçar o programa do zero sem precisar
        // logar de novo. A conta continua existindo, só fica vazia.
        private async void ClearData_Click(object sender, RoutedEventArgs e)
        {
            bool loggedIn = SessionService.GetSession() != null;
            ContentDialog confirm = new ContentDialog
            {
                Title = ContentStore.S("settings.clearData.confirmTitle"),
                Content = loggedIn
                    ? ContentStore.S("settings.clearData.confirmMessageLoggedIn")
                    : ContentStore.S("settings.clearData.confirmMessageLocal"),
                PrimaryButtonText = ContentStore.S("settings.clearData.confirmButton"),
                CloseButtonText = ContentStore.S("common.cancel"),
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
        // conta — pra quem quer entregar o aparelho pra outra pessoa ou
        // simplesmente começar com outro login.
        private async void FullReset_Click(object sender, RoutedEventArgs e)
        {
            bool loggedIn = SessionService.GetSession() != null;
            ContentDialog confirm = new ContentDialog
            {
                Title = ContentStore.S("settings.fullReset.confirmTitle"),
                Content = loggedIn
                    ? ContentStore.S("settings.fullReset.confirmMessageLoggedIn")
                    : ContentStore.S("settings.clearData.confirmMessageLocal"),
                PrimaryButtonText = ContentStore.S("settings.fullReset.confirmButton"),
                CloseButtonText = ContentStore.S("common.cancel"),
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
    }
}
