package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import com.rodcarvalho.artistway.calendar.CalendarIntentHelper
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.notifications.NotificationScheduler
import com.rodcarvalho.artistway.notifications.rememberNotificationPermissionRequester
import com.rodcarvalho.artistway.ui.components.TimePickerField
import com.rodcarvalho.artistway.ui.components.WeekdayDropdown
import com.rodcarvalho.artistway.ui.components.parseTimeOrDefault
import kotlinx.coroutines.launch
import java.time.LocalTime

// Espelha ProfilePage.xaml.cs: nome, data de início, horários/dias dos
// três rituais, e um botão de "adicionar ao Calendário" pra cada um
// (via CalendarIntentHelper, mesmo espírito do AppointmentService do
// UWP).
@Composable
fun ProfileScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val requestNotificationPermission = rememberNotificationPermissionRequester()

    var loaded by remember { mutableStateOf(false) }
    var profile by remember { mutableStateOf(ProfileSettings()) }
    var name by remember { mutableStateOf("") }
    var startDate by remember { mutableStateOf("") }
    var morningPagesTime by remember { mutableStateOf("07:00") }
    var artistDateDay by remember { mutableIntStateOf(7) }
    var artistDateTime by remember { mutableStateOf("16:00") }
    var checkinDay by remember { mutableIntStateOf(7) }
    var checkinTime by remember { mutableStateOf("19:00") }
    var savedMessage by remember { mutableStateOf<String?>(null) }
    var reloadKey by remember { mutableIntStateOf(0) }

    LaunchedEffect(reloadKey) {
        profile = LocalDataStore.getProfile() ?: ProfileSettings()
        name = profile.name
        startDate = profile.startDate
        morningPagesTime = profile.morningPagesTime
        artistDateDay = profile.artistDateDay.toIntOrNull() ?: 7
        artistDateTime = profile.artistDateTime
        checkinDay = profile.checkinDay.toIntOrNull() ?: 7
        checkinTime = profile.checkinTime
        loaded = true
    }
    // Perfil é uma aba da NavigationBar, cuja composição fica em cache ao
    // trocar de aba (ver MainShell) — sem isso, voltar pra cá depois de
    // sincronizar de outro aparelho mostraria os campos com os valores
    // antigos até reabrir o app.
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        reloadKey++
    }

    if (!loaded) return

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(ContentStore.s("profile.pageTitle"), style = MaterialTheme.typography.headlineSmall)

        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text(ContentStore.s("onboarding.nameDate.nameLabel")) }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            value = startDate,
            onValueChange = { startDate = it },
            label = { Text(ContentStore.s("onboarding.nameDate.startDateLabel")) },
            modifier = Modifier.fillMaxWidth(),
        )

        Text(ContentStore.s("home.morningPages.title"), style = MaterialTheme.typography.titleSmall)
        TimePickerField(ContentStore.s("onboarding.rituals.timeLabel"), morningPagesTime, { morningPagesTime = it }, modifier = Modifier.fillMaxWidth())
        OutlinedButton(
            onClick = {
                val (h, m) = parseTimeOrDefault(morningPagesTime, 7, 0)
                CalendarIntentHelper.addDaily(context, ContentStore.s("home.morningPages.title"), ContentStore.s("morningPages.calendarEventDescription"), LocalTime.of(h, m))
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("profile.addMpCalendarButton")) }

        Text(ContentStore.s("profile.adSectionTitle"), style = MaterialTheme.typography.titleSmall)
        WeekdayDropdown(ContentStore.s("onboarding.rituals.weekdayLabel"), artistDateDay, { artistDateDay = it }, modifier = Modifier.fillMaxWidth())
        TimePickerField(ContentStore.s("onboarding.rituals.timeLabel"), artistDateTime, { artistDateTime = it }, modifier = Modifier.fillMaxWidth())
        OutlinedButton(
            onClick = {
                val (h, m) = parseTimeOrDefault(artistDateTime, 16, 0)
                CalendarIntentHelper.addWeekly(
                    context,
                    ContentStore.s("artistDate.calendarEventTitle"),
                    ContentStore.s("artistDate.calendarEventDescription"),
                    artistDateDay,
                    LocalTime.of(h, m),
                    durationMinutes = 90,
                )
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("profile.addAdCalendarButton")) }

        Text(ContentStore.s("onboarding.rituals.checkinSection"), style = MaterialTheme.typography.titleSmall)
        WeekdayDropdown(ContentStore.s("onboarding.rituals.weekdayLabel"), checkinDay, { checkinDay = it }, modifier = Modifier.fillMaxWidth())
        TimePickerField(ContentStore.s("onboarding.rituals.timeLabel"), checkinTime, { checkinTime = it }, modifier = Modifier.fillMaxWidth())
        OutlinedButton(
            onClick = {
                val (h, m) = parseTimeOrDefault(checkinTime, 19, 0)
                CalendarIntentHelper.addWeekly(
                    context,
                    ContentStore.s("onboarding.rituals.checkinSection"),
                    ContentStore.s("checkin.calendarEventDescription"),
                    checkinDay,
                    LocalTime.of(h, m),
                    durationMinutes = 20,
                )
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("profile.addCiCalendarButton")) }

        Button(
            onClick = {
                val next = profile.copy(
                    name = name.trim(),
                    startDate = startDate,
                    morningPagesTime = morningPagesTime,
                    artistDateDay = artistDateDay.toString(),
                    artistDateTime = artistDateTime,
                    checkinDay = checkinDay.toString(),
                    checkinTime = checkinTime,
                    onboarded = true,
                )
                requestNotificationPermission()
                scope.launch {
                    LocalDataStore.setProfile(next)
                    NotificationScheduler.applySettings(context, next)
                    profile = next
                    savedMessage = ContentStore.s("profile.savedMessage")
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("settings.profile.saveButton")) }

        savedMessage?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
    }
}
