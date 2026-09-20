/* Проверка банков данных: загружает файлы как в браузере и валидирует структуру.
   Запуск: node scripts/check-data.js */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { window: {}, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);

const files = [
  "js/icons/signs-svg.js",
  "js/data/signs-catalog.js",
  "js/data/signs.js",
  "js/data/situational.js",
  "js/data/rules.js",
  "js/data/generated.js",
  "js/data/vocabulary.js"
];
for (const f of files) {
  const code = fs.readFileSync(path.join(root, f), "utf8");
  try {
    vm.runInContext(code, ctx, { filename: f });
  } catch (e) {
    console.error(`Синтаксическая ошибка в ${f}: ${e.message}`);
    process.exit(1);
  }
}

const D = ctx.window.QUESTION_DATA;
const errors = [];
const ids = new Set();

function checkQuestion(q, where) {
  const inst = q.fresh ? q.fresh() : q;
  if (!q.id) errors.push(`${where}: нет id`);
  if (ids.has(q.id)) errors.push(`${where}: дубликат id ${q.id}`);
  ids.add(q.id);
  if (!inst.prompt_no || !inst.prompt_ru) errors.push(`${where} ${q.id}: нет текста вопроса`);
  if (!Array.isArray(inst.options) || inst.options.length !== 4) errors.push(`${where} ${q.id}: должно быть 4 варианта`);
  else {
    const correct = inst.options.filter(o => o.correct).length;
    if (inst.multi) {
      if (correct < 2 || correct > 3) errors.push(`${where} ${q.id}: у multi-вопроса должно быть 2–3 правильных, сейчас ${correct}`);
    } else if (correct !== 1) errors.push(`${where} ${q.id}: правильных вариантов ${correct}, должен быть 1`);
    inst.options.forEach(o => { if (!o.correct && (!o.why_no || !o.why_ru) && !q.fresh) errors.push(`${where} ${q.id}: неверный вариант без пояснения why_no/why_ru`); });
    const texts = new Set(inst.options.map(o => o.text_no));
    if (texts.size !== 4) errors.push(`${where} ${q.id}: варианты повторяются`);
    inst.options.forEach(o => { if (!o.text_no || !o.text_ru) errors.push(`${where} ${q.id}: вариант без текста`); });
  }
  if (!inst.explanation_no || !inst.explanation_ru) errors.push(`${where} ${q.id}: нет объяснения`);
}

["situational", "rules", "signs"].forEach(t => D[t].forEach(q => checkQuestion(q, t)));
D.vocabulary.forEach(w => {
  if (!w.id || !w.word_no || !w.translation_ru || !w.example_no || !w.example_ru) errors.push(`vocabulary ${w.id}: неполная карточка`);
  if (ids.has(w.id)) errors.push(`vocabulary: дубликат id ${w.id}`);
  ids.add(w.id);
});

const imgDir = path.join(root, "img/signs");
const imgs = new Set(fs.readdirSync(imgDir));
ctx.window.SIGN_CATALOG.LIST.forEach(e => { if (!imgs.has(e.file)) errors.push(`signs-catalog: нет файла img/signs/${e.file}`); });

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ситуаций ${D.situational.length}, правил ${D.rules.length}, заданий по знакам ${D.signs.length}, слов ${D.vocabulary.length}`);
