/* Собственные упрощённые SVG-пиктограммы дорожных знаков.
   Не копируют официальную графику Statens vegvesen — только форма/цвет,
   которые являются функциональной (не авторской) частью знака. */

(function () {
  "use strict";

  function shapeWrapper(shape, inner) {
    const shapes = {
      "triangle-warning": `
        <polygon points="50,6 96,90 4,90" fill="#fff" stroke="#d81e1e" stroke-width="6" stroke-linejoin="round"/>`,
      "triangle-yield": `
        <polygon points="4,10 96,10 50,94" fill="#fff" stroke="#d81e1e" stroke-width="6" stroke-linejoin="round"/>`,
      "circle-red": `
        <circle cx="50" cy="50" r="44" fill="#fff" stroke="#d81e1e" stroke-width="7"/>`,
      "circle-red-filled": `
        <circle cx="50" cy="50" r="44" fill="#d81e1e"/>`,
      "circle-blue": `
        <circle cx="50" cy="50" r="44" fill="#1d5fd6"/>`,
      "square-blue": `
        <rect x="6" y="6" width="88" height="88" rx="6" fill="#1d5fd6"/>`,
      "octagon-red": `
        <polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" fill="#d81e1e"/>`,
      "diamond-yellow": `
        <polygon points="50,4 96,50 50,96 4,50" fill="#fff" stroke="#d81e1e" stroke-width="4"/>
        <polygon points="50,16 84,50 50,84 16,50" fill="#f6c945"/>`
    };
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="sign-icon">
      ${shapes[shape] || ""}
      ${inner || ""}
    </svg>`;
  }

  const icon = {
    text(t, opts) {
      const o = opts || {};
      return `<text x="50" y="${o.y || 64}" text-anchor="middle"
        font-family="Arial, sans-serif" font-weight="700"
        font-size="${o.size || 38}" fill="${o.fill || '#1a1a1a'}">${t}</text>`;
    },
    stopText() {
      return `<text x="50" y="60" text-anchor="middle" font-family="Arial, sans-serif"
        font-weight="800" font-size="22" fill="#fff" letter-spacing="1">STOPP</text>`;
    },
    diagonalBar(color) {
      return `<line x1="18" y1="18" x2="82" y2="82" stroke="${color || '#d81e1e'}" stroke-width="8" stroke-linecap="round"/>`;
    },
    arrowUp(color) {
      return `<path d="M50 22 L74 54 L58 54 L58 82 L42 82 L42 54 L26 54 Z" fill="${color || '#fff'}"/>`;
    },
    arrowCurved(color) {
      return `<path d="M28 78 C28 40 72 40 72 20" stroke="${color || '#1a1a1a'}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <polygon points="60,14 80,16 70,32" fill="${color || '#1a1a1a'}"/>`;
    },
    roundabout() {
      return `<circle cx="50" cy="50" r="22" fill="none" stroke="#fff" stroke-width="7"/>
        <polygon points="70,30 82,30 76,42" fill="#fff"/>
        <polygon points="30,70 18,70 24,58" fill="#fff"/>`;
    },
    pedestrian(color) {
      color = color || "#1a1a1a";
      return `<circle cx="50" cy="26" r="8" fill="${color}"/>
        <path d="M50 34 L50 62 M50 40 L34 52 M50 40 L66 52 M50 62 L38 88 M50 62 L62 88"
          stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    },
    child(color) {
      color = color || "#1a1a1a";
      return `<circle cx="38" cy="30" r="7" fill="${color}"/>
        <path d="M38 37 L38 60 M38 42 L26 52 M38 42 L50 52 M38 60 L28 82 M38 60 L48 82"
          stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="68" cy="46" r="5" fill="${color}"/>
        <path d="M68 51 L68 68 M68 55 L60 62 M68 55 L76 62 M68 68 L60 84 M68 68 L76 84"
          stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    },
    zebra() {
      let bars = "";
      for (let i = 0; i < 4; i++) {
        const x = 24 + i * 14;
        bars += `<rect x="${x}" y="60" width="8" height="26" fill="#fff"/>`;
      }
      return bars;
    },
    deer(color) {
      color = color || "#1a1a1a";
      return `<path d="M30 76 L34 50 L26 34 M34 50 L30 30 M60 76 L64 46
        C64 40 70 30 78 30 M64 46 C60 30 54 26 46 30 M46 30 C40 34 40 44 46 50
        C50 54 56 54 60 50" stroke="${color}" stroke-width="5" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    car(color) {
      color = color || "#1a1a1a";
      return `<rect x="18" y="46" width="64" height="20" rx="6" fill="${color}"/>
        <rect x="30" y="34" width="40" height="16" rx="5" fill="${color}"/>
        <circle cx="32" cy="68" r="7" fill="${color}"/>
        <circle cx="68" cy="68" r="7" fill="${color}"/>`;
    },
    bike(color) {
      color = color || "#fff";
      return `<circle cx="30" cy="66" r="14" fill="none" stroke="${color}" stroke-width="5"/>
        <circle cx="70" cy="66" r="14" fill="none" stroke="${color}" stroke-width="5"/>
        <path d="M30 66 L48 34 L70 66 M40 50 L58 50 M48 34 L58 34"
          stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    },
    worker(color) {
      color = color || "#1a1a1a";
      return `<circle cx="42" cy="28" r="8" fill="${color}"/>
        <path d="M42 36 L42 62 M42 42 L24 54 M42 42 L64 34 M42 62 L30 88 M42 62 L54 88"
          stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <line x1="64" y1="34" x2="74" y2="70" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
    },
    railway(color) {
      color = color || "#1a1a1a";
      return `<line x1="16" y1="16" x2="84" y2="84" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="84" y1="16" x2="16" y2="84" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`;
    },
    skid(color) {
      color = color || "#1a1a1a";
      return `<path d="M16 70 C 34 76, 40 56, 56 62" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M34 82 C 52 88, 58 68, 74 74" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    },
    narrow(color) {
      color = color || "#1a1a1a";
      return `<path d="M14 20 L46 50 L14 80 M86 20 L54 50 L86 80"
        stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    bump(color) {
      color = color || "#1a1a1a";
      return `<path d="M12 72 C 30 72, 30 40, 50 40 C 70 40, 70 72, 88 72"
        stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    },
    crossIntersection(color) {
      color = color || "#1a1a1a";
      return `<line x1="50" y1="16" x2="50" y2="84" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
        <line x1="16" y1="50" x2="84" y2="50" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
    },
    noEntryBar() {
      return `<rect x="16" y="42" width="68" height="16" rx="3" fill="#fff"/>`;
    }
  };

  window.SIGN_ICONS = { shapeWrapper, icon };
})();
