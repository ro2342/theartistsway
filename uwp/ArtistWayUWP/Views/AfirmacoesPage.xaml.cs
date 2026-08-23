using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class AfirmacoesPage : Page
    {
        public AfirmacoesPage()
        {
            this.InitializeComponent();
            TitleText.Text = ContentStore.S("tools.bancoAfirmacoes");
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            ItemsPanel.Children.Clear();
            for (int i = 0; i < ContentStore.Content.Affirmations.Count; i++)
            {
                ItemsPanel.Children.Add(new TextBlock
                {
                    Text = $"{i + 1}. {ContentStore.Content.Affirmations[i]}",
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, 0, 0, 16),
                });
            }
        }
    }
}
