package com.rodcarvalho.artistway.data.model

import kotlinx.serialization.Serializable

@Serializable
data class BeliefPair(
    val negative: String = "",
    val positive: String = "",
)

// Espelha o conteúdo de www/js/data.js — gerado por
// scripts/generate-content-json.js em assets/content.json (não editado à
// mão; o workflow 04-build-apk.yml falha o build se esquecerem de
// regenerar depois de mudar data.js). Decodificado direto por nome de
// campo via kotlinx.serialization — não precisa do parsing manual que o
// ContentStore.cs do UWP faz, porque o Windows.Data.Json ali não tem um
// desserializador por reflexão disponível.
@Serializable
data class AppContent(
    val weeks: List<WeekContent> = emptyList(),
    val checkinCoreQuestions: List<String> = emptyList(),
    val artistDateIdeas: List<String> = emptyList(),
    val roadRules: List<String> = emptyList(),
    val basicPrinciples: List<String> = emptyList(),
    val beliefTable: List<BeliefPair> = emptyList(),
    val affirmations: List<String> = emptyList(),
    val uiStrings: Map<String, String> = emptyMap(),
    val toolConfigs: List<NamedListConfig> = emptyList(),
    val quizConfigs: List<QuizConfig> = emptyList(),
)
