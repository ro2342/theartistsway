package com.rodcarvalho.artistway.ui.nav

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.ui.screens.ArtistDateHistoryScreen
import com.rodcarvalho.artistway.ui.screens.ArtistDateScreen
import com.rodcarvalho.artistway.ui.screens.CheckinHistoryScreen
import com.rodcarvalho.artistway.ui.screens.CheckinScreen
import com.rodcarvalho.artistway.ui.screens.EssayScreen
import com.rodcarvalho.artistway.ui.screens.HomeScreen
import com.rodcarvalho.artistway.ui.screens.PlaceholderScreen
import com.rodcarvalho.artistway.ui.screens.ProgressScreen
import com.rodcarvalho.artistway.ui.screens.WeekDetailScreen
import kotlinx.coroutines.launch

// Shell principal depois do onboarding: drawer (mesmos 6 destinos do
// SplitView do MainPage.xaml do UWP) + barra de topo com hambúrguer +
// título da seção atual, envolvendo um NavHost interno.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainShell() {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: AppDestinations.HOME
    val currentItem = AppDestinations.ITEMS.firstOrNull { it.route == currentRoute }
    val isTopLevel = currentItem != null

    BackHandler(enabled = drawerState.isOpen) {
        scope.launch { drawerState.close() }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                AppDestinations.ITEMS.forEach { item ->
                    NavigationDrawerItem(
                        label = { Text(ContentStore.s(item.labelKey)) },
                        selected = currentRoute == item.route,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                            scope.launch { drawerState.close() }
                        },
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    )
                }
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                NavigationDrawerItem(
                    label = { Text(ContentStore.s("nav.sync")) },
                    selected = false,
                    onClick = {
                        scope.launch { drawerState.close() }
                        // Fase 6: dispara SyncService.syncAll() de verdade.
                    },
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                )
            }
        },
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(ContentStore.s(currentItem?.labelKey ?: "nav.home")) },
                    navigationIcon = {
                        if (isTopLevel) {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(Icons.Default.Menu, contentDescription = ContentStore.s("nav.home"))
                            }
                        } else {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                            }
                        }
                    },
                )
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
                composable(AppDestinations.FERRAMENTAS) { PlaceholderScreen(ContentStore.s("nav.recursos")) }
                composable(AppDestinations.PROFILE) { PlaceholderScreen(ContentStore.s("nav.profile")) }
                composable(AppDestinations.SETTINGS) { PlaceholderScreen(ContentStore.s("nav.settings")) }

                composable(
                    AppDestinations.WEEK_DETAIL_TEMPLATE,
                    arguments = listOf(navArgument("weekId") { type = NavType.IntType }),
                ) { entry ->
                    val weekId = entry.arguments?.getInt("weekId") ?: 1
                    WeekDetailScreen(
                        weekId = weekId,
                        onOpenEssay = { navController.navigate(AppDestinations.essay(weekId)) },
                        onOpenCheckin = { navController.navigate(AppDestinations.checkin(weekId)) },
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
                composable(AppDestinations.REGRAS_DA_ESTRADA) { PlaceholderScreen("Regras da Estrada") }
            }
        }
    }
}
