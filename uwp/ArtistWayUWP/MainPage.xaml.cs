using System;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using ArtistWayUWP.Views;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP
{
    // Shell de navegação nativo: um Frame pro conteúdo + um cabeçalho fixo
    // no topo (hambúrguer + título da seção atual, lado a lado) que abre um
    // SplitView deslizando por cima do conteúdo, no mesmo espírito da barra
    // de cima dos apps nativos da Microsoft (News/Forecast/Settings: "☰
    // Nome da seção"). Troca de destino fecha o painel, atualiza o título
    // do cabeçalho e não empilha histórico (são pares do mesmo nível);
    // navegação pra páginas de detalhe (semana, ensaio, check-in,
    // referência) empilha normalmente no back stack do Frame, sem trocar o
    // título do cabeçalho (continua mostrando o destino de nível superior).
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
                StyleMenuButton();
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
        // compartilhada com o PWA — ver ContentStore.S.
        private void ApplyNavLabels()
        {
            NavHomeLabel.Text = ContentStore.S("nav.home");
            NavProgressLabel.Text = ContentStore.S("nav.progress");
            NavArtistDateLabel.Text = ContentStore.S("nav.artistDate");
            NavFerramentasLabel.Text = ContentStore.S("nav.recursos");
            NavProfileLabel.Text = ContentStore.S("nav.profile");
            NavSyncLabel.Text = ContentStore.S("nav.sync");
            NavSettingsLabel.Text = ContentStore.S("nav.settings");
        }

        // Quadrado sólido na cor de destaque, igual ao botão de menu do
        // News — precisa ser aplicado em código porque a cor de destaque
        // do sistema não muda com o tema (então não há risco do bug de
        // ícone sumindo que já pegamos antes com brushes de tema).
        private void StyleMenuButton()
        {
            SolidColorBrush accent = ThemeHelper.AccentBrush();
            MenuButton.Background = accent;
            MenuButton.Foreground = new SolidColorBrush(Windows.UI.Colors.White);
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
                    HeaderBar.Visibility = Visibility.Visible;
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
            HeaderBar.Visibility = Visibility.Collapsed;
            NavSplitView.IsPaneOpen = false;
            ContentFrame.Navigate(typeof(OnboardingPage));
            ContentFrame.BackStack.Clear();
        }

        public void CompleteOnboarding()
        {
            HeaderBar.Visibility = Visibility.Visible;
            NavigateToTab(typeof(HomePage));
        }

        // — painel de navegação —

        private void MenuButton_Click(object sender, RoutedEventArgs e)
        {
            SetPaneOpen(!NavSplitView.IsPaneOpen);
        }

        private void PaneDismissOverlay_Tapped(object sender, TappedRoutedEventArgs e)
        {
            SetPaneOpen(false);
        }

        private void SetPaneOpen(bool open)
        {
            NavSplitView.IsPaneOpen = open;
            PaneDismissOverlay.Visibility = open ? Visibility.Visible : Visibility.Collapsed;
        }

        private void NavItem_Click(object sender, RoutedEventArgs e)
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
                case "Profile":
                    pageType = typeof(ProfilePage);
                    break;
                case "Settings":
                    pageType = typeof(SettingsPage);
                    break;
                default:
                    return;
            }
            NavigateToTab(pageType);
            SetPaneOpen(false);
        }

        private async void SyncNowButton_Click(object sender, RoutedEventArgs e)
        {
            NavSync.IsEnabled = false;
            string result = await SyncService.SyncAllAsync();
            NavSync.IsEnabled = true;
            SetPaneOpen(false);

            Flyout flyout = new Flyout
            {
                Content = new TextBlock { Text = result, TextWrapping = TextWrapping.Wrap, MaxWidth = 240 },
            };
            flyout.ShowAt(MenuButton);
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
            // sempre resolve pro tema com que o app abriu — foi exatamente
            // isso que sumiu com os ícones no tema Claro antes. Em vez disso,
            // limpa o valor local (ClearValue) pra herdar o Foreground padrão
            // do Button, que É theme-aware de verdade via {ThemeResource}.
            SolidColorBrush accent = ThemeHelper.AccentBrush();

            bool isHome = pageType == typeof(HomePage);
            bool isProgress = pageType == typeof(ProgressPage);
            bool isArtistDate = pageType == typeof(ArtistDatePage);
            bool isFerramentas = pageType == typeof(FerramentasPage);
            bool isProfile = pageType == typeof(ProfilePage);
            bool isSettings = pageType == typeof(SettingsPage);

            SetTabForeground(NavHomeLabel, NavHomeIcon, isHome, accent);
            SetTabForeground(NavProgressLabel, NavProgressIcon, isProgress, accent);
            SetTabForeground(NavArtistDateLabel, NavArtistDateIcon, isArtistDate, accent);
            SetTabForeground(NavFerramentasLabel, NavFerramentasIcon, isFerramentas, accent);
            SetTabForeground(NavProfileLabel, NavProfileIcon, isProfile, accent);
            SetTabForeground(NavSettingsLabel, NavSettingsIcon, isSettings, accent);

            // Título do cabeçalho fixo acompanha a seção atual (mesmas
            // chaves de UI_STRINGS usadas nos rótulos do painel) — é o que
            // troca de "Início" pra "Ajustes" etc. ao lado do hambúrguer.
            if (isHome) HeaderTitleText.Text = ContentStore.S("nav.home");
            else if (isProgress) HeaderTitleText.Text = ContentStore.S("nav.progress");
            else if (isArtistDate) HeaderTitleText.Text = ContentStore.S("nav.artistDate");
            else if (isFerramentas) HeaderTitleText.Text = ContentStore.S("nav.recursos");
            else if (isProfile) HeaderTitleText.Text = ContentStore.S("nav.profile");
            else if (isSettings) HeaderTitleText.Text = ContentStore.S("nav.settings");
        }

        // IconElement (não SymbolIcon) porque NavProfileIcon é um FontIcon
        // (glifo cru, ver comentário no MainPage.xaml) — os dois herdam de
        // IconElement, que já tem a propriedade Foreground usada aqui.
        private static void SetTabForeground(TextBlock label, IconElement icon, bool active, Brush accent)
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

        // — navegação/voltar —

        private void ContentFrame_Navigated(object sender, NavigationEventArgs e)
        {
            SystemNavigationManager.GetForCurrentView().AppViewBackButtonVisibility =
                ContentFrame.CanGoBack ? AppViewBackButtonVisibility.Visible : AppViewBackButtonVisibility.Collapsed;
        }

        private void OnBackRequested(object sender, BackRequestedEventArgs e)
        {
            if (NavSplitView.IsPaneOpen)
            {
                e.Handled = true;
                SetPaneOpen(false);
                return;
            }
            if (ContentFrame.CanGoBack)
            {
                e.Handled = true;
                ContentFrame.GoBack();
            }
        }

        // — erro fatal —

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
