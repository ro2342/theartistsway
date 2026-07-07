// notifications.js
// Quando rodando como APK (Capacitor), usa o plugin nativo @capacitor/local-notifications,
// que funciona de verdade em segundo plano. Quando rodando como PWA no navegador,
// usa a Notification API como reforço visual enquanto o app está aberto — mas o
// canal confiável nesse modo é o evento adicionado ao Google Calendar (ver calendar.js).

const NOTIF_IDS = {
  morningPages: 1001,
  artistDate: 1002,
  checkin: 1003,
};

function isNativeCapacitor() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

async function requestPermission() {
  if (isNativeCapacitor() && window.Capacitor.Plugins.LocalNotifications) {
    const { display } = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
    if (display !== "granted") {
      await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
    }
    return true;
  }
  if ("Notification" in window) {
    const perm = await Notification.requestPermission();
    return perm === "granted";
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
  await cancelAll();

  if (settings.morningPagesTime) {
    const [h, m] = settings.morningPagesTime.split(":").map(Number);
    await scheduleDaily(
      NOTIF_IDS.morningPages,
      "Hora das Morning Pages ✍️",
      "Três páginas, sem reler. Só você e o papel.",
      h,
      m
    );
  }
  if (settings.artistDateDay != null && settings.artistDateTime) {
    const [h, m] = settings.artistDateTime.split(":").map(Number);
    await scheduleWeekly(
      NOTIF_IDS.artistDate,
      "Que tal um Artist Date? 🎨",
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
      "Check-in da semana 📓",
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
