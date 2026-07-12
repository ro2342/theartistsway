using System;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using ArtistWayUWP.Views;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP
{
    // Shell de navegação nativo: um Frame pro conteúdo + uma barra de abas
    // fixa embaixo (Início/Jornada/Date/Ferramentas/Ajustes), no mesmo
    // espírito do bottom-nav que existia no PWA — só que com controles
    // nativos, sem WebView. Troca de aba não empilha histórico (são pares
    // do mesmo nível); navegação pra páginas de detalhe (semana, ensaio,
    // check-in, referência) empilha normalmente no back stack do Frame.
    public sealed partial class MainPage : Page
    {
        public static MainPage Current { get; private set; }

        public MainPage()
        {
            try
            {
                this.InitializeComponent();
                Current = this;
                this.Loaded += MainPage_Loaded;
                ContentFrame.Navigated += ContentFrame_Navigated;
                SystemNavigationManager.GetForCurrentView().BackRequested += OnBackRequested;
            }
            catch (Exception ex)
            {
                ShowFatalError("Erro ao iniciar a página: " + ex.Message);
            }
        }

        private async void MainPage_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                ProfileSettings profile = await LocalDataStore.GetProfileAsync();
                if (profile == null || !profile.Onboarded)
                {
                    BeginOnboarding();
                }
                else
                {
                    TabBar.Visibility = Visibility.Visible;
                    NavigateToTab(typeof(HomePage));
                }
            }
            catch (Exception ex)
            {
                ShowFatalError("Erro ao carregar o app: " + ex.Message);
            }
        }

        public void BeginOnboarding()
        {
            TabBar.Visibility = Visibility.Collapsed;
            ContentFrame.Navigate(typeof(OnboardingPage));
            ContentFrame.BackStack.Clear();
        }

        public void CompleteOnboarding()
        {
            TabBar.Visibility = Visibility.Visible;
            NavigateToTab(typeof(HomePage));
        }

        // ---------- abas ----------

        private void TabButton_Click(object sender, RoutedEventArgs e)
        {
            string tag = (string)((FrameworkElement)sender).Tag;
            Type pageType;
            switch (tag)
            {
                case "Home":
                    pageType = typeof(HomePage);
                    break;
                case "Progress":
                    pageType = typeof(ProgressPage);
                    break;
                case "ArtistDate":
                    pageType = typeof(ArtistDatePage);
                    break;
                case "Ferramentas":
                    pageType = typeof(FerramentasPage);
                    break;
                case "Settings":
                    pageType = typeof(SettingsPage);
                    break;
                default:
                    return;
            }
            NavigateToTab(pageType);
        }

        private async void SyncNowButton_Click(object sender, RoutedEventArgs e)
        {
            SyncNowButton.IsEnabled = false;
            string result = await SyncService.SyncAllAsync();
            SyncNowButton.IsEnabled = true;

            Flyout flyout = new Flyout
            {
                Content = new TextBlock { Text = result, TextWrapping = TextWrapping.Wrap, MaxWidth = 240 },
            };
            flyout.ShowAt(SyncNowButton);
        }

        public void NavigateToTab(Type pageType, object parameter = null)
        {
            ContentFrame.Navigate(pageType, parameter);
            ContentFrame.BackStack.Clear();
            UpdateActiveTab(pageType);
        }

        private void UpdateActiveTab(Type pageType)
        {
            // Busca o brush "padrão" do tema de novo a cada troca (em vez de
            // guardar uma referência da primeira vez) -- um brush capturado
            // de um elemento antes de ele terminar de aplicar o Style podia
            // vir nulo/errado, e ficava preso nisso pro resto da sessão.
            // Esse era o motivo dos ícones sumirem no tema claro: o valor
            // cacheado não correspondia ao texto/ícone padrão daquele tema.
            SolidColorBrush accent = ThemeHelper.AccentBrush();
            Brush defaultBrush = (Brush)Application.Current.Resources["SystemControlForegroundBaseHighBrush"];

            bool isHome = pageType == typeof(HomePage);
            bool isProgress = pageType == typeof(ProgressPage);
            bool isArtistDate = pageType == typeof(ArtistDatePage);
            bool isFerramentas = pageType == typeof(FerramentasPage);
            bool isSettings = pageType == typeof(SettingsPage);

            TabHomeLabel.Foreground = isHome ? accent : defaultBrush;
            TabHomeIcon.Foreground = isHome ? accent : defaultBrush;
            TabProgressLabel.Foreground = isProgress ? accent : defaultBrush;
            TabProgressIcon.Foreground = isProgress ? accent : defaultBrush;
            TabArtistDateLabel.Foreground = isArtistDate ? accent : defaultBrush;
            TabArtistDateIcon.Foreground = isArtistDate ? accent : defaultBrush;
            TabFerramentasLabel.Foreground = isFerramentas ? accent : defaultBrush;
            TabFerramentasIcon.Foreground = isFerramentas ? accent : defaultBrush;
            TabSettingsLabel.Foreground = isSettings ? accent : defaultBrush;
            TabSettingsIcon.Foreground = isSettings ? accent : defaultBrush;
        }

        // ---------- navegação/voltar ----------

        private void ContentFrame_Navigated(object sender, NavigationEventArgs e)
        {
            SystemNavigationManager.GetForCurrentView().AppViewBackButtonVisibility =
                ContentFrame.CanGoBack ? AppViewBackButtonVisibility.Visible : AppViewBackButtonVisibility.Collapsed;
        }

        private void OnBackRequested(object sender, BackRequestedEventArgs e)
        {
            if (ContentFrame.CanGoBack)
            {
                e.Handled = true;
                ContentFrame.GoBack();
            }
        }

        // ---------- erro fatal ----------

        private void ShowFatalError(string message)
        {
            if (ErrorText != null && ErrorPanel != null)
            {
                ErrorText.Text = message;
                ErrorPanel.Visibility = Visibility.Visible;
            }
        }
    }
}
