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
        options: [entry, ...d].map((x, i) => ({ text_no: x.no, text_ru: x.ru, correct: i === 0,
          why_no: i === 0 ? null : `«${x.no}» er et annet skilt (${CATS[x.cat].no.toLowerCase()}): ${x.expl_no}`,
          why_ru: i === 0 ? null : `«${x.ru}» — это другой знак (${CATS[x.cat].ru.toLowerCase()}): ${x.expl_ru}` })),
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
        options: [entry, ...d].map((x, i) => ({ text_no: x.no, text_ru: x.ru, image: img(x), correct: i === 0,
          why_no: i === 0 ? null : `Skiltet du valgte betyr «${x.no}»: ${x.expl_no}`,
          why_ru: i === 0 ? null : `Выбранный знак означает «${x.ru}»: ${x.expl_ru}` })),
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
    /* Знаки «Slutt på …» снимают запрет и выглядят как информация, но по skiltforskriften
       это серия 300 = forbudsskilt. На экзамене спрашивают именно официальную категорию. */
    const opphev = entry.cat === "forbud" && /^Slutt på|sone/i.test(entry.no);
    const noteNo = opphev ? " Merk: soneskilt og «slutt på»-skilt er rektangulære og ligner opplysningsskilt, men i skiltforskriften hører de til forbudsskiltene (300-serien)." : "";
    const noteRu = opphev ? " Важно: зональные знаки и знаки «slutt på …» прямоугольные и похожи на информационные, но по Skiltforskriften относятся к запрещающим (серия 300)." : "";
    base.fresh = () => {
      const keys = Object.keys(CATS).filter(k => k !== entry.cat).sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [entry.cat, ...keys];
      return {
        id: base.id, topic: "signs",
        prompt_no: "Hva slags skilt er dette?",
        prompt_ru: "К какому типу относится этот знак?",
        image: img(entry),
        options: opts.map((k, i) => ({ text_no: CATS[k].no, text_ru: CATS[k].ru, correct: i === 0,
          why_no: i === 0 ? null : (opphev && k === "opplysning"
            ? "Skiltet er rektangulært og ligner et opplysningsskilt, men soneskilt og «slutt på»-skilt er formelt forbudsskilt (300-serien i skiltforskriften)."
            : `${CATS[k].no} ser annerledes ut. ${CATS[k].tip_no || ""}`.trim()),
          why_ru: i === 0 ? null : (opphev && k === "opplysning"
            ? "Знак прямоугольный и похож на информационный, но зональные знаки и «slutt på …» формально относятся к запрещающим (серия 300 в Skiltforskriften). На экзамене отвечай «Forbudsskilt»."
            : `${CATS[k].ru} выглядит иначе. ${CATS[k].tip}`) })),
        explanation_no: `${entry.no} er et ${CATS[entry.cat].no.toLowerCase()}. ${entry.expl_no}${noteNo}`,
        explanation_ru: `«${entry.ru}» — ${CATS[entry.cat].ru.toLowerCase()}. ${entry.expl_ru}${noteRu}`,
        tip_ru: opphev ? "Правило простое: серия 300 (запреты, зоны запретов и их отмена) = Forbudsskilt. Синий прямоугольник с реальной информацией о дороге = Opplysningsskilt." : CATS[entry.cat].tip
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
      options: opts.map((o, i) => ({ text_no: o[0], text_ru: o[1], correct: i === 0, why_no: o[2] || null, why_ru: o[3] || null })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  const marking = [
    q("m01", "Hva betyr en heltrukken gul midtlinje?", "Что означает сплошная жёлтая осевая линия?", [
      ["Du kan ikke krysse linjen for å kjøre forbi", "Нельзя пересекать линию для обгона"],
      ["Du kan krysse linjen når det er trygt", "Можно пересекать, если безопасно", "Heltrukken linje er absolutt: den kan ikke krysses selv om det ser trygt ut. Det er stiplet linje som kan krysses.", "Сплошная — абсолютный запрет, даже если кажется безопасно. Пересекать можно только прерывистую."],
      ["Linjen viser sykkelfelt", "Линия обозначает велополосу", "Sykkelfelt merkes med hvit linje og sykkelsymbol langs kanten, ikke med gul midtlinje.", "Велополоса обозначается белой линией и символом велосипеда у края, а не жёлтой осевой."],
      ["Linjen markerer parkeringsplass", "Линия обозначает парковку", "Parkeringsplasser merkes med hvite linjer, og gul linje langs kanten betyr tvert imot stans- eller parkeringsforbud.", "Парковка размечается белыми линиями, а жёлтая линия у края, наоборот, означает запрет остановки или стоянки."]
    ],
    "Heltrukken gul midtlinje er sperrelinje (oppmerking 1004): det må ikke kjøres på eller over den, eller til venstre for den. Den brukes der forbikjøring er farlig.",
    "Сплошная жёлтая осевая (sperrelinje) — пересекать нельзя. Стоит там, где обгон опасен.",
    "В Норвегии осевая разметка жёлтая, а не белая. Белая разделяет полосы одного направления."),

    q("m02", "Hva betyr en stiplet gul midtlinje?", "Что означает прерывистая жёлтая осевая линия?", [
      ["Du kan krysse linjen for å kjøre forbi hvis det er trygt", "Можно пересекать для обгона, если безопасно"],
      ["Forbikjøring forbudt", "Обгон запрещён", "Forbud mot forbikjøring vises med heltrukken linje eller eget skilt. Stiplet linje tillater kryssing.", "Запрет обгона обозначают сплошной линией или знаком. Прерывистая линия пересекать разрешает."],
      ["Linjen markerer busstopp", "Линия обозначает остановку автобуса", "Busstopp merkes med gul sikksakklinje langs kanten, ikke med stiplet midtlinje.", "Автобусная остановка размечается жёлтым зигзагом у края, а не прерывистой осевой."],
      ["Du må stoppe ved linjen", "У линии нужно остановиться", "Midtlinjen skiller kjøreretningene og har ingenting med stopp å gjøre. Stopplinjen er en hvit tverrstripe.", "Осевая разделяет направления и к остановке отношения не имеет. Стоп-линия — белая поперечная полоса."]
    ],
    "Stiplet gul kjørefeltlinje (oppmerking 1000) kan krysses når det skjer i samsvar med trafikkreglene, for eksempel ved forbikjøring når det er trygt.",
    "Прерывистая жёлтая осевая (разметка 1000, kjørefeltlinje) — можно пересекать по правилам, например при обгоне, если безопасно.",
    "Прерывистая = разрешение, сплошная = запрет. Перед обгоном всё равно проверь знаки и обзор."),

    q("m03", "Hva betyr en gul varsellinje (lange streker, korte mellomrom)?", "Что означает жёлтая предупреждающая линия (длинные штрихи, короткие промежутки)?", [
      ["Sikten er dårlig, forbikjøring er farlig, men ikke forbudt", "Плохая видимость: обгон опасен, но не запрещён"],
      ["Forbikjøring er forbudt", "Обгон запрещён", "Varsellinjen forbyr ikke, den advarer. Forbudet kommer først med sperrelinjen (heltrukken).", "Varsellinje не запрещает, а предупреждает. Запрет начинается со сплошной (sperrelinje)."],
      ["Linjen er en stopplinje", "Это стоп-линия", "Stopplinjen går på tvers av kjørefeltet, mens varsellinjen går langs midten av vegen.", "Стоп-линия идёт поперёк полосы, а varsellinje — вдоль середины дороги."],
      ["Her begynner motorveg", "Здесь начинается автомагистраль", "Motorveg varsles med blått skilt, ikke med vegoppmerking. Motorveg har heller ingen gul midtlinje, siden retningene er fysisk skilt.", "Автомагистраль обозначается синим знаком, а не разметкой. На ней и жёлтой осевой нет — направления разделены физически."]
    ],
    "Gul varsellinje (oppmerking 1002) angir at sikten fremover er for kort til vanlig forbikjøring. Den kommer ofte før en sperrelinje.",
    "Varsellinje: видимость слишком короткая для безопасного обгона. Обычно предупреждает о скорой сплошной.",
    "Длинные штрихи = «не обгоняй, скоро сплошная». Короткие штрихи = обычная прерывистая."),

    q("m04", "Hva betyr en bred hvit tverrstripe (stopplinje)?", "Что означает широкая белая поперечная полоса (стоп-линия)?", [
      ["Du skal stoppe før linjen når du må stoppe", "Останавливаться нужно перед линией"],
      ["Linjen markerer gangfelt", "Линия обозначает пешеходный переход", "Gangfelt merkes med flere brede striper (sebrastriper), stopplinjen er én enkelt tverrstripe.", "Переход обозначают несколько широких полос (зебра), стоп-линия — одна поперечная полоса."],
      ["Linjen kan ignoreres", "Линию можно игнорировать", "Stopplinjen viser nøyaktig hvor du skal stoppe ved stoppskilt eller rødt lys. Å kjøre over den er et brudd.", "Стоп-линия точно показывает, где остановиться при знаке STOP или красном свете. Пересечь её — нарушение."],
      ["Bare busser må stoppe her", "Останавливаться должны только автобусы", "Stopplinjen gjelder alle kjørende, det finnes ingen egen regel for busser.", "Стоп-линия действует для всех водителей, отдельного правила для автобусов нет."]
    ],
    "Ved stoppskilt eller rødt lys stopper du foran stopplinjen.",
    "При знаке STOP или красном свете останавливаешься перед стоп-линией.",
    "Переехать стоп-линию хотя бы бампером — уже нарушение."),

    q("m05", "Hva betyr en rekke hvite trekanter (haitenner) på tvers av kjørefeltet?", "Что означает ряд белых треугольников («акульи зубы») поперёк полосы?", [
      ["Vikelinje: du har vikeplikt", "Линия «уступи дорогу»"],
      ["Stopplinje: full stopp", "Стоп-линия: полная остановка", "Trekantene betyr vikeplikt, ikke full stopp. Full stopp kreves bare ved stoppskilt og stopplinje.", "Треугольники означают «уступи», а не полную остановку. Полная остановка нужна только при знаке STOP и стоп-линии."],
      ["Gangfelt", "Пешеходный переход", "Gangfelt har brede rektangulære striper, ikke trekanter.", "У перехода широкие прямоугольные полосы, а не треугольники."],
      ["Fartshump", "Лежачий полицейский", "Fartshumper varsles med skilt og hvite trekanter som peker mot deg oppover humpen, men det er et annet mønster og en fysisk opphøyning i vegen.", "Лежачие полицейские обозначают знаком и другим рисунком на самом возвышении; vikelinje — это плоская разметка перед перекрёстком."]
    ],
    "Vikelinjen markerer hvor du skal vike. Den brukes sammen med vikepliktskiltet og i rundkjøringer.",
    "Vikelinje показывает, где уступать. Ставится вместе со знаком «уступи» и на кругах.",
    "Зубы «кусают» тебя = ты уступаешь. Полная остановка не обязательна."),

    q("m06", "Hva betyr hvite piler på skrå i kjørefeltet?", "Что означают белые косые стрелки в полосе?", [
      ["Kjørefeltet slutter, og du må skifte felt i pilens retning", "Полоса заканчивается, нужно перестроиться по стрелке"],
      ["Forbikjøring forbudt", "Обгон запрещён", "Forbikjøringsforbud vises med skilt 334 eller sperrelinje, ikke med piler.", "Запрет обгона обозначают знаком 334 или сплошной линией, а не стрелками."],
      ["Stans forbudt langs kanten", "Остановка у края запрещена", "Stansforbud vises med skilt 370, ikke med oppmerking i kjørefeltet.", "Запрет остановки обозначает знак 370, а не разметка в полосе."],
      ["Her begynner kollektivfelt", "Здесь начинается полоса для общественного транспорта", "Kollektivfelt merkes med skilt 508 og teksten BUSS i feltet, ikke med skrå piler.", "Полоса для общественного транспорта обозначается знаком 508 и надписью BUSS, а не косыми стрелками."]
    ],
    "Skiltforskriften, oppmerking 1034: piler på skrå i kjørefeltet angir at feltet slutter, og at videre kjøring skal skje i samsvar med trafikkreglene (fletting, vikeplikt ved feltskifte).",
    "Skiltforskriften, разметка 1034: косые стрелки в полосе означают, что полоса заканчивается и дальше нужно ехать по правилам (перестроение с уступкой, «молния»).",
    "Косые стрелки = «твоя полоса кончается, готовься перестроиться». Прямые стрелки перед перекрёстком = обязательное направление."),

    q("m07", "Hva betyr hvite piler i kjørefeltet før et kryss?", "Что означают белые стрелки в полосе перед перекрёстком?", [
      ["Du må kjøre i pilens retning fra dette feltet", "Из этой полосы нужно ехать по стрелке"],
      ["Anbefalt retning", "Рекомендуемое направление", "Kjørefeltpiler er påbud, ikke anbefaling. Har du valgt feltet, må du følge pilen.", "Стрелки в полосе — предписание, а не рекомендация. Выбрал полосу — обязан ехать по стрелке."],
      ["Pilen gjelder bare busser", "Стрелка только для автобусов", "Pilene gjelder alle kjørende i feltet. Kollektivfelt merkes med eget skilt og teksten BUSS.", "Стрелки действуют для всех, кто в этой полосе. Полоса для автобусов обозначается отдельным знаком и надписью BUSS."],
      ["Pilen viser envegskjøring", "Стрелка обозначает одностороннее движение", "Envegskjøring vises med blått skilt med hvit pil, ikke med piler i kjørefeltet.", "Одностороннее движение обозначается синим знаком с белой стрелкой, а не стрелками в полосе."]
    ],
    "Skiltforskriften, oppmerking 1034: piler i kjørefelt foran kryss angir at feltet skal brukes av dem som skal i pilens retning. Er feltet avgrenset av sperrelinje, er pilen påbudt kjøreretning.",
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
