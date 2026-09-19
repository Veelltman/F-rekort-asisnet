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
    w("068", "fører / sjåfør", "водитель", "Føreren er ansvarlig for at bilen er i forsvarlig stand.", "За исправность машины отвечает водитель.", "Основное")
  ];
})();
