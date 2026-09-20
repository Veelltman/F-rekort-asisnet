/* Хранилище прогресса в localStorage с профилями.
   Профили: forerkort-profiles = { list: ["Имя", ...], current: "Имя" }
   Прогресс профиля: forerkort-trener-v1:<Имя> = { answers, vocab, daily, lastTopic } */

(function () {
  "use strict";

  const PROFILES_KEY = "forerkort-profiles";

  /* Дата в локальном времени пользователя: YYYY-MM-DD. Один источник для daily и серии дней. */
  function dateKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function todayKey() { return dateKey(new Date()); }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* приватный режим или заблокированное хранилище */ }
    return fallback;
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* игнорируем */ }
  }

  let profiles = read(PROFILES_KEY, { list: [], current: null });
  if (!profiles.list.length) {
    profiles = { list: ["Я"], current: "Я" };
    write(PROFILES_KEY, profiles);
  }

  let cloudName = null;
  function stateKey() { return cloudName ? "forerkort-trener-v1:cloud:" + cloudName : "forerkort-trener-v1:" + profiles.current; }
  function emptyState() { return { answers: {}, vocab: {}, daily: {}, exams: [], lastTopic: null, updatedAt: 0 }; }

  let state = read(stateKey(), null);
  if (!state) {
    /* миграция со старой версии без профилей */
    state = read("forerkort-trener-v1", null) || emptyState();
    state.daily = state.daily || {};
    write(stateKey(), state);
  }

  function save() {
    state.updatedAt = Date.now();
    write(stateKey(), state);
    if (cloudName && window.Cloud) window.Cloud.schedulePush();
  }

  /* ---------- Облачный профиль ---------- */
  function exportState() { return state; }
  function useCloudProfile(name, remoteState) {
    cloudName = name;
    state = Object.assign(emptyState(), remoteState || {});
    write(stateKey(), state);
  }
  /* Слить облачное состояние с текущим (без отправки в облако — иначе pull породил бы push-цикл).
     Возвращает true, если у нас есть что-то, чего нет в облаке. */
  function mergeInto(remoteState) {
    const merged = window.StateMerge.merge(state, remoteState || {});
    const changed = JSON.stringify(merged) !== JSON.stringify(window.StateMerge.merge(remoteState || {}, remoteState || {}));
    state = merged;
    write(stateKey(), state);
    return changed;
  }
  function useLocalProfile() {
    cloudName = null;
    state = read(stateKey(), null) || emptyState();
  }
  function isCloud() { return !!cloudName; }

  /* ---------- Профили ---------- */
  function getProfiles() { return cloudName ? [cloudName] : profiles.list.slice(); }
  function getCurrentProfile() { return cloudName || profiles.current; }
  function switchProfile(name) {
    if (!profiles.list.includes(name)) return;
    profiles.current = name;
    write(PROFILES_KEY, profiles);
    state = read(stateKey(), null) || emptyState();
    save();
  }
  function addProfile(name) {
    name = String(name || "").trim().slice(0, 24);
    if (!name || profiles.list.includes(name)) return false;
    profiles.list.push(name);
    write(PROFILES_KEY, profiles);
    switchProfile(name);
    return true;
  }
  function removeProfile(name) {
    if (profiles.list.length <= 1) return;
    profiles.list = profiles.list.filter(p => p !== name);
    try { localStorage.removeItem("forerkort-trener-v1:" + name); } catch (e) { /* ignore */ }
    if (profiles.current === name) profiles.current = profiles.list[0];
    write(PROFILES_KEY, profiles);
    state = read(stateKey(), null) || emptyState();
  }
  function readProfileState(name) {
    if (cloudName && name === cloudName) return state;
    return read("forerkort-trener-v1:" + name, null) || emptyState();
  }

  /* ---------- Ответы ----------
     Интервальное повторение: box 0..4 → следующий показ через 1, 3, 7, 14, 30 дней.
     Ошибка сбрасывает в box 0 (повтор завтра); каждый верный ответ поднимает на ступень. */
  const DAY = 86400000;
  const STEPS = [1, 3, 7, 14, 30];
  function isWeak(a) { return !!a && (a.lastResult === "fail" || a.wrong > a.correct); }
  function isDue(a, now) {
    if (!a) return false;
    if (a.due) return a.due <= (now || Date.now());
    return isWeak(a);            /* старые записи без due: к повторению, если слабые */
  }
  function recordAnswer(question, isCorrect) {
    const entry = state.answers[question.id] || { correct: 0, wrong: 0, last: null, topic: question.topic };
    if (isCorrect) entry.correct += 1; else entry.wrong += 1;
    entry.last = Date.now();
    entry.lastResult = isCorrect ? "ok" : "fail";
    entry.box = isCorrect ? Math.min((entry.box || 0) + 1, STEPS.length - 1) : 0;
    entry.due = entry.last + STEPS[entry.box] * DAY;
    state.answers[question.id] = entry;
    state.lastTopic = question.topic;
    save();
  }

  function recordVocab(wordId, known) {
    const entry = state.vocab[wordId] || { known: 0, unknown: 0, last: null };
    if (known) entry.known += 1; else entry.unknown += 1;
    entry.last = Date.now();
    entry.lastResult = known ? "ok" : "fail";
    state.vocab[wordId] = entry;
    save();
  }

  function recordDaily(dateKey, result) {
    state.daily[dateKey] = { correct: result.correct, total: result.total, at: Date.now() };
    save();
  }
  function getDaily(dateKey, profileName) {
    const s = profileName ? readProfileState(profileName) : state;
    return (s.daily || {})[dateKey] || null;
  }
  function recordExam(result) {
    state.exams = state.exams || [];
    state.exams.push({ correct: result.correct, total: result.total, passed: !!result.passed, at: Date.now() });
    if (state.exams.length > 50) state.exams = state.exams.slice(-50);
    save();
  }
  function getExams(profileName) {
    const s = profileName ? readProfileState(profileName) : state;
    return (s.exams || []).slice();
  }

  function getStreak() {
    let n = 0;
    const d = new Date();
    for (;;) {
      const key = dateKey(d);
      if (!state.daily[key]) break;
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function getTopicStats(topic, allQuestions) {
    const total = allQuestions.length;
    const now = Date.now();
    let seen = 0, correct = 0, wrong = 0, weak = 0, due = 0;
    allQuestions.forEach(q => {
      const a = state.answers[q.id];
      if (!a) return;
      seen += 1;
      correct += a.correct;
      wrong += a.wrong;
      if (isWeak(a)) weak += 1;
      if (isDue(a, now)) due += 1;
    });
    const attempts = correct + wrong;
    return {
      total, seen, correct, wrong, weak, due,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
      coverage: total ? Math.round((seen / total) * 100) : 0
    };
  }

  /* Слабые и просроченные: сначала самые просроченные, затем по числу ошибок */
  function getWeakQuestions(allQuestions) {
    const now = Date.now();
    return allQuestions
      .map(q => ({ q, a: state.answers[q.id] }))
      .filter(x => isWeak(x.a) || isDue(x.a, now))
      .sort((x, y) => ((x.a.due || 0) - (y.a.due || 0)) || ((y.a.wrong - y.a.correct) - (x.a.wrong - x.a.correct)))
      .map(x => x.q);
  }
  function getDueQuestions(allQuestions) {
    const now = Date.now();
    return allQuestions.filter(q => isDue(state.answers[q.id], now));
  }
  function getDueCount(allQuestions) { return getDueQuestions(allQuestions).length; }
  function getDailyAll() { return Object.assign({}, state.daily); }
  function getAnswersSnapshot() { return state.answers; }

  /* Вопросы, которые ещё не показывались или давно не повторялись: для режима «новое» */
  function getUnseenFirst(allQuestions) {
    return allQuestions
      .map(q => ({ q, a: state.answers[q.id] }))
      .sort((x, y) => (x.a ? x.a.last : 0) - (y.a ? y.a.last : 0))
      .map(x => x.q);
  }

  function getVocabStats(allWords) {
    let seen = 0, known = 0, unknown = 0;
    allWords.forEach(w => {
      const v = state.vocab[w.id];
      if (!v) return;
      seen += 1;
      known += v.known;
      unknown += v.unknown;
    });
    const attempts = known + unknown;
    return {
      total: allWords.length, seen, known, unknown,
      accuracy: attempts ? Math.round((known / attempts) * 100) : 0,
      coverage: allWords.length ? Math.round((seen / allWords.length) * 100) : 0
    };
  }

  function getWeakVocab(allWords) {
    return allWords.filter(w => {
      const v = state.vocab[w.id];
      return v && (v.lastResult === "fail" || v.unknown > v.known);
    });
  }

  function getAnswerEntry(id) { return state.answers[id] || null; }
  function getVocabEntry(id) { return state.vocab[id] || null; }
  function getLastTopic() { return state.lastTopic; }

  function reset() {
    state = emptyState();
    state.resetAt = Date.now();
    save();
    if (cloudName && window.Cloud) window.Cloud.pushNow({ replace: true });
  }

  window.Storage = {
    dateKey, todayKey,
    recordAnswer, recordVocab, recordDaily, getDaily, getStreak, recordExam, getExams,
    getTopicStats, getWeakQuestions, getUnseenFirst, getDueQuestions, getDueCount, getDailyAll, getAnswersSnapshot, isWeak, isDue,
    getVocabStats, getWeakVocab, getAnswerEntry, getVocabEntry, getLastTopic, reset,
    getProfiles, getCurrentProfile, switchProfile, addProfile, removeProfile,
    exportState, useCloudProfile, useLocalProfile, isCloud, mergeInto
  };
})();
