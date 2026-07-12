using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ArtistWayUWP.Views
{
    public sealed partial class FerramentasPage : Page
    {
        public FerramentasPage()
        {
            this.InitializeComponent();
        }

        private void OpenBeliefTable_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(TabelaCrencasPage));
        }

        private void OpenImaginaryLives_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "imaginaryLives");
        }

        private void OpenThingsILike_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "thingsILike");
        }

        private void OpenJealousyMap_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "jealousyMap");
        }

        private void OpenSafetyCircle_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(CirculoSegurancaPage));
        }

        private void OpenLifePie_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(LifePiePage));
        }
    }
}
