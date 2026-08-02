package com.rodcarvalho.artistway.data.model

import kotlinx.serialization.Serializable

@Serializable
data class QuizOption(
    val label: String = "",
    val value: Double = 0.0,
)

@Serializable
data class QuizQuestion(
    val text: String = "",
    val options: List<QuizOption> = emptyList(),
)

@Serializable
data class QuizBand(
    val min: Double = 0.0,
    val max: Double = 0.0,
    val label: String = "",
    val description: String = "",
)

// Espelha uma entrada de QUIZ_CONFIGS em www/js/data.js (via content.json).
@Serializable
data class QuizConfig(
    val key: String = "",
    val title: String = "",
    val subtitle: String = "",
    val questions: List<QuizQuestion> = emptyList(),
    val bands: List<QuizBand> = emptyList(),
)
