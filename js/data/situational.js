/* Банк вопросов: ситуационные задачи (перекрёстки, приоритет, круговое движение).
   Схемы перекрёстков рисуются функцией scene(). Ты — всегда машина «A» (синяя). */

(function () {
  "use strict";

  const POS = {
    south: { x: 100, y: 158, rot: 0 },
    north: { x: 100, y: 42, rot: 180 },
    east:  { x: 158, y: 100, rot: 270 },
    west:  { x: 42,  y: 100, rot: 90 }
  };
  const EXIT = { north: [100, 10], south: [100, 190], east: [190, 100], west: [10, 100] };
  const ENTRY = { north: [100, 60], south: [100, 140], east: [140, 100], west: [60, 100] };

  function car(from, to, label, color, kind) {
    const p = POS[from];
    const path = `M ${ENTRY[from][0]} ${ENTRY[from][1]} L 100 100 L ${EXIT[to][0]} ${EXIT[to][1]}`;
    if (kind === "bike") {
      const bx = from === "south" ? 118 : from === "north" ? 82 : p.x;
      const by = from === "south" ? 150 : from === "north" ? 50 : p.y;
      return `
        <path d="M ${bx} ${by} L ${bx} 12" stroke="${color}" stroke-width="2.5" fill="none" stroke-dasharray="4 4" opacity="0.9"/>
        <circle cx="${bx}" cy="${by}" r="7" fill="${color}"/>
        <text x="${bx}" y="${by + 4}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="9" fill="#fff">${label}</text>`;
    }
    return `
      <path d="${path}" stroke="${color}" stroke-width="3" fill="none" stroke-dasharray="5 4" opacity="0.85"/>
      <g transform="translate(${p.x} ${p.y}) rotate(${p.rot})">
        <rect x="-9" y="-15" width="18" height="30" rx="4" fill="${color}"/>
        <rect x="-6" y="-10" width="12" height="7" rx="2" fill="#fff" opacity="0.6"/>
        <text x="0" y="9" text-anchor="middle" font-family="Arial" font-weight="700" font-size="11" fill="#fff"
          transform="rotate(${-p.rot})">${label}</text>
      </g>`;
  }

  function lightMarker(side, color) {
    const spots = { south: [132, 132], north: [68, 68], east: [132, 68], west: [68, 132] };
    const [x, y] = spots[side];
    const fill = color === "green" ? "#2aa46a" : color === "yellow" ? "#f6c945" : "#d81e1e";
    return `<rect x="${x - 6}" y="${y - 9}" width="12" height="18" rx="3" fill="#222"/>
      <circle cx="${x}" cy="${y}" r="4" fill="${fill}"/>`;
  }

  function signMarker(side, kind) {
    const spots = { south: [132, 150], north: [68, 50], east: [150, 68], west: [50, 132] };
    const [x, y] = spots[side];
    if (kind === "yield") return `<polygon points="${x-7},${y-6} ${x+7},${y-6} ${x},${y+7}" fill="#fff" stroke="#d81e1e" stroke-width="2.5"/>`;
    if (kind === "priority") return `<polygon points="${x},${y-8} ${x+8},${y} ${x},${y+8} ${x-8},${y}" fill="#f6c945" stroke="#fff" stroke-width="2"/>`;
    if (kind === "stop") return `<polygon points="${x-4},${y-8} ${x+4},${y-8} ${x+8},${y-4} ${x+8},${y+4} ${x+4},${y+8} ${x-4},${y+8} ${x-8},${y+4} ${x-8},${y-4}" fill="#d81e1e"/>`;
    return "";
  }

  function scene(cfg) {
    const cars = [car(cfg.you.from, cfg.you.to, "A", "#1d5fd6")];
    const palette = ["#e0483a", "#2aa46a", "#f0a020"];
    (cfg.others || []).forEach((o, i) => cars.push(car(o.from, o.to, o.label || String.fromCharCode(66 + i), o.kind === "bike" ? "#2aa46a" : palette[i % 3], o.kind)));
    const signs = Object.keys(cfg.signs || {}).map(side => signMarker(side, cfg.signs[side])).join("");
    const lights = Object.keys(cfg.lights || {}).map(side => lightMarker(side, cfg.lights[side])).join("");
    const roundabout = cfg.roundabout ? `
      <circle cx="100" cy="100" r="38" fill="#6b7280"/>
      <circle cx="100" cy="100" r="16" fill="#3f9d5a"/>` : "";
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="scene-icon">
      <rect width="200" height="200" fill="#e9f0e6"/>
      <rect x="75" y="0" width="50" height="200" fill="#6b7280"/>
      <rect x="0" y="75" width="200" height="50" fill="#6b7280"/>
      ${cfg.roundabout ? "" : `
      <line x1="100" y1="0" x2="100" y2="75" stroke="#f6c945" stroke-width="2" stroke-dasharray="6 5"/>
      <line x1="100" y1="125" x2="100" y2="200" stroke="#f6c945" stroke-width="2" stroke-dasharray="6 5"/>
      <line x1="0" y1="100" x2="75" y2="100" stroke="#f6c945" stroke-width="2" stroke-dasharray="6 5"/>
      <line x1="125" y1="100" x2="200" y2="100" stroke="#f6c945" stroke-width="2" stroke-dasharray="6 5"/>`}
      ${roundabout}
      ${signs}
      ${lights}
      ${cars.join("")}
    </svg>`;
  }
  window.SCENE = scene;

  function q(id, image, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "sit-" + id, topic: "situational", type: "single-choice",
      prompt_no, prompt_ru, image,
      options: opts.map((o, i) => ({ text_no: o[0], text_ru: o[1], correct: i === 0 })),
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
        ["B må vike fordi du kjører rett fram", "B уступает, потому что ты едешь прямо"],
        ["Den som kommer først kjører først", "Кто первый приехал, тот и едет"],
        ["Ingen har vikeplikt", "Никто не обязан уступать"]
      ],
      "I kryss uten skilt eller lys gjelder høyreregelen: du har vikeplikt for trafikk fra høyre.",
      "На перекрёстке без знаков и светофора действует правило правой руки: уступаешь тем, кто справа.",
      "«Прямо» не даёт приоритета. Только знаки, светофор или сторона (право) решают, кто едет первым."),

    q("002", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }] }),
      "Kryss uten skilt. Bil B kommer fra venstre. Hva gjør du?",
      "Перекрёсток без знаков. Машина B едет слева. Что делаешь?",
      [
        ["Kjører — B har vikeplikt for meg", "Еду — B должна уступить мне"],
        ["Stopper og venter på B", "Останавливаюсь и жду B"],
        ["Blinker og lar B kjøre først", "Мигаю фарами и пропускаю B"],
        ["Kjører fortere for å komme foran", "Ускоряюсь, чтобы проехать первым"]
      ],
      "Du er til høyre for B, så B må vike for deg. Men vær alltid klar til å bremse hvis B ikke viker.",
      "Ты справа от B, значит B уступает тебе. Но всегда будь готов затормозить, если B не уступит.",
      "Иметь приоритет ≠ можно не смотреть. На экзамене ценится «kjøre defensivt» — ехать с запасом."),

    q("003", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], signs: { south: "yield" } }),
      "Du (A) har vikepliktskilt. Bil B kommer fra høyre på kryssende vei. Hva gjør du?",
      "У тебя (A) знак «уступи дорогу». Машина B едет справа по пересекаемой дороге. Что делаешь?",
      [
        ["Senker farten og viker for B", "Снижаю скорость и уступаю B"],
        ["Kjører — jeg er allerede nær krysset", "Еду — я уже близко к перекрёстку"],
        ["Stopper helt selv om ingen kommer", "Полностью останавливаюсь, даже если никого нет"],
        ["Tuter for å varsle B", "Сигналю, чтобы предупредить B"]
      ],
      "Vikeplikt betyr at du må vike for ALL trafikk på kryssende vei — både fra høyre og venstre. Du trenger ikke stoppe hvis veien er fri.",
      "«Уступи дорогу» означает: уступаешь ВСЕМ на пересекаемой дороге — и справа, и слева. Останавливаться не обязательно, если дорога свободна.",
      "Vikeplikt ≠ Stopp. При vikeplikt можно проехать не останавливаясь, если никому не мешаешь."),

    q("004", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], signs: { south: "priority" } }),
      "Du (A) kjører på forkjørsvei. Bil B kommer fra høyre fra sidevei. Hvem har vikeplikt?",
      "Ты (A) на главной дороге. Машина B выезжает справа с второстепенной. Кто уступает?",
      [
        ["B må vike — jeg er på forkjørsvei", "B уступает — я на главной дороге"],
        ["Jeg må vike — B kommer fra høyre", "Я уступаю — B справа"],
        ["Den som er størst kjører først", "Кто больше, тот и едет"],
        ["Begge må stoppe", "Оба должны остановиться"]
      ],
      "På forkjørsvei gjelder ikke høyreregelen. Trafikk fra sideveier må vike for deg.",
      "На главной дороге правило правой руки не действует. Транспорт с боковых дорог уступает тебе.",
      "Жёлтый ромб «отключает» правило правой руки. Это одна из главных ловушек на теории."),

    q("005", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }] }),
      "Du (A) skal svinge til venstre. Bil B kommer rett imot og skal rett fram. Hvem viker?",
      "Ты (A) поворачиваешь налево. Машина B едет навстречу прямо. Кто уступает?",
      [
        ["Jeg viker — møtende trafikk rett fram har forrang", "Я уступаю — встречный, едущий прямо, имеет преимущество"],
        ["B viker — jeg var først i krysset", "B уступает — я первый на перекрёстке"],
        ["Jeg svinger raskt før B kommer", "Быстро поворачиваю до приезда B"],
        ["Høyreregelen avgjør", "Решает правило правой руки"]
      ],
      "Når du svinger til venstre, må du vike for møtende trafikk som kjører rett fram eller svinger til høyre.",
      "При повороте налево ты уступаешь встречному транспорту, который едет прямо или поворачивает направо.",
      "Поворот налево — самый «слабый» манёвр на перекрёстке: уступаешь встречным, пешеходам, велосипедистам."),

    q("006", scene({ you: { from: "south", to: "east" }, others: [{ from: "north", to: "west" }] }),
      "Du (A) svinger til høyre. Møtende bil B svinger til venstre inn på samme vei. Hvem har forrang?",
      "Ты (A) поворачиваешь направо. Встречная машина B поворачивает налево на ту же дорогу. У кого преимущество?",
      [
        ["Jeg — den som svinger til venstre må vike", "У меня — поворачивающий налево уступает"],
        ["B — den som svinger til venstre har forrang", "У B — поворачивающий налево имеет преимущество"],
        ["Vi må begge stoppe og avtale", "Оба останавливаемся и договариваемся"],
        ["Den raskeste bilen", "У более быстрой машины"]
      ],
      "Høyresving går foran venstresving. B må vente til du har svingt.",
      "Поворот направо важнее поворота налево. B ждёт, пока ты повернёшь.",
      "Правило простое: налево — уступаешь всем встречным, включая тех, кто поворачивает направо."),

    q("007", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], roundabout: true }),
      "Du (A) skal inn i en rundkjøring. Bil B er allerede inne i rundkjøringen. Hva gjør du?",
      "Ты (A) въезжаешь на круг. Машина B уже на кругу. Что делаешь?",
      [
        ["Viker for B — trafikk i rundkjøringen har forrang", "Уступаю B — те, кто на кругу, имеют преимущество"],
        ["Kjører inn — B kommer fra venstre", "Въезжаю — B едет слева"],
        ["Stopper alltid før rundkjøringen", "Всегда останавливаюсь перед кругом"],
        ["Kjører inn og tuter", "Въезжаю и сигналю"]
      ],
      "Ved rundkjøring er det alltid vikeplikt for trafikk som allerede er i rundkjøringen, uansett hvor den kommer fra.",
      "На круговом движении всегда уступаешь тем, кто уже на кругу, откуда бы они ни ехали.",
      "Круг — исключение из правила правой руки: там уступаешь тем, кто слева (уже на кругу)."),

    q("008", scene({ you: { from: "south", to: "east" }, roundabout: true }),
      "Du kjører ut av rundkjøringen i første avkjøring (til høyre). Skal du bruke blinklys?",
      "Ты выезжаешь с круга на первом съезде (направо). Нужно ли включать поворотник?",
      [
        ["Ja — høyre blinklys når jeg skal ut", "Да — правый поворотник при выезде"],
        ["Nei — blinklys brukes ikke i rundkjøring", "Нет — на кругу поворотники не используются"],
        ["Ja — venstre blinklys", "Да — левый поворотник"],
        ["Bare hvis det er andre biler", "Только если есть другие машины"]
      ],
      "Du skal alltid gi tegn med høyre blinklys når du forlater rundkjøringen. Skal du langt rundt, bruker du venstre blinklys inn.",
      "Всегда включай правый поворотник при выезде с круга. Если едешь далеко по кругу (налево) — при въезде включи левый.",
      "Правило «правый при выезде» экзаменатор проверяет каждый раз. Забыл — это ошибка на практике."),

    q("009", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], signs: { south: "stop" } }),
      "Du (A) har stoppskilt. Veien ser tom ut, men B nærmer seg fra venstre. Hva gjør du?",
      "У тебя (A) знак STOP. Дорога кажется пустой, но B приближается слева. Что делаешь?",
      [
        ["Stopper helt ved stopplinjen, ser, og viker for B", "Полностью останавливаюсь у стоп-линии, смотрю и уступаю B"],
        ["Senker farten og kjører — veien er nesten tom", "Снижаю скорость и еду — дорога почти пустая"],
        ["Kjører fordi B kommer fra venstre", "Еду, потому что B слева"],
        ["Stopper midt i krysset", "Останавливаюсь посреди перекрёстка"]
      ],
      "Stoppskilt krever full stopp uansett. Etter stoppet har du vikeplikt for all trafikk på kryssende vei.",
      "Знак STOP требует полной остановки в любом случае. После остановки уступаешь всем на пересекаемой дороге.",
      "У STOP «слева/справа» неважно — уступаешь всем. Твоя обязанность = остановиться + уступить."),

    q("010", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }] }),
      "Du kjører rett fram og kommer til et kryss der trafikklyset er grønt for deg. Bil B fra høyre har rødt. Hva gjelder?",
      "Ты едешь прямо, для тебя зелёный. Машина B справа — на красный. Что действует?",
      [
        ["Jeg kjører — lyssignal går foran høyreregelen", "Еду — светофор важнее правила правой руки"],
        ["Jeg viker for B fordi B er til høyre", "Уступаю B, потому что B справа"],
        ["Jeg stopper for sikkerhets skyld", "Останавливаюсь на всякий случай"],
        ["Grønt lys betyr bare at jeg KAN kjøre hvis B viker", "Зелёный значит, что я могу ехать только если B уступит"]
      ],
      "Trafikklys går foran både skilt og høyreregelen. Grønt lys = du kan kjøre, men fortsatt med aktsomhet.",
      "Светофор важнее и знаков, и правила правой руки. Зелёный — можно ехать, но с осторожностью.",
      "Иерархия: указания полицейского > светофор > знаки > правило правой руки."),

    q("011", scene({ you: { from: "south", to: "north" } }),
      "Du nærmer deg et gangfelt. En fotgjenger står på fortauet og ser ut til å ville krysse. Hva gjør du?",
      "Ты подъезжаешь к пешеходному переходу. Пешеход стоит на тротуаре и, похоже, хочет перейти. Что делаешь?",
      [
        ["Senker farten og stopper for å slippe fotgjengeren over", "Снижаю скорость и останавливаюсь, чтобы пропустить"],
        ["Kjører — fotgjengeren er ikke i veien ennå", "Еду — пешеход ещё не на дороге"],
        ["Tuter så fotgjengeren venter", "Сигналю, чтобы пешеход подождал"],
        ["Kjører raskere for å passere før fotgjengeren går", "Ускоряюсь, чтобы проехать до него"]
      ],
      "Du har vikeplikt for fotgjengere som er i gangfeltet ELLER på vei ut i det. Vis tydelig at du stopper.",
      "Ты уступаешь пешеходу, который на переходе ИЛИ собирается ступить на него. Покажи явно, что останавливаешься.",
      "В Норвегии нормально уступать пешеходу, который только собирается перейти. Так и на экзамене ожидают."),

    q("012", scene({ you: { from: "south", to: "north" }, others: [{ from: "north", to: "south" }] }),
      "Smal vei med møteplass på din side. Bil B kommer imot. Hvem skal vente?",
      "Узкая дорога, карман для разъезда на твоей стороне. Машина B едет навстречу. Кто ждёт?",
      [
        ["Jeg — møteplassen er på min side", "Я — карман на моей стороне"],
        ["B — jeg kom først", "B — я приехал первым"],
        ["Den som har størst bil", "У кого машина больше"],
        ["Ingen — vi klemmer oss forbi", "Никто — протискиваемся"]
      ],
      "På smal vei bruker du møteplassen som er på din side. Du rygger ikke inn i møteplass på motsatt side.",
      "На узкой дороге используешь карман, который на твоей стороне. Задним ходом в карман на противоположной стороне не заезжают.",
      "На норвежских узких дорогах (særlig på Vestlandet) знак «M» = møteplass. Кому он ближе, тот и ждёт."),

    q("013", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }, { from: "west", to: "east" }] }),
      "Kryss uten skilt. B kommer fra høyre, C fra venstre. I hvilken rekkefølge kjører dere?",
      "Перекрёсток без знаков. B справа, C слева. В каком порядке все проезжают?",
      [
        ["B, så jeg (A), så C", "B, потом я (A), потом C"],
        ["Jeg (A), så B, så C", "Я (A), потом B, потом C"],
        ["C, så B, så jeg (A)", "C, потом B, потом я (A)"],
        ["Alle kjører samtidig", "Все едут одновременно"]
      ],
      "Høyreregelen i kjede: B har ingen til høyre og kjører først. Du viker for B, C viker for deg.",
      "Правило правой руки цепочкой: у B никого справа — едет первым. Ты уступаешь B, C уступает тебе.",
      "Найди того, у кого справа никого нет — он едет первым. Дальше по цепочке."),

    q("014", scene({ you: { from: "south", to: "north" } }),
      "Du kjører ut fra en parkeringsplass og inn på veien. Hvem har vikeplikt?",
      "Ты выезжаешь с парковки на дорогу. Кто уступает?",
      [
        ["Jeg — den som kjører ut fra parkeringsplass, gårdsvei eller bensinstasjon viker for all trafikk", "Я — выезжающий с парковки, двора или заправки уступает всем"],
        ["Trafikken på veien viker for meg", "Транспорт на дороге уступает мне"],
        ["Høyreregelen gjelder", "Действует правило правой руки"],
        ["Ingen har vikeplikt", "Никто не уступает"]
      ],
      "Utkjøring fra parkeringsplass, gårdsvei, bensinstasjon o.l. gir alltid vikeplikt for trafikken på veien — også for fotgjengere på fortauet.",
      "Выезд с парковки, двора, заправки — ты всегда уступаешь транспорту на дороге и пешеходам на тротуаре.",
      "Здесь правило правой руки НЕ работает. Выезжающий со «второстепенной территории» уступает всем."),

    q("015", scene({ you: { from: "south", to: "north" }, others: [{ from: "north", to: "south" }] }),
      "En buss med blinklys signaliserer at den vil kjøre ut fra holdeplass i 50-sone. Hva gjør du?",
      "Автобус с поворотником показывает, что выезжает с остановки в зоне 50 км/ч. Что делаешь?",
      [
        ["Slipper bussen ut — den har forrang i 60-sone eller lavere", "Пропускаю автобус — он имеет преимущество в зоне до 60 км/ч"],
        ["Kjører forbi — bussen må vente", "Проезжаю мимо — автобус ждёт"],
        ["Tuter for å vise at jeg kommer", "Сигналю, что еду"],
        ["Stopper helt bak bussen", "Полностью останавливаюсь за автобусом"]
      ],
      "Der fartsgrensen er 60 km/t eller lavere, skal du slippe fram buss som gir tegn om å kjøre ut fra holdeplass.",
      "Там, где ограничение 60 км/ч или ниже, ты обязан пропустить автобус, который показывает поворотником выезд с остановки.",
      "Это прямое правило норвежских ПДД — автобус в городе имеет преимущество при выезде с остановки."),

    q("016", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }] }),
      "Du hører sirene og ser en utrykningsbil med blålys komme fra høyre. Hva gjør du?",
      "Слышишь сирену и видишь машину с мигалками справа. Что делаешь?",
      [
        ["Gir fri vei — stopper eller kjører til siden trygt", "Освобождаю дорогу — безопасно останавливаюсь или сдвигаюсь в сторону"],
        ["Kjører videre — jeg hadde grønt lys", "Еду дальше — у меня был зелёный"],
        ["Kjører fortere for å komme unna", "Ускоряюсь, чтобы уехать"],
        ["Bremser hardt midt i krysset", "Резко торможу посреди перекрёстка"]
      ],
      "Utrykningskjøretøy med blålys og sirene har forrang foran alt annet. Gi fri vei, men ikke gjør noe farlig eller brått.",
      "Спецтранспорт с мигалками и сиреной имеет преимущество перед всем. Освободи дорогу, но без опасных резких манёвров.",
      "Не тормози резко посреди перекрёстка — лучше спокойно доехать до места, где можно безопасно уступить."),

    q("017", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "north" }] }),
      "T-kryss uten skilt. Du kjører på den gjennomgående vegen. Bil B kommer fra sidevegen til høyre. Hvem viker?",
      "Т-образный перекрёсток без знаков. Ты едешь по сквозной дороге. Машина B выезжает с боковой справа. Кто уступает?",
      [
        ["Jeg viker: høyreregelen gjelder også i T-kryss", "Я уступаю: правило правой руки действует и на Т-перекрёстке"],
        ["B viker: den gjennomgående vegen har forrang", "B уступает: у сквозной дороги приоритет"],
        ["Den som kommer først", "Кто первый приехал"],
        ["Ingen har vikeplikt", "Никто не уступает"]
      ],
      "I Norge gir ikke en gjennomgående veg forrang av seg selv. Uten skilt gjelder høyreregelen også i T-kryss.",
      "В Норвегии сквозная дорога сама по себе не даёт приоритета. Без знаков правило правой руки действует и на Т-перекрёстке.",
      "Ловушка для тех, кто учил ПДД в других странах: «прямая дорога главнее» здесь не работает. Ищи знак или уступай справа."),

    q("018", scene({ you: { from: "south", to: "east" } }),
      "Du har rødt lys og skal svinge til høyre. Ingen kommer. Kan du svinge?",
      "У тебя красный, ты поворачиваешь направо. Никого нет. Можно повернуть?",
      [
        ["Nei, rødt lys betyr stopp, også for høyresving", "Нет, красный означает стоп, в том числе для поворота направо"],
        ["Ja, høyresving på rødt er lov hvis det er fritt", "Да, направо на красный можно, если свободно"],
        ["Ja, hvis jeg stopper først", "Да, если сначала остановлюсь"],
        ["Ja, men bare om natten", "Да, но только ночью"]
      ],
      "I Norge finnes ikke «høyresving på rødt». Du venter på grønt eller grønn pil.",
      "В Норвегии нет «поворота направо на красный». Ждёшь зелёного или зелёной стрелки.",
      "Проезд на красный — 10 750 kr и 3 балла, даже если ты «только направо»."),

    q("019", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }] }),
      "Grønt lys. Du skal svinge til venstre, og møtende bil B skal rett fram, også på grønt. Hvem kjører først?",
      "Зелёный. Ты поворачиваешь налево, встречная B едет прямо, тоже на зелёный. Кто едет первым?",
      [
        ["B: jeg må vike for møtende trafikk selv om jeg har grønt", "B: я уступаю встречному, даже если у меня зелёный"],
        ["Jeg: grønt lys gir meg forrang", "Я: зелёный даёт мне преимущество"],
        ["Den som er raskest", "Кто быстрее"],
        ["Vi stopper begge", "Оба останавливаемся"]
      ],
      "Grønt lys betyr at du kan kjøre inn i krysset, men vikeplikten for møtende trafikk ved venstresving gjelder fortsatt.",
      "Зелёный означает, что можно въехать на перекрёсток, но обязанность уступить встречным при повороте налево остаётся.",
      "Зелёный — не «мне все уступают». При левом повороте встречный прямо всегда первый."),

    q("020", scene({ you: { from: "south", to: "east" } }),
      "Grønt lys, du svinger til høyre. Fotgjengere krysser på gangfeltet i gaten du svinger inn i, også på grønt. Hva gjør du?",
      "Зелёный, ты поворачиваешь направо. Пешеходы переходят по зебре на улице, куда ты сворачиваешь, тоже на зелёный. Что делаешь?",
      [
        ["Stopper og slipper fotgjengerne over", "Останавливаюсь и пропускаю пешеходов"],
        ["Kjører: jeg har grønt", "Еду: у меня зелёный"],
        ["Tuter så de skynder seg", "Сигналю, чтобы поторопились"],
        ["Kjører sakte mellom dem", "Медленно еду между ними"]
      ],
      "Når du svinger, har du vikeplikt for gående og syklende som krysser den vegen du svinger inn i.",
      "При повороте ты уступаешь пешеходам и велосипедистам, пересекающим дорогу, на которую сворачиваешь.",
      "Пешеходы на зелёный и ты на зелёный одновременно — норма в Норвегии. Ты ждёшь."),

    q("021", scene({ you: { from: "south", to: "north" }, roundabout: true }),
      "Rundkjøring med to felt. Du skal ta tredje avkjøring (til venstre). Hvilket felt velger du inn?",
      "Круг с двумя полосами. Тебе нужен третий съезд (налево). Какую полосу выбрать при въезде?",
      [
        ["Venstre felt, med venstre blinklys på vei inn", "Левую, с левым поворотником при въезде"],
        ["Høyre felt, det er alltid tryggest", "Правую, так всегда безопаснее"],
        ["Spiller ingen rolle", "Не имеет значения"],
        ["Midt mellom feltene", "Посередине между полосами"]
      ],
      "Skal du til venstre eller snu, bruker du venstre felt og gir tegn til venstre inn. Skift til høyre felt med høyre blinklys før avkjøringen.",
      "Если налево или разворот — левая полоса и левый поворотник при въезде. Перед съездом перестраивайся вправо с правым поворотником.",
      "Правая полоса — для первого и второго съезда. Левая — для третьего и разворота."),

    q("022", null,
      "Du kjører inn på motorveg via påkjøringsfelt. Hvem har vikeplikt?",
      "Ты въезжаешь на автомагистраль по полосе разгона. Кто уступает?",
      [
        ["Jeg: trafikken på motorvegen har forrang, men de bør legge til rette", "Я: у потока на магистрали приоритет, но они должны помогать"],
        ["Trafikken på motorvegen må slippe meg inn", "Поток на магистрали обязан меня пропустить"],
        ["Fletteregelen: annenhver bil", "Правило молнии: через одного"],
        ["Ingen, jeg kjører bare inn", "Никто, просто въезжаю"]
      ],
      "Den som kjører inn fra påkjøringsfelt har vikeplikt. Bruk hele feltet til å komme opp i fart, og velg en luke. Trafikken på motorvegen bør likevel gjøre det lett for deg.",
      "Въезжающий с полосы разгона уступает. Используй всю полосу, чтобы набрать скорость, и выбери просвет. Поток на магистрали при этом должен облегчать въезд.",
      "Не останавливайся в конце полосы разгона: набери скорость потока, иначе слияние станет опасным."),

    q("023", null,
      "Bilen foran deg gir tegn til venstre for å kjøre forbi en syklist. Du ville også kjørt forbi. Hva gjør du?",
      "Машина впереди включает левый поворотник, чтобы объехать велосипедиста. Ты тоже хотел обогнать. Что делаешь?",
      [
        ["Venter: det er forbudt å kjøre forbi en bil som selv kjører forbi eller gir tegn til det", "Жду: запрещено обгонять машину, которая сама обгоняет или показывает намерение"],
        ["Kjører forbi begge samtidig", "Обгоняю обоих сразу"],
        ["Tuter og kjører forbi på høyre side", "Сигналю и обгоняю справа"],
        ["Blinker med fjernlys", "Мигаю дальним"]
      ],
      "Du kan ikke kjøre forbi et kjøretøy som gir tegn til å svinge til venstre eller selv kjører forbi. Vent til situasjonen er klar.",
      "Нельзя обгонять машину, которая показывает поворот налево или сама обгоняет. Дождись, пока ситуация прояснится.",
      "«Обгон обгоняющего» — один из самых опасных манёвров и прямое нарушение."),

    q("024", scene({ you: { from: "south", to: "east" } }),
      "Du skal svinge til høyre i et kryss. Det er sykkelfelt på høyre side, og en syklist bak deg kjører rett fram. Hva gjør du?",
      "Ты поворачиваешь направо на перекрёстке. Справа велополоса, велосипедист сзади едет прямо. Что делаешь?",
      [
        ["Slipper syklisten fram før jeg svinger", "Пропускаю велосипедиста, потом поворачиваю"],
        ["Svinger raskt før syklisten kommer", "Быстро поворачиваю до велосипедиста"],
        ["Kjører inn i sykkelfeltet for å blokkere", "Въезжаю в велополосу, чтобы перекрыть"],
        ["Tuter og svinger", "Сигналю и поворачиваю"]
      ],
      "Ved høyresving over sykkelfelt har du vikeplikt for syklende som kjører rett fram, også de som kommer bakfra.",
      "При повороте направо через велополосу ты уступаешь велосипедистам, едущим прямо, в том числе тем, кто догоняет сзади.",
      "Перед поворотом направо — правое зеркало и взгляд через плечо. Это проверяют на oppkjøring."),

    q("025", null,
      "Det er mørkt, og du ser en fotgjenger i mørke klær som går på venstre side av en veg uten fortau. Hva gjør du?",
      "Темно, ты видишь пешехода в тёмной одежде, идущего по левой стороне дороги без тротуара. Что делаешь?",
      [
        ["Senker farten, holder god avstand og bruker nærlys", "Снижаю скорость, держу дистанцию, переключаюсь на ближний"],
        ["Blinker med fjernlys så han flytter seg", "Мигаю дальним, чтобы отошёл"],
        ["Kjører som normalt, han går riktig", "Еду как обычно, он идёт правильно"],
        ["Tuter", "Сигналю"]
      ],
      "Fotgjengere skal gå på venstre side mot trafikken der det ikke er fortau. Fjernlys blender. Senk farten og pass avstanden.",
      "Пешеходы без тротуара идут по левой стороне навстречу движению. Дальний свет слепит. Снизь скорость и держи дистанцию.",
      "Осенью и зимой в Норвегии темно большую часть дня. Пешеход без рефлекса виден с 25–30 м, с рефлексом — со 140 м."),

    q("026", scene({ you: { from: "south", to: "north" } }),
      "Du kjører ut fra et gatetun og inn på en vanlig gate. Hvem har vikeplikt?",
      "Ты выезжаешь из жилой зоны (gatetun) на обычную улицу. Кто уступает?",
      [
        ["Jeg: utkjøring fra gatetun gir vikeplikt for all trafikk", "Я: выезд из gatetun означает уступить всем"],
        ["Høyreregelen gjelder", "Действует правило правой руки"],
        ["Trafikken i gaten viker for meg", "Транспорт на улице уступает мне"],
        ["Ingen har vikeplikt", "Никто не уступает"]
      ],
      "Utkjøring fra gatetun, gågate, parkeringsplass, bensinstasjon eller gårdsveg gir alltid vikeplikt for trafikken du kjører inn i.",
      "Выезд из gatetun, gågate, парковки, заправки или двора всегда означает уступить транспорту, в который ты вливаешься.",
      "Все «выезды с территорий» работают одинаково: ты последний в очереди."),

    q("027", null,
      "Du kjører inn i en lang tunnel på en solfylt dag. Hva bør du gjøre?",
      "Ты въезжаешь в длинный тоннель в солнечный день. Что нужно сделать?",
      [
        ["Ta av solbriller og senk farten litt til øynene venner seg til mørket", "Сними солнцезащитные очки и немного снизь скорость, пока глаза привыкают к темноте"],
        ["Kjør som vanlig, tunnelen er godt opplyst", "Езжай как обычно, тоннель хорошо освещён"],
        ["Blink med fjernlys for å varsle andre", "Мигни дальним, чтобы предупредить остальных"],
        ["Øk farten for å komme fort ut", "Увеличь скорость, чтобы быстрее выехать"]
      ],
      "Øynene trenger tid til å venne seg til mørket etter sterkt sollys. Ta av solbriller, senk farten og hold god avstand de første sekundene.",
      "Глазам нужно время привыкнуть к темноте после яркого солнца. Сними очки, снизь скорость и держи увеличенную дистанцию первые секунды.",
      "Переход свет-тьма — частая причина растерянности у тоннеля. Заранее сбавь скорость и сними очки."),

    q("028", null,
      "Du kjenner deg svært trøtt mens du kjører på motorveien. Hva er riktig å gjøre?",
      "Ты чувствуешь сильную усталость за рулём на автомагистрали. Как правильно поступить?",
      [
        ["Stoppe på en rasteplass og hvile eller sove litt", "Остановиться на зоне отдыха и отдохнуть или немного поспать"],
        ["Skru opp musikken og åpne vinduet", "Включить музыку погромче и открыть окно"],
        ["Kjøre litt fortere for å komme fram raskere", "Ехать чуть быстрее, чтобы скорее доехать"],
        ["Fortsette, trøttheten går over av seg selv", "Продолжать ехать, усталость сама пройдёт"]
      ],
      "Trøtthet bak rattet er svært farlig og kan gi mikrosøvn. Musikk og åpent vindu hjelper bare kort tid. Riktig løsning er å stoppe og hvile.",
      "Усталость за рулём очень опасна и может вызвать микросон. Музыка и открытое окно помогают лишь ненадолго. Правильное решение — остановиться и отдохнуть.",
      "Микросон длится всего пару секунд, но на скорости 80 км/ч машина за это время проезжает десятки метров без контроля."),

    q("029", null,
      "Du har parkert langs høyre side av en trafikkert vei. Barnet ditt sitter i baksetet. Hvordan skal barnet gå ut av bilen?",
      "Ты припарковался у правого края оживлённой дороги. Ребёнок сидит на заднем сиденье. Как ребёнку выходить из машины?",
      [
        ["Gjennom døren mot fortauet, bort fra trafikken", "Через дверь со стороны тротуара, подальше от движения"],
        ["Gjennom døren mot kjørebanen, det går fortest", "Через дверь со стороны проезжей части, так быстрее"],
        ["Det spiller ingen rolle hvilken side", "Не важно, с какой стороны"],
        ["Barnet kan hoppe ut mens bilen ruller sakte", "Ребёнок может выпрыгнуть, пока машина медленно катится"]
      ],
      "Barn (og voksne) bør alltid gå ut på siden bort fra trafikken, altså mot fortauet, for å unngå å bli truffet av forbikjørende kjøretøy.",
      "Выходить нужно всегда со стороны, противоположной движению, то есть к тротуару, чтобы не попасть под проезжающую машину.",
      "Это правило касается всех пассажиров, но особенно важно для детей — приучи их к этому с первой поездки."),

    q("030", null,
      "Du kjører på landevei i skumringen og passerer et viltskilt med elg. Hva gjør du?",
      "Ты едешь по загородной дороге в сумерках и проезжаешь знак с изображением лося. Что делаешь?",
      [
        ["Senker farten og er klar til å bremse, dyr kommer ofte flere sammen", "Снижаю скорость и готов тормозить — животные часто идут группами"],
        ["Kjører som normalt, skiltet gjelder bare om natten", "Еду как обычно, знак действует только ночью"],
        ["Blinker med fjernlys for å skremme bort dyr", "Мигаю дальним, чтобы отпугнуть животных"],
        ["Øker farten for å passere risikoområdet raskt", "Увеличиваю скорость, чтобы быстрее проехать опасный участок"]
      ],
      "Viltskilt varsler områder med mye viltkryssing, spesielt i skumring og grålysning. Senk farten og vær ekstra oppmerksom — kommer ett dyr, følger ofte flere etter.",
      "Знак с животным предупреждает об участках с частым переходом диких животных, особенно в сумерках. Снизь скорость и будь особенно внимателен — если появилось одно животное, за ним часто следуют другие.",
      "Столкновение с лосем на скорости очень опасно из-за высоты животного. Лучше сбросить скорость заранее, чем экстренно тормозить."),

    q("031", null,
      "Du skal rygge en bil med tilhenger inn på en smal vei. Hva er viktig å huske?",
      "Тебе нужно сдать назад на машине с прицепом на узкую дорогу. Что важно помнить?",
      [
        ["Tilhengeren svinger motsatt vei av rattet, så styr rolig og bruk speilene", "Прицеп поворачивает в сторону, противоположную повороту руля, поэтому рули плавно и следи за зеркалами"],
        ["Tilhengeren følger rattet på samme måte som bilen", "Прицеп следует за рулём так же, как сама машина"],
        ["Det er forbudt å rygge med tilhenger", "Сдавать назад с прицепом запрещено"],
        ["Be en passasjer dytte tilhengeren i riktig retning", "Попросить пассажира толкать прицеп в нужную сторону"]
      ],
      "Når du rygger med tilhenger, svinger tilhengeren motsatt vei av det du dreier rattet. Styr i små bevegelser, bruk speilene aktivt, og be gjerne noen dirigere deg.",
      "При движении задним ходом с прицепом прицеп поворачивает в сторону, противоположную повороту руля. Работай рулём небольшими движениями, активно используй зеркала и, если можно, попроси кого-то направлять тебя.",
      "Потренируйся на пустой площадке заранее — реакция прицепа на руль непривычна большинству новичков."),

    q("032", null,
      "Det er en kald morgen, og du nærmer deg en bro. Veien før broen var tørr. Hva bør du tenke på?",
      "Холодное утро, ты приближаешься к мосту. Дорога перед мостом была сухой. О чём нужно помнить?",
      [
        ["Broer fryser først, det kan være is selv om resten av veien er tørr", "Мосты замерзают первыми — лёд может быть, даже если остальная дорога сухая"],
        ["Broer er alltid varmere enn veien, så is er usannsynlig", "Мосты всегда теплее дороги, поэтому лёд маловероятен"],
        ["Is dannes bare på veier med mye skygge", "Лёд появляется только на затенённых участках"],
        ["Broer saltes automatisk, så de er alltid trygge", "Мосты автоматически солятся, поэтому всегда безопасны"]
      ],
      "Broer er omgitt av kald luft på alle sider og mister varme raskere enn vanlig vei. De blir derfor ofte glatte og iskalde før resten av veien.",
      "Мосты окружены холодным воздухом со всех сторон и теряют тепло быстрее, чем обычная дорога. Поэтому они часто становятся скользкими раньше остальной трассы.",
      "Классическая ловушка теории: «мост сухой на вид» ≠ «мост не скользкий». Сбавляй скорость заранее."),

    q("033", null,
      "Du nærmer deg en planovergang (jernbaneovergang) uten bom, og det røde lyset blinker. Hva gjør du?",
      "Ты приближаешься к железнодорожному переезду без шлагбаума, мигает красный сигнал. Что делаешь?",
      [
        ["Stopper og venter til lyset slutter å blinke", "Останавливаюсь и жду, пока сигнал не перестанет мигать"],
        ["Kjører raskt over før toget kommer", "Быстро проезжаю, пока поезд не подъехал"],
        ["Kjører sakte over og ser meg for", "Медленно проезжаю, оглядываясь по сторонам"],
        ["Tuter og kjører over", "Сигналю и проезжаю"]
      ],
      "Blinkende rødt lys ved planovergang betyr at tog nærmer seg. Du skal stoppe og vente til lyset slukker, selv om du ikke ser bom eller tog ennå.",
      "Мигающий красный на переезде означает, что приближается поезд. Нужно остановиться и ждать, пока сигнал не погаснет, даже если шлагбаума или поезда ещё не видно.",
      "Тормозной путь поезда в разы длиннее, чем у машины. Никогда не пытайся проскочить на мигающий красный."),

    q("034", null,
      "Et langt vogntog foran deg skal svinge til høyre, men beveger seg først til venstre i kjørefeltet. Hva bør du gjøre?",
      "Длинный грузовик с прицепом впереди тебя собирается повернуть направо, но сначала смещается влево в полосе. Что нужно сделать?",
      [
        ["Holde god avstand og ikke kjøre forbi på høyre side", "Держать дистанцию и не пытаться обогнать справа"],
        ["Kjøre forbi på høyre side mens det er plass", "Обогнать справа, пока есть место"],
        ["Tute for å få vogntoget til å svinge med en gang", "Посигналить, чтобы грузовик повернул сразу"],
        ["Kjøre tett bak for å presse fram svingen", "Прижаться вплотную сзади, чтобы поторопить с поворотом"]
      ],
      "Lange kjøretøy må ofte svinge ut til motsatt side for å få plass til høyresvingen. Å kjøre forbi på høyre side da er svært farlig — bli liggende bak og vent.",
      "Длинным транспортным средствам часто нужно сместиться в противоположную сторону, чтобы вписаться в поворот направо. Обгонять справа в этот момент очень опасно — держись позади и жди.",
      "Это классическая ловушка «мёртвой зоны» у грузовиков — никогда не ныряй в пространство, которое освобождает длинномер перед поворотом.")
  ];
})();
