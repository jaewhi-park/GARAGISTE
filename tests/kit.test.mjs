// kit(v3) — 판단 없는 함수들이 정한 대로 하는가 · 설치 → check가 임시 저장소에서 한 줄을 내는가. 모델 0 · 네트워크 0.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { candidates, isTestFile, parsePorcelain, slots, testsFor } from '../kit/scripts/tests-for.mjs';
import { discount, firstFrame, layerCommand, parseFailures, parseFlaky, plan as checkPlan, resultLine } from '../kit/scripts/check.mjs';
import { GLOBAL_MARK, mergeAllow, parseArgs, plan as installPlan, planGlobal, summary } from '../kit/install.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(HERE, '..', 'kit');
const ENV = { ...process.env };
delete ENV.NODE_TEST_CONTEXT; delete ENV.NODE_OPTIONS; delete ENV.CLAUDE_PROJECT_DIR; // 중첩 node --test는 exit code를 바꾼다
const run = (args, cwd) => { const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: ENV }); return { status: r.status, out: r.stdout || '', err: r.stderr || '' }; };
const write = (root, rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const tmp = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `kit-${name}-`));
const install = (flavor, repo, extra = []) => run([path.join(KIT, 'install.mjs'), flavor, '--project', repo, ...extra], repo);
const check = (repo, ...args) => run([path.join(repo, 'kit', 'check.mjs'), ...args], repo);

// ── tests-for
test('tests-for: 슬롯과 후보 — 폴더 옆 · tests 거울 · 뿌리 파일엔 앞 슬래시 없음', () => {
  assert.deepEqual(slots('src/foo/bar.ts'), { dir: 'src/foo', rel: 'foo', name: 'bar', ext: 'ts' });
  const c = candidates('src/foo/bar.ts');
  for (const want of ['src/foo/bar.test.ts', 'src/foo/bar.spec.ts', 'src/foo/__tests__/bar.test.ts', 'tests/foo/bar.test.ts', 'tests/bar.test.mjs', 'tests/foo/test_bar.py', 'src/foo/bar_test.go']) assert.ok(c.includes(want), want);
  const r = candidates('index.js');
  assert.ok(r.includes('index.test.js') && r.includes('tests/index.test.js'), r.join(' '));
  assert.ok(r.every((x) => !x.startsWith('/') && !x.includes('//')), r.join(' '));
  assert.ok(!candidates('a.test.js').includes('a.test.js'), '자기 자신은 후보가 아니다');
});
test('tests-for: 테스트 파일은 이름 꼴로만 본다', () => {
  for (const f of ['tests/a.test.mjs', 'src/x.spec.ts', 'tests/test_x.py', 'pkg/x_test.go', 'tests\\win.test.js']) assert.ok(isTestFile(f), f);
  for (const f of ['src/x.ts', 'tests/fixtures/a.json', 'test_data.csv', 'tests/helpers.mjs']) assert.ok(!isTestFile(f), f);
});
test('tests-for: 매핑 — 디스크에 있는 것만 · 테스트 자체는 그대로 · 없으면 unmapped · 중복 없음', () => {
  const disk = new Set(['tests/foo/bar.test.ts', 'src/baz.test.ts', 'tests/a.test.mjs']);
  const r = testsFor(['src/foo/bar.ts', 'src/baz.ts', 'src/none.ts', 'tests/a.test.mjs', 'tests/gone.test.mjs', 'src/foo/bar.ts'], undefined, (p) => disk.has(p));
  assert.deepEqual(r.tests, ['tests/foo/bar.test.ts', 'src/baz.test.ts', 'tests/a.test.mjs']);
  assert.deepEqual(r.unmapped, ['src/none.ts']);
});
test('tests-for: git porcelain — 이름 바꿈은 새 이름 · 지워진 것은 빼고 · 따옴표는 벗긴다', () => {
  assert.deepEqual(parsePorcelain(' M src/a.js\n?? new.js\nR  old.js -> new2.js\n D gone.js\nA  "sp ace.js"\n'), ['src/a.js', 'new.js', 'new2.js', 'sp ace.js']);
});

// ── check: 계획
test('check: 층 명령 — 빈 명령은 사유 · module은 {files} 자리 · 공백 경로는 따옴표', () => {
  assert.match(layerCommand({ layers: { quick: '' } }, 'quick').error, /layers\.quick 비어 있음/);
  assert.match(layerCommand({ layers: { module: 'npm test' } }, 'module', ['a']).error, /\{files\}/);
  assert.equal(layerCommand({ layers: { module: 'node --test {files}' } }, 'module', ['tests/a.test.mjs', 'tests/b c.test.mjs']).cmd, 'node --test tests/a.test.mjs "tests/b c.test.mjs"');
  assert.equal(layerCommand({ layers: { full: 'npm test' } }, 'full').cmd, 'npm test');
});
test('check: plan — module에 매핑이 없으면 full로 내려가며 사실을 적는다 · 모르는 층은 사유', () => {
  const cfg = { layers: { module: 'node --test {files}', full: 'node --test "tests/*.test.mjs"' } };
  const p1 = checkPlan(cfg, 'module', ['src/a.js'], { tests: ['tests/a.test.js'], unmapped: [] });
  assert.equal(p1.layer, 'module'); assert.equal(p1.cmd, 'node --test tests/a.test.js'); assert.equal(p1.note, undefined);
  const p2 = checkPlan(cfg, 'module', ['src/a.js', 'src/b.js'], { tests: ['tests/a.test.js'], unmapped: ['src/b.js'] });
  assert.equal(p2.layer, 'module'); assert.equal(p2.note, '매핑 없음: src/b.js');
  const p3 = checkPlan(cfg, 'module', ['src/b.js'], { tests: [], unmapped: ['src/b.js'] });
  assert.equal(p3.layer, 'full'); assert.equal(p3.note, '매핑 없음: src/b.js · module → full');
  const p4 = checkPlan(cfg, 'module', [], { tests: [], unmapped: [] });
  assert.equal(p4.layer, 'full'); assert.equal(p4.note, '변경 파일 없음 · module → full');
  assert.match(checkPlan(cfg, 'smoke', [], { tests: [], unmapped: [] }).error, /층은 quick \| module \| full/);
});

// ── check: 실패 파싱
const TAP = `TAP version 13
# Subtest: adds
ok 1 - adds
  ---
  duration_ms: 2.5
  ...
# Subtest: suite
    # Subtest: inner fails
    not ok 1 - inner fails
      ---
      duration_ms: 2.0
      location: '/r/tests/s.test.mjs:4:3'
      failureType: 'testCodeFailure'
      error: |-
        Expected values to be strictly equal:

        2 !== 3
      code: 'ERR_ASSERTION'
      expected: 3
      actual: 2
      operator: 'strictEqual'
      stack: |-
        TestContext.<anonymous> (file:///r/tests/s.test.mjs:4:35)
        Test.runInAsyncScope (node:async_hooks:214:14)
      ...
    1..1
not ok 2 - suite
  ---
  duration_ms: 3
  type: 'suite'
  location: '/r/tests/s.test.mjs:2:1'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  ...
# Subtest: throws
not ok 3 - throws
  ---
  location: '/r/tests/s.test.mjs:9:1'
  failureType: 'testCodeFailure'
  error: 'boom'
  code: 'ERR_TEST_FAILURE'
  stack: |-
    TestContext.<anonymous> (file:///r/tests/s.test.mjs:9:30)
  ...
1..3
# fail 2
`;
test('check: node:test TAP — 이름 · 기대 · 실제 · 위치(root 상대) · 부모 subtestsFailed는 버린다 · 메시지', () => {
  const f = parseFailures(TAP, { root: '/r' });
  assert.deepEqual(f.map((x) => x.name), ['inner fails', 'throws']);
  assert.equal(f[0].expected, '3'); assert.equal(f[0].actual, '2'); assert.equal(f[0].frame, 'tests/s.test.mjs:4');
  assert.equal(f[1].expected, null); assert.equal(f[1].message, 'boom'); assert.equal(f[1].frame, 'tests/s.test.mjs:9');
});
test('check: node:test spec 리포터 — 요약의 되풀이는 하나로 · 쉼표 붙은 값', () => {
  const SPEC = `✖ fails here (1.2ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  2 !== 3

      at TestContext.<anonymous> (file:///r/tests/a.test.mjs:4:35)
      at Test.runInAsyncScope (node:async_hooks:214:14)
  {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 2,
    expected: 3,
    operator: 'strictEqual'
  }
ℹ tests 3
ℹ fail 1
✖ failing tests:

test at tests/a.test.mjs:4:1
✖ fails here (1.2ms)
`;
  const f = parseFailures(SPEC, { root: '/r' });
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].name, f[0].expected, f[0].actual, f[0].frame], ['fails here', '3', '2', 'tests/a.test.mjs:4']);
});
test('check: jest · vitest · pytest · go 꼴', () => {
  const JEST = ` FAIL  tests/sum.test.js
  ● sum › adds

    expect(received).toBe(expected) // Object.is equality

    Expected: 3
    Received: 2

      3 |   test('adds', () => {
    > 4 |     expect(sum(1, 1)).toBe(3);
        |                       ^

      at Object.<anonymous> (tests/sum.test.js:4:23)
`;
  let f = parseFailures(JEST);
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].name, f[0].expected, f[0].actual, f[0].frame], ['sum › adds', '3', '2', 'tests/sum.test.js:4']);

  const VITEST = ` FAIL  tests/sum.test.ts > sum > adds
AssertionError: expected 2 to be 3 // Object.is equality

- Expected
+ Received

- 3
+ 2

 ❯ tests/sum.test.ts:5:21
`;
  f = parseFailures(VITEST);
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].name, f[0].expected, f[0].message, f[0].frame], ['tests/sum.test.ts > sum > adds', null, 'expected 2 to be 3 // Object.is equality', 'tests/sum.test.ts:5']);

  const PYTEST = `============================= FAILURES =============================
_____________________________ test_add _____________________________

    def test_add():
>       assert add(1, 1) == 3
E       assert 2 == 3
E        +  where 2 = add(1, 1)

tests/test_calc.py:5: AssertionError
========================= short test summary info ==========================
FAILED tests/test_calc.py::test_add - assert 2 == 3
`;
  f = parseFailures(PYTEST);
  assert.equal(f.length, 1, JSON.stringify(f));
  assert.deepEqual([f[0].name, f[0].message, f[0].frame], ['test_add', 'assert 2 == 3', 'tests/test_calc.py:5']);

  const GO = `--- FAIL: TestAdd (0.00s)
    calc_test.go:12: expected 3, got 2
FAIL
FAIL    example.com/calc    0.002s
`;
  f = parseFailures(GO);
  assert.equal(f.length, 1, JSON.stringify(f));
  assert.deepEqual([f[0].name, f[0].message, f[0].frame], ['TestAdd', 'expected 3, got 2', 'calc_test.go:12']);
});
test('check: 모르는 꼴은 빈 목록 · ANSI는 벗긴다', () => {
  assert.deepEqual(parseFailures('Everything is fine\nexit 1\n'), []);
  const f = parseFailures('\x1b[31m● a › b\x1b[0m\n    Expected: \x1b[32m1\x1b[0m\n    Received: 2\n');
  assert.deepEqual([f[0].name, f[0].expected, f[0].actual], ['a › b', '1', '2']);
});
test('check: firstFrame — node_modules · node: 는 건너뛰고 · root 상대 · 역슬래시', () => {
  assert.equal(firstFrame('    at x (/r/node_modules/lib/index.js:1:1)', { root: '/r' }), null);
  assert.equal(firstFrame('    at Test.run (node:internal/test_runner/test:1047:25)'), null);
  assert.equal(firstFrame("  location: 'C:\\\\r\\\\tests\\\\a.test.mjs:4:1'", { root: 'C:\\r' }), 'tests/a.test.mjs:4');
  assert.equal(firstFrame('tests/test_calc.py:5: AssertionError'), 'tests/test_calc.py:5');
});

// ── check: 격리와 한 줄
test('check: flaky.txt — 주석 · 빈 줄 · 이유 · 이름 또는 파일의 부분 일치', () => {
  const q = parseFlaky('# 머리말\n\nretry  # 2026-10-31 타이머 경합\ntests/net/\n');
  assert.deepEqual(q.map((x) => x.pattern), ['retry', 'tests/net/']);
  assert.equal(q[0].reason, '2026-10-31 타이머 경합');
  const { kept, quarantined } = discount([{ name: 'retry twice', frame: 'tests/a.test.mjs:1' }, { name: 'ok', frame: 'tests/net/x.test.mjs:3' }, { name: 'real', frame: 'tests/b.test.mjs:2' }], q);
  assert.deepEqual(kept.map((x) => x.name), ['real']);
  assert.deepEqual(quarantined.map((x) => x.name), ['retry twice', 'ok']);
});
test('check: 결과 줄 — PASS · 전부 격리면 PASS 격리 n · FAIL 필드 · 둘째부터는 +n · 모르는 꼴은 exit', () => {
  assert.equal(resultLine({ layer: 'module', exit: 0 }), 'PASS module');
  assert.equal(resultLine({ layer: 'full', exit: 1, quarantined: [{}], note: 'module → full' }), 'PASS full 격리 1 (module → full)');
  assert.equal(resultLine({ layer: 'module', exit: 1, failures: [{ name: 'inner fails', expected: '3', actual: '2', frame: 'tests/s.test.mjs:4' }], log: 'kit/log/x.log' }), 'FAIL module inner fails 기대=3 실제=2 at tests/s.test.mjs:4 log=kit/log/x.log');
  assert.equal(resultLine({ layer: 'module', exit: 1, failures: [{ name: 'throws', message: 'boom' }, { name: 'b' }], quarantined: [{}], log: 'l' }), 'FAIL module throws 이유=boom +1 격리 1 log=l');
  assert.equal(resultLine({ layer: 'quick', exit: 2, log: 'kit/log/q.log' }), 'FAIL quick exit=2 log=kit/log/q.log');
});

// ── install: 계획
test('install: 계획 — 소유 파일은 write · 첫 설치 파일은 keep · CLAUDE.md에 @AGENTS.md 없으면 note · settings는 allow만 합침 · gitignore append', () => {
  const src = (name) => fs.readFileSync(path.join(KIT, name), 'utf8');
  const fresh = installPlan('claude', { present: () => null, src, project: 'demo' });
  const ops = Object.fromEntries(fresh.map((a) => [a.rel, a.op]));
  assert.deepEqual(ops, { 'kit/check.mjs': 'write', 'kit/tests-for.mjs': 'write', 'kit/check.json': 'write', 'kit/flaky.txt': 'write', 'AGENTS.md': 'write', 'CLAUDE.md': 'write', '.claude/settings.json': 'write', '.gitignore': 'write' });
  assert.match(fresh.find((a) => a.rel === 'AGENTS.md').text, /^# demo\n/);
  const have = { 'AGENTS.md': '# mine', 'kit/check.json': '{}', 'CLAUDE.md': '# rules\n', '.claude/settings.json': '{"permissions":{"allow":["Bash(npm test:*)"],"deny":["Read(./.env)"]}}', '.gitignore': 'node_modules/' };
  const again = installPlan('claude', { present: (rel) => have[rel] ?? null, src, project: 'demo' });
  const ops2 = Object.fromEntries(again.map((a) => [a.rel, a.op]));
  assert.equal(ops2['AGENTS.md'], 'keep'); assert.equal(ops2['kit/check.json'], 'keep'); assert.equal(ops2['kit/check.mjs'], 'write');
  assert.equal(ops2['CLAUDE.md'], 'note'); assert.equal(ops2['.claude/settings.json'], 'merge'); assert.equal(ops2['.gitignore'], 'append');
  const merged = JSON.parse(again.find((a) => a.rel === '.claude/settings.json').text);
  assert.deepEqual(merged.permissions.allow, ['Bash(npm test:*)', 'Bash(node kit/check.mjs:*)', 'Bash(node kit/tests-for.mjs:*)']);
  assert.deepEqual(merged.permissions.deny, ['Read(./.env)']);
  assert.equal(again.find((a) => a.rel === '.gitignore').text, '\nkit/log/\n');
  const oc = installPlan('opencode', { present: () => null, src, project: 'demo' });
  assert.deepEqual(oc.filter((a) => a.rel.startsWith('.opencode/')).map((a) => a.rel), ['.opencode/agents/build.md', '.opencode/agents/review.md'], 'explore는 built-in을 쓴다');
  assert.ok(!oc.some((a) => a.rel === 'CLAUDE.md' || a.rel === '.claude/settings.json'));
  assert.match(summary('claude', '/p', again), /^INSTALLED kit claude → \/p — 썼다 5 · 두었다 2\n- CLAUDE\.md가 이미 있다/);
});
test('install: mergeAllow · parseArgs', () => {
  const ours = { permissions: { allow: ['a', 'b'] } };
  assert.equal(mergeAllow({ permissions: { allow: ['b', 'a'] } }, ours), null);
  assert.deepEqual(mergeAllow({}, ours).permissions.allow, ['a', 'b']);
  assert.deepEqual(mergeAllow({ permissions: { allow: ['x'], defaultMode: 'plan' } }, ours).permissions, { allow: ['x', 'a', 'b'], defaultMode: 'plan' });
  assert.deepEqual(parseArgs(['claude', '--project', '/p', '--dry']), { flavor: 'claude', project: '/p', dry: true });
  assert.match(parseArgs(['cursor', '--project', '/p']).error, /하네스/);
  assert.match(parseArgs(['claude']).error, /--project/);
  assert.match(parseArgs([]).error, /사용법/);
  assert.deepEqual(parseArgs(['global']), { flavor: 'global', home: null, dry: false });
  assert.deepEqual(parseArgs(['global', '--home', '/h', '--dry']), { flavor: 'global', home: '/h', dry: true });
});

// ── 임시 저장소에서 끝까지
test('e2e: claude 설치 → module PASS → 빈 명령 FAIL → 실패 줄(이름·기대·실제·위치·로그) → 매핑 없음은 full → flaky 격리 → 재설치는 사람의 파일을 둔다', { timeout: 90000 }, () => {
  const repo = tmp('claude');
  write(repo, 'package.json', '{ "name": "demo", "type": "module", "private": true }\n');
  write(repo, 'src/sum.mjs', 'export const sum = (a, b) => a + b;\n');
  write(repo, 'tests/sum.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import { sum } from '../src/sum.mjs';\ntest('sum adds', () => { assert.equal(sum(1, 1), 2); });\n");
  write(repo, '.claude/settings.json', '{ "permissions": { "allow": ["Bash(npm test:*)"] } }\n');
  const inst = install('claude', repo);
  assert.equal(inst.status, 0, inst.out + inst.err);
  assert.match(inst.out, /^INSTALLED kit claude → .* — 썼다 8 · 두었다 0$/m);
  for (const f of ['kit/check.mjs', 'kit/tests-for.mjs', 'kit/check.json', 'kit/flaky.txt', 'AGENTS.md', 'CLAUDE.md', '.gitignore']) assert.ok(fs.existsSync(path.join(repo, f)), f);
  assert.equal(read(repo, 'CLAUDE.md'), '@AGENTS.md\n');
  assert.match(read(repo, 'AGENTS.md'), new RegExp(`^# ${path.basename(repo)}\\n`));
  assert.deepEqual(JSON.parse(read(repo, '.claude/settings.json')).permissions.allow, ['Bash(npm test:*)', 'Bash(node kit/check.mjs:*)', 'Bash(node kit/tests-for.mjs:*)']);
  assert.match(read(repo, '.gitignore'), /^kit\/log\/$/m);

  // 빈 명령은 그 사실이 FAIL — 채우는 것은 사람 또는 에이전트
  let r = check(repo, 'module', 'src/sum.mjs');
  assert.equal(r.status, 1); assert.equal(r.out.trim(), 'FAIL module kit/check.json layers.module 비어 있음 — 이 저장소의 명령을 채운다');
  write(repo, 'kit/check.json', JSON.stringify({ layers: { quick: '', module: 'node --test {files}', full: 'node --test "tests/*.test.mjs"' }, tests: [], log: 'kit/log' }, null, 2));
  r = check(repo, 'quick'); assert.equal(r.status, 1); assert.match(r.out, /^FAIL quick kit\/check\.json layers\.quick 비어 있음/);

  // tests-for CLI
  r = run([path.join(repo, 'kit', 'tests-for.mjs'), 'src/sum.mjs'], repo);
  assert.equal(r.status, 0); assert.equal(r.out.trim(), 'tests/sum.test.mjs'); assert.equal(r.err, '');
  r = run([path.join(repo, 'kit', 'tests-for.mjs'), path.join(repo, 'src', 'sum.mjs')], repo); // 절대 경로도 상대로
  assert.equal(r.out.trim(), 'tests/sum.test.mjs');

  // module PASS — 로그는 한 줄 밖에
  r = check(repo, 'module', 'src/sum.mjs');
  assert.equal(r.status, 0, r.out + r.err); assert.equal(r.out.trim(), 'PASS module');
  const logs = () => fs.readdirSync(path.join(repo, 'kit', 'log'));
  assert.equal(logs().length, 1); assert.match(logs()[0], /-module\.log$/);
  assert.match(read(repo, path.join('kit', 'log', logs()[0])), /^\$ node --test tests\/sum\.test\.mjs\nexit=0\n/);

  // 실패 줄
  write(repo, 'tests/fail.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict';\ntest('fails here', () => { assert.equal(1 + 1, 3); });\n");
  r = check(repo, 'module', 'tests/fail.test.mjs');
  assert.equal(r.status, 1);
  assert.match(r.out, /^FAIL module fails here 기대=3 실제=2 at tests\/fail\.test\.mjs:2 log=kit\/log\/\d{8}-\d{6}-module(-\d+)?\.log\n$/);
  const logRel = /log=(\S+)/.exec(r.out)[1];
  assert.match(read(repo, logRel), /not ok 1 - fails here/);

  // 매핑 없는 파일은 full로 내려가고 그 사실을 적는다(full엔 실패 테스트가 있다)
  write(repo, 'src/nomap.mjs', 'export const x = 1;\n');
  r = check(repo, 'module', 'src/nomap.mjs');
  assert.equal(r.status, 1);
  assert.match(r.out, /^FAIL full fails here 기대=3 실제=2 at tests\/fail\.test\.mjs:2 log=\S+ \(매핑 없음: src\/nomap\.mjs · module → full\)\n$/);
  r = run([path.join(repo, 'kit', 'tests-for.mjs'), 'src/nomap.mjs'], repo);
  assert.equal(r.out, ''); assert.equal(r.err.trim(), '매핑 없음: src/nomap.mjs');

  // 격리 — 사람이 flaky.txt에 적으면 셈에서 빠지고 보인다
  fs.appendFileSync(path.join(repo, 'kit', 'flaky.txt'), 'fails here  # 2026-10-31 시험용\n');
  r = check(repo, 'module', 'tests/fail.test.mjs');
  assert.equal(r.status, 0, r.out); assert.equal(r.out.trim(), 'PASS module 격리 1');
  r = check(repo, 'full');
  assert.equal(r.status, 0, r.out); assert.equal(r.out.trim(), 'PASS full 격리 1');

  // 재설치 — 사람이 고친 AGENTS.md · check.json · flaky.txt는 그대로, 스크립트는 덮는다
  write(repo, 'AGENTS.md', '# demo\n## 지도\n- core: 합계.\n');
  fs.writeFileSync(path.join(repo, 'kit', 'check.mjs'), '// 낡은 판\n');
  const re = install('claude', repo);
  assert.equal(re.status, 0, re.out);
  assert.match(re.out, /썼다 2 · 두었다 6/);
  assert.equal(read(repo, 'AGENTS.md'), '# demo\n## 지도\n- core: 합계.\n');
  assert.match(read(repo, 'kit/flaky.txt'), /fails here/);
  assert.equal(read(repo, 'kit/check.mjs'), fs.readFileSync(path.join(KIT, 'scripts', 'check.mjs'), 'utf8'));
  assert.equal(read(repo, '.gitignore').match(/kit\/log\//g).length, 1);
});
test('e2e: opencode 설치 — 에이전트 둘(explore는 built-in) · 읽기 전용 앞머리 · --dry는 쓰지 않는다 · CLAUDE.md가 있으면 note', { timeout: 30000 }, () => {
  const repo = tmp('opencode');
  write(repo, 'CLAUDE.md', '# existing rules\n');
  const dry = install('opencode', repo, ['--dry']);
  assert.equal(dry.status, 0, dry.out);
  assert.match(dry.out, /\[dry\] write \.opencode\/agents\/build\.md/);
  assert.ok(!fs.existsSync(path.join(repo, 'kit')) && !fs.existsSync(path.join(repo, 'AGENTS.md')), 'dry는 쓰지 않는다');
  const inst = install('opencode', repo);
  assert.equal(inst.status, 0, inst.out);
  for (const a of ['build', 'review']) assert.ok(fs.existsSync(path.join(repo, '.opencode', 'agents', `${a}.md`)), a);
  assert.ok(!fs.existsSync(path.join(repo, '.opencode', 'agents', 'explore.md')), 'explore는 built-in을 가리지 않는다');
  const build = read(repo, '.opencode/agents/build.md');
  assert.match(build, /^mode: primary$/m); assert.match(build, /^    explore: allow$/m); assert.match(build, /^    review: allow$/m); assert.match(build, /^    "\*": deny$/m);
  const review = read(repo, '.opencode/agents/review.md');
  assert.match(review, /^mode: subagent$/m); assert.match(review, /^  edit: deny$/m); assert.match(review, /^  bash: deny$/m);
  assert.ok(!/^tools:/m.test(build + review), 'tools는 deprecated — permission만');
  assert.ok(!fs.existsSync(path.join(repo, '.claude')), 'opencode 판은 .claude를 만들지 않는다');
  assert.equal(read(repo, 'CLAUDE.md'), '# existing rules\n');
  assert.ok(!inst.out.includes('CLAUDE.md'), 'opencode 판은 CLAUDE.md를 보지 않는다');
  const cl = install('claude', repo);
  assert.match(cl.out, /- CLAUDE\.md가 이미 있다 — 한 줄 `@AGENTS\.md`를 더해/);
  assert.equal(read(repo, 'CLAUDE.md'), '# existing rules\n');
});
test('kit: AGENTS.md 템플릿의 줄은 숫자 상한을 에이전트에게 주지 않는다 · 검사 절이 스크립트 셋을 가리킨다', () => {
  const t = fs.readFileSync(path.join(KIT, 'AGENTS.md.template'), 'utf8');
  for (const must of ['node kit/tests-for.mjs', 'node kit/check.mjs', 'kit/check.json', 'kit/flaky.txt', '## 지도', '## 요청', '## 작업 방식', '## 지도 유지']) assert.ok(t.includes(must), must);
  assert.ok(!/\d+\s*KB/.test(t), '지도 크기 상한 없음');
  assert.ok(!/세 번|3번|three/.test(t), '재시도 횟수 없음');
  assert.ok(!/다음 달/.test(t), '관찰할 수 없는 기준 없음');
  assert.ok(t.includes('끝의 기준이 하나인 조각'), '큰 요청은 조각으로');
});

// ── 전역: 한 기계에 한 번
test('install: planGlobal — CLAUDE.md 없으면 write · 마커 없으면 append · 있으면 keep · opencode 전역 AGENTS.md는 있을 때만 · 스킬은 덮고 commands는 .config/opencode가 있을 때만', () => {
  const src = (name) => fs.readFileSync(path.join(KIT, name), 'utf8');
  const ops = (acts) => Object.fromEntries(acts.map((a) => [a.rel, a.op]));
  const fresh = planGlobal({ present: () => null, src, hasDir: () => false });
  assert.deepEqual(ops(fresh), { '.claude/CLAUDE.md': 'write', '.claude/skills/kit-init/SKILL.md': 'write' });
  assert.ok(fresh[0].text.startsWith(GLOBAL_MARK));
  const have = { '.claude/CLAUDE.md': '# mine\n- 내 규칙\n', '.config/opencode/AGENTS.md': '# oc' };
  const again = planGlobal({ present: (rel) => have[rel] ?? null, src, hasDir: (rel) => rel === '.config/opencode' });
  assert.deepEqual(ops(again), { '.claude/CLAUDE.md': 'append', '.config/opencode/AGENTS.md': 'append', '.claude/skills/kit-init/SKILL.md': 'write', '.config/opencode/commands/kit-init.md': 'write' });
  assert.ok(again[0].text.startsWith('\n' + GLOBAL_MARK), '줄바꿈으로 끝나면 빈 줄 하나');
  assert.ok(again[1].text.startsWith('\n\n' + GLOBAL_MARK), '줄바꿈 없이 끝나면 둘');
  const marked = { '.claude/CLAUDE.md': `# mine\n${GLOBAL_MARK}\n...\n` };
  const third = planGlobal({ present: (rel) => marked[rel] ?? null, src, hasDir: () => false });
  assert.deepEqual(ops(third), { '.claude/CLAUDE.md': 'keep', '.claude/skills/kit-init/SKILL.md': 'write' });
});
test('e2e: global 설치 — 홈에 방식 블록과 스킬 · 기존 CLAUDE.md엔 한 번만 덧붙인다 · 스킬 frontmatter는 두 하네스 규칙에 맞는다', { timeout: 30000 }, () => {
  const home = tmp('home');
  write(home, '.claude/CLAUDE.md', '# 내 전역 규칙\n');
  fs.mkdirSync(path.join(home, '.config', 'opencode'), { recursive: true });
  const g = (extra = []) => run([path.join(KIT, 'install.mjs'), 'global', '--home', home, ...extra], home);
  const dry = g(['--dry']);
  assert.equal(dry.status, 0, dry.out);
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'skills')), 'dry는 쓰지 않는다');
  const one = g();
  assert.equal(one.status, 0, one.out);
  assert.match(one.out, /^INSTALLED kit global → .* — 썼다 3 · 두었다 0$/m);
  const cl = read(home, '.claude/CLAUDE.md');
  assert.ok(cl.startsWith('# 내 전역 규칙\n\n' + GLOBAL_MARK), cl);
  assert.equal(cl.split(GLOBAL_MARK).length - 1, 1);
  const skill = read(home, '.claude/skills/kit-init/SKILL.md');
  assert.match(skill, /^---\nname: kit-init\ndescription: .+\n/);
  assert.match(skill, /^disable-model-invocation: true$/m);
  assert.ok(/^[a-z0-9]+(-[a-z0-9]+)*$/.test('kit-init'));
  assert.match(read(home, '.config/opencode/commands/kit-init.md'), /^agent: build$/m);
  const two = g();
  assert.match(two.out, /썼다 2 · 두었다 1/);
  assert.equal(read(home, '.claude/CLAUDE.md').split(GLOBAL_MARK).length - 1, 1, '두 번째 설치는 덧붙이지 않는다');
});
