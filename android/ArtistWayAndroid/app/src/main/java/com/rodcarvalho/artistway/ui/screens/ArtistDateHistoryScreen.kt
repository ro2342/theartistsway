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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ArtistDateHistoryItem

// Espelha ArtistDateHistoryPage.xaml.cs — só leitura.
@Composable
fun ArtistDateHistoryScreen() {
    var items by remember { mutableStateOf<List<ArtistDateHistoryItem>>(emptyList()) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        items = LocalDataStore.getAllArtistDates()
        loaded = true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(ContentStore.s("tools.artistDateHistory"), style = MaterialTheme.typography.headlineSmall)
        Text(ContentStore.s("artistDateHistory.subtitle"), style = MaterialTheme.typography.bodyMedium)
        if (loaded && items.isEmpty()) {
            Text(ContentStore.s("artistDateHistory.emptyState"), style = MaterialTheme.typography.bodyMedium)
        }
        items.forEach { item ->
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    item.weekStart + if (item.done) ContentStore.s("artistDateHistory.suffixDone") else ContentStore.s("artistDateHistory.suffixPlanned"),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                if (item.idea.isNotEmpty()) {
                    Text(item.idea, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}
