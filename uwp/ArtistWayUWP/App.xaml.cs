using System;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.ApplicationModel;
using Windows.ApplicationModel.Activation;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP
{
    /// <summary>
    /// Ponto de entrada do app. Carrega o conteúdo do livro (ContentStore) e
    /// navega pro shell nativo (MainPage), que cuida do resto.
    /// </summary>
    sealed partial class App : Application
    {
        public App()
        {
            this.InitializeComponent();
            this.Suspending += OnSuspending;
            this.Resuming += OnResuming;
            this.UnhandledException += App_UnhandledException;
        }

        // Sincroniza ao voltar de suspenso — é aqui que pegamos o que
        // mudou em outro aparelho enquanto esse ficou parado (ver gatilhos
        // de sincronização em sincronizacao-nuvem-setup.md).
        private async void OnResuming(object sender, object e)
        {
            await SyncService.SyncAllAsync();
            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            ThemeModeService.Apply(profile?.ThemeMode ?? "auto");
            await TileService.UpdateAsync();
        }

        private async void App_UnhandledException(object sender, Windows.UI.Xaml.UnhandledExceptionEventArgs e)
        {
            e.Handled = true;
            try
            {
                var dialog = new Windows.UI.Popups.MessageDialog(e.Message ?? "Erro desconhecido", "Erro inesperado no app");
                await dialog.ShowAsync();
            }
            catch
            {
                // Se nem o diálogo conseguir abrir, não há mais nada a fazer aqui.
            }
        }

        protected override async void OnLaunched(LaunchActivatedEventArgs e)
        {
            Frame rootFrame = Window.Current.Content as Frame;

            if (rootFrame == null)
            {
                rootFrame = new Frame();
                rootFrame.NavigationFailed += OnNavigationFailed;

                if (e.PreviousExecutionState == ApplicationExecutionState.Terminated)
                {
                    // Poderíamos restaurar estado salvo aqui no futuro, se necessário.
                }

                Window.Current.Content = rootFrame;
            }

            if (e.PrelaunchActivated == false)
            {
                if (rootFrame.Content == null)
                {
                    await ContentStore.InitializeAsync();
                    ProfileSettings profile = await LocalDataStore.GetProfileAsync();
                    ThemeModeService.Apply(profile?.ThemeMode ?? "auto");
                    rootFrame.Navigate(typeof(MainPage), e.Arguments);
                }
                Window.Current.Activate();
                _ = SyncThenUpdateTileAsync();
            }
        }

        // A tile só faz sentido depois que a sincronização trouxer o que
        // mudou em outro aparelho — senão a Live Tile podia mostrar uma
        // sequência desatualizada logo ao abrir.
        private static async Task SyncThenUpdateTileAsync()
        {
            await SyncService.SyncAllAsync();
            await TileService.UpdateAsync();
        }

        void OnNavigationFailed(object sender, NavigationFailedEventArgs e)
        {
            throw new Exception("Falha ao carregar a página: " + e.SourcePageType.FullName);
        }

        private void OnSuspending(object sender, SuspendingEventArgs e)
        {
            var deferral = e.SuspendingOperation.GetDeferral();
            deferral.Complete();
        }
    }
}
