const CACHE_NAME = "artist-way-companion-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./vendor/fluentui/web-components.min.js",
  "./vendor/fluentui/tokens/index.js",
  "./vendor/fluentui/tokens/themes/index.js",
  "./vendor/fluentui/tokens/themes/web/index.js",
  "./vendor/fluentui/tokens/themes/web/lightTheme.js",
  "./vendor/fluentui/tokens/themes/web/darkTheme.js",
  "./vendor/fluentui/tokens/themes/teams/index.js",
  "./vendor/fluentui/tokens/themes/teams/lightTheme.js",
  "./vendor/fluentui/tokens/themes/teams/darkTheme.js",
  "./vendor/fluentui/tokens/themes/teams/highContrastTheme.js",
  "./vendor/fluentui/tokens/alias/lightColor.js",
  "./vendor/fluentui/tokens/alias/darkColor.js",
  "./vendor/fluentui/tokens/alias/lightColorPalette.js",
  "./vendor/fluentui/tokens/alias/darkColorPalette.js",
  "./vendor/fluentui/tokens/alias/highContrastColor.js",
  "./vendor/fluentui/tokens/alias/highContrastColorPalette.js",
  "./vendor/fluentui/tokens/alias/teamsDarkColor.js",
  "./vendor/fluentui/tokens/alias/teamsFontFamilies.js",
  "./vendor/fluentui/tokens/global/index.js",
  "./vendor/fluentui/tokens/global/borderRadius.js",
  "./vendor/fluentui/tokens/global/brandColors.js",
  "./vendor/fluentui/tokens/global/colorPalette.js",
  "./vendor/fluentui/tokens/global/colors.js",
  "./vendor/fluentui/tokens/global/curves.js",
  "./vendor/fluentui/tokens/global/durations.js",
  "./vendor/fluentui/tokens/global/fonts.js",
  "./vendor/fluentui/tokens/global/spacings.js",
  "./vendor/fluentui/tokens/global/strokeWidths.js",
  "./vendor/fluentui/tokens/global/typographyStyles.js",
  "./vendor/fluentui/tokens/sharedColorNames.js",
  "./vendor/fluentui/tokens/statusColorMapping.js",
  "./vendor/fluentui/tokens/themeToTokensObject.js",
  "./vendor/fluentui/tokens/tokens.js",
  "./vendor/fluentui/tokens/types.js",
  "./vendor/fluentui/tokens/utils/index.js",
  "./vendor/fluentui/tokens/utils/createLightTheme.js",
  "./vendor/fluentui/tokens/utils/createDarkTheme.js",
  "./vendor/fluentui/tokens/utils/createHighContrastTheme.js",
  "./vendor/fluentui/tokens/utils/createTeamsDarkTheme.js",
  "./vendor/fluentui/tokens/utils/shadows.js",
  "./js/theme.js",
  "./js/icons.js",
  "./js/data.js",
  "./js/db.js",
  "./js/auth.js",
  "./js/sync.js",
  "./js/notifications.js",
  "./js/calendar.js",
  "./js/updates.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => cached);
    })
  );
});
