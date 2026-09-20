/* Бамп версии перед публикацией: одна команда обновляет ?v= в index.html и APP_VERSION в sw.js.
   Запуск: node scripts/bump-version.js */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const v = Date.now().toString(36);

function patch(file, re, repl) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, "utf8");
  const out = src.replace(re, repl);
  if (out === src) throw new Error(`Нечего менять в ${file}`);
  fs.writeFileSync(p, out);
}
patch("index.html", /\?v=[a-z0-9]+"/g, `?v=${v}"`);
patch("sw.js", /const APP_VERSION = "[a-z0-9]+";/, `const APP_VERSION = "${v}";`);
console.log("version", v);
