// Splits the film into parts (whole seconds) and prints the outputs the workflow needs.
import fs from 'node:fs';
const job = JSON.parse(fs.readFileSync('cloud/job.json', 'utf8'));
const dur = JSON.parse(fs.readFileSync('project/data/lines.json', 'utf8')).duration;
const parts = Math.max(1, Math.min(job.parts || 1, 20));
const len = Math.ceil(dur / parts);
const matrix = [];
for (let i = 0, a = 0; a < dur - 0.01; i++, a += len) matrix.push({ i, a, b: Math.min(a + len, Math.round(dur * 1000) / 1000) });
console.error(`film ${dur} s, ${matrix.length} parts of up to ${len} s, ${job.fps} fps`);
console.log(`matrix=${JSON.stringify(matrix)}`);
console.log(`tag=${job.tag}`);
console.log(`name=${job.name}`);
