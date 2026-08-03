package com.rodcarvalho.artistway.data.model

import kotlinx.serialization.Serializable

// "list" -> NamedListScreen(listKey); "screen" -> uma das poucas telas
// fixas de ferramenta (lifePie, circuloSeguranca, principiosBasicos).
@Serializable
data class ChecklistLink(
    val type: String = "",
    val key: String = "",
)

@Serializable
data class ChecklistItem(
    val task: String = "",
    val detail: String = "",
    val link: ChecklistLink? = null,
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
