package com.rodcarvalho.artistway.ui.nav

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

    data class Item(val route: String, val labelKey: String)

    val ITEMS = listOf(
        Item(HOME, "nav.home"),
        Item(PROGRESS, "nav.progress"),
        Item(ARTIST_DATE, "nav.artistDate"),
        Item(FERRAMENTAS, "nav.recursos"),
        Item(PROFILE, "nav.profile"),
        Item(SETTINGS, "nav.settings"),
    )

    // Destinos de detalhe — empilham no NavHost interno em vez de trocar
    // de aba (mesmo espírito do ContentFrame.Navigate empilhando no back
    // stack sem mudar o destino "de nível superior" no UWP).
    const val WEEK_DETAIL_TEMPLATE = "weekDetail/{weekId}"
    const val ESSAY_TEMPLATE = "essay/{weekId}"
    const val CHECKIN_TEMPLATE = "checkin/{weekId}"
    const val CHECKIN_HISTORY = "checkinHistory"
    const val ARTIST_DATE_HISTORY = "artistDateHistory"
    const val REGRAS_DA_ESTRADA = "regrasDaEstrada"

    fun weekDetail(weekId: Int) = "weekDetail/$weekId"
    fun essay(weekId: Int) = "essay/$weekId"
    fun checkin(weekId: Int) = "checkin/$weekId"
}
