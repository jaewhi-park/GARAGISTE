// selftest — 이 기계에서 기계 루프가 닫히는가. 임시 저장소에 이 프로젝트의 팀 파일을 복사해 boot unit을 끝까지 돌린다(모델 0 · 네트워크 0 · 30초).
// 실패하면 그 단계의 출력을 그대로 보여 준다 — 그 출력을 붙여 주면 원인을 안다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { scriptRoot } from './lib.mjs';

const root = process.env.CLAUDE_PROJECT_DIR || scriptRoot(import.meta.url);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-selftest-'));
const env = { ...process.env, GIT_AUTHOR_NAME: 'selftest', GIT_AUTHOR_EMAIL: 'selftest@local', GIT_COMMITTER_NAME: 'selftest', GIT_COMMITTER_EMAIL: 'selftest@local' };
delete env.NODE_TEST_CONTEXT; delete env.NODE_OPTIONS;
const steps = [];
function run(name, cmd, args, cwd, extraEnv = {}, input) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...env, ...extraEnv }, input });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  return { name, status: r.status, out };
}
function step(name, fn, expect) {
  const r = fn();
  const ok = expect ? expect(r) : r.status === 0;
  steps.push({ name, ok });
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) { process.stdout.write(`--- 출력 ---\n${r.out}\n--- 끝 ---\nSELFTEST FAIL at "${name}" · 임시 폴더: ${tmp}\n`); process.exit(1); }
  return r;
}
const copy = (rel) => { const s = path.join(root, rel); if (!fs.existsSync(s)) return; fs.cpSync(s, path.join(tmp, rel), { recursive: true }); };
const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true }); fs.writeFileSync(path.join(tmp, rel), text); };
const script = (name, args, cwd = tmp, extraEnv) => run(name, process.execPath, [path.join(cwd, '.garagiste', 'scripts', `${name}.mjs`), ...args], cwd, extraEnv);
const git = (args, cwd = tmp, extraEnv) => run('git', 'git', args, cwd, extraEnv);

process.stdout.write(`SELFTEST node ${process.versions.node} ${process.platform} · 팀 파일 원본: ${root}\n`);
step('git init', () => git(['init', '-q', '-b', 'main']));
for (const rel of ['.garagiste', '.claude', '.githooks', '.gitignore', 'CLAUDE.md', 'AGENTS.md', 'opencode.json', '.opencode']) copy(rel);
for (const rel of ['.garagiste/ledger', '.garagiste/session', '.garagiste/units', '.garagiste/scope.json']) fs.rmSync(path.join(tmp, rel), { recursive: true, force: true });
// 임시 저장소는 명령이 비어 있어야 boot의 길을 그대로 밟는다
const teamPath = path.join(tmp, '.garagiste', 'team.json');
const team = JSON.parse(fs.readFileSync(teamPath, 'utf8').replace(/^﻿/, ''));
team.commands = { quick: '', full: '', test_file: '', run: '' }; team.protected_branch = 'main';
fs.writeFileSync(teamPath, JSON.stringify(team, null, 2) + '\n');
if (!fs.existsSync(path.join(tmp, 'CLAUDE.md'))) write('CLAUDE.md', '# {{PROJECT}}\n{{ONE_LINE}}\n\n## Commands\n- quick: {{QUICK}}\n- full: {{FULL}}\n- test one file: {{TEST_FILE}}\n- run: {{RUN}}\n');
step('hooksPath', () => git(['config', 'core.hooksPath', '.githooks']));
try { fs.chmodSync(path.join(tmp, '.githooks', 'pre-commit'), 0o755); } catch { /* Windows */ }
step('훅 실행 비트 (원본 저장소의 인덱스)', () => git(['ls-files', '-s', '.githooks/pre-commit'], root), (r) => r.status === 0 && (r.out.startsWith('100755') || r.out === ''));
step('첫 커밋 (HEAD 없음 → 게이트 통과)', () => { git(['add', '-A']); git(['update-index', '--chmod=+x', '.githooks/pre-commit']); return git(['commit', '-q', '-m', 'scaffold(team): selftest'], tmp, { GARAGISTE_SHIP: '1' }); });
step('doctor (commands 비어 있음은 정상)', () => script('doctor', []), (r) => /commands\.quick 비어 있음/.test(r.out));
step('work brief', () => script('work', ['brief', 'selftest: 터미널에서 hello를 출력하는 도구']), (r) => /^BRIEF/.test(r.out));
step('work add boot', () => script('work', ['add', 'boot', '터미널에서 hello를 출력하는 도구', '--milestone', 'M1', '--accept', '진입점이 뜨고 quick·full이 PASS', '--kind', 'scaffold']), (r) => /^ADD boot/.test(r.out));
step('work scope', () => script('work', ['scope', '--milestone', 'M1']), (r) => /^SCOPE/.test(r.out));
step('work seed → boot worktree', () => script('work', ['seed']), (r) => /^UNIT boot boot/.test(r.out));
const wt = path.join(tmp, '.worktrees', 'boot');
// 드라이버까지 설치의 일부다(R&D 2026-10-04): next 한 걸음(brief boot)을 conduct가 그대로 실행하고 --once에서 멈춘다(exit 5) — 잠금·STATUS·원장 줄까지
// opencode만 깔린 설치본엔 기본 spawner(claude -p --agent)가 서지 않아 conduct가 한 줄로 선다(5라운드) — selftest의 한 걸음은 spawn이 없으니 자리 채움 템플릿(돌면 exit 1 → 비정상 종료로 드러난다)
const spawnerArgs = fs.existsSync(path.join(tmp, '.claude', 'settings.json')) ? [] : ['--spawner', 'node -e process.exit(1) {path}'];
step('conduct --once (한 걸음: brief boot → STOP cap)', () => script('conduct', ['--once', ...spawnerArgs]), (r) => r.status === 5 && /^NEXT run .*brief\.mjs boot boot/m.test(r.out) && /STOP cap/.test(r.out) && !fs.existsSync(path.join(tmp, '.garagiste', 'session', 'conduct.json')));
step('brief boot', () => script('brief', ['boot', 'boot']), (r) => /^PACK/.test(r.out));
write('.worktrees/boot/src/cli.mjs', "process.stdout.write('hello\\n');\n");
write('.worktrees/boot/tests/unit/smoke.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('entry starts', () => { assert.equal(spawnSync(process.execPath, ['src/cli.mjs'], { encoding: 'utf8' }).status, 0); });\n");
step('work commands (worktree)', () => script('work', ['commands', 'quick=node --test tests/unit/smoke.test.mjs', 'full=node --test "tests/**/*.test.mjs"', 'test_file=node --test {file}', 'run=node src/cli.mjs'], wt), (r) => /^COMMANDS/.test(r.out));
step('work rules', () => script('work', ['rules', 'project=selftest', 'one_line=hello 도구'], wt), (r) => /^RULES/.test(r.out));
step('verify quick (worktree)', () => script('verify', ['quick'], wt), (r) => /^PASS verify:quick/.test(r.out));
step('커밋 게이트 (원장 ↔ tree)', () => { git(['add', '-A'], wt); return git(['commit', '-q', '-m', 'scaffold(boot): selftest\n\nUnit: boot\nStep: 1'], wt); });
step('게이트가 원장 없는 커밋을 거부', () => { write('.worktrees/boot/src/extra.mjs', '// x\n'); git(['add', '-A'], wt); const r = git(['commit', '-q', '-m', 'x'], wt); fs.rmSync(path.join(wt, 'src', 'extra.mjs')); git(['add', '-A'], wt); return r; }, (r) => r.status !== 0 && /원장/.test(r.out));
step('verify full (worktree)', () => script('verify', ['full'], wt), (r) => /^PASS verify:full/.test(r.out));
step('ship boot (8조건)', () => script('ship', ['boot']), (r) => /^SHIPPED boot/.test(r.out));
step('main에 명령이 채워짐', () => ({ status: 0, out: fs.readFileSync(teamPath, 'utf8') }), (r) => /node --test tests\/unit\/smoke/.test(r.out));
step('state', () => script('state', ['--brief']), (r) => /^실행:/.test(r.out));
// 5라운드(2026-10-04, Q9 「opencode 환경에서 selftest」): L1 배선이 산다 — 거부 1건. 훅·플러그인은 조용히 죽고 doctor는 파일·경로만 본다 — 설치 때 실제로 한 번 거부시킨다.
const ledgerTarget = path.join(tmp, '.garagiste', 'ledger', 'evidence.jsonl');
if (fs.existsSync(path.join(tmp, '.claude', 'hooks', 'guard.mjs'))) step('guard 훅(claude)이 원장 쓰기를 거부', () => run('guard', process.execPath, [path.join(tmp, '.claude', 'hooks', 'guard.mjs')], tmp, { CLAUDE_PROJECT_DIR: tmp }, JSON.stringify({ tool_name: 'Write', tool_input: { file_path: ledgerTarget }, cwd: tmp })), (r) => r.status === 0 && /"permissionDecision":"deny"/.test(r.out));
if (fs.existsSync(path.join(tmp, '.opencode', 'plugins', 'guard.ts'))) {
  const [maj, min] = process.versions.node.split('.').map(Number);
  if (maj > 22 || (maj === 22 && min >= 6)) {
    const probe = `const { Guard } = await import(${JSON.stringify(pathToFileURL(path.join(tmp, '.opencode', 'plugins', 'guard.ts')).href)}); const h = await Guard({ directory: ${JSON.stringify(tmp)} }); try { await h['tool.execute.before']({ tool: 'write', sessionID: 's', callID: 'c' }, { args: { filePath: ${JSON.stringify(ledgerTarget)} } }); console.log('ALLOWED'); } catch (e) { console.log(e.message); }`;
    step('guard 플러그인(opencode)이 원장 쓰기를 거부', () => run('guard.ts', process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', probe], tmp), (r) => /\[guard\] /.test(r.out) && !/ALLOWED/.test(r.out));
  } else process.stdout.write(`SKIP guard 플러그인(opencode) — node ${process.versions.node} < 22.6은 .ts를 못 돈다(플러그인은 opencode의 bun이 돈다)\n`);
}
process.stdout.write(`SELFTEST PASS ${steps.length}/${steps.length} · 임시 폴더: ${tmp}\n`);
