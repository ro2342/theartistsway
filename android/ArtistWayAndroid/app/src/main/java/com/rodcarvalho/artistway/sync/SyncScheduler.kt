package com.rodcarvalho.artistway.sync

// Placeholder até a Fase 6 (sync real via Firestore REST, mesmo desenho
// do SyncScheduler.cs do UWP: debounce reiniciado a cada escrita local,
// dispara ~5s depois da última mudança, só se houver sessão logada). Por
// enquanto só existe pra LocalDataStore.kt poder chamar o mesmo hook que
// o UWP chama a cada escrita, sem precisar mexer em LocalDataStore de
// novo quando o sync de verdade entrar.
object SyncScheduler {
    fun scheduleSync() {
        // TODO(Fase 6): debounce + SyncService.syncAll().
    }
}
