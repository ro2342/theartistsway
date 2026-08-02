package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.week.WeekCalculator

// Versão mínima da Home — só prova que ContentStore/LocalDataStore estão
// funcionando de ponta a ponta. Dashboard completo (cartão de decisão de
// semana, streak, afirmação do dia, Artist Date) vem na Fase 3, espelhando
// HomePage.xaml.cs.
@Composable
fun HomeScreen() {
    var profile by remember { mutableStateOf<ProfileSettings?>(null) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        profile = LocalDataStore.getProfile()
        loaded = true
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (!loaded) {
            Text("Carregando...")
        } else {
            val name = profile?.name?.trim()?.ifEmpty { null }
            Text(if (name != null) "Olá, $name" else "Olá!", style = MaterialTheme.typography.headlineMedium)
            WeekCalculator.getDayCount(profile)?.let { dayCount ->
                Text("Dia $dayCount do seu programa.", style = MaterialTheme.typography.bodyLarge)
            }
            Text(
                "O painel completo (semana atual, streak, Artist Date) chega nas próximas fases.",
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}
