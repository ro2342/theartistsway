package com.rodcarvalho.artistway.notifications

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.rodcarvalho.artistway.MainActivity
import com.rodcarvalho.artistway.R
import com.rodcarvalho.artistway.data.LocalDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

private data class NotificationContent(val channelId: String, val title: String, val body: String, val notificationId: Int)

// Dispara quando um dos 3 alarmes agendados por NotificationScheduler
// chega — mostra a notificação e reagenda a próxima ocorrência daquele
// mesmo tipo (mesmo texto de MorningPages/ArtistDate/Checkin do
// NotificationService.cs do UWP).
class NotificationAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val type = intent.getStringExtra(NotificationScheduler.EXTRA_TYPE) ?: return
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                showNotification(context, type)
                LocalDataStore.getProfile()?.let { profile ->
                    NotificationScheduler.rescheduleOne(context, type, profile)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }

    private fun showNotification(context: Context, type: String) {
        val content = when (type) {
            NotificationScheduler.TYPE_MORNING_PAGES -> NotificationContent(
                NotificationChannels.MORNING_PAGES,
                "Hora das Morning Pages ✍️",
                "Três páginas, sem reler. Só você e o papel.",
                1001,
            )
            NotificationScheduler.TYPE_ARTIST_DATE -> NotificationContent(
                NotificationChannels.ARTIST_DATE,
                "Que tal um Artist Date? 🎨",
                "Reserve um tempinho sozinho(a) essa semana, só por prazer.",
                1002,
            )
            NotificationScheduler.TYPE_CHECKIN -> NotificationContent(
                NotificationChannels.CHECKIN,
                "Check-in semanal 📓",
                "Hora de revisar como foi sua semana criativa.",
                1003,
            )
            else -> return
        }

        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentIntent = PendingIntent.getActivity(
            context,
            content.notificationId,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(context, content.channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(content.title)
            .setContentText(content.body)
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .build()

        NotificationManagerCompat.from(context).notify(content.notificationId, notification)
    }
}
