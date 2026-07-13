using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ArtistWayUWP.Views
{
    public sealed partial class FerramentasPage : Page
    {
        public FerramentasPage()
        {
            this.InitializeComponent();

            // Títulos das seções vêm de UI_STRINGS (www/js/data.js), fonte
            // única compartilhada com o PWA — ver ContentStore.S.
            PageTitleText.Text = ContentStore.S("recursos.title");
            PageSubtitleText.Text = ContentStore.S("recursos.subtitle");
            ReferenceTitleText.Text = ContentStore.S("recursos.reference.title");
            ListsTitleText.Text = ContentStore.S("recursos.lists.title");
            DiariesTitleText.Text = ContentStore.S("recursos.diaries.title");
            LettersTitleText.Text = ContentStore.S("recursos.letters.title");
            PlanningTitleText.Text = ContentStore.S("recursos.planning.title");
            BoundariesTitleText.Text = ContentStore.S("recursos.boundaries.title");
            HistoryTitleText.Text = ContentStore.S("recursos.history.title");
            QuizTitleText.Text = ContentStore.S("recursos.quiz.title");
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
