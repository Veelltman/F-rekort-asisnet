/* Объёмный вид схем (по «новому виду» Layerwise: студийный свет, мягкие тени, Neutral-тон, экспозиция ×1.35).
   Берёт готовую плоскую схему из js/scene-kit.js (<svg data-3d="1">) и строит из неё диораму:
   «земля» (асфальт, разметка, стрелки) — текстура плиты, а объекты из меток <g data-o="{…}"> — объёмные модели.
   Буквы A/B и подписи рисуются поверх, чёткими. Если WebGL нет или что-то пошло не так — остаётся плоская схема.
   Подключается в index.html как <script type="module">. */

import * as THREE from "./vendor/three.module.min.js";

const W = 400, H = 300;               /* размер холста схемы, 1 ед. = 1 px схемы (машина 20×40) */
const OUT_W = 1200, OUT_H = 900;      /* размер картинки рендера */
const cache = new Map();
let R = null, ENV = null, failed = false;

/* ---------- Рендерер и студия (один на всю страницу) ---------- */
function studioEnvironment() {
  /* Как StudioEnvironment в Layerwise: комната + софтбоксы (тёплый ключ, полоса сверху, холодный контровой, заполняющий) */
  const s = new THREE.Scene();
  const box = new THREE.BoxGeometry();
  const room = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0x6a6e74, roughness: 1 }));
  room.scale.set(64, 44, 64); room.position.y = 12; s.add(room);
  const pl = new THREE.PointLight(0xffffff, 520, 0, 2); pl.position.set(0, 16, 0); s.add(pl);
  const panel = (w, h, k, pos, color, target = [0, 0, 0]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, h * 2), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.material.color.multiplyScalar(k / 4); m.position.set(...pos); m.lookAt(...target); s.add(m);
  };
  panel(16, 12, 14, [-13, 15, 13], 0xfff0dc);
  panel(44, 3.2, 22, [0, 21, 3], 0xffffff);
  panel(10, 18, 10, [17, 9, -15], 0xd4e6ff);
  panel(18, 6, 2.6, [5, 1.5, 22], 0xffe6cc, [0, 4, 0]);
  return s;
}
function renderer() {
  if (R) return R;
  const canvas = document.createElement("canvas");
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(OUT_W, OUT_H, false);
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.1;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  /* всё, что на плоской схеме вышло бы за край, обрезаем по краю плиты */
  r.clippingPlanes = [new THREE.Plane(new THREE.Vector3(1, 0, 0), W / 2 + 0.01), new THREE.Plane(new THREE.Vector3(-1, 0, 0), W / 2 + 0.01),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), H / 2 + 0.01), new THREE.Plane(new THREE.Vector3(0, 0, -1), H / 2 + 0.01)];
  const pm = new THREE.PMREMGenerator(r);
  ENV = pm.fromScene(studioEnvironment(), 0.04).texture;
  R = r;
  return r;
}

/* ---------- Материалы и простые детали ---------- */
const matCache = new Map();
function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (matCache.has(key)) return matCache.get(key);
  const m = o.paint
    ? new THREE.MeshPhysicalMaterial({ color, metalness: 0.25, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 })
    : new THREE.MeshStandardMaterial({ color, roughness: o.rough != null ? o.rough : 0.75, metalness: o.metal || 0,
        emissive: o.emissive || 0x000000, emissiveIntensity: o.ei != null ? o.ei : 1, transparent: !!o.opacity, opacity: o.opacity || 1 });
  matCache.set(key, m);
  return m;
}
const GLASS = () => mat(0x1b2733, { rough: 0.08, metal: 0.4 });
function mesh(geo, m, cast = true, receive = true) { const x = new THREE.Mesh(geo, m); x.castShadow = cast; x.receiveShadow = receive; return x; }
/* Скруглённый «брусок»: прямоугольник w×l со скруглением r, выдавленный на высоту h (ось Y), с фаской */
function rbox(w, l, h, r, bevel = 1) {
  const s = new THREE.Shape(), x = -w / 2, z = -l / 2;
  r = Math.min(r, w / 2 - 0.01, l / 2 - 0.01);
  s.moveTo(x + r, z); s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r);
  s.lineTo(x + w, z + l - r); s.quadraticCurveTo(x + w, z + l, x + w - r, z + l);
  s.lineTo(x + r, z + l); s.quadraticCurveTo(x, z + l, x, z + l - r); s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.01, h - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3, curveSegments: 6 });
  g.rotateX(Math.PI / 2); g.translate(0, h - bevel, 0);
  return g;
}
function wheel(r = 3.3, w = 2.6) {
  const g = new THREE.Group();
  const tire = mesh(new THREE.CylinderGeometry(r, r, w, 18), mat(0x16191d, { rough: 0.9 }));
  tire.rotation.z = Math.PI / 2; g.add(tire);
  const rim = mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.2, 12), mat(0xb9c1ca, { rough: 0.3, metal: 0.8 }));
  rim.rotation.z = Math.PI / 2; g.add(rim);
  return g;
}
function lamp(color, x, y, z, w = 4.4, h = 1.6, d = 0.6, ei = 1.6) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat(color, { emissive: color, ei, rough: 0.3 }), false, false);
  m.position.set(x, y, z); return m;
}

/* ---------- Машины ---------- */
/* Локальные оси: нос машины смотрит в −Z (как «вверх» на схеме при rot 0), X — вправо */
function car(color, o) {
  const g = new THREE.Group();
  [[-10.6, -12.5], [10.6, -12.5], [-10.6, 12.5], [10.6, 12.5]].forEach(([x, z], i) => {
    const w = wheel(); w.position.set(x, 3.3, z); if (i < 2 && o.steer) w.rotation.y = -o.steer * Math.PI / 180; g.add(w);
  });
  const paint = mat(color, { paint: true });
  const body = mesh(rbox(20, 40, 6.5, 6, 1.2), paint); body.position.y = 2.6; g.add(body);
  const cabin = mesh(rbox(17.4, 21, 5.2, 4, 0.8), GLASS()); cabin.position.set(0, 9, 1.2); g.add(cabin);
  const roof = mesh(rbox(16.2, 15, 1.2, 4, 0.4), paint); roof.position.set(0, 14, 2.4); g.add(roof);
  g.add(lamp(0xfff3c4, -6, 6.4, -20.1, 4.6, 1.6, 0.6, o.beams ? 3 : 0.8), lamp(0xfff3c4, 6, 6.4, -20.1, 4.6, 1.6, 0.6, o.beams ? 3 : 0.8));
  const tail = o.brake ? 2.6 : 0.7;
  g.add(lamp(0xff2a1a, -6.4, 6.6, 20.1, 4.4, 1.6, 0.6, tail), lamp(0xff2a1a, 6.4, 6.6, 20.1, 4.4, 1.6, 0.6, tail));
  addBlink(g, o.blink, 10, 20, 6.6);
  if (o.door) {
    const d = mesh(new THREE.BoxGeometry(0.8, 5.5, 12), paint);
    const s = o.door === "left" ? -1 : 1;
    d.position.set(s * (10 + 4), 6, -3 + 2); d.rotation.y = s * 0.6; g.add(d);
  }
  return g;
}
function addBlink(g, side, hw, hl, y) {
  if (!side) return;
  const xs = side === "hazard" ? [-hw, hw] : [side === "left" ? -hw : hw];
  xs.forEach(x => { [-hl + 1, hl - 1].forEach(z => {
    const m = mesh(new THREE.SphereGeometry(1.5, 10, 8), mat(0xffb000, { emissive: 0xffa000, ei: 3 }), false, false);
    m.position.set(x, y, z); g.add(m);
  }); });
}
function stripes(g, colors, y0, hw, z0, z1) {
  const n = colors.length, step = (z1 - z0) / n;
  colors.forEach((c, i) => { [-1, 1].forEach(sx => {
    const m = mesh(new THREE.BoxGeometry(0.5, 2.6, step), mat(c, { rough: 0.5 }), false, false);
    m.position.set(sx * (hw + 0.25), y0, z0 + step * (i + 0.5)); g.add(m);
  }); });
}
function lightBar(g, color, y) {
  const m = mesh(new THREE.BoxGeometry(12, 1.6, 3), mat(color, { emissive: color, ei: 2.4, rough: 0.3 }), false, false);
  m.position.set(0, y, 0); g.add(m);
}
function police(o) {
  const g = car(0xf3f5f7, o);
  stripes(g, [0x1d4ed8, 0xf5d90a, 0x1d4ed8, 0xf5d90a, 0x1d4ed8], 6.2, 10, -16, 14);
  if (o.beacon !== false) lightBar(g, 0x3b82f6, 15.4);
  return g;
}
function ambulance(o) {
  const g = car(0xf3f5f7, o);
  stripes(g, [0xf5d90a, 0x1f9d55, 0xf5d90a, 0x1f9d55, 0xf5d90a], 6.2, 10, -16, 14);
  lightBar(g, 0x3b82f6, 15.4);
  return g;
}
function truck(color, o) {
  const g = new THREE.Group();
  [[-11, -27], [11, -27], [-11, 22], [11, 22], [-11, 31], [11, 31]].forEach(([x, z]) => { const w = wheel(4, 3); w.position.set(x, 4, z); g.add(w); });
  const cab = mesh(rbox(20, 20, 15, 3, 1), mat(color, { paint: true })); cab.position.set(0, 3, -27); g.add(cab);
  const ws = mesh(new THREE.BoxGeometry(17, 5.5, 0.6), GLASS()); ws.position.set(0, 13, -37.1); g.add(ws);
  const box = mesh(rbox(22, 52, 19, 1.5, 0.6), mat(0xe9edf1, { rough: 0.6 })); box.position.set(0, 3.5, 12); g.add(box);
  g.add(lamp(0xfff3c4, -6.5, 7, -37.2, 4, 1.6), lamp(0xfff3c4, 6.5, 7, -37.2, 4, 1.6));
  g.add(lamp(0xff2a1a, -8, 6, 38.1, 3.4, 1.6, 0.6, o.brake ? 2.6 : 0.7), lamp(0xff2a1a, 8, 6, 38.1, 3.4, 1.6, 0.6, o.brake ? 2.6 : 0.7));
  addBlink(g, o.blink, 11, 37, 7);
  if (o.beacon) lightBar(g, o.beacon === "amber" ? 0xffb000 : 0x3b82f6, 19);
  return g;
}
function bus(color, o) {
  const g = new THREE.Group();
  [[-11, -20], [11, -20], [-11, 20], [11, 20]].forEach(([x, z]) => { const w = wheel(4, 3); w.position.set(x, 4, z); g.add(w); });
  const b = mesh(rbox(22, 64, 18, 4, 1), mat(color, { paint: true })); b.position.set(0, 3, 0); g.add(b);
  const band = mesh(rbox(22.4, 60, 5.5, 4, 0.2), GLASS()); band.position.set(0, 11.5, 0.5); g.add(band);
  const ws = mesh(new THREE.BoxGeometry(18, 7, 0.6), GLASS()); ws.position.set(0, 11, -32.1); g.add(ws);
  g.add(lamp(0xfff3c4, -7, 6, -32.2, 4, 1.6), lamp(0xfff3c4, 7, 6, -32.2, 4, 1.6));
  addBlink(g, o.blink, 11, 32, 7);
  if (o.beacon) lightBar(g, o.beacon === "amber" ? 0xffb000 : 0x3b82f6, 21.4);
  return g;
}
function tram(color, o) {
  const g = new THREE.Group();
  const paint = mat(color, { paint: true }), white = mat(0xf2f4f7, { rough: 0.5 });
  [-24, 24].forEach(z => {
    const seg = mesh(rbox(22, 44, 19, 6, 1), paint); seg.position.set(0, 2, z); g.add(seg);
    const band = mesh(rbox(22.4, 40, 6, 5, 0.2), GLASS()); band.position.set(0, 11, z); g.add(band);
    const st = mesh(rbox(22.4, 42, 1.2, 5, 0.1), white); st.position.set(0, 8.6, z); g.add(st);
  });
  const joint = mesh(new THREE.BoxGeometry(18, 15, 6), mat(0x3a4450)); joint.position.set(0, 3, 0); g.add(joint);
  const pan = mesh(new THREE.BoxGeometry(1, 6, 12), mat(0x2a2f36), true, false); pan.position.set(0, 24, -20); pan.rotation.x = 0.5; g.add(pan);
  if (o.doors) [-36, -14, 12, 34].forEach(z => g.add(lamp(0xffb000, 11.3, 10, z, 0.6, 8, 4, 1.4)));
  return g;
}
function tractor(color) {
  const g = new THREE.Group();
  [[-10, 12], [10, 12]].forEach(([x, z]) => { const w = wheel(7, 5); w.position.set(x, 7, z); g.add(w); });
  [[-8, -14], [8, -14]].forEach(([x, z]) => { const w = wheel(4, 3); w.position.set(x, 4, z); g.add(w); });
  const b = mesh(rbox(12, 26, 9, 2, 0.6), mat(color, { paint: true })); b.position.set(0, 4, -6); g.add(b);
  const cab = mesh(rbox(16, 16, 14, 2, 0.6), GLASS()); cab.position.set(0, 8, 10); g.add(cab);
  const roof = mesh(rbox(17, 17, 1.2, 2, 0.3), mat(color, { paint: true })); roof.position.set(0, 22, 10); g.add(roof);
  const sign = mesh(new THREE.CircleGeometry(3, 3), mat(0xf08c1a, { emissive: 0xf08c1a, ei: 0.4 })); sign.position.set(0, 12, 19); g.add(sign);
  return g;
}
function riderBody(color, standing) {
  const g = new THREE.Group();
  const torso = mesh(new THREE.CapsuleGeometry(2.4, standing ? 7 : 5, 4, 8), mat(color, { rough: 0.8 }));
  torso.position.set(0, standing ? 11 : 10, standing ? 0 : 1.5); torso.rotation.x = standing ? 0 : -0.5; g.add(torso);
  const head = mesh(new THREE.SphereGeometry(2.2, 12, 10), mat(0xf4f6f8, { rough: 0.4 })); head.position.set(0, standing ? 17 : 15, standing ? -0.5 : -1.5); g.add(head);
  return g;
}
function bike(color) {
  const g = new THREE.Group();
  [-8, 8].forEach(z => { const t = mesh(new THREE.TorusGeometry(3.6, 0.5, 8, 18), mat(0x1d2025)); t.rotation.y = Math.PI / 2; t.position.set(0, 3.6, z); g.add(t); });
  const fr = mesh(new THREE.BoxGeometry(0.8, 0.8, 16), mat(0x2a2f36)); fr.position.set(0, 6, 0); g.add(fr);
  const hb = mesh(new THREE.BoxGeometry(8, 0.7, 0.7), mat(0x2a2f36)); hb.position.set(0, 9, -7); g.add(hb);
  g.add(riderBody(color, false));
  return g;
}
function scooter(color) {
  const g = new THREE.Group();
  [-6, 6].forEach(z => { const t = mesh(new THREE.TorusGeometry(2, 0.5, 8, 14), mat(0x1d2025)); t.rotation.y = Math.PI / 2; t.position.set(0, 2, z); g.add(t); });
  const deck = mesh(new THREE.BoxGeometry(3, 0.8, 12), mat(0x2a2f36)); deck.position.set(0, 2.6, 0); g.add(deck);
  const stem = mesh(new THREE.BoxGeometry(0.7, 11, 0.7), mat(0x2a2f36)); stem.position.set(0, 8, -6); g.add(stem);
  g.add(riderBody(color, true));
  return g;
}
function trailer(kind) {
  const g = new THREE.Group();
  const caravan = kind === "caravan";
  [[-12, caravan ? 24 : 14], [12, caravan ? 24 : 14]].forEach(([x, z]) => { const w = wheel(3, 2.4); w.position.set(x, 3, z); g.add(w); });
  const b = caravan ? mesh(rbox(24, 44, 20, 5, 1.2), mat(0xf4f1ea, { rough: 0.55 })) : mesh(rbox(20, 26, 8, 1, 0.4), mat(0xa7b0b9, { rough: 0.6 }));
  b.position.set(0, 3, caravan ? 22 : 13); g.add(b);
  if (caravan) { const w = mesh(new THREE.BoxGeometry(24.4, 4, 10), GLASS()); w.position.set(0, 17, 18); g.add(w); }
  const bar = mesh(new THREE.BoxGeometry(1, 1, 8), mat(0x555555)); bar.position.set(0, 4, -4); g.add(bar);
  return g;
}
function vehicle3d(d) {
  const color = new THREE.Color(d.color || "#1f63e0").getHex();
  const g = new THREE.Group();
  let model;
  if (d.kind === "truck") model = truck(color, d);
  else if (d.kind === "bus") model = bus(color, d);
  else if (d.kind === "tram") model = tram(color, d);
  else if (d.kind === "tractor") model = tractor(color);
  else if (d.kind === "bike") model = bike(color);
  else if (d.kind === "scooter") model = scooter(color);
  else if (d.kind === "police") model = police(d);
  else if (d.kind === "emergency") model = ambulance(d);
  else model = car(color, d);
  if (d.beacon && d.kind !== "police" && d.kind !== "truck" && d.kind !== "bus") lightBar(model, d.beacon === "amber" ? 0xffb000 : 0x3b82f6, 15.6);
  g.add(model);
  if (d.trailer) {
    const t = trailer(d.trailer);
    const hitch = d.kind === "car" || !d.kind ? 20 : 38;
    const piv = new THREE.Group(); piv.position.set(0, 0, hitch); piv.rotation.y = -(d.trailerRot || 0) * Math.PI / 180;
    t.position.z = 8; piv.add(t); g.add(piv);
  }
  if (d.smoke) {
    const fire = mesh(new THREE.SphereGeometry(5, 12, 10), mat(0xff7a1a, { emissive: 0xff5a00, ei: 2.5 }), false, false); fire.position.set(0, 9, -18); g.add(fire);
    [[0, 18, -22, 7], [3, 28, -28, 9], [-3, 38, -34, 11]].forEach(([x, y, z, r]) => {
      const s = mesh(new THREE.SphereGeometry(r, 12, 10), mat(0x5b6270, { opacity: 0.55, rough: 1 }), false, false); s.position.set(x, y, z); g.add(s);
    });
  }
  return g;
}

/* ---------- Люди и животные ---------- */
function person3d(d) {
  const g = new THREE.Group();
  const s = (d.kind === "child" ? 0.72 : 1);
  const coat = new THREE.Color(d.color || "#3d4a5c").getHex();
  const legs = mat(0x2a2f38, { rough: 0.85 });
  [-1.3, 1.3].forEach(x => { const l = mesh(new THREE.CapsuleGeometry(1, 6, 4, 8), legs); l.position.set(x, 4, 0); g.add(l); });
  const torso = mesh(new THREE.CapsuleGeometry(2.6, 5, 4, 10), mat(coat, { rough: 0.8 })); torso.position.set(0, 11.5, 0); g.add(torso);
  if (d.kind === "worker" || d.kind === "patrol") {
    [10.5, 13].forEach(y => { const b = mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.8, 12), mat(0xff8a1f, { rough: 0.5 })); b.position.set(0, y, 0); g.add(b); });
  }
  const head = mesh(new THREE.SphereGeometry(2.1, 14, 12), mat(0xe9c3a6, { rough: 0.7 })); head.position.set(0, 17.6, 0); g.add(head);
  const hat = d.kind === "worker" || d.kind === "patrol" ? mat(0xffd21f, { rough: 0.4 }) : d.kind === "officer" ? mat(0x14233a) : mat(0x3b2a20, { rough: 0.9 });
  const cap = mesh(new THREE.SphereGeometry(2.25, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hat); cap.position.set(0, 17.9, 0); g.add(cap);
  const armM = mat(coat, { rough: 0.8 });
  const arm = (side, raised) => { const a = mesh(new THREE.CapsuleGeometry(0.8, 5, 4, 6), armM); a.position.set(side * 3.2, raised ? 15.5 : 11, raised ? -1 : 0); a.rotation.z = raised ? side * -2.3 : side * 0.15; g.add(a); };
  arm(-1, false); arm(1, d.wave || d.kind === "officer" || d.kind === "patrol");
  if (d.kind === "cane") { const c = mesh(new THREE.CylinderGeometry(0.35, 0.35, 13, 6), mat(0xffffff, { rough: 0.4 })); c.position.set(4, 6, -3); c.rotation.x = 0.45; g.add(c);
    const tip = mesh(new THREE.CylinderGeometry(0.4, 0.4, 2, 6), mat(0xd81e1e)); tip.position.set(4, 0.8, -5.8); tip.rotation.x = 0.45; g.add(tip); }
  if (d.kind === "patrol") { const p = mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.5, 18), mat(0xffffff)); p.rotation.x = Math.PI / 2; p.position.set(6, 21, -1); g.add(p);
    const r = mesh(new THREE.TorusGeometry(3.2, 0.5, 6, 18), mat(0xd81e1e)); r.position.set(6, 21, -0.7); g.add(r); }
  g.scale.setScalar(s * 1.5);
  return g;
}
function animal(d) {
  const g = new THREE.Group();
  if (d.t === "sheep") {
    const wool = mat(0xf6f4ef, { rough: 1 });
    [[0, 6, 0, 5], [0, 6.5, 4, 4.5], [0, 6.5, -4, 4.5], [2.5, 7.5, 0, 3.6], [-2.5, 7.5, 0, 3.6]].forEach(([x, y, z, r]) => { const b = mesh(new THREE.SphereGeometry(r, 10, 8), wool); b.position.set(x, y, z); g.add(b); });
    const h = mesh(new THREE.SphereGeometry(2.4, 10, 8), mat(0x2f2a26)); h.position.set(0, 8, -8.5); g.add(h);
    [[-2, -3], [2, -3], [-2, 3], [2, 3]].forEach(([x, z]) => { const l = mesh(new THREE.CylinderGeometry(0.7, 0.7, 3, 6), mat(0x2f2a26)); l.position.set(x, 1.5, z); g.add(l); });
    return g;
  }
  const big = d.t === "moose", col = big ? 0x5a4030 : 0x8a5a36;
  const legH = big ? 11 : 9;
  [[-3, -9], [3, -9], [-3, 9], [3, 9]].forEach(([x, z]) => { const l = mesh(new THREE.CylinderGeometry(1, 0.8, legH, 6), mat(col)); l.position.set(x, legH / 2, z); g.add(l); });
  const body = mesh(new THREE.CapsuleGeometry(5, 16, 4, 10), mat(col, { rough: 0.9 })); body.rotation.x = Math.PI / 2; body.position.set(0, legH + 4, 0); g.add(body);
  const neck = mesh(new THREE.CapsuleGeometry(2.4, 7, 4, 8), mat(col)); neck.position.set(0, legH + 9, -12); neck.rotation.x = -0.6; g.add(neck);
  const head = mesh(new THREE.CapsuleGeometry(2.2, 5, 4, 8), mat(big ? 0x4a3426 : 0x7a4c2c)); head.rotation.x = Math.PI / 2 - 0.3; head.position.set(0, legH + 12, -17); g.add(head);
  if (big) [-1, 1].forEach(sx => { const a = mesh(new THREE.BoxGeometry(7, 0.8, 4), mat(0x8a6a50)); a.position.set(sx * 5, legH + 16, -15); a.rotation.z = sx * 0.4; g.add(a); });
  if (d.rider) { const r = new THREE.Color(d.rider).getHex(); const t = mesh(new THREE.CapsuleGeometry(2.4, 5, 4, 8), mat(r)); t.position.set(0, legH + 13, 1); g.add(t);
    const h = mesh(new THREE.SphereGeometry(2.1, 10, 8), mat(0xffd21f)); h.position.set(0, legH + 19, 0.5); g.add(h); }
  return g;
}

/* ---------- Окружение: деревья, дома, конусы, вехи, знаки, светофоры ---------- */
function tree3d(d) {
  const g = new THREE.Group(), r = d.r || 13;
  const tr = mesh(new THREE.CylinderGeometry(1.4, 2, 10, 8), mat(0x6b4a32)); tr.position.y = 5; g.add(tr);
  const leaf = mat(0x5f8f52, { rough: 0.95 }), leaf2 = mat(0x76a565, { rough: 0.95 });
  const a = mesh(new THREE.IcosahedronGeometry(r * 0.85, 1), leaf); a.position.y = 10 + r * 0.7; g.add(a);
  const b = mesh(new THREE.IcosahedronGeometry(r * 0.6, 1), leaf2); b.position.set(-r * 0.3, 10 + r * 1.25, -r * 0.2); g.add(b);
  return g;
}
function house3d(d) {
  const g = new THREE.Group();
  const w = d.w, l = d.h, hWall = 18, hRoof = Math.min(w, l) * 0.55;
  const WALLS = [0xf1ede6, 0x9e2b25, 0xe7c66b, 0xdfe6ee, 0x6f8fa8];
  const walls = mesh(new THREE.BoxGeometry(w - 4, hWall, l - 4), mat(WALLS[Math.abs(Math.round(d.x * 7 + d.y * 3)) % WALLS.length], { rough: 0.9 })); walls.position.y = hWall / 2; g.add(walls);
  /* двускатная крыша вдоль длинной стороны */
  const along = w >= l, L = along ? w : l, S = along ? l : w;
  const shape = new THREE.Shape([new THREE.Vector2(-S / 2, 0), new THREE.Vector2(S / 2, 0), new THREE.Vector2(0, hRoof)]);
  const rg = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false }); rg.translate(0, 0, -L / 2);
  const roof = mesh(rg, mat(0x5a5f66, { rough: 0.7 })); roof.position.y = hWall; if (along) roof.rotation.y = Math.PI / 2; g.add(roof);
  [-1, 1].forEach(s => { const win = mesh(new THREE.BoxGeometry(5, 5, 0.4), GLASS(), false, false); win.position.set(s * (w / 4), 9, (l - 4) / 2 + 0.2); g.add(win); });
  g.position.set(d.x + w / 2 - W / 2, 0, d.y + l / 2 - H / 2);
  return g;
}
function cone3d() {
  const g = new THREE.Group();
  const c = mesh(new THREE.ConeGeometry(3.6, 10, 16), mat(0xf26b1d, { rough: 0.6 })); c.position.y = 5.5; g.add(c);
  const b = mesh(new THREE.CylinderGeometry(2.2, 2.7, 2, 16), mat(0xffffff, { rough: 0.5 })); b.position.y = 6; g.add(b);
  const base = mesh(new THREE.BoxGeometry(8, 1, 8), mat(0x2a2f36)); base.position.y = 0.5; g.add(base);
  return g;
}
function post3d() {
  const g = new THREE.Group();
  const p = mesh(new THREE.BoxGeometry(2.4, 14, 2.4), mat(0xffffff, { rough: 0.5 })); p.position.y = 7; g.add(p);
  const b = mesh(new THREE.BoxGeometry(2.5, 3, 2.5), mat(0x1d1f24)); b.position.y = 11; g.add(b);
  const rf = mesh(new THREE.BoxGeometry(1.4, 1.6, 2.6), mat(0xf5a623, { emissive: 0xf5a623, ei: 0.6 })); rf.position.y = 11; g.add(rf);
  return g;
}
function triangle3d() {
  const g = new THREE.Group();
  const sh = new THREE.Shape([new THREE.Vector2(-5, 0), new THREE.Vector2(5, 0), new THREE.Vector2(0, 8.6)]);
  const hole = new THREE.Path([new THREE.Vector2(-2.6, 1.5), new THREE.Vector2(2.6, 1.5), new THREE.Vector2(0, 6)]); sh.holes.push(hole);
  const t = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }), mat(0xe0231a, { emissive: 0x801010, ei: 0.4 }));
  t.position.y = 1; t.rotation.x = -0.25; g.add(t);
  return g;
}
const texCache = new Map();
function textureFromImage(src) {
  if (texCache.has(src)) return texCache.get(src);
  const p = new Promise((res) => {
    const img = new Image(); img.decoding = "async";
    img.onload = () => { const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; t.anisotropy = 4; res(t); };
    img.onerror = () => res(null);
    img.src = src;
  });
  texCache.set(src, p);
  return p;
}
function svgToImage(markup, vb, px) {
  const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${px[0]}" height="${px[1]}">${markup}</svg>`;
  return textureFromImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText));
}
/* Щит знака: картинка из img/signs или рисованный знак (скорость, временная, остановка…) */
async function signBoardTexture(el, size) {
  const im = el.querySelector("image[href^='img/signs/']");
  const boards = el.querySelectorAll(":scope > g > g");
  const board = boards[boards.length - 1];
  if (board && !board.querySelector("image")) return svgToImage(board.innerHTML, `${-size / 2} ${-size / 2} ${size} ${size}`, [256, 256]);
  if (im) {
    const imgs = el.querySelectorAll("image");
    return textureFromImage(imgs[imgs.length - 1].getAttribute("href"));
  }
  return null;
}
async function sign3d(d, el) {
  const g = new THREE.Group();
  const s = d.size || 26, board = s * 0.85;
  const poleH = 16 + board * 0.3 + (d.under ? board * 0.5 : 0);
  const pole = mesh(new THREE.CylinderGeometry(0.6, 0.6, poleH, 8), mat(0x8a939e, { rough: 0.4, metal: 0.6 })); pole.position.y = poleH / 2; g.add(pole);
  const face = new THREE.Group(); face.position.y = poleH; face.rotation.x = -0.32; g.add(face);
  const tex = await signBoardTexture(el, s);
  const back = mesh(new THREE.PlaneGeometry(board, board), mat(0xaab2bb, { rough: 0.5, metal: 0.4 })); back.rotation.y = Math.PI; back.position.set(0, board / 2, -0.15); face.add(back);
  if (tex) {
    const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, roughness: 0.45, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18 });
    const p = mesh(new THREE.PlaneGeometry(board, board), m, true, false); p.position.set(0, board / 2, 0.05); face.add(p);
  }
  if (d.under) {
    const ut = await textureFromImage(`img/signs/${d.under}.png`);
    if (ut) { const m = new THREE.MeshStandardMaterial({ map: ut, transparent: true, alphaTest: 0.35, roughness: 0.5, emissive: 0xffffff, emissiveMap: ut, emissiveIntensity: 0.15 });
      const p = mesh(new THREE.PlaneGeometry(board, board * 0.5), m, true, false); p.position.set(0, -board * 0.28, 0.05); face.add(p); }
  }
  return g;
}
function light3d(d) {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.7, 0.7, 20, 8), mat(0x5b636d, { rough: 0.4, metal: 0.6 })); pole.position.y = 10; g.add(pole);
  const head = new THREE.Group(); head.position.y = 20; head.rotation.x = -0.25; g.add(head);
  const h = mesh(rbox(7, 3.4, d.ped ? 12 : 17, 1.2, 0.4), mat(0x1f2630, { rough: 0.5 })); h.rotation.x = Math.PI / 2; h.position.set(0, d.ped ? 6 : 8.5, 1.7); head.add(h);
  const on = c => d.state === c || (d.state === "redyellow" && (c === "red" || c === "yellow")) || (d.state === "flash" && c === "yellow");
  const lampsAt = d.ped ? [["red", 0xff3b2a, 9], ["green", 0x22c55e, 3]] : [["red", 0xff3b2a, 13.5], ["yellow", 0xffc21a, 8.5], ["green", 0x25d366, 3.5]];
  lampsAt.forEach(([c, col, y]) => {
    const lit = on(c);
    const m = mesh(new THREE.CircleGeometry(2, 18), mat(lit ? col : 0x2a2c30, { emissive: lit ? col : 0x000000, ei: lit ? 3.2 : 0, rough: 0.3 }), false, false);
    m.position.set(0, y, 3.5); head.add(m);
    if (lit) { const glow = mesh(new THREE.CircleGeometry(4.2, 18), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, depthWrite: false }), false, false); glow.position.set(0, y, 3.6); head.add(glow); }
  });
  return g;
}
function raillight3d(d) {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.7, 0.7, 16, 8), mat(0x5b636d, { metal: 0.6, rough: 0.4 })); pole.position.y = 8; g.add(pole);
  const bar = mesh(new THREE.BoxGeometry(18, 5, 2), mat(0x1f2630)); bar.position.set(0, 16, 0); bar.rotation.x = -0.25; g.add(bar);
  [-5, 5].forEach((x, i) => { const lit = d.state === "flash" && i === 0;
    const m = mesh(new THREE.CircleGeometry(2, 16), mat(lit ? 0xff2a1a : 0x4a1d1a, { emissive: lit ? 0xff2a1a : 0, ei: lit ? 3 : 0 }), false, false); m.position.set(x, 16.3, 1.1); m.rotation.x = -0.25; g.add(m); });
  return g;
}
function train3d(d) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const c = mesh(rbox(24, 88, 22, 4, 1), mat(i === 0 ? 0xc8202c : 0xd6dbe0, { paint: i === 0 })); c.position.set(0, 2, 44 + i * 92 - 40); g.add(c);
    const w = mesh(rbox(24.4, 82, 5, 3, 0.2), GLASS()); w.position.set(0, 13, 44 + i * 92 - 40); g.add(w);
  }
  const nose = mesh(new THREE.SphereGeometry(12, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc8202c, { paint: true })); nose.rotation.x = -Math.PI / 2; nose.scale.set(1, 1.2, 0.8); nose.position.set(0, 12, -40); g.add(nose);
  return g;
}

function tunnel3d(d) {
  /* холм над дорогой: всё выше линии y — «внутри горы»; спереди портал с тёмным проёмом */
  const g = new THREE.Group(), depth = d.y, H0 = 46;
  const hill = mesh(rbox(W + 2, depth + 30, H0, 30, 6), mat(0x6f8a5e, { rough: 1 }));
  hill.position.set(0, -2, -H / 2 + depth / 2 - 15); g.add(hill);
  [[-140, 0.9], [-60, 1.1], [60, 1.0], [150, 0.85]].forEach(([x, k]) => { const b = mesh(new THREE.IcosahedronGeometry(26 * k, 1), mat(0x5f7a50, { rough: 1 })); b.position.set(x, H0 - 6, -H / 2 + depth / 2 - 10); g.add(b); });
  const cx = (d.x0 + d.x1) / 2 - W / 2, wOpen = d.x1 - d.x0 + 14;
  const frame = mesh(new THREE.BoxGeometry(wOpen + 16, 34, 8), mat(0xa4abb3, { rough: 0.7 })); frame.position.set(cx, 17, -H / 2 + depth + 1); g.add(frame);
  const shape = new THREE.Shape(); shape.moveTo(-wOpen / 2, 0); shape.lineTo(-wOpen / 2, 16); shape.quadraticCurveTo(-wOpen / 2, 28, 0, 28); shape.quadraticCurveTo(wOpen / 2, 28, wOpen / 2, 16); shape.lineTo(wOpen / 2, 0);
  const hole = mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0x07090c }), false, false);
  hole.position.set(cx, 0.2, -H / 2 + depth + 5.2); g.add(hole);
  return g;
}
function tunnelWalls3d(d) {
  const g = new THREE.Group(), m = mat(0x8c939b, { rough: 0.85 });
  [[d.x0 - 26, -1], [d.x1 + 26, 1]].forEach(([x]) => { const w = mesh(new THREE.BoxGeometry(10, 34, H), m); w.position.set(x - W / 2, 17, 0); g.add(w);
    for (let z = -H / 2 + 20; z < H / 2; z += 40) { const l = mesh(new THREE.BoxGeometry(2, 3, 12), mat(0xffd36a, { emissive: 0xffc24a, ei: 2.2 }), false, false); l.position.set(x - W / 2 + (x < d.x0 ? 5.5 : -5.5), 28, z); g.add(l); } });
  return g;
}
function bridge3d(d) {
  const g = new THREE.Group(), z0 = d.y - d.h / 2 - H / 2, z1 = d.y + d.h / 2 - H / 2, m = mat(0xc7ccd2, { rough: 0.4, metal: 0.6 });
  [d.x0 - 8, d.x1 + 8].forEach(x => {
    const rail = mesh(new THREE.BoxGeometry(1.6, 1.6, z1 - z0), m); rail.position.set(x - W / 2, 9, (z0 + z1) / 2); g.add(rail);
    const rail2 = mesh(new THREE.BoxGeometry(1.2, 1.2, z1 - z0), m); rail2.position.set(x - W / 2, 5, (z0 + z1) / 2); g.add(rail2);
    for (let z = z0; z <= z1 + 0.1; z += (z1 - z0) / 6) { const p = mesh(new THREE.BoxGeometry(1.6, 9, 1.6), m); p.position.set(x - W / 2, 4.5, z); g.add(p); }
  });
  return g;
}
function curb3d(d) {
  const c = mesh(new THREE.BoxGeometry(5, 3.5, H), mat(0xb3bac3, { rough: 0.8 }));
  c.position.set(d.x - W / 2 + 2.5, 1.75, 0);
  return c;
}

/* ---------- Сборка сцены ---------- */
const toWorld = (x, y) => [x - W / 2, y - H / 2];
function place(obj, d, rotDeg) {
  const [X, Z] = toWorld(d.x, d.y);
  obj.position.set(X, 0, Z);
  obj.rotation.y = -(rotDeg || 0) * Math.PI / 180;
  return obj;
}
function contactShadow(w, l) {
  /* мягкая «контактная тень» под машиной — как AO в Layerwise, только дешевле */
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 4, 32, 32, 32);
  gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.15; return m;
}

async function groundTexture(svgEl) {
  const clone = svgEl.cloneNode(true);
  clone.querySelectorAll("[data-o],[data-fx]").forEach(n => n.remove());
  clone.removeAttribute("class");
  clone.setAttribute("width", 1600); clone.setAttribute("height", 1200);
  const text = new XMLSerializer().serializeToString(clone);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text); });
  const c = document.createElement("canvas"); c.width = 1600; c.height = 1200;
  const cx = c.getContext("2d");
  /* под студийным светом пастельная «земля» выцветает — чуть насыщеннее и темнее */
  if ("filter" in cx) cx.filter = "saturate(1.45) brightness(0.94)";
  cx.drawImage(img, 0, 0, 1600, 1200);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function backdropTexture(night) {
  const c = document.createElement("canvas"); c.width = 4; c.height = 256;
  const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256);
  if (night) { g.addColorStop(0, "#0d1626"); g.addColorStop(1, "#1d2738"); }
  else { g.addColorStop(0, "#eef1f5"); g.addColorStop(1, "#c7ced7"); }
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

async function build(svgEl) {
  const fxKinds = [...svgEl.querySelectorAll("[data-fx]")].map(n => n.getAttribute("data-fx"));
  const night = fxKinds.includes("night"), dusk = fxKinds.includes("dusk");
  const scene = new THREE.Scene();
  const world = new THREE.Group(); scene.add(world);
  const tilt = fxKinds.includes("tilt-down") ? -7 : fxKinds.includes("tilt-up") ? 7 : 0;
  scene.environment = ENV;
  scene.environmentIntensity = night ? 0.1 : dusk ? 0.4 : 0.55;
  scene.background = backdropTexture(night);

  /* плита-диорама: сверху схема, по бокам срез грунта */
  const SLAB = 14;
  const groundTex = await groundTexture(svgEl);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: groundTex, roughness: fxKinds.includes("rain") ? 0.35 : 0.88, metalness: 0 }));
  top.rotation.x = -Math.PI / 2; top.receiveShadow = true; world.add(top);
  const side = new THREE.Mesh(new THREE.BoxGeometry(W, SLAB, H), [mat(0x6d6a5f), mat(0x6d6a5f), mat(0x6d6a5f), mat(0x6d6a5f), mat(0x6d6a5f), mat(0x5f5c52)]);
  side.position.y = -SLAB / 2 - 0.05; side.receiveShadow = true; world.add(side);
  const sc = document.createElement("canvas"); sc.width = 128; sc.height = 96;
  { const x = sc.getContext("2d"); x.filter = "blur(10px)"; x.fillStyle = night ? "rgba(0,0,0,0.6)" : "rgba(20,30,45,0.32)"; x.fillRect(18, 16, 92, 70); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.4, H * 1.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(14, -SLAB - 0.1, 18); scene.add(floor);

  /* свет: мягкий ключ с тенью сзади-слева-сверху + небо/земля; ночью — луна и фары */
  const hemi = new THREE.HemisphereLight(night ? 0x3a4f86 : dusk ? 0x9aa3d6 : 0xf2f6ff, night ? 0x0b0f18 : 0x8a8f7e, night ? 0.45 : dusk ? 0.6 : 0.55); scene.add(hemi);
  const key = new THREE.DirectionalLight(night ? 0x8fa8ff : dusk ? 0xffc9a0 : 0xfff1dc, night ? 0.3 : dusk ? 0.75 : 1.65);
  key.position.set(-160, 320, -120); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -260, right: 260, top: 220, bottom: -220, near: 10, far: 900 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6; key.shadow.radius = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd4e6ff, night ? 0.05 : 0.3); fill.position.set(220, 140, 260); scene.add(fill);

  /* объекты */
  const ui = [];
  const objs = [...svgEl.querySelectorAll("[data-o]")];
  for (const el of objs) {
    let d; try { d = JSON.parse(el.getAttribute("data-o")); } catch (e) { continue; }
    if (d.t === "ui") { ui.push({ d, el }); continue; }
    let o = null;
    if (d.t === "veh") {
      o = place(vehicle3d(d), d, d.rot);
      const big = d.kind === "truck" || d.kind === "bus" || d.kind === "tram";
      if (d.kind !== "bike" && d.kind !== "scooter") { const cs = contactShadow(big ? 30 : 28, big ? (d.kind === "tram" ? 100 : 80) : 50); o.add(cs); }
      if (d.beams || night) {
        const sp = new THREE.SpotLight(0xfff1c8, night ? (d.beams === "high" ? 9000 : 5000) : 0, d.beams === "high" ? 260 : 160, d.beams === "high" ? 0.42 : 0.5, 0.6, 1.6);
        sp.position.set(0, 7, -21); sp.target.position.set(0, 0, d.beams === "high" ? -150 : -90); o.add(sp); o.add(sp.target);
      }
    }
    else if (d.t === "person") o = place(person3d(d), d, d.rot);
    else if (d.t === "moose" || d.t === "horse" || d.t === "sheep") { o = place(animal(d), d, d.rot); o.scale.setScalar(1.25); }
    else if (d.t === "tunnel") o = tunnel3d(d);
    else if (d.t === "tunnelWalls") o = tunnelWalls3d(d);
    else if (d.t === "bridge") o = bridge3d(d);
    else if (d.t === "curb") o = curb3d(d);
    else if (d.t === "tree") o = place(tree3d(d), d, 0);
    else if (d.t === "house") o = house3d(d);
    else if (d.t === "cone") { o = place(cone3d(), d, 0); o.scale.setScalar(1.35); }
    else if (d.t === "post") { o = place(post3d(), d, 0); o.scale.setScalar(1.3); }
    else if (d.t === "triangle") o = place(triangle3d(), d, 0);
    else if (d.t === "sign") o = place(await sign3d(d, el), d, 0);
    else if (d.t === "light") o = place(light3d(d), d, 0);
    else if (d.t === "raillight") o = place(raillight3d(d), d, 0);
    else if (d.t === "train") { const hd = (d.dir > 0 ? 90 : 270) + (d.rot || 0); o = place(train3d(d), d, hd); const a = hd * Math.PI / 180; o.position.x += Math.sin(a) * 20; o.position.z -= Math.cos(a) * 20; }
    if (o) world.add(o);
  }

  world.rotation.x = tilt * Math.PI / 180;
  world.updateMatrixWorld(true);
  if (tilt) floor.position.y -= 30;
  /* камера: спереди-сверху, плита целиком в кадре */
  const cam = new THREE.PerspectiveCamera(22, OUT_W / OUT_H, 10, 6000);
  const el = 50 * Math.PI / 180, target = new THREE.Vector3(0, -6, 6);
  const corners = [[-W / 2, 0, -H / 2], [W / 2, 0, -H / 2], [-W / 2, 0, H / 2], [W / 2, 0, H / 2], [-W / 2, -SLAB, H / 2], [W / 2, -SLAB, H / 2]].map(p => world.localToWorld(new THREE.Vector3(...p)));
  let dist = 700;
  for (let i = 0; i < 30; i++) {
    cam.position.set(0, target.y + Math.sin(el) * dist, target.z + Math.cos(el) * dist); cam.lookAt(target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let m = 0; corners.forEach(c => { const p = c.clone().project(cam); m = Math.max(m, Math.abs(p.x) / 1.04, Math.abs(p.y) / 0.97); });
    dist *= m;
  }
  cam.position.set(0, target.y + Math.sin(el) * dist, target.z + Math.cos(el) * dist); cam.lookAt(target); cam.updateMatrixWorld();
  return { scene, cam, ui, fxKinds, world };
}

function dispose(scene) {
  scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && !Array.isArray(o.material) && o.material.map && !texCache.size) o.material.map.dispose(); });
}

/* Рендер одной схемы → новая <svg> с картинкой и чёткими подписями поверх */
async function render3d(svgEl) {
  const src = svgEl.outerHTML;
  if (cache.has(src)) return cache.get(src);
  const job = (async () => {
    const r = renderer();
    const { scene, cam, ui, fxKinds, world } = await build(svgEl);
    r.render(scene, cam);
    const url = r.domElement.toDataURL("image/jpeg", 0.9);
    /* подписи и буквы — в точки проекции */
    const over = ui.map(({ d, el }) => {
      const p = world.localToWorld(new THREE.Vector3(d.x - W / 2, d.z || 0, d.y - H / 2)).project(cam);
      const px = (p.x + 1) / 2 * W, py = (1 - p.y) / 2 * H;
      return `<g transform="translate(${(px - d.x).toFixed(1)} ${(py - d.y).toFixed(1)})">${el.innerHTML}</g>`;
    }).join("");
    const fx = [...svgEl.querySelectorAll("[data-fx]")].filter(n => ["rain", "snow", "fog", "sun", "lowsun"].includes(n.getAttribute("data-fx"))).map(n => n.outerHTML).join("");
    dispose(scene);
    const label = svgEl.getAttribute("aria-label");
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="scene-icon scene-3d" data-3d-done="1"${label ? ` aria-label="${label}"` : ""}>` +
      `<image href="${url}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>${fx}${over}</svg>`;
  })();
  cache.set(src, job);
  try { return await job; } catch (e) { cache.delete(src); throw e; }
}

/* ---------- Подмена схем на странице ---------- */
const queue = [];
let busy = false;
async function pump() {
  if (busy) return; busy = true;
  while (queue.length) {
    const el = queue.shift();
    if (!el.isConnected || el.dataset.threeBusy) continue;
    el.dataset.threeBusy = "1";
    try {
      const html = await render3d(el);
      if (el.isConnected) {
        const tmp = document.createElement("div"); tmp.innerHTML = html;
        el.replaceWith(tmp.firstElementChild);
      }
    } catch (e) {
      console.warn("3D-схема не построилась, остаётся плоская", e);
      el.setAttribute("data-3d-done", "flat");
      if (!R) { failed = true; queue.length = 0; document.documentElement.classList.remove("has-3d"); }
    }
    await new Promise(r => setTimeout(r, 0));
  }
  busy = false;
}
function scan(root) {
  if (failed || window.SCENES_3D === false) return;
  (root.querySelectorAll ? root : document).querySelectorAll("svg.scene-icon[data-3d]:not([data-3d-done])").forEach(el => {
    if (!queue.includes(el)) queue.push(el);
  });
  pump();
}
function supported() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}
if (supported() && window.SCENES_3D !== false) {
  document.documentElement.classList.add("has-3d");
  window.SCENE3D = { render3d, scan };
  new MutationObserver(muts => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) { scan(n.matches && n.matches("svg") ? n.parentNode || document : n); } })
    .observe(document.documentElement, { childList: true, subtree: true });
  scan(document);
}
