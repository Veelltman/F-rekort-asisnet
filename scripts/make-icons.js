/* Иконки приложения из icons/logo.svg: рисует их Chromium через Playwright.
   Запуск (нужен playwright): node scripts/make-icons.js
   Готовые PNG лежат в репозитории, запускать нужно только после правки логотипа. */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..");
const out = path.join(root, "icons");
const svg = fs.readFileSync(path.join(out, "logo.svg"), "utf8");
/* Без скругления: для maskable и apple-touch система сама обрезает углы */
const square = svg.replace(/rx="\d+"/, 'rx="0"');
/* maskable: знак в «безопасной зоне» 80 %, фон до краёв */
const maskable = square.replace(/<path/g, '<path transform="translate(10 10) scale(0.8)"');

const ICONS = [
  ["icon-192.png", 192, svg],
  ["icon-512.png", 512, svg],
  ["icon-maskable-512.png", 512, maskable],
  ["apple-touch-icon.png", 180, square],
  ["favicon-32.png", 64, svg]
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [file, size, src] of ICONS) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${src}`);
    await page.screenshot({ path: path.join(out, file), omitBackground: true });
    console.log(file, size);
  }
  await browser.close();
})();
