package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.rodcarvalho.artistway.data.ContentStore

// Destino ainda não portado do UWP — evita uma tela em branco enquanto as
// próximas fases vão preenchendo cada uma de verdade.
@Composable
fun PlaceholderScreen(title: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(ContentStore.s("common.underConstruction", "title" to title), style = MaterialTheme.typography.bodyLarge)
    }
}
