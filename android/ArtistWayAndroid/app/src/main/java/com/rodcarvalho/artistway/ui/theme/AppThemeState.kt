package com.rodcarvalho.artistway.ui.theme

import androidx.compose.runtime.mutableStateOf

// Estado de tema compartilhado entre AppRoot (aplica) e a aba Aparência
// de Settings (troca) — mesmo papel do ThemeModeService.Apply(mode) do
// UWP, só que sem uma "janela" única pra chamar: aqui é um objeto
// observável simples em vez de introduzir um ViewModel/DI só pra isso.
object AppThemeState {
    val mode = mutableStateOf("auto")
}
