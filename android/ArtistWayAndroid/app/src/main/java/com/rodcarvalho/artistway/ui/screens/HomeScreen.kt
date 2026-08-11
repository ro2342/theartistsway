package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.data.model.WeekCursor
import com.rodcarvalho.artistway.data.model.WeekSummary
import com.rodcarvalho.artistway.week.WeekCalculator
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit

private val WEEKDAY_LETTERS = listOf("D", "S", "T", "Q", "Q", "S", "S")

private data class HomeUiState(
    val profile: ProfileSettings,
    val cursor: WeekCursor,
    val weekId: Int,
    val weekTitle: String,
    val weekIntro: String,
    val greeting: String,
    val maintenanceMode: Boolean,
    val cyclePending: Boolean,
    val cycleSummary: WeekSummary?,
    val advanceMeansFinish: Boolean,
    val weekDoneCount: Int,
    val weekTotalItems: Int,
    val streakDates: List<String>,
    val streakDone: List<Boolean>,
    val todayDone: Boolean,
    val affirmation: String,
    val artistDateDone: Boolean,
    val artistDateSummary: String,
    val showRoadRulesNudge: Boolean,
)

private suspend fun loadHomeState(): HomeUiState? {
    val profile = LocalDataStore.getProfile() ?: return null
    val cursor = LocalDataStore.getOrSeedWeekCursor(profile)
    val weekId = cursor.weekId
    val week = ContentStore.content.weeks.firstOrNull { it.id == weekId }
    val weekKey = WeekCalculator.weekKeyForOffset(profile, weekId)

    val dayCount = WeekCalculator.getDayCount(profile)
    val greeting = dayCount?.let { "Dia ${maxOf(1, it)} de ${WeekCalculator.PROGRAM_LENGTH_DAYS}" }
        ?: profile.name.trim().ifEmpty { null }?.let { "Olá, $it" }
        ?: "seu companheiro de jornada"

    val maintenanceMode = profile.maintenanceMode || WeekCalculator.isProgramFinished(profile)
    val cyclePending = !maintenanceMode && WeekCalculator.isWeekCyclePending(cursor)
    val cycleSummary = if (cyclePending) LocalDataStore.buildWeekSummary(profile, cursor) else null

    val doneIndexes = LocalDataStore.getDoneChecklistIndexes(weekId)
    val totalItems = week?.checklist?.size ?: 0
    val doneCount = doneIndexes.count { it < totalItems }

    val allMp = LocalDataStore.getAllMorningPages()
    val today = LocalDate.now()
    val weekStart = WeekCalculator.currentStreakWeekStart(profile, today)
    val streakDates = (0..6).map { i -> WeekCalculator.dateToStr(weekStart.plusDays(i.toLong())) }
    val streakDone = streakDates.map { allMp[it] == true }
    val todayIndex = ChronoUnit.DAYS.between(weekStart, today).toInt()
    val todayDone = streakDone.getOrElse(todayIndex) { false }

    val affirmations = ContentStore.content.affirmations
    val affirmation = if (affirmations.isNotEmpty()) affirmations[today.dayOfYear % affirmations.size] else ""

    val artistDate = LocalDataStore.getArtistDate(weekKey)
    val artistDateDone = artistDate?.done == true
    val artistDateSummary = if (artistDateDone) "Feito — ${artistDate?.idea.orEmpty()}" else "Ainda não rolou essa semana."

    val lastActivity = LocalDataStore.getLastActivity()
    val showNudge = !maintenanceMode && lastActivity != null &&
        ChronoUnit.DAYS.between(lastActivity, Instant.now()) >= 3

    return HomeUiState(
        profile = profile,
        cursor = cursor,
        weekId = weekId,
        weekTitle = week?.title.orEmpty(),
        weekIntro = week?.intro.orEmpty(),
        greeting = greeting,
        maintenanceMode = maintenanceMode,
        cyclePending = cyclePending,
        cycleSummary = cycleSummary,
        advanceMeansFinish = cursor.weekId >= 12,
        weekDoneCount = doneCount,
        weekTotalItems = totalItems,
        streakDates = streakDates,
        streakDone = streakDone,
        todayDone = todayDone,
        affirmation = affirmation,
        artistDateDone = artistDateDone,
        artistDateSummary = artistDateSummary,
        showRoadRulesNudge = showNudge,
    )
}

// Espelha HomePage.xaml.cs: cartão de decisão de semana, progresso da
// semana atual, streak de Morning Pages, afirmação do dia, status do
// Artist Date e lembrete de Regras da Estrada.
@Composable
fun HomeScreen(
    onOpenWeek: (Int) -> Unit,
    onOpenArtistDate: () -> Unit,
    onOpenCheckin: (Int) -> Unit,
    onOpenRoadRules: () -> Unit,
) {
    var state by remember { mutableStateOf<HomeUiState?>(null) }
    var reloadKey by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(reloadKey) {
        state = loadHomeState()
    }
    // A Home é uma aba da NavigationBar: trocar de aba não descarta a
    // composição (popUpTo+saveState/restoreState do MainShell mantém o
    // estado em cache pra preservar posição de scroll etc.) — sem isso,
    // voltar pra cá depois de editar o perfil ou sincronizar de outro
    // aparelho mostraria dados desatualizados até reabrir o app.
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        reloadKey++
    }

    val current = state ?: return
    val reload = { reloadKey++ }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(current.greeting, style = MaterialTheme.typography.headlineMedium)

        if (current.maintenanceMode) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "Modo manutenção: continue com Morning Pages e Artist Date no seu ritmo.",
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }

        if (current.cyclePending) {
            val summary = current.cycleSummary
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("A Semana ${current.cursor.weekId} completou os 7 dias", style = MaterialTheme.typography.titleMedium)
                    if (summary != null) {
                        Text(
                            "${summary.doneCount}/${summary.totalItems} tarefas concluídas · " +
                                "Morning Pages em ${summary.morningPagesDone}/7 dias · " +
                                "Artist Date ${if (summary.artistDateDone) "feito" else "não feito"} · " +
                                "check-in ${if (summary.checkinDone) "feito" else "não feito"}.",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = {
                            scope.launch {
                                LocalDataStore.decideWeekCycle(current.profile, advance = false)
                                reload()
                            }
                        }) { Text("Continuar na Semana ${current.cursor.weekId}") }
                        Button(onClick = {
                            scope.launch {
                                if (current.advanceMeansFinish) {
                                    LocalDataStore.setProfile(current.profile.copy(maintenanceMode = true))
                                } else {
                                    LocalDataStore.decideWeekCycle(current.profile, advance = true)
                                }
                                reload()
                            }
                        }) { Text(if (current.advanceMeansFinish) "Concluir o programa" else "Ir para a Semana ${current.cursor.weekId + 1}") }
                    }
                }
            }
        }

        if (!current.maintenanceMode) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Semana ${current.weekId} de 12", style = MaterialTheme.typography.labelLarge)
                    Text(current.weekTitle, style = MaterialTheme.typography.titleMedium)
                    Text(current.weekIntro, style = MaterialTheme.typography.bodySmall)
                    val pct = if (current.weekTotalItems > 0) current.weekDoneCount.toFloat() / current.weekTotalItems else 0f
                    LinearProgressIndicator(progress = { pct }, modifier = Modifier.fillMaxWidth())
                    Text("${current.weekDoneCount}/${current.weekTotalItems} tarefas dessa semana concluídas", style = MaterialTheme.typography.bodySmall)
                    OutlinedButton(onClick = { onOpenWeek(current.weekId) }, modifier = Modifier.fillMaxWidth()) {
                        Text("Ver checklist da semana")
                    }
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Morning Pages", style = MaterialTheme.typography.titleMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                    val todayStr = WeekCalculator.dateToStr(LocalDate.now())
                    current.streakDone.forEachIndexed { i, done ->
                        val date = current.streakDates[i]
                        StreakDot(
                            letter = WEEKDAY_LETTERS[i],
                            done = done,
                            enabled = date <= todayStr,
                            onClick = { scope.launch { LocalDataStore.toggleMorningPage(date); reload() } },
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
                // Bolinhas de dias passados (não só "hoje") são tocáveis —
                // dá pra fazer check-in retroativo de um dia esquecido, sem
                // precisar de tela própria só pra isso.
                Text(
                    "Esqueceu de marcar um dia? Toque na bolinha dele.",
                    style = MaterialTheme.typography.bodySmall,
                )
                Button(
                    onClick = {
                        scope.launch {
                            LocalDataStore.toggleMorningPage(WeekCalculator.dateToStr(LocalDate.now()))
                            reload()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (current.todayDone) "✓ Páginas de hoje feitas" else "Marcar páginas de hoje como feitas")
                }
            }
        }

        if (current.affirmation.isNotEmpty()) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Text(
                    current.affirmation,
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Artist Date", style = MaterialTheme.typography.titleMedium)
                Text(current.artistDateSummary, style = MaterialTheme.typography.bodyMedium)
                OutlinedButton(onClick = onOpenArtistDate, modifier = Modifier.fillMaxWidth()) {
                    Text(if (current.artistDateDone) "Ver / trocar" else "Planejar meu Artist Date")
                }
            }
        }

        if (!current.maintenanceMode) {
            OutlinedButton(onClick = { onOpenCheckin(current.weekId) }, modifier = Modifier.fillMaxWidth()) {
                Text("Fazer o check-in da semana")
            }
        }

        if (current.showRoadRulesNudge) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Faz um tempo que você não abre o app.", style = MaterialTheme.typography.bodyMedium)
                    OutlinedButton(onClick = onOpenRoadRules, modifier = Modifier.fillMaxWidth()) {
                        Text("Reler as Regras da Estrada")
                    }
                }
            }
        }
    }
}

@Composable
private fun StreakDot(
    letter: String,
    done: Boolean,
    modifier: Modifier = Modifier,
    enabled: Boolean = false,
    onClick: (() -> Unit)? = null,
) {
    val background = if (done) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
    val foreground = if (done) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
    Box(
        modifier = modifier.aspectRatio(1f),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = CircleShape,
            color = background,
            modifier = if (enabled && onClick != null) {
                Modifier.fillMaxSize().clickable(onClick = onClick)
            } else {
                Modifier.fillMaxSize().alpha(0.4f)
            },
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                Text(letter, color = foreground, style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}
