package com.rodcarvalho.artistway.week

import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.data.model.WeekCursor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class WeekCalculatorTest {

    private fun profileStartingOn(date: LocalDate) =
        ProfileSettings(startDate = WeekCalculator.dateToStr(date))

    @Test
    fun `startOfWeek anchors to Sunday`() {
        val wednesday = LocalDate.of(2026, 8, 5) // uma quarta-feira
        assertEquals(LocalDate.of(2026, 8, 2), WeekCalculator.startOfWeek(wednesday))
    }

    @Test
    fun `naturalWeekId sem perfil ou startDate cai pra semana 1`() {
        assertEquals(1, WeekCalculator.naturalWeekId(null))
        assertEquals(1, WeekCalculator.naturalWeekId(ProfileSettings(startDate = "")))
    }

    @Test
    fun `naturalWeekId conta semanas cheias desde o inicio`() {
        val threeWeeksAgo = LocalDate.now().minusWeeks(3)
        val profile = profileStartingOn(threeWeeksAgo)
        assertEquals(4, WeekCalculator.naturalWeekId(profile))
    }

    @Test
    fun `naturalWeekId nunca passa de 12`() {
        val longAgo = LocalDate.now().minusWeeks(52)
        val profile = profileStartingOn(longAgo)
        assertEquals(12, WeekCalculator.naturalWeekId(profile))
    }

    @Test
    fun `isWeekCyclePending falso antes dos 7 dias`() {
        val cursor = WeekCursor(weekId = 1, cycleStart = WeekCalculator.dateToStr(LocalDate.now()))
        assertFalse(WeekCalculator.isWeekCyclePending(cursor))
    }

    @Test
    fun `isWeekCyclePending verdadeiro apos 7 dias`() {
        val cursor = WeekCursor(weekId = 1, cycleStart = WeekCalculator.dateToStr(LocalDate.now().minusDays(8)))
        assertTrue(WeekCalculator.isWeekCyclePending(cursor))
    }

    @Test
    fun `isWeekCyclePending nulo ou invalido e falso`() {
        assertFalse(WeekCalculator.isWeekCyclePending(null))
        assertFalse(WeekCalculator.isWeekCyclePending(WeekCursor(weekId = 1, cycleStart = "")))
    }

    @Test
    fun `getWeekCursor usa o cursor existente quando ha um`() {
        val existing = WeekCursor(weekId = 5, cycleStart = "2026-01-01")
        val profile = ProfileSettings(startDate = "2025-01-01", weekCursor = existing)
        assertEquals(existing, WeekCalculator.getWeekCursor(profile))
    }

    @Test
    fun `getWeekCursor semeia pelo calculo natural quando nao ha cursor`() {
        val threeWeeksAgo = LocalDate.now().minusWeeks(3)
        val profile = profileStartingOn(threeWeeksAgo)
        val cursor = WeekCalculator.getWeekCursor(profile)
        assertEquals(4, cursor.weekId)
    }

    @Test
    fun `weekKeyForOffset calcula a data de inicio de uma semana especifica`() {
        val start = LocalDate.of(2026, 1, 4) // um domingo
        val profile = profileStartingOn(start)
        assertEquals("2026-01-04", WeekCalculator.weekKeyForOffset(profile, 1))
        assertEquals("2026-01-11", WeekCalculator.weekKeyForOffset(profile, 2))
        assertEquals("2026-02-15", WeekCalculator.weekKeyForOffset(profile, 7))
    }

    @Test
    fun `getDayCount e isProgramFinished`() {
        val start = LocalDate.now().minusDays(90)
        val profile = profileStartingOn(start)
        assertEquals(91, WeekCalculator.getDayCount(profile))
        assertTrue(WeekCalculator.isProgramFinished(profile))

        val freshProfile = profileStartingOn(LocalDate.now())
        assertEquals(1, WeekCalculator.getDayCount(freshProfile))
        assertFalse(WeekCalculator.isProgramFinished(freshProfile))
    }
}
