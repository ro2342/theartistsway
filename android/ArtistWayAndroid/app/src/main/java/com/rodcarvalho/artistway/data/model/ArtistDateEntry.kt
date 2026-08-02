package com.rodcarvalho.artistway.data.model

data class ArtistDateEntry(
    val done: Boolean = false,
    val idea: String = "",
)

// Uma linha do histórico de Artist Dates (Recursos -> Histórico) — igual
// ArtistDateEntry, mas com a semana (weekStart) junto, já que o histórico
// lista várias semanas de uma vez.
data class ArtistDateHistoryItem(
    val weekStart: String,
    val done: Boolean = false,
    val idea: String = "",
)
