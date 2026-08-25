// app.js — roteador e telas do Companheiro do The Artist's Way
const DB = window.ArtistWayDB;
const NOTIF = window.ArtistWayNotifications;
const GCAL = window.ArtistWayCalendar;

// Nomes dos dias da semana vêm de UI_STRINGS (common.weekdayNames) —
// convenção de índice "1=Domingo...7=Sábado" (índice 0 fica vazio, nunca
// usado) mantida em toda a codebase, inclusive nas outras 2 plataformas.
function weekdayNames() {
  return ["", ...UI_STRINGS["common.weekdayNames"].split(",")];
}

const appEl = document.getElementById("app");

// NodeList.prototype.forEach não existe no WebView antigo do Windows 10
// Mobile — Array.prototype.forEach (via .call) funciona em qualquer engine.
function forEachNode(nodeList, fn) {
  Array.prototype.forEach.call(nodeList, fn);
}

// Mesma detecção usada em calendar.js/notifications.js: presença do bridge
// window.external.notify indica que estamos dentro do WebView UWP.
function isUwpHost() {
  try {
    return !!(window.external && window.external.notify);
  } catch (e) {
    return false;
  }
}

// — tamanho da letra —
function applyFontSizePreference(size) {
  document.documentElement.classList.remove("fs-small", "fs-large");
  if (size === "small") document.documentElement.classList.add("fs-small");
  if (size === "large") document.documentElement.classList.add("fs-large");
}

// — utilidades de data —
function todayStr() {
  return dateToStr(new Date());
}
function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfWeek(d) {
  // domingo como início da semana
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

// Início da semana corrente pra faixa de Morning Pages da Home,
// ancorado no dia da semana escolhido em settings.startDate (não
// necessariamente domingo) — mesma lógica do WeekCalculator.cs no UWP.
function currentStreakWeekStart(settings, today) {
  let startDow = 0;
  if (settings && settings.startDate) {
    const parsed = new Date(settings.startDate + "T00:00:00");
    if (!isNaN(parsed.getTime())) startDow = parsed.getDay();
  }
  const diff = (today.getDay() - startDow + 7) % 7;
  return addDays(today, -diff);
}

// Afirmação do dia: escolha determinística pelo dia do ano, sem precisar
// guardar nenhum dado novo — mesmo cálculo no app do Windows
// (HomePage.xaml.cs), pra mostrar a mesma frase nos dois aparelhos no
// mesmo dia.
function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / (24 * 3600 * 1000));
}

// Cálculo puramente por data — mesma conta de sempre, mas agora só serve
// pra semear o cursor da semana na primeira vez (ver getWeekCursor
// abaixo). Não é mais usado direto pra decidir a semana "atual" do
// usuário, porque isso passou a ser uma decisão explícita dele.
function naturalWeekId(settings) {
  if (!settings.startDate) return 1;
  const start = startOfWeek(new Date(settings.startDate + "T00:00:00"));
  const now = startOfWeek(new Date());
  const diffWeeks = Math.round((now - start) / (7 * 24 * 3600 * 1000));
  return Math.min(12, Math.max(1, diffWeeks + 1));
}

// A semana "atual" agora é controlada por um cursor guardado no perfil
// (settings.weekCursor = { weekId, cycleStart }), não só pela conta de
// dias — assim dá pra "continuar" numa semana mesmo depois que os 7 dias
// passaram, sem perder nada do que já foi feito (checklist/check-in/
// Artist Date continuam guardados pela chave da própria semana, ver
// weekKeyForOffset). O cursor só anda quando o usuário decide de verdade
// (decideWeekCycle) — na primeira vez que é lido, é semeado com o
// cálculo antigo por data e já salvo, pra não recalcular diferente a
// cada chamada.
async function getWeekCursor(settings) {
  if (settings.weekCursor && settings.weekCursor.weekId && settings.weekCursor.cycleStart) {
    return settings.weekCursor;
  }
  const weekId = naturalWeekId(settings);
  const cycleStart = dateToStr(currentStreakWeekStart(settings, new Date()));
  const cursor = { weekId, cycleStart };
  settings.weekCursor = cursor;
  await DB.setProfile(settings);
  return cursor;
}

// Passaram os 7 dias do ciclo atual? Se sim, a Home mostra o cartão de
// decisão (continuar na semana ou ir pra próxima) em vez de trocar de
// semana sozinha.
function weekCyclePending(cursor) {
  const cycleStart = new Date(cursor.cycleStart + "T00:00:00");
  const cycleEnd = addDays(cycleStart, 7);
  return new Date() >= cycleEnd;
}

// Aplica a decisão do usuário (continuar na mesma semana ou avançar) e
// reabre um ciclo novo de 7 dias a partir da semana corrente do
// calendário — assim quem ficou sumido várias semanas não fica preso
// respondendo uma decisão por semana pulada, só a mais recente.
async function decideWeekCycle(settings, action) {
  const cursor = await getWeekCursor(settings);
  const weekId = action === "advance" ? Math.min(12, cursor.weekId + 1) : cursor.weekId;
  return setCurrentWeek(settings, weekId);
}

// Define diretamente qual semana é a "atual", abrindo um ciclo novo de 7
// dias a partir de hoje. Usado tanto por decideWeekCycle (continuar/
// avançar) quanto pelo botão "Tornar esta a minha semana atual" na tela
// da semana — assim dá pra voltar (ou pular pra frente) pra qualquer
// semana manualmente, sem depender do cartão de decisão aparecer sozinho
// (que só mostra quando os 7 dias de um ciclo já correram; quem estava
// numa versão antiga do app e teve o cursor semeado direto numa semana
// mais adiante, por exemplo, precisa desse botão pra voltar).
async function setCurrentWeek(settings, weekId) {
  const clamped = Math.min(12, Math.max(1, weekId));
  const cycleStart = dateToStr(currentStreakWeekStart(settings, new Date()));
  const cursor = { weekId: clamped, cycleStart };
  settings.weekCursor = cursor;
  await DB.setProfile(settings);
  return cursor;
}

// Resumo da semana pro cartão de decisão: tarefas concluídas, check-in
// feito ou não, Artist Date feito ou não, e quantos dias de Morning
// Pages nesse ciclo de 7 dias.
async function buildWeekSummary(settings, cursor) {
  const week = WEEKS.find((w) => w.id === cursor.weekId);
  const weekKey = weekKeyForOffset(settings, cursor.weekId);
  const checklist = await DB.getChecklistForWeek(cursor.weekId);
  const doneCount = checklist.filter((c) => c.done).length;
  const totalItems = week.checklist.length;
  const checkin = await DB.getCheckin(cursor.weekId);
  const artistDate = (await DB.getArtistDate(weekKey)) || { done: false };
  const cycleEnd = dateToStr(addDays(new Date(cursor.cycleStart + "T00:00:00"), 6));
  const mpDone = (await DB.getMorningPagesInRange(cursor.cycleStart, cycleEnd)).length;
  return {
    week,
    doneCount,
    totalItems,
    checkinDone: !!checkin,
    artistDateDone: !!artistDate.done,
    mpDone,
  };
}

const PROGRAM_LENGTH_DAYS = 84; // 12 semanas x 7 dias

// Contador de dias (Home) e detecção de fim de programa (Modo manutenção)
// — mesmo cálculo simples nas duas plataformas, sem guardar nada novo.
function dayCountSinceStart(settings) {
  if (!settings.startDate) return null;
  const start = new Date(settings.startDate + "T00:00:00");
  return Math.floor((new Date() - start) / (24 * 3600 * 1000)) + 1;
}

function isProgramFinished(settings) {
  const dayCount = dayCountSinceStart(settings);
  return dayCount !== null && dayCount > PROGRAM_LENGTH_DAYS;
}

function weekKeyForOffset(settings, weekId) {
  const start = startOfWeek(new Date(settings.startDate + "T00:00:00"));
  const weekStart = addDays(start, (weekId - 1) * 7);
  return dateToStr(weekStart);
}

// — UI_STRINGS com placeholder ("{nome}") — mesmo padrão do
// ContentStore.S (UWP) / ContentStore.s (Android): busca a chave e
// substitui {chave} pelo valor correspondente em params. Nome UIS (não
// "S" curto) porque o bundle do FluentUI já declara um "S" de nível
// global (const interno de border-radius) — nome curto colidiria.
function UIS(key, params) {
  let text = UI_STRINGS[key] ?? key;
  if (params) {
    for (const name in params) {
      text = text.split(`{${name}}`).join(String(params[name]));
    }
  }
  return text;
}

// — toast —
let toastTimer = null;
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

// — diálogo de confirmação (fluent-dialog de verdade) —
function confirmDialog(title, message, confirmLabel) {
  return new Promise((resolve) => {
    const dialog = document.createElement("fluent-dialog");
    dialog.setAttribute("type", "modal");
    dialog.setAttribute("aria-label", title);
    dialog.innerHTML = `
      <fluent-dialog-body>
        <div slot="title">${title}</div>
        <p class="muted">${message}</p>
        <fluent-button slot="action" appearance="primary" id="confirmDialogYes">${confirmLabel}</fluent-button>
        <fluent-button slot="action" id="confirmDialogNo">${UI_STRINGS["common.cancel"]}</fluent-button>
      </fluent-dialog-body>
    `;
    document.body.appendChild(dialog);
    function cleanup(result) {
      dialog.hide();
      dialog.remove();
      resolve(result);
    }
    dialog.querySelector("#confirmDialogYes").addEventListener("click", () => cleanup(true));
    dialog.querySelector("#confirmDialogNo").addEventListener("click", () => cleanup(false));
    dialog.show();
  });
}

// — router —
const routes = {};
function route(path, handler) {
  routes[path] = handler;
}
function navigate(hash) {
  window.location.hash = hash;
}
async function render() {
  const hash = window.location.hash || "#/home";
  const [path, ...rest] = hash.replace("#", "").split("/").filter(Boolean);
  const routeKey = "/" + path;
  const handler = routes[routeKey] || routes["/home"];
  await handler(rest);
  renderShell(routeKey);
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", render);

// Exposto pra auth.js poder reavaliar a rota depois de um login que volta
// de um redirect de página inteira (hash se perde no round-trip do OAuth
// do Google) — ver handleRedirectIfNeeded em auth.js.
window.ArtistWayApp = { render };

// Número da versão publicada — mesmo app/version.json que o checador de
// atualização do app do Windows já usa (updates.js), só que aqui é
// puramente informativo: aparece no rodapé do painel de navegação e em
// Ajustes, nas duas plataformas, pra sempre dar pra conferir visualmente
// se o build certo está no ar.
let displayVersionPromise = null;
function getDisplayVersion() {
  if (!displayVersionPromise) {
    displayVersionPromise = fetch("./app/version.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data && data.version ? data.version : null))
      .catch(() => null);
  }
  return displayVersionPromise;
}

// — shell: cabeçalho + painel de navegação —
// Mesmo shell do app UWP nativo (MainPage.xaml, 2.0.2.5/2.0.2.6):
// hambúrguer + título da seção atual, fixos no topo; painel deslizante
// por cima do conteúdo (nunca cobre o cabeçalho — hambúrguer sempre
// clicável pra fechar). Início/Jornada/Date/Recursos na lista
// principal; Meu Perfil, Sincronizar e Ajustes juntos abaixo de uma
// divisória de largura inteira.
const NAV_PRIMARY = [
  { path: "/home", key: "nav.home", regular: "homeRegular", filled: "homeFilled" },
  { path: "/progress", key: "nav.progress", regular: "bookRegular", filled: "bookFilled" },
  { path: "/artist-date", key: "nav.artistDate", regular: "heartRegular", filled: "heartFilled" },
  { path: "/ferramentas", key: "nav.recursos", regular: "toolsRegular", filled: "toolsFilled" },
];
const NAV_PROFILE_ITEM = { path: "/profile", key: "nav.profile", icon: "person" };
const NAV_SETTINGS_ITEM = { path: "/settings", key: "nav.settings", regular: "settingsRegular", filled: "settingsFilled" };
const NAV_ALL_ITEMS = NAV_PRIMARY.concat([NAV_PROFILE_ITEM, NAV_SETTINGS_ITEM]);

// Título/destaque do painel só mudam nos 6 destinos de nível superior
// — páginas de detalhe (semana, ensaio, ferramenta, quiz...) mantêm o
// título/realce do destino de onde vieram, igual ao _currentTabPageType
// do MainPage.xaml.cs no UWP.
let lastTopLevelPath = "/home";

function navPaneItemHtml(it) {
  const ICONS = window.ArtistWayIcons;
  const isActive = it.path === lastTopLevelPath;
  const icon = it.icon ? ICONS[it.icon] : ICONS[isActive ? it.filled : it.regular];
  return `<button class="nav-pane-item ${isActive ? "active" : ""}" data-nav="${it.path}">
      <span class="icon">${icon}</span>${UI_STRINGS[it.key]}
    </button>`;
}

function togglePane() {
  const pane = document.getElementById("navPane");
  const overlay = document.getElementById("navOverlay");
  if (!pane || !overlay) return;
  const open = !pane.classList.contains("open");
  pane.classList.toggle("open", open);
  overlay.classList.toggle("open", open);
}
function closePane() {
  const pane = document.getElementById("navPane");
  const overlay = document.getElementById("navOverlay");
  if (pane) pane.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
}

function renderShell(activePath) {
  const settingsPromise = DB.getSetting("profile", null);
  settingsPromise.then(async (settings) => {
    let header = document.getElementById("shellHeader");
    let pane = document.getElementById("navPane");
    let overlay = document.getElementById("navOverlay");

    if (!settings || !settings.onboarded) {
      if (header) header.remove();
      if (pane) pane.remove();
      if (overlay) overlay.remove();
      document.body.classList.remove("has-shell");
      return;
    }
    document.body.classList.add("has-shell");
    closePane(); // qualquer navegação fecha o painel, não só clique nos itens dele

    if (NAV_ALL_ITEMS.some((it) => it.path === activePath)) {
      lastTopLevelPath = activePath;
    }

    const ICONS = window.ArtistWayIcons;

    if (!header) {
      header = document.createElement("div");
      header.id = "shellHeader";
      header.className = "shell-header";
      header.innerHTML = `<button class="menu-btn" id="menuBtn" aria-label="Menu"><span class="icon">${ICONS.menu}</span></button><div class="shell-title" id="shellTitle"></div>`;
      document.body.insertBefore(header, appEl);
      header.querySelector("#menuBtn").addEventListener("click", togglePane);
    }
    const titleItem = NAV_ALL_ITEMS.find((it) => it.path === lastTopLevelPath);
    document.getElementById("shellTitle").textContent = titleItem ? UI_STRINGS[titleItem.key] : "";

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "navOverlay";
      overlay.className = "nav-overlay";
      document.body.insertBefore(overlay, appEl);
      overlay.addEventListener("click", closePane);
    }

    if (!pane) {
      pane = document.createElement("div");
      pane.id = "navPane";
      pane.className = "nav-pane";
      document.body.insertBefore(pane, appEl);
    }
    pane.innerHTML = `
      <div class="nav-pane-primary">${NAV_PRIMARY.map(navPaneItemHtml).join("")}</div>
      <div class="nav-pane-divider"></div>
      <div class="nav-pane-secondary">
        ${navPaneItemHtml(NAV_PROFILE_ITEM)}
        <button class="nav-pane-item" id="navSyncBtn">
          <span class="icon">${ICONS.sync}</span>${UI_STRINGS["nav.sync"]}
        </button>
        ${navPaneItemHtml(NAV_SETTINGS_ITEM)}
      </div>
      <div class="nav-pane-version" id="navVersion"></div>
    `;
    forEachNode(pane.querySelectorAll("[data-nav]"), (btn) => {
      btn.addEventListener("click", () => {
        navigate("#" + btn.dataset.nav);
        closePane();
      });
    });
    const syncBtn = document.getElementById("navSyncBtn");
    if (syncBtn) {
      syncBtn.addEventListener("click", async () => {
        syncBtn.disabled = true;
        const result = await window.ArtistWaySync.syncAll();
        syncBtn.disabled = false;
        toast(result);
        closePane();
      });
    }
    const version = await getDisplayVersion();
    const versionEl = document.getElementById("navVersion");
    if (versionEl) versionEl.textContent = version ? `versão ${version}` : "";
  });
}

// — abas (Ajustes/Recursos) —
// Igual ao Pivot do UWP: barra de abas horizontal, uma aba visível por
// vez. `state` é um objeto de módulo (fora da função de rota) que
// guarda qual aba está ativa entre re-renders da mesma rota — sem
// isso, qualquer botão dentro de uma aba que chame render() de novo
// (ex.: trocar o tema) faria a aba selecionada voltar sempre pra
// primeira, o mesmo bug que o NavigationCacheMode corrigiu no UWP.
function renderTabs(container, tabs, state) {
  const activeId = tabs.some((t) => t.id === state.active) ? state.active : tabs[0].id;
  state.active = activeId;
  container.innerHTML =
    `<div class="tab-header">` +
    tabs.map((t) => `<button class="tab-header-item ${t.id === activeId ? "active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("") +
    `</div>` +
    tabs.map((t) => `<div class="tab-panel ${t.id === activeId ? "active" : ""}" data-tab-panel="${t.id}">${t.html}</div>`).join("");
  forEachNode(container.querySelectorAll("[data-tab]"), (btn) => {
    btn.addEventListener("click", () => {
      state.active = btn.dataset.tab;
      forEachNode(container.querySelectorAll("[data-tab]"), (b) => b.classList.toggle("active", b === btn));
      forEachNode(container.querySelectorAll("[data-tab-panel]"), (p) => p.classList.toggle("active", p.dataset.tabPanel === btn.dataset.tab));
    });
  });
}

// ================= ONBOARDING =================
route("/onboarding", async () => {
  let step = window.__onboardStep || 0;
  const draft = window.__onboardDraft || {
    name: "",
    startDate: dateToStr(startOfWeek(addDays(new Date(), 7))),
    morningPagesTime: "07:00",
    artistDateDay: "7",
    artistDateTime: "16:00",
    checkinDay: "7",
    checkinTime: "19:00",
    contractSignedName: "",
  };
  window.__onboardDraft = draft;

  const appTitleHtml = UIS("onboarding.appTitle");
  const steps = [
    // 0 — já é usuário?
    () => `
      <div class="onboard-screen">
        <h1 class="onboard-title">${appTitleHtml}</h1>
        <p class="onboard-sub">${UIS("onboarding.returningUser.question")}</p>
        <p class="muted" style="text-align:center;">${UIS("onboarding.returningUser.description")}</p>
        <button class="btn brass block" id="loginBtn">${UIS("onboarding.returningUser.loginButton")}</button>
        <p class="muted" id="loginStatus" style="display:none;text-align:center;"></p>
        <button class="btn secondary block" id="next" style="margin-top:12px;">${UIS("onboarding.returningUser.skipButton")}</button>
        <div class="dots-progress"><span class="active"></span><span></span><span></span><span></span><span></span></div>
      </div>`,
    // 1 — boas vindas
    () => `
      <div class="onboard-screen">
        <div class="quote-banner">${UIS("onboarding.welcome.quote")}</div>
        <h1 class="onboard-title">${appTitleHtml}</h1>
        <p class="onboard-sub">${UIS("onboarding.welcome.description")}</p>
        <button class="btn brass block" id="next">${UIS("onboarding.welcome.startButton")}</button>
        <div class="dots-progress"><span></span><span class="active"></span><span></span><span></span><span></span></div>
      </div>`,
    // 2 — nome + data de início
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack"><span class="icon">${window.ArtistWayIcons.arrowLeft}</span></button>
        <h2 class="onboard-title">${UIS("onboarding.nameDate.title")}</h2>
        <p class="onboard-sub">${UIS("onboarding.nameDate.subtitle")}</p>
        <label>${UIS("onboarding.nameDate.nameLabel")}</label>
        <input type="text" id="fname" value="${draft.name}" placeholder="${UIS("onboarding.nameDate.namePlaceholder")}" />
        <label>${UIS("onboarding.nameDate.startDateLabel")}</label>
        <input type="date" id="fstart" value="${draft.startDate}" />
        <div class="spacer"></div>
        <button class="btn brass block" id="next">${UIS("onboarding.continueButton")}</button>
        <div class="dots-progress"><span></span><span></span><span class="active"></span><span></span><span></span></div>
      </div>`,
    // 3 — rituais: morning pages + artist date + check-in, tudo numa tela só
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack"><span class="icon">${window.ArtistWayIcons.arrowLeft}</span></button>
        <h2 class="onboard-title">${UIS("onboarding.rituals.title")}</h2>
        <p class="onboard-sub">${UIS("onboarding.rituals.subtitle")}</p>
        <label class="onboard-section-label">${UIS("onboarding.rituals.morningPagesSection")}</label>
        <label>${UIS("onboarding.rituals.timeLabel")}</label>
        <input type="time" id="fmp" value="${draft.morningPagesTime}" />
        <label class="onboard-section-label">${UIS("onboarding.rituals.artistDateSection")}</label>
        <label>${UIS("onboarding.rituals.weekdayLabel")}</label>
        <select id="fadday">
          ${[1, 2, 3, 4, 5, 6, 7]
            .map((d) => `<option value="${d}" ${String(d) === draft.artistDateDay ? "selected" : ""}>${weekdayNames()[d]}</option>`)
            .join("")}
        </select>
        <label>${UIS("onboarding.rituals.timeLabel")}</label>
        <input type="time" id="fadtime" value="${draft.artistDateTime}" />
        <label class="onboard-section-label">${UIS("onboarding.rituals.checkinSection")}</label>
        <label>${UIS("onboarding.rituals.weekdayLabel")}</label>
        <select id="fciday">
          ${[1, 2, 3, 4, 5, 6, 7]
            .map((d) => `<option value="${d}" ${String(d) === draft.checkinDay ? "selected" : ""}>${weekdayNames()[d]}</option>`)
            .join("")}
        </select>
        <label>${UIS("onboarding.rituals.timeLabel")}</label>
        <input type="time" id="fcitime" value="${draft.checkinTime}" />
        <div class="spacer"></div>
        <button class="btn brass block" id="next">${UIS("onboarding.continueButton")}</button>
        <div class="dots-progress"><span></span><span></span><span></span><span class="active"></span><span></span></div>
      </div>`,
    // 4 — contrato inicial assinável
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack"><span class="icon">${window.ArtistWayIcons.arrowLeft}</span></button>
        <h2 class="onboard-title">${UIS("onboarding.contract.title")}</h2>
        <p class="onboard-sub">${UIS("onboarding.contract.description")}</p>
        <div class="card">
          <p class="muted">${UIS("onboarding.contract.sentence", { name: `<strong>${draft.name || "___"}</strong>` })}</p>
        </div>
        <label>${UIS("onboarding.contract.signatureLabel")}</label>
        <input type="text" id="fsignature" value="${draft.contractSignedName || draft.name || ""}" placeholder="${UIS("onboarding.contract.signaturePlaceholder")}" />
        <div class="spacer"></div>
        <button class="btn moss block" id="finish">${UIS("onboarding.contract.finishButton")}</button>
        <div class="dots-progress"><span></span><span></span><span></span><span></span><span class="active"></span></div>
      </div>`,
  ];

  appEl.innerHTML = steps[step]();

  const stepBack = document.getElementById("stepBack");
  if (stepBack) {
    stepBack.addEventListener("click", () => {
      window.__onboardStep = step - 1;
      render();
    });
  }

  const next = document.getElementById("next");
  if (next) {
    next.addEventListener("click", () => {
      if (step === 2) {
        draft.name = document.getElementById("fname").value.trim();
        draft.startDate = document.getElementById("fstart").value || draft.startDate;
      }
      if (step === 3) {
        draft.morningPagesTime = document.getElementById("fmp").value || draft.morningPagesTime;
        draft.artistDateDay = document.getElementById("fadday").value;
        draft.artistDateTime = document.getElementById("fadtime").value || draft.artistDateTime;
        draft.checkinDay = document.getElementById("fciday").value;
        draft.checkinTime = document.getElementById("fcitime").value || draft.checkinTime;
      }
      window.__onboardStep = step + 1;
      render();
    });
  }

  // Passo 0: já é usuário em outro aparelho? O redirect do Google leva a
  // aba inteira embora — ao voltar, handleRedirectIfNeeded (auth.js)
  // sincroniza e chama window.ArtistWayApp.render() de novo, que decide
  // sozinho se pula onboarding (achou perfil já onboarded) ou continua
  // daqui pro passo 1 normalmente.
  const loginBtn = document.getElementById("loginBtn");
  const loginStatus = document.getElementById("loginStatus");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      loginBtn.disabled = true;
      loginBtn.textContent = UIS("onboarding.returningUser.loggingIn");
      if (loginStatus) {
        loginStatus.style.display = "";
        loginStatus.textContent = UIS("onboarding.returningUser.redirectStatus");
      }
      window.ArtistWayAuth.startGoogleLogin();
    });
  }
  const finish = document.getElementById("finish");
  if (finish) {
    finish.addEventListener("click", async () => {
      draft.contractSignedName = document.getElementById("fsignature").value.trim() || draft.name;
      draft.contractSignedAt = new Date().toISOString();
      draft.onboarded = true;
      try {
        await DB.setProfile(draft);
        await NOTIF.applySettings(draft);
        window.__onboardStep = 0;
        window.__onboardDraft = null;
        toast(UIS("onboarding.toast.done"));
        navigate("#/home");
      } catch (err) {
        toast(UIS("onboarding.toast.errorPrefix") + err.message);
      }
    });
  }
});

// ================= HOME =================

// Deixa cada bolinha de Morning Pages da semana (não só "hoje") tocável,
// pra dar check-in retroativo num dia esquecido — dias futuros ficam sem
// clique (não dá pra marcar um dia que ainda não aconteceu).
function bindStreakDotClicks() {
  document.querySelectorAll(".streak-dot.clickable[data-date]").forEach((el) => {
    el.addEventListener("click", async () => {
      const date = el.dataset.date;
      const done = await DB.toggleMorningPage(date);
      toast(done ? "Marcado ✓" : "Desmarcado");
      render();
    });
  });
}

route("/home", async () => {
  const settings = await DB.getSetting("profile", null);
  if (!settings || !settings.onboarded) {
    navigate("#/onboarding");
    return;
  }
  const cursor = await getWeekCursor(settings);
  const weekId = cursor.weekId;
  const week = WEEKS.find((w) => w.id === weekId);
  const weekKey = weekKeyForOffset(settings, weekId);

  // streak morning pages da semana corrente, ancorada no dia escolhido
  // como início do programa (não um "últimos 7 dias" genérico)
  const today = new Date();
  const streakWeekStart = currentStreakWeekStart(settings, today);
  const days = [];
  for (let i = 0; i <= 6; i++) days.push(dateToStr(addDays(streakWeekStart, i)));
  const allMP = await DB.getAllMorningPages();
  const mpMap = allMP.reduce((acc, r) => {
    acc[r.date] = r.done;
    return acc;
  }, {});
  const todayDone = !!mpMap[todayStr()];

  const artistDate = (await DB.getArtistDate(weekKey)) || { done: false };
  const checklist = await DB.getChecklistForWeek(weekId);
  const doneCount = checklist.filter((c) => c.done).length;
  const totalItems = week.checklist.length;
  const pct = totalItems ? Math.round((doneCount / totalItems) * 100) : 0;

  const lastActivityAt = await DB.getSetting("lastActivityAt", null);
  const daysSinceActivity = lastActivityAt
    ? Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (24 * 3600 * 1000))
    : null;
  const showRoadRulesNudge = daysSinceActivity !== null && daysSinceActivity >= 3;

  const dayCount = dayCountSinceStart(settings);
  const greetingLabel = dayCount !== null
    ? UIS("home.greeting.dayCount", { day: Math.max(1, dayCount), total: PROGRAM_LENGTH_DAYS })
    : settings.name
      ? UIS("home.greeting.withName", { name: settings.name })
      : UIS("home.greeting.default");
  const maintenanceMode = !!settings.maintenanceMode || isProgramFinished(settings);
  const cyclePending = !maintenanceMode && weekCyclePending(cursor);
  const weekSummary = cyclePending ? await buildWeekSummary(settings, cursor) : null;

  const weekDecisionCard = cyclePending
    ? `
    <div class="card dotted">
      <div class="card-title" style="font-size:1.05rem;">${UIS("home.weekCycle.title", { week: cursor.weekId })}</div>
      <p class="muted">${UIS("home.weekCycle.summary", {
        done: weekSummary.doneCount,
        total: weekSummary.totalItems,
        mp: weekSummary.mpDone,
        adStatus: UIS(weekSummary.artistDateDone ? "status.done" : "status.notDone"),
        ciStatus: UIS(weekSummary.checkinDone ? "status.done" : "status.notDone"),
      })}</p>
      <p class="muted">${UIS("home.weekCycle.question", { week: cursor.weekId })}</p>
      <button class="btn secondary block" id="stayWeek">${UIS("home.weekCycle.stayButton", { week: cursor.weekId })}</button>
      <div class="spacer-sm"></div>
      ${
        cursor.weekId < 12
          ? `<button class="btn brass block" id="advanceWeek">${UIS("home.weekCycle.advanceButton", { week: cursor.weekId + 1 })}</button>`
          : `<button class="btn brass block" id="finishProgram">${UIS("home.weekCycle.finishButton")}</button>`
      }
    </div>`
    : "";

  const morningPagesCard = `
    <div class="card">
      <div class="card-title" style="font-size:1.1rem;">${UIS("home.morningPages.title")}</div>
      <p class="muted">${UIS("home.morningPages.thisWeek")}</p>
      <div class="streak-row">
        ${days
          .map((d) => {
            const dt = new Date(d + "T00:00:00");
            const label = UIS("home.morningPages.weekdayLetters").split(",")[dt.getDay()];
            const isToday = d === todayStr();
            const isFuture = d > todayStr();
            return `<div class="streak-dot ${mpMap[d] ? "done" : ""} ${isFuture ? "" : "clickable"}" data-date="${d}" style="${isToday ? "box-shadow:0 0 0 2px var(--brass);" : ""}${isFuture ? "opacity:0.4;" : "cursor:pointer;"}">${label}</div>`;
          })
          .join("")}
      </div>
      <p class="muted" style="font-size:0.85em;margin-top:4px;">${UIS("home.morningPages.hint")}</p>
      <div class="spacer-sm"></div>
      <button class="btn ${todayDone ? "secondary" : "moss"} block" id="toggleMP">
        ${todayDone ? UIS("home.morningPages.toggleOff") : UIS("home.morningPages.toggleOn")}
      </button>
    </div>`;

  const affirmationCard = `
    <div class="card dotted text-center">
      <p class="muted">${UIS("home.affirmation.label")}</p>
      <p style="font-weight:var(--fontWeightSemibold,600);">${AFFIRMATIONS[dayOfYear(new Date()) % AFFIRMATIONS.length]}</p>
    </div>`;

  const artistDateCard = `
    <div class="card">
      <div class="card-title" style="font-size:1.1rem;">${UIS("home.artistDate.title")} <span class="icon" style="width:18px;height:18px;vertical-align:-3px;display:inline-block;">${window.ArtistWayIcons.heartRegular}</span></div>
      <p class="muted">${artistDate.done ? UIS("home.artistDate.doneSummary", { idea: artistDate.idea || "" }) : UIS("home.artistDate.notDoneSummary")}</p>
      <a class="btn ${artistDate.done ? "secondary" : "brass"} block" href="#/artist-date">${artistDate.done ? UIS("home.artistDate.viewButton") : UIS("home.artistDate.planButton")}</a>
    </div>`;

  if (maintenanceMode) {
    appEl.innerHTML = `
      <p class="muted">${greetingLabel}</p>

      <div class="card dotted text-center">
        <p class="muted">${UIS("home.maintenance.title")}</p>
        <p style="font-weight:var(--fontWeightSemibold,600);">${UIS("home.maintenance.description")}</p>
      </div>

      ${morningPagesCard}
      ${affirmationCard}
      ${artistDateCard}
    `;
    document.getElementById("toggleMP").addEventListener("click", async () => {
      const done = await DB.toggleMorningPage(todayStr());
      toast(done ? UIS("home.toast.mpMarked") : UIS("home.toast.mpUnmarked"));
      render();
    });
    bindStreakDotClicks();
    return;
  }

  appEl.innerHTML = `
    <p class="muted">${greetingLabel}</p>

    ${weekDecisionCard}

    <div class="card">
      <div class="card-sub">${UIS("home.week.label", { week: weekId })}</div>
      <div class="card-title">${week.title}</div>
      <p class="muted">${week.intro}</p>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="progress-label">${UIS("home.week.progress", { done: doneCount, total: totalItems })}</div>
      <div class="spacer-sm"></div>
      <a class="btn brass block" href="#/week/${weekId}">${UIS("home.week.openButton")}</a>
    </div>

    ${morningPagesCard}
    ${affirmationCard}
    ${artistDateCard}

    <div class="card dotted text-center">
      <p class="muted">${UIS("home.checkin.prompt")}</p>
      <a class="btn secondary block" href="#/checkin/${weekId}">${UIS("home.checkin.button", { week: weekId })}</a>
    </div>

    ${
      showRoadRulesNudge
        ? `<div class="card dotted text-center">
      <p class="muted">${UIS("home.roadRulesNudge.prompt")}</p>
      <a class="btn secondary block" href="#/regras-da-estrada"><span class="icon">${window.ArtistWayIcons.pin}</span> ${UIS("home.roadRulesNudge.button")}</a>
    </div>`
        : ""
    }
  `;

  document.getElementById("toggleMP").addEventListener("click", async () => {
    const done = await DB.toggleMorningPage(todayStr());
    toast(done ? UIS("home.toast.mpMarked") : UIS("home.toast.mpUnmarked"));
    render();
  });
  bindStreakDotClicks();

  if (cyclePending) {
    document.getElementById("stayWeek").addEventListener("click", async () => {
      await decideWeekCycle(settings, "continue");
      toast(UIS("home.toast.stayedWeek", { week: cursor.weekId }));
      render();
    });
    const advanceBtn = document.getElementById("advanceWeek");
    if (advanceBtn) {
      advanceBtn.addEventListener("click", async () => {
        await decideWeekCycle(settings, "advance");
        toast(UIS("home.toast.advancedWeek"));
        render();
      });
    }
    const finishBtn = document.getElementById("finishProgram");
    if (finishBtn) {
      finishBtn.addEventListener("click", async () => {
        settings.maintenanceMode = true;
        await DB.setProfile(settings);
        toast(UIS("home.toast.finishedProgram"));
        render();
      });
    }
  }
});

// ================= WEEK DETAIL =================
// Resolve um item.link ({type, key}) pro título de exibição e pro hash
// de navegação — "list" busca o título já cadastrado em TOOL_CONFIGS
// (mesma fonte da tela de Recursos); "screen" é um punhado fixo de
// telas sem TOOL_CONFIGS (Life Pie, Círculo de Segurança, Princípios
// Básicos).
function resolveChecklistLink(link) {
  if (!link) return null;
  if (link.type === "list") {
    const tool = TOOL_CONFIGS[link.key];
    return tool ? { title: tool.title, hash: `#/list/${link.key}` } : null;
  }
  if (link.type === "screen") {
    const screens = {
      lifePie: { title: UI_STRINGS["tools.lifePie"], hash: "#/life-pie" },
      circuloSeguranca: { title: UI_STRINGS["tools.circuloSeguranca"], hash: "#/circulo-seguranca" },
      principiosBasicos: { title: UI_STRINGS["tools.principiosBasicos"], hash: "#/principios-basicos" },
      artistDate: { title: "Artist Date", hash: "#/artist-date" },
    };
    return screens[link.key] || null;
  }
  return null;
}

route("/week", async (rest) => {
  const weekId = Number(rest[0]) || 1;
  const week = WEEKS.find((w) => w.id === weekId);

  if (rest[1] === "essay") {
    appEl.innerHTML = `
      <div class="top-bar">
        <div class="logo" style="text-align:right">Semana ${week.id}<span class="sub">o tema em detalhe</span></div>
      </div>
      <h2>${week.title}</h2>
      <div class="card essay-text">
        ${(week.essay || []).map((p) => `<p>${p}</p>`).join("")}
      </div>
      <div class="spacer"></div>
    `;
    return;
  }

  const checklist = await DB.getChecklistForWeek(weekId);
  const doneSet = new Set(checklist.filter((c) => c.done).map((c) => c.itemIndex));

  const settings = await DB.getSetting("profile", null);
  const cursor = settings ? await getWeekCursor(settings) : null;
  const isCurrent = !!cursor && cursor.weekId === weekId;

  const currentWeekCard = cursor
    ? `
    <div class="card dotted text-center">
      ${
        isCurrent
          ? `<p class="muted">Esta é a sua semana atual.</p>`
          : `<p class="muted">Sua semana atual é a ${cursor.weekId}.</p>
             <button class="btn secondary block" id="setCurrentWeek">Tornar esta a minha semana atual</button>`
      }
    </div>`
    : "";

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">Semana ${week.id}<span class="sub">${WEEKS.length} no total</span></div>
    </div>
    <h2>${week.title}</h2>
    <p class="muted">${week.intro}</p>
    <a class="btn secondary block" href="#/week/${week.id}/essay"><span class="icon">${window.ArtistWayIcons.bookRegular}</span> Entenda o tema da semana</a>
    <div class="spacer-sm"></div>
    <div class="card">
      ${week.checklist
        .map((item, idx) => {
          const resolved = resolveChecklistLink(item.link);
          return `
        <div class="checklist-item ${doneSet.has(idx) ? "done" : ""}" data-idx="${idx}">
          <div class="box">${doneSet.has(idx) ? `<span class="icon">${window.ArtistWayIcons.checkmarkCircle}</span>` : ""}</div>
          <div class="text">
            ${item.task}
            <div class="item-note">${item.detail}</div>
            ${resolved ? `<div class="item-link" data-hash="${resolved.hash}">Toque aqui para abrir: ${resolved.title} →</div>` : ""}
          </div>
        </div>`;
        })
        .join("")}
    </div>
    <a class="btn brass block" href="#/checkin/${week.id}">Fazer o check-in dessa semana</a>
    ${currentWeekCard}
    <div class="spacer"></div>
  `;

  forEachNode(appEl.querySelectorAll(".checklist-item"), (el) => {
    el.addEventListener("click", async () => {
      const idx = Number(el.dataset.idx);
      const done = await DB.toggleChecklistItem(weekId, idx);
      el.classList.toggle("done", done);
    });
  });

  // Link tocável pra ferramenta dedicada — captura o clique antes que
  // borbulhe pro checklist-item (senão também marcaria/desmarcaria a
  // tarefa como feita ao mesmo tempo que navega).
  forEachNode(appEl.querySelectorAll(".item-link"), (el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.hash = el.dataset.hash;
    });
  });

  const setCurrentBtn = document.getElementById("setCurrentWeek");
  if (setCurrentBtn) {
    setCurrentBtn.addEventListener("click", async () => {
      await setCurrentWeek(settings, weekId);
      toast("Semana " + weekId + " definida como sua semana atual");
      render();
    });
  }
});

// ================= REFERÊNCIA (Regras da Estrada / Princípios Básicos) =================
function renderReferenceScreen(title, sub, items) {
  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">${title}<span class="sub">${sub}</span></div>
    </div>
    <div class="card">
      <ol class="rule-list">
        ${items.map((text) => `<li class="rule-item">${text}</li>`).join("")}
      </ol>
    </div>
    <div class="spacer"></div>
  `;
}

route("/regras-da-estrada", async () => {
  renderReferenceScreen(UI_STRINGS["tools.regrasDaEstrada"], "sempre por perto", ROAD_RULES);
});

route("/principios-basicos", async () => {
  renderReferenceScreen(UI_STRINGS["tools.principiosBasicos"], "a base de tudo", BASIC_PRINCIPLES);
});

route("/banco-afirmacoes", async () => {
  renderReferenceScreen(UI_STRINGS["tools.bancoAfirmacoes"], "20 frases prontas", AFFIRMATIONS);
});

route("/tabela-crencas", async () => {
  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">${UI_STRINGS["tools.tabelaCrencas"]}<span class="sub">contraponto rápido</span></div>
    </div>
    <div class="card">
      ${BELIEF_TABLE.map(
        (pair) => `
        <div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--colorNeutralStrokeSubtle,#e0e0e0);">
          <span class="muted" style="text-decoration:line-through;">${pair.negative}</span>
          <span style="font-weight:var(--fontWeightSemibold,600);">${pair.positive}</span>
        </div>`
      ).join("")}
    </div>
    <div class="spacer"></div>
  `;
});

// ================= LISTAS NOMEADAS (Vidas Imaginárias, 20 Coisas, Mapa
// do Ciúme) — uma tela genérica reaproveitada pelas 3, espelhando
// NamedListPage.xaml.cs no app do Windows. Círculo de Segurança tem tela
// própria (duas colunas + alternar lado, não um formulário de adicionar).
// TOOL_CONFIGS vem de data.js (fonte única, gerada também em
// Data/content.json pro lado UWP) — ver ContentStore.Content.ToolConfigs.

route("/list", async (rest) => {
  const config = TOOL_CONFIGS[rest[0]];
  if (!config) {
    navigate("#/settings");
    return;
  }
  const singletonId = `${config.listName}/singleton`;

  async function renderScreen() {
    const items = (await DB.getListItems(config.listName)).sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""));
    const existingSingleton = config.singleton ? items.find((i) => i.id === singletonId) : null;

    appEl.innerHTML = `
      <div class="top-bar">
        <div class="logo" style="text-align:right">${config.title}<span class="sub">${config.singleton ? "formulário" : config.fields.length > 1 ? "formulário" : "lista permanente"}</span></div>
      </div>
      <p class="muted">${config.subtitle}</p>
      <div class="card">
        ${config.fields
          .map(
            (f) => `
          <label>${f.label}</label>
          ${f.multiline ? `<textarea data-field="${f.key}">${existingSingleton && existingSingleton[f.key] ? existingSingleton[f.key] : ""}</textarea>` : `<input type="text" data-field="${f.key}" value="${existingSingleton && existingSingleton[f.key] ? existingSingleton[f.key] : ""}" />`}`
          )
          .join("")}
        <button class="btn brass block" id="addItem" style="margin-top:12px;">${config.singleton ? "Salvar" : "Adicionar"}</button>
      </div>
      ${
        config.singleton
          ? ""
          : items
              .map(
                (item) => `
        <div class="card">
          ${config.fields
            .map((f) => (item[f.key] ? `<p class="${config.fields.length > 1 ? "muted" : ""}">${config.fields.length > 1 ? `<strong>${f.label}:</strong> ` : ""}${item[f.key]}</p>` : ""))
            .join("")}
        </div>`
              )
              .join("")
      }
      <div class="spacer"></div>
    `;

    document.getElementById("addItem").addEventListener("click", async () => {
      const fields = {};
      let hasContent = false;
      config.fields.forEach((f) => {
        const el = document.querySelector(`[data-field="${f.key}"]`);
        const value = (el.value || "").trim();
        fields[f.key] = value;
        if (value) hasContent = true;
      });

      if (config.singleton) {
        await DB.updateListItem(config.listName, "singleton", fields);
        return;
      }

      if (!hasContent) return;
      await DB.addListItem(config.listName, fields);
      renderScreen();
    });
  }

  renderScreen();
});

// ================= QUIZ (genérico, dirigido por QUIZ_CONFIGS) =================
route("/quiz", async (rest) => {
  const quiz = QUIZ_CONFIGS[rest[0]];
  if (!quiz) {
    navigate("#/settings");
    return;
  }

  async function renderScreen() {
    const attempts = (await DB.getListItems(quiz.key)).sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""));

    appEl.innerHTML = `
      <div class="top-bar">
        <div class="logo" style="text-align:right">${quiz.title}<span class="sub">${quiz.subtitle}</span></div>
      </div>
      <div class="card">
        ${quiz.questions
          .map(
            (q, qi) => `
          <div class="quiz-question">
            <p><strong>${qi + 1}.</strong> ${q.text}</p>
            <div class="quiz-options">
              ${q.options
                .map(
                  (o) => `
                <label class="quiz-option">
                  <input type="radio" name="q${qi}" value="${o.value}" />
                  ${o.label}
                </label>`
                )
                .join("")}
            </div>
          </div>`
          )
          .join("")}
        <button class="btn brass block" id="seeResult" style="margin-top:12px;">Ver resultado</button>
        <p class="muted" id="quizResult" style="margin-top:12px;"></p>
      </div>
      ${
        attempts.length
          ? `<div class="card">
              <div class="card-title" style="font-size:1.05rem;">Tentativas anteriores</div>
              ${attempts
                .slice()
                .reverse()
                .map((a) => `<p class="muted">${(a.date || "").slice(0, 10)} — ${a.score} pontos (${a.bandLabel || ""})</p>`)
                .join("")}
            </div>`
          : ""
      }
      <div class="spacer"></div>
    `;

    document.getElementById("seeResult").addEventListener("click", async () => {
      let total = 0;
      let answeredAll = true;
      quiz.questions.forEach((q, qi) => {
        const checked = appEl.querySelector(`input[name="q${qi}"]:checked`);
        if (!checked) {
          answeredAll = false;
          return;
        }
        total += Number(checked.value);
      });

      const resultEl = document.getElementById("quizResult");
      if (!answeredAll) {
        resultEl.textContent = "Responda todas as perguntas pra ver o resultado.";
        return;
      }

      const band = quiz.bands.find((b) => total >= b.min && total <= b.max) || quiz.bands[quiz.bands.length - 1];
      resultEl.innerHTML = `<strong>${total} pontos — ${band.label}.</strong> ${band.description}`;

      await DB.addListItem(quiz.key, {
        score: String(total),
        bandLabel: band.label,
        date: todayStr(),
      });
    });
  }

  renderScreen();
});

// ================= CÍRCULO DE SEGURANÇA =================
route("/circulo-seguranca", async () => {
  const LIST_NAME = "safetyCircle";

  async function renderScreen() {
    const items = (await DB.getListItems(LIST_NAME)).sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""));
    const safe = items.filter((i) => i.side !== "caution");
    const caution = items.filter((i) => i.side === "caution");

    function renderNames(list, toCaution) {
      const icon = toCaution ? window.ArtistWayIcons.warning : window.ArtistWayIcons.checkmarkCircle;
      const label = toCaution ? "Mover pra Cautela" : "Mover pra Apoia";
      return list
        .map(
          (i) => `
        <div class="safety-row">
          <span class="safety-name">${i.name}</span>
          <button class="btn secondary" data-toggle="${i.id}"><span class="icon">${icon}</span>${label}</button>
        </div>`
        )
        .join("");
    }

    appEl.innerHTML = `
      <div class="top-bar">
        <div class="logo" style="text-align:right">${UI_STRINGS["tools.circuloSeguranca"]}<span class="sub">quem apoia, quem exige cautela</span></div>
      </div>
      <p class="muted">Quem apoia — e de quem se proteger por enquanto.</p>
      <div class="card">
        <label>Nome</label>
        <input type="text" id="nameBox" />
        <button class="btn brass block" id="addSafe" style="margin-top:12px;">Adicionar em "Apoia"</button>
      </div>
      <div class="card">
        <div class="card-title" style="font-size:1.05rem;">Apoia</div>
        ${renderNames(safe, true)}
      </div>
      <div class="card">
        <div class="card-title" style="font-size:1.05rem;">Cautela</div>
        ${renderNames(caution, false)}
      </div>
      <div class="spacer"></div>
    `;

    document.getElementById("addSafe").addEventListener("click", async () => {
      const name = document.getElementById("nameBox").value.trim();
      if (!name) return;
      await DB.addListItem(LIST_NAME, { name, side: "safe" });
      renderScreen();
    });
    forEachNode(appEl.querySelectorAll("[data-toggle]"), (btn) => {
      btn.addEventListener("click", async () => {
        const item = items.find((i) => i.id === btn.dataset.toggle);
        if (!item) return;
        const newSide = item.side === "caution" ? "safe" : "caution";
        await DB.updateListItem(LIST_NAME, item.id.split("/")[1], { name: item.name, side: newSide });
        renderScreen();
      });
    });
  }

  renderScreen();
});

// ================= LIFE PIE =================
const LIFE_PIE_CATEGORIES = [
  { key: "espiritualidade", label: "Espiritualidade" },
  { key: "trabalho", label: "Trabalho" },
  { key: "lazer", label: "Lazer" },
  { key: "amigos", label: "Amigos" },
  { key: "romance", label: "Romance" },
  { key: "exercicio", label: "Exercício" },
];

route("/life-pie", async () => {
  const LIST_NAME = "lifePie";
  const snapshots = (await DB.getListItems(LIST_NAME)).sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""));
  const previous = snapshots.length ? snapshots[snapshots.length - 1] : null;

  // Começa com os valores do último snapshot (se existir) — assim dá
  // pra ajustar em vez de sempre começar do zero.
  const ratings = {};
  LIFE_PIE_CATEGORIES.forEach((c) => {
    ratings[c.key] = previous ? Number(previous[`ratings.${c.key}`] || 5) : 5;
  });

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">${UI_STRINGS["tools.lifePie"]}<span class="sub">seu círculo de vida</span></div>
    </div>
    <p class="muted">Arraste cada eixo pra marcar o quanto essa área está satisfeita hoje (0 a 10). ${previous ? "A silhueta clara mostra o snapshot anterior, pra comparar." : ""}</p>
    <div class="card text-center">
      <canvas id="lifePieCanvas" width="300" height="300" style="max-width:100%;touch-action:none;"></canvas>
      <div class="spacer-sm"></div>
      <button class="btn brass block" id="saveSnapshot">Salvar snapshot de hoje</button>
    </div>
    ${
      snapshots.length
        ? `<div class="card">
      <div class="card-title" style="font-size:1.05rem;">Snapshots salvos</div>
      ${snapshots
        .slice()
        .reverse()
        .map((s) => `<p class="muted">${(s.date || s.updatedAt || "").slice(0, 10)} — ${LIFE_PIE_CATEGORIES.map((c) => `${c.label.slice(0, 3)} ${s[`ratings.${c.key}`] || 0}`).join(", ")}</p>`)
        .join("")}
    </div>`
        : ""
    }
    <div class="spacer"></div>
  `;


  const canvas = document.getElementById("lifePieCanvas");
  const ctx = canvas.getContext("2d");
  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  const maxRadius = canvas.width / 2 - 40;
  const n = LIFE_PIE_CATEGORIES.length;

  function axisPoint(index, value) {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 10) * maxRadius;
    return { x: center.x + r * Math.cos(angle), y: center.y + r * Math.sin(angle) };
  }

  function drawPolygon(values, strokeStyle, fillStyle) {
    ctx.beginPath();
    LIFE_PIE_CATEGORIES.forEach((c, i) => {
      const p = axisPoint(i, values[c.key]);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // grade de fundo (anéis 2/4/6/8/10)
    ctx.strokeStyle = "rgba(128,128,128,0.25)";
    ctx.lineWidth = 1;
    for (let ring = 2; ring <= 10; ring += 2) {
      ctx.beginPath();
      LIFE_PIE_CATEGORIES.forEach((c, i) => {
        const p = axisPoint(i, ring);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    // eixos + rótulos
    ctx.fillStyle = "rgba(128,128,128,0.9)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    LIFE_PIE_CATEGORIES.forEach((c, i) => {
      const edge = axisPoint(i, 10);
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(edge.x, edge.y);
      ctx.strokeStyle = "rgba(128,128,128,0.25)";
      ctx.stroke();
      const label = axisPoint(i, 11.6);
      ctx.fillText(c.label, label.x, label.y);
    });

    if (previous) {
      const prevRatings = {};
      LIFE_PIE_CATEGORIES.forEach((c) => (prevRatings[c.key] = Number(previous[`ratings.${c.key}`] || 0)));
      drawPolygon(prevRatings, "rgba(128,128,128,0.5)", "rgba(128,128,128,0.12)");
    }

    drawPolygon(ratings, "#0f6cbd", "rgba(15,108,189,0.25)");

    LIFE_PIE_CATEGORIES.forEach((c, i) => {
      const p = axisPoint(i, ratings[c.key]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#0f6cbd";
      ctx.fill();
    });
  }

  function updateFromPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX - center.x;
    const y = (clientY - rect.top) * scaleY - center.y;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const index = Math.round(angle / ((Math.PI * 2) / n)) % n;
    const dist = Math.sqrt(x * x + y * y);
    const value = Math.max(0, Math.min(10, Math.round((dist / maxRadius) * 10)));
    ratings[LIFE_PIE_CATEGORIES[index].key] = value;
    draw();
  }

  let dragging = false;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    updateFromPointer(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) updateFromPointer(e.clientX, e.clientY);
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  draw();

  document.getElementById("saveSnapshot").addEventListener("click", async () => {
    const fields = { date: todayStr() };
    LIFE_PIE_CATEGORIES.forEach((c) => {
      fields[`ratings.${c.key}`] = String(ratings[c.key]);
    });
    await DB.addListItem(LIST_NAME, fields);
    toast("Snapshot salvo");
    render();
  });
});

// ================= ARTIST DATE =================
route("/artist-date", async () => {
  const settings = await DB.getSetting("profile", null);
  const weekId = (await getWeekCursor(settings)).weekId;
  const weekKey = weekKeyForOffset(settings, weekId);
  const current = (await DB.getArtistDate(weekKey)) || { done: false, idea: "" };

  let usedIdeas = JSON.parse(localStorage.getItem("awUsedIdeas") || "[]");
  // Só o botão "Salvar Date" grava/sincroniza a ideia — entrar e sair
  // dessa tela sem clicar em nada não muda nada. Espelha o ArtistDatePage
  // do app do Windows: antes salvava sozinho ao digitar e ao sair da
  // tela, e um "toque" sem edição real podia carimbar um updatedAt mais
  // novo que uma edição de verdade feita em outro aparelho e ainda não
  // sincronizada, apagando ela na mesclagem.
  let editing = false;
  let draftIdea = current.idea || "";

  function pickIdea() {
    if (usedIdeas.length >= ARTIST_DATE_IDEAS.length) usedIdeas = [];
    let idx;
    do {
      idx = Math.floor(Math.random() * ARTIST_DATE_IDEAS.length);
    } while (usedIdeas.includes(idx));
    usedIdeas.push(idx);
    localStorage.setItem("awUsedIdeas", JSON.stringify(usedIdeas));
    draftIdea = ARTIST_DATE_IDEAS[idx];
    renderScreen();
  }

  function renderScreen() {
    appEl.innerHTML = `
      <p class="muted">${UIS("artistDate.weekLabel", { week: weekId })}</p>
      <p class="muted text-center">${UIS("artistDate.description")}</p>
      ${
        editing
          ? `
        <div class="idea-card">
          <textarea id="ideaText" placeholder="${UIS("artistDate.ideaPlaceholder")}">${draftIdea}</textarea>
        </div>
        <button class="btn secondary block" id="shuffle"><span class="icon">${window.ArtistWayIcons.dice}</span> ${UIS("artistDate.shuffleButton")}</button>
        <div class="spacer"></div>
        <button class="btn brass block" id="saveDate">${UIS("artistDate.saveButton")}</button>
        <div class="spacer-sm"></div>
        <button class="btn secondary block" id="cancelEdit">${UIS("common.cancel")}</button>
      `
          : `
        <div class="card">
          <div class="card-title" style="font-size:1.05rem;">${UIS("artistDate.summaryTitle")}</div>
          <p class="muted">${current.idea ? current.idea : UIS("artistDate.noIdeaYet")}</p>
          <button class="btn ${current.done ? "secondary" : "moss"} block" id="markDone">
            ${current.done ? UIS("artistDate.doneButton") : UIS("artistDate.markDoneButton")}
          </button>
          <div class="spacer-sm"></div>
          <button class="btn secondary block" id="editDate">${UIS("artistDate.editButton")}</button>
        </div>
      `
      }
      <div class="spacer"></div>
      <div class="card dotted text-center">
        <p class="muted">${UIS("artistDate.googleCalendarPrompt")}</p>
        <button class="btn brass block" id="addCal">${UIS("artistDate.addGoogleCalendarButton")}</button>
      </div>
    `;

    if (editing) {
      document.getElementById("ideaText").addEventListener("input", (e) => {
        draftIdea = e.target.value;
      });
      document.getElementById("shuffle").addEventListener("click", pickIdea);
      document.getElementById("saveDate").addEventListener("click", async () => {
        current.idea = draftIdea;
        await DB.setArtistDate(weekKey, current);
        editing = false;
        toast(UIS("artistDate.toastSaved"));
        renderScreen();
      });
      document.getElementById("cancelEdit").addEventListener("click", () => {
        editing = false;
        renderScreen();
      });
    } else {
      document.getElementById("markDone").addEventListener("click", async () => {
        current.done = !current.done;
        await DB.setArtistDate(weekKey, current);
        toast(current.done ? UIS("artistDate.toastDone") : UIS("artistDate.toastUndone"));
        renderScreen();
      });
      document.getElementById("editDate").addEventListener("click", () => {
        draftIdea = current.idea || "";
        editing = true;
        renderScreen();
      });
    }

    document.getElementById("addCal").addEventListener("click", async () => {
      const s = await DB.getSetting("profile", null);
      const url = GCAL.artistDateUrl(Number(s.artistDateDay), s.artistDateTime);
      GCAL.openUrl(url);
    });
  }
  renderScreen();
});

// ================= CHECK-IN =================
route("/checkin", async (rest) => {
  const weekId = Number(rest[0]) || 1;
  const week = WEEKS.find((w) => w.id === weekId);
  const existing = (await DB.getCheckin(weekId)) || { answers: {} };

  const questions = [...CHECKIN_CORE_QUESTIONS, week.checkinBonus];

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">${UIS("checkin.pwaTitle")}<span class="sub">${UIS("checkin.pwaSubtitle", { week: weekId })}</span></div>
    </div>
    <div class="card">
      ${questions
        .map(
          (q, i) => `
        <label>${q}</label>
        <textarea data-q="${i}">${existing.answers[i] || ""}</textarea>`
        )
        .join("")}
    </div>
    <button class="btn moss block" id="save">${UIS("checkin.saveButton")}</button>
    <div class="spacer"></div>
  `;
  document.getElementById("save").addEventListener("click", async () => {
    const answers = {};
    forEachNode(appEl.querySelectorAll("textarea[data-q]"), (ta) => {
      answers[ta.dataset.q] = ta.value;
    });
    await DB.saveCheckin(weekId, answers);
    toast(UIS("checkin.toastSaved"));
    navigate("#/home");
  });
});

// ================= HISTÓRICO (Artist Dates + reler check-ins) =================
// Só leitura — lê os stores artistDates/checkins já existentes, sem
// escrever nada novo.
route("/artist-date-history", async () => {
  const all = await DB.dbGetAll(DB.STORES.artistDates);
  const items = all
    .filter((a) => a.done || a.idea)
    .sort((a, b) => (b.weekStart || "").localeCompare(a.weekStart || ""));

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">${UI_STRINGS["tools.artistDateHistory"]}<span class="sub">todos os encontros já registrados</span></div>
    </div>
    <div class="card">
      ${
        items.length
          ? items
              .map(
                (item) => `
        <div style="margin-bottom:12px;">
          <p style="font-weight:var(--fontWeightSemibold,600);margin:0;">${item.weekStart}${item.done ? " — feito" : " — planejado"}</p>
          ${item.idea ? `<p class="muted" style="margin:0;">${item.idea}</p>` : ""}
        </div>`
              )
              .join("")
          : `<p class="muted">Nenhum Artist Date registrado ainda.</p>`
      }
    </div>
    <div class="spacer"></div>
  `;
});

route("/checkin-history", async () => {
  const all = await DB.dbGetAll(DB.STORES.checkins);
  const weeksWithCheckin = new Set(all.map((c) => Number(c.weekId)));

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">${UI_STRINGS["tools.checkinHistory"]}<span class="sub">toque numa semana com check-in salvo</span></div>
    </div>
    <div class="card">
      ${Array.from({ length: 12 }, (_, i) => i + 1)
        .map((weekId) => {
          const has = weeksWithCheckin.has(weekId);
          return has
            ? `<a class="btn secondary block" href="#/checkin/${weekId}" style="margin-bottom:8px;">Semana ${weekId} — ver check-in</a>`
            : `<button class="btn secondary block" style="margin-bottom:8px;" disabled>Semana ${weekId} — sem check-in ainda</button>`;
        })
        .join("")}
    </div>
    <div class="spacer"></div>
  `;
});

// ================= PROGRESS (jornada) =================
route("/progress", async () => {
  const settings = await DB.getSetting("profile", null);
  const currentWeekId = (await getWeekCursor(settings)).weekId;

  const chips = await Promise.all(
    WEEKS.map(async (w) => {
      const checklist = await DB.getChecklistForWeek(w.id);
      const doneCount = checklist.filter((c) => c.done).length;
      const complete = doneCount === w.checklist.length;
      return { id: w.id, complete, current: w.id === currentWeekId };
    })
  );

  appEl.innerHTML = `
    <p class="muted">Toque em qualquer semana — você pode ir e voltar à vontade.</p>
    <div class="week-grid">
      ${chips
        .map(
          (c) => `<div class="week-chip ${c.current ? "current" : ""} ${c.complete ? "complete" : ""}" data-week="${c.id}">
            ${c.id}<small>${c.complete ? "feito" : c.current ? "atual" : ""}</small>
          </div>`
        )
        .join("")}
    </div>
    <div class="spacer"></div>
  `;
  forEachNode(appEl.querySelectorAll(".week-chip"), (el) => {
    el.addEventListener("click", () => navigate("#/week/" + el.dataset.week));
  });
});

// ================= FERRAMENTAS (Recursos) =================
// Telas de ferramenta que não são TOOL_CONFIGS (têm tela própria em vez
// da genérica NamedList) — mesma "semana de introdução" já conferida
// linha a linha contra o texto original, só que aqui centralizada em
// vez de espalhada em várias abas por categoria.
const BESPOKE_TOOL_SCREENS = [
  { title: UI_STRINGS["tools.principiosBasicos"], hash: "#/principios-basicos", week: null },
  { title: UI_STRINGS["tools.tabelaCrencas"], hash: "#/tabela-crencas", week: 1 },
  { title: UI_STRINGS["tools.regrasDaEstrada"], hash: "#/regras-da-estrada", week: 2 },
  { title: UI_STRINGS["tools.circuloSeguranca"], hash: "#/circulo-seguranca", week: 2 },
  { title: UI_STRINGS["tools.lifePie"], hash: "#/life-pie", week: 2 },
  { title: UI_STRINGS["tools.bancoAfirmacoes"], hash: "#/banco-afirmacoes", week: 8 },
  { title: UI_STRINGS["tools.artistDateHistory"], hash: "#/artist-date-history", week: null },
  { title: UI_STRINGS["tools.checkinHistory"], hash: "#/checkin-history", week: 9 },
  { title: QUIZ_CONFIGS.workaholismQuiz.title, hash: "#/quiz/workaholismQuiz", week: 10 },
];

// Junta as telas fixas acima com as ferramentas genéricas de TOOL_CONFIGS
// que pertencem à mesma semana (ou `week: null` pro grupo "Geral").
function toolsForWeek(week) {
  const bespoke = BESPOKE_TOOL_SCREENS.filter((s) => s.week === week);
  const configured = Object.keys(TOOL_CONFIGS)
    .filter((key) => {
      const cfg = TOOL_CONFIGS[key];
      return (cfg.week ?? null) === week || (cfg.alsoWeeks || []).includes(week);
    })
    .map((key) => ({ title: TOOL_CONFIGS[key].title, hash: `#/list/${key}`, weekNote: TOOL_CONFIGS[key].weekNote }));
  return bespoke.concat(configured);
}

function renderToolLinks(items) {
  if (items.length === 0) {
    return `<p class="muted">Nenhuma ferramenta ainda.</p>`;
  }
  return items
    .map(
      (item) => `
        <a class="btn secondary block" href="${item.hash}">${item.title}</a>
        ${item.weekNote ? `<p class="muted" style="margin:2px 0 8px;font-size:0.85em;">${item.weekNote}</p>` : `<div class="spacer-sm"></div>`}
      `
    )
    .join("");
}

const ferramentasTabState = { active: "week1" };
route("/ferramentas", async () => {
  appEl.innerHTML = `<div id="ferramentasTabs"></div><div class="spacer"></div>`;

  const weekTabs = [];
  for (let w = 1; w <= 12; w++) {
    const items = toolsForWeek(w);
    if (items.length === 0) continue; // semanas ainda sem ferramenta própria nesta leva
    weekTabs.push({ id: `week${w}`, label: `Semana ${w}`, html: renderToolLinks(items) });
  }
  weekTabs.push({ id: "geral", label: "Geral", html: renderToolLinks(toolsForWeek(null)) });

  renderTabs(document.getElementById("ferramentasTabs"), weekTabs, ferramentasTabState);
});

// Meu Perfil (fora de Ajustes — destino próprio no painel de
// navegação, igual ao ProfilePage do UWP). Perfil não é bem um
// "ajuste", é o programa de 12 semanas da pessoa.
route("/profile", async () => {
  const settings = (await DB.getSetting("profile", null)) || {};

  appEl.innerHTML = `
    <div class="card">
      <label>${UIS("onboarding.nameDate.nameLabel")}</label>
      <input type="text" id="fname" value="${settings.name || ""}" />
      <label>${UIS("onboarding.nameDate.startDateLabel")}</label>
      <input type="date" id="fstart" value="${settings.startDate || ""}" />
      <label>${UIS("profile.mpTimeLabel")}</label>
      <input type="time" id="fmp" value="${settings.morningPagesTime || "07:00"}" />
      <label>${UIS("profile.adDayLabel")}</label>
      <select id="fadday">
        ${[1, 2, 3, 4, 5, 6, 7]
          .map((d) => `<option value="${d}" ${String(d) === String(settings.artistDateDay) ? "selected" : ""}>${weekdayNames()[d]}</option>`)
          .join("")}
      </select>
      <label>${UIS("profile.adTimeLabel")}</label>
      <input type="time" id="fadtime" value="${settings.artistDateTime || "16:00"}" />
      <label>${UIS("profile.ciDayLabel")}</label>
      <select id="fciday">
        ${[1, 2, 3, 4, 5, 6, 7]
          .map((d) => `<option value="${d}" ${String(d) === String(settings.checkinDay) ? "selected" : ""}>${weekdayNames()[d]}</option>`)
          .join("")}
      </select>
      <label>${UIS("profile.ciTimeLabel")}</label>
      <input type="time" id="fcitime" value="${settings.checkinTime || "19:00"}" />
      <div class="spacer"></div>
      <button class="btn brass block" id="save">${UIS("settings.profile.saveButton")}</button>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UIS("profile.googleCalendarSectionTitle")}</div>
      <p class="muted">${UIS("profile.googleCalendarSectionDescription")}</p>
      <button class="btn secondary block" id="calMP">${UIS("profile.addMpCalendarButton")}</button>
      <div class="spacer-sm"></div>
      <button class="btn secondary block" id="calAD">${UIS("profile.addAdCalendarButton")}</button>
      <div class="spacer-sm"></div>
      <button class="btn secondary block" id="calCI">${UIS("profile.addCiCalendarButton")}</button>
    </div>

    <div class="spacer"></div>
  `;

  document.getElementById("save").addEventListener("click", async () => {
    const updated = Object.assign({}, settings, {
      name: document.getElementById("fname").value.trim(),
      startDate: document.getElementById("fstart").value,
      morningPagesTime: document.getElementById("fmp").value,
      artistDateDay: document.getElementById("fadday").value,
      artistDateTime: document.getElementById("fadtime").value,
      checkinDay: document.getElementById("fciday").value,
      checkinTime: document.getElementById("fcitime").value,
      onboarded: true,
    });
    await DB.setProfile(updated);
    await NOTIF.applySettings(updated);
    toast(UIS("profile.savedMessage"));
    render();
  });

  document.getElementById("calMP").addEventListener("click", async () => {
    const s = await DB.getSetting("profile", null);
    GCAL.openUrl(GCAL.morningPagesUrl(s.morningPagesTime));
  });
  document.getElementById("calAD").addEventListener("click", async () => {
    const s = await DB.getSetting("profile", null);
    GCAL.openUrl(GCAL.artistDateUrl(Number(s.artistDateDay), s.artistDateTime));
  });
  document.getElementById("calCI").addEventListener("click", async () => {
    const s = await DB.getSetting("profile", null);
    GCAL.openUrl(GCAL.checkinUrl(Number(s.checkinDay), s.checkinTime));
  });
});

const settingsTabState = { active: "appearance" };
route("/settings", async () => {
  const settings = (await DB.getSetting("profile", null)) || {};
  const fontSize = settings.fontSize || "medium";

  appEl.innerHTML = `<div id="settingsTabs"></div>`;

  renderTabs(
    document.getElementById("settingsTabs"),
    [
      {
        id: "appearance",
        label: UI_STRINGS["settings.tabs.appearance"],
        html: `
          <div class="card">
            <div class="card-title" style="font-size:1.05rem;">Tamanho da letra</div>
            <div style="display:flex;gap:8px;">
              <button class="btn ${fontSize === "small" ? "brass" : "secondary"}" style="flex:1;" data-fontsize="small">Pequena</button>
              <button class="btn ${fontSize === "medium" ? "brass" : "secondary"}" style="flex:1;" data-fontsize="medium">Média</button>
              <button class="btn ${fontSize === "large" ? "brass" : "secondary"}" style="flex:1;" data-fontsize="large">Grande</button>
            </div>
          </div>

          <div class="card">
            <p class="muted">${UI_STRINGS["settings.appearance.description"]}</p>
            <label>Cor de destaque</label>
            <div class="swatch-row" id="accentSwatches">
              ${window.ArtistWayTheme.ACCENT_COLORS.map(
                (color) =>
                  `<button class="swatch ${(settings.accentColor || window.ArtistWayTheme.ACCENT_COLORS[0]) === color ? "selected" : ""}" style="background:${color};" data-accent="${color}" aria-label="${color}"></button>`
              ).join("")}
            </div>
            <label>Tema</label>
            <div class="theme-mode-row" id="themeModeRow">
              <button class="btn ${(settings.themeMode || "auto") === "light" ? "" : "secondary"}" data-theme-mode="light"><span class="icon">${window.ArtistWayIcons.sun}</span> Claro</button>
              <button class="btn ${(settings.themeMode || "auto") === "dark" ? "" : "secondary"}" data-theme-mode="dark"><span class="icon">${window.ArtistWayIcons.moon}</span> Escuro</button>
              <button class="btn ${(settings.themeMode || "auto") === "auto" ? "" : "secondary"}" data-theme-mode="auto">Automático</button>
            </div>
          </div>
        `,
      },
      {
        id: "dataSync",
        label: UI_STRINGS["settings.tabs.dataSync"],
        html: `
          <div class="card">
            <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.data.title"]}</div>
            <p class="muted">Tudo fica só no seu aparelho. Faça backup de vez em quando.</p>
            <button class="btn secondary block" id="exportData">${UI_STRINGS["settings.export"]}</button>
            ${
              isUwpHost()
                ? `<div class="spacer-sm"></div><button class="btn secondary block" id="importDataUwp">${UI_STRINGS["settings.import"]}</button>`
                : `<div class="spacer-sm"></div><label>${UI_STRINGS["settings.import"]}</label><input type="file" id="importFile" accept=".json" />`
            }
          </div>

          <div class="card">
            <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.sync.title"]}</div>
            <p class="muted">Login com Google sincroniza seu progresso entre aparelhos automaticamente em segundo plano — funciona junto com o app do Windows, no mesmo login.</p>
            <p class="muted" id="syncStatus">Verificando...</p>
            <button class="btn brass block" id="googleLogin">Entrar com Google</button>
            <button class="btn secondary block" id="signOut" style="display:none;">${UI_STRINGS["settings.signOut"]}</button>
          </div>
        `,
      },
      {
        id: "advanced",
        label: UI_STRINGS["settings.tabs.advanced"],
        html: `
          <div class="card" id="updatesCard">
            <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.updates.title"]}</div>
            <p class="muted" id="updatesBody">Verificando...</p>
          </div>

          <div class="card">
            <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.maintenance.title"]}</div>
            <p class="muted">${UI_STRINGS["settings.maintenance.description"]}</p>
            <button class="btn ${settings.maintenanceMode ? "secondary" : "brass"} block" id="toggleMaintenance">
              ${settings.maintenanceMode ? UI_STRINGS["settings.maintenance.toggleOff"] : UI_STRINGS["settings.maintenance.toggleOn"]}
            </button>
          </div>

          <div class="card">
            <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.dangerZone.title"]}</div>
            <p class="muted">Apaga o progresso salvo (perfil, Morning Pages, Artist Dates, checklist, check-ins). Não tem como desfazer — faça um backup antes se quiser guardar alguma coisa.</p>
            <button class="btn secondary block" id="clearData">${UI_STRINGS["settings.clearData.button"]}</button>
            <div class="spacer-sm"></div>
            <button class="btn secondary block" id="fullReset">${UI_STRINGS["settings.fullReset.button"]}</button>
          </div>
        `,
      },
    ],
    settingsTabState
  );
  appEl.insertAdjacentHTML("beforeend", `<div class="spacer"></div>`);

  forEachNode(appEl.querySelectorAll("[data-fontsize]"), (btn) => {
    btn.addEventListener("click", async () => {
      const updated = Object.assign({}, settings, { fontSize: btn.dataset.fontsize });
      await DB.setProfile(updated);
      applyFontSizePreference(updated.fontSize);
      render();
    });
  });

  forEachNode(appEl.querySelectorAll("[data-accent]"), (btn) => {
    btn.addEventListener("click", async () => {
      const updated = Object.assign({}, settings, { accentColor: btn.dataset.accent });
      await DB.setProfile(updated);
      window.ArtistWayTheme.applyTheme(updated);
      render();
    });
  });

  forEachNode(appEl.querySelectorAll("[data-theme-mode]"), (btn) => {
    btn.addEventListener("click", async () => {
      const updated = Object.assign({}, settings, { themeMode: btn.dataset.themeMode });
      await DB.setProfile(updated);
      window.ArtistWayTheme.applyTheme(updated);
      render();
    });
  });

  document.getElementById("exportData").addEventListener("click", async () => {
    const data = await DB.exportAllData();
    const json = JSON.stringify(data, null, 2);
    const filename = `artist-way-backup-${todayStr()}.json`;
    if (isUwpHost()) {
      // A WebView UWP legada não dispara o download via Blob + <a download>
      // — pede pro app nativo salvar o arquivo com um seletor de verdade.
      // O resultado (sucesso/cancelado/erro) volta via callback, nunca fica
      // silencioso.
      window.__onNativeExportResult = (result) => {
        delete window.__onNativeExportResult;
        if (result && result.success) {
          toast("Backup salvo ✓");
        } else if (result && result.canceled) {
          // usuário cancelou o seletor — não é erro, sem toast.
        } else {
          toast("Erro ao salvar backup: " + ((result && result.error) || "desconhecido"));
        }
      };
      window.external.notify(JSON.stringify({ type: "exportData", filename, content: json }));
      return;
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });

  const importFileEl = document.getElementById("importFile");
  if (importFileEl) {
    importFileEl.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const payload = JSON.parse(text);
        await DB.importAllData(payload);
        toast("Backup importado ✓");
        render();
      } catch (err) {
        toast("Arquivo inválido");
      }
    });
  }

  const importDataUwpEl = document.getElementById("importDataUwp");
  if (importDataUwpEl) {
    importDataUwpEl.addEventListener("click", () => {
      window.__onNativeImportResult = async (result) => {
        delete window.__onNativeImportResult;
        if (!result || !result.success) {
          if (result && !result.canceled) {
            toast("Erro ao importar backup: " + (result.error || "desconhecido"));
          }
          return;
        }
        try {
          const payload = JSON.parse(result.content);
          await DB.importAllData(payload);
          toast("Backup importado ✓");
          render();
        } catch (err) {
          toast("Arquivo inválido");
        }
      };
      window.external.notify(JSON.stringify({ type: "importRequest" }));
    });
  }

  const syncStatusEl = document.getElementById("syncStatus");
  const googleLoginBtn = document.getElementById("googleLogin");
  const signOutBtn = document.getElementById("signOut");

  async function refreshSyncStatus() {
    if (!syncStatusEl || !syncStatusEl.isConnected) return;
    const session = await window.ArtistWayAuth.getSession();
    if (!session) {
      syncStatusEl.textContent = "Não logado.";
      if (googleLoginBtn) googleLoginBtn.style.display = "";
      if (signOutBtn) signOutBtn.style.display = "none";
      return;
    }
    syncStatusEl.textContent = `Logado como ${session.email || session.uid} (${session.provider}).`;
    if (googleLoginBtn) googleLoginBtn.style.display = "none";
    if (signOutBtn) signOutBtn.style.display = "";
  }
  refreshSyncStatus();

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => window.ArtistWayAuth.startGoogleLogin());
  }
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await window.ArtistWayAuth.signOut();
      refreshSyncStatus();
    });
  }

  document.getElementById("toggleMaintenance").addEventListener("click", async () => {
    const updated = Object.assign({}, settings, { maintenanceMode: !settings.maintenanceMode });
    await DB.setProfile(updated);
    render();
  });

  // Apaga o progresso (aparelho + nuvem, se logado) mas mantém a sessão —
  // útil pra recomeçar o programa do zero sem precisar logar de novo. A
  // conta continua existindo, só fica vazia. Mesmo par de opções do app UWP.
  document.getElementById("clearData").addEventListener("click", async () => {
    const session = await window.ArtistWayAuth.getSession();
    const msg = session
      ? UI_STRINGS["settings.clearData.confirmMessageLoggedIn"]
      : UI_STRINGS["settings.clearData.confirmMessageLocal"];
    if (!(await confirmDialog(UI_STRINGS["settings.clearData.confirmTitle"], msg, UI_STRINGS["settings.clearData.confirmButton"]))) return;
    if (session) await window.ArtistWaySync.clearCloudData();
    await DB.resetAllData({ keepSession: true });
    location.reload();
  });

  // Reset completo: apaga o progresso (aparelho + nuvem) E sai da conta.
  document.getElementById("fullReset").addEventListener("click", async () => {
    const session = await window.ArtistWayAuth.getSession();
    const msg = session
      ? UI_STRINGS["settings.fullReset.confirmMessageLoggedIn"]
      : UI_STRINGS["settings.clearData.confirmMessageLocal"];
    if (!(await confirmDialog(UI_STRINGS["settings.fullReset.confirmTitle"], msg, UI_STRINGS["settings.fullReset.confirmButton"]))) return;
    if (session) {
      await window.ArtistWaySync.clearCloudData();
      await window.ArtistWayAuth.signOut();
    }
    await DB.resetAllData({ keepSession: false });
    location.reload();
  });

  const updatesBodyEl = document.getElementById("updatesBody");
  if (updatesBodyEl) {
    if (!window.ArtistWayUpdates || !window.ArtistWayUpdates.isPackagedApp()) {
      getDisplayVersion().then((version) => {
        if (!updatesBodyEl.isConnected) return;
        updatesBodyEl.textContent = version
          ? `Versão ${version} — a versão web se atualiza sozinha, sem precisar checar nada aqui.`
          : "Você está usando a versão web — ela se atualiza sozinha, sem precisar checar nada aqui.";
      });
    } else {
      const installed = window.ArtistWayUpdates.getInstalledVersion();
      updatesBodyEl.textContent = `Versão instalada: ${installed}. Verificando se há atualização...`;
      window.ArtistWayUpdates.checkForUpdate().then((result) => {
        if (!updatesBodyEl.isConnected) return;
        if (!result) {
          updatesBodyEl.textContent = `Versão instalada: ${installed}. Não foi possível checar agora.`;
          return;
        }
        if (result.error) {
          updatesBodyEl.textContent = `Versão instalada: ${installed}. Não foi possível checar agora (${result.error}).`;
          return;
        }
        if (result.updateAvailable) {
          updatesBodyEl.innerHTML = `Versão instalada: ${result.current}. Nova versão disponível: <strong>${result.latest}</strong>.`;
          const btn = document.createElement("button");
          btn.className = "btn brass block";
          btn.textContent = "Baixar atualização";
          btn.style.marginTop = "10px";
          btn.addEventListener("click", () => {
            GCAL.openUrl("https://ro2342.github.io/theartistsway/app/");
          });
          updatesBodyEl.parentElement.appendChild(btn);
        } else {
          updatesBodyEl.textContent = `Versão instalada: ${result.current}. Atualizado ✓`;
        }
      });
    }
  }
});

// — boot —
// theme.js é um módulo ES (só ele, por causa dos temas prontos do
// Fluent) — módulos sempre carregam depois dos scripts clássicos, então
// esperamos o evento de pronto antes do primeiro render pra não desenhar
// a tela com o tema errado por um instante.
function waitForTheme() {
  if (window.ArtistWayTheme) return Promise.resolve();
  return new Promise((resolve) => window.addEventListener("artistway-theme-ready", resolve, { once: true }));
}

(async function boot() {
  await waitForTheme();
  const settings = await DB.getSetting("profile", null);
  applyFontSizePreference(settings && settings.fontSize);
  window.ArtistWayTheme.applyTheme(settings);
  window.ArtistWayTheme.watchSystemTheme(() => DB.getSetting("profile", null));

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (e) {
      console.warn("SW falhou", e);
    }
  }
  render();
})();
