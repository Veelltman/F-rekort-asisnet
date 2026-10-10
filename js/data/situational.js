/* Банк вопросов: ситуационные задачи (перекрёстки, приоритет, круговое движение).
   Схемы перекрёстков рисуются функцией scene(). Ты — всегда машина «A» (синяя). */

(function () {
  "use strict";

  /* ---------- Отрисовка перекрёстка ----------
     viewBox 200×200, центр (100,100). Дорога шириной 64, две полосы по 32.
     Правостороннее движение: машина едет по правой полосе своего направления. */

  const C = 100, HALF = 32, LANE = 16, EDGE = 168, BOUND = 132;
  /* Полоса подъезда (координата поперёк дороги) и направление движения */
  const APPROACH = {
    south: { axis: "y", lane: C + LANE, from: 200, dir: -1, rot: 0 },
    north: { axis: "y", lane: C - LANE, from: 0, dir: 1, rot: 180 },
    east:  { axis: "x", lane: C - LANE, from: 200, dir: -1, rot: 270 },
    west:  { axis: "x", lane: C + LANE, from: 0, dir: 1, rot: 90 }
  };
  /* Полоса выезда для направления движения "to" */
  const EXITLANE = {
    north: { axis: "y", lane: C + LANE, end: 4 },
    south: { axis: "y", lane: C - LANE, end: 196 },
    east:  { axis: "x", lane: C + LANE, end: 196 },
    west:  { axis: "x", lane: C - LANE, end: 4 }
  };

  function pt(axisCoord, laneCoord, axis) {
    return axis === "y" ? [laneCoord, axisCoord] : [axisCoord, laneCoord];
  }

  function trajectory(from, to, laneShift) {
    const a = APPROACH[from], e = EXITLANE[to];
    const aLane = a.lane + (laneShift || 0) * (a.axis === "y" ? (from === "south" ? 1 : -1) : (from === "east" ? -1 : 1));
    const startCoord = a.from === 200 ? EDGE : 200 - EDGE;
    const boundIn = a.from === 200 ? BOUND : 200 - BOUND;
    const p0 = pt(startCoord, aLane, a.axis);
    const p1 = pt(boundIn, aLane, a.axis);
    if (a.axis === e.axis) {
      const p3 = pt(e.end, aLane, a.axis);
      return { d: `M ${p0} L ${p3}`, endAngle: angleOf(p1, p3) };
    }
    const eLane = e.lane + (laneShift || 0) * (e.axis === "y" ? (to === "north" ? 1 : -1) : (to === "east" ? 1 : -1));
    const boundOut = e.end > C ? BOUND : 200 - BOUND;
    const p2 = pt(boundOut, eLane, e.axis);
    const p3 = pt(e.end, eLane, e.axis);
    const ctrl = a.axis === "y" ? [aLane, eLane] : [eLane, aLane];
    return { d: `M ${p0} L ${p1} Q ${ctrl} ${p2} L ${p3}`, endAngle: angleOf(p2, p3) };
  }

  function roundaboutPath(from, to, inner) {
    const R = inner ? 34 : 40;
    const ang = { south: 90, east: 0, north: -90, west: 180 };
    /* Правая полоса подъезда входит в кольцо чуть «раньше» по ходу, выезд чуть «позже» */
    const inA = ang[from] - 22, outA = ang[to] + 22;
    let a1 = inA, a2 = outA;
    while (a2 >= a1 - 10) a2 -= 360;
    const pts = [];
    for (let t = a1; t >= a2; t -= 8) pts.push([C + R * Math.cos(t * Math.PI / 180), C + R * Math.sin(t * Math.PI / 180)]);
    const a = APPROACH[from];
    const startCoord = a.from === 200 ? EDGE : 200 - EDGE;
    const p0 = pt(startCoord, a.lane + (inner ? -8 * laneSign(from) : 0), a.axis);
    const e = EXITLANE[to];
    const p3 = pt(e.end, e.lane, e.axis);
    const last = pts[pts.length - 1];
    return { d: `M ${p0} L ${pts.map(p => p.map(v => v.toFixed(1)).join(" ")).join(" L ")} L ${p3}`, endAngle: angleOf(last, p3) };
  }

  function angleOf(p, q) { return Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI; }

  function arrowHead(d, endAngle, color) {
    const m = d.match(/L ([\d.]+)[ ,]([\d.]+)$/);
    if (!m) return "";
    const x = +m[1], y = +m[2];
    return `<polygon points="0,-5 9,0 0,5" fill="${color}" transform="translate(${x} ${y}) rotate(${endAngle})"/>`;
  }

  /* Корпус ТС: рисуется носом вверх, потом поворачивается на rot. kind: car | bus | truck | tram | emergency | bike */
  function body(kind, label, color, rot) {
    const lbl = (y, fill) => `<text x="0" y="${y}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="10" fill="${fill || "#fff"}" transform="rotate(${-rot})">${label}</text>`;
    if (kind === "bike") return `<rect x="-4" y="-10" width="8" height="20" rx="4" fill="${color}"/><circle cx="0" cy="-6" r="3.8" fill="#fff"/>
        <text x="0" y="24" text-anchor="middle" font-family="Arial" font-weight="700" font-size="9" fill="${color}" transform="rotate(${-rot})">${label}</text>`;
    if (kind === "bus") return `<rect x="-9" y="-22" width="18" height="44" rx="3" fill="#f0a020"/>
        <rect x="-7" y="-20" width="14" height="5" rx="1.5" fill="#fff" opacity="0.85"/>
        ${[-12, -5, 9, 16].map(y => `<rect x="-9" y="${y}" width="2.5" height="4" fill="#fff" opacity="0.7"/><rect x="6.5" y="${y}" width="2.5" height="4" fill="#fff" opacity="0.7"/>`).join("")}
        <rect x="-7" y="17" width="14" height="3" rx="1" fill="#fff" opacity="0.35"/>${lbl(4.5)}`;
    if (kind === "truck") return `<rect x="-9" y="-10" width="18" height="34" rx="2" fill="#8a949c" stroke="#fff" stroke-width="1"/>
        <rect x="-8" y="-25" width="16" height="13" rx="3" fill="${color}"/><rect x="-6" y="-23" width="12" height="4" rx="1.5" fill="#fff" opacity="0.85"/>${lbl(10)}`;
    if (kind === "tram") return `<rect x="-8" y="-26" width="16" height="52" rx="6" fill="#2b62c9"/>
        ${[-21, -13, 8, 16].map(y => `<rect x="-6" y="${y}" width="12" height="5" rx="1" fill="#fff" opacity="0.8"/>`).join("")}
        <line x1="-5" y1="-4" x2="5" y2="-4" stroke="#111" stroke-width="1.2" opacity="0.6"/>${lbl(3.5)}`;
    if (kind === "emergency") return `<rect x="-8" y="-14" width="16" height="28" rx="4" fill="#fff" stroke="#c9cfd6" stroke-width="1"/>
        <rect x="-8" y="-1" width="16" height="4" fill="#d81e1e"/><rect x="-6" y="-11" width="12" height="6" rx="2" fill="#9fc8ff"/>
        <rect x="-4" y="-16" width="8" height="3" rx="1.5" fill="#1d5fd6"/><circle cx="0" cy="-17" r="3.5" fill="#1d5fd6" opacity="0.35"/>${lbl(11.5, "#1d1f24")}`;
    return `<rect x="-8" y="-14" width="16" height="28" rx="4" fill="${color}"/>
        <rect x="-6" y="-11" width="12" height="6" rx="2" fill="#fff" opacity="0.75"/>
        <rect x="-6" y="7" width="12" height="4" rx="1.5" fill="#fff" opacity="0.35"/>${lbl(4.5)}`;
  }
  function at(x, y, rot, kind, label, color) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})">${body(kind, label, color, rot)}</g>`;
  }

  /* +1 = сдвиг от осевой к обочине для этого направления подъезда */
  function laneSign(from) { return from === "south" || from === "west" ? 1 : -1; }

  function vehicle(from, to, label, color, kind, roundabout, inner) {
    const a = APPROACH[from];
    const traj = roundabout ? roundaboutPath(from, to, inner) : trajectory(from, to, kind === "bike" ? 11 : 0);
    const startCoord = a.from === 200 ? EDGE : 200 - EDGE;
    const lane = a.lane + (kind === "bike" ? 11 * laneSign(from) : 0) + (inner ? -8 * laneSign(from) : 0);
    const [x, y] = pt(startCoord, lane, a.axis);
    const path = `<path d="${traj.d}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 5" opacity="0.9"/>
      ${arrowHead(traj.d, traj.endAngle, color)}`;
    return `${path}${at(x, y, a.rot, kind, label, color)}`;
  }

  /* Знак стоит справа от подъезжающего, перед перекрёстком */
  const SIGN_SPOT = { south: [144, 146], north: [56, 54], east: [146, 56], west: [54, 144] };
  const LIGHT_SPOT = { south: [142, 136], north: [58, 64], east: [136, 58], west: [64, 142] };

  function signMarker(side, kind) {
    const [x, y] = SIGN_SPOT[side];
    const post = `<line x1="${x}" y1="${y + 8}" x2="${x}" y2="${y + 14}" stroke="#4b5563" stroke-width="2"/>`;
    if (kind === "yield") return `${post}<polygon points="${x - 8},${y - 7} ${x + 8},${y - 7} ${x},${y + 8}" fill="#fff" stroke="#d81e1e" stroke-width="2.5" stroke-linejoin="round"/>`;
    if (kind === "priority") return `${post}<polygon points="${x},${y - 9} ${x + 9},${y} ${x},${y + 9} ${x - 9},${y}" fill="#fff" stroke="#d81e1e" stroke-width="1.5"/><polygon points="${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}" fill="#f6c945"/>`;
    if (kind === "stop") return `${post}<polygon points="${x - 4},${y - 9} ${x + 4},${y - 9} ${x + 9},${y - 4} ${x + 9},${y + 4} ${x + 4},${y + 9} ${x - 4},${y + 9} ${x - 9},${y + 4} ${x - 9},${y - 4}" fill="#d81e1e" stroke="#fff" stroke-width="1.5"/>`;
    return "";
  }

  function lightMarker(side, color) {
    const [x, y] = LIGHT_SPOT[side];
    const on = color === "green" ? "#2aa46a" : color === "yellow" ? "#f6c945" : "#d81e1e";
    return `<rect x="${x - 5}" y="${y - 12}" width="10" height="24" rx="3" fill="#1f2937"/>
      <circle cx="${x}" cy="${y - 6}" r="3" fill="${color === "red" ? on : "#4b2020"}"/>
      <circle cx="${x}" cy="${y}" r="3" fill="${color === "yellow" ? on : "#4b4020"}"/>
      <circle cx="${x}" cy="${y + 6}" r="3" fill="${color === "green" ? on : "#1f3a2a"}"/>`;
  }

  function scene(cfg) {
    const palette = ["#e0483a", "#2aa46a", "#f0a020"];
    const twoLanes = cfg.roundabout && cfg.lanes === 2;
    const cars = [vehicle(cfg.you.from, cfg.you.to, "A", "#1d5fd6", null, cfg.roundabout, twoLanes && cfg.you.lane === "left")];
    (cfg.others || []).forEach((o, i) => cars.push(vehicle(o.from, o.to, o.label || String.fromCharCode(66 + i), o.kind === "bike" ? "#2aa46a" : palette[i % 3], o.kind, cfg.roundabout)));
    const signs = Object.keys(cfg.signs || {}).map(side => signMarker(side, cfg.signs[side])).join("");
    const lights = Object.keys(cfg.lights || {}).map(side => lightMarker(side, cfg.lights[side])).join("");
    /* Зебра на указанном рукаве + пешеход, идущий через неё */
    const PED = { east: { zebra: (i) => `<rect x="146" y="${72 + i * 10}" width="10" height="6"/>`, at: [151, 56], ang: 90 },
                  west: { zebra: (i) => `<rect x="44" y="${72 + i * 10}" width="10" height="6"/>`, at: [49, 144], ang: -90 },
                  north: { zebra: (i) => `<rect x="${72 + i * 10}" y="44" width="6" height="10"/>`, at: [144, 49], ang: 180 },
                  south: { zebra: (i) => `<rect x="${72 + i * 10}" y="146" width="6" height="10"/>`, at: [56, 151], ang: 0 } };
    const peds = (cfg.peds || []).map(side => { const p = PED[side]; return `<g fill="#fff" opacity="0.95">${[0, 1, 2, 3, 4, 5].map(p.zebra).join("")}</g>${person(p.at[0], p.at[1], p.ang)}`; }).join("");

    const centerLines = cfg.roundabout ? "" : `
      <g stroke="#f6c945" stroke-width="2" stroke-dasharray="7 6">
        <line x1="100" y1="0" x2="100" y2="66"/><line x1="100" y1="134" x2="100" y2="200"/>
        <line x1="0" y1="100" x2="66" y2="100"/><line x1="134" y1="100" x2="200" y2="100"/>
      </g>`;
    const roundabout = cfg.roundabout ? `
      <circle cx="100" cy="100" r="62" fill="#5d6770"/>
      <circle cx="100" cy="100" r="26" fill="#cfd6dc"/>
      <circle cx="100" cy="100" r="20" fill="#7fb37a"/>
      <g fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.7">
        <circle cx="100" cy="100" r="30"/>${twoLanes ? '<circle cx="100" cy="100" r="44"/>' : ""}
      </g>` : "";
    /* Двухполосный подъезд: пунктир делит правую половину «своей» дороги на две полосы */
    let laneSplit = "";
    if (twoLanes) {
      const a = APPROACH[cfg.you.from];
      const near = a.from === 200 ? 136 : 64, far = a.from;
      laneSplit = a.axis === "y"
        ? `<line x1="${a.lane}" y1="${near}" x2="${a.lane}" y2="${far}" stroke="#fff" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.85"/>`
        : `<line x1="${near}" y1="${a.lane}" x2="${far}" y2="${a.lane}" stroke="#fff" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.85"/>`;
    }
    const crossings = cfg.roundabout ? "" : `
      <g stroke="#fff" stroke-width="1.6" opacity="0.9">
        <line x1="68" y1="134" x2="100" y2="134"/><line x1="100" y1="66" x2="132" y2="66"/>
        <line x1="134" y1="68" x2="134" y2="100"/><line x1="66" y1="100" x2="66" y2="132"/>
      </g>`;

    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="scene-icon">
      <rect width="200" height="200" fill="#e4ede0"/>
      <rect x="62" y="0" width="76" height="200" fill="#cfd6dc"/>
      <rect x="0" y="62" width="200" height="76" fill="#cfd6dc"/>
      <rect x="68" y="0" width="64" height="200" fill="#5d6770"/>
      <rect x="0" y="68" width="200" height="64" fill="#5d6770"/>
      <g stroke="#fff" stroke-width="1.5" opacity="0.85">
        <line x1="68" y1="0" x2="68" y2="66"/><line x1="132" y1="0" x2="132" y2="66"/>
        <line x1="68" y1="134" x2="68" y2="200"/><line x1="132" y1="134" x2="132" y2="200"/>
        <line x1="0" y1="68" x2="66" y2="68"/><line x1="0" y1="132" x2="66" y2="132"/>
        <line x1="134" y1="68" x2="200" y2="68"/><line x1="134" y1="132" x2="200" y2="132"/>
      </g>
      ${centerLines}
      ${roundabout}
      ${laneSplit}
      ${crossings}
      ${signs}
      ${lights}
      ${peds}
      ${cars.join("")}
    </svg>`;
  }
  window.SCENE = scene;

  /* ---------- Схемы на прямой дороге (без перекрёстка) ----------
     road({ bus: true, limit: 50 })   — автобус выезжает с остановки, A сзади
     road({ crossing: true })         — пешеходный переход, пешеход справа
     road({ crossing: "far" })        — пешеход почти перешёл: на дальнем (левом) краю перехода
     road({ narrow: true })           — узкая дорога с разъездом (møteplass) на стороне A, B навстречу
     road({ exit: "parking" })        — A выезжает с парковки справа на дорогу; exit: "gatetun" — из жилой зоны
     road({ tcross: true })           — T-перекрёсток: боковая дорога справа, B выезжает из неё
     road({ bikeLane: true })         — велополоса справа, A поворачивает направо, велосипедист B едет прямо
     road({ overtake: true })         — B впереди с левым поворотником объезжает велосипедиста S, A сзади
     road({ night: true })            — ночь, пешеход в тёмном на левой обочине навстречу A
     road({ truck: true, tcross: true }) — грузовик B впереди сместился влево перед правым поворотом
     road({ tram: true })             — трамвай стоит на остановке, пассажиры переходят к тротуару
     В scene(): others[].kind может быть "bike" | "bus" | "truck" | "tram" | "emergency"; peds: ["east"] — пешеход на переходе рукава */

  function carAt(x, y, rot, label, color, long) { return at(x, y, rot, long ? "bus" : "car", label, color); }
  function bikeAt(x, y, rot, label, color) { return at(x, y, rot, "bike", label, color); }
  function pathArrow(d, color) {
    const pts = d.match(/[\d.]+[ ,][\d.]+/g).map(s => s.split(/[ ,]/).map(Number));
    const [p, q] = [pts[pts.length - 2], pts[pts.length - 1]];
    return `<path d="${d}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 5" opacity="0.9"/>
      ${arrowHead(d, angleOf(p, q), color)}`;
  }
  /* Пешеход. ang: направление стрелки движения (0 = вправо, 90 = вниз, 180 = влево, -90 = вверх). dir -1 = влево (старый вызов) */
  function person(x, y, ang, color) {
    if (ang === -1) ang = 180; else if (ang === 1) ang = 0;
    const c = color || "#1d1f24";
    return `<g transform="translate(${x} ${y})">
        <circle cx="0" cy="-9" r="4" fill="${c}"/>
        <path d="M -4 -4 L 4 -4 L 5 6 L 2 6 L 2 14 L -2 14 L -2 6 L -5 6 Z" fill="${c}"/>
        <polygon points="8,0 16,0 16,-3 22,2 16,7 16,4 8,4" fill="${c}" opacity="0.8" transform="rotate(${ang || 0})"/>
      </g>`;
  }
  function speedSign(x, y, n) {
    return `<g transform="translate(${x} ${y})"><line x1="0" y1="0" x2="0" y2="16" stroke="#555" stroke-width="2"/>
        <circle r="10" fill="#fff" stroke="#d81e1e" stroke-width="2.5"/>
        <text y="3.5" text-anchor="middle" font-family="Arial" font-weight="700" font-size="9" fill="#111">${n}</text></g>`;
  }

  function road(cfg) {
    const A = "#1d5fd6", B = "#e0483a", BUS = "#f0a020", BIKE = "#2aa46a";
    const narrow = !!cfg.narrow, night = !!cfg.night;
    const x0 = narrow ? 84 : 68, x1 = narrow ? 116 : 132;      /* асфальт */
    const GRASS = night ? "#1e261e" : "#e4ede0", WALK = night ? "#3a4048" : "#cfd6dc", ASPH = night ? "#2b3138" : "#5d6770";
    let extra = "", vehicles = "";

    /* боковой въезд справа (T-перекрёсток, парковка, gatetun) */
    const side = cfg.tcross || cfg.exit || cfg.bikeLane;
    const sideRoad = side ? `
      <rect x="${x1}" y="${cfg.exit ? 78 : 62}" width="${200 - x1}" height="${cfg.exit ? 44 : 76}" fill="#cfd6dc"/>
      <rect x="${x1}" y="${cfg.exit ? 84 : 68}" width="${200 - x1}" height="${cfg.exit ? 32 : 64}" fill="${cfg.exit === "parking" ? "#8a949c" : "#5d6770"}"/>
      ${cfg.exit ? "" : `<line x1="${x1}" y1="68" x2="200" y2="68" stroke="#fff" stroke-width="1.5" opacity="0.85"/>
      <line x1="${x1}" y1="132" x2="200" y2="132" stroke="#fff" stroke-width="1.5" opacity="0.85"/>
      <line x1="${x1 + 2}" y1="100" x2="200" y2="100" stroke="#f6c945" stroke-width="2" stroke-dasharray="7 6"/>`}` : "";

    /* разметка основной дороги: центр прерывается напротив бокового въезда */
    const gapTop = side ? (cfg.exit ? 78 : 62) : 0, gapBot = side ? (cfg.exit ? 122 : 138) : 0;
    const center = (narrow || cfg.lot) ? "" : cfg.onramp
      ? `<line x1="100" y1="0" x2="100" y2="200" stroke="#fff" stroke-width="1.5" stroke-dasharray="7 6" opacity="0.9"/>`
      : (side
      ? `<line x1="100" y1="0" x2="100" y2="${gapTop}" stroke="#f6c945" stroke-width="2" stroke-dasharray="7 6"/><line x1="100" y1="${gapBot}" x2="100" y2="200" stroke="#f6c945" stroke-width="2" stroke-dasharray="7 6"/>`
      : `<line x1="100" y1="0" x2="100" y2="200" stroke="#f6c945" stroke-width="2" stroke-dasharray="7 6"/>`);
    const rightEdge = side
      ? `<line x1="${x1}" y1="0" x2="${x1}" y2="${gapTop}"/><line x1="${x1}" y1="${gapBot}" x2="${x1}" y2="200"/>`
      : `<line x1="${x1}" y1="0" x2="${x1}" y2="200"/>`;

    if (cfg.bus) {
      /* остановка-карман справа, автобус с левым поворотником */
      extra += `<path d="M ${x1} 60 Q ${x1 + 26} 64 ${x1 + 26} 84 L ${x1 + 26} 116 Q ${x1 + 26} 136 ${x1} 140 Z" fill="#5d6770"/>
        <text x="${x1 + 13}" y="150" text-anchor="middle" font-family="Arial" font-weight="700" font-size="7" fill="#1d1f24">BUSS</text>
        ${speedSign(x1 + 28, 30, cfg.limit || 50)}`;
      vehicles += `${pathArrow(`M ${x1 + 13} 80 Q ${x1 + 13} 60 ${x1 - 16} 48 L ${x1 - 16} 20`, BUS)}
        ${carAt(x1 + 13, 104, 0, "B", BUS, true)}
        <circle cx="${x1 + 5}" cy="84" r="3" fill="#ffb300" stroke="#fff" stroke-width="1"/>
        ${pathArrow(`M ${x1 - 16} 158 L ${x1 - 16} 144`, A)}
        ${carAt(x1 - 16, 178, 0, "A", A)}`;
    }
    if (cfg.crossing) {
      extra += `<g fill="#fff" opacity="0.95">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${x0 + 4 + i * 10.5}" y="90" width="6" height="20"/>`).join("")}</g>`;
      vehicles += `${cfg.crossing === "far" ? person(x0 + 9, 100, -1) : person(154, 100, -1)}
        ${pathArrow(`M ${x1 - 16} 158 L ${x1 - 16} 124`, A)}
        ${carAt(x1 - 16, 178, 0, "A", A)}`;
    }
    if (cfg.narrow) {
      /* разъезд на стороне A (справа по ходу) */
      extra += `<rect x="${x1 - 2}" y="88" width="24" height="54" rx="8" fill="#5d6770"/>
        <rect x="${x1 - 2}" y="88" width="24" height="54" rx="8" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.85"/>
        <text x="${x1 + 10}" y="152" text-anchor="middle" font-family="Arial" font-weight="700" font-size="6.5" fill="#1d1f24">MØTEPLASS</text>`;
      vehicles += `${pathArrow(`M 100 158 L 100 148 Q 100 130 ${x1 + 10} 126`, A)}
        ${carAt(100, 178, 0, "A", A)}
        ${pathArrow("M 100 40 L 100 96", B)}
        ${carAt(100, 26, 180, "B", B)}`;
    }
    if (cfg.exit) {
      extra += cfg.exit === "parking"
        ? `<rect x="168" y="86" width="14" height="14" rx="2" fill="#1d5fd6"/><text x="175" y="97" text-anchor="middle" font-family="Arial" font-weight="700" font-size="10" fill="#fff">P</text>
           <g stroke="#fff" stroke-width="1.2" opacity="0.6"><line x1="150" y1="86" x2="150" y2="114"/><line x1="185" y1="86" x2="185" y2="114"/></g>`
        : `<rect x="168" y="84" width="16" height="16" rx="2" fill="#1d5fd6"/><text x="176" y="92" text-anchor="middle" font-family="Arial" font-weight="700" font-size="5" fill="#fff">GATE</text><text x="176" y="98" text-anchor="middle" font-family="Arial" font-weight="700" font-size="5" fill="#fff">TUN</text>`;
      vehicles += `${pathArrow(`M 150 108 L 132 108 Q 116 108 116 90 L 116 50`, A)}
        ${carAt(164, 108, 270, "A", A)}
        ${pathArrow("M 84 40 L 84 140", B)}
        ${carAt(84, 26, 180, "B", B)}
        ${pathArrow(`M 116 172 L 116 150`, "#2aa46a")}
        ${carAt(116, 190, 0, "C", "#2aa46a")}`;
    }
    if (cfg.tcross && !cfg.truck) {
      vehicles += `${pathArrow(`M 170 116 L 140 116 Q 116 116 116 92 L 116 40`, B)}
        ${carAt(182, 116, 270, "B", B)}
        ${pathArrow(`M ${x1 - 16} 166 L ${x1 - 16} 148`, A)}
        ${carAt(x1 - 16, 184, 0, "A", A)}`;
    }
    if (cfg.overtake) {
      /* B впереди даёт левый поворотник и объезжает велосипедиста; A сзади */
      vehicles += `${pathArrow("M 116 104 Q 116 88 102 82 L 102 44", B)}
        ${at(116, 122, 0, "car", "B", B)}
        <circle cx="108" cy="109" r="3" fill="#ffb300" stroke="#fff" stroke-width="1"/>
        ${pathArrow(`M ${x1 - 5} 62 L ${x1 - 5} 40`, BIKE)}
        ${at(x1 - 5, 76, 0, "bike", "S", BIKE)}
        ${pathArrow("M 116 158 L 116 146", A)}
        ${at(116, 178, 0, "car", "A", A)}`;
    }
    if (cfg.night) {
      /* Ночь: пешеход в тёмной одежде идёт по левой обочине навстречу A */
      extra += `<polygon points="106,164 84,56 148,56 126,164" fill="#fff6c8" opacity="0.22"/>`;
      vehicles += `${person(x0 + 6, 96, 90, "#5a616b")}
        ${pathArrow("M 116 158 L 116 140", A)}
        ${at(116, 178, 0, "car", "A", A)}`;
    }
    if (cfg.truck) {
      /* Длинный грузовик впереди сместился влево перед правым поворотом в боковую дорогу */
      vehicles += `${pathArrow("M 106 96 Q 108 100 134 100 L 172 100", B)}
        ${at(106, 122, 0, "truck", "B", B)}
        <circle cx="114" cy="98" r="3" fill="#ffb300" stroke="#fff" stroke-width="1"/>
        ${pathArrow("M 116 168 L 116 156", A)}
        ${at(116, 186, 0, "car", "A", A)}`;
    }
    if (cfg.tram) {
      /* Рельсы посередине, трамвай стоит с открытыми дверями, пассажиры идут к правому тротуару */
      extra += `<g stroke="#9aa3ab" stroke-width="1.5"><line x1="95" y1="0" x2="95" y2="200"/><line x1="105" y1="0" x2="105" y2="200"/></g>`;
      vehicles += `${at(100, 84, 0, "tram", "T", "#2b62c9")}
        <g fill="#ffb300"><rect x="108" y="70" width="2.5" height="8"/><rect x="108" y="90" width="2.5" height="8"/></g>
        ${person(120, 80, 0)}${person(122, 100, 0)}
        ${pathArrow("M 116 158 L 116 144", A)}
        ${at(116, 178, 0, "car", "A", A)}`;
    }
    if (cfg.parkedChild) {
      /* A припаркована у правого края; ребёнок выходит к тротуару, слева проезжает B */
      vehicles += `${at(x1 - 10, 110, 0, "car", "A", A)}
        ${person(x1 + 8, 112, 0)}
        <path d="M ${x1 - 2} 104 L ${x1 + 4} 104" stroke="#1f7a4d" stroke-width="2.5" stroke-linecap="round"/>
        ${pathArrow("M 84 40 L 84 150", B)}
        ${at(84, 26, 180, "car", "B", B)}`;
    }
    if (cfg.onramp) {
      /* автомагистраль: два ряда в одну сторону, полоса разгона справа вливается */
      extra += `<path d="M ${x1} 200 L ${x1 + 30} 200 L ${x1 + 30} 120 Q ${x1 + 30} 90 ${x1} 60 Z" fill="${ASPH}"/>
        <line x1="${x1 + 30}" y1="200" x2="${x1 + 30}" y2="120" stroke="#fff" stroke-width="1.5" opacity="0.85"/>
        <path d="M ${x1 + 30} 120 Q ${x1 + 30} 90 ${x1} 60" stroke="#fff" stroke-width="1.5" fill="none" opacity="0.85"/>
        <line x1="${x1}" y1="60" x2="${x1}" y2="200" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.9"/>
        <g transform="translate(${x0 - 22} 36)"><rect x="-9" y="-9" width="18" height="18" rx="2" fill="#1b5bc7"/><path d="M -5 6 L 0 -6 L 5 6 M -3 1 L 3 1" stroke="#fff" stroke-width="2" fill="none"/></g>`;
      vehicles += `${pathArrow(`M ${x1 + 15} 150 L ${x1 + 15} 118 Q ${x1 + 12} 90 ${x1 - 14} 66 L ${x1 - 14} 30`, A)}
        ${at(x1 + 15, 172, 0, "car", "A", A)}
        ${pathArrow(`M ${x1 - 16} 176 L ${x1 - 16} 40`, B)}
        ${at(x1 - 16, 190, 0, "car", "B", B)}
        ${pathArrow(`M ${x0 + 16} 120 L ${x0 + 16} 20`, "#2aa46a")}
        ${at(x0 + 16, 136, 0, "car", "C", "#2aa46a")}`;
    }
    if (cfg.rail) {
      /* переезд без шлагбаума, мигающий красный */
      extra += `<g stroke="#8a7a5a" stroke-width="3"><line x1="0" y1="92" x2="200" y2="92"/><line x1="0" y1="104" x2="200" y2="104"/></g>
        <g stroke="#6b5f45" stroke-width="2">${[10, 30, 50, 150, 170, 190].map(x => `<line x1="${x}" y1="86" x2="${x}" y2="110"/>`).join("")}</g>
        <g transform="translate(${x1 + 14} 126)"><line x1="0" y1="0" x2="0" y2="14" stroke="#555" stroke-width="2"/><path d="M -8 -12 L 8 4 M -8 4 L 8 -12" stroke="#fff" stroke-width="5"/><path d="M -8 -12 L 8 4 M -8 4 L 8 -12" stroke="#d81e1e" stroke-width="2.5"/><circle cx="-7" cy="-2" r="3.2" fill="#ff2a2a"><animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/></circle><circle cx="7" cy="-2" r="3.2" fill="#ff2a2a"><animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite"/></circle></g>
        <rect x="${x0}" y="114" width="${x1 - x0}" height="3" fill="#fff"/>`;
      vehicles += `${at(160, 98, 90, "tram", "T", "#2b62c9")}
        ${pathArrow(`M ${x1 - 16} 176 L ${x1 - 16} 132`, A)}
        ${at(x1 - 16, 190, 0, "car", "A", A)}`;
    }
    if (cfg.wild) {
      /* знак «Dyr» и лось у обочины в сумерках */
      extra += `<g transform="translate(${x1 + 16} 60)"><line x1="0" y1="0" x2="0" y2="16" stroke="#555" stroke-width="2"/><polygon points="0,-13 12,8 -12,8" fill="#fff" stroke="#d81e1e" stroke-width="2.5" stroke-linejoin="round"/><path d="M -5 6 L -5 -1 L -2 -4 L 2 -4 L 5 -1 L 5 6 M -4 -4 L -7 -8 M 4 -4 L 7 -8" stroke="#111" stroke-width="1.8" fill="none"/></g>
        <g transform="translate(${x1 + 14} 118)" fill="#3a2e22"><path d="M -14 8 L -14 -4 L -8 -8 L 4 -8 L 12 -14 L 16 -12 L 12 -6 L 12 8 L 8 8 L 8 0 L -8 0 L -8 8 Z"/><path d="M 8 -14 L 6 -22 L 10 -18 L 12 -24 L 14 -16" stroke="#3a2e22" stroke-width="2" fill="none"/></g>
        ${pathArrow(`M ${x1 + 2} 122 L ${x1 - 18} 122`, "#3a2e22")}`;
      vehicles += `${pathArrow(`M ${x1 - 16} 176 L ${x1 - 16} 150`, A)}
        ${at(x1 - 16, 190, 0, "car", "A", A)}`;
    }
    if (cfg.bridge) {
      /* мост через воду: настил и перила; иней на мосту */
      extra += `<rect x="0" y="70" width="200" height="60" fill="#9fc4e8"/>
        <rect x="${x0 - 8}" y="70" width="${x1 - x0 + 16}" height="60" fill="#8d97a1"/>
        <rect x="${x0}" y="70" width="${x1 - x0}" height="60" fill="#c9d3dc"/>
        <g stroke="#fff" stroke-width="1" opacity="0.9">${[76, 88, 100, 112, 124].map(y => `<line x1="${x0 + 6}" y1="${y}" x2="${x1 - 6}" y2="${y}" stroke-dasharray="2 6"/>`).join("")}</g>
        <g stroke="#5d6770" stroke-width="3"><line x1="${x0 - 6}" y1="70" x2="${x0 - 6}" y2="130"/><line x1="${x1 + 6}" y1="70" x2="${x1 + 6}" y2="130"/></g>
        <text x="${x1 + 12}" y="104" font-family="Arial" font-weight="700" font-size="7" fill="#1d1f24">-2°</text>`;
      vehicles += `${pathArrow(`M ${x1 - 16} 176 L ${x1 - 16} 148`, A)}
        ${at(x1 - 16, 190, 0, "car", "A", A)}`;
    }
    if (cfg.rain) {
      /* ливень: лужа на полосе, машина теряет сцепление */
      extra += `<ellipse cx="${x1 - 16}" cy="96" rx="22" ry="14" fill="#7fb0e0" opacity="0.7"/>
        <g stroke="#7fb0e0" stroke-width="1.5" opacity="0.8">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${12 + i * 24}" y1="${8 + (i % 3) * 6}" x2="${8 + i * 24}" y2="${20 + (i % 3) * 6}"/>`).join("")}</g>`;
      vehicles += `${pathArrow(`M ${x1 - 16} 160 L ${x1 - 16} 118`, A)}
        <path d="M ${x1 - 16} 118 Q ${x1 - 8} 100 ${x1 - 20} 84" stroke="${A}" stroke-width="2" stroke-dasharray="3 3" fill="none" opacity="0.6"/>
        ${at(x1 - 16, 176, 0, "car", "A", A)}`;
    }
    if (cfg.roadwork) {
      /* дорожные работы: жёлтый временный знак 50 рядом с постоянным 80, конусы, сужение */
      extra += `<rect x="${x1 - 18}" y="40" width="18" height="70" fill="#8a949c" opacity="0.6"/>
        <g fill="#f0a020">${[44, 60, 76, 92, 108].map(y => `<polygon points="${x1 - 18},${y + 8} ${x1 - 14},${y} ${x1 - 10},${y + 8}"/>`).join("")}</g>
        <g transform="translate(${x1 + 14} 30)"><line x1="0" y1="0" x2="0" y2="16" stroke="#555" stroke-width="2"/><rect x="-12" y="-12" width="24" height="24" fill="#f5d800"/><circle r="9" fill="#f5d800" stroke="#d81e1e" stroke-width="2.5"/><text y="3.5" text-anchor="middle" font-family="Arial" font-weight="700" font-size="8" fill="#111">50</text></g>
        ${speedSign(x1 + 14, 140, 80)}`;
      vehicles += `${pathArrow(`M ${x1 - 16} 176 L ${x1 - 16} 120 Q ${x1 - 16} 112 ${x1 - 26} 108 L ${x1 - 26} 44`, A)}
        ${at(x1 - 16, 190, 0, "car", "A", A)}`;
    }
    if (cfg.tunnel) {
      /* въезд в тоннель в солнечный день */
      extra += `<rect x="0" y="0" width="200" height="90" fill="#8b8f93"/>
        <path d="M ${x0 - 10} 90 L ${x0 - 10} 40 Q 100 -10 ${x1 + 10} 40 L ${x1 + 10} 90 Z" fill="#1b1e24"/>
        <circle cx="176" cy="132" r="12" fill="#ffd54a"/><g stroke="#ffd54a" stroke-width="2">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="${176 + 16 * Math.cos(a * Math.PI / 180)}" y1="${132 + 16 * Math.sin(a * Math.PI / 180)}" x2="${176 + 20 * Math.cos(a * Math.PI / 180)}" y2="${132 + 20 * Math.sin(a * Math.PI / 180)}"/>`).join("")}</g>`;
      vehicles += `${pathArrow(`M ${x1 - 16} 176 L ${x1 - 16} 100`, A)}
        ${at(x1 - 16, 190, 0, "car", "A", A)}`;
    }
    if (cfg.rest) {
      /* rasteplass: синий знак и карман справа */
      extra += `<path d="M ${x1} 70 Q ${x1 + 30} 74 ${x1 + 30} 100 L ${x1 + 30} 130 Q ${x1 + 30} 150 ${x1} 154 Z" fill="${ASPH}"/>
        <g transform="translate(${x1 + 15} 40)"><line x1="0" y1="0" x2="0" y2="16" stroke="#555" stroke-width="2"/><rect x="-11" y="-11" width="22" height="22" rx="2" fill="#1b5bc7"/><path d="M -7 4 L 7 4 M -5 4 L -5 -3 M 5 4 L 5 -3 M -8 -3 L 8 -3 M -3 -3 L -3 -7 M 3 -3 L 3 -7" stroke="#fff" stroke-width="1.6" fill="none"/></g>
        <text x="${x1 + 15}" y="164" text-anchor="middle" font-family="Arial" font-weight="700" font-size="6.5" fill="#1d1f24">RASTEPLASS</text>`;
      vehicles += `${pathArrow(`M ${x1 - 16} 176 L ${x1 - 16} 150 Q ${x1 - 16} 120 ${x1 + 14} 112`, A)}
        ${at(x1 - 16, 190, 0, "car", "A", A)}`;
    }
    if (cfg.trailer) {
      /* машина с прицепом сдаёт задом в узкий въезд справа: прицеп идёт в другую сторону, чем руль */
      extra += `<rect x="${x1}" y="96" width="${200 - x1}" height="28" fill="${ASPH}"/>
        <rect x="${x1}" y="90" width="${200 - x1}" height="6" fill="${WALK}"/><rect x="${x1}" y="124" width="${200 - x1}" height="6" fill="${WALK}"/>`;
      vehicles += `${at(x1 - 16, 74, 0, "car", "A", A)}
        <g transform="translate(${x1 - 10} 100) rotate(-35)"><rect x="-7" y="-14" width="14" height="24" rx="2" fill="#8a949c" stroke="#fff" stroke-width="1"/><line x1="0" y1="-14" x2="0" y2="-24" stroke="#555" stroke-width="2"/></g>
        ${pathArrow(`M ${x1 - 4} 112 L ${x1 + 34} 110`, "#8a949c")}
        <path d="M ${x1 - 16} 56 Q ${x1 - 30} 50 ${x1 - 34} 62" stroke="${A}" stroke-width="2" fill="none"/><polygon points="${x1 - 36},${58} ${x1 - 32},${66} ${x1 - 28},${60}" fill="${A}"/>`;
    }
    if (cfg.lot) {
      /* парковка: A задела B, обе стоят */
      extra += `<rect x="0" y="0" width="200" height="200" fill="#8a949c"/>
        <g stroke="#fff" stroke-width="1.5" opacity="0.8">${[20, 56, 92, 128, 164].map(x => `<line x1="${x}" y1="30" x2="${x}" y2="90"/><line x1="${x}" y1="110" x2="${x}" y2="170"/>`).join("")}</g>
        <rect x="150" y="12" width="14" height="14" rx="2" fill="#1d5fd6"/><text x="157" y="23" text-anchor="middle" font-family="Arial" font-weight="700" font-size="10" fill="#fff">P</text>
        <g fill="#f5d800"><polygon points="70,86 74,80 78,86 82,80 86,86"/></g>`;
      vehicles += `${at(74, 60, 0, "car", "B", B)}
        <g transform="translate(88 92) rotate(20)">${body("car", "A", A, 20)}</g>`;
    }
    if (cfg.bikeLane) {
      /* велополоса вдоль правого края, прерывается у бокового въезда */
      const bl = `<rect x="${x1 - 10}" y="0" width="10" height="${gapTop}" fill="#b8503c" opacity="0.85"/><rect x="${x1 - 10}" y="${gapBot}" width="10" height="${200 - gapBot}" fill="#b8503c" opacity="0.85"/>
        <line x1="${x1 - 10}" y1="0" x2="${x1 - 10}" y2="${gapTop}" stroke="#fff" stroke-width="1.2" stroke-dasharray="4 4"/><line x1="${x1 - 10}" y1="${gapBot}" x2="${x1 - 10}" y2="200" stroke="#fff" stroke-width="1.2" stroke-dasharray="4 4"/>
        <g fill="none" stroke="#fff" stroke-width="1.2"><circle cx="${x1 - 7.5}" cy="30" r="2.2"/><circle cx="${x1 - 2.5}" cy="30" r="2.2"/><path d="M ${x1 - 7.5} 30 L ${x1 - 5} 25 L ${x1 - 2.5} 30 M ${x1 - 5} 25 L ${x1 - 4} 22"/></g>`;
      extra += bl;
      vehicles += `${pathArrow(`M 108 166 L 108 130 Q 108 100 140 100 L 172 100`, A)}
        ${carAt(108, 184, 0, "A", A)}
        ${pathArrow(`M ${x1 - 5} 158 L ${x1 - 5} 136`, BIKE)}
        ${bikeAt(x1 - 5, 170, 0, "B", BIKE)}`;
    }

    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="scene-icon">
      <rect width="200" height="200" fill="${GRASS}"/>
      <rect x="${x0 - 6}" y="0" width="${x1 - x0 + 12}" height="200" fill="${WALK}"/>
      ${sideRoad}
      <rect x="${x0}" y="0" width="${x1 - x0}" height="200" fill="${ASPH}"/>
      ${extra}
      ${cfg.lot ? "" : `<g stroke="#fff" stroke-width="1.5" opacity="0.85">
        <line x1="${x0}" y1="0" x2="${x0}" y2="200"/>
        ${rightEdge}
      </g>`}
      ${center}
      ${vehicles}
    </svg>`;
  }
  window.ROAD = road;

  /* Вид сбоку: машина стоит на уклоне носом вниз, справа кювет, колёса повёрнуты к нему */
  function hillScene() {
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="scene-icon">
      <rect width="200" height="200" fill="#dfe9f5"/>
      <path d="M 0 70 L 200 130 L 200 200 L 0 200 Z" fill="#6f7a52"/>
      <path d="M 0 70 L 200 130 L 200 138 L 0 78 Z" fill="#5d6770"/>
      <path d="M 150 118 L 176 150 L 200 156 L 200 130 Z" fill="#3e4a2c"/>
      <text x="168" y="172" text-anchor="middle" font-family="Arial" font-weight="700" font-size="7" fill="#fff">GRØFT</text>
      <g transform="translate(90 92) rotate(16.7)">
        <rect x="-30" y="-14" width="60" height="16" rx="4" fill="#1d5fd6"/>
        <rect x="-18" y="-24" width="30" height="12" rx="4" fill="#1d5fd6"/>
        <rect x="-14" y="-22" width="10" height="8" rx="1" fill="#cfe4ff"/>
        <circle cx="-18" cy="4" r="6" fill="#1d1f24"/><circle cx="18" cy="4" r="6" fill="#1d1f24"/>
        <ellipse cx="18" cy="4" rx="3" ry="6" fill="#8a949c"/>
        <text x="0" y="-2" text-anchor="middle" font-family="Arial" font-weight="700" font-size="9" fill="#fff">A</text>
      </g>
      <path d="M 118 118 Q 140 122 152 140" stroke="#1f7a4d" stroke-width="2.5" fill="none" stroke-dasharray="4 3"/>
      <polygon points="148,132 156,144 144,144" fill="#1f7a4d"/>
      <text x="30" y="40" font-family="Arial" font-weight="700" font-size="8" fill="#1d1f24">↓ nedover</text>
    </svg>`;
  }
  window.HILL_SCENE = hillScene;

  function q(id, image, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "sit-" + id, topic: "situational", type: "single-choice",
      prompt_no, prompt_ru, image,
      options: opts.map((o, i) => ({ text_no: o[0], text_ru: o[1], correct: i === 0, why_no: o[2] || null, why_ru: o[3] || null })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  function qm(id, image, prompt_no, prompt_ru, opts, explanation_no, explanation_ru, tip_ru) {
    return {
      id: "sit-" + id, topic: "situational", type: "multi-choice", multi: true,
      prompt_no, prompt_ru, image,
      options: opts.map(o => ({ text_no: o[0], text_ru: o[1], correct: !!o[2], why_no: o[3] || null, why_ru: o[4] || null })),
      explanation_no, explanation_ru, tip_ru
    };
  }

  window.QUESTION_DATA = window.QUESTION_DATA || {};
  window.QUESTION_DATA.situational = [

    q("001", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }] }),
      "Du (A) kjører rett fram i et kryss uten skilt. Bil B kommer fra høyre. Hvem har vikeplikt?",
      "Ты (A) едешь прямо через перекрёсток без знаков. Машина B едет справа. Кто должен уступить?",
      [
        ["Du (A) må vike for B — høyreregelen", "Ты (A) уступаешь B — правило правой руки"],
        ["B må vike fordi du kjører rett fram", "B уступает, потому что ты едешь прямо", "Å kjøre rett fram gir ingen forrang i kryss uten skilt, høyreregelen avgjør uansett retning.", "Движение прямо не даёт приоритета на перекрёстке без знаков — решает правило правой руки, независимо от направления."],
        ["Den som kommer først kjører først", "Кто первый приехал, тот и едет", "I Norge avgjør ikke ankomsttidspunktet, høyreregelen gjelder uansett hvem som kom først.", "В Норвегии очерёдность прибытия роли не играет — действует правило правой руки, кто бы ни подъехал первым."],
        ["Ingen har vikeplikt", "Никто не обязан уступать", "I ethvert kryss uten skilt gjelder høyreregelen, noen har alltid vikeplikt.", "На любом перекрёстке без знаков действует правило правой руки — кто-то всегда обязан уступить."]
      ],
      "I kryss uten skilt eller lys gjelder høyreregelen: du har vikeplikt for trafikk fra høyre.",
      "На перекрёстке без знаков и светофора действует правило правой руки: уступаешь тем, кто справа.",
      "«Прямо» не даёт приоритета. Только знаки, светофор или сторона (право) решают, кто едет первым."),

    q("002", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }] }),
      "Kryss uten skilt. Bil B kommer fra venstre. Hva gjør du?",
      "Перекрёсток без знаков. Машина B едет слева. Что делаешь?",
      [
        ["Kjører — B har vikeplikt for meg", "Еду — B должна уступить мне"],
        ["Stopper og venter på B", "Останавливаюсь и жду B", "Du har forrang siden du kommer fra høyre for B, det er ikke nødvendig å stoppe og vente.", "У тебя приоритет, ведь ты справа от B — останавливаться и ждать не нужно."],
        ["Blinker og lar B kjøre først", "Мигаю фарами и пропускаю B", "Å blinke med lysene er ikke et offisielt signal og skaper bare forvirring, du har uansett forrang.", "Мигание фарами — не официальный сигнал и только сбивает с толку, у тебя и так приоритет."],
        ["Kjører fortere for å komme foran", "Ускоряюсь, чтобы проехать первым", "Du trenger ikke skynde deg, du har allerede forrang etter høyreregelen.", "Спешить незачем — приоритет у тебя и так есть по правилу правой руки."]
      ],
      "Du er til høyre for B, så B må vike for deg. Men vær alltid klar til å bremse hvis B ikke viker.",
      "Ты справа от B, значит B уступает тебе. Но всегда будь готов затормозить, если B не уступит.",
      "Иметь приоритет ≠ можно не смотреть. На экзамене ценится «kjøre defensivt» — ехать с запасом."),

    q("003", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], signs: { south: "yield" } }),
      "Du (A) har vikepliktskilt. Bil B kommer fra høyre på kryssende vei. Hva gjør du?",
      "У тебя (A) знак «уступи дорогу». Машина B едет справа по пересекаемой дороге. Что делаешь?",
      [
        ["Senker farten og viker for B", "Снижаю скорость и уступаю B"],
        ["Kjører — jeg er allerede nær krysset", "Еду — я уже близко к перекрёстку", "Nærhet til krysset endrer ikke vikeplikten, du må uansett vike for trafikk på kryssende vei.", "Близость к перекрёстку ничего не меняет — обязанность уступить действует в любом случае."],
        ["Stopper helt selv om ingen kommer", "Полностью останавливаюсь, даже если никого нет", "Ved vikeplikt er det ikke krav om full stopp, det holder å senke farten hvis veien er fri.", "При знаке «уступи дорогу» полная остановка не обязательна — достаточно снизить скорость, если дорога свободна."],
        ["Tuter for å varsle B", "Сигналю, чтобы предупредить B", "Signalhorn erstatter ikke vikeplikten, du skal senke farten og vike, ikke varsle med lyd.", "Гудок не заменяет обязанность уступить — нужно снизить скорость и уступить, а не сигналить."]
      ],
      "Vikeplikt betyr at du må vike for ALL trafikk på kryssende vei — både fra høyre og venstre. Du trenger ikke stoppe hvis veien er fri.",
      "«Уступи дорогу» означает: уступаешь ВСЕМ на пересекаемой дороге — и справа, и слева. Останавливаться не обязательно, если дорога свободна.",
      "Vikeplikt ≠ Stopp. При vikeplikt можно проехать не останавливаясь, если никому не мешаешь."),

    q("004", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], signs: { south: "priority" } }),
      "Du (A) kjører på forkjørsvei. Bil B kommer fra høyre fra sidevei. Hvem har vikeplikt?",
      "Ты (A) на главной дороге. Машина B выезжает справа с второстепенной. Кто уступает?",
      [
        ["B må vike — jeg er på forkjørsvei", "B уступает — я на главной дороге"],
        ["Jeg må vike — B kommer fra høyre", "Я уступаю — B справа", "På forkjørsvei gjelder ikke høyreregelen, det er B som må vike for deg.", "На главной дороге правило правой руки не действует — уступить должен B, а не ты."],
        ["Den som er størst kjører først", "Кто больше, тот и едет", "Kjøretøyets størrelse har ingen betydning, forkjørsretten avgjøres av skiltingen.", "Размер машины тут ни при чём — приоритет определяется знаком."],
        ["Begge må stoppe", "Оба должны остановиться", "Bare den som kommer fra sideveien har vikeplikt, du på forkjørsveien trenger ikke stoppe.", "Уступить обязан только тот, кто со второстепенной, тебе на главной останавливаться не нужно."]
      ],
      "På forkjørsvei gjelder ikke høyreregelen. Trafikk fra sideveier må vike for deg.",
      "На главной дороге правило правой руки не действует. Транспорт с боковых дорог уступает тебе.",
      "Жёлтый ромб «отключает» правило правой руки. Это одна из главных ловушек на теории."),

    q("005", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }] }),
      "Du (A) skal svinge til venstre. Bil B kommer rett imot og skal rett fram. Hvem viker?",
      "Ты (A) поворачиваешь налево. Машина B едет навстречу прямо. Кто уступает?",
      [
        ["Jeg viker — møtende trafikk rett fram har forrang", "Я уступаю — встречный, едущий прямо, имеет преимущество"],
        ["B viker — jeg var først i krysset", "B уступает — я первый на перекрёстке", "Rekkefølgen inn i krysset er ikke avgjørende, den som svinger til venstre skal alltid vike for møtende som kjører rett fram.", "Порядок въезда на перекрёсток тут не важен — поворачивающий налево всегда уступает встречному, едущему прямо."],
        ["Jeg svinger raskt før B kommer", "Быстро поворачиваю до приезда B", "Å prøve å rekke unna før møtende trafikk er farlig og bryter med vikeplikten ved venstresving.", "Пытаться проскочить перед встречным опасно и нарушает обязанность уступить при повороте налево."],
        ["Høyreregelen avgjør", "Решает правило правой руки", "Høyreregelen gjelder ikke her, det er den spesielle regelen om venstresving mot møtende trafikk som avgjør.", "Правило правой руки тут ни при чём — действует особое правило про поворот налево навстречу транспорту."]
      ],
      "Når du svinger til venstre, må du vike for møtende trafikk som kjører rett fram eller svinger til høyre.",
      "При повороте налево ты уступаешь встречному транспорту, который едет прямо или поворачивает направо.",
      "Поворот налево — самый «слабый» манёвр на перекрёстке: уступаешь встречным, пешеходам, велосипедистам."),

    q("006", scene({ you: { from: "south", to: "east" }, others: [{ from: "north", to: "east" }] }),
      "Du (A) svinger til høyre. Møtende bil B svinger til venstre inn på samme vei. Hvem har forrang?",
      "Ты (A) поворачиваешь направо. Встречная машина B поворачивает налево на ту же дорогу. У кого преимущество?",
      [
        ["Jeg — den som svinger til venstre må vike", "У меня — поворачивающий налево уступает"],
        ["B — den som svinger til venstre har forrang", "У B — поворачивающий налево имеет преимущество", "Det er faktisk omvendt: høyresving går foran venstresving, ikke motsatt.", "На самом деле наоборот: поворот направо важнее поворота налево, а не наоборот."],
        ["Vi må begge stoppe og avtale", "Оба останавливаемся и договариваемся", "Det finnes en fast regel for dette, dere trenger ikke stoppe og avtale seg imellom.", "Для этого есть чёткое правило, договариваться и останавливаться не нужно."],
        ["Den raskeste bilen", "У более быстрой машины", "Farten på bilene avgjør ikke forrang, det er svingretningen som teller.", "Скорость машин тут ни при чём — важно направление поворота."]
      ],
      "Høyresving går foran venstresving. B må vente til du har svingt.",
      "Поворот направо важнее поворота налево. B ждёт, пока ты повернёшь.",
      "Правило простое: налево — уступаешь всем встречным, включая тех, кто поворачивает направо."),

    q("007", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], roundabout: true }),
      "Du (A) skal inn i en rundkjøring. Bil B er allerede inne i rundkjøringen. Hva gjør du?",
      "Ты (A) въезжаешь на круг. Машина B уже на кругу. Что делаешь?",
      [
        ["Viker for B — trafikk i rundkjøringen har forrang", "Уступаю B — те, кто на кругу, имеют преимущество"],
        ["Kjører inn — B kommer fra venstre", "Въезжаю — B едет слева", "I rundkjøring gjelder ikke høyreregelen, trafikk som allerede er inne har alltid forrang.", "На круге правило правой руки не действует — приоритет всегда у тех, кто уже на кругу."],
        ["Stopper alltid før rundkjøringen", "Всегда останавливаюсь перед кругом", "Det er ikke krav om full stopp, det holder å vike hvis noen er i rundkjøringen.", "Полная остановка не обязательна — достаточно уступить, если на кругу кто-то есть."],
        ["Kjører inn og tuter", "Въезжаю и сигналю", "Signalhorn erstatter ikke vikeplikten for trafikk som allerede er i rundkjøringen.", "Гудок не заменяет обязанность уступить тем, кто уже на кругу."]
      ],
      "Ved rundkjøring er det alltid vikeplikt for trafikk som allerede er i rundkjøringen, uansett hvor den kommer fra.",
      "На круговом движении всегда уступаешь тем, кто уже на кругу, откуда бы они ни ехали.",
      "Круг — исключение из правила правой руки: там уступаешь тем, кто слева (уже на кругу)."),

    q("008", scene({ you: { from: "south", to: "east" }, roundabout: true }),
      "Du kjører ut av rundkjøringen i første avkjøring (til høyre). Skal du bruke blinklys?",
      "Ты выезжаешь с круга на первом съезде (направо). Нужно ли включать поворотник?",
      [
        ["Ja — høyre blinklys når jeg skal ut", "Да — правый поворотник при выезде"],
        ["Nei — blinklys brukes ikke i rundkjøring", "Нет — на кругу поворотники не используются", "Blinklys skal tvert imot brukes i rundkjøring, spesielt høyre blinklys ved utkjøring.", "Поворотник наоборот нужен на кругу, особенно правый при выезде."],
        ["Ja — venstre blinklys", "Да — левый поворотник", "Venstre blinklys brukes ved innkjøring hvis du skal langt rundt, ved utkjøring skal du bruke høyre.", "Левый поворотник — для въезда, если едешь далеко по кругу, а при выезде нужен правый."],
        ["Bare hvis det er andre biler", "Только если есть другие машины", "Regelen om blinklys gjelder uansett om det er andre biler til stede eller ikke.", "Правило про поворотник действует независимо от того, есть ли рядом другие машины."]
      ],
      "Du skal alltid gi tegn med høyre blinklys når du forlater rundkjøringen. Skal du langt rundt, bruker du venstre blinklys inn.",
      "Всегда включай правый поворотник при выезде с круга. Если едешь далеко по кругу (налево) — при въезде включи левый.",
      "Правило «правый при выезде» экзаменатор проверяет каждый раз. Забыл — это ошибка на практике."),

    q("009", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], signs: { south: "stop" } }),
      "Du (A) har stoppskilt. Veien ser tom ut, men B nærmer seg fra venstre. Hva gjør du?",
      "У тебя (A) знак STOP. Дорога кажется пустой, но B приближается слева. Что делаешь?",
      [
        ["Stopper helt ved stopplinjen, ser, og viker for B", "Полностью останавливаюсь у стоп-линии, смотрю и уступаю B"],
        ["Senker farten og kjører — veien er nesten tom", "Снижаю скорость и еду — дорога почти пустая", "Stoppskilt krever full stopp, det holder ikke å bare senke farten selv om veien virker tom.", "Знак STOP требует полной остановки — снизить скорость недостаточно, даже если дорога кажется пустой."],
        ["Kjører fordi B kommer fra venstre", "Еду, потому что B слева", "Ved stoppskilt spiller det ingen rolle om trafikken kommer fra venstre eller høyre, du skal uansett stoppe og vike.", "У знака STOP не важно, справа или слева едет машина — в любом случае нужно остановиться и уступить."],
        ["Stopper midt i krysset", "Останавливаюсь посреди перекрёстка", "Du skal stoppe ved stopplinjen før krysset, ikke midt i krysset.", "Останавливаться нужно у стоп-линии перед перекрёстком, а не посреди него."]
      ],
      "Stoppskilt krever full stopp uansett. Etter stoppet har du vikeplikt for all trafikk på kryssende vei.",
      "Знак STOP требует полной остановки в любом случае. После остановки уступаешь всем на пересекаемой дороге.",
      "У STOP «слева/справа» неважно — уступаешь всем. Твоя обязанность = остановиться + уступить."),

    q("010", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], lights: { south: "green", east: "red" } }),
      "Du kjører rett fram og kommer til et kryss der trafikklyset er grønt for deg. Bil B fra høyre har rødt. Hva gjelder?",
      "Ты едешь прямо, для тебя зелёный. Машина B справа — на красный. Что действует?",
      [
        ["Jeg kjører — lyssignal går foran høyreregelen", "Еду — светофор важнее правила правой руки"],
        ["Jeg viker for B fordi B er til høyre", "Уступаю B, потому что B справа", "Høyreregelen gjelder ikke når det er trafikklys, lyset avgjør, og grønt betyr at du har forrang.", "Правило правой руки не действует при работающем светофоре — решает сигнал, и зелёный даёт тебе приоритет."],
        ["Jeg stopper for sikkerhets skyld", "Останавливаюсь на всякий случай", "Grønt lys gir deg rett til å kjøre, unødvendig stopp kan forvirre trafikken bak deg.", "Зелёный даёт право ехать — ненужная остановка может запутать машины позади."],
        ["Grønt lys betyr bare at jeg KAN kjøre hvis B viker", "Зелёный значит, что я могу ехать только если B уступит", "Grønt lys gir deg forrang direkte, det er ikke betinget av at B velger å vike.", "Зелёный сразу даёт приоритет, это не зависит от того, уступит ли B."]
      ],
      "Trafikklys går foran både skilt og høyreregelen. Grønt lys = du kan kjøre, men fortsatt med aktsomhet.",
      "Светофор важнее и знаков, и правила правой руки. Зелёный — можно ехать, но с осторожностью.",
      "Иерархия: указания полицейского > светофор > знаки > правило правой руки."),

    q("011", road({ crossing: true }),
      "Du nærmer deg et gangfelt. En fotgjenger står på fortauet og ser ut til å ville krysse. Hva gjør du?",
      "Ты подъезжаешь к пешеходному переходу. Пешеход стоит на тротуаре и, похоже, хочет перейти. Что делаешь?",
      [
        ["Senker farten og stopper for å slippe fotgjengeren over", "Снижаю скорость и останавливаюсь, чтобы пропустить"],
        ["Kjører — fotgjengeren er ikke i veien ennå", "Еду — пешеход ещё не на дороге", "Vikeplikten gjelder også for fotgjengere som er på vei ut i gangfeltet, ikke bare de som allerede står der.", "Обязанность уступить действует и для пешеходов, которые только собираются ступить на переход, а не только для тех, кто уже там."],
        ["Tuter så fotgjengeren venter", "Сигналю, чтобы пешеход подождал", "Signalhorn skal ikke brukes for å presse fotgjengeren til å vente, du skal selv stoppe.", "Гудок нельзя использовать, чтобы заставить пешехода подождать — останавливаться должен ты сам."],
        ["Kjører raskere for å passere før fotgjengeren går", "Ускоряюсь, чтобы проехать до него", "Å øke farten nær et gangfelt er farlig og bryter direkte med vikeplikten for fotgjengere.", "Ускоряться рядом с переходом опасно и прямо нарушает обязанность уступить пешеходу."]
      ],
      "Du har vikeplikt for fotgjengere som er i gangfeltet ELLER på vei ut i det. Vis tydelig at du stopper.",
      "Ты уступаешь пешеходу, который на переходе ИЛИ собирается ступить на него. Покажи явно, что останавливаешься.",
      "В Норвегии нормально уступать пешеходу, который только собирается перейти. Так и на экзамене ожидают."),

    q("012", road({ narrow: true }),
      "Smal vei med møteplass på din side. Bil B kommer imot. Hvem skal vente?",
      "Узкая дорога, карман для разъезда на твоей стороне. Машина B едет навстречу. Кто ждёт?",
      [
        ["Jeg — møteplassen er på min side", "Я — карман на моей стороне"],
        ["B — jeg kom først", "B — я приехал первым", "Rekkefølgen er ikke avgjørende, det er hvem møteplassen befinner seg hos som bestemmer hvem som venter.", "Очерёдность прибытия тут не важна — решает, у кого из двоих находится карман."],
        ["Den som har størst bil", "У кого машина больше", "Bilens størrelse avgjør ikke, det er plasseringen av møteplassen som bestemmer hvem som venter.", "Размер машины ни при чём — решает расположение кармана."],
        ["Ingen — vi klemmer oss forbi", "Никто — протискиваемся", "Å presse seg forbi på en smal vei er farlig, den med møteplass på sin side skal bruke den.", "Протискиваться на узкой дороге опасно — тот, у кого карман на своей стороне, должен им воспользоваться."]
      ],
      "Trafikkreglene § 7 nr. 6: kjørende som møtes, skal i god tid vike tilstrekkelig til høyre og om nødvendig stanse. Møteplassen (skilt 524) brukes av den som har den på sin høyre side. Du rygger ikke inn i møteplass på motsatt side.",
      "На узкой дороге используешь карман, который на твоей стороне. Задним ходом в карман на противоположной стороне не заезжают.",
      "На норвежских узких дорогах (særlig på Vestlandet) знак «M» = møteplass. Кому он ближе, тот и ждёт."),

    q("013", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }, { from: "west", to: "east" }] }),
      "Kryss uten skilt. B kommer fra høyre, C fra venstre. I hvilken rekkefølge kjører dere?",
      "Перекрёсток без знаков. B справа, C слева. В каком порядке все проезжают?",
      [
        ["B, så jeg (A), så C", "B, потом я (A), потом C"],
        ["Jeg (A), så B, så C", "Я (A), потом B, потом C", "Du har B til høyre for deg, så B kjører først, ikke du.", "Справа от тебя B, поэтому первым едет он, а не ты."],
        ["C, så B, så jeg (A)", "C, потом B, потом я (A)", "Rekkefølgen er feil snudd, det er B som har ingen til høyre og derfor kjører først.", "Порядок перепутан наоборот — первым едет именно B, у которого справа никого нет."],
        ["Alle kjører samtidig", "Все едут одновременно", "Høyreregelen setter opp en bestemt rekkefølge, dere kan ikke kjøre samtidig.", "Правило правой руки задаёт чёткую очерёдность, ехать одновременно нельзя."]
      ],
      "Høyreregelen i kjede: B har ingen til høyre og kjører først. Du viker for B, C viker for deg.",
      "Правило правой руки цепочкой: у B никого справа — едет первым. Ты уступаешь B, C уступает тебе.",
      "Найди того, у кого справа никого нет — он едет первым. Дальше по цепочке."),

    q("014", road({ exit: "parking" }),
      "Du kjører ut fra en parkeringsplass og inn på veien. Hvem har vikeplikt?",
      "Ты выезжаешь с парковки на дорогу. Кто уступает?",
      [
        ["Jeg — den som kjører ut fra parkeringsplass, gårdsvei eller bensinstasjon viker for all trafikk", "Я — выезжающий с парковки, двора или заправки уступает всем"],
        ["Trafikken på veien viker for meg", "Транспорт на дороге уступает мне", "Det er omvendt: den som kjører ut fra parkeringsplass har alltid vikeplikt for veitrafikken.", "Всё наоборот: выезжающий с парковки всегда уступает транспорту на дороге."],
        ["Høyreregelen gjelder", "Действует правило правой руки", "Høyreregelen gjelder mellom likestilte veier, ikke ved utkjøring fra parkeringsplass, der du alltid viker.", "Правило правой руки действует между равнозначными дорогами, а не при выезде с парковки, где ты всегда уступаешь."],
        ["Ingen har vikeplikt", "Никто не уступает", "Den som kjører ut fra parkeringsplass har alltid vikeplikt, det finnes ikke situasjon uten den.", "У выезжающего с парковки всегда есть обязанность уступить — ситуации без неё тут не бывает."]
      ],
      "Utkjøring fra parkeringsplass, gårdsvei, bensinstasjon o.l. gir alltid vikeplikt for trafikken på veien — også for fotgjengere på fortauet.",
      "Выезд с парковки, двора, заправки — ты всегда уступаешь транспорту на дороге и пешеходам на тротуаре.",
      "Здесь правило правой руки НЕ работает. Выезжающий со «второстепенной территории» уступает всем."),

    q("015", road({ bus: true, limit: 50 }),
      "En buss med blinklys signaliserer at den vil kjøre ut fra holdeplass i 50-sone. Hva gjør du?",
      "Автобус с поворотником показывает, что выезжает с остановки в зоне 50 км/ч. Что делаешь?",
      [
        ["Slipper bussen ut — den har forrang i 60-sone eller lavere", "Пропускаю автобус — он имеет преимущество в зоне до 60 км/ч"],
        ["Kjører forbi — bussen må vente", "Проезжаю мимо — автобус ждёт", "I 60-sone eller lavere er det du som skal slippe bussen fram, ikke omvendt.", "В зоне 60 и ниже именно ты обязан пропустить автобус, а не наоборот."],
        ["Tuter for å vise at jeg kommer", "Сигналю, что еду", "Signalhorn erstatter ikke plikten til å slippe bussen fram, du skal senke farten og vente.", "Гудок не заменяет обязанность пропустить автобус — нужно снизить скорость и подождать."],
        ["Stopper helt bak bussen", "Полностью останавливаюсь за автобусом", "Full stopp er ikke nødvendig, det holder å senke farten og la bussen kjøre ut.", "Полная остановка не обязательна, достаточно снизить скорость и дать автобусу выехать."]
      ],
      "Der fartsgrensen er 60 km/t eller lavere, skal du slippe fram buss som gir tegn om å kjøre ut fra holdeplass.",
      "Там, где ограничение 60 км/ч или ниже, ты обязан пропустить автобус, который показывает поворотником выезд с остановки.",
      "Это прямое правило норвежских ПДД — автобус в городе имеет преимущество при выезде с остановки."),

    q("016", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west", kind: "emergency" }] }),
      "Du hører sirene og ser en utrykningsbil med blålys komme fra høyre. Hva gjør du?",
      "Слышишь сирену и видишь машину с мигалками справа. Что делаешь?",
      [
        ["Gir fri vei — stopper eller kjører til siden trygt", "Освобождаю дорогу — безопасно останавливаюсь или сдвигаюсь в сторону"],
        ["Kjører videre — jeg hadde grønt lys", "Еду дальше — у меня был зелёный", "Utrykningskjøretøy med blålys har forrang foran vanlig lyssignal, grønt lys fritar deg ikke fra å gi fri vei.", "У спецтранспорта с мигалками приоритет выше обычного светофора — зелёный не освобождает от обязанности уступить."],
        ["Kjører fortere for å komme unna", "Ускоряюсь, чтобы уехать", "Å øke farten gjør situasjonen farligere i stedet for å gi utrykningskjøretøyet fri vei på en trygg måte.", "Ускорение делает ситуацию опаснее вместо того, чтобы безопасно освободить дорогу спецтранспорту."],
        ["Bremser hardt midt i krysset", "Резко торможу посреди перекрёстка", "Brå bremsing midt i krysset skaper fare, du bør heller finne et trygt sted å stanse eller flytte deg til siden.", "Резкое торможение посреди перекрёстка опасно — лучше найти безопасное место, чтобы остановиться или сместиться в сторону."]
      ],
      "Utrykningskjøretøy med blålys og sirene har forrang foran alt annet. Gi fri vei, men ikke gjør noe farlig eller brått.",
      "Спецтранспорт с мигалками и сиреной имеет преимущество перед всем. Освободи дорогу, но без опасных резких манёвров.",
      "Не тормози резко посреди перекрёстка — лучше спокойно доехать до места, где можно безопасно уступить."),

    q("017", road({ tcross: true }),
      "T-kryss uten skilt. Du kjører på den gjennomgående vegen. Bil B kommer fra sidevegen til høyre. Hvem viker?",
      "Т-образный перекрёсток без знаков. Ты едешь по сквозной дороге. Машина B выезжает с боковой справа. Кто уступает?",
      [
        ["Jeg viker: høyreregelen gjelder også i T-kryss", "Я уступаю: правило правой руки действует и на Т-перекрёстке"],
        ["B viker: den gjennomgående vegen har forrang", "B уступает: у сквозной дороги приоритет", "En gjennomgående veg gir ikke automatisk forrang i Norge, uten skilt gjelder høyreregelen selv i T-kryss.", "Сквозная дорога в Норвегии автоматически приоритета не даёт — без знаков и на Т-перекрёстке действует правило правой руки."],
        ["Den som kommer først", "Кто первый приехал", "Ankomsttidspunktet avgjør ikke, høyreregelen bestemmer hvem som viker.", "Время прибытия роли не играет — кто уступает, решает правило правой руки."],
        ["Ingen har vikeplikt", "Никто не уступает", "I ethvert kryss uten skilt gjelder høyreregelen, noen har alltid vikeplikt, også i T-kryss.", "На любом перекрёстке без знаков действует правило правой руки — кто-то всегда обязан уступить, в том числе на Т-образном."]
      ],
      "I Norge gir ikke en gjennomgående veg forrang av seg selv. Uten skilt gjelder høyreregelen også i T-kryss.",
      "В Норвегии сквозная дорога сама по себе не даёт приоритета. Без знаков правило правой руки действует и на Т-перекрёстке.",
      "Ловушка для тех, кто учил ПДД в других странах: «прямая дорога главнее» здесь не работает. Ищи знак или уступай справа."),

    q("018", scene({ you: { from: "south", to: "east" }, lights: { south: "red" } }),
      "Du har rødt lys og skal svinge til høyre. Ingen kommer. Kan du svinge?",
      "У тебя красный, ты поворачиваешь направо. Никого нет. Можно повернуть?",
      [
        ["Nei, rødt lys betyr stopp, også for høyresving", "Нет, красный означает стоп, в том числе для поворота направо"],
        ["Ja, høyresving på rødt er lov hvis det er fritt", "Да, направо на красный можно, если свободно", "Norge har ingen regel om høyresving på rødt, i motsetning til enkelte andre land, rødt betyr stopp uansett retning.", "В Норвегии, в отличие от некоторых других стран, нет правила про поворот направо на красный — красный означает стоп в любом направлении."],
        ["Ja, hvis jeg stopper først", "Да, если сначала остановлюсь", "Å stoppe først endrer ingenting, du skal fortsatt vente på grønt lys før du kjører.", "Остановка сначала ничего не меняет — всё равно нужно дождаться зелёного, прежде чем ехать."],
        ["Ja, men bare om natten", "Да, но только ночью", "Tidspunktet på døgnet har ingen betydning, rødt lys gjelder likt hele døgnet.", "Время суток тут ни при чём — красный действует одинаково круглые сутки."]
      ],
      "I Norge finnes ikke «høyresving på rødt». Du venter på grønt eller grønn pil.",
      "В Норвегии нет «поворота направо на красный». Ждёшь зелёного или зелёной стрелки.",
      "Проезд на красный — 10 750 kr и 3 балла, даже если ты «только направо»."),

    q("019", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }], lights: { south: "green", north: "green" } }),
      "Grønt lys. Du skal svinge til venstre, og møtende bil B skal rett fram, også på grønt. Hvem kjører først?",
      "Зелёный. Ты поворачиваешь налево, встречная B едет прямо, тоже на зелёный. Кто едет первым?",
      [
        ["B: jeg må vike for møtende trafikk selv om jeg har grønt", "B: я уступаю встречному, даже если у меня зелёный"],
        ["Jeg: grønt lys gir meg forrang", "Я: зелёный даёт мне преимущество", "Grønt lys lar deg kjøre inn i krysset, men fritar deg ikke fra vikeplikten for møtende ved venstresving.", "Зелёный разрешает въехать на перекрёсток, но не снимает обязанность уступить встречному при повороте налево."],
        ["Den som er raskest", "Кто быстрее", "Farten avgjør ikke rekkefølgen, regelen om venstresving mot møtende gjør det.", "Скорость не определяет очерёдность — её определяет правило про поворот налево навстречу транспорту."],
        ["Vi stopper begge", "Оба останавливаемся", "Det er ikke nødvendig at begge stopper, B kan kjøre rett fram mens du venter.", "Останавливаться обоим не нужно — B может ехать прямо, пока ты ждёшь."]
      ],
      "Grønt lys betyr at du kan kjøre inn i krysset, men vikeplikten for møtende trafikk ved venstresving gjelder fortsatt.",
      "Зелёный означает, что можно въехать на перекрёсток, но обязанность уступить встречным при повороте налево остаётся.",
      "Зелёный — не «мне все уступают». При левом повороте встречный прямо всегда первый."),

    q("020", scene({ you: { from: "south", to: "east" }, peds: ["east"], lights: { south: "green" } }),
      "Grønt lys, du svinger til høyre. Fotgjengere krysser på gangfeltet i gaten du svinger inn i, også på grønt. Hva gjør du?",
      "Зелёный, ты поворачиваешь направо. Пешеходы переходят по зебре на улице, куда ты сворачиваешь, тоже на зелёный. Что делаешь?",
      [
        ["Stopper og slipper fotgjengerne over", "Останавливаюсь и пропускаю пешеходов"],
        ["Kjører: jeg har grønt", "Еду: у меня зелёный", "Grønt lys for deg fritar deg ikke fra vikeplikten for gående som krysser vegen du svinger inn i.", "Твой зелёный не снимает обязанность уступить пешеходам, переходящим дорогу, на которую ты сворачиваешь."],
        ["Tuter så de skynder seg", "Сигналю, чтобы поторопились", "Signalhorn skal ikke brukes for å presse fotgjengere, du skal selv vente.", "Гудок нельзя использовать, чтобы поторопить пешеходов — ждать должен ты сам."],
        ["Kjører sakte mellom dem", "Медленно еду между ними", "Å kjøre mellom fotgjengerne er farlig, du skal stoppe helt til gangfeltet er fritt.", "Ехать между пешеходами опасно — нужно полностью остановиться, пока переход не освободится."]
      ],
      "Når du svinger, har du vikeplikt for gående og syklende som krysser den vegen du svinger inn i.",
      "При повороте ты уступаешь пешеходам и велосипедистам, пересекающим дорогу, на которую сворачиваешь.",
      "Пешеходы на зелёный и ты на зелёный одновременно — норма в Норвегии. Ты ждёшь."),

    q("021", scene({ you: { from: "south", to: "west", lane: "left" }, roundabout: true, lanes: 2 }),
      "Rundkjøring med to felt. Du skal ta tredje avkjøring (til venstre). Hvilket felt velger du inn?",
      "Круг с двумя полосами. Тебе нужен третий съезд (налево). Какую полосу выбрать при въезде?",
      [
        ["Venstre felt, med venstre blinklys på vei inn", "Левую, с левым поворотником при въезде"],
        ["Høyre felt, det er alltid tryggest", "Правую, так всегда безопаснее", "Høyre felt er for første og andre avkjøring, til tredje avkjøring eller lenger skal du bruke venstre felt.", "Правая полоса — для первого и второго съезда, для третьего и дальше нужна левая."],
        ["Spiller ingen rolle", "Не имеет значения", "Feltvalget har betydning for hvordan du skal svinge og gi tegn, det er ikke likegyldig.", "Выбор полосы важен для манёвра и сигналов поворота — это не всё равно."],
        ["Midt mellom feltene", "Посередине между полосами", "Å kjøre midt mellom feltene er ikke lovlig, du skal velge ett av de to feltene tydelig.", "Ехать посередине между полосами нельзя — нужно чётко выбрать одну из двух."]
      ],
      "Skal du til venstre eller snu, bruker du venstre felt og gir tegn til venstre inn. Skift til høyre felt med høyre blinklys før avkjøringen.",
      "Если налево или разворот — левая полоса и левый поворотник при въезде. Перед съездом перестраивайся вправо с правым поворотником.",
      "Правая полоса — для первого и второго съезда. Левая — для третьего и разворота."),

    q("022", road({ onramp: true }),
      "Du kjører inn på motorveg via påkjøringsfelt. Hvem har vikeplikt?",
      "Ты въезжаешь на автомагистраль по полосе разгона. Кто уступает?",
      [
        ["Jeg: trafikken på motorvegen har forrang, men de bør legge til rette", "Я: у потока на магистрали приоритет, но они должны помогать"],
        ["Trafikken på motorvegen må slippe meg inn", "Поток на магистрали обязан меня пропустить", "Det er omvendt, det er du som kjører inn fra påkjøringsfeltet som har vikeplikt.", "Наоборот: именно ты, въезжающий с полосы разгона, обязан уступить."],
        ["Fletteregelen: annenhver bil", "Правило молнии: через одного", "Fletteregelen gjelder der to felt går sammen til ett, ikke ved påkjøring til motorveg, der du har vikeplikt.", "Правило молнии действует при слиянии двух полос в одну, а не при въезде на автомагистраль, где у тебя есть обязанность уступить."],
        ["Ingen, jeg kjører bare inn", "Никто, просто въезжаю", "Du kan ikke bare kjøre inn uten å ta hensyn, du har vikeplikt for trafikken på motorvegen.", "Просто въехать без учёта обстановки нельзя — у тебя есть обязанность уступить потоку на магистрали."]
      ],
      "Trafikkreglene § 8: den som skifter felt, har vikeplikt, og i felt for fartsøkning skal du tilpasse farten til trafikken du skal inn i. Bruk hele feltet og velg en luke. De som kjører i feltet ved siden av, skal lette innkjøringen.",
      "Trafikkreglene § 8: перестраивающийся уступает, а на полосе разгона нужно подстроить скорость под поток, в который вливаешься. Используй всю полосу и выбери просвет. Те, кто едет в соседней полосе, обязаны облегчить въезд.",
      "Не останавливайся в конце полосы разгона: набери скорость потока, иначе слияние станет опасным."),

    q("023", road({ overtake: true }),
      "Bilen foran deg gir tegn til venstre for å kjøre forbi en syklist. Du ville også kjørt forbi. Hva gjør du?",
      "Машина впереди включает левый поворотник, чтобы объехать велосипедиста. Ты тоже хотел обогнать. Что делаешь?",
      [
        ["Venter: det er forbudt å kjøre forbi en bil som selv kjører forbi eller gir tegn til det", "Жду: запрещено обгонять машину, которая сама обгоняет или показывает намерение"],
        ["Kjører forbi begge samtidig", "Обгоняю обоих сразу", "Å kjøre forbi to kjøretøy samtidig i en slik situasjon er svært farlig og ulovlig her.", "Обгонять сразу оба ТС в такой ситуации очень опасно и запрещено."],
        ["Tuter og kjører forbi på høyre side", "Сигналю и обгоняю справа", "Forbikjøring på høyre side er som hovedregel forbudt, og hornet endrer ikke på forbudet mot å kjøre forbi her.", "Обгон справа как правило запрещён, а гудок не отменяет запрет обгонять в этой ситуации."],
        ["Blinker med fjernlys", "Мигаю дальним", "Å blinke med fjernlys gir deg ingen rett til å kjøre forbi, forbudet gjelder uansett.", "Мигание дальним не даёт права на обгон — запрет действует в любом случае."]
      ],
      "Trafikkreglene § 12 nr 2 b: før du kjører forbi, skal du forvisse deg om at den forankjørende ikke har gitt tegn om forbikjøring. Vent til bilen foran har kjørt forbi syklisten og situasjonen er klar.",
      "Trafikkreglene § 12 nr 2 b: перед обгоном нужно убедиться, что машина впереди не подала сигнал об обгоне. Дождись, пока она объедет велосипедиста и ситуация прояснится.",
      "«Обгон обгоняющего» — один из самых опасных манёвров и прямое нарушение."),

    q("024", road({ bikeLane: true }),
      "Du skal svinge til høyre i et kryss. Det er sykkelfelt på høyre side, og en syklist bak deg kjører rett fram. Hva gjør du?",
      "Ты поворачиваешь направо на перекрёстке. Справа велополоса, велосипедист сзади едет прямо. Что делаешь?",
      [
        ["Slipper syklisten fram før jeg svinger", "Пропускаю велосипедиста, потом поворачиваю"],
        ["Svinger raskt før syklisten kommer", "Быстро поворачиваю до велосипедиста", "Å prøve å rekke unna før syklisten er farlig og bryter med vikeplikten din.", "Пытаться проскочить перед велосипедистом опасно и нарушает твою обязанность уступить."],
        ["Kjører inn i sykkelfeltet for å blokkere", "Въезжаю в велополосу, чтобы перекрыть", "Å blokkere sykkelfeltet er ikke tillatt og løser ikke vikeplikten din, du skal vente.", "Перекрывать велополосу нельзя, и это не отменяет твою обязанность уступить — нужно подождать."],
        ["Tuter og svinger", "Сигналю и поворачиваю", "Signalhorn erstatter ikke vikeplikten, du skal la syklisten kjøre fram først.", "Гудок не заменяет обязанность уступить — сначала нужно пропустить велосипедиста."]
      ],
      "Ved høyresving over sykkelfelt har du vikeplikt for syklende som kjører rett fram, også de som kommer bakfra.",
      "При повороте направо через велополосу ты уступаешь велосипедистам, едущим прямо, в том числе тем, кто догоняет сзади.",
      "Перед поворотом направо — правое зеркало и взгляд через плечо. Это проверяют на oppkjøring."),

    q("025", road({ night: true }),
      "Det er mørkt, og du ser en fotgjenger i mørke klær som går på venstre side av en veg uten fortau. Hva gjør du?",
      "Темно, ты видишь пешехода в тёмной одежде, идущего по левой стороне дороги без тротуара. Что делаешь?",
      [
        ["Senker farten, holder god avstand og bruker nærlys", "Снижаю скорость, держу дистанцию, переключаюсь на ближний"],
        ["Blinker med fjernlys så han flytter seg", "Мигаю дальним, чтобы отошёл", "Fjernlys blender fotgjengeren i stedet for å hjelpe, bruk nærlys og senk farten.", "Дальний свет слепит пешехода вместо того, чтобы помочь — используй ближний и снизь скорость."],
        ["Kjører som normalt, han går riktig", "Еду как обычно, он идёт правильно", "Selv om fotgjengeren går på riktig side, bør du fortsatt senke farten og holde avstand siden han er vanskelig å se i mørke klær.", "Даже если пешеход идёт правильно, всё равно стоит снизить скорость и держать дистанцию — в тёмной одежде его плохо видно."],
        ["Tuter", "Сигналю", "Signalhorn er unødvendig og upassende her, riktig reaksjon er å senke farten og holde avstand.", "Гудок тут не нужен и неуместен — правильная реакция — снизить скорость и держать дистанцию."]
      ],
      "Fotgjengere skal gå på venstre side mot trafikken der det ikke er fortau. Fjernlys blender. Senk farten og pass avstanden.",
      "Пешеходы без тротуара идут по левой стороне навстречу движению. Дальний свет слепит. Снизь скорость и держи дистанцию.",
      "Осенью и зимой в Норвегии темно большую часть дня. Пешеход без рефлекса виден с 25–30 м, с рефлексом — со 140 м."),

    q("026", road({ exit: "gatetun" }),
      "Du kjører ut fra et gatetun og inn på en vanlig gate. Hvem har vikeplikt?",
      "Ты выезжаешь из жилой зоны (gatetun) на обычную улицу. Кто уступает?",
      [
        ["Jeg: utkjøring fra gatetun gir vikeplikt for all trafikk", "Я: выезд из gatetun означает уступить всем"],
        ["Høyreregelen gjelder", "Действует правило правой руки", "Høyreregelen gjelder mellom likestilte veier, ikke ved utkjøring fra gatetun, der du alltid viker.", "Правило правой руки действует между равнозначными дорогами, а не при выезде из gatetun, где ты всегда уступаешь."],
        ["Trafikken i gaten viker for meg", "Транспорт на улице уступает мне", "Det er omvendt: den som kjører ut fra gatetun har alltid vikeplikt for trafikken i gaten.", "Всё наоборот: выезжающий из gatetun всегда уступает транспорту на улице."],
        ["Ingen har vikeplikt", "Никто не уступает", "Den som kjører ut fra gatetun har alltid vikeplikt, det finnes ikke situasjon uten den.", "У выезжающего из gatetun всегда есть обязанность уступить — ситуации без неё не бывает."]
      ],
      "Utkjøring fra gatetun, gågate, parkeringsplass, bensinstasjon eller gårdsveg gir alltid vikeplikt for trafikken du kjører inn i.",
      "Выезд из gatetun, gågate, парковки, заправки или двора всегда означает уступить транспорту, в который ты вливаешься.",
      "Все «выезды с территорий» работают одинаково: ты последний в очереди."),

    q("027", road({ tunnel: true }),
      "Du kjører inn i en lang tunnel på en solfylt dag. Hva bør du gjøre?",
      "Ты въезжаешь в длинный тоннель в солнечный день. Что нужно сделать?",
      [
        ["Ta av solbriller og senk farten litt til øynene venner seg til mørket", "Сними солнцезащитные очки и немного снизь скорость, пока глаза привыкают к темноте"],
        ["Kjør som vanlig, tunnelen er godt opplyst", "Езжай как обычно, тоннель хорошо освещён", "Selv en godt opplyst tunnel krever at øynene venner seg til mørket, du bør senke farten litt.", "Даже хорошо освещённый тоннель требует, чтобы глаза привыкли к темноте — скорость стоит немного снизить."],
        ["Blink med fjernlys for å varsle andre", "Мигни дальним, чтобы предупредить остальных", "Fjernlysblink løser ikke problemet med at øynene dine må venne seg til mørket.", "Мигание дальним не решает проблему привыкания твоих глаз к темноте."],
        ["Øk farten for å komme fort ut", "Увеличь скорость, чтобы быстрее выехать", "Å øke farten når synet er dårligere er farlig, du bør heller senke farten.", "Увеличивать скорость при ухудшенном зрении опасно — лучше её снизить."]
      ],
      "Øynene trenger tid til å venne seg til mørket etter sterkt sollys. Ta av solbriller, senk farten og hold god avstand de første sekundene.",
      "Глазам нужно время привыкнуть к темноте после яркого солнца. Сними очки, снизь скорость и держи увеличенную дистанцию первые секунды.",
      "Переход свет-тьма — частая причина растерянности у тоннеля. Заранее сбавь скорость и сними очки."),

    q("028", road({ rest: true }),
      "Du kjenner deg svært trøtt mens du kjører på motorveien. Hva er riktig å gjøre?",
      "Ты чувствуешь сильную усталость за рулём на автомагистрали. Как правильно поступить?",
      [
        ["Stoppe på en rasteplass og hvile eller sove litt", "Остановиться на зоне отдыха и отдохнуть или немного поспать"],
        ["Skru opp musikken og åpne vinduet", "Включить музыку погромче и открыть окно", "Musikk og åpent vindu hjelper bare kort tid og løser ikke det underliggende problemet med trøtthet.", "Музыка и открытое окно помогают лишь недолго и не решают саму проблему усталости."],
        ["Kjøre litt fortere for å komme fram raskere", "Ехать чуть быстрее, чтобы скорее доехать", "Høyere fart øker faren ved mikrosøvn i stedet for å redusere den.", "Более высокая скорость увеличивает опасность микросна, а не снижает её."],
        ["Fortsette, trøttheten går over av seg selv", "Продолжать ехать, усталость сама пройдёт", "Trøtthet bak rattet går ikke over av seg selv og kan føre til mikrosøvn, du må stoppe og hvile.", "Усталость за рулём сама не проходит и может привести к микросну — нужно остановиться и отдохнуть."]
      ],
      "Trøtthet bak rattet er svært farlig og kan gi mikrosøvn. Musikk og åpent vindu hjelper bare kort tid. Riktig løsning er å stoppe og hvile.",
      "Усталость за рулём очень опасна и может вызвать микросон. Музыка и открытое окно помогают лишь ненадолго. Правильное решение — остановиться и отдохнуть.",
      "Микросон длится всего пару секунд, но на скорости 80 км/ч машина за это время проезжает десятки метров без контроля."),

    q("029", road({ parkedChild: true }),
      "Du har parkert langs høyre side av en trafikkert vei. Barnet ditt sitter i baksetet. Hvordan skal barnet gå ut av bilen?",
      "Ты припарковался у правого края оживлённой дороги. Ребёнок сидит на заднем сиденье. Как ребёнку выходить из машины?",
      [
        ["Gjennom døren mot fortauet, bort fra trafikken", "Через дверь со стороны тротуара, подальше от движения"],
        ["Gjennom døren mot kjørebanen, det går fortest", "Через дверь со стороны проезжей части, так быстрее", "Å gå ut mot kjørebanen er farlig, barnet kan bli truffet av forbikjørende trafikk.", "Выходить со стороны проезжей части опасно — ребёнка может задеть проезжающая машина."],
        ["Det spiller ingen rolle hvilken side", "Не важно, с какой стороны", "Siden har stor betydning for sikkerheten, barnet bør alltid gå ut mot fortauet.", "Сторона выхода очень важна для безопасности — ребёнку нужно выходить к тротуару."],
        ["Barnet kan hoppe ut mens bilen ruller sakte", "Ребёнок может выпрыгнуть, пока машина медленно катится", "Å gå ut av en bil i bevegelse er farlig uansett fart, bilen skal stå helt stille.", "Выходить из движущейся машины опасно при любой скорости — машина должна полностью остановиться."]
      ],
      "Barn (og voksne) bør alltid gå ut på siden bort fra trafikken, altså mot fortauet, for å unngå å bli truffet av forbikjørende kjøretøy.",
      "Выходить нужно всегда со стороны, противоположной движению, то есть к тротуару, чтобы не попасть под проезжающую машину.",
      "Это правило касается всех пассажиров, но особенно важно для детей — приучи их к этому с первой поездки."),

    q("030", road({ wild: true }),
      "Du kjører på landevei i skumringen og passerer et viltskilt med elg. Hva gjør du?",
      "Ты едешь по загородной дороге в сумерках и проезжаешь знак с изображением лося. Что делаешь?",
      [
        ["Senker farten og er klar til å bremse, dyr kommer ofte flere sammen", "Снижаю скорость и готов тормозить — животные часто идут группами"],
        ["Kjører som normalt, skiltet gjelder bare om natten", "Еду как обычно, знак действует только ночью", "Skiltet gjelder hele døgnet, dyr kan krysse også i dagslys, ikke bare om natten.", "Знак действует круглые сутки — животные могут выходить и днём, а не только ночью."],
        ["Blinker med fjernlys for å skremme bort dyr", "Мигаю дальним, чтобы отпугнуть животных", "Å blinke med fjernlys skremmer ikke dyr bort på en pålitelig måte og kan i stedet forvirre dem.", "Мигание дальним не гарантирует, что животное убежит, а может наоборот его запутать."],
        ["Øker farten for å passere risikoområdet raskt", "Увеличиваю скорость, чтобы быстрее проехать опасный участок", "Høyere fart gir kortere reaksjonstid hvis et dyr dukker opp, det gjør situasjonen farligere.", "На большей скорости меньше времени на реакцию, если выйдет животное, — это только опаснее."]
      ],
      "Viltskilt varsler områder med mye viltkryssing, spesielt i skumring og grålysning. Senk farten og vær ekstra oppmerksom — kommer ett dyr, følger ofte flere etter.",
      "Знак с животным предупреждает об участках с частым переходом диких животных, особенно в сумерках. Снизь скорость и будь особенно внимателен — если появилось одно животное, за ним часто следуют другие.",
      "Столкновение с лосем на скорости очень опасно из-за высоты животного. Лучше сбросить скорость заранее, чем экстренно тормозить."),

    q("031", road({ trailer: true }),
      "Du skal rygge en bil med tilhenger inn på en smal vei. Hva er viktig å huske?",
      "Тебе нужно сдать назад на машине с прицепом на узкую дорогу. Что важно помнить?",
      [
        ["Tilhengeren svinger motsatt vei av rattet, så styr rolig og bruk speilene", "Прицеп поворачивает в сторону, противоположную повороту руля, поэтому рули плавно и следи за зеркалами"],
        ["Tilhengeren følger rattet på samme måte som bilen", "Прицеп следует за рулём так же, как сама машина", "Tilhengeren beveger seg faktisk motsatt vei av det bilen gjør ved rygging, ikke likt.", "На самом деле при движении задним ходом прицеп движется в противоположную сторону от машины, а не так же."],
        ["Det er forbudt å rygge med tilhenger", "Сдавать назад с прицепом запрещено", "Det er ikke forbudt å rygge med tilhenger, det krever bare øvelse og forsiktig styring.", "Сдавать назад с прицепом не запрещено — просто нужны навык и аккуратное управление рулём."],
        ["Be en passasjer dytte tilhengeren i riktig retning", "Попросить пассажира толкать прицеп в нужную сторону", "Å dytte tilhengeren fysisk er ikke en trygg eller praktisk løsning, du skal styre bilen rolig i stedet.", "Толкать прицеп руками — не безопасное и не практичное решение, нужно аккуратно управлять машиной."]
      ],
      "Når du rygger med tilhenger, svinger tilhengeren motsatt vei av det du dreier rattet. Styr i små bevegelser, bruk speilene aktivt, og be gjerne noen dirigere deg.",
      "При движении задним ходом с прицепом прицеп поворачивает в сторону, противоположную повороту руля. Работай рулём небольшими движениями, активно используй зеркала и, если можно, попроси кого-то направлять тебя.",
      "Потренируйся на пустой площадке заранее — реакция прицепа на руль непривычна большинству новичков."),

    q("032", road({ bridge: true }),
      "Det er en kald morgen, og du nærmer deg en bro. Veien før broen var tørr. Hva bør du tenke på?",
      "Холодное утро, ты приближаешься к мосту. Дорога перед мостом была сухой. О чём нужно помнить?",
      [
        ["Broer fryser først, det kan være is selv om resten av veien er tørr", "Мосты замерзают первыми — лёд может быть, даже если остальная дорога сухая"],
        ["Broer er alltid varmere enn veien, så is er usannsynlig", "Мосты всегда теплее дороги, поэтому лёд маловероятен", "Broer er tvert imot kaldere enn vanlig vei fordi de mister varme raskere, så is er mer sannsynlig der.", "Наоборот, мосты холоднее обычной дороги, потому что быстрее теряют тепло, — лёд там как раз более вероятен."],
        ["Is dannes bare på veier med mye skygge", "Лёд появляется только на затенённых участках", "Is på bro dannes uavhengig av skygge, det handler om at broen mister varme raskt fra alle sider.", "Лёд на мосту образуется независимо от тени — дело в том, что мост быстро теряет тепло со всех сторон."],
        ["Broer saltes automatisk, så de er alltid trygge", "Мосты автоматически солятся, поэтому всегда безопасны", "Det finnes ikke automatisk salting på alle broer, du kan ikke stole på at broen alltid er trygg.", "Автоматической подсыпки соли на всех мостах нет — полагаться на то, что мост всегда безопасен, нельзя."]
      ],
      "Broer er omgitt av kald luft på alle sider og mister varme raskere enn vanlig vei. De blir derfor ofte glatte og iskalde før resten av veien.",
      "Мосты окружены холодным воздухом со всех сторон и теряют тепло быстрее, чем обычная дорога. Поэтому они часто становятся скользкими раньше остальной трассы.",
      "Классическая ловушка теории: «мост сухой на вид» ≠ «мост не скользкий». Сбавляй скорость заранее."),

    q("033", road({ rail: true }),
      "Du nærmer deg en planovergang (jernbaneovergang) uten bom, og det røde lyset blinker. Hva gjør du?",
      "Ты приближаешься к железнодорожному переезду без шлагбаума, мигает красный сигнал. Что делаешь?",
      [
        ["Stopper og venter til lyset slutter å blinke", "Останавливаюсь и жду, пока сигнал не перестанет мигать"],
        ["Kjører raskt over før toget kommer", "Быстро проезжаю, пока поезд не подъехал", "Å prøve å rekke over før toget er ekstremt farlig, du skal stoppe når lyset blinker.", "Пытаться проскочить перед поездом крайне опасно — нужно остановиться, пока сигнал мигает."],
        ["Kjører sakte over og ser meg for", "Медленно проезжаю, оглядываясь по сторонам", "Blinkende rødt lys krever full stopp, det holder ikke å bare kjøre sakte og se seg for.", "Мигающий красный требует полной остановки — ехать медленно и оглядываться недостаточно."],
        ["Tuter og kjører over", "Сигналю и проезжаю", "Signalhorn endrer ingenting, blinkende rødt lys betyr stopp uansett.", "Гудок ничего не меняет — мигающий красный означает остановку в любом случае."]
      ],
      "Blinkende rødt lys ved planovergang betyr at tog nærmer seg. Du skal stoppe og vente til lyset slukker, selv om du ikke ser bom eller tog ennå.",
      "Мигающий красный на переезде означает, что приближается поезд. Нужно остановиться и ждать, пока сигнал не погаснет, даже если шлагбаума или поезда ещё не видно.",
      "Тормозной путь поезда в разы длиннее, чем у машины. Никогда не пытайся проскочить на мигающий красный."),

    q("034", road({ truck: true, tcross: true }),
      "Et langt vogntog foran deg skal svinge til høyre, men beveger seg først til venstre i kjørefeltet. Hva bør du gjøre?",
      "Длинный грузовик с прицепом впереди тебя собирается повернуть направо, но сначала смещается влево в полосе. Что нужно сделать?",
      [
        ["Holde god avstand og ikke kjøre forbi på høyre side", "Держать дистанцию и не пытаться обогнать справа"],
        ["Kjøre forbi på høyre side mens det er plass", "Обогнать справа, пока есть место", "Plassen som åpner seg til høyre er nettopp der vogntoget trenger å svinge inn, å kjøre der er svært farlig.", "Место, освобождающееся справа, — как раз то, куда грузовик собирается повернуть, ехать туда очень опасно."],
        ["Tute for å få vogntoget til å svinge med en gang", "Посигналить, чтобы грузовик повернул сразу", "Signalhorn hjelper ikke, føreren trenger plassen til venstre for å få svingradius, ikke et signal om å skynde seg.", "Гудок не поможет — водителю нужно место слева для радиуса поворота, а не сигнал поторопиться."],
        ["Kjøre tett bak for å presse fram svingen", "Прижаться вплотную сзади, чтобы поторопить с поворотом", "Å ligge tett bak reduserer din egen reaksjonstid og hjelper ikke vogntoget med svingen.", "Ехать вплотную сзади сокращает твоё время на реакцию и никак не помогает грузовику повернуть."]
      ],
      "Lange kjøretøy må ofte svinge ut til motsatt side for å få plass til høyresvingen. Å kjøre forbi på høyre side da er svært farlig — bli liggende bak og vent.",
      "Длинным транспортным средствам часто нужно сместиться в противоположную сторону, чтобы вписаться в поворот направо. Обгонять справа в этот момент очень опасно — держись позади и жди.",
      "Это классическая ловушка «мёртвой зоны» у грузовиков — никогда не ныряй в пространство, которое освобождает длинномер перед поворотом."),

    q("035", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east", kind: "bike" }], roundabout: true }),
      "Du (A) skal kjøre inn i rundkjøringen. En syklist (B) er allerede inne i rundkjøringen. Hva gjør du?",
      "Ты (A) собираешься въехать на круг. Велосипедист (B) уже находится на кругу. Что делаешь?",
      [
        ["Venter og slipper syklisten fram — samme regel som for biler", "Жду и пропускаю велосипедиста — то же правило, что и для машин"],
        ["Kjører inn med en gang, sykler har ikke forrang i rundkjøring", "Въезжаю сразу — у велосипедистов нет преимущества на кругу", "Syklende har samme forrang som biler i rundkjøring, ikke mindre.", "У велосипедистов на кругу такой же приоритет, как у машин, а не меньше."],
        ["Tuter for å varsle syklisten om at jeg kommer", "Сигналю, чтобы предупредить велосипедиста о своём въезде", "Signalhorn erstatter ikke vikeplikten, du skal vente uansett om du varsler eller ikke.", "Гудок не заменяет обязанность уступить — ждать нужно в любом случае, предупредил ты или нет."],
        ["Kjører inn fordi jeg er større og mer synlig", "Въезжаю, потому что я крупнее и заметнее", "Kjøretøyets størrelse gir ingen forrang, reglene for rundkjøring gjelder likt for alle.", "Размер транспорта не даёт приоритета — правила круга действуют одинаково для всех."]
      ],
      "I rundkjøring gjelder samme vikeplikt for syklende som for biler: trafikk som allerede er inne i rundkjøringen har forrang, uansett kjøretøytype.",
      "На круге действует та же обязанность уступать для велосипедистов, что и для машин: тот, кто уже на кругу, имеет преимущество — независимо от типа транспорта.",
      "Не думай, что раз это велосипедист, можно «проскочить». Правило приоритета на круге не зависит от размера транспорта."),

    q("036", road({ tram: true }),
      "En trikk har stoppet ved en holdeplass midt i gaten, uten trafikkøy mellom skinnene og fortauet. Dørene åpnes. Hva gjør du?",
      "Трамвай остановился на остановке посреди улицы, без островка безопасности между рельсами и тротуаром. Двери открылись. Что делаешь?",
      [
        ["Stopper bak trikken og venter til passasjerene har krysset over til fortauet", "Останавливаюсь позади трамвая и жду, пока пассажиры перейдут на тротуар"],
        ["Kjører forbi trikken i vanlig fart, jeg har ikke plikt til å stoppe", "Проезжаю мимо трамвая с обычной скоростью — останавливаться не обязан", "Du har faktisk plikt til å stoppe når passasjerer krysser til fortauet uten trafikkøy.", "На самом деле обязанность остановиться есть — когда пассажиры переходят к тротуару без островка безопасности."],
        ["Kjører forbi sakte samtidig som passasjerene krysser", "Медленно проезжаю мимо, пока пассажиры переходят", "Å kjøre forbi samtidig som passasjerene krysser er farlig, du skal stoppe helt til de er trygt over.", "Проезжать мимо, пока пассажиры переходят, опасно — нужно полностью остановиться, пока они не окажутся в безопасности."],
        ["Tuter for å få passasjerene til å skynde seg", "Сигналю, чтобы пассажиры поторопились", "Signalhorn skal ikke brukes for å presse passasjerene, du skal selv vente til de er over.", "Гудок нельзя использовать, чтобы поторопить пассажиров, — ждать должен ты сам, пока они не перейдут."]
      ],
      "Trafikkreglene § 9 nr. 3: den som vil kjøre forbi til høyre for sporvogn ved holdeplass uten trafikkøy, skal stanse og gi fri veg for passasjerer som stiger av eller på. For buss ved holdeplass gjelder § 13: hold liten fart og stans om nødvendig.",
      "Trafikkreglene § 9 nr 3: если объезжаешь трамвай справа у остановки без островка, нужно остановиться и пропустить пассажиров, которые выходят или садятся. Для автобуса у остановки действует § 13: ехать медленно и при необходимости остановиться.",
      "Пассажиры трамвая выходят прямо на проезжую часть — это одна из самых опасных ситуаций в городе, всегда останавливайся полностью."),

    q("037", hillScene(),
      "Du skal parkere i en bakke uten fortauskant (grøft på siden), og bilen peker nedover. Hva bør du gjøre med forhjulene?",
      "Нужно припарковаться на склоне без бордюра (сбоку канава), машина направлена вниз по склону. Что сделать с передними колёсами?",
      [
        ["Vri hjulene mot grøften, slik at bilen ruller av veien og ikke ut i trafikken hvis den beveger seg", "Повернуть колёса в сторону канавы, чтобы машина при откате съехала с дороги, а не выехала на проезжую часть"],
        ["Vri hjulene rett fram, det spiller ingen rolle når håndbrekket er på", "Оставить колёса прямо — не важно, ведь стояночный тормоз включён", "Håndbrekket kan svikte, og med hjulene rett fram vil bilen trille rett ut i veien hvis det skjer.", "Ручник может подвести, и при прямых колёсах машина при откате выедет прямо на дорогу."],
        ["Vri hjulene mot kjørebanen, slik at bilen står tettest mulig på veien", "Повернуть колёса в сторону дороги, чтобы машина стояла как можно ближе к проезжей части", "Dette er farligere, for da vil bilen trille ut i kjørebanen og trafikken hvis bremsene svikter, ikke bort fra den.", "Это опаснее — при отказе тормозов машина съедет на проезжую часть, в поток машин, а не от него."],
        ["Bruke gir i stedet for håndbrekk er alltid nok alene", "Достаточно только включить передачу, без ручника", "Gir alene er ikke nok som sikkerhet, du skal bruke håndbrekk i tillegg og vri hjulene riktig vei.", "Одной передачи недостаточно для безопасности — нужен ещё ручник и правильно повёрнутые колёса."]
      ],
      "Ved parkering i bakke uten fortauskant vrir du hjulene slik at bilen triller vekk fra vegen (mot grøften) hvis bremsene skulle svikte. I tillegg bruker du håndbrekk og legger i gir eller parkeringsposisjon.",
      "При парковке на склоне без бордюра поворачивай колёса так, чтобы при откате машина ушла от дороги (в сторону канавы). Дополнительно используй ручник и включи передачу или паркинг.",
      "Правило простое: колёса должны «уводить» машину от проезжей части, а не на неё, если тормоза подведут."),

    q("038", road({ rain: true }),
      "Du kjører i kraftig regn og merker plutselig at rattet føles lett og bilen ikke reagerer på styringen. Hva er dette, og hva gjør du?",
      "Ты едешь в сильный дождь и вдруг чувствуешь, что руль стал «лёгким», а машина не реагирует на управление. Что это, и что делать?",
      [
        ["Vannplaning — slipp gassen forsiktig og hold rattet rett fram til dekkene får kontakt igjen", "Аквапланирование — плавно отпусти газ и держи руль прямо, пока шины снова не сцепятся с дорогой"],
        ["Servostyringen har sviktet — trykk gassen i bunn for å få kontroll", "Отказал гидроусилитель руля — выжми газ до пола, чтобы вернуть контроль", "Dette er vannplaning, ikke svikt i servostyringen, og å gi full gass forverrer situasjonen.", "Это аквапланирование, а не отказ гидроусилителя, — газ до пола только ухудшит ситуацию."],
        ["Dette er normalt i regn — brems hardt med en gang", "Это нормально в дождь — резко затормози", "Hard bremsing ved vannplaning kan gjøre at bilen sklir enda mer ukontrollert.", "Резкое торможение при аквапланировании может сделать занос машины ещё более неконтролируемым."],
        ["Bilen er overopphetet — slå av motoren mens du kjører", "Машина перегрелась — заглуши двигатель на ходу", "Å slå av motoren i fart fjerner servostyring og bremsekraft og gjør situasjonen mye farligere.", "Заглушить двигатель на ходу — значит потерять усилитель руля и тормозов, что делает ситуацию гораздо опаснее."]
      ],
      "Vannplaning oppstår når et vannlag løfter dekkene fra veibanen, og bilen mister kontakt med underlaget. Slipp gassen rolig, unngå bråbrems og bråe rattbevegelser til dekkene får grep igjen.",
      "Аквапланирование возникает, когда слой воды приподнимает шины над дорогой, и машина теряет сцепление с покрытием. Плавно отпусти газ, избегай резкого торможения и резких движений рулём, пока шины снова не «зацепятся» за дорогу.",
      "Резкое торможение или руль в сторону во время аквапланирования — верный способ уйти в занос. Главное — не паниковать и ехать прямо."),

    q("039", road({ roadwork: true }),
      "Du kjører inn i et anleggsområde med gule (midlertidige) skilt som viser en lavere fartsgrense enn den faste skiltingen. Hva gjelder?",
      "Ты въезжаешь в зону дорожных работ с жёлтыми (временными) знаками, показывающими ограничение скорости ниже обычного. Что действует?",
      [
        ["Den midlertidige (gule) fartsgrensen gjelder foran den faste skiltingen", "Действует временное (жёлтое) ограничение — оно важнее постоянных знаков"],
        ["Den faste fartsgrensen gjelder alltid, gule skilt er bare informasjon", "Всегда действует постоянное ограничение, жёлтые знаки — просто информация", "Gule skilt er ikke bare informasjon, de er midlertidige og går foran den faste skiltingen.", "Жёлтые знаки — не просто информация, они временные и действуют вместо постоянных."],
        ["Du velger selv hvilken grense du følger", "Можно самому выбрать, какое ограничение соблюдать", "Fartsgrensen er ikke valgfri, den midlertidige gule skiltingen er bindende.", "Ограничение скорости — не на выбор, временный жёлтый знак обязателен."],
        ["Gule skilt gjelder bare for tunge kjøretøy", "Жёлтые знаки касаются только грузового транспорта", "Gule skilt gjelder alle kjøretøy i anleggsområdet, ikke bare tunge.", "Жёлтые знаки действуют для всех ТС в зоне работ, а не только для грузового транспорта."]
      ],
      "Gule skilt i anleggsområder er midlertidig skilting og går foran den faste (hvite) skiltingen. Vær ekstra oppmerksom på arbeidere og endret veibane.",
      "Жёлтые знаки в зоне дорожных работ — временные, и они важнее постоянных (белых) знаков. Будь особенно внимателен к рабочим и изменённой траектории дороги.",
      "Жёлтый фон знака в Норвегии означает «временно», и такой знак всегда приоритетнее обычного белого на этом участке."),

    q("040", null,
      "Du oppdager i speilet at barnet i baksetet har løsnet beltet mens du kjører på motorveien. Hva gjør du?",
      "Ты замечаешь в зеркале, что ребёнок на заднем сиденье отстегнул ремень во время движения по автомагистрали. Что делаешь?",
      [
        ["Finner et trygt sted å stoppe og fester beltet der, i stedet for å gjøre noe mens bilen er i fart", "Нахожу безопасное место для остановки и там пристёгиваю ремень, а не пытаюсь сделать это на ходу"],
        ["Rekker meg bakover og fester beltet mens jeg fortsetter å kjøre", "Тянусь назад и пристёгиваю ремень, продолжая ехать", "Å strekke seg bakover mens du kjører tar oppmerksomheten fra veien og er svært farlig i fart.", "Тянуться назад во время движения отвлекает от дороги и очень опасно на скорости."],
        ["Ber en passasjer i forsetet klatre bak for å ordne beltet med en gang", "Прошу пассажира с переднего сиденья перелезть назад и сразу пристегнуть ремень", "Å klatre mellom setene mens bilen er i fart er farlig for alle involverte, vent til dere har stoppet.", "Перелезать между сиденьями на ходу опасно для всех — нужно дождаться остановки."],
        ["Ignorerer det, barnet sitter jo fortsatt i setet", "Не обращаю внимания — ребёнок ведь всё ещё в кресле", "Et løsnet belte gir ingen beskyttelse ved kollisjon, dette må rettes opp så snart det er trygt.", "Отстёгнутый ремень не защитит при столкновении — это нужно исправить, как только будет безопасно."]
      ],
      "Å ta oppmerksomheten bort fra veien for å ordne noe i baksetet er svært farlig i fart. Finn et trygt sted å stanse, og løs problemet der.",
      "Отвлекаться от дороги, чтобы что-то сделать на заднем сиденье, очень опасно на скорости. Найди безопасное место для остановки и реши проблему там.",
      "Правило простое: любая проблема с ребёнком в машине решается после безопасной остановки, а не за рулём на ходу."),

    q("041", road({ lot: true }),
      "Du kolliderer lett med en annen bil på en parkeringsplass — bare materiell skade. Den andre føreren vil bare kjøre videre uten å utveksle opplysninger. Hva gjør du?",
      "Ты слегка столкнулся с другой машиной на парковке — только материальный ущерб. Другой водитель хочет просто уехать, не обменявшись данными. Что делаешь?",
      [
        ["Insisterer på å utveksle navn, adresse og forsikringsopplysninger før noen kjører fra stedet", "Настаиваю на обмене именем, адресом и данными страховки, прежде чем кто-то уедет"],
        ["Lar den andre kjøre, det er bare en parkeringsplass", "Отпускаю его — это же просто парковка", "Plikten til å utveksle opplysninger gjelder også på parkeringsplass, ikke bare på vanlig vei.", "Обязанность обменяться данными действует и на парковке, а не только на обычной дороге."],
        ["Ringer bare eget forsikringsselskap uken etter, uten å snakke med den andre føreren", "Просто звоню в свою страховую через неделю, не разговаривая со вторым водителем", "Det er ikke nok å ringe forsikringen senere, du skal utveksle opplysninger med den andre føreren på stedet.", "Позвонить в страховую позже недостаточно — данными нужно обменяться со вторым водителем на месте."],
        ["Tar bilde av skaden og drar, det holder", "Фотографирую повреждения и уезжаю — этого достаточно", "Bilder erstatter ikke plikten til å utveksle navn og adresse med den andre parten.", "Фотографии не заменяют обязанность обменяться именем и адресом с другой стороной."]
      ],
      "Alle involvert i en trafikkulykke plikter å oppgi navn og adresse, og bli på stedet til nødvendige opplysninger er utvekslet. Dette gjelder også ved kun materiell skade.",
      "Все участники ДТП обязаны сообщить имя и адрес и оставаться на месте, пока не обменяются необходимыми данными. Это касается и случаев только с материальным ущербом.",
      "Не позволяй второму водителю просто уехать — обмен данными обязателен по закону, а не только «по-хорошему»."),

    q("042", null,
      "Du drakk et par glass vin på middagsselskap i går kveld og sov godt. I dag føler du deg helt våken og skal kjøre til jobb. Hva bør du tenke på?",
      "Вчера вечером на ужине ты выпил пару бокалов вина и хорошо выспался. Сегодня чувствуешь себя бодрым и собираешься ехать на работу. О чём нужно помнить?",
      [
        ["Kroppen bryter ned alkohol sakte, og du kan fortsatt ha promille over grensen selv om du føler deg våken", "Организм расщепляет алкоголь медленно, и промилле всё ещё может быть выше нормы, даже если ты чувствуешь себя бодрым"],
        ["Etter en natts søvn er all alkohol garantert borte fra kroppen", "После ночного сна алкоголь гарантированно полностью выводится из организма", "Søvn fremskynder ikke nedbrytningen av alkohol, det er bare tiden som teller.", "Сон не ускоряет распад алкоголя, важно только прошедшее время."],
        ["Å føle seg våken betyr at promillen er under grensen", "Если чувствуешь бодрость, значит промилле уже в норме", "Følelsen av å være våken sier ingenting sikkert om promillen, den kan fortsatt være over grensen.", "Ощущение бодрости ничего не говорит о промилле — оно всё ещё может быть выше нормы."],
        ["Bare kaffe om morgenen er nok til å være sikker på å kjøre", "Достаточно выпить утром кофе, чтобы быть уверенным в возможности ехать", "Kaffe gjør deg bare mer våken, det senker ikke promillen i det hele tatt.", "Кофе лишь бодрит, на уровень промилле он никак не влияет."]
      ],
      "Kroppen bryter ned alkohol med omtrent 0,1–0,15 promille i timen. Etter en kveld med flere glass kan du fortsatt ligge over 0,2 promille neste morgen, selv om du føler deg uthvilt.",
      "Организм расщепляет алкоголь со скоростью примерно 0,1–0,15 промилле в час. После вечера с несколькими бокалами утром промилле всё ещё может быть выше 0,2, даже если чувствуешь себя выспавшимся.",
      "«Чувствую себя нормально» — не показатель. Если сомневаешься, не садись за руль или используй алкотестер."),

    q("043", scene({ you: { from: "south", to: "west" }, others: [{ from: "east", to: "west" }, { from: "west", to: "east" }], signs: { south: "yield" } }),
      "Du (A) har vikepliktskilt og skal svinge til venstre inn på hovedveien. Biler kommer både fra venstre og fra høyre. Hva gjør du?",
      "У тебя знак «уступи дорогу», и ты поворачиваешь налево на главную дорогу. Машины едут и слева, и справа. Что делать?",
      [
        ["Vente til begge retninger er fri, og svinge når det er trygt", "Подождать, пока обе стороны свободны, и повернуть, когда безопасно"],
        ["Kjøre når bilen fra høyre har passert, uten å sjekke venstre", "Поехать, как только проедет машина справа, не проверив слева", "Du skal svinge inn foran begge retninger, så en bil fra venstre er like farlig som en fra høyre.", "Ты пересекаешь обе полосы, поэтому машина слева так же опасна, как и справа."],
        ["Kjøre fort forbi begge bilene før de rekker fram", "Проскочить перед обеими машинами, пока они не подъехали", "Med vikeplikt skal du ikke presse deg inn, du vet ikke sikkert hvor fort de kommer til å kjøre.", "При знаке «уступи» нельзя пытаться проскочить — ты не знаешь точно, с какой скоростью едут те машины."],
        ["Kjøre inn og stoppe midt i krysset til det blir fritt", "Выехать и остановиться прямо посреди перекрёстка, ждать, пока освободится", "Å stanse midt i krysset blokkerer begge kjøreretninger og er farlig.", "Остановка посреди перекрёстка перекрывает оба направления движения и опасна."]
      ],
      "Ved vikepliktskilt skal du gi fri vei for all trafikk på vegen du kjører inn på, uansett hvilken side den kommer fra. Ved venstresving krysser du i tillegg den ene kjøreretningen, så du må sjekke begge veier før du kjører.",
      "Знак «уступи дорогу» означает уступить всему движению на дороге, куда ты въезжаешь, с любой стороны. При повороте налево ты ещё и пересекаешь одно из направлений, поэтому проверяй обе стороны, прежде чем ехать.",
      "Поворот налево со второстепенной: смотри налево, направо и ещё раз налево, прежде чем трогаться."),

    q("044", scene({ you: { from: "south", to: "west" }, lights: { south: "green" }, peds: ["west"] }),
      "Du har grønt lys og skal svinge til venstre. Fotgjengere krysser gangfeltet i gaten du svinger inn i, også på grønt. Hva gjør du?",
      "У тебя зелёный, поворачиваешь налево. Пешеходы переходят по переходу на той улице, куда ты поворачиваешь, — тоже на зелёный. Что делать?",
      [
        ["Vente og la fotgjengerne gå ferdig før du svinger", "Подождать, пока пешеходы закончат переход, и только потом повернуть"],
        ["Svinge først, fotgjengerne får vente siden du har grønt lys", "Повернуть первым, пешеходы подождут, у тебя же зелёный", "Grønt lys for deg fjerner ikke vikeplikten for gående i gangfeltet du kjører inn i.", "Зелёный для тебя не отменяет обязанность уступить пешеходам на переходе, в который ты въезжаешь."],
        ["Tute for å få fotgjengerne til å skynde seg", "Посигналить, чтобы пешеходы поторопились", "Lydsignal skal bare brukes for å varsle om fare, ikke for å presse gående til å haste.", "Сигнал — только для предупреждения об опасности, а не чтобы поторопить пешеходов."],
        ["Kjøre sakte gjennom gangfeltet samtidig som fotgjengerne går", "Медленно проехать через переход, пока пешеходы ещё идут", "Du har vikeplikt så lenge fotgjengerne er i gangfeltet. Å kjøre inn mellom dem, selv sakte, hindrer og skremmer dem.", "Пока пешеходы на переходе, ты обязан уступать. Въезжать между ними, даже медленно, — значит мешать им и пугать."]
      ],
      "Grønt lys gir deg rett til å kjøre, men ikke foran fotgjengere som lovlig krysser gangfeltet i gaten du svinger inn i. Vikeplikten for gående gjelder uansett hvilken vei du kommer fra.",
      "Зелёный свет даёт право ехать, но не преимущество перед пешеходами, которые законно переходят по переходу на улице, куда ты поворачиваешь. Обязанность уступить пешеходам действует независимо от того, откуда ты едешь.",
      "Поворот налево на зелёный — частая причина наезда на пешехода. Всегда проверяй переход перед въездом в улицу."),

    q("045", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], signs: { south: "priority" } }),
      "Du kjører på forkjørsvei rett fram. Bil B kommer fra venstre fra en sidevei. Hvem har vikeplikt?",
      "Ты едешь прямо по главной дороге. Машина B едет слева со второстепенной. Кто уступает?",
      [
        ["B har vikeplikt, uansett om den kommer fra høyre eller venstre", "B уступает, независимо от того, слева она или справа"],
        ["Du må vike siden B kommer fra venstre og høyreregelen ikke gjelder da", "Ты уступаешь, раз B слева, а правило правой руки тут не работает", "Høyreregelen gjelder bare der det ikke finnes skilt. Her har du forkjørsskilt, som gir deg forrang uansett hvilken side den andre bilen kommer fra.", "Правило правой руки действует только там, где нет знаков. Здесь у тебя знак «главная дорога» — он даёт тебе преимущество независимо от того, с какой стороны едет другая машина."],
        ["Dere må avtale det dere imellom med blinklys", "Нужно договориться друг с другом поворотниками", "Forkjørsskiltet avgjør vikeplikten automatisk, det er ikke noe å avtale.", "Знак приоритета сам решает, кто уступает — договариваться не о чем."],
        ["B har forrang siden den kommer fra en vei som munner ut i din", "У B преимущество, потому что её дорога вливается в твою", "Det er skiltingen, ikke hvordan veiene møtes, som avgjør vikeplikten her.", "Здесь право проезда определяет знак, а не то, как дороги сходятся."]
      ],
      "Forkjørsskiltet (gult ruteskilt) betyr at du kjører på forkjørsvei og har forkjørsrett overfor trafikk fra sideveier, uansett om de kommer fra høyre eller venstre.",
      "Знак «главная дорога» (жёлтый ромб) означает, что ты едешь по главной дороге и у тебя приоритет перед машинами со второстепенных, независимо от того, справа они или слева.",
      "Жёлтый ромб значит: ты главный на этой дороге. Сторона, откуда едет другая машина, тут не важна."),

    q("046", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "south", kind: "truck" }], roundabout: true }),
      "Du skal kjøre inn i rundkjøringen. Et vogntog (B) er allerede inne i rundkjøringen og skal svinge kort til høyre rett foran deg. Hva gjør du?",
      "Ты въезжаешь на круг. Внутри уже едет фура (B), которая почти сразу поворачивает направо прямо перед тобой. Что делать?",
      [
        ["Vente og gi god plass, lange kjøretøy trenger mer plass og kan svinge litt bredt", "Подождать и дать побольше места — длинному транспорту нужно больше места, и он может слегка заезжать шире"],
        ["Kjøre inn samtidig siden du rekker det før vogntoget passerer helt", "Въехать одновременно, ты успеешь проскочить, пока фура ещё не проехала полностью", "Du som skal inn, har vikeplikt for kjøretøy som allerede er i rundkjøringen, uansett hvor fort du tror du rekker.", "Тот, кто уже на круге, всегда имеет преимущество перед тобой — не важно, кажется тебе, что ты успеешь, или нет."],
        ["Blinke og kjøre inn for å vise vogntoget at du kommer", "Помигать поворотником и въехать, показав фуре, что ты едешь", "Blinklys endrer ikke vikeplikten. Trafikk inne i rundkjøringen har uansett forrang.", "Поворотник не меняет, кто уступает. У тех, кто уже на круге, преимущество в любом случае."],
        ["Kjøre tett bak vogntoget med en gang det har begynt å svinge, uten å vente på at det er helt ute av veien", "Ехать вплотную за фурой, как только она начала поворачивать, не дожидаясь, пока она полностью освободит дорогу", "Et langt kjøretøy kan fortsatt svinge ut i din bane. Vent til det er tydelig fri plass.", "Длинная фура ещё может выехать на твою траекторию при повороте. Дожидайся, пока место точно освободится."]
      ],
      "Du som skal inn i rundkjøringen, har vikeplikt for trafikk som allerede er inne. Lange kjøretøy som vogntog trenger ofte mer plass og kan bevege seg litt bredt i svingen, så gi ekstra klaring.",
      "На круге у тех, кто уже едет по нему, всегда преимущество перед теми, кто въезжает. Длинному транспорту вроде фуры часто нужно больше места на повороте, поэтому дай дополнительный запас.",
      "Фура на круге — жди подольше: она может «гулять» по ширине на повороте."),

    q("047", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west", kind: "bike" }] }),
      "Kryss uten skilt. En syklist kommer fra høyre. Hvem har vikeplikt?",
      "Нерегулируемый перекрёсток без знаков. Справа едет велосипедист. Кто уступает?",
      [
        ["Du har vikeplikt for syklisten, høyreregelen gjelder også for syklister", "Ты уступаешь велосипедисту — правило правой руки действует и для велосипедистов"],
        ["Syklisten må alltid vike for bil, uansett side", "Велосипедист всегда уступает машине, независимо от стороны", "Syklister har samme vikeplikt-status som andre kjøretøy etter høyreregelen, det finnes ikke noe unntak for dem.", "У велосипедистов те же права по правилу правой руки, что и у остальных — исключения для них нет."],
        ["Ingen har vikeplikt siden en av dere er syklist", "Никто никому не уступает, раз один из участников — велосипедист", "Høyreregelen gjelder for alt kjørende trafikk, sykkel inkludert. Det er alltid en som skal vike.", "Правило правой руки действует для любого движущегося транспорта, включая велосипед. Кто-то всегда уступает."],
        ["Du kan kjøre fort forbi fordi sykler er lettere å stoppe enn biler", "Можно проехать быстро — велосипед легче остановить, чем машину", "Vikeplikten avhenger av retning, ikke av hvor lett et kjøretøy kan stoppe.", "Кто уступает, зависит от направления движения, а не от того, насколько легко кому-то остановиться."]
      ],
      "Høyreregelen gjelder likt for alle kjøretøy, også sykler. Kommer en syklist fra høyre i et kryss uten skilt, har du vikeplikt for den akkurat som for en bil.",
      "Правило правой руки действует одинаково для всех участников движения, включая велосипедистов. Если велосипедист едет справа на нерегулируемом перекрёстке, ты уступаешь ему точно так же, как машине.",
      "Велосипед на перекрёстке — это тоже «транспорт справа». Забыть про него — частая ошибка."),

    q("048", road({ crossing: "far" }),
      "Fotgjengeren har nesten krysset gangfeltet og har bare noen skritt igjen, lengst unna deg. Kan du kjøre nå?",
      "Пешеход почти перешёл дорогу, ему осталось буквально пару шагов на дальней стороне. Можно ехать?",
      [
        ["Nei, vent til fotgjengeren er helt ute av gangfeltet", "Нет, подожди, пока пешеход полностью не покинет переход"],
        ["Ja, siden fotgjengeren er langt unna bilen din", "Да, пешеход ведь далеко от твоей машины", "Vikeplikten gjelder hele gangfeltet, ikke bare den delen nærmest deg. Du skal vente til feltet er helt fritt.", "Обязанность уступить действует на весь переход целиком, а не только на ближнюю к тебе часть. Ждать нужно, пока переход полностью не освободится."],
        ["Ja, du kan kjøre sakte forbi bak fotgjengeren", "Да, можно медленно проехать позади пешехода", "Så lenge fotgjengeren er i gangfeltet, har du vikeplikt. Å kjøre forbi mens han fortsatt går, kan skremme ham og gir ham ikke ro til å gå over.", "Пока пешеход на переходе, ты обязан уступать. Проезжать, пока он ещё идёт, — значит пугать его и не давать спокойно перейти."],
        ["Ja, men bare hvis du tuter først", "Да, но только если сначала посигналить", "Lydsignal gir deg ikke rett til å kjøre gjennom et gangfelt noen fortsatt bruker.", "Сигнал не даёт права проехать через переход, пока по нему ещё идёт человек."]
      ],
      "Trafikkreglene § 9 nr 2: du har vikeplikt for gående som er på vei ut i eller befinner seg i gangfeltet. Den gjelder så lenge fotgjengeren er i feltet, ikke bare til han har passert din side av vegen.",
      "Trafikkreglene § 9 nr 2: ты уступаешь пешеходам, которые вступают на переход или находятся на нём. Это действует, пока пешеход на переходе, а не только пока он не прошёл твою сторону дороги.",
      "«Почти закончил» — не то же самое, что «закончил». Жди, пока переход будет полностью пуст."),

    q("049", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }], lights: { south: "yellow", east: "yellow" } }),
      "Trafikklyset blinker gult i alle retninger (ute av vanlig drift). Det finnes ingen andre skilt i krysset. Bil B kommer fra høyre. Hvem har vikeplikt?",
      "Светофор мигает жёлтым во всех направлениях (работает в аварийном режиме). Других знаков на перекрёстке нет. Машина B едет справа. Кто уступает?",
      [
        ["Du har vikeplikt for B, høyreregelen gjelder som om lyset var slukket", "Ты уступаешь B — действует правило правой руки, как будто светофор выключен"],
        ["Ingen har vikeplikt, blinkende gult betyr fri kjøring for alle", "Никто не уступает, мигающий жёлтый значит «можно всем ехать свободно»", "Blinkende gult betyr bare at lyset er satt ut av vanlig drift og krever særlig aktsomhet, det fjerner ikke vikepliktsreglene, det aktiverer dem.", "Мигающий жёлтый означает лишь, что светофор работает в особом режиме и требует повышенной осторожности — правила приоритета от этого не исчезают, наоборот, включаются."],
        ["Du har forrang siden lyset uansett teller som grønt for deg", "У тебя преимущество, потому что мигающий свет всё равно считается зелёным для тебя", "Blinkende gult er ikke det samme som grønt lys, det betyr at lyssignalet ikke styrer krysset lenger.", "Мигающий жёлтый — это не то же самое, что зелёный, это значит, что светофор больше не управляет перекрёстком."],
        ["Dere må begge stoppe helt og vente til den andre kjører først", "Обеим машинам нужно полностью остановиться и ждать, пока другая поедет первой", "Det er ikke krav om full stopp for begge, bare om å vise vikeplikt etter høyreregelen på vanlig måte.", "Полная остановка для обоих не требуется — нужно просто уступить по обычному правилу правой руки."]
      ],
      "Blinkende gult lys betyr at trafikklyset er ute av drift og krever særlig aktpågivenhet. Uten andre skilt gjelder høyreregelen som i et vanlig kryss uten lys.",
      "Мигающий жёлтый означает, что светофор не регулирует перекрёсток и требует особой осторожности. Без других знаков действует правило правой руки, как на обычном нерегулируемом перекрёстке.",
      "Мигающий жёлтый = светофора как бы нет. Смотри на знаки и на правило правой руки."),

    q("050", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "north", kind: "bike" }] }),
      "En syklist kommer ut fra en sykkelvei og skal inn på vegen din, i samme retning som deg. Det er ikke skilt eller lys. Hvem har vikeplikt?",
      "Велосипедист выезжает с велодорожки на твою дорогу, в том же направлении, что и ты. Знаков и светофора нет. Кто уступает?",
      [
        ["Syklisten har vikeplikt for deg", "Велосипедист уступает тебе"],
        ["Du har vikeplikt for syklisten, syklister har alltid forrang i trafikken", "Ты уступаешь велосипедисту — у велосипедистов всегда преимущество", "Syklister har ikke automatisk forrang. Den som forlater en sykkelvei og skal ut på vanlig veg, skal selv vike for trafikken der.", "У велосипедистов нет автоматического преимущества. Тот, кто съезжает с велодорожки на обычную дорогу, сам обязан уступить транспорту на ней."],
        ["Høyreregelen avgjør, siden syklisten kommer fra venstre", "Решает правило правой руки — велосипедист слева", "Høyreregelen gjelder i kryss mellom veger, ikke når noen forlater en sykkelvei. Der gjelder en egen regel: syklisten viker.", "Правило правой руки действует на перекрёстках дорог, а не там, где кто-то съезжает с велодорожки. Там своё правило: уступает велосипедист."],
        ["Den som kommer først har forrang", "Преимущество у того, кто подъехал первым", "Ankomsttidspunktet har ingen betydning her. Regelen er entydig: syklisten som forlater sykkelveien, skal vike.", "Момент прибытия тут роли не играет. Правило однозначное: велосипедист, съезжающий с велодорожки, обязан уступить."]
      ],
      "Trafikkreglene § 7 nr. 4: den som kjører ut fra sykkelveg, gangveg, fortau eller lignende, skal vike for trafikk på vegen han kjører ut på. Dette gjelder selv om syklisten skal samme vei som deg.",
      "Trafikkreglene § 7 nr. 4: тот, кто выезжает с велодорожки, тротуара или похожего пути, обязан уступить транспорту на дороге, куда он выезжает. Это действует, даже если велосипедист едет туда же, куда и ты.",
      "Запомни исключение: велосипедист на велодорожке не «главный». Съезжая на дорогу, он уступает сам."),

    q("051", scene({ you: { from: "south", to: "east" }, others: [{ from: "south", to: "north", kind: "bike" }], peds: ["east"] }),
      "Du skal svinge til høyre. En syklist på høyre side av deg skal rett fram, og en fotgjenger er på veg over gangfeltet på veien du svinger inn på. Hva gjør du?",
      "Ты собираешься повернуть направо. Велосипедист справа от тебя едет прямо, а пешеход переходит по зебре ту дорогу, на которую ты поворачиваешь. Что делаешь?",
      [
        ["Vike for både syklisten og fotgjengeren før jeg svinger", "Уступить и велосипедисту, и пешеходу, прежде чем повернуть"],
        ["Vike bare for fotgjengeren, syklisten må passe seg selv", "Уступить только пешеходу — велосипедист пусть сам смотрит", "Trafikkreglene § 7 nr. 3 gir syklende samme beskyttelse som gående ved svinging. Du skal vike for begge.", "Trafikkreglene § 7 nr. 3 даёт велосипедистам ту же защиту, что и пешеходам, при повороте. Уступить нужно обоим."],
        ["Svinge raskt forbi syklisten før fotgjengeren rekker fram", "Быстро проскочить мимо велосипедиста, пока пешеход не дошёл", "Å skynde seg forbi en syklist som kommer rett fram er nettopp det vikeplikten skal hindre, dette er farlig og feil.", "Спешить, чтобы проскочить перед велосипедистом, едущим прямо, — именно то, что должна предотвращать обязанность уступить. Это опасно и неверно."],
        ["Vike bare for syklisten, fotgjengeren har ikke gått ut i feltet ennå", "Уступить только велосипедисту — пешеход ещё не вышел на переход", "Fotgjengeren er allerede i ferd med å krysse gangfeltet du svinger inn på, du skal vike for ham også.", "Пешеход уже переходит зебру той дороги, куда ты поворачиваешь, — ему тоже нужно уступить."]
      ],
      "Trafikkreglene § 7 nr. 3: den som svinger, skal vike for gående som er i ferd med å krysse den vegen svingen fører inn på, og for syklende som kjører rett fram. Begge skal sjekkes før du fullfører svingen.",
      "Trafikkreglene § 7 nr. 3: поворачивающий водитель обязан уступить пешеходам, переходящим ту дорогу, куда ведёт поворот, и велосипедистам, едущим прямо. Перед завершением поворота нужно проверить и тех, и других.",
      "Поворот направо — это два взгляда: назад-вправо (велосипед) и вперёд (пешеход на переходе)."),

    q("052", null,
      "Du har nettopp parkert bilen langs en gate der det er sykkelfelt rett ved siden av bilen. Hva bør du gjøre før du åpner bildøren?",
      "Ты только что припарковался вдоль улицы, где прямо рядом с машиной проходит велополоса. Что нужно сделать, прежде чем открыть дверь?",
      [
        ["Se deg over skulderen og sjekke om det kommer en syklist, før du åpner døren forsiktig", "Оглянуться через плечо и проверить, не едет ли велосипедист, прежде чем аккуратно открыть дверь"],
        ["Åpne døren raskt, syklister har plikt til å se opp for dører", "Быстро открыть дверь — велосипедисты сами обязаны следить за дверями", "Det er føreren som må sjekke for syklister før døren åpnes, ikke omvendt. En syklist rekker ofte ikke å reagere på en dør som åpnes brått.", "Именно водитель должен проверить, нет ли велосипедистов, прежде чем открыть дверь, а не наоборот. Велосипедист часто просто не успевает среагировать на резко открывшуюся дверь."],
        ["Bruke høyre hånd til å åpne døren fra førersetet, det er nok", "Открыть дверь правой рукой с водительского места — этого достаточно", "Å bruke motsatt hånd hjelper deg å snu overkroppen og se bakover, men det erstatter ikke å faktisk sjekke om det kommer noen.", "Открывание дальней рукой помогает развернуть корпус и посмотреть назад, но само по себе не заменяет реальную проверку — велосипедиста всё равно нужно высматривать."],
        ["Det er ikke noe å tenke på, sykkelfeltet er syklistens eget ansvar", "Тут не о чем думать — велополоса — это забота самого велосипедиста", "Å åpne en bildør rett foran en syklist kan forårsake en alvorlig ulykke. Ansvaret for å sjekke ligger hos deg som åpner døren.", "Открыть дверь прямо перед велосипедистом — это может привести к серьёзной аварии. Ответственность за проверку лежит на том, кто открывает дверь."]
      ],
      "Å åpne bildøren uten å se seg for («dooring») er en vanlig årsak til alvorlige sykkelulykker. Sjekk alltid i speilet og over skulderen for syklister før du åpner døren mot et sykkelfelt eller en kjørebane.",
      "Открывание двери без проверки («дуринг») — частая причина серьёзных аварий с велосипедистами. Перед тем как открыть дверь в сторону велополосы или проезжей части, всегда проверяй зеркало и оглядывайся через плечо.",
      "Правило «голландской ручки»: открывай дверь дальней от улицы рукой — тело само развернётся, и ты увидишь велосипедиста."),

    q("053", null,
      "Du har kjørt lenge på motorveien og merker at du blir søvnig og øynene faller igjen. Hva er tryggest å gjøre?",
      "Ты долго едешь по автомагистрали и чувствуешь, что засыпаешь — глаза сами закрываются. Что безопаснее всего сделать?",
      [
        ["Finne nærmeste rasteplass eller parkeringsplass og stoppe for å hvile", "Найти ближайшую площадку отдыха или парковку и остановиться отдохнуть"],
        ["Skru opp musikken og åpne vinduet, det holder deg våken lenge nok", "Включить музыку погромче и открыть окно — этого хватит, чтобы не заснуть", "Slike triks gir bare en kortvarig effekt. De fjerner ikke den underliggende trøttheten, og mikrosøvn kan komme uansett.", "Такие трюки дают лишь кратковременный эффект. Настоящая усталость никуда не девается, и микросон всё равно может наступить."],
        ["Kjøre litt saktere enn normalt, så rekker du å reagere selv om du blir trøtt", "Ехать чуть медленнее обычного — так успеешь среагировать, даже если заснёшь", "Lavere fart reduserer ikke faren for mikrosøvn. Selv i lav fart mister du kontrollen fullstendig hvis du sovner.", "Меньшая скорость не снижает риск микросна. Даже на небольшой скорости, если заснуть, контроль над машиной теряется полностью."],
        ["Fortsette til du kommer fram, korte pauser hjelper ikke uansett", "Ехать до конца пути — короткие остановки всё равно не помогут", "Korte pauser og hvile hjelper faktisk mye mot trøtthet. Å fortsette å kjøre trøtt er svært farlig og en vanlig årsak til utforkjøringsulykker.", "Короткие остановки и отдых реально помогают от усталости. Продолжать ехать сонным очень опасно и часто становится причиной съезда с дороги."]
      ],
      "Trøtthet bak rattet er en av de vanligste årsakene til alvorlige ulykker, spesielt på motorvei om natten. Eneste effektive tiltak er å stoppe og hvile, gjerne med en kort lur på 15–20 minutter.",
      "Усталость за рулём — одна из самых частых причин тяжёлых аварий, особенно ночью на автомагистрали. Единственная действенная мера — остановиться и отдохнуть, желательно вздремнуть 15–20 минут.",
      "Если веки тяжелеют — это уже не «я потерплю», это сигнал ехать на ближайшую стоянку."),

    q("054", null,
      "Du kjører nedover en lang, bratt bakke om vinteren på snø og is. Hva er lurest for å holde kontroll på farten?",
      "Зимой ты едешь вниз по длинному крутому спуску по снегу и льду. Как разумнее всего контролировать скорость?",
      [
        ["Kjøre i et lavt gir og bruke motorbremsing, i tillegg til lette bremsetrykk", "Ехать на пониженной передаче, используя торможение двигателем, и слегка подтормаживать"],
        ["Sette inn kraftig og lang bremsing hele veien ned", "Всю дорогу вниз тормозить сильно и долго", "Lang, kraftig bremsing på glatt føre øker faren for at hjulene mister grepet og bilen sklir ukontrollert.", "Долгое сильное торможение на скользком покрытии повышает риск, что колёса потеряют сцепление, и машину понесёт."],
        ["Kjøre i fri (nøytral) for å spare drivstoff", "Ехать на нейтральной передаче, чтобы сэкономить топливо", "I fri gir mister du motorbremsingen og må stole helt på fotbremsen, det gir dårligere kontroll i bakken.", "На нейтральной передаче ты теряешь торможение двигателем и полагаешься только на педаль тормоза — контроль в спуске хуже."],
        ["Øke farten litt for å komme fortere gjennom bakken", "Слегка увеличить скорость, чтобы быстрее проехать спуск", "Høyere fart i en bratt bakke på glatt føre gjør det enda vanskeligere å stoppe i tide hvis noe skjer.", "Более высокая скорость на скользком крутом спуске ещё больше усложняет остановку вовремя, если что-то случится."]
      ],
      "På glatt føre i bakker bør du bruke et lavt gir og la motorbremsingen ta mye av jobben, med forsiktige, lette bremsetrykk i tillegg. Det gir jevnere fartskontroll enn kraftig fotbremsing alene.",
      "На скользком спуске стоит ехать на пониженной передаче и использовать торможение двигателем, слегка подтормаживая педалью. Это даёт более плавный контроль скорости, чем резкое торможение педалью само по себе.",
      "Правило зимнего спуска: вниз — на той же передаче, на которой поднимался бы в эту горку."),

    q("055", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south", kind: "tram" }] }),
      "Du skal svinge til venstre, og en sporvogn (trikk) kommer rett fram i samme kryss. Hvem har vikeplikt?",
      "Ты поворачиваешь налево, и трамвай едет прямо через тот же перекрёсток. Кто уступает?",
      [
        ["Du skal gi trikken fri veg: alle trafikanter skal vike for sporvogn", "Ты уступаешь трамваю: все участники движения обязаны пропускать трамвай"],
        ["Trikken må vike siden du svinger og den kjører rett fram på skinner", "Уступает трамвай, раз ты поворачиваешь, а он просто едет по рельсам", "Det er omvendt: trafikkreglene § 10 nr 2 sier at alle skal gi sporvogn fri veg, uansett om den kjører rett fram eller du svinger.", "У трамвая приоритет перед всеми остальными участниками движения по § 10, независимо от того, едет он прямо или ты поворачиваешь."],
        ["Det avhenger av hvem som kom først til krysset", "Зависит от того, кто подъехал к перекрёстку первым", "Ankomsttidspunktet spiller ingen rolle her, trikken har forrang etter en egen regel, ikke etter høyreregelen.", "Момент прибытия тут ни при чём — у трамвая приоритет по отдельному правилу, а не по правилу правой руки."],
        ["Høyreregelen avgjør", "Решает правило правой руки", "Høyreregelen gjelder ikke overfor sporvogn. Alle skal gi trikken fri veg, uansett hvilken side den kommer fra.", "Правило правой руки не применяется к трамваю. У него приоритет всегда, независимо от того, с какой стороны он едет."]
      ],
      "Trafikkreglene § 10 nr. 2: trafikanter skal gi fri veg og om nødvendig stanse for sporvogn. Det gjelder også når du svinger og trikken kjører rett fram.",
      "Trafikkreglene § 10 nr. 2: все участники движения обязаны уступать дорогу трамваю и при необходимости останавливаться. Это действует и тогда, когда ты поворачиваешь, а трамвай едет прямо.",
      "Трамвай — как король на шахматной доске: ему уступают всегда, никакие другие правила его не перебивают."),

    q("056", scene({ you: { from: "south", to: "north" }, lights: { south: "red" } }),
      "Du står i kø for rødt lys og telefonen din pipir med en melding. Har du lov til å lese eller skrive på håndholdt mobil nå?",
      "Ты стоишь в очереди на красный свет, и телефон пикнул с сообщением. Можно ли читать или писать в телефоне прямо сейчас?",
      [
        ["Nei, kortvarig stans i kø eller ved rødt lys regnes som kjøring, håndholdt mobil er forbudt", "Нет, короткая остановка в пробке или на красный считается движением — телефон в руках запрещён"],
        ["Ja, siden bilen står stille akkurat nå", "Да, ведь машина сейчас стоит на месте", "Bilen står bare midlertidig, ikke parkert. Kjøring omfatter også slike korte stopp, så håndholdt mobilbruk er fortsatt forbudt.", "Машина стоит лишь временно, а не припаркована. Понятие «за рулём» включает и такие короткие остановки, так что телефон в руках всё равно под запретом."],
        ["Ja, så lenge du legger den fra deg igjen før lyset blir grønt", "Да, главное — отложить телефон до того, как загорится зелёный", "Det er ikke lov i det hele tatt å holde telefonen mens du kjører, uansett hvor raskt du legger den fra deg.", "Держать телефон в руке во время движения нельзя вообще — неважно, как быстро потом его отложить."],
        ["Ja, men bare for å lese, ikke for å skrive", "Да, но только читать, не набирать текст", "Forbudet mot håndholdt mobil skiller ikke mellom å lese og å skrive, begge deler er ulovlig når bilen ikke er trygt parkert.", "Запрет на телефон в руках не различает чтение и набор текста — и то, и другое запрещено, пока машина не припаркована как следует."]
      ],
      "Håndholdt mobiltelefon er forbudt under kjøring, og det inkluderer korte stopp som kø eller rødt lys. Du kan bare bruke den håndholdt når bilen er trygt parkert.",
      "Телефон в руках запрещён во время движения, и это включает короткие остановки — пробку или красный свет. Пользоваться им в руках можно только когда машина по-настоящему припаркована.",
      "«Стоим на красном» — это ещё «за рулём», а не «припарковались». Телефон подождёт до настоящей стоянки."),

    q("057", null,
      "Du kjører sakte forbi et fortau. En syklist kommer ut fra fortauet og skal ut i kjørebanen rett foran deg. Hvem har vikeplikt?",
      "Ты медленно едешь мимо тротуара. Велосипедист съезжает с тротуара на проезжую часть прямо перед тобой. Кто уступает?",
      [
        ["Syklisten har vikeplikt for meg, siden han kommer fra fortau/sykkelveg ut i kjørebanen", "Уступает велосипедист — он выезжает с тротуара/велодорожки на проезжую часть"],
        ["Jeg må vike, syklister har alltid forrang i trafikken", "Уступаю я — у велосипедистов всегда преимущество", "Syklister har ikke automatisk forrang overalt. Den som kjører ut fra fortau eller sykkelveg til kjørebanen, skal selv vike for trafikken der.", "У велосипедистов нет автоматического преимущества везде. Тот, кто выезжает с тротуара или велодорожки на проезжую часть, сам обязан уступить транспорту на ней."],
        ["Høyreregelen avgjør, siden syklisten kommer fra høyre", "Решает правило правой руки, ведь велосипедист справа", "Høyreregelen gjelder mellom veier i et kryss, ikke når noen kjører ut fra fortau eller sykkelveg til kjørebanen.", "Правило правой руки действует между дорогами на перекрёстке, а не когда кто-то выезжает с тротуара или велодорожки на проезжую часть."],
        ["Den som kommer først til stedet, kjører først", "Первым едет тот, кто раньше подъехал", "Ankomsttidspunkt er ikke avgjørende her. Regelen er klar: den som kommer fra fortau eller sykkelveg, har vikeplikt uansett.", "Момент прибытия тут роли не играет. Правило чёткое: выезжающий с тротуара или велодорожки уступает в любом случае."]
      ],
      "Trafikkreglene § 7 nr. 4: den som kjører ut fra fortau, gangveg eller sykkelveg til kjørebanen, har vikeplikt for trafikken der. Dette gjelder også syklister.",
      "Trafikkreglene § 7 nr. 4: тот, кто выезжает с тротуара, пешеходной или велодорожки на проезжую часть, уступает движению на ней. Это касается и велосипедистов.",
      "Съезжаешь с тротуара или велодорожки на дорогу — сам уступаешь, кем бы ты ни был, хоть на велосипеде, хоть пешком."),

    q("058", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east" }], roundabout: true, lights: { south: "red" } }),
      "Du nærmer deg en rundkjøring der det også står et trafikklys, og lyset er rødt. Hva gjør du?",
      "Ты подъезжаешь к кругу, на котором есть светофор, и горит красный. Что делаешь?",
      [
        ["Stopper for det røde lyset, selv om det ikke er andre biler i rundkjøringen", "Останавливаюсь на красный, даже если на круге никого нет"],
        ["Kjører inn som vanlig, i rundkjøring er det bare vikeplikt, ikke stopplikt", "Еду как обычно — на круге действует только уступание, а не остановка", "Der en rundkjøring er signalregulert, går lyset foran den vanlige vikeplikten. Rødt lys betyr stopp, akkurat som i et vanlig kryss.", "Там, где круг регулируется светофором, сигнал важнее обычного правила уступания. Красный значит стоп, точно как на обычном перекрёстке."],
        ["Senker bare farten litt og kjører videre", "Просто немного сбрасываю скорость и еду дальше", "Rødt lys krever full stopp, ikke bare fartsreduksjon, selv i en rundkjøring.", "Красный требует полной остановки, а не просто снижения скорости, даже на круге."],
        ["Ser bort fra lyset fordi rundkjøringer alltid styres av vikeplikt", "Игнорирую светофор — круги всегда регулируются уступанием", "Noen rundkjøringer er signalregulerte nettopp for å styre stor trafikkmengde, og da gjelder lyset, ikke den vanlige vikeplikten.", "Некоторые круги как раз регулируются светофором, чтобы справляться с большим потоком — тогда действует сигнал, а не обычное правило уступания."]
      ],
      "Noen rundkjøringer har trafikklys, ofte for å regulere tungt trafikkert innkjøring. Da går lyssignalet foran den vanlige regelen om å vike for trafikk i rundkjøringen — rødt betyr stopp.",
      "У некоторых кругов есть светофор — обычно там, где нужно регулировать плотный поток на въезде. Тогда сигнал светофора важнее обычного правила уступания на круге — красный значит стоп.",
      "Если на круге есть светофор — забудь про обычное «уступи тем, кто на круге»: работает обычная логика светофора."),

    q("059", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east", kind: "truck" }] }),
      "Kryss uten skilt. Et vogntog kommer fra venstre. Hvem kjører først?",
      "Перекрёсток без знаков. Слева едет фура. Кто едет первым?",
      [
        ["Jeg kjører først, vogntoget kommer fra venstre og må vike for meg", "Первым еду я — фура слева и должна уступить мне"],
        ["Vogntoget kjører først, det er størst og trenger mer plass", "Первой едет фура — она больше и ей нужно больше места", "Størrelsen på kjøretøyet har ingen betydning for vikeplikten. Høyreregelen avgjør ut fra retning, ikke ut fra hvor stort kjøretøyet er.", "Размер машины никак не влияет на обязанность уступить. Правило правой руки решает по направлению, а не по габаритам."],
        ["Vi må begge stoppe og vinke hverandre fram", "Мы оба должны остановиться и жестами пропустить друг друга", "Høyreregelen gir et klart svar uten at dere trenger å avtale noe med tegn.", "Правило правой руки даёт чёткий ответ без необходимости договариваться жестами."],
        ["Det er tryggest at vogntoget kjører først siden det bremser saktere", "Безопаснее, если фура поедет первой — она медленнее тормозит", "Bremseevne er ikke en del av vikepliktreglene. Det er retningen kjøretøyet kommer fra som avgjør, ikke hvor fort det kan stoppe.", "Тормозные свойства не входят в правила уступания. Решает направление, откуда едет машина, а не то, как быстро она может остановиться."]
      ],
      "Høyreregelen gjelder likt for alle kjøretøy, uansett størrelse. Kommer et kjøretøy fra venstre for deg i et kryss uten skilt eller lys, er det det som skal vike, enten det er en sykkel eller et vogntog.",
      "Правило правой руки действует одинаково для всех, независимо от размера. Если машина едет слева от тебя на перекрёстке без знаков и светофора, уступать должна именно она — хоть велосипед, хоть фура.",
      "Забудь про размер машины — на перекрёстке без знаков решает только направление: «слева» всегда уступает."),

    q("060", scene({ you: { from: "south", to: "north" }, peds: ["north"], lights: { south: "yellow" } }),
      "Du nærmer deg et gangfelt der det henger et blinkende gult lys over veien, uten rødt eller grønt. En fotgjenger står klar til å krysse. Hva gjør du?",
      "Ты подъезжаешь к пешеходному переходу, над которым мигает жёлтый сигнал — без красного и зелёного. Пешеход готов переходить дорогу. Что делаешь?",
      [
        ["Senker farten, viser ekstra aktsomhet og slipper fotgjengeren fram i gangfeltet", "Снижаю скорость, проявляю особую осторожность и пропускаю пешехода на переходе"],
        ["Kjører som normalt, blinkende gult betyr at jeg har forrang", "Еду как обычно — мигающий жёлтый значит, что у меня преимущество", "Blinkende gult gir ingen forrang til noen, det er bare et varsel om å vise særlig aktsomhet. Fotgjengeren i gangfeltet har fortsatt rett til å gå, og du skal slippe ham fram.", "Мигающий жёлтый никому не даёт преимущества — это просто сигнал проявить особую осторожность. Пешеход на переходе всё равно имеет право пройти, а ты его пропускаешь."],
        ["Stopper helt opp foran gangfeltet i alle tilfeller", "В любом случае полностью останавливаюсь перед переходом", "Blinkende gult krever ikke alltid full stopp, men aktsomhet og at du faktisk slipper fram fotgjengere som skal krysse.", "Мигающий жёлтый не всегда требует полной остановки — важна осторожность и то, что пешехода на переходе действительно пропускают."],
        ["Kjører forbi fordi lyset ikke er rødt", "Проезжаю, ведь сигнал не красный", "Fraværet av rødt lys fritar deg ikke for vikeplikten overfor fotgjengere som allerede står klare i gangfeltet.", "Отсутствие красного не освобождает от обязанности уступить пешеходам, которые уже готовы перейти на переходе."]
      ],
      "Blinkende gult lys betyr «særlig aktpågivenhet og varsomhet» — det gir ingen automatisk forrang. Ved et gangfelt har fotgjengere som skal krysse, uansett rett til å gå, og du skal senke farten og slippe dem fram.",
      "Мигающий жёлтый значит «особая внимательность и осторожность» — сам по себе он никому не даёт автоматического преимущества. На пешеходном переходе пешеход, который переходит, в любом случае имеет право пройти, и ты обязан снизить скорость и пропустить его.",
      "Мигающий жёлтый — это не «зелёный без обязательств», это «думай сам, но пешехода на переходе пропусти»."),

    q("061", scene({ you: { from: "south", to: "east" }, signs: { south: "priority" }, peds: ["east"] }),
      "Du kjører på forkjørsvei og skal svinge til høyre. En fotgjenger går i gangfeltet på veien du svinger inn på. Har forkjørsretten din noe å si her?",
      "Ты едешь по главной дороге и поворачиваешь направо. По переходу на дороге, куда ты поворачиваешь, идёт пешеход. Имеет ли значение твой приоритет по главной дороге?",
      [
        ["Nei, forkjørsrett gjelder bare mot andre kjøretøy — jeg skal uansett vike for fotgjengeren i gangfeltet", "Нет, приоритет по главной действует только относительно других машин — пешехода на переходе я всё равно пропускаю"],
        ["Ja, forkjørsveien gir meg forrang over alle, også fotgjengere", "Да, главная дорога даёт преимущество надо всеми, включая пешеходов", "Forkjørsrett regulerer bare forholdet mellom kjøretøy på ulike veier. Den fritar deg aldri for vikeplikten overfor fotgjengere i gangfelt.", "Приоритет по главной дороге регулирует только отношения между машинами на разных дорогах. От обязанности уступить пешеходам на переходе он никогда не освобождает."],
        ["Bare hvis fotgjengeren allerede er over halvveis", "Только если пешеход уже прошёл больше половины перехода", "Vikeplikten for svingende trafikk overfor fotgjengere i gangfelt gjelder uansett hvor langt fotgjengeren har kommet.", "Обязанность уступить пешеходу на переходе при повороте действует независимо от того, как далеко он прошёл."],
        ["Nei, men bare fordi det ikke er gangfelt, det er vanlig fortau", "Нет, но только потому что это не переход, а обычный тротуар", "Spørsmålet gjelder nettopp et gangfelt, ikke et vanlig fortau — og selv om det var et fortau, skal du fortsatt vike der du krysser det.", "В вопросе речь именно о пешеходном переходе, а не обычном тротуаре — но даже пересекая тротуар, ты всё равно обязан уступить."]
      ],
      "Skilting om forkjørsvei regulerer bare rekkefølgen mellom kjøretøy. Når du svinger og krysser et gangfelt, har fotgjengere som går der, alltid rett til å gå ferdig — det gjelder uansett om du kommer fra en forkjørsvei eller ikke.",
      "Знак главной дороги регулирует только очерёдность между машинами. Когда ты поворачиваешь и пересекаешь пешеходный переход, идущие по нему пешеходы всегда имеют право закончить переход — независимо от того, едешь ли ты по главной дороге.",
      "Главная дорога решает спор с другими машинами, а не с пешеходами. Пешеход на переходе побеждает всегда."),

    q("062", null,
      "Du ligger bak en traktor som kjører sakte. Midtlinjen er brutt (stiplet), men rett foran ser du at den blir heltrukket idet veien går over en bakketopp. Hva gjør du?",
      "Ты едешь за трактором, который тащится медленно. Осевая прерывистая, но впереди видно, что она становится сплошной прямо перед вершиной подъёма. Что делаешь?",
      [
        ["Avbryter planen om forbikjøring der, og venter til jeg har bedre sikt og lovlig linje", "Отменяю обгон именно там и жду, пока не будет лучше видимость и разрешающая разметка"],
        ["Rekker forbikjøringen akkurat før den heltrukne linjen begynner", "Успеваю обогнать как раз перед началом сплошной линии", "En uoversiktlig bakketopp er farlig for forbikjøring uansett hvor linjen begynner, og du vet ikke sikkert at du rekker det trygt før linjen eller bakketoppen.", "Непросматриваемая вершина подъёма опасна для обгона независимо от того, где начинается линия, и ты не можешь быть уверен, что успеешь безопасно до линии или вершины."],
        ["Kjører forbi likevel, stiplet linje der jeg starter gjør det lovlig", "Всё равно обгоняю — раз начал на прерывистой, значит можно", "Det er hele forbikjøringen, ikke bare starten, som må skje på stiplet linje og med god sikt. Fullføres den over en heltrukket linje eller uoversiktlig bakketopp, er det ulovlig.", "На прерывистой линии и при хорошей видимости должен проходить весь обгон целиком, а не только его начало. Если он завершается на сплошной линии или у непросматриваемого подъёма — это нарушение."],
        ["Tuter og kjører forbi i høy fart for å bli fort ferdig", "Сигналю и обгоняю на большой скорости, чтобы быстрее закончить", "Høyere fart øker faren ved en uoversiktlig bakketopp i stedet for å redusere den, og signalhorn endrer ikke på at sikten er for dårlig.", "Более высокая скорость у непросматриваемого подъёма только увеличивает опасность, а не снижает её, а гудок никак не улучшает видимость."]
      ],
      "Forbikjøring er forbudt der sikten er for dårlig, som ved en uoversiktlig bakketopp, og hele forbikjøringen må gjennomføres på strekning med stiplet linje. Ser du at linjen blir heltrukket eller sikten forsvinner, avbryter du planen i tide.",
      "Обгон запрещён там, где видимость недостаточна, например у непросматриваемого подъёма, и весь обгон целиком должен пройти на участке с прерывистой линией. Если видишь, что линия становится сплошной или видимость пропадает, — заранее откажись от манёвра.",
      "Не начинай обгон, если не уверен, что успеешь ЗАКОНЧИТЬ его на прерывистой линии и с хорошим обзором."),

    q("063", null,
      "Du vil bruke tresekundersregelen for å sjekke avstanden til bilen foran på tørr motorvei. Hvordan gjør du det riktig?",
      "Ты хочешь применить правило трёх секунд, чтобы проверить дистанцию до машины впереди на сухой автомагистрали. Как сделать это правильно?",
      [
        ["Merker deg et fast punkt langs veien, teller sekunder fra bilen foran passerer det til du selv passerer det samme punktet", "Замечаю неподвижную точку у дороги и считаю секунды от момента, когда её проезжает машина впереди, до момента, когда её проезжаю я сам"],
        ["Anslår avstanden i meter med øyemål, sekunder er ikke nødvendig", "Оцениваю дистанцию в метрах на глаз — секунды тут ни при чём", "Å bedømme avstand i meter i høy fart er upresist. Tresekundersregelen bruker tid, ikke meter, nettopp fordi det er lettere å vurdere riktig.", "Оценивать дистанцию в метрах на высокой скорости неточно. Правило трёх секунд основано на времени, а не на метрах, именно потому что время оценить легче и точнее."],
        ["Teller sekunder fra du selv passerer punktet til bilen foran passerer det", "Считаю секунды с момента, когда точку проезжаю я, до момента, когда её проезжает машина впереди", "Rekkefølgen er snudd. Du skal telle fra bilen foran passerer punktet til du selv når det samme punktet, ikke omvendt.", "Порядок перепутан. Считать нужно от момента, когда точку проезжает машина впереди, до момента, когда до неё доезжаешь ты сам, а не наоборот."],
        ["Bruker regelen bare når det er kø, ellers er den unødvendig", "Использую правило только в пробке, в остальных случаях оно не нужно", "Regelen er mest nyttig nettopp i fri flyt med høyere fart, der det er lettere å ligge for tett uten å merke det. I kø er avstanden uansett kort og farten lav.", "Правило особенно полезно как раз при свободном потоке на высокой скорости, где легко незаметно подъехать слишком близко. В пробке дистанция и так короткая, а скорость низкая."]
      ],
      "Velg et merke langs veien, som et skilt eller en bro. Når bilen foran passerer merket, begynn å telle «tusen og en, tusen og to, tusen og tre». Passerer du merket før du er ferdig å telle, ligger du for tett og bør øke avstanden.",
      "Выбери ориентир у дороги — например знак или мост. Когда его проезжает машина впереди, начинай считать «тысяча один, тысяча два, тысяча три». Если ты доезжаешь до ориентира раньше, чем закончил считать, — дистанция слишком мала, нужно отступить дальше.",
      "Три секунды — это минимум на сухой дороге. На мокрой или зимой мысленно удваивай счёт."),

    /* ---------- Несколько правильных ответов ---------- */
    qm("m01", road({ crossing: true }),
      "Du nærmer deg et gangfelt. Hva skal du gjøre? Velg alle riktige.", "Ты подъезжаешь к пешеходному переходу. Что нужно делать? Выбери все верные.", [
      ["Senke farten i god tid", "Заранее снизить скорость", true],
      ["Være klar til å stoppe for gående som er på veg ut i gangfeltet", "Быть готовым остановиться перед пешеходом, выходящим на переход", true],
      ["Ikke kjøre forbi en bil som har stanset foran gangfeltet", "Не объезжать машину, остановившуюся перед переходом", true],
      ["Tute for å varsle de gående om at du kommer", "Посигналить, чтобы пешеходы знали, что ты едешь", false, "Lydsignal skal bare brukes for å avverge fare, ikke for å få gående til å vente.", "Сигнал — только чтобы предотвратить опасность, а не чтобы пешеходы подождали."]
    ],
    "Trafikkreglene § 9: ved gangfelt skal du kjøre slik at du kan stoppe, og vike for gående som er i eller på veg ut i feltet. Forbikjøring rett foran gangfelt er forbudt.",
    "Trafikkreglene § 9: у перехода едешь так, чтобы суметь остановиться, и уступаешь пешеходам на переходе или выходящим на него. Обгон прямо перед переходом запрещён.",
    "Переход = «нога на тормозе». Машина, стоящая перед зеброй, стоит не просто так."),

    qm("m02", scene({ you: { from: "south", to: "west" }, others: [{ from: "east", to: "south" }], roundabout: true }),
      "Hva er riktig om kjøring i rundkjøring? Velg alle riktige.", "Что верно про движение на круге? Выбери все верные.", [
      ["Du har vikeplikt for trafikk som allerede er i rundkjøringen", "Ты уступаешь тем, кто уже на круге", true],
      ["Du gir tegn til høyre før du kjører ut", "Перед выездом включаешь правый поворотник", true],
      ["Du kjører mot klokka", "Едешь против часовой стрелки", true],
      ["Høyreregelen gjelder når du kjører inn", "При въезде действует правило правой руки", false, "Rundkjøringer er skiltet med vikeplikt, så du viker for alle inne i sirkelen, ikke bare de fra høyre.", "Перед кругом стоит знак «уступи», поэтому уступаешь всем на круге, а не только тем, кто справа."]
    ],
    "I rundkjøring kjører du mot klokka, viker for trafikk inne i sirkelen og gir tegn til høyre når du skal ut. Tegn til venstre brukes når du skal langt rundt.",
    "На круге едешь против часовой, уступаешь всем внутри круга, перед выездом включаешь правый поворотник. Левый — если едешь далеко по кругу.",
    "Въезд: уступи всем на круге. Выезд: правый поворотник."),

    qm("m03", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west", kind: "emergency" }], lights: { south: "green", east: "red" } }),
      "Du hører sirene og ser et utrykningskjøretøy med blålys. Hva skal du gjøre? Velg alle riktige.", "Ты слышишь сирену и видишь машину с мигалкой. Что нужно делать? Выбери все верные.", [
      ["Gi fri veg", "Освободить дорогу", true],
      ["Om nødvendig stanse ved siden av vegen", "При необходимости остановиться у обочины", true],
      ["Kjøre på rødt lys for å slippe det fram", "Проехать на красный, чтобы его пропустить", false, "Du skal ikke bryte trafikkreglene for å gi fri veg. Kjør til siden eller stans der du er, uten å kjøre på rødt.", "Ради освобождения дороги правила нарушать нельзя. Отъедь в сторону или остановись, но на красный не езжай."],
      ["Øke farten for å komme unna", "Ускориться, чтобы уйти вперёд", false, "Høyere fart skaper bare mer fare. Utrykningskjøretøyet trenger at du blir forutsigbar og gir plass.", "Больше скорости — больше опасности. Спецмашине нужно, чтобы ты был предсказуем и дал место."]
    ],
    "Trafikkreglene § 10: alle skal gi fri veg for utrykningskjøretøy med blålys og sirene, og om nødvendig stanse. Det gir ikke rett til å kjøre på rødt.",
    "Trafikkreglene § 10: все обязаны освободить дорогу спецтранспорту с мигалкой и сиреной и при необходимости остановиться. Права проезжать на красный это не даёт.",
    "Прижмись вправо, остановись, не суетись. Красный остаётся красным."),

    qm("m04", scene({ you: { from: "south", to: "north" }, signs: { south: "stop" }, peds: ["north"] }),
      "Du nærmer deg et stoppskilt. Hva må du gjøre? Velg alle riktige.", "Ты подъезжаешь к знаку «Стоп». Что нужно сделать? Выбери все верные.", [
      ["Stoppe helt, ikke bare senke farten", "Полностью остановиться, а не просто притормозить", true],
      ["Se til begge sider for kryssende trafikk før du kjører videre", "Посмотреть в обе стороны на перекрёстный трафик, прежде чем ехать дальше", true],
      ["Sjekke om det er fotgjengere i gangfeltet på veien du skal kjøre ut på", "Проверить, нет ли пешеходов на переходе той дороги, куда ты выезжаешь", true],
      ["Det holder å stoppe dersom veien virker tom", "Достаточно остановиться, если дорога выглядит пустой", false, "Stoppskiltet krever full stopp uansett hvor tom veien ser ut til å være, og du skal likevel forsikre deg om at den er fri.", "Знак «Стоп» требует полной остановки в любом случае, даже если дорога кажется пустой, и всё равно нужно убедиться, что она свободна."]
    ],
    "Ved stoppskilt skal du stoppe helt opp bak stopplinjen, forsikre deg om at krysset og eventuelt gangfelt er fritt, og først da kjøre videre.",
    "У знака «Стоп» нужно полностью остановиться перед стоп-линией, убедиться, что перекрёсток и переход (если есть) свободны, и только потом ехать дальше.",
    "Стоп значит стоп: колёса должны на мгновение полностью замереть, «почти ноль» не считается."),

    qm("m05", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }], peds: ["west"] }),
      "Du skal svinge til venstre i et kryss uten lys. Velg alle riktige.", "Ты поворачиваешь налево на перекрёстке без светофора. Выбери все верные.", [
      ["Du viker for møtende bil som kjører rett fram", "Уступаешь встречной машине, едущей прямо", true],
      ["Du viker for fotgjengere og syklister som krysser vegen du svinger inn på", "Уступаешь пешеходам и велосипедистам, переходящим дорогу, на которую поворачиваешь", true],
      ["Du gir tegn til venstre i god tid før svingen", "Заранее включаешь левый поворотник", true],
      ["Du har forrang fordi du kom fram til krysset først", "У тебя преимущество, потому что ты подъехал первым", false, "Ankomsttidspunktet gir ingen forrang ved venstresving. Du viker uansett for møtende trafikk og kryssende gående/syklende.", "Момент прибытия не даёт преимущества при повороте налево. Ты в любом случае уступаешь встречным и переходящим дорогу пешеходам/велосипедистам."]
    ],
    "Venstresving er den svakeste manøveren i et kryss: du viker for møtende trafikk som kjører rett fram eller svinger til høyre, og for gående og syklende som krysser vegen du svinger inn på. Gi tegn i god tid.",
    "Поворот налево — самый «слабый» манёвр на перекрёстке: уступаешь встречному транспорту, едущему прямо или поворачивающему направо, и пешеходам с велосипедистами, переходящим дорогу, на которую поворачиваешь. Заранее включай поворотник.",
    "При повороте налево ты в долгу у всех: и у встречных, и у пешеходов на переходе."),

    qm("m06", null,
      "Du kjører på en fylkesvei om sommeren, og en flokk med sau går løs midt i kjørebanen. Velg alle riktige.", "Ты едешь летом по региональной дороге, и посреди проезжей части идёт стадо овец, пасущихся без присмотра. Выбери все верные.", [
      ["Senker farten kraftig og er forberedt på å stoppe helt", "Резко снижаю скорость и готов полностью остановиться", true],
      ["Holder god avstand og lar sauene få tid til å bevege seg unna i eget tempo", "Держу дистанцию и даю овцам самим спокойно уйти с дороги", true],
      ["Tuter kraftig for å jage dem raskt unna veien", "Сильно сигналю, чтобы быстро согнать их с дороги", false, "Kraftig tuting skremmer dyrene og gjør dem uforutsigbare, de kan løpe rett ut i veien eller mot bilen i stedet for å roe seg unna.", "Резкий гудок пугает животных и делает их непредсказуемыми — они могут броситься прямо на дорогу или на машину, вместо того чтобы спокойно уйти."],
      ["Kjører sakte gjennom flokken siden sau uansett flytter seg unna dekkene", "Медленно еду прямо через стадо, ведь овцы всё равно уходят из-под колёс", false, "Sau kan oppføre seg uforutsigbart og løpe feil vei i stedet for å flytte seg unna, det er tryggest å vente til de har gått av veien selv.", "Овцы могут вести себя непредсказуемо и побежать не в ту сторону, а не просто уйти с дороги — безопаснее подождать, пока они сами её освободят."]
    ],
    "Løsgående dyr som sau, geit eller elg kan oppføre seg helt uforutsigbart. Senk farten i god tid, hold avstand, unngå å tute unødig, og vent tålmodig til dyrene har flyttet seg unna av seg selv.",
    "Свободно пасущиеся животные — овцы, козы, лоси — могут вести себя совершенно непредсказуемо. Заранее снижай скорость, держи дистанцию, не сигналь без нужды и терпеливо жди, пока животные сами не уйдут с дороги.",
    "С животными на дороге торопиться нельзя — она их территория в этот момент, а не твоя."),

    q("064", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "east", kind: "truck" }] }),
      "Kryss uten skilt. En lastebil kommer fra venstre. Hva gjør du?",
      "Перекрёсток без знаков. Грузовик едет слева. Что делаешь?",
      [
        ["Kjører videre, lastebilen fra venstre har vikeplikt for deg", "Еду дальше — у грузовика слева обязанность уступить мне"],
        ["Stopper og vinker lastebilen fram, fordi den er stor og tung", "Останавливаюсь и машу грузовику проехать первым — он большой и тяжёлый", "Størrelsen på kjøretøyet avgjør ikke vikeplikten, det er høyreregelen som gjelder: fra venstre skal den andre vike.", "Размер машины не влияет на то, кто уступает — решает правило правой руки: тот, кто слева, должен уступить."],
        ["Vurderer at tunge kjøretøy alltid har forkjørsrett i kryss", "Решаю, что тяжёлый транспорт всегда имеет преимущество на перекрёстке", "Det finnes ingen regel om at tunge kjøretøy alltid har forkjørsrett, vikeplikten følger av skilt eller høyreregelen.", "Общего правила «тяжёлый транспорт всегда главный» нет — приоритет определяют знаки или правило правой руки."],
        ["Senker farten kraftig og lar lastebilen bestemme hvem som kjører først", "Резко сбрасываю скорость и даю грузовику самому решить, кто поедет первым", "Når du har forkjørsrett, skal du kjøre normalt videre i stedet for å skape usikkerhet for den andre føreren.", "Когда преимущество у тебя, нужно ехать как обычно, а не создавать неразбериху нерешительностью."]
      ],
      "Uten skilt gjelder høyreregelen: du skal vike for kjøretøy som kommer fra høyre, mens et kjøretøy fra venstre skal vike for deg, uansett hvor stort det er.",
      "Без знаков действует правило правой руки: ты уступаешь тем, кто едет справа, а тем, кто едет слева, уступаешь не ты — независимо от размера машины.",
      "Главное — с какой стороны едет другой, а не какой он величины."),

    q("065", scene({ you: { from: "south", to: "north" }, roundabout: true, others: [{ from: "west", to: "north" }] }),
      "Du skal ta andre avkjøring (rett fram) i rundkjøringen. Når blinker du til høyre?",
      "Тебе нужен второй съезд с круга (прямо). Когда включаешь правый поворотник?",
      [
        ["Når jeg har passert avkjøringen før min, rett før jeg skal ut", "Когда проехал съезд перед своим — прямо перед выездом"],
        ["Med en gang jeg kjører inn i rundkjøringen", "Сразу при въезде на круг", "Blinker du høyre allerede ved innkjøring, tror de som venter ved første avkjøring at du skal ut der.", "Если включить правый уже на въезде, те, кто ждёт у первого съезда, решат, что ты выезжаешь там."],
        ["Jeg trenger ikke blinke når jeg kjører rett fram", "Не нужно включать, раз еду прямо", "Du skal alltid gi tegn til høyre før du forlater rundkjøringen, også når du skal rett fram.", "Перед выездом с круга правый поворотник включают всегда, даже если едешь прямо."],
        ["Jeg blinker venstre hele veien rundt", "Всю дорогу по кругу мигаю левым", "Venstre blinklys brukes ved innkjøring bare når du skal langt rundt, og aldri når du skal ut.", "Левый включают на въезде, только если едешь далеко по кругу, и никогда — при выезде."]
      ],
      "Skal du ut i første avkjøring, blinker du høyre allerede før innkjøringen. Skal du lenger, blinker du høyre når du har passert avkjøringen før din, slik at andre ser hvor du skal ut.",
      "Если нужен первый съезд — правый поворотник включаешь ещё до въезда. Если дальше — после того, как проехал съезд перед своим, чтобы остальные видели, где ты выедешь.",
      "Первый съезд — правый сразу; дальше — правый после предыдущего съезда."),

    q("066", road({ tcross: true }),
      "Du kjører på en vei med forkjørsrett. En bil fra sideveien til høyre ser ikke ut til å bremse, og kan kjøre rett ut foran deg. Hva gjør du, selv om du formelt har forkjørsrett?",
      "Ты едешь по дороге с преимуществом. Машина с боковой дороги справа не тормозит и может выехать прямо перед тобой. Что делаешь, хотя формально преимущество у тебя?",
      [
        ["Senker farten og er klar til å bremse, selv om jeg har forkjørsrett", "Снижаю скорость и готов тормозить, хотя у меня формальное преимущество"],
        ["Fortsetter i samme fart, fordi jeg har forkjørsrett og den andre må stoppe", "Еду в том же темпе — у меня преимущество, пусть он тормозит", "Å stole blindt på forkjørsretten når den andre bilen tydelig ikke bremser, kan føre til en unngåelig ulykke. Forkjørsrett fritar deg ikke for aktsomhetsplikten.", "Слепо полагаться на формальное преимущество, когда другая машина явно не тормозит, может привести к ДТП. Преимущество не снимает обязанности быть внимательным."],
        ["Tuter kraftig og kjører forbi i høy fart for å komme unna", "Сильно сигналю и проезжаю на высокой скорости, чтобы проскочить", "Høy fart øker faren hvis den andre bilen likevel kjører ut, og gir deg mindre tid til å reagere.", "Высокая скорость увеличивает риск, если машина всё же выедет, и оставляет меньше времени на реакцию."],
        ["Svinger brått ut i motsatt kjørefelt for å unngå kollisjon", "Резко ухожу на встречную полосу, чтобы избежать столкновения", "Brå svingning over i møtende kjørefelt kan skape en ny, enda farligere kollisjon med møtende trafikk.", "Резкий уход на встречную полосу может привести к новой, ещё более опасной аварии со встречным транспортом."]
      ],
      "Forkjørsrett gir deg ikke beskyttelse mot en ulykke, du har alltid plikt til å kjøre aktsomt. Ser du at en annen fører ikke ser ut til å overholde sin vikeplikt, skal du senke farten og være klar til å bremse.",
      "Формальное преимущество не защищает от аварии — ты всегда обязан быть внимательным. Если видишь, что другой водитель не собирается уступать, снижай скорость и будь готов затормозить.",
      "Право проезда — не щит. Лучше затормозить, чем доказывать, кто был прав."),

    q("067", road({ overtake: true }),
      "Bilen foran deg (B) har lagt seg ut til venstre med blinklys for å kjøre forbi en syklist. Du kjører rett bak B. Hva gjør du?",
      "Машина впереди (B) сместилась влево с поворотником, чтобы обогнать велосипедиста. Ты едешь прямо за B. Что делаешь?",
      [
        ["Holder avstand og venter til B er ferdig med forbikjøringen før jeg vurderer min egen", "Держу дистанцию и жду, пока B закончит обгон, прежде чем думать о своём"],
        ["Kjører forbi både B og syklisten samtidig i én bevegelse", "Обгоняю сразу и B, и велосипедиста одним манёвром", "Å kjøre forbi to kjøretøy samtidig gir deg mye dårligere oversikt og margin, og er svært farlig hvis noe uventet skjer.", "Обгон сразу двух участников одним манёвром резко снижает обзор и запас безопасности — это очень опасно при любой неожиданности."],
        ["Ligger tett bak B for å få bedre fart til egen forbikjøring etterpå", "Прижимаюсь к B вплотную, чтобы разогнаться для своего обгона", "Kort avstand bak en bil som kjører forbi gir deg mindre tid til å reagere hvis B må bremse eller avbryte forbikjøringen.", "Короткая дистанция за обгоняющей машиной оставляет меньше времени на реакцию, если B придётся тормозить или прервать обгон."],
        ["Tuter for å få B til å skynde seg forbi syklisten", "Сигналю, чтобы B поторопился с обгоном велосипедиста", "Tuting for å presse en annen fører til å skynde seg under forbikjøring øker faren og kan gi en hastig, dårlig vurdert manøver.", "Сигналить, чтобы поторопить другого водителя во время обгона, опасно — это может привести к поспешному и необдуманному манёвру."]
      ],
      "Når bilen foran deg kjører forbi noen, holder du avstand og venter til manøveren er ferdig før du planlegger din egen forbikjøring.",
      "Когда машина впереди кого-то обгоняет, держи дистанцию и жди, пока манёвр завершится, прежде чем планировать свой собственный обгон.",
      "Два обгона разом — это не экономия времени, а риск."),

    q("068", road({ bus: true, limit: 50 }),
      "En skolebuss har stoppet med blinkende varsellys ved en holdeplass uten fortau. Du nærmer deg bakfra. Hva bør du spesielt tenke på?",
      "Школьный автобус остановился с мигающими аварийками на остановке без тротуара. Ты подъезжаешь сзади. На что обратить особое внимание?",
      [
        ["Senker farten kraftig, siden barn kan løpe ut fra foran eller bak bussen uten å se seg for", "Сильно снижаю скорость — дети могут выбежать из-за автобуса, не посмотрев по сторонам"],
        ["Kjører forbi i vanlig fart, siden bussen uansett har stoppet helt", "Еду в обычном темпе — автобус же полностью остановился", "At bussen har stoppet, sier ingenting om hvor barna beveger seg, faren for at et barn løper ut i veien er like stor.", "Остановка автобуса никак не говорит о том, куда побегут дети — риск, что ребёнок выскочит на дорогу, остаётся высоким."],
        ["Tuter for å varsle barna om at jeg kommer", "Сигналю, чтобы предупредить детей о своём приближении", "Tuting skremmer og forvirrer barn mer enn det hjelper, lav fart og god oppmerksomhet er tryggere.", "Сигнал скорее пугает и путает детей, чем помогает — надёжнее низкая скорость и внимательность."],
        ["Kjører forbi på den siden der det er mest plass, uten å senke farten", "Проезжаю с той стороны, где больше места, не снижая скорость", "Å prioritere god plass fremfor lav fart hjelper ikke hvis et barn plutselig løper ut, farten er det viktigste du kan justere.", "Думать о запасе места важнее скорости не поможет, если ребёнок внезапно выбежит — главное именно снизить скорость."]
      ],
      "Barn er uforutsigbare og kan løpe ut i veien uten å se seg for, spesielt rundt en skolebuss. Senk farten kraftig og vær klar til å stoppe til bussen har kjørt videre og barna er i sikkerhet.",
      "Дети непредсказуемы и могут выбежать на дорогу, не посмотрев по сторонам, особенно у школьного автобуса. Сильно снижай скорость и будь готов остановиться, пока автобус не уедет, а дети не окажутся в безопасности.",
      "Школьный автобус с мигалками — сигнал «рядом дети», а не просто препятствие на дороге."),

    q("069", scene({ you: { from: "south", to: "north" }, lights: { south: "yellow" } }),
      "Lyset skifter fra grønt til gult akkurat idet du nærmer deg stopplinjen, og du kan fortsatt stoppe trygt og rolig. Hva gjør du?",
      "Свет меняется с зелёного на жёлтый прямо когда ты подъезжаешь к стоп-линии, и ты ещё можешь спокойно и безопасно остановиться. Что делаешь?",
      [
        ["Stopper rolig ved stopplinjen", "Спокойно останавливаюсь у стоп-линии"],
        ["Gir gass og kjører raskt gjennom krysset før det blir rødt", "Жму на газ и быстро проезжаю перекрёсток, пока не стало красным", "Når du fortsatt kan stoppe trygt, skal du stoppe. Å gi gass for å rekke gult øker faren og er ofte det som fører til kjøring på rødt.", "Если ты ещё можешь спокойно остановиться, нужно остановиться. Газ в пол ради жёлтого увеличивает риск и часто превращается в проезд на красный."],
        ["Fortsetter i samme fart, siden gult bare er en advarsel uten betydning for hva jeg skal gjøre", "Еду в том же темпе — жёлтый просто предупреждение, ни на что не влияющее", "Gult betyr at du skal stoppe hvis det er mulig på en trygg måte, det er ikke bare en advarsel uten betydning.", "Жёлтый значит «остановись, если можешь сделать это безопасно» — это не просто предупреждение без последствий."],
        ["Bremser brått midt i krysset for å være føre var", "Резко торможу прямо на перекрёстке на всякий случай", "Brå bremsing midt i krysset er farligere enn å fullføre kjøringen gjennom, vurderingen skal gjøres før krysset, ikke inni det.", "Резкое торможение прямо на перекрёстке опаснее, чем доехать до конца, — решение нужно принимать до перекрёстка, а не на нём."]
      ],
      "Gult lys betyr at du skal stoppe dersom du kan gjøre det på en trygg og kontrollert måte. Kan du ikke stoppe trygt, fullfører du kjøringen gjennom i stedet for å bråbremse.",
      "Жёлтый свет значит: остановись, если можешь сделать это безопасно и спокойно. Если безопасно остановиться уже нельзя — доезжай до конца, а не тормози резко.",
      "Если успеваешь безопасно затормозить — тормози. Жёлтый — не разрешение проехать, а последний шанс остановиться."),

    q("070", null,
      "Du har fått et reseptbelagt legemiddel som har en rød varseltrekant på pakningen, og kjenner deg trøtt etter å ha tatt det. Kan du kjøre bil?",
      "Тебе выписали рецептурное лекарство, на упаковке — красный предупреждающий треугольник, и после приёма тебя клонит в сон. Можно ли садиться за руль?",
      [
        ["Nei, kjøreevnen kan være nedsatt selv om legemidlet er lovlig og foreskrevet av lege", "Нет — способность управлять машиной может быть снижена, даже если лекарство законное и выписано врачом"],
        ["Ja, siden legemidlet er foreskrevet av lege og dermed alltid lovlig å kjøre med", "Да, лекарство выписано врачом, значит с ним всегда можно за руль", "At et legemiddel er foreskrevet og lovlig å bruke, betyr ikke at det er trygt å kjøre når det faktisk påvirker kjøreevnen din.", "То, что лекарство выписано и его приём законен, не означает, что безопасно садиться за руль, если оно реально влияет на твои способности."],
        ["Ja, varseltrekanten gjelder bare for maskiner på jobb, ikke for bilkjøring", "Да, треугольник касается только работы с техникой, не вождения", "Varseltrekanten på legemidler advarer nettopp mot bilkjøring og annen aktivitet som krever årvåkenhet.", "Предупреждающий треугольник на лекарствах как раз предупреждает об опасности вождения и другой деятельности, требующей внимания."],
        ["Ja, så lenge du ikke har drukket alkohol i tillegg", "Да, если вдобавок не пил алкоголь", "Fravær av alkohol endrer ikke på at legemidlet alene kan nedsette kjøreevnen din, det er selve påvirkningen som avgjør.", "Отсутствие алкоголя не меняет того, что само лекарство может снижать способность управлять машиной — важно само состояние, а не алкоголь."]
      ],
      "Det er forbudt å kjøre når kjøreevnen er nedsatt, uansett årsak, legemidler inkludert. Rød varseltrekant på pakningen advarer om at legemidlet kan påvirke kjøreevnen, og du må selv vurdere om du er i stand til å kjøre trygt.",
      "Садиться за руль с ослабленной способностью управлять машиной запрещено независимо от причины, включая лекарства. Красный треугольник на упаковке — прямое предупреждение, что лекарство может повлиять на вождение, и тебе нужно самому оценить, можешь ли ты безопасно ехать.",
      "Треугольник на упаковке — не формальность, а прямой сигнал: сегодня за руль не стоит."),

    qm("m07", scene({ you: { from: "south", to: "north" }, roundabout: true, others: [{ from: "west", to: "south" }] }),
      "Du skal inn i en rundkjøring. Velg alle riktige.", "Ты въезжаешь в круговое движение. Выбери все верные.", [
      ["Du viker for trafikk som allerede er inne i rundkjøringen", "Уступаешь тем, кто уже едет по кругу", true],
      ["Syklister i rundkjøringen kan sykle enten i kjørefeltet eller på eget sykkelfelt rundt, avhengig av hvordan rundkjøringen er bygd", "Велосипедисты в круге могут ехать либо в полосе движения, либо по отдельной велополосе вокруг — зависит от устройства круга", true],
      ["Du trenger normalt ikke å blinke venstre ved innkjøring hvis du skal rett fram", "Обычно не нужно включать левый поворотник при въезде, если едешь прямо", true],
      ["Du har alltid forkjørsrett over biler som allerede sirkulerer i rundkjøringen", "У тебя всегда преимущество перед машинами, уже едущими по кругу", false, "Det er tvert imot: trafikken inne i rundkjøringen har forkjørsrett, de som skal inn har vikeplikt.", "На самом деле наоборот: преимущество у тех, кто уже в круге, а въезжающие обязаны уступить."]
    ],
    "I en rundkjøring har trafikken som allerede sirkulerer forkjørsrett, de som skal inn har vikeplikt. Ved innkjøring trenger du normalt ikke blinke dersom du skal rett fram, mens syklister avhengig av utforming kan sykle i selve rundkjøringen eller på eget sykkelfelt rundt den.",
    "В круге преимущество у тех, кто уже едет по кольцу, въезжающие уступают. При въезде обычно не сигналят поворотником, если едешь прямо, а велосипедисты в зависимости от устройства круга могут ехать прямо по кругу или по отдельной велополосе вокруг него.",
    "Главное правило круга: кто внутри — тот главный."),

    q("071", scene({ you: { from: "south", to: "north" }, signs: { south: "stop" } }),
      "Du kommer til et kryss med stoppskilt. Vegen til høyre og venstre ser helt tom ut så langt du kan se. Hva gjør du?",
      "Подъезжаешь к перекрёстку со знаком «Stopp». Дорога слева и справа выглядит совсем пустой, насколько видно. Что делаешь?",
      [
        ["Stopper helt ved stopplinjen, selv om vegen ser tom ut, og kjører videre når det er klart", "Полностью останавливаюсь у стоп-линии, даже если дорога выглядит пустой, и еду дальше, когда убедился, что чисто"],
        ["Senker bare farten og kjører videre siden jeg ikke ser noen biler", "Просто снижаю скорость и еду дальше, раз машин не видно", "Stoppskilt krever full stopp ved stopplinjen uansett om vegen virker klar, det er ikke nok å senke farten.", "Знак «Stopp» требует полной остановки у стоп-линии независимо от того, кажется ли дорога свободной — просто притормозить недостаточно."],
        ["Stopper midt i krysset for å se bedre til begge sider", "Останавливаюсь посреди перекрёстка, чтобы лучше осмотреться по сторонам", "Du skal stoppe ved stopplinjen før krysset, ikke inni krysset der du er i vegen for annen trafikk.", "Останавливаться нужно у стоп-линии перед перекрёстком, а не внутри него, где ты мешаешь другому движению."],
        ["Stopper bare hvis det er andre kjøretøy synlig i krysset", "Останавливаюсь только если в перекрёстке видны другие машины", "Plikten til å stoppe ved stoppskilt gjelder alltid, den er ikke avhengig av om du ser andre kjøretøy der og da.", "Обязанность остановиться у знака «Stopp» действует всегда, она не зависит от того, видишь ли ты в этот момент другие машины."]
      ],
      "Stoppskilt (skilt 204) krever at du stopper helt ved stopplinjen hver gang, uavhengig av om vegen ser tom ut. Du kjører videre først når du har forsikret deg om at det er trygt.",
      "Знак «Stopp» (знак 204) требует полной остановки у стоп-линии каждый раз, независимо от того, насколько пустой выглядит дорога. Ехать дальше можно только убедившись, что это безопасно.",
      "«Stopp» значит именно стоп, а не «притормози, если что»."),

    q("072", null,
      "Du kjører forbi noen ryttere på hest langs vegkanten. Hestene ser urolige ut. Hva bør du gjøre?",
      "Ты обгоняешь всадников на лошадях у края дороги. Лошади выглядят беспокойными. Что тебе следует сделать?",
      [
        ["Senker farten kraftig, holder god avstand og kjører forbi i rolig tempo", "Сильно снижаю скорость, держу хорошую дистанцию и обгоняю в спокойном темпе"],
        ["Tuter kort for å varsle rytterne om at jeg kommer", "Коротко сигналю, чтобы предупредить всадников о своём приближении", "Lydsignal kan skremme hesten enda mer og gjøre situasjonen farligere, ikke tryggere.", "Звуковой сигнал может ещё сильнее испугать лошадь и сделать ситуацию опаснее, а не безопаснее."],
        ["Kjører forbi i vanlig fart siden hest og rytter har samme plikter som andre trafikanter", "Обгоняю на обычной скорости — у всадника те же обязанности, что у других участников движения", "Selv om rytteren følger vanlige regler, er hester levende dyr som kan reagere uforutsigbart, derfor må du ta ekstra hensyn.", "Хотя всадник следует общим правилам, лошадь — живое животное, которое может реагировать непредсказуемо, поэтому нужна дополнительная осторожность."],
        ["Stopper helt og venter til rytterne har forlatt vegen", "Полностью останавливаюсь и жду, пока всадники не покинут дорогу", "En full stopp er ikke nødvendig og kan virke uventet for hesten, lav fart med god avstand er vanligvis nok.", "Полная остановка не нужна и может быть неожиданной для лошади — обычно достаточно низкой скорости и хорошей дистанции."]
      ],
      "Hester kan bli skremt av biler, lyd og fart. Vis ekstra hensyn ved å senke farten tydelig og holde god avstand når du kjører forbi ryttere.",
      "Лошади могут испугаться машин, звука и скорости. Проявляй особую осторожность: заметно снижай скорость и держи хорошую дистанцию, обгоняя всадников.",
      "Лошадь — не машина с правилами, а живое существо: главное — медленно и без резких сигналов."),

    q("073", null,
      "Du skal kjøre over et fjellovergang om vinteren der det er skiltet kjettingpåbud for tunge kjøretøy. Du kjører personbil med gode vinterdekk uten kjetting. Gjelder påbudet for deg?",
      "Ты едешь через горный перевал зимой, где установлен знак об обязательных цепях противоскольжения для тяжёлых машин. Ты на легковой машине с хорошими зимними шинами без цепей. Касается ли тебя этот запрет?",
      [
        ["Nei, kjettingpåbudet gjelder som regel bare tunge kjøretøy, men jeg bør likevel kjøre etter forholdene", "Нет, требование цепей обычно касается только тяжёлых машин, но мне всё равно нужно ехать по обстановке"],
        ["Ja, kjettingpåbud gjelder alle kjøretøy uten unntak når det er skiltet", "Да, требование цепей касается всех машин без исключений, если есть знак", "Skiltet kjettingpåbud retter seg normalt mot tunge kjøretøy, personbiler er vanligvis ikke omfattet selv om skiltet står der.", "Знак об обязательных цепях обычно адресован тяжёлым машинам, легковые обычно не подпадают под него, даже если знак стоит."],
        ["Nei, og da kan jeg kjøre i vanlig fart som på sommeren", "Нет, и значит я могу ехать в обычном летнем темпе", "At påbudet ikke gjelder deg, betyr ikke at vegen er trygg å kjøre i sommerfart, du må uansett tilpasse farten til vinterforholdene.", "То, что запрет не касается тебя, не значит, что по дороге можно ехать в летнем темпе — скорость всё равно нужно подстраивать под зимние условия."],
        ["Ja, men bare hvis jeg kjører med tilhenger", "Да, но только если я еду с прицепом", "Kjettingpåbudet avhenger av kjøretøyets vekt og type, ikke av om du trekker tilhenger eller ikke.", "Требование цепей зависит от веса и типа машины, а не от того, едешь ли ты с прицепом."]
      ],
      "Kjettingpåbud på fjelloverganger gjelder normalt tunge kjøretøy som lastebil og buss, ikke vanlige personbiler. Du må likevel alltid kjøre etter kjøreforholdene, uansett skilt.",
      "Требование цепей противоскольжения на горных перевалах обычно касается тяжёлых машин — грузовиков и автобусов, а не обычных легковых. Но скорость всё равно нужно подстраивать под дорожные условия, независимо от знака.",
      "Знак с цепями — это почти всегда про грузовики и автобусы, а не про твою легковушку."),

    q("074", road({ bikeLane: true }),
      "Du skal svinge til høyre over et sykkelfelt. En elsparkesykkel kommer bakfra i sykkelfeltet og skal rett fram. Hvem har vikeplikt?",
      "Тебе нужно повернуть направо через велополосу. Сзади по велополосе едет электросамокат, ему прямо. Кто уступает?",
      [
        ["Jeg har vikeplikt for elsparkesykkelen, siden den kjører rett fram i sykkelfeltet", "Уступаю я — электросамокат едет прямо по велополосе"],
        ["Elsparkesykkelen har vikeplikt for meg siden den er mindre enn en bil", "Уступает электросамокат — он меньше машины", "Størrelsen på kjøretøyet avgjør ikke vikeplikten, det avgjørende er at føreren som svinger skal vike for den som kjører rett fram.", "Размер транспортного средства не определяет, кто уступает — важно то, что поворачивающий уступает едущему прямо."],
        ["Ingen har vikeplikt, vi må bare avpasse farten etter hverandre", "Никто не уступает, просто подстраиваем скорость друг под друга", "Her gjelder en klar vikepliktregel, det er ikke en situasjon der dere bare skal avpasse farten uten en avklart vikeplikt.", "Здесь действует чёткое правило уступки, это не ситуация, где просто подстраивают скорость без определённого приоритета."],
        ["Elsparkesykkelen må stoppe helt siden den kjører i sykkelfeltet", "Электросамокат обязан полностью остановиться, потому что едет по велополосе", "Den som kjører rett fram i sykkelfeltet trenger ikke stoppe, det er bilen som svinger som skal vike og eventuelt stoppe.", "Тому, кто едет прямо по велополосе, останавливаться не нужно — уступить и при необходимости остановиться должна поворачивающая машина."]
      ],
      "Når du svinger over et sykkelfelt, har du vikeplikt for syklister og førere av liten elektrisk motorvogn som skal rett fram, også dem som kommer bakfra (trafikkreglene § 7 nr 3).",
      "Когда поворачиваешь через велополосу, ты уступаешь велосипедистам и электросамокатам, которые едут прямо, в том числе догоняющим сзади (trafikkreglene § 7 nr 3).",
      "Поворачиваешь через велополосу — уступаешь всем, кто едет по ней прямо, будь то велосипед или самокат."),

    q("075", null,
      "Du kjører rett mot en lav sol som gjør det nesten umulig å se vegen tydelig. Hva bør du gjøre?",
      "Ты едешь прямо навстречу низкому солнцу, которое почти не даёт разглядеть дорогу. Что тебе следует сделать?",
      [
        ["Senker farten, bruker solskjerm/solbriller og er forberedt på å stoppe om nødvendig", "Снижаю скорость, использую солнцезащитный козырёк или очки и готов остановиться, если понадобится"],
        ["Kjører som vanlig siden lav sol ikke regnes som et trafikkfarlig forhold", "Еду как обычно — низкое солнце не считается опасным дорожным фактором", "Lav sol kan blende like mye som mørke eller tåke og må tas like seriøst, det er ikke et ufarlig forhold.", "Низкое солнце может слепить не меньше, чем темнота или туман, и к нему нужно относиться так же серьёзно — это не безобидный фактор."],
        ["Blinker med fjernlys for å varsle møtende om at jeg nesten ikke ser", "Мигаю дальним светом, чтобы предупредить встречных, что почти не вижу дорогу", "Fjernlys mot møtende i dagslys gir ikke bedre sikt for deg og kan virke forvirrende eller unødig for andre.", "Дальний свет встречным днём не улучшает твою видимость и может только сбить с толку или быть неуместным для других."],
        ["Lukker øynene et kort øyeblikk for å unngå å bli blendet", "На короткое время закрываю глаза, чтобы не слепило", "Å kjøre med lukkede øyne, selv et kort øyeblikk, gjør at du ikke ser vegen i det hele tatt og er svært farlig.", "Вождение с закрытыми глазами, даже на мгновение, означает, что ты вообще не видишь дорогу — это очень опасно."]
      ],
      "Lav sol kan blende like mye som mørke. Senk farten, bruk solskjerm eller solbriller, og vær forberedt på å stoppe dersom du ikke ser vegen tydelig.",
      "Низкое солнце может слепить не хуже темноты. Снижай скорость, используй козырёк или очки и будь готов остановиться, если дорогу не видно чётко.",
      "Если солнце слепит так, что дороги не видно, — это сигнал притормозить, а не зажмуриться."),

    q("076", null,
      "Du kjører med tilhenger på motorveg i høy fart, og tilhengeren begynner å slingre fra side til side. Hva gjør du?",
      "Ты едешь с прицепом по автомагистрали на высокой скорости, и прицеп начинает раскачиваться из стороны в сторону. Что делаешь?",
      [
        ["Slipper gassen rolig og lar farten synke gradvis, uten å bremse brått eller styre mye", "Плавно отпускаю газ и даю скорости снизиться постепенно, не тормозя резко и не крутя руль"],
        ["Bremser hardt med en gang for å få kontroll før det blir verre", "Сразу резко торможу, чтобы взять ситуацию под контроль, пока не стало хуже", "Hard bremsing ved slingring kan forsterke svingningene og gjøre at du mister kontrollen helt.", "Резкое торможение при раскачивании может усилить колебания и привести к полной потере контроля."],
        ["Øker farten litt for å stramme opp koblingen mellom bil og henger", "Слегка увеличиваю скорость, чтобы «подтянуть» сцепку между машиной и прицепом", "Høyere fart forsterker slingringen i stedet for å dempe den, det er stikk i strid med hva som hjelper her.", "Увеличение скорости усиливает раскачивание, а не гасит его, — это прямо противоположно тому, что нужно делать."],
        ["Styrer kraftig mot siden hengeren svinger for å rette den opp", "Резко выворачиваю руль в сторону, куда качнулся прицеп, чтобы его выровнять", "Kraftig motstyring forsterker ofte slingringen videre, det beste er å styre minimalt og la farten synke.", "Резкое противоруление часто только усиливает раскачивание дальше, лучше минимально работать рулём и дать скорости упасть."]
      ],
      "Ved slingring skal du slippe gassen rolig og la farten synke gradvis, uten å bremse hardt eller styre mye. Brå inngrep forsterker som regel slingringen.",
      "При раскачивании прицепа нужно плавно отпустить газ и дать скорости снижаться постепенно, не тормозя резко и не делая резких движений рулём. Резкие действия обычно только усиливают раскачивание.",
      "Прицеп закачало — газ отпускаем плавно, руки спокойные, резких движений нет."),

    q("077", road({ crossing: true }),
      "En skolepatrulje står ved et gangfelt og hjelper barn over vegen. Barna er på vei ut i gangfeltet. Hva gjør du?",
      "У перехода стоит школьный патруль и помогает детям перейти дорогу. Дети выходят на переход. Что делаешь?",
      [
        ["Stopper og lar barna gå over, og kjører først når gangfeltet er fritt", "Останавливаюсь, пропускаю детей и еду, только когда переход свободен"],
        ["Kjører videre, skolepatruljen er ikke politi", "Еду дальше — школьный патруль не полиция", "Du har vikeplikt for gående som er på vei ut i gangfeltet (§ 9 nr 2), og ved skolepatrulje skal du holde særlig liten fart og stanse om nødvendig (§ 13 nr 2 b).", "Ты уступаешь пешеходам, которые выходят на переход (§ 9 nr 2), а у школьного патруля обязан ехать особенно медленно и при необходимости остановиться (§ 13 nr 2 b)."],
        ["Senker bare farten og kjører forsiktig forbi barna", "Только сбавляю скорость и осторожно проезжаю мимо детей", "Barna er på vei ut i gangfeltet. Da skal du stanse og la dem gå over, ikke kjøre forbi.", "Дети выходят на переход — нужно остановиться и пропустить их, а не проезжать мимо."],
        ["Blinker med lysene så patruljen skynder seg", "Мигаю фарами, чтобы патруль поторопился", "Lyssignal brukt for å presse andre er unødig bruk og forbudt (§ 14 nr 1).", "Световой сигнал, чтобы поторопить других, — ненужное использование, оно запрещено (§ 14 nr 1)."]
      ],
      "Trafikkreglene § 13 nr 2 b: ved passering av skolepatrulje skal du holde særlig liten fart og om nødvendig stanse. § 9 nr 2: du har vikeplikt for gående som er i eller på vei ut i gangfeltet. Skolepatruljen dirigerer barna, ikke bilene.",
      "Trafikkreglene § 13 nr 2 b: проезжая мимо школьного патруля, едешь особенно медленно и при необходимости останавливаешься. § 9 nr 2: ты уступаешь пешеходам на переходе и тем, кто на него выходит. Патруль управляет детьми, а не машинами.",
      "Патруль — не регулировщик, но дети на переходе — значит, ты стоишь."),

    qm("m08", null, "Du kjenner at du blir svært trøtt mens du kjører på motorveg. Velg alle riktige.", "Ты чувствуешь, что сильно устаёшь за рулём на автомагистрали. Выбери все верные.", [
      ["Stopper på en rasteplass eller bensinstasjon for å hvile", "Останавливаюсь на площадке отдыха или заправке, чтобы отдохнуть", true],
      ["Lufter ut bilen og tar en kort pause med en kopp kaffe hvis det hjelper", "Проветриваю машину и делаю короткую паузу, возможно с чашкой кофе, если это помогает", true],
      ["Tar en kort powerlur (10–20 minutter) hvis jeg kan stoppe trygt", "Делаю короткий сон (10–20 минут), если могу безопасно остановиться", true],
      ["Skrur opp musikken og åpner vinduet, det er like bra som å stoppe", "Включаю музыку громче и открываю окно — это не хуже, чем остановиться", false, "Musikk og åpent vindu kan virke oppkvikkende et kort øyeblikk, men det hindrer ikke mikrosøvn, bare en pause eller søvn hjelper reelt.", "Музыка и открытое окно могут ненадолго взбодрить, но не предотвращают микросон — реально помогает только остановка и отдых или сон."]
    ],
    "Ved sterk trøtthet hjelper bare en reell pause: stopp og hvil, eventuelt en kort powerlur. Kaffe og lufting kan være et tillegg, men musikk og vind alene stopper ikke mikrosøvn.",
    "При сильной усталости реально помогает только настоящая остановка и отдых, возможно короткий сон. Кофе и свежий воздух могут быть дополнением, но музыка и ветер сами по себе микросон не остановят.",
    "Если клонит в сон за рулём, единственное надёжное лекарство — остановиться, а не громче музыка."),

    q("078", road({ narrow: true }),
      "Vinteren har lagt høye brøytekanter langs begge sider av en smal vei, og det er en møteplass (utvidelse) på din side. En møtende bil (B) har allerede begynt å kjøre inn på den smale, innsnevrede delen av veien forover. Hva gjør du?",
      "Зимой вдоль узкой дороги намело высокие снежные брустверы, и на твоей стороне есть разъезд (møteplass). Встречная машина (B) уже начала въезжать на суженный из-за снега участок впереди. Что делаешь?",
      [
        ["Kjører inn på møteplassen på min side og venter til B har passert den smale delen", "Заезжаю в разъезд на своей стороне и жду, пока B проедет суженный участок"],
        ["Fortsetter rett fram i vanlig fart, siden jeg kom til møteplassen først", "Продолжаю ехать в обычном темпе — я подъехал к разъезду первым", "Det avgjør ikke hvem som kom først. Møteplassen er på din side, og B er allerede inne på den smale strekningen, så det er du som skal bruke møteplassen og vente.", "Кто первый приехал — не важно. Разъезд на твоей стороне, а B уже въехал на узкий участок, поэтому именно тебе нужно заехать в разъезд и подождать."],
        ["Blinker med lysene for å signalisere at B skal rygge tilbake", "Мигаю фарами, чтобы заставить B сдать назад", "Lyssignal for å presse en annen fører til å rygge er unødig bruk av lys og løser ikke situasjonen, det er du som har møteplassen og bør vike.", "Мигать фарами, чтобы заставить другого водителя сдать назад, — ненужное использование света и не решает ситуацию: разъезд на твоей стороне, значит уступать тебе."],
        ["Kjører forbi B i det innsnevrede partiet, vi klemmer oss forbi hverandre", "Проезжаю мимо B прямо в сужении — как-нибудь протиснемся", "Brøytekantene gjør veien smalere enn vanlig, å tvinge begge bilene gjennom samtidig der øker risikoen for kollisjon eller fastkjøring i snøen.", "Снежные брустверы делают дорогу уже обычного, пытаться протиснуть обе машины там одновременно увеличивает риск столкновения или застревания в снегу."]
      ],
      "Om vinteren gjør brøytekantene smale veger enda smalere. Kjørende som møtes, skal i god tid vike til høyre og om nødvendig stanse. Den som har møteplassen på sin side, bruker den og venter, uansett hvem som kom først.",
      "Зимой снежные брустверы делают узкие дороги ещё уже. Встречные водители должны заранее принять вправо и при необходимости остановиться. Тот, у кого разъезд на его стороне, заезжает в него и ждёт — неважно, кто подъехал первым.",
      "Разъезд на твоей стороне — значит, ждёшь ты. Снег это правило не меняет, только делает дорогу уже."),

    q("079", road({ exit: "parking" }),
      "Du kjører ut fra en parkeringsplass ved et kjøpesenter og skal ut på hovedveien. Bil B kommer fra venstre i nærmeste kjørefelt, og bil C kommer fra høyre i det andre kjørefeltet. Hvem har vikeplikt?",
      "Ты выезжаешь с парковки у торгового центра на главную дорогу. Машина B едет слева по ближней полосе, а машина C — справа по дальней. Кто уступает?",
      [
        ["Jeg har vikeplikt for både B og C, uansett hvilken retning de kommer fra", "Уступаю я — и B, и C, независимо от того, с какой стороны они едут"],
        ["Bare for B, siden C er lengst unna og i det andre kjørefeltet", "Только B, потому что C дальше и едет по другой полосе", "Utkjøring fra en parkeringsplass gir vikeplikt for all trafikk på vegen du kjører ut på, uavhengig av avstand eller kjørefelt.", "Выезд с парковки означает уступить всему транспорту на дороге, куда ты выезжаешь, независимо от дистанции или полосы."],
        ["Ingen, siden høyreregelen avgjør og C kommer fra høyre", "Никому — тут решает правило правой руки, а C едет справа", "Høyreregelen gjelder ikke ved utkjøring fra parkeringsplass, der har du alltid vikeplikt for trafikken på vegen, uansett side.", "При выезде с парковки правило правой руки не действует — там ты всегда уступаешь транспорту на дороге, с какой бы стороны он ни ехал."],
        ["Bare hvis B eller C blinker med lysene", "Только если B или C мигнут фарами", "Vikeplikten din ved utkjøring fra parkeringsplass gjelder uansett om de andre bilene gir et lyssignal eller ikke.", "Твоя обязанность уступить при выезде с парковки действует независимо от того, подают ли другие машины световой сигнал."]
      ],
      "Utkjøring fra en parkeringsplass, gårdsveg, bensinstasjon eller lignende sted gir alltid vikeplikt for trafikken på vegen du kjører ut på, uansett hvilken retning den kommer fra.",
      "Выезд с парковки, двора, заправки и подобных мест всегда означает уступить движению на дороге, куда ты выезжаешь, независимо от того, с какой стороны оно едет.",
      "Выезжаешь «не с дороги» на дорогу — уступаешь всем, кто уже на ней, слева и справа."),

    q("080", scene({ you: { from: "south", to: "north" }, roundabout: true, lanes: 2 }),
      "Du kjører inn i en rundkjøring med to felt og skal ta andre avkjøring, rett fram. Hvilket felt bør du som regel velge inn i rundkjøringen?",
      "Ты въезжаешь в круговое движение с двумя полосами и должен взять второй съезд, то есть проехать прямо. Какую полосу обычно нужно выбрать при въезде?",
      [
        ["Det høyre feltet, siden jeg skal ut relativt tidlig og ikke langt rundt", "Правую полосу, потому что съезжаю относительно рано и не еду далеко по кругу"],
        ["Det venstre feltet, fordi jeg skal rett fram og ikke til høyre", "Левую полосу, потому что я еду прямо, а не направо", "Venstre felt brukes når du skal langt rundt eller til venstre, ikke når du bare skal rett fram ved andre avkjøring.", "Левая полоса нужна, когда едешь далеко вокруг или налево, а не когда просто проезжаешь прямо на втором съезде."],
        ["Det er likegyldig hvilket felt jeg velger, så lenge jeg blinker riktig", "Не важно, какую полосу выбрать, главное — правильно включить поворотник", "Feltvalget har betydning for hvordan du beveger deg trygt gjennom rundkjøringen og ut, det er ikke likegyldig selv med riktig blinklys.", "Выбор полосы важен для безопасного движения по кругу и выезда — это не всё равно, даже если поворотник включён правильно."],
        ["Det felt som har minst trafikk i øyeblikket, uavhengig av hvilken avkjøring jeg skal ta", "Полосу, где в данный момент меньше машин, независимо от того, какой съезд мне нужен", "Hvilket felt du skal velge, avgjøres av hvor langt du skal rundt, ikke av hvor mye trafikk det er i feltet akkurat da.", "Нужную полосу определяет то, насколько далеко ты едешь по кругу, а не то, где в данный момент меньше машин."]
      ],
      "I en rundkjøring med to felt bruker du som regel høyre felt når du skal ta en av de første avkjøringene (rett fram eller tidligere), og venstre felt når du skal langt rundt eller til venstre. Følg likevel oppmerking og skilt der de finnes.",
      "В круговом движении с двумя полосами обычно используют правую полосу для одного из первых съездов (прямо или раньше), а левую — когда едешь далеко по кругу или налево. Но всегда следуй разметке и знакам, если они есть.",
      "Едешь недалеко по кругу — держись правой полосы; едешь далеко или налево — левой."),

    q("081", road({ tunnel: true }),
      "Du kjører i en lang tunnel, og bilen din tar plutselig fyr. Hva er riktig fremgangsmåte?",
      "Ты едешь по длинному тоннелю, и в машине внезапно начинается пожар. Как правильно действовать?",
      [
        ["Kjører bilen ut av tunnelen hvis det fortsatt er mulig, ellers kjører jeg helt til siden, slår av motoren, går ut og beveger meg til nærmeste nødutgang mens jeg varsler nødetatene", "Если ещё возможно, выезжаю на машине из тоннеля; если нет — съезжаю максимально к краю, выключаю двигатель, выхожу и иду к ближайшему эвакуационному выходу, вызывая спасателей"],
        ["Blir sittende i bilen med dørene låst til brannvesenet kommer", "Остаюсь в машине с заблокированными дверями, пока не приедут пожарные", "Å bli sittende i en brennende bil i en tunnel er livsfarlig, du skal komme deg ut og bort fra bilen så raskt som trygt mulig.", "Оставаться в горящей машине в тоннеле опасно для жизни — нужно как можно быстрее безопасно выйти и отойти от машины."],
        ["Snur bilen og kjører tilbake mot møtende kjøreretning for å komme ut raskere", "Разворачиваюсь и еду назад против движения, чтобы быстрее выехать", "Å snu og kjøre mot kjøreretningen i en tunnel skaper stor fare for kollisjon med andre bilister og er ikke tillatt.", "Разворачиваться и ехать против движения в тоннеле создаёт большую опасность столкновения с другими машинами и запрещено."],
        ["Prøver først å slukke brannen selv før jeg varsler noen", "Сначала пытаюсь сам потушить пожар, прежде чем кого-то вызывать", "Du skal varsle nødetatene og komme deg i sikkerhet først, å bruke tid på selv å slukke en bilbrann kan koste liv.", "Сначала нужно вызвать спасателей и обеспечить свою безопасность — тратить время на самостоятельное тушение пожара в машине может стоить жизни."]
      ],
      "Ved brann i tunnel skal du om mulig kjøre bilen ut. Går ikke det, kjør helt til siden, slå av motoren, kom deg ut av bilen og gå til nærmeste nødutgang eller sikkert sted, og varsle nødetatene så raskt som mulig.",
      "При пожаре в тоннеле нужно, если возможно, выехать из него на машине. Если нет — съехать максимально к краю, выключить двигатель, выйти из машины и дойти до ближайшего эвакуационного выхода или безопасного места, как можно быстрее вызвав спасателей.",
      "В тоннеле при пожаре: если можешь — выезжай; если нет — к краю, мотор выключил, сам к выходу, и звонок спасателям."),

    q("082", hillScene(),
      "Du parkerer i en bakke der bilen peker oppover, og det er fortauskant (kantstein) på høyre side av veien. Hvordan bør du vri forhjulene?",
      "Ты паркуешься на подъёме, машина смотрит вверх по склону, и справа есть бордюр. Как нужно повернуть передние колёса?",
      [
        ["Vrir forhjulene bort fra kantsteinen, slik at bilen ruller bakover mot kantsteinen og blir stoppet av den hvis den skulle trille", "Поворачиваю колёса в сторону от бордюра, чтобы при скатывании назад машина покатилась к бордюру и была остановлена им"],
        ["Vrir forhjulene inn mot kantsteinen, akkurat som i en bakke uten fortauskant", "Поворачиваю колёса к бордюру — как на подъёме без бордюра", "I en bakke MED fortauskant skal hjulene vris bort fra kanten i oppoverbakke, ikke mot den, slik at bilen uansett trygt stoppes av kanten hvis den triller.", "На подъёме С бордюром колёса поворачивают от бордюра, а не к нему — тогда, если машина скатится, бордюр её безопасно остановит."],
        ["Lar forhjulene stå rett fram, siden håndbrekket uansett holder bilen", "Оставляю колёса прямо — ручник всё равно удержит машину", "Håndbrekk og gir skal alltid brukes i tillegg, men hjulvinkelen er en ekstra sikring hvis bremsene likevel skulle svikte.", "Ручник и передача должны использоваться всегда в дополнение, но угол поворота колёс — это дополнительная страховка на случай, если тормоза всё же откажут."],
        ["Vrir forhjulene bort fra kantsteinen uansett om bilen peker oppover eller nedover bakken", "Поворачиваю колёса от бордюра независимо от того, смотрит машина вверх или вниз по склону", "Riktig hjulvinkel avhenger av om bilen peker oppover eller nedover og om det finnes fortauskant, det er ikke samme svar i alle bakker.", "Правильный угол поворота колёс зависит от того, смотрит машина вверх или вниз по склону и есть ли бордюр — ответ не одинаковый для всех случаев."]
      ],
      "Parkerer du i oppoverbakke med fortauskant, vrir du forhjulene bort fra kantsteinen. Da vil bilen, hvis den triller bakover, bli stoppet av kantsteinen. Bruk alltid håndbrekk og legg i gir eller parkeringsposisjon i tillegg.",
      "Если паркуешься на подъёме с бордюром, поворачивай передние колёса в сторону от бордюра. Тогда, если машина покатится назад, бордюр её остановит. Обязательно дополнительно используй ручник и передачу или паркинг.",
      "Подъём + бордюр — колёса от бордюра. Спуск без бордюра — колёса в сторону кювета/края."),

    q("083", null,
      "Ved et vegarbeid viser det midlertidige lyssignalet rødt for deg. En vegarbeider som dirigerer trafikken, står ved siden av lyset og vinker deg tydelig fram. Hva gjelder?",
      "На дорожных работах временный светофор показывает тебе красный. Рядом со светофором стоит рабочий, который регулирует движение, и чётко машет тебе: проезжай. Что действует?",
      [
        ["Jeg følger dirigentens signal, siden anvisninger fra en person som regulerer trafikken går foran lyssignal og skilt", "Следую сигналу регулировщика — указания человека, направляющего движение, важнее светофора и знаков"],
        ["Jeg stopper for det røde lyset, siden lyssignal alltid går foran andre anvisninger", "Останавливаюсь на красный — светофор всегда важнее других указаний", "Det er motsatt: anvisning fra en person som dirigerer trafikken, for eksempel ved vegarbeid, går foran både lyssignal og skilt.", "Наоборот: указание человека, регулирующего движение, например на дорожных работах, важнее и светофора, и знаков."],
        ["Jeg velger selv om jeg vil følge dirigenten eller lyset, etter hva som virker tryggest", "Сам решаю, следовать за регулировщиком или за светофором — как кажется безопаснее", "Det er ikke et fritt valg, rangordningen er fast: dirigentens anvisning går foran det provisoriske lyssignalet.", "Это не свободный выбор — порядок приоритета фиксированный: указание регулировщика важнее временного светофора."],
        ["Jeg venter til både lyset er grønt og dirigenten vinker, for sikkerhets skyld", "Жду, пока и светофор станет зелёным, и регулировщик махнёт, — на всякий случай", "Dirigenten styrer trafikken på stedet akkurat nå. Blir du stående, kan du sperre for kø eller for trafikken dirigenten slipper fram. Følg dirigentens tegn.", "Регулировщик управляет движением прямо сейчас. Если стоять, можно перекрыть путь колонне или тем, кого он пропускает. Следуй его сигналу."]
      ],
      "Anvisninger fra en person som dirigerer trafikken, for eksempel ved vegarbeid, går foran både lyssignal, skilt og vegoppmerking. Følg alltid dirigentens tegn først.",
      "Указания человека, регулирующего движение, например на дорожных работах, важнее и светофора, и знаков, и разметки. Всегда сначала следуй сигналам регулировщика.",
      "Живой человек с жестом главнее любого светофора и знака."),

    qm("m09", null, "Du kjører forbi et trekantet varselskilt med symbolet for barn, nær en skole og en barnehage. Velg alle riktige.", "Ты проезжаешь мимо треугольного предупреждающего знака с силуэтом детей, рядом со школой и детским садом. Выбери все верные.", [
      ["Senker farten og er forberedt på at barn kan komme ut i vegen uventet", "Снижаю скорость и готов к тому, что ребёнок может неожиданно выбежать на дорогу", true],
      ["Er spesielt oppmerksom i tidsrom med mye gange til og fra skolen", "Особенно внимателен в часы, когда много детей идёт в школу и из неё", true],
      ["Holder god avstand til fortau og vegkant der barn kan oppholde seg", "Держу бо́льшую дистанцию от тротуара и края дороги, где могут быть дети", true],
      ["Kjører i vanlig fart siden skiltet bare er en generell påminnelse uten praktisk betydning", "Еду в обычном темпе — знак ведь просто формальное напоминание без практического значения", false, "Skiltet varsler en konkret økt risiko for at barn dukker opp i vegen, det er ikke bare en formell påminnelse uten betydning for farten din.", "Знак предупреждает о реальном повышенном риске появления детей на дороге — это не просто формальное напоминание, которое не должно влиять на твою скорость."]
    ],
    "Et varselskilt med barn varsler at du kjører forbi et sted, som en skole eller barnehage, der barn ofte beveger seg nær vegen. Senk farten, vær ekstra oppmerksom og hold avstand til fortau og vegkant.",
    "Предупреждающий знак с детьми говорит о том, что ты проезжаешь место — школу или детский сад — где дети часто находятся рядом с дорогой. Снижай скорость, будь особенно внимателен и держи дистанцию от тротуара и края дороги.",
    "Знак с детьми — это не формальность: тут реально могут выбежать на дорогу."),

    q("085", null,
      "Du skal ta neste avkjøring fra motorveien. Når bør du redusere farten din?",
      "Тебе нужно съехать с автомагистрали на следующем съезде. Когда нужно снижать скорость?",
      [
        ["Først etter at jeg har kommet inn i selve fartsreduksjonsfeltet (avkjøringsfeltet), ikke mens jeg fortsatt er i de vanlige kjørefeltene", "Только после того, как я уже въехал в саму полосу торможения (съездную полосу), а не пока я ещё в основных полосах"],
        ["Så tidlig som mulig, allerede et par hundre meter før avkjøringen, mens jeg fortsatt er i det vanlige kjørefeltet", "Как можно раньше, за пару сотен метров до съезда, ещё находясь в обычной полосе", "Å bremse ned i det ordinære kjørefeltet på motorveien skaper fare for trafikken bak deg, farten skal reduseres inne i avkjøringsfeltet.", "Снижать скорость в обычной полосе на магистрали создаёт опасность для машин позади — тормозить нужно именно внутри съездной полосы."],
        ["Rett før avkjøringsskiltet, uansett om jeg er i avkjøringsfeltet eller ikke", "Прямо перед знаком съезда, независимо от того, в съездной я полосе или нет", "Det avgjørende er ikke skiltet, men om du allerede har flyttet deg inn i avkjøringsfeltet der fartsreduksjon er trygt.", "Важно не само появление знака, а то, перешёл ли ты уже в съездную полосу, где тормозить безопасно."],
        ["Det er ikke nødvendig å redusere farten før jeg er helt ute av motorveien og på den nye vegen", "Снижать скорость не нужно, пока я не полностью съехал с магистрали на новую дорогу", "Avkjøringsfeltet er nettopp laget for at du skal redusere farten gradvis før du kommer ut på den nye vegen, å vente til du er helt av motorveien er for sent og farlig.", "Съездная полоса специально сделана для того, чтобы постепенно сбросить скорость до выезда на новую дорогу — ждать полного выезда с магистрали поздно и опасно."]
      ],
      "Du skal holde samme fart som trafikken på motorveien til du er inne i avkjøringsfeltet, og redusere farten der. Å bremse i de ordinære kjørefeltene tvinger trafikken bak deg til brå oppbremsing.",
      "Нужно держать скорость потока на магистрали, пока не окажешься в самой съездной полосе, и снижать скорость уже там. Торможение в обычных полосах вынуждает машины позади резко тормозить.",
      "Тормози только внутри съездной полосы — она для этого и сделана."),

    q("086", scene({ you: { from: "south", to: "north" }, others: [{ from: "west", to: "north", kind: "truck" }], roundabout: true }),
      "Du kjører inn i en rundkjøring. Et vogntog i feltet til venstre for deg skal ta samme avkjøring og svinger bredt for å få plass. Hva gjør du?",
      "Ты въезжаешь в круговое движение. Фура в полосе слева от тебя едет на тот же съезд и забирает широко, чтобы хватило места на повороте. Что делаешь?",
      [
        ["Jeg holder tilbake og lar vogntoget få plassen det trenger til å svinge, i stedet for å presse meg forbi", "Придерживаю и даю фуре место, которое ей нужно для поворота, а не пытаюсь проскочить рядом"],
        ["Jeg legger meg tett opp til vogntoget på innsiden, siden jeg har like mye rett til feltet som det", "Прижимаюсь к фуре с внутренней стороны — у меня такое же право на полосу, как у неё", "Et vogntog må svinge bredt for å få plass til henger eller kasse, og kan ikke se eller ta hensyn til en bil som ligger tett innpå i blindsonen.", "Фура должна поворачивать широко, чтобы прицеп или кузов прошли, и просто не видит и не может учесть машину, которая прижалась рядом в слепой зоне."],
        ["Jeg kjører fort forbi vogntoget før det får svingt bredt, siden jeg kom inn i rundkjøringen samtidig", "Проскакиваю мимо фуры, пока она не успела забрать широко — мы ведь въехали в круг одновременно", "Å presse forbi et kjøretøy som trenger bredere svingradius er farlig, uansett hvem som kom inn i rundkjøringen først.", "Пытаться проскочить мимо транспорта, которому нужен широкий радиус поворота, опасно — независимо от того, кто первым въехал в круг."],
        ["Jeg stopper helt i rundkjøringen og venter til vogntoget har kjørt helt ut", "Полностью останавливаюсь в кругу и жду, пока фура не выедет совсем", "Å stoppe midt i rundkjøringen er ikke nødvendig og skaper fare for trafikken bak deg, det er nok å holde avstand og la vogntoget svinge.", "Останавливаться прямо в кругу не нужно и опасно для машин позади — достаточно держать дистанцию и дать фуре повернуть."]
      ],
      "Store kjøretøy som vogntog må ofte svinge bredt, også inn mot ditt kjørefelt, for å få plass til henger eller kasse. Hold avstand og gi dem rom, press deg aldri inn på innsiden.",
      "Большим машинам вроде фур часто приходится забирать широко, даже заезжая в твою полосу, чтобы прицеп или кузов прошли поворот. Держи дистанцию и дай им место, не лезь внутрь.",
      "Фура поворачивает широко — держись дальше, не пытайся проскочить рядом."),

    q("087", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "south" }], signs: { east: "yield" } }),
      "Du nærmer deg et kryss uten skilt for din egen retning. Bilen fra sidevegen, som har vikeplikt, senker farten, men virker ikke til å stoppe helt. Hva gjør du?",
      "Ты подъезжаешь к перекрёстку — у твоей стороны нет знака. Машина с боковой дороги, у которой обязанность уступить, снижает скорость, но не похоже, что остановится полностью. Что делаешь?",
      [
        ["Jeg fortsetter i min fart, men er klar til å bremse hvis den andre bilen faktisk ikke stopper", "Продолжаю ехать в обычном темпе, но готов притормозить, если машина всё-таки не остановится"],
        ["Jeg bremser kraftig ned til gangfart, siden jeg uansett ikke kan være sikker på at den andre bilen stopper", "Резко тормозю почти до шага — я ведь не могу быть уверен, что машина остановится", "Du har forkjørsrett her og skal holde normal fart, ikke bremse ned som om du selv hadde vikeplikt, det skaper unødig usikkerhet for trafikken bak deg.", "У тебя здесь приоритет, и нужно ехать в обычном темпе, а не тормозить, как будто уступаешь ты сам — это создаёт лишнюю неопределённость для машин позади."],
        ["Jeg stopper helt opp for sikkerhets skyld, selv om jeg har vikeplikt til min fordel", "Полностью останавливаюсь на всякий случай, хотя приоритет у меня", "Å stoppe helt når du har forkjørsrett er ikke nødvendig og kan forvirre den andre sjåføren om hvem som skal kjøre først.", "Полностью останавливаться, когда приоритет у тебя, не нужно — это может сбить с толку другого водителя насчёт того, кому ехать первым."],
        ["Jeg øker farten for å komme meg forbi krysset før den andre bilen når fram", "Увеличиваю скорость, чтобы проскочить перекрёсток раньше, чем подъедет та машина", "Å øke farten gir deg mindre tid til å reagere hvis den andre bilen likevel ikke stopper, det er tryggere å holde jevn fart og være forberedt.", "Увеличение скорости оставляет меньше времени на реакцию, если машина всё-таки не остановится — безопаснее держать обычную скорость и быть готовым."]
      ],
      "Forkjørsrett betyr at du kan kjøre videre i normal fart, men den fritar deg ikke for å være oppmerksom. Hold blikket på den andre bilen og vær forberedt på å bremse hvis den ikke stopper som den skal.",
      "Приоритет означает, что можно ехать дальше в обычном темпе, но это не освобождает от внимательности. Следи за машиной с боковой дороги и будь готов притормозить, если она всё же не остановится, как должна.",
      "Приоритет — не повод терять внимательность: следи, остановится ли другая машина на самом деле."),

    q("088", road({ bikeLane: true }),
      "Du skal svinge til høyre ved et kryss. I sykkelfeltet til høyre for deg kommer en syklist som skal rett fram. Du har blinket til høyre i god tid. Hva må du gjøre før du svinger?",
      "Ты поворачиваешь направо на перекрёстке. В велополосе справа едет велосипедист, который поедет прямо. Поворотник ты включил заранее. Что нужно сделать перед поворотом?",
      [
        ["Sjekke i sidespeilet og over skulderen om det faktisk er en syklist i blindsonen, ikke bare stole på blinklyset mitt", "Проверить боковое зеркало и оглянуться через плечо, есть ли на самом деле велосипедист в слепой зоне, а не просто понадеяться на поворотник"],
        ["Stole på at blinklyset har varslet syklisten, siden jeg har signalisert i god tid", "Понадеяться, что поворотник уже предупредил велосипедиста — ведь я включил его заранее", "Blinklyset varsler andre bilister, men en syklist i blindsonen kan likevel være vanskelig å se, det fritar deg ikke fra å sjekke selv.", "Поворотник предупреждает других водителей, но велосипедиста в слепой зоне всё равно может быть не видно — сам поворотник не освобождает тебя от проверки."],
        ["Svinge raskt før syklisten når fram til krysset, siden jeg kom til krysset først", "Быстро повернуть, пока велосипедист не доехал до перекрёстка — я ведь подъехал первым", "Den som kommer først til krysset er ikke avgjørende her, syklisten som skal rett fram i sykkelfeltet har vikeplikt framfor deg som svinger.", "Кто первым подъехал к перекрёстку — здесь не главное: у велосипедиста, который едет прямо по велополосе, приоритет перед тем, кто поворачивает."],
        ["Kjøre inntil kantsteinen tidlig for å stenge sykkelfeltet, slik at syklisten må stoppe for meg", "Прижаться к бордюру заранее, перекрыв велополосу, чтобы велосипедист остановился из-за меня", "Å blokkere sykkelfeltet for å tvinge syklisten til å stoppe er feil og farlig, det er du som svinger som skal vike for syklisten.", "Перекрывать велополосу, чтобы заставить велосипедиста остановиться, — неправильно и опасно: это ты, поворачивающий, должен уступить велосипедисту."]
      ],
      "Når du svinger over et sykkelfelt, har syklisten som kjører rett fram vikeplikt framfor deg. Blinklyset er ikke nok, du må faktisk se etter syklisten i sidespeil og blindsone før du svinger.",
      "Когда поворачиваешь через велополосу, у велосипедиста, едущего прямо, приоритет перед тобой. Одного поворотника недостаточно — нужно реально посмотреть в зеркало и слепую зону перед поворотом.",
      "Поворотник только предупреждает, зеркало за тебя он не проверяет — это дорога велосипедиста."),

    q("089", road({ tunnel: true }),
      "Du kjører inn i en lang tunnel og ser etter noen sekunder at du skulle ha tatt en avkjøring du nå har kjørt forbi. Hva gjør du?",
      "Ты въезжаешь в длинный тоннель и через несколько секунд понимаешь, что проехал нужный тебе съезд. Что делаешь?",
      [
        ["Jeg fortsetter i vanlig fart til jeg kommer ut av tunnelen, og finner en ny vei derfra", "Продолжаю ехать в обычном темпе до выезда из тоннеля, а дальше нахожу новый путь"],
        ["Jeg snur bilen midt i tunnelen så snart det er en lomme å bruke", "Разворачиваюсь прямо в тоннеле, как только появляется карман для этого", "Det er forbudt å snu eller rygge i en tunnel, selv om det finnes en nødlomme, en nødlomme er til nødstopp, ikke til å vende.", "В тоннеле запрещено разворачиваться или сдавать назад, даже если есть карман для аварийной остановки — он для вынужденной остановки, а не для разворота."],
        ["Jeg bremser kraftig ned og rygger tilbake til riktig avkjøring", "Резко тормозю и сдаю назад до нужного съезда", "Å rygge i en tunnel er svært farlig og forbudt, trafikken bak har ikke tid til å reagere på det.", "Сдавать назад в тоннеле очень опасно и запрещено — у машин позади просто нет времени среагировать."],
        ["Jeg stopper midt i kjørefeltet for å tenke meg om før jeg kjører videre", "Останавливаюсь прямо в полосе, чтобы подумать, прежде чем ехать дальше", "Å stoppe i kjørefeltet inne i en tunnel er farlig og forbudt utenom nødstopp, du skal kjøre videre til utgangen.", "Останавливаться в полосе движения внутри тоннеля опасно и запрещено, если это не вынужденная остановка — нужно доехать до выезда."]
      ],
      "I en tunnel er det forbudt å snu, rygge eller stoppe uten grunn, uansett om du har kjørt forbi avkjøringen din. Fortsett i vanlig fart til du kommer ut, og finn en ny vei derfra.",
      "В тоннеле запрещено разворачиваться, сдавать назад или останавливаться без причины — даже если ты проехал свой съезд. Продолжай ехать в обычном темпе до выезда, а дальше найдёшь новый путь.",
      "Пропустил съезд в тоннеле — просто доезжай до выезда, разворот и реверс там запрещены всегда."),

    q("090", null,
      "Om morgenen er alle rutene på bilen din dekket av rim, bortsett fra en liten flekk på frontruta du har skrapt fri. Kan du kjøre slik?",
      "Утром все стёкла машины покрыты инеем, кроме маленького очищенного пятачка на лобовом стекле. Можно ехать в таком виде?",
      [
        ["Nei, alle ruter må være skrapt fri for rim og is, slik at jeg har fullt sikt til alle sider, før jeg kjører", "Нет, все стёкла нужно очистить от инея и льда, чтобы был полный обзор во все стороны, прежде чем ехать"],
        ["Ja, det er nok at frontruta er delvis fri, siden jeg ser rett fram", "Да, достаточно, что лобовое частично очищено — вперёд ведь я вижу", "En liten flekk gir ikke nok sikt til sidene og i speilene, du må ha fri sikt gjennom hele frontruta og sideruter for å oppdage fotgjengere og annen trafikk.", "Маленький пятачок не даёт обзора по сторонам и в зеркала — нужен свободный обзор через всё лобовое и боковые стёкла, чтобы заметить пешеходов и другие машины."],
        ["Ja, så lenge jeg kjører sakte og forsiktig de første minuttene", "Да, если первые минуты ехать медленно и осторожно", "Lav fart kompenserer ikke for at du ikke ser sidene eller bakover, sikten må være fri uansett hvor sakte du kjører.", "Низкая скорость не заменяет отсутствие обзора по бокам и назад — обзор должен быть чистым независимо от того, насколько медленно едешь."],
        ["Nei, men det er greit å kjøre med vinduet åpent og hodet ut for å se, i stedet for å skrape", "Нет, но можно ехать с открытым окном, высунув голову для обзора, вместо того чтобы чистить стёкла", "Å kjøre med hodet ut av vinduet gir ikke forsvarlig sikt eller kontroll over bilen, ruter skal skrapes fri før du kjører.", "Ехать, высунув голову из окна, не даёт нормального обзора и контроля над машиной — стёкла нужно очистить перед поездкой, а не заменять это таким способом."]
      ],
      "Du har ikke lov til å kjøre før alle ruter, speil og lys er fri for rim, is eller snø, slik at du har full sikt til alle kanter. En liten skrapt flekk er ikke nok.",
      "Нельзя ехать, пока все стёкла, зеркала и фонари не очищены от инея, льда или снега — нужен полный обзор во все стороны. Маленького очищенного пятачка недостаточно.",
      "Инеем покрыты все стёкла — чисти все, а не только «дырочку» для обзора вперёд."),

    q("091", road({ lot: true }),
      "Du rygger ut fra en parkeringsplass og kjenner et lite smell. Du ser at du har skrapt opp en parkert bil som står uten fører. Ingen har sett det. Hva er du pliktig til å gjøre?",
      "Ты сдаёшь назад с парковки и чувствуешь лёгкий толчок. Оказывается, ты поцарапал припаркованную машину, в которой никого нет. Никто этого не видел. Что ты обязан сделать?",
      [
        ["Jeg forsøker å finne eieren, og hvis det ikke går, legger jeg igjen en lapp med navn og telefonnummer på bilen", "Пытаюсь найти владельца, а если не получается — оставляю на машине записку со своим именем и номером телефона"],
        ["Jeg kjører videre, siden skaden er liten og ingen har sett det", "Уезжаю — повреждение маленькое, и никто этого не видел", "Skadens størrelse og at ingen har sett det, endrer ikke meldeplikten, du skal forsøke å varsle den skadelidte uansett.", "Размер повреждения и то, что никто не видел, не меняют обязанность сообщить — попытаться уведомить потерпевшего нужно всё равно."],
        ["Jeg venter til eieren kommer tilbake, uansett hvor lenge det tar", "Жду, пока вернётся владелец, сколько бы это ни заняло", "Du har ikke plikt til å vente ubegrenset, det er nok å legge igjen kontaktinformasjon hvis eieren ikke er å finne.", "Нет обязанности ждать бесконечно — достаточно оставить контактные данные, если владельца не найти на месте."],
        ["Jeg ringer bare forsikringsselskapet mitt neste dag, og lar være å gjøre noe ved bilen nå", "Просто звоню в свою страховую на следующий день, а сейчас у машины ничего не делаю", "Å varsle forsikringen senere er ikke nok i seg selv, på stedet skal du forsøke å finne eieren eller legge igjen kontaktinfo.", "Сообщить страховой на следующий день — само по себе не достаточно: на месте нужно попытаться найти владельца или оставить контакты."]
      ],
      "Ved skade på et ubetjent kjøretøy skal du forsøke å finne eieren. Hvis det ikke er mulig, legger du igjen navn og telefonnummer, slik at eieren kan kontakte deg og forsikringen.",
      "При повреждении машины без водителя нужно попытаться найти владельца. Если не получается — оставить имя и телефон, чтобы владелец мог связаться с тобой и со страховой.",
      "Нет владельца на месте — не значит «можно уехать»: записка с контактами обязательна."),

    q("092", null,
      "På en fest drikker du et glass du trodde var alkoholfritt, men det viser seg å inneholde litt alkohol. Du kjenner deg helt normal og skal kjøre hjem etter festen. Er det greit å kjøre?",
      "На вечеринке ты выпил стакан, который считал безалкогольным, но оказалось, что в нём немного алкоголя. Ты чувствуешь себя совершенно нормально и собираешься ехать домой после вечеринки. Можно ли садиться за руль?",
      [
        ["Nei, promillegrensen på 0,2 gjelder uansett hvordan jeg kjenner meg, og jeg vet ikke sikkert hvor mye alkohol jeg faktisk har fått i meg", "Нет, предел 0,2 промилле действует независимо от того, как я себя чувствую, а сколько алкоголя я выпил на самом деле — я точно не знаю"],
        ["Ja, siden jeg kjenner meg helt normal og ikke har drukket med vilje", "Да, я ведь чувствую себя совершенно нормально и не пил алкоголь сознательно", "Promillegrensen handler om alkoholmengden i blodet, ikke om hvordan du subjektivt kjenner deg eller om du drakk med vilje.", "Предел по промилле — это про количество алкоголя в крови, а не про то, как ты себя чувствуешь и выпил ли случайно."],
        ["Ja, siden det bare var et glass og ikke mer", "Да, ведь это был всего один стакан, не больше", "Selv en liten mengde alkohol kan være nok til å komme over grensen på 0,2, mengden i et glass sier ikke noe sikkert om promillen din.", "Даже небольшое количество алкоголя может превысить предел 0,2 — объём одного стакана сам по себе ничего не говорит о твоём промилле."],
        ["Ja, så lenge jeg venter en halvtime før jeg kjører", "Да, если подождать полчаса перед тем, как сесть за руль", "En halv time er for lite tid til at kroppen bryter ned alkohol, og uten å vite promillen din kan du ikke være sikker på at du er under grensen.", "Полчаса — слишком мало времени, чтобы организм расщепил алкоголь, и без знания своего промилле нельзя быть уверенным, что ты уложился в предел."]
      ],
      "Promillegrensen i Norge er 0,2, og den gjelder uansett om du kjenner deg påvirket eller ikke, eller om alkoholen var tilsiktet. Når du ikke vet sikkert hvor mye du har fått i deg, bør du ikke kjøre.",
      "Предел промилле в Норвегии — 0,2, и он действует независимо от того, чувствуешь ли ты опьянение, и выпил ли ты случайно. Если точно не знаешь, сколько алкоголя попало в организм — за руль садиться не стоит.",
      "«Чувствую себя нормально» не считается — важен только промилле, а его на глаз не определить."),

    qm("m10", null, "Bilen din får motorstopp midt på en vanlig vei utenfor tettbygd strøk, og du må gjøre en nødstans i kjørebanen. Velg alle riktige.", "Твоя машина внезапно сломалась прямо на обычной дороге за городом, и тебе нужно сделать вынужденную остановку прямо на проезжей части. Выбери все верные.", [
      ["Jeg setter på nødblinklysene så snart bilen stopper", "Включаю аварийку, как только машина останавливается", true],
      ["Alle som går ut av bilen, tar på seg refleksvest, uansett om det er mørkt eller lyst", "Все, кто выходит из машины, надевают светоотражающий жилет — независимо от времени суток", true],
      ["Jeg setter varseltrekanten i god avstand bak bilen, om mulig minst 150 meter", "Ставлю аварийный треугольник подальше позади машины, по возможности не ближе 150 метров", true],
      ["Refleksvest er bare nødvendig her fordi vi er utenfor tettbygd strøk", "Жилет нужен только потому, что мы за городом", false, "Plikten til å bruke refleksvest ved nødstans gjelder langs alle veier, også inne i tettbygd strøk, ikke bare utenfor.", "Обязанность надевать жилет при вынужденной остановке действует на любой дороге, в том числе в населённом пункте, а не только за городом."]
    ],
    "Ved nødstans setter du på nødblinklys umiddelbart, alle som går ut bruker refleksvest uansett sted, og varseltrekanten settes i god avstand bak bilen, om mulig minst 150 meter.",
    "При вынужденной остановке сразу включи аварийку, все, кто выходит — надевают жилет независимо от места, а треугольник ставится подальше позади машины, по возможности не ближе 150 метров.",
    "Жилет — для всех и везде при nødstans, не только «в чистом поле».")
  ];
})();
