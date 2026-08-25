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
    val greeting = dayCount?.let {
        ContentStore.s("home.greeting.dayCount", "day" to maxOf(1, it).toString(), "total" to WeekCalculator.PROGRAM_LENGTH_DAYS.toString())
    }
        ?: profile.name.trim().ifEmpty { null }?.let { ContentStore.s("home.greeting.withName", "name" to it) }
        ?: ContentStore.s("home.greeting.default")

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
    val artistDateSummary = if (artistDateDone) {
        ContentStore.s("home.artistDate.doneSummary", "idea" to artistDate?.idea.orEmpty())
    } else {
        ContentStore.s("home.artistDate.notDoneSummary")
    }

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
    val weekdayLetters = ContentStore.s("home.morningPages.weekdayLetters").split(",")

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
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(ContentStore.s("home.maintenance.title"), style = MaterialTheme.typography.labelLarge)
                    Text(ContentStore.s("home.maintenance.description"), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }

        if (current.cyclePending) {
            val summary = current.cycleSummary
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(ContentStore.s("home.weekCycle.title", "week" to current.cursor.weekId.toString()), style = MaterialTheme.typography.titleMedium)
                    if (summary != null) {
                        Text(
                            ContentStore.s(
                                "home.weekCycle.summary",
                                "done" to summary.doneCount.toString(),
                                "total" to summary.totalItems.toString(),
                                "mp" to summary.morningPagesDone.toString(),
                                "adStatus" to ContentStore.s(if (summary.artistDateDone) "status.done" else "status.notDone"),
                                "ciStatus" to ContentStore.s(if (summary.checkinDone) "status.done" else "status.notDone"),
                            ),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = {
                            scope.launch {
                                LocalDataStore.decideWeekCycle(current.profile, advance = false)
                                reload()
                            }
                        }) { Text(ContentStore.s("home.weekCycle.stayButton", "week" to current.cursor.weekId.toString())) }
                        Button(onClick = {
                            scope.launch {
                                if (current.advanceMeansFinish) {
                                    LocalDataStore.setProfile(current.profile.copy(maintenanceMode = true))
                                } else {
                                    LocalDataStore.decideWeekCycle(current.profile, advance = true)
                                }
                                reload()
                            }
                        }) {
                            Text(
                                if (current.advanceMeansFinish) {
                                    ContentStore.s("home.weekCycle.finishButton")
                                } else {
                                    ContentStore.s("home.weekCycle.advanceButton", "week" to (current.cursor.weekId + 1).toString())
                                },
                            )
                        }
                    }
                }
            }
        }

        if (!current.maintenanceMode) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(ContentStore.s("home.week.label", "week" to current.weekId.toString()), style = MaterialTheme.typography.labelLarge)
                    Text(current.weekTitle, style = MaterialTheme.typography.titleMedium)
                    Text(current.weekIntro, style = MaterialTheme.typography.bodySmall)
                    val pct = if (current.weekTotalItems > 0) current.weekDoneCount.toFloat() / current.weekTotalItems else 0f
                    LinearProgressIndicator(progress = { pct }, modifier = Modifier.fillMaxWidth())
                    Text(ContentStore.s("home.week.progress", "done" to current.weekDoneCount.toString(), "total" to current.weekTotalItems.toString()), style = MaterialTheme.typography.bodySmall)
                    OutlinedButton(onClick = { onOpenWeek(current.weekId) }, modifier = Modifier.fillMaxWidth()) {
                        Text(ContentStore.s("home.week.openButton"))
                    }
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(ContentStore.s("home.morningPages.title"), style = MaterialTheme.typography.titleMedium)
                Text(ContentStore.s("home.morningPages.thisWeek"), style = MaterialTheme.typography.bodySmall)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                    val todayStr = WeekCalculator.dateToStr(LocalDate.now())
                    current.streakDone.forEachIndexed { i, done ->
                        val date = current.streakDates[i]
                        StreakDot(
                            letter = weekdayLetters[i],
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
                    ContentStore.s("home.morningPages.hint"),
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
                    Text(if (current.todayDone) ContentStore.s("home.morningPages.toggleOff") else ContentStore.s("home.morningPages.toggleOn"))
                }
            }
        }

        if (current.affirmation.isNotEmpty()) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(ContentStore.s("home.affirmation.label"), style = MaterialTheme.typography.bodySmall)
                    Text(
                        current.affirmation,
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(ContentStore.s("home.artistDate.title"), style = MaterialTheme.typography.titleMedium)
                Text(current.artistDateSummary, style = MaterialTheme.typography.bodyMedium)
                OutlinedButton(onClick = onOpenArtistDate, modifier = Modifier.fillMaxWidth()) {
                    Text(if (current.artistDateDone) ContentStore.s("home.artistDate.viewButton") else ContentStore.s("home.artistDate.planButton"))
                }
            }
        }

        if (!current.maintenanceMode) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(ContentStore.s("home.checkin.prompt"), style = MaterialTheme.typography.bodyMedium)
                    OutlinedButton(onClick = { onOpenCheckin(current.weekId) }, modifier = Modifier.fillMaxWidth()) {
                        Text(ContentStore.s("home.checkin.button", "week" to current.weekId.toString()))
                    }
                }
            }
        }

        if (current.showRoadRulesNudge) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(ContentStore.s("home.roadRulesNudge.prompt"), style = MaterialTheme.typography.bodyMedium)
                    OutlinedButton(onClick = onOpenRoadRules, modifier = Modifier.fillMaxWidth()) {
                        Text(ContentStore.s("home.roadRulesNudge.button"))
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
