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

    q("010", scene({ you: { from: "south", to: "north" }, others: [{ from: "east", to: "west" }] }),
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

    q("018", scene({ you: { from: "south", to: "east" } }),
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

    q("019", scene({ you: { from: "south", to: "west" }, others: [{ from: "north", to: "south" }] }),
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

    q("020", scene({ you: { from: "south", to: "east" }, peds: ["east"] }),
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
      "Den som kjører inn fra påkjøringsfelt har vikeplikt. Bruk hele feltet til å komme opp i fart, og velg en luke. Trafikken på motorvegen bør likevel gjøre det lett for deg.",
      "Въезжающий с полосы разгона уступает. Используй всю полосу, чтобы набрать скорость, и выбери просвет. Поток на магистрали при этом должен облегчать въезд.",
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
      "Du kan ikke kjøre forbi et kjøretøy som gir tegn til å svinge til venstre eller selv kjører forbi. Vent til situasjonen er klar.",
      "Нельзя обгонять машину, которая показывает поворот налево или сама обгоняет. Дождись, пока ситуация прояснится.",
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
      "Когда трамвай или автобус останавливается без островка безопасности и высаживает пассажиров, нужно остановиться и подождать, пока они безопасно дойдут до тротуара.",
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
        ["Kjøre sakte gjennom gangfeltet samtidig som fotgjengerne går", "Медленно проехать через переход, пока пешеходы ещё идут", "Selv i lav fart er det ikke lov å kjøre gjennom et gangfelt der noen fortsatt krysser.", "Даже на малой скорости нельзя ехать через переход, пока по нему ещё идут люди."]
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
    "Стоп значит стоп: колёса должны на мгновение полностью замереть, «почти ноль» не считается.")
  ];
})();
