package com.rodcarvalho.artistway.data.model

// Espelha profile.weekCursor no PWA: { weekId, cycleStart }.
data class WeekCursor(
    val weekId: Int,
    val cycleStart: String,
)

// Espelha o objeto "profile" salvo em www/js/db.js (STORES.settings, key
// "profile") / LocalDataStore.cs (SettingsFile).
data class ProfileSettings(
    val name: String = "",
    val startDate: String = "",
    val morningPagesTime: String = "07:00",
    val artistDateDay: String = "7",
    val artistDateTime: String = "16:00",
    val checkinDay: String = "7",
    val checkinTime: String = "19:00",
    val onboarded: Boolean = false,
    val fontSize: String = "medium",
    // "light" / "dark" / "auto" — mesmo campo e mesmos valores de
    // profile.themeMode no PWA (www/js/theme.js), pra sincronizar como a
    // mesma escolha em todos os aparelhos.
    val themeMode: String = "auto",
    // Desliga o checklist/check-in semanal, deixando só Morning Pages e
    // Artist Date — ativado manualmente ou automaticamente quando o
    // dayCount passa de WeekCalculator.PROGRAM_LENGTH_DAYS.
    val maintenanceMode: Boolean = false,
    val contractSignedName: String = "",
    val contractSignedAt: String = "",
    // Controla qual semana está "atual" pra decisão do usuário (continuar
    // na semana ou avançar), em vez de puro cálculo por data — ver
    // WeekCalculator.getWeekCursor. Null até ser semeado na primeira
    // leitura (LocalDataStore.getOrSeedWeekCursor).
    val weekCursor: WeekCursor? = null,
)
