package com.rodcarvalho.artistway.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import com.rodcarvalho.artistway.data.ContentStore

// Um canal por lembrete (em vez de um só) pra deixar o usuário desligar
// só um tipo (ex.: check-in) e manter os outros — o UWP não tem esse
// conceito (toast normal, sem canal), é um ganho nativo do Android.
object NotificationChannels {
    const val MORNING_PAGES = "morningPages"
    const val ARTIST_DATE = "artistDate"
    const val CHECKIN = "checkin"

    fun ensureCreated(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        manager.createNotificationChannels(
            listOf(
                NotificationChannel(MORNING_PAGES, ContentStore.s("home.morningPages.title"), NotificationManager.IMPORTANCE_DEFAULT),
                NotificationChannel(ARTIST_DATE, ContentStore.s("artistDate.calendarEventTitle"), NotificationManager.IMPORTANCE_DEFAULT),
                NotificationChannel(CHECKIN, ContentStore.s("onboarding.rituals.checkinSection"), NotificationManager.IMPORTANCE_DEFAULT),
            ),
        )
    }
}
