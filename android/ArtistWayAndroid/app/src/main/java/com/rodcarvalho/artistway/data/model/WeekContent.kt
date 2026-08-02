package com.rodcarvalho.artistway.data.model

import kotlinx.serialization.Serializable

@Serializable
data class ChecklistItem(
    val task: String = "",
    val detail: String = "",
)

@Serializable
data class WeekContent(
    val id: Int,
    val title: String = "",
    val intro: String = "",
    val essay: List<String> = emptyList(),
    val checklist: List<ChecklistItem> = emptyList(),
    val checkinBonus: String = "",
)
