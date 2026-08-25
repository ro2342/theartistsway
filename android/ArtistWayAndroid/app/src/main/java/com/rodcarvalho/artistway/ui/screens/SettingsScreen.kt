package com.rodcarvalho.artistway.ui.screens

import android.content.Context
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import com.rodcarvalho.artistway.auth.AuthService
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.sync.SyncService
import com.rodcarvalho.artistway.sync.SyncStatus
import com.rodcarvalho.artistway.ui.theme.AppThemeState
import com.rodcarvalho.artistway.update.UpdateCheckService
import com.rodcarvalho.artistway.update.UpdateDownloader
import kotlinx.coroutines.launch
import java.time.LocalDate

// Espelha SettingsPage.xaml.cs — três abas, tudo funcionando de ponta a
// ponta: tema, backup, login/logout com Google (Credential Manager +
// Firebase Auth SDK), sincronizar agora, verificação/instalação de
// atualização, modo manutenção, apagar dados/resetar (limpando a nuvem
// também quando logado).
@Composable
fun SettingsScreen() {
    val tabTitles = listOf(
        ContentStore.s("settings.tabs.appearance"),
        ContentStore.s("settings.tabs.dataSync"),
        ContentStore.s("settings.tabs.advanced"),
    )
    var selectedTab by remember { mutableIntStateOf(0) }
    var profile by remember { mutableStateOf(ProfileSettings()) }
    var loaded by remember { mutableStateOf(false) }
    var loggedIn by remember { mutableStateOf(AuthService.currentUser != null) }
    var reloadKey by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(reloadKey) {
        profile = LocalDataStore.getProfile() ?: ProfileSettings()
        loggedIn = AuthService.currentUser != null
        loaded = true
    }
    // Configurações é alcançada por um ícone fixo na TopAppBar (ver
    // MainShell), mas continua sendo uma entrada da NavigationBar que
    // fica em cache ao navegar pra outra aba — sem isso, reabrir essa
    // tela depois de sincronizar de outro aparelho mostraria o modo
    // manutenção/tema com os valores antigos até reabrir o app.
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        reloadKey++
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            tabTitles.forEachIndexed { i, title ->
                Tab(selected = selectedTab == i, onClick = { selectedTab = i }, text = { Text(title) })
            }
        }

        if (!loaded) return@Column

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            when (selectedTab) {
                0 -> AppearanceTab(
                    themeMode = AppThemeState.mode.value,
                    onThemeModeChange = { mode ->
                        AppThemeState.mode.value = mode
                        val next = profile.copy(themeMode = mode)
                        profile = next
                        scope.launch { LocalDataStore.setProfile(next) }
                    },
                )
                1 -> DataSyncTab(
                    context = context,
                    loggedIn = loggedIn,
                    onLoggedInChange = { loggedIn = it },
                )
                2 -> AdvancedTab(
                    profile = profile,
                    onProfileChange = { profile = it },
                    loggedIn = loggedIn,
                )
            }
        }
    }
}

@Composable
private fun AppearanceTab(themeMode: String, onThemeModeChange: (String) -> Unit) {
    Text(ContentStore.s("settings.appearance.title"), style = MaterialTheme.typography.headlineSmall)
    Text(ContentStore.s("settings.appearance.description"), style = MaterialTheme.typography.bodyMedium)
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ThemeModeButton("light", ContentStore.s("settings.appearance.themeLight"), themeMode, onThemeModeChange)
        ThemeModeButton("dark", ContentStore.s("settings.appearance.themeDark"), themeMode, onThemeModeChange)
        ThemeModeButton("auto", ContentStore.s("settings.appearance.themeAuto"), themeMode, onThemeModeChange)
    }
}

@Composable
private fun ThemeModeButton(mode: String, label: String, current: String, onClick: (String) -> Unit) {
    val selected = current == mode
    if (selected) {
        Button(onClick = { onClick(mode) }, modifier = Modifier.fillMaxWidth()) { Text("✓ $label") }
    } else {
        OutlinedButton(onClick = { onClick(mode) }, modifier = Modifier.fillMaxWidth()) { Text(label) }
    }
}

@Composable
private fun DataSyncTab(context: Context, loggedIn: Boolean, onLoggedInChange: (Boolean) -> Unit) {
    var status by remember { mutableStateOf<String?>(null) }
    var loggingIn by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            val json = LocalDataStore.exportAllData()
            context.contentResolver.openOutputStream(uri)?.use { it.write(json.toByteArray()) }
            status = ContentStore.s("settings.backup.exportedStatus")
        }
    }
    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            val text = context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
            if (text != null) {
                LocalDataStore.importAllData(text)
                status = ContentStore.s("settings.backup.importedStatus")
            }
        }
    }

    Text(ContentStore.s("settings.tabs.dataSync"), style = MaterialTheme.typography.headlineSmall)

    Text(ContentStore.s("settings.data.title"), style = MaterialTheme.typography.titleMedium)
    Text(ContentStore.s("settings.data.description"), style = MaterialTheme.typography.bodyMedium)
    Button(
        onClick = { exportLauncher.launch("artist-way-backup-${LocalDate.now()}.json") },
        modifier = Modifier.fillMaxWidth(),
    ) { Text(ContentStore.s("settings.export")) }
    OutlinedButton(
        onClick = { importLauncher.launch(arrayOf("application/json", "*/*")) },
        modifier = Modifier.fillMaxWidth(),
    ) { Text(ContentStore.s("settings.import")) }
    status?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }

    Text(ContentStore.s("settings.sync.title"), style = MaterialTheme.typography.titleMedium)
    Text(ContentStore.s("settings.sync.description", "otherPlatform" to ContentStore.s("settings.sync.otherPlatformName")), style = MaterialTheme.typography.bodyMedium)
    val user = AuthService.currentUser
    if (!loggedIn || user == null) {
        Button(
            onClick = {
                loggingIn = true
                scope.launch {
                    val outcome = AuthService.signInWithGoogle(context)
                    loggingIn = false
                    if (outcome.success) {
                        onLoggedInChange(true)
                        status = ContentStore.s("settings.sync.loginSyncing")
                        status = SyncStatus.run()
                    } else {
                        status = outcome.errorMessage
                    }
                }
            },
            enabled = !loggingIn,
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (loggingIn) ContentStore.s("settings.sync.loggingIn") else ContentStore.s("settings.sync.loginButton")) }
    } else {
        Text(
            ContentStore.s("settings.sync.statusLoggedIn", "who" to (user.email ?: user.uid)),
            style = MaterialTheme.typography.bodyMedium,
        )
        Button(
            onClick = { scope.launch { status = SyncStatus.run() } },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("settings.sync.syncNowButton")) }
        OutlinedButton(
            onClick = {
                scope.launch {
                    AuthService.signOut(context)
                    onLoggedInChange(false)
                    status = null
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("settings.signOut")) }
    }
}

@Composable
private fun AdvancedTab(profile: ProfileSettings, onProfileChange: (ProfileSettings) -> Unit, loggedIn: Boolean) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var showResetConfirm by remember { mutableStateOf(false) }
    var showFullResetConfirm by remember { mutableStateOf(false) }
    var resetDone by remember { mutableStateOf(false) }

    var updateStatus by remember { mutableStateOf(ContentStore.s("common.checking")) }
    var updateAvailable by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableStateOf<Float?>(null) }
    var downloadedFile by remember { mutableStateOf<java.io.File?>(null) }

    LaunchedEffect(Unit) {
        val installed = UpdateCheckService.getInstalledVersionName(context)
        val result = UpdateCheckService.check(context)
        updateStatus = when {
            !result.success -> ContentStore.s("updates.installedCheckFailedWithError", "version" to installed, "error" to result.error.orEmpty())
            result.updateAvailable -> ContentStore.s("updates.installedNewVersionAvailable", "version" to installed, "latest" to result.latestVersionName.orEmpty())
            else -> ContentStore.s("updates.installedUpToDate", "version" to installed)
        }
        updateAvailable = result.updateAvailable
    }

    Text(ContentStore.s("settings.tabs.advanced"), style = MaterialTheme.typography.headlineSmall)

    Text(ContentStore.s("settings.updates.title"), style = MaterialTheme.typography.titleMedium)
    Text(updateStatus, style = MaterialTheme.typography.bodyMedium)
    if (updateAvailable && downloadedFile == null) {
        Button(
            onClick = {
                scope.launch {
                    downloadProgress = 0f
                    val file = UpdateDownloader.download(context) { p -> downloadProgress = p }
                    downloadProgress = null
                    downloadedFile = file
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("updates.downloadButton")) }
        downloadProgress?.let { Text(ContentStore.s("updates.downloadingWithProgress", "percent" to (it * 100).toInt().toString()), style = MaterialTheme.typography.bodySmall) }
    }
    downloadedFile?.let { file ->
        Button(
            onClick = { UpdateDownloader.install(context, file) },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("updates.installButton")) }
    }

    Text(ContentStore.s("settings.maintenance.title"), style = MaterialTheme.typography.titleMedium)
    Text(
        ContentStore.s("settings.maintenance.description"),
        style = MaterialTheme.typography.bodyMedium,
    )
    OutlinedButton(
        onClick = {
            val next = profile.copy(maintenanceMode = !profile.maintenanceMode)
            onProfileChange(next)
            scope.launch { LocalDataStore.setProfile(next) }
        },
        modifier = Modifier.fillMaxWidth(),
    ) { Text(if (profile.maintenanceMode) ContentStore.s("settings.maintenance.toggleOff") else ContentStore.s("settings.maintenance.toggleOn")) }

    Text(ContentStore.s("settings.dangerZone.title"), style = MaterialTheme.typography.titleMedium)
    Text(ContentStore.s("settings.dangerZone.description"), style = MaterialTheme.typography.bodyMedium)
    OutlinedButton(onClick = { showResetConfirm = true }, modifier = Modifier.fillMaxWidth()) {
        Text(ContentStore.s("settings.clearData.button"))
    }
    // Mantém a sessão logada (a conta continua existindo, só fica vazia) —
    // útil pra recomeçar o programa do zero sem precisar logar de novo.
    OutlinedButton(onClick = { showFullResetConfirm = true }, modifier = Modifier.fillMaxWidth()) {
        Text(ContentStore.s("settings.fullReset.button"))
    }
    if (resetDone) {
        Text(ContentStore.s("settings.resetDone"), style = MaterialTheme.typography.bodyMedium)
    }

    if (showResetConfirm) {
        AlertDialog(
            onDismissRequest = { showResetConfirm = false },
            title = { Text(ContentStore.s("settings.clearData.confirmTitle")) },
            text = {
                Text(
                    if (loggedIn) {
                        ContentStore.s("settings.clearData.confirmMessageLoggedIn")
                    } else {
                        ContentStore.s("settings.clearData.confirmMessageLocal")
                    },
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    showResetConfirm = false
                    scope.launch {
                        LocalDataStore.resetAll()
                        if (loggedIn) SyncService.clearCloudData()
                        resetDone = true
                    }
                }) { Text(ContentStore.s("settings.clearData.confirmButton")) }
            },
            dismissButton = {
                TextButton(onClick = { showResetConfirm = false }) { Text(ContentStore.s("common.cancel")) }
            },
        )
    }

    if (showFullResetConfirm) {
        AlertDialog(
            onDismissRequest = { showFullResetConfirm = false },
            title = { Text(ContentStore.s("settings.fullReset.confirmTitle")) },
            text = {
                Text(
                    if (loggedIn) {
                        ContentStore.s("settings.fullReset.confirmMessageLoggedIn")
                    } else {
                        ContentStore.s("settings.clearData.confirmMessageLocal")
                    },
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    showFullResetConfirm = false
                    scope.launch {
                        LocalDataStore.resetAll()
                        if (loggedIn) {
                            SyncService.clearCloudData()
                            AuthService.signOut(context)
                        }
                        resetDone = true
                    }
                }) { Text(ContentStore.s("settings.fullReset.confirmButton")) }
            },
            dismissButton = {
                TextButton(onClick = { showFullResetConfirm = false }) { Text(ContentStore.s("common.cancel")) }
            },
        )
    }
}
