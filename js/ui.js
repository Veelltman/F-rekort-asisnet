/* Общие элементы интерфейса: иконки из спрайта в index.html, заголовок страницы, строки списка,
   кольцо прогресса. Всё возвращает HTML-строки, как и остальные экраны. */

(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* Линейная иконка 24×24 из <svg id="icon-sprite"> */
  function icon(name, cls) {
    return `<svg class="ic ${cls || ""}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  /* Заголовок экрана: ‹ назад, значок темы, заголовок, подпись.
     back = { label, action } — action это строка для onclick, как и в остальном коде */
  function pageHead(o) {
    return `
      <header class="page-head">
        ${o.back ? `<button class="back-link" type="button" onclick="${o.back.action}">${icon("chevron-left")}<span>${esc(o.back.label)}</span></button>` : ""}
        <div class="page-title-row">
          ${o.icon ? `<div class="tile-icon tile-icon-lg">${o.icon}</div>` : ""}
          <div class="page-title-text">
            ${o.eyebrow ? `<p class="eyebrow">${esc(o.eyebrow)}</p>` : ""}
            <h1>${esc(o.title)}</h1>
            ${o.sub ? `<p class="page-sub">${o.sub}</p>` : ""}
          </div>
        </div>
      </header>`;
  }

  /* Строка списка: значок · название · подпись · справа метка · ›. Неактивная — без перехода. */
  function listRow(o) {
    const pct = o.progress != null ? Math.max(0, Math.min(100, o.progress)) : null;
    return `
      <button type="button" class="list-row ${o.primary ? "list-row-primary" : ""}" ${o.disabled ? "disabled" : `onclick="${o.action}"`}>
        ${o.icon ? `<span class="tile-icon">${o.icon}</span>` : ""}
        <span class="list-row-body">
          <span class="list-row-title">${esc(o.title)}${o.badge ? ` ${o.badge}` : ""}</span>
          ${o.sub ? `<span class="list-row-sub">${o.sub}</span>` : ""}
          ${pct != null ? `<span class="meter" aria-hidden="true"><i style="width:${pct}%"></i></span>` : ""}
        </span>
        ${o.meta ? `<span class="list-row-meta">${o.meta}</span>` : ""}
        ${o.disabled ? "" : icon("chevron-right", "list-row-chevron")}
      </button>`;
  }

  /* Кольцо прогресса 0–100 */
  function ring(pct, size, cls) {
    const r = 42, c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, pct || 0));
    return `
      <div class="ring ${cls || ""}" style="width:${size}px;height:${size}px" role="img" aria-label="${p}%">
        <svg viewBox="0 0 100 100">
          <circle class="ring-track" cx="50" cy="50" r="${r}"/>
          <circle class="ring-value" cx="50" cy="50" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p / 100)).toFixed(1)}" transform="rotate(-90 50 50)"/>
        </svg>
        <span class="ring-label">${Math.round(p)}<small>%</small></span>
      </div>`;
  }

  /* Короткое появление экрана после смены маршрута */
  function enter(el) {
    if (!el) return;
    el.classList.remove("view-enter");
    void el.offsetWidth;
    el.classList.add("view-enter");
  }

  window.UI = { icon, pageHead, listRow, ring, enter, esc };
})();
