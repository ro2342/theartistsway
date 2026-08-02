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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import kotlinx.coroutines.launch

// Espelha CheckinPage.xaml.cs: perguntas fixas (CheckinCoreQuestions) +
// pergunta bônus da semana, pré-preenchidas se já existir um check-in
// salvo.
@Composable
fun CheckinScreen(weekId: Int, onSaved: () -> Unit) {
    val week = ContentStore.content.weeks.firstOrNull { it.id == weekId }
    val questions = remember(weekId) {
        ContentStore.content.checkinCoreQuestions + listOfNotNull(week?.checkinBonus?.takeIf { it.isNotBlank() })
    }
    val answers = remember(weekId) { mutableStateListOf<String>().apply { repeat(questions.size) { add("") } } }
    var loaded by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(weekId) {
        val existing = LocalDataStore.getCheckin(weekId)
        if (existing != null) {
            questions.indices.forEach { i -> answers[i] = existing.answers[i.toString()] ?: "" }
        }
        loaded = true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Check-in — Semana $weekId", style = MaterialTheme.typography.headlineSmall)
        if (loaded) {
            questions.forEachIndexed { i, question ->
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(question, style = MaterialTheme.typography.bodyMedium)
                    OutlinedTextField(
                        value = answers[i],
                        onValueChange = { answers[i] = it },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                    )
                }
            }
            Button(
                onClick = {
                    val payload = questions.indices.associate { i -> i.toString() to answers[i] }
                    scope.launch {
                        LocalDataStore.saveCheckin(weekId, payload)
                        onSaved()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Salvar check-in") }
        }
    }
}
