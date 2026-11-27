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

// ═══ chapter 4 own drawings (not in the kit) ═══
const C4_CREAM = '#FBF6E8', C4_RED = '#C8322B';
function c4Veil(x, y, r0, r1, a, col = '3,8,16') { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a})`); ctx.fillStyle = g; ctx.fillRect(-800, -800, W + 1600, H + 1600); }
/** camera viewfinder frame with a red LIVE dot, drawn over the whole picture */
function viewfinder(t, txt = 'LIVE') {
  const m = 46, l = 90; ctx.save(); ctx.strokeStyle = 'rgba(251,246,232,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const [cx, cy, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - 190, 1, -1], [W - m, H - 190, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx, cy + sy * l); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * l, cy); ctx.stroke(); }
  if (Math.sin(t * 5) > -0.4) { ctx.fillStyle = '#E23B31'; ctx.beginPath(); ctx.arc(W - 250, 96, 15, 0, TAU); ctx.fill(); }
  ctx.fillStyle = C4_CREAM; ctx.font = `700 40px ${SERIF}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W - 222, 98); ctx.restore();
}
/** overcast sky and cold sea at the surface; horizon at hy */
function c4Surface(t, hy = 560, o = {}) {
  const g = ctx.createLinearGradient(0, -800, 0, hy); g.addColorStop(0, '#6F8DA6'); g.addColorStop(1, '#C3D5DF'); ctx.fillStyle = g; ctx.fillRect(-800, -800, W + 1600, hy + 800);
  if (!PAT) PAT = paperPattern(); ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = PAT; ctx.fillRect(-800, -800, W + 1600, hy + 800); ctx.restore();
  for (let i = 0; i < 4; i++) { const cx = ((R2(i + 60) * 2400 + t * 6 * (1 + i * 0.3)) % 2400) - 240; piece(ELL(cx, 90 + i * 85 + R2(i) * 40, 260 + R2(i + 1) * 120, 34 + R2(i) * 16), 'rgba(235,242,246,0.7)', 0.1, false); }
  const bot = o.bottom ?? H + 800; const sg = ctx.createLinearGradient(0, hy, 0, bot); sg.addColorStop(0, '#2C5F83'); sg.addColorStop(0.25, '#143B5A'); sg.addColorStop(1, '#030810'); ctx.fillStyle = sg; ctx.fillRect(-800, hy, W + 1600, bot - hy);
  for (let r = 0; r < 5; r++) { const pts = []; for (let q = 0; q <= 40; q++) pts.push([-100 + q * 55, hy + 14 + r * 30 + Math.sin(q * 0.7 + t * 1.2 + r * 2) * (4 + r * 1.5)]); stroke(pts, `rgba(200,225,240,${0.28 - r * 0.04})`, 3); }
}
/** a volcanic island group on the horizon: dark rock with snow */
function c4Islands(x, hy, s, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, hy); ctx.scale(s, s);
  const sp = [[-520, 0, 260, 120], [-300, 0, 330, 220], [40, 0, 400, 170], [380, 0, 300, 110], [640, 0, 240, 150]];
  for (const [cx, , w, h] of sp) { const p = POLY([[cx - w, 6], [cx - w * 0.55, -h * 0.55], [cx - w * 0.2, -h * 0.8], [cx, -h], [cx + w * 0.25, -h * 0.72], [cx + w * 0.6, -h * 0.4], [cx + w, 6]]); piece(p, '#59646C', 0.5); piece(POLY([[cx - w * 0.2, -h * 0.8], [cx, -h], [cx + w * 0.25, -h * 0.72], [cx + w * 0.1, -h * 0.6], [cx - w * 0.05, -h * 0.66], [cx - w * 0.14, -h * 0.58]]), '#F1F5F6', 0.2, false); }
  ctx.restore();
}
/** paper person (head and shoulders) seen from behind or front, looking toward the right when dir = 1 */
function c4Person(x, y, s, col = '#1B2836', o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale((o.dir ?? 1) * s, s);
  const b = new Path2D(); b.moveTo(-120, 220); b.bezierCurveTo(-120, 70, -80, 40, -34, 30); b.lineTo(34, 30); b.bezierCurveTo(80, 40, 120, 70, 120, 220); b.closePath(); piece(b, col, 0.7);
  piece(RR(-17, -4, 34, 40, 10), mixHex(col, '#E8C9A8', 0.35), 0.2, false); piece(ELL(0, -34, 40, 46), mixHex(col, '#E8C9A8', 0.55), 0.7);
  piece(o.hood ? ELL(-4, -50, 46, 38) : POLY([[-40, -44], [-34, -84], [0, -96], [36, -80], [40, -44], [10, -60], [-20, -56]]), o.hair || '#2A1E18', 0.4, false);
  if (o.rim) { ctx.save(); ctx.globalAlpha = 0.5; stroke([[40, -30], [34, 0]], o.rim, 5); stroke([[118, 120], [108, 60], [80, 40]], o.rim, 4); ctx.restore(); }
  ctx.restore();
}
/** monitor with a rounded frame; fn draws the screen contents clipped to (x, y, w, h) */
function c4Monitor(x, y, w, h, fn) {
  piece(RR(x - 18, y - 18, w + 36, h + 36, 18), '#10161E', 0.8); ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.clip(); fn(); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.35; const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(0.3, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
}
/** ruler, horizontal, from x to x+len, top at y */
function c4Ruler(x, y, len, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); piece(RR(0, 0, len, 76, 8), '#F2C230', 0.9);
  for (let i = 0; i <= 30; i++) { const h = i % 5 === 0 ? 34 : (i % 1 === 0 ? 18 : 10); stroke([[10 + i * (len - 20) / 30, 0], [10 + i * (len - 20) / 30, h]], '#5A4410', i % 5 === 0 ? 4 : 2.5); }
  ctx.restore();
}
/** a close view of an arm section with suckers and small hooks. Spans about 900 px at s = 1, origin centre. */
function c4ArmHooks(x, y, s, t, col = '#D8E6EA') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const b = new Path2D(); b.moveTo(-460, -70); b.bezierCurveTo(-200, -110, 200, -90, 470, -40); b.lineTo(470, 60); b.bezierCurveTo(200, 120, -200, 140, -460, 90); b.closePath();
  piece(b, col, 0.8); ctx.save(); ctx.clip(b); for (let i = 0; i < 40; i++) piece(CIR(-440 + R2(i) * 900, -60 + R2(i + 1) * 140, 3 + R2(i + 2) * 4), i % 3 ? 'rgba(235,130,60,0.75)' : 'rgba(210,70,50,0.75)', 0, false); ctx.restore();
  for (let i = 0; i < 6; i++) {
    const cx = -370 + i * 150, cy = 36 + Math.sin(i * 0.5) * 8, r = 44;
    piece(CIR(cx, cy, r), '#F4FAFB', 0.4); piece(CIR(cx, cy, r * 0.62), '#B9CED6', 0, false);
    const hk = new Path2D(); hk.moveTo(cx - 16, cy + 18); hk.quadraticCurveTo(cx - 6, cy - 36, cx + 24, cy - 30); hk.quadraticCurveTo(cx + 4, cy - 14, cx + 8, cy + 18); hk.closePath(); piece(hk, '#2A1A16', 0.3, false);
  }
  ctx.restore();
}
/** circular magnifier: draws fn inside a clipped circle with a cream rim */
function c4Lens(x, y, r, fn) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); ctx.fillStyle = '#0A1626'; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); fn(); ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(40,25,15,0.5)'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, TAU); ctx.stroke(); ctx.strokeStyle = C4_CREAM; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
}
/** magnified skin patch with chromatophore dots; k 0 = see through (dots tiny), 1 = coloured (dots wide open) */
function c4Skin(x, y, r, k, t) {
  c4Lens(x, y, r, () => {
    ctx.fillStyle = mixHex('#2A4458', '#7A3A32', k * 0.6); ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    for (let i = 0; i < 46; i++) { const px = x + (R2(i + 90) * 2 - 1) * r * 0.95, py = y + (R2(i + 91) * 2 - 1) * r * 0.95, rr = (4 + R2(i + 92) * 5) * 0.5 + k * (20 + R2(i + 93) * 12) * (0.9 + 0.1 * Math.sin(t * 3 + i));
      ctx.fillStyle = i % 3 ? `rgba(240,140,60,${0.55 + 0.4 * k})` : `rgba(205,60,48,${0.55 + 0.4 * k})`; ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(70,16,16,0.4)'; ctx.beginPath(); ctx.arc(px, py, rr * 0.35, 0, TAU); ctx.fill(); }
  });
}
/** fishing line with a limp squid and a toothfish hanging from it */
function c4Question(x, y, s, a = 1, rot = 0) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.font = `700 150px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(10,20,30,0.7)'; ctx.strokeText('?', 0, 0); ctx.fillStyle = C4_CREAM; ctx.fillText('?', 0, 0); ctx.restore(); }
/** small glint sparkle */
function c4Glint(x, y, s, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#F4FBFF'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(4, -4, 30, 0); ctx.quadraticCurveTo(4, 4, 0, 30); ctx.quadraticCurveTo(-4, 4, -30, 0); ctx.quadraticCurveTo(-4, -4, 0, -30); ctx.fill(); ctx.restore(); }

// ═══════════════ COLOSSAL SQUID chapter 4: THE FIRST LIVE FOOTAGE (16:9 shots) ═══════════════
export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push({ cam: [960, 540], zoom: 0.04, ...o }), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const tg = (lt, a, d = 0.3) => (lt > a ? eob(seg(lt, a, a + d)) : 0);
  const RED = C4_RED, CREAM = C4_CREAM, BLUE = '#2F4A6A', DARK = '#2A2E36';
  const W_ = (w, i, st) => Wd(w, i) - st;   // word time relative to the shot start

  // ── line 0 · Remember, almost every colossal squid ever studied was caught dead or dying, on a fishing line or inside a whale
  { const st = 0, fi = W_('fishing', 0, 0) - 0.08, ins = W_('inside', 0, 0) - 0.08;
    add({ id: 'S01', at: 0, note: 'chapter card CHAPTER 4 / FIRST LIVE FOOTAGE fully visible at frame 0 over a limp, dull red adult colossal squid hanging head down on a fishing line with a toothfish; tag ALMOST ALL CAUGHT DEAD OR DYING already up', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.8, lx: 960 });
      const sw = Math.sin(t * 0.9) * 0.05;
      stroke([[960, -100], [960 + sw * 600, 150]], 'rgba(220,225,230,0.8)', 5);
      ctx.save(); ctx.translate(960, 150); ctx.rotate(sw); stroke([[0, 0], [-20, 120]], 'rgba(220,225,230,0.8)', 4); ctx.restore();
      colossalSquid(1000, 560, 0.78, { t, rot: Math.PI / 2 + 0.15 + sw, arms: 0.45, tent: 0.1, juv: 0 });
      c4Veil(960, 540, 300, 1100, 0.55);
      chapterCard('CHAPTER 4', 'FIRST LIVE FOOTAGE', 1 - seg(lt, 1.7, 1.95));
      label('ALMOST ALL CAUGHT DEAD OR DYING', 960, 800, 1, -0.02, 54, CREAM, RED);
    } });
    cue(0, 'thud', { gain: 0.5 }); cue(0.1, 'bubbles', { dur: 2, gain: 0.2 });
    add({ id: 'S02', at: fi, note: 'a longline hauled up from the dark: toothfish on a hook with a pale-red squid arm wrapped round it; tag ON A FISHING LINE', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 960 }); const up = eo(seg(lt, 0, d)); const y = lerp(700, 420, up);
      stroke([[960, -100], [960, y - 190]], 'rgba(220,225,230,0.8)', 5);
      toothfish(960, y, 0.9, { t, rot: Math.PI / 2 * 0.2 + Math.sin(t * 1.5) * 0.05 });
      ctx.save(); ctx.translate(900, y - 40); ctx.rotate(0.2); sqLimb(360, 60, 20, 10, t, 0, '#8E3238', { droop: 40 }); ctx.restore();
      label('ON A FISHING LINE', 1400, 300, tg(lt, 0.1), 0.03, 60, CREAM, RED);
    } });
    cue(fi, 'whoosh'); cue(fi + 0.1, 'pop', { gain: 0.4 });
    add({ id: 'S03', at: ins, note: 'a sperm whale seen side-on in the dark; a lens opens on its belly showing a squid beak and two arm pieces inside; tag INSIDE A WHALE', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.4, lx: 700 }); const k = eob(seg(lt, 0.15, 0.55));
      spermWhale(lerp(1200, 900, eo(seg(lt, 0, d))), 400, 0.85, { t, flip: false });
      if (k > 0) { ctx.save(); ctx.translate(1180, 660); ctx.scale(k, k); c4Lens(0, 0, 210, () => { ctx.fillStyle = '#7A4A44'; ctx.fillRect(-250, -250, 500, 500); sqBeak(-20, 10, 1.7, -0.2); ctx.save(); ctx.translate(120, 120); ctx.rotate(-0.5); sqLimb(190, 36, 12, 6, t, 1, '#B9CED6'); ctx.restore(); }); ctx.restore(); }
      label('INSIDE A WHALE', 560, 780, tg(lt, 0.15), -0.03, 60, CREAM, RED);
    } });
    cue(ins, 'whoosh'); cue(ins + 0.25, 'pop', { gain: 0.5 }); }

  // ── line 1 · On the ninth of March, 2025, Falkor too was working near the South Sandwich Islands in the South Atlantic
  { const st = cut(1), ni = W_('ninth', 1, st), wo = W_('working', 1, st), at = W_('atlantic', 1, st) - 0.2, wo2 = Wd('working', 1) - 0.08, at2 = Wd('atlantic', 1) - 0.3;
    add({ id: 'S04', at: st, note: 'overcast Antarctic sea, white research ship rocking on the waves; tags 9 MARCH 2025 and RESEARCH SHIP FALKOR TOO', draw(lt, d, t) {
      const z = lerp(1.12, 1, eio(seg(lt, 0, d))); ctx.save(); view(960, 560, z); c4Surface(t, 600); researchShip(lerp(700, 1000, eo(seg(lt, 0, d + 1))), 650, 1.2, { t }); ctx.restore();
      label('9 MARCH 2025', 560, 170, tg(lt, ni), -0.03, 72, CREAM, RED);
      label('RESEARCH SHIP FALKOR TOO', 1300, 270, tg(lt, W_('research', 1, st)), 0.03, 50, CREAM, BLUE);
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + ni, 'pop', { gain: 0.5 }); cue(st + W_('research', 1, st), 'pop', { gain: 0.35 }); cue(st, 'bubbles', { dur: 2, gain: 0.15 });
    add({ id: 'S05', at: wo2, note: 'the ship small in front of a row of dark volcanic snowy islands; tag SOUTH SANDWICH ISLANDS; then it pulls back wide and the tag becomes SOUTH ATLANTIC', draw(lt, d, t) {
      const z = lerp(1, 0.72, eio(seg(lt, at2 - wo2 - 0.2, d))); ctx.save(); view(960, 600, z); c4Surface(t, 620); c4Islands(900, 620, lerp(1.2, 1.5, seg(lt, 0, d)), 0.95); researchShip(lerp(1500, 1250, eo(seg(lt, 0, d))), 690, 0.7, { t }); ctx.restore();
      const a = tg(lt, W_('sandwich', 1, wo2) - 0.1) * (1 - seg(lt, at2 - wo2 - 0.1, at2 - wo2 + 0.1));
      label('SOUTH SANDWICH ISLANDS', 760, 190, a, -0.03, 62, CREAM, RED); label('SOUTH ATLANTIC', 760, 190, tg(lt, at2 - wo2 + 0.1), -0.03, 70, CREAM, BLUE);
    } });
    cue(wo2, 'slide', { dur: 1.4, gain: 0.3 }); cue(wo2 + W_('sandwich', 1, wo2) - 0.1, 'pop', { gain: 0.45 }); cue(at2 + 0.1, 'pop', { gain: 0.45 }); }

  // ── line 2 · driving a robot submarine called SuBastian, camera live streaming to the internet
  { const st = cut(2), ro = W_('robot', 2, st), su = W_('subastian', 2, st), li = Wd('live', 2) - 0.08, lv = Wd('live', 2), it = Wd('internet', 2);
    add({ id: 'S06', at: st, note: 'camera tilts down from the ship on the surface along its cable into the dark water to an orange and white boxy ROV hanging with its lights on; tags ROBOT SUBMARINE then SUBASTIAN', draw(lt, d, t) {
      const cy = lerp(560, 1500, eio(seg(lt, 0, d - 0.6))); ctx.save(); view(960, cy, 1); c4Surface(t, 560, { bottom: 2400 });
      researchShip(960, 650, 0.8, { t });
      const ry = 1640 + Math.sin(t * 1.2) * 8; stroke([[693, 560], [693, ry - 134 * 0.9]], '#2A2A2A', 4);
      ctx.save(); ctx.globalAlpha = 0.9; rovBox(792, ry, 0.9, { t, beamA: 0.12 }); ctx.restore();
      ctx.restore();
      label('A ROBOT SUBMARINE', 1330, 880 - 0, tg(lt, ro), 0.03, 56, CREAM, BLUE);
      label('SUBASTIAN', 1300, 300, tg(lt, su), -0.03, 80, CREAM, RED);
    } });
    cue(st, 'whoosh'); cue(st + ro, 'pop', { gain: 0.4 }); cue(st + su, 'pop', { gain: 0.5 }); cue(st + 0.6, 'slide', { dur: 2.2, gain: 0.25 });
    add({ id: 'S07', at: li, note: 'a monitor shows the dark water with a red LIVE dot; wifi arcs rise from it and a row of little laptop screens appears, all showing the same view; tags LIVE STREAMING and TO THE INTERNET', draw(lt, d, t) {
      deepSea(t, { floor: null }); const lv0 = lv - li;
      c4Monitor(560, 220, 800, 450, () => { ctx.fillStyle = '#071A2E'; ctx.fillRect(560, 220, 800, 450); for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(210,225,240,${0.3 + 0.3 * R2(i)})`; ctx.beginPath(); ctx.arc(560 + R2(i + 2) * 800, 220 + ((R2(i + 3) * 450 + t * 40 * (1 + R2(i))) % 450), 2 + R2(i) * 3, 0, TAU); ctx.fill(); } ctx.save(); ctx.globalAlpha = 0.25; rovBox(900, 620, 0.55, { t, beamA: -0.1 }); ctx.restore(); });
      const wk = tg(lt, lv0); for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = wk * (0.35 + 0.65 * Math.max(0, Math.sin(t * 4 - i * 1.1))); ctx.strokeStyle = CREAM; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(960, 140, 50 + i * 42, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke(); ctx.restore(); }
      const k = eob(seg(lt, it - li - 0.2, it - li + 0.25)); for (let i = 0; i < 5; i++) { const x = 360 + i * 300, y = 790 - (i % 2) * 0; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); piece(RR(-90, -60, 180, 112, 8), '#10161E', 0.7); ctx.fillStyle = '#0B2A44'; ctx.fillRect(-78, -48, 156, 88); ctx.fillStyle = 'rgba(210,225,240,0.5)'; ctx.beginPath(); ctx.arc(-20 + (i % 3) * 20, -8, 5, 0, TAU); ctx.fill(); piece(RR(-110, 52, 220, 14, 5), '#9AA0A4', 0.3, false); ctx.restore(); }
      label('LIVE STREAMING', 1560, 330, tg(lt, lv0), 0.03, 66, CREAM, RED); label('TO THE INTERNET', 1560, 470, tg(lt, it - li - 0.1), -0.03, 54, CREAM, BLUE);
    } });
    cue(li, 'whoosh'); cue(lv, 'pop', { gain: 0.5 }); cue(lv + 0.1, 'sparkle', { dur: 1.0, gain: 0.3 }); cue(it - 0.1, 'zip', { gain: 0.4 }); }

  // ── line 3 · About six hundred meters down, something floated into the lights
  { const st = cut(3), si = W_('six', 3, st), so = Wd('something', 3) - 0.1;
    add({ id: 'S08', at: st, note: 'ROV sinks down through the dark with its lights on while a paper depth meter ticks down; tag 600 M DOWN', draw(lt, d, t) {
      deepSea(t + lt * 3, { floor: null, light: 0.2 });
      const y = lerp(260, 520, eio(seg(lt, 0, d))); ctx.save(); ctx.translate(0, 0); rovBox(900, y, 1.05, { t, beamA: 0.25, beamL: 800 }); ctx.restore();
      const ds = seg(lt, si - 0.2, d); piece(RR(1500, 200, 150, 520, 20), '#10161E', 0.8); for (let i = 0; i < 9; i++) stroke([[1520, 240 + i * 50], [1560, 240 + i * 50]], 'rgba(251,246,232,0.7)', 3); piece(POLY([[1480, 240 + 440 * ds], [1520, 224 + 440 * ds], [1520, 256 + 440 * ds]]), '#E23B31', 0.2, false);
      label('600 M DOWN', 520, 790, tg(lt, si), -0.04, 76, CREAM, RED);
    } });
    cue(st, 'slide', { dur: 2.2, gain: 0.3 }); cue(st + si, 'pop', { gain: 0.5 });
    add({ id: 'S09', at: so, note: 'in the ROV lights a faint pale shape drifts in from the right edge of the dark; tag SOMETHING?', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.2 }); rovBox(520, 560, 0.95, { t, beamA: 0.0, beamL: 1000 });
      const k = eo(seg(lt, 0, d + 0.4)); ctx.save(); ctx.globalAlpha = 0.65 * seg(lt, 0, 0.8); colossalSquid(lerp(2000, 1300, k), 520 + Math.sin(t) * 20, 0.28, { t, juv: 1, arms: 0.5, tent: 0.1, flip: true }); ctx.restore();
      label('SOMETHING FLOATED IN', 960, 150, tg(lt, 0.3), -0.03, 56, CREAM, DARK); c4Question(1330, 360, 1, tg(lt, 1.0));
    } });
    cue(so, 'whoosh', { gain: 0.4 }); cue(so + 1.0, 'pop', { gain: 0.4 }); }

  // ── line 4 · It was a squid, only about thirty centimeters long, and it looked almost see through
  { const st = cut(4), sq = W_('squid', 4, st), th = W_('thirty', 4, st), se = Wd('see', 4) - 0.1;
    add({ id: 'S10', at: st, note: 'through the camera: the young pale squid in the lights, small and glassy, viewfinder frame and LIVE dot; tag A SQUID, then a bracket along its body and tag ABOUT 30 CM LONG', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 900 }); const k = eio(seg(lt, 0, d + 0.5)); const sx = lerp(820, 780, k), sy = 520 + Math.sin(t * 1.1) * 14;
      colossalSquid(sx, sy, lerp(0.62, 0.7, k), { t, juv: 1, arms: 0.7, tent: 0.2, glow: 0.6 });
      const bk = seg(lt, th - 0.1, th + 0.5); if (bk > 0) { const x0 = sx - 0.7 * 480, x1 = sx + 0.7 * 560, yb = 800; ctx.save(); ctx.globalAlpha = Math.min(1, bk * 2); stroke([[x0, yb - 18], [x0, yb + 18]], CREAM, 7); stroke([[x1, yb - 18], [x1, yb + 18]], CREAM, 7); stroke([[x0, yb], [lerp(x0, x1, bk), yb]], CREAM, 7); ctx.restore(); }
      viewfinder(t); label('A SQUID', 400, 170, tg(lt, sq), -0.04, 72, CREAM, DARK); label('ABOUT 30 CM LONG', 1380, 210, tg(lt, th), 0.03, 60, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + sq, 'pop', { gain: 0.4 }); cue(st + th, 'pop', { gain: 0.5 }); cue(st + th + 0.2, 'zip', { gain: 0.3 });
    add({ id: 'S11', at: se, note: 'pushes in on the squid: a bright test bar sits behind it and shows through its body; glints on the glassy mantle; tag ALMOST SEE THROUGH', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 900 }); const z = lerp(1, 1.5, eio(seg(lt, 0, d))); ctx.save(); view(820, 540, z);
      ctx.save(); ctx.globalAlpha = 0.9; for (let i = 0; i < 5; i++) piece(RR(560 + i * 90, 380, 28, 300, 8), i % 2 ? '#F2C230' : '#E4572E', 0, false); ctx.restore();
      colossalSquid(780, 530 + Math.sin(t * 1.1) * 10, 0.7, { t, juv: 1, arms: 0.7, tent: 0.2, glow: 0.6 }); ctx.restore();
      c4Glint(1040, 470, 1.2 * (0.5 + 0.5 * Math.sin(t * 4)), 1); c4Glint(700, 420, 0.9 * (0.5 + 0.5 * Math.sin(t * 4 + 2)), 1);
      viewfinder(t); label('ALMOST SEE THROUGH', 960, 170, tg(lt, 0.1), -0.03, 72, CREAM, BLUE);
    } });
    cue(se, 'whoosh', { gain: 0.4 }); cue(se + 0.1, 'sparkle', { dur: 1.0, gain: 0.35 }); }

  // ── line 5 · One of the scientists said it looked like a glass sculpture
  { const st = cut(5), gl = W_('glass', 5, st);
    add({ id: 'S12', at: st, note: 'slow close view of the glassy young squid turning on a dark stage like a sculpture, glints sweeping over it, a cream spotlight from above; tag LIKE A GLASS SCULPTURE', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 1, lx: 960 }); const z = lerp(1.05, 1.35, eio(seg(lt, 0, d))); ctx.save(); view(960, 540, z);
      colossalSquid(900, 560, 0.78, { t, juv: 1, arms: 0.55, tent: 0.15, glow: 1 }); ctx.restore();
      const gp = seg(lt, 0.4, d); c4Glint(lerp(500, 1400, gp), lerp(420, 520, gp), 1.5, Math.sin(gp * Math.PI)); c4Glint(lerp(1300, 700, gp), 600, 1.0, Math.sin(gp * Math.PI * 1.4 + 0.5) > 0 ? 1 : 0);
      label('A GLASS SCULPTURE', 960, 160, tg(lt, gl - 0.5), -0.03, 76, CREAM, BLUE);
    } });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + gl - 0.5, 'pop', { gain: 0.4 }); cue(st + gl, 'sparkle', { dur: 1.2, gain: 0.4 }); }

  // ── line 6 · At first nobody on the ship was sure what it was
  { const st = cut(6), no = W_('nobody', 6, st), su = Wd('sure', 6) - 0.1 - st;
    add({ id: 'S13', at: st, note: 'dim ship control room: three paper scientists in silhouette look up at a monitor showing the glassy squid; question marks float above their heads; tag NOBODY WAS SURE', draw(lt, d, t) {
      ctx.fillStyle = '#121C28'; ctx.fillRect(-300, -300, W + 600, H + 600); piece(RR(-100, 760, W + 200, 400, 0), '#1C2A3A', 0.4, false);
      c4Monitor(640, 150, 640, 360, () => { ctx.fillStyle = '#06182A'; ctx.fillRect(640, 150, 640, 360); colossalSquid(940, 330, 0.34, { t, juv: 1, arms: 0.6, tent: 0.15, glow: 0.6 }); });
      c4Person(400, 640, 1.5, '#1B2836', { rim: '#9FC3D8', hood: true }); c4Person(960, 690, 1.7, '#202E3E', { rim: '#9FC3D8', dir: -1, hair: '#8A8A8A' }); c4Person(1520, 640, 1.5, '#1B2836', { rim: '#9FC3D8', dir: -1 });
      c4Question(420, 330, 0.9, tg(lt, no + 0.2), -0.2); c4Question(1500, 320, 0.9, tg(lt, no + 0.6), 0.2); c4Question(1000, 90, 0.7, tg(lt, su), 0.05);
      label('NOBODY WAS SURE', 960, 790, tg(lt, no), -0.03, 70, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + no, 'pop', { gain: 0.5 }); cue(st + no + 0.2, 'tock', { gain: 0.3 }); cue(st + no + 0.6, 'tock', { gain: 0.3 }); }

  // ── line 7 · Two squid experts, Kat Bolstad and Aaron Evans, went through the footage, and they confirmed it by the hooks on its arms
  { const st = cut(7), kat = W_('kat', 7, st), aa = W_('aaron', 7, st), we = Wd('went', 7) - 0.1, fo = Wd('footage', 7), co = Wd('confirmed', 7) - 0.1, ho = Wd('hooks', 7);
    add({ id: 'S14', at: st, note: 'two paper experts side by side in front of a screen; name tags KAT BOLSTAD and AARON EVANS pop up one at a time; header TWO SQUID EXPERTS', draw(lt, d, t) {
      ctx.fillStyle = '#121C28'; ctx.fillRect(-300, -300, W + 600, H + 600); piece(RR(-100, 790, W + 200, 400, 0), '#1C2A3A', 0.4, false);
      c4Monitor(660, 120, 600, 330, () => { ctx.fillStyle = '#06182A'; ctx.fillRect(660, 120, 600, 330); colossalSquid(920, 290, 0.3, { t, juv: 1, glow: 0.5 }); });
      const k1 = eob(seg(lt, 0, 0.35)); ctx.save(); ctx.translate(560, 840); ctx.scale(k1, k1); ctx.translate(-560, -840); c4Person(560, 600, 1.7, '#3A2E44', { rim: '#9FC3D8', hair: '#6A3A22' }); ctx.restore();
      const k2 = eob(seg(lt, 0.15, 0.5)); ctx.save(); ctx.translate(1360, 840); ctx.scale(k2, k2); ctx.translate(-1360, -840); c4Person(1360, 610, 1.7, '#22403A', { rim: '#9FC3D8', dir: -1, hair: '#1E1E1E' }); ctx.restore();
      label('TWO SQUID EXPERTS', 960, 590, tg(lt, 0.2), -0.02, 56, CREAM, DARK); label('KAT BOLSTAD', 560, 850, tg(lt, kat), -0.04, 60, CREAM, RED); label('AARON EVANS', 1360, 850, tg(lt, aa), 0.04, 60, CREAM, BLUE);
    } });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + kat, 'pop', { gain: 0.45 }); cue(st + aa, 'pop', { gain: 0.45 });
    add({ id: 'S15', at: we, note: 'a film strip of footage frames slides across the screen, each frame showing the glassy squid at a different angle, a playhead scrubbing along; tag GOING THROUGH THE FOOTAGE', draw(lt, d, t) {
      ctx.fillStyle = '#0C141E'; ctx.fillRect(-300, -300, W + 600, H + 600); const off = lt * 140;
      piece(RR(-200, 260, W + 400, 380, 10), '#161B22', 0.8); for (let i = 0; i < 8; i++) { const x = -180 + i * 330 - (off % 330), j = Math.floor(off / 330) + i; piece(RR(x, 292, 296, 316, 8), '#06182A', 0.3, false); ctx.save(); ctx.beginPath(); ctx.rect(x, 292, 296, 316); ctx.clip(); colossalSquid(x + 150 + (j % 3 - 1) * 14, 450 + (j % 2) * 20, 0.17, { t: t + j, juv: 1, rot: ((j * 37) % 7 - 3) * 0.08, flip: j % 2 === 0 }); ctx.restore(); for (let h = 0; h < 2; h++) piece(RR(x + 20 + h * 200, 266, 40, 18, 4), '#06101A', 0, false), piece(RR(x + 20 + h * 200, 616, 40, 18, 4), '#06101A', 0, false); }
      piece(RR(940, 240, 40, 420, 8), '#E23B31', 0.4);
      label('GOING THROUGH THE FOOTAGE', 960, 150, tg(lt, fo - we - 0.4), -0.03, 62, CREAM, DARK);
    } });
    cue(we, 'whoosh', { gain: 0.35 }); cue(we + 0.3, 'slide', { dur: 2.4, gain: 0.25 });
    add({ id: 'S16', at: co, note: 'a magnifier opens over the squid and shows one arm very close: pale glassy arm with a row of suckers and small dark hooks; arrow to them; tags CONFIRMED and THE HOOKS ON ITS ARMS', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.3, lx: 600 }); colossalSquid(560, 560, 0.55, { t, juv: 1, arms: 0.8, glow: 0.4 });
      const k = eob(seg(lt, 0.1, 0.5)); ctx.save(); ctx.translate(1270, 520); ctx.scale(k, k); c4Lens(0, 0, 330, () => { ctx.fillStyle = '#0B2036'; ctx.fillRect(-340, -340, 680, 680); c4ArmHooks(10, 10, 0.85, t); }); ctx.restore();
      if (k > 0.5) { const a = (ho - co); if (lt > a - 0.2) { arrow(1180, 330, 1180 - 0 + 40, 440, CREAM, 12); } }
      label('CONFIRMED', 520, 170, tg(lt, 0.1), -0.03, 70, CREAM, RED); label('THE HOOKS ON ITS ARMS', 520, 800, tg(lt, ho - co - 0.1), 0.02, 52, CREAM, DARK);
    } });
    cue(co, 'whoosh'); cue(co + 0.3, 'pop', { gain: 0.5 }); cue(ho - 0.1, 'tock', { gain: 0.4 }); }

  // ── line 8 · It was a colossal squid. A young one. The first time one had ever been filmed alive in its natural home.
  { const st = cut(8), co = W_('colossal', 8, st), yo = W_('young', 8, st) - 0.05, fi = Wd('first', 8) - 0.1, nh = Wd('natural', 8) - 0.1;
    add({ id: 'S17', at: st, note: 'the young pale squid centre stage, spotlight on it; tag COLOSSAL SQUID then A YOUNG ONE; a small paper stamp pops', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 1, lx: 960 }); const k = eio(seg(lt, 0, d + 0.5));
      colossalSquid(lerp(760, 820, k), 540 + Math.sin(t * 1.1) * 12, lerp(0.78, 0.86, k), { t, juv: 1, arms: 0.8, tent: 0.25, glow: 0.8 });
      label('A COLOSSAL SQUID', 960, 160, tg(lt, co) * (1 - seg(lt, yo - 0.05, yo + 0.05)), -0.03, 80, CREAM, RED); label('A YOUNG ONE', 960, 160, tg(lt, yo + 0.05), -0.03, 80, CREAM, BLUE);
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + co, 'pop', { gain: 0.5 }); cue(st + yo, 'pop', { gain: 0.5 });
    add({ id: 'S18', at: fi, note: 'the squid in the open dark water with the live viewfinder; tag FIRST EVER FILMED ALIVE; camera pulls back wide and the tag changes to IN ITS NATURAL HOME', draw(lt, d, t) {
      const z = lerp(1.1, 0.7, eio(seg(lt, nh - fi - 0.3, d))); ctx.save(); view(960, 540, z); deepSea(t, { floor: 900, light: 0.6, lx: 900 });
      colossalSquid(lerp(900, 1050, seg(lt, 0, d)), 520 + Math.sin(t * 1.1) * 14, 0.7, { t, juv: 1, arms: 0.8, tent: 0.25, glow: 0.5 }); ctx.restore();
      viewfinder(t); const a = tg(lt, 0.15) * (1 - seg(lt, nh - fi - 0.1, nh - fi + 0.1));
      label('FIRST EVER FILMED ALIVE', 960, 170, a, -0.03, 70, CREAM, RED); label('IN ITS NATURAL HOME', 960, 170, tg(lt, nh - fi + 0.1), -0.03, 70, CREAM, BLUE);
    } });
    cue(fi, 'whoosh', { gain: 0.4 }); cue(fi + 0.15, 'pop', { gain: 0.5 }); cue(nh, 'pop', { gain: 0.45 }); cue(fi, 'bubbles', { dur: 2, gain: 0.15 }); }

  // ── line 9 · almost exactly a hundred years after the species got its name from two arm crowns in a whale
  { const st = cut(9), ha = W_('hundred', 9, st), na = Wd('name', 9) - 0.1;
    add({ id: 'S19', at: st, note: 'a paper timeline: the young squid sits at a 2025 marker on the right, a bar stretches left to an empty marker 1925; tags A HUNDRED YEARS and 2025', draw(lt, d, t) {
      deepSea(t, { floor: null }); const k = eio(seg(lt, ha - 0.2, d));
      colossalSquid(1500, 400, 0.3, { t, juv: 1, glow: 0.5 }); piece(RR(240, 600, 1440, 36, 18), '#2A2E36', 0.8);
      const x1 = 1680, x0 = lerp(x1 - 60, 240, k); piece(RR(x0, 606, x1 - x0, 24, 12), RED, 0, false);
      piece(CIR(1680, 618, 30), CREAM, 0.6); piece(CIR(240, 618, 30), '#5A6470', 0.4); label('2025', 1560, 740, tg(lt, 0.2), 0.03, 70, CREAM, BLUE);
      label('A HUNDRED YEARS LATER', 960, 190, tg(lt, ha), -0.03, 70, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + ha, 'zip', { gain: 0.4 }); cue(st + ha + 0.1, 'pop', { gain: 0.4 });
    add({ id: 'S20', at: na, note: 'camera slides left to the 1925 end: a sperm whale with two pale arm crowns floating out of it; tags 1925 and TWO ARM CROWNS IN A WHALE', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.4, lx: 500 }); const z = lerp(1, 1.15, eio(seg(lt, 0, d)));
      ctx.save(); view(960, 540, z); piece(RR(-300, 600, 1000, 36, 18), '#2A2E36', 0.8); piece(RR(-300, 606, 1000, 24, 12), RED, 0, false); piece(CIR(240, 618, 30), CREAM, 0.6);
      spermWhale(960, 350, 0.7, { t });
      const k = eob(seg(lt, 0.4, 0.9)); for (let i = 0; i < 2; i++) { ctx.save(); ctx.translate(620 + i * 40, 420 - 40 - i * 36 - (1 - k) * 80); ctx.rotate(-0.4 + i * 0.5); ctx.scale(k, k); sqLimb(150, 34, 12, 6, t, i, '#B9CED6'); ctx.restore(); }
      ctx.restore();
      label('1925', 460, 760, tg(lt, 0.1), -0.03, 80, CREAM, RED); label('TWO ARM CROWNS IN A WHALE', 1300, 220, tg(lt, 0.5), 0.03, 56, CREAM, DARK);
    } });
    cue(na, 'whoosh', { gain: 0.35 }); cue(na + 0.15, 'pop', { gain: 0.45 }); cue(na + 0.5, 'pop', { gain: 0.4 }); }

  // ── line 10 · It was not a monster. It was a teenager, only about as long as a ruler.
  { const st = cut(10), mo = W_('monster', 10, st), te = Wd('teenager', 10) - 0.1, ru = Wd('ruler', 10);
    add({ id: 'S21', at: st, note: 'a huge deep red adult colossal squid looms out of the dark close to the camera, big blue eye; tag NOT A MONSTER with a red cross', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.3, lx: 400 }); const k = eo(seg(lt, 0, d + 0.3));
      colossalSquid(lerp(1400, 980, k), 560, 1.25, { t, juv: 0, arms: 0.9, tent: 0.5, flip: true, glow: 0.5 }); c4Veil(960, 540, 400, 1100, 0.6);
      label('NOT A MONSTER', 960, 160, tg(lt, mo - 0.1), -0.03, 80, CREAM, RED); redX(560, 330, eob(seg(lt, mo + 0.2, mo + 0.5)) * 1.6);
    } });
    cue(st, 'thud', { gain: 0.5 }); cue(st + mo, 'pop', { gain: 0.5 }); cue(st + mo + 0.2, 'slam', { gain: 0.45 });
    add({ id: 'S22', at: te, note: 'cut to the small pale squid next to a yellow ruler of the same length, drifting side by side; tags A TEENAGER and AS LONG AS A RULER', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 1, lx: 960 }); const rk = eob(seg(lt, ru - te - 0.6, ru - te - 0.1));
      colossalSquid(820, 480 + Math.sin(t * 1.1) * 10, 0.62, { t, juv: 1, arms: 0.7, tent: 0.15, glow: 0.5 });
      if (rk > 0) { ctx.save(); ctx.translate(960, 750); ctx.scale(rk, rk); ctx.translate(-960, -750); c4Ruler(560, 710, 800); ctx.restore(); }
      label('A TEENAGER', 960, 160, tg(lt, 0.1), -0.03, 80, CREAM, BLUE); label('AS LONG AS A RULER', 1400, 330, tg(lt, ru - te - 0.2), 0.03, 56, CREAM, RED);
    } });
    cue(te, 'whoosh', { gain: 0.4 }); cue(te + 0.1, 'pop', { gain: 0.5 }); cue(ru - 0.5, 'slam', { gain: 0.4 }); cue(ru, 'pop', { gain: 0.4 }); }

  // ── line 11 · Its skin cells let it switch between see through and colored, so a young one can almost vanish
  { const st = cut(11), sk = W_('skin', 11, st), sw = Wd('switch', 11) - 0.1, sx = Wd('see', 11), co = Wd('colored', 11), va = Wd('vanish', 11) - 0.5;
    add({ id: 'S23', at: st, note: 'small squid on the left, a big magnifier on the right shows its skin patch with dots; the dots pulse small (see through) and wide open (colored) as it switches; tags SKIN CELLS, SEE THROUGH, COLORED', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.4, lx: 500 }); const ph = (Math.sin((lt - (sw - st + 0.0)) * 2.4) * 0.5 + 0.5); const kk = lt < sx - st - 0.1 ? 0.15 : lt < co - st - 0.1 ? 0 : 1; const kc = lerp(0.1, 0.95, seg(lt, sw - st, sw - st + 0.5)) * (lt > co - st - 0.1 ? 1 : 0) + (lt <= co - st - 0.1 ? lerp(0.1, 0.1, 1) : 0);
      colossalSquid(500, 560, 0.52, { t, juv: lt > co - st - 0.1 ? 0.45 : 1, arms: 0.7, glow: 0.3 });
      const lk = eob(seg(lt, 0, 0.4)); ctx.save(); ctx.translate(1340, 520); ctx.scale(lk, lk); c4Skin(0, 0, 300, lt > co - st - 0.1 ? 0.95 : 0.08, t); ctx.restore();
      stroke([[560, 470], [1140, 430]], 'rgba(251,246,232,0.5)', 4); stroke([[560, 640], [1140, 640]], 'rgba(251,246,232,0.5)', 4);
      label('SKIN CELLS', 1340, 190, tg(lt, sk - st - 0.1 > 0 ? 0.05 : 0.05), 0.03, 70, CREAM, RED);
      label('SEE THROUGH', 1000, 880, tg(lt, sx - st - 0.1) * (lt < co - st - 0.1 ? 1 : 0.0), -0.03, 56, CREAM, BLUE); label('COLORED', 1000, 880, tg(lt, co - st - 0.1), -0.03, 56, CREAM, '#B8502E');
    } });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + 0.1, 'pop', { gain: 0.45 }); cue(sx - 0.1, 'pop', { gain: 0.4 }); cue(co - 0.1, 'pop', { gain: 0.45 }); cue(co, 'sparkle', { dur: 0.8, gain: 0.3 });
    add({ id: 'S24', at: va, note: 'the squid in open dark water fades away until only a faint outline and drifting marine snow is left; tag ALMOST VANISH', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 900 }); const f = eio(seg(lt, 0.2, d - 0.1));
      colossalSquid(960, 540, 0.78, { t, juv: 1, arms: 0.8, tent: 0.2, glow: 0.4 });
      ctx.save(); ctx.globalAlpha = 0.9 * f; const g = ctx.createRadialGradient(900, 540, 200, 900, 540, 700); g.addColorStop(0, '#0A1A2E'); g.addColorStop(1, 'rgba(10,26,46,0.0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(210,225,240,${0.2 + 0.25 * R2(i + 3)})`; ctx.beginPath(); ctx.arc(400 + R2(i + 4) * 1100, 140 + (R2(i + 5) * 800 + t * 14) % 800, 1.8 + R2(i) * 2.4, 0, TAU); ctx.fill(); }
      label('ALMOST VANISH', 960, 170, tg(lt, 0.15), -0.03, 80, CREAM, RED);
    } });
    cue(va, 'whoosh', { gain: 0.35 }); cue(va + 0.2, 'pop', { gain: 0.4 }); cue(va + 0.8, 'sparkle', { dur: 1.2, gain: 0.3 }); }

  // ── line 12 · An adult can grow to about seven meters long, and around five hundred kilos
  { const st = cut(12), ad = W_('adult', 12, st), se = W_('seven', 12, st) - 0.1, fi = Wd('five', 12) - 0.1;
    add({ id: 'S25', at: st, note: 'a deep red adult colossal squid sweeps across the dark, a bracket measures its whole length; tags AN ADULT then ABOUT 7 M LONG', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.3, lx: 900 }); const k = eo(seg(lt, 0, d + 0.4)); const sx = lerp(1250, 900, k);
      colossalSquid(sx, 520, 1.0, { t, juv: 0, arms: 0.9, tent: 0.7, glow: 0.5, flip: false });
      const bk = seg(lt, se - 0.1, se + 0.8); if (bk > 0) { const x0 = sx - 560, x1 = sx + 560, yb = 800; ctx.save(); ctx.globalAlpha = Math.min(1, bk * 2); stroke([[x0, yb - 20], [x0, yb + 20]], CREAM, 8); stroke([[x1, yb - 20], [x1, yb + 20]], CREAM, 8); stroke([[x0, yb], [lerp(x0, x1, bk), yb]], CREAM, 8); ctx.restore(); }
      label('AN ADULT', 520, 170, tg(lt, ad), -0.04, 80, CREAM, RED); label('ABOUT 7 M LONG', 1380, 230, tg(lt, se), 0.03, 70, CREAM, BLUE);
    } });
    cue(st, 'whoosh', { gain: 0.4 }); cue(st + ad, 'pop', { gain: 0.45 }); cue(st + se, 'zip', { gain: 0.45 }); cue(st + se + 0.2, 'pop', { gain: 0.4 });
    add({ id: 'S26', at: fi, note: 'close on the heavy red mantle and big eye of the adult, slow push in; tag ABOUT 500 KG', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.3, lx: 900 }); const z = lerp(1.3, 1.7, eio(seg(lt, 0, d))); ctx.save(); view(560, 520, z);
      colossalSquid(900, 520, 1.0, { t, juv: 0, arms: 0.9, tent: 0.7, glow: 0.4 }); ctx.restore();
      label('ABOUT 500 KG', 1460, 200, tg(lt, 0.1), 0.03, 84, CREAM, RED);
    } });
    cue(fi, 'whoosh', { gain: 0.35 }); cue(fi + 0.1, 'thud', { gain: 0.55 }); cue(fi + 0.15, 'pop', { gain: 0.4 }); }

  // ── line 13 · And nobody has filmed a live adult
  { const st = cut(13), no = W_('nobody', 13, st), ad = W_('adult', 13, st);
    add({ id: 'S27', at: st, note: 'empty dark water seen through the ROV camera: the lights sweep and find nothing; a dashed outline of a huge adult with a big question mark; tag NOBODY HAS FILMED A LIVE ADULT', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.5, lx: 700 + Math.sin(t * 1.3) * 300 });
      ctx.save(); ctx.globalAlpha = 0.5; ctx.setLineDash([22, 18]); ctx.strokeStyle = CREAM; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(1000, 520, 560, 170, 0, 0, TAU); ctx.stroke(); ctx.restore();
      c4Question(1000, 520, 1.5, tg(lt, no + 0.2));
      viewfinder(t); label('NOBODY HAS FILMED A LIVE ADULT', 960, 180, tg(lt, no - 0.1), -0.02, 62, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + no, 'pop', { gain: 0.5 }); cue(st + ad, 'thud', { gain: 0.4 }); }

  // ── line 14 · We know it by its eyes, its hooks, and what whales leave behind. We know very little about how it lives.
  { const st = cut(14), ey = W_('eyes', 14, st), ho = W_('hooks', 14, st), wh = W_('whales', 14, st) - 0.1, ve = Wd('very', 14) - 0.1;
    add({ id: 'S28', at: st, note: 'three paper cards pop in one by one on a dark board: the giant blue eye, a rotating hook club, a squid beak; tags EYES, HOOKS, WHAT WHALES LEAVE BEHIND', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.3, lx: 960 }); ctx.save(); ctx.globalAlpha = 0.45 * (1 - seg(lt, ey - 0.1, ey + 0.3)); colossalSquid(960, 520, 0.6, { t, juv: 1, arms: 0.7, glow: 0.3 }); ctx.restore(); label('HOW WE KNOW IT', 960, 150, tg(lt, 0), -0.03, 70, CREAM, DARK);
      const cards = [[360, ey - 0.1, 'EYES'], [960, ho - 0.1, 'HOOKS'], [1560, wh - 0.0, 'WHAT WHALES LEAVE BEHIND']];
      cards.forEach(([cx, a, nm], i) => { const k = eob(seg(lt, a, a + 0.35)); if (k <= 0) return; ctx.save(); ctx.translate(cx, 520); ctx.rotate((i - 1) * 0.04); ctx.scale(k, k); piece(RR(-250, -250, 500, 500, 22), '#16283A', 1);
        ctx.save(); ctx.beginPath(); ctx.roundRect(-250, -250, 500, 500, 22); ctx.clip();
        if (i === 0) sqEye(0, 0, 160, { skin: '#7C2E34' }); else if (i === 1) { ctx.save(); ctx.translate(150, 0); ctx.scale(1.9, 1.9); sqClub(160, 80, '#A23F45', t, { hook: 1.3 }); ctx.restore(); } else { sqBeak(0, 0, 2.2, -0.15 + Math.sin(t * 1.5) * 0.05); }
        ctx.restore(); ctx.restore(); });
      label('EYES', 360, 810, tg(lt, ey), -0.04, 64, CREAM, BLUE); label('HOOKS', 960, 810, tg(lt, ho), 0.03, 64, CREAM, RED); label('WHAT WHALES LEAVE BEHIND', 1500, 830, tg(lt, wh + 0.1), -0.03, 44, CREAM, DARK);
    } });
    cue(st, 'whoosh', { gain: 0.3 }); cue(st + ey, 'pop', { gain: 0.45 }); cue(st + ho, 'pop', { gain: 0.45 }); cue(st + wh, 'pop', { gain: 0.45 });
    add({ id: 'S29', at: ve, note: 'a dim pale squid shape in the dark with question marks drifting up around it; tag WE KNOW VERY LITTLE', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.4, lx: 900 }); const z = lerp(1, 1.1, eio(seg(lt, 0, d)));
      ctx.save(); view(960, 540, z); ctx.globalAlpha = 0.7; colossalSquid(900, 560, 0.7, { t, juv: 1, arms: 0.7, glow: 0.3 }); ctx.restore();
      for (let i = 0; i < 4; i++) c4Question(380 + i * 380, 300 + (i % 2) * 280 - ((t * 20 + i * 40) % 60), 0.7, tg(lt, 0.3 + i * 0.35), (i - 1.5) * 0.12);
      label('WE KNOW VERY LITTLE', 960, 150, tg(lt, 0.1), -0.03, 76, CREAM, RED);
    } });
    cue(ve, 'whoosh', { gain: 0.3 }); cue(ve + 0.15, 'pop', { gain: 0.45 }); for (let i = 0; i < 4; i++) cue(ve + 0.3 + i * 0.35, 'tock', { gain: 0.2 }); }

  // ── line 15 · For a hundred years, this animal was a story told by whale stomachs and fishing lines. Now, for the first time, we had seen one living.
  { const st = cut(15), wh = W_('whale', 15, st), fl = W_('fishing', 15, st) - 0.1, no = Wd('now', 15) - 0.1, fi = Wd('first', 15), liv = Wd('living', 15);
    add({ id: 'S30', at: st, note: 'a hundred years of old clues: a sperm whale on the left, a hooked toothfish on a line on the right, two paper cards arrive: WHALE STOMACHS and FISHING LINES; header A HUNDRED YEARS', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 0.4 }); ctx.save(); ctx.globalAlpha = 0.9; spermWhale(560, 440, 0.55, { t }); ctx.restore();
      stroke([[1480, -100], [1480, 280]], 'rgba(220,225,230,0.8)', 5); toothfish(1480, 440, 0.8, { t, rot: Math.PI / 2 * 0.15 + Math.sin(t * 1.4) * 0.05 });
      label('A HUNDRED YEARS', 960, 150, tg(lt, 0.1), -0.03, 64, CREAM, DARK); label('WHALE STOMACHS', 560, 720, tg(lt, wh), -0.03, 56, CREAM, BLUE); label('FISHING LINES', 1480, 720, tg(lt, fl - 0.0), 0.03, 56, CREAM, RED);
    } });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + wh, 'pop', { gain: 0.45 }); cue(st + fl, 'pop', { gain: 0.45 });
    add({ id: 'S31', at: no, note: 'cut to the live view: the young glassy squid in the ROV lights, viewfinder LIVE, slow push in; tags NOW and SEEN LIVING FOR THE FIRST TIME', draw(lt, d, t) {
      const z = lerp(1, 1.18, eio(seg(lt, 0, d))); ctx.save(); view(900, 540, z); deepSea(t, { floor: null, light: 1, lx: 900 }); colossalSquid(900, 540, 0.82, { t, juv: 1, arms: 0.8, tent: 0.25, glow: 0.8 }); ctx.restore();
      viewfinder(t); label('NOW', 360, 200, tg(lt, 0.1), -0.05, 90, CREAM, RED); label('SEEN LIVING FOR THE FIRST TIME', 1180, 200, tg(lt, fi - no - 0.1), 0.02, 56, CREAM, BLUE);
    } });
    cue(no, 'thud', { gain: 0.5 }); cue(no + 0.1, 'pop', { gain: 0.5 }); cue(fi, 'pop', { gain: 0.4 }); cue(liv, 'sparkle', { dur: 1.2, gain: 0.35 }); }

  // ── line 16 · So what would you ask a colossal squid, if you could meet one? Tell me in the comments.
  { const st = cut(16), as = W_('ask', 16, st), co = Wd('comments', 16) - 0.2 - st, tm = Wd('tell', 16) - 0.1 - st;
    add({ id: 'S32', at: st, note: 'the young glassy squid close and friendly in the lights with its big eye toward the viewer; paper speech bubbles with question marks float up; tags WHAT WOULD YOU ASK? then TELL ME IN THE COMMENTS', draw(lt, d, t) {
      deepSea(t, { floor: null, light: 1, lx: 960 }); colossalSquid(980, 560, 0.8, { t, juv: 1, arms: 0.85, tent: 0.3, glow: 0.8, flip: false });
      for (let i = 0; i < 3; i++) { const k = eob(seg(lt, 0.3 + i * 0.5, 0.7 + i * 0.5)); if (k <= 0) continue; ctx.save(); ctx.translate(520 + i * 430, 250 + (i % 2) * 70 - Math.sin(t * 1.5 + i) * 10); ctx.scale(k, k); piece(ELL(0, 0, 90, 70), CREAM, 0.7); piece(POLY([[-20, 50], [-50, 100], [20, 62]]), CREAM, 0.4, false); ctx.fillStyle = RED; ctx.font = `700 100px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 8); ctx.restore(); }
      label('WHAT WOULD YOU ASK?', 960, 700, tg(lt, as - 0.4), -0.03, 74, CREAM, RED); label('TELL ME IN THE COMMENTS', 960, 810, tg(lt, tm + 0.0), 0.02, 60, CREAM, BLUE);
    } });
    cue(st, 'whoosh', { gain: 0.35 }); cue(st + as - 0.4, 'pop', { gain: 0.45 }); cue(st + tm, 'pop', { gain: 0.45 }); for (let i = 0; i < 3; i++) cue(st + 0.3 + i * 0.5, 'tock', { gain: 0.25 }); }

  return { shots: S, cues: CUES };
}
