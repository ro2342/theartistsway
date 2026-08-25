package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
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
import java.time.LocalDate

// Tela genérica de quiz, dirigida por QUIZ_CONFIGS (espelha
// QuizPage.xaml.cs). Cada tentativa vira um item novo no store "lists"
// (mesma chave do quiz, append-only) — histórico de tentativas.
@Composable
fun QuizScreen(quizKey: String) {
    val quiz = remember(quizKey) { ContentStore.content.quizConfigs.firstOrNull { it.key == quizKey } }
    val scope = rememberCoroutineScope()
    val answers = remember(quizKey) { mutableStateMapOf<Int, Double>() }
    var resultText by remember(quizKey) { mutableStateOf<String?>(null) }
    var history by remember(quizKey) { mutableStateOf<List<NamedListItem>>(emptyList()) }

    LaunchedEffect(quizKey) {
        if (quiz != null) {
            history = LocalDataStore.getListItems(quiz.key).sortedByDescending { it.updatedAt }
        }
    }

    if (quiz == null) {
        PlaceholderScreen(quizKey)
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(quiz.title, style = MaterialTheme.typography.headlineSmall)
        if (quiz.subtitle.isNotBlank()) {
            Text(quiz.subtitle, style = MaterialTheme.typography.bodyMedium)
        }

        quiz.questions.forEachIndexed { qi, question ->
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("${qi + 1}. ${question.text}", style = MaterialTheme.typography.bodyLarge)
                question.options.forEach { option ->
                    val selected = answers[qi] == option.value
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .selectable(selected = selected, onClick = { answers[qi] = option.value }),
                    ) {
                        RadioButton(selected = selected, onClick = { answers[qi] = option.value })
                        Text(option.label, modifier = Modifier.padding(start = 4.dp))
                    }
                }
            }
        }

        Button(
            onClick = {
                if (answers.size < quiz.questions.size) {
                    resultText = ContentStore.s("quiz.resultPrompt")
                    return@Button
                }
                val total = quiz.questions.indices.sumOf { answers[it] ?: 0.0 }
                val band = quiz.bands.firstOrNull { total >= it.min && total <= it.max } ?: quiz.bands.lastOrNull()
                resultText = if (band != null) {
                    ContentStore.s("quiz.resultWithBand", "score" to total.toString(), "bandLabel" to band.label, "description" to band.description)
                } else {
                    ContentStore.s("quiz.resultNoBand", "score" to total.toString())
                }

                scope.launch {
                    LocalDataStore.addListItem(
                        quiz.key,
                        mapOf(
                            "score" to total.toString(),
                            "bandLabel" to (band?.label ?: ""),
                            "date" to LocalDate.now().toString(),
                        ),
                    )
                    history = LocalDataStore.getListItems(quiz.key).sortedByDescending { it.updatedAt }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("quiz.seeResultButton")) }

        resultText?.let { Text(it, style = MaterialTheme.typography.bodyLarge) }

        if (history.isNotEmpty()) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(ContentStore.s("quiz.historyTitle"), style = MaterialTheme.typography.titleMedium)
                    history.forEach { item ->
                        val date = item.fields["date"].orEmpty()
                        val score = item.fields["score"].orEmpty()
                        val band = item.fields["bandLabel"].orEmpty()
                        Text(ContentStore.s("quiz.historyEntry", "date" to date, "score" to score, "band" to band), style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}
