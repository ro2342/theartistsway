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
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.ui.theme.AppThemeState
import kotlinx.coroutines.launch
import java.time.LocalDate

private val TAB_TITLES = listOf("Aparência", "Dados e Sincronização", "Avançado")

// Espelha SettingsPage.xaml.cs — três abas. Login/sincronização com
// Google e verificação de atualização ainda são placeholders (chegam na
// Fase 6, junto com AuthService/SyncService/UpdateCheckService de
// verdade); tema, exportar/importar backup e modo manutenção já
// funcionam de ponta a ponta.
@Composable
fun SettingsScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    var profile by remember { mutableStateOf(ProfileSettings()) }
    var loaded by remember { mutableStateOf(false) }
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
                1 -> DataSyncTab(context)
                2 -> AdvancedTab(
                    profile = profile,
                    onProfileChange = { profile = it },
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
private fun DataSyncTab(context: Context) {
    var status by remember { mutableStateOf<String?>(null) }
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
    Text(
        "Login com Google e sincronização entre aparelhos chegam numa próxima fase.",
        style = MaterialTheme.typography.bodyMedium,
    )
}

@Composable
private fun AdvancedTab(profile: ProfileSettings, onProfileChange: (ProfileSettings) -> Unit) {
    val scope = rememberCoroutineScope()
    var showResetConfirm by remember { mutableStateOf(false) }
    var resetDone by remember { mutableStateOf(false) }

    Text("Avançado", style = MaterialTheme.typography.headlineSmall)

    Text("Atualizações", style = MaterialTheme.typography.titleMedium)
    Text("Verificação de atualização chega numa próxima fase.", style = MaterialTheme.typography.bodyMedium)

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
    if (resetDone) {
        Text("Dados apagados — reinicie o app pra configurar de novo.", style = MaterialTheme.typography.bodyMedium)
    }

    if (showResetConfirm) {
        AlertDialog(
            onDismissRequest = { showResetConfirm = false },
            title = { Text("Apagar todos os dados?") },
            text = { Text("Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer. Tem certeza?") },
            confirmButton = {
                TextButton(onClick = {
                    showResetConfirm = false
                    scope.launch {
                        LocalDataStore.resetAll()
                        resetDone = true
                    }
                }) { Text("Apagar dados") }
            },
            dismissButton = {
                TextButton(onClick = { showResetConfirm = false }) { Text("Cancelar") }
            },
        )
    }
}
