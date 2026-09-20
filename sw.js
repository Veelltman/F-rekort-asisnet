/* Service worker.
   - Оболочка сайта (html/js/css) кэшируется под версией APP_VERSION — те же URL с ?v=, что в index.html,
     поэтому офлайн работает по-настоящему. Версию меняет scripts/bump-version.js.
   - Картинки знаков и звук — отдельный долгоживущий кэш: отдаём из кэша, при промахе тянем из сети.
   - Новая версия не подменяет старую молча: ждёт сообщения SKIP_WAITING от страницы (тост «Обновить»). */

const APP_VERSION = "mu9yp43f";
const SHELL_CACHE = "forerkort-shell-" + APP_VERSION;
const ASSET_CACHE = "forerkort-assets";

const SHELL_FILES = [
  "./css/styles.css",
  "./js/icons/signs-svg.js", "./js/data/signs-catalog.js", "./js/data/signs.js",
  "./js/data/situational.js", "./js/data/rules.js", "./js/data/generated.js",
  "./js/data/vocabulary.js", "./js/speech.js", "./js/merge.js", "./js/storage.js", "./js/cloud.js",
  "./js/quiz-engine.js", "./js/app.js", "./js/stats.js", "./js/pwa.js", "./js/teacher.js", "./js/teacher-ui.js"
];
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png"]
  .concat(SHELL_FILES.map(f => f + "?v=" + APP_VERSION));

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL_CACHE && k !== ASSET_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

function isAsset(url) {
  return /\/(img|audio|icons)\//.test(url.pathname);
}

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (isAsset(url)) {
    /* картинки и звук: сначала кэш, потом сеть */
    e.respondWith(
      caches.open(ASSET_CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if (res.ok) c.put(e.request, res.clone());
        return res;
      })))
    );
    return;
  }

  /* оболочка: сначала сеть (свежие данные), запасной вариант — кэш */
  const fresh = /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/");
  e.respondWith(
    fetch(fresh ? new Request(e.request, { cache: "no-cache" }) : e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() =>
      caches.match(e.request)
        .then(hit => hit || caches.match(e.request, { ignoreSearch: true }))
        .then(hit => hit || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined))
    )
  );
});
