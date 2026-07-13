using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ArtistWayUWP.Views
{
    public sealed partial class FerramentasPage : Page
    {
        public FerramentasPage()
        {
            this.InitializeComponent();

            // Cache a instância no Frame em vez de recriar a página a cada
            // navegação — sem isso, ao voltar de uma ferramenta (ex.:
            // Diário de Sincronicidade) o Pivot esquecia a aba selecionada
            // e voltava sempre pra primeira ("Referência") em vez de
            // manter a aba de onde a pessoa veio (ex.: "Diários").
            this.NavigationCacheMode = NavigationCacheMode.Enabled;

            // Títulos das abas vêm de UI_STRINGS (www/js/data.js), fonte
            // única compartilhada com o PWA — ver ContentStore.S.
            ReferenceTab.Header = ContentStore.S("recursos.reference.title");
            ListsTab.Header = ContentStore.S("recursos.lists.title");
            DiariesTab.Header = ContentStore.S("recursos.diaries.title");
            LettersTab.Header = ContentStore.S("recursos.letters.title");
            PlanningTab.Header = ContentStore.S("recursos.planning.title");
            BoundariesTab.Header = ContentStore.S("recursos.boundaries.title");
            HistoryTab.Header = ContentStore.S("recursos.history.title");
            QuizTab.Header = ContentStore.S("recursos.quiz.title");
        }

        // — Referência —

        private void OpenRoadRules_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(RegrasDaEstradaPage));
        }

        private void OpenPrinciples_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(PrincipiosBasicosPage));
        }

        private void OpenBeliefTable_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(TabelaCrencasPage));
        }

        // — Listas e mapas —

        private void OpenImaginaryLives_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "imaginaryLives");
        }

        private void OpenThingsILike_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "thingsILike");
        }

        private void OpenJealousyMap_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "jealousyMap");
        }

        private void OpenSafetyCircle_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(CirculoSegurancaPage));
        }

        private void OpenLifePie_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(LifePiePage));
        }

        // — Diários —

        private void OpenSincronicidade_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "sincronicidade");
        }

        private void OpenPocoCriativo_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "pocoCriativo");
        }

        private void OpenDiarioResistencia_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "diarioResistencia");
        }

        private void OpenCartaCriticoInterno_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "cartaCriticoInterno");
        }

        private void OpenDiarioLeitura_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "diarioLeitura");
        }

        // — Cartas —

        private void OpenCarta80_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "carta80anos");
        }

        private void OpenCarta8_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "carta8anos");
        }

        private void OpenOracaoArtista_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "oracaoArtista");
        }

        private void OpenCartaEncorajamento_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "cartaEncorajamento");
        }

        // — Planejamento —

        private void OpenMetasNorteVerdadeiro_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "metasNorteVerdadeiro");
        }

        private void OpenBuscaEstilo_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "buscaEstilo");
        }

        private void OpenDiaIdeal_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "diaIdeal");
        }

        private void OpenCadernoDesejos_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "cadernoDesejos");
        }

        private void OpenPlanoContinuidade_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "planoContinuidade");
        }

        // — Limites e memórias —

        private void OpenResentimentosMedos_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "resentimentosMedos");
        }

        private void OpenRetornosEmU_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "retornosEmU");
        }

        private void OpenArqueologia_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "arqueologia");
        }

        private void OpenBottomLine_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "bottomLine");
        }

        private void OpenPontosFelicidade_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "pontosFelicidade");
        }

        private void OpenTotemArtista_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(NamedListPage), "totemArtista");
        }

        // — Histórico —

        private void OpenArtistDateHistory_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(ArtistDateHistoryPage));
        }

        private void OpenCheckinHistory_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(CheckinHistoryPage));
        }

        // — Quiz —

        private void OpenWorkaholismQuiz_Click(object sender, RoutedEventArgs e)
        {
            MainPage.Current.ContentFrame.Navigate(typeof(QuizPage), "workaholismQuiz");
        }
    }
}
