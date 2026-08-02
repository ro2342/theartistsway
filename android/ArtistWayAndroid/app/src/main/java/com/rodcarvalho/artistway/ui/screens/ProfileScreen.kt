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
import com.rodcarvalho.artistway.calendar.CalendarIntentHelper
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.notifications.NotificationScheduler
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

    LaunchedEffect(Unit) {
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

    if (!loaded) return

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Meu Perfil", style = MaterialTheme.typography.headlineSmall)

        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            value = startDate,
            onValueChange = { startDate = it },
            label = { Text("Data de início (aaaa-mm-dd)") },
            modifier = Modifier.fillMaxWidth(),
        )

        Text("Morning Pages", style = MaterialTheme.typography.titleSmall)
        TimePickerField("Horário", morningPagesTime, { morningPagesTime = it }, modifier = Modifier.fillMaxWidth())
        OutlinedButton(
            onClick = {
                val (h, m) = parseTimeOrDefault(morningPagesTime, 7, 0)
                CalendarIntentHelper.addDaily(context, "Morning Pages", "3 páginas à mão, sem reler. Companheiro The Artist's Way.", LocalTime.of(h, m))
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Adicionar ao Calendário") }

        Text("Artist Date", style = MaterialTheme.typography.titleSmall)
        WeekdayDropdown("Dia da semana", artistDateDay, { artistDateDay = it }, modifier = Modifier.fillMaxWidth())
        TimePickerField("Horário", artistDateTime, { artistDateTime = it }, modifier = Modifier.fillMaxWidth())
        OutlinedButton(
            onClick = {
                val (h, m) = parseTimeOrDefault(artistDateTime, 16, 0)
                CalendarIntentHelper.addWeekly(
                    context,
                    "Artist Date",
                    "Um encontro solo, só por prazer, para encher o poço criativo. Companheiro The Artist's Way.",
                    artistDateDay,
                    LocalTime.of(h, m),
                    durationMinutes = 90,
                )
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Adicionar ao Calendário") }

        Text("Check-in semanal", style = MaterialTheme.typography.titleSmall)
        WeekdayDropdown("Dia da semana", checkinDay, { checkinDay = it }, modifier = Modifier.fillMaxWidth())
        TimePickerField("Horário", checkinTime, { checkinTime = it }, modifier = Modifier.fillMaxWidth())
        OutlinedButton(
            onClick = {
                val (h, m) = parseTimeOrDefault(checkinTime, 19, 0)
                CalendarIntentHelper.addWeekly(
                    context,
                    "Check-in semanal",
                    "Revisar a semana: Morning Pages, Artist Date e reflexões. Companheiro The Artist's Way.",
                    checkinDay,
                    LocalTime.of(h, m),
                    durationMinutes = 20,
                )
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Adicionar ao Calendário") }

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
                scope.launch {
                    LocalDataStore.setProfile(next)
                    NotificationScheduler.applySettings(next)
                    profile = next
                    savedMessage = "Ajustes salvos e lembretes atualizados."
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Salvar") }

        savedMessage?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
    }
}
