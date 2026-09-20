/* Языки интерфейса: ru (исходный), uk, en, no.
   Ключ словаря — русская фраза, как она написана в коде. t(фраза) возвращает перевод для текущего языка
   или саму фразу, если перевода нет. Переводы содержания заданий пока только русские: в uk/en они
   показываются с пометкой RU, в режиме no скрываются совсем (только норвежский). */

(function () {
  "use strict";

  const KEY = "forerkort-lang";
  const LANGS = { ru: "RU", uk: "UA", en: "EN", no: "NO" };
  const HTML_LANG = { ru: "ru", uk: "uk", en: "en", no: "nb" };

  const D = {
    /* ---------- навигация и общее ---------- */
    "Темы": { uk: "Теми", en: "Topics", no: "Emner" },
    "Ошибки": { uk: "Помилки", en: "Mistakes", no: "Feil" },
    "Лексика": { uk: "Лексика", en: "Vocabulary", no: "Ordforråd" },
    "Статистика": { uk: "Статистика", en: "Statistics", no: "Statistikk" },
    "Разделы": { uk: "Розділи", en: "Sections", no: "Deler" },
    "Главная": { uk: "Головна", en: "Home", no: "Hjem" },
    "Войти": { uk: "Увійти", en: "Log in", no: "Logg inn" },
    "Выйти": { uk: "Вийти", en: "Log out", no: "Logg ut" },
    "Начать": { uk: "Почати", en: "Start", no: "Start" },
    "Открыть": { uk: "Відкрити", en: "Open", no: "Åpne" },
    "открыть": { uk: "відкрити", en: "open", no: "åpne" },
    "Продолжить": { uk: "Продовжити", en: "Continue", no: "Fortsett" },
    "Продолжить:": { uk: "Продовжити:", en: "Continue:", no: "Fortsett:" },
    "Повторить": { uk: "Повторити", en: "Review", no: "Repeter" },
    "повторить": { uk: "повторити", en: "review", no: "repeter" },
    "Тренировать": { uk: "Тренувати", en: "Practise", no: "Øv" },
    "Профиль": { uk: "Профіль", en: "Profile", no: "Profil" },
    "Профиль:": { uk: "Профіль:", en: "Profile:", no: "Profil:" },
    "из": { uk: "з", en: "of", no: "av" },
    "Секунду…": { uk: "Секунду…", en: "One moment…", no: "Et øyeblikk…" },
    "Закрыть": { uk: "Закрити", en: "Close", no: "Lukk" },
    "Обновить": { uk: "Оновити", en: "Update", no: "Oppdater" },
    "Голос": { uk: "Голос", en: "Voice", no: "Stemme" },
    "женский)": { uk: "жіночий)", en: "female)", no: "kvinne)" },
    "мужской)": { uk: "чоловічий)", en: "male)", no: "mann)" },

    /* ---------- главная ---------- */
    "Теория на права": { uk: "Теорія на права", en: "Driving theory", no: "Teori til førerkort" },
    "по-норвежски": { uk: "норвезькою", en: "in Norwegian", no: "på norsk" },
    "Вопросы как на экзамене, на норвежском. Перевод открывается по кнопке, чтобы сначала попробовать понять самому. Каждая ошибка разбирается и возвращается на повторение.": {
      uk: "Питання як на іспиті, норвезькою. Переклад відкривається кнопкою, щоб спершу спробувати зрозуміти самому. Кожна помилка розбирається і повертається на повторення.",
      en: "Exam-style questions in Norwegian. The translation opens on demand, so you try to understand first. Every mistake is explained and comes back for review.",
      no: "Spørsmål som på teoriprøven. Hver feil blir forklart og kommer tilbake til repetisjon."
    },
    "Задание дня": { uk: "Завдання дня", en: "Daily task", no: "Dagens økt" },
    "Задание дня,": { uk: "Завдання дня,", en: "Daily task,", no: "Dagens økt," },
    "Начать задание дня": { uk: "Почати завдання дня", en: "Start the daily task", no: "Start dagens økt" },
    "Пройти ещё раз": { uk: "Пройти ще раз", en: "Try again", no: "Prøv igjen" },
    "Повторить ошибки (": { uk: "Повторити помилки (", en: "Review mistakes (", no: "Repeter feil (" },
    "К повторению сегодня:": { uk: "До повторення сьогодні:", en: "Due today:", no: "Til repetisjon i dag:" },
    "к повторению сегодня:": { uk: "до повторення сьогодні:", en: "due today:", no: "til repetisjon i dag:" },
    "к повторению сегодня": { uk: "до повторення сьогодні", en: "due today", no: "til repetisjon i dag" },
    "к повторению": { uk: "до повторення", en: "due", no: "til repetisjon" },
    "К повторению:": { uk: "До повторення:", en: "Due:", no: "Til repetisjon:" },
    "верных ответов": { uk: "правильних відповідей", en: "correct answers", no: "riktige svar" },
    "вопросов пройдено": { uk: "питань пройдено", en: "questions seen", no: "spørsmål besvart" },
    "слов из лексики": { uk: "слів із лексики", en: "vocabulary words", no: "ord fra ordforrådet" },
    "Подробная статистика →": { uk: "Детальна статистика →", en: "Detailed statistics →", no: "Detaljert statistikk →" },
    "Круг друзей": { uk: "Коло друзів", en: "Friends circle", no: "Vennekretsen" },
    "Войди, чтобы прогресс сохранялся на сервере и было видно, кто как занимается.": {
      uk: "Увійди, щоб прогрес зберігався на сервері і було видно, хто як займається.",
      en: "Log in so your progress is saved online and you can see how your friends are doing.",
      no: "Logg inn så framgangen lagres på serveren og du ser hvordan vennene dine ligger an."
    },
    "Войти или зарегистрироваться": { uk: "Увійти або зареєструватися", en: "Log in or sign up", no: "Logg inn eller registrer deg" },
    "Не удалось загрузить круг:": { uk: "Не вдалося завантажити коло:", en: "Could not load the circle:", no: "Kunne ikke laste vennekretsen:" },
    "Имя": { uk: "Ім’я", en: "Name", no: "Navn" },
    "Сегодня": { uk: "Сьогодні", en: "Today", no: "I dag" },
    "Верно": { uk: "Правильно", en: "Correct", no: "Riktig" },
    "верно": { uk: "правильно", en: "correct", no: "riktig" },
    "Экзамены": { uk: "Іспити", en: "Exams", no: "Prøver" },
    "Дней": { uk: "Днів", en: "Days", no: "Dager" },
    "владелец": { uk: "власник", en: "owner", no: "eier" },
    "Сегодня — результат задания дня": { uk: "Сьогодні — результат завдання дня", en: "Today — daily task result", no: "I dag – resultat på dagens økt" },
    "Верно — доля верных ответов за всё время. Экзамены — сдано из попыток.": {
      uk: "Правильно — частка правильних відповідей за весь час. Іспити — складено з усіх спроб.",
      en: "Correct — share of correct answers overall. Exams — passed out of attempts.",
      no: "Riktig – andel riktige svar totalt. Prøver – bestått av forsøk."
    },
    "ещё не проходил(а)": { uk: "ще не проходив(ла)", en: "not done yet", no: "ikke tatt ennå" },
    "ещё не сдавал(а)": { uk: "ще не складав(ла)", en: "no attempts yet", no: "ingen forsøk ennå" },
    "сдано": { uk: "складено", en: "passed", no: "bestått" },
    "Сдано": { uk: "Складено", en: "Passed", no: "Bestått" },
    "подряд": { uk: "поспіль", en: "in a row", no: "på rad" },
    "дней подряд": { uk: "днів поспіль", en: "days in a row", no: "dager på rad" },
    "вопросов, одинаковые для всех в этот день. Сравните результаты.": { uk: "питань, однакові для всіх у цей день. Порівняйте результати.", en: "questions, the same for everyone today. Compare your results.", no: "spørsmål, like for alle i dag. Sammenlign resultatene." },
    "Пробный экзамен": { uk: "Пробний іспит", en: "Mock exam", no: "Prøveeksamen" },
    "Пробные экзамены": { uk: "Пробні іспити", en: "Mock exams", no: "Prøveeksamener" },
    "вопросов, 90 минут, без подсказок по ходу. Сдано, если ошибок не больше 7. Как на настоящем экзамене.": { uk: "питань, 90 хвилин, без підказок. Складено, якщо помилок не більше 7. Як на справжньому іспиті.", en: "questions, 90 minutes, no hints. Pass with at most 7 mistakes, just like the real exam.", no: "spørsmål, 90 minutter, ingen hint underveis. Bestått med maks 7 feil, som på den ekte prøven." },
    "Начать экзамен": { uk: "Почати іспит", en: "Start the exam", no: "Start prøven" },
    "Знаки и разметка": { uk: "Знаки і розмітка", en: "Signs and markings", no: "Skilt og oppmerking" },
    "Все знаки Норвегии: значение, поиск по названию, тип знака, разметка.": { uk: "Усі знаки Норвегії: значення, пошук за назвою, тип знака, розмітка.", en: "All Norwegian signs: meaning, find by name, sign type, road markings.", no: "Alle norske skilt: betydning, finn etter navn, skilttype, oppmerking." },
    "Ситуационные задачи": { uk: "Ситуаційні задачі", en: "Traffic situations", no: "Trafikksituasjoner" },
    "Кто кому уступает: перекрёстки, круг, повороты, автомагистраль.": { uk: "Хто кому поступається: перехрестя, кільце, повороти, автомагістраль.", en: "Who yields to whom: junctions, roundabouts, turns, motorways.", no: "Hvem viker for hvem: kryss, rundkjøring, svinger, motorveg." },
    "Правила и штрафы": { uk: "Правила і штрафи", en: "Rules and fines", no: "Regler og sanksjoner" },
    "Скорость, алкоголь, ремни, баллы, парковка, ставки 2026.": { uk: "Швидкість, алкоголь, паски, бали, паркування, ставки 2026.", en: "Speed, alcohol, seat belts, penalty points, parking, 2026 rates.", no: "Fart, alkohol, belte, prikker, parkering, satser 2026." },
    "Слова и фразы, без которых не понять вопросы на экзамене.": { uk: "Слова і фрази, без яких не зрозуміти питання на іспиті.", en: "Words and phrases you need to understand the exam questions.", no: "Ord og uttrykk du trenger for å forstå spørsmålene på prøven." },
    "Открыть карточки": { uk: "Відкрити картки", en: "Open flashcards", no: "Åpne kortene" },
    "заданий": { uk: "завдань", en: "tasks", no: "oppgaver" },
    "слов": { uk: "слів", en: "words", no: "ord" },
    "ещё не начато": { uk: "ще не почато", en: "not started yet", no: "ikke startet ennå" },
    "пройдено": { uk: "пройдено", en: "done", no: "gjennomført" },
    "Пройдено": { uk: "Пройдено", en: "Done", no: "Gjennomført" },
    "пройдено.": { uk: "пройдено.", en: "done.", no: "gjennomført." },
    "Ошибок:": { uk: "Помилок:", en: "Mistakes:", no: "Feil:" },
    "Работа без интернета": { uk: "Робота без інтернету", en: "Offline use", no: "Bruk uten internett" },
    "Сайт открывается офлайн после первого посещения. Чтобы и картинки знаков с озвучкой были доступны без сети, загрузи их заранее (знаки ≈ 3 МБ, озвучка ≈ 2 МБ).": {
      uk: "Сайт відкривається офлайн після першого відвідування. Щоб і картинки знаків з озвучкою були доступні без мережі, завантаж їх заздалегідь (знаки ≈ 3 МБ, озвучка ≈ 2 МБ).",
      en: "The site works offline after the first visit. To have sign images and audio available without a connection, download them in advance (signs ≈ 3 MB, audio ≈ 2 MB).",
      no: "Siden fungerer uten nett etter første besøk. Last ned skiltbilder og lyd på forhånd for å ha dem tilgjengelig uten nett (skilt ≈ 3 MB, lyd ≈ 2 MB)."
    },
    "Скачать знаки": { uk: "Завантажити знаки", en: "Download signs", no: "Last ned skilt" },
    "Скачать озвучку": { uk: "Завантажити озвучку", en: "Download audio", no: "Last ned lyd" },
    "Сохранено: знаков": { uk: "Збережено: знаків", en: "Saved: signs", no: "Lagret: skilt" },
    "файлов озвучки": { uk: "файлів озвучки", en: "audio files", no: "lydfiler" },

    /* ---------- профиль и вход ---------- */
    "Ты вошёл как": { uk: "Ти увійшов як", en: "Signed in as", no: "Innlogget som" },
    "Кто занимается?": { uk: "Хто займається?", en: "Who is studying?", no: "Hvem øver?" },
    "Добавить человека": { uk: "Додати людину", en: "Add a person", no: "Legg til person" },
    "Имя (как будет отображаться):": { uk: "Ім’я (як буде показано):", en: "Name (as it will be shown):", no: "Navn (slik det vises):" },
    "Локальный профиль": { uk: "Локальний профіль", en: "Local profile", no: "Lokal profil" },
    "Прогресс сохранён в облаке": { uk: "Прогрес збережено в хмарі", en: "Progress saved to the cloud", no: "Framgang lagret i skyen" },
    "Сохраняю…": { uk: "Зберігаю…", en: "Saving…", no: "Lagrer…" },
    "Нет сети: сохраню, когда появится": { uk: "Немає мережі: збережу, коли з’явиться", en: "Offline: will save when back online", no: "Uten nett: lagrer når nettet er tilbake" },
    "Ошибка сохранения": { uk: "Помилка збереження", en: "Save error", no: "Feil ved lagring" },
    "Вход": { uk: "Вхід", en: "Log in", no: "Logg inn" },
    "Регистрация": { uk: "Реєстрація", en: "Sign up", no: "Registrering" },
    "Прогресс хранится на сервере: войди с любого телефона, и всё будет на месте. Результаты видны друзьям из круга.": { uk: "Прогрес зберігається на сервері: увійди з будь-якого телефону, і все буде на місці. Результати бачать друзі з кола.", en: "Progress is stored online: log in from any phone and everything is there. Your results are visible to your circle.", no: "Framgangen lagres på serveren: logg inn fra hvilken som helst telefon. Resultatene er synlige for vennekretsen." },
    "Прогресс, который уже есть в этом браузере, перенесётся в новый аккаунт.": { uk: "Прогрес, який уже є в цьому браузері, перенесеться в новий акаунт.", en: "Progress already in this browser will move to the new account.", no: "Framgang som allerede finnes i denne nettleseren, flyttes til den nye kontoen." },
    "Имя (как тебя увидят друзья)": { uk: "Ім’я (як тебе побачать друзі)", en: "Name (as your friends will see it)", no: "Navn (slik vennene ser deg)" },
    "цифр)": { uk: "цифр)", en: "digits)", no: "siffer)" },
    "Код приглашения": { uk: "Код запрошення", en: "Invite code", no: "Invitasjonskode" },
    "спроси у того, кто дал ссылку": { uk: "запитай у того, хто дав посилання", en: "ask the person who shared the link", no: "spør den som delte lenken" },
    "Создать аккаунт": { uk: "Створити акаунт", en: "Create account", no: "Opprett konto" },
    "Без входа": { uk: "Без входу", en: "Without logging in", no: "Uten innlogging" },
    "Нет связи с сервером. Проверь интернет.": { uk: "Немає зв’язку з сервером. Перевір інтернет.", en: "No connection to the server. Check your internet.", no: "Ingen kontakt med serveren. Sjekk internett." },
    "Ошибка сервера (": { uk: "Помилка сервера (", en: "Server error (", no: "Serverfeil (" },
    "В этом браузере уже есть прогресс (": { uk: "У цьому браузері вже є прогрес (", en: "This browser already has progress (", no: "Denne nettleseren har allerede framgang (" },
    "вопросов). Объединить его с аккаунтом «": { uk: "питань). Об’єднати його з акаунтом «", en: "questions). Merge it into the account “", no: "spørsmål). Slå det sammen med kontoen «" },

    /* ---------- тема и режимы ---------- */
    "К теме": { uk: "До теми", en: "Back to topic", no: "Til emnet" },
    "Быстрая тренировка": { uk: "Швидке тренування", en: "Quick practice", no: "Rask øving" },
    "случайных вопросов. Хорошо для ежедневной практики.": { uk: "випадкових питань. Добре для щоденної практики.", en: "random questions. Good for daily practice.", no: "tilfeldige spørsmål. Bra for daglig øving." },
    "случайных заданий всех типов.": { uk: "випадкових завдань усіх типів.", en: "random tasks of all types.", no: "tilfeldige oppgaver av alle typer." },
    "Новые вопросы": { uk: "Нові питання", en: "New questions", no: "Nye spørsmål" },
    "Новые знаки": { uk: "Нові знаки", en: "New signs", no: "Nye skilt" },
    "вопросов, которые ты ещё не видел или давно не повторял.": { uk: "питань, які ти ще не бачив або давно не повторював.", en: "questions you haven't seen or haven't reviewed for a while.", no: "spørsmål du ikke har sett eller ikke har repetert på lenge." },
    "знаков, которые ты ещё не видел или давно не повторял.": { uk: "знаків, які ти ще не бачив або давно не повторював.", en: "signs you haven't seen or haven't reviewed for a while.", no: "skilt du ikke har sett eller ikke har repetert på lenge." },
    "Что означает знак": { uk: "Що означає знак", en: "What the sign means", no: "Hva skiltet betyr" },
    "Картинка, четыре названия.": { uk: "Картинка, чотири назви.", en: "A picture, four names.", no: "Et bilde, fire navn." },
    "Найди знак": { uk: "Знайди знак", en: "Find the sign", no: "Finn skiltet" },
    "Найди знак по названию": { uk: "Знайди знак за назвою", en: "Find the sign by name", no: "Finn skiltet etter navn" },
    "Название, четыре картинки.": { uk: "Назва, чотири картинки.", en: "A name, four pictures.", no: "Et navn, fire bilder." },
    "Тип знака": { uk: "Тип знака", en: "Sign type", no: "Skilttype" },
    "Предупреждающий, запрещающий, предписывающий…": { uk: "Попереджувальний, заборонний, наказовий…", en: "Warning, prohibitory, mandatory…", no: "Fare, forbud, påbud…" },
    "Разметка": { uk: "Розмітка", en: "Road markings", no: "Oppmerking" },
    "Линии и стрелки на асфальте.": { uk: "Лінії та стрілки на асфальті.", en: "Lines and arrows on the road.", no: "Linjer og piler på vegen." },
    "Вся тема": { uk: "Уся тема", en: "Whole topic", no: "Hele emnet" },
    "Все": { uk: "Усі", en: "All", no: "Alle" },
    "вопросов.": { uk: "питань.", en: "questions.", no: "spørsmål." },
    "заданий.": { uk: "завдань.", en: "tasks.", no: "oppgaver." },
    "знаков.": { uk: "знаків.", en: "signs.", no: "skilt." },
    "вопросов в случайном порядке.": { uk: "питань у випадковому порядку.", en: "questions in random order.", no: "spørsmål i tilfeldig rekkefølge." },
    "Только мои ошибки": { uk: "Тільки мої помилки", en: "Only my mistakes", no: "Bare mine feil" },
    "вопросов, где ты ошибался.": { uk: "питань, де ти помилявся.", en: "questions you got wrong.", no: "spørsmål du bommet på." },
    "заданий, где ты ошибался.": { uk: "завдань, де ти помилявся.", en: "tasks you got wrong.", no: "oppgaver du bommet på." },
    "Пока нет ошибок в этой теме.": { uk: "Поки немає помилок у цій темі.", en: "No mistakes in this topic yet.", no: "Ingen feil i dette emnet ennå." },
    "Ошибки:": { uk: "Помилки:", en: "Mistakes:", no: "Feil:" },
    "Новое:": { uk: "Нове:", en: "New:", no: "Nytt:" },

    /* ---------- квиз ---------- */
    "Показать перевод": { uk: "Показати переклад", en: "Show translation", no: "Vis oversettelse" },
    "Скрыть перевод": { uk: "Сховати переклад", en: "Hide translation", no: "Skjul oversettelse" },
    "проверить": { uk: "перевірити", en: "check", no: "sjekk" },
    "выбери все верные": { uk: "вибери всі правильні", en: "select all correct", no: "velg alle riktige" },
    "Предыдущий вопрос": { uk: "Попереднє питання", en: "Previous question", no: "Forrige spørsmål" },
    "Следующий вопрос": { uk: "Наступне питання", en: "Next question", no: "Neste spørsmål" },
    "проверено": { uk: "перевірено", en: "checked", no: "sjekket" },
    "отвечено": { uk: "відповідей", en: "answered", no: "besvart" },
    "сдать": { uk: "здати", en: "submit", no: "lever" },
    "Результат": { uk: "Результат", en: "Result", no: "Resultat" },
    "Прервать": { uk: "Перервати", en: "Abort", no: "Avbryt" },
    "Прервать экзамен? Результат не сохранится.": { uk: "Перервати іспит? Результат не збережеться.", en: "Abort the exam? The result won't be saved.", no: "Avbryte prøven? Resultatet blir ikke lagret." },
    "Ответы можно менять до сдачи. Кнопка «Lever» на последнем вопросе.": { uk: "Відповіді можна змінювати до здачі. Кнопка «Lever» на останньому питанні.", en: "You can change answers until you submit. The “Lever” button is on the last question.", no: "Du kan endre svar fram til du leverer. «Lever»-knappen er på siste spørsmål." },
    "Без ответа:": { uk: "Без відповіді:", en: "Unanswered:", no: "Ubesvart:" },
    "Они будут засчитаны как ошибки. Сдать?": { uk: "Вони будуть зараховані як помилки. Здати?", en: "They will count as mistakes. Submit?", no: "De teller som feil. Levere?" },
    "Двойное нажатие по варианту — проверить. Клавиатура: 1–4 или A–D — выбрать, Enter — проверить / дальше, ← → — переход, T — перевод, S — озвучить": {
      uk: "Подвійне натискання на варіант — перевірити. Клавіатура: 1–4 або A–D — вибрати, Enter — перевірити / далі, ← → — перехід, T — переклад, S — озвучити",
      en: "Double-tap an option to check. Keyboard: 1–4 or A–D — select, Enter — check / next, ← → — navigate, T — translation, S — speak",
      no: "Dobbelttrykk på et alternativ for å sjekke. Tastatur: 1–4 eller A–D – velg, Enter – sjekk / neste, ← → – bla, T – oversettelse, S – les opp"
    },
    "Верно!": { uk: "Правильно!", en: "Correct!", no: "Riktig!" },
    "Неверно": { uk: "Неправильно", en: "Wrong", no: "Feil" },
    "ты ответил": { uk: "ти відповів", en: "you answered", no: "du svarte" },
    "правильный ответ": { uk: "правильна відповідь", en: "correct answer", no: "riktig svar" },
    "правильные ответы": { uk: "правильні відповіді", en: "correct answers", no: "riktige svar" },
    "Ты не отметил:": { uk: "Ти не позначив:", en: "You missed:", no: "Du manglet:" },
    "На экзамене нужно отметить все верные варианты и ни одного неверного.": { uk: "На іспиті потрібно позначити всі правильні варіанти і жодного неправильного.", en: "In the exam you must select every correct option and no wrong ones.", no: "På prøven må alle riktige svar være valgt, og ingen feil." },
    "Как исправить:": { uk: "Як виправити:", en: "How to fix it:", no: "Slik retter du det:" },
    "Этот вариант не соответствует правилам.": { uk: "Цей варіант не відповідає правилам.", en: "This option doesn't match the rules.", no: "Dette alternativet stemmer ikke med reglene." },
    "Этот вариант неверный.": { uk: "Цей варіант неправильний.", en: "This option is wrong.", no: "Dette alternativet er feil." },
    "верно,": { uk: "правильно,", en: "correct,", no: "riktige," },
    "ошибка": { uk: "помилка", en: "mistake", no: "feil" },
    "ошибки": { uk: "помилки", en: "mistakes", no: "feil" },
    "ошибок": { uk: "помилок", en: "mistakes", no: "feil" },
    "Ошибок": { uk: "Помилок", en: "Mistakes", no: "Feil" },
    "допускается не больше": { uk: "допускається не більше", en: "at most", no: "maks" },
    "допускается": { uk: "допускається", en: "allowed", no: "tillatt" },
    "Отлично. На экзамене нужно не меньше 85% верных.": { uk: "Чудово. На іспиті потрібно не менше 85% правильних.", en: "Excellent. The exam requires at least 85% correct.", no: "Flott. På prøven kreves minst 85 % riktige." },
    "Неплохо, но до экзаменационного порога (85%) ещё есть запас.": { uk: "Непогано, але до іспитового порогу (85%) ще є запас.", en: "Not bad, but the exam threshold (85%) is still ahead.", no: "Ikke verst, men det er et stykke igjen til prøvegrensen (85 %)." },
    "Тема пока слабая. Пройди ошибки ниже и повтори.": { uk: "Тема поки слабка. Пройди помилки нижче і повтори.", en: "This topic is still weak. Go through the mistakes below and repeat.", no: "Emnet sitter ikke ennå. Gå gjennom feilene under og prøv igjen." },
    "Новый экзамен": { uk: "Новий іспит", en: "New exam", no: "Ny prøve" },
    "Обзор всех вопросов": { uk: "Огляд усіх питань", en: "Review all questions", no: "Gjennomgang av alle spørsmål" },
    "только ошибки": { uk: "тільки помилки", en: "mistakes only", no: "bare feil" },
    "Твой ответ:": { uk: "Твоя відповідь:", en: "Your answer:", no: "Ditt svar:" },
    "без ответа": { uk: "без відповіді", en: "no answer", no: "ubesvart" },
    "Правильно:": { uk: "Правильно:", en: "Correct:", no: "Riktig:" },
    "Повторение ошибок": { uk: "Повторення помилок", en: "Mistake review", no: "Repetisjon av feil" },

    /* ---------- ошибки ---------- */
    "Мои ошибки": { uk: "Мої помилки", en: "My mistakes", no: "Mine feil" },
    "Здесь собраны задания, на которые ты отвечал неверно. Тренируй их, пока ответ не станет уверенным.": { uk: "Тут зібрано завдання, на які ти відповідав неправильно. Тренуй їх, доки відповідь не стане впевненою.", en: "Here are the tasks you got wrong. Practise them until you're confident.", no: "Her er oppgavene du svarte feil på. Øv til du er sikker." },
    "Ошибок пока нет. Пройди задание дня или пару тренировок, и здесь появится список для повторения.": { uk: "Помилок поки немає. Пройди завдання дня або кілька тренувань, і тут з’явиться список для повторення.", en: "No mistakes yet. Do the daily task or a couple of practice rounds and a review list will appear here.", no: "Ingen feil ennå. Ta dagens økt eller et par øvinger, så dukker det opp en liste her." },
    "заданий с ошибками": { uk: "завдань з помилками", en: "tasks with mistakes", no: "oppgaver med feil" },
    "и ещё": { uk: "і ще", en: "and", no: "og" },
    "слов, которые ты отметил как «не знаю»": { uk: "слів, які ти позначив як «не знаю»", en: "words you marked “don't know”", no: "ord du merket som «vet ikke»" },
    "Сбросить прогресс этого профиля": { uk: "Скинути прогрес цього профілю", en: "Reset this profile's progress", no: "Nullstill framgangen for denne profilen" },
    "Стереть весь прогресс профиля «": { uk: "Стерти весь прогрес профілю «", en: "Erase all progress for profile “", no: "Slette all framgang for profilen «" },

    /* ---------- лексика ---------- */
    "К лексике": { uk: "До лексики", en: "Back to vocabulary", no: "Til ordforrådet" },
    "Лексика:": { uk: "Лексика:", en: "Vocabulary:", no: "Ordforråd:" },
    "Лексика: результат": { uk: "Лексика: результат", en: "Vocabulary: result", no: "Ordforråd: resultat" },
    "знаю": { uk: "знаю", en: "known", no: "kan" },
    "знаешь": { uk: "знаєш", en: "known", no: "kan" },
    "новых": { uk: "нових", en: "new", no: "nye" },
    "Начатая колода:": { uk: "Розпочата колода:", en: "Deck in progress:", no: "Påbegynt kortstokk:" },
    "Новые слова": { uk: "Нові слова", en: "New words", no: "Nye ord" },
    "слов, которые ты ещё не видел (всего новых": { uk: "слів, які ти ще не бачив (усього нових", en: "words you haven't seen yet (new in total:", no: "ord du ikke har sett ennå (nye totalt:" },
    "слов уже пройдены хотя бы раз. Новые слова появляются каждые три дня, а пока повторяй незнакомые.": { uk: "слів уже пройдено хоча б раз. Нові слова з’являються кожні три дні, а поки повторюй незнайомі.", en: "words have been seen at least once. New words arrive every three days; meanwhile review the unknown ones.", no: "ord er allerede gjennomgått minst én gang. Nye ord kommer hver tredje dag – repeter de ukjente så lenge." },
    "Повторить незнакомые": { uk: "Повторити незнайомі", en: "Review unknown", no: "Repeter ukjente" },
    "Повторить незнакомые (": { uk: "Повторити незнайомі (", en: "Review unknown (", no: "Repeter ukjente (" },
    "слов, которые ты отметил «не знаю».": { uk: "слів, які ти позначив «не знаю».", en: "words you marked “don't know”.", no: "ord du merket «vet ikke»." },
    "Незнакомых слов нет.": { uk: "Незнайомих слів немає.", en: "No unknown words.", no: "Ingen ukjente ord." },
    "Все слова": { uk: "Усі слова", en: "All words", no: "Alle ord" },
    "Вся колода в случайном порядке.": { uk: "Уся колода у випадковому порядку.", en: "The whole deck in random order.", no: "Hele kortstokken i tilfeldig rekkefølge." },
    "Повторение": { uk: "Повторення", en: "Review", no: "Repetisjon" },
    "нажми, чтобы перевернуть": { uk: "натисни, щоб перевернути", en: "tap to flip", no: "trykk for å snu" },
    "Не знаю": { uk: "Не знаю", en: "Don't know", no: "Vet ikke" },
    "Знаю →": { uk: "Знаю →", en: "Know it →", no: "Kan det →" },
    "Клавиатура: пробел — перевернуть, ← не знаю, → знаю, S — озвучить": { uk: "Клавіатура: пробіл — перевернути, ← не знаю, → знаю, S — озвучити", en: "Keyboard: space — flip, ← don't know, → know, S — speak", no: "Tastatur: mellomrom – snu, ← vet ikke, → kan det, S – les opp" },
    "Скопировать": { uk: "Скопіювати", en: "Copy", no: "Kopier" },
    "Скопировать слово": { uk: "Скопіювати слово", en: "Copy the word", no: "Kopier ordet" },
    "Скопировано": { uk: "Скопійовано", en: "Copied", no: "Kopiert" },
    "Слова на повторение": { uk: "Слова на повторення", en: "Words to review", no: "Ord til repetisjon" },
    "Озвучить": { uk: "Озвучити", en: "Speak", no: "Les opp" },
    "Озвучить по-норвежски": { uk: "Озвучити норвезькою", en: "Speak in Norwegian", no: "Les opp på norsk" },
    "В системе нет норвежского голоса. iPhone: Настройки → Универсальный доступ → Устный контент → Голоса → Norsk. Android: настройки Google TTS → установить норвежский.": {
      uk: "У системі немає норвезького голосу. iPhone: Параметри → Доступність → Вимовлений вміст → Голоси → Norsk. Android: налаштування Google TTS → встановити норвезьку.",
      en: "No Norwegian voice installed. iPhone: Settings → Accessibility → Spoken Content → Voices → Norsk. Android: Google TTS settings → install Norwegian.",
      no: "Ingen norsk stemme installert. iPhone: Innstillinger → Tilgjengelighet → Opplest innhold → Stemmer → Norsk. Android: Google TTS-innstillinger → installer norsk."
    },

    /* ---------- статистика ---------- */
    "Ошибки возвращаются на повторение через 1 → 3 → 7 → 14 → 30 дней: чем увереннее ответ, тем реже вопрос.": { uk: "Помилки повертаються на повторення через 1 → 3 → 7 → 14 → 30 днів: що впевненіша відповідь, то рідше питання.", en: "Mistakes come back after 1 → 3 → 7 → 14 → 30 days: the more confident the answer, the rarer the question.", no: "Feil kommer tilbake etter 1 → 3 → 7 → 14 → 30 dager: jo sikrere svar, jo sjeldnere spørsmål." },
    "дней с заданием дня": { uk: "днів із завданням дня", en: "days with the daily task", no: "dager med dagens økt" },
    "Повторить сегодняшние (": { uk: "Повторити сьогоднішні (", en: "Review today's (", no: "Repeter dagens (" },
    "Проходной балл: 38 из 45 (не больше 7 ошибок).": { uk: "Прохідний бал: 38 із 45 (не більше 7 помилок).", en: "Pass mark: 38 of 45 (at most 7 mistakes).", no: "Grense for bestått: 38 av 45 (maks 7 feil)." },
    "Результаты экзаменов": { uk: "Результати іспитів", en: "Exam results", no: "Prøveresultater" },
    "Экзаменов ещё не было.": { uk: "Іспитів ще не було.", en: "No exams yet.", no: "Ingen prøver ennå." },
    "Задание дня: точность по дням": { uk: "Завдання дня: точність по днях", en: "Daily task: accuracy by day", no: "Dagens økt: treffsikkerhet per dag" },
    "Последние 30 дней. Пунктир — ориентир 85 %.": { uk: "Останні 30 днів. Пунктир — орієнтир 85 %.", en: "Last 30 days. Dashed line — the 85% target.", no: "Siste 30 dager. Stiplet linje – målet på 85 %." },
    "Точность задания дня по дням": { uk: "Точність завдання дня по днях", en: "Daily task accuracy by day", no: "Treffsikkerhet på dagens økt per dag" },
    "По темам": { uk: "За темами", en: "By topic", no: "Etter emne" },
    "Карточки": { uk: "Картки", en: "Flashcards", no: "Kort" },
    "Знаки по категориям": { uk: "Знаки за категоріями", en: "Signs by category", no: "Skilt etter kategori" },
    "Знаки по типу задания": { uk: "Знаки за типом завдання", en: "Signs by task type", no: "Skilt etter oppgavetype" },
    "не начато": { uk: "не почато", en: "not started", no: "ikke startet" },
    "Ошибки (": { uk: "Помилки (", en: "Mistakes (", no: "Feil (" },

    /* ---------- PWA ---------- */
    "Доступно обновление сайта": { uk: "Доступне оновлення сайту", en: "A site update is available", no: "En oppdatering er tilgjengelig" },
    "Приложение установлено": { uk: "Застосунок встановлено", en: "App installed", no: "Appen er installert" },
    "Установить приложение": { uk: "Встановити застосунок", en: "Install the app", no: "Installer appen" },
    "Установить": { uk: "Встановити", en: "Install", no: "Installer" },
    "Иконка на экране, полный экран, работа без интернета.": { uk: "Іконка на екрані, повний екран, робота без інтернету.", en: "Home screen icon, full screen, works offline.", no: "Ikon på skjermen, fullskjerm, fungerer uten nett." },
    "На экран «Домой»": { uk: "На екран «Додому»", en: "Add to Home Screen", no: "Legg til på Hjem-skjermen" },
    "В Safari нажми «Поделиться» → «На экран “Домой”». Тогда сайт откроется как приложение и прогресс не удалится.": { uk: "У Safari натисни «Поділитися» → «На екран “Додому”». Тоді сайт відкриється як застосунок і прогрес не зникне.", en: "In Safari tap Share → “Add to Home Screen”. The site then opens like an app and your progress won't be deleted.", no: "I Safari: trykk Del → «Legg til på Hjem-skjerm». Da åpnes siden som en app, og framgangen slettes ikke." },
    "Кэш недоступен в этом браузере": { uk: "Кеш недоступний у цьому браузері", en: "Cache is not available in this browser", no: "Hurtiglager er ikke tilgjengelig i denne nettleseren" },
    "Загружаю…": { uk: "Завантажую…", en: "Downloading…", no: "Laster ned…" },
    "загружаю…": { uk: "завантажую…", en: "loading…", no: "laster…" },
    "Готово ✓": { uk: "Готово ✓", en: "Done ✓", no: "Ferdig ✓" },
    "Все знаки сохранены для офлайна": { uk: "Усі знаки збережено для офлайну", en: "All signs saved for offline use", no: "Alle skilt er lagret for bruk uten nett" },
    "Озвучка сохранена для офлайна": { uk: "Озвучку збережено для офлайну", en: "Audio saved for offline use", no: "Lyden er lagret for bruk uten nett" },
    "Не удалось загрузить:": { uk: "Не вдалося завантажити:", en: "Could not download:", no: "Kunne ikke laste ned:" },

    /* ---------- пометки о языке содержания ---------- */
    "Перевод заданий пока на русском.": { uk: "Переклад завдань поки російською.", en: "Task translations are in Russian for now.", no: "" }
  };

  let lang = "ru";
  try { lang = localStorage.getItem(KEY) || (navigator.language || "").slice(0, 2).replace("nb", "no").replace("nn", "no"); } catch (e) { /* ignore */ }
  if (!LANGS[lang]) lang = "ru";

  function t(key) {
    if (lang === "ru") return key;
    const row = D[key];
    return row && row[lang] !== undefined && row[lang] !== "" ? row[lang] : key;
  }

  /* перевод содержания заданий сейчас только русский */
  function contentAvailable() { return lang === "ru"; }
  /* показывать ли русский перевод как запасной (uk/en — да, no — нет) */
  function fallbackRu() { return lang === "uk" || lang === "en"; }
  function hideTranslations() { return lang === "no"; }

  function applyStatic() {
    document.documentElement.lang = HTML_LANG[lang];
    document.body.classList.toggle("no-translations", hideTranslations());
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  }

  function setLang(l) {
    if (!LANGS[l]) return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
    applyStatic();
    renderSwitch();
    if (window.renderProfileSwitch) window.renderProfileSwitch();
    if (window.go && window.CURRENT_ROUTE) window.go(window.CURRENT_ROUTE, window.CURRENT_PARAMS, { replace: true, force: true });
  }

  function renderSwitch() {
    const host = document.getElementById("lang-switch");
    if (!host) return;
    host.innerHTML = `<select class="lang-select" aria-label="Language">${Object.keys(LANGS).map(k => `<option value="${k}" ${k === lang ? "selected" : ""}>${LANGS[k]}</option>`).join("")}</select>`;
    host.querySelector("select").onchange = e => setLang(e.target.value);
  }

  window.I18N = { t, get lang() { return lang; }, LANGS, setLang, applyStatic, renderSwitch, contentAvailable, fallbackRu, hideTranslations };
  document.addEventListener("DOMContentLoaded", () => { applyStatic(); renderSwitch(); });
  if (document.readyState !== "loading") { applyStatic(); renderSwitch(); }
})();
