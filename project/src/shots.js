import { ctx, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';

const SERIF = 'Caladea';
const D = (a) => a * Math.PI / 180;

// ── paper texture (built once) ─────────────────────────────────────────────
let PAT = null;
function paperPattern() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? '255,255,255' : '60,40,20'},${0.08 + rnd(i + 1) * 0.12})`; g.fillRect(rnd(i + 2) * 256, rnd(i + 3) * 256, 1 + rnd(i + 4) * 2, 1 + rnd(i + 5) * 2); }
  g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x0 = rnd(i + 9) * 256, y0 = rnd(i + 19) * 256; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + 10 + rnd(i) * 30, y0 + (rnd(i + 7) - 0.5) * 8); g.stroke(); }
  return ctx.createPattern(c, 'repeat');
}
/** a cut paper piece: soft shadow, fill, paper grain, light cut edge. p = Path2D in the current transform */
function piece(p, fill, sh = 1, edge = true) {
  if (!PAT) PAT = paperPattern();
  ctx.save(); if (sh) { ctx.shadowColor = 'rgba(55,35,15,0.38)'; ctx.shadowBlur = 16 * sh; ctx.shadowOffsetX = 5 * sh; ctx.shadowOffsetY = 9 * sh; } ctx.fillStyle = fill; ctx.fill(p); ctx.restore();
  ctx.save(); ctx.clip(p); ctx.fillStyle = PAT; ctx.globalAlpha = 0.9; ctx.fill(p); ctx.restore();
  if (edge) { ctx.save(); ctx.strokeStyle = 'rgba(255,250,240,0.45)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(p); ctx.restore(); }
}
const RR = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
const CIR = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
const ELL = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
const POLY = (pts) => { const p = new Path2D(); pts.forEach(([a, b], i) => (i ? p.lineTo(a, b) : p.moveTo(a, b))); p.closePath(); return p; };
function pin(x, y, r = 9) { ctx.fillStyle = '#B8902F'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#E9C96A'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); ctx.fill(); }
function label(text, x, y, sc = 1, rot = -0.04, size = 52, fill = '#FBF6E8', col = '#3A2A1E') {
  if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.font = `700 ${size}px ${SERIF}`;
  const w = ctx.measureText(text).width + 60, p = new Path2D(); p.moveTo(-w / 2, -size * 0.8); for (let i = 0; i <= 10; i++) p.lineTo(-w / 2 + w * i / 10, -size * 0.8 + (rnd(i + text.length) - 0.5) * 8); p.lineTo(w / 2, size * 0.8); for (let i = 10; i >= 0; i--) p.lineTo(-w / 2 + w * i / 10, size * 0.8 + (rnd(i + 30) - 0.5) * 8); p.closePath();
  piece(p, fill, 0.7); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 4); pin(0, -size * 0.8 + 6, 7); ctx.restore();
}
function redX(x, y, s) { if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(0.1); piece(POLY([[-50, -36], [-36, -50], [0, -14], [36, -50], [50, -36], [14, 0], [50, 36], [36, 50], [0, 14], [-36, 50], [-50, 36], [-14, 0]]), '#C8322B', 0.8); ctx.restore(); }
function burst(x, y, s, col = '#F2C14E', rot = 0) { if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); const p = new Path2D(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 60 : 120; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); } p.closePath(); piece(p, col, 0.8); ctx.restore(); }

const view = (cx, cy, z) => { ctx.translate(540, 820); ctx.scale(z, z); ctx.translate(-cx, -cy); };
const R2 = (i) => { const v = Math.sin(i * 91.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
const INK = '#26232A', CREAM = '#F3EFE6';
function stroke(pts, col, w, close = false) { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); if (close) ctx.closePath(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function curve(x0, y0, cx, cy, x1, y1, col, w) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); }
function mixCol(a, b, t) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }
function plain(col) { ctx.fillStyle = col; ctx.fillRect(-600, -600, W + 1200, H + 1200); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = PAT; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore(); }


// ═══════════════ ABSOLUTE ZERO KIT: paper atoms, vacuum chamber, thermometers, steps, drop tower, trap, superfluid cup ═══════════════
const HOT = '#E0583A', COLD = '#7FB8D8', ICE = '#DDEEF5', NAVY = '#16222F', GOLDC = '#F2C14E', CYAN = '#6FD3E8';
const tri = (u) => 1 - Math.abs((((u % 2) + 2) % 2) - 1);
/** integral of a speed that ramps linearly from s0 (before a) to s1 (after b): film-time phase for slowing atoms */
function rampTau(t, s0, s1, a, b) {
  if (t <= a) return s0 * t;
  const m = Math.min(t, b) - a, k = (s1 - s0) / ((b - a) || 1e-6);
  return s0 * a + s0 * m + k * m * m / 2 + (t > b ? s1 * (t - b) : 0);
}
/** night lab paper background: deep blue-grey paper with a soft vignette */
function lab(col = '#1E2B3A') {
  plain(col);
  const g = ctx.createRadialGradient(540, 860, 300, 540, 900, 1300); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, H + 1200);
}
/** star field (for deep space) */
function stars(t, n = 120, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < n; i++) { const x = R2(i) * 1400 - 160, y = R2(i + 300) * 2300 - 200, r = 1.5 + R2(i + 600) * 3.5, tw = 0.6 + 0.4 * Math.sin(t * 2 + i); ctx.fillStyle = `rgba(255,248,225,${0.5 * tw + 0.3})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); if (r > 4.3) { ctx.strokeStyle = 'rgba(255,248,225,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.stroke(); } }
  ctx.restore();
}
/** a paper atom: shaded ball (temperature colour) with a thin orbit ring and an electron. k = 0 hot .. 1 cold */
function atom(x, y, r, k = 0, o = {}) {
  const col = o.col || mixCol(HOT, COLD, clamp(k)), a = o.a ?? 1; if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const ang = o.ang ?? (R2(o.i || 0) * 3), spin = o.spin ?? 0;
  // back half of the orbit ring
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = 'rgba(250,244,228,0.75)'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.65, r * 0.55, 0, Math.PI, TAU); ctx.stroke(); ctx.restore();
  piece(CIR(x, y, r), col, 0.5, true);
  ctx.save(); ctx.clip(CIR(x, y, r));
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r * 1.25); g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(10,20,40,0.35)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.12, -0.6, 0, TAU); ctx.fill();
  // front half of the ring + electron
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = 'rgba(250,244,228,0.9)'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.65, r * 0.55, 0, 0, Math.PI); ctx.stroke();
  const ea = spin + (o.i || 0); ctx.fillStyle = '#FFF6D8'; ctx.beginPath(); ctx.arc(Math.cos(ea) * r * 1.65, Math.sin(ea) * r * 0.55, Math.max(3, r * 0.16), 0, TAU); ctx.fill();
  ctx.restore();
  if (o.frost) { ctx.save(); ctx.globalAlpha = a * o.frost; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r - 2, 3.6, 5.6); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
/** a gas of n atoms bouncing inside box {x, y, w, h}. tau = phase (integrated speed). o = { k (cold 0..1), trail (0..1), jig (px), r, spin } */
function gasPts(box, n, tau, o = {}) {
  const r = o.r || 34, out = [];
  for (let i = 0; i < n; i++) {
    const vx = (0.55 + R2(i + 100)) * (R2(i + 7) > 0.5 ? 1 : -1), vy = (0.55 + R2(i + 200)) * (R2(i + 9) > 0.5 ? 1 : -1);
    const px = tri(R2(i) * 2 + vx * tau * 0.22), py = tri(R2(i + 50) * 2 + vy * tau * 0.22);
    out.push([box.x + r * 1.7 + px * (box.w - r * 3.4), box.y + r * 1.7 + py * (box.h - r * 3.4)]);
  }
  return out;
}
function gas(box, n, tau, t, o = {}) {
  const r = o.r || 34, P0 = gasPts(box, n, tau, o);
  if (o.trail > 0.02) for (let g = 3; g >= 1; g--) { const Pg = gasPts(box, n, tau - g * 0.16 * o.trail, o); Pg.forEach(([x, y], i) => { if (Math.hypot(x - P0[i][0], y - P0[i][1]) > r * 2.4) return; ctx.save(); ctx.globalAlpha = 0.16 * (4 - g) * o.trail; ctx.fillStyle = mixCol(HOT, COLD, o.k || 0); ctx.beginPath(); ctx.arc(x, y, r * (1 - g * 0.12), 0, TAU); ctx.fill(); ctx.restore(); }); }
  P0.forEach(([x, y], i) => { const j = o.jig || 0; atom(x + Math.sin(t * 41 + i * 2.1) * j, y + Math.cos(t * 37 + i * 1.3) * j, r, o.k || 0, { i, spin: (o.spin ?? t * 3), frost: o.frost, a: o.a }); });
  return P0;
}
/** steel-framed vacuum chamber with a glass front. box = inner glass {x, y, w, h}. inside() draws the contents (clipped). o = { frost 0..1, glow } */
function chamber(box, inside, o = {}) {
  const { x, y, w, h } = box;
  // vacuum pipe + valve wheel on top
  piece(RR(x + w * 0.5 - 30, y - 150, 60, 130, 10), '#7D8A96', 0.6); piece(RR(x + w * 0.5 - 60, y - 170, 120, 34, 10), '#95A3AF', 0.5);
  ctx.save(); ctx.translate(x + w * 0.5, y - 196); piece(CIR(0, 0, 40), '#B8352E', 0.6); piece(CIR(0, 0, 16), '#8A2520', 0.2, false); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 4); piece(RR(-4, -40, 8, 80, 4), '#8A2520', 0, false); } ctx.restore();
  // frame
  piece(RR(x - 36, y - 36, w + 72, h + 72, 30), '#8A97A3', 1.1);
  piece(RR(x - 18, y - 18, w + 36, h + 36, 18), '#6C7884', 0.3);
  ctx.save(); ctx.fillStyle = '#16283A'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.restore();
  // inside
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 40, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); g.addColorStop(0, `rgba(90,150,200,${0.25 + 0.3 * (o.glow || 0)})`); g.addColorStop(1, 'rgba(10,25,40,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  inside();
  // glass streaks
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(x + w * 0.1, y); ctx.lineTo(x + w * 0.28, y); ctx.lineTo(x + w * 0.05, y + h); ctx.lineTo(x - w * 0.13, y + h); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + w * 0.36, y); ctx.lineTo(x + w * 0.41, y); ctx.lineTo(x + w * 0.18, y + h); ctx.lineTo(x + w * 0.13, y + h); ctx.fill();
  // frost creeping in from the edges
  const f = o.frost || 0;
  if (f > 0) {
    ctx.fillStyle = `rgba(225,242,255,${0.16 * f})`; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 70; i++) {
      const side = i % 4, u = R2(i + 3), d = R2(i + 11) * 120 * f;
      const fx = side === 0 ? x + u * w : side === 1 ? x + w - d : side === 2 ? x + u * w : x + d, fy = side === 0 ? y + d : side === 1 ? y + u * h : side === 2 ? y + h - d : y + u * h;
      const s = (10 + R2(i + 21) * 18) * clamp(f * 1.4 - R2(i + 5) * 0.4); if (s <= 1) continue;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(R2(i) * 3); ctx.strokeStyle = 'rgba(240,250,255,0.85)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.moveTo(s * 0.55, 0); ctx.lineTo(s * 0.8, -s * 0.25); ctx.moveTo(s * 0.55, 0); ctx.lineTo(s * 0.8, s * 0.25); ctx.stroke(); }
      ctx.restore();
    }
  }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.stroke(); ctx.restore();
  for (const [bx, by] of [[x - 18, y - 18], [x + w + 18, y - 18], [x - 18, y + h + 18], [x + w + 18, y + h + 18], [x + w / 2, y - 18], [x + w / 2, y + h + 18]]) pin(bx, by, 9);
}
/** glass thermometer on a paper card. lvl 0..1 = liquid height; cold 0..1 = liquid colour red -> blue. o = { ticks, cardW } */
function thermo(x, y, h, lvl, cold = 0, o = {}) {
  const cw = o.cardW || 150;
  piece(RR(x - cw / 2, y - 50, cw, h + 170, 26), '#F1E7CF', 0.9);
  const n = o.ticks || 10; ctx.strokeStyle = '#5A4632'; ctx.lineCap = 'round';
  for (let i = 0; i <= n * 2; i++) { const ty = y + h * i / (n * 2); ctx.lineWidth = i % 2 ? 3 : 5; ctx.beginPath(); ctx.moveTo(x - 30, ty); ctx.lineTo(x - (i % 2 ? 46 : 58), ty); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 30, ty); ctx.lineTo(x + (i % 2 ? 46 : 58), ty); ctx.stroke(); }
  const col = mixCol('#D8342C', '#3F8FD0', clamp(cold));
  piece(RR(x - 24, y - 10, 48, h + 40, 24), 'rgba(236,246,250,0.95)', 0.4);
  piece(CIR(x, y + h + 62, 50), 'rgba(236,246,250,0.95)', 0.5);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y + h + 62, 36, 0, TAU); ctx.fill();
  const top = y + h * (1 - clamp(lvl)); ctx.beginPath(); ctx.roundRect(x - 11, top, 22, y + h + 40 - top, 11); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 17, y + 4, 6, h); ctx.beginPath(); ctx.ellipse(x - 18, y + h + 46, 9, 15, 0.5, 0, TAU); ctx.fill();
  return top;
}
/** detailed close-up atom: nucleus of packed protons/neutrons, three orbit rings with electrons */
function bigAtom(x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 420); g.addColorStop(0, `rgba(120,200,240,${0.35 * (o.glow ?? 1)})`); g.addColorStop(1, 'rgba(120,200,240,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 420, 0, TAU); ctx.fill();
  const rings = [[0.0, 0], [1.05, 1.7], [-1.05, 3.4]], spin = o.spin ?? t * 2;
  for (const [ang, ph] of rings) { ctx.save(); ctx.rotate(ang); ctx.strokeStyle = 'rgba(250,244,228,0.5)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(0, 0, 340, 110, 0, Math.PI, TAU); ctx.stroke(); ctx.restore(); }
  const nuc = [[0, 0], [-34, -20], [32, -24], [-30, 28], [30, 26], [0, -44], [0, 44], [-58, 4], [58, 2], [-20, -2], [20, 4], [-14, 40], [16, -40]];
  nuc.forEach(([nx, ny], i) => { const c = i % 2 ? '#D9533F' : '#EFE3C4'; piece(CIR(nx, ny, 34), c, 0.5, true); ctx.save(); ctx.clip(CIR(nx, ny, 34)); const gg = ctx.createRadialGradient(nx - 12, ny - 14, 2, nx, ny, 44); gg.addColorStop(0, 'rgba(255,255,255,0.5)'); gg.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = gg; ctx.fillRect(nx - 34, ny - 34, 68, 68); ctx.restore(); if (i % 2) { ctx.fillStyle = 'rgba(255,240,230,0.9)'; ctx.font = `700 30px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', nx, ny + 2); } });
  for (const [ang, ph] of rings) { ctx.save(); ctx.rotate(ang); ctx.strokeStyle = 'rgba(250,244,228,0.85)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(0, 0, 340, 110, 0, 0, Math.PI); ctx.stroke(); const ea = spin + ph; piece(CIR(Math.cos(ea) * 340, Math.sin(ea) * 110, 26), '#7FD0F0', 0.4, true); ctx.fillStyle = '#E8F8FF'; ctx.font = `700 34px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('-', Math.cos(ea) * 340, Math.sin(ea) * 110 - 2); ctx.restore(); }
  ctx.restore();
}
/** Bremen-style drop tower: slim white shaft with a glass cap, a cut-away window showing the falling capsule. fall 0..1 */
function dropTower(t, fall, o = {}) {
  const cx = o.x ?? 380, top = 230, bot = 1440;
  // ground + building at the foot
  piece(RR(-200, bot, W + 400, 400, 0), '#3B4A3A', 0.6);
  piece(RR(cx - 250, bot - 160, 500, 170, 14), '#D8D2C2', 0.8);
  for (let i = 0; i < 6; i++) piece(RR(cx - 220 + i * 76, bot - 120, 50, 60, 6), '#5E7486', 0.2, false);
  // shaft (slightly tapered)
  const sh = new Path2D(); sh.moveTo(cx - 80, bot - 150); sh.lineTo(cx - 60, top + 120); sh.lineTo(cx + 60, top + 120); sh.lineTo(cx + 80, bot - 150); sh.closePath(); piece(sh, '#ECE6D6', 1);
  ctx.save(); ctx.clip(sh); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(cx + 30, top, 60, bot); for (let y = top + 160; y < bot - 160; y += 90) { ctx.fillStyle = 'rgba(120,110,90,0.25)'; ctx.fillRect(cx - 90, y, 180, 4); } ctx.restore();
  // glass cap on top
  piece(RR(cx - 100, top + 90, 200, 40, 8), '#C9C2B0', 0.6);
  const cap = new Path2D(); cap.moveTo(cx - 90, top + 92); cap.lineTo(cx - 90, top + 10); cap.quadraticCurveTo(cx, top - 70, cx + 90, top + 10); cap.lineTo(cx + 90, top + 92); cap.closePath(); piece(cap, '#9FC8DA', 0.7);
  ctx.save(); ctx.clip(cap); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 36, top - 60); ctx.lineTo(cx + k * 36, top + 92); ctx.stroke(); } ctx.restore();
  piece(RR(cx - 4, top - 90, 8, 60, 4), '#8A8576', 0.3);
  // cut-away window with the drop tube and falling capsule
  const wy0 = top + 170, wy1 = bot - 200, win = RR(cx - 46, wy0, 92, wy1 - wy0, 20);
  ctx.save(); ctx.fillStyle = '#121C27'; ctx.fill(win); ctx.clip(win);
  ctx.strokeStyle = 'rgba(160,190,210,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 30, wy0); ctx.lineTo(cx - 30, wy1); ctx.moveTo(cx + 30, wy0); ctx.lineTo(cx + 30, wy1); ctx.stroke();
  const cy = lerp(wy0 + 70, wy1 - 70, fall * fall);
  piece(RR(cx - 26, cy - 62, 52, 124, 26), '#C7CED4', 0.4);
  ctx.save(); ctx.globalAlpha = 0.9; const gg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22); gg.addColorStop(0, '#E8FBFF'); gg.addColorStop(1, 'rgba(111,211,232,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, TAU); ctx.fill(); ctx.restore();
  if (fall > 0.02 && fall < 0.99) for (let k = 1; k <= 4; k++) { ctx.strokeStyle = `rgba(200,230,245,${0.35 - k * 0.07})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 18, cy - 70 - k * 22); ctx.lineTo(cx - 18, cy - 90 - k * 22); ctx.moveTo(cx + 18, cy - 70 - k * 22); ctx.lineTo(cx + 18, cy - 90 - k * 22); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = '#F7EFDC'; ctx.lineWidth = 6; ctx.setLineDash([14, 9]); ctx.stroke(win); ctx.restore();
  return [cx, cy];
}
/** the capsule close-up: a cloud of rubidium atoms expanding and cooling as it falls */
function atomCloud(x, y, s, k, t) {
  for (let i = 0; i < 26; i++) { const a = R2(i) * TAU, d = Math.sqrt(R2(i + 4)) * (40 + 120 * k); atom(x + Math.cos(a) * d * s, y + Math.sin(a) * d * s, 16 * s, 0.6 + 0.4 * k, { i, spin: t * 0.6, a: 0.9 }); }
}
/** magnetic trap: a paper bowl with copper coils at the sides */
function trap(cx, cy, w, t, glow = 0) {
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(cx + sd * (w / 2 + 70), cy - 60); for (let k = 0; k < 6; k++) piece(ELL(0, -120 + k * 48, 46, 22), k % 2 ? '#B8732E' : '#D08A3E', 0.4); ctx.restore(); }
  const p = new Path2D(); p.moveTo(cx - w / 2 - 20, cy - 260); p.quadraticCurveTo(cx, cy + 260, cx + w / 2 + 20, cy - 260); p.lineTo(cx + w / 2 - 10, cy - 260); p.quadraticCurveTo(cx, cy + 200, cx - w / 2 + 10, cy - 260); p.closePath();
  piece(p, '#9AA7B3', 0.6);
  if (glow) { ctx.save(); ctx.globalAlpha = glow * 0.5; ctx.strokeStyle = CYAN; ctx.lineWidth = 6; ctx.setLineDash([10, 14]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.moveTo(cx - w / 2, cy - 250); ctx.quadraticCurveTo(cx, cy + 210, cx + w / 2, cy - 250); ctx.stroke(); ctx.restore(); }
}
/** one giant matter wave: a glowing blob with ripple bands */
function condensate(x, y, r, t, a = 1) {
  if (r <= 1 || a <= 0) return; ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.6); g.addColorStop(0, 'rgba(160,235,255,0.55)'); g.addColorStop(1, 'rgba(111,211,232,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, TAU); ctx.fill();
  const p = new Path2D(); for (let i = 0; i <= 60; i++) { const an = i / 60 * TAU, rr2 = r * (1 + 0.05 * Math.sin(an * 5 + t * 3)); i ? p.lineTo(x + Math.cos(an) * rr2, y + Math.sin(an) * rr2 * 0.82) : p.moveTo(x + Math.cos(an) * rr2, y + Math.sin(an) * rr2 * 0.82); } p.closePath();
  piece(p, '#8EDCF0', 0.6, true);
  ctx.save(); ctx.clip(p); for (let k = 0; k < 7; k++) { const rr2 = ((k / 7 + t * 0.25) % 1) * r * 1.1; ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - rr2 / (r * 1.1))})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(x, y, rr2, rr2 * 0.82, 0, 0, TAU); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - r * 0.4, y - r * 0.4, r * 0.25, r * 0.1, -0.6, 0, TAU); ctx.fill();
  ctx.restore();
}
/** glass beaker of superfluid helium. o = { swirl 0..1, film 0..1 (climbs inner wall, over the rim, down the outside), drip (time), level } */
const CUP = { x: 540, top: 640, bot: 1220, wTop: 420, wBot: 360 };
function heliumCup(t, o = {}) {
  const { x, top, bot, wTop, wBot } = CUP, lvl = o.level ?? 0.55, ly = bot - (bot - top) * lvl;
  const L = (y) => x - lerp(wBot, wTop, (bot - y) / (bot - top)) / 2, R = (y) => x + lerp(wBot, wTop, (bot - y) / (bot - top)) / 2;
  // stand
  piece(RR(x - 300, bot + 30, 600, 40, 12), '#7D8A96', 0.8); piece(RR(x - 260, bot + 70, 30, 200, 8), '#6C7884', 0.5); piece(RR(x + 230, bot + 70, 30, 200, 8), '#6C7884', 0.5);
  // pool collecting on the stand
  const pool = o.pool || 0; if (pool > 0) piece(ELL(x, bot + 34, 90 + 200 * pool, 10 + 8 * pool), 'rgba(150,225,245,0.9)', 0.2, false);
  // glass back
  const glass = POLY([[L(top), top], [R(top), top], [R(bot), bot], [L(bot), bot]]);
  ctx.save(); ctx.fillStyle = 'rgba(200,230,245,0.16)'; ctx.fill(glass); ctx.restore();
  // liquid
  ctx.save(); ctx.clip(glass); ctx.fillStyle = 'rgba(140,215,240,0.75)'; ctx.fillRect(x - 400, ly, 800, bot - ly + 10);
  ctx.fillStyle = 'rgba(220,248,255,0.8)'; ctx.beginPath(); ctx.ellipse(x, ly, (R(ly) - L(ly)) / 2, 22, 0, 0, TAU); ctx.fill();
  if (o.swirl) { ctx.strokeStyle = `rgba(60,140,180,${0.8 * o.swirl})`; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { const rx = (R(ly) - L(ly)) / 2 * (0.35 + k * 0.22), a0 = t * 3 + k * 2; ctx.beginPath(); ctx.ellipse(x, ly, rx, rx * 0.12, 0, a0, a0 + 2.2); ctx.stroke(); }
    for (let k = 0; k < 5; k++) { const yy = ly + 60 + k * 90; if (yy > bot - 20) break; const ph = (t * 1.4 + k * 0.37) % 1, xx = lerp(L(yy) + 30, R(yy) - 30, ph); ctx.fillStyle = `rgba(230,250,255,${0.7 * o.swirl * Math.sin(ph * Math.PI)})`; ctx.beginPath(); ctx.ellipse(xx, yy, 28, 6, 0, 0, TAU); ctx.fill(); } }
  ctx.restore();
  // the creeping film: inner wall up, over the rim, down the outside
  const f = o.film || 0;
  if (f > 0) {
    ctx.save(); ctx.strokeStyle = '#D8FAFF'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(160,240,255,1)'; ctx.shadowBlur = 26;
    for (const sd of [-1, 1]) {
      const wx = (y) => (sd < 0 ? L(y) : R(y)), seg1 = clamp(f / 0.4), seg2 = clamp((f - 0.4) / 0.1), seg3 = clamp((f - 0.5) / 0.5);
      ctx.beginPath(); ctx.moveTo(wx(ly) - sd * 8, ly); const y1 = lerp(ly, top, seg1); ctx.lineTo(wx(y1) - sd * 8, y1);
      if (seg2 > 0) { ctx.arc(wx(top), top - 4, 10, sd < 0 ? 0 : Math.PI, sd < 0 ? -Math.PI * seg2 : Math.PI + Math.PI * seg2, sd < 0); }
      if (seg3 > 0) { ctx.moveTo(wx(top) + sd * 10, top); const y3 = lerp(top, bot, seg3); ctx.lineTo(wx(y3) + sd * 10, y3); }
      ctx.stroke();
    }
    ctx.restore();
  }
  // glass front: edges, rim, shine
  ctx.save(); ctx.strokeStyle = 'rgba(235,248,255,0.85)'; ctx.lineWidth = 7; ctx.stroke(glass); ctx.restore();
  piece(ELL(x, top, wTop / 2 + 12, 20), 'rgba(225,245,255,0.35)', 0.2, false); ctx.save(); ctx.strokeStyle = 'rgba(240,250,255,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, top, wTop / 2 + 12, 20, 0, 0, TAU); ctx.stroke(); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(L(top) + 40, top + 30); ctx.lineTo(L(top) + 70, top + 30); ctx.lineTo(L(bot) + 60, bot - 30); ctx.lineTo(L(bot) + 34, bot - 30); ctx.fill();
  // drips falling from the bottom outside edges
  if (o.drip != null) for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { const ph = (o.drip * 0.9 + k * 0.5 + (sd > 0 ? 0.25 : 0)) % 1, dx = sd < 0 ? L(bot) - 6 : R(bot) + 6; const dy = bot + 6 + ph * ph * 26; const sz = ph < 0.6 ? 10 + ph * 18 : 20; piece(ELL(dx, dy, sz * 0.8, sz), '#BFF1FF', 0.2, false); }
}
/** descending steps toward the absolute zero line; returns step tops */
function steps(n, x0, top, w0, h0, rw, rh) {
  const out = []; let x = x0, y = top;
  for (let i = 0; i < n; i++) { const w = w0 * Math.pow(rw, i), h = h0 * Math.pow(rh, i); y += h; out.push([x, y, w]); x += w; }
  return out;
}

// ═══════════════ ABSOLUTE ZERO video: shots ═══════════════
export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const at = (w, i) => Wd(w, i) - cut(i);
  const tag = (lt, a, d = 0.3) => (lt > a ? eob(seg(lt, a, a + d)) : 0);
  const BOX = { x: 190, y: 430, w: 700, h: 820 };

  // 1 · a chamber of zooming atoms is cooled toward absolute zero
  { const st = cut(0), co = at('cool', 0), ze = at('zero', 0);
    add({ id: 'S01', at: st, cam: [540, 840], zoom: 0.06, note: 'steel vacuum chamber full of fast red paper atoms with motion trails; on COOL frost creeps in, atoms turn blue and slow down; on ZERO they almost stop: ABSOLUTE ZERO?', draw(lt, d, t) {
      lab(); const k = eio(seg(lt, co - 0.2, ze + 0.4)), tau = rampTau(lt, 3.2, 0.12, co - 0.2, ze + 0.4);
      chamber(BOX, () => gas(BOX, 11, tau, t, { k, trail: 1 - k, jig: 1.5 }), { frost: k, glow: k });
      label('ABSOLUTE ZERO?', 540, 1440, tag(lt, ze), 0.03, 70, '#FBF6E8', '#2E6A9A');
    } });
    cue(st, 'whoosh'); cue(st + co, 'sparkle', { dur: 1.2, gain: 0.35 }); cue(st + ze, 'pop', { gain: 0.8 }); }

  // 2 · heat is atoms jiggling: hot fast, cold slow
  { const st = cut(1), he = at('heat', 1), co = at('colder', 1), sl = at('slower', 1);
    const LB = { x: 70, y: 520, w: 430, h: 640 }, RB = { x: 580, y: 520, w: 430, h: 640 };
    add({ id: 'S02', at: st, cam: [540, 860], zoom: 0.05, note: 'two chambers side by side: HOT (red atoms zooming with trails, a small flame under it) and COLD (blue atoms creeping, an ice cube under it)', draw(lt, d, t) {
      lab();
      const hk = eob(seg(lt, 0, 0.4)), ck = eob(seg(lt, co - 0.5, co));
      chamber(LB, () => gas(LB, 7, t * 3.5, t, { k: 0, trail: 1, r: 28 }));
      ctx.save(); ctx.translate(285, 1300); ctx.scale(hk, hk); const fl = 1 + 0.08 * Math.sin(t * 18); piece(POLY([[-60, 40], [-50, -30 * fl], [-20, -10], [0, -90 * fl], [20, -10], [50, -40 * fl], [60, 40]]), '#E8833A', 0.6); piece(POLY([[-30, 40], [-20, -10 * fl], [0, -50 * fl], [20, -10 * fl], [30, 40]]), '#F2C14E', 0.3, false); ctx.restore();
      if (ck > 0) { chamber(RB, () => gas(RB, 7, rampTau(lt, 1.2, 0.35, co, sl + 0.3), t, { k: 1, trail: 0, r: 28, frost: 0.6 }), { frost: 0.5 }); ctx.save(); ctx.translate(795, 1300); ctx.scale(ck, ck); ctx.rotate(0.1); piece(RR(-55, -45, 110, 90, 14), 'rgba(210,238,250,0.95)', 0.5); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-40, -32, 30, 10); ctx.restore(); }
      label('HOT = FAST', 285, 330, tag(lt, he), -0.04, 52, '#FBF6E8', '#C8322B'); label('COLD = SLOW', 795, 330, tag(lt, sl), 0.04, 52, '#FBF6E8', '#2E6A9A');
    } });
    cue(st, 'whoosh'); cue(st + he, 'sizzle', { dur: 1.0, gain: 0.25 }); cue(st + co, 'sparkle', { dur: 0.8, gain: 0.35 }); cue(st + sl, 'pop'); }

  // 3 · minus 273.15 C, minus 459.67 F, zero kelvin
  { const st = cut(2), mi = at('minus', 2), ce = at('celsius', 2), fa = at('fahrenheit', 2), ke = at('kelvin', 2);
    add({ id: 'S03', at: st, cam: [540, 800], zoom: 0.04, note: 'a tall paper thermometer, red liquid drops all the way to the bottom and turns blue; tags pop at the bottom mark: -273.15 C, -459.67 F, 0 KELVIN', draw(lt, d, t) {
      lab('#223244');
      const k = eio(seg(lt, 0.1, ce + 0.2)), top = thermo(540, 240, 1000, lerp(0.9, 0.012, k), k, { cardW: 170 });
      ctx.save(); ctx.strokeStyle = '#E25A4A'; ctx.lineWidth = 5; ctx.setLineDash([12, 9]); ctx.beginPath(); ctx.moveTo(380, 1240); ctx.lineTo(700, 1240); ctx.stroke(); ctx.restore();
      label('ROOM', 280, 340, tag(lt, 0.05) * (1 - seg(lt, mi, mi + 0.3)), -0.04, 40);
      label('-273.15 °C', 255, 1180, tag(lt, ce), -0.04, 56, '#FBF6E8', '#2E6A9A'); label('-459.67 °F', 825, 1180, tag(lt, fa), 0.04, 56, '#FBF6E8', '#2E6A9A'); label('0 KELVIN', 540, 1440, tag(lt, ke), -0.03, 66, '#FBF6E8', '#C8322B');
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slide', { dur: 1.4, gain: 0.35 }); cue(st + ce, 'pop'); cue(st + fa, 'pop'); cue(st + ke, 'thud', { gain: 0.5 }); }

  // 4 · you can never get there: every step closer is harder, forever
  { const st = cut(3), ca = at('catch', 3), nv = at('never', 3), sp = at('step', 3), ha = at('harder', 3), fo = at('forever', 3);
    const ST = steps(16, 30, 400, 228, 320, 0.78, 0.6), LIM = 400 + 320 / (1 - 0.6);
    add({ id: 'S04', at: st, cam: [540, 860], zoom: 0.05, note: 'blue paper staircase going down toward a red dashed ABSOLUTE ZERO line; each step is smaller than the last; a paper atom hops down, the steps get tiny and it never touches the line', draw(lt, d, t) {
      lab();
      ctx.save(); ctx.strokeStyle = '#E25A4A'; ctx.lineWidth = 7; ctx.setLineDash([18, 12]); ctx.beginPath(); ctx.moveTo(40, LIM); ctx.lineTo(1040, LIM); ctx.stroke(); ctx.restore();
      label('ABSOLUTE ZERO', 700, LIM + 80, 1, 0.02, 46, '#FBF6E8', '#C8322B');
      ST.forEach(([x, y, w], i) => { const p = new Path2D(); p.rect(x, y, w + 1, LIM - y); piece(p, i % 2 ? '#8FB7CF' : '#A7CADC', i < 6 ? 0.5 : 0, i < 8); });
      ST.slice(0, 5).forEach(([x, y, w], i) => { ctx.fillStyle = 'rgba(30,50,70,0.55)'; ctx.font = `700 ${40 - i * 6}px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText(['STEP 1', 'STEP 2', '3', '4', '5'][i], x + w / 2, y + 50 - i * 6); });
      // the atom hops from step to step, slower and slower
      const hp = clamp(seg(lt, nv - 0.4, d) * 1.0), f = Math.pow(hp, 0.6) * 9.5, k = Math.floor(f), u = f - k;
      const A = ST[Math.min(k, ST.length - 1)], B = ST[Math.min(k + 1, ST.length - 1)], r = 44;
      const ax = lerp(A[0] + A[2] / 2, B[0] + B[2] / 2, eio(u)), ay = lerp(A[1], B[1], u) - r - Math.sin(u * Math.PI) * 70;
      atom(ax, ay, r, 0.85, { i: 2, spin: t * 3 });
      label('THE CATCH', 300, 260, tag(lt, ca), -0.04, 56); label('NEVER', 790, 260, tag(lt, nv), 0.04, 64, '#FBF6E8', '#C8322B');
      label('EVERY STEP HARDER', 540, 1420, tag(lt, ha), -0.02, 52);
    } });
    cue(st, 'whoosh'); cue(st + nv, 'thud', { gain: 0.5 }); { const d4 = cut(4) - st; [1, 2, 3, 4, 5].forEach((k, i) => cue(st + lerp(nv - 0.4, d4, Math.pow(k / 9.5, 1 / 0.6)), 'tock', { gain: 0.3 - i * 0.03 })); } cue(st + fo, 'pop', { gain: 0.5 }); }

  // 5 · even then atoms keep a tiny quantum jiggle
  { const st = cut(4), sl = at('still', 4), qu = at('quantum', 4);
    add({ id: 'S05', at: st, cam: [540, 820], zoom: 0.08, note: 'one big detailed paper atom (nucleus of protons and neutrons, three orbit rings with electrons) almost frozen, but it keeps shivering with faint ghost copies: QUANTUM JIGGLE', draw(lt, d, t) {
      lab('#18242F'); stars(t, 60, 0.4);
      const j = 4 + 6 * seg(lt, qu - 0.3, qu + 0.3), ox = Math.sin(t * 47) * j, oy = Math.cos(t * 53) * j * 0.7;
      ctx.save(); ctx.globalAlpha = 0.18; bigAtom(540 - ox * 2.5, 840 - oy * 2.5, 1.15, t, { spin: 0.4, glow: 0 }); ctx.restore();
      bigAtom(540 + ox, 840 + oy, 1.15, t, { spin: 0.4 + t * 0.05 });
      for (const sd of [-1, 1]) { ctx.save(); ctx.strokeStyle = 'rgba(250,244,228,0.6)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(540 + sd * (440 + k * 30), 840, 60 + k * 30, -0.4, 0.4); if (sd < 0) { ctx.beginPath(); ctx.arc(540 - 440 - k * 30, 840, 60 + k * 30, Math.PI - 0.4, Math.PI + 0.4); } ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 20 + k); ctx.stroke(); } ctx.restore(); }
      label('NEVER FULLY STILL', 540, 300, tag(lt, sl), -0.04, 56); label('QUANTUM JIGGLE', 540, 1440, tag(lt, qu), 0.03, 64, '#FBF6E8', '#2E6A9A');
    } });
    cue(st, 'whoosh'); cue(st + qu, 'boing', { gain: 0.35 }); }

  // 6a · scientists got crazy close (laser cooling chamber in a lab)
  { const st = cut(5), sc = at('scientists', 5), cl = at('close', 5);
    add({ id: 'S06', at: st, cam: [540, 860], zoom: 0.07, note: 'a lab vacuum chamber where six laser beams cross on a tiny glowing cloud of atoms; a thermometer next to it sits right on the bottom line: GOT CRAZY CLOSE', draw(lt, d, t) {
      lab();
      const B6 = { x: 140, y: 470, w: 620, h: 720 };
      chamber(B6, () => {
        const cx = B6.x + B6.w / 2, cy = B6.y + B6.h / 2;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const a of [0, Math.PI / 3, -Math.PI / 3]) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); const g = ctx.createLinearGradient(0, -22, 0, 22); g.addColorStop(0, 'rgba(255,90,60,0)'); g.addColorStop(0.5, 'rgba(255,110,70,0.55)'); g.addColorStop(1, 'rgba(255,90,60,0)'); ctx.fillStyle = g; ctx.fillRect(-700, -22, 1400, 44); ctx.restore(); } ctx.restore();
        atomCloud(cx, cy, 1, 0.1, t);
      }, { frost: 0.6, glow: 0.6 });
      thermo(905, 560, 560, 0.035, 1, { cardW: 120, ticks: 6 });
      ctx.save(); ctx.strokeStyle = '#E25A4A'; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(830, 1120); ctx.lineTo(980, 1120); ctx.stroke(); ctx.restore();
      label('SCIENTISTS', 450, 300, tag(lt, sc), -0.04, 56); label('CRAZY CLOSE', 540, 1440, tag(lt, cl), 0.03, 64, '#FBF6E8', '#C8322B');
    } });
    cue(st, 'whoosh'); cue(st + sc, 'zip', { gain: 0.35 }); cue(st + cl, 'pop'); }

  // 6b · Germany: a drop tower, rubidium atoms fall, 38 trillionths of a degree
  { const st = Wd('germany', 5) - 0.15, ge = Wd('germany', 5) - st, dr = Wd('dropped', 5) - st, tw = Wd('tower', 5) - st, th = Wd('thirty', 5) - st, tr = Wd('trillionths', 5) - st;
    add({ id: 'S06b', at: st, cam: [540, 820], zoom: 0.05, note: 'a tall white drop tower with a glass cap (Bremen, Germany); a cut-away window shows a capsule falling down the tube with a glowing atom cloud; 38 TRILLIONTHS OF A DEGREE', draw(lt, d, t) {
      ctx.fillStyle = '#8DB6CF'; ctx.fillRect(-600, -600, W + 1200, H + 1200); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = PAT; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore();
      for (let i = 0; i < 3; i++) { const cx0 = ((i * 420 + t * 12) % 1400) - 200, cy0 = 300 + i * 230; const p = new Path2D(); for (const [dx, dy, r] of [[-60, 0, 50], [0, -28, 66], [62, 0, 48]]) { p.moveTo(cx0 + dx + r, cy0 + dy); p.arc(cx0 + dx, cy0 + dy, r, 0, TAU); } piece(p, '#F4F1E8', 0.4); }
      const fall = seg(lt, dr, th + 0.4), [cx, cy] = dropTower(t, fall, { x: 330 });
      // zoom bubble: the capsule's atom cloud
      const zk = eob(seg(lt, tw, tw + 0.4));
      if (zk > 0) { ctx.save(); ctx.strokeStyle = 'rgba(250,244,228,0.8)'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(cx + 30, cy); ctx.lineTo(760 - 170 * zk, 760); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(760, 760); ctx.scale(zk, zk); piece(CIR(0, 0, 200), '#14202C', 1); ctx.save(); ctx.clip(CIR(0, 0, 196)); atomCloud(0, 0, 1, seg(lt, tw, th + 0.6), t); ctx.restore(); ctx.strokeStyle = '#F7EFDC'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 200, 0, TAU); ctx.stroke(); ctx.restore(); }
      label('GERMANY', 760, 300, tag(lt, ge), 0.04, 58); label('RUBIDIUM ATOMS', 760, 1010, tag(lt, dr + 0.4), -0.03, 44, '#FBF6E8', '#2E6A9A');
      label('38 TRILLIONTHS', 700, 1200, tag(lt, th), -0.03, 58, '#FBF6E8', '#C8322B'); label('OF A DEGREE ABOVE ZERO', 700, 1310, tag(lt, tr + 0.2), 0.02, 40);
      label('0.000000000038 K', 540, 1450, tag(lt, tr + 0.5), -0.02, 48, '#FBF6E8', '#2E6A9A');
    } });
    cue(st, 'whoosh'); cue(st + dr, 'slide', { dur: 1.0, gain: 0.4 }); cue(st + tw, 'pop'); cue(st + th, 'thud', { gain: 0.5 }); }

  // 7 · that's way colder than outer space
  { const st = cut(6), co = at('colder', 6), spc = at('space', 6);
    add({ id: 'S07', at: st, cam: [540, 820], zoom: 0.06, note: 'deep space with stars and a paper Earth; two slips: DEEP SPACE 2.7 K vs THE LAB 0.000000000038 K; the lab slip wins (COLDER)', draw(lt, d, t) {
      plain('#0E1724'); stars(t, 160);
      ctx.save(); ctx.translate(880, 1300); piece(CIR(0, 0, 300), '#3F7FB5', 1); ctx.save(); ctx.clip(CIR(0, 0, 300)); for (const [ex, ey, rx, ry] of [[-120, -100, 120, 70], [60, 40, 140, 90], [-60, 160, 90, 50]]) piece(ELL(ex, ey, rx, ry, 0.4), '#5E9A58', 0.3, false); ctx.fillStyle = 'rgba(0,0,20,0.35)'; ctx.beginPath(); ctx.arc(80, 60, 300, 0, TAU); ctx.fill(); ctx.restore(); ctx.restore();
      label('DEEP SPACE: 2.7 K', 380, 520, tag(lt, 0.15), -0.04, 52); label('THE LAB: 0.000000000038 K', 540, 760, tag(lt, co), 0.03, 46, '#FBF6E8', '#2E6A9A');
      label('WAY COLDER', 540, 960, tag(lt, spc), -0.03, 70, '#FBF6E8', '#C8322B');
    } });
    cue(st, 'whoosh'); cue(st + co, 'pop'); cue(st + spc, 'sparkle', { dur: 0.8, gain: 0.35 }); }

  // 8 · matter turns weird: atoms merge into one giant atom
  { const st = cut(7), we = at('weird', 7), me = at('merge', 7), gi = at('giant', 7);
    add({ id: 'S08', at: st, cam: [540, 860], zoom: 0.05, note: 'a magnetic trap (paper bowl with copper coils) holds slow blue atoms; they slide together, swell into soft waves and merge into one big glowing blob with ripples: ONE GIANT ATOM, BOSE-EINSTEIN CONDENSATE', draw(lt, d, t) {
      lab('#1A2633'); trap(540, 1150, 640, t, seg(lt, me - 0.4, me));
      const k = eio(seg(lt, me - 0.2, gi)), N = 12, box = { x: 260, y: 640, w: 560, h: 420 }, P0 = gasPts(box, N, t * 0.35, { r: 34 });
      P0.forEach(([x, y], i) => { const tx = 540 + (R2(i + 3) - 0.5) * 120, ty = 900 + (R2(i + 8) - 0.5) * 80; const ax = lerp(x, tx, k), ay = lerp(y, ty, k), wob = lt > we - 0.2 ? Math.sin(t * 9 + i) * 5 : 0; if (k > 0.3) condensate(ax, ay, 34 + 40 * k, t + i, 0.5 * (1 - seg(k, 0.8, 1))); atom(ax + wob, ay, 34, 1, { i, spin: t * 0.8, a: 1 - seg(k, 0.4, 0.85) }); });
      condensate(540, 900, 230 * eob(seg(lt, gi - 0.5, gi + 0.3)), t, 1);
      label('WEIRD', 540, 300, tag(lt, we), -0.04, 70, '#FBF6E8', '#B0406A'); label('ONE GIANT ATOM', 540, 1300, tag(lt, gi), 0.03, 62, '#FBF6E8', '#2E6A9A');
      label('BOSE-EINSTEIN CONDENSATE', 540, 1440, tag(lt, gi + 0.5), -0.02, 40);
    } });
    cue(st, 'whoosh'); cue(st + we, 'boing', { gain: 0.35 }); cue(st + me, 'sparkle', { dur: 1.2, gain: 0.4 }); cue(st + gi, 'pop', { gain: 0.8 }); }

  // 9 · superfluid helium: zero friction, climbs the walls and escapes
  { const st = cut(8), he = at('helium', 8), fr = at('friction', 8), cr = at('creeps', 8), ou = at('out', 8);
    add({ id: 'S09', at: st, cam: [540, 860], zoom: 0.05, note: 'a glass beaker of liquid helium on a steel stand: the liquid swirls on and on (ZERO FRICTION), then a glowing thin film climbs the inside wall, over the rim, down the outside, and drips off the bottom into a puddle', draw(lt, d, t) {
      lab('#1C2836');
      const film = seg(lt, cr - 0.3, ou + 0.1);
      heliumCup(t, { swirl: 1 - seg(lt, cr - 0.4, cr), film, drip: film >= 1 ? lt : null, pool: seg(lt, ou + 0.2, d + 0.3) * 0.7 });
      label('LIQUID HELIUM', 540, 300, tag(lt, he), -0.04, 56); label('BELOW 2.17 K', 540, 420, tag(lt, he + 0.4), 0.03, 40, '#FBF6E8', '#2E6A9A');
      label('ZERO FRICTION', 540, 1440, tag(lt, fr) * (1 - seg(lt, cr - 0.3, cr)), 0.03, 62, '#FBF6E8', '#C8322B');
      label('CLIMBS THE WALLS', 540, 1440, tag(lt, cr), -0.03, 58, '#FBF6E8', '#2E6A9A');
    } });
    cue(st, 'whoosh'); cue(st + fr, 'slide', { dur: 1.0, gain: 0.3 }); cue(st + cr, 'zip', { gain: 0.35 }); cue(st + ou + 0.3, 'plop', { gain: 0.5 }); cue(st + ou + 0.8, 'plop', { gain: 0.45 }); }

  // 10 · you can never touch it, but the closer you get, the stranger the universe gets
  { const st = cut(9), to = at('touch', 9), cl = at('closer', 9), sr = at('stranger', 9), un = at('universe', 9);
    add({ id: 'S10', at: st, cam: [540, 860], zoom: 0.03, note: 'back to the frosted chamber, atoms almost still, a thermometer a hair above the red zero line: NEVER TOUCH IT; on STRANGER the atoms glow and merge; on UNIVERSE the camera pulls back into a starry sky', draw(lt, d, t) {
      plain('#0E1724'); const z = lerp(1, 0.42, eio(seg(lt, un - 0.4, d)));
      stars(t, 160, seg(lt, un - 0.6, un));
      ctx.save(); ctx.translate(540, 860); ctx.scale(z, z); ctx.translate(-540, -860);
      ctx.save(); ctx.globalAlpha = 1 - seg(lt, un - 0.4, un + 0.4); lab(); ctx.restore();
      const B10 = { x: 120, y: 470, w: 640, h: 760 }, mk = eio(seg(lt, sr - 0.3, sr + 0.6));
      chamber(B10, () => { gas(B10, 9, 0.1 * t, t, { k: 1, jig: 3, frost: 0.8, a: 1 - mk }); condensate(B10.x + B10.w / 2, B10.y + B10.h / 2, 200 * mk, t, mk); }, { frost: 1, glow: 1 });
      thermo(910, 560, 560, 0.035, 1, { cardW: 120, ticks: 6 });
      ctx.save(); ctx.strokeStyle = '#E25A4A'; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(835, 1120); ctx.lineTo(985, 1120); ctx.stroke(); ctx.restore();
      ctx.restore();
      label('NEVER TOUCH IT', 540, 170, tag(lt, to) * (1 - seg(lt, un - 0.4, un)), -0.04, 60, '#FBF6E8', '#C8322B');
      label('STRANGER', 540, 1440, tag(lt, sr), 0.03, 70, '#FBF6E8', '#2E6A9A');
    } });
    cue(st, 'whoosh'); cue(st + to, 'thud', { gain: 0.5 }); cue(st + sr, 'sparkle', { dur: 1.2, gain: 0.4 }); cue(st + un, 'whoosh'); }

  return { shots: S, cues: CUES };
}
