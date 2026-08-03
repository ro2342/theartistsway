package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardColors
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.week.WeekCalculator

// Espelha ProgressPage.xaml.cs: grade de 12 semanas, cartão cheio =
// concluída, borda de destaque = atual.
@Composable
fun ProgressScreen(onOpenWeek: (Int) -> Unit) {
    var currentWeekId by remember { mutableStateOf(1) }
    var completedWeeks by remember { mutableStateOf<Set<Int>>(emptySet()) }
    var reloadKey by remember { mutableIntStateOf(0) }

    LaunchedEffect(reloadKey) {
        val profile = LocalDataStore.getProfile()
        currentWeekId = WeekCalculator.getWeekCursor(profile).weekId
        val completed = mutableSetOf<Int>()
        for (week in ContentStore.content.weeks) {
            val done = LocalDataStore.getDoneChecklistIndexes(week.id)
            if (week.checklist.isNotEmpty() && done.size >= week.checklist.size) {
                completed.add(week.id)
            }
        }
        completedWeeks = completed
    }
    // Progresso é uma aba da NavigationBar em cache (ver MainShell) —
    // sem isso, voltar pra cá depois de completar tarefas em outra
    // semana ou sincronizar de outro aparelho mostraria a grade
    // desatualizada até reabrir o app.
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        reloadKey++
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(4),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxSize(),
    ) {
        items(ContentStore.content.weeks) { week ->
            val complete = completedWeeks.contains(week.id)
            val current = week.id == currentWeekId
            val colors: CardColors = if (complete) {
                CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary, contentColor = MaterialTheme.colorScheme.onPrimary)
            } else {
                CardDefaults.cardColors()
            }
            val border = if (!complete && current) BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null

            Card(
                onClick = { onOpenWeek(week.id) },
                colors = colors,
                border = border,
                modifier = Modifier.aspectRatio(1f).fillMaxSize(),
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(week.id.toString(), style = MaterialTheme.typography.titleLarge)
                    val caption = if (complete) "feito" else if (current) "atual" else ""
                    if (caption.isNotEmpty()) {
                        Text(caption, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}
