/* Service worker: сеть в приоритете, кэш как запасной вариант (офлайн на телефоне).
   Версию меняй при крупных обновлениях, чтобы сбросить старый кэш. */

const CACHE = "forerkort-v2";
const SHELL = [
  "./", "./index.html", "./css/styles.css", "./manifest.webmanifest",
  "./js/icons/signs-svg.js", "./js/data/signs-catalog.js", "./js/data/signs.js",
  "./js/data/situational.js", "./js/data/rules.js", "./js/data/generated.js",
  "./js/data/vocabulary.js", "./js/storage.js", "./js/cloud.js", "./js/quiz-engine.js",
  "./js/app.js", "./js/teacher.js", "./js/teacher-ui.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});
