package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.ui.nav.AppDestinations

private sealed interface FerramentasRow {
    data class Heading(val text: String) : FerramentasRow
    data class Link(val label: String, val route: String) : FerramentasRow
}

private fun toolLink(listKey: String): FerramentasRow.Link {
    val title = ContentStore.content.toolConfigs.firstOrNull { it.listName == listKey }?.title ?: listKey
    return FerramentasRow.Link(title, AppDestinations.list(listKey))
}

private fun tabs(): List<Pair<String, List<FerramentasRow>>> = listOf(
    ContentStore.s("recursos.reference.title") to listOf(
        FerramentasRow.Heading("Introdução"),
        FerramentasRow.Link("Princípios Básicos", AppDestinations.PRINCIPIOS_BASICOS),
        FerramentasRow.Heading("Semana 1"),
        FerramentasRow.Link("Crença → Positiva", AppDestinations.TABELA_CRENCAS),
        FerramentasRow.Heading("Semana 2"),
        FerramentasRow.Link("Regras da Estrada", AppDestinations.REGRAS_DA_ESTRADA),
        FerramentasRow.Heading("Semana 8"),
        FerramentasRow.Link("Banco de Afirmações", AppDestinations.BANCO_AFIRMACOES),
    ),
    ContentStore.s("recursos.lists.title") to listOf(
        FerramentasRow.Heading("Semana 1 (cresce nas Semanas 2 e 5)"),
        toolLink("imaginaryLives"),
        FerramentasRow.Heading("Semana 2"),
        toolLink("thingsILike"),
        FerramentasRow.Link("Círculo de Segurança", AppDestinations.CIRCULO_SEGURANCA),
        FerramentasRow.Link("Life Pie", AppDestinations.LIFE_PIE),
        FerramentasRow.Heading("Semana 7"),
        toolLink("jealousyMap"),
    ),
    ContentStore.s("recursos.diaries.title") to listOf(
        FerramentasRow.Heading("Ferramentas Básicas"),
        toolLink("pocoCriativo"),
        FerramentasRow.Heading("Semana 1"),
        toolLink("cartaCriticoInterno"),
        FerramentasRow.Heading("Semana 3"),
        toolLink("sincronicidade"),
        FerramentasRow.Heading("Semana 4"),
        toolLink("diarioLeitura"),
        FerramentasRow.Heading("Semana 9"),
        toolLink("diarioResistencia"),
    ),
    ContentStore.s("recursos.letters.title") to listOf(
        FerramentasRow.Heading("Semana 4"),
        toolLink("carta80anos"),
        toolLink("carta8anos"),
        toolLink("oracaoArtista"),
        FerramentasRow.Heading("Semana 11 (oração reutilizada nas Semanas 6 e 11)"),
        toolLink("cartaEncorajamento"),
    ),
    ContentStore.s("recursos.planning.title") to listOf(
        FerramentasRow.Heading("Semana 8"),
        toolLink("metasNorteVerdadeiro"),
        toolLink("buscaEstilo"),
        toolLink("diaIdeal"),
        FerramentasRow.Heading("Semana 11"),
        toolLink("cadernoDesejos"),
        FerramentasRow.Heading("Semana 12"),
        toolLink("planoContinuidade"),
    ),
    ContentStore.s("recursos.boundaries.title") to listOf(
        FerramentasRow.Heading("Semana 7"),
        toolLink("arqueologia"),
        FerramentasRow.Heading("Semana 9"),
        toolLink("resentimentosMedos"),
        toolLink("retornosEmU"),
        toolLink("totemArtista"),
        FerramentasRow.Heading("Semana 10"),
        toolLink("bottomLine"),
        toolLink("pontosFelicidade"),
    ),
    ContentStore.s("recursos.history.title") to listOf(
        FerramentasRow.Heading("Ferramentas Básicas"),
        FerramentasRow.Link("Histórico de Artist Dates", AppDestinations.ARTIST_DATE_HISTORY),
        FerramentasRow.Heading("Semana 9"),
        FerramentasRow.Link("Reler Check-ins Antigos", AppDestinations.CHECKIN_HISTORY),
    ),
    ContentStore.s("recursos.quiz.title") to listOf(
        FerramentasRow.Heading("Semana 10"),
        FerramentasRow.Link(
            ContentStore.content.quizConfigs.firstOrNull { it.key == "workaholismQuiz" }?.title ?: "Quiz",
            AppDestinations.quiz("workaholismQuiz"),
        ),
    ),
)

// Espelha FerramentasPage.xaml.cs: hub com 8 abas, cada uma listando as
// ferramentas daquela categoria (a maioria dirigida por TOOL_CONFIGS via
// toolLink, mais os destinos bespoke — Círculo de Segurança, Life Pie,
// telas de referência estáticas, histórico e quiz).
@Composable
fun FerramentasScreen(onNavigate: (String) -> Unit) {
    val allTabs = remember { tabs() }
    var selected by remember { mutableIntStateOf(0) }

    Column(modifier = Modifier.fillMaxSize()) {
        ScrollableTabRow(selectedTabIndex = selected) {
            allTabs.forEachIndexed { i, (label, _) ->
                Tab(selected = selected == i, onClick = { selected = i }, text = { Text(label) })
            }
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            allTabs[selected].second.forEach { row ->
                when (row) {
                    is FerramentasRow.Heading -> Text(
                        row.text,
                        style = MaterialTheme.typography.labelLarge,
                        modifier = Modifier.padding(top = 12.dp, bottom = 4.dp),
                    )
                    is FerramentasRow.Link -> OutlinedButton(
                        onClick = { onNavigate(row.route) },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text(row.label) }
                }
            }
        }
    }
}
