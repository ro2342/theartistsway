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
import com.rodcarvalho.artistway.data.ContentStore

// Espelha EssayPage.xaml.cs — leitura simples dos parágrafos do ensaio da
// semana, sem estado nenhum.
@Composable
fun EssayScreen(weekId: Int) {
    val week = ContentStore.content.weeks.firstOrNull { it.id == weekId }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Semana $weekId — ${week?.title.orEmpty()}", style = MaterialTheme.typography.headlineSmall)
        week?.essay?.forEach { paragraph ->
            Text(paragraph, style = MaterialTheme.typography.bodyLarge)
        }
    }
}
