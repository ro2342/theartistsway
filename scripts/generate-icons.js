// generate-icons.js — regera os PNGs de ícone (Android, UWP, PWA) a partir
// de logo.svg (fonte única, silhueta branca, viewBox 0 0 96 96), usando o
// Chrome instalado localmente em modo headless via CDP (sem depender de
// npm packages como sharp/puppeteer, que não estão instalados neste repo).
//
// Uso: node scripts/generate-icons.js
"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SVG_PATH = path.join(ROOT, "logo.svg");
const SVG_TEXT = fs.readFileSync(SVG_PATH, "utf8");

const BRAND_BG = "#A8752C";

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const CHROME_PATH = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROME_PATH) {
  console.error("Nenhum Chrome/Edge encontrado nos caminhos esperados.");
  process.exit(1);
}

const PORT = 9333;

// scale = fração do lado menor do canvas ocupada pela caixa 96x96 do SVG.
// shape = 'square' (padrão) ou 'circle' (usado no ic_launcher_round do Android).
const SPECS = [];

function addSet(prefix, sizes, { bg, scale, shape, suffix }) {
  for (const [density, size] of Object.entries(sizes)) {
    const w = Array.isArray(size) ? size[0] : size;
    const h = Array.isArray(size) ? size[1] : size;
    SPECS.push({
      file: prefix.replace("{density}", density) + (suffix || ""),
      w,
      h,
      bg: bg || null,
      scale,
      shape: shape || "square",
    });
  }
}

// --- Android: launcher (legado, fundo sólido opaco) ---
const ANDROID_LAUNCHER_SIZES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
addSet(
  "android/ArtistWayAndroid/app/src/main/res/mipmap-{density}/ic_launcher.png",
  ANDROID_LAUNCHER_SIZES,
  { bg: BRAND_BG, scale: 0.7, shape: "square" }
);
addSet(
  "android/ArtistWayAndroid/app/src/main/res/mipmap-{density}/ic_launcher_round.png",
  ANDROID_LAUNCHER_SIZES,
  { bg: BRAND_BG, scale: 0.7, shape: "circle" }
);

// --- Android: adaptive icon foreground (Android 8+, transparente, zona segura ~61%) ---
const ANDROID_ADAPTIVE_SIZES = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
addSet(
  "android/ArtistWayAndroid/app/src/main/res/mipmap-{density}/ic_launcher_foreground.png",
  ANDROID_ADAPTIVE_SIZES,
  { bg: null, scale: 0.51, shape: "square" }
);

// --- Android: ícone de notificação (status bar, transparente, quase sem margem) ---
const ANDROID_NOTIF_SIZES = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };
addSet(
  "android/ArtistWayAndroid/app/src/main/res/drawable-{density}/ic_notification.png",
  ANDROID_NOTIF_SIZES,
  { bg: null, scale: 0.92, shape: "square" }
);

// --- UWP: tiles (transparente — o fundo vem do BackgroundColor do manifest) ---
const UWP_44 = { "scale-100": 44, "scale-140": 62, "scale-200": 88, "scale-240": 106 };
const UWP_71 = { "scale-100": 71, "scale-140": 99, "scale-200": 142, "scale-240": 170 };
const UWP_150 = { "scale-100": 150, "scale-140": 210, "scale-200": 300, "scale-240": 360 };
const UWP_WIDE = {
  "scale-100": [310, 150],
  "scale-140": [434, 210],
  "scale-200": [620, 300],
  "scale-240": [744, 360],
};
addSet("uwp/ArtistWayUWP/Assets/Square44x44Logo.{density}.png", UWP_44, { bg: null, scale: 0.7 });
addSet("uwp/ArtistWayUWP/Assets/Square71x71Logo.{density}.png", UWP_71, { bg: null, scale: 0.7 });
addSet("uwp/ArtistWayUWP/Assets/Square150x150Logo.{density}.png", UWP_150, { bg: null, scale: 0.7 });
addSet("uwp/ArtistWayUWP/Assets/Wide310x150Logo.{density}.png", UWP_WIDE, { bg: null, scale: 0.7 });
SPECS.push({ file: "uwp/ArtistWayUWP/Assets/StoreLogo.png", w: 50, h: 50, bg: null, scale: 0.7, shape: "square" });

// --- PWA: ícones do manifest (fundo sólido; maskable com zona segura ~62%) ---
SPECS.push({ file: "www/icons/icon-192.png", w: 192, h: 192, bg: BRAND_BG, scale: 0.7, shape: "square" });
SPECS.push({ file: "www/icons/icon-512.png", w: 512, h: 512, bg: BRAND_BG, scale: 0.7, shape: "square" });
SPECS.push({ file: "www/icons/icon-maskable-1024.png", w: 1024, h: 1024, bg: BRAND_BG, scale: 0.54, shape: "square" });

function httpGetJson(url) {
  return fetch(url).then((r) => r.json());
}

async function waitForChrome(deadline) {
  while (Date.now() < deadline) {
    try {
      return await httpGetJson(`http://127.0.0.1:${PORT}/json/version`);
    } catch (e) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error("Chrome não respondeu em tempo hábil na porta de debug.");
}

function cdpSend(ws, id, method, params) {
  ws.send(JSON.stringify({ id, method, params: params || {} }));
}

async function main() {
  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + path.join(require("os").tmpdir(), "artistway-icon-gen-profile"),
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  try {
    await waitForChrome(Date.now() + 10000);
    const targets = await httpGetJson(`http://127.0.0.1:${PORT}/json/list`);
    const target = targets.find((t) => t.type === "page") || targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    const pending = new Map();
    let nextId = 1;
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });

    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", reject);
    });

    function send(method, params) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        cdpSend(ws, id, method, params);
      });
    }

    const browserExpr = `
      (async () => {
        const svgText = ${JSON.stringify(SVG_TEXT)};
        const specs = ${JSON.stringify(SPECS)};
        async function loadGlyph() {
          const blob = new Blob([svgText], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const img = await new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = url;
          });
          URL.revokeObjectURL(url);
          return img;
        }
        const glyph = await loadGlyph();
        const out = {};
        for (const spec of specs) {
          const canvas = document.createElement("canvas");
          canvas.width = spec.w;
          canvas.height = spec.h;
          const ctx = canvas.getContext("2d");
          if (spec.shape === "circle") {
            ctx.save();
            ctx.beginPath();
            const r = Math.min(spec.w, spec.h) / 2;
            ctx.arc(spec.w / 2, spec.h / 2, r, 0, Math.PI * 2);
            ctx.clip();
          }
          if (spec.bg) {
            ctx.fillStyle = spec.bg;
            ctx.fillRect(0, 0, spec.w, spec.h);
          }
          if (spec.shape === "circle") ctx.restore();
          const minSide = Math.min(spec.w, spec.h);
          const glyphSize = minSide * spec.scale;
          const dx = (spec.w - glyphSize) / 2;
          const dy = (spec.h - glyphSize) / 2;
          ctx.drawImage(glyph, dx, dy, glyphSize, glyphSize);
          out[spec.file] = canvas.toDataURL("image/png");
        }
        return JSON.stringify(out);
      })()
    `;

    const result = await send("Runtime.evaluate", {
      expression: browserExpr,
      awaitPromise: true,
      returnByValue: true,
    });

    if (result.exceptionDetails) {
      throw new Error("Erro no navegador: " + JSON.stringify(result.exceptionDetails));
    }

    const outputs = JSON.parse(result.result.value);
    for (const [relPath, dataUrl] of Object.entries(outputs)) {
      const outPath = path.join(ROOT, relPath);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
      console.log("gerado:", relPath);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
