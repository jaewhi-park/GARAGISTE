// boundary — 이 변경이 경계(의존성·워크플로·IPC·권한·설치 형태·유출 키워드)에 닿는가. 닿으면 spike가 먼저다.
import { ctx, git, isMain, matchAny, out } from './lib.mjs';

export function checkBoundary(team, { files = [], text = '' } = {}) {
  const reasons = [];
  for (const f of files) if (matchAny(f, team.boundary.files)) reasons.push(`file ${f}`);
  const low = text.toLowerCase();
  for (const k of team.boundary.keywords) if (low.includes(k.toLowerCase())) reasons.push(`keyword ${k}`);
  return { hit: reasons.length > 0, reasons: [...new Set(reasons)] };
}

function main() {
  const args = process.argv.slice(2);
  const { root, team } = ctx();
  let files = []; let text = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--files') { while (args[i + 1] && !args[i + 1].startsWith('--')) files.push(args[++i]); }
    else if (args[i] === '--text') text += ' ' + (args[++i] || '');
    else if (args[i] === '--diff') files.push(...git(['diff', '--name-only', args[++i]], root).stdout.split('\n').filter(Boolean));
  }
  const r = checkBoundary(team, { files, text });
  out(r.hit ? `HIT ${r.reasons.length}: ${r.reasons.join(', ')}` : 'CLEAR');
}
if (isMain(import.meta.url)) main();
