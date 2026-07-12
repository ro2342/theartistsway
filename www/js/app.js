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

async function getCurrentWeekId(settings) {
  if (!settings.startDate) return 1;
  const start = startOfWeek(new Date(settings.startDate + "T00:00:00"));
  const now = startOfWeek(new Date());
  const diffWeeks = Math.round((now - start) / (7 * 24 * 3600 * 1000));
  return Math.min(12, Math.max(1, diffWeeks + 1));
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

function renderBottomNav(activePath) {
  let nav = document.getElementById("bottomNav");
  const settingsPromise = DB.getSetting("profile", null);
  settingsPromise.then((settings) => {
    if (!settings || !settings.onboarded) {
      if (nav) nav.remove();
      return;
    }
    const items = [
      { path: "/home", label: "Início", glyph: "🏡" },
      { path: "/progress", label: "Jornada", glyph: "🗺️" },
      { path: "/artist-date", label: "Date", glyph: "🎨" },
      { path: "/settings", label: "Ajustes", glyph: "🕯️" },
    ];
    const html = items
      .map(
        (it) => `<button class="nav-btn ${it.path === activePath ? "active" : ""}" data-nav="${it.path}">
          <span class="glyph">${it.glyph}</span>${it.label}
        </button>`
      )
      .join("");
    if (!nav) {
      nav = document.createElement("div");
      nav.id = "bottomNav";
      nav.className = "bottom-nav";
      document.body.appendChild(nav);
    }
    nav.innerHTML = html;
    forEachNode(nav.querySelectorAll("[data-nav]"), (btn) => {
      btn.addEventListener("click", () => navigate("#" + btn.dataset.nav));
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
        <div class="dots-progress"><span class="active"></span><span></span><span></span><span></span></div>
      </div>`,
    // 1 — nome + data de início
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack">←</button>
        <h2 class="onboard-title">Como posso te chamar?</h2>
        <p class="onboard-sub">E quando você quer começar sua Semana 1 (domingo a sábado)?</p>
        <label>Nome</label>
        <input type="text" id="fname" value="${draft.name}" placeholder="Seu nome" />
        <label>Início da Semana 1</label>
        <input type="date" id="fstart" value="${draft.startDate}" />
        <div class="spacer"></div>
        <button class="btn brass block" id="next">Continuar</button>
        <div class="dots-progress"><span></span><span class="active"></span><span></span><span></span></div>
      </div>`,
    // 2 — morning pages + artist date
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack">←</button>
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
        <div class="dots-progress"><span></span><span></span><span class="active"></span><span></span></div>
      </div>`,
    // 3 — checkin + permissões
    () => `
      <div class="onboard-screen">
        <button class="icon-btn" id="stepBack">←</button>
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
        <button class="btn moss block" id="finish">Concluir e ativar lembretes</button>
        <div class="dots-progress"><span></span><span></span><span></span><span class="active"></span></div>
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
      window.__onboardStep = step + 1;
      render();
    });
  }
  const finish = document.getElementById("finish");
  if (finish) {
    finish.addEventListener("click", async () => {
      draft.checkinDay = document.getElementById("fciday").value;
      draft.checkinTime = document.getElementById("fcitime").value || draft.checkinTime;
      draft.onboarded = true;
      try {
        await DB.setProfile(draft);
        await NOTIF.applySettings(draft);
        window.__onboardStep = 0;
        window.__onboardDraft = null;
        toast("Tudo pronto! Bem-vindo(a) 🌿");
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

  appEl.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" id="back">←</button>
      <div class="logo" style="text-align:right">The Artist's Way<span class="sub">seu companheiro de jornada</span></div>
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

    <div class="card">
      <div class="card-title" style="font-size:1.1rem;">Morning Pages ✍️</div>
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
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.1rem;">Artist Date dessa semana 🎨</div>
      <p class="muted">${artistDate.done ? "Feito — " + (artistDate.idea || "") : "Ainda não rolou essa semana."}</p>
      <a class="btn ${artistDate.done ? "secondary" : "brass"} block" href="#/artist-date">${artistDate.done ? "Ver / trocar" : "Planejar meu Artist Date"}</a>
    </div>

    <div class="card dotted text-center">
      <p class="muted">Prefere revisar a semana agora?</p>
      <a class="btn secondary block" href="#/checkin/${weekId}">Ir para o check-in da Semana ${weekId}</a>
    </div>

    ${
      showRoadRulesNudge
        ? `<div class="card dotted text-center">
      <p class="muted">Faz uns dias que você não passa por aqui.</p>
      <a class="btn secondary block" href="#/regras-da-estrada">📍 Já revisou as Regras da Estrada?</a>
    </div>`
        : ""
    }
  `;

  document.getElementById("back").addEventListener("click", () => history.back());
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
        <button class="icon-btn" id="back">←</button>
        <div class="logo" style="text-align:right">Semana ${week.id}<span class="sub">o tema em detalhe</span></div>
      </div>
      <h2>${week.title}</h2>
      <div class="card essay-text">
        ${(week.essay || []).map((p) => `<p>${p}</p>`).join("")}
      </div>
      <div class="spacer"></div>
    `;
    document.getElementById("back").addEventListener("click", () => history.back());
    return;
  }

  const checklist = await DB.getChecklistForWeek(weekId);
  const doneSet = new Set(checklist.filter((c) => c.done).map((c) => c.itemIndex));

  appEl.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" id="back">←</button>
      <div class="logo" style="text-align:right">Semana ${week.id}<span class="sub">${WEEKS.length} no total</span></div>
    </div>
    <h2>${week.title}</h2>
    <p class="muted">${week.intro}</p>
    <a class="btn secondary block" href="#/week/${week.id}/essay">📖 Entenda o tema da semana</a>
    <div class="spacer-sm"></div>
    <div class="card">
      ${week.checklist
        .map(
          (item, idx) => `
        <div class="checklist-item ${doneSet.has(idx) ? "done" : ""}" data-idx="${idx}">
          <div class="box"></div>
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

  document.getElementById("back").addEventListener("click", () => history.back());
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
      <button class="icon-btn" id="back">←</button>
      <div class="logo" style="text-align:right">${title}<span class="sub">${sub}</span></div>
    </div>
    <div class="card">
      <ol class="rule-list">
        ${items.map((text) => `<li class="rule-item">${text}</li>`).join("")}
      </ol>
    </div>
    <div class="spacer"></div>
  `;
  document.getElementById("back").addEventListener("click", () => history.back());
}

route("/regras-da-estrada", async () => {
  renderReferenceScreen("Regras da Estrada", "sempre por perto", ROAD_RULES);
});

route("/principios-basicos", async () => {
  renderReferenceScreen("Princípios Básicos", "a base de tudo", BASIC_PRINCIPLES);
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
        <button class="icon-btn" id="back">←</button>
        <div class="logo" style="text-align:right">Artist Date<span class="sub">semana ${weekId}</span></div>
      </div>
      <p class="muted text-center">Um encontro solo, só por prazer — sem culpa, sem produtividade.</p>
      ${
        editing
          ? `
        <div class="idea-card">
          <textarea id="ideaText" placeholder="Toque em 'sortear' ou escreva aqui o seu próprio plano...">${draftIdea}</textarea>
        </div>
        <button class="btn secondary block" id="shuffle">🎲 Sortear outra ideia</button>
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
    document.getElementById("back").addEventListener("click", () => history.back());

    if (editing) {
      document.getElementById("ideaText").addEventListener("input", (e) => {
        draftIdea = e.target.value;
      });
      document.getElementById("shuffle").addEventListener("click", pickIdea);
      document.getElementById("saveDate").addEventListener("click", async () => {
        current.idea = draftIdea;
        await DB.setArtistDate(weekKey, current);
        editing = false;
        toast("Date salvo 🎨");
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
        toast(current.done ? "Aproveite seu Artist Date! 🎨" : "Desmarcado");
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
      <button class="icon-btn" id="back">←</button>
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
  document.getElementById("back").addEventListener("click", () => history.back());
  document.getElementById("save").addEventListener("click", async () => {
    const answers = {};
    forEachNode(appEl.querySelectorAll("textarea[data-q]"), (ta) => {
      answers[ta.dataset.q] = ta.value;
    });
    await DB.saveCheckin(weekId, answers);
    toast("Check-in salvo 📓");
    navigate("#/home");
  });
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
      <button class="icon-btn" id="back">←</button>
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
  document.getElementById("back").addEventListener("click", () => history.back());
  forEachNode(appEl.querySelectorAll(".week-chip"), (el) => {
    el.addEventListener("click", () => navigate("#/week/" + el.dataset.week));
  });
});

// ================= SETTINGS =================
route("/settings", async () => {
  const settings = (await DB.getSetting("profile", null)) || {};

  const fontSize = settings.fontSize || "medium";

  appEl.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" id="back">←</button>
      <div class="logo" style="text-align:right">Ajustes<span class="sub">seus rituais</span></div>
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
      <div class="card-title" style="font-size:1.05rem;">Seus dados</div>
      <p class="muted">Tudo fica só no seu aparelho. Faça backup de vez em quando.</p>
      <button class="btn secondary block" id="exportData">Exportar backup (.json)</button>
      ${
        isUwpHost()
          ? `<div class="spacer-sm"></div><button class="btn secondary block" id="importDataUwp">Importar backup (.json)</button>`
          : `<div class="spacer-sm"></div><label>Importar backup</label><input type="file" id="importFile" accept=".json" />`
      }
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">Sincronização</div>
      <p class="muted">Login com Google sincroniza seu progresso entre aparelhos automaticamente em segundo plano -- funciona junto com o app do Windows, no mesmo login.</p>
      <p class="muted" id="syncStatus">Verificando...</p>
      <button class="btn brass block" id="googleLogin">Entrar com Google</button>
      <button class="btn secondary block" id="signOut" style="display:none;">Sair</button>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">Zona de risco</div>
      <p class="muted">Apaga o progresso salvo (perfil, Morning Pages, Artist Dates, checklist, check-ins). Não tem como desfazer -- faça um backup antes se quiser guardar alguma coisa.</p>
      <button class="btn secondary block" id="clearData">Apagar todos os dados (mantém login)</button>
      <div class="spacer-sm"></div>
      <button class="btn secondary block" id="fullReset">Resetar o app completamente (sai da conta)</button>
    </div>

    <div class="card">
      <div class="card-title" style="font-size:1.05rem;">Referência</div>
      <p class="muted">Sempre à mão, pra reler quando bater a dúvida.</p>
      <a class="btn secondary block" href="#/regras-da-estrada">📍 Regras da Estrada</a>
      <div class="spacer-sm"></div>
      <a class="btn secondary block" href="#/principios-basicos">✳️ Princípios Básicos</a>
    </div>

    <div class="card" id="updatesCard">
      <div class="card-title" style="font-size:1.05rem;">Atualizações</div>
      <p class="muted" id="updatesBody">Verificando...</p>
    </div>

    <div class="spacer"></div>
  `;

  document.getElementById("back").addEventListener("click", () => history.back());

  forEachNode(appEl.querySelectorAll("[data-fontsize]"), (btn) => {
    btn.addEventListener("click", async () => {
      const updated = Object.assign({}, settings, { fontSize: btn.dataset.fontsize });
      await DB.setProfile(updated);
      applyFontSizePreference(updated.fontSize);
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
    toast("Ajustes salvos e lembretes atualizados 🔔");
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

  // Apaga o progresso (aparelho + nuvem, se logado) mas mantém a sessão --
  // útil pra recomeçar o programa do zero sem precisar logar de novo. A
  // conta continua existindo, só fica vazia. Mesmo par de opções do app UWP.
  document.getElementById("clearData").addEventListener("click", async () => {
    const session = await window.ArtistWayAuth.getSession();
    const msg = session
      ? "Isso apaga todo o progresso salvo nesse aparelho e na nuvem (a conta continua logada, só fica vazia). Não tem como desfazer. Tem certeza?"
      : "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer. Tem certeza?";
    if (!confirm(msg)) return;
    if (session) await window.ArtistWaySync.clearCloudData();
    await DB.resetAllData({ keepSession: true });
    location.reload();
  });

  // Reset completo: apaga o progresso (aparelho + nuvem) E sai da conta.
  document.getElementById("fullReset").addEventListener("click", async () => {
    const session = await window.ArtistWayAuth.getSession();
    const msg = session
      ? "Isso apaga todo o progresso (aparelho e nuvem) e sai da conta logada. Não tem como desfazer. Tem certeza?"
      : "Isso apaga todo o progresso salvo nesse aparelho e não tem como desfazer. Tem certeza?";
    if (!confirm(msg)) return;
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
      updatesBodyEl.textContent = "Você está usando a versão web — ela se atualiza sozinha, sem precisar checar nada aqui.";
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
(async function boot() {
  const settings = await DB.getSetting("profile", null);
  applyFontSizePreference(settings && settings.fontSize);

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (e) {
      console.warn("SW falhou", e);
    }
  }
  render();
})();
