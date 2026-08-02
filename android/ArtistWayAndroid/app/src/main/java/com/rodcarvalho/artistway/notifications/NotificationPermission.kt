package com.rodcarvalho.artistway.notifications

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable

// Pede a permissão de notificação em runtime (Android 13+ — antes disso
// não existe esse conceito, a chamada não faz nada). Se a pessoa negar,
// os alarmes continuam sendo agendados normalmente, só a notificação
// visual não aparece — sem crash, degrada de forma graciosa.
@Composable
fun rememberNotificationPermissionRequester(): () -> Unit {
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
    return {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
