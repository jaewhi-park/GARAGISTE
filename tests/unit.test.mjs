// 단위: 판단 없는 함수들이 정한 대로 판단하는가.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cdBase, decide, expandAssignments, expandTemp, inlineCodeWrite, isTempPath, makeCtx, stripQuoted, worktreeFromCommand, writeTargets } from '../team/scripts/guard-rules.mjs';
import { checkpoint, spawnStop } from '../team/scripts/checkpoint.mjs';
import { checkBoundary } from '../team/scripts/boundary.mjs';
import { blindFiles, gateDecision, gateFailLine, logicLines, probeNames, PROBE_TEXT } from '../team/scripts/verify.mjs';
import { parseTags, pickNext, coverage } from '../team/scripts/claims.mjs';
import { attackCell, evaluateShip, evidenceCommitMessage, mergeTeamJson, setupGap, spikeComplete, spikeOnlyFiles } from '../team/scripts/ship.mjs';
import { againCmd, attackRoundUsed, autoLane, closedDecisions, fit, fence, laneAdvice, matchHazards, overflowAdvice, packBreakdown, packLane, scopedDecisions, tailSections } from '../team/scripts/brief.mjs';
import { firstLine, budgetStatus, humanNeeded, reportText, repeatedFails } from '../team/scripts/state.mjs';
import { baseGreenAdvice, blindAdvice, outcome, verdict } from '../team/scripts/redproof.mjs';
import { acceptWithDecision, questionText, nextQuestionNumber, decideLine, parseBacklog, backlogLine, closure, pickReady, resolveModels, setFrontmatterModel, TIERS, unknownQuestions, setNeeds, respecTargets, seedGate, listLines, parseArgs, keepsAssumption } from '../team/scripts/work.mjs';
import { blocking, diagnose } from '../team/scripts/doctor.mjs';
import { nextStep, render } from '../team/scripts/next.mjs';
import { DEFAULTS as CONDUCT_DEFAULTS, EXIT, failKey, headlessEnv, holdCommand, lockAlive, noProgress, parseArgs as conductArgs, parseResult, spawnerCommand, specReturn, stopLine } from '../team/scripts/conduct.mjs';
import { versionLine } from '../team/scripts/doctor.mjs';
import { PACKS as WORK_PACKS } from '../team/scripts/work.mjs';
import { PACKS as BRIEF_PACKS } from '../team/scripts/brief.mjs';
import { PACKS as CP_PACKS } from '../team/scripts/checkpoint.mjs';
import { orphanOf, runChild, spawnerGap } from '../team/scripts/conduct.mjs';
import { secretTargets } from '../team/scripts/guard-rules.mjs';
import { pinRedAdvice, pinVerdict } from '../team/scripts/redproof.mjs';
import { FLAGS, KINDS } from '../team/scripts/work.mjs';
import { REFACTOR_NOTE } from '../team/scripts/brief.mjs';
import { acceptanceFiles, adversaryFiles, dirtyFiles, fileCmd, hasFileSlot, shell, globToRegex, indexTree, parseLocalEnv, depDirs, linkDeps, unlinkDeps, quarantineStray, readJson, loadTeam, scriptRoot, strayPaths, workTree } from '../team/scripts/lib.mjs';

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
test('guard: L2 1일차 — 원장 읽기·heredoc trailer는 쓰기가 아니고, conductor의 mv·rm·cp·tee는 worktree 밖이면 쓰기다', () => {
  // 오탐 둘 — 막혀서는 안 되는 것
  assert.equal(decide(bash('grep spawn .garagiste/ledger/evidence.jsonl | sed -n 1,5p'), gctx(null)), null, '원장 읽기(sed -n)는 쓰기가 아니다 — 표 산출이 막혔다');
  assert.equal(decide(bash('cat .garagiste/ledger/evidence.jsonl 2>/dev/null | tail -3'), gctx(null)), null, '2>/dev/null은 원장을 향하지 않는다');
  const trailer = "git -C .worktrees/hello commit -F - <<'EOF'\nfeat: y\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_1\nEOF";
  assert.equal(decide(bash(trailer), gctx('build')), null, 'heredoc 본문은 데이터 — <…>의 >를 리다이렉트로 읽어 다음 줄을 쓰기 대상으로 거부했다');
  // 원장 쓰기는 그대로 막힌다
  assert.ok(decide(bash('echo x >> .garagiste/ledger/evidence.jsonl'), gctx(null)));
  assert.ok(decide(bash('sed -i "s/a/b/" .garagiste/units/hello.json'), gctx(null)));
  assert.ok(decide(bash('rm .garagiste/ledger/evidence.jsonl'), gctx(null)));
  // heredoc 뒤의 리다이렉트와 따옴표 없는 본문의 $()는 여전히 셸이다
  assert.match(decide(bash('cat <<EOF > notes.txt\nhello\nEOF'), gctx(null)) || '', /worktree 밖/);
  assert.ok(decide(bash('cat <<EOF\n$(echo x > .garagiste/team.json)\nEOF'), gctx(null)), '따옴표 없는 heredoc의 $()는 실행된다');
  // 구멍 — conductor의 mv·rm·cp·tee는 리다이렉트와 같은 쓰기다
  assert.match(decide(bash('mv eoren.sqlite /tmp/scratch/'), gctx(null)) || '', /옮기거나 지우지 않는다/, 'CEO의 파일이 옮겨졌다(L2 1일차)');
  assert.match(decide(bash('rm fixtures/eoren/eoren.sqlite'), gctx(null)) || '', /옮기거나 지우지 않는다/);
  assert.match(decide(bash('cp a.md b.md'), gctx(null)) || '', /옮기거나 지우지 않는다/);
  assert.match(decide(bash('echo x | tee notes.txt'), gctx(null)) || '', /옮기거나 지우지 않는다/);
  assert.equal(decide(bash('rm -rf /tmp/scratch/x'), gctx(null)), null, '저장소 밖은 팀의 경계가 아니다');
  assert.equal(decide(bash('cp /tmp/a.log /tmp/b.log'), gctx(null)), null);
  assert.equal(decide(bash('cat src/rm/notes.md'), gctx(null)), null, '경로 속 rm은 명령이 아니다');
  assert.equal(decide(bash('mv eoren.sqlite /tmp/x'), { ...gctx(null), env: { GARAGISTE_ADMIN: '1' } }), null, 'CEO(ADMIN) 세션은 예외');
  assert.equal(decide(bash('rm -rf dist', `${root}/.worktrees/hello`), gctx('build')), null, '팩의 worktree 안 정리는 그대로');
  assert.equal(decide(bash('cd .worktrees/hello && rm -rf dist'), gctx('build')), null, '한 명령 안의 cd는 상대 경로의 뿌리다 — 훅의 cwd는 명령 전 위치');
  assert.equal(decide(bash('cd .worktrees/hello && echo x > src/a.mjs'), gctx('build')), null, '리다이렉트도 같은 뿌리로');
  assert.match(decide(bash('cd .worktrees/hello && rm ../../src/a.ts'), gctx('build')) || '', /옮기거나 지우지 않는다/, 'worktree 탈출은 여전히 막힌다');
  // 메모리 — 거부는 그대로, 이유를 말해 재시도를 멈춘다
  assert.match(decide(write('/home/u/.claude/projects/p/memory/MEMORY.md'), gctx(null)) || '', /메모리 파일은 쓰지 않는다/);
});
test('guard: 필드 시험 — git 전역 옵션(-C·-c) 뒤의 파괴 명령도 막고, -c core.hooksPath로 게이트를 끄는 우회를 막는다', () => {
  const wt = `${root}/.worktrees/hello`;
  assert.ok(decide(bash('git -C .worktrees/x reset --hard'), gctx(null)), '-C 뒤의 reset --hard — 붙은 형태만 보던 구멍');
  assert.ok(decide(bash('git -C .worktrees/x commit --no-verify -m a'), gctx(null)));
  assert.ok(decide(bash('git -C x -c user.name=a stash'), gctx(null)));
  assert.ok(decide(bash('git -C x push origin main'), gctx(null)));
  assert.match(decide(bash('git -c core.hooksPath=/dev/null commit -m a', wt), gctx('build')) || '', /게이트 우회/, '훅 경로를 바꾸면 커밋 게이트가 꺼진다');
  assert.match(decide(bash('git -C x -c core.hookspath=x commit -m a'), gctx(null)) || '', /게이트 우회/, '대소문자 무관');
  assert.match(decide(bash('git -C .worktrees/hello push'), gctx('build')) || '', /push하지 않는다/, 'worktree 안 push도 -C로 빠지지 않는다');
  assert.equal(decide(bash(`git -C ${wt} add -A`), gctx('build')), null, '-C 자체는 정상 — 팩이 worktree에서 일하는 길');
  assert.equal(decide(bash(`git -C ${wt} commit -m "feat: x"`), gctx('build')), null);
  assert.equal(decide(bash('git -C x log --oneline'), gctx(null)), null);
});
test('settings: 팩이 worktree에서 일하는 명령(cd·git -C)이 허용 목록에 있다 — 없으면 헤드리스·신규 설치에서 boot가 커밋하지 못해 루프가 멈춘다 (필드 시험)', () => {
  const st = JSON.parse(fs.readFileSync(new URL('../team/claude/settings.json', import.meta.url), 'utf8'));
  for (const r of ['Bash(cd:*)', 'Bash(git -C:*)']) assert.ok(st.permissions.allow.includes(r), r);
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
test('guard: 사고 60(L2 5판 리눅스 1라운드) — 큰따옴표 안의 이스케이프된 백틱·작은따옴표·<번호>는 데이터다, 따옴표는 한 글자씩 걷는다', () => {
  // intake가 BRIEF 원문을 그대로 add에 넣은 명령 — \`…\`를 백틱 치환으로 읽어 안의 >를 리다이렉트로, \`를 쓰기 대상으로 봤다(에이전트는 원문의 따옴표를 ”로 바꿔 우회했다)
  const add = String.raw`node .garagiste/scripts/work.mjs add done-undo "\`todo done <번호>\`로 끝내고, \`todo undo <번호>\`로 되돌린다." --milestone M1 --accept "todo list stdout이 '밀림' 포함; todo undo <--all 번호> 뒤 다시 보임" && \
node .garagiste/scripts/work.mjs add bad-input "잘못된 입력은 0이 아닌 코드로 끝난다." --accept "todo add x --due 2026-02-30 → exit≠0"`;
  assert.equal(decide(bash(add), gctx(null)), null, 'intake의 add는 쓰기가 아니다');
  assert.equal(decide(bash(`echo "it's > x"`), gctx(null)), null, '큰따옴표 안의 작은따옴표가 짝을 어긋나게 하지 않는다');
  assert.equal(stripQuoted(String.raw`echo "\`a > b\`"`).includes('>'), false, '이스케이프된 백틱은 치환이 아니다');
  assert.ok(decide(bash('echo "`cat x > .garagiste/team.json`"'), gctx(null)), '이스케이프 안 된 백틱은 실행이다 — 여전히 거부');
  assert.ok(decide(bash('echo "$(echo "a" > .garagiste/team.json)"'), gctx(null)), '큰따옴표 안 $()의 안쪽 따옴표도 따라 걷는다');
  assert.match(decide(bash('echo "unterminated > .garagiste/team.json'), gctx(null)) || '', /규칙집/, '닫히지 않은 따옴표는 셸로 본다(fail-closed)');
  assert.equal(decide(bash(String.raw`echo a\>b`), gctx(null)), null, '따옴표 밖의 이스케이프된 >는 데이터다');
});
test('guard: 사고 62(L2 5판 리눅스 2라운드) — slug·경로 속 rm(edit-rm)은 지우기 verb가 아니다, 명령 자리의 rm은 그대로 쓰기다', () => {
  const wt = `${root}/.worktrees/edit-rm`;
  // build 팩이 공격 테스트 둘을 돌리고 소스를 읽는 명령 — \brm\b이 edit-rm-1.test.mjs의 rm에 걸려 다음 인자 edit-rm-2.test.mjs를 쓰기 대상으로 봤다(가드 거부 1 · 읽기만 하는 명령)
  const run = `cd ${wt}; node --test tests/adversary/edit-rm-1.test.mjs tests/adversary/edit-rm-2.test.mjs 2>&1 | grep -v "^#" | grep -B2 -A25 "not ok" | head -80; cat src/todo.mjs`;
  assert.deepEqual(writeTargets(run), []);
  assert.equal(decide(bash(run, wt), gctx('build')), null, '읽기만 하는 명령이 거부됐다');
  assert.deepEqual(writeTargets('node x.mjs --out tests/adversary/edit-mv-1.test.mjs'), [], 'slug 속 mv도 verb가 아니다');
  assert.deepEqual(writeTargets('rm tests/adversary/edit-rm-2.test.mjs'), ['tests/adversary/edit-rm-2.test.mjs']);
  assert.deepEqual(writeTargets('git rm -q tests/adversary/x.test.mjs'), ['tests/adversary/x.test.mjs']);
  assert.deepEqual(writeTargets('/bin/rm -f tests/adversary/x.test.mjs'), ['tests/adversary/x.test.mjs'], '절대 경로의 rm은 verb다');
  assert.deepEqual(writeTargets('true &&rm tests/adversary/x.test.mjs'), ['tests/adversary/x.test.mjs']);
  assert.deepEqual(writeTargets('cp a.mjs tests/acceptance/edit-rm.test.mjs'), ['tests/acceptance/edit-rm.test.mjs']);
  assert.match(decide(bash('rm tests/adversary/edit-rm-2.test.mjs', wt), gctx('build')) || '', /build 팩은 tests\/adversary\/edit-rm-2\.test\.mjs에 쓸 수 없다/);
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
test('checkpoint: ship이 멈춰 둔 rebase 한가운데서는 wip를 커밋하지 않는다 — 잇는 것은 ship이다 (L2 1일차 사고 26)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-ckpt-rb-'));
  const wt = path.join(root, '.worktrees', 'rb');
  fs.mkdirSync(wt, { recursive: true });
  const g = (args) => spawnSync('git', args, { cwd: wt, encoding: 'utf8' });
  g(['init', '-q', '-b', 'main']); g(['config', 'user.email', 'x@x']); g(['config', 'user.name', 'x']);
  fs.writeFileSync(path.join(wt, 'f.txt'), 'base\n'); g(['add', '-A']); g(['commit', '-q', '-m', 'base']);
  g(['checkout', '-q', '-b', 'u']); fs.writeFileSync(path.join(wt, 'f.txt'), 'unit\n'); g(['commit', '-q', '-am', 'unit']);
  g(['checkout', '-q', 'main']); fs.writeFileSync(path.join(wt, 'f.txt'), 'main\n'); g(['commit', '-q', '-am', 'main']);
  g(['checkout', '-q', 'u']);
  assert.notEqual(g(['rebase', 'main']).status, 0, '충돌로 rebase가 멈춘다');
  fs.mkdirSync(path.join(root, '.garagiste', 'units'), { recursive: true });
  fs.writeFileSync(path.join(root, '.garagiste', 'units', 'rb.json'), JSON.stringify({ slug: 'rb', state: 'build' }));
  const head = g(['rev-parse', 'HEAD']).stdout;
  assert.deepEqual(checkpoint(root), [], '충돌 중인 worktree는 건너뛴다');
  assert.equal(g(['rev-parse', 'HEAD']).stdout, head, 'HEAD 그대로');
  assert.ok(fs.existsSync(path.join(wt, '.git', 'rebase-merge')), 'rebase는 멈춘 그대로 — ship이 잇는다');
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
test('lib: 사고 30(필드 시험 1) — 수용·공격 파일은 저장소의 눈으로 센다: 무시 파일(__pycache__/*.pyc)은 테스트가 아니고, 아직 커밋 안 한 새 테스트는 테스트다', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-files-'));
  const g = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
  g('init', '-q');
  const w = (rel, text = 'x') => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
  w('.gitignore', '__pycache__/\n');
  w('tests/acceptance/add_test.py'); w('tests/adversary/add-1.py');
  g('add', '-A'); g('commit', '-q', '-m', 'x');
  w('tests/acceptance/__pycache__/add_test.cpython-311.pyc'); w('tests/adversary/__pycache__/add-1.cpython-311.pyc');
  w('tests/acceptance/add_more_test.py'); // spec이 막 쓴, 아직 커밋 안 한 주장
  assert.deepEqual(acceptanceFiles(root, team, 'add'), ['tests/acceptance/add_more_test.py', 'tests/acceptance/add_test.py']);
  assert.deepEqual(adversaryFiles(root, team, 'add'), ['tests/adversary/add-1.py']);
  fs.rmSync(path.join(root, 'tests/acceptance/add_test.py'));
  assert.deepEqual(acceptanceFiles(root, team, 'add'), ['tests/acceptance/add_more_test.py'], '지운 파일은 인덱스에 남아도 없다');
});
test('lib: 사고 31(필드 시험 1) — worktree에서 불린 스크립트는 main의 법으로 돈다: 갈라진 뒤 main에 든 정비가 진행 중 unit에 닿는다', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-law-'));
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const g = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', env });
  g('init', '-q');
  const dir = path.join(root, '.garagiste', 'scripts');
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(new URL('../team/scripts/lib.mjs', import.meta.url), path.join(dir, 'lib.mjs'));
  const probe = (v, code) => `import { isMain } from './lib.mjs';\nif (isMain(import.meta.url)) { console.log('law ${v} ' + process.argv.slice(2).join(',') + ' ' + process.cwd()); process.exitCode = ${code}; }\n`;
  fs.writeFileSync(path.join(dir, 'probe.mjs'), probe('v1', 0));
  g('add', '-A'); g('commit', '-q', '-m', 'x');
  g('worktree', 'add', '-q', '.worktrees/u', '-b', 'unit/u');
  const wt = path.join(root, '.worktrees', 'u');
  const run = () => spawnSync(process.execPath, [path.join(wt, '.garagiste', 'scripts', 'probe.mjs'), 'a', 'b'], { cwd: wt, encoding: 'utf8', env });
  assert.equal(run().stdout.trim().split(' ')[1], 'v1', '같은 법이면 그대로');
  fs.writeFileSync(path.join(dir, 'probe.mjs'), probe('v2', 3)); // 정비 반영(main)
  const r = run();
  const [, v, args, cwd] = r.stdout.trim().split(' ');
  assert.equal(v, 'v2', '진행 중 unit의 worktree 사본(v1)이 아니라 main의 법(v2)');
  assert.equal(args, 'a,b'); assert.equal(fs.realpathSync(cwd), fs.realpathSync(wt), '인자와 cwd(worktree)는 그대로');
  assert.equal(r.status, 3, '종료 코드도 그대로');
});
test('lib: 사고 40(필드 벤치 1 정비) — worktree의 스크립트를 밖(main 루트)에서 경로로 부르면 그 worktree가 뿌리다: build의 verify quick이 main을 검증해 게이트가 끝없이 거부했다', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-where-'));
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const g = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', env });
  g('init', '-q');
  const dir = path.join(root, '.garagiste', 'scripts');
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(new URL('../team/scripts/lib.mjs', import.meta.url), path.join(dir, 'lib.mjs'));
  fs.writeFileSync(path.join(dir, 'probe.mjs'), "import { isMain, repoRoot } from './lib.mjs';\nif (isMain(import.meta.url)) console.log(repoRoot());\n");
  g('add', '-A'); g('commit', '-q', '-m', 'x');
  g('worktree', 'add', '-q', '.worktrees/u', '-b', 'unit/u');
  const wt = path.join(root, '.worktrees', 'u');
  const at = (script, cwd) => fs.realpathSync(spawnSync(process.execPath, [script], { cwd, encoding: 'utf8', env }).stdout.trim());
  assert.equal(at(path.join(wt, '.garagiste', 'scripts', 'probe.mjs'), root), fs.realpathSync(wt), 'headless에서 cd가 막혀 build가 worktree 스크립트를 경로로 불렀다 — main이 아니라 그 worktree를 본다');
  assert.equal(at(path.join(root, '.garagiste', 'scripts', 'probe.mjs'), wt), fs.realpathSync(wt), 'cwd가 스크립트의 저장소 안이면 cwd가 뿌리다(main의 스크립트를 worktree에서)');
  assert.equal(at(path.join(root, '.garagiste', 'scripts', 'probe.mjs'), root), fs.realpathSync(root));
  assert.equal(at(path.join(wt, '.garagiste', 'scripts', 'probe.mjs'), os.tmpdir()), fs.realpathSync(wt), '저장소 밖에서 불러도 그 스크립트의 저장소');
});
test('ship: 사고 34(필드 시험 2) — 의존성 출하인데 설치 명령이 없거나 무동작(true)이면 머지 전에 멈추고 CEO의 한 줄을 준다', () => {
  for (const setup of [undefined, '', 'true', ' : ', 'exit 0']) assert.match(setupGap({ depChanged: true, setup }), /의존성 출하인데 설치 명령이 없다[\s\S]*GARAGISTE_ADMIN=1 node \.garagiste\/scripts\/work\.mjs commands setup=/, String(setup));
  assert.equal(setupGap({ depChanged: true, setup: 'npm install' }), null);
  assert.equal(setupGap({ depChanged: false, setup: 'true' }), null, '의존성이 안 바뀌면 상관없다');
});
test('redproof: 사고 36(필드 시험 2) — base에서 green(앞 unit이 이미 만든 기능)이면 CEO의 두 길을 명령으로 준다', () => {
  const m = baseGreenAdvice('persist', ['tests/acceptance/persist.test.js']);
  assert.match(m, /^FAIL redproof persist: base에서 green — tests\/acceptance\/persist\.test\.js — 기존 코드가 이 주장을 이미 만족한다/);
  assert.match(m, /CEO 결정[\s\S]*work\.mjs drop persist "이미 충족 — <근거>" --forget[\s\S]*brief\.mjs spec persist 재spawn/);
  // 사고 59(홀드아웃 library 3일차): CEO 결정만 요구하는 FAIL이 열린 Q가 되지 않아 seed가 그 unit을 일하는 중으로 보고 다른 unit을 막았다
  assert.match(m, /그 unit만 세우고 다음 seed로[\s\S]*work\.mjs ask persist "[^"]+" --hold/, 'CEO 결정의 FAIL은 그 unit만 세우는 명령을 준다');
});
test('lib: 사고 48 — test_file은 {file}(파일 하나) 또는 {files}(여러 파일을 한 번에)', () => {
  assert.ok(hasFileSlot('node --test {file}') && hasFileSlot('node --test {files}') && !hasFileSlot('node --test') && !hasFileSlot(undefined));
  assert.equal(fileCmd('pytest {file}', ['a.py']), 'pytest a.py');
  assert.equal(fileCmd('node --test {files}', ['a.js', 'b.js']), 'node --test a.js b.js');
  assert.equal(fileCmd('node --test {files}', ['a.js']), 'node --test a.js', '파일 하나(redproof·attack)도 {files}로');
});
test('lib: 사고 54(홀드아웃 Go) — 증거는 지금 tree의 실행: go test의 결과 캐시를 끈다(GOFLAGS -count=1), 이미 정한 -count는 둔다', () => {
  const get = () => shell(`node -e "process.stdout.write(process.env.GOFLAGS || '')"`).stdout;
  const prev = process.env.GOFLAGS;
  try {
    delete process.env.GOFLAGS; assert.equal(get(), '-count=1');
    process.env.GOFLAGS = '-mod=mod'; assert.equal(get(), '-mod=mod -count=1');
    process.env.GOFLAGS = '-count=3'; assert.equal(get(), '-count=3');
  } finally { if (prev === undefined) delete process.env.GOFLAGS; else process.env.GOFLAGS = prev; }
});
test('build 팩: 사고 55(홀드아웃 Go) — 산문의 「쓸 수 없는 곳」은 훅의 거부와 같고, tests/unit은 build의 것이다', () => {
  const md = fs.readFileSync(new URL('../team/packs/build.md', import.meta.url), 'utf8');
  const listed = [...(/^쓸 수 없는 곳\(훅이 거부\): (.*)$/m.exec(md) || ['', ''])[1].split('`. ')[0].concat('`').matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  assert.ok(listed.length >= 5);
  const wt = `${root}/.worktrees/hello`;
  const sample = (p) => (p === '.garagiste/**' ? '.garagiste/team.json' : p.replace('**', 'x').replace('*', 'x')); // .garagiste는 규칙집(team.json·scripts·packs·HAZARDS·ledger)을 막는다
  for (const p of listed) assert.ok(decide(write(`${wt}/${sample(p)}`), gctx('build')), `산문이 막는다면 훅도 막는다: ${p}`);
  assert.equal(decide(write(`${wt}/tests/unit/smoke_test.go`), gctx('build')), null, '훅은 tests/unit을 막지 않는다');
  assert.match(md, /`tests\/unit\/`[^\n]*네 것/, '산문도 그렇게 말한다 — 「테스트를 고쳐 초록을 만드는 길은 없다」를 스모크까지 막는 줄로 읽은 build가 spec에 반려했고 spec은 기각, 둘 다 못 고쳐 멈췄다');
});
test('lib: try 사본 — 지우기 전에 의존성 링크만 끊는다(정션을 따라가 main의 의존성을 지우지 않게), 실물 디렉터리는 건드리지 않는다', () => {
  const main = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-unlink-')); const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-unlink-copy-'));
  fs.mkdirSync(path.join(main, 'node_modules', 'dep'), { recursive: true }); fs.writeFileSync(path.join(main, 'node_modules', 'dep', 'index.js'), 'x');
  linkDeps(main, dest);
  assert.ok(fs.lstatSync(path.join(dest, 'node_modules')).isSymbolicLink());
  fs.mkdirSync(path.join(dest, 'web', 'node_modules'), { recursive: true }); // 사본 안에서 새로 깐 실물은 링크가 아니다
  fs.mkdirSync(path.join(main, 'web', 'node_modules'), { recursive: true });
  unlinkDeps(main, dest);
  assert.ok(!fs.existsSync(path.join(dest, 'node_modules')), '링크는 끊겼다');
  assert.ok(fs.existsSync(path.join(main, 'node_modules', 'dep', 'index.js')), 'main의 의존성은 그대로');
  assert.ok(fs.existsSync(path.join(dest, 'web', 'node_modules')), '링크가 아닌 실물은 남는다(사본과 함께 git이 지운다)');
});
test('redproof: 사고 47(필드 벤치 넷) — 일부만 base green(먼저 출하된 unit이 한 주장을 채웠다)이면 drop을 주지 않고 충족된 파일만 빼는 길을 준다', () => {
  const m = baseGreenAdvice('jsonl-store', ['tests/acceptance/jsonl-store_handedit.py'], ['tests/acceptance/jsonl-store_cp949.py']);
  assert.match(m, /^FAIL redproof jsonl-store: 부분 충족 — base에서 green tests\/acceptance\/jsonl-store_handedit\.py · base에서 red tests\/acceptance\/jsonl-store_cp949\.py/);
  assert.match(m, /drop은 red 주장까지 닫는다[\s\S]*CEO 결정[\s\S]*brief\.mjs spec jsonl-store --met "<CEO 말 그대로>"[\s\S]*redproof[\s\S]*brief\.mjs spec jsonl-store 재spawn/);
  assert.ok(!m.includes('work.mjs drop'), '남은 red 주장(CEO가 정한 CP949)을 닫는 drop은 길이 아니다');
  assert.match(m, /work\.mjs ask jsonl-store "[^"]+" --hold/, '사고 59: 부분 충족도 CEO 결정 — 그 unit만 세운다');
});
test('verify: 사고 57(벤치 070f185 파이썬) — exit 0만으로는 test_file이 그 파일을 돌렸는지 모른다: 같은 자리·같은 이름의 깨진 사본도 exit 0이면 그 명령은 그 파일을 돌리지 않는다', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-blind-'));
  fs.mkdirSync(path.join(d, 'tests/acceptance'), { recursive: true });
  fs.writeFileSync(path.join(d, 'tests/acceptance/add-entry_cli.js'), 'module.exports = 1;\n');
  // 벤치의 run.py 꼴: 파일 인자를 모듈 이름으로 찾는다 — 모듈 이름이 될 수 없는 하이픈 이름은 0건 실행·exit 0
  const discover = `node -e "const p = require('path'); const f = process.argv[1]; if (!p.basename(f).includes('-')) require(p.resolve(f))" {file}`;
  const files = ['tests/acceptance/add-entry_cli.js', 'tests/acceptance/smoke_cli.js'];
  assert.deepEqual(blindFiles(discover, files, d), ['tests/acceptance/add-entry_cli.js']);
  assert.deepEqual(blindFiles('node {file}', files, d), [], '받은 파일을 그대로 돌리는 러너엔 깨진 사본이 red다');
  assert.deepEqual(blindFiles('node {files}', files, d), [], '{files} 러너엔 파일 하나를 넣는다');
  assert.equal(fs.readFileSync(path.join(d, 'tests/acceptance/add-entry_cli.js'), 'utf8'), 'module.exports = 1;\n', '탐침은 원본을 되돌린다');
  assert.ok(!fs.existsSync(path.join(d, 'tests/acceptance/smoke_cli.js')), '없던 자리는 지운다');
  assert.match(PROBE_TEXT, /^\)\(/, '어느 언어로도 문법 오류 — 닫는 괄호로 시작한다');
});
test('redproof: 사고 57 — base green이 눈먼 test_file(0건 실행)이면 「이미 충족」이 아니다: drop 대신 boot의 하네스를 고치는 scaffold unit이 먼저', () => {
  const m = blindAdvice('add-entry', ['tests/acceptance/add-entry_cli.py'], { milestone: 'M1', needs: ['boot', 'Q1'] });
  assert.match(m, /^FAIL redproof add-entry: test_file이 이 파일을 실제로 돌리지 않는다 — tests\/acceptance\/add-entry_cli\.py/);
  assert.match(m, /이미 충족이 아니다/);
  assert.doesNotMatch(m, /이미 충족 — <근거>/, '벤치의 안내(drop --forget)는 만들지도 않은 기능을 닫는다');
  assert.match(m, /work\.mjs drop add-entry "[^"]+" \(--forget 없이/);
  assert.match(m, /work\.mjs add add-entry-harness "[^"]+" --kind scaffold --milestone M1/);
  assert.match(m, /work\.mjs ask add-entry "[^"]+" --hold/, '사고 59: 하네스 먼저도 CEO 결정 — 그 unit만 세운다');
  assert.match(m, /work\.mjs needs add-entry boot,Q1,add-entry-harness/, '선행은 지우지 않고 더한다');
  assert.match(m, /work\.mjs scope --milestone M1/);
});
test('ship: 사고 57 — scaffold의 redproof는 러너 자신의 red 증명이다: boot의 tests/unit 파일 이름에 slug 꼴(하이픈) 머리를 붙인 깨진 탐침을 인수·공격 자리에서 test_file로', () => {
  assert.deepEqual(probeNames(team.paths, ['tests/unit/__init__.py', 'tests/unit/test_smoke.py']), ['tests/acceptance/garagiste-probe-test_smoke.py', 'tests/adversary/garagiste-probe-test_smoke.py'], '도우미(__init__)보다 테스트 이름 — 생태계의 접미사를 빌린다');
  assert.deepEqual(probeNames(team.paths, ['tests/unit/smoke_test.go']), ['tests/acceptance/garagiste-probe-smoke_test.go', 'tests/adversary/garagiste-probe-smoke_test.go']);
  assert.deepEqual(probeNames(team.paths, []), [], 'tests/unit이 비었으면 탐침이 없다');
  const base = { unit: { kind: 'scaffold', state: 'boot', boundary: { hit: false } }, slug: 'boot', worktreeExists: true, clean: true, tree: 'T', ledger: [{ kind: 'verify', mode: 'full', exit: 0, tree: 'T' }], requireAttack: true, spikeText: '', lastSubject: 'scaffold(boot): x', stops: [], proseKb: 10, proseMax: 40 };
  assert.equal(evaluateShip(base).filter((k) => !k.ok).length, 0);
  const bad = evaluateShip({ ...base, runnerBlind: ['tests/acceptance/garagiste-probe-test_smoke.py'] }).filter((k) => !k.ok);
  assert.deepEqual(bad.map((k) => k.id), ['redproof'], '8조건 그대로 — scaffold에서 비어 있던 redproof 자리');
  assert.match(bad[0].why, /test_file이 인수·공격 자리의 하이픈 이름 파일을 돌리지 않는다[\s\S]*tests\/acceptance\/garagiste-probe-test_smoke\.py[\s\S]*brief\.mjs boot boot 재spawn/);
});
test('work args: 사고 37(필드 시험 2) — 값 없는 --forget이 맨 끝이어도 켜진다(drop이 BACKLOG 줄을 닫지 못해 seed가 닫은 unit을 다시 열 뻔했다)', () => {
  assert.deepEqual(parseArgs(['persist', '이미 충족', '--forget'], 'drop'), { flags: { forget: true }, pos: ['persist', '이미 충족'], unknown: [] });
  assert.deepEqual(parseArgs(['persist', '--forget', '이미 충족'], 'drop'), { flags: { forget: true }, pos: ['persist', '이미 충족'], unknown: [] }, '사유를 삼키지 않는다');
  assert.deepEqual(parseArgs(['x', '--needs', 'a,Q1', '--milestone', 'M2'], 'add').flags, { needs: 'a,Q1', milestone: 'M2' });
});
test('work args: 사고 49(홀드아웃 — Go CLI) — 원문·질문은 무엇으로든 시작한다: 명령마다 아는 플래그만 플래그다', () => {
  assert.deepEqual(parseArgs(['min-size', '--min-size 1M처럼 이보다 작은 파일은 건너뛸 수 있다', '--milestone', 'M1'], 'add'), { flags: { milestone: 'M1' }, pos: ['min-size', '--min-size 1M처럼 이보다 작은 파일은 건너뛸 수 있다'], unknown: [] }, '원문이 「M1」, 마일스톤이 M?가 됐다');
  assert.deepEqual(parseArgs(['intake', '--json 출력 형태를 이렇게 정해도 되나?', '--for', 'json-out'], 'ask'), { flags: { for: 'json-out' }, pos: ['intake', '--json 출력 형태를 이렇게 정해도 되나?'], unknown: [] }, '질문이 「json-out」 한 단어가 됐다');
  assert.deepEqual(parseArgs(['x', '원문', '--milestne', 'M1'], 'add').unknown, ['--milestne'], '오타 플래그는 원문이 되지 않는다 — FAIL로');
  assert.deepEqual(parseArgs(['x', '--json'], 'add').unknown, ['--json'], '한 낱말 플래그 꼴은 원문이 아니다(원문은 문장)');
});
test('ship: wip HEAD의 안내는 unit 정체의 팩을 가리킨다 — boot(scaffold)에 「build를 다시 띄워」라 했다 (필드 시험 두 곳 공통)', () => {
  const base = { slug: 'boot', worktreeExists: true, clean: true, tree: 'T', ledger: [], requireAttack: false, spikeText: '', lastSubject: 'wip: checkpoint', stops: [], proseKb: 10, proseMax: 40 };
  const why = (unit) => evaluateShip({ ...base, unit }).find((k) => k.id === 'head').why;
  assert.match(why({ kind: 'scaffold', state: 'build', boundary: { hit: false } }), /boot를 다시 띄워/);
  assert.match(why({ state: 'build', boundary: { hit: false } }), /build를 다시 띄워/);
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
test('ship: 사고 41(필드 벤치 2 웹) — 증거 파일만 든 wip HEAD는 ship이 정식 메시지로 승격한다: attack이 red 0의 공격 파일을 더하고 끝나면 커밋할 주체가 없어 「HEAD가 wip」가 반복됐다', () => {
  assert.equal(evidenceCommitMessage(['tests/adversary/serve-list-13.test.mjs'], team.paths, 'serve-list'), 'test(serve-list): attack 산출물');
  assert.equal(evidenceCommitMessage(['tests/adversary/a-1.test.mjs', 'fixtures/hostile/big.json'], team.paths, 'a'), 'test(a): attack 산출물');
  assert.equal(evidenceCommitMessage(['docs/measurements/spike-x.md'], team.paths, 'x'), 'docs(spike): x 측정', '사고 16의 승격 그대로');
  assert.equal(evidenceCommitMessage(['docs/measurements/spike-x.md', 'tests/adversary/x-1.py'], team.paths, 'x'), 'test(x): attack 산출물');
  assert.equal(evidenceCommitMessage(['tests/adversary/a-1.test.mjs', 'src/a.mjs'], team.paths, 'a'), null, '제품 코드가 섞이면 승격하지 않는다 — build의 일');
  assert.equal(evidenceCommitMessage(['tests/adversary-x/a.mjs'], team.paths, 'a'), null, '경로 경계는 디렉터리 단위');
  assert.equal(evidenceCommitMessage([], team.paths, 'a'), null);
});
test('ship: 사고 39(필드 벤치 1) — spike 미완 FAIL은 다음 할 일을 명령으로 준다: build가 산출물 무시 줄(.gitignore)을 더한 diff-HIT에서 conductor가 멈췄다', () => {
  const ledger = [{ kind: 'verify', mode: 'full', exit: 0, tree: 'T' }, { kind: 'redproof', slug: 'ledger-add', base_red: true, head_green: true, tree: 'T' }, { kind: 'attack', slug: 'ledger-add', tree: 'T', red: 0, total: 4 }];
  const x = { unit: { state: 'build' }, slug: 'ledger-add', worktreeExists: true, clean: true, tree: 'T', ledger, requireAttack: true, spikeText: '', lastSubject: 'feat(x): y', stops: [], proseKb: 10, proseMax: 40, boundaryHit: true, boundaryWhy: 'file .gitignore' };
  const why = evaluateShip(x).find((k) => k.id === 'spike').why;
  assert.match(why, /boundary HIT\(file \.gitignore\)/);
  assert.match(why, /→ node \.garagiste\/scripts\/brief\.mjs spike ledger-add → 팩 spawn.* → node \.garagiste\/scripts\/ship\.mjs ledger-add 다시/, why);
  assert.match(why, /docs\/measurements\/spike-ledger-add\.md/, '채울 파일이 문구에 있다');
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
test('brief: 팩 상한 FAIL은 법만으로 넘을 때 난다 — 안내는 CEO 결정 둘(상한 실측 이상·unit 나누기)과 그 unit만 세우는 질문 (4차 실기 사고 25 · 홀드아웃 사고 59)', () => {
  const a = overflowAdvice({ bytes: 17.1 * 1024, capKb: 16, slug: 'time-model' });
  // 사고 59(홀드아웃 library 2·4·5일차): 「conductor가 할 일은 없다」 — 2·5일차는 그날이 멈췄고, 4일차는 conductor가 스스로 Q로 올렸다(그 답이 re-spec을 걸었다)
  assert.match(a, /그 unit만 세우고 다음 seed로[\s\S]*work\.mjs ask time-model "[^"]*pack_kb_max 18 이상[^"]*" --hold/, 'conductor 몫: 그 unit만 세운다(--hold — 예산 답은 re-spec이 아니다)');
  assert.doesNotMatch(a, /conductor가 할 일은 없다/);
  assert.match(a, /넘는 것은 법\(인수·규칙·결정·원문\)/, 'fit이 부대물을 다 줄인 뒤에만 FAIL이 난다');
  assert.match(a, /pack_kb_max를 18 이상으로/, '필요한 상한을 숫자로 — 실측');
  assert.match(a, /work\.mjs drop time-model/, 'unit 나누기는 명령이 있는 방향전환(CEO)으로');
  assert.doesNotMatch(a, /부대물이면/, '옛 둘째 갈래는 FAIL 시점에 참일 수 없었다');
  assert.match(overflowAdvice({ bytes: 70 * 1024, capKb: 64, slug: 'boot', mult: 4 }), /pack_kb_max를 18 이상으로/, 'boot는 4× — 필요한 상한은 배수로 나눠 센다');
  assert.ok(team.budgets.pack_kb_max >= 21, '기본 상한은 실측 이상 — 4차 time-model build 팩 전문 21KB(법만 17KB), 사고 8 선례대로 실측으로 올린다');
  assert.ok(team.budgets.pack_kb_max >= 31, '벤치 실측: build 팩 28KB(070f185 웹·Go 둘 다 CEO 결정 ①) · 31KB(cfbcf3a 웹 사슬 24→25→29→31) — 같은 결정이 벤치마다 CEO에게 갔다');
});
test('brief: 팩 상한 이유-차선 — 상한~2배는 conductor의 이유 한 줄(원장)로 지나가고, 2배를 넘어야 CEO 결정 (측정 H3 · CEO 채용 2026-10-02)', () => {
  const KB = 1024;
  assert.equal(packLane(32 * KB, 32, ''), 'fit');
  assert.equal(packLane(32 * KB + 1, 32, ''), 'reason', '상한을 넘으면 이유를 묻는다 — CEO가 아니다');
  assert.equal(packLane(64 * KB, 32, '공격 테스트 7개'), 'lane', '2배까지는 이유 한 줄로');
  assert.equal(packLane(64 * KB + 1, 32, '공격 테스트 7개'), 'wall', '2배를 넘으면 이유로는 못 넘는다');
  // 측정마다 CEO 결정 ①로 간 크기 — 홀드아웃 library(상한 32)의 34·35·48·49KB: 차선이면 CEO 결정 0
  for (const kb of [34, 35, 48, 49]) assert.equal(packLane(kb * KB, 32, '이유'), 'lane', `${kb}KB`);
  assert.equal(packLane(130 * KB, 128, ''), 'reason', 'boot는 상한이 pack_kb_max×4 — 같은 띠');
  const a = laneAdvice({ capKb: 32, again: againCmd(['build', 'loan-return']) });
  assert.match(a, /2배\(64KB\) 안이다 — CEO 결정이 아니다/);
  assert.match(a, /node \.garagiste\/scripts\/brief\.mjs build loan-return --large "<이유/, '같은 명령에 --large를 더해 다시');
  assert.doesNotMatch(a, /CEO 결정 ①|--hold/, '차선은 CEO 질문이 아니다 — 그 unit도 세우지 않는다');
  assert.equal(againCmd(['spec', 'x', '--return', 'spec: 두 주장이 "어긋난다"']), 'spec x --return "spec: 두 주장이 \\"어긋난다\\""', '반려 줄 같은 인자는 따옴표째 그대로');
});
test('brief: attack은 spec 뒤 한 바퀴 — 고칠 때마다 attack 팩을 새로 띄워 28·20바퀴(L2 2판 윈도우 1일차), 같은 conductor가 2·3일차엔 1바퀴', () => {
  const L = (kind, ts, extra = {}) => ({ kind, ts: `2026-10-02T00:${ts}:00.000Z`, slug: 'add', ...extra });
  const spec = L('pack', '01', { pack: 'spec' }); const atk = L('pack', '03', { pack: 'attack' }); const ran = L('attack', '04', { red: 1, total: 1 });
  assert.equal(attackRoundUsed([spec], 'add'), null, 'attack 전');
  assert.equal(attackRoundUsed([spec, atk], 'add'), null, '끊긴 attack(verify 전) — 다시 띄울 수 있다(이어받기)');
  assert.equal(attackRoundUsed([spec, atk, ran], 'add'), atk.ts, 'attack 팩 뒤 verify attack까지 — 그 바퀴는 썼다');
  assert.equal(attackRoundUsed([spec, atk, ran, L('pack', '05', { pack: 'spec' })], 'add'), null, 're-spec(spec 팩) 뒤엔 새 바퀴');
  assert.equal(attackRoundUsed([spec, atk, ran].map((e) => ({ ...e, slug: 'other' })), 'add'), null, '다른 unit의 바퀴는 세지 않는다');
  assert.equal(attackRoundUsed([spec, atk, ran], 'add', '2026-10-02T00:05:00.000Z'), null, 'drop 전 생애(since 앞)는 세지 않는다 — 같은 slug가 새로 열렸다');
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
test('HAZARDS: 줄마다 팩에 닿는 경로가 있다 — 규칙집(.garagiste/**)·main 전용 문서만 가리키는 줄은 팩에 영영 안 떠 산문 예산만 먹었다(35줄 · 15KB)', () => {
  const text = fs.readFileSync(new URL('../team/HAZARDS.md', import.meta.url), 'utf8');
  // team.json은 boot가 worktree에서 바꾼다(work.mjs commands). 배선(.claude·.opencode·opencode.json·.githooks)은 가드가 막고, .worktrees/는 팩의 바뀐 파일(worktree 상대 경로)에 없다(2026-10-03 정리)
  const unreachable = /^(\.garagiste\/(?!team\.json$)|\.claude\/|\.opencode\/|opencode\.json$|\.githooks\/|\.worktrees\/|docs\/(BACKLOG|STATUS|LEDGER|DECISIONS|BRIEF)\.md$)/;
  for (const l of text.split('\n').filter((x) => x.startsWith('- '))) {
    const globs = [...l.split(' · ')[0].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    assert.ok(globs.some((g) => !unreachable.test(g)), `팩에 닿지 않는 줄 — 기록은 CHANGELOG로: ${l.slice(0, 70)}`);
  }
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
test('redproof: head red의 뜻은 unit 정체가 가른다 — spec이면 기존 코드 위의 새 주장(RED), 그 밖이면 build 미완(FAIL) (4차 실기 사고 24)', () => {
  assert.equal(outcome({ base_red: true, head_green: false, state: 'spec' }), 'RED', 'RESPEC·Flow 7 수정의 re-spec: spec 팩의 끝은 RED다');
  assert.equal(outcome({ base_red: true, head_green: false, state: 'build' }), 'FAIL');
  assert.equal(outcome({ base_red: true, head_green: false, state: 'attack' }), 'FAIL');
  assert.equal(outcome({ base_red: true, head_green: true, state: 'spec' }), 'PASS');
  assert.equal(outcome({ base_red: true, head_green: null, state: 'spec' }), 'RED', '코드 전');
  assert.equal(outcome({ base_red: false, head_green: false, state: 'spec' }), 'FAIL', 'base에서 green이면 정체와 무관하게 테스트가 아니다');
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
  // 사고 59(홀드아웃 library 5일차): 팩 상한의 답(Q6)이 re-spec을 걸어 loan-return이 spec부터 다시 돌았다 — --hold 질문의 답의 길은 그 FAIL의 안내가 정한다
  assert.deepEqual(respecTargets({ units: [{ slug: 'held', kind: 'feature', state: 'build', created: at, questions: [], holds: [11], needs: [] }], ledger: [{ ts: '2026-09-30T02:00:00Z', kind: 'pack', slug: 'held', pack: 'spec' }], n: 11 }), [], '--hold 질문의 답은 re-spec이 아니다');
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
test('work seed: unit은 한 번에 하나 — CEO 질문에 걸린 unit만 예외, 예산 정지면 seed도 STOP (L2 1일차)', () => {
  const dec = '- [ ] Q5 (a): 형식?\n- [x] Q6 (b): x → y (2026-10-01)\n';
  assert.equal(seedGate({ units: [{ slug: 'a', state: 'build', questions: [5] }], decisionsText: dec }), null, 'CEO 질문에 걸린 unit은 자리를 막지 않는다(Flow 6)');
  assert.deepEqual(seedGate({ units: [{ slug: 'b', state: 'build', questions: [6] }], decisionsText: dec }), { kind: 'active', slugs: ['b'] }, '일하는 unit이 있으면 다음은 열리지 않는다 — 병렬 seed가 사고 26의 토양이었다');
  assert.equal(seedGate({ units: [{ slug: 'c', state: 'shipped' }, { slug: 'd', state: 'dropped' }], decisionsText: dec }), null);
  assert.equal(seedGate({ units: [{ slug: 'e', state: 'spec', questions: [], needs: ['Q5'] }], decisionsText: dec }), null, 'needs의 열린 Q도 질문에 걸린 것');
  assert.equal(seedGate({ units: [{ slug: 'h', state: 'build', questions: [], holds: [5] }], decisionsText: dec }), null, '사고 59: --hold로 세운 unit도 자리를 막지 않는다');
  assert.deepEqual(seedGate({ units: [{ slug: 'h', state: 'build', questions: [], holds: [6] }], decisionsText: dec }), { kind: 'active', slugs: ['h'] }, '답이 온(닫힌) hold는 다시 일하는 unit');
  assert.deepEqual(seedGate({ units: [], stops: ['미검수 3 ≥ 3'] }), { kind: 'stop', why: ['미검수 3 ≥ 3'] }, '예산 정지 중에 연 unit은 6시간 유휴·낡은 base였다');
});
test('work list: seed 전 BACKLOG 줄도 보인다 — Flow 2는 intake 뒤 list를 보라 하는데 「unit 없음」이었다 (필드 시험 두 곳 공통)', () => {
  const items = parseBacklog(['- [ ] boot · M1 · needs: Q3 · "a" · 인수: -', '- [ ] add · M1 · needs: boot,Q1 · "b" · 인수: -', '- [x] old · M1 · needs: - · "c" · 인수: -'].join('\n'));
  const l = listLines({ units: [], items });
  assert.equal(l.length, 2, '닫힌 줄은 빠진다');
  assert.match(l[0], /^boot\s+backlog\s+M1\s+needs=Q3/);
  assert.match(l[1], /^add\s+backlog\s+M1\s+needs=boot,Q1/);
  const l2 = listLines({ units: [{ slug: 'boot', state: 'build', milestone: 'M1', tried: null, boundary: { hit: false } }], items });
  assert.match(l2[0], /^boot\s+build\s+M1\s+tried=-/);
  assert.equal(l2.filter((x) => /^boot\s+backlog/.test(x)).length, 0, '열린 unit은 backlog 줄로 겹치지 않는다');
  assert.ok(listLines({ units: [{ slug: 'add', state: 'dropped', milestone: 'M1', tried: null, boundary: { hit: false } }], items }).some((x) => /^add\s+backlog/.test(x)), 'dropped unit의 열린 줄은 다시 열릴 backlog다');
  assert.deepEqual(listLines({ units: [], items: [] }), ['unit 없음 · BACKLOG 없음 — work.mjs brief 뒤 intake']);
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
test('lib: 사고 38(필드 벤치 두 곳) — main에 남은 것(setup·quick 산출물)을 고르고 지우지 않고 옮긴다: CEO 문서는 빼고, 새 디렉터리는 접힌 채, 바뀐 추적 파일은 사본을 두고 되돌린다', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-stray-'));
  const g = (...a) => spawnSync('git', a, { cwd: d, encoding: 'utf8' });
  g('init', '-q'); g('config', 'user.email', 'x@x'); g('config', 'user.name', 'x');
  fs.mkdirSync(path.join(d, 'src', 'ledger'), { recursive: true });
  fs.writeFileSync(path.join(d, 'src', 'ledger', 'cli.py'), 'x\n'); fs.writeFileSync(path.join(d, 'package-lock.json'), '{}\n');
  g('add', '-A'); g('commit', '-q', '-m', 'init');
  // 스크립트가 쓰는 CEO 문서 — 추적 파일 없는 새 디렉터리(git이 docs/로 접는다) 안에 있어도 남은 것이 아니다
  fs.mkdirSync(path.join(d, 'docs')); fs.writeFileSync(path.join(d, 'docs', 'BACKLOG.md'), '- [x] boot\n');
  // pip install -e . · quick · npm install이 남긴 것
  fs.mkdirSync(path.join(d, 'src', 'ledger.egg-info')); fs.writeFileSync(path.join(d, 'src', 'ledger.egg-info', 'PKG-INFO'), 'p\n');
  fs.mkdirSync(path.join(d, 'src', 'ledger', '__pycache__')); fs.writeFileSync(path.join(d, 'src', 'ledger', '__pycache__', 'cli.pyc'), 'c');
  fs.writeFileSync(path.join(d, 'package-lock.json'), '{ "rewritten": true }\n');
  fs.writeFileSync(path.join(d, 'npm-debug 로그.txt'), 'n\n');
  const stray = strayPaths(d, ['docs/BACKLOG.md']);
  assert.deepEqual(stray.map((e) => e.path).sort(), ['npm-debug 로그.txt', 'package-lock.json', 'src/ledger.egg-info/', 'src/ledger/__pycache__/'], JSON.stringify(stray));
  assert.ok(!stray.some((e) => e.path.startsWith('docs')), 'CEO 문서는 남은 것이 아니다 — 접힌 docs/ 안에 있어도');
  const dest = path.join(d, '.garagiste', 'session', 'ship-stray', 'boot-1');
  fs.mkdirSync(path.join(d, '.garagiste')); fs.writeFileSync(path.join(d, '.git', 'info', 'exclude'), '/.garagiste/\n');
  assert.deepEqual(quarantineStray(d, stray, dest), [], '전부 옮겼다');
  assert.equal(g('status', '--porcelain', '-uall').stdout, '?? docs/BACKLOG.md\n', 'main은 ship 전 그대로 — CEO 문서만 남는다');
  fs.writeFileSync(path.join(d, 'held.tmp'), 'h'); fs.writeFileSync(path.join(d, '.garagiste', 'blocked'), 'f');
  assert.deepEqual(quarantineStray(d, [{ code: '??', path: 'held.tmp' }], path.join(d, '.garagiste', 'blocked', 'x')), ['held.tmp'], '옮기지 못한 것은 던지지 않고 돌려준다 — 되돌리기 도중에 죽지 않는다(win32: 켜 둔 서버가 잡은 파일)');
  assert.ok(fs.existsSync(path.join(d, 'held.tmp')), '그 자리에 남는다');
  assert.equal(fs.readFileSync(path.join(d, 'package-lock.json'), 'utf8'), '{}\n', '바뀐 추적 파일은 커밋된 내용으로 되돌린다');
  assert.equal(fs.readFileSync(path.join(dest, 'package-lock.json'), 'utf8'), '{ "rewritten": true }\n', '바뀐 내용은 사본으로 남는다');
  assert.ok(fs.existsSync(path.join(dest, 'src', 'ledger.egg-info', 'PKG-INFO')) && fs.existsSync(path.join(dest, 'src', 'ledger', '__pycache__', 'cli.pyc')) && fs.existsSync(path.join(dest, 'npm-debug 로그.txt')), '지우지 않고 옮긴다');
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

test('lib: 사고 35(필드 시험 2) — 의존성 링크는 .gitignore의 `node_modules/`(디렉터리 패턴)에 안 걸린다: 링크는 프레임워크의 것이니 스스로 로컬 제외에 둔다', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-link-'));
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const g = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env });
  g(root, 'init', '-q');
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n/.worktrees/\n');
  g(root, 'add', '-A'); g(root, 'commit', '-q', '-m', 'x');
  fs.mkdirSync(path.join(root, 'node_modules', 'dep'), { recursive: true });
  g(root, 'worktree', 'add', '-q', '.worktrees/u', '-b', 'unit/u');
  const wt = path.join(root, '.worktrees', 'u');
  assert.deepEqual(linkDeps(root, wt), ['node_modules']);
  assert.equal(g(wt, 'status', '--porcelain').stdout.trim(), '', '링크가 미추적으로 보이면 체크포인트(git add -A)가 이 기계의 경로를 커밋한다');
  assert.equal(g(root, 'status', '--porcelain').stdout.trim(), '', 'main도 그대로');
  assert.deepEqual(linkDeps(root, wt), []);
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

test('work ask/decide: L2 3판 (e) — 확인형 질문(--assumed)의 맨 「예」는 가정 그대로라 RESPEC이 아니다; 가정 없는 「예」(사고 17)와 가정과 다른 답은 RESPEC', () => {
  const u = { slug: 'schedule', assumed: [{ q: 10, text: '라운드는 일요일' }] };
  for (const a of ['예', '네', ' 예.', 'yes', 'OK', '그대로', '맞다', 'y']) assert.equal(keepsAssumption(u, 10, a), '라운드는 일요일', a);
  for (const a of ['아니오', '예 — 단 공휴일은 빼고', '일요일', '', undefined]) assert.equal(keepsAssumption(u, 10, a), null, String(a));
  assert.equal(keepsAssumption(u, 11, '예'), null, '가정을 적지 않은 질문의 「예」는 무엇을 가정했는지 기계가 모른다 — 사고 17대로 RESPEC');
  assert.equal(keepsAssumption({ slug: 'x' }, 10, '예'), null);
  const { flags, pos } = parseArgs(['schedule', '라운드는 일요일인가?', '--assumed', '라운드는 일요일'], 'ask');
  assert.deepEqual({ flags, pos }, { flags: { assumed: '라운드는 일요일' }, pos: ['schedule', '라운드는 일요일인가?'] });
});
test('spec·intake 팩: 저장 안쪽 꼴은 default, 질문은 되돌리기 어려운 것만 — L2 3판 2·3라운드의 저장 꼴 질문 6개(모두 「예」, 라운드당 출하 1)', () => {
  const spec = fs.readFileSync(new URL('../team/packs/spec.md', import.meta.url), 'utf8');
  const rule4 = (/^4\. (.*)$/m.exec(spec) || ['', ''])[1];
  assert.match(rule4, /work\.mjs default <slug>/, 'spec 팩 4: 저장 안쪽 꼴은 기본값');
  assert.match(rule4, /--assumed/, 'spec 팩 4: 주장 뒤의 확인형 질문은 --assumed');
  assert.doesNotMatch(spec, /데이터 모델·파일 형식은 정하지 않는다/, '옛 규칙(저장 꼴마다 ask)은 사라진다');
  const intake = fs.readFileSync(new URL('../team/packs/intake.md', import.meta.url), 'utf8');
  assert.match(intake, /저장소 하나[^\n]*질문 하나/, 'intake 팩 5: 저장은 저장소 하나에 질문 하나');
});

test('next: Flow 4의 다음 한 걸음은 산문이 아니라 산수 — spec→redproof→build→attack→verify→(build)→ship, 팩은 조립→spawn→증거 순 (L2 2판 윈도우 28·20바퀴 · 3판 규율 이탈)', () => {
  const T = (m) => `2026-10-03T10:${String(m).padStart(2, '0')}:00.000Z`;
  const u = (over) => ({ slug: 'add', kind: 'feature', state: 'spec', created: T(0), questions: [], holds: [], needs: [], respec: [], ...over });
  const backlog = [{ slug: 'add', milestone: 'M1', needs: [], done: false }, { slug: 'list', milestone: 'M1', needs: ['add'], done: false }];
  const scope = { order: ['add', 'list'], requested: ['add', 'list'], required: [], missing: [], report_for: 'add,list' };
  const step = (units, ledger, over = {}) => nextStep({ units, ledger, decisionsText: '', scope, backlog, stops: [], wtOf: () => ({ exists: true, rebase: false, unmerged: [] }), packPath: (s, p) => `.garagiste/session/packs/${s}-${p}-x.md`, ...over });
  const L = [];
  const push = (e) => L.push(e);
  assert.deepEqual(step([u()], L), { kind: 'run', cmd: 'node .garagiste/scripts/brief.mjs spec add', why: 'add의 spec 팩이 아직 없다' }, '갓 열린 unit: spec 팩부터');
  push({ ts: T(1), kind: 'pack', slug: 'add', pack: 'spec' });
  assert.equal(step([u()], L).kind, 'spawn');
  assert.match(render(step([u()], L)), /^NEXT spawn spec add \.garagiste\/session\/packs\/add-spec-x\.md — .*Agent\(subagent_type: "spec", prompt: "\.garagiste\/session\/packs\/add-spec-x\.md"\).*work\.mjs spawned add spec/);
  push({ ts: T(2), kind: 'spawn_stop', pack: 'spec' }); // 훅의 기계 기록으로도 끝난 것으로 본다
  assert.match(step([u()], L).cmd, /redproof\.mjs add$/, 'spec 뒤엔 RED 증명');
  push({ ts: T(3), kind: 'redproof', slug: 'add', base_red: true, head_green: null });
  assert.match(step([u()], L).cmd, /brief\.mjs build add$/, 'RED면 build');
  assert.match(step([u()], [...L, { ts: T(3), kind: 'redproof', slug: 'add', base_red: false, head_green: null }]).why, /FAIL/, 'base green이면 그 FAIL의 안내가 길이다');
  assert.match(step([u()], [...L, { ts: T(3), kind: 'redproof', slug: 'add', base_red: true, head_green: true }]).cmd, /brief\.mjs attack add$/, 're-spec에서 기존 코드가 이미 만족하면 build 없이 attack 새 바퀴');
  push({ ts: T(4), kind: 'pack', slug: 'add', pack: 'build' });
  assert.equal(step([u({ state: 'build' })], L).kind, 'spawn');
  push({ ts: T(5), kind: 'spawn', slug: 'add', pack: 'build' }); // conductor의 spawned 기록
  assert.match(step([u({ state: 'build' })], L).cmd, /brief\.mjs attack add$/, 'build 뒤엔 공격 한 바퀴');
  push({ ts: T(6), kind: 'pack', slug: 'add', pack: 'attack' });
  assert.equal(step([u({ state: 'attack' })], L).kind, 'spawn');
  push({ ts: T(7), kind: 'spawn', slug: 'add', pack: 'attack' });
  assert.match(step([u({ state: 'attack' })], L).cmd, /verify\.mjs attack add$/, 'attack이 verify를 안 남겼으면 센다');
  push({ ts: T(8), kind: 'attack', slug: 'add', total: 2, red: 1 });
  assert.match(step([u({ state: 'attack' })], L).cmd, /brief\.mjs build add$/, 'red가 남으면 build 다시');
  push({ ts: T(9), kind: 'pack', slug: 'add', pack: 'build' }); push({ ts: T(10), kind: 'spawn', slug: 'add', pack: 'build' });
  assert.match(step([u({ state: 'build' })], L).cmd, /verify\.mjs attack add$/, '고친 뒤엔 attack 팩을 새로 띄우지 않고 기존 공격 테스트만(한 바퀴)');
  push({ ts: T(11), kind: 'attack', slug: 'add', total: 2, red: 0 });
  assert.match(step([u({ state: 'build' })], L).cmd, /ship\.mjs add$/, 'red 0이면 ship');
  // 사고 64(L2 5판 리눅스 4라운드): 미검수 3이면 ship은 budget으로 거부한다 — next가 ship을 계속 내지 않고 ship 직전에서 ceo
  const blocked = step([u({ state: 'build' })], L, { stops: ['미검수 3 ≥ 3 — CEO가 써봐야 출하가 열린다'] });
  assert.equal(blocked.kind, 'ceo');
  assert.match(blocked.text, /^STOP 미검수 3 ≥ 3 — CEO가 써봐야 출하가 열린다 — 예산 정지: add는 red 0으로 ship 직전에 서 있다/);
  assert.match(step([u({ state: 'attack' })], L, { stops: ['CEO 접점 없이 출하 5 ≥ 5'] }).text, /^STOP CEO 접점 없이 출하 5/, 'attack 상태에서 red 0이어도 같다');
  // 출하되면 seed · 질문에 걸린 unit은 자리를 막지 않는다 · 범위가 끝나면 done · 예산 정지와 범위 없음은 CEO
  assert.match(step([u({ state: 'shipped' })], L).cmd, /work\.mjs seed$/);
  assert.equal(step([u({ state: 'shipped' }), u({ slug: 'list', state: 'build', questions: [3] })], L, { decisionsText: '- [ ] Q3 (list): x' }).kind, 'wait');
  assert.equal(step([u({ state: 'shipped' }), u({ slug: 'list', state: 'shipped' })], L).kind, 'done');
  assert.match(step([u({ state: 'shipped' }), u({ slug: 'list', state: 'shipped' })], L, { scope: { order: ['add', 'list'] } }).cmd, /state\.mjs report$/, '범위가 끝나면 출하 보고 한 장 — 그 뒤에 done');
  assert.equal(step([u({ state: 'shipped' })], L, { stops: ['미검수 3 ≥ 3'] }).kind, 'ceo');
  assert.equal(step([u({ state: 'shipped' })], L, { scope: null }).kind, 'ceo');
  assert.equal(step([], L, { backlog: [] }).kind, 'ceo');
  // re-spec·늦은 spike·충돌·scaffold·한 번에 하나
  assert.match(step([u({ state: 'build', respec: [{ q: 3 }] })], L).cmd, /brief\.mjs spec add$/, '진행 중에 온 답은 spec이 먼저(사고 17)');
  const spike = [{ ts: T(1), kind: 'pack', slug: 'net', pack: 'spike' }, { ts: T(2), kind: 'spawn', slug: 'net', pack: 'spike' }];
  assert.match(step([u({ slug: 'net', state: 'spike' })], spike).cmd, /brief\.mjs spec net$/, 'boundary HIT unit: spike 뒤 spec');
  assert.match(step([u({ slug: 'net', state: 'spike' })], [{ ts: T(0), kind: 'pack', slug: 'net', pack: 'spec' }, ...spike]).cmd, /ship\.mjs net$/, '출하 때 diff-HIT로 늦게 잰 spike 뒤엔 ship 다시');
  const conflict = [...L, { ts: T(12), kind: 'ship_conflict', slug: 'add', files: ['src/a.mjs'] }];
  const rebase = (unmerged) => ({ wtOf: () => ({ exists: true, rebase: true, unmerged }) });
  assert.match(step([u({ state: 'build' })], conflict, rebase(['src/a.mjs'])).cmd, /brief\.mjs build add$/, '충돌 표시는 build가 푼다(사고 26)');
  assert.equal(step([u({ state: 'build' })], [...conflict, { ts: T(13), kind: 'pack', slug: 'add', pack: 'build' }], rebase(['src/a.mjs'])).kind, 'spawn');
  assert.match(step([u({ state: 'build' })], conflict, rebase([])).cmd, /ship\.mjs add$/, '다 풀렸으면 ship이 잇는다(사고 58)');
  assert.match(step([u({ slug: 'boot', kind: 'scaffold', state: 'boot' })], [{ ts: T(1), kind: 'pack', slug: 'boot', pack: 'boot' }, { ts: T(2), kind: 'spawn', slug: 'boot', pack: 'boot' }]).cmd, /ship\.mjs boot$/, 'scaffold는 boot 팩 하나로 출하');
  assert.match(step([u({ slug: 'late', created: T(9) }), u({ state: 'build' })], L).cmd, /ship\.mjs add$/, '한 번에 하나 — 먼저 연 unit부터');
});

test('system-attack(채용 2026-10-03): 범위가 끝나면 이음새 공격 한 바퀴 — 발견은 red 테스트, 발견 0이면 drop(초록 테스트는 산출물이 아니다)', () => {
  const T = (m) => `2026-10-03T11:${String(m).padStart(2, '0')}:00.000Z`;
  const shipped = (slug) => ({ slug, kind: 'feature', state: 'shipped', created: T(0), questions: [], needs: [] });
  const backlog = [{ slug: 'a', milestone: 'M1', needs: [], done: false }, { slug: 'b', milestone: 'M1', needs: [], done: false }];
  const scope = { order: ['a', 'b'], requested: ['a', 'b'], required: [], missing: [], report_for: 'a,b' };
  const base = { decisionsText: '', backlog, stops: [], systemAttack: true, wtOf: () => ({ exists: true, rebase: false, unmerged: [] }), packPath: (s, p) => `${s}-${p}.md` };
  assert.match(nextStep({ ...base, units: [shipped('a'), shipped('b')], ledger: [], scope }).cmd, /work\.mjs system$/, '둘 이상 출하된 범위의 끝은 이음새 공격');
  assert.equal(nextStep({ ...base, units: [shipped('a')], ledger: [], scope: { ...scope, order: ['a'], report_for: 'a' }, backlog: backlog.slice(0, 1) }).kind, 'done', '한 unit의 결함은 그 unit의 attack이 봤다');
  assert.equal(nextStep({ ...base, units: [shipped('a'), shipped('b')], ledger: [], scope: { ...scope, system_for: 'a,b' } }).kind, 'done', '한 바퀴 돈 범위는 done');
  assert.match(nextStep({ ...base, units: [shipped('a'), shipped('b')], ledger: [], scope: { ...scope, system_for: 'a' } }).cmd, /work\.mjs system$/, '-fix로 범위가 자라면 다시 한 바퀴');
  assert.equal(nextStep({ ...base, units: [shipped('a'), shipped('b')], ledger: [], scope, systemAttack: false }).kind, 'done', 'team.json system_attack: false면 두지 않는다');
  const sys = (over) => ({ slug: 'system-1', kind: 'system', state: 'attack', created: T(1), questions: [], needs: [], respec: [], ...over });
  const L = [{ ts: T(2), kind: 'pack', slug: 'system-1', pack: 'attack' }, { ts: T(3), kind: 'spawn', slug: 'system-1', pack: 'attack' }];
  const all = (ledger, s = sys()) => nextStep({ ...base, units: [shipped('a'), shipped('b'), s], ledger, scope });
  assert.match(all(L).cmd, /verify\.mjs attack system-1$/);
  assert.match(all([...L, { ts: T(4), kind: 'attack', slug: 'system-1', total: 3, red: 0 }]).cmd, /work\.mjs drop system-1 "system-attack 발견 0 — 공격 파일 3" --forget$/, '발견 0이면 drop');
  const found = [...L, { ts: T(4), kind: 'attack', slug: 'system-1', total: 3, red: 2, files: ['tests/adversary/system-1-1.test.mjs', 'tests/adversary/system-1-2.test.mjs'] }];
  assert.match(all(found).cmd, /brief\.mjs build system-1$/, '발견은 build가 고친다');
  const fixed = [...found, { ts: T(5), kind: 'pack', slug: 'system-1', pack: 'build' }, { ts: T(6), kind: 'spawn', slug: 'system-1', pack: 'build' }, { ts: T(7), kind: 'attack', slug: 'system-1', total: 3, red: 0 }];
  assert.match(all(fixed, sys({ state: 'build' })).cmd, /ship\.mjs system-1$/, '고친 뒤 red 0이면 ship');
  // ship: 시스템 공격의 red 증명은 「한 번이라도 red였던 공격 파일 ≥ 1」
  const x = { unit: sys({ state: 'build' }), slug: 'system-1', worktreeExists: true, clean: true, tree: 't', ledger: [{ kind: 'verify', mode: 'full', exit: 0, tree: 't' }, { kind: 'attack', slug: 'system-1', tree: 't', total: 3, red: 0 }], changed: [], runnerBlind: [], requireAttack: true, spikeText: '', lastSubject: 'fix(seam): x', stops: [], proseKb: 1, proseMax: 40, openQuestions: [] };
  assert.match(evaluateShip({ ...x, found: 0 }).find((k) => k.id === 'redproof').why, /결함을 찾지 못했다[\s\S]*drop system-1/);
  assert.ok(evaluateShip({ ...x, found: 2 }).every((k) => k.ok), evaluateShip({ ...x, found: 2 }).filter((k) => !k.ok).map((k) => `${k.id}: ${k.why}`).join());
});

test('boot 팩: 환경의 긴 꼬리를 선불한다 — 생태계별 검증된 꼴(.gitattributes eol=lf · 산출물 무시 · 하이픈 파일을 도는 test_file · Go 패키지) · 가드는 boot의 .gitattributes 쓰기를 연다 · attack이 놓친 계급은 HAZARDS 줄로', () => {
  const md = fs.readFileSync(new URL('../team/packs/boot.md', import.meta.url), 'utf8');
  for (const s of ['생태계별 검증된 꼴', '`.gitattributes`에 `* text=auto eol=lf`', '- Node:', '- Python:', '- Go:', '하이픈 이름', 'importlib', '한 디렉터리가 한 패키지', '`__pycache__/`']) assert.ok(md.includes(s), s);
  assert.equal(decide(write(`${root}/.worktrees/boot/.gitattributes`), gctx('boot')), null, 'boot가 .gitattributes를 쓴다');
  assert.ok(decide(write(`${root}/.worktrees/x/.gitattributes`), gctx('spec')), 'spec은 아니다');
  const hz = fs.readFileSync(new URL('../team/HAZARDS.md', import.meta.url), 'utf8');
  assert.match(hz, /^- `\*\*` · attack이 두 판 연속 놓친 계급/m, 'attack이 놓친 계급은 모든 팩에 뜨는 줄로');
  assert.ok(matchHazards(hz, ['src/any.mjs']).some((l) => l.includes('놓친 계급')), '`**` 줄은 어느 diff에도 뜬다');
});

test('미검수 상한(채용 2026-10-03): 사람 센서가 필요한 unit만 센다 — @sensor human 주장 또는 공격 선발견 0; 기계가 증명한 unit·scaffold·system은 세지 않고 마일스톤 끝에 써본다', () => {
  const at = '2026-10-03T12:00:00Z';
  const L = [{ ts: '2026-10-03T12:30:00Z', kind: 'attack', slug: 'm', red: 1, total: 2, files: ['tests/adversary/m-1.test.mjs'] }, { ts: '2026-10-03T12:40:00Z', kind: 'attack', slug: 'm', red: 0, total: 2, files: [] }];
  const u = (slug, over) => ({ slug, kind: 'feature', state: 'shipped', shipped: at, created: at, tried: null, origin_kind: 'seed', sensor: 'machine', ...over });
  const units = [u('m'), u('h', { sensor: 'human@win32' }), u('z'), u('boot', { kind: 'scaffold' }), u('system-1', { kind: 'system' })];
  const b = budgetStatus({ units, ledger: L, team, ceoTouchTs: null });
  assert.deepEqual({ unseen: b.unseen, untried: b.untried }, { unseen: 2, untried: 5 }, '사람 주장(h)과 공격이 못 문 unit(z)만 — m(선발견 1)·boot·system은 아니다');
  assert.equal(b.stops.length, 0, '2 < 3 — 멈추지 않는다');
  assert.match(budgetStatus({ units: [...units, u('z2')], ledger: L, team, ceoTouchTs: null }).stops.join(), /미검수 3 ≥ 3[^\n]*기계 증명 3은 세지 않았다/);
  const old = { ...team, budgets: { ...team.budgets, unseen_machine_exempt: false } };
  assert.equal(budgetStatus({ units, ledger: L, team: old, ceoTouchTs: null }).unseen, 5, '옛 규칙: 전부 센다');
  assert.ok(!humanNeeded(u('m'), L, team) && humanNeeded(u('h', { sensor: 'human@win32' }), L, team) && humanNeeded(u('z'), L, team));
});

test('state report: SCOPE DONE의 출하 보고 한 장 — 만든 것·기계가 증명한 것·팀이 정한 것·못 본 것·써볼 것·이음새 공격 (CEO 「결과물 가져오는 그림」)', () => {
  const at = '2026-10-03T13:00:00Z';
  const units = [
    { slug: 'boot', kind: 'scaffold', state: 'shipped', shipped: at, created: at, origin: '할 일 CLI', milestone: 'M1', tried: { result: 'ok' }, defaults: [{ text: 'Node 22 · 의존성 0' }], sensor: 'machine' },
    { slug: 'add', kind: 'feature', state: 'shipped', shipped: at, created: at, origin: '할 일을 더한다', milestone: 'M1', tried: null, defaults: [], sensor: 'machine' },
    { slug: 'list', kind: 'feature', state: 'shipped', shipped: at, created: at, origin: '할 일을 본다', milestone: 'M1', tried: null, defaults: [], sensor: 'human@win32' },
    { slug: 'system-1', kind: 'system', state: 'shipped', shipped: at, created: at, origin: '이음새 공격', milestone: 'M1', tried: null, defaults: [], sensor: 'machine' },
  ];
  const ledger = [{ ts: '2026-10-03T13:10:00Z', kind: 'attack', slug: 'add', red: 1, total: 1, files: ['tests/adversary/add-1.test.mjs'] }, { ts: '2026-10-03T13:20:00Z', kind: 'attack', slug: 'system-1', red: 2, total: 2, files: ['a', 'b'] }];
  const ledgerMd = '# LEDGER\n\n| 날짜 | unit | head | tree | full | redproof | attack 선발견→red/총 | sensor |\n|---|---|---|---|---|---|---|---|\n| 2026-10-03 | boot | a1 | t1 | PASS | scaffold | — | machine |\n| 2026-10-03 | add | a2 | t2 | PASS | base_red head_green | 1→0/1 | machine |\n| 2026-10-03 | list | a3 | t3 | PASS | base_red head_green | 0→0/1 | human@win32 |\n';
  const text = reportText({ team, scope: { order: ['boot', 'add', 'list'] }, units, ledger, ledgerMd, claims: [{ status: 'unsensed', file: 'tests/acceptance/list.test.mjs', claim: '목록이 보인다' }], decisionsText: '- [ ] Q3 (list): 번호 기준?', now: at });
  assert.match(text, /^# 출하 보고 — boot → add → list\n\n실행: `[^`]*` · 출하 3\/3 · 써볼 것 2 · 결정 대기 1 · 팀이 정한 것 1 · 못 본 것 1/);
  assert.match(text, /## 만든 것[\s\S]*- \*\*add\*\* \(M1\) — "할 일을 더한다" · 출하 2026-10-03 · 공격 선발견 1 · 안 써봄/);
  assert.match(text, /## 기계가 증명한 것[\s\S]*\| add \| a2 \| PASS \| base_red head_green \| 1→0\/1 \| machine \|/);
  assert.match(text, /## 팀이 정한 것[\s\S]*- boot: Node 22 · 의존성 0/);
  assert.match(text, /## 못 본 것\n- 사람 센서 대기: tests\/acceptance\/list\.test\.mjs — 목록이 보인다\n- 결정 대기: Q3 \(list\): 번호 기준\?/);
  assert.match(text, /## 써볼 것[\s\S]*- add: docs\/units\/add\/try\.md → `node \.garagiste\/scripts\/work\.mjs try add`[\s\S]*- list: docs\/units\/list\/try\.md/);
  assert.match(text, /## 이음새 공격\n- system-1: 발견 2 → 고쳐 출하/);
});

test('state: 같은 FAIL이 되풀이되면 프레임워크 FAIL 후보 — 원장 fail 줄을 마지막 CEO 접점 뒤에서 묶어 세고 첫 줄에 「반복 FAIL n」 (측정 빈틈 — L1 4차·L2 관찰)', () => {
  const f = (m, line, script = 'brief.mjs') => ({ ts: `2026-10-03T14:${String(m).padStart(2, '0')}:00Z`, kind: 'fail', script, line });
  const L = [f(1, 'FAIL 팩 40KB > 32KB'), f(2, 'FAIL 팩 40KB > 32KB'), f(3, 'FAIL 다른 줄'), f(4, 'FAIL ship x 1/8', 'ship.mjs'), f(5, 'FAIL ship x 1/8', 'ship.mjs'), f(6, 'FAIL ship x 1/8', 'ship.mjs'), { ts: '2026-10-03T14:07:00Z', kind: 'pack', slug: 'x', pack: 'build' }];
  const r = repeatedFails(L);
  assert.deepEqual(r.map((g) => [g.script, g.n]), [['brief.mjs', 2], ['ship.mjs', 3]], '같은 줄 둘 이상만 — 한 번뿐인 FAIL은 안내대로 풀린 것');
  assert.deepEqual(repeatedFails(L, '2026-10-03T14:03:00Z').map((g) => [g.script, g.n]), [['ship.mjs', 3]], 'CEO 접점 전의 FAIL은 세지 않는다');
  assert.equal(repeatedFails([]).length, 0);
  assert.match(firstLine({ run: 'x', unseen: 0, unseenMax: 3, unobservedOs: 0, decisionsOpen: 0, coveragePct: 100, uncertain: '', repeatedFails: 2 }), / · 반복 FAIL 2$/);
  assert.doesNotMatch(firstLine({ run: 'x', unseen: 0, unseenMax: 3, unobservedOs: 0, decisionsOpen: 0, coveragePct: 100, uncertain: '' }), /반복 FAIL/, '0이면 첫 줄은 그대로');
});

test('work quotesBrief(사고 65): CEO의 말이 BRIEF에 그대로 있나 — 따옴표·백틱·공백만 다른 것은 같은 말, 8자 미만은 세지 않는다', async () => {
  const { quotesBrief } = await import('../team/scripts/work.mjs');
  const brief = '# BRIEF\n\n## 2026-10-03 11:10\n버그: `todo search milk --all`을 치면 → 아무 말 없이 exit 0으로 끝난다, 원문은 「잘못된 입력은 이유 한 줄」\n';
  assert.equal(quotesBrief(brief, 'todo search milk --all을 치면 → 아무 말 없이 exit 0으로 끝난다'), true);
  assert.equal(quotesBrief(brief, '"todo search milk --all"을  치면 → 아무 말 없이 exit 0으로 끝난다'), true, '따옴표·공백만 다른 것');
  assert.equal(quotesBrief(brief, 'todo list 맨 아래에 남은 일 개수를 보여 준다'), false, 'BRIEF에 없는 말은 팀 발의');
  assert.equal(quotesBrief(brief, 'exit 0'), false, '짧은 조각은 우연이라 세지 않는다');
  assert.equal(quotesBrief('', 'todo search milk --all을 치면 → 아무 말 없이 exit 0으로 끝난다'), false);
});

// ── L2 6판(홀드아웃 snap) 뒤 수리 — 사고 66~69 ──
test('guard: 사고 67(L2 6판 세 라운드 가드 거부 9/9) — `W=<경로>; … $W/…` 변수 경로와 줄 시작의 `cd $W`를 풀어 worktree 안 쓰기를 거부하지 않는다 · 풀 수 없는 변수($(pwd))는 fail-closed, mktemp는 임시 폴더', () => {
  const wt = `${root}/.worktrees/hello`;
  assert.equal(expandAssignments(`W=${wt}; mkdir -p $W/src && cat > $W/src/a.py`), `W=${wt}; mkdir -p ${wt}/src && cat > ${wt}/src/a.py`);
  assert.equal(expandAssignments(`export W="${wt}"\ncat > \${W}/x`), `export W="${wt}"\ncat > ${wt}/x`, '큰따옴표 값·${W} 꼴');
  assert.equal(expandAssignments('T=$(mktemp -d); cat > $T/x'), 'T=$(mktemp -d); cat > $T/x', '실행 결과인 값은 풀지 않는다');
  assert.equal(cdBase(`W=${wt}; mkdir -p ${wt}/src\ncd ${wt}\ncat > pyproject.toml`, root), wt, '줄 시작의 cd도 뒤 상대 경로의 뿌리다');
  assert.equal(cdBase(`cd ${wt} && cat > x`, root), wt, '첫 cd && 는 그대로');
  assert.equal(decide(bash(`W=${wt}; mkdir -p $W/src && cat > $W/src/a.py <<'EOF'\nprint(1)\nEOF`), gctx('build')), null, 'build는 $W/src에 쓴다(6판 list-file·list-summary·restore의 꼴)');
  assert.equal(decide(bash(`W=${wt}\nmkdir -p $W/docs/units/hello && cat > $W/docs/units/hello/try.md <<'EOF'\n# try\nEOF`), gctx('spec')), null, 'spec은 $W/docs/units에 쓴다(6판 status·restore-to의 꼴)');
  assert.equal(decide(bash(`W=${wt}; mkdir -p $W/src/snap\ncd $W\ncat > pyproject.toml <<'E'\n[x]\nE`), gctx('boot')), null, 'boot: cd $W 뒤 상대 경로 pyproject.toml은 worktree의 것(6판 1라운드 첫 거부)');
  assert.match(decide(bash(`W=${wt}; cat > $W/tests/acceptance/h.test.mjs <<'EOF'\nx\nEOF`), gctx('build')) || '', /build 팩은 tests\/acceptance/, '풀린 경로도 쓰기 경계는 그대로');
  assert.equal(decide(bash(`T=$(mktemp -d); cat > $T/x.txt <<'EOF'\nx\nEOF`), gctx('build')), null, 'mktemp는 임시 폴더 — 저장소 밖(R&D 2026-10-04: 5판 관찰 b·6판 누적 6)');
  assert.match(decide(bash(`T=$(pwd)/out; cat > $T/x.txt <<'EOF'\nx\nEOF`), gctx('build')) || '', /worktree 밖/, '풀 수 없는 변수는 fail-closed(저장소 안으로 읽힌다)');
  assert.match(decide(bash(`W=${root}/docs; cat > $W/x.md <<'EOF'\nx\nEOF`), gctx('build')) || '', /worktree 밖/, '변수가 worktree 밖 저장소를 가리키면 거부');
});
test('brief: 사고 68(L2 6판 팩 상한 FAIL 7/7이 build의 인수+공격 테스트 몫) — 테스트 절을 뺀 크기가 상한 안이면 이유를 묻지 않고 자동 이유-차선, 산문·diff 몫의 초과와 2배 벽은 그대로', () => {
  const KB = 1024; const big = (n) => 'x'.repeat(n);
  const sections = [{ key: 'unit', text: big(4 * KB) }, { key: 'acceptance', text: big(20 * KB) }, { key: 'adversary', text: big(12 * KB) }];
  const auto = autoLane(sections, 36 * KB, 32);
  assert.match(auto, /^자동: 인수 테스트 20\.0KB \+ 공격 테스트 12\.0KB — 그 밖 4\.0KB ≤ 32KB/);
  assert.equal(packLane(36 * KB, 32, auto), 'lane', '자동 이유로 차선');
  assert.equal(autoLane(sections, 30 * KB, 32), '', '상한 안이면 이유가 필요 없다');
  assert.equal(autoLane([{ key: 'unit', text: big(36 * KB) }], 36 * KB, 32), '', '테스트가 아닌 몫의 초과는 자동이 아니다 — 이유를 묻는다');
  assert.equal(autoLane([{ key: 'unit', text: big(33 * KB) }, { key: 'acceptance', text: big(2 * KB) }], 35 * KB, 32), '', '테스트를 빼도 상한을 넘으면 자동이 아니다');
  assert.equal(autoLane([{ key: 'acceptance', text: big(70 * KB) }], 70 * KB, 32), '', '2배 벽은 자동으로 넘지 않는다 — CEO 결정');
});
test('verify: 사고 69(L2 6판 안내 없는 FAIL gate 줄 2) — FAIL gate 첫 줄에 첫 이유가 든다(원장 fail 줄은 첫 줄 300자만 남는다), 나머지 이유는 아래 줄', () => {
  const l = gateFailLine(['원장에 이 tree(abc1234)의 quick PASS 없음 — node .garagiste/scripts/verify.mjs quick', '로직 변경에 테스트 파일이 없다 — red 테스트가 먼저다']);
  assert.equal(l.split('\n')[0], 'FAIL gate — 원장에 이 tree(abc1234)의 quick PASS 없음 — node .garagiste/scripts/verify.mjs quick (+1)');
  assert.deepEqual(l.split('\n').slice(1), ['- 원장에 이 tree(abc1234)의 quick PASS 없음 — node .garagiste/scripts/verify.mjs quick', '- 로직 변경에 테스트 파일이 없다 — red 테스트가 먼저다']);
  assert.equal(gateFailLine(['x']), 'FAIL gate — x\n- x');
});
test('work: 사고 66(L2 6판 결함 1 — Q1 「예」의 래퍼 둘이 어느 unit에도 안 실림) — decide의 답은 그 Q를 기다리는 첫 열린 unit의 인수에 「결정 Q<n> → 답: 질문」으로 실린다', () => {
  const dec = '## 정해 주세요\n- [x] Q1 (intake): 저장소에 `snap` 셸 래퍼와 `snap.cmd`를 둔다 — 예/아니오 → 예 (2026-10-03)\n- [ ] Q2 (net): 어디에?\n';
  assert.deepEqual(questionText(dec, 1), { text: '저장소에 `snap` 셸 래퍼와 `snap.cmd`를 둔다 — 예/아니오', who: 'intake' });
  assert.deepEqual(questionText(dec, 2), { text: '어디에?', who: 'net' }, '열린 줄도 읽는다');
  assert.equal(questionText(dec, 3), null);
  const bl = [backlogLine({ slug: 'boot', milestone: 'M1', needs: ['Q1'], origin: '백업 도구.', accept: '진입점이 뜨고 quick·full이 PASS', kind: 'scaffold' }),
    backlogLine({ slug: 'start-stop', milestone: 'M1', needs: ['boot', 'Q1'], origin: '시작·멈춤', accept: '-' }),
    '- [x] old · M1 · needs: Q1 · "닫힌 것" · 인수: y', backlogLine({ slug: 'net', milestone: 'M2', needs: [], origin: '밖으로', accept: '-' })].join('\n') + '\n';
  const r = acceptWithDecision(bl, 1, '예', '저장소에 `snap` 셸 래퍼와 `snap.cmd`를 둔다 — 예/아니오', 'intake');
  assert.equal(r.slug, 'boot', 'Q1을 기다리는 첫 열린 unit');
  assert.equal(r.accept, '진입점이 뜨고 quick·full이 PASS · 결정 Q1 → 예: 저장소에 `snap` 셸 래퍼와 `snap.cmd`를 둔다 — 예/아니오');
  const items = parseBacklog(r.text);
  assert.equal(items.find((i) => i.slug === 'boot').accept, r.accept, 'BACKLOG 줄이 그대로 파싱된다');
  assert.equal(items.find((i) => i.slug === 'boot').kind, 'scaffold', 'kind 꼬리는 그대로');
  assert.equal(items.find((i) => i.slug === 'start-stop').accept, '-', '둘째 unit은 그대로 — 결정 스코프가 따로 준다');
  assert.ok(r.text.includes('- [x] old · M1 · needs: Q1 · "닫힌 것" · 인수: y'), '닫힌 줄은 바이트 그대로');
  const r2 = acceptWithDecision(bl, 2, '홈에', '어디에?', 'net');
  assert.equal(r2.slug, 'net', 'needs에 없으면 질문을 올린 unit(ask <slug>)이 임자');
  assert.equal(r2.accept, '결정 Q2 → 홈에: 어디에?', '인수 -는 결정으로 바뀐다');
  assert.equal(acceptWithDecision(bl, 3, '예', '없는 질문', 'intake'), null, '기다리는 unit도 임자도 없으면 null');
  assert.equal(acceptWithDecision(bl, 1, '예', '같은 질문', 'old').slug, 'boot', '질문을 올린 unit이 닫혔어도 needs의 첫 열린 unit이 임자');
});

// conduct — Flow 4의 conductor를 모델 밖으로(R&D 2026-10-04): 한 줄을 읽고 그대로 실행하는 자리의 순수 함수들
test('conduct: 인자 — 기본값·상한·spawner 템플릿·intake·모르는 인자는 FAIL 사유', () => {
  assert.deepEqual(conductArgs([]), { ...CONDUCT_DEFAULTS, once: false, intake: false, check: false });
  const o = conductArgs(['intake', '--once', '--max-steps', '3', '--max-minutes', '90', '--turns', '50', '--spawner', 'node fake.mjs', '--pack-minutes', '45', '--max-usd', '12.5']);
  assert.deepEqual(o, { maxSteps: 3, maxMinutes: 90, turns: 50, spawner: 'node fake.mjs', packMinutes: 45, maxUsd: 12.5, once: true, intake: true, check: false });
  assert.equal(conductArgs(['check', '--spawner', 'x']).check, true, 'check — 실전 전 preflight');
  assert.deepEqual([conductArgs([]).packMinutes, conductArgs([]).maxUsd], [null, null], 'null이면 team.json budgets(pack_minutes_max · run_usd_max)에서');
  assert.match(conductArgs(['--max-usd', '-1']).error, /maxUsd/);
  assert.match(conductArgs(['--bogus']).error, /알 수 없는 인자 --bogus/);
  assert.match(conductArgs(['--max-steps', 'x']).error, /maxSteps/);
  assert.deepEqual(EXIT, { done: 0, fail: 1, ceo: 2, wait: 3, framework: 4, cap: 5 }, '멈춤이 종료 코드다 — 밖이 판단 없이 읽는다');
});
test('conduct: spawner — 기본은 claude -p <팩 경로> --agent <팩>(agents 파일이 모델·도구·정체), 템플릿은 자리표시자를 채워 셸로', () => {
  const d = spawnerCommand({ pack: 'build', slug: 'hello', packPath: '.garagiste/session/packs/hello-build-1.md', model: 'sonnet', turns: 200 });
  assert.deepEqual(d.argv, ['claude', '-p', '.garagiste/session/packs/hello-build-1.md', '--agent', 'build', '--output-format', 'json', '--permission-mode', 'acceptEdits', '--max-turns', '200']);
  const t = spawnerCommand({ template: 'node fake.mjs {pack} {slug} {path} {model} {turns}', pack: 'spec', slug: 'x', packPath: 'p.md', model: 'opus', turns: 7 });
  assert.deepEqual(t.argv, ['node', 'fake.mjs', 'spec', 'x', 'p.md', 'opus', '7'], '셸 메타문자가 없는 템플릿은 argv로 — 시간 상한의 kill이 그 프로세스에 닿는다');
  assert.equal(spawnerCommand({ template: 'opencode run --agent {pack} "$(cat {path})" | tee log', pack: 'build', slug: 'x', packPath: 'p.md', model: '', turns: 1 }).shell, 'opencode run --agent build "$(cat p.md)" | tee log', '메타문자가 있으면 셸');
});
test('conduct: 결과 읽기 — claude -p --output-format json의 토큰·분·비용·오류, JSON이 아니면 글만', () => {
  const r = parseResult(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, duration_ms: 90000, num_turns: 12, total_cost_usd: 0.42, usage: { input_tokens: 1000, output_tokens: 500, cache_creation_input_tokens: 200, cache_read_input_tokens: 300 }, result: '커밋 2\nverify full PASS' }));
  assert.deepEqual({ tokens: r.tokens, minutes: r.minutes, cost: r.cost, turns: r.turns, isError: r.isError, text: r.text }, { tokens: 2000, minutes: 1.5, cost: 0.42, turns: 12, isError: false, text: '커밋 2\nverify full PASS' });
  assert.equal(parseResult(JSON.stringify({ subtype: 'error_max_turns', is_error: false, result: '' })).isError, true, 'success가 아닌 subtype은 오류다');
  assert.deepEqual(parseResult('그냥 글\n두 줄'), { json: null, text: '그냥 글\n두 줄', tokens: null, minutes: null, cost: null, turns: null, isError: false });
  assert.equal(parseResult('앞 잡음\n{"result":"x","usage":{"input_tokens":5}}').tokens, 5, '마지막 JSON 객체를 읽는다');
});
test('conduct: 반려 줄·FAIL 열쇠·hold 안내·진전 없음', () => {
  assert.equal(specReturn('커밋 0 · verify full 안 돌림\nspec: 인수가 서로 어긋난다 — -30000 ⊃ 3000'), '인수가 서로 어긋난다 — -30000 ⊃ 3000');
  assert.equal(specReturn('커밋 3 · PASS verify:full'), null);
  assert.equal(specReturn(Array.from({ length: 8 }, (_, i) => `줄 ${i}`).join('\n') + '\nspec: 늦은 줄'), '늦은 줄', '마지막 다섯 줄 안에서만 본다');
  assert.equal(specReturn('spec: 이른 줄\n' + Array.from({ length: 8 }, (_, i) => `줄 ${i}`).join('\n')), null);
  assert.equal(failKey('PASS gate\nFAIL ship hello 1/8\n- attack: 기록 없음\n- x'), 'FAIL ship hello 1/8 | - attack: 기록 없음', 'ship은 둘째 줄(조건)이 열쇠를 가른다');
  assert.equal(failKey('ATTACK hello red 1/1'), null, 'FAIL 줄이 없으면 열쇠 없음 — 되풀이로 세지 않는다');
  const h = holdCommand('FAIL spec 반려가 두 번째 …\n- 그 unit만 세우고 다음 seed로: node .garagiste/scripts/work.mjs ask hello "spec 반려 두 번째 — 두 줄은 이 FAIL 그대로" --hold — CEO의 답은 …');
  assert.deepEqual({ slug: h.slug, question: h.question }, { slug: 'hello', question: 'spec 반려 두 번째 — 두 줄은 이 FAIL 그대로' });
  assert.match(h.cmd, /^node \.garagiste\/scripts\/work\.mjs ask hello '[^']+' --hold$/, '셸 인자는 작은따옴표 — 큰따옴표 안의 \$·백틱은 셸이 푼다');
  assert.equal(holdCommand('FAIL redproof hello: tests/acceptance/hello* 없음'), null);
  const hist = new Map();
  assert.equal(noProgress(hist, { slug: 'h', pack: 'build', before: 'a', after: 'a' }), 1);
  assert.equal(noProgress(hist, { slug: 'h', pack: 'build', before: 'a', after: 'b' }), 0, '커밋이 생기면 0으로');
  assert.equal(noProgress(hist, { slug: 'h', pack: 'build', before: 'b', after: 'b' }), 1);
  assert.equal(noProgress(hist, { slug: 'h', pack: 'build', before: 'b', after: 'b' }), 2, '두 번째면 멈춤의 수');
  assert.equal(noProgress(hist, { slug: 'h', pack: 'spike', before: 'b', after: 'b' }), 0, 'spike는 커밋하지 않는 팩');
  assert.equal(noProgress(hist, { slug: 'h', pack: 'spec', before: null, after: 'b' }), 0, 'worktree가 없던 때는 세지 않는다');
});
test('conduct: 헤드리스 환경 — 부모 Claude 세션의 CLAUDE* 변수는 걷고 인증 변수만 남긴다 · 멈춤 줄', () => {
  const e = headlessEnv({ PATH: '/bin', CLAUDE_PROJECT_DIR: '/x', CLAUDECODE: '1', CLAUDE_CODE_ENTRYPOINT: 'cli', CLAUDE_CODE_USER_EMAIL: 'a@b' }, { GARAGISTE_PACK: 'build' });
  assert.deepEqual(e, { PATH: '/bin', CLAUDE_CODE_USER_EMAIL: 'a@b', GARAGISTE_PACK: 'build' });
  assert.equal(stopLine('ceo', 'STOP 미검수 3\n둘째 줄', '2026-10-04T00:00:00Z'), 'STOP ceo 2026-10-04T00:00:00Z — STOP 미검수 3\nCEO: docs/STATUS.md 「써볼 것」(work.mjs try → tried) · 「정해 주세요」(work.mjs decide) · 「멈춘 이유」 — 접점 하나면 다시 conduct');
});

// 임시 폴더는 저장소 밖 — 5판 관찰 b · L2 6판 가드 거부 누적 6(R&D 2026-10-04)
test('guard: 임시 폴더 쓰기는 경계 밖이다 — $(mktemp -d)·$TMPDIR·/tmp(Bash)와 Write 툴 모두, 저장소 안 상대 경로는 그대로 거부', () => {
  const wt = `${root}/.worktrees/coc`;
  const packCtx = { ...gctx('attack'), env: {} };
  assert.equal(decide(bash('T=$(mktemp -d); cat > $T/base.txt <<EOF\nx\nEOF', wt), packCtx), null, 'mktemp 대입은 OS 임시 폴더(풀리지 않으면 저장소 안 상대 경로로 읽혀 거부됐다 — 6판 boot-fix)');
  assert.equal(decide(bash('cat > ${TMPDIR:-/tmp}/coc_base.txt <<EOF\nx\nEOF', wt), packCtx), null);
  assert.equal(decide(bash('echo x > /tmp/claude-0/coc_base.txt', wt), packCtx), null, '5판 관찰 b: 저장소 밖 임시 파일');
  assert.equal(decide(bash('mkdir -p $(mktemp -d)/home && HOME=$(mktemp -d) node src/x.mjs', wt), packCtx), null, '임시 HOME');
  assert.match(decide(bash('echo x > src/x.py', wt), packCtx), /attack 팩의 쓰기 경계 밖/, '경계는 그대로');
  assert.match(decide(bash('cat > $T/x.py', wt), packCtx), /쓰기 경계 밖|worktree 밖/, '풀리지 않는 변수는 fail-closed');
  assert.equal(decide(write(`${os.tmpdir()}/garagiste-x/fixture.json`), gctx(null)), null, 'Write 툴의 임시 폴더도 경계 밖');
  assert.equal(decide(write('/tmp/x.txt'), gctx(null)), null);
  assert.match(decide(write('src/a.ts'), gctx(null)), /conductor는 쓰지 않는다/, '저장소 안은 그대로');
  assert.match(decide(write('/repo/tmp/a.ts'), gctx(null)), /conductor는 쓰지 않는다/, '저장소 안의 tmp/ 폴더는 임시 폴더가 아니다');
  assert.ok(isTempPath('/tmp/a', {}) && isTempPath(os.tmpdir() + '/b', {}) && !isTempPath('/tmpx/a', {}) && !isTempPath('/repo/tmp', {}));
  assert.equal(expandTemp('cat > $(mktemp -d)/x; cp a $TMP/b; echo ${TMPDIR:-/tmp}/c; ls `mktemp -d`', { TMPDIR: '/t' }), 'cat > /t/garagiste-mktemp/x; cp a /t/b; echo /t/c; ls /t/garagiste-mktemp');
  assert.match(decide(bash('echo x >> .garagiste/ledger/evidence.jsonl', wt), packCtx), /원장/, '원장은 그대로 막힌다');
});
// unit 토큰 상한 — L2 2판 윈도우 1일차의 진동(토큰 16배)에 대한 예산 장치(R&D 2026-10-04)
test('budget: 진행 중 unit의 spawn 토큰 합이 상한이면 멈춤 — unit의 상한(work.mjs budget)이 team.json보다 먼저, 0이면 끈다, 출하된 unit·앞 생애의 토큰은 세지 않는다', () => {
  const at = '2026-10-03T10:00:00Z';
  const spawn = (slug, tokens, ts = '2026-10-03T11:00:00Z') => ({ ts, kind: 'spawn', slug, pack: 'build', tokens });
  const units = [{ slug: 'add', state: 'build', created: at, origin_kind: 'ceo' }, { slug: 'old', state: 'shipped', shipped: at, created: at, origin_kind: 'ceo', tried: { result: 'ok' } }];
  const cap = { ...team, budgets: { ...team.budgets, unit_tokens_max: 3000 } };
  assert.equal(budgetStatus({ units, ledger: [spawn('add', 1200), spawn('add', 1200)], team: cap, ceoTouchTs: null }).stops.length, 0, '2400 < 3000');
  const b = budgetStatus({ units, ledger: [spawn('add', 1200), spawn('add', 1200), spawn('add', 1200)], team: cap, ceoTouchTs: null });
  assert.match(b.stops.join(), /^unit add 토큰 4K ≥ 상한 3K — CEO 결정: node \.garagiste\/scripts\/work\.mjs budget add <새 상한> 또는 work\.mjs drop add/);
  assert.equal(budgetStatus({ units, ledger: [spawn('old', 99999)], team: cap, ceoTouchTs: null }).stops.length, 0, '출하된 unit은 세지 않는다');
  assert.equal(budgetStatus({ units, ledger: [spawn('add', 99999, '2026-10-02T00:00:00Z')], team: cap, ceoTouchTs: null }).stops.length, 0, '앞 생애(drop 전)의 토큰은 세지 않는다');
  assert.equal(budgetStatus({ units: [{ ...units[0], tokens_max: 10000 }, units[1]], ledger: [spawn('add', 5000)], team: cap, ceoTouchTs: null }).stops.length, 0, 'unit의 상한(budget)이 team.json보다 먼저');
  assert.equal(budgetStatus({ units, ledger: [spawn('add', 5000000)], team: { ...team, budgets: { ...team.budgets, unit_tokens_max: 0 } }, ceoTouchTs: null }).stops.length, 0, '0이면 끈다');
  assert.equal(budgetStatus({ units, ledger: [spawn('add', 5000000)], team: { ...team, budgets: { ...team.budgets, unit_tokens_max: undefined } }, ceoTouchTs: null }).stops.length, 0, '옛 team.json(키 없음)도 끈 것');
  assert.equal(team.budgets.unit_tokens_max, 1000000, '기본 1M — 6판 unit 최대 185K의 5배, 2판 진동(≈1.6M)은 잡힌다');
  assert.match(decide(bash('node .garagiste/scripts/work.mjs budget add 2000000', `${root}/.worktrees/add`), gctx('build')), /budget\(토큰 상한\)/, '팩은 자기 상한을 올리지 못한다');
});
// doctor — 끊긴 worktree(2026-10-01 관찰: 폴더를 옮기면 verify가 FAIL 줄 대신 스택을 냈다)
test('doctor: 끊긴 worktree(prunable)를 한 줄로 말한다', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-doctor-wt-'));
  const g = (args, cwd = d) => spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
  g(['init', '-q', '-b', 'main']); fs.writeFileSync(path.join(d, 'a.txt'), 'a\n'); g(['add', '-A']); g(['commit', '-q', '-m', 'init']);
  const wt = path.join(d, '.worktrees', 'x');
  assert.equal(g(['worktree', 'add', '-q', '-b', 'unit/x', wt]).status, 0);
  assert.ok(!diagnose(d).some((x) => x.includes('끊김')), '살아 있는 worktree는 문제가 아니다');
  fs.rmSync(wt, { recursive: true, force: true });
  const probs = diagnose(d);
  assert.ok(probs.some((x) => /^worktree .*[\\/]\.worktrees[\\/]x 끊김\(prunable/.test(x) && x.includes('git worktree prune')), probs.join('\n'));
  assert.deepEqual(blocking(probs.filter((x) => x.includes('끊김'))), probs.filter((x) => x.includes('끊김')), '끊긴 worktree는 fresh가 아니다 — seed·ship을 막는다');
});

// conduct 2라운드(R&D 2026-10-04): 잠금은 살아 있는 pid만 막는다 · 설치본의 판
test('conduct: 잠금은 살아 있는 pid만 막는다 — 죽은 pid의 잠금은 교체 대상, 잠금 없음은 자유', () => {
  assert.equal(lockAlive(null), false);
  assert.equal(lockAlive({ pid: 4242 }, { isAlive: () => true }), true);
  assert.equal(lockAlive({ pid: 4242 }, { isAlive: () => false }), false, '죽은 pid');
  assert.equal(lockAlive({ pid: process.pid }), true, '자기 pid는 살아 있다');
  assert.equal(lockAlive({ pid: 2147483000 }), false, '있을 수 없는 pid');
  assert.deepEqual(team.budgets.pack_minutes_max, 60); assert.equal(team.budgets.run_usd_max, 0, '비용 상한 기본은 끔');
});
test('doctor --version: VERSION이 있으면 판 한 줄, 없으면 재설치 안내 (L3 Q11)', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-version-'));
  assert.match(versionLine(d), /^VERSION 없음 — 2026-10-04 전 설치본/);
  fs.mkdirSync(path.join(d, '.garagiste'));
  fs.writeFileSync(path.join(d, '.garagiste', 'VERSION'), '{ "garagiste": "abc1234def", "team_tree": "9f9f9f9", "flavor": "claude" }\n');
  assert.equal(versionLine(d), 'VERSION garagiste abc1234def · team 9f9f9f9 · claude');
  assert.ok(decide(write('.garagiste/VERSION'), gctx(null)), '판 파일은 규칙집 — 설치기만 쓴다');
  assert.ok(decide(bash('echo x > .garagiste/VERSION'), gctx(null)));
});

// adopt(R&D 3라운드 2026-10-04): 기존 코드의 첫 unit — 이름은 쓰기 경계다
test('guard: adopt 팩의 경계 — 특성화 테스트·하네스·위생 파일·규칙 파일 자리·docs/units만, 소스·기존 테스트·매니페스트는 거부', () => {
  const wt = `${root}/.worktrees/adopt`;
  for (const f of ['tests/unit/chars.test.mjs', 'tests/harness/run.py', '.gitattributes', '.gitignore', 'CLAUDE.md', 'AGENTS.md', 'docs/units/adopt/try.md']) assert.equal(decide(write(`${wt}/${f}`, wt), gctx('adopt')), null, f);
  for (const f of ['src/a.js', 'lib/greet.js', 'bin/greet.js', 'test/greet.test.js', 'package.json', 'pyproject.toml', 'tests/acceptance/x.test.mjs', 'README.md']) assert.match(decide(write(`${wt}/${f}`, wt), gctx('adopt')) || '', /adopt 팩의 쓰기 경계 밖/, f);
  assert.match(decide(bash('cat > lib/greet.js <<EOF\nx\nEOF', wt), gctx('adopt')) || '', /adopt 팩의 쓰기 경계 밖/, 'Bash 쓰기도 같다');
  assert.equal(decide(bash('node .garagiste/scripts/work.mjs commands quick="node --test tests/unit/*.test.mjs"', wt), gctx('adopt')), null, '명령 등록은 스크립트로');
  assert.deepEqual([TIERS.low.adopt, TIERS.medium.adopt, TIERS.high.adopt], ['haiku', 'sonnet', 'sonnet'], 'adopt의 모델은 boot과 같다(판단보다 실행)');
  assert.equal(team.models.adopt, 'sonnet');
});

// 4라운드(2026-10-04) — 인라인 코드로 규칙집·원장을 쓰는 길(v1 「초록을 만들기 위해 원장을 고쳤다」의 L0 재현)은 막고, 읽기는 그대로
test('guard: 인라인 코드(node -e·python -c·sh -c)가 규칙집·원장 경로와 쓰기 동작을 품으면 거부 — 읽기·다른 경로·ADMIN은 그대로', () => {
  const deny = /인라인 코드/;
  assert.match(decide(bash("node -e \"require('fs').appendFileSync('.garagiste/ledger/evidence.jsonl', JSON.stringify({kind:'verify',exit:0})+'\\n')\""), gctx(null)) || '', deny, '원장 위조');
  assert.match(decide(bash("python3 -c \"open('.garagiste/team.json','w').write('{}')\""), gctx(null)) || '', deny, 'team.json');
  assert.match(decide(bash("sh -c 'echo x > .garagiste/ledger/evidence.jsonl'"), gctx(null)) || '', deny, '셸 -c 안의 리다이렉트');
  assert.match(decide(bash("node -e \"require('fs').writeFileSync('.claude/settings.json','{}')\""), gctx(null)) || '', deny, '배선');
  assert.match(decide(bash("bash -c \"rm .garagiste/units/hello.json\""), gctx(null)) || '', deny, 'unit 상태');
  assert.match(decide(bash("node -e \"require('fs').writeFileSync('.garagiste/session/ceo-touch', new Date().toISOString())\""), gctx(null)) || '', deny, 'CEO 접점 위조(무인 출하 카운터 리셋)');
  assert.equal(decide(bash("node -e \"console.log(require('fs').readFileSync('.garagiste/ledger/evidence.jsonl','utf8').split('\\n').length)\""), gctx(null)), null, '읽기는 자유 — L2 1일차 표 산출 오탐을 되풀이하지 않는다');
  assert.equal(decide(bash("grep -c '\"kind\":\"ship\"' .garagiste/ledger/evidence.jsonl"), gctx(null)), null);
  assert.equal(decide(bash("node -e \"require('fs').writeFileSync('/tmp/x.json','{}')\""), gctx(null)), null, '다른 경로는 이 규칙의 일이 아니다');
  assert.equal(decide(bash("node .garagiste/scripts/work.mjs decide 1 '예'"), gctx(null)), null, '스크립트 호출은 인라인 코드가 아니다');
  assert.equal(decide(bash("node -e \"require('fs').writeFileSync('.garagiste/team.json','{}')\""), { ...gctx(null), env: { GARAGISTE_ADMIN: '1' } }), null, 'CEO(ADMIN)는 자유');
  assert.ok(inlineCodeWrite("python -c \"import shutil; shutil.copy('x', '.garagiste/packs/build.md')\"") && !inlineCodeWrite("python -c \"print(open('.garagiste/team.json').read())\""));
});
// 5라운드(2026-10-04, Q9 「패리티병 금지」): 팩 목록은 하나다 — 손으로 맞추는 사본(두 하네스의 agents · opencode conductor의 task 허용 · doctor)은 이 테스트가 묶는다.
// 3라운드의 adopt가 opencode conductor의 task 허용에서 빠져 있었다 — opencode 설치본에선 레거시 인수가 시작도 못 했다(5라운드 수리).
test('팩 목록 하나: work·brief·checkpoint PACKS 동일 · 두 하네스 agents·packs 파일 · opencode conductor task 허용 = 팩 전부 · doctor가 같은 목록으로 빈 agents를 짚는다', () => {
  const P = [...WORK_PACKS].sort();
  assert.deepEqual([...BRIEF_PACKS].sort(), P); assert.deepEqual([...CP_PACKS].sort(), P);
  const TEAM = fileURLToPath(new URL('../team/', import.meta.url));
  for (const p of P) for (const f of [`claude/agents/${p}.md`, `opencode/agents/${p}.md`, `packs/${p}.md`]) assert.ok(fs.existsSync(path.join(TEAM, f)), `${f} 없음`);
  const conductor = fs.readFileSync(path.join(TEAM, 'opencode/agents/conductor.md'), 'utf8');
  const allow = [...conductor.matchAll(/^\s+"([a-z]+)":\s*allow\s*$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(allow, P, 'opencode conductor가 task로 띄울 수 있는 팩 = 팩 전부');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-packs-'));
  fs.mkdirSync(path.join(tmp, '.claude'), { recursive: true }); fs.writeFileSync(path.join(tmp, '.claude', 'settings.json'), '{}'); fs.writeFileSync(path.join(tmp, 'opencode.json'), '{}');
  const probs = diagnose(tmp);
  for (const p of P) { assert.ok(probs.some((x) => x.startsWith(`.claude/agents/${p}.md 없음`)), `doctor claude ${p}`); assert.ok(probs.some((x) => x.startsWith(`.opencode/agents/${p}.md 없음`)), `doctor opencode ${p}`); }
  fs.rmSync(tmp, { recursive: true, force: true });
});
test('conduct: spawner 틈 — claude 배선이 없으면(opencode만 · 배선 없음) 기본 spawner가 서지 않는다는 한 줄, 사용자 spawner나 claude 배선이 있으면 없음', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-gap-'));
  assert.match(spawnerGap(tmp, false), /^하네스 배선 없음 — 기본 spawner/);
  fs.writeFileSync(path.join(tmp, 'opencode.json'), '{}');
  assert.match(spawnerGap(tmp, false), /^opencode 설치본 — 기본 spawner\(claude -p … --agent <팩>\)는 \.claude\/agents 없이 서지 않는다: --spawner "<[^"]+>" \(opencode 예: opencode run --agent \{pack\} "\$\(cat \{path\}\)"/);
  assert.equal(spawnerGap(tmp, true), null, '사용자 spawner면 틈이 아니다');
  fs.mkdirSync(path.join(tmp, '.claude')); fs.writeFileSync(path.join(tmp, '.claude', 'settings.json'), '{}');
  assert.equal(spawnerGap(tmp, false), null, 'claude 배선이 있으면 기본 spawner');
  fs.rmSync(tmp, { recursive: true, force: true });
});
// 6라운드(2026-10-04) — 고아 팩: 드라이버는 죽고 팩은 살았다. 잠금 한 줄이 가른다.
test('conduct(6라운드): 고아 팩 — 잠금의 드라이버는 죽고 child는 살면 한 줄, 드라이버가 살았거나 child가 죽었거나 없으면 없음', () => {
  const isAlive = (pid) => pid === 200;
  assert.match(orphanOf({ pid: 100, child: 200, slug: 'hello', pack: 'spec' }, { isAlive }) || '', /^앞 드라이버\(pid 100\)는 죽었는데 그 팩 프로세스\(pid 200 · hello spec\)가 아직 돈다 — 끝나길 기다리거나 kill 200 뒤 다시/);
  assert.equal(orphanOf({ pid: 200, child: 300 }, { isAlive }), null, '드라이버가 살았으면 「이미 돌고 있다」의 몫');
  assert.equal(orphanOf({ pid: 100, child: 300 }, { isAlive }), null, 'child도 죽었으면 죽은 잠금 — 갈아 끼운다');
  assert.equal(orphanOf({ pid: 100 }, { isAlive }), null); assert.equal(orphanOf(null, { isAlive }), null);
});
test('conduct(6라운드): runChild — 비동기 spawn의 결과 꼴(status·stdout·pid), 시간 상한이면 SIGTERM으로 끊고 timedOut, onSpawn에 pid, 없는 명령은 error', async () => {
  const r = await runChild({ argv: [process.execPath, '-e', 'process.stdout.write("hi"); process.exit(3)'] }, { cwd: process.cwd(), env: process.env });
  assert.deepEqual([r.status, r.stdout, r.timedOut, typeof r.pid], [3, 'hi', false, 'number']);
  let seen = null;
  const h = await runChild({ argv: [process.execPath, '-e', 'setTimeout(() => {}, 20000)'] }, { cwd: process.cwd(), env: process.env, timeoutMs: 300, onSpawn: (pid) => { seen = pid; } });
  assert.ok(h.timedOut && h.status === null && h.signal === 'SIGTERM' && seen === h.pid, JSON.stringify(h));
  const e = await runChild({ argv: ['definitely-not-a-command-xyz'] }, { cwd: process.cwd(), env: process.env });
  assert.ok(e.error && e.status === null, '없는 명령은 error');
});
// 6라운드(2026-10-04) — 가드의 약속 「읽지도 쓰지도」는 파일 도구의 쓰기만 막았다(측정: cat .env·Read 통과). 읽기도 경계 — 비밀만.
test('guard(6라운드): 비밀 파일은 읽기도 경계 — Bash의 cat·grep·source·python open·base64·cp·id_rsa·.netrc, Read 도구는 거부 · .env.example·--key 플래그·echo .env >> .gitignore·dotenv 모듈·key.test.mjs는 비밀 규칙에 걸리지 않는다', () => {
  const deny = /^비밀 파일\(/;
  for (const cmd of ['cat .env', 'grep -n KEY ./.env', 'source .env && node x.mjs', "python3 -c \"print(open('.env').read())\"", 'base64 config/.env.production', 'cat ~/.ssh/id_rsa', 'cat certs/server.pem', 'less .netrc', 'cp .env /tmp/x', 'node -e "console.log(require(\'fs\').readFileSync(\'.env.local\',\'utf8\'))"']) assert.match(decide(bash(cmd), gctx('build')) || '', deny, cmd);
  const read = (file_path) => ({ tool_name: 'Read', tool_input: { file_path }, cwd: root });
  assert.match(decide(read('/repo/.env'), gctx(null)) || '', deny, 'Read 도구 — 매처에 Read');
  assert.match(decide(read('/repo/certs/server.key'), gctx(null)) || '', deny);
  assert.equal(decide(read('/repo/src/env.mjs'), gctx(null)), null, '읽기는 경계가 아니다 — 비밀만');
  assert.equal(decide(read('/repo/.env.example'), gctx(null)), null);
  for (const cmd of ['cat .env.example', 'cp .env.example .env.sample', 'node x.mjs --key abc', 'echo .env >> .gitignore', 'printf ".env\\n" >> .gitignore', 'node --test tests/unit/key.test.mjs', 'node -r dotenv/config src/x.mjs', 'git add .env.example', 'cat src/env.mjs']) assert.doesNotMatch(decide(bash(cmd), gctx('build')) || '', deny, cmd);
  assert.deepEqual(secretTargets('cat .env && grep x secrets/credentials.json'), ['.env', 'secrets/credentials.json']);
  assert.match(fs.readFileSync(new URL('../team/claude/settings.json', import.meta.url), 'utf8'), /"matcher": "Bash\|PowerShell\|Edit\|Write\|MultiEdit\|NotebookEdit\|Read"/, 'Claude 훅 매처에 Read — 없으면 Read 분기는 죽은 코드다');
  assert.match(fs.readFileSync(new URL('../team/opencode/plugins/guard.ts', import.meta.url), 'utf8'), /read: "Read"/, 'opencode 플러그인 read 매핑');
});
// 7라운드(2026-10-04) — kind refactor: red 증명이 뒤집힌다. 핀은 base·head 모두 초록.
test('redproof(7라운드): pinVerdict — refactor의 핀은 base·head 모두 초록이어야 한다 · base red는 현재 동작이 아님 · head red는 동작이 바뀜 · 핀 0은 증명 아님 · pinRedAdvice는 hold 안내', () => {
  assert.deepEqual(pinVerdict([{ file: 'a', exit: 0 }], null), { pin_base: 'green', head_green: null, ok: true });
  assert.deepEqual(pinVerdict([{ file: 'a', exit: 0 }], [{ file: 'a', exit: 0 }]), { pin_base: 'green', head_green: true, ok: true });
  assert.deepEqual(pinVerdict([{ file: 'a', exit: 1 }], [{ file: 'a', exit: 0 }]), { pin_base: 'red', head_green: true, ok: false });
  assert.deepEqual(pinVerdict([{ file: 'a', exit: 0 }], [{ file: 'a', exit: 1 }]), { pin_base: 'green', head_green: false, ok: false });
  assert.equal(pinVerdict([], null).pin_base, 'red');
  assert.match(pinRedAdvice('x', ['tests/acceptance/x.test.mjs']), /^FAIL redproof x: 핀이 base에서 red — tests\/acceptance\/x\.test\.mjs[\s\S]*work\.mjs ask x "[^"]*" --hold/);
});
test('ship(7라운드): kind refactor의 redproof 조건은 refactor 줄의 pin_base=green·head_green — base_red 꼴은 받지 않고, 같은 tree여야 하고, head red는 증명이 아니다 · KINDS · 팩 refactor 절', () => {
  const unit = { kind: 'refactor', state: 'attack', boundary: { hit: false } };
  const base = { unit, slug: 'r', worktreeExists: true, clean: true, tree: 'T', requireAttack: true, spikeText: '', lastSubject: 'refactor(r): x', stops: [], proseKb: 10, proseMax: 40,
    ledger: [{ kind: 'verify', mode: 'full', exit: 0, tree: 'T' }, { kind: 'attack', slug: 'r', tree: 'T', red: 0, total: 1 }, { kind: 'redproof', slug: 'r', tree: 'T', refactor: true, pin_base: 'green', head_green: true }] };
  assert.equal(evaluateShip(base).filter((k) => !k.ok).length, 0, JSON.stringify(evaluateShip(base).filter((k) => !k.ok)));
  const stale = evaluateShip({ ...base, ledger: [...base.ledger.slice(0, 2), { ...base.ledger[2], tree: 'OLD' }] }).find((k) => k.id === 'redproof');
  assert.match(stale.why, /redproof\(핀\)가 이전 tree의 것/);
  const feature = evaluateShip({ ...base, ledger: [...base.ledger.slice(0, 2), { kind: 'redproof', slug: 'r', tree: 'T', base_red: true, head_green: true }] }).find((k) => k.id === 'redproof');
  assert.match(feature.why, /동작 보존 증명 없음\(핀 base·head 초록 — kind refactor\)/, 'feature 꼴의 red 증명은 refactor의 증명이 아니다');
  assert.ok(!evaluateShip({ ...base, ledger: [...base.ledger.slice(0, 2), { ...base.ledger[2], head_green: false }] }).find((k) => k.id === 'redproof').ok, '동작이 바뀐 핀(head red)은 증명이 아니다');
  assert.deepEqual(KINDS, ['feature', 'scaffold', 'adopt', 'refactor', 'system']);
  for (const p of ['spec', 'build', 'attack']) assert.match(REFACTOR_NOTE[p]({ slug: 'r', acceptance: 'tests/acceptance', main: 'main' }), /refactor/);
  assert.match(REFACTOR_NOTE.spec({ slug: 'r', acceptance: 'tests/acceptance', main: 'main' }), /base\(main\)에서도 초록[\s\S]*tests\/acceptance\/r\*/);
});
// 8라운드(2026-10-04) — 두 설치기는 같은 일을 한다. pwsh가 없는 자리에선 실행 대신 표지로 본다(install.ps1이 1~2라운드의 VERSION·기존 저장소 커밋을 빠뜨린 채 CEO의 Windows에 갔다).
test('install.sh ↔ install.ps1 정적 패리티: VERSION · 기존 저장소 커밋(설치/갱신 · 미커밋 변경 안내 · SHIP+WIP) · autocrlf · chmod · doctor --fresh · selftest · SkipSelftest · 배선 파일 · 모델 자리표시자 7', () => {
  const sh = fs.readFileSync(new URL('../install.sh', import.meta.url), 'utf8'); const ps = fs.readFileSync(new URL('../install.ps1', import.meta.url), 'utf8');
  const pairs = [['.garagiste/VERSION', '.garagiste\\VERSION'], ['"garagiste": "', '"garagiste": "'], ['갱신', '갱신'], ['같은 판', '같은 판'], ['설치 전에 미커밋 변경이 있었다', '설치 전에 미커밋 변경이 있었다'], ['GARAGISTE_SHIP=1 GARAGISTE_WIP=1', '$env:GARAGISTE_SHIP = "1"; $env:GARAGISTE_WIP = "1"'], ['증거 팀 설치 [', '증거 팀 설치 ['], ['core.autocrlf false', 'core.autocrlf false'], ['update-index --chmod=+x .githooks/pre-commit', 'update-index --chmod=+x .githooks/pre-commit'], ['doctor.mjs --fresh', 'doctor.mjs --fresh'], ['selftest.mjs', 'selftest.mjs'], ['SkipSelftest', 'SkipSelftest'], ['guard.ts', 'guard.ts'], ['HAZARDS.md', 'HAZARDS.md'], ['gitignore.snippet', 'gitignore.snippet'], ['core.hooksPath .githooks', 'core.hooksPath .githooks'], ['첫 커밋이 닫히지 않았다', '첫 커밋이 닫히지 않았다'], ['팀 파일 커밋이 닫히지 않았다', '팀 파일 커밋이 닫히지 않았다'], ['기존 코드가 있으면 adopt', '기존 코드가 있으면 adopt']];
  for (const [a, b] of pairs) { assert.ok(sh.includes(a), `install.sh: ${a}`); assert.ok(ps.includes(b), `install.ps1: ${b}`); }
  for (const m of ['BOOT', 'ADOPT', 'INTAKE', 'SPEC', 'BUILD', 'ATTACK', 'SPIKE']) { assert.ok(sh.includes(`{{MODEL_${m}}}`), `sh ${m}`); assert.ok(ps.includes(`{{MODEL_${m}}}`), `ps1 ${m}`); }
  assert.ok(/-SkipSelftest/.test(sh) && /\[switch\]\$SkipSelftest/.test(ps));
});
test('state(8라운드): tried의 증거가 REPORT 줄에 「증거 n」으로 · FLAGS.tried에 evidence', () => {
  const text = reportText({ team: { commands: { run: 'x' }, paths: {} }, scope: { order: ['a'] }, units: [{ slug: 'a', state: 'shipped', milestone: 'M1', origin: 'o', kind: 'feature', shipped: '2026-10-04T00:00:00Z', tried: { result: 'ok', note: '', evidence: ['docs/units/a/evidence/s.png'] }, defaults: [] }], ledger: [] });
  assert.match(text, /써봤다 ok · 증거 1/);
  assert.deepEqual(FLAGS.tried, ['evidence']);
});
