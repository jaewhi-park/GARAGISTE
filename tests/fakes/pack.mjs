// 가짜 팩 — 모델 0으로 팩이 할 일을 그대로 한다(conduct.mjs의 --spawner 시험용). 환경: GARAGISTE_PACK·GARAGISTE_SLUG·GARAGISTE_WORKTREE(conduct가 준다).
// 출력은 `claude -p --output-format json`의 꼴(result·usage·duration_ms·total_cost_usd·num_turns·subtype) — 드라이버가 토큰·분·비용을 읽는 길이 같다.
// GARAGISTE_FAKE_MODE: normal(기본) · idle(아무것도 하지 않는다 — 진전 없음·FAIL 되풀이 재현) · return(build가 `spec:` 반려 줄을 남긴다) · crash(exit 1·is_error) · hang(20초 멈춤) · break(refactor build가 동작을 바꾼다)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const pack = process.env.GARAGISTE_PACK; const slug = process.env.GARAGISTE_SLUG; const wt = process.env.GARAGISTE_WORKTREE;
const mode = process.env.GARAGISTE_FAKE_MODE || 'normal';
const main = process.cwd(); // conduct는 메인 루트에서 띄운다
const tokens = Number(process.env.GARAGISTE_FAKE_TOKENS || 1200);
// unit의 정체(kind)는 unit 상태가 말한다 — refactor면 핀·구조·바뀐 동작의 흐름(7라운드)
const unit = (() => { try { return JSON.parse(fs.readFileSync(path.join(main, '.garagiste', 'units', `${slug}.json`), 'utf8')); } catch { return null; } })();
const refactor = unit?.kind === 'refactor';
const script = (name, args, cwd = wt) => spawnSync(process.execPath, [path.join(main, '.garagiste', 'scripts', `${name}.mjs`), ...args], { cwd, encoding: 'utf8' });
const git = (args) => spawnSync('git', args, { cwd: wt, encoding: 'utf8' });
const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(wt, rel)), { recursive: true }); fs.writeFileSync(path.join(wt, rel), text); };
const commit = (msg) => { git(['add', '-A']); const v = script('verify', ['quick']); const c = git(['commit', '-q', '-m', msg]); return `${v.stdout.trim().split('\n')[0]} · commit ${c.status}`; };
const emit = (result, extra = {}) => process.stdout.write(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, duration_ms: 3000, num_turns: 3, total_cost_usd: 0.01, usage: { input_tokens: tokens - 200, output_tokens: 200 }, result, ...extra }) + '\n');

if (mode === 'hang') { setTimeout(() => { emit('늦게 끝났다'); process.exit(0); }, 20000); await new Promise(() => {}); } // 팩이 멈췄다 — conduct의 시간 상한이 끊는다
if (mode === 'crash') { emit('팩이 죽었다', { is_error: true, subtype: 'error_during_execution' }); process.exit(1); }
if (mode === 'idle') { emit(`${pack} ${slug}: 아무것도 하지 않았다`); process.exit(0); }
const lines = [];
if (refactor && pack === 'spec') {
  // 현재 동작의 핀 — base에서도 초록. 구조(함수 꼴)는 고정하지 않는다
  write(`tests/acceptance/${slug}.test.mjs`, `// @claim 현재 동작: greet <이름> → "hi <이름>", 이름 없으면 "hi there"\n// @milestone M1\n// @sensor machine@linux\nimport test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('핀: greet Ada → hi Ada', () => { const r = spawnSync(process.execPath, ['bin/greet.js', 'Ada'], { encoding: 'utf8' }); assert.equal(r.status, 0); assert.equal(r.stdout, 'hi Ada\\n'); });\ntest('핀: greet → hi there', () => { assert.equal(spawnSync(process.execPath, ['bin/greet.js'], { encoding: 'utf8' }).stdout, 'hi there\\n'); });\n`);
  write(`docs/units/${slug}/try.md`, '명령: `node bin/greet.js Ada`\n기대: `hi Ada` (전과 같다)\n');
  write(`docs/units/${slug}/surface.md`, 'CLI 인자 하나 → stdout 한 줄 — 동작 그대로\n');
  lines.push(commit(`test(${slug}): 현재 동작의 핀`), script('redproof', [slug]).stdout.trim(), '핀 2 · human 0 · 질문 0');
} else if (refactor && pack === 'build') {
  // 구조만 바꾼다(화살표 → 함수 선언 + 상수). break 모드는 기본 인사말을 바꿔 동작을 깨뜨린다 — 기존 테스트(greet('Bo'))는 살고 핀(greet → hi there)만 죽는다
  const broken = mode === 'break';
  write('lib/greet.js', `'use strict';\nconst DEFAULT = '${broken ? 'friend' : 'there'}';\nfunction greet(n) { return ['hi', n || DEFAULT].join(' '); }\nmodule.exports = { greet };\n`);
  lines.push(commit(`refactor(${slug}): greet를 함수 선언으로\n\nUnit: ${slug}\nStep: 1`));
  if (fs.existsSync(path.join(wt, 'tests', 'adversary', `${slug}-1.test.mjs`))) lines.push(script('verify', ['attack', slug]).stdout.trim());
  lines.push(script('redproof', [slug]).stdout.trim(), script('verify', ['full']).stdout.trim().split('\n')[0]);
} else if (refactor && pack === 'attack') {
  // 공격의 목표는 바뀐 동작 — 빈 문자열 이름은 base처럼 there. 커밋도 full도 하지 않는다(실제 attack 팩처럼 — 체크포인트가 wip로 담고 ship이 승격한다)
  write(`tests/adversary/${slug}-1.test.mjs`, `import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('빈 문자열 이름은 base처럼 there', () => { assert.equal(spawnSync(process.execPath, ['bin/greet.js', ''], { encoding: 'utf8' }).stdout, 'hi there\\n'); });\n`);
  lines.push(script('verify', ['attack', slug]).stdout.trim(), '테스트 1 · red 0 · 바뀐 동작 없음');
} else if (pack === 'spec') {
  write(`tests/acceptance/${slug}.test.mjs`, `// @claim 이름을 주면 "hello <이름>"을 출력한다\n// @milestone M1\n// @sensor machine@linux\nimport test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('hello Ada', () => { const r = spawnSync(process.execPath, ['src/cli.mjs', 'Ada'], { encoding: 'utf8' }); assert.equal(r.status, 0); assert.equal(r.stdout.trim(), 'hello Ada'); });\n`);
  write(`docs/units/${slug}/try.md`, '명령: `node src/cli.mjs Ada`\n기대: `hello Ada`\n');
  write(`docs/units/${slug}/surface.md`, 'CLI 인자 하나 → stdout 한 줄\n');
  lines.push(commit(`test(${slug}): red 주장`), script('redproof', [slug]).stdout.trim(), '쓴 파일 3 · 주장 1 · human 0 · 질문 0');
} else if (pack === 'build') {
  const adversary = fs.existsSync(path.join(wt, 'tests', 'adversary', `${slug}-1.test.mjs`));
  if (mode === 'return' && !adversary) { emit(`커밋 0 · verify full 안 돌림\nspec: 인수 테스트가 서로 어긋난다 — 이름 없는 경우의 출력이 정해지지 않았다`); process.exit(0); }
  write('src/cli.mjs', adversary ? "const n = process.argv[2]; process.stdout.write(n ? `hello ${n}\\n` : 'hello\\n');\n" : "process.stdout.write(`hello ${process.argv[2] ?? ''}\\n`);\n");
  lines.push(commit(`${adversary ? 'fix' : 'feat'}(${slug}): ${adversary ? '이름 없을 때' : '인사'}\n\nUnit: ${slug}\nStep: ${adversary ? 2 : 1}\nProven: hello Ada`));
  if (adversary) lines.push(script('verify', ['attack', slug]).stdout.trim());
  lines.push(script('redproof', [slug]).stdout.trim(), script('verify', ['full']).stdout.trim().split('\n')[0]);
} else if (pack === 'attack') {
  write(`tests/adversary/${slug}-1.test.mjs`, `import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('이름이 없으면 hello만 (끝 공백 없음)', () => { const r = spawnSync(process.execPath, ['src/cli.mjs'], { encoding: 'utf8' }); assert.equal(r.stdout, 'hello\\n'); });\n`);
  lines.push(commit(`test(${slug}): adversary`), script('verify', ['attack', slug]).stdout.trim(), '테스트 1 · red 1 · 이름 없을 때 끝 공백');
} else if (pack === 'adopt') {
  // 기존 코드(bin/greet.js)의 현재 동작을 특성화 테스트로 — 소스는 건드리지 않는다
  write('tests/unit/adopt-greet.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('특성화: greet Ada → hi Ada', () => { const r = spawnSync(process.execPath, ['bin/greet.js', 'Ada'], { encoding: 'utf8' }); assert.equal(r.status, 0); assert.equal(r.stdout.trim(), 'hi Ada'); });\n");
  write('.gitattributes', '* text=auto eol=lf\n');
  lines.push(script('work', ['commands', 'quick=node --test tests/unit/*.test.mjs test/*.test.js', 'full=node --test tests/unit/*.test.mjs test/*.test.js', 'test_file=node --test {files}', 'run=node bin/greet.js', 'setup=npm install']).stdout.trim());
  lines.push(script('work', ['rules', 'project=greet', 'one_line=인사 CLI']).stdout.trim());
  lines.push(commit(`adopt(${slug}): node:test — 특성화 1\n\nUnit: ${slug}\nStep: 1`), script('verify', ['full']).stdout.trim().split('\n')[0], '특성화 테스트 1 · 명령 넷 · 질문 0');
} else if (pack === 'boot') {
  write('package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write('src/cli.mjs', "process.stdout.write('hello\\n');\n");
  write('tests/unit/smoke.test.mjs', "import test from 'node:test'; import { spawnSync } from 'node:child_process'; import assert from 'node:assert/strict'; test('smoke', () => assert.equal(spawnSync(process.execPath, ['src/cli.mjs']).status, 0));\n");
  lines.push(script('work', ['commands', 'quick=node --test "tests/unit/**/*.test.mjs"', 'full=node --test "tests/**/*.test.mjs"', 'test_file=node --test {files}', 'run=node src/cli.mjs', 'setup=npm install']).stdout.trim());
  lines.push(commit(`scaffold(boot): node 스모크\n\nUnit: ${slug}\nStep: 1`), script('verify', ['full']).stdout.trim().split('\n')[0]);
} else { emit(`모르는 팩 ${pack}`, { is_error: true, subtype: 'error' }); process.exit(1); }
emit(lines.filter(Boolean).join('\n'));
