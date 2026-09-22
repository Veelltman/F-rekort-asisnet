/* Карточки норвежской лексики по теме вождения (kjøreordforråd). */

(function () {
  "use strict";

  function w(id, word_no, translation_ru, example_no, example_ru, group) {
    return { id: "voc-" + id, word_no, translation_ru, example_no, example_ru, group };
  }

  window.QUESTION_DATA = window.QUESTION_DATA || {};
  window.QUESTION_DATA.vocabulary = [
    /* Основные понятия */
    w("001", "førerkort", "водительские права", "Jeg skal ta førerkort klasse B.", "Я сдаю на права, категория B.", "Основное"),
    w("002", "teoriprøve", "теоретический экзамен", "Teoriprøven tas på trafikkstasjonen.", "Теорию сдают в отделении Statens vegvesen.", "Основное"),
    w("003", "oppkjøring (praktisk prøve)", "практический экзамен (вождение)", "Jeg har oppkjøring neste uke.", "У меня вождение на следующей неделе.", "Основное"),
    w("004", "trafikkstasjon", "отделение Vegvesen (типа ГИБДД)", "Du bestiller time på trafikkstasjonen.", "Записываешься на приём в Statens vegvesen.", "Основное"),
    w("005", "trafikkskole", "автошкола", "Jeg går på trafikkskole i Oslo.", "Я учусь в автошколе в Осло.", "Основное"),
    w("006", "trafikklærer", "инструктор по вождению", "Trafikklæreren min er veldig tålmodig.", "У меня очень терпеливый инструктор.", "Основное"),
    w("007", "øvelseskjøring", "учебная езда (с сопровождающим)", "Øvelseskjøring gir erfaring før oppkjøringen.", "Учебная езда даёт опыт до экзамена.", "Основное"),
    w("008", "ledsager", "сопровождающий при учебной езде", "Ledsageren må ha hatt førerkort i minst fem år.", "У сопровождающего права должны быть минимум пять лет.", "Основное"),

    /* Приоритет и правила */
    w("009", "vikeplikt", "обязанность уступить дорогу", "Du har vikeplikt for trafikk fra høyre.", "Ты уступаешь тем, кто едет справа.", "Приоритет"),
    w("010", "å vike", "уступать", "Jeg viker for bussen.", "Я пропускаю автобус.", "Приоритет"),
    w("011", "forkjørsvei (forkjørsveg)", "главная дорога", "På forkjørsvei har du forrang.", "На главной дороге ты едешь первым.", "Приоритет"),
    w("012", "forkjørsrett / forrang", "преимущество (право первым проехать)", "Sporvognen har alltid forkjørsrett.", "У трамвая всегда преимущество.", "Приоритет"),
    w("013", "høyreregelen", "правило правой руки", "Uten skilt gjelder høyreregelen.", "Нет знаков — работает правило правой руки.", "Приоритет"),
    w("014", "vegkryss / kryss", "перекрёсток", "Senk farten før krysset.", "Сбавь скорость перед перекрёстком.", "Приоритет"),
    w("015", "rundkjøring", "круговое движение", "I rundkjøringen har du vikeplikt for dem som allerede er inne.", "На кругу пропускаешь тех, кто уже едет по нему.", "Приоритет"),
    w("016", "gangfelt", "пешеходный переход", "Stopp for fotgjengere i gangfeltet.", "Останавливайся, если на переходе пешеход.", "Приоритет"),
    w("017", "fotgjenger", "пешеход", "Fotgjengeren ventet på fortauet.", "Пешеход стоял на тротуаре и ждал.", "Приоритет"),
    w("018", "fortau", "тротуар", "Barna gikk på fortauet.", "Дети шли по тротуару.", "Приоритет"),
    w("019", "trafikklys / lyssignal", "светофор", "Trafikklyset skiftet til rødt.", "Загорелся красный.", "Приоритет"),
    w("020", "fartsgrense", "ограничение скорости", "Fartsgrensen her er 50.", "Здесь можно не больше 50.", "Приоритет"),
    w("021", "forbikjøring", "обгон", "Forbikjøring er forbudt her.", "Здесь обгонять нельзя.", "Приоритет"),
    w("022", "å kjøre forbi", "обгонять", "Kan jeg kjøre forbi lastebilen?", "Можно мне обогнать этот грузовик?", "Приоритет"),
    w("023", "møtende trafikk", "встречный транспорт", "Se etter møtende trafikk før du svinger.", "Посмотри, нет ли встречных, прежде чем поворачивать.", "Приоритет"),
    w("024", "blindsone", "слепая зона", "Sjekk blindsonen før du skifter felt.", "Глянь в слепую зону, прежде чем перестраиваться.", "Приоритет"),

    /* Действия за рулём */
    w("025", "å svinge", "поворачивать", "Sving til venstre ved neste kryss.", "На следующем перекрёстке поверни налево.", "Действия"),
    w("026", "å rygge", "сдавать назад", "Rygg forsiktig inn på parkeringsplassen.", "Аккуратно сдай назад на место.", "Действия"),
    w("027", "å bremse", "тормозить", "Brems tidlig på glatt vei.", "На скользкой дороге тормози заранее.", "Действия"),
    w("028", "å gi tegn / å blinke", "подавать сигнал / включать поворотник", "Husk å gi tegn før du svinger.", "Не забывай включать поворотник перед поворотом.", "Действия"),
    w("029", "blinklys", "поворотник", "Blinklyset til høyre virker ikke.", "Правый поворотник не работает.", "Действия"),
    w("030", "å skifte felt", "менять полосу", "Han skiftet felt uten å blinke.", "Он перестроился, не включив поворотник.", "Действия"),
    w("031", "kjørefelt / felt", "полоса движения", "Hold deg i høyre felt.", "Держись правой полосы.", "Действия"),
    w("032", "å parkere", "парковаться", "Hvor kan jeg parkere?", "Где тут можно припарковаться?", "Действия"),
    w("033", "å stanse", "останавливаться (кратко)", "Stans forbudt betyr at du ikke kan stoppe i det hele tatt.", "«Stans forbudt» — значит, нельзя останавливаться вообще, даже на секунду.", "Действия"),
    w("034", "å snu", "разворачиваться", "Det er forbudt å snu på motorvei.", "На автомагистрали разворачиваться нельзя.", "Действия"),
    w("035", "avstand", "дистанция", "Hold god avstand til bilen foran.", "Держи дистанцию до машины впереди.", "Действия"),

    /* Машина и оборудование */
    w("036", "bilbelte / sikkerhetsbelte", "ремень безопасности", "Alle må bruke bilbelte.", "Пристёгиваться должны все.", "Машина"),
    w("037", "nærlys", "ближний свет", "Kjør med nærlys hele døgnet.", "Ближний свет — всегда, и днём тоже.", "Машина"),
    w("038", "fjernlys", "дальний свет", "Slå av fjernlyset ved møtende trafikk.", "Встречная машина — выключай дальний.", "Машина"),
    w("039", "nødblink", "аварийная сигнализация", "Sett på nødblink hvis du må stoppe.", "Пришлось остановиться — включи аварийку.", "Машина"),
    w("040", "varseltrekant", "знак аварийной остановки", "Varseltrekanten settes 100 meter bak bilen.", "Треугольник ставят метров за сто позади машины.", "Машина"),
    w("041", "refleksvest", "светоотражающий жилет", "Refleksvesten skal ligge lett tilgjengelig.", "Жилет должен лежать под рукой, а не в багажнике.", "Машина"),
    w("042", "dekk", "шина / колесо (покрышка)", "Er dekkene dine gode nok til vinteren?", "Твои шины зиму выдержат?", "Машина"),
    w("043", "piggdekk", "шипованные шины", "Piggdekk er lov fra 1. november.", "Шипы можно ставить с 1 ноября.", "Машина"),
    w("044", "mønsterdybde", "глубина протектора", "Minste mønsterdybde om vinteren er 3 mm.", "Зимой протектор должен быть не меньше 3 мм.", "Машина"),
    w("045", "frontrute", "лобовое стекло", "Skrap isen av frontruta før du kjører.", "Счисти лёд с лобового, прежде чем ехать.", "Машина"),
    w("046", "speil", "зеркало", "Still inn speilene før du starter.", "Настрой зеркала до того, как тронешься.", "Машина"),

    /* Условия и опасности */
    w("047", "glatt (vei / føre)", "скользкая (дорога)", "Det er veldig glatt i dag.", "Сегодня очень скользко.", "Условия"),
    w("048", "vinterføre", "зимние дорожные условия", "Kjør rolig på vinterføre.", "Зимой езди спокойно.", "Условия"),
    w("049", "tåke", "туман", "I tåke kan du bruke tåkelys i stedet for nærlys.", "В туман можно включить противотуманки вместо ближнего.", "Условия"),
    w("050", "vilt", "дикие животные", "Pass på vilt langs veien.", "Осторожно, вдоль дороги ходят звери.", "Условия"),
    w("051", "ulykke", "авария, ДТП", "Det skjedde en ulykke på E6.", "На E6 авария.", "Условия"),
    w("052", "utrykningskjøretøy", "спецтранспорт (скорая, пожарные, полиция)", "Gi fri vei for utrykningskjøretøy.", "Пропусти машину с мигалкой.", "Условия"),
    w("053", "promille", "промилле (уровень алкоголя)", "Grensen er 0,2 promille.", "Предел — 0,2 промилле.", "Условия"),
    w("054", "prikk (på førerkortet)", "штрафной балл", "Jeg fikk tre prikker for mobilbruk.", "Мне дали три балла за телефон за рулём.", "Условия"),
    w("055", "gebyr / bot", "штраф", "Gebyret for ikke å bruke belte er høyt.", "За непристёгнутый ремень штраф немаленький.", "Условия"),
    w("056", "tettbygd strøk", "населённый пункт (застроенная зона)", "I tettbygd strøk er grensen 50.", "В городе — 50, если знаков нет.", "Условия"),

    w("057", "tunnel", "тоннель", "Slå på nærlys før du kjører inn i tunnelen.", "Перед тоннелем включи ближний свет.", "Условия"),
    w("058", "trøtthet", "усталость (за рулём)", "Trøtthet er en vanlig årsak til ulykker.", "Усталость за рулём — частая причина аварий.", "Условия"),
    w("059", "sykkelfelt", "велополоса", "Se etter syklister i sykkelfeltet før du svinger til høyre.", "Перед поворотом направо проверь, нет ли велосипедиста на велополосе.", "Приоритет"),
    w("060", "holdeplass", "остановка (автобуса, трамвая)", "Bussen stanser ved holdeplassen for å slippe av passasjerer.", "Автобус остановился на остановке, выходят люди.", "Приоритет"),
    w("061", "vogntog", "автопоезд (грузовик с прицепом)", "Et vogntog trenger mye plass for å svinge.", "Фуре с прицепом нужно много места на повороте.", "Машина"),
    w("062", "tilhenger", "прицеп", "Jeg kjører med tilhenger til hytta i helgen.", "На выходных еду на дачу с прицепом.", "Машина"),

    w("063", "syklist", "велосипедист", "Hold god avstand til syklisten når du kjører forbi.", "Обгоняешь велосипедиста — держи дистанцию.", "Приоритет"),
    w("064", "trafikkskilt / skilt", "дорожный знак", "Skiltet viser fartsgrense 60.", "На знаке — ограничение 60.", "Приоритет"),
    w("065", "midtlinje", "осевая линия (разметка посередине дороги)", "Det er forbudt å krysse en heltrukket midtlinje uten grunn.", "Сплошную осевую пересекать нельзя.", "Приоритет"),
    w("066", "kollektivfelt", "полоса для общественного транспорта", "Kollektivfeltet er stort sett forbeholdt buss og taxi.", "Полоса для общественного транспорта — в основном для автобусов и такси.", "Приоритет"),
    w("067", "dekktrykk", "давление в шинах", "Sjekk dekktrykket når det blir kaldere ute.", "Похолодало — проверь давление в шинах.", "Машина"),
    w("068", "fører / sjåfør", "водитель", "Føreren er ansvarlig for at bilen er i forsvarlig stand.", "За исправность машины отвечает водитель.", "Основное"),

    /* ---------- Знаки и разметка ---------- */
    w("069", "fareskilt", "предупреждающий знак", "Fareskilt er trekantede med rød kant.", "Предупреждающие знаки — треугольные с красной каймой.", "Знаки"),
    w("070", "forbudsskilt", "запрещающий знак", "Forbudsskilt er runde og forbyr noe.", "Запрещающие знаки круглые, они что-то запрещают.", "Знаки"),
    w("071", "påbudsskilt", "предписывающий знак", "Påbudsskilt er blå og sier hva du må gjøre.", "Предписывающие знаки синие — говорят, что нужно делать.", "Знаки"),
    w("072", "opplysningsskilt", "информационный знак", "Motorveg-skiltet er et opplysningsskilt.", "Знак автомагистрали — информационный.", "Знаки"),
    w("073", "underskilt", "дополнительная табличка", "Underskiltet forteller når forbudet gjelder.", "Табличка снизу говорит, когда действует запрет.", "Знаки"),
    w("074", "vegoppmerking", "дорожная разметка", "Gul vegoppmerking skiller kjøreretningene.", "Жёлтая разметка разделяет направления движения.", "Знаки"),
    w("075", "sperrelinje", "сплошная линия", "Du må ikke krysse en sperrelinje.", "Сплошную линию пересекать нельзя.", "Знаки"),
    w("076", "varsellinje", "предупреждающая линия", "Varsellinje betyr at sikten er for kort til forbikjøring.", "Varsellinje значит: видимость слишком мала для обгона.", "Знаки"),
    w("077", "stopplinje", "стоп-линия", "Stopp foran stopplinjen, ikke på den.", "Останавливайся перед стоп-линией, а не на ней.", "Знаки"),
    w("078", "vikelinje", "линия «уступи дорогу»", "Vikelinjen består av små hvite trekanter.", "Линия «уступи» состоит из маленьких белых треугольников.", "Знаки"),
    w("079", "kjørefeltpil", "стрелка в полосе", "Kjørefeltpilen viser hvor du kan kjøre fra dette feltet.", "Стрелка в полосе показывает, куда можно ехать из неё.", "Знаки"),
    w("080", "innkjøring forbudt", "въезд запрещён", "Rødt skilt med hvit strek betyr innkjøring forbudt.", "Красный знак с белой полосой — въезд запрещён.", "Знаки"),
    w("081", "stans forbudt", "остановка запрещена", "Ved stans forbudt kan du ikke stoppe i det hele tatt.", "Где остановка запрещена, стоять нельзя вообще.", "Знаки"),
    w("082", "parkering forbudt", "стоянка запрещена", "Parkering forbudt: du kan stoppe kort for å slippe av noen.", "Стоянка запрещена, но коротко высадить пассажира можно.", "Знаки"),
    w("083", "sone", "зона (действия знака)", "Fartsgrensesonen gjelder til du ser skiltet slutt på sone.", "Зона ограничения действует до знака «конец зоны».", "Знаки"),
    w("084", "envegskjøring", "одностороннее движение", "I en gate med envegskjøring kan du parkere på begge sider.", "На односторонней улице можно парковаться с обеих сторон.", "Знаки"),

    /* ---------- Дорога ---------- */
    w("085", "motorveg", "автомагистраль", "På motorveg er det forbudt å stanse og snu.", "На автомагистрали запрещено останавливаться и разворачиваться.", "Дорога"),
    w("086", "motortrafikkveg", "автодорога (без разделителя)", "Motortrafikkveg har ikke fysisk midtdeler.", "У motortrafikkveg нет физического разделителя.", "Дорога"),
    w("087", "påkjøringsfelt / felt for fartsøkning", "полоса разгона", "Bruk hele påkjøringsfeltet til å komme opp i fart.", "Используй всю полосу разгона, чтобы набрать скорость.", "Дорога"),
    w("088", "avkjøring", "съезд", "Ta neste avkjøring mot Lillestrøm.", "Съезжай на следующем съезде на Лиллестрём.", "Дорога"),
    w("089", "vegskulder", "обочина", "Stans bare på vegskulderen ved nødstilfelle.", "Останавливайся на обочине только в крайнем случае.", "Дорога"),
    w("090", "kjørebane", "проезжая часть", "Gående skal ikke gå i kjørebanen når det finnes fortau.", "Пешеходы не должны идти по проезжей части, если есть тротуар.", "Дорога"),
    w("091", "gatetun", "жилая зона", "I gatetun kjører du i gangfart.", "В жилой зоне едешь со скоростью пешехода.", "Дорога"),
    w("092", "gågate", "пешеходная улица", "Kjøring i gågate er som hovedregel forbudt.", "Езда по пешеходной улице, как правило, запрещена.", "Дорога"),
    w("093", "planovergang", "железнодорожный переезд", "Stopp når det røde lyset blinker ved planovergangen.", "Останавливайся, когда на переезде мигает красный.", "Дорога"),
    w("094", "møteplass", "разъезд (карман на узкой дороге)", "Den som har møteplassen på sin side, bruker den.", "Разъездом пользуется тот, у кого он на своей стороне.", "Дорога"),
    w("095", "bakketopp", "вершина подъёма", "Forbikjøring er forbudt ved bakketopp.", "Обгон запрещён на вершине подъёма.", "Дорога"),
    w("096", "sving", "поворот дороги", "Senk farten før svingen, ikke i den.", "Сбрось скорость перед поворотом, а не в нём.", "Дорога"),
    w("097", "sikt", "видимость / обзор", "Dårlig sikt betyr lavere fart.", "Плохая видимость — значит ниже скорость.", "Дорога"),
    w("098", "trafikkøy", "островок безопасности", "Trikken stopper ved en holdeplass uten trafikkøy.", "Трамвай стоит на остановке без островка безопасности.", "Дорога"),

    /* ---------- Машина ---------- */
    w("099", "bremselengde", "тормозной путь", "Bremselengden blir fire ganger så lang når farten dobles.", "Тормозной путь вырастает вчетверо при удвоении скорости.", "Машина"),
    w("100", "reaksjonstid", "время реакции", "Reaksjonstiden er omtrent ett sekund.", "Время реакции — примерно одна секунда.", "Машина"),
    w("101", "stopplengde", "остановочный путь", "Stopplengde er reaksjonslengde pluss bremselengde.", "Остановочный путь — это путь за время реакции плюс тормозной путь.", "Машина"),
    w("102", "ABS-bremser", "система ABS", "Med ABS trykker du bremsen hardt og holder.", "С ABS жмёшь тормоз сильно и держишь.", "Машина"),
    w("103", "tillatt totalvekt", "разрешённая полная масса", "Bil og henger kan ha tillatt totalvekt på 3 500 kg til sammen.", "Машина и прицеп могут иметь суммарную полную массу 3 500 кг.", "Машина"),
    w("104", "vannplaning", "аквапланирование", "Ved vannplaning slipper du gassen rolig.", "При аквапланировании плавно отпускай газ.", "Машина"),
    w("105", "kjettinger", "цепи противоскольжения", "Ha kjettinger i bilen om vinteren i fjellet.", "Зимой в горах вози в машине цепи.", "Машина"),
    w("106", "vinterdekk", "зимние шины", "Vinterdekk uten pigger kan brukes hele året.", "Нешипованные зимние шины можно использовать круглый год.", "Машина"),
    w("107", "tåkelys", "противотуманные фары", "Tåkelys brukes bare i tåke og snøvær.", "Противотуманки — только в туман и снегопад.", "Машина"),
    w("108", "kjørelys", "дневные ходовые огни", "Kjørelys eller nærlys skal alltid være på.", "Ходовые огни или ближний свет должны быть всегда включены.", "Машина"),
    w("109", "barnesikring / barnesete", "детское удерживающее устройство", "Barn under 135 cm skal sitte i godkjent barnesikring.", "Дети ниже 135 см сидят в одобренном детском кресле.", "Машина"),
    w("110", "servostyring", "усилитель руля", "Slår du av motoren i fart, mister du servostyringen.", "Выключишь двигатель на ходу — потеряешь усилитель руля.", "Машина"),

    /* ---------- Правила и санкции ---------- */
    w("111", "forenklet forelegg", "штраф на месте (упрощённое постановление)", "Forenklet forelegg for mobilbruk er 10 750 kroner.", "Штраф за телефон за рулём — 10 750 крон.", "Правила"),
    w("112", "tap av førerett", "лишение права управления", "26 km/t over i 50-sone gir tap av førerett.", "Превышение на 26 км/ч в зоне 50 — лишение прав.", "Правила"),
    w("113", "prøveperiode", "испытательный срок", "I prøveperioden teller prikkene dobbelt.", "В испытательный срок баллы считаются вдвойне.", "Правила"),
    w("114", "ruspåvirket", "в состоянии опьянения", "Å kjøre ruspåvirket er straffbart.", "Езда в состоянии опьянения наказуема.", "Правила"),
    w("115", "aktsomhet", "осторожность / внимательность", "Gult blinksignal krever særlig aktsomhet.", "Мигающий жёлтый требует особой осторожности.", "Правила"),
    w("116", "skademelding", "извещение о ДТП (бланк для страховой)", "Fyll ut skademelding sammen med den andre føreren.", "Заполни извещение о ДТП вместе с другим водителем.", "Правила"),
    w("117", "personskade", "травма человека", "Ved personskade skal politiet varsles.", "При травмах нужно уведомить полицию.", "Правила"),
    w("118", "materiell skade", "материальный ущерб", "Ved bare materiell skade trenger du ikke ringe politiet.", "Если только материальный ущерб, полицию можно не вызывать.", "Правила"),
    w("119", "nødstans", "вынужденная остановка", "Ved nødstans tar du på refleksvest før du går ut.", "При вынужденной остановке надень жилет, прежде чем выходить.", "Правила"),
    w("120", "fri veg", "свободный проезд (для спецтранспорта)", "Gi fri veg for utrykningskjøretøy med blålys.", "Освободи дорогу спецтранспорту с мигалкой.", "Правила"),
    w("121", "lydsignal / horn", "звуковой сигнал", "Lydsignal skal bare brukes for å varsle om fare.", "Сигналить можно только чтобы предупредить об опасности.", "Правила"),
    w("122", "hensetting", "оставление машины (стоянка)", "Parkering er enhver hensetting av kjøretøy.", "Стоянка — это любое оставление транспортного средства.", "Правила"),

    /* ---------- Ситуации ---------- */
    w("123", "fletting / glidelåsprinsippet", "перестроение «молнией»", "Ved fletting kjører annenhver bil fra hvert felt.", "При «молнии» едут по очереди из каждой полосы.", "Ситуации"),
    w("124", "feltskifte", "смена полосы", "Ved feltskifte har du vikeplikt for dem som allerede er i feltet.", "При смене полосы уступаешь тем, кто уже в ней.", "Ситуации"),
    w("125", "vending", "разворот", "Vending er forbudt på motorveg.", "Разворот на автомагистрали запрещён.", "Ситуации"),
    w("126", "å blende", "слепить (светом)", "Fjernlys må ikke blende møtende.", "Дальний свет не должен слепить встречных.", "Ситуации"),
    w("127", "tresekundersregelen", "правило трёх секунд", "Tresekundersregelen gir trygg avstand på tørr veg.", "Правило трёх секунд даёт безопасную дистанцию на сухой дороге.", "Ситуации"),
    w("128", "mikrosøvn", "микросон за рулём", "Trøtthet kan gi mikrosøvn, stopp og hvil.", "Усталость приводит к микросну — остановись и отдохни.", "Ситуации"),

    w("129", "parkeringslys", "стояночные огни", "Utenfor tettbygd strøk skal en parkert bil ha parkeringslys tent i mørket.", "Вне населённого пункта у припаркованной машины в темноте должны быть включены стояночные огни.", "Машина"),
    w("130", "vegkant", "обочина, край дороги", "Fotgjengere går ofte i vegkanten der det ikke finnes fortau.", "Там, где нет тротуара, пешеходы часто идут по обочине.", "Дорога"),
    w("131", "sikkerhetsavstand", "безопасная дистанция", "Hold sikkerhetsavstand til bilen foran, spesielt i høy fart.", "Держи безопасную дистанцию до машины впереди, особенно на высокой скорости.", "Приоритет"),
    w("132", "brøytebil", "снегоуборочная машина", "Ikke kjør forbi en brøytebil, sikten framover er dårlig bak den.", "Не обгоняй снегоуборочную машину — за ней плохо видно дорогу впереди.", "Условия"),
    w("133", "kjettingpåbud", "обязательное использование цепей", "Kjettingpåbud gjelder på enkelte fjelloverganger om vinteren.", "На некоторых горных перевалах зимой обязательны цепи противоскольжения.", "Условия"),
    w("134", "møtende trafikk", "встречное движение", "Blend ned for møtende trafikk i god tid.", "Заранее переключайся на ближний свет для встречного движения.", "Приоритет")
  ];
})();
