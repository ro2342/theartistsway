using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.Foundation;
using Windows.UI;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using Windows.UI.Xaml.Shapes;

namespace ArtistWayUWP.Views
{
    // Gráfico de radar desenhado à mão com Polygon/Line/Ellipse — sem
    // WebView (app 100% nativo) e sem Win2D (nenhuma dependência nova),
    // mesma trigonometria usada no /life-pie do PWA (app.js).
    public sealed partial class LifePiePage : Page
    {
        private sealed class LifePieCategory
        {
            public string Key;
            public string Label;
        }

        private const string ListName = "lifePie";

        private static readonly List<LifePieCategory> Categories = new List<LifePieCategory>
        {
            new LifePieCategory { Key = "espiritualidade", Label = "Espiritualidade" },
            new LifePieCategory { Key = "trabalho", Label = "Trabalho" },
            new LifePieCategory { Key = "lazer", Label = "Lazer" },
            new LifePieCategory { Key = "amigos", Label = "Amigos" },
            new LifePieCategory { Key = "romance", Label = "Romance" },
            new LifePieCategory { Key = "exercicio", Label = "Exercício" },
        };

        private readonly Dictionary<string, double> _ratings = new Dictionary<string, double>();
        private Dictionary<string, double> _previousRatings;
        private readonly Point _center = new Point(150, 150);
        private const double MaxRadius = 110;
        private bool _dragging;

        private Polygon _currentPolygon;
        private Polygon _previousPolygon;
        private readonly List<Ellipse> _handles = new List<Ellipse>();

        public LifePiePage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            _ = LoadAsync();
        }

        private async Task LoadAsync()
        {
            List<NamedListItem> items = await LocalDataStore.GetListItemsAsync(ListName);
            items.Sort((a, b) => string.CompareOrdinal(a.UpdatedAt, b.UpdatedAt));

            NamedListItem previous = items.Count > 0 ? items[items.Count - 1] : null;
            _previousRatings = previous != null ? RatingsFromItem(previous) : null;

            foreach (LifePieCategory cat in Categories)
            {
                _ratings[cat.Key] = _previousRatings != null && _previousRatings.ContainsKey(cat.Key)
                    ? _previousRatings[cat.Key]
                    : 5;
            }

            HintText.Text = "Arraste dentro do gráfico pra ajustar o eixo mais próximo (0 a 10)." +
                (previous != null ? " A silhueta clara mostra o snapshot anterior, pra comparar." : "");

            BuildChrome();
            Redraw();
            LoadHistory(items);
        }

        private void LoadHistory(List<NamedListItem> items)
        {
            HistoryPanel.Children.Clear();
            if (items.Count == 0)
            {
                HistoryCard.Visibility = Visibility.Collapsed;
                return;
            }

            HistoryCard.Visibility = Visibility.Visible;
            for (int i = items.Count - 1; i >= 0; i--)
            {
                NamedListItem item = items[i];
                Dictionary<string, double> ratings = RatingsFromItem(item);
                string date = item.Fields.ContainsKey("date") ? item.Fields["date"] : item.UpdatedAt;
                if (date.Length >= 10)
                {
                    date = date.Substring(0, 10);
                }
                string summary = string.Join(", ", Categories.Select(c =>
                    $"{c.Label.Substring(0, Math.Min(3, c.Label.Length))} {(ratings.ContainsKey(c.Key) ? ratings[c.Key] : 0):0}"));

                HistoryPanel.Children.Add(new TextBlock
                {
                    Text = $"{date} — {summary}",
                    Style = (Style)Application.Current.Resources["BodyTextBlockStyle"],
                    Opacity = 0.85,
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, 0, 0, 4),
                });
            }
        }

        private static Dictionary<string, double> RatingsFromItem(NamedListItem item)
        {
            Dictionary<string, double> result = new Dictionary<string, double>();
            foreach (LifePieCategory cat in Categories)
            {
                string key = "ratings." + cat.Key;
                if (item.Fields.ContainsKey(key) && double.TryParse(item.Fields[key], out double value))
                {
                    result[cat.Key] = value;
                }
            }
            return result;
        }

        private Point AxisPoint(int index, double value)
        {
            double angle = (Math.PI * 2 * index / Categories.Count) - Math.PI / 2;
            double r = (value / 10.0) * MaxRadius;
            return new Point(_center.X + r * Math.Cos(angle), _center.Y + r * Math.Sin(angle));
        }

        private void BuildChrome()
        {
            PieCanvas.Children.Clear();
            _handles.Clear();

            for (int ring = 2; ring <= 10; ring += 2)
            {
                Polygon ringPolygon = new Polygon
                {
                    Stroke = new SolidColorBrush(Color.FromArgb(60, 128, 128, 128)),
                    StrokeThickness = 1,
                    Fill = new SolidColorBrush(Colors.Transparent),
                };
                for (int i = 0; i < Categories.Count; i++)
                {
                    ringPolygon.Points.Add(AxisPoint(i, ring));
                }
                PieCanvas.Children.Add(ringPolygon);
            }

            for (int i = 0; i < Categories.Count; i++)
            {
                Point edge = AxisPoint(i, 10);
                Line axisLine = new Line
                {
                    X1 = _center.X,
                    Y1 = _center.Y,
                    X2 = edge.X,
                    Y2 = edge.Y,
                    Stroke = new SolidColorBrush(Color.FromArgb(60, 128, 128, 128)),
                    StrokeThickness = 1,
                };
                PieCanvas.Children.Add(axisLine);

                Point labelPoint = AxisPoint(i, 11.8);
                TextBlock label = new TextBlock
                {
                    Text = Categories[i].Label,
                    FontSize = 11,
                    Opacity = 0.75,
                    Width = 56,
                    TextAlignment = TextAlignment.Center,
                };
                Canvas.SetLeft(label, labelPoint.X - 28);
                Canvas.SetTop(label, labelPoint.Y - 8);
                PieCanvas.Children.Add(label);
            }

            _previousPolygon = new Polygon
            {
                Stroke = new SolidColorBrush(Color.FromArgb(140, 128, 128, 128)),
                StrokeThickness = 2,
                Fill = new SolidColorBrush(Color.FromArgb(30, 128, 128, 128)),
            };
            PieCanvas.Children.Add(_previousPolygon);

            _currentPolygon = new Polygon
            {
                Stroke = new SolidColorBrush(Color.FromArgb(255, 15, 108, 189)),
                StrokeThickness = 2,
                Fill = new SolidColorBrush(Color.FromArgb(60, 15, 108, 189)),
            };
            PieCanvas.Children.Add(_currentPolygon);

            foreach (LifePieCategory cat in Categories)
            {
                Ellipse handle = new Ellipse
                {
                    Width = 14,
                    Height = 14,
                    Fill = new SolidColorBrush(Color.FromArgb(255, 15, 108, 189)),
                };
                PieCanvas.Children.Add(handle);
                _handles.Add(handle);
            }
        }

        private void Redraw()
        {
            if (_previousRatings != null)
            {
                _previousPolygon.Points.Clear();
                for (int i = 0; i < Categories.Count; i++)
                {
                    double value = _previousRatings.ContainsKey(Categories[i].Key) ? _previousRatings[Categories[i].Key] : 0;
                    _previousPolygon.Points.Add(AxisPoint(i, value));
                }
            }

            _currentPolygon.Points.Clear();
            for (int i = 0; i < Categories.Count; i++)
            {
                Point p = AxisPoint(i, _ratings[Categories[i].Key]);
                _currentPolygon.Points.Add(p);
                Canvas.SetLeft(_handles[i], p.X - 7);
                Canvas.SetTop(_handles[i], p.Y - 7);
            }
        }

        private void UpdateFromPoint(Point point)
        {
            double x = point.X - _center.X;
            double y = point.Y - _center.Y;
            double angle = Math.Atan2(y, x) + Math.PI / 2;
            if (angle < 0)
            {
                angle += Math.PI * 2;
            }
            int index = (int)Math.Round(angle / (Math.PI * 2 / Categories.Count)) % Categories.Count;
            double dist = Math.Sqrt(x * x + y * y);
            double value = Math.Max(0, Math.Min(10, Math.Round(dist / MaxRadius * 10)));
            _ratings[Categories[index].Key] = value;
            Redraw();
        }

        private void PieCanvas_PointerPressed(object sender, PointerRoutedEventArgs e)
        {
            _dragging = true;
            UpdateFromPoint(e.GetCurrentPoint(PieCanvas).Position);
            PieCanvas.CapturePointer(e.Pointer);
        }

        private void PieCanvas_PointerMoved(object sender, PointerRoutedEventArgs e)
        {
            if (_dragging)
            {
                UpdateFromPoint(e.GetCurrentPoint(PieCanvas).Position);
            }
        }

        private void PieCanvas_PointerReleased(object sender, PointerRoutedEventArgs e)
        {
            _dragging = false;
            PieCanvas.ReleasePointerCapture(e.Pointer);
        }

        private async void SaveSnapshot_Click(object sender, RoutedEventArgs e)
        {
            Dictionary<string, string> fields = new Dictionary<string, string>
            {
                ["date"] = DateTime.Now.ToString("yyyy-MM-dd"),
            };
            foreach (LifePieCategory cat in Categories)
            {
                fields["ratings." + cat.Key] = _ratings[cat.Key].ToString("0");
            }
            await LocalDataStore.AddListItemAsync(ListName, fields);
            await LoadAsync();
        }
    }
}
