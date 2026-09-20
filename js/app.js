/* Роутинг между экранами и сборка страниц. */

(function () {
  "use strict";

  const tr = window.I18N.t;

  const D = window.QUESTION_DATA;
  const S = window.Storage;
  const esc = window.QuizEngine.esc;
  const shuffle = window.QuizEngine.shuffle;
  const view = document.getElementById("view");

  const { shapeWrapper: SW, icon: SI } = window.SIGN_ICONS;
  const ICONS = {
    signs: SW("triangle-warning", `<text x="50" y="76" text-anchor="middle" font-family="Arial" font-weight="800" font-size="44" fill="#1a1a1a">!</text>`),
    situational: SW("circle-blue", SI.roundabout()),
    rules: SW("circle-red", `<text x="50" y="66" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="46" fill="#1a1a1a">§</text>`),
    vocab: SW("diamond-yellow", `<text x="50" y="60" text-anchor="middle" font-family="Arial" font-weight="800" font-size="26" fill="#1a1a1a">Aa</text>`),
    daily: SW("square-blue", `<text x="50" y="64" text-anchor="middle" font-family="Arial" font-weight="800" font-size="40" fill="#fff">1</text>`),
    exam: SW("octagon-red", `<text x="50" y="62" text-anchor="middle" font-family="Arial" font-weight="800" font-size="30" fill="#fff">45</text>`),
    circle: SW("circle-blue", `<circle cx="36" cy="40" r="9" fill="#fff"/><circle cx="64" cy="40" r="9" fill="#fff"/><path d="M18 76c0-12 8-20 18-20s18 8 18 20M46 76c0-12 8-20 18-20s18 8 18 20" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>`)
  };

  const TOPICS = {
    signs: { title: "Skilt og oppmerking", get title_ru() { return tr("Знаки и разметка"); }, icon: ICONS.signs, get desc() { return tr("Все знаки Норвегии: значение, поиск по названию, тип знака, разметка."); } },
    situational: { title: "Trafikksituasjoner", get title_ru() { return tr("Ситуационные задачи"); }, icon: ICONS.situational, get desc() { return tr("Кто кому уступает: перекрёстки, круг, повороты, автомагистраль."); } },
    rules: { title: "Regler og sanksjoner", get title_ru() { return tr("Правила и штрафы"); }, icon: ICONS.rules, get desc() { return tr("Скорость, алкоголь, ремни, баллы, парковка, ставки 2026."); } }
  };

  /* ---------- Роутинг с адресом в URL (#/topic?key=signs): работают «назад» и обновление страницы ---------- */
  const routes = {};
  function hashFor(name, params) {
    const q = new URLSearchParams();
    Object.keys(params || {}).forEach(k => { if (params[k] != null && params[k] !== "") q.set(k, params[k]); });
    const qs = q.toString();
    return "#/" + name + (qs ? "?" + qs : "");
  }
  function parseHash() {
    const m = (location.hash || "").match(/^#\/([a-z]+)(?:\?(.*))?$/);
    if (!m || !routes[m[1]]) return { name: "home", params: {} };
    const params = {};
    new URLSearchParams(m[2] || "").forEach((v, k) => { params[k] = v; });
    return { name: m[1], params };
  }
  /* Экран, который нельзя покинуть без подтверждения (экзамен) */
  window.ROUTE_GUARD = null;
  function render(name, params) {
    window.CURRENT_ROUTE = name;
    window.CURRENT_PARAMS = params || {};
    window.ROUTE_GUARD = null;
    document.onkeydown = null;
    routes[name](params || {});
    window.scrollTo({ top: 0 });
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.route === name));
  }
  function go(name, params, opts) {
    opts = opts || {};
    if (!opts.force && window.ROUTE_GUARD && !window.ROUTE_GUARD()) return;
    const hash = hashFor(name, params);
    if (location.hash !== hash) {
      if (opts.replace) history.replaceState(null, "", hash); else history.pushState(null, "", hash);
    }
    render(name, params);
  }
  window.addEventListener("popstate", () => {
    const target = parseHash();
    if (window.ROUTE_GUARD && !window.ROUTE_GUARD()) {
      /* отказ покидать экзамен: вернуть адрес назад */
      history.pushState(null, "", hashFor(window.CURRENT_ROUTE, window.CURRENT_PARAMS));
      return;
    }
    render(target.name, target.params);
  });
  window.go = go;
  window.ROUTES = routes;
  window.AppUI = { TOPICS, ICONS, statLine: (...a) => statLine(...a), esc };

  /* ---------- Профили ---------- */
  const C = window.Cloud;

  function renderProfileSwitch() {
    const el = document.getElementById("profile-switch");
    if (!el) return;
    if (C.enabled && !C.isLoggedIn()) {
      el.innerHTML = `<button class="profile-btn profile-login" onclick="go('login')">${tr("Войти")}</button>`;
      return;
    }
    const cur = S.getCurrentProfile();
    el.innerHTML = `<button class="profile-btn" title="${tr("Профиль")}"><span class="profile-dot"></span>${esc(cur)}</button>`;
    el.querySelector(".profile-btn").onclick = openProfileMenu;
    renderSyncStatus();
  }
  window.renderProfileSwitch = renderProfileSwitch;

  /* Точка у имени показывает состояние облака: сохранено / сохраняю / нет сети / ошибка */
  const SYNC_TITLE = () => ({ local: tr("Локальный профиль"), synced: tr("Прогресс сохранён в облаке"), saving: tr("Сохраняю…"), offline: tr("Нет сети: сохраню, когда появится"), error: tr("Ошибка сохранения") });
  function renderSyncStatus() {
    const dot = document.querySelector("#profile-switch .profile-dot");
    if (!dot) return;
    const st = C.status;
    dot.className = "profile-dot is-" + st;
    dot.parentElement.title = SYNC_TITLE()[st] + (C.statusMsg ? ": " + C.statusMsg : "");
    const line = document.querySelector(".profile-menu .sync-line");
    if (line) line.innerHTML = syncLineHtml();
  }
  window.renderSyncStatus = renderSyncStatus;
  function syncLineHtml() {
    const st = C.status;
    const retry = (st === "error" || st === "offline") ? ` <button class="btn btn-small" onclick="Cloud.pushNow()">${tr("Повторить")}</button>` : "";
    return `<span class="profile-dot is-${st}"></span> ${esc(SYNC_TITLE()[st])}${retry}`;
  }

  /* Перерисовать текущий «спокойный» экран после прихода данных из облака (никогда — во время теста) */
  window.refreshView = () => {
    if (["home", "stats", "mistakes", "topic"].includes(window.CURRENT_ROUTE)) go(window.CURRENT_ROUTE, window.CURRENT_PARAMS);
  };

  function openProfileMenu() {
    const existing = document.querySelector(".profile-menu");
    if (existing) { existing.remove(); return; }
    const menu = document.createElement("div");
    menu.className = "profile-menu";
    const cur = S.getCurrentProfile();
    if (C.isLoggedIn()) {
      menu.innerHTML = `
        <div class="profile-menu-title">${tr("Ты вошёл как")}</div>
        <button class="profile-item active">${esc(cur)}</button>
        <div class="sync-line">${syncLineHtml()}</div>
        <button class="profile-item profile-add" data-act="logout">${tr("Выйти")}</button>`;
      document.getElementById("profile-switch").appendChild(menu);
      menu.querySelector("[data-act=logout]").onclick = async () => { menu.remove(); await C.logout(); renderProfileSwitch(); go("home"); };
    } else {
      menu.innerHTML = `
        <div class="profile-menu-title">${tr("Кто занимается?")}</div>
        ${S.getProfiles().map(p => `
          <button class="profile-item ${p === cur ? "active" : ""}" data-name="${esc(p)}">${esc(p)}</button>`).join("")}
        <button class="profile-item profile-add">${tr("Добавить человека")}</button>`;
      document.getElementById("profile-switch").appendChild(menu);
      menu.querySelectorAll(".profile-item[data-name]").forEach(b => {
        b.onclick = () => { S.switchProfile(b.dataset.name); menu.remove(); renderProfileSwitch(); go("home"); };
      });
      menu.querySelector(".profile-add").onclick = () => {
        const name = prompt("Имя (как будет отображаться):");
        if (name && S.addProfile(name)) { renderProfileSwitch(); go("home"); }
        menu.remove();
      };
    }
    setTimeout(() => {
      document.addEventListener("click", function close(e) {
        if (!menu.contains(e.target) && !e.target.closest(".profile-btn")) { menu.remove(); document.removeEventListener("click", close); }
      });
    }, 0);
  }

  /* ---------- Задание дня ---------- */
  const todayKey = () => S.todayKey();
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function seededRng(seed) {
    let t = seed;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededPick(arr, n, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n);
  }
  function dailySet(key) {
    const rnd = seededRng(hashStr("forerkort-" + key));
    const k = D.signsByKind;
    return [].concat(
      seededPick(k.meaning, 7, rnd),
      seededPick(k.pick, 3, rnd),
      seededPick(k.category, 2, rnd),
      seededPick(D.situational, 4, rnd),
      seededPick(D.rules, 4, rnd)
    );
  }

  function dailyCard() {
    const key = todayKey();
    const profiles = S.getProfiles();
    const cur = S.getCurrentProfile();
    const mine = S.getDaily(key);
    const streak = S.getStreak();
    const rows = profiles.map(p => {
      const r = S.getDaily(key, p);
      const pct = r ? Math.round((r.correct / r.total) * 100) : null;
      return `<div class="daily-row ${p === cur ? "me" : ""}">
        <span class="daily-name">${esc(p)}</span>
        ${r ? `<span class="pill ${pct >= 85 ? "good" : pct >= 70 ? "mid" : "bad"}">${pct}%</span><span class="muted">${r.correct} ${tr("из")} ${r.total}</span>` : `<span class="muted">${tr("ещё не проходил(а)")}</span>`}
      </div>`;
    }).join("");
    return `
      <div class="card daily-card">
        <div class="daily-head">
          <div class="topic-icon">${ICONS.daily}</div>
          <div>
            <h3>Dagens økt</h3>
            <p class="topic-sub">${tr("Задание дня,")} ${key.split("-").reverse().join(".")}</p>
          </div>
        </div>
        <p class="topic-desc">20 ${tr("вопросов, одинаковые для всех в этот день. Сравните результаты.")}</p>
        <div class="daily-rows">${rows}</div>
        <div class="daily-foot">
          <button class="btn ${mine ? "" : "btn-cta"}" onclick="go('daily')">${mine ? tr("Пройти ещё раз") : tr("Начать задание дня")}</button>
          ${streak > 1 ? `<span class="streak">${streak} ${tr("дней подряд")}</span>` : ""}
        </div>
      </div>`;
  }

  /* ---------- Вход и регистрация ---------- */
  routes.login = function (p) {
    let tab = p.tab || "login";
    function render(error) {
      view.innerHTML = `
        <div class="quiz">
          <h1>${tab === "login" ? tr("Вход") : tr("Регистрация")}</h1>
          <p class="lead">${tr("Прогресс хранится на сервере: войди с любого телефона, и всё будет на месте. Результаты видны друзьям из круга.")}</p>
          <div class="tabs">
            <button class="tab ${tab === "login" ? "active" : ""}" data-tab="login">${tr("Войти")}</button>
            <button class="tab ${tab === "register" ? "active" : ""}" data-tab="register">${tr("Регистрация")}</button>
          </div>
          <form class="card" id="auth-form" autocomplete="off">
            <label class="field"><span>${tr("Имя (как тебя увидят друзья)")}</span><input type="text" id="auth-name" maxlength="24" required autocomplete="username"></label>
            <label class="field"><span>PIN (4–6 ${tr("цифр)")}</span><input type="password" id="auth-pin" inputmode="numeric" pattern="\\d{4,6}" maxlength="6" required autocomplete="current-password"></label>
            ${tab === "register" ? `<label class="field"><span>${tr("Код приглашения")}</span><input type="text" id="auth-invite" required autocomplete="off" placeholder="${tr("спроси у того, кто дал ссылку")}"></label>` : ""}
            ${error ? `<p class="form-error">${esc(error)}</p>` : ""}
            <div class="row">
              <button class="btn btn-primary" type="submit">${tab === "login" ? tr("Войти") : tr("Создать аккаунт")}</button>
              <button class="btn btn-ghost" type="button" onclick="go('home')">${tr("Без входа")}</button>
            </div>
            ${tab === "register" ? `<p class="muted small">${tr("Прогресс, который уже есть в этом браузере, перенесётся в новый аккаунт.")}</p>` : ""}
          </form>
        </div>`;
      view.querySelectorAll(".tab").forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
      const pinInput = document.getElementById("auth-pin");
      pinInput.oninput = () => { pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 6); };
      pinInput.onkeydown = e => { if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); };
      const form = document.getElementById("auth-form");
      form.onsubmit = async e => {
        e.preventDefault();
        const btn = form.querySelector("[type=submit]");
        btn.disabled = true; btn.textContent = tr("Секунду…");
        try {
          const name = document.getElementById("auth-name").value.trim();
          const pin = document.getElementById("auth-pin").value.trim();
          if (tab === "login") await C.login(name, pin);
          else await C.register(name, pin, document.getElementById("auth-invite").value.trim());
          renderProfileSwitch();
          go("home");
        } catch (err) { render(err.message); }
      };
    }
    render();
  };

  /* ---------- Круг друзей ---------- */
  function circleCard() {
    if (!C.isLoggedIn()) {
      return `
        <div class="card daily-card circle-card">
          <div class="daily-head">
            <div class="topic-icon">${ICONS.circle}</div>
            <div><h3>Vennekretsen</h3><p class="topic-sub">${tr("Круг друзей")}</p></div>
          </div>
          <p class="topic-desc">${tr("Войди, чтобы прогресс сохранялся на сервере и было видно, кто как занимается.")}</p>
          <div class="daily-foot"><button class="btn btn-primary" onclick="go('login')">${tr("Войти или зарегистрироваться")}</button></div>
        </div>`;
    }
    setTimeout(loadCircle, 0);
    return `
      <div class="card daily-card circle-card" id="circle-card">
        <div class="daily-head">
          <div class="topic-icon">${ICONS.circle}</div>
          <div><h3>Vennekretsen</h3><p class="topic-sub">${tr("Круг друзей")}</p></div>
        </div>
        <div class="daily-rows" id="circle-rows"><div class="busy"><span class="spinner"></span> ${tr("загружаю…")}</div></div>
      </div>`;
  }

  async function loadCircle() {
    const el = document.getElementById("circle-rows");
    if (!el) return;
    try {
      const data = await C.circle();
      const key = todayKey();
      el.innerHTML = `
        <div class="circle-table">
          <div class="circle-row circle-head"><span>${tr("Имя")}</span><span>${tr("Сегодня")}</span><span>${tr("Верно")}</span><span>${tr("Экзамены")}</span><span>${tr("Дней")}</span></div>
          ${data.rows.map(r => {
            const t = r.today ? `${Math.round((r.today.correct / r.today.total) * 100)}%` : "—";
            const ex = r.exams ? `${r.examsPassed}/${r.exams}` : "—";
            return `<div class="circle-row ${r.name === data.me ? "me" : ""}">
              <span class="circle-name">${esc(r.name)}${r.name === data.owner ? ' <span class="crown" title="${tr("владелец")}">★</span>' : ""}</span>
              <span class="${r.today ? (t.replace("%", "") >= 85 ? "good-text" : "") : "muted"}">${t}</span>
              <span>${r.accuracy != null ? r.accuracy + "%" : "—"}</span>
              <span>${ex}</span>
              <span>${r.streak ? r.streak + " подряд" : r.dailyCount || "—"}</span>
            </div>`;
          }).join("")}
        </div>
        <p class="muted small">${tr("Сегодня — результат задания дня")} ${key.split("-").reverse().join(".")}. ${tr("Верно — доля верных ответов за всё время. Экзамены — сдано из попыток.")}</p>`;
    } catch (e) {
      el.innerHTML = `<p class="muted">${tr("Не удалось загрузить круг:")} ${esc(e.message)}</p>`;
    }
  }

  /* ---------- Экзамен: 45 вопросов, 90 минут, максимум 7 ошибок ---------- */
  function examSet() {
    const k = D.signsByKind;
    return [].concat(
      shuffle(k.meaning).slice(0, 15),
      shuffle(k.pick).slice(0, 5),
      shuffle(k.category).slice(0, 3),
      shuffle(D.situational).slice(0, 12),
      shuffle(D.rules).slice(0, 10)
    );
  }

  function examCard() {
    const rows = S.getProfiles().map(p => {
      const ex = S.getExams(p);
      const last = ex[ex.length - 1];
      const passed = ex.filter(e => e.passed).length;
      return `<div class="daily-row ${p === S.getCurrentProfile() ? "me" : ""}">
        <span class="daily-name">${esc(p)}</span>
        ${last
          ? `<span class="pill ${last.passed ? "good" : "bad"}">${last.passed ? "bestått" : "ikke bestått"}</span><span class="muted">${last.correct}/${last.total}, ${tr("сдано")} ${passed} ${tr("из")} ${ex.length}</span>`
          : `<span class="muted">${tr("ещё не сдавал(а)")}</span>`}
      </div>`;
    }).join("");
    return `
      <div class="card daily-card exam-card">
        <div class="daily-head">
          <div class="topic-icon">${ICONS.exam}</div>
          <div>
            <h3>Teoriprøve</h3>
            <p class="topic-sub">${tr("Пробный экзамен")}</p>
          </div>
        </div>
        <p class="topic-desc">45 ${tr("вопросов, 90 минут, без подсказок по ходу. Сдано, если ошибок не больше 7. Как на настоящем экзамене.")}</p>
        <div class="daily-rows">${rows}</div>
        <div class="daily-foot"><button class="btn btn-cta" onclick="go('exam')">${tr("Начать экзамен")}</button></div>
      </div>`;
  }

  routes.exam = function () {
    view.innerHTML = "";
    window.QuizEngine.start(view, examSet(), {
      title: "Teoriprøve",
      exitLabel: tr("Прервать"),
      exam: true,
      timeLimit: 90 * 60,
      maxWrong: 7,
      onExit: () => { window.ROUTE_GUARD = null; go("home"); },
      onRestart: () => { window.ROUTE_GUARD = null; go("exam", {}, { force: true }); },
      onFinish: res => { window.ROUTE_GUARD = null; S.recordExam(res); }
    });
    window.ROUTE_GUARD = () => confirm(tr("Прервать экзамен? Результат не сохранится."));
  };

  routes.daily = function () {
    const key = todayKey();
    const already = S.getDaily(key);
    view.innerHTML = "";
    window.QuizEngine.start(view, dailySet(key), {
      title: tr("Задание дня"),
      exitLabel: tr("Главная"),
      keepOrder: true,
      noRestart: true,
      onExit: () => go("home"),
      onFinish: res => { if (!already) S.recordDaily(key, res); }
    });
  };

  /* ---------- Главная ---------- */
  routes.home = function () {
    const last = S.getLastTopic();
    const cards = Object.keys(TOPICS).map(key => {
      const t = TOPICS[key];
      const st = S.getTopicStats(key, D[key]);
      return topicCard(key, t, st);
    }).join("");
    const vs = S.getVocabStats(D.vocabulary);
    const totalWeak = Object.keys(TOPICS).reduce((n, k) => n + S.getWeakQuestions(D[k]).length, 0);
    const dueTotal = Object.keys(TOPICS).reduce((n, k) => n + S.getDueCount(D[k]), 0);

    const allStats = Object.keys(TOPICS).map(k => S.getTopicStats(k, D[k]));
    const answered = allStats.reduce((n, s) => n + s.correct + s.wrong, 0);
    const correct = allStats.reduce((n, s) => n + s.correct, 0);
    const totalQ = allStats.reduce((n, s) => n + s.total, 0);
    const seen = allStats.reduce((n, s) => n + s.seen, 0);

    view.innerHTML = `
      <section class="hero">
        <div>
          <h1>${tr("Теория на права")} <span class="nowrap">${tr("по-норвежски")}</span></h1>
          <p class="lead">${tr("Вопросы как на экзамене, на норвежском. Перевод открывается по кнопке, чтобы сначала попробовать понять самому. Каждая ошибка разбирается и возвращается на повторение.")}</p>
          ${dueTotal ? `<p class="due-line"><span class="pill mid">${tr("К повторению сегодня:")} ${dueTotal}</span> <a href="#" onclick="go('mistakes');return false;">${tr("открыть")}</a></p>` : ""}
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="go('daily')">${tr("Задание дня")}</button>
            ${last && TOPICS[last] ? `<button class="btn" onclick="go('topic',{key:'${last}'})">${tr("Продолжить:")} ${TOPICS[last].title_ru}</button>` : ""}
            ${totalWeak ? `<button class="btn" onclick="go('mistakes')">${tr("Повторить ошибки (")}${totalWeak})</button>` : ""}
          </div>
          ${answered ? `
          <div class="hero-stats">
            <div class="hero-stat"><b>${Math.round((correct / answered) * 100)}%</b><span>${tr("верных ответов")}</span></div>
            <div class="hero-stat"><b>${seen}/${totalQ}</b><span>${tr("вопросов пройдено")}</span></div>
            <div class="hero-stat"><b>${vs.seen}/${vs.total}</b><span>${tr("слов из лексики")}</span></div>
          </div>
          <p class="hero-link"><a href="#" onclick="go('stats');return false;">${tr("Подробная статистика →")}</a></p>` : ""}
        </div>
      </section>

      ${circleCard()}
      ${window.PWA ? PWA.installCardHtml() : ""}
      <div class="grid grid-2">
        ${dailyCard()}
        ${examCard()}
      </div>

      <h2 class="section-title">${tr("Темы")}</h2>
      <div class="grid">
        ${cards}
        <div class="card topic-card">
          <div class="topic-icon">${ICONS.vocab}</div>
          <div class="topic-body">
            <h3>Ordforråd</h3>
            <p class="topic-sub">${tr("Лексика")}</p>
            <p class="topic-desc">${tr("Слова и фразы, без которых не понять вопросы на экзамене.")}</p>
            ${statLine(vs.accuracy, vs.coverage, vs.seen, vs.total, tr("слов"))}
          </div>
          <div class="topic-actions">
            <button class="btn btn-primary" onclick="go('vocab')">${tr("Открыть карточки")}</button>
          </div>
        </div>
      </div>

      <details class="card offline-card">
        <summary>${tr("Работа без интернета")}</summary>
        <p class="muted small">${tr("Сайт открывается офлайн после первого посещения. Чтобы и картинки знаков с озвучкой были доступны без сети, загрузи их заранее (знаки ≈ 3 МБ, озвучка ≈ 2 МБ).")}</p>
        <div class="row">
          <button class="btn btn-small" onclick="PWA.runDownload('signs', this)">${tr("Скачать знаки")}</button>
          <button class="btn btn-small" onclick="PWA.runDownload('audio', this)">${tr("Скачать озвучку")}</button>
          <span class="muted small" id="offline-status"></span>
        </div>
      </details>
`;
    if (window.PWA) PWA.offlineStatus().then(s => { const el = document.getElementById("offline-status"); if (el) el.textContent = `${tr("Сохранено: знаков")} ${s.signs}, ${tr("файлов озвучки")} ${s.audio}`; }).catch(() => {});
  };

  function topicCard(key, t, st) {
    return `
      <div class="card topic-card">
        <div class="topic-icon">${t.icon}</div>
        <div class="topic-body">
          <h3>${esc(t.title)}</h3>
          <p class="topic-sub">${esc(t.title_ru)}</p>
          <p class="topic-desc">${esc(t.desc)}</p>
          ${statLine(st.accuracy, st.coverage, st.seen, st.total, tr("заданий"))}
          ${st.weak ? `<p class="weak-line">${tr("Ошибок:")} ${st.weak}. <a href="#" onclick="go('quiz',{key:'${key}',mode:'weak'});return false;">${tr("Тренировать")}</a></p>` : ""}
        </div>
        <div class="topic-actions">
          <button class="btn btn-primary" onclick="go('topic',{key:'${key}'})">${tr("Открыть")}</button>
        </div>
      </div>`;
  }

  function statLine(acc, cov, seen, total, unit) {
    if (!seen) return `<p class="stat-line">${total} ${unit}, ${tr("ещё не начато")}</p>`;
    return `
      <div class="stat-line">
        <span class="pill ${acc >= 85 ? "good" : acc >= 70 ? "mid" : "bad"}">${acc}% ${tr("верно")}</span>
        <span>${tr("пройдено")} ${seen} ${tr("из")} ${total}</span>
      </div>`;
  }

  /* ---------- Экран темы ---------- */
  function modeCard(title, desc, key, mode, primary, disabled) {
    return `
      <div class="card mode-card">
        <h3>${esc(title)}</h3>
        <p class="muted">${esc(desc)}</p>
        <button class="btn ${primary ? "btn-primary" : ""}" ${disabled ? "disabled" : ""} onclick="go('quiz',{key:'${key}',mode:'${mode}'})">${tr("Начать")}</button>
      </div>`;
  }

  routes.topic = function (p) {
    const t = TOPICS[p.key];
    const all = D[p.key];
    const st = S.getTopicStats(p.key, all);
    const weak = S.getWeakQuestions(all);
    let modes;
    if (p.key === "signs") {
      const k = D.signsByKind;
      modes = [
        modeCard(tr("Быстрая тренировка"), "10 " + tr("случайных заданий всех типов."), p.key, "quick", true),
        modeCard(tr("Новые знаки"), "10 " + tr("знаков, которые ты ещё не видел или давно не повторял."), p.key, "new"),
        modeCard(tr("Что означает знак"), `${tr("Картинка, четыре названия.")} ${k.meaning.length} ${tr("знаков.")}`, p.key, "meaning"),
        modeCard(tr("Найди знак"), `${tr("Название, четыре картинки.")} ${k.pick.length} ${tr("знаков.")}`, p.key, "pick"),
        modeCard(tr("Тип знака"), `${tr("Предупреждающий, запрещающий, предписывающий…")} ${k.category.length} ${tr("заданий.")}`, p.key, "category"),
        modeCard(tr("Разметка"), `${tr("Линии и стрелки на асфальте.")} ${k.marking.length} ${tr("вопросов.")}`, p.key, "marking"),
        modeCard(tr("Только мои ошибки"), weak.length ? `${weak.length} ${tr("заданий, где ты ошибался.")}` : tr("Пока нет ошибок в этой теме."), p.key, "weak", false, !weak.length)
      ];
    } else {
      modes = [
        modeCard(tr("Быстрая тренировка"), "10 " + tr("случайных вопросов. Хорошо для ежедневной практики."), p.key, "quick", true),
        modeCard(tr("Новые вопросы"), "10 " + tr("вопросов, которые ты ещё не видел или давно не повторял."), p.key, "new"),
        modeCard(tr("Вся тема"), `${tr("Все")} ${all.length} ${tr("вопросов в случайном порядке.")}`, p.key, "all"),
        modeCard(tr("Только мои ошибки"), weak.length ? `${weak.length} ${tr("вопросов, где ты ошибался.")}` : tr("Пока нет ошибок в этой теме."), p.key, "weak", false, !weak.length)
      ];
    }
    view.innerHTML = `
      <button class="btn btn-ghost" onclick="go('home')">${tr("Главная")}</button>
      <section class="topic-hero">
        <div class="topic-icon big">${t.icon}</div>
        <div>
          <h1>${esc(t.title)}</h1>
          <p class="lead muted">${esc(t.title_ru)}</p>
          ${statLine(st.accuracy, st.coverage, st.seen, st.total, tr("заданий"))}
        </div>
      </section>
      <div class="grid modes">${modes.join("")}</div>`;
  };

  /* ---------- Квиз ---------- */
  routes.quiz = function (p) {
    const t = TOPICS[p.key];
    const all = D[p.key];
    const k = D.signsByKind;
    let set, label = t.title_ru;
    /* p.cat — категория знака (fare, forbud, …): тренировать только её */
    const CATS = (window.SIGN_CATALOG || {}).CATS || {};
    const byCat = list => p.cat ? list.filter(q => q.entry && q.entry.cat === p.cat) : list;
    const catLabel = p.cat && CATS[p.cat] ? ": " + CATS[p.cat].ru : "";
    switch (p.mode) {
      case "weak": set = S.getWeakQuestions(byCat(all)); label = tr("Ошибки:") + " " + t.title_ru + catLabel; break;
      case "due": set = S.getDueQuestions(byCat(all)); label = tr("К повторению:") + " " + t.title_ru + catLabel; break;
      case "new": set = S.getUnseenFirst(byCat(all)).slice(0, 10); label = tr("Новое:") + " " + t.title_ru + catLabel; break;
      case "all": set = byCat(all); label = t.title_ru + catLabel; break;
      case "meaning": set = shuffle(byCat(k.meaning)).slice(0, 15); label = tr("Что означает знак") + catLabel; break;
      case "pick": set = shuffle(byCat(k.pick)).slice(0, 15); label = tr("Найди знак") + catLabel; break;
      case "category": set = shuffle(byCat(k.category)).slice(0, 15); label = tr("Тип знака") + catLabel; break;
      case "marking": set = k.marking; label = tr("Разметка"); break;
      default: set = shuffle(byCat(all)).slice(0, 10); label = t.title_ru + catLabel;
    }
    if (!set.length) { go("topic", { key: p.key }, { replace: true }); return; }

    view.innerHTML = "";
    window.QuizEngine.start(view, set, {
      title: label,
      exitLabel: tr("К теме"),
      onExit: () => go("topic", { key: p.key })
    });
  };

  /* ---------- Мои ошибки ---------- */
  routes.mistakes = function () {
    const rows = Object.keys(TOPICS).map(key => ({ key, t: TOPICS[key], weak: S.getWeakQuestions(D[key]) }));
    const weakVocab = S.getWeakVocab(D.vocabulary);
    const total = rows.reduce((n, r) => n + r.weak.length, 0);

    view.innerHTML = `
      <h1>${tr("Мои ошибки")}</h1>
      <p class="lead">${tr("Профиль:")} <strong>${esc(S.getCurrentProfile())}</strong>. ${tr("Здесь собраны задания, на которые ты отвечал неверно. Тренируй их, пока ответ не станет уверенным.")}</p>
      ${total || weakVocab.length ? "" : `<div class="card"><p>${tr("Ошибок пока нет. Пройди задание дня или пару тренировок, и здесь появится список для повторения.")}</p></div>`}
      <div class="grid">
        ${rows.filter(r => r.weak.length).map(r => `
          <div class="card topic-card">
            <div class="topic-icon">${r.t.icon}</div>
            <div class="topic-body">
              <h3>${esc(r.t.title_ru)}</h3>
              <p class="muted">${r.weak.length} ${tr("заданий с ошибками")}${S.getDueCount(D[r.key]) ? `, ${tr("к повторению сегодня:")} ${S.getDueCount(D[r.key])}` : ""}</p>
              <ul class="weak-list">
                ${r.weak.slice(0, 5).map(q => {
                  const a = S.getAnswerEntry(q.id);
                  const label = q.entry ? `${q.entry.no} (${q.entry.ru})` : (q.label || q.prompt_no);
                  return `<li><span class="lang-no">${esc(label)}</span><span class="muted"> — ${tr("ошибок")} ${a.wrong}, ${tr("верно")} ${a.correct}</span></li>`;
                }).join("")}
                ${r.weak.length > 5 ? `<li class="muted">…${tr("и ещё")} ${r.weak.length - 5}</li>` : ""}
              </ul>
            </div>
            <div class="topic-actions">
              <button class="btn btn-primary" onclick="go('quiz',{key:'${r.key}',mode:'weak'})">${tr("Тренировать")}</button>
            </div>
          </div>`).join("")}
        ${weakVocab.length ? `
          <div class="card topic-card">
            <div class="topic-icon">${ICONS.vocab}</div>
            <div class="topic-body">
              <h3>${tr("Лексика")}</h3>
              <p class="muted">${weakVocab.length} ${tr("слов, которые ты отметил как «не знаю»")}</p>
            </div>
            <div class="topic-actions">
              <button class="btn btn-primary" onclick="go('vocab',{mode:'weak'})">${tr("Повторить")}</button>
            </div>
          </div>` : ""}
      </div>
      <div class="danger-zone">
        <button class="btn btn-ghost" onclick="if(confirm('${tr("Стереть весь прогресс профиля «")}${esc(S.getCurrentProfile())}»?')){Storage.reset();go('home');}">${tr("Сбросить прогресс этого профиля")}</button>
      </div>`;
  };

  /* ---------- Лексика (флеш-карточки) ---------- */
  /* ---------- Лексика ---------- */
  const VOCAB_SESSION_KEY = "forerkort-vocab-session";
  function vocabStatus(w) {
    const v = S.getVocabEntry(w.id);
    if (!v) return "new";
    return v.lastResult === "fail" || v.unknown > v.known ? "weak" : "known";
  }
  function saveVocabSession(session, mode) {
    try { localStorage.setItem(VOCAB_SESSION_KEY + ":" + S.getCurrentProfile(), JSON.stringify({ mode, ids: session.cards.map(c => c.id), index: session.index, known: session.known, unknown: session.unknown.map(c => c.id) })); } catch (e) { /* ignore */ }
  }
  function loadVocabSession() {
    try { return JSON.parse(localStorage.getItem(VOCAB_SESSION_KEY + ":" + S.getCurrentProfile()) || "null"); } catch (e) { return null; }
  }
  function clearVocabSession() { try { localStorage.removeItem(VOCAB_SESSION_KEY + ":" + S.getCurrentProfile()); } catch (e) { /* ignore */ } }

  routes.vocab = function (p) {
    const all = D.vocabulary;
    const byId = Object.fromEntries(all.map(w => [w.id, w]));
    const groups = { new: all.filter(w => vocabStatus(w) === "new"), weak: all.filter(w => vocabStatus(w) === "weak"), known: all.filter(w => vocabStatus(w) === "known") };
    const saved = loadVocabSession();

    if (!p.mode) {
      const resumable = saved && saved.index < saved.ids.length;
      view.innerHTML = `
        <button class="btn btn-ghost" onclick="go('home')">${tr("Главная")}</button>
        <section class="topic-hero">
          <div class="topic-icon big">${ICONS.vocab}</div>
          <div>
            <h1>Ordforråd</h1>
            <p class="lead muted">${tr("Лексика:")} ${all.length} ${tr("слов")}</p>
            <div class="stat-line">
              <span class="pill good">${tr("знаю")} ${groups.known.length}</span>
              <span class="pill bad">${tr("повторить")} ${groups.weak.length}</span>
              <span class="pill">${tr("новых")} ${groups.new.length}</span>
            </div>
          </div>
        </section>
        <div class="grid modes">
          ${resumable ? `<div class="card mode-card"><h3>${tr("Продолжить")}</h3><p class="muted">${tr("Начатая колода:")} ${saved.index} ${tr("из")} ${saved.ids.length} ${tr("пройдено.")}</p><button class="btn btn-primary" onclick="go('vocab',{mode:'resume'})">${tr("Продолжить")}</button></div>` : ""}
          <div class="card mode-card"><h3>${tr("Новые слова")}</h3><p class="muted">${groups.new.length ? `${Math.min(20, groups.new.length)} ${tr("слов, которые ты ещё не видел (всего новых")} ${groups.new.length}).` : `${tr("Все")} ${all.length} ${tr("слов уже пройдены хотя бы раз. Новые слова появляются каждые три дня, а пока повторяй незнакомые.")}`}</p><button class="btn ${resumable ? "" : "btn-primary"}" ${groups.new.length ? "" : "disabled"} onclick="go('vocab',{mode:'new'})">${tr("Начать")}</button></div>
          <div class="card mode-card"><h3>${tr("Повторить незнакомые")}</h3><p class="muted">${groups.weak.length ? groups.weak.length + " " + tr("слов, которые ты отметил «не знаю».") : tr("Незнакомых слов нет.")}</p><button class="btn" ${groups.weak.length ? "" : "disabled"} onclick="go('vocab',{mode:'weak'})">${tr("Начать")}</button></div>
          <div class="card mode-card"><h3>${tr("Все слова")}</h3><p class="muted">${tr("Вся колода в случайном порядке.")}</p><button class="btn" onclick="go('vocab',{mode:'all'})">${tr("Начать")}</button></div>
        </div>`;
      return;
    }

    let session;
    if (p.mode === "resume" && saved) {
      session = { cards: saved.ids.map(id => byId[id]).filter(Boolean), index: saved.index, known: saved.known || 0, unknown: (saved.unknown || []).map(id => byId[id]).filter(Boolean), flipped: false };
      if (session.index >= session.cards.length) { clearVocabSession(); go("vocab", {}, { replace: true }); return; }
    } else {
      let set;
      if (p.mode === "weak") set = groups.weak;
      else if (p.mode === "new") set = shuffle(groups.new).slice(0, 20);
      else set = all;
      if (!set.length) { go("vocab", {}, { replace: true }); return; }
      session = { cards: shuffle(set), index: 0, known: 0, unknown: [], flipped: false };
    }
    const mode = p.mode === "resume" ? (saved.mode || "all") : p.mode;
    saveVocabSession(session, mode);

    function render() {
      const c = session.cards[session.index];
      const pct = Math.round((session.index / session.cards.length) * 100);
      view.innerHTML = `
        <div class="quiz">
          <div class="quiz-head">
            <button class="btn btn-ghost" onclick="go('vocab')">${tr("К лексике")}</button>
            <div class="quiz-meta">
              <span class="quiz-title">${mode === "weak" ? tr("Повторение") : mode === "new" ? tr("Новые слова") : tr("Лексика")}</span>
              <span class="quiz-counter">${session.index + 1} / ${session.cards.length}</span>
            </div>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>

          <div class="flashcard ${session.flipped ? "flipped" : ""}" id="flashcard">
            <div class="flash-face flash-front">
              <span class="flash-group">${esc(c.group)}</span>
              <div class="flash-word">${esc(c.word_no)}</div>
              <div class="flash-example lang-no">${esc(c.example_no)}</div>
              <div class="flash-hint muted">${tr("нажми, чтобы перевернуть")}</div>
            </div>
            <div class="flash-face flash-back">
              <span class="flash-group">${esc(c.word_no)}</span>
              <div class="flash-word">${esc(c.translation_ru)}</div>
              <div class="flash-example lang-no">${esc(c.example_no)}</div>
              <div class="flash-example">${esc(c.example_ru)}</div>
            </div>
          </div>

          <div class="flash-actions ${session.flipped ? "" : "hidden"}">
            <button class="btn btn-danger" id="btn-unknown">← ${tr("Не знаю")}</button>
            <button class="btn btn-success" id="btn-known">${tr("Знаю →")}</button>
          </div>
          <div class="voice-row">
            <label class="muted small">${tr("Голос")}
              <select id="voice-pick" class="voice-select">
                <option value="pernille">Pernille (${tr("женский)")}</option>
                <option value="finn">Finn (${tr("мужской)")}</option>
              </select>
            </label>
          </div>
          <p class="key-hint muted">${tr("Клавиатура: пробел — перевернуть, ← не знаю, → знаю, S — озвучить")}</p>
        </div>`;

      if (window.Speech && Speech.available()) {
        const front = view.querySelector(".flash-front"), back = view.querySelector(".flash-back");
        const file = () => `audio/vocab/${c.id}-${Speech.getVoicePref()}.mp3`;
        front.appendChild(Speech.button(() => c.word_no, "flash-speak", file));
        back.appendChild(Speech.button(() => c.word_no, "flash-speak", file));
        const vp = document.getElementById("voice-pick");
        if (vp) { vp.value = Speech.getVoicePref(); vp.onchange = () => Speech.setVoicePref(vp.value); }
      }
      const copyBtn = (side) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "btn-speak flash-copy"; b.title = tr("Скопировать слово"); b.setAttribute("aria-label", tr("Скопировать"));
        b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>`;
        b.onclick = e => {
          e.stopPropagation(); e.preventDefault();
          const text = side === "back" ? c.translation_ru : c.word_no;
          const done = () => { b.classList.add("copied"); b.title = tr("Скопировано"); setTimeout(() => { b.classList.remove("copied"); b.title = tr("Скопировать слово"); }, 1500); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => {});
          else { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (err) { /* ignore */ } ta.remove(); }
        };
        return b;
      };
      view.querySelector(".flash-front").appendChild(copyBtn("front"));
      view.querySelector(".flash-back").appendChild(copyBtn("back"));
      document.getElementById("flashcard").onclick = () => {
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.toString().trim()) return;
        session.flipped = !session.flipped;
        document.getElementById("flashcard").classList.toggle("flipped", session.flipped);
        document.querySelector(".flash-actions").classList.toggle("hidden", !session.flipped);
      };
      document.getElementById("btn-known").onclick = () => mark(true);
      document.onkeydown = e => {
        if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
        if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); document.getElementById("flashcard").click(); }
        else if (e.key === "ArrowRight" && session.flipped) { e.preventDefault(); mark(true); }
        else if (e.key === "ArrowLeft" && session.flipped) { e.preventDefault(); mark(false); }
        else if (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "ы") { const b = view.querySelector(".flash-speak"); if (b) b.click(); }
      };
      document.getElementById("btn-unknown").onclick = () => mark(false);
    }

    function mark(known) {
      const c = session.cards[session.index];
      S.recordVocab(c.id, known);
      if (known) session.known += 1; else session.unknown.push(c);
      session.index += 1;
      session.flipped = false;
      saveVocabSession(session, mode);
      if (session.index >= session.cards.length) { clearVocabSession(); renderResult(); } else render();
    }

    function renderResult() {
      const total = session.cards.length;
      const pct = Math.round((session.known / total) * 100);
      view.innerHTML = `
        <div class="quiz">
          <div class="card result-card">
            <h2>${tr("Лексика: результат")}</h2>
            <div class="result-score ${pct >= 85 ? "good" : pct >= 70 ? "mid" : "bad"}">
              <span class="result-pct">${pct}%</span>
              <span class="result-sub">${session.known} ${tr("из")} ${total} ${tr("знаешь")}</span>
            </div>
            <div class="result-actions">
              ${session.unknown.length ? `<button class="btn btn-primary" id="retry">${tr("Повторить незнакомые (")}${session.unknown.length})</button>` : ""}
              <button class="btn" onclick="go('vocab')">${tr("К лексике")}</button>
              <button class="btn btn-ghost" onclick="go('home')">${tr("Главная")}</button>
            </div>
          </div>
          ${session.unknown.length ? `
            <h3 class="section-title">${tr("Слова на повторение")}</h3>
            <div class="card">
              <table class="vocab-table">
                ${session.unknown.map(c => `<tr><td class="lang-no"><strong>${esc(c.word_no)}</strong></td><td>${esc(c.translation_ru)}</td></tr>`).join("")}
              </table>
            </div>` : ""}
        </div>`;
      const r = document.getElementById("retry");
      if (r) r.onclick = () => {
        session.cards = shuffle(session.unknown); session.index = 0; session.known = 0; session.unknown = []; session.flipped = false;
        saveVocabSession(session, "weak");
        render();
      };
    }


    render();
  };

  document.querySelectorAll(".nav a").forEach(a => {
    a.onclick = e => { e.preventDefault(); go(a.dataset.route); };
  });

  renderProfileSwitch();
  const start = parseHash();
  history.replaceState(null, "", hashFor(start.name, start.params));
  render(start.name, start.params);
})();
