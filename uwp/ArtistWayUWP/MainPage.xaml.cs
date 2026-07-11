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
    // fixa embaixo (Início/Jornada/Date/Ajustes), no mesmo espírito do
    // bottom-nav que existia no PWA -- só que com controles nativos, sem
    // WebView. Troca de aba não empilha histórico (são pares do mesmo
    // nível); navegação pra páginas de detalhe (semana, ensaio, check-in,
    // referência) empilha normalmente no back stack do Frame.
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
                case "Settings":
                    pageType = typeof(SettingsPage);
                    break;
                default:
                    return;
            }
            NavigateToTab(pageType);
        }

        public void NavigateToTab(Type pageType, object parameter = null)
        {
            ContentFrame.Navigate(pageType, parameter);
            ContentFrame.BackStack.Clear();
            UpdateActiveTab(pageType);
        }

        private Brush _defaultTabBrush;

        private void UpdateActiveTab(Type pageType)
        {
            // Guarda a cor original (herdada do tema) na primeira troca, pra
            // não precisar adivinhar o nome de nenhum brush "padrão" do
            // sistema -- só alternamos entre ela e a cor de destaque.
            if (_defaultTabBrush == null)
            {
                _defaultTabBrush = TabHomeLabel.Foreground;
            }

            SolidColorBrush accent = ThemeHelper.AccentBrush();
            TabHomeLabel.Foreground = pageType == typeof(HomePage) ? accent : _defaultTabBrush;
            TabProgressLabel.Foreground = pageType == typeof(ProgressPage) ? accent : _defaultTabBrush;
            TabArtistDateLabel.Foreground = pageType == typeof(ArtistDatePage) ? accent : _defaultTabBrush;
            TabSettingsLabel.Foreground = pageType == typeof(SettingsPage) ? accent : _defaultTabBrush;
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
