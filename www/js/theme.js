// theme.js — aplica o tema Fluent (claro/escuro + accent color escolhido
// em Ajustes). Único arquivo do projeto que precisa ser um módulo ES
// (`type="module"` no index.html) porque os temas prontos do Fluent
// (`webLightTheme`/`webDarkTheme`) só existem como export nomeado do
// pacote vendorizado -- o resto do app continua em scripts clássicos.
import { webLightTheme, webDarkTheme } from "../vendor/fluentui/tokens/index.js";

// Paleta de accent colors -- os mesmos tons que o Windows oferece por
// padrão em Personalização > Cores.
export const ACCENT_COLORS = [
  "#0078D4", // azul (padrão)
  "#8764B8", // roxo
  "#E3008C", // magenta
  "#C50F1F", // vermelho
  "#FF8C00", // laranja
  "#FFB900", // dourado
  "#107C10", // verde
  "#00B7C3", // teal
  "#005B70", // teal escuro
  "#6B69D6", // índigo
];

function clamp(n) {
  return Math.max(0, Math.min(255, n));
}
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}
function rgbToHex(r, g, b) {
  const toHex = (n) => clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
// Mistura hex com branco (amount>0, clareia) ou preto (amount<0, escurece).
function mix(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const target = amount >= 0 ? 255 : 0;
  const t = Math.abs(amount);
  return rgbToHex(r + (target - r) * t, g + (target - g) * t, b + (target - b) * t);
}

// Gera só os tokens de marca mais visíveis a partir da cor escolhida --
// não tenta reproduzir a rampa oficial de 16 tons do Fluent (isso exigiria
// o gerador interno da Microsoft), só o suficiente pra "pintar" botões e
// realces com a cor certa em cima do tema claro/escuro base.
function brandTokensFor(accentHex, isDark) {
  return {
    colorBrandBackground: accentHex,
    colorBrandBackgroundHover: mix(accentHex, -0.1),
    colorBrandBackgroundPressed: mix(accentHex, -0.2),
    colorBrandBackground2: isDark ? mix(accentHex, -0.55) : mix(accentHex, 0.85),
    colorBrandForeground1: isDark ? mix(accentHex, 0.35) : accentHex,
    colorBrandForeground2: isDark ? mix(accentHex, 0.5) : mix(accentHex, -0.1),
    colorBrandForegroundLink: accentHex,
    colorBrandStroke1: accentHex,
    colorBrandStroke2: isDark ? mix(accentHex, -0.3) : mix(accentHex, 0.6),
    colorCompoundBrandBackground: accentHex,
    colorCompoundBrandBackgroundHover: mix(accentHex, -0.1),
    colorCompoundBrandBackgroundPressed: mix(accentHex, -0.2),
    colorCompoundBrandStroke: accentHex,
    colorCompoundBrandStrokeHover: mix(accentHex, -0.1),
    colorNeutralForegroundOnBrand: "#ffffff",
  };
}

export function resolveThemeMode(themeMode) {
  if (themeMode === "dark") return "dark";
  if (themeMode === "light") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(profile) {
  const mode = resolveThemeMode(profile && profile.themeMode);
  const base = mode === "dark" ? webDarkTheme : webLightTheme;
  const accent = (profile && profile.accentColor) || ACCENT_COLORS[0];
  const theme = Object.assign({}, base, brandTokensFor(accent, mode === "dark"));
  if (window.Fluent && typeof window.Fluent.setTheme === "function") {
    window.Fluent.setTheme(theme);
  }
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.setProperty("--accent-color", accent);
}

let systemThemeWatcherAttached = false;
export function watchSystemTheme(getProfile) {
  if (systemThemeWatcherAttached || !window.matchMedia) {
    return;
  }
  systemThemeWatcherAttached = true;
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", async () => {
    const profile = await getProfile();
    if (!profile || !profile.themeMode || profile.themeMode === "auto") {
      applyTheme(profile);
    }
  });
}

window.ArtistWayTheme = { applyTheme, watchSystemTheme, resolveThemeMode, ACCENT_COLORS };
window.dispatchEvent(new Event("artistway-theme-ready"));
