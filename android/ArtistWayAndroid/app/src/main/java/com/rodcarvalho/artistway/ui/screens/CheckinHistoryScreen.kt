package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore

// Espelha CheckinHistoryPage.xaml.cs — índice das 12 semanas, só habilita
// as que já têm check-in salvo.
@Composable
fun CheckinHistoryScreen(onOpenWeek: (Int) -> Unit) {
    var weeksWithCheckin by remember { mutableStateOf<Set<Int>>(emptySet()) }

    LaunchedEffect(Unit) {
        weeksWithCheckin = LocalDataStore.getWeeksWithCheckin()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(ContentStore.s("tools.checkinHistory"), style = MaterialTheme.typography.headlineSmall)
        for (weekId in 1..12) {
            val hasCheckin = weeksWithCheckin.contains(weekId)
            Button(
                onClick = { onOpenWeek(weekId) },
                enabled = hasCheckin,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (hasCheckin) "Semana $weekId — ver check-in" else "Semana $weekId — sem check-in ainda")
            }
        }
    }
}
