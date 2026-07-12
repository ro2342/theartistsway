using System.Collections.Generic;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    // Página genérica reaproveitada por Vidas Imaginárias, 20 Coisas que
    // Gosto de Fazer e Mapa do Ciúme -- só muda o esquema de campos
    // (ver Models/NamedListConfig.cs). O parâmetro de navegação é a
    // chave da config (string), não a config em si, pra manter o
    // parâmetro simples de serializar.
    public sealed partial class NamedListPage : Page
    {
        private NamedListConfig _config;
        private readonly Dictionary<string, TextBox> _inputs = new Dictionary<string, TextBox>();

        public NamedListPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _config = NamedListConfigs.Get(e.Parameter as string);
            TitleText.Text = _config.Title;
            SubText.Text = _config.Subtitle;
            BuildFieldInputs();
            _ = LoadItemsAsync();
        }

        private void BuildFieldInputs()
        {
            FieldsPanel.Children.Clear();
            _inputs.Clear();
            foreach (ListFieldConfig field in _config.Fields)
            {
                FieldsPanel.Children.Add(new TextBlock
                {
                    Text = field.Label,
                    Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                    FontWeight = Windows.UI.Text.FontWeights.SemiBold,
                    Margin = new Thickness(0, 8, 0, 4),
                });
                TextBox box = new TextBox
                {
                    AcceptsReturn = field.Multiline,
                    TextWrapping = TextWrapping.Wrap,
                    Height = field.Multiline ? 80 : double.NaN,
                };
                FieldsPanel.Children.Add(box);
                _inputs[field.Key] = box;
            }
        }

        private async void AddItem_Click(object sender, RoutedEventArgs e)
        {
            Dictionary<string, string> fields = new Dictionary<string, string>();
            bool hasContent = false;
            foreach (KeyValuePair<string, TextBox> kv in _inputs)
            {
                string value = kv.Value.Text.Trim();
                fields[kv.Key] = value;
                if (!string.IsNullOrEmpty(value))
                {
                    hasContent = true;
                }
            }
            if (!hasContent)
            {
                return;
            }

            await LocalDataStore.AddListItemAsync(_config.ListName, fields);
            foreach (TextBox box in _inputs.Values)
            {
                box.Text = "";
            }
            await LoadItemsAsync();
        }

        private async Task LoadItemsAsync()
        {
            List<NamedListItem> items = await LocalDataStore.GetListItemsAsync(_config.ListName);
            items.Sort((a, b) => string.CompareOrdinal(a.UpdatedAt, b.UpdatedAt));

            ItemsPanel.Children.Clear();
            foreach (NamedListItem item in items)
            {
                Border card = new Border
                {
                    Style = (Style)Application.Current.Resources["CardBorderStyle"],
                };
                StackPanel stack = new StackPanel();
                foreach (ListFieldConfig field in _config.Fields)
                {
                    string value = item.Fields.ContainsKey(field.Key) ? item.Fields[field.Key] : "";
                    if (string.IsNullOrEmpty(value))
                    {
                        continue;
                    }
                    stack.Children.Add(new TextBlock
                    {
                        Text = _config.Fields.Count > 1 ? $"{field.Label}: {value}" : value,
                        TextWrapping = TextWrapping.Wrap,
                        Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                        Margin = new Thickness(0, 0, 0, 4),
                    });
                }
                card.Child = stack;
                ItemsPanel.Children.Add(card);
            }
        }
    }
}
