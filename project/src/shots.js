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
const SKIN = '#EDBB93', SKIN_D = '#D99E76', HAIR = '#4A2E22', SHIRT = '#D95B43', SHIRT_D = '#B9462F', PANTS = '#34405C', DESK = '#E8DAC0';

// ── the puppet (profile facing right). Origin = hips. Angles: f = degrees forward from straight down ──────────
const SH = [20, -270], NECK = [12, -320], UA = 150, FA = 140;
function arm(fUp, fFore, col, front) {
  ctx.save(); ctx.translate(...SH); ctx.rotate(-D(fUp));
  piece(RR(-26, -10, 52, UA + 20, 26), col, 0.6);
  ctx.translate(0, UA); ctx.rotate(-D(fFore - fUp));
  piece(RR(-21, -8, 42, FA + 10, 21), SKIN, 0.6);
  piece(ELL(0, FA + 8, 30, 34), SKIN, 0.5);
  if (front) pin(0, 0);
  ctx.restore();
  if (front) pin(...SH);
}
/** head pieces in head-local coords (pivot at the neck) */
function head(o) {
  const t = o.t || 0;
  piece(ELL(-16, -118, 22, 32), SKIN_D, 0.3);                                                       // ear (behind)
  const p = new Path2D(); p.moveTo(-50, 0); p.bezierCurveTo(-130, -20, -142, -205, -30, -248); p.bezierCurveTo(70, -262, 122, -192, 116, -138);
  p.lineTo(112, -120); p.lineTo(110, -78); p.quadraticCurveTo(112, -52, 104, -40); p.quadraticCurveTo(100, -10, 60, 0); p.closePath();
  piece(p, SKIN, 1);
  piece(ELL(-16, -118, 20, 30), SKIN_D, 0); piece(ELL(-12, -118, 9, 16), '#C98B66', 0, false);
  if (o.cheek) piece(ELL(72, -66, 24 + 20 * o.cheek, 18 + 16 * o.cheek), '#F2A98C', 0.2, false);
  // nose (own piece, twitches)
  ctx.save(); ctx.translate(110, -112); ctx.rotate(D(o.nose || 0)); piece(POLY([[-4, -16], [38, 18], [32, 26], [-4, 26]]), SKIN, 0.4); ctx.restore();
  // eye: squint by squashing; lid 0 open .. 1 shut
  const lid = clamp(o.lid || 0), wide = o.wide ? 1.35 : 1;
  if (lid > 0.92) { ctx.strokeStyle = '#2B1D17'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(52, -138); ctx.quadraticCurveTo(66, -130, 80, -138); ctx.stroke(); }
  else { ctx.save(); ctx.translate(66, -140); ctx.scale(wide, (1 - lid * 0.85) * wide); piece(ELL(0, 0, 12, 17), '#2B1D17', 0, false); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(4, -6, 4, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(66, -168 - (o.brow || 0) * 10); ctx.rotate(D(-8 + (o.frown || 0) * 18)); piece(RR(-30, -7, 60, 14, 7), HAIR, 0.2); ctx.restore();
  // mouth
  ctx.strokeStyle = '#7A3A2E'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
  if (o.mouth === 'o') { piece(ELL(98, -54, 9, 13), '#7A3A2E', 0, false); } else if (o.mouth === 'tight') { ctx.moveTo(86, -52); ctx.lineTo(104, -54); ctx.stroke(); } else { ctx.moveTo(84, -50); ctx.quadraticCurveTo(96, -46, 106, -52); ctx.stroke(); }
  // hair: back + top + fringe
  const h = new Path2D(); h.moveTo(-60, -40); h.bezierCurveTo(-148, -80, -138, -236, -30, -258); h.bezierCurveTo(48, -272, 104, -232, 112, -192);
  h.quadraticCurveTo(70, -210, 40, -196); h.quadraticCurveTo(10, -222, -20, -200); h.quadraticCurveTo(-60, -180, -70, -110); h.quadraticCurveTo(-74, -70, -60, -40); h.closePath();
  piece(h, HAIR, 0.7);
}
function puppet(o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s || 1, o.s || 1); ctx.rotate(D(o.lean || 0));
  arm(o.farUp ?? 75, o.farFore ?? 110, SHIRT_D, false);                                             // far arm
  if (o.stand) { const sw = o.walk ? Math.sin(o.t * 6) * 0.25 : 0; for (const [lx, a, c] of [[-40, sw, '#2A3550'], [30, -sw, PANTS]]) { ctx.save(); ctx.translate(lx, 10); ctx.rotate(a); piece(RR(-34, 0, 68, 300, 30), c, 0.5); piece(RR(-40, 286, 110, 38, 16), '#3A2A1E', 0.4); ctx.restore(); } } else piece(POLY([[0, 10], [200, 20], [210, 60], [0, 60]]), PANTS, 0.5);                               // thigh
  piece(RR(-95, -310, 200, 330, 70), SHIRT, 1);                                                     // torso
  piece(RR(-14, -350, 56, 60, 20), SKIN_D, 0.3);                                                    // neck
  if (o.inside) o.inside();                                                                         // cutaway goes on the torso/neck
  ctx.save(); ctx.translate(...NECK); ctx.rotate(D(o.head || 0)); head(o); ctx.restore();
  if (o.insideHead) o.insideHead();
  if (!o.noNearArm) arm(o.up ?? 75, o.fore ?? 110, SHIRT, true);                                     // near arm
  ctx.restore();
}
// world position of a point given in head-local coords, for a puppet drawn at (x, y, s) with head tilt (deg)
function headPt(o, hx, hy) { const a = D(o.head || 0), s = o.s || 1; const rx = hx * Math.cos(a) - hy * Math.sin(a), ry = hx * Math.sin(a) + hy * Math.cos(a); return [o.x + (NECK[0] + rx) * s, o.y + (NECK[1] + ry) * s]; }

// ── the outside world: layered paper sky, hills, trees, road; scrolls with t ─────────────────────────
function outside(t, speed = 1) {
  ctx.fillStyle = '#A8D5E6'; ctx.fillRect(-400, -400, W + 800, H + 800);
  for (let i = 0; i < 4; i++) { const x = ((i * 380 - t * 40 * speed) % 1600 + 1600) % 1600 - 300, y = 220 + (i % 2) * 160; const p = new Path2D(); for (const [dx, dy, r] of [[-60, 0, 50], [0, -28, 66], [62, 0, 48]]) { p.moveTo(x + dx + r, y + dy); p.arc(x + dx, y + dy, r, 0, TAU); } piece(p, '#FBF7EC', 0.5); }
  const hills = (base, amp, col, sp, seed) => { const off = (t * sp * speed) % 600; const p = new Path2D(); p.moveTo(-400, H + 400); for (let x = -400; x <= W + 400; x += 40) p.lineTo(x, base - Math.abs(Math.sin((x + off) / 300 + seed)) * amp); p.lineTo(W + 400, H + 400); p.closePath(); piece(p, col, 0.8); };
  hills(1000, 140, '#9CC27A', 60, 1); hills(1100, 90, '#7CAE5E', 140, 2.2);
  for (let i = 0; i < 6; i++) { const x = ((i * 300 - t * 260 * speed) % 1800 + 1800) % 1800 - 400; piece(RR(x - 10, 980, 20, 160, 8), '#7A5236', 0.5); piece(CIR(x, 960, 70 + (i % 3) * 12), i % 2 ? '#5E9A4C' : '#6FAE58', 0.7); }
  piece(RR(-400, 1180, W + 800, 400, 0), '#6E6A66', 0.6);
  for (let i = 0; i < 8; i++) { const x = ((i * 260 - t * 500 * speed) % 2080 + 2080) % 2080 - 400; ctx.fillStyle = '#F4EFE2'; ctx.fillRect(x, 1290, 130, 16); }
}
// paper car body with a window hole (even-odd), tyres; drawn over the puppet
function carBody(t, bob = 0) {
  ctx.save(); ctx.translate(0, bob);
  const p = new Path2D(); p.moveTo(40, 1260); p.lineTo(40, 900); p.quadraticCurveTo(50, 815, 200, 800); p.lineTo(250, 800); p.lineTo(300, 420); p.quadraticCurveTo(312, 372, 380, 372);
  p.lineTo(760, 372); p.quadraticCurveTo(820, 372, 846, 420); p.lineTo(980, 800); p.quadraticCurveTo(1050, 812, 1050, 900); p.lineTo(1050, 1260); p.closePath();
  p.moveTo(318, 448); p.lineTo(770, 448); p.lineTo(900, 806); p.lineTo(300, 806); p.closePath();
  ctx.save(); ctx.shadowColor = 'rgba(55,35,15,0.38)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10; ctx.fillStyle = '#2F8C8A'; ctx.fill(p, 'evenodd'); ctx.restore();
  ctx.save(); ctx.clip(p, 'evenodd'); ctx.fillStyle = PAT || (PAT = paperPattern()); ctx.fill(p, 'evenodd'); ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(255,250,240,0.5)'; ctx.lineWidth = 4; ctx.stroke(p); ctx.restore();
  piece(RR(60, 930, 980, 26, 13), '#257372', 0.3); piece(RR(640, 870, 90, 22, 11), '#E9E2D2', 0.4);      // trim + door handle
  ctx.restore();
  for (const wx of [250, 840]) { ctx.save(); ctx.translate(wx, 1250 + bob * 0.3); piece(CIR(0, 0, 110), '#2A2522', 1); piece(CIR(0, 0, 54), '#CFC6B4', 0.4); ctx.rotate(t * 9); for (let k = 0; k < 5; k++) { ctx.rotate(TAU / 5); piece(RR(-6, 10, 12, 34, 6), '#9C9282', 0, false); } ctx.restore(); }
}
function wheel(rot = 0) { ctx.save(); ctx.translate(735, 800); ctx.rotate(-0.28); piece(RR(-14, -10, 28, 140, 10), '#3A3330', 0.5); ctx.restore(); ctx.save(); ctx.translate(722, 775); ctx.rotate(-0.28 + rot); const p = new Path2D(); p.ellipse(0, 0, 34, 130, 0, 0, TAU); p.ellipse(0, 0, 16, 104, 0, 0, TAU, true); piece(p, '#2F2A27', 0.7); ctx.restore(); }
function seat() { ctx.save(); ctx.translate(330, 1060); ctx.rotate(D(-10)); piece(RR(-80, -420, 120, 440, 40), '#5B4E6E', 0.6); piece(RR(-70, -510, 100, 90, 30), '#5B4E6E', 0.5); ctx.restore(); }

// ── the inside view: cutaway window in his neck + chest showing the windpipe ─────────────────────────
// puppet-local coords (origin hips). Windpipe from under the jaw down to the chest.
const PIPE_TOP = -395, PIPE_BOT = -150, PIPE_X = 52, PIPE_R = 22, HOLE_Y = -300;
function cutaway(o) {
  const win = new Path2D(); win.roundRect(-40, -420, 190, 380, 40);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20; ctx.fillStyle = '#5E1F28'; ctx.fill(win); ctx.restore();
  ctx.save(); ctx.clip(win);
  piece(RR(-60, -440, 240, 420, 0), '#7C2A35', 0, false);
  for (let i = 0; i < 6; i++) piece(ELL(-20 + rnd(i) * 180, -400 + rnd(i + 3) * 360, 40 + rnd(i + 5) * 30, 26, rnd(i) * 3), '#8E3541', 0, false);
  // lungs
  const lp = (o.lungs ?? 1); piece(ELL(18, -95, 54 * lp, 80 * lp, 0.15), '#E58C99', 0.6); piece(ELL(100, -95, 50 * lp, 76 * lp, -0.15), '#E58C99', 0.6);
  // windpipe: tube + cartilage rings, swells with pressure
  const sw = 1 + (o.swell || 0) * 0.35, r = PIPE_R * sw;
  piece(RR(PIPE_X - r, PIPE_TOP - 40, r * 2, PIPE_BOT - PIPE_TOP + 40, r), o.redPipe ? '#F08A8A' : '#F2B6BE', 0.5);
  for (let y = PIPE_TOP - 20; y < PIPE_BOT; y += 26) piece(RR(PIPE_X - r - 3, y, r * 2 + 6, 10, 5), '#FBE3E6', 0, false);
  piece(POLY([[PIPE_X - 10, PIPE_BOT - 10], [PIPE_X + 10, PIPE_BOT - 10], [26, -150], [10, -160]]), '#F2B6BE', 0.2, false);
  piece(POLY([[PIPE_X - 10, PIPE_BOT - 10], [PIPE_X + 10, PIPE_BOT - 10], [96, -160], [80, -150]]), '#F2B6BE', 0.2, false);
  // the tear
  if (o.tear) { const s = o.tear; ctx.save(); ctx.translate(PIPE_X + r - 2, HOLE_Y); ctx.scale(s, s); piece(POLY([[0, -22], [12, -12], [2, -4], [14, 6], [2, 14], [10, 24], [-4, 22], [-6, -20]]), '#3A0D12', 0.3, false); ctx.restore(); }
  // air balls
  (o.air || []).forEach(([ax, ay, ar]) => piece(CIR(ax, ay, ar), '#FFF4D2', 0.5));
  ctx.restore();
  ctx.save(); ctx.lineWidth = 8; ctx.strokeStyle = '#F7EFDC'; ctx.setLineDash([16, 10]); ctx.stroke(win); ctx.restore();
}
/** air ball positions (puppet-local) for a mode: 'up' bounce up and down the pipe, 'press' crowd at the top, 'leak' out of the tear */
function airBalls(t, mode, n = 14, swell = 0) {
  const out = [], r = PIPE_R * (1 + swell * 0.35);
  for (let i = 0; i < n; i++) {
    const a = rnd(i) - 0.5, br = 8 + rnd(i + 4) * 6;
    if (mode === 'up') { const ph = (t * 1.4 + rnd(i + 2)) % 2, u = ph < 1 ? ph : 2 - ph; out.push([PIPE_X + a * r * 1.2, lerp(PIPE_BOT - 10, PIPE_TOP - 20, u), br]); }
    else if (mode === 'press') { out.push([PIPE_X + a * r * 1.4 + Math.sin(t * 30 + i) * 2, PIPE_TOP - 20 + Math.pow(rnd(i + 2), 1.5) * 150, br]); }
    else { if (i % 2) out.push([PIPE_X + a * r * 1.2, lerp(PIPE_BOT - 10, HOLE_Y, (t * 0.8 + rnd(i + 2)) % 1), br]); else { const ph = (t * 0.7 + rnd(i + 6)) % 1; out.push([PIPE_X + r + ph * 90, HOLE_Y + (rnd(i + 8) - 0.5) * 120 * ph, br * (1 - ph * 0.4)]); } }
  }
  return out;
}
function studio(seed = 0) { ctx.fillStyle = DESK; ctx.fillRect(-400, -400, W + 800, H + 800); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = PAT; ctx.fillRect(-400, -400, W + 800, H + 800); ctx.restore(); const g = ctx.createRadialGradient(960, 540, 400, 960, 600, 1400); g.addColorStop(0, 'rgba(90,60,30,0)'); g.addColorStop(1, 'rgba(90,60,30,0.35)'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, H + 800); }
const view = (cx, cy, z) => { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); };


// ═══════════════ PAPER CUT video: hand, paper sheet, fingertip skin cross-section, magnifier ═══════════════
/** close-up hand, index finger pointing right. Origin = wrist. o = { x, y, s, rot, bend (deg, index finger knuckle), cut (0..1), drop (0..1), sensors (0..1) } */
const KNUCKLE = [150, -80], FING = 250;
function hand(o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s || 1, o.s || 1); ctx.rotate(o.rot || 0);
  piece(RR(-200, -100, 140, 200, 36), SHIRT, 0.8);
  for (let i = 0; i < 3; i++) piece(RR(110, -18 + i * 44, 92, 44, 22), SKIN_D, 0.4);
  piece(RR(-90, -120, 250, 210, 80), SKIN, 1);
  for (let i = 0; i < 3; i++) piece(RR(120, -14 + i * 44, 80, 38, 19), SKIN, 0.3);
  if (o.wrinkle) { ctx.save(); ctx.strokeStyle = `rgba(150,90,60,${0.7 * o.wrinkle})`; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) { const xx = 168 + k * 8; ctx.beginPath(); ctx.moveTo(xx, -10 + i * 44); ctx.quadraticCurveTo(xx + 5, 6 + i * 44, xx, 20 + i * 44); ctx.stroke(); } ctx.restore(); }
  if (o.nerve) { ctx.save(); ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(242,193,78,0.9)'; ctx.shadowBlur = 14 * o.nerve; ctx.globalAlpha = clamp(o.nerve); ctx.beginPath(); ctx.moveTo(-190, 10); ctx.quadraticCurveTo(0, 20, KNUCKLE[0], KNUCKLE[1] + 4); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(60, -110); ctx.rotate(-0.55); piece(RR(-20, -30, 130, 58, 29), SKIN, 0.5); ctx.restore();
  // index finger with a knuckle pin, nail, and the cut on its tip
  ctx.save(); ctx.translate(...KNUCKLE); ctx.rotate(-D(o.bend || 0));
  const pf = 1 + (o.puff || 0) * 0.28; piece(RR(-10, -32 * pf, FING + 20, 64 * pf, 32 * pf), SKIN, 0.8);
  piece(RR(FING - 58, -30, 56, 24, 11), '#F6D9C6', 0.2);
  if (o.wrinkle) { ctx.save(); ctx.strokeStyle = `rgba(150,90,60,${0.8 * o.wrinkle})`; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let k = 0; k < 8; k++) { const xx = FING - 128 + k * 15; ctx.beginPath(); ctx.moveTo(xx, -27); ctx.quadraticCurveTo(xx + 9, -4, xx - 2, 27); ctx.stroke(); } ctx.restore(); }
  if (o.nerve) { ctx.save(); ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(242,193,78,0.9)'; ctx.shadowBlur = 14 * o.nerve; ctx.globalAlpha = clamp(o.nerve); ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(o.nerveCut ? FING * 0.35 : FING - 30, 4); if (o.nerveCut) { ctx.moveTo(FING * 0.5, 4); ctx.lineTo(FING - 30, 4); } ctx.stroke(); ctx.restore(); if (o.nerveCut) redX(FING * 0.43, 4, 0.35); }
  if (o.cut) {
    const w = 3 + (o.open || 0) * 9;
    ctx.save(); ctx.strokeStyle = '#B5232B'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(FING - 100, 30); ctx.lineTo(lerp(FING - 100, FING - 40, o.cut), 30 - 6 * o.cut); ctx.stroke(); ctx.restore();
    if (o.drop) piece(ELL(FING - 70, 40 + 8 * o.drop, 6 * o.drop, 8 * o.drop), '#C8322B', 0.2, false);
  }
  if (o.sensors) for (let i = 0; i < 40; i++) { const sx = FING - 70 + R2(i) * 80, sy = -26 + R2(i + 5) * 52; const a = clamp(o.sensors * 2 - R2(i + 9)); if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = o.hot ? '#E8443A' : '#F2C14E'; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; } }
  pin(0, 0, 8);
  ctx.restore();
  if (o.palmSensors) for (let i = 0; i < 6; i++) { const a = clamp(o.palmSensors * 2 - R2(i + 3)); if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.arc(-40 + R2(i + 2) * 180, -90 + R2(i + 7) * 160, 6, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; } }
  ctx.restore();
}
const R2 = (i) => { const v = Math.sin(i * 91.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
function tipWorld(o, along = FING - 70, off = 30) { const s = o.s || 1, a = (o.rot || 0), b = -D(o.bend || 0); const lx = KNUCKLE[0] + along * Math.cos(b) - off * Math.sin(b), ly = KNUCKLE[1] + along * Math.sin(b) + off * Math.cos(b); return [o.x + (lx * Math.cos(a) - ly * Math.sin(a)) * s, o.y + (lx * Math.sin(a) + ly * Math.cos(a)) * s]; }
/** a sheet of lined paper (local origin = centre) */
function sheet(x, y, rot, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  piece(POLY([[-260, -340], [190, -340], [260, -270], [260, 340], [-260, 340]]), '#FBF8EF', 1.1);
  piece(POLY([[190, -340], [190, -270], [260, -270]]), '#E6DDC8', 0.3);
  for (let i = 0; i < 11; i++) { ctx.fillStyle = 'rgba(80,130,190,0.35)'; ctx.fillRect(-230, -250 + i * 52, 460, 3); }
  ctx.fillStyle = 'rgba(200,60,60,0.35)'; ctx.fillRect(-190, -340, 3, 680);
  ctx.restore();
}
// fingertip skin cross-section (screen coords). Layers: epidermis, dermis with nerve endings, fat with blood vessels
const EPI = 600, DERM = 690, FAT = 920, BOT = 1180, CX = 540;
const NERVES = Array.from({ length: 24 }, (_, i) => ({ x: 70 + i * 40 + (R2(i) - 0.5) * 16, top: 705 + R2(i + 3) * 40 }));
function skinSection(o) {
  const t = o.t || 0, heal = 1 - (o.close || 0), depth = (o.cut || 0) * 125 * heal, w = ((o.cut || 0) * 70 + (o.open || 0) * 50) * heal;
  ctx.fillStyle = DESK; ctx.fillRect(-400, -400, W + 800, H + 800); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.fillStyle = PAT; ctx.fillRect(-400, -400, W + 800, H + 800); ctx.restore();
  const band = (y0, y1, col, sh) => piece(RR(40, y0, 1000, y1 - y0, y0 === EPI ? 30 : 0), col, sh);
  band(FAT, BOT, '#F4D58A', 0.8);
  for (let i = 0; i < 9; i++) piece(ELL(100 + i * 112, 1050 + (i % 2) * 40, 52, 34), '#F7E2A8', 0, false);
  for (const vy of [960, 1110]) { const p = new Path2D(); p.moveTo(40, vy); for (let px = 40; px <= 1040; px += 40) p.lineTo(px, vy + Math.sin(px / 90 + vy) * 12); for (let px = 1040; px >= 40; px -= 40) p.lineTo(px, vy + 30 * (1 - 0.6 * (o.squeeze || 0)) + Math.sin(px / 90 + vy) * 12); p.closePath(); piece(p, '#C8322B', 0.5); }
  band(DERM, FAT, '#E9A090', 0.8);
  // nerve endings: yellow branches up from the deep layer, ending just under the skin surface
  NERVES.forEach((n, i) => {
    const near = Math.abs(n.x - CX) < 150, hot = o.flash && near && (Math.sin(t * 14 + i * 1.7) > -0.2), col = hot ? '#E8443A' : '#F2C14E';
    const vis = clamp((o.nerves ?? 1) * 1.6 - R2(i + 1) * 0.6); if (vis <= 0) return;
    ctx.save(); ctx.globalAlpha = vis; ctx.strokeStyle = '#7A5A1A'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(n.x + 10, FAT + 20); ctx.quadraticCurveTo(n.x - 18, (FAT + n.top) / 2, n.x, n.top); ctx.moveTo(n.x, n.top + 26); ctx.lineTo(n.x - 20, n.top + 6); ctx.moveTo(n.x, n.top + 34); ctx.lineTo(n.x + 22, n.top + 14); };
    path(); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 5; path(); ctx.stroke();
    for (const [dx, dy] of [[0, 0], [-20, 6], [22, 14]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(n.x + dx, n.top + dy, hot ? 10 : 7, 0, TAU); ctx.fill(); }
    ctx.restore();
  });
  if (o.ridges) { const rg = o.ridges, p = new Path2D(); p.moveTo(40, DERM); p.lineTo(40, EPI + 20 * rg); for (let px = 40; px <= 1040; px += 10) p.lineTo(px, EPI + 20 * rg + Math.sin(px / 36) * 26 * rg); p.lineTo(1040, DERM); p.closePath(); piece(p, '#F3C9A6', 1); } else band(EPI, DERM, '#F3C9A6', 1);
  for (let i = 0; i < 16; i++) { ctx.strokeStyle = 'rgba(160,100,70,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(70 + i * 62, EPI + 40, 26, 3.5, 5.9); ctx.stroke(); }
  // the cut: a ragged wedge
  if (depth > 1) {
    const p = new Path2D(); p.moveTo(CX - w, EPI - 4);
    for (let k = 1; k <= 6; k++) p.lineTo(lerp(CX - w, CX - 6, k / 6) + (R2(k) - 0.5) * 10, EPI + depth * k / 6);
    for (let k = 6; k >= 0; k--) p.lineTo(lerp(CX + w, CX + 6, k / 6) + (R2(k + 20) - 0.5) * 10, EPI + depth * k / 6 - 4);
    p.closePath(); ctx.save(); ctx.fillStyle = '#5A1E22'; ctx.fill(p); ctx.restore();
  }
  // air wisps over the open cut
  if (o.air) for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i * 0.25) % 1, ax = lerp(150, 950, ph); ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * o.air; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); const ay = 470 + i * 34; ctx.moveTo(ax - 120, ay); ctx.bezierCurveTo(ax - 60, ay - 30, ax, ay + 30, ax + 70, ay); ctx.arc(ax + 70, ay - 22, 22, Math.PI / 2, -Math.PI * 0.8, true); ctx.stroke(); ctx.restore(); }
  // layer tags
  if (o.tags) { const s = o.tags; label('SKIN', 170, EPI + 45, s, -0.04, 44); label('NERVES', 880, 790, s, 0.03, 44); label('BLOOD VESSELS', 780, 1000, s, -0.03, 44); }
}
/** a paper edge seen up close; rough = 0 (smooth line) .. 1 (fibres and teeth) */
function paperEdge(y, rough, x0 = -300, x1 = W + 300, seed = 0) {
  const p = new Path2D(); p.moveTo(x0, H + 400); p.lineTo(x0, y);
  for (let px = x0; px <= x1; px += 14) p.lineTo(px, y + rough * ((R2(px * 0.37 + seed) - 0.5) * 40 + Math.sin(px / 23) * 10));
  p.lineTo(x1, H + 400); p.closePath(); piece(p, '#FBF8EF', 1);
  if (rough > 0.05) { ctx.save(); ctx.strokeStyle = 'rgba(150,130,100,0.8)'; ctx.lineWidth = 3; for (let i = 0; i < 60; i++) { const fx = x0 + R2(i + seed) * (x1 - x0), fy = y + (R2(i + 3) - 0.5) * 30 * rough; ctx.globalAlpha = rough; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + 10, fy - 30 * rough, fx + (R2(i + 7) - 0.5) * 50, fy - (30 + R2(i + 9) * 50) * rough); ctx.stroke(); } ctx.restore(); }
}


// ═══════════════ DETAILED ANATOMY KIT (mosquito video) ═══════════════
// Real shapes in paper style: layered pieces, shading, fine strokes. All functions are pure (time in, drawing out).
const INK = '#26232A', CREAM = '#F3EFE6';
function stroke(pts, col, w, close = false) { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); if (close) ctx.closePath(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function curve(x0, y0, cx, cy, x1, y1, col, w) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); }

// ── MOSQUITO (Aedes look), side view facing right. Origin = thorax centre. ~560 px long at s = 1 ──
// o = { x, y, s, rot, flap (wing phase, radians) | wingUp (0..1 folded..raised), fill (0..1 blood in abdomen), fly (legs trail), male, sheathBend (0..1), proboscisLen }
function mosquito(o) {
  const s = o.s || 1, fill = o.fill || 0;
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  // far legs (lighter, behind)
  if (!o.noLegs) legs(o, true);
  // far wing
  wing(o, -1);
  // abdomen: 8 segments, white bands, swells red with blood
  const sw = 1 + fill * 0.75, abd = new Path2D(); abd.moveTo(-50, -14 * sw); abd.bezierCurveTo(-120, -30 * sw, -230, -10 * sw + 10, -300, 52); abd.quadraticCurveTo(-306, 66, -292, 70); abd.bezierCurveTo(-220, 70 + 22 * sw, -110, 62 + 18 * sw, -50, 50 + 8 * sw); abd.closePath();
  piece(abd, fill > 0.05 ? mixCol('#2B2A2E', '#B01E2A', Math.min(1, fill * 1.15)) : '#2B2A2E', 0.9, false);
  ctx.save(); ctx.clip(abd); for (let k = 0; k < 8; k++) { const bx = -78 - k * 30; ctx.fillStyle = fill > 0.3 ? 'rgba(255,190,190,0.55)' : '#ECE8DE'; ctx.beginPath(); ctx.moveTo(bx, -60); ctx.lineTo(bx + 8, -60); ctx.lineTo(bx + 10, 140); ctx.lineTo(bx + 2, 140); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx - 24, -60, 3, 200); }
  if (fill > 0.1) { ctx.globalAlpha = 0.5 * fill; ctx.fillStyle = '#FF7A7A'; ctx.beginPath(); ctx.ellipse(-170, -2 * sw + 8, 110, 14 * sw, -0.12, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
  // thorax: humped, black with the white lyre markings on the back
  const th = new Path2D(); th.moveTo(-60, 30); th.bezierCurveTo(-70, -40, -10, -70, 40, -48); th.bezierCurveTo(78, -30, 82, 30, 60, 52); th.bezierCurveTo(30, 70, -40, 66, -60, 30); th.closePath();
  piece(th, '#2E2C31', 1);
  ctx.save(); ctx.clip(th); ctx.strokeStyle = '#EDEAE2'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -52); ctx.quadraticCurveTo(30, -46, 46, -20); ctx.stroke(); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-24, -40); ctx.quadraticCurveTo(10, -26, 20, 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-40, 10); ctx.lineTo(-6, 30); ctx.stroke(); for (let i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(240,236,226,0.5)'; ctx.beginPath(); ctx.arc(-40 + R2(i) * 100, -30 + R2(i + 3) * 80, 2.2, 0, TAU); ctx.fill(); } ctx.restore();
  // near wing over the body
  wing(o, 1);
  // head: small, almost all compound eye
  const hx = 84, hy = 22;
  piece(CIR(hx, hy, 33), '#2A282C', 0.6);
  const eye = CIR(hx + 4, hy - 2, 28); piece(eye, '#5B2E2C', 0.2, false);
  ctx.save(); ctx.clip(eye); for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { const ex = hx - 26 + c * 7 + (r % 2) * 3.5, ey = hy - 30 + r * 7; ctx.fillStyle = (r + c) % 3 ? '#7A3E3A' : '#8E4B44'; ctx.beginPath(); ctx.arc(ex, ey, 2.8, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(hx - 6, hy - 14, 10, 5, -0.5, 0, TAU); ctx.fill(); ctx.restore();
  // antennae: female = thin with short hair whorls; male = big feathery plumes
  for (const side of [0, 1]) {
    const ax = hx + 18, ay = hy - 18, ex = ax + 70 + side * 18, ey = ay - 120 + side * 10;
    curve(ax, ay, ax + 40 + side * 10, ay - 50, ex, ey, '#3A363C', 3.5);
    for (let k = 1; k <= 12; k++) { const t = k / 13, px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * (ax + 40 + side * 10) + t * t * ex, py = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * (ay - 50) + t * t * ey, L = o.male ? 46 : 8;
      ctx.strokeStyle = o.male ? '#5A5560' : '#4A4650'; ctx.lineWidth = o.male ? 1.6 : 1.4; for (let h = 0; h < (o.male ? 10 : 4); h++) { const a = h / (o.male ? 10 : 4) * TAU; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L * 0.8); ctx.stroke(); } }
  }
  // palps (short in females, long in males)
  stroke([[hx + 26, hy + 10], [hx + 48 + (o.male ? 120 : 0), hy + 40 + (o.male ? 150 : 0)]], '#2E2B31', 5);
  if (!o.male) stroke([[hx + 46, hy + 37], [hx + 52, hy + 44]], '#E9E5DA', 4);
  // proboscis: the labium sheath (scaly) with the labella lobes at the tip
  const pl = o.proboscisLen ?? 200, sb = o.sheathBend || 0;
  if (sb <= 0.01) { ctx.save(); ctx.translate(hx + 26, hy + 14); ctx.rotate(0.95); piece(RR(0, -5, pl, 10, 5), '#332F35', 0.4, false); for (let i = 1; i < 12; i++) stroke([[i * pl / 12, -5], [i * pl / 12 - 6, 5]], 'rgba(160,150,160,0.5)', 1.2); piece(ELL(pl + 4, 0, 9, 6), '#4A4450', 0.2, false); ctx.restore(); }
  // legs in front
  if (!o.noLegs) legs(o, false);
  ctx.restore();
}
function mixCol(a, b, t) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }
function wing(o, side) {
  const up = o.wingUp ?? 0, flap = o.flap != null ? Math.sin(o.flap) : 0, ang = -0.12 - up * 0.7 - flap * 0.6 + (side < 0 ? -0.08 : 0);
  ctx.save(); ctx.translate(-10, -40); ctx.rotate(ang);
  const w = new Path2D(); w.moveTo(0, 0); w.bezierCurveTo(-60, -34, -200, -34, -250, -8); w.bezierCurveTo(-210, 16, -80, 18, 0, 6); w.closePath();
  ctx.save(); ctx.globalAlpha = side < 0 ? 0.35 : 0.55; ctx.fillStyle = '#E8EEF3'; ctx.fill(w); ctx.restore();
  ctx.save(); ctx.clip(w); ctx.strokeStyle = 'rgba(70,80,95,0.55)'; ctx.lineWidth = 1.6; for (const [a, b] of [[-6, -22], [-2, -14], [2, -6], [4, 2], [6, 8]]) { ctx.beginPath(); ctx.moveTo(-6, a * 0.5); ctx.quadraticCurveTo(-130, b, -250, b * 0.5); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-120, -22); ctx.lineTo(-140, 6); ctx.moveTo(-170, -18); ctx.lineTo(-180, 8); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = 'rgba(80,80,90,0.6)'; ctx.lineWidth = 1; for (let i = 0; i < 40; i++) { const t = i / 40, x = -250 * t, y = 6 + 12 * Math.sin(t * Math.PI) * (1 - t); ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x - 3, y + 10); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke(w);
  ctx.restore();
}
function legs(o, far) {
  const base = [[30, 48], [8, 54], [-18, 50]];
  base.forEach(([bx, by], i) => {
    const f = o.fly ? 1 : 0, sgn = i === 0 ? 1 : i === 1 ? 0.2 : -1, wob = Math.sin((o.t || 0) * 3 + i) * 0.05 * f;
    const k1 = [bx + sgn * (60 + 20 * i) - f * 80, by + 70 - f * 20], k2 = [k1[0] + sgn * 70 - f * 100, k1[1] + (o.fly ? 30 : 110)], ft = [k2[0] + sgn * 50 - f * 60, k2[1] + (o.fly ? 20 : 40)];
    const dx = far ? -14 : 0, col = far ? '#5A5660' : '#2B2830';
    ctx.save(); ctx.translate(dx, far ? -6 : 0); ctx.rotate(wob);
    stroke([[bx, by], k1], col, far ? 5 : 6); stroke([k1, k2], col, far ? 4 : 5); stroke([k2, ft], col, far ? 3 : 3.5);
    for (const [p, q] of [[k1, k2], [k2, ft]]) for (let b = 0.2; b < 1; b += 0.33) { const mx = p[0] + (q[0] - p[0]) * b, my = p[1] + (q[1] - p[1]) * b; ctx.fillStyle = far ? 'rgba(235,232,224,0.6)' : '#EDEAE2'; ctx.beginPath(); ctx.arc(mx, my, far ? 2.5 : 3.2, 0, TAU); ctx.fill(); }
    ctx.restore();
  });
}

// ── THE SIX STYLETS (exploded view, each with its real shape). Origin = top of the bundle, pointing down. ──
const STY = [
  { k: 'maxilla', name: 'SAW', col: '#4E8FD6' }, { k: 'maxilla', name: 'SAW', col: '#4E8FD6' },
  { k: 'mandible', name: 'CLAMP', col: '#F2C14E' }, { k: 'mandible', name: 'CLAMP', col: '#F2C14E' },
  { k: 'labrum', name: 'STRAW', col: '#D9534F' }, { k: 'hypo', name: 'SPIT TUBE', col: '#6FAE58' },
];
function stylet(kind, len, col, w = 1) {
  // drawn pointing down from (0,0) to (0,len)
  if (kind === 'maxilla') { const tz = Math.min(len * 0.45, 26 * w), st2 = tz / 8, p = new Path2D(); p.moveTo(-5 * w, 0); p.lineTo(5 * w, 0); p.lineTo(5 * w, len - tz); for (let i = 0; i < 8; i++) { p.lineTo(5 * w + 6 * w, len - tz + i * st2 + st2 * 0.4); p.lineTo(5 * w, len - tz + i * st2 + st2); } p.lineTo(0, len); p.lineTo(-5 * w, len - tz); p.closePath(); piece(p, col, 0.4, false); }
  else if (kind === 'mandible') { const p = new Path2D(); p.moveTo(-3.5 * w, 0); p.lineTo(3.5 * w, 0); p.lineTo(3 * w, len - 20); p.quadraticCurveTo(0, len + 6, -3 * w, len - 20); p.closePath(); piece(p, col, 0.4, false); }
  else if (kind === 'labrum') { piece(RR(-8 * w, 0, 16 * w, len, 8 * w), col, 0.5, false); stroke([[0, 6], [0, len - 10]], 'rgba(90,20,20,0.55)', 4 * w); for (let i = 0; i < 5; i++) stroke([[-8 * w, len - 8 - i * 6], [-12 * w, len - 12 - i * 6]], col, 2); }
  else { piece(RR(-4 * w, 0, 8 * w, len, 4 * w), col, 0.4, false); stroke([[0, 4], [0, len - 6]], 'rgba(30,70,30,0.55)', 2 * w); }
}
/** fan of the six stylets spreading from a bundle point (x, y). spread 0..1 */
function styletFan(x, y, len, spread, labels = 0, w = 2.6) {
  STY.forEach((st, i) => { const a = (i - 2.5) * 0.2 * spread; ctx.save(); ctx.translate(x, y); ctx.rotate(a); stylet(st.k, len, st.col, w); ctx.restore(); });
  if (labels > 0) { const groups = [['SAW x2', [0, 1], '#2F6FB5'], ['CLAMP x2', [2, 3], '#8A6A12'], ['STRAW', [4], '#B5302C'], ['SPIT TUBE', [5], '#3F7F36']];
    groups.forEach(([name, ids, col], g) => { const a = ((ids[0] + ids[ids.length - 1]) / 2 - 2.5) * 0.2 * spread, tx = x + Math.sin(-a) * (len + 20), ty = y + Math.cos(a) * (len + 20), lx = Math.max(150, Math.min(930, tx)), ly = y + len + 110 + (g % 2) * 80;
      ctx.save(); ctx.globalAlpha = Math.min(1, labels); ctx.setLineDash([8, 8]); stroke([[tx, ty], [lx, ly - 30]], col, 3); ctx.restore(); label(name, lx, ly, labels, (g % 2 ? 0.03 : -0.03), 36, '#FBF6E8', col); }); }
}

// ── SKIN CROSS-SECTION, realistic layers. Screen space: surface at y = S0, from x = -100 to 1180 ──
const S0 = 560, SC = 16, EPI_B = 700, DERM_B = 1180, FAT_B = 1440;
const DEJ = (x) => EPI_B + Math.sin(x / 46) * 26 + Math.sin(x / 19) * 6;      // wavy epidermis/dermis border (rete ridges)
function skinDetail(o = {}) {
  const t = o.t || 0, bump = o.bump || 0, BX = o.bx ?? 540;
  const surf = (x) => S0 - bump * 110 * Math.exp(-Math.pow((x - BX) / 260, 2));
  // air above
  ctx.fillStyle = '#EADFCB'; ctx.fillRect(-400, -400, W + 800, S0 + 400); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.fillStyle = PAT; ctx.fillRect(-400, -400, W + 800, S0 + 400); ctx.restore();
  // fat layer (hypodermis): lobules
  piece(RR(-300, DERM_B - 20, W + 600, 600, 0), '#F2D58C', 0.6, false);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) { const fx = -60 + c * 110 + (r % 2) * 55, fy = DERM_B + 40 + r * 90; piece(ELL(fx, fy, 52, 40, R2(c + r * 9) * 0.6), (r + c) % 2 ? '#F7E1A6' : '#F5DB98', 0.15, false); }
  // dermis
  const derm = new Path2D(); derm.moveTo(-300, DERM_B); for (let x = -300; x <= W + 300; x += 8) derm.lineTo(x, DEJ(x) - (surf(x) - S0) * -1 * 0); derm.lineTo(W + 300, DERM_B); derm.closePath();
  piece(derm, o.red ? mixCol('#EAA79A', '#E07A6E', o.red) : '#EAA79A', 0.4, false);
  ctx.save(); ctx.clip(derm); ctx.strokeStyle = 'rgba(255,235,228,0.55)'; ctx.lineWidth = 3; for (let i = 0; i < 26; i++) { const y = 760 + (i % 13) * 32, x0 = -100 + R2(i) * 200 + (i > 12 ? 600 : 0); ctx.beginPath(); ctx.moveTo(x0, y); for (let k = 1; k < 8; k++) ctx.lineTo(x0 + k * 60, y + Math.sin(k * 1.3 + i) * 12); ctx.stroke(); } ctx.restore();
  // hair follicle + sebaceous gland (left), sweat gland coil + duct (right)
  ctx.save(); ctx.translate(150, 0); const fol = new Path2D(); fol.moveTo(-20, S0); fol.lineTo(-60, 1010); fol.quadraticCurveTo(-58, 1060, -10, 1056); fol.lineTo(26, S0); fol.closePath(); piece(fol, '#E3AE93', 0.6, false); ctx.save(); ctx.strokeStyle = '#B97F65'; ctx.lineWidth = 3; ctx.stroke(fol); ctx.restore(); piece(ELL(-34, 1040, 34, 26), '#C9876B', 0.4, false); stroke([[-34, 1040], [4, S0], [30, S0 - 160]], '#4A3328', 10); piece(ELL(18, 840, 40, 30), '#F0D7A8', 0.4, false); for (let i = 0; i < 5; i++) piece(CIR(8 + (i % 3) * 14, 830 + Math.floor(i / 3) * 16, 6), '#E8C48C', 0, false); ctx.restore();
  ctx.save(); ctx.translate(930, 0); ctx.strokeStyle = '#E8D9B8'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, surf(930) + 4); for (let y = S0; y < 1040; y += 14) ctx.lineTo(Math.sin(y / 30) * 10, y); ctx.stroke(); for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 1.4) * 22, 1080 + Math.sin(i * 1.4) * 18, 16, 0, TAU); ctx.stroke(); } ctx.restore();
  // blood vessels: an arteriole (red) and venule (blue-purple) running sideways, with capillary loops up into the papillae
  const vy = o.vy ?? 990, wide = 1 + (o.widen || 0) * 0.45;
  for (const [yy, col, r] of [[vy, '#C62A33', 28 * wide], [vy + 92, '#7A4D8C', 30 * wide]]) { const p = new Path2D(); p.moveTo(-300, yy - r); for (let x = -300; x <= W + 300; x += 20) p.lineTo(x, yy - r + Math.sin(x / 160 + yy) * 10); for (let x = W + 300; x >= -300; x -= 20) p.lineTo(x, yy + r + Math.sin(x / 160 + yy) * 10); p.closePath(); piece(p, col, 0.6, false); ctx.save(); ctx.clip(p); for (let i = 0; i < 18; i++) { const cx2 = ((i * 80 + t * 160 * (col === '#C62A33' ? 1 : -1)) % 1500 + 1500) % 1500 - 200; ctx.fillStyle = col === '#C62A33' ? '#E0505A' : '#9A6AAE'; ctx.beginPath(); ctx.ellipse(cx2, yy + Math.sin(i) * r * 0.4, 13, 9, i, 0, TAU); ctx.fill(); } ctx.restore(); }
  const PLX = 830; stroke(Array.from({ length: 70 }, (_, i) => [-300 + i * 24, PLX + Math.sin(i * 0.7) * 8]), '#C24A4F', 5 * wide); stroke(Array.from({ length: 70 }, (_, i) => [-300 + i * 24, PLX + 18 + Math.sin(i * 0.7 + 1) * 8]), '#8E5A9E', 5 * wide);
  for (let i = 0; i < 9; i++) { const cx2 = 46 + i * 144; const top = DEJ(cx2) - 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#C24A4F'; ctx.lineWidth = 4 * wide; ctx.beginPath(); ctx.moveTo(cx2 - 8, PLX); ctx.bezierCurveTo(cx2 - 14, top + 40, cx2 - 8, top, cx2, top); ctx.stroke(); ctx.strokeStyle = '#8E5A9E'; ctx.beginPath(); ctx.moveTo(cx2, top); ctx.bezierCurveTo(cx2 + 8, top, cx2 + 14, top + 40, cx2 + 8, PLX + 18); ctx.stroke(); }
  for (const xx of [200, 640, 1000]) { stroke([[xx, PLX + 18], [xx + 20, vy - 24]], '#C24A4F', 6 * wide); }
  // nerves: yellow fibres from deep, ending in free endings just under the epidermis
  for (let i = 0; i < 6; i++) { const nx = 118 + i * 180 + (R2(i) - 0.5) * 20, top = DEJ(nx) + 16, hot = o.itch && Math.sin(t * 14 + i * 1.7) > -0.3, col = hot ? '#FF5040' : '#F2C14E';
    ctx.save(); if (hot) { ctx.shadowColor = 'rgba(255,80,60,0.9)'; ctx.shadowBlur = 16; } ctx.strokeStyle = '#7A5A1A'; ctx.lineWidth = 7; ctx.lineCap = 'round'; const path = () => { ctx.beginPath(); ctx.moveTo(nx + 30, DERM_B - 30); ctx.bezierCurveTo(nx - 20, 1000, nx + 20, 860, nx, top); ctx.moveTo(nx, top + 30); ctx.lineTo(nx - 22, top + 4); ctx.moveTo(nx, top + 40); ctx.lineTo(nx + 24, top + 16); }; path(); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 3.5; path(); ctx.stroke(); for (const [ddx, ddy] of [[0, 0], [-22, 4], [24, 16]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(nx + ddx, top + ddy, hot ? 7 : 5, 0, TAU); ctx.fill(); } ctx.restore(); }
  // mast cells near the vessels (lilac, packed with purple granules); burst releases histamine
  (o.mast || []).forEach(([mx, my, burst2], i) => { piece(ELL(mx, my, 34, 28, 0.3), '#C9A3DA', 0.5); piece(ELL(mx + 4, my, 12, 10), '#6B3D7E', 0, false); for (let g = 0; g < 18; g++) { const a = g / 18 * TAU + i, r = 16 + (g % 3) * 4 + (burst2 || 0) * (40 + R2(g + i) * 90); ctx.globalAlpha = 1 - (burst2 || 0) * 0.3; ctx.fillStyle = '#7D3C98'; ctx.beginPath(); ctx.arc(mx + Math.cos(a) * r, my + Math.sin(a) * r * 0.8, 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; } });
  // epidermis: rows of cells, flatter toward the top, dark basal row
  const epi = new Path2D(); epi.moveTo(-300, surf(-300)); for (let x = -300; x <= W + 300; x += 8) epi.lineTo(x, surf(x)); for (let x = W + 300; x >= -300; x -= 8) epi.lineTo(x, DEJ(x)); epi.closePath();
  piece(epi, '#F3C9A6', 0.8, false);
  ctx.save(); ctx.clip(epi); for (let r = 0; r < 7; r++) for (let c = -2; c < 40; c++) { const cx2 = c * 32 + (r % 2) * 16, cy2 = surf(cx2) + SC + 8 + r * 20, w2 = 13 - r * 0.5, h2 = 4 + r * 1.3; ctx.fillStyle = r === 6 ? '#D99877' : r > 3 ? '#EDB996' : '#F6D3B5'; ctx.beginPath(); ctx.ellipse(cx2, cy2, w2, h2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(150,90,70,0.45)'; if (r > 1) { ctx.beginPath(); ctx.arc(cx2, cy2, 2.4, 0, TAU); ctx.fill(); } } ctx.restore();
  // stratum corneum: thin flaky top layer
  ctx.save(); ctx.strokeStyle = '#E9D7C2'; ctx.lineWidth = 3; for (let x = -300; x <= W + 300; x += 22) { ctx.beginPath(); ctx.moveTo(x, surf(x) + 4); ctx.lineTo(x + 26, surf(x + 26) + 2); ctx.stroke(); } ctx.restore();
  // fluid leak + redness around a widened vessel
  if (o.leak) { ctx.save(); ctx.globalAlpha = 0.4 * o.leak; ctx.fillStyle = '#F7E9A8'; ctx.beginPath(); ctx.ellipse(BX, 880, 300 * o.leak, 170 * o.leak, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  // layer tags
  if (o.tags) { const s2 = o.tags; label('SKIN SURFACE', 160, S0 - 60, s2, -0.04, 34); label('BLOOD VESSELS', 820, vy - 64, s2, 0.03, 34); label('NERVE', 620, 760, s2 * (o.nerveTag ? 1 : 0), -0.03, 30); }
}
/** a red blood cell, face on (biconcave: lighter dimple in the middle). */
function rbc(x, y, r, a = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); piece(ELL(0, 0, r, r * 0.92), '#C8262E', 0.4, false); ctx.fillStyle = 'rgba(240,110,110,0.6)'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.5, r * 0.45, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,10,20,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.92, r * 0.84, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
function platelet(x, y, r, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); const p = new Path2D(); for (let i = 0; i < 9; i++) { const ang = i / 9 * TAU, rr2 = r * (0.7 + R2(i + Math.floor(a * 10)) * 0.5); i ? p.lineTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2) : p.moveTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2); } p.closePath(); piece(p, '#B89ACB', 0.2, false); ctx.restore(); }

// ── ARM SURFACE (macro, top view): skin lines, pores, fine hairs; bump = welt ──
function armSurface(o = {}) {
  const t = o.t || 0, cx = o.bx ?? 560, cy = o.by ?? 900, bump = o.bump || 0;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#EBB894'); g.addColorStop(1, '#DE9F7A'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, H + 800);
  if (!PAT) PAT = paperPattern(); ctx.save(); ctx.fillStyle = PAT; ctx.globalAlpha = 0.9; ctx.fillRect(-400, -400, W + 800, H + 800); ctx.restore();
  // skin lines: a fine diamond grid of creases
  ctx.save(); ctx.strokeStyle = 'rgba(160,95,65,0.22)'; ctx.lineWidth = 2; for (let i = -40; i < 60; i++) { ctx.beginPath(); ctx.moveTo(i * 46 - 600, -200); ctx.lineTo(i * 46 + 900, 2200); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 52 + 1200, -200); ctx.lineTo(i * 52 - 400, 2200); ctx.stroke(); } ctx.restore();
  // pores
  for (let i = 0; i < 160; i++) { ctx.fillStyle = 'rgba(140,80,55,0.35)'; ctx.beginPath(); ctx.arc(R2(i) * 1300 - 100, R2(i + 7) * 2100 - 100, 2 + R2(i + 3) * 2, 0, TAU); ctx.fill(); }
  // welt
  if (bump > 0) { const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, 300 * bump); halo.addColorStop(0, 'rgba(220,70,70,0.55)'); halo.addColorStop(1, 'rgba(220,70,70,0)'); ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, 300 * bump, 0, TAU); ctx.fill(); piece(ELL(cx, cy, 120 * bump, 100 * bump), '#F0A992', 0.9 * bump, false); ctx.fillStyle = `rgba(255,240,230,${0.45 * bump})`; ctx.beginPath(); ctx.ellipse(cx - 30 * bump, cy - 34 * bump, 50 * bump, 26 * bump, -0.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#9C2A2E'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill(); }
  // fine hairs, bending a little
  for (let i = 0; i < 70; i++) { const hx = R2(i + 11) * 1300 - 100, hy = R2(i + 23) * 2100 - 100, L = 40 + R2(i + 5) * 70, a = 0.6 + R2(i + 2) * 0.5 + Math.sin(t + i) * 0.03; ctx.fillStyle = 'rgba(120,70,45,0.6)'; ctx.beginPath(); ctx.arc(hx, hy, 3, 0, TAU); ctx.fill(); curve(hx, hy, hx + Math.cos(a) * L * 0.5, hy + Math.sin(a) * L * 0.3 - 10, hx + Math.cos(a) * L, hy + Math.sin(a) * L * 0.6, 'rgba(90,55,38,0.75)', 2.4); }
}
// ── DUSK PORCH (wide scene) ──
function dusk(t) {
  const g = ctx.createLinearGradient(0, 0, 0, 1300); g.addColorStop(0, '#2D2F5A'); g.addColorStop(0.55, '#B95A6C'); g.addColorStop(1, '#F2A65A'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, H + 800);
  piece(CIR(820, 900, 120), '#FCD38A', 0.3, false);
  const hills = (base, amp, col, seed) => { const p = new Path2D(); p.moveTo(-400, H + 400); for (let x = -400; x <= W + 400; x += 40) p.lineTo(x, base - Math.abs(Math.sin(x / 300 + seed)) * amp); p.lineTo(W + 400, H + 400); p.closePath(); piece(p, col, 0.8); };
  hills(1060, 120, '#5B4A6E', 1); hills(1140, 80, '#3E3557', 2.4);
  piece(RR(-300, 1200, W + 600, 700, 0), '#6B4A3A', 0.6, false); for (let i = 0; i < 14; i++) stroke([[-300 + i * 110, 1200], [-300 + i * 110, 1900]], 'rgba(40,25,20,0.35)', 4);
  for (let i = 0; i < 8; i++) { const bx = 120 + R2(i) * 860, by = 300 + R2(i + 4) * 600, a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#FFF3A8'; ctx.shadowColor = '#FFF3A8'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(bx, by, 5, 0, TAU); ctx.fill(); ctx.restore(); }
}

// ═══════════════ EAR KIT (ear-water video): front cross-section of the right ear + detailed side-view outer ear ═══════════════
// Section layout (screen coords at view 1): outside air on the left, the canal runs right from the opening (300, 930)
// through a gentle S bend to the eardrum (~712, 928); middle ear (ossicles), inner ear (cochlea, canals), brain above.
const CAN0 = [300, 930], CAN3 = [705, 928];
function canalP(k = 0) {
  const S1 = [470, 838], S2 = [560, 1000], L1 = [435, 929], L2 = [570, 928];
  return [CAN0, [lerp(S1[0], L1[0], k), lerp(S1[1], L1[1], k)], [lerp(S2[0], L2[0], k), lerp(S2[1], L2[1], k)], CAN3];
}
function cb(P, u) { const a = 1 - u; return [0, 1].map((j) => a * a * a * P[0][j] + 3 * a * a * u * P[1][j] + 3 * a * u * u * P[2][j] + u * u * u * P[3][j]); }
function cnorm(P, u) { const p = cb(P, Math.max(0, u - 0.01)), q = cb(P, Math.min(1, u + 0.01)); const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; }
const canalR = (u) => 44 - 12 * Math.exp(-Math.pow((u - 0.62) / 0.18, 2));
function canalPt(P, u, off) { const c = cb(P, u), n = cnorm(P, u); return [c[0] + n[0] * off, c[1] + n[1] * off]; }
/** closed band along the canal from u0 to u1, half-width rf(u) */
function tube(P, u0, u1, rf, n = 32) {
  const p = new Path2D();
  for (let i = 0; i <= n; i++) { const u = lerp(u0, u1, i / n), q = canalPt(P, u, rf(u)); i ? p.lineTo(...q) : p.moveTo(...q); }
  for (let i = n; i >= 0; i--) { const u = lerp(u0, u1, i / n), q = canalPt(P, u, -rf(u)); p.lineTo(...q); }
  p.closePath(); return p;
}
const headX = (y) => 312 + Math.pow((y - 930) / 700, 2) * 90;
const rotP = (p, c, a) => [c[0] + (p[0] - c[0]) * Math.cos(a) - (p[1] - c[1]) * Math.sin(a), c[1] + (p[0] - c[0]) * Math.sin(a) + (p[1] - c[1]) * Math.cos(a)];
function arrow(x0, y0, x1, y1, col = '#FBF6E8', w = 14) {
  const a = Math.atan2(y1 - y0, x1 - x0); stroke([[x0, y0], [x1 - Math.cos(a) * 20, y1 - Math.sin(a) * 20]], 'rgba(40,25,15,0.55)', w + 6); stroke([[x0, y0], [x1 - Math.cos(a) * 20, y1 - Math.sin(a) * 20]], col, w);
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(a); piece(POLY([[8, 0], [-34, -26], [-34, 26]]), col, 0.4); ctx.restore();
}

/** o = { t, k (0 natural bend .. 1 straightened), pinnaUp, water [u0,u1], air 0..1, soft 0..1, germs 0..1, drumGlow, swab (tip u), plug (wax u), cup (0 off, else lift 0..1) } */
function earSection(o = {}) {
  const t = o.t || 0, k = o.k || 0, P = canalP(k), soft = o.soft || 0;
  // the side of the head: skin, then soft tissue
  const hp = (inset) => { const p = new Path2D(); p.moveTo(headX(-900) + inset, -900); for (let y = -900; y <= 2800; y += 50) p.lineTo(headX(y) + inset, y); p.lineTo(2600, 2800); p.lineTo(2600, -900); p.closePath(); return p; };
  piece(hp(0), SKIN, 1); piece(hp(22), '#E2998A', 0, false);
  for (let i = 0; i < 16; i++) piece(ELL(380 + R2(i) * 320, 1130 + R2(i + 4) * 420, 40 + R2(i + 2) * 30, 26, R2(i) * 3), '#D98478', 0, false);
  // brain above, with its folds
  const br = new Path2D(); br.moveTo(440, -900); br.lineTo(440, 560); br.bezierCurveTo(600, 640, 800, 600, 2600, 560); br.lineTo(2600, -900); br.closePath(); piece(br, '#EDB9C0', 0.5);
  ctx.save(); ctx.clip(br); for (let i = 0; i < 30; i++) { const gx = 450 + (i % 6) * 120, gy = 60 + Math.floor(i / 6) * 110; curve(gx, gy, gx + 50, gy - 60 + (i % 2) * 120, gx + 120, gy + 10, '#C98A94', 6); } ctx.restore();
  // temporal bone (spongy) around the inner canal, middle ear and inner ear
  const bone = new Path2D(); bone.moveTo(420, 690); bone.bezierCurveTo(600, 620, 900, 640, 1500, 600); bone.lineTo(1500, 1180); bone.bezierCurveTo(900, 1220, 600, 1160, 430, 1120); bone.bezierCurveTo(400, 980, 400, 820, 420, 690); bone.closePath();
  piece(bone, '#EEE1C3', 0.8);
  ctx.save(); ctx.clip(bone); for (let i = 0; i < 140; i++) { ctx.fillStyle = 'rgba(190,165,115,0.45)'; ctx.beginPath(); ctx.ellipse(420 + R2(i) * 700, 620 + R2(i + 9) * 600, 4 + R2(i + 3) * 8, 3 + R2(i + 5) * 5, R2(i) * 3, 0, TAU); ctx.fill(); } ctx.restore();
  // middle ear: an air pocket behind the eardrum, tube down to the throat
  const mid = new Path2D(); mid.moveTo(705, 860); mid.bezierCurveTo(715, 770, 790, 760, 815, 800); mid.bezierCurveTo(850, 860, 852, 980, 830, 1030); mid.bezierCurveTo(800, 1062, 752, 1050, 735, 1000); mid.closePath();
  const et = [[810, 1030], [880, 1120], [990, 1260], [1120, 1400]]; stroke(et, '#C9707A', 30); stroke(et, '#F4D3CF', 16);
  piece(mid, '#FAF0E2', 0.3, false);
  // inner ear: three loop canals, vestibule, snail-shell cochlea, nerve to the brain
  const LAB = '#E9BE8E', LAB_D = '#9C6B3E';
  const loop = (cx, cy, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU); ctx.strokeStyle = LAB_D; ctx.lineWidth = 18; ctx.stroke(); ctx.strokeStyle = LAB; ctx.lineWidth = 11; ctx.stroke(); };
  loop(905, 790, 46, 58, 0.2); loop(965, 845, 62, 36, -0.1); loop(930, 868, 34, 50, 0.9);
  const nv = [[970, 960], [1030, 930], [1120, 915]]; stroke(nv, '#9A7A1A', 18); stroke(nv, '#F2C14E', 11);
  piece(ELL(880, 905, 38, 30), LAB, 0.3);
  piece(ELL(915, 1000, 72, 64), '#E3B07E', 0.4);
  const sp = []; for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU * 2.6, r = 62 - i * 0.6; sp.push([915 + Math.cos(a) * r, 1000 + Math.sin(a) * r * 0.86]); }
  stroke(sp, LAB_D, 12); stroke(sp, '#F6D6A8', 6);
  // the 3 tiny bones: hammer (on the eardrum), anvil, stirrup (to the oval window)
  const OSS = '#FFF8EA', OSS_D = '#8E7C5A', bp2 = (p) => { piece(p, OSS, 0.3, false); ctx.save(); ctx.strokeStyle = OSS_D; ctx.lineWidth = 3; ctx.stroke(p); ctx.restore(); };
  const mh = [[752, 810], [740, 860], [724, 932]]; stroke(mh, OSS_D, 14); stroke(mh, OSS, 9); bp2(CIR(756, 800, 17));
  const ih = [[795, 815], [803, 880], [806, 905]]; stroke(ih, OSS_D, 12); stroke(ih, OSS, 7); bp2(ELL(790, 806, 17, 14));
  ctx.save(); ctx.strokeStyle = OSS_D; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(806, 905); ctx.quadraticCurveTo(820, 885, 846, 896); ctx.moveTo(806, 905); ctx.quadraticCurveTo(822, 930, 846, 922); ctx.stroke(); ctx.restore(); bp2(RR(842, 884, 11, 48, 4));
  // the outer ear flap (cut through): cartilage core under skin, soft lobe below; moves up and back when pulled
  ctx.save(); ctx.translate(-(o.pinnaUp || 0) * 20, -(o.pinnaUp || 0) * 45);
  const pn = new Path2D(); pn.moveTo(322, 870); pn.bezierCurveTo(250, 800, 150, 720, 130, 610); pn.bezierCurveTo(115, 520, 205, 480, 232, 555); pn.bezierCurveTo(246, 600, 210, 618, 196, 592); pn.bezierCurveTo(200, 690, 270, 770, 334, 822); pn.closePath();
  piece(pn, '#EDB38E', 0.9);
  ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(318, 842); ctx.bezierCurveTo(245, 778, 165, 705, 160, 612); ctx.bezierCurveTo(156, 548, 205, 530, 212, 570); ctx.strokeStyle = '#C99A5A'; ctx.lineWidth = 16; ctx.stroke(); ctx.strokeStyle = '#F2DCA8'; ctx.lineWidth = 10; ctx.stroke(); ctx.restore();
  const lob = new Path2D(); lob.moveTo(326, 990); lob.bezierCurveTo(265, 1030, 212, 1100, 222, 1165); lob.bezierCurveTo(232, 1230, 305, 1225, 322, 1150); lob.lineTo(332, 1000); lob.closePath(); piece(lob, '#F0BE9C', 0.9);
  ctx.restore();
  // the canal: cartilage sleeve (outer third), skin lining, open air inside
  const lin = 14 + soft * 10, rr = (u) => canalR(u) - soft * 9;
  piece(tube(P, 0, 0.36, (u) => rr(u) + lin + 18), '#F0D9A2', 0.4, false);
  piece(tube(P, 0, 1, (u) => rr(u) + lin), soft ? mixCol('#EFA894', '#F7E2D6', soft) : '#EFA894', 0.3, false);
  piece(tube(P, 0, 0.995, rr), '#FBF3E6', 0, false);
  if (soft > 0) for (let i = 0; i < 30; i++) { const u = 0.06 + i / 30 * 0.88, sd = i % 2 ? 1 : -1, q = canalPt(P, u, sd * rr(u)); ctx.save(); ctx.globalAlpha = soft; piece(CIR(q[0], q[1], 8), '#FBEDE6', 0, false); ctx.restore(); }
  for (let i = 0; i < 18; i++) { const u = 0.03 + R2(i) * 0.3, sd = i % 2 ? 1 : -1, a = canalPt(P, u, sd * rr(u)), b = canalPt(P, u + 0.03, sd * (rr(u) - 16)); stroke([a, b], '#5A3A2A', 3); }
  for (let i = 0; i < 10; i++) { const u = 0.04 + i * 0.03, sd = i % 2 ? 1 : -1, q = canalPt(P, u, sd * (rr(u) + lin + 6)); piece(CIR(q[0], q[1], 5), '#E9B44C', 0, false); }
  for (let i = 0; i < 6; i++) { const u = 0.08 + i * 0.045, sd = i % 2 ? 1 : -1, q = canalPt(P, u, sd * (rr(u) - 3)); piece(ELL(q[0], q[1], 11, 7, Math.atan2(cnorm(P, u)[0], -cnorm(P, u)[1])), '#C98A2E', 0.2, false); }
  // wax pushed by a swab
  if (o.plug != null) { const pu = o.plug; piece(tube(P, Math.max(0, pu - 0.04), Math.min(0.99, pu + 0.04), (u) => rr(u) - 1), '#B5762A', 0.3, false); for (let i = 0; i < 5; i++) { const q = canalPt(P, pu + (R2(i) - 0.5) * 0.05, (R2(i + 3) - 0.5) * rr(pu)); piece(CIR(q[0], q[1], 4), '#8A5418', 0, false); } }
  // water and the trapped air bubble
  if (o.water) { const [u0, u1] = o.water; if (u1 > u0 + 0.004) {
    const wob = (u) => rr(u) - 3 + Math.sin(t * 6 + u * 20) * 2; piece(tube(P, u0, u1, wob, 24), '#4FA3D9', 0.2, false);
    const sh = []; for (let i = 0; i <= 12; i++) { const u = lerp(u0, u1, i / 12); sh.push(canalPt(P, u, -rr(u) * 0.45)); } stroke(sh, 'rgba(255,255,255,0.6)', 5);
  } }
  if (o.air) { const a0 = o.water ? o.water[1] : 0.7, c = cb(P, (a0 + 0.985) / 2), n = cnorm(P, (a0 + 0.985) / 2); ctx.save(); ctx.globalAlpha = clamp(o.air); ctx.translate(c[0], c[1]); ctx.rotate(Math.atan2(-n[0], n[1])); const rx = Math.max(10, (0.985 - a0) * 205), ry = rr((a0 + 1) / 2) - 5; piece(ELL(0, 0, rx, ry), 'rgba(235,248,255,0.95)', 0.2, false); ctx.strokeStyle = '#6FAAD3'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(-rx * 0.35, -ry * 0.45, rx * 0.22, ry * 0.18, -0.3, 0, TAU); ctx.fill(); ctx.restore(); }
  // germs on the soggy skin
  if (o.germs) { const n = Math.floor(o.germs * 36); for (let i = 0; i < n; i++) { const u = 0.12 + R2(i + 40) * 0.78, sd = R2(i + 2) > 0.5 ? 1 : -1, q = canalPt(P, u, sd * (rr(u) - 9 - R2(i + 7) * 12)); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(R2(i) * 6 + Math.sin(t * 4 + i) * 0.3); piece(RR(-14, -6, 28, 12, 6), i % 3 ? '#6FAE58' : '#8E5BB5', 0.3, false); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-8, -3, 10, 2); ctx.restore(); } }
  // the eardrum: a thin pearly membrane at an angle, hammer bone attached
  ctx.save(); if (o.drumGlow) { ctx.shadowColor = '#FFE680'; ctx.shadowBlur = 40 * o.drumGlow; }
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(694, 856); ctx.quadraticCurveTo(732, 930, 738, 1000); ctx.strokeStyle = o.drumGlow ? mixCol('#A99CB8', '#F2C14E', clamp(o.drumGlow)) : '#A99CB8'; ctx.lineWidth = 11; ctx.stroke(); ctx.strokeStyle = '#EEE8F4'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
  // cotton swab
  if (o.swab != null) {
    const us = o.swab, tipAt = (u) => (u < 0 ? [CAN0[0] + u * 420, CAN0[1]] : cb(P, u)), tip = tipAt(us), path = [tip];
    if (us > 0) for (let i = 19; i >= 0; i--) path.push(cb(P, us * i / 20)); path.push([-500, CAN0[1]]);
    stroke(path, '#B9AE98', 20); stroke(path, '#F6F1E6', 13);
    const n = us > 0 ? cnorm(P, us) : [0, 1]; ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(Math.atan2(-n[0], n[1]));
    piece(ELL(0, 0, 38, 26), '#FFFFFF', 0.5); for (let i = 0; i < 9; i++) piece(CIR(-24 + (i % 3) * 22 + R2(i) * 6, -14 + Math.floor(i / 3) * 14, 9), '#F7F5F0', 0, false); ctx.restore();
  }
}

// ── side view of the head with a detailed outer ear (face to the right). o = { t, ex, ey, s, pull, water, wet } ──
function pinnaSide(o) {
  const SK = '#EDB38E', SH1 = '#D49270', SH2 = '#B97659', HL = '#F8D3B6';
  const outer = new Path2D(); outer.moveTo(28, -150); outer.bezierCurveTo(-10, -212, -125, -222, -152, -130); outer.bezierCurveTo(-176, -60, -152, 30, -112, 82); outer.bezierCurveTo(-95, 108, -88, 150, -55, 168); outer.bezierCurveTo(-18, 186, 18, 158, 14, 112); outer.lineTo(34, 40); outer.bezierCurveTo(40, -20, 42, -90, 28, -150); outer.closePath();
  piece(outer, SK, 1.2);
  // scapha: the groove inside the curled rim
  const sc = new Path2D(); sc.moveTo(12, -152); sc.bezierCurveTo(-20, -194, -116, -198, -135, -128); sc.bezierCurveTo(-153, -62, -133, 18, -98, 64); sc.bezierCurveTo(-92, 40, -100, -10, -104, -60); sc.bezierCurveTo(-110, -130, -60, -160, 12, -152); sc.closePath(); piece(sc, SH1, 0, false);
  ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(20, -166); ctx.bezierCurveTo(-12, -206, -120, -214, -146, -130); ctx.bezierCurveTo(-166, -64, -146, 26, -108, 78); ctx.strokeStyle = HL; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
  // triangular hollow between the two arms of the inner ridge
  piece(POLY([[-80, -104], [-58, -150], [-4, -102]]), SH1, 0, false);
  // inner Y ridge (antihelix)
  const ridge = (pts, w) => { stroke(pts.map(([a, b]) => [a + 4, b + 5]), SH2, w + 4); stroke(pts, '#F0BC97', w); stroke(pts.map(([a, b]) => [a - 3, b - 3]), HL, 4); };
  ridge([[-62, 50], [-80, 0], [-88, -50], [-82, -98]], 22); ridge([[-82, -98], [-70, -140], [-48, -160]], 14); ridge([[-82, -98], [-40, -104], [2, -94]], 14);
  // the bowl (concha) that funnels into the canal
  const con = new Path2D(); con.moveTo(-6, -84); con.bezierCurveTo(-60, -86, -76, -20, -64, 30); con.bezierCurveTo(-52, 70, -10, 70, 12, 46); con.bezierCurveTo(30, 10, 30, -40, 18, -60); con.closePath(); piece(con, SH2, 0, false);
  piece(ELL(-16, 2, 34, 44), '#A9654B', 0, false);
  stroke([[24, -98], [-10, -60], [-34, -44]], SH2, 18); stroke([[24, -98], [-10, -60], [-34, -44]], SK, 11);
  // canal opening, water glint
  piece(ELL(4, 6, 17, 23), '#4A2420', 0, false);
  if (o.water) { const w = clamp(o.water); piece(ELL(4, 10, 14 * w, 17 * w), '#5BB3E6', 0, false); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(0, 2, 4.5 * w, 0, TAU); ctx.fill(); }
  // tragus (the flap in front of the opening), antitragus, soft lobe
  const tr = new Path2D(); tr.moveTo(36, -32); tr.bezierCurveTo(12, -28, 8, 10, 16, 34); tr.bezierCurveTo(26, 48, 46, 30, 46, 0); tr.closePath(); piece(tr, SK, 0.5);
  piece(ELL(-36, 58, 22, 14, -0.5), '#EAAE88', 0.4);
  piece(ELL(-34, 128, 34, 30), '#F2C3A2', 0, false);
}
function sideHead(o = {}) {
  const t = o.t || 0, ex = o.ex ?? 540, ey = o.ey ?? 880, s = o.s ?? 1.7, pull = o.pull || 0;
  ctx.fillStyle = '#EDBB93'; ctx.fillRect(-1500, -1500, 4000, 5000); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.fillStyle = PAT; ctx.globalAlpha = 0.9; ctx.fillRect(-1500, -1500, 4000, 5000); ctx.restore();
  const cheek = ctx.createRadialGradient(1000, 1050, 20, 1000, 1050, 320); cheek.addColorStop(0, 'rgba(230,120,110,0.35)'); cheek.addColorStop(1, 'rgba(230,120,110,0)'); ctx.fillStyle = cheek; ctx.fillRect(500, 600, 900, 900);
  // jaw line and neck in shadow
  const jaw = new Path2D(); jaw.moveTo(ex + 20, ey + 300); jaw.bezierCurveTo(ex + 160, ey + 470, ex + 380, ey + 560, 1600, ey + 600); jaw.lineTo(1600, 3000); jaw.lineTo(-1500, 3000); jaw.lineTo(-1500, ey + 420); jaw.bezierCurveTo(ex - 300, ey + 420, ex - 120, ey + 330, ex + 20, ey + 300); jaw.closePath(); piece(jaw, '#D99E76', 0.9);
  // hair: top, sideburn, behind the ear
  const hr = new Path2D(); hr.moveTo(-1500, -1500); hr.lineTo(1600, -1500); hr.lineTo(1600, ey - 520); hr.bezierCurveTo(1200, ey - 540, 860, ey - 470, ex + 170, ey - 370); hr.lineTo(ex + 160, ey - 120); hr.bezierCurveTo(ex + 140, ey - 70, ex + 105, ey - 80, ex + 100, ey - 130);
  hr.bezierCurveTo(ex + 80, ey - 300, ex - 50, ey - 360, ex - 170, ey - 330); hr.bezierCurveTo(ex - 330, ey - 290, ex - 390, ey - 100, ex - 380, ey + 140); hr.bezierCurveTo(ex - 375, ey + 300, ex - 420, ey + 380, -1500, ey + 420); hr.closePath();
  piece(hr, HAIR, 1);
  ctx.save(); ctx.clip(hr); for (let i = 0; i < 40; i++) { const hx = R2(i) * 1300 - 100, hy = ey - 700 + R2(i + 5) * 900; curve(hx, hy, hx + 60, hy + 40, hx + 30 + R2(i + 2) * 60, hy + 140, '#6A4434', 4); } ctx.restore();
  if (o.wet) for (let i = 0; i < 12; i++) { const ph = (t * 0.5 + R2(i + 9)) % 1, dx = ex - 360 + R2(i) * 700, dy = ey - 420 + R2(i + 1) * 100 + ph * 60; ctx.save(); ctx.globalAlpha = o.wet * (1 - ph * 0.5); piece(ELL(dx, dy, 9, 12), '#BFE6FA', 0.2, false); ctx.restore(); }
  ctx.save(); ctx.translate(ex - pull * 40, ey - pull * 55); ctx.rotate(-pull * 0.08); ctx.scale(s, s * (1 + pull * 0.06)); pinnaSide(o); ctx.restore();
}
/** where the top rim of the ear is on screen (for the pinching fingers) */
function earTop(o) { const s = o.s ?? 1.7, pull = o.pull || 0; return [(o.ex ?? 540) - pull * 40 - 66 * s, (o.ey ?? 880) - pull * 55 - 206 * s * (1 + pull * 0.06)]; }
function pinchFingers(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.translate(-500, -500); ctx.rotate(0.8); piece(RR(-170, -130, 340, 260, 40), SHIRT, 0.8); ctx.restore();
  ctx.save(); ctx.translate(-300, -300); ctx.rotate(0.8); piece(RR(-150, -115, 300, 230, 95), SKIN, 0.9); ctx.restore();
  ctx.save(); ctx.translate(-18, 10); ctx.rotate(2.35); piece(RR(-28, -6, 56, 300, 28), SKIN_D, 0.6); ctx.restore();
  ctx.save(); ctx.translate(18, -6); ctx.rotate(2.38); piece(RR(-32, -6, 64, 320, 32), SKIN, 1); piece(RR(-23, 2, 46, 52, 18), '#F6D9C6', 0.2); ctx.strokeStyle = 'rgba(150,90,60,0.5)'; ctx.lineWidth = 3; for (const yy of [130, 155]) { ctx.beginPath(); ctx.moveTo(-20, yy); ctx.quadraticCurveTo(0, yy + 8, 20, yy); ctx.stroke(); } ctx.restore();
  ctx.restore();
}
/** a flat palm cupped over the ear, fingers up and back. lift 0 pressed .. 1 pulled away */
function palmOver(x, y, lift = 0, s = 1) {
  ctx.save(); ctx.translate(x - lift * 70, y - lift * 30); ctx.scale(s * (1 + lift * 0.08), s * (1 + lift * 0.08)); ctx.rotate(-0.35);
  const sh = 1 + lift * 2.4;
  for (let i = 0; i < 4; i++) piece(RR(-150 + i * 76, -470 + (i === 1 || i === 2 ? -30 : 0) + (i === 3 ? 60 : 0), 66, 330, 33), SKIN, sh * 0.7);
  piece(RR(-170, -190, 340, 380, 150), SKIN, sh);
  ctx.save(); ctx.rotate(0.8); piece(RR(90, -40, 70, 250, 35), SKIN_D, sh * 0.6); ctx.restore();
  ctx.strokeStyle = 'rgba(150,90,60,0.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-110, -40); ctx.quadraticCurveTo(0, 30, 110, -60); ctx.moveTo(-90, 60); ctx.quadraticCurveTo(10, 100, 120, 40); ctx.stroke();
  piece(RR(-150, 170, 300, 400, 60), SHIRT, 0.8);
  ctx.restore();
}
function hairDryer(x, y, rot, glow = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  piece(RR(-90, 30, 76, 250, 34), '#25707A', 0.9);
  piece(RR(-230, -80, 320, 160, 74), '#2F8C8A', 1.1);
  piece(RR(80, -58, 110, 116, 24), '#257372', 0.8); piece(RR(176, -50, 20, 100, 10), '#1C5359', 0.3, false);
  piece(CIR(-196, 0, 62), '#257372', 0.4); ctx.strokeStyle = '#163F44'; ctx.lineWidth = 6; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-196 + i * 20, -44); ctx.lineTo(-196 + i * 20, 44); ctx.stroke(); }
  piece(CIR(-52, 120, 22), '#F2C14E', 0.3); ctx.fillStyle = '#3A2A1E'; ctx.font = `700 22px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('LOW', -52, 168);
  if (glow) { ctx.globalAlpha = glow; piece(RR(182, -44, 12, 88, 6), '#F29A4E', 0, false); }
  ctx.restore();
}
function otoscope(x, y, rot, light = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  if (light) { const g = ctx.createLinearGradient(150, 0, 420, 0); g.addColorStop(0, `rgba(255,236,150,${0.75 * light})`); g.addColorStop(1, 'rgba(255,236,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(150, -8); ctx.lineTo(420, -70); ctx.lineTo(420, 70); ctx.lineTo(150, 8); ctx.closePath(); ctx.fill(); }
  piece(RR(-34, 40, 68, 330, 26), '#2E2B30', 1); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(-30, 120 + i * 18); ctx.lineTo(30, 120 + i * 18); ctx.stroke(); }
  piece(RR(-70, -60, 140, 110, 26), '#8D939C', 0.9); piece(CIR(-30, -6, 26), '#C9E2F2', 0.3);
  piece(POLY([[64, -40], [160, -10], [160, 10], [64, 40]]), '#EFEDE6', 0.6);
  ctx.restore();
}
// ── the pool scene ──
function poolBack() {
  ctx.fillStyle = '#DDEFF4'; ctx.fillRect(-600, -600, W + 1200, 1800); ctx.strokeStyle = '#B9DAE4'; ctx.lineWidth = 4;
  for (let x = -600; x < W + 600; x += 90) { ctx.beginPath(); ctx.moveTo(x, -600); ctx.lineTo(x, 1100); ctx.stroke(); }
  for (let y = -600; y < 1100; y += 90) { ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(W + 600, y); ctx.stroke(); }
  piece(RR(-600, 690, W + 1200, 70, 0), '#2F8C8A', 0.4, false); piece(RR(-600, 650, W + 1200, 18, 0), '#F2C14E', 0.2, false);
  piece(RR(860, 260, 70, 440, 30), '#C9CED3', 0.6); piece(RR(990, 260, 70, 440, 30), '#C9CED3', 0.6); for (let i = 0; i < 4; i++) piece(RR(860, 330 + i * 100, 200, 22, 10), '#B2B8BE', 0.3);
  piece(RR(-600, 1060, W + 1200, 80, 12), '#F4EFE2', 0.8);
}
function poolWater(t, top = 1140) {
  const g = ctx.createLinearGradient(0, top, 0, H); g.addColorStop(0, 'rgba(80,190,230,0.82)'); g.addColorStop(1, 'rgba(25,110,170,0.95)'); ctx.fillStyle = g; ctx.fillRect(-600, top, W + 1200, H + 600);
  for (let i = 0; i < 10; i++) { const yy = top + 30 + i * 70, pts = []; for (let x = -600; x <= W + 600; x += 40) pts.push([x, yy + Math.sin(x / 70 + t * 2 + i) * 8]); ctx.save(); ctx.globalAlpha = 0.35; stroke(pts, '#FFFFFF', 4); ctx.restore(); }
}

// ═══════════════ ARM + NERVE KIT (arm-asleep video) ═══════════════
// Arm in local coords: shoulder (0,0) → elbow (480, 10) → wrist (880, 20). Cutaway shows muscle, humerus, radius/ulna,
// artery, vein and the nerve (yellow cable). Nerve can be squeezed at sqX; signals flow, stop at the squeeze, or fire messily.
function armPath() { const p = new Path2D(); p.moveTo(-160, -112); p.bezierCurveTo(150, -142, 300, -86, 480, -62); p.bezierCurveTo(650, -48, 780, -40, 885, -30); p.lineTo(885, 72); p.bezierCurveTo(760, 86, 640, 100, 480, 84); p.bezierCurveTo(300, 112, 100, 132, -160, 112); p.closePath(); return p; }
const NY = 30;
const nerveW = (x, o) => 22 * (1 - 0.88 * (o.squeeze || 0) * Math.exp(-Math.pow((x - (o.sqX ?? 200)) / 70, 2)));
function bigArm(o = {}) {
  const t = o.t || 0, sqX = o.sqX ?? 200;
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale(o.s || 1, o.s || 1);
  // hand (side view), drops at the wrist
  ctx.save(); ctx.translate(880, 22); ctx.rotate((o.drop || 0) * 1.25 + (o.limp || 0) * 0.35);
  const wig = (i) => (o.wiggle ? Math.sin(t * 9 + i) * 0.25 : 0) + (o.drop || 0) * 0.5;
  for (let i = 3; i >= 0; i--) { ctx.save(); ctx.translate(140, -30 + i * 22); ctx.rotate(0.15 + wig(i)); piece(RR(-6, -13, 128 - i * 10, 26, 13), i % 2 ? SKIN_D : SKIN, 0.4); piece(RR(98 - i * 10, -10, 18, 18, 7), '#F6D9C6', 0, false); ctx.restore(); }
  piece(RR(-10, -54, 160, 108, 42), SKIN, 0.7);
  ctx.save(); ctx.translate(40, -44); ctx.rotate(-0.4 + wig(5) * 0.5); piece(RR(0, -14, 110, 30, 15), SKIN_D, 0.4); ctx.restore();
  ctx.restore();
  // the arm
  const ap = armPath(); piece(ap, SKIN, 1);
  piece(RR(-200, -122, 150, 250, 50), SHIRT, 0.8);
  const cut = o.cut || 0;
  if (cut > 0) {
    ctx.save(); ctx.clip(ap); ctx.globalAlpha = cut;
    const win = new Path2D(); win.roundRect(-40, -150, 900, 300, 40); ctx.clip(win);
    ctx.fillStyle = '#B94A52'; ctx.fillRect(-60, -160, 960, 320);
    ctx.strokeStyle = 'rgba(240,170,170,0.45)'; ctx.lineWidth = 3; for (let i = 0; i < 14; i++) { const y0 = -110 + i * 16; ctx.beginPath(); ctx.moveTo(-60, y0); ctx.bezierCurveTo(200, y0 + 20, 400, y0 - 10, 900, y0 + 10); ctx.stroke(); }
    // bones
    piece(RR(-80, -26, 560, 44, 22), '#F1E6CC', 0.6); piece(ELL(470, -4, 36, 34), '#F1E6CC', 0.5); piece(RR(500, -24, 380, 18, 9), '#EDE0C2', 0.4); piece(RR(500, 0, 380, 18, 9), '#EDE0C2', 0.4);
    ctx.strokeStyle = 'rgba(190,165,115,0.6)'; ctx.lineWidth = 2; for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(-40 + i * 30, -4 + (i % 2) * 8, 3, 0, TAU); ctx.stroke(); }
    // artery + vein
    const vy = (x, b) => b + (x > 480 ? (x - 480) * -0.02 : 0);
    for (const [b, col, w] of [[56, '#C62A33', 14], [72, '#5A4E9A', 14]]) { const pts = []; for (let x = -60; x <= 900; x += 20) pts.push([x, vy(x, b)]); stroke(pts, col, w); }
    // the nerve: a yellow cable with fascicle bands, squeezable
    const top = [], bot = []; for (let x = -60; x <= 1000; x += 6) { const w2 = nerveW(x, { squeeze: o.squeeze, sqX }) / 2; top.push([x, NY - w2]); bot.push([x, NY + w2]); }
    const np = new Path2D(); top.forEach(([a, b], i) => (i ? np.lineTo(a, b) : np.moveTo(a, b))); bot.reverse().forEach(([a, b]) => np.lineTo(a, b)); np.closePath();
    ctx.save(); if (o.glow) { ctx.shadowColor = '#FFE680'; ctx.shadowBlur = 24 * o.glow; } ctx.fillStyle = '#F2C14E'; ctx.fill(np); ctx.restore(); ctx.strokeStyle = '#9A7A1A'; ctx.lineWidth = 3; ctx.stroke(np);
    ctx.save(); ctx.clip(np); ctx.strokeStyle = 'rgba(255,240,180,0.8)'; ctx.lineWidth = 2; for (let x = -60; x <= 1000; x += 14) { ctx.beginPath(); ctx.moveTo(x, NY - 10); ctx.lineTo(x + 8, NY + 10); ctx.stroke(); } ctx.restore();
    // signals
    const sig = o.sig;
    if (sig === 'flow' || sig === 'stop') for (let k = 0; k < 14; k++) {
      const ph = (t * 0.45 + k / 14) % 1, up = k % 2 === 0; let x = up ? lerp(1000, -60, ph) : lerp(-60, 1000, ph);
      if (sig === 'stop') { if (up && x < sqX + 50) x = sqX + 50 + (k % 6) * 14; if (!up && x > sqX - 50) x = sqX - 50 - (k % 6) * 14; }
      ctx.save(); ctx.shadowColor = up ? '#8FD3FF' : '#FFF3A8'; ctx.shadowBlur = 14; piece(CIR(x, NY, 9), up ? '#8FD3FF' : '#FFF3A8', 0, false); ctx.restore();
    }
    if (sig === 'messy') for (let i = 0; i < 46; i++) { const fr = Math.floor(t * 9), x = -60 + R2(i + fr * 7) * 1060, a = R2(i * 3 + fr); if (a < 0.35) continue; ctx.save(); ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 16; ctx.fillStyle = ['#FF6B5A', '#8FD3FF', '#FFF3A8', '#C9A3FF'][i % 4]; ctx.beginPath(); ctx.arc(x, NY + (R2(i + fr) - 0.5) * 14, 6 + a * 6, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = cut; ctx.lineWidth = 6; ctx.strokeStyle = '#F7EFDC'; ctx.setLineDash([16, 10]); ctx.save(); ctx.clip(ap); const win2 = new Path2D(); win2.roundRect(-40, -150, 900, 300, 40); ctx.stroke(win2); ctx.restore(); ctx.restore();
  }
  ctx.restore();
}
/** where a local arm point lands on screen */
function armPt(o, lx, ly) { const s = o.s || 1, a = o.rot || 0; return [o.x + (lx * Math.cos(a) - ly * Math.sin(a)) * s, o.y + (lx * Math.sin(a) + ly * Math.cos(a)) * s]; }

/** nerve cross-section: outer sheath, 7 bundles of fibres, tiny blood vessels between them. squash 0..1 flattens it and the vessels close */
function nerveCS(cx, cy, r, squash, t = 0) {
  const sy = 1 - 0.55 * squash; ctx.save(); ctx.translate(cx, cy); ctx.scale(1 + squash * 0.25, sy);
  piece(CIR(0, 0, r), '#F3DFA0', 1); piece(CIR(0, 0, r - 14), '#F6E7B8', 0, false);
  const F = [[0, 0, 0.3], [-0.45, -0.3, 0.24], [0.45, -0.32, 0.25], [-0.5, 0.35, 0.22], [0.42, 0.4, 0.24], [0, -0.62, 0.18], [0, 0.64, 0.17]];
  F.forEach(([fx, fy, fr], i) => { const x = fx * r, y = fy * r, rr = fr * r; piece(CIR(x, y, rr), '#E2B84E', 0.3, false); piece(CIR(x, y, rr - 6), '#FFF4D2', 0, false); for (let k = 0; k < 14; k++) { const a = k * 2.4 + i, d = (k % 4) / 4 * (rr - 14); ctx.fillStyle = '#C9A040'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 4, 0, TAU); ctx.fill(); } });
  const V = [[-0.12, -0.38], [0.2, 0.3], [-0.25, 0.12], [0.62, -0.02], [-0.7, -0.05]];
  V.forEach(([vx, vy], i) => { const vr = r * 0.06 * (1 - 0.8 * squash); piece(CIR(vx * r, vy * r, Math.max(2, vr)), squash > 0.5 ? mixCol('#C62A33', '#9A8E86', clamp((squash - 0.5) * 2)) : '#C62A33', 0.2, false); });
  ctx.restore();
}
/** paper brain, side view facing right. glow: which part lights. */
function brainSide(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(RR(40, 100, 44, 150, 20), '#E7B0B8', 0.6);
  piece(ELL(118, 104, 74, 46), '#E3A3AE', 0.7); for (let i = 0; i < 6; i++) curve(54, 86 + i * 9, 118, 76 + i * 9, 186, 92 + i * 7, 'rgba(160,80,95,0.6)', 3);
  const cer = ELL(0, 0, 210, 145); piece(cer, '#EDB9C0', 1);
  ctx.save(); ctx.clip(cer); for (let i = 0; i < 22; i++) { const gx = -200 + (i % 6) * 72, gy = -130 + Math.floor(i / 6) * 70; curve(gx, gy, gx + 36, gy - 30 + (i % 2) * 60, gx + 80, gy + 8, '#C98A94', 6); } ctx.restore();
  curve(-60, -130, 0, -20, 30, 140, '#B26A78', 7);
  if (o.glow) { ctx.save(); ctx.globalAlpha = o.glow; ctx.fillStyle = 'rgba(255,230,120,0.6)'; ctx.beginPath(); ctx.ellipse(-10, -60, 40, 90, 0.2, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
/** front paper doll (the brain's body map). armFade 1 = right arm gone (dashed) */
function bodyMap(x, y, s, armFade, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const col = '#F6E2C8'; piece(CIR(0, -230, 60), col, 0.6); piece(RR(-70, -165, 140, 230, 40), col, 0.7); piece(RR(-66, 70, 56, 220, 26), col, 0.5); piece(RR(10, 70, 56, 220, 26), col, 0.5);
  piece(RR(-130, -150, 50, 220, 24), col, 0.5);
  ctx.save(); ctx.globalAlpha = 1 - armFade * 0.85; piece(RR(80, -150, 50, 220, 24), col, 0.5); ctx.restore();
  if (armFade > 0.3) { ctx.save(); ctx.globalAlpha = armFade; ctx.setLineDash([12, 10]); ctx.strokeStyle = '#3A2A1E'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(80, -150, 50, 220, 24); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
function sewPin(x, y, a, col, s = 1) { stroke([[x, y], [x + Math.cos(a) * 70 * s, y + Math.sin(a) * 70 * s]], '#B9BEC4', 5 * s); stroke([[x, y], [x + Math.cos(a) * 70 * s, y + Math.sin(a) * 70 * s]], '#EEF1F4', 2 * s); piece(CIR(x + Math.cos(a) * 74 * s, y + Math.sin(a) * 74 * s, 12 * s), col, 0.4, false); }
function pinsField(t, amt, cx = 540, cy = 900, spread = 1) {
  for (let i = 0; i < 70; i++) { const fr = Math.floor(t * 7 + R2(i) * 10), on = R2(i + fr * 13) < amt; if (!on) continue;
    const x = cx + (R2(i + 2) - 0.5) * 900 * spread + Math.sin(t * 40 + i) * 2, y = cy + (R2(i + 5) - 0.5) * 520 * spread; sewPin(x, y, -0.9 - R2(i + 7) * 1.4, ['#C8322B', '#2F6FB5', '#F2C14E', '#3F7F36', '#7D3C98'][i % 5], 0.9);
    ctx.fillStyle = 'rgba(200,50,50,0.25)'; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); }
}
// ── night bedroom ──
function bedroom(t) {
  ctx.fillStyle = '#2E3358'; ctx.fillRect(-600, -600, W + 1200, H + 1200); if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = PAT; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore();
  piece(RR(620, 140, 340, 300, 16), '#1E2240', 0.6); piece(RR(640, 160, 300, 260, 8), '#4A5A8E', 0, false); piece(CIR(820, 250, 54), '#FCE29A', 0, false); piece(CIR(840, 236, 46), '#4A5A8E', 0, false); stroke([[790, 160], [790, 420]], '#1E2240', 10); stroke([[640, 290], [940, 290]], '#1E2240', 10);
  for (let i = 0; i < 6; i++) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t + i)); ctx.fillStyle = `rgba(255,243,168,${a})`; ctx.beginPath(); ctx.arc(670 + R2(i) * 260, 180 + R2(i + 3) * 90, 3, 0, TAU); ctx.fill(); }
  piece(RR(-200, 640, 1100, 160, 30), '#E9E2D2', 1); piece(RR(-200, 780, 1100, 60, 20), '#B9A98E', 0.8); piece(RR(-200, 840, 1100, 1200, 0), '#3A3352', 0.6, false);
  piece(ELL(80, 610, 170, 70), '#F7F3EA', 0.8);
}
function chairScene(t, o = {}) {
  ctx.fillStyle = '#3A3F66'; ctx.fillRect(-600, -600, W + 1200, H + 1200);
  for (let i = 0; i < 5; i++) { const pts = []; for (let k = 0; k <= 20; k++) pts.push([-100 + k * 65, 120 + i * 40 + Math.sin(k * 0.9 + i) * 26]); stroke(pts, ['#F2C14E', '#E06A60', '#6FAE58', '#8FD3FF', '#C9A3FF'][i], 7); }
  piece(RR(-600, 1320, W + 1200, 900, 0), '#5B4636', 0.6, false);
}
function chair(x, y, bh = 420) { piece(RR(x - 30, y - bh, 44, bh + 340, 14), '#7A5236', 0.9); piece(RR(x - 40, y - bh - 20, 64, 40, 14), "#6A4630", 0.6); piece(RR(x - 30, y - 10, 380, 40, 12), '#8A5E3E', 0.9); piece(RR(x + 300, y + 20, 34, 320, 10), '#7A5236', 0.7); }
function calendarPad(x, y, s, n, flip) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(RR(-110, -120, 220, 250, 16), '#FBF6E8', 0.9); piece(RR(-110, -120, 220, 60, 16), '#C8322B', 0.3, false);
  ctx.fillStyle = '#3A2A1E'; ctx.font = `700 110px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 0, 40);
  if (flip > 0) { ctx.save(); ctx.scale(1, 1 - flip); piece(RR(-110, -60, 220, 190, 10), '#F1EAD8', 0.4); ctx.restore(); }
  for (const rx of [-60, 0, 60]) pin(rx, -116, 8);
  ctx.restore();
}

// ═══════════════ CARSICK KIT ═══════════════
// Balance organ (3 fluid loops + vestibule + cochlea + nerve), crystal-on-hair sensor close-up, big eye, phone,
// speech bubbles, stomach, poison bottle, windshield view with the horizon, back-seat passenger.
function vestibular(x, y, s, o = {}) {
  const t = o.t || 0, flow = o.flow || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const nv = [[40, 20], [180, 90], [320, 110]]; stroke(nv, '#9A7A1A', 30); stroke(nv, '#F2C14E', 20);
  if (o.sig) for (let k = 0; k < 6; k++) { const ph = (t * 0.9 + k / 6) % 1; ctx.save(); ctx.shadowColor = '#FFF3A8'; ctx.shadowBlur = 14; piece(CIR(lerp(40, 320, ph), lerp(20, 110, ph), 9), '#FFF3A8', 0, false); ctx.restore(); }
  // cochlea (hearing snail) at the front
  piece(ELL(-170, 110, 100, 88), '#E3B07E', 0.6); const sp = []; for (let i = 0; i <= 110; i++) { const a = i / 110 * TAU * 2.6, r = 86 - i * 0.62; sp.push([-170 + Math.cos(a) * r, 110 + Math.sin(a) * r * 0.86]); } stroke(sp, '#9C6B3E', 16); stroke(sp, '#F6D6A8', 8);
  // the three loops: tube, then fluid inside, with moving flow marks
  const loops = [[20, -170, 72, 130, 0.15], [150, -50, 120, 70, 1.15], [120, 40, 135, 52, -0.12]];
  loops.forEach(([cx, cy, rx, ry, rot]) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU); ctx.strokeStyle = '#9C6B3E'; ctx.lineWidth = 48; ctx.stroke(); ctx.strokeStyle = '#E9BE8E'; ctx.lineWidth = 40; ctx.stroke(); ctx.strokeStyle = '#7EC3EA'; ctx.lineWidth = 20; ctx.stroke();
    if (flow) { ctx.save(); ctx.setLineDash([18, 30]); ctx.lineDashOffset = -t * 260 * flow; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 6; ctx.stroke(); ctx.restore(); } });
  // ampullae (the bulges where the motion sensors sit)
  for (const [ax, ay] of [[-30, -60], [60, 40], [-10, 30]]) piece(CIR(ax, ay, 34), '#E9BE8E', 0.4);
  // vestibule (holds the crystal sensors)
  piece(ELL(0, 0, 80, 62), '#EBC596', 0.8); piece(ELL(-10, -6, 30, 18), '#F7EFE0', 0, false); piece(ELL(26, 18, 24, 14), '#F7EFE0', 0, false);
  for (let i = 0; i < 10; i++) piece(CIR(-24 + (i % 5) * 10, -10 + Math.floor(i / 5) * 8, 3), '#FFFFFF', 0, false);
  ctx.restore();
}
/** the crystal sensor up close: hair cells, hair bundles into a gel layer topped with crystals. shift -1..1 slides the gel */
function otolith(x, y, w, o = {}) {
  const t = o.t || 0, sh = (o.shift || 0) * 60;
  ctx.save(); ctx.translate(x, y);
  piece(RR(-w / 2, 120, w, 120, 20), '#D98478', 0.6, false);
  const n = 7, cw = w / n;
  for (let i = 0; i < n; i++) { const cx = -w / 2 + cw * (i + 0.5);
    for (let k = 0; k < 5; k++) { const hx = cx - 20 + k * 10, h = 70 + k * 10; ctx.strokeStyle = '#6A4A3A'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, 0); ctx.quadraticCurveTo(hx + sh * 0.2, -h * 0.5, hx + sh * 0.7, -h); ctx.stroke(); }
    piece(RR(cx - cw * 0.4, 0, cw * 0.8, 130, 24), '#EBA8AE', 0.4); piece(CIR(cx, 80, 12), '#9C5A6A', 0, false);
    const fib = [[cx, 130], [cx + 6, 200], [cx - 4, 260]]; stroke(fib, '#9A7A1A', 10); stroke(fib, '#F2C14E', 6);
    if (Math.abs(o.shift || 0) > 0.3) { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 14 + i); ctx.shadowColor = '#FFF3A8'; ctx.shadowBlur = 14; piece(CIR(cx + 3, 200 + ((t * 120 + i * 20) % 60), 8), '#FFF3A8', 0, false); ctx.restore(); }
  }
  ctx.save(); ctx.translate(sh, 0); ctx.globalAlpha = 0.8; piece(RR(-w / 2 - 20, -150, w + 40, 80, 26), '#CDE9F2', 0.5); ctx.globalAlpha = 1;
  for (let i = 0; i < 46; i++) { const cx = -w / 2 + R2(i) * w, cy = -170 - R2(i + 3) * 40, sz = 9 + R2(i + 6) * 8; ctx.save(); ctx.translate(cx, cy); ctx.rotate(R2(i + 9) * 3); piece(POLY([[0, -sz], [sz * 0.7, 0], [0, sz], [-sz * 0.7, 0]]), i % 3 ? '#F4F9FF' : '#DCEFF8', 0.3, false); ctx.strokeStyle = '#8FB8CC'; ctx.lineWidth = 2; ctx.stroke(POLY([[0, -sz], [sz * 0.7, 0], [0, sz], [-sz * 0.7, 0]])); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}
function bubble(x, y, text, sc = 1, col = '#FBF6E8', ink = '#3A2A1E', tail = [0, 120], size = 54) {
  if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = `700 ${size}px ${SERIF}`; const w = ctx.measureText(text).width + 80, h = size * 2;
  const p = new Path2D(); p.roundRect(-w / 2, -h / 2, w, h, h / 2); p.moveTo(-30, h / 2 - 4); p.lineTo(tail[0], tail[1]); p.lineTo(30, h / 2 - 4); p.closePath();
  piece(p, col, 0.9); ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 4); ctx.restore();
}
function eyeBig(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(ELL(0, 0, 330, 210), SKIN, 0.8);
  const lid = new Path2D(); lid.moveTo(-230, 0); lid.bezierCurveTo(-120, -150, 120, -150, 230, 0); lid.bezierCurveTo(120, 120, -120, 120, -230, 0); lid.closePath();
  piece(lid, '#FBFAF6', 0.5); ctx.save(); ctx.clip(lid); const gx = (o.gx || 0) * 50, gy = (o.gy || 0) * 30;
  piece(CIR(gx, gy, 92), '#5A7A3A', 0.3, false); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; stroke([[gx + Math.cos(a) * 40, gy + Math.sin(a) * 40], [gx + Math.cos(a) * 88, gy + Math.sin(a) * 88]], 'rgba(40,60,20,0.5)', 3); }
  piece(CIR(gx, gy, 40), '#15110F', 0, false); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(gx - 26, gy - 30, 16, 0, TAU); ctx.fill();
  if (o.lock) { ctx.save(); ctx.globalAlpha = o.lock; ctx.strokeStyle = '#C8322B'; ctx.lineWidth = 6; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(gx, gy, 110, 0, TAU); ctx.stroke(); ctx.restore(); }
  ctx.restore(); ctx.strokeStyle = '#3A2A1E'; ctx.lineWidth = 8; ctx.stroke(lid);
  for (let i = 0; i < 9; i++) { const u = 0.1 + i * 0.1, px = lerp(-200, 200, u), py = -112 * Math.sin(u * Math.PI) - 4; stroke([[px, py], [px + (u - 0.5) * 30, py - 36]], '#2B1D17', 5); }
  curve(-220, -190, 0, -260, 220, -200, HAIR, 22);
  ctx.restore();
}
function phoneBig(x, y, s, rot = 0, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  piece(RR(-150, -300, 300, 600, 44), '#1E2228', 1); piece(RR(-130, -270, 260, 540, 26), '#F4F1EA', 0, false);
  for (let i = 0; i < 4; i++) { piece(RR(-110, -250 + i * 130, 220, 110, 14), ['#F2C14E', '#8FD3FF', '#F29AC8', '#9FD18A'][i], 0, false); stroke([[-90, -170 + i * 130], [60, -170 + i * 130]], 'rgba(40,30,20,0.4)', 8); }
  piece(RR(-40, -290, 80, 10, 5), '#3A3F48', 0, false);
  ctx.restore();
}
function stomach(x, y, s, o = {}) {
  const t = o.t || 0, sq = o.squeeze || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 - sq * 0.06 * Math.sin(t * 10)), s * (1 + sq * 0.05 * Math.sin(t * 10)));
  const eso = [[0, -520], [10, -360], [0, -210]]; stroke(eso, '#B95C68', 74); stroke(eso, '#E58C99', 60); for (let i = 0; i < 8; i++) stroke([[-24, -500 + i * 38], [26, -496 + i * 38]], 'rgba(160,70,85,0.5)', 4);
  const p = new Path2D(); p.moveTo(-26, -220); p.bezierCurveTo(-200, -300, -300, -120, -250, 40); p.bezierCurveTo(-210, 210, -20, 280, 140, 210); p.bezierCurveTo(220, 170, 250, 110, 270, 70); p.lineTo(330, 90); p.lineTo(330, 20); p.lineTo(250, 0);
  p.bezierCurveTo(210, 80, 140, 120, 90, 100); p.bezierCurveTo(40, 80, 30, -100, 26, -210); p.closePath();
  piece(p, '#E58C99', 1.2);
  ctx.save(); ctx.clip(p);
  const lv = 40 - (o.rise || 0) * 260; ctx.fillStyle = '#A9B24A'; ctx.beginPath(); ctx.moveTo(-320, lv); for (let xx = -320; xx <= 340; xx += 20) ctx.lineTo(xx, lv + Math.sin(xx / 40 + t * 6) * 16 * (1 + sq)); ctx.lineTo(340, 400); ctx.lineTo(-320, 400); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 12; i++) { const yy = -180 + i * 34; curve(-240, yy, -60, yy + 40 + Math.sin(t * 3 + i) * 10, 200, yy + 10, 'rgba(160,70,85,0.55)', 6); }
  ctx.restore(); ctx.save(); ctx.strokeStyle = '#B95C68'; ctx.lineWidth = 6; ctx.stroke(p); ctx.restore();
  if (o.up) for (let k = 0; k < 6; k++) { const ph = (t * 1.2 + k / 6) % 1; ctx.save(); ctx.globalAlpha = o.up * (1 - ph * 0.3); piece(CIR(Math.sin(k * 2) * 10, lerp(-200, -540, ph), 16), '#A9B24A', 0.2, false); ctx.restore(); }
  ctx.restore();
}
function poisonBottle(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  piece(RR(-40, -240, 80, 70, 14), '#A47A4E', 0.6); piece(RR(-50, -180, 100, 70, 20), '#4A3060', 0.6);
  piece(RR(-120, -120, 240, 300, 60), '#5B3A6E', 1); piece(RR(-90, -60, 180, 180, 20), '#F4EFE2', 0.4);
  piece(CIR(0, 10, 46), '#FBF8EF', 0.3, false); piece(CIR(-17, 4, 12), '#2A1E2E', 0, false); piece(CIR(17, 4, 12), '#2A1E2E', 0, false); piece(RR(-22, 44, 44, 20, 6), '#FBF8EF', 0, false);
  stroke([[-60, 70], [60, 110]], '#2A1E2E', 10); stroke([[60, 70], [-60, 110]], '#2A1E2E', 10);
  ctx.restore();
}
/** looking out the front: windshield frame, sky, hills, road to the horizon, dashboard. glow = horizon highlight */
function windshieldView(t, o = {}) {
  const sway = Math.sin(t * 1.6) * 0.02 * (o.sway ?? 1);
  ctx.save(); ctx.translate(540, 900); ctx.rotate(sway); ctx.translate(-540, -900);
  const g = ctx.createLinearGradient(0, 200, 0, 900); g.addColorStop(0, '#8CCBE8'); g.addColorStop(1, '#DCEFF2'); ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, 1300);
  const HZ = 860;
  const hl = new Path2D(); hl.moveTo(-400, HZ + 10); for (let x = -400; x <= W + 400; x += 40) hl.lineTo(x, HZ - Math.abs(Math.sin(x / 160 + 1)) * 70); hl.lineTo(W + 400, HZ + 10); hl.closePath(); piece(hl, '#7CAE5E', 0.6);
  piece(RR(-400, HZ, W + 800, 1200, 0), '#9CC27A', 0.3, false);
  piece(POLY([[500, HZ], [580, HZ], [1300, 1700], [-220, 1700]]), '#6E6A66', 0.5);
  for (let i = 0; i < 8; i++) { const u = ((i / 8) + t * 0.6) % 1, yy = lerp(HZ, 1700, u * u), w2 = lerp(4, 60, u * u), h2 = lerp(6, 120, u * u); ctx.fillStyle = '#F4EFE2'; ctx.fillRect(540 - w2 / 2, yy, w2, h2); }
  if (o.glow) { ctx.save(); ctx.globalAlpha = o.glow; ctx.shadowColor = '#FFE680'; ctx.shadowBlur = 30; stroke([[-100, HZ], [1180, HZ]], '#FFE680', 10); ctx.restore(); }
  if (o.sign) { const sx = lerp(620, 1000, o.sign), sy = lerp(HZ - 20, 980, o.sign), ss = lerp(0.25, 1.4, o.sign); ctx.save(); ctx.translate(sx, sy); ctx.scale(ss, ss); piece(RR(-8, 0, 16, 160, 6), '#8A8A8A', 0.4); ctx.rotate(Math.PI / 4); piece(RR(-60, -60, 120, 120, 12), '#F2C14E', 0.6); ctx.rotate(-Math.PI / 4); ctx.strokeStyle = '#2A2522'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, 34); ctx.quadraticCurveTo(-14, -20, 24, -20); ctx.stroke(); piece(POLY([[24, -40], [48, -20], [24, 0]]), '#2A2522', 0, false); ctx.restore(); }
  ctx.restore();
  const fr = new Path2D(); fr.rect(-400, -400, W + 800, H + 800); fr.moveTo(60, 1180); fr.lineTo(110, 330); fr.quadraticCurveTo(540, 250, 970, 330); fr.lineTo(1020, 1180); fr.closePath();
  ctx.save(); ctx.fillStyle = '#2F3540'; ctx.fill(fr, 'evenodd'); ctx.restore();
  piece(RR(-100, 1150, W + 200, 900, 60), '#3A3F4A', 1); piece(RR(80, 1190, 300, 40, 20), '#4A505C', 0.3, false);
}
function passenger(t, o = {}) { return { x: 430, y: 1062, s: 1, t, up: 60, fore: 160, farUp: 56, farFore: 150, head: 18, lid: 0.35, mouth: 'flat', ...o }; }
function passengerPhone(o) { const r = (d) => d * Math.PI / 180, lx = 20 + 150 * Math.sin(r(o.up)) + 152 * Math.sin(r(o.fore)), ly = -270 + 150 * Math.cos(r(o.up)) + 152 * Math.cos(r(o.fore)), hx = o.x + lx * o.s, hy = o.y + ly * o.s; ctx.save(); ctx.translate(hx, hy); ctx.rotate(-1.2); piece(RR(-22, -36, 44, 72, 8), '#1E2228', 0.5); ctx.fillStyle = '#8FD3FF'; ctx.globalAlpha = 0.8; ctx.fillRect(-17, -30, 34, 58); ctx.restore(); }
function greenFace(o, k) { if (k <= 0) return; const [hx, hy] = headPt(o, 30, -120); ctx.save(); ctx.globalAlpha = 0.45 * k; const g = ctx.createRadialGradient(hx, hy, 10, hx, hy, 150); g.addColorStop(0, '#7FBF4A'); g.addColorStop(1, 'rgba(127,191,74,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 150, 0, TAU); ctx.fill(); ctx.restore(); }

// ═══════════════ CUTE KIT ═══════════════
/** front-facing sitting puppy (or kitten). o = { t, squish 0..1, kitten, blink, tongue, look } ~ 420 px tall at s=1, origin = chest */
function puppy(x, y, s, o = {}) {
  const t = o.t || 0, sq = o.squish || 0, kit = o.kitten;
  const FUR = kit ? '#9AA0A8' : '#E3B26A', FUR_D = kit ? '#6E747C' : '#B9823E', CREAM = kit ? '#EEF0F2' : '#F7E6C4';
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 + sq * 0.22), s * (1 - sq * 0.18));
  // tail wag
  ctx.save(); ctx.translate(120, 120); ctx.rotate(-0.6 + Math.sin(t * (kit ? 3 : 12)) * 0.4); piece(RR(-14, -110, 28, 120, 14), FUR_D, 0.5); ctx.restore();
  // body with fluffy edge
  const body = new Path2D(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = (i % 2 ? 1 : 1.05); const px = Math.cos(a) * 150 * r, py = 80 + Math.sin(a) * 140 * r; i ? body.lineTo(px, py) : body.moveTo(px, py); } body.closePath(); piece(body, FUR, 1);
  piece(ELL(0, 70, 70, 100), CREAM, 0, false);
  // paws with toe beans
  for (const sd of [-1, 1]) { piece(ELL(sd * 62, 210, 52, 34), FUR, 0.6); piece(ELL(sd * 62, 214, 18, 12), '#E89AA0', 0, false); for (let k = -1; k <= 1; k++) piece(CIR(sd * 62 + k * 18, 192, 7), '#E89AA0', 0, false); }
  // ears (behind head)
  if (kit) { for (const sd of [-1, 1]) { piece(POLY([[sd * 150, -260], [sd * 70, -330], [sd * 175, -400]]), FUR_D, 0.7); piece(POLY([[sd * 145, -280], [sd * 95, -320], [sd * 160, -370]]), '#E89AA0', 0, false); } }
  else for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 150, -250); ctx.rotate(sd * (0.35 + Math.sin(t * 3) * 0.05)); piece(ELL(0, 70, 56, 120), FUR_D, 0.8); ctx.strokeStyle = 'rgba(80,50,20,0.35)'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-20 + k * 12, 20); ctx.quadraticCurveTo(-10 + k * 12, 90, -18 + k * 12, 170); ctx.stroke(); } ctx.restore(); }
  // big head with fluffy cheeks
  const hd = new Path2D(); for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, r = (i % 2 ? 1 : 1.04) * (Math.sin(a) > 0.3 ? 1.06 : 1); const px = Math.cos(a) * 185 * r, py = -230 + Math.sin(a) * 160 * r; i ? hd.lineTo(px, py) : hd.moveTo(px, py); } hd.closePath(); piece(hd, FUR, 1.1);
  piece(ELL(0, -170, 105, 80), CREAM, 0, false);
  for (const sd of [-1, 1]) piece(ELL(sd * 110, -175, 36, 24), 'rgba(240,140,140,0.45)', 0, false);
  // eyes: huge, glossy
  const bl = o.blink ? Math.max(0, Math.sin(t * 2.2) > 0.97 ? 1 : 0) : 0;
  for (const sd of [-1, 1]) { const ex = sd * 78, ey = -250; if (bl) { stroke([[ex - 34, ey], [ex + 34, ey]], '#1A1412', 8); continue; }
    piece(ELL(ex, ey, 44, 52), '#1A1412', 0.3, false); piece(ELL(ex + (o.look || 0) * 6, ey + 6, 30, 36), '#3A2A22', 0, false); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ex - 14, ey - 18, 14, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(ex + 14, ey + 14, 6, 0, TAU); ctx.fill(); }
  // tiny nose + mouth (+ tongue)
  if (kit) piece(POLY([[-14, -190], [14, -190], [0, -172]]), '#E89AA0', 0.2, false); else { piece(ELL(0, -188, 26, 18), '#2A1E1A', 0.3, false); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-8, -194, 8, 4, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#3A2A22'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -172); ctx.lineTo(0, -156); ctx.moveTo(-26, -150); ctx.quadraticCurveTo(-12, -140, 0, -156); ctx.quadraticCurveTo(12, -140, 26, -150); ctx.stroke();
  if (o.tongue) piece(RR(-12, -150, 24, 32, 12), '#E8737E', 0.2, false);
  if (kit) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) stroke([[sd * 40, -170 + k * 10], [sd * 130, -186 + k * 16]], 'rgba(255,255,255,0.8)', 3);
  // fur tufts on top
  for (let k = -2; k <= 2; k++) piece(POLY([[k * 26 - 14, -380], [k * 26 + 4, -412 - Math.abs(k) * -6], [k * 26 + 16, -382]]), FUR, 0.2, false);
  ctx.restore();
}
/** brain (from the arm kit) with the reward path lit: midbrain → deep reward centre → front of the brain, dopamine dots flowing */
function rewardBrain(x, y, s, o = {}) {
  const t = o.t || 0; brainSide(x, y, s, {});
  if (!o.lit) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = clamp(o.lit);
  const P = [[60, 95], [10, 60], [-60, 25], [-130, -20], [-175, -40]];
  ctx.save(); ctx.shadowColor = '#FFD84A'; ctx.shadowBlur = 30; stroke(P, '#F2C14E', 16); ctx.restore(); stroke(P, '#FFF3A8', 6);
  for (const [px, py, r] of [[60, 95, 18], [-60, 25, 22], [-175, -40, 18]]) { ctx.save(); ctx.shadowColor = '#FFD84A'; ctx.shadowBlur = 30; piece(CIR(px, py, r), '#FFD84A', 0, false); ctx.restore(); }
  for (let k = 0; k < 10; k++) { const ph = (t * 0.8 + k / 10) % 1, seg2 = Math.min(3, Math.floor(ph * 4)), u = ph * 4 - seg2; const a = P[seg2], b = P[seg2 + 1]; piece(CIR(lerp(a[0], b[0], u), lerp(a[1], b[1], u), 7), '#FFFFFF', 0, false); }
  ctx.restore();
}
/** electrode cap drawn over a profile head made with head() at (hx, hy, hs) */
function eegCap(hx, hy, hs, t) {
  ctx.save(); ctx.translate(hx, hy); ctx.scale(hs, hs);
  const cap = new Path2D(); cap.moveTo(-138, -120); cap.bezierCurveTo(-142, -220, -60, -268, 10, -262); cap.bezierCurveTo(80, -258, 118, -200, 114, -150); cap.lineTo(-138, -120); cap.closePath();
  ctx.save(); ctx.globalAlpha = 0.85; piece(cap, '#3E5A8E', 0.6); ctx.restore();
  const E = [[-110, -150], [-70, -200], [-20, -230], [40, -228], [90, -190], [-100, -200], [0, -180], [60, -170], [-50, -150]];
  E.forEach(([ex, ey], i) => { piece(CIR(ex, ey, 11), '#E9E2D2', 0.3, false); piece(CIR(ex, ey, 5), '#8A8A8A', 0, false); curve(ex, ey, ex - 80, ey - 40 + i * 6, -260, -140 + i * 12, ['#C8322B', '#2F6FB5', '#F2C14E', '#3F7F36'][i % 4], 3); });
  ctx.restore();
}
function waveScreen(x, y, w, h, t, amp = 1, label2 = '') {
  piece(RR(x, y, w, h, 18), '#1E2228', 1); piece(RR(x + 14, y + 14, w - 28, h - 28, 10), '#0F2A22', 0, false);
  for (let r = 0; r < 4; r++) { const pts = []; for (let i = 0; i <= 60; i++) { const px = x + 24 + i * (w - 48) / 60, base = y + 50 + r * (h - 80) / 4; pts.push([px, base + Math.sin(i * 0.7 + t * 8 + r) * 10 * amp + Math.sin(i * 2.3 + t * 13) * 6 * amp * (r === 1 ? 2 : 1)]); } stroke(pts, ['#7DDB6A', '#FFE680', '#8FD3FF', '#F29AC8'][r], 3); }
}
function meter(x, y, h, v, col, title) {
  piece(RR(x - 40, y - h, 80, h, 20), '#FBF6E8', 0.8); piece(RR(x - 28, y - 12 - (h - 24) * clamp(v), 56, (h - 24) * clamp(v), 14), col, 0.2, false);
  ctx.fillStyle = '#3A2A1E'; ctx.font = `700 30px ${SERIF}`; ctx.textAlign = 'center'; title.split(' ').forEach((wd, i) => ctx.fillText(wd, x, y + 44 + i * 34));
}
/** paper seesaw: tilt -1..1 (positive = right side down). left / right = draw callbacks for the load in local coords */
function seesaw(x, y, tilt, left, right) {
  piece(POLY([[x - 70, y + 140], [x + 70, y + 140], [x, y]]), '#7A5236', 0.8);
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt * 0.3); piece(RR(-420, -22, 840, 34, 12), '#A47A4E', 1); pin(0, -5, 12);
  ctx.save(); ctx.translate(-300, -22); ctx.rotate(-tilt * 0.3); left && left(); ctx.restore();
  ctx.save(); ctx.translate(300, -22); ctx.rotate(-tilt * 0.3); right && right(); ctx.restore();
  ctx.restore();
}
function heart(x, y, s, col = '#E8443A') { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const p = new Path2D(); p.moveTo(0, 30); p.bezierCurveTo(-60, -10, -40, -60, 0, -30); p.bezierCurveTo(40, -60, 60, -10, 0, 30); piece(p, col, 0.5); ctx.restore(); }
function tick(x, y, s) { if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(CIR(0, 0, 50), '#6FAE58', 0.8); ctx.strokeStyle = '#FBF6E8'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-5, 18); ctx.lineTo(24, -16); ctx.stroke(); ctx.restore(); }
function food(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(ELL(0, -30, 90, 50), '#D9963E', 0.7); piece(RR(-94, -10, 188, 26, 10), '#6B3A22', 0.4); piece(RR(-98, 14, 196, 14, 6), '#7DBA4E', 0.3); piece(RR(-90, 26, 180, 34, 16), '#D9963E', 0.6); for (let i = 0; i < 6; i++) piece(ELL(-50 + i * 20, -50 + (i % 2) * 8, 5, 3), '#F7E6C4', 0, false); ctx.restore(); }
function cash(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(-0.15 + i * 0.12); piece(RR(-100, -50, 200, 100, 10), '#7DBA6E', 0.6); piece(CIR(0, 0, 30), '#9FD18A', 0, false); ctx.fillStyle = '#2F5E2A'; ctx.font = `700 40px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 2); ctx.restore(); } ctx.restore(); }

// ═══════════════ OWN VOICE KIT ═══════════════
/** vocal cords seen from above (as a throat camera sees them): epiglottis at the top, two white-edged folds in a V, arytenoid cartilages at the back. open 0..1 */
function vocalFolds(x, y, s, o = {}) {
  const t = o.t || 0, buzz = o.buzz ? Math.abs(Math.sin(t * 60)) : 0, open = (o.open ?? 0.15) + buzz * 0.25;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(ELL(0, 0, 330, 380), '#7A2A35', 1); piece(ELL(0, 0, 300, 350), '#B9505A', 0, false);
  for (let i = 0; i < 10; i++) curve(-260 + i * 50, -300, -240 + i * 52, 0, -260 + i * 50, 300, 'rgba(240,150,150,0.25)', 4);
  // epiglottis (leaf at the front)
  const ep = new Path2D(); ep.moveTo(-170, -250); ep.quadraticCurveTo(0, -400, 170, -250); ep.quadraticCurveTo(0, -300, -170, -250); ep.closePath(); piece(ep, '#E8A3A8', 0.6);
  // the airway gap between the folds (dark)
  const gw = 20 + open * 120; const g = new Path2D(); g.moveTo(0, -200); g.lineTo(-gw, 190); g.quadraticCurveTo(0, 210, gw, 190); g.closePath(); ctx.fillStyle = '#1A0A0E'; ctx.fill(g);
  // the folds: pearly white edges
  for (const sd of [-1, 1]) { const f = new Path2D(); f.moveTo(0, -205); f.lineTo(sd * gw, 190); f.lineTo(sd * (gw + 70), 200); f.quadraticCurveTo(sd * (gw + 60), 0, sd * 30, -200); f.closePath(); piece(f, '#F4E9E4', 0.4); for (let k = 0; k < 3; k++) { const u = (t * 3 + k / 3) % 1; ctx.save(); ctx.globalAlpha = (o.buzz ? 0.6 : 0) * (1 - u); stroke([[sd * (8 + u * 30), -190 + u * 20], [sd * (gw + 10 + u * 40), 180]], '#FFFFFF', 3); ctx.restore(); } }
  // arytenoid cartilages + false folds
  for (const sd of [-1, 1]) { piece(ELL(sd * (gw + 60), 250, 70, 50, sd * 0.4), '#D98478', 0.5); piece(ELL(sd * (gw + 150), -10, 60, 210, sd * 0.1), '#C9707A', 0.3, false); }
  ctx.restore();
}
/** x-ray skull inside the profile head (head-local coords of head(); call inside the same transform as head()). vib 0..1 shows ripples */
function skullXray(o = {}) {
  const t = o.t || 0;
  ctx.save(); ctx.globalAlpha = o.alpha ?? 0.92;
  const cr = new Path2D(); cr.moveTo(104, -150); cr.bezierCurveTo(100, -230, 40, -258, -20, -252); cr.bezierCurveTo(-110, -246, -142, -170, -128, -110); cr.bezierCurveTo(-120, -76, -90, -62, -50, -66); cr.lineTo(-24, -84); cr.lineTo(10, -96); cr.lineTo(70, -104); cr.lineTo(108, -112); cr.closePath();
  piece(cr, '#F1E6CC', 0.4); ctx.save(); ctx.clip(cr); for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(190,165,115,0.35)'; ctx.beginPath(); ctx.arc(-120 + R2(i) * 220, -250 + R2(i + 4) * 170, 3, 0, TAU); ctx.fill(); } ctx.restore();
  piece(CIR(66, -142, 24), '#3A2A30', 0, false);
  piece(POLY([[96, -126], [114, -112], [100, -92]]), '#3A2A30', 0, false);
  const jaw = new Path2D(); jaw.moveTo(-14, -94); jaw.lineTo(-10, -36); jaw.quadraticCurveTo(-6, -18, 20, -18); jaw.lineTo(92, -22); jaw.quadraticCurveTo(102, -30, 96, -46); jaw.lineTo(20, -50); jaw.lineTo(8, -88); jaw.closePath(); piece(jaw, '#EDE0C2', 0.4);
  piece(RR(26, -100, 84, 30, 10), '#EDE0C2', 0.3); for (let i = 0; i < 6; i++) { piece(RR(48 + i * 9, -72, 8, 12, 3), '#FFFFFF', 0, false); piece(RR(48 + i * 9, -58, 8, 10, 3), '#FFFFFF', 0, false); }
  stroke([[-10, -108], [30, -106], [70, -110]], '#E3D3AE', 8);
  // ear canal + inner ear snail
  piece(CIR(-16, -116, 9), '#3A2A30', 0, false);
  const sp = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU * 2.4, r = 16 - i * 0.22; sp.push([-34 + Math.cos(a) * r, -112 + Math.sin(a) * r]); }
  ctx.save(); if (o.cochlea) { ctx.shadowColor = '#FFE680'; ctx.shadowBlur = 20 * o.cochlea; } stroke(sp, o.cochlea ? '#F2C14E' : '#B98A5A', 4); ctx.restore();
  // larynx in the neck
  piece(RR(30, -20, 30, 50, 10), '#E8A3A8', 0.3);
  if (o.vib) { ctx.save(); ctx.clip(cr); for (let k = 0; k < 6; k++) { const u = (t * 0.9 + k / 6) % 1; ctx.globalAlpha = o.vib * (1 - u) * 0.9; ctx.strokeStyle = '#FF8A3A'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(44, -10, 30 + u * 260, 0, TAU); ctx.stroke(); } ctx.restore();
    ctx.save(); ctx.clip(jaw); for (let k = 0; k < 4; k++) { const u = (t * 0.9 + k / 4) % 1; ctx.globalAlpha = o.vib * (1 - u); ctx.strokeStyle = '#FF8A3A'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(44, -10, 20 + u * 140, 0, TAU); ctx.stroke(); } ctx.restore(); }
  ctx.restore();
}
/** sound arcs leaving the mouth (head-local), travelling along a curve to the ear */
function airPath(o = {}) {
  const t = o.t || 0, k = o.k ?? 1;
  for (let i = 0; i < 4; i++) { const u = (t * 1.2 + i / 4) % 1; ctx.save(); ctx.globalAlpha = (1 - u) * k; ctx.strokeStyle = '#2F6FB5'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(104, -50, 20 + u * 90, -0.9, 0.9); ctx.stroke(); ctx.restore(); }
  const P = [[140, -50], [230, -120], [200, -300], [40, -330], [-90, -280], [-60, -160], [-20, -120]];
  ctx.save(); ctx.globalAlpha = 0.8 * k; ctx.setLineDash([10, 10]); stroke(P, '#2F6FB5', 4); ctx.restore();
  for (let i = 0; i < 5; i++) { const ph = (t * 0.5 + i / 5) % 1, seg2 = Math.min(P.length - 2, Math.floor(ph * (P.length - 1))), u = ph * (P.length - 1) - seg2; ctx.save(); ctx.globalAlpha = k; piece(CIR(lerp(P[seg2][0], P[seg2 + 1][0], u), lerp(P[seg2][1], P[seg2 + 1][1], u), 8), '#8FD3FF', 0, false); ctx.restore(); }
}
function waveBox(x, y, w, h, t, o) {
  piece(RR(x, y, w, h, 20), '#FBF8EF', 0.9); const pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120; pts.push([x + 20 + u * (w - 40), y + h / 2 + Math.sin(u * TAU * o.f + t * 6) * o.a + Math.sin(u * TAU * o.f * 3.1 + t * 9) * o.a2]); } stroke(pts, o.col, 6);
  ctx.fillStyle = '#3A2A1E'; ctx.font = `700 34px ${SERIF}`; ctx.textAlign = 'left'; ctx.fillText(o.title, x + 24, y + 46);
}
function eqBars(x, y, vals, col, t) { vals.forEach((v, i) => { const h = v * 260 * (0.92 + 0.08 * Math.sin(t * 7 + i)); piece(RR(x + i * 56, y - h, 42, h, 8), col, 0.3, false); }); stroke([[x - 10, y], [x + vals.length * 56, y]], '#3A2A1E', 4); }
function mic(x, y, s, glow = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(RR(-12, 60, 24, 420, 10), '#3A3F48', 0.6); piece(ELL(0, 490, 140, 30), '#2A2E36', 0.6);
  piece(RR(-40, 0, 80, 110, 20), '#4A505C', 0.7); const cap = ELL(0, -40, 74, 96); piece(cap, '#C9CED3', 0.8);
  ctx.save(); ctx.clip(cap); ctx.strokeStyle = 'rgba(80,80,90,0.6)'; ctx.lineWidth = 3; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(i * 14, -150); ctx.lineTo(i * 14 + 40, 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 14, -150); ctx.lineTo(i * 14 - 40, 60); ctx.stroke(); } ctx.restore();
  if (glow) { ctx.globalAlpha = glow; piece(CIR(0, 160, 10), '#E8443A', 0, false); }
  ctx.restore();
}
/** profile head (head()) at x,y,s with optional skull x-ray / air path, all aligned */
function voiceHead(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(RR(-14, -40, 56, 80, 20), SKIN_D, 0.5);
  head({ t: o.t, lid: o.lid || 0, mouth: o.mouth || 'flat', wide: o.wide, frown: o.frown || 0, cheek: o.cheek || 0 });
  if (o.skull) skullXray({ t: o.t, vib: o.vib, cochlea: o.cochlea, alpha: o.skull });
  if (o.air) airPath({ t: o.t, k: o.air });
  ctx.restore();
}

// ═══════════════ HORSE FLY KIT ═══════════════
// Side-view horse fly (Tabanus look: huge banded iridescent eyes, short stout antennae, grey-brown thorax with stripes,
// broad abdomen with pale triangles, smoky veined wings held in a delta), the blade mouthparts, the skin cut + blood pool,
// paper zebra and horse.
function hfLegs(o, far) {
  const fly = o.fly, col = far ? '#3E3226' : '#5A4632', col2 = far ? '#7A6448' : '#B08A5C';
  [[-34, -1], [4, 0.25], [40, 1]].forEach(([hx, dir], i) => {
    const sx = hx + (far ? 12 : 0), knee = fly ? [sx - 40, 112] : [sx + dir * 70, 118], foot = fly ? [sx - 120, 150 + i * 8] : [sx + dir * 40 + (far ? 10 : 0), 215];
    stroke([[sx, 50], knee], col, 13); stroke([knee, foot], col2, 9); stroke([foot, [foot[0] + (fly ? -30 : dir * 22 + 8), foot[1] + (fly ? 6 : 8)]], col, 6);
    for (let k = 1; k < 4; k++) { const p = [lerp(knee[0], foot[0], k / 4), lerp(knee[1], foot[1], k / 4)]; stroke([p, [p[0] + 9, p[1] - 4]], '#2A2018', 2); }
  });
}
function hfWing(o, near) {
  ctx.save(); ctx.translate(-6, -62);
  const fl = o.flap != null ? Math.sin(o.flap) : null; if (fl != null) ctx.rotate(-0.25 - fl * 0.8); else ctx.rotate(near ? 0.02 : -0.08);
  const p = new Path2D(); p.moveTo(0, 0); p.bezierCurveTo(-110, -60, -290, -52, -350, -6); p.bezierCurveTo(-372, 22, -300, 44, -200, 36); p.lineTo(-10, 18); p.closePath();
  ctx.save(); ctx.globalAlpha = near ? 0.55 : 0.4; piece(p, '#DCE3E6', 0.4, false); ctx.restore();
  ctx.save(); ctx.clip(p); ctx.fillStyle = 'rgba(90,70,50,0.22)'; ctx.beginPath(); ctx.ellipse(-150, -30, 110, 26, 0.05, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.75; stroke([[0, 0], [-120, -46], [-300, -40], [-348, -8]], '#4A3C2E', 3);
  for (const [a, b] of [[[-20, 6], [-330, 10]], [[-30, 12], [-250, 32]], [[-90, -30], [-160, 28]], [[-180, -38], [-230, 30]], [[-60, -20], [-100, 22]]]) stroke([a, b], '#4A3C2E', 2);
  ctx.restore(); ctx.restore();
}
/** o = { x, y, s, rot, t, flap (wing phase) or null for folded, fly (legs trail), noLegs } ~560 px long at s = 1 */
function horsefly(o) {
  const t = o.t || 0;
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale(o.s || 1, o.s || 1);
  if (!o.noLegs) hfLegs(o, true);
  hfWing(o, false);
  // abdomen: broad, segmented, pale triangles down the middle
  const ab = new Path2D(); ab.moveTo(-60, -52); ab.bezierCurveTo(-180, -84, -320, -54, -332, 10); ab.bezierCurveTo(-326, 72, -190, 100, -60, 62); ab.closePath();
  piece(ab, '#6B5843', 1);
  ctx.save(); ctx.clip(ab);
  for (let i = 0; i < 6; i++) { const x = -96 - i * 40; curve(x, -90, x - 16, 10, x, 100, '#43362A', 5); piece(POLY([[x - 30, -70], [x - 4, -70], [x - 17, -36]]), '#CDB993', 0, false); piece(ELL(x - 18, 40, 12, 9), '#9C8566', 0, false); }
  for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(210,190,150,0.35)'; ctx.fillRect(-330 + R2(i) * 280, -70 + R2(i + 3) * 160, 2, 5); }
  ctx.restore();
  // thorax with grey stripes and hairs
  piece(ELL(0, -6, 88, 76), '#5C4C3B', 1);
  for (const yy of [-58, -40, -22]) curve(-70, yy + 10, 0, yy - 8, 70, yy + 10, 'rgba(190,180,160,0.55)', 5);
  for (let i = 0; i < 26; i++) { const a = -2.6 + i * 0.2; stroke([[Math.cos(a) * 86, -6 + Math.sin(a) * 74], [Math.cos(a) * 100, -6 + Math.sin(a) * 88]], '#8A7A62', 2); }
  // head and the huge banded eye
  piece(ELL(100, 4, 62, 78), '#4E4034', 0.8);
  const eye = ELL(100, -2, 58, 74); piece(eye, '#2C6B4A', 0.3, false);
  ctx.save(); ctx.clip(eye); const cols = ['#3E8E5A', '#7B3F8C', '#C8823A', '#2F7F86', '#4FA36A'];
  for (let i = -5; i <= 5; i++) { const pts = []; for (let x = 36; x <= 164; x += 8) pts.push([x, -2 + i * 15 + Math.sin(x / 14 + i) * 5]); stroke(pts, cols[(i + 5) % 5], 8); }
  for (let r = 0; r < 18; r++) for (let c = 0; c < 14; c++) { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.arc(44 + c * 9 + (r % 2) * 4, -74 + r * 9, 2.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(82, -42, 18, 10, -0.5, 0, TAU); ctx.fill(); ctx.restore();
  // short stout antennae
  stroke([[146, -48], [176, -60], [210, -56]], '#3A2E24', 9); piece(ELL(212, -56, 18, 7, 0.1), '#3A2E24', 0.2, false); for (let k = 0; k < 4; k++) stroke([[200 + k * 6, -62], [200 + k * 6, -50]], '#6A5848', 2);
  // mouthparts: short thick beak with two sponge pads at the tip
  ctx.save(); ctx.translate(132, 60); ctx.rotate(-0.25); piece(RR(-12, 0, 24, 94, 11), '#4A3A2A', 0.5); piece(ELL(-8, 102, 16, 20), '#B98A6A', 0.4); piece(ELL(8, 102, 16, 20), '#C99A7A', 0.4); ctx.restore();
  hfWing(o, true);
  if (!o.noLegs) hfLegs(o, false);
  ctx.restore();
}
/** where the mouth tip ends up on screen */
function hfMouthTip(o) { const s = o.s || 1, a = o.rot || 0, lx = 132 + 27, ly = 60 + 107; return [o.x + (lx * Math.cos(a) - ly * Math.sin(a)) * s, o.y + (lx * Math.sin(a) + ly * Math.cos(a)) * s]; }

// ── the blade mouthparts, big. o = { open 0..1 (scissor), spread 0..1 (exploded view), saw (phase), pads 0..1 } ──
function bladePath(len, w) { const p = new Path2D(); p.moveTo(-w / 2, 0); p.lineTo(w / 2, 0); p.lineTo(w * 0.38, len * 0.8); p.lineTo(0, len); p.lineTo(-w * 0.3, len * 0.82); p.closePath(); return p; }
function hfMouthBig(x, y, s, o = {}) {
  const sp = o.spread || 0, op = o.open || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // labium: the thick sheath, split down the front
  piece(RR(-70, -40, 140, 300, 60), '#4A3A2A', 1); piece(RR(-30, -30, 60, 260, 30), '#2E241A', 0, false);
  // 2 mandibles (scissor blades) and 2 maxillae (saw blades)
  const bl = (dx, rot, len, w, col, teeth) => { ctx.save(); ctx.translate(dx, -20); ctx.rotate(rot); const p = bladePath(len, w); piece(p, col, 0.6); ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.3, 10); ctx.lineTo(w * 0.22, len * 0.78); ctx.stroke(); ctx.restore();
    if (teeth) { const tp = new Path2D(); tp.moveTo(w * 0.44, len * 0.25); for (let k = 0; k < 9; k++) { const yy = len * 0.25 + k * len * 0.06; tp.lineTo(w * 0.44 + 12, yy + len * 0.03); tp.lineTo(w * 0.44 - (k / 9) * 6, yy + len * 0.06); } piece(tp, col, 0.2, false); }
    ctx.restore(); };
  const sw = Math.sin(o.saw || 0) * 12 * (o.sawing || 0);
  ctx.save(); ctx.translate(0, sw); bl(-14 - sp * 150, -0.08 - op * 0.3, 360, 46, '#C77F3A', true); bl(14 + sp * 150, 0.08 + op * 0.3, 360, 46, '#C77F3A', true); ctx.restore();
  bl(-8 - sp * 60, -0.04 - op * 0.22, 400, 70, '#E3B04B', false); bl(8 + sp * 60, 0.04 + op * 0.22, 400, 70, '#EDBE5A', false);
  // the spongy pads at the tip (labellum), with fine grooves
  const pd = o.pads ?? 1; if (pd > 0) { ctx.save(); ctx.translate(0, 330 + sp * 120); ctx.scale(pd, pd); for (const sd of [-1, 1]) { const p = ELL(sd * 62, 0, 74, 92, sd * 0.25); piece(p, sd < 0 ? '#B98A6A' : '#C99A7A', 0.8); ctx.save(); ctx.clip(p); for (let k = 0; k < 9; k++) curve(sd * 10, -70 + k * 16, sd * 70, -50 + k * 16, sd * 130, -60 + k * 18, 'rgba(110,70,45,0.55)', 3); ctx.restore(); } ctx.restore(); }
  ctx.restore();
}

// ── the cut in the skin (cross-section coords of skinDetail): V wound, blood pool, blades, sponge pad ──
function woundV(o = {}) {
  const t = o.t || 0, BX = 540, depth = (o.depth || 0) * 290, w = (o.depth || 0) * 70 + (o.open || 0) * 50;
  if (depth < 2) return;
  const p = new Path2D(); p.moveTo(BX - w, S0 - 2);
  for (let k = 1; k <= 6; k++) p.lineTo(lerp(BX - w, BX - 8, k / 6) + (R2(k) - 0.5) * 12, S0 + depth * k / 6);
  for (let k = 6; k >= 0; k--) p.lineTo(lerp(BX + w, BX + 8, k / 6) + (R2(k + 20) - 0.5) * 12, S0 + depth * k / 6 - 2);
  p.closePath(); ctx.save(); ctx.fillStyle = '#4A1418'; ctx.fill(p); ctx.strokeStyle = '#7A2A30'; ctx.lineWidth = 5; ctx.stroke(p); ctx.restore();
  // cut capillaries leaking at the walls
  const lv = clamp(o.pool || 0);
  if (lv > 0) { ctx.save(); ctx.clip(p); const top = S0 + depth - lv * (depth + 10); ctx.fillStyle = '#C8262E'; ctx.fillRect(BX - 300, top, 600, 600);
    ctx.fillStyle = 'rgba(255,170,170,0.5)'; ctx.fillRect(BX - 300, top, 600, 6);
    for (let i = 0; i < 10; i++) { const yy = top + 20 + R2(i) * Math.max(10, S0 + depth - top - 20), xx = BX + (R2(i + 4) - 0.5) * w * 1.2 * (1 - (yy - S0) / depth); rbc(xx + Math.sin(t * 2 + i) * 6, yy, 10, i + t * 0.5); }
    if (o.spit) for (let k = 0; k < 12; k++) { const ph = (t * 0.7 + k / 12) % 1; ctx.globalAlpha = o.spit * (1 - ph); piece(CIR(BX + Math.cos(k * 2.4) * ph * w * 0.8, top + 20 + ph * 120, 9 - ph * 4), '#7DDB6A', 0.1, false); ctx.globalAlpha = 1; }
    ctx.restore(); }
  if (o.seep) for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const ph = (t * 0.8 + i / 4) % 1, yy = S0 + depth * (0.45 + i * 0.12); ctx.globalAlpha = (1 - ph) * o.seep; rbc(BX + sd * (w * (1 - (yy - S0) / depth) + 20 - ph * 30), yy, 9, i + t); ctx.globalAlpha = 1; }
}
function bladesInCut(o) {
  const BX = 540, d = (o.depth || 0) * 290, cut = o.cutting ? Math.sin(o.t * 14) * 0.2 : 0;
  for (const [sd, col, wd] of [[-1, '#E3B04B', 34], [1, '#EDBE5A', 34], [-1, '#C77F3A', 22], [1, '#C77F3A', 22]]) {
    ctx.save(); ctx.translate(BX + sd * 6, S0 - 330 + d * 0.9 + (wd < 30 ? Math.sin(o.t * 22) * 8 * (o.cutting ? 1 : 0) : 0)); ctx.rotate(sd * (0.06 + Math.abs(cut) + (o.spread || 0) * 0.2)); piece(bladePath(340, wd), col, 0.5); ctx.restore();
  }
}
function padsInCut(o) {
  const BX = 540, y = S0 - 160 + (o.dip || 0) * 150;
  piece(RR(BX - 26, -300, 52, y + 40 + 300, 20), '#4A3A2A', 0.8);
  if (o.slurp) for (let k = 0; k < 8; k++) { const ph = (o.t * 1.2 + k / 8) % 1; ctx.globalAlpha = o.slurp; piece(CIR(BX + Math.sin(k) * 6, y - ph * 500, 9), '#C8262E', 0, false); ctx.globalAlpha = 1; }
  for (const sd of [-1, 1]) { const p = ELL(BX + sd * 52, y + 70, 62, 74, sd * 0.25); piece(p, sd < 0 ? '#B98A6A' : '#C99A7A', 0.7); ctx.save(); ctx.clip(p); for (let k = 0; k < 8; k++) curve(BX + sd * 8, y + 10 + k * 16, BX + sd * 60, y + 25 + k * 16, BX + sd * 120, y + 15 + k * 18, 'rgba(110,70,45,0.55)', 3); if (o.soak) { ctx.fillStyle = `rgba(200,38,46,${0.6 * o.soak})`; ctx.fillRect(BX - 200, y + 70, 400, 120); } ctx.restore(); }
}

// ── paper zebra and horse (side view facing right), origin = middle of the body ──
function equidPath() {
  const p = new Path2D();
  p.ellipse(0, 0, 220, 105, 0, 0, TAU);
  p.moveTo(120, -60); p.lineTo(200, -232); p.lineTo(272, -252); p.lineTo(262, -150); p.lineTo(200, 20); p.closePath();
  p.moveTo(200, -232); p.lineTo(250, -276); p.lineTo(292, -262); p.lineTo(384, -142); p.lineTo(376, -108); p.lineTo(338, -102); p.lineTo(262, -168); p.closePath();
  p.moveTo(232, -262); p.lineTo(244, -312); p.lineTo(264, -266); p.closePath();
  for (const lx of [-175, -125, 115, 160]) p.roundRect(lx - 18, 50, 36, 260, 16);
  return p;
}
/** kind: 'zebra' | 'horse' | 'coat' (brown horse wearing a striped coat) */
function equid(x, y, s, kind, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const tail = [[-212, -40], [-262, 30], [-282, 140]]; stroke(tail, kind === 'zebra' ? '#2A2426' : '#4A2E1E', 26);
  const p = equidPath(), base = kind === 'zebra' ? '#F3EEE4' : '#8A5A3A';
  piece(p, base, 1);
  if (kind === 'zebra') { ctx.save(); ctx.clip(p); ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const sx = -240 + i * 34; curve(sx, -120, sx + 30, 0, sx - 6, 110, '#1E1B1D', 15); }
    for (let i = 0; i < 9; i++) { const yy = -240 + i * 26; curve(170 + i * 4, yy + 30, 230, yy, 300 + i * 6, yy + 6 + i * 4, '#1E1B1D', 12); }
    for (const lx of [-175, -125, 115, 160]) for (let k = 0; k < 7; k++) stroke([[lx - 22, 120 + k * 26], [lx + 22, 126 + k * 26]], '#1E1B1D', 10);
    ctx.restore(); piece(ELL(368, -124, 22, 18, 0.8), '#2A2426', 0.2, false); }
  else ctx.save(), ctx.clip(p), ctx.fillStyle = 'rgba(50,30,20,0.25)', ctx.fillRect(-300, 40, 700, 300), ctx.restore();
  for (const lx of [-175, -125, 115, 160]) piece(RR(lx - 20, 290, 40, 26, 6), '#2A2426', 0.3, false);
  // mane
  for (let i = 0; i < 10; i++) { const u = i / 10; stroke([[lerp(132, 214, u), lerp(-80, -240, u)], [lerp(116, 200, u), lerp(-96, -262, u)]], kind === 'zebra' ? '#1E1B1D' : '#3A2416', 14); }
  pin(296, -214, 7);
  if (kind === 'coat') { const c = new Path2D(); c.roundRect(-205, -98, 330, 175, 50); piece(c, '#F3EEE4', 0.9); ctx.save(); ctx.clip(c); for (let i = 0; i < 13; i++) curve(-230 + i * 34, -110, -200 + i * 34, -10, -236 + i * 34, 90, '#1E1B1D', 15); ctx.restore(); }
  ctx.restore();
}
/** a tiny fly that circles a target point and either lands (lands=true) or bumps and bounces off */
function flyAround(t, i, cx, cy, r, lands, landAt) {
  const a = t * (1.6 + R2(i) * 0.8) + i * 2.1;
  if (lands && t > landAt + i * 0.25) { horsefly({ x: cx + (R2(i + 3) - 0.5) * r * 1.2, y: cy + (R2(i + 5) - 0.5) * r * 0.4, s: 0.12, t, rot: 0 }); return null; }
  const bump = !lands && Math.cos(a * 2) > 0.92, rr2 = r * (bump ? 0.62 : 1);
  const x = cx + Math.cos(a) * rr2, y = cy + Math.sin(a) * rr2 * 0.5;
  horsefly({ x, y, s: 0.12, t, flap: t * 60 + i, fly: true, rot: bump ? 0.6 : -0.1 });
  return bump ? [x, y] : null;
}

// ═══════════════ TAPEWORM KIT ═══════════════
function burger(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(RR(-260, 70, 520, 90, 40), '#D9963E', 0.8);
  const cutOpen = o.cut || 0;
  piece(RR(-280, 0, 560, 90, 44), '#6B3A22', 0.9);
  if (cutOpen) { ctx.save(); ctx.globalAlpha = cutOpen; const g = ctx.createLinearGradient(0, 0, 0, 90); g.addColorStop(0, '#6B3A22'); g.addColorStop(0.25, '#C25A5E'); g.addColorStop(0.5, '#E8838A'); g.addColorStop(0.75, '#C25A5E'); g.addColorStop(1, '#6B3A22'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-150, 6, 300, 78, 20); ctx.fill(); ctx.restore(); }
  piece(POLY([[-280, -10], [280, -10], [300, 20], [-300, 20]]), '#F2C14E', 0.4);
  for (let i = 0; i < 9; i++) piece(ELL(-240 + i * 60, -20, 50, 22, R2(i) - 0.5), '#7DBA4E', 0.3);
  const top = new Path2D(); top.moveTo(-270, -20); top.bezierCurveTo(-260, -230, 260, -230, 270, -20); top.closePath(); piece(top, '#D9963E', 1);
  for (let i = 0; i < 14; i++) piece(ELL(-180 + (i % 7) * 60 + (i > 6 ? 30 : 0), -120 - (i > 6 ? 40 : 0) + Math.sin(i) * 10, 8, 4, 0.4), '#F7E6C4', 0, false);
  ctx.restore();
}
/** muscle fibres with a beef tapeworm cyst inside (pale bladder with the folded-in head) */
function meatCyst(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(RR(-520, -360, 1040, 720, 40), '#C25A5E', 0.6, false);
  for (let i = 0; i < 18; i++) { const yy = -340 + i * 40; piece(RR(-520, yy, 1040, 34, 16), i % 2 ? '#D0666B' : '#B9505A', 0, false); stroke([[-520, yy + 30], [520, yy + 30]], 'rgba(255,220,220,0.35)', 2); }
  if (o.cyst !== false) { piece(ELL(0, 0, 150, 110), 'rgba(245,240,225,0.95)', 0.8); piece(ELL(0, 0, 130, 92), 'rgba(230,240,235,0.85)', 0, false); piece(ELL(-20, 10, 46, 40), '#F1E6CC', 0.3, false); for (let k = 0; k < 4; k++) piece(CIR(-38 + (k % 2) * 34, -6 + Math.floor(k / 2) * 30, 10), '#D8C9A6', 0, false); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-60, -50, 40, 18, -0.4, 0, TAU); ctx.fill(); }
  ctx.restore();
}
/** the head seen front-on: 4 round suckers, no hooks (beef tapeworm). grip 0..1 */
function scolexFront(x, y, s, grip = 0, hooks = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(RR(-90, 60, 180, 260, 60), '#EFE3C8', 0.8);
  piece(ELL(0, 0, 150, 130), '#F1E6CC', 1);
  for (const [sx, sy] of [[-70, -50], [70, -50], [-70, 50], [70, 50]]) { const r = 46 - grip * 6; piece(CIR(sx, sy, r), '#E3D3AE', 0.4); piece(CIR(sx, sy, r * 0.55), '#B8A07A', 0, false); ctx.strokeStyle = 'rgba(120,95,60,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, r * 0.8, 0, TAU); ctx.stroke(); }
  if (hooks) for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.save(); ctx.translate(Math.cos(a) * 36, Math.sin(a) * 36); ctx.rotate(a); piece(POLY([[0, -4], [26, -2], [30, 8], [22, 2], [0, 4]]), '#8A6A3A', 0.2, false); ctx.restore(); }
  else piece(CIR(0, 0, 22), '#E9DCBC', 0, false);
  ctx.restore();
}
/** tapeworm along a polyline path: tiny head + neck, then segments that widen and lengthen; gravid end segments show egg-filled uterus */
function wormAlong(pts, n, o = {}) {
  const t = o.t || 0, L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  const at = (u) => { let d = u * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k), Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])]; } d -= L[i]; } const a = pts.length - 1; return [pts[a][0], pts[a][1], 0]; };
  const grow = o.grow ?? 1, shown = Math.max(1, Math.floor(n * grow));
  for (let i = shown - 1; i >= 0; i--) { const u = i / n, [px, py, a] = at(Math.min(1, u)), w = lerp(8, o.maxW || 44, Math.pow(u, 0.6)), len = (tot / n) * 1.04; ctx.save(); ctx.translate(px, py + Math.sin(t * 2 + i * 0.3) * 2); ctx.rotate(a); piece(RR(-len / 2, -w / 2, len, w, Math.min(6, w / 4)), i % 2 ? '#F1E6CC' : '#EADCBC', 0.25, false); ctx.strokeStyle = 'rgba(150,125,80,0.55)'; ctx.lineWidth = 2; ctx.strokeRect(-len / 2, -w / 2, len, w);
    if (o.eggs && u > 0.7) { ctx.fillStyle = 'rgba(130,95,55,0.75)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(-len / 3 + (k % 3) * len / 3, -w / 4 + Math.floor(k / 3) * w / 2, 2.5, 0, TAU); ctx.fill(); } stroke([[-len / 2 + 2, 0], [len / 2 - 2, 0]], 'rgba(130,95,55,0.6)', 2); }
    ctx.restore(); }
  const [hx, hy] = at(0); piece(CIR(hx, hy, 12), '#F1E6CC', 0.3);
}
/** small-intestine wall: finger-like villi with blood capillaries and a lacteal; nutrients drifting */
function gutWall(y0, t, o = {}) {
  ctx.fillStyle = '#3A1F24'; ctx.fillRect(-600, -600, W + 1200, H + 1200);
  piece(RR(-600, y0, W + 1200, 900, 0), '#C9707A', 0.6, false); piece(RR(-600, y0 + 260, W + 1200, 120, 0), '#B95C68', 0.4, false);
  for (let i = 0; i < 16; i++) { const vx = -40 + i * 76, h = 220 + Math.sin(i * 1.7) * 30, sw = Math.sin(t * 1.5 + i) * 6; const v = new Path2D(); v.moveTo(vx - 28, y0 + 10); v.bezierCurveTo(vx - 30 + sw, y0 - h * 0.6, vx - 26 + sw, y0 - h, vx + sw, y0 - h); v.bezierCurveTo(vx + 26 + sw, y0 - h, vx + 30 + sw, y0 - h * 0.6, vx + 28, y0 + 10); v.closePath(); piece(v, '#E8A3A8', 0.5); stroke([[vx - 10, y0], [vx - 10 + sw, y0 - h + 20], [vx + 10 + sw, y0 - h + 20], [vx + 10, y0]], 'rgba(198,42,51,0.7)', 3); stroke([[vx, y0], [vx + sw, y0 - h + 30]], 'rgba(240,230,170,0.9)', 4); }
  if (o.food) for (let i = 0; i < 40; i++) { const ph = (t * 0.2 + R2(i)) % 1; piece(CIR(R2(i + 3) * 1200 - 60, lerp(-100, y0 - 300, R2(i + 7)) + Math.sin(t + i) * 20, 6 + R2(i + 1) * 6), ['#F2C14E', '#7DDB6A', '#F29AC8'][i % 3], 0, false); }
}
function bus(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(RR(-520, -180, 1040, 230, 30), '#F2C14E', 1); for (let i = 0; i < 8; i++) piece(RR(-470 + i * 115, -150, 90, 80, 10), '#9FD3E8', 0.2, false); piece(RR(-520, -40, 1040, 20, 0), '#C8822E', 0.2, false); for (const wx of [-330, 340]) { piece(CIR(wx, 60, 62), '#2A2522', 0.8); piece(CIR(wx, 60, 28), '#BDB4A4', 0, false); } ctx.restore(); }
function pills(x, y, s, n = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(RR(-120, -200, 240, 330, 30), '#F4EFE2', 1); piece(RR(-130, -250, 260, 70, 20), '#2F6FB5', 0.6); piece(RR(-90, -110, 180, 120, 10), '#FBF8EF', 0.3, false); ctx.fillStyle = '#3A2A1E'; ctx.font = `700 26px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('ANTI-WORM', 0, -50); for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(200 + i * 70, 100); ctx.rotate(0.4); piece(RR(-40, -18, 80, 36, 18), '#F4EFE2', 0.6); piece(RR(0, -18, 40, 36, 0), '#C8322B', 0, false); ctx.restore(); } ctx.restore(); }
function pig(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); for (const lx of [-90, -40, 50, 100]) piece(RR(lx - 16, 40, 32, 110, 12), '#E8A3A8', 0.5); piece(ELL(0, 0, 160, 100), '#F2B6BE', 1); piece(CIR(150, -40, 80), '#F2B6BE', 0.8); piece(ELL(215, -30, 30, 24), '#E8939E', 0.3); for (const sd of [-1, 1]) piece(CIR(215 + sd * 9, -30, 5), '#A85C68', 0, false); piece(CIR(160, -70, 9), '#2A1E1A', 0, false); piece(POLY([[110, -110], [130, -160], [150, -105]]), '#E8939E', 0.3); stroke([[-160, -20], [-200, -50], [-185, -70], [-210, -80]], '#E8939E', 8); ctx.restore(); }
function thermometer(x, y, s, v) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); piece(RR(-12, -10, 24, 300, 12), '#C9CED3', 0.6); piece(CIR(0, -60, 70), '#FBF8EF', 0.9); ctx.strokeStyle = '#3A2A1E'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = -Math.PI * 1.2 + i * 0.2; stroke([[Math.cos(a) * 54, -60 + Math.sin(a) * 54], [Math.cos(a) * 64, -60 + Math.sin(a) * 64]], '#3A2A1E', 3); } const a = -Math.PI * 1.2 + v * 2.2; stroke([[0, -60], [Math.cos(a) * 50, -60 + Math.sin(a) * 50]], '#C8322B', 6); pin(0, -60, 8); ctx.restore(); }
function bodyCoil(x, y, s, t, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  piece(CIR(0, -330, 90), '#F6E2C8', 0.6); piece(RR(-150, -240, 300, 460, 90), '#F6E2C8', 0.7);
  const pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120, a = u * TAU * 3.2, r = 40 + u * 70; pts.push([Math.cos(a) * r * 1.1, 20 + Math.sin(a) * r * 0.9]); }
  ctx.save(); ctx.globalAlpha = 0.9; stroke(pts, '#E8A3A8', 34); ctx.restore(); wormAlong(pts.slice(0, Math.max(2, Math.floor(120 * k))), 70, { t, maxW: 16 });
  ctx.restore();
}
// ═══ COLOSSAL SQUID SHARED KIT (16:9, all chapters). Never edit per chapter. ═══
/** Deep sea background: near-black blue water, faint marine snow drifting down, a dim seafloor plane.
 *  o = { floor: y of the seafloor (default 820), light: 0..1 a spotlight cone from above (sub lights), lx: spotlight x, glow: 0..1 } */
function deepSea(t, o = {}) {
  const fy = o.floor ?? 820;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B1A2E'); g.addColorStop(0.6, '#06101E'); g.addColorStop(1, '#030810'); ctx.fillStyle = g; ctx.fillRect(-800, -800, W + 1600, H + 1600);
  if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = PAT; ctx.fillRect(-800, -800, W + 1600, H + 1600); ctx.restore();
  // marine snow: tiny pale flakes drifting slowly down
  for (let i = 0; i < 110; i++) { const ph = (t * 0.02 + R2(i)) % 1; ctx.fillStyle = `rgba(210,225,240,${0.18 + 0.25 * R2(i + 3)})`; ctx.beginPath(); ctx.arc((R2(i + 4) * 2200 - 140 + Math.sin(t * 0.3 + i) * 8), -60 + ph * (fy + 120), 1.5 + R2(i) * 2.5, 0, TAU); ctx.fill(); }
  if (o.floor !== null) {
    const f = new Path2D(); f.moveTo(-800, fy); for (let x = -800; x <= W + 800; x += 80) f.lineTo(x, fy + Math.sin(x * 0.004) * 14 + Math.sin(x * 0.013) * 6); f.lineTo(W + 800, H + 800); f.lineTo(-800, H + 800); f.closePath();
    piece(f, '#3A3A3C', 0.4, false);
    ctx.save(); ctx.clip(f); const fg = ctx.createLinearGradient(0, fy, 0, H); fg.addColorStop(0, 'rgba(90,86,80,0.55)'); fg.addColorStop(1, 'rgba(10,12,16,0.8)'); ctx.fillStyle = fg; ctx.fillRect(-800, fy - 40, W + 1600, H); for (let i = 0; i < 70; i++) piece(ELL(R2(i + 11) * 2100 - 90, fy + 20 + R2(i + 12) * (H - fy), 6 + R2(i) * 18, 3 + R2(i + 1) * 5), 'rgba(120,114,104,0.5)', 0, false); ctx.restore();
  }
  const li = o.light || 0; if (li > 0) { const lx = o.lx ?? W / 2; ctx.save(); ctx.globalAlpha = 0.22 * li; const lg = ctx.createRadialGradient(lx, fy, 20, lx, fy, 900); lg.addColorStop(0, '#CFE6FF'); lg.addColorStop(1, 'rgba(207,230,255,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(lx - 120, -100); ctx.lineTo(lx + 120, -100); ctx.lineTo(lx + 900, fy + 200); ctx.lineTo(lx - 900, fy + 200); ctx.closePath(); ctx.fill(); ctx.restore(); }
}

/** wavy body helper: centreline from head (u=0, at origin) to tail (+x). Returns outline path + points + normals (normal +y = lower side). */
function wfBody(len, wid, wave, t, n = 28, u0 = 0, freq = 5) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([u * len, Math.sin(u * freq - t * 4) * wave * u]); }
  const nrm = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  const i0 = Math.round(u0 * n), p = new Path2D();
  for (let i = i0; i <= n; i++) { const w = wid(i / n), q = [pts[i][0] + nrm[i][0] * w, pts[i][1] + nrm[i][1] * w]; i === i0 ? p.moveTo(q[0], q[1]) : p.lineTo(q[0], q[1]); }
  for (let i = n; i >= i0; i--) { const w = wid(i / n); p.lineTo(pts[i][0] - nrm[i][0] * w, pts[i][1] - nrm[i][1] * w); }
  p.closePath(); return { p, pts, nrm, i0 };
}

/** Little yellow research sub (same drawing as Alvin, recoloured): white hull, red-orange sail on top, viewports in the front sphere, lights, two manipulator arms,
 *  sample basket, skids and a stern thruster. Faces RIGHT, origin = hull centre, about 520 px long at s = 1.
 *  o = { t, light 0..1, beamA (rad, beam angle, + = down), beamL, flip, name } */
function ysub(x, y, s, o = {}) {
  const t = o.t || 0, li = o.light ?? 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s); ctx.rotate(o.rot || 0);
  if (li > 0) {
    ctx.save(); ctx.translate(240, 10); ctx.rotate(o.beamA ?? 0.3); const BL = o.beamL || 1000; ctx.globalAlpha = 0.32 * li;
    const g = ctx.createLinearGradient(0, 0, BL, 0); g.addColorStop(0, '#FFF6D8'); g.addColorStop(1, 'rgba(255,246,216,0)'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(BL, -BL * 0.28); ctx.lineTo(BL, BL * 0.28); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // stern thruster with a spinning prop
  piece(RR(-318, -30, 70, 60, 16), '#D7DAD8', 0.4); piece(ELL(-322, 0, 7, 38 * Math.abs(Math.cos(t * 9)) + 4), '#565B62', 0, false);
  for (const sd of [-1, 1]) piece(POLY([[-230, sd * 60], [-300, sd * 96], [-280, sd * 104], [-200, sd * 66]]), '#E8EAE6', 0.3);
  // skids and lift frame
  piece(RR(-210, 86, 400, 14, 7), '#9AA0A4', 0.4); for (const sx of [-150, 120]) piece(RR(sx, 60, 14, 32, 4), '#9AA0A4', 0.2, false);
  // hull
  const hull = RR(-262, -80, 512, 170, 84); piece(hull, '#F2C230', 1);
  ctx.save(); ctx.clip(hull); piece(RR(-280, 40, 560, 60, 0), '#D9A81E', 0, false); stroke([[-200, -20], [140, -20]], 'rgba(150,155,160,0.35)', 3); ctx.restore();
  // red-orange sail on top with the name
  const sail = new Path2D(); sail.moveTo(-160, -74); sail.bezierCurveTo(-150, -140, -110, -158, -40, -158); sail.lineTo(110, -158); sail.bezierCurveTo(160, -158, 186, -120, 186, -74); sail.closePath(); piece(sail, '#E4572E', 0.7);
  if (o.name !== false) { ctx.fillStyle = '#FBF6E8'; ctx.font = `700 36px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ROV', 14, -112); }
  piece(RR(30, -186, 16, 30, 4), '#C9CCCA', 0.2, false); piece(CIR(38, -190, 7), '#E4572E', 0, false);
  // lights on the frame
  for (const [lx, ly] of [[176, -70], [232, -36], [214, 70]]) { piece(RR(lx - 14, ly - 10, 28, 20, 6), '#5E646A', 0.2, false); ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * li; piece(CIR(lx + 10, ly, 8), li > 0 ? '#FFF2C4' : '#AEB4BA', 0, false); ctx.restore(); }
  // front sphere viewports
  for (const [vx, vy, vr] of [[214, 18, 15], [188, 46, 11], [236, 50, 10]]) { piece(CIR(vx, vy, vr + 5), '#B8BCC0', 0.2, false); piece(CIR(vx, vy, vr), '#24425C', 0, false); ctx.fillStyle = 'rgba(200,230,255,0.6)'; ctx.beginPath(); ctx.arc(vx - vr * 0.3, vy - vr * 0.3, vr * 0.3, 0, TAU); ctx.fill(); }
  // two manipulator arms and the sample basket
  const sw = Math.sin(t * 1.3) * 8;
  for (const [ax, ay, k] of [[200, 74, 0], [236, 66, 1]]) { const ex = ax + 70, ey = ay + 34 + sw * (k ? 1 : -1) * 0.4, hx = ex + 52, hy = ey - 18; stroke([[ax, ay], [ex, ey]], '#8E9499', 11); stroke([[ex, ey], [hx, hy]], '#A5ABB0', 9); pin(ex, ey, 6); stroke([[hx, hy], [hx + 16, hy - 10]], '#6E747A', 5); stroke([[hx, hy], [hx + 18, hy + 6]], '#6E747A', 5); }
  piece(RR(226, 104, 130, 34, 6), '#A5ABB0', 0.3); for (let i = 0; i < 6; i++) stroke([[236 + i * 20, 106], [236 + i * 20, 136]], 'rgba(60,66,72,0.6)', 2);
  ctx.restore();
}

/** research ship, facing RIGHT, origin = waterline centre, about 660 px long at s = 1. o = { t, cable: y (local) of a hanging cable end } */
function researchShip(x, y, s, o = {}) {
  const t = o.t || 0;
  ctx.save(); ctx.translate(x, y + Math.sin(t * 1.5) * 4); ctx.rotate(Math.sin(t * 1.2) * 0.015); ctx.scale(s, s);
  if (o.cable != null) stroke([[-330, -170], [-334, o.cable]], '#2A2A2A', 3);
  piece(RR(-30, -168, 220, 120, 10), '#F1F2EE', 0.8); piece(RR(30, -222, 140, 60, 8), '#F1F2EE', 0.6);
  for (let i = 0; i < 5; i++) piece(RR(42 + i * 24, -208, 16, 14, 3), '#2C4A63', 0, false);
  for (let i = 0; i < 6; i++) piece(CIR(0 + i * 32, -110, 6), '#2C4A63', 0, false);
  stroke([[110, -222], [110, -300]], '#C9CCCA', 6); stroke([[90, -280], [130, -280]], '#C9CCCA', 4);
  stroke([[-300, -50], [-336, -172], [-258, -172], [-252, -50]], '#E4572E', 11);
  piece(POLY([[-330, -52], [300, -52], [346, -92], [336, -44], [272, 40], [-300, 40], [-330, 0]]), '#2F4B6E', 1);
  piece(RR(-322, -52, 640, 14, 4), '#F1F2EE', 0, false);
  ctx.restore();
}

function vignette(a = 0.7) { const g = ctx.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1150); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(-800, -800, W + 1600, H + 1600); }



// ───────────────────────── squid pieces ─────────────────────────
/** tapered wavy limb from (0,0) going LEFT; returns points. len, w0 width at base, w1 at tip, wave amp, phase. */
function sqLimb(len, w0, w1, wave, t, ph, col, o = {}) {
  const n = 22, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([-u * len, Math.sin(u * 4 - t * 1.6 + ph) * wave * u + (o.droop || 0) * u * u]); }
  const nr = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  const p = new Path2D();
  for (let i = 0; i <= n; i++) { const w = lerp(w0, w1, i / n) / 2; const q = [pts[i][0] + nr[i][0] * w, pts[i][1] + nr[i][1] * w]; i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]); }
  for (let i = n; i >= 0; i--) { const w = lerp(w0, w1, i / n) / 2; p.lineTo(pts[i][0] - nr[i][0] * w, pts[i][1] - nr[i][1] * w); }
  p.closePath(); piece(p, col, 0.5);
  // suckers along the underside
  for (let i = 3; i < n; i += 2) { const w = lerp(w0, w1, i / n) / 2; const sx = pts[i][0] + nr[i][0] * w * 0.35, sy = pts[i][1] + nr[i][1] * w * 0.35; piece(CIR(sx, sy, Math.max(2.5, w * 0.34)), o.suck || '#E9C7B4', 0, false); }
  return { pts, nr };
}

/** tentacle club with hooks: drawn at the tip of a long thin stalk, pointing LEFT. Origin = club base. big = hooks drawn large. */
function sqClub(len, w, col, t, o = {}) {
  const p = new Path2D(); p.moveTo(0, -w * 0.28); p.bezierCurveTo(-len * 0.3, -w * 0.62, -len * 0.75, -w * 0.62, -len, 0); p.bezierCurveTo(-len * 0.75, w * 0.62, -len * 0.3, w * 0.62, 0, w * 0.28); p.closePath(); piece(p, col, 0.5);
  for (let i = 0; i < 7; i++) {
    const hx = -len * (0.1 + i * 0.12), hr = (o.hook || 1) * (13 - i * 0.9) * (w / 60);
    for (const sd of [-1, 1]) {
      const hy = sd * w * 0.1 * (1 - i * 0.07), a = sd * (0.2 + 0.25 * Math.sin(t * 2 + i + (sd > 0 ? 0 : 1.5)) * (o.spin ?? 1));
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(a);
      piece(CIR(0, 0, hr * 0.62), '#7A3A2A', 0, false);
      const hk = new Path2D(); hk.moveTo(-hr * 0.5, 0); hk.quadraticCurveTo(-hr * 0.9, sd * hr * 1.5, hr * 0.6, sd * hr * 1.8); hk.quadraticCurveTo(-hr * 0.1, sd * hr * 1.0, hr * 0.5, 0); hk.closePath(); piece(hk, '#2A1A16', 0.2, false);
      ctx.restore();
    }
  }
}

/** The eye of a colossal squid. Origin = centre. r = radius (about 58 at squid scale 1). */
function sqEye(x, y, r, o = {}) {
  ctx.save(); ctx.translate(x, y);
  piece(CIR(0, 0, r * 1.12), o.skin || '#7C2E34', 0.6);
  piece(CIR(0, 0, r), '#1E2A3A', 0.5);
  const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r); g.addColorStop(0, '#9FC3D8'); g.addColorStop(0.55, '#3F6E8E'); g.addColorStop(1, '#16283A'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, TAU); ctx.fill();
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; stroke([[Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42], [Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86]], 'rgba(220,240,250,0.16)', 2); }
  const pr = r * (o.pupil ?? 0.42); piece(ELL(0, 0, pr * 1.25, pr, 0), '#05080C', 0, false);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.14, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Colossal squid, head and arms to the LEFT, mantle and diamond fins to the RIGHT. About 1000 px long at s = 1.
 *  o = { t, juv: 0..1 (1 = small see-through juvenile look: pale glass body, orange chromatophore dots), arms: 0..1 how far arms are spread,
 *  tent: 0..1 tentacles shot out, flip, rot, glow 0..1 pale rim light } */
function colossalSquid(x, y, s, o = {}) {
  const t = o.t || 0, jv = o.juv || 0, arms = o.arms ?? 1, tent = o.tent ?? 0.2;
  const skin = mixHex('#A23F45', '#D8E6EA', jv), skin2 = mixHex('#7C2E34', '#B9CED6', jv), sucker = mixHex('#E9C7B4', '#F4FAFB', jv);
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.flip ? -s : s, s);
  if (jv > 0.5) ctx.globalAlpha = 0.92;
  // far arms (behind), then tentacles
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(-60, -20 + i * 14); ctx.rotate(-0.5 + i * 0.28 + Math.sin(t * 0.8 + i) * 0.05); sqLimb(lerp(150, 420, arms) * (0.9 + 0.05 * i), 34, 9, 14, t, i * 1.3, skin2, { suck: sucker }); ctx.restore(); }
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(-70, sd * 20); ctx.rotate(sd * (0.14 + Math.sin(t * 0.7 + sd) * 0.03)); const L = lerp(300, 820, tent); sqLimb(L, 16, 11, 20, t, sd * 2, skin2, { suck: sucker }); ctx.translate(-L, 0); sqClub(150, 64, skin, t); ctx.restore(); }
  // mantle
  const m = new Path2D(); m.moveTo(-30, -78); m.bezierCurveTo(120, -130, 330, -118, 520, -52); m.bezierCurveTo(560, -20, 560, 20, 520, 52); m.bezierCurveTo(330, 120, 120, 130, -30, 78); m.closePath();
  // fins: two big diamonds on the rear half
  for (const sd of [-1, 1]) { const f = new Path2D(); f.moveTo(300, sd * 100); f.bezierCurveTo(360, sd * (170 + Math.sin(t * 1.4) * 10), 470, sd * 190, 560, sd * 120); f.bezierCurveTo(520, sd * 80, 470, sd * 62, 420, sd * 56); f.closePath(); piece(f, skin2, 0.5); }
  piece(m, skin, 0.9);
  ctx.save(); ctx.clip(m);
  if (jv < 0.6) { for (let i = 0; i < 90; i++) piece(CIR(40 + R2(i) * 500, -110 + R2(i + 1) * 220, 2 + R2(i + 2) * 5), 'rgba(80,24,30,0.35)', 0, false); }
  else { for (let i = 0; i < 70; i++) piece(CIR(40 + R2(i) * 500, -110 + R2(i + 1) * 220, 2 + R2(i + 2) * 3.2), i % 3 ? 'rgba(235,130,60,0.8)' : 'rgba(210,70,50,0.8)', 0, false); stroke([[20, 0], [520, 0]], 'rgba(150,175,185,0.5)', 5); for (let i = 0; i < 10; i++) stroke([[60 + i * 45, -40], [60 + i * 45, 40]], 'rgba(150,175,185,0.25)', 2); }
  const sh = ctx.createLinearGradient(0, -110, 0, 110); sh.addColorStop(0, 'rgba(255,255,255,0.18)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = sh; ctx.fillRect(-60, -140, 660, 280);
  ctx.restore();
  // head and funnel
  piece(ELL(-50, 0, 90, 82), skin, 0.9); piece(RR(-120, 48, 60, 26, 10), skin2, 0.3);
  // near arms (in front)
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(-110, 8 + i * 12); ctx.rotate(0.05 + i * 0.22 + Math.sin(t * 0.9 + i * 2) * 0.05); sqLimb(lerp(150, 400, arms) * (1 - 0.04 * i), 40, 9, 16, t, i * 1.7 + 1, skin, { suck: sucker, droop: 20 }); ctx.restore(); }
  sqEye(-52, -8, o.eyeR || 58, { skin: skin2 });
  if (o.glow) { ctx.save(); ctx.globalAlpha = 0.25 * o.glow; ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(-50, 0, 20, -50, 0, 500); g.addColorStop(0, '#CFE6FF'); g.addColorStop(1, 'rgba(207,230,255,0)'); ctx.fillStyle = g; ctx.fillRect(-600, -400, 1300, 800); ctx.restore(); }
  ctx.restore();
}

/** Antarctic toothfish, head LEFT, about 420 px long at s = 1. o = { t } */
function toothfish(x, y, s, o = {}) {
  const t = o.t || 0; ctx.save(); ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s); ctx.rotate(o.rot || 0);
  const b = new Path2D(); b.moveTo(-200, 6); b.bezierCurveTo(-180, -70, 40, -80, 140, -26); b.lineTo(210, -50); b.lineTo(200, 40); b.lineTo(140, 24); b.bezierCurveTo(40, 80, -180, 70, -200, 6); b.closePath();
  piece(b, '#7A6F62', 0.8); ctx.save(); ctx.clip(b); piece(RR(-210, 10, 430, 70, 0), '#B9AF9C', 0, false); for (let i = 0; i < 40; i++) piece(CIR(-140 + R2(i) * 280, -40 + R2(i + 1) * 70, 4 + R2(i + 2) * 8), 'rgba(60,52,44,0.25)', 0, false); ctx.restore();
  piece(POLY([[-40, -58], [20, -92], [90, -78], [100, -34]]), '#5E554A', 0.3); piece(POLY([[-30, 52], [30, 84], [80, 64], [70, 32]]), '#5E554A', 0.3);
  piece(CIR(-160, -12, 13), '#E8E2D0', 0.2, false); piece(CIR(-160, -12, 7), '#111', 0, false); stroke([[-178, 22], [-140, 26]], '#3A332B', 4);
  ctx.restore();
}

/** Sperm whale, head LEFT, drawn side-on, about 1000 px long at s = 1 (blunt box head, small lower jaw, flukes at right). */
function spermWhale(x, y, s, o = {}) {
  const t = o.t || 0; ctx.save(); ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s); ctx.rotate(o.rot || 0);
  const b = new Path2D(); b.moveTo(-500, -90); b.bezierCurveTo(-500, -190, -380, -200, -250, -170); b.bezierCurveTo(-50, -140, 250, -120, 420, -30); b.lineTo(520, -20); b.lineTo(580, -110); b.lineTo(640, -90); b.lineTo(590, 0); b.lineTo(640, 90); b.lineTo(580, 110); b.lineTo(520, 20); b.lineTo(420, 30); b.bezierCurveTo(250, 120, -50, 130, -250, 110); b.bezierCurveTo(-400, 100, -480, 90, -500, 60); b.closePath();
  piece(b, '#56606C', 0.9); ctx.save(); ctx.clip(b); piece(RR(-520, 40, 1200, 100, 0), '#8D97A2', 0, false);
  for (let i = 0; i < 30; i++) stroke([[-200 + i * 8, -150 + (i % 3) * 20], [-190 + i * 8, -120 + (i % 3) * 20]], 'rgba(30,36,44,0.25)', 2); ctx.restore();
  piece(POLY([[-430, 88], [-120, 96], [-100, 120], [-410, 110]]), '#7F8A96', 0.4);
  piece(CIR(-300, 30, 7), '#10141A', 0, false); const fp = new Path2D(); fp.moveTo(-170, 60); fp.quadraticCurveTo(-120, 150, -60, 160); fp.quadraticCurveTo(-90, 100, -90, 60); fp.closePath(); piece(fp, '#4C5560', 0.4);
  ctx.restore();
}

/** squid beak (parrot-like, hooked upper and lower), origin centre, about 120 px wide at s = 1. */
function sqBeak(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const lo = new Path2D(); lo.moveTo(-60, 18); lo.bezierCurveTo(-60, 60, 10, 72, 70, 40); lo.bezierCurveTo(30, 40, 6, 20, 0, 4); lo.bezierCurveTo(-30, 0, -50, 6, -60, 18); lo.closePath(); piece(lo, '#3A2418', 0.5);
  const up = new Path2D(); up.moveTo(-50, -4); up.bezierCurveTo(-60, -50, 0, -64, 66, -14); up.lineTo(76, 14); up.bezierCurveTo(30, -2, 0, 4, -50, -4); up.closePath(); piece(up, '#5A3A26', 0.6);
  stroke([[-36, -20], [20, -26]], 'rgba(220,180,140,0.35)', 3); ctx.restore();
}

/** low-poly boxy ROV (SuBastian style): orange-yellow frame, white float on top, two lights, two arms, camera dome. Faces RIGHT, about 420 px long. o = { t, beam 0..1, beamA, beamL } */
function rovBox(x, y, s, o = {}) {
  const t = o.t || 0, li = o.beam ?? 1; ctx.save(); ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s); ctx.rotate(o.rot || 0);
  if (li > 0) { ctx.save(); ctx.translate(180, 20); ctx.rotate(o.beamA ?? 0.1); const BL = o.beamL || 900; ctx.globalAlpha = 0.34 * li; const g = ctx.createLinearGradient(0, 0, BL, 0); g.addColorStop(0, '#FFF6D8'); g.addColorStop(1, 'rgba(255,246,216,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(BL, -BL * 0.3); ctx.lineTo(BL, BL * 0.3); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill(); ctx.restore(); }
  piece(RR(-200, -100, 400, 70, 14), '#F1F2EE', 0.8); piece(RR(-210, -30, 420, 110, 12), '#E4572E', 0.9);
  for (let i = 0; i < 4; i++) stroke([[-170 + i * 100, -22], [-170 + i * 100, 70]], 'rgba(120,40,20,0.4)', 4);
  piece(RR(-180, 80, 360, 14, 6), '#6E747A', 0.3);
  for (const [lx, ly] of [[190, -10], [190, 40]]) { piece(RR(lx - 10, ly - 12, 30, 24, 6), '#5E646A', 0.2, false); piece(CIR(lx + 20, ly, 9), '#FFF2C4', 0, false); }
  piece(CIR(150, -60, 22), '#24425C', 0.2); ctx.fillStyle = 'rgba(200,230,255,0.6)'; ctx.beginPath(); ctx.arc(144, -66, 6, 0, TAU); ctx.fill();
  const sw = Math.sin(t * 1.4) * 8; stroke([[190, 70], [250, 96 + sw], [296, 80 + sw]], '#8E9499', 11); stroke([[296, 80 + sw], [314, 72 + sw]], '#6E747A', 7); stroke([[296, 80 + sw], [316, 90 + sw]], '#6E747A', 7); pin(250, 96 + sw, 6);
  piece(RR(-120, -134, 20, 34, 4), '#C9CCCA', 0.2, false); stroke([[-110, -134], [-110, -400]], '#2A2A2A', 3);
  ctx.restore();
}

/** chapter card for chapters 2 to 4: k = 0..1 (draw fully visible from frame 0) */
function chapterCard(num, name, k) { if (k <= 0) return; label(num, W / 2, H * 0.2, k, -0.03, 60, '#FBF6E8', '#C8322B'); label(name, W / 2, H * 0.31, k, 0.02, 84, '#FBF6E8', '#2A2E36'); }
/** mixHex helper */
function mixHex(a, b, k) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); }
// ═══ chapter 3 own pieces: soccer ball, journal card, ice block, glow dots, big rotating hook club, arm lens ═══
/** paper soccer ball, centre x,y radius r */
function soccerBall(x, y, r) {
  ctx.save(); ctx.translate(x, y);
  piece(CIR(0, 0, r), '#F4F1EA', 0.9);
  ctx.save(); ctx.clip(CIR(0, 0, r));
  const pent = (cx, cy, pr, rot) => { const p = new Path2D(); for (let i = 0; i < 5; i++) { const a = rot + i / 5 * TAU; i ? p.lineTo(cx + Math.cos(a) * pr, cy + Math.sin(a) * pr) : p.moveTo(cx + Math.cos(a) * pr, cy + Math.sin(a) * pr); } p.closePath(); return p; };
  piece(pent(0, 0, r * 0.3, -Math.PI / 2), '#23262B', 0, false);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; stroke([[Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3], [Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55]], '#23262B', 5); piece(pent(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, r * 0.3, a + Math.PI), '#23262B', 0, false); }
  const sh = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r); sh.addColorStop(0, 'rgba(255,255,255,0.3)'); sh.addColorStop(1, 'rgba(0,0,30,0.28)'); ctx.fillStyle = sh; ctx.fillRect(-r, -r, 2 * r, 2 * r);
  ctx.restore(); ctx.restore();
}

/** paper journal cover */
function journalCard(x, y, s, rot, k = 1) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * k, s * k);
  piece(RR(-220, -290, 440, 580, 14), '#FBF6E8', 1); piece(RR(-220, -290, 440, 120, 14), '#C8322B', 0, false);
  ctx.fillStyle = '#FBF6E8'; ctx.font = `700 46px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CURRENT', 0, -250); ctx.fillText('BIOLOGY', 0, -204);
  ctx.fillStyle = '#2A2E36'; ctx.font = `700 120px ${SERIF}`; ctx.fillText('2012', 0, -60);
  for (let i = 0; i < 6; i++) stroke([[-160, 40 + i * 34], [160 - (i % 3) * 40, 40 + i * 34]], 'rgba(42,46,54,0.35)', 5);
  pin(0, -296, 10); ctx.restore();
}

/** icy cold background */
function iceBg(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#34607E'); g.addColorStop(1, '#10283C'); ctx.fillStyle = g; ctx.fillRect(-800, -800, W + 1600, H + 1600);
  if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = PAT; ctx.fillRect(-800, -800, W + 1600, H + 1600); ctx.restore();
  for (let i = 0; i < 60; i++) { const ph = (t * 0.03 + R2(i)) % 1; ctx.fillStyle = `rgba(235,246,255,${0.25 + 0.3 * R2(i + 3)})`; ctx.beginPath(); ctx.arc(R2(i + 4) * 1920 + Math.sin(t * 0.4 + i) * 10, -40 + ph * 1160, 2 + R2(i) * 3, 0, TAU); ctx.fill(); }
}
/** block of ice, centre x,y, w,h */
function iceBlock(x, y, w, h) {
  ctx.save(); ctx.translate(x, y); const p = RR(-w / 2, -h / 2, w, h, 56);
  piece(p, 'rgba(170,215,235,0.5)', 1); ctx.save(); ctx.clip(p);
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,180,215,0.35)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  for (let i = 0; i < 7; i++) stroke([[-w / 2 + 40 + i * w / 8, -h / 2 + 20], [-w / 2 + 90 + i * w / 8, h / 2 - 20]], 'rgba(255,255,255,0.2)', 4);
  ctx.restore(); stroke([[-w / 2 + 60, -h / 2 + 30], [-w / 2 + 200, -h / 2 + 30]], 'rgba(255,255,255,0.7)', 8); ctx.restore();
}
/** frost snowflake */
function frostFlake(x, y, r, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); stroke([[0, 0], [r, 0]], 'rgba(235,246,255,0.85)', 4); stroke([[r * 0.55, 0], [r * 0.8, r * 0.25]], 'rgba(235,246,255,0.85)', 3); stroke([[r * 0.55, 0], [r * 0.8, -r * 0.25]], 'rgba(235,246,255,0.85)', 3); } ctx.restore(); }

/** glowing sea life: blue-green dots lit up around a box (cx, cy, half-width, half-height), k 0..1 how many */
function glowDots(cx, cy, hw, hh, t, k = 1, n = 70) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < Math.round(n * k); i++) {
    const a = R2(i + 900) * TAU, rr = 0.6 + R2(i + 901) * 0.7, x = cx + Math.cos(a) * hw * rr + Math.sin(t * 0.9 + i) * 14, y = cy + Math.sin(a) * hh * rr + Math.cos(t * 0.7 + i * 2) * 10, tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7), r = 3 + R2(i + 902) * 6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, `rgba(120,255,230,${0.9 * tw})`); g.addColorStop(1, 'rgba(60,200,230,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/** one hook: socket ring plus a curved claw that has turned by ang (radians) */
function turnHook(x, y, r, ang, col = '#2A1A16') {
  ctx.save(); ctx.translate(x, y);
  piece(CIR(0, 0, r * 1.15), '#7A3A2A', 0.3); piece(CIR(0, 0, r * 0.8), '#4A2018', 0, false);
  ctx.rotate(ang); const hk = new Path2D(); hk.moveTo(-r * 0.4, 0); hk.bezierCurveTo(-r * 0.4, -r * 1.5, r * 0.5, -r * 2.2, r * 1.1, -r * 1.8); hk.bezierCurveTo(r * 0.3, -r * 1.7, r * 0.4, -r * 1.1, r * 0.4, 0); hk.closePath(); piece(hk, col, 0.4, false);
  stroke([[-r * 0.15, -r * 0.2], [-r * 0.1, -r * 1.1]], 'rgba(255,230,200,0.35)', 2);
  ctx.restore();
}
/** big tentacle club close-up, pointing LEFT, origin = club base. len, w. spin = radians the hooks have turned */
function bigClub(x, y, s, t, spin) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // stalk
  const L = 1300; const st = []; for (let i = 0; i <= 24; i++) st.push([i / 24 * L, -Math.sin(i / 24 * 2.4) * 60]); stroke(st, '#7C2E34', 54); stroke(st, '#A23F45', 44);
  const p = new Path2D(); p.moveTo(40, -62); p.bezierCurveTo(-200, -170, -520, -170, -700, 0); p.bezierCurveTo(-520, 170, -200, 170, 40, 62); p.closePath(); piece(p, '#A23F45', 0.9);
  ctx.save(); ctx.clip(p); for (let i = 0; i < 50; i++) piece(CIR(-680 + R2(i) * 700, -150 + R2(i + 1) * 300, 3 + R2(i + 2) * 5), 'rgba(80,24,30,0.35)', 0, false); ctx.restore();
  for (let c = 0; c < 6; c++) for (const sd of [-1, 1]) { const hx = -90 - c * 92, hy = sd * (46 + c * 3) * (1 - c * 0.05); turnHook(hx, hy, 24 - c * 1.6, spin + c * 0.5 + (sd > 0 ? 1.2 : 0), '#2A1A16'); }
  // rim suckers
  for (let c = 0; c < 6; c++) for (const sd of [-1, 1]) piece(CIR(-70 - c * 100, sd * (112 - c * 10), 14 - c), '#E9C7B4', 0, false);
  ctx.restore();
}
/** magnifier lens showing a short stretch of an arm with its small fixed hooks */
function armLens(x, y, R, t, k = 1) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  piece(CIR(0, 0, R + 16), '#FBF6E8', 1); ctx.save(); ctx.clip(CIR(0, 0, R)); ctx.fillStyle = '#0A1626'; ctx.fillRect(-R, -R, 2 * R, 2 * R);
  ctx.save(); ctx.rotate(-0.3); piece(RR(-R * 1.3, -R * 0.36, R * 2.6, R * 0.72, R * 0.36), '#A23F45', 0.9);
  for (let i = 0; i < 5; i++) { const sx = -R * 0.85 + i * R * 0.42; piece(CIR(sx, 0, R * 0.17), '#E9C7B4', 0.3, false); piece(CIR(sx, 0, R * 0.1), '#7A3A2A', 0, false); const hk = new Path2D(); const hr = R * 0.07; hk.moveTo(sx - hr * 0.4, 0); hk.bezierCurveTo(sx - hr * 0.4, -hr * 1.8, sx + hr * 0.6, -hr * 2.4, sx + hr * 1.2, -hr * 2); hk.bezierCurveTo(sx + hr * 0.3, -hr * 1.8, sx + hr * 0.4, -hr, sx + hr * 0.4, 0); hk.closePath(); piece(hk, '#2A1A16', 0.2, false); }
  ctx.restore(); ctx.restore(); ctx.restore();
}
/** circular arrow around (x, y) radius r, drawn for 'frac' of a full turn (0..1) */
function turnArrow(x, y, r, frac, col = '#FBF6E8', w = 12) {
  if (frac <= 0) return; ctx.save(); ctx.translate(x, y); const a1 = -Math.PI / 2 + frac * TAU;
  ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, a1); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  const hx = Math.cos(a1) * r, hy = Math.sin(a1) * r, tx = -Math.sin(a1), ty = Math.cos(a1), nx = Math.cos(a1), ny = Math.sin(a1);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(hx + tx * 30, hy + ty * 30); ctx.lineTo(hx + nx * 26, hy + ny * 26); ctx.lineTo(hx - nx * 26, hy - ny * 26); ctx.closePath(); ctx.fill(); ctx.restore();
}
/** measuring line with end ticks from (x0,y) to (x1,y), k 0..1 grows */
function measure(x0, x1, y, k, col = '#FBF6E8') {
  if (k <= 0) return; const xe = lerp(x0, x1, k); stroke([[x0, y], [xe, y]], col, 8); stroke([[x0, y - 24], [x0, y + 24]], col, 8); if (k > 0.98) stroke([[x1, y - 24], [x1, y + 24]], col, 8);
}

// ═══════════════ COLOSSAL SQUID chapter 3: EYES AND HOOKS ═══════════════
const eyeAt = (x, y, s, flip) => [x + (flip ? 52 : -52) * s, y - 8 * s];

export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push({ cam: [960, 540], zoom: 0.04, ...o }), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const tag = (lt, a, d = 0.3) => (lt > a ? eob(seg(lt, a, a + d)) : 0);
  const RED = '#C8322B', CREAM = '#FBF6E8', NAVY = '#2F4A6A';

  // ── line 0 · chapter card over squid and whale, then push in on the head
  { const st = 0, wh = Math.max(Wd('whale', 0), 2.3), cl = Wd('closely', 0) - 0.08;
    const scene = (lt, t, whA) => { deepSea(t, { light: 0.6, lx: 900 }); ctx.save(); ctx.globalAlpha = whA; spermWhale(1560, 450, 0.5, { t }); ctx.restore(); colossalSquid(900, 700, 0.8, { t, tent: 0.4, glow: 0.5 }); };
    add({ id: 'S01', at: st, note: 'chapter card CHAPTER 3 / EYES AND HOOKS fully visible at frame 0 over a big red squid with a huge pale blue eye, a sperm whale dim behind; then tags A HUGE SQUID, A WHALE THAT EATS IT', draw(lt, d, t) {
      scene(lt, t, 0.45 + 0.4 * seg(lt, wh - 0.3, wh + 0.4)); vignette(0.6);
      chapterCard('CHAPTER 3', 'EYES AND HOOKS', 1 - seg(lt, 1.8, 2.1));
      label('A HUGE SQUID', 470, 190, tag(lt, 2.1), -0.04, 52, CREAM, RED); label('A WHALE THAT EATS IT', 1470, 190, tag(lt, Math.max(wh, 2.4)), 0.03, 48, CREAM, NAVY);
    } });
    cue(0, 'thud', { gain: 0.5 }); cue(2.1, 'pop', { gain: 0.35 });
    add({ id: 'S02', at: cl, note: 'camera pushes in on the squid head and the huge eye; tag LOOK CLOSELY', draw(lt, d, t) {
      const z = lerp(1, 2.3, eio(seg(lt, 0, d))); const [ex, ey] = eyeAt(900, 700, 0.8, false);
      ctx.save(); view(lerp(960, ex, seg(z, 1, 2.3)), lerp(540, ey, seg(z, 1, 2.3)), z); scene(lt, t, 0.8 * (1 - seg(lt, 0, 1.2))); ctx.restore(); vignette(0.6);
      label('LOOK CLOSELY', 960, 170, tag(lt, 0.2), -0.03, 60, CREAM, RED);
    } });
    cue(cl, 'whoosh', { gain: 0.5 }); }

  // ── line 1 · biggest eyes of any living animal
  { const st = cut(1), gi = Wd('giant', 1) - st, bi = Wd('biggest', 1) - st;
    add({ id: 'S03', at: st, zoom: 0.03, note: 'huge close-up of the squid eye, pale blue and as big as the screen middle, red skin around it; tags COLOSSAL SQUID, GIANT SQUID, BIGGEST EYES OF ANY LIVING ANIMAL', draw(lt, d, t) {
      const [ex, ey] = eyeAt(900, 600, 1.2, false), z = lerp(2.5, 3.0, seg(lt, 0, d));
      ctx.save(); view(ex, ey, z); deepSea(t, { floor: null, light: 0.5, lx: 900 }); colossalSquid(900, 600, 1.2, { t, tent: 0.3 }); ctx.restore(); vignette(0.5);
      label('COLOSSAL SQUID', 460, 160, tag(lt, 0.2), -0.04, 48, CREAM, RED); label('GIANT SQUID', 1470, 160, tag(lt, gi), 0.04, 48, CREAM, NAVY);
      label('BIGGEST EYES OF ANY LIVING ANIMAL', 960, 815, tag(lt, bi), -0.02, 50, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + bi, 'pop', { gain: 0.45 }); }

  // ── line 2 · 27 cm across, soccer ball
  { const st = cut(2), tw0 = Wd('twenty', 2) - 0.6, tw = Wd('twenty', 2) - st, yr = Wd('2007', 2) - st, so = Wd('soccer', 2) - 0.5, sz = Wd('size', 2) - 0.08;
    add({ id: 'S03b', at: st, note: 'wide on the whole squid, 2007 specimen tag, camera pushing toward the eye', draw(lt, d, t) {
      const z = lerp(1, 1.5, eio(seg(lt, 0, d))), [ex, ey] = eyeAt(900, 640, 0.9, false); ctx.save(); view(lerp(960, ex, seg(z, 1, 1.5)), lerp(540, ey, seg(z, 1, 1.5)), z); deepSea(t, { floor: null, light: 0.6, lx: 900 }); colossalSquid(900, 640, 0.9, { t, tent: 0.35 }); ctx.restore(); vignette(0.5);
      label('2007 COLOSSAL SQUID', 960, 170, tag(lt, 0.15), -0.03, 56, CREAM, NAVY);
    } });
    cue(st, 'whoosh', { gain: 0.4 });
    add({ id: 'S04', at: tw0, note: 'the eye alone in a spotlight; a measuring line grows across it; tags 2007 SPECIMEN and 27 CM ACROSS', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 1, lx: 960 }); const r = 260 + Math.sin(t * 0.8) * 4;
      const zz = 1 + 0.08 * seg(lt, 0, d); ctx.save(); view(960, 560, zz); sqEye(960, 560, r); ctx.restore(); measure(960 - r, 960 + r, 215, eio(seg(lt, tw - tw0 - 0.1 + 0.6, tw - tw0 + 1.5)));
      label('27 CM ACROSS', 960, 120, tag(lt, tw - tw0 + 0.9), -0.03, 64, CREAM, RED);
    } });
    cue(tw0, 'whoosh', { gain: 0.4 }); cue(tw + 0.9, 'pop', { gain: 0.5 });
    add({ id: 'S05', at: sz, note: 'the eye slides left, a paper soccer ball rolls in next to it at the same size; tag SOCCER BALL', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 1, lx: 960 }); const k = eio(seg(lt, 0, 0.6)), r = 260;
      sqEye(lerp(960, 600, k), 520, r); const bx = lerp(2300, 1320, eo(seg(lt, 0, 0.9)));
      soccerBall(bx, 520, 235);
      measure(600 - r, 600 + r, 215, 1); label('27 CM ACROSS', 600, 120, 1, -0.03, 54, CREAM, RED);
      label('SOCCER BALL', 1320, 810, tag(lt, Math.max(0.9, Wd('soccer', 2) - sz)), 0.03, 56, CREAM, '#3A2A1E');
    } });
    cue(sz, 'slide', { dur: 0.9, gain: 0.35 }); cue(Wd('soccer', 2), 'pop', { gain: 0.45 }); }

  // ── line 3 · the caveat: a year in a freezer, shrank, living eye maybe bigger
  { const st = cut(3), fr = Wd('freezer', 3) - st, pa = Wd('papa', 3) - st, sh = Wd('shrank', 3) - 0.08, bg = Wd('bigger', 3) - sh;
    add({ id: 'S06', at: st, note: 'cold icy blue picture: the eye frozen inside a block of ice with frost flakes; tags ONE CAVEAT, OVER A YEAR IN A FREEZER, TE PAPA NEW ZEALAND', draw(lt, d, t) {
      iceBg(t); ctx.save(); view(960, 500, lerp(1, 1.25, eio(seg(lt, 0, d)))); iceBlock(960, 500, 760, 560); ctx.save(); ctx.globalAlpha = 0.85; sqEye(960, 500, 200); ctx.restore();
      frostFlake(300, 330, 60, t * 0.2); frostFlake(1620, 700, 74, -t * 0.15); frostFlake(1560, 250, 44, t * 0.25); frostFlake(380, 720, 52, t * 0.1); ctx.restore();
      label('ONE CAVEAT', 960, 130, tag(lt, 0.1), -0.03, 60, CREAM, RED); label('OVER A YEAR IN A FREEZER', 960, 815, tag(lt, fr - 0.3), 0.02, 52, '#E8F4FA', NAVY);
      label('TE PAPA, NEW ZEALAND', 1500, 330, tag(lt, pa), 0.04, 42, CREAM, '#3A2A1E');
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + fr - 0.3, 'pop', { gain: 0.4 }); cue(st + pa, 'tock', { gain: 0.4 });
    add({ id: 'S07', at: sh, note: 'back in dark water: the eye shrinks a little inside a dashed outline of its old size; then the outline grows bigger than the eye; tags SHRANK A LITTLE, LIVING EYE MAYBE BIGGER', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.8, lx: 960 }); const r0 = 250, rs = lerp(250, 222, eio(seg(lt, 0, 0.7))), big = eio(seg(lt, bg - 0.1, bg + 0.9)), rg = lerp(r0, 300, big);
      sqEye(960, 540, rs);
      ctx.save(); ctx.setLineDash([22, 16]); ctx.lineDashOffset = -t * 20; ctx.strokeStyle = CREAM; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(960, 540, rg * 1.1, 0, TAU); ctx.stroke(); ctx.restore();
      label('SHRANK A LITTLE', 480, 200, tag(lt, 0.1), -0.04, 52, CREAM, NAVY); label('LIVING EYE: MAYBE BIGGER', 1440, 200, tag(lt, bg - 0.1), 0.03, 50, CREAM, RED);
    } });
    cue(sh, 'whoosh', { gain: 0.35 }); cue(sh + bg - 0.1, 'pop', { gain: 0.5 }); }

  // ── line 4 · why would it need an eye that big
  { const st = cut(4), bi = Wd('big', 4) - st;
    add({ id: 'S08', at: st, zoom: 0.03, note: 'big eye slowly growing on screen, a huge paper question mark; tag WHY SO BIG', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.9, lx: 960 }); const r = lerp(270, 340, eio(seg(lt, 0, d)));
      sqEye(960, 540, r); label('?', 1560, 380, eob(seg(lt, 0.3, 0.7)), 0.08, 220, CREAM, RED); label('WHY SO BIG?', 400, 190, tag(lt, bi - 0.3), -0.04, 56, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + bi, 'boing', { gain: 0.3 }); }

  // ── line 5 · almost no light, 2012 study in Current Biology
  { const st = cut(5), li = Wd('light', 5) - st, yr = Wd('2012', 5) - 0.08, id = Wd('idea', 5) - yr;
    add({ id: 'S09', at: st, zoom: 0.03, note: 'camera pulls back: the squid small in nearly black water, darkness closing in; tag ALMOST NO LIGHT', draw(lt, d, t) {
      const z = lerp(1.5, 1, eio(seg(lt, 0, d))); ctx.save(); view(960, 560, z); deepSea(t, { floor: null, light: 0 }); colossalSquid(1000, 560, 0.55, { t, tent: 0.3 }); ctx.restore();
      ctx.fillStyle = `rgba(1,4,9,${0.55 * seg(lt, li - 0.4, li + 1.2)})`; ctx.fillRect(-300, -300, W + 600, H + 600); vignette(0.8);
      label('ALMOST NO LIGHT', 960, 170, tag(lt, li - 0.1), -0.03, 60, CREAM, '#1E2A3A');
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + li, 'thud', { gain: 0.35 });
    add({ id: 'S10', at: yr, note: 'a paper journal cover CURRENT BIOLOGY 2012 swings in beside the dim squid; tags A 2012 STUDY, AN IDEA', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.2, lx: 600 }); colossalSquid(640, 640, 0.55, { t, tent: 0.3 }); ctx.fillStyle = 'rgba(1,4,9,0.35)'; ctx.fillRect(-300, -300, W + 600, H + 600);
      journalCard(1400, 520, 1, lerp(0.5, 0.06, eob(seg(lt, 0, 0.5))), eob(seg(lt, 0, 0.4)));
      label('A 2012 STUDY', 560, 170, tag(lt, 0.2), -0.04, 56, CREAM, RED); label('AN IDEA', 560, 290, tag(lt, id), 0.03, 52, CREAM, NAVY);
    } });
    cue(yr, 'slam', { gain: 0.45 }); cue(yr + id, 'pop', { gain: 0.4 }); }

  // ── lines 6 to 9 · the whale alarm
  const watch = (t, whaleX, glowK, whA = 1) => {
    deepSea(t, { floor: null, light: 0.35, lx: 800 });
    ctx.save(); ctx.globalAlpha = whA; spermWhale(whaleX, 500, 0.45, { t }); ctx.restore(); glowDots(whaleX - 100, 500, 330, 130, t, glowK, 90);
    colossalSquid(700, 500, 0.5, { t, tent: 0.3, flip: true });
  };
  { const st = cut(6), sp = Wd('spot', 6) - st, wh = Wd('whale', 6) - 0.08, gl = Wd('glowing', 6) - st;
    add({ id: 'S11', at: st, note: 'squid on the left facing right; the researchers think a big eye lets it spot a whale: a sperm whale silhouette appears far on the right; tag SPOT A SPERM WHALE COMING', draw(lt, d, t) {
      watch(t, lerp(2400, 1700, eo(seg(lt, sp - 0.3, d))), 0, 0.35 + 0.35 * seg(lt, sp, sp + 1)); vignette(0.55);
      label('A BIG EYE', 480, 170, tag(lt, 0.15), -0.04, 52, CREAM, RED); label('SPOT A SPERM WHALE COMING', 1240, 800, tag(lt, sp + 0.2), 0.02, 46, CREAM, NAVY);
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + sp, 'pop', { gain: 0.35 });
    add({ id: 'S12', at: wh, note: 'the whale swims and blue-green glowing sea life lights up around it; tags STIRS UP GLOWING SEA LIFE', draw(lt, d, t) {
      watch(t, 1700, eio(seg(lt, gl - (wh - st) - 0.4, gl - (wh - st) + 1.6)) , 0.8); vignette(0.7);
      label('THE WHALE STIRS UP', 1300, 180, tag(lt, 0.1), 0.03, 46, CREAM, NAVY); label('GLOWING SEA LIFE', 1300, 290, tag(lt, gl - (wh - st)), -0.03, 56, '#102A30', '#7FF0DA');
    } });
    cue(wh, 'sparkle', { dur: 1.5, gain: 0.3 }); }

  { const st = cut(7), co = Wd('conditions', 7) - st, ca = Wd('calculated', 7) - st, gl = Wd('glow', 7) - st, hu = Wd('hundred', 7) - st;
    add({ id: 'S13', at: st, note: 'same scene, glow lit: a measuring line grows from the squid eye to the glowing whale; tag 120 M; THEY CALCULATED', draw(lt, d, t) {
      const e = eyeAt(700, 500, 0.5, true), zk = eio(seg(lt, 0, d)); ctx.save(); view(lerp(960, 1000, zk), 540, lerp(1, 1.3, zk)); watch(t, 1700, 1, 0.8); measure(e[0], 1420, 710, eio(seg(lt, hu - 0.3, hu + 1.0))); ctx.restore(); vignette(0.55);
      label('THEY CALCULATED', 480, 170, tag(lt, ca - 0.2), -0.04, 52, CREAM, NAVY); label('120 M', (e[0] + 1420) / 2, 800, tag(lt, hu + 0.6), 0.02, 80, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + hu + 0.6, 'pop', { gain: 0.5 }); }

  { const st = cut(8), da = Wd('dark', 8) - st, su = Wd('sun', 8) - st, sp = Wd('spotting', 8) - st;
    add({ id: 'S14', at: st, zoom: 0.03, note: 'slow push in on the squid eye in the dark; no sun tag; the whale glow far off grows; tags NO SUN, SPOTTING A WHALE', draw(lt, d, t) {
      const e = eyeAt(700, 500, 0.5, true), z = lerp(1, 1.9, eio(seg(lt, 0, d))), k = seg(z, 1, 1.9);
      ctx.save(); view(lerp(960, 900, k), 500, z); watch(t, lerp(1900, 1650, seg(lt, 0, d)), 0.8 + 0.2 * seg(lt, sp, d), 0.6); ctx.restore(); vignette(0.6);
      label('IN THE DARK', 480, 170, tag(lt, da - 0.1), -0.04, 52, CREAM, '#1E2A3A'); label('NO SUN', 480, 290, tag(lt, su), 0.03, 56, CREAM, '#1E2A3A'); label('SPOTTING A WHALE COMING', 1380, 810, tag(lt, sp), -0.02, 48, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + sp, 'pop', { gain: 0.4 }); }

  { const st = cut(9), al = Wd('alarm', 9) - st;
    add({ id: 'S15', at: st, zoom: 0.03, note: 'huge eye with red alarm rings pulsing out of it; tags THE EYE MAY BE, A WHALE ALARM', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.6, lx: 960 }); sqEye(960, 540, 300);
      const on = seg(lt, al - 0.2, al); for (let i = 0; i < 3; i++) { const p = ((t * 0.9 + i / 3) % 1); ctx.save(); ctx.globalAlpha = on * (1 - p) * 0.9; ctx.strokeStyle = '#E4572E'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(960, 540, 340 + p * 330, 0, TAU); ctx.stroke(); ctx.restore(); }
      label('THE EYE MAY BE A', 520, 170, tag(lt, 0.1), -0.04, 50, CREAM, NAVY); label('WHALE ALARM', 1400, 800, tag(lt, al - 0.2), 0.03, 72, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + al - 0.1, 'alarm', { gain: 0.35 }); }

  // ── line 10 · arms with hooks, tentacles with rotating hooks, 360 degrees
  { const st = cut(10), ar = Wd('arms', 10) - 0.08, te = Wd('tentacles', 10) - 0.08, ro = Wd('rotate', 10) - 0.08, th = Wd('three', 10) - ro, ro0 = ro;
    add({ id: 'S16', at: st, note: 'whole squid in the dark, camera glides from the huge eye along to the arms; tag NOW THE OTHER END', draw(lt, d, t) {
      const k = eio(seg(lt, 0, d)), z = lerp(1.1, 1.5, k); ctx.save(); view(lerp(1100, 900, k), 580, z); deepSea(t, { floor: null, light: 0.6, lx: 900 }); colossalSquid(1300, 580, 0.9, { t, tent: 0.5 }); ctx.restore(); vignette(0.6);
      label('NOW THE OTHER END', 960, 170, tag(lt, 0.2), -0.03, 58, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.4 });
    add({ id: 'S17', at: ar, note: 'squid on the left; a magnifier lens shows an arm up close with its row of suckers each with a small hook; tag ARMS: HOOKS', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 700 }); colossalSquid(780, 640, 0.7, { t, tent: 0.4 });
      const k = eob(seg(lt, 0.1, 0.5)); if (k > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, k); stroke([[610, 690], [1250, 470]], 'rgba(251,246,232,0.8)', 5); stroke([[610, 690], [1330, 650]], 'rgba(251,246,232,0.8)', 5); ctx.restore(); }
      armLens(1500, 500, 250, t, k); label('ARMS CARRY HOOKS', 1500, 150, tag(lt, 0.4), 0.03, 54, CREAM, RED);
    } });
    cue(ar, 'pop', { gain: 0.5 });
    add({ id: 'S18', at: te, note: 'the two long tentacles shoot out far to the left; tag TWO LONG TENTACLES', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 900 }); colossalSquid(1330, 560, 0.7, { t, tent: lerp(0.2, 1, eo(seg(lt, 0, 1.4))) }); vignette(0.5);
      label('TWO LONG TENTACLES', 960, 170, tag(lt, 0.15), -0.03, 58, CREAM, RED);
    } });
    cue(te, 'zip', { gain: 0.4 });
    add({ id: 'S19', at: ro, note: 'close-up of the tentacle club, its hooks turning right round; a circular arrow draws a full turn around one big hook; tags HOOKS THAT ROTATE, 360 DEGREES', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 700 }); const sp = lt * 2.6;
      bigClub(900, 540, 1, t, sp);
      const hx = 1500, hy = 690; turnHook(hx, hy, 60, sp, '#2A1A16'); turnArrow(hx, hy, 150, eio(seg(lt, th - 0.4, th + 1.6)), CREAM, 12);
      label('HOOKS THAT ROTATE', 960, 150, tag(lt, 0.2), -0.03, 56, CREAM, RED); label('360 DEGREES', 1500, 390, tag(lt, th), 0.04, 62, CREAM, RED);
    } });
    cue(ro, 'whoosh', { gain: 0.4 }); cue(ro + th, 'pop', { gain: 0.5 }); for (let i = 0; i < 4; i++) cue(ro + 0.4 + i * 0.7, 'tock', { gain: 0.2 }); }

  // ── line 11 · tentacles are about two meters long
  { const st = cut(11), tw = Wd('two', 11) - st;
    add({ id: 'S20', at: st, note: 'whole squid with tentacles fully out; a measuring bracket along a tentacle grows; tag 2 M', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 900 }); colossalSquid(1330, 480, 0.7, { t, tent: 1 }); vignette(0.5);
      const e = 1330 - 70 * 0.7 - 20, x1 = 1330 - 70 * 0.7 - 895 * 0.7; measure(e, lerp(e, x1, 1), 820, eio(seg(lt, tw - 0.3, tw + 0.9)));
      label('2 M', (e + x1) / 2, 730, tag(lt, tw + 0.4), -0.03, 80, CREAM, RED); label('TENTACLES', 1480, 170, tag(lt, 0.1), 0.03, 52, CREAM, NAVY);
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + tw + 0.4, 'pop', { gain: 0.5 }); }

  // ── line 12 · enormous eyes in the dark, rotating hooks
  { const st = cut(12), en = Wd('enormous', 12) - st, ro = Wd('rotating', 12) - st;
    add({ id: 'S21', at: st, note: 'one slow camera move: on the huge eye (ENORMOUS EYES, IN THE DARK) then swinging along the tentacle to the hooks (ROTATING HOOKS)', draw(lt, d, t) {
      const x = 1250, y = 560, s = 0.8, tent = 0.6, Lt = lerp(300, 820, tent), e = eyeAt(x, y, s, false), cx = x + s * (-70 - (Lt + 75) * Math.cos(0.14)), cy = y + s * (-20 - (Lt + 75) * Math.sin(0.14));
      const k = eio(seg(lt, ro - 0.4, ro + 0.9)), z = lerp(2.0, 1.6, k);
      ctx.save(); view(lerp(e[0], cx, k), lerp(e[1], cy, k), z); deepSea(t, { floor: null, light: 0.4, lx: 900 }); colossalSquid(x, y, s, { t, tent, glow: 0.6 }); ctx.restore(); vignette(0.7);
      label('ENORMOUS EYES', 480, 170, tag(lt, en) * (1 - seg(lt, ro - 0.2, ro)), -0.04, 56, CREAM, RED); label('ROTATING HOOKS', 480, 170, tag(lt, ro), -0.04, 56, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + en, 'pop', { gain: 0.35 }); cue(st + ro - 0.2, 'slide', { dur: 1.0, gain: 0.3 }); }

  // ── line 13 · until recently only seen dead
  { const st = cut(13), un = Wd('until', 13) - st, de = Wd('dead', 13) - st;
    add({ id: 'S22', at: st, note: 'squid hanging limp on a fishing line beside a toothfish, grey and dull; tags UNTIL RECENTLY, ONLY SEEN DEAD', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.4, lx: 1100 }); stroke([[1100, -40], [1050, 330]], '#C9CCCA', 4); stroke([[1500, -40], [1480, 250]], '#C9CCCA', 4);
      toothfish(1480, 360, 0.55, { t, rot: 1.2 });
      colossalSquid(1060, 460, 0.55, { t: t * 0.3, rot: -1.3, tent: 0.15, arms: 0.7 });
      ctx.fillStyle = `rgba(30,40,50,${0.3 * eio(seg(lt, de - 0.6, de + 0.4))})`; ctx.fillRect(-300, -300, W + 600, H + 600); vignette(0.6);
      label('UNTIL RECENTLY', 460, 190, tag(lt, un), -0.04, 54, CREAM, NAVY); label('ONLY SEEN DEAD', 460, 320, tag(lt, de), 0.03, 64, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + de, 'thud', { gain: 0.5 }); }

  // ── line 14 · had anyone seen one alive
  { const st = cut(14), qu = Wd('question', 14) - st, al = Wd('alive', 14) - st, sw = Wd('swimming', 14) - st, wo = Wd('world', 14) - st;
    add({ id: 'S23', at: st, note: 'dark water, a big question mark; a dark squid silhouette glides free across; tags SEEN ALIVE, SWIMMING FREE, IN ITS OWN WORLD', draw(lt, d, t) {
      const zo = lerp(1.35, 1, eio(seg(lt, 0, d))); ctx.save(); view(1100, 560, zo); deepSea(t, { floor: null, light: 0 }); ctx.globalAlpha = 0.5 + 0.2 * seg(lt, sw - 0.5, sw + 0.8); colossalSquid(lerp(1650, 950, seg(lt, sw - 0.5, d)), 600, 0.65, { t, tent: 0.3 }); ctx.restore(); vignette(0.7);
      label('?', 520, 520, eob(seg(lt, 0.1, 0.5)), -0.08, 260, CREAM, RED); label('SEEN ALIVE?', 1200, 170, tag(lt, al - 0.2), 0.03, 66, CREAM, RED);
      label('SWIMMING FREE', 1200, 815, tag(lt, sw), -0.02, 50, CREAM, NAVY); label('IN ITS OWN WORLD', 1200, 280, tag(lt, wo), 0.03, 46, CREAM, '#1E2A3A');
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + al - 0.2, 'boing', { gain: 0.3 }); cue(st + sw, 'slide', { dur: 2.0, gain: 0.25 }); }

  return { shots: S, cues: CUES };
}
