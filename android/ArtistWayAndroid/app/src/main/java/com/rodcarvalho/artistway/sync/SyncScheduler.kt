package com.rodcarvalho.artistway.sync

import com.rodcarvalho.artistway.auth.AuthService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Agenda uma sincronização ~5s depois da última mudança local — espera
// a "rajada" de toques parar antes de gastar uma chamada de rede, mesmo
// desenho do SyncScheduler.cs (UWP: DispatcherTimer reiniciado a cada
// chamada). Chamado pelos métodos do LocalDataStore que gravam dado do
// usuário. Não faz nada se ninguém estiver logado.
object SyncScheduler {
    private val scope = CoroutineScope(Dispatchers.Default)
    private var pendingJob: Job? = null

    fun scheduleSync() {
        if (AuthService.currentUser == null) return
        pendingJob?.cancel()
        pendingJob = scope.launch {
            delay(5000)
            SyncService.syncAll()
        }
    }
}
