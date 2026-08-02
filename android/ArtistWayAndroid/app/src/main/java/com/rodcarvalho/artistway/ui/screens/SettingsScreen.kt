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
import com.rodcarvalho.artistway.auth.AuthService
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.sync.SyncService
import com.rodcarvalho.artistway.ui.theme.AppThemeState
import com.rodcarvalho.artistway.update.UpdateCheckService
import com.rodcarvalho.artistway.update.UpdateDownloader
import kotlinx.coroutines.launch
import java.time.LocalDate

private val TAB_TITLES = listOf("Aparência", "Dados e Sincronização", "Avançado")

// Espelha SettingsPage.xaml.cs — três abas, tudo funcionando de ponta a
// ponta: tema, backup, login/logout com Google (Credential Manager +
// Firebase Auth SDK), sincronizar agora, verificação/instalação de
// atualização, modo manutenção, apagar dados/resetar (limpando a nuvem
// também quando logado).
@Composable
fun SettingsScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    var profile by remember { mutableStateOf(ProfileSettings()) }
    var loaded by remember { mutableStateOf(false) }
    var loggedIn by remember { mutableStateOf(AuthService.currentUser != null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        profile = LocalDataStore.getProfile() ?: ProfileSettings()
        loaded = true
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            TAB_TITLES.forEachIndexed { i, title ->
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
    Text("Aparência", style = MaterialTheme.typography.headlineSmall)
    Text("Escolha entre tema claro, escuro ou seguir o sistema.", style = MaterialTheme.typography.bodyMedium)
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ThemeModeButton("light", "Claro", themeMode, onThemeModeChange)
        ThemeModeButton("dark", "Escuro", themeMode, onThemeModeChange)
        ThemeModeButton("auto", "Automático (seguir o sistema)", themeMode, onThemeModeChange)
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
            status = "Backup exportado."
        }
    }
    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            val text = context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
            if (text != null) {
                LocalDataStore.importAllData(text)
                status = "Backup importado."
            }
        }
    }

    Text("Dados e Sincronização", style = MaterialTheme.typography.headlineSmall)

    Text("Backup", style = MaterialTheme.typography.titleMedium)
    Button(
        onClick = { exportLauncher.launch("artist-way-backup-${LocalDate.now()}.json") },
        modifier = Modifier.fillMaxWidth(),
    ) { Text("Exportar backup") }
    OutlinedButton(
        onClick = { importLauncher.launch(arrayOf("application/json", "*/*")) },
        modifier = Modifier.fillMaxWidth(),
    ) { Text("Importar backup") }
    status?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }

    Text("Sincronização com a nuvem", style = MaterialTheme.typography.titleMedium)
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
                        status = "Login OK — sincronizando..."
                        status = SyncService.syncAll()
                    } else {
                        status = outcome.errorMessage
                    }
                }
            },
            enabled = !loggingIn,
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (loggingIn) "Entrando..." else "Entrar com Google") }
    } else {
        Text(
            "Logado como ${user.email ?: user.uid}.",
            style = MaterialTheme.typography.bodyMedium,
        )
        Button(
            onClick = { scope.launch { status = SyncService.syncAll() } },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Sincronizar agora") }
        OutlinedButton(
            onClick = {
                AuthService.signOut()
                onLoggedInChange(false)
                status = null
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Sair") }
    }
}

@Composable
private fun AdvancedTab(profile: ProfileSettings, onProfileChange: (ProfileSettings) -> Unit, loggedIn: Boolean) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var showResetConfirm by remember { mutableStateOf(false) }
    var showFullResetConfirm by remember { mutableStateOf(false) }
    var resetDone by remember { mutableStateOf(false) }

    var updateStatus by remember { mutableStateOf("Verificando se há atualização...") }
    var updateAvailable by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableStateOf<Float?>(null) }
    var downloadedFile by remember { mutableStateOf<java.io.File?>(null) }

    LaunchedEffect(Unit) {
        val installed = UpdateCheckService.getInstalledVersionName(context)
        val result = UpdateCheckService.check(context)
        updateStatus = when {
            !result.success -> "Versão instalada: $installed. Não foi possível checar agora (${result.error})."
            result.updateAvailable -> "Versão instalada: $installed. Nova versão disponível: ${result.latestVersionName}."
            else -> "Versão instalada: $installed. Atualizado ✓"
        }
        updateAvailable = result.updateAvailable
    }

    Text("Avançado", style = MaterialTheme.typography.headlineSmall)

    Text("Atualizações", style = MaterialTheme.typography.titleMedium)
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
        ) { Text("Baixar atualização") }
        downloadProgress?.let { Text("Baixando... ${(it * 100).toInt()}%", style = MaterialTheme.typography.bodySmall) }
    }
    downloadedFile?.let { file ->
        Button(
            onClick = { UpdateDownloader.install(context, file) },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Instalar atualização") }
    }

    Text("Modo manutenção", style = MaterialTheme.typography.titleMedium)
    Text(
        "Desliga o checklist e o check-in semanal, deixando só Morning Pages e Artist Date.",
        style = MaterialTheme.typography.bodyMedium,
    )
    OutlinedButton(
        onClick = {
            val next = profile.copy(maintenanceMode = !profile.maintenanceMode)
            onProfileChange(next)
            scope.launch { LocalDataStore.setProfile(next) }
        },
        modifier = Modifier.fillMaxWidth(),
    ) { Text(if (profile.maintenanceMode) "Desligar modo manutenção" else "Ligar modo manutenção") }

    Text("Zona de perigo", style = MaterialTheme.typography.titleMedium)
    OutlinedButton(onClick = { showResetConfirm = true }, modifier = Modifier.fillMaxWidth()) {
        Text("Apagar todos os dados")
    }
    // Mantém a sessão logada (a conta continua existindo, só fica vazia) —
    // útil pra recomeçar o programa do zero sem precisar logar de novo.
    OutlinedButton(onClick = { showFullResetConfirm = true }, modifier = Modifier.fillMaxWidth()) {
        Text("Resetar tudo (e sair da conta)")
    }
    if (resetDone) {
        Text("Dados apagados — reinicie o app pra configurar de novo.", style = MaterialTheme.typography.bodyMedium)
    }

    if (showResetConfirm) {
        AlertDialog(
            onDismissRequest = { showResetConfirm = false },
            title = { Text("Apagar todos os dados?") },
            text = {
                Text(
                    if (loggedIn) {
                        "Isso apaga todo o progresso salvo nesse aparelho e na nuvem (a conta continua logada, só fica vazia). Não tem como desfazer. Tem certeza?"
                    } else {
                        "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer. Tem certeza?"
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
                }) { Text("Apagar dados") }
            },
            dismissButton = {
                TextButton(onClick = { showResetConfirm = false }) { Text("Cancelar") }
            },
        )
    }

    if (showFullResetConfirm) {
        AlertDialog(
            onDismissRequest = { showFullResetConfirm = false },
            title = { Text("Resetar o app completamente?") },
            text = {
                Text(
                    if (loggedIn) {
                        "Isso apaga todo o progresso (aparelho e nuvem) e sai da conta logada. Não tem como desfazer. Tem certeza?"
                    } else {
                        "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer. Tem certeza?"
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
                            AuthService.signOut()
                        }
                        resetDone = true
                    }
                }) { Text("Resetar tudo") }
            },
            dismissButton = {
                TextButton(onClick = { showFullResetConfirm = false }) { Text("Cancelar") }
            },
        )
    }
}
