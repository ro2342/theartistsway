using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class RegrasDaEstradaPage : Page
    {
        public RegrasDaEstradaPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            ItemsPanel.Children.Clear();
            for (int i = 0; i < ContentStore.Content.RoadRules.Count; i++)
            {
                ItemsPanel.Children.Add(new TextBlock
                {
                    Text = $"{i + 1}. {ContentStore.Content.RoadRules[i]}",
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, 0, 0, 16),
                });
            }
        }
    }
}
