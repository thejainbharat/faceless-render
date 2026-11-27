// Renders one part of the film (seconds a to b) in short pieces, each in a fresh Chrome with a time limit and retries.
//   node cloud/render_part.mjs <part index> <a> <b>      -> out/part-XX.mp4 (picture only, sound is added in join)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [idx, a, b] = process.argv.slice(2).map(Number);
const job = JSON.parse(fs.readFileSync('cloud/job.json', 'utf8'));
const proj = path.resolve('project'), out = path.resolve('out');
fs.mkdirSync(out, { recursive: true });
const chrome = path.resolve('cloud/chrome.sh'); fs.chmodSync(chrome, 0o755);
const env = { ...process.env, FPS: String(job.fps || 30), CHROME: chrome };
if (job.qs) env.QS = job.qs;
if (job.software_gl) env.SOFTWARE_GL = '1';
const step = job.piece || 6, limit = (job.piece_timeout || 1200) * 1000, pad = (n) => String(n).padStart(2, '0');
const list = [], t00 = Date.now();

for (let s = a, n = 0; s < b - 1e-6; s += step, n++) {
  const e = Math.min(s + step, b), f = path.join(out, `piece-${pad(idx)}-${pad(n)}.mp4`);
  let ok = false;
  for (let t = 1; t <= 3 && !ok; t++) {
    const t0 = Date.now();
    const r = spawnSync('node', ['tools/capture.mjs', 'video', f, String(s), String(e)], { cwd: proj, env, timeout: limit, killSignal: 'SIGKILL', stdio: ['ignore', 'ignore', 'inherit'] });
    ok = r.status === 0 && fs.existsSync(f) && fs.statSync(f).size > 0;
    console.log(`piece ${n} (${s}-${e} s) try ${t}: ${ok ? 'done' : 'FAILED'} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    if (!ok) { fs.rmSync(f, { force: true }); spawnSync('pkill', ['-9', '-f', 'fs-chrome-']); }
  }
  if (!ok) { console.error(`RENDER FAILED at piece ${n}`); process.exit(1); }
  list.push(`file '${f}'`);
}
fs.writeFileSync(path.join(out, 'list.txt'), list.join('\n') + '\n');
const part = path.join(out, `part-${pad(idx)}.mp4`);
const j = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(out, 'list.txt'), '-an', '-c:v', 'copy', part], { stdio: 'inherit' });
if (j.status !== 0) process.exit(1);
const frames = Math.round((b - a) * (job.fps || 30)), secs = (Date.now() - t00) / 1000;
console.log(`PART DONE ${part}: ${frames} frames in ${secs.toFixed(0)} s (${(secs / frames).toFixed(2)} s per frame)`);
