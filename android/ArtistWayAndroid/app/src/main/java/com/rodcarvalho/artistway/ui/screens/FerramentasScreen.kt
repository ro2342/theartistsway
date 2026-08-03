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
    data class Link(val label: String, val route: String, val weekNote: String? = null) : FerramentasRow
}

// Telas de ferramenta que não são TOOL_CONFIGS (têm tela própria em vez
// da genérica NamedListScreen) — mesma "semana de introdução" do PWA
// (www/js/app.js, BESPOKE_TOOL_SCREENS), conferida linha a linha contra
// o texto original.
private data class BespokeToolScreen(val title: String, val route: String, val week: Int?, val weekNote: String? = null)

private fun bespokeScreens(): List<BespokeToolScreen> = listOf(
    BespokeToolScreen("Princípios Básicos", AppDestinations.PRINCIPIOS_BASICOS, week = null),
    BespokeToolScreen("Crença → Positiva", AppDestinations.TABELA_CRENCAS, week = 1),
    BespokeToolScreen("Regras da Estrada", AppDestinations.REGRAS_DA_ESTRADA, week = 2),
    BespokeToolScreen("Círculo de Segurança", AppDestinations.CIRCULO_SEGURANCA, week = 2),
    BespokeToolScreen("Life Pie", AppDestinations.LIFE_PIE, week = 2),
    BespokeToolScreen("Banco de Afirmações", AppDestinations.BANCO_AFIRMACOES, week = 8),
    BespokeToolScreen("Histórico de Artist Dates", AppDestinations.ARTIST_DATE_HISTORY, week = null),
    BespokeToolScreen("Reler Check-ins Antigos", AppDestinations.CHECKIN_HISTORY, week = 9),
    BespokeToolScreen(
        ContentStore.content.quizConfigs.firstOrNull { it.key == "workaholismQuiz" }?.title ?: "Quiz",
        AppDestinations.quiz("workaholismQuiz"),
        week = 10,
    ),
)

private fun rowsForWeek(week: Int?, bespoke: List<BespokeToolScreen>): List<FerramentasRow.Link> {
    val fromBespoke = bespoke.filter { it.week == week }
        .map { FerramentasRow.Link(it.title, it.route, it.weekNote) }
    val fromTools = ContentStore.content.toolConfigs.filter { it.week == week }
        .map { FerramentasRow.Link(it.title, AppDestinations.list(it.listName), it.weekNote) }
    return fromBespoke + fromTools
}

// Espelha FerramentasPage.xaml.cs: hub com uma aba por semana (1 a 12,
// só as que já têm alguma ferramenta) + uma aba "Geral" no fim, pra não
// virar uma lista única gigante conforme mais ferramentas vão sendo
// adicionadas (a maioria dirigida por TOOL_CONFIGS, mais os destinos
// bespoke — Círculo de Segurança, Life Pie, telas de referência
// estáticas, histórico e quiz).
@Composable
fun FerramentasScreen(onNavigate: (String) -> Unit) {
    val allTabs = remember {
        val bespoke = bespokeScreens()
        val weekTabs = (1..12).mapNotNull { week ->
            val rows = rowsForWeek(week, bespoke)
            if (rows.isEmpty()) null else "Semana $week" to rows
        }
        weekTabs + ("Geral" to rowsForWeek(null, bespoke))
    }
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
                Column {
                    OutlinedButton(
                        onClick = { onNavigate(row.route) },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text(row.label) }
                    row.weekNote?.let {
                        Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 2.dp))
                    }
                }
            }
        }
    }
}
