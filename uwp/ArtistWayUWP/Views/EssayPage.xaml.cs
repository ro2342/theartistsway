using System.Linq;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class EssayPage : Page
    {
        public EssayPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            int weekId = e.Parameter is int id ? id : 1;
            WeekContent week = ContentStore.Content.Weeks.FirstOrDefault(w => w.Id == weekId);

            HeaderText.Text = $"Semana {weekId} — {week?.Title}";
            ParagraphsPanel.Children.Clear();
            foreach (string paragraph in week?.Essay ?? new System.Collections.Generic.List<string>())
            {
                ParagraphsPanel.Children.Add(new TextBlock
                {
                    Text = paragraph,
                    FontSize = 15,
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, 0, 0, 16),
                });
            }
        }
    }
}
