/* Генерирует иконки приложения (PNG) без внешних библиотек: жёлтый ромб «forkjørsveg» на асфальте.
   Запуск: node scripts/make-icons.js */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(width, height, pixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (width * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))
  ]);
}

const ASPHALT = [30, 42, 50], WHITE = [255, 255, 255], DARK = [26, 26, 26], YELLOW = [245, 197, 49];

function draw(size, opts) {
  const c = size / 2;
  const rOuter = size * (opts.maskable ? 0.30 : 0.36);
  const rBorder = rOuter * 0.80;
  const rInner = rOuter * 0.74;
  const lineY = size * 0.87, lineH = size * 0.035;
  const corner = opts.rounded ? size * 0.22 : 0;
  return png(size, size, (x, y) => {
    if (corner) {
      const cx = Math.max(corner - x, 0, x - (size - 1 - corner)), cy = Math.max(corner - y, 0, y - (size - 1 - corner));
      if (cx * cx + cy * cy > corner * corner) return [0, 0, 0, 0];
    }
    const d = Math.abs(x + 0.5 - c) + Math.abs(y + 0.5 - c);
    let col = ASPHALT;
    if (!opts.maskable && y > lineY && y < lineY + lineH && Math.floor(x / (size * 0.12)) % 2 === 0) col = YELLOW;
    if (d <= rOuter) col = WHITE;
    if (d <= rBorder) col = DARK;
    if (d <= rInner) col = YELLOW;
    return [col[0], col[1], col[2], 255];
  });
}

const out = path.join(__dirname, "..", "icons");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "icon-192.png"), draw(192, {}));
fs.writeFileSync(path.join(out, "icon-512.png"), draw(512, {}));
fs.writeFileSync(path.join(out, "icon-maskable-512.png"), draw(512, { maskable: true }));
fs.writeFileSync(path.join(out, "apple-touch-icon.png"), draw(180, {}));
fs.writeFileSync(path.join(out, "favicon-32.png"), draw(32, { rounded: true }));
console.log("icons written to", out);
