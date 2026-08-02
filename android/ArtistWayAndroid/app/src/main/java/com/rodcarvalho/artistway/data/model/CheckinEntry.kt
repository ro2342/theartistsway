package com.rodcarvalho.artistway.data.model

// Chave de `answers` = índice da pergunta (como string, "0", "1", "2"...).
data class CheckinEntry(
    val answers: Map<String, String> = emptyMap(),
    val savedAt: String = "",
)
