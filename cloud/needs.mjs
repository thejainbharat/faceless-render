// Prints which tools a prep job needs, as GitHub step outputs (py, kokoro, whisper).
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync('cloud/job.json', 'utf8'));
const s = new Set(j.steps || []);
const py = ['voice', 'words', 'mix', 'estimate'].some((k) => s.has(k));
console.log(`py=${py ? 1 : 0}`);
console.log(`kokoro=${s.has('voice') && j.voice !== 'edge' ? 1 : 0}`);
console.log(`whisper=${s.has('words') ? 1 : 0}`);
