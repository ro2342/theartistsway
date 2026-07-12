using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class TabelaCrencasPage : Page
    {
        public TabelaCrencasPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            ItemsPanel.Children.Clear();
            foreach (BeliefPair pair in ContentStore.Content.BeliefTable)
            {
                Grid row = new Grid { Margin = new Thickness(0, 0, 0, 12) };
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

                TextBlock negative = new TextBlock
                {
                    Text = pair.Negative,
                    Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                    Opacity = 0.6,
                    TextDecorations = Windows.UI.Text.TextDecorations.Strikethrough,
                    TextWrapping = TextWrapping.Wrap,
                };
                Grid.SetColumn(negative, 0);

                TextBlock positive = new TextBlock
                {
                    Text = pair.Positive,
                    Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                    FontWeight = Windows.UI.Text.FontWeights.SemiBold,
                    TextWrapping = TextWrapping.Wrap,
                    HorizontalAlignment = HorizontalAlignment.Right,
                    TextAlignment = TextAlignment.Right,
                };
                Grid.SetColumn(positive, 1);

                row.Children.Add(negative);
                row.Children.Add(positive);
                ItemsPanel.Children.Add(row);
            }
        }
    }
}
