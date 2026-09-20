/* Озвучка норвежского через встроенный синтез речи браузера (Web Speech API).
   Голос выбирается из установленных в системе: nb-NO / no-NO / nn-NO. */

(function () {
  "use strict";

  const tr = window.I18N.t;

  const synth = window.speechSynthesis;
  let voice = null;

  function pickVoice() {
    if (!synth) return null;
    const voices = synth.getVoices();
    const score = v => {
      const l = (v.lang || "").toLowerCase();
      if (l.startsWith("nb")) return 3 + (/google|nora|natural|premium|enhanced/i.test(v.name) ? 1 : 0);
      if (l.startsWith("no")) return 2;
      if (l.startsWith("nn")) return 1;
      return 0;
    };
    voice = voices.filter(v => score(v) > 0).sort((a, b) => score(b) - score(a))[0] || null;
    return voice;
  }
  if (synth) {
    pickVoice();
    synth.onvoiceschanged = pickVoice;
  }

  function available() { return !!synth; }
  function hasNorwegian() { return !!(voice || pickVoice()); }

  function speak(text, opts) {
    if (!synth || !text) return false;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voice || pickVoice();
    if (v) u.voice = v;
    u.lang = (v && v.lang) || "nb-NO";
    u.rate = (opts && opts.rate) || 0.9;
    u.pitch = 1;
    synth.speak(u);
    return true;
  }

  /* Готовые mp3 (нейросетевой голос) с запасным вариантом через синтез */
  const VOICE_KEY = "forerkort-voice";
  function getVoicePref() { try { return localStorage.getItem(VOICE_KEY) || "pernille"; } catch (e) { return "pernille"; } }
  function setVoicePref(v) { try { localStorage.setItem(VOICE_KEY, v); } catch (e) { /* ignore */ } }
  let current = null;
  function playFile(url, fallbackText) {
    if (synth) synth.cancel();
    if (current) { current.pause(); current = null; }
    return new Promise(resolve => {
      const a = new Audio(url);
      current = a;
      a.onended = () => resolve(true);
      a.onerror = () => { current = null; speak(fallbackText); resolve(false); };
      a.play().catch(() => { current = null; speak(fallbackText); resolve(false); });
    });
  }

  /* Кнопка-динамик. text может быть функцией, чтобы читать актуальный текст. */
  function button(text, cls, fileUrl) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn-speak " + (cls || "");
    b.title = tr("Озвучить по-норвежски");
    b.setAttribute("aria-label", tr("Озвучить"));
    b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`;
    b.onclick = e => {
      e.stopPropagation();
      e.preventDefault();
      const t = typeof text === "function" ? text() : text;
      const f = typeof fileUrl === "function" ? fileUrl() : fileUrl;
      if (f) { b.classList.add("speaking"); playFile(f, t).then(() => b.classList.remove("speaking")); return; }
      if (!hasNorwegian()) {
        b.classList.add("no-voice");
        b.title = tr("В системе нет норвежского голоса. iPhone: Настройки → Универсальный доступ → Устный контент → Голоса → Norsk. Android: настройки Google TTS → установить норвежский.");
        speak(t);
        return;
      }
      b.classList.add("speaking");
      speak(t);
      setTimeout(() => b.classList.remove("speaking"), 1500);
    };
    return b;
  }

  window.Speech = { available, hasNorwegian, speak, button, playFile, getVoicePref, setVoicePref };
})();
