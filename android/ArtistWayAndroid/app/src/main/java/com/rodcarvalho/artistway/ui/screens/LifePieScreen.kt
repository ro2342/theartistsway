package com.rodcarvalho.artistway.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rodcarvalho.artistway.data.ContentStore
import com.rodcarvalho.artistway.data.LocalDataStore
import com.rodcarvalho.artistway.data.model.NamedListItem
import kotlinx.coroutines.launch
import java.time.LocalDate
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

private const val LIST_NAME = "lifePie"

private data class LifePieCategory(val key: String, val label: String)

private fun categories(): List<LifePieCategory> = listOf(
    LifePieCategory("espiritualidade", ContentStore.s("lifePie.categorySpiritualidade")),
    LifePieCategory("trabalho", ContentStore.s("lifePie.categoryTrabalho")),
    LifePieCategory("lazer", ContentStore.s("lifePie.categoryLazer")),
    LifePieCategory("amigos", ContentStore.s("lifePie.categoryAmigos")),
    LifePieCategory("romance", ContentStore.s("lifePie.categoryRomance")),
    LifePieCategory("exercicio", ContentStore.s("lifePie.categoryExercicio")),
)

private fun ratingsFromItem(item: NamedListItem, categories: List<LifePieCategory>): Map<String, Float> =
    categories.mapNotNull { cat ->
        item.fields["ratings.${cat.key}"]?.toFloatOrNull()?.let { cat.key to it }
    }.toMap()

// Gráfico de radar desenhado à mão com Canvas — espelha LifePiePage.xaml.cs
// (Polygon/Line/Ellipse no UWP, mesma trigonometria do /life-pie do PWA).
@Composable
fun LifePieScreen() {
    val categories = remember { categories() }
    val scope = rememberCoroutineScope()
    val ratings = remember { mutableStateMapOf<String, Float>() }
    var previousRatings by remember { mutableStateOf<Map<String, Float>?>(null) }
    var history by remember { mutableStateOf<List<NamedListItem>>(emptyList()) }

    LaunchedEffect(Unit) {
        val items = LocalDataStore.getListItems(LIST_NAME).sortedBy { it.updatedAt }
        val previous = items.lastOrNull()
        previousRatings = previous?.let { ratingsFromItem(it, categories) }
        categories.forEach { cat -> ratings[cat.key] = previousRatings?.get(cat.key) ?: 5f }
        history = items
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(ContentStore.s("tools.lifePie"), style = MaterialTheme.typography.headlineSmall)
        Text(
            ContentStore.s("lifePie.hint") +
                if (previousRatings != null) ContentStore.s("lifePie.hintPreviousNote") else "",
            style = MaterialTheme.typography.bodyMedium,
        )

        LifePieCanvas(
            categories = categories,
            ratings = ratings,
            previousRatings = previousRatings,
            onDrag = { index, value -> ratings[categories[index].key] = value },
        )

        Button(
            onClick = {
                val fields = mutableMapOf("date" to LocalDate.now().toString())
                categories.forEach { cat -> fields["ratings.${cat.key}"] = (ratings[cat.key] ?: 5f).roundToInt().toString() }
                scope.launch {
                    LocalDataStore.addListItem(LIST_NAME, fields)
                    val items = LocalDataStore.getListItems(LIST_NAME).sortedBy { it.updatedAt }
                    previousRatings = ratingsFromItem(items.last(), categories)
                    history = items
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(ContentStore.s("lifePie.saveButton")) }

        if (history.isNotEmpty()) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(ContentStore.s("lifePie.historyTitle"), style = MaterialTheme.typography.titleMedium)
                    history.asReversed().forEach { item ->
                        val ratingsForItem = ratingsFromItem(item, categories)
                        val date = (item.fields["date"] ?: item.updatedAt).take(10)
                        val summary = categories.joinToString(", ") { cat ->
                            "${cat.label.take(3)} ${(ratingsForItem[cat.key] ?: 0f).roundToInt()}"
                        }
                        Text("$date — $summary", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun LifePieCanvas(
    categories: List<LifePieCategory>,
    ratings: Map<String, Float>,
    previousRatings: Map<String, Float>?,
    onDrag: (index: Int, value: Float) -> Unit,
) {
    var dragPosition by remember { mutableStateOf<Offset?>(null) }
    val accentColor = MaterialTheme.colorScheme.primary
    val gridColor = MaterialTheme.colorScheme.outlineVariant
    val previousColor = MaterialTheme.colorScheme.onSurfaceVariant
    val labelColor = MaterialTheme.colorScheme.onSurface
    val textMeasurer = rememberTextMeasurer()
    val labelStyle = TextStyle(fontSize = 11.sp, textAlign = TextAlign.Center, color = labelColor)

    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = { offset ->
                        dragPosition = offset
                        val center = Offset(size.width / 2f, size.height / 2f)
                        val maxRadius = min(size.width, size.height) / 2f * 0.62f
                        updateFromPoint(offset, center, maxRadius, categories.size, onDrag)
                    },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        val next = (dragPosition ?: change.position) + dragAmount
                        dragPosition = next
                        val center = Offset(size.width / 2f, size.height / 2f)
                        val maxRadius = min(size.width, size.height) / 2f * 0.62f
                        updateFromPoint(next, center, maxRadius, categories.size, onDrag)
                    },
                    onDragEnd = { dragPosition = null },
                )
            },
    ) {
        val center = Offset(this.size.width / 2f, this.size.height / 2f)
        val maxRadius = min(this.size.width, this.size.height) / 2f * 0.62f
        val n = categories.size

        fun axisPoint(index: Int, value: Float): Offset {
            val angle = (2.0 * PI * index / n) - PI / 2.0
            val r = (value / 10f) * maxRadius
            return Offset(center.x + (r * cos(angle)).toFloat(), center.y + (r * sin(angle)).toFloat())
        }

        for (ring in listOf(2, 4, 6, 8, 10)) {
            val path = Path()
            for (i in 0 until n) {
                val p = axisPoint(i, ring.toFloat())
                if (i == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y)
            }
            path.close()
            drawPath(path, color = gridColor, style = Stroke(width = 1f))
        }

        for (i in 0 until n) {
            val edge = axisPoint(i, 10f)
            drawLine(gridColor, center, edge, strokeWidth = 1f, cap = StrokeCap.Round)

            val labelPoint = axisPoint(i, 12.6f)
            val layout = textMeasurer.measure(categories[i].label, labelStyle)
            drawText(
                layout,
                topLeft = Offset(labelPoint.x - layout.size.width / 2f, labelPoint.y - layout.size.height / 2f),
            )
        }

        if (previousRatings != null) {
            val path = Path()
            for (i in 0 until n) {
                val value = previousRatings[categories[i].key] ?: 0f
                val p = axisPoint(i, value)
                if (i == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y)
            }
            path.close()
            drawPath(path, color = previousColor.copy(alpha = 0.5f), style = Stroke(width = 2f))
            drawPath(path, color = previousColor.copy(alpha = 0.12f))
        }

        val currentPath = Path()
        for (i in 0 until n) {
            val value = ratings[categories[i].key] ?: 5f
            val p = axisPoint(i, value)
            if (i == 0) currentPath.moveTo(p.x, p.y) else currentPath.lineTo(p.x, p.y)
            drawCircle(color = accentColor, radius = 7f, center = p)
        }
        currentPath.close()
        drawPath(currentPath, color = accentColor.copy(alpha = 0.25f))
        drawPath(currentPath, color = accentColor, style = Stroke(width = 2f))
    }
}

private fun updateFromPoint(point: Offset, center: Offset, maxRadius: Float, categoryCount: Int, onDrag: (Int, Float) -> Unit) {
    val x = point.x - center.x
    val y = point.y - center.y
    var angle = atan2(y.toDouble(), x.toDouble()) + PI / 2
    if (angle < 0) angle += 2 * PI
    val index = ((angle / (2 * PI / categoryCount)).roundToInt()) % categoryCount
    val dist = sqrt((x * x + y * y).toDouble())
    val value = max(0f, min(10f, (dist / maxRadius * 10).roundToInt().toFloat()))
    onDrag(index, value)
}
