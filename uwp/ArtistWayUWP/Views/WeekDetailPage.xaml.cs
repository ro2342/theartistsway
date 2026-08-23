using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class WeekDetailPage : Page
    {
        private int _weekId;
        private WeekContent _week;
        private ProfileSettings _profile;

        public WeekDetailPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _weekId = e.Parameter is int id ? id : 1;
            _ = LoadAsync();
        }

        private async Task LoadAsync()
        {
            _week = ContentStore.Content.Weeks.FirstOrDefault(w => w.Id == _weekId);
            HeaderText.Text = $"Semana {_weekId} — {_week?.Title}";
            IntroText.Text = _week?.Intro ?? "";

            HashSet<int> done = await LocalDataStore.GetDoneChecklistIndexesAsync(_weekId);
            ChecklistPanel.Children.Clear();
            if (_week == null)
            {
                return;
            }

            for (int i = 0; i < _week.Checklist.Count; i++)
            {
                ChecklistItem item = _week.Checklist[i];

                // Borda à esquerda no detalhe da tarefa, mesmo espírito da
                // "citação" (.item-note) do PWA — marca visualmente que
                // aquele texto é o detalhamento da tarefa acima, não uma
                // frase solta.
                Border detailBorder = new Border
                {
                    BorderThickness = new Thickness(2, 0, 0, 0),
                    BorderBrush = ThemeHelper.AccentBrush(),
                    Padding = new Thickness(8, 0, 0, 0),
                    Margin = new Thickness(0, 4, 0, 0),
                    Child = new TextBlock
                    {
                        Text = item.Detail,
                        TextWrapping = TextWrapping.Wrap,
                        Opacity = 0.7,
                        FontStyle = FontStyle.Italic,
                        FontSize = 12,
                    },
                };

                StackPanel textPanel = new StackPanel();
                textPanel.Children.Add(new TextBlock { Text = item.Task, TextWrapping = TextWrapping.Wrap });
                textPanel.Children.Add(detailBorder);

                // Quando a tarefa tem uma ferramenta dedicada (ex.: "Life
                // Pie", uma das listas de Recursos), mostra um link
                // tocável levando direto pra lá — sem isso, a tarefa só
                // dizia o que fazer, sem oferecer o caminho até a
                // ferramenta que já existe pronta pra fazer exatamente
                // aquilo.
                string linkTitle = ResolveLinkTitle(item.Link);
                if (linkTitle != null)
                {
                    HyperlinkButton linkButton = new HyperlinkButton
                    {
                        Content = $"Toque aqui para abrir: {linkTitle} →",
                        Margin = new Thickness(0, 4, 0, 0),
                        Padding = new Thickness(0),
                        Tag = item.Link,
                    };
                    linkButton.Click += ChecklistLink_Click;
                    textPanel.Children.Add(linkButton);
                }

                CheckBox cb = new CheckBox
                {
                    Content = textPanel,
                    Tag = i,
                    Margin = new Thickness(0, 8, 0, 8),
                    IsChecked = done.Contains(i),
                };
                // Assina os eventos só depois de definir o estado inicial,
                // senão o próprio IsChecked acima já dispara
                // Checked/Unchecked e desfaz o valor salvo.
                cb.Checked += ChecklistItem_Toggled;
                cb.Unchecked += ChecklistItem_Toggled;

                ChecklistPanel.Children.Add(cb);

                if (i < _week.Checklist.Count - 1)
                {
                    ChecklistPanel.Children.Add(new Border
                    {
                        BorderThickness = new Thickness(0, 0, 0, 1),
                        BorderBrush = (Brush)Application.Current.Resources["SystemControlForegroundBaseLowBrush"],
                        Margin = new Thickness(0, 0, 0, 4),
                    });
                }
            }

            _profile = await LocalDataStore.GetProfileAsync();
            if (_profile != null)
            {
                WeekCursor cursor = await LocalDataStore.GetOrSeedWeekCursorAsync(_profile);
                bool isCurrent = cursor.WeekId == _weekId;
                CurrentWeekCard.Visibility = Visibility.Visible;
                CurrentWeekStatusText.Text = isCurrent
                    ? "Esta é a sua semana atual."
                    : $"Sua semana atual é a {cursor.WeekId}.";
                SetCurrentWeekButton.Visibility = isCurrent ? Visibility.Collapsed : Visibility.Visible;
            }
        }

        private async void ChecklistItem_Toggled(object sender, RoutedEventArgs e)
        {
            int idx = (int)((CheckBox)sender).Tag;
            await LocalDataStore.ToggleChecklistItemAsync(_weekId, idx);
        }

        private void OpenEssay_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(EssayPage), _weekId);
        }

        private void OpenCheckin_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(CheckinPage), _weekId);
        }

        private async void SetCurrentWeek_Click(object sender, RoutedEventArgs e)
        {
            if (_profile == null)
            {
                return;
            }
            await LocalDataStore.SetCurrentWeekAsync(_profile, _weekId);
            await TileService.UpdateAsync();
            await LoadAsync();
        }

        // Título de exibição pra um ChecklistLink — "list" busca o título
        // já cadastrado em ToolConfigs (mesma fonte da tela de Recursos);
        // "screen" é um punhado fixo de telas sem TOOL_CONFIGS (Life Pie,
        // Círculo de Segurança, Princípios Básicos).
        private static string ResolveLinkTitle(ChecklistLink link)
        {
            if (link == null)
            {
                return null;
            }
            if (link.Type == "list")
            {
                return ContentStore.Content.ToolConfigs
                    .FirstOrDefault(t => t.ListName == link.Key)?.Title;
            }
            if (link.Type == "screen")
            {
                switch (link.Key)
                {
                    case "lifePie": return ContentStore.S("tools.lifePie");
                    case "circuloSeguranca": return ContentStore.S("tools.circuloSeguranca");
                    case "principiosBasicos": return ContentStore.S("tools.principiosBasicos");
                    case "artistDate": return "Artist Date";
                    default: return null;
                }
            }
            return null;
        }

        private void ChecklistLink_Click(object sender, RoutedEventArgs e)
        {
            ChecklistLink link = (ChecklistLink)((HyperlinkButton)sender).Tag;
            if (link.Type == "list")
            {
                MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), link.Key);
            }
            else if (link.Type == "screen")
            {
                switch (link.Key)
                {
                    case "lifePie":
                        MainPage.Current.ContentFrame.Navigate(typeof(LifePiePage));
                        break;
                    case "circuloSeguranca":
                        MainPage.Current.ContentFrame.Navigate(typeof(CirculoSegurancaPage));
                        break;
                    case "principiosBasicos":
                        MainPage.Current.ContentFrame.Navigate(typeof(PrincipiosBasicosPage));
                        break;
                    case "artistDate":
                        MainPage.Current.ContentFrame.Navigate(typeof(ArtistDatePage));
                        break;
                }
            }
        }
    }
}
