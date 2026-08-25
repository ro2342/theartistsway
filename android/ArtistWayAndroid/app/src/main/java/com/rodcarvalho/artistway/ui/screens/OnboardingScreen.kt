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
import com.rodcarvalho.artistway.auth.AuthService
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.notifications.NotificationScheduler
import com.rodcarvalho.artistway.notifications.rememberNotificationPermissionRequester
import com.rodcarvalho.artistway.sync.SyncService
import com.rodcarvalho.artistway.ui.components.TimePickerField
import com.rodcarvalho.artistway.ui.components.WeekdayDropdown
import com.rodcarvalho.artistway.week.WeekCalculator
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate

// Mesmo assistente de configuração inicial do UWP (OnboardingPage.xaml.cs) /
// PWA. Passos: já é usuário (entrar com Google) / boas-vindas / nome e
// data de início / rituais (Morning Pages, Artist Date, check-in) /
// contrato assinável. Quem entra com Google e já tem perfil salvo na
// nuvem pula direto pro app, sem passar pelo resto do formulário.
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
                0 -> ReturningUserStep(
                    onSkip = { step = 1 },
                    onLoggedInWithProfile = { onFinished() },
                )
                1 -> WelcomeStep(onNext = { step = 2 })
                2 -> NameDateStep(
                    name = name,
                    onNameChange = { name = it },
                    startDate = startDate,
                    onStartDateChange = { startDate = it },
                    onBack = { step = 1 },
                    onNext = { step = 3 },
                )
                3 -> RitualsStep(
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
                    onBack = { step = 2 },
                    onNext = {
                        if (signature.isEmpty()) signature = name
                        step = 4
                    },
                )
                4 -> ContractStep(
                    name = name.ifEmpty { "___" },
                    signature = signature,
                    onSignatureChange = { signature = it },
                    onBack = { step = 3 },
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

// Passo 0: já é usuário em outro aparelho? Entra com a mesma conta
// Google, puxa o que já existe na nuvem e, se achar um perfil já
// onboarded, pula o resto do formulário inteiro — evita reescrever
// nome/horários/dias que já foram preenchidos da primeira vez. Mesmo
// comportamento do ReturningUserLogin_Click no UWP.
@Composable
private fun ReturningUserStep(onSkip: () -> Unit, onLoggedInWithProfile: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var loggingIn by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }

    Text(ContentStore.s("onboarding.appTitle"), style = MaterialTheme.typography.headlineMedium)
    Text(ContentStore.s("onboarding.returningUser.question"), style = MaterialTheme.typography.bodyLarge)
    Text(ContentStore.s("onboarding.returningUser.description"), style = MaterialTheme.typography.bodyMedium)
    Button(
        onClick = {
            loggingIn = true
            status = null
            scope.launch {
                val outcome = AuthService.signInWithGoogle(context)
                if (!outcome.success) {
                    loggingIn = false
                    status = outcome.errorMessage
                    return@launch
                }
                status = ContentStore.s("onboarding.returningUser.syncingStatus")
                SyncService.syncAll()
                val profile = LocalDataStore.getProfile()
                loggingIn = false
                if (profile != null && profile.onboarded) {
                    onLoggedInWithProfile()
                } else {
                    status = ContentStore.s("onboarding.returningUser.noDataFoundStatus")
                    onSkip()
                }
            }
        },
        enabled = !loggingIn,
        modifier = Modifier.fillMaxWidth(),
    ) { Text(if (loggingIn) ContentStore.s("onboarding.returningUser.loggingIn") else ContentStore.s("onboarding.returningUser.loginButton")) }
    status?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
    TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) { Text(ContentStore.s("onboarding.returningUser.skipButton")) }
}

@Composable
private fun WelcomeStep(onNext: () -> Unit) {
    Text(
        ContentStore.s("onboarding.welcome.quote"),
        style = MaterialTheme.typography.titleMedium,
    )
    Text(ContentStore.s("onboarding.appTitle"), style = MaterialTheme.typography.headlineMedium)
    Text(ContentStore.s("onboarding.welcome.description"), style = MaterialTheme.typography.bodyLarge)
    Button(onClick = onNext, modifier = Modifier.fillMaxWidth()) { Text(ContentStore.s("onboarding.welcome.startButton")) }
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
    Text(ContentStore.s("onboarding.nameDate.title"), style = MaterialTheme.typography.headlineSmall)
    Text(ContentStore.s("onboarding.nameDate.subtitle"), style = MaterialTheme.typography.bodyMedium)
    OutlinedTextField(value = name, onValueChange = onNameChange, label = { Text(ContentStore.s("onboarding.nameDate.nameLabel")) }, modifier = Modifier.fillMaxWidth())
    OutlinedTextField(
        value = startDate,
        onValueChange = onStartDateChange,
        label = { Text(ContentStore.s("onboarding.nameDate.startDateLabel")) },
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
    Text(ContentStore.s("onboarding.rituals.title"), style = MaterialTheme.typography.headlineSmall)
    Text(ContentStore.s("onboarding.rituals.subtitle"), style = MaterialTheme.typography.bodyMedium)

    Text(ContentStore.s("onboarding.rituals.morningPagesSection"), style = MaterialTheme.typography.titleSmall)
    TimePickerField(ContentStore.s("onboarding.rituals.timeLabel"), morningPagesTime, onMorningPagesTimeChange, modifier = Modifier.fillMaxWidth())

    Text(ContentStore.s("onboarding.rituals.artistDateSection"), style = MaterialTheme.typography.titleSmall)
    WeekdayDropdown(ContentStore.s("onboarding.rituals.weekdayLabel"), artistDateDay, onArtistDateDayChange, modifier = Modifier.fillMaxWidth())
    TimePickerField(ContentStore.s("onboarding.rituals.timeLabel"), artistDateTime, onArtistDateTimeChange, modifier = Modifier.fillMaxWidth())

    Text(ContentStore.s("onboarding.rituals.checkinSection"), style = MaterialTheme.typography.titleSmall)
    WeekdayDropdown(ContentStore.s("onboarding.rituals.weekdayLabel"), checkinDay, onCheckinDayChange, modifier = Modifier.fillMaxWidth())
    TimePickerField(ContentStore.s("onboarding.rituals.timeLabel"), checkinTime, onCheckinTimeChange, modifier = Modifier.fillMaxWidth())

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
    Text(ContentStore.s("onboarding.contract.title"), style = MaterialTheme.typography.headlineSmall)
    Text(ContentStore.s("onboarding.contract.description"), style = MaterialTheme.typography.bodyMedium)
    Text(
        ContentStore.s("onboarding.contract.sentence", "name" to name),
        style = MaterialTheme.typography.bodyLarge,
    )
    OutlinedTextField(value = signature, onValueChange = onSignatureChange, label = { Text(ContentStore.s("onboarding.contract.signatureLabel")) }, modifier = Modifier.fillMaxWidth())
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        TextButton(onClick = onBack) { Text(ContentStore.s("onboarding.backButton")) }
        Button(onClick = onFinish) { Text(ContentStore.s("onboarding.contract.finishButton")) }
    }
}

@Composable
private fun StepNavRow(onBack: () -> Unit, onNext: () -> Unit, nextEnabled: Boolean = true) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        TextButton(onClick = onBack) { Text(ContentStore.s("onboarding.backButton")) }
        Button(onClick = onNext, enabled = nextEnabled) { Text(ContentStore.s("onboarding.continueButton")) }
    }
}
