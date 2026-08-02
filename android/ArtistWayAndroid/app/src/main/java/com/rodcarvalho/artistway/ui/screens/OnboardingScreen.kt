package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.notifications.NotificationScheduler
import com.rodcarvalho.artistway.notifications.rememberNotificationPermissionRequester
import com.rodcarvalho.artistway.ui.components.TimePickerField
import com.rodcarvalho.artistway.ui.components.WeekdayDropdown
import com.rodcarvalho.artistway.week.WeekCalculator
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate

// Mesmo assistente de configuração inicial do UWP (OnboardingPage.xaml.cs) /
// PWA, sem o passo de "já sou usuário — entrar com Google" — esse volta na
// Fase 6 junto com o AuthService de verdade. Passos: boas-vindas / nome e
// data de início / rituais (Morning Pages, Artist Date, check-in) /
// contrato assinável.
@Composable
fun OnboardingScreen(onFinished: () -> Unit) {
    var step by remember { mutableIntStateOf(0) }

    var name by remember { mutableStateOf("") }
    var startDate by remember { mutableStateOf(WeekCalculator.dateToStr(WeekCalculator.startOfWeek(LocalDate.now().plusDays(7)))) }
    var morningPagesTime by remember { mutableStateOf("07:00") }
    var artistDateDay by remember { mutableIntStateOf(7) }
    var artistDateTime by remember { mutableStateOf("16:00") }
    var checkinDay by remember { mutableIntStateOf(7) }
    var checkinTime by remember { mutableStateOf("19:00") }
    var signature by remember { mutableStateOf("") }

    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val requestNotificationPermission = rememberNotificationPermissionRequester()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            when (step) {
                0 -> WelcomeStep(onNext = { step = 1 })
                1 -> NameDateStep(
                    name = name,
                    onNameChange = { name = it },
                    startDate = startDate,
                    onStartDateChange = { startDate = it },
                    onBack = { step = 0 },
                    onNext = { step = 2 },
                )
                2 -> RitualsStep(
                    morningPagesTime = morningPagesTime,
                    onMorningPagesTimeChange = { morningPagesTime = it },
                    artistDateDay = artistDateDay,
                    onArtistDateDayChange = { artistDateDay = it },
                    artistDateTime = artistDateTime,
                    onArtistDateTimeChange = { artistDateTime = it },
                    checkinDay = checkinDay,
                    onCheckinDayChange = { checkinDay = it },
                    checkinTime = checkinTime,
                    onCheckinTimeChange = { checkinTime = it },
                    onBack = { step = 1 },
                    onNext = {
                        if (signature.isEmpty()) signature = name
                        step = 3
                    },
                )
                3 -> ContractStep(
                    name = name.ifEmpty { "___" },
                    signature = signature,
                    onSignatureChange = { signature = it },
                    onBack = { step = 2 },
                    onFinish = {
                        val profile = ProfileSettings(
                            name = name.trim(),
                            startDate = startDate,
                            morningPagesTime = morningPagesTime,
                            artistDateDay = artistDateDay.toString(),
                            artistDateTime = artistDateTime,
                            checkinDay = checkinDay.toString(),
                            checkinTime = checkinTime,
                            onboarded = true,
                            contractSignedName = signature.trim().ifEmpty { name.trim() },
                            contractSignedAt = Instant.now().toString(),
                        )
                        requestNotificationPermission()
                        scope.launch {
                            LocalDataStore.setProfile(profile)
                            NotificationScheduler.applySettings(context, profile)
                            onFinished()
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun WelcomeStep(onNext: () -> Unit) {
    Text("Bem-vindo(a)", style = MaterialTheme.typography.headlineMedium)
    Text(
        "Vamos configurar seu programa de 12 semanas de recuperação criativa, " +
            "baseado no livro The Artist's Way. Leva menos de um minuto.",
        style = MaterialTheme.typography.bodyLarge,
    )
    Button(onClick = onNext, modifier = Modifier.fillMaxWidth()) { Text("Começar") }
}

@Composable
private fun NameDateStep(
    name: String,
    onNameChange: (String) -> Unit,
    startDate: String,
    onStartDateChange: (String) -> Unit,
    onBack: () -> Unit,
    onNext: () -> Unit,
) {
    Text("Seu nome e data de início", style = MaterialTheme.typography.headlineSmall)
    OutlinedTextField(value = name, onValueChange = onNameChange, label = { Text("Como podemos te chamar?") }, modifier = Modifier.fillMaxWidth())
    OutlinedTextField(
        value = startDate,
        onValueChange = onStartDateChange,
        label = { Text("Data de início (aaaa-mm-dd)") },
        modifier = Modifier.fillMaxWidth(),
    )
    StepNavRow(onBack = onBack, onNext = onNext, nextEnabled = name.isNotBlank())
}

@Composable
private fun RitualsStep(
    morningPagesTime: String,
    onMorningPagesTimeChange: (String) -> Unit,
    artistDateDay: Int,
    onArtistDateDayChange: (Int) -> Unit,
    artistDateTime: String,
    onArtistDateTimeChange: (String) -> Unit,
    checkinDay: Int,
    onCheckinDayChange: (Int) -> Unit,
    checkinTime: String,
    onCheckinTimeChange: (String) -> Unit,
    onBack: () -> Unit,
    onNext: () -> Unit,
) {
    Text("Seus rituais", style = MaterialTheme.typography.headlineSmall)
    Text("Quando você prefere ser lembrado(a) de cada hábito?", style = MaterialTheme.typography.bodyMedium)

    Text("Morning Pages (todo dia)", style = MaterialTheme.typography.titleSmall)
    TimePickerField("Horário", morningPagesTime, onMorningPagesTimeChange, modifier = Modifier.fillMaxWidth())

    Text("Artist Date (semanal)", style = MaterialTheme.typography.titleSmall)
    WeekdayDropdown("Dia da semana", artistDateDay, onArtistDateDayChange, modifier = Modifier.fillMaxWidth())
    TimePickerField("Horário", artistDateTime, onArtistDateTimeChange, modifier = Modifier.fillMaxWidth())

    Text("Check-in semanal", style = MaterialTheme.typography.titleSmall)
    WeekdayDropdown("Dia da semana", checkinDay, onCheckinDayChange, modifier = Modifier.fillMaxWidth())
    TimePickerField("Horário", checkinTime, onCheckinTimeChange, modifier = Modifier.fillMaxWidth())

    StepNavRow(onBack = onBack, onNext = onNext)
}

@Composable
private fun ContractStep(
    name: String,
    signature: String,
    onSignatureChange: (String) -> Unit,
    onBack: () -> Unit,
    onFinish: () -> Unit,
) {
    Text("Contrato Inicial", style = MaterialTheme.typography.headlineSmall)
    Text(
        "Eu, $name, me comprometo com 12 semanas de recuperação criativa: " +
            "escrever minhas Morning Pages todos os dias, fazer meu Artist Date " +
            "toda semana, e ser gentil comigo mesmo(a) no caminho.",
        style = MaterialTheme.typography.bodyLarge,
    )
    OutlinedTextField(value = signature, onValueChange = onSignatureChange, label = { Text("Assinatura") }, modifier = Modifier.fillMaxWidth())
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        TextButton(onClick = onBack) { Text("Voltar") }
        Button(onClick = onFinish) { Text("Concluir") }
    }
}

@Composable
private fun StepNavRow(onBack: () -> Unit, onNext: () -> Unit, nextEnabled: Boolean = true) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        TextButton(onClick = onBack) { Text("Voltar") }
        Button(onClick = onNext, enabled = nextEnabled) { Text("Avançar") }
    }
}
