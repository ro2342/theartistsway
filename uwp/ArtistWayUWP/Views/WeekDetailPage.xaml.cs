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
                // "citação" (.item-note) do PWA -- marca visualmente que
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
    }
}
