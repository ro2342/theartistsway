package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

// Tela genérica de referência numerada — reaproveitada por Regras da
// Estrada, Princípios Básicos e Banco de Afirmações (no UWP são três
// páginas quase idênticas: RegrasDaEstradaPage/PrincipiosBasicosPage/
// AfirmacoesPage; aqui é uma tela só, seguindo a mesma filosofia de
// "evitar tela nova quando dá" do resto do projeto).
@Composable
fun NumberedListScreen(title: String, items: List<String>) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(title, style = MaterialTheme.typography.headlineSmall)
        items.forEachIndexed { i, item ->
            Text("${i + 1}. $item", style = MaterialTheme.typography.bodyLarge)
        }
    }
}
