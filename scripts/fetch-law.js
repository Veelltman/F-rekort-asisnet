/* Скачивает с lovdata.no тексты законов и сохраняет чистым текстом в docs/law/ —
   чтобы робот и люди сверяли факты по самому закону, а не по памяти.
   Норвежские законы и предписания не охраняются авторским правом (åndsverkloven § 14).
   Запуск: node scripts/fetch-law.js   (обновлять раз в год или при изменении закона) */

const fs = require("fs");
const path = require("path");

const SOURCES = [
  { file: "trafikkreglene.txt", url: "https://lovdata.no/dokument/SF/forskrift/1986-03-21-747",
    title: "Trafikkreglene (forskrift om kjørende og gående trafikk), FOR-1986-03-21-747" },
  { file: "vegtrafikkloven.txt", url: "https://lovdata.no/dokument/NL/lov/1965-06-18-4",
    title: "Vegtrafikkloven, LOV-1965-06-18-4" },
  { file: "bruksforskriften.txt", url: "https://lovdata.no/dokument/SF/forskrift/1990-01-25-92",
    title: "Forskrift om bruk av kjøretøy (bruksforskriften), FOR-1990-01-25-92" },
  { file: "skiltforskriften.txt", url: "https://lovdata.no/dokument/SF/forskrift/2005-10-07-1219",
    title: "Skiltforskriften, FOR-2005-10-07-1219" }
];

function clean(html) {
  let t = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x1F517;\s*Del paragraf/g, "").replace(/&#[x0-9a-f]+;/gi, "")
    .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n");
  // до этой строки — меню сайта и оглавление, дальше — карточка документа и сам текст
  const start = t.indexOf("Ditt søk ga dessverre ingen treff.");
  if (start > 0) t = t.slice(start).replace(/^[^\n]*\n+(➦[^\n]*\n+)?/, "");
  // подвал сайта («Del dokument», «Kontakt» …)
  const end = t.indexOf("&times;");
  if (end > 0) t = t.slice(0, end);
  return t.trim() + "\n";
}

(async () => {
  const dir = path.join(__dirname, "..", "docs", "law");
  fs.mkdirSync(dir, { recursive: true });
  for (const s of SOURCES) {
    const res = await fetch(s.url);
    if (!res.ok) { console.error(`${s.file}: HTTP ${res.status}`); continue; }
    const text = clean(await res.text());
    const head = `${s.title}\nИсточник: ${s.url}\nСкачано: ${new Date().toISOString().slice(0, 10)}\n\n`;
    fs.writeFileSync(path.join(dir, s.file), head + text);
    console.log(`${s.file}: ${Math.round(text.length / 1024)} КБ`);
  }
})();
