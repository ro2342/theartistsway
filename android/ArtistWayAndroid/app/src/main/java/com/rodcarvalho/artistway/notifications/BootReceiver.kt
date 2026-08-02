package com.rodcarvalho.artistway.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.rodcarvalho.artistway.data.LocalDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// AlarmManager não sobrevive a reboot (diferente do UWP, onde o sistema
// mantém os toasts agendados sozinho) — reagenda os 3 lembretes assim
// que o aparelho termina de ligar.
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                LocalDataStore.getProfile()?.let { profile ->
                    NotificationScheduler.applySettings(context, profile)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
