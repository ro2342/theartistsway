// app.js — roteador e telas do Companheiro do The Artist's Way
const DB = window.ArtistWayDB;
const NOTIF = window.ArtistWayNotifications;
const GCAL = window.ArtistWayCalendar;

const WEEKDAY_NAMES = ["", "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const appEl = document.getElementById("app");

// NodeList.prototype.forEach não existe no WebView antigo do Windows 10
// Mobile -- Array.prototype.forEach (via .call) funciona em qualquer engine.
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

// ---------- tamanho da letra ----------
function applyFontSizePreference(size) {
  document.documentElement.classList.remove("fs-small", "fs-large");
  if (size === "small") document.documentElement.classList.add("fs-small");
  if (size === "large") document.documentElement.classList.add("fs-large");
}

// ---------- utilidades de data ----------
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

// Afirmação do dia: escolha determinística pelo dia do ano, sem precisar
// guardar nenhum dado novo -- mesmo cálculo no app do Windows
// (HomePage.xaml.cs), pra mostrar a mesma frase nos dois aparelhos no
// mesmo dia.
function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / (24 * 3600 * 1000));
}

async function getCurrentWeekId(settings) {
  if (!settings.startDate) return 1;
  const start = startOfWeek(new Date(settings.startDate + "T00:00:00"));
  const now = startOfWeek(new Date());
  const diffWeeks = Math.round((now - start) / (7 * 24 * 3600 * 1000));
  return Math.min(12, Math.max(1, diffWeeks + 1));
}

const PROGRAM_LENGTH_DAYS = 84; // 12 semanas x 7 dias

// Contador de dias (Home) e detecção de fim de programa (Modo manutenção)
// -- mesmo cálculo simples nas duas plataformas, sem guardar nada novo.
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

// ---------- toast ----------
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

// ---------- diálogo de confirmação (fluent-dialog de verdade) ----------
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
        <fluent-button slot="action" id="confirmDialogNo">Cancelar</fluent-button>
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

// ---------- router ----------
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
  renderBottomNav(routeKey);
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", render);

// Número da versão publicada -- mesmo app/version.json que o checador de
// atualização do app do Windows já usa (updates.js), só que aqui é
// puramente informativo: aparece no rodapé da rail (desktop) e em
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

function renderBottomNav(activePath) {
  let nav = document.getElementById("bottomNav");
  const settingsPromise = DB.getSetting("profile", null);
  settingsPromise.then(async (settings) => {
    if (!settings || !settings.onboarded) {
      if (nav) nav.remove();
      return;
    }
    const ICONS = window.ArtistWayIcons;
    const items = [
      { path: "/home", label: UI_STRINGS["nav.home"], regular: ICONS.homeRegular, filled: ICONS.homeFilled },
      { path: "/progress", label: UI_STRINGS["nav.progress"], regular: ICONS.bookRegular, filled: ICONS.bookFilled },
      { path: "/artist-date", label: UI_STRINGS["nav.artistDate"], regular: ICONS.heartRegular, filled: ICONS.heartFilled },
      { path: "/ferramentas", label: UI_STRINGS["nav.recursos"], regular: ICONS.toolsRegular, filled: ICONS.toolsFilled },
      { path: "/settings", label: UI_STRINGS["nav.settings"], regular: ICONS.settingsRegular, filled: ICONS.settingsFilled },
    ];
    const html = items
      .map((it) => {
        const isActive = it.path === activePath;
        return `<button class="nav-btn ${isActive ? "active" : ""}" data-nav="${it.path}">
          <span class="icon">${isActive ? it.filled : it.regular}</span>${it.label}
        </button>`;
      })
      .join("");
    if (!nav) {
      nav = document.createElement("div");
      nav.id = "bottomNav";
      nav.className = "bottom-nav";
      document.body.appendChild(nav);
    }
    nav.innerHTML =
      html +
      `<button class="nav-btn nav-sync" id="navSyncBtn" title="${UI_STRINGS["nav.sync"]}">
          <span class="icon">${ICONS.sync}</span>${UI_STRINGS["nav.sync"]}
        </button>` +
      `<div class="nav-version" id="navVersion"></div>`;
    forEachNode(nav.querySelectorAll("[data-nav]"), (btn) => {
      btn.addEventListener("click", () => navigate("#" + btn.dataset.nav));
    });
    const syncBtn = document.getElementById("navSyncBtn");
    if (syncBtn) {
      syncBtn.addEventListener("click", async () => {
        syncBtn.disabled = true;
        const result = await window.ArtistWaySync.syncAll();
        syncBtn.disabled = false;
        toast(result);
      });
    }
    const version = await getDisplayVersion();
    const versionEl = document.getElementById("navVersion");
    if (versionEl) versionEl.textContent = version ? `versão ${version}` : "";
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

  const steps = [
    // 0 — boas vindas
    () => `
      <div class="onboard-screen">
        <div class="quote-banner">"A criatividade recuperada nunca é perdida de novo."</div>
        <h1 class="onboard-title">The Artist's Way<br/>— Companheiro —</h1>
        <p class="onboard-sub">Um espaço para transformar as tarefas do livro em passos claros, um dia de cada vez. Vamos organizar sua jornada de 12 semanas.</p>
        <button class="btn brass block" id="next">Começar</button>
        <div class="dots-progress"><span class="active"></span><span></span><span></span><span></span><span></span></div>
      </div>`,
    // 1 — nome + data de início
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack"><span class="icon">${window.ArtistWayIcons.arrowLeft}</span></button>
        <h2 class="onboard-title">Como posso te chamar?</h2>
        <p class="onboard-sub">E quando você quer começar sua Semana 1 (domingo a sábado)?</p>
        <label>Nome</label>
        <input type="text" id="fname" value="${draft.name}" placeholder="Seu nome" />
        <label>Início da Semana 1</label>
        <input type="date" id="fstart" value="${draft.startDate}" />
        <div class="spacer"></div>
        <button class="btn brass block" id="next">Continuar</button>
        <div class="dots-progress"><span></span><span class="active"></span><span></span><span></span><span></span></div>
      </div>`,
    // 2 — morning pages + artist date
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack"><span class="icon">${window.ArtistWayIcons.arrowLeft}</span></button>
        <h2 class="onboard-title">Seus rituais</h2>
        <p class="onboard-sub">Escolha os horários. Dá pra mudar depois em Ajustes.</p>
        <label>Horário das Morning Pages (todo dia)</label>
        <input type="time" id="fmp" value="${draft.morningPagesTime}" />
        <label>Dia do Artist Date</label>
        <select id="fadday">
          ${[1, 2, 3, 4, 5, 6, 7]
            .map((d) => `<option value="${d}" ${String(d) === draft.artistDateDay ? "selected" : ""}>${WEEKDAY_NAMES[d]}</option>`)
            .join("")}
        </select>
        <label>Horário do Artist Date</label>
        <input type="time" id="fadtime" value="${draft.artistDateTime}" />
        <div class="spacer"></div>
        <button class="btn brass block" id="next">Continuar</button>
        <div class="dots-progress"><span></span><span></span><span class="active"></span><span></span><span></span></div>
      </div>`,
    // 3 — checkin + permissões
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack"><span class="icon">${window.ArtistWayIcons.arrowLeft}</span></button>
        <h2 class="onboard-title">Check-in semanal</h2>
        <p class="onboard-sub">Um momento pra revisar a semana — geralmente no fim de semana.</p>
        <label>Dia do check-in</label>
        <select id="fciday">
          ${[1, 2, 3, 4, 5, 6, 7]
            .map((d) => `<option value="${d}" ${String(d) === draft.checkinDay ? "selected" : ""}>${WEEKDAY_NAMES[d]}</option>`)
            .join("")}
        </select>
        <label>Horário do check-in</label>
        <input type="time" id="fcitime" value="${draft.checkinTime}" />
        <div class="spacer"></div>
        <button class="btn brass block" id="next">Continuar</button>
        <div class="dots-progress"><span></span><span></span><span></span><span class="active"></span><span></span></div>
      </div>`,
    // 4 — contrato inicial assinável
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack"><span class="icon">${window.ArtistWayIcons.arrowLeft}</span></button>
        <h2 class="onboard-title">Seu contrato inicial</h2>
        <p class="onboard-sub">O livro abre com um compromisso de 12 semanas: Morning Pages todo dia, Artist Date semanal, e cuidado consigo mesmo(a) ao longo do processo. Assine com seu nome pra começar.</p>
        <div class="card">
          <p class="muted">Eu, <strong>${draft.name || "___"}</strong>, me comprometo com 12 semanas de recuperação criativa: escrever minhas Morning Pages todos os dias, fazer meu Artist Date toda semana, e ser gentil comigo mesmo(a) no caminho.</p>
        </div>
        <label>Assinatura (seu nome)</label>
        <input type="text" id="fsignature" value="${draft.contractSignedName || draft.name || ""}" placeholder="Seu nome" />
        <div class="spacer"></div>
        <button class="btn moss block" id="finish">Assinar e começar</button>
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
      if (step === 1) {
        draft.name = document.getElementById("fname").value.trim();
        draft.startDate = document.getElementById("fstart").value || draft.startDate;
      }
      if (step === 2) {
        draft.morningPagesTime = document.getElementById("fmp").value || draft.morningPagesTime;
        draft.artistDateDay = document.getElementById("fadday").value;
        draft.artistDateTime = document.getElementById("fadtime").value || draft.artistDateTime;
      }
      if (step === 3) {
        draft.checkinDay = document.getElementById("fciday").value;
        draft.checkinTime = document.getElementById("fcitime").value || draft.checkinTime;
      }
      window.__onboardStep = step + 1;
      render();
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
        toast("Tudo pronto! Bem-vindo(a)");
        navigate("#/home");
      } catch (err) {
        toast("Erro ao concluir: " + err.message);
      }
    });
  }
});

// ================= HOME =================
route("/home", async () => {
  const settings = await DB.getSetting("profile", null);
  if (!settings || !settings.onboarded) {
    navigate("#/onboarding");
    return;
  }
  const weekId = await getCurrentWeekId(settings);
  const week = WEEKS.find((w) => w.id === weekId);
  const weekKey = weekKeyForOffset(settings, weekId);

  // streak morning pages últimos 7 dias
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(dateToStr(addDays(today, -i)));
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

  const greetName = settings.name ? `, ${settings.name}` : "";

  const lastActivityAt = await DB.getSetting("lastActivityAt", null);
  const daysSinceActivity = lastActivityAt
    ? Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (24 * 3600 * 1000))
    : null;
  const showRoadRulesNudge = daysSinceActivity !== null && daysSinceActivity >= 3;

  const dayCount = dayCountSinceStart(settings);
  const dayCountLabel = dayCount !== null ? `Dia ${Math.max(1, dayCount)} de ${PROGRAM_LENGTH_DAYS}` : "";
  const maintenanceMode = !!settings.maintenanceMode || isProgramFinished(settings);

  const morningPagesCard = `
    <div class="card">
      <div class="card-title" style="font-size:1.1rem;">Morning Pages</div>
      <p class="muted">Últimos 7 dias</p>
      <div class="streak-row">
        ${days
          .map((d) => {
            const dt = new Date(d + "T00:00:00");
            const label = "DSTQQSS"[dt.getDay()];
            const isToday = d === todayStr();
            return `<div class="streak-dot ${mpMap[d] ? "done" : ""}" style="${isToday ? "box-shadow:0 0 0 2px var(--brass);" : ""}">${label}</div>`;
          })
          .join("")}
      </div>
      <div class="spacer-sm"></div>
      <button class="btn ${todayDone ? "secondary" : "moss"} block" id="toggleMP">
        ${todayDone ? "✓ Páginas de hoje feitas" : "Marcar páginas de hoje como feitas"}
      </button>
    </div>`;

  const affirmationCard = `
    <div class="card dotted text-center">
      <p class="muted">Afirmação de hoje</p>
      <p style="font-weight:var(--fontWeightSemibold,600);">${AFFIRMATIONS[dayOfYear(new Date()) % AFFIRMATIONS.length]}</p>
    </div>`;

  const artistDateCard = `
    <div class="card">
      <div class="card-title" style="font-size:1.1rem;">Artist Date dessa semana <span class="icon" style="width:18px;height:18px;vertical-align:-3px;display:inline-block;">${window.ArtistWayIcons.heartRegular}</span></div>
      <p class="muted">${artistDate.done ? "Feito — " + (artistDate.idea || "") : "Ainda não rolou essa semana."}</p>
      <a class="btn ${artistDate.done ? "secondary" : "brass"} block" href="#/artist-date">${artistDate.done ? "Ver / trocar" : "Planejar meu Artist Date"}</a>
    </div>`;

  if (maintenanceMode) {
    appEl.innerHTML = `
      <div class="top-bar">
        <div class="logo" style="text-align:right">The Artist's Way<span class="sub">${dayCountLabel || "seu companheiro de jornada"}</span></div>
      </div>

      <div class="card dotted text-center">
        <p class="muted">Modo manutenção</p>
        <p style="font-weight:var(--fontWeightSemibold,600);">As 12 semanas terminaram — agora é só manter Morning Pages e Artist Date no seu ritmo.</p>
      </div>

      ${morningPagesCard}
      ${affirmationCard}
      ${artistDateCard}
    `;
    document.getElementById("toggleMP").addEventListener("click", async () => {
      const done = await DB.toggleMorningPage(todayStr());
      toast(done ? "Páginas de hoje marcadas ✓" : "Desmarcado");
      render();
    });
    return;
  }

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">The Artist's Way<span class="sub">${dayCountLabel || "seu companheiro de jornada"}</span></div>
    </div>

    <div class="card">
      <div class="card-sub">Semana ${weekId} de 12</div>
      <div class="card-title">${week.title}</div>
      <p class="muted">${week.intro}</p>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="progress-label">${doneCount}/${totalItems} tarefas dessa semana concluídas</div>
      <div class="spacer-sm"></div>
      <a class="btn brass block" href="#/week/${weekId}">Ver tarefas da semana</a>
    </div>

    ${morningPagesCard}
    ${affirmationCard}
    ${artistDateCard}

    <div class="card dotted text-center">
      <p class="muted">Prefere revisar a semana agora?</p>
      <a class="btn secondary block" href="#/checkin/${weekId}">Ir para o check-in da Semana ${weekId}</a>
    </div>

    ${
      showRoadRulesNudge
        ? `<div class="card dotted text-center">
      <p class="muted">Faz uns dias que você não passa por aqui.</p>
      <a class="btn secondary block" href="#/regras-da-estrada"><span class="icon">${window.ArtistWayIcons.pin}</span> Já revisou as Regras da Estrada?</a>
    </div>`
        : ""
    }
  `;

  document.getElementById("toggleMP").addEventListener("click", async () => {
    const done = await DB.toggleMorningPage(todayStr());
    toast(done ? "Páginas de hoje marcadas ✓" : "Desmarcado");
    render();
  });
});

// ================= WEEK DETAIL =================
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
        .map(
          (item, idx) => `
        <div class="checklist-item ${doneSet.has(idx) ? "done" : ""}" data-idx="${idx}">
          <div class="box">${doneSet.has(idx) ? `<span class="icon">${window.ArtistWayIcons.checkmarkCircle}</span>` : ""}</div>
          <div class="text">
            ${item.task}
            <div class="item-note">${item.detail}</div>
          </div>
        </div>`
        )
        .join("")}
    </div>
    <a class="btn brass block" href="#/checkin/${week.id}">Fazer o check-in dessa semana</a>
    <div class="spacer"></div>
  `;

  forEachNode(appEl.querySelectorAll(".checklist-item"), (el) => {
    el.addEventListener("click", async () => {
      const idx = Number(el.dataset.idx);
      const done = await DB.toggleChecklistItem(weekId, idx);
      el.classList.toggle("done", done);
    });
  });
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
  renderReferenceScreen("Regras da Estrada", "sempre por perto", ROAD_RULES);
});

route("/principios-basicos", async () => {
  renderReferenceScreen("Princípios Básicos", "a base de tudo", BASIC_PRINCIPLES);
});

route("/tabela-crencas", async () => {
  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">Crença → Positiva<span class="sub">contraponto rápido</span></div>
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
// do Ciúme) -- uma tela genérica reaproveitada pelas 3, espelhando
// NamedListPage.xaml.cs no app do Windows. Círculo de Segurança tem tela
// própria (duas colunas + alternar lado, não um formulário de adicionar).
// TOOL_CONFIGS vem de data.js (fonte única, gerada também em
// Data/content.json pro lado UWP) -- ver ContentStore.Content.ToolConfigs.

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
        <div class="logo" style="text-align:right">Círculo de Segurança<span class="sub">quem apoia, quem exige cautela</span></div>
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

  // Começa com os valores do último snapshot (se existir) -- assim dá
  // pra ajustar em vez de sempre começar do zero.
  const ratings = {};
  LIFE_PIE_CATEGORIES.forEach((c) => {
    ratings[c.key] = previous ? Number(previous[`ratings.${c.key}`] || 5) : 5;
  });

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">Life Pie<span class="sub">seu círculo de vida</span></div>
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
  const weekId = await getCurrentWeekId(settings);
  const weekKey = weekKeyForOffset(settings, weekId);
  const current = (await DB.getArtistDate(weekKey)) || { done: false, idea: "" };

  let usedIdeas = JSON.parse(localStorage.getItem("awUsedIdeas") || "[]");
  // Só o botão "Salvar Date" grava/sincroniza a ideia -- entrar e sair
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
      <div class="top-bar">
        <div class="logo" style="text-align:right">Artist Date<span class="sub">semana ${weekId}</span></div>
      </div>
      <p class="muted text-center">Um encontro solo, só por prazer — sem culpa, sem produtividade.</p>
      ${
        editing
          ? `
        <div class="idea-card">
          <textarea id="ideaText" placeholder="Toque em 'sortear' ou escreva aqui o seu próprio plano...">${draftIdea}</textarea>
        </div>
        <button class="btn secondary block" id="shuffle"><span class="icon">${window.ArtistWayIcons.dice}</span> Sortear outra ideia</button>
        <div class="spacer"></div>
        <button class="btn brass block" id="saveDate">Salvar Date</button>
        <div class="spacer-sm"></div>
        <button class="btn secondary block" id="cancelEdit">Cancelar</button>
      `
          : `
        <div class="card">
          <div class="card-title" style="font-size:1.05rem;">Sua ideia pra essa semana</div>
          <p class="muted">${current.idea ? current.idea : "Nenhuma ideia registrada ainda pra essa semana."}</p>
          <button class="btn ${current.done ? "secondary" : "moss"} block" id="markDone">
            ${current.done ? "✓ Artist Date dessa semana feito" : "Marcar como feito essa semana"}
          </button>
          <div class="spacer-sm"></div>
          <button class="btn secondary block" id="editDate">Editar date</button>
        </div>
      `
      }
      <div class="spacer"></div>
      <div class="card dotted text-center">
        <p class="muted">Quer que apareça no seu Google Calendar toda semana?</p>
        <button class="btn brass block" id="addCal">Adicionar lembrete recorrente</button>
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
        toast("Date salvo");
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
        toast(current.done ? "Aproveite seu Artist Date!" : "Desmarcado");
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
      <div class="logo" style="text-align:right">Check-in<span class="sub">semana ${weekId}</span></div>
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
    <button class="btn moss block" id="save">Salvar check-in</button>
    <div class="spacer"></div>
  `;
  document.getElementById("save").addEventListener("click", async () => {
    const answers = {};
    forEachNode(appEl.querySelectorAll("textarea[data-q]"), (ta) => {
      answers[ta.dataset.q] = ta.value;
    });
    await DB.saveCheckin(weekId, answers);
    toast("Check-in salvo");
    navigate("#/home");
  });
});

// ================= HISTÓRICO (Artist Dates + reler check-ins) =================
// Só leitura -- lê os stores artistDates/checkins já existentes, sem
// escrever nada novo.
route("/artist-date-history", async () => {
  const all = await DB.dbGetAll(DB.STORES.artistDates);
  const items = all
    .filter((a) => a.done || a.idea)
    .sort((a, b) => (b.weekStart || "").localeCompare(a.weekStart || ""));

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">Histórico de Artist Dates<span class="sub">todos os encontros já registrados</span></div>
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
      <div class="logo" style="text-align:right">Reler Check-ins Antigos<span class="sub">toque numa semana com check-in salvo</span></div>
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
  const currentWeekId = await getCurrentWeekId(settings);

  const chips = await Promise.all(
    WEEKS.map(async (w) => {
      const checklist = await DB.getChecklistForWeek(w.id);
      const doneCount = checklist.filter((c) => c.done).length;
      const complete = doneCount === w.checklist.length;
      return { id: w.id, complete, current: w.id === currentWeekId };
    })
  );

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">Sua Jornada<span class="sub">12 semanas</span></div>
    </div>
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

// ================= SETTINGS =================
// Cada seção é uma lista de links; a maioria aponta pra #/list/:key
// (tela genérica, ver TOOL_CONFIGS) -- só as com tela própria (Círculo de
// Segurança, Life Pie, Crença->Positiva, Regras/Princípios, histórico,
// quiz) têm rota dedicada.
function toolLink(key) {
  return `<a class="btn secondary block" href="#/list/${key}">${TOOL_CONFIGS[key].title}</a>`;
}

route("/ferramentas", async () => {
  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">${UI_STRINGS["recursos.title"]}<span class="sub">${UI_STRINGS["recursos.subtitle"]}</span></div>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["recursos.reference.title"]}</div>
      <p class="muted">${UI_STRINGS["recursos.reference.description"]}</p>
      <a class="btn secondary block" href="#/regras-da-estrada"><span class="icon">${window.ArtistWayIcons.pin}</span> Regras da Estrada</a>
      <div class="spacer-sm"></div>
      <a class="btn secondary block" href="#/principios-basicos"><span class="icon">${window.ArtistWayIcons.star}</span> Princípios Básicos</a>
      <div class="spacer-sm"></div>
      <a class="btn secondary block" href="#/tabela-crencas">Crença → Positiva</a>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["recursos.lists.title"]}</div>
      <p class="muted">${UI_STRINGS["recursos.lists.description"]}</p>
      ${toolLink("imaginaryLives")}
      <div class="spacer-sm"></div>
      ${toolLink("thingsILike")}
      <div class="spacer-sm"></div>
      ${toolLink("jealousyMap")}
      <div class="spacer-sm"></div>
      <a class="btn secondary block" href="#/circulo-seguranca">Círculo de Segurança</a>
      <div class="spacer-sm"></div>
      <a class="btn secondary block" href="#/life-pie">Life Pie</a>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["recursos.diaries.title"]}</div>
      <p class="muted">${UI_STRINGS["recursos.diaries.description"]}</p>
      ${toolLink("sincronicidade")}
      <div class="spacer-sm"></div>
      ${toolLink("pocoCriativo")}
      <div class="spacer-sm"></div>
      ${toolLink("diarioResistencia")}
      <div class="spacer-sm"></div>
      ${toolLink("cartaCriticoInterno")}
      <div class="spacer-sm"></div>
      ${toolLink("diarioLeitura")}
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["recursos.letters.title"]}</div>
      <p class="muted">${UI_STRINGS["recursos.letters.description"]}</p>
      ${toolLink("carta80anos")}
      <div class="spacer-sm"></div>
      ${toolLink("carta8anos")}
      <div class="spacer-sm"></div>
      ${toolLink("oracaoArtista")}
      <div class="spacer-sm"></div>
      ${toolLink("cartaEncorajamento")}
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["recursos.planning.title"]}</div>
      <p class="muted">${UI_STRINGS["recursos.planning.description"]}</p>
      ${toolLink("metasNorteVerdadeiro")}
      <div class="spacer-sm"></div>
      ${toolLink("buscaEstilo")}
      <div class="spacer-sm"></div>
      ${toolLink("diaIdeal")}
      <div class="spacer-sm"></div>
      ${toolLink("cadernoDesejos")}
      <div class="spacer-sm"></div>
      ${toolLink("planoContinuidade")}
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["recursos.boundaries.title"]}</div>
      <p class="muted">${UI_STRINGS["recursos.boundaries.description"]}</p>
      ${toolLink("resentimentosMedos")}
      <div class="spacer-sm"></div>
      ${toolLink("retornosEmU")}
      <div class="spacer-sm"></div>
      ${toolLink("arqueologia")}
      <div class="spacer-sm"></div>
      ${toolLink("bottomLine")}
      <div class="spacer-sm"></div>
      ${toolLink("pontosFelicidade")}
      <div class="spacer-sm"></div>
      ${toolLink("totemArtista")}
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["recursos.history.title"]}</div>
      <p class="muted">${UI_STRINGS["recursos.history.description"]}</p>
      <a class="btn secondary block" href="#/artist-date-history">Histórico de Artist Dates</a>
      <div class="spacer-sm"></div>
      <a class="btn secondary block" href="#/checkin-history">Reler Check-ins Antigos</a>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["recursos.quiz.title"]}</div>
      <p class="muted">${UI_STRINGS["recursos.quiz.description"]}</p>
      <a class="btn secondary block" href="#/quiz/workaholismQuiz">${QUIZ_CONFIGS.workaholismQuiz.title}</a>
    </div>

    <div class="spacer"></div>
  `;
});

route("/settings", async () => {
  const settings = (await DB.getSetting("profile", null)) || {};

  const fontSize = settings.fontSize || "medium";

  appEl.innerHTML = `
    <div class="top-bar">
      <div class="logo" style="text-align:right">${UI_STRINGS["settings.title"]}<span class="sub">${UI_STRINGS["settings.subtitle"]}</span></div>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">Tamanho da letra</div>
      <div style="display:flex;gap:8px;">
        <button class="btn ${fontSize === "small" ? "brass" : "secondary"}" style="flex:1;" data-fontsize="small">Pequena</button>
        <button class="btn ${fontSize === "medium" ? "brass" : "secondary"}" style="flex:1;" data-fontsize="medium">Média</button>
        <button class="btn ${fontSize === "large" ? "brass" : "secondary"}" style="flex:1;" data-fontsize="large">Grande</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.appearance.title"]}</div>
      <p class="muted">Accent color e tema — sincronizados entre aparelhos junto com o resto do seu progresso.</p>
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

    <div class="card">
      <label>Nome</label>
      <input type="text" id="fname" value="${settings.name || ""}" />
      <label>Início da Semana 1</label>
      <input type="date" id="fstart" value="${settings.startDate || ""}" />
      <label>Horário das Morning Pages</label>
      <input type="time" id="fmp" value="${settings.morningPagesTime || "07:00"}" />
      <label>Dia do Artist Date</label>
      <select id="fadday">
        ${[1, 2, 3, 4, 5, 6, 7]
          .map((d) => `<option value="${d}" ${String(d) === String(settings.artistDateDay) ? "selected" : ""}>${WEEKDAY_NAMES[d]}</option>`)
          .join("")}
      </select>
      <label>Horário do Artist Date</label>
      <input type="time" id="fadtime" value="${settings.artistDateTime || "16:00"}" />
      <label>Dia do check-in</label>
      <select id="fciday">
        ${[1, 2, 3, 4, 5, 6, 7]
          .map((d) => `<option value="${d}" ${String(d) === String(settings.checkinDay) ? "selected" : ""}>${WEEKDAY_NAMES[d]}</option>`)
          .join("")}
      </select>
      <label>Horário do check-in</label>
      <input type="time" id="fcitime" value="${settings.checkinTime || "19:00"}" />
      <div class="spacer"></div>
      <button class="btn brass block" id="save">Salvar e reativar lembretes</button>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">Google Calendar</div>
      <p class="muted">Um toque adiciona o compromisso recorrente direto no seu calendário.</p>
      <button class="btn secondary block" id="calMP">+ Morning Pages diário</button>
      <div class="spacer-sm"></div>
      <button class="btn secondary block" id="calAD">+ Artist Date semanal</button>
      <div class="spacer-sm"></div>
      <button class="btn secondary block" id="calCI">+ Check-in semanal</button>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.data.title"]}</div>
      <p class="muted">Tudo fica só no seu aparelho. Faça backup de vez em quando.</p>
      <button class="btn secondary block" id="exportData">Exportar backup (.json)</button>
      ${
        isUwpHost()
          ? `<div class="spacer-sm"></div><button class="btn secondary block" id="importDataUwp">Importar backup (.json)</button>`
          : `<div class="spacer-sm"></div><label>Importar backup</label><input type="file" id="importFile" accept=".json" />`
      }
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.sync.title"]}</div>
      <p class="muted">Login com Google sincroniza seu progresso entre aparelhos automaticamente em segundo plano — funciona junto com o app do Windows, no mesmo login.</p>
      <p class="muted" id="syncStatus">Verificando...</p>
      <button class="btn brass block" id="googleLogin">Entrar com Google</button>
      <button class="btn secondary block" id="signOut" style="display:none;">Sair</button>
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
      <button class="btn secondary block" id="clearData">Apagar todos os dados (mantém login)</button>
      <div class="spacer-sm"></div>
      <button class="btn secondary block" id="fullReset">Resetar o app completamente (sai da conta)</button>
    </div>

    <div class="card" id="updatesCard">
      <div class="card-title" style="font-size:1.05rem;">${UI_STRINGS["settings.updates.title"]}</div>
      <p class="muted" id="updatesBody">Verificando...</p>
    </div>

    <div class="spacer"></div>
  `;


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
    toast("Ajustes salvos e lembretes atualizados");
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

  document.getElementById("exportData").addEventListener("click", async () => {
    const data = await DB.exportAllData();
    const json = JSON.stringify(data, null, 2);
    const filename = `artist-way-backup-${todayStr()}.json`;
    if (isUwpHost()) {
      // A WebView UWP legada não dispara o download via Blob + <a download>
      // -- pede pro app nativo salvar o arquivo com um seletor de verdade.
      // O resultado (sucesso/cancelado/erro) volta via callback, nunca fica
      // silencioso.
      window.__onNativeExportResult = (result) => {
        delete window.__onNativeExportResult;
        if (result && result.success) {
          toast("Backup salvo ✓");
        } else if (result && result.canceled) {
          // usuário cancelou o seletor -- não é erro, sem toast.
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

  // Apaga o progresso (aparelho + nuvem, se logado) mas mantém a sessão --
  // útil pra recomeçar o programa do zero sem precisar logar de novo. A
  // conta continua existindo, só fica vazia. Mesmo par de opções do app UWP.
  document.getElementById("clearData").addEventListener("click", async () => {
    const session = await window.ArtistWayAuth.getSession();
    const msg = session
      ? "Isso apaga todo o progresso salvo nesse aparelho e na nuvem (a conta continua logada, só fica vazia). Não tem como desfazer."
      : "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer.";
    if (!(await confirmDialog("Apagar todos os dados?", msg, "Apagar dados"))) return;
    if (session) await window.ArtistWaySync.clearCloudData();
    await DB.resetAllData({ keepSession: true });
    location.reload();
  });

  // Reset completo: apaga o progresso (aparelho + nuvem) E sai da conta.
  document.getElementById("fullReset").addEventListener("click", async () => {
    const session = await window.ArtistWayAuth.getSession();
    const msg = session
      ? "Isso apaga todo o progresso (aparelho e nuvem) e sai da conta logada. Não tem como desfazer."
      : "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer.";
    if (!(await confirmDialog("Resetar o app completamente?", msg, "Resetar tudo"))) return;
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

// ---------- boot ----------
// theme.js é um módulo ES (só ele, por causa dos temas prontos do
// Fluent) -- módulos sempre carregam depois dos scripts clássicos, então
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
