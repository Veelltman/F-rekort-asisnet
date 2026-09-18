/* Знаки: задания генерируются из каталога (signs-catalog.js).
   У каждого задания стабильный id (для прогресса), а варианты ответов
   подбираются заново при каждом показе через fresh(). */

(function () {
  "use strict";
  const { CATS, LIST } = window.SIGN_CATALOG;

  function img(entry) {
    return `<img class="sign-img" src="img/signs/${entry.file}" alt="${entry.no}" loading="lazy">`;
  }

  function pick(arr, n, exclude) {
    const pool = arr.filter(x => !exclude.has(x.group));
    const out = [];
    const seen = new Set();
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    for (const x of shuffled) {
      if (seen.has(x.group)) continue;
      seen.add(x.group);
      out.push(x);
      if (out.length === n) break;
    }
    return out;
  }

  function distractors(entry, n) {
    const exclude = new Set([entry.group]);
    const sameCat = LIST.filter(x => x.cat === entry.cat);
    let d = pick(sameCat, n, exclude);
    if (d.length < n) {
      d.forEach(x => exclude.add(x.group));
      d = d.concat(pick(LIST, n - d.length, exclude));
    }
    return d;
  }

  /* Тип 1: картинка → что означает */
  function meaningQuestion(entry) {
    const base = {
      id: "sg-m-" + entry.file.replace(/\.png$/, ""),
      topic: "signs", kind: "meaning",
      entry
    };
    base.fresh = () => {
      const d = distractors(entry, 3);
      return {
        id: base.id, topic: "signs",
        prompt_no: "Hva betyr dette skiltet?",
        prompt_ru: "Что означает этот знак?",
        image: img(entry),
        options: [entry, ...d].map((x, i) => ({ text_no: x.no, text_ru: x.ru, correct: i === 0 })),
        explanation_no: entry.expl_no,
        explanation_ru: entry.expl_ru,
        tip_ru: entry.tip_ru
      };
    };
    return base;
  }

  /* Тип 2: название → выбери картинку */
  function pickQuestion(entry) {
    const base = {
      id: "sg-p-" + entry.file.replace(/\.png$/, ""),
      topic: "signs", kind: "pick",
      entry
    };
    base.fresh = () => {
      const d = distractors(entry, 3);
      return {
        id: base.id, topic: "signs",
        prompt_no: `Hvilket skilt betyr «${entry.no}»?`,
        prompt_ru: `Какой знак означает «${entry.ru}»?`,
        image: null,
        imageOptions: true,
        options: [entry, ...d].map((x, i) => ({ text_no: x.no, text_ru: x.ru, image: img(x), correct: i === 0 })),
        explanation_no: entry.expl_no,
        explanation_ru: entry.expl_ru,
        tip_ru: entry.tip_ru
      };
    };
    return base;
  }

  /* Тип 3: картинка → какого типа знак */
  function categoryQuestion(entry) {
    const base = {
      id: "sg-c-" + entry.file.replace(/\.png$/, ""),
      topic: "signs", kind: "category",
      entry
    };
    base.fresh = () => {
      const keys = Object.keys(CATS).filter(k => k !== entry.cat).sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [entry.cat, ...keys];
      return {
        id: base.id, topic: "signs",
        prompt_no: "Hva slags skilt er dette?",
        prompt_ru: "К какому типу относится этот знак?",
        image: img(entry),
        options: opts.map((k, i) => ({ text_no: CATS[k].no, text_ru: CATS[k].ru, correct: i === 0 })),
        explanation_no: `${entry.no} er et ${CATS[entry.cat].no.toLowerCase()}. ${entry.expl_no}`,
        explanation_ru: `«${entry.ru}» — ${CATS[entry.cat].ru.toLowerCase()}. ${entry.expl_ru}`,
        tip_ru: CATS[entry.cat].tip
      };
    };
    return base;
  }

  const generated = [];
  LIST.forEach(entry => {
    generated.push(meaningQuestion(entry));
    generated.push(pickQuestion(entry));
    if (entry.cat !== "underskilt") generated.push(categoryQuestion(entry));
  });

  /* Разметка: статические вопросы без картинок */
  function q(id, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "signs-" + id, topic: "signs", kind: "marking",
      prompt_no, prompt_ru, image: null,
      options: opts.map((o, i) => ({ text_no: o[0], text_ru: o[1], correct: i === 0 })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  const marking = [
    q("m01", "Hva betyr en heltrukken gul midtlinje?", "Что означает сплошная жёлтая осевая линия?", [
      ["Du kan ikke krysse linjen for å kjøre forbi", "Нельзя пересекать линию для обгона"],
      ["Du kan krysse linjen når det er trygt", "Можно пересекать, если безопасно"],
      ["Linjen viser sykkelfelt", "Линия обозначает велополосу"],
      ["Linjen markerer parkeringsplass", "Линия обозначает парковку"]
    ],
    "Heltrukken gul midtlinje (sperrelinje) skal ikke krysses. Den brukes der forbikjøring er farlig.",
    "Сплошная жёлтая осевая (sperrelinje) — пересекать нельзя. Стоит там, где обгон опасен.",
    "В Норвегии осевая разметка жёлтая, а не белая. Белая разделяет полосы одного направления."),

    q("m02", "Hva betyr en stiplet gul midtlinje?", "Что означает прерывистая жёлтая осевая линия?", [
      ["Du kan krysse linjen for å kjøre forbi hvis det er trygt", "Можно пересекать для обгона, если безопасно"],
      ["Forbikjøring forbudt", "Обгон запрещён"],
      ["Linjen markerer busstopp", "Линия обозначает остановку автобуса"],
      ["Du må stoppe ved linjen", "У линии нужно остановиться"]
    ],
    "Stiplet gul midtlinje (delelinje) kan krysses ved forbikjøring når det er trygt og lovlig.",
    "Прерывистая жёлтая осевая — можно пересекать при обгоне, если безопасно и разрешено.",
    "Прерывистая = разрешение, сплошная = запрет. Перед обгоном всё равно проверь знаки и обзор."),

    q("m03", "Hva betyr en gul varsellinje (lange streker, korte mellomrom)?", "Что означает жёлтая предупреждающая линия (длинные штрихи, короткие промежутки)?", [
      ["Sikten er dårlig, forbikjøring er farlig, men ikke forbudt", "Плохая видимость: обгон опасен, но не запрещён"],
      ["Forbikjøring er forbudt", "Обгон запрещён"],
      ["Linjen er en stopplinje", "Это стоп-линия"],
      ["Her begynner motorveg", "Здесь начинается автомагистраль"]
    ],
    "Varsellinje betyr at sikten er for kort til trygg forbikjøring. Den advarer før en sperrelinje.",
    "Varsellinje: видимость слишком короткая для безопасного обгона. Обычно предупреждает о скорой сплошной.",
    "Длинные штрихи = «не обгоняй, скоро сплошная». Короткие штрихи = обычная прерывистая."),

    q("m04", "Hva betyr en bred hvit tverrstripe (stopplinje)?", "Что означает широкая белая поперечная полоса (стоп-линия)?", [
      ["Du skal stoppe før linjen når du må stoppe", "Останавливаться нужно перед линией"],
      ["Linjen markerer gangfelt", "Линия обозначает пешеходный переход"],
      ["Linjen kan ignoreres", "Линию можно игнорировать"],
      ["Bare busser må stoppe her", "Останавливаться должны только автобусы"]
    ],
    "Ved stoppskilt eller rødt lys stopper du foran stopplinjen.",
    "При знаке STOP или красном свете останавливаешься перед стоп-линией.",
    "Переехать стоп-линию хотя бы бампером — уже нарушение."),

    q("m05", "Hva betyr en rekke hvite trekanter (haitenner) på tvers av kjørefeltet?", "Что означает ряд белых треугольников («акульи зубы») поперёк полосы?", [
      ["Vikelinje: du har vikeplikt", "Линия «уступи дорогу»"],
      ["Stopplinje: full stopp", "Стоп-линия: полная остановка"],
      ["Gangfelt", "Пешеходный переход"],
      ["Fartshump", "Лежачий полицейский"]
    ],
    "Vikelinjen markerer hvor du skal vike. Den brukes sammen med vikepliktskiltet og i rundkjøringer.",
    "Vikelinje показывает, где уступать. Ставится вместе со знаком «уступи» и на кругах.",
    "Зубы «кусают» тебя = ты уступаешь. Полная остановка не обязательна."),

    q("m06", "Hva betyr gul sperrelinje langs fortauskanten?", "Что означает жёлтая сплошная линия вдоль бордюра?", [
      ["Stans forbudt", "Остановка запрещена"],
      ["Parkering tillatt", "Парковка разрешена"],
      ["Sykkelfelt", "Велополоса"],
      ["Busslomme", "Автобусный карман"]
    ],
    "Gul heltrukken linje langs kanten betyr stans forbudt. Stiplet gul betyr parkering forbudt.",
    "Жёлтая сплошная вдоль края — остановка запрещена. Жёлтая прерывистая — парковка запрещена.",
    "Логика та же, что у знаков: сплошная строже прерывистой."),

    q("m07", "Hva betyr hvite piler i kjørefeltet før et kryss?", "Что означают белые стрелки в полосе перед перекрёстком?", [
      ["Du må kjøre i pilens retning fra dette feltet", "Из этой полосы нужно ехать по стрелке"],
      ["Anbefalt retning", "Рекомендуемое направление"],
      ["Pilen gjelder bare busser", "Стрелка только для автобусов"],
      ["Pilen viser envegskjøring", "Стрелка обозначает одностороннее движение"]
    ],
    "Kjørefeltpiler er påbud: valgte du feltet, må du følge pilen.",
    "Стрелки в полосе — предписание: выбрал полосу, едешь по стрелке.",
    "Выбирай полосу заранее, по табличке над дорогой или стрелкам: перестраиваться в самом перекрёстке нельзя.")
  ];

  window.QUESTION_DATA = window.QUESTION_DATA || {};
  window.QUESTION_DATA.signs = generated.concat(marking);
  window.QUESTION_DATA.signsByKind = {
    meaning: generated.filter(x => x.kind === "meaning"),
    pick: generated.filter(x => x.kind === "pick"),
    category: generated.filter(x => x.kind === "category"),
    marking
  };
})();
