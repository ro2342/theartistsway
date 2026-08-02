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
}
