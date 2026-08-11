package com.rodcarvalho.artistway.data.model

import kotlinx.serialization.Serializable

@Serializable
data class ListFieldConfig(
    val key: String = "",
    val label: String = "",
    val multiline: Boolean = false,
)

// Espelha uma entrada de TOOL_CONFIGS em www/js/data.js (via content.json).
// "singleton" marca um formulário de um registro só (editável/sobrescrito,
// ver ui/screens/NamedListScreen) em vez de uma lista que só cresce.
@Serializable
data class NamedListConfig(
    val listName: String = "",
    val title: String = "",
    val subtitle: String = "",
    val singleton: Boolean = false,
    val fields: List<ListFieldConfig> = emptyList(),
    // Semana do livro em que a ferramenta é introduzida pela primeira vez
    // — usado só pra agrupar a tela de Recursos por semana (null =
    // "Geral"). weekNote é um texto livre opcional (ex.: "cresce nas
    // Semanas 2 e 5"); alsoWeeks lista essas mesmas semanas em número,
    // pra ferramenta aparecer de verdade nas abas delas também.
    val week: Int? = null,
    val weekNote: String? = null,
    val alsoWeeks: List<Int> = emptyList(),
)
