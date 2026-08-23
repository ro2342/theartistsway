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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.NamedListItem
import kotlinx.coroutines.launch

private const val LIST_NAME = "safetyCircle"

// Espelha CirculoSegurancaPage.xaml.cs: duas colunas (Apoia/Cautela),
// construídas sobre o mesmo mecanismo genérico de NamedListItem/lists.json,
// com um botão pra mover o nome de um lado pro outro.
@Composable
fun CirculoSegurancaScreen() {
    var items by remember { mutableStateOf<List<NamedListItem>>(emptyList()) }
    var nameInput by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    suspend fun reload() {
        items = LocalDataStore.getListItems(LIST_NAME).sortedBy { it.updatedAt }
    }

    LaunchedEffect(Unit) { reload() }

    val safeItems = items.filter { it.fields["name"].orEmpty().isNotEmpty() && it.fields["side"] != "caution" }
    val cautionItems = items.filter { it.fields["name"].orEmpty().isNotEmpty() && it.fields["side"] == "caution" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(ContentStore.s("tools.circuloSeguranca"), style = MaterialTheme.typography.headlineSmall)
        Text("quem apoia, quem exige cautela", style = MaterialTheme.typography.bodyMedium)

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(
                value = nameInput,
                onValueChange = { nameInput = it },
                label = { Text("Nome") },
                modifier = Modifier.weight(1f),
            )
            Button(onClick = {
                val name = nameInput.trim()
                if (name.isEmpty()) return@Button
                scope.launch {
                    LocalDataStore.addListItem(LIST_NAME, mapOf("name" to name, "side" to "safe"))
                    nameInput = ""
                    reload()
                }
            }) { Text("Adicionar") }
        }

        Text("Apoia", style = MaterialTheme.typography.titleMedium)
        safeItems.forEach { item -> SafetyCircleRow(item, movingToCaution = true) { scope.launch { toggleSide(item); reload() } } }

        Text("Cautela", style = MaterialTheme.typography.titleMedium)
        cautionItems.forEach { item -> SafetyCircleRow(item, movingToCaution = false) { scope.launch { toggleSide(item); reload() } } }
    }
}

@Composable
private fun SafetyCircleRow(item: NamedListItem, movingToCaution: Boolean, onToggle: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(item.fields["name"].orEmpty(), modifier = Modifier.weight(1f))
        OutlinedButton(onClick = onToggle) {
            Text(if (movingToCaution) "Mover pra Cautela" else "Mover pra Apoia")
        }
    }
}

private suspend fun toggleSide(item: NamedListItem) {
    val currentSide = item.fields["side"] ?: "safe"
    val newSide = if (currentSide == "caution") "safe" else "caution"
    val fields = item.fields.toMutableMap()
    fields["side"] = newSide
    LocalDataStore.updateListItem(LIST_NAME, item.id, fields)
}
