using System.Collections.Generic;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class CirculoSegurancaPage : Page
    {
        private const string ListName = "safetyCircle";

        public CirculoSegurancaPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadAsync();
        }

        private async void AddSafe_Click(object sender, RoutedEventArgs e)
        {
            string name = NameBox.Text.Trim();
            if (string.IsNullOrEmpty(name))
            {
                return;
            }
            await LocalDataStore.AddListItemAsync(ListName, new Dictionary<string, string>
            {
                ["name"] = name,
                ["side"] = "safe",
            });
            NameBox.Text = "";
            await LoadAsync();
        }

        private async Task LoadAsync()
        {
            List<NamedListItem> items = await LocalDataStore.GetListItemsAsync(ListName);
            items.Sort((a, b) => string.CompareOrdinal(a.UpdatedAt, b.UpdatedAt));

            SafePanel.Children.Clear();
            CautionPanel.Children.Clear();

            foreach (NamedListItem item in items)
            {
                string name = item.Fields.ContainsKey("name") ? item.Fields["name"] : "";
                if (string.IsNullOrEmpty(name))
                {
                    continue;
                }
                bool isSafe = !item.Fields.ContainsKey("side") || item.Fields["side"] != "caution";

                Grid row = new Grid { Margin = new Thickness(0, 0, 0, 8) };
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                TextBlock nameText = new TextBlock
                {
                    Text = name,
                    VerticalAlignment = VerticalAlignment.Center,
                    TextWrapping = TextWrapping.Wrap,
                };
                Grid.SetColumn(nameText, 0);

                Button moveButton = new Button
                {
                    Tag = item.Id,
                    Content = new StackPanel
                    {
                        Orientation = Orientation.Horizontal,
                        Children =
                        {
                            new SymbolIcon { Symbol = isSafe ? Symbol.Important : Symbol.Accept },
                            new TextBlock
                            {
                                Text = isSafe ? "Mover pra Cautela" : "Mover pra Apoia",
                                Margin = new Thickness(6, 0, 0, 0),
                                VerticalAlignment = VerticalAlignment.Center,
                            },
                        },
                    },
                };
                Grid.SetColumn(moveButton, 1);
                moveButton.Click += ToggleSide_Click;

                row.Children.Add(nameText);
                row.Children.Add(moveButton);
                (isSafe ? SafePanel : CautionPanel).Children.Add(row);
            }
        }

        private async void ToggleSide_Click(object sender, RoutedEventArgs e)
        {
            Button button = (Button)sender;
            string itemId = (string)button.Tag;

            List<NamedListItem> items = await LocalDataStore.GetListItemsAsync(ListName);
            NamedListItem current = items.Find(i => i.Id == itemId);
            if (current == null)
            {
                return;
            }

            string currentSide = current.Fields.ContainsKey("side") ? current.Fields["side"] : "safe";
            string newSide = currentSide == "caution" ? "safe" : "caution";
            current.Fields["side"] = newSide;
            await LocalDataStore.UpdateListItemAsync(ListName, itemId, current.Fields);
            await LoadAsync();
        }
    }
}
