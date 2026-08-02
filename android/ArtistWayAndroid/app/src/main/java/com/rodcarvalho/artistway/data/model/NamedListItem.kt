package com.rodcarvalho.artistway.data.model

// Um item genérico de "lista nomeada" — usado por Vidas Imaginárias, 20
// Coisas que Gosto de Fazer, Mapa do Ciúme, Círculo de Segurança e Life
// Pie. `fields` fica solto (não uma classe por funcionalidade) de
// propósito: cada tela sabe quais chaves ler/escrever, e o mecanismo de
// guardar/sincronizar não precisa mudar quando uma tela nova é
// adicionada. Life Pie usa chaves "ratings.<categoria>" dentro do mesmo
// mapa em vez de um objeto aninhado à parte. Não é @Serializable — vem
// de LocalDataStore.kt, que monta isso a partir do JSON solto de
// lists.json (chaves e nomes de campo variam por ferramenta).
data class NamedListItem(
    val id: String,
    val fields: Map<String, String> = emptyMap(),
    val updatedAt: String = "",
)
