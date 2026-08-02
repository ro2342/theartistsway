package com.rodcarvalho.artistway.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ArtistWayAccent = Color(0xFFA8752C)
private val ArtistWayBackgroundLight = Color(0xFFF3EAD9)

private val LightColors = lightColorScheme(
    primary = ArtistWayAccent,
    background = ArtistWayBackgroundLight,
)

private val DarkColors = darkColorScheme(
    primary = ArtistWayAccent,
)

@Composable
fun ArtistWayTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
