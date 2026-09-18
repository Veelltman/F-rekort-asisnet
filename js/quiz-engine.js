/* Квиз-движок: показывает вопросы, проверяет ответы, даёт фидбек и пишет прогресс.
   Вопрос может иметь fresh() — тогда варианты подбираются заново при каждом показе. */

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

  function instance(q) {
    return q.fresh ? q.fresh() : q;
  }

  function start(container, questions, cfg) {
    cfg = cfg || {};
    const session = {
      questions: cfg.keepOrder ? questions.slice() : shuffle(questions),
      index: 0,
      correct: 0,
      mistakes: [],
      showRu: false
    };

    function renderQuestion() {
      const base = session.questions[session.index];
      const q = instance(base);
      const options = shuffle(q.options);
      const total = session.questions.length;
      const pct = Math.round((session.index / total) * 100);

      container.innerHTML = `
        <div class="quiz">
          <div class="quiz-head">
            <button class="btn btn-ghost" data-action="exit">${esc(cfg.exitLabel || "Выйти")}</button>
            <div class="quiz-meta">
              <span class="quiz-title">${esc(cfg.title || "")}</span>
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

            <div class="options ${q.imageOptions ? "options-images" : ""}">
              ${options.map((o, i) => `
                <button class="option ${o.image ? "option-image" : ""}" data-action="answer" data-index="${i}">
                  <span class="option-letter">${"ABCD"[i]}</span>
                  ${o.image ? `<span class="option-pic">${o.image}</span>` : ""}
                  <span class="option-body ${o.image ? "option-body-hidden" : ""}">
                    <span class="lang-no">${esc(o.text_no)}</span>
                    <span class="lang-ru ${session.showRu ? "" : "hidden"}">${esc(o.text_ru)}</span>
                  </span>
                </button>`).join("")}
            </div>

            <div class="feedback hidden"></div>
          </div>
        </div>`;

      container.querySelector("[data-action=exit]").onclick = () => cfg.onExit && cfg.onExit();
      container.querySelector("[data-action=toggle-ru]").onclick = () => {
        session.showRu = !session.showRu;
        container.querySelectorAll(".lang-ru").forEach(el => el.classList.toggle("hidden", !session.showRu));
        container.querySelector("[data-action=toggle-ru]").textContent =
          session.showRu ? "Скрыть перевод" : "Показать перевод";
      };
      container.querySelectorAll("[data-action=answer]").forEach(btn => {
        btn.onclick = () => answer(base, q, options, Number(btn.dataset.index));
      });
    }

    function answer(base, q, options, chosenIdx) {
      const chosen = options[chosenIdx];
      const isCorrect = !!chosen.correct;
      if (isCorrect) session.correct += 1; else session.mistakes.push({ base, q, chosen });
      window.Storage.recordAnswer(base, isCorrect);

      container.querySelectorAll("[data-action=answer]").forEach((btn, i) => {
        btn.disabled = true;
        btn.querySelector(".option-body")?.classList.remove("option-body-hidden");
        if (options[i].correct) btn.classList.add("is-correct");
        else if (i === chosenIdx) btn.classList.add("is-wrong");
      });

      const fb = container.querySelector(".feedback");
      const isLast = session.index >= session.questions.length - 1;
      fb.classList.remove("hidden");
      fb.classList.add(isCorrect ? "feedback-ok" : "feedback-fail");
      fb.innerHTML = `
        <div class="feedback-title">${isCorrect ? "Riktig! — Верно!" : "Feil — Неверно"}</div>
        <p class="lang-no">${esc(q.explanation_no)}</p>
        <p class="lang-ru-always">${esc(q.explanation_ru)}</p>
        ${!isCorrect && q.tip_ru ? `<div class="tip"><strong>Как исправить:</strong> ${esc(q.tip_ru)}</div>` : ""}
        <button class="btn btn-primary" data-action="next">${isLast ? "Показать результат" : "Neste <small>дальше</small>"}</button>`;
      fb.querySelector("[data-action=next]").onclick = next;
      fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function next() {
      session.index += 1;
      if (session.index >= session.questions.length) renderResult();
      else renderQuestion();
    }

    function renderResult() {
      const total = session.questions.length;
      const pct = Math.round((session.correct / total) * 100);
      const grade = pct >= 85 ? "Отлично. На экзамене нужно не меньше 85% верных." :
                    pct >= 70 ? "Неплохо, но до экзаменационного порога (85%) ещё есть запас." :
                    "Тема пока слабая. Пройди ошибки ниже и повтори.";

      if (cfg.onFinish) cfg.onFinish({ correct: session.correct, total });

      container.innerHTML = `
        <div class="quiz">
          <div class="card result-card">
            <h2>Resultat — Результат</h2>
            <div class="result-score ${pct >= 85 ? "good" : pct >= 70 ? "mid" : "bad"}">
              <span class="result-pct">${pct}%</span>
              <span class="result-sub">${session.correct} из ${total} верно</span>
            </div>
            <p class="result-grade">${grade}</p>
            <div class="result-actions">
              ${session.mistakes.length ? `<button class="btn btn-primary" data-action="retry-mistakes">Повторить ошибки (${session.mistakes.length})</button>` : ""}
              ${cfg.noRestart ? "" : `<button class="btn" data-action="restart">Пройти ещё раз</button>`}
              <button class="btn btn-ghost" data-action="exit">${esc(cfg.exitLabel || "Выйти")}</button>
            </div>
          </div>

          ${session.mistakes.length ? `
          <h3 class="section-title">Разбор ошибок</h3>
          ${session.mistakes.map(m => {
            const right = m.q.options.find(o => o.correct);
            return `
            <div class="card mistake-card">
              ${m.q.image ? `<div class="mistake-image">${m.q.image}</div>` : right.image ? `<div class="mistake-image">${right.image}</div>` : ""}
              <div class="mistake-body">
                <p class="lang-no"><strong>${esc(m.q.prompt_no)}</strong></p>
                <p class="lang-ru-always muted">${esc(m.q.prompt_ru)}</p>
                <p class="mistake-line wrong">Ты выбрал: ${esc(m.chosen.text_no)} (${esc(m.chosen.text_ru)})</p>
                <p class="mistake-line right">Правильно: ${esc(right.text_no)} (${esc(right.text_ru)})</p>
                <p class="lang-ru-always">${esc(m.q.explanation_ru)}</p>
                ${m.q.tip_ru ? `<div class="tip"><strong>Как исправить:</strong> ${esc(m.q.tip_ru)}</div>` : ""}
              </div>
            </div>`;
          }).join("")}` : `
          <div class="card"><p>Без единой ошибки. Så bra!</p></div>`}
        </div>`;

      const retry = container.querySelector("[data-action=retry-mistakes]");
      if (retry) retry.onclick = () => start(container, session.mistakes.map(m => m.base), Object.assign({}, cfg, { onFinish: null, noRestart: false }));
      const restart = container.querySelector("[data-action=restart]");
      if (restart) restart.onclick = () => start(container, questions, cfg);
      container.querySelector("[data-action=exit]").onclick = () => cfg.onExit && cfg.onExit();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    renderQuestion();
    window.scrollTo({ top: 0 });
  }

  window.QuizEngine = { start, shuffle, esc };
})();
