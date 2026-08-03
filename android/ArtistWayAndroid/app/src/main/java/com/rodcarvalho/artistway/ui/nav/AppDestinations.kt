package com.rodcarvalho.artistway.ui.nav

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector

// Os mesmos 6 destinos de nível superior do painel do UWP (MainPage.xaml,
// SplitView) / drawer da PWA — Home/Progress/ArtistDate/Ferramentas/
// Profile/Settings. Rótulos vêm de UI_STRINGS (content.json), não daqui.
object AppDestinations {
    const val HOME = "home"
    const val PROGRESS = "progress"
    const val ARTIST_DATE = "artistDate"
    const val FERRAMENTAS = "ferramentas"
    const val PROFILE = "profile"
    const val SETTINGS = "settings"

    data class Item(val route: String, val labelKey: String, val icon: ImageVector)

    // 5 destinos na Material 3 NavigationBar (barra inferior) — o teto
    // recomendado pro componente antes de precisar de overflow/"mais".
    // Configurações fica de fora da barra e é alcançada pelo ícone de
    // engrenagem na TopAppBar, padrão comum em apps Android com poucas
    // telas de nível superior (evita estourar o limite de 5 itens).
    val BOTTOM_NAV_ITEMS = listOf(
        Item(HOME, "nav.home", Icons.Filled.Home),
        Item(PROGRESS, "nav.progress", Icons.Filled.DateRange),
        Item(ARTIST_DATE, "nav.artistDate", Icons.Filled.Favorite),
        Item(FERRAMENTAS, "nav.recursos", Icons.Filled.Build),
        Item(PROFILE, "nav.profile", Icons.Filled.Person),
    )

    val ITEMS = BOTTOM_NAV_ITEMS + Item(SETTINGS, "nav.settings", Icons.Filled.Settings)

    // Destinos de detalhe — empilham no NavHost interno em vez de trocar
    // de aba (mesmo espírito do ContentFrame.Navigate empilhando no back
    // stack sem mudar o destino "de nível superior" no UWP).
    const val WEEK_DETAIL_TEMPLATE = "weekDetail/{weekId}"
    const val ESSAY_TEMPLATE = "essay/{weekId}"
    const val CHECKIN_TEMPLATE = "checkin/{weekId}"
    const val CHECKIN_HISTORY = "checkinHistory"
    const val ARTIST_DATE_HISTORY = "artistDateHistory"
    const val REGRAS_DA_ESTRADA = "regrasDaEstrada"
    const val PRINCIPIOS_BASICOS = "principiosBasicos"
    const val BANCO_AFIRMACOES = "bancoAfirmacoes"
    const val TABELA_CRENCAS = "tabelaCrencas"
    const val CIRCULO_SEGURANCA = "circuloSeguranca"
    const val LIFE_PIE = "lifePie"
    const val LIST_TEMPLATE = "list/{listKey}"
    const val QUIZ_TEMPLATE = "quiz/{quizKey}"

    fun weekDetail(weekId: Int) = "weekDetail/$weekId"
    fun essay(weekId: Int) = "essay/$weekId"
    fun checkin(weekId: Int) = "checkin/$weekId"
    fun list(listKey: String) = "list/$listKey"
    fun quiz(quizKey: String) = "quiz/$quizKey"
}
