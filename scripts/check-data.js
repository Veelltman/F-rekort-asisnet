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
  "js/scene-kit.js",
  "js/data/signs-catalog.js",
  "js/data/signs.js",
  "js/data/situational.js",
  "js/data/rules.js",
  "js/data/generated.js",
  "js/data/sikkerhet.js",
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

["situational", "rules", "signs", "sikkerhet"].forEach(t => D[t].forEach(q => checkQuestion(q, t)));
D.vocabulary.forEach(w => {
  if (!w.id || !w.word_no || !w.translation_ru || !w.example_no || !w.example_ru) errors.push(`vocabulary ${w.id}: неполная карточка`);
  if (ids.has(w.id)) errors.push(`vocabulary: дубликат id ${w.id}`);
  ids.add(w.id);
});

/* Ловушки на ошибки, которые робот уже делал. Каждая — с объяснением, что не так. */
/* картинки ситуаций — только новым художником (js/scene-kit.js), 400×300 */
D.situational.forEach(q => {
  const img = q.fresh ? q.fresh().image : q.image;
  if (img && !/viewBox="0 0 400 300"/.test(img)) errors.push(`situational ${q.id}: картинка не из js/scene-kit.js (scene()/street()/SK.hill()/SK.illus())`);
});
const TRAPS = [
  [/vinterdekk-?krav|påbudt med vinterdekk|krav om vinterdekk/i, "зимние шины для легковой не обязательны — обязательны 3 мм протектора зимой"],
  [/forbudt å (snu|vende|rygge)[^.]*tunnel|tunnel[^.]*forbudt å (snu|vende|rygge)/i, "в тоннеле запрещено стоять (§ 17 nr 1 a); разворот запрещён только на motorveg/motortrafikkveg (§ 11 nr 2)"],
  [/(syklist|gående|fotgjenger)[^.]*har vikeplikt (framfor|for) deg som svinger/i, "поворачивающий уступает велосипедисту и пешеходу, едущим прямо (§ 7 nr 3), а не наоборот"],
  [/(trikk|sporvogn)[^.]*alltid (forrang|forkjørsrett)/i, "трамваю уступают по § 10 nr 2, но на перекрёстке со светофором действует светофор — не пиши «всегда»"],
  [/flett\w* (inn )?[^.]*i god tid før/i, "при сужении полос — поочерёдно («молния», § 8 nr 1), а не «перестройся заранее»"],
  [/ring\w* (nødnummer\w* )?112[^.]*(skade|personskade|ulykke)/i, "при пострадавших — 113 (скорая), 112 — полиция"],
  [/gul (kant)?linje[^.]*(parkering|stans)/i, "жёлтой линии у бордюра в норвежской разметке нет"],
  [/fritt? (valg|valgfrihet)[^.]*(tettbygd|60)/i, "свободный выбор полосы — только со знаком 528"],
  [/tåkelys[^.]*sammen med nærlys[^.]*(tillatt|lov|kan)/i, "противотуманки нельзя вместе с ближним (§ 15 nr 5)"]
];
const textsOf = q => {
  const inst = q.fresh ? q.fresh() : q;
  // сам вопрос может спрашивать про миф — проверяем то, что сайт утверждает: правильный ответ и объяснения
  return [inst.explanation_no, ...(inst.options || []).flatMap(o => o.correct ? [o.text_no] : [o.why_no])].filter(Boolean);
};
// предложение с отрицанием опровергает миф («gul linje finnes ikke») — это не ошибка
const sentenceOf = (txt, re) => {
  const m = txt.match(re), i = txt.lastIndexOf(".", m.index) + 1, j = txt.indexOf(".", m.index + m[0].length);
  return txt.slice(i, j < 0 ? undefined : j);
};
const denies = s => /\b(ikke|ingen|aldri|ikkje)\b/i.test(s);
["situational", "rules"].forEach(t => D[t].forEach(q => {
  textsOf(q).forEach(txt => TRAPS.forEach(([re, msg]) => { if (re.test(txt) && !denies(sentenceOf(txt, re))) errors.push(`${t} ${q.id}: «${txt.match(re)[0]}» — ${msg}`); }));
}));
D.vocabulary.forEach(w => TRAPS.forEach(([re, msg]) => { if (re.test(w.example_no) && !denies(sentenceOf(w.example_no, re))) errors.push(`vocabulary ${w.id}: ${msg}`); }));

const imgDir = path.join(root, "img/signs");
const imgs = new Set(fs.readdirSync(imgDir));
ctx.window.SIGN_CATALOG.LIST.forEach(e => { if (!imgs.has(e.file)) errors.push(`signs-catalog: нет файла img/signs/${e.file}`); });

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ситуаций ${D.situational.length}, правил ${D.rules.length}, заданий по знакам ${D.signs.length}, проверка машины ${D.sikkerhet.length}, слов ${D.vocabulary.length}`);
