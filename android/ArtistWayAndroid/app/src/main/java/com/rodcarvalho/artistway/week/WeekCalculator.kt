package com.rodcarvalho.artistway.week

import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.data.model.WeekCursor
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// Mesma lógica de semana/data que já existe em www/js/app.js
// (getCurrentWeekId, weekKeyForOffset, startOfWeek, dateToStr) e em
// Services/WeekCalculator.cs no UWP.
object WeekCalculator {
    const val PROGRAM_LENGTH_DAYS = 84 // 12 semanas x 7 dias

    private val DATE_FORMAT: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    // java.time.DayOfWeek vai de MONDAY(1) a SUNDAY(7); o resto do app usa
    // a convenção "1=Domingo...7=Sábado" (mesma do PWA e do UWP), então
    // convertemos: SUNDAY(7) -> 0, MONDAY(1) -> 1, ..., SATURDAY(6) -> 6.
    private fun sundayIndex(dow: DayOfWeek): Int = dow.value % 7

    fun startOfWeek(d: LocalDate): LocalDate = d.minusDays(sundayIndex(d.dayOfWeek).toLong())

    fun dateToStr(d: LocalDate): String = d.format(DATE_FORMAT)

    private fun parseDateOrNull(text: String?): LocalDate? {
        if (text.isNullOrEmpty()) return null
        return try {
            LocalDate.parse(text, DATE_FORMAT)
        } catch (e: Exception) {
            null
        }
    }

    // Início da semana corrente pra faixa de Morning Pages da Home,
    // ancorado no dia da semana escolhido em profile.startDate (não
    // necessariamente domingo) — as Morning Pages podem começar em
    // qualquer dia, então a primeira bolinha da faixa tem que ser o mesmo
    // dia da semana marcado como início do programa nos Ajustes/Meu
    // Perfil, não um "últimos 7 dias" genérico.
    fun currentStreakWeekStart(profile: ProfileSettings?, today: LocalDate): LocalDate {
        val startDate = parseDateOrNull(profile?.startDate)
        val startDow = startDate?.dayOfWeek ?: DayOfWeek.SUNDAY
        val diff = (sundayIndex(today.dayOfWeek) - sundayIndex(startDow) + 7) % 7
        return today.minusDays(diff.toLong())
    }

    // Cálculo puramente por data — mesma conta de sempre, mas só serve pra
    // semear o cursor da semana na primeira vez (ver
    // LocalDataStore.getOrSeedWeekCursor). Não decide mais sozinho a
    // semana "atual" — isso passou a ser uma decisão explícita do usuário
    // (continuar na semana ou avançar), guardada em
    // ProfileSettings.weekCursor.
    fun naturalWeekId(profile: ProfileSettings?): Int {
        val startDate = parseDateOrNull(profile?.startDate) ?: return 1
        val start = startOfWeek(startDate)
        val now = startOfWeek(LocalDate.now())
        val diffWeeks = (java.time.temporal.ChronoUnit.DAYS.between(start, now) / 7.0).roundToInt()
        return min(12, max(1, diffWeeks + 1))
    }

    // Fallback puro (sem gravar nada) pra quem só precisa ler a semana
    // atual sem se importar em persistir um cursor recém-semeado. Se o
    // perfil já tem um cursor salvo, usa ele; senão recalcula pela data,
    // igual sempre foi.
    fun getWeekCursor(profile: ProfileSettings?): WeekCursor {
        profile?.weekCursor?.let { return it }
        return WeekCursor(
            weekId = naturalWeekId(profile),
            cycleStart = dateToStr(currentStreakWeekStart(profile, LocalDate.now())),
        )
    }

    // Os 7 dias do ciclo atual já passaram? Se sim, a Home mostra o
    // cartão de decisão (continuar na semana ou ir pra próxima) em vez de
    // trocar de semana sozinha.
    fun isWeekCyclePending(cursor: WeekCursor?): Boolean {
        val cycleStart = parseDateOrNull(cursor?.cycleStart) ?: return false
        return LocalDateTime.now() >= cycleStart.atStartOfDay().plusDays(7)
    }

    fun weekKeyForOffset(profile: ProfileSettings?, weekId: Int): String {
        val startDate = parseDateOrNull(profile?.startDate)
            ?: return dateToStr(startOfWeek(LocalDate.now()))
        val start = startOfWeek(startDate)
        return dateToStr(start.plusDays(((weekId - 1) * 7).toLong()))
    }

    // Contador de dias (Home) — mesmo cálculo do PWA (dayCountSinceStart
    // em app.js), sem guardar nenhum dado novo.
    fun getDayCount(profile: ProfileSettings?): Int? {
        val startDate = parseDateOrNull(profile?.startDate) ?: return null
        return java.time.temporal.ChronoUnit.DAYS.between(startDate, LocalDate.now()).toInt() + 1
    }

    fun isProgramFinished(profile: ProfileSettings?): Boolean {
        val dayCount = getDayCount(profile) ?: return false
        return dayCount > PROGRAM_LENGTH_DAYS
    }
}
