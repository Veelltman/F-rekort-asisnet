/* Экран «Статистика»: сводка, экзамены, точность по дням, темы, знаки по категориям и типам заданий.
   Графики — SVG на строках, цвета через CSS-переменные (работают в тёмной теме). */

(function () {
  "use strict";

  const S = window.Storage;
  const D = window.QUESTION_DATA;
  const { TOPICS, ICONS, esc } = window.AppUI;
  const CATS = window.SIGN_CATALOG.CATS;

  function pillClass(acc) { return acc >= 85 ? "good" : acc >= 70 ? "mid" : "bad"; }
  function fmtDate(key) { const [y, m, d] = key.split("-"); return `${d}.${m}`; }

  /* Сводка по произвольному набору вопросов */
  function aggregate(questions) {
    const now = Date.now();
    let seen = 0, correct = 0, wrong = 0, weak = 0, due = 0;
    questions.forEach(q => {
      const a = S.getAnswerEntry(q.id);
      if (!a) return;
      seen += 1; correct += a.correct; wrong += a.wrong;
      if (S.isWeak(a)) weak += 1;
      if (S.isDue(a, now)) due += 1;
    });
    const attempts = correct + wrong;
    return { total: questions.length, seen, correct, wrong, weak, due, attempts,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
      coverage: questions.length ? Math.round((seen / questions.length) * 100) : 0 };
  }

  /* ---------- Графики ---------- */
  function examChart(exams) {
    const W = 600, H = 180, padL = 30, padB = 22, padT = 10;
    const n = exams.length, gap = 6;
    const bw = Math.max(8, Math.min(40, (W - padL - 10) / n - gap));
    const innerH = H - padT - padB;
    const y = v => padT + innerH - (v / 45) * innerH;
    const bars = exams.map((e, i) => {
      const x = padL + 6 + i * (bw + gap);
      const h = innerH * (e.correct / e.total);
      return `<rect class="bar ${e.passed ? "good" : "bad"}" x="${x}" y="${padT + innerH - h}" width="${bw}" height="${h}" rx="2"><title>${e.correct}/${e.total}</title></rect>
        <text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${fmtDate(S.dateKey(new Date(e.at)))}</text>`;
    }).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Результаты экзаменов">
      ${[0, 15, 30, 45].map(v => `<line class="grid-line" x1="${padL}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}"/><text x="${padL - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join("")}
      <line class="pass-line" x1="${padL}" x2="${W - 4}" y1="${y(38)}" y2="${y(38)}"/>
      <text x="${W - 6}" y="${y(38) - 4}" text-anchor="end">bestått: 38</text>
      ${bars}
    </svg>`;
  }

  function dailyChart(daily) {
    const keys = Object.keys(daily).sort().slice(-30);
    if (keys.length < 2) return "";
    const W = 600, H = 160, padL = 30, padB = 22, padT = 10, padR = 10;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const pts = keys.map((k, i) => {
      const d = daily[k];
      const pct = d.total ? d.correct / d.total : 0;
      return [padL + (i / (keys.length - 1)) * innerW, padT + innerH - pct * innerH, Math.round(pct * 100)];
    });
    const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = `${path} L ${pts[pts.length - 1][0].toFixed(1)} ${padT + innerH} L ${pts[0][0].toFixed(1)} ${padT + innerH} Z`;
    const y85 = padT + innerH - 0.85 * innerH;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Точность задания дня по дням">
      ${[0, 50, 100].map(v => `<line class="grid-line" x1="${padL}" x2="${W - padR}" y1="${padT + innerH - (v / 100) * innerH}" y2="${padT + innerH - (v / 100) * innerH}"/><text x="${padL - 6}" y="${padT + innerH - (v / 100) * innerH + 3}" text-anchor="end">${v}%</text>`).join("")}
      <line class="pass-line" x1="${padL}" x2="${W - padR}" y1="${y85}" y2="${y85}"/>
      <path class="area" d="${area}"/>
      <path class="line" d="${path}"/>
      ${pts.map(p => `<circle class="dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3"><title>${p[2]}%</title></circle>`).join("")}
      <text x="${padL}" y="${H - 6}">${fmtDate(keys[0])}</text>
      <text x="${W - padR}" y="${H - 6}" text-anchor="end">${fmtDate(keys[keys.length - 1])}</text>
    </svg>`;
  }

  /* ---------- Строки таблиц ---------- */
  function row(name, sub, st, acts) {
    const pill = st.attempts ? `<span class="pill ${pillClass(st.accuracy)}">${st.accuracy}%</span>` : `<span class="muted small">не начато</span>`;
    return `
      <div class="stats-row">
        <div><div class="name">${esc(name)}</div><div class="sub">${esc(sub)}</div></div>
        <div>${pill}</div>
        <div class="acts">${acts}</div>
        <div class="meter" title="Пройдено ${st.seen} из ${st.total}"><i style="width:${st.coverage}%"></i></div>
      </div>`;
  }
  function trainBtns(key, extra) {
    const st = extra.st;
    const q = (mode) => `go('quiz',{key:'${key}',mode:'${mode}'${extra.cat ? `,cat:'${extra.cat}'` : ""}})`;
    return `<button class="btn btn-small" onclick="${q("quick")}">Тренировать</button>
      ${st.weak ? `<button class="btn btn-small btn-primary" onclick="${q("weak")}">Ошибки (${st.weak})</button>` : ""}`;
  }

  window.ROUTES.stats = function () {
    const view = document.getElementById("view");
    const topics = Object.keys(TOPICS).map(k => ({ key: k, t: TOPICS[k], st: aggregate(D[k]) }));
    const all = aggregate([].concat(...Object.keys(TOPICS).map(k => D[k])));
    const vs = S.getVocabStats(D.vocabulary);
    const daily = S.getDailyAll();
    const exams = S.getExams();
    const last20 = exams.slice(-20);
    const passed = exams.filter(e => e.passed).length;
    const dueTotal = topics.reduce((n, r) => n + r.st.due, 0);

    /* знаки по категориям и типам заданий */
    const signsByCat = Object.keys(CATS).map(cat => ({ cat, st: aggregate(D.signs.filter(q => q.entry && q.entry.cat === cat)) })).filter(r => r.st.total);
    const KINDS = { meaning: "Что означает знак", pick: "Найди знак по названию", category: "Тип знака", marking: "Разметка" };
    const signsByKind = Object.keys(KINDS).map(kind => ({ kind, st: aggregate(D.signsByKind[kind]) }));

    view.innerHTML = `
      <h1>Статистика</h1>
      <p class="lead muted">Профиль: <strong>${esc(S.getCurrentProfile())}</strong>. Ошибки возвращаются на повторение через 1 → 3 → 7 → 14 → 30 дней: чем увереннее ответ, тем реже вопрос.</p>

      <div class="card stats-section">
        <div class="stats-grid">
          <div class="stat-tile"><b>${all.attempts ? all.accuracy + "%" : "—"}</b><span>верных ответов</span></div>
          <div class="stat-tile"><b>${all.seen}<span class="muted">/${all.total}</span></b><span>вопросов пройдено</span></div>
          <div class="stat-tile"><b>${Object.keys(daily).length}</b><span>дней с заданием дня</span></div>
          <div class="stat-tile"><b>${S.getStreak()}</b><span>дней подряд</span></div>
          <div class="stat-tile"><b>${dueTotal}</b><span>к повторению сегодня</span></div>
          <div class="stat-tile"><b>${vs.seen}<span class="muted">/${vs.total}</span></b><span>слов из лексики</span></div>
        </div>
        ${dueTotal ? `<p style="margin:14px 0 0"><button class="btn btn-cta" onclick="go('mistakes')">Повторить сегодняшние (${dueTotal})</button></p>` : ""}
      </div>

      <div class="card stats-section">
        <h3>Пробные экзамены</h3>
        ${exams.length ? `
          <p class="muted small">Сдано ${passed} из ${exams.length}. Проходной балл: 38 из 45 (не больше 7 ошибок).</p>
          ${examChart(last20)}
          <div class="exam-list">
            ${last20.slice().reverse().slice(0, 5).map(e => `<div class="exam-row"><span>${new Date(e.at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })}</span><span>${e.correct}/${e.total}</span><span class="pill ${e.passed ? "good" : "bad"}">${e.passed ? "Bestått" : "Ikke bestått"}</span></div>`).join("")}
          </div>`
        : `<p class="muted">Экзаменов ещё не было.</p><button class="btn btn-cta" onclick="go('exam')">Начать экзамен</button>`}
      </div>

      ${Object.keys(daily).length >= 2 ? `
      <div class="card stats-section">
        <h3>Задание дня: точность по дням</h3>
        <p class="muted small">Последние 30 дней. Пунктир — ориентир 85 %.</p>
        ${dailyChart(daily)}
      </div>` : ""}

      <div class="card stats-section">
        <h3>По темам</h3>
        ${topics.map(r => row(r.t.title_ru, `${r.st.seen} из ${r.st.total}${r.st.due ? ` · к повторению ${r.st.due}` : ""}`, r.st, trainBtns(r.key, { st: r.st }))).join("")}
        ${row("Лексика", `${vs.seen} из ${vs.total} слов`, { attempts: vs.known + vs.unknown, accuracy: vs.accuracy, seen: vs.seen, total: vs.total, coverage: vs.coverage, weak: 0 }, `<button class="btn btn-small" onclick="go('vocab')">Карточки</button>`)}
      </div>

      <div class="card stats-section">
        <h3>Знаки по категориям</h3>
        ${signsByCat.map(r => row(CATS[r.cat].no, `${CATS[r.cat].ru} · ${r.st.seen} из ${r.st.total}`, r.st, trainBtns("signs", { st: r.st, cat: r.cat }))).join("")}
      </div>

      <div class="card stats-section">
        <h3>Знаки по типу задания</h3>
        ${signsByKind.map(r => row(KINDS[r.kind], `${r.st.seen} из ${r.st.total}`, r.st, `<button class="btn btn-small" onclick="go('quiz',{key:'signs',mode:'${r.kind}'})">Тренировать</button>`)).join("")}
      </div>`;
  };
})();
