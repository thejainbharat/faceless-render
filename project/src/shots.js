// WHAT HAPPENS IF YOU HOLD IN A SNEEZE? : paper cut-out animation.
// Everything is a cut paper piece (paper texture, light edge, soft drop shadow). A jointed paper puppet (brass pins at
// the shoulder and elbow) drives a paper car; a paper "cutaway" window shows the windpipe inside his neck.
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

// ── colours ────────────────────────────────────────────────────────────────

// ── helpers ──
const R2 = (i) => { const v = Math.sin(i * 91.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
function stroke(pts, col, w, close = false) { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); if (close) ctx.closePath(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function curve(x0, y0, cx, cy, x1, y1, col, w) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); }
const view = (cx, cy, z) => { ctx.translate(540, 820); ctx.scale(z, z); ctx.translate(-cx, -cy); };
/** world position of a point (lx, ly) in an animal's local frame {x, y, s, rot} */
const loc = (o, lx, ly) => { const r = o.rot || 0, s = o.s || 1; return [o.x + s * (lx * Math.cos(r) - ly * Math.sin(r)), o.y + s * (lx * Math.sin(r) + ly * Math.cos(r))]; };
/** orca placed so its mouth tip is at (mx, my) */
const orcaAt = (mx, my, rot, s, extra = {}) => ({ x: mx - s * (430 * Math.cos(rot) - 25 * Math.sin(rot)), y: my - s * (430 * Math.sin(rot) + 25 * Math.cos(rot)), s, rot, ...extra });

// ═══════════════ ORCA (side view facing right, ~880 long at s=1, origin = middle) ═══════════════
const ORC = '#22252D', ORC_L = '#3B404C', ORC_W = '#F5F2EA';
function orcaBodyPath() { const p = new Path2D(); p.moveTo(440, 16); p.bezierCurveTo(432, -40, 360, -86, 270, -94); p.bezierCurveTo(150, -102, 60, -114, -30, -106); p.bezierCurveTo(-170, -92, -300, -52, -430, -14); p.lineTo(-430, 16); p.bezierCurveTo(-300, 52, -170, 92, -30, 102); p.bezierCurveTo(90, 110, 240, 104, 330, 74); p.bezierCurveTo(395, 56, 440, 44, 440, 16); p.closePath(); return p; }
function orca(o) {
  const s = o.s || 1, t = o.t || 0, gp = o.gape || 0, sw = o.swim ?? 1;
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  // tail flukes (behind the body)
  ctx.save(); ctx.translate(-420, 0); ctx.rotate(Math.sin(t * 3) * 0.08 * sw);
  piece(POLY([[12, -8], [-50, -30], [-124, -46], [-112, -10], [-134, 26], [-50, 24], [12, 8]]), ORC, 0.6); piece(POLY([[-40, -10], [-110, -30], [-100, -8], [-118, 18], [-40, 10]]), ORC_L, 0, false); ctx.restore();
  // far pectoral fin
  ctx.save(); ctx.translate(150, 66); ctx.rotate(0.7 + Math.sin(t * 2) * 0.06 * sw); piece(ELL(60, 0, 84, 34), '#181A20', 0.3, false); ctx.restore();
  // dorsal fin
  const df = new Path2D(); df.moveTo(80, -104); df.bezierCurveTo(60, -180, 10, -260, -4, -300); df.bezierCurveTo(-30, -240, -60, -170, -66, -102); df.closePath(); piece(df, ORC, 0.7);
  stroke([[40, -120], [12, -230]], 'rgba(255,255,255,0.12)', 6);
  // body
  const b = orcaBodyPath(); piece(b, ORC, 1);
  ctx.save(); ctx.clip(b);
  stroke([[-420, -26], [-200, -70], [40, -96], [250, -86], [380, -50]], 'rgba(120,130,150,0.38)', 14);       // sheen along the back
  piece(ELL(-150, -84, 96, 28, 0.2), '#8E94A0', 0, false); piece(ELL(-150, -84, 70, 16, 0.2), '#A8AEB9', 0, false);   // grey saddle patch
  const wb = new Path2D(); wb.moveTo(440, 40); wb.bezierCurveTo(380, 62, 330, 84, 240, 96); wb.bezierCurveTo(130, 108, 30, 98, -70, 86); wb.bezierCurveTo(-10, 62, 90, 50, 190, 52); wb.bezierCurveTo(290, 50, 390, 36, 440, 24); wb.closePath(); piece(wb, ORC_W, 0, false);
  const wb2 = new Path2D(); wb2.moveTo(-60, 82); wb2.bezierCurveTo(-170, 90, -300, 50, -430, 4); wb2.lineTo(-430, 24); wb2.bezierCurveTo(-300, 56, -170, 100, -60, 100); wb2.closePath(); piece(wb2, ORC_W, 0, false);
  piece(ELL(292, -34, 64, 20, -0.4), ORC_W, 0, false);                                                           // eye patch
  ctx.restore();
  // eye
  piece(CIR(350, -10, 11), '#0C0D10', 0, false); piece(CIR(353, -14, 3.4), '#FFFFFF', 0, false);
  // mouth: wedge of pink inside, tongue, teeth, then the lower jaw rotated open
  const hx = 292, hy = 56;
  if (gp > 0.03) {
    const a = gp * 0.62, rot = (x, y) => [hx + (x - hx) * Math.cos(a) - (y - hy) * Math.sin(a), hy + (x - hx) * Math.sin(a) + (y - hy) * Math.cos(a)];
    const tip = rot(438, 34), low = rot(300, 84);
    piece(POLY([[hx, hy - 4], [442, 24], tip]), '#B8475F', 0, false);
    piece(POLY([[hx + 20, hy + 6], [400, 32], rot(396, 54), rot(310, 70)]), '#E0808F', 0, false);
    for (let i = 0; i < 9; i++) { const x = 330 + i * 13, u = rot(x, 60 + (x - 330) * 0.06); piece(POLY([[x, 28 + (x - 330) * 0.05], [x + 5, 28 + (x - 330) * 0.05 + 18], [x + 10, 28 + (x - 330) * 0.05]]), '#FFFDF4', 0, false); }
    const jaw = new Path2D(); [[hx, hy - 4], [440, 32], [432, 50], [388, 90], [hx, 92]].forEach(([x, y], i) => { const q = rot(x, y); i ? jaw.lineTo(q[0], q[1]) : jaw.moveTo(q[0], q[1]); }); jaw.closePath(); piece(jaw, ORC_W, 0.3, false);
    for (let i = 0; i < 8; i++) { const x = 336 + i * 13, y0 = 56 + (x - 336) * 0.1, q0 = rot(x, y0), q1 = rot(x + 5, y0 - 18), q2 = rot(x + 10, y0); piece(POLY([q0, q1, q2]), '#FFFDF4', 0, false); }
  } else curve(440, 26, 370, 52, 296, 58, 'rgba(255,255,255,0.35)', 4);
  // near pectoral fin
  ctx.save(); ctx.translate(170, 74); ctx.rotate(0.9 + Math.sin(t * 2 + 1) * 0.07 * sw); piece(ELL(64, 0, 92, 38), '#15171C', 0.6); stroke([[10, 0], [120, 8]], 'rgba(255,255,255,0.15)', 4); ctx.restore();
  ctx.restore();
}

// ═══════════════ SEAGULL (side view facing right, ~330 long, origin = body centre) ═══════════════
function gull(o) {
  const s = o.s || 1, w = o.wing ?? 0.5, dir = o.dir || 1, op = o.open || 0;
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale(s * dir, s);
  const ang = o.fold ? -1.5 : lerp(-(Math.PI - 0.55), -0.15, w), wl = o.fold ? 0.78 : 1;
  const wing = (col, tipc, back) => {
    ctx.save(); ctx.translate(30, -14); ctx.rotate(ang + (back ? 0.12 : 0)); ctx.scale(1, wl);
    const p = new Path2D(); p.moveTo(-18, 0); p.bezierCurveTo(-34, -80, -24, -180, 6, -262); p.lineTo(28, -282); p.bezierCurveTo(46, -200, 56, -110, 44, 2); p.closePath(); piece(p, col, 0.5);
    ctx.save(); ctx.clip(p); piece(POLY([[-60, -200], [6, -270], [60, -290], [60, -190], [-60, -196]]), tipc, 0, false);
    for (let i = 0; i < 4; i++) { stroke([[-18 + i * 14, -176], [-12 + i * 14, -290]], 'rgba(255,255,255,0.28)', 3); } for (let i = 0; i < 6; i++) stroke([[-22 + i * 10, -20 - i * 4], [-14 + i * 10, -170]], 'rgba(255,255,255,0.18)', 2); piece(POLY([[-26, -4], [-24, -150], [10, -150], [18, -4]]), 'rgba(235,238,242,0.35)', 0, false);
    stroke([[-8, -10], [4, -120], [14, -200]], 'rgba(255,255,255,0.3)', 4); ctx.restore(); ctx.restore();
  };
  wing('#7C8693', '#14161B', true);
  if (o.legs) { stroke([[-10, 30], [-14 - o.legs * 4, 30 + 74 * o.legs]], '#E8895A', 7); stroke([[24, 30], [28, 30 + 74 * o.legs]], '#E8895A', 7); if (o.legs > 0.5) { piece(POLY([[-14, 104], [-52, 116], [-30, 94], [-10, 112], [2, 100]]), '#E8895A', 0, false); piece(POLY([[28, 104], [-8, 116], [14, 94], [32, 112], [46, 100]]), '#E8895A', 0, false); } }
  for (let i = -1; i <= 1; i++) piece(POLY([[-70, 8 + i * 6], [-176, 8 + i * 22 - 10], [-184, 8 + i * 22 + 6], [-70, 14 + i * 6]]), i ? '#EDEAE2' : '#F7F5EF', 0.4, false); stroke([[-130, 0], [-178, -4]], '#14161B', 5); stroke([[-130, 22], [-182, 28]], '#14161B', 5);
  const bd = ELL(0, 0, 98, 42); piece(bd, '#F7F5EF', 0.9);
  ctx.save(); ctx.clip(bd); piece(ELL(-14, -26, 90, 22, 0.08), '#B5BDC7', 0, false); stroke([[-70, 10], [0, 28], [70, 14]], 'rgba(200,200,190,0.5)', 4); ctx.restore();
  piece(ELL(72, -20, 40, 30, -0.5), '#F7F5EF', 0.3, false);
  piece(CIR(96, -36, 27), '#FBFAF5', 0.5);
  ctx.save(); ctx.translate(120, -26); ctx.rotate(op * 0.3); piece(POLY([[0, 8], [52, 14], [50, 24], [4, 22]]), '#F0B72C', 0.2, false); ctx.restore();
  piece(POLY([[116, -44], [172, -28], [164, -16], [152, -12], [116, -10]]), '#F5C23A', 0.3, false); piece(CIR(152, -20, 5), '#D8402F', 0, false);
  piece(CIR(104, -44, 9), '#F2C43B', 0, false); piece(CIR(106, -44, 5), '#111', 0, false); piece(CIR(107, -46, 1.6), '#FFF', 0, false);
  wing('#9AA3AF', '#101216', false);
  ctx.restore();
}

// ═══════════════ FISH (side view facing right, ~210 long) ═══════════════
function fish(o) {
  const s = o.s || 1; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  const tl = Math.sin((o.t || 0) * 12) * 0.12;
  ctx.save(); ctx.translate(-76, 0); ctx.rotate(tl); piece(POLY([[6, 0], [-52, -38], [-40, 0], [-52, 38]]), '#7C93A6', 0.4); stroke([[0, 0], [-46, -30]], 'rgba(255,255,255,0.3)', 2); stroke([[0, 0], [-46, 30]], 'rgba(255,255,255,0.3)', 2); ctx.restore();
  piece(POLY([[-10, -26], [10, -52], [34, -26]]), '#6A8195', 0.3, false); piece(POLY([[-6, 26], [14, 46], [30, 26]]), '#8BA2B4', 0.3, false);
  const b = new Path2D(); b.moveTo(-80, 0); b.bezierCurveTo(-60, -34, 40, -36, 84, -4); b.bezierCurveTo(94, 0, 94, 4, 84, 8); b.bezierCurveTo(40, 36, -60, 34, -80, 0); b.closePath(); piece(b, '#C4D0DA', 0.8);
  ctx.save(); ctx.clip(b); piece(ELL(0, -26, 96, 18), '#5F7D96', 0, false); piece(ELL(0, 24, 90, 14), '#F1F4F6', 0, false);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) curve(-60 + i * 15 + (r % 2) * 7, -14 + r * 12, -54 + i * 15 + (r % 2) * 7, -8 + r * 12, -60 + i * 15 + (r % 2) * 7, -2 + r * 12, 'rgba(70,90,110,0.35)', 2);
  stroke([[-70, 2], [80, 2]], 'rgba(255,255,255,0.35)', 3); ctx.restore();
  curve(40, -22, 52, 0, 40, 22, 'rgba(60,80,100,0.6)', 3);
  piece(CIR(64, -6, 8), '#FFFFFF', 0, false); piece(CIR(66, -6, 4.5), '#0C0D10', 0, false); curve(90, 2, 80, 5, 70, 4, 'rgba(60,40,40,0.6)', 3);
  ctx.restore();
}

// ═══════════════ SCENES ═══════════════
function plainP(col, a = 0.5) { ctx.fillStyle = col; ctx.fillRect(-600, -600, W + 1200, H + 1200); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PAT; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore(); }
function cloud(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(ELL(0, 0, 120, 36), '#FFFFFF', 0.3, false); piece(ELL(-40, -22, 56, 36), '#FFFFFF', 0.3, false); piece(ELL(30, -30, 66, 42), '#FFFFFF', 0.3, false); ctx.restore(); }
/** sky above, water below the waterline wy (water is the background; objects go on top, then waterOver) */
function skyWater(t, wy, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, wy); g.addColorStop(0, '#8FCBE6'); g.addColorStop(1, '#E6F4F6'); ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, wy + 600);
  if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = PAT; ctx.fillRect(-600, -600, W + 1200, wy + 600); ctx.restore();
  cloud(200 + Math.sin(t * 0.15) * 40, wy - 520, 1.0); cloud(820 - Math.sin(t * 0.12) * 40, wy - 700, 0.8); if (o.clouds2) cloud(520, wy - 880, 0.7);
  if (o.stands) { piece(RR(-60, wy - 170, 500, 170, 6), '#A9B4BE', 0.4); piece(RR(330, wy - 120, 800, 120, 6), '#C3CCD3', 0.4); for (let i = 0; i < 18; i++) piece(RR(-30 + i * 28, wy - 150, 14, 22, 3), i % 3 ? '#7B8996' : '#E58C4B', 0, false); for (let i = 0; i < 26; i++) piece(RR(350 + i * 30, wy - 100, 16, 22, 3), i % 4 ? '#8F9CA8' : '#4B8CC8', 0, false); }
  const w = ctx.createLinearGradient(0, wy, 0, H); w.addColorStop(0, '#3C94B4'); w.addColorStop(1, '#0C3350'); ctx.fillStyle = w; ctx.fillRect(-600, wy, W + 1200, H - wy + 600);
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = PAT; ctx.fillRect(-600, wy, W + 1200, H - wy + 600); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.10; for (let i = 0; i < 5; i++) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(100 + i * 230 + Math.sin(t * 0.5 + i) * 30, wy); ctx.lineTo(220 + i * 230, wy); ctx.lineTo(80 + i * 200, H + 600); ctx.lineTo(-40 + i * 200, H + 600); ctx.fill(); } ctx.restore();
}
/** translucent water in front of everything drawn so far (shows submerged parts), with the bright surface line */
function waterOver(t, wy, a = 0.5) {
  const top = (x) => wy + Math.sin(x * 0.02 + t * 2.2) * 5 + Math.sin(x * 0.047 + t * 1.3) * 3;
  const p = new Path2D(); p.moveTo(-100, H + 400); for (let x = -100; x <= W + 100; x += 20) p.lineTo(x, top(x)); p.lineTo(W + 100, H + 400); p.closePath();
  const g = ctx.createLinearGradient(0, wy, 0, wy + 900); g.addColorStop(0, `rgba(40,130,170,${a})`); g.addColorStop(1, `rgba(8,50,80,${Math.min(0.95, a + 0.3)})`);
  ctx.fillStyle = g; ctx.fill(p);
  ctx.beginPath(); for (let x = -100; x <= W + 100; x += 20) x === -100 ? ctx.moveTo(x, top(x)) : ctx.lineTo(x, top(x)); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); for (let x = -100; x <= W + 100; x += 20) x === -100 ? ctx.moveTo(x, top(x) + 16) : ctx.lineTo(x, top(x + 40) + 16); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 4; ctx.stroke();
}
function bubblesUp(t, n = 14, y0 = H, y1 = 1000) { for (let i = 0; i < n; i++) { const u = (t * 0.25 + R2(i)) % 1; ctx.globalAlpha = 0.5 * Math.sin(u * Math.PI); piece(CIR(R2(i + 4) * 1080 + Math.sin(t * 2 + i) * 14, lerp(y0, y1, u), 5 + R2(i + 9) * 9), 'rgba(255,255,255,0.7)', 0, false); } ctx.globalAlpha = 1; }
function splash(x, y, k, s = 1) {
  if (k <= 0 || k >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - k * 0.75; ctx.strokeStyle = '#F3FBFF'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(x, y, (50 + 190 * k) * s, (10 + 26 * k) * s, 0, 0, TAU); ctx.stroke(); ctx.restore();
  for (let i = 0; i < 20; i++) { const a = -Math.PI / 2 + (R2(i) - 0.5) * 2.3, v = (140 + R2(i + 3) * 300) * s; ctx.globalAlpha = 1 - k * 0.6; piece(CIR(x + Math.cos(a) * v * k, y + Math.sin(a) * v * k + 520 * s * k * k, (7 + R2(i + 5) * 12) * s * (1 - k * 0.5)), '#EAF7FF', 0.2, false); }
  ctx.globalAlpha = 1;
}
/** an orca at the water surface with its lower half tinted by the water (for scenes with many orcas) */
function orcaSurf(o, wl, t) { const s = o.s; ctx.save(); ctx.beginPath(); ctx.rect(-600, -600, W + 1200, wl + 600); ctx.clip(); orca(o); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(-600, wl, W + 1200, 1800); ctx.clip(); ctx.globalAlpha = 0.5; orca(o); ctx.restore(); ctx.beginPath(); for (let x = o.x - 560 * s; x <= o.x + 560 * s; x += 14) { const y = wl + Math.sin(x * 0.03 + t * 2) * 3; x === o.x - 560 * s ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6 * s + 2; ctx.stroke(); }

// ═══════════════ PEOPLE and small props ═══════════════
function person(o) {
  const s = o.s || 1; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
  piece(RR(-46, -200, 38, 200, 14), '#2E3A55', 0.6); piece(RR(8, -200, 38, 200, 14), '#2E3A55', 0.6); piece(ELL(-24, 4, 36, 13), '#1E1E22', 0.3); piece(ELL(30, 4, 36, 13), '#1E1E22', 0.3);
  piece(RR(-72, -410, 144, 230, 40), '#E08A3C', 0.8); stroke([[0, -400], [0, -190]], 'rgba(90,40,10,0.35)', 4); piece(RR(-72, -230, 144, 22, 8), '#B96E28', 0, false);
  ctx.save(); ctx.translate(56, -370); ctx.rotate(o.arm ?? -0.4); piece(RR(-18, -8, 38, 150, 18), '#E08A3C', 0.5); piece(CIR(2, 150, 22), '#E7B58F', 0.3, false);
  if (o.clip) { piece(RR(-2, 100, 96, 130, 8), '#B98A4C', 0.5); piece(RR(8, 112, 76, 108, 4), '#FFFFFF', 0, false); for (let i = 0; i < 5; i++) stroke([[16, 128 + i * 18], [74, 128 + i * 18]], 'rgba(60,60,80,0.5)', 3); }
  ctx.restore();
  piece(RR(-18, -446, 36, 46, 10), '#E7B58F', 0.2, false);
  piece(CIR(0, -482, 54), '#EDBB93', 0.7); piece(ELL(-2, -520, 56, 30, 0), '#4A2E22', 0.3, false); piece(ELL(-52, -480, 12, 18), '#D99E76', 0, false);
  piece(CIR(26, -486, 6), '#2A1A12', 0, false); curve(10, -458, 26, -452, 40, -462, '#8A4A3A', 4); curve(18, -502, 28, -508, 40, -502, '#4A2E22', 4);
  if (o.phones) { ctx.beginPath(); ctx.arc(0, -484, 62, Math.PI * 1.05, Math.PI * 1.95); ctx.strokeStyle = '#2B2B33'; ctx.lineWidth = 12; ctx.stroke(); piece(ELL(-58, -482, 18, 28), '#C8322B', 0.4, false); piece(ELL(58, -482, 18, 28), '#C8322B', 0.4, false); }
  ctx.restore();
}
function mapleLeaf(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(POLY([[0, -60], [14, -34], [38, -44], [30, -14], [56, -8], [34, 8], [44, 28], [14, 22], [8, 50], [4, 50], [4, 24], [-4, 24], [-4, 50], [-8, 50], [-14, 22], [-44, 28], [-34, 8], [-56, -8], [-30, -14], [-38, -44], [-14, -34]]), '#D6322B', 0.6); ctx.restore(); }
function check(x, y, s, col = '#3E9A4E') { if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(POLY([[-46, 0], [-28, -18], [-10, 2], [34, -44], [52, -26], [-10, 38]]), col, 0.7); ctx.restore(); }
function bigQ(x, y, s, rot = 0) { if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.font = `700 360px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 26; ctx.strokeStyle = '#FFF8E6'; ctx.lineJoin = 'round'; ctx.strokeText('?', 0, 0); ctx.fillStyle = '#C8322B'; ctx.fillText('?', 0, 0); ctx.restore(); }
function sproutP(x, y, s, k) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); stroke([[0, 0], [0, -140 * k]], '#4E8A4A', 12); piece(ELL(-44, -120 * k, 44 * k, 18 * k, 0.5), '#6AAE56', 0.3, false); piece(ELL(44, -90 * k, 44 * k, 18 * k, -0.5), '#6AAE56', 0.3, false); piece(ELL(0, 6, 90, 22), '#6A4A30', 0.5); ctx.restore(); }

// ═══════════════ ORCA BAIT video: shots ═══════════════
export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const at = (w, i) => Wd(w, i) - cut(i);
  const tag = (lt, a, d = 0.3) => (lt > a ? eob(seg(lt, a, a + d)) : 0);
  const RED = '#C8322B', CRM = '#FBF6E8';
  const WY = 1000;

  // 1 · hook: an orca drops a fish on purpose, a gull dives in
  { const st = cut(0), dr = at('dropped', 0), pu = at('purpose', 0), mi = at('mistake', 0);
    add({ id: 'S01', at: st, cam: [540, 950], zoom: 0.07, note: 'orca head at the surface with its mouth open, a silver fish tumbling out of its mouth onto the water, a seagull diving in from the top right; tags NOT A MISTAKE and ON PURPOSE', draw(lt, d, t) {
      skyWater(t, WY, { stands: 1 });
      const O = { x: 300, y: 960 + Math.sin(t * 2) * 6, s: 1.15, rot: -0.15, gape: 0.7 * (1 - eio(seg(lt, 0.3, 1.3))), t };
      orca(O); waterOver(t, WY, 0.5);
      const m = loc(O, 430, 30), u = seg(lt, 0, 0.8), fx = lerp(m[0] + 10, 930, eo(u)), fy = lerp(m[1], 985, u) - Math.sin(u * Math.PI) * 150;
      fish({ x: fx, y: fy + (u >= 1 ? Math.sin(t * 3) * 4 : 0), s: 1.05, rot: u < 1 ? lt * 3 : 0.05, t });
      splash(930, 995, seg(lt, 0.8, 1.5), 0.8);
      const g = eio(seg(lt, 0, d * 0.97)); gull({ x: lerp(850, 760, g), y: lerp(470, 880, g), s: 1.15, rot: -0.75, dir: -1, wing: 0.5 + 0.5 * Math.sin(t * 14), open: 0.6, legs: 0.7 });
      label('NOT A MISTAKE', 540, 250, tag(lt, -0.1, 0.3), -0.03, 70, CRM, RED);
      label('ON PURPOSE', 540, 1180, tag(lt, pu), 0.03, 58);
    } });
    cue(st, 'whoosh'); cue(st + 0.7, 'plop'); cue(st + dr, 'bubbles', { dur: 0.6, gain: 0.3 }); cue(st + pu, 'pop'); cue(st + mi, 'thud', { gain: 0.5 }); }

  // 2 · Marineland, Canada, a scientist recording the whales' calls by accident
  { const st = cut(1), ma = at('marineland', 1), ca = at('canada', 1), sc = at('scientist', 1), ac = at('accident', 1), re = at('recording', 1);
    add({ id: 'S02', at: st, cam: [540, 950], zoom: 0.05, note: 'cross-section of a pool: a researcher on the deck with headphones and a clipboard lowers a cable into the water, an orca swims below, sound waves ripple out; MARINELAND with a maple leaf, BY ACCIDENT, RECORDING CALLS', draw(lt, d, t) {
      skyWater(t, 1100, { stands: 1 });
      piece(POLY([[-200, 1080], [400, 1080], [400, 1960], [-200, 1960]]), '#B7B1A4', 0.8, false); piece(RR(-200, 1068, 616, 30, 6), '#D6D0C2', 0.5, false); for (let i = 0; i < 8; i++) stroke([[-200, 1160 + i * 110], [400, 1160 + i * 110]], 'rgba(80,76,66,0.25)', 3);
      const O = { x: lerp(560, 760, eio(seg(lt, 0, d))), y: 1520 + Math.sin(t * 1.5) * 18, s: 0.62, rot: Math.sin(t * 1.5) * 0.04, t }; orca(O);
      waterOver(t, 1100, 0.45);
      const hy = [250, 1262];
      const rec = seg(lt, re - 0.3, re + 0.4); for (let i = 0; i < 4; i++) { const u = (t * 0.9 + i / 4) % 1; ctx.save(); ctx.globalAlpha = rec * (1 - u) * 0.8; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(O.x + 220, O.y - 30, 40 + u * 260, -0.9, 0.9); ctx.stroke(); ctx.restore(); }
      curve(340, 1040, 400, 1130, 470, 1262, '#2A2A30', 6); piece(RR(450, 1250, 40, 70, 12), '#E9C46A', 0.4);
      person({ x: 230, y: 1080, s: 1.0, phones: lt > re - 0.4, clip: true, arm: -0.5 });
      label('MARINELAND', 540, 230, tag(lt, ma), -0.03, 64); mapleLeaf(880, 232, 1.2 * tag(lt, ca));
      
      label('BY ACCIDENT', 760, 1185, tag(lt, ac), -0.03, 56, CRM, RED); label('RECORDING CALLS', 760, 1280, tag(lt, re), 0.03, 42); label('CAPTIVE ORCAS', 540, 370, tag(lt, at('captivity', 1)), 0.04, 48, CRM, '#2E5A8A');
    } });
    cue(st, 'whoosh'); cue(st + ma, 'pop'); cue(st + ca, 'tock', { gain: 0.5 }); cue(st + at('captivity', 1), 'pop', { gain: 0.6 }); cue(st + sc, 'tock', { gain: 0.5 }); cue(st + ac, 'boing', { gain: 0.35 }); cue(st + re, 'sparkle', { dur: 0.8, gain: 0.35 }); }

  // 3 · a young male spits up a fish, sinks and waits
  { const st = cut(2), yo = at('young', 2), sp = at('spit', 2), su = at('surface', 2), sk = at('sink', 2), wa = at('wait', 2);
    add({ id: 'S03', at: st, cam: [540, 1000], zoom: 0.05, note: 'a young orca at the surface opens its mouth and spits up a fish that arcs onto the water, then the orca sinks below the surface and hangs there, eye looking up', draw(lt, d, t) {
      skyWater(t, WY, { stands: 1 });
      const sink = eio(seg(lt, sk - 0.1, sk + 0.8)), pre = { x: 400, y: 985, s: 0.95, rot: -0.28 };
      const O = { ...pre, y: lerp(985, 1380, sink), rot: lerp(-0.28, -0.04, sink), gape: seg(lt, sp - 0.2, sp + 0.1) * (1 - seg(lt, sp + 0.3, sp + 0.7)), t };
      orca(O); waterOver(t, WY, 0.5 + 0.25 * sink);
      if (lt > sp) { const m = loc(pre, 430, 30), u = seg(lt, sp, sp + 0.8); fish({ x: lerp(m[0], 800, eo(u)), y: lerp(m[1], 985, u) - Math.sin(u * Math.PI) * 280 + (u >= 1 ? Math.sin(t * 3) * 4 : 0), s: 1.0, rot: u < 1 ? u * 8 : 0.04, t }); splash(800, 995, seg(lt, sp + 0.8, sp + 1.5), 0.8); }
      if (sink > 0.5) bubblesUp(t, 8, 1500, 1000);
      label('YOUNG MALE', 300, 260, tag(lt, yo), -0.04, 56); label('SPITS UP A FISH', 700, 420, tag(lt, sp), 0.03, 50, CRM, RED); label('THEN WAITS', 540, 1450, tag(lt, wa - 0.2), -0.03, 62);
    } });
    cue(st, 'whoosh'); cue(st + yo, 'pop'); cue(st + sp + 0.1, 'gulp'); cue(st + sp + 0.8, 'plop'); cue(st + sk, 'bubbles', { dur: 1.2, gain: 0.4 }); cue(st + wa, 'tock'); }

  // 4 · a hungry gull spots the free snack and lands
  { const st = cut(3), hu = at('hungry', 3), fr = at('free', 3), la = at('landed', 3);
    add({ id: 'S04', at: st, cam: [540, 1000], zoom: 0.05, note: 'a fish floating on the water, a gull gliding in and landing beside it, feet down; below the surface a dark orca lurks, unseen by the gull', draw(lt, d, t) {
      skyWater(t, WY, { stands: 1, clouds2: 1 });
      const O = { x: 560 + Math.sin(t) * 20, y: 1330, s: 0.85, rot: 0, t, swim: 0.3 }; orca(O); waterOver(t, WY, 0.62);
      fish({ x: 600, y: 985 + Math.sin(t * 2.5) * 5, s: 1.1, rot: 0.05, t: 0 });
      const u = eio(seg(lt, 0, la + 0.2)), fly = lt < la + 0.2;
      gull({ x: lerp(60, 330, u), y: lerp(380, 930, u), s: 1.0, rot: lerp(0.35, -0.05, u), fold: !fly, wing: fly ? 0.5 + 0.5 * Math.sin(t * 10) : 0.55, legs: lerp(0, 1, seg(lt, la - 0.6, la)), open: 0.4 });
      label('HUNGRY', 300, 230, tag(lt, hu), -0.04, 62); label('FREE SNACK', 760, 820, tag(lt, fr), 0.04, 54, CRM, RED);
    } });
    cue(st, 'whoosh'); cue(st + hu, 'pop'); cue(st + fr, 'sparkle', { dur: 0.8, gain: 0.35 }); cue(st + la, 'plop', { gain: 0.7 }); }

  // 5 · the whale shoots up from below, mouth wide open
  { const st = cut(4), wh = at('whale', 4), sh = at('shot', 4), be = at('below', 4), wi = at('wide', 4);
    add({ id: 'S05', at: st, cam: [540, 1000], zoom: 0.05, note: 'the orca bursts up from the dark water straight under the gull, nose pointing at the sky, mouth wide open with teeth, a big splash; the gull flaps up, startled', draw(lt, d, t) {
      skyWater(t, WY, { stands: 1 });
      const u = eio(seg(lt, sh - 0.15, sh + 0.55)), my = lerp(1650, 870, u), mx = 600 + u * 20;
      const O = orcaAt(mx, my, -1.2, 0.85, { gape: eob(seg(lt, wi - 0.5, wi + 0.1)), t, swim: 0.2 });
      fish({ x: 760, y: 985, s: 0.9, rot: 0.1, t: 0 });
      orca(O); waterOver(t, WY, 0.5);
      const lift = eio(seg(lt, sh + 0.35, sh + 0.9));
      gull({ x: 600 - lift * 120, y: lerp(940, 640, lift), s: 1.0, rot: -lift * 0.4, wing: lift > 0 ? 0.5 + 0.5 * Math.sin(t * 16) : 0.55, legs: 1 - lift, open: 1 });
      splash(610, 1000, seg(lt, sh + 0.15, sh + 1.0), 1.4);
      label('SHOT UP FROM BELOW', 540, 250, tag(lt, be - 0.5), -0.03, 52); label('MOUTH WIDE OPEN', 540, 1200, tag(lt, wi), 0.03, 58, CRM, RED);
    } });
    cue(st, 'whoosh'); cue(st + sh + 0.1, 'bubbles', { dur: 0.8, gain: 0.4 }); cue(st + sh + 0.4, 'slam', { gain: 0.45 }); cue(st + sh + 0.45, 'zip'); cue(st + wi, 'pop'); }

  // 6 · again and again, a trap
  { const st = cut(5), ag = at('again', 5), tr = at('trap', 5), P = 1.3;
    add({ id: 'S06', at: st, cam: [540, 1000], zoom: 0.05, note: 'the same trick repeats: orca rises under a fish and gull, splash, tally marks pile up on a paper card; then a big TRAP tag', draw(lt, d, t) {
      skyWater(t, WY, { stands: 1 });
      const ph = (lt % P) / P, bump = Math.pow(Math.sin(Math.PI * clamp(ph * 1.15)), 2);
      const O = orcaAt(560 + ph * 20, lerp(1600, 900, bump), -1.0, 0.7, { gape: seg(ph, 0.3, 0.45) * (1 - seg(ph, 0.6, 0.8)), t, swim: 0.3 });
      orca(O); waterOver(t, WY, 0.52);
      fish({ x: 330, y: 985 + Math.sin(t * 3) * 4, s: 0.9, rot: 0.04, t: 0 });
      gull({ x: lerp(160, 360, ph), y: 760 + Math.sin(t * 8) * 16 + (ph > 0.45 ? -(ph - 0.45) * 600 : 0), s: 0.85, rot: 0.05, wing: 0.5 + 0.5 * Math.sin(t * 12), open: 0.5 });
      splash(600, 1000, seg(ph, 0.35, 0.75), 1.0);
      const n = Math.min(5, Math.max(1, Math.floor(lt / P) + (ph > 0.45 ? 1 : 0))), ps = tag(lt, ag - 0.4);
      if (ps > 0) { ctx.save(); ctx.translate(790, 330); ctx.scale(ps, ps); ctx.rotate(0.05); piece(RR(-180, -110, 360, 220, 10), '#F7F0DC', 0.7); for (let i = 0; i < n; i++) { const gx = -130 + (i % 5) * 50; stroke([[gx, -60], [gx + 6, 40]], i === 4 ? RED : '#2A2A30', 9); } if (n >= 5) stroke([[-150, 0], [140, -26]], RED, 9); ctx.restore(); }
      label('AGAIN AND AGAIN', 300, 230, tag(lt, ag - 0.3), -0.04, 54); label('A TRAP', 540, 1250, tag(lt, tr), 0.03, 78, CRM, RED);
    } });
    cue(st, 'whoosh'); for (let k = 0; k < 4; k++) { cue(st + k * P + 0.45, 'bubbles', { dur: 0.5, gain: 0.3 }); cue(st + k * P + 0.62, 'plop', { gain: 0.5 }); } cue(st + ag, 'tock'); cue(st + tr, 'thud', { gain: 0.5 }); }

  // 7 · the twist: his half brother copies him
  { const st = cut(6), tw = at('twist', 6), mo = at('months', 6), ha = at('half', 6), dg = at('doing', 6);
    add({ id: 'S07', at: st, cam: [540, 1000], zoom: 0.05, note: 'two orcas at the surface side by side, the first one smaller on the left tagged FIRST WHALE and a smaller one on the right tagged HALF BROTHER spitting up a fish, a calendar page A FEW MONTHS LATER', draw(lt, d, t) {
      skyWater(t, 760, { stands: 1 });
      const sp = dg - 0.2;
      orcaSurf({ x: 270, y: 800 + Math.sin(t * 1.6) * 6, s: 0.52, rot: -0.12, t }, 760, t);
      const B = { x: 700, y: 1010 + Math.sin(t * 1.8 + 1) * 6, s: 0.62, rot: -0.2, gape: seg(lt, sp, sp + 0.1) * (1 - seg(lt, sp + 0.3, sp + 0.7)), t };
      orcaSurf(B, 960, t);
      if (lt > sp) { const m = loc(B, 430, 30), u = seg(lt, sp, sp + 0.7); fish({ x: lerp(m[0], 960, eo(u)), y: lerp(m[1], 950, u) - Math.sin(u * Math.PI) * 200, s: 0.8, rot: u < 1 ? u * 7 : 0, t }); splash(960, 960, seg(lt, sp + 0.7, sp + 1.3), 0.6); }
      label('THE TWIST', 540, 220, tag(lt, tw), -0.03, 62, CRM, RED); label('FIRST WHALE', 270, 600, tag(lt, tw + 0.4), -0.04, 52);
      ctx.save(); ctx.translate(210, 1340); ctx.rotate(-0.05); const k = tag(lt, mo - 0.2); ctx.scale(k, k); piece(RR(-170, -150, 340, 300, 12), '#FBF6E8', 0.8); piece(RR(-170, -150, 340, 70, 12), RED, 0.1, false); ctx.fillStyle = CRM; ctx.font = `700 40px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('A FEW MONTHS', 0, -100); ctx.fillStyle = '#3A2A1E'; ctx.font = `700 54px ${SERIF}`; ctx.fillText('LATER', 0, -10); for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) piece(RR(-130 + j * 52, 20 + i * 38, 40, 28, 4), '#E4DAC0', 0, false); ctx.restore();
      label('HALF BROTHER', 760, 1260, tag(lt, ha), 0.04, 52, CRM, '#2E5A8A');
    } });
    cue(st, 'whoosh'); cue(st + tw, 'boing', { gain: 0.4 }); cue(st + mo, 'pop'); cue(st + ha, 'tock'); cue(st + dg, 'gulp'); cue(st + dg + 0.7, 'plop'); }

  // 8 · adult females join, several whales bait gulls
  { const st = cut(7), fe = at('females', 7), se = at('several', 7), ba = at('baiting', 7);
    add({ id: 'S08', at: st, cam: [540, 1000], zoom: 0.05, note: 'four orcas at different distances all spitting up fish at the surface, gulls circling above; ADULT FEMALES JOIN IN, SEVERAL WHALES', draw(lt, d, t) {
      skyWater(t, 620, { stands: 1 });
      const rows = [[250, 760, 0.32, 0.5], [760, 800, 0.36, 1.2], [300, 1030, 0.52, 1.9], [760, 1190, 0.68, 2.6]];
      rows.forEach(([x, y, s, a], i) => {
        const sp = Math.max(0.4, fe - 0.5) + i * 0.45, O = { x, y: y + Math.sin(t * 1.7 + i) * 5, s, rot: -0.18, gape: seg(lt, sp, sp + 0.1) * (1 - seg(lt, sp + 0.3, sp + 0.7)), t: t + i };
        const wl = y + 26 * s; orcaSurf(O, wl, t);
        if (lt > sp) { const m = loc(O, 430, 30), u = seg(lt, sp, sp + 0.7); fish({ x: lerp(m[0], m[0] + 160 * s + 40, eo(u)), y: lerp(m[1], wl - 6, u) - Math.sin(u * Math.PI) * 160 * s * 1.6, s: s * 1.2, rot: u < 1 ? u * 7 : 0, t }); }
      });
      for (let i = 0; i < 3; i++) gull({ x: 200 + i * 330 + Math.sin(t * 0.8 + i) * 50, y: 260 + (i % 2) * 120 + Math.sin(t * 1.3 + i) * 24, s: 0.45, rot: Math.sin(t + i) * 0.1, wing: 0.5 + 0.5 * Math.sin(t * 6 + i * 2), open: 0.5 });
      label('ADULT FEMALES', 330, 520, tag(lt, fe - 0.3), -0.04, 52); label('JOIN IN', 800, 575, tag(lt, fe + 0.2), 0.04, 52, CRM, RED); label('SEVERAL WHALES', 540, 1395, tag(lt, se), -0.03, 54); label('BAITING GULLS', 540, 1475, tag(lt, ba), 0.03, 46, CRM, RED);
    } });
    cue(st, 'whoosh'); [0, 1, 2, 3].forEach((i) => cue(st + Math.max(0.4, fe - 0.5) + i * 0.45 + 0.7, 'plop', { gain: 0.45 })); cue(st + se, 'pop'); cue(st + ba, 'sparkle', { dur: 0.8, gain: 0.35 }); }

  // 9 · a tradition being born
  { const st = cut(8), sc = at('scientist', 8), tr = at('tradition', 8), bo = at('born', 8);
    add({ id: 'S09', at: st, cam: [540, 950], zoom: 0.05, note: 'the researcher with a clipboard on the left, a paper speech cloud with a chain of three orcas passing a fish trick along with arrows, and a green sprout growing under it; A TRADITION BEING BORN', draw(lt, d, t) {
      plainP('#DCE9EE', 0.45); piece(POLY([[-100, 1500], [1180, 1500], [1180, 2000], [-100, 2000]]), '#B9CAB0', 0.4, false);
      person({ x: 260, y: 1560, s: 1.15, clip: true, arm: -0.6 });
      const k = eob(seg(lt, 0.15, 0.55)); ctx.save(); ctx.translate(640, 640); ctx.scale(k, k); piece(RR(-380, -250, 760, 500, 80), '#FFFFFF', 0.8); piece(POLY([[-250, 240], [-330, 330], [-170, 246]]), '#FFFFFF', 0.4, false);
      for (let i = 0; i < 3; i++) { const on = seg(lt, tr - 0.2 + i * 0.35, tr + 0.2 + i * 0.35); ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * on; orca({ x: -240 + i * 240, y: -20, s: 0.2, rot: 0, t, swim: 0 }); ctx.restore(); if (i < 2) { stroke([[-165 + i * 240, -20], [-95 + i * 240, -20]], '#3A2A1E', 8); stroke([[-112 + i * 240, -40], [-92 + i * 240, -20], [-112 + i * 240, 0]], '#3A2A1E', 8); } fish({ x: -240 + i * 240, y: 95, s: 0.28, rot: 0, t: 0 }); }
      ctx.restore();
      sproutP(800, 1490, 1.2, eio(seg(lt, tr, bo + 0.4)));
      label('A TRADITION', 540, 230, tag(lt, tr), -0.03, 64); label('BEING BORN', 540, 340, tag(lt, bo), 0.03, 64, CRM, RED);
    } });
    cue(st, 'slide', { dur: 0.7, gain: 0.4 }); cue(st + sc, 'tock'); cue(st + tr, 'pop'); cue(st + tr + 0.4, 'pop', { gain: 0.6 }); cue(st + bo, 'sparkle', { dur: 1.0, gain: 0.4 }); }

  // 10 · some scientists are not sure: copied each other, or worked it out alone?
  { const st = cut(9), so = at('some', 9), ns = at('sure', 9), co = at('copied', 9), al = at('alone', 9);
    add({ id: 'S10', at: st, cam: [540, 950], zoom: 0.05, note: 'a big paper clipboard with two open questions: COPIED EACH OTHER and WORKED IT OUT ALONE, each with an empty box that gets a red question mark', draw(lt, d, t) {
      plainP('#DCE9EE', 0.45);
      ctx.save(); ctx.translate(540, 900); ctx.rotate(-0.02); piece(RR(-420, -560, 840, 1180, 30), '#B98A4C', 1); piece(RR(-360, -500, 720, 1080, 12), '#FBF6E8', 0.4, false); piece(RR(-130, -590, 260, 80, 24), '#7A7F88', 0.6);
      ctx.fillStyle = '#3A2A1E'; ctx.font = `700 50px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('SOME SCIENTISTS ASK', 0, -400); stroke([[-300, -370], [300, -370]], 'rgba(60,40,30,0.5)', 4);
      ctx.textAlign = 'left'; ctx.font = `700 54px ${SERIF}`;
      ctx.fillText('COPIED EACH', -270, -150); ctx.fillText('OTHER', -270, -80); piece(RR(190, -170, 110, 110, 14), '#FFFFFF', 0.2); bigQ(246, -114, 0.3 * tag(lt, co), 0.1);
      ctx.fillText('WORKED IT OUT', -270, 120); ctx.fillText('ALONE', -270, 190); piece(RR(190, 100, 110, 110, 14), '#FFFFFF', 0.2); bigQ(246, 156, 0.3 * tag(lt, al), -0.1);
      ctx.restore();
      label('NOT SURE', 300, 230, tag(lt, ns), -0.04, 62, CRM, RED);
    } });
    cue(st, 'whoosh'); cue(st + so, 'tock'); cue(st + ns, 'boing', { gain: 0.35 }); cue(st + co, 'pop'); cue(st + al, 'pop', { gain: 0.8 }); cue(st + al + 0.5, 'thud', { gain: 0.4 }); }

  // 11 · loop back: did he invent it alone?
  { const st = cut(10), yw = at('young', 10), iv = at('invent', 10), hi = at('himself', 10), th = at('think', 10);
    add({ id: 'S11', at: st, cam: [540, 950], zoom: 0.07, note: 'back to the opening picture: the young orca at the surface with a fish and a gull, a giant red question mark over it; INVENTED IT ALONE? and WHAT DO YOU THINK?', draw(lt, d, t) {
      skyWater(t, WY, { stands: 1 });
      const O = { x: 300, y: 960 + Math.sin(t * 2) * 6, s: 1.15, rot: -0.15, gape: 0.25 + 0.2 * Math.sin(t * 3), t };
      orca(O); waterOver(t, WY, 0.5);
      fish({ x: 930, y: 985 + Math.sin(t * 3) * 4, s: 1.05, rot: 0.05, t: 0 });
      gull({ x: 780 + Math.sin(t * 1.5) * 30, y: 760 + Math.sin(t * 3) * 20, s: 0.95, rot: -0.1, dir: -1, wing: 0.5 + 0.5 * Math.sin(t * 10), open: 0.4 });
      bigQ(540, 470, eob(seg(lt, iv - 0.2, iv + 0.3)) * (1 + Math.sin(t * 4) * 0.03), Math.sin(t * 2) * 0.05);
      label('INVENTED IT ALONE?', 540, 220, tag(lt, iv - 0.2), -0.03, 58); label('WHAT DO YOU THINK?', 540, 1120, tag(lt, th), 0.03, 62, CRM, RED);
    } });
    cue(st, 'whoosh'); cue(st + yw, 'tock'); cue(st + iv, 'boing', { gain: 0.4 }); cue(st + hi, 'pop'); cue(st + th, 'sparkle', { dur: 1.0, gain: 0.4 }); }

  return { shots: S, cues: CUES };
}
