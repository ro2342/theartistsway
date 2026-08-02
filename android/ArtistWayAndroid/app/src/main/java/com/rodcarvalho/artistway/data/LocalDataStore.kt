package com.rodcarvalho.artistway.data

import android.content.Context
import com.rodcarvalho.artistway.data.model.ArtistDateEntry
import com.rodcarvalho.artistway.data.model.ArtistDateHistoryItem
import com.rodcarvalho.artistway.data.model.CheckinEntry
import com.rodcarvalho.artistway.data.model.NamedListItem
import com.rodcarvalho.artistway.data.model.ProfileSettings
import com.rodcarvalho.artistway.data.model.WeekCursor
import com.rodcarvalho.artistway.data.model.WeekSummary
import com.rodcarvalho.artistway.sync.SyncScheduler
import com.rodcarvalho.artistway.week.WeekCalculator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put
import java.io.File
import java.time.Instant
import java.time.LocalDate
import kotlin.math.max
import kotlin.math.min

// Substitui a IndexedDB do PWA (www/js/db.js) por arquivos JSON dentro de
// context.filesDir — um arquivo por "store", no mesmo desenho de STORES
// em db.js e de LocalDataStore.cs no UWP. Isso deixa export/import de
// backup trivial: é literalmente empacotar/desempacotar esses arquivos.
object LocalDataStore {
    private lateinit var appContext: Context

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    private const val SETTINGS_FILE = "settings.json"
    private const val MORNING_PAGES_FILE = "morningPages.json"
    private const val ARTIST_DATES_FILE = "artistDates.json"
    private const val CHECKLIST_FILE = "checklist.json"
    private const val CHECKINS_FILE = "checkins.json"
    private const val LISTS_FILE = "lists.json"

    val SYNC_STORE_NAMES = listOf("settings", "morningPages", "artistDates", "checklist", "checkins", "lists")

    private val json = Json { ignoreUnknownKeys = true }

    // — infraestrutura —

    private suspend fun readStore(fileName: String): JsonObject = withContext(Dispatchers.IO) {
        val file = File(appContext.filesDir, fileName)
        if (!file.exists()) return@withContext JsonObject(emptyMap())
        val text = file.readText()
        if (text.isBlank()) return@withContext JsonObject(emptyMap())
        json.parseToJsonElement(text).jsonObject
    }

    private suspend fun writeStore(fileName: String, obj: JsonObject) = withContext(Dispatchers.IO) {
        File(appContext.filesDir, fileName).writeText(obj.toString())
    }

    // — atividade (pro lembrete de Regras da Estrada) —

    suspend fun touchActivity() {
        val settings = readStore(SETTINGS_FILE)
        writeStore(SETTINGS_FILE, settings.withEntry("lastActivityAt", JsonPrimitive(Instant.now().toString())))
    }

    suspend fun getLastActivity(): Instant? {
        val settings = readStore(SETTINGS_FILE)
        val text = settings.stringOrDefault("lastActivityAt", "")
        if (text.isEmpty()) return null
        return runCatching { Instant.parse(text) }.getOrNull()
    }

    // — perfil —

    suspend fun getProfile(): ProfileSettings? {
        val settings = readStore(SETTINGS_FILE)
        val p = settings["profile"] as? JsonObject ?: return null
        return ProfileSettings(
            name = p.stringOrDefault("name", ""),
            startDate = p.stringOrDefault("startDate", ""),
            morningPagesTime = p.stringOrDefault("morningPagesTime", "07:00"),
            artistDateDay = p.stringOrDefault("artistDateDay", "7"),
            artistDateTime = p.stringOrDefault("artistDateTime", "16:00"),
            checkinDay = p.stringOrDefault("checkinDay", "7"),
            checkinTime = p.stringOrDefault("checkinTime", "19:00"),
            onboarded = (p["onboarded"] as? JsonPrimitive)?.booleanOrNull ?: false,
            fontSize = p.stringOrDefault("fontSize", "medium"),
            themeMode = p.stringOrDefault("themeMode", "auto"),
            maintenanceMode = (p["maintenanceMode"] as? JsonPrimitive)?.booleanOrNull ?: false,
            contractSignedName = p.stringOrDefault("contractSignedName", ""),
            contractSignedAt = p.stringOrDefault("contractSignedAt", ""),
            weekCursor = p.weekCursorOrNull(),
        )
    }

    suspend fun setProfile(profile: ProfileSettings) {
        val settings = readStore(SETTINGS_FILE)
        val p = buildJsonObject {
            put("name", profile.name)
            put("startDate", profile.startDate)
            put("morningPagesTime", profile.morningPagesTime)
            put("artistDateDay", profile.artistDateDay)
            put("artistDateTime", profile.artistDateTime)
            put("checkinDay", profile.checkinDay)
            put("checkinTime", profile.checkinTime)
            put("onboarded", profile.onboarded)
            put("fontSize", profile.fontSize)
            put("themeMode", profile.themeMode)
            put("maintenanceMode", profile.maintenanceMode)
            put("contractSignedName", profile.contractSignedName)
            put("contractSignedAt", profile.contractSignedAt)
            profile.weekCursor?.let { wc ->
                put("weekCursor", buildJsonObject {
                    put("weekId", wc.weekId)
                    put("cycleStart", wc.cycleStart)
                })
            }
        }
        // Carimba o blob inteiro de settings — é o que o SyncService usa pra
        // decidir, na hora de mesclar com a nuvem, qual cópia (local ou
        // remota) é mais recente (ver data/sync/SyncService.kt, Fase 6).
        val next = settings.withEntry("profile", p).withEntry("_updatedAt", JsonPrimitive(Instant.now().toString()))
        writeStore(SETTINGS_FILE, next)
        SyncScheduler.scheduleSync()
    }

    // Garante que profile.weekCursor exista, semeando (e salvando) com o
    // cálculo antigo por data na primeira vez que alguém pede — depois
    // disso o cursor só muda por decisão explícita do usuário (ver
    // decideWeekCycle). Idempotente: chamadas seguintes só leem.
    suspend fun getOrSeedWeekCursor(profile: ProfileSettings): WeekCursor {
        profile.weekCursor?.let { return it }
        val seeded = WeekCursor(
            weekId = WeekCalculator.naturalWeekId(profile),
            cycleStart = WeekCalculator.dateToStr(WeekCalculator.currentStreakWeekStart(profile, LocalDate.now())),
        )
        setProfile(profile.copy(weekCursor = seeded))
        return seeded
    }

    // Aplica a decisão do usuário (continuar na semana ou avançar) e
    // reabre um ciclo novo de 7 dias a partir da semana corrente do
    // calendário.
    suspend fun decideWeekCycle(profile: ProfileSettings, advance: Boolean): WeekCursor {
        val current = getOrSeedWeekCursor(profile)
        val weekId = if (advance) min(12, current.weekId + 1) else current.weekId
        return setCurrentWeek(profile, weekId)
    }

    // Define diretamente qual semana é a "atual", abrindo um ciclo novo de
    // 7 dias a partir de hoje. Usado pelo botão "Tornar esta a minha
    // semana atual" na tela da semana — dá pra ir pra qualquer semana,
    // voltar ou adiantar, sem depender do cartão de decisão aparecer
    // sozinho (só aparece quando os 7 dias de um ciclo já correram).
    suspend fun setCurrentWeek(profile: ProfileSettings, weekId: Int): WeekCursor {
        val next = WeekCursor(
            weekId = max(1, min(12, weekId)),
            cycleStart = WeekCalculator.dateToStr(WeekCalculator.currentStreakWeekStart(profile, LocalDate.now())),
        )
        setProfile(profile.copy(weekCursor = next))
        return next
    }

    // Resumo da semana pro cartão de decisão da Home: tarefas concluídas,
    // check-in feito ou não, Artist Date feito ou não, e quantos dias de
    // Morning Pages nesse ciclo de 7 dias.
    suspend fun buildWeekSummary(profile: ProfileSettings, cursor: WeekCursor): WeekSummary {
        val week = ContentStore.content.weeks.firstOrNull { it.id == cursor.weekId }
        val weekKey = WeekCalculator.weekKeyForOffset(profile, cursor.weekId)
        val doneIndexes = getDoneChecklistIndexes(cursor.weekId)
        val checkin = getCheckin(cursor.weekId)
        val artistDate = getArtistDate(weekKey)

        val cycleStart = runCatching { LocalDate.parse(cursor.cycleStart) }.getOrNull()
        val allMp = getAllMorningPages()
        var mpDone = 0
        if (cycleStart != null) {
            for (i in 0 until 7) {
                val key = WeekCalculator.dateToStr(cycleStart.plusDays(i.toLong()))
                if (allMp[key] == true) mpDone++
            }
        }

        val totalItems = week?.checklist?.size ?: 0
        return WeekSummary(
            weekId = cursor.weekId,
            doneCount = doneIndexes.count { it < totalItems },
            totalItems = totalItems,
            checkinDone = checkin != null,
            artistDateDone = artistDate?.done == true,
            morningPagesDone = mpDone,
        )
    }

    // — morning pages —

    suspend fun toggleMorningPage(dateStr: String): Boolean {
        val store = readStore(MORNING_PAGES_FILE)
        val next = !store.readDoneFlag(dateStr)
        writeStore(MORNING_PAGES_FILE, store.withEntry(dateStr, doneEntry(next)))
        touchActivity()
        SyncScheduler.scheduleSync()
        return next
    }

    suspend fun getAllMorningPages(): Map<String, Boolean> {
        val store = readStore(MORNING_PAGES_FILE)
        return store.keys.filter { it != "_updatedAt" }.associateWith { store.readDoneFlag(it) }
    }

    // — artist date —

    suspend fun getArtistDate(weekStart: String): ArtistDateEntry? {
        val store = readStore(ARTIST_DATES_FILE)
        val entry = store[weekStart] as? JsonObject ?: return null
        return ArtistDateEntry(
            done = (entry["done"] as? JsonPrimitive)?.booleanOrNull ?: false,
            idea = entry.stringOrDefault("idea", ""),
        )
    }

    suspend fun setArtistDate(weekStart: String, data: ArtistDateEntry) {
        val store = readStore(ARTIST_DATES_FILE)
        val entry = buildJsonObject {
            put("done", data.done)
            put("idea", data.idea)
            put("updatedAt", Instant.now().toString())
        }
        writeStore(ARTIST_DATES_FILE, store.withEntry(weekStart, entry))
        SyncScheduler.scheduleSync()
    }

    // Pro histórico de Artist Dates (Recursos -> Histórico) — só leitura,
    // não adiciona nenhum store novo.
    suspend fun getAllArtistDates(): List<ArtistDateHistoryItem> {
        val store = readStore(ARTIST_DATES_FILE)
        return store.entries
            .mapNotNull { (key, value) ->
                val entry = value as? JsonObject ?: return@mapNotNull null
                val done = (entry["done"] as? JsonPrimitive)?.booleanOrNull ?: false
                val idea = entry.stringOrDefault("idea", "")
                if (!done && idea.isEmpty()) null else ArtistDateHistoryItem(key, done, idea)
            }
            .sortedByDescending { it.weekStart }
    }

    // — checklist —

    private fun checklistKey(weekId: Int, itemIndex: Int) = "w$weekId-i$itemIndex"

    suspend fun toggleChecklistItem(weekId: Int, itemIndex: Int): Boolean {
        val store = readStore(CHECKLIST_FILE)
        val key = checklistKey(weekId, itemIndex)
        val next = !store.readDoneFlag(key)
        writeStore(CHECKLIST_FILE, store.withEntry(key, doneEntry(next)))
        touchActivity()
        SyncScheduler.scheduleSync()
        return next
    }

    // Retorna só os itemIndex marcados como concluídos pra essa semana.
    suspend fun getDoneChecklistIndexes(weekId: Int): Set<Int> {
        val store = readStore(CHECKLIST_FILE)
        val prefix = "w$weekId-i"
        return store.keys
            .filter { it.startsWith(prefix) && store.readDoneFlag(it) }
            .mapNotNull { it.substring(prefix.length).toIntOrNull() }
            .toSet()
    }

    // — check-ins —

    suspend fun getCheckin(weekId: Int): CheckinEntry? {
        val store = readStore(CHECKINS_FILE)
        val entry = store[weekId.toString()] as? JsonObject ?: return null
        val answers = (entry["answers"] as? JsonObject)?.entries
            ?.associate { (k, v) -> k to ((v as? JsonPrimitive)?.takeIf { it.isString }?.content ?: "") }
            ?: emptyMap()
        return CheckinEntry(answers = answers, savedAt = entry.stringOrDefault("savedAt", ""))
    }

    // Pra tela de índice "Reler check-ins antigos" (Recursos -> Histórico)
    // — só precisa saber quais semanas já têm check-in salvo.
    suspend fun getWeeksWithCheckin(): Set<Int> {
        val store = readStore(CHECKINS_FILE)
        return store.keys.mapNotNull { it.toIntOrNull() }.toSet()
    }

    suspend fun saveCheckin(weekId: Int, answers: Map<String, String>) {
        val store = readStore(CHECKINS_FILE)
        val answersObj = buildJsonObject { answers.forEach { (k, v) -> put(k, v) } }
        val entry = buildJsonObject {
            put("answers", answersObj)
            put("savedAt", Instant.now().toString())
        }
        writeStore(CHECKINS_FILE, store.withEntry(weekId.toString(), entry))
        SyncScheduler.scheduleSync()
    }

    // — backup: exportar/importar —

    suspend fun exportAllData(): String {
        val bundle = buildJsonObject {
            put("exportedAt", Instant.now().toString())
            put("settings", readStore(SETTINGS_FILE))
            put("morningPages", readStore(MORNING_PAGES_FILE))
            put("artistDates", readStore(ARTIST_DATES_FILE))
            put("checklist", readStore(CHECKLIST_FILE))
            put("checkins", readStore(CHECKINS_FILE))
            put("lists", readStore(LISTS_FILE))
        }
        return bundle.toString()
    }

    suspend fun importAllData(text: String) {
        val bundle = json.parseToJsonElement(text).jsonObject
        (bundle["settings"] as? JsonObject)?.let { writeStore(SETTINGS_FILE, it) }
        (bundle["morningPages"] as? JsonObject)?.let { writeStore(MORNING_PAGES_FILE, it) }
        (bundle["artistDates"] as? JsonObject)?.let { writeStore(ARTIST_DATES_FILE, it) }
        (bundle["checklist"] as? JsonObject)?.let { writeStore(CHECKLIST_FILE, it) }
        (bundle["checkins"] as? JsonObject)?.let { writeStore(CHECKINS_FILE, it) }
        (bundle["lists"] as? JsonObject)?.let { writeStore(LISTS_FILE, it) }
    }

    // — listas nomeadas (Vidas Imaginárias, 20 Coisas, Mapa do Ciúme,
    // Círculo de Segurança, Life Pie) — um arquivo só (lists.json), chave
    // "<listName>/<itemId>": toda funcionalidade nova desse tipo usa o
    // mesmo mecanismo de guardar/sincronizar, em vez de um arquivo/store
    // por funcionalidade. Itens só são adicionados/editados, nunca
    // removidos (sem problema de "tombstone" na mesclagem do sync).

    suspend fun addListItem(listName: String, fields: Map<String, String>): String {
        val itemId = java.util.UUID.randomUUID().toString().replace("-", "")
        updateListItem(listName, itemId, fields)
        return itemId
    }

    suspend fun updateListItem(listName: String, itemId: String, fields: Map<String, String>) {
        val store = readStore(LISTS_FILE)
        val entry = buildJsonObject {
            put("listName", listName)
            put("updatedAt", Instant.now().toString())
            fields.forEach { (k, v) -> put(k, v) }
        }
        writeStore(LISTS_FILE, store.withEntry(listItemKey(listName, itemId), entry))
        SyncScheduler.scheduleSync()
    }

    suspend fun getListItems(listName: String): List<NamedListItem> {
        val store = readStore(LISTS_FILE)
        val prefix = "$listName/"
        return store.entries
            .filter { it.key.startsWith(prefix) }
            .mapNotNull { (key, value) ->
                val entry = value as? JsonObject ?: return@mapNotNull null
                val fields = entry.entries
                    .filter { it.key != "listName" && it.key != "updatedAt" }
                    .mapNotNull { (k, v) -> (v as? JsonPrimitive)?.takeIf { it.isString }?.let { k to it.content } }
                    .toMap()
                NamedListItem(
                    id = key.substring(prefix.length),
                    fields = fields,
                    updatedAt = entry.stringOrDefault("updatedAt", ""),
                )
            }
    }

    private fun listItemKey(listName: String, itemId: String) = "$listName/$itemId"

    // — resetar —

    // Apaga todos os dados do usuário do aparelho (perfil, Morning Pages,
    // Artist Dates, checklist, check-ins, listas). Não afeta
    // assets/content.json (conteúdo do livro, empacotado no app).
    suspend fun resetAll() = withContext(Dispatchers.IO) {
        listOf(SETTINGS_FILE, MORNING_PAGES_FILE, ARTIST_DATES_FILE, CHECKLIST_FILE, CHECKINS_FILE, LISTS_FILE)
            .forEach { File(appContext.filesDir, it).delete() }
    }

    // — acesso genérico por nome (usado pelo SyncService, Fase 6) —

    private fun fileNameFor(storeName: String): String = when (storeName) {
        "settings" -> SETTINGS_FILE
        "morningPages" -> MORNING_PAGES_FILE
        "artistDates" -> ARTIST_DATES_FILE
        "checklist" -> CHECKLIST_FILE
        "checkins" -> CHECKINS_FILE
        "lists" -> LISTS_FILE
        else -> throw IllegalArgumentException("Store desconhecido: $storeName")
    }

    suspend fun getStoreForSync(storeName: String): JsonObject = readStore(fileNameFor(storeName))

    suspend fun writeStoreForSync(storeName: String, obj: JsonObject) = writeStore(fileNameFor(storeName), obj)

    // — helpers —

    private fun doneEntry(done: Boolean) = buildJsonObject {
        put("done", done)
        put("updatedAt", Instant.now().toString())
    }

    private fun JsonObject.stringOrDefault(key: String, fallback: String): String {
        val value = this[key] as? JsonPrimitive ?: return fallback
        return if (value.isString) value.content else fallback
    }

    // Lê o campo "done" de um registro, aceitando tanto o formato novo
    // ({ done, updatedAt }) quanto o booleano solto de versões antigas do
    // app (antes da sincronização existir) — não precisa de migração
    // ativa, só compatibilidade na leitura.
    private fun JsonObject.readDoneFlag(key: String): Boolean {
        val value = this[key] ?: return false
        if (value is JsonObject) {
            return (value["done"] as? JsonPrimitive)?.booleanOrNull ?: false
        }
        return (value as? JsonPrimitive)?.booleanOrNull ?: false
    }

    private fun JsonObject.weekCursorOrNull(): WeekCursor? {
        val wc = this["weekCursor"] as? JsonObject ?: return null
        val cycleStart = wc.stringOrDefault("cycleStart", "")
        val weekId = (wc["weekId"] as? JsonPrimitive)?.intOrNull ?: 0
        if (weekId <= 0 || cycleStart.isEmpty()) return null
        return WeekCursor(weekId, cycleStart)
    }

    private fun JsonObject.withEntry(key: String, value: JsonElement): JsonObject {
        val map = LinkedHashMap(this)
        map[key] = value
        return JsonObject(map)
    }
}
