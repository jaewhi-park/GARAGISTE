// 단위: 판단 없는 함수들이 정한 대로 판단하는가.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decide, makeCtx, stripQuoted, worktreeFromCommand } from '../team/scripts/guard-rules.mjs';
import { checkpoint, spawnStop } from '../team/scripts/checkpoint.mjs';
import { checkBoundary } from '../team/scripts/boundary.mjs';
import { gateDecision, logicLines } from '../team/scripts/verify.mjs';
import { parseTags, pickNext, coverage } from '../team/scripts/claims.mjs';
import { attackCell, evaluateShip, mergeTeamJson, spikeComplete, spikeOnlyFiles } from '../team/scripts/ship.mjs';
import { closedDecisions, fit, fence, matchHazards, packBreakdown, scopedDecisions, tailSections } from '../team/scripts/brief.mjs';
import { firstLine, budgetStatus } from '../team/scripts/state.mjs';
import { verdict } from '../team/scripts/redproof.mjs';
import { nextQuestionNumber, decideLine, parseBacklog, backlogLine, closure, pickReady, resolveModels, setFrontmatterModel, TIERS, unknownQuestions, setNeeds, respecTargets } from '../team/scripts/work.mjs';
import { blocking, diagnose } from '../team/scripts/doctor.mjs';
import { dirtyFiles, globToRegex, indexTree, parseLocalEnv, depDirs, linkDeps, readJson, loadTeam, scriptRoot, workTree } from '../team/scripts/lib.mjs';

const team = JSON.parse(fs.readFileSync(new URL('../team/team.json', import.meta.url), 'utf8'));
const root = '/repo';
const gctx = (marker) => ({ cwd: root, env: {}, root, worktreesDir: `${root}/.worktrees`, readMarker: () => marker });
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
  assert.equal(decide(bash('cat .garagiste/scripts/lib.mjs'), gctx(null)), null, '규칙집 읽기는 경계가 아니다 — 첫 Windows 실기의 오탐(conductor의 진단이 막혔다)');
  assert.equal(decide(bash('sed -n "30,40p" .garagiste/scripts/work.mjs'), gctx(null)), null, 'sed도 -i 없이는 읽기다');
  assert.ok(decide(bash('echo x > .garagiste/team.json'), gctx(null)), '리다이렉트로 향하면 쓰기다');
  assert.ok(decide(bash('sed -i "s/x/y/" .garagiste/scripts/lib.mjs'), gctx(null)), 'sed -i는 쓰기다');
  assert.ok(decide(bash('cp lib.mjs .garagiste/scripts/lib.mjs'), gctx(null)));
});
test('guard: conductor는 쓰지 않는다 — worktree 밖 편집은 거부, GARAGISTE_ADMIN만 예외', () => {
  assert.match(decide(write('src/a.ts'), gctx(null)), /conductor는 쓰지 않는다/);
  assert.match(decide(write('docs/BACKLOG.md'), gctx(null)), /conductor는 쓰지 않는다/);
  assert.equal(decide(write('src/a.ts'), { ...gctx(null), env: { GARAGISTE_ADMIN: '1' } }), null);
  assert.equal(decide(write(`${root}/.worktrees/hello/src/a.ts`), gctx('build')), null);
  assert.equal(decide(bash('node .garagiste/scripts/work.mjs add x "y"'), gctx(null)), null, '쓰기는 스크립트로');
});
test('guard: boot 팩은 매니페스트·src·유닛 스모크·규칙 파일 자리만 — 인수 테스트·규칙집은 아니다', () => {
  const wt = `${root}/.worktrees/boot`;
  for (const f of ['package.json', '.node-version', 'src/cli.mjs', 'tests/unit/smoke.test.mjs', 'CLAUDE.md', 'vitest.config.ts', 'README.md']) assert.equal(decide(write(`${wt}/${f}`), gctx('boot')), null, f);
  assert.ok(decide(write(`${wt}/tests/acceptance/x.test.mjs`), gctx('boot')));
  assert.ok(decide(write(`${wt}/.garagiste/team.json`), gctx('boot')), 'team.json은 work.mjs commands로만');
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
test('guard: R7 — 게이트 우회 env 접두(SHIP·WIP·ADMIN)는 ADMIN 세션만, LARGE_STEP은 정상 경로다', () => {
  for (const c of ['GARAGISTE_SHIP=1 git commit -m x', 'GARAGISTE_WIP=1 git commit -m x', 'env GARAGISTE_ADMIN=1 node .garagiste/scripts/work.mjs tried x ok', 'export GARAGISTE_SHIP=1; git commit -m x'])
    assert.match(decide(bash(c), gctx(null)) || '', /우회/, c);
  assert.equal(decide(bash('GARAGISTE_LARGE_STEP="스키마 한 벌" git commit -m x'), gctx(null)), null, '큰 step의 이유는 게이트가 받는 정상 경로');
  assert.equal(decide(bash('GARAGISTE_SHIP=1 git commit -m x'), { ...gctx(null), env: { GARAGISTE_ADMIN: '1' } }), null);
});
test('guard: R2 — tried·decide는 팩(worktree 컨텍스트)이 부르지 않는다', () => {
  const wt = `${root}/.worktrees/hello`;
  assert.match(decide(bash('node .garagiste/scripts/work.mjs tried hello ok', wt), gctx('build')) || '', /CEO 접점/);
  assert.match(decide(bash('node ../../.garagiste/scripts/work.mjs decide 3 "B"', wt), gctx('build')) || '', /CEO 접점/);
  assert.equal(decide(bash('node .garagiste/scripts/work.mjs tried hello ok'), gctx(null)), null, 'conductor(메인)는 CEO의 말을 중계한다');
  assert.equal(decide(bash('node .garagiste/scripts/work.mjs default hello "포트 3000"', wt), gctx('build')), null, 'default는 팀의 기록 — 접점이 아니다');
  assert.match(decide(bash('node .garagiste/scripts/work.mjs drop hello "안 되겠다"', wt), gctx('build')) || '', /팩은 부르지 않는다/, '방향전환(drop)은 conductor의 일이다');
  assert.match(decide(bash('node .garagiste/scripts/work.mjs needs memo session', wt), gctx('build')) || '', /팩은 부르지 않는다/, '사고 23: 선행 재배선(needs)도 conductor의 일 — 팩이 자기 WAIT를 풀지 않는다');
});
test('guard: 보호 브랜치가 main이 아니어도 push가 막힌다', () => {
  const pb = { ...gctx(null), protectedBranch: 'claude/quirky-wozniak-keqgbi' };
  assert.ok(decide(bash('git push origin claude/quirky-wozniak-keqgbi'), pb), '보호 브랜치 push는 이름과 무관하게 없다');
  assert.ok(decide(bash('git push -u origin claude/quirky-wozniak-keqgbi'), pb));
  assert.equal(decide(bash('git push origin feature/x'), pb), null);
  assert.equal(decide(bash('git push origin claude/quirky-wozniak-keqgbi'), gctx(null)), null, 'protected_branch를 모르면 기존 main|master 규칙만');
  assert.equal(decide(bash('git push origin claude/quirky-wozniak-keqgbi'), { ...pb, env: { GARAGISTE_ADMIN: '1' } }), null, '원격 push는 CEO(ADMIN)의 일');
});
test('guard: R5 — 팩 정체는 unit 상태가 정본, 마커 변조는 무효, 정체 불명은 fail-closed', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-marker-'));
  fs.mkdirSync(path.join(d, '.garagiste', 'units'), { recursive: true });
  fs.mkdirSync(path.join(d, '.worktrees', 'hello'), { recursive: true });
  fs.writeFileSync(path.join(d, '.garagiste', 'units', 'hello.json'), JSON.stringify({ slug: 'hello', state: 'build' }));
  fs.writeFileSync(path.join(d, '.worktrees', 'hello', '.garagiste-pack'), 'spec'); // 변조 시도
  const c = makeCtx(d, { cwd: d, env: {}, fs });
  assert.equal(c.readMarker(path.join(d, '.worktrees', 'hello')), 'build', 'unit 상태(.garagiste/units)가 마커 파일을 이긴다');
  assert.ok(decide(write(path.join(d, '.worktrees', 'hello', 'tests/acceptance/x.test.mjs'), d), c), '변조된 마커로도 build는 acceptance에 못 쓴다');
  assert.match(decide(write(`${root}/.worktrees/ghost/src/a.ts`), gctx(null)) || '', /정체 불명/, 'unit 상태도 마커도 없으면 worktree에도 쓰지 않는다');
});
test('guard: R4 — Bash 리다이렉트·in-place 편집도 쓰기 경계를 지킨다', () => {
  const wt = `${root}/.worktrees/hello`;
  assert.ok(decide(bash('sed -i "s/x/y/" tests/acceptance/hello.test.mjs', wt), gctx('build')), 'build의 sed -i → acceptance');
  assert.ok(decide(bash(`cat > ${wt}/tests/acceptance/h.test.mjs <<EOF`), gctx('build')), '절대 경로 리다이렉트도 경계다');
  assert.equal(decide(bash('echo x > src/a.mjs', wt), gctx('build')), null, 'build는 src에 쓴다');
  assert.equal(decide(bash('cat > tests/acceptance/hello.test.mjs <<EOF', wt), gctx('spec')), null, 'spec은 acceptance에 쓴다');
  assert.match(decide(bash('echo x > src/a.mjs'), gctx(null)) || '', /worktree 밖/, 'conductor의 리다이렉트 쓰기');
  assert.match(decide(bash('echo x > ../../src/a.mjs', wt), gctx('build')) || '', /worktree 밖/, 'worktree 탈출 리다이렉트');
  assert.equal(decide(bash('node --test > /dev/null 2>&1'), gctx(null)), null);
  assert.equal(decide(bash('cmd > /tmp/out.log'), gctx(null)), null, '저장소 밖은 팀의 경계가 아니다');
  assert.equal(decide(bash('git commit -m "a -> b"'), gctx(null)), null, '화살표는 리다이렉트가 아니다');
});
test('guard: 따옴표 안은 데이터 — 트레일러·메시지 속 언급은 쓰기·파괴가 아니다 (첫 Windows 실기의 오탐)', () => {
  const wt = `${root}/.worktrees/hello`;
  const trailer = 'git commit -m "feat(x): y\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/abc"';
  assert.equal(decide(bash(trailer, wt), gctx('build')), null, '<…>의 >가 리다이렉트로 오탐돼 커밋이 거부됐다');
  assert.equal(decide(bash(trailer), gctx(null)), null, 'conductor 컨텍스트에서도 같다');
  assert.equal(decide(bash('git commit -m "docs: git merge와 -n 이야기"'), gctx(null)), null, '메시지 속 파괴 verb 언급은 파괴가 아니다');
  assert.equal(decide(bash("git commit -m 'fix: rm .garagiste/scripts 오탐'"), gctx(null)), null, '메시지 속 규칙집 경로 언급은 쓰기가 아니다');
  assert.ok(decide(bash('echo "$(cat x > .garagiste/team.json)"'), gctx(null)), '큰따옴표 안 $()는 실행이다 — 여전히 거부');
  assert.ok(decide(bash('git commit -m "x" --no-verify'), gctx(null)), '따옴표 밖 --no-verify는 그대로 파괴다');
  assert.equal(stripQuoted(`echo 'a > b' "c > d" e`).includes('>'), false);
});
test('checkpoint: spike worktree는 wip로 커밋하지 않는다 — 측정이 tree를 바꿔 증거를 낡게 한다 (2차 실기 사고 15)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-ckpt-'));
  const mk = (slug, state) => {
    const wt = path.join(root, '.worktrees', slug);
    fs.mkdirSync(wt, { recursive: true });
    const g = (args) => spawnSync('git', args, { cwd: wt, encoding: 'utf8' });
    g(['init', '-q']); g(['config', 'user.email', 'x@x']); g(['config', 'user.name', 'x']);
    fs.writeFileSync(path.join(wt, 'a.md'), 'dirty\n');
    fs.mkdirSync(path.join(root, '.garagiste', 'units'), { recursive: true });
    fs.writeFileSync(path.join(root, '.garagiste', 'units', `${slug}.json`), JSON.stringify({ slug, state }));
    return wt;
  };
  mk('sp', 'spike'); const bwt = mk('bd', 'build');
  assert.deepEqual(checkpoint(root), ['bd'], 'spike는 건너뛰고 build는 커밋');
  assert.match(spawnSync('git', ['log', '-1', '--format=%s'], { cwd: bwt, encoding: 'utf8' }).stdout, /^wip: bd checkpoint/);
});
test('checkpoint: worktree가 없으면 조용히 빈 배열', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-cp-'));
  assert.deepEqual(checkpoint(d), []);
});
test('spawn 센서: SubagentStop의 agent_type이 팩이면 원장에 기계적으로 남고, 무명 stop은 줄을 만들지 않는다', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-spawn-'));
  const e = spawnStop(d, { agent_type: 'build' });
  assert.equal(e.pack, 'build');
  assert.match(fs.readFileSync(path.join(d, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"spawn_stop".*"pack":"build"/, 'pass line의 spawn 열은 conductor의 산문 보고가 아니라 훅이 센다');
  assert.equal(spawnStop(d, {}), null, 'v1 교훈(무명 stop 1,024건): 팩도 체크포인트도 없으면 쓰지 않는다');
  assert.equal(spawnStop(d, { agent_type: 'claude' }), null, '메인 에이전트의 stop은 spawn이 아니다');
  assert.equal(fs.readFileSync(path.join(d, '.garagiste/ledger/evidence.jsonl'), 'utf8').trim().split('\n').length, 1);
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
  // 사고 11: **/는 온전한 세그먼트 경계 — schema로 "끝나는" 폴더(vault-schema)를 물면 slug 이름이 지뢰가 된다
  assert.ok(!globToRegex('**/schema/**').test('docs/units/vault-schema/try.md'), '거짓 boundary HIT의 재현');
  assert.ok(globToRegex('**/schema/**').test('packages/core/schema/x.ts'));
  assert.ok(globToRegex('**/schema/**').test('schema/x.ts'), '앞 세그먼트 0개도 맞는다');
  assert.ok(globToRegex('a/**/b').test('a/b'), '중간 **/는 0개 세그먼트도 맞는다');
  assert.ok(!globToRegex('a/**/b').test('a/xb'));
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
  assert.equal(gateDecision({ ...b, ledger: [], branch: 'main', hasHead: false }).initial, true, '첫 커밋(HEAD 없음)은 설치기가 만든다 — 원장이 있을 수 없다');
});
test('claims: 태그 파싱, 기계 센서 커버리지, 다음 거짓 주장은 마일스톤 순', () => {
  const t = parseTags('// @claim 인사한다\n// @milestone M2\n// @sensor human@win32');
  assert.deepEqual(t, { claim: '인사한다', milestone: 'M2', sensor: 'human@win32' });
  assert.deepEqual(parseTags('x'), { claim: null, milestone: 'M?', sensor: 'machine' });
  const cs = [{ file: 'b', status: 'false', milestone: 'M3', sensor: 'machine' }, { file: 'a', status: 'false', milestone: 'M1', sensor: 'human' }, { file: 'c', status: 'true', milestone: 'M1', sensor: 'machine' }];
  assert.equal(pickNext(cs).file, 'a');
  assert.equal(coverage(cs).pct, 67);
});
test('ship: 8조건 — 하나라도 빠지면 fail-closed', () => {
  const unit = { state: 'spec', boundary: { hit: false } };
  const ledger = [
    { kind: 'verify', mode: 'full', exit: 0, tree: 'T', platform: 'linux' },
    { kind: 'redproof', slug: 'h', base_red: true, head_green: true, tree: 'T' },
    { kind: 'attack', slug: 'h', tree: 'T', red: 0, total: 2 },
  ];
  const x = { unit, slug: 'h', worktreeExists: true, clean: true, tree: 'T', ledger, requireAttack: true, spikeText: '', lastSubject: 'feat(x): y', stops: [], proseKb: 10, proseMax: 40 };
  assert.equal(evaluateShip(x).filter((k) => !k.ok).length, 0);
  assert.deepEqual(evaluateShip({ ...x, ledger: ledger.filter((e) => e.kind !== 'attack') }).filter((k) => !k.ok).map((k) => k.id), ['attack']);
  assert.deepEqual(evaluateShip({ ...x, ledger: [ledger[0], ledger[1], { ...ledger[2], red: 1 }] }).filter((k) => !k.ok).map((k) => k.id), ['attack']);
  assert.equal(evaluateShip({ ...x, ledger: [{ ...ledger[0], platform: 'win32' }, ledger[1], ledger[2]] }).filter((k) => !k.ok).length, 0, '첫 Windows 실기 사고: 이 기계에서 돈 full PASS는 platform과 무관하게 증거다 — platform 허용 목록(machine_os)은 대상-OS 보증을 못 하면서 정당한 증거만 거부했다. 대상-OS는 @sensor 태그·미관측 카운트의 일이고 platform은 원장 기록으로 남는다');
  assert.equal(team.sensors.machine_os, undefined, 'machine_os 제거의 고정 — 검출 0·오탐 1 장치는 제거된다(제거 대칭)');
  assert.deepEqual(evaluateShip({ ...x, unit: { ...unit, boundary: { hit: true } } }).filter((k) => !k.ok).map((k) => k.id), ['spike']);
  assert.deepEqual(evaluateShip({ ...x, boundaryHit: true, boundaryWhy: 'file package.json' }).filter((k) => !k.ok).map((k) => k.id), ['spike'], 'diff가 boundary 파일을 건드려도 spike');
  assert.equal(evaluateShip({ ...x, boundaryHit: true, spikeText: '- wire: 없음\n- host: linux\n- license: MIT\n- default: 없음\n- os: 없음' }).filter((k) => !k.ok).length, 0);
  assert.deepEqual(evaluateShip({ ...x, changed: ['.garagiste/team.json', 'src/a.ts'] }).filter((k) => !k.ok).map((k) => k.id), ['unit'], 'R6: team.json 변경은 boot(scaffold)만 ship된다');
  assert.equal(evaluateShip({ ...x, unit: { ...unit, kind: 'scaffold' }, ledger: [ledger[0]], changed: ['.garagiste/team.json'] }).filter((k) => !k.ok).length, 0, 'boot는 명령을 채우는 unit이다');
  assert.deepEqual(evaluateShip({ ...x, lastSubject: 'wip: h checkpoint' }).filter((k) => !k.ok).map((k) => k.id), ['head']);
  assert.deepEqual(evaluateShip({ ...x, openQuestions: ['Q3'] }).filter((k) => !k.ok).map((k) => k.id), ['questions'], 'R12: 이 unit의 열린 질문이 ship을 막는다 — decide 뒤에');
  assert.match(evaluateShip({ ...x, unit: { ...unit, respec: [{ q: 11, at: 'T' }] } }).filter((k) => !k.ok).map((k) => `${k.id}: ${k.why}`).join(), /^questions: .*Q11.*brief\.mjs spec h/, '사고 17: 닫혔지만 spec에 반영 전인 답도 ship을 막는다 — 닫힘은 반영이 아니다');
  assert.match(evaluateShip({ ...x, ledger: [ledger[0], { ...ledger[1], tree: 'OLD' }, ledger[2]] }).filter((k) => !k.ok).map((k) => k.why).join(), /이전 tree.*redproof\.mjs h/, 'R10: 낡은 증거엔 재실행 명령이 문구에 있다');
  assert.match(evaluateShip({ ...x, ledger: [ledger[0], ledger[1], { ...ledger[2], tree: 'OLD' }] }).filter((k) => !k.ok).map((k) => k.why).join(), /이전 tree.*verify\.mjs attack h/, 'R10: attack도 같다');
  assert.deepEqual(evaluateShip({ ...x, stops: ['미검수 3'] }).filter((k) => !k.ok).map((k) => k.id), ['budget']);
  assert.deepEqual(evaluateShip({ ...x, proseKb: 41 }).filter((k) => !k.ok).map((k) => k.id), ['budget']);
  assert.deepEqual(evaluateShip({ ...x, clean: false }).filter((k) => !k.ok).map((k) => k.id), ['unit']);
  assert.equal(evaluateShip({ ...x, unit: { ...unit, kind: 'scaffold' }, ledger: [ledger[0]] }).filter((k) => !k.ok).length, 0, 'scaffold(boot)는 redproof·attack 없이 full만으로 ship');
  assert.equal(evaluateShip({ ...x, unit: { ...unit, kind: 'scaffold' }, ledger: [ledger[0]], boundaryHit: true }).filter((k) => !k.ok).length, 0, 'scaffold의 매니페스트는 spike 대상이 아니다');
});
test('ship: attack 열 = 선발견→최종 red/총 — 선발견은 이 unit 생애의 attack 실행에서 한 번이라도 red였던 adversary 파일의 합집합 (사고 23 집계 정의)', () => {
  const ledger = [
    { ts: '2026-09-30T01:00:00Z', kind: 'attack', slug: 'h', red: 1, total: 1, files: ['tests/adversary/h-old.test.mjs'] }, // drop 전 생애
    { ts: '2026-09-30T02:00:00Z', kind: 'attack', slug: 'h', red: 2, total: 3, files: ['tests/adversary/h-1.test.mjs', 'tests/adversary/h-2.test.mjs'] },
    { ts: '2026-09-30T02:10:00Z', kind: 'attack', slug: 'h', red: 1, total: 3, files: ['tests/adversary/h-3.test.mjs'] },
    { ts: '2026-09-30T02:20:00Z', kind: 'attack', slug: 'h', red: 1, total: 3, files: ['tests/adversary/h-1.test.mjs'] },
    { ts: '2026-09-30T02:30:00Z', kind: 'attack', slug: 'h', red: 0, total: 3, files: [] },
    { ts: '2026-09-30T02:40:00Z', kind: 'attack', slug: 'other', red: 5, total: 5, files: ['x'] },
  ];
  assert.equal(attackCell({ ledger, slug: 'h', since: '2026-09-30T01:30:00Z' }), '3→0/3', '원장 attack 한 줄(2/3)은 그 실행의 스냅숏 — 선발견은 실행 전체의 합집합, 같은 파일의 재-red는 한 번');
  assert.equal(attackCell({ ledger, slug: 'h' }), '4→0/3', 'since 없이는 drop 전 생애까지 센다 — ship은 unit.created를 넘긴다');
  assert.equal(attackCell({ ledger: [], slug: 'h', since: '' }), '0→0/0');
});
test('ship: team.json rebase 충돌은 키 단위 3-way — 겹치지 않으면 병합, 같은 키가 갈리면 없음 (2차 실기 사고 7)', () => {
  const base = { models: { build: 'sonnet' }, commands: { quick: '' }, paths: { ledger: 'x' } };
  const ours = { ...base, models: { build: 'opus' } };                 // main: models만 (work.mjs models)
  const theirs = { ...base, commands: { quick: 'npm test' } };         // boot: commands만 (work.mjs commands)
  assert.deepEqual(mergeTeamJson(base, ours, theirs), { models: { build: 'opus' }, commands: { quick: 'npm test' }, paths: { ledger: 'x' } });
  assert.equal(mergeTeamJson(base, ours, { ...base, models: { build: 'haiku' } }), null, '같은 키(models)를 양쪽이 다르게 — 기계 병합 없음');
  assert.deepEqual(mergeTeamJson({ a: 1, b: 2 }, { a: 1, b: 2 }, { b: 2 }), { b: 2 }, '한쪽의 키 삭제는 삭제로');
});
test('ship: spike는 필수 행 다섯이 전부 있어야 끝난 것이다', () => {
  assert.equal(spikeComplete('- wire: 없음\n- host: linux node 22\n- license: MIT 동봉\n- default: 포트 3000\n- os: 없음'), true);
  assert.equal(spikeComplete('- wire: 없음\n- host: linux'), false);
  assert.equal(spikeComplete('- wire: 없음\n- host: win11 node 24\n- license: 의존성 없음\n- default (팀이 정한 것 후보): 세계 폴더 안\n- os: 없음'), true, '사고 14: 괄호 부연이 붙은 행도 내용이 있으면 완성이다');
  assert.equal(spikeComplete('- wire: 없음\n- host: w\n- license: 없음\n- default (후보):\n- os: 없음'), false, '부연이 있어도 내용이 비면 미완 — 같은 깊이의 다음 행은 내용이 아니다');
  assert.equal(spikeComplete('- wire: 없음\n- host: w\n- license: 없음\n- default (팀이 정한 것 후보):\n  - 인덱스 위치: 세계 폴더 안\n- os: 없음'), true, '사고 16: 하위 불릿(더 깊은 들여쓰기)에 둔 내용도 완성이다');
  assert.equal(spikeOnlyFiles(['docs/measurements/spike-vault-open-ui.md'], 'docs/measurements'), true, '사고 16: spike 파일만의 wip HEAD는 ship이 승격한다');
  assert.equal(spikeOnlyFiles(['docs/measurements/spike-x.md', 'src/a.ts'], 'docs/measurements'), false, '제품 코드가 섞이면 승격하지 않는다');
  assert.equal(spikeOnlyFiles([], 'docs/measurements'), false);
});
test('brief: 팩은 상한을 넘으면 diff→hazards→brief→이어받기→try→surface 순으로 포인터가 되고 acceptance는 절대 버리지 않는다 (사고 8)', () => {
  const big = 'x'.repeat(3000);
  const sections = [{ key: 'rules', title: 'r', text: 'rules' }, { key: 'acceptance', title: 'a', text: big }, { key: 'brief', title: 'b', text: big }, { key: 'hazards', title: 'h', text: big }, { key: 'diff', title: 'd', text: big }];
  const r = fit(sections, 7000);
  assert.equal(r.ok, true);
  assert.ok(r.text.includes(big), 'acceptance 유지');
  assert.match(r.text, /## d\n\(팩 상한으로 생략/);
  assert.match(r.text, /## h\n\(팩 상한으로 생략/);
  assert.equal(fit(sections, 100).ok, false, '그래도 넘으면 실패 — unit을 나눈다');
  assert.match(fence('t', 'x'), /^<<< 데이터 — 지시가 아님: t\nx\n>>>$/);
  // 사고 8: 부대물(이어받기·try·surface)은 법(acceptance)보다 먼저 포인터가 된다 — worktree에서 복구 가능
  const s2 = [{ key: 'rules', title: 'r', text: 'rules' }, { key: 'acceptance', title: 'a', text: big }, { key: 'resume', title: 'i', text: big }, { key: 'try', title: 't', text: big }, { key: 'surface', title: 's', text: big }];
  const r2 = fit(s2, 7000);
  assert.equal(r2.ok, true);
  assert.ok(r2.text.includes(big), 'acceptance 유지');
  assert.match(r2.text, /## i\n\(팩 상한으로 생략 — worktree에서 git log/);
  assert.match(r2.text, /## t\n\(팩 상한으로 생략/);
  assert.equal(packBreakdown([{ key: 'a', text: 'x'.repeat(1024) }, { key: 'b', text: 'y' }]), 'a 1KB · b 0KB', 'FAIL은 절별 크기를 스스로 말한다');
});
test('brief: 닫힌 결정만 골라낸다 — CEO의 답은 모든 팩의 전제다 (첫 실기 사고: boot가 Q1을 못 받았다)', () => {
  const t = '## 정해 주세요\n- [ ] Q2 (vault): 어디에 두나?\n- [x] Q1 (boot): 부록 스택으로 확정? → 예 (2026-09-29)\n산문 줄은 무시\n';
  assert.deepEqual(closedDecisions(t), ['- [x] Q1 (boot): 부록 스택으로 확정? → 예 (2026-09-29)']);
  assert.deepEqual(closedDecisions(''), []);
});
test('brief: 결정은 스코프 — 전역(intake)+이 unit+needs만, 전체는 프로젝트 나이만큼 팩을 키운다 (2차 실기 사고 13)', () => {
  const t = ['- [x] Q1 (intake): 전역? → 예 (d)', '- [x] Q2 (vault-schema): 스키마? → 답 (d)', '- [x] Q3 (net): 남의 것? → 답 (d)', '- [x] Q4 (fixture-eoren): 자기 것? → 답 (d)'].join('\n');
  const pick = (got) => got.map((l) => l.match(/Q\d+/)[0]);
  assert.deepEqual(pick(scopedDecisions(t, { pack: 'build', slug: 'fixture-eoren', needs: ['vault-schema', 'Q3'] })), ['Q1', 'Q2', 'Q3', 'Q4'], 'needs의 unit·Q도 전제다');
  assert.deepEqual(pick(scopedDecisions(t, { pack: 'build', slug: 'fixture-eoren', needs: [] })), ['Q1', 'Q4'], '남의 unit 결정은 스코프 밖');
  assert.equal(scopedDecisions(t, { pack: 'boot', slug: 'boot', needs: [] }).length, 4, 'boot는 전체 — 세계 정의');
  assert.equal(scopedDecisions('- [x] Q9 슬러그 없는 줄 → 답', { pack: 'spec', slug: 'x', needs: [] }).length, 1, '못 읽는 줄은 버리지 않는다(fail-open 포함)');
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
test('work: needs의 Q 번호는 ask가 준 것만 — intake가 번호를 짐작해 한 칸 밀려 적었다 (3차 실기 사고 23)', () => {
  const dec = '# DECISIONS\n\n## 정해 주세요\n- [ ] Q2 (intake): CSV?\n\n## 정한 것\n- [x] Q1 (net): 호스트? → api (2026-09-30)\n';
  assert.deepEqual(unknownQuestions(['memo', 'Q1', 'Q2', 'Q3'], dec), ['Q3'], '없는 번호는 짐작이다 — add·needs가 거부한다');
  assert.deepEqual(unknownQuestions(['memo'], ''), []);
  const bl = ['- [ ] memo · M1 · needs: session · "m" · 인수: -', '- [ ] export · M2 · needs: - · "e" · 인수: -', '- [x] session · M1 · needs: - · "s" · 인수: -'].join('\n') + '\n';
  const t1 = setNeeds(bl, 'export', ['memo', 'Q2']);
  assert.match(t1, /^- \[ \] export · M2 · needs: memo,Q2 · "e" · 인수: -$/m);
  assert.equal(t1.replace(/^- \[ \] export .*$/m, ''), bl.replace(/^- \[ \] export .*$/m, ''), '다른 줄은 바이트 그대로');
  assert.match(setNeeds(t1, 'export', []), /^- \[ \] export · M2 · needs: - · /m, '빈 목록은 -');
  assert.equal(setNeeds(bl, 'session', ['memo']), null, '닫힌 줄은 고치지 않는다');
  assert.equal(setNeeds(bl, 'nope', ['memo']), null);
});
test('work decide: 진행 중 unit의 질문이 닫히면 spec 재개가 걸린다 — 답이 build 뒤에 와 미구현 출하됐다 (2차 실기 사고 17)', () => {
  const at = '2026-09-30T01:00:00Z';
  const units = [
    { slug: 'idx', kind: 'feature', state: 'build', created: at, questions: [11], needs: [] },
    { slug: 'fresh', kind: 'feature', state: 'spec', created: at, questions: [11], needs: [] },
    { slug: 'hit', kind: 'feature', state: 'spike', created: at, questions: [], needs: ['Q11'] },
    { slug: 'late', kind: 'feature', state: 'spike', created: at, questions: [], needs: ['Q11'] },
    { slug: 'old', kind: 'feature', state: 'shipped', created: '2026-09-29T01:00:00Z', questions: [11], needs: [] },
    { slug: 'gone', kind: 'feature', state: 'dropped', created: at, questions: [11], needs: [] },
    { slug: 'other', kind: 'feature', state: 'build', created: at, questions: [12], needs: [] },
    { slug: 'boot', kind: 'scaffold', state: 'boot', created: at, questions: [11], needs: [] },
  ];
  const ledger = [
    { ts: '2026-09-29T02:00:00Z', kind: 'pack', slug: 'fresh', pack: 'spec' }, // 이전 생애(drop 전)의 spec — 세지 않는다
    { ts: '2026-09-30T02:00:00Z', kind: 'pack', slug: 'idx', pack: 'spec' },
    { ts: '2026-09-30T02:30:00Z', kind: 'pack', slug: 'idx', pack: 'build' },
    { ts: '2026-09-30T02:00:00Z', kind: 'pack', slug: 'late', pack: 'spec' },
    { ts: '2026-09-30T02:00:00Z', kind: 'pack', slug: 'gone', pack: 'spec' },
    { ts: '2026-09-30T02:00:00Z', kind: 'pack', slug: 'other', pack: 'spec' },
  ];
  assert.deepEqual(respecTargets({ units, ledger, n: 11 }), ['idx', 'late'], 'spec이 답 없이 이미 돈 진행 중 unit만(늦은 spike 포함) — 첫 spec 전(fresh·hit)은 그 팩이 답을 담는다, 출하·dropped·scaffold는 대상이 아니다');
  assert.deepEqual(respecTargets({ units, ledger, n: 13 }), []);
});
test('doctor: R8 — fresh 항목(alive·빈 commands)만 통과, 구조 결함은 seed·ship을 막는다', () => {
  const probs = ['session-start alive 마커 없음 → 첫 세션이면 정상', 'team.json commands.quick 비어 있음 → boot이 채운다', 'core.hooksPath=(없음) → git config core.hooksPath .githooks'];
  assert.deepEqual(blocking(probs), [probs[2]], '훅 침묵사 계열은 fresh가 아니다');
  assert.deepEqual(blocking(probs.slice(0, 2)), []);
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
  assert.deepEqual(it, { done: false, slug: 'login', milestone: 'M2', needs: ['session', 'Q3'], origin: '이메일로 ”로그인”한다', accept: 'POST /login → 200', kind: 'feature' });
  assert.equal(parseBacklog('- [x] a · M1 · needs: - · "x" · 인수: -')[0].done, true);
  assert.equal(parseBacklog('- [ ] 옛 형식 — "x"').length, 0);
  const b = parseBacklog(backlogLine({ slug: 'boot', origin: '메모 도구', accept: '뜬다', kind: 'scaffold' }))[0];
  assert.equal(b.kind, 'scaffold'); assert.equal(b.accept, '뜬다');
  assert.equal(parseBacklog(backlogLine({ slug: 'x', origin: 'y' }))[0].kind, 'feature');
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
test('work seed: dropped unit은 자리를 막지 않고 같은 slug가 새로 열린다', () => {
  const items = parseBacklog('- [ ] a · M1 · needs: - · "a" · 인수: -');
  assert.equal(pickReady({ order: ['a'], items, units: [{ slug: 'a', state: 'dropped' }] }).slug, 'a', 'kill-and-respawn: 버린 unit이 ACTIVE로 잡히면 안 된다');
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

test('lib: dirtyFiles는 porcelain 선행 공백을 살린다 — 첫 줄이 비스테이징 수정이면 경로 첫 글자가 잘렸다 (2차 실기 사고 12)', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-dirty-'));
  const g = (args) => spawnSync('git', args, { cwd: d, encoding: 'utf8' });
  g(['init', '-q']); g(['config', 'user.email', 'x@x']); g(['config', 'user.name', 'x']);
  fs.mkdirSync(path.join(d, 'docs'));
  fs.writeFileSync(path.join(d, 'docs', 'BACKLOG.md'), 'a\n');
  g(['add', '-A']); g(['commit', '-q', '-m', 'init']);
  fs.writeFileSync(path.join(d, 'docs', 'BACKLOG.md'), 'b\n'); // 수정만, 스테이징 없음 → ' M docs/BACKLOG.md'
  assert.deepEqual(dirtyFiles(d), ['docs/BACKLOG.md'], "'ocs/BACKLOG.md'가 아니다");
});
test('lib: workTree는 실제 인덱스를 씨앗으로 — filemode=false에서 chmod된 새 파일의 모드를 잃지 않는다 (win32 사고 19)', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-wt-'));
  const g = (a) => spawnSync('git', a, { cwd: d, encoding: 'utf8' });
  g(['init', '-q']); g(['config', 'user.email', 'x@x']); g(['config', 'user.name', 'x']); g(['config', 'core.filemode', 'false']); // NTFS 재현
  fs.writeFileSync(path.join(d, 'a.txt'), 'x\n'); g(['add', '-A']); g(['commit', '-q', '-m', 'init']);
  fs.writeFileSync(path.join(d, 'hook'), '#!/bin/sh\n'); // HEAD에 없는 새 파일
  g(['add', 'hook']); g(['update-index', '--chmod=+x', 'hook']); // 실제 인덱스 100755
  assert.equal(workTree(d), indexTree(d), '내용 diff 0이면 tree도 같아야 한다 — 모드 유령 불일치 금지');
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
  assert.equal(TIERS.medium.boot, 'sonnet');
  assert.match(setFrontmatterModel('---\nname: build\nmodel: sonnet\ntools: Read\n---\n본문', 'opus'), /^---\nname: build\nmodel: opus\ntools: Read\n---\n본문$/);
  assert.match(setFrontmatterModel('---\ndescription: x\nmode: subagent\n---\n본문', 'anthropic/claude-sonnet-4-5'), /^---\nmodel: anthropic\/claude-sonnet-4-5\ndescription: x/);
});

test('lib: repoRoot와 mainRoot는 같은 저장소에서 같은 문자열이다 — win32 사고(슬래시/역슬래시)로 decide·drop·tried가 메인에서도 거부됐다', async () => {
  const { repoRoot, mainRoot } = await import('../team/scripts/lib.mjs');
  const cwd = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')));
  assert.equal(repoRoot(cwd), mainRoot(cwd), 'c.root===c.main 비교의 전제 — red는 win32에서만 관측된다(사고 재현이 그 red)');
  assert.equal(repoRoot(cwd), path.resolve(repoRoot(cwd)), '플랫폼 표기로 정규화된다');
});
test('lib: Windows PowerShell이 붙인 BOM이 있어도 team.json을 읽는다', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-bom-'));
  fs.mkdirSync(path.join(d, '.garagiste'));
  fs.writeFileSync(path.join(d, '.garagiste', 'team.json'), '\uFEFF' + JSON.stringify(team));
  assert.equal(loadTeam(d).version, 2);
  assert.equal(readJson(path.join(d, '.garagiste', 'team.json'), null).version, 2);
  // 사고 18: 폴더 이름('GARAGISTE')을 가정하면 fresh 클론(GARAGISTE-fresh)·scratch worktree에서 거짓 실패 — 경로로 비교한다
  assert.equal(scriptRoot(new URL('../team/scripts/lib.mjs', import.meta.url).href), path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), '스크립트 위치에서 저장소 루트를 안다');
});
