/* PWA: регистрация service worker, тост «Доступно обновление», кнопка установки,
   загрузка знаков и звука для офлайна. */

(function () {
  "use strict";

  const PWA = { installEvent: null, updateReady: null };
  window.PWA = PWA;

  PWA.isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  PWA.isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
  PWA.canInstall = () => !!PWA.installEvent;

  /* ---------- Тост ---------- */
  /* Тост. Обычный исчезает сам через 4 с и не трогает тост обновления (kind = "update"), который висит до действия. */
  function toast(text, actionLabel, onAction, kind) {
    document.querySelectorAll(".toast" + (kind === "update" ? ".toast-update" : ":not(.toast-update)")).forEach(t => t.remove());
    const el = document.createElement("div");
    el.className = "toast" + (kind === "update" ? " toast-update" : "");
    if (kind !== "update") setTimeout(() => el.remove(), 4000);
    el.innerHTML = `<span>${text}</span>${actionLabel ? `<button class="btn btn-small btn-primary">${actionLabel}</button>` : ""}<button class="toast-close" aria-label="Закрыть">×</button>`;
    document.body.appendChild(el);
    if (actionLabel) el.querySelector(".btn").onclick = () => { onAction(); el.remove(); };
    el.querySelector(".toast-close").onclick = () => el.remove();
    return el;
  }
  PWA.toast = toast;

  /* ---------- Service worker и обновления ---------- */
  let reloading = false;
  function offerUpdate(reg) {
    PWA.updateReady = reg;
    toast("Доступно обновление сайта", "Обновить", () => {
      if (window.ROUTE_GUARD && !window.ROUTE_GUARD()) return;
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }, "update");
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").then(reg => {
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) offerUpdate(reg);
        });
      });
      /* проверять обновления при возврате во вкладку */
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }

  /* ---------- Установка ---------- */
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    PWA.installEvent = e;
    if (window.refreshView) window.refreshView();
  });
  window.addEventListener("appinstalled", () => {
    PWA.installEvent = null;
    toast("Приложение установлено");
    if (window.refreshView) window.refreshView();
  });
  PWA.install = async () => {
    const ev = PWA.installEvent;
    if (!ev) return;
    ev.prompt();
    try { await ev.userChoice; } catch (e) { /* ignore */ }
    PWA.installEvent = null;
    if (window.refreshView) window.refreshView();
  };

  /* Карточка «Установить» для главной: Android/Chrome — кнопка, iOS — подсказка */
  PWA.installCardHtml = () => {
    if (PWA.isStandalone()) return "";
    if (PWA.canInstall()) {
      return `<div class="card install-card"><div><h3>Установить приложение</h3><p class="muted">Иконка на экране, полный экран, работа без интернета.</p></div><button class="btn btn-primary" onclick="PWA.install()">Установить</button></div>`;
    }
    if (PWA.isIOS()) {
      return `<div class="card install-card"><div><h3>На экран «Домой»</h3><p class="muted">В Safari нажми «Поделиться» → «На экран “Домой”». Тогда сайт откроется как приложение и прогресс не удалится.</p></div></div>`;
    }
    return "";
  };

  /* ---------- Офлайн-пакет: знаки и звук ---------- */
  async function cacheList(urls, onProgress) {
    if (!("caches" in window)) throw new Error("Кэш недоступен в этом браузере");
    const c = await caches.open("forerkort-assets");
    let done = 0;
    for (let i = 0; i < urls.length; i += 20) {
      const chunk = urls.slice(i, i + 20);
      await Promise.all(chunk.map(async u => {
        const hit = await c.match(u);
        if (!hit) { const res = await fetch(u); if (res.ok) await c.put(u, res); }
        done += 1;
        if (onProgress) onProgress(done, urls.length);
      }));
    }
  }
  PWA.downloadSigns = (onProgress) => cacheList(window.SIGN_CATALOG.LIST.map(e => "img/signs/" + e.file), onProgress);
  PWA.downloadAudio = (onProgress) => {
    const words = (window.QUESTION_DATA && window.QUESTION_DATA.vocabulary) || [];
    const urls = [];
    words.forEach(w => { urls.push(`audio/vocab/${w.id}-pernille.mp3`); urls.push(`audio/vocab/${w.id}-finn.mp3`); });
    return cacheList(urls, onProgress);
  };
  PWA.offlineStatus = async () => {
    if (!("caches" in window)) return { signs: 0, audio: 0 };
    const c = await caches.open("forerkort-assets");
    const keys = await c.keys();
    return {
      signs: keys.filter(r => r.url.includes("/img/signs/")).length,
      audio: keys.filter(r => r.url.includes("/audio/vocab/")).length
    };
  };
  PWA.runDownload = async (kind, btn) => {
    const fn = kind === "audio" ? PWA.downloadAudio : PWA.downloadSigns;
    const label = btn.textContent;
    btn.disabled = true;
    try {
      await fn((d, n) => { btn.textContent = `Загружаю… ${d}/${n}`; });
      btn.textContent = "Готово ✓";
      toast(kind === "audio" ? "Озвучка сохранена для офлайна" : "Все знаки сохранены для офлайна");
    } catch (e) {
      btn.textContent = label; btn.disabled = false;
      toast("Не удалось загрузить: " + (e.message || e));
    }
  };
})();
