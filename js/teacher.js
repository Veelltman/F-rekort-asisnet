/* «Учитель»: живой репетитор на Claude API.
   Ключ хранится только в localStorage этого браузера и отправляется напрямую в api.anthropic.com.
   Если задан адрес прокси (Cloudflare Worker из папки worker/), ключ не нужен. */

(function () {
  "use strict";

  const KEY_KEY = "forerkort-api-key";
  const PROXY_KEY = "forerkort-api-proxy";
  const BANK_KEY = "forerkort-ai-bank";
  const MODEL = "claude-opus-5";

  const D = window.QUESTION_DATA;
  const S = window.Storage;
  const esc = window.QuizEngine.esc;

  /* ---------- Настройки ---------- */
  const settings = {
    get key() { try { return localStorage.getItem(KEY_KEY) || ""; } catch (e) { return ""; } },
    set key(v) { try { v ? localStorage.setItem(KEY_KEY, v) : localStorage.removeItem(KEY_KEY); } catch (e) { /* ignore */ } },
    get proxy() { try { return localStorage.getItem(PROXY_KEY) || ""; } catch (e) { return ""; } },
    set proxy(v) { try { v ? localStorage.setItem(PROXY_KEY, v) : localStorage.removeItem(PROXY_KEY); } catch (e) { /* ignore */ } },
    get ready() { return !!(this.key || this.proxy); }
  };

  function loadBank() { try { return JSON.parse(localStorage.getItem(BANK_KEY) || "[]"); } catch (e) { return []; } }
  function saveBank(list) { try { localStorage.setItem(BANK_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ } }

  /* ---------- Системный промпт (стабильный, кэшируется) ---------- */
  const SYSTEM = `Du er en erfaren norsk trafikklærer som forbereder en voksen elev til teoriprøven for førerkort klasse B i Norge. Eleven er russiskspråklig og lærer norsk (nivå A2–B1). Du underviser på norsk bokmål og gir russisk oversettelse/forklaring der det er markert.

Faglig grunnlag: vegtrafikkloven, trafikkreglene, skiltforskriften, Statens vegvesens teoribok. Satser for forenklet forelegg fra 15. februar 2026: håndholdt mobil, kjøring på rødt, brudd på vikeplikt, for kort avstand og ulovlig forbikjøring gir 10 750 kr og 3 prikker; manglende lys 4 100 kr; fart i 60-sone eller lavere: til og med 5 over 1 250 kr, 10 over 3 350, 15 over 5 950 og 2 prikker, 20 over 8 650 og 3 prikker, 25 over 13 450 og 3 prikker, fra 26 over tap av førerkort; i 70-sone eller høyere: 5 over 1 250, 10 over 3 350, 15 over 5 350, 20 over 7 450 og 2 prikker, 25 over 10 100 og 3 prikker, fra 36 over tap av førerkort. 8 prikker på 3 år gir tap av førerkort i 6 måneder; i prøveperioden (2 år) dobles prikker. Promillegrense 0,2. Nærlys påbudt hele døgnet. Barn under 135 cm i godkjent sikringsutstyr. Stans forbudt nærmere enn 5 m foran gangfelt, 5 m fra kryss, 20 m fra holdeplasskilt. Vinterdekk minst 3 mm mønster i vinterperioden. Buss som gir tegn fra holdeplass skal slippes fram der fartsgrensen er 60 eller lavere.

Prinsipper: vær presis og konkret. Ikke finn på regler eller satser du er usikker på; si heller «sjekk teoriboka». Bruk enkel norsk i oppgavetekster. I språkretting: rett bare faktiske feil, forklar kort på russisk hvorfor, og ikke rett stil som er akseptabel. Vær vennlig, men ikke overdrevent rosende.`;

  /* ---------- Вызов API ---------- */
  async function callClaude(body) {
    const proxy = settings.proxy;
    const url = proxy ? proxy.replace(/\/$/, "") + "/v1/messages" : "https://api.anthropic.com/v1/messages";
    const headers = {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01"
    };
    if (!proxy) {
      headers["x-api-key"] = settings.key;
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }
    const payload = Object.assign({
      model: MODEL,
      max_tokens: 16000,
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }]
    }, body);
    if (body.output_config) payload.output_config = Object.assign({ effort: "medium" }, body.output_config);

    let res;
    try {
      res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    } catch (e) {
      throw new Error("Нет связи с API. Проверь интернет или адрес прокси.");
    }
    if (res.status === 401) throw new Error("Ключ API не принят (401). Проверь ключ в настройках.");
    if (res.status === 429) throw new Error("Слишком много запросов (429). Подожди минуту и попробуй снова.");
    if (res.status === 400) {
      const t = await res.text();
      throw new Error("API отклонил запрос (400): " + t.slice(0, 300));
    }
    if (!res.ok) throw new Error(`Ошибка API (${res.status}).`);
    const data = await res.json();
    if (data.stop_reason === "refusal") throw new Error("Модель отказалась отвечать на этот запрос.");
    if (data.stop_reason === "max_tokens") throw new Error("Ответ оказался слишком длинным и обрезался. Попробуй ещё раз.");
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    return { text, usage: data.usage, model: data.model };
  }

  function jsonFormat(schema) {
    return { format: { type: "json_schema", schema } };
  }

  function weakSummary() {
    const parts = [];
    ["signs", "situational", "rules"].forEach(t => {
      const weak = S.getWeakQuestions(D[t]).slice(0, 8).map(q => q.entry ? q.entry.no : (q.label || q.prompt_no));
      if (weak.length) parts.push(`${t}: ${weak.join("; ")}`);
    });
    return parts.length ? parts.join("\n") : "ingen registrerte feil ennå";
  }

  /* ---------- Режим 1: свободный ответ ---------- */
  const SITUATION_SCHEMA = {
    type: "object", additionalProperties: false,
    properties: {
      situation_no: { type: "string" },
      situation_ru: { type: "string" },
      question_no: { type: "string" },
      hint_words: {
        type: "array",
        items: { type: "object", additionalProperties: false, properties: { no: { type: "string" }, ru: { type: "string" } }, required: ["no", "ru"] }
      }
    },
    required: ["situation_no", "situation_ru", "question_no", "hint_words"]
  };

  const GRADE_SCHEMA = {
    type: "object", additionalProperties: false,
    properties: {
      verdict: { type: "string", enum: ["riktig", "delvis", "feil"] },
      score: { type: "integer" },
      rule_feedback_no: { type: "string" },
      rule_feedback_ru: { type: "string" },
      language_corrections: {
        type: "array",
        items: { type: "object", additionalProperties: false, properties: { original: { type: "string" }, corrected: { type: "string" }, why_ru: { type: "string" } }, required: ["original", "corrected", "why_ru"] }
      },
      model_answer_no: { type: "string" },
      model_answer_ru: { type: "string" }
    },
    required: ["verdict", "score", "rule_feedback_no", "rule_feedback_ru", "language_corrections", "model_answer_no", "model_answer_ru"]
  };

  async function newSituation(topicHint) {
    const r = await callClaude({
      messages: [{ role: "user", content:
        `Lag én realistisk trafikksituasjon for en fersk bilfører i Norge${topicHint ? " om temaet: " + topicHint : ""}. Elevens registrerte svake punkter:\n${weakSummary()}\n\nSituasjonen skal beskrives på enkel norsk i 2–4 setninger (situation_no) med russisk oversettelse (situation_ru), avsluttes med ett åpent spørsmål på norsk (question_no) som eleven skal svare på med egne ord, og ha 4–6 nøkkelord med oversettelse (hint_words). Varier tema: kryss, rundkjøring, gangfelt, parkering, motorveg, vinterføre, syklister, buss, utrykning, tunnel.` }],
      output_config: jsonFormat(SITUATION_SCHEMA)
    });
    return JSON.parse(r.text);
  }

  async function gradeAnswer(situation, answer) {
    const r = await callClaude({
      messages: [{ role: "user", content:
        `Situasjon:\n${situation.situation_no}\n\nSpørsmål: ${situation.question_no}\n\nElevens svar (på norsk, kan inneholde språkfeil):\n"""${answer}"""\n\nVurder svaret. verdict: riktig/delvis/feil ut fra trafikkreglene. score 0–100. rule_feedback_no: hva var riktig og hva manglet, på norsk. rule_feedback_ru: det samme på russisk, konkret og pedagogisk. language_corrections: bare reelle feil i elevens norsk (grammatikk, ordvalg, bøyning), maks 6, med kort russisk forklaring. model_answer_no: et forbilledlig kort svar en teoriprøve ville godta. model_answer_ru: oversettelse.` }],
      output_config: jsonFormat(GRADE_SCHEMA)
    });
    return JSON.parse(r.text);
  }

  /* ---------- Режим 2: генерация заданий в банк ---------- */
  const QUESTIONS_SCHEMA = {
    type: "object", additionalProperties: false,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          properties: {
            topic: { type: "string", enum: ["situational", "rules"] },
            prompt_no: { type: "string" },
            prompt_ru: { type: "string" },
            options: {
              type: "array",
              items: { type: "object", additionalProperties: false, properties: { text_no: { type: "string" }, text_ru: { type: "string" }, correct: { type: "boolean" } }, required: ["text_no", "text_ru", "correct"] }
            },
            explanation_no: { type: "string" },
            explanation_ru: { type: "string" },
            tip_ru: { type: "string" }
          },
          required: ["topic", "prompt_no", "prompt_ru", "options", "explanation_no", "explanation_ru", "tip_ru"]
        }
      }
    },
    required: ["questions"]
  };

  async function generateQuestions(n, topicHint) {
    const existing = loadBank().slice(-40).map(q => q.prompt_no).join("\n");
    const r = await callClaude({
      messages: [{ role: "user", content:
        `Lag ${n} nye flervalgsoppgaver i stil med den norske teoriprøven klasse B${topicHint ? ", tema: " + topicHint : ", blandede temaer"}. Elevens svake punkter:\n${weakSummary()}\n\nKrav: hver oppgave har nøyaktig 4 alternativer og nøyaktig ett riktig (correct: true). Alternativene skal være plausible, ikke åpenbart dumme. prompt_no på enkel norsk, prompt_ru oversettelse. explanation_no/explanation_ru forklarer regelen. tip_ru: et konkret råd på russisk om hvordan man husker regelen. topic: "situational" for hvem-viker-situasjoner, "rules" for regler, satser, avstander, utstyr. Ikke gjenta disse oppgavene:\n${existing || "(ingen)"}` }],
      output_config: jsonFormat(QUESTIONS_SCHEMA)
    });
    const parsed = JSON.parse(r.text);
    const valid = parsed.questions.filter(q => q.options.length === 4 && q.options.filter(o => o.correct).length === 1);
    const bank = loadBank();
    const stamp = Date.now();
    valid.forEach((q, i) => {
      q.id = "ai-" + stamp.toString(36) + "-" + i;
      q.image = null;
      q.kind = "ai";
      q.created = stamp;
      bank.push(q);
    });
    saveBank(bank);
    return valid;
  }

  /* ---------- Режим 3: вопрос учителю ---------- */
  const chat = [];
  const CHAT_RULE = "\n\n(Svar først kort på norsk, enkel bokmål, 3–8 setninger. Deretter en linje «---», deretter det samme på russisk. Hvis jeg skriver på russisk, svar likevel på norsk først. Ingen markdown-overskrifter.)";
  async function ask(question) {
    chat.push({ role: "user", content: question });
    let history = chat.slice(-10);
    while (history.length && history[0].role !== "user") history = history.slice(1);
    const messages = history.map((m, i) => i === history.length - 1 ? { role: m.role, content: m.content + CHAT_RULE } : m);
    const r = await callClaude({ messages });
    chat.push({ role: "assistant", content: r.text });
    return r.text;
  }

  window.Teacher = { settings, loadBank, saveBank, newSituation, gradeAnswer, generateQuestions, ask, chat, MODEL };
})();
