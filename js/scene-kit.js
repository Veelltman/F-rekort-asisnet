/* Художник схем дорожных ситуаций (вид сверху, правостороннее движение, Норвегия).
   Всё рисуется строкой SVG — работает и в браузере, и в node (check-data, dump-questions).
   Холст 400×300. Ты — всегда синяя машина «A».

   Основные сцены:
     SK.junction(cfg) — перекрёсток / Т-перекрёсток / кольцо (cfg как у старого scene())
     SK.street(cfg)   — прямая дорога снизу вверх: полосы, тротуары, переходы, остановки, переезды, тоннели…
     SK.hill(cfg)     — машина на уклоне у бордюра или канавы (колёса видно)
     SK.svg(body)     — своя сцена из примитивов SK.car / SK.person / SK.sign / SK.arrow … */

(function () {
  "use strict";

  const W = 400, H = 300;

  /* ---------- Палитра ---------- */
  const P = {
    grass: "#dfe8d5", grass2: "#d3dfc8", tree: "#9cbf8a", tree2: "#86ad74",
    walk: "#e3e6ea", walkLine: "#d2d7dd", curb: "#b3bac3",
    asph: "#565f6b", asph2: "#4f5864", line: "#f5f7fa", yellow: "#f2c94c",
    roof: "#c9b8a3", roof2: "#b9a690", house: "#ece4d8",
    you: "#1f63e0", red: "#e0483a", green: "#22a06b", orange: "#f08c1a", purple: "#8e5bd6", grey: "#8a949e",
    amber: "#ffb000", glass: "#1d2935", ink: "#1d1f24"
  };
  const OTHER = [P.red, P.green, P.orange, P.purple];

  const f1 = v => Math.round(v * 10) / 10;
  const rad = a => a * Math.PI / 180;
  const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;

  /* ---------- Обёртка ---------- */
  function svg(body, opts) {
    const o = opts || {};
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="scene-icon"${o.label ? ` aria-label="${o.label}"` : ""}>` +
      `<rect width="${W}" height="${H}" fill="${o.bg || P.grass}"/>${body}</svg>`;
  }

  /* ---------- Транспорт ----------
     Рисуется носом вверх в точке (0,0), потом поворачивается: rot 0 = едет вверх, 90 = вправо, 180 = вниз, 270 = влево.
     blink: "left" | "right" | "hazard" — мигающий поворотник; brake: стоп-сигналы; beams: "low" | "high" — фары (ночью) */
  function blinkDots(side, hl, hw) {
    const xs = side === "hazard" ? [-hw + 1.5, hw - 1.5] : [side === "left" ? -hw + 1.5 : hw - 1.5];
    return xs.map(x => `<g fill="${P.amber}"><circle cx="${x}" cy="${-hl + 3}" r="2.6"/><circle cx="${x}" cy="${hl - 3}" r="2.6"/>` +
      `<animate attributeName="opacity" values="1;1;0.1;0.1" dur="0.9s" repeatCount="indefinite"/></g>`).join("");
  }
  function wheels(hl, hw, steer) {
    const ys = [-hl + 9, hl - 9];
    return ys.map((y, i) => [-hw - 1, hw + 1].map(x =>
      `<rect x="${x - 2}" y="${y - 4.5}" width="4" height="9" rx="1.5" fill="#15181c"${i === 0 && steer ? ` transform="rotate(${steer} ${x} ${y})"` : ""}/>`).join("")).join("");
  }
  function carBody(color, o) {
    const hl = 20, hw = 10;
    return `${wheels(hl, hw, o.steer)}
      <rect x="${-hw + 2}" y="${-hl + 3}" width="${hw * 2}" height="${hl * 2}" rx="7" fill="#000" opacity="0.18"/>
      <rect x="${-hw}" y="${-hl}" width="${hw * 2}" height="${hl * 2}" rx="7" fill="${color}"/>
      <rect x="${-hw + 2}" y="${-hl + 2}" width="${hw * 2 - 4}" height="${hl * 2 - 4}" rx="5.5" fill="#fff" opacity="0.08"/>
      <path d="M -8 -8 Q 0 -11.5 8 -8 L 7 -2 L -7 -2 Z" fill="${P.glass}" opacity="0.88"/>
      <path d="M -6.5 -8.6 Q -2 -10 2 -9.8" stroke="#fff" stroke-width="1" fill="none" opacity="0.35"/>
      <rect x="-7" y="-1.5" width="14" height="12" rx="3" fill="#fff" opacity="0.13"/>
      <path d="M -7 11 L 7 11 L 6 15.5 L -6 15.5 Z" fill="${P.glass}" opacity="0.8"/>
      <rect x="${-hw - 2.5}" y="-7.5" width="3" height="2.6" rx="1" fill="${color}"/><rect x="${hw - 0.5}" y="-7.5" width="3" height="2.6" rx="1" fill="${color}"/>
      <rect x="-8.5" y="-20" width="4.5" height="2.2" rx="1" fill="#fff6c4"/><rect x="4" y="-20" width="4.5" height="2.2" rx="1" fill="#fff6c4"/>
      <rect x="-8.5" y="17.8" width="4.5" height="2.2" rx="1" fill="${o.brake ? "#ff2a1a" : "#a51c1c"}"/><rect x="4" y="17.8" width="4.5" height="2.2" rx="1" fill="${o.brake ? "#ff2a1a" : "#a51c1c"}"/>
      ${o.brake ? `<g fill="#ff3b2a" opacity="0.35"><circle cx="-6.2" cy="21" r="4"/><circle cx="6.2" cy="21" r="4"/></g>` : ""}
      ${o.blink ? blinkDots(o.blink, hl, hw) : ""}`;
  }
  function truckBody(color, o) {
    /* кабина впереди, длинный кузов/прицеп сзади */
    return `${wheels(36, 11)}<rect x="-9.5" y="-34" width="22" height="74" rx="3" fill="#000" opacity="0.16"/>
      <rect x="-11" y="-14" width="22" height="52" rx="2" fill="#e9edf1" stroke="#b9c1ca" stroke-width="1"/>
      <g stroke="#cfd5dc" stroke-width="1">${[0, 12, 24].map(y => `<line x1="-11" y1="${y}" x2="11" y2="${y}"/>`).join("")}</g>
      <rect x="-10" y="-37" width="20" height="21" rx="4" fill="${color}"/>
      <path d="M -8 -33 Q 0 -36 8 -33 L 7 -27 L -7 -27 Z" fill="${P.glass}" opacity="0.88"/>
      <rect x="-12.5" y="-30" width="3" height="3" rx="1" fill="${color}"/><rect x="9.5" y="-30" width="3" height="3" rx="1" fill="${color}"/>
      <rect x="-8.5" y="-37" width="4" height="2" rx="1" fill="#fff6c4"/><rect x="4.5" y="-37" width="4" height="2" rx="1" fill="#fff6c4"/>
      <rect x="-10" y="36.5" width="4" height="2" rx="1" fill="${o.brake ? "#ff2a1a" : "#a51c1c"}"/><rect x="6" y="36.5" width="4" height="2" rx="1" fill="${o.brake ? "#ff2a1a" : "#a51c1c"}"/>
      ${o.blink ? blinkDots(o.blink, 37, 11) : ""}`;
  }
  function busBody(color, o) {
    return `${wheels(30, 11)}<rect x="-9.5" y="-29" width="22" height="64" rx="5" fill="#000" opacity="0.16"/>
      <rect x="-11" y="-32" width="22" height="64" rx="5" fill="${color}"/>
      <rect x="-9" y="-30" width="18" height="6" rx="2" fill="${P.glass}" opacity="0.88"/>
      <g fill="#fff" opacity="0.28">${[-18, -6, 6, 18].map(y => `<rect x="-6" y="${y}" width="12" height="7" rx="1.5"/>`).join("")}</g>
      <rect x="-9" y="27" width="18" height="3" rx="1" fill="${P.glass}" opacity="0.6"/>
      ${o.blink ? blinkDots(o.blink, 32, 11) : ""}`;
  }
  function tramBody(color, o) {
    return `<rect x="-9.5" y="-44" width="22" height="92" rx="7" fill="#000" opacity="0.16"/>
      <rect x="-11" y="-46" width="22" height="44" rx="7" fill="${color}"/><rect x="-11" y="2" width="22" height="44" rx="7" fill="${color}"/>
      <rect x="-9" y="-3" width="18" height="6" fill="#3a4450"/>
      <rect x="-9" y="-44" width="18" height="6" rx="3" fill="${P.glass}" opacity="0.85"/>
      <g fill="#fff" opacity="0.85"><rect x="-9" y="-30" width="18" height="2.5"/><rect x="-9" y="20" width="18" height="2.5"/></g>
      <path d="M -6 -22 L 6 -14 M -6 -14 L 6 -22" stroke="#2a2f36" stroke-width="1.4"/>
      ${o.doors ? `<g fill="${P.amber}"><rect x="10" y="-36" width="2.5" height="9"/><rect x="10" y="-14" width="2.5" height="9"/><rect x="10" y="12" width="2.5" height="9"/><rect x="10" y="32" width="2.5" height="9"/></g>` : ""}`;
  }
  function emergencyBody(color, o) {
    /* скорая: жёлто-зелёная «шашка», синие проблесковые маячки */
    return `${carBody("#f3f5f7", o)}
      <g opacity="0.95">${[-16, -8, 0, 8].map((y, i) => `<rect x="-10" y="${y}" width="5" height="8" fill="${i % 2 ? "#1f9d55" : "#f5d90a"}"/><rect x="5" y="${y}" width="5" height="8" fill="${i % 2 ? "#f5d90a" : "#1f9d55"}"/>`).join("")}</g>
      <rect x="-7" y="-4" width="14" height="4" rx="1.5" fill="#1d5fd6"/>
      <g><circle cx="-5" cy="-2" r="6" fill="#3b82f6" opacity="0.45"><animate attributeName="opacity" values="0.6;0;0.6" dur="0.6s" repeatCount="indefinite"/></circle>
         <circle cx="5" cy="-2" r="6" fill="#3b82f6" opacity="0.45"><animate attributeName="opacity" values="0;0.6;0" dur="0.6s" repeatCount="indefinite"/></circle></g>`;
  }
  function tractorBody(color) {
    return `<rect x="-14" y="6" width="7" height="18" rx="2" fill="#15181c"/><rect x="7" y="6" width="7" height="18" rx="2" fill="#15181c"/>
      <rect x="-11" y="-20" width="5" height="10" rx="2" fill="#15181c"/><rect x="6" y="-20" width="5" height="10" rx="2" fill="#15181c"/>
      <rect x="-8" y="-22" width="16" height="24" rx="3" fill="${color}"/><rect x="-9" y="2" width="18" height="20" rx="3" fill="${color}"/>
      <rect x="-7" y="6" width="14" height="12" rx="2" fill="${P.glass}" opacity="0.75"/>
      <polygon points="-6,26 6,26 0,34" fill="#f08c1a" stroke="#d81e1e" stroke-width="1.2"/>`;
  }
  function bikeBody(color) {
    /* велосипедист сверху: колёса по оси, плечи, шлем */
    return `<rect x="-1.4" y="-17" width="2.8" height="34" rx="1.4" fill="#2a2f36"/>
      <rect x="-7" y="-10.5" width="14" height="2" rx="1" fill="#2a2f36"/>
      <ellipse cx="0" cy="-1" rx="7" ry="5.5" fill="${color}"/>
      <path d="M -6 -3 L -6.5 -10 M 6 -3 L 6.5 -10" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="0" cy="-4" r="4" fill="#f4f6f8" stroke="#2a2f36" stroke-width="1"/>`;
  }
  function scooterBody(color) {
    return `<rect x="-1.2" y="-13" width="2.4" height="26" rx="1.2" fill="#2a2f36"/><rect x="-5" y="-12" width="10" height="1.8" rx="0.9" fill="#2a2f36"/>
      <ellipse cx="0" cy="0" rx="6" ry="4.5" fill="${color}"/><circle cx="0" cy="-2" r="3.5" fill="#f4f6f8" stroke="#2a2f36" stroke-width="1"/>`;
  }
  function trailerBody(kind) {
    /* прицеп/кемпер рисуется отдельно, сцепка вверху (0,-h) */
    if (kind === "caravan") return `${wheels(4, 12)}<rect x="-10.5" y="3" width="24" height="44" rx="5" fill="#000" opacity="0.15"/>
      <rect x="-12" y="0" width="24" height="44" rx="5" fill="#f4f1ea" stroke="#cbc4b6" stroke-width="1"/>
      <rect x="-9" y="4" width="18" height="5" rx="2" fill="${P.glass}" opacity="0.5"/><line x1="0" y1="0" x2="0" y2="-8" stroke="#555" stroke-width="2"/>`;
    return `${wheels(0, 10)}<rect x="-8.5" y="2" width="20" height="26" rx="2" fill="#000" opacity="0.15"/>
      <rect x="-10" y="0" width="20" height="26" rx="2" fill="#a7b0b9" stroke="#e9edf1" stroke-width="1"/><line x1="0" y1="0" x2="0" y2="-8" stroke="#555" stroke-width="2"/>`;
  }

  /* Ярлык A/B/C — всегда прямо, на крыше */
  function badge(x, y, label, color) {
    if (!label) return "";
    return `<g transform="translate(${f1(x)} ${f1(y)})"><circle r="8.5" fill="#fff" stroke="${color}" stroke-width="2.4"/>` +
      `<text y="3.9" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="11" fill="${color}">${label}</text></g>`;
  }

  function beamsFor(x, y, rot, mode) {
    const len = mode === "high" ? 160 : 90, spread = mode === "high" ? 60 : 34;
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})"><path d="M -8 -20 L ${-spread} ${-20 - len} L ${spread} ${-20 - len} L 8 -20 Z" fill="#fff4b8" opacity="${mode === "high" ? 0.32 : 0.26}"/></g>`;
  }

  /* kind: car | truck | bus | tram | emergency | tractor | bike | scooter | police */
  function vehicle(o) {
    const kind = o.kind || "car", color = o.color || P.you, rot = o.rot || 0;
    const opts = { blink: o.blink, brake: o.brake, steer: o.steer, doors: o.doors };
    const bodyFn = { truck: truckBody, bus: busBody, tram: tramBody, emergency: emergencyBody, tractor: tractorBody, bike: bikeBody, scooter: scooterBody }[kind] || carBody;
    const col = kind === "tram" ? (o.color || "#2f6fd0") : kind === "bus" ? (o.color || "#d8322c") : color;
    let trailer = "";
    if (o.trailer) trailer = `<g transform="translate(0 ${kind === "car" ? 28 : 46})">${trailerBody(o.trailer)}</g>`;
    if (o.trailer && o.trailerRot) trailer = `<g transform="translate(0 ${kind === "car" ? 20 : 38}) rotate(${o.trailerRot}) translate(0 8)">${trailerBody(o.trailer)}</g>` + (!o.sway ? "" :
      `<path d="M -26 ${(kind === "car" ? 56 : 76)} q -7 -9 0 -18 M 26 ${(kind === "car" ? 56 : 76)} q 7 -9 0 -18" stroke="#e0483a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
    const door = o.door ? `<rect x="${o.door === "left" ? -10 - 15 : 10}" y="-7" width="15" height="2.8" rx="1" fill="${col}" stroke="#fff" stroke-width="0.6" transform="rotate(${o.door === "left" ? -35 : 35} ${o.door === "left" ? -10 : 10} -6)"/>` : "";
    const smoke = o.smoke ? `<g opacity="0.9"><circle cx="0" cy="-24" r="9" fill="#ff7a1a"/><circle cx="-3" cy="-28" r="6" fill="#ffd21a"/>` +
      `<circle cx="6" cy="-40" r="10" fill="#6b7280" opacity="0.75"/><circle cx="-6" cy="-52" r="12" fill="#6b7280" opacity="0.6"/><circle cx="4" cy="-68" r="15" fill="#6b7280" opacity="0.45"/></g>` : "";
    const body = `<g transform="translate(${f1(o.x)} ${f1(o.y)}) rotate(${rot})">${trailer}${bodyFn(col, opts)}${door}${smoke}</g>`;
    const bx = o.badgeAt ? o.badgeAt[0] : o.x, by = o.badgeAt ? o.badgeAt[1] : o.y;
    const small = kind === "bike" || kind === "scooter";
    const lb = o.label === false ? "" : badge(small ? bx + 14 : bx, small ? by + 4 : by, o.label, o.badgeColor || (kind === "bike" || kind === "scooter" ? P.green : col === "#f3f5f7" ? P.ink : col));
    return body + lb;
  }

  /* ---------- Люди и животные ----------
     Вид сверху: плечи + голова. rot — куда смотрит/идёт (0 = вверх). kind: adult | child | cane | worker | officer | patrol */
  function person(o) {
    const s = (o.kind === "child" ? 0.85 : 1.15) * (o.scale || 1), rot = o.rot || 0;
    const coat = o.color || (o.kind === "worker" || o.kind === "patrol" ? "#e9f03a" : o.kind === "officer" ? "#20324d" : "#3d4a5c");
    const vest = o.kind === "worker" || o.kind === "patrol" ? `<path d="M -7 -1 L 7 -1" stroke="#ff8a1f" stroke-width="1.6"/>` : "";
    const cane = o.kind === "cane" ? `<line x1="6" y1="-2" x2="11" y2="-15" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><line x1="10" y1="-12.5" x2="11" y2="-15" stroke="#d81e1e" stroke-width="1.8" stroke-linecap="round"/>` : "";
    const wave = o.wave ? `<path d="M 7 0 L 15 -6" stroke="${coat}" stroke-width="3.2" stroke-linecap="round"/><circle cx="16" cy="-7" r="2.6" fill="#e9c3a6"/>` +
      `<path d="M 19 -12 q 4 2 2 6 M 22 -15 q 5 3 3 8" stroke="#22a06b" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : "";
    const arm = o.kind === "officer" || o.kind === "patrol" ? `<path d="M 7 0 L 14 -4" stroke="${coat}" stroke-width="3.2" stroke-linecap="round"/>` +
      (o.kind === "patrol" ? `<g transform="translate(16 -7)"><line x1="0" y1="0" x2="0" y2="6" stroke="#555" stroke-width="1.2"/><circle r="4.6" fill="#fff" stroke="#d81e1e" stroke-width="1.8"/></g>` : "") : "";
    const body = `<g transform="translate(${f1(o.x)} ${f1(o.y)}) rotate(${rot}) scale(${s})">
      <ellipse cx="1.5" cy="2.5" rx="9" ry="6" fill="#000" opacity="0.15"/>
      <ellipse cx="0" cy="0" rx="8.5" ry="5.2" fill="${coat}" stroke="#fff" stroke-width="0.8"/>${vest}${cane}${arm}${wave}
      <circle cx="0" cy="0.4" r="4" fill="${o.hair || "#3b2a20"}"/><circle cx="0" cy="-1.2" r="2.4" fill="#e9c3a6" opacity="${o.kind === "worker" || o.kind === "officer" ? 0 : 0.0}"/>
      ${o.kind === "worker" || o.kind === "patrol" ? `<circle cx="0" cy="0.4" r="4.2" fill="#ffd21f"/>` : o.kind === "officer" ? `<circle cx="0" cy="0.4" r="4.2" fill="#14233a"/>` : ""}</g>`;
    const walk = o.walk ? arrow([[o.x, o.y], o.walk], o.walkColor || P.ink, { width: 2.4, head: 7, halo: true }) : "";
    return walk + body;
  }
  function moose(x, y, rot) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot || 0})">
      <ellipse cx="2" cy="3" rx="9" ry="20" fill="#000" opacity="0.15"/>
      <ellipse cx="0" cy="2" rx="8.5" ry="18" fill="#5a4030"/><ellipse cx="0" cy="-19" rx="4.5" ry="7" fill="#4a3426"/>
      <path d="M -3 -22 Q -12 -26 -14 -32 M -9 -26 L -12 -22 M 3 -22 Q 12 -26 14 -32 M 9 -26 L 12 -22" stroke="#8a6a50" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
  }
  function horse(x, y, rot, rider) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot || 0})">
      <ellipse cx="2" cy="3" rx="8" ry="22" fill="#000" opacity="0.15"/>
      <ellipse cx="0" cy="3" rx="7.5" ry="17" fill="#8a5a36"/><ellipse cx="0" cy="-17" rx="3.6" ry="8" fill="#7a4c2c"/>
      <path d="M 0 20 Q 2 27 -1 31" stroke="#3a2618" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${rider ? `<ellipse cx="0" cy="2" rx="7.5" ry="4.6" fill="${rider}"/><circle cx="0" cy="2.4" r="3.6" fill="#ffd21f"/>` : ""}</g>`;
  }
  function sheep(x, y, rot) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot || 0})"><ellipse cx="1.5" cy="2" rx="8" ry="11" fill="#000" opacity="0.15"/>` +
      `<g fill="#f6f4ef">${[[-4, -3], [4, -3], [-4, 5], [4, 5], [0, 1], [0, -6], [0, 8]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="4.6"/>`).join("")}</g>` +
      `<ellipse cx="0" cy="-12" rx="3.4" ry="4.4" fill="#2f2a26"/></g>`;
  }
  /* Любой участник по описанию: машины, люди, животные, конусы, аварийный треугольник */
  const PEOPLE = ["adult", "child", "cane", "worker", "officer", "patrol"];
  function actor(a) {
    if (PEOPLE.indexOf(a.kind) >= 0) return person(a);
    if (a.kind === "moose") return moose(a.x, a.y, a.rot);
    if (a.kind === "horse") return horse(a.x, a.y, a.rot, a.rider);
    if (a.kind === "sheep") return sheep(a.x, a.y, a.rot);
    if (a.kind === "cone") return cone(a.x, a.y);
    if (a.kind === "arrow") return arrow(a.pts, a.color || P.you, a.opts);
    if (a.kind === "post") return `<g transform="translate(${f1(a.x)} ${f1(a.y)})"><ellipse cx="2" cy="2" rx="4" ry="2" fill="#000" opacity="0.2"/><rect x="-3" y="-22" width="6" height="22" rx="1.5" fill="#fff" stroke="#9aa3ac" stroke-width="0.8"/><rect x="-3" y="-17" width="6" height="5" fill="#1d1f24"/><rect x="-1.5" y="-16" width="3" height="3" fill="#f5a623"/></g>`;
    if (a.kind === "crash") return `<g transform="translate(${f1(a.x)} ${f1(a.y)})"><polygon points="0,-12 3,-4 11,-6 6,1 12,7 3,6 0,13 -3,6 -12,7 -6,1 -11,-6 -3,-4" fill="#ffd21f" stroke="#e0483a" stroke-width="1.6" stroke-linejoin="round"/></g>`;
    if (a.kind === "note") return `<g transform="translate(${f1(a.x)} ${f1(a.y)}) rotate(${a.rot || 0})"><rect x="-6" y="-4.5" width="12" height="9" rx="1" fill="#fffbe6" stroke="#c9b458" stroke-width="0.8"/><path d="M -4 -1.5 L 4 -1.5 M -4 1 L 3 1" stroke="#6b7480" stroke-width="0.8"/></g>`;
    if (a.kind === "triangle") return `<g transform="translate(${f1(a.x)} ${f1(a.y)}) rotate(${a.rot || 0})"><polygon points="0,-10 9,7 -9,7" fill="#fff" stroke="#e0231a" stroke-width="3.2" stroke-linejoin="round"/></g>`;
    return vehicle(a);
  }
  function cone(x, y) {
    return `<g transform="translate(${f1(x)} ${f1(y)})"><circle cx="1" cy="1.5" r="6" fill="#000" opacity="0.15"/><circle r="6" fill="#f26b1d"/><circle r="3.6" fill="#fff"/><circle r="1.8" fill="#f26b1d"/></g>`;
  }
  function tree(x, y, r) {
    r = r || 13;
    return `<g transform="translate(${f1(x)} ${f1(y)})"><circle cx="3" cy="4" r="${r}" fill="#000" opacity="0.10"/><circle r="${r}" fill="${P.tree}"/>` +
      `<circle cx="${-r * 0.3}" cy="${-r * 0.3}" r="${r * 0.55}" fill="${P.tree2}" opacity="0.7"/></g>`;
  }
  function house(x, y, w, h) {
    return `<g><rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" fill="#000" opacity="0.10"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.roof}"/>` +
      `<path d="M ${x} ${y} L ${x + w / 2} ${y + h / 2} L ${x + w} ${y} M ${x} ${y + h} L ${x + w / 2} ${y + h / 2} L ${x + w} ${y + h}" stroke="${P.roof2}" stroke-width="1.5" fill="none"/></g>`;
  }

  /* ---------- Стрелки пути ----------
     pts: массив точек; углы сглаживаются. opts: { dash, width, head, halo } */
  function smoothPath(pts, r) {
    if (pts.length === 2) return `M ${pts[0].map(f1).join(" ")} L ${pts[1].map(f1).join(" ")}`;
    let d = `M ${pts[0].map(f1).join(" ")}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
      const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
      const k1 = Math.min(r, l1 / 2) / l1, k2 = Math.min(r, l2 / 2) / l2;
      const p1 = [b[0] - (b[0] - a[0]) * k1, b[1] - (b[1] - a[1]) * k1], p2 = [b[0] + (c[0] - b[0]) * k2, b[1] + (c[1] - b[1]) * k2];
      d += ` L ${p1.map(f1).join(" ")} Q ${b.map(f1).join(" ")} ${p2.map(f1).join(" ")}`;
    }
    return d + ` L ${pts[pts.length - 1].map(f1).join(" ")}`;
  }
  function arrow(pts, color, opts) {
    const o = opts || {}, w = o.width || 4.2, head = o.head || 13;
    const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    const a = ang(prev, last);
    /* линия заканчивается под наконечником */
    const end = [last[0] - Math.cos(rad(a)) * head * 0.6, last[1] - Math.sin(rad(a)) * head * 0.6];
    const d = smoothPath(pts.slice(0, -1).concat([end]), o.radius || 34);
    const tip = `<polygon points="0,${-head * 0.62} ${head},0 0,${head * 0.62}" fill="${color}" transform="translate(${f1(last[0] - Math.cos(rad(a)) * head * 0.85)} ${f1(last[1] - Math.sin(rad(a)) * head * 0.85)}) rotate(${f1(a)})"/>`;
    const halo = o.halo === false ? "" : `<path d="${d}" stroke="#fff" stroke-width="${w + 4}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>` +
      `<polygon points="0,${-head * 0.62 - 2.5} ${head + 3},0 0,${head * 0.62 + 2.5}" fill="#fff" opacity="0.5" transform="translate(${f1(last[0] - Math.cos(rad(a)) * (head * 0.85 + 1.5))} ${f1(last[1] - Math.sin(rad(a)) * (head * 0.85 + 1.5))}) rotate(${f1(a)})"/>`;
    const dash = o.dash ? ` stroke-dasharray="${o.dash}"` : "";
    return `<g opacity="${o.opacity || 0.92}">${halo}<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${dash}/>${tip}</g>`;
  }

  /* ---------- Знаки ----------
     Настоящие картинки знаков сайта (img/signs) + рисованные: скорость, временная скорость, остановка, rasteplass, андреевский крест */
  const SIGN_FILE = {
    yield: "warning-crossroad-give-way", stop: "warning-crossroad-stop", priority: "information-priority-road",
    priorityEnd: "information-priority-road-end", gangfelt: "information-crossing-pedestrian", roundabout: "mandatory-direction-roundabout",
    motorway: "information-motorway", gatetun: "information-residential-area", gagate: "information-pedestrian-zone",
    tunnel: "warning-tunnel", moose: "warning-animal-moose", children: "warning-children", rail: "warning-train-crossing",
    railBarrier: "warning-train-crossing-barriers", roadwork: "warning-roadworks", narrowYield: "prohibited-road-narrowing",
    narrowPrio: "information-road-narrowing", parking: "information-parking", noParking: "prohibited-parking",
    noStopping: "prohibited-parking-stopping", horse: "warning-horsemen", descent: "warning-steep-descent",
    slippery: "warning-slippery-road", lightsAhead: "warning-traffic-lights", tram: "warning-tram", cyclist: "warning-cyclist",
    noOvertaking: "prohibited-action-overtaking", crossingAhead: "warning-pedestrian-crossing", priorityCross: "warning-crossroad-side-roads",
    lowSun: "warning", oneway: "information-one-way-traffic", queue: "warning-traffic-que"
  };
  function signArt(kind, s) {
    const m = /^(speed|temp):(\d+)$/.exec(kind);
    if (m) {
      const n = m[2], fs = n.length > 2 ? 0.36 : 0.44;
      const bg = m[1] === "temp" ? `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="2" fill="#f5d800"/>` : "";
      return `${bg}<circle r="${s * 0.46}" fill="#fff" stroke="#e2231a" stroke-width="${s * 0.11}"/>` +
        `<text y="${s * 0.16}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="${s * fs}" fill="#111">${n}</text>`;
    }
    if (kind === "bus") return `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="2" fill="#f5d800" stroke="#111" stroke-width="1"/>` +
      `<rect x="${-s * 0.3}" y="${-s * 0.24}" width="${s * 0.6}" height="${s * 0.4}" rx="${s * 0.06}" fill="#111"/><rect x="${-s * 0.24}" y="${-s * 0.18}" width="${s * 0.48}" height="${s * 0.14}" fill="#f5d800"/>` +
      `<circle cx="${-s * 0.17}" cy="${s * 0.2}" r="${s * 0.07}" fill="#111"/><circle cx="${s * 0.17}" cy="${s * 0.2}" r="${s * 0.07}" fill="#111"/>`;
    if (kind === "rest") return `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="2" fill="#1b5bc7"/>` +
      `<path d="M ${-s * 0.3} ${s * 0.2} L ${s * 0.3} ${s * 0.2} M ${-s * 0.22} ${s * 0.2} L ${-s * 0.22} 0 M ${s * 0.22} ${s * 0.2} L ${s * 0.22} 0 M ${-s * 0.34} 0 L ${s * 0.34} 0 M ${-s * 0.12} 0 L ${-s * 0.12} ${-s * 0.18} M ${s * 0.12} 0 L ${s * 0.12} ${-s * 0.18} M ${-s * 0.24} ${-s * 0.18} L ${s * 0.24} ${-s * 0.18}" stroke="#fff" stroke-width="${s * 0.07}" fill="none"/>`;
    if (kind === "cross") return `<g stroke-linecap="butt"><path d="M ${-s * 0.42} ${-s * 0.32} L ${s * 0.42} ${s * 0.32} M ${-s * 0.42} ${s * 0.32} L ${s * 0.42} ${-s * 0.32}" stroke="#d81e1e" stroke-width="${s * 0.2}"/>` +
      `<path d="M ${-s * 0.42} ${-s * 0.32} L ${s * 0.42} ${s * 0.32} M ${-s * 0.42} ${s * 0.32} L ${s * 0.42} ${-s * 0.32}" stroke="#fff" stroke-width="${s * 0.07}" stroke-dasharray="${s * 0.12} ${s * 0.12}"/></g>`;
    if (kind === "chains") return `<circle r="${s * 0.47}" fill="#1b5bc7"/><circle r="${s * 0.27}" fill="none" stroke="#fff" stroke-width="${s * 0.1}"/>` +
      Array.from({ length: 8 }, (_, i) => `<rect x="${-s * 0.05}" y="${-s * 0.37}" width="${s * 0.1}" height="${s * 0.2}" rx="${s * 0.03}" fill="#fff" transform="rotate(${i * 45})"/>`).join("");
    const file = SIGN_FILE[kind];
    if (!file) return "";
    return `<image href="img/signs/${file}.png" x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  /* Знак на столбике; (x,y) — точка установки у дороги, сам щит рисуется чуть выше */
  function sign(kind, x, y, size, under) {
    const s = size || 26, uh = under ? s * 0.5 : 0;
    const plate = under ? `<image href="img/signs/${under}.png" x="${-s / 2}" y="${-s * 0.55 - uh}" width="${s}" height="${uh}" preserveAspectRatio="xMidYMid meet"/>` : "";
    return `<g transform="translate(${f1(x)} ${f1(y)})"><ellipse cx="2" cy="2" rx="4" ry="2" fill="#000" opacity="0.18"/>` +
      `<line x1="0" y1="0" x2="0" y2="${-s * 0.55}" stroke="#6b7480" stroke-width="2.2"/>${plate}` +
      `<g transform="translate(0 ${-s * 0.55 - uh - s / 2})">${signArt(kind, s)}</g></g>`;
  }
  /* Светофор: state red | yellow | green | redyellow | flash (мигающий жёлтый) | off */
  function light(x, y, state, opts) {
    const o = opts || {}, s = o.scale || 1;
    const on = c => state === c || (state === "redyellow" && (c === "red" || c === "yellow"));
    const lamp = (cy, c, col, dim) => {
      const lit = on(c) || (state === "flash" && c === "yellow");
      return `<circle cx="0" cy="${cy}" r="4.3" fill="${lit ? col : dim}">${state === "flash" && c === "yellow" ? `<animate attributeName="opacity" values="1;1;0.15;0.15" dur="1.1s" repeatCount="indefinite"/>` : ""}</circle>` +
        (lit ? `<circle cx="0" cy="${cy}" r="8" fill="${col}" opacity="0.28">${state === "flash" ? `<animate attributeName="opacity" values="0.3;0.3;0;0" dur="1.1s" repeatCount="indefinite"/>` : ""}</circle>` : "");
    };
    if (o.ped) return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})"><rect x="-6.5" y="-15" width="13" height="30" rx="3" fill="#1f2630"/>` +
      `<rect x="-4.5" y="-13" width="9" height="12" rx="1.5" fill="${state === "red" ? "#e2231a" : "#3a1c1c"}"/><rect x="-4.5" y="1" width="9" height="12" rx="1.5" fill="${state === "green" ? "#22c55e" : "#173322"}"/></g>`;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})"><ellipse cx="2" cy="20" rx="5" ry="2" fill="#000" opacity="0.2"/>` +
      `<line x1="0" y1="14" x2="0" y2="20" stroke="#6b7480" stroke-width="2.2"/>` +
      `<rect x="-7" y="-17" width="14" height="32" rx="4" fill="#1f2630"/>` +
      lamp(-8.5, "red", "#ff3b2a", "#4a1d1a") + lamp(0, "yellow", "#ffc21a", "#4a3d14") + lamp(8.5, "green", "#25d366", "#163a24") + `</g>`;
  }
  /* Табличка-подпись на схеме (например, «MØTEPLASS», «P») */
  function tag(text, x, y, opts) {
    const o = opts || {}, fs = o.size || 9, w = text.length * fs * 0.68 + 12;
    return `<g transform="translate(${f1(x)} ${f1(y)})"><rect x="${-w / 2}" y="-8" width="${w}" height="16" rx="8" fill="${o.bg || "#fff"}" opacity="${o.opacity || 0.92}"/>` +
      `<text y="3.3" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="${fs}" fill="${o.color || P.ink}" >${text}</text></g>`;
  }

  /* ---------- Погода и время суток ---------- */
  function overlay(kind) {
    if (kind === "night") return `<rect width="${W}" height="${H}" fill="#0b1630" opacity="0.62"/>`;
    if (kind === "dusk") return `<rect width="${W}" height="${H}" fill="#2b2147" opacity="0.38"/>`;
    if (kind === "rain") return `<rect width="${W}" height="${H}" fill="#5c7a99" opacity="0.18"/><g stroke="#cfe3f5" stroke-width="1.3" opacity="0.75">` +
      Array.from({ length: 46 }, (_, i) => { const x = (i * 53) % 410, y = (i * 37) % 300; return `<line x1="${x}" y1="${y}" x2="${x - 5}" y2="${y + 13}"/>`; }).join("") + `</g>`;
    if (kind === "snow") return `<rect width="${W}" height="${H}" fill="#e8eef5" opacity="0.18"/><g fill="#fff">` +
      Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 67) % 400}" cy="${(i * 41) % 300}" r="${1.3 + (i % 3) * 0.6}"/>`).join("") + `</g>`;
    if (kind === "fog") return `<rect width="${W}" height="${H}" fill="#eef1f4" opacity="0.55"/>`;
    if (kind === "sun") return `<defs><radialGradient id="skSun" cx="0.5" cy="0" r="0.9"><stop offset="0" stop-color="#fff7d1" stop-opacity="0.95"/><stop offset="0.45" stop-color="#ffe9a3" stop-opacity="0.45"/><stop offset="1" stop-color="#ffe9a3" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="${W}" height="${H}" fill="url(#skSun)"/><circle cx="200" cy="10" r="26" fill="#fff6c8"/>`;
    if (kind === "frost") return `<rect width="${W}" height="${H}" fill="#eaf3fb" opacity="0.18"/>`;
    return "";
  }

  /* =====================================================================
     ПЕРЕКРЁСТОК
     cfg: { you:{from,to,lane}, others:[{from,to,kind,label,color,dist,blink}], signs:{side:kind}, lights:{side:state},
            peds:[side], arms:["north","south","east","west"], roundabout, lanes, priorityAxis, police }
     Стороны: north / south / east / west. Ты подъезжаешь снизу (south). */
  const CX = 200, CY = 150, LW = 30, RW = 60, HALFW = 30;
  const DIRS = ["north", "east", "south", "west"];
  const ROT_IN = { south: 0, north: 180, east: 270, west: 90 };     /* поворот машины на подъезде */
  const ROT_OUT = { north: 0, south: 180, east: 90, west: 270 };    /* поворот при выезде к стороне */
  /* Полоса подъезда: смещение от осевой (правостороннее) */
  function laneIn(from, dist, shift) {
    const off = HALFW / 2 + (shift || 0);
    if (from === "south") return [CX + off, CY + HALFW + dist];
    if (from === "north") return [CX - off, CY - HALFW - dist];
    if (from === "east") return [CX + HALFW + dist, CY - off];
    return [CX - HALFW - dist, CY + off];
  }
  function laneOut(to, dist, shift) {
    const off = HALFW / 2 + (shift || 0);
    if (to === "north") return [CX + off, CY - HALFW - dist];
    if (to === "south") return [CX - off, CY + HALFW + dist];
    if (to === "east") return [CX + HALFW + dist, CY + off];
    return [CX - HALFW - dist, CY - off];
  }
  function manOf(from, to) {
    const d = (DIRS.indexOf(to) - DIRS.indexOf(from) + 4) % 4;
    return d === 2 ? "straight" : d === 3 ? "right" : d === 1 ? "left" : "u";
  }
  /* Путь через перекрёсток: подъезд → дуга → выезд */
  function junctionPath(from, to, startDist, shift) {
    const p0 = laneIn(from, startDist, shift), p1 = laneIn(from, 6, shift);
    const q1 = laneOut(to, 6, shift), q2 = laneOut(to, from === "south" || to === "north" || to === "south" ? 104 : 150, shift);
    const man = manOf(from, to);
    if (man === "straight") return [p0, q2];
    /* точка излома для поворота — пересечение осей полос */
    const corner = (from === "south" || from === "north") ? [p1[0], q1[1]] : [q1[0], p1[1]];
    return [p0, p1, corner, q1, q2];
  }
  function roundaboutPathPts(from, to, R, shift) {
    const A = { south: 90, east: 0, north: -90, west: 180 };
    const p0 = laneIn(from, 78, shift);
    const a1 = A[from] - 26;
    let a2 = A[to] + 26;
    while (a2 >= a1 - 8) a2 -= 360;
    const pts = [p0, laneIn(from, 34 + 8, shift)];
    for (let t = a1; t >= a2; t -= 14) pts.push([CX + R * Math.cos(rad(t)), CY + R * Math.sin(rad(t))]);
    pts.push(laneOut(to, 44), laneOut(to, to === "north" || to === "south" ? 104 : 150));
    return pts;
  }

  function junctionBase(cfg) {
    const arms = cfg.arms || DIRS;
    const has = d => arms.indexOf(d) >= 0;
    let g = "";
    /* кварталы по углам: тротуар + газон, дома и деревья */
    const WALK = 16;
    const quads = [[0, 0, -1, -1], [CX + HALFW, 0, 1, -1], [0, CY + HALFW, -1, 1], [CX + HALFW, CY + HALFW, 1, 1]];
    /* сплошные полосы тротуара вдоль дорог */
    if (has("north") || has("south")) g += `<rect x="${CX - HALFW - WALK}" y="${has("north") ? 0 : CY - HALFW - WALK}" width="${RW + WALK * 2}" height="${(has("south") ? H : CY + HALFW + WALK) - (has("north") ? 0 : CY - HALFW - WALK)}" fill="${P.walk}"/>`;
    g += `<rect x="${has("west") ? 0 : CX - HALFW - WALK}" y="${CY - HALFW - WALK}" width="${(has("east") ? W : CX + HALFW + WALK) - (has("west") ? 0 : CX - HALFW - WALK)}" height="${RW + WALK * 2}" fill="${P.walk}"/>`;
    /* декор кварталов */
    g += tree(60, 52, 15) + tree(112, 34, 11) + house(250, 20, 52, 38) + tree(340, 56, 14) + tree(44, 250, 13) + house(80, 222, 46, 40) + tree(300, 250, 15) + house(330, 214, 44, 34);
    /* асфальт */
    if (has("north")) g += `<rect x="${CX - HALFW}" y="0" width="${RW}" height="${CY}" fill="${P.asph}"/>`;
    if (has("south")) g += `<rect x="${CX - HALFW}" y="${CY}" width="${RW}" height="${H - CY}" fill="${P.asph}"/>`;
    if (has("west")) g += `<rect x="0" y="${CY - HALFW}" width="${CX}" height="${RW}" fill="${P.asph}"/>`;
    if (has("east")) g += `<rect x="${CX}" y="${CY - HALFW}" width="${W - CX}" height="${RW}" fill="${P.asph}"/>`;
    g += `<rect x="${CX - HALFW}" y="${CY - HALFW}" width="${RW}" height="${RW}" fill="${P.asph}"/>`;
    /* скруглённые углы бордюра */
    const R = 14;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      const vx = sx < 0 ? "west" : "east", vy = sy < 0 ? "north" : "south";
      if (!has(vx) || !has(vy)) return;
      const x = CX + sx * HALFW, y = CY + sy * HALFW;
      g += `<path d="M ${x} ${y + sy * R} Q ${x} ${y} ${x + sx * R} ${y} L ${x} ${y} Z" fill="${P.asph}"/>` +
        `<path d="M ${x} ${y + sy * (R + 1)} L ${x} ${y + sy * R} Q ${x} ${y} ${x + sx * R} ${y} " fill="none" stroke="${P.curb}" stroke-width="1"/>`;
    });
    /* края асфальта (бордюр) */
    const edge = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${P.curb}" stroke-width="2"/>`;
    if (has("north")) g += edge(CX - HALFW, 0, CX - HALFW, CY - HALFW) + edge(CX + HALFW, 0, CX + HALFW, CY - HALFW);
    if (has("south")) g += edge(CX - HALFW, CY + HALFW, CX - HALFW, H) + edge(CX + HALFW, CY + HALFW, CX + HALFW, H);
    if (has("west")) g += edge(0, CY - HALFW, CX - HALFW, CY - HALFW) + edge(0, CY + HALFW, CX - HALFW, CY + HALFW);
    if (has("east")) g += edge(CX + HALFW, CY - HALFW, W, CY - HALFW) + edge(CX + HALFW, CY + HALFW, W, CY + HALFW);
    if (!has("north")) g += edge(CX - HALFW, CY - HALFW, CX + HALFW, CY - HALFW);
    if (!has("south")) g += edge(CX - HALFW, CY + HALFW, CX + HALFW, CY + HALFW);
    if (!has("west")) g += edge(CX - HALFW, CY - HALFW, CX - HALFW, CY + HALFW);
    if (!has("east")) g += edge(CX + HALFW, CY - HALFW, CX + HALFW, CY + HALFW);
    /* осевые — жёлтый пунктир (двустороннее движение), до перекрёстка */
    const dash = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${P.yellow}" stroke-width="2.4" stroke-dasharray="12 9"/>`;
    if (has("north")) g += dash(CX, 0, CX, CY - HALFW - 4);
    if (has("south")) g += dash(CX, CY + HALFW + 4, CX, H);
    if (has("west")) g += dash(0, CY, CX - HALFW - 4, CY);
    if (has("east")) g += dash(CX + HALFW + 4, CY, W, CY);
    return g;
  }

  /* Разметка у въезда: стоп-линия (stop/свет), «зубы» (yield) */
  function armMarking(side, kind, edgeD) {
    const L = P.line, E = edgeD || HALFW;
    if (kind === "stop" || kind === "light") {
      if (side === "south") return `<rect x="${CX}" y="${CY + E + 8}" width="${HALFW}" height="4" fill="${L}"/>`;
      if (side === "north") return `<rect x="${CX - HALFW}" y="${CY - E - 12}" width="${HALFW}" height="4" fill="${L}"/>`;
      if (side === "east") return `<rect x="${CX + E + 8}" y="${CY - HALFW}" width="4" height="${HALFW}" fill="${L}"/>`;
      return `<rect x="${CX - E - 12}" y="${CY}" width="4" height="${HALFW}" fill="${L}"/>`;
    }
    if (kind === "yield") {
      const teeth = [];
      for (let i = 0; i < 4; i++) {
        const t = 3 + i * 7;
        if (side === "south") teeth.push(`<polygon points="${CX + t},${CY + E + 14} ${CX + t + 5},${CY + E + 14} ${CX + t + 2.5},${CY + E + 7}" fill="${L}"/>`);
        if (side === "north") teeth.push(`<polygon points="${CX - t},${CY - E - 14} ${CX - t - 5},${CY - E - 14} ${CX - t - 2.5},${CY - E - 7}" fill="${L}"/>`);
        if (side === "east") teeth.push(`<polygon points="${CX + E + 14},${CY - t} ${CX + E + 14},${CY - t - 5} ${CX + E + 7},${CY - t - 2.5}" fill="${L}"/>`);
        if (side === "west") teeth.push(`<polygon points="${CX - E - 14},${CY + t} ${CX - E - 14},${CY + t + 5} ${CX - E - 7},${CY + t + 2.5}" fill="${L}"/>`);
      }
      return teeth.join("");
    }
    return "";
  }
  /* Зебра на рукаве (полосы вдоль дороги), сразу за перекрёстком */
  function zebraOnArm(side) {
    const bars = [];
    for (let i = 0; i < 6; i++) {
      const t = -HALFW + 4 + i * 9.6;
      if (side === "north") bars.push(`<rect x="${CX + t}" y="${CY - HALFW - 30}" width="5.4" height="18" fill="${P.line}"/>`);
      if (side === "south") bars.push(`<rect x="${CX + t}" y="${CY + HALFW + 12}" width="5.4" height="18" fill="${P.line}"/>`);
      if (side === "east") bars.push(`<rect x="${CX + HALFW + 12}" y="${CY + t}" width="18" height="5.4" fill="${P.line}"/>`);
      if (side === "west") bars.push(`<rect x="${CX - HALFW - 30}" y="${CY + t}" width="18" height="5.4" fill="${P.line}"/>`);
    }
    return bars.join("");
  }
  /* где стоят знак / светофор для подъезда с этой стороны (справа от водителя, на тротуаре) */
  const SIGN_AT = { south: [CX + HALFW + 10, CY + HALFW + 48], north: [CX - HALFW - 10, CY - HALFW - 6], east: [CX + HALFW + 52, CY - HALFW - 6], west: [CX - HALFW - 46, CY + HALFW + 34] };
  const LIGHT_AT = { south: [CX + HALFW + 9, CY + HALFW + 30], north: [CX - HALFW - 9, CY - HALFW - 32], east: [CX + HALFW + 30, CY - HALFW - 12], west: [CX - HALFW - 30, CY + HALFW + 12] };
  const PED_AT = { north: [CX + HALFW + 8, CY - HALFW - 21, 270], south: [CX - HALFW - 8, CY + HALFW + 21, 90], east: [CX + HALFW + 21, CY + HALFW + 8, 0], west: [CX - HALFW - 21, CY - HALFW - 8, 180] };

  function junction(cfg) {
    if (cfg.roundabout) return roundabout(cfg);
    let base = junctionBase(cfg), marks = "", furniture = "", paths = "", cars = "";
    const signs = cfg.signs || {}, lights = cfg.lights || {};
    DIRS.forEach(side => {
      if (signs[side]) { marks += armMarking(side, signs[side] === "stop" ? "stop" : signs[side] === "yield" ? "yield" : ""); furniture += sign(signs[side], SIGN_AT[side][0], SIGN_AT[side][1], 26); }
      if (lights[side]) { marks += armMarking(side, "light"); furniture += light(LIGHT_AT[side][0], LIGHT_AT[side][1], lights[side]); }
    });
    (cfg.peds || []).forEach(side => {
      marks += zebraOnArm(side);
      const [x, y, r] = PED_AT[side];
      const to = side === "north" || side === "south" ? [CX + (side === "north" ? -HALFW + 6 : HALFW - 6), y] : [x, CY + (side === "east" ? -HALFW + 6 : HALFW - 6)];
      furniture += person({ x: side === "north" ? CX + HALFW - 12 : side === "south" ? CX - HALFW + 12 : x, y: side === "east" ? CY + HALFW - 12 : side === "west" ? CY - HALFW + 12 : y, rot: r, walk: to, color: "#6b4fa0" });
    });
    const list = [Object.assign({ label: "A", color: P.you }, cfg.you)].concat((cfg.others || []).map((o, i) => Object.assign({ label: String.fromCharCode(66 + i), color: o.kind === "bike" || o.kind === "scooter" ? P.green : OTHER[i % OTHER.length] }, o)));
    list.forEach((v, idx) => {
      const small = v.kind === "bike" || v.kind === "scooter";
      const shift = small ? 9 : 0;
      const dist = v.dist != null ? v.dist : (v.kind === "truck" || v.kind === "bus" ? 70 : v.kind === "tram" ? 82 : v.from === "south" ? (idx === 0 ? 62 : 104) : v.from === "north" ? 52 : 92);
      const pts = junctionPath(v.from, v.to, dist, shift);
      const man = manOf(v.from, v.to);
      paths += arrow(pts, v.color);
      const [x, y] = pts[0];
      cars += vehicle({ x, y, rot: ROT_IN[v.from], kind: v.kind, color: v.kind === "tram" || v.kind === "bus" ? undefined : v.color, label: v.label,
        blink: v.blink !== undefined ? v.blink : man === "left" ? "left" : man === "right" ? "right" : null, brake: v.brake, badgeColor: v.color });
    });
    if (cfg.police) furniture += person({ x: CX - 4, y: CY + 2, rot: 0, kind: "officer" });
    return svg(base + railsFor(cfg) + marks + paths + furniture + extras(cfg) + cars + overlay(cfg.weather) + tagsFor(cfg), { label: cfg.alt });
  }

  /* трамвайные рельсы через перекрёсток: "ns" (север–юг) или "ew" (запад–восток) */
  function railsFor(cfg) {
    if (!cfg.rails) return "";
    return cfg.rails === "ns"
      ? `<g stroke="#a7afb8" stroke-width="2"><line x1="${CX - 8}" y1="0" x2="${CX - 8}" y2="${H}"/><line x1="${CX + 8}" y1="0" x2="${CX + 8}" y2="${H}"/></g>`
      : `<g stroke="#a7afb8" stroke-width="2"><line x1="0" y1="${CY - 8}" x2="${W}" y2="${CY - 8}"/><line x1="0" y1="${CY + 8}" x2="${W}" y2="${CY + 8}"/></g>`;
  }
  /* дополнительные участники в любых точках: [{ kind, x, y, rot, label, color, path, blink }] */
  function extras(cfg) {
    return (cfg.extra || []).map(a => (a.path ? arrow([[a.x, a.y]].concat(a.path), a.pathColor || a.color || P.red, a.pathOpts) : "") + actor(a)).join("");
  }
  function tagsFor(cfg) { return (cfg.tags || []).map(t => tag(t.text, t.x, t.y, t)).join(""); }

  function roundabout(cfg) {
    const two = cfg.lanes === 2;
    const RO = two ? 98 : 84, RI = two ? 40 : 50, RIN = RI + 6, MID = (RO + RIN) / 2;
    const rOut = two ? (RO + MID) / 2 : MID, rIn = two ? (MID + RIN) / 2 : MID;
    const ANG = { south: 90, east: 0, north: -90, west: 180 };
    let g = junctionBase(Object.assign({}, cfg));
    /* двухполосный кольцевой: въезд с юга расширен до двух полос */
    if (two) g += `<rect x="${CX + HALFW}" y="${CY}" width="30" height="${H - CY}" fill="${P.asph}"/>` +
      `<rect x="${CX + HALFW + 30}" y="${CY}" width="16" height="${H - CY}" fill="${P.walk}"/>` +
      `<line x1="${CX + HALFW + 30}" y1="${CY}" x2="${CX + HALFW + 30}" y2="${H}" stroke="${P.curb}" stroke-width="2"/>`;
    g += `<circle cx="${CX}" cy="${CY}" r="${RO}" fill="${P.asph}"/>`;
    g += `<circle cx="${CX}" cy="${CY}" r="${RIN}" fill="${P.walk}"/><circle cx="${CX}" cy="${CY}" r="${RI}" fill="${P.grass2}"/>` + tree(CX - 8, CY - 6, 11) + tree(CX + 12, CY + 8, 8);
    if (two) g += `<circle cx="${CX}" cy="${CY}" r="${MID}" fill="none" stroke="${P.line}" stroke-width="2" stroke-dasharray="10 9" opacity="0.9"/>` +
      `<line x1="${CX + HALFW}" y1="${CY + Math.sqrt(RO * RO - 60 * 60) + 4}" x2="${CX + HALFW}" y2="${H}" stroke="${P.line}" stroke-width="2" stroke-dasharray="12 10"/>`;
    /* островки-разделители на въездах */
    DIRS.forEach(d => {
      const a = ANG[d], x = CX + (RO + 20) * Math.cos(rad(a)), y = CY + (RO + 20) * Math.sin(rad(a));
      g += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a + 90})"><path d="M -3 -13 L 3 -13 L 1.5 13 L -1.5 13 Z" fill="${P.walk}" stroke="${P.curb}" stroke-width="1"/></g>`;
    });
    let marks = "", furniture = "";
    const ringEdge = Math.sqrt(RO * RO - HALFW * HALFW);
    DIRS.forEach(d => { marks += armMarking(d, "yield", d === "south" && two ? Math.sqrt(RO * RO - 60 * 60) : ringEdge); });
    if (two) marks += armMarking("south", "yield", Math.sqrt(RO * RO - 60 * 60)).replace(/points="([^"]+)"/g, (m, pts) => `points="${pts.split(" ").map(p => { const [x, y] = p.split(","); return `${+x + 30},${y}`; }).join(" ")}"`);
    const sx = CX + HALFW + (two ? 42 : 12), sy = Math.min(H - 8, CY + ringEdge + 54);
    furniture += sign("yield", sx, sy, 24) + sign("roundabout", sx + 26, sy, 24);
    const lights = cfg.lights || {};
    DIRS.forEach(side => { if (lights[side]) { marks += armMarking(side, "light", ringEdge + 10); furniture += light(sx - 2, CY + ringEdge + 28, lights[side]); } });

    /* путь машины: въезд (или уже на кольце) → по кольцу против часовой → выезд */
    function ringPath(v) {
      const inner = v.lane === "left", r = inner ? rIn : rOut;
      const shift = two && v.from === "south" && !inner ? 30 : 0;
      const pts = [];
      let a1;
      if (v.onRing) a1 = v.at != null ? v.at : ANG[v.from] - 12;
      else {
        pts.push(laneIn(v.from, v.dist || (two ? 92 : 78), shift), laneIn(v.from, two ? 44 : 36, shift));
        a1 = ANG[v.from] - (inner ? 18 : 30);
      }
      let a2 = ANG[v.to] + (inner ? 20 : 30);
      while (a2 >= a1 - 6) a2 -= 360;
      for (let t = a1; t > a2; t -= 12) pts.push([CX + r * Math.cos(rad(t)), CY + r * Math.sin(rad(t))]);
      pts.push([CX + r * Math.cos(rad(a2)), CY + r * Math.sin(rad(a2))]);
      pts.push(laneOut(v.to, two ? 50 : 40), laneOut(v.to, v.to === "north" || v.to === "south" ? 112 : 160));
      return { pts, r };
    }
    let paths = "", cars = "", youR = rOut;
    const list = [Object.assign({ label: "A", color: P.you, you: true }, cfg.you)].concat((cfg.others || []).map((o, i) =>
      Object.assign({ label: String.fromCharCode(66 + i), color: o.kind === "bike" ? P.green : OTHER[i % OTHER.length], onRing: o.onRing !== false && !o.entering }, o)));
    list.forEach(v => {
      const { pts, r } = ringPath(v);
      if (v.you) youR = r;
      paths += arrow(pts, v.color, { radius: 18 });
      const heading = ang(pts[0], pts[1]) + 90;
      const man = manOf(v.from, v.to);
      cars += vehicle({ x: pts[0][0], y: pts[0][1], rot: v.onRing ? heading : ROT_IN[v.from], kind: v.kind, color: v.kind === "truck" || v.kind === "bike" ? v.color : v.color, label: v.label, badgeColor: v.color,
        blink: v.blink !== undefined ? v.blink : (!v.onRing && man === "right" ? "right" : null) });
    });
    (cfg.peds || []).forEach(side => {
      const d = ringEdge + 24, bars = [];
      for (let i = 0; i < 6; i++) {
        const t = -HALFW + 4 + i * 9.6;
        if (side === "north") bars.push(`<rect x="${CX + t}" y="${CY - d - 18}" width="5.4" height="18" fill="${P.line}"/>`);
        if (side === "east") bars.push(`<rect x="${CX + d}" y="${CY + t}" width="18" height="5.4" fill="${P.line}"/>`);
        if (side === "west") bars.push(`<rect x="${CX - d - 18}" y="${CY + t}" width="18" height="5.4" fill="${P.line}"/>`);
      }
      marks += bars.join("");
      if (side === "north") furniture += person({ x: CX + HALFW - 9, y: CY - d - 9, rot: 270, walk: [CX - 4, CY - d - 9], color: "#6b4fa0" });
      if (side === "east") furniture += person({ x: CX + d + 9, y: CY + HALFW - 9, rot: 0, walk: [CX + d + 9, CY + 2], color: "#6b4fa0" });
      if (side === "west") furniture += person({ x: CX - d - 9, y: CY - HALFW + 9, rot: 180, walk: [CX - d - 9, CY - 2], color: "#6b4fa0" });
    });
    if (cfg.blinkAt != null) {
      const t = cfg.blinkAt, bx = CX + youR * Math.cos(rad(t)), by = CY + youR * Math.sin(rad(t));
      furniture += `<g transform="translate(${f1(bx)} ${f1(by)})"><circle r="11" fill="${P.amber}" opacity="0.35"><animate attributeName="r" values="7;15;7" dur="1.2s" repeatCount="indefinite"/></circle><circle r="5.5" fill="${P.amber}" stroke="#fff" stroke-width="1.6"/></g>`;
    }
    return svg(g + marks + paths + furniture + extras(cfg) + cars + overlay(cfg.weather) + tagsFor(cfg), { label: cfg.alt });
  }

  /* =====================================================================
     ПРЯМАЯ ДОРОГА (вид сверху, ты едешь снизу вверх)
     cfg: {
       lanes: ["down","up"] (по умолчанию) — слева направо; "up" = в твою сторону
       center: "dashed" | "solid" | "warn" | "double" | "none"
       sides: { left: "walk"|"grass"|"shoulder"|"snow", right: ... }
       laneW: ширина полосы (30)
       features: [...]  — см. featureFns
       actors: [...]   — машины/люди: { kind, lane | x, y, rot, label, color, path:[[x,y]...], blink, brake }
       weather, alt
     } */
  function street(cfg) {
    const lanes = cfg.lanes || ["down", "up"];
    const LWs = cfg.laneW || 32;
    const width = lanes.length * LWs, x0 = Math.round(200 - width / 2 + (cfg.shift || 0)), x1 = x0 + width;
    const laneX = i => x0 + LWs * (i + 0.5);
    const firstUp = lanes.indexOf("up"), lastUp = lanes.lastIndexOf("up"), lastDown = lanes.lastIndexOf("down");
    const geo = { x0, x1, laneW: LWs, laneX, lanes,
      right: lastUp >= 0 ? laneX(lastUp) : laneX(lanes.length - 1),      /* твоя правая полоса */
      left: lastDown >= 0 ? laneX(lastDown) : laneX(0),                   /* встречная полоса (ближайшая к осевой) */
      upLeft: firstUp >= 0 ? laneX(firstUp) : laneX(0),
      center: firstUp > 0 ? x0 + LWs * firstUp : null };
    const sides = Object.assign({ left: "walk", right: "walk" }, cfg.sides || {});
    let ground = "", road = "", marks = "", over = "", furniture = "", actors = "", top = "";

    /* обочины */
    const sideStrip = (side) => {
      const kind = sides[side], dir = side === "left" ? -1 : 1, edgeX = side === "left" ? x0 : x1;
      if (kind === "walk") {
        const wx = side === "left" ? x0 - 24 : x1;
        return `<rect x="${wx}" y="0" width="24" height="${H}" fill="${P.walk}"/>` +
          Array.from({ length: 13 }, (_, i) => `<line x1="${wx}" y1="${i * 24}" x2="${wx + 24}" y2="${i * 24}" stroke="${P.walkLine}" stroke-width="1"/>`).join("") +
          `<line x1="${edgeX}" y1="0" x2="${edgeX}" y2="${H}" stroke="${P.curb}" stroke-width="2.4"/>`;
      }
      if (kind === "shoulder") {
        const sx = side === "left" ? x0 - 18 : x1;
        return `<rect x="${sx}" y="0" width="18" height="${H}" fill="#8b939c"/>`;
      }
      if (kind === "snow") {
        const sx = side === "left" ? x0 - 26 : x1;
        return `<rect x="${sx}" y="0" width="26" height="${H}" fill="#f4f7fb"/>` +
          Array.from({ length: 8 }, (_, i) => `<ellipse cx="${sx + 13 + dir * 2}" cy="${i * 40 + 18}" rx="14" ry="24" fill="#fff"/>`).join("") +
          `<line x1="${edgeX}" y1="0" x2="${edgeX}" y2="${H}" stroke="#dbe4ee" stroke-width="3"/>`;
      }
      return "";
    };
    if (!cfg.noRoad) ground += sideStrip("left") + sideStrip("right");
    /* декор по краям */
    if (cfg.decor !== false && !cfg.noRoad) {
      const lx = x0 - 60, rx = x1 + 60;
      if (sides.left === "walk") ground += house(x0 - 24 - 70, 20, 56, 44) + tree(x0 - 50, 130, 14) + house(x0 - 24 - 66, 200, 50, 54);
      else ground += tree(lx, 50, 15) + tree(lx - 30, 150, 13) + tree(lx + 10, 250, 16);
      if (sides.right === "walk") ground += house(x1 + 24 + 16, 30, 56, 44) + tree(x1 + 54, 150, 13) + house(x1 + 24 + 20, 214, 52, 50);
      else ground += tree(rx, 70, 14) + tree(rx + 32, 180, 16) + tree(rx - 6, 270, 12);
    }
    if (!cfg.noRoad) road += `<rect x="${x0}" y="0" width="${width}" height="${H}" fill="${P.asph}"/>`;
    if (cfg.noRoad) { /* только особенности и участники */ }
    else {
    /* края (белая кантлиния на трассах/за городом) */
    if (sides.left !== "walk") marks += `<line x1="${x0 + 3}" y1="0" x2="${x0 + 3}" y2="${H}" stroke="${P.line}" stroke-width="2"/>`;
    if (sides.right !== "walk") marks += `<line x1="${x1 - 3}" y1="0" x2="${x1 - 3}" y2="${H}" stroke="${P.line}" stroke-width="2"/>`;
    /* линии между полосами */
    for (let i = 1; i < lanes.length; i++) {
      const x = x0 + LWs * i;
      if (lanes[i - 1] !== lanes[i]) {
        const c = cfg.center || "dashed";
        if (c === "dashed") marks += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${P.yellow}" stroke-width="2.4" stroke-dasharray="14 10"/>`;
        if (c === "warn") marks += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${P.yellow}" stroke-width="2.4" stroke-dasharray="34 8"/>`;
        if (c === "solid") marks += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${P.yellow}" stroke-width="2.6"/>`;
        if (c === "double") marks += `<line x1="${x - 2.5}" y1="0" x2="${x - 2.5}" y2="${H}" stroke="${P.yellow}" stroke-width="2"/><line x1="${x + 2.5}" y1="0" x2="${x + 2.5}" y2="${H}" stroke="${P.yellow}" stroke-width="2"/>`;
        if (c === "dashToSolid") marks += `<line x1="${x}" y1="${cfg.solidFrom || 140}" x2="${x}" y2="${H}" stroke="${P.yellow}" stroke-width="2.4" stroke-dasharray="14 10"/><line x1="${x}" y1="0" x2="${x}" y2="${cfg.solidFrom || 140}" stroke="${P.yellow}" stroke-width="2.6"/>`;
      } else marks += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${P.line}" stroke-width="2" stroke-dasharray="12 12"/>`;
    }
    }
    /* особенности */
    (cfg.features || []).forEach(ft => {
      const fn = FEATURES[ft.type];
      if (!fn) return;
      const r = fn(ft, geo, cfg);
      ground += r.ground || ""; road += r.road || ""; marks += r.marks || ""; over += r.over || ""; furniture += r.furniture || ""; top += r.top || "";
    });
    /* участники */
    let beams = "";
    (cfg.actors || []).forEach((a, i) => {
      const x = a.x != null ? a.x : a.lane === "left" ? geo.left : a.lane === "right" || a.lane == null ? geo.right : typeof a.lane === "number" ? laneX(a.lane) : a.lane === "upLeft" ? geo.upLeft : geo.right;
      const rot = a.rot != null ? a.rot : a.lane === "left" ? 180 : 0;
      const p = Object.assign({}, a, { x, y: a.y });
      if (a.path) actors += arrow([[x, a.y]].concat(a.path), a.pathColor || a.color || P.you, a.pathOpts);
      if (a.beams) beams += beamsFor(x, a.y, rot, a.beams);
      actors += actor(Object.assign(p, { rot: PEOPLE.indexOf(a.kind) >= 0 ? (a.rot || 0) : rot }));
    });
    const night = cfg.weather === "night" || cfg.weather === "dusk";
    return svg(ground + road + marks + over + furniture + actors + overlay(cfg.weather) + (night ? beams : "") + top + tagsFor(cfg), { label: cfg.alt });
  }

  /* Особенности прямой дороги. Каждая возвращает слои { ground, road, marks, over, furniture, top } */
  const FEATURES = {
    /* пешеходный переход: { y, sign: true } */
    zebra(ft, g) {
      const y = ft.y || 130, n = Math.floor((g.x1 - g.x0 - 8) / 10);
      let marks = "";
      for (let i = 0; i < n; i++) marks += `<rect x="${g.x0 + 6 + i * 10}" y="${y - 14}" width="6" height="28" fill="${P.line}"/>`;
      const furniture = ft.sign === false ? "" : sign("gangfelt", g.x1 + 13, y - 20, 24) + sign("gangfelt", g.x0 - 13, y + 44, 24);
      return { marks, furniture };
    },
    /* поперечная дорога / T-перекрёсток: { y, side: "right"|"left"|"both", w } */
    sideRoad(ft, g) {
      const y = ft.y || 110, w = ft.w || 60, sides = ft.side === "both" ? ["left", "right"] : [ft.side || "right"];
      let road = "", marks = "";
      sides.forEach(s => {
        const xa = s === "right" ? g.x1 : 0, xb = s === "right" ? W : g.x0;
        road += `<rect x="${xa}" y="${y - w / 2 - 16}" width="${xb - xa}" height="${w + 32}" fill="${P.walk}"/><rect x="${xa}" y="${y - w / 2}" width="${xb - xa}" height="${w}" fill="${P.asph}"/>` +
          `<line x1="${xa}" y1="${y - w / 2}" x2="${xb}" y2="${y - w / 2}" stroke="${P.curb}" stroke-width="2"/><line x1="${xa}" y1="${y + w / 2}" x2="${xb}" y2="${y + w / 2}" stroke="${P.curb}" stroke-width="2"/>`;
        marks += `<line x1="${s === "right" ? g.x1 + 4 : 0}" y1="${y}" x2="${s === "right" ? W : g.x0 - 4}" y2="${y}" stroke="${P.yellow}" stroke-width="2.4" stroke-dasharray="14 10"/>`;
        if (ft.yield) for (let i = 0; i < 4; i++) { const t = 3 + i * 7; marks += s === "right"
          ? `<polygon points="${g.x1 + 16},${y - t} ${g.x1 + 16},${y - t - 5} ${g.x1 + 9},${y - t - 2.5}" fill="${P.line}"/>`
          : `<polygon points="${g.x0 - 16},${y + t} ${g.x0 - 16},${y + t + 5} ${g.x0 - 9},${y + t + 2.5}" fill="${P.line}"/>`; }
      });
      /* разрыв бордюра/тротуара в месте примыкания */
      return { road, marks, top: "" };
    },
    /* въезд/выезд через тротуар: { y, side, label: "P" | "PARKERINGSHUS" | "GATETUN", w } */
    driveway(ft, g) {
      const y = ft.y || 120, w = ft.w || 44, s = ft.side || "right";
      const xa = s === "right" ? g.x1 : 0, xb = s === "right" ? W : g.x0;
      const surf = ft.surface || "#9aa3ac";
      let road = `<rect x="${xa}" y="${y - w / 2}" width="${xb - xa}" height="${w}" fill="${surf}"/>`;
      /* тротуар поверх въезда (въезд пересекает тротуар) */
      const wx = s === "right" ? g.x1 : g.x0 - 24;
      road += `<rect x="${wx}" y="${y - w / 2}" width="24" height="${w}" fill="${P.walk}"/><line x1="${wx}" y1="${y - w / 2}" x2="${wx + 24}" y2="${y - w / 2}" stroke="${P.walkLine}"/><line x1="${wx}" y1="${y + w / 2}" x2="${wx + 24}" y2="${y + w / 2}" stroke="${P.walkLine}"/>`;
      if (ft.building) road += `<rect x="${s === "right" ? g.x1 + 40 : 0}" y="${y - w / 2 - 34}" width="${s === "right" ? W - g.x1 - 40 : g.x0 - 40}" height="${w + 68}" fill="#c3c9d0"/><rect x="${s === "right" ? g.x1 + 40 : g.x0 - 44}" y="${y - w / 2}" width="4" height="${w}" fill="#2a2f36"/>`;
      if (ft.lines) road += Array.from({ length: 4 }, (_, i) => `<line x1="${s === "right" ? g.x1 + 40 + i * 30 : g.x0 - 40 - i * 30}" y1="${y - w / 2 - 30}" x2="${s === "right" ? g.x1 + 40 + i * 30 : g.x0 - 40 - i * 30}" y2="${y - w / 2 - 4}" stroke="#fff" stroke-width="1.4" opacity="0.7"/>`).join("");
      const furniture = ft.label ? tag(ft.label, s === "right" ? Math.min(W - 40, g.x1 + 74) : Math.max(40, g.x0 - 74), y - w / 2 - 12, { bg: ft.label === "P" ? "#1b5bc7" : "#fff", color: ft.label === "P" ? "#fff" : P.ink }) : "";
      return { road, furniture };
    },
    /* велополоса у правого края: { side } */
    bikeLane(ft, g) {
      const s = ft.side || "right", w = 14, x = s === "right" ? g.x1 - w : g.x0;
      const gap = ft.gap;
      let over = `<rect x="${x}" y="0" width="${w}" height="${H}" fill="#b5543f" opacity="0.92"/>`;
      if (gap) over += `<rect x="${x}" y="${gap[0]}" width="${w}" height="${gap[1] - gap[0]}" fill="${P.asph}"/>`;
      over += `<line x1="${s === "right" ? x : x + w}" y1="0" x2="${s === "right" ? x : x + w}" y2="${H}" stroke="${P.line}" stroke-width="2" stroke-dasharray="${gap ? "10 6" : "0"}"/>`;
      over += [60, 220].map(y => `<g transform="translate(${x + w / 2} ${y})" fill="none" stroke="#fff" stroke-width="1.3"><circle cx="-3.5" cy="4" r="3"/><circle cx="3.5" cy="4" r="3"/><path d="M -3.5 4 L -1 -2 L 3.5 4 M -1 -2 L 1.5 -2"/></g>`).join("");
      return { over };
    },
    /* остановка автобуса: { y, side, bay: true } */
    busStop(ft, g) {
      const y = ft.y || 110, s = ft.side || "right";
      let road = "", furniture = "";
      if (ft.bay) {
        const x = s === "right" ? g.x1 : g.x0;
        road += s === "right"
          ? `<path d="M ${x} ${y - 70} Q ${x + 26} ${y - 56} ${x + 26} ${y - 36} L ${x + 26} ${y + 36} Q ${x + 26} ${y + 56} ${x} ${y + 70} Z" fill="${P.asph}"/>`
          : `<path d="M ${x} ${y - 70} Q ${x - 26} ${y - 56} ${x - 26} ${y - 36} L ${x - 26} ${y + 36} Q ${x - 26} ${y + 56} ${x} ${y + 70} Z" fill="${P.asph}"/>`;
      }
      const sx = s === "right" ? g.x1 + (ft.bay ? 40 : 14) : g.x0 - (ft.bay ? 40 : 14);
      furniture += sign("bus", sx, y - 20, 22);
      return { road, furniture };
    },
    /* рельсы трамвая по оси: { x } */
    tramRails(ft, g) {
      const x = ft.x != null ? ft.x : (g.x0 + g.x1) / 2;
      return { marks: `<g stroke="#a7afb8" stroke-width="2"><line x1="${x - 8}" y1="0" x2="${x - 8}" y2="${H}"/><line x1="${x + 8}" y1="0" x2="${x + 8}" y2="${H}"/></g>` };
    },
    /* железнодорожный переезд поперёк дороги: { y, barriers: "up"|"down"|null, lights: "flash"|"off", train: {x, dir} } */
    rail(ft, g) {
      const y = ft.y || 100;
      let ground = `<rect x="0" y="${y - 20}" width="${W}" height="40" fill="#b7aa95"/>` +
        Array.from({ length: 34 }, (_, i) => `<rect x="${i * 12}" y="${y - 16}" width="6" height="32" fill="#7a6a52" opacity="0.8"/>`).join("") +
        `<g stroke="#8c949c" stroke-width="3"><line x1="0" y1="${y - 8}" x2="${W}" y2="${y - 8}"/><line x1="0" y1="${y + 8}" x2="${W}" y2="${y + 8}"/></g>`;
      let road = `<rect x="${g.x0}" y="${y - 20}" width="${g.x1 - g.x0}" height="40" fill="#646d78"/><g stroke="#8c949c" stroke-width="3"><line x1="${g.x0}" y1="${y - 8}" x2="${g.x1}" y2="${y - 8}"/><line x1="${g.x0}" y1="${y + 8}" x2="${g.x1}" y2="${y + 8}"/></g>`;
      let furniture = sign("cross", g.x1 + 18, y + 54, 26);
      if (ft.lights) furniture += `<g transform="translate(${g.x1 + 18} ${y + 30})"><rect x="-13" y="-5" width="26" height="10" rx="5" fill="#1f2630"/>` +
        (ft.lights === "flash"
          ? `<circle cx="-7" r="3.8" fill="#ff2a1a"><animate attributeName="opacity" values="1;0.1;1" dur="1s" repeatCount="indefinite"/></circle><circle cx="7" r="3.8" fill="#ff2a1a"><animate attributeName="opacity" values="0.1;1;0.1" dur="1s" repeatCount="indefinite"/></circle>`
          : `<circle cx="-7" r="3.8" fill="#4a1d1a"/><circle cx="7" r="3.8" fill="#4a1d1a"/>`) + `</g>`;
      let marks = `<rect x="${g.x0 + 2}" y="${y + 34}" width="${g.x1 - g.x0 - 4}" height="4" fill="${P.line}"/>`;
      if (ft.barriers) {
        const down = ft.barriers === "down";
        const bar = (x, dir, yy) => down
          ? `<g><rect x="${dir > 0 ? x : x - (g.x1 - g.x0) / 2 - 4}" y="${yy - 3}" width="${(g.x1 - g.x0) / 2 + 4}" height="6" fill="#fff" stroke="#d81e1e" stroke-width="1"/>` +
            Array.from({ length: 4 }, (_, i) => `<rect x="${(dir > 0 ? x : x - (g.x1 - g.x0) / 2 - 4) + 4 + i * 12}" y="${yy - 3}" width="6" height="6" fill="#d81e1e"/>`).join("") + `</g>`
          : `<g><rect x="${x - 3}" y="${yy - 30}" width="6" height="30" fill="#fff" stroke="#d81e1e" stroke-width="1"/>${Array.from({ length: 3 }, (_, i) => `<rect x="${x - 3}" y="${yy - 26 + i * 10}" width="6" height="5" fill="#d81e1e"/>`).join("")}</g>`;
        furniture += `<circle cx="${g.x1 + 4}" cy="${y + 28}" r="3.5" fill="#3a4250"/>` + bar(g.x1 + 4, -1, y + 28) + `<circle cx="${g.x0 - 4}" cy="${y - 28}" r="3.5" fill="#3a4250"/>` + bar(g.x0 - 4, 1, y - 28);
      }
      let top = "";
      if (ft.train) top += trainSprite(ft.train.x, y, ft.train.dir || 1);
      return { ground, road, marks, furniture, top };
    },
    /* портал тоннеля сверху: { y } — всё выше y внутри горы */
    tunnel(ft, g) {
      const y = ft.y || 90;
      const over = `<rect x="0" y="0" width="${W}" height="${y}" fill="#7d8a76"/>` +
        Array.from({ length: 9 }, (_, i) => `<circle cx="${20 + i * 46}" cy="${y - 50 - (i % 3) * 14}" r="${26 + (i % 2) * 8}" fill="#6f7d68"/>`).join("") +
        `<rect x="${g.x0 - 10}" y="0" width="${g.x1 - g.x0 + 20}" height="${y}" fill="#1a1e24" opacity="0.92"/>` +
        `<rect x="${g.x0 - 16}" y="${y - 10}" width="${g.x1 - g.x0 + 32}" height="12" rx="3" fill="#a4abb3"/>` +
        (ft.inside ? Array.from({ length: 4 }, (_, i) => `<circle cx="${g.x0 - 4}" cy="${12 + i * 20}" r="2" fill="#ffd36a"/><circle cx="${g.x1 + 4}" cy="${12 + i * 20}" r="2" fill="#ffd36a"/>`).join("") : "");
      return { over, furniture: ft.sign ? sign("tunnel", g.x1 + 22, y + 70, 26) : "" };
    },
    /* весь вид внутри тоннеля: стены, освещение, аварийный выход */
    inTunnel(ft, g) {
      const ground = `<rect x="0" y="0" width="${W}" height="${H}" fill="#2a2f36"/>` +
        `<rect x="${g.x0 - 20}" y="0" width="${g.x1 - g.x0 + 40}" height="${H}" fill="#3a414a"/>`;
      let furniture = Array.from({ length: 8 }, (_, i) => `<rect x="${g.x0 - 16}" y="${i * 40 + 8}" width="6" height="16" rx="2" fill="#ffd36a" opacity="0.9"/><rect x="${g.x1 + 10}" y="${i * 40 + 8}" width="6" height="16" rx="2" fill="#ffd36a" opacity="0.9"/>`).join("");
      if (ft.exit) furniture += `<g transform="translate(${g.x1 + 34} ${ft.exit})"><rect x="-14" y="-12" width="28" height="24" rx="3" fill="#16a34a"/><path d="M -6 6 L -2 -2 L 2 2 L 6 -6 M 2 -6 L 6 -6 L 6 -2" stroke="#fff" stroke-width="2" fill="none"/></g>`;
      if (ft.lay) furniture += `<rect x="${g.x1}" y="${ft.lay - 30}" width="26" height="60" rx="6" fill="#4a525c"/>` + tag("HAVARILOMME", g.x1 + 50, ft.lay, { size: 7.5 });
      return { ground, furniture };
    },
    /* разъезд (møteplass) у правого края: { y } */
    passingPlace(ft, g) {
      const y = ft.y || 140, s = ft.side || "right";
      const x = s === "right" ? g.x1 : g.x0 - 26;
      const road = `<rect x="${x - (s === "right" ? 6 : -6)}" y="${y - 34}" width="32" height="68" rx="12" fill="${P.asph}"/>`;
      return { road, furniture: tag(ft.label || "MØTEPLASS", s === "right" ? g.x1 + 66 : g.x0 - 66, y, { size: 8 }) };
    },
    /* дорожные работы: конусы по полосе, временные знаки */
    roadwork(ft, g) {
      const from = ft.from || 40, to = ft.to || 200, lane = ft.lane != null ? ft.lane : g.lanes.length - 1;
      const lx = g.x0 + g.laneW * lane;
      let over = `<rect x="${lx + 4}" y="${from}" width="${g.laneW - 8}" height="${to - from}" fill="#8f979f" opacity="0.5"/>`;
      over += `<path d="M ${lx + g.laneW - 3} ${to + 50} L ${lx + 3} ${to}" stroke="#fff" stroke-width="0"/>`;
      let top = "";
      for (let y = from; y <= to; y += 22) top += cone(lx + (y > to - 30 ? g.laneW / 2 : 6), y);
      const taper = ft.taper !== false ? Array.from({ length: 3 }, (_, i) => cone(lx + g.laneW - 6 - i * 9, to + 22 + i * 18)).join("") : "";
      return { over, top: top + taper + (ft.worker ? person({ x: lx + g.laneW / 2, y: from + 30, kind: "worker", rot: 180 }) : "") };
    },
    /* обочина с вешками/отбойником */
    guardrail(ft, g) {
      const s = ft.side || "right", x = s === "right" ? g.x1 + 10 : g.x0 - 10;
      return { furniture: `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#c7ccd2" stroke-width="3"/>` + Array.from({ length: 8 }, (_, i) => `<rect x="${x - 1.5}" y="${i * 40 + 10}" width="3" height="6" fill="#6b7480"/>`).join("") };
    },
    /* полоса разгона/торможения справа: { kind: "on"|"off", from, to } */
    ramp(ft, g) {
      const on = ft.kind !== "off", x = g.x1, wR = 30;
      const yA = ft.from != null ? ft.from : on ? H : 300, yB = ft.to != null ? ft.to : on ? 70 : 0;
      let road, marks;
      if (on) {
        road = `<path d="M ${x} ${H} L ${x + wR + 40} ${H} Q ${x + wR} ${200} ${x + wR} ${160} L ${x + wR} ${yB + 60} Q ${x + wR} ${yB + 20} ${x} ${yB} Z" fill="${P.asph}"/>`;
        marks = `<line x1="${x}" y1="${yB}" x2="${x}" y2="${H}" stroke="${P.line}" stroke-width="2" stroke-dasharray="6 6"/><path d="M ${x + wR - 3} 165 L ${x + wR - 3} ${yB + 60} Q ${x + wR - 3} ${yB + 22} ${x} ${yB}" stroke="${P.line}" stroke-width="2" fill="none"/>`;
      } else {
        road = `<path d="M ${x} ${H} L ${x} ${0} L ${x + wR + 60} 0 Q ${x + wR} 60 ${x + wR} 110 L ${x + wR} ${200} Q ${x + wR} 250 ${x} ${280} Z" fill="${P.asph}"/>`;
        marks = `<line x1="${x}" y1="0" x2="${x}" y2="${280}" stroke="${P.line}" stroke-width="2" stroke-dasharray="6 6"/><path d="M ${x} 280 Q ${x + wR - 3} 250 ${x + wR - 3} 200 L ${x + wR - 3} 110 Q ${x + wR - 3} 60 ${x + wR + 56} 0" stroke="${P.line}" stroke-width="2" fill="none"/>`;
      }
      return { road, marks };
    },
    /* парковочные места вдоль края: { side, from, to, cars: [...цвета] } */
    parkingLane(ft, g) {
      const s = ft.side || "right", x = s === "right" ? g.x1 : g.x0 - 30;
      let road = `<rect x="${x}" y="${ft.from || 0}" width="30" height="${(ft.to || H) - (ft.from || 0)}" fill="${P.asph2}"/>`;
      if (s === "right") road += `<rect x="${x + 30}" y="0" width="24" height="${H}" fill="${P.walk}"/><line x1="${x + 30}" y1="0" x2="${x + 30}" y2="${H}" stroke="${P.curb}" stroke-width="2.4"/>` +
        Array.from({ length: 6 }, (_, i) => `<line x1="${x + 1}" y1="${i * 52 + 2}" x2="${x + 29}" y2="${i * 52 + 2}" stroke="#fff" stroke-width="1.2" opacity="0.6"/>`).join("");
      let top = "";
      (ft.cars || []).forEach((c, i) => { if (c) top += vehicle({ x: x + 15, y: (ft.from || 0) + 26 + i * 52, rot: 0, color: c, label: false }); });
      return { road, top };
    },
    /* плоская парковка во весь фон */
    lot(ft) {
      let ground = `<rect x="0" y="0" width="${W}" height="${H}" fill="#9aa3ac"/>`;
      for (let i = 0; i < 9; i++) ground += `<line x1="${30 + i * 44}" y1="20" x2="${30 + i * 44}" y2="100" stroke="#fff" stroke-width="2" opacity="0.8"/><line x1="${30 + i * 44}" y1="200" x2="${30 + i * 44}" y2="280" stroke="#fff" stroke-width="2" opacity="0.8"/>`;
      ground += tag("P", 370, 150, { bg: "#1b5bc7", color: "#fff", size: 11 });
      return { ground };
    },
    /* мост через реку поперёк: { y, h } */
    bridge(ft, g) {
      const y = ft.y || 120, h = ft.h || 80;
      const ground = `<rect x="0" y="${y - h / 2}" width="${W}" height="${h}" fill="#8fbbe0"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M ${i * 70 + 10} ${y - 10 + (i % 2) * 18} q 10 -5 20 0 t 20 0" stroke="#d6e8f7" stroke-width="1.5" fill="none"/>`).join("");
      const over = `<rect x="${g.x0 - 10}" y="${y - h / 2}" width="${g.x1 - g.x0 + 20}" height="${h}" fill="#8e98a2"/><rect x="${g.x0}" y="${y - h / 2}" width="${g.x1 - g.x0}" height="${h}" fill="${ft.icy ? "#aab8c6" : P.asph}"/>` +
        (ft.icy ? Array.from({ length: 10 }, (_, i) => `<path d="M ${g.x0 + 8 + (i * 13) % (g.x1 - g.x0 - 16)} ${y - h / 2 + 6 + i * 7} l 6 3" stroke="#eaf4ff" stroke-width="1.6"/>`).join("") : "") +
        `<rect x="${g.x0 - 10}" y="${y - h / 2}" width="4" height="${h}" fill="#c7ccd2"/><rect x="${g.x1 + 6}" y="${y - h / 2}" width="4" height="${h}" fill="#c7ccd2"/>`;
      return { ground, over };
    },
    /* лужа / наледь на полосе: { y, x, kind: "water"|"ice" } */
    puddle(ft, g) {
      const x = ft.x || g.right, y = ft.y || 110;
      return { over: ft.kind === "ice"
        ? `<ellipse cx="${x}" cy="${y}" rx="34" ry="40" fill="#d9ecfb" opacity="0.75"/><path d="M ${x - 16} ${y - 14} l 10 6 M ${x + 4} ${y + 6} l 12 5 M ${x - 6} ${y + 18} l 8 4" stroke="#fff" stroke-width="2"/>`
        : `<ellipse cx="${x}" cy="${y}" rx="30" ry="42" fill="#7fb0e0" opacity="0.7"/><ellipse cx="${x - 6}" cy="${y - 10}" rx="10" ry="14" fill="#cfe5f7" opacity="0.6"/>` };
    },
    /* стоп-линия поперёк твоих полос: { y } */
    stopLine(ft, g) { const c = g.center != null ? g.center : g.x0; return { marks: `<rect x="${c}" y="${ft.y}" width="${g.x1 - c}" height="4" fill="${P.line}"/>` }; },
    /* светофор у правого края: { y, state } */
    light(ft, g) { return { furniture: light(g.x1 + 14, ft.y, ft.state) }; },
    /* любой знак: { kind, y, side, size } */
    sign(ft, g) { return { furniture: sign(ft.kind, ft.x != null ? ft.x : ft.side === "left" ? g.x0 - 16 : g.x1 + 16, ft.y, ft.size || 26, ft.under) }; },
    /* железная дорога вдоль дороги слева: { x, train: { y, dir: 1 вниз | -1 вверх } } */
    railSide(ft, g) {
      const x = ft.x || g.x0 - 60;
      let ground = `<rect x="${x - 22}" y="0" width="44" height="${H}" fill="#b7aa95"/>` +
        Array.from({ length: 26 }, (_, i) => `<rect x="${x - 16}" y="${i * 12}" width="32" height="6" fill="#7a6a52" opacity="0.8"/>`).join("") +
        `<g stroke="#8c949c" stroke-width="3"><line x1="${x - 8}" y1="0" x2="${x - 8}" y2="${H}"/><line x1="${x + 8}" y1="0" x2="${x + 8}" y2="${H}"/></g>`;
      let top = "";
      if (ft.train) {
        const dir = ft.train.dir || 1, y = ft.train.y || 60;
        top += `<g transform="translate(${x} ${y}) rotate(${dir > 0 ? 90 : -90})">${trainSprite(0, 0, 1)}</g>`;
        if (ft.train.lights) top += `<g transform="translate(${x} ${y + dir * 64}) rotate(${dir > 0 ? 180 : 0})"><path d="M -8 0 L -30 -120 L 30 -120 L 8 0 Z" fill="#fff4b8" opacity="0.28"/></g>`;
      }
      return { ground, top };
    },
    /* вершина подъёма впереди: дорога «уходит» за горизонт */
    crest(ft, g) {
      const y = ft.y || 70;
      return { top: `<defs><linearGradient id="skCrest" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.grass}" stop-opacity="1"/><stop offset="0.55" stop-color="${P.grass}" stop-opacity="0.85"/><stop offset="1" stop-color="${P.grass}" stop-opacity="0"/></linearGradient></defs>` +
        `<rect x="0" y="0" width="${W}" height="${y}" fill="url(#skCrest)"/>` + tag(ft.text || "BAKKETOPP", (g.x0 + g.x1) / 2, 16, { size: 8.5 }) };
    },
    /* отдельная велодорожка справа, примыкает к дороге в точке join */
    bikePath(ft, g) {
      const x = g.x1 + 30, join = ft.join || 130;
      const ground = `<rect x="${x}" y="${join}" width="16" height="${H - join}" fill="#b5543f"/>` +
        `<path d="M ${x} ${join + 30} Q ${x} ${join} ${g.x1} ${join - 18} L ${g.x1} ${join + 6} Q ${x - 8} ${join + 14} ${x} ${join + 40} Z" fill="#b5543f"/>` +
        `<g transform="translate(${x + 8} ${join + 90})" fill="none" stroke="#fff" stroke-width="1.3"><circle cx="-3.5" cy="4" r="3"/><circle cx="3.5" cy="4" r="3"/><path d="M -3.5 4 L -1 -2 L 3.5 4 M -1 -2 L 1.5 -2"/></g>`;
      return { over: ground };
    },
    /* надпись-табличка: { text, x, y } */
    tag(ft) { return { top: tag(ft.text, ft.x, ft.y, ft) }; },
    /* вставка «в салоне»: крупная машина сверху, ребёнок сзади с отстёгнутым ремнём */
    cabin(ft) {
      const x = ft.x || 92, y = ft.y || 160;
      const top = `<g transform="translate(${x} ${y})"><rect x="-66" y="-96" width="132" height="176" rx="16" fill="#fff" opacity="0.96"/>` +
        `<g transform="translate(0 -8) scale(2.3)">${carBody(P.you, {})}</g>` +
        `<rect x="-18" y="8" width="36" height="22" rx="5" fill="#d9dee5"/><rect x="-18" y="-26" width="15" height="18" rx="4" fill="#d9dee5"/><rect x="3" y="-26" width="15" height="18" rx="4" fill="#d9dee5"/>` +
        `<g transform="translate(8 18) scale(0.8)"><ellipse rx="8.5" ry="5.2" fill="#f08c1a"/><circle cy="0.4" r="4" fill="#3b2a20"/></g>` +
        `<path d="M 14 8 L 20 24 M 20 24 L 17 30" stroke="#e0483a" stroke-width="2.2" stroke-linecap="round"/>` +
        `<text y="74" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="9" fill="${P.ink}">${ft.text || "BELTET LØSNET"}</text></g>`;
      return { top };
    },
    /* солнце низко впереди */
    lowSun() { return { top: `<defs><radialGradient id="skLow" cx="0.5" cy="0" r="0.75"><stop offset="0" stop-color="#fff8d6" stop-opacity="1"/><stop offset="0.5" stop-color="#ffe7a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#skLow)"/><circle cx="200" cy="-6" r="34" fill="#fffbe6"/>` }; },
    /* уклон: стрелка и подпись */
    slope(ft) { return { top: tag(ft.text || "BRATT BAKKE ↓", ft.x || 340, ft.y || 24, { size: 8.5 }) }; }
  };

  function trainSprite(x, y, dir) {
    const cars = [0, 1, 2, 3].map(i => `<rect x="${-i * 92 * dir - 44}" y="-12" width="88" height="24" rx="5" fill="${i === 0 ? "#c8202c" : "#d6dbe0"}" stroke="#9aa3ac" stroke-width="1"/>` +
      `<g fill="${P.glass}" opacity="0.6">${[0, 1, 2, 3, 4].map(k => `<rect x="${-i * 92 * dir - 38 + k * 16}" y="-9" width="10" height="4" rx="1"/><rect x="${-i * 92 * dir - 38 + k * 16}" y="5" width="10" height="4" rx="1"/>`).join("")}</g>`).join("");
    const nose = `<path d="M ${44 * dir} -12 Q ${58 * dir} -12 ${60 * dir} 0 Q ${58 * dir} 12 ${44 * dir} 12 Z" fill="#c8202c"/>`;
    return `<g transform="translate(${f1(x)} ${f1(y)})"><rect x="-330" y="-10" width="420" height="24" fill="#000" opacity="0" />${cars}${nose}</g>`;
  }

  /* =====================================================================
     СКЛОН: машина у края, видны передние колёса
     cfg: { dir: "up"|"down", edge: "curb"|"ditch", wheels: "toCurb"|"away"|"straight" } */
  function hill(cfg) {
    const down = cfg.dir === "down", curb = cfg.edge !== "ditch";
    /* Машина всегда носом вверх. down: вниз по склону = вверх по картинке; up: вниз по склону = вниз по картинке.
       Тень сгущается к низу склона. */
    const fall = down ? -1 : 1;
    let g = `<defs><linearGradient id="skHill${down ? "D" : "U"}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${down ? 0.2 : 0}"/><stop offset="1" stop-color="#000" stop-opacity="${down ? 0 : 0.2}"/></linearGradient></defs>`;
    const x0 = 120, x1 = 250;
    g += curb
      ? `<rect x="${x1}" y="0" width="34" height="${H}" fill="${P.walk}"/><line x1="${x1}" y1="0" x2="${x1}" y2="${H}" stroke="${P.curb}" stroke-width="5"/>` + house(x1 + 50, 30, 70, 60) + house(x1 + 54, 180, 64, 70)
      : `<rect x="${x1}" y="0" width="30" height="${H}" fill="#9cb38a"/><rect x="${x1 + 6}" y="0" width="14" height="${H}" fill="#6f8a5e"/>` + tree(x1 + 80, 70, 18) + tree(x1 + 100, 210, 20);
    g += `<rect x="${x0 - 22}" y="0" width="22" height="${H}" fill="${P.walk}"/>` + tree(60, 80, 16) + tree(50, 220, 18);
    g += `<rect x="${x0}" y="0" width="${x1 - x0}" height="${H}" fill="${P.asph}"/><line x1="${(x0 + x1) / 2}" y1="0" x2="${(x0 + x1) / 2}" y2="${H}" stroke="${P.yellow}" stroke-width="2.4" stroke-dasharray="14 10"/>`;
    g += `<rect width="${W}" height="${H}" fill="url(#skHill${down ? "D" : "U"})"/>`;
    /* табличка: стрелка показывает, куда идёт склон вниз */
    g += `<g transform="translate(58 150)"><rect x="-44" y="-50" width="88" height="100" rx="12" fill="#fff" opacity="0.94"/>` +
      `<path d="M 0 ${-26 * fall} L 0 ${22 * fall}" stroke="${P.ink}" stroke-width="3"/><polygon points="-8,${14 * fall} 8,${14 * fall} 0,${28 * fall}" fill="${P.ink}"/>` +
      `<text y="${down ? 40 : -36}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="8.5" fill="${P.ink}">NEDOVER</text></g>`;
    g += tag(down ? "BILEN PEKER NEDOVER" : "BILEN PEKER OPPOVER", 185, 18, { size: 8 });
    if (curb) g += tag("FORTAUSKANT", x1 + 17, 286, { size: 7.5 }); else g += tag("GRØFT", x1 + 15, 286, { size: 7.5 });
    /* машина у правого края, нос вверх; руль к краю = +28°, от края = −28° */
    const wh = cfg.wheels || (down ? "toCurb" : "away");
    const steer = wh === "straight" ? 0 : wh === "away" ? -28 : 28;
    const cx = x1 - 22, cy = 150;
    g += vehicle({ x: cx, y: cy, rot: 0, color: P.you, label: "A", steer });
    /* если тормоз откажет: машина катится вниз по склону; колёса решают — в край или на дорогу.
       Вниз носом: колёса к краю → нос уходит в край. Вверх носом (катится задом): колёса от края → зад уходит в край. */
    const toEdge = wh !== "straight" && ((down && wh === "toCurb") || (!down && wh === "away"));
    const startY = cy + 26 * fall, endY = cy + 100 * fall;
    const target = [toEdge ? x1 + (curb ? -2 : 12) : wh === "straight" ? cx : x0 + 40, endY];
    g += arrow(wh === "straight" ? [[cx, startY], target] : [[cx, startY], [cx, startY + 18 * fall], target], wh === "straight" ? P.orange : toEdge ? P.green : P.red, { width: 2.8, dash: "5 5", head: 9, radius: 18 });
    return svg(g, { label: cfg.alt, bg: P.grass });
  }

  /* =====================================================================
     ИЛЛЮСТРАЦИИ для вопросов не про дорогу: illus("wine-morning" | "party-glass" | "medicine" | "frost") */
  function illus(kind) {
    const T = (x, y, text, size, color) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="${size}" fill="${color || P.ink}">${text}</text>`;
    const card = (x, y, w, h) => `<rect x="${x + 3}" y="${y + 5}" width="${w}" height="${h}" rx="18" fill="#000" opacity="0.07"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff"/>`;
    const carSide = (x, y, c) => `<g transform="translate(${x} ${y})"><ellipse cx="2" cy="26" rx="78" ry="6" fill="#000" opacity="0.12"/>` +
      `<path d="M -74 12 L -70 -8 Q -64 -20 -44 -23 L -24 -40 Q -15 -47 0 -47 L 26 -47 Q 39 -47 47 -37 L 60 -23 Q 74 -21 76 -6 L 76 12 Q 76 16 72 16 L -70 16 Q -74 16 -74 12 Z" fill="${c}"/>` +
      `<path d="M -18 -39 L -3 -39 L -3 -25 L -34 -25 Z M 3 -39 L 25 -39 Q 33 -39 39 -31 L 45 -25 L 3 -25 Z" fill="${P.glass}" opacity="0.85"/>` +
      `<rect x="62" y="-14" width="10" height="5" rx="2" fill="#fff6c4"/><rect x="-74" y="-12" width="6" height="6" rx="2" fill="#c81e1e"/>` +
      `<circle cx="-44" cy="14" r="14" fill="#1d2025"/><circle cx="-44" cy="14" r="6" fill="#b9c1ca"/><circle cx="46" cy="14" r="14" fill="#1d2025"/><circle cx="46" cy="14" r="6" fill="#b9c1ca"/></g>`;
    const wine = (x, y) => `<g transform="translate(${x} ${y})"><path d="M -20 -40 L 20 -40 Q 21 -8 0 3 Q -21 -8 -20 -40 Z" fill="#eef4f8" stroke="#9aa6b2" stroke-width="2.5"/>` +
      `<path d="M -18.5 -24 L 18.5 -24 Q 17 -5 0 1.5 Q -17 -5 -18.5 -24 Z" fill="#8e1b30"/><rect x="-2" y="3" width="4" height="30" fill="#9aa6b2"/><rect x="-17" y="31" width="34" height="5" rx="2.5" fill="#9aa6b2"/></g>`;
    let g = "";
    if (kind === "wine-morning") {
      g += card(22, 30, 166, 240) + wine(86, 140) + wine(126, 150) + `<path d="M 60 96 Q 64 84 70 96" stroke="#9aa6b2" stroke-width="0" fill="none"/>` +
        `<g transform="translate(104 222)">${T(0, 0, "I GÅR KVELD", 15)}${T(0, 20, "2–3 glass vin", 12, "#4b5563")}</g>` +
        card(212, 30, 166, 240) + `<g transform="translate(295 104)"><circle r="40" fill="#fff" stroke="${P.ink}" stroke-width="4"/>` +
        Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-35" x2="0" y2="-29" stroke="${P.ink}" stroke-width="3" transform="rotate(${i * 30})"/>`).join("") +
        `<line x1="0" y1="0" x2="0" y2="-22" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round" transform="rotate(210)"/><line x1="0" y1="0" x2="0" y2="-31" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/><circle r="4" fill="${P.ink}"/></g>` +
        `<g transform="translate(295 192) scale(0.72)">${carSide(0, 0, P.you)}</g>` +
        `<g transform="translate(295 244)">${T(0, 0, "I DAG 07:00", 15)}</g>` +
        `<g transform="translate(200 150)"><circle r="22" fill="${P.red}"/>${T(0, 6, "‰?", 16, "#fff")}</g>`;
    }
    if (kind === "party-glass") {
      g += card(22, 30, 166, 240) + `<g transform="translate(105 140)"><rect x="-30" y="-56" width="60" height="96" rx="8" fill="#eef4f8" stroke="#9aa6b2" stroke-width="2.5"/><rect x="-27" y="-22" width="54" height="59" rx="6" fill="#f5b041"/>` +
        `<g fill="#fff" opacity="0.75"><circle cx="-10" cy="0" r="3"/><circle cx="8" cy="12" r="2.5"/><circle cx="-4" cy="24" r="2"/></g><line x1="14" y1="-76" x2="2" y2="12" stroke="${P.red}" stroke-width="4" stroke-linecap="round"/></g>` +
        `<g transform="translate(105 222)">${T(0, 0, "«ALKOHOLFRI»?", 14)}${T(0, 20, "inneholdt litt alkohol", 11, "#4b5563")}</g>` +
        card(212, 30, 166, 240) + `<g transform="translate(295 118) scale(0.78)">${carSide(0, 0, P.you)}</g>` +
        `<g transform="translate(295 200)"><rect x="-62" y="-22" width="124" height="44" rx="12" fill="${P.ink}"/>${T(0, 8, "GRENSE 0,2 ‰", 15, "#ffd21f")}</g>`;
    }
    if (kind === "medicine") {
      g += card(30, 26, 340, 248) + `<g transform="translate(150 146)"><rect x="-86" y="-66" width="172" height="120" rx="12" fill="#f8fafc" stroke="#9aa6b2" stroke-width="2.5"/>` +
        `<path d="M -86 -54 Q -86 -66 -74 -66 L 74 -66 Q 86 -66 86 -54 L 86 -38 L -86 -38 Z" fill="#dbe7f5"/>${T(-40, -47, "RESEPT", 12)}` +
        `<polygon points="0,-26 38,40 -38,40" fill="#fff" stroke="#e0231a" stroke-width="8" stroke-linejoin="round"/>${T(0, 32, "!", 34, "#e0231a")}</g>` +
        `<g transform="translate(298 104) rotate(-20)"><rect x="-32" y="-13" width="64" height="26" rx="13" fill="#fff" stroke="#9aa6b2" stroke-width="2"/><path d="M 0 -13 L -19 -13 Q -32 -13 -32 0 Q -32 13 -19 13 L 0 13 Z" fill="#e0483a"/></g>` +
        `<g transform="translate(298 196)">${T(0, 0, "Zz", 40, "#6b7a8c")}${T(0, 34, "trøtt", 13, "#4b5563")}</g>`;
    }
    if (kind === "frost") {
      /* лобовое стекло изнутри: всё в инее, прочищен только маленький кусочек */
      g = `<rect width="${W}" height="${H}" fill="#262b31"/>` +
        `<defs><pattern id="skFrost" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M 13 3 L 13 23 M 3 13 L 23 13 M 6 6 L 20 20 M 20 6 L 6 20" stroke="#fff" stroke-width="1.2" opacity="0.75"/></pattern>` +
        `<clipPath id="skHole"><ellipse cx="150" cy="142" rx="48" ry="30"/></clipPath></defs>` +
        `<path d="M 34 36 Q 200 2 366 36 L 384 232 Q 200 258 16 232 Z" fill="#dce8f0"/><path d="M 34 36 Q 200 2 366 36 L 384 232 Q 200 258 16 232 Z" fill="url(#skFrost)"/>` +
        `<g clip-path="url(#skHole)"><rect x="90" y="100" width="130" height="90" fill="#b9cfe0"/><rect x="90" y="150" width="130" height="40" fill="#7f8b7a"/><rect x="140" y="132" width="30" height="16" rx="3" fill="#4f5864"/></g>` +
        `<ellipse cx="150" cy="142" rx="48" ry="30" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="4 5"/>` +
        `<rect x="0" y="240" width="${W}" height="60" fill="#191c20"/><circle cx="128" cy="300" r="48" fill="none" stroke="#3b4047" stroke-width="11"/>` +
        `<rect x="14" y="84" width="20" height="70" rx="6" fill="#191c20"/><rect x="366" y="84" width="20" height="70" rx="6" fill="#191c20"/>` +
        `<g transform="translate(300 290)"><rect x="-70" y="-14" width="140" height="22" rx="11" fill="#fff" opacity="0.9"/>${T(0, 2, "ALLE RUTENE MED RIM", 10)}</g>`;
      return svg(g, { bg: "#262b31" });
    }
    return svg(g, { bg: "#eef2f6" });
  }

  window.SK = { illus, actor, sheep, W, H, P, svg, vehicle, person, moose, horse, cone, tree, house, arrow, sign, light, tag, overlay, junction, roundabout, street, hill, manOf, FEATURES, trainSprite };
})();
