package com.rodcarvalho.artistway.sync

import androidx.compose.runtime.mutableStateOf

enum class SyncPhase { IDLE, SYNCING, SUCCESS, ERROR }

// Estado de sincronização compartilhado pelo app inteiro — a MainShell lê
// isto pra pintar o ícone da TopAppBar (visível em qualquer tela, não só
// em Ajustes), e tanto o toque nesse ícone quanto o auto-sync em segundo
// plano (SyncScheduler) passam por aqui, então os dois mantêm o mesmo
// indicador em dia.
object SyncStatus {
    val phase = mutableStateOf(SyncPhase.IDLE)

    suspend fun run(): String {
        phase.value = SyncPhase.SYNCING
        val result = SyncService.syncAll()
        phase.value = when {
            result.startsWith("Sincronizado") -> SyncPhase.SUCCESS
            result.startsWith("Não logado") -> SyncPhase.IDLE
            else -> SyncPhase.ERROR
        }
        return result
    }
}
