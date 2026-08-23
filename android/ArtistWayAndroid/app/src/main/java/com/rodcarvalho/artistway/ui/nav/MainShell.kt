package com.rodcarvalho.artistway.ui.nav

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.sync.SyncPhase
import com.rodcarvalho.artistway.sync.SyncStatus
import com.rodcarvalho.artistway.ui.screens.ArtistDateHistoryScreen
import com.rodcarvalho.artistway.ui.screens.ArtistDateScreen
import com.rodcarvalho.artistway.ui.screens.CheckinHistoryScreen
import com.rodcarvalho.artistway.ui.screens.CheckinScreen
import com.rodcarvalho.artistway.ui.screens.CirculoSegurancaScreen
import com.rodcarvalho.artistway.ui.screens.EssayScreen
import com.rodcarvalho.artistway.ui.screens.FerramentasScreen
import com.rodcarvalho.artistway.ui.screens.HomeScreen
import com.rodcarvalho.artistway.ui.screens.LifePieScreen
import com.rodcarvalho.artistway.ui.screens.NamedListScreen
import com.rodcarvalho.artistway.ui.screens.NumberedListScreen
import com.rodcarvalho.artistway.ui.screens.ProfileScreen
import com.rodcarvalho.artistway.ui.screens.ProgressScreen
import com.rodcarvalho.artistway.ui.screens.QuizScreen
import com.rodcarvalho.artistway.ui.screens.SettingsScreen
import com.rodcarvalho.artistway.ui.screens.TabelaCrencasScreen
import com.rodcarvalho.artistway.ui.screens.WeekDetailScreen
import kotlinx.coroutines.launch

// Shell principal depois do onboarding: Material 3 NavigationBar (barra
// inferior, 5 destinos) em vez do menu-hambúrguer/drawer usado antes — é
// o padrão nativo do Android pra poucos destinos de nível superior
// (o SplitView do UWP e o drawer da PWA continuam com o menu lateral,
// cada plataforma na sua própria convenção). Configurações fica fora da
// barra, alcançada pelo ícone de engrenagem na TopAppBar. Envolve um
// NavHost interno pras telas de detalhe (empilham no back stack sem
// aparecer na barra inferior).
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainShell() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: AppDestinations.HOME
    val currentItem = AppDestinations.ITEMS.firstOrNull { it.route == currentRoute }
    val isBottomNavRoute = AppDestinations.BOTTOM_NAV_ITEMS.any { it.route == currentRoute }
    val scope = rememberCoroutineScope()

    // Sincroniza ao abrir o app e sempre que ele volta pro primeiro plano
    // (não só depois de editar algo) — mesmo gatilho que o PWA já tem em
    // visibilitychange/focus e o UWP em OnLaunched/OnResuming.
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        scope.launch { SyncStatus.run() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(ContentStore.s(currentItem?.labelKey ?: "nav.home")) },
                navigationIcon = {
                    if (!isBottomNavRoute) {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                        }
                    }
                },
                actions = {
                    // Ícone de sync fixo em toda tela (não só em Ajustes) —
                    // fica verde quando a última sincronização deu certo,
                    // gira enquanto está em andamento, e o próprio toque
                    // dispara uma nova. SyncStatus é compartilhado com o
                    // auto-sync em segundo plano (SyncScheduler), então os
                    // dois mantêm o mesmo indicador em dia.
                    val phase = SyncStatus.phase.value
                    IconButton(onClick = { scope.launch { SyncStatus.run() } }) {
                        if (phase == SyncPhase.SYNCING) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else if (phase == SyncPhase.SUCCESS) {
                            Icon(Icons.Filled.Refresh, contentDescription = "Sincronizar", tint = Color(0xFF2E7D32))
                        } else {
                            Icon(Icons.Filled.Refresh, contentDescription = "Sincronizar")
                        }
                    }
                    if (isBottomNavRoute) {
                        IconButton(onClick = { navController.navigate(AppDestinations.SETTINGS) }) {
                            Icon(Icons.Filled.Settings, contentDescription = ContentStore.s("nav.settings"))
                        }
                    }
                },
            )
        },
        bottomBar = {
            if (isBottomNavRoute) {
                NavigationBar {
                    AppDestinations.BOTTOM_NAV_ITEMS.forEach { item ->
                        NavigationBarItem(
                            selected = currentRoute == item.route,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(item.icon, contentDescription = null) },
                            label = { Text(ContentStore.s(item.labelKey)) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = AppDestinations.HOME,
            modifier = Modifier.padding(padding),
        ) {
            composable(AppDestinations.HOME) {
                HomeScreen(
                    onOpenWeek = { navController.navigate(AppDestinations.weekDetail(it)) },
                    onOpenArtistDate = { navController.navigate(AppDestinations.ARTIST_DATE) },
                    onOpenCheckin = { navController.navigate(AppDestinations.checkin(it)) },
                    onOpenRoadRules = { navController.navigate(AppDestinations.REGRAS_DA_ESTRADA) },
                )
            }
            composable(AppDestinations.PROGRESS) {
                ProgressScreen(onOpenWeek = { navController.navigate(AppDestinations.weekDetail(it)) })
            }
            composable(AppDestinations.ARTIST_DATE) { ArtistDateScreen() }
            composable(AppDestinations.FERRAMENTAS) { FerramentasScreen(onNavigate = { navController.navigate(it) }) }
            composable(AppDestinations.PROFILE) { ProfileScreen() }
            composable(AppDestinations.SETTINGS) { SettingsScreen() }

            composable(
                AppDestinations.WEEK_DETAIL_TEMPLATE,
                arguments = listOf(navArgument("weekId") { type = NavType.IntType }),
            ) { entry ->
                val weekId = entry.arguments?.getInt("weekId") ?: 1
                WeekDetailScreen(
                    weekId = weekId,
                    onOpenEssay = { navController.navigate(AppDestinations.essay(weekId)) },
                    onOpenCheckin = { navController.navigate(AppDestinations.checkin(weekId)) },
                    onOpenLink = { link ->
                        val route = when (link.type) {
                            "list" -> AppDestinations.list(link.key)
                            "screen" -> when (link.key) {
                                "lifePie" -> AppDestinations.LIFE_PIE
                                "circuloSeguranca" -> AppDestinations.CIRCULO_SEGURANCA
                                "principiosBasicos" -> AppDestinations.PRINCIPIOS_BASICOS
                                "artistDate" -> AppDestinations.ARTIST_DATE
                                else -> null
                            }
                            else -> null
                        }
                        route?.let { navController.navigate(it) }
                    },
                )
            }
            composable(
                AppDestinations.ESSAY_TEMPLATE,
                arguments = listOf(navArgument("weekId") { type = NavType.IntType }),
            ) { entry ->
                EssayScreen(weekId = entry.arguments?.getInt("weekId") ?: 1)
            }
            composable(
                AppDestinations.CHECKIN_TEMPLATE,
                arguments = listOf(navArgument("weekId") { type = NavType.IntType }),
            ) { entry ->
                CheckinScreen(
                    weekId = entry.arguments?.getInt("weekId") ?: 1,
                    onSaved = {
                        navController.navigate(AppDestinations.HOME) {
                            popUpTo(AppDestinations.HOME) { inclusive = true }
                        }
                    },
                )
            }
            composable(AppDestinations.CHECKIN_HISTORY) {
                CheckinHistoryScreen(onOpenWeek = { navController.navigate(AppDestinations.checkin(it)) })
            }
            composable(AppDestinations.ARTIST_DATE_HISTORY) { ArtistDateHistoryScreen() }
            composable(AppDestinations.REGRAS_DA_ESTRADA) {
                NumberedListScreen(ContentStore.s("tools.regrasDaEstrada"), ContentStore.content.roadRules)
            }
            composable(AppDestinations.PRINCIPIOS_BASICOS) {
                NumberedListScreen(ContentStore.s("tools.principiosBasicos"), ContentStore.content.basicPrinciples)
            }
            composable(AppDestinations.BANCO_AFIRMACOES) {
                NumberedListScreen(ContentStore.s("tools.bancoAfirmacoes"), ContentStore.content.affirmations)
            }
            composable(AppDestinations.TABELA_CRENCAS) { TabelaCrencasScreen() }
            composable(AppDestinations.CIRCULO_SEGURANCA) { CirculoSegurancaScreen() }
            composable(AppDestinations.LIFE_PIE) { LifePieScreen() }
            composable(
                AppDestinations.LIST_TEMPLATE,
                arguments = listOf(navArgument("listKey") { type = NavType.StringType }),
            ) { entry ->
                NamedListScreen(listKey = entry.arguments?.getString("listKey") ?: "")
            }
            composable(
                AppDestinations.QUIZ_TEMPLATE,
                arguments = listOf(navArgument("quizKey") { type = NavType.StringType }),
            ) { entry ->
                QuizScreen(quizKey = entry.arguments?.getString("quizKey") ?: "")
            }
        }
    }
}
