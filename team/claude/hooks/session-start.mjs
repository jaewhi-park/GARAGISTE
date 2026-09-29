// session-start — 살아 있음을 남기고(alive), 진단 한 줄과 STATUS 첫 줄을 세션에 넣는다. 그 이상은 없다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function main() {
  try { fs.readFileSync(0, 'utf8'); } catch { /* 입력 없음 */ }
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const alive = path.join(root, '.garagiste', 'session', 'alive');
  fs.mkdirSync(path.dirname(alive), { recursive: true });
  fs.writeFileSync(alive, JSON.stringify({ ts: new Date().toISOString(), node: process.versions.node }));
  const run = (s, args = []) => spawnSync(process.execPath, [path.join(root, '.garagiste', 'scripts', s), ...args], { cwd: root, encoding: 'utf8' });
  const d = run('doctor.mjs');
  const s = run('state.mjs', ['--brief']);
  // doctor 이유 전문을 넣는다 — 첫 줄("FAIL doctor N")만으로는 훅 침묵사를 사람이 못 본다 (R8)
  const lines = ['GARAGISTE 증거 팀 — 이 세션은 conductor다: 코드·테스트·문서 본문을 쓰지 않고, 스크립트를 부르고 팩을 띄우고 한 줄을 읽는다. 절차는 CLAUDE.md의 Flow 1~6 그대로. 첫 세션이면 CEO에게 무엇을 만들지 묻고 Flow 1부터.',
    ...(((d.stdout || d.stderr || '').trim() || 'doctor 무응답 — .garagiste/scripts가 없거나 node가 죽었다: 설치를 확인하라').split('\n')),
    (s.stdout || '').trim() || 'STATUS 없음 — 첫 unit: node .garagiste/scripts/work.mjs new <slug> "<원문>"'];
  process.stdout.write(lines.join('\n') + '\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')) main();
