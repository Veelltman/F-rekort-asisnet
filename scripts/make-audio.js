/* Озвучивает слова из лексики нейросетевыми голосами Microsoft (бесплатно, через Edge TTS).
   Создаёт только недостающие файлы: audio/vocab/<id>-<voice>.mp3
   Запуск: npm install --no-save msedge-tts && node scripts/make-audio.js */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "audio", "vocab");
fs.mkdirSync(outDir, { recursive: true });

const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js/data/vocabulary.js"), "utf8"), ctx);
const words = ctx.window.QUESTION_DATA.vocabulary;

const VOICES = { finn: "nb-NO-FinnNeural", pernille: "nb-NO-PernilleNeural" };

function speakable(w) {
  return w.replace(/\s*\([^)]*\)/g, "").replace(/\s*\/\s*/g, ", ").trim();
}

(async () => {
  let made = 0;
  for (const [key, name] of Object.entries(VOICES)) {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(name, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    for (const w of words) {
      const target = path.join(outDir, `${w.id}-${key}.mp3`);
      if (fs.existsSync(target)) continue;
      const tmp = path.join(outDir, `tmp-${key}`);
      fs.mkdirSync(tmp, { recursive: true });
      const { audioFilePath } = await tts.toFile(tmp, speakable(w.word_no));
      fs.renameSync(audioFilePath, target);
      made += 1;
      process.stdout.write(`${w.id} ${key}\n`);
    }
    fs.rmSync(path.join(outDir, `tmp-${key}`), { recursive: true, force: true });
  }
  console.log(`готово: новых файлов ${made}, всего ${fs.readdirSync(outDir).length}`);
  process.exit(0);
})().catch(e => { console.error("Ошибка озвучки:", e.message); process.exit(1); });
