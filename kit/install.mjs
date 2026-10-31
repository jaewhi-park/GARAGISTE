// install — kit을 프로젝트에 놓는다. 소유 파일(스크립트 · opencode 에이전트)은 덮고, 처음 한 번 쓰는 파일(AGENTS.md · check.json · flaky.txt · CLAUDE.md · settings)은 있으면 둔다.
// settings는 permissions.allow만 합친다. git에는 손대지 않는다. 두 OS에서 같은 node 한 줄.
// 사용: node <GARAGISTE>/kit/install.mjs <claude|opencode> --project <repo> [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FLAVORS = ['claude', 'opencode'];
export const OPENCODE_AGENTS = ['build', 'review']; // explore는 opencode built-in(읽기 전용)을 쓴다 — 다시 만들지 않는다

export function parseArgs(argv) {
  const [flavor, ...rest] = argv;
  if (!flavor || ['-h', '--help', 'help'].includes(flavor)) return { error: '사용법: node kit/install.mjs <claude|opencode> --project <repo> [--dry]' };
  if (!FLAVORS.includes(flavor)) return { error: `하네스: ${FLAVORS.join(' 또는 ')} (받은 값: ${flavor})` };
  let project = null; let dry = false;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--project' || rest[i] === '-Project') project = rest[++i];
    else if (rest[i] === '--dry') dry = true;
    else return { error: `모르는 인자: ${rest[i]}` };
  }
  if (!project) return { error: '--project <repo>가 필요하다' };
  return { flavor, project, dry };
}
// allow만 합친다 — 있는 것은 그대로, 없는 줄만 뒤에. 바뀐 게 없으면 null.
export function mergeAllow(existing, ours) {
  const have = Array.isArray(existing?.permissions?.allow) ? existing.permissions.allow : [];
  const add = (ours?.permissions?.allow || []).filter((x) => !have.includes(x));
  if (!add.length) return null;
  return { ...existing, permissions: { ...(existing.permissions || {}), allow: [...have, ...add] } };
}
// 설치 계획 — 순수. present(rel)은 대상의 현재 내용(없으면 null), src(name)는 kit 소스의 내용.
export function plan(flavor, { present, src, project }) {
  const acts = [];
  const put = (rel, text) => acts.push({ rel, op: 'write', text });
  const first = (rel, text) => acts.push({ rel, op: present(rel) == null ? 'write' : 'keep', text });
  put('kit/check.mjs', src('scripts/check.mjs'));
  put('kit/tests-for.mjs', src('scripts/tests-for.mjs'));
  first('kit/check.json', src('scripts/check.json'));
  first('kit/flaky.txt', src('scripts/flaky.txt'));
  first('AGENTS.md', src('AGENTS.md.template').replaceAll('{{PROJECT}}', project));
  if (flavor === 'claude') {
    const cur = present('CLAUDE.md');
    if (cur == null) put('CLAUDE.md', src('claude/CLAUDE.md'));
    else if (/^\s*@AGENTS\.md\s*$/m.test(cur)) acts.push({ rel: 'CLAUDE.md', op: 'keep' });
    else acts.push({ rel: 'CLAUDE.md', op: 'note', text: 'CLAUDE.md가 이미 있다 — 한 줄 `@AGENTS.md`를 더해 AGENTS.md를 읽게 하라' });
    const ours = JSON.parse(src('claude/settings.json'));
    const curS = present('.claude/settings.json');
    if (curS == null) put('.claude/settings.json', JSON.stringify(ours, null, 2) + '\n');
    else {
      let ex = null; try { ex = JSON.parse(curS.replace(/^﻿/, '')); } catch { ex = null; }
      if (!ex || typeof ex !== 'object') acts.push({ rel: '.claude/settings.json', op: 'note', text: '.claude/settings.json이 JSON이 아니다 — permissions.allow에 kit 두 줄을 손으로 더하라' });
      else { const merged = mergeAllow(ex, ours); acts.push(merged ? { rel: '.claude/settings.json', op: 'merge', text: JSON.stringify(merged, null, 2) + '\n' } : { rel: '.claude/settings.json', op: 'keep' }); }
    }
  } else {
    for (const a of OPENCODE_AGENTS) put(`.opencode/agents/${a}.md`, src(`opencode/agents/${a}.md`));
  }
  const gi = present('.gitignore');
  if (gi == null) put('.gitignore', 'kit/log/\n');
  else if (/^\/?kit\/log\/?\s*$/m.test(gi)) acts.push({ rel: '.gitignore', op: 'keep' });
  else acts.push({ rel: '.gitignore', op: 'append', text: (gi.endsWith('\n') || !gi ? '' : '\n') + 'kit/log/\n' });
  return acts;
}
export function summary(flavor, project, acts) {
  const n = (op) => acts.filter((a) => a.op === op).length;
  const head = `INSTALLED kit ${flavor} → ${project} — 썼다 ${n('write') + n('merge') + n('append')} · 두었다 ${n('keep')}`;
  return [head, ...acts.filter((a) => a.op === 'note').map((a) => `- ${a.text}`)].join('\n');
}
function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.error) { process.stdout.write(`FAIL install ${a.error}\n`); process.exit(1); }
  const kit = path.dirname(fileURLToPath(import.meta.url));
  const project = path.resolve(a.project);
  fs.mkdirSync(project, { recursive: true });
  const present = (rel) => { const p = path.join(project, rel); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
  const src = (name) => fs.readFileSync(path.join(kit, name), 'utf8');
  const acts = plan(a.flavor, { present, src, project: path.basename(project) });
  for (const act of acts) {
    if (a.dry) { process.stdout.write(`  [dry] ${act.op} ${act.rel}\n`); continue; }
    const p = path.join(project, act.rel);
    if (act.op === 'write' || act.op === 'merge') { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, act.text); }
    else if (act.op === 'append') fs.appendFileSync(p, act.text);
  }
  process.stdout.write(summary(a.flavor, project, acts) + '\n');
  if (!a.dry) process.stdout.write('다음: AGENTS.md의 지도와 kit/check.json의 층별 명령을 채운다 — 세션을 열고 「kit/check.json을 채워」라고 해도 된다.\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
