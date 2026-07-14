// notifications.js
// Quando rodando como APK (Capacitor), usa o plugin nativo @capacitor/local-notifications.
// Quando rodando como app UWP (Windows 10 Mobile), envia uma mensagem em JSON para o
// código C# via window.external.notify, que agenda notificações nativas do Windows.
// Quando rodando como PWA no navegador, usa a Notification API como reforço visual
// enquanto o app está aberto — o canal confiável nesse modo é o Google Calendar.

const NOTIF_IDS = {
  morningPages: 1001,
  artistDate: 1002,
  checkin: 1003,
};

function isNativeCapacitor() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

// Detecta o host UWP (WebView de um app C#/UWP com ponte window.external.notify).
// PWAs/navegadores comuns não implementam window.external.notify, então essa
// checagem é segura e não dispara em nenhum outro ambiente.
function isUwpHost() {
  try {
    // Em WebViews antigas, window.external.notify pode ser um método de
    // objeto host (COM) e não reportar typeof "function" — checa presença
    // em vez de tipo estrito.
    return !!(window.external && window.external.notify);
  } catch (e) {
    return false;
  }
}

// Detecta se estamos rodando dentro do WebView empacotado (protocolo
// ms-appx-web:), mesmo quando window.external.notify não está disponível
// nesse aparelho específico. Nesse caso não existe UI de permissão de
// notificação do navegador pra mostrar, então nem vale a pena chamar
// Notification.requestPermission() — em alguns WebViews antigos essa
// chamada nunca resolve.
function isPackagedWebViewHost() {
  try {
    return location.protocol.indexOf("ms-appx") === 0;
  } catch (e) {
    return false;
  }
}

function sendToUwp(payload) {
  window.external.notify(JSON.stringify(payload));
}

async function requestPermission() {
  if (isNativeCapacitor() && window.Capacitor.Plugins.LocalNotifications) {
    const { display } = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
    if (display !== "granted") {
      await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
    }
    return true;
  }
  if (isUwpHost() || isPackagedWebViewHost()) {
    // Toast notifications no UWP não exigem uma etapa de permissão em
    // runtime, e dentro do WebView empacotado não há UI de permissão do
    // navegador pra mostrar de qualquer forma.
    return true;
  }
  if ("Notification" in window) {
    try {
      // Em alguns WebViews antigos/incompletos, requestPermission() nunca
      // resolve (não há UI de permissão pra mostrar) — limita a espera pra
      // nunca travar o fluxo do app. Também protege contra a chamada
      // lançando exceção síncrona (visto em WebViews com objetos host
      // quebrados, ex.: window.external nesse mesmo aparelho).
      const timeout = new Promise((resolve) => setTimeout(() => resolve("default"), 2000));
      const perm = await Promise.race([Notification.requestPermission(), timeout]);
      return perm === "granted";
    } catch (err) {
      return false;
    }
  }
  return false;
}

// weekday: 1 (domingo) ... 7 (sábado), seguindo a convenção do evento_create_v1 (1-indexed, domingo=1)
// Capacitor LocalNotifications usa 1=domingo...7=sábado também (padrão iOS/Android bridge).
async function scheduleDaily(id, title, body, hour, minute) {
  if (isNativeCapacitor() && window.Capacitor.Plugins.LocalNotifications) {
    await window.Capacitor.Plugins.LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
        },
      ],
    });
  } else {
    console.info(
      `[web] Notificação diária "${title}" às ${hour}:${String(minute).padStart(2, "0")} — no navegador isso só funciona com o app aberto. No APK, será nativa.`
    );
  }
}

async function scheduleWeekly(id, title, body, weekday, hour, minute) {
  if (isNativeCapacitor() && window.Capacitor.Plugins.LocalNotifications) {
    await window.Capacitor.Plugins.LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { on: { weekday, hour, minute }, repeats: true, allowWhileIdle: true },
        },
      ],
    });
  } else {
    console.info(
      `[web] Notificação semanal "${title}" (dia ${weekday}) às ${hour}:${String(minute).padStart(2, "0")}.`
    );
  }
}

async function cancelAll() {
  if (isNativeCapacitor() && window.Capacitor.Plugins.LocalNotifications) {
    await window.Capacitor.Plugins.LocalNotifications.cancel({
      notifications: Object.values(NOTIF_IDS).map((id) => ({ id })),
    });
  }
}

async function applySettings(settings) {
  // settings: { morningPagesTime: 'HH:MM', artistDateDay, artistDateTime, checkinDay, checkinTime }
  await requestPermission();

  if (isUwpHost()) {
    // O C# do lado do app UWP cuida de cancelar as notificações antigas e
    // agendar as novas (toasts nativos do Windows) a partir desse pacote.
    sendToUwp({
      type: "scheduleNotifications",
      morningPagesTime: settings.morningPagesTime || null,
      artistDateDay: settings.artistDateDay != null ? Number(settings.artistDateDay) : null,
      artistDateTime: settings.artistDateTime || null,
      checkinDay: settings.checkinDay != null ? Number(settings.checkinDay) : null,
      checkinTime: settings.checkinTime || null,
    });
    return;
  }

  await cancelAll();

  if (settings.morningPagesTime) {
    const [h, m] = settings.morningPagesTime.split(":").map(Number);
    await scheduleDaily(
      NOTIF_IDS.morningPages,
      "Hora das Morning Pages",
      "Três páginas, sem reler. Só você e o papel.",
      h,
      m
    );
  }
  if (settings.artistDateDay != null && settings.artistDateTime) {
    const [h, m] = settings.artistDateTime.split(":").map(Number);
    await scheduleWeekly(
      NOTIF_IDS.artistDate,
      "Que tal um Artist Date?",
      "Reserve um tempinho sozinho(a) essa semana, só por prazer.",
      Number(settings.artistDateDay),
      h,
      m
    );
  }
  if (settings.checkinDay != null && settings.checkinTime) {
    const [h, m] = settings.checkinTime.split(":").map(Number);
    await scheduleWeekly(
      NOTIF_IDS.checkin,
      "Check-in da semana",
      "Hora de revisar como foi sua semana criativa.",
      Number(settings.checkinDay),
      h,
      m
    );
  }
}

window.ArtistWayNotifications = {
  isNativeCapacitor,
  requestPermission,
  applySettings,
};
