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
                ApplyNavLabels();
                this.Loaded += MainPage_Loaded;
                ContentFrame.Navigated += ContentFrame_Navigated;
                SystemNavigationManager.GetForCurrentView().BackRequested += OnBackRequested;
            }
            catch (Exception ex)
            {
                ShowFatalError("Erro ao iniciar a página: " + ex.Message);
            }
        }

        // Rótulos da nav vêm de UI_STRINGS (www/js/data.js), fonte única
        // compartilhada com o PWA -- ver ContentStore.S.
        private void ApplyNavLabels()
        {
            TabHomeLabel.Text = ContentStore.S("nav.home");
            TabProgressLabel.Text = ContentStore.S("nav.progress");
            TabArtistDateLabel.Text = ContentStore.S("nav.artistDate");
            TabFerramentasLabel.Text = ContentStore.S("nav.recursos");
            TabSettingsLabel.Text = ContentStore.S("nav.settings");
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
            // Nunca calcula um brush "padrão" na mão aqui: um lookup via
            // Application.Current.Resources[...] não acompanha a troca de
            // tema em tempo real (RequestedTheme mudado por ThemeModeService),
            // sempre resolve pro tema com que o app abriu -- foi exatamente
            // isso que sumiu com os ícones no tema Claro antes. Em vez disso,
            // limpa o valor local (ClearValue) pra herdar o Foreground padrão
            // do Button, que É theme-aware de verdade via {ThemeResource}.
            SolidColorBrush accent = ThemeHelper.AccentBrush();

            bool isHome = pageType == typeof(HomePage);
            bool isProgress = pageType == typeof(ProgressPage);
            bool isArtistDate = pageType == typeof(ArtistDatePage);
            bool isFerramentas = pageType == typeof(FerramentasPage);
            bool isSettings = pageType == typeof(SettingsPage);

            SetTabForeground(TabHomeLabel, TabHomeIcon, isHome, accent);
            SetTabForeground(TabProgressLabel, TabProgressIcon, isProgress, accent);
            SetTabForeground(TabArtistDateLabel, TabArtistDateIcon, isArtistDate, accent);
            SetTabForeground(TabFerramentasLabel, TabFerramentasIcon, isFerramentas, accent);
            SetTabForeground(TabSettingsLabel, TabSettingsIcon, isSettings, accent);
        }

        private static void SetTabForeground(TextBlock label, SymbolIcon icon, bool active, Brush accent)
        {
            if (active)
            {
                label.Foreground = accent;
                icon.Foreground = accent;
            }
            else
            {
                label.ClearValue(TextBlock.ForegroundProperty);
                icon.ClearValue(IconElement.ForegroundProperty);
            }
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
