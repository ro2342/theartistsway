using System;
using System.Collections.Generic;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class ProgressPage : Page
    {
        public ProgressPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadAsync();
        }

        private async System.Threading.Tasks.Task LoadAsync()
        {
            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            int currentWeekId = WeekCalculator.GetCurrentWeekId(profile);

            WeekGrid.Children.Clear();
            WeekGrid.RowDefinitions.Clear();
            const int columns = 4;
            int rows = (int)Math.Ceiling(ContentStore.Content.Weeks.Count / (double)columns);
            for (int r = 0; r < rows; r++)
            {
                WeekGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            }

            for (int i = 0; i < ContentStore.Content.Weeks.Count; i++)
            {
                WeekContent week = ContentStore.Content.Weeks[i];
                HashSet<int> doneIndexes = await LocalDataStore.GetDoneChecklistIndexesAsync(week.Id);
                bool complete = week.Checklist.Count > 0 && doneIndexes.Count >= week.Checklist.Count;
                bool current = week.Id == currentWeekId;

                Button chip = new Button
                {
                    Tag = week.Id,
                    Margin = new Thickness(4),
                    HorizontalAlignment = HorizontalAlignment.Stretch,
                    VerticalAlignment = VerticalAlignment.Stretch,
                    MinHeight = 64,
                };
                if (complete)
                {
                    chip.Background = ThemeHelper.AccentBrush();
                }
                else if (current)
                {
                    chip.BorderBrush = ThemeHelper.AccentBrush();
                    chip.BorderThickness = new Thickness(2);
                }

                StackPanel textStack = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center, VerticalAlignment = VerticalAlignment.Center };
                textStack.Children.Add(new TextBlock
                {
                    Text = week.Id.ToString(),
                    HorizontalAlignment = HorizontalAlignment.Center,
                    FontSize = 20,
                });
                textStack.Children.Add(new TextBlock
                {
                    Text = complete ? "feito" : current ? "atual" : "",
                    HorizontalAlignment = HorizontalAlignment.Center,
                    FontSize = 11,
                    Opacity = 0.8,
                });

                Grid content = new Grid();
                content.Children.Add(textStack);
                if (complete)
                {
                    // Selo de semana concluída — um "carimbo" decorativo no
                    // canto, mesmo espírito visual do PWA (.week-chip.complete::after).
                    Border stamp = new Border
                    {
                        Width = 20,
                        Height = 20,
                        CornerRadius = new CornerRadius(10),
                        Background = new Windows.UI.Xaml.Media.SolidColorBrush(Windows.UI.Colors.White),
                        BorderBrush = ThemeHelper.AccentBrush(),
                        BorderThickness = new Thickness(2),
                        HorizontalAlignment = HorizontalAlignment.Right,
                        VerticalAlignment = VerticalAlignment.Top,
                        Margin = new Thickness(0, -8, -8, 0),
                        RenderTransform = new Windows.UI.Xaml.Media.RotateTransform { Angle = -12 },
                    };
                    stamp.Child = new TextBlock
                    {
                        Text = "✓",
                        FontSize = 12,
                        FontWeight = Windows.UI.Text.FontWeights.Bold,
                        Foreground = ThemeHelper.AccentBrush(),
                        HorizontalAlignment = HorizontalAlignment.Center,
                        VerticalAlignment = VerticalAlignment.Center,
                    };
                    content.Children.Add(stamp);
                }
                chip.Content = content;
                chip.Click += Chip_Click;

                Grid.SetRow(chip, i / columns);
                Grid.SetColumn(chip, i % columns);
                WeekGrid.Children.Add(chip);
            }
        }

        private void Chip_Click(object sender, RoutedEventArgs e)
        {
            int weekId = (int)((Button)sender).Tag;
            MainPage.Current.ContentFrame.Navigate(typeof(WeekDetailPage), weekId);
        }
    }
}
