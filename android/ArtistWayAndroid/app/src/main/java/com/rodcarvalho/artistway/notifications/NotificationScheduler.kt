package com.rodcarvalho.artistway.notifications

import com.rodcarvalho.artistway.data.model.ProfileSettings

// Placeholder até a Fase 6 (AlarmManager + canais + boot receiver, mesmo
// desenho do NotificationService.cs do UWP: 3 lembretes fixos —
// morningPages/artistDate/checkin — reagendados sempre que o perfil
// muda). Por enquanto só existe pra Onboarding/Profile poderem chamar o
// mesmo hook que o UWP chama depois de salvar o perfil, sem precisar
// mexer nesses dois pontos de novo quando a Fase 6 entrar.
object NotificationScheduler {
    fun applySettings(profile: ProfileSettings) {
        // TODO(Fase 6): cancelar tudo e reagendar os 3 lembretes com
        // AlarmManager a partir de profile.morningPagesTime/artistDateDay/
        // artistDateTime/checkinDay/checkinTime.
    }
}
