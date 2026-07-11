// updates.js
// Compara a versão do app empacotado (UWP/Lumia) com a última versão
// publicada no site. Não se aplica ao PWA/APK, que se atualizam sozinhos
// (service worker / loja) -- por isso tudo aqui depende de
// window.__ARTISTWAY_NATIVE_VERSION, que só existe quando o WebView UWP
// injeta a versão instalada (ver MainPage.xaml.cs, NavigationCompleted).

const VERSION_URL = "https://ro2342.github.io/theartistsway/app/version.json";

function isPackagedApp() {
  return typeof window.__ARTISTWAY_NATIVE_VERSION === "string" && window.__ARTISTWAY_NATIVE_VERSION.length > 0;
}

function getInstalledVersion() {
  return isPackagedApp() ? window.__ARTISTWAY_NATIVE_VERSION : null;
}

// Compara duas versões "1.0.0.4" segmento a segmento, numericamente.
// Retorna >0 se a for maior, <0 se b for maior, 0 se iguais.
function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

// Retorna { current, latest, updateAvailable } ou null se não for o app
// empacotado, ou se a checagem falhar (offline, por exemplo).
async function checkForUpdate() {
  const current = getInstalledVersion();
  if (!current) return null;
  try {
    const res = await fetch(VERSION_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.version) return null;
    return {
      current,
      latest: data.version,
      builtAt: data.builtAt || null,
      updateAvailable: compareVersions(data.version, current) > 0,
    };
  } catch (e) {
    return null;
  }
}

window.ArtistWayUpdates = {
  isPackagedApp,
  getInstalledVersion,
  compareVersions,
  checkForUpdate,
};
