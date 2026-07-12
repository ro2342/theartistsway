using Windows.UI.Xaml;

namespace ArtistWayUWP.Services
{
    // Aplica claro/escuro/automático no app inteiro — mesma escolha
    // sincronizada com o PWA via ProfileSettings.ThemeMode (ver
    // js/theme.js pro lado web). "auto" usa ElementTheme.Default, que
    // já significa "seguir o tema do sistema" nativamente no UWP.
    public static class ThemeModeService
    {
        public static void Apply(string themeMode)
        {
            if (!(Window.Current?.Content is FrameworkElement root))
            {
                return;
            }

            switch (themeMode)
            {
                case "light":
                    root.RequestedTheme = ElementTheme.Light;
                    break;
                case "dark":
                    root.RequestedTheme = ElementTheme.Dark;
                    break;
                default:
                    root.RequestedTheme = ElementTheme.Default;
                    break;
            }
        }
    }
}
