// WHY DOES THE BOMBARDIER BEETLE NOT COOK ITSELF? : paper cut-out animation.
// One subject: a bombardier beetle drawn in layered cut paper (ridged blue-black wing covers, orange thorax and head,
// jointed legs, antennae), a big cutaway of its abdomen (storage pouch, valve, reaction chamber, nozzle), a jet of steam.
import { ctx, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';

const SERIF = 'Caladea';
const R2 = (i) => { const v = Math.sin(i * 91.7 + 17.3) * 43758.5453; return v - Math.floor(v); };

// ── paper pieces ───────────────────────────────────────────────────────────
let PAT = null;
function paperPattern() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? '255,255,255' : '60,40,20'},${0.08 + rnd(i + 1) * 0.12})`; g.fillRect(rnd(i + 2) * 256, rnd(i + 3) * 256, 1 + rnd(i + 4) * 2, 1 + rnd(i + 5) * 2); }
  g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x0 = rnd(i + 9) * 256, y0 = rnd(i + 19) * 256; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + 10 + rnd(i) * 30, y0 + (rnd(i + 7) - 0.5) * 8); g.stroke(); }
  return ctx.createPattern(c, 'repeat');
}
function piece(p, fill, sh = 1, edge = true) {
  if (!PAT) PAT = paperPattern();
  ctx.save(); if (sh) { ctx.shadowColor = 'rgba(40,25,10,0.42)'; ctx.shadowBlur = 16 * sh; ctx.shadowOffsetX = 5 * sh; ctx.shadowOffsetY = 9 * sh; } ctx.fillStyle = fill; ctx.fill(p); ctx.restore();
  ctx.save(); ctx.clip(p); ctx.fillStyle = PAT; ctx.globalAlpha = 0.9; ctx.fill(p); ctx.restore();
  if (edge) { ctx.save(); ctx.strokeStyle = 'rgba(255,250,240,0.40)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(p); ctx.restore(); }
}
const RR = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
const CIR = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
const ELL = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
const POLY = (pts) => { const p = new Path2D(); pts.forEach(([a, b], i) => (i ? p.lineTo(a, b) : p.moveTo(a, b))); p.closePath(); return p; };
function stroke(pts, col, w, close = false) { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); if (close) ctx.closePath(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function pin(x, y, r = 9) { ctx.fillStyle = '#B8902F'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#E9C96A'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); ctx.fill(); }
function label(text, x, y, sc = 1, rot = -0.04, size = 52, fill = '#FBF6E8', col = '#3A2A1E') {
  if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.font = `700 ${size}px ${SERIF}`;
  const w = ctx.measureText(text).width + 60, p = new Path2D(); p.moveTo(-w / 2, -size * 0.8); for (let i = 0; i <= 10; i++) p.lineTo(-w / 2 + w * i / 10, -size * 0.8 + (rnd(i + text.length) - 0.5) * 8); p.lineTo(w / 2, size * 0.8); for (let i = 10; i >= 0; i--) p.lineTo(-w / 2 + w * i / 10, size * 0.8 + (rnd(i + 30) - 0.5) * 8); p.closePath();
  piece(p, fill, 0.7); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 4); pin(0, -size * 0.8 + 6, 7); ctx.restore();
}
const view = (cx, cy, z) => { ctx.translate(540, 820); ctx.scale(z, z); ctx.translate(-cx, -cy); };
const lrp = (a, b, k) => a + (b - a) * k;

// ── backgrounds ────────────────────────────────────────────────────────────
function leafBG(t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.dark ? '#3A3A22' : '#8F8A4A'); g.addColorStop(0.5, o.dark ? '#4A3A22' : '#8A6A3A'); g.addColorStop(1, '#4A3620');
  ctx.fillStyle = g; ctx.fillRect(-700, -700, W + 1400, H + 1400);
  if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = PAT; ctx.fillRect(-700, -700, W + 1400, H + 1400); ctx.restore();
  // far layer: big soft leaves
  ctx.save(); ctx.globalAlpha = 0.5;
  for (let i = 0; i < 9; i++) { const x = -100 + R2(i) * 1300, y = -100 + R2(i + 3) * 2100; ctx.save(); ctx.translate(x + Math.sin(t * 0.3 + i) * 14, y); ctx.rotate(R2(i + 5) * 3); piece(ELL(0, 0, 150 + R2(i + 2) * 90, 70 + R2(i + 7) * 40), i % 2 ? '#6E7A38' : '#9A7A3A', 0, false); stroke([[-120, 0], [120, 0]], 'rgba(40,30,10,0.25)', 5); ctx.restore(); }
  ctx.restore();
  // light shafts
  ctx.save(); ctx.globalAlpha = 0.10; for (let i = 0; i < 4; i++) { ctx.fillStyle = '#FFF6C8'; ctx.beginPath(); ctx.moveTo(60 + i * 300 + Math.sin(t * 0.4 + i) * 40, -600); ctx.lineTo(220 + i * 300, -600); ctx.lineTo(0 + i * 260, H + 600); ctx.lineTo(-180 + i * 260, H + 600); ctx.fill(); } ctx.restore();
  // near layer: dark leaf litter and grass blades at the bottom corners
  for (let i = 0; i < 14; i++) { const x = R2(i + 40) * 1100, y = 1500 + R2(i + 50) * 500; ctx.save(); ctx.translate(x, y); ctx.rotate(R2(i + 60) * 3); piece(ELL(0, 0, 90 + R2(i) * 80, 36 + R2(i + 1) * 24), i % 3 ? '#5A3E1E' : '#6A5A24', 0.6); stroke([[-70, 0], [70, 0]], 'rgba(20,10,0,0.3)', 4); ctx.restore(); }
  for (let i = 0; i < 12; i++) { const x = (i % 2 ? 1 : 0) * 1080 + (i % 2 ? -1 : 1) * R2(i + 80) * 220, h = 340 + R2(i + 90) * 380; const p = new Path2D(); p.moveTo(x - 26, H + 40); p.quadraticCurveTo(x + (i % 2 ? -1 : 1) * 40 + Math.sin(t + i) * 12, H - h * 0.6, x + (i % 2 ? -1 : 1) * 90 + Math.sin(t * 1.2 + i) * 18, H - h); p.quadraticCurveTo(x + 20, H - h * 0.5, x + 26, H + 40); p.closePath(); piece(p, i % 3 ? '#3E5A24' : '#4E6E2C', 0.8); }
  // drifting dust and pollen
  for (let i = 0; i < 36; i++) { const px = (R2(i) * 1200 + t * 10 * (R2(i + 1) - 0.3)) % 1200, py = ((R2(i + 2) * 2000 - t * 14) % 2000 + 2000) % 2000; piece(CIR(px - 60, py - 40, 2 + R2(i + 3) * 4), 'rgba(255,240,180,0.45)', 0, false); }
}
function plain(col) { ctx.fillStyle = col; ctx.fillRect(-700, -700, W + 1400, H + 1400); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = PAT; ctx.fillRect(-700, -700, W + 1400, H + 1400); ctx.restore(); }
function labBG(t, col = '#1E2A36') {
  plain(col);
  for (let i = 0; i < 6; i++) { const left = i % 2 === 0, x = left ? -60 : W + 60, y = 150 + i * 300, p = new Path2D(); p.moveTo(x, y - 160); for (let k = 0; k <= 8; k++) p.lineTo(x + (left ? 1 : -1) * (150 + 60 * Math.sin(k + i) + 30 * R2(k + i * 7)), y - 160 + k * 40); p.lineTo(x, y + 180); p.closePath(); piece(p, i % 3 === 0 ? '#3A3050' : i % 3 === 1 ? '#322A46' : '#40365A', 1.2); } ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
  for (let i = -2; i < 14; i++) { ctx.beginPath(); ctx.moveTo(i * 100, -100); ctx.lineTo(i * 100, H + 100); ctx.stroke(); }
  for (let i = -2; i < 22; i++) { ctx.beginPath(); ctx.moveTo(-100, i * 100); ctx.lineTo(W + 100, i * 100); ctx.stroke(); } ctx.restore();
  for (let i = 0; i < 30; i++) { const px = (R2(i) * 1200 + t * 6) % 1200, py = ((R2(i + 2) * 2000 - t * 10) % 2000 + 2000) % 2000; piece(CIR(px - 60, py - 40, 2 + R2(i + 3) * 3), 'rgba(160,220,255,0.35)', 0, false); }
}

// ── the beetle (side view, faces right, tail at -x; origin = middle of the wing covers) ───────────────────────
const BCOL = { elyA: '#34568A', elyB: '#101D38', orange: '#E8742E', orangeD: '#B94E1A', head: '#C9531F', leg: '#D9843A', legD: '#7A3A12' };
function leg(ax, ay, a1, a2, a3, w, far) {
  const col = far ? '#A4642A' : BCOL.leg, dark = far ? '#4E2408' : BCOL.legD;
  const L1 = 92, L2 = 118, L3 = 70;
  const p1 = [ax + Math.cos(a1) * L1, ay + Math.sin(a1) * L1], p2 = [p1[0] + Math.cos(a2) * L2, p1[1] + Math.sin(a2) * L2], p3 = [p2[0] + Math.cos(a3) * L3, p2[1] + Math.sin(a3) * L3];
  stroke([[ax, ay], p1], dark, w + 7); stroke([[ax, ay], p1], col, w);
  stroke([p1, p2], dark, w * 0.8 + 7); stroke([p1, p2], col, w * 0.8);
  stroke([p2, p3], dark, w * 0.55 + 6); stroke([p2, p3], col, w * 0.55);
  for (let k = 1; k <= 4; k++) { const u = k / 5, sx = lrp(p1[0], p2[0], u), sy = lrp(p1[1], p2[1], u); stroke([[sx, sy], [sx + Math.cos(a2 + 1.2) * 14, sy + Math.sin(a2 + 1.2) * 14]], dark, 3); } // shin spines
  ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(p1[0], p1[1], w * 0.55, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p1[0] - 2, p1[1] - 2, w * 0.35, 0, TAU); ctx.fill();
  stroke([p3, [p3[0] + 22, p3[1] + 8]], dark, 6); stroke([p3, [p3[0] + 8, p3[1] + 20]], dark, 6);
}
/** o: { t, walk 0..1, rot, flip } */
function beetle(x, y, s, o = {}) {
  const t = o.t || 0, w = o.walk || 0, ph = (i) => Math.sin(t * 9 * w + i * 2.1) * 0.28 * w;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  // far legs (darker)
  [[70, 40, 0], [140, 44, 1], [195, 40, 2]].forEach(([ax, ay, i]) => leg(ax - 20 + 14 * i, ay - 6, 1.25 + ph(i + 3), 1.95 + ph(i + 3) * 0.6, 1.5, 16, true));
  // abdomen tip (orange segments) peeking out behind the wing covers, ending in a dark nozzle
  piece(POLY([[-150, 4], [-236, 12], [-270, -2], [-262, -26], [-150, -46]]), BCOL.orange, 0.8);
  piece(ELL(-200, -10, 60, 30, 0.1), '#F08A3E', 0, false);
  for (let i = 0; i < 4; i++) stroke([[-176 - i * 24, -36 + i * 5], [-176 - i * 24 + 8, 6 + i * 2]], BCOL.orangeD, 5);
  piece(ELL(-268, -10, 13, 16), '#3A1A0C', 0.3, false); piece(ELL(-272, -11, 6, 8), '#120804', 0, false);
  // wing covers (elytra): blue-black, ridged, glossy
  const el = new Path2D(); el.moveTo(-182, 24); el.bezierCurveTo(-198, -74, -96, -122, 20, -116); el.bezierCurveTo(106, -112, 144, -52, 132, 24); el.bezierCurveTo(60, 56, -80, 58, -182, 24); el.closePath();
  ctx.save(); ctx.translate(-8, 9); piece(el, '#0A1426', 0.2, false); ctx.restore();
  ctx.save(); ctx.translate(-18, 20); ctx.rotate(0.06); piece(POLY([[-120, 10], [-210, 34], [-190, 52], [-60, 50]]), 'rgba(210,200,170,0.55)', 0.3, false); ctx.restore();
  const gr = ctx.createLinearGradient(0, -120, 0, 56); gr.addColorStop(0, BCOL.elyA); gr.addColorStop(1, BCOL.elyB);
  piece(el, gr, 1.1);
  ctx.save(); ctx.clip(el);
  for (let i = 1; i <= 6; i++) { const yy = -112 + i * 24; ctx.beginPath(); ctx.moveTo(-200, yy + 34); ctx.bezierCurveTo(-90, yy - 8, 30, yy - 12, 140, yy + 4); ctx.strokeStyle = i % 2 ? 'rgba(10,20,40,0.55)' : 'rgba(140,180,240,0.22)'; ctx.lineWidth = i % 2 ? 6 : 3; ctx.stroke(); }
  for (let i = 0; i < 70; i++) piece(CIR(-190 + R2(i) * 330, -110 + R2(i + 7) * 160, 1.5 + R2(i + 11) * 2), 'rgba(160,200,255,0.22)', 0, false);
  piece(ELL(-20, -74, 120, 20, -0.05), 'rgba(255,255,255,0.22)', 0, false);
  stroke([[-182, 24], [60, 52], [132, 22]], 'rgba(0,0,0,0.35)', 8);
  ctx.restore();
  // thorax shield (pronotum) with shading and highlight
  piece(ELL(168, -22, 62, 68, -0.1), BCOL.orange, 1);
  piece(ELL(190, -4, 40, 48, -0.1), BCOL.orangeD, 0, false); piece(ELL(160, -50, 30, 14, -0.4), 'rgba(255,230,180,0.5)', 0, false);
  stroke([[130, -20], [200, -14]], 'rgba(120,40,10,0.5)', 5);
  // head, eye, mandibles
  piece(ELL(240, 4, 48, 42, 0.1), BCOL.head, 1);
  piece(CIR(258, -12, 17), '#1B1210', 0.3, false); piece(CIR(252, -19, 5), '#FFFFFF', 0, false); piece(CIR(262, -6, 2.5), 'rgba(255,255,255,0.5)', 0, false);
  const open = o.jaw || 0;
  ctx.save(); ctx.translate(280, 20); ctx.rotate(-0.2 - open * 0.5); piece(POLY([[0, -6], [34, 6], [4, 16]]), '#4A1E0C', 0.3, false); ctx.restore();
  ctx.save(); ctx.translate(276, 30); ctx.rotate(0.2 + open * 0.5); piece(POLY([[0, -6], [34, -2], [2, 12]]), '#3A160A', 0.3, false); ctx.restore();
  // antennae: 9 beaded segments
  for (const [ph0, a0] of [[0, -0.9], [1.4, -0.55]]) {
    let px = 262, py = -34, a = a0 + Math.sin(t * 2.4 + ph0) * 0.14;
    for (let k = 0; k < 9; k++) { const nx = px + Math.cos(a) * 30, ny = py + Math.sin(a) * 30; stroke([[px, py], [nx, ny]], '#5A2410', 6 - k * 0.3); piece(CIR(nx, ny, 5.5 - k * 0.2), BCOL.leg, 0, false); px = nx; py = ny; a += 0.11 + Math.sin(t * 2.4 + ph0 + k * 0.4) * 0.03; }
  }
  // near legs
  [[70, 44, 0], [140, 48, 1], [195, 44, 2]].forEach(([ax, ay, i]) => leg(ax, ay, 1.0 + ph(i), 1.75 + ph(i) * 0.6, 1.45, 19, false));
  ctx.restore();
}
/** world position of a point in the beetle's local coordinates */
function bpt(B, lx, ly) { const c = Math.cos(B.rot || 0), sn = Math.sin(B.rot || 0); return [B.x + (lx * c - ly * sn) * B.s, B.y + (lx * sn + ly * c) * B.s]; }
const NOZ = [-276, -11];

// ── an ant ────────────────────────────────────────────────────────────────
function ant(x, y, s, rot = 0, o = {}) {
  const t = o.t || 0, w = o.walk || 0, sh = o.shake || 0;
  ctx.save(); ctx.translate(x + Math.sin(t * 70) * 6 * sh, y + Math.cos(t * 60) * 5 * sh); ctx.rotate(rot); ctx.scale(s, s); if (o.alpha != null) ctx.globalAlpha = o.alpha;
  const C1 = '#6A2A18', C2 = '#3E160C';
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
    const bx = -10 + i * 38, sw = Math.sin(t * 12 * w + i * 2.2 + (sd > 0 ? 1.6 : 0)) * 14 * w;
    const k1 = [bx + (i - 1) * 30 + sw, sd * 70], k2 = [bx + (i - 1) * 55 + sw * 1.3, sd * 125];
    stroke([[bx, 0], k1, k2], C2, 16); stroke([[bx, 0], k1, k2], '#8A3C22', 10); piece(CIR(k1[0], k1[1], 9), C2, 0, false); stroke([k2, [k2[0] + 18, k2[1] + sd * 26]], C2, 8);
  }
  piece(ELL(-118, 0, 78, 54), C1, 1); piece(ELL(-130, -14, 40, 18, -0.2), 'rgba(255,200,170,0.28)', 0, false);
  for (let i = 0; i < 4; i++) stroke([[-160 + i * 26, -48], [-150 + i * 26, 46]], 'rgba(30,8,4,0.35)', 4);
  piece(ELL(-36, 0, 30, 22), '#7A3220', 0.8); piece(ELL(0, 0, 36, 28), C1, 0.9);
  piece(ELL(78, -2, 44, 36), '#7A3220', 1);
  piece(CIR(92, -18, 12), '#120806', 0.2, false); piece(CIR(88, -23, 4), '#FFFFFF', 0, false);
  const op = (o.jaw || 0);
  ctx.save(); ctx.translate(114, 6); ctx.rotate(-0.3 - op * 0.4); piece(POLY([[0, -4], [40, 8], [2, 12]]), '#2A0E06', 0.2, false); ctx.restore();
  ctx.save(); ctx.translate(114, 14); ctx.rotate(0.3 + op * 0.4); piece(POLY([[0, -6], [40, -4], [2, 8]]), '#2A0E06', 0.2, false); ctx.restore();
  for (const sd of [-1, 1]) { const an = [[100, sd * 20], [140, sd * 60 + Math.sin(t * 3 + sd) * 8], [186, sd * 56 + Math.sin(t * 3 + sd) * 14]]; stroke([[104, sd * 14], ...an.slice(0)], '#3E160C', 6); }
  ctx.restore();
}

// ── hot jet: a stream of steam puffs from (x,y) in direction ang ──────────────
function jet(x, y, ang, len, t, k = 1, o = {}) {
  if (k <= 0) return; const pulse = o.pulse || 0, n = 30;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  for (let i = n - 1; i >= 0; i--) {
    const u = (i / n), life = ((t * (o.speed || 1.6) + u) % 1), d = life * len * k, r = (22 + life * 100) * (o.fat || 1);
    const wob = Math.sin(life * 9 + i) * 16 * life, a = (1 - life * 0.8) * 0.95 * clamp(k * 1.5);
    let m = 1; if (pulse) m = Math.sin(life * pulse - t * 40) > 0.2 ? 1 : 0;
    ctx.globalAlpha = a * m;
    ctx.fillStyle = life < 0.25 ? '#FFB347' : life < 0.5 ? '#FFE6B0' : '#F4F4F0'; ctx.beginPath(); ctx.arc(d, wob, r, 0, TAU); ctx.fill();
    ctx.globalAlpha = a * m * 0.5; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(d - r * 0.25, wob - r * 0.25, r * 0.45, 0, TAU); ctx.fill();
  }
  // hot droplets
  ctx.globalAlpha = 1; for (let i = 0; i < 16; i++) { const life = ((t * 2.2 + R2(i)) % 1), d = life * len * k * (0.7 + R2(i + 1) * 0.5), yy = (R2(i + 2) - 0.5) * 140 * life; ctx.globalAlpha = (1 - life); piece(CIR(d, yy, 4 + R2(i + 3) * 4), '#FFD27A', 0, false); }
  ctx.restore(); ctx.globalAlpha = 1;
}
function steamPuffs(x, y, t, k = 1, n = 6, sc = 1) { if (k <= 0) return; for (let i = 0; i < n; i++) { const life = (t * 0.7 + i / n) % 1; ctx.save(); ctx.globalAlpha = (1 - life) * 0.8 * k; piece(CIR(x + Math.sin(life * 6 + i) * 30 * sc, y - life * 220 * sc, (26 + life * 50) * sc), '#F6F2EA', 0, false); ctx.restore(); } }
function starburst(x, y, s, col = '#F2C14E', rot = 0) { if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); const p = new Path2D(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 50 : 100; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); } p.closePath(); piece(p, col, 0.8); ctx.restore(); }

// ── cutaway of the abdomen (tail points right) ─────────────────────────────
/** o: { t, valve 0..1, drops 0..1 (drops travelling to the chamber), react 0..1 (heat), fill 0..1 (chamber liquid), cool 0..1, empty } */
function cutaway(x, y, s, o = {}) {
  const t = o.t || 0, react = o.react || 0, cool = o.cool || 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  // outer shell: layered cuticle
  const body = new Path2D(); body.moveTo(-440, -10); body.bezierCurveTo(-450, -260, -150, -300, 100, -270); body.bezierCurveTo(300, -250, 420, -160, 490, -40); body.lineTo(500, 30); body.bezierCurveTo(420, 190, 300, 290, 100, 290); body.bezierCurveTo(-160, 300, -450, 250, -440, -10); body.closePath();
  piece(body, '#2A4170', 1.2);
  const inner = new Path2D(); inner.moveTo(-410, -8); inner.bezierCurveTo(-416, -232, -150, -268, 100, -240); inner.bezierCurveTo(290, -222, 400, -140, 462, -32); inner.lineTo(470, 26); inner.bezierCurveTo(400, 170, 290, 258, 100, 258); inner.bezierCurveTo(-150, 268, -416, 226, -410, -8); inner.closePath();
  piece(inner, '#F3D8A4', 0.2, false);
  ctx.save(); ctx.clip(inner); for (let i = 0; i < 30; i++) piece(CIR(-400 + R2(i) * 860, -250 + R2(i + 5) * 520, 8 + R2(i + 9) * 22), 'rgba(200,150,90,0.16)', 0, false); ctx.restore();
  // muscle bands around the pouch
  // storage pouch (reservoir): big, pale, with glossy bubbles of the stored mix
  const pouch = new Path2D(); pouch.moveTo(-370, -20); pouch.bezierCurveTo(-380, -190, -130, -200, -50, -130); pouch.bezierCurveTo(10, -70, 0, 90, -60, 150); pouch.bezierCurveTo(-140, 220, -370, 170, -370, -20); pouch.closePath();
  piece(pouch, '#F4E58C', 0.8); ctx.save(); ctx.clip(pouch); const sq = o.squeeze || 0;
  for (let i = 0; i < 22; i++) { const bx = -340 + R2(i + 20) * 320, by = -140 + R2(i + 30) * 280 + Math.sin(t * 2 + i) * 6; piece(CIR(bx, by, 10 + R2(i + 40) * 20 - sq * 4), 'rgba(255,250,200,0.55)', 0, false); }
  piece(ELL(-250, -90, 80, 24, -0.4), 'rgba(255,255,255,0.4)', 0, false);
  if (sq) { ctx.fillStyle = `rgba(210,150,40,${0.25 * sq})`; ctx.fillRect(-400, -220, 420, 450); }
  ctx.restore();
  // duct with a valve flap
  piece(RR(-60, -12, 210, 38, 19), '#E9B6A0', 0.5); piece(RR(-48, -4, 190, 22, 11), '#F8D96A', 0, false);
  ctx.save(); ctx.translate(40, 6); ctx.rotate(-o.valve * 1.2 || 0); piece(RR(-6, -34, 14, 70, 7), '#8A4A22', 0.4); ctx.restore(); pin(40, 6, 8);
  // drops travelling through the duct into the chamber
  if (o.drops) for (let i = 0; i < 4; i++) { const u = ((o.drops * 1.4 + i * 0.27) % 1); piece(CIR(-50 + u * 230, 6, 11), '#F2C030', 0.3, false); }
  // reaction chamber: SMALL, thick tough wall (rings), enzymes inside
  const cx = 250, cy = 6;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1.2, 1.2);
  piece(CIR(0, 0, 116), '#5A2A14', 1); piece(CIR(0, 0, 104), '#8A4A22', 0, false); piece(CIR(0, 0, 90), '#B4743A', 0, false); piece(CIR(0, 0, 74), '#F6E0B8', 0, false);
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; stroke([[Math.cos(a) * 80, Math.sin(a) * 80], [Math.cos(a) * 112, Math.sin(a) * 112]], 'rgba(60,24,8,0.35)', 3); }
  ctx.save(); ctx.clip(CIR(0, 0, 74));
  if (o.fill) { ctx.fillStyle = '#F2C030'; ctx.fillRect(-80, 74 - 150 * o.fill, 160, 160); }
  if (react > 0) { const gq = ctx.createRadialGradient(0, 0, 4, 0, 0, 76); gq.addColorStop(0, `rgba(255,250,200,${react})`); gq.addColorStop(0.5, `rgba(255,140,40,${react * 0.95})`); gq.addColorStop(1, `rgba(220,50,20,${react})`); ctx.fillStyle = gq; ctx.fillRect(-80, -80, 160, 160); for (let i = 0; i < 12; i++) { const a = R2(i) * TAU + t * 3; piece(CIR(Math.cos(a) * (10 + R2(i + 1) * 50), Math.sin(a) * (10 + R2(i + 2) * 50), 5 + R2(i + 3) * 8), 'rgba(255,255,235,0.8)', 0, false); } }
  if (cool > 0) { ctx.fillStyle = `rgba(120,200,255,${0.4 * cool})`; ctx.fillRect(-80, -80, 160, 160); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.4; piece(CIR(Math.cos(a) * 36 * (0.5 + R2(i) * 0.7), Math.sin(a) * 36 * (0.5 + R2(i) * 0.7), 6), '#2E8A7A', 0, false); piece(CIR(Math.cos(a) * 36 * (0.5 + R2(i) * 0.7) - 2, Math.sin(a) * 36 * (0.5 + R2(i) * 0.7) - 2, 2), '#B4F0E0', 0, false); }
  ctx.restore();
  if (cool > 0) for (let i = 0; i < 3; i++) { const life = (t * 1.5 + i / 3) % 1; ctx.save(); ctx.globalAlpha = (1 - life) * cool; ctx.strokeStyle = '#8AD8FF'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 116 + life * 50, 0, TAU); ctx.stroke(); ctx.restore(); }
  if (react > 0.4) for (let i = 0; i < 3; i++) { const life = (t * 2 + i / 3) % 1; ctx.save(); ctx.globalAlpha = (1 - life) * react * 0.7; ctx.strokeStyle = '#FF6A2A'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 116 + life * 60, 0, TAU); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  // exit tube to the tail tip, with the dark nozzle
  piece(RR(380, -22, 120, 56, 20), '#5A2A14', 0.8); piece(RR(380, -10, 120, 32, 14), react > 0.3 ? '#FF9A3A' : '#F6E0B8', 0, false); piece(ELL(498, 6, 14, 26), '#120804', 0.3, false);
  ctx.restore();
}
function thermo(x, y, s, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(RR(-38, -330, 76, 560, 38), '#F4ECD8', 1); piece(RR(-18, -300, 36, 500, 18), '#CFC8B4', 0, false);
  piece(CIR(0, 250, 70), '#F4ECD8', 1); piece(CIR(0, 250, 54), '#D62839', 0, false);
  const h = 500 * k; piece(RR(-18, 200 - h, 36, h + 50, 18), '#D62839', 0, false);
  for (let i = 0; i <= 10; i++) { stroke([[38, 200 - i * 50], [i % 5 ? 62 : 84, 200 - i * 50]], '#5A4420', 5); }
  ctx.fillStyle = '#E8DAC0'; ctx.font = `700 64px ${SERIF}`; ctx.textAlign = 'left'; ctx.fillText('100', 96, -300 + 22); ctx.fillText('0', 96, 200 + 20);
  piece(CIR(-8, 240, 14), 'rgba(255,255,255,0.45)', 0, false);
  ctx.restore();
}
function xrayBeam(x, y, t, k = 1) {
  // a paper X-ray lamp at the top-left sending a cyan fan of light down onto the beetle
  ctx.save(); ctx.globalAlpha = 0.28 * k; const g = ctx.createLinearGradient(x, y, x + 500, y + 900); g.addColorStop(0, 'rgba(140,240,255,0.9)'); g.addColorStop(1, 'rgba(140,240,255,0.05)'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 900, y + 700); ctx.lineTo(x + 100, y + 1000); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x - 40, y - 40); ctx.rotate(0.65); piece(RR(-100, -70, 200, 140, 24), '#6A7A8A', 1); piece(RR(-70, -40, 140, 80, 14), '#2A3440', 0, false); piece(CIR(80, 0, 30 + Math.sin(t * 8) * 3), '#8AF0FF', 0, false); ctx.restore();
}
function counterTag(n, x, y, sc) { label(String(n), x, y, sc, -0.03, 84, '#FBF6E8', '#C8322B'); }

// ═══════════════ BOMBARDIER BEETLE: shots ═══════════════
export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const WD = (w, i) => { try { return Wd(w, i); } catch (e) { return L(i) + 0.6; } };
  const at = (w, i) => WD(w, i) - cut(i);
  const tag = (lt, a, d = 0.25) => (lt > a ? eob(seg(lt, a, a + d)) : 0);
  const BB = { x: 600, y: 940, s: 1.32, rot: 1.0 };      // beetle with its tail up (the real defensive pose), head down-right
  const tailAng = Math.PI + BB.rot;                       // direction the jet leaves the nozzle

  // 1 · the hook: a beetle blasts a boiling jet at an ant. Frame 0 = the blast, tag already there.
  { const st = cut(0), bo = at('boiling', 0), re = at('rear', 0), co = at('cooking', 0);
    add({ id: 'S01', at: st, cam: [540, 800], zoom: 0.08, note: 'full frame: a big bombardier beetle with its tail in the air blasts a hot steaming jet at an ant, which reels back', draw(lt, d, t) {
      leafBG(t); const [nx, ny] = bpt(BB, NOZ[0], NOZ[1]);
      jet(nx, ny, tailAng, 460, t, 1, { pulse: 0, fat: 1.3 });
      ant(250 + lt * 6, 400 - lt * 4, 1.05, 0.95 + Math.sin(t * 20) * 0.04, { t, shake: 1, jaw: 1, walk: 0 });
      beetle(BB.x, BB.y, BB.s, { t, rot: BB.rot, walk: 0.2, jaw: 0.6 });
      starburst(300, 470, 0.55 + 0.08 * Math.sin(t * 24), '#FFD27A', t * 3);
      label('BOILING SPRAY', 700, 130, tag(lt, -0.3, 0.3), -0.04, 66, '#FBF6E8', '#C8322B');
      label('WHY NO BURNS?', 250, 880, tag(lt, 1.8), -0.03, 52, '#FBF6E8', '#C8322B');
    } });
    cue(st, 'slam', { gain: 0.5 }); cue(st + 0.9, 'sizzle', { dur: 2.0, gain: 0.25 }); cue(st + 1.8, 'pop', { gain: 0.35 }); cue(st + 3.4, 'tock', { gain: 0.3 }); }

  // 2 · the name, and it blasts a stinging spray right back
  { const st = cut(1), be = at('beetle', 1), at_ = at('attacks', 1), sti = at('irritating', 1), bk = at('back', 1);
    add({ id: 'S02', at: st, cam: [540, 800], zoom: 0.07, note: 'the beetle walks on leaf litter; an ant lunges from the left; the beetle swings its tail up and blasts it; the ant is knocked back', draw(lt, d, t) {
      leafBG(t, { dark: true }); const hit = seg(lt, sti - 0.3, sti + 0.3);
      const B = { x: 620, y: 960, s: 1.45, rot: lerp(0.45, 1.0, eio(seg(lt, at_ - 0.2, sti))) }; const [nx, ny] = bpt(B, NOZ[0], NOZ[1]);
      const ax = lerp(110, 250, eo(seg(lt, 0, at_))) - hit * 70, ay = lerp(560, 400, eo(seg(lt, 0, at_))) - hit * 40;
      ant(ax, ay, 1.0, lerp(0.6, 1.0, hit) + hit * Math.sin(t * 18) * 0.06, { t, walk: lt < at_ ? 1 : 0, shake: hit, jaw: 1 });
      if (hit > 0) jet(nx, ny, Math.PI + B.rot, 560, t, hit, {});
      beetle(B.x, B.y, B.s, { t, rot: B.rot, walk: lt < at_ ? 0.6 : 0.1 });
      if (hit > 0.2) starburst(ax + 30, ay + 10, 0.5 * eob(hit), '#F2C14E', t * 2);
      label('BOMBARDIER BEETLE', 540, 140, tag(lt, be), -0.04, 56);
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + at_ - 0.1, 'zip', { gain: 0.35 }); cue(st + sti, 'slam', { gain: 0.45 }); }

  // 3 · almost boiling, around one hundred degrees
  { const st = cut(2), al = at('almost', 2), hu = at('degrees', 2);
    add({ id: 'S03', at: st, cam: [540, 800], zoom: 0.06, note: 'giant paper thermometer, red rising to 100; behind it the beetle tail steams; a small pot of boiling water for comparison', draw(lt, d, t) {
      leafBG(t, { dark: true }); beetle(760, 1000, 1.45, { t, rot: 1.0 }); const [nx, ny] = bpt({ x: 760, y: 1000, s: 1.45, rot: 1.0 }, NOZ[0], NOZ[1]); jet(nx, ny, tailAng, 420, t, 0.8);
      thermo(260, 820, 1.4, eio(seg(lt, 0.1, hu + 0.2)));
      steamPuffs(330, 90, t, eio(seg(lt, al, hu)), 7, 1.1);
      label('ALMOST BOILING', 580, 230, tag(lt, al), -0.04, 56, '#FBF6E8', '#C8322B');
      label('100 C / 212 F', 700, 1150, tag(lt, hu), 0.03, 64, '#FBF6E8', '#C8322B');
    } });
    cue(st + 0.2, 'sizzle', { dur: 1.6, gain: 0.25 }); cue(st + al + 0.2, 'tock', { gain: 0.3 }); cue(st + hu, 'pop', { gain: 0.4 }); }

  // 4 · inside: a pouch stores the ingredients; a tiny chamber with enzymes
  { const st = cut(3), po = at('pouch', 3), ch = at('chamber', 3), en = at('enzymes', 3);
    add({ id: 'S04', at: st, cam: [540, 800], zoom: 0.07, note: 'cutaway of the abdomen: big yellow storage pouch full of bubbles, a duct with a valve, a small thick-walled chamber with green enzyme dots', draw(lt, d, t) {
      labBG(t, '#2A2236'); cutaway(540, 850, 1.05, { rot: -Math.PI / 2, t, valve: 0 });
      label('INSIDE ITS ABDOMEN', 540, 150, tag(lt, 0.05), -0.03, 52);
      label('STORAGE POUCH', 260, 1090, tag(lt, po), -0.04, 54, '#FBF6E8', '#B98A12');
      label('TINY CHAMBER', 810, 520, tag(lt, ch), 0.04, 54, '#FBF6E8', '#B0406A');
      label('ENZYMES', 830, 690, tag(lt, en), -0.03, 54, '#FBF6E8', '#2E8A7A');
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + po, 'pop', { gain: 0.35 }); cue(st + ch + 0.1, 'plop', { gain: 0.35 }); cue(st + en + 0.3, 'sparkle', { dur: 0.6, gain: 0.25 }); }

  // 5 · danger: it squeezes some into the chamber and the mix reacts in a burst of heat
  { const st = cut(4), da = at('danger', 4), sq = at('lets', 4), re = at('reacts', 4), he = at('heat', 4);
    add({ id: 'S05', at: st, cam: [800, 800], zoom: 0.07, note: 'same cutaway: a shadow of an ant appears, muscle squeezes the pouch, the valve opens, yellow drops run into the chamber which flashes orange-white', draw(lt, d, t) {
      labBG(t, '#2A2236');
      const squeeze = eio(seg(lt, sq - 0.2, sq + 0.4)), drops = seg(lt, sq, re + 0.3), react = eio(seg(lt, re - 0.1, re + 0.5));
      cutaway(540, 850, 1.05, { rot: -Math.PI / 2, t, valve: eio(seg(lt, sq - 0.2, sq + 0.3)), squeeze, drops: lt > sq ? drops * 2 : 0, fill: lt > sq + 0.3 ? 0.55 * (1 - react * 0.2) : 0, react });
      if (lt > da - 0.2) { ctx.save(); ctx.globalAlpha = 0.85 * eob(seg(lt, da - 0.2, da + 0.2)); ant(180 + Math.sin(t * 3) * 6, 400, 0.85, 0.2, { t, jaw: 1 }); ctx.restore(); }
      label('DANGER', 300, 160, tag(lt, da), -0.04, 62, '#FBF6E8', '#C8322B');
      label('VALVE OPENS', 810, 860, tag(lt, sq), 0.03, 50);
      label('BURST OF HEAT', 820, 600, tag(lt, he), -0.03, 52, '#FBF6E8', '#C8322B');
    } });
    cue(st + da, 'alarm', { gain: 0.25 }); cue(st + sq + 0.1, 'gulp', { gain: 0.35 }); cue(st + re + 0.2, 'slam', { gain: 0.45 }); }

  // 6 · heat makes steam, pressure fires it out of the tail
  { const st = cut(5), he = at('heat', 5), stm = at('steam', 5), pr = at('pressure', 5), ta = at('tail', 5);
    add({ id: 'S06', at: st, cam: [540, 800], zoom: 0.07, note: 'the glowing chamber puffs steam bubbles and pressure arrows; the nozzle shoots a jet out of the tail end', draw(lt, d, t) {
      labBG(t, '#2A2236'); const react = 1, out = eio(seg(lt, pr, ta + 0.2));
      cutaway(540, 850, 1.05, { rot: -Math.PI / 2,  t, react, valve: 0.2, fill: 0.2 });
      steamPuffs(546, 590, t, eio(seg(lt, stm - 0.1, stm + 0.4)), 6, 1.0);
      for (let i = 0; i < 4; i++) { const u = ((t * 1.2 + i * 0.25) % 1) * eio(seg(lt, pr - 0.1, pr + 0.3)); if (u > 0) { ctx.save(); ctx.globalAlpha = 1 - u; ctx.fillStyle = '#FFEBC0'; ctx.beginPath(); ctx.moveTo(510, 450 - u * 110); ctx.lineTo(546, 390 - u * 110); ctx.lineTo(582, 450 - u * 110); ctx.closePath(); ctx.fill(); ctx.restore(); } }
      jet(546, 327, -Math.PI / 2, 300, t, out, { fat: 0.9 });
      label('STEAM', 240, 500, tag(lt, stm), -0.04, 62, '#FBF6E8', '#2E6A8A');
      label('PRESSURE', 820, 700, tag(lt, pr), 0.03, 50, '#FBF6E8', '#C8322B');
      label('OUT OF THE TAIL', 800, 330, tag(lt, ta), -0.03, 46);
    } });
    cue(st + stm, 'sizzle', { dur: 1.4, gain: 0.25 }); cue(st + pr + 0.2, 'zip', { gain: 0.35 }); }

  // 7 · 2015: filmed inside living beetles with X-rays
  { const st = cut(6), fi = at('filmed', 6), li = at('living', 6), tw = at('twist', 6);
    add({ id: 'S07', at: st, cam: [540, 800], zoom: 0.18, note: 'dark lab: a paper X-ray lamp fires a cyan beam at a beetle drawn as a glowing outline with the pouch and chamber showing through; REC dot', draw(lt, d, t) {
      labBG(t, '#0B2238'); xrayBeam(110, 160, t, eio(seg(lt, 0, 0.5)));
      ctx.save(); ctx.globalAlpha = 0.6; beetle(580, 880, 1.6, { t, rot: 0.9, walk: 0.3 }); ctx.restore();
      // glowing x-ray organs inside the abdomen
      const B = { x: 580, y: 880, s: 1.6, rot: 0.9 }; ctx.save(); const [px, py] = bpt(B, -120, -6); ctx.translate(px, py); ctx.rotate(B.rot); ctx.scale(B.s, B.s);
      ctx.strokeStyle = '#7AF0FF'; ctx.lineWidth = 6; ctx.shadowColor = '#7AF0FF'; ctx.shadowBlur = 24; ctx.fillStyle = 'rgba(120,230,255,0.22)'; ctx.beginPath(); ctx.ellipse(-30, 0, 70, 46, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(60, 4, 26 + Math.sin(t * 9) * 3, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(40, 4); ctx.lineTo(30, 4); ctx.stroke(); ctx.fillStyle = `rgba(160,250,255,${0.25 + 0.2 * Math.sin(t * 9)})`; ctx.beginPath(); ctx.arc(60, 4, 22, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.fillStyle = '#FF3B30'; ctx.globalAlpha = Math.sin(t * 6) > 0 ? 1 : 0.3; ctx.beginPath(); ctx.arc(900, 200, 22, 0, TAU); ctx.fill(); ctx.restore(); label('2015', 880, 280, tag(lt, 0.1), 0.03, 50, '#FBF6E8', '#2E6A8A');
      label('X-RAY MOVIE', 540, 190, tag(lt, fi), -0.04, 56, '#FBF6E8', '#2E6A8A');
      label('INSIDE LIVING BEETLES', 540, 1150, tag(lt, li), 0.03, 46);
      label('THE TWIST', 540, 1040, tag(lt, tw), -0.03, 62, '#FBF6E8', '#C8322B');
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + 0.6, 'sparkle', { dur: 0.8, gain: 0.3 }); cue(st + fi, 'tock', { gain: 0.35 }); cue(st + tw, 'pop', { gain: 0.45 }); }

  // 8 · hundreds of tiny blasts, up to about five hundred a second
  { const st = cut(7), sq = at('squirt', 7), bl = at('blasts', 7), ev = at('every', 7);
    add({ id: 'S08', at: st, cam: [540, 800], zoom: 0.08, note: 'left: a smooth jet with a red X (one long squirt); then the jet chops into rapid blobs from the nozzle, a counter races up to 500', draw(lt, d, t) {
      leafBG(t, { dark: true }); const B = { x: 700, y: 980, s: 1.2, rot: 1.0 }; const [nx, ny] = bpt(B, NOZ[0], NOZ[1]);
      const pulsing = lt > bl - 0.2;
      jet(nx, ny, Math.PI + B.rot, 600, pulsing ? t * 1.5 : t, 1, { pulse: pulsing ? 24 : 0, fat: 0.8 });
      beetle(B.x, B.y, B.s, { t, rot: B.rot });
      const n = 500, fv = at('five', 7);
      if (lt < bl - 0.2) { label('ONE LONG SQUIRT?', 790, 330, tag(lt, sq), -0.04, 50); ctx.save(); const k = tag(lt, sq + 0.5); if (k > 0) { ctx.translate(500, 330); ctx.scale(k * 1.2, k * 1.2); ctx.rotate(0.1); piece(POLY([[-50, -36], [-36, -50], [0, -14], [36, -50], [50, -36], [14, 0], [50, 36], [36, 50], [0, 14], [-36, 50], [-50, 36], [-14, 0]]), '#C8322B', 0.8); } ctx.restore(); }
      else { label('HUNDREDS OF TINY BLASTS', 700, 200, tag(lt, bl), -0.04, 44, '#FBF6E8', '#C8322B'); counterTag('UP TO 500', 790, 420, tag(lt, fv)); label('PER SECOND', 800, 570, tag(lt, ev), 0.03, 50); }
    } });
    cue(st + sq, 'thud', { gain: 0.35 }); cue(st + bl, 'zip', { gain: 0.35 }); for (let k = 0; k < 5; k++) cue(st + bl + 0.5 + k * 0.14, 'tock', { gain: 0.2 }); cue(st + bl + 1.6, 'sizzle', { dur: 1.8, gain: 0.2 }); }

  // 9 · scientists think pulsing gives the chamber a moment to cool; walls are tough
  { const st = cut(8), th = at('think', 8), pu = at('pulsing', 8), co = at('cool', 8), to = at('tough', 8);
    add({ id: 'S09', at: st, cam: [800, 800], zoom: 0.07, note: 'cutaway chamber large: it flashes hot, then a blue cooling ring washes over its thick wall, then hot again; layers of the wall highlighted', draw(lt, d, t) {
      labBG(t, '#2A2236'); const ph = (Math.sin(t * 6) + 1) / 2; const pulsing = lt > pu - 0.2;
      cutaway(540, 850, 1.05, { rot: -Math.PI / 2,  t, react: pulsing ? ph : 0.2, cool: pulsing ? 1 - ph : 0, fill: 0.2, valve: 0.2 });
      jet(546, 327, -Math.PI / 2, 300, t, pulsing ? 0.9 : 0.4, { pulse: 24, fat: 0.8 });
      label('PULSING', 230, 330, tag(lt, pu), 0.03, 60, '#FBF6E8', '#C8322B');
      label('TIME TO COOL', 840, 790, tag(lt, co), -0.03, 50, '#FBF6E8', '#2E6A8A');
      label('TOUGH WALLS', 840, 520, tag(lt, to), 0.03, 50);
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + pu, 'tock', { gain: 0.3 }); cue(st + co, 'bubbles', { dur: 1.2, gain: 0.25 }); cue(st + to, 'thud', { gain: 0.35 }); cue(st + 3.2, 'sparkle', { dur: 0.6, gain: 0.2 }); }

  // 10 · only makes its boiling weapon at the exact moment it needs it
  { const st = cut(9), ma = at('makes', 9), ex = at('exact', 9);
    add({ id: 'S10', at: st, cam: [540, 800], zoom: 0.07, note: 'cool calm chamber (empty, blue); an ant shadow approaches; drops flow in, chamber lights up, jet', draw(lt, d, t) {
      labBG(t, '#2A2236'); const go = eio(seg(lt, ex - 0.2, ex + 0.5));
      cutaway(540, 850, 1.05, { rot: -Math.PI / 2,  t, react: go * 0.9, fill: lt > ex - 0.2 ? 0.4 : 0, drops: lt > ex - 0.4 ? 1 : 0, valve: lt > ex - 0.4 ? 0.8 : 0, cool: lt < ex - 0.2 ? 0.7 : 0 });
      ctx.save(); ctx.globalAlpha = 0.9; ant(lerp(-120, 190, eio(seg(lt, ma - 0.4, ex))), 700, 0.95, 0.1, { t, walk: 1, jaw: 1 }); ctx.restore();
      if (go > 0.5) jet(546, 327, -Math.PI / 2, 300, t, go);
      label('MADE ON THE SPOT', 300, 240, tag(lt, 0.1), -0.04, 54, '#FBF6E8', '#C8322B');
      label('EXACT MOMENT', 820, 760, tag(lt, ex), 0.03, 52);
    } });
    cue(st + ma, 'bubbles', { dur: 1.0, gain: 0.2 }); cue(st + ex, 'pop', { gain: 0.5 }); }

  // 11 · would you dare pick one up? (loops to frame 0: the tail blast)
  { const st = cut(10), da = at('dare', 10);
    add({ id: 'S11', at: st, cam: [540, 800], zoom: 0.08, note: 'the beetle faces a giant paper finger and fingertip reaching in; it raises its tail and blasts steam; DARE?', draw(lt, d, t) {
      leafBG(t); const B = { x: 600, y: 940, s: 1.32, rot: lerp(0.2, 1.0, eio(seg(lt, 0, da))) }; const [nx, ny] = bpt(B, NOZ[0], NOZ[1]);
      const f = eio(seg(lt, 0, da));
      ctx.save(); ctx.translate(lerp(1020, 640, f), lerp(420, 820, f)); ctx.rotate(Math.PI + 0.64); piece(RR(-62, -30, 124, 900, 62), '#EDBB93', 1.4); piece(RR(-50, -14, 100, 200, 50), '#F4CBA6', 0, false); piece(ELL(0, 30, 40, 44), '#FAE6D6', 0, false); piece(ELL(0, 26, 30, 32), '#F6C9C0', 0, false); for (const yy of [260, 280, 300]) stroke([[-34, yy], [34, yy]], 'rgba(150,90,60,0.45)', 4); stroke([[-62, 700], [62, 700]], '#3A5A8A', 40); ctx.restore();
      if (lt > da - 0.3) jet(nx, ny, Math.PI + B.rot, 480, t, eio(seg(lt, da - 0.3, da)), {});
      beetle(B.x, B.y, B.s, { t, rot: B.rot, jaw: 0.5 });
      label('DARE TO PICK IT UP?', 540, 200, tag(lt, da - 0.2), -0.04, 64, '#FBF6E8', '#C8322B');
    } });
    cue(st + da - 0.1, 'slam', { gain: 0.4 }); }

  return { shots: S, cues: CUES };
}
