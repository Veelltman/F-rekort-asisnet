/* Банк вопросов: ситуационные задачи (перекрёстки, приоритет, круговое движение, дорога).
   Картинки рисует js/scene-kit.js (window.SK). Ты — всегда синяя машина «A».

   Как задать картинку (подробно — в CONTRIBUTING-BOT.md):
     scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }], signs: { south: "yield" } })
         перекрёсток; стороны north/south/east/west; signs: yield | stop | priority; lights: red | yellow | green | flash;
         peds: ["east"] — пешеход на переходе рукава; roundabout: true (lanes: 2); rails: "ns"|"ew"; arms: [...] — Т-перекрёсток
     street({ features: [...], actors: [...] })  — прямая дорога, ты едешь снизу вверх
     SK.hill({ dir: "up"|"down", edge: "curb"|"ditch", wheels: "straight" })  — парковка на склоне
     SK.illus("wine-morning" | "party-glass" | "medicine" | "frost")
     null — если ни одна схема честно не показывает ситуацию */

(function () {
  "use strict";

  const SK = window.SK;
  function scene(cfg) { return SK.junction(cfg); }
  function street(cfg) { return SK.street(cfg); }

  /* Старые короткие вызовы road({ crossing: true }) и т.п. — теперь рисуются новым художником */
  const A = (y, extra) => Object.assign({ label: "A", y: y || 245, path: [[216, (y || 245) - 70]] }, extra || {});
  const ROAD_PRESETS = {
    crossing: c => street({ features: [{ type: "zebra", y: 120 }], actors: [c.crossing === "far"
      ? { kind: "adult", x: 174, y: 120, rot: 270, color: "#6b4fa0", walk: [154, 120] }
      : { kind: "adult", x: 246, y: 120, rot: 270, color: "#6b4fa0", walk: [230, 120] }, A(245)] }),
    narrow: () => street({ laneW: 22, center: "none", sides: { left: "grass", right: "grass" }, features: [{ type: "passingPlace", y: 150 }],
      actors: [A(250), { label: "B", lane: "left", y: 40, color: "#e0483a", path: [[189, 110]] }] }),
    exit: c => street({ features: [{ type: "driveway", y: 150, side: "right", label: c.exit === "gatetun" ? "GATETUN" : "P", lines: c.exit !== "gatetun" }],
      actors: [{ label: "A", x: 296, y: 158, rot: 270, path: [[248, 158]] }, { label: "B", lane: "left", y: 46, color: "#e0483a", path: [[184, 250]] }] }),
    tcross: () => street({ features: [{ type: "sideRoad", y: 110, side: "right" }],
      actors: [{ label: "B", x: 330, y: 95, rot: 270, color: "#e0483a", path: [[246, 95]] }, A(250)] }),
    bikeLane: () => street({ laneW: 34, features: [{ type: "sideRoad", y: 90, side: "right", w: 56 }, { type: "bikeLane", side: "right", gap: [62, 118] }],
      actors: [{ label: "A", x: 210, y: 210, blink: "right", path: [[210, 130], [250, 104], [340, 104]] }, { kind: "bike", x: 227, y: 268, label: "B", path: [[227, 200], [227, 20]] }] }),
    bus: c => street({ features: [{ type: "busStop", y: 116, side: "right", bay: true }, { type: "sign", kind: "speed:" + (c.limit || 50), y: 290, side: "left" }],
      actors: [{ kind: "bus", x: 245, y: 120, label: "B", blink: "left", path: [[245, 70], [216, 30], [216, 6]] }, A(255)] }),
    overtake: () => street({ sides: { left: "grass", right: "grass" }, actors: [{ kind: "bike", x: 225, y: 104, label: "S", path: [[225, 50]] },
      { label: "B", y: 172, color: "#e0483a", blink: "left", path: [[205, 132], [188, 96], [188, 30]] }, A(258)] }),
    night: () => street({ sides: { left: "grass", right: "grass" }, weather: "night", actors: [{ kind: "adult", x: 160, y: 96, rot: 180, color: "#30353c" }, A(250, { beams: "low" })] }),
    tunnel: () => street({ sides: { left: "grass", right: "grass" }, features: [{ type: "tunnel", y: 100, sign: true }], actors: [A(240)] }),
    rail: () => street({ sides: { left: "grass", right: "grass" }, features: [{ type: "rail", y: 110, lights: "flash" }], actors: [A(250)] }),
    roadwork: () => street({ sides: { left: "grass", right: "grass" }, features: [{ type: "roadwork", lane: 1, from: 30, to: 140 }, { type: "sign", kind: "roadwork", y: 230 }], actors: [A(255)] }),
    trailer: () => street({ features: [{ type: "sideRoad", y: 120, side: "right", w: 44 }], actors: [{ label: "A", x: 214, y: 52, trailer: "box", trailerRot: -55, steer: -26 }] }),
    lot: () => street({ noRoad: true, features: [{ type: "lot" }], actors: [{ label: "A", x: 186, y: 168, rot: 160 }, { label: "B", x: 218, y: 120, color: "#e0483a" }] }),
    wild: () => street({ sides: { left: "grass", right: "grass" }, weather: "dusk", features: [{ type: "sign", kind: "moose", y: 268, size: 28 }], actors: [{ kind: "moose", x: 262, y: 92, rot: 250 }, A(230, { beams: "low" })] }),
    bridge: () => street({ sides: { left: "grass", right: "grass" }, features: [{ type: "bridge", y: 110, h: 96 }], actors: [A(250)] }),
    rain: () => street({ sides: { left: "grass", right: "grass" }, weather: "rain", actors: [A(200)] }),
    rest: () => street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "off" }, { type: "sign", kind: "rest", x: 300, y: 150, size: 28 }], actors: [{ label: "A", lane: 1, y: 256, path: [[216, 200]] }] }),
    tram: () => street({ laneW: 34, features: [{ type: "tramRails" }], actors: [{ kind: "tram", x: 200, y: 92, label: "T", doors: true }, { label: "A", x: 220, y: 240, path: [[220, 176]] }] }),
    parkedChild: () => street({ actors: [{ label: "A", x: 220, y: 150, door: "right" }, { kind: "child", x: 244, y: 162, rot: 90, color: "#f08c1a" }] }),
    onramp: () => street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "on", to: 60 }],
      actors: [{ label: "A", x: 247, y: 240, blink: "left", path: [[247, 160], [216, 80], [216, 6]] }, { label: "B", lane: 1, y: 170, color: "#e0483a", path: [[216, 40]] }] }),
    truck: () => street({ features: [{ type: "sideRoad", y: 80, side: "right" }], actors: [{ kind: "truck", x: 200, y: 160, label: "B", color: "#e0483a", blink: "right", path: [[200, 112], [252, 95], [340, 95]] }, A(262)] })
  };
  function road(cfg) {
    const key = Object.keys(ROAD_PRESETS).find(k => cfg[k]);
    return key ? ROAD_PRESETS[key](cfg) : street(cfg);
  }
  window.SCENE = scene;
  window.ROAD = road;
  function hillScene(cfg) { return SK.hill(cfg || { dir: "down", edge: "ditch", wheels: "straight" }); }
  window.HILL_SCENE = hillScene;


  function q(id, image, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "sit-" + id, topic: "situational", type: "single-choice",
      prompt_no, prompt_ru, image,
      options: opts.map((o, i) => ({ text_no: o[0], text_ru: o[1], correct: i === 0, why_no: o[2] || null, why_ru: o[3] || null })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  function qm(id, image, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "sit-" + id, topic: "situational", type: "multi-choice", multi: true,
      prompt_no, prompt_ru, image,
      options: opts.map(o => ({ text_no: o[0], text_ru: o[1], correct: !!o[2], why_no: o[3] || null, why_ru: o[4] || null })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  window.QUESTION_DATA = window.QUESTION_DATA || {};
  window.QUESTION_DATA.situational = [

    q("001", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }] }),
      "Du (A) kjører rett fram i et kryss uten skilt. Bil B kommer fra høyre. Hvem har vikeplikt?",
      "Ты (A) едешь прямо через перекрёсток без знаков. Машина B едет справа. Кто должен уступить?",
      [
        ["Du (A) må vike for B — høyreregelen", "Ты (A) уступаешь B — правило правой руки"],
        ["B må vike fordi du kjører rett fram", "B уступает, потому что ты едешь прямо", "Å kjøre rett fram gir ingen forrang i kryss uten skilt, høyreregelen avgjør uansett retning.", "Движение прямо не даёт приоритета на перекрёстке без знаков — решает правило правой руки, независимо от направления."],
        ["Den som kommer først kjører først", "Кто первый приехал, тот и едет", "I Norge avgjør ikke ankomsttidspunktet, høyreregelen gjelder uansett hvem som kom først.", "В Норвегии очерёдность прибытия роли не играет — действует правило правой руки, кто бы ни подъехал первым."],
        ["Ingen har vikeplikt", "Никто не обязан уступать", "I ethvert kryss uten skilt gjelder høyreregelen, noen har alltid vikeplikt.", "На любом перекрёстке без знаков действует правило правой руки — кто-то всегда обязан уступить."]
      ],
      "I kryss uten skilt eller lys gjelder høyreregelen: du har vikeplikt for trafikk fra høyre.",
      "На перекрёстке без знаков и светофора действует правило правой руки: уступаешь тем, кто справа.",
      "«Прямо» не даёт приоритета. Только знаки, светофор или сторона (право) решают, кто едет первым."),

    q("002", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }] }),
      "Kryss uten skilt. Bil B kommer fra venstre. Hva gjør du?",
      "Перекрёсток без знаков. Машина B едет слева. Что делаешь?",
      [
        ["Kjører — B har vikeplikt for meg", "Еду — B должна уступить мне"],
        ["Stopper og venter på B", "Останавливаюсь и жду B", "Du har forrang siden du kommer fra høyre for B, det er ikke nødvendig å stoppe og vente.", "У тебя приоритет, ведь ты справа от B — останавливаться и ждать не нужно."],
        ["Blinker og lar B kjøre først", "Мигаю фарами и пропускаю B", "Å blinke med lysene er ikke et offisielt signal og skaper bare forvirring, du har uansett forrang.", "Мигание фарами — не официальный сигнал и только сбивает с толку, у тебя и так приоритет."],
        ["Kjører fortere for å komme foran", "Ускоряюсь, чтобы проехать первым", "Du trenger ikke skynde deg, du har allerede forrang etter høyreregelen.", "Спешить незачем — приоритет у тебя и так есть по правилу правой руки."]
      ],
      "Du er til høyre for B, så B må vike for deg. Men vær alltid klar til å bremse hvis B ikke viker.",
      "Ты справа от B, значит B уступает тебе. Но всегда будь готов затормозить, если B не уступит.",
      "Иметь приоритет ≠ можно не смотреть. На экзамене ценится «kjøre defensivt» — ехать с запасом."),

    q("003", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], signs: { south: "yield" } }),
      "Du (A) har vikepliktskilt. Bil B kommer fra høyre på kryssende vei. Hva gjør du?",
      "У тебя (A) знак «уступи дорогу». Машина B едет справа по пересекаемой дороге. Что делаешь?",
      [
        ["Senker farten og viker for B", "Снижаю скорость и уступаю B"],
        ["Kjører — jeg er allerede nær krysset", "Еду — я уже близко к перекрёстку", "Nærhet til krysset endrer ikke vikeplikten, du må uansett vike for trafikk på kryssende vei.", "Близость к перекрёстку ничего не меняет — обязанность уступить действует в любом случае."],
        ["Stopper helt selv om ingen kommer", "Полностью останавливаюсь, даже если никого нет", "Ved vikeplikt er det ikke krav om full stopp, det holder å senke farten hvis veien er fri.", "При знаке «уступи дорогу» полная остановка не обязательна — достаточно снизить скорость, если дорога свободна."],
        ["Tuter for å varsle B", "Сигналю, чтобы предупредить B", "Signalhorn erstatter ikke vikeplikten, du skal senke farten og vike, ikke varsle med lyd.", "Гудок не заменяет обязанность уступить — нужно снизить скорость и уступить, а не сигналить."]
      ],
      "Vikeplikt betyr at du må vike for ALL trafikk på kryssende vei — både fra høyre og venstre. Du trenger ikke stoppe hvis veien er fri.",
      "«Уступи дорогу» означает: уступаешь ВСЕМ на пересекаемой дороге — и справа, и слева. Останавливаться не обязательно, если дорога свободна.",
      "Vikeplikt ≠ Stopp. При vikeplikt можно проехать не останавливаясь, если никому не мешаешь."),

    q("004", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], signs: { south: "priority" } }),
      "Du (A) kjører på forkjørsvei. Bil B kommer fra høyre fra sidevei. Hvem har vikeplikt?",
      "Ты (A) на главной дороге. Машина B выезжает справа с второстепенной. Кто уступает?",
      [
        ["B må vike — jeg er på forkjørsvei", "B уступает — я на главной дороге"],
        ["Jeg må vike — B kommer fra høyre", "Я уступаю — B справа", "På forkjørsvei gjelder ikke høyreregelen, det er B som må vike for deg.", "На главной дороге правило правой руки не действует — уступить должен B, а не ты."],
        ["Den som er størst kjører først", "Кто больше, тот и едет", "Kjøretøyets størrelse har ingen betydning, forkjørsretten avgjøres av skiltingen.", "Размер машины тут ни при чём — приоритет определяется знаком."],
        ["Begge må stoppe", "Оба должны остановиться", "Bare den som kommer fra sideveien har vikeplikt, du på forkjørsveien trenger ikke stoppe.", "Уступить обязан только тот, кто со второстепенной, тебе на главной останавливаться не нужно."]
      ],
      "På forkjørsvei gjelder ikke høyreregelen. Trafikk fra sideveier må vike for deg.",
      "На главной дороге правило правой руки не действует. Транспорт с боковых дорог уступает тебе.",
      "Жёлтый ромб «отключает» правило правой руки. Это одна из главных ловушек на теории."),

    q("005", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }] }),
      "Du (A) skal svinge til venstre. Bil B kommer rett imot og skal rett fram. Hvem viker?",
      "Ты (A) поворачиваешь налево. Машина B едет навстречу прямо. Кто уступает?",
      [
        ["Jeg viker — møtende trafikk rett fram har forrang", "Я уступаю — встречный, едущий прямо, имеет преимущество"],
        ["B viker — jeg var først i krysset", "B уступает — я первый на перекрёстке", "Rekkefølgen inn i krysset er ikke avgjørende, den som svinger til venstre skal alltid vike for møtende som kjører rett fram.", "Порядок въезда на перекрёсток тут не важен — поворачивающий налево всегда уступает встречному, едущему прямо."],
        ["Jeg svinger raskt før B kommer", "Быстро поворачиваю до приезда B", "Å prøve å rekke unna før møtende trafikk er farlig og bryter med vikeplikten ved venstresving.", "Пытаться проскочить перед встречным опасно и нарушает обязанность уступить при повороте налево."],
        ["Høyreregelen avgjør", "Решает правило правой руки", "Høyreregelen gjelder ikke her, det er den spesielle regelen om venstresving mot møtende trafikk som avgjør.", "Правило правой руки тут ни при чём — действует особое правило про поворот налево навстречу транспорту."]
      ],
      "Når du svinger til venstre, må du vike for møtende trafikk som kjører rett fram eller svinger til høyre.",
      "При повороте налево ты уступаешь встречному транспорту, который едет прямо или поворачивает направо.",
      "Поворот налево — самый «слабый» манёвр на перекрёстке: уступаешь встречным, пешеходам, велосипедистам."),

    q("006", scene({ you: { from: "south", to: "east" }, others: [{ from: "north", to: "east" }] }),
      "Du (A) svinger til høyre. Møtende bil B svinger til venstre inn på samme vei. Hvem har forrang?",
      "Ты (A) поворачиваешь направо. Встречная машина B поворачивает налево на ту же дорогу. У кого преимущество?",
      [
        ["Jeg — den som svinger til venstre må vike", "У меня — поворачивающий налево уступает"],
        ["B — den som svinger til venstre har forrang", "У B — поворачивающий налево имеет преимущество", "Det er faktisk omvendt: høyresving går foran venstresving, ikke motsatt.", "На самом деле наоборот: поворот направо важнее поворота налево, а не наоборот."],
        ["Vi må begge stoppe og avtale", "Оба останавливаемся и договариваемся", "Det finnes en fast regel for dette, dere trenger ikke stoppe og avtale seg imellom.", "Для этого есть чёткое правило, договариваться и останавливаться не нужно."],
        ["Den raskeste bilen", "У более быстрой машины", "Farten på bilene avgjør ikke forrang, det er svingretningen som teller.", "Скорость машин тут ни при чём — важно направление поворота."]
      ],
      "Høyresving går foran venstresving. B må vente til du har svingt.",
      "Поворот направо важнее поворота налево. B ждёт, пока ты повернёшь.",
      "Правило простое: налево — уступаешь всем встречным, включая тех, кто поворачивает направо."),

    q("007", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], roundabout: true }),
      "Du (A) skal inn i en rundkjøring. Bil B er allerede inne i rundkjøringen. Hva gjør du?",
      "Ты (A) въезжаешь на круг. Машина B уже на кругу. Что делаешь?",
      [
        ["Viker for B — trafikk i rundkjøringen har forrang", "Уступаю B — те, кто на кругу, имеют преимущество"],
        ["Kjører inn — B kommer fra venstre", "Въезжаю — B едет слева", "I rundkjøring gjelder ikke høyreregelen, trafikk som allerede er inne har alltid forrang.", "На круге правило правой руки не действует — приоритет всегда у тех, кто уже на кругу."],
        ["Stopper alltid før rundkjøringen", "Всегда останавливаюсь перед кругом", "Det er ikke krav om full stopp, det holder å vike hvis noen er i rundkjøringen.", "Полная остановка не обязательна — достаточно уступить, если на кругу кто-то есть."],
        ["Kjører inn og tuter", "Въезжаю и сигналю", "Signalhorn erstatter ikke vikeplikten for trafikk som allerede er i rundkjøringen.", "Гудок не заменяет обязанность уступить тем, кто уже на кругу."]
      ],
      "Ved rundkjøring er det alltid vikeplikt for trafikk som allerede er i rundkjøringen, uansett hvor den kommer fra.",
      "На круговом движении всегда уступаешь тем, кто уже на кругу, откуда бы они ни ехали.",
      "Круг — исключение из правила правой руки: там уступаешь тем, кто слева (уже на кругу)."),

    q("008", scene({ you: { from: "south", to: "east" }, roundabout: true }),
      "Du kjører ut av rundkjøringen i første avkjøring (til høyre). Skal du bruke blinklys?",
      "Ты выезжаешь с круга на первом съезде (направо). Нужно ли включать поворотник?",
      [
        ["Ja — høyre blinklys når jeg skal ut", "Да — правый поворотник при выезде"],
        ["Nei — blinklys brukes ikke i rundkjøring", "Нет — на кругу поворотники не используются", "Blinklys skal tvert imot brukes i rundkjøring, spesielt høyre blinklys ved utkjøring.", "Поворотник наоборот нужен на кругу, особенно правый при выезде."],
        ["Ja — venstre blinklys", "Да — левый поворотник", "Venstre blinklys brukes ved innkjøring hvis du skal langt rundt, ved utkjøring skal du bruke høyre.", "Левый поворотник — для въезда, если едешь далеко по кругу, а при выезде нужен правый."],
        ["Bare hvis det er andre biler", "Только если есть другие машины", "Regelen om blinklys gjelder uansett om det er andre biler til stede eller ikke.", "Правило про поворотник действует независимо от того, есть ли рядом другие машины."]
      ],
      "Du skal alltid gi tegn med høyre blinklys når du forlater rundkjøringen. Skal du langt rundt, bruker du venstre blinklys inn.",
      "Всегда включай правый поворотник при выезде с круга. Если едешь далеко по кругу (налево) — при въезде включи левый.",
      "Правило «правый при выезде» экзаменатор проверяет каждый раз. Забыл — это ошибка на практике."),

    q("009", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], signs: { south: "stop" } }),
      "Du (A) har stoppskilt. Veien ser tom ut, men B nærmer seg fra venstre. Hva gjør du?",
      "У тебя (A) знак STOP. Дорога кажется пустой, но B приближается слева. Что делаешь?",
      [
        ["Stopper helt ved stopplinjen, ser, og viker for B", "Полностью останавливаюсь у стоп-линии, смотрю и уступаю B"],
        ["Senker farten og kjører — veien er nesten tom", "Снижаю скорость и еду — дорога почти пустая", "Stoppskilt krever full stopp, det holder ikke å bare senke farten selv om veien virker tom.", "Знак STOP требует полной остановки — снизить скорость недостаточно, даже если дорога кажется пустой."],
        ["Kjører fordi B kommer fra venstre", "Еду, потому что B слева", "Ved stoppskilt spiller det ingen rolle om trafikken kommer fra venstre eller høyre, du skal uansett stoppe og vike.", "У знака STOP не важно, справа или слева едет машина — в любом случае нужно остановиться и уступить."],
        ["Stopper midt i krysset", "Останавливаюсь посреди перекрёстка", "Du skal stoppe ved stopplinjen før krysset, ikke midt i krysset.", "Останавливаться нужно у стоп-линии перед перекрёстком, а не посреди него."]
      ],
      "Stoppskilt krever full stopp uansett. Etter stoppet har du vikeplikt for all trafikk på kryssende vei.",
      "Знак STOP требует полной остановки в любом случае. После остановки уступаешь всем на пересекаемой дороге.",
      "У STOP «слева/справа» неважно — уступаешь всем. Твоя обязанность = остановиться + уступить."),

    q("010", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], lights: { south: "green", east: "red" } }),
      "Du kjører rett fram og kommer til et kryss der trafikklyset er grønt for deg. Bil B fra høyre har rødt. Hva gjelder?",
      "Ты едешь прямо, для тебя зелёный. Машина B справа — на красный. Что действует?",
      [
        ["Jeg kjører — lyssignal går foran høyreregelen", "Еду — светофор важнее правила правой руки"],
        ["Jeg viker for B fordi B er til høyre", "Уступаю B, потому что B справа", "Høyreregelen gjelder ikke når det er trafikklys, lyset avgjør, og grønt betyr at du har forrang.", "Правило правой руки не действует при работающем светофоре — решает сигнал, и зелёный даёт тебе приоритет."],
        ["Jeg stopper for sikkerhets skyld", "Останавливаюсь на всякий случай", "Grønt lys gir deg rett til å kjøre, unødvendig stopp kan forvirre trafikken bak deg.", "Зелёный даёт право ехать — ненужная остановка может запутать машины позади."],
        ["Grønt lys betyr bare at jeg KAN kjøre hvis B viker", "Зелёный значит, что я могу ехать только если B уступит", "Grønt lys gir deg forrang direkte, det er ikke betinget av at B velger å vike.", "Зелёный сразу даёт приоритет, это не зависит от того, уступит ли B."]
      ],
      "Trafikklys går foran både skilt og høyreregelen. Grønt lys = du kan kjøre, men fortsatt med aktsomhet.",
      "Светофор важнее и знаков, и правила правой руки. Зелёный — можно ехать, но с осторожностью.",
      "Иерархия: указания полицейского > светофор > знаки > правило правой руки."),

    q("011", street({ features: [{ type: "zebra", y: 120 }], actors: [{ kind: "adult", x: 246, y: 120, rot: 270, color: "#6b4fa0", walk: [230, 120] }, { label: "A", y: 245, path: [[216, 170]] }] }),
      "Du nærmer deg et gangfelt. En fotgjenger står på fortauet og ser ut til å ville krysse. Hva gjør du?",
      "Ты подъезжаешь к пешеходному переходу. Пешеход стоит на тротуаре и, похоже, хочет перейти. Что делаешь?",
      [
        ["Senker farten og stopper for å slippe fotgjengeren over", "Снижаю скорость и останавливаюсь, чтобы пропустить"],
        ["Kjører — fotgjengeren er ikke i veien ennå", "Еду — пешеход ещё не на дороге", "Vikeplikten gjelder også for fotgjengere som er på vei ut i gangfeltet, ikke bare de som allerede står der.", "Обязанность уступить действует и для пешеходов, которые только собираются ступить на переход, а не только для тех, кто уже там."],
        ["Tuter så fotgjengeren venter", "Сигналю, чтобы пешеход подождал", "Signalhorn skal ikke brukes for å presse fotgjengeren til å vente, du skal selv stoppe.", "Гудок нельзя использовать, чтобы заставить пешехода подождать — останавливаться должен ты сам."],
        ["Kjører raskere for å passere før fotgjengeren går", "Ускоряюсь, чтобы проехать до него", "Å øke farten nær et gangfelt er farlig og bryter direkte med vikeplikten for fotgjengere.", "Ускоряться рядом с переходом опасно и прямо нарушает обязанность уступить пешеходу."]
      ],
      "Du har vikeplikt for fotgjengere som er i gangfeltet ELLER på vei ut i det. Vis tydelig at du stopper.",
      "Ты уступаешь пешеходу, который на переходе ИЛИ собирается ступить на него. Покажи явно, что останавливаешься.",
      "В Норвегии нормально уступать пешеходу, который только собирается перейти. Так и на экзамене ожидают."),

    q("012", street({ laneW: 22, center: "none", sides: { left: "grass", right: "grass" }, features: [{ type: "passingPlace", y: 150 }], actors: [{ label: "A", y: 250, path: [[211, 200]] }, { label: "B", lane: "left", y: 40, color: "#e0483a", path: [[189, 110]] }] }),
      "Smal vei med møteplass på din side. Bil B kommer imot. Hvem skal vente?",
      "Узкая дорога, карман для разъезда на твоей стороне. Машина B едет навстречу. Кто ждёт?",
      [
        ["Jeg — møteplassen er på min side", "Я — карман на моей стороне"],
        ["B — jeg kom først", "B — я приехал первым", "Rekkefølgen er ikke avgjørende, det er hvem møteplassen befinner seg hos som bestemmer hvem som venter.", "Очерёдность прибытия тут не важна — решает, у кого из двоих находится карман."],
        ["Den som har størst bil", "У кого машина больше", "Bilens størrelse avgjør ikke, det er plasseringen av møteplassen som bestemmer hvem som venter.", "Размер машины ни при чём — решает расположение кармана."],
        ["Ingen — vi klemmer oss forbi", "Никто — протискиваемся", "Å presse seg forbi på en smal vei er farlig, den med møteplass på sin side skal bruke den.", "Протискиваться на узкой дороге опасно — тот, у кого карман на своей стороне, должен им воспользоваться."]
      ],
      "Trafikkreglene § 7 nr. 6: kjørende som møtes, skal i god tid vike tilstrekkelig til høyre og om nødvendig stanse. Møteplassen (skilt 524) brukes av den som har den på sin høyre side. Du rygger ikke inn i møteplass på motsatt side.",
      "На узкой дороге используешь карман, который на твоей стороне. Задним ходом в карман на противоположной стороне не заезжают.",
      "На норвежских узких дорогах (særlig på Vestlandet) знак «M» = møteplass. Кому он ближе, тот и ждёт."),

    q("013", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }, { from: "west", to: "east" }] }),
      "Kryss uten skilt. B kommer fra høyre, C fra venstre. I hvilken rekkefølge kjører dere?",
      "Перекрёсток без знаков. B справа, C слева. В каком порядке все проезжают?",
      [
        ["B, så jeg (A), så C", "B, потом я (A), потом C"],
        ["Jeg (A), så B, så C", "Я (A), потом B, потом C", "Du har B til høyre for deg, så B kjører først, ikke du.", "Справа от тебя B, поэтому первым едет он, а не ты."],
        ["C, så B, så jeg (A)", "C, потом B, потом я (A)", "Rekkefølgen er feil snudd, det er B som har ingen til høyre og derfor kjører først.", "Порядок перепутан наоборот — первым едет именно B, у которого справа никого нет."],
        ["Alle kjører samtidig", "Все едут одновременно", "Høyreregelen setter opp en bestemt rekkefølge, dere kan ikke kjøre samtidig.", "Правило правой руки задаёт чёткую очерёдность, ехать одновременно нельзя."]
      ],
      "Høyreregelen i kjede: B har ingen til høyre og kjører først. Du viker for B, C viker for deg.",
      "Правило правой руки цепочкой: у B никого справа — едет первым. Ты уступаешь B, C уступает тебе.",
      "Найди того, у кого справа никого нет — он едет первым. Дальше по цепочке."),

    q("014", street({ features: [{ type: "driveway", y: 150, side: "right", label: "P", lines: true }], actors: [{ label: "A", x: 296, y: 158, rot: 270, blink: "right", path: [[238, 158], [216, 130], [216, 40]] }, { label: "B", lane: "left", y: 46, color: "#e0483a", path: [[184, 250]] }, { label: "C", y: 266, color: "#22a06b", path: [[216, 210]] }] }),
      "Du kjører ut fra en parkeringsplass og inn på veien. Hvem har vikeplikt?",
      "Ты выезжаешь с парковки на дорогу. Кто уступает?",
      [
        ["Jeg — den som kjører ut fra parkeringsplass, gårdsvei eller bensinstasjon viker for all trafikk", "Я — выезжающий с парковки, двора или заправки уступает всем"],
        ["Trafikken på veien viker for meg", "Транспорт на дороге уступает мне", "Det er omvendt: den som kjører ut fra parkeringsplass har alltid vikeplikt for veitrafikken.", "Всё наоборот: выезжающий с парковки всегда уступает транспорту на дороге."],
        ["Høyreregelen gjelder", "Действует правило правой руки", "Høyreregelen gjelder mellom likestilte veier, ikke ved utkjøring fra parkeringsplass, der du alltid viker.", "Правило правой руки действует между равнозначными дорогами, а не при выезде с парковки, где ты всегда уступаешь."],
        ["Ingen har vikeplikt", "Никто не уступает", "Den som kjører ut fra parkeringsplass har alltid vikeplikt, det finnes ikke situasjon uten den.", "У выезжающего с парковки всегда есть обязанность уступить — ситуации без неё тут не бывает."]
      ],
      "Utkjøring fra parkeringsplass, gårdsvei, bensinstasjon o.l. gir alltid vikeplikt for trafikken på veien — også for fotgjengere på fortauet.",
      "Выезд с парковки, двора, заправки — ты всегда уступаешь транспорту на дороге и пешеходам на тротуаре.",
      "Здесь правило правой руки НЕ работает. Выезжающий со «второстепенной территории» уступает всем."),

    q("015", street({ features: [{ type: "busStop", y: 116, side: "right", bay: true }, { type: "sign", kind: "speed:50", y: 290, side: "left" }], actors: [{ kind: "bus", x: 245, y: 120, label: "B", blink: "left", path: [[245, 70], [216, 30], [216, 6]] }, { label: "A", y: 255, path: [[216, 190]] }] }),
      "En buss med blinklys signaliserer at den vil kjøre ut fra holdeplass i 50-sone. Hva gjør du?",
      "Автобус с поворотником показывает, что выезжает с остановки в зоне 50 км/ч. Что делаешь?",
      [
        ["Slipper bussen ut — den har forrang i 60-sone eller lavere", "Пропускаю автобус — он имеет преимущество в зоне до 60 км/ч"],
        ["Kjører forbi — bussen må vente", "Проезжаю мимо — автобус ждёт", "I 60-sone eller lavere er det du som skal slippe bussen fram, ikke omvendt.", "В зоне 60 и ниже именно ты обязан пропустить автобус, а не наоборот."],
        ["Tuter for å vise at jeg kommer", "Сигналю, что еду", "Signalhorn erstatter ikke plikten til å slippe bussen fram, du skal senke farten og vente.", "Гудок не заменяет обязанность пропустить автобус — нужно снизить скорость и подождать."],
        ["Stopper helt bak bussen", "Полностью останавливаюсь за автобусом", "Full stopp er ikke nødvendig, det holder å senke farten og la bussen kjøre ut.", "Полная остановка не обязательна, достаточно снизить скорость и дать автобусу выехать."]
      ],
      "Der fartsgrensen er 60 km/t eller lavere, skal du slippe fram buss som gir tegn om å kjøre ut fra holdeplass.",
      "Там, где ограничение 60 км/ч или ниже, ты обязан пропустить автобус, который показывает поворотником выезд с остановки.",
      "Это прямое правило норвежских ПДД — автобус в городе имеет преимущество при выезде с остановки."),

    q("016", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west", kind: "emergency" }] }),
      "Du hører sirene og ser en utrykningsbil med blålys komme fra høyre. Hva gjør du?",
      "Слышишь сирену и видишь машину с мигалками справа. Что делаешь?",
      [
        ["Gir fri vei — stopper eller kjører til siden trygt", "Освобождаю дорогу — безопасно останавливаюсь или сдвигаюсь в сторону"],
        ["Kjører videre — jeg hadde grønt lys", "Еду дальше — у меня был зелёный", "Utrykningskjøretøy med blålys har forrang foran vanlig lyssignal, grønt lys fritar deg ikke fra å gi fri vei.", "У спецтранспорта с мигалками приоритет выше обычного светофора — зелёный не освобождает от обязанности уступить."],
        ["Kjører fortere for å komme unna", "Ускоряюсь, чтобы уехать", "Å øke farten gjør situasjonen farligere i stedet for å gi utrykningskjøretøyet fri vei på en trygg måte.", "Ускорение делает ситуацию опаснее вместо того, чтобы безопасно освободить дорогу спецтранспорту."],
        ["Bremser hardt midt i krysset", "Резко торможу посреди перекрёстка", "Brå bremsing midt i krysset skaper fare, du bør heller finne et trygt sted å stanse eller flytte deg til siden.", "Резкое торможение посреди перекрёстка опасно — лучше найти безопасное место, чтобы остановиться или сместиться в сторону."]
      ],
      "Utrykningskjøretøy med blålys og sirene har forrang foran alt annet. Gi fri vei, men ikke gjør noe farlig eller brått.",
      "Спецтранспорт с мигалками и сиреной имеет преимущество перед всем. Освободи дорогу, но без опасных резких манёвров.",
      "Не тормози резко посреди перекрёстка — лучше спокойно доехать до места, где можно безопасно уступить."),

    q("017", street({ features: [{ type: "sideRoad", y: 110, side: "right" }], actors: [{ label: "B", x: 330, y: 95, rot: 270, color: "#e0483a", blink: "right", path: [[246, 95], [216, 70], [216, 10]] }, { label: "A", y: 250, path: [[216, 140]] }] }),
      "T-kryss uten skilt. Du kjører på den gjennomgående vegen. Bil B kommer fra sidevegen til høyre. Hvem viker?",
      "Т-образный перекрёсток без знаков. Ты едешь по сквозной дороге. Машина B выезжает с боковой справа. Кто уступает?",
      [
        ["Jeg viker: høyreregelen gjelder også i T-kryss", "Я уступаю: правило правой руки действует и на Т-перекрёстке"],
        ["B viker: den gjennomgående vegen har forrang", "B уступает: у сквозной дороги приоритет", "En gjennomgående veg gir ikke automatisk forrang i Norge, uten skilt gjelder høyreregelen selv i T-kryss.", "Сквозная дорога в Норвегии автоматически приоритета не даёт — без знаков и на Т-перекрёстке действует правило правой руки."],
        ["Den som kommer først", "Кто первый приехал", "Ankomsttidspunktet avgjør ikke, høyreregelen bestemmer hvem som viker.", "Время прибытия роли не играет — кто уступает, решает правило правой руки."],
        ["Ingen har vikeplikt", "Никто не уступает", "I ethvert kryss uten skilt gjelder høyreregelen, noen har alltid vikeplikt, også i T-kryss.", "На любом перекрёстке без знаков действует правило правой руки — кто-то всегда обязан уступить, в том числе на Т-образном."]
      ],
      "I Norge gir ikke en gjennomgående veg forrang av seg selv. Uten skilt gjelder høyreregelen også i T-kryss.",
      "В Норвегии сквозная дорога сама по себе не даёт приоритета. Без знаков правило правой руки действует и на Т-перекрёстке.",
      "Ловушка для тех, кто учил ПДД в других странах: «прямая дорога главнее» здесь не работает. Ищи знак или уступай справа."),

    q("018", scene({ you: { from: "south", to: "east" }, lights: { south: "red" } }),
      "Du har rødt lys og skal svinge til høyre. Ingen kommer. Kan du svinge?",
      "У тебя красный, ты поворачиваешь направо. Никого нет. Можно повернуть?",
      [
        ["Nei, rødt lys betyr stopp, også for høyresving", "Нет, красный означает стоп, в том числе для поворота направо"],
        ["Ja, høyresving på rødt er lov hvis det er fritt", "Да, направо на красный можно, если свободно", "Norge har ingen regel om høyresving på rødt, i motsetning til enkelte andre land, rødt betyr stopp uansett retning.", "В Норвегии, в отличие от некоторых других стран, нет правила про поворот направо на красный — красный означает стоп в любом направлении."],
        ["Ja, hvis jeg stopper først", "Да, если сначала остановлюсь", "Å stoppe først endrer ingenting, du skal fortsatt vente på grønt lys før du kjører.", "Остановка сначала ничего не меняет — всё равно нужно дождаться зелёного, прежде чем ехать."],
        ["Ja, men bare om natten", "Да, но только ночью", "Tidspunktet på døgnet har ingen betydning, rødt lys gjelder likt hele døgnet.", "Время суток тут ни при чём — красный действует одинаково круглые сутки."]
      ],
      "I Norge finnes ikke «høyresving på rødt». Du venter på grønt eller grønn pil.",
      "В Норвегии нет «поворота направо на красный». Ждёшь зелёного или зелёной стрелки.",
      "Проезд на красный — 10 750 kr и 3 балла, даже если ты «только направо»."),

    q("019", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }], lights: { south: "green", north: "green" } }),
      "Grønt lys. Du skal svinge til venstre, og møtende bil B skal rett fram, også på grønt. Hvem kjører først?",
      "Зелёный. Ты поворачиваешь налево, встречная B едет прямо, тоже на зелёный. Кто едет первым?",
      [
        ["B: jeg må vike for møtende trafikk selv om jeg har grønt", "B: я уступаю встречному, даже если у меня зелёный"],
        ["Jeg: grønt lys gir meg forrang", "Я: зелёный даёт мне преимущество", "Grønt lys lar deg kjøre inn i krysset, men fritar deg ikke fra vikeplikten for møtende ved venstresving.", "Зелёный разрешает въехать на перекрёсток, но не снимает обязанность уступить встречному при повороте налево."],
        ["Den som er raskest", "Кто быстрее", "Farten avgjør ikke rekkefølgen, regelen om venstresving mot møtende gjør det.", "Скорость не определяет очерёдность — её определяет правило про поворот налево навстречу транспорту."],
        ["Vi stopper begge", "Оба останавливаемся", "Det er ikke nødvendig at begge stopper, B kan kjøre rett fram mens du venter.", "Останавливаться обоим не нужно — B может ехать прямо, пока ты ждёшь."]
      ],
      "Grønt lys betyr at du kan kjøre inn i krysset, men vikeplikten for møtende trafikk ved venstresving gjelder fortsatt.",
      "Зелёный означает, что можно въехать на перекрёсток, но обязанность уступить встречным при повороте налево остаётся.",
      "Зелёный — не «мне все уступают». При левом повороте встречный прямо всегда первый."),

    q("020", scene({ you: { from: "south", to: "east" }, peds: ["east"], lights: { south: "green" } }),
      "Grønt lys, du svinger til høyre. Fotgjengere krysser på gangfeltet i gaten du svinger inn i, også på grønt. Hva gjør du?",
      "Зелёный, ты поворачиваешь направо. Пешеходы переходят по зебре на улице, куда ты сворачиваешь, тоже на зелёный. Что делаешь?",
      [
        ["Stopper og slipper fotgjengerne over", "Останавливаюсь и пропускаю пешеходов"],
        ["Kjører: jeg har grønt", "Еду: у меня зелёный", "Grønt lys for deg fritar deg ikke fra vikeplikten for gående som krysser vegen du svinger inn i.", "Твой зелёный не снимает обязанность уступить пешеходам, переходящим дорогу, на которую ты сворачиваешь."],
        ["Tuter så de skynder seg", "Сигналю, чтобы поторопились", "Signalhorn skal ikke brukes for å presse fotgjengere, du skal selv vente.", "Гудок нельзя использовать, чтобы поторопить пешеходов — ждать должен ты сам."],
        ["Kjører sakte mellom dem", "Медленно еду между ними", "Å kjøre mellom fotgjengerne er farlig, du skal stoppe helt til gangfeltet er fritt.", "Ехать между пешеходами опасно — нужно полностью остановиться, пока переход не освободится."]
      ],
      "Når du svinger, har du vikeplikt for gående og syklende som krysser den vegen du svinger inn i.",
      "При повороте ты уступаешь пешеходам и велосипедистам, пересекающим дорогу, на которую сворачиваешь.",
      "Пешеходы на зелёный и ты на зелёный одновременно — норма в Норвегии. Ты ждёшь."),

    q("021", scene({ you: { from: "south", to: "west", lane: "left", blink: "left" }, roundabout: true, lanes: 2 }),
      "Rundkjøring med to felt. Du skal ta tredje avkjøring (til venstre). Hvilket felt velger du inn?",
      "Круг с двумя полосами. Тебе нужен третий съезд (налево). Какую полосу выбрать при въезде?",
      [
        ["Venstre felt, med venstre blinklys på vei inn", "Левую, с левым поворотником при въезде"],
        ["Høyre felt, det er alltid tryggest", "Правую, так всегда безопаснее", "Høyre felt er for første og andre avkjøring, til tredje avkjøring eller lenger skal du bruke venstre felt.", "Правая полоса — для первого и второго съезда, для третьего и дальше нужна левая."],
        ["Spiller ingen rolle", "Не имеет значения", "Feltvalget har betydning for hvordan du skal svinge og gi tegn, det er ikke likegyldig.", "Выбор полосы важен для манёвра и сигналов поворота — это не всё равно."],
        ["Midt mellom feltene", "Посередине между полосами", "Å kjøre midt mellom feltene er ikke lovlig, du skal velge ett av de to feltene tydelig.", "Ехать посередине между полосами нельзя — нужно чётко выбрать одну из двух."]
      ],
      "Skal du til venstre eller snu, bruker du venstre felt og gir tegn til venstre inn. Skift til høyre felt med høyre blinklys før avkjøringen.",
      "Если налево или разворот — левая полоса и левый поворотник при въезде. Перед съездом перестраивайся вправо с правым поворотником.",
      "Правая полоса — для первого и второго съезда. Левая — для третьего и разворота."),

    q("022", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "on", to: 60 }, { type: "sign", kind: "motorway", x: 128, y: 70, size: 26 }], actors: [{ label: "A", x: 247, y: 240, blink: "left", path: [[247, 160], [216, 80], [216, 6]] }, { label: "B", lane: 1, y: 170, color: "#e0483a", path: [[216, 40]] }, { label: "C", lane: 0, y: 120, color: "#22a06b", path: [[184, 30]] }] }),
      "Du kjører inn på motorveg via påkjøringsfelt. Hvem har vikeplikt?",
      "Ты въезжаешь на автомагистраль по полосе разгона. Кто уступает?",
      [
        ["Jeg: trafikken på motorvegen har forrang, men de bør legge til rette", "Я: у потока на магистрали приоритет, но они должны помогать"],
        ["Trafikken på motorvegen må slippe meg inn", "Поток на магистрали обязан меня пропустить", "Det er omvendt, det er du som kjører inn fra påkjøringsfeltet som har vikeplikt.", "Наоборот: именно ты, въезжающий с полосы разгона, обязан уступить."],
        ["Fletteregelen: annenhver bil", "Правило молнии: через одного", "Fletteregelen gjelder der to felt går sammen til ett, ikke ved påkjøring til motorveg, der du har vikeplikt.", "Правило молнии действует при слиянии двух полос в одну, а не при въезде на автомагистраль, где у тебя есть обязанность уступить."],
        ["Ingen, jeg kjører bare inn", "Никто, просто въезжаю", "Du kan ikke bare kjøre inn uten å ta hensyn, du har vikeplikt for trafikken på motorvegen.", "Просто въехать без учёта обстановки нельзя — у тебя есть обязанность уступить потоку на магистрали."]
      ],
      "Trafikkreglene § 8: den som skifter felt, har vikeplikt, og i felt for fartsøkning skal du tilpasse farten til trafikken du skal inn i. Bruk hele feltet og velg en luke. De som kjører i feltet ved siden av, skal lette innkjøringen.",
      "Trafikkreglene § 8: перестраивающийся уступает, а на полосе разгона нужно подстроить скорость под поток, в который вливаешься. Используй всю полосу и выбери просвет. Те, кто едет в соседней полосе, обязаны облегчить въезд.",
      "Не останавливайся в конце полосы разгона: набери скорость потока, иначе слияние станет опасным."),

    q("023", street({ sides: { left: "grass", right: "grass" }, actors: [{ kind: "bike", x: 225, y: 104, label: "S", path: [[225, 50]] }, { label: "B", y: 172, color: "#e0483a", blink: "left", path: [[205, 132], [188, 96], [188, 30]] }, { label: "A", y: 258, path: [[216, 222]] }] }),
      "Bilen foran deg gir tegn til venstre for å kjøre forbi en syklist. Du ville også kjørt forbi. Hva gjør du?",
      "Машина впереди включает левый поворотник, чтобы объехать велосипедиста. Ты тоже хотел обогнать. Что делаешь?",
      [
        ["Venter: det er forbudt å kjøre forbi en bil som selv kjører forbi eller gir tegn til det", "Жду: запрещено обгонять машину, которая сама обгоняет или показывает намерение"],
        ["Kjører forbi begge samtidig", "Обгоняю обоих сразу", "Å kjøre forbi to kjøretøy samtidig i en slik situasjon er svært farlig og ulovlig her.", "Обгонять сразу оба ТС в такой ситуации очень опасно и запрещено."],
        ["Tuter og kjører forbi på høyre side", "Сигналю и обгоняю справа", "Forbikjøring på høyre side er som hovedregel forbudt, og hornet endrer ikke på forbudet mot å kjøre forbi her.", "Обгон справа как правило запрещён, а гудок не отменяет запрет обгонять в этой ситуации."],
        ["Blinker med fjernlys", "Мигаю дальним", "Å blinke med fjernlys gir deg ingen rett til å kjøre forbi, forbudet gjelder uansett.", "Мигание дальним не даёт права на обгон — запрет действует в любом случае."]
      ],
      "Trafikkreglene § 12 nr 2 b: før du kjører forbi, skal du forvisse deg om at den forankjørende ikke har gitt tegn om forbikjøring. Vent til bilen foran har kjørt forbi syklisten og situasjonen er klar.",
      "Trafikkreglene § 12 nr 2 b: перед обгоном нужно убедиться, что машина впереди не подала сигнал об обгоне. Дождись, пока она объедет велосипедиста и ситуация прояснится.",
      "«Обгон обгоняющего» — один из самых опасных манёвров и прямое нарушение."),

    q("024", street({ laneW: 34, features: [{ type: "sideRoad", y: 90, side: "right", w: 56 }, { type: "bikeLane", side: "right", gap: [62, 118] }], actors: [{ label: "A", x: 210, y: 210, blink: "right", path: [[210, 130], [250, 104], [340, 104]] }, { kind: "bike", x: 227, y: 268, label: "B", path: [[227, 200], [227, 20]] }] }),
      "Du skal svinge til høyre i et kryss. Det er sykkelfelt på høyre side, og en syklist bak deg kjører rett fram. Hva gjør du?",
      "Ты поворачиваешь направо на перекрёстке. Справа велополоса, велосипедист сзади едет прямо. Что делаешь?",
      [
        ["Slipper syklisten fram før jeg svinger", "Пропускаю велосипедиста, потом поворачиваю"],
        ["Svinger raskt før syklisten kommer", "Быстро поворачиваю до велосипедиста", "Å prøve å rekke unna før syklisten er farlig og bryter med vikeplikten din.", "Пытаться проскочить перед велосипедистом опасно и нарушает твою обязанность уступить."],
        ["Kjører inn i sykkelfeltet for å blokkere", "Въезжаю в велополосу, чтобы перекрыть", "Å blokkere sykkelfeltet er ikke tillatt og løser ikke vikeplikten din, du skal vente.", "Перекрывать велополосу нельзя, и это не отменяет твою обязанность уступить — нужно подождать."],
        ["Tuter og svinger", "Сигналю и поворачиваю", "Signalhorn erstatter ikke vikeplikten, du skal la syklisten kjøre fram først.", "Гудок не заменяет обязанность уступить — сначала нужно пропустить велосипедиста."]
      ],
      "Ved høyresving over sykkelfelt har du vikeplikt for syklende som kjører rett fram, også de som kommer bakfra.",
      "При повороте направо через велополосу ты уступаешь велосипедистам, едущим прямо, в том числе тем, кто догоняет сзади.",
      "Перед поворотом направо — правое зеркало и взгляд через плечо. Это проверяют на oppkjøring."),

    q("025", street({ sides: { left: "grass", right: "grass" }, weather: "night", actors: [{ kind: "adult", x: 160, y: 96, rot: 180, color: "#30353c", walk: [160, 126] }, { label: "A", y: 250, beams: "high", path: [[216, 196]] }], tags: [{ text: "MØRKE KLÆR", x: 98, y: 70 }] }),
      "Det er mørkt, og du ser en fotgjenger i mørke klær som går på venstre side av en veg uten fortau. Hva gjør du?",
      "Темно, ты видишь пешехода в тёмной одежде, идущего по левой стороне дороги без тротуара. Что делаешь?",
      [
        ["Senker farten, holder god avstand og bruker nærlys", "Снижаю скорость, держу дистанцию, переключаюсь на ближний"],
        ["Blinker med fjernlys så han flytter seg", "Мигаю дальним, чтобы отошёл", "Fjernlys blender fotgjengeren i stedet for å hjelpe, bruk nærlys og senk farten.", "Дальний свет слепит пешехода вместо того, чтобы помочь — используй ближний и снизь скорость."],
        ["Kjører som normalt, han går riktig", "Еду как обычно, он идёт правильно", "Selv om fotgjengeren går på riktig side, bør du fortsatt senke farten og holde avstand siden han er vanskelig å se i mørke klær.", "Даже если пешеход идёт правильно, всё равно стоит снизить скорость и держать дистанцию — в тёмной одежде его плохо видно."],
        ["Tuter", "Сигналю", "Signalhorn er unødvendig og upassende her, riktig reaksjon er å senke farten og holde avstand.", "Гудок тут не нужен и неуместен — правильная реакция — снизить скорость и держать дистанцию."]
      ],
      "Fotgjengere skal gå på venstre side mot trafikken der det ikke er fortau. Fjernlys blender. Senk farten og pass avstanden.",
      "Пешеходы без тротуара идут по левой стороне навстречу движению. Дальний свет слепит. Снизь скорость и держи дистанцию.",
      "Осенью и зимой в Норвегии темно большую часть дня. Пешеход без рефлекса виден с 25–30 м, с рефлексом — со 140 м."),

    q("026", street({ features: [{ type: "driveway", y: 150, side: "right", surface: "#cdbfae", label: "GATETUN" }, { type: "sign", kind: "gatetun", x: 268, y: 116, size: 24 }], actors: [{ kind: "child", x: 330, y: 140, rot: 0, color: "#f08c1a" }, { label: "A", x: 300, y: 158, rot: 270, blink: "right", path: [[238, 158], [216, 130], [216, 40]] }, { label: "B", lane: "left", y: 46, color: "#e0483a", path: [[184, 250]] }] }),
      "Du kjører ut fra et gatetun og inn på en vanlig gate. Hvem har vikeplikt?",
      "Ты выезжаешь из жилой зоны (gatetun) на обычную улицу. Кто уступает?",
      [
        ["Jeg: utkjøring fra gatetun gir vikeplikt for all trafikk", "Я: выезд из gatetun означает уступить всем"],
        ["Høyreregelen gjelder", "Действует правило правой руки", "Høyreregelen gjelder mellom likestilte veier, ikke ved utkjøring fra gatetun, der du alltid viker.", "Правило правой руки действует между равнозначными дорогами, а не при выезде из gatetun, где ты всегда уступаешь."],
        ["Trafikken i gaten viker for meg", "Транспорт на улице уступает мне", "Det er omvendt: den som kjører ut fra gatetun har alltid vikeplikt for trafikken i gaten.", "Всё наоборот: выезжающий из gatetun всегда уступает транспорту на улице."],
        ["Ingen har vikeplikt", "Никто не уступает", "Den som kjører ut fra gatetun har alltid vikeplikt, det finnes ikke situasjon uten den.", "У выезжающего из gatetun всегда есть обязанность уступить — ситуации без неё не бывает."]
      ],
      "Utkjøring fra gatetun, gågate, parkeringsplass, bensinstasjon eller gårdsveg gir alltid vikeplikt for trafikken du kjører inn i.",
      "Выезд из gatetun, gågate, парковки, заправки или двора всегда означает уступить транспорту, в который ты вливаешься.",
      "Все «выезды с территорий» работают одинаково: ты последний в очереди."),

    q("027", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "tunnel", y: 100, sign: true }], weather: "sun", actors: [{ label: "A", y: 240, path: [[216, 120]] }] }),
      "Du kjører inn i en lang tunnel på en solfylt dag. Hva bør du gjøre?",
      "Ты въезжаешь в длинный тоннель в солнечный день. Что нужно сделать?",
      [
        ["Ta av solbriller og senk farten litt til øynene venner seg til mørket", "Сними солнцезащитные очки и немного снизь скорость, пока глаза привыкают к темноте"],
        ["Kjør som vanlig, tunnelen er godt opplyst", "Езжай как обычно, тоннель хорошо освещён", "Selv en godt opplyst tunnel krever at øynene venner seg til mørket, du bør senke farten litt.", "Даже хорошо освещённый тоннель требует, чтобы глаза привыкли к темноте — скорость стоит немного снизить."],
        ["Blink med fjernlys for å varsle andre", "Мигни дальним, чтобы предупредить остальных", "Fjernlysblink løser ikke problemet med at øynene dine må venne seg til mørket.", "Мигание дальним не решает проблему привыкания твоих глаз к темноте."],
        ["Øk farten for å komme fort ut", "Увеличь скорость, чтобы быстрее выехать", "Å øke farten når synet er dårligere er farlig, du bør heller senke farten.", "Увеличивать скорость при ухудшенном зрении опасно — лучше её снизить."]
      ],
      "Øynene trenger tid til å venne seg til mørket etter sterkt sollys. Ta av solbriller, senk farten og hold god avstand de første sekundene.",
      "Глазам нужно время привыкнуть к темноте после яркого солнца. Сними очки, снизь скорость и держи увеличенную дистанцию первые секунды.",
      "Переход свет-тьма — частая причина растерянности у тоннеля. Заранее сбавь скорость и сними очки."),

    q("028", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "off" }, { type: "sign", kind: "rest", x: 300, y: 150, size: 28 }, { type: "tag", text: "RASTEPLASS", x: 326, y: 40 }], actors: [{ label: "A", lane: 1, y: 256, path: [[216, 200]] }] }),
      "Du kjenner deg svært trøtt mens du kjører på motorveien. Hva er riktig å gjøre?",
      "Ты чувствуешь сильную усталость за рулём на автомагистрали. Как правильно поступить?",
      [
        ["Stoppe på en rasteplass og hvile eller sove litt", "Остановиться на зоне отдыха и отдохнуть или немного поспать"],
        ["Skru opp musikken og åpne vinduet", "Включить музыку погромче и открыть окно", "Musikk og åpent vindu hjelper bare kort tid og løser ikke det underliggende problemet med trøtthet.", "Музыка и открытое окно помогают лишь недолго и не решают саму проблему усталости."],
        ["Kjøre litt fortere for å komme fram raskere", "Ехать чуть быстрее, чтобы скорее доехать", "Høyere fart øker faren ved mikrosøvn i stedet for å redusere den.", "Более высокая скорость увеличивает опасность микросна, а не снижает её."],
        ["Fortsette, trøttheten går over av seg selv", "Продолжать ехать, усталость сама пройдёт", "Trøtthet bak rattet går ikke over av seg selv og kan føre til mikrosøvn, du må stoppe og hvile.", "Усталость за рулём сама не проходит и может привести к микросну — нужно остановиться и отдохнуть."]
      ],
      "Trøtthet bak rattet er svært farlig og kan gi mikrosøvn. Musikk og åpent vindu hjelper bare kort tid. Riktig løsning er å stoppe og hvile.",
      "Усталость за рулём очень опасна и может вызвать микросон. Музыка и открытое окно помогают лишь ненадолго. Правильное решение — остановиться и отдохнуть.",
      "Микросон длится всего пару секунд, но на скорости 80 км/ч машина за это время проезжает десятки метров без контроля."),

    q("029", street({ actors: [{ label: "A", x: 220, y: 150, door: "right" }, { kind: "child", x: 244, y: 162, rot: 90, color: "#f08c1a", walk: [256, 162] }, { label: "B", lane: "left", y: 40, color: "#e0483a", path: [[184, 260]] }], tags: [{ text: "FORTAU", x: 300, y: 250 }] }),
      "Du har parkert langs høyre side av en trafikkert vei. Barnet ditt sitter i baksetet. Hvordan skal barnet gå ut av bilen?",
      "Ты припарковался у правого края оживлённой дороги. Ребёнок сидит на заднем сиденье. Как ребёнку выходить из машины?",
      [
        ["Gjennom døren mot fortauet, bort fra trafikken", "Через дверь со стороны тротуара, подальше от движения"],
        ["Gjennom døren mot kjørebanen, det går fortest", "Через дверь со стороны проезжей части, так быстрее", "Å gå ut mot kjørebanen er farlig, barnet kan bli truffet av forbikjørende trafikk.", "Выходить со стороны проезжей части опасно — ребёнка может задеть проезжающая машина."],
        ["Det spiller ingen rolle hvilken side", "Не важно, с какой стороны", "Siden har stor betydning for sikkerheten, barnet bør alltid gå ut mot fortauet.", "Сторона выхода очень важна для безопасности — ребёнку нужно выходить к тротуару."],
        ["Barnet kan hoppe ut mens bilen ruller sakte", "Ребёнок может выпрыгнуть, пока машина медленно катится", "Å gå ut av en bil i bevegelse er farlig uansett fart, bilen skal stå helt stille.", "Выходить из движущейся машины опасно при любой скорости — машина должна полностью остановиться."]
      ],
      "Barn (og voksne) bør alltid gå ut på siden bort fra trafikken, altså mot fortauet, for å unngå å bli truffet av forbikjørende kjøretøy.",
      "Выходить нужно всегда со стороны, противоположной движению, то есть к тротуару, чтобы не попасть под проезжающую машину.",
      "Это правило касается всех пассажиров, но особенно важно для детей — приучи их к этому с первой поездки."),

    q("030", street({ sides: { left: "grass", right: "grass" }, weather: "dusk", features: [{ type: "sign", kind: "moose", y: 268, size: 28 }], actors: [{ kind: "moose", x: 262, y: 92, rot: 250 }, { label: "A", y: 230, beams: "low", path: [[216, 160]] }] }),
      "Du kjører på landevei i skumringen og passerer et viltskilt med elg. Hva gjør du?",
      "Ты едешь по загородной дороге в сумерках и проезжаешь знак с изображением лося. Что делаешь?",
      [
        ["Senker farten og er klar til å bremse, dyr kommer ofte flere sammen", "Снижаю скорость и готов тормозить — животные часто идут группами"],
        ["Kjører som normalt, skiltet gjelder bare om natten", "Еду как обычно, знак действует только ночью", "Skiltet gjelder hele døgnet, dyr kan krysse også i dagslys, ikke bare om natten.", "Знак действует круглые сутки — животные могут выходить и днём, а не только ночью."],
        ["Blinker med fjernlys for å skremme bort dyr", "Мигаю дальним, чтобы отпугнуть животных", "Å blinke med fjernlys skremmer ikke dyr bort på en pålitelig måte og kan i stedet forvirre dem.", "Мигание дальним не гарантирует, что животное убежит, а может наоборот его запутать."],
        ["Øker farten for å passere risikoområdet raskt", "Увеличиваю скорость, чтобы быстрее проехать опасный участок", "Høyere fart gir kortere reaksjonstid hvis et dyr dukker opp, det gjør situasjonen farligere.", "На большей скорости меньше времени на реакцию, если выйдет животное, — это только опаснее."]
      ],
      "Viltskilt varsler områder med mye viltkryssing, spesielt i skumring og grålysning. Senk farten og vær ekstra oppmerksom — kommer ett dyr, følger ofte flere etter.",
      "Знак с животным предупреждает об участках с частым переходом диких животных, особенно в сумерках. Снизь скорость и будь особенно внимателен — если появилось одно животное, за ним часто следуют другие.",
      "Столкновение с лосем на скорости очень опасно из-за высоты животного. Лучше сбросить скорость заранее, чем экстренно тормозить."),

    q("031", street({ features: [{ type: "sideRoad", y: 120, side: "right", w: 44 }], actors: [{ kind: "arrow", pts: [[236, 92], [262, 118], [330, 120]], color: "#1f63e0", opts: { dash: "7 6" } }, { label: "A", x: 214, y: 52, trailer: "box", trailerRot: -55, steer: -26 }], tags: [{ text: "RYGGER INN TIL HØYRE", x: 318, y: 40 }] }),
      "Du skal rygge en bil med tilhenger inn på en smal vei. Hva er viktig å huske?",
      "Тебе нужно сдать назад на машине с прицепом на узкую дорогу. Что важно помнить?",
      [
        ["Tilhengeren svinger motsatt vei av rattet, så styr rolig og bruk speilene", "Прицеп поворачивает в сторону, противоположную повороту руля, поэтому рули плавно и следи за зеркалами"],
        ["Tilhengeren følger rattet på samme måte som bilen", "Прицеп следует за рулём так же, как сама машина", "Tilhengeren beveger seg faktisk motsatt vei av det bilen gjør ved rygging, ikke likt.", "На самом деле при движении задним ходом прицеп движется в противоположную сторону от машины, а не так же."],
        ["Det er forbudt å rygge med tilhenger", "Сдавать назад с прицепом запрещено", "Det er ikke forbudt å rygge med tilhenger, det krever bare øvelse og forsiktig styring.", "Сдавать назад с прицепом не запрещено — просто нужны навык и аккуратное управление рулём."],
        ["Be en passasjer dytte tilhengeren i riktig retning", "Попросить пассажира толкать прицеп в нужную сторону", "Å dytte tilhengeren fysisk er ikke en trygg eller praktisk løsning, du skal styre bilen rolig i stedet.", "Толкать прицеп руками — не безопасное и не практичное решение, нужно аккуратно управлять машиной."]
      ],
      "Når du rygger med tilhenger, svinger tilhengeren motsatt vei av det du dreier rattet. Styr i små bevegelser, bruk speilene aktivt, og be gjerne noen dirigere deg.",
      "При движении задним ходом с прицепом прицеп поворачивает в сторону, противоположную повороту руля. Работай рулём небольшими движениями, активно используй зеркала и, если можно, попроси кого-то направлять тебя.",
      "Потренируйся на пустой площадке заранее — реакция прицепа на руль непривычна большинству новичков."),

    q("032", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "bridge", y: 110, h: 96 }], actors: [{ label: "A", y: 250, path: [[216, 172]] }], tags: [{ text: "KALD MORGEN · −2 °C", x: 310, y: 250 }] }),
      "Det er en kald morgen, og du nærmer deg en bro. Veien før broen var tørr. Hva bør du tenke på?",
      "Холодное утро, ты приближаешься к мосту. Дорога перед мостом была сухой. О чём нужно помнить?",
      [
        ["Broer fryser først, det kan være is selv om resten av veien er tørr", "Мосты замерзают первыми — лёд может быть, даже если остальная дорога сухая"],
        ["Broer er alltid varmere enn veien, så is er usannsynlig", "Мосты всегда теплее дороги, поэтому лёд маловероятен", "Broer er tvert imot kaldere enn vanlig vei fordi de mister varme raskere, så is er mer sannsynlig der.", "Наоборот, мосты холоднее обычной дороги, потому что быстрее теряют тепло, — лёд там как раз более вероятен."],
        ["Is dannes bare på veier med mye skygge", "Лёд появляется только на затенённых участках", "Is på bro dannes uavhengig av skygge, det handler om at broen mister varme raskt fra alle sider.", "Лёд на мосту образуется независимо от тени — дело в том, что мост быстро теряет тепло со всех сторон."],
        ["Broer saltes automatisk, så de er alltid trygge", "Мосты автоматически солятся, поэтому всегда безопасны", "Det finnes ikke automatisk salting på alle broer, du kan ikke stole på at broen alltid er trygg.", "Автоматической подсыпки соли на всех мостах нет — полагаться на то, что мост всегда безопасен, нельзя."]
      ],
      "Broer er omgitt av kald luft på alle sider og mister varme raskere enn vanlig vei. De blir derfor ofte glatte og iskalde før resten av veien.",
      "Мосты окружены холодным воздухом со всех сторон и теряют тепло быстрее, чем обычная дорога. Поэтому они часто становятся скользкими раньше остальной трассы.",
      "Классическая ловушка теории: «мост сухой на вид» ≠ «мост не скользкий». Сбавляй скорость заранее."),

    q("033", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "rail", y: 110, lights: "flash", train: { x: 50, dir: 1 } }], actors: [{ label: "A", y: 250, path: [[216, 172]], brake: true }] }),
      "Du nærmer deg en planovergang (jernbaneovergang) uten bom, og det røde lyset blinker. Hva gjør du?",
      "Ты приближаешься к железнодорожному переезду без шлагбаума, мигает красный сигнал. Что делаешь?",
      [
        ["Stopper og venter til lyset slutter å blinke", "Останавливаюсь и жду, пока сигнал не перестанет мигать"],
        ["Kjører raskt over før toget kommer", "Быстро проезжаю, пока поезд не подъехал", "Å prøve å rekke over før toget er ekstremt farlig, du skal stoppe når lyset blinker.", "Пытаться проскочить перед поездом крайне опасно — нужно остановиться, пока сигнал мигает."],
        ["Kjører sakte over og ser meg for", "Медленно проезжаю, оглядываясь по сторонам", "Blinkende rødt lys krever full stopp, det holder ikke å bare kjøre sakte og se seg for.", "Мигающий красный требует полной остановки — ехать медленно и оглядываться недостаточно."],
        ["Tuter og kjører over", "Сигналю и проезжаю", "Signalhorn endrer ingenting, blinkende rødt lys betyr stopp uansett.", "Гудок ничего не меняет — мигающий красный означает остановку в любом случае."]
      ],
      "Blinkende rødt lys ved planovergang betyr at tog nærmer seg. Du skal stoppe og vente til lyset slukker, selv om du ikke ser bom eller tog ennå.",
      "Мигающий красный на переезде означает, что приближается поезд. Нужно остановиться и ждать, пока сигнал не погаснет, даже если шлагбаума или поезда ещё не видно.",
      "Тормозной путь поезда в разы длиннее, чем у машины. Никогда не пытайся проскочить на мигающий красный."),

    q("034", street({ features: [{ type: "sideRoad", y: 80, side: "right" }], actors: [{ kind: "truck", x: 200, y: 160, label: "B", color: "#e0483a", blink: "right", path: [[200, 112], [252, 95], [340, 95]] }, { label: "A", y: 262, path: [[216, 230]] }] }),
      "Et langt vogntog foran deg skal svinge til høyre, men beveger seg først til venstre i kjørefeltet. Hva bør du gjøre?",
      "Длинный грузовик с прицепом впереди тебя собирается повернуть направо, но сначала смещается влево в полосе. Что нужно сделать?",
      [
        ["Holde god avstand og ikke kjøre forbi på høyre side", "Держать дистанцию и не пытаться обогнать справа"],
        ["Kjøre forbi på høyre side mens det er plass", "Обогнать справа, пока есть место", "Plassen som åpner seg til høyre er nettopp der vogntoget trenger å svinge inn, å kjøre der er svært farlig.", "Место, освобождающееся справа, — как раз то, куда грузовик собирается повернуть, ехать туда очень опасно."],
        ["Tute for å få vogntoget til å svinge med en gang", "Посигналить, чтобы грузовик повернул сразу", "Signalhorn hjelper ikke, føreren trenger plassen til venstre for å få svingradius, ikke et signal om å skynde seg.", "Гудок не поможет — водителю нужно место слева для радиуса поворота, а не сигнал поторопиться."],
        ["Kjøre tett bak for å presse fram svingen", "Прижаться вплотную сзади, чтобы поторопить с поворотом", "Å ligge tett bak reduserer din egen reaksjonstid og hjelper ikke vogntoget med svingen.", "Ехать вплотную сзади сокращает твоё время на реакцию и никак не помогает грузовику повернуть."]
      ],
      "Lange kjøretøy må ofte svinge ut til motsatt side for å få plass til høyresvingen. Å kjøre forbi på høyre side da er svært farlig — bli liggende bak og vent.",
      "Длинным транспортным средствам часто нужно сместиться в противоположную сторону, чтобы вписаться в поворот направо. Обгонять справа в этот момент очень опасно — держись позади и жди.",
      "Это классическая ловушка «мёртвой зоны» у грузовиков — никогда не ныряй в пространство, которое освобождает длинномер перед поворотом."),

    q("035", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east", kind: "bike" }], roundabout: true }),
      "Du (A) skal kjøre inn i rundkjøringen. En syklist (B) er allerede inne i rundkjøringen. Hva gjør du?",
      "Ты (A) собираешься въехать на круг. Велосипедист (B) уже находится на кругу. Что делаешь?",
      [
        ["Venter og slipper syklisten fram — samme regel som for biler", "Жду и пропускаю велосипедиста — то же правило, что и для машин"],
        ["Kjører inn med en gang, sykler har ikke forrang i rundkjøring", "Въезжаю сразу — у велосипедистов нет преимущества на кругу", "Syklende har samme forrang som biler i rundkjøring, ikke mindre.", "У велосипедистов на кругу такой же приоритет, как у машин, а не меньше."],
        ["Tuter for å varsle syklisten om at jeg kommer", "Сигналю, чтобы предупредить велосипедиста о своём въезде", "Signalhorn erstatter ikke vikeplikten, du skal vente uansett om du varsler eller ikke.", "Гудок не заменяет обязанность уступить — ждать нужно в любом случае, предупредил ты или нет."],
        ["Kjører inn fordi jeg er større og mer synlig", "Въезжаю, потому что я крупнее и заметнее", "Kjøretøyets størrelse gir ingen forrang, reglene for rundkjøring gjelder likt for alle.", "Размер транспорта не даёт приоритета — правила круга действуют одинаково для всех."]
      ],
      "I rundkjøring gjelder samme vikeplikt for syklende som for biler: trafikk som allerede er inne i rundkjøringen har forrang, uansett kjøretøytype.",
      "На круге действует та же обязанность уступать для велосипедистов, что и для машин: тот, кто уже на кругу, имеет преимущество — независимо от типа транспорта.",
      "Не думай, что раз это велосипедист, можно «проскочить». Правило приоритета на круге не зависит от размера транспорта."),

    q("036", street({ laneW: 34, features: [{ type: "tramRails" }, { type: "tag", text: "HOLDEPLASS", x: 300, y: 40 }], actors: [{ kind: "tram", x: 200, y: 92, label: "T", doors: true }, { kind: "adult", x: 222, y: 70, rot: 90, color: "#6b4fa0", walk: [250, 70] }, { kind: "adult", x: 226, y: 112, rot: 90, color: "#22a06b", walk: [252, 112] }, { label: "A", x: 220, y: 240, path: [[220, 176]], brake: true }] }),
      "En trikk har stoppet ved en holdeplass midt i gaten, uten trafikkøy mellom skinnene og fortauet. Dørene åpnes. Hva gjør du?",
      "Трамвай остановился на остановке посреди улицы, без островка безопасности между рельсами и тротуаром. Двери открылись. Что делаешь?",
      [
        ["Stopper bak trikken og venter til passasjerene har krysset over til fortauet", "Останавливаюсь позади трамвая и жду, пока пассажиры перейдут на тротуар"],
        ["Kjører forbi trikken i vanlig fart, jeg har ikke plikt til å stoppe", "Проезжаю мимо трамвая с обычной скоростью — останавливаться не обязан", "Du har faktisk plikt til å stoppe når passasjerer krysser til fortauet uten trafikkøy.", "На самом деле обязанность остановиться есть — когда пассажиры переходят к тротуару без островка безопасности."],
        ["Kjører forbi sakte samtidig som passasjerene krysser", "Медленно проезжаю мимо, пока пассажиры переходят", "Å kjøre forbi samtidig som passasjerene krysser er farlig, du skal stoppe helt til de er trygt over.", "Проезжать мимо, пока пассажиры переходят, опасно — нужно полностью остановиться, пока они не окажутся в безопасности."],
        ["Tuter for å få passasjerene til å skynde seg", "Сигналю, чтобы пассажиры поторопились", "Signalhorn skal ikke brukes for å presse passasjerene, du skal selv vente til de er over.", "Гудок нельзя использовать, чтобы поторопить пассажиров, — ждать должен ты сам, пока они не перейдут."]
      ],
      "Trafikkreglene § 9 nr. 3: den som vil kjøre forbi til høyre for sporvogn ved holdeplass uten trafikkøy, skal stanse og gi fri veg for passasjerer som stiger av eller på. For buss ved holdeplass gjelder § 13: hold liten fart og stans om nødvendig.",
      "Trafikkreglene § 9 nr 3: если объезжаешь трамвай справа у остановки без островка, нужно остановиться и пропустить пассажиров, которые выходят или садятся. Для автобуса у остановки действует § 13: ехать медленно и при необходимости остановиться.",
      "Пассажиры трамвая выходят прямо на проезжую часть — это одна из самых опасных ситуаций в городе, всегда останавливайся полностью."),

    q("037", SK.hill({ dir: "down", edge: "ditch", wheels: "straight" }),
      "Du skal parkere i en bakke uten fortauskant (grøft på siden), og bilen peker nedover. Hva bør du gjøre med forhjulene?",
      "Нужно припарковаться на склоне без бордюра (сбоку канава), машина направлена вниз по склону. Что сделать с передними колёсами?",
      [
        ["Vri hjulene mot grøften, slik at bilen ruller av veien og ikke ut i trafikken hvis den beveger seg", "Повернуть колёса в сторону канавы, чтобы машина при откате съехала с дороги, а не выехала на проезжую часть"],
        ["Vri hjulene rett fram, det spiller ingen rolle når håndbrekket er på", "Оставить колёса прямо — не важно, ведь стояночный тормоз включён", "Håndbrekket kan svikte, og med hjulene rett fram vil bilen trille rett ut i veien hvis det skjer.", "Ручник может подвести, и при прямых колёсах машина при откате выедет прямо на дорогу."],
        ["Vri hjulene mot kjørebanen, slik at bilen står tettest mulig på veien", "Повернуть колёса в сторону дороги, чтобы машина стояла как можно ближе к проезжей части", "Dette er farligere, for da vil bilen trille ut i kjørebanen og trafikken hvis bremsene svikter, ikke bort fra den.", "Это опаснее — при отказе тормозов машина съедет на проезжую часть, в поток машин, а не от него."],
        ["Bruke gir i stedet for håndbrekk er alltid nok alene", "Достаточно только включить передачу, без ручника", "Gir alene er ikke nok som sikkerhet, du skal bruke håndbrekk i tillegg og vri hjulene riktig vei.", "Одной передачи недостаточно для безопасности — нужен ещё ручник и правильно повёрнутые колёса."]
      ],
      "Ved parkering i bakke uten fortauskant vrir du hjulene slik at bilen triller vekk fra vegen (mot grøften) hvis bremsene skulle svikte. I tillegg bruker du håndbrekk og legger i gir eller parkeringsposisjon.",
      "При парковке на склоне без бордюра поворачивай колёса так, чтобы при откате машина ушла от дороги (в сторону канавы). Дополнительно используй ручник и включи передачу или паркинг.",
      "Правило простое: колёса должны «уводить» машину от проезжей части, а не на неё, если тормоза подведут."),

    q("038", street({ sides: { left: "grass", right: "grass" }, weather: "rain", features: [{ type: "puddle", y: 136 }], actors: [{ label: "A", y: 150, path: [[216, 60]], pathOpts: { dash: "6 6" } }], tags: [{ text: "KRAFTIG REGN", x: 306, y: 40 }] }),
      "Du kjører i kraftig regn og merker plutselig at rattet føles lett og bilen ikke reagerer på styringen. Hva er dette, og hva gjør du?",
      "Ты едешь в сильный дождь и вдруг чувствуешь, что руль стал «лёгким», а машина не реагирует на управление. Что это, и что делать?",
      [
        ["Vannplaning — slipp gassen forsiktig og hold rattet rett fram til dekkene får kontakt igjen", "Аквапланирование — плавно отпусти газ и держи руль прямо, пока шины снова не сцепятся с дорогой"],
        ["Servostyringen har sviktet — trykk gassen i bunn for å få kontroll", "Отказал гидроусилитель руля — выжми газ до пола, чтобы вернуть контроль", "Dette er vannplaning, ikke svikt i servostyringen, og å gi full gass forverrer situasjonen.", "Это аквапланирование, а не отказ гидроусилителя, — газ до пола только ухудшит ситуацию."],
        ["Dette er normalt i regn — brems hardt med en gang", "Это нормально в дождь — резко затормози", "Hard bremsing ved vannplaning kan gjøre at bilen sklir enda mer ukontrollert.", "Резкое торможение при аквапланировании может сделать занос машины ещё более неконтролируемым."],
        ["Bilen er overopphetet — slå av motoren mens du kjører", "Машина перегрелась — заглуши двигатель на ходу", "Å slå av motoren i fart fjerner servostyring og bremsekraft og gjør situasjonen mye farligere.", "Заглушить двигатель на ходу — значит потерять усилитель руля и тормозов, что делает ситуацию гораздо опаснее."]
      ],
      "Vannplaning oppstår når et vannlag løfter dekkene fra veibanen, og bilen mister kontakt med underlaget. Slipp gassen rolig, unngå bråbrems og bråe rattbevegelser til dekkene får grep igjen.",
      "Аквапланирование возникает, когда слой воды приподнимает шины над дорогой, и машина теряет сцепление с покрытием. Плавно отпусти газ, избегай резкого торможения и резких движений рулём, пока шины снова не «зацепятся» за дорогу.",
      "Резкое торможение или руль в сторону во время аквапланирования — верный способ уйти в занос. Главное — не паниковать и ехать прямо."),

    q("039", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "sign", kind: "temp:50", y: 220, size: 28 }, { type: "sign", kind: "speed:80", y: 290, side: "left", size: 26 }, { type: "sign", kind: "roadwork", y: 120, size: 24 }], actors: [{ kind: "cone", x: 228, y: 40 }, { kind: "cone", x: 228, y: 62 }, { kind: "cone", x: 228, y: 84 }, { kind: "worker", x: 262, y: 64, rot: 270 }, { label: "A", y: 250, path: [[216, 170]] }] }),
      "Du kjører inn i et anleggsområde med gule (midlertidige) skilt som viser en lavere fartsgrense enn den faste skiltingen. Hva gjelder?",
      "Ты въезжаешь в зону дорожных работ с жёлтыми (временными) знаками, показывающими ограничение скорости ниже обычного. Что действует?",
      [
        ["Den midlertidige (gule) fartsgrensen gjelder foran den faste skiltingen", "Действует временное (жёлтое) ограничение — оно важнее постоянных знаков"],
        ["Den faste fartsgrensen gjelder alltid, gule skilt er bare informasjon", "Всегда действует постоянное ограничение, жёлтые знаки — просто информация", "Gule skilt er ikke bare informasjon, de er midlertidige og går foran den faste skiltingen.", "Жёлтые знаки — не просто информация, они временные и действуют вместо постоянных."],
        ["Du velger selv hvilken grense du følger", "Можно самому выбрать, какое ограничение соблюдать", "Fartsgrensen er ikke valgfri, den midlertidige gule skiltingen er bindende.", "Ограничение скорости — не на выбор, временный жёлтый знак обязателен."],
        ["Gule skilt gjelder bare for tunge kjøretøy", "Жёлтые знаки касаются только грузового транспорта", "Gule skilt gjelder alle kjøretøy i anleggsområdet, ikke bare tunge.", "Жёлтые знаки действуют для всех ТС в зоне работ, а не только для грузового транспорта."]
      ],
      "Gule skilt i anleggsområder er midlertidig skilting og går foran den faste (hvite) skiltingen. Vær ekstra oppmerksom på arbeidere og endret veibane.",
      "Жёлтые знаки в зоне дорожных работ — временные, и они важнее постоянных (белых) знаков. Будь особенно внимателен к рабочим и изменённой траектории дороги.",
      "Жёлтый фон знака в Норвегии означает «временно», и такой знак всегда приоритетнее обычного белого на этом участке."),

    q("040", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "off" }, { type: "tag", text: "RASTEPLASS", x: 326, y: 40 }, { type: "cabin", x: 86, y: 150, text: "BARNET HAR LØSNET BELTET" }], actors: [{ label: "A", lane: 1, y: 256, path: [[216, 200]] }] }),
      "Du oppdager i speilet at barnet i baksetet har løsnet beltet mens du kjører på motorveien. Hva gjør du?",
      "Ты замечаешь в зеркале, что ребёнок на заднем сиденье отстегнул ремень во время движения по автомагистрали. Что делаешь?",
      [
        ["Finner et trygt sted å stoppe og fester beltet der, i stedet for å gjøre noe mens bilen er i fart", "Нахожу безопасное место для остановки и там пристёгиваю ремень, а не пытаюсь сделать это на ходу"],
        ["Rekker meg bakover og fester beltet mens jeg fortsetter å kjøre", "Тянусь назад и пристёгиваю ремень, продолжая ехать", "Å strekke seg bakover mens du kjører tar oppmerksomheten fra veien og er svært farlig i fart.", "Тянуться назад во время движения отвлекает от дороги и очень опасно на скорости."],
        ["Ber en passasjer i forsetet klatre bak for å ordne beltet med en gang", "Прошу пассажира с переднего сиденья перелезть назад и сразу пристегнуть ремень", "Å klatre mellom setene mens bilen er i fart er farlig for alle involverte, vent til dere har stoppet.", "Перелезать между сиденьями на ходу опасно для всех — нужно дождаться остановки."],
        ["Ignorerer det, barnet sitter jo fortsatt i setet", "Не обращаю внимания — ребёнок ведь всё ещё в кресле", "Et løsnet belte gir ingen beskyttelse ved kollisjon, dette må rettes opp så snart det er trygt.", "Отстёгнутый ремень не защитит при столкновении — это нужно исправить, как только будет безопасно."]
      ],
      "Å ta oppmerksomheten bort fra veien for å ordne noe i baksetet er svært farlig i fart. Finn et trygt sted å stanse, og løs problemet der.",
      "Отвлекаться от дороги, чтобы что-то сделать на заднем сиденье, очень опасно на скорости. Найди безопасное место для остановки и реши проблему там.",
      "Правило простое: любая проблема с ребёнком в машине решается после безопасной остановки, а не за рулём на ходу."),

    q("041", street({ noRoad: true, features: [{ type: "lot" }], actors: [{ label: "A", x: 186, y: 168, rot: 160 }, { label: "B", x: 218, y: 120, rot: 0, color: "#e0483a" }, { kind: "crash", x: 204, y: 146 }, { kind: "adult", x: 250, y: 160, rot: 90, color: "#8e5bd6" }, { kind: "adult", x: 150, y: 150, rot: 0, color: "#3d4a5c" }] }),
      "Du kolliderer lett med en annen bil på en parkeringsplass — bare materiell skade. Den andre føreren vil bare kjøre videre uten å utveksle opplysninger. Hva gjør du?",
      "Ты слегка столкнулся с другой машиной на парковке — только материальный ущерб. Другой водитель хочет просто уехать, не обменявшись данными. Что делаешь?",
      [
        ["Insisterer på å utveksle navn, adresse og forsikringsopplysninger før noen kjører fra stedet", "Настаиваю на обмене именем, адресом и данными страховки, прежде чем кто-то уедет"],
        ["Lar den andre kjøre, det er bare en parkeringsplass", "Отпускаю его — это же просто парковка", "Plikten til å utveksle opplysninger gjelder også på parkeringsplass, ikke bare på vanlig vei.", "Обязанность обменяться данными действует и на парковке, а не только на обычной дороге."],
        ["Ringer bare eget forsikringsselskap uken etter, uten å snakke med den andre føreren", "Просто звоню в свою страховую через неделю, не разговаривая со вторым водителем", "Det er ikke nok å ringe forsikringen senere, du skal utveksle opplysninger med den andre føreren på stedet.", "Позвонить в страховую позже недостаточно — данными нужно обменяться со вторым водителем на месте."],
        ["Tar bilde av skaden og drar, det holder", "Фотографирую повреждения и уезжаю — этого достаточно", "Bilder erstatter ikke plikten til å utveksle navn og adresse med den andre parten.", "Фотографии не заменяют обязанность обменяться именем и адресом с другой стороной."]
      ],
      "Alle involvert i en trafikkulykke plikter å oppgi navn og adresse, og bli på stedet til nødvendige opplysninger er utvekslet. Dette gjelder også ved kun materiell skade.",
      "Все участники ДТП обязаны сообщить имя и адрес и оставаться на месте, пока не обменяются необходимыми данными. Это касается и случаев только с материальным ущербом.",
      "Не позволяй второму водителю просто уехать — обмен данными обязателен по закону, а не только «по-хорошему»."),

    q("042", SK.illus("wine-morning"),
      "Du drakk et par glass vin på middagsselskap i går kveld og sov godt. I dag føler du deg helt våken og skal kjøre til jobb. Hva bør du tenke på?",
      "Вчера вечером на ужине ты выпил пару бокалов вина и хорошо выспался. Сегодня чувствуешь себя бодрым и собираешься ехать на работу. О чём нужно помнить?",
      [
        ["Kroppen bryter ned alkohol sakte, og du kan fortsatt ha promille over grensen selv om du føler deg våken", "Организм расщепляет алкоголь медленно, и промилле всё ещё может быть выше нормы, даже если ты чувствуешь себя бодрым"],
        ["Etter en natts søvn er all alkohol garantert borte fra kroppen", "После ночного сна алкоголь гарантированно полностью выводится из организма", "Søvn fremskynder ikke nedbrytningen av alkohol, det er bare tiden som teller.", "Сон не ускоряет распад алкоголя, важно только прошедшее время."],
        ["Å føle seg våken betyr at promillen er under grensen", "Если чувствуешь бодрость, значит промилле уже в норме", "Følelsen av å være våken sier ingenting sikkert om promillen, den kan fortsatt være over grensen.", "Ощущение бодрости ничего не говорит о промилле — оно всё ещё может быть выше нормы."],
        ["Bare kaffe om morgenen er nok til å være sikker på å kjøre", "Достаточно выпить утром кофе, чтобы быть уверенным в возможности ехать", "Kaffe gjør deg bare mer våken, det senker ikke promillen i det hele tatt.", "Кофе лишь бодрит, на уровень промилле он никак не влияет."]
      ],
      "Kroppen bryter ned alkohol med omtrent 0,1–0,15 promille i timen. Etter en kveld med flere glass kan du fortsatt ligge over 0,2 promille neste morgen, selv om du føler deg uthvilt.",
      "Организм расщепляет алкоголь со скоростью примерно 0,1–0,15 промилле в час. После вечера с несколькими бокалами утром промилле всё ещё может быть выше 0,2, даже если чувствуешь себя выспавшимся.",
      "«Чувствую себя нормально» — не показатель. Если сомневаешься, не садись за руль или используй алкотестер."),

    q("043", scene({ you: { from: "south", to: "west" }, others: [{ from: "east", to: "west" }, { from: "west", to: "east" }], signs: { south: "yield" } }),
      "Du (A) har vikepliktskilt og skal svinge til venstre inn på hovedveien. Biler kommer både fra venstre og fra høyre. Hva gjør du?",
      "У тебя знак «уступи дорогу», и ты поворачиваешь налево на главную дорогу. Машины едут и слева, и справа. Что делать?",
      [
        ["Vente til begge retninger er fri, og svinge når det er trygt", "Подождать, пока обе стороны свободны, и повернуть, когда безопасно"],
        ["Kjøre når bilen fra høyre har passert, uten å sjekke venstre", "Поехать, как только проедет машина справа, не проверив слева", "Du skal svinge inn foran begge retninger, så en bil fra venstre er like farlig som en fra høyre.", "Ты пересекаешь обе полосы, поэтому машина слева так же опасна, как и справа."],
        ["Kjøre fort forbi begge bilene før de rekker fram", "Проскочить перед обеими машинами, пока они не подъехали", "Med vikeplikt skal du ikke presse deg inn, du vet ikke sikkert hvor fort de kommer til å kjøre.", "При знаке «уступи» нельзя пытаться проскочить — ты не знаешь точно, с какой скоростью едут те машины."],
        ["Kjøre inn og stoppe midt i krysset til det blir fritt", "Выехать и остановиться прямо посреди перекрёстка, ждать, пока освободится", "Å stanse midt i krysset blokkerer begge kjøreretninger og er farlig.", "Остановка посреди перекрёстка перекрывает оба направления движения и опасна."]
      ],
      "Ved vikepliktskilt skal du gi fri vei for all trafikk på vegen du kjører inn på, uansett hvilken side den kommer fra. Ved venstresving krysser du i tillegg den ene kjøreretningen, så du må sjekke begge veier før du kjører.",
      "Знак «уступи дорогу» означает уступить всему движению на дороге, куда ты въезжаешь, с любой стороны. При повороте налево ты ещё и пересекаешь одно из направлений, поэтому проверяй обе стороны, прежде чем ехать.",
      "Поворот налево со второстепенной: смотри налево, направо и ещё раз налево, прежде чем трогаться."),

    q("044", scene({ you: { from: "south", to: "west" }, lights: { south: "green", north: "green" }, peds: ["west"] }),
      "Du har grønt lys og skal svinge til venstre. Fotgjengere krysser gangfeltet i gaten du svinger inn i, også på grønt. Hva gjør du?",
      "У тебя зелёный, поворачиваешь налево. Пешеходы переходят по переходу на той улице, куда ты поворачиваешь, — тоже на зелёный. Что делать?",
      [
        ["Vente og la fotgjengerne gå ferdig før du svinger", "Подождать, пока пешеходы закончат переход, и только потом повернуть"],
        ["Svinge først, fotgjengerne får vente siden du har grønt lys", "Повернуть первым, пешеходы подождут, у тебя же зелёный", "Grønt lys for deg fjerner ikke vikeplikten for gående i gangfeltet du kjører inn i.", "Зелёный для тебя не отменяет обязанность уступить пешеходам на переходе, в который ты въезжаешь."],
        ["Tute for å få fotgjengerne til å skynde seg", "Посигналить, чтобы пешеходы поторопились", "Lydsignal skal bare brukes for å varsle om fare, ikke for å presse gående til å haste.", "Сигнал — только для предупреждения об опасности, а не чтобы поторопить пешеходов."],
        ["Kjøre sakte gjennom gangfeltet samtidig som fotgjengerne går", "Медленно проехать через переход, пока пешеходы ещё идут", "Du har vikeplikt så lenge fotgjengerne er i gangfeltet. Å kjøre inn mellom dem, selv sakte, hindrer og skremmer dem.", "Пока пешеходы на переходе, ты обязан уступать. Въезжать между ними, даже медленно, — значит мешать им и пугать."]
      ],
      "Grønt lys gir deg rett til å kjøre, men ikke foran fotgjengere som lovlig krysser gangfeltet i gaten du svinger inn i. Vikeplikten for gående gjelder uansett hvilken vei du kommer fra.",
      "Зелёный свет даёт право ехать, но не преимущество перед пешеходами, которые законно переходят по переходу на улице, куда ты поворачиваешь. Обязанность уступить пешеходам действует независимо от того, откуда ты едешь.",
      "Поворот налево на зелёный — частая причина наезда на пешехода. Всегда проверяй переход перед въездом в улицу."),

    q("045", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], signs: { south: "priority" } }),
      "Du kjører på forkjørsvei rett fram. Bil B kommer fra venstre fra en sidevei. Hvem har vikeplikt?",
      "Ты едешь прямо по главной дороге. Машина B едет слева со второстепенной. Кто уступает?",
      [
        ["B har vikeplikt, uansett om den kommer fra høyre eller venstre", "B уступает, независимо от того, слева она или справа"],
        ["Du må vike siden B kommer fra venstre og høyreregelen ikke gjelder da", "Ты уступаешь, раз B слева, а правило правой руки тут не работает", "Høyreregelen gjelder bare der det ikke finnes skilt. Her har du forkjørsskilt, som gir deg forrang uansett hvilken side den andre bilen kommer fra.", "Правило правой руки действует только там, где нет знаков. Здесь у тебя знак «главная дорога» — он даёт тебе преимущество независимо от того, с какой стороны едет другая машина."],
        ["Dere må avtale det dere imellom med blinklys", "Нужно договориться друг с другом поворотниками", "Forkjørsskiltet avgjør vikeplikten automatisk, det er ikke noe å avtale.", "Знак приоритета сам решает, кто уступает — договариваться не о чем."],
        ["B har forrang siden den kommer fra en vei som munner ut i din", "У B преимущество, потому что её дорога вливается в твою", "Det er skiltingen, ikke hvordan veiene møtes, som avgjør vikeplikten her.", "Здесь право проезда определяет знак, а не то, как дороги сходятся."]
      ],
      "Forkjørsskiltet (gult ruteskilt) betyr at du kjører på forkjørsvei og har forkjørsrett overfor trafikk fra sideveier, uansett om de kommer fra høyre eller venstre.",
      "Знак «главная дорога» (жёлтый ромб) означает, что ты едешь по главной дороге и у тебя приоритет перед машинами со второстепенных, независимо от того, справа они или слева.",
      "Жёлтый ромб значит: ты главный на этой дороге. Сторона, откуда едет другая машина, тут не важна."),

    q("046", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "south", kind: "truck" }], roundabout: true }),
      "Du skal kjøre inn i rundkjøringen. Et vogntog (B) er allerede inne i rundkjøringen og skal svinge kort til høyre rett foran deg. Hva gjør du?",
      "Ты въезжаешь на круг. Внутри уже едет фура (B), которая почти сразу поворачивает направо прямо перед тобой. Что делать?",
      [
        ["Vente og gi god plass, lange kjøretøy trenger mer plass og kan svinge litt bredt", "Подождать и дать побольше места — длинному транспорту нужно больше места, и он может слегка заезжать шире"],
        ["Kjøre inn samtidig siden du rekker det før vogntoget passerer helt", "Въехать одновременно, ты успеешь проскочить, пока фура ещё не проехала полностью", "Du som skal inn, har vikeplikt for kjøretøy som allerede er i rundkjøringen, uansett hvor fort du tror du rekker.", "Тот, кто уже на круге, всегда имеет преимущество перед тобой — не важно, кажется тебе, что ты успеешь, или нет."],
        ["Blinke og kjøre inn for å vise vogntoget at du kommer", "Помигать поворотником и въехать, показав фуре, что ты едешь", "Blinklys endrer ikke vikeplikten. Trafikk inne i rundkjøringen har uansett forrang.", "Поворотник не меняет, кто уступает. У тех, кто уже на круге, преимущество в любом случае."],
        ["Kjøre tett bak vogntoget med en gang det har begynt å svinge, uten å vente på at det er helt ute av veien", "Ехать вплотную за фурой, как только она начала поворачивать, не дожидаясь, пока она полностью освободит дорогу", "Et langt kjøretøy kan fortsatt svinge ut i din bane. Vent til det er tydelig fri plass.", "Длинная фура ещё может выехать на твою траекторию при повороте. Дожидайся, пока место точно освободится."]
      ],
      "Du som skal inn i rundkjøringen, har vikeplikt for trafikk som allerede er inne. Lange kjøretøy som vogntog trenger ofte mer plass og kan bevege seg litt bredt i svingen, så gi ekstra klaring.",
      "На круге у тех, кто уже едет по нему, всегда преимущество перед теми, кто въезжает. Длинному транспорту вроде фуры часто нужно больше места на повороте, поэтому дай дополнительный запас.",
      "Фура на круге — жди подольше: она может «гулять» по ширине на повороте."),

    q("047", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west", kind: "bike" }] }),
      "Kryss uten skilt. En syklist kommer fra høyre. Hvem har vikeplikt?",
      "Нерегулируемый перекрёсток без знаков. Справа едет велосипедист. Кто уступает?",
      [
        ["Du har vikeplikt for syklisten, høyreregelen gjelder også for syklister", "Ты уступаешь велосипедисту — правило правой руки действует и для велосипедистов"],
        ["Syklisten må alltid vike for bil, uansett side", "Велосипедист всегда уступает машине, независимо от стороны", "Syklister har samme vikeplikt-status som andre kjøretøy etter høyreregelen, det finnes ikke noe unntak for dem.", "У велосипедистов те же права по правилу правой руки, что и у остальных — исключения для них нет."],
        ["Ingen har vikeplikt siden en av dere er syklist", "Никто никому не уступает, раз один из участников — велосипедист", "Høyreregelen gjelder for alt kjørende trafikk, sykkel inkludert. Det er alltid en som skal vike.", "Правило правой руки действует для любого движущегося транспорта, включая велосипед. Кто-то всегда уступает."],
        ["Du kan kjøre fort forbi fordi sykler er lettere å stoppe enn biler", "Можно проехать быстро — велосипед легче остановить, чем машину", "Vikeplikten avhenger av retning, ikke av hvor lett et kjøretøy kan stoppe.", "Кто уступает, зависит от направления движения, а не от того, насколько легко кому-то остановиться."]
      ],
      "Høyreregelen gjelder likt for alle kjøretøy, også sykler. Kommer en syklist fra høyre i et kryss uten skilt, har du vikeplikt for den akkurat som for en bil.",
      "Правило правой руки действует одинаково для всех участников движения, включая велосипедистов. Если велосипедист едет справа на нерегулируемом перекрёстке, ты уступаешь ему точно так же, как машине.",
      "Велосипед на перекрёстке — это тоже «транспорт справа». Забыть про него — частая ошибка."),

    q("048", street({ features: [{ type: "zebra", y: 120 }], actors: [{ kind: "adult", x: 174, y: 120, rot: 270, color: "#6b4fa0", walk: [154, 120] }, { label: "A", y: 245, path: [[216, 170]] }] }),
      "Fotgjengeren har nesten krysset gangfeltet og har bare noen skritt igjen, lengst unna deg. Kan du kjøre nå?",
      "Пешеход почти перешёл дорогу, ему осталось буквально пару шагов на дальней стороне. Можно ехать?",
      [
        ["Nei, vent til fotgjengeren er helt ute av gangfeltet", "Нет, подожди, пока пешеход полностью не покинет переход"],
        ["Ja, siden fotgjengeren er langt unna bilen din", "Да, пешеход ведь далеко от твоей машины", "Vikeplikten gjelder hele gangfeltet, ikke bare den delen nærmest deg. Du skal vente til feltet er helt fritt.", "Обязанность уступить действует на весь переход целиком, а не только на ближнюю к тебе часть. Ждать нужно, пока переход полностью не освободится."],
        ["Ja, du kan kjøre sakte forbi bak fotgjengeren", "Да, можно медленно проехать позади пешехода", "Så lenge fotgjengeren er i gangfeltet, har du vikeplikt. Å kjøre forbi mens han fortsatt går, kan skremme ham og gir ham ikke ro til å gå over.", "Пока пешеход на переходе, ты обязан уступать. Проезжать, пока он ещё идёт, — значит пугать его и не давать спокойно перейти."],
        ["Ja, men bare hvis du tuter først", "Да, но только если сначала посигналить", "Lydsignal gir deg ikke rett til å kjøre gjennom et gangfelt noen fortsatt bruker.", "Сигнал не даёт права проехать через переход, пока по нему ещё идёт человек."]
      ],
      "Trafikkreglene § 9 nr 2: du har vikeplikt for gående som er på vei ut i eller befinner seg i gangfeltet. Den gjelder så lenge fotgjengeren er i feltet, ikke bare til han har passert din side av vegen.",
      "Trafikkreglene § 9 nr 2: ты уступаешь пешеходам, которые вступают на переход или находятся на нём. Это действует, пока пешеход на переходе, а не только пока он не прошёл твою сторону дороги.",
      "«Почти закончил» — не то же самое, что «закончил». Жди, пока переход будет полностью пуст."),

    q("049", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], lights: { south: "flash", east: "flash", north: "flash", west: "flash" } }),
      "Trafikklyset blinker gult i alle retninger (ute av vanlig drift). Det finnes ingen andre skilt i krysset. Bil B kommer fra høyre. Hvem har vikeplikt?",
      "Светофор мигает жёлтым во всех направлениях (работает в аварийном режиме). Других знаков на перекрёстке нет. Машина B едет справа. Кто уступает?",
      [
        ["Du har vikeplikt for B, høyreregelen gjelder som om lyset var slukket", "Ты уступаешь B — действует правило правой руки, как будто светофор выключен"],
        ["Ingen har vikeplikt, blinkende gult betyr fri kjøring for alle", "Никто не уступает, мигающий жёлтый значит «можно всем ехать свободно»", "Blinkende gult betyr bare at lyset er satt ut av vanlig drift og krever særlig aktsomhet, det fjerner ikke vikepliktsreglene, det aktiverer dem.", "Мигающий жёлтый означает лишь, что светофор работает в особом режиме и требует повышенной осторожности — правила приоритета от этого не исчезают, наоборот, включаются."],
        ["Du har forrang siden lyset uansett teller som grønt for deg", "У тебя преимущество, потому что мигающий свет всё равно считается зелёным для тебя", "Blinkende gult er ikke det samme som grønt lys, det betyr at lyssignalet ikke styrer krysset lenger.", "Мигающий жёлтый — это не то же самое, что зелёный, это значит, что светофор больше не управляет перекрёстком."],
        ["Dere må begge stoppe helt og vente til den andre kjører først", "Обеим машинам нужно полностью остановиться и ждать, пока другая поедет первой", "Det er ikke krav om full stopp for begge, bare om å vise vikeplikt etter høyreregelen på vanlig måte.", "Полная остановка для обоих не требуется — нужно просто уступить по обычному правилу правой руки."]
      ],
      "Blinkende gult lys betyr at trafikklyset er ute av drift og krever særlig aktpågivenhet. Uten andre skilt gjelder høyreregelen som i et vanlig kryss uten lys.",
      "Мигающий жёлтый означает, что светофор не регулирует перекрёсток и требует особой осторожности. Без других знаков действует правило правой руки, как на обычном нерегулируемом перекрёстке.",
      "Мигающий жёлтый = светофора как бы нет. Смотри на знаки и на правило правой руки."),

    q("050", street({ features: [{ type: "bikePath", join: 140 }], actors: [{ kind: "bike", x: 270, y: 200, label: "B", path: [[270, 160], [226, 112], [224, 60]] }, { label: "A", y: 250, path: [[216, 160]] }] }),
      "En syklist kommer ut fra en sykkelvei og skal inn på vegen din, i samme retning som deg. Det er ikke skilt eller lys. Hvem har vikeplikt?",
      "Велосипедист выезжает с велодорожки на твою дорогу, в том же направлении, что и ты. Знаков и светофора нет. Кто уступает?",
      [
        ["Syklisten har vikeplikt for deg", "Велосипедист уступает тебе"],
        ["Du har vikeplikt for syklisten, syklister har alltid forrang i trafikken", "Ты уступаешь велосипедисту — у велосипедистов всегда преимущество", "Syklister har ikke automatisk forrang. Den som forlater en sykkelvei og skal ut på vanlig veg, skal selv vike for trafikken der.", "У велосипедистов нет автоматического преимущества. Тот, кто съезжает с велодорожки на обычную дорогу, сам обязан уступить транспорту на ней."],
        ["Høyreregelen avgjør, siden syklisten kommer fra venstre", "Решает правило правой руки — велосипедист слева", "Høyreregelen gjelder i kryss mellom veger, ikke når noen forlater en sykkelvei. Der gjelder en egen regel: syklisten viker.", "Правило правой руки действует на перекрёстках дорог, а не там, где кто-то съезжает с велодорожки. Там своё правило: уступает велосипедист."],
        ["Den som kommer først har forrang", "Преимущество у того, кто подъехал первым", "Ankomsttidspunktet har ingen betydning her. Regelen er entydig: syklisten som forlater sykkelveien, skal vike.", "Момент прибытия тут роли не играет. Правило однозначное: велосипедист, съезжающий с велодорожки, обязан уступить."]
      ],
      "Trafikkreglene § 7 nr. 4: den som kjører ut fra sykkelveg, gangveg, fortau eller lignende, skal vike for trafikk på vegen han kjører ut på. Dette gjelder selv om syklisten skal samme vei som deg.",
      "Trafikkreglene § 7 nr. 4: тот, кто выезжает с велодорожки, тротуара или похожего пути, обязан уступить транспорту на дороге, куда он выезжает. Это действует, даже если велосипедист едет туда же, куда и ты.",
      "Запомни исключение: велосипедист на велодорожке не «главный». Съезжая на дорогу, он уступает сам."),

    q("051", scene({ you: { from: "south", to: "east" }, others: [{ from: "south", to: "north", kind: "bike" }], peds: ["east"] }),
      "Du skal svinge til høyre. En syklist på høyre side av deg skal rett fram, og en fotgjenger er på veg over gangfeltet på veien du svinger inn på. Hva gjør du?",
      "Ты собираешься повернуть направо. Велосипедист справа от тебя едет прямо, а пешеход переходит по зебре ту дорогу, на которую ты поворачиваешь. Что делаешь?",
      [
        ["Vike for både syklisten og fotgjengeren før jeg svinger", "Уступить и велосипедисту, и пешеходу, прежде чем повернуть"],
        ["Vike bare for fotgjengeren, syklisten må passe seg selv", "Уступить только пешеходу — велосипедист пусть сам смотрит", "Trafikkreglene § 7 nr. 3 gir syklende samme beskyttelse som gående ved svinging. Du skal vike for begge.", "Trafikkreglene § 7 nr. 3 даёт велосипедистам ту же защиту, что и пешеходам, при повороте. Уступить нужно обоим."],
        ["Svinge raskt forbi syklisten før fotgjengeren rekker fram", "Быстро проскочить мимо велосипедиста, пока пешеход не дошёл", "Å skynde seg forbi en syklist som kommer rett fram er nettopp det vikeplikten skal hindre, dette er farlig og feil.", "Спешить, чтобы проскочить перед велосипедистом, едущим прямо, — именно то, что должна предотвращать обязанность уступить. Это опасно и неверно."],
        ["Vike bare for syklisten, fotgjengeren har ikke gått ut i feltet ennå", "Уступить только велосипедисту — пешеход ещё не вышел на переход", "Fotgjengeren er allerede i ferd med å krysse gangfeltet du svinger inn på, du skal vike for ham også.", "Пешеход уже переходит зебру той дороги, куда ты поворачиваешь, — ему тоже нужно уступить."]
      ],
      "Trafikkreglene § 7 nr. 3: den som svinger, skal vike for gående som er i ferd med å krysse den vegen svingen fører inn på, og for syklende som kjører rett fram. Begge skal sjekkes før du fullfører svingen.",
      "Trafikkreglene § 7 nr. 3: поворачивающий водитель обязан уступить пешеходам, переходящим ту дорогу, куда ведёт поворот, и велосипедистам, едущим прямо. Перед завершением поворота нужно проверить и тех, и других.",
      "Поворот направо — это два взгляда: назад-вправо (велосипед) и вперёд (пешеход на переходе)."),

    q("052", street({ sides: { left: "walk", right: "none" }, features: [{ type: "bikeLane", side: "right" }, { type: "parkingLane", side: "right" }], actors: [{ label: "A", x: 247, y: 130, door: "left" }, { kind: "bike", x: 225, y: 250, label: "S", path: [[225, 160], [225, 60]] }] }),
      "Du har nettopp parkert bilen langs en gate der det er sykkelfelt rett ved siden av bilen. Hva bør du gjøre før du åpner bildøren?",
      "Ты только что припарковался вдоль улицы, где прямо рядом с машиной проходит велополоса. Что нужно сделать, прежде чем открыть дверь?",
      [
        ["Se deg over skulderen og sjekke om det kommer en syklist, før du åpner døren forsiktig", "Оглянуться через плечо и проверить, не едет ли велосипедист, прежде чем аккуратно открыть дверь"],
        ["Åpne døren raskt, syklister har plikt til å se opp for dører", "Быстро открыть дверь — велосипедисты сами обязаны следить за дверями", "Det er føreren som må sjekke for syklister før døren åpnes, ikke omvendt. En syklist rekker ofte ikke å reagere på en dør som åpnes brått.", "Именно водитель должен проверить, нет ли велосипедистов, прежде чем открыть дверь, а не наоборот. Велосипедист часто просто не успевает среагировать на резко открывшуюся дверь."],
        ["Bruke høyre hånd til å åpne døren fra førersetet, det er nok", "Открыть дверь правой рукой с водительского места — этого достаточно", "Å bruke motsatt hånd hjelper deg å snu overkroppen og se bakover, men det erstatter ikke å faktisk sjekke om det kommer noen.", "Открывание дальней рукой помогает развернуть корпус и посмотреть назад, но само по себе не заменяет реальную проверку — велосипедиста всё равно нужно высматривать."],
        ["Det er ikke noe å tenke på, sykkelfeltet er syklistens eget ansvar", "Тут не о чем думать — велополоса — это забота самого велосипедиста", "Å åpne en bildør rett foran en syklist kan forårsake en alvorlig ulykke. Ansvaret for å sjekke ligger hos deg som åpner døren.", "Открыть дверь прямо перед велосипедистом — это может привести к серьёзной аварии. Ответственность за проверку лежит на том, кто открывает дверь."]
      ],
      "Å åpne bildøren uten å se seg for («dooring») er en vanlig årsak til alvorlige sykkelulykker. Sjekk alltid i speilet og over skulderen for syklister før du åpner døren mot et sykkelfelt eller en kjørebane.",
      "Открывание двери без проверки («дуринг») — частая причина серьёзных аварий с велосипедистами. Перед тем как открыть дверь в сторону велополосы или проезжей части, всегда проверяй зеркало и оглядывайся через плечо.",
      "Правило «голландской ручки»: открывай дверь дальней от улицы рукой — тело само развернётся, и ты увидишь велосипедиста."),

    q("053", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "off" }, { type: "sign", kind: "rest", x: 300, y: 150, size: 28 }, { type: "tag", text: "RASTEPLASS", x: 326, y: 40 }], actors: [{ label: "A", lane: 1, y: 256, path: [[216, 200]] }, { kind: "car", lane: 0, y: 120, label: false, color: "#8e5bd6" }] }),
      "Du har kjørt lenge på motorveien og merker at du blir søvnig og øynene faller igjen. Hva er tryggest å gjøre?",
      "Ты долго едешь по автомагистрали и чувствуешь, что засыпаешь — глаза сами закрываются. Что безопаснее всего сделать?",
      [
        ["Finne nærmeste rasteplass eller parkeringsplass og stoppe for å hvile", "Найти ближайшую площадку отдыха или парковку и остановиться отдохнуть"],
        ["Skru opp musikken og åpne vinduet, det holder deg våken lenge nok", "Включить музыку погромче и открыть окно — этого хватит, чтобы не заснуть", "Slike triks gir bare en kortvarig effekt. De fjerner ikke den underliggende trøttheten, og mikrosøvn kan komme uansett.", "Такие трюки дают лишь кратковременный эффект. Настоящая усталость никуда не девается, и микросон всё равно может наступить."],
        ["Kjøre litt saktere enn normalt, så rekker du å reagere selv om du blir trøtt", "Ехать чуть медленнее обычного — так успеешь среагировать, даже если заснёшь", "Lavere fart reduserer ikke faren for mikrosøvn. Selv i lav fart mister du kontrollen fullstendig hvis du sovner.", "Меньшая скорость не снижает риск микросна. Даже на небольшой скорости, если заснуть, контроль над машиной теряется полностью."],
        ["Fortsette til du kommer fram, korte pauser hjelper ikke uansett", "Ехать до конца пути — короткие остановки всё равно не помогут", "Korte pauser og hvile hjelper faktisk mye mot trøtthet. Å fortsette å kjøre trøtt er svært farlig og en vanlig årsak til utforkjøringsulykker.", "Короткие остановки и отдых реально помогают от усталости. Продолжать ехать сонным очень опасно и часто становится причиной съезда с дороги."]
      ],
      "Trøtthet bak rattet er en av de vanligste årsakene til alvorlige ulykker, spesielt på motorvei om natten. Eneste effektive tiltak er å stoppe og hvile, gjerne med en kort lur på 15–20 minutter.",
      "Усталость за рулём — одна из самых частых причин тяжёлых аварий, особенно ночью на автомагистрали. Единственная действенная мера — остановиться и отдохнуть, желательно вздремнуть 15–20 минут.",
      "Если веки тяжелеют — это уже не «я потерплю», это сигнал ехать на ближайшую стоянку."),

    q("054", street({ sides: { left: "snow", right: "snow" }, weather: "snow", features: [{ type: "sign", kind: "descent", y: 270, size: 28 }, { type: "puddle", y: 80, kind: "ice" }], actors: [{ label: "A", y: 180, path: [[216, 110]] }], tags: [{ text: "LANG, BRATT BAKKE NED", x: 92, y: 40 }] }),
      "Du kjører nedover en lang, bratt bakke om vinteren på snø og is. Hva er lurest for å holde kontroll på farten?",
      "Зимой ты едешь вниз по длинному крутому спуску по снегу и льду. Как разумнее всего контролировать скорость?",
      [
        ["Kjøre i et lavt gir og bruke motorbremsing, i tillegg til lette bremsetrykk", "Ехать на пониженной передаче, используя торможение двигателем, и слегка подтормаживать"],
        ["Sette inn kraftig og lang bremsing hele veien ned", "Всю дорогу вниз тормозить сильно и долго", "Lang, kraftig bremsing på glatt føre øker faren for at hjulene mister grepet og bilen sklir ukontrollert.", "Долгое сильное торможение на скользком покрытии повышает риск, что колёса потеряют сцепление, и машину понесёт."],
        ["Kjøre i fri (nøytral) for å spare drivstoff", "Ехать на нейтральной передаче, чтобы сэкономить топливо", "I fri gir mister du motorbremsingen og må stole helt på fotbremsen, det gir dårligere kontroll i bakken.", "На нейтральной передаче ты теряешь торможение двигателем и полагаешься только на педаль тормоза — контроль в спуске хуже."],
        ["Øke farten litt for å komme fortere gjennom bakken", "Слегка увеличить скорость, чтобы быстрее проехать спуск", "Høyere fart i en bratt bakke på glatt føre gjør det enda vanskeligere å stoppe i tide hvis noe skjer.", "Более высокая скорость на скользком крутом спуске ещё больше усложняет остановку вовремя, если что-то случится."]
      ],
      "På glatt føre i bakker bør du bruke et lavt gir og la motorbremsingen ta mye av jobben, med forsiktige, lette bremsetrykk i tillegg. Det gir jevnere fartskontroll enn kraftig fotbremsing alene.",
      "На скользком спуске стоит ехать на пониженной передаче и использовать торможение двигателем, слегка подтормаживая педалью. Это даёт более плавный контроль скорости, чем резкое торможение педалью само по себе.",
      "Правило зимнего спуска: вниз — на той же передаче, на которой поднимался бы в эту горку."),

    q("055", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south", kind: "tram", label: "T" }], rails: "ns" }),
      "Du skal svinge til venstre, og en sporvogn (trikk) kommer rett fram i samme kryss. Hvem har vikeplikt?",
      "Ты поворачиваешь налево, и трамвай едет прямо через тот же перекрёсток. Кто уступает?",
      [
        ["Du skal gi trikken fri veg: alle trafikanter skal vike for sporvogn", "Ты уступаешь трамваю: все участники движения обязаны пропускать трамвай"],
        ["Trikken må vike siden du svinger og den kjører rett fram på skinner", "Уступает трамвай, раз ты поворачиваешь, а он просто едет по рельсам", "Det er omvendt: trafikkreglene § 10 nr 2 sier at alle skal gi sporvogn fri veg, uansett om den kjører rett fram eller du svinger.", "У трамвая приоритет перед всеми остальными участниками движения по § 10, независимо от того, едет он прямо или ты поворачиваешь."],
        ["Det avhenger av hvem som kom først til krysset", "Зависит от того, кто подъехал к перекрёстку первым", "Ankomsttidspunktet spiller ingen rolle her, trikken har forrang etter en egen regel, ikke etter høyreregelen.", "Момент прибытия тут ни при чём — у трамвая приоритет по отдельному правилу, а не по правилу правой руки."],
        ["Høyreregelen avgjør", "Решает правило правой руки", "Høyreregelen gjelder ikke overfor sporvogn. Alle skal gi trikken fri veg, uansett hvilken side den kommer fra.", "Правило правой руки не применяется к трамваю. У него приоритет всегда, независимо от того, с какой стороны он едет."]
      ],
      "Trafikkreglene § 10 nr. 2: trafikanter skal gi fri veg og om nødvendig stanse for sporvogn. Det gjelder også når du svinger og trikken kjører rett fram.",
      "Trafikkreglene § 10 nr. 2: все участники движения обязаны уступать дорогу трамваю и при необходимости останавливаться. Это действует и тогда, когда ты поворачиваешь, а трамвай едет прямо.",
      "Трамвай — как король на шахматной доске: ему уступают всегда, никакие другие правила его не перебивают."),

    q("056", scene({ you: { from: "south", to: "north", dist: 104 }, lights: { south: "red" }, extra: [{ kind: "car", x: 215, y: 214, rot: 0, color: "#8e5bd6", label: false, brake: true }], tags: [{ text: "RØDT LYS — KØ", x: 300, y: 285 }] }),
      "Du står i kø for rødt lys og telefonen din pipir med en melding. Har du lov til å lese eller skrive på håndholdt mobil nå?",
      "Ты стоишь в очереди на красный свет, и телефон пикнул с сообщением. Можно ли читать или писать в телефоне прямо сейчас?",
      [
        ["Nei, kortvarig stans i kø eller ved rødt lys regnes som kjøring, håndholdt mobil er forbudt", "Нет, короткая остановка в пробке или на красный считается движением — телефон в руках запрещён"],
        ["Ja, siden bilen står stille akkurat nå", "Да, ведь машина сейчас стоит на месте", "Bilen står bare midlertidig, ikke parkert. Kjøring omfatter også slike korte stopp, så håndholdt mobilbruk er fortsatt forbudt.", "Машина стоит лишь временно, а не припаркована. Понятие «за рулём» включает и такие короткие остановки, так что телефон в руках всё равно под запретом."],
        ["Ja, så lenge du legger den fra deg igjen før lyset blir grønt", "Да, главное — отложить телефон до того, как загорится зелёный", "Det er ikke lov i det hele tatt å holde telefonen mens du kjører, uansett hvor raskt du legger den fra deg.", "Держать телефон в руке во время движения нельзя вообще — неважно, как быстро потом его отложить."],
        ["Ja, men bare for å lese, ikke for å skrive", "Да, но только читать, не набирать текст", "Forbudet mot håndholdt mobil skiller ikke mellom å lese og å skrive, begge deler er ulovlig når bilen ikke er trygt parkert.", "Запрет на телефон в руках не различает чтение и набор текста — и то, и другое запрещено, пока машина не припаркована как следует."]
      ],
      "Håndholdt mobiltelefon er forbudt under kjøring, og det inkluderer korte stopp som kø eller rødt lys. Du kan bare bruke den håndholdt når bilen er trygt parkert.",
      "Телефон в руках запрещён во время движения, и это включает короткие остановки — пробку или красный свет. Пользоваться им в руках можно только когда машина по-настоящему припаркована.",
      "«Стоим на красном» — это ещё «за рулём», а не «припарковались». Телефон подождёт до настоящей стоянки."),

    q("057", street({ actors: [{ kind: "bike", x: 244, y: 130, rot: 330, label: "B", path: [[230, 104], [222, 60]] }, { label: "A", y: 230, path: [[216, 160]] }] }),
      "Du kjører sakte forbi et fortau. En syklist kommer ut fra fortauet og skal ut i kjørebanen rett foran deg. Hvem har vikeplikt?",
      "Ты медленно едешь мимо тротуара. Велосипедист съезжает с тротуара на проезжую часть прямо перед тобой. Кто уступает?",
      [
        ["Syklisten har vikeplikt for meg, siden han kommer fra fortau/sykkelveg ut i kjørebanen", "Уступает велосипедист — он выезжает с тротуара/велодорожки на проезжую часть"],
        ["Jeg må vike, syklister har alltid forrang i trafikken", "Уступаю я — у велосипедистов всегда преимущество", "Syklister har ikke automatisk forrang overalt. Den som kjører ut fra fortau eller sykkelveg til kjørebanen, skal selv vike for trafikken der.", "У велосипедистов нет автоматического преимущества везде. Тот, кто выезжает с тротуара или велодорожки на проезжую часть, сам обязан уступить транспорту на ней."],
        ["Høyreregelen avgjør, siden syklisten kommer fra høyre", "Решает правило правой руки, ведь велосипедист справа", "Høyreregelen gjelder mellom veier i et kryss, ikke når noen kjører ut fra fortau eller sykkelveg til kjørebanen.", "Правило правой руки действует между дорогами на перекрёстке, а не когда кто-то выезжает с тротуара или велодорожки на проезжую часть."],
        ["Den som kommer først til stedet, kjører først", "Первым едет тот, кто раньше подъехал", "Ankomsttidspunkt er ikke avgjørende her. Regelen er klar: den som kommer fra fortau eller sykkelveg, har vikeplikt uansett.", "Момент прибытия тут роли не играет. Правило чёткое: выезжающий с тротуара или велодорожки уступает в любом случае."]
      ],
      "Trafikkreglene § 7 nr. 4: den som kjører ut fra fortau, gangveg eller sykkelveg til kjørebanen, har vikeplikt for trafikken der. Dette gjelder også syklister.",
      "Trafikkreglene § 7 nr. 4: тот, кто выезжает с тротуара, пешеходной или велодорожки на проезжую часть, уступает движению на ней. Это касается и велосипедистов.",
      "Съезжаешь с тротуара или велодорожки на дорогу — сам уступаешь, кем бы ты ни был, хоть на велосипеде, хоть пешком."),

    q("058", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], roundabout: true, lights: { south: "red" } }),
      "Du nærmer deg en rundkjøring der det også står et trafikklys, og lyset er rødt. Hva gjør du?",
      "Ты подъезжаешь к кругу, на котором есть светофор, и горит красный. Что делаешь?",
      [
        ["Stopper for det røde lyset, selv om det ikke er andre biler i rundkjøringen", "Останавливаюсь на красный, даже если на круге никого нет"],
        ["Kjører inn som vanlig, i rundkjøring er det bare vikeplikt, ikke stopplikt", "Еду как обычно — на круге действует только уступание, а не остановка", "Der en rundkjøring er signalregulert, går lyset foran den vanlige vikeplikten. Rødt lys betyr stopp, akkurat som i et vanlig kryss.", "Там, где круг регулируется светофором, сигнал важнее обычного правила уступания. Красный значит стоп, точно как на обычном перекрёстке."],
        ["Senker bare farten litt og kjører videre", "Просто немного сбрасываю скорость и еду дальше", "Rødt lys krever full stopp, ikke bare fartsreduksjon, selv i en rundkjøring.", "Красный требует полной остановки, а не просто снижения скорости, даже на круге."],
        ["Ser bort fra lyset fordi rundkjøringer alltid styres av vikeplikt", "Игнорирую светофор — круги всегда регулируются уступанием", "Noen rundkjøringer er signalregulerte nettopp for å styre stor trafikkmengde, og da gjelder lyset, ikke den vanlige vikeplikten.", "Некоторые круги как раз регулируются светофором, чтобы справляться с большим потоком — тогда действует сигнал, а не обычное правило уступания."]
      ],
      "Noen rundkjøringer har trafikklys, ofte for å regulere tungt trafikkert innkjøring. Da går lyssignalet foran den vanlige regelen om å vike for trafikk i rundkjøringen — rødt betyr stopp.",
      "У некоторых кругов есть светофор — обычно там, где нужно регулировать плотный поток на въезде. Тогда сигнал светофора важнее обычного правила уступания на круге — красный значит стоп.",
      "Если на круге есть светофор — забудь про обычное «уступи тем, кто на круге»: работает обычная логика светофора."),

    q("059", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east", kind: "truck" }] }),
      "Kryss uten skilt. Et vogntog kommer fra venstre. Hvem kjører først?",
      "Перекрёсток без знаков. Слева едет фура. Кто едет первым?",
      [
        ["Jeg kjører først, vogntoget kommer fra venstre og må vike for meg", "Первым еду я — фура слева и должна уступить мне"],
        ["Vogntoget kjører først, det er størst og trenger mer plass", "Первой едет фура — она больше и ей нужно больше места", "Størrelsen på kjøretøyet har ingen betydning for vikeplikten. Høyreregelen avgjør ut fra retning, ikke ut fra hvor stort kjøretøyet er.", "Размер машины никак не влияет на обязанность уступить. Правило правой руки решает по направлению, а не по габаритам."],
        ["Vi må begge stoppe og vinke hverandre fram", "Мы оба должны остановиться и жестами пропустить друг друга", "Høyreregelen gir et klart svar uten at dere trenger å avtale noe med tegn.", "Правило правой руки даёт чёткий ответ без необходимости договариваться жестами."],
        ["Det er tryggest at vogntoget kjører først siden det bremser saktere", "Безопаснее, если фура поедет первой — она медленнее тормозит", "Bremseevne er ikke en del av vikepliktreglene. Det er retningen kjøretøyet kommer fra som avgjør, ikke hvor fort det kan stoppe.", "Тормозные свойства не входят в правила уступания. Решает направление, откуда едет машина, а не то, как быстро она может остановиться."]
      ],
      "Høyreregelen gjelder likt for alle kjøretøy, uansett størrelse. Kommer et kjøretøy fra venstre for deg i et kryss uten skilt eller lys, er det det som skal vike, enten det er en sykkel eller et vogntog.",
      "Правило правой руки действует одинаково для всех, независимо от размера. Если машина едет слева от тебя на перекрёстке без знаков и светофора, уступать должна именно она — хоть велосипед, хоть фура.",
      "Забудь про размер машины — на перекрёстке без знаков решает только направление: «слева» всегда уступает."),

    q("060", street({ features: [{ type: "zebra", y: 120 }, { type: "light", y: 96, state: "flash" }], actors: [{ kind: "adult", x: 244, y: 128, rot: 270, color: "#6b4fa0", walk: [228, 128] }, { label: "A", y: 245, path: [[216, 170]] }] }),
      "Du nærmer deg et gangfelt der det henger et blinkende gult lys over veien, uten rødt eller grønt. En fotgjenger står klar til å krysse. Hva gjør du?",
      "Ты подъезжаешь к пешеходному переходу, над которым мигает жёлтый сигнал — без красного и зелёного. Пешеход готов переходить дорогу. Что делаешь?",
      [
        ["Senker farten, viser ekstra aktsomhet og slipper fotgjengeren fram i gangfeltet", "Снижаю скорость, проявляю особую осторожность и пропускаю пешехода на переходе"],
        ["Kjører som normalt, blinkende gult betyr at jeg har forrang", "Еду как обычно — мигающий жёлтый значит, что у меня преимущество", "Blinkende gult gir ingen forrang til noen, det er bare et varsel om å vise særlig aktsomhet. Fotgjengeren i gangfeltet har fortsatt rett til å gå, og du skal slippe ham fram.", "Мигающий жёлтый никому не даёт преимущества — это просто сигнал проявить особую осторожность. Пешеход на переходе всё равно имеет право пройти, а ты его пропускаешь."],
        ["Stopper helt opp foran gangfeltet i alle tilfeller", "В любом случае полностью останавливаюсь перед переходом", "Blinkende gult krever ikke alltid full stopp, men aktsomhet og at du faktisk slipper fram fotgjengere som skal krysse.", "Мигающий жёлтый не всегда требует полной остановки — важна осторожность и то, что пешехода на переходе действительно пропускают."],
        ["Kjører forbi fordi lyset ikke er rødt", "Проезжаю, ведь сигнал не красный", "Fraværet av rødt lys fritar deg ikke for vikeplikten overfor fotgjengere som allerede står klare i gangfeltet.", "Отсутствие красного не освобождает от обязанности уступить пешеходам, которые уже готовы перейти на переходе."]
      ],
      "Blinkende gult lys betyr «særlig aktpågivenhet og varsomhet» — det gir ingen automatisk forrang. Ved et gangfelt har fotgjengere som skal krysse, uansett rett til å gå, og du skal senke farten og slippe dem fram.",
      "Мигающий жёлтый значит «особая внимательность и осторожность» — сам по себе он никому не даёт автоматического преимущества. На пешеходном переходе пешеход, который переходит, в любом случае имеет право пройти, и ты обязан снизить скорость и пропустить его.",
      "Мигающий жёлтый — это не «зелёный без обязательств», это «думай сам, но пешехода на переходе пропусти»."),

    q("061", scene({ you: { from: "south", to: "east" }, signs: { south: "priority" }, peds: ["east"] }),
      "Du kjører på forkjørsvei og skal svinge til høyre. En fotgjenger går i gangfeltet på veien du svinger inn på. Har forkjørsretten din noe å si her?",
      "Ты едешь по главной дороге и поворачиваешь направо. По переходу на дороге, куда ты поворачиваешь, идёт пешеход. Имеет ли значение твой приоритет по главной дороге?",
      [
        ["Nei, forkjørsrett gjelder bare mot andre kjøretøy — jeg skal uansett vike for fotgjengeren i gangfeltet", "Нет, приоритет по главной действует только относительно других машин — пешехода на переходе я всё равно пропускаю"],
        ["Ja, forkjørsveien gir meg forrang over alle, også fotgjengere", "Да, главная дорога даёт преимущество надо всеми, включая пешеходов", "Forkjørsrett regulerer bare forholdet mellom kjøretøy på ulike veier. Den fritar deg aldri for vikeplikten overfor fotgjengere i gangfelt.", "Приоритет по главной дороге регулирует только отношения между машинами на разных дорогах. От обязанности уступить пешеходам на переходе он никогда не освобождает."],
        ["Bare hvis fotgjengeren allerede er over halvveis", "Только если пешеход уже прошёл больше половины перехода", "Vikeplikten for svingende trafikk overfor fotgjengere i gangfelt gjelder uansett hvor langt fotgjengeren har kommet.", "Обязанность уступить пешеходу на переходе при повороте действует независимо от того, как далеко он прошёл."],
        ["Nei, men bare fordi det ikke er gangfelt, det er vanlig fortau", "Нет, но только потому что это не переход, а обычный тротуар", "Spørsmålet gjelder nettopp et gangfelt, ikke et vanlig fortau — og selv om det var et fortau, skal du fortsatt vike der du krysser det.", "В вопросе речь именно о пешеходном переходе, а не обычном тротуаре — но даже пересекая тротуар, ты всё равно обязан уступить."]
      ],
      "Skilting om forkjørsvei regulerer bare rekkefølgen mellom kjøretøy. Når du svinger og krysser et gangfelt, har fotgjengere som går der, alltid rett til å gå ferdig — det gjelder uansett om du kommer fra en forkjørsvei eller ikke.",
      "Знак главной дороги регулирует только очерёдность между машинами. Когда ты поворачиваешь и пересекаешь пешеходный переход, идущие по нему пешеходы всегда имеют право закончить переход — независимо от того, едешь ли ты по главной дороге.",
      "Главная дорога решает спор с другими машинами, а не с пешеходами. Пешеход на переходе побеждает всегда."),

    q("062", street({ center: "dashToSolid", solidFrom: 130, sides: { left: "grass", right: "grass" }, features: [{ type: "crest", y: 80 }], actors: [{ kind: "tractor", y: 160, color: "#2f8f3a", label: false }, { label: "A", y: 250, path: [[216, 212]] }], tags: [{ text: "TRAKTOR", x: 290, y: 160 }] }),
      "Du ligger bak en traktor som kjører sakte. Midtlinjen er brutt (stiplet), men rett foran ser du at den blir heltrukket idet veien går over en bakketopp. Hva gjør du?",
      "Ты едешь за трактором, который тащится медленно. Осевая прерывистая, но впереди видно, что она становится сплошной прямо перед вершиной подъёма. Что делаешь?",
      [
        ["Avbryter planen om forbikjøring der, og venter til jeg har bedre sikt og lovlig linje", "Отменяю обгон именно там и жду, пока не будет лучше видимость и разрешающая разметка"],
        ["Rekker forbikjøringen akkurat før den heltrukne linjen begynner", "Успеваю обогнать как раз перед началом сплошной линии", "En uoversiktlig bakketopp er farlig for forbikjøring uansett hvor linjen begynner, og du vet ikke sikkert at du rekker det trygt før linjen eller bakketoppen.", "Непросматриваемая вершина подъёма опасна для обгона независимо от того, где начинается линия, и ты не можешь быть уверен, что успеешь безопасно до линии или вершины."],
        ["Kjører forbi likevel, stiplet linje der jeg starter gjør det lovlig", "Всё равно обгоняю — раз начал на прерывистой, значит можно", "Det er hele forbikjøringen, ikke bare starten, som må skje på stiplet linje og med god sikt. Fullføres den over en heltrukket linje eller uoversiktlig bakketopp, er det ulovlig.", "На прерывистой линии и при хорошей видимости должен проходить весь обгон целиком, а не только его начало. Если он завершается на сплошной линии или у непросматриваемого подъёма — это нарушение."],
        ["Tuter og kjører forbi i høy fart for å bli fort ferdig", "Сигналю и обгоняю на большой скорости, чтобы быстрее закончить", "Høyere fart øker faren ved en uoversiktlig bakketopp i stedet for å redusere den, og signalhorn endrer ikke på at sikten er for dårlig.", "Более высокая скорость у непросматриваемого подъёма только увеличивает опасность, а не снижает её, а гудок никак не улучшает видимость."]
      ],
      "Forbikjøring er forbudt der sikten er for dårlig, som ved en uoversiktlig bakketopp, og hele forbikjøringen må gjennomføres på strekning med stiplet linje. Ser du at linjen blir heltrukket eller sikten forsvinner, avbryter du planen i tide.",
      "Обгон запрещён там, где видимость недостаточна, например у непросматриваемого подъёма, и весь обгон целиком должен пройти на участке с прерывистой линией. Если видишь, что линия становится сплошной или видимость пропадает, — заранее откажись от манёвра.",
      "Не начинай обгон, если не уверен, что успеешь ЗАКОНЧИТЬ его на прерывистой линии и с хорошим обзором."),

    q("063", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, actors: [{ kind: "post", x: 246, y: 104 }, { label: "B", lane: 1, y: 92, color: "#e0483a", path: [[216, 30]] }, { label: "A", lane: 1, y: 250, path: [[216, 190]] }] }),
      "Du vil bruke tresekundersregelen for å sjekke avstanden til bilen foran på tørr motorvei. Hvordan gjør du det riktig?",
      "Ты хочешь применить правило трёх секунд, чтобы проверить дистанцию до машины впереди на сухой автомагистрали. Как сделать это правильно?",
      [
        ["Merker deg et fast punkt langs veien, teller sekunder fra bilen foran passerer det til du selv passerer det samme punktet", "Замечаю неподвижную точку у дороги и считаю секунды от момента, когда её проезжает машина впереди, до момента, когда её проезжаю я сам"],
        ["Anslår avstanden i meter med øyemål, sekunder er ikke nødvendig", "Оцениваю дистанцию в метрах на глаз — секунды тут ни при чём", "Å bedømme avstand i meter i høy fart er upresist. Tresekundersregelen bruker tid, ikke meter, nettopp fordi det er lettere å vurdere riktig.", "Оценивать дистанцию в метрах на высокой скорости неточно. Правило трёх секунд основано на времени, а не на метрах, именно потому что время оценить легче и точнее."],
        ["Teller sekunder fra du selv passerer punktet til bilen foran passerer det", "Считаю секунды с момента, когда точку проезжаю я, до момента, когда её проезжает машина впереди", "Rekkefølgen er snudd. Du skal telle fra bilen foran passerer punktet til du selv når det samme punktet, ikke omvendt.", "Порядок перепутан. Считать нужно от момента, когда точку проезжает машина впереди, до момента, когда до неё доезжаешь ты сам, а не наоборот."],
        ["Bruker regelen bare når det er kø, ellers er den unødvendig", "Использую правило только в пробке, в остальных случаях оно не нужно", "Regelen er mest nyttig nettopp i fri flyt med høyere fart, der det er lettere å ligge for tett uten å merke det. I kø er avstanden uansett kort og farten lav.", "Правило особенно полезно как раз при свободном потоке на высокой скорости, где легко незаметно подъехать слишком близко. В пробке дистанция и так короткая, а скорость низкая."]
      ],
      "Velg et merke langs veien, som et skilt eller en bro. Når bilen foran passerer merket, begynn å telle «tusen og en, tusen og to, tusen og tre». Passerer du merket før du er ferdig å telle, ligger du for tett og bør øke avstanden.",
      "Выбери ориентир у дороги — например знак или мост. Когда его проезжает машина впереди, начинай считать «тысяча один, тысяча два, тысяча три». Если ты доезжаешь до ориентира раньше, чем закончил считать, — дистанция слишком мала, нужно отступить дальше.",
      "Три секунды — это минимум на сухой дороге. На мокрой или зимой мысленно удваивай счёт."),

    /* ---------- Несколько правильных ответов ---------- */
    qm("m01", street({ features: [{ type: "zebra", y: 120 }], actors: [{ kind: "adult", x: 246, y: 128, rot: 270, color: "#6b4fa0", walk: [230, 128] }, { kind: "car", lane: "left", y: 150, label: false, color: "#8e5bd6", brake: true }, { label: "A", y: 250, path: [[216, 180]] }] }),
      "Du nærmer deg et gangfelt. Hva skal du gjøre? Velg alle riktige.", "Ты подъезжаешь к пешеходному переходу. Что нужно делать? Выбери все верные.", [
      ["Senke farten i god tid", "Заранее снизить скорость", true],
      ["Være klar til å stoppe for gående som er på veg ut i gangfeltet", "Быть готовым остановиться перед пешеходом, выходящим на переход", true],
      ["Ikke kjøre forbi en bil som har stanset foran gangfeltet", "Не объезжать машину, остановившуюся перед переходом", true],
      ["Tute for å varsle de gående om at du kommer", "Посигналить, чтобы пешеходы знали, что ты едешь", false, "Lydsignal skal bare brukes for å avverge fare, ikke for å få gående til å vente.", "Сигнал — только чтобы предотвратить опасность, а не чтобы пешеходы подождали."]
    ],
    "Trafikkreglene § 9: ved gangfelt skal du kjøre slik at du kan stoppe, og vike for gående som er i eller på veg ut i feltet. Forbikjøring rett foran gangfelt er forbudt.",
    "Trafikkreglene § 9: у перехода едешь так, чтобы суметь остановиться, и уступаешь пешеходам на переходе или выходящим на него. Обгон прямо перед переходом запрещён.",
    "Переход = «нога на тормозе». Машина, стоящая перед зеброй, стоит не просто так."),

    qm("m02", scene({ you: { from: "south", to: "west" }, others: [{ from: "east", to: "south" }], roundabout: true }),
      "Hva er riktig om kjøring i rundkjøring? Velg alle riktige.", "Что верно про движение на круге? Выбери все верные.", [
      ["Du har vikeplikt for trafikk som allerede er i rundkjøringen", "Ты уступаешь тем, кто уже на круге", true],
      ["Du gir tegn til høyre før du kjører ut", "Перед выездом включаешь правый поворотник", true],
      ["Du kjører mot klokka", "Едешь против часовой стрелки", true],
      ["Høyreregelen gjelder når du kjører inn", "При въезде действует правило правой руки", false, "Rundkjøringer er skiltet med vikeplikt, så du viker for alle inne i sirkelen, ikke bare de fra høyre.", "Перед кругом стоит знак «уступи», поэтому уступаешь всем на круге, а не только тем, кто справа."]
    ],
    "I rundkjøring kjører du mot klokka, viker for trafikk inne i sirkelen og gir tegn til høyre når du skal ut. Tegn til venstre brukes når du skal langt rundt.",
    "На круге едешь против часовой, уступаешь всем внутри круга, перед выездом включаешь правый поворотник. Левый — если едешь далеко по кругу.",
    "Въезд: уступи всем на круге. Выезд: правый поворотник."),

    qm("m03", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west", kind: "emergency" }], lights: { south: "green", east: "red" } }),
      "Du hører sirene og ser et utrykningskjøretøy med blålys. Hva skal du gjøre? Velg alle riktige.", "Ты слышишь сирену и видишь машину с мигалкой. Что нужно делать? Выбери все верные.", [
      ["Gi fri veg", "Освободить дорогу", true],
      ["Om nødvendig stanse ved siden av vegen", "При необходимости остановиться у обочины", true],
      ["Kjøre på rødt lys for å slippe det fram", "Проехать на красный, чтобы его пропустить", false, "Du skal ikke bryte trafikkreglene for å gi fri veg. Kjør til siden eller stans der du er, uten å kjøre på rødt.", "Ради освобождения дороги правила нарушать нельзя. Отъедь в сторону или остановись, но на красный не езжай."],
      ["Øke farten for å komme unna", "Ускориться, чтобы уйти вперёд", false, "Høyere fart skaper bare mer fare. Utrykningskjøretøyet trenger at du blir forutsigbar og gir plass.", "Больше скорости — больше опасности. Спецмашине нужно, чтобы ты был предсказуем и дал место."]
    ],
    "Trafikkreglene § 10: alle skal gi fri veg for utrykningskjøretøy med blålys og sirene, og om nødvendig stanse. Det gir ikke rett til å kjøre på rødt.",
    "Trafikkreglene § 10: все обязаны освободить дорогу спецтранспорту с мигалкой и сиреной и при необходимости остановиться. Права проезжать на красный это не даёт.",
    "Прижмись вправо, остановись, не суетись. Красный остаётся красным."),

    qm("m04", scene({ you: { from: "south", to: "north" }, signs: { south: "stop" }, peds: ["north"] }),
      "Du nærmer deg et stoppskilt. Hva må du gjøre? Velg alle riktige.", "Ты подъезжаешь к знаку «Стоп». Что нужно сделать? Выбери все верные.", [
      ["Stoppe helt, ikke bare senke farten", "Полностью остановиться, а не просто притормозить", true],
      ["Se til begge sider for kryssende trafikk før du kjører videre", "Посмотреть в обе стороны на перекрёстный трафик, прежде чем ехать дальше", true],
      ["Sjekke om det er fotgjengere i gangfeltet på veien du skal kjøre ut på", "Проверить, нет ли пешеходов на переходе той дороги, куда ты выезжаешь", true],
      ["Det holder å stoppe dersom veien virker tom", "Достаточно остановиться, если дорога выглядит пустой", false, "Stoppskiltet krever full stopp uansett hvor tom veien ser ut til å være, og du skal likevel forsikre deg om at den er fri.", "Знак «Стоп» требует полной остановки в любом случае, даже если дорога кажется пустой, и всё равно нужно убедиться, что она свободна."]
    ],
    "Ved stoppskilt skal du stoppe helt opp bak stopplinjen, forsikre deg om at krysset og eventuelt gangfelt er fritt, og først da kjøre videre.",
    "У знака «Стоп» нужно полностью остановиться перед стоп-линией, убедиться, что перекрёсток и переход (если есть) свободны, и только потом ехать дальше.",
    "Стоп значит стоп: колёса должны на мгновение полностью замереть, «почти ноль» не считается."),

    qm("m05", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }], peds: ["west"] }),
      "Du skal svinge til venstre i et kryss uten lys. Velg alle riktige.", "Ты поворачиваешь налево на перекрёстке без светофора. Выбери все верные.", [
      ["Du viker for møtende bil som kjører rett fram", "Уступаешь встречной машине, едущей прямо", true],
      ["Du viker for fotgjengere og syklister som krysser vegen du svinger inn på", "Уступаешь пешеходам и велосипедистам, переходящим дорогу, на которую поворачиваешь", true],
      ["Du gir tegn til venstre i god tid før svingen", "Заранее включаешь левый поворотник", true],
      ["Du har forrang fordi du kom fram til krysset først", "У тебя преимущество, потому что ты подъехал первым", false, "Ankomsttidspunktet gir ingen forrang ved venstresving. Du viker uansett for møtende trafikk og kryssende gående/syklende.", "Момент прибытия не даёт преимущества при повороте налево. Ты в любом случае уступаешь встречным и переходящим дорогу пешеходам/велосипедистам."]
    ],
    "Venstresving er den svakeste manøveren i et kryss: du viker for møtende trafikk som kjører rett fram eller svinger til høyre, og for gående og syklende som krysser vegen du svinger inn på. Gi tegn i god tid.",
    "Поворот налево — самый «слабый» манёвр на перекрёстке: уступаешь встречному транспорту, едущему прямо или поворачивающему направо, и пешеходам с велосипедистами, переходящим дорогу, на которую поворачиваешь. Заранее включай поворотник.",
    "При повороте налево ты в долгу у всех: и у встречных, и у пешеходов на переходе."),

    qm("m06", street({ sides: { left: "grass", right: "grass" }, center: "none", actors: [{ kind: "sheep", x: 196, y: 96, rot: 200 }, { kind: "sheep", x: 214, y: 114, rot: 160 }, { kind: "sheep", x: 182, y: 128, rot: 250 }, { kind: "sheep", x: 228, y: 82, rot: 120 }, { kind: "sheep", x: 260, y: 140, rot: 90 }, { label: "A", y: 255, path: [[216, 200]], brake: true }] }),
      "Du kjører på en fylkesvei om sommeren, og en flokk med sau går løs midt i kjørebanen. Velg alle riktige.", "Ты едешь летом по региональной дороге, и посреди проезжей части идёт стадо овец, пасущихся без присмотра. Выбери все верные.", [
      ["Senker farten kraftig og er forberedt på å stoppe helt", "Резко снижаю скорость и готов полностью остановиться", true],
      ["Holder god avstand og lar sauene få tid til å bevege seg unna i eget tempo", "Держу дистанцию и даю овцам самим спокойно уйти с дороги", true],
      ["Tuter kraftig for å jage dem raskt unna veien", "Сильно сигналю, чтобы быстро согнать их с дороги", false, "Kraftig tuting skremmer dyrene og gjør dem uforutsigbare, de kan løpe rett ut i veien eller mot bilen i stedet for å roe seg unna.", "Резкий гудок пугает животных и делает их непредсказуемыми — они могут броситься прямо на дорогу или на машину, вместо того чтобы спокойно уйти."],
      ["Kjører sakte gjennom flokken siden sau uansett flytter seg unna dekkene", "Медленно еду прямо через стадо, ведь овцы всё равно уходят из-под колёс", false, "Sau kan oppføre seg uforutsigbart og løpe feil vei i stedet for å flytte seg unna, det er tryggest å vente til de har gått av veien selv.", "Овцы могут вести себя непредсказуемо и побежать не в ту сторону, а не просто уйти с дороги — безопаснее подождать, пока они сами её освободят."]
    ],
    "Løsgående dyr som sau, geit eller elg kan oppføre seg helt uforutsigbart. Senk farten i god tid, hold avstand, unngå å tute unødig, og vent tålmodig til dyrene har flyttet seg unna av seg selv.",
    "Свободно пасущиеся животные — овцы, козы, лоси — могут вести себя совершенно непредсказуемо. Заранее снижай скорость, держи дистанцию, не сигналь без нужды и терпеливо жди, пока животные сами не уйдут с дороги.",
    "С животными на дороге торопиться нельзя — она их территория в этот момент, а не твоя."),

    q("064", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east", kind: "truck" }] }),
      "Kryss uten skilt. En lastebil kommer fra venstre. Hva gjør du?",
      "Перекрёсток без знаков. Грузовик едет слева. Что делаешь?",
      [
        ["Kjører videre, lastebilen fra venstre har vikeplikt for deg", "Еду дальше — у грузовика слева обязанность уступить мне"],
        ["Stopper og vinker lastebilen fram, fordi den er stor og tung", "Останавливаюсь и машу грузовику проехать первым — он большой и тяжёлый", "Størrelsen på kjøretøyet avgjør ikke vikeplikten, det er høyreregelen som gjelder: fra venstre skal den andre vike.", "Размер машины не влияет на то, кто уступает — решает правило правой руки: тот, кто слева, должен уступить."],
        ["Vurderer at tunge kjøretøy alltid har forkjørsrett i kryss", "Решаю, что тяжёлый транспорт всегда имеет преимущество на перекрёстке", "Det finnes ingen regel om at tunge kjøretøy alltid har forkjørsrett, vikeplikten følger av skilt eller høyreregelen.", "Общего правила «тяжёлый транспорт всегда главный» нет — приоритет определяют знаки или правило правой руки."],
        ["Senker farten kraftig og lar lastebilen bestemme hvem som kjører først", "Резко сбрасываю скорость и даю грузовику самому решить, кто поедет первым", "Når du har forkjørsrett, skal du kjøre normalt videre i stedet for å skape usikkerhet for den andre føreren.", "Когда преимущество у тебя, нужно ехать как обычно, а не создавать неразбериху нерешительностью."]
      ],
      "Uten skilt gjelder høyreregelen: du skal vike for kjøretøy som kommer fra høyre, mens et kjøretøy fra venstre skal vike for deg, uansett hvor stort det er.",
      "Без знаков действует правило правой руки: ты уступаешь тем, кто едет справа, а тем, кто едет слева, уступаешь не ты — независимо от размера машины.",
      "Главное — с какой стороны едет другой, а не какой он величины."),

    q("065", scene({ you: { from: "south", to: "north" }, roundabout: true }),
      "Du skal ta andre avkjøring (rett fram) i rundkjøringen. Når blinker du til høyre?",
      "Тебе нужен второй съезд с круга (прямо). Когда включаешь правый поворотник?",
      [
        ["Når jeg har passert avkjøringen før min, rett før jeg skal ut", "Когда проехал съезд перед своим — прямо перед выездом"],
        ["Med en gang jeg kjører inn i rundkjøringen", "Сразу при въезде на круг", "Blinker du høyre allerede ved innkjøring, tror de som venter ved første avkjøring at du skal ut der.", "Если включить правый уже на въезде, те, кто ждёт у первого съезда, решат, что ты выезжаешь там."],
        ["Jeg trenger ikke blinke når jeg kjører rett fram", "Не нужно включать, раз еду прямо", "Du skal alltid gi tegn til høyre før du forlater rundkjøringen, også når du skal rett fram.", "Перед выездом с круга правый поворотник включают всегда, даже если едешь прямо."],
        ["Jeg blinker venstre hele veien rundt", "Всю дорогу по кругу мигаю левым", "Venstre blinklys brukes ved innkjøring bare når du skal langt rundt, og aldri når du skal ut.", "Левый включают на въезде, только если едешь далеко по кругу, и никогда — при выезде."]
      ],
      "Skal du ut i første avkjøring, blinker du høyre allerede før innkjøringen. Skal du lenger, blinker du høyre når du har passert avkjøringen før din, slik at andre ser hvor du skal ut.",
      "Если нужен первый съезд — правый поворотник включаешь ещё до въезда. Если дальше — после того, как проехал съезд перед своим, чтобы остальные видели, где ты выедешь.",
      "Первый съезд — правый сразу; дальше — правый после предыдущего съезда."),

    q("066", street({ features: [{ type: "sideRoad", y: 110, side: "right", yield: true }, { type: "sign", kind: "yield", x: 262, y: 66, size: 24 }, { type: "sign", kind: "priority", y: 284, size: 24 }], actors: [{ label: "B", x: 316, y: 95, rot: 270, color: "#e0483a", path: [[236, 95]] }, { label: "A", y: 250, path: [[216, 140]] }] }),
      "Du kjører på en vei med forkjørsrett. En bil fra sideveien til høyre ser ikke ut til å bremse, og kan kjøre rett ut foran deg. Hva gjør du, selv om du formelt har forkjørsrett?",
      "Ты едешь по дороге с преимуществом. Машина с боковой дороги справа не тормозит и может выехать прямо перед тобой. Что делаешь, хотя формально преимущество у тебя?",
      [
        ["Senker farten og er klar til å bremse, selv om jeg har forkjørsrett", "Снижаю скорость и готов тормозить, хотя у меня формальное преимущество"],
        ["Fortsetter i samme fart, fordi jeg har forkjørsrett og den andre må stoppe", "Еду в том же темпе — у меня преимущество, пусть он тормозит", "Å stole blindt på forkjørsretten når den andre bilen tydelig ikke bremser, kan føre til en unngåelig ulykke. Forkjørsrett fritar deg ikke for aktsomhetsplikten.", "Слепо полагаться на формальное преимущество, когда другая машина явно не тормозит, может привести к ДТП. Преимущество не снимает обязанности быть внимательным."],
        ["Tuter kraftig og kjører forbi i høy fart for å komme unna", "Сильно сигналю и проезжаю на высокой скорости, чтобы проскочить", "Høy fart øker faren hvis den andre bilen likevel kjører ut, og gir deg mindre tid til å reagere.", "Высокая скорость увеличивает риск, если машина всё же выедет, и оставляет меньше времени на реакцию."],
        ["Svinger brått ut i motsatt kjørefelt for å unngå kollisjon", "Резко ухожу на встречную полосу, чтобы избежать столкновения", "Brå svingning over i møtende kjørefelt kan skape en ny, enda farligere kollisjon med møtende trafikk.", "Резкий уход на встречную полосу может привести к новой, ещё более опасной аварии со встречным транспортом."]
      ],
      "Forkjørsrett gir deg ikke beskyttelse mot en ulykke, du har alltid plikt til å kjøre aktsomt. Ser du at en annen fører ikke ser ut til å overholde sin vikeplikt, skal du senke farten og være klar til å bremse.",
      "Формальное преимущество не защищает от аварии — ты всегда обязан быть внимательным. Если видишь, что другой водитель не собирается уступать, снижай скорость и будь готов затормозить.",
      "Право проезда — не щит. Лучше затормозить, чем доказывать, кто был прав."),

    q("067", street({ sides: { left: "grass", right: "grass" }, actors: [{ kind: "bike", x: 225, y: 104, label: "S", path: [[225, 50]] }, { label: "B", y: 160, x: 200, color: "#e0483a", blink: "left", path: [[188, 116], [188, 40]] }, { label: "A", y: 250, path: [[216, 214]] }] }),
      "Bilen foran deg (B) har lagt seg ut til venstre med blinklys for å kjøre forbi en syklist. Du kjører rett bak B. Hva gjør du?",
      "Машина впереди (B) сместилась влево с поворотником, чтобы обогнать велосипедиста. Ты едешь прямо за B. Что делаешь?",
      [
        ["Holder avstand og venter til B er ferdig med forbikjøringen før jeg vurderer min egen", "Держу дистанцию и жду, пока B закончит обгон, прежде чем думать о своём"],
        ["Kjører forbi både B og syklisten samtidig i én bevegelse", "Обгоняю сразу и B, и велосипедиста одним манёвром", "Å kjøre forbi to kjøretøy samtidig gir deg mye dårligere oversikt og margin, og er svært farlig hvis noe uventet skjer.", "Обгон сразу двух участников одним манёвром резко снижает обзор и запас безопасности — это очень опасно при любой неожиданности."],
        ["Ligger tett bak B for å få bedre fart til egen forbikjøring etterpå", "Прижимаюсь к B вплотную, чтобы разогнаться для своего обгона", "Kort avstand bak en bil som kjører forbi gir deg mindre tid til å reagere hvis B må bremse eller avbryte forbikjøringen.", "Короткая дистанция за обгоняющей машиной оставляет меньше времени на реакцию, если B придётся тормозить или прервать обгон."],
        ["Tuter for å få B til å skynde seg forbi syklisten", "Сигналю, чтобы B поторопился с обгоном велосипедиста", "Tuting for å presse en annen fører til å skynde seg under forbikjøring øker faren og kan gi en hastig, dårlig vurdert manøver.", "Сигналить, чтобы поторопить другого водителя во время обгона, опасно — это может привести к поспешному и необдуманному манёвру."]
      ],
      "Når bilen foran deg kjører forbi noen, holder du avstand og venter til manøveren er ferdig før du planlegger din egen forbikjøring.",
      "Когда машина впереди кого-то обгоняет, держи дистанцию и жди, пока манёвр завершится, прежде чем планировать свой собственный обгон.",
      "Два обгона разом — это не экономия времени, а риск."),

    q("068", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "busStop", y: 110, side: "right" }], actors: [{ kind: "bus", x: 216, y: 110, label: "B", color: "#f5b800", blink: "hazard", brake: true }, { kind: "child", x: 246, y: 104, rot: 0, color: "#22a06b" }, { kind: "child", x: 190, y: 66, rot: 270, color: "#f08c1a", walk: [170, 66] }, { label: "A", y: 255, path: [[216, 190]] }] }),
      "En skolebuss har stoppet med blinkende varsellys ved en holdeplass uten fortau. Du nærmer deg bakfra. Hva bør du spesielt tenke på?",
      "Школьный автобус остановился с мигающими аварийками на остановке без тротуара. Ты подъезжаешь сзади. На что обратить особое внимание?",
      [
        ["Senker farten kraftig, siden barn kan løpe ut fra foran eller bak bussen uten å se seg for", "Сильно снижаю скорость — дети могут выбежать из-за автобуса, не посмотрев по сторонам"],
        ["Kjører forbi i vanlig fart, siden bussen uansett har stoppet helt", "Еду в обычном темпе — автобус же полностью остановился", "At bussen har stoppet, sier ingenting om hvor barna beveger seg, faren for at et barn løper ut i veien er like stor.", "Остановка автобуса никак не говорит о том, куда побегут дети — риск, что ребёнок выскочит на дорогу, остаётся высоким."],
        ["Tuter for å varsle barna om at jeg kommer", "Сигналю, чтобы предупредить детей о своём приближении", "Tuting skremmer og forvirrer barn mer enn det hjelper, lav fart og god oppmerksomhet er tryggere.", "Сигнал скорее пугает и путает детей, чем помогает — надёжнее низкая скорость и внимательность."],
        ["Kjører forbi på den siden der det er mest plass, uten å senke farten", "Проезжаю с той стороны, где больше места, не снижая скорость", "Å prioritere god plass fremfor lav fart hjelper ikke hvis et barn plutselig løper ut, farten er det viktigste du kan justere.", "Думать о запасе места важнее скорости не поможет, если ребёнок внезапно выбежит — главное именно снизить скорость."]
      ],
      "Barn er uforutsigbare og kan løpe ut i veien uten å se seg for, spesielt rundt en skolebuss. Senk farten kraftig og vær klar til å stoppe til bussen har kjørt videre og barna er i sikkerhet.",
      "Дети непредсказуемы и могут выбежать на дорогу, не посмотрев по сторонам, особенно у школьного автобуса. Сильно снижай скорость и будь готов остановиться, пока автобус не уедет, а дети не окажутся в безопасности.",
      "Школьный автобус с мигалками — сигнал «рядом дети», а не просто препятствие на дороге."),

    q("069", scene({ you: { from: "south", to: "north" }, lights: { south: "yellow" } }),
      "Lyset skifter fra grønt til gult akkurat idet du nærmer deg stopplinjen, og du kan fortsatt stoppe trygt og rolig. Hva gjør du?",
      "Свет меняется с зелёного на жёлтый прямо когда ты подъезжаешь к стоп-линии, и ты ещё можешь спокойно и безопасно остановиться. Что делаешь?",
      [
        ["Stopper rolig ved stopplinjen", "Спокойно останавливаюсь у стоп-линии"],
        ["Gir gass og kjører raskt gjennom krysset før det blir rødt", "Жму на газ и быстро проезжаю перекрёсток, пока не стало красным", "Når du fortsatt kan stoppe trygt, skal du stoppe. Å gi gass for å rekke gult øker faren og er ofte det som fører til kjøring på rødt.", "Если ты ещё можешь спокойно остановиться, нужно остановиться. Газ в пол ради жёлтого увеличивает риск и часто превращается в проезд на красный."],
        ["Fortsetter i samme fart, siden gult bare er en advarsel uten betydning for hva jeg skal gjøre", "Еду в том же темпе — жёлтый просто предупреждение, ни на что не влияющее", "Gult betyr at du skal stoppe hvis det er mulig på en trygg måte, det er ikke bare en advarsel uten betydning.", "Жёлтый значит «остановись, если можешь сделать это безопасно» — это не просто предупреждение без последствий."],
        ["Bremser brått midt i krysset for å være føre var", "Резко торможу прямо на перекрёстке на всякий случай", "Brå bremsing midt i krysset er farligere enn å fullføre kjøringen gjennom, vurderingen skal gjøres før krysset, ikke inni det.", "Резкое торможение прямо на перекрёстке опаснее, чем доехать до конца, — решение нужно принимать до перекрёстка, а не на нём."]
      ],
      "Gult lys betyr at du skal stoppe dersom du kan gjøre det på en trygg og kontrollert måte. Kan du ikke stoppe trygt, fullfører du kjøringen gjennom i stedet for å bråbremse.",
      "Жёлтый свет значит: остановись, если можешь сделать это безопасно и спокойно. Если безопасно остановиться уже нельзя — доезжай до конца, а не тормози резко.",
      "Если успеваешь безопасно затормозить — тормози. Жёлтый — не разрешение проехать, а последний шанс остановиться."),

    q("070", SK.illus("medicine"),
      "Du har fått et reseptbelagt legemiddel som har en rød varseltrekant på pakningen, og kjenner deg trøtt etter å ha tatt det. Kan du kjøre bil?",
      "Тебе выписали рецептурное лекарство, на упаковке — красный предупреждающий треугольник, и после приёма тебя клонит в сон. Можно ли садиться за руль?",
      [
        ["Nei, kjøreevnen kan være nedsatt selv om legemidlet er lovlig og foreskrevet av lege", "Нет — способность управлять машиной может быть снижена, даже если лекарство законное и выписано врачом"],
        ["Ja, siden legemidlet er foreskrevet av lege og dermed alltid lovlig å kjøre med", "Да, лекарство выписано врачом, значит с ним всегда можно за руль", "At et legemiddel er foreskrevet og lovlig å bruke, betyr ikke at det er trygt å kjøre når det faktisk påvirker kjøreevnen din.", "То, что лекарство выписано и его приём законен, не означает, что безопасно садиться за руль, если оно реально влияет на твои способности."],
        ["Ja, varseltrekanten gjelder bare for maskiner på jobb, ikke for bilkjøring", "Да, треугольник касается только работы с техникой, не вождения", "Varseltrekanten på legemidler advarer nettopp mot bilkjøring og annen aktivitet som krever årvåkenhet.", "Предупреждающий треугольник на лекарствах как раз предупреждает об опасности вождения и другой деятельности, требующей внимания."],
        ["Ja, så lenge du ikke har drukket alkohol i tillegg", "Да, если вдобавок не пил алкоголь", "Fravær av alkohol endrer ikke på at legemidlet alene kan nedsette kjøreevnen din, det er selve påvirkningen som avgjør.", "Отсутствие алкоголя не меняет того, что само лекарство может снижать способность управлять машиной — важно само состояние, а не алкоголь."]
      ],
      "Det er forbudt å kjøre når kjøreevnen er nedsatt, uansett årsak, legemidler inkludert. Rød varseltrekant på pakningen advarer om at legemidlet kan påvirke kjøreevnen, og du må selv vurdere om du er i stand til å kjøre trygt.",
      "Садиться за руль с ослабленной способностью управлять машиной запрещено независимо от причины, включая лекарства. Красный треугольник на упаковке — прямое предупреждение, что лекарство может повлиять на вождение, и тебе нужно самому оценить, можешь ли ты безопасно ехать.",
      "Треугольник на упаковке — не формальность, а прямой сигнал: сегодня за руль не стоит."),

    qm("m07", scene({ you: { from: "south", to: "north" }, roundabout: true, others: [{ from: "west", to: "south" }] }),
      "Du skal inn i en rundkjøring. Velg alle riktige.", "Ты въезжаешь в круговое движение. Выбери все верные.", [
      ["Du viker for trafikk som allerede er inne i rundkjøringen", "Уступаешь тем, кто уже едет по кругу", true],
      ["Syklister i rundkjøringen kan sykle enten i kjørefeltet eller på eget sykkelfelt rundt, avhengig av hvordan rundkjøringen er bygd", "Велосипедисты в круге могут ехать либо в полосе движения, либо по отдельной велополосе вокруг — зависит от устройства круга", true],
      ["Du trenger normalt ikke å blinke venstre ved innkjøring hvis du skal rett fram", "Обычно не нужно включать левый поворотник при въезде, если едешь прямо", true],
      ["Du har alltid forkjørsrett over biler som allerede sirkulerer i rundkjøringen", "У тебя всегда преимущество перед машинами, уже едущими по кругу", false, "Det er tvert imot: trafikken inne i rundkjøringen har forkjørsrett, de som skal inn har vikeplikt.", "На самом деле наоборот: преимущество у тех, кто уже в круге, а въезжающие обязаны уступить."]
    ],
    "I en rundkjøring har trafikken som allerede sirkulerer forkjørsrett, de som skal inn har vikeplikt. Ved innkjøring trenger du normalt ikke blinke dersom du skal rett fram, mens syklister avhengig av utforming kan sykle i selve rundkjøringen eller på eget sykkelfelt rundt den.",
    "В круге преимущество у тех, кто уже едет по кольцу, въезжающие уступают. При въезде обычно не сигналят поворотником, если едешь прямо, а велосипедисты в зависимости от устройства круга могут ехать прямо по кругу или по отдельной велополосе вокруг него.",
    "Главное правило круга: кто внутри — тот главный."),

    q("071", scene({ you: { from: "south", to: "north" }, signs: { south: "stop" } }),
      "Du kommer til et kryss med stoppskilt. Vegen til høyre og venstre ser helt tom ut så langt du kan se. Hva gjør du?",
      "Подъезжаешь к перекрёстку со знаком «Stopp». Дорога слева и справа выглядит совсем пустой, насколько видно. Что делаешь?",
      [
        ["Stopper helt ved stopplinjen, selv om vegen ser tom ut, og kjører videre når det er klart", "Полностью останавливаюсь у стоп-линии, даже если дорога выглядит пустой, и еду дальше, когда убедился, что чисто"],
        ["Senker bare farten og kjører videre siden jeg ikke ser noen biler", "Просто снижаю скорость и еду дальше, раз машин не видно", "Stoppskilt krever full stopp ved stopplinjen uansett om vegen virker klar, det er ikke nok å senke farten.", "Знак «Stopp» требует полной остановки у стоп-линии независимо от того, кажется ли дорога свободной — просто притормозить недостаточно."],
        ["Stopper midt i krysset for å se bedre til begge sider", "Останавливаюсь посреди перекрёстка, чтобы лучше осмотреться по сторонам", "Du skal stoppe ved stopplinjen før krysset, ikke inni krysset der du er i vegen for annen trafikk.", "Останавливаться нужно у стоп-линии перед перекрёстком, а не внутри него, где ты мешаешь другому движению."],
        ["Stopper bare hvis det er andre kjøretøy synlig i krysset", "Останавливаюсь только если в перекрёстке видны другие машины", "Plikten til å stoppe ved stoppskilt gjelder alltid, den er ikke avhengig av om du ser andre kjøretøy der og da.", "Обязанность остановиться у знака «Stopp» действует всегда, она не зависит от того, видишь ли ты в этот момент другие машины."]
      ],
      "Stoppskilt (skilt 204) krever at du stopper helt ved stopplinjen hver gang, uavhengig av om vegen ser tom ut. Du kjører videre først når du har forsikret deg om at det er trygt.",
      "Знак «Stopp» (знак 204) требует полной остановки у стоп-линии каждый раз, независимо от того, насколько пустой выглядит дорога. Ехать дальше можно только убедившись, что это безопасно.",
      "«Stopp» значит именно стоп, а не «притормози, если что»."),

    q("072", street({ sides: { left: "grass", right: "grass" }, actors: [{ kind: "horse", x: 238, y: 96, rider: "#20324d" }, { kind: "horse", x: 238, y: 150, rider: "#8e5bd6" }, { label: "A", y: 258, path: [[216, 222]] }], tags: [{ text: "RYTTERE", x: 300, y: 60 }] }),
      "Du kjører forbi noen ryttere på hest langs vegkanten. Hestene ser urolige ut. Hva bør du gjøre?",
      "Ты обгоняешь всадников на лошадях у края дороги. Лошади выглядят беспокойными. Что тебе следует сделать?",
      [
        ["Senker farten kraftig, holder god avstand og kjører forbi i rolig tempo", "Сильно снижаю скорость, держу хорошую дистанцию и обгоняю в спокойном темпе"],
        ["Tuter kort for å varsle rytterne om at jeg kommer", "Коротко сигналю, чтобы предупредить всадников о своём приближении", "Lydsignal kan skremme hesten enda mer og gjøre situasjonen farligere, ikke tryggere.", "Звуковой сигнал может ещё сильнее испугать лошадь и сделать ситуацию опаснее, а не безопаснее."],
        ["Kjører forbi i vanlig fart siden hest og rytter har samme plikter som andre trafikanter", "Обгоняю на обычной скорости — у всадника те же обязанности, что у других участников движения", "Selv om rytteren følger vanlige regler, er hester levende dyr som kan reagere uforutsigbart, derfor må du ta ekstra hensyn.", "Хотя всадник следует общим правилам, лошадь — живое животное, которое может реагировать непредсказуемо, поэтому нужна дополнительная осторожность."],
        ["Stopper helt og venter til rytterne har forlatt vegen", "Полностью останавливаюсь и жду, пока всадники не покинут дорогу", "En full stopp er ikke nødvendig og kan virke uventet for hesten, lav fart med god avstand er vanligvis nok.", "Полная остановка не нужна и может быть неожиданной для лошади — обычно достаточно низкой скорости и хорошей дистанции."]
      ],
      "Hester kan bli skremt av biler, lyd og fart. Vis ekstra hensyn ved å senke farten tydelig og holde god avstand når du kjører forbi ryttere.",
      "Лошади могут испугаться машин, звука и скорости. Проявляй особую осторожность: заметно снижай скорость и держи хорошую дистанцию, обгоняя всадников.",
      "Лошадь — не машина с правилами, а живое существо: главное — медленно и без резких сигналов."),

    q("073", street({ sides: { left: "snow", right: "snow" }, weather: "snow", features: [{ type: "sign", kind: "chains", y: 214, size: 28, under: "A0430-additional-trucks" }], actors: [{ label: "A", y: 250, path: [[216, 170]] }, { kind: "truck", lane: "left", y: 70, color: "#8a949e", label: false }], tags: [{ text: "FJELLOVERGANG", x: 92, y: 40 }] }),
      "Du skal kjøre over et fjellovergang om vinteren der det er skiltet kjettingpåbud for tunge kjøretøy. Du kjører personbil med gode vinterdekk uten kjetting. Gjelder påbudet for deg?",
      "Ты едешь через горный перевал зимой, где установлен знак об обязательных цепях противоскольжения для тяжёлых машин. Ты на легковой машине с хорошими зимними шинами без цепей. Касается ли тебя этот запрет?",
      [
        ["Nei, kjettingpåbudet gjelder som regel bare tunge kjøretøy, men jeg bør likevel kjøre etter forholdene", "Нет, требование цепей обычно касается только тяжёлых машин, но мне всё равно нужно ехать по обстановке"],
        ["Ja, kjettingpåbud gjelder alle kjøretøy uten unntak når det er skiltet", "Да, требование цепей касается всех машин без исключений, если есть знак", "Skiltet kjettingpåbud retter seg normalt mot tunge kjøretøy, personbiler er vanligvis ikke omfattet selv om skiltet står der.", "Знак об обязательных цепях обычно адресован тяжёлым машинам, легковые обычно не подпадают под него, даже если знак стоит."],
        ["Nei, og da kan jeg kjøre i vanlig fart som på sommeren", "Нет, и значит я могу ехать в обычном летнем темпе", "At påbudet ikke gjelder deg, betyr ikke at vegen er trygg å kjøre i sommerfart, du må uansett tilpasse farten til vinterforholdene.", "То, что запрет не касается тебя, не значит, что по дороге можно ехать в летнем темпе — скорость всё равно нужно подстраивать под зимние условия."],
        ["Ja, men bare hvis jeg kjører med tilhenger", "Да, но только если я еду с прицепом", "Kjettingpåbudet avhenger av kjøretøyets vekt og type, ikke av om du trekker tilhenger eller ikke.", "Требование цепей зависит от веса и типа машины, а не от того, едешь ли ты с прицепом."]
      ],
      "Kjettingpåbud på fjelloverganger gjelder normalt tunge kjøretøy som lastebil og buss, ikke vanlige personbiler. Du må likevel alltid kjøre etter kjøreforholdene, uansett skilt.",
      "Требование цепей противоскольжения на горных перевалах обычно касается тяжёлых машин — грузовиков и автобусов, а не обычных легковых. Но скорость всё равно нужно подстраивать под дорожные условия, независимо от знака.",
      "Знак с цепями — это почти всегда про грузовики и автобусы, а не про твою легковушку."),

    q("074", street({ laneW: 34, features: [{ type: "sideRoad", y: 90, side: "right", w: 56 }, { type: "bikeLane", side: "right", gap: [62, 118] }], actors: [{ label: "A", x: 210, y: 210, blink: "right", path: [[210, 130], [250, 104], [340, 104]] }, { kind: "scooter", x: 227, y: 268, label: "B", path: [[227, 200], [227, 20]] }] }),
      "Du skal svinge til høyre over et sykkelfelt. En elsparkesykkel kommer bakfra i sykkelfeltet og skal rett fram. Hvem har vikeplikt?",
      "Тебе нужно повернуть направо через велополосу. Сзади по велополосе едет электросамокат, ему прямо. Кто уступает?",
      [
        ["Jeg har vikeplikt for elsparkesykkelen, siden den kjører rett fram i sykkelfeltet", "Уступаю я — электросамокат едет прямо по велополосе"],
        ["Elsparkesykkelen har vikeplikt for meg siden den er mindre enn en bil", "Уступает электросамокат — он меньше машины", "Størrelsen på kjøretøyet avgjør ikke vikeplikten, det avgjørende er at føreren som svinger skal vike for den som kjører rett fram.", "Размер транспортного средства не определяет, кто уступает — важно то, что поворачивающий уступает едущему прямо."],
        ["Ingen har vikeplikt, vi må bare avpasse farten etter hverandre", "Никто не уступает, просто подстраиваем скорость друг под друга", "Her gjelder en klar vikepliktregel, det er ikke en situasjon der dere bare skal avpasse farten uten en avklart vikeplikt.", "Здесь действует чёткое правило уступки, это не ситуация, где просто подстраивают скорость без определённого приоритета."],
        ["Elsparkesykkelen må stoppe helt siden den kjører i sykkelfeltet", "Электросамокат обязан полностью остановиться, потому что едет по велополосе", "Den som kjører rett fram i sykkelfeltet trenger ikke stoppe, det er bilen som svinger som skal vike og eventuelt stoppe.", "Тому, кто едет прямо по велополосе, останавливаться не нужно — уступить и при необходимости остановиться должна поворачивающая машина."]
      ],
      "Når du svinger over et sykkelfelt, har du vikeplikt for syklister og førere av liten elektrisk motorvogn som skal rett fram, også dem som kommer bakfra (trafikkreglene § 7 nr 3).",
      "Когда поворачиваешь через велополосу, ты уступаешь велосипедистам и электросамокатам, которые едут прямо, в том числе догоняющим сзади (trafikkreglene § 7 nr 3).",
      "Поворачиваешь через велополосу — уступаешь всем, кто едет по ней прямо, будь то велосипед или самокат."),

    q("075", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "lowSun" }], actors: [{ label: "A", y: 240, path: [[216, 170]] }, { kind: "car", lane: "left", y: 60, label: false, color: "#8e5bd6" }] }),
      "Du kjører rett mot en lav sol som gjør det nesten umulig å se vegen tydelig. Hva bør du gjøre?",
      "Ты едешь прямо навстречу низкому солнцу, которое почти не даёт разглядеть дорогу. Что тебе следует сделать?",
      [
        ["Senker farten, bruker solskjerm/solbriller og er forberedt på å stoppe om nødvendig", "Снижаю скорость, использую солнцезащитный козырёк или очки и готов остановиться, если понадобится"],
        ["Kjører som vanlig siden lav sol ikke regnes som et trafikkfarlig forhold", "Еду как обычно — низкое солнце не считается опасным дорожным фактором", "Lav sol kan blende like mye som mørke eller tåke og må tas like seriøst, det er ikke et ufarlig forhold.", "Низкое солнце может слепить не меньше, чем темнота или туман, и к нему нужно относиться так же серьёзно — это не безобидный фактор."],
        ["Blinker med fjernlys for å varsle møtende om at jeg nesten ikke ser", "Мигаю дальним светом, чтобы предупредить встречных, что почти не вижу дорогу", "Fjernlys mot møtende i dagslys gir ikke bedre sikt for deg og kan virke forvirrende eller unødig for andre.", "Дальний свет встречным днём не улучшает твою видимость и может только сбить с толку или быть неуместным для других."],
        ["Lukker øynene et kort øyeblikk for å unngå å bli blendet", "На короткое время закрываю глаза, чтобы не слепило", "Å kjøre med lukkede øyne, selv et kort øyeblikk, gjør at du ikke ser vegen i det hele tatt og er svært farlig.", "Вождение с закрытыми глазами, даже на мгновение, означает, что ты вообще не видишь дорогу — это очень опасно."]
      ],
      "Lav sol kan blende like mye som mørke. Senk farten, bruk solskjerm eller solbriller, og vær forberedt på å stoppe dersom du ikke ser vegen tydelig.",
      "Низкое солнце может слепить не хуже темноты. Снижай скорость, используй козырёк или очки и будь готов остановиться, если дорогу не видно чётко.",
      "Если солнце слепит так, что дороги не видно, — это сигнал притормозить, а не зажмуриться."),

    q("076", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, actors: [{ label: "A", lane: 1, y: 100, trailer: "caravan", trailerRot: 16, sway: true }], tags: [{ text: "TILHENGEREN SLINGRER", x: 92, y: 40 }] }),
      "Du kjører med tilhenger på motorveg i høy fart, og tilhengeren begynner å slingre fra side til side. Hva gjør du?",
      "Ты едешь с прицепом по автомагистрали на высокой скорости, и прицеп начинает раскачиваться из стороны в сторону. Что делаешь?",
      [
        ["Slipper gassen rolig og lar farten synke gradvis, uten å bremse brått eller styre mye", "Плавно отпускаю газ и даю скорости снизиться постепенно, не тормозя резко и не крутя руль"],
        ["Bremser hardt med en gang for å få kontroll før det blir verre", "Сразу резко торможу, чтобы взять ситуацию под контроль, пока не стало хуже", "Hard bremsing ved slingring kan forsterke svingningene og gjøre at du mister kontrollen helt.", "Резкое торможение при раскачивании может усилить колебания и привести к полной потере контроля."],
        ["Øker farten litt for å stramme opp koblingen mellom bil og henger", "Слегка увеличиваю скорость, чтобы «подтянуть» сцепку между машиной и прицепом", "Høyere fart forsterker slingringen i stedet for å dempe den, det er stikk i strid med hva som hjelper her.", "Увеличение скорости усиливает раскачивание, а не гасит его, — это прямо противоположно тому, что нужно делать."],
        ["Styrer kraftig mot siden hengeren svinger for å rette den opp", "Резко выворачиваю руль в сторону, куда качнулся прицеп, чтобы его выровнять", "Kraftig motstyring forsterker ofte slingringen videre, det beste er å styre minimalt og la farten synke.", "Резкое противоруление часто только усиливает раскачивание дальше, лучше минимально работать рулём и дать скорости упасть."]
      ],
      "Ved slingring skal du slippe gassen rolig og la farten synke gradvis, uten å bremse hardt eller styre mye. Brå inngrep forsterker som regel slingringen.",
      "При раскачивании прицепа нужно плавно отпустить газ и дать скорости снижаться постепенно, не тормозя резко и не делая резких движений рулём. Резкие действия обычно только усиливают раскачивание.",
      "Прицеп закачало — газ отпускаем плавно, руки спокойные, резких движений нет."),

    q("077", street({ features: [{ type: "zebra", y: 120 }], actors: [{ kind: "patrol", x: 238, y: 104, rot: 270 }, { kind: "child", x: 222, y: 122, rot: 270, color: "#f08c1a", walk: [204, 122] }, { kind: "child", x: 236, y: 132, rot: 270, color: "#22a06b" }, { label: "A", y: 245, path: [[216, 175]], brake: true }] }),
      "En skolepatrulje står ved et gangfelt og hjelper barn over vegen. Barna er på vei ut i gangfeltet. Hva gjør du?",
      "У перехода стоит школьный патруль и помогает детям перейти дорогу. Дети выходят на переход. Что делаешь?",
      [
        ["Stopper og lar barna gå over, og kjører først når gangfeltet er fritt", "Останавливаюсь, пропускаю детей и еду, только когда переход свободен"],
        ["Kjører videre, skolepatruljen er ikke politi", "Еду дальше — школьный патруль не полиция", "Du har vikeplikt for gående som er på vei ut i gangfeltet (§ 9 nr 2), og ved skolepatrulje skal du holde særlig liten fart og stanse om nødvendig (§ 13 nr 2 b).", "Ты уступаешь пешеходам, которые выходят на переход (§ 9 nr 2), а у школьного патруля обязан ехать особенно медленно и при необходимости остановиться (§ 13 nr 2 b)."],
        ["Senker bare farten og kjører forsiktig forbi barna", "Только сбавляю скорость и осторожно проезжаю мимо детей", "Barna er på vei ut i gangfeltet. Da skal du stanse og la dem gå over, ikke kjøre forbi.", "Дети выходят на переход — нужно остановиться и пропустить их, а не проезжать мимо."],
        ["Blinker med lysene så patruljen skynder seg", "Мигаю фарами, чтобы патруль поторопился", "Lyssignal brukt for å presse andre er unødig bruk og forbudt (§ 14 nr 1).", "Световой сигнал, чтобы поторопить других, — ненужное использование, оно запрещено (§ 14 nr 1)."]
      ],
      "Trafikkreglene § 13 nr 2 b: ved passering av skolepatrulje skal du holde særlig liten fart og om nødvendig stanse. § 9 nr 2: du har vikeplikt for gående som er i eller på vei ut i gangfeltet. Skolepatruljen dirigerer barna, ikke bilene.",
      "Trafikkreglene § 13 nr 2 b: проезжая мимо школьного патруля, едешь особенно медленно и при необходимости останавливаешься. § 9 nr 2: ты уступаешь пешеходам на переходе и тем, кто на него выходит. Патруль управляет детьми, а не машинами.",
      "Патруль — не регулировщик, но дети на переходе — значит, ты стоишь."),

    qm("m08", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "off" }, { type: "sign", kind: "rest", x: 300, y: 150, size: 28 }, { type: "tag", text: "RASTEPLASS / BENSIN", x: 320, y: 40 }], actors: [{ label: "A", lane: 1, y: 256, path: [[216, 200]] }] }), "Du kjenner at du blir svært trøtt mens du kjører på motorveg. Velg alle riktige.", "Ты чувствуешь, что сильно устаёшь за рулём на автомагистрали. Выбери все верные.", [
      ["Stopper på en rasteplass eller bensinstasjon for å hvile", "Останавливаюсь на площадке отдыха или заправке, чтобы отдохнуть", true],
      ["Lufter ut bilen og tar en kort pause med en kopp kaffe hvis det hjelper", "Проветриваю машину и делаю короткую паузу, возможно с чашкой кофе, если это помогает", true],
      ["Tar en kort powerlur (10–20 minutter) hvis jeg kan stoppe trygt", "Делаю короткий сон (10–20 минут), если могу безопасно остановиться", true],
      ["Skrur opp musikken og åpner vinduet, det er like bra som å stoppe", "Включаю музыку громче и открываю окно — это не хуже, чем остановиться", false, "Musikk og åpent vindu kan virke oppkvikkende et kort øyeblikk, men det hindrer ikke mikrosøvn, bare en pause eller søvn hjelper reelt.", "Музыка и открытое окно могут ненадолго взбодрить, но не предотвращают микросон — реально помогает только остановка и отдых или сон."]
    ],
    "Ved sterk trøtthet hjelper bare en reell pause: stopp og hvil, eventuelt en kort powerlur. Kaffe og lufting kan være et tillegg, men musikk og vind alene stopper ikke mikrosøvn.",
    "При сильной усталости реально помогает только настоящая остановка и отдых, возможно короткий сон. Кофе и свежий воздух могут быть дополнением, но музыка и ветер сами по себе микросон не остановят.",
    "Если клонит в сон за рулём, единственное надёжное лекарство — остановиться, а не громче музыка."),

    q("078", street({ laneW: 24, center: "none", sides: { left: "snow", right: "snow" }, weather: "snow", features: [{ type: "passingPlace", y: 205 }], actors: [{ label: "A", y: 268, path: [[212, 240]] }, { label: "B", lane: "left", y: 70, color: "#e0483a", path: [[188, 140]] }] }),
      "Vinteren har lagt høye brøytekanter langs begge sider av en smal vei, og det er en møteplass (utvidelse) på din side. En møtende bil (B) har allerede begynt å kjøre inn på den smale, innsnevrede delen av veien forover. Hva gjør du?",
      "Зимой вдоль узкой дороги намело высокие снежные брустверы, и на твоей стороне есть разъезд (møteplass). Встречная машина (B) уже начала въезжать на суженный из-за снега участок впереди. Что делаешь?",
      [
        ["Kjører inn på møteplassen på min side og venter til B har passert den smale delen", "Заезжаю в разъезд на своей стороне и жду, пока B проедет суженный участок"],
        ["Fortsetter rett fram i vanlig fart, siden jeg kom til møteplassen først", "Продолжаю ехать в обычном темпе — я подъехал к разъезду первым", "Det avgjør ikke hvem som kom først. Møteplassen er på din side, og B er allerede inne på den smale strekningen, så det er du som skal bruke møteplassen og vente.", "Кто первый приехал — не важно. Разъезд на твоей стороне, а B уже въехал на узкий участок, поэтому именно тебе нужно заехать в разъезд и подождать."],
        ["Blinker med lysene for å signalisere at B skal rygge tilbake", "Мигаю фарами, чтобы заставить B сдать назад", "Lyssignal for å presse en annen fører til å rygge er unødig bruk av lys og løser ikke situasjonen, det er du som har møteplassen og bør vike.", "Мигать фарами, чтобы заставить другого водителя сдать назад, — ненужное использование света и не решает ситуацию: разъезд на твоей стороне, значит уступать тебе."],
        ["Kjører forbi B i det innsnevrede partiet, vi klemmer oss forbi hverandre", "Проезжаю мимо B прямо в сужении — как-нибудь протиснемся", "Brøytekantene gjør veien smalere enn vanlig, å tvinge begge bilene gjennom samtidig der øker risikoen for kollisjon eller fastkjøring i snøen.", "Снежные брустверы делают дорогу уже обычного, пытаться протиснуть обе машины там одновременно увеличивает риск столкновения или застревания в снегу."]
      ],
      "Om vinteren gjør brøytekantene smale veger enda smalere. Kjørende som møtes, skal i god tid vike til høyre og om nødvendig stanse. Den som har møteplassen på sin side, bruker den og venter, uansett hvem som kom først.",
      "Зимой снежные брустверы делают узкие дороги ещё уже. Встречные водители должны заранее принять вправо и при необходимости остановиться. Тот, у кого разъезд на его стороне, заезжает в него и ждёт — неважно, кто подъехал первым.",
      "Разъезд на твоей стороне — значит, ждёшь ты. Снег это правило не меняет, только делает дорогу уже."),

    q("079", street({ features: [{ type: "driveway", y: 150, side: "right", label: "P", lines: true }], actors: [{ label: "A", x: 296, y: 158, rot: 270, path: [[248, 158]] }, { label: "B", y: 262, color: "#e0483a", path: [[216, 196]] }, { label: "C", lane: "left", y: 44, color: "#22a06b", path: [[184, 110]] }] }),
      "Du kjører ut fra en parkeringsplass ved et kjøpesenter og skal ut på hovedveien. Bil B kommer fra venstre i nærmeste kjørefelt, og bil C kommer fra høyre i det andre kjørefeltet. Hvem har vikeplikt?",
      "Ты выезжаешь с парковки у торгового центра на главную дорогу. Машина B едет слева по ближней полосе, а машина C — справа по дальней. Кто уступает?",
      [
        ["Jeg har vikeplikt for både B og C, uansett hvilken retning de kommer fra", "Уступаю я — и B, и C, независимо от того, с какой стороны они едут"],
        ["Bare for B, siden C er lengst unna og i det andre kjørefeltet", "Только B, потому что C дальше и едет по другой полосе", "Utkjøring fra en parkeringsplass gir vikeplikt for all trafikk på vegen du kjører ut på, uavhengig av avstand eller kjørefelt.", "Выезд с парковки означает уступить всему транспорту на дороге, куда ты выезжаешь, независимо от дистанции или полосы."],
        ["Ingen, siden høyreregelen avgjør og C kommer fra høyre", "Никому — тут решает правило правой руки, а C едет справа", "Høyreregelen gjelder ikke ved utkjøring fra parkeringsplass, der har du alltid vikeplikt for trafikken på vegen, uansett side.", "При выезде с парковки правило правой руки не действует — там ты всегда уступаешь транспорту на дороге, с какой бы стороны он ни ехал."],
        ["Bare hvis B eller C blinker med lysene", "Только если B или C мигнут фарами", "Vikeplikten din ved utkjøring fra parkeringsplass gjelder uansett om de andre bilene gir et lyssignal eller ikke.", "Твоя обязанность уступить при выезде с парковки действует независимо от того, подают ли другие машины световой сигнал."]
      ],
      "Utkjøring fra en parkeringsplass, gårdsveg, bensinstasjon eller lignende sted gir alltid vikeplikt for trafikken på vegen du kjører ut på, uansett hvilken retning den kommer fra.",
      "Выезд с парковки, двора, заправки и подобных мест всегда означает уступить движению на дороге, куда ты выезжаешь, независимо от того, с какой стороны оно едет.",
      "Выезжаешь «не с дороги» на дорогу — уступаешь всем, кто уже на ней, слева и справа."),

    q("080", scene({ you: { from: "south", to: "north", lane: "right" }, roundabout: true, lanes: 2, others: [{ from: "south", to: "west", lane: "left", entering: true, dist: 104, label: "B", blink: "left" }] }),
      "Du kjører inn i en rundkjøring med to felt og skal ta andre avkjøring, rett fram. Hvilket felt bør du som regel velge inn i rundkjøringen?",
      "Ты въезжаешь в круговое движение с двумя полосами и должен взять второй съезд, то есть проехать прямо. Какую полосу обычно нужно выбрать при въезде?",
      [
        ["Det høyre feltet, siden jeg skal ut relativt tidlig og ikke langt rundt", "Правую полосу, потому что съезжаю относительно рано и не еду далеко по кругу"],
        ["Det venstre feltet, fordi jeg skal rett fram og ikke til høyre", "Левую полосу, потому что я еду прямо, а не направо", "Venstre felt brukes når du skal langt rundt eller til venstre, ikke når du bare skal rett fram ved andre avkjøring.", "Левая полоса нужна, когда едешь далеко вокруг или налево, а не когда просто проезжаешь прямо на втором съезде."],
        ["Det er likegyldig hvilket felt jeg velger, så lenge jeg blinker riktig", "Не важно, какую полосу выбрать, главное — правильно включить поворотник", "Feltvalget har betydning for hvordan du beveger deg trygt gjennom rundkjøringen og ut, det er ikke likegyldig selv med riktig blinklys.", "Выбор полосы важен для безопасного движения по кругу и выезда — это не всё равно, даже если поворотник включён правильно."],
        ["Det felt som har minst trafikk i øyeblikket, uavhengig av hvilken avkjøring jeg skal ta", "Полосу, где в данный момент меньше машин, независимо от того, какой съезд мне нужен", "Hvilket felt du skal velge, avgjøres av hvor langt du skal rundt, ikke av hvor mye trafikk det er i feltet akkurat da.", "Нужную полосу определяет то, насколько далеко ты едешь по кругу, а не то, где в данный момент меньше машин."]
      ],
      "I en rundkjøring med to felt bruker du som regel høyre felt når du skal ta en av de første avkjøringene (rett fram eller tidligere), og venstre felt når du skal langt rundt eller til venstre. Følg likevel oppmerking og skilt der de finnes.",
      "В круговом движении с двумя полосами обычно используют правую полосу для одного из первых съездов (прямо или раньше), а левую — когда едешь далеко по кругу или налево. Но всегда следуй разметке и знакам, если они есть.",
      "Едешь недалеко по кругу — держись правой полосы; едешь далеко или налево — левой."),

    q("081", street({ sides: { left: "none", right: "none" }, features: [{ type: "inTunnel", exit: 70, lay: 200 }], actors: [{ label: "A", x: 224, y: 200, smoke: true, blink: "hazard" }, { kind: "adult", x: 250, y: 150, rot: 0, color: "#6b4fa0", walk: [262, 90] }], tags: [{ text: "NØDUTGANG", x: 320, y: 40 }] }),
      "Du kjører i en lang tunnel, og bilen din tar plutselig fyr. Hva er riktig fremgangsmåte?",
      "Ты едешь по длинному тоннелю, и в машине внезапно начинается пожар. Как правильно действовать?",
      [
        ["Kjører bilen ut av tunnelen hvis det fortsatt er mulig, ellers kjører jeg helt til siden, slår av motoren, går ut og beveger meg til nærmeste nødutgang mens jeg varsler nødetatene", "Если ещё возможно, выезжаю на машине из тоннеля; если нет — съезжаю максимально к краю, выключаю двигатель, выхожу и иду к ближайшему эвакуационному выходу, вызывая спасателей"],
        ["Blir sittende i bilen med dørene låst til brannvesenet kommer", "Остаюсь в машине с заблокированными дверями, пока не приедут пожарные", "Å bli sittende i en brennende bil i en tunnel er livsfarlig, du skal komme deg ut og bort fra bilen så raskt som trygt mulig.", "Оставаться в горящей машине в тоннеле опасно для жизни — нужно как можно быстрее безопасно выйти и отойти от машины."],
        ["Snur bilen og kjører tilbake mot møtende kjøreretning for å komme ut raskere", "Разворачиваюсь и еду назад против движения, чтобы быстрее выехать", "Å snu og kjøre mot kjøreretningen i en tunnel skaper stor fare for kollisjon med andre bilister og er ikke tillatt.", "Разворачиваться и ехать против движения в тоннеле создаёт большую опасность столкновения с другими машинами и запрещено."],
        ["Prøver først å slukke brannen selv før jeg varsler noen", "Сначала пытаюсь сам потушить пожар, прежде чем кого-то вызывать", "Du skal varsle nødetatene og komme deg i sikkerhet først, å bruke tid på selv å slukke en bilbrann kan koste liv.", "Сначала нужно вызвать спасателей и обеспечить свою безопасность — тратить время на самостоятельное тушение пожара в машине может стоить жизни."]
      ],
      "Ved brann i tunnel skal du om mulig kjøre bilen ut. Går ikke det, kjør helt til siden, slå av motoren, kom deg ut av bilen og gå til nærmeste nødutgang eller sikkert sted, og varsle nødetatene så raskt som mulig.",
      "При пожаре в тоннеле нужно, если возможно, выехать из него на машине. Если нет — съехать максимально к краю, выключить двигатель, выйти из машины и дойти до ближайшего эвакуационного выхода или безопасного места, как можно быстрее вызвав спасателей.",
      "В тоннеле при пожаре: если можешь — выезжай; если нет — к краю, мотор выключил, сам к выходу, и звонок спасателям."),

    q("082", SK.hill({ dir: "up", edge: "curb", wheels: "straight" }),
      "Du parkerer i en bakke der bilen peker oppover, og det er fortauskant (kantstein) på høyre side av veien. Hvordan bør du vri forhjulene?",
      "Ты паркуешься на подъёме, машина смотрит вверх по склону, и справа есть бордюр. Как нужно повернуть передние колёса?",
      [
        ["Vrir forhjulene bort fra kantsteinen, slik at bilen ruller bakover mot kantsteinen og blir stoppet av den hvis den skulle trille", "Поворачиваю колёса в сторону от бордюра, чтобы при скатывании назад машина покатилась к бордюру и была остановлена им"],
        ["Vrir forhjulene inn mot kantsteinen, akkurat som i en bakke uten fortauskant", "Поворачиваю колёса к бордюру — как на подъёме без бордюра", "I en bakke MED fortauskant skal hjulene vris bort fra kanten i oppoverbakke, ikke mot den, slik at bilen uansett trygt stoppes av kanten hvis den triller.", "На подъёме С бордюром колёса поворачивают от бордюра, а не к нему — тогда, если машина скатится, бордюр её безопасно остановит."],
        ["Lar forhjulene stå rett fram, siden håndbrekket uansett holder bilen", "Оставляю колёса прямо — ручник всё равно удержит машину", "Håndbrekk og gir skal alltid brukes i tillegg, men hjulvinkelen er en ekstra sikring hvis bremsene likevel skulle svikte.", "Ручник и передача должны использоваться всегда в дополнение, но угол поворота колёс — это дополнительная страховка на случай, если тормоза всё же откажут."],
        ["Vrir forhjulene bort fra kantsteinen uansett om bilen peker oppover eller nedover bakken", "Поворачиваю колёса от бордюра независимо от того, смотрит машина вверх или вниз по склону", "Riktig hjulvinkel avhenger av om bilen peker oppover eller nedover og om det finnes fortauskant, det er ikke samme svar i alle bakker.", "Правильный угол поворота колёс зависит от того, смотрит машина вверх или вниз по склону и есть ли бордюр — ответ не одинаковый для всех случаев."]
      ],
      "Parkerer du i oppoverbakke med fortauskant, vrir du forhjulene bort fra kantsteinen. Da vil bilen, hvis den triller bakover, bli stoppet av kantsteinen. Bruk alltid håndbrekk og legg i gir eller parkeringsposisjon i tillegg.",
      "Если паркуешься на подъёме с бордюром, поворачивай передние колёса в сторону от бордюра. Тогда, если машина покатится назад, бордюр её остановит. Обязательно дополнительно используй ручник и передачу или паркинг.",
      "Подъём + бордюр — колёса от бордюра. Спуск без бордюра — колёса в сторону кювета/края."),

    q("083", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "roadwork", lane: 1, from: 30, to: 140 }, { type: "light", y: 196, state: "red" }, { type: "stopLine", y: 210 }], actors: [{ kind: "worker", x: 266, y: 150, rot: 180, wave: true }, { label: "A", y: 255, path: [[216, 226]] }], tags: [{ text: "MIDLERTIDIG LYS", x: 320, y: 214 }, { text: "VEGARBEIDER", x: 316, y: 126 }] }),
      "Ved et vegarbeid viser det midlertidige lyssignalet rødt for deg. En vegarbeider som dirigerer trafikken, står ved siden av lyset og vinker deg tydelig fram. Hva gjelder?",
      "На дорожных работах временный светофор показывает тебе красный. Рядом со светофором стоит рабочий, который регулирует движение, и чётко машет тебе: проезжай. Что действует?",
      [
        ["Jeg følger dirigentens signal, siden anvisninger fra en person som regulerer trafikken går foran lyssignal og skilt", "Следую сигналу регулировщика — указания человека, направляющего движение, важнее светофора и знаков"],
        ["Jeg stopper for det røde lyset, siden lyssignal alltid går foran andre anvisninger", "Останавливаюсь на красный — светофор всегда важнее других указаний", "Det er motsatt: anvisning fra en person som dirigerer trafikken, for eksempel ved vegarbeid, går foran både lyssignal og skilt.", "Наоборот: указание человека, регулирующего движение, например на дорожных работах, важнее и светофора, и знаков."],
        ["Jeg velger selv om jeg vil følge dirigenten eller lyset, etter hva som virker tryggest", "Сам решаю, следовать за регулировщиком или за светофором — как кажется безопаснее", "Det er ikke et fritt valg, rangordningen er fast: dirigentens anvisning går foran det provisoriske lyssignalet.", "Это не свободный выбор — порядок приоритета фиксированный: указание регулировщика важнее временного светофора."],
        ["Jeg venter til både lyset er grønt og dirigenten vinker, for sikkerhets skyld", "Жду, пока и светофор станет зелёным, и регулировщик махнёт, — на всякий случай", "Dirigenten styrer trafikken på stedet akkurat nå. Blir du stående, kan du sperre for kø eller for trafikken dirigenten slipper fram. Følg dirigentens tegn.", "Регулировщик управляет движением прямо сейчас. Если стоять, можно перекрыть путь колонне или тем, кого он пропускает. Следуй его сигналу."]
      ],
      "Anvisninger fra en person som dirigerer trafikken, for eksempel ved vegarbeid, går foran både lyssignal, skilt og vegoppmerking. Følg alltid dirigentens tegn først.",
      "Указания человека, регулирующего движение, например на дорожных работах, важнее и светофора, и знаков, и разметки. Всегда сначала следуй сигналам регулировщика.",
      "Живой человек с жестом главнее любого светофора и знака."),

    qm("m09", street({ features: [{ type: "sign", kind: "children", y: 262, size: 28 }], actors: [{ kind: "child", x: 244, y: 110, rot: 180, color: "#f08c1a" }, { kind: "child", x: 150, y: 140, rot: 0, color: "#22a06b" }, { label: "A", y: 230, path: [[216, 160]] }], tags: [{ text: "SKOLE", x: 92, y: 64 }, { text: "BARNEHAGE", x: 312, y: 40 }] }), "Du kjører forbi et trekantet varselskilt med symbolet for barn, nær en skole og en barnehage. Velg alle riktige.", "Ты проезжаешь мимо треугольного предупреждающего знака с силуэтом детей, рядом со школой и детским садом. Выбери все верные.", [
      ["Senker farten og er forberedt på at barn kan komme ut i vegen uventet", "Снижаю скорость и готов к тому, что ребёнок может неожиданно выбежать на дорогу", true],
      ["Er spesielt oppmerksom i tidsrom med mye gange til og fra skolen", "Особенно внимателен в часы, когда много детей идёт в школу и из неё", true],
      ["Holder god avstand til fortau og vegkant der barn kan oppholde seg", "Держу бо́льшую дистанцию от тротуара и края дороги, где могут быть дети", true],
      ["Kjører i vanlig fart siden skiltet bare er en generell påminnelse uten praktisk betydning", "Еду в обычном темпе — знак ведь просто формальное напоминание без практического значения", false, "Skiltet varsler en konkret økt risiko for at barn dukker opp i vegen, det er ikke bare en formell påminnelse uten betydning for farten din.", "Знак предупреждает о реальном повышенном риске появления детей на дороге — это не просто формальное напоминание, которое не должно влиять на твою скорость."]
    ],
    "Et varselskilt med barn varsler at du kjører forbi et sted, som en skole eller barnehage, der barn ofte beveger seg nær vegen. Senk farten, vær ekstra oppmerksom og hold avstand til fortau og vegkant.",
    "Предупреждающий знак с детьми говорит о том, что ты проезжаешь место — школу или детский сад — где дети часто находятся рядом с дорогой. Снижай скорость, будь особенно внимателен и держи дистанцию от тротуара и края дороги.",
    "Знак с детьми — это не формальность: тут реально могут выбежать на дорогу."),

    q("085", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "off" }, { type: "tag", text: "AVKJØRING", x: 320, y: 40 }], actors: [{ label: "A", lane: 1, y: 256, blink: "right", path: [[216, 220], [247, 150], [262, 40]] }, { label: "B", lane: 0, y: 150, color: "#8e5bd6", path: [[184, 60]] }] }),
      "Du skal ta neste avkjøring fra motorveien. Når bør du redusere farten din?",
      "Тебе нужно съехать с автомагистрали на следующем съезде. Когда нужно снижать скорость?",
      [
        ["Først etter at jeg har kommet inn i selve fartsreduksjonsfeltet (avkjøringsfeltet), ikke mens jeg fortsatt er i de vanlige kjørefeltene", "Только после того, как я уже въехал в саму полосу торможения (съездную полосу), а не пока я ещё в основных полосах"],
        ["Så tidlig som mulig, allerede et par hundre meter før avkjøringen, mens jeg fortsatt er i det vanlige kjørefeltet", "Как можно раньше, за пару сотен метров до съезда, ещё находясь в обычной полосе", "Å bremse ned i det ordinære kjørefeltet på motorveien skaper fare for trafikken bak deg, farten skal reduseres inne i avkjøringsfeltet.", "Снижать скорость в обычной полосе на магистрали создаёт опасность для машин позади — тормозить нужно именно внутри съездной полосы."],
        ["Rett før avkjøringsskiltet, uansett om jeg er i avkjøringsfeltet eller ikke", "Прямо перед знаком съезда, независимо от того, в съездной я полосе или нет", "Det avgjørende er ikke skiltet, men om du allerede har flyttet deg inn i avkjøringsfeltet der fartsreduksjon er trygt.", "Важно не само появление знака, а то, перешёл ли ты уже в съездную полосу, где тормозить безопасно."],
        ["Det er ikke nødvendig å redusere farten før jeg er helt ute av motorveien og på den nye vegen", "Снижать скорость не нужно, пока я не полностью съехал с магистрали на новую дорогу", "Avkjøringsfeltet er nettopp laget for at du skal redusere farten gradvis før du kommer ut på den nye vegen, å vente til du er helt av motorveien er for sent og farlig.", "Съездная полоса специально сделана для того, чтобы постепенно сбросить скорость до выезда на новую дорогу — ждать полного выезда с магистрали поздно и опасно."]
      ],
      "Du skal holde samme fart som trafikken på motorveien til du er inne i avkjøringsfeltet, og redusere farten der. Å bremse i de ordinære kjørefeltene tvinger trafikken bak deg til brå oppbremsing.",
      "Нужно держать скорость потока на магистрали, пока не окажешься в самой съездной полосе, и снижать скорость уже там. Торможение в обычных полосах вынуждает машины позади резко тормозить.",
      "Тормози только внутри съездной полосы — она для этого и сделана."),

    q("086", scene({ you: { from: "south", to: "north", lane: "right", dist: 104 }, roundabout: true, lanes: 2, others: [{ from: "south", to: "north", lane: "left", kind: "truck", entering: true, dist: 92, label: "B" }] }),
      "Du kjører inn i en rundkjøring. Et vogntog i feltet til venstre for deg skal ta samme avkjøring og svinger bredt for å få plass. Hva gjør du?",
      "Ты въезжаешь в круговое движение. Фура в полосе слева от тебя едет на тот же съезд и забирает широко, чтобы хватило места на повороте. Что делаешь?",
      [
        ["Jeg holder tilbake og lar vogntoget få plassen det trenger til å svinge, i stedet for å presse meg forbi", "Придерживаю и даю фуре место, которое ей нужно для поворота, а не пытаюсь проскочить рядом"],
        ["Jeg legger meg tett opp til vogntoget på innsiden, siden jeg har like mye rett til feltet som det", "Прижимаюсь к фуре с внутренней стороны — у меня такое же право на полосу, как у неё", "Et vogntog må svinge bredt for å få plass til henger eller kasse, og kan ikke se eller ta hensyn til en bil som ligger tett innpå i blindsonen.", "Фура должна поворачивать широко, чтобы прицеп или кузов прошли, и просто не видит и не может учесть машину, которая прижалась рядом в слепой зоне."],
        ["Jeg kjører fort forbi vogntoget før det får svingt bredt, siden jeg kom inn i rundkjøringen samtidig", "Проскакиваю мимо фуры, пока она не успела забрать широко — мы ведь въехали в круг одновременно", "Å presse forbi et kjøretøy som trenger bredere svingradius er farlig, uansett hvem som kom inn i rundkjøringen først.", "Пытаться проскочить мимо транспорта, которому нужен широкий радиус поворота, опасно — независимо от того, кто первым въехал в круг."],
        ["Jeg stopper helt i rundkjøringen og venter til vogntoget har kjørt helt ut", "Полностью останавливаюсь в кругу и жду, пока фура не выедет совсем", "Å stoppe midt i rundkjøringen er ikke nødvendig og skaper fare for trafikken bak deg, det er nok å holde avstand og la vogntoget svinge.", "Останавливаться прямо в кругу не нужно и опасно для машин позади — достаточно держать дистанцию и дать фуре повернуть."]
      ],
      "Store kjøretøy som vogntog må ofte svinge bredt, også inn mot ditt kjørefelt, for å få plass til henger eller kasse. Hold avstand og gi dem rom, press deg aldri inn på innsiden.",
      "Большим машинам вроде фур часто приходится забирать широко, даже заезжая в твою полосу, чтобы прицеп или кузов прошли поворот. Держи дистанцию и дай им место, не лезь внутрь.",
      "Фура поворачивает широко — держись дальше, не пытайся проскочить рядом."),

    q("087", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "south" }], signs: { east: "yield" } }),
      "Du nærmer deg et kryss uten skilt for din egen retning. Bilen fra sidevegen har skilt Vikeplikt. Den senker farten, men du er ikke sikker på om føreren har sett deg. Hva gjør du?",
      "Ты подъезжаешь к перекрёстку — у твоей стороны нет знака. У машины с боковой дороги знак «Уступи дорогу». Она снижает скорость, но ты не уверен, что водитель тебя заметил. Что делаешь?",
      [
        ["Jeg fortsetter i normal fart, men holder øye med bilen og er klar til å bremse hvis den likevel kjører ut", "Еду дальше в обычном темпе, но слежу за машиной и готов затормозить, если она всё-таки выедет"],
        ["Jeg bremser kraftig ned til gangfart, siden jeg uansett ikke kan være sikker på at den andre bilen venter", "Резко торможу почти до шага — я ведь не могу быть уверен, что машина подождёт", "Du har forkjørsrett her og skal holde normal fart, ikke bremse ned som om du selv hadde vikeplikt, det skaper unødig usikkerhet for trafikken bak deg.", "У тебя здесь приоритет, и нужно ехать в обычном темпе, а не тормозить, как будто уступаешь ты сам — это создаёт лишнюю неопределённость для машин позади."],
        ["Jeg stopper helt opp for sikkerhets skyld, selv om det er jeg som har forkjørsrett", "Полностью останавливаюсь на всякий случай, хотя приоритет у меня", "Å stoppe helt når du har forkjørsrett er ikke nødvendig og kan forvirre den andre sjåføren om hvem som skal kjøre først.", "Полностью останавливаться, когда приоритет у тебя, не нужно — это может сбить с толку другого водителя насчёт того, кому ехать первым."],
        ["Jeg øker farten for å komme meg forbi krysset før den andre bilen når fram", "Увеличиваю скорость, чтобы проскочить перекрёсток раньше, чем подъедет та машина", "Å øke farten gir deg mindre tid til å reagere hvis den andre bilen likevel kjører ut, det er tryggere å holde jevn fart og være forberedt.", "Увеличение скорости оставляет меньше времени на реакцию, если машина всё-таки выедет — безопаснее держать обычную скорость и быть готовым."]
      ],
      "Forkjørsrett betyr at du kan kjøre videre i normal fart, men den fritar deg ikke for å være oppmerksom. Ved skilt Vikeplikt (202) trenger den andre ikke å stanse helt, men den må la deg passere. Hold blikket på bilen og vær forberedt på å bremse hvis den ikke overholder vikeplikten.",
      "Приоритет означает, что можно ехать дальше в обычном темпе, но это не освобождает от внимательности. У знака «Уступи дорогу» (202) полностью останавливаться не обязательно, но пропустить тебя водитель обязан. Следи за машиной и будь готов притормозить, если она всё же не уступит.",
      "Приоритет — не повод терять внимательность: следи, уступит ли другая машина на самом деле."),

    q("089", street({ lanes: ["up", "up"], sides: { left: "none", right: "none" }, features: [{ type: "inTunnel" }, { type: "ramp", kind: "off" }], actors: [{ label: "A", lane: 1, y: 150, path: [[216, 30]] }], tags: [{ text: "AVKJØRINGEN ER PASSERT", x: 300, y: 270 }] }),
      "Du kjører inn i en lang tunnel og ser etter noen sekunder at du skulle ha tatt en avkjøring du nå har kjørt forbi. Hva gjør du?",
      "Ты въезжаешь в длинный тоннель и через несколько секунд понимаешь, что проехал нужный тебе съезд. Что делаешь?",
      [
        ["Jeg fortsetter i vanlig fart til jeg kommer ut av tunnelen, og finner en ny vei derfra", "Продолжаю ехать в обычном темпе до выезда из тоннеля, а дальше нахожу новый путь"],
        ["Jeg snur bilen midt i tunnelen så snart det er en lomme å bruke", "Разворачиваюсь прямо в тоннеле, как только появляется карман для этого", "Havarilommen er for nødstans, ikke for å vende. Å snu i en tunnel er svært farlig: sikten er dårlig, og den som vender, har vikeplikt for all annen trafikk (§ 11 nr 1).", "Карман — для вынужденной остановки, а не для разворота. Разворачиваться в тоннеле очень опасно: обзор плохой, а тот, кто разворачивается, уступает всем (§ 11 nr 1)."],
        ["Jeg bremser kraftig ned og rygger tilbake til riktig avkjøring", "Резко торможу и сдаю назад до нужного съезда", "Å rygge i en tunnel er livsfarlig: trafikken bak deg regner ikke med det og har ikke tid til å reagere. På motorveg og motortrafikkveg er rygging dessuten forbudt (§ 11 nr 2).", "Сдавать назад в тоннеле смертельно опасно: машины сзади этого не ждут и не успеют среагировать. А на motorveg и motortrafikkveg задний ход вообще запрещён (§ 11 nr 2)."],
        ["Jeg stopper midt i kjørefeltet for å tenke meg om før jeg kjører videre", "Останавливаюсь прямо в полосе, чтобы подумать, прежде чем ехать дальше", "Det er forbudt å stanse i tunnel (trafikkreglene § 17 nr 1 a), bortsett fra nødstans. Du skal kjøre videre til utgangen.", "Останавливаться в тоннеле запрещено (trafikkreglene § 17 nr 1 a), кроме вынужденной остановки. Нужно ехать дальше до выезда."]
      ],
      "Har du kjørt forbi avkjøringen din i en tunnel, fortsetter du i vanlig fart til du kommer ut, og finner en ny vei derfra. Det er forbudt å stanse i tunnel (§ 17 nr 1 a), og å snu eller rygge der er livsfarlig.",
      "Если проехал свой съезд в тоннеле, продолжай ехать в обычном темпе до выезда, а дальше ищи новый путь. Останавливаться в тоннеле запрещено (§ 17 nr 1 a), а разворот или задний ход там смертельно опасны.",
      "Пропустил съезд в тоннеле — просто доезжай до выезда: стоять там нельзя, а разворот и задний ход — смертельный риск."),

    q("090", SK.illus("frost"),
      "Om morgenen er alle rutene på bilen din dekket av rim, bortsett fra en liten flekk på frontruta du har skrapt fri. Kan du kjøre slik?",
      "Утром все стёкла машины покрыты инеем, кроме маленького очищенного пятачка на лобовом стекле. Можно ехать в таком виде?",
      [
        ["Nei, alle ruter må være skrapt fri for rim og is, slik at jeg har fullt sikt til alle sider, før jeg kjører", "Нет, все стёкла нужно очистить от инея и льда, чтобы был полный обзор во все стороны, прежде чем ехать"],
        ["Ja, det er nok at frontruta er delvis fri, siden jeg ser rett fram", "Да, достаточно, что лобовое частично очищено — вперёд ведь я вижу", "En liten flekk gir ikke nok sikt til sidene og i speilene, du må ha fri sikt gjennom hele frontruta og sideruter for å oppdage fotgjengere og annen trafikk.", "Маленький пятачок не даёт обзора по сторонам и в зеркала — нужен свободный обзор через всё лобовое и боковые стёкла, чтобы заметить пешеходов и другие машины."],
        ["Ja, så lenge jeg kjører sakte og forsiktig de første minuttene", "Да, если первые минуты ехать медленно и осторожно", "Lav fart kompenserer ikke for at du ikke ser sidene eller bakover, sikten må være fri uansett hvor sakte du kjører.", "Низкая скорость не заменяет отсутствие обзора по бокам и назад — обзор должен быть чистым независимо от того, насколько медленно едешь."],
        ["Nei, men det er greit å kjøre med vinduet åpent og hodet ut for å se, i stedet for å skrape", "Нет, но можно ехать с открытым окном, высунув голову для обзора, вместо того чтобы чистить стёкла", "Å kjøre med hodet ut av vinduet gir ikke forsvarlig sikt eller kontroll over bilen, ruter skal skrapes fri før du kjører.", "Ехать, высунув голову из окна, не даёт нормального обзора и контроля над машиной — стёкла нужно очистить перед поездкой, а не заменять это таким способом."]
      ],
      "Du har ikke lov til å kjøre før alle ruter, speil og lys er fri for rim, is eller snø, slik at du har full sikt til alle kanter. En liten skrapt flekk er ikke nok.",
      "Нельзя ехать, пока все стёкла, зеркала и фонари не очищены от инея, льда или снега — нужен полный обзор во все стороны. Маленького очищенного пятачка недостаточно.",
      "Инеем покрыты все стёкла — чисти все, а не только «дырочку» для обзора вперёд."),

    q("091", street({ noRoad: true, features: [{ type: "lot" }], actors: [{ label: "A", x: 212, y: 200, rot: 200 }, { label: false, kind: "car", x: 228, y: 252, rot: 180, color: "#8e5bd6" }, { kind: "crash", x: 222, y: 228 }, { kind: "note", x: 228, y: 262 }], tags: [{ text: "INGEN I BILEN", x: 300, y: 286 }] }),
      "Du rygger ut fra en parkeringsplass og kjenner et lite smell. Du ser at du har skrapt opp en parkert bil som står uten fører. Ingen har sett det. Hva er du pliktig til å gjøre?",
      "Ты сдаёшь назад с парковки и чувствуешь лёгкий толчок. Оказывается, ты поцарапал припаркованную машину, в которой никого нет. Никто этого не видел. Что ты обязан сделать?",
      [
        ["Jeg forsøker å finne eieren, og hvis det ikke går, legger jeg igjen en lapp med navn og telefonnummer på bilen eller varsler politiet", "Пытаюсь найти владельца, а если не получается — оставляю на машине записку со своим именем и номером телефона или сообщаю в полицию"],
        ["Jeg kjører videre, siden skaden er liten og ingen har sett det", "Уезжаю — повреждение маленькое, и никто этого не видел", "Skadens størrelse og at ingen har sett det, endrer ikke meldeplikten, du skal forsøke å varsle den skadelidte uansett.", "Размер повреждения и то, что никто не видел, не меняют обязанность сообщить — попытаться уведомить потерпевшего нужно всё равно."],
        ["Jeg venter til eieren kommer tilbake, uansett hvor lenge det tar", "Жду, пока вернётся владелец, сколько бы это ни заняло", "Du har ikke plikt til å vente ubegrenset, det er nok å legge igjen kontaktinformasjon hvis eieren ikke er å finne.", "Нет обязанности ждать бесконечно — достаточно оставить контактные данные, если владельца не найти на месте."],
        ["Jeg ringer bare forsikringsselskapet mitt neste dag, og lar være å gjøre noe ved bilen nå", "Просто звоню в свою страховую на следующий день, а сейчас у машины ничего не делаю", "Å varsle forsikringen senere er ikke nok i seg selv, på stedet skal du forsøke å finne eieren eller legge igjen kontaktinfo.", "Сообщить страховой на следующий день — само по себе не достаточно: на месте нужно попытаться найти владельца или оставить контакты."]
      ],
      "Vegtrafikkloven § 12: har du voldt materiell skade og ingen er til stede for skadelidte, skal du snarest mulig underrette skadelidte eller politiet. I praksis: let etter eieren, ellers legg igjen navn og telefonnummer på bilen eller ring politiet.",
      "Vegtrafikkloven § 12: если ты причинил материальный ущерб, а рядом нет никого со стороны потерпевшего, нужно как можно скорее сообщить потерпевшему или полиции. На практике: поищи владельца, а если не нашёл — оставь на машине имя и телефон или позвони в полицию.",
      "Нет владельца на месте — не значит «можно уехать»: записка с контактами обязательна."),

    q("092", SK.illus("party-glass"),
      "På en fest drikker du et glass du trodde var alkoholfritt, men det viser seg å inneholde litt alkohol. Du kjenner deg helt normal og skal kjøre hjem etter festen. Er det greit å kjøre?",
      "На вечеринке ты выпил стакан, который считал безалкогольным, но оказалось, что в нём немного алкоголя. Ты чувствуешь себя совершенно нормально и собираешься ехать домой после вечеринки. Можно ли садиться за руль?",
      [
        ["Nei, promillegrensen på 0,2 gjelder uansett hvordan jeg kjenner meg, og jeg vet ikke sikkert hvor mye alkohol jeg faktisk har fått i meg", "Нет, предел 0,2 промилле действует независимо от того, как я себя чувствую, а сколько алкоголя я выпил на самом деле — я точно не знаю"],
        ["Ja, siden jeg kjenner meg helt normal og ikke har drukket med vilje", "Да, я ведь чувствую себя совершенно нормально и не пил алкоголь сознательно", "Promillegrensen handler om alkoholmengden i blodet, ikke om hvordan du subjektivt kjenner deg eller om du drakk med vilje.", "Предел по промилле — это про количество алкоголя в крови, а не про то, как ты себя чувствуешь и выпил ли случайно."],
        ["Ja, siden det bare var et glass og ikke mer", "Да, ведь это был всего один стакан, не больше", "Selv en liten mengde alkohol kan være nok til å komme over grensen på 0,2, mengden i et glass sier ikke noe sikkert om promillen din.", "Даже небольшое количество алкоголя может превысить предел 0,2 — объём одного стакана сам по себе ничего не говорит о твоём промилле."],
        ["Ja, så lenge jeg venter en halvtime før jeg kjører", "Да, если подождать полчаса перед тем, как сесть за руль", "En halv time er for lite tid til at kroppen bryter ned alkohol, og uten å vite promillen din kan du ikke være sikker på at du er under grensen.", "Полчаса — слишком мало времени, чтобы организм расщепил алкоголь, и без знания своего промилле нельзя быть уверенным, что ты уложился в предел."]
      ],
      "Promillegrensen i Norge er 0,2, og den gjelder uansett om du kjenner deg påvirket eller ikke, eller om alkoholen var tilsiktet. Når du ikke vet sikkert hvor mye du har fått i deg, bør du ikke kjøre.",
      "Предел промилле в Норвегии — 0,2, и он действует независимо от того, чувствуешь ли ты опьянение, и выпил ли ты случайно. Если точно не знаешь, сколько алкоголя попало в организм — за руль садиться не стоит.",
      "«Чувствую себя нормально» не считается — важен только промилле, а его на глаз не определить."),

    qm("m10", street({ sides: { left: "grass", right: "grass" }, actors: [{ label: "A", y: 90, blink: "hazard" }, { kind: "worker", x: 236, y: 168, rot: 180 }, { kind: "triangle", x: 216, y: 268 }] }), "Bilen din får motorstopp midt på en vanlig vei utenfor tettbygd strøk, og du må gjøre en nødstans i kjørebanen. Velg alle riktige.", "Твоя машина внезапно сломалась прямо на обычной дороге за городом, и тебе нужно сделать вынужденную остановку прямо на проезжей части. Выбери все верные.", [
      ["Jeg setter på nødblinklysene så snart bilen stopper", "Включаю аварийку, как только машина останавливается", true],
      ["Alle som går ut av bilen, tar på seg refleksvest, uansett om det er mørkt eller lyst", "Все, кто выходит из машины, надевают светоотражающий жилет — независимо от времени суток", true],
      ["Jeg setter varseltrekanten i god avstand bak bilen, om mulig minst 150 meter", "Ставлю аварийный треугольник подальше позади машины, по возможности не ближе 150 метров", true],
      ["Refleksvest er bare nødvendig her fordi vi er utenfor tettbygd strøk", "Жилет нужен только потому, что мы за городом", false, "Plikten til å bruke refleksvest ved nødstans gjelder langs alle veier, også inne i tettbygd strøk, ikke bare utenfor.", "Обязанность надевать жилет при вынужденной остановке действует на любой дороге, в том числе в населённом пункте, а не только за городом."]
    ],
    "Ved nødstans setter du på nødblinklys umiddelbart, alle som går ut bruker refleksvest uansett sted, og varseltrekanten settes i god avstand bak bilen, om mulig minst 150 meter.",
    "При вынужденной остановке сразу включи аварийку, все, кто выходит — надевают жилет независимо от места, а треугольник ставится подальше позади машины, по возможности не ближе 150 метров.",
    "Жилет — для всех и везде при nødstans, не только «в чистом поле»."),

    q("093", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }] }),
      "Du skal svinge til venstre i et vanlig kryss uten skilt. En møtende bil (B) kommer rett mot deg og skal rett fram. Hvem har vikeplikt?",
      "Ты поворачиваешь налево на обычном нерегулируемом перекрёстке. Навстречу едет машина (B), которая поедет прямо. Кто уступает?",
      [
        ["Jeg har vikeplikt, en bil som svinger skal vike for møtende som kjører rett fram", "Я уступаю — поворачивающая машина уступает встречной, которая едет прямо"],
        ["B har vikeplikt siden jeg kom til krysset litt før B", "У B уступка, ведь я подъехал к перекрёстку чуть раньше", "Det er ikke avgjørende hvem som kom først, en venstresving skal alltid vike for møtende trafikk som skal rett fram.", "Кто подъехал первым — не имеет значения: при повороте налево ты всегда уступаешь встречной машине, которая едет прямо."],
        ["Ingen har vikeplikt, vi kan begge kjøre samtidig siden vegene er like store", "Никто не уступает, можем проехать одновременно — дороги одинаковые", "Det finnes alltid en vikeplikt når to kjøretøy skal gjennom samme punkt i krysset, her er det du som svinger som må vike.", "В такой ситуации уступка всегда есть: раз два пути пересекаются в одной точке, уступает тот, кто поворачивает, то есть ты."],
        ["B har vikeplikt siden høyreregelen gjelder, og B kommer fra min venstre side", "Уступает B, ведь действует правило правой руки, а B для меня слева", "Høyreregelen gjelder ikke her, dette er møtende trafikk rett fram og sving, ikke kryssende trafikk fra siden.", "Правило правой руки здесь не при делах — это встречная машина, едущая прямо, а не машина, пересекающая с боковой дороги."]
      ],
      "Når du svinger til venstre i et kryss, skal du vike for møtende kjøretøy som kommer rett mot deg og skal rett fram eller svinge til høyre. Dette gjelder uansett hvem som kom til krysset først.",
      "Когда поворачиваешь налево на перекрёстке, ты уступаешь встречной машине, которая едет прямо или поворачивает направо. Это действует независимо от того, кто подъехал к перекрёстку первым.",
      "Поворот налево — ты всегда «подстраиваешься» под того, кто едет прямо навстречу."),

    q("094", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }, { from: "west", to: "east" }] }),
      "Kryss uten skilt. To biler nærmer seg samtidig: en fra høyre (C) og en fra venstre (B), begge skal rett fram. Hvem har du vikeplikt for?",
      "Нерегулируемый перекрёсток. Одновременно подъезжают две машины: одна слева (B), другая справа (C), обе едут прямо. Кому из них ты уступаешь?",
      [
        ["Jeg har bare vikeplikt for C, som kommer fra høyre, høyreregelen gjelder ikke for B som kommer fra venstre", "Я уступаю только C, которая справа — правило правой руки на B слева не действует"],
        ["Jeg har vikeplikt for begge, siden to biler nærmer seg samtidig", "Уступаю обеим — ведь подъезжают сразу две машины", "Høyreregelen avgjør vikeplikten ut fra retning, ikke ut fra hvor mange biler som nærmer seg samtidig, du viker kun for den fra høyre.", "Правило правой руки определяет уступку по стороне, а не по количеству машин вокруг — уступаешь только той, что справа."],
        ["Jeg har bare vikeplikt for B, som kommer fra venstre", "Уступаю только B, которая слева", "Det er motsatt, høyreregelen gir vikeplikt for den som kommer fra høyre (C), ikke fra venstre.", "Наоборот: правило правой руки обязывает уступить той, что справа (C), а не слева."],
        ["Jeg har ikke vikeplikt for noen av dem, siden jeg kom til krysset samtidig med begge", "Не уступаю никому — я подъехал к перекрёстку одновременно с обеими", "Å komme samtidig endrer ikke høyreregelen, den som kommer fra høyre har alltid forkjørsrett i et kryss uten skilt.", "Одновременный подъезд ничего не меняет — у машины справа всегда преимущество на перекрёстке без знаков."]
      ],
      "I et kryss uten skilt gjelder høyreregelen for hver enkelt kjørende for seg: du viker for den som kommer fra din høyre side (C), men B, som kommer fra venstre, må vike for deg. Hva B og C gjør med hverandre, er deres egen sak.",
      "На перекрёстке без знаков правило правой руки действует для каждого отдельно: ты уступаешь той машине, что справа от тебя (C), а B, что слева, уступает тебе. Как разберутся между собой B и C — их личное дело.",
      "Правая рука — только она даёт приоритет. Левая сторона тебе не указ."),

    q("095", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east", kind: "tram", label: "T" }], signs: { south: "priority" }, rails: "ew" }),
      "Du kjører på en forkjørsvei med forkjørsskilt. Fra sideveien til venstre kommer en trikk rett mot krysset. Hvem har vikeplikt?",
      "Ты едешь по главной дороге со знаком приоритета. Слева с боковой улицы к перекрёстку приближается трамвай. Кто уступает?",
      [
        ["Jeg har vikeplikt for trikken, trikk har forrang foran all annen trafikk uansett forkjørsskilt", "Я уступаю трамваю — у трамвая преимущество перед любым транспортом, даже если у меня знак приоритета"],
        ["Trikken har vikeplikt siden jeg kjører på forkjørsvei", "Уступает трамвай, ведь я на главной дороге", "Forkjørsskiltet gjelder for vanlige kjøretøy fra sidevegen. For trikk gjelder § 10 nr 2: alle skal gi den fri veg, også på forkjørsveg.", "Знак приоритета действует для обычных машин с боковой дороги. Для трамвая действует § 10 nr 2: ему уступают все, даже на главной дороге."],
        ["Ingen av oss har vikeplikt, trikken må følge vanlige vikepliktregler som biler", "Никто не уступает — трамвай подчиняется тем же правилам, что и машины", "Trikk følger egne regler og har forrang foran alle andre kjøretøy, det er ikke samme regel som for biler.", "У трамвая свои правила — он имеет приоритет перед всеми, это не те же правила, что у машин."],
        ["Jeg har bare vikeplikt for trikken hvis den ringer med klokken sin", "Уступаю трамваю только если он звонит в звонок", "Trikkens forrang gjelder uansett om den varsler med lyd eller ikke, det er ingen slik betingelse.", "Преимущество трамвая действует независимо от того, подаёт он звуковой сигнал или нет — такого условия нет."]
      ],
      "Trafikkreglene § 10 nr 2: trafikant skal gi fri veg og om nødvendig stanse for sporvogn og jernbanetog. Det gjelder også når du kjører på forkjørsveg: skiltet gir deg forrang bare foran vanlige kjøretøy fra sidevegene. (Står det trafikklys i krysset, følger alle lyset.)",
      "Trafikkreglene § 10 nr 2: трамваю и поезду нужно уступить дорогу и при необходимости остановиться. Это действует и на главной дороге: знак приоритета даёт преимущество только перед обычными машинами с боковых дорог. (Если на перекрёстке светофор — все едут по светофору.)",
      "Трамваю уступают все — даже если у тебя знак главной дороги."),

    q("096", street({ features: [{ type: "rail", y: 150, barriers: "up", lights: "off" }], actors: [{ kind: "car", y: 110, color: "#8e5bd6", label: false, brake: true }, { kind: "car", y: 62, color: "#e0483a", label: false, brake: true }, { kind: "car", y: 14, color: "#22a06b", label: false, brake: true }, { label: "A", y: 250, path: [[216, 205]] }], tags: [{ text: "KØ", x: 270, y: 60 }] }),
      "Du nærmer deg en planovergang. Bommene er oppe, og lyset blinker ikke. Det står en bilkø på andre siden, og det er usikkert om det er plass til bilen din helt over skinnene. Hva gjør du?",
      "Ты подъезжаешь к железнодорожному переезду. Шлагбаумы подняты, сигнал не мигает. За переездом стоит очередь машин, и непонятно, хватит ли места, чтобы твоя машина полностью проехала за рельсы. Что делаешь?",
      [
        ["Jeg stopper før overgangen og venter til det er plass nok til å kjøre helt over skinnene uten å stanse på dem", "Останавливаюсь перед переездом и жду, пока не будет места проехать полностью за рельсы без остановки на них"],
        ["Jeg kjører fram og stopper med bilen delvis på skinnene, siden lyset ikke blinker og det ikke kommer noe tog", "Проезжаю вперёд и останавливаюсь частично на рельсах — сигнал не мигает, поезда нет", "Du skal aldri stanse med bilen på selve skinnegangen. Bommene kan gå ned når som helst, og da står du fast i sporet.", "Нельзя останавливаться прямо на рельсах никогда. Шлагбаумы могут опуститься в любой момент, и машина окажется запертой на путях."],
        ["Jeg følger tett bak bilen foran, så presser jeg meg over sammen med køen", "Держусь близко к машине впереди и проезжаю вместе с очередью", "Å følge tett på andre uten å sjekke om det er plass for din egen bil, kan føre til at du blir stående fast på skinnene.", "Если просто жаться к другим и не проверить, хватит ли места именно твоей машине, можно застрять прямо на рельсах."],
        ["Jeg kjører inn på overgangen, køen begynner sikkert å rulle før et tog kommer", "Въезжаю на переезд — очередь наверняка тронется раньше, чем подойдёт поезд", "Du kan ikke vite når neste tog kommer. Kjør aldri inn på planovergangen før det er plass til hele bilen på andre siden.", "Ты не знаешь, когда придёт следующий поезд. Не въезжай на переезд, пока на той стороне нет места для всей машины."]
      ],
      "Du skal aldri kjøre inn på en planovergang hvis du ikke er sikker på at det er plass til bilen din helt på den andre siden. Å bli stående fast på skinnene er svært farlig, selv om det ikke kommer tog akkurat nå. Blinker det rødt eller går bommene ned, skal du alltid stanse.",
      "Нельзя выезжать на переезд, если нет уверенности, что хватит места проехать полностью на другую сторону. Застрять прямо на рельсах крайне опасно, даже если поезда в этот момент нет. А если мигает красный или опускаются шлагбаумы — останавливаться нужно всегда.",
      "Правило простое: не видишь свободного места за переездом — не въезжаешь, очередь или нет."),

    q("097", street({ lanes: ["down", "up", "up"], sides: { left: "walk", right: "walk" }, features: [{ type: "roadwork", lane: 2, from: 10, to: 110 }], actors: [{ label: "B", x: 200, y: 150, color: "#e0483a", path: [[200, 60]] }, { label: "A", x: 232, y: 220, blink: "left", path: [[232, 170], [204, 128], [204, 40]] }, { kind: "car", x: 200, y: 262, color: "#22a06b", label: false }] }),
      "Et kjørefelt er stengt på grunn av vegarbeid, og kjeglene tvinger trafikken til å flette sammen til ett felt. Du kjører i feltet som blir stengt. Hva er riktig fremgangsmåte?",
      "Из-за дорожных работ одна полоса закрыта, конусы заставляют поток слиться в одну полосу. Ты едешь по закрывающейся полосе. Как правильно поступить?",
      [
        ["Jeg blinker, tilpasser farten og fletter inn vekselvis med bilene i det åpne feltet der feltene går sammen", "Включаю поворотник, подстраиваю скорость и встраиваюсь поочерёдно с машинами из открытой полосы там, где полосы сливаются"],
        ["Jeg har vikeplikt for alle i det åpne feltet og må vente til det er helt tomt før jeg kjører inn", "Я обязан уступить всем в открытой полосе и должен ждать, пока она полностью не опустеет", "Når antallet kjørefelt reduseres, gjelder ikke den vanlige vikeplikten ved feltskifte (§ 8 nr 1). Farten skal tilpasses gjensidig, så bilene kjører inn vekselvis.", "Когда число полос сокращается, обычная обязанность уступать при перестроении не действует (§ 8 nr 1). Скорость подстраивают обе стороны, и машины встраиваются поочерёдно."],
        ["Jeg stopper helt og venter på at en annen bil skal vinke meg inn i det åpne feltet", "Полностью останавливаюсь и жду, когда другая машина махнёт мне, пропуская в открытую полосу", "Du skal ikke stoppe i kjørefeltet og vente på et tegn. Tilpass farten mens du kjører, og flett inn vekselvis.", "Не нужно останавливаться в полосе и ждать знака. Подстрой скорость на ходу и встраивайся поочерёдно."],
        ["Jeg øker farten for å komme forbi flest mulig biler før feltet stenger helt", "Увеличиваю скорость, чтобы обогнать как можно больше машин, пока полоса не закрылась окончательно", "Å øke farten for å kjøre forbi andre øker risikoen for kollisjon ved selve sammenflettingen. Farten skal tilpasses trafikken i det andre feltet.", "Разгон, чтобы обогнать других перед слиянием, повышает риск столкновения в самом месте сужения. Скорость нужно подстраивать под соседнюю полосу."]
      ],
      "Trafikkreglene § 8 nr 1: når antallet kjørefelt i samme retning reduseres, gjelder ikke vikeplikten ved feltskifte. Farten skal gjensidig tilpasses slik at de kjørende vekselvis kan fortsette (glidelåsprinsippet). I kø bruker man begge feltene helt fram til der de går sammen.",
      "Trafikkreglene § 8 nr 1: когда число полос в одном направлении сокращается, обязанность уступать при перестроении не действует. Обе стороны подстраивают скорость так, чтобы машины проезжали поочерёдно («молния», glidelåsprinsippet). В пробке обе полосы используют до самого места слияния.",
      "Сужение полосы — это «молния»: по одной машине из каждой полосы, а не «кто раньше втиснулся»."),

    q("098", street({ features: [{ type: "sideRoad", y: 120, side: "right", w: 44 }], actors: [{ kind: "arrow", pts: [[240, 100], [266, 120], [334, 122]], color: "#1f63e0", opts: { dash: "7 6" } }, { label: "A", x: 214, y: 48, trailer: "caravan", trailerRot: -55, steer: -26 }, { kind: "adult", x: 300, y: 152, rot: 270, color: "#22a06b", wave: true }], tags: [{ text: "MEDHJELPER", x: 314, y: 180 }] }),
      "Du skal rygge en bil med tilhenger inn på en smal vei, men ser dårlig bakover i speilene på grunn av tilhengerens størrelse. Hva er tryggest å gjøre?",
      "Тебе нужно сдать назад на машине с прицепом на узкую дорогу, но из-за размера прицепа в зеркалах почти ничего не видно позади. Как безопаснее поступить?",
      [
        ["Jeg stopper, går ut og ser etter hindringer, og ber gjerne en passasjer stå utenfor og gi tydelige tegn mens jeg rygger sakte", "Останавливаюсь, выхожу и проверяю, нет ли препятствий, и прошу пассажира встать снаружи и давать понятные сигналы, пока я медленно сдаю назад"],
        ["Jeg rygger i vanlig fart og stoler på at tilhengeren er kortere enn den ser ut til å være", "Сдаю назад на обычной скорости и рассчитываю, что прицеп короче, чем кажется", "Å stole på et anslag i stedet for å faktisk sjekke sikten, øker risikoen for å treffe noe du ikke ser.", "Надеяться на прикидку на глаз вместо реальной проверки обзора повышает риск задеть то, чего не видишь."],
        ["Jeg ruller ned vinduet og lener meg ut for å se bedre, i stedet for å stoppe og gå ut", "Опускаю окно и высовываюсь, чтобы лучше видеть, вместо того чтобы выйти и проверить", "Å lene seg ut av vinduet gir bare delvis sikt og dårlig kontroll over rattet samtidig, det er tryggere å stoppe og gå ut eller bruke en medhjelper.", "Высовываться из окна даёт лишь частичный обзор и ухудшает контроль за рулём одновременно — безопаснее остановиться и выйти или воспользоваться помощником."],
        ["Jeg kjører fremover og finner en annen vei i stedet, siden rygging med tilhenger på smal vei alltid er forbudt", "Еду вперёд и ищу другую дорогу — сдавать назад с прицепом на узкой дороге вообще запрещено", "Det er ikke forbudt å rygge med tilhenger på en smal vei, det krever bare ekstra forsiktighet og gjerne hjelp til å se.", "Сдавать назад с прицепом на узкой дороге не запрещено — просто нужна особая осторожность и, по возможности, помощь, чтобы видеть обстановку."]
      ],
      "Når sikten bakover er dårlig med tilhenger, er det tryggest å stoppe og sjekke selv, og bruke en medhjelper utenfor bilen som gir tydelige tegn, i stedet for å rygge på et anslag.",
      "Когда обзор назад с прицепом плохой, безопаснее остановиться и проверить самому, а также воспользоваться помощником снаружи машины, который даёт понятные сигналы — а не сдавать назад «на глазок».",
      "Не видишь — не едешь. Останавливайся и проверяй, а не угадывай."),

    q("099", SK.hill({ dir: "down", edge: "curb", wheels: "straight" }),
      "Du parkerer i en bakke der bilen peker nedover, og det er fortauskant (kantstein) på høyre side av veien. Hvordan bør du vri forhjulene?",
      "Ты паркуешься на спуске, машина смотрит вниз по склону, и справа есть бордюр. Как нужно повернуть передние колёса?",
      [
        ["Vrir forhjulene mot kantsteinen, slik at bilen ruller mot kanten og blir stoppet av den hvis den skulle trille framover", "Поворачиваю колёса к бордюру, чтобы при скатывании вперёд машина покатилась к бордюру и была остановлена им"],
        ["Vrir forhjulene bort fra kantsteinen, akkurat som i en bakke der bilen peker oppover", "Поворачиваю колёса от бордюра — как на подъёме, когда машина смотрит вверх", "Det er motsatt her, siden bilen peker nedover, skal hjulene vris mot kantsteinen, ikke bort fra den, for at kanten skal stoppe bilen.", "Здесь всё наоборот: машина смотрит вниз, поэтому колёса поворачивают к бордюру, а не от него, — только так бордюр остановит машину."],
        ["Lar forhjulene stå rett fram, siden kantsteinen stopper bilen uansett vinkel", "Оставляю колёса прямо — бордюр остановит машину при любом угле", "Med hjulene rett fram ruller bilen langs kantsteinen nedover bakken, og kanten stopper den ikke.", "С прямыми колёсами машина покатится вдоль бордюра вниз по склону, и бордюр её не остановит."],
        ["Vrir forhjulene mot kjørebanen i stedet for mot kantsteinen, for å stå lengst unna fortauet", "Поворачиваю колёса в сторону проезжей части, а не к бордюру, — чтобы стоять подальше от тротуара", "Dette er den farligste løsningen, da vil bilen trille rett ut i trafikken hvis den begynner å bevege seg, i stedet for mot kantsteinen.", "Это самый опасный вариант — машина при скатывании покатится прямо в поток машин, а не к бордюру."]
      ],
      "Peker bilen nedover og det finnes fortauskant, vrir du forhjulene mot kantsteinen. Da blir bilen stoppet av kanten hvis den skulle trille framover. Bruk alltid håndbrekk og gir i tillegg.",
      "Если машина смотрит вниз по склону и есть бордюр, колёса поворачивают к бордюру. Тогда, если машина покатится вперёд, бордюр её остановит. Обязательно дополнительно включай ручник и передачу.",
      "Четыре варианта склона — четыре разных поворота колёс: вверх/вниз и с бордюром/без меняют направление."),

    qm("m11", scene({ you: { from: "south", to: "north" }, roundabout: true, peds: ["north"], others: [{ from: "west", to: "east" }] }), "Du skal gjennom en rundkjøring og ut på andre side, der det er et gangfelt. Velg alle riktige.", "Ты проезжаешь круг и съезжаешь на другой стороне, где на выезде пешеходный переход. Выбери все верные.", [
      ["Biler som allerede er inne i rundkjøringen, har forrang foran biler som skal kjøre inn", "У машин, которые уже в кольце, приоритет перед тем, кто въезжает", true],
      ["Du skal blinke til høyre like før du kjører ut av rundkjøringen", "Перед выездом из кольца нужно включить правый поворотник", true],
      ["Du har vikeplikt for gående som er i eller på vei ut i gangfeltet ved utkjøringen", "Ты уступаешь пешеходам, которые идут по переходу на выезде из кольца или вот-вот на него ступят", true],
      ["Du må alltid blinke til høyre allerede før du kjører inn i rundkjøringen, uansett hvilken avkjørsel du skal ta", "Нужно всегда включать правый поворотник ещё до въезда в кольцо, независимо от того, какой выезд нужен", false, "Du blinker til høyre før innkjøring bare hvis du skal ta første avkjørsel, ikke uansett hvilken utkjørsel du skal ta.", "Поворотник перед въездом включают только если нужен первый выезд — не при любом выезде из кольца."]
    ],
    "I en rundkjøring har trafikken som allerede sirkulerer forrang foran de som kjører inn, og gående som er i eller på vei ut i gangfeltet ved utkjøringen, skal du slippe over (§ 9 nr 2). Du blinker til høyre før innkjøring bare ved første avkjørsel, men alltid før du kjører ut.",
    "В кольце уже движущийся по кругу транспорт имеет приоритет перед въезжающими, а пешеходов, которые идут или вот-вот ступят на переход у выезда, нужно пропустить (§ 9 nr 2). Правый поворотник перед въездом включают только для первого выезда, а перед выездом — всегда.",
    "Главное в кольце: кто уже внутри — главный, а поворотник перед выездом — всегда обязателен."),

    q("100", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "passingPlace", y: 84, label: "LOMME" }], actors: [{ label: "A", y: 150, trailer: "caravan", path: [[216, 112]] }, { kind: "car", y: 262, color: "#e0483a", label: false }, { kind: "car", lane: "left", y: 40, color: "#22a06b", label: false, path: [[184, 110]] }], tags: [{ text: "KØ BAK DEG", x: 300, y: 270 }] }),
      "Du kjører med campingvogn opp en smal og svingete bakke, langt under fartsgrensen. Det er møtende trafikk, og en lang kø har samlet seg bak deg. Hva bør du gjøre?",
      "Ты едешь с жилым прицепом (campingvogn) вверх по узкой извилистой дороге, гораздо медленнее лимита. Есть встречные машины, а за тобой собралась длинная очередь. Как правильно поступить?",
      [
        ["Holde godt til høyre, og ved behov sette ned farten eller stanse på et egnet sted, for eksempel en lomme, så køen kommer forbi", "Держаться как можно правее и при необходимости сбросить скорость или остановиться в подходящем месте, например в кармане, чтобы очередь могла проехать"],
        ["Kjøre videre som før, det er de bak som må vente til vegen blir bredere", "Ехать дальше как ехал — пусть те, кто сзади, ждут, пока дорога станет шире", "Når du kjører sakte, tar stor plass og vegen er uoversiktlig eller har møtende trafikk, skal du om nødvendig vike til høyre og sette ned farten eller stanse (§ 12 nr 4).", "Если ты едешь медленно, занимаешь много места, а дорога плохо просматривается или есть встречные, закон требует при необходимости прижаться вправо, сбросить скорость или остановиться (§ 12 nr 4)."],
        ["Blinke til høyre for å vise bilene bak at det er trygt å kjøre forbi", "Включить правый поворотник, чтобы показать машинам сзади, что обгонять безопасно", "Blinklys viser at du selv skal svinge eller flytte deg til høyre, ikke at vegen foran er fri. Den som kjører forbi, må selv forvisse seg om at det er trygt (§ 12 nr 2).", "Поворотник значит, что ты сам поворачиваешь или смещаешься вправо, а не что впереди свободно. Обгоняющий сам обязан убедиться, что это безопасно (§ 12 nr 2)."],
        ["Øke farten litt over fartsgrensen et kort stykke, så køen blir mindre", "Ненадолго немного превысить лимит, чтобы очередь стала короче", "Fartsgrensen gjelder uansett kø bak deg. Med tilhenger er det i tillegg ekstra farlig å kjøre fort i svinger.", "Лимит скорости действует независимо от очереди сзади. А с прицепом быстро входить в повороты ещё и особенно опасно."]
      ],
      "Trafikkreglene § 12 nr 4: når kjøretøyet går sakte eller tar stor plass, og vegen er uoversiktlig eller har møtende trafikk, skal føreren om nødvendig vike til høyre og sette ned farten eller stanse, slik at andre kan kjøre forbi.",
      "Trafikkreglene § 12 nr 4: если машина едет медленно или занимает много места, а дорога плохо просматривается или есть встречные, водитель при необходимости должен уйти вправо, сбросить скорость или остановиться, чтобы другие могли обогнать.",
      "Медленный и широкий — значит ты помогаешь себя обогнать: прижмись вправо и пропусти очередь в кармане."),

    q("101", street({ actors: [{ kind: "cane", x: 238, y: 120, rot: 270 }, { label: "A", y: 250, path: [[216, 170]] }], tags: [{ text: "IKKE GANGFELT", x: 308, y: 40 }] }),
      "I et boligområde ser du en person med hvit stokk som står ved kanten av vegen og ser ut til å ville gå over. Det er ikke noe gangfelt her. Hva gjør du?",
      "В жилом районе ты видишь человека с белой тростью: он стоит у края дороги и, похоже, хочет перейти. Пешеходного перехода здесь нет. Что делаешь?",
      [
        ["Senker farten mye og er klar til å stanse med en gang", "Сильно снижаю скорость и готов сразу остановиться"],
        ["Holder vanlig fart, siden plikten til å vike for gående bare gjelder ved gangfelt", "Еду с обычной скоростью: уступать пешеходам нужно только на переходе", "Plikten til å kjøre sakte og om nødvendig stanse for en person med hvit stokk gjelder overalt, ikke bare ved gangfelt (§ 13 nr 2 c).", "Обязанность ехать медленно и при необходимости остановиться перед человеком с белой тростью действует везде, а не только у перехода (§ 13 nr 2 c)."],
        ["Tuter kort for at personen skal høre at en bil kommer, og kjører videre i samme fart", "Коротко сигналю, чтобы человек услышал машину, и еду дальше с той же скоростью", "Et tut kan skremme og forvirre, og det fjerner ikke plikten din til å senke farten. Unødig bruk av lydsignal er dessuten forbudt (§ 14 nr 1).", "Сигнал может напугать и сбить с толку, и он не снимает с тебя обязанность сбавить скорость. К тому же ненужный звуковой сигнал запрещён (§ 14 nr 1)."],
        ["Kjører raskt forbi før personen går ut, så du ikke blir stående i vegen", "Быстро проезжаю, пока человек не вышел на дорогу, чтобы не мешать", "Å øke farten forbi en blind person er det motsatte av det loven krever: du skal holde særlig liten fart.", "Разгоняться мимо незрячего человека — прямо противоположно тому, что требует закон: скорость должна быть особенно низкой."]
      ],
      "Trafikkreglene § 13 nr 2 c: kjørende skal i særlig grad holde liten fart og om nødvendig stanse straks når de passerer en person som bruker hvit stokk eller førerhund for blinde. Det gjelder også der det ikke er gangfelt.",
      "Trafikkreglene § 13 nr 2 c: проезжая мимо человека с белой тростью или собакой-поводырём, водитель обязан держать особенно низкую скорость и при необходимости сразу остановиться. Это действует и там, где перехода нет.",
      "Белая трость или собака-поводырь — сигнал «тормози»: человек может не видеть машину."),

    q("102", street({ sides: { left: "grass", right: "grass" }, features: [{ type: "sideRoad", y: 66, side: "both", w: 52 }], actors: [{ label: "B", y: 150, color: "#e0483a", path: [[216, 100]] }, { label: "A", y: 245, blink: "left", path: [[198, 205], [184, 160], [184, 70]], pathOpts: { dash: "8 6" } }] }),
      "Du kjører på en veg med ett felt i hver retning. Foran ligger et kryss uten skilt og uten trafikklys. Bilen foran deg kjører litt sakte. Kan du kjøre forbi den like foran eller i krysset?",
      "Ты едешь по дороге с одной полосой в каждую сторону. Впереди перекрёсток без знаков и без светофора. Машина перед тобой едет немного медленно. Можно обогнать её прямо перед перекрёстком или на нём?",
      [
        ["Nei, forbikjøring like foran eller i et slikt kryss er forbudt", "Нет, обгон прямо перед таким перекрёстком или на нём запрещён"],
        ["Ja, hvis du ser at det ikke kommer noen fra sidevegene", "Да, если видно, что с боковых дорог никто не едет", "Forbudet gjelder selv om sidevegene ser tomme ut. Unntakene i § 12 nr 5 handler om flere felt, lys, politi eller vikepliktskilt for kryssende veg, ikke om at du ikke ser noen.", "Запрет действует, даже если боковые дороги выглядят пустыми. Исключения в § 12 nr 5 — это несколько полос, светофор, регулировщик или знак уступи на пересекаемой дороге, а не «никого не видно»."],
        ["Ja, forbikjøring i kryss er bare forbudt når krysset har trafikklys", "Да, обгон на перекрёстке запрещён, только если там светофор", "Det er motsatt: i et kryss med trafikklys er forbikjøring tillatt (§ 12 nr 5 c). Forbudet gjelder kryss uten lys, politi eller vikepliktskilt.", "Наоборот: на перекрёстке со светофором обгон разрешён (§ 12 nr 5 c). Запрет касается перекрёстков без светофора, регулировщика и знака уступи."],
        ["Ja, hvis bilen foran kjører under fartsgrensen", "Да, если машина впереди едет медленнее лимита", "Farten til bilen foran gir ikke noe unntak fra forbudet mot forbikjøring i kryss.", "Скорость машины впереди не даёт исключения из запрета обгона на перекрёстке."]
      ],
      "Trafikkreglene § 12 nr 5: forbikjøring er forbudt like foran eller i vegkryss. Unntak er blant annet kjørebane med to eller flere felt i din retning, kryss med trafikklys eller politi, og når kryssende veg har vikeplikt ved skilt. I et kryss med høyreregel gjelder forbudet.",
      "Trafikkreglene § 12 nr 5: обгон запрещён прямо перед перекрёстком и на нём. Исключения: две и больше полос в твою сторону, перекрёсток со светофором или регулировщиком, а также когда пересекаемая дорога уступает по знаку. На перекрёстке с правилом правой руки запрет действует.",
      "На перекрёстке, где действует правило правой руки, справа может выехать машина, которую ты не ждёшь, — поэтому там не обгоняют."),

    q("103", street({ laneW: 28, actors: [{ label: "A", x: 232, y: 150, blink: "hazard" }, { kind: "adult", x: 262, y: 140, rot: 90, color: "#6b4fa0" }], tags: [{ text: "TO HJUL PÅ FORTAUET?", x: 318, y: 40 }] }),
      "Du skal levere en tung pakke i en smal gate. For ikke å sperre kjørebanen vil du stanse et par minutter med to hjul oppe på fortauet. Det er ingen skilt. Er det lov?",
      "Тебе нужно занести тяжёлую посылку на узкой улице. Чтобы не перегораживать проезжую часть, хочешь на пару минут встать двумя колёсами на тротуар. Знаков нет. Так можно?",
      [
        ["Nei, det er forbudt å stanse helt eller delvis på fortau", "Нет, останавливаться полностью или частично на тротуаре запрещено"],
        ["Ja, når det bare er kort stans for å losse, er det ikke parkering", "Да, если это короткая остановка для выгрузки, это не парковка", "Det stemmer at kort lossing ikke er parkering, men på fortau er selve stansen forbudt (§ 17 nr 1 c).", "Короткая выгрузка — действительно не парковка, но на тротуаре запрещена сама остановка (§ 17 nr 1 c)."],
        ["Ja, så lenge du har nødblinken på", "Да, если включена аварийка", "Nødblink gjør ikke en ulovlig stans lovlig. Den er for å varsle fare, ikke for å stanse der det er forbudt.", "Аварийка не делает запрещённую остановку разрешённой. Она нужна, чтобы предупредить об опасности, а не чтобы стоять там, где нельзя."],
        ["Ja, forbudet gjelder bare når alle fire hjulene står på fortauet", "Да, запрет действует, только если на тротуаре все четыре колеса", "Loven sier «helt eller delvis» på fortau, så også to hjul på fortauet er forbudt.", "В законе сказано «полностью или частично», так что два колеса на тротуаре — тоже нарушение."]
      ],
      "Trafikkreglene § 17 nr 1 c: det er forbudt å stanse helt eller delvis på fortau, gangveg eller sykkelveg. Fortauet er for gående, og en bil der tvinger for eksempel folk med barnevogn eller rullestol ut i kjørebanen.",
      "Trafikkreglene § 17 nr 1 c: запрещено останавливаться полностью или частично на тротуаре, пешеходной или велосипедной дорожке. Тротуар для пешеходов, а машина на нём выталкивает, например, людей с коляской или в инвалидном кресле на проезжую часть.",
      "Тротуар — ни одним колесом: даже «на минутку» и даже двумя колёсами нельзя."),

    q("104", scene({ you: { from: "south", to: "north", dist: 70 }, lights: { south: "green" }, extra: [{ kind: "car", x: 215, y: 96, rot: 0, color: "#e0483a", label: false, brake: true }, { kind: "car", x: 215, y: 50, rot: 0, color: "#22a06b", label: false, brake: true }, { kind: "car", x: 215, y: 4, rot: 0, color: "#f08c1a", label: false, brake: true }], tags: [{ text: "KØ", x: 262, y: 60 }] }),
      "Du har grønt lys og skal rett fram i et lyskryss. På den andre siden av krysset står det kø, og det er ikke plass til bilen din der. Hva gjør du?",
      "У тебя зелёный, ты едешь прямо через перекрёсток со светофором. За перекрёстком стоит пробка, и места для твоей машины там нет. Что делаешь?",
      [
        ["Venter foran krysset til det blir plass på den andre siden", "Жду перед перекрёстком, пока за ним не освободится место"],
        ["Kjører inn, fordi grønt lys gir meg rett til å kjøre", "Въезжаю: зелёный даёт мне право ехать", "Grønt lys betyr ikke at du kan kjøre inn i krysset og bli stående der. Du må ikke sperre for trafikken på den kryssende vegen (§ 5 nr 4).", "Зелёный не значит, что можно въехать на перекрёсток и застрять там. Нельзя перекрывать движение по пересекаемой дороге (§ 5 nr 4)."],
        ["Kjører inn og venter midt i krysset, så mister jeg ikke plassen i køen", "Въезжаю и жду посреди перекрёстка, чтобы не потерять место в очереди", "Når lyset skifter, sperrer du for dem som får grønt fra sidevegen. Det er akkurat dette § 5 nr 4 forbyr.", "Когда свет сменится, ты перекроешь путь тем, кому дали зелёный с боковой улицы. Именно это запрещает § 5 nr 4."],
        ["Kjører gjennom krysset og stanser på gangfeltet rett etter, så krysset er fritt", "Проезжаю перекрёсток и встаю на пешеходном переходе сразу за ним — перекрёсток же свободен", "Du skal også unngå å stanse på gangfelt (§ 9 nr 4). Da må gående gå rundt bilen din, kanskje ut blant bilene.", "На пешеходном переходе тоже нельзя вставать (§ 9 nr 4): пешеходам придётся обходить машину, возможно, между другими машинами."]
      ],
      "Trafikkreglene § 5 nr 4: den som kjører inn i et vegkryss, skal kjøre slik at det ikke må stanses til unødig hinder for trafikk på den kryssende vegen. Ser du at det ikke er plass etter krysset, venter du foran, selv om lyset er grønt. § 9 nr 4: unngå stans på gangfelt.",
      "Trafikkreglene § 5 nr 4: въезжая на перекрёсток, нужно ехать так, чтобы не пришлось остановиться и мешать движению по пересекаемой дороге. Если за перекрёстком нет места, ждёшь перед ним, даже на зелёный. § 9 nr 4: на пешеходном переходе стараться не останавливаться.",
      "Перед въездом на перекрёсток смотри не на светофор, а за перекрёсток: есть ли куда встать."),

    q("105", street({ laneW: 28, sides: { left: "walk", right: "walk" }, actors: [{ kind: "truck", x: 214, y: 110, color: "#8a949e", label: false, blink: "hazard" }, { label: "B", lane: "left", y: 52, color: "#e0483a", path: [[186, 150]] }, { label: "A", y: 255, path: [[214, 200]] }] }),
      "Du kjører på en smal toveis veg. I ditt kjørefelt står en lastebil parkert, og en bil kommer imot. Det er ikke plass til at dere passerer hverandre ved lastebilen. Hvem skal vente?",
      "Ты едешь по узкой двусторонней дороге. В твоей полосе стоит припаркованный грузовик, навстречу едет машина. Разъехаться у грузовика места нет. Кто должен ждать?",
      [
        ["Du, fordi hindringen står på din side av vegen", "Ты, потому что препятствие на твоей стороне дороги"],
        ["Den som kommer først fram til lastebilen", "Тот, кто первым подъедет к грузовику", "Det er ikke om å gjøre å komme først. Loven sier at den som har sperringen på sin side, har vikeplikt (§ 7 nr 6).", "Дело не в том, кто успел первым. По закону уступает тот, у кого препятствие на его стороне (§ 7 nr 6)."],
        ["Den møtende bilen, fordi du kommer fra dens høyre side", "Встречная машина, потому что ты у неё справа", "Høyreregelen gjelder i kryss. Her møtes dere på samme veg, og da gjelder § 7 nr 6 om sperring.", "Правило правой руки действует на перекрёстках. Здесь вы встречаетесь на одной дороге, и действует § 7 nr 6 о препятствии."],
        ["Den møtende bilen, fordi du allerede har lagt deg ut og blinker til venstre", "Встречная машина: ты уже сместился влево и включил левый поворотник", "Blinklyset viser bare hva du vil gjøre. Det gir deg ingen rett til å kjøre først forbi en sperring på din side.", "Поворотник лишь показывает, что ты собираешься сделать. Права проехать первым мимо препятствия на твоей стороне он не даёт."]
      ],
      "Trafikkreglene § 7 nr 6: kjørende som møtes, skal om nødvendig vike til høyre og kjøre sakte eller stanse. Er en del av vegen sperret, har den vikeplikt som har sperringen på sin side. Du venter derfor bak lastebilen til den møtende bilen har passert.",
      "Trafikkreglene § 7 nr 6: встречные машины при необходимости принимают вправо и замедляются или останавливаются. Если часть дороги перекрыта, уступает тот, на чьей стороне препятствие. Поэтому ты ждёшь за грузовиком, пока встречная не проедет.",
      "Препятствие на твоей полосе — значит, ждёшь ты. Объезжаешь, только когда встречная полоса свободна."),

    q("106", scene({ you: { from: "south", to: "north", dist: 70 }, extra: [{ kind: "car", x: 176, y: 165, rot: 90, color: "#2a2f36", label: false }, { kind: "car", x: 116, y: 165, rot: 90, color: "#4b5563", label: false }, { kind: "car", x: 66, y: 165, rot: 90, color: "#4b5563", label: false }, { kind: "car", x: 16, y: 165, rot: 90, color: "#4b5563", label: false }], tags: [{ text: "BEGRAVELSESFØLGE →", x: 92, y: 204 }] }),
      "Du venter ved et kryss uten skilt. Fra venstre kommer et begravelsesfølge: en likbil og mange biler etter hverandre med lyset på. Det er små luker mellom bilene. Hva gjør du?",
      "Ты стоишь у перекрёстка без знаков. Слева идёт похоронная процессия: катафалк и много машин друг за другом с включёнными фарами. Между машинами небольшие промежутки. Что делаешь?",
      [
        ["Venter til hele følget har kjørt forbi", "Жду, пока проедет вся процессия"],
        ["Kjører inn i en luke, fordi jeg kommer fra høyre for dem", "Въезжаю в промежуток: я же у них справа", "Du må ikke hindre eller forstyrre et begravelsesfølge (§ 10 nr 3). Å kjøre inn mellom bilene bryter opp følget.", "Похоронной процессии нельзя мешать (§ 10 nr 3). Если въехать между машинами, процессия разорвётся."],
        ["Venter bare til likbilen har passert, og kjører så inn mellom de andre bilene", "Жду только катафалк, а потом въезжаю между остальными машинами", "Følget er alle bilene som kjører sammen, ikke bare likbilen. Hele følget skal få kjøre samlet.", "Процессия — это все машины, которые едут вместе, а не только катафалк. Ей нужно дать проехать целиком."],
        ["Tuter kort, så de slipper meg fram", "Коротко сигналю, чтобы меня пропустили", "Unødig bruk av lydsignal er forbudt (§ 14 nr 1), og du skal ikke forstyrre følget.", "Ненужный звуковой сигнал запрещён (§ 14 nr 1), и процессии мешать нельзя."]
      ],
      "Trafikkreglene § 10 nr 3: trafikant må ikke hindre eller forstyrre gående i gruppe under tilsyn av leder, prosesjon, begravelsesfølge, militær kjøretøykolonne eller sivilforsvarskolonne. Du venter til hele følget har passert.",
      "Trafikkreglene § 10 nr 3: нельзя мешать группе пешеходов под присмотром руководителя, шествию, похоронной процессии, военной колонне или колонне гражданской обороны. Ждёшь, пока проедет вся процессия.",
      "Колонну, процессию, группу детей с воспитателем не разрываешь: пропускаешь целиком."),

    q("107", street({ sides: { left: "grass", right: "shoulder" }, actors: [{ label: "A", x: 244, y: 150, blink: "left" }, { label: "B", y: 268, color: "#e0483a", path: [[216, 180]] }], tags: [{ text: "VEGSKULDER", x: 304, y: 110 }] }),
      "Du har stanset på vegskulderen for å se på kartet. Nå vil du kjøre ut i kjørebanen igjen. En bil nærmer seg bakfra i feltet ditt og er ikke langt unna. Hva gjør du?",
      "Ты остановился на обочине, чтобы посмотреть карту. Теперь хочешь выехать обратно на проезжую часть. Сзади по твоей полосе подъезжает машина, она уже недалеко. Что делаешь?",
      [
        ["Lar bilen passere først, fordi jeg har vikeplikt", "Пропускаю её: уступать должен я"],
        ["Blinker til venstre og kjører ut; bilen bak må slippe meg inn", "Включаю левый поворотник и выезжаю: машина сзади должна меня пустить", "Blinklyset viser hva du vil gjøre, men gir deg ikke rett til å kjøre ut. Den som kjører ut fra vegskulderen, har vikeplikt (§ 7 nr 4).", "Поворотник показывает намерение, но права выехать не даёт. Кто выезжает с обочины, тот уступает (§ 7 nr 4)."],
        ["Kjører ut, fordi jeg er foran bilen og den bak må holde avstand", "Выезжаю: я впереди, а задний обязан держать дистанцию", "Regelen om avstand gjelder bilen som allerede kjører bak en annen i feltet. Du står på skulderen og er ikke i feltet ennå, så du må vike (§ 8 nr 1).", "Правило о дистанции касается машины, которая уже едет за другой в полосе. Ты стоишь на обочине и ещё не в полосе, так что уступаешь ты (§ 8 nr 1)."],
        ["Kjører ut så lenge bilen er mer enn 50 meter bak", "Выезжаю, если машина дальше 50 метров", "Loven har ikke noe fast antall meter. Du må ikke hindre eller tvinge den andre til å bremse (§ 7 nr 1), og her er bilen nær.", "В законе нет фиксированного числа метров. Нельзя мешать другому и заставлять его тормозить (§ 7 nr 1), а машина уже близко."]
      ],
      "Trafikkreglene § 7 nr 4: den som svinger inn på kjørebanen fra vegens skulder, har vikeplikt for annen trafikant. § 8 nr 1: det samme gjelder den som kjører ut fra vegkanten. Du blinker, ser i speilet og over skulderen, og kjører ut først når det er en trygg luke.",
      "Trafikkreglene § 7 nr 4: тот, кто выезжает на проезжую часть с обочины, уступает остальным. § 8 nr 1: то же — при отъезде от края дороги. Включаешь поворотник, смотришь в зеркало и через плечо и выезжаешь, только когда есть безопасный промежуток.",
      "С обочины, от края дороги, с парковки ты вливаешься в поток — значит, уступаешь ты."),

    q("108", street({ sides: { left: "grass", right: "grass" }, actors: [{ label: "A", y: 140, path: [[216, 80]] }, { label: "B", lane: "left", rot: 0, y: 196, color: "#e0483a", blink: "left", path: [[184, 110], [184, 70], [210, 30]] }] }),
      "Du kjører på en landeveg med ett felt i hver retning. Bilen bak deg blinker til venstre og begynner å kjøre forbi deg. Hva gjør du?",
      "Ты едешь по загородной дороге, по одной полосе в каждую сторону. Машина сзади включает левый поворотник и начинает тебя обгонять. Что делаешь?",
      [
        ["Holder meg så langt til høyre som mulig og øker ikke farten", "Держусь как можно правее и не прибавляю скорость"],
        ["Øker farten litt, så forbikjøringen går fortere", "Немного прибавляю, чтобы обгон закончился быстрее", "Det er forbudt å øke farten når noen kjører forbi deg (§ 12 nr 4). Da blir forbikjøringen lengre og farligere.", "Прибавлять скорость, когда тебя обгоняют, запрещено (§ 12 nr 4). От этого обгон становится длиннее и опаснее."],
        ["Legger meg mot midten av vegen, så bilen ikke kan kjøre forbi", "Смещаюсь к середине дороги, чтобы машина не смогла обогнать", "Du skal tvert imot holde deg så langt til høyre som mulig (§ 12 nr 4). Å stenge vegen for den som kjører forbi, er farlig.", "Наоборот, нужно держаться как можно правее (§ 12 nr 4). Перекрывать дорогу обгоняющему опасно."],
        ["Blinker til venstre for å vise at forbikjøringen er farlig", "Включаю левый поворотник, чтобы показать, что обгонять опасно", "Blinklys viser at du selv skal svinge eller skifte plass (§ 14 nr 2). Den bak kan tro at du skal svinge til venstre.", "Поворотник показывает, что ты сам поворачиваешь или смещаешься (§ 14 nr 2). Задний водитель может решить, что ты поворачиваешь налево."]
      ],
      "Trafikkreglene § 12 nr 4: når noen vil kjøre forbi til venstre, skal den som kjører foran, holde så langt til høyre som mulig og ikke øke farten. Kjører du sakte eller med stor bil, og vegen er uoversiktlig eller har møtende trafikk, skal du om nødvendig vike til høyre og sette ned farten eller stanse.",
      "Trafikkreglene § 12 nr 4: когда тебя хотят обогнать слева, ты держишься как можно правее и не прибавляешь скорость. Если ты едешь медленно или на большой машине, а дорога плохо просматривается или есть встречные, при необходимости принимаешь вправо, сбрасываешь скорость или останавливаешься.",
      "Тебя обгоняют — правее и не газуй. Помоги обгону закончиться, а не соревнуйся."),

    q("109", street({ laneW: 34, features: [{ type: "tramRails" }], actors: [{ kind: "tram", x: 200, y: 96, label: "T" }, { label: "A", x: 200, y: 250, path: [[220, 200], [222, 110], [222, 40]], pathOpts: { dash: "8 6" } }] }),
      "Du kjører i en bygate bak en trikk som kjører midt i gaten. Trikken er ikke ved en holdeplass, og det er god plass i kjørebanen til høyre for den. Kan du kjøre forbi trikken på høyre side?",
      "Ты едешь по городской улице за трамваем, который идёт посередине улицы. Трамвай не на остановке, справа от него на проезжей части много места. Можно обогнать трамвай справа?",
      [
        ["Ja, en trikk kan du kjøre forbi på høyre side", "Да, трамвай можно обогнать справа"],
        ["Nei, forbikjøring skal alltid skje til venstre", "Нет, обгонять можно только слева", "Hovedregelen er forbikjøring til venstre, men loven har unntak. Et av dem er nettopp trikk: den kan forbikjøres til høyre (§ 12 nr 1 b).", "Основное правило — обгон слева, но в законе есть исключения. Одно из них как раз трамвай: его можно обгонять справа (§ 12 nr 1 b)."],
        ["Bare hvis trikken blinker til venstre", "Только если у трамвая включён левый поворотник", "Kravet om at den foran skal svinge til venstre, gjelder forbikjøring av biler til høyre (§ 12 nr 1 a). For trikk finnes ikke et slikt krav.", "Условие «передний поворачивает налево» касается обгона машин справа (§ 12 nr 1 a). Для трамвая такого условия нет."],
        ["Nei, du må ligge bak trikken til den svinger av", "Нет, нужно ехать за трамваем, пока он не свернёт", "Ingen regel sier at du må bli liggende bak en trikk som kjører. Du må bare gi den fri veg og følge reglene for forbikjøring.", "Никакое правило не требует ехать за движущимся трамваем. Нужно лишь уступать ему и соблюдать правила обгона."]
      ],
      "Trafikkreglene § 12 nr 1 b: forbikjøring av trikk (sporvogn) som kjører eller står stille, kan skje til høyre. Husk likevel: ved holdeplass uten trafikkøy skal du stanse og slippe passasjerene av og på (§ 9 nr 3), og du må ikke kjøre forbi en trikk som skjuler deler av et gangfelt (§ 12 nr 6).",
      "Trafikkreglene § 12 nr 1 b: трамвай (sporvogn), едущий или стоящий, можно обгонять справа. Но помни: у остановки без островка нужно остановиться и пропустить пассажиров (§ 9 nr 3), а обгонять трамвай, который закрывает часть пешеходного перехода, нельзя (§ 12 nr 6).",
      "Трамвай — исключение: его обгоняют справа. Но у остановки без островка и перед переходом — стоп и внимание."),

    q("110", street({ lanes: ["up", "up"], sides: { left: "grass", right: "grass" }, features: [{ type: "ramp", kind: "on", to: 40 }], actors: [{ label: "B", x: 247, y: 150, color: "#e0483a", blink: "left", path: [[247, 100], [216, 40]] }, { label: "A", lane: 1, y: 250, path: [[216, 200]] }] }),
      "Du kjører i høyre felt på motorvegen. Litt foran deg kommer en bil i påkjøringsfeltet og skal inn i ditt felt. Venstre felt er ledig. Hva bør du gjøre?",
      "Ты едешь по правой полосе автомагистрали. Чуть впереди по полосе разгона едет машина, ей нужно в твою полосу. Левая полоса свободна. Что лучше сделать?",
      [
        ["Gjør det lettere for bilen å komme inn, for eksempel ved å skifte til venstre felt eller tilpasse farten", "Облегчаю ей въезд: например, перестраиваюсь влево или подстраиваю скорость"],
        ["Holder fart og felt: bilen i påkjøringsfeltet har vikeplikt, så det er dens problem", "Держу скорость и полосу: у неё обязанность уступить, это её проблема", "Bilen i påkjøringsfeltet skal tilpasse seg, men loven sier også at du i feltet skal lette utkjøringen fra påkjøringsfeltet (§ 8 nr 2).", "Машина на разгоне должна подстроиться, но закон и от тебя требует облегчить ей выезд с полосы разгона (§ 8 nr 2)."],
        ["Øker farten, så bilen ikke rekker å komme inn foran meg", "Прибавляю, чтобы она не успела встать передо мной", "Dette gjør det vanskeligere for bilen å komme inn, og det er det motsatte av det § 8 nr 2 krever.", "Так ты мешаешь ей въехать, а § 8 nr 2 требует обратного."],
        ["Stanser i feltet og vinker bilen inn", "Останавливаюсь в полосе и машу ей рукой", "Det er forbudt å stanse på motorveg (§ 17 nr 1 e), og en brå stans kan gi påkjøring bakfra.", "Останавливаться на автомагистрали запрещено (§ 17 nr 1 e), а резкая остановка может кончиться ударом сзади."]
      ],
      "Trafikkreglene § 8 nr 2: den som kjører i felt for fartsøkning, skal tilpasse farten til trafikken i feltet den skal inn i. Samtidig skal de som kjører i dette feltet, lette utkjøringen fra påkjøringsfeltet. Er venstre felt ledig og det er trygt, kan du skifte felt; ellers kan du justere farten litt.",
      "Trafikkreglene § 8 nr 2: кто едет по полосе разгона, подстраивает скорость под поток, в который вливается. А те, кто едет в этой полосе, должны облегчить ему въезд. Если левая полоса свободна и это безопасно — перестройся, иначе немного подстрой скорость.",
      "На магистрали работают оба: тот, кто въезжает, подстраивается, а ты помогаешь ему влиться."),

    q("111", street({ features: [{ type: "driveway", y: 110, side: "right", building: true, label: "PARKERINGSHUS" }], actors: [{ kind: "bike", x: 244, y: 40, rot: 180, label: "S", path: [[244, 86]] }, { label: "A", y: 230, blink: "right", path: [[216, 140], [250, 112], [300, 112]] }] }),
      "Du skal svinge inn i en innkjørsel til et parkeringshus, og da må du krysse fortauet. En syklist sykler sakte langs fortauet mot innkjørselen. Hvem har vikeplikt?",
      "Тебе нужно свернуть во въезд на многоэтажную парковку и для этого пересечь тротуар. По тротуару к въезду медленно едет велосипедист. Кто должен уступить?",
      [
        ["Jeg, fordi jeg svinger inn over fortauet", "Я, потому что сворачиваю через тротуар"],
        ["Syklisten, fordi syklister på fortau alltid har vikeplikt", "Велосипедист: велосипедисты на тротуаре всегда уступают", "Syklisten har vikeplikt når han vil inn på eller krysse vegen fra fortauet (§ 7 nr 4). Her blir han på fortauet, og det er du som krysser det (§ 7 nr 3).", "Велосипедист уступает, когда съезжает с тротуара на дорогу или пересекает её (§ 7 nr 4). Здесь он остаётся на тротуаре, а пересекаешь его ты (§ 7 nr 3)."],
        ["Syklisten, fordi det er forbudt å sykle på fortauet", "Велосипедист, потому что ездить по тротуару запрещено", "Sykling på fortau er lov når det er lite gående og syklisten ikke er til fare (§ 18 nr 3). Uansett skal du ikke kjøre på ham.", "Ездить по тротуару на велосипеде можно, когда пешеходов мало и он никому не мешает (§ 18 nr 3). В любом случае наезжать на него нельзя."],
        ["Den som kommer først fram til innkjørselen", "Тот, кто первым доедет до въезда", "Vikeplikt avhenger ikke av hvem som kommer først. Den som svinger inn over fortau, viker for dem som ferdes på fortauet.", "Обязанность уступить не зависит от того, кто первый. Кто сворачивает через тротуар, уступает тем, кто по нему движется."]
      ],
      "Trafikkreglene § 7 nr 3: kjørende som vil svinge inn over fortau, har vikeplikt for gående, syklende og førere av elsparkesykkel som ferdes på fortauet. § 9 nr 2: den som krysser fortau, har også vikeplikt for gående. Du stanser før fortauet og lar syklisten passere.",
      "Trafikkreglene § 7 nr 3: кто сворачивает через тротуар, уступает пешеходам, велосипедистам и электросамокатам, которые по нему движутся. § 9 nr 2: при пересечении тротуара уступаешь и пешеходам. Останавливаешься перед тротуаром и пропускаешь велосипедиста.",
      "Тротуар — чужая территория. Пересекаешь его ты — значит, ты и ждёшь."),

    q("112", street({ sides: { left: "grass", right: "grass" }, weather: "night", features: [{ type: "railSide", x: 112, train: { y: 40, dir: 1, lights: true } }], actors: [{ label: "A", y: 250, beams: "high", path: [[216, 190]] }] }),
      "Det er mørkt, og du kjører med fjernlys på en veg som går rett ved siden av en jernbane. Et tog kommer imot deg på sporet langs vegen. Ingen biler kommer imot. Hva gjør du med lyset?",
      "Темно, ты едешь с дальним светом по дороге, которая идёт прямо вдоль железной дороги. Навстречу по путям рядом с дорогой идёт поезд. Встречных машин нет. Что делаешь со светом?",
      [
        ["Blender ned til nærlys, så jeg ikke blender lokomotivføreren", "Переключаюсь на ближний, чтобы не ослепить машиниста"],
        ["Beholder fjernlyset: regelen om å blende ned gjelder bare møtende biler", "Оставляю дальний: переключаться нужно только перед встречными машинами", "Regelen gjelder alle trafikanter og nevner også jernbanetog, sporvogn og fartøy langs vegen (§ 15 nr 2).", "Правило касается всех участников движения, и в нём прямо названы поезд, трамвай и судно, идущие вдоль дороги (§ 15 nr 2)."],
        ["Blender ned bare hvis toget blinker med lyset først", "Переключаюсь, только если поезд сначала мигнёт мне", "Du skal ikke vente på et tegn. Plikten er din: fjernlyset må ikke blende andre (§ 15 nr 2).", "Ждать сигнала не нужно. Обязанность твоя: дальний не должен никого слепить (§ 15 nr 2)."],
        ["Slår av alt lys til toget har passert", "Выключаю весь свет, пока поезд не проедет", "Under kjøring skal fjernlys, nærlys eller godkjent kjørelys alltid være på (§ 15 nr 1). I mørket trenger du nærlys for å se vegen.", "Во время движения всегда должен гореть дальний, ближний или разрешённые ходовые огни (§ 15 nr 1). В темноте без ближнего ты дороги не увидишь."]
      ],
      "Trafikkreglene § 15 nr 2: fjernlys må ikke brukes slik at annen trafikant blir blendet. Det samme gjelder ved møte med jernbanetog, sporvogn eller fartøy (båt) som går langs vegen. § 15 nr 3: når fjernlys ikke er tillatt, bruker du nærlys.",
      "Trafikkreglene § 15 nr 2: дальним светом нельзя слепить других участников движения. То же самое при встрече с поездом, трамваем или судном, которое идёт вдоль дороги. § 15 nr 3: когда дальний нельзя, включаешь ближний.",
      "Навстречу кто-то с глазами — машина, поезд, трамвай или катер у берега — переключайся на ближний."),

    q("113", scene({ you: { from: "south", to: "west" }, arms: ["north", "south", "west"] }),
      "Du kjører på en vanlig toveis veg med ett felt i hver retning og skal svinge til venstre inn på en sideveg. Hvor skal bilen være før du svinger?",
      "Ты едешь по обычной дороге с одной полосой в каждую сторону и собираешься повернуть налево на боковую дорогу. Где должна быть машина перед поворотом?",
      [
        ["Så nær midten av kjørebanen som mulig, i mitt eget felt", "Как можно ближе к середине проезжей части, в своей полосе"],
        ["Helt ute til høyre, så bilene bak kan kjøre forbi meg til venstre", "У самого правого края, чтобы машины сзади объехали меня слева", "Det er motsatt: ved venstresving skal du kjøre nær midten (§ 6 nr 2). Da kan bilene bak kjøre forbi deg på høyre side (§ 12 nr 1 a).", "Наоборот: при левом повороте держишься ближе к середине (§ 6 nr 2). Тогда машины сзади объедут тебя справа (§ 12 nr 1 a)."],
        ["Over midtlinjen, i det motgående feltet, så jeg kan svinge fortere", "За осевой, во встречной полосе, чтобы быстрее повернуть", "Loven sier nær midten, ikke over den. I det motgående feltet sperrer du for møtende trafikk og kan kollidere front mot front.", "Закон говорит «ближе к середине», а не за неё. Во встречной полосе ты перекрываешь путь встречным и рискуешь лобовым столкновением."],
        ["Plasseringen spiller ingen rolle, det viktigste er blinklyset", "Положение неважно, главное — поворотник", "Loven krever både tegn (§ 14 nr 2) og riktig plassering (§ 6 nr 2). Plasseringen viser også de andre hva du skal gjøre.", "Закон требует и сигнал (§ 14 nr 2), и правильное положение (§ 6 nr 2). Положение на дороге тоже подсказывает другим, что ты собираешься делать."]
      ],
      "Trafikkreglene § 6 nr 2: på toveis kjørebane skal du ved sving til venstre kjøre så nær midten av kjørebanen som mulig. Ved sving til høyre kjører du så nær høyre kant som mulig. Gi tegn i god tid (§ 14 nr 2). Bilene bak kan da kjøre forbi deg til høyre (§ 12 nr 1 a).",
      "Trafikkreglene § 6 nr 2: на двусторонней дороге перед левым поворотом держишься как можно ближе к середине проезжей части, перед правым — как можно ближе к правому краю. Поворотник включаешь заранее (§ 14 nr 2). Машины сзади тогда могут объехать тебя справа (§ 12 nr 1 a).",
      "Налево — к середине, направо — к правому краю. Куда поворачиваешь, туда и прижимаешься."),

    q("114", street({ actors: [{ kind: "worker", x: 238, y: 118, rot: 270 }, { kind: "child", x: 222, y: 120, rot: 270, color: "#f5d90a" }, { kind: "child", x: 208, y: 120, rot: 270, color: "#f5d90a" }, { kind: "child", x: 194, y: 120, rot: 270, color: "#f5d90a" }, { kind: "child", x: 180, y: 120, rot: 270, color: "#f5d90a" }, { kind: "worker", x: 164, y: 120, rot: 270, walk: [148, 120] }, { label: "A", y: 250, path: [[216, 180]], brake: true }], tags: [{ text: "BARNEHAGEGRUPPE", x: 300, y: 70 }] }),
      "I et boligområde krysser en barnehagegruppe vegen. Barna går i en lang rekke, og to voksne leder gruppen. De går ikke i et gangfelt. Hva gjør du?",
      "В жилом районе дорогу переходит группа из детского сада. Дети идут длинной цепочкой, их ведут двое взрослых. Пешеходного перехода там нет. Что делаешь?",
      [
        ["Stanser og venter til hele gruppen er over vegen", "Останавливаюсь и жду, пока вся группа перейдёт"],
        ["Kjører forsiktig gjennom når det blir en luke i rekka", "Аккуратно проезжаю, когда в цепочке появится просвет", "Du må ikke hindre eller forstyrre gående i gruppe under tilsyn av leder (§ 10 nr 3). Kjører du inn i en luke, deler du gruppen.", "Нельзя мешать группе пешеходов, которую ведёт взрослый (§ 10 nr 3). Если проехать в просвет, группа разорвётся."],
        ["Kjører videre: utenfor gangfelt er det de gående som skal passe på bilene", "Еду дальше: вне перехода пешеходы сами должны пропускать машины", "For en gruppe under tilsyn av leder gjelder § 10 nr 3 også utenfor gangfelt. Og når barn er på eller ved vegen, skal du ha særlig lav fart og om nødvendig stanse (§ 13 nr 2 a).", "Для группы с сопровождающим § 10 nr 3 действует и вне перехода. А когда дети на дороге или рядом с ней, нужно ехать особенно медленно и при необходимости остановиться (§ 13 nr 2 a)."],
        ["Tuter kort, så de voksne ser bilen og stopper barna", "Коротко сигналю, чтобы взрослые заметили машину и остановили детей", "Unødig bruk av lydsignal er forbudt (§ 14 nr 1), og du skal ikke forstyrre gruppen (§ 10 nr 3). Et tut kan også skremme barna.", "Ненужный звуковой сигнал запрещён (§ 14 nr 1), а группе мешать нельзя (§ 10 nr 3). К тому же гудок может напугать детей."]
      ],
      "Trafikkreglene § 10 nr 3: trafikant må ikke hindre eller forstyrre gående i gruppe under tilsyn av leder. Dette gjelder også utenfor gangfelt. § 13 nr 2 a: ved barn som er på eller ved vegen, skal du holde særlig lav fart og om nødvendig stanse. Du venter til hele gruppen har gått over.",
      "Trafikkreglene § 10 nr 3: нельзя мешать группе пешеходов, которую ведёт сопровождающий, — и вне перехода тоже. § 13 nr 2 a: когда дети на дороге или рядом, едешь особенно медленно и при необходимости останавливаешься. Ждёшь, пока перейдёт вся группа.",
      "Группа с воспитателем — как одна колонна: её не разрывают, ждут до последнего ребёнка."),

    q("115", street({ sides: { left: "grass", right: "grass" }, actors: [{ kind: "truck", y: 40, color: "#8a949e", label: false, path: [[216, 2]] }, { label: "B", y: 120, color: "#e0483a" }, { label: "A", y: 200 }, { kind: "car", y: 272, color: "#22a06b", label: false, blink: "left" }], tags: [{ text: "SAKTE LASTEBIL", x: 300, y: 34 }] }),
      "Du kjører på en landeveg i en kø av biler bak en lastebil som kjører sakte. Bilene bak deg vil kjøre forbi når det blir mulig. Hvor stor avstand bør du holde til bilen foran?",
      "Ты едешь по загородной дороге в колонне машин за медленным грузовиком. Машины сзади хотят обогнать, когда появится возможность. Какую дистанцию держать до машины впереди?",
      [
        ["Så stor at jeg ikke kjører på den hvis den bremser, og at en bil som kjører forbi, kan komme inn i luka foran meg", "Такую, чтобы не врезаться, если она затормозит, и чтобы обгоняющая машина могла встать в промежуток передо мной"],
        ["Så liten som mulig, så ingen kan presse seg inn foran meg", "Как можно меньше, чтобы никто не втиснулся передо мной", "Loven krever det motsatte: avstanden skal være slik at den som kjører forbi, kan komme inn mellom bilene uten fare (§ 5 nr 3). Liten avstand gir også fare for påkjøring.", "Закон требует обратного: дистанция должна позволять обгоняющему безопасно встать между машинами (§ 5 nr 3). А маленькая дистанция ещё и грозит ударом в зад."],
        ["Avstanden er ikke viktig så lenge vi kjører sakte", "Дистанция неважна, пока едем медленно", "Også i lav fart kan bilen foran bremse brått. Avstanden skal hindre påkjøring uansett fart (§ 5 nr 3).", "И на малой скорости передняя машина может резко затормозить. Дистанция должна защищать от столкновения при любой скорости (§ 5 nr 3)."],
        ["Nøyaktig 50 meter, det står i loven", "Ровно 50 метров, так написано в законе", "Loven har ikke noe tall i meter. Den sier hva avstanden skal være god nok til (§ 5 nr 3). Tresekundersregelen er bare et hjelpemiddel.", "Числа в метрах в законе нет. Он говорит, для чего дистанция должна быть достаточной (§ 5 nr 3). Правило трёх секунд — лишь подсказка."]
      ],
      "Trafikkreglene § 5 nr 3: avstanden til bilen foran skal være så stor at du ikke kjører på den hvis den senker farten eller stanser. Avstanden skal også være slik at den som kjører forbi, uten fare kan kjøre inn mellom kjøretøyene. I en kø bak et sakte kjøretøy gjør du det lettere og tryggere for andre å kjøre forbi.",
      "Trafikkreglene § 5 nr 3: дистанция до впереди идущей машины должна быть такой, чтобы не врезаться, если она сбросит скорость или остановится. И такой, чтобы обгоняющий мог безопасно встать между машинами. В колонне за медленной машиной ты этим помогаешь другим обгонять безопасно.",
      "В колонне оставляй «карман» перед собой: это место для того, кто обгоняет, а не повод втиснуться."),

    q("116", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], signs: { south: "yield" }, lights: { south: "green", east: "red" } }),
      "Lyskryss. Du (A) skal rett fram og har grønt lys. Ved lyset står det også et vikepliktskilt for din veg. Bil B kommer fra høyre og har rødt lys. Hvem har vikeplikt?",
      "Перекрёсток со светофором. Ты (A) едешь прямо, у тебя зелёный. Рядом со светофором для твоей дороги стоит ещё и знак «Уступи дорогу». Машина B едет справа, у неё красный. Кто должен уступить?",
      [
        ["B, fordi trafikklyset gjelder foran vikepliktskiltet", "B: сигнал светофора важнее знака «Уступи дорогу»"],
        ["Jeg, fordi jeg har vikepliktskilt", "Я, потому что у меня знак «Уступи дорогу»", "Når lyset er i drift, gjelder lyset foran vikepliktskiltet (§ 3 nr 1). Skiltet får betydning når lyset er slått av eller blinker gult.", "Пока светофор работает, он важнее знака (§ 3 nr 1). Знак начинает действовать, когда светофор выключен или мигает жёлтым."],
        ["Jeg, fordi B kommer fra høyre", "Я, потому что B справа", "Høyreregelen gjelder bare når lys eller skilt ikke sier noe annet (§ 3 nr 1). Her har B rødt og skal stanse.", "Правило правой руки действует, только если светофор и знаки не говорят иного (§ 3 nr 1). Здесь у B красный, и он должен стоять."],
        ["Den som kommer først fram til krysset", "Тот, кто первым подъедет к перекрёстку", "Her er det lyset som bestemmer rekkefølgen, ikke hvem som er først.", "Очерёдность здесь задаёт светофор, а не то, кто приехал раньше."]
      ],
      "Trafikkreglene § 3 nr 1: anvisning gitt ved trafikklyssignal gjelder foran anvisning om vikeplikt gitt ved offentlig trafikkskilt. Du har grønt og kan kjøre, B har rødt og skal vente. Vikepliktskiltet gjelder når lyset er slått av eller blinker gult. Grønt lys betyr likevel ikke at du kan slutte å se deg for.",
      "Trafikkreglene § 3 nr 1: сигнал светофора важнее знака, который велит уступить. У тебя зелёный — едешь, у B красный — он ждёт. Знак «Уступи дорогу» действует, когда светофор выключен или мигает жёлтым. Но и на зелёный смотреть по сторонам всё равно нужно.",
      "Светофор работает — слушай светофор. Погас или мигает жёлтым — смотри на знак."),

    q("117", street({ features: [{ type: "zebra", y: 150 }], actors: [{ kind: "car", y: 110, color: "#e0483a", label: false, brake: true }, { kind: "car", y: 60, color: "#22a06b", label: false, brake: true }, { kind: "car", y: 10, color: "#f08c1a", label: false, brake: true }, { label: "A", y: 236, brake: true }], tags: [{ text: "KØ", x: 290, y: 60 }] }),
      "Du kjører i kø i en bygate. Rett foran deg er et gangfelt. Bilene på den andre siden av gangfeltet står stille, og det er ikke plass til bilen din der. Ingen fotgjengere er i gangfeltet akkurat nå. Hva gjør du?",
      "Ты едешь в пробке по городской улице. Прямо перед тобой пешеходный переход. Машины за переходом стоят, и места для твоей машины там нет. Пешеходов на переходе сейчас нет. Что делаешь?",
      [
        ["Venter foran gangfeltet til det er plass til hele bilen på den andre siden", "Жду перед переходом, пока за ним не освободится место для всей машины"],
        ["Kjører fram og blir stående på gangfeltet, siden ingen fotgjengere er der nå", "Проезжаю и стою на переходе — пешеходов ведь сейчас нет", "Fotgjengere kan komme når som helst, og da sperrer bilen din gangfeltet. Loven sier at du skal unngå stans på gangfelt (§ 9 nr 4).", "Пешеходы могут подойти в любую секунду, и твоя машина перекроет им переход. Закон требует избегать остановки на переходе (§ 9 nr 4)."],
        ["Kjører halvveis inn på gangfeltet, så bilene bak kommer litt fram", "Заезжаю на переход наполовину, чтобы машины сзади продвинулись", "Også halvveis på gangfeltet sperrer du for de gående. § 9 nr 4 gjelder hele gangfeltet.", "Даже наполовину стоя на переходе, ты мешаешь пешеходам. § 9 nr 4 касается всего перехода."],
        ["Kjører fram og stopper på gangfeltet, men slår på nødblinken", "Проезжаю, встаю на переходе, но включаю аварийку", "Nødblinken endrer ikke regelen: du skal unngå stans på gangfelt (§ 9 nr 4).", "Аварийка правило не отменяет: остановки на переходе нужно избегать (§ 9 nr 4)."]
      ],
      "Trafikkreglene § 9 nr 4: kjørende skal unngå stans på gangfelt. Når du står i kø, kjører du derfor ikke ut på gangfeltet før det er plass til hele bilen etter det. Da kan de gående krysse trygt.",
      "Trafikkreglene § 9 nr 4: водитель должен избегать остановки на пешеходном переходе. Поэтому в пробке не заезжай на переход, пока за ним не будет места для всей машины. Тогда пешеходы смогут спокойно перейти.",
      "Пробка перед «зеброй»: стоишь до перехода, пока за ним нет места на всю машину."),

    q("118", street({ sides: { left: "grass", right: "grass" }, actors: [{ kind: "car", y: 80, color: "#f3f5f7", label: false }, { kind: "officer", x: 300, y: 160, rot: 270 }, { label: "A", y: 200, brake: true }], tags: [{ text: "POLITIKONTROLL", x: 310, y: 60 }] }),
      "Politiet stanser deg i en trafikkontroll. Du har vist førerkortet, og nå går politibetjenten bort til politibilen for å sjekke noe. Du har det travelt. Hva gjør du?",
      "Полиция останавливает тебя для проверки на дороге. Ты показал права, и теперь полицейский пошёл к своей машине что-то проверить. Ты торопишься. Что делаешь?",
      [
        ["Blir ved bilen min til kontrollen er ferdig eller jeg får lov til å kjøre", "Остаюсь у своей машины, пока проверка не закончится или мне не разрешат ехать"],
        ["Kjører videre, for jeg har jo vist førerkortet", "Уезжаю: права я уже показал", "Kontrollen er ikke ferdig før politiet sier det. Du skal bli ved bilen til kontrollen er avsluttet eller du har fått lov til å dra (bruksforskriften § 1-8 b).", "Проверка не окончена, пока это не скажет полиция. Нужно оставаться у машины, пока она не закончится или тебе не разрешат уехать (bruksforskriften § 1-8 b)."],
        ["Går en tur til kiosken i nærheten mens jeg venter", "Схожу пока в ближайший киоск", "Under kontrollen skal du oppholde deg ved kjøretøyet (bruksforskriften § 1-8 b), ikke gå fra det.", "Во время проверки нужно оставаться у машины (bruksforskriften § 1-8 b), а не уходить от неё."],
        ["Kjører bilen et stykke fram til en bedre plass uten å si fra", "Отгоняю машину вперёд на место получше, никого не предупредив", "Under kontrollen skal du gjøre som politiet viser med tegn eller skilt (bruksforskriften § 1-8 a). Flytter du bilen på eget initiativ, kan det se ut som du kjører fra kontrollen.", "Во время проверки нужно делать так, как показывает полиция жестами или знаками (bruksforskriften § 1-8 a). Если сам переставишь машину, это может выглядеть как попытка уехать."]
      ],
      "Vegtrafikkloven § 10: føreren skal straks stanse for kontroll når politiet eller Statens vegvesen krever det, og vise fram dokumenter som det er påbudt å ha med under kjøringen. Bruksforskriften § 1-8: under kontrollen skal føreren gjøre som det blir vist med tegn eller skilt, og bli ved kjøretøyet til kontrollen er avsluttet eller til han har fått lov til å forlate stedet.",
      "Vegtrafikkloven § 10: водитель должен сразу остановиться, если этого требует полиция или Statens vegvesen, и показать документы, которые обязан иметь при себе. Bruksforskriften § 1-8: во время проверки водитель делает то, что показывают жестами или знаками, и остаётся у машины, пока проверка не закончится или ему не разрешат уехать.",
      "Проверку заканчивает полиция, а не ты: жди у машины, пока не скажут, что можно ехать."),

    q("119", street({ sides: { left: "grass", right: "grass" }, actors: [{ label: "A", y: 150, trailer: "caravan", path: [[216, 90]] }], tags: [{ text: "CAMPINGVOGN", x: 310, y: 220 }] }),
      "Du skal trekke en campingvogn som er bredere enn bilen. I de vanlige sidespeilene ser du bare veggene på campingvogna, ikke vegen bak den. Hva gjelder?",
      "Тебе нужно буксировать жилой прицеп (караван), который шире машины. В обычных боковых зеркалах видны только его стенки, а дороги за ним не видно. Что верно?",
      [
        ["Bilen må ha speil som viser begge sider av campingvogna og vegen bak, for eksempel forlengede speil", "На машине должны быть зеркала, в которых видны обе стороны каравана и дорога за ним — например, удлинённые зеркала"],
        ["Det er nok å bruke det innvendige speilet", "Достаточно внутреннего зеркала", "Campingvogna dekker utsikten bakover i det innvendige speilet. Er tilhengeren like bred som bilen eller bredere, skal begge sider av den kunne ses i de utvendige speilene (bruksforskriften § 4-2 nr 7).", "Караван закрывает обзор во внутреннем зеркале. А если прицеп не уже машины, обе его стороны должны быть видны в наружных зеркалах (bruksforskriften § 4-2 nr 7)."],
        ["Det går bra hvis en passasjer ser bakover og sier fra", "Нормально, если пассажир смотрит назад и подсказывает", "Kravet gjelder speilene på bilen. En passasjer kan ikke erstatte at du selv ser vegen bak i speilene (§ 4-2 nr 7).", "Требование касается зеркал на машине. Пассажир не заменит того, что ты сам видишь дорогу сзади в зеркалах (§ 4-2 nr 7)."],
        ["Det går bra hvis jeg kjører under 60 km/t", "Нормально, если ехать медленнее 60 км/ч", "Kravet om speil gjelder uansett fart. Lav fart hjelper ikke når du ikke ser bilene bak og ved siden av deg.", "Требование к зеркалам не зависит от скорости. Медленная езда не поможет, если не видишь машин сзади и сбоку."]
      ],
      "Bruksforskriften § 4-2 nr 7 a: når du trekker tilhenger, må minst ett speil vise tilhengeren. Er tilhengeren like bred som bilen eller bredere, skal begge sider av den kunne ses i de utvendige speilene. Speilene skal også vise vegbanen bak deg: minst 2,5 m bredt på venstre side og 2 m på høyre side, 10 m bak speilet. Klarer ikke de vanlige speilene dette, monterer du forlengede speil.",
      "Bruksforskriften § 4-2 nr 7 a: при буксировке прицепа хотя бы одно зеркало должно его показывать. Если прицеп не уже машины, обе его стороны должны быть видны в наружных зеркалах. И зеркала должны показывать дорогу сзади: слева полосу шириной не меньше 2,5 м, справа — 2 м, на расстоянии 10 м за зеркалом. Если обычные зеркала этого не дают, ставишь удлинённые.",
      "Прицеп шире машины — ставь удлинённые зеркала ещё до выезда."),

    q("120", null,
      "Kryss uten skilt og lys. Du (A) skal svinge til venstre. Den møtende bilen B skal også svinge til venstre. Hvordan kan dere svinge?",
      "Перекрёсток без знаков и светофора. Ты (A) поворачиваешь налево. Встречная машина B тоже поворачивает налево. Как вы можете повернуть?",
      [
        ["Vi kan svinge samtidig, foran hverandre, når det er plass og ingen andre hindres", "Можем повернуть одновременно, «перед носом» друг у друга, если хватает места и мы никому не мешаем"],
        ["Vi må kjøre rundt hverandre, forbi midten av krysset, før vi svinger", "Мы должны объехать друг друга за центром перекрёстка и только потом повернуть", "Loven sier at møtende biler kan svinge til venstre for hverandre, altså foran hverandre (§ 6 nr 4). Det er ikke et krav å kjøre rundt midten.", "Закон разрешает встречным поворачивать налево «перед» друг другом (§ 6 nr 4). Объезжать за центром перекрёстка не требуется."],
        ["Det er aldri lov å svinge samtidig, én av oss må vente", "Одновременно поворачивать нельзя никогда, один должен ждать", "Trafikkreglene § 6 nr 4 tillater nettopp at møtende biler svinger til venstre samtidig. Dere venter bare hvis det ikke er plass.", "Trafikkreglene § 6 nr 4 как раз разрешает встречным одновременно поворачивать налево. Ждать нужно, только если не хватает места."],
        ["Begge må først stanse helt midt i krysset", "Сначала обе машины должны полностью остановиться в центре перекрёстка", "Ingen regel krever full stans midt i krysset. Du stanser bare hvis du må vike for noen, for eksempel gående.", "Никакое правило не требует полной остановки в центре перекрёстка. Останавливаешься, только если нужно кого-то пропустить, например пешехода."]
      ],
      "Trafikkreglene § 6 nr 4: kjøretøy som kommer fra motsatte retninger, kan svinge til venstre for hverandre. Det betyr at to møtende biler som begge skal til venstre, kan svinge foran hverandre samtidig, hvis det er plass. På tovegs veg legger du deg så nær midten som mulig før svingen (§ 6 nr 2). Husk fortsatt gående og syklende i vegen du svinger inn i (§ 7 nr 3).",
      "Trafikkreglene § 6 nr 4: машины, едущие навстречу друг другу, могут поворачивать налево «перед» друг другом. То есть две встречные машины, которые обе поворачивают налево, могут повернуть одновременно, если места хватает. Перед поворотом на двусторонней дороге держишься как можно ближе к середине (§ 6 nr 2). И не забывай про пешеходов и велосипедистов на дороге, куда поворачиваешь (§ 7 nr 3).",
      "Оба налево навстречу — поворачиваете одновременно, «перед носом» друг у друга, если есть место."),

    q("121", street({ lanes: ["down", "up", "up"], sides: { left: "walk", right: "walk" }, features: [{ type: "sideRoad", y: 70, side: "right", w: 52 }], actors: [{ label: "A", lane: "upLeft", y: 240, blink: "right" }] }),
      "Du kjører i venstre felt på en bygate med to felt i din retning. I neste kryss skal du svinge til høyre. Hva gjør du?",
      "Ты едешь по левой полосе городской улицы, где в твою сторону две полосы. На следующем перекрёстке тебе направо. Что делаешь?",
      [
        ["Skifter i god tid til høyre felt, viker for dem som er der, og svinger fra høyre felt", "Заранее перестраиваюсь в правую полосу, пропуская тех, кто в ней едет, и поворачиваю из правой полосы"],
        ["Blir i venstre felt og svinger rett til høyre derfra, når jeg har blinket", "Остаюсь в левой полосе и поворачиваю направо прямо из неё, включив поворотник", "Ved sving til høyre skal du i god tid legge deg i feltet lengst til høyre (§ 6 nr 1). Blinklyset gir deg ikke rett til å svinge over høyre felt.", "Перед правым поворотом нужно заранее встать в крайнюю правую полосу (§ 6 nr 1). Поворотник не даёт права поворачивать через правую полосу."],
        ["Kjører helt fram til krysset i venstre felt og skifter felt i selve krysset", "Доезжаю до перекрёстка в левой полосе и перестраиваюсь прямо на перекрёстке", "Feltskiftet skal skje i god tid før krysset (§ 6 nr 1). I krysset blir det uventet og farlig for dem i høyre felt.", "Перестраиваться нужно заранее, до перекрёстка (§ 6 nr 1). На самом перекрёстке это неожиданно и опасно для тех, кто в правой полосе."],
        ["Det spiller ingen rolle hvilket felt jeg svinger fra, bare jeg ser meg godt for", "Неважно, из какой полосы поворачивать, главное — хорошо смотреть по сторонам", "Loven sier tydelig hvilket felt du skal bruke: lengst til høyre ved sving til høyre (§ 6 nr 1).", "Закон прямо говорит, какую полосу использовать: крайнюю правую при повороте направо (§ 6 nr 1)."]
      ],
      "Trafikkreglene § 6 nr 1: på kjørebane med to eller flere felt i kjøreretningen skal du i god tid kjøre inn i feltet lengst til høyre når du skal svinge til høyre. Når du skifter felt, har du vikeplikt for dem som allerede er i feltet (§ 8 nr 1), og du gir tegn med blinklys (§ 14 nr 2). Selve svingen tar du så nær høyre kant som mulig (§ 6 nr 2).",
      "Trafikkreglene § 6 nr 1: на проезжей части с двумя и более полосами в твою сторону перед правым поворотом нужно заранее перестроиться в крайнюю правую полосу. При перестроении ты уступаешь тем, кто уже едет в этой полосе (§ 8 nr 1), и включаешь поворотник (§ 14 nr 2). Сам поворот делаешь как можно ближе к правому краю (§ 6 nr 2).",
      "Направо — из крайней правой, налево — из крайней левой. Перестраиваться заранее, а не на перекрёстке."),

    q("122", street({ sides: { left: "grass", right: "grass" }, weather: "night", actors: [{ label: "B", lane: "left", y: 50, color: "#e0483a", beams: "low" }, { label: "A", y: 240, beams: "low" }] }),
      "Det er mørkt, og du kjører på en landeveg uten gatelys. En bil kommer imot, så du har blendet ned til nærlys. Nå ser du vegen bare et kort stykke foran deg. Hva gjelder for farten din?",
      "Темно, ты едешь по загородной дороге без фонарей. Навстречу едет машина, поэтому ты переключился на ближний свет. Теперь дорогу видно только на небольшом расстоянии впереди. Что верно про твою скорость?",
      [
        ["Jeg må holde så lav fart at jeg kan stanse på den strekningen jeg ser", "Нужно ехать так медленно, чтобы успеть остановиться на том участке, который я вижу"],
        ["Jeg kan holde fartsgrensen, det varer jo bare noen sekunder", "Можно держать разрешённую скорость, это ведь всего на несколько секунд", "Fartsgrensen er bare den høyeste farten. Du må uansett kunne stanse på den strekningen du har oversikt over (§ 13 nr 1), også i noen sekunder.", "Ограничение — это лишь максимум. Ты в любом случае должен успеть остановиться на видимом участке (§ 13 nr 1), даже на несколько секунд."],
        ["Jeg beholder fjernlyset til bilen har passert, så jeg ser lenger", "Оставляю дальний, пока машина не проедет — так видно дальше", "Fjernlyset må ikke blende andre (§ 15 nr 2). Du blender ned og tilpasser farten i stedet.", "Дальний свет не должен ослеплять других (§ 15 nr 2). Ты переключаешься на ближний и снижаешь скорость."],
        ["Jeg kan kjøre som før, for lyset fra den møtende bilen lyser opp vegen", "Можно ехать как прежде: фары встречной машины освещают дорогу", "Lyset fra møtende bil blender deg heller og gjør det vanskeligere å se folk og dyr i vegkanten. Du må kunne stanse på det du selv ser (§ 13 nr 1).", "Фары встречной скорее слепят и мешают заметить людей и животных у обочины. Остановиться нужно успеть на том, что видишь ты сам (§ 13 nr 1)."]
      ],
      "Trafikkreglene § 13 nr 1: kjørende må kunne stanse på den vegstrekningen de har oversikt over, og foran enhver påregnelig hindring. Med nærlys ser du kortere enn med fjernlys. Derfor må du ofte senke farten når du blender ned, for eksempel for en fotgjenger i mørke klær eller et dyr i vegen.",
      "Trafikkreglene § 13 nr 1: водитель должен успеть остановиться на участке дороги, который он видит, и перед любым препятствием, которое можно ожидать. С ближним светом видно меньше, чем с дальним. Поэтому, переключившись на ближний, часто нужно сбросить скорость — например, из-за пешехода в тёмной одежде или животного на дороге.",
      "Правило: видишь меньше — едешь медленнее. Тормозной путь должен помещаться в освещённый участок."),

    q("123", street({ features: [{ type: "busStop", y: 110, side: "right" }], actors: [{ label: "A", y: 150, blink: "right", brake: true }, { kind: "adult", x: 244, y: 164, rot: 90, color: "#6b4fa0" }], tags: [{ text: "HOLDEPLASS", x: 320, y: 60 }] }),
      "Du skal slippe av en venn ved et skilt for bussholdeplass i en bygate. Du står i et vanlig kjørefelt, ikke i kollektivfelt. Ingen buss er i nærheten, og vennen går rett ut av bilen. Er det lov å stanse her for dette?",
      "Ты хочешь высадить друга у знака автобусной остановки на городской улице. Ты в обычной полосе, не в полосе для общественного транспорта. Автобуса поблизости нет, и друг сразу выходит. Можно здесь для этого остановиться?",
      [
        ["Ja, kort stans for av- eller påstigning er lov når det ikke hindrer bussen", "Да, короткая остановка для высадки или посадки разрешена, если она не мешает автобусу"],
        ["Nei, stans er forbudt nærmere enn 20 meter fra skiltet, uten unntak", "Нет, ближе 20 метров от знака остановка запрещена без исключений", "Forbudet på 20 meter har et unntak: av- eller påstigning er lov når det ikke er til hinder for buss, drosje eller sporvogn (§ 17 nr 1 h).", "У запрета в 20 метров есть исключение: высадка и посадка разрешены, если не мешают автобусу, такси или трамваю (§ 17 nr 1 h)."],
        ["Ja, og jeg kan også vente der i ti minutter til vennen kommer tilbake", "Да, и ещё могу подождать там минут десять, пока друг не вернётся", "Unntaket gjelder bare selve av- og påstigningen. Å vente der er vanlig stans, og det er forbudt nærmere enn 20 meter fra skiltet (§ 17 nr 1 h).", "Исключение касается только самой высадки и посадки. Ждать там — это обычная остановка, а она запрещена ближе 20 метров от знака (§ 17 nr 1 h)."],
        ["Ja, selv om en buss står rett bak meg og vil inn til holdeplassen", "Да, даже если сзади стоит автобус и хочет подъехать к остановке", "Da er stansen til hinder for bussen, og unntaket gjelder ikke (§ 17 nr 1 h). Kjør videre og slipp av vennen et annet sted.", "Тогда ты мешаешь автобусу, и исключение не действует (§ 17 nr 1 h). Проезжай дальше и высади друга в другом месте."]
      ],
      "Trafikkreglene § 17 nr 1 h: det er forbudt å stanse på vegutvidelse for holdeplass for buss, drosje eller sporvogn, eller nærmere enn 20 meter fra skiltet for slik holdeplass. Unntatt er av- eller påstigning når den ikke er til hinder for buss, drosje eller sporvogn. I kollektivfelt er det likevel forbudt å stanse (§ 17 nr 1 g).",
      "Trafikkreglene § 17 nr 1 h: запрещено останавливаться в «кармане» остановки автобуса, такси или трамвая и ближе 20 метров от знака такой остановки. Исключение — высадка или посадка пассажиров, если это не мешает автобусу, такси или трамваю. Но в полосе для общественного транспорта останавливаться всё равно нельзя (§ 17 nr 1 g).",
      "У остановки: высадить друга можно быстро и если автобуса нет; ждать там нельзя.")

  ];
})();
