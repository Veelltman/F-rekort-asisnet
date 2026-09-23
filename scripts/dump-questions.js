/* Выгружает задания в читаемый текст — для сверки фактов глазами.
   node scripts/dump-questions.js rules > rules.txt
   node scripts/dump-questions.js situational
   node scripts/dump-questions.js signs          (только разметка, знаки — из каталога)
   node scripts/dump-questions.js gen-rules-fart 5   (5 случайных вариантов одного генератора) */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
["signs-catalog", "signs", "situational", "rules", "generated", "vocabulary"]
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
if (D[what]) {
  const list = what === "signs" ? D.signs.filter(q => q.kind === "marking") : D[what];
  if (what === "vocabulary") list.forEach(w => console.log(`${w.id} ${w.word_no} = ${w.translation_ru} | ${w.example_no} | ${w.example_ru}`));
  else list.forEach(q => console.log(show(q)));
} else {
  const q = Object.values(D).flat().find(x => x.id === what);
  if (!q) { console.error("Нет такого раздела или id: " + what); process.exit(1); }
  for (let i = 0; i < (+n || 1); i++) console.log(show(q));
}
