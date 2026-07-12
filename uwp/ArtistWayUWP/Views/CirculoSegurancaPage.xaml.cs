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

                Button button = new Button
                {
                    Content = name,
                    HorizontalAlignment = HorizontalAlignment.Stretch,
                    Margin = new Thickness(0, 0, 0, 8),
                    Tag = item.Id,
                };
                button.Click += ToggleSide_Click;
                (isSafe ? SafePanel : CautionPanel).Children.Add(button);
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
