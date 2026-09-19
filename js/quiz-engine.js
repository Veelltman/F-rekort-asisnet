/* Квиз-движок.
   Тренировка: выбрал ответ → «Sjekk» → объяснение → стрелками вперёд/назад.
   Экзамен (cfg.exam): без подсказок по ходу, свободная навигация, «Lever» в конце, таймер.
   Вопрос может иметь fresh() — варианты подбираются при первом показе и запоминаются на сессию. */

(function () {
  "use strict";

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const ARROW_L = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`;
  const ARROW_R = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`;

  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function start(container, questions, cfg) {
    cfg = cfg || {};
    const exam = !!cfg.exam;
    const session = {
      items: (cfg.keepOrder ? questions.slice() : shuffle(questions)).map(base => ({ base, inst: null, options: null, selected: null, checked: false })),
      index: 0,
      showRu: false,
      finished: false,
      timer: null,
      secondsLeft: cfg.timeLimit || 0
    };

    function item(i) {
      const it = session.items[i];
      if (!it.inst) {
        it.inst = it.base.fresh ? it.base.fresh() : it.base;
        it.options = shuffle(it.inst.options);
      }
      return it;
    }

    function stopTimer() { if (session.timer) { clearInterval(session.timer); session.timer = null; } }

    function startTimer() {
      if (!session.secondsLeft || session.timer) return;
      session.timer = setInterval(() => {
        session.secondsLeft -= 1;
        const el = container.querySelector(".quiz-timer");
        if (el) {
          el.textContent = fmtTime(session.secondsLeft);
          el.classList.toggle("warn", session.secondsLeft < 300);
        }
        if (session.secondsLeft <= 0) { stopTimer(); finish(); }
      }, 1000);
    }

    function renderQuestion() {
      const it = item(session.index);
      const q = it.inst;
      const total = session.items.length;
      const answered = session.items.filter(x => exam ? x.selected != null : x.checked).length;
      const pct = Math.round((answered / total) * 100);
      const revealed = !exam && it.checked;

      container.innerHTML = `
        <div class="quiz">
          <div class="quiz-head">
            <button class="btn btn-ghost" data-action="exit">${esc(cfg.exitLabel || "Выйти")}</button>
            <div class="quiz-meta">
              <span class="quiz-title">${esc(cfg.title || "")}</span>
              ${session.secondsLeft ? `<span class="quiz-timer ${session.secondsLeft < 300 ? "warn" : ""}">${fmtTime(session.secondsLeft)}</span>` : ""}
              <span class="quiz-counter">${session.index + 1} / ${total}</span>
            </div>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>

          <div class="card question-card">
            ${q.image ? `<div class="question-image">${q.image}</div>` : ""}
            <div class="question-text">
              <p class="lang-no">${esc(q.prompt_no)}</p>
              <p class="lang-ru ${session.showRu ? "" : "hidden"}">${esc(q.prompt_ru)}</p>
            </div>
            <button class="btn btn-small btn-translate" data-action="toggle-ru">
              ${session.showRu ? "Скрыть перевод" : "Показать перевод"}
            </button>

            <div class="options ${q.imageOptions ? "options-images" : ""} ${revealed ? "revealed" : ""}">
              ${it.options.map((o, i) => {
                const cls = ["option", o.image ? "option-image" : "", i === it.selected ? "is-selected" : ""];
                if (revealed) { if (o.correct) cls.push("is-correct"); else if (i === it.selected) cls.push("is-wrong"); }
                return `
                <button class="${cls.join(" ")}" data-action="select" data-index="${i}" ${revealed ? "disabled" : ""}>
                  <span class="option-letter">${"ABCD"[i]}</span>
                  ${o.image ? `<span class="option-pic">${o.image}</span>` : ""}
                  <span class="option-body ${o.image && !revealed ? "option-body-hidden" : ""}">
                    <span class="lang-no">${esc(o.text_no)}</span>
                    <span class="lang-ru ${session.showRu ? "" : "hidden"}">${esc(o.text_ru)}</span>
                  </span>
                </button>`;
              }).join("")}
            </div>

            ${!exam && !it.checked ? `
              <div class="check-row">
                <button class="btn btn-primary btn-check" data-action="check" ${it.selected == null ? "disabled" : ""}>Sjekk <small>проверить</small></button>
              </div>` : ""}

            ${revealed ? feedbackHtml(it) : ""}
          </div>

          <div class="quiz-nav">
            <button class="btn nav-btn" data-action="prev" ${session.index === 0 ? "disabled" : ""} aria-label="Предыдущий вопрос">${ARROW_L}</button>
            <span class="nav-status">${exam ? `отвечено ${answered} из ${total}` : `${answered} из ${total} проверено`}</span>
            ${exam && session.index === total - 1
              ? `<button class="btn btn-primary" data-action="finish">Lever <small>сдать</small></button>`
              : !exam && session.index === total - 1
                ? `<button class="btn btn-primary" data-action="finish" ${it.checked ? "" : "disabled"}>Resultat</button>`
                : `<button class="btn nav-btn" data-action="next" ${(!exam && !it.checked) ? "disabled" : ""} aria-label="Следующий вопрос">${ARROW_R}</button>`}
          </div>
          ${exam ? `<p class="exam-hint muted">Ответы можно менять до сдачи. Кнопка «Lever» на последнем вопросе.</p>` : ""}
          <p class="key-hint muted">Клавиатура: 1–4 или A–D — выбрать, Enter — проверить / дальше, ← → — переход, T — перевод, S — озвучить</p>
        </div>`;

      if (window.Speech && Speech.available()) {
        const qt = container.querySelector(".question-text");
        qt.appendChild(Speech.button(() => q.prompt_no + " " + it.options.map((o, i) => "ABCD"[i] + ". " + o.text_no).join(". "), "q-speak"));
      }
      container.querySelector("[data-action=exit]").onclick = () => {
        if (cfg.confirmExit && !confirm(cfg.confirmExit)) return;
        stopTimer(); cfg.onExit && cfg.onExit();
      };
      container.querySelector("[data-action=toggle-ru]").onclick = () => {
        session.showRu = !session.showRu;
        container.querySelectorAll(".lang-ru").forEach(el => el.classList.toggle("hidden", !session.showRu));
        container.querySelector("[data-action=toggle-ru]").textContent = session.showRu ? "Скрыть перевод" : "Показать перевод";
      };
      container.querySelectorAll("[data-action=select]").forEach(btn => {
        btn.onclick = () => {
          it.selected = Number(btn.dataset.index);
          container.querySelectorAll("[data-action=select]").forEach((b, i) => b.classList.toggle("is-selected", i === it.selected));
          const check = container.querySelector("[data-action=check]");
          if (check) check.disabled = false;
          if (exam) {
            const st = container.querySelector(".nav-status");
            const n = session.items.filter(x => x.selected != null).length;
            if (st) st.textContent = `отвечено ${n} из ${total}`;
            container.querySelector(".progress-bar").style.width = Math.round((n / total) * 100) + "%";
          }
        };
      });
      const check = container.querySelector("[data-action=check]");
      if (check) check.onclick = () => {
        if (it.selected == null) return;
        it.checked = true;
        session.showRu = false;
        window.Storage.recordAnswer(it.base, !!it.options[it.selected].correct);
        renderQuestion();
        const fb = container.querySelector(".feedback");
        if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
      };
      const prev = container.querySelector("[data-action=prev]");
      if (prev) prev.onclick = () => { if (session.index > 0) { session.index -= 1; session.showRu = false; renderQuestion(); } };
      const next = container.querySelector("[data-action=next]");
      if (next) next.onclick = () => { if (session.index < total - 1) { session.index += 1; session.showRu = false; renderQuestion(); } };
      const fin = container.querySelector("[data-action=finish]");
      if (fin) fin.onclick = () => {
        if (exam) {
          const un = session.items.filter(x => x.selected == null).length;
          if (un && !confirm(`Без ответа: ${un}. Они будут засчитаны как ошибки. Сдать?`)) return;
        }
        finish();
      };
      window.scrollTo({ top: 0 });
      startTimer();

      document.onkeydown = ev => {
        if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
        const k = ev.key;
        if (/^[1-4]$/.test(k) || /^[a-dA-D]$/.test(k)) {
          const idx = /^[1-4]$/.test(k) ? Number(k) - 1 : "abcd".indexOf(k.toLowerCase());
          const btn = container.querySelectorAll("[data-action=select]")[idx];
          if (btn && !btn.disabled) { ev.preventDefault(); btn.click(); }
        } else if (k === "Enter" || k === " ") {
          const chk = container.querySelector("[data-action=check]");
          const nxt = container.querySelector("[data-action=next]");
          const fin = container.querySelector("[data-action=finish]");
          ev.preventDefault();
          if (chk && !chk.disabled) chk.click();
          else if (nxt && !nxt.disabled) nxt.click();
          else if (fin && !fin.disabled && exam === false) fin.click();
        } else if (k === "ArrowRight") {
          const nxt = container.querySelector("[data-action=next]");
          if (nxt && !nxt.disabled) { ev.preventDefault(); nxt.click(); }
        } else if (k === "ArrowLeft") {
          const prv = container.querySelector("[data-action=prev]");
          if (prv && !prv.disabled) { ev.preventDefault(); prv.click(); }
        } else if (k.toLowerCase() === "t" || k.toLowerCase() === "е") {
          container.querySelector("[data-action=toggle-ru]").click();
        } else if (k.toLowerCase() === "s" || k.toLowerCase() === "ы") {
          const b = container.querySelector(".q-speak"); if (b) b.click();
        }
      };
    }

    function feedbackHtml(it) {
      const q = it.inst;
      const ok = !!it.options[it.selected].correct;
      return `
        <div class="feedback ${ok ? "feedback-ok" : "feedback-fail"}">
          <div class="feedback-title">${ok ? "Riktig! — Верно!" : "Feil — Неверно"}</div>
          <p class="lang-no">${esc(q.explanation_no)}</p>
          <p class="lang-ru-always">${esc(q.explanation_ru)}</p>
          ${!ok && q.tip_ru ? `<div class="tip"><strong>Как исправить:</strong> ${esc(q.tip_ru)}</div>` : ""}
        </div>`;
    }

    function finish() {
      if (session.finished) return;
      session.finished = true;
      stopTimer();
      session.items.forEach((it, i) => { item(i); });
      if (exam) {
        session.items.forEach(it => {
          const ok = it.selected != null && !!it.options[it.selected].correct;
          window.Storage.recordAnswer(it.base, ok);
        });
      }
      renderResult();
    }

    function renderResult() {
      const total = session.items.length;
      const results = session.items.map(it => {
        const chosen = it.selected != null ? it.options[it.selected] : null;
        const right = it.options.find(o => o.correct);
        return { it, chosen, right, ok: !!(chosen && chosen.correct) };
      });
      const correct = results.filter(r => r.ok).length;
      const wrong = total - correct;
      const pct = Math.round((correct / total) * 100);
      const maxWrong = cfg.maxWrong != null ? cfg.maxWrong : null;
      const passed = maxWrong != null ? wrong <= maxWrong : pct >= 85;
      const grade = exam
        ? (passed ? `Bestått! Ошибок ${wrong}, допускается ${maxWrong}.` : `Ikke bestått. Ошибок ${wrong}, допускается не больше ${maxWrong}.`)
        : pct >= 85 ? "Отлично. На экзамене нужно не меньше 85% верных."
        : pct >= 70 ? "Неплохо, но до экзаменационного порога (85%) ещё есть запас."
        : "Тема пока слабая. Пройди ошибки ниже и повтори.";

      document.onkeydown = null;
      if (cfg.onFinish) cfg.onFinish({ correct, total, passed });

      const mistakes = results.filter(r => !r.ok);
      container.innerHTML = `
        <div class="quiz">
          <div class="card result-card">
            <h2>${exam ? (passed ? "Bestått" : "Ikke bestått") : "Resultat — Результат"}</h2>
            <div class="result-score ${passed ? "good" : pct >= 70 ? "mid" : "bad"}">
              <span class="result-pct">${exam ? `${correct}/${total}` : `${pct}%`}</span>
              <span class="result-sub">${correct} верно, ${wrong} ${wrong === 1 ? "ошибка" : wrong < 5 ? "ошибки" : "ошибок"}</span>
            </div>
            <p class="result-grade">${grade}</p>
            <div class="result-actions">
              ${mistakes.length ? `<button class="btn btn-primary" data-action="retry-mistakes">Повторить ошибки (${mistakes.length})</button>` : ""}
              ${cfg.noRestart ? "" : `<button class="btn" data-action="restart">${exam ? "Новый экзамен" : "Пройти ещё раз"}</button>`}
              <button class="btn btn-ghost" data-action="exit">${esc(cfg.exitLabel || "Выйти")}</button>
            </div>
          </div>

          <div class="review-head">
            <h3 class="section-title">Обзор всех вопросов</h3>
            <label class="review-filter"><input type="checkbox" id="only-wrong" ${mistakes.length ? "" : "disabled"}> только ошибки</label>
          </div>
          <div class="review-list">
          ${results.map((r, i) => `
            <div class="card review-card ${r.ok ? "review-ok" : "review-fail"}" data-ok="${r.ok}">
              <div class="review-mark">${r.ok ? "✓" : "✗"}<span>${i + 1}</span></div>
              ${r.it.inst.image ? `<div class="mistake-image">${r.it.inst.image}</div>` : r.right.image ? `<div class="mistake-image">${r.right.image}</div>` : ""}
              <div class="mistake-body">
                <p class="lang-no"><strong>${esc(r.it.inst.prompt_no)}</strong></p>
                <p class="lang-ru-always muted">${esc(r.it.inst.prompt_ru)}</p>
                ${r.ok
                  ? `<p class="mistake-line right">Твой ответ: ${esc(r.right.text_no)} (${esc(r.right.text_ru)})</p>`
                  : `<p class="mistake-line wrong">Твой ответ: ${r.chosen ? `${esc(r.chosen.text_no)} (${esc(r.chosen.text_ru)})` : "без ответа"}</p>
                     <p class="mistake-line right">Правильно: ${esc(r.right.text_no)} (${esc(r.right.text_ru)})</p>`}
                <p class="lang-ru-always">${esc(r.it.inst.explanation_ru)}</p>
                ${!r.ok && r.it.inst.tip_ru ? `<div class="tip"><strong>Как исправить:</strong> ${esc(r.it.inst.tip_ru)}</div>` : ""}
              </div>
            </div>`).join("")}
          </div>
        </div>`;

      const only = container.querySelector("#only-wrong");
      if (only) only.onchange = () => {
        container.querySelectorAll(".review-card").forEach(c => c.classList.toggle("hidden", only.checked && c.dataset.ok === "true"));
      };
      const retry = container.querySelector("[data-action=retry-mistakes]");
      if (retry) retry.onclick = () => start(container, mistakes.map(r => r.it.base), Object.assign({}, cfg, { exam: false, timeLimit: 0, maxWrong: null, onFinish: null, noRestart: false, title: "Повторение ошибок" }));
      const restart = container.querySelector("[data-action=restart]");
      if (restart) restart.onclick = () => (cfg.onRestart ? cfg.onRestart() : start(container, questions, cfg));
      container.querySelector("[data-action=exit]").onclick = () => cfg.onExit && cfg.onExit();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    renderQuestion();
  }

  window.QuizEngine = { start, shuffle, esc };
})();
