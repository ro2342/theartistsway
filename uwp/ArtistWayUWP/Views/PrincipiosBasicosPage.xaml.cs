using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class PrincipiosBasicosPage : Page
    {
        public PrincipiosBasicosPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            ItemsPanel.Children.Clear();
            for (int i = 0; i < ContentStore.Content.BasicPrinciples.Count; i++)
            {
                ItemsPanel.Children.Add(new TextBlock
                {
                    Text = $"{i + 1}. {ContentStore.Content.BasicPrinciples[i]}",
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, 0, 0, 16),
                });
            }
        }
    }
}
