/* Выгружает задания в читаемый текст — для сверки фактов глазами.
   node scripts/dump-questions.js rules > rules.txt
   node scripts/dump-questions.js situational
   node scripts/dump-questions.js signs          (только разметка, знаки — из каталога)
   node scripts/dump-questions.js gen-rules-fart 5   (5 случайных вариантов одного генератора)
   node scripts/dump-questions.js list            (по строке на каждый вопрос и слово — чтобы не повторяться)
   node scripts/dump-questions.js similar sit-097 (6 самых похожих вопросов — проверка нового задания на повтор) */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js/scene-kit.js"), "utf8"), ctx);
["signs-catalog", "signs", "situational", "rules", "generated", "sikkerhet", "vocabulary"]
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(root, "js/data", f + ".js"), "utf8"), ctx));
const D = ctx.window.QUESTION_DATA;

function show(q) {
  if (!q.options && q.fresh) q = Object.assign({}, q, q.fresh());
  const lines = [`## ${q.id}${q.multi ? " [MULTI]" : ""}`, `Q: ${q.prompt_no}`, `RU: ${q.prompt_ru}`];
  q.options.forEach(o => {
    lines.push(`${o.correct ? "+" : "-"} ${o.text_no} / ${o.text_ru}`);
    if (o.why_no) lines.push(`    why: ${o.why_no}`);
  });
  lines.push(`E: ${q.explanation_no}`, `ER: ${q.explanation_ru}`, `T: ${q.tip_ru || ""}`, "");
  return lines.join("\n");
}

const [what, n] = process.argv.slice(2);
if (what === "list") {
  const cut = t => t.length > 140 ? t.slice(0, 137) + "…" : t;
  ["rules", "situational"].forEach(k => D[k].forEach(q => console.log(`${q.id}${q.multi ? " [MULTI]" : ""}  ${cut(q.fresh ? q.fresh().prompt_no : q.prompt_no)}`)));
  console.log("Слова: " + D.vocabulary.map(w => `${w.id} ${w.word_no}`).join("; "));
} else if (what === "similar") {
  // 6 самых похожих вопросов на данный (по общим словам в вопросе и правильном ответе)
  const stop = new Set("du er en et ei og i på til som det å har med for av at den de kan skal hva hvem jeg deg din ditt seg om men ikke fra ut inn når vil eller bil bilen velg alle riktige".split(" "));
  const words = q => new Set((q.prompt_no + " " + q.options.filter(o => o.correct).map(o => o.text_no).join(" "))
    .toLowerCase().replace(/[^a-zæøå0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stop.has(w)));
  const pool = [...D.rules, ...D.situational].filter(q => !q.fresh);
  const me = pool.find(q => q.id === n);
  if (!me) { console.error("Укажи id: node scripts/dump-questions.js similar rules-101"); process.exit(1); }
  const a = words(me);
  pool.filter(q => q.id !== me.id).map(q => {
    const b = words(q); let common = 0; a.forEach(w => b.has(w) && common++);
    return { q, score: common / Math.max(1, Math.min(a.size, b.size)) };
  }).sort((x, y) => y.score - x.score).slice(0, 6)
    .forEach(({ q, score }) => console.log(`${score.toFixed(2)}  ${q.id}  ${q.prompt_no}\n      + ${q.options.filter(o => o.correct).map(o => o.text_no).join(" | ")}`));
} else if (D[what]) {
  const list = what === "signs" ? D.signs.filter(q => q.kind === "marking") : D[what];
  if (what === "vocabulary") list.forEach(w => console.log(`${w.id} ${w.word_no} = ${w.translation_ru} | ${w.example_no} | ${w.example_ru}`));
  else list.forEach(q => console.log(show(q)));
} else {
  const q = Object.values(D).flat().find(x => x.id === what);
  if (!q) { console.error("Нет такого раздела или id: " + what); process.exit(1); }
  for (let i = 0; i < (+n || 1); i++) console.log(show(q));
}
