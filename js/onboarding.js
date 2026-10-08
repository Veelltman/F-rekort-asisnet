/* Экран приветствия: три слайда для нового человека. Показывается один раз.
   Тем, у кого на устройстве уже есть прогресс или вход в облако, не показывается вовсе —
   друзья, которые уже занимаются, его не увидят. Открыть снова: меню профиля → «Как пользоваться». */

(function () {
  "use strict";

  const KEY = "forerkort-onboarded";
  const t = window.I18N.t;
  const icon = window.UI.icon;
  const LOGO = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M24 53 L42 71 L77 31" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 71 L77 31" fill="none" stroke="#F2B705" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="7 6.5" stroke-dashoffset="-4"/></svg>`;
  const LANG_NAMES = { ru: ["Русский", "RU"], uk: ["Українська", "UA"], en: ["English", "EN"], no: ["Norsk", "NO"] };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  /* Есть ли на устройстве следы занятий */
  function hasHistory() {
    if (get("forerkort-cloud-session")) return true;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || k.indexOf("forerkort-trener-v1") !== 0) continue;
        const s = JSON.parse(localStorage.getItem(k) || "null");
        if (s && (Object.keys(s.answers || {}).length || Object.keys(s.vocab || {}).length || Object.keys(s.daily || {}).length)) return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  let step = 0, el = null;

  function slides() {
    const lang = window.I18N.lang;
    return [
      {
        art: LOGO,
        title: t("Добро пожаловать в Teoriklar"),
        body: `<p>${t("Тренажёр к теории на права класса B в Норвегии: знаки, ситуации на дороге, правила и пробный экзамен, как на trafikkstasjonen.")}</p>`
      },
      {
        art: icon("check"),
        title: t("Как это работает"),
        body: `<ol class="onboard-points">
          <li><span class="num">1</span><span>${t("Читай вопрос на норвежском. Перевод открывается по кнопке.")}</span></li>
          <li><span class="num">2</span><span>${t("Выбери ответ и нажми «Sjekk» — сразу увидишь разбор.")}</span></li>
          <li><span class="num">3</span><span>${t("Ошибки вернутся на повторение через 1, 3, 7, 14 и 30 дней.")}</span></li>
        </ol>`
      },
      {
        art: icon("translate"),
        title: t("Язык интерфейса"),
        body: `<p>${t("Задания всегда на норвежском, как на экзамене. Выбери язык меню и подсказок.")}</p>
          <div class="onboard-langs">${Object.keys(LANG_NAMES).map(k => `<button type="button" class="onboard-lang ${k === lang ? "active" : ""}" data-lang="${k}">${LANG_NAMES[k][0]}<small>${LANG_NAMES[k][1]}</small></button>`).join("")}</div>`
      }
    ];
  }

  function render() {
    const all = slides();
    const s = all[step];
    const last = step === all.length - 1;
    const canLogin = window.Cloud && window.Cloud.enabled && !window.Cloud.isLoggedIn();
    el.innerHTML = `
      <div class="onboard-top">
        <span class="onboard-brand">Teoriklar</span>
        ${last ? "<span></span>" : `<button type="button" class="onboard-skip" data-act="skip">${t("Пропустить")}</button>`}
      </div>
      <div class="onboard-body">
        <div class="onboard-slide">
          <div class="onboard-art">${s.art}</div>
          <h1>${s.title}</h1>
          ${s.body}
        </div>
      </div>
      <div class="onboard-foot">
        <div class="onboard-dots" aria-hidden="true">${all.map((_, i) => `<i class="${i === step ? "on" : ""}"></i>`).join("")}</div>
        <button type="button" class="btn btn-cta" data-act="next">${last ? t("Начать") : t("Далее")}</button>
        ${last && canLogin ? `<button type="button" class="btn btn-ghost" data-act="login">${t("У меня есть аккаунт — войти")}</button>` : ""}
      </div>`;
    el.querySelector("[data-act=next]").onclick = () => { if (last) close(); else { step += 1; render(); } };
    const skip = el.querySelector("[data-act=skip]");
    if (skip) skip.onclick = close;
    const login = el.querySelector("[data-act=login]");
    if (login) login.onclick = () => { close(); window.go("login"); };
    el.querySelectorAll("[data-lang]").forEach(b => {
      b.onclick = () => { window.I18N.setLang(b.dataset.lang); render(); };
    });
  }

  function onKey(e) {
    if (!el) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); el.querySelector("[data-act=next]").click(); }
    else if (e.key === "ArrowLeft" && step > 0) { step -= 1; render(); }
  }

  /* Свайп влево/вправо между слайдами */
  let touchX = null;
  function onTouchStart(e) { touchX = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0 && step < slides().length - 1) { step += 1; render(); }
    else if (dx > 0 && step > 0) { step -= 1; render(); }
  }

  function show() {
    if (el) return;
    step = 0;
    el = document.createElement("div");
    el.className = "onboard";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Teoriklar");
    document.body.appendChild(el);
    document.body.classList.add("onboarding");
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("keydown", onKey, true);
    render();
  }

  function close() {
    set(KEY, "1");
    if (!el) return;
    document.removeEventListener("keydown", onKey, true);
    el.remove();
    el = null;
    document.body.classList.remove("onboarding");
  }

  window.Onboarding = { show, close };

  if (!get(KEY)) {
    if (hasHistory()) set(KEY, "1");
    else show();
  }
})();
