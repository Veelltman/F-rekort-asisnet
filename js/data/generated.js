/* Генерируемые задания: ситуации на перекрёстках (движок приоритета)
   и вопросы с числами (штрафы, баллы, дистанции, прицеп).
   У каждого типа стабильный id; fresh() каждый раз собирает новый сценарий. */

(function () {
  "use strict";
  const scene = window.SCENE;

  const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);

  /* ---------- Словарь ---------- */
  const TO = { north: "north", east: "east", west: "west" };
  const MAN = {
    north: { no: "rett fram", ru: "прямо" },
    west: { no: "til venstre", ru: "налево" },
    east: { no: "til høyre", ru: "направо" }
  };
  const FROM = {
    east: { no: "fra høyre", ru: "справа" },
    west: { no: "fra venstre", ru: "слева" },
    north: { no: "imot deg", ru: "навстречу" }
  };
  /* Манёвр машины B по её направлению въезда и выезда */
  function manOf(from, to) {
    const order = ["north", "east", "south", "west"];
    const i = order.indexOf(from), j = order.indexOf(to);
    const d = (j - i + 4) % 4;
    return d === 2 ? "straight" : d === 3 ? "right" : "left";
  }
  const MAN_KEY = { straight: { no: "rett fram", ru: "прямо" }, left: { no: "til venstre", ru: "налево" }, right: { no: "til høyre", ru: "направо" } };

  function toFor(from, man) {
    const order = ["north", "east", "south", "west"];
    const i = order.indexOf(from);
    const d = man === "straight" ? 2 : man === "right" ? 3 : 1;
    return order[(i + d) % 4];
  }

  /* ---------- Варианты ответов «кто уступает» ---------- */
  const WHO = {
    me: { no: "Jeg (A) må vike for B", ru: "Я (A) уступаю B",
      why_no: "Her er det ikke du som har vikeplikt. Se på skilt, lys og hvor B kommer fra.", why_ru: "Здесь уступать должен не ты. Смотри на знаки, светофор и откуда едет B." },
    other: { no: "B må vike for meg", ru: "B уступает мне",
      why_no: "B har ikke vikeplikt i denne situasjonen; det er du som må vente.", why_ru: "В этой ситуации B не обязан уступать, ждать должен ты." },
    none: { no: "Ingen konflikt: begge kan kjøre", ru: "Конфликта нет: оба едут",
      why_no: "Kjørebanene krysser hverandre, så én av dere må vike.", why_ru: "Ваши траектории пересекаются, значит один из вас должен уступить." },
    first: { no: "Den som kommer først til krysset kjører først", ru: "Кто первый приехал, тот и едет",
      why_no: "Trafikkreglene har ingen «førstemann»-regel. Rekkefølgen bestemmes av lys, skilt og høyreregelen.", why_ru: "В правилах нет принципа «кто первый». Порядок определяют светофор, знаки и правило правой руки." },
    big: { no: "Den største bilen kjører først", ru: "Едет тот, у кого машина больше",
      why_no: "Størrelsen på kjøretøyet gir ingen forrang. Unntaket er sporvogn, som alltid har forkjørsrett.", why_ru: "Размер машины не даёт преимущества. Исключение — трамвай, у него приоритет всегда." },
    left: { no: "Den som er til venstre kjører først", ru: "Едет тот, кто слева",
      why_no: "Høyreregelen sier det motsatte: du viker for trafikk fra høyre.", why_ru: "Правило правой руки говорит обратное: уступаешь тому, кто справа." }
  };
  function whoOptions(correctKey) {
    const wrong = shuffle(Object.keys(WHO).filter(k => k !== correctKey)).slice(0, 3);
    return [correctKey, ...wrong].map((k, i) => ({ text_no: WHO[k].no, text_ru: WHO[k].ru, correct: i === 0, why_no: WHO[k].why_no, why_ru: WHO[k].why_ru }));
  }

  function gen(id, fresh) {
    return { id: "gen-sit-" + id, topic: "situational", kind: "generated", fresh };
  }

  /* Встречный конфликт: A и B на одной оси (B с севера) */
  function oncomingResult(aMan, bMan) {
    if (aMan === "left" && bMan !== "left") return "me";
    if (bMan === "left" && aMan !== "left") return "other";
    return "none";
  }

  const SIT = [

    /* 1. Правило правой руки, B справа */
    gen("hoyre-fra-hoyre", () => {
      const aMan = rnd(["straight", "left", "right"]);
      const bMan = rnd(["straight", "left"]);
      return {
        prompt_no: `Kryss uten skilt eller lys. Du (A) skal kjøre ${MAN_KEY[aMan].no}. Bil B kommer fra høyre og skal ${MAN_KEY[bMan].no}. Hvem har vikeplikt?`,
        prompt_ru: `Перекрёсток без знаков и светофора. Ты (A) едешь ${MAN_KEY[aMan].ru}. Машина B едет справа и ${bMan === "straight" ? "едет прямо" : "поворачивает " + MAN_KEY[bMan].ru}. Кто уступает?`,
        image: scene({ you: { from: "south", to: toFor("south", aMan) }, others: [{ from: "east", to: toFor("east", bMan) }] }),
        options: whoOptions("me"),
        explanation_no: "Uten skilt gjelder høyreregelen: du har vikeplikt for trafikk fra høyre, uansett hva du selv skal.",
        explanation_ru: "Без знаков действует правило правой руки: ты уступаешь тем, кто справа, независимо от своего манёвра.",
        tip_ru: "«Я еду прямо» не даёт приоритета. Только знаки, светофор или сторона (право) решают."
      };
    }),

    /* 2. Правило правой руки, B слева */
    gen("hoyre-fra-venstre", () => {
      const aMan = rnd(["straight", "right", "left"]);
      const bMan = rnd(["straight", "right"]);
      return {
        prompt_no: `Kryss uten skilt eller lys. Du (A) skal kjøre ${MAN_KEY[aMan].no}. Bil B kommer fra venstre og skal ${MAN_KEY[bMan].no}. Hvem har vikeplikt?`,
        prompt_ru: `Перекрёсток без знаков и светофора. Ты (A) едешь ${MAN_KEY[aMan].ru}. Машина B едет слева и ${bMan === "straight" ? "едет прямо" : "поворачивает " + MAN_KEY[bMan].ru}. Кто уступает?`,
        image: scene({ you: { from: "south", to: toFor("south", aMan) }, others: [{ from: "west", to: toFor("west", bMan) }] }),
        options: whoOptions("other"),
        explanation_no: "Du er til høyre for B, så B har vikeplikt for deg. Vær likevel klar til å bremse.",
        explanation_ru: "Ты справа от B, значит B уступает тебе. Но будь готов затормозить, если B не уступит.",
        tip_ru: "Иметь приоритет не значит «не смотреть». Экзаменатор ценит защитную езду."
      };
    }),

    /* 3. Ты на главной, B с боковой */
    gen("forkjorsveg-du", () => {
      const side = rnd(["east", "west"]);
      const aMan = rnd(["straight", "left", "right"]);
      const bMan = rnd(["straight", "left", "right"]);
      return {
        prompt_no: `Du (A) kjører på forkjørsveg og skal ${MAN_KEY[aMan].no}. Bil B kommer ${FROM[side].no} fra en sideveg med vikeplikt. Hvem har vikeplikt?`,
        prompt_ru: `Ты (A) на главной дороге, едешь ${MAN_KEY[aMan].ru}. Машина B выезжает ${FROM[side].ru} с второстепенной дороги. Кто уступает?`,
        image: scene({ you: { from: "south", to: toFor("south", aMan) }, others: [{ from: side, to: toFor(side, bMan) }], signs: { south: "priority", [side]: "yield" } }),
        options: whoOptions("other"),
        explanation_no: "På forkjørsveg gjelder ikke høyreregelen. Trafikk fra sideveger må vike, også når den kommer fra høyre.",
        explanation_ru: "На главной дороге правило правой руки не действует. Транспорт с боковых дорог уступает, даже если он справа.",
        tip_ru: "Жёлтый ромб «выключает» правило правой руки. Главная ловушка на теории."
      };
    }),

    /* 4. У тебя vikeplikt */
    gen("vikeplikt-du", () => {
      const side = rnd(["east", "west"]);
      const aMan = rnd(["straight", "left", "right"]);
      const bMan = rnd(["straight", "left", "right"]);
      return {
        prompt_no: `Du (A) har vikepliktskilt og skal ${MAN_KEY[aMan].no}. Bil B kommer ${FROM[side].no} på den kryssende vegen og skal ${MAN_KEY[bMan].no}. Hvem har vikeplikt?`,
        prompt_ru: `У тебя (A) знак «уступи дорогу», едешь ${MAN_KEY[aMan].ru}. Машина B едет ${FROM[side].ru} по пересекаемой дороге. Кто уступает?`,
        image: scene({ you: { from: "south", to: toFor("south", aMan) }, others: [{ from: side, to: toFor(side, bMan) }], signs: { south: "yield" } }),
        options: whoOptions("me"),
        explanation_no: `Vikeplikt betyr at du viker for all trafikk på kryssende veg, både fra høyre og venstre. Her kommer B ${FROM[side].no}: du venter.`,
        explanation_ru: `Знак «уступи» означает: уступаешь всем на пересекаемой дороге, и справа, и слева. B едет ${FROM[side].ru}: ты ждёшь.`,
        tip_ru: "При vikeplikt сторона не важна. Останавливаться не обязательно, если дорога свободна."
      };
    }),

    /* 5. У тебя STOP */
    gen("stopp-du", () => {
      const side = rnd(["east", "west"]);
      const near = rnd([true, false]);
      const opts = [
        { text_no: "Stopper helt ved stopplinjen, ser meg for og viker for B", text_ru: "Полностью останавливаюсь у стоп-линии, смотрю и уступаю B", correct: true },
        { text_no: "Senker farten og kjører hvis det ser fritt ut", text_ru: "Снижаю скорость и еду, если выглядит свободно", correct: false,
          why_no: "Stoppskilt krever full stopp hver gang, også når det ser fritt ut. «Rullende stopp» er et brudd.", why_ru: "Знак STOP требует полной остановки всегда, даже если кажется свободно. «Катящаяся остановка» — нарушение." },
        { text_no: side === "west" ? "Kjører: B kommer fra venstre" : "Kjører: jeg kom først", text_ru: side === "west" ? "Еду: B слева" : "Еду: я приехал первым", correct: false,
          why_no: side === "west" ? "Høyreregelen gjelder ikke når det står stoppskilt: skiltet gir deg vikeplikt for all trafikk." : "Hvem som kom først spiller ingen rolle. Stoppskiltet gir deg vikeplikt uansett.",
          why_ru: side === "west" ? "Правило правой руки не работает при знаке STOP: знак обязывает уступить всем." : "Кто приехал первым — не важно. Знак STOP обязывает уступить в любом случае." },
        { text_no: "Stopper bare hvis B er nær", text_ru: "Останавливаюсь, только если B близко", correct: false,
          why_no: "Stoppskiltet gjelder alltid, ikke bare når det kommer noen. Du skal stoppe helt før du vurderer trafikken.", why_ru: "Знак STOP действует всегда, а не только когда кто-то едет. Сначала полная остановка, потом оценка обстановки." }
      ];
      return {
        prompt_no: `Du (A) har stoppskilt. Bil B kommer ${FROM[side].no} ${near ? "og er nær krysset" : "men er et stykke unna"}. Hva gjør du?`,
        prompt_ru: `У тебя (A) знак STOP. Машина B едет ${FROM[side].ru}${near ? " и уже близко" : ", но пока далеко"}. Что делаешь?`,
        image: scene({ you: { from: "south", to: "north" }, others: [{ from: side, to: side === "east" ? "west" : "east" }], signs: { south: "stop" } }),
        options: opts,
        explanation_no: "Stoppskilt krever full stopp uansett om det kommer noen. Etter stoppet har du vikeplikt for all trafikk på kryssende veg.",
        explanation_ru: "Знак STOP требует полной остановки независимо от того, едет ли кто-то. После остановки уступаешь всем на пересекаемой дороге.",
        tip_ru: "Стоп = колёса стоят. «Притормозил и поехал» — ошибка, из-за которой заваливают oppkjøring."
      };
    }),

    /* 6. Встречный: повороты налево */
    gen("motende", () => {
      const aMan = rnd(["straight", "left", "right"]);
      const bMan = rnd(["straight", "left", "right"]);
      const res = oncomingResult(aMan, bMan);
      const ctx = rnd(["none", "priority"]);
      const expl = res === "me"
        ? ["Når du svinger til venstre, må du vike for møtende trafikk som kjører rett fram eller svinger til høyre.", "При повороте налево ты уступаешь встречным, которые едут прямо или поворачивают направо."]
        : res === "other"
        ? ["B svinger til venstre og må vike for deg som kjører rett fram eller til høyre.", "B поворачивает налево и уступает тебе, потому что ты едешь прямо или направо."]
        : ["Dere krysser ikke hverandres bane, så ingen har vikeplikt. Begge kjører med vanlig aktsomhet.", "Ваши траектории не пересекаются, уступать никому не нужно. Оба едут с обычной осторожностью."];
      return {
        prompt_no: `${ctx === "priority" ? "Dere kjører begge på forkjørsveg. " : "Kryss uten skilt. "}Du (A) skal ${MAN_KEY[aMan].no}. Møtende bil B skal ${MAN_KEY[bMan].no}. Hvem har vikeplikt?`,
        prompt_ru: `${ctx === "priority" ? "Вы оба на главной дороге. " : "Перекрёсток без знаков. "}Ты (A) едешь ${MAN_KEY[aMan].ru}. Встречная машина B едет ${MAN_KEY[bMan].ru}. Кто уступает?`,
        image: scene({ you: { from: "south", to: toFor("south", aMan) }, others: [{ from: "north", to: toFor("north", bMan) }], signs: ctx === "priority" ? { south: "priority" } : {} }),
        options: whoOptions(res),
        explanation_no: expl[0],
        explanation_ru: expl[1],
        tip_ru: "Поворот налево — самый «слабый» манёвр: уступаешь встречным. Два левых поворота навстречу — конфликта нет."
      };
    }),

    /* 7. Круговое движение */
    gen("rundkjoring", () => {
      const from = rnd(["west", "north"]);
      return {
        prompt_no: `Du (A) skal inn i en rundkjøring. Bil B er allerede inne i rundkjøringen${from === "west" ? " og kommer fra venstre" : ""}. Hvem har vikeplikt?`,
        prompt_ru: `Ты (A) въезжаешь на круг. Машина B уже на кругу${from === "west" ? " и приближается слева" : ""}. Кто уступает?`,
        image: scene({ you: { from: "south", to: "north" }, others: [{ from, to: from === "west" ? "east" : "east" }], roundabout: true }),
        options: whoOptions("me"),
        explanation_no: "Ved rundkjøring har du alltid vikeplikt for trafikk som allerede er i rundkjøringen, uansett hvor den kommer fra.",
        explanation_ru: "На круговом движении ты всегда уступаешь тем, кто уже на кругу, откуда бы они ни ехали.",
        tip_ru: "Круг — исключение из правила правой руки: уступаешь тем, кто слева, уже на кругу."
      };
    }),

    /* 8. Светофор: у тебя зелёный, у B красный */
    gen("lys-gront", () => {
      const side = rnd(["east", "west"]);
      const aMan = rnd(["straight", "right"]);
      return {
        prompt_no: `Lyskryss. Du (A) har grønt og skal ${MAN_KEY[aMan].no}. Bil B kommer ${FROM[side].no} og har rødt. Hvem har vikeplikt?`,
        prompt_ru: `Перекрёсток со светофором. У тебя (A) зелёный, едешь ${MAN_KEY[aMan].ru}. Машина B ${FROM[side].ru}, у неё красный. Кто уступает?`,
        image: scene({ you: { from: "south", to: toFor("south", aMan) }, others: [{ from: side, to: side === "east" ? "west" : "east" }], lights: { south: "green", [side]: "red" } }),
        options: whoOptions("other"),
        explanation_no: "Trafikklys går foran både skilt og høyreregelen. B har rødt og må stoppe. Du kjører, men med aktsomhet.",
        explanation_ru: "Светофор важнее и знаков, и правила правой руки. У B красный, она стоит. Ты едешь, но с осторожностью.",
        tip_ru: "Иерархия: полицейский → светофор → знаки → правило правой руки."
      };
    }),

    /* 9. Оба на зелёный, ты налево */
    gen("lys-venstresving", () => {
      const bMan = rnd(["straight", "right"]);
      return {
        prompt_no: `Lyskryss, grønt for begge retninger. Du (A) skal til venstre. Møtende bil B skal ${MAN_KEY[bMan].no}. Hvem har vikeplikt?`,
        prompt_ru: `Светофор, зелёный в обоих направлениях. Ты (A) поворачиваешь налево. Встречная B едет ${MAN_KEY[bMan].ru}. Кто уступает?`,
        image: scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: toFor("north", bMan) }], lights: { south: "green", north: "green" } }),
        options: whoOptions("me"),
        explanation_no: "Grønt lys lar deg kjøre inn i krysset, men vikeplikten for møtende trafikk ved venstresving gjelder fortsatt.",
        explanation_ru: "Зелёный разрешает въехать на перекрёсток, но обязанность уступить встречным при повороте налево остаётся.",
        tip_ru: "Зелёный — не «все мне уступают». Встречный прямо при твоём левом повороте всегда первый."
      };
    }),

    /* 10. Выезд с территории */
    gen("utkjoring", () => {
      const place = rnd([
        { no: "en parkeringsplass", ru: "с парковки" },
        { no: "en bensinstasjon", ru: "с заправки" },
        { no: "en gårdsveg", ru: "со двора" },
        { no: "et gatetun", ru: "из жилой зоны (gatetun)" },
        { no: "en gågate", ru: "с пешеходной улицы" }
      ]);
      const side = rnd(["east", "west"]);
      return {
        prompt_no: `Du (A) kjører ut fra ${place.no} og inn på vegen. Bil B kommer ${FROM[side].no} på vegen. Hvem har vikeplikt?`,
        prompt_ru: `Ты (A) выезжаешь ${place.ru} на дорогу. Машина B едет по дороге ${FROM[side].ru}. Кто уступает?`,
        image: scene({ you: { from: "south", to: "north" }, others: [{ from: side, to: side === "east" ? "west" : "east" }] }),
        options: whoOptions("me"),
        explanation_no: "Den som kjører ut fra parkeringsplass, gårdsveg, bensinstasjon, gatetun eller gågate har vikeplikt for all trafikk på vegen, også gående på fortauet.",
        explanation_ru: "Выезжающий с парковки, двора, заправки, gatetun или gågate уступает всему транспорту на дороге и пешеходам на тротуаре.",
        tip_ru: "Все «выезды с территорий» работают одинаково: ты последний в очереди, правило правой руки не действует."
      };
    }),

    /* 11. Велосипедист справа при повороте направо */
    gen("sykkel-hoyre", () => {
      const ctx = rnd(["sykkelfelt", "sykkelveg"]);
      return {
        prompt_no: `Du (A) skal svinge til høyre. Det er ${ctx === "sykkelfelt" ? "sykkelfelt på høyre side" : "en sykkelveg langs vegen"}, og syklist S bak deg kjører rett fram. Hvem har vikeplikt?`,
        prompt_ru: `Ты (A) поворачиваешь направо. Справа ${ctx === "sykkelfelt" ? "велополоса" : "велодорожка вдоль дороги"}, велосипедист S сзади едет прямо. Кто уступает?`,
        image: scene({ you: { from: "south", to: "east" }, others: [{ from: "south", to: "north", label: "S", kind: "bike" }] }),
        options: [
          { text_no: "Jeg (A) må vike for syklisten", text_ru: "Я (A) уступаю велосипедисту", correct: true },
          { text_no: "Syklisten må vike for meg", text_ru: "Велосипедист уступает мне", correct: false,
            why_no: "Syklisten i kjørebanen er kjørende på lik linje med deg, og kommer fra høyre. Høyreregelen gjelder også for sykler.", why_ru: "Велосипедист на проезжей части — такой же участник движения, и он справа. Правило правой руки действует и для велосипедов." },
          { text_no: "Ingen har vikeplikt", text_ru: "Никто не уступает", correct: false,
            why_no: "Kjørebanene krysser hverandre, så én av dere må vike. Uten skilt gjelder høyreregelen.", why_ru: "Траектории пересекаются, значит кто-то должен уступить. Без знаков действует правило правой руки." },
          { text_no: "Den som er raskest", text_ru: "Кто быстрее", correct: false,
            why_no: "Fart gir aldri forkjørsrett. Vikeplikt bestemmes av skilt og høyreregelen.", why_ru: "Скорость никогда не даёт приоритета. Кто уступает — решают знаки и правило правой руки." }
        ],
        explanation_no: "Når du svinger og krysser sykkelfelt eller sykkelveg, har du vikeplikt for syklende som kjører rett fram, også de som kommer bakfra.",
        explanation_ru: "При повороте через велополосу или велодорожку ты уступаешь велосипедистам, едущим прямо, в том числе догоняющим сзади.",
        tip_ru: "Правое зеркало и взгляд через плечо перед каждым правым поворотом."
      };
    }),

    /* 12. Пешеход у перехода */
    gen("gangfelt", () => {
      const st = rnd([
        { no: "står på fortauet og ser på deg", ru: "стоит на тротуаре и смотрит на тебя" },
        { no: "er på veg ut i gangfeltet", ru: "уже ступает на переход" },
        { no: "går i gangfeltet på motsatt side av vegen", ru: "идёт по переходу на противоположной стороне" }
      ]);
      return {
        prompt_no: `Du nærmer deg et gangfelt. En fotgjenger ${st.no}. Hva gjør du?`,
        prompt_ru: `Ты подъезжаешь к пешеходному переходу. Пешеход ${st.ru}. Что делаешь?`,
        image: scene({ you: { from: "south", to: "north" } }),
        options: [
          { text_no: "Senker farten og stopper om nødvendig for å slippe fotgjengeren over", text_ru: "Снижаю скорость и при необходимости останавливаюсь, чтобы пропустить", correct: true },
          { text_no: "Kjører: fotgjengeren er ikke foran bilen", text_ru: "Еду: пешеход не перед машиной", correct: false,
            why_no: "Vikeplikten gjelder også for fotgjengere som er på vei ut i gangfeltet, ikke bare de som står rett foran deg.", why_ru: "Уступать нужно и пешеходу, который только выходит на переход, а не только тому, кто уже перед капотом." },
          { text_no: "Tuter så fotgjengeren venter", text_ru: "Сигналю, чтобы подождал", correct: false,
            why_no: "Horn skal bare brukes for å avverge fare. Fotgjengeren har forrang i gangfeltet, du kan ikke «tute deg fram».", why_ru: "Сигнал — только для предотвращения опасности. У пешехода на переходе приоритет, «просигналить себе дорогу» нельзя." },
          { text_no: "Øker farten for å passere først", text_ru: "Ускоряюсь, чтобы проехать первым", correct: false,
            why_no: "Foran gangfelt skal du senke farten, ikke øke den. Å kjøre forbi en fotgjenger som er på vei ut koster 10 750 kr og 3 prikker.", why_ru: "Перед переходом скорость снижают, а не увеличивают. Проезд перед выходящим пешеходом — 10 750 kr и 3 балла." }
        ],
        explanation_no: "Du har vikeplikt for gående som er i gangfeltet eller på veg ut i det. Senk farten i god tid og vis tydelig at du stopper.",
        explanation_ru: "Ты уступаешь пешеходу, который на переходе или собирается на него ступить. Снижай скорость заранее и явно показывай, что останавливаешься.",
        tip_ru: "Пешеход на другой стороне широкого перехода тоже считается: в Норвегии ждут, пока он перейдёт."
      };
    })
  ];

  /* ---------- Числовые задания: штрафы, баллы, дистанции ---------- */
  function genR(id, fresh) {
    return { id: "gen-rules-" + id, topic: "rules", kind: "generated", fresh };
  }

  const FINES_LOW = [[5, 1250, 0], [10, 3350, 0], [15, 5950, 2], [20, 8650, 3], [25, 13450, 3]];
  const FINES_HIGH = [[5, 1250, 0], [10, 3350, 0], [15, 5350, 0], [20, 7450, 2], [25, 10100, 3]];
  function reaction(zone, over) {
    const low = zone <= 60;
    if ((low && over >= 26) || (!low && over >= 36)) return { kind: "tap", no: "Tap av førerkort og anmeldelse", ru: "Лишение прав и уголовное дело" };
    const table = low ? FINES_LOW : FINES_HIGH;
    const row = table.find(r => over <= r[0]);
    if (!row) return { kind: "big", no: "Forelegg over 13 000 kr, 3 prikker, mulig tap av førerkort", ru: "Штраф свыше 13 000 kr, 3 балла, возможно лишение" };
    const fmt = n => n.toLocaleString("nb-NO").replace(/ /g, " ");
    return {
      kind: "bot", bot: row[1], prikker: row[2],
      no: `${fmt(row[1])} kr${row[2] ? ` og ${row[2]} prikker` : ", ingen prikker"}`,
      ru: `${fmt(row[1])} kr${row[2] ? ` и ${row[2]} балла` : ", без баллов"}`
    };
  }

  const RULES = [

    genR("fart", () => {
      const zone = rnd([30, 40, 50, 60, 70, 80, 90, 100]);
      const low = zone <= 60;
      const over = low ? rnd([3, 7, 9, 12, 14, 17, 19, 22, 24, 27, 30]) : rnd([4, 8, 12, 14, 18, 20, 23, 25, 37, 40]);
      const correct = reaction(zone, over);
      const pool = [];
      const seen = new Set([correct.no]);
      [[zone, 4], [zone, 9], [zone, 14], [zone, 19], [zone, 24], [zone, low ? 27 : 37], [low ? 80 : 50, over > 25 ? 12 : over]].forEach(([z, o]) => {
        const r = reaction(z, o);
        if (!seen.has(r.no)) { seen.add(r.no); pool.push(r); }
      });
      const wrong = shuffle(pool).slice(0, 3);
      return {
        prompt_no: `Du blir målt til ${zone + over} km/t i en ${zone}-sone. Hva blir reaksjonen (satser 2026)?`,
        prompt_ru: `Тебя измерили на ${zone + over} км/ч в зоне ${zone}. Что грозит (ставки 2026)?`,
        image: null,
        options: [correct, ...wrong].map((r, i) => ({ text_no: r.no, text_ru: r.ru, correct: i === 0,
          why_no: i === 0 ? null : `Dette er satsen for et annet trinn. Her er du ${over} km/t over i en ${zone}-sone, og det gir: ${correct.no}.`,
          why_ru: i === 0 ? null : `Это ставка за другую ступень превышения. Здесь превышение ${over} км/ч в зоне ${zone}, и за него положено: ${correct.ru}.` })),
        explanation_no: low
          ? `I 60-sone eller lavere: til og med 5 over = 1 250 kr, 10 = 3 350, 15 = 5 950 og 2 prikker, 20 = 8 650 og 3 prikker, 25 = 13 450 og 3 prikker. Fra 26 over mister du førerkortet. Her: ${over} km/t over.`
          : `I 70-sone eller høyere: til og med 5 over = 1 250 kr, 10 = 3 350, 15 = 5 350, 20 = 7 450 og 2 prikker, 25 = 10 100 og 3 prikker. Fra 36 over mister du førerkortet. Her: ${over} km/t over.`,
        explanation_ru: low
          ? `В зонах 60 и ниже: до 5 сверх = 1 250 kr, до 10 = 3 350, до 15 = 5 950 и 2 балла, до 20 = 8 650 и 3 балла, до 25 = 13 450 и 3 балла. От 26 сверх — лишение прав. Здесь превышение ${over} км/ч.`
          : `В зонах 70 и выше: до 5 сверх = 1 250 kr, до 10 = 3 350, до 15 = 5 350, до 20 = 7 450 и 2 балла, до 25 = 10 100 и 3 балла. От 36 сверх — лишение прав. Здесь превышение ${over} км/ч.`,
        tip_ru: "Сначала посчитай, на сколько превысил, потом вспомни порог зоны: ≤60 или ≥70."
      };
    }),

    genR("prikker", () => {
      const nyFører = rnd([true, false]);
      const gamle = rnd([0, 2, 3, 4, 5, 6]);
      const alder = rnd([1, 2, 4]);
      const nye = rnd([2, 3]);
      const gjeldende = alder > 3 ? 0 : gamle;
      const total = gjeldende + nye * (nyFører ? 2 : 1);
      const taper = total >= 8;
      const opts = [
        { text_no: taper ? `Ja: ${total} prikker, førerkortet ryker i 6 måneder` : `Nei: ${total} prikker, grensen er 8`, text_ru: taper ? `Да: ${total} баллов, права отбирают на 6 месяцев` : `Нет: ${total} баллов, порог 8`, correct: true },
        { text_no: taper ? `Nei: ${total} prikker er under grensen` : `Ja: ${total} prikker er over grensen`, text_ru: taper ? `Нет: ${total} баллов ниже порога` : `Да: ${total} баллов выше порога`, correct: false,
        why_no: `Regn på nytt: prikker som teller er ${total}, og grensen er 8.`, why_ru: `Пересчитай: засчитываемых баллов ${total}, порог — 8.` },
        { text_no: nyFører ? `Nei: ${gjeldende + nye} prikker, prøveperioden spiller ingen rolle` : `Ja: ${gjeldende + nye * 2} prikker, alle prikker dobles`, text_ru: nyFører ? `Нет: ${gjeldende + nye} баллов, испытательный срок не важен` : `Да: ${gjeldende + nye * 2} баллов, все баллы удваиваются`, correct: false,
        why_no: nyFører ? "Feil: i prøveperioden (de første 2 årene) teller hver prikk dobbelt." : "Feil: prikkene dobles bare i prøveperioden, og den er over her.", why_ru: nyFører ? "Неверно: в испытательный срок (первые 2 года) каждый балл считается вдвое." : "Неверно: баллы удваиваются только в испытательный срок, а он здесь уже прошёл." },
        { text_no: alder > 3 ? `Ja: gamle prikker teller alltid, ${gamle + nye * (nyFører ? 2 : 1)} totalt` : `Nei: prikker eldre enn 1 år teller ikke`, text_ru: alder > 3 ? `Да: старые баллы считаются всегда, всего ${gamle + nye * (nyFører ? 2 : 1)}` : `Нет: баллы старше 1 года не считаются`, correct: false,
        why_no: "Prikker slettes etter 3 år, ikke 1 år, og de teller ikke evig.", why_ru: "Баллы сгорают через 3 года, а не через 1, и не считаются вечно." }
      ];
      return {
        prompt_no: `Du ${nyFører ? "er i prøveperioden (fikk førerkort for under 2 år siden)" : "har hatt førerkort i 5 år"}. Du har ${gamle} prikker fra ${alder} år siden og får nå ${nye} nye. Mister du førerkortet?`,
        prompt_ru: `Ты ${nyFører ? "в испытательном периоде (права меньше 2 лет)" : "с правами 5 лет"}. У тебя ${gamle} баллов ${alder}-летней давности, и сейчас ты получаешь ${nye} новых. Лишат ли прав?`,
        image: null,
        options: opts,
        explanation_no: `Prikker slettes etter 3 år (${alder > 3 ? "de gamle teller ikke lenger" : "de gamle teller fortsatt"}). ${nyFører ? "I prøveperioden dobles nye prikker: " + nye + " blir " + nye * 2 + "." : ""} Totalt ${total}; grensen for tap er 8.`,
        explanation_ru: `Баллы стираются через 3 года (${alder > 3 ? "старые уже не считаются" : "старые ещё считаются"}). ${nyFører ? "В испытательный период новые баллы удваиваются: " + nye + " становятся " + nye * 2 + "." : ""} Итого ${total}; порог лишения 8.`,
        tip_ru: "Две проверки: не старше ли баллы 3 лет, и не удваиваются ли новые (первые 2 года с правами)."
      };
    }),

    genR("stans-avstand", () => {
      const ctx = rnd([
        { no: "foran et gangfelt", ru: "перед пешеходным переходом", limit: 5 },
        { no: "fra et vegkryss", ru: "от перекрёстка", limit: 5 },
        { no: "fra et skilt for bussholdeplass", ru: "от знака автобусной остановки", limit: 20 }
      ]);
      const x = rnd(ctx.limit === 5 ? [2, 3, 4, 6, 8, 12] : [5, 10, 15, 18, 22, 30]);
      const ok = x >= ctx.limit;
      const opts = [
        { text_no: ok ? `Ja, grensen er ${ctx.limit} meter` : `Nei, grensen er ${ctx.limit} meter`, text_ru: ok ? `Да, предел ${ctx.limit} м` : `Нет, предел ${ctx.limit} м`, correct: true },
        { text_no: ok ? `Nei, grensen er ${ctx.limit} meter` : `Ja, grensen er ${ctx.limit} meter`, text_ru: ok ? `Нет, предел ${ctx.limit} м` : `Да, предел ${ctx.limit} м`, correct: false,
        why_no: `Grensen er riktig, men konklusjonen er feil: ${x} meter er ${ok ? "utenfor" : "innenfor"} ${ctx.limit} meter.`, why_ru: `Предел назван верно, но вывод неверный: ${x} м — это ${ok ? "дальше" : "ближе"} ${ctx.limit} м.` },
        { text_no: `${ok ? "Nei" : "Ja"}, grensen er ${ctx.limit === 5 ? 20 : 5} meter`, text_ru: `${ok ? "Нет" : "Да"}, предел ${ctx.limit === 5 ? 20 : 5} м`, correct: false,
        why_no: `Feil avstand: ${ctx.limit === 5 ? "5 meter gjelder gangfelt og vegkryss, 20 meter gjelder holdeplasser" : "20 meter gjelder holdeplasser, 5 meter gjelder gangfelt og vegkryss"}.`, why_ru: `Перепутан предел: ${ctx.limit === 5 ? "5 м — переход и перекрёсток, 20 м — остановка транспорта" : "20 м — остановка транспорта, 5 м — переход и перекрёсток"}.` },
        { text_no: "Ja, hvis det er lite trafikk", text_ru: "Да, если мало машин", correct: false,
        why_no: "Avstandsreglene for parkering gjelder alltid, uavhengig av trafikkmengde.", why_ru: "Правила дистанции при парковке действуют всегда, независимо от плотности движения." }
      ];
      return {
        prompt_no: `Kan du stanse ${x} meter ${ctx.no}?`,
        prompt_ru: `Можно ли остановиться в ${x} м ${ctx.ru}?`,
        image: null,
        options: opts,
        explanation_no: "Stans er forbudt nærmere enn 5 meter foran gangfelt, nærmere enn 5 meter fra vegkryss og nærmere enn 20 meter fra skilt for holdeplass.",
        explanation_ru: "Остановка запрещена ближе 5 м перед переходом, ближе 5 м от перекрёстка и ближе 20 м от знака остановки общественного транспорта.",
        tip_ru: "Два числа: 5 (переход, перекрёсток) и 20 (остановка)."
      };
    }),

    genR("tilhenger", () => {
      const bil = rnd([1800, 2000, 2200, 2500, 2800]);
      const henger = rnd([500, 750, 900, 1200, 1500]);
      const ok = henger <= 750 || bil + henger <= 3500;
      const opts = [
        { text_no: ok ? (henger <= 750 ? "Ja: hengeren er under 750 kg" : `Ja: ${bil} + ${henger} = ${bil + henger} kg, under 3 500 kg`) : `Nei: ${bil} + ${henger} = ${bil + henger} kg, over 3 500 kg. Trenger kode 96 eller BE`,
          text_ru: ok ? (henger <= 750 ? "Да: прицеп легче 750 кг" : `Да: ${bil} + ${henger} = ${bil + henger} кг, меньше 3 500`) : `Нет: ${bil} + ${henger} = ${bil + henger} кг, больше 3 500. Нужен код 96 или BE`, correct: true },
        { text_no: ok ? "Nei: klasse B tillater bare henger under 500 kg" : "Ja: klasse B tillater alle hengere under 3 500 kg", text_ru: ok ? "Нет: категория B только до 500 кг" : "Да: категория B допускает любой прицеп до 3 500 кг", correct: false,
        why_no: ok ? "Grensen for henger uten vilkår er 750 kg, ikke 500 kg." : "Feil: det er summen av bil og henger som ikke kan overstige 3 500 kg, ikke hengeren alene.", why_ru: ok ? "Предел для прицепа без условий — 750 кг, а не 500." : "Неверно: 3 500 кг — это предел суммы масс машины и прицепа, а не прицепа отдельно." },
        { text_no: ok ? "Nei: totalvekten er over 3 500 kg" : "Ja: hengeren er under 3 500 kg", text_ru: ok ? "Нет: полная масса больше 3 500" : "Да: прицеп легче 3 500 кг", correct: false,
        why_no: ok ? `Regn på nytt: ${bil} + ${henger} = ${bil + henger} kg, og det er innenfor 3 500 kg.` : `Regn på nytt: ${bil} + ${henger} = ${bil + henger} kg, og det er over 3 500 kg.`, why_ru: ok ? `Пересчитай: ${bil} + ${henger} = ${bil + henger} кг, это в пределах 3 500.` : `Пересчитай: ${bil} + ${henger} = ${bil + henger} кг, это больше 3 500.` },
        { text_no: "Bare hvis hengeren har egne bremser", text_ru: "Только если у прицепа свои тормоза", correct: false,
        why_no: "Bremser på hengeren endrer ikke vektgrensene for klasse B.", why_ru: "Тормоза на прицепе не меняют весовые пределы категории B." }
      ];
      return {
        prompt_no: `Bilen har tillatt totalvekt ${bil} kg, hengeren ${henger} kg. Kan du kjøre med vanlig klasse B?`,
        prompt_ru: `Разрешённая полная масса машины ${bil} кг, прицепа ${henger} кг. Можно ехать с обычной категорией B?`,
        image: null,
        options: opts,
        explanation_no: "Klasse B: henger inntil 750 kg alltid, eller tyngre så lenge bil og henger sammen ikke overstiger 3 500 kg tillatt totalvekt. Ellers kode 96 (inntil 4 250 kg) eller BE.",
        explanation_ru: "Категория B: прицеп до 750 кг всегда, или тяжелее, пока сумма разрешённых полных масс не превышает 3 500 кг. Иначе код 96 (до 4 250 кг) или BE.",
        tip_ru: "Считай по «tillatt totalvekt» из документов, а не по фактическому весу."
      };
    }),

    genR("avstand-sek", () => {
      const v = rnd([50, 60, 80, 90, 100, 110]);
      const mps = v / 3.6;
      const d3 = Math.round(mps * 3);
      const vaat = rnd([false, true]);
      const need = vaat ? 4 : 3;
      const correct = Math.round(mps * need);
      const opts = [correct, Math.round(mps * (need - 1.5)), Math.round(mps * (need + 2)), Math.round(mps * 1)];
      const uniq = [...new Set(opts)];
      while (uniq.length < 4) uniq.push(uniq[uniq.length - 1] + 15);
      return {
        prompt_no: `Du kjører ${v} km/t på ${vaat ? "våt" : "tørr"} veg. Omtrent hvor lang avstand til bilen foran tilsvarer ${need} sekunder?`,
        prompt_ru: `Ты едешь ${v} км/ч по ${vaat ? "мокрой" : "сухой"} дороге. Какая примерно дистанция до машины впереди соответствует ${need} секундам?`,
        image: null,
        options: uniq.map((m, i) => ({ text_no: `Omtrent ${m} meter`, text_ru: `Примерно ${m} м`, correct: i === 0,
          why_no: i === 0 ? null : `${m} meter tilsvarer omtrent ${(m / mps).toFixed(1)} sekunder i ${v} km/t, ikke ${need}.`,
          why_ru: i === 0 ? null : `${m} м при ${v} км/ч — это примерно ${(m / mps).toFixed(1)} с, а не ${need}.` })),
        explanation_no: `${v} km/t er ${Math.round(mps)} m/s. ${need} sekunder gir ${correct} meter. Tresekundersregelen gjelder tørr veg; på våt eller glatt veg bør du øke til 4–5 sekunder.`,
        explanation_ru: `${v} км/ч это ${Math.round(mps)} м/с. ${need} секунды дают ${correct} м. Правило трёх секунд для сухой дороги; на мокрой или скользкой увеличивай до 4–5.`,
        tip_ru: "Быстрый счёт: скорость в км/ч разделить на 3,6 — это метры в секунду. 90 км/ч = 25 м каждую секунду."
      };
    })
  ];

  const LABELS = {
    "gen-sit-hoyre-fra-hoyre": "Høyreregelen: bil fra høyre",
    "gen-sit-hoyre-fra-venstre": "Høyreregelen: bil fra venstre",
    "gen-sit-forkjorsveg-du": "Du på forkjørsveg",
    "gen-sit-vikeplikt-du": "Du har vikeplikt",
    "gen-sit-stopp-du": "Du har stoppskilt",
    "gen-sit-motende": "Møtende trafikk og svinger",
    "gen-sit-rundkjoring": "Inn i rundkjøring",
    "gen-sit-lys-gront": "Lyskryss: grønt for deg",
    "gen-sit-lys-venstresving": "Lyskryss: venstresving på grønt",
    "gen-sit-utkjoring": "Utkjøring fra parkering, gårdsveg m.m.",
    "gen-sit-sykkel-hoyre": "Høyresving over sykkelfelt",
    "gen-sit-gangfelt": "Fotgjenger ved gangfelt",
    "gen-rules-fart": "Fartsbot: hva blir reaksjonen",
    "gen-rules-prikker": "Prikker: mister du førerkortet",
    "gen-rules-stans-avstand": "Avstand ved stans (5 m / 20 m)",
    "gen-rules-tilhenger": "Tilhenger med klasse B",
    "gen-rules-avstand-sek": "Tresekundersregelen i meter"
  };
  SIT.concat(RULES).forEach(q => { q.label = LABELS[q.id] || q.id; });

  window.QUESTION_DATA = window.QUESTION_DATA || {};
  window.QUESTION_DATA.situational = (window.QUESTION_DATA.situational || []).concat(SIT);
  window.QUESTION_DATA.rules = (window.QUESTION_DATA.rules || []).concat(RULES);
  window.QUESTION_DATA.generated = { situational: SIT, rules: RULES };
})();
