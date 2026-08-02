package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.calendar.CalendarIntentHelper
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ArtistDateEntry
import com.rodcarvalho.artistway.ui.components.parseTimeOrDefault
import com.rodcarvalho.artistway.week.WeekCalculator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import java.time.LocalTime

// Espelha ArtistDatePage.xaml.cs: sorteio de ideia (sem repetir dentro da
// sessão), edição/salvamento, marcar feito, e o botão que abre o app de
// Calendário do sistema já preenchido (via CalendarIntentHelper).
@Composable
fun ArtistDateScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var weekId by remember { mutableStateOf<Int?>(null) }
    var weekKey by remember { mutableStateOf("") }
    var current by remember { mutableStateOf(ArtistDateEntry()) }
    var editing by remember { mutableStateOf(false) }
    var ideaDraft by remember { mutableStateOf("") }
    var artistDateDay by remember { mutableStateOf(7) }
    var artistDateTime by remember { mutableStateOf("16:00") }
    val usedIdeas = remember { mutableSetOf<Int>() }

    LaunchedEffect(Unit) {
        val profile = LocalDataStore.getProfile()
        val cursor = WeekCalculator.getWeekCursor(profile)
        weekId = cursor.weekId
        weekKey = WeekCalculator.weekKeyForOffset(profile, cursor.weekId)
        current = LocalDataStore.getArtistDate(weekKey) ?: ArtistDateEntry()
        artistDateDay = profile?.artistDateDay?.toIntOrNull() ?: 7
        artistDateTime = profile?.artistDateTime ?: "16:00"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(ContentStore.s("nav.artistDate"), style = MaterialTheme.typography.headlineSmall)
        weekId?.let { Text("semana $it", style = MaterialTheme.typography.bodyMedium) }

        if (!editing) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        current.idea.ifBlank { "Nenhuma ideia registrada ainda pra essa semana." },
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    Button(
                        onClick = { current = current.copy(done = !current.done); persist(scope, weekKey, current) { current = it } },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (current.done) "✓ Artist Date dessa semana feito" else "Marcar como feito essa semana")
                    }
                    OutlinedButton(
                        onClick = { ideaDraft = current.idea; editing = true },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Editar ideia") }
                    OutlinedButton(
                        onClick = {
                            val (hour, minute) = parseTimeOrDefault(artistDateTime, 16, 0)
                            CalendarIntentHelper.addWeekly(
                                context,
                                "Artist Date",
                                "Um encontro solo, só por prazer, para encher o poço criativo. Companheiro The Artist's Way.",
                                artistDateDay,
                                LocalTime.of(hour, minute),
                                durationMinutes = 90,
                            )
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Adicionar ao Calendário") }
                }
            }
        } else {
            OutlinedButton(
                onClick = {
                    val ideas = ContentStore.content.artistDateIdeas
                    if (ideas.isNotEmpty()) {
                        if (usedIdeas.size >= ideas.size) usedIdeas.clear()
                        var idx: Int
                        do {
                            idx = ideas.indices.random()
                        } while (usedIdeas.contains(idx))
                        usedIdeas.add(idx)
                        ideaDraft = ideas[idx]
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Sortear ideia") }
            OutlinedTextField(
                value = ideaDraft,
                onValueChange = { ideaDraft = it },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
            )
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = {
                        val next = current.copy(idea = ideaDraft)
                        persist(scope, weekKey, next) { current = it; editing = false }
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Salvar") }
                OutlinedButton(onClick = { editing = false }, modifier = Modifier.fillMaxWidth()) { Text("Cancelar") }
            }
        }
    }
}

private fun persist(
    scope: CoroutineScope,
    weekKey: String,
    entry: ArtistDateEntry,
    onSaved: (ArtistDateEntry) -> Unit,
) {
    scope.launch {
        LocalDataStore.setArtistDate(weekKey, entry)
        onSaved(entry)
    }
}
