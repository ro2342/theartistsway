package com.rodcarvalho.artistway.calendar

import android.content.Context
import android.content.Intent
import android.provider.CalendarContract
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId

// Alternativa nativa ao link do Google Calendar da PWA: abre o app de
// Calendário do sistema (qualquer um instalado) já preenchido, via
// Intent(ACTION_INSERT) — o usuário confirma antes de salvar, mesmo UX
// "mediado pelo sistema" do AppointmentManager.ShowAddAppointmentAsync no
// UWP. Não precisa de permissão de calendário nenhuma (delega pro app de
// Calendário em vez de escrever direto no CalendarContract).
object CalendarIntentHelper {
    // Convenção "1=Domingo...7=Sábado" do resto do app.
    private val RRULE_WEEKDAY = arrayOf("", "SU", "MO", "TU", "WE", "TH", "FR", "SA")

    fun addDaily(context: Context, title: String, description: String, time: LocalTime, durationMinutes: Long = 30) {
        val start = nextOccurrenceToday(time)
        launchInsert(context, title, description, start, start.plusMinutes(durationMinutes), "FREQ=DAILY")
    }

    fun addWeekly(context: Context, title: String, description: String, weekdayIndex: Int, time: LocalTime, durationMinutes: Long = 60) {
        val start = nextOccurrence(weekdayIndex, time)
        val rrule = "FREQ=WEEKLY;BYDAY=${RRULE_WEEKDAY.getOrElse(weekdayIndex) { "SU" }}"
        launchInsert(context, title, description, start, start.plusMinutes(durationMinutes), rrule)
    }

    // java.time.DayOfWeek vai de MONDAY(1) a SUNDAY(7); convertido pra
    // "0=Domingo...6=Sábado" (mesma convenção do WeekCalculator).
    private fun sundayIndex(dow: DayOfWeek): Int = dow.value % 7

    private fun nextOccurrenceToday(time: LocalTime): LocalDateTime {
        val now = LocalDateTime.now()
        var candidate = LocalDate.now().atTime(time)
        if (candidate <= now) candidate = candidate.plusDays(1)
        return candidate
    }

    private fun nextOccurrence(weekdayIndex: Int, time: LocalTime): LocalDateTime {
        val now = LocalDateTime.now()
        val candidate = LocalDate.now().atTime(time)
        val targetDow = weekdayIndex - 1
        var diff = (targetDow - sundayIndex(candidate.dayOfWeek) + 7) % 7
        if (diff == 0 && candidate <= now) diff = 7
        return candidate.plusDays(diff.toLong())
    }

    private fun launchInsert(
        context: Context,
        title: String,
        description: String,
        start: LocalDateTime,
        end: LocalDateTime,
        rrule: String,
    ) {
        val zone = ZoneId.systemDefault()
        val intent = Intent(Intent.ACTION_INSERT).apply {
            data = CalendarContract.Events.CONTENT_URI
            putExtra(CalendarContract.Events.TITLE, title)
            putExtra(CalendarContract.Events.DESCRIPTION, description)
            putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, start.atZone(zone).toInstant().toEpochMilli())
            putExtra(CalendarContract.EXTRA_EVENT_END_TIME, end.atZone(zone).toInstant().toEpochMilli())
            putExtra(CalendarContract.Events.RRULE, rrule)
        }
        if (intent.resolveActivity(context.packageManager) != null) {
            context.startActivity(intent)
        }
    }
}
