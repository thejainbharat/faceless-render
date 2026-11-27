// FIVE ANIMALS THAT REGROW LOST BODY PARTS : paper cut-out animation.
// Five animals drawn in layered cut paper (planarian, sea cucumber, zebrafish, axolotl, comet sea star) plus a heart cutaway.
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
  if (sc <= 0) return; ctx.save(); ctx.font = `700 ${size}px ${SERIF}`; const w0 = ctx.measureText(text).width + 60; x = clamp(x, w0 / 2 + 95, W - w0 / 2 - 95); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.font = `700 ${size}px ${SERIF}`;
  const w = ctx.measureText(text).width + 60, p = new Path2D(); p.moveTo(-w / 2, -size * 0.8); for (let i = 0; i <= 10; i++) p.lineTo(-w / 2 + w * i / 10, -size * 0.8 + (rnd(i + text.length) - 0.5) * 8); p.lineTo(w / 2, size * 0.8); for (let i = 10; i >= 0; i--) p.lineTo(-w / 2 + w * i / 10, size * 0.8 + (rnd(i + 30) - 0.5) * 8); p.closePath();
  piece(p, fill, 0.7); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 4); pin(0, -size * 0.8 + 6, 7); ctx.restore();
}
const view = (cx, cy, z) => { ctx.translate(540, 820); ctx.scale(z, z); ctx.translate(-cx, -cy); };
const lrp = (a, b, k) => a + (b - a) * k;


// ── backgrounds ────────────────────────────────────────────────────────────
function plainBG(c1, c2) { const g = ctx.createLinearGradient(0, -200, 0, H + 200); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(-700, -700, W + 1400, H + 1400); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = PAT; ctx.fillRect(-700, -700, W + 1400, H + 1400); ctx.restore(); }
function bubblesFx(t, n = 26, col = 'rgba(230,250,255,0.5)') { for (let i = 0; i < n; i++) { const px = R2(i + 100) * 1100 - 10 + Math.sin(t * 0.8 + i) * 16, py = ((R2(i + 101) * 2200 - t * (40 + R2(i + 102) * 50)) % 2200 + 2200) % 2200 - 150; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 5 + R2(i + 103) * 14, 0, TAU); ctx.stroke(); } }
function weed(x, base, h, t, i, col) { const p = new Path2D(); const sw = (k) => Math.sin(t * 0.9 + i + k * 2.2) * 28 * k; p.moveTo(x - 26, base); for (let k = 0; k <= 8; k++) p.lineTo(x - 22 + sw(k / 8), base - h * k / 8); for (let k = 8; k >= 0; k--) p.lineTo(x + 22 + sw(k / 8), base - h * k / 8); p.closePath(); piece(p, col, 0.8); }
function seaBG(t, o = {}) {
  const tone = o.tone || 'deep';
  const pal = { deep: ['#1B4F66', '#0B2A3C', '#3F6E6A', '#B59A6A'], reef: ['#2C8AA0', '#14566E', '#2E8A6A', '#D4B67A'], pond: ['#4F8F5A', '#1E4A3A', '#2E6A3A', '#8A7A52'], tank: ['#3C7DA8', '#16405E', '#3A8A5A', '#C9B58A'] }[tone];
  plainBG(pal[0], pal[1]);
  ctx.save(); ctx.globalAlpha = 0.13; for (let i = 0; i < 5; i++) { ctx.fillStyle = '#E8FFF8'; ctx.beginPath(); ctx.moveTo(80 + i * 250 + Math.sin(t * 0.5 + i) * 50, -600); ctx.lineTo(240 + i * 250, -600); ctx.lineTo(-100 + i * 220, H + 600); ctx.lineTo(-300 + i * 220, H + 600); ctx.fill(); } ctx.restore();
  for (let i = 0; i < 7; i++) weed(40 + i * 180 + R2(i) * 80, 1500, 380 + R2(i + 4) * 420, t, i, i % 2 ? pal[2] : '#27604A'); // far weeds
  const sand = new Path2D(); sand.moveTo(-100, 1560); for (let k = 0; k <= 12; k++) sand.lineTo(-100 + k * 110, 1520 + Math.sin(k * 1.3) * 30 + R2(k) * 20); sand.lineTo(W + 100, H + 100); sand.lineTo(-100, H + 100); sand.closePath(); piece(sand, pal[3], 1.2);
  for (let i = 0; i < 12; i++) piece(ELL(R2(i + 20) * 1080, 1620 + R2(i + 21) * 260, 30 + R2(i + 22) * 50, 16 + R2(i + 23) * 22, R2(i) - 0.5), i % 3 ? '#8E7C5A' : '#6E6A60', 0.7);
  if (o.rocks) { piece(POLY([[-60, 1500], [120, 1220], [300, 1180], [420, 1500]]), '#4E5A5E', 1.4); piece(POLY([[760, 1520], [880, 1260], [1010, 1220], [1160, 1520]]), '#566468', 1.4); }
  bubblesFx(t);
  for (let i = 0; i < 30; i++) { const px = (R2(i) * 1200 + t * 8) % 1200 - 60, py = ((R2(i + 2) * 2000 - t * 9) % 2000 + 2000) % 2000; piece(CIR(px, py, 2 + R2(i + 3) * 3), 'rgba(235,255,245,0.4)', 0, false); }
}
function petriBG(t) {
  plainBG('#D8E4E6', '#A8BCC4');
  for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-60, i * 60 - 20, W + 120, 3); }
  ctx.save(); ctx.shadowColor = 'rgba(20,40,50,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; ctx.fillStyle = '#EAF6F4'; ctx.beginPath(); ctx.arc(540, 860, 660, 0, TAU); ctx.fill(); ctx.restore();
  const g = ctx.createRadialGradient(480, 760, 80, 540, 860, 620); g.addColorStop(0, '#CDEBEA'); g.addColorStop(1, '#8FC3C6'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(540, 860, 620, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(540, 860, 645, 0.2, 1.3); ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(540 + Math.sin(t * 0.5 + i) * 6, 860, 120 + i * 90, 0.4 + i, 1.4 + i); ctx.stroke(); } ctx.restore();
}

// ── generic tube / ribbon along a spine ────────────────────────────────────
function tubePath(sp) { const p = new Path2D(), n = sp.length, nm = (i) => { const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  sp.forEach((q, i) => { const m = nm(i); i ? p.lineTo(q[0] + m[0] * q[2], q[1] + m[1] * q[2]) : p.moveTo(q[0] + m[0] * q[2], q[1] + m[1] * q[2]); });
  for (let i = n - 1; i >= 0; i--) { const q = sp[i], m = nm(i); p.lineTo(q[0] - m[0] * q[2], q[1] - m[1] * q[2]); } p.closePath(); return p; }

// ── PLANARIAN (flatworm). Local: head at -x. o: { t, amp, u0, u1, hk, tk, cut } ──────────────────────────────────
function worm(x, y, rot, len, wid, o = {}) {
  const t = o.t || 0, u0 = o.u0 ?? 0, u1 = o.u1 ?? 1, amp = o.amp ?? 0.05, N = 28, sp = [];
  const prof = (u) => (u < 0.12 ? 0.22 + 0.78 * Math.pow(u / 0.12, 0.7) : u < 0.45 ? 1 : 1 - Math.pow((u - 0.45) / 0.55, 1.5) * 0.94);
  for (let i = 0; i <= N; i++) { const u = lrp(u0, u1, i / N); sp.push([(u - 0.5) * len, Math.sin(u * 6 + t * 2.2) * amp * len, wid * prof(u)]); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const body = tubePath(sp);
  // new tissue caps (regrown head / tail): pale, grow with hk / tk
  const A = sp[0], Z = sp[N], ta = Math.atan2(sp[1][1] - A[1], sp[1][0] - A[0]), tz = Math.atan2(Z[1] - sp[N - 1][1], Z[0] - sp[N - 1][0]);
  const cap = (P, ang, k, head) => { if (k <= 0) return; const l = (head ? 0.1 : 0.22) * len * k, w = P[2] * (head ? 1 : 0.9); ctx.save(); ctx.translate(P[0], P[1]); ctx.rotate(ang);
    const c = new Path2D(); if (head) { c.moveTo(0, -w); c.bezierCurveTo(-l * 0.5, -w * 1.05, -l, -w * 0.4, -l, 0); c.bezierCurveTo(-l, w * 0.4, -l * 0.5, w * 1.05, 0, w); } else { c.moveTo(0, -w); c.bezierCurveTo(l * 0.5, -w * 0.9, l * 0.9, -w * 0.2, l, 0); c.bezierCurveTo(l * 0.9, w * 0.2, l * 0.5, w * 0.9, 0, w); } c.closePath(); piece(c, k < 1 ? '#E9C9A6' : '#C99A6C', 0.5);
    if (head && k > 0.55) { const e = Math.min(1, (k - 0.55) / 0.3); for (const s of [-1, 1]) { piece(CIR(-l * 0.62, s * w * 0.28, 15 * e), '#FFFFFF', 0, false); piece(CIR(-l * 0.64, s * w * 0.28, 7 * e), '#1A1410', 0, false); } }
    ctx.restore(); };
  if (u0 > 0) cap(A, ta, o.hk || 0, true); if (u1 < 1) cap(Z, tz, o.tk || 0, false);
  const gr = ctx.createLinearGradient(0, -wid, 0, wid); gr.addColorStop(0, '#9A6E48'); gr.addColorStop(0.5, '#D2A06C'); gr.addColorStop(1, '#8A5E3C');
  piece(body, gr, 1.0);
  ctx.save(); ctx.clip(body);
  stroke(sp.map((q) => [q[0], q[1]]), 'rgba(70,40,20,0.35)', wid * 0.45);
  stroke(sp.map((q) => [q[0], q[1] - q[2] * 0.45]), 'rgba(255,235,200,0.35)', wid * 0.14);
  for (let i = 0; i < 70; i++) { const q = sp[Math.floor(R2(i + 5) * N)]; piece(CIR(q[0] + (R2(i) - 0.5) * q[2] * 1.7, q[1] + (R2(i + 9) - 0.5) * q[2] * 1.7, 2 + R2(i + 3) * 3), 'rgba(60,34,18,0.35)', 0, false); }
  if (u0 < 0.55 && u1 > 0.45) { const m = sp[Math.round((0.52 - u0) / (u1 - u0) * N)] || sp[N >> 1]; piece(ELL(m[0], m[1], wid * 0.55, wid * 0.2, 0), 'rgba(250,236,214,0.65)', 0, false); }
  ctx.restore();
  if (u0 === 0) { // natural head: triangular tip, two eyespots and little ear lobes
    const h = sp[2], hh = sp[4];
    for (const s of [-1, 1]) { const q = new Path2D(); q.moveTo(sp[5][0] - 6, sp[5][1] + s * sp[5][2] * 0.8); q.lineTo(sp[5][0] + wid * 0.55, sp[5][1] + s * (sp[5][2] + wid * 0.34)); q.lineTo(sp[5][0] + wid * 0.5, sp[5][1] + s * sp[5][2] * 0.5); q.closePath(); piece(q, '#B98458', 0.4); }
    for (const s of [-1, 1]) { piece(CIR(hh[0], hh[1] + s * hh[2] * 0.42, wid * 0.2), '#FFFDF4', 0.3, false); piece(CIR(hh[0] - wid * 0.04, hh[1] + s * hh[2] * 0.42, wid * 0.1), '#1A1410', 0, false); }
  } else if (o.cut !== false) stroke([[sp[0][0], sp[0][1] - sp[0][2]], [sp[0][0], sp[0][1] + sp[0][2]]], 'rgba(255,255,255,0.85)', 5);
  if (u1 < 1 && o.cut !== false) stroke([[Z[0], Z[1] - Z[2]], [Z[0], Z[1] + Z[2]]], 'rgba(255,255,255,0.85)', 5);
  ctx.restore();
}

// ── SEA CUCUMBER. Side view, mouth (tentacles) at +x, rear at -x. o: { t, evis, inside, wob } ───────────────
function cucumber(x, y, s, o = {}) {
  const t = o.t || 0, ev = o.evis || 0; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0);
  // expelled strands first (behind the body): sticky pink and white noodles shooting out of the rear
  if (ev > 0) for (let i = 0; i < 9; i++) { const ln = (260 + R2(i + 40) * 300) * ev, ph = R2(i) * 6, pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16; pts.push([-300 - u * ln, (R2(i + 3) - 0.5) * 80 * u + Math.sin(u * 7 + ph + t * 3) * 36 * u + (i - 4) * 9 * u]); }
    stroke(pts, i % 3 === 0 ? '#9C4E5E' : '#6A3040', 20 - i % 3 * 2); stroke(pts, i % 3 === 0 ? '#F0A6B0' : i % 3 === 1 ? '#F6E8DA' : '#E8B4A0', 14 - i % 3 * 2); stroke(pts.map((q) => [q[0], q[1] - 3]), 'rgba(255,255,255,0.5)', 4); }
  // tube feet along the belly
  for (let i = 0; i < 22; i++) { const px = -250 + i * 26, wv = Math.sin(t * 4 + i) * 5; stroke([[px, 80], [px + wv, 112 + (i % 2) * 8]], '#7A5A38', 11); piece(CIR(px + wv, 116 + (i % 2) * 8, 9), '#E8C690', 0, false); }
  const b = new Path2D(); b.moveTo(-310, 6); b.bezierCurveTo(-310, -112, -150, -128, 20, -122); b.bezierCurveTo(190, -118, 300, -92, 318, -6); b.bezierCurveTo(300, 84, 170, 104, 10, 100); b.bezierCurveTo(-150, 104, -310, 90, -310, 6); b.closePath();
  const g = ctx.createLinearGradient(0, -120, 0, 104); g.addColorStop(0, '#3E2C1C'); g.addColorStop(0.55, '#7A5A38'); g.addColorStop(1, '#C49A66');
  piece(b, g, 1.2);
  ctx.save(); ctx.clip(b);
  for (let i = 0; i < 46; i++) { const px = -290 + R2(i) * 600, py = -110 + R2(i + 7) * 170, r = 9 + R2(i + 3) * 14; const w = new Path2D(); w.moveTo(px - r, py + r * 0.5); w.lineTo(px, py - r * 1.1); w.lineTo(px + r, py + r * 0.5); w.closePath(); piece(w, '#C9824A', 0.35, false); stroke([[px - r * 0.3, py - r * 0.4], [px, py - r * 0.9]], 'rgba(255,225,170,0.8)', 3); }
  for (let i = 0; i < 80; i++) piece(CIR(-300 + R2(i + 90) * 620, -100 + R2(i + 91) * 190, 2 + R2(i + 92) * 3), 'rgba(30,18,8,0.4)', 0, false);
  piece(ELL(-10, -78, 250, 20, -0.03), 'rgba(255,240,210,0.22)', 0, false);
  if (o.inside) { // cutaway window: translucent body, pink intestine coil growing back
    const k = o.inside, win = new Path2D(); win.roundRect(-220, -80, 400, 150, 70); piece(win, '#F2DCC4', 0.3); ctx.save(); ctx.clip(win);
    const coil = []; for (let i = 0; i <= 60; i++) { const u = i / 60; coil.push([-210 + u * 380, Math.sin(u * 22) * 34 * (0.4 + u * 0.6) + 6]); }
    const n = Math.max(2, Math.round(coil.length * k)); stroke(coil.slice(0, n), '#A8506A', 28); stroke(coil.slice(0, n), '#F09AAE', 20); stroke(coil.slice(0, n).map((q) => [q[0], q[1] - 5]), 'rgba(255,255,255,0.45)', 5);
    ctx.restore(); stroke([[-220, -10]], '#000', 0); }
  ctx.restore();
  // mouth crown of feathery tentacles
  for (let i = 0; i < 9; i++) { const a = -1.2 + i * 0.3 + Math.sin(t * 2 + i) * 0.07, bx = 312, by = -6; let px = bx, py = by; const L1 = 80 + (i % 3) * 14; const ex = bx + Math.cos(a) * L1, ey = by + Math.sin(a) * L1;
    stroke([[bx, by], [ex, ey]], '#6A4A2A', 15); stroke([[bx, by], [ex, ey]], '#D6A468', 10);
    for (let k = 0; k < 5; k++) { const u = (k + 1) / 6, qx = lrp(bx, ex, u), qy = lrp(by, ey, u); for (const sd of [-1, 1]) stroke([[qx, qy], [qx + Math.cos(a + sd * 0.9) * 28, qy + Math.sin(a + sd * 0.9) * 28]], '#E8C58E', 5); } piece(CIR(ex, ey, 9), '#F2D8A8', 0, false); }
  ctx.restore();
}

// ── ZEBRAFISH (side view, faces right) ─────────────────────────────────────
function zebrafish(x, y, s, o = {}) {
  const t = o.t || 0, sw = Math.sin(t * 5) * 0.06; ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  // tail fin (forked, with rays and stripes) swishing
  ctx.save(); ctx.translate(-250, 0); ctx.rotate(sw * 2.2);
  const tf = new Path2D(); tf.moveTo(40, -10); tf.bezierCurveTo(-30, -60, -110, -110, -190, -100); tf.bezierCurveTo(-150, -50, -140, -20, -120, 0); tf.bezierCurveTo(-140, 20, -150, 50, -190, 100); tf.bezierCurveTo(-110, 110, -30, 60, 40, 10); tf.closePath();
  piece(tf, '#BFD8EE', 0.8); ctx.save(); ctx.clip(tf); for (let i = -6; i <= 6; i++) stroke([[40, i * 2], [-190, i * 17]], 'rgba(40,80,150,0.4)', 3); stroke([[-20, -50], [-170, -60]], '#2F4E8F', 12); stroke([[-20, 50], [-170, 60]], '#2F4E8F', 12); stroke([[0, 0], [-130, 0]], '#E4B84A', 9); ctx.restore(); ctx.restore();
  // dorsal + anal fins
  const df = new Path2D(); df.moveTo(70, -86); df.lineTo(-10, -170); df.quadraticCurveTo(-50, -130, -110, -84); df.closePath(); piece(df, '#CFE2F2', 0.6); for (let i = 0; i < 6; i++) stroke([[60 - i * 24, -88 + i * 3], [-4 - i * 18, -160 + i * 14]], 'rgba(40,80,150,0.5)', 2.5);
  const af = new Path2D(); af.moveTo(50, 82); af.lineTo(-30, 160); af.quadraticCurveTo(-60, 120, -120, 74); af.closePath(); piece(af, '#CFE2F2', 0.6); for (let i = 0; i < 5; i++) stroke([[40 - i * 20, 82 - i * 2], [-26 - i * 16, 150 - i * 14]], 'rgba(40,80,150,0.5)', 2.5);
  // body
  const b = new Path2D(); b.moveTo(-262, -8); b.bezierCurveTo(-170, -88, 20, -108, 190, -62); b.bezierCurveTo(262, -40, 300, -8, 306, 8); b.bezierCurveTo(290, 36, 240, 70, 150, 84); b.bezierCurveTo(10, 106, -170, 78, -262, 8); b.closePath();
  const g = ctx.createLinearGradient(0, -100, 0, 90); g.addColorStop(0, '#9FB6C8'); g.addColorStop(0.5, '#E4EEF4'); g.addColorStop(1, '#F4F0E4'); piece(b, g, 1.2);
  ctx.save(); ctx.clip(b);
  for (let i = -2; i <= 2; i++) { const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([-270 + u * 560, i * 26 + 2 + (i * 8) * (1 - Math.abs(u - 0.5) * 2 - 0.5) * 0.2 + Math.sin(u * 3 + t * 5 - i) * 4]); } stroke(pts, i === 0 ? '#E4B84A' : '#2F4E8F', i === 0 ? 10 : 12); stroke(pts.map((q) => [q[0], q[1] - 3]), 'rgba(160,190,235,0.45)', 4); }
  for (let r = 0; r < 7; r++) for (let c = 0; c < 18; c++) { const px = -250 + c * 32 + (r % 2) * 16, py = -78 + r * 25; ctx.beginPath(); ctx.arc(px, py, 14, 0.3, Math.PI - 0.3); ctx.strokeStyle = 'rgba(20,40,80,0.18)'; ctx.lineWidth = 2; ctx.stroke(); }
  piece(ELL(20, -76, 210, 14, -0.04), 'rgba(255,255,255,0.45)', 0, false);
  ctx.restore();
  // gill cover, eye, mouth, pectoral fin, barbels
  stroke([[190, -50], [160, 0], [190, 52]], 'rgba(30,60,100,0.45)', 6); piece(ELL(206, -2, 8, 44, 0.05), 'rgba(255,255,255,0.18)', 0, false);
  piece(CIR(250, -16, 26), '#E8C24A', 0.4, false); piece(CIR(252, -16, 17), '#10161C', 0, false); piece(CIR(246, -24, 6), '#FFFFFF', 0, false);
  stroke([[300, 14], [268, 22]], '#4A3A32', 5); stroke([[296, 10], [330, 28]], '#E4B84A', 6); stroke([[290, 22], [322, 44]], '#E4B84A', 6);
  ctx.save(); ctx.translate(150, 38); ctx.rotate(0.4 + Math.sin(t * 6) * 0.25); const pf = new Path2D(); pf.moveTo(0, 0); pf.bezierCurveTo(-30, 30, -80, 50, -100, 44); pf.bezierCurveTo(-80, 20, -40, -4, 0, 0); piece(pf, 'rgba(210,228,244,0.9)', 0.5); ctx.restore();
  ctx.restore();
}

// ── AXOLOTL (top-down: head at +x, tail at -x). o: { t, leg (front-left regrowth 0..1, 1 = whole), gills } ──────────
function axLeg(ax, ay, ang, k, sc = 1) {
  if (k <= 0.02) { piece(ELL(ax, ay, 18 * sc, 14 * sc), '#F0A2A0', 0.4, false); return; }
  const l1 = 70 * sc * Math.min(1, k * 1.4), l2 = 62 * sc * clamp((k - 0.2) / 0.5), seg1 = [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1];
  const pale = k < 1 ? '#F7C6C0' : '#F2B8B2';
  stroke([[ax, ay], seg1], '#B86F74', 36 * sc * (0.7 + 0.3 * k)); stroke([[ax, ay], seg1], pale, 30 * sc * (0.7 + 0.3 * k));
  if (l2 > 4) { const e = [seg1[0] + Math.cos(ang + 0.5) * l2, seg1[1] + Math.sin(ang + 0.5) * l2]; stroke([seg1, e], '#B86F74', 30 * sc); stroke([seg1, e], pale, 24 * sc);
    const nf = k > 0.65 ? 4 : 0, fk = clamp((k - 0.65) / 0.3); for (let i = 0; i < nf; i++) { const fa = ang + 0.5 + (i - 1.5) * 0.4, fl = 40 * sc * fk; stroke([e, [e[0] + Math.cos(fa) * fl, e[1] + Math.sin(fa) * fl]], '#B86F74', 12 * sc); stroke([e, [e[0] + Math.cos(fa) * fl, e[1] + Math.sin(fa) * fl]], '#F7C6C0', 8 * sc); }
    if (k < 0.65) piece(CIR(e[0], e[1], 22 * sc), '#F7C6C0', 0.3, false); }
}
function axolotl(x, y, s, o = {}) {
  const t = o.t || 0, lk = o.leg ?? 1; ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  // tail with a thin fin
  const tl = []; for (let i = 0; i <= 20; i++) { const u = i / 20; tl.push([-90 - u * 380, Math.sin(u * 4 + t * 2.4) * 40 * u, 56 * (1 - u * 0.86)]); }
  const fin = tubePath(tl.map((q) => [q[0], q[1], q[2] + 22])); piece(fin, 'rgba(250,200,196,0.8)', 0.5);
  piece(tubePath(tl), '#F4C2BC', 1.0); stroke(tl.map((q) => [q[0], q[1]]), 'rgba(184,111,116,0.45)', 8);
  // legs behind (hind) and front, far side first
  axLeg(-80, 66, 1.5 + Math.sin(t * 3) * 0.1, 1, 1); axLeg(-80, -66, -1.5 - Math.sin(t * 3) * 0.1, 1, 1);
  axLeg(120, 70, 1.2, 1, 1);
  // body
  const b = new Path2D(); b.moveTo(-110, 0); b.bezierCurveTo(-110, -78, -10, -92, 80, -86); b.bezierCurveTo(170, -80, 190, -40, 190, 0); b.bezierCurveTo(190, 40, 170, 80, 80, 86); b.bezierCurveTo(-10, 92, -110, 78, -110, 0); b.closePath();
  const g = ctx.createLinearGradient(0, -90, 0, 90); g.addColorStop(0, '#E8A8A4'); g.addColorStop(0.5, '#FADAD2'); g.addColorStop(1, '#E8A8A4'); piece(b, g, 1.1);
  ctx.save(); ctx.clip(b); stroke([[-100, 0], [180, 0]], 'rgba(184,111,116,0.35)', 12); for (let i = 0; i < 60; i++) piece(CIR(-100 + R2(i) * 290, -84 + R2(i + 8) * 170, 2 + R2(i + 3) * 4), i % 3 ? 'rgba(200,150,90,0.35)' : 'rgba(255,255,255,0.5)', 0, false); for (let i = 0; i < 6; i++) stroke([[-70 + i * 40, -80], [-70 + i * 40, 80]], 'rgba(184,111,116,0.18)', 3); ctx.restore();
  if (lk < 1) { ctx.save(); ctx.globalAlpha = 0.28; axLeg(120, -70, -1.2, 1, 1); ctx.restore(); }
  axLeg(120, -70, -1.2, lk, 1);
  // head, gills (three feathery fronds each side), eyes, smile
  const h = new Path2D(); h.moveTo(150, -60); h.bezierCurveTo(250, -80, 340, -58, 356, 0); h.bezierCurveTo(340, 58, 250, 80, 150, 60); h.closePath(); piece(h, '#FADAD2', 1.0);
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const a = sd * (1.15 + i * 0.32) + Math.sin(t * 3 + i + sd) * 0.08, bx = 196 + i * 12, by = sd * 56, ex = bx + Math.cos(a) * 2 * 0 - 6 * i + Math.cos(a - sd * 0.5) * 8, L1 = 120 - i * 14;
    const tx = bx + Math.sin(a) * 0 - 20 - i * 6, ty = by + sd * L1; stroke([[bx, by], [tx, ty]], '#B8324A', 10); for (let k = 0; k < 8; k++) { const u = 0.2 + k * 0.1, qx = lrp(bx, tx, u), qy = lrp(by, ty, u), fl = 40 - k * 3; for (const dx of [-1, 1]) stroke([[qx, qy], [qx + dx * fl * 0.8 + Math.sin(t * 4 + k + i) * 5, qy + sd * fl * 0.35]], k % 2 ? '#E8647A' : '#F08A9A', 6); } }
  for (const sd of [-1, 1]) { piece(CIR(288, sd * 46, 14), '#1A1414', 0.2, false); piece(CIR(284, sd * 46 - 4, 4.5), '#FFFFFF', 0, false); }
  ctx.beginPath(); ctx.arc(322, 0, 36, 1.9, 4.38); ctx.strokeStyle = '#B86F74'; ctx.lineWidth = 6; ctx.stroke();
  piece(CIR(350, -8, 4), '#C47A80', 0, false); piece(CIR(350, 8, 4), '#C47A80', 0, false);
  if (o.spine != null) { const k = o.spine, gp = 70 * (1 - k); ctx.save(); ctx.shadowColor = '#6FE8FF'; ctx.shadowBlur = 24; stroke([[-380, 0], [-gp * 0 + 20 - gp, 0]], '#7FEFFF', 14); stroke([[20 + gp, 0], [330, 0]], '#7FEFFF', 14); ctx.restore();
    for (let i = 0; i < 14; i++) { const px = -340 + i * 50; stroke([[px, -22], [px + 6, 22]], 'rgba(200,250,255,0.8)', 4); }
    if (k < 1) { stroke([[20 - gp - 10, -40], [20 + gp + 10, 40]], '#C8322B', 8); stroke([[20 + gp + 10, -40], [20 - gp - 10, 40]], '#C8322B', 8); } else piece(CIR(20, 0, 22 + 6 * Math.sin(t * 8)), 'rgba(255,255,255,0.7)', 0, false); }
  ctx.restore();
}

// ── COMET SEA STAR (Linckia, top-down). o: { t, arms:[{len,ang,dx,dy,rot}], disc, spin } ──────────────────────────
function starArm(len, w0, w1, col1, col2, t, i) {
  const sp = []; for (let k = 0; k <= 14; k++) { const u = k / 14; sp.push([u * len, Math.sin(u * 3 + t * 1.5 + i) * 10 * u, lrp(w0, w1, u) * (k === 14 ? 0.8 : 1)]); }
  const p = tubePath(sp), g = ctx.createLinearGradient(0, -w0, 0, w0); g.addColorStop(0, col2); g.addColorStop(0.5, col1); g.addColorStop(1, col2);
  piece(p, g, 1.0); ctx.save(); ctx.clip(p);
  for (let k = 0; k < 100; k++) { const u = R2(k + i * 31), q = sp[Math.floor(u * 14)]; piece(CIR(q[0] + (R2(k + 3) - 0.5) * q[2] * 1.8, q[1] + (R2(k + 5) - 0.5) * q[2] * 1.8, 2.5 + R2(k + 7) * 3), 'rgba(255,255,255,0.28)', 0, false); }
  stroke(sp.map((q) => [q[0], q[1]]), 'rgba(20,50,110,0.35)', 12); for (let k = 1; k < 13; k++) { const q = sp[k]; stroke([[q[0], q[1] - q[2] * 0.95], [q[0] + 4, q[1] - q[2] * 0.55]], 'rgba(255,240,230,0.85)', 5); stroke([[q[0], q[1] + q[2] * 0.95], [q[0] + 4, q[1] + q[2] * 0.55]], 'rgba(255,240,230,0.85)', 5); }
  ctx.restore(); return sp[14];
}
function seastar(x, y, s, o = {}) {
  const t = o.t || 0, arms = o.arms || [0, 1, 2, 3, 4].map((i) => ({ len: [400, 430, 370, 420, 390][i], ang: -1.57 + i * 1.2566 })); ctx.save(); ctx.translate(x, y); ctx.rotate(o.spin || 0); ctx.scale(s, s);
  arms.forEach((a, i) => { ctx.save(); ctx.translate(a.dx || 0, a.dy || 0); ctx.rotate(a.ang + (a.rot || 0)); starArm(a.len, 46, 30, '#3D78CC', '#2A56A0', t, i); if (a.newArms) { const k = a.newArms; for (let j = 0; j < 4; j++) { ctx.save(); ctx.rotate(-1.4 + j * 0.9); const nl = 200 * k; if (nl > 5) starArm(nl, 30, 18, '#5C94DC', '#3D78CC', t, j + 9); ctx.restore(); } piece(CIR(0, 0, 60 * k + 16), '#4F88D6', 0.5); piece(CIR(-8, -8, 30 * k + 6), '#6FA4E8', 0, false); } ctx.restore(); });
  if (o.disc !== false) { piece(CIR(0, 0, 62), '#3D78CC', 1.0); piece(CIR(-8, -10, 40), '#5B94E0', 0, false); for (let i = 0; i < 40; i++) { const r = 52 * Math.sqrt(R2(i)), a = R2(i + 5) * TAU; piece(CIR(Math.cos(a) * r, Math.sin(a) * r, 3 + R2(i + 7) * 3), 'rgba(255,255,255,0.3)', 0, false); } piece(CIR(26, -22, 14), '#F4A8A0', 0, false); }
  ctx.restore();
}

// ── crab (predator), top-down, facing +y (down). o: { t, claw } ────────────────────────────────────────────────
function crab(x, y, s, o = {}) {
  const t = o.t || 0, cl = o.claw ?? 0; ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  for (const sd of [-1, 1]) { for (let i = 0; i < 3; i++) { const a = 0.3 + i * 0.45, wv = Math.sin(t * 8 + i + sd) * 0.15, e1 = [sd * (90 + Math.cos(a) * 80), -10 + i * 36 + Math.sin(a) * 20]; stroke([[sd * 70, i * 30 - 20], e1, [e1[0] + sd * 40, e1[1] + 50 + wv * 60]], '#7A2A18', 20); stroke([[sd * 70, i * 30 - 20], e1, [e1[0] + sd * 40, e1[1] + 50 + wv * 60]], '#D4583A', 13); }
    // arm + claw
    const el = [sd * 150, 80], hand = [sd * 120, 200]; stroke([[sd * 80, 40], el, hand], '#7A2A18', 30); stroke([[sd * 80, 40], el, hand], '#D4583A', 22);
    ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(sd * 0.2); piece(ELL(0, 30, 48, 62), '#E0663F', 0.8); for (const k of [-1, 1]) { ctx.save(); ctx.translate(k * 20, 80); ctx.rotate(k * (0.05 + cl * 0.45)); piece(POLY([[-14, 0], [14, 0], [6, 80], [-6, 86]]), '#F08A5C', 0.5, false); ctx.restore(); } ctx.restore(); }
  piece(ELL(0, 0, 130, 100), '#C8452A', 1.2); piece(ELL(0, -14, 100, 66), '#E0663F', 0, false); for (let i = 0; i < 18; i++) piece(CIR(-90 + R2(i) * 180, -70 + R2(i + 4) * 130, 4 + R2(i + 1) * 5), 'rgba(255,200,150,0.35)', 0, false);
  stroke([[-70, 30], [0, 52], [70, 30]], 'rgba(120,30,10,0.5)', 6);
  for (const sd of [-1, 1]) { stroke([[sd * 24, 80], [sd * 34, 118]], '#7A2A18', 10); piece(CIR(sd * 34, 122, 14), '#1A1210', 0.2, false); piece(CIR(sd * 30, 118, 4), '#FFFFFF', 0, false); }
  ctx.restore();
}

// ── paper furniture ────────────────────────────────────────────────────────
function badge(n, x, y, sc = 1) {
  if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(-0.06); piece(CIR(0, 0, 118), '#F6EBD0', 1.2); piece(CIR(0, 0, 96), '#C8322B', 0.2, false);
  ctx.fillStyle = '#FBF6E8'; ctx.font = '900 150px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 0, 8); ctx.restore();
}
function medallion(x, y, r, draw, sc = 1, o = {}) {
  if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  piece(CIR(0, 0, r + 16), o.gold ? '#E8B84A' : '#F6EBD0', 1.1); const c = new Path2D(); c.arc(0, 0, r, 0, TAU); ctx.save(); ctx.clip(c);
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, o.c1 || '#2C7C9A'); g.addColorStop(1, o.c2 || '#14405E'); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
  if (!PAT) PAT = paperPattern(); ctx.globalAlpha = 0.4; ctx.fillStyle = PAT; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.globalAlpha = 1; draw(r); ctx.restore(); ctx.restore();
}
function calendar(x, y, s, k, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.04); piece(RR(-260, -200, 520, 400, 24), '#FBF6E8', 1.3); piece(RR(-260, -200, 520, 90, 24), '#C8322B', 0.3, false); piece(RR(-260, -150, 520, 40, 0), '#C8322B', 0, false);
  ctx.fillStyle = '#FBF6E8'; ctx.font = '700 54px Caladea'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A FEW WEEKS', 0, -154);
  const n = Math.round(28 * k); for (let i = 0; i < 28; i++) { const cx = -216 + (i % 7) * 72, cy = -76 + Math.floor(i / 7) * 66; piece(RR(cx - 26, cy - 24, 52, 48, 8), 'rgba(120,100,80,0.14)', 0, false); if (i < n) { stroke([[cx - 18, cy - 16], [cx + 18, cy + 16]], '#C8322B', 7); stroke([[cx + 18, cy - 16], [cx - 18, cy + 16]], '#C8322B', 7); } }
  pin(-200, -208, 12); pin(200, -208, 12); ctx.restore();
}
function heart(x, y, s, o = {}) {
  const t = o.t || 0, beat = 1 + 0.035 * Math.max(0, Math.sin(t * 7)), w = o.wound ?? 0, rg = o.regrow ?? 0; ctx.save(); ctx.translate(x, y); ctx.scale(s * beat, s * beat);
  const H0 = new Path2D(); H0.moveTo(0, 310); H0.bezierCurveTo(-330, 150, -310, -170, 0, -190); H0.bezierCurveTo(310, -170, 330, 150, 0, 310); H0.closePath();
  piece(ELL(-150, -230, 130, 90, -0.4), '#8E2A3E', 0.9); piece(ELL(-150, -236, 100, 62, -0.4), '#A83A4C', 0, false);
  piece(CIR(110, -250, 70), '#F2C6B8', 0.9); piece(CIR(100, -262, 40), '#FBE3D8', 0, false); piece(RR(80, -400, 60, 150, 28), '#F2C6B8', 0.7);
  const g = ctx.createRadialGradient(-60, -40, 40, 0, 40, 380); g.addColorStop(0, '#E4584E'); g.addColorStop(1, '#8E2430'); piece(H0, g, 1.3);
  ctx.save(); ctx.clip(H0); for (let i = 0; i < 16; i++) { const pts = []; for (let k = 0; k <= 8; k++) pts.push([-300 + i * 40 + k * 8 + Math.sin(k + i) * 6, -200 + k * 64]); stroke(pts, i % 2 ? 'rgba(90,10,20,0.28)' : 'rgba(255,170,150,0.16)', 7); }
  piece(ELL(-110, -90, 80, 130, 0.5), 'rgba(255,220,200,0.2)', 0, false);
  if (w > 0 || rg > 0) { const cx = 120, cy = 120, R = 110 * Math.max(w, rg); const hole = new Path2D(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr_ = R * (0.82 + 0.3 * R2(i + 2)); i ? hole.lineTo(cx + Math.cos(a) * rr_, cy + Math.sin(a) * rr_) : hole.moveTo(cx + Math.cos(a) * rr_, cy + Math.sin(a) * rr_); } hole.closePath();
    ctx.fillStyle = '#1E0A10'; ctx.fill(hole); ctx.strokeStyle = '#FFD9C8'; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.stroke(hole); ctx.setLineDash([]);
    if (rg > 0) { ctx.save(); ctx.clip(hole); ctx.globalAlpha = rg; const gg = ctx.createRadialGradient(cx, cy, 5, cx, cy, R * 1.3); gg.addColorStop(0, '#F26A5E'); gg.addColorStop(1, '#D8453F'); ctx.fillStyle = gg; ctx.fillRect(cx - R * 1.4, cy - R * 1.4, R * 2.8, R * 2.8); for (let i = 0; i < 9; i++) stroke([[cx - 100, cy - 70 + i * 18], [cx + 100, cy - 60 + i * 18 + Math.sin(i) * 8]], 'rgba(255,200,180,0.35)', 5); ctx.restore(); } }
  ctx.restore(); ctx.restore();
}
function cellBig(x, y, r, t, split = 0) {
  ctx.save(); ctx.translate(x, y); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + t * 0.4; stroke([[Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25], [Math.cos(a) * r * (1.6 + 0.2 * Math.sin(t * 3 + i)), Math.sin(a) * r * (1.6 + 0.2 * Math.sin(t * 3 + i))]], 'rgba(255,230,140,0.55)', 6); }
  const n = split > 0 ? 6 : 1; for (let i = 0; i < n; i++) { const a = i / n * TAU, d = split * r * 0.7, rr_ = r * (n === 1 ? 1 : 0.55); const cx = n === 1 ? 0 : Math.cos(a) * d, cy = n === 1 ? 0 : Math.sin(a) * d; const g = ctx.createRadialGradient(cx - rr_ * 0.3, cy - rr_ * 0.3, 4, cx, cy, rr_); g.addColorStop(0, '#FFF3B8'); g.addColorStop(1, '#E8A83A'); piece(CIR(cx, cy, rr_), g, 1); piece(CIR(cx + rr_ * 0.1, cy + rr_ * 0.1, rr_ * 0.38), '#B8641E', 0, false); piece(CIR(cx - rr_ * 0.05, cy - rr_ * 0.08, rr_ * 0.14), '#FFE9A8', 0, false); }
  ctx.restore();
}

function wormPiece(cx, cy, rot, len, wid, u0, u1, o = {}) { const m = ((u0 + u1) / 2 - 0.5) * len; worm(cx - Math.cos(rot) * m, cy - Math.sin(rot) * m, rot, len, wid, { ...o, u0, u1 }); }
function blade(x, y, k) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5); ctx.globalAlpha = 1 - clamp((k - 0.7) * 3); piece(POLY([[-260 + k * 300, -8], [260, -2], [260, 10], [-260 + k * 300, 8]]), '#E8EEF2', 0.8, false); stroke([[-300, 0], [300, 0]], 'rgba(255,255,255,0.6)', 3); ctx.restore(); }
const REG = [['planarian', 0], ['cucumber', 1]];
const ANIMAL_ICONS = {
  worm: (r, t) => worm(0, 0, 2.2, r * 3.4, r * 0.42, { t, amp: 0.05 }),
  cuc: (r, t) => cucumber(0, 0, r / 300, { t, rot: -0.35 }),
  fish: (r, t) => zebrafish(0, 0, r / 290, { t, rot: -0.3 }),
  axo: (r, t) => axolotl(-20, 0, r / 400, { t, rot: -0.9 }),
  star: (r, t) => seastar(0, 0, r / 400, { t, spin: t * 0.2 }),
};

// ═══════════════ FIVE ANIMALS THAT REGROW: shots ═══════════════
export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const WD = (w, i) => { try { return Wd(w, i); } catch (e) { return L(i) + 0.6; } };
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const tag = (lt, a, d = 0.25) => (lt > a ? eob(seg(lt, a, a + d)) : 0);
  const stage = (id, st, o, fn) => add({ id, at: st, cam: o.cam || [540, 800], zoom: o.zoom ?? 0.07, note: o.note, draw: fn });
  const ICON = (k, t) => (r) => ANIMAL_ICONS[k](r, t);

  // 1 · HOOK: a flatworm cut in three, every piece already regrown into a whole worm (frame 0)
  { const st = 0;
    stage('S01', st, { zoom: 0.08, note: 'petri dish full of three whole planarians, each regrown from one piece' }, (lt, d, t) => {
      petriBG(t); const k = 0.82 + 0.18 * eo(clamp(lt / 1.2));
      wormPiece(430, 520, 0.5 + Math.sin(t * 1.4) * 0.05, 1500, 130, 0, 0.34, { t, tk: k, amp: 0.03 });
      wormPiece(680, 830, -0.45 + Math.sin(t * 1.2) * 0.05, 1500, 130, 0.33, 0.67, { t, hk: k, tk: k, amp: 0.03 });
      wormPiece(430, 1120, 0.3 + Math.sin(t * 1.6) * 0.05, 1500, 130, 0.66, 1, { t, hk: k, amp: 0.03 });
      label('ONE PIECE. ONE WHOLE BODY.', 540, 150, tag(lt, -0.3, 0.3), -0.03, 56, '#FBF6E8', '#C8322B');
    });
    cue(0, 'slam', { gain: 0.4 }); cue(1.7, 'sparkle', { dur: 0.6, gain: 0.2 }); cue(2.9, 'pop', { gain: 0.3 }); }

  // 2 · five animals line up
  { const st = cut(1), names = ['SEA CUCUMBER', 'ZEBRAFISH', 'AXOLOTL', 'COMET SEA STAR', 'PLANARIAN'], keys = ['cuc', 'fish', 'axo', 'star', 'worm'];
    stage('S02', st, { zoom: 0.05, note: 'five medallions, numbered 5 to 1, each with its animal, appearing one by one' }, (lt, d, t) => {
      seaBG(t, { tone: 'tank' });
      for (let i = 0; i < 5; i++) { const a = 0.0 + i * 0.5, y = 330 + i * 235, left = i % 2 === 0, x = left ? 320 : 760;
        const sc = tag(lt, a, 0.3); medallion(x, y, 110, ICON(keys[i], t), sc, { gold: i === 4 && lt > 3.6, c1: ['#3C7DA8', '#4C8F6A', '#6A9A5A', '#2C6AA0', '#5E8F8F'][i] });
        badge(5 - i, x + (left ? -112 : 112), y - 80, sc * 0.45); label(names[i], x + (left ? 320 : -320), y + 4, sc, left ? -0.03 : 0.03, 40); }
    });
    for (let i = 0; i < 5; i++) cue(st + 0.3 + i * 0.5, 'pop', { gain: 0.25 + i * 0.01 }); cue(st, 'whoosh', { gain: 0.35 }); cue(WD('wildest', 1) + 0.1, 'sparkle', { dur: 0.6, gain: 0.2 }); }

  // 3a · sea cucumber, a crab arrives
  { const st = cut(2), sp = WD('push', 2) - 0.1;
    stage('S03a', st, { note: 'big sea cucumber on a rocky seabed, a crab reaches for it' }, (lt, d, t) => {
      seaBG(t, { tone: 'reef', rocks: true });
      const cx = lerp(1250, 860, eo(seg(lt, WD('predator', 2) - st - 0.6, WD('predator', 2) - st + 0.5))), cy = lerp(160, 360, eo(seg(lt, WD('predator', 2) - st - 0.6, WD('predator', 2) - st + 0.5)));
      cucumber(580, 790, 1.4, { t, rot: 0.75 });
      crab(cx, cy, 1.0, { t, rot: 0.5, claw: lt > WD('attacks', 2) - st ? 1 : 0.2 });
      badge(5, 160, 190, tag(lt, 0.15, 0.3)); label('SEA CUCUMBER', 640, 160, tag(lt, WD('sea', 2) - st), -0.03, 56);
      label('A PREDATOR', 760, 1130, tag(lt, WD('predator', 2) - st), 0.03, 50, '#FBF6E8', '#C8322B');
    });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + 0.35, 'pop', { gain: 0.3 }); cue(WD('predator', 2) - 0.15, 'zip', { gain: 0.3 }); cue(WD('attacks', 2) + 0.2, 'tock', { gain: 0.25 }); }); }

  // 3b · it pushes its insides out, crab flees
  { const st = WD('push', 2) - 0.15, e1 = WD('insides', 2) - st, flee = e1 + 0.5;
    stage('S03b', st, { cam: [450, 700], note: 'strands burst out of the rear, crab recoils and runs off' }, (lt, d, t) => {
      seaBG(t, { tone: 'reef', rocks: true }); const ev = eio(seg(lt, 0.1, e1 + 0.5));
      cucumber(640, 800, 1.4, { t, rot: 0.75, evis: ev });
      const f = eio(seg(lt, flee - 0.3, flee + 0.8));
      crab(lerp(860, 1250, f), lerp(360, 120, f) + Math.sin(t * 20) * 4 * (1 - f), 1.0, { t, rot: 0.5, claw: 1 });
      label('PUSHES ITS INSIDES OUT', 540, 150, tag(lt, e1 - 0.2), -0.03, 52, '#FBF6E8', '#C8322B');
      label('DEFENDS ITSELF', 760, 1130, tag(lt, WD('defend', 2) - st), 0.03, 48);
    });
    cue(st + 0.1, 'plop', { gain: 0.4 }); cue(st + e1, 'bubbles', { dur: 1.0, gain: 0.2 }); cue(st + flee, 'zip', { gain: 0.3 }); cue(st + flee + 1.3, 'tock', { gain: 0.25 }); }

  // 4 · it grows them back, a few weeks
  { const st = cut(3), gr = WD('grow', 3) - st, wk = WD('weeks', 3) - st, nw = WD('weeks', 3) - st + 0.5;
    stage('S04', st, { note: 'cutaway of the sea cucumber with a pink intestine growing back; calendar days crossed off' }, (lt, d, t) => {
      seaBG(t, { tone: 'reef', rocks: true }); const k = eio(seg(lt, 0.3, nw));
      cucumber(560, 960, 1.28, { t, rot: 0, inside: Math.max(0.04, k) });
      calendar(560, 500, 1.4, eio(seg(lt, gr, nw + 0.2)), t);
      label('GROWS THEM BACK', 540, 110, tag(lt, gr), -0.03, 52, '#FBF6E8', '#2E8A5A');
      label('REBUILT IN WEEKS', 560, 1180, tag(lt, nw - 0.4), 0.03, 52, '#FBF6E8', '#2E8A5A');
    });
    cue(st, 'whoosh', { gain: 0.35 }); for (let i = 0; i < 4; i++) cue(st + gr + 0.4 + i * 0.55, 'tock', { gain: 0.22 }); cue(st + nw, 'sparkle', { dur: 0.6, gain: 0.22 }); }

  // 5a · zebrafish
  { const st = cut(4);
    stage('S05a', st, { note: 'a zebrafish swims diagonally toward the viewer, big, in a plant tank' }, (lt, d, t) => {
      seaBG(t, { tone: 'tank' }); zebrafish(540 + Math.sin(t * 1.5) * 12, 760, 2.0, { t, rot: -0.8 });
      badge(4, 170, 200, tag(lt, 0.15, 0.3)); label('ZEBRAFISH', 700, 1100, tag(lt, WD('zebrafish', 4) - st), -0.03, 60);
    });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + 0.4, 'pop', { gain: 0.3 }); cue(st + 1.3, 'bubbles', { dur: 0.9, gain: 0.18 }); }

  // 5b · heart damage and regrowth
  { const st = WD('damage', 4) - 0.15, dm = WD('damage', 4) - st, gw = WD('grows', 4) - st, mu = WD('muscle', 4) - st, sc = WD('scar', 4) - 0.6 - st;
    stage('S05b', st, { cam: [540, 800], note: 'big paper heart; a chunk is damaged, then new red muscle grows into the hole; small zebrafish badge' }, (lt, d, t) => {
      plainBG('#4A1E2A', '#220E16'); for (let i = 0; i < 24; i++) piece(CIR(R2(i) * 1100, ((R2(i + 3) * 2000 - t * 18) % 2000 + 2000) % 2000, 4 + R2(i + 5) * 6), 'rgba(255,150,140,0.2)', 0, false);
      heart(540, 800, 1.35, { t, wound: eo(seg(lt, dm, dm + 0.4)), regrow: eio(seg(lt, gw, mu + 0.7)) });
      medallion(190, 250, 100, ICON('fish', t), tag(lt, 0.1, 0.3), { c1: '#3C7DA8' });
      label('DAMAGED HEART', 700, 190, tag(lt, dm), 0.03, 54, '#FBF6E8', '#C8322B'); label('NEW MUSCLE', 540, 1100, tag(lt, mu), -0.03, 54, '#FBF6E8', '#2E8A5A');
      label('BARELY ANY SCAR', 540, 1200, tag(lt, sc), 0.03, 52, '#FBF6E8', '#2E8A5A');
    });
    cue(st + dm, 'thud', { gain: 0.4 }); cue(st + dm + 0.3, 'heartbeat', { gain: 0.35 }); cue(st + gw + 0.3, 'bubbles', { dur: 1.0, gain: 0.18 }); cue(st + mu, 'pop', { gain: 0.3 }); cue(st + sc + 0.2, 'sparkle', { dur: 0.6, gain: 0.2 }); }

  // 6a · axolotl
  { const st = cut(5);
    stage('S06a', st, { note: 'axolotl seen from above with red gills in a pond' }, (lt, d, t) => {
      seaBG(t, { tone: 'pond' }); axolotl(560, 730, 1.45, { t, rot: -1.1 });
      badge(3, 170, 200, tag(lt, 0.15, 0.3)); label('AXOLOTL', 770, 1110, tag(lt, WD('axolotl', 5) - st), -0.03, 60);
    });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + 0.4, 'pop', { gain: 0.3 }); cue(st + 1.8, 'bubbles', { dur: 0.9, gain: 0.18 }); }

  // 6b · lost leg regrows, spinal cord repairs
  { const st = WD('regrow', 5) - 0.5, rg = WD('regrow', 5) - st, lg = WD('leg', 5) - st, sc = WD('spinal', 5) - st;
    stage('S06b', st, { note: 'same axolotl; the front left leg grows back from a stump; then a glowing spinal cord bridges a cut' }, (lt, d, t) => {
      seaBG(t, { tone: 'pond' }); const lk = lt < rg ? 0 : eio(seg(lt, rg, lg + 0.4)), sp = lt < sc - 0.3 ? null : eio(seg(lt, sc, sc + 1.2));
      axolotl(560, 730, 1.45, { t, rot: -1.1, leg: lk, spine: sp });
      label('LOST LEG GROWS BACK', 700, 170, tag(lt, rg), 0.03, 50, '#FBF6E8', '#2E8A5A'); label('SPINAL CORD', 330, 1100, tag(lt, sc), -0.03, 52, '#FBF6E8', '#2E6A8A');
    });
    cue(st + 0.1, 'whoosh', { gain: 0.3 }); cue(st + rg + 0.5, 'plop', { gain: 0.3 }); cue(st + lg + 0.2, 'pop', { gain: 0.3 }); cue(st + sc + 0.2, 'zip', { gain: 0.3 }); cue(st + sc + 0.9, 'sparkle', { dur: 0.6, gain: 0.22 }); }

  // 7a · comet sea star
  { const st = cut(6);
    stage('S07a', st, { note: 'big blue sea star with five long arms on a reef' }, (lt, d, t) => {
      seaBG(t, { tone: 'reef', rocks: true }); seastar(540, 800, 1.3, { t, spin: Math.sin(t * 0.4) * 0.12 });
      badge(2, 170, 200, tag(lt, 0.15, 0.3)); label('COMET SEA STAR', 700, 1230, tag(lt, WD('comet', 6) - st), -0.03, 56);
    });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + 0.4, 'pop', { gain: 0.3 }); cue(st + 1.6, 'bubbles', { dur: 0.9, gain: 0.18 }); }

  // 7b · one arm breaks off
  { const st = WD('when', 6) - 0.2, br = WD('breaks', 6) - st, sw = 0;
    stage('S07b', st, { note: 'the star loses its top arm, which drifts away on its own' }, (lt, d, t) => {
      seaBG(t, { tone: 'reef', rocks: true }); const k = eio(seg(lt, br, br + 1.0));
      const arms = [0, 1, 2, 3, 4].map((i) => ({ len: [400, 430, 370, 420, 390][i], ang: -1.57 + i * 1.2566 })); arms[0] = { ...arms[0], dx: -70 * k, dy: -150 * k, rot: -0.3 * k };
      seastar(540, 820, 1.3, { t, arms }); if (k > 0.05) { ctx.save(); ctx.globalAlpha = 0.8 * (1 - k); stroke([[540, 560], [470, 470]], '#FFFFFF', 6); ctx.restore(); }
      label('ONE ARM BREAKS OFF', 540, 170, tag(lt, 0.15), -0.03, 56, '#FBF6E8', '#C8322B');
    });
    cue(st + br, 'thud', { gain: 0.35 }); }

  // 7c · the arm grows a whole new body
  { const st = WD('it', 6) - 0.1, gr = WD('grow', 6) - st, en = WD('whole', 6) - st;
    stage('S07c', st, { note: 'the lone arm now fills the frame and sprouts a new centre and new small arms (a comet)' }, (lt, d, t) => {
      seaBG(t, { tone: 'reef', rocks: true }); const k = eio(seg(lt, gr, en + 1.0));
      seastar(380 + Math.sin(t) * 6, 1000, 2.5, { t, disc: false, spin: -0.95, arms: [{ len: 420, ang: 0, newArms: Math.max(0.001, k) }] });
      label('IT GROWS A NEW BODY', 540, 150, tag(lt, gr), -0.03, 52, '#FBF6E8', '#2E8A5A'); label('A NEW SEA STAR', 700, 1130, tag(lt, en), 0.03, 52);
    });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + gr + 0.2, 'plop', { gain: 0.3 }); cue(st + en, 'sparkle', { dur: 0.6, gain: 0.22 }); }

  // 8a · planarian #1
  { const st = cut(7);
    stage('S08a', st, { note: 'a huge planarian flatworm in a petri dish, wriggling' }, (lt, d, t) => {
      petriBG(t); worm(540, 770, 2.2 + Math.sin(t * 0.8) * 0.04, 1250, 100, { t, amp: 0.045 });
      badge(1, 170, 200, tag(lt, 0.15, 0.3)); label('PLANARIAN', 760, 1180, tag(lt, WD('planarian', 7) - st), -0.03, 60); label('A TINY FLATWORM', 540, 130, tag(lt, WD('flatworm', 7) - st), 0.02, 50, '#FBF6E8', '#C8322B');
    });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + 0.4, 'pop', { gain: 0.3 }); cue(st + 1.8, 'sparkle', { dur: 0.6, gain: 0.2 }); }

  // 8b · cut into pieces, each regrows head and tail
  { const st = WD('cut', 7) - 0.15, cu = WD('pieces', 7) - st, gr = WD('grow', 7) - st, hd = WD('head', 7) - st, tl = WD('tail', 7) - st;
    stage('S08b', st, { zoom: 0.05, note: 'the worm is sliced in three, the pieces drift apart, and each grows a new head and tail' }, (lt, d, t) => {
      petriBG(t); const R = 2.2, len = 1000, wid = 85, dx = Math.cos(R), dy = Math.sin(R), px = -dy, py = dx, sep = eio(seg(lt, cu - 0.2, cu + 0.9));
      const hk = eio(seg(lt, gr + 0.1, hd + 0.2)), tk = eio(seg(lt, gr + 0.5, tl + 0.2)); const U = [[0, 0.34], [0.33, 0.67], [0.66, 1]];
      U.forEach(([a, b], i) => { const mid = (a + b) / 2, along = (mid - 0.5) * len * (1 + 0.3 * sep), off = (i - 1) * 170 * sep; wormPiece(500 + dx * along + px * off, 790 + dy * along + py * off, R + (i - 1) * 0.5 * sep, len, wid, a, b, { t, amp: 0.03, hk, tk, cut: sep > 0.1 }); });
      blade(540, 780, seg(lt, cu - 0.5, cu + 0.1));
      label('CUT INTO PIECES', 540, 130, tag(lt, cu - 0.2), -0.03, 54, '#FBF6E8', '#C8322B'); label('NEW HEAD', 290, 1120, tag(lt, hd), -0.04, 48, '#FBF6E8', '#2E8A5A'); label('NEW TAIL', 800, 1120, tag(lt, tl), 0.04, 48, '#FBF6E8', '#2E8A5A');
    });
    cue(st + cu - 0.2, 'slam', { gain: 0.3 }); cue(st + cu + 0.3, 'whoosh', { gain: 0.3 }); cue(st + gr + 0.3, 'bubbles', { dur: 1.0, gain: 0.18 }); cue(st + hd, 'pop', { gain: 0.3 }); cue(st + tl + 0.1, 'sparkle', { dur: 0.6, gain: 0.22 }); }

  // 9 · one stem cell rebuilds a worm whose own stem cells are gone
  { const st = cut(8), sc = WD('single', 8) - st, re = WD('rebuild', 8) - st, gn = WD('gone', 8) - st;
    stage('S09', st, { zoom: 0.06, note: 'dark microscope view; a pale ghost worm (stem cells gone); one glowing stem cell sinks into it and the worm fills in with colour' }, (lt, d, t) => {
      plainBG('#0E2638', '#050E18'); ctx.save(); ctx.strokeStyle = 'rgba(160,230,255,0.25)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(540, 800, 560, 0, TAU); ctx.stroke(); ctx.restore(); for (let i = 0; i < 30; i++) piece(CIR((R2(i) * 1000 + t * 5) % 1080, ((R2(i + 2) * 1900 - t * 8) % 1900 + 1900) % 1900, 2 + R2(i + 3) * 4), 'rgba(160,230,255,0.3)', 0, false);
      const fill = eio(seg(lt, re, re + 1.6)), drop = eio(seg(lt, re - 0.3, re + 0.5));
      ctx.save(); ctx.globalAlpha = 0.22 + 0.78 * fill; worm(540, 800, 2.2 + Math.sin(t) * 0.03, 1150, 100, { t, amp: 0.04 }); ctx.restore();
      if (fill < 0.95) { ctx.save(); ctx.globalAlpha = 1 - fill * 0.9; cellBig(lerp(540, 600, drop), lerp(300, 760, drop), lerp(110, 60, drop), t, 0); ctx.restore(); }
      label('ONE STEM CELL', 540, 150, tag(lt, sc), -0.03, 56, '#FBF6E8', '#B98A12'); label('ITS OWN WERE GONE', 540, 1180, tag(lt, gn - 0.3), 0.03, 52, '#FBF6E8', '#C8322B');
    });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + sc, 'pop', { gain: 0.3 }); cue(st + re + 0.3, 'bubbles', { dur: 1.0, gain: 0.18 }); cue(st + re + 1.7, 'sparkle', { dur: 0.6, gain: 0.22 }); }

  // 10 · the question: which would you pick (loops back to the hook)
  { const st = cut(9), pk = WD('pick', 9) - st; const keys = ['cuc', 'fish', 'axo', 'star', 'worm'], pos = [[290, 400], [790, 400], [290, 780], [790, 780], [540, 1130]];
    stage('S10', st, { zoom: 0.05, note: 'all five animal medallions in a ring with a big question' }, (lt, d, t) => {
      seaBG(t, { tone: 'tank' });
      keys.forEach((k, i) => { const a = 0.0 + i * 0.12, hl = 0.5 + 0.5 * Math.sin(t * 3 - i * 1.2); medallion(pos[i][0], pos[i][1], 135, ICON(k, t), tag(lt, a, 0.3), { c1: ['#3C7DA8', '#4C8F6A', '#6A9A5A', '#2C6AA0', '#5E8F8F'][i] }); });
      label('WHICH POWER WOULD YOU PICK?', 540, 150, tag(lt, 0.0, 0.3), -0.02, 52, '#FBF6E8', '#C8322B');
    });
    cue(st, 'whoosh', { gain: 0.35 }); for (let i = 0; i < 5; i++) cue(st + 0.3 + i * 0.3, 'pop', { gain: 0.24 + i * 0.01 }); cue(st + pk, 'sparkle', { dur: 0.6, gain: 0.2 }); }

  return { shots: S, cues: CUES };
}
