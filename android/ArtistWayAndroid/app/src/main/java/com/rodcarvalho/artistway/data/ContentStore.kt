package com.rodcarvalho.artistway.data

import android.content.Context
import com.rodcarvalho.artistway.data.model.AppContent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json

// Carrega assets/content.json (gerado a partir de www/js/data.js) uma
// única vez na inicialização do app e expõe o conteúdo já tipado.
object ContentStore {
    private val json = Json { ignoreUnknownKeys = true }

    private var loaded: AppContent? = null

    val content: AppContent
        get() = loaded ?: error("ContentStore.initialize() ainda não rodou")

    suspend fun initialize(context: Context) {
        if (loaded != null) return
        val text = withContext(Dispatchers.IO) {
            context.assets.open("content.json").bufferedReader().use { it.readText() }
        }
        loaded = json.decodeFromString(AppContent.serializer(), text)
    }

    // Atalho pra ler UiStrings (www/js/data.js -> UI_STRINGS) com uma rede
    // de segurança: se a chave não existir no content.json (nunca deveria
    // acontecer, mas evita um crash bobo), devolve a própria chave em vez
    // de estourar exceção.
    fun s(key: String): String = loaded?.uiStrings?.get(key) ?: key

    // Mesma coisa, mas substitui placeholders "{nome}" pelos valores em
    // replacements — usado pra textos com variável (ex.: "Dia {day} de
    // {total}"), mesmo padrão em www/js/app.js (função S) e
    // ContentStore.cs (UWP).
    fun s(key: String, vararg replacements: Pair<String, String>): String {
        var text = s(key)
        for ((name, value) in replacements) {
            text = text.replace("{$name}", value)
        }
        return text
    }
}
