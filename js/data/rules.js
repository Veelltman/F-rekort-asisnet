/* Банк вопросов: правила и штрафы (trafikkregler og sanksjoner).
   Суммы штрафов — по ставкам forenklet forelegg с 15.02.2026. Они индексируются
   каждый год: если год сменился, сверь цифры с tryggeveier.no или lovdata.no. */

(function () {
  "use strict";

  function q(id, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "rules-" + id, topic: "rules", type: "single-choice",
      prompt_no, prompt_ru, image: null,
      options: opts.map((o, i) => ({ text_no: o[0], text_ru: o[1], correct: i === 0, why_no: o[2] || null, why_ru: o[3] || null })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  /* Вопрос с несколькими правильными ответами (как «Velg alle riktige» на teoriprøven).
     Каждый вариант: [text_no, text_ru, correct(true/false), why_no, why_ru]. why — только у неверных. */
  function qm(id, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "rules-" + id, topic: "rules", type: "multi-choice", multi: true,
      prompt_no, prompt_ru, image: null,
      options: opts.map(o => ({ text_no: o[0], text_ru: o[1], correct: !!o[2], why_no: o[3] || null, why_ru: o[4] || null })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  window.QUESTION_DATA = window.QUESTION_DATA || {};
  window.QUESTION_DATA.rules = [

    /* ---------- Скорость ---------- */
    q("001", "Hva er den generelle fartsgrensen i tettbygd strøk i Norge?",
      "Какое общее ограничение скорости в населённом пункте в Норвегии?",
      [["50 km/t", "50 км/ч"], ["30 km/t", "30 км/ч", "30 km/t er en egen sone som må skiltes spesielt, ikke standardgrensen.", "30 км/ч — это отдельная зона со своим знаком, а не стандартный лимит."], ["60 km/t", "60 км/ч", "60 km/t finnes enkelte steder, men er ikke standardgrensen i tettbygd strøk uten skilt.", "60 км/ч встречается на некоторых участках, но это не базовый лимит в населённом пункте без знака."], ["80 km/t", "80 км/ч", "80 km/t gjelder utenfor tettbygd strøk, ikke inni den.", "80 км/ч — это лимит за пределами населённого пункта, а не внутри него."]],
      "Hvis det ikke er skiltet noe annet, er fartsgrensen 50 km/t i tettbygd strøk og 80 km/t utenfor.",
      "Если знаков нет — в населённом пункте 50 км/ч, за его пределами 80 км/ч.",
      "Запомни пару 50/80. Всё остальное (30, 60, 70, 90, 100, 110) всегда обозначено знаками."),

    q("002", "Hva er den generelle fartsgrensen utenfor tettbygd strøk?",
      "Какое общее ограничение скорости вне населённого пункта?",
      [["80 km/t", "80 км/ч"], ["90 km/t", "90 км/ч", "90 km/t finnes ikke som generell fartsgrense i Norge, bare skiltet enkelte steder.", "90 км/ч не существует как общий лимит в Норвегии — только как отдельный знак на некоторых участках."], ["100 km/t", "100 км/ч", "100 km/t er en skiltet grense på motorveg, ikke standardgrensen utenfor tettbygd strøk.", "100 км/ч — это лимит на автомагистрали по знаку, а не базовый лимит вне населённого пункта."], ["70 km/t", "70 км/ч", "70 km/t er lavere enn standardgrensen og gjelder bare der det er skiltet spesielt.", "70 км/ч ниже стандартного лимита и действует только там, где стоит такой знак."]],
      "Utenfor tettbygd strøk er den generelle fartsgrensen 80 km/t. Motorveger har egne skilt, ofte 100 eller 110.",
      "Вне населённого пункта общее ограничение 80 км/ч. На автомагистралях стоят свои знаки, обычно 100 или 110.",
      "Даже если дорога широкая и пустая, без знака выше 80 ехать нельзя."),

    q("003", "Du kjører 26 km/t over fartsgrensen i en 60-sone. Hva risikerer du?",
      "Ты превысил скорость на 26 км/ч в зоне 60. Чем это грозит?",
      [["Tap av førerkort", "Лишением прав"], ["Bare et gebyr", "Только штрафом", "Ved så stort avvik holder det ikke med bare gebyr, du mister også førerkortet.", "При таком большом превышении одним штрафом не отделаешься — заберут ещё и права."], ["Én prikk", "Одним баллом", "Én prikk gjelder ved mindre overtredelser, ikke ved 26 km/t over i en lavfartssone.", "Один балл дают за меньшие превышения, а не за 26 км/ч сверх в зоне с низким лимитом."], ["Ingenting hvis vegen var tom", "Ничем, если дорога была пустая", "Fartsgrensen gjelder uansett trafikkmengde, det finnes ikke noe unntak for tom veg.", "Ограничение скорости действует независимо от трафика — исключения для пустой дороги нет."]],
      "Tapsforskriften § 2-2: der fartsgrensen er 60 km/t eller lavere, mister du normalt førerkortet ved 26 km/t eller mer over grensen. Ved 70 og 80 er terskelen 36 km/t over, og på motorveg med 100 eller 110 er den 41 km/t over.",
      "Tapsforskriften § 2-2: где ограничение 60 и ниже, права обычно отбирают при превышении на 26 км/ч и более. При 70 и 80 порог — 36 км/ч, на автомагистрали со 100 или 110 — 41 км/ч.",
      "В зоне 30 превышение на 26 (то есть 56 км/ч) — уже лишение. Низкие зоны особенно опасны для прав."),

    q("004", "Hva er forelegget for å kjøre 10 km/t for fort i en 50-sone (2026)?",
      "Какой штраф за превышение на 10 км/ч в зоне 50 (2026)?",
      [["3 350 kr", "3 350 крон"], ["1 250 kr", "1 250 крон", "1 250 kr er satsen for inntil 5 km/t over, ikke 10 km/t.", "1 250 крон — это ставка за превышение до 5 км/ч, а не за 10."], ["5 950 kr", "5 950 крон", "5 950 kr gjelder ved 15 km/t over, ikke 10.", "5 950 крон — это за превышение на 15 км/ч, а не на 10."], ["Ingen bot under 15 km/t over", "Штрафа нет, если меньше 15 км/ч", "Boten gjelder fra første km/t over grensen, det finnes ingen nedre terskel på 15.", "Штраф начинается уже с первого км/ч превышения — никакого порога в 15 км/ч нет."]],
      "Satser 2026 der fartsgrensen er 60 eller lavere: til og med 5 over = 1 250 kr, 10 over = 3 350 kr, 15 over = 5 950 kr og 2 prikker, 20 over = 8 650 kr og 3 prikker, 25 over = 13 450 kr og 3 prikker.",
      "Ставки 2026 в зонах 60 и ниже: до 5 км/ч сверх — 1 250 kr, до 10 — 3 350 kr, до 15 — 5 950 kr и 2 балла, до 20 — 8 650 kr и 3 балла, до 25 — 13 450 kr и 3 балла.",
      "Уже с +11 км/ч в городе идут баллы. «Чуть-чуть быстрее» в Норвегии стоит тысячи крон."),

    q("005", "Fra hvor mange km/t over fartsgrensen får du prikker i en 50-sone?",
      "С какого превышения в зоне 50 начисляются штрафные баллы?",
      [["Fra 11 km/t over", "С 11 км/ч сверх лимита"], ["Fra 5 km/t over", "С 5 км/ч", "Ved 5 km/t over får du bare gebyr, prikker starter fra 11 km/t over.", "При превышении на 5 км/ч — только денежный штраф, баллы начинаются с 11 км/ч."], ["Fra 21 km/t over", "С 21 км/ч", "21 km/t over gir 3 prikker, men prikkene begynner tidligere, fra 11.", "21 км/ч сверх — это уже 3 балла, но баллы начинаются раньше, с 11 км/ч."], ["Fart gir aldri prikker", "За скорость баллов не дают", "Fartsovertredelser er tvert imot en av de vanligste årsakene til prikker.", "Наоборот, превышение скорости — одна из самых частых причин получения баллов."]],
      "I 60-sone eller lavere: 11–15 over gir 2 prikker, 16 og mer gir 3 prikker. I 70-sone eller høyere: 16–20 over gir 2 prikker, 21 og mer gir 3.",
      "В зонах 60 и ниже: превышение на 11–15 даёт 2 балла, на 16 и больше — 3. В зонах 70 и выше: 16–20 даёт 2 балла, 21 и больше — 3.",
      "В городе баллы начинаются раньше, чем на трассе. Логика: рядом пешеходы."),

    q("006", "Hvor fort kan du kjøre i et gatetun?",
      "С какой скоростью можно ехать в жилой зоне (gatetun)?",
      [["Gangfart, det vil si omtrent 5–10 km/t", "Скорость пешехода, примерно 5–10 км/ч"], ["30 km/t", "30 км/ч", "30 km/t er en vanlig soneskilt-grense, men i gatetun gjelder gangfart, ikke 30.", "30 км/ч — типичный лимит по знаку зоны, но в gatetun действует скорость пешехода, а не 30."], ["20 km/t", "20 км/ч", "20 km/t er fortsatt for fort for et gatetun, der farten skal tilsvare gange.", "20 км/ч всё ещё слишком быстро для gatetun — там скорость должна быть как у пешехода."], ["50 km/t hvis ingen barn er ute", "50 км/ч, если детей нет", "Regelen gjelder uansett om barn er synlige der og da, gatetun har alltid gangfart.", "Правило действует независимо от того, видны ли дети рядом — в gatetun всегда скорость пешехода."]],
      "I gatetun skal du kjøre i gangfart og vike for gående. Gående kan bruke hele gaten.",
      "В gatetun едешь со скоростью пешехода и уступаешь пешеходам. Они могут ходить по всей улице.",
      "Gatetun и gågate: ты гость на территории пешеходов."),

    /* ---------- Алкоголь, телефон, внимание ---------- */
    q("007", "Hva er promillegrensen for bilførere i Norge?",
      "Какой допустимый уровень алкоголя в крови для водителя в Норвегии?",
      [["0,2 promille", "0,2 промилле"], ["0,5 promille", "0,5 промилле", "0,5 er grensen i mange andre land, men i Norge er den lavere, 0,2.", "0,5 — лимит во многих других странах, но в Норвегии он ниже — 0,2."], ["0,8 promille", "0,8 промилле", "0,8 er fire ganger den norske grensen på 0,2. Over 0,5 promille gir normalt ubetinget fengsel, ikke bare bot.", "0,8 — это в четыре раза выше норвежского лимита 0,2. Свыше 0,5 промилле обычно грозит реальный тюремный срок, а не только штраф."], ["0,0 promille", "0,0 промилле", "Grensen er ikke null, den er 0,2 promille.", "Лимит не нулевой, а 0,2 промилле."]],
      "Promillegrensen er 0,2. I praksis betyr det at du ikke skal drikke alkohol i det hele tatt før du kjører.",
      "Допустимый предел 0,2 промилле. На практике это означает: перед вождением не пить вообще.",
      "0,2 — одно из самых строгих ограничений в Европе. Одна кружка пива уже риск потерять права."),

    q("008", "Du drakk mye i går kveld. Kan du kjøre til jobb klokka 7 neste morgen?",
      "Ты много выпил вчера вечером. Можно ли ехать на работу в 7 утра?",
      [["Ikke sikkert: kroppen bryter ned omtrent 0,1–0,15 promille i timen", "Не факт: организм выводит примерно 0,1–0,15 промилле в час"], ["Ja, etter søvn er alkoholen borte", "Да, после сна алкоголь выходит", "Søvn i seg selv bryter ikke ned alkohol raskere, det er bare tiden som teller.", "Сон сам по себе не ускоряет распад алкоголя, важно только количество прошедшего времени."], ["Ja, hvis du spiser frokost", "Да, если позавтракать", "Mat kan bremse opptaket før du drikker, men fjerner ikke alkoholen som allerede er i blodet.", "Еда может замедлить всасывание до того, как выпьешь, но не убирает уже попавший в кровь алкоголь."], ["Ja, kaffe nøytraliserer alkohol", "Да, кофе нейтрализует алкоголь", "Kaffe gjør deg bare mer våken, det påvirker ikke promillen i det hele tatt.", "Кофе лишь бодрит, на промилле в крови он никак не влияет."]],
      "Etter en fuktig kveld kan du fortsatt ha promille neste morgen. Verken søvn, kaffe eller mat gjør deg edru raskere.",
      "После обильного вечера утром в крови ещё может быть алкоголь. Ни сон, ни кофе, ни еда не ускоряют отрезвление.",
      "«Dagen derpå»-кjøring — частая причина лишения прав. Если сомневаешься, не садись за руль."),

    q("009", "Hva skjer hvis du bruker håndholdt mobiltelefon under kjøring (2026)?",
      "Что будет за использование мобильного телефона в руке во время вождения (2026)?",
      [["10 750 kr i gebyr og 3 prikker", "Штраф 10 750 крон и 3 балла"], ["Bare en advarsel første gang", "Только предупреждение в первый раз", "Det finnes ikke noe unntak for første gang, boten gjelder fra første brudd.", "Никакого исключения для первого раза нет — штраф действует сразу."], ["Ingenting hvis bilen står i kø", "Ничего, если стоишь в пробке", "Regelen gjelder også i kø, bilen trenger ikke bevege seg for at det skal telle som brudd.", "Правило действует и в пробке — машине не обязательно двигаться, чтобы это считалось нарушением."], ["Gebyr, men ingen prikker", "Штраф без баллов", "Håndholdt mobilbruk gir både gebyr og 3 prikker samtidig.", "За телефон в руке дают и штраф, и 3 балла одновременно."]],
      "Håndholdt mobilbruk koster 10 750 kr og 3 prikker. Gjelder også i kø og ved rødt lys. Telefonen må stå i holder og betjenes med ett trykk.",
      "Телефон в руке — 10 750 крон и 3 балла. Действует и в пробке, и на красном. Телефон должен быть в держателе и управляться одним касанием.",
      "Телефон в держателе с hands-free — ок. В руке — нет, даже «просто посмотреть карту»."),

    q("010", "Hva er forelegget for å kjøre på rødt lys (2026)?",
      "Какой штраф за проезд на красный (2026)?",
      [["10 750 kr og 3 prikker", "10 750 крон и 3 балла"], ["4 100 kr", "4 100 крон", "4 100 kr er satsen for manglende lys, ikke for kjøring på rødt lys.", "4 100 крон — это ставка за отсутствие света, а не за проезд на красный."], ["1 250 kr og 1 prikk", "1 250 крон и 1 балл", "Denne lave satsen gjelder ved en liten fartsovertredelse, ikke ved rødt lys.", "Такая маленькая сумма — это за небольшое превышение скорости, а не за красный свет."], ["Bare prikker, ingen bot", "Только баллы, без штрафа", "Overtredelsen gir alltid både gebyr og prikker samtidig, ikke bare det ene.", "Нарушение всегда даёт и штраф, и баллы вместе, а не что-то одно."]],
      "Kjøring på rødt lys, brudd på vikeplikt, ulovlig forbikjøring og for kort avstand koster alle 10 750 kr og 3 prikker.",
      "Проезд на красный, невыполнение обязанности уступить, незаконный обгон и слишком короткая дистанция — по 10 750 крон и 3 балла каждый.",
      "Четыре нарушения «по 10 750 и 3 балла»: красный, vikeplikt, обгон, дистанция. Два таких за два года у новичка — прощай, права."),

    q("011", "Hva er forelegget for å kjøre uten lys (2026)?",
      "Какой штраф за езду без света (2026)?",
      [["4 100 kr", "4 100 крон"], ["10 750 kr", "10 750 крон", "10 750 kr gjelder de groveste bruddene som rødt lys eller mobilbruk, ikke manglende lys.", "10 750 крон — это за самые серьёзные нарушения вроде красного света или телефона, не за отсутствие света."], ["1 250 kr", "1 250 крон", "1 250 kr er satsen for en liten fartsovertredelse, ikke for manglende lys.", "1 250 крон — это за небольшое превышение скорости, а не за отсутствие света."], ["Ingen bot om dagen", "Днём штрафа нет", "Lys er påbudt hele døgnet, også om dagen, så boten gjelder uansett tidspunkt.", "Свет обязателен круглосуточно, включая день, так что штраф действует в любое время."]],
      "Manglende eller feil bruk av lys koster 4 100 kr. Nærlys eller kjørelys er påbudt hele døgnet.",
      "Отсутствие или неправильное использование света — 4 100 крон. Ближний свет или ходовые огни обязательны круглосуточно.",
      "Проверь перед выездом: свет включён? Парковочных огней недостаточно."),

    q("012", "Må du bruke nærlys om dagen i Norge?",
      "Нужно ли включать ближний свет днём в Норвегии?",
      [["Ja, alltid, også i dagslys", "Да, всегда, даже днём"], ["Nei, bare i mørket", "Нет, только в темноте", "Regelen gjelder hele døgnet, ikke bare når det er mørkt.", "Правило действует круглые сутки, а не только в темноте."], ["Bare om vinteren", "Только зимой", "Kravet gjelder hele året, ikke bare vintermånedene.", "Требование действует весь год, а не только зимой."], ["Bare utenfor byen", "Только за городом", "Nærlys er påbudt både i byen og utenfor, det er ingen forskjell.", "Ближний свет обязателен и в городе, и за городом — разницы нет."]],
      "I Norge er det påbudt å kjøre med nærlys eller kjørelys hele døgnet, hele året.",
      "В Норвегии обязательно ехать с ближним светом или ходовыми огнями круглосуточно, круглый год.",
      "На экзамене это первое, на что смотрят при выезде."),

    q("013", "Når må du slå av fjernlyset?",
      "Когда нужно выключать дальний свет?",
      [["Ved møtende trafikk, bak en annen bil og der vegen er godt opplyst", "При встречном транспорте, позади другой машины и на освещённой дороге"], ["Bare i byen", "Только в городе", "Regelen handler om møtende trafikk og biler foran deg, ikke om by eller land.", "Правило касается встречного транспорта и машин впереди, а не города или сельской местности."], ["Aldri, fjernlys er tryggest", "Никогда, дальний безопаснее", "Fjernlys blender andre sjåfører og må slås av i flere situasjoner.", "Дальний свет слепит других водителей, и его нужно выключать в ряде ситуаций."], ["Bare når det regner", "Только в дождь", "Regn er ikke avgjørende, det viktige er møtende trafikk og biler foran deg.", "Дождь тут ни при чём — важно наличие встречных машин и машин впереди."]],
      "Fjernlys blender andre. Slå det av i god tid før møtende, når du ligger bak en bil, og på opplyst veg.",
      "Дальний свет слепит. Выключай заранее перед встречными, когда едешь за машиной и на освещённой дороге.",
      "Переключай на ближний, когда видишь фары встречного — не когда он уже рядом."),

    /* ---------- Баллы и права ---------- */
    q("014", "Hvor mange prikker fører til at du mister førerkortet?",
      "Сколько штрафных баллов приводят к лишению прав?",
      [["8 prikker i løpet av 3 år", "8 баллов за 3 года"], ["5 prikker i løpet av 1 år", "5 баллов за 1 год", "Både antallet og tidsrommet er feil, det korrekte er 8 prikker på 3 år.", "И число, и срок неверны — правильно 8 баллов за 3 года."], ["10 prikker i løpet av 5 år", "10 баллов за 5 лет", "Både antallet og tidsrommet er feil sammenlignet med den faktiske regelen.", "И количество, и срок здесь неверны по сравнению с реальным правилом."], ["12 prikker totalt", "12 баллов всего", "Det finnes ingen regel om et fast totaltall uten tidsbegrensning, prikkene telles over 3 år.", "Правила про фиксированное общее число без срока нет — баллы считаются за 3 года."]],
      "8 prikker på 3 år gir tap av førerkort i 6 måneder. Prikkene slettes 3 år etter at de ble registrert.",
      "8 баллов за 3 года — лишение прав на 6 месяцев. Баллы стираются через 3 года после регистрации.",
      "Для новичка это значит: два серьёзных нарушения (по 3 балла ×2) — и ты уже без прав."),

    q("015", "Hva er prøveperioden for nye førere?",
      "Что такое испытательный срок для новых водителей?",
      [["2 år: prikker telles dobbelt, og mister du førerkortet må du ta full prøve på nytt", "2 года: баллы удваиваются, при лишении прав экзамен сдаётся заново"], ["1 år uten spesielle regler", "1 год без особых правил", "Prøveperioden varer 2 år, ikke 1, og den har spesielle regler.", "Испытательный срок длится 2 года, а не 1, и у него есть особые правила."], ["5 år med lavere fartsgrense", "5 лет с пониженной скоростью", "Perioden er 2 år, og særtrekket er dobbel prikkbelastning, ikke en egen fartsgrense.", "Срок — 2 года, и особенность в удвоенных баллах, а не в отдельном лимите скорости."], ["Det finnes ingen prøveperiode", "Испытательного срока нет", "Prøveperioden finnes definitivt og gjelder alle nye førere de første 2 årene.", "Испытательный срок точно существует и действует для всех новых водителей первые 2 года."]],
      "De første 2 årene er prøveperiode uansett alder. Hver overtredelse gir dobbelt antall prikker, og ved tap av førerkort må du ta både teori og oppkjøring på nytt.",
      "Первые 2 года — испытательный период независимо от возраста. Баллы за каждое нарушение удваиваются, а при лишении прав заново сдаёшь и теорию, и практику.",
      "Испытательный срок действует и для взрослых, кто получил права впервые. Первые два года — время быть особенно аккуратным."),

    q("016", "Hvor lenge mister du normalt førerkortet ved 8 prikker?",
      "На сколько обычно лишают прав при 8 баллах?",
      [["6 måneder", "6 месяцев"], ["1 måned", "1 месяц", "Tapet varer lenger enn én måned, standardperioden er 6 måneder.", "Лишение длится дольше месяца — стандартный срок 6 месяцев."], ["1 år", "1 год", "Ett år er lengre enn den vanlige perioden på 6 måneder.", "Год — это дольше обычного срока в 6 месяцев."], ["For alltid", "Навсегда", "Førerkortet inndras midlertidig, ikke for alltid, du kan ta det tilbake etter perioden.", "Права изымают на время, а не навсегда — их можно вернуть после срока."]],
      "Standard er 6 måneder. Prikker som er eldre enn 3 år teller ikke.",
      "Стандарт — 6 месяцев. Баллы старше 3 лет не считаются.",
      "6 месяцев без машины в Норвегии, где всё далеко, — серьёзно. Баллы стоит беречь."),

    /* ---------- Ремни, дети, оборудование ---------- */
    q("017", "Barn under hvilken høyde må bruke godkjent barnesikring i bil?",
      "Дети ниже какого роста должны использовать специальное детское кресло или бустер?",
      [["135 cm", "135 см"], ["120 cm", "120 см", "Grensen er høyere enn 120 cm, den riktige høyden er 135 cm.", "Порог выше 120 см — правильная цифра 135 см."], ["150 cm", "150 см", "150 cm er høyere enn den faktiske grensen på 135 cm.", "150 см выше реального порога в 135 см."], ["100 cm", "100 см", "100 cm er lavere enn den faktiske grensen, mange barn over denne høyden trenger fortsatt sikring.", "100 см ниже реального порога — многие дети выше этого роста всё равно должны сидеть в кресле."]],
      "Barn under 135 cm skal bruke godkjent sikringsutstyr. Føreren har ansvaret.",
      "Дети ростом до 135 см должны сидеть в одобренном кресле или бустере. Ответственность на водителе.",
      "Ответственность за непристёгнутых детей несёт водитель, а не родитель-пассажир."),

    q("018", "Hvem har ansvaret for at passasjerer over 15 år bruker bilbelte?",
      "Кто отвечает за пристёгнутость пассажиров старше 15 лет?",
      [["Passasjeren selv", "Сам пассажир"], ["Føreren", "Водитель", "Føreren har ansvar for passasjerer under 15 år, ikke for voksne passasjerer.", "Водитель отвечает за пассажиров младше 15 лет, а не за взрослых."], ["Bileieren", "Владелец машины", "Eierskap til bilen har ingenting med belteplikten å gjøre.", "Владение машиной вообще не связано с обязанностью пристёгиваться."], ["Ingen, det er frivillig", "Никто, это добровольно", "Bruk av bilbelte er lovpålagt for alle, ikke frivillig.", "Ремень безопасности обязателен по закону для всех, это не добровольно."]],
      "Passasjerer over 15 år er selv ansvarlige for å bruke belte. For barn under 15 år er det føreren som har ansvaret.",
      "Пассажиры старше 15 лет сами отвечают за ремень. За детей младше 15 отвечает водитель.",
      "Граница 15 лет — важная деталь на теории."),

    q("019", "Hvilket utstyr er påbudt å ha i bilen?",
      "Какое оборудование обязательно должно быть в машине?",
      [["Varseltrekant og refleksvest", "Знак аварийной остановки и светоотражающий жилет"], ["Brannslukker", "Огнетушитель", "Brannslukker anbefales, men er ikke lovpålagt i en vanlig personbil.", "Огнетушитель рекомендуется, но по закону не обязателен для обычной легковушки."], ["Førstehjelpsskrin", "Аптечка", "Førstehjelpsskrin er en god idé, men ikke et lovkrav i Norge.", "Аптечка — хорошая идея, но по норвежским законам не требуется."], ["Reservehjul", "Запасное колесо", "Reservehjul er ikke påbudt, mange biler har i stedet et reparasjonssett.", "Запасное колесо не обязательно — во многих машинах вместо него ремкомплект."]],
      "Varseltrekant er påbudt, og refleksvest skal ligge lett tilgjengelig for føreren. Førstehjelpsskrin og brannslukker anbefales, men er ikke påbudt i personbil.",
      "Знак аварийной остановки обязателен, жилет должен лежать в зоне досягаемости водителя. Аптечка и огнетушитель рекомендуются, но для легковых не обязательны.",
      "Жилет — в салоне, не в багажнике: надеть его нужно до того, как выйдешь на дорогу."),

    q("020", "Hvor langt bak bilen skal varseltrekanten settes ved nødstans på landeveg?",
      "На каком расстоянии позади машины ставить знак аварийной остановки при вынужденной остановке на загородной дороге?",
      [["I god avstand, om mulig minst 150 meter", "На хорошем расстоянии, по возможности не менее 150 м"], ["10 meter", "10 метров", "10 meter er alt for kort. Forskriften sier i god avstand, om mulig minst 150 meter.", "10 м — слишком мало. Предписание требует хорошего расстояния, по возможности не менее 150 м."], ["30 meter", "30 метров", "30 meter gir ikke andre tid til å reagere i høy fart. Kravet er om mulig minst 150 meter.", "30 м не дают другим времени среагировать на скорости. Требование — по возможности не менее 150 м."], ["Rett bak bilen", "Прямо за машиной", "Rett bak bilen ser ingen trekanten i tide. Den skal stå i god avstand, om mulig minst 150 meter.", "Прямо за машиной треугольник никто не увидит вовремя. Он должен стоять далеко, по возможности не менее 150 м."]],
      "Forskrift om bruk av kjøretøy § 1-6: varseltrekanten skal plasseres i god avstand, om mulig minst 150 meter fra kjøretøyet, slik at andre kjørende ser den i tide. Sett på nødblink og ta på refleksvest først.",
      "Forskrift om bruk av kjøretøy § 1-6: треугольник ставят на хорошем расстоянии, по возможности не менее 150 м от машины, чтобы другие увидели его вовремя. Сначала аварийка и жилет.",
      "Порядок: аварийка → жилет → треугольник (150 м) → сам за отбойник."),

    /* ---------- Шины ---------- */
    q("021", "Hva er minste tillatte mønsterdybde på dekk om vinteren?",
      "Какая минимальная глубина протектора шин зимой?",
      [["3 mm", "3 мм"], ["1,6 mm", "1,6 мм", "1,6 mm er minstekravet om sommeren, om vinteren er kravet høyere, 3 mm.", "1,6 мм — это минимум летом, зимой требование выше — 3 мм."], ["5 mm", "5 мм", "5 mm er mer enn det faktiske kravet på 3 mm.", "5 мм больше реального требования в 3 мм."], ["2 mm", "2 мм", "2 mm er mindre enn vinterkravet på 3 mm.", "2 мм меньше зимнего требования в 3 мм."]],
      "I vinterperioden (1. november til og med første søndag etter 2. påskedag, i Nordland, Troms og Finnmark 16. oktober til 30. april) er kravet 3 mm. Ellers 1,6 mm.",
      "В зимний период (с 1 ноября по первое воскресенье после второго дня Пасхи, в Nordland, Troms и Finnmark с 16 октября по 30 апреля) требование 3 мм. В остальное время 1,6 мм.",
      "Зима 3 мм, лето 1,6 мм. Новая шина имеет около 8 мм."),

    q("022", "Når er det lov å bruke piggdekk i Sør-Norge?",
      "Когда разрешены шипованные шины на юге Норвегии?",
      [["Fra 1. november til og med første søndag etter 2. påskedag", "С 1 ноября до первого воскресенья после второго дня Пасхи включительно"], ["Fra 1. oktober til 1. mai", "С 1 октября до 1 мая", "Datoene er feil, piggdekk-perioden i Sør-Norge starter 1. november, ikke 1. oktober.", "Даты неверны, период шипов на юге начинается 1 ноября, а не 1 октября."], ["Hele året", "Круглый год", "Piggdekk er forbudt fra første mandag etter 2. påskedag til 31. oktober, med mindre føret krever det.", "Шипы запрещены с первого понедельника после второго дня Пасхи до 31 октября, если только этого не требуют дорожные условия."], ["Fra 1. desember til 1. mars", "С 1 декабря до 1 марта", "Perioden starter tidligere, fra 1. november, og varer til søndagen etter 2. påskedag, ikke til 1. mars.", "Период начинается раньше, с 1 ноября, и длится до воскресенья после второго дня Пасхи, а не до 1 марта."]],
      "Forskrift om bruk av kjøretøy § 1-4: piggdekk må ikke brukes fra og med første mandag etter 2. påskedag til og med 31. oktober, om ikke føreforholdene gjør det nødvendig. I Nordland, Troms og Finnmark er forbudsperioden 1. mai til 15. oktober.",
      "Forskrift om bruk av kjøretøy § 1-4: шипы нельзя использовать с первого понедельника после второго дня Пасхи по 31 октября, если этого не требуют дорожные условия. В Nordland, Troms и Finnmark запрет — с 1 мая по 15 октября.",
      "В Oslo, Bergen и Trondheim за шипы платят piggdekkgebyr: дневной билет или сезонный абонемент. Stavanger и Kristiansand отменили сбор в 2023 году."),

    q("023", "Er det påbudt med vinterdekk på personbil?",
      "Обязательны ли зимние шины на легковом автомобиле?",
      [["Nei, men dekkene må passe føret, og om vinteren kreves minst 3 mm mønster", "Нет, но шины должны соответствовать условиям, зимой минимум 3 мм протектора"], ["Ja, fra 1. november", "Да, с 1 ноября", "Det finnes ingen fast dato for påbudte vinterdekk på personbil, kravet er at dekkene passer føret.", "Фиксированной даты обязательных зимних шин для легковушки нет — требование в том, чтобы шины подходили условиям."], ["Ja, alltid piggdekk", "Да, всегда шипованные", "Piggdekk er ett av flere alternativer, ikke et krav, det finnes også gode piggfrie vinterdekk.", "Шипы — лишь один из вариантов, а не обязательное требование, есть и хорошие нешипованные зимние шины."], ["Nei, sommerdekk er alltid lov", "Нет, летние всегда разрешены", "Sommerdekk er ikke alltid lov, de må passe føret, og på snø og is holder de ikke kravet.", "Летние шины не всегда разрешены — они должны подходить условиям, а на снегу и льду не соответствуют требованию."]],
      "Loven krever at dekkene er egnet for føret. Kjører du på sommerdekk på snø og is, kan du få gebyr og bli stoppet. For tunge kjøretøy er vinterdekk påbudt.",
      "Закон требует, чтобы шины подходили условиям. Езда на летних по снегу и льду — штраф и запрет продолжать движение. Для тяжёлых ТС зимние шины обязательны.",
      "Правило здравого смысла закреплено законом: на летних по льду ехать нельзя, даже если календарь ещё «летний»."),

    /* ---------- Остановка и парковка ---------- */
    q("024", "Hvor nær et gangfelt kan du parkere?",
      "Как близко к пешеходному переходу можно парковаться?",
      [["Ikke nærmere enn 5 meter foran gangfeltet", "Не ближе 5 м перед переходом"], ["Ikke nærmere enn 2 meter", "Не ближе 2 м", "2 meter er for lite, regelen krever minst 5 meter foran gangfeltet.", "2 м слишком мало, правило требует минимум 5 м перед переходом."], ["Rett inntil, hvis du ikke står på stripene", "Вплотную, если не на зебре", "Det holder ikke å unngå selve stripene, avstanden på 5 meter gjelder uansett.", "Недостаточно просто не стоять на самой зебре — требование в 5 м действует в любом случае."], ["Ikke nærmere enn 20 meter", "Не ближе 20 м", "20 meter er mer enn nødvendig, riktig avstand foran gangfeltet er 5 meter.", "20 м — больше, чем нужно, правильное расстояние перед переходом — 5 м."]],
      "Det er forbudt å stanse på gangfelt eller nærmere enn 5 meter foran det. Bak gangfeltet er det tillatt.",
      "Запрещено останавливаться на переходе или ближе 5 м перед ним. Позади перехода можно.",
      "5 м перед переходом — чтобы водители видели пешеходов. За переходом машина обзор не закрывает."),

    q("025", "Hvor nær et vegkryss er det forbudt å stanse?",
      "На каком расстоянии от перекрёстка запрещена остановка?",
      [["Nærmere enn 5 meter", "Ближе 5 метров"], ["Nærmere enn 10 meter", "Ближе 10 метров", "10 meter er mer enn det faktiske kravet, som er 5 meter fra krysset.", "10 м больше реального требования — оно составляет 5 м от перекрёстка."], ["Nærmere enn 15 meter", "Ближе 15 метров", "15 meter er langt mer enn den faktiske grensen på 5 meter.", "15 м намного больше реального порога в 5 м."], ["I krysset, men ikke ved siden", "На перекрёстке, но не рядом", "Forbudet gjelder ikke bare selve krysset, men også 5 meter rundt det.", "Запрет действует не только на самом перекрёстке, но и в радиусе 5 м вокруг него."]],
      "Det er forbudt å stanse i vegkryss eller nærmere enn 5 meter fra krysset, målt fra der fortauskanten begynner å runde.",
      "Запрещено останавливаться на перекрёстке или ближе 5 м от него, считая от начала закругления бордюра.",
      "Число 5 м повторяется: и от перекрёстка, и перед переходом."),

    q("026", "Hvor nær et busstopp-skilt er det forbudt å stanse?",
      "Как близко к знаку автобусной остановки запрещено останавливаться?",
      [["Nærmere enn 20 meter", "Ближе 20 метров"], ["Nærmere enn 5 meter", "Ближе 5 метров", "5 meter er for lite, kravet ved busstopp er 20 meter.", "5 м слишком мало, требование у автобусной остановки — 20 м."], ["Nærmere enn 50 meter", "Ближе 50 метров", "50 meter er mer enn det faktiske kravet på 20 meter.", "50 м больше реального требования в 20 м."], ["Det er tillatt hvis bussen ikke kommer", "Можно, если автобуса нет", "Forbudet gjelder uansett om en buss er på vei eller ikke.", "Запрет действует независимо от того, едет автобус или нет."]],
      "Stans er forbudt nærmere enn 20 meter fra skilt for holdeplass for buss, drosje eller sporvogn.",
      "Остановка запрещена ближе 20 м от знака остановки автобуса, такси или трамвая.",
      "20 м — примерно 4 машины. Автобусу нужно место, чтобы подъехать к бордюру."),

    q("027", "Hva er forskjellen på «stans» og «parkering»?",
      "В чём разница между «stans» (остановка) и «parkering» (парковка)?",
      [["Stans er kort stopp for av- og pålessing; parkering er all annen hensetting", "Остановка (stans) — короткая, для посадки или выгрузки; парковка (parkering) — любое другое оставление машины"], ["Stans er under 5 minutter, parkering er over", "Остановка — меньше 5 минут, парковка — больше", "Skillet handler ikke om et bestemt tidspunkt som 5 minutter, men om formålet med stoppet.", "Разница не в конкретном времени вроде 5 минут, а в цели остановки."], ["Det er det samme", "Это одно и то же", "Begrepene har ulik juridisk betydning og ulike regler, de er ikke det samme.", "У этих понятий разное юридическое значение и разные правила — это не одно и то же."], ["Parkering er bare på P-plass", "Парковка — только на парковочной площадке", "Parkering kan skje hvor som helst du lovlig setter fra deg bilen, ikke bare på P-plass.", "Парковкой считается оставление машины где угодно по правилам, а не только на официальной стоянке."]],
      "Stans: kortvarig stopp for av- eller påstigning eller lasting. Parkering: enhver hensetting som ikke er stans, uansett om føreren sitter i bilen.",
      "Stans: кратковременная остановка для посадки, высадки или погрузки. Parkering: любое другое оставление машины, даже если водитель сидит внутри.",
      "Сидеть в машине и ждать друга 10 минут — это уже parkering, а не stans."),

    q("028", "Kan du parkere på venstre side av en toveis veg, mot kjøreretningen?",
      "Можно ли парковаться на левой стороне двусторонней дороги, против направления движения?",
      [["Ja, det er ikke forbudt i Norge, så lenge det ikke er til fare eller hinder", "Да, в Норвегии это не запрещено, если не создаёт опасности или помехи"], ["Nei, bare på høyre side i kjøreretningen", "Нет, только справа по ходу движения", "Trafikkreglene § 17 har ingen regel om høyre side. Mange andre land forbyr det, men ikke Norge.", "В Trafikkreglene § 17 нет правила про правую сторону. Во многих странах это запрещено, но не в Норвегии."], ["Bare i envegskjørt gate", "Только на односторонней улице", "Det er lov også på toveis veg. Envegskjøring er ikke et vilkår i norske regler.", "Разрешено и на двусторонней дороге. Одностороннее движение — не условие по норвежским правилам."], ["Bare om natten", "Только ночью", "Tidspunktet spiller ingen rolle. Det avgjørende er at bilen ikke står til fare eller hinder.", "Время суток не имеет значения. Важно только, чтобы машина не создавала опасности или помехи."]],
      "Norske trafikkregler forbyr ikke parkering mot kjøreretningen, og Parkeringsklagenemnda har slått fast at det ikke er ulovlig. Du må likevel krysse motgående felt inn og ut, så gjør det bare der det er trygt og oversiktlig, og følg skilt og de vanlige stansforbudene.",
      "Норвежские правила не запрещают парковку против направления движения, и Parkeringsklagenemnda подтвердила, что это законно. Но при въезде и выезде придётся пересекать встречную полосу — делай это только там, где безопасно и хороший обзор, и соблюдай знаки и обычные запреты остановки.",
      "Это одно из отличий Норвегии от Швеции и Дании: там парковка «против шерсти» запрещена, здесь — нет."),

    /* ---------- Обгон, дистанция, полосы ---------- */
    q("029", "Hva gjelder for forbikjøring rett foran et gangfelt?",
      "Что действует для обгона прямо перед пешеходным переходом?",
      [["Forbudt", "Запрещён"], ["Tillatt hvis ingen fotgjengere", "Разрешён, если нет пешеходов", "Forbudet gjelder uansett om du ser fotgjengere eller ikke, nettopp fordi sikten kan være skjult.", "Запрет действует независимо от того, видишь ли ты пешеходов — как раз потому, что обзор может быть закрыт."], ["Tillatt i 30-sone", "Разрешён в зоне 30", "Fartssonen har ingen betydning, forbudet mot forbikjøring ved gangfelt gjelder overalt.", "Зона скорости тут ни при чём — запрет обгона у перехода действует везде."], ["Tillatt for sykler", "Разрешён для велосипедов", "Forbudet gjelder alle kjøretøy, det finnes ikke noe unntak for sykler.", "Запрет касается всех транспортных средств, исключения для велосипедов нет."]],
      "Trafikkreglene § 12 nr. 6: den som nærmer seg gangfelt, må ikke kjøre forbi kjøretøy som hindrer noen del av sikten til gangfeltet. I praksis er forbikjøring rett foran gangfelt forbudt: bilen du passerer skjuler nettopp den delen av feltet der fotgjengeren kan være.",
      "Trafikkreglene § 12 nr. 6: подъезжая к переходу, нельзя обгонять машину, которая закрывает хоть часть обзора перехода. На практике обгон прямо перед переходом запрещён: обгоняемая машина как раз и скрывает ту часть зебры, где может быть пешеход.",
      "Классический сценарий ДТП: сосед притормозил у зебры, ты обгоняешь — и сбиваешь пешехода."),

    q("030", "Hva er tresekundersregelen?",
      "Что такое правило трёх секунд?",
      [["Anbefalt minsteavstand til bilen foran: 3 sekunder", "Рекомендуемая минимальная дистанция до машины впереди: 3 секунды"], ["Du må stoppe i 3 sekunder ved stoppskilt", "У знака STOP стоять 3 секунды", "Tresekundersregelen handler om avstand til bilen foran, ikke om hvor lenge du skal stå ved et stoppskilt.", "Правило трёх секунд — про дистанцию до машины впереди, а не про время стояния у знака STOP."], ["Blinklys skal være på i 3 sekunder før sving", "Поворотник включать за 3 секунды до поворота", "Regelen handler ikke om blinklys, men om å måle avstanden til bilen foran deg.", "Правило не про поворотник, а про измерение дистанции до машины впереди."], ["Du har 3 sekunder på å vike", "У тебя 3 секунды, чтобы уступить", "Regelen er en metode for å sjekke avstand, ikke en tidsfrist for å vike.", "Это способ проверить дистанцию, а не срок на то, чтобы уступить."]],
      "Velg et fast punkt bilen foran passerer, og tell «tusen-og-en, tusen-og-to, tusen-og-tre». Passerer du punktet før du er ferdig, ligger du for nær.",
      "Выбери ориентир, который проехала машина впереди, и считай «тысяча один, тысяча два, тысяча три». Проехал ориентир раньше — дистанция мала.",
      "На мокрой или зимней дороге увеличивай до 4–5 секунд. Слишком короткая дистанция — 10 750 kr и 3 балла."),

    q("031", "Hvor skal du kjøre på en veg med to felt i samme retning?",
      "В какой полосе ехать на дороге с двумя полосами в одну сторону?",
      [["I høyre felt; venstre felt brukes til forbikjøring", "В правой; левая для обгона"], ["I venstre felt, det er raskest", "В левой, там быстрее", "Venstre felt skal brukes til forbikjøring, ikke som fast kjørefelt selv om det føles raskere.", "Левая полоса предназначена для обгона, а не для постоянной езды, даже если кажется быстрее."], ["Hvor som helst", "Где угодно", "Trafikkreglene § 5 krever høyre felt. Fritt feltvalg gjelder bare der skilt 528 «Valgfritt kjørefelt» er satt opp.", "Trafikkreglene § 5 требуют правую полосу. Свободный выбор — только там, где стоит знак 528 «Valgfritt kjørefelt»."], ["I midten av begge", "Посередине", "Å kjøre midt mellom feltene er farlig og bryter med kravet om å holde til høyre.", "Ехать посередине между полосами опасно и нарушает требование держаться правой стороны."]],
      "Trafikkreglene § 5: på veg med to eller flere felt i samme retning skal høyre felt brukes når ikke reglene påbyr eller tillater felt til venstre. Venstre felt er for forbikjøring, og du skal tilbake til høyre etterpå. Unntak: der skilt 528 «Valgfritt kjørefelt» står, og i tett kø der alle felt er fylt (§ 12).",
      "Trafikkreglene § 5: на дороге с двумя и более полосами в одну сторону едут в правой, если правила не предписывают или не разрешают левую. Левая — для обгона, после него возвращайся направо. Исключения: знак 528 «Valgfritt kjørefelt» и плотная пробка, когда заняты все полосы (§ 12).",
      "«Висеть» в левой полосе на трассе — нарушение и раздражитель для всех."),

    q("032", "Hva er fletteregelen (glidelåsprinsippet)?",
      "Что такое правило «молнии» при слиянии полос?",
      [["Bilene fletter annenhver bil fra hvert felt der et felt slutter", "Машины из двух полос сливаются по очереди, через одну"], ["Den som ligger i venstre felt har forrang", "У левой полосы приоритет", "Ingen av feltene har automatisk forrang, begge har plikt til å slippe til hverandre.", "У полосы автоматического приоритета нет — обе стороны обязаны пропускать друг друга."], ["Den som kom først kjører først", "Кто первый приехал, тот и едет", "Fletteregelen handler ikke om rekkefølge i tid, men om å veksle annenhver bil.", "Правило молнии не про то, кто приехал раньше, а про чередование через одну машину."], ["Den største bilen kjører først", "Большая машина едет первой", "Kjøretøyets størrelse har ingen betydning for fletteregelen.", "Размер машины никак не влияет на правило слияния."]],
      "Der et kjørefelt slutter og trafikken flettes sammen, skal bilene skifte på: én fra hvert felt. Begge har gjensidig plikt til å legge til rette.",
      "Там, где полоса заканчивается и потоки сливаются, машины чередуются: по одной из каждой полосы. Обе стороны обязаны помогать слиянию.",
      "Не «прижимайся» к обочине заранее и не блокируй — езжай до конца полосы и вливайся через одного."),

    /* ---------- Приоритет и особые случаи ---------- */
    q("033", "Hvem må du alltid vike for, uansett skilt?",
      "Кому ты всегда должен уступать, независимо от знаков?",
      [["Sporvogn (trikk)", "Трамваю"], ["Busser", "Автобусам", "Busser har ikke automatisk forkjørsrett overalt, det er sporvogn som har spesialregelen.", "У автобусов нет автоматического приоритета везде — особое правило именно для трамвая."], ["Lastebiler", "Грузовикам", "Kjøretøyets størrelse gir ikke forkjørsrett, det er sporvognen som alltid har det.", "Размер машины не даёт приоритета — он всегда у трамвая."], ["Taxier", "Такси", "Taxier har ingen spesiell forkjørsrett, det gjelder sporvogn.", "У такси нет особого приоритета — он у трамвая."]],
      "Sporvogn har alltid forkjørsrett. Den kan ikke svinge unna, og bremselengden er lang.",
      "Трамвай всегда имеет преимущество. Он не может свернуть, а тормозной путь у него длинный.",
      "Актуально в Oslo, Bergen и Trondheim: трамвай едет первым, даже если ты справа."),

    q("034", "Hva betyr blinkende gult lys i et trafikklys?",
      "Что означает мигающий жёлтый сигнал светофора?",
      [["Vis særlig aktsomhet: lyset regulerer ikke, så skilt og vikepliktsregler gjelder", "Особая осторожность: светофор не регулирует, действуют знаки и правила приоритета"], ["Stopp og vent på grønt", "Остановись и жди зелёного", "Blinkende gult betyr at lyset ikke fungerer normalt, det kommer ikke noe grønt å vente på.", "Мигающий жёлтый значит, что светофор работает нештатно — зелёного, которого можно ждать, не будет."], ["Kjør, du har forrang", "Езжай, у тебя преимущество", "Blinkende gult gir ingen automatisk forrang, du må følge skilt eller høyreregelen.", "Мигающий жёлтый не даёт автоматического приоритета — нужно следовать знакам или правилу правой руки."], ["Kun for busser", "Только для автобусов", "Signalet gjelder alle trafikanter, ikke bare busser.", "Сигнал касается всех участников движения, а не только автобусов."]],
      "Skiltforskriften, signal 1098 gult blinksignal: trafikantene må vise særlig aktpågivenhet og varsomhet. Signalanlegget regulerer ikke krysset, så skiltene gjelder, eller høyreregelen hvis det ikke er skilt.",
      "Skiltforskriften, сигнал 1098 (мигающий жёлтый): участники движения должны проявлять особую внимательность и осторожность. Светофор перекрёсток не регулирует — действуют знаки, а если их нет, правило правой руки.",
      "Мигающий жёлтый — не «можно ехать», а «думай сам»."),

    q("035", "Hva gjelder hvis politiet dirigerer trafikken og gir andre signaler enn lyset?",
      "Что действует, если полицейский регулирует движение и его сигналы противоречат светофору?",
      [["Politiets tegn gjelder foran både lys og skilt", "Сигналы полицейского важнее и светофора, и знаков"], ["Lyset gjelder", "Действует светофор", "Politiets tegn har høyere prioritet enn trafikklyset, ikke omvendt.", "Сигналы полицейского важнее светофора, а не наоборот."], ["Skiltene gjelder", "Действуют знаки", "Skilt kommer lavere i rangordningen enn både politiets tegn og trafikklys.", "Знаки стоят ниже в иерархии, чем сигналы полицейского и светофор."], ["Du velger selv", "Выбираешь сам", "Det finnes en fast rangordning, du kan ikke velge fritt hvilket signal du følger.", "Есть чёткая иерархия, свободно выбирать, какому сигналу следовать, нельзя."]],
      "Rangordningen er: politiets tegn, deretter trafikklys, deretter skilt, deretter de generelle reglene som høyreregelen.",
      "Иерархия: сигналы полицейского, затем светофор, затем знаки, затем общие правила вроде правила правой руки.",
      "Полицейский > светофор > знаки > правило правой руки."),

    q("036", "Er det lov å stanse på motorveg?",
      "Можно ли останавливаться на автомагистрали?",
      [["Nei, bare ved nødstilfelle på vegskulderen", "Нет, только в аварийной ситуации на обочине"], ["Ja, hvis du setter på nødblink", "Да, если включить аварийку", "Nødblink alene gjør ikke stans lovlig, forbudet gjelder uansett unntatt ved reell nødsituasjon.", "Одна аварийка не делает остановку законной — запрет действует, кроме реальной аварийной ситуации."], ["Ja, i inntil 5 minutter", "Да, до 5 минут", "Det finnes ikke noe unntak basert på tid, stans er forbudt uansett hvor kort.", "Исключения по времени нет — остановка запрещена, даже если совсем ненадолго."], ["Ja, for å ta bilder", "Да, чтобы сделать фото", "Å ta bilder er ikke en nødsituasjon og gir ikke rett til å stanse på motorveg.", "Фотографирование — не аварийная ситуация и не даёт права останавливаться на автомагистрали."]],
      "På motorveg er det forbudt å stanse, rygge, snu og å gå. Stans kun ved nød, og da så langt ut på skulderen som mulig.",
      "На автомагистрали запрещено останавливаться, сдавать назад, разворачиваться, ходить пешком. Остановка только при аварии, максимально на обочине.",
      "Если остановился в нужде: аварийка, жилет, треугольник за 100+ м, и сам — за отбойник."),

    q("037", "Hvilke kjøretøy har ikke lov på motorveg?",
      "Какому транспорту запрещено на автомагистраль?",
      [["Kjøretøy som ikke kan holde minst 40 km/t, gående og syklende", "ТС, не способным держать 40 км/ч, пешеходам и велосипедистам"], ["Bare lastebiler", "Только грузовикам", "Lastebiler kan kjøre på motorveg, forbudet gjelder kjøretøy som ikke klarer minst 40 km/t.", "Грузовикам на автомагистраль можно — запрет касается транспорта, не способного держать 40 км/ч."], ["Bare elbiler", "Только электромобилям", "Elbiler har ingen begrensning på motorveg, regelen handler om fartsevne, ikke drivstofftype.", "У электромобилей нет ограничения на автомагистрали — правило касается скорости, а не типа двигателя."], ["Alle kan kjøre på motorveg", "Всем можно", "Langsomme kjøretøy, syklende og gående har nettopp ikke adgang.", "Медленному транспорту, велосипедистам и пешеходам как раз нельзя."]],
      "Motorveg og motortrafikkveg er bare for motorvogn som kan holde minst 40 km/t. Moped, traktor, sykkel og gående har ikke adgang.",
      "Автомагистраль и motortrafikkveg только для моторных ТС, способных держать 40 км/ч. Мопеды, тракторы, велосипеды и пешеходы не допускаются.",
      "Мопед на автомагистрали — нельзя, даже если «быстро проехать»."),

    q("038", "Hva må du gjøre før du rygger?",
      "Что нужно сделать перед движением задним ходом?",
      [["Forsikre deg om at det er fri bane; du har vikeplikt for alle", "Убедиться, что путь свободен; ты уступаешь всем"], ["Tute først", "Сначала посигналить", "Å tute fritar deg ikke fra ansvaret, du har uansett vikeplikt og må selv sikre at det er klart.", "Гудок не снимает ответственности — уступать и убеждаться в безопасности всё равно нужно самому."], ["Sette på nødblink", "Включить аварийку", "Nødblink er ikke et krav ved rygging og erstatter ikke plikten til å forsikre deg om fri bane.", "Аварийка не обязательна при движении задним ходом и не заменяет обязанность убедиться, что путь свободен."], ["Ingenting, andre må passe seg", "Ничего, остальные должны быть внимательны", "Det er nettopp føreren som rygger som har hele ansvaret og vikeplikten, ikke de andre.", "Наоборот, именно тот, кто сдаёт назад, несёт всю ответственность и обязан уступать."]],
      "Den som rygger har vikeplikt for all annen trafikk og alt ansvar for at det er klart. Bruk speil, snu deg og be om hjelp hvis sikten er dårlig.",
      "Тот, кто сдаёт назад, уступает всем и полностью отвечает за безопасность манёвра. Зеркала, поворот головы, помощник при плохом обзоре.",
      "Rygging — одна из самых частых причин мелких ДТП на парковках. Не торопись."),

    /* ---------- ДТП и экстренные службы ---------- */
    q("039", "Hva er du forpliktet til å gjøre hvis du er innblandet i en trafikkulykke?",
      "Что ты обязан сделать, если участвовал в ДТП?",
      [["Stoppe, hjelpe skadde og utveksle opplysninger", "Остановиться, помочь пострадавшим и обменяться данными"], ["Kjøre videre hvis skaden er liten", "Уехать, если ущерб небольшой", "Plikten til å stoppe gjelder uansett hvor liten skaden virker, å kjøre fra stedet er ulovlig.", "Обязанность остановиться действует независимо от размера ущерба — уехать с места незаконно."], ["Bare ringe forsikringsselskapet", "Только позвонить в страховую", "Det holder ikke å bare ringe forsikringen, du må også stoppe og hjelpe på stedet.", "Одного звонка в страховую недостаточно — нужно ещё остановиться и помочь на месте."], ["Vente på politiet uansett", "В любом случае ждать полицию", "Politiet trenger ikke tilkalles ved enhver ulykke, bare i bestemte tilfeller som personskade.", "Полицию вызывают не при любой аварии, а только в определённых случаях, например при травмах."]],
      "Du har plikt til å stoppe, hjelpe skadde og gi navn og adresse til andre involverte. Ved kun materielle skader fyller dere ut skademelding sammen.",
      "Ты обязан остановиться, помочь пострадавшим и дать свои данные другим участникам. Если только повреждения авто — вместе заполняете skademelding.",
      "Уехать с места ДТП — уголовное дело, даже если «просто царапина»."),

    q("040", "Hvilket nummer ringer du ved en alvorlig ulykke med personskade?",
      "По какому номеру звонить при серьёзной аварии с пострадавшими?",
      [["113 (ambulanse)", "113 (скорая)"], ["112 (politi)", "112 (полиция)", "112 er politiet, ved personskade ringer du ambulansen på 113.", "112 — это полиция, при травмах нужно звонить скорой по 113."], ["110 (brann)", "110 (пожарные)", "110 er brannvesenet, ikke ambulansen, som har nummer 113.", "110 — это пожарные, а не скорая, у которой номер 113."], ["911", "911", "911 er det amerikanske nødnummeret. Fra mobil blir det som regel koblet videre til 112, men i Norge skal du lære 110, 112 og 113, og ved personskade ringer du 113.", "911 — американский номер. С мобильного его обычно переадресуют на 112, но в Норвегии надо знать 110, 112 и 113, а при травмах звонить 113."]],
      "110 er brann, 112 er politi, 113 er ambulanse. Ved personskade ringer du 113; operatøren varsler de andre.",
      "110 — пожарные, 112 — полиция, 113 — скорая. При травмах звони 113, оператор вызовет остальных.",
      "Запомни: 110 огонь, 112 полиция, 113 медицина. Норвежский номер 911 не работает как в США."),

    q("041", "Når har du plikt til å varsle politiet etter en trafikkulykke?",
      "Когда после ДТП ты обязан уведомить полицию?",
      [["Når noen er skadet, og skaden ikke er ubetydelig", "Когда кто-то пострадал и травма не пустяковая"], ["Alltid, uansett skade", "Всегда, при любом ущербе", "Ved bare materiell skade og enighet om det som skjedde holder det å fylle ut skademelding. Politiet må ikke varsles.", "При только материальном ущербе и согласии о случившемся достаточно заполнить skademelding. Уведомлять полицию не обязательно."], ["Aldri, det ordnes via forsikringen", "Никогда, всё через страховую", "Vegtrafikkloven § 12 pålegger å varsle politiet ved personskade som ikke er ubetydelig. Forsikringen erstatter ikke den plikten.", "Vegtrafikkloven § 12 обязывает уведомить полицию при травмах, которые не пустяковые. Страховая эту обязанность не заменяет."], ["Bare hvis en bil må slepes", "Только если нужен эвакуатор", "Behovet for sleping avgjør ikke plikten. Det avgjørende er om noen er skadet.", "Необходимость эвакуатора обязанность не определяет. Решает то, пострадал ли кто-то."]],
      "Vegtrafikkloven § 12: har ulykken medført død eller personskade som ikke er ubetydelig, skal de innblandede sørge for at politiet varsles snarest mulig, og ikke forlate stedet uten samtykke. Har du skadet noe og ingen er til stede for å vareta eierens interesser, må du varsle eieren eller politiet. Ved små materielle skader holder det å fylle ut skademelding. Det er også lurt å ringe politiet ved mistanke om rus eller ved uenighet.",
      "Vegtrafikkloven § 12: если авария повлекла смерть или травму, которая не пустяковая, участники обязаны как можно скорее уведомить полицию и не покидать место без её согласия. Если ты что-то повредил и рядом нет никого, кто представляет владельца, нужно уведомить владельца или полицию. При мелком материальном ущербе достаточно skademelding. Полицию также разумно вызвать при подозрении на опьянение или разногласиях.",
      "Держи бланк skademelding (или приложение страховой) в машине: заполнять его нужно на месте."),

    /* ---------- Прицеп и категория B ---------- */
    q("042", "Hvor tung tilhenger kan du trekke med førerkort klasse B?",
      "Какой прицеп можно буксировать с правами категории B?",
      [["Tilhenger inntil 750 kg, eller tyngre hvis bil og henger sammen ikke overstiger 3 500 kg", "До 750 кг, или тяжелее, если машина и прицеп вместе не больше 3 500 кг"], ["Ingen tilhenger", "Никакой", "Klasse B tillater faktisk tilhenger, det er ikke et fullstendig forbud.", "Категория B как раз разрешает прицеп — это не полный запрет."], ["Alle tilhengere inntil 3 500 kg", "Любой до 3 500 кг", "Grensen på 3 500 kg gjelder samlet vekt for bil og henger, ikke hengeren alene.", "Лимит 3 500 кг — это суммарная масса машины и прицепа, а не прицепа отдельно."], ["Bare tilhenger uten brems", "Только без тормозов", "Regelen handler om vekt, ikke om hengeren har brems eller ikke.", "Правило про массу, а не про наличие тормозов у прицепа."]],
      "Klasse B: tilhenger med tillatt totalvekt inntil 750 kg, eller tyngre så lenge samlet tillatt totalvekt for bil og henger ikke overstiger 3 500 kg. Trenger du mer: kode 96 (inntil 4 250 kg) eller klasse BE.",
      "Категория B: прицеп с разрешённой полной массой до 750 кг, или тяжелее, пока суммарная разрешённая масса авто и прицепа не превышает 3 500 кг. Нужно больше — код 96 (до 4 250 кг) или категория BE.",
      "Считай по «tillatt totalvekt» (разрешённая полная масса) из документов, а не по фактическому весу."),

    q("043", "Hvem har ansvaret for at bilen er i forsvarlig stand før kjøring?",
      "Кто отвечает за то, что машина технически исправна перед поездкой?",
      [["Føreren", "Водитель"], ["Bileieren alene", "Только владелец", "Eieren har ansvar for EU-kontroll og forsikring, men det er føreren som har ansvar rett før og under kjøringen.", "Владелец отвечает за техосмотр и страховку, но именно водитель отвечает непосредственно перед поездкой и во время неё."], ["Verkstedet", "Автосервис", "Verkstedet reparerer bilen, men har ikke ansvaret for tilstanden rett før en konkret kjøretur.", "Автосервис чинит машину, но не отвечает за её состояние непосредственно перед конкретной поездкой."], ["Statens vegvesen", "Statens vegvesen", "Statens vegvesen fastsetter regler og fører tilsyn, men har ikke ansvar for den enkelte bilens stand før kjøring.", "Statens vegvesen устанавливает правила и контролирует, но не отвечает за состояние конкретной машины перед поездкой."]],
      "Føreren er ansvarlig for at kjøretøyet er i forsvarlig stand: lys, bremser, dekk, sikt. Eieren er ansvarlig for EU-kontroll og forsikring.",
      "Водитель отвечает за исправность машины перед поездкой: свет, тормоза, шины, обзор. Владелец отвечает за техосмотр (EU-kontroll) и страховку.",
      "Взял чужую машину со сломанным светом и поехал — штраф твой."),

    q("044", "Kan du kjøre med snø på taket og is på rutene?",
      "Можно ли ехать со снегом на крыше и льдом на стёклах?",
      [["Nei, alle ruter og lys skal være fri, og snø på taket må fjernes", "Нет: все стёкла и фары должны быть чистыми, снег с крыши убран"], ["Ja, hvis frontruta er skrapt", "Да, если лобовое очищено", "Alle ruter må være fri for is og snø, ikke bare frontruta.", "Свободны от льда и снега должны быть все стёкла, а не только лобовое."], ["Ja, snøen blåser av", "Да, снег сдует", "Å stole på at snøen blåser av er farlig, den kan treffe bilen bak, så den må fjernes før avreise.", "Надеяться, что снег сдует, опасно — он может попасть в машину сзади, поэтому его нужно убрать перед выездом."], ["Ja, i under 50 km/t", "Да, если меньше 50 км/ч", "Fartsgrensen har ingen betydning her, snø og is skal fjernes uansett hastighet.", "Скорость тут ни при чём — снег и лёд нужно убрать независимо от того, как быстро едешь."]],
      "Du skal ha fri sikt gjennom alle ruter, og lys og skilt skal være synlige. Snø fra taket kan fly av og treffe bilen bak.",
      "Обзор через все стёкла должен быть свободен, фары и номера видны. Снег с крыши может слететь на машину сзади.",
      "«Танковый люк» в лобовом стекле — штраф и опасность. Чисти всё, это 3 минуты."),

    /* ---------- Сигналы, полосы, разное ---------- */
    q("045", "Må syklister bruke sykkelfeltet når det finnes langs vegen?",
      "Обязаны ли велосипедисты ехать по велополосе, если она есть на этой дороге?",
      [["Nei, i Norge kan syklister velge å sykle i kjørebanen", "Нет, в Норвегии велосипедист может ехать и по проезжей части"], ["Ja, sykkelfelt er påbudt der det er anlagt", "Да, велополоса обязательна там, где она проложена", "Det finnes ingen bruksplikt for sykkelfelt i Norge, syklister kan velge kjørebanen.", "В Норвегии обязанности пользоваться велополосой нет — велосипедист может ехать по проезжей части."], ["Bare om sommeren", "Только летом", "Regelen om fritt valg gjelder hele året, ikke bare sommeren.", "Правило свободного выбора действует круглый год, а не только летом."], ["Bare hvis det er mer enn 5 syklister", "Только если велосипедистов больше 5", "Antall syklister har ingen betydning for retten til å velge kjørebanen.", "Количество велосипедистов никак не влияет на право ехать по проезжей части."]],
      "Norge har ingen bruksplikt for sykkelfelt eller sykkelveg. Syklister kan sykle i kjørebanen, og du må regne med dem der selv om det finnes sykkelfelt.",
      "В Норвегии нет обязанности пользоваться велополосой или велодорожкой. Велосипедисты могут ехать по проезжей части, и ты должен быть к этому готов, даже если рядом есть велополоса.",
      "Не сигналь велосипедисту на дороге «иди на велополосу»: он имеет право ехать здесь. Обгоняй с запасом не меньше 1,5 м."),

    q("046", "Når har du lov til å bruke horn (lydsignal) i trafikken?",
      "Когда разрешено использовать звуковой сигнал (клаксон) в дорожном движении?",
      [["Bare for å varsle om fare", "Только чтобы предупредить об опасности"], ["For å hilse på kjente", "Чтобы поприветствовать знакомых", "Lydsignal skal bare brukes for å varsle om fare, ikke som hilsen.", "Звуковой сигнал только для предупреждения об опасности, а не как приветствие."], ["For å få trafikken foran til å skynde seg", "Чтобы поторопить машину впереди", "Å tute av utålmodighet er ikke lovlig bruk av hornet.", "Гудеть от нетерпения — это не разрешённое использование клаксона."], ["Når som helst, det er ingen begrensning", "Когда угодно, ограничений нет", "Det finnes en klar begrensning: bare ved fare, ikke fritt.", "Ограничение есть, и чёткое: только при опасности, а не когда угодно."]],
      "Lyd- og lyssignal skal bare brukes når det er nødvendig for å varsle om fare, ikke for å uttrykke irritasjon eller hilse.",
      "Звуковой и световой сигнал используют только при необходимости предупредить об опасности, а не чтобы выразить раздражение или поприветствовать.",
      "Гудеть от нетерпения в пробке — это не «предупреждение об опасности», такое использование сигнала не по правилам."),

    q("047", "Du oppdager en bilkø rett bak en sving på motorveien. Hva bør du gjøre for å varsle bilene bak deg?",
      "Ты замечаешь затор сразу за поворотом на автомагистрали. Как предупредить машины позади себя?",
      [["Sette på nødblink en kort stund", "На короткое время включить аварийную сигнализацию"], ["Blinke med fjernlys flere ganger", "Несколько раз мигнуть дальним светом", "Fjernlysblink varsler ikke om kø bakover, riktig signal her er nødblink.", "Мигание дальним не предупреждает о заторе сзади, правильный сигнал тут — аварийка."], ["Tute lenge", "Долго сигналить", "Lydsignal hjelper ikke bilene lenger bak deg, de trenger et visuelt varsel.", "Звуковой сигнал не поможет машинам далеко позади — им нужен визуальный сигнал."], ["Stoppe midt i feltet uten varsel", "Остановиться посреди полосы без предупреждения", "Å stoppe uten å varsle øker faren for påkjørsel bakfra i stedet for å redusere den.", "Остановка без предупреждения увеличивает риск удара сзади, а не снижает его."]],
      "Nødblink brukes for å varsle andre trafikanter om fare forut, for eksempel en uventet kø. Slå det av igjen når faren er over.",
      "Аварийная сигнализация используется, чтобы предупредить остальных участников об опасности впереди, например о неожиданном заторе. Выключи её, когда опасность миновала.",
      "Аварийка на пару секунд при внезапном заторе на трассе может предотвратить ДТП сзади — это стандартная практика в Норвегии."),

    q("048", "Du kjører forbi en buss som har stoppet ved en holdeplass for av- og påstigning. Hva skal du gjøre?",
      "Ты проезжаешь мимо автобуса, который остановился на остановке для посадки и высадки. Что нужно сделать?",
      [["Kjøre særlig forsiktig og senke farten, passasjerer kan krysse veien", "Ехать особенно осторожно и снизить скорость — пассажиры могут переходить дорогу"], ["Kjøre forbi i vanlig fart, bussen står stille", "Проезжать с обычной скоростью, автобус же стоит", "At bussen står stille er nettopp grunnen til at passasjerer kan krysse veien, du må senke farten.", "Именно то, что автобус стоит, значит, что пассажиры могут переходить дорогу — скорость нужно снизить."], ["Tute for å varsle passasjerene", "Посигналить, чтобы предупредить пассажиров", "Signalhorn erstatter ikke redusert fart og økt oppmerksomhet.", "Гудок не заменяет снижение скорости и повышенное внимание."], ["Stoppe helt til bussen kjører videre", "Полностью остановиться, пока автобус не поедет", "Full stopp er ikke nødvendig, det holder å senke farten og være klar til å stoppe.", "Полная остановка не обязательна, достаточно снизить скорость и быть готовым остановиться."]],
      "Passasjerer som går av bussen kan komme til å krysse veien uten å se seg godt for. Reduser farten og vær klar til å stoppe.",
      "Пассажиры, выходящие из автобуса, могут перейти дорогу, не посмотрев внимательно по сторонам. Снизь скорость и будь готов остановиться.",
      "Особенно актуально там, где выходят дети или пожилые — они не всегда оценивают скорость машин."),

    q("049", "Du ser et rødt rundt skilt med en hvit vannrett strek i midten ved innkjørselen til en gate. Hva betyr det?",
      "У въезда на улицу висит красный круглый знак с белой горизонтальной полосой посередине. Что он означает?",
      [["Innkjøring forbudt", "Въезд запрещён"], ["Forbudt å stoppe", "Остановка запрещена", "Stoppforbud vises med et helt annet skilt, ikke med rød sirkel og hvit strek.", "Запрет остановки обозначается совсем другим знаком, а не красным кругом с белой полосой."], ["Enveiskjøring startet her", "Начало одностороннего движения", "Dette skiltet forbyr innkjøring helt, det viser ikke bare start på enveiskjøring.", "Этот знак полностью запрещает въезд, а не просто обозначает начало одностороннего движения."], ["Gjennomkjøring forbudt for tunge kjøretøy", "Проезд запрещён для тяжёлого транспорта", "Skiltet gjelder alle kjøretøy, ikke bare tunge, det finnes egne skilt for vektbegrensninger.", "Знак действует для всех ТС, а не только тяжёлых — для весовых ограничений есть отдельные знаки."]],
      "Skiltet «innkjøring forbudt» forbyr kjøretøy å kjøre inn fra den siden. Gaten kan være envegskjørt fra motsatt retning.",
      "Знак «въезд запрещён» запрещает въезд транспорту именно с этой стороны. Улица может быть с односторонним движением, открытым с другой стороны.",
      "Красный круг с белой полосой — единственный полностью красный круглый знак, «кирпич». Не путай с белым кругом с красной каймой: тот запрещает движение всем."),

    q("050", "Hva er piggdekkgebyr?",
      "Что такое piggdekkgebyr (сбор за шипованные шины)?",
      [["En avgift for å kjøre med piggdekk i enkelte storbyer som Oslo, Bergen og Trondheim", "Сбор за использование шипованных шин в некоторых крупных городах, например Осло, Бергене и Тронхейме"], ["En bot for å ikke ha piggdekk om vinteren", "Штраф за отсутствие шипованных шин зимой", "Det er ingen bot for å mangle piggdekk, gebyret er tvert imot for å bruke piggdekk i bestemte byer.", "Штрафа за отсутствие шипов нет — сбор наоборот берут за использование шипов в определённых городах."], ["En avgift alle bileiere betaler uansett dekktype", "Сбор, который платят все владельцы машин независимо от типа шин", "Gebyret gjelder bare biler med piggdekk i noen byer, ikke alle bileiere.", "Сбор касается только машин на шипах в некоторых городах, а не всех автовладельцев."], ["Et gebyr for å bytte dekk på verksted", "Плата за замену шин в автосервисе", "Dette har ingenting med verkstedtjenester å gjøre, det er en avgift for å kjøre med piggdekk i sonen.", "К услугам автосервиса это отношения не имеет — это плата за езду на шипах в зоне сбора."]],
      "I Oslo, Bergen og Trondheim må du betale piggdekkgebyr for å kjøre med piggdekk i gebyrsonen. Stavanger og Kristiansand avviklet ordningen i 2023.",
      "В Осло, Бергене и Тронхейме за езду на шипованных шинах в зоне сбора нужно платить piggdekkgebyr. Ставангер и Кристиансанн отменили сбор в 2023 году.",
      "Купи сезонный абонемент заранее онлайн — это обычно дешевле, чем платить при каждом въезде."),

    q("051", "Hvor stor avstand bør du minst holde til en syklist når du kjører forbi?",
      "Какое минимальное расстояние нужно соблюдать при обгоне велосипедиста?",
      [["Minst 1,5 meter", "Не менее 1,5 метра"], ["Minst 0,5 meter", "Не менее 0,5 метра", "0,5 meter er for lite, anbefalingen er minst 1,5 meter.", "0,5 м слишком мало, рекомендация — минимум 1,5 м."], ["Det finnes ingen anbefalt avstand", "Рекомендованной дистанции не существует", "Det finnes en klar anbefaling på minst 1,5 meter fra Statens vegvesen og Trygg Trafikk.", "Чёткая рекомендация есть — минимум 1,5 м от Statens vegvesen и Trygg Trafikk."], ["Minst 3 meter", "Не менее 3 метров", "3 meter er mer enn den vanlige anbefalingen på 1,5 meter.", "3 м больше обычной рекомендации в 1,5 м."]],
      "Trafikkreglene krever «god avstand» ved forbikjøring av syklende; Statens vegvesen og Trygg Trafikk anbefaler minst 1,5 meter, slik at syklisten ikke kommer i fare hvis vedkommende vingler eller vinden tar tak.",
      "Правила требуют «достаточной дистанции» при обгоне велосипедиста; Statens vegvesen и Trygg Trafikk рекомендуют не менее 1,5 м, чтобы велосипедист не оказался в опасности, если его качнёт или подхватит ветер.",
      "Даже если дорога кажется широкой, не «срезай» рядом с велосипедистом — порыв ветра от твоей машины может его качнуть."),

    q("052", "Kan du krysse en heltrukket midtlinje for å kjøre forbi en syklist eller moped?",
      "Можно ли пересечь сплошную осевую линию, чтобы обогнать велосипедиста или мопед?",
      [["Nei, sperrelinje må ikke krysses; vent til linjen blir stiplet eller sikten tillater forbikjøring på egen side", "Нет, сплошную (sperrelinje) пересекать нельзя; жди, пока линия станет прерывистой или обгон будет возможен в своей полосе"], ["Ja, hvis sikten er god og det ikke er farlig", "Да, если хороший обзор и это не опасно", "God sikt gir ikke unntak, sperrelinjen skal ikke krysses uansett siktforhold.", "Хороший обзор не даёт исключения — сплошную нельзя пересекать при любой видимости."], ["Ja, men bare for syklister, ikke for moped", "Да, но только ради велосипедиста, не мопеда", "Forbudet gjelder likt for både syklister og moped, det finnes ikke noe unntak for den ene.", "Запрет действует одинаково и для велосипедистов, и для мопедов — исключения ни для кого нет."], ["Bare hvis syklisten gir tegn om at det er greit", "Только если велосипедист сам разрешит жестом", "Et tegn fra syklisten endrer ikke loven, sperrelinjen skal ikke krysses uansett.", "Жест велосипедиста закон не меняет — сплошную нельзя пересекать в любом случае."]],
      "Skiltforskriften er klar: «Det må ikke kjøres på eller over sperrelinje.» Norge har ikke noe unntak for forbikjøring av syklister, i motsetning til enkelte andre land. Kravet om god avstand til syklisten gir ikke rett til å bryte sperrelinjen; er det ikke plass, må du vente.",
      "Skiltforskriften однозначна: «по сплошной линии и через неё ехать нельзя». В Норвегии нет исключения для обгона велосипедистов, в отличие от некоторых стран. Требование держать дистанцию до велосипедиста не даёт права пересекать сплошную: если места нет, нужно ждать.",
      "Частая ошибка водителей из других стран: в Швеции и Дании такое исключение есть, в Норвегии — нет. Сплошная = ждёшь."),

    q("053", "Har en vanlig personbil med bare føreren om bord normalt lov til å kjøre i kollektivfelt?",
      "Имеет ли обычный легковой автомобиль, в котором едет только водитель, право ехать по полосе для общественного транспорта?",
      [["Nei, med mindre eget skilt sier noe annet", "Нет, если только отдельный знак не разрешает иное"], ["Ja, alltid, kollektivfelt er åpent for alle biler", "Да, всегда — полоса для общественного транспорта открыта для всех машин", "Kollektivfelt er forbeholdt bestemte kjøretøy, det er ikke åpent for alle biler.", "Полоса для общественного транспорта предназначена для определённых ТС, а не открыта для всех машин."], ["Ja, men bare etter klokken 18", "Да, но только после 18:00", "Adgangen avhenger av skilting, ikke av klokkeslettet.", "Разрешение зависит от знака, а не от времени суток."], ["Ja, hvis det ikke er buss i sikte", "Да, если поблизости не видно автобуса", "Om en buss er synlig eller ikke har ingen betydning, regelen gjelder uansett.", "Видно автобус или нет — не важно, правило действует в любом случае."]],
      "Trafikkreglene § 5 nr. 2: kjøring i kollektivfelt er bare tillatt som angitt på skilt. Likevel kan elbil og hydrogenbil, tohjuls motorsykkel og moped, sykkel, liten elektrisk motorvogn og utrykningskjøretøy bruke feltet. En vanlig bensin- eller dieselbil med bare fører skal holde seg i det ordinære feltet, hvis ikke skiltet åpner for det (for eksempel med 2+ passasjerer).",
      "Trafikkreglene § 5 nr. 2: ехать по kollektivfelt можно только так, как указано на знаке. Исключения: электромобили и водородные машины, двухколёсные мотоциклы и мопеды, велосипеды, электросамокаты и спецтранспорт. Обычная бензиновая или дизельная машина с одним водителем остаётся в обычной полосе, если знак не разрешает иное (например, при 2+ пассажирах).",
      "Проверяй знак под словом «Kollektivfelt» — там часто написано исключение, например для мотоциклов или машин с 2+ пассажирами."),

    q("054", "Du kjører ut av en rundkjøring, og fotgjengere står klare til å krysse gangfeltet ved utkjørselen. Hvem har vikeplikt?",
      "Ты выезжаешь с круга, и пешеходы готовы перейти дорогу по переходу на выезде. У кого обязанность уступить?",
      [["Du har vikeplikt for fotgjengerne i gangfeltet", "Ты обязан уступить пешеходам на переходе"], ["Fotgjengerne må vente til alle biler har kjørt ut", "Пешеходы должны ждать, пока все машины не выедут", "Det er tvert imot bilføreren som har vikeplikt for fotgjengerne, ikke omvendt.", "Наоборот, именно водитель обязан уступить пешеходам, а не они машине."], ["Den som kommer først har forrang", "Преимущество у того, кто подошёл первым", "Ved gangfelt gjelder ikke prinsippet «først til mølla», bilføreren har alltid vikeplikt.", "У перехода принцип «кто первый» не действует — водитель всегда обязан уступить."], ["Vikeplikten avhenger av hvor fort du kjører", "Обязанность уступить зависит от того, с какой скоростью ты едешь", "Farten din endrer ikke vikeplikten, den gjelder uansett hastighet.", "Скорость не меняет обязанность уступить — она действует независимо от того, как быстро ты едешь."]],
      "Gangfelt ved utkjørsel fra rundkjøring fungerer som alle andre gangfelt: bilister har vikeplikt for fotgjengere som er i ferd med å krysse eller står klare til det.",
      "Переход на выезде с круга работает так же, как любой другой переход: водители обязаны уступать пешеходам, которые переходят или готовы перейти дорогу.",
      "Не расслабляйся сразу после круга — переход на выезде такой же «настоящий», как и любой другой."),

    q("055", "Bilen har ABS-bremser. Hva bør du gjøre med bremsepedalen ved en nødbrems?",
      "В машине есть ABS. Что нужно делать с педалью тормоза при экстренном торможении?",
      [["Trykke hardt ned og holde bremsen inne, ABS regulerer automatisk", "Резко и сильно нажать и удерживать педаль, ABS сработает автоматически"], ["Pumpe bremsepedalen raskt selv for å etterligne ABS", "Самому быстро «качать» педаль тормоза, имитируя работу ABS", "Å pumpe selv forstyrrer systemet, du skal bare holde pedalen nede og la ABS gjøre jobben.", "Самостоятельное «качание» мешает системе — нужно просто держать педаль и дать ABS сделать своё дело."], ["Trykke forsiktig, ellers blir bremsingen for kraftig", "Нажимать осторожно, иначе торможение будет слишком сильным", "Ved nødbrems skal du trykke hardt, forsiktig bremsing gir lengre bremselengde.", "При экстренном торможении нужно жать сильно — осторожное торможение увеличивает тормозной путь."], ["Slippe bremsen med jevne mellomrom", "Периодически отпускать педаль", "Å slippe bremsen med jevne mellomrom øker bremselengden, med ABS skal du holde den inne kontinuerlig.", "Периодическое отпускание педали увеличивает тормозной путь — с ABS её нужно держать нажатой непрерывно."]],
      "Med ABS skal du trykke bremsepedalen hardt i bunn og holde den nede. Systemet pulserer bremsetrykket automatisk slik at hjulene ikke låser seg, og du beholder styreevnen.",
      "С ABS нужно резко нажать педаль тормоза до упора и удерживать её. Система сама пульсирует тормозное давление, чтобы колёса не блокировались, и ты сохраняешь управляемость.",
      "Не пытайся «помогать» ABS, качая педаль сама — система делает это быстрее и лучше тебя."),

    q("056", "Hva skjer med lufttrykket i dekkene når temperaturen synker mye om vinteren, og hva bør du gjøre?",
      "Что происходит с давлением воздуха в шинах при сильном похолодании зимой, и что нужно делать?",
      [["Trykket synker, så du bør sjekke og fylle på lufttrykket jevnlig", "Давление падает, поэтому нужно регулярно проверять и подкачивать шины"], ["Trykket øker, så du bør slippe ut luft", "Давление растёт, поэтому нужно спускать воздух", "Trykket synker når det blir kaldere, det øker ikke, så du skal fylle på, ikke slippe ut.", "При похолодании давление падает, а не растёт, — значит, нужно подкачивать, а не спускать."], ["Trykket er upåvirket av temperatur", "Давление не зависит от температуры", "Lufttrykket i dekk endrer seg tydelig med temperaturen, det er ikke upåvirket.", "Давление в шинах заметно меняется от температуры, оно не остаётся постоянным."], ["Du trenger bare å sjekke trykket om sommeren", "Проверять давление нужно только летом", "Trykket faller mest om vinteren, så det er nettopp da kontroll er viktigst.", "Сильнее всего давление падает именно зимой, поэтому проверять его важнее всего в это время."]],
      "Lufttrykket i dekk synker når temperaturen faller. For lavt dekktrykk gir dårligere veigrep og økt slitasje, så sjekk trykket regelmessig gjennom vinteren.",
      "Давление воздуха в шинах падает при понижении температуры. Слишком низкое давление ухудшает сцепление с дорогой и увеличивает износ, поэтому зимой стоит регулярно проверять давление.",
      "Хорошая привычка — проверять давление в шинах при каждой заправке зимой, особенно после резкого похолодания."),

    q("057", "Betyr en gul linje langs fortauskanten i Norge at det er forbudt å stanse der?",
      "Жёлтая линия вдоль бордюра в Норвегии означает, что там запрещена остановка?",
      [["Nei, en slik linje finnes ikke i norsk vegoppmerking, det er kun skilt (370/372) som forbyr stans eller parkering", "Нет, такой линии в норвежской разметке не существует, остановку и стоянку запрещают только знаки (370/372)"], ["Ja, gul linje langs kanten betyr alltid stans forbudt, akkurat som i Sverige", "Да, жёлтая линия вдоль края всегда значит «остановка запрещена», как в Швеции", "Dette er en svensk regel. I norsk vegoppmerking finnes det ingen slik gul kantlinje med denne betydningen.", "Это шведское правило. В норвежской разметке такой жёлтой линии с этим значением нет."], ["Ja, men bare i tettbygd strøk", "Да, но только в населённых пунктах", "Regelen finnes ikke i det hele tatt i Norge, verken i eller utenfor tettbygd strøk.", "Такого правила в Норвегии нет вообще — ни в населённых пунктах, ни за их пределами."], ["Ja, den gule linjen erstatter skiltet «stans forbudt»", "Да, жёлтая линия заменяет знак «остановка запрещена»", "Stans og parkering forbys utelukkende av skilt i Norge, ikke av en kantlinje.", "В Норвегии остановку и стоянку запрещают только знаки, а не линия у бордюра."]],
      "I norsk vegoppmerking finnes ikke en gul kantlinje med betydningen «stans forbudt». Forbud mot stans og parkering settes kun med skilt 370 (stans forbudt) og 372 (parkering forbudt), eventuelt med tilhørende sone.",
      "В норвежской дорожной разметке нет жёлтой линии у бордюра со значением «остановка запрещена». Запреты остановки и стоянки задаются только знаками 370 (остановка запрещена) и 372 (стоянка запрещена), либо соответствующей зоной.",
      "Если видишь жёлтую линию у бордюра в Норвегии — это не запрет, ищи знак."),

    q("058", "Du dobler farten fra 40 til 80 km/t. Hva skjer omtrent med bremselengden?",
      "Ты увеличил скорость вдвое, с 40 до 80 км/ч. Что примерно происходит с тормозным путём?",
      [["Den blir omtrent fire ganger så lang", "Он увеличивается примерно в четыре раза"], ["Den blir omtrent dobbelt så lang, akkurat som farten", "Он увеличивается примерно вдвое, так же, как скорость", "Bremselengden øker med kvadratet av farten, ikke rett proporsjonalt. Dobbel fart gir omtrent firedobbel bremselengde, ikke dobbel.", "Тормозной путь растёт пропорционально квадрату скорости, а не самой скорости. Скорость вдвое — тормозной путь примерно вчетверо, а не вдвое."], ["Den er uendret, bare reaksjonstiden øker", "Он не меняется, увеличивается только время реакции", "Reaksjonslengden øker riktignok med farten, men bremselengden endres også, og øker enda mer.", "Расстояние за время реакции действительно растёт со скоростью, но тормозной путь тоже меняется, причём сильнее."], ["Den blir omtrent tre ganger så lang", "Он увеличивается примерно в три раза", "Sammenhengen er kvadratisk (fart²), så en dobling av farten gir en firedobling, ikke en tredobling.", "Зависимость квадратичная (от скорости в квадрате), поэтому удвоение скорости даёт учетверение, а не утроение."]],
      "Bremselengden avhenger av farten i andre potens. Dobler du farten, blir bremselengden omtrent fire ganger så lang, gitt samme friksjon.",
      "Тормозной путь зависит от скорости во второй степени. При удвоении скорости тормозной путь увеличивается примерно в четыре раза при том же сцеплении с дорогой.",
      "Скорость ×2 → тормозной путь ×4. Это одна из самых частых числовых ловушек на экзамене."),

    q("059", "Du får motorstopp på en landevei utenfor tettbygd strøk og må gå ut av bilen. Hva er du pålagt å gjøre?",
      "У тебя заглох двигатель на загородной дороге вне населённого пункта, и нужно выйти из машины. Что ты обязан сделать?",
      [["Ta på refleksvest før du går ut av bilen", "Надеть светоотражающий жилет перед тем как выйти из машины"], ["Det holder å slå på nødblink, refleksvest er bare anbefalt", "Достаточно включить аварийку, жилет — это только рекомендация", "Nødblink er riktig, men refleksvest er pålagt, ikke bare anbefalt, når du ferdes langs vei utenfor tettbygd strøk.", "Аварийку включить правильно, но жилет обязателен, а не просто желателен, когда ты находишься на дороге вне населённого пункта."], ["Refleksvest trengs bare om natten", "Жилет нужен только ночью", "Kravet gjelder uansett tid på døgnet når du oppholder deg på eller ved kjørebanen utenfor tettbygd strøk.", "Требование действует в любое время суток, если ты находишься на проезжей части или рядом с ней вне населённого пункта."], ["Bare føreren trenger refleksvest, passasjerer slipper", "Жилет нужен только водителю, пассажирам — нет", "Alle som går ut av bilen og oppholder seg på eller ved vegen skal bruke refleksvest, ikke bare føreren.", "Жилет нужен всем, кто выходит из машины и находится на дороге или рядом с ней, а не только водителю."]],
      "Utenfor tettbygd strøk skal fører og passasjerer som må oppholde seg på eller ved kjørebanen, som ved nødstans, bruke refleksvest slik at de er synlige for annen trafikk.",
      "Вне населённого пункта водитель и пассажиры, которым приходится находиться на проезжей части или рядом с ней, например при вынужденной остановке, обязаны надеть светоотражающий жилет, чтобы быть заметными для других.",
      "Жилет должен лежать под рукой в салоне, а не в багажнике — надевать его нужно до того, как выйдешь из машины."),

    q("060", "Hva kjennetegner et fareskilt sammenlignet med et forbudsskilt?",
      "Чем предупреждающий знак (fareskilt) отличается от запрещающего (forbudsskilt)?",
      [["Fareskilt er trekantet med rød kant, forbudsskilt er rundt", "Предупреждающий знак треугольный с красной каймой, запрещающий — круглый"], ["Begge er runde, men fareskilt er gult og forbudsskilt er hvitt", "Оба круглые, но предупреждающий жёлтый, а запрещающий белый", "Fareskilt er trekantet, ikke rundt. Formen, ikke bare fargen, skiller dem.", "Предупреждающий знак треугольный, а не круглый. Их различает форма, а не только цвет."], ["Fareskilt er blått, forbudsskilt er rødt", "Предупреждающий знак синий, запрещающий — красный", "Blå skilt er påbudsskilt, ikke fareskilt. Fareskilt er hvitt med rød kant.", "Синие знаки — это предписывающие, а не предупреждающие. Предупреждающий знак белый с красной каймой."], ["Det er ingen forskjell, begge advarer om det samme", "Разницы нет, оба предупреждают об одном и том же", "Fareskilt varsler om en fare forut, mens forbudsskilt forbyr noe helt konkret. De har ulik funksjon og ulik form.", "Предупреждающий знак сообщает об опасности впереди, а запрещающий прямо что-то запрещает. У них разная функция и разная форма."]],
      "Skiltforskriften deler skilt i kategorier etter form og farge: fareskilt (100) er trekantet med rød kant, forbudsskilt (300) er runde, som regel hvite med rød kant, og forbyr en bestemt handling.",
      "Skiltforskriften делит знаки по форме и цвету: предупреждающие (100) — треугольные с красной каймой, запрещающие (300) — круглые, обычно белые с красной каймой, и прямо что-то запрещают.",
      "Треугольник значит «осторожно, впереди опасность». Круг с красным — конкретный запрет."),

    q("061", "Du kjører forbi fotgjengere som går langs kjørebanen fordi det ikke finnes fortau. Hva gjelder?",
      "Ты проезжаешь мимо пешеходов, которые идут по проезжей части, потому что тротуара нет. Что нужно делать?",
      [["Vise særlig hensyn, senke farten og gi god plass", "Проявить особую осторожность, снизить скорость и дать побольше места"], ["Kjøre som normalt, fotgjengere uten fortau har ikke krav på ekstra hensyn", "Ехать как обычно — пешеходы без тротуара не вправе рассчитывать на что-то особенное", "Trafikkreglene krever at kjørende viser særlig hensyn til gående som ferdes i kjørebanen nettopp fordi de er dårlig beskyttet der.", "Правила требуют от водителя особой осторожности к пешеходам на проезжей части именно потому, что там они плохо защищены."], ["Bruke lydsignal for å få dem til å gå til side", "Посигналить, чтобы они отошли в сторону", "Lydsignal skal bare brukes for å avverge fare, ikke som en rutinemessig måte å be fotgjengere flytte seg på.", "Сигнал предназначен только для предотвращения опасности, а не для того, чтобы обычным порядком просить пешеходов посторониться."], ["Det er fotgjengernes eget ansvar å passe seg, du trenger ikke endre kjøringen", "За безопасность отвечают сами пешеходы, тебе не нужно менять манеру езды", "Ansvaret for å vise hensyn ligger hos deg som kjørende, ikke bare hos fotgjengeren.", "Обязанность проявить осторожность лежит на водителе, а не только на самом пешеходе."]],
      "Der det ikke finnes fortau, har gående lov til å bruke kjørebanen, og kjørende skal etter trafikkreglene vise dem særlig hensyn, senke farten og holde god avstand ved forbikjøring.",
      "Там, где нет тротуара, пешеходам разрешено идти по проезжей части, и по правилам водитель обязан проявлять к ним особую осторожность — снижать скорость и держать хорошую дистанцию при проезде мимо.",
      "Нет тротуара — значит, пешеход на твоей полосе законно. Притормози и объезжай с запасом."),

    q("062", "Du parkerer langs en landevei uten gatelys, i mørket, utenfor tettbygd strøk. Hva må du huske?",
      "Ты паркуешься вдоль загородной дороги без уличного освещения, в темноте, вне населённого пункта. Что нужно помнить?",
      [["Ha parkeringslys tent, slik at bilen er synlig for andre", "Включить стояночные огни, чтобы машину было видно другим"], ["Ingen lys trengs, det holder at bilen står helt i veikanten", "Свет не нужен, достаточно того, что машина стоит у самого края", "Uten lys er en mørk bil svært vanskelig å oppdage for andre trafikanter, selv om den står i kanten.", "Без света тёмную машину очень трудно заметить другим участникам движения, даже если она стоит у самого края."], ["Du må bruke fjernlys slik at bilen synes på lang avstand", "Нужно включить дальний свет, чтобы машину было видно издалека", "Fjernlys på en parkert bil blender møtende trafikk. Det er svake parkeringslys som skal brukes, ikke fjernlys.", "Дальний свет на припаркованной машине слепит встречных. Нужен слабый стояночный свет, а не дальний."], ["Kravet gjelder bare om vinteren", "Это требование действует только зимой", "Kravet om lys på parkert bil i mørket utenfor tettbygd strøk gjelder hele året, ikke bare om vinteren.", "Требование к свету на припаркованной машине в темноте вне населённого пункта действует круглый год, а не только зимой."]],
      "Utenfor tettbygd strøk skal en bil som er parkert langs vegen i mørket ha parkeringslys tent, med mindre stedet er godt belyst, slik at andre trafikanter oppdager den i tide.",
      "Вне населённого пункта у машины, припаркованной вдоль дороги в темноте, должны быть включены стояночные огни — если только место хорошо не освещено — чтобы другие участники движения заметили её вовремя.",
      "За городом в темноте припаркованная машина без света — ловушка для встречных. Включай стояночные огни."),

    /* ---------- Несколько правильных ответов ---------- */
    qm("m01", "Hvilket utstyr er lovpålagt å ha i en personbil? Velg alle riktige.", "Какое оборудование обязательно по закону в легковой машине? Выбери все верные.", [
      ["Varseltrekant", "Знак аварийной остановки", true],
      ["Refleksvest", "Светоотражающий жилет", true],
      ["Førstehjelpsskrin", "Аптечка", false, "Førstehjelpsskrin anbefales, men står ikke i forskriften som krav for personbil.", "Аптечка рекомендуется, но в предписании как обязательное для легковой не значится."],
      ["Brannslukker", "Огнетушитель", false, "Brannslukker er påbudt i buss og enkelte spesialkjøretøy, ikke i vanlig personbil.", "Огнетушитель обязателен в автобусах и спецтранспорте, но не в обычной легковой."]
    ],
    "Forskrift om bruk av kjøretøy § 1-6: bilen skal ha minst én varseltrekant og minst én refleksvest som er lett tilgjengelig for føreren.",
    "Forskrift om bruk av kjøretøy § 1-6: в машине должны быть как минимум один знак аварийной остановки и один светоотражающий жилет, легко доступный водителю.",
    "Запомни пару «треугольник + жилет». Всё остальное — по желанию."),

    qm("m02", "Hvilke overtredelser gir 3 prikker i førerkortet (2026)? Velg alle riktige.", "За какие нарушения дают 3 балла (2026)? Выбери все верные.", [
      ["Bruk av håndholdt mobiltelefon", "Телефон в руке за рулём", true],
      ["Kjøring på rødt lys", "Проезд на красный", true],
      ["Kjøring uten lys om dagen", "Езда без света днём", false, "Manglende lys gir gebyr på 4 100 kr, men ingen prikker.", "За отсутствие света штраф 4 100 kr, но без баллов."],
      ["5 km/t over i 50-sone", "+5 км/ч в зоне 50", false, "Inntil 5 km/t over gir bare 1 250 kr og ingen prikker; prikker starter fra 11 km/t over.", "До +5 км/ч — только 1 250 kr без баллов; баллы начинаются с +11."]
    ],
    "Mobil, rødt lys, brudd på vikeplikt, for kort avstand og ulovlig forbikjøring gir 10 750 kr og 3 prikker.",
    "Телефон, красный свет, непропуск, короткая дистанция и незаконный обгон — 10 750 kr и 3 балла.",
    "Группа «10 750 kr + 3 балла»: телефон, красный, vikeplikt, дистанция, обгон."),

    qm("m03", "Hvor er det forbudt å stanse? Velg alle riktige.", "Где запрещена остановка? Выбери все верные.", [
      ["Nærmere enn 5 meter foran gangfelt", "Ближе 5 м перед пешеходным переходом", true],
      ["Nærmere enn 20 meter fra skilt for bussholdeplass", "Ближе 20 м от знака автобусной остановки", true],
      ["I vegkryss og nærmere enn 5 meter fra krysset", "На перекрёстке и ближе 5 м от него", true],
      ["På alle veger med fartsgrense 50 km/t", "На всех дорогах с лимитом 50", false, "Fartsgrensen bestemmer ikke om stans er forbudt; det avgjøres av skilt og de faste avstandsreglene.", "Лимит скорости не определяет запрет остановки — его задают знаки и правила дистанций."]
    ],
    "Trafikkreglene § 17: stans er forbudt i vegkryss og nærmere enn 5 meter fra krysset, nærmere enn 5 meter foran gangfelt og innenfor 20 meter fra holdeplasskilt.",
    "Trafikkreglene § 17: остановка запрещена на перекрёстке и ближе 5 м от него, ближе 5 м перед переходом и в пределах 20 м от знака остановки транспорта.",
    "Две цифры: 5 м (переход, перекрёсток) и 20 м (остановка автобуса/трамвая)."),

    qm("m04", "Hvem har du vikeplikt for når du kjører ut fra en parkeringsplass? Velg alle riktige.", "Кому ты уступаешь, выезжая с парковки? Выбери все верные.", [
      ["Kjørende på vegen", "Транспорту на дороге", true],
      ["Gående på fortauet", "Пешеходам на тротуаре", true],
      ["Syklende på sykkelveg langs vegen", "Велосипедистам на велодорожке вдоль дороги", true],
      ["Ingen: høyreregelen gjelder", "Никому: действует правило правой руки", false, "Høyreregelen gjelder ikke ved utkjøring fra parkeringsplass, gårdsveg eller lignende. Der viker du for alle.", "Правило правой руки не работает при выезде с парковки, двора и т.п. — там уступаешь всем."]
    ],
    "Trafikkreglene § 7: den som kjører ut fra parkeringsplass, gårdsveg, bensinstasjon eller annen veg som ikke er åpen for alminnelig ferdsel, har vikeplikt for all trafikk, også gående og syklende.",
    "Trafikkreglene § 7: выезжающий с парковки, двора, заправки и т.п. уступает всем — и машинам, и пешеходам, и велосипедистам.",
    "Выезд с «не-дороги» = уступи всем без исключения."),

    qm("m05", "I hvilke situasjoner gjelder IKKE høyreregelen? Velg alle riktige.", "В каких случаях правило правой руки НЕ действует? Выбери все верные.", [
      ["Når krysset er regulert med trafikklys som virker", "Когда перекрёсток регулируется работающим светофором", true],
      ["Når du har vikepliktskilt eller stoppskilt", "Когда у тебя знак «уступи» или STOP", true],
      ["Når du kjører ut fra gårdsveg eller parkeringsplass", "Когда выезжаешь со двора или парковки", true],
      ["I et vanlig kryss uten skilt og lys", "На обычном перекрёстке без знаков и светофора", false, "Det er nettopp der høyreregelen gjelder: uten skilt og lys viker du for trafikk fra høyre.", "Именно там правило правой руки и действует: без знаков и светофора уступаешь тому, кто справа."]
    ],
    "Rangordningen er: politiets tegn, trafikklys, skilt, og til slutt de generelle reglene som høyreregelen. Ved utkjøring fra gårdsveg og lignende har du vikeplikt for alle.",
    "Порядок: указания полиции, светофор, знаки, и только потом общие правила вроде правила правой руки. При выезде со двора уступаешь всем.",
    "Правило правой руки — «запасное»: работает, только когда нет ничего другого."),

    qm("m06", "Hva er riktig om sikring av barn i bil? Velg alle riktige.", "Что верно про перевозку детей? Выбери все верные.", [
      ["Barn under 135 cm skal bruke godkjent barnesikring", "Дети ниже 135 см — в одобренном детском удерживающем устройстве", true],
      ["Føreren har ansvaret for at barn under 15 år er sikret", "За детей младше 15 лет отвечает водитель", true],
      ["Barn over 135 cm kan bruke bilens vanlige belte", "Дети выше 135 см могут пользоваться обычным ремнём", true],
      ["Barn kan sitte på fanget hvis turen er kort", "На короткую поездку ребёнка можно взять на колени", false, "Det finnes ikke noe unntak for korte turer. Alle skal være sikret hele tiden.", "Исключений для коротких поездок нет — все должны быть пристёгнуты всегда."]
    ],
    "Grensen er 135 cm: under den skal barn ha godkjent barnesikring, over den holder bilbelte. Fører har ansvaret for passasjerer under 15 år.",
    "Порог 135 см: ниже — детское устройство, выше — достаточно ремня. За пассажиров младше 15 отвечает водитель.",
    "135 см и 15 лет — две цифры, которые надо помнить."),

    qm("m07", "Hva er riktig om alkohol og bilkjøring i Norge? Velg alle riktige.", "Что верно про алкоголь и вождение в Норвегии? Выбери все верные.", [
      ["Promillegrensen er 0,2", "Лимит — 0,2 промилле", true],
      ["Du kan fortsatt ha promille morgenen etter en fest", "Утром после вечеринки промилле может ещё быть выше лимита", true],
      ["Kaffe og dusj senker promillen", "Кофе и душ снижают промилле", false, "Bare tid bryter ned alkoholen, omtrent 0,1–0,15 promille i timen. Kaffe gjør deg bare mer våken.", "Алкоголь выводит только время, примерно 0,1–0,15 промилле в час. Кофе лишь бодрит."],
      ["Grensen er 0,5 som i mange andre land", "Лимит 0,5, как во многих странах", false, "Norge har en strengere grense enn mange land: 0,2 promille.", "В Норвегии лимит строже, чем во многих странах: 0,2 промилле."]
    ],
    "Vegtrafikkloven § 22: promillegrensen er 0,2. Kroppen bryter ned alkohol sakte, så «dagen derpå» kan du fortsatt være over grensen.",
    "Vegtrafikkloven § 22: лимит 0,2 промилле. Организм расщепляет алкоголь медленно, поэтому «на следующий день» можно всё ещё быть над лимитом.",
    "0,2 — это практически ноль. Если пил вечером, утром — не за руль без проверки."),

    qm("m08", "I hvilke byer må du betale piggdekkgebyr (2026)? Velg alle riktige.", "В каких городах платят сбор за шипованные шины (2026)? Выбери все верные.", [
      ["Oslo", "Осло", true],
      ["Bergen", "Берген", true],
      ["Trondheim", "Тронхейм", true],
      ["Stavanger", "Ставангер", false, "Stavanger avviklet piggdekkgebyret i 2023.", "Ставангер отменил сбор за шипы в 2023 году."]
    ],
    "Piggdekkgebyr kreves i Oslo, Bergen og Trondheim. Stavanger avviklet ordningen i 2023.",
    "Сбор за шипы действует в Осло, Бергене и Тронхейме. Ставангер отменил его в 2023.",
    "Три города: Oslo, Bergen, Trondheim."),

    qm("m09", "Hva er riktig om bruk av lys? Velg alle riktige.", "Что верно про использование света? Выбери все верные.", [
      ["Nærlys er påbudt hele døgnet, også om dagen", "Ближний свет обязателен круглосуточно, и днём", true],
      ["Fjernlys skal slås av ved møtende trafikk", "Дальний свет выключают при встречном транспорте", true],
      ["Fjernlys skal slås av når du ligger bak en annen bil", "Дальний свет выключают, когда едешь за другой машиной", true],
      ["Tåkelys kan brukes når som helst", "Противотуманные фары можно включать когда угодно", false, "Tåkelys skal bare brukes ved tåke, snøvær eller annen dårlig sikt, ellers blender de.", "Противотуманки — только в туман, снегопад или другую плохую видимость, иначе они слепят."]
    ],
    "Trafikkreglene § 15: nærlys hele døgnet; fjernlys skal ikke brukes slik at det blender møtende eller bilen foran. Tåkelys bare ved dårlig sikt.",
    "Trafikkreglene § 15: ближний свет всегда; дальний нельзя использовать так, чтобы слепить встречных или машину впереди. Противотуманки только при плохой видимости.",
    "Дальний свет = «никого впереди и навстречу». Иначе ближний."),

    qm("m10", "Hva er riktig om dekk om vinteren? Velg alle riktige.", "Что верно про зимние шины? Выбери все верные.", [
      ["Minste mønsterdybde i vinterperioden er 3 mm", "Минимальная глубина протектора зимой — 3 мм", true],
      ["Piggdekk er tillatt i Sør-Norge fra 1. november", "Шипы разрешены на юге Норвегии с 1 ноября", true],
      ["Piggdekk kan brukes hele året", "Шипы можно использовать круглый год", false, "Piggdekk er bare tillatt i vinterperioden (til første mandag etter 2. påskedag), eller når føret krever det.", "Шипы разрешены только в зимний период (до первого понедельника после 2. påskedag) или когда этого требуют дорожные условия."],
      ["Sommerdekk er alltid lov, uansett føre", "Летние шины разрешены всегда, при любых условиях", false, "Dekkene skal passe føret. På snø og is oppfyller sommerdekk ikke kravet til veggrep.", "Шины должны соответствовать условиям. На снегу и льду летняя резина не отвечает требованию к сцеплению."]
    ],
    "Fra 1. november til første søndag etter 2. påskedag (Nord-Norge 16. oktober–30. april) er kravet minst 3 mm mønster. Piggdekk kan brukes i samme periode.",
    "С 1 ноября до первого воскресенья после 2. påskedag (север: 16 октября – 30 апреля) требуется минимум 3 мм протектора. Шипы — в тот же период.",
    "Зимой 3 мм, летом 1,6 мм. Шипы — с 1 ноября."),

    qm("m11", "Hvilke kjøretøy og trafikanter har ikke lov til å bruke motorveg? Velg alle riktige.", "Кому нельзя на автомагистраль? Выбери все верные.", [
      ["Gående", "Пешеходам", true],
      ["Syklende", "Велосипедистам", true],
      ["Kjøretøy som ikke kan holde minst 40 km/t", "Транспорту, не способному ехать 40 км/ч", true],
      ["Elbiler", "Электромобилям", false, "Elbiler er vanlige biler og kan kjøre på motorveg. Regelen handler om fartsevne, ikke drivstoff.", "Электромобили — обычные машины и ездят по автомагистрали. Правило про способность держать скорость, а не про тип двигателя."]
    ],
    "På motorveg er det forbudt for gående, syklende og kjøretøy som ikke kan eller får kjøre minst 40 km/t. Det er også forbudt å stanse, rygge, snu og parkere.",
    "На автомагистрали запрещены пешеходы, велосипеды и транспорт, который не может ехать минимум 40 км/ч. Также запрещены остановка, движение задним ходом, разворот и парковка.",
    "Автомагистраль — только для тех, кто держит 40+ км/ч, и без остановок."),

    qm("m12", "Hva er riktig om tilhenger med førerkort klasse B? Velg alle riktige.", "Что верно про прицеп с категорией B? Выбери все верные.", [
      ["Tilhenger med tillatt totalvekt inntil 750 kg kan alltid trekkes", "Прицеп с разрешённой полной массой до 750 кг можно тянуть всегда", true],
      ["Tyngre tilhenger er lov hvis bil og henger til sammen ikke overstiger 3 500 kg", "Прицеп тяжелее можно, если сумма масс машины и прицепа не превышает 3 500 кг", true],
      ["Med kode 96 kan samlet vekt være inntil 4 250 kg", "С кодом 96 суммарная масса может быть до 4 250 кг", true],
      ["Alle tilhengere inntil 3 500 kg er lov uansett bil", "Любой прицеп до 3 500 кг можно тянуть с любой машиной", false, "3 500 kg er grensen for bil og henger til sammen, ikke for hengeren alene.", "3 500 кг — предел для машины и прицепа вместе, а не для прицепа отдельно."]
    ],
    "Klasse B: henger inntil 750 kg, eller tyngre henger så lenge bil + henger ≤ 3 500 kg. Kode 96 utvider til 4 250 kg samlet, klasse BE til henger inntil 3 500 kg.",
    "Категория B: прицеп до 750 кг, либо тяжелее при условии машина + прицеп ≤ 3 500 кг. Код 96 расширяет до 4 250 кг суммарно, категория BE — до прицепа 3 500 кг.",
    "Считай сумму: машина + прицеп ≤ 3 500 кг. Прицеп ≤ 750 кг — считать не надо."),

    qm("m13", "Hva er riktig om prikker i førerkortet? Velg alle riktige.", "Что верно про штрафные баллы? Выбери все верные.", [
      ["8 prikker i løpet av 3 år gir tap av førerkort i 6 måneder", "8 баллов за 3 года — лишение прав на 6 месяцев", true],
      ["I prøveperioden (første 2 år) teller hver prikk dobbelt", "В испытательный срок (первые 2 года) каждый балл считается вдвойне", true],
      ["Prikker slettes 3 år etter at de ble gitt", "Баллы сгорают через 3 года после получения", true],
      ["Prikkene forsvinner hvis du betaler boten med en gang", "Баллы исчезают, если сразу оплатить штраф", false, "Betaling av boten endrer ikke prikkene. De står i 3 år uansett.", "Оплата штрафа на баллы не влияет — они висят 3 года в любом случае."]
    ],
    "Prikkbelastning: 8 prikker på 3 år gir 6 måneders tap. Nye førere får dobbelt antall prikker de første 2 årene. Prikkene slettes etter 3 år.",
    "Система баллов: 8 баллов за 3 года — лишение на 6 месяцев. Новички первые 2 года получают двойные баллы. Баллы сгорают через 3 года.",
    "Цифры: 8 баллов, 3 года, 6 месяцев, ×2 первые 2 года."),

    qm("m14", "Hva plikter du å gjøre hvis du er innblandet i en trafikkulykke? Velg alle riktige.", "Что ты обязан сделать, если попал в ДТП? Выбери все верные.", [
      ["Stanse straks og hjelpe skadde", "Немедленно остановиться и помочь пострадавшим", true],
      ["Oppgi navn og adresse til de andre involverte", "Сообщить другим участникам своё имя и адрес", true],
      ["Varsle politiet hvis noen er skadet, og skaden ikke er ubetydelig", "Уведомить полицию, если кто-то пострадал и травма не пустяковая", true],
      ["Kjøre videre hvis du mener skaden er liten", "Уехать, если считаешь, что ущерб небольшой", false, "Plikten til å stanse og utveksle opplysninger gjelder uansett hvor liten skaden virker. Å kjøre fra stedet er straffbart.", "Обязанность остановиться и обменяться данными действует при любом, даже пустяковом ущербе. Уехать с места — наказуемо."]
    ],
    "Vegtrafikkloven § 12: alle som er innblandet skal straks stanse, hjelpe skadde, og oppgi navn og adresse. Ved personskade som ikke er ubetydelig skal politiet varsles, og du skal ikke forlate stedet uten samtykke. Ved bare materiell skade fyller partene ut skademelding.",
    "Vegtrafikkloven § 12: все участники обязаны немедленно остановиться, помочь пострадавшим и сообщить имя и адрес. При травмах, которые не пустяковые, уведомляют полицию и не покидают место без её согласия. При только материальном ущербе стороны заполняют skademelding.",
    "Три обязанности: остановиться, помочь, назваться. Травма — плюс полиция.")
  ];

  /* Вопросы, где знак описан словами, показываем и сам знак — так на экзамене. */
  const SIGN_IMG = { "rules-049": "prohibited-access-entry.png" };
  window.QUESTION_DATA.rules.forEach(x => {
    if (SIGN_IMG[x.id]) x.image = `<img class="sign-img" src="img/signs/${SIGN_IMG[x.id]}" alt="" loading="lazy">`;
  });
})();
