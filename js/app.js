/* Роутинг между экранами и сборка страниц. */

(function () {
  "use strict";

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
    signs: { title: "Skilt og oppmerking", title_ru: "Знаки и разметка", icon: ICONS.signs, desc: "Все знаки Норвегии: значение, поиск по названию, тип знака, разметка." },
    situational: { title: "Trafikksituasjoner", title_ru: "Ситуационные задачи", icon: ICONS.situational, desc: "Кто кому уступает: перекрёстки, круг, повороты, автомагистраль." },
    rules: { title: "Regler og sanksjoner", title_ru: "Правила и штрафы", icon: ICONS.rules, desc: "Скорость, алкоголь, ремни, баллы, парковка, ставки 2026." }
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
      el.innerHTML = `<button class="profile-btn profile-login" onclick="go('login')">Войти</button>`;
      return;
    }
    const cur = S.getCurrentProfile();
    el.innerHTML = `<button class="profile-btn" title="Профиль"><span class="profile-dot"></span>${esc(cur)}</button>`;
    el.querySelector(".profile-btn").onclick = openProfileMenu;
    renderSyncStatus();
  }
  window.renderProfileSwitch = renderProfileSwitch;

  /* Точка у имени показывает состояние облака: сохранено / сохраняю / нет сети / ошибка */
  const SYNC_TITLE = { local: "Локальный профиль", synced: "Прогресс сохранён в облаке", saving: "Сохраняю…", offline: "Нет сети: сохраню, когда появится", error: "Ошибка сохранения" };
  function renderSyncStatus() {
    const dot = document.querySelector("#profile-switch .profile-dot");
    if (!dot) return;
    const st = C.status;
    dot.className = "profile-dot is-" + st;
    dot.parentElement.title = SYNC_TITLE[st] + (C.statusMsg ? ": " + C.statusMsg : "");
    const line = document.querySelector(".profile-menu .sync-line");
    if (line) line.innerHTML = syncLineHtml();
  }
  window.renderSyncStatus = renderSyncStatus;
  function syncLineHtml() {
    const st = C.status;
    const retry = (st === "error" || st === "offline") ? ` <button class="btn btn-small" onclick="Cloud.pushNow()">Повторить</button>` : "";
    return `<span class="profile-dot is-${st}"></span> ${esc(SYNC_TITLE[st])}${retry}`;
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
        <div class="profile-menu-title">Ты вошёл как</div>
        <button class="profile-item active">${esc(cur)}</button>
        <div class="sync-line">${syncLineHtml()}</div>
        <button class="profile-item profile-add" data-act="logout">Выйти</button>`;
      document.getElementById("profile-switch").appendChild(menu);
      menu.querySelector("[data-act=logout]").onclick = async () => { menu.remove(); await C.logout(); renderProfileSwitch(); go("home"); };
    } else {
      menu.innerHTML = `
        <div class="profile-menu-title">Кто занимается?</div>
        ${S.getProfiles().map(p => `
          <button class="profile-item ${p === cur ? "active" : ""}" data-name="${esc(p)}">${esc(p)}</button>`).join("")}
        <button class="profile-item profile-add">Добавить человека</button>`;
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
        ${r ? `<span class="pill ${pct >= 85 ? "good" : pct >= 70 ? "mid" : "bad"}">${pct}%</span><span class="muted">${r.correct} из ${r.total}</span>` : `<span class="muted">ещё не проходил(а)</span>`}
      </div>`;
    }).join("");
    return `
      <div class="card daily-card">
        <div class="daily-head">
          <div class="topic-icon">${ICONS.daily}</div>
          <div>
            <h3>Dagens økt</h3>
            <p class="topic-sub">Задание дня, ${key.split("-").reverse().join(".")}</p>
          </div>
        </div>
        <p class="topic-desc">20 вопросов, одинаковые для всех в этот день. Сравните результаты.</p>
        <div class="daily-rows">${rows}</div>
        <div class="daily-foot">
          <button class="btn ${mine ? "" : "btn-cta"}" onclick="go('daily')">${mine ? "Пройти ещё раз" : "Начать задание дня"}</button>
          ${streak > 1 ? `<span class="streak">${streak} дней подряд</span>` : ""}
        </div>
      </div>`;
  }

  /* ---------- Вход и регистрация ---------- */
  routes.login = function (p) {
    let tab = p.tab || "login";
    function render(error) {
      view.innerHTML = `
        <div class="quiz">
          <h1>${tab === "login" ? "Вход" : "Регистрация"}</h1>
          <p class="lead">Прогресс хранится на сервере: войди с любого телефона, и всё будет на месте. Результаты видны друзьям из круга.</p>
          <div class="tabs">
            <button class="tab ${tab === "login" ? "active" : ""}" data-tab="login">Войти</button>
            <button class="tab ${tab === "register" ? "active" : ""}" data-tab="register">Регистрация</button>
          </div>
          <form class="card" id="auth-form" autocomplete="off">
            <label class="field"><span>Имя (как тебя увидят друзья)</span><input type="text" id="auth-name" maxlength="24" required autocomplete="username"></label>
            <label class="field"><span>PIN (4–6 цифр)</span><input type="password" id="auth-pin" inputmode="numeric" pattern="\\d{4,6}" maxlength="6" required autocomplete="current-password"></label>
            ${tab === "register" ? `<label class="field"><span>Код приглашения</span><input type="text" id="auth-invite" required autocomplete="off" placeholder="спроси у того, кто дал ссылку"></label>` : ""}
            ${error ? `<p class="form-error">${esc(error)}</p>` : ""}
            <div class="row">
              <button class="btn btn-primary" type="submit">${tab === "login" ? "Войти" : "Создать аккаунт"}</button>
              <button class="btn btn-ghost" type="button" onclick="go('home')">Без входа</button>
            </div>
            ${tab === "register" ? `<p class="muted small">Прогресс, который уже есть в этом браузере, перенесётся в новый аккаунт.</p>` : ""}
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
        btn.disabled = true; btn.textContent = "Секунду…";
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
            <div><h3>Vennekretsen</h3><p class="topic-sub">Круг друзей</p></div>
          </div>
          <p class="topic-desc">Войди, чтобы прогресс сохранялся на сервере и было видно, кто как занимается.</p>
          <div class="daily-foot"><button class="btn btn-primary" onclick="go('login')">Войти или зарегистрироваться</button></div>
        </div>`;
    }
    setTimeout(loadCircle, 0);
    return `
      <div class="card daily-card circle-card" id="circle-card">
        <div class="daily-head">
          <div class="topic-icon">${ICONS.circle}</div>
          <div><h3>Vennekretsen</h3><p class="topic-sub">Круг друзей</p></div>
        </div>
        <div class="daily-rows" id="circle-rows"><div class="busy"><span class="spinner"></span> загружаю…</div></div>
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
          <div class="circle-row circle-head"><span>Имя</span><span>Сегодня</span><span>Верно</span><span>Экзамены</span><span>Дней</span></div>
          ${data.rows.map(r => {
            const t = r.today ? `${Math.round((r.today.correct / r.today.total) * 100)}%` : "—";
            const ex = r.exams ? `${r.examsPassed}/${r.exams}` : "—";
            return `<div class="circle-row ${r.name === data.me ? "me" : ""}">
              <span class="circle-name">${esc(r.name)}${r.name === data.owner ? ' <span class="crown" title="владелец">★</span>' : ""}</span>
              <span class="${r.today ? (t.replace("%", "") >= 85 ? "good-text" : "") : "muted"}">${t}</span>
              <span>${r.accuracy != null ? r.accuracy + "%" : "—"}</span>
              <span>${ex}</span>
              <span>${r.streak ? r.streak + " подряд" : r.dailyCount || "—"}</span>
            </div>`;
          }).join("")}
        </div>
        <p class="muted small">Сегодня — результат задания дня ${key.split("-").reverse().join(".")}. Верно — доля верных ответов за всё время. Экзамены — сдано из попыток.</p>`;
    } catch (e) {
      el.innerHTML = `<p class="muted">Не удалось загрузить круг: ${esc(e.message)}</p>`;
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
          ? `<span class="pill ${last.passed ? "good" : "bad"}">${last.passed ? "bestått" : "ikke bestått"}</span><span class="muted">${last.correct}/${last.total}, сдано ${passed} из ${ex.length}</span>`
          : `<span class="muted">ещё не сдавал(а)</span>`}
      </div>`;
    }).join("");
    return `
      <div class="card daily-card exam-card">
        <div class="daily-head">
          <div class="topic-icon">${ICONS.exam}</div>
          <div>
            <h3>Teoriprøve</h3>
            <p class="topic-sub">Пробный экзамен</p>
          </div>
        </div>
        <p class="topic-desc">45 вопросов, 90 минут, без подсказок по ходу. Сдано, если ошибок не больше 7. Как на настоящем экзамене.</p>
        <div class="daily-rows">${rows}</div>
        <div class="daily-foot"><button class="btn btn-cta" onclick="go('exam')">Начать экзамен</button></div>
      </div>`;
  }

  routes.exam = function () {
    view.innerHTML = "";
    window.QuizEngine.start(view, examSet(), {
      title: "Teoriprøve",
      exitLabel: "Прервать",
      exam: true,
      timeLimit: 90 * 60,
      maxWrong: 7,
      onExit: () => { window.ROUTE_GUARD = null; go("home"); },
      onRestart: () => { window.ROUTE_GUARD = null; go("exam", {}, { force: true }); },
      onFinish: res => { window.ROUTE_GUARD = null; S.recordExam(res); }
    });
    window.ROUTE_GUARD = () => confirm("Прервать экзамен? Результат не сохранится.");
  };

  routes.daily = function () {
    const key = todayKey();
    const already = S.getDaily(key);
    view.innerHTML = "";
    window.QuizEngine.start(view, dailySet(key), {
      title: "Задание дня",
      exitLabel: "Главная",
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
          <h1>Теория на права <span class="nowrap">по-норвежски</span></h1>
          <p class="lead">Вопросы как на экзамене, на норвежском. Перевод открывается по кнопке, чтобы сначала попробовать понять самому. Каждая ошибка разбирается и возвращается на повторение.</p>
          ${dueTotal ? `<p class="due-line"><span class="pill mid">К повторению сегодня: ${dueTotal}</span> <a href="#" onclick="go('mistakes');return false;">открыть</a></p>` : ""}
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="go('daily')">Задание дня</button>
            ${last && TOPICS[last] ? `<button class="btn" onclick="go('topic',{key:'${last}'})">Продолжить: ${TOPICS[last].title_ru}</button>` : ""}
            ${totalWeak ? `<button class="btn" onclick="go('mistakes')">Повторить ошибки (${totalWeak})</button>` : ""}
          </div>
          ${answered ? `
          <div class="hero-stats">
            <div class="hero-stat"><b>${Math.round((correct / answered) * 100)}%</b><span>верных ответов</span></div>
            <div class="hero-stat"><b>${seen}/${totalQ}</b><span>вопросов пройдено</span></div>
            <div class="hero-stat"><b>${vs.seen}/${vs.total}</b><span>слов из лексики</span></div>
          </div>
          <p class="hero-link"><a href="#" onclick="go('stats');return false;">Подробная статистика →</a></p>` : ""}
        </div>
      </section>

      ${circleCard()}
      ${window.PWA ? PWA.installCardHtml() : ""}
      <div class="grid grid-2">
        ${dailyCard()}
        ${examCard()}
      </div>

      <h2 class="section-title">Темы</h2>
      <div class="grid">
        ${cards}
        <div class="card topic-card">
          <div class="topic-icon">${ICONS.vocab}</div>
          <div class="topic-body">
            <h3>Ordforråd</h3>
            <p class="topic-sub">Лексика</p>
            <p class="topic-desc">Слова и фразы, без которых не понять вопросы на экзамене.</p>
            ${statLine(vs.accuracy, vs.coverage, vs.seen, vs.total, "слов")}
          </div>
          <div class="topic-actions">
            <button class="btn btn-primary" onclick="go('vocab')">Открыть карточки</button>
          </div>
        </div>
      </div>

      <details class="card offline-card">
        <summary>Работа без интернета</summary>
        <p class="muted small">Сайт открывается офлайн после первого посещения. Чтобы и картинки знаков с озвучкой были доступны без сети, загрузи их заранее (знаки ≈ 3 МБ, озвучка ≈ 2 МБ).</p>
        <div class="row">
          <button class="btn btn-small" onclick="PWA.runDownload('signs', this)">Скачать знаки</button>
          <button class="btn btn-small" onclick="PWA.runDownload('audio', this)">Скачать озвучку</button>
          <span class="muted small" id="offline-status"></span>
        </div>
      </details>
`;
    if (window.PWA) PWA.offlineStatus().then(s => { const el = document.getElementById("offline-status"); if (el) el.textContent = `Сохранено: знаков ${s.signs}, файлов озвучки ${s.audio}`; }).catch(() => {});
  };

  function topicCard(key, t, st) {
    return `
      <div class="card topic-card">
        <div class="topic-icon">${t.icon}</div>
        <div class="topic-body">
          <h3>${esc(t.title)}</h3>
          <p class="topic-sub">${esc(t.title_ru)}</p>
          <p class="topic-desc">${esc(t.desc)}</p>
          ${statLine(st.accuracy, st.coverage, st.seen, st.total, "заданий")}
          ${st.weak ? `<p class="weak-line">Ошибок: ${st.weak}. <a href="#" onclick="go('quiz',{key:'${key}',mode:'weak'});return false;">Тренировать</a></p>` : ""}
        </div>
        <div class="topic-actions">
          <button class="btn btn-primary" onclick="go('topic',{key:'${key}'})">Открыть</button>
        </div>
      </div>`;
  }

  function statLine(acc, cov, seen, total, unit) {
    if (!seen) return `<p class="stat-line">${total} ${unit}, ещё не начато</p>`;
    return `
      <div class="stat-line">
        <span class="pill ${acc >= 85 ? "good" : acc >= 70 ? "mid" : "bad"}">${acc}% верно</span>
        <span>пройдено ${seen} из ${total}</span>
      </div>`;
  }

  /* ---------- Экран темы ---------- */
  function modeCard(title, desc, key, mode, primary, disabled) {
    return `
      <div class="card mode-card">
        <h3>${esc(title)}</h3>
        <p class="muted">${esc(desc)}</p>
        <button class="btn ${primary ? "btn-primary" : ""}" ${disabled ? "disabled" : ""} onclick="go('quiz',{key:'${key}',mode:'${mode}'})">Начать</button>
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
        modeCard("Быстрая тренировка", "10 случайных заданий всех типов.", p.key, "quick", true),
        modeCard("Новые знаки", "10 знаков, которые ты ещё не видел или давно не повторял.", p.key, "new"),
        modeCard("Что означает знак", `Картинка, четыре названия. ${k.meaning.length} знаков.`, p.key, "meaning"),
        modeCard("Найди знак", `Название, четыре картинки. ${k.pick.length} знаков.`, p.key, "pick"),
        modeCard("Тип знака", `Предупреждающий, запрещающий, предписывающий… ${k.category.length} заданий.`, p.key, "category"),
        modeCard("Разметка", `Линии и стрелки на асфальте. ${k.marking.length} вопросов.`, p.key, "marking"),
        modeCard("Только мои ошибки", weak.length ? `${weak.length} заданий, где ты ошибался.` : "Пока нет ошибок в этой теме.", p.key, "weak", false, !weak.length)
      ];
    } else {
      modes = [
        modeCard("Быстрая тренировка", "10 случайных вопросов. Хорошо для ежедневной практики.", p.key, "quick", true),
        modeCard("Новые вопросы", "10 вопросов, которые ты ещё не видел или давно не повторял.", p.key, "new"),
        modeCard("Вся тема", `Все ${all.length} вопросов в случайном порядке.`, p.key, "all"),
        modeCard("Только мои ошибки", weak.length ? `${weak.length} вопросов, где ты ошибался.` : "Пока нет ошибок в этой теме.", p.key, "weak", false, !weak.length)
      ];
    }
    view.innerHTML = `
      <button class="btn btn-ghost" onclick="go('home')">Главная</button>
      <section class="topic-hero">
        <div class="topic-icon big">${t.icon}</div>
        <div>
          <h1>${esc(t.title)}</h1>
          <p class="lead muted">${esc(t.title_ru)}</p>
          ${statLine(st.accuracy, st.coverage, st.seen, st.total, "заданий")}
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
      case "weak": set = S.getWeakQuestions(byCat(all)); label = "Ошибки: " + t.title_ru + catLabel; break;
      case "due": set = S.getDueQuestions(byCat(all)); label = "К повторению: " + t.title_ru + catLabel; break;
      case "new": set = S.getUnseenFirst(byCat(all)).slice(0, 10); label = "Новое: " + t.title_ru + catLabel; break;
      case "all": set = byCat(all); label = t.title_ru + catLabel; break;
      case "meaning": set = shuffle(byCat(k.meaning)).slice(0, 15); label = "Что означает знак" + catLabel; break;
      case "pick": set = shuffle(byCat(k.pick)).slice(0, 15); label = "Найди знак" + catLabel; break;
      case "category": set = shuffle(byCat(k.category)).slice(0, 15); label = "Тип знака" + catLabel; break;
      case "marking": set = k.marking; label = "Разметка"; break;
      default: set = shuffle(byCat(all)).slice(0, 10); label = t.title_ru + catLabel;
    }
    if (!set.length) { go("topic", { key: p.key }, { replace: true }); return; }

    view.innerHTML = "";
    window.QuizEngine.start(view, set, {
      title: label,
      exitLabel: "К теме",
      onExit: () => go("topic", { key: p.key })
    });
  };

  /* ---------- Мои ошибки ---------- */
  routes.mistakes = function () {
    const rows = Object.keys(TOPICS).map(key => ({ key, t: TOPICS[key], weak: S.getWeakQuestions(D[key]) }));
    const weakVocab = S.getWeakVocab(D.vocabulary);
    const total = rows.reduce((n, r) => n + r.weak.length, 0);

    view.innerHTML = `
      <h1>Мои ошибки</h1>
      <p class="lead">Профиль: <strong>${esc(S.getCurrentProfile())}</strong>. Здесь собраны задания, на которые ты отвечал неверно. Тренируй их, пока ответ не станет уверенным.</p>
      ${total || weakVocab.length ? "" : `<div class="card"><p>Ошибок пока нет. Пройди задание дня или пару тренировок, и здесь появится список для повторения.</p></div>`}
      <div class="grid">
        ${rows.filter(r => r.weak.length).map(r => `
          <div class="card topic-card">
            <div class="topic-icon">${r.t.icon}</div>
            <div class="topic-body">
              <h3>${esc(r.t.title_ru)}</h3>
              <p class="muted">${r.weak.length} заданий с ошибками${S.getDueCount(D[r.key]) ? `, к повторению сегодня: ${S.getDueCount(D[r.key])}` : ""}</p>
              <ul class="weak-list">
                ${r.weak.slice(0, 5).map(q => {
                  const a = S.getAnswerEntry(q.id);
                  const label = q.entry ? `${q.entry.no} (${q.entry.ru})` : (q.label || q.prompt_no);
                  return `<li><span class="lang-no">${esc(label)}</span><span class="muted"> — ошибок ${a.wrong}, верно ${a.correct}</span></li>`;
                }).join("")}
                ${r.weak.length > 5 ? `<li class="muted">…и ещё ${r.weak.length - 5}</li>` : ""}
              </ul>
            </div>
            <div class="topic-actions">
              <button class="btn btn-primary" onclick="go('quiz',{key:'${r.key}',mode:'weak'})">Тренировать</button>
            </div>
          </div>`).join("")}
        ${weakVocab.length ? `
          <div class="card topic-card">
            <div class="topic-icon">${ICONS.vocab}</div>
            <div class="topic-body">
              <h3>Лексика</h3>
              <p class="muted">${weakVocab.length} слов, которые ты отметил как «не знаю»</p>
            </div>
            <div class="topic-actions">
              <button class="btn btn-primary" onclick="go('vocab',{mode:'weak'})">Повторить</button>
            </div>
          </div>` : ""}
      </div>
      <div class="danger-zone">
        <button class="btn btn-ghost" onclick="if(confirm('Стереть весь прогресс профиля «${esc(S.getCurrentProfile())}»?')){Storage.reset();go('home');}">Сбросить прогресс этого профиля</button>
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
        <button class="btn btn-ghost" onclick="go('home')">Главная</button>
        <section class="topic-hero">
          <div class="topic-icon big">${ICONS.vocab}</div>
          <div>
            <h1>Ordforråd</h1>
            <p class="lead muted">Лексика: ${all.length} слов</p>
            <div class="stat-line">
              <span class="pill good">знаю ${groups.known.length}</span>
              <span class="pill bad">повторить ${groups.weak.length}</span>
              <span class="pill">новых ${groups.new.length}</span>
            </div>
          </div>
        </section>
        <div class="grid modes">
          ${resumable ? `<div class="card mode-card"><h3>Продолжить</h3><p class="muted">Начатая колода: ${saved.index} из ${saved.ids.length} пройдено.</p><button class="btn btn-primary" onclick="go('vocab',{mode:'resume'})">Продолжить</button></div>` : ""}
          <div class="card mode-card"><h3>Новые слова</h3><p class="muted">${groups.new.length ? `${Math.min(20, groups.new.length)} слов, которые ты ещё не видел (всего новых ${groups.new.length}).` : `Все ${all.length} слов уже пройдены хотя бы раз. Новые слова появляются каждые три дня, а пока повторяй незнакомые.`}</p><button class="btn ${resumable ? "" : "btn-primary"}" ${groups.new.length ? "" : "disabled"} onclick="go('vocab',{mode:'new'})">Начать</button></div>
          <div class="card mode-card"><h3>Повторить незнакомые</h3><p class="muted">${groups.weak.length ? groups.weak.length + " слов, которые ты отметил «не знаю»." : "Незнакомых слов нет."}</p><button class="btn" ${groups.weak.length ? "" : "disabled"} onclick="go('vocab',{mode:'weak'})">Начать</button></div>
          <div class="card mode-card"><h3>Все слова</h3><p class="muted">Вся колода в случайном порядке.</p><button class="btn" onclick="go('vocab',{mode:'all'})">Начать</button></div>
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
            <button class="btn btn-ghost" onclick="go('vocab')">К лексике</button>
            <div class="quiz-meta">
              <span class="quiz-title">${mode === "weak" ? "Повторение" : mode === "new" ? "Новые слова" : "Лексика"}</span>
              <span class="quiz-counter">${session.index + 1} / ${session.cards.length}</span>
            </div>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>

          <div class="flashcard ${session.flipped ? "flipped" : ""}" id="flashcard">
            <div class="flash-face flash-front">
              <span class="flash-group">${esc(c.group)}</span>
              <div class="flash-word">${esc(c.word_no)}</div>
              <div class="flash-example lang-no">${esc(c.example_no)}</div>
              <div class="flash-hint muted">нажми, чтобы перевернуть</div>
            </div>
            <div class="flash-face flash-back">
              <span class="flash-group">${esc(c.word_no)}</span>
              <div class="flash-word">${esc(c.translation_ru)}</div>
              <div class="flash-example lang-no">${esc(c.example_no)}</div>
              <div class="flash-example">${esc(c.example_ru)}</div>
            </div>
          </div>

          <div class="flash-actions ${session.flipped ? "" : "hidden"}">
            <button class="btn btn-danger" id="btn-unknown">← Не знаю</button>
            <button class="btn btn-success" id="btn-known">Знаю →</button>
          </div>
          <div class="voice-row">
            <label class="muted small">Голос
              <select id="voice-pick" class="voice-select">
                <option value="pernille">Pernille (женский)</option>
                <option value="finn">Finn (мужской)</option>
              </select>
            </label>
          </div>
          <p class="key-hint muted">Клавиатура: пробел — перевернуть, ← не знаю, → знаю, S — озвучить</p>
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
        b.type = "button"; b.className = "btn-speak flash-copy"; b.title = "Скопировать слово"; b.setAttribute("aria-label", "Скопировать");
        b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>`;
        b.onclick = e => {
          e.stopPropagation(); e.preventDefault();
          const text = side === "back" ? c.translation_ru : c.word_no;
          const done = () => { b.classList.add("copied"); b.title = "Скопировано"; setTimeout(() => { b.classList.remove("copied"); b.title = "Скопировать слово"; }, 1500); };
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
            <h2>Лексика: результат</h2>
            <div class="result-score ${pct >= 85 ? "good" : pct >= 70 ? "mid" : "bad"}">
              <span class="result-pct">${pct}%</span>
              <span class="result-sub">${session.known} из ${total} знаешь</span>
            </div>
            <div class="result-actions">
              ${session.unknown.length ? `<button class="btn btn-primary" id="retry">Повторить незнакомые (${session.unknown.length})</button>` : ""}
              <button class="btn" onclick="go('vocab')">К лексике</button>
              <button class="btn btn-ghost" onclick="go('home')">Главная</button>
            </div>
          </div>
          ${session.unknown.length ? `
            <h3 class="section-title">Слова на повторение</h3>
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
