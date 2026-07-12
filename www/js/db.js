// db.js — camada de persistência local usando IndexedDB.
// Tudo fica no aparelho: nenhum dado sai daqui a menos que o usuário
// explicitamente exporte um backup ou clique em "adicionar ao Google Calendar".

const DB_NAME = "artist-way-companion";
const DB_VERSION = 1;

const STORES = {
  settings: "settings", // { key, value }
  morningPages: "morningPages", // { date: 'YYYY-MM-DD', done: bool }
  artistDates: "artistDates", // { weekStart: 'YYYY-MM-DD', done: bool, idea, note }
  checklist: "checklist", // { id: 'w{n}-i{idx}', weekId, itemIndex, done }
  checkins: "checkins", // { weekId, answers: {...}, savedAt }
  calendarEvents: "calendarEvents", // { type, createdAt } — apenas para saber o que já foi exportado
};

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.morningPages)) {
        db.createObjectStore(STORES.morningPages, { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains(STORES.artistDates)) {
        db.createObjectStore(STORES.artistDates, { keyPath: "weekStart" });
      }
      if (!db.objectStoreNames.contains(STORES.checklist)) {
        db.createObjectStore(STORES.checklist, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.checkins)) {
        db.createObjectStore(STORES.checkins, { keyPath: "weekId" });
      }
      if (!db.objectStoreNames.contains(STORES.calendarEvents)) {
        db.createObjectStore(STORES.calendarEvents, { keyPath: "type" });
      }
    };
    req.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    req.onerror = (event) => reject(event.target.error);
  });
}

async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // objectStore.getAll() é IndexedDB 2.0 -- não existe no motor antigo do
    // WebView do Windows 10 Mobile. Usa cursor manual (IndexedDB 1.0),
    // suportado desde sempre.
    const tx = db.transaction(store, "readonly");
    const results = [];
    const req = tx.objectStore(store).openCursor();
    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Helpers de alto nível ---

async function getSetting(key, fallback = null) {
  const row = await dbGet(STORES.settings, key);
  return row ? row.value : fallback;
}

async function setSetting(key, value) {
  return dbPut(STORES.settings, { key, value });
}

// Carimba _updatedAt junto do perfil -- é o que sync.js usa pra decidir,
// na hora de mesclar com a nuvem, qual cópia (local ou remota) é mais
// recente (mesmo desenho do SetProfileAsync no app do Windows).
async function setProfile(profile) {
  await setSetting("profile", profile);
  await setSetting("_updatedAt", new Date().toISOString());
  if (window.ArtistWaySync) window.ArtistWaySync.scheduleSync();
}

async function touchActivity() {
  await dbPut(STORES.settings, { key: "lastActivityAt", value: new Date().toISOString() });
}

async function toggleMorningPage(dateStr) {
  const existing = await dbGet(STORES.morningPages, dateStr);
  const done = !(existing && existing.done);
  await dbPut(STORES.morningPages, { date: dateStr, done, updatedAt: new Date().toISOString() });
  await touchActivity();
  if (window.ArtistWaySync) window.ArtistWaySync.scheduleSync();
  return done;
}

async function getMorningPagesInRange(startDate, endDate) {
  const all = await dbGetAll(STORES.morningPages);
  return all.filter((r) => r.date >= startDate && r.date <= endDate && r.done);
}

async function getAllMorningPages() {
  return dbGetAll(STORES.morningPages);
}

async function setArtistDate(weekStart, data) {
  const result = await dbPut(
    STORES.artistDates,
    Object.assign({ weekStart: weekStart }, data, { updatedAt: new Date().toISOString() })
  );
  if (window.ArtistWaySync) window.ArtistWaySync.scheduleSync();
  return result;
}

async function getArtistDate(weekStart) {
  return dbGet(STORES.artistDates, weekStart);
}

async function toggleChecklistItem(weekId, itemIndex) {
  const id = `w${weekId}-i${itemIndex}`;
  const existing = await dbGet(STORES.checklist, id);
  const done = !(existing && existing.done);
  await dbPut(STORES.checklist, { id, weekId, itemIndex, done, updatedAt: new Date().toISOString() });
  await touchActivity();
  if (window.ArtistWaySync) window.ArtistWaySync.scheduleSync();
  return done;
}

async function getChecklistForWeek(weekId) {
  const all = await dbGetAll(STORES.checklist);
  return all.filter((r) => r.weekId === weekId);
}

async function saveCheckin(weekId, answers) {
  const result = await dbPut(STORES.checkins, { weekId, answers, savedAt: new Date().toISOString() });
  if (window.ArtistWaySync) window.ArtistWaySync.scheduleSync();
  return result;
}

async function getCheckin(weekId) {
  return dbGet(STORES.checkins, weekId);
}

async function exportAllData() {
  const [settings, morningPages, artistDates, checklist, checkins] = await Promise.all([
    dbGetAll(STORES.settings),
    dbGetAll(STORES.morningPages),
    dbGetAll(STORES.artistDates),
    dbGetAll(STORES.checklist),
    dbGetAll(STORES.checkins),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    settings,
    morningPages,
    artistDates,
    checklist,
    checkins,
  };
}

async function importAllData(payload) {
  const db = await openDB();
  const stores = [
    [STORES.settings, payload.settings],
    [STORES.morningPages, payload.morningPages],
    [STORES.artistDates, payload.artistDates],
    [STORES.checklist, payload.checklist],
    [STORES.checkins, payload.checkins],
  ];
  for (const [storeName, rows] of stores) {
    if (!rows) continue;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const os = tx.objectStore(storeName);
      rows.forEach((r) => os.put(r));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
}

window.ArtistWayDB = {
  STORES,
  dbGetAll,
  dbPut,
  getSetting,
  setSetting,
  setProfile,
  touchActivity,
  toggleMorningPage,
  getMorningPagesInRange,
  getAllMorningPages,
  setArtistDate,
  getArtistDate,
  toggleChecklistItem,
  getChecklistForWeek,
  saveCheckin,
  getCheckin,
  exportAllData,
  importAllData,
};
