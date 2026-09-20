/* Слияние прогресса с двух устройств (или локального с облачным).
   Чистая функция без побочных эффектов: merge(a, b) === merge(b, a).
   Правила: счётчики — максимум (после синхронизации оба устройства несут общую историю,
   сумма бы удваивала её); «новые» поля — из записи с более поздним last; задание дня —
   первое прохождение; экзамены — объединение; «Сбросить прогресс» (resetAt) отбрасывает
   всё, что старше сброса, чтобы удалённое не воскресало с другого телефона. */

(function () {
  "use strict";

  function num(v) { return typeof v === "number" && isFinite(v) ? v : 0; }

  function mergeCounters(x, y, fields) {
    if (!x) return Object.assign({}, y);
    if (!y) return Object.assign({}, x);
    const newer = num(y.last) > num(x.last) ? y : x;
    const out = Object.assign({}, x, y, newer);
    fields.forEach(f => { out[f] = Math.max(num(x[f]), num(y[f])); });
    out.last = Math.max(num(x.last), num(y.last)) || null;
    return out;
  }

  function mergeMap(a, b, fields, resetAt) {
    const out = {};
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    keys.forEach(k => {
      const x = a && a[k] && num(a[k].last) >= resetAt ? a[k] : null;
      const y = b && b[k] && num(b[k].last) >= resetAt ? b[k] : null;
      if (x || y) out[k] = mergeCounters(x, y, fields);
    });
    return out;
  }

  function mergeDaily(a, b, resetAt) {
    const out = {};
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    keys.forEach(k => {
      const x = a && a[k] && num(a[k].at) >= resetAt ? a[k] : null;
      const y = b && b[k] && num(b[k].at) >= resetAt ? b[k] : null;
      if (x && y) out[k] = num(x.at) <= num(y.at) ? x : y;   /* засчитывается первое прохождение дня */
      else if (x || y) out[k] = x || y;
    });
    return out;
  }

  function mergeExams(a, b, resetAt) {
    const seen = new Set();
    return (a || []).concat(b || [])
      .filter(e => e && num(e.at) >= resetAt)
      .filter(e => { const k = num(e.at) + ":" + num(e.correct); if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((x, y) => num(x.at) - num(y.at))
      .slice(-50);
  }

  function isEmpty(s) {
    if (!s) return true;
    return !Object.keys(s.answers || {}).length && !Object.keys(s.vocab || {}).length && !Object.keys(s.daily || {}).length && !(s.exams || []).length;
  }

  function merge(a, b) {
    a = a || {}; b = b || {};
    const resetAt = Math.max(num(a.resetAt), num(b.resetAt));
    const newer = num(b.updatedAt) > num(a.updatedAt) ? b : a;
    const older = newer === a ? b : a;
    const out = Object.assign({}, older, newer);   /* неизвестные ключи — от более свежего state */
    out.answers = mergeMap(a.answers, b.answers, ["correct", "wrong"], resetAt);
    out.vocab = mergeMap(a.vocab, b.vocab, ["known", "unknown"], resetAt);
    out.daily = mergeDaily(a.daily, b.daily, resetAt);
    out.exams = mergeExams(a.exams, b.exams, resetAt);
    out.lastTopic = newer.lastTopic || older.lastTopic || null;
    out.updatedAt = Math.max(num(a.updatedAt), num(b.updatedAt));
    if (resetAt) out.resetAt = resetAt; else delete out.resetAt;
    return out;
  }

  window.StateMerge = { merge, isEmpty };
})();
