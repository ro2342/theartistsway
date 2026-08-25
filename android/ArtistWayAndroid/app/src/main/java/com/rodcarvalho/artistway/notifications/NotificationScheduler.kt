package com.rodcarvalho.artistway.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId

// Agenda os mesmos 3 lembretes fixos do NotificationService.cs do UWP
// (morningPages/artistDate/checkin), mas com o desenho idiomático do
// Android: um alarme exato pra PRÓXIMA ocorrência só (não N ocorrências
// pré-agendadas de uma vez), reagendado pelo próprio
// NotificationAlarmReceiver assim que dispara — AlarmManager não
// sobrevive a reboot, então BootReceiver reagenda tudo de novo no boot.
object NotificationScheduler {
    private const val REQUEST_MORNING_PAGES = 1001
    private const val REQUEST_ARTIST_DATE = 1002
    private const val REQUEST_CHECKIN = 1003

    const val EXTRA_TYPE = "type"
    const val TYPE_MORNING_PAGES = "morningPages"
    const val TYPE_ARTIST_DATE = "artistDate"
    const val TYPE_CHECKIN = "checkin"

    suspend fun applySettings(context: Context, profile: ProfileSettings) {
        ContentStore.initialize(context)
        NotificationChannels.ensureCreated(context)
        cancelAll(context)

        parseTime(profile.morningPagesTime)?.let { (h, m) ->
            scheduleNextDaily(context, TYPE_MORNING_PAGES, REQUEST_MORNING_PAGES, h, m)
        }
        val artistDateDay = profile.artistDateDay.toIntOrNull()
        if (artistDateDay != null) {
            parseTime(profile.artistDateTime)?.let { (h, m) ->
                scheduleNextWeekly(context, TYPE_ARTIST_DATE, REQUEST_ARTIST_DATE, artistDateDay, h, m)
            }
        }
        val checkinDay = profile.checkinDay.toIntOrNull()
        if (checkinDay != null) {
            parseTime(profile.checkinTime)?.let { (h, m) ->
                scheduleNextWeekly(context, TYPE_CHECKIN, REQUEST_CHECKIN, checkinDay, h, m)
            }
        }
    }

    // Chamado pelo NotificationAlarmReceiver depois de mostrar a
    // notificação, pra reagendar só aquele tipo (usando o horário/dia
    // atuais do perfil — se a pessoa mudou o horário nos Ajustes desde a
    // última vez, o próximo disparo já sai com o horário novo).
    fun rescheduleOne(context: Context, type: String, profile: ProfileSettings) {
        when (type) {
            TYPE_MORNING_PAGES -> parseTime(profile.morningPagesTime)?.let { (h, m) ->
                scheduleNextDaily(context, TYPE_MORNING_PAGES, REQUEST_MORNING_PAGES, h, m)
            }
            TYPE_ARTIST_DATE -> {
                val day = profile.artistDateDay.toIntOrNull()
                if (day != null) {
                    parseTime(profile.artistDateTime)?.let { (h, m) ->
                        scheduleNextWeekly(context, TYPE_ARTIST_DATE, REQUEST_ARTIST_DATE, day, h, m)
                    }
                }
            }
            TYPE_CHECKIN -> {
                val day = profile.checkinDay.toIntOrNull()
                if (day != null) {
                    parseTime(profile.checkinTime)?.let { (h, m) ->
                        scheduleNextWeekly(context, TYPE_CHECKIN, REQUEST_CHECKIN, day, h, m)
                    }
                }
            }
        }
    }

    fun cancelAll(context: Context) {
        val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return
        alarmManager.cancel(pendingIntentFor(context, TYPE_MORNING_PAGES, REQUEST_MORNING_PAGES))
        alarmManager.cancel(pendingIntentFor(context, TYPE_ARTIST_DATE, REQUEST_ARTIST_DATE))
        alarmManager.cancel(pendingIntentFor(context, TYPE_CHECKIN, REQUEST_CHECKIN))
    }

    private fun scheduleNextDaily(context: Context, type: String, requestCode: Int, hour: Int, minute: Int) {
        val now = LocalDateTime.now()
        var next = LocalDate.now().atTime(hour, minute)
        if (next <= now) next = next.plusDays(1)
        scheduleAlarm(context, type, requestCode, next)
    }

    private fun scheduleNextWeekly(context: Context, type: String, requestCode: Int, weekdayIndex: Int, hour: Int, minute: Int) {
        val now = LocalDateTime.now()
        var candidate = LocalDate.now().atTime(hour, minute)
        val targetDow = weekdayIndex - 1 // convenção "1=Domingo...7=Sábado" -> 0=Domingo..6=Sábado
        var diff = (targetDow - (candidate.dayOfWeek.value % 7) + 7) % 7
        if (diff == 0 && candidate <= now) diff = 7
        candidate = candidate.plusDays(diff.toLong())
        scheduleAlarm(context, type, requestCode, candidate)
    }

    private fun scheduleAlarm(context: Context, type: String, requestCode: Int, dateTime: LocalDateTime) {
        val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return
        val triggerAt = dateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntentFor(context, type, requestCode))
    }

    private fun pendingIntentFor(context: Context, type: String, requestCode: Int): PendingIntent {
        val intent = Intent(context, NotificationAlarmReceiver::class.java).putExtra(EXTRA_TYPE, type)
        return PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun parseTime(text: String?): Pair<Int, Int>? {
        if (text.isNullOrEmpty()) return null
        val parts = text.split(":")
        val h = parts.getOrNull(0)?.toIntOrNull() ?: return null
        val m = parts.getOrNull(1)?.toIntOrNull() ?: return null
        return h to m
    }
}
