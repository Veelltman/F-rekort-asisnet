/* Банк вопросов: правила и штрафы (trafikkregler og sanksjoner).
   Суммы штрафов — по ставкам forenklet forelegg с 15.02.2026. Они индексируются
   каждый год: если год сменился, сверь цифры с tryggeveier.no или lovdata.no. */

(function () {
  "use strict";

  function q(id, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "rules-" + id, topic: "rules", type: "single-choice",
      prompt_no, prompt_ru, image: null,
      options: opts.map((o, i) => ({ text_no: o[0], text_ru: o[1], correct: i === 0 })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  window.QUESTION_DATA = window.QUESTION_DATA || {};
  window.QUESTION_DATA.rules = [

    /* ---------- Скорость ---------- */
    q("001", "Hva er den generelle fartsgrensen i tettbygd strøk i Norge?",
      "Какое общее ограничение скорости в населённом пункте в Норвегии?",
      [["50 km/t", "50 км/ч"], ["30 km/t", "30 км/ч"], ["60 km/t", "60 км/ч"], ["80 km/t", "80 км/ч"]],
      "Hvis det ikke er skiltet noe annet, er fartsgrensen 50 km/t i tettbygd strøk og 80 km/t utenfor.",
      "Если знаков нет — в населённом пункте 50 км/ч, за его пределами 80 км/ч.",
      "Запомни пару 50/80. Всё остальное (30, 60, 70, 90, 100, 110) всегда обозначено знаками."),

    q("002", "Hva er den generelle fartsgrensen utenfor tettbygd strøk?",
      "Какое общее ограничение скорости вне населённого пункта?",
      [["80 km/t", "80 км/ч"], ["90 km/t", "90 км/ч"], ["100 km/t", "100 км/ч"], ["70 km/t", "70 км/ч"]],
      "Utenfor tettbygd strøk er den generelle fartsgrensen 80 km/t. Motorveger har egne skilt, ofte 100 eller 110.",
      "Вне населённого пункта общее ограничение 80 км/ч. На автомагистралях стоят свои знаки, обычно 100 или 110.",
      "Даже если дорога широкая и пустая, без знака выше 80 ехать нельзя."),

    q("003", "Du kjører 26 km/t over fartsgrensen i en 60-sone. Hva risikerer du?",
      "Ты превысил скорость на 26 км/ч в зоне 60. Чем это грозит?",
      [["Tap av førerkort", "Лишением прав"], ["Bare et gebyr", "Только штрафом"], ["Én prikk", "Одним баллом"], ["Ingenting hvis vegen var tom", "Ничем, если дорога была пустая"]],
      "Der fartsgrensen er 60 km/t eller lavere, mister du normalt førerkortet ved 26 km/t eller mer over grensen. Der grensen er 70 eller høyere, er terskelen 36 km/t over.",
      "Где ограничение 60 и ниже, права обычно отбирают при превышении на 26 км/ч и более. Где 70 и выше — при превышении на 36 км/ч.",
      "В зоне 30 превышение на 26 (то есть 56 км/ч) — уже лишение. Низкие зоны особенно опасны для прав."),

    q("004", "Hva er forelegget for å kjøre 10 km/t for fort i en 50-sone (2026)?",
      "Какой штраф за превышение на 10 км/ч в зоне 50 (2026)?",
      [["3 350 kr", "3 350 крон"], ["1 250 kr", "1 250 крон"], ["5 950 kr", "5 950 крон"], ["Ingen bot under 15 km/t over", "Штрафа нет, если меньше 15 км/ч"]],
      "Satser 2026 der fartsgrensen er 60 eller lavere: til og med 5 over = 1 250 kr, 10 over = 3 350 kr, 15 over = 5 950 kr og 2 prikker, 20 over = 8 650 kr og 3 prikker, 25 over = 13 450 kr og 3 prikker.",
      "Ставки 2026 в зонах 60 и ниже: до 5 км/ч сверх — 1 250 kr, до 10 — 3 350 kr, до 15 — 5 950 kr и 2 балла, до 20 — 8 650 kr и 3 балла, до 25 — 13 450 kr и 3 балла.",
      "Уже с +11 км/ч в городе идут баллы. «Чуть-чуть быстрее» в Норвегии стоит тысячи крон."),

    q("005", "Fra hvor mange km/t over fartsgrensen får du prikker i en 50-sone?",
      "С какого превышения в зоне 50 начисляются штрафные баллы?",
      [["Fra 11 km/t over", "С 11 км/ч сверх лимита"], ["Fra 5 km/t over", "С 5 км/ч"], ["Fra 21 km/t over", "С 21 км/ч"], ["Fart gir aldri prikker", "За скорость баллов не дают"]],
      "I 60-sone eller lavere: 11–15 over gir 2 prikker, 16 og mer gir 3 prikker. I 70-sone eller høyere: 16–20 over gir 2 prikker, 21 og mer gir 3.",
      "В зонах 60 и ниже: превышение на 11–15 даёт 2 балла, на 16 и больше — 3. В зонах 70 и выше: 16–20 даёт 2 балла, 21 и больше — 3.",
      "В городе баллы начинаются раньше, чем на трассе. Логика: рядом пешеходы."),

    q("006", "Hvor fort kan du kjøre i et gatetun?",
      "С какой скоростью можно ехать в жилой зоне (gatetun)?",
      [["Gangfart, det vil si omtrent 5–10 km/t", "Скорость пешехода, примерно 5–10 км/ч"], ["30 km/t", "30 км/ч"], ["20 km/t", "20 км/ч"], ["50 km/t hvis ingen barn er ute", "50 км/ч, если детей нет"]],
      "I gatetun skal du kjøre i gangfart og vike for gående. Gående kan bruke hele gaten.",
      "В gatetun едешь со скоростью пешехода и уступаешь пешеходам. Они могут ходить по всей улице.",
      "Gatetun и gågate: ты гость на территории пешеходов."),

    /* ---------- Алкоголь, телефон, внимание ---------- */
    q("007", "Hva er promillegrensen for bilførere i Norge?",
      "Какой допустимый уровень алкоголя в крови для водителя в Норвегии?",
      [["0,2 promille", "0,2 промилле"], ["0,5 promille", "0,5 промилле"], ["0,8 promille", "0,8 промилле"], ["0,0 promille", "0,0 промилле"]],
      "Promillegrensen er 0,2. I praksis betyr det at du ikke skal drikke alkohol i det hele tatt før du kjører.",
      "Допустимый предел 0,2 промилле. На практике это означает: перед вождением не пить вообще.",
      "0,2 — одно из самых строгих ограничений в Европе. Одна кружка пива уже риск потерять права."),

    q("008", "Du drakk mye i går kveld. Kan du kjøre til jobb klokka 7 neste morgen?",
      "Ты много выпил вчера вечером. Можно ли ехать на работу в 7 утра?",
      [["Ikke sikkert: kroppen bryter ned omtrent 0,1–0,15 promille i timen", "Не факт: организм выводит примерно 0,1–0,15 промилле в час"], ["Ja, etter søvn er alkoholen borte", "Да, после сна алкоголь выходит"], ["Ja, hvis du spiser frokost", "Да, если позавтракать"], ["Ja, kaffe nøytraliserer alkohol", "Да, кофе нейтрализует алкоголь"]],
      "Etter en fuktig kveld kan du fortsatt ha promille neste morgen. Verken søvn, kaffe eller mat gjør deg edru raskere.",
      "После обильного вечера утром в крови ещё может быть алкоголь. Ни сон, ни кофе, ни еда не ускоряют отрезвление.",
      "«Dagen derpå»-кjøring — частая причина лишения прав. Если сомневаешься, не садись за руль."),

    q("009", "Hva skjer hvis du bruker håndholdt mobiltelefon under kjøring (2026)?",
      "Что будет за использование мобильного телефона в руке во время вождения (2026)?",
      [["10 750 kr i gebyr og 3 prikker", "Штраф 10 750 крон и 3 балла"], ["Bare en advarsel første gang", "Только предупреждение в первый раз"], ["Ingenting hvis bilen står i kø", "Ничего, если стоишь в пробке"], ["Gebyr, men ingen prikker", "Штраф без баллов"]],
      "Håndholdt mobilbruk koster 10 750 kr og 3 prikker. Gjelder også i kø og ved rødt lys. Telefonen må stå i holder og betjenes med ett trykk.",
      "Телефон в руке — 10 750 крон и 3 балла. Действует и в пробке, и на красном. Телефон должен быть в держателе и управляться одним касанием.",
      "Телефон в держателе с hands-free — ок. В руке — нет, даже «просто посмотреть карту»."),

    q("010", "Hva er forelegget for å kjøre på rødt lys (2026)?",
      "Какой штраф за проезд на красный (2026)?",
      [["10 750 kr og 3 prikker", "10 750 крон и 3 балла"], ["4 100 kr", "4 100 крон"], ["1 250 kr og 1 prikk", "1 250 крон и 1 балл"], ["Bare prikker, ingen bot", "Только баллы, без штрафа"]],
      "Kjøring på rødt lys, brudd på vikeplikt, ulovlig forbikjøring og for kort avstand koster alle 10 750 kr og 3 prikker.",
      "Проезд на красный, невыполнение обязанности уступить, незаконный обгон и слишком короткая дистанция — по 10 750 крон и 3 балла каждый.",
      "Четыре нарушения «по 10 750 и 3 балла»: красный, vikeplikt, обгон, дистанция. Два таких за два года у новичка — прощай, права."),

    q("011", "Hva er forelegget for å kjøre uten lys (2026)?",
      "Какой штраф за езду без света (2026)?",
      [["4 100 kr", "4 100 крон"], ["10 750 kr", "10 750 крон"], ["1 250 kr", "1 250 крон"], ["Ingen bot om dagen", "Днём штрафа нет"]],
      "Manglende eller feil bruk av lys koster 4 100 kr. Nærlys eller kjørelys er påbudt hele døgnet.",
      "Отсутствие или неправильное использование света — 4 100 крон. Ближний свет или ходовые огни обязательны круглосуточно.",
      "Проверь перед выездом: свет включён? Парковочных огней недостаточно."),

    q("012", "Må du bruke nærlys om dagen i Norge?",
      "Нужно ли включать ближний свет днём в Норвегии?",
      [["Ja, alltid, også i dagslys", "Да, всегда, даже днём"], ["Nei, bare i mørket", "Нет, только в темноте"], ["Bare om vinteren", "Только зимой"], ["Bare utenfor byen", "Только за городом"]],
      "I Norge er det påbudt å kjøre med nærlys eller kjørelys hele døgnet, hele året.",
      "В Норвегии обязательно ехать с ближним светом или ходовыми огнями круглосуточно, круглый год.",
      "На экзамене это первое, на что смотрят при выезде."),

    q("013", "Når må du slå av fjernlyset?",
      "Когда нужно выключать дальний свет?",
      [["Ved møtende trafikk, bak en annen bil og der vegen er godt opplyst", "При встречном транспорте, позади другой машины и на освещённой дороге"], ["Bare i byen", "Только в городе"], ["Aldri, fjernlys er tryggest", "Никогда, дальний безопаснее"], ["Bare når det regner", "Только в дождь"]],
      "Fjernlys blender andre. Slå det av i god tid før møtende, når du ligger bak en bil, og på opplyst veg.",
      "Дальний свет слепит. Выключай заранее перед встречными, когда едешь за машиной и на освещённой дороге.",
      "Переключай на ближний, когда видишь фары встречного — не когда он уже рядом."),

    /* ---------- Баллы и права ---------- */
    q("014", "Hvor mange prikker fører til at du mister førerkortet?",
      "Сколько штрафных баллов приводят к лишению прав?",
      [["8 prikker i løpet av 3 år", "8 баллов за 3 года"], ["5 prikker i løpet av 1 år", "5 баллов за 1 год"], ["10 prikker i løpet av 5 år", "10 баллов за 5 лет"], ["12 prikker totalt", "12 баллов всего"]],
      "8 prikker på 3 år gir tap av førerkort i 6 måneder. Prikkene slettes 3 år etter at de ble registrert.",
      "8 баллов за 3 года — лишение прав на 6 месяцев. Баллы стираются через 3 года после регистрации.",
      "Для новичка это значит: два серьёзных нарушения (по 3 балла ×2) — и ты уже без прав."),

    q("015", "Hva er prøveperioden for nye førere?",
      "Что такое испытательный срок для новых водителей?",
      [["2 år: prikker telles dobbelt, og mister du førerkortet må du ta full prøve på nytt", "2 года: баллы удваиваются, при лишении прав экзамен сдаётся заново"], ["1 år uten spesielle regler", "1 год без особых правил"], ["5 år med lavere fartsgrense", "5 лет с пониженной скоростью"], ["Det finnes ingen prøveperiode", "Испытательного срока нет"]],
      "De første 2 årene er prøveperiode uansett alder. Hver overtredelse gir dobbelt antall prikker, og ved tap av førerkort må du ta både teori og oppkjøring på nytt.",
      "Первые 2 года — испытательный период независимо от возраста. Баллы за каждое нарушение удваиваются, а при лишении прав заново сдаёшь и теорию, и практику.",
      "Испытательный срок действует и для взрослых, кто получил права впервые. Первые два года — время быть особенно аккуратным."),

    q("016", "Hvor lenge mister du normalt førerkortet ved 8 prikker?",
      "На сколько обычно лишают прав при 8 баллах?",
      [["6 måneder", "6 месяцев"], ["1 måned", "1 месяц"], ["1 år", "1 год"], ["For alltid", "Навсегда"]],
      "Standard er 6 måneder. Prikker som er eldre enn 3 år teller ikke.",
      "Стандарт — 6 месяцев. Баллы старше 3 лет не считаются.",
      "6 месяцев без машины в Норвегии, где всё далеко, — серьёзно. Баллы стоит беречь."),

    /* ---------- Ремни, дети, оборудование ---------- */
    q("017", "Barn under hvilken høyde må bruke godkjent barnesikring i bil?",
      "Дети ниже какого роста должны использовать специальное детское кресло или бустер?",
      [["135 cm", "135 см"], ["120 cm", "120 см"], ["150 cm", "150 см"], ["100 cm", "100 см"]],
      "Barn under 135 cm skal bruke godkjent sikringsutstyr. Føreren har ansvaret.",
      "Дети ростом до 135 см должны сидеть в одобренном кресле или бустере. Ответственность на водителе.",
      "Ответственность за непристёгнутых детей несёт водитель, а не родитель-пассажир."),

    q("018", "Hvem har ansvaret for at passasjerer over 15 år bruker bilbelte?",
      "Кто отвечает за пристёгнутость пассажиров старше 15 лет?",
      [["Passasjeren selv", "Сам пассажир"], ["Føreren", "Водитель"], ["Bileieren", "Владелец машины"], ["Ingen, det er frivillig", "Никто, это добровольно"]],
      "Passasjerer over 15 år er selv ansvarlige for å bruke belte. For barn under 15 år er det føreren som har ansvaret.",
      "Пассажиры старше 15 лет сами отвечают за ремень. За детей младше 15 отвечает водитель.",
      "Граница 15 лет — важная деталь на теории."),

    q("019", "Hvilket utstyr er påbudt å ha i bilen?",
      "Какое оборудование обязательно должно быть в машине?",
      [["Varseltrekant og refleksvest", "Знак аварийной остановки и светоотражающий жилет"], ["Brannslukker", "Огнетушитель"], ["Førstehjelpsskrin", "Аптечка"], ["Reservehjul", "Запасное колесо"]],
      "Varseltrekant er påbudt, og refleksvest skal ligge lett tilgjengelig for føreren. Førstehjelpsskrin og brannslukker anbefales, men er ikke påbudt i personbil.",
      "Знак аварийной остановки обязателен, жилет должен лежать в зоне досягаемости водителя. Аптечка и огнетушитель рекомендуются, но для легковых не обязательны.",
      "Жилет — в салоне, не в багажнике: надеть его нужно до того, как выйдешь на дорогу."),

    q("020", "Hvor langt bak bilen skal varseltrekanten settes ved stans på landeveg?",
      "На каком расстоянии позади машины ставить знак аварийной остановки на загородной дороге?",
      [["Minst 100 meter, lengre ved dårlig sikt", "Не менее 100 м, больше при плохой видимости"], ["10 meter", "10 метров"], ["30 meter", "30 метров"], ["Rett bak bilen", "Прямо за машиной"]],
      "På landeveg og motorveg: minst 100 meter bak, gjerne 150–200 ved høy fart. Sett på nødblink og ta på refleksvest først.",
      "На трассе и автомагистрали — минимум 100 м позади, лучше 150–200 при высокой скорости. Сначала аварийка и жилет.",
      "Порядок: аварийка → жилет → треугольник → сам за отбойник."),

    /* ---------- Шины ---------- */
    q("021", "Hva er minste tillatte mønsterdybde på dekk om vinteren?",
      "Какая минимальная глубина протектора шин зимой?",
      [["3 mm", "3 мм"], ["1,6 mm", "1,6 мм"], ["5 mm", "5 мм"], ["2 mm", "2 мм"]],
      "I vinterperioden (1. november til og med første søndag etter 2. påskedag, i Nordland, Troms og Finnmark 16. oktober til 30. april) er kravet 3 mm. Ellers 1,6 mm.",
      "В зимний период (с 1 ноября по первое воскресенье после второго дня Пасхи, в Nordland, Troms и Finnmark с 16 октября по 30 апреля) требование 3 мм. В остальное время 1,6 мм.",
      "Зима 3 мм, лето 1,6 мм. Новая шина имеет около 8 мм."),

    q("022", "Når er det lov å bruke piggdekk i Sør-Norge?",
      "Когда разрешены шипованные шины на юге Норвегии?",
      [["Fra 1. november til første mandag etter 2. påskedag", "С 1 ноября до первого понедельника после второго дня Пасхи"], ["Fra 1. oktober til 1. mai", "С 1 октября до 1 мая"], ["Hele året", "Круглый год"], ["Fra 1. desember til 1. mars", "С 1 декабря до 1 марта"]],
      "I Sør-Norge: 1. november til første mandag etter 2. påskedag. I Nordland, Troms og Finnmark: 16. oktober til 30. april. Ved vinterføre er piggdekk lov også utenfor perioden.",
      "На юге: с 1 ноября до первого понедельника после второго дня Пасхи. В Nordland, Troms и Finnmark: с 16 октября до 30 апреля. При зимних условиях шипы разрешены и вне периода.",
      "В Oslo, Bergen и Trondheim за шипы платят piggdekkgebyr: дневной билет или сезонный абонемент. Stavanger отменил сбор в 2023 году."),

    q("023", "Er det påbudt med vinterdekk på personbil?",
      "Обязательны ли зимние шины на легковом автомобиле?",
      [["Nei, men dekkene må passe føret, og om vinteren kreves minst 3 mm mønster", "Нет, но шины должны соответствовать условиям, зимой минимум 3 мм протектора"], ["Ja, fra 1. november", "Да, с 1 ноября"], ["Ja, alltid piggdekk", "Да, всегда шипованные"], ["Nei, sommerdekk er alltid lov", "Нет, летние всегда разрешены"]],
      "Loven krever at dekkene er egnet for føret. Kjører du på sommerdekk på snø og is, kan du få gebyr og bli stoppet. For tunge kjøretøy er vinterdekk påbudt.",
      "Закон требует, чтобы шины подходили условиям. Езда на летних по снегу и льду — штраф и запрет продолжать движение. Для тяжёлых ТС зимние шины обязательны.",
      "Правило здравого смысла закреплено законом: на летних по льду ехать нельзя, даже если календарь ещё «летний»."),

    /* ---------- Остановка и парковка ---------- */
    q("024", "Hvor nær et gangfelt kan du parkere?",
      "Как близко к пешеходному переходу можно парковаться?",
      [["Ikke nærmere enn 5 meter foran gangfeltet", "Не ближе 5 м перед переходом"], ["Ikke nærmere enn 2 meter", "Не ближе 2 м"], ["Rett inntil, hvis du ikke står på stripene", "Вплотную, если не на зебре"], ["Ikke nærmere enn 20 meter", "Не ближе 20 м"]],
      "Det er forbudt å stanse på gangfelt eller nærmere enn 5 meter foran det. Bak gangfeltet er det tillatt.",
      "Запрещено останавливаться на переходе или ближе 5 м перед ним. Позади перехода можно.",
      "5 м перед переходом — чтобы водители видели пешеходов. За переходом машина обзор не закрывает."),

    q("025", "Hvor nær et vegkryss er det forbudt å stanse?",
      "На каком расстоянии от перекрёстка запрещена остановка?",
      [["Nærmere enn 5 meter", "Ближе 5 метров"], ["Nærmere enn 10 meter", "Ближе 10 метров"], ["Nærmere enn 15 meter", "Ближе 15 метров"], ["I krysset, men ikke ved siden", "На перекрёстке, но не рядом"]],
      "Det er forbudt å stanse i vegkryss eller nærmere enn 5 meter fra krysset, målt fra der fortauskanten begynner å runde.",
      "Запрещено останавливаться на перекрёстке или ближе 5 м от него, считая от начала закругления бордюра.",
      "Число 5 м повторяется: и от перекрёстка, и перед переходом."),

    q("026", "Hvor nær et busstopp-skilt er det forbudt å stanse?",
      "Как близко к знаку автобусной остановки запрещено останавливаться?",
      [["Nærmere enn 20 meter", "Ближе 20 метров"], ["Nærmere enn 5 meter", "Ближе 5 метров"], ["Nærmere enn 50 meter", "Ближе 50 метров"], ["Det er tillatt hvis bussen ikke kommer", "Можно, если автобуса нет"]],
      "Stans er forbudt nærmere enn 20 meter fra skilt for holdeplass for buss, drosje eller sporvogn.",
      "Остановка запрещена ближе 20 м от знака остановки автобуса, такси или трамвая.",
      "20 м — примерно 4 машины. Автобусу нужно место, чтобы подъехать к бордюру."),

    q("027", "Hva er forskjellen på «stans» og «parkering»?",
      "В чём разница между «stans» (остановка) и «parkering» (парковка)?",
      [["Stans er kort stopp for av- og pålessing; parkering er all annen hensetting", "Stans — короткая остановка для посадки/выгрузки; parkering — любое другое оставление машины"], ["Stans er under 5 minutter, parkering er over", "Stans меньше 5 минут, parkering больше"], ["Det er det samme", "Это одно и то же"], ["Parkering er bare på P-plass", "Parkering только на парковке"]],
      "Stans: kortvarig stopp for av- eller påstigning eller lasting. Parkering: enhver hensetting som ikke er stans, uansett om føreren sitter i bilen.",
      "Stans: кратковременная остановка для посадки, высадки или погрузки. Parkering: любое другое оставление машины, даже если водитель сидит внутри.",
      "Сидеть в машине и ждать друга 10 минут — это уже parkering, а не stans."),

    q("028", "Kan du parkere på venstre side av vegen?",
      "Можно ли парковаться на левой стороне дороги?",
      [["Bare i envegskjørt gate", "Только на односторонней улице"], ["Ja, alltid", "Да, всегда"], ["Ja, hvis det er lite trafikk", "Да, если мало машин"], ["Nei, aldri", "Нет, никогда"]],
      "På veg med trafikk i begge retninger skal du stanse og parkere på høyre side i kjøreretningen. I envegskjørt gate kan du bruke begge sider.",
      "На дороге с двусторонним движением останавливаешься и паркуешься справа по ходу. На односторонней улице можно с обеих сторон.",
      "Парковка «против шерсти» на двусторонней дороге — штраф, и это частая ошибка приезжих."),

    /* ---------- Обгон, дистанция, полосы ---------- */
    q("029", "Hva gjelder for forbikjøring rett foran et gangfelt?",
      "Что действует для обгона прямо перед пешеходным переходом?",
      [["Forbudt", "Запрещён"], ["Tillatt hvis ingen fotgjengere", "Разрешён, если нет пешеходов"], ["Tillatt i 30-sone", "Разрешён в зоне 30"], ["Tillatt for sykler", "Разрешён для велосипедов"]],
      "Det er forbudt å kjøre forbi rett foran eller i gangfelt. En bil som stopper kan skjule en fotgjenger for deg.",
      "Обгон перед переходом или на нём запрещён. Остановившаяся машина может скрывать пешехода.",
      "Классический сценарий ДТП: сосед притормозил у зебры, ты обгоняешь — и сбиваешь пешехода."),

    q("030", "Hva er tresekundersregelen?",
      "Что такое правило трёх секунд?",
      [["Anbefalt minsteavstand til bilen foran: 3 sekunder", "Рекомендуемая минимальная дистанция до машины впереди: 3 секунды"], ["Du må stoppe i 3 sekunder ved stoppskilt", "У знака STOP стоять 3 секунды"], ["Blinklys skal være på i 3 sekunder før sving", "Поворотник включать за 3 секунды до поворота"], ["Du har 3 sekunder på å vike", "У тебя 3 секунды, чтобы уступить"]],
      "Velg et fast punkt bilen foran passerer, og tell «tusen-og-en, tusen-og-to, tusen-og-tre». Passerer du punktet før du er ferdig, ligger du for nær.",
      "Выбери ориентир, который проехала машина впереди, и считай «тысяча один, тысяча два, тысяча три». Проехал ориентир раньше — дистанция мала.",
      "На мокрой или зимней дороге увеличивай до 4–5 секунд. Слишком короткая дистанция — 10 750 kr и 3 балла."),

    q("031", "Hvor skal du kjøre på en veg med to felt i samme retning?",
      "В какой полосе ехать на дороге с двумя полосами в одну сторону?",
      [["I høyre felt; venstre felt brukes til forbikjøring", "В правой; левая для обгона"], ["I venstre felt, det er raskest", "В левой, там быстрее"], ["Hvor som helst", "Где угодно"], ["I midten av begge", "Посередине"]],
      "Hold til høyre. Venstre felt er for forbikjøring, og du skal tilbake til høyre etterpå. Unntak: i tettbygd strøk med fartsgrense 60 eller lavere kan du velge felt fritt.",
      "Держись справа. Левая полоса для обгона, после обгона возвращайся направо. Исключение: в населённом пункте с ограничением 60 и ниже полосу можно выбирать свободно.",
      "«Висеть» в левой полосе на трассе — нарушение и раздражитель для всех."),

    q("032", "Hva er fletteregelen (glidelåsprinsippet)?",
      "Что такое правило «молнии» при слиянии полос?",
      [["Bilene fletter annenhver bil fra hvert felt der et felt slutter", "Машины из двух полос сливаются по очереди, через одну"], ["Den som ligger i venstre felt har forrang", "У левой полосы приоритет"], ["Den som kom først kjører først", "Кто первый приехал, тот и едет"], ["Den største bilen kjører først", "Большая машина едет первой"]],
      "Der et kjørefelt slutter og trafikken flettes sammen, skal bilene skifte på: én fra hvert felt. Begge har gjensidig plikt til å legge til rette.",
      "Там, где полоса заканчивается и потоки сливаются, машины чередуются: по одной из каждой полосы. Обе стороны обязаны помогать слиянию.",
      "Не «прижимайся» к обочине заранее и не блокируй — езжай до конца полосы и вливайся через одного."),

    /* ---------- Приоритет и особые случаи ---------- */
    q("033", "Hvem må du alltid vike for, uansett skilt?",
      "Кому ты всегда должен уступать, независимо от знаков?",
      [["Sporvogn (trikk)", "Трамваю"], ["Busser", "Автобусам"], ["Lastebiler", "Грузовикам"], ["Taxier", "Такси"]],
      "Sporvogn har alltid forkjørsrett. Den kan ikke svinge unna, og bremselengden er lang.",
      "Трамвай всегда имеет преимущество. Он не может свернуть, а тормозной путь у него длинный.",
      "Актуально в Oslo, Bergen и Trondheim: трамвай едет первым, даже если ты справа."),

    q("034", "Hva betyr blinkende gult lys i et trafikklys?",
      "Что означает мигающий жёлтый сигнал светофора?",
      [["Lyset er ute av drift: følg skilt og vikepliktsregler", "Светофор не работает: следуй знакам и правилам приоритета"], ["Stopp og vent på grønt", "Остановись и жди зелёного"], ["Kjør, du har forrang", "Езжай, у тебя преимущество"], ["Kun for busser", "Только для автобусов"]],
      "Blinkende gult betyr at signalanlegget er ute av funksjon. Da gjelder skiltene i krysset, eller høyreregelen hvis det ikke er skilt.",
      "Мигающий жёлтый — светофор отключён. Действуют знаки на перекрёстке, а если их нет — правило правой руки.",
      "Мигающий жёлтый — не «можно ехать», а «думай сам»."),

    q("035", "Hva gjelder hvis politiet dirigerer trafikken og gir andre signaler enn lyset?",
      "Что действует, если полицейский регулирует движение и его сигналы противоречат светофору?",
      [["Politiets tegn gjelder foran både lys og skilt", "Сигналы полицейского важнее и светофора, и знаков"], ["Lyset gjelder", "Действует светофор"], ["Skiltene gjelder", "Действуют знаки"], ["Du velger selv", "Выбираешь сам"]],
      "Rangordningen er: politiets tegn, deretter trafikklys, deretter skilt, deretter de generelle reglene som høyreregelen.",
      "Иерархия: сигналы полицейского, затем светофор, затем знаки, затем общие правила вроде правила правой руки.",
      "Полицейский > светофор > знаки > правило правой руки."),

    q("036", "Er det lov å stanse på motorveg?",
      "Можно ли останавливаться на автомагистрали?",
      [["Nei, bare ved nødstilfelle på vegskulderen", "Нет, только в аварийной ситуации на обочине"], ["Ja, hvis du setter på nødblink", "Да, если включить аварийку"], ["Ja, i inntil 5 minutter", "Да, до 5 минут"], ["Ja, for å ta bilder", "Да, чтобы сделать фото"]],
      "På motorveg er det forbudt å stanse, rygge, snu og å gå. Stans kun ved nød, og da så langt ut på skulderen som mulig.",
      "На автомагистрали запрещено останавливаться, сдавать назад, разворачиваться, ходить пешком. Остановка только при аварии, максимально на обочине.",
      "Если остановился в нужде: аварийка, жилет, треугольник за 100+ м, и сам — за отбойник."),

    q("037", "Hvilke kjøretøy har ikke lov på motorveg?",
      "Какому транспорту запрещено на автомагистраль?",
      [["Kjøretøy som ikke kan holde minst 40 km/t, gående og syklende", "ТС, не способным держать 40 км/ч, пешеходам и велосипедистам"], ["Bare lastebiler", "Только грузовикам"], ["Bare elbiler", "Только электромобилям"], ["Alle kan kjøre på motorveg", "Всем можно"]],
      "Motorveg og motortrafikkveg er bare for motorvogn som kan holde minst 40 km/t. Moped, traktor, sykkel og gående har ikke adgang.",
      "Автомагистраль и motortrafikkveg только для моторных ТС, способных держать 40 км/ч. Мопеды, тракторы, велосипеды и пешеходы не допускаются.",
      "Мопед на автомагистрали — нельзя, даже если «быстро проехать»."),

    q("038", "Hva må du gjøre før du rygger?",
      "Что нужно сделать перед движением задним ходом?",
      [["Forsikre deg om at det er fri bane; du har vikeplikt for alle", "Убедиться, что путь свободен; ты уступаешь всем"], ["Tute først", "Сначала посигналить"], ["Sette på nødblink", "Включить аварийку"], ["Ingenting, andre må passe seg", "Ничего, остальные должны быть внимательны"]],
      "Den som rygger har vikeplikt for all annen trafikk og alt ansvar for at det er klart. Bruk speil, snu deg og be om hjelp hvis sikten er dårlig.",
      "Тот, кто сдаёт назад, уступает всем и полностью отвечает за безопасность манёвра. Зеркала, поворот головы, помощник при плохом обзоре.",
      "Rygging — одна из самых частых причин мелких ДТП на парковках. Не торопись."),

    /* ---------- ДТП и экстренные службы ---------- */
    q("039", "Hva er du forpliktet til å gjøre hvis du er innblandet i en trafikkulykke?",
      "Что ты обязан сделать, если участвовал в ДТП?",
      [["Stoppe, hjelpe skadde og utveksle opplysninger", "Остановиться, помочь пострадавшим и обменяться данными"], ["Kjøre videre hvis skaden er liten", "Уехать, если ущерб небольшой"], ["Bare ringe forsikringsselskapet", "Только позвонить в страховую"], ["Vente på politiet uansett", "В любом случае ждать полицию"]],
      "Du har plikt til å stoppe, hjelpe skadde og gi navn og adresse til andre involverte. Ved kun materielle skader fyller dere ut skademelding sammen.",
      "Ты обязан остановиться, помочь пострадавшим и дать свои данные другим участникам. Если только повреждения авто — вместе заполняете skademelding.",
      "Уехать с места ДТП — уголовное дело, даже если «просто царапина»."),

    q("040", "Hvilket nummer ringer du ved en alvorlig ulykke med personskade?",
      "По какому номеру звонить при серьёзной аварии с пострадавшими?",
      [["113 (ambulanse)", "113 (скорая)"], ["112 (politi)", "112 (полиция)"], ["110 (brann)", "110 (пожарные)"], ["911", "911"]],
      "110 er brann, 112 er politi, 113 er ambulanse. Ved personskade ringer du 113; operatøren varsler de andre.",
      "110 — пожарные, 112 — полиция, 113 — скорая. При травмах звони 113, оператор вызовет остальных.",
      "Запомни: 110 огонь, 112 полиция, 113 медицина. Норвежский номер 911 не работает как в США."),

    q("041", "Når skal du ringe politiet etter en ulykke?",
      "Когда после аварии нужно вызывать полицию?",
      [["Ved personskade, eller hvis noen er påvirket av alkohol, eller partene er uenige", "При травмах, если кто-то пьян, или стороны не согласны"], ["Alltid, uansett skade", "Всегда, при любом ущербе"], ["Aldri, det ordnes via forsikringen", "Никогда, всё через страховую"], ["Bare hvis en bil må slepes", "Только если нужен эвакуатор"]],
      "Ved små materielle skader holder det å fylle ut skademelding. Politiet varsles ved personskade, rus, fører uten førerkort, eller uenighet om hendelsesforløpet.",
      "При небольшом ущербе достаточно заполнить skademelding. Полицию вызывают при травмах, опьянении, отсутствии прав или разногласиях о случившемся.",
      "Держи бланк skademelding (или приложение страховой) в машине: заполнять его нужно на месте."),

    /* ---------- Прицеп и категория B ---------- */
    q("042", "Hvor tung tilhenger kan du trekke med førerkort klasse B?",
      "Какой прицеп можно буксировать с правами категории B?",
      [["Tilhenger inntil 750 kg, eller tyngre hvis bil og henger sammen ikke overstiger 3 500 kg", "До 750 кг, или тяжелее, если машина и прицеп вместе не больше 3 500 кг"], ["Ingen tilhenger", "Никакой"], ["Alle tilhengere inntil 3 500 kg", "Любой до 3 500 кг"], ["Bare tilhenger uten brems", "Только без тормозов"]],
      "Klasse B: tilhenger med tillatt totalvekt inntil 750 kg, eller tyngre så lenge samlet tillatt totalvekt for bil og henger ikke overstiger 3 500 kg. Trenger du mer: kode 96 (inntil 4 250 kg) eller klasse BE.",
      "Категория B: прицеп с разрешённой полной массой до 750 кг, или тяжелее, пока суммарная разрешённая масса авто и прицепа не превышает 3 500 кг. Нужно больше — код 96 (до 4 250 кг) или категория BE.",
      "Считай по «tillatt totalvekt» (разрешённая полная масса) из документов, а не по фактическому весу."),

    q("043", "Hvem har ansvaret for at bilen er i forsvarlig stand før kjøring?",
      "Кто отвечает за то, что машина технически исправна перед поездкой?",
      [["Føreren", "Водитель"], ["Bileieren alene", "Только владелец"], ["Verkstedet", "Автосервис"], ["Statens vegvesen", "Statens vegvesen"]],
      "Føreren er ansvarlig for at kjøretøyet er i forsvarlig stand: lys, bremser, dekk, sikt. Eieren er ansvarlig for EU-kontroll og forsikring.",
      "Водитель отвечает за исправность машины перед поездкой: свет, тормоза, шины, обзор. Владелец отвечает за техосмотр (EU-kontroll) и страховку.",
      "Взял чужую машину со сломанным светом и поехал — штраф твой."),

    q("044", "Kan du kjøre med snø på taket og is på rutene?",
      "Можно ли ехать со снегом на крыше и льдом на стёклах?",
      [["Nei, alle ruter og lys skal være fri, og snø på taket må fjernes", "Нет: все стёкла и фары должны быть чистыми, снег с крыши убран"], ["Ja, hvis frontruta er skrapt", "Да, если лобовое очищено"], ["Ja, snøen blåser av", "Да, снег сдует"], ["Ja, i under 50 km/t", "Да, если меньше 50 км/ч"]],
      "Du skal ha fri sikt gjennom alle ruter, og lys og skilt skal være synlige. Snø fra taket kan fly av og treffe bilen bak.",
      "Обзор через все стёкла должен быть свободен, фары и номера видны. Снег с крыши может слететь на машину сзади.",
      "«Танковый люк» в лобовом стекле — штраф и опасность. Чисти всё, это 3 минуты."),

    /* ---------- Сигналы, полосы, разное ---------- */
    q("045", "Må syklister bruke sykkelfeltet når det finnes langs vegen?",
      "Обязаны ли велосипедисты ехать по велополосе, если она есть на этой дороге?",
      [["Nei, i Norge kan syklister velge å sykle i kjørebanen", "Нет, в Норвегии велосипедист может ехать и по проезжей части"], ["Ja, sykkelfelt er påbudt der det er anlagt", "Да, велополоса обязательна там, где она проложена"], ["Bare om sommeren", "Только летом"], ["Bare hvis det er mer enn 5 syklister", "Только если велосипедистов больше 5"]],
      "Norge har ingen bruksplikt for sykkelfelt eller sykkelveg. Syklister kan sykle i kjørebanen, og du må regne med dem der selv om det finnes sykkelfelt.",
      "В Норвегии нет обязанности пользоваться велополосой или велодорожкой. Велосипедисты могут ехать по проезжей части, и ты должен быть к этому готов, даже если рядом есть велополоса.",
      "Не сигналь велосипедисту на дороге «иди на велополосу»: он имеет право ехать здесь. Обгоняй с запасом не меньше 1,5 м."),

    q("046", "Når har du lov til å bruke horn (lydsignal) i trafikken?",
      "Когда разрешено использовать звуковой сигнал (клаксон) в дорожном движении?",
      [["Bare for å varsle om fare", "Только чтобы предупредить об опасности"], ["For å hilse på kjente", "Чтобы поприветствовать знакомых"], ["For å få trafikken foran til å skynde seg", "Чтобы поторопить машину впереди"], ["Når som helst, det er ingen begrensning", "Когда угодно, ограничений нет"]],
      "Lyd- og lyssignal skal bare brukes når det er nødvendig for å varsle om fare, ikke for å uttrykke irritasjon eller hilse.",
      "Звуковой и световой сигнал используют только при необходимости предупредить об опасности, а не чтобы выразить раздражение или поприветствовать.",
      "Гудеть от нетерпения в пробке — это не «предупреждение об опасности», такое использование сигнала не по правилам."),

    q("047", "Du oppdager en bilkø rett bak en sving på motorveien. Hva bør du gjøre for å varsle bilene bak deg?",
      "Ты замечаешь затор сразу за поворотом на автомагистрали. Как предупредить машины позади себя?",
      [["Sette på nødblink en kort stund", "На короткое время включить аварийную сигнализацию"], ["Blinke med fjernlys flere ganger", "Несколько раз мигнуть дальним светом"], ["Tute lenge", "Долго сигналить"], ["Stoppe midt i feltet uten varsel", "Остановиться посреди полосы без предупреждения"]],
      "Nødblink brukes for å varsle andre trafikanter om fare forut, for eksempel en uventet kø. Slå det av igjen når faren er over.",
      "Аварийная сигнализация используется, чтобы предупредить остальных участников об опасности впереди, например о неожиданном заторе. Выключи её, когда опасность миновала.",
      "Аварийка на пару секунд при внезапном заторе на трассе может предотвратить ДТП сзади — это стандартная практика в Норвегии."),

    q("048", "Du kjører forbi en buss som har stoppet ved en holdeplass for av- og påstigning. Hva skal du gjøre?",
      "Ты проезжаешь мимо автобуса, который остановился на остановке для посадки и высадки. Что нужно сделать?",
      [["Kjøre særlig forsiktig og senke farten, passasjerer kan krysse veien", "Ехать особенно осторожно и снизить скорость — пассажиры могут переходить дорогу"], ["Kjøre forbi i vanlig fart, bussen står stille", "Проезжать с обычной скоростью, автобус же стоит"], ["Tute for å varsle passasjerene", "Посигналить, чтобы предупредить пассажиров"], ["Stoppe helt til bussen kjører videre", "Полностью остановиться, пока автобус не поедет"]],
      "Passasjerer som går av bussen kan komme til å krysse veien uten å se seg godt for. Reduser farten og vær klar til å stoppe.",
      "Пассажиры, выходящие из автобуса, могут перейти дорогу, не посмотрев внимательно по сторонам. Снизь скорость и будь готов остановиться.",
      "Особенно актуально там, где выходят дети или пожилые — они не всегда оценивают скорость машин."),

    q("049", "Du ser et rødt rundt skilt med en hvit vannrett strek i midten ved innkjørselen til en gate. Hva betyr det?",
      "У въезда на улицу висит красный круглый знак с белой горизонтальной полосой посередине. Что он означает?",
      [["Innkjøring forbudt", "Въезд запрещён"], ["Forbudt å stoppe", "Остановка запрещена"], ["Enveiskjøring startet her", "Начало одностороннего движения"], ["Gjennomkjøring forbudt for tunge kjøretøy", "Проезд запрещён для тяжёлого транспорта"]],
      "Skiltet «innkjøring forbudt» forbyr kjøretøy å kjøre inn fra den siden. Gaten kan være envegskjørt fra motsatt retning.",
      "Знак «въезд запрещён» запрещает въезд транспорту именно с этой стороны. Улица может быть с односторонним движением, открытым с другой стороны.",
      "Красный круг с белой полосой — единственный полностью красный круглый знак, «кирпич». Не путай с белым кругом с красной каймой: тот запрещает движение всем."),

    q("050", "Hva er piggdekkgebyr?",
      "Что такое piggdekkgebyr?",
      [["En avgift for å kjøre med piggdekk i enkelte storbyer som Oslo, Bergen og Trondheim", "Сбор за использование шипованных шин в некоторых крупных городах, например Осло, Бергене и Тронхейме"], ["En bot for å ikke ha piggdekk om vinteren", "Штраф за отсутствие шипованных шин зимой"], ["En avgift alle bileiere betaler uansett dekktype", "Сбор, который платят все владельцы машин независимо от типа шин"], ["Et gebyr for å bytte dekk på verksted", "Плата за замену шин в автосервисе"]],
      "I Oslo, Bergen og Trondheim må du betale piggdekkgebyr for å kjøre med piggdekk i gebyrsonen. Stavanger og Kristiansand avviklet ordningen i 2023.",
      "В Осло, Бергене и Тронхейме за езду на шипованных шинах в зоне сбора нужно платить piggdekkgebyr. Ставангер и Кристиансанн отменили сбор в 2023 году.",
      "Купи сезонный абонемент заранее онлайн — это обычно дешевле, чем платить при каждом въезде.")
  ];
})();
