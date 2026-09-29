// 단위: 판단 없는 함수들이 정한 대로 판단하는가.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { decide, worktreeFromCommand } from '../team/scripts/guard-rules.mjs';
import { checkpoint } from '../team/scripts/checkpoint.mjs';
import { checkBoundary } from '../team/scripts/boundary.mjs';
import { gateDecision, logicLines } from '../team/scripts/verify.mjs';
import { parseTags, pickNext, coverage } from '../team/scripts/claims.mjs';
import { evaluateShip, spikeComplete } from '../team/scripts/ship.mjs';
import { fit, fence, matchHazards, tailSections } from '../team/scripts/brief.mjs';
import { firstLine, budgetStatus } from '../team/scripts/state.mjs';
import { verdict } from '../team/scripts/redproof.mjs';
import { nextQuestionNumber, decideLine, parseBacklog, backlogLine, closure, pickReady, resolveModels, setFrontmatterModel, TIERS } from '../team/scripts/work.mjs';
import { diagnose } from '../team/scripts/doctor.mjs';
import { globToRegex, parseLocalEnv, depDirs, linkDeps } from '../team/scripts/lib.mjs';

const team = JSON.parse(fs.readFileSync(new URL('../team/team.json', import.meta.url), 'utf8'));
const root = '/repo';
const gctx = (marker) => ({ cwd: root, env: {}, worktreesDir: `${root}/.worktrees`, readMarker: () => marker });
const bash = (command, cwd = root) => ({ tool_name: 'Bash', tool_input: { command }, cwd });
const write = (file_path, cwd = root) => ({ tool_name: 'Write', tool_input: { file_path }, cwd });

test('guard: 파괴적 git과 --no-verify는 누구에게도 없다', () => {
  for (const c of ['git push --force origin x', 'git push origin main', 'git reset --hard HEAD~1', 'git stash', 'git rebase main', 'git merge unit/x', 'git commit --no-verify -m x', 'git clean -fd'])
    assert.ok(decide(bash(c), gctx(null)), c);
  assert.equal(decide(bash('node .garagiste/scripts/ship.mjs hello'), gctx(null)), null);
  assert.equal(decide(bash('git commit -m "feat(x): y"'), gctx(null)), null);
});
test('guard: 비밀·규칙집·원장은 쓰지 않는다 (GARAGISTE_ADMIN만 예외)', () => {
  assert.ok(decide(write('.env'), gctx(null)));
  assert.ok(decide(write('.garagiste/team.json'), gctx(null)));
  assert.ok(decide(write('.garagiste/ledger/evidence.jsonl'), gctx(null)));
  assert.ok(decide(write('.claude/settings.json'), gctx(null)), 'Claude 배선');
  assert.ok(decide(write('opencode.json'), gctx(null)), 'opencode 배선');
  assert.ok(decide(write('.opencode/plugins/guard.ts'), gctx(null)));
  assert.ok(decide(write('.githooks/pre-commit'), gctx(null)));
  assert.ok(decide(bash('echo x >> .garagiste/ledger/evidence.jsonl'), gctx(null)));
  assert.equal(decide(write('.garagiste/team.json'), { ...gctx(null), env: { GARAGISTE_ADMIN: '1' } }), null);
});
test('guard: conductor는 쓰지 않는다 — worktree 밖 편집은 거부, GARAGISTE_ADMIN만 예외', () => {
  assert.match(decide(write('src/a.ts'), gctx(null)), /conductor는 쓰지 않는다/);
  assert.match(decide(write('docs/BACKLOG.md'), gctx(null)), /conductor는 쓰지 않는다/);
  assert.equal(decide(write('src/a.ts'), { ...gctx(null), env: { GARAGISTE_ADMIN: '1' } }), null);
  assert.equal(decide(write(`${root}/.worktrees/hello/src/a.ts`), gctx('build')), null);
  assert.equal(decide(bash('node .garagiste/scripts/work.mjs add x "y"'), gctx(null)), null, '쓰기는 스크립트로');
});
test('guard: 팩의 쓰기 경계 — build는 테스트에, spec은 소스에 쓸 수 없다', () => {
  const wt = `${root}/.worktrees/hello`;
  assert.ok(decide(write(`${wt}/tests/acceptance/hello.test.mjs`), gctx('build')));
  assert.equal(decide(write(`${wt}/src/cli.mjs`), gctx('build')), null);
  assert.ok(decide(write(`${wt}/src/cli.mjs`), gctx('spec')));
  assert.equal(decide(write(`${wt}/tests/acceptance/hello.test.mjs`), gctx('spec')), null);
  assert.equal(decide(write(`${wt}/docs/units/hello/try.md`), gctx('spec')), null);
  assert.ok(decide(write(`${wt}/src/cli.mjs`), gctx('attack')));
  assert.equal(decide(write(`${wt}/tests/adversary/hello-1.test.mjs`), gctx('attack')), null);
  assert.ok(decide(bash('git commit -m x', wt), gctx('spike')));
  assert.ok(decide(bash('git push -u origin unit/hello', wt), gctx('build')));
  assert.ok(decide(bash('cd .worktrees/hello && git push -u origin unit/hello'), gctx('build')), 'opencode: cwd 대신 명령 안의 경로로 worktree를 안다');
  assert.equal(worktreeFromCommand('git -C .worktrees/hello status', '/repo/.worktrees').slug, 'hello');
});
test('checkpoint: worktree가 없으면 조용히 빈 배열', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-cp-'));
  assert.deepEqual(checkpoint(d), []);
});
test('boundary: 의존성 파일과 유출 키워드는 HIT, 평범한 소스는 CLEAR', () => {
  assert.equal(checkBoundary(team, { files: ['package.json'] }).hit, true);
  assert.equal(checkBoundary(team, { files: ['app/electron/main.ts'] }).hit, true);
  assert.equal(checkBoundary(team, { text: '로그인 토큰을 subprocess로 넘긴다' }).hit, true);
  assert.equal(checkBoundary(team, { files: ['src/a.ts'], text: '메모 필드를 추가한다' }).hit, false);
});
test('lib: glob — 경로 없는 패턴은 어느 디렉터리에서도 맞는다', () => {
  assert.ok(globToRegex('package.json').test('app/package.json'));
  assert.ok(globToRegex('**/electron/**').test('app/electron/main.ts'));
  assert.ok(!globToRegex('tests/**').test('src/tests.ts'));
});
test('verify: 로직 줄 수는 테스트·문서·잠금 파일을 빼고 센다', () => {
  assert.equal(logicLines('10\t2\tsrc/a.ts\n5\t5\ttests/a.test.ts\n3\t0\tdocs/x.md\n-\t-\timg.png\n7\t1\tpackage-lock.json\n4\t4\tapps/desktop/vitest.config.ts'), 12, '설정 파일은 로직이 아니다');
});
test('verify gate: 원장에 tree PASS가 없으면 커밋이 열리지 않는다', () => {
  const base = { index: 't1', work: 't1', staged: ['src/a.ts'], branchFiles: ['tests/acceptance/a.test.ts'], numstat: '10\t0\tsrc/a.ts', branch: 'unit/a', protectedBranch: 'main', budgets: team.budgets };
  assert.equal(gateDecision({ ...base, ledger: [] }).ok, false);
  assert.equal(gateDecision({ ...base, ledger: [{ kind: 'verify', mode: 'quick', exit: 0, tree: 't1' }] }).ok, true);
  assert.equal(gateDecision({ ...base, ledger: [{ kind: 'verify', mode: 'quick', exit: 1, tree: 't1' }] }).ok, false);
  assert.equal(gateDecision({ ...base, work: 't2', ledger: [{ kind: 'verify', mode: 'quick', exit: 0, tree: 't1' }] }).ok, false, '인덱스≠작업 트리');
});
test('verify gate: 로직 변경엔 테스트가, 보호 브랜치엔 ship만, step은 300줄', () => {
  const ok = [{ kind: 'verify', mode: 'quick', exit: 0, tree: 't' }];
  const b = { index: 't', work: 't', ledger: ok, staged: ['src/a.ts'], branchFiles: [], numstat: '10\t0\tsrc/a.ts', branch: 'unit/a', protectedBranch: 'main', budgets: team.budgets };
  assert.match(gateDecision(b).reasons.join(), /테스트 파일이 없다/);
  assert.equal(gateDecision({ ...b, staged: ['docs/x.md'], numstat: '3\t0\tdocs/x.md' }).ok, true, '문서만이면 floor 없음');
  assert.match(gateDecision({ ...b, branch: 'main' }).reasons.join(), /보호 브랜치/);
  assert.equal(gateDecision({ ...b, branch: 'main', env: { GARAGISTE_SHIP: '1' }, staged: ['docs/STATUS.md'], numstat: '1\t0\tdocs/STATUS.md' }).ok, true);
  const big = { ...b, branchFiles: ['tests/a.test.ts'], numstat: '350\t0\tsrc/a.ts' };
  assert.match(gateDecision(big).reasons.join(), /300/);
  assert.equal(gateDecision({ ...big, env: { GARAGISTE_LARGE_STEP: '이유' } }).ok, true);
  assert.equal(gateDecision({ ...big, numstat: '700\t0\tsrc/a.ts', env: { GARAGISTE_LARGE_STEP: '이유' } }).ok, false, '2×는 이유로도 안 된다');
  assert.equal(gateDecision({ ...b, ledger: [], env: { GARAGISTE_WIP: '1' } }).ok, true, 'wip 체크포인트는 원장 면제');
});
test('claims: 태그 파싱, 기계 센서 커버리지, 다음 거짓 주장은 마일스톤 순', () => {
  const t = parseTags('// @claim 인사한다\n// @milestone M2\n// @sensor human@win32');
  assert.deepEqual(t, { claim: '인사한다', milestone: 'M2', sensor: 'human@win32' });
  assert.deepEqual(parseTags('x'), { claim: null, milestone: 'M?', sensor: 'machine' });
  const cs = [{ file: 'b', status: 'false', milestone: 'M3', sensor: 'machine' }, { file: 'a', status: 'false', milestone: 'M1', sensor: 'human' }, { file: 'c', status: 'true', milestone: 'M1', sensor: 'machine' }];
  assert.equal(pickNext(cs).file, 'a');
  assert.equal(coverage(cs).pct, 67);
});
test('ship: 7조건 — 하나라도 빠지면 fail-closed', () => {
  const unit = { state: 'spec', boundary: { hit: false } };
  const ledger = [
    { kind: 'verify', mode: 'full', exit: 0, tree: 'T', platform: 'linux' },
    { kind: 'redproof', slug: 'h', base_red: true, head_green: true, tree: 'T' },
    { kind: 'attack', slug: 'h', tree: 'T', red: 0, total: 2 },
  ];
  const x = { unit, slug: 'h', worktreeExists: true, clean: true, tree: 'T', ledger, machineOs: ['linux'], requireAttack: true, spikeText: '', lastSubject: 'feat(x): y', stops: [], proseKb: 10, proseMax: 40 };
  assert.equal(evaluateShip(x).filter((k) => !k.ok).length, 0);
  assert.deepEqual(evaluateShip({ ...x, ledger: ledger.filter((e) => e.kind !== 'attack') }).filter((k) => !k.ok).map((k) => k.id), ['attack']);
  assert.deepEqual(evaluateShip({ ...x, ledger: [ledger[0], ledger[1], { ...ledger[2], red: 1 }] }).filter((k) => !k.ok).map((k) => k.id), ['attack']);
  assert.deepEqual(evaluateShip({ ...x, ledger: [{ ...ledger[0], platform: 'win32' }, ledger[1], ledger[2]] }).filter((k) => !k.ok).map((k) => k.id), ['full'], '사람 OS 관측은 machine이 아니다');
  assert.deepEqual(evaluateShip({ ...x, unit: { ...unit, boundary: { hit: true } } }).filter((k) => !k.ok).map((k) => k.id), ['spike']);
  assert.deepEqual(evaluateShip({ ...x, boundaryHit: true, boundaryWhy: 'file package.json' }).filter((k) => !k.ok).map((k) => k.id), ['spike'], 'diff가 boundary 파일을 건드려도 spike');
  assert.equal(evaluateShip({ ...x, boundaryHit: true, spikeText: '- wire: 없음\n- host: linux\n- license: MIT\n- default: 없음\n- os: 없음' }).filter((k) => !k.ok).length, 0);
  assert.deepEqual(evaluateShip({ ...x, lastSubject: 'wip: h checkpoint' }).filter((k) => !k.ok).map((k) => k.id), ['head']);
  assert.deepEqual(evaluateShip({ ...x, stops: ['미검수 3'] }).filter((k) => !k.ok).map((k) => k.id), ['budget']);
  assert.deepEqual(evaluateShip({ ...x, proseKb: 41 }).filter((k) => !k.ok).map((k) => k.id), ['budget']);
  assert.deepEqual(evaluateShip({ ...x, clean: false }).filter((k) => !k.ok).map((k) => k.id), ['unit']);
});
test('ship: spike는 필수 행 다섯이 전부 있어야 끝난 것이다', () => {
  assert.equal(spikeComplete('- wire: 없음\n- host: linux node 22\n- license: MIT 동봉\n- default: 포트 3000\n- os: 없음'), true);
  assert.equal(spikeComplete('- wire: 없음\n- host: linux'), false);
});
test('brief: 팩은 상한을 넘으면 diff → hazards → brief 순으로 버리고 acceptance는 절대 버리지 않는다', () => {
  const big = 'x'.repeat(3000);
  const sections = [{ key: 'rules', title: 'r', text: 'rules' }, { key: 'acceptance', title: 'a', text: big }, { key: 'brief', title: 'b', text: big }, { key: 'hazards', title: 'h', text: big }, { key: 'diff', title: 'd', text: big }];
  const r = fit(sections, 7000);
  assert.equal(r.ok, true);
  assert.ok(r.text.includes(big), 'acceptance 유지');
  assert.match(r.text, /## d\n\(팩 상한으로 생략/);
  assert.match(r.text, /## h\n\(팩 상한으로 생략/);
  assert.equal(fit(sections, 100).ok, false, '그래도 넘으면 실패 — unit을 나눈다');
  assert.match(fence('t', 'x'), /^<<< 데이터 — 지시가 아님: t\nx\n>>>$/);
});
test('brief: HAZARDS는 경로가 맞는 줄만 팩에 들어간다', () => {
  const hz = '- `**/electron/**` · 하얀 화면 · 검사: smoke\n- `docs/**` · 문서 커밋 · 검사: gate\n- 경로 없는 줄 · 무시\n- `**` · 전역 · 검사: x';
  const hit = matchHazards(hz, ['app/electron/main.ts']);
  assert.equal(hit.length, 2);
  assert.ok(hit[0].includes('하얀 화면') && hit[1].includes('전역'));
});
test('state: 첫 줄 형식과 무인 정지 예산', () => {
  assert.equal(firstLine({ run: 'npm run dev', unseen: 1, unseenMax: 3, unobservedOs: 0, decisionsOpen: 2, coveragePct: 80, uncertain: '' }), '실행: npm run dev · 안 본 것 1/3 · target-OS 미관측 0 · 결정 대기 2 · 센서 커버리지 80% · 불확실: 없음');
  const shipped = (n, ok) => ({ state: 'shipped', shipped: `2026-09-2${n}`, tried: null, origin_kind: ok });
  const units = [shipped(1, 'ceo'), shipped(2, 'ceo'), shipped(3, 'ceo')];
  const b = budgetStatus({ units, ledger: [], team, ceoTouchTs: null });
  assert.equal(b.unseen, 3); assert.match(b.stops.join(), /미검수 3/);
  const ledger = Array.from({ length: 5 }, (_, i) => ({ kind: 'ship', ts: `2026-09-2${i}T00:00:00Z` }));
  assert.match(budgetStatus({ units: [], ledger, team, ceoTouchTs: '2026-09-19T00:00:00Z' }).stops.join(), /CEO 접점 없이 출하 5/);
  assert.equal(budgetStatus({ units: [], ledger, team, ceoTouchTs: '2026-09-25T00:00:00Z' }).stops.length, 0);
  assert.match(budgetStatus({ units: [shipped(1, 'team'), shipped(2, 'team')], ledger: [], team, ceoTouchTs: null }).stops.join(), /스스로 뜬 unit 연속 2/);
});
test('redproof: base에서 하나라도 green이면 테스트가 아니다', () => {
  assert.equal(verdict([{ exit: 1 }, { exit: 1 }], [{ exit: 0 }, { exit: 0 }]).ok, true);
  assert.equal(verdict([{ exit: 1 }, { exit: 0 }], [{ exit: 0 }, { exit: 0 }]).ok, false);
  assert.equal(verdict([{ exit: 1 }], [{ exit: 1 }]).ok, false);
  assert.equal(verdict([{ exit: 1 }], null).ok, true, '코드 전엔 red만 본다');
  assert.equal(verdict([], null).ok, false);
});
test('work: 결정 큐 번호와 답 기록', () => {
  const t = '# DECISIONS\n\n## 정해 주세요\n- [ ] Q1 (a): 빈 메모 저장?\n- [x] Q2 (a): x → 예 (2026-09-29)\n';
  assert.equal(nextQuestionNumber(t), 3);
  assert.equal(nextQuestionNumber(''), 1);
  assert.match(decideLine(t, 1, '예', '2026-09-30'), /- \[x\] Q1 \(a\): 빈 메모 저장\? → 예 \(2026-09-30\)/);
  assert.equal(decideLine(t, 2, '예', '2026-09-30'), null, '이미 닫힌 질문');
});
test('doctor: 빈 저장소는 무엇을 치라고 한 줄씩 말한다', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-doctor-'));
  const p = diagnose(d, { nodeVersion: '18.0.0' });
  assert.ok(p.some((x) => x.includes('node 18')));
  assert.ok(p.some((x) => x.includes('team.json 없음')));
  assert.ok(p.some((x) => x.includes('하네스 배선 없음')));
  assert.ok(p.some((x) => x.includes('core.hooksPath')));
});

test('work: BACKLOG 줄은 slug·마일스톤·needs·원문·인수를 왕복한다', () => {
  const line = backlogLine({ slug: 'login', milestone: 'M2', needs: ['session', 'Q3'], origin: '이메일로 "로그인"한다', accept: 'POST /login → 200' });
  const [it] = parseBacklog(line);
  assert.deepEqual(it, { done: false, slug: 'login', milestone: 'M2', needs: ['session', 'Q3'], origin: '이메일로 ”로그인”한다', accept: 'POST /login → 200' });
  assert.equal(parseBacklog('- [x] a · M1 · needs: - · "x" · 인수: -')[0].done, true);
  assert.equal(parseBacklog('- [ ] 옛 형식 — "x"').length, 0);
});
test('work scope: 선행은 needs 간선의 닫힘이고 순서는 선행 먼저', () => {
  const items = parseBacklog(['- [ ] db · M1 · needs: - · "db" · 인수: -', '- [ ] session · M1 · needs: db · "s" · 인수: -', '- [ ] login · M2 · needs: session · "l" · 인수: -', '- [ ] export · M2 · needs: fmt · "e" · 인수: -', '- [ ] share · M3 · needs: - · "sh" · 인수: -'].join('\n'));
  const cl = closure(items, ['login', 'share']);
  assert.deepEqual(cl.required, ['db', 'session']);
  assert.deepEqual(cl.order, ['db', 'session', 'login', 'share']);
  assert.deepEqual(closure(items, ['export']).missing, ['fmt'], 'BACKLOG에 없는 선행은 역제안에 이름이 나온다');
  assert.deepEqual(closure(items, ['login'], { noNeeds: true }).order, ['login']);
  const done = parseBacklog('- [x] db · M1 · needs: - · "db" · 인수: -\n- [ ] session · M1 · needs: db · "s" · 인수: -');
  assert.deepEqual(closure(done, ['session']).order, ['session'], '끝난 선행은 순서에 없다');
  assert.equal(closure(parseBacklog('- [ ] a · M1 · needs: b · "a" · 인수: -\n- [ ] b · M1 · needs: a · "b" · 인수: -'), ['a']).cycle, 'a');
});
test('work seed: 선행이 출하됐거나 Q가 닫힌 unit만 열린다, 아니면 WAIT, 전부 끝나면 DONE', () => {
  const items = parseBacklog(['- [ ] db · M1 · needs: - · "db" · 인수: -', '- [ ] session · M1 · needs: db,Q1 · "s" · 인수: -'].join('\n'));
  const order = ['db', 'session'];
  assert.equal(pickReady({ order, items, units: [] }).slug, 'db');
  assert.equal(pickReady({ order, items, units: [{ slug: 'db', state: 'spec' }] }).kind, 'wait');
  assert.deepEqual(pickReady({ order, items, units: [{ slug: 'db', state: 'shipped' }] }).unmet, ['Q1']);
  assert.equal(pickReady({ order, items, units: [{ slug: 'db', state: 'shipped' }], decisionsText: '- [x] Q1 (intake): x → y' }).slug, 'session');
  assert.equal(pickReady({ order, items, units: [{ slug: 'db', state: 'shipped' }, { slug: 'session', state: 'shipped' }] }).kind, 'done');
});

test('lib: env.local은 KEY=VALUE 줄만 읽고 주석은 무시한다', () => {
  assert.deepEqual(parseLocalEnv('# 이 기계만\nGARAGISTE_RUNNER=setpriv --reuid=1000 env HOME=/tmp/x\nBAD LINE\nA=1'), { GARAGISTE_RUNNER: 'setpriv --reuid=1000 env HOME=/tmp/x', A: '1' });
});

test('brief intake: BRIEF의 마지막 n절만 — intake는 증분이다', () => {
  const t = '# BRIEF\n머리\n## 1\na\n## 2\nb\n## 3\nc\n';
  assert.equal(tailSections(t, 2), '## 2\nb\n## 3\nc\n');
  assert.equal(tailSections(t, 9), '## 1\na\n## 2\nb\n## 3\nc\n');
});

test('lib: 워크스페이스 패키지의 node_modules까지 worktree에 링크한다', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-deps-')); const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-wt-'));
  for (const d of ['node_modules/a', 'packages/core/node_modules/b', 'apps/desktop/node_modules/c', 'node_modules/x/node_modules/y']) fs.mkdirSync(path.join(root, d), { recursive: true });
  assert.deepEqual(depDirs(root), ['apps/desktop/node_modules', 'node_modules', 'packages/core/node_modules']);
  assert.deepEqual(linkDeps(root, wt), ['apps/desktop/node_modules', 'node_modules', 'packages/core/node_modules']);
  assert.ok(fs.lstatSync(path.join(wt, 'packages/core/node_modules')).isSymbolicLink());
  assert.deepEqual(linkDeps(root, wt), [], '두 번째는 아무것도 안 한다');
});

test('work models: tier 한 단어 또는 팩=모델, 에이전트 앞머리 model: 재생성', () => {
  assert.deepEqual(resolveModels(TIERS.medium, ['low']), TIERS.low);
  assert.equal(resolveModels(TIERS.medium, ['build=opus']).build, 'opus');
  assert.equal(resolveModels(TIERS.medium, ['build=opus']).spec, 'opus');
  assert.throws(() => resolveModels(TIERS.medium, ['critic=opus']), /팩/);
  assert.match(setFrontmatterModel('---\nname: build\nmodel: sonnet\ntools: Read\n---\n본문', 'opus'), /^---\nname: build\nmodel: opus\ntools: Read\n---\n본문$/);
  assert.match(setFrontmatterModel('---\ndescription: x\nmode: subagent\n---\n본문', 'anthropic/claude-sonnet-4-5'), /^---\nmodel: anthropic\/claude-sonnet-4-5\ndescription: x/);
});
