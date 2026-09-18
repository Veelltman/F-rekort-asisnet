/* Хранилище прогресса в localStorage с профилями.
   Профили: forerkort-profiles = { list: ["Имя", ...], current: "Имя" }
   Прогресс профиля: forerkort-trener-v1:<Имя> = { answers, vocab, daily, lastTopic } */

(function () {
  "use strict";

  const PROFILES_KEY = "forerkort-profiles";

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

  function stateKey() { return "forerkort-trener-v1:" + profiles.current; }
  function emptyState() { return { answers: {}, vocab: {}, daily: {}, lastTopic: null }; }

  let state = read(stateKey(), null);
  if (!state) {
    /* миграция со старой версии без профилей */
    state = read("forerkort-trener-v1", null) || emptyState();
    state.daily = state.daily || {};
    write(stateKey(), state);
  }

  function save() { write(stateKey(), state); }

  /* ---------- Профили ---------- */
  function getProfiles() { return profiles.list.slice(); }
  function getCurrentProfile() { return profiles.current; }
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
    return read("forerkort-trener-v1:" + name, null) || emptyState();
  }

  /* ---------- Ответы ---------- */
  function recordAnswer(question, isCorrect) {
    const entry = state.answers[question.id] || { correct: 0, wrong: 0, last: null, topic: question.topic };
    if (isCorrect) entry.correct += 1; else entry.wrong += 1;
    entry.last = Date.now();
    entry.lastResult = isCorrect ? "ok" : "fail";
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
  function getStreak() {
    let n = 0;
    const d = new Date();
    for (;;) {
      const key = d.toISOString().slice(0, 10);
      if (!state.daily[key]) break;
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function getTopicStats(topic, allQuestions) {
    const total = allQuestions.length;
    let seen = 0, correct = 0, wrong = 0, weak = 0;
    allQuestions.forEach(q => {
      const a = state.answers[q.id];
      if (!a) return;
      seen += 1;
      correct += a.correct;
      wrong += a.wrong;
      if (a.lastResult === "fail" || a.wrong > a.correct) weak += 1;
    });
    const attempts = correct + wrong;
    return {
      total, seen, correct, wrong, weak,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
      coverage: total ? Math.round((seen / total) * 100) : 0
    };
  }

  function getWeakQuestions(allQuestions) {
    return allQuestions
      .map(q => ({ q, a: state.answers[q.id] }))
      .filter(x => x.a && (x.a.lastResult === "fail" || x.a.wrong > x.a.correct))
      .sort((x, y) => (y.a.wrong - y.a.correct) - (x.a.wrong - x.a.correct))
      .map(x => x.q);
  }

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
  function getLastTopic() { return state.lastTopic; }

  function reset() {
    state = emptyState();
    save();
  }

  window.Storage = {
    recordAnswer, recordVocab, recordDaily, getDaily, getStreak,
    getTopicStats, getWeakQuestions, getUnseenFirst,
    getVocabStats, getWeakVocab, getAnswerEntry, getLastTopic, reset,
    getProfiles, getCurrentProfile, switchProfile, addProfile, removeProfile
  };
})();
