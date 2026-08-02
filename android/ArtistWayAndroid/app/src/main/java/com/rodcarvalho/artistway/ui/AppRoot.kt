package com.rodcarvalho.artistway.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.ui.nav.MainShell
import com.rodcarvalho.artistway.ui.screens.OnboardingScreen
import com.rodcarvalho.artistway.ui.theme.ArtistWayTheme

private const val ROUTE_ONBOARDING = "onboarding"
private const val ROUTE_SHELL = "shell"

// Raiz do app: carrega o content.json e o perfil uma vez, decide se
// mostra o Onboarding ou o shell principal (mesma decisão de
// MainPage_Loaded no UWP: profile == null || !profile.Onboarded), e
// aplica o tema claro/escuro/automático a partir de profile.themeMode.
@Composable
fun AppRoot() {
    val context = LocalContext.current
    var isReady by remember { mutableStateOf(false) }
    var startOnboarding by remember { mutableStateOf(true) }
    var themeMode by remember { mutableStateOf("auto") }

    LaunchedEffect(Unit) {
        ContentStore.initialize(context)
        val profile = LocalDataStore.getProfile()
        themeMode = profile?.themeMode ?: "auto"
        startOnboarding = profile == null || !profile.onboarded
        isReady = true
    }

    val systemDark = isSystemInDarkTheme()
    val darkTheme = when (themeMode) {
        "light" -> false
        "dark" -> true
        else -> systemDark
    }

    ArtistWayTheme(darkTheme = darkTheme) {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            if (!isReady) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                val navController = rememberNavController()
                NavHost(
                    navController = navController,
                    startDestination = if (startOnboarding) ROUTE_ONBOARDING else ROUTE_SHELL,
                ) {
                    composable(ROUTE_ONBOARDING) {
                        OnboardingScreen(onFinished = {
                            navController.navigate(ROUTE_SHELL) {
                                popUpTo(ROUTE_ONBOARDING) { inclusive = true }
                            }
                        })
                    }
                    composable(ROUTE_SHELL) {
                        MainShell()
                    }
                }
            }
        }
    }
}
