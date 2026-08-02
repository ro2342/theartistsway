package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import kotlinx.coroutines.launch

// Espelha WeekDetailPage.xaml.cs: checklist da semana + cartão "esta é
// (ou não) sua semana atual" com botão de correção manual.
@Composable
fun WeekDetailScreen(weekId: Int, onOpenEssay: () -> Unit, onOpenCheckin: () -> Unit) {
    val week = remember(weekId) { ContentStore.content.weeks.firstOrNull { it.id == weekId } }
    val scope = rememberCoroutineScope()

    var doneIndexes by remember(weekId) { mutableStateOf<Set<Int>>(emptySet()) }
    var currentWeekId by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(weekId) {
        doneIndexes = LocalDataStore.getDoneChecklistIndexes(weekId)
        val profile = LocalDataStore.getProfile()
        if (profile != null) {
            currentWeekId = LocalDataStore.getOrSeedWeekCursor(profile).weekId
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Semana $weekId — ${week?.title.orEmpty()}", style = MaterialTheme.typography.headlineSmall)
        Text(week?.intro.orEmpty(), style = MaterialTheme.typography.bodyLarge)

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedButton(onClick = onOpenEssay) { Text("Ler o ensaio") }
            OutlinedButton(onClick = onOpenCheckin) { Text("Check-in") }
        }

        week?.checklist?.forEachIndexed { index, item ->
            Row(verticalAlignment = Alignment.Top, modifier = Modifier.fillMaxWidth()) {
                Checkbox(
                    checked = doneIndexes.contains(index),
                    onCheckedChange = { checked ->
                        doneIndexes = if (checked) doneIndexes + index else doneIndexes - index
                        scope.launch { LocalDataStore.toggleChecklistItem(weekId, index) }
                    },
                )
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    Text(item.task, style = MaterialTheme.typography.bodyLarge)
                    if (item.detail.isNotBlank()) {
                        Text(item.detail, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }

        currentWeekId?.let { current ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        if (current == weekId) "Esta é a sua semana atual." else "Sua semana atual é a $current.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    if (current != weekId) {
                        Button(
                            onClick = {
                                scope.launch {
                                    val profile = LocalDataStore.getProfile() ?: return@launch
                                    currentWeekId = LocalDataStore.setCurrentWeek(profile, weekId).weekId
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) { Text("Tornar esta a minha semana atual") }
                    }
                }
            }
        }
    }
}
