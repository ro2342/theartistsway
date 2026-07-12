// sync.js — motor de sincronização com o Firestore, espelhando
// Services/SyncService.cs do app UWP: pra cada "store", puxa a versão da
// nuvem, mescla com a local registro a registro por updatedAt (quem for
// mais recente vence), grava o resultado local e sobe de volta -- sempre
// nos dois sentidos, sempre idempotente. Sem listener em tempo real: cada
// sincronização é só um request/response HTTP curto (ver "Decisões de
// arquitetura" em sincronizacao-nuvem-setup.md).

const FIRESTORE_PROJECT_ID = "theartistsway";
const SYNC_STORE_NAMES = ["settings", "morningPages", "artistDates", "checklist", "checkins", "lists"];
const SYNC_DEBOUNCE_MS = 5000;

let syncDebounceTimer = null;

// Chamado pelas funções de db.js que gravam dado do usuário -- espera a
// "rajada" de toques parar antes de gastar uma chamada de rede.
function scheduleSync() {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    syncDebounceTimer = null;
    syncAll().catch((err) => console.warn("Sincronização falhou:", err));
  }, SYNC_DEBOUNCE_MS);
}

async function syncAll() {
  const session = await window.ArtistWayAuth.getSession();
  if (!session) {
    return "Não logado -- nada pra sincronizar.";
  }

  let activeSession = session;
  if (window.ArtistWayAuth.needsRefresh(activeSession)) {
    activeSession = await window.ArtistWayAuth.refreshIdToken(activeSession);
    if (!activeSession) {
      return "Sessão expirada -- entre de novo.";
    }
  }

  try {
    for (const storeName of SYNC_STORE_NAMES) {
      await syncStore(activeSession, storeName);
    }
    return "Sincronizado às " + new Date().toTimeString().slice(0, 5);
  } catch (err) {
    return "Falha ao sincronizar (tentará de novo mais tarde): " + err.message;
  }
}

// Apaga os dados da nuvem (todos os stores) sem mexer no login -- usado
// pelo reset "Apagar meus dados" (mantém o aparelho logado). A conta em si
// nunca é apagada, só o que está guardado nela.
async function clearCloudData() {
  const session = await window.ArtistWayAuth.getSession();
  if (!session) {
    return true;
  }

  let activeSession = session;
  if (window.ArtistWayAuth.needsRefresh(activeSession)) {
    activeSession = await window.ArtistWayAuth.refreshIdToken(activeSession);
    if (!activeSession) {
      return false;
    }
  }

  try {
    for (const storeName of SYNC_STORE_NAMES) {
      const response = await fetch(docUrl(activeSession.uid, storeName), {
        method: "DELETE",
        headers: { Authorization: "Bearer " + activeSession.idToken },
      });
      if (!response.ok && response.status !== 404) {
        return false;
      }
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function syncStore(session, storeName) {
  const local = await buildStoreBlob(storeName);
  const remote = await getRemoteStore(session, storeName);
  const merged =
    storeName === "settings"
      ? mergeWholeBlob(local, remote)
      : mergePerRecord(local, remote, storeName === "checkins" ? "savedAt" : "updatedAt");
  await applyStoreBlob(storeName, merged);
  await putRemoteStore(session, storeName, merged);
}

// ---------- mesclagem ----------

function mergeWholeBlob(local, remote) {
  const hasRemote = Object.keys(remote).length > 0;
  const hasLocal = Object.keys(local).length > 0;
  if (!hasRemote) return local;
  if (!hasLocal) return remote;
  const localTs = Date.parse(local._updatedAt || 0) || 0;
  const remoteTs = Date.parse(remote._updatedAt || 0) || 0;
  return remoteTs > localTs ? remote : local;
}

function mergePerRecord(local, remote, tsField) {
  const merged = {};
  const keys = new Set(Object.keys(local).concat(Object.keys(remote)));
  keys.forEach((key) => {
    const hasLocal = Object.prototype.hasOwnProperty.call(local, key);
    const hasRemote = Object.prototype.hasOwnProperty.call(remote, key);
    if (hasLocal && hasRemote) {
      const localTs = Date.parse(local[key][tsField] || 0) || 0;
      const remoteTs = Date.parse(remote[key][tsField] || 0) || 0;
      merged[key] = remoteTs > localTs ? remote[key] : local[key];
    } else if (hasLocal) {
      merged[key] = local[key];
    } else {
      merged[key] = remote[key];
    }
  });
  return merged;
}

// ---------- monta/aplica o blob local, um por store ----------

async function buildStoreBlob(storeName) {
  const db = window.ArtistWayDB;
  switch (storeName) {
    case "settings":
      return {
        profile: await db.getSetting("profile", null),
        lastActivityAt: await db.getSetting("lastActivityAt", null),
        _updatedAt: await db.getSetting("_updatedAt", null),
      };
    case "morningPages": {
      const rows = await db.dbGetAll(db.STORES.morningPages);
      const blob = {};
      rows.forEach((r) => {
        blob[r.date] = { done: !!r.done, updatedAt: r.updatedAt || null };
      });
      return blob;
    }
    case "artistDates": {
      const rows = await db.dbGetAll(db.STORES.artistDates);
      const blob = {};
      rows.forEach((r) => {
        blob[r.weekStart] = { done: !!r.done, idea: r.idea || "", updatedAt: r.updatedAt || null };
      });
      return blob;
    }
    case "checklist": {
      const rows = await db.dbGetAll(db.STORES.checklist);
      const blob = {};
      rows.forEach((r) => {
        blob[r.id] = { done: !!r.done, updatedAt: r.updatedAt || null };
      });
      return blob;
    }
    case "checkins": {
      const rows = await db.dbGetAll(db.STORES.checkins);
      const blob = {};
      rows.forEach((r) => {
        blob[String(r.weekId)] = { answers: r.answers || {}, savedAt: r.savedAt || null };
      });
      return blob;
    }
    case "lists": {
      const rows = await db.dbGetAll(db.STORES.lists);
      const blob = {};
      rows.forEach((r) => {
        const { id, ...fields } = r;
        blob[id] = fields;
      });
      return blob;
    }
    default:
      return {};
  }
}

async function applyStoreBlob(storeName, merged) {
  const db = window.ArtistWayDB;
  switch (storeName) {
    case "settings":
      await db.setSetting("profile", merged.profile || null);
      await db.setSetting("lastActivityAt", merged.lastActivityAt || null);
      await db.setSetting("_updatedAt", merged._updatedAt || null);
      // Se accent/tema mudou em outro aparelho, reflete aqui assim que
      // a sincronização pousa -- sem precisar reabrir o app.
      if (window.ArtistWayTheme && merged.profile) {
        window.ArtistWayTheme.applyTheme(merged.profile);
      }
      return;
    case "morningPages":
      for (const date of Object.keys(merged)) {
        await db.dbPut(db.STORES.morningPages, { date, done: !!merged[date].done, updatedAt: merged[date].updatedAt });
      }
      return;
    case "artistDates":
      for (const weekStart of Object.keys(merged)) {
        const entry = merged[weekStart];
        await db.dbPut(db.STORES.artistDates, { weekStart, done: !!entry.done, idea: entry.idea || "", updatedAt: entry.updatedAt });
      }
      return;
    case "checklist":
      for (const id of Object.keys(merged)) {
        // A chave codifica semana/índice ("w{n}-i{idx}") -- reconstrói os
        // dois campos pro filtro por semana que getChecklistForWeek usa.
        const match = /^w(\d+)-i(\d+)$/.exec(id);
        if (!match) continue;
        await db.dbPut(db.STORES.checklist, {
          id,
          weekId: parseInt(match[1], 10),
          itemIndex: parseInt(match[2], 10),
          done: !!merged[id].done,
          updatedAt: merged[id].updatedAt,
        });
      }
      return;
    case "checkins":
      for (const weekId of Object.keys(merged)) {
        const entry = merged[weekId];
        await db.dbPut(db.STORES.checkins, { weekId: parseInt(weekId, 10), answers: entry.answers || {}, savedAt: entry.savedAt });
      }
      return;
    case "lists":
      for (const id of Object.keys(merged)) {
        await db.dbPut(db.STORES.lists, Object.assign({ id }, merged[id]));
      }
      return;
  }
}

// ---------- Firestore REST ----------
// Cada store vira um documento com um único campo "data" (o JSON inteiro do
// store, como string) -- evita traduzir pro formato de tipos nativos do
// Firestore pra estruturas que, na prática, o app só lê/escreve como blob.

function docUrl(uid, storeName) {
  return `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${uid}/stores/${storeName}`;
}

async function getRemoteStore(session, storeName) {
  const response = await fetch(docUrl(session.uid, storeName), {
    headers: { Authorization: "Bearer " + session.idToken },
  });
  if (response.status === 404) {
    return {};
  }
  if (!response.ok) {
    throw new Error(`Firestore GET ${storeName}: ${response.status}`);
  }
  const doc = await response.json();
  if (!doc.fields || !doc.fields.data) {
    return {};
  }
  return JSON.parse(doc.fields.data.stringValue);
}

async function putRemoteStore(session, storeName, data) {
  const body = {
    fields: {
      data: { stringValue: JSON.stringify(data) },
      updatedAt: { timestampValue: new Date().toISOString() },
    },
  };
  const response = await fetch(docUrl(session.uid, storeName), {
    method: "PATCH",
    headers: { Authorization: "Bearer " + session.idToken, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore PATCH ${storeName}: ${response.status} ${text}`);
  }
}

// ---------- gatilhos ----------
// Sem polling nem conexão persistente -- só ao voltar pra aba (pega o que
// mudou em outro aparelho) e no debounce acima (ver scheduleSync).

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    syncAll().catch((err) => console.warn("Sincronização falhou:", err));
  }
});
window.addEventListener("focus", () => {
  syncAll().catch((err) => console.warn("Sincronização falhou:", err));
});

window.ArtistWaySync = { scheduleSync, syncAll, clearCloudData };

// Sincroniza uma vez ao carregar o app, se já tiver login guardado -- é
// aqui que pegamos o que mudou em outro aparelho desde a última vez que
// esse ficou aberto (equivalente ao OnLaunched/Resuming do app UWP).
window.ArtistWayAuth.getSession().then((session) => {
  if (session) syncAll().catch((err) => console.warn("Sincronização falhou:", err));
});
