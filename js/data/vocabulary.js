/* Карточки норвежской лексики по теме вождения (kjøreordforråd). */

(function () {
  "use strict";

  function w(id, word_no, translation_ru, example_no, example_ru, group) {
    return { id: "voc-" + id, word_no, translation_ru, example_no, example_ru, group };
  }

  window.QUESTION_DATA = window.QUESTION_DATA || {};
  window.QUESTION_DATA.vocabulary = [
    /* Основные понятия */
    w("001", "førerkort", "водительские права", "Jeg skal ta førerkort klasse B.", "Я собираюсь получить права категории B.", "Основное"),
    w("002", "teoriprøve", "теоретический экзамен", "Teoriprøven tas på trafikkstasjonen.", "Теоретический экзамен сдают в отделении Statens vegvesen.", "Основное"),
    w("003", "oppkjøring (praktisk prøve)", "практический экзамен (вождение)", "Jeg har oppkjøring neste uke.", "У меня практический экзамен на следующей неделе.", "Основное"),
    w("004", "trafikkstasjon", "отделение Vegvesen (типа ГИБДД)", "Du bestiller time på trafikkstasjonen.", "Ты записываешься на приём в отделение Statens vegvesen.", "Основное"),
    w("005", "trafikkskole", "автошкола", "Jeg går på trafikkskole i Oslo.", "Я хожу в автошколу в Осло.", "Основное"),
    w("006", "trafikklærer", "инструктор по вождению", "Trafikklæreren min er veldig tålmodig.", "Мой инструктор очень терпеливый.", "Основное"),
    w("007", "øvelseskjøring", "учебная езда (с сопровождающим)", "Øvelseskjøring gir erfaring før oppkjøringen.", "Учебная езда даёт опыт перед практическим экзаменом.", "Основное"),
    w("008", "ledsager", "сопровождающий при учебной езде", "Ledsageren må ha hatt førerkort i minst fem år.", "Сопровождающий должен иметь права не менее пяти лет.", "Основное"),

    /* Приоритет и правила */
    w("009", "vikeplikt", "обязанность уступить дорогу", "Du har vikeplikt for trafikk fra høyre.", "Ты обязан уступить транспорту справа.", "Приоритет"),
    w("010", "å vike", "уступать", "Jeg viker for bussen.", "Я уступаю автобусу.", "Приоритет"),
    w("011", "forkjørsvei (forkjørsveg)", "главная дорога", "På forkjørsvei har du forrang.", "На главной дороге у тебя преимущество.", "Приоритет"),
    w("012", "forkjørsrett / forrang", "преимущество (право первым проехать)", "Sporvognen har alltid forkjørsrett.", "Трамвай всегда имеет преимущество.", "Приоритет"),
    w("013", "høyreregelen", "правило правой руки", "Uten skilt gjelder høyreregelen.", "Без знаков действует правило правой руки.", "Приоритет"),
    w("014", "vegkryss / kryss", "перекрёсток", "Senk farten før krysset.", "Снизь скорость перед перекрёстком.", "Приоритет"),
    w("015", "rundkjøring", "круговое движение", "I rundkjøringen har du vikeplikt for dem som allerede er inne.", "На кругу ты уступаешь тем, кто уже на нём.", "Приоритет"),
    w("016", "gangfelt", "пешеходный переход", "Stopp for fotgjengere i gangfeltet.", "Останавливайся перед пешеходами на переходе.", "Приоритет"),
    w("017", "fotgjenger", "пешеход", "Fotgjengeren ventet på fortauet.", "Пешеход ждал на тротуаре.", "Приоритет"),
    w("018", "fortau", "тротуар", "Barna gikk på fortauet.", "Дети шли по тротуару.", "Приоритет"),
    w("019", "trafikklys / lyssignal", "светофор", "Trafikklyset skiftet til rødt.", "Светофор переключился на красный.", "Приоритет"),
    w("020", "fartsgrense", "ограничение скорости", "Fartsgrensen her er 50.", "Ограничение здесь — 50.", "Приоритет"),
    w("021", "forbikjøring", "обгон", "Forbikjøring er forbudt her.", "Обгон здесь запрещён.", "Приоритет"),
    w("022", "å kjøre forbi", "обгонять", "Kan jeg kjøre forbi lastebilen?", "Могу я обогнать грузовик?", "Приоритет"),
    w("023", "møtende trafikk", "встречный транспорт", "Se etter møtende trafikk før du svinger.", "Проверь встречный транспорт перед поворотом.", "Приоритет"),
    w("024", "blindsone", "слепая зона", "Sjekk blindsonen før du skifter felt.", "Проверь слепую зону перед сменой полосы.", "Приоритет"),

    /* Действия за рулём */
    w("025", "å svinge", "поворачивать", "Sving til venstre ved neste kryss.", "Поверни налево на следующем перекрёстке.", "Действия"),
    w("026", "å rygge", "сдавать назад", "Rygg forsiktig inn på parkeringsplassen.", "Осторожно сдай назад на парковочное место.", "Действия"),
    w("027", "å bremse", "тормозить", "Brems tidlig på glatt vei.", "Тормози заранее на скользкой дороге.", "Действия"),
    w("028", "å gi tegn / å blinke", "подавать сигнал / включать поворотник", "Husk å gi tegn før du svinger.", "Не забудь включить поворотник перед поворотом.", "Действия"),
    w("029", "blinklys", "поворотник", "Blinklyset til høyre virker ikke.", "Правый поворотник не работает.", "Действия"),
    w("030", "å skifte felt", "менять полосу", "Han skiftet felt uten å blinke.", "Он сменил полосу без поворотника.", "Действия"),
    w("031", "kjørefelt / felt", "полоса движения", "Hold deg i høyre felt.", "Держись в правой полосе.", "Действия"),
    w("032", "å parkere", "парковаться", "Hvor kan jeg parkere?", "Где можно припарковаться?", "Действия"),
    w("033", "å stanse", "останавливаться (кратко)", "Stans forbudt betyr at du ikke kan stoppe i det hele tatt.", "«Stans forbudt» значит — нельзя останавливаться вообще.", "Действия"),
    w("034", "å snu", "разворачиваться", "Det er forbudt å snu på motorvei.", "Разворот на автомагистрали запрещён.", "Действия"),
    w("035", "avstand", "дистанция", "Hold god avstand til bilen foran.", "Держи хорошую дистанцию до машины впереди.", "Действия"),

    /* Машина и оборудование */
    w("036", "bilbelte / sikkerhetsbelte", "ремень безопасности", "Alle må bruke bilbelte.", "Все должны пристёгиваться.", "Машина"),
    w("037", "nærlys", "ближний свет", "Kjør med nærlys hele døgnet.", "Езди с ближним светом круглосуточно.", "Машина"),
    w("038", "fjernlys", "дальний свет", "Slå av fjernlyset ved møtende trafikk.", "Выключи дальний при встречном транспорте.", "Машина"),
    w("039", "nødblink", "аварийная сигнализация", "Sett på nødblink hvis du må stoppe.", "Включи аварийку, если пришлось остановиться.", "Машина"),
    w("040", "varseltrekant", "знак аварийной остановки", "Varseltrekanten settes 100 meter bak bilen.", "Треугольник ставят за 100 м позади машины.", "Машина"),
    w("041", "refleksvest", "светоотражающий жилет", "Refleksvesten skal ligge lett tilgjengelig.", "Жилет должен лежать в зоне досягаемости.", "Машина"),
    w("042", "dekk", "шина / колесо (покрышка)", "Er dekkene dine gode nok til vinteren?", "Твои шины достаточно хороши для зимы?", "Машина"),
    w("043", "piggdekk", "шипованные шины", "Piggdekk er lov fra 1. november.", "Шипы разрешены с 1 ноября.", "Машина"),
    w("044", "mønsterdybde", "глубина протектора", "Minste mønsterdybde om vinteren er 3 mm.", "Минимальная глубина протектора зимой — 3 мм.", "Машина"),
    w("045", "frontrute", "лобовое стекло", "Skrap isen av frontruta før du kjører.", "Счисти лёд с лобового перед выездом.", "Машина"),
    w("046", "speil", "зеркало", "Still inn speilene før du starter.", "Настрой зеркала перед началом движения.", "Машина"),

    /* Условия и опасности */
    w("047", "glatt (vei / føre)", "скользкая (дорога)", "Det er veldig glatt i dag.", "Сегодня очень скользко.", "Условия"),
    w("048", "vinterføre", "зимние дорожные условия", "Kjør rolig på vinterføre.", "Езди спокойно в зимних условиях.", "Условия"),
    w("049", "tåke", "туман", "I tåke kan du bruke tåkelys i stedet for nærlys.", "В туман можно включить противотуманки вместо ближнего света.", "Условия"),
    w("050", "vilt", "дикие животные", "Pass på vilt langs veien.", "Осторожно: дикие животные у дороги.", "Условия"),
    w("051", "ulykke", "авария, ДТП", "Det skjedde en ulykke på E6.", "На E6 произошла авария.", "Условия"),
    w("052", "utrykningskjøretøy", "спецтранспорт (скорая, пожарные, полиция)", "Gi fri vei for utrykningskjøretøy.", "Освободи дорогу спецтранспорту.", "Условия"),
    w("053", "promille", "промилле (уровень алкоголя)", "Grensen er 0,2 promille.", "Предел — 0,2 промилле.", "Условия"),
    w("054", "prikk (på førerkortet)", "штрафной балл", "Jeg fikk tre prikker for mobilbruk.", "Я получил три балла за телефон.", "Условия"),
    w("055", "gebyr / bot", "штраф", "Gebyret for ikke å bruke belte er høyt.", "Штраф за непристёгнутый ремень высокий.", "Условия"),
    w("056", "tettbygd strøk", "населённый пункт (застроенная зона)", "I tettbygd strøk er grensen 50.", "В населённом пункте предел — 50.", "Условия"),

    w("057", "tunnel", "тоннель", "Slå på nærlys før du kjører inn i tunnelen.", "Включи ближний свет перед въездом в тоннель.", "Условия"),
    w("058", "trøtthet", "усталость (за рулём)", "Trøtthet er en vanlig årsak til ulykker.", "Усталость — частая причина аварий.", "Условия"),
    w("059", "sykkelfelt", "велополоса", "Se etter syklister i sykkelfeltet før du svinger til høyre.", "Проверь велосипедистов на велополосе перед поворотом направо.", "Приоритет"),
    w("060", "holdeplass", "остановка (автобуса, трамвая)", "Bussen stanser ved holdeplassen for å slippe av passasjerer.", "Автобус останавливается на остановке, чтобы высадить пассажиров.", "Приоритет"),
    w("061", "vogntog", "автопоезд (грузовик с прицепом)", "Et vogntog trenger mye plass for å svinge.", "Автопоезду нужно много места, чтобы повернуть.", "Машина"),
    w("062", "tilhenger", "прицеп", "Jeg kjører med tilhenger til hytta i helgen.", "В выходные я еду с прицепом на дачу.", "Машина")
  ];
})();
