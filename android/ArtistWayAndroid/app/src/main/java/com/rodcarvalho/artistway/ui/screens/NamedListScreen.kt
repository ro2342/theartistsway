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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.NamedListItem
import kotlinx.coroutines.launch

private const val SINGLETON_ITEM_ID = "singleton"

// Tela genérica reaproveitada por toda ferramenta descrita em
// TOOL_CONFIGS (espelha NamedListPage.xaml.cs) — só muda o esquema de
// campos (NamedListConfig). Quando a config tem singleton=true, vira
// formulário de UM registro só (carregado/sobrescrito na chave fixa
// "singleton"), em vez de lista que só cresce — mesmo armazenamento
// embaixo.
@Composable
fun NamedListScreen(listKey: String) {
    val config = remember(listKey) { ContentStore.content.toolConfigs.firstOrNull { it.listName == listKey } }
    val scope = rememberCoroutineScope()
    val fieldValues = remember(listKey) { mutableStateMapOf<String, String>() }
    var items by remember(listKey) { mutableStateOf<List<NamedListItem>>(emptyList()) }

    LaunchedEffect(listKey) {
        if (config == null) return@LaunchedEffect
        if (config.singleton) {
            val existing = LocalDataStore.getListItems(config.listName).firstOrNull { it.id == SINGLETON_ITEM_ID }
            existing?.fields?.forEach { (k, v) -> fieldValues[k] = v }
        } else {
            items = LocalDataStore.getListItems(config.listName).sortedBy { it.updatedAt }
        }
    }

    if (config == null) {
        PlaceholderScreen(listKey)
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(config.title, style = MaterialTheme.typography.headlineSmall)
        if (config.subtitle.isNotBlank()) {
            Text(config.subtitle, style = MaterialTheme.typography.bodyMedium)
        }

        config.fields.forEach { field ->
            OutlinedTextField(
                value = fieldValues[field.key] ?: "",
                onValueChange = { fieldValues[field.key] = it },
                label = { Text(field.label) },
                minLines = if (field.multiline) 6 else 1,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        Button(
            onClick = {
                val fields = config.fields.associate { it.key to (fieldValues[it.key] ?: "") }
                scope.launch {
                    if (config.singleton) {
                        LocalDataStore.updateListItem(config.listName, SINGLETON_ITEM_ID, fields)
                    } else {
                        if (fields.values.any { it.isNotBlank() }) {
                            LocalDataStore.addListItem(config.listName, fields)
                            config.fields.forEach { fieldValues[it.key] = "" }
                            items = LocalDataStore.getListItems(config.listName).sortedBy { it.updatedAt }
                        }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (config.singleton) ContentStore.s("common.save") else ContentStore.s("common.add"))
        }

        if (!config.singleton) {
            items.asReversed().forEach { item ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        config.fields.forEach { field ->
                            val value = item.fields[field.key].orEmpty()
                            if (value.isNotEmpty()) {
                                val text = if (config.fields.size > 1) ContentStore.s("namedList.fieldValueFormat", "label" to field.label, "value" to value) else value
                                Text(text, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }
        }
    }
}
