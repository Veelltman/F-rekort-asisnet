/* Облако: вход по имени и PIN, синхронизация прогресса, круг друзей, доступ к учителю.
   Если CLOUD_URL пустой, сайт работает как раньше, только с локальными профилями. */

(function () {
  "use strict";

  const CLOUD_URL = "https://forerkort-trener.velltman.workers.dev";
  const SESSION_KEY = "forerkort-cloud-session";

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch (e) { return null; }
  }
  function writeSession(s) {
    try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  let session = readSession();
  let pushTimer = null;
  let lastPushError = null;

  async function api(path, opts) {
    opts = opts || {};
    const headers = Object.assign({ "content-type": "application/json" }, opts.headers || {});
    if (session && session.token) headers.authorization = "Bearer " + session.token;
    let res;
    try {
      res = await fetch(CLOUD_URL + path, { method: opts.method || "GET", headers, body: opts.body });
    } catch (e) {
      throw new Error("Нет связи с сервером. Проверь интернет.");
    }
    if (opts.raw) return res;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && session && path !== "/api/login") { logout(); }
      throw new Error(data.error || `Ошибка сервера (${res.status})`);
    }
    return data;
  }

  const enabled = !!CLOUD_URL;
  function isLoggedIn() { return enabled && !!(session && session.token); }
  function me() { return session ? session.name : null; }
  function teacherAllowed() { return !!(session && session.teacher); }

  async function register(name, pin, invite) {
    const local = window.Storage.exportState();
    const data = await api("/api/register", { method: "POST", body: JSON.stringify({ name, pin, invite, state: local }) });
    session = { token: data.token, name: data.name, teacher: !!data.teacher };
    writeSession(session);
    window.Storage.useCloudProfile(data.name, local);
    return session;
  }

  async function login(name, pin) {
    const data = await api("/api/login", { method: "POST", body: JSON.stringify({ name, pin }) });
    session = { token: data.token, name: data.name, teacher: !!data.teacher };
    writeSession(session);
    const remote = await api("/api/state");
    window.Storage.useCloudProfile(data.name, remote.state || {});
    return session;
  }

  function logout() {
    session = null;
    writeSession(null);
    window.Storage.useLocalProfile();
  }

  async function pull() {
    if (!isLoggedIn()) return;
    const remote = await api("/api/state");
    session.teacher = !!remote.teacher;
    writeSession(session);
    window.Storage.useCloudProfile(session.name, remote.state || {});
  }

  function schedulePush() {
    if (!isLoggedIn()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 1500);
  }
  async function pushNow() {
    if (!isLoggedIn()) return;
    try {
      await api("/api/state", { method: "PUT", body: JSON.stringify(window.Storage.exportState()) });
      lastPushError = null;
    } catch (e) { lastPushError = e.message; }
  }

  async function circle() {
    return api("/api/circle");
  }

  async function teacherFetch(body, headers) {
    const res = await api("/api/teacher", { method: "POST", body, headers, raw: true });
    return res;
  }

  async function setTeacherAllowed(names) {
    return api("/api/teacher-allowed", { method: "PUT", body: JSON.stringify({ names }) });
  }

  if (isLoggedIn()) {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem("forerkort-trener-v1:cloud:" + session.name) || "null"); } catch (e) { /* ignore */ }
    window.Storage.useCloudProfile(session.name, cached || {});
    pull().then(() => { if (window.go && window.CURRENT_ROUTE === "home") window.go("home"); }).catch(() => {});
  }

  window.addEventListener("beforeunload", () => { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });

  window.Cloud = { enabled, isLoggedIn, me, teacherAllowed, register, login, logout, pull, schedulePush, pushNow, circle, teacherFetch, setTeacherAllowed, get lastPushError() { return lastPushError; } };
})();
