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
            DataSyncTab.Header = ContentStore.S("settings.tabs.dataSync");
            AdvancedTab.Header = ContentStore.S("settings.tabs.advanced");
            DataTitleText.Text = ContentStore.S("settings.data.title");
            UpdatesTitleText.Text = ContentStore.S("settings.updates.title");
            SyncTitleText.Text = ContentStore.S("settings.sync.title");
            MaintenanceTitleText.Text = ContentStore.S("settings.maintenance.title");
            DangerZoneTitleText.Text = ContentStore.S("settings.dangerZone.title");
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
        // acessar sua Conta Google — Permitir?"). Ao ter sucesso, guarda a
        // sessão no PasswordVault (SessionService) e atualiza o card — é
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
        // sessão — útil pra recomeçar o programa do zero sem precisar
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
        // conta — pra quem quer entregar o aparelho pra outra pessoa ou
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
    }
}
