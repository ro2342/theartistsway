using System.Collections.Generic;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    // Índice das 12 semanas — toca numa que já tem check-in salvo e abre
    // a CheckinPage já existente, que pré-preenche as respostas sozinha.
    // Não guarda nada novo, só lê LocalDataStore.GetWeeksWithCheckinAsync.
    public sealed partial class CheckinHistoryPage : Page
    {
        public CheckinHistoryPage()
        {
            this.InitializeComponent();
        }

        protected override async void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            HashSet<int> weeksWithCheckin = await LocalDataStore.GetWeeksWithCheckinAsync();

            WeeksPanel.Children.Clear();
            for (int weekId = 1; weekId <= 12; weekId++)
            {
                bool hasCheckin = weeksWithCheckin.Contains(weekId);
                Button button = new Button
                {
                    Content = hasCheckin ? $"Semana {weekId} — ver check-in" : $"Semana {weekId} — sem check-in ainda",
                    HorizontalAlignment = HorizontalAlignment.Stretch,
                    Margin = new Thickness(0, weekId == 1 ? 0 : 8, 0, 0),
                    IsEnabled = hasCheckin,
                    Tag = weekId,
                };
                button.Click += Week_Click;
                WeeksPanel.Children.Add(button);
            }
        }

        private void Week_Click(object sender, RoutedEventArgs e)
        {
            int weekId = (int)((Button)sender).Tag;
            MainPage.Current.ContentFrame.Navigate(typeof(CheckinPage), weekId);
        }
    }
}
