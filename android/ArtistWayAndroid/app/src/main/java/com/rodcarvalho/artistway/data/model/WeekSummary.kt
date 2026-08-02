package com.rodcarvalho.artistway.data.model

// Resumo mostrado no cartão de decisão da Home quando os 7 dias de uma
// semana terminam (ver LocalDataStore.buildWeekSummary).
data class WeekSummary(
    val weekId: Int,
    val doneCount: Int,
    val totalItems: Int,
    val checkinDone: Boolean,
    val artistDateDone: Boolean,
    val morningPagesDone: Int,
)
