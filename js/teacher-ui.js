/* Экран «Учитель». */

(function () {
  "use strict";

  const T = window.Teacher;
  const esc = window.QuizEngine.esc;
  const view = document.getElementById("view");
  let tab = "free";
  let situation = null;

  function settingsBlock() {
    if (T.settings.viaCloud) {
      return T.settings.ready
        ? `<p class="muted small">Учитель работает через сервер. Ключ API хранится только там.</p>`
        : `<div class="card"><p><strong>Учитель доступен только владельцу сайта.</strong></p><p class="muted">Ключ API и счёт за него принадлежат владельцу. Остальные разделы работают без ограничений.</p></div>`;
    }
    const ready = T.settings.ready;
    return `
      <details class="card settings ${ready ? "" : "open"}" ${ready ? "" : "open"}>
        <summary>${ready ? "Подключено. Настройки" : "Подключение к Claude API"}</summary>
        <p class="muted">Учитель работает через Claude API. Ключ хранится только в этом браузере и отправляется напрямую в api.anthropic.com. Каждый ответ стоит несколько центов; счёт идёт на аккаунт владельца ключа.</p>
        <label class="field">
          <span>Ключ API (sk-ant-…)</span>
          <input type="password" id="api-key" value="${esc(T.settings.key)}" autocomplete="off" placeholder="вставь ключ из console.anthropic.com">
        </label>
        <label class="field">
          <span>Адрес прокси (необязательно, для варианта с Cloudflare Worker)</span>
          <input type="url" id="api-proxy" value="${esc(T.settings.proxy)}" placeholder="https://……workers.dev">
        </label>
        <div class="row">
          <button class="btn btn-primary" id="save-settings">Сохранить</button>
          <button class="btn btn-ghost" id="clear-settings">Удалить ключ</button>
        </div>
      </details>`;
  }

  function tabs() {
    const items = [["free", "Свободный ответ"], ["gen", "Новые задания"], ["ask", "Спросить"]];
    return `<div class="tabs">${items.map(([k, l]) => `<button class="tab ${tab === k ? "active" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>`;
  }

  function render() {
    const bank = T.loadBank();
    view.innerHTML = `
      <h1>Læreren <span class="muted">· Учитель</span></h1>
      <p class="lead">Живой репетитор: придумывает ситуации, проверяет твой ответ по правилам и по языку, генерирует новые задания и отвечает на вопросы.</p>
      ${settingsBlock()}
      ${T.settings.ready ? tabs() : ""}
      <div id="teacher-body"></div>
      ${bank.length ? `
        <div class="card bank-card">
          <div>
            <h3>Банк от учителя</h3>
            <p class="muted">${bank.length} заданий, сгенерированных раньше. Они сохраняются в этом браузере.</p>
          </div>
          <div class="row">
            <button class="btn btn-primary" id="bank-quiz">Пройти 10</button>
            <button class="btn btn-ghost" id="bank-clear">Очистить банк</button>
          </div>
        </div>` : ""}`;

    const save = document.getElementById("save-settings");
    if (save) save.onclick = () => {
      T.settings.key = document.getElementById("api-key").value.trim();
      T.settings.proxy = document.getElementById("api-proxy").value.trim();
      render();
    };
    const clear = document.getElementById("clear-settings");
    if (clear) clear.onclick = () => { T.settings.key = ""; T.settings.proxy = ""; render(); };
    view.querySelectorAll(".tab").forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    const bq = document.getElementById("bank-quiz");
    if (bq) bq.onclick = () => {
      const set = window.QuizEngine.shuffle(bank).slice(0, 10);
      view.innerHTML = "";
      window.QuizEngine.start(view, set, { title: "Банк от учителя", exitLabel: "К учителю", onExit: () => go("teacher") });
    };
    const bc = document.getElementById("bank-clear");
    if (bc) bc.onclick = () => { if (confirm("Удалить все сгенерированные задания?")) { T.saveBank([]); render(); } };

    const body = document.getElementById("teacher-body");
    if (!T.settings.ready) {
      body.innerHTML = T.settings.viaCloud ? "" : `<div class="card"><p>Сначала вставь ключ API выше.</p></div>`;
      return;
    }
    if (tab === "free") renderFree(body);
    else if (tab === "gen") renderGen(body);
    else renderAsk(body);
  }

  function busy(el, text) {
    el.innerHTML = `<div class="card busy"><span class="spinner"></span> ${esc(text)}</div>`;
  }
  function fail(el, err) {
    el.innerHTML = `<div class="card error"><strong>Не получилось.</strong> ${esc(err.message || err)}</div>`;
  }

  /* ---------- Свободный ответ ---------- */
  function renderFree(body) {
    if (!situation) {
      body.innerHTML = `
        <div class="card">
          <h3>Как это работает</h3>
          <p class="muted">Учитель описывает ситуацию на дороге. Ты отвечаешь своими словами по-норвежски: что сделаешь и почему. Учитель проверит и правила, и язык.</p>
          <label class="field"><span>Тема (необязательно)</span><input type="text" id="free-topic" placeholder="например: rundkjøring, parkering, vinterføre"></label>
          <button class="btn btn-primary" id="free-new">Дать ситуацию</button>
        </div>`;
      document.getElementById("free-new").onclick = async () => {
        const hint = document.getElementById("free-topic").value.trim();
        busy(body, "Учитель придумывает ситуацию…");
        try { situation = await T.newSituation(hint); renderFree(body); } catch (e) { fail(body, e); }
      };
      return;
    }
    body.innerHTML = `
      <div class="card situation">
        <p class="lang-no big">${esc(situation.situation_no)}</p>
        <p class="lang-ru-toggle hidden">${esc(situation.situation_ru)}</p>
        <button class="btn btn-small btn-translate" id="sit-ru">Показать перевод</button>
        <p class="lang-no question"><strong>${esc(situation.question_no)}</strong></p>
        <div class="hints">${situation.hint_words.map(h => `<span class="hint"><b>${esc(h.no)}</b> ${esc(h.ru)}</span>`).join("")}</div>
        <label class="field"><span>Твой ответ по-норвежски</span><textarea id="free-answer" rows="5" placeholder="Jeg ville …"></textarea></label>
        <div class="row">
          <button class="btn btn-primary" id="free-grade">Проверить</button>
          <button class="btn btn-ghost" id="free-skip">Другая ситуация</button>
        </div>
      </div>
      <div id="free-result"></div>`;
    document.getElementById("sit-ru").onclick = e => {
      const p = body.querySelector(".lang-ru-toggle");
      p.classList.toggle("hidden");
      e.target.textContent = p.classList.contains("hidden") ? "Показать перевод" : "Скрыть перевод";
    };
    document.getElementById("free-skip").onclick = () => { situation = null; renderFree(body); };
    document.getElementById("free-grade").onclick = async () => {
      const answer = document.getElementById("free-answer").value.trim();
      if (answer.length < 5) return;
      const out = document.getElementById("free-result");
      busy(out, "Учитель проверяет…");
      try {
        const g = await T.gradeAnswer(situation, answer);
        const cls = g.verdict === "riktig" ? "ok" : g.verdict === "delvis" ? "mid" : "fail";
        out.innerHTML = `
          <div class="card grade grade-${cls}">
            <div class="grade-head">
              <span class="grade-verdict">${g.verdict === "riktig" ? "Riktig" : g.verdict === "delvis" ? "Delvis riktig" : "Feil"}</span>
              <span class="grade-score">${g.score}/100</span>
            </div>
            <h4>Правила</h4>
            <p class="lang-no">${esc(g.rule_feedback_no)}</p>
            <p>${esc(g.rule_feedback_ru)}</p>
            ${g.language_corrections.length ? `
              <h4>Язык</h4>
              <ul class="corrections">${g.language_corrections.map(c => `<li><s>${esc(c.original)}</s> → <b>${esc(c.corrected)}</b><span class="muted"> — ${esc(c.why_ru)}</span></li>`).join("")}</ul>` : `<p class="muted">Язык: ошибок, которые стоило бы править, нет.</p>`}
            <h4>Образцовый ответ</h4>
            <p class="lang-no">${esc(g.model_answer_no)}</p>
            <p class="muted">${esc(g.model_answer_ru)}</p>
            <button class="btn btn-primary" id="free-next">Следующая ситуация</button>
          </div>`;
        document.getElementById("free-next").onclick = () => { situation = null; renderFree(body); };
        out.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) { fail(out, e); }
    };
  }

  /* ---------- Новые задания ---------- */
  function renderGen(body) {
    body.innerHTML = `
      <div class="card">
        <h3>Сгенерировать задания</h3>
        <p class="muted">Учитель напишет новые вопросы с вариантами ответов, учитывая твои слабые темы. Они попадут в «Банк от учителя» и останутся в браузере.</p>
        <label class="field"><span>Тема (необязательно)</span><input type="text" id="gen-topic" placeholder="например: parkering og stans, motorveg, prikker"></label>
        <label class="field"><span>Сколько</span>
          <select id="gen-n"><option value="5">5</option><option value="10" selected>10</option><option value="15">15</option></select>
        </label>
        <button class="btn btn-primary" id="gen-go">Сгенерировать</button>
      </div>
      <div id="gen-result"></div>`;
    document.getElementById("gen-go").onclick = async () => {
      const out = document.getElementById("gen-result");
      const n = Number(document.getElementById("gen-n").value);
      const hint = document.getElementById("gen-topic").value.trim();
      busy(out, `Учитель пишет ${n} заданий… это может занять полминуты`);
      try {
        const qs = await T.generateQuestions(n, hint);
        out.innerHTML = `
          <div class="card">
            <p><strong>Готово: ${qs.length} новых заданий.</strong></p>
            <div class="row"><button class="btn btn-primary" id="gen-quiz">Пройти сейчас</button><button class="btn btn-ghost" id="gen-more">Ещё</button></div>
          </div>`;
        document.getElementById("gen-quiz").onclick = () => {
          view.innerHTML = "";
          window.QuizEngine.start(view, qs, { title: "Новые задания от учителя", exitLabel: "К учителю", onExit: () => go("teacher") });
        };
        document.getElementById("gen-more").onclick = () => renderGen(body);
      } catch (e) { fail(out, e); }
    };
  }

  /* ---------- Спросить ---------- */
  function renderAsk(body) {
    body.innerHTML = `
      <div class="card chat">
        <div class="chat-log" id="chat-log">${T.chat.length ? T.chat.map(m => msgHtml(m)).join("") : `<p class="muted">Спроси что угодно по ПДД Норвегии, по-русски или по-норвежски. Учитель ответит на норвежском и продублирует по-русски.</p>`}</div>
        <div class="chat-input">
          <textarea id="chat-q" rows="2" placeholder="Hva betyr «vikeplikt»? / Можно ли парковаться у автобусной остановки?"></textarea>
          <button class="btn btn-primary" id="chat-send">Спросить</button>
        </div>
      </div>`;
    const send = async () => {
      const q = document.getElementById("chat-q").value.trim();
      if (!q) return;
      document.getElementById("chat-q").value = "";
      const log = document.getElementById("chat-log");
      log.innerHTML += msgHtml({ role: "user", content: q }) + `<div class="msg msg-assistant busy"><span class="spinner"></span> думает…</div>`;
      log.scrollTop = log.scrollHeight;
      try {
        await T.ask(q);
        renderAsk(body);
        const l = document.getElementById("chat-log"); l.scrollTop = l.scrollHeight;
      } catch (e) { fail(log, e); }
    };
    document.getElementById("chat-send").onclick = send;
    document.getElementById("chat-q").onkeydown = e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); };
  }
  function msgHtml(m) {
    const parts = m.role === "assistant" ? m.content.split(/\n---\n?/) : [m.content];
    return `<div class="msg msg-${m.role}">${parts.map((p, i) => `<p class="${i === 0 && m.role === "assistant" ? "lang-no" : ""}">${esc(p.trim())}</p>`).join("")}</div>`;
  }

  window.ROUTES.teacher = render;
})();
