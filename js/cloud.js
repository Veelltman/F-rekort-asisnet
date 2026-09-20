/* Облако: вход по имени и PIN, синхронизация прогресса, круг друзей, доступ к учителю.
   Если CLOUD_URL пустой, сайт работает как раньше, только с локальными профилями.

   Синхронизация без потерь:
   - всё, что приходит с сервера, СЛИВАЕТСЯ с локальным (StateMerge), а не заменяет его;
   - при отправке передаём base = updatedAt, который видели последним; если на сервере уже
     новее (другое устройство), сервер отвечает 409 и присылает своё состояние — сливаем и шлём снова;
   - при сворачивании/закрытии вкладки отправляем через fetch keepalive;
   - без сети ждём событие online; статус виден в шапке (Cloud.status). */

(function () {
  "use strict";

  const CLOUD_URL = "https://forerkort-trener.velltman.workers.dev";
  const SESSION_KEY = "forerkort-cloud-session";
  const DIRTY_KEY = "forerkort-cloud-dirty";

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch (e) { return null; }
  }
  function writeSession(s) {
    try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  let session = readSession();
  let pushTimer = null;
  let retryTimer = null;
  let retries = 0;
  let dirty = false;
  try { dirty = localStorage.getItem(DIRTY_KEY) === "1"; } catch (e) { /* ignore */ }
  let status = "local";          /* local | synced | saving | offline | error */
  let statusMsg = "";
  let lastPushError = null;
  let lastPulledAt = 0;

  function setDirty(v) {
    dirty = v;
    try { v ? localStorage.setItem(DIRTY_KEY, "1") : localStorage.removeItem(DIRTY_KEY); } catch (e) { /* ignore */ }
  }
  function setStatus(s, msg) {
    status = s; statusMsg = msg || "";
    if (window.renderSyncStatus) window.renderSyncStatus();
  }

  async function api(path, opts) {
    opts = opts || {};
    const headers = Object.assign({ "content-type": "application/json" }, opts.headers || {});
    if (session && session.token) headers.authorization = "Bearer " + session.token;
    let res;
    try {
      res = await fetch(CLOUD_URL + path, { method: opts.method || "GET", headers, body: opts.body, keepalive: !!opts.keepalive });
    } catch (e) {
      const err = new Error("Нет связи с сервером. Проверь интернет.");
      err.network = true;
      throw err;
    }
    if (opts.raw) return res;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && session && path !== "/api/login") { logout(); }
      const err = new Error(data.error || `Ошибка сервера (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
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
    session = { token: data.token, name: data.name, teacher: !!data.teacher, base: 0 };
    writeSession(session);
    window.Storage.useCloudProfile(data.name, local);
    setDirty(true);
    schedulePush();
    return session;
  }

  /* Вход: локальный прогресс этого браузера сливается с облачным, ничего не теряется */
  async function login(name, pin) {
    const local = window.Storage.exportState();
    const data = await api("/api/login", { method: "POST", body: JSON.stringify({ name, pin }) });
    session = { token: data.token, name: data.name, teacher: !!data.teacher, base: 0 };
    writeSession(session);
    const remote = await api("/api/state");
    session.base = remote.updatedAt || 0;
    writeSession(session);
    let merged = remote.state || {};
    if (!window.StateMerge.isEmpty(local)) {
      const n = Object.keys(local.answers || {}).length;
      const keep = window.StateMerge.isEmpty(remote.state) || confirm(`В этом браузере уже есть прогресс (${n} вопросов). Объединить его с аккаунтом «${data.name}»?`);
      if (keep) merged = window.StateMerge.merge(local, remote.state || {});
    }
    window.Storage.useCloudProfile(data.name, merged);
    setDirty(true);
    schedulePush();
    return session;
  }

  async function logout() {
    if (dirty && isLoggedIn()) { try { await pushNow(); } catch (e) { /* уходим всё равно */ } }
    session = null;
    writeSession(null);
    setDirty(false);
    window.Storage.useLocalProfile();
    setStatus("local");
  }

  async function pull() {
    if (!isLoggedIn()) return;
    const remote = await api("/api/state");
    session.teacher = !!remote.teacher;
    session.base = remote.updatedAt || 0;
    writeSession(session);
    lastPulledAt = Date.now();
    const changed = window.Storage.mergeInto(remote.state || {});
    if (changed || dirty) schedulePush();
    else setStatus("synced");
    if (window.refreshView) window.refreshView();
  }

  function schedulePush() {
    if (!isLoggedIn()) return;
    setDirty(true);
    setStatus("saving");
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushNow(), 1500);
  }

  async function pushNow(opts) {
    opts = opts || {};
    if (!isLoggedIn()) return;
    clearTimeout(pushTimer); pushTimer = null;
    clearTimeout(retryTimer); retryTimer = null;
    if (navigator.onLine === false) { setStatus("offline"); return; }
    const body = JSON.stringify(window.Storage.exportState());
    const q = "?base=" + (session.base || 0) + (opts.replace ? "&replace=1" : "");
    try {
      const res = await api("/api/state" + q, { method: "PUT", body, keepalive: !!opts.keepalive });
      session.base = res.updatedAt || session.base;
      writeSession(session);
      setDirty(false);
      retries = 0;
      lastPushError = null;
      setStatus("synced");
    } catch (e) {
      if (e.status === 409 && e.data && e.data.conflict && !opts.retried) {
        /* На сервере новее (другое устройство): сливаем и отправляем ещё раз */
        session.base = e.data.updatedAt || 0;
        writeSession(session);
        window.Storage.mergeInto(e.data.state || {});
        if (window.refreshView) window.refreshView();
        return pushNow({ retried: true });
      }
      lastPushError = e.message;
      if (e.network) { setStatus("offline"); return; }
      setStatus("error", e.message);
      if (retries < 3) { retries += 1; retryTimer = setTimeout(() => pushNow(), 15000); }
    }
  }

  /* При сворачивании или закрытии вкладки — отправить сразу, не дожидаясь таймера */
  function flush() {
    if (!isLoggedIn() || !dirty) return;
    pushNow({ keepalive: true });
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
    setStatus(dirty ? "saving" : "synced");
    pull().catch(e => setStatus(e.network ? "offline" : "error", e.message));
  }

  window.addEventListener("online", () => { if (isLoggedIn() && dirty) pushNow(); else if (isLoggedIn()) setStatus("synced"); });
  window.addEventListener("offline", () => { if (isLoggedIn()) setStatus("offline"); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
    else if (isLoggedIn() && Date.now() - lastPulledAt > 60000) pull().catch(() => {});
  });
  window.addEventListener("pagehide", flush);

  window.Cloud = {
    enabled, isLoggedIn, me, teacherAllowed, register, login, logout, pull, schedulePush, pushNow, circle, teacherFetch, setTeacherAllowed,
    get status() { return isLoggedIn() ? status : "local"; },
    get statusMsg() { return statusMsg; },
    get dirty() { return dirty; },
    get lastPushError() { return lastPushError; }
  };
})();
