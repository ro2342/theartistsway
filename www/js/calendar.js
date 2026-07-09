// calendar.js
// Gera links "calendar.google.com/render" que abrem o Google Calendar
// (app nativo no Android, ou navegador) já preenchidos com um evento
// recorrente. Um toque do usuário para salvar — sem OAuth, sem client ID,
// sem Google Cloud Console. Funciona de dentro de uma WebView normalmente,
// pois é apenas a abertura de uma URL, não um login.

function pad(n) {
  return String(n).padStart(2, "0");
}

// weekdayIndex: 1=domingo ... 7=sábado (mesma convenção do resto do app)
const RRULE_DAY = { 1: "SU", 2: "MO", 3: "TU", 4: "WE", 5: "TH", 6: "FR", 7: "SA" };

function nextOccurrence(hour, minute, weekdayIndex) {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);

  if (weekdayIndex == null) {
    // diário: se já passou hoje, começa amanhã
    if (result <= now) result.setDate(result.getDate() + 1);
    return result;
  }

  // JS: getDay() 0=domingo...6=sábado. Nossa convenção: 1=domingo...7=sábado.
  const targetJsDay = weekdayIndex - 1;
  let diff = (targetJsDay - result.getDay() + 7) % 7;
  if (diff === 0 && result <= now) diff = 7;
  result.setDate(result.getDate() + diff);
  return result;
}

function formatGCalDate(d) {
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    "00"
  );
}

function buildRenderUrl({ title, details, hour, minute, durationMinutes = 30, weekdayIndex, recur }) {
  const start = nextOccurrence(hour, minute, weekdayIndex);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: details || "",
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
  });

  let url = `https://calendar.google.com/calendar/render?${params.toString()}`;

  if (recur === "daily") {
    url += `&recur=RRULE:FREQ=DAILY`;
  } else if (recur === "weekly" && weekdayIndex != null) {
    url += `&recur=RRULE:FREQ=WEEKLY;BYDAY=${RRULE_DAY[weekdayIndex]}`;
  }

  return url;
}

function morningPagesUrl(time) {
  const [h, m] = time.split(":").map(Number);
  return buildRenderUrl({
    title: "Morning Pages ✍️",
    details: "3 páginas à mão, sem reler. Companheiro The Artist's Way.",
    hour: h,
    minute: m,
    durationMinutes: 30,
    recur: "daily",
  });
}

function artistDateUrl(weekdayIndex, time) {
  const [h, m] = time.split(":").map(Number);
  return buildRenderUrl({
    title: "Artist Date 🎨",
    details: "Um encontro solo, só por prazer, para encher o poço criativo. Companheiro The Artist's Way.",
    hour: h,
    minute: m,
    durationMinutes: 90,
    weekdayIndex,
    recur: "weekly",
  });
}

function checkinUrl(weekdayIndex, time) {
  const [h, m] = time.split(":").map(Number);
  return buildRenderUrl({
    title: "Check-in semanal 📓",
    details: "Revisar a semana: Morning Pages, Artist Date e reflexões. Companheiro The Artist's Way.",
    hour: h,
    minute: m,
    durationMinutes: 20,
    weekdayIndex,
    recur: "weekly",
  });
}

function isUwpHost() {
  try {
    return !!(window.external && typeof window.external.notify === "function");
  } catch (e) {
    return false;
  }
}

function openUrl(url) {
  if (isUwpHost()) {
    window.external.notify(JSON.stringify({ type: "openUri", url }));
    return;
  }
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
    window.Capacitor.Plugins.Browser.open({ url });
  } else {
    window.open(url, "_blank");
  }
}

window.ArtistWayCalendar = {
  morningPagesUrl,
  artistDateUrl,
  checkinUrl,
  openUrl,
};
