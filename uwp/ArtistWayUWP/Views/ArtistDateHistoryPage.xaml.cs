using System.Collections.Generic;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    // Só leitura — lê o store artistDates já existente, sem escrever nada
    // novo. Ver LocalDataStore.GetAllArtistDatesAsync.
    public sealed partial class ArtistDateHistoryPage : Page
    {
        public ArtistDateHistoryPage()
        {
            this.InitializeComponent();
        }

        protected override async void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            List<ArtistDateHistoryItem> items = await LocalDataStore.GetAllArtistDatesAsync();

            HistoryPanel.Children.Clear();
            if (items.Count == 0)
            {
                HistoryPanel.Children.Add(new TextBlock
                {
                    Text = "Nenhum Artist Date registrado ainda.",
                    Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                    Opacity = 0.85,
                    TextWrapping = TextWrapping.Wrap,
                });
                return;
            }

            foreach (ArtistDateHistoryItem item in items)
            {
                StackPanel row = new StackPanel { Margin = new Thickness(0, 0, 0, 12) };
                row.Children.Add(new TextBlock
                {
                    Text = item.WeekStart + (item.Done ? " — feito" : " — planejado"),
                    FontWeight = Windows.UI.Text.FontWeights.SemiBold,
                    Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                });
                if (!string.IsNullOrEmpty(item.Idea))
                {
                    row.Children.Add(new TextBlock
                    {
                        Text = item.Idea,
                        Opacity = 0.85,
                        TextWrapping = TextWrapping.Wrap,
                        Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                    });
                }
                HistoryPanel.Children.Add(row);
            }
        }
    }
}
