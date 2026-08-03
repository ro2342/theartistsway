using System;
using System.Collections.Generic;
using System.Linq;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class FerramentasPage : Page
    {
        // Telas de ferramenta que não são TOOL_CONFIGS (têm página própria
        // em vez da genérica NamedListPage) — mesma "semana de introdução"
        // do PWA (www/js/app.js, BESPOKE_TOOL_SCREENS), conferida linha a
        // linha contra o texto original.
        private sealed class BespokeToolScreen
        {
            public string Title;
            public int? Week;
            public string WeekNote;
            public Action Navigate;
        }

        public FerramentasPage()
        {
            this.InitializeComponent();

            // Cache a instância no Frame em vez de recriar a página a cada
            // navegação — sem isso, ao voltar de uma ferramenta (ex.:
            // Diário de Sincronicidade) o Pivot esquecia a aba selecionada
            // e voltava sempre pra primeira em vez de manter a aba de onde
            // a pessoa veio.
            this.NavigationCacheMode = NavigationCacheMode.Enabled;

            BuildPivot();
        }

        private void BuildPivot()
        {
            List<BespokeToolScreen> bespoke = new List<BespokeToolScreen>
            {
                new BespokeToolScreen { Title = "Princípios Básicos", Week = null, Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(PrincipiosBasicosPage)) },
                new BespokeToolScreen { Title = "Crença → Positiva", Week = 1, Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(TabelaCrencasPage)) },
                new BespokeToolScreen { Title = "Regras da Estrada", Week = 2, Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(RegrasDaEstradaPage)) },
                new BespokeToolScreen { Title = "Círculo de Segurança", Week = 2, Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(CirculoSegurancaPage)) },
                new BespokeToolScreen { Title = "Life Pie", Week = 2, Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(LifePiePage)) },
                new BespokeToolScreen { Title = "Banco de Afirmações", Week = 8, Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(AfirmacoesPage)) },
                new BespokeToolScreen { Title = "Histórico de Artist Dates", Week = null, Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(ArtistDateHistoryPage)) },
                new BespokeToolScreen { Title = "Reler Check-ins Antigos", Week = 9, Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(CheckinHistoryPage)) },
                new BespokeToolScreen
                {
                    Title = ContentStore.Content.QuizConfigs.FirstOrDefault(q => q.Key == "workaholismQuiz")?.Title ?? "Quiz",
                    Week = 10,
                    Navigate = () => MainPage.Current.ContentFrame.Navigate(typeof(QuizPage), "workaholismQuiz"),
                },
            };

            RecursosPivot.Items.Clear();
            for (int week = 1; week <= 12; week++)
            {
                PivotItem item = BuildWeekPivotItem($"Semana {week}", week, bespoke);
                if (item != null)
                {
                    RecursosPivot.Items.Add(item);
                }
            }
            PivotItem geral = BuildWeekPivotItem("Geral", null, bespoke);
            if (geral != null)
            {
                RecursosPivot.Items.Add(geral);
            }
        }

        private PivotItem BuildWeekPivotItem(string header, int? week, List<BespokeToolScreen> bespoke)
        {
            List<NamedListConfig> tools = ContentStore.Content.ToolConfigs.Where(t => t.Week == week).ToList();
            List<BespokeToolScreen> screens = bespoke.Where(b => b.Week == week).ToList();
            if (tools.Count == 0 && screens.Count == 0)
            {
                return null;
            }

            StackPanel panel = new StackPanel();
            bool first = true;
            foreach (BespokeToolScreen screen in screens)
            {
                AddToolButton(panel, screen.Title, screen.WeekNote, screen.Navigate, first);
                first = false;
            }
            foreach (NamedListConfig tool in tools)
            {
                string listName = tool.ListName;
                AddToolButton(panel, tool.Title, tool.WeekNote, () => MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), listName), first);
                first = false;
            }

            return new PivotItem
            {
                Header = header,
                Content = new ScrollViewer
                {
                    Padding = new Thickness(16, 12, 16, 24),
                    Content = panel,
                },
            };
        }

        private static void AddToolButton(StackPanel panel, string title, string weekNote, Action onClick, bool first)
        {
            Button button = new Button
            {
                Content = title,
                HorizontalAlignment = HorizontalAlignment.Stretch,
                Margin = new Thickness(0, first ? 0 : 8, 0, 0),
            };
            button.Click += (s, e) => onClick();
            panel.Children.Add(button);

            if (!string.IsNullOrEmpty(weekNote))
            {
                panel.Children.Add(new TextBlock
                {
                    Text = weekNote,
                    Style = (Style)Application.Current.Resources["CaptionTextBlockStyle"],
                    Opacity = 0.7,
                    Margin = new Thickness(0, 2, 0, 0),
                });
            }
        }
    }
}
