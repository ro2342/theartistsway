package com.rodcarvalho.artistway.ui.components

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenu
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier

// Convenção "1=Domingo...7=Sábado", igual PWA e UWP.
private val WEEKDAY_NAMES = listOf("", "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeekdayDropdown(label: String, selectedDay: Int, onDaySelected: (Int) -> Unit, modifier: Modifier = Modifier) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = modifier) {
        OutlinedTextField(
            value = WEEKDAY_NAMES[selectedDay],
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable),
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            for (day in 1..7) {
                DropdownMenuItem(
                    text = { Text(WEEKDAY_NAMES[day]) },
                    onClick = {
                        onDaySelected(day)
                        expanded = false
                    },
                )
            }
        }
    }
}

// "HH:mm" <-> hour/minute, mesmo formato salvo em ProfileSettings
// (morningPagesTime, artistDateTime, checkinTime).
fun formatTime(hour: Int, minute: Int): String = "%02d:%02d".format(hour, minute)

fun parseTimeOrDefault(text: String, defaultHour: Int, defaultMinute: Int): Pair<Int, Int> {
    val parts = text.split(":")
    val hour = parts.getOrNull(0)?.toIntOrNull() ?: defaultHour
    val minute = parts.getOrNull(1)?.toIntOrNull() ?: defaultMinute
    return hour to minute
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimePickerField(label: String, time: String, onTimeChange: (String) -> Unit, modifier: Modifier = Modifier) {
    var showDialog by remember { mutableStateOf(false) }
    OutlinedTextField(
        value = time,
        onValueChange = {},
        readOnly = true,
        label = { Text(label) },
        modifier = modifier,
        trailingIcon = {
            TextButton(onClick = { showDialog = true }) { Text("Trocar") }
        },
    )
    if (showDialog) {
        val (defaultHour, defaultMinute) = parseTimeOrDefault(time, 7, 0)
        val state = rememberTimePickerState(initialHour = defaultHour, initialMinute = defaultMinute, is24Hour = true)
        AlertDialog(
            onDismissRequest = { showDialog = false },
            confirmButton = {
                TextButton(onClick = {
                    onTimeChange(formatTime(state.hour, state.minute))
                    showDialog = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) { Text("Cancelar") }
            },
            text = { TimePicker(state = state) },
        )
    }
}
