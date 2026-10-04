// e2e — 탄생 시험: 빈 저장소에서 CEO 한 마디가 기계가 닫는 루프를 지나 출하되는가. 모델 0, 네트워크 0.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// 사고 18(원격 클론 검증): URL.pathname은 win32에서 /C:/… 를 내놓아 경로가 깨진다 — fileURLToPath가 정본
const HERE = path.dirname(fileURLToPath(import.meta.url));
const GARAGISTE = path.resolve(HERE, '..');
// 사고 18: win32의 PATH엔 bash가 없을 수 있다(spawn status null → e2e 4건 거짓 실패) — Git for Windows의 bash를 찾고, 정말 없으면 명시적으로 SKIP
const BASH = (() => {
  const cands = ['bash', path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'bin', 'bash.exe'), 'C:\\Program Files (x86)\\Git\\bin\\bash.exe'];
  for (const c of cands) { try { if (spawnSync(c, ['--version'], { encoding: 'utf8' }).status === 0) return c; } catch { /* 다음 후보 */ } }
  return null;
})();
const NO_BASH = 'bash 없음 — Git for Windows의 bash를 PATH에 두거나 설치하라. 설치 경로 자체는 install.ps1 + selftest가 검증한다';
const ENV = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', CLAUDE_PROJECT_DIR: undefined };
delete ENV.CLAUDE_PROJECT_DIR; delete ENV.NODE_TEST_CONTEXT; delete ENV.NODE_OPTIONS; // 중첩 node --test는 exit code를 바꾼다
const run = (cmd, args, cwd, env = {}) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...ENV, ...env } });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const script = (name, args, cwd, env) => run(process.execPath, [path.join(cwd, '.garagiste', 'scripts', `${name}.mjs`), ...args], cwd, env);
const write = (root, rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
const git = (args, cwd, env) => run('git', args, cwd, env);

test('탄생 시험: 한 마디 → red 주장 → green → 공격 → 7조건 출하 → 써봤다, 전부 기계가 닫는다', { timeout: 120000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-e2e-'));
  assert.equal(git(['init', '-q', '-b', 'main'], repo).status, 0);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  git(['add', '-A'], repo); assert.equal(git(['commit', '-q', '-m', 'init'], repo).status, 0);

  // 설치 — 세 파일이 팀이다
  const inst = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo);
  assert.equal(inst.status, 0, inst.out);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  assert.equal(team.models.build, 'haiku', 'budget low가 모델 편성에 반영');
  assert.match(fs.readFileSync(path.join(repo, '.claude/agents/build.md'), 'utf8'), /^model: haiku$/m, '에이전트 파일은 팩의 spawn 설정 — 모델은 예산에서');
  assert.ok(fs.existsSync(path.join(repo, '.claude/hooks/guard.mjs')) && fs.existsSync(path.join(repo, '.garagiste/scripts/guard-rules.mjs')));
  assert.match(script('work', ['models', 'build=opus'], repo).out, /^MODELS .*build=opus.* → 7 에이전트 파일 갱신/);
  assert.match(fs.readFileSync(path.join(repo, '.claude/agents/build.md'), 'utf8'), /^model: opus$/m, 'work models가 team.json과 에이전트 파일을 함께 바꾼다');
  assert.match(script('work', ['models', 'low'], repo).out, /build=haiku/);
  const re = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'high', '-SkipSelftest'], repo);
  assert.equal(re.status, 0, re.out);
  assert.match(fs.readFileSync(teamPath, 'utf8'), /"build": "haiku"/, 'R15: 재설치가 편성을 지우지 않는다 — 기존 team.json이 -Budget을 이긴다(v1 재적용병 회귀)');
  assert.match(fs.readFileSync(path.join(repo, '.claude/agents/build.md'), 'utf8'), /^model: haiku$/m, 'R15: 에이전트 model:도 team.json이 정본');
  assert.match(fs.readFileSync(path.join(repo, '.claude/settings.json'), 'utf8'), /permissions/, 'R15: 기존 settings.json 보존');
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/**/*.test.mjs"', test_file: 'node --test {file}', run: 'node src/cli.mjs' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo);
  const c1 = git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' });
  assert.equal(c1.status, 1, '설치 뒤 첫 커밋도 원장 PASS 없이는 닫힌다: ' + c1.out);
  assert.match(script('verify', ['quick'], repo).out, /^PASS verify:quick/);
  const c2 = git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' });
  // 게이트가 거부하면 사유 + git 상태 전문이 찍힌다 (win32 진단 — 사고 18 후속: 인덱스≠작업트리의 원인 지목용)
  assert.equal(c2.status, 0, `${c2.out}\nstatus: ${git(['status', '--porcelain', '-uall'], repo).out}\nunstaged: ${git(['diff', '--name-only'], repo).out}\nautocrlf: ${git(['config', '--show-origin', '--get-all', 'core.autocrlf'], repo).out}`);
  const doc = script('doctor', [], repo).out;
  assert.match(doc, /FAIL doctor 1\n- session-start alive 마커 없음/, '첫 세션 전엔 alive만 빠진다: ' + doc);

  // CEO 한 마디
  const nw = script('work', ['new', 'hello', '이름을 주면 그 이름으로 인사한다'], repo);
  assert.match(nw.out, /^UNIT hello spec \.worktrees\/hello/);
  const wt = path.join(repo, '.worktrees', 'hello');
  assert.equal(fs.readFileSync(path.join(wt, '.garagiste-pack'), 'utf8'), 'spec');
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/hello.json'), 'utf8')).origin_kind, 'team', 'R3: 팀 세션의 new는 team — ADMIN(CEO 세션)만 ceo');
  // 사고 65(L2 5판 리눅스 5라운드): CEO의 말이 BRIEF에 그대로 있으면 팀 세션의 new도 ceo — 「팀이 스스로 뜬 unit 연속」이 CEO 발의 unit을 세지 않는다
  assert.match(script('work', ['new', 'hello-x', '팀이 지어낸 것 하나', '--from', 'ceo'], repo).out, /^FAIL --from ceo는 CEO의 말이 BRIEF에 그대로 있어야 한다/, 'BRIEF에 없는 말의 --from ceo는 거부');
  script('work', ['brief', '버그: 인사에 이름이 두 번 나온다 — 「안녕 철수 철수」'], repo);
  assert.match(script('work', ['new', 'hello-fix', '버그: 인사에 이름이 두 번 나온다 — "안녕 철수 철수"'], repo).out, /^UNIT hello-fix /);
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/hello-fix.json'), 'utf8')).origin_kind, 'ceo', '사고 65: BRIEF에 그대로 있는 말(따옴표만 다름)은 CEO 발의');
  assert.match(script('work', ['drop', 'hello-fix', '시험용 — 지운다', '--forget'], repo).out, /^DROPPED hello-fix/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[ \] hello · M\? · needs: - · "이름을 주면 그 이름으로 인사한다" · 인수: -/);
  assert.match(script('work', ['new', 'net', '외부 API로 network 호출을 한다'], repo).out, /HIT .*keyword network/, 'boundary는 spike부터');
  assert.match(script('brief', ['spike', 'net'], repo).out, /^PACK .*net-spike-/, 'R11: 안내대로 spike 팩이 spec 전에 열린다 — 측정은 인수 테스트를 기다리지 않는다');
  // next: Flow 4의 매 걸음을 스크립트가 말한다 — conductor는 그 줄만 따른다
  const nx = () => script('next', [], repo).out.trim();
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/brief\.mjs spec hello — /, 'next: 먼저 연 unit(hello)의 첫 팩 — 한 번에 하나');

  // spec: red 주장
  write(wt, 'tests/acceptance/hello.test.mjs', `// @claim 이름을 주면 "hello <이름>"을 출력한다
// @milestone M1
// @sensor machine@linux
import test from 'node:test'; import assert from 'node:assert/strict'; import { spawn, spawnSync } from 'node:child_process';
test('hello Ada', () => { const r = spawnSync(process.execPath, ['src/cli.mjs', 'Ada'], { encoding: 'utf8' }); assert.equal(r.status, 0); assert.equal(r.stdout.trim(), 'hello Ada'); });
`);
  write(wt, 'docs/units/hello/try.md', '명령: `node src/cli.mjs Ada`\n기대: `hello Ada`\n');
  write(wt, 'docs/units/hello/surface.md', 'CLI 인자 하나 → stdout 한 줄\n');
  assert.match(script('redproof', ['hello'], repo).out, /^RED hello 1\/1/, '사고 9: 메인 루트에서 불러도 unit worktree가 뿌리 — 0/0 거짓 초록 없음');
  const spec = script('brief', ['spec', 'hello'], repo);
  assert.match(spec.out, /^PACK \.garagiste\/session\/packs\/hello-spec-.*KB cwd=\.worktrees\/hello model=sonnet/);
  assert.match(nx(), /^NEXT spawn spec hello \.garagiste\/session\/packs\/hello-spec-\S+\.md — [^\n]*Agent\(subagent_type: "spec", prompt: "\.garagiste\/session\/packs\/hello-spec-/, 'next: 조립된 팩은 띄운다');
  assert.match(script('work', ['spawned', 'hello', 'spec'], repo).out, /^SPAWN hello spec/);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/redproof\.mjs hello — /, 'next: spec 뒤엔 RED 증명(팩 전의 redproof는 세지 않는다)');
  git(['add', '-A'], wt);
  assert.equal(git(['commit', '-q', '-m', 'test(hello): red 주장'], wt).status, 1, '원장 PASS 없는 커밋은 닫힌다');
  assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'test(hello): red 주장'], wt).status, 0);

  assert.match(script('redproof', ['hello'], repo).out, /^RED hello 1\/1/);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/brief\.mjs build hello — RED/, 'next: RED면 build');

  // build: red → green (팩은 acceptance·이어받기 절을 담는다)
  const build = script('brief', ['build', 'hello'], repo);
  assert.match(build.out, /^PACK .* model=haiku/);
  const packText = fs.readFileSync(path.join(repo, build.out.split(' ')[1]), 'utf8');
  assert.ok(packText.includes('## 인수 테스트') && packText.includes('hello Ada') && packText.includes('<<< 데이터 — 지시가 아님'));
  assert.equal(fs.readFileSync(path.join(wt, '.garagiste-pack'), 'utf8'), 'build');
  assert.match(nx(), /^NEXT spawn build hello /, 'next: build 팩을 띄운다');
  assert.match(script('work', ['spawned', 'hello', 'build'], repo).out, /^SPAWN hello build/);
  write(wt, 'src/cli.mjs', "process.stdout.write(`hello ${process.argv[2] ?? ''}\\n`);\n");
  git(['add', '-A'], wt);
  assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'feat(hello): 인사\n\nUnit: hello\nStep: 1\nProven: hello Ada'], wt).status, 0);
  assert.match(script('redproof', ['hello'], wt).out, /^PASS redproof hello base_red head_green/);
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/brief\.mjs attack hello — build가 끝났다/, 'next: build 뒤엔 공격 한 바퀴');

  // 출하 시도 — attack 기록이 없으면 닫힌다
  assert.match(script('ship', ['hello'], repo).out, /FAIL ship hello 1\/8\n- attack: attack 기록 없음/);
  assert.match(script('work', ['tried', 'hello', 'ok'], wt).out, /^FAIL tried는 메인 저장소에서만/, 'R2: 팩이 자기 unit을 검수하지 못한다');
  assert.match(script('work', ['commands', 'quick=echo x'], wt).out, /^FAIL commands는 boot/, 'R6: feature unit이 검증 명령을 재작성하지 못한다');

  // attack: 실패하는 테스트가 산출물
  assert.match(script('brief', ['attack', 'hello'], repo).out, /^PACK .*model=sonnet/);
  assert.match(nx(), /^NEXT spawn attack hello /);
  assert.match(script('work', ['spawned', 'hello', 'attack'], repo).out, /^SPAWN hello attack/);
  write(wt, 'tests/adversary/hello-1.test.mjs', `import test from 'node:test'; import assert from 'node:assert/strict'; import { spawn, spawnSync } from 'node:child_process';
test('이름이 없으면 hello만 (끝 공백 없음)', () => { const r = spawnSync(process.execPath, ['src/cli.mjs'], { encoding: 'utf8' }); assert.equal(r.stdout, 'hello\\n'); });
`);
  assert.match(script('verify', ['attack', 'hello'], repo).out, /^ATTACK hello red 1\/1/, '사고 9: attack도 메인에서 불러도 worktree가 뿌리');
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'test(hello): adversary'], wt).status, 0);
  assert.match(script('ship', ['hello'], repo).out, /- attack: adversary red 1/);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/brief\.mjs build hello — 공격 red 1/, 'next: red가 남으면 build 다시');

  // build 재spawn: red → green, 이어받기 절이 팩에 있다
  const rebuild = fs.readFileSync(path.join(repo, script('brief', ['build', 'hello'], repo).out.split(' ')[1]), 'utf8');
  assert.match(nx(), /^NEXT spawn build hello /);
  script('work', ['spawned', 'hello', 'build'], repo);
  assert.match(rebuild, /## 이어받기/);
  // L2 2판 윈도우 1일차: 고칠 때마다 attack 팩을 새로 띄워 28·20바퀴 — attack은 spec 뒤 한 바퀴, 고친 뒤엔 기존 공격 테스트만(verify.mjs attack)
  assert.match(script('brief', ['attack', 'hello'], repo).out, /^FAIL attack 팩: hello은 이번 spec 뒤 이미 공격받았다[\s\S]*verify\.mjs attack hello[\s\S]*ship\.mjs hello[\s\S]*brief\.mjs build hello/);
  // 사고 43(필드 벤치 2 웹 정비): 헤드리스에선 `cd <wt> && …`와 명령 앞 환경 변수 접두(`X=1 npm …`)가 승인 대기로 막혀 build가 의존성을 못 깔았다 — 팩이 막히지 않는 꼴을 준다
  assert.match(rebuild, /승인 대기로 막히는 꼴[\s\S]*X=1 cmd[\s\S]*git -C [^ ]*hello[\s\S]*npm --prefix [^ ]*hello/, '팩이 headless의 함정과 대안(git -C · npm --prefix · 이미 설정된 환경)을 말한다');
  // 사고 32(필드 시험 1): build 팩엔 인수 테스트만 있었다 — 프로젝트의 full이 공격 파일을 안 집으면(파이썬 discover는 test*.py만) build는 green만 보고 빈손으로 끝났다
  assert.match(rebuild, /## 공격 테스트 — 지금 red[\s\S]*tests\/adversary\/hello-1\.test\.mjs[\s\S]*끝 공백 없음/, 'build 팩이 attack의 red 파일과 내용을 할 일로 받는다');
  write(wt, 'src/cli.mjs', "const n = process.argv[2]; process.stdout.write(n ? `hello ${n}\\n` : 'hello\\n');\n");
  git(['add', '-A'], wt); assert.match(script('verify', ['quick'], wt).out, /^PASS/);
  assert.equal(git(['commit', '-q', '-m', 'fix(hello): 이름 없을 때\n\nUnit: hello\nStep: 2'], wt).status, 0);
  assert.match(script('verify', ['attack', 'hello'], wt).out, /^ATTACK hello red 0\/1/);
  assert.match(script('redproof', ['hello'], wt).out, /^PASS redproof/);
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/ship\.mjs hello — red 0/, 'next: red 0이면 ship');

  // 사고 22 재현: 증거 기록 뒤 main이 움직인다(CEO 동기화 커밋과 같은 꼴) — ship은 rebase 후 full·redproof·attack을 새 tree에 스스로 다시 묶고 한 번에 SHIPPED
  write(repo, 'docs/NOTE.md', 'main moved\n');
  git(['add', 'docs/NOTE.md'], repo);
  assert.equal(git(['commit', '-q', '-m', 'docs: note'], repo, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' }).status, 0);
  // ship: 7조건 통과 → main ff 머지 + LEDGER + STATUS
  const ship = script('ship', ['hello'], repo);
  assert.match(ship.out, /^SHIPPED hello [0-9a-f]{7} sensor=machine/, ship.out);
  assert.ok(fs.existsSync(path.join(repo, 'src/cli.mjs')) && !fs.existsSync(wt));
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| hello \| [0-9a-f]{7} \| [0-9a-f]{7} \| PASS \| base_red head_green \| 1→0\/1 \| machine \|/, 'Q4: attack 열이 선발견 수를 담는다 — 이 unit에서 attack이 결함 1을 build보다 먼저 잡았다');
  const status = fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8');
  // 미검수 상한(채용 2026-10-03): hello는 인수 전부 machine·공격 선발견 1 — 기계가 증명했으니 상한에 세지 않고 카드에 표시만(마일스톤 끝에 써본다)
  assert.match(status.split('\n')[0], /^실행: node src\/cli\.mjs · 안 본 것 0\/3 · target-OS 미관측 0 · 결정 대기 0 · 센서 커버리지 100%/);
  assert.match(status, /## 써볼 것 \(≤3\)\n- \*\*hello\*\*[^\n]*기계 증명\(공격 선발견 1\) — 상한에 세지 않는다/);
  assert.match(git(['log', '-1', '--format=%s%n%b'], repo).out, /ship\(hello\)[\s\S]*Unit: hello[\s\S]*Attack: 1→0\/1/);
  assert.equal(git(['status', '--porcelain'], repo).out.trim(), '', 'main은 깨끗하다');
  assert.match(script('claims', [], repo).out, /true\s+M1\s+machine@linux\s+tests\/acceptance\/hello\.test\.mjs — 이름을 주면/);
  assert.match(nx(), /^NEXT spawn spike net /, 'next: 출하 뒤엔 남은 unit(net)의 조립된 spike 팩');

  // CEO: 써봤다
  assert.match(script('work', ['tried', 'hello', 'ok'], repo).out, /^PASS tried hello ok/);
  assert.match(script('state', ['--brief'], repo).out, /안 본 것 0\/3/);
  assert.match(script('work', ['ask', 'net', '어느 호스트로 나가나?'], repo).out, /^Q1 queued/);
  assert.match(script('state', ['--brief'], repo).out, /결정 대기 1/);
  assert.match(script('work', ['decide', '1', 'api.example 하나만'], repo).out, /^PASS decide Q1/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/DECISIONS.md'), 'utf8'), /- \[x\] Q1 \(net\): 어느 호스트로 나가나\? → api\.example 하나만/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[x\] hello · /, 'ship이 BACKLOG 줄을 닫는다');

  // Q1 방향전환: drop — 작업은 dropped/ 브랜치에 남고, 같은 slug가 새로 열린다 (kill-and-respawn)
  assert.match(script('work', ['drop', 'net', '방향 바꿈'], repo).out, /^DROPPED net/, 'Q1: drop 명령');
  assert.ok(!fs.existsSync(path.join(repo, '.worktrees', 'net')), 'worktree는 제거된다');
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/net.json'), 'utf8')).state, 'dropped');
  assert.match(git(['branch', '--list', 'dropped/net-*'], repo).out, /dropped\/net-/, '증거는 브랜치로 남는다');
  assert.match(script('work', ['new', 'net', '외부 API로 network 호출을 한다'], repo).out, /^UNIT net/, 'dropped 위에 같은 slug가 새로 열린다');
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/brief\.mjs spike net — /, 'next: boundary HIT unit은 spike부터 — 옛 생애의 팩은 세지 않는다');

  // 입구: 구상 원문 → intake 팩 → (intake가 할 일을 테스트가 대신) unit 줄 → 범위와 선행 역제안 → seed
  assert.match(script('work', ['brief', '로그인한 사람만 메모를 쓰고, 메모는 내보낼 수 있다.'], repo).out, /^BRIEF \+1줄/);
  const ip = script('brief', ['intake'], repo);
  assert.match(ip.out, /^PACK \.garagiste\/session\/packs\/intake-.* cwd=\. model=sonnet/);
  assert.match(fs.readFileSync(path.join(repo, ip.out.split(' ')[1]), 'utf8'), /## BRIEF \(전문\)[\s\S]*로그인한 사람만/);
  assert.match(fs.readFileSync(path.join(repo, ip.out.split(' ')[1]), 'utf8'), /## 결정된 것[\s\S]*api\.example 하나만/, '닫힌 결정은 intake 팩에도 — 답 난 것을 다시 묻지 않는다');
  assert.match(script('work', ['add', 'session', '로그인한 사람만', '--milestone', 'M1', '--accept', 'POST /login → 200'], repo).out, /^ADD session M1/);
  assert.match(script('work', ['add', 'memo', '메모를 쓴다', '--milestone', 'M1', '--needs', 'session'], repo).out, /needs=session/);
  // 사고 23(3차 실기): intake가 Q 번호를 짐작해 한 칸 밀려 적었다(needs 오연결 6 unit) — 없는 번호는 add가 거부하고, 번호는 ask --for가 잇는다
  assert.match(script('work', ['add', 'export', '메모는 내보낼 수 있다', '--milestone', 'M2', '--needs', 'memo,Q2'], repo).out, /^FAIL needs Q2: DECISIONS에 없는 질문/);
  assert.match(script('work', ['add', 'export', '메모는 내보낼 수 있다', '--milestone', 'M2', '--needs', 'memo'], repo).out, /^ADD export M2/);
  assert.match(script('work', ['ask', 'intake', '내보내기 형식은 CSV 하나로 충분한가?', '--for', 'export'], repo).out, /^Q2 queued — needs에 연결: export/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[ \] export · M2 · needs: memo,Q2 · /, '번호는 스크립트가 잇는다 — 에이전트가 옮겨 적지 않는다');
  // needs 수정 명령: 어긋난 선행을 conductor가 고친다(메인 전용 · 원장에 남는다)
  assert.match(script('work', ['needs', 'memo', 'session,Q2'], repo).out, /^NEEDS memo session → session,Q2/);
  assert.match(script('work', ['needs', 'memo', 'session'], repo).out, /^NEEDS memo session,Q2 → session/);
  assert.match(script('work', ['needs', 'memo', 'Q9'], repo).out, /^FAIL needs Q9: DECISIONS에 없는 질문/);
  assert.match(script('work', ['needs', 'memo', 'nosuch'], repo).out, /^FAIL needs nosuch: BACKLOG에 없는 unit/);
  assert.match(script('work', ['needs', 'session', 'memo'], repo).out, /^FAIL needs 순환/);
  assert.match(script('work', ['needs', 'memo', 'session'], path.join(repo, '.worktrees', 'net')).out, /^FAIL needs는 메인 저장소에서만/);
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"needs","slug":"memo","from":\["session","Q2"\],"to":\["session"\]/);
  assert.match(script('work', ['decide', '2', 'CSV 하나'], repo).out, /^PASS decide Q2/);
  assert.match(script('work', ['scope', 'export', '--milestone', 'M1'], repo).out, /^FAIL scope: slug 목록과 --milestone\/--range는 함께 쓸 수 없다/, 'L2 5판 4라운드: 혼용은 원인을 말한다(「BACKLOG에 없는 slug: --milestone」이 아니라)');
  const sc = script('work', ['scope', 'export'], repo).out;
  assert.match(sc, /^SCOPE 요청 1 · 선행 2 · 없는 선행 0\n- 선행: session \(memo가 needs\) · memo \(export가 needs\)\n- 순서: session → memo → export/, sc);
  // L2 1일차: unit은 한 번에 하나 — 일하는 unit(net)이 있으면 seed는 열지 않는다(병렬 seed가 사고 26의 토양이었다)
  assert.match(script('work', ['seed'], repo).out, /^ACTIVE net — unit은 한 번에 하나/);
  assert.match(script('work', ['drop', 'net', '범위 밖'], repo).out, /^DROPPED net/);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/work\.mjs seed — 다음 unit session/, 'next: 일하는 unit이 없으면 seed');
  assert.match(script('work', ['seed'], repo).out, /^UNIT session spec \.worktrees\/session/, '선행이 먼저 열린다');
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/session.json'), 'utf8')).origin_kind, 'seed', 'R1·R3: seed 경유는 seed — 팀 자발(team)도 CEO 접점(ceo)도 아니다');
  // Q1 re-spec: 진행 중 unit의 수용을 다시 연다 — 정체(팩)가 spec으로 돌아온다
  const swt = path.join(repo, '.worktrees', 'session');
  write(swt, 'tests/acceptance/session.test.mjs', "import test from 'node:test'; test('로그인한 사람만', () => { throw new Error('red'); });\n");
  script('brief', ['build', 'session'], repo);
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/session.json'), 'utf8')).state, 'build');
  const rs = script('brief', ['spec', 'session'], repo);
  assert.match(rs.out, /PACK .*session-spec-/, 'Q1 re-spec: 진행 중 unit에 spec 팩이 다시 열린다');
  const rsPack = fs.readFileSync(path.join(repo, rs.out.split(' ')[1]), 'utf8');
  assert.ok(rsPack.includes('## 결정된 것') && rsPack.includes('CSV 하나'), '전역(intake) 결정이 unit 팩에 있다 — 사고 4 회귀');
  assert.ok(!rsPack.includes('api.example'), '사고 13: 남의 unit(net) 결정은 스코프 밖 — 팩은 프로젝트 나이만큼 크지 않는다');
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/session.json'), 'utf8')).state, 'spec', '정체가 spec으로 돌아와 수용을 고칠 수 있다 — 「저게 낫겠더라」의 착지점');
  // 사고 17(2차 실기): 진행 중 unit의 질문이 build 뒤에 닫혀 답이 구현되지 않은 채 출하됐다 — 닫힘은 반영이 아니다.
  // decide가 spec 재개를 걸고, build·attack 팩과 ship은 spec이 답을 받을 때까지 열리지 않는다(re-spec 경로 재사용)
  assert.match(script('work', ['ask', 'session', '세션 만료는 30분인가?'], repo).out, /^Q3 queued/);
  assert.match(script('brief', ['build', 'session'], repo).out, /^PACK .*session-build-/);
  // 사고 24 준비: build가 제품 코드를 커밋한 상태 — 그 위에서 RESPEC의 re-spec이 새 red 주장을 쓴다
  write(swt, 'src/session.mjs', 'export const ttl = 0;\n');
  git(['add', '-A'], swt); assert.match(script('verify', ['quick'], swt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'feat(session): 세션\n\nUnit: session'], swt).status, 0);
  const dq = script('work', ['decide', '3', '30분'], repo).out;
  assert.match(dq, /^PASS decide Q3\nRESPEC session — Q3의 답이 진행 중에 왔다/, dq);
  assert.match(script('brief', ['build', 'session'], repo).out, /^FAIL build 팩: Q3의 답이 진행 중에 왔다 — spec이 먼저/);
  assert.match(script('brief', ['attack', 'session'], repo).out, /^FAIL attack 팩: Q3의 답이 진행 중에 왔다/);
  assert.match(script('ship', ['session'], repo).out, /- questions: .*Q3.*brief\.mjs spec session/);
  const rq = script('brief', ['spec', 'session'], repo);
  assert.match(fs.readFileSync(path.join(repo, rq.out.split(' ')[1]), 'utf8'), /## 재-spec — 진행 중에 온 답[\s\S]*Q3[\s\S]*30분/, 'spec 팩이 그 답을 이유로 받는다');
  // 사고 24(4차 실기): 기존 코드 위의 re-spec — 새 주장은 head에서 red가 정상인데 redproof가 head green을 요구해 안내 없는 FAIL로 루프가 멈췄다
  write(swt, 'tests/acceptance/session-ttl.test.mjs', "import test from 'node:test'; import fs from 'node:fs'; test('만료 30분', () => { if (!fs.readFileSync('src/session.mjs', 'utf8').includes('ttl = 30')) throw new Error('red'); });\n");
  git(['add', '-A'], swt); script('verify', ['quick'], swt);
  assert.equal(git(['commit', '-q', '-m', 'test(session): Q3 red 주장'], swt).status, 0);
  assert.match(script('redproof', ['session'], repo).out, /^RED session 2\/2 — 기존 코드 위의 새 주장\(re-spec\): 다음은 build/, '사고 24: re-spec(정체 spec)의 끝은 RED — 다음 할 일이 적혀 있다');
  assert.match(script('brief', ['build', 'session'], repo).out, /^PACK .*session-build-/, 'spec이 답을 받은 뒤에야 build가 열린다');
  assert.match(script('redproof', ['session'], repo).out, /^FAIL redproof session base_red=true head_green=false — head에서 red: .*session-ttl.* → build가 덜 끝났다/, '사고 24: 정체가 build면 head red는 미완 — 이것도 다음 할 일을 말한다');
  // 사고 33(필드 시험 1): build가 「인수 테스트가 서로 어긋난다」는 spec: 줄을 남겨도 받을 길이 없었다 — redproof는 build 재spawn만 말해 빈손 build가 반복됐다
  assert.match(script('redproof', ['session'], repo).out, /spec: 줄을 남겼으면 .*brief\.mjs spec session --return/, 'head red의 FAIL이 spec: 줄의 길도 말한다');
  const ret = script('brief', ['spec', 'session', '--return', 'spec: 만료 주장과 갱신 주장이 서로 어긋난다'], repo);
  assert.match(fs.readFileSync(path.join(repo, ret.out.split(' ')[1]), 'utf8'), /## 반려 — build 팩이 남긴 줄[\s\S]*서로 어긋난다/, 'spec 팩이 반려 줄을 받는다');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"spec_return","slug":"session","from":"build"/);
  const second = script('brief', ['spec', 'session', '--return', 'spec: 또 어긋난다'], repo).out;
  assert.match(second, /^FAIL spec 반려가 두 번째 — 팀 안에서 풀리지 않았다/, '반려 핑퐁은 한 번 — 두 번째는 CEO에게');
  // 사고 42(필드 벤치 2 웹 정비): 충돌이 출하된 unit의 공격 테스트(과잉 단언)에 있고 CEO가 「고쳐라」 했는데 실행할 길이 없었다 — 출하된 unit엔 worktree가 없고, 공격 테스트를 쓰는 attack에 그 결정을 줄 길이 없었다
  assert.match(second, /brief\.mjs spec session[\s\S]*brief\.mjs attack session --revise/, 'CEO의 두 답(수용을 바꿔라 · 기존 공격 테스트를 고쳐라)이 각각 명령으로 있다: ' + second);
  // 사고 59(홀드아웃 library 3일차): 「hard 질문 — 그 unit만 멈춘다」라 했지만 열린 Q가 생기지 않아 seed가 ACTIVE로 다른 unit까지 막았다
  assert.match(second, /그 unit만 세우고 다음 seed로[\s\S]*work\.mjs ask session "[^"]+" --hold/, '그 unit만 세우는 명령이 있다');
  assert.match(script('brief', ['spec', 'hello'], repo).out, /^FAIL hello은 이미 출하됐다[\s\S]*--revise/, '출하된 unit엔 팩이 없다 — 진행 중 unit의 팩이 고친다고 말한다');
  assert.match(script('brief', ['attack', 'net', '--revise', 'x'], repo).out, /^FAIL --revise는 spec 반려가 CEO에게 간 unit에만/, '기존 공격 테스트를 고치는 것은 CEO 결정의 길뿐(테스트 약화)');
  assert.match(script('brief', ['build', 'session', '--revise', 'x'], repo).out, /^FAIL --revise는 attack 팩에만/);
  const rv = script('brief', ['attack', 'session', '--revise', '예 — hello-1의 끝 공백 단언은 본문 기준으로 고쳐라'], repo);
  assert.match(rv.out, /^PACK .*session-attack-/, rv.out);
  assert.match(fs.readFileSync(path.join(repo, rv.out.split(' ')[1]), 'utf8'), /## 고쳐 쓰기 — CEO가 고치라 한 기존 공격 테스트[\s\S]*hello-1의 끝 공백 단언[\s\S]*서로 어긋난다/, 'attack 팩이 CEO 말과 충돌의 근거(반려 줄)를 받는다');
  assert.match(fs.readFileSync(path.join(repo, rv.out.split(' ')[1]), 'utf8'), /- test_file: `[^`]*\{file\}` — 증명은 파일 하나씩[^\n]*혼자 돈다[^\n]*다른 테스트 파일의 도우미에 기대지 않는다/, '사고 56: attack 팩도');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"adversary_revise","slug":"session","reason":"예 — hello-1/);
  assert.match(script('brief', ['build', 'session', '--return', 'x'], repo).out, /^FAIL --return은 spec 팩에만/);
  script('brief', ['build', 'session'], repo);
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"respec","slug":"session","q":3/);
  assert.match(script('work', ['seed'], repo).out, /^ACTIVE session — unit은 한 번에 하나/, '진행 중인 unit이 끝나야 다음이 열린다');
  assert.match(script('state', [], repo).out, /안 본 것 0\/3/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8'), /## 범위\n- 요청 1 · 선행 2 · 출하 0\/3\n- 순서: session → memo → export/);
  // 사고 59(홀드아웃 library 3·4·5일차): CEO 결정만 요구하는 FAIL은 그 unit만 세운다 — --hold는 Q를 걸되 답이 와도 re-spec하지 않는다(5일차엔 팩 상한의 답이 spec부터 다시 돌렸다)
  assert.match(script('work', ['ask', 'session', '팩 상한 초과 — ① pack_kb_max 올리기 · ② unit 나누기', '--hold'], repo).out, /^Q4 queued — session은 답이 올 때까지 세워 둔다/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/session.json'), 'utf8')).holds, [4]);
  assert.doesNotMatch(script('work', ['seed'], repo).out, /^ACTIVE session/, '세운 unit은 자리를 막지 않는다 — 다른 unit은 seed가 연다');
  const d4 = script('work', ['decide', '4', '① 상한을 올려 CEO 커밋했다'], repo).out;
  assert.match(d4, /^PASS decide Q4/);
  assert.doesNotMatch(d4, /RESPEC/, '예산 답은 re-spec이 아니다');
  assert.match(script('work', ['seed'], repo).out, /^ACTIVE session/, '답이 오면 다시 일하는 unit');
  assert.match(nx(), /^NEXT spawn build session /, 'next: 답이 온 unit의 조립된 build 팩부터');
});

test('R9 출하 원자성: 머지 뒤 main quick이 빨간이면 머지·출하 기록이 되돌려진다', { timeout: 120000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-atomic-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  const flagged = `node -e "process.exit(require('fs').existsSync('.garagiste/session/failflag')?1:0)"`;
  team.commands = { quick: flagged, full: flagged, test_file: 'node --test {file}', run: 'true' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo);
  script('verify', ['quick'], repo);
  const c9 = git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' });
  assert.equal(c9.status, 0, `${c9.out}\nstatus: ${git(['status', '--porcelain', '-uall'], repo).out}\nunstaged: ${git(['diff', '--name-only'], repo).out}\nautocrlf: ${git(['config', '--show-origin', '--get-all', 'core.autocrlf'], repo).out}`);
  script('work', ['new', 'atom', '원자성 확인'], repo);
  const wt = path.join(repo, '.worktrees', 'atom');
  write(wt, 'tests/acceptance/atom.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';\ntest('atom 산출물', () => { assert.ok(fs.existsSync('src/atom.mjs')); });\n");
  assert.match(script('redproof', ['atom'], wt).out, /^RED atom/);
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'test(atom): red'], wt).status, 0);
  write(wt, 'src/atom.mjs', '// atom\n');
  write(wt, 'tests/adversary/atom-1.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';\ntest('빈 파일 아님', () => { assert.ok(fs.readFileSync('src/atom.mjs', 'utf8').length > 0); });\n");
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'feat(atom): 산출물\n\nUnit: atom\nStep: 1'], wt).status, 0);
  assert.match(script('redproof', ['atom'], wt).out, /^PASS redproof/);
  assert.match(script('verify', ['attack', 'atom'], wt).out, /red 0\/1/);
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  const prevHead = git(['rev-parse', 'main'], repo).out.trim();
  write(repo, '.garagiste/session/failflag', '1');
  const s1 = script('ship', ['atom'], repo);
  assert.match(s1.out, /머지를 되돌렸다/, s1.out);
  assert.equal(git(['rev-parse', 'main'], repo).out.trim(), prevHead, 'main이 머지 전으로 돌아온다');
  assert.notEqual(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/atom.json'), 'utf8')).state, 'shipped', 'unit은 출하되지 않았다');
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[ \] atom · /, 'BACKLOG 줄이 다시 열린다');
  if (fs.existsSync(path.join(repo, 'docs/LEDGER.md'))) assert.doesNotMatch(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| atom \|/, 'LEDGER 행이 남지 않는다');
  fs.rmSync(path.join(repo, '.garagiste/session/failflag'));
  // 사고 41(필드 벤치 2 웹): 마지막 attack이 red 0의 공격 파일만 더하고 끝나면 체크포인트가 wip로 덮는다 — build는 고칠 것이 없고 그 파일을 커밋할 주체가 없어 「HEAD가 wip」가 반복됐다
  write(wt, 'tests/adversary/atom-2.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';\ntest('주석으로 시작', () => { assert.match(fs.readFileSync('src/atom.mjs', 'utf8'), /^\\/\\//); });\n");
  git(['add', '-A'], wt);
  assert.equal(git(['commit', '-q', '-m', 'wip: atom checkpoint'], wt, { GARAGISTE_WIP: '1' }).status, 0);
  assert.match(script('verify', ['attack', 'atom'], wt).out, /red 0\/2/);
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  assert.match(script('redproof', ['atom'], wt).out, /^PASS redproof/);
  const s2 = script('ship', ['atom'], repo);
  assert.match(s2.out, /^SHIPPED atom/, '원인이 사라지면 다시 ship된다 — 증거 파일만 든 wip HEAD는 ship이 승격한다: ' + s2.out);
  const log = git(['log', '--format=%s', '-4'], repo).out;
  assert.match(log, /test\(atom\): attack 산출물/);
  assert.doesNotMatch(log, /^wip:/m, 'main 역사에 wip가 없다');
});

test('사고 44(필드 벤치 셋): full은 「전부」다 — 프로젝트 러너가 못 집는 인수·공격 파일(파이썬 discover는 test*.py만, 하이픈 slug 파일은 0건)도 test_file로 돌린다', { timeout: 120000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-full-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  // 필드 벤치 3 파이썬의 꼴: full이 tests/unit만 집는다(unittest discover — 하이픈 파일을 못 읽는다)
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/unit/**/*.test.mjs"', test_file: 'node --test {file}', run: 'true' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo); script('verify', ['quick'], repo);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  script('work', ['new', 'add-entry', '지출을 기록한다'], repo);
  const wt = path.join(repo, '.worktrees', 'add-entry');
  write(wt, 'tests/acceptance/add-entry.test.mjs', "import test from 'node:test'; import fs from 'node:fs'; test('기록', () => { if (!fs.existsSync('src/add.mjs')) throw new Error('red'); });\n");
  write(wt, 'tests/acceptance/helpers.mjs', "throw new Error('unit의 파일이 아닌 도우미는 돌리지 않는다');\n");
  const f1 = script('verify', ['full'], wt);
  assert.match(f1.out, /^FAIL verify:full [\s\S]*인수·공격 파일 red 1\/1: tests\/acceptance\/add-entry\.test\.mjs/, '러너가 못 집은 red 인수 파일이 full을 FAIL로 만든다: ' + f1.out);
  write(wt, 'src/add.mjs', 'export const add = 1;\n');
  write(wt, 'tests/adversary/add-entry-1.test.mjs', "import test from 'node:test'; test('공격', () => { throw new Error('red'); });\n");
  assert.match(script('verify', ['full'], wt).out, /^FAIL verify:full [\s\S]*red 1\/2: tests\/adversary\/add-entry-1\.test\.mjs/, '공격 파일도');
  write(wt, 'tests/adversary/add-entry-1.test.mjs', "import test from 'node:test'; test('공격', () => {});\n");
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/, '전부 green이면 PASS — unit 파일이 아닌 도우미는 돌리지 않는다');
  // 사고 48(필드 벤치 넷 측정): 파일 하나씩 직렬로 돌리자 웹 full이 20초 → 71초(브라우저 테스트 10개) — 여러 파일을 받는 러너({files})면 한 번에, red일 때만 파일별로
  const lastLog = () => { const v = fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8').trim().split('\n').map(JSON.parse).filter((e) => e.kind === 'verify').pop(); return fs.readFileSync(path.join(repo, v.log), 'utf8'); };
  assert.equal((lastLog().match(/→ exit/g) || []).length, 2, '{file} 러너는 파일마다 한 번(계약 그대로)');
  write(wt, 'tests/adversary/add-entry-2.test.mjs', "import test from 'node:test'; test('공격 2', () => {});\n");
  team.commands.test_file = 'node --test {files}';
  for (const root of [repo, wt]) fs.writeFileSync(path.join(root, '.garagiste', 'team.json'), JSON.stringify(team, null, 2)); // verify는 worktree의 것을, redproof(메인에서 부름)는 메인의 것을 읽는다
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  // 사고 53(홀드아웃 Go): go test는 한 디렉터리의 파일만 받는다 — {files}는 디렉터리마다 한 번
  assert.deepEqual(lastLog().match(/^\$ .*→ exit \d+$/gm), ['$ node --test tests/acceptance/add-entry.test.mjs → exit 0', '$ node --test tests/adversary/add-entry-1.test.mjs tests/adversary/add-entry-2.test.mjs → exit 0'], '{files} 러너는 전부 green이면 디렉터리마다 한 번');
  write(wt, 'tests/adversary/add-entry-1.test.mjs', "import test from 'node:test'; test('공격', () => { throw new Error('red'); });\n");
  assert.match(script('verify', ['full'], wt).out, /^FAIL verify:full [\s\S]*red 1\/3: tests\/adversary\/add-entry-1\.test\.mjs$/m, 'red면 그 디렉터리의 파일을 하나씩 다시 돌려 그 파일을 말한다');
  assert.match(script('redproof', ['add-entry'], repo).out, /^FAIL redproof add-entry: base에서 green/, 'redproof의 파일 단위 실행도 {files}에 파일 하나를 넣는다');
  write(wt, 'tests/adversary/add-entry-1.test.mjs', "import test from 'node:test'; test('공격', () => {});\n");
  team.commands.test_file = `node -e "process.exit(new Set(process.argv.slice(1).map((f) => f.split('/').slice(0, -1).join('/'))).size > 1 ? 1 : 0)" {files}`; // go test의 꼴: 여러 디렉터리면 러너가 거부
  fs.writeFileSync(path.join(wt, '.garagiste', 'team.json'), JSON.stringify(team, null, 2));
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/, '홀드아웃: 두 디렉터리를 한 번에 넘기자 러너가 거부해 「함께 red」 거짓 FAIL이 났다');
  team.commands.test_file = 'node -e "process.exit(process.argv.length > 2 ? 1 : 0)" {files}'; // 함께면 exit≠0, 하나씩은 green — 러너의 제약인지 간섭인지 exit로는 모른다
  fs.writeFileSync(path.join(wt, '.garagiste', 'team.json'), JSON.stringify(team, null, 2));
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/, '판정은 파일 단위(사고 44의 계약) — 한 번에는 빠른 길일 뿐');
  assert.match(lastLog(), /^\$ node -e .* tests\/adversary\/add-entry-1\.test\.mjs tests\/adversary\/add-entry-2\.test\.mjs → exit 1$/m, '빠른 길의 실패는 로그에 남는다');
});

test('사고 57(벤치 070f185 파이썬): test_file이 하이픈 이름 파일을 0건 실행·exit 0으로 넘긴다 — redproof는 「이미 충족」 대신 눈먼 명령을 말하고, 그 안내대로 연 scaffold unit은 깨진 탐침이 red여야 출하된다', { timeout: 180000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-blind-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  // 벤치의 run.py 꼴: 받은 파일을 모듈 이름으로 찾는 하네스 — 모듈 이름이 될 수 없는 하이픈 이름은 0건 실행·exit 0
  write(repo, 'tests/harness/run.cjs', "const { spawnSync } = require('child_process'); const path = require('path');\nconst files = process.argv.slice(2).filter((f) => !path.basename(f).includes('-'));\nprocess.exit(files.length ? spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' }).status : 0);\n");
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/unit/**/*.test.mjs"', test_file: 'node tests/harness/run.cjs {file}', run: 'true' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo); script('verify', ['quick'], repo);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  script('work', ['add', 'add-entry', '지출을 기록한다', '--milestone', 'M1'], repo);
  script('work', ['scope', '--milestone', 'M1'], repo);
  assert.match(script('work', ['seed'], repo).out, /^UNIT add-entry spec/);
  const wt = path.join(repo, '.worktrees', 'add-entry');
  const red = "import test from 'node:test'; import fs from 'node:fs'; test('기록', () => { if (!fs.existsSync('src/add.mjs')) throw new Error('red'); });\n";
  write(wt, 'tests/acceptance/add-entry.test.mjs', red);
  const r1 = script('redproof', ['add-entry'], repo);
  assert.match(r1.out, /^FAIL redproof add-entry: test_file이 이 파일을 실제로 돌리지 않는다 — tests\/acceptance\/add-entry\.test\.mjs/, '벤치의 줄은 「base에서 green — 이미 충족」(drop --forget)이었다: ' + r1.out);
  const lastRp = () => fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8').trim().split('\n').map(JSON.parse).filter((e) => e.kind === 'redproof').pop();
  assert.deepEqual(lastRp().blind, ['tests/acceptance/add-entry.test.mjs'], '원장에 눈먼 파일이 남는다');
  assert.equal(fs.readFileSync(path.join(wt, 'tests/acceptance/add-entry.test.mjs'), 'utf8'), red, '탐침은 unit의 작업 트리를 건드리지 않는다 — 버릴 checkout에서');
  write(wt, 'src/other.mjs', 'export const other = 1;\n'); // 제품 코드가 생긴 뒤 — base worktree에서 돈다
  git(['add', '-A'], wt); assert.equal(git(['commit', '-q', '-m', 'wip: other'], wt, { GARAGISTE_WIP: '1' }).status, 0);
  assert.match(script('redproof', ['add-entry'], repo).out, /^FAIL redproof add-entry: test_file이 이 파일을 실제로 돌리지 않는다/, 'base worktree에서도 같은 진단');
  // 안내대로: 하네스를 고치는 scaffold unit이 먼저, 원래 unit은 그 뒤에 새로 열린다
  assert.match(script('work', ['drop', 'add-entry', '하네스 먼저'], repo).out, /^DROPPED add-entry[\s\S]*BACKLOG 줄은 열려 있어/);
  assert.match(script('work', ['add', 'add-entry-harness', 'test_file이 하이픈 이름 파일을 돌리지 않는다 — 받은 경로의 파일을 그대로', '--kind', 'scaffold', '--milestone', 'M1'], repo).out, /^ADD add-entry-harness M1/);
  assert.match(script('work', ['needs', 'add-entry', 'add-entry-harness'], repo).out, /^NEEDS add-entry - → add-entry-harness/);
  assert.match(script('work', ['scope', '--milestone', 'M1'], repo).out, /순서: add-entry-harness → add-entry/);
  assert.match(script('work', ['seed'], repo).out, /^UNIT add-entry-harness boot/);
  const hw = path.join(repo, '.worktrees', 'add-entry-harness');
  assert.match(script('verify', ['full'], hw).out, /^PASS verify:full/);
  const s1 = script('ship', ['add-entry-harness'], repo);
  assert.match(s1.out, /^FAIL ship add-entry-harness 1\/8\n- redproof: test_file이 인수·공격 자리의 하이픈 이름 파일을 돌리지 않는다[\s\S]*tests\/acceptance\/garagiste-probe-smoke\.test\.mjs/, '하네스를 안 고친 scaffold는 출하되지 않는다: ' + s1.out);
  const bp = script('brief', ['boot', 'add-entry-harness'], repo);
  assert.match(fs.readFileSync(path.join(repo, bp.out.split(' ')[1]), 'utf8'), /## ship의 탐침[^\n]*\n- tests\/acceptance\/garagiste-probe-smoke\.test\.mjs/, 'boot 팩이 그 목록을 받는다');
  write(hw, 'tests/harness/run.cjs', "const { spawnSync } = require('child_process');\nprocess.exit(spawnSync(process.execPath, ['--test', ...process.argv.slice(2)], { stdio: 'inherit' }).status ?? 1);\n");
  assert.match(script('verify', ['quick'], hw).out, /^PASS verify:quick/);
  git(['add', '-A'], hw); assert.equal(git(['commit', '-q', '-m', 'scaffold(harness): 받은 파일을 그대로 돌린다\n\nUnit: add-entry-harness\nStep: 1'], hw).status, 0);
  assert.match(script('verify', ['full'], hw).out, /^PASS verify:full/);
  const s2 = script('ship', ['add-entry-harness'], repo);
  assert.match(s2.out, /^SHIPPED add-entry-harness/, s2.out);
  assert.equal(git(['worktree', 'list', '--porcelain'], repo).out.match(/garagiste-scratch/g), null, '버릴 checkout은 남지 않는다');
  assert.match(script('work', ['seed'], repo).out, /^UNIT add-entry spec/, '원래 unit이 새로 열린다');
  write(wt, 'tests/acceptance/add-entry.test.mjs', red);
  assert.match(script('redproof', ['add-entry'], repo).out, /^RED add-entry 1\/1/, '고친 하네스에선 red가 진짜다');
});
test('사고 45·46(필드 벤치 넷): tried fail은 CEO의 말을 -fix의 원문으로 받고, -fix는 지금 범위의 맨 앞에 든다', { timeout: 60000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-tried-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'README.md', '# p\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  script('work', ['add', 'ledger-add', '지출을 기록한다', '--milestone', 'M1'], repo);
  script('work', ['add', 'ledger-month', '달 합계를 본다', '--milestone', 'M1'], repo);
  assert.match(script('work', ['scope', '--milestone', 'M1'], repo).out, /순서: ledger-add → ledger-month/);
  assert.match(script('work', ['seed'], repo).out, /^UNIT ledger-add spec/);
  const unitPath = path.join(repo, '.garagiste/units/ledger-add.json');
  fs.writeFileSync(unitPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(unitPath, 'utf8')), state: 'shipped' }, null, 2)); // 출하는 ship의 일 — 여기선 상태만
  const backlog = () => fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8');
  // 사고 45: conductor가 note 없이 남기자 -fix의 원문이 「써봤는데 실패」뿐이라 spec이 재현을 CEO에게 되물었다
  assert.match(script('work', ['tried', 'ledger-add', 'fail'], repo).out, /^FAIL tried ledger-add fail에는 CEO의 말이 있어야 한다[\s\S]*work\.mjs tried ledger-add fail "<CEO 말 그대로>"/);
  assert.ok(!backlog().includes('ledger-add-fix'), '말 없는 fail은 아무것도 남기지 않는다');
  assert.match(script('work', ['tried', 'ledger-add', 'fail', '없는 날짜 2026-02-30이 오류 없이 기록된다'], repo).out, /^PASS tried ledger-add fail · ledger-add-fix/);
  assert.match(backlog(), /- \[ \] ledger-add-fix · M1 · needs: - · "없는 날짜 2026-02-30이 오류 없이 기록된다"/, 'CEO의 말이 -fix의 원문(재현)이다');
  // 사고 46: scope는 slug 목록이라 -fix가 범위 밖에 남아 SCOPE DONE 뒤 CEO가 다시 범위를 줘야 했다(앞 회차엔 conductor가 work.mjs new로 우회 — 버그 unit 중복)
  assert.match(script('work', ['seed'], repo).out, /^UNIT ledger-add-fix spec/, '고칠 것이 새 기능보다 먼저 열린다');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"scope_fix","slug":"ledger-add-fix","from":"ledger-add"/);
});

test('팩 상한 이유-차선(측정 H3 · CEO 채용): 상한~2배는 --large "<이유>"로 원장에 남기고 지나가고, 2배를 넘으면 CEO 결정 — 그 unit만 세운다', { timeout: 60000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-lane-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'README.md', '# p\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  script('work', ['add', 'loan-return', '반납하면 연체일만큼 대출을 막는다', '--milestone', 'M1'], repo);
  script('work', ['scope', '--milestone', 'M1'], repo);
  assert.match(script('work', ['seed'], repo).out, /^UNIT loan-return spec/);
  // 넘는 것은 법(인수 테스트)이다 — 홀드아웃 library의 loan-return은 공격이 결함마다 자라 build 팩이 34·48KB였고, 그때마다 CEO 결정 ①이었다(L2 2·5일차 정지)
  const acc = (kb) => write(path.join(repo, '.worktrees', 'loan-return'), 'tests/acceptance/loan-return.test.mjs', '// claim: an overdue return blocks new loans for as many days -- boundary\n'.repeat(Math.ceil((kb * 1024) / 72)));
  const packs = () => fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((e) => e.kind === 'pack' && e.slug === 'loan-return');
  acc(36);
  // 사고 68(L2 6판 세 라운드 — 상한 FAIL 7/7이 전부 테스트 몫): 인수·공격 테스트 몫의 초과는 이유를 묻지 않는다 — 자동 이유로 차선(원장 large에 「자동: …」)
  const auto = script('brief', ['build', 'loan-return'], repo).out;
  assert.match(auto, /^PACK \S+ [\d.]+KB [^\n]* · 이유-차선\(상한 32KB\): 자동: 인수 테스트 3[5-8]\.\dKB \+ 공격 테스트 0\.0KB — 그 밖 [\d.]+KB ≤ 32KB$/m, auto);
  assert.match(packs().at(-1).large, /^자동: 인수 테스트/); assert.equal(packs().at(-1).cap_kb, 32);
  // 산문 몫(spike 측정 파일)의 초과는 그대로 이유를 묻는다 — 상한~2배는 --large 한 줄, CEO가 아니다
  acc(1);
  const spikeFile = path.join(repo, '.worktrees', 'loan-return', 'docs/measurements/spike-loan-return.md');
  write(path.join(repo, '.worktrees', 'loan-return'), 'docs/measurements/spike-loan-return.md', '| 측정 | 값 | 연체 경계가 줄마다 실렸다 |\n'.repeat(Math.ceil((36 * 1024) / 56)));
  const band = script('brief', ['build', 'loan-return'], repo).out;
  assert.match(band, /^FAIL 팩 \d+KB > 32KB\n- 절별: [^\n]*spike/);
  assert.match(band, /2배\(64KB\) 안이다 — CEO 결정이 아니다[\s\S]*node \.garagiste\/scripts\/brief\.mjs build loan-return --large "/, '같은 명령에 이유 한 줄');
  assert.doesNotMatch(band, /CEO 결정 ①|--hold/, '차선은 CEO 질문이 아니다');
  assert.match(script('brief', ['build', 'loan-return', '--large'], repo).out, /^FAIL --large에는 이유 한 줄/);
  assert.equal(packs().length, 1, 'FAIL은 팩도 원장 줄도 남기지 않는다(자동 차선의 팩 하나만)');
  assert.match(script('brief', ['build', 'loan-return', '--large', '측정 36KB — 연체 경계가 줄마다 실렸다'], repo).out, /^PACK \S+ [\d.]+KB [^\n]* · 이유-차선\(상한 32KB\): 측정 36KB — 연체 경계가 줄마다 실렸다$/m);
  const lane = packs().at(-1);
  assert.equal(lane.large, '측정 36KB — 연체 경계가 줄마다 실렸다'); assert.equal(lane.cap_kb, 32);
  assert.ok(lane.bytes > 32 * 1024 && lane.bytes <= 64 * 1024, `원장의 크기는 차선 안 — ${lane.bytes}`);
  acc(70); // 테스트 몫이라도 2배 벽은 자동으로 넘지 않는다 — CEO 결정
  const wall = script('brief', ['build', 'loan-return', '--large', '인수가 더 자랐다'], repo).out;
  assert.match(wall, /^FAIL 팩 \d+KB > 32KB의 2배\(64KB\) — 이유로는 넘지 못한다/);
  assert.match(wall, /CEO 결정 ①[\s\S]*CEO 결정 ②[\s\S]*work\.mjs ask loan-return "[^"]*" --hold/, '벽은 CEO 결정 — 그 unit만 세운다(사고 59)');
  fs.rmSync(spikeFile); acc(1);
  assert.match(script('brief', ['build', 'loan-return', '--large', '습관'], repo).out, /^PACK [^\n]*--large 불필요/);
  assert.equal(packs().at(-1).large, undefined, '상한 안이면 원장에 이유를 남기지 않는다');
});
test('try 사본(L2 1일차 eoren.sqlite · 필드 벤치 웹 data/memos.json ×3): CEO의 try는 버릴 checkout에서 — 산출물이 main에 닿지 않고 tried가 사본을 지운다', { timeout: 60000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-try-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "memo", "private": true }\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  assert.equal(git(['status', '--porcelain'], repo).out.trim(), '', '사고 70: 기존 저장소가 깨끗했으니 설치가 팀 파일을 커밋했다');
  fs.mkdirSync(path.join(repo, 'node_modules', 'dep'), { recursive: true }); // main에 깔린 의존성
  script('work', ['new', 'save', '저장하면 목록 맨 위에'], repo);
  script('work', ['new', 'delete', '메모 옆 삭제'], repo);
  const unitPath = path.join(repo, '.garagiste/units/save.json');
  fs.writeFileSync(unitPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(unitPath, 'utf8')), state: 'shipped', shipped: '2026-10-01' }, null, 2)); // 출하는 ship의 일 — 여기선 상태만
  assert.match(run(process.execPath, [path.join(repo, '.garagiste', 'scripts', 'work.mjs'), 'try', 'save'], path.join(repo, '.worktrees', 'save')).out, /^FAIL try는 메인 저장소에서만/);
  assert.match(script('work', ['try', 'delete'], repo).out, /^FAIL delete 아직 출하 전/);
  const tr = script('work', ['try', 'save'], repo);
  assert.match(tr.out, /^TRY save → \.worktrees\/try-save \(main [0-9a-f]{7}\)[\s\S]*work\.mjs tried save ok\|fail/, tr.out);
  const lastLedger = () => JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8').trim().split('\n').at(-1));
  assert.deepEqual([lastLedger().kind, lastLedger().slug, /^[0-9a-f]{7}$/.test(lastLedger().head)], ['try', 'save', true], '사본 열기는 원장 try 줄 — CEO-분 카드 시간(try → tried)의 시작점(L2-TRIAL-5 「CEO-분」)');
  const copy = path.join(repo, '.worktrees', 'try-save');
  assert.ok(fs.existsSync(path.join(copy, 'package.json')) && fs.existsSync(path.join(copy, 'node_modules', 'dep')), '사본은 main 현재 커밋 + main의 의존성 링크');
  write(copy, 'data/memos.json', '[{"text":"장보기"}]'); // CEO가 카드대로 npm start → 저장
  assert.equal(git(['status', '--porcelain', '--', 'data'], repo).out.trim(), '', 'try 산출물은 main에 닿지 않는다 — 다음 ship이 「CEO가 치운다」로 막히지 않는다');
  script('state', [], repo);
  assert.match(fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8'), /- \*\*save\*\*[\s\S]*work\.mjs try save/, 'STATUS의 카드가 사본 명령을 준다');
  assert.match(script('work', ['try', 'save'], repo).out, /^TRY save/);
  assert.ok(!fs.existsSync(path.join(copy, 'data/memos.json')), '다시 열면 새 사본(main 현재 커밋)');
  write(copy, 'data/memos.json', '[]');
  assert.match(script('work', ['tried', 'save', 'ok'], repo).out, /^PASS tried save ok · try 사본을 지웠다/);
  assert.ok(!fs.existsSync(copy) && !git(['worktree', 'list'], repo).out.includes('try-save'), 'tried가 사본을 지운다');
  assert.ok(fs.existsSync(path.join(repo, 'node_modules', 'dep')), '링크만 지운다 — main의 의존성은 그대로');
});

test('사고 54(홀드아웃 Go): verify quick은 go test의 낡은 캐시 ok를 증거로 받지 않는다 — 테스트가 부른 프로세스가 읽는 파일은 캐시가 모른다', { timeout: 180000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  if (spawnSync('go', ['version'], { encoding: 'utf8' }).status !== 0) return t.skip('go 없음 — Go 생태계 재현');
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-gocache-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'go.mod', 'module x\n\ngo 1.21\n');
  // 필드 3의 꼴: 스모크가 `go run ../../src`를 부른다 — 진입점(src)이 바뀌어도 테스트 바이너리는 같아 캐시가 ok를 돌려줬다
  write(repo, 'tests/unit/run_test.go', 'package unit\nimport ("os/exec"; "testing")\nfunc TestEntrypoint(t *testing.T) { if err := exec.Command("sh", "-c", "exit $(cat ../../state)").Run(); err != nil { t.Fatal(err) } }\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'go test ./tests/unit/...', full: 'go test ./tests/...', test_file: 'go test {files}', run: 'true' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  write(repo, 'state', '0');
  assert.match(script('verify', ['quick'], repo).out, /^PASS verify:quick/);
  write(repo, 'state', '1'); // 진입점의 동작이 바뀌었다(find-dups: 인자 없으면 exit 2)
  assert.match(script('verify', ['quick'], repo).out, /^FAIL verify:quick/, 'go test가 「ok (cached)」를 내고 PASS — find-dups가 main quick이 빨간 채 출하됐다');
});

test('사고 49~52(홀드아웃 — Go CLI): --로 시작하는 원문 · BACKLOG 줄 정정 · --help 탐침 · spawned의 팩 경로 — intake가 막다른 길에 서지 않는다', { timeout: 60000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-holdout-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'README.md', '# p\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const read = (rel) => (fs.existsSync(path.join(repo, rel)) ? fs.readFileSync(path.join(repo, rel), 'utf8') : '');
  const oneLine = (r) => assert.ok(!/\n\s+at /.test(r.out), `스택 없이 한 줄: ${r.out}`);
  // 사고 51: conductor의 탐침 `brief --help`가 「--help」를 CEO 원문에 쌓았다(팀은 BRIEF를 못 지운다 — CEO가 치웠다)
  assert.match(script('work', ['brief', '--help'], repo).out, /^사용법: work\.mjs/);
  assert.ok(!read('docs/BRIEF.md').includes('--help'), '탐침은 원문이 아니다');
  assert.match(script('work', ['drop', '--help'], repo).out, /^사용법: work\.mjs/, '어느 명령이든 --help는 부작용 없이 사용법');
  assert.match(script('work', ['brief', '--json이면 같은 결과를 JSON으로 낸다.'], repo).out, /^BRIEF \+1줄/, 'CEO의 말은 --로 시작해도 원문이다');
  // 사고 49: --로 시작하는 원문이 플래그로 먹혀 원문 「M1」·마일스톤 M?가 됐다
  assert.match(script('work', ['add', 'min-size', '--min-size 1M처럼 이보다 작은 파일은 건너뛸 수 있다(단위 K·M·G).', '--milestone', 'M1'], repo).out, /^ADD min-size M1/);
  assert.match(read('docs/BACKLOG.md'), /- \[ \] min-size · M1 · needs: - · "--min-size 1M처럼 이보다 작은 파일은/);
  const typo = script('work', ['add', 'typo', '원문 한 문장', '--milestne', 'M1'], repo);
  assert.match(typo.out, /^FAIL 알 수 없는 플래그 --milestne — add가 받는 것: --milestone --needs --accept --kind --replace/, typo.out);
  assert.match(script('work', ['ask', 'intake', '--json 출력 형태를 groups·warnings로 정해도 되나?', '--for', 'min-size'], repo).out, /^Q1 queued/);
  assert.match(read('docs/DECISIONS.md'), /Q1 \(intake\): --json 출력 형태를 groups·warnings로/);
  // 사고 50: 깨진 BACKLOG 줄을 고칠 길이 없었다 — add는 중복 거부, drop은 unit을 요구하며 예외(스택)로 죽었다
  script('work', ['add', 'json-out', 'M1'], repo); // 홀드아웃에서 남은 꼴: 원문 「M1」, 마일스톤 M?
  const dup = script('work', ['add', 'json-out', '--json이면 같은 결과를 JSON으로 낸다.', '--milestone', 'M1'], repo);
  assert.match(dup.out, /^FAIL BACKLOG에 있음: json-out — 고치려면 같은 명령에 --replace[\s\S]*지우려면 work\.mjs drop json-out "<사유>" --forget/, dup.out);
  assert.match(script('work', ['add', 'json-out', '--json이면 같은 결과를 JSON으로 낸다.', '--milestone', 'M1', '--needs', 'min-size', '--replace'], repo).out, /^REPLACE json-out M1 needs=min-size/);
  assert.equal((read('docs/BACKLOG.md').match(/ json-out · /g) || []).length, 1, '줄은 제자리에서 바뀐다');
  assert.match(read('docs/BACKLOG.md'), /- \[ \] json-out · M1 · needs: min-size · "--json이면 같은 결과를 JSON으로 낸다\."/);
  assert.match(read('.garagiste/ledger/evidence.jsonl'), /"kind":"backlog_replace","slug":"json-out","from":"- \[ \] json-out · M\? · needs: - · \\"M1\\"/);
  assert.match(script('work', ['add', 'nosuch', '원문', '--replace'], repo).out, /^FAIL --replace는 BACKLOG에 있는 줄만: nosuch/);
  const d0 = script('work', ['drop', 'json-out', '잘못 쓴 줄'], repo);
  assert.match(d0.out, /^FAIL json-out은 unit이 없는 BACKLOG 줄이다 — 닫으려면 --forget[\s\S]*고치려면 work\.mjs add json-out[\s\S]*--replace/, d0.out); oneLine(d0);
  assert.match(script('work', ['drop', 'json-out', '범위 밖', '--forget'], repo).out, /^DROPPED json-out — 범위 밖 · BACKLOG 줄 닫음/);
  assert.match(read('docs/BACKLOG.md'), /- \[x\] json-out · /);
  const none = script('work', ['drop', 'ghost', 'x', '--forget'], repo);
  assert.match(none.out, /^FAIL unit도 BACKLOG 줄도 없음: ghost/); oneLine(none);
  const crash = script('work', ['default', 'ghost', '정한 것'], repo);
  assert.match(crash.out, /^FAIL unit 없음: ghost/, '잡히지 않은 예외도 한 줄 FAIL'); oneLine(crash);
  assert.match(script('work', ['decide', '1', '예'], repo).out, /^PASS decide Q1/);
  assert.match(script('work', ['scope', 'min-size'], repo).out, /^SCOPE/);
  assert.match(script('work', ['seed'], repo).out, /^UNIT min-size spec/);
  assert.match(script('work', ['add', 'min-size', '다른 원문', '--replace'], repo).out, /^FAIL min-size은 unit이 열려 있다 — 진행 중 unit의 수용은 re-spec/, '열린 unit의 줄은 바꾸지 않는다');
  // 사고 52: <팩>에 팩 파일 경로를 넣고 같은 사용법을 두 번 받고 포기했다
  const sp = script('work', ['spawned', 'intake', '.garagiste/session/packs/intake-2026-10-01T11-30-50-078Z.md', '--tokens', '18594', '--minutes', '2'], repo);
  assert.match(sp.out, /^FAIL <팩>은 팩 이름\(intake·spec·build·attack·spike·boot·adopt\)이다 — 받은 값은 경로[\s\S]*→ node \.garagiste\/scripts\/work\.mjs spawned intake intake --tokens 18594 --minutes 2$/m, sp.out);
  assert.match(script('work', ['spawned', 'intake', 'intake', '--tokens', '18594', '--minutes', '2'], repo).out, /^SPAWN intake intake/);
});

test('사고 47(필드 벤치 넷): 일부 주장만 base green이면 redproof는 drop 대신 충족된 파일만 빼는 길을 주고, spec 팩이 그 목록과 CEO 말을 받는다', { timeout: 60000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-met-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'src/bom.mjs', 'export const bom = 1;\n'); // 먼저 출하된 broken-lines가 BOM 처리를 main에 넣었다
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'true', full: 'true', test_file: 'node --test {file}', run: 'true' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  git(['add', '-A'], repo);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' }).status, 0);
  script('work', ['new', 'jsonl-store', '손으로 고친 파일·CP949도 읽는다'], repo);
  const wt = path.join(repo, '.worktrees', 'jsonl-store');
  const claim = (mod) => `import test from 'node:test'; import fs from 'node:fs'; test('${mod}', () => { if (!fs.existsSync('src/${mod}.mjs')) throw new Error('red'); });\n`;
  write(wt, 'tests/acceptance/jsonl-store_handedit.test.mjs', claim('bom'));
  write(wt, 'tests/acceptance/jsonl-store_cp949.test.mjs', claim('cp949'));
  assert.match(script('brief', ['spec', 'jsonl-store', '--met', '예'], repo).out, /^FAIL --met는 redproof가 부분 충족을 낸 unit에만/, '부분 충족 증거 없이 주장을 빼지 않는다');
  const rp = script('redproof', ['jsonl-store'], repo);
  assert.match(rp.out, /^FAIL redproof jsonl-store: 부분 충족 — base에서 green tests\/acceptance\/jsonl-store_handedit\.test\.mjs · base에서 red tests\/acceptance\/jsonl-store_cp949\.test\.mjs[\s\S]*--met "<CEO 말 그대로>"/, rp.out);
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"redproof","slug":"jsonl-store"[^\n]*"base_green":\["tests\/acceptance\/jsonl-store_handedit\.test\.mjs"\]/);
  assert.match(script('brief', ['build', 'jsonl-store', '--met', '예'], repo).out, /^FAIL --met는 spec 팩에만/);
  const pk = script('brief', ['spec', 'jsonl-store', '--met', '예 — 손편집·BOM은 이미 main에 있다, CP949는 남긴다'], repo);
  assert.match(pk.out, /^PACK /, pk.out);
  const text = fs.readFileSync(path.join(repo, pk.out.split(' ')[1]), 'utf8');
  assert.match(text, /## 이미 충족 — CEO가 빼라고 한 주장[\s\S]*CEO 결정\(그대로\): 예 — 손편집·BOM은 이미 main에 있다[\s\S]*- tests\/acceptance\/jsonl-store_handedit\.test\.mjs[\s\S]*남은 주장[\s\S]*redproof\.mjs jsonl-store/);
  assert.match(text, /- test_file: `[^`]*\{file\}` — 증명은 파일 하나씩[^\n]*혼자 돈다[^\n]*다른 테스트 파일의 도우미에 기대지 않는다/, '사고 56(홀드아웃 Go): sort-waste의 인수 파일이 find-dups_test.go의 도우미를 써 혼자 컴파일되지 않았다 — 증명은 파일 하나씩');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"claims_met","slug":"jsonl-store","files":\["tests\/acceptance\/jsonl-store_handedit\.test\.mjs"\]/);
  // 팩이 할 일을 테스트가 대신한다: 충족된 파일만 빼면 남은 주장으로 RED
  fs.rmSync(path.join(wt, 'tests/acceptance/jsonl-store_handedit.test.mjs'));
  assert.match(script('redproof', ['jsonl-store'], repo).out, /^RED jsonl-store 1\/1/);
});

test('사고 38·39(필드 벤치): main의 setup·quick이 남긴 산출물은 반쪽 출하 대신 되돌림·보존·unit 안내, unit이 무시 줄(.gitignore)을 더하면 spike FAIL이 다음 명령을 준다', { timeout: 180000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-stray-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'requirements-dev.txt', 'a\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  // pip install -e . · npm install의 꼴: 설치가 저장소 안에 메타데이터 디렉터리와 잠금 파일을 남긴다
  write(repo, 'tools/setup.mjs', "import fs from 'node:fs'; fs.mkdirSync('meta.egg-info', { recursive: true }); fs.writeFileSync('meta.egg-info/PKG-INFO', 'x'); fs.writeFileSync('deps.lock', '{}\\n');\n");
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/**/*.test.mjs"', test_file: 'node --test {file}', run: 'true', setup: 'node tools/setup.mjs' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo); script('verify', ['quick'], repo);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  script('work', ['new', 'dep', '개발 의존성 b를 더한다'], repo);
  const wt = path.join(repo, '.worktrees', 'dep');
  const evidence = () => { assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/); assert.match(script('redproof', ['dep'], wt).out, /^PASS redproof/); assert.match(script('verify', ['attack', 'dep'], wt).out, /red 0\/1/); };
  write(wt, 'tests/acceptance/dep.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';\ntest('b가 개발 의존성', () => { assert.match(fs.readFileSync('requirements-dev.txt', 'utf8'), /^b$/m); });\n");
  assert.match(script('redproof', ['dep'], wt).out, /^RED dep/);
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'test(dep): red'], wt).status, 0);
  write(wt, 'requirements-dev.txt', 'a\nb\n');
  write(wt, 'tests/adversary/dep-1.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';\ntest('줄 끝 개행', () => { assert.ok(fs.readFileSync('requirements-dev.txt', 'utf8').endsWith('\\n')); });\n");
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'feat(dep): b\n\nUnit: dep\nStep: 1'], wt).status, 0);
  evidence();
  const prevHead = git(['rev-parse', 'main'], repo).out.trim();
  // 필드 벤치: 문서 커밋이 게이트(인덱스 ≠ 작업 트리)에 막혀 머지·shipped·ship 줄만 남고 문서는 스테이지 채, worktree 잔류 — 재ship은 「이미 출하」
  const s1 = script('ship', ['dep'], repo);
  assert.match(s1.out, /^FAIL ship: main에서 돈 setup·quick이 저장소에 파일을 남겼다 — deps\.lock meta\.egg-info\/ — 머지를 되돌리고/, s1.out);
  assert.match(s1.out, /\.garagiste\/session\/ship-stray\/dep-[^ ]*\/로 옮겼다[\s\S]*CEO 몫이 아니다[\s\S]*brief\.mjs build dep/, s1.out);
  assert.equal(git(['rev-parse', 'main'], repo).out.trim(), prevHead, 'main이 머지 전으로 돌아온다 — 반쪽 출하 없음');
  assert.notEqual(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/dep.json'), 'utf8')).state, 'shipped');
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[ \] dep · /);
  assert.equal(git(['status', '--porcelain', '-uall'], repo).out.split('\n').filter((l) => l && !/ docs\//.test(l)).join('\n'), '', '남은 것은 CEO 문서뿐 — 다음 ship이 「CEO가 치운다」로 막히지 않는다(오귀속)');
  const moved = fs.readdirSync(path.join(repo, '.garagiste/session/ship-stray'));
  assert.ok(fs.existsSync(path.join(repo, '.garagiste/session/ship-stray', moved[0], 'meta.egg-info/PKG-INFO')), '지우지 않고 옮겼다');
  assert.ok(fs.existsSync(wt), 'worktree는 그대로 — unit이 고친다');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"ship_rollback","slug":"dep".*"stray":\["deps\.lock","meta\.egg-info\/"\]/);
  assert.doesNotMatch(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"ship","slug":"dep"/, '유령 출하 줄이 없다');
  const bp = fs.readFileSync(path.join(repo, script('brief', ['build', 'dep'], repo).out.split(' ')[1]), 'utf8');
  assert.match(bp, /## ship이 되돌렸다 — main에서 setup·quick이 남긴 파일[\s\S]*- deps\.lock\n- meta\.egg-info\//, 'build 팩이 그 목록을 할 일로 받는다');
  // unit의 일: 산출물은 무시 줄로 — .gitignore는 boundary 파일이다
  fs.appendFileSync(path.join(wt, '.gitignore'), 'meta.egg-info/\ndeps.lock\n');
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'chore(dep): 설치 산출물 무시'], wt).status, 0);
  evidence();
  // 사고 39(필드 벤치 1): spike 미완 FAIL에 다음 할 일이 없어 conductor가 멈췄다
  const s2 = script('ship', ['dep'], repo);
  assert.match(s2.out, /- spike: boundary HIT\(file \.gitignore\)인데 .*→ node \.garagiste\/scripts\/brief\.mjs spike dep → 팩 spawn/, s2.out);
  assert.match(script('brief', ['spike', 'dep'], repo).out, /^PACK .*dep-spike-/, '안내대로 spike 팩이 열린다');
  write(wt, 'docs/measurements/spike-dep.md', '- wire: 없음\n- host: 없음\n- license: 없음\n- default: 설치 산출물은 무시\n- os: 없음\n');
  assert.match(script('ship', ['dep'], repo).out, /- full: 이 tree.*verify\.mjs full/, 'ship이 측정 파일을 커밋한다 — 낡은 증거는 문구의 명령대로');
  evidence();
  const s4 = script('ship', ['dep'], repo);
  assert.match(s4.out, /^SHIPPED dep/, s4.out);
  assert.equal(git(['status', '--porcelain', '-uall'], repo).out.trim(), '', 'main은 깨끗하다 — 설치 산출물은 무시된 채 그 자리에');
  assert.ok(fs.existsSync(path.join(repo, 'meta.egg-info/PKG-INFO')), 'setup은 main에서 돌았다');
});

test('사고 26(L2 1일차): 두 unit이 같은 파일을 고치면 ship은 rebase를 멈춘 자리에 두고, build가 표시를 풀면 ship이 잇는다', { timeout: 180000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-conflict-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/**/*.test.mjs"', test_file: 'node --test {file}', run: 'true' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo); script('verify', ['quick'], repo);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  // 두 unit을 같은 main에서 연다 — 둘 다 src/shared.mjs를 만든다(L2의 effect-conflict × record-layer의 cli.ts와 같은 꼴)
  const open = (slug) => {
    assert.match(script('work', ['new', slug, `${slug} 표시를 남긴다`], repo).out, new RegExp(`^UNIT ${slug} spec`));
    const wt = path.join(repo, '.worktrees', slug);
    write(wt, `tests/acceptance/${slug}.test.mjs`, `import test from 'node:test'; import fs from 'node:fs';\ntest('${slug} 표시', () => { if (!fs.readFileSync('src/shared.mjs', 'utf8').includes('${slug}')) throw new Error('red'); });\n`);
    git(['add', '-A'], wt); script('verify', ['quick'], wt);
    assert.equal(git(['commit', '-q', '-m', `test(${slug}): red`], wt).status, 0);
    return wt;
  };
  const build = (slug, wt) => {
    write(wt, 'src/shared.mjs', `export const mark = '${slug}';\n`);
    write(wt, `tests/adversary/${slug}-1.test.mjs`, "import test from 'node:test'; import fs from 'node:fs';\ntest('비어 있지 않다', () => { if (!fs.readFileSync('src/shared.mjs', 'utf8').trim()) throw new Error('empty'); });\n");
    git(['add', '-A'], wt); script('verify', ['quick'], wt);
    assert.equal(git(['commit', '-q', '-m', `feat(${slug}): 표시\n\nUnit: ${slug}\nStep: 1`], wt).status, 0);
    assert.match(script('redproof', [slug], wt).out, /^PASS redproof/);
    assert.match(script('verify', ['attack', slug], wt).out, /red 0\/1/);
    assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  };
  const awt = open('alpha'); const bwt = open('beta');
  build('alpha', awt); build('beta', bwt);
  assert.match(script('ship', ['alpha'], repo).out, /^SHIPPED alpha/);
  // 옛 ship은 rebase를 버리고 「build를 다시 띄워 main 위에서 해결」이라 했다 — build는 rebase·merge가 가드에 막혀 풀 길이 없었다
  const s1 = script('ship', ['beta'], repo);
  assert.match(s1.out, /^FAIL ship: main과 충돌 — src\/shared\.mjs\. rebase를 그 자리에 멈춰 두었다/, s1.out);
  assert.match(fs.readFileSync(path.join(bwt, 'src/shared.mjs'), 'utf8'), /^<<<<<<< /m, '충돌 표시가 worktree에 있다 — 푸는 일은 파일 편집(build의 경계 안)이다');
  assert.match(script('ship', ['beta'], repo).out, /^FAIL ship: main과의 충돌이 아직 남았다 — src\/shared\.mjs/, '안 풀고 다시 부르면 남은 파일을 말한다');
  // 사고 58(홀드아웃 library 6일차): rebase 도중엔 HEAD가 main(onto)이라 base = head — redproof는 비교하지 않고 할 일(표시 풀기 → ship이 잇기)을 말한다
  assert.match(script('redproof', ['beta'], repo).out, /^FAIL redproof beta: beta은 rebase 도중 — main과의 충돌 표시가 남았다\(src\/shared\.mjs\)[\s\S]*brief\.mjs build beta[\s\S]*ship\.mjs beta/);
  assert.match(fs.readFileSync(path.join(repo, script('brief', ['build', 'beta'], repo).out.split(' ')[1]), 'utf8'), /## main과의 충돌[\s\S]*src\/shared\.mjs[\s\S]*git add/, 'build 팩이 충돌 파일과 할 일을 받는다');
  // build가 하는 일: 양쪽을 살려 풀고 git add까지 — 커밋·rebase 없이
  write(bwt, 'src/shared.mjs', "export const mark = 'alpha';\nexport const mark2 = 'beta';\n");
  git(['add', 'src/shared.mjs'], bwt);
  // 사고 58: 표시를 다 푼 build가 rebase를 잇지 않은 채 spec: 반려를 남겼고(잇는 것은 ship), 그 자리에서 spec 팩·redproof가 돌아 거짓 「base에서 green — 이미 충족」
  assert.match(script('redproof', ['beta'], repo).out, /^FAIL redproof beta: beta은 rebase 도중 — 충돌 표시는 다 풀렸다[\s\S]*ship\.mjs beta/, 'base·head를 비교하지 않는다 — drop(이미 충족)의 길을 열지 않는다');
  assert.match(script('brief', ['spec', 'beta', '--return', 'spec: 충돌 tests/adversary/beta-1.test.mjs — main 위에서 어긋난다'], repo).out, /^FAIL spec 팩: beta은 rebase 도중 — 충돌 표시는 다 풀렸다[\s\S]*ship\.mjs beta/, '반려도 ship이 잇은 뒤에 — 잇고 나서 남은 일은 ship의 출력이 말한다');
  assert.match(script('brief', ['build', 'beta'], repo).out, /^FAIL build 팩: beta은 rebase 도중 — 충돌 표시는 다 풀렸다/, '풀 표시가 없으면 build도 할 일이 없다');
  assert.doesNotMatch(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"(spec_return|redproof)","slug":"beta"[^\n]*"base_red":false/, '막힌 자리는 반려·거짓 base green으로 원장에 남지 않는다');
  const s2 = script('ship', ['beta'], repo);
  assert.match(s2.out, /^SHIPPED beta/, s2.out);
  const shared = fs.readFileSync(path.join(repo, 'src/shared.mjs'), 'utf8');
  assert.ok(shared.includes('alpha') && shared.includes('beta'), 'main에 두 unit의 표시가 다 있다 — 통합 tree에서 두 인수가 다 green');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"ship_conflict","slug":"beta"/);
});

test('opencode 하네스: 같은 정본(.garagiste) 위에 opencode.json·agents·guard 플러그인이 깔리고 selftest(플러그인 거부 1건까지)·doctor가 OK', { timeout: 120000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-oc-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  const inst = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'opencode', '-Project', repo], repo);
  assert.equal(inst.status, 0, inst.out);
  assert.match(inst.out, /SELFTEST PASS/, 'opencode 환경에서 selftest(Q9)');
  const [maj, min] = process.versions.node.split('.').map(Number);
  assert.match(inst.out, maj > 22 || (maj === 22 && min >= 6) ? /PASS guard 플러그인\(opencode\)이 원장 쓰기를 거부/ : /SKIP guard 플러그인\(opencode\)/, 'L1 배선이 산다 — 설치 때 거부 1건');
  for (const f of ['opencode.json', 'AGENTS.md', '.opencode/plugins/guard.ts', '.opencode/agents/conductor.md', '.opencode/agents/build.md', '.garagiste/scripts/guard-rules.mjs', '.garagiste/team.json', '.githooks/pre-commit']) assert.ok(fs.existsSync(path.join(repo, f)), f);
  assert.ok(!fs.existsSync(path.join(repo, '.claude')), 'Claude 배선은 깔리지 않는다');
  const cfg = JSON.parse(fs.readFileSync(path.join(repo, 'opencode.json'), 'utf8'));
  assert.equal(cfg.default_agent, 'conductor');
  assert.match(fs.readFileSync(path.join(repo, '.opencode/agents/conductor.md'), 'utf8'), /mode: primary[\s\S]*edit: deny/);
  const teamPath = path.join(repo, '.garagiste', 'team.json'); const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/**/*.test.mjs"', test_file: 'node --test {file}', run: 'node src/cli.mjs' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  assert.match(script('doctor', [], repo).out, /^OK doctor \(opencode\)/);
});

test('빈 폴더 → install 한 줄 → 첫 커밋 자동 → boot unit이 스택·명령·스모크·규칙 파일을 채우고 ship — 사람이 채울 파일은 없다', { timeout: 120000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-boot-'));
  const inst = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low'], repo);
  assert.equal(inst.status, 0, inst.out);
  assert.match(inst.out, /git init/); assert.match(inst.out, /첫 커밋: 팀 파일/);
  assert.match(inst.out, /SELFTEST PASS/, 'R15: 설치는 install→doctor→selftest 원샷이고 빨간 채로 완료를 선언하지 않는다');
  assert.match(git(['log', '-1', '--format=%s'], repo).out, /^scaffold\(team\): GARAGISTE 증거 팀 설치/);
  assert.match(git(['ls-files', '-s', '.githooks/pre-commit'], repo).out, /^100755/, '훅의 실행 비트가 인덱스에 있다 — 없으면 맥·리눅스가 게이트를 무시한다');
  assert.match(script('doctor', [], repo).out, /commands.quick 비어 있음 → 첫 unit\(boot — 기존 코드가 있으면 adopt\)이 채운다/);
  // CEO는 말만 한다 — 이 아래는 conductor와 boot 팩의 일
  script('work', ['brief', '터미널 메모 도구. memo add로 남기고 memo list로 본다.'], repo);
  assert.match(script('work', ['add', 'boot', '터미널 메모 도구', '--milestone', 'M1', '--accept', '진입점이 뜨고 quick·full이 PASS', '--kind', 'scaffold'], repo).out, /^ADD boot M1 needs=- kind=scaffold/);
  script('work', ['add', 'memo-add', 'memo add로 남기고', '--milestone', 'M1', '--needs', 'boot'], repo);
  assert.match(script('work', ['scope', '--milestone', 'M1'], repo).out, /순서: boot → memo-add/);
  const touchPath = path.join(repo, '.garagiste/session/ceo-touch');
  const touchBefore = fs.readFileSync(touchPath, 'utf8');
  assert.match(script('work', ['seed'], repo).out, /^UNIT boot boot \.worktrees\/boot\nSCAFFOLD/);
  assert.equal(fs.readFileSync(touchPath, 'utf8'), touchBefore, 'R1: seed는 CEO 접점이 아니다 — 매 seed가 무인 출하 카운터를 리셋하면 상한이 영영 안 걸린다');
  const wt = path.join(repo, '.worktrees', 'boot');
  assert.equal(fs.readFileSync(path.join(wt, '.garagiste-pack'), 'utf8'), 'boot');
  assert.match(script('brief', ['spec', 'boot'], repo).out, /^FAIL scaffold unit/, 'scaffold엔 spec 팩이 없다');
  // 첫 실기 사고 회귀: BRIEF 부록(40줄 밖)과 닫힌 결정이 boot 팩에 들어간다 — 빠지면 확정 스택 대신 기본값이 깔린다
  script('work', ['brief', Array.from({ length: 40 }, (_, i) => `메모 규칙 ${i + 1}`).join('\n') + '\n\n## 부록 A — 스택\n부록-스택-마커'], repo);
  assert.match(script('work', ['ask', 'boot', '스택은 부록 A대로?'], repo).out, /^Q1 queued/);
  assert.match(script('work', ['decide', '1', '예 — 부록 A대로'], repo).out, /^PASS decide Q1/);
  const bp = script('brief', ['boot', 'boot'], repo);
  assert.match(bp.out, /^PACK .*boot-boot-.* model=haiku/, bp.out);
  const bpText = fs.readFileSync(path.join(repo, bp.out.split(' ')[1]), 'utf8');
  assert.match(bpText, /## 팩: boot[\s\S]*## 인수 한 줄[\s\S]*진입점이 뜨고/);
  assert.ok(bpText.includes('부록-스택-마커'), 'BRIEF는 전문 — 40줄 컷이 부록을 떨어뜨렸다(첫 실기 사고)');
  assert.ok(bpText.includes('## 결정된 것') && bpText.includes('예 — 부록 A대로'), '닫힌 결정이 boot 팩에 있다');
  // boot 팩이 할 일을 테스트가 대신한다
  write(wt, 'package.json', '{ "name": "memo", "type": "module", "private": true }\n');
  write(wt, '.node-version', '22\n');
  write(wt, 'src/cli.mjs', "process.stdout.write('memo 0.0.0\\n');\n");
  write(wt, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import { spawn, spawnSync } from 'node:child_process';\ntest('진입점이 뜬다', () => { assert.equal(spawnSync(process.execPath, ['src/cli.mjs'], { encoding: 'utf8' }).status, 0); });\n");
  assert.match(script('work', ['commands', 'quick=node --test "tests/unit/**/*.test.mjs"', 'full=node --test "tests/**/*.test.mjs"', 'test_file=node --test {file}', 'run=node src/cli.mjs', `setup=node -e "require('fs').writeFileSync('.garagiste/session/setup-ran','x')"`], wt).out, /^COMMANDS quick=/); // 마커는 gitignore된 session/ 안 — 실전의 setup 산출물(node_modules)처럼 main을 더럽히지 않는다
  assert.match(script('work', ['rules', 'project=memo', 'one_line=터미널 메모 도구'], wt).out, /^RULES CLAUDE\.md 자리 전부 채움/);
  assert.match(fs.readFileSync(path.join(wt, 'CLAUDE.md'), 'utf8'), /^# memo\n터미널 메모 도구\n[\s\S]*- quick: node --test/);
  // 사고 29(필드 시험 1): .gitignore 전의 wip 체크포인트가 테스트 산출물(__pycache__ 꼴)을 담고, 뒤 커밋이 그것을 무시 목록으로 뺀다 —
  // 파일은 worktree에 무시 파일로 남는다. 한 커밋씩 다시 놓는 rebase는 그 wip에서 「untracked would be overwritten」으로 멈췄다
  write(wt, 'cache/smoke.bin', 'artifact');
  git(['add', '-A'], wt);
  assert.equal(git(['commit', '-q', '-m', 'wip: boot checkpoint'], wt, { GARAGISTE_WIP: '1' }).status, 0);
  fs.appendFileSync(path.join(wt, '.gitignore'), 'cache/\n');
  git(['rm', '-r', '-q', '--cached', 'cache'], wt);
  git(['add', '-A'], wt);
  assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'scaffold(boot): node 22 · node:test\n\nUnit: boot\nStep: 1'], wt).status, 0);
  assert.ok(fs.existsSync(path.join(wt, 'cache/smoke.bin')), '산출물은 worktree에 무시 파일로 남는다');
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  // 사고 6 회귀: models는 규칙집(team.json·agents)을 바꾸면 스스로 커밋한다 — main에 커밋 경로 없는 dirt를 남겨 ship을 막지 않는다
  assert.match(script('work', ['models', 'high'], repo).out, /scaffold\(team\) 커밋/);
  assert.equal(git(['status', '--porcelain', '--', '.garagiste/team.json', '.claude/agents'], repo).out.trim(), '', 'models 뒤 main은 깨끗하다');
  assert.match(git(['log', '-1', '--format=%s'], repo).out, /^scaffold\(team\): models high/);
  assert.ok(!script('work', ['models', 'high'], repo).out.includes('커밋'), '변경 없으면 커밋도 없다');
  // 사고 7 회귀: main의 models 커밋 × boot의 commands 커밋 = team.json rebase 충돌 — ship이 키 병합으로 통과하고 통합 full까지 스스로 돌린다
  // 필드 시험 2: CEO의 try가 메인 루트에 남긴 산출물 — 출하를 막는 것은 맞지만 다음 할 일(누가 치우나)을 말해야 한다
  write(repo, 'data/try.json', '[]');
  assert.match(script('ship', ['boot'], repo).out, /^FAIL ship: 메인 worktree에 미커밋 변경 — data\/try\.json — 팀의 것이 아니다[\s\S]*CEO가 치운다/);
  fs.rmSync(path.join(repo, 'data'), { recursive: true });
  const ship = script('ship', ['boot'], repo);
  assert.match(ship.out, /^SHIPPED boot [0-9a-f]{7}/, ship.out);
  assert.equal(git(['ls-files', 'cache'], repo).out.trim(), '', '사고 29: 증거는 tree다 — unit의 역사는 그 tree 한 커밋으로 접혀 올라가고, 중간 wip의 산출물은 main에 오지 않는다');
  assert.ok(!/^wip:/m.test(git(['log', '--format=%s', '-5'], repo).out), 'main 역사에 wip 체크포인트가 없다');
  assert.match(ship.out, /NOTE: 의존성 파일이 바뀐 출하/, '사고 10: 매니페스트가 바뀐 출하는 메인 설치를 안내한다');
  assert.ok(fs.existsSync(path.join(repo, '.garagiste', 'session', 'setup-ran')), '사고 21: 의존성 출하는 main quick 전에 commands.setup이 main에서 돈다');
  const team = JSON.parse(fs.readFileSync(path.join(repo, '.garagiste', 'team.json'), 'utf8'));
  assert.match(team.commands.quick, /^node --test/);
  assert.equal(team.models.build, 'opus', '사고 7: main의 models와 boot의 commands가 함께 살아남는다');
  assert.match(fs.readFileSync(path.join(repo, 'CLAUDE.md'), 'utf8'), /^# memo/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| boot \| .* \| PASS \| scaffold \| — \|/);
  assert.match(script('work', ['seed'], repo).out, /^UNIT memo-add spec/, 'boot 뒤 다음 unit이 열린다');
  // 사고 34(필드 시험 2): 설치 명령이 비어(true) 뒤 unit의 의존성이 main·worktree에 깔리지 않았다 — CEO의 한 줄(ADMIN, 메인 루트)이 커밋·설치까지 하고, worktree의 verify가 main의 의존성 디렉터리를 잇는다
  const setupCmd = `node -e "require('fs').mkdirSync('node_modules/dep',{recursive:true})"`;
  const sc = script('work', ['commands', `setup=${setupCmd}`], repo, { GARAGISTE_ADMIN: '1' });
  assert.match(sc.out, /^COMMANDS [\s\S]*scaffold\(team\) 커밋 · setup을 main에서 돌렸다 exit=0/, sc.out);
  assert.equal(git(['status', '--porcelain', '--', '.garagiste/team.json'], repo).out.trim(), '', 'commands 뒤 main은 깨끗하다');
  assert.ok(fs.existsSync(path.join(repo, 'node_modules/dep')), 'setup이 main에서 돌았다');
  const mwt = path.join(repo, '.worktrees', 'memo-add');
  assert.ok(!fs.existsSync(path.join(mwt, 'node_modules')), '이미 열린 worktree엔 아직 없다');
  script('verify', ['quick'], mwt);
  assert.ok(fs.existsSync(path.join(mwt, 'node_modules/dep')), 'worktree의 verify가 main의 의존성 디렉터리를 잇는다');
  git(['config', '--unset', 'core.hooksPath'], repo);
  assert.match(script('work', ['seed'], repo).out, /^FAIL doctor \d+[\s\S]*core\.hooksPath/, 'R8: 병든 설치(게이트 침묵 꺼짐)에서 seed는 이유 전문과 함께 멈춘다');
  git(['config', 'core.hooksPath', '.githooks'], repo);
  assert.match(script('doctor', [], repo).out, /^FAIL doctor 1\n- session-start alive/, '남은 건 첫 세션의 alive 마커뿐');
  const st = script('selftest', [], repo);
  assert.match(st.out, /SELFTEST PASS \d+\/\d+/, st.out);
});

test('L2 3판 (e): 확인형 질문(--assumed)의 「예」는 RESPEC이 아니다 — 저장 꼴 질문 6개가 모두 「예」였는데 각각 spec 재spawn을 낳아 라운드당 출하 1', { timeout: 60000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-assumed-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'README.md', '# p\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  assert.match(script('work', ['new', 'schedule', '라운드는 일주일 간격의 토요일이다'], repo).out, /^UNIT schedule spec/);
  assert.match(script('brief', ['spec', 'schedule'], repo).out, /^PACK /, 'spec 팩이 돌았다 — 이제부터 닫히는 답은 사고 17의 RESPEC 대상');
  assert.match(script('work', ['ask', 'schedule', '라운드를 일요일로?', '--assumed'], repo).out, /^FAIL --assumed는 진행 중 unit의 질문에 가정 한 줄/, '가정 없는 --assumed는 받지 않는다');
  // 측정 빈틈(L1 4차·L2 관찰): FAIL·가드 거부는 원장 줄이 없었다 — 같은 FAIL이 되풀이되면 STATUS 「막힌 것」(정비 채널의 자리)
  script('work', ['ask', 'schedule', '라운드를 일요일로?', '--assumed'], repo);
  const ledgerText = () => fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8');
  assert.match(ledgerText(), /"kind":"fail","script":"work\.mjs","line":"FAIL --assumed는 진행 중 unit의 질문에 가정 한 줄/);
  assert.match(script('state', ['--brief'], repo).out, / · 반복 FAIL 1\b/, '같은 FAIL 두 번 = 프레임워크 FAIL 후보');
  script('state', [], repo);
  assert.match(fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8'), /## 막힌 것[^\n]*\n- work\.mjs ×2 [^\n]*FAIL --assumed는/);
  const hook = spawnSync(process.execPath, [path.join(repo, '.claude/hooks/guard.mjs')], { cwd: repo, encoding: 'utf8', input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: path.join(repo, 'src/x.mjs') }, cwd: repo }), env: { ...ENV, CLAUDE_PROJECT_DIR: repo } });
  assert.match(hook.stdout, /"permissionDecision":"deny"/, hook.stdout + hook.stderr);
  assert.match(ledgerText(), /"kind":"guard","tool":"Write","target":"[^"]*src(?:\/|\\\\)x\.mjs","reason":"conductor는 쓰지 않는다/, '원장 target은 절대 경로라 플랫폼 표기(윈도우 src\\\\x.mjs) — 5판 윈도우 점검');
  assert.match(script('work', ['ask', 'schedule', '원문의 토요일이 아니라 뒤의 말대로 일요일이면 되나요?', '--assumed', '라운드는 일요일'], repo).out, /^Q1 queued[^\n]*「예」면 가정 그대로/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/DECISIONS.md'), 'utf8'), /- \[ \] Q1 \(schedule\): 원문의 토요일이[^\n]*지금은 「라운드는 일요일」, 예 = 그대로/, 'CEO는 「예」가 무엇을 뜻하는지 질문 줄에서 본다');
  const d1 = script('work', ['decide', '1', '예'], repo).out;
  assert.match(d1, /^PASS decide Q1\nKEPT schedule — Q1 「예」는 가정 그대로\(라운드는 일요일\)/, d1);
  assert.doesNotMatch(d1, /RESPEC/, '「예」는 spec 재spawn이 아니다');
  const unit = () => JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/schedule.json'), 'utf8'));
  assert.ok(!(unit().respec || []).length, 'build·attack·ship은 그대로 열려 있다');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"kept","slug":"schedule","q":1,"assumed":"라운드는 일요일"/);
  // 가정 없는 「예」는 사고 17대로 RESPEC — 무엇을 가정했는지 기계가 모른다
  script('work', ['ask', 'schedule', '시즌이 해를 넘겨도 되나요?'], repo);
  assert.match(script('work', ['decide', '2', '예'], repo).out, /^PASS decide Q2\nRESPEC schedule/);
  // 가정과 다른 답도 RESPEC
  script('work', ['ask', 'schedule', '한 라운드는 한 주인가요?', '--assumed', '한 주'], repo);
  assert.match(script('work', ['decide', 'Qx', '아니오'], repo).out, /^FAIL 번호가 아니다: x — work\.mjs decide <n\|Q<n>>/);
  const d3 = script('work', ['decide', 'Q3', '아니오 — 두 주'], repo).out; // 사고 61: CEO의 말은 「Q3 …」 — Q를 뗀 번호로 받는다
  assert.match(d3, /^PASS decide Q3\nRESPEC schedule/, d3);
  assert.deepEqual(unit().respec.map((r) => r.q), [2, 3]);
});

test('system-attack(채용 2026-10-03): 범위 끝의 이음새 공격 — 출하된 unit 전체의 표면·try가 팩에, 발견은 red 테스트 → build가 고쳐 ship, 발견 0이면 drop', { timeout: 120000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-system-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  write(repo, 'src/one.mjs', 'export const one = 1;\n'); write(repo, 'src/two.mjs', 'export const two = 2;\n');
  write(repo, 'docs/units/one/surface.md', 'one(): 숫자 1\n'); write(repo, 'docs/units/one/try.md', '명령: node -e "import(\'./src/one.mjs\')"\n');
  write(repo, 'docs/units/two/surface.md', 'two(): 숫자 2\n'); write(repo, 'docs/units/two/try.md', '명령: two\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json'); const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/**/*.test.mjs"', test_file: 'node --test {file}', run: 'node src/one.mjs' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  git(['add', '-A'], repo); script('verify', ['quick'], repo);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  // 출하된 unit 둘(출하는 ship의 일 — 여기선 상태만)
  assert.match(script('work', ['add', 'one', '숫자 1을 준다', '--milestone', 'M1'], repo).out, /^ADD one/);
  assert.match(script('work', ['add', 'two', '숫자 2를 준다', '--milestone', 'M1'], repo).out, /^ADD two/);
  assert.match(script('work', ['scope', '--milestone', 'M1'], repo).out, /^SCOPE 요청 2/);
  const now = new Date().toISOString();
  for (const [s, n] of [['one', 1], ['two', 2]]) write(repo, `.garagiste/units/${s}.json`, JSON.stringify({ slug: s, kind: 'feature', origin: `숫자 ${n}을 준다`, origin_kind: 'seed', milestone: 'M1', needs: [], accept: '-', created: now, state: 'shipped', shipped: now, branch: `unit/${s}`, worktree: `.worktrees/${s}`, boundary: { hit: false, reasons: [] }, defaults: [], questions: [], tried: { result: 'ok', note: '', at: now }, sensor: 'machine' }, null, 2));
  const nx = () => script('next', [], repo).out.trim();
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/work\.mjs system — 범위가 끝났다 — 출하된 unit 2개/, 'next: 둘 이상 출하된 범위의 끝은 이음새 공격');
  const sy = script('work', ['system'], repo).out;
  assert.match(sy, /^UNIT system-1 attack \.worktrees\/system-1\nSYSTEM system-1 — 출하된 unit 2개의 이음새/, sy);
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[ \] system-1 · [^\n]* · kind: system/);
  assert.match(script('brief', ['spec', 'system-1'], repo).out, /^FAIL 시스템 공격 unit은 attack·build 팩만/);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/brief\.mjs attack system-1 — /);
  const ap = script('brief', ['attack', 'system-1'], repo);
  assert.match(ap.out, /^PACK .*system-1-attack-/, ap.out);
  const pack = fs.readFileSync(path.join(repo, ap.out.split(' ')[1]), 'utf8');
  assert.match(pack, /## 시스템 공격 — 입력은 diff가 아니라 출하된 제품 전체[\s\S]*## 출하된 unit 2개[\s\S]*### one — "숫자 1을 준다"[\s\S]*one\(\): 숫자 1[\s\S]*### two — "숫자 2을 준다"/, '팩이 출하된 unit 전체의 표면·try를 받는다');
  assert.doesNotMatch(pack, /## diff/, 'diff는 없다 — 입력은 제품이다');
  script('work', ['spawned', 'system-1', 'attack'], repo);
  const wt = path.join(repo, '.worktrees', 'system-1');
  write(wt, 'tests/adversary/system-1-1.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';\ntest('one과 two의 이음새: 합을 주는 진입점', () => { assert.ok(fs.existsSync('src/sum.mjs')); });\n");
  assert.match(script('verify', ['attack', 'system-1'], repo).out, /^ATTACK system-1 red 1\/1/);
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'test(system-1): seam'], wt).status, 0);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/brief\.mjs build system-1 — 공격 red 1/, 'next: 발견은 build가 고친다');
  assert.match(script('redproof', ['system-1'], repo).out, /^PASS redproof system-1: system — 발견 1\(red였던 공격 파일 tests\/adversary\/system-1-1\.test\.mjs\)/, '사고 63: 시스템 공격 unit의 redproof는 「acceptance 없음」이 아니라 발견이다(build 팩 7단계가 부른다)');
  const bp = script('brief', ['build', 'system-1'], repo);
  assert.match(bp.out, /^PACK .*system-1-build-/, '인수 테스트 없이도 build 팩이 열린다 — 공격 테스트가 할 일이다: ' + bp.out);
  assert.match(fs.readFileSync(path.join(repo, bp.out.split(' ')[1]), 'utf8'), /## 공격 테스트 — 지금 red[\s\S]*system-1-1\.test\.mjs/);
  script('work', ['spawned', 'system-1', 'build'], repo);
  write(wt, 'src/sum.mjs', "import { one } from './one.mjs'; import { two } from './two.mjs'; export const sum = one + two;\n");
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'feat(seam): sum\n\nUnit: system-1\nStep: 1'], wt).status, 0);
  assert.match(script('verify', ['attack', 'system-1'], wt).out, /^ATTACK system-1 red 0\/1/);
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/ship\.mjs system-1 — red 0/);
  const sh = script('ship', ['system-1'], repo);
  assert.match(sh.out, /^SHIPPED system-1 [0-9a-f]{7} sensor=machine\n[\s\S]*TRY: 이음새 공격이 고친 흐름/, sh.out);
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| system-1 \| [0-9a-f]{7} \| [0-9a-f]{7} \| PASS \| system \| 1→0\/1 \| machine \|/, 'LEDGER: red 증명 자리에 system, 선발견 1');
  assert.match(nx(), /^NEXT run node \.garagiste\/scripts\/state\.mjs report — 범위가 끝났다/, '한 바퀴 돈 범위는 출하 보고 한 장');
  const rp = script('state', ['report'], repo).out;
  assert.match(rp, /^REPORT docs\/REPORT\.md — 출하 2\/2 · 써볼 것 0 · docs\(report\) 커밋/, rp);
  const report = fs.readFileSync(path.join(repo, 'docs/REPORT.md'), 'utf8');
  assert.match(report, /^# 출하 보고 — one → two\n/);
  assert.match(report, /## 만든 것[\s\S]*- \*\*one\*\* \(M1\) — "숫자 1을 준다"[\s\S]*## 기계가 증명한 것[\s\S]*## 이음새 공격\n- system-1: 발견 1 → 고쳐 출하/);
  assert.match(git(['log', '-1', '--format=%s'], repo).out, /^docs\(report\): 출하 보고 — one → two/);
  assert.equal(git(['status', '--porcelain'], repo).out.trim(), '', 'main은 깨끗하다');
  assert.match(nx(), /^NEXT done SCOPE DONE/, '보고까지 낸 범위는 done');
  // 발견 0 — 초록 테스트는 산출물이 아니다: drop
  assert.match(script('work', ['system'], repo).out, /^UNIT system-2 attack/);
  script('brief', ['attack', 'system-2'], repo); script('work', ['spawned', 'system-2', 'attack'], repo);
  write(path.join(repo, '.worktrees', 'system-2'), 'tests/adversary/system-2-1.test.mjs', "import test from 'node:test'; test('이미 맞다', () => {});\n");
  assert.match(script('verify', ['attack', 'system-2'], repo).out, /^ATTACK system-2 red 0\/1/);
  const nd = nx();
  assert.match(nd, /^NEXT run node \.garagiste\/scripts\/work\.mjs drop system-2 "system-attack 발견 0 — 공격 파일 1" --forget — 발견 0/, nd);
  assert.match(script('ship', ['system-2'], repo).out, /- redproof: 시스템 공격이 결함을 찾지 못했다/, 'ship도 초록만 든 시스템 공격을 거부한다');
  assert.match(script('redproof', ['system-2'], repo).out, /^FAIL redproof system-2: 시스템 공격 발견 0\(red였던 공격 파일 없음\) — 초록 테스트는 산출물이 아니다: node \.garagiste\/scripts\/work\.mjs drop system-2 "system-attack 발견 0" --forget/, '사고 63: 발견 0의 redproof도 다음 할 일(drop)을 말한다');
  assert.match(script('work', ['drop', 'system-2', 'system-attack 발견 0 — 공격 파일 1', '--forget'], repo).out, /^DROPPED system-2/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[x\] system-2 · /);
  assert.match(nx(), /^NEXT done SCOPE DONE/);
});

// conduct — Flow 4의 conductor를 모델 밖으로(R&D 2026-10-04). 가짜 팩(tests/fakes/pack.mjs)이 팩의 일을 그대로 하고 claude -p의 JSON 꼴로 끝난다 — 모델 0 · 네트워크 0.
const FAKE = path.join(GARAGISTE, 'tests', 'fakes', 'pack.mjs');
function conductRepo(t, flavor = 'claude') {
  if (!BASH) { t.skip(NO_BASH); return null; }
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-conduct-'));
  assert.equal(git(['init', '-q', '-b', 'main'], repo).status, 0);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  git(['add', '-A'], repo); assert.equal(git(['commit', '-q', '-m', 'init'], repo).status, 0);
  const inst = run(BASH, [path.join(GARAGISTE, 'install.sh'), flavor, '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo);
  assert.equal(inst.status, 0, inst.out);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/**/*.test.mjs"', test_file: 'node --test {files}', run: 'node src/cli.mjs', setup: 'npm install' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2) + '\n');
  if (flavor === 'claude') fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo); assert.match(script('verify', ['quick'], repo).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  assert.match(script('work', ['new', 'hello', '이름을 주면 그 이름으로 인사한다'], repo).out, /^UNIT hello spec/);
  return repo;
}
const conduct = (repo, args = [], env = {}) => script('conduct', ['--spawner', `node ${FAKE}`, ...args], repo, env);
const ledgerOf = (repo) => fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));

test('conduct: next의 한 줄을 그대로 실행한다 — spec → RED → build → attack(red 1) → build → red 0 → ship, 팩마다 spawn_stop·spawned(실측 토큰·분)이 원장에, 범위가 없으면 ceo(exit 2)', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const r = conduct(repo);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /NEXT run node \.garagiste\/scripts\/brief\.mjs spec hello[\s\S]*NEXT spawn spec hello[\s\S]*SPAWN hello spec sonnet 1200 tok[\s\S]*RED hello 1\/1[\s\S]*NEXT run node \.garagiste\/scripts\/brief\.mjs build hello — RED[\s\S]*NEXT spawn build hello[\s\S]*NEXT spawn attack hello[\s\S]*ATTACK hello red 1\/1[\s\S]*NEXT spawn build hello[\s\S]*ATTACK hello red 0\/1[\s\S]*SHIPPED hello [0-9a-f]{7}[\s\S]*STOP ceo [^\n]*범위 없음/);
  assert.doesNotMatch(r.out, /NEXT run node \.garagiste\/scripts\/redproof\.mjs hello/, '팩 안의 에이전트가 남긴 redproof는 다시 돌리지 않는다(next의 증거 셈)');
  assert.match(r.out, /\nCEO: docs\/STATUS\.md 「써볼 것」/, '멈춤 줄 다음 줄이 CEO가 할 일');
  assert.match(r.out, /\nSTATUS: 실행: node src\/cli\.mjs · 안 본 것 0\/3/, 'STATUS 첫 줄을 다시 낸다');
  const L = ledgerOf(repo);
  const spawns = L.filter((e) => e.kind === 'spawn');
  assert.deepEqual(spawns.map((e) => [e.pack, e.tokens, e.model]), [['spec', 1200, 'sonnet'], ['build', 1200, 'haiku'], ['attack', 1200, 'sonnet'], ['build', 1200, 'haiku']], '팩 넷 — 실측 토큰과 team.json의 모델');
  assert.ok(spawns.every((e) => e.minutes >= 0 && /conduct \$0\.01 turns 3 exit 0 log \.garagiste\/session\/logs\/conduct-hello-/.test(e.note)), '비용·턴·exit·로그 경로가 note에: ' + spawns[0].note);
  assert.equal(L.filter((e) => e.kind === 'spawn_stop').length, 4, '헤드리스엔 SubagentStop 훅이 없다 — 드라이버가 spawn_stop을 남긴다');
  assert.deepEqual(L.filter((e) => e.kind === 'conduct').map((e) => e.event + (e.stop ? ':' + e.stop : '')), ['start', 'stop:ceo']);
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| hello \| [0-9a-f]{7} \| [0-9a-f]{7} \| PASS \| base_red head_green \| 1→0\/1 \| machine \|/);
  assert.equal(fs.readdirSync(path.join(repo, '.garagiste/session/logs')).filter((f) => f.startsWith('conduct-hello-')).length, 4, '팩마다 stdout·stderr 로그 하나');
  assert.equal(git(['status', '--porcelain'], repo).out.replace(/^ M docs\/STATUS\.md\n?$/m, '').trim(), '', 'main은 STATUS(스크립트 문서) 외엔 깨끗하다');
});
test('conduct: 빈손 팩 — 같은 FAIL이 되풀이되면 프레임워크 FAIL로 멈춘다(exit 4), 우회하지 않는다 · --once는 한 걸음(exit 5)', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const once = conduct(repo, ['--once']);
  assert.equal(once.status, 5, once.out);
  assert.match(once.out, /PACK \.garagiste\/session\/packs\/hello-spec-[\s\S]*STOP cap [^\n]*--once/);
  const r = conduct(repo, [], { GARAGISTE_FAKE_MODE: 'idle' });
  assert.equal(r.status, 4, r.out);
  assert.match(r.out, /FAIL redproof hello: tests\/acceptance\/hello\* 없음[\s\S]*FAIL redproof hello: tests\/acceptance\/hello\* 없음[\s\S]*STOP framework [^\n]*같은 FAIL 되풀이 — FAIL redproof hello/);
  assert.match(r.out, /STATUS: [^\n]*반복 FAIL 1/, 'STATUS 첫 줄이 되풀이를 센다(정비 채널로 가는 줄)');
  assert.equal(ledgerOf(repo).filter((e) => e.kind === 'conduct' && e.stop).map((e) => e.stop).join(','), 'cap,framework');
});
test('conduct: build의 spec: 반려 — 첫 반려는 brief.mjs spec --return으로 spec에게, 두 번째는 FAIL 안내의 ask --hold를 그대로 실행해 그 unit만 세운다(hard 질문 → ceo, 프레임워크 FAIL이 아니다)', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const r = conduct(repo, [], { GARAGISTE_FAKE_MODE: 'return' });
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /spec: 인수 테스트가 서로 어긋난다[\s\S]*PACK \.garagiste\/session\/packs\/hello-spec-[\s\S]*FAIL spec 반려가 두 번째[\s\S]*→ hard 질문으로 세운다\(그 unit만\): node \.garagiste\/scripts\/work\.mjs ask hello '[^']+' --hold[\s\S]*Q1 queued[\s\S]*STOP ceo [^\n]*질문에 걸린 unit: hello/);
  assert.doesNotMatch(r.out, /STOP framework/, '반려는 정당한 빈손 — 진전 없음·되풀이로 세지 않는다');
  assert.match(fs.readFileSync(path.join(repo, 'docs/DECISIONS.md'), 'utf8'), /- \[ \] Q1 \(hello\): spec 반려 두 번째/);
  assert.equal(ledgerOf(repo).filter((e) => e.kind === 'spawn').map((e) => e.pack).join(','), 'spec,build,spec,build');
});

// 사고 71(15라운드 넷째 run · erp-lite 138파일): system unit의 build가 `spec:` 반려를 남겼다(공격 카드가 서로·기본 data와 어긋남) — spec이 없는 unit이라 brief가 FAIL(「attack·build 팩만」)했고
// conduct는 반려를 「정당한 빈손」으로 보아 그 FAIL을 세지 않아 build를 30번 다시 띄웠다($2.87). 수리 둘: 반려는 카드를 쓴 attack에게 · 반려 전달의 FAIL은 run 걸음의 FAIL과 같은 되풀이 규칙.
test('conduct: system unit의 build가 spec: 반려를 남기면 반려는 공격 카드를 쓴 attack에게 간다(spec이 없다) — attack 재spawn 뒤 둘째 반려는 CEO hold, build 되풀이 없음(사고 71)', { timeout: 120000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-system-return-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  write(repo, 'src/cli.mjs', "process.stdout.write(`hello ${process.argv[2] ?? ''}\\n`);\n"); // 이름 없으면 끝 공백 — 가짜 attack의 카드가 red
  for (const s of ['one', 'two']) { write(repo, `docs/units/${s}/surface.md`, `${s}: 인사 한 줄\n`); write(repo, `docs/units/${s}/try.md`, '명령: node src/cli.mjs Ada\n'); }
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  const teamPath = path.join(repo, '.garagiste', 'team.json'); const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/**/*.test.mjs"', test_file: 'node --test {files}', run: 'node src/cli.mjs', setup: 'npm install' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2) + '\n');
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo); script('verify', ['quick'], repo);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  assert.match(script('work', ['add', 'one', '인사 1', '--milestone', 'M1'], repo).out, /^ADD one/);
  assert.match(script('work', ['add', 'two', '인사 2', '--milestone', 'M1'], repo).out, /^ADD two/);
  assert.match(script('work', ['scope', '--milestone', 'M1'], repo).out, /^SCOPE 요청 2/);
  const now = new Date().toISOString();
  for (const s of ['one', 'two']) write(repo, `.garagiste/units/${s}.json`, JSON.stringify({ slug: s, kind: 'feature', origin: `인사 ${s}`, origin_kind: 'seed', milestone: 'M1', needs: [], accept: '-', created: now, state: 'shipped', shipped: now, branch: `unit/${s}`, worktree: `.worktrees/${s}`, boundary: { hit: false, reasons: [] }, defaults: [], questions: [], tried: { result: 'ok', note: '', at: now }, sensor: 'machine' }, null, 2));
  const r = conduct(repo, [], { GARAGISTE_FAKE_MODE: 'return' });
  assert.notEqual(r.status, 4, `프레임워크 FAIL이 아니다: ${r.out}`);
  assert.doesNotMatch(r.out, /STOP framework|FAIL 시스템 공격 unit은 attack·build 팩만/, '반려를 받을 길이 있다 — 넷째 run의 FAIL이 사라진다');
  assert.match(r.out, /ATTACK system-1 red 1\/1[\s\S]*spec: 공격 카드가 서로 어긋난다[\s\S]*PACK \.garagiste\/session\/packs\/system-1-attack-[^\n]* · 반려 → attack\(system unit엔 spec이 없다[\s\S]*NEXT spawn attack system-1[\s\S]*spec: 공격 카드가 서로 어긋난다[\s\S]*FAIL spec 반려가 두 번째[\s\S]*→ hard 질문으로 세운다\(그 unit만\): node \.garagiste\/scripts\/work\.mjs ask system-1 '[^']+' --hold/, r.out);
  assert.equal(ledgerOf(repo).filter((e) => e.kind === 'spawn').map((e) => e.pack).join(','), 'attack,build,attack,build', '반려마다 build 한 번 · attack이 받는다 — 30번이 아니다');
  const ret = ledgerOf(repo).filter((e) => e.kind === 'spec_return');
  assert.deepEqual(ret.map((e) => [e.from, e.to]), [['build', 'attack']], '첫 반려만 원장에(둘째는 FAIL → hold)');
  const packs = fs.readdirSync(path.join(repo, '.garagiste/session/packs')).filter((f) => f.startsWith('system-1-attack-')).sort();
  assert.equal(packs.length, 2, '첫 공격 + 반려를 받은 공격');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/session/packs', packs[1]), 'utf8'), /## 반려 — build 팩이 남긴 줄 \(system unit엔 spec이 없다: 공격 카드가 곧 주장[^\n]*verify\.mjs attack system-1\)\n공격 카드가 서로 어긋난다/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/DECISIONS.md'), 'utf8'), /- \[ \] Q1 \(system-1\): spec 반려 두 번째/);
});

test('conduct + 예산: unit 토큰 상한(L2 2판 윈도우 진동 16배의 장치) — 상한에 닿으면 다음 걸음에(진동 안에서도 — 사고 72) ceo로 멈추고, CEO의 work.mjs budget 뒤 다시 돌리면 출하한다', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8')); team.budgets.unit_tokens_max = 3000; fs.writeFileSync(teamPath, JSON.stringify(team, null, 2) + '\n');
  git(['add', '-A'], repo); assert.equal(git(['commit', '-q', '-m', 'docs: budget'], repo, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' }).status, 0);
  const r = conduct(repo);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /ATTACK hello red 1\/1[\s\S]*STOP ceo [^\n]*unit hello 토큰 4K ≥ 상한 3K — CEO 결정: node \.garagiste\/scripts\/work\.mjs budget hello[^\n]*hello는 attack 뒤에 서 있다\(상한은 걸음마다 — 진동 안에서도, 사고 72\)/, '세 팩 3600 토큰 — 공격 red 1인데 build를 띄우지 않고 선다(넷째 run: system-1이 진동으로 2.2M을 쓰는 동안 서지 않았다)');
  assert.equal(ledgerOf(repo).filter((e) => e.kind === 'spawn').length, 3, '상한을 넘긴 팩 뒤의 걸음에서 선다');
  assert.doesNotMatch(r.out, /SHIPPED/);
  assert.match(script('work', ['budget', 'hello', '10K'], repo).out, /^PASS budget hello 토큰 상한 3000 → 10000/);
  assert.match(script('work', ['budget', 'hello', 'x'], repo).out, /^사용법: work\.mjs budget/);
  const again = conduct(repo);
  assert.equal(again.status, 2, again.out);
  assert.match(again.out, /SHIPPED hello [0-9a-f]{7}[\s\S]*STOP ceo [^\n]*범위 없음/);
  const L = ledgerOf(repo);
  assert.deepEqual(L.filter((e) => e.kind === 'budget').map((e) => [e.slug, e.tokens_max, e.prev]), [['hello', 10000, 3000]]);
  assert.match(script('work', ['budget', 'hello', '20K'], repo).out, /^FAIL hello은 shipped/);
});

// 사고 70(brownfield 테스트 베드를 만들며 발견 — R&D 2026-10-04): 기존 저장소(HEAD 있음)에 설치하면 팀 파일이 미커밋으로 남아 첫 ship이 「메인 worktree에 미커밋 변경」으로 막혔다.
test('사고 70·74: 기존 저장소에 설치 — 설치가 쓴 팀 파일만 커밋한다(생성물 차선), 더러워도 팀 파일은 커밋하고 사람의 것은 그대로(사고 74), 재설치는 「갱신」 커밋', { timeout: 120000 }, (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-brown-'));
  assert.equal(git(['init', '-q', '-b', 'main'], repo).status, 0);
  write(repo, 'src/app.js', "console.log('old');\n"); write(repo, 'README.md', '# old\n');
  git(['add', '-A'], repo); assert.equal(git(['commit', '-q', '-m', 'legacy'], repo).status, 0);
  const inst = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'medium', '-SkipSelftest'], repo);
  assert.equal(inst.status, 0, inst.out);
  assert.match(inst.out, /팀 파일 커밋\(설치 — 기존 저장소, 생성물 차선\)/);
  assert.equal(git(['status', '--porcelain'], repo).out.trim(), '', '설치 뒤 main이 깨끗하다');
  assert.equal(git(['log', '-1', '--format=%s'], repo).out.trim(), 'scaffold(team): GARAGISTE 증거 팀 설치 [claude, budget medium]');
  assert.equal(git(['rev-list', '--count', 'HEAD'], repo).out.trim(), '2');
  assert.match(git(['show', '--stat', '--format=', 'HEAD'], repo).out, /\.garagiste\/team\.json[\s\S]*\.githooks\/pre-commit[\s\S]*CLAUDE\.md/, '팀 파일만');
  // L3 Q11(R&D 2라운드): 설치본의 판 — 어느 GARAGISTE 커밋의 team/인가
  const ver = JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/VERSION'), 'utf8'));
  assert.deepEqual(ver, { garagiste: git(['rev-parse', 'HEAD'], GARAGISTE).out.trim(), team_tree: git(['rev-parse', 'HEAD:team'], GARAGISTE).out.trim(), flavor: 'claude' }, '판 = GARAGISTE 커밋 · team/ tree · 하네스(날짜 없음 — 같은 판의 재설치가 diff를 만들지 않게)');
  assert.equal(script('doctor', ['--version'], repo).out.trim(), `VERSION garagiste ${ver.garagiste} · team ${ver.team_tree} · claude`);
  // 더러운 저장소(사고 74 — 16라운드 운영 둘째 날): 사고 70은 「손대지 않는다」였는데 팀의 docs 차선만 더러워도 갱신의 팀 파일이 미커밋으로 남아 다음 ship이 막혔다 — 설치가 쓴 팀 파일만 커밋하고 사람의 것은 그대로
  write(repo, 'src/wip.js', '// 손으로 고치던 것\n');
  fs.writeFileSync(path.join(repo, '.garagiste/packs/spike.md'), '# 낡은 팩 사본\n'); git(['add', '.garagiste/packs/spike.md'], repo); assert.equal(git(['commit', '-q', '-m', 'docs: stale'], repo, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' }).status, 0);
  const re = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'high', '-SkipSelftest'], repo);
  assert.equal(re.status, 0, re.out);
  assert.match(re.out, /팀 파일 커밋\(갱신\(같은 판 [0-9a-f]{7}\) — 기존 저장소, 생성물 차선\)\n[^\n]*설치 전의 미커밋 변경은 그대로 두었다\(팀의 것이 아니다\): 1개/, re.out);
  assert.equal(git(['status', '--porcelain'], repo).out.trim(), '?? src/wip.js', '사람의 것은 그대로 — 팀 파일만 커밋됐다');
  const shown = git(['show', '--stat', '--format=', 'HEAD'], repo).out; assert.match(shown, /\.garagiste\/packs\/spike\.md/); assert.doesNotMatch(shown, /wip\.js/);
  assert.equal(git(['rev-list', '--count', 'HEAD'], repo).out.trim(), '4', 'legacy · 설치 · stale · 갱신');
  fs.rmSync(path.join(repo, 'src/wip.js'));
  // 재설치(갱신): 깨끗하면 바뀐 팀 파일만 커밋(scripts·packs·훅·agents는 덮고 team.json·HAZARDS·규칙 파일은 남긴다) — 바뀐 것이 없으면 커밋도 없다
  fs.writeFileSync(path.join(repo, '.garagiste/packs/spike.md'), '# 낡은 팩 사본\n'); // 스크립트를 깨면 게이트 자체가 죽는다 — 산문 사본으로
  git(['add', '-A'], repo); assert.equal(git(['commit', '-q', '-m', 'docs: stale'], repo, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' }).status, 0);
  const up = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'high', '-SkipSelftest'], repo);
  assert.equal(up.status, 0, up.out);
  assert.match(up.out, /팀 파일 커밋\(갱신\(같은 판 [0-9a-f]{7}\) — 기존 저장소, 생성물 차선\)/);
  assert.match(git(['log', '-1', '--format=%s'], repo).out, /^scaffold\(team\): GARAGISTE 증거 팀 갱신\(같은 판 [0-9a-f]{7}\) /, '같은 GARAGISTE 커밋의 재설치 — 판이 바뀌면 old→new sha7이 커밋 제목에');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/team.json'), 'utf8'), /"build": "sonnet"/, 'R15: 재설치가 편성을 지우지 않는다');
  const same = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'high', '-SkipSelftest'], repo);
  assert.equal(same.status, 0, same.out); assert.doesNotMatch(same.out, /팀 파일 커밋/, '바뀐 것이 없으면 커밋도 없다');
});

test('conduct 안전벨트(2라운드): 잠금 — 살아 있는 드라이버가 있으면 거부(exit 1), 죽은 pid의 잠금은 교체되고 끝나면 지워진다 · STATUS 「진행 중」이 살아 있는 conduct를 보인다', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const lockPath = path.join(repo, '.garagiste/session/conduct.json');
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, started: '2026-10-04T00:00:00Z', at: '2026-10-04T00:01:00Z', step: 'spawn', slug: 'hello', pack: 'build', steps: 3, usd: 0.02 }));
  const busy = conduct(repo, ['--once']);
  assert.equal(busy.status, 1, busy.out);
  assert.match(busy.out, /^FAIL conduct: 이미 돌고 있다 — pid \d+ · spawn hello build · 2026-10-04T00:01:00Z/m);
  script('state', [], repo);
  assert.match(fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8'), /## 진행 중\n[^\n]*\n- conduct 돌고 있음 — pid \d+ · spawn hello build · 걸음 3 · \$0\.02 · 시작 2026-10-04T00:00:00Z/, '돌아온 CEO가 「지금 무엇을 하는가」를 본다');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 2147483000, started: 'x', at: 'y', step: 'run' })); // 죽은 pid
  const once = conduct(repo, ['--once']);
  assert.equal(once.status, 5, once.out);
  assert.ok(!fs.existsSync(lockPath), '끝나면 잠금을 지운다');
  script('state', [], repo);
  assert.doesNotMatch(fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8'), /conduct 돌고 있음/);
});
test('conduct 안전벨트(2라운드): 팩 시간 상한 — 멈춘 팩은 SIGTERM으로 끊고 비정상 종료로 센다 · 비용 상한 — 누적 $가 상한이면 cap(exit 5)', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const hang = conduct(repo, ['--pack-minutes', '0.02'], { GARAGISTE_FAKE_MODE: 'hang' });
  assert.equal(hang.status, 4, hang.out);
  assert.match(hang.out, /팩 시간 상한 0\.02분 — 끊었다\(SIGTERM\)[\s\S]*STOP framework/, '끊긴 spec 뒤 redproof FAIL 되풀이로 멈춘다 — 밤새 걸리지 않는다');
  const L = ledgerOf(repo);
  assert.ok(L.some((e) => e.kind === 'spawn' && e.pack === 'spec' && /exit (null|1|143)/.test(e.note || '') ), '끊긴 spawn도 원장에 남는다: ' + JSON.stringify(L.filter((e) => e.kind === 'spawn')));
  const logs = fs.readdirSync(path.join(repo, '.garagiste/session/logs')).filter((f) => f.startsWith('conduct-hello-spec-'));
  assert.ok(logs.some((f) => JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/session/logs', f), 'utf8')).timed_out === true), '로그에 timed_out');
  // 비용 상한: 새 unit에서 가짜 팩 $0.01씩 — 둘 뒤 $0.02 ≥ 0.015
  assert.match(script('work', ['drop', 'hello', '시간 상한 시험 끝', '--forget'], repo).out, /^DROPPED hello/);
  assert.match(script('work', ['new', 'hello', '이름을 주면 그 이름으로 인사한다'], repo).out, /^UNIT hello spec/);
  const usd = conduct(repo, ['--max-usd', '0.015']);
  assert.equal(usd.status, 5, usd.out);
  assert.match(usd.out, /SPAWN hello spec[\s\S]*SPAWN hello build[\s\S]*STOP cap [^\n]*비용 상한 \$0\.015 — 이 실행 \$0\.02/);
  assert.doesNotMatch(usd.out, /SPAWN hello attack/, '상한 뒤 팩을 띄우지 않는다');
  const stops = ledgerOf(repo).filter((e) => e.kind === 'conduct' && e.event === 'stop');
  assert.equal(stops[stops.length - 1].usd, 0.02, '멈춤 줄에 이 실행의 비용');
  const again = conduct(repo);
  assert.equal(again.status, 2, again.out);
  assert.match(again.out, /SHIPPED hello/, '다시 돌리면 이어서 출하한다');
});

// adopt — 기존 코드의 첫 unit(R&D 3라운드 2026-10-04): 레거시 인수의 입구. boot과 같은 생애(팩 하나 → ship), 다른 경계(소스·기존 테스트·매니페스트를 쓰지 않는다).
function legacyRepo(t) {
  if (!BASH) { t.skip(NO_BASH); return null; }
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-adopt-'));
  assert.equal(git(['init', '-q', '-b', 'main'], repo).status, 0);
  write(repo, 'package.json', '{ "name": "greet", "version": "1.2.0", "private": true, "bin": { "greet": "bin/greet.js" }, "scripts": { "test": "node --test test/" } }\n');
  write(repo, 'bin/greet.js', "#!/usr/bin/env node\n'use strict';\nconst { greet } = require('../lib/greet');\nprocess.stdout.write(greet(process.argv[2]) + '\\n');\n");
  write(repo, 'lib/greet.js', "'use strict';\nmodule.exports = { greet: (n) => `hi ${n || 'there'}` };\n");
  write(repo, 'test/greet.test.js', "const test = require('node:test'); const assert = require('node:assert/strict'); const { greet } = require('../lib/greet');\ntest('greet', () => assert.equal(greet('Bo'), 'hi Bo'));\n");
  write(repo, 'README.md', '# greet\n\n`greet <name>`가 인사한다.\n');
  git(['add', '-A'], repo); assert.equal(git(['commit', '-q', '-m', 'legacy: greet 1.2.0'], repo).status, 0);
  assert.equal(run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low', '-SkipSelftest'], repo).status, 0);
  return repo;
}
test('adopt 탄생: 기존 코드 → intake 팩이 「저장소 상태: 코드 있음」을 받는다 → add adopt --kind adopt → adopt 팩(저장소 지도) → 특성화 테스트·commands·rules → ship(adopt 열) → 다음 feature unit. 소스·기존 테스트·매니페스트는 훅이 거부', { timeout: 120000 }, (t) => {
  const repo = legacyRepo(t); if (!repo) return;
  script('work', ['brief', '쓰던 도구 greet에 기능을 더한다. 지금 동작(greet <이름>)은 그대로. greet bye <이름>을 더한다.'], repo);
  const ip = script('brief', ['intake'], repo);
  assert.match(ip.out, /^PACK /, ip.out);
  assert.match(fs.readFileSync(path.join(repo, ip.out.split(' ')[1]), 'utf8'), /## 저장소 상태[^\n]*\n코드 있음 — 추적 파일 5개\(팀 파일·docs 제외\) — 폴더별: \(루트\) 2 · bin\/ 1 · lib\/ 1 · test\/ 1 · 매니페스트 package\.json · 기존 테스트 1개/, 'intake가 boot/adopt를 가르는 사실을 스크립트가 센다');
  assert.match(script('work', ['add', 'adopt', '지금 동작(greet <이름>)은 그대로', '--milestone', 'M1', '--accept', '현재 동작이 그대로고 quick·full이 PASS', '--kind', 'adopt'], repo).out, /^ADD adopt M1 needs=- kind=adopt/);
  script('work', ['add', 'bye', 'greet bye <이름>을 더한다', '--milestone', 'M1', '--needs', 'adopt'], repo);
  assert.match(script('work', ['scope', '--milestone', 'M1'], repo).out, /순서: adopt → bye/);
  assert.match(script('work', ['seed'], repo).out, /^UNIT adopt adopt \.worktrees\/adopt\nADOPT — adopt 팩 하나로 끝난다/);
  const wt = path.join(repo, '.worktrees', 'adopt');
  assert.match(script('brief', ['spec', 'adopt'], repo).out, /^FAIL adopt unit\(adopt\)은 adopt 팩 하나로 끝난다/);
  assert.match(script('brief', ['boot', 'adopt'], repo).out, /^FAIL boot 팩은 kind scaffold unit에만/);
  const bp = script('brief', ['adopt', 'adopt'], repo);
  assert.match(bp.out, /^PACK .*adopt-adopt-.* model=haiku/, bp.out);
  const packText = fs.readFileSync(path.join(repo, bp.out.split(' ')[1]), 'utf8');
  assert.match(packText, /## 팩: adopt[\s\S]*## 저장소 지도 — 스크립트가 센 것[\s\S]*추적 파일 5개[\s\S]*### package\.json \(앞 60줄\)[\s\S]*"bin": \{ "greet"[\s\S]*기존 테스트 1개: test\/greet\.test\.js[\s\S]*### README\.md \(앞 30줄\)[\s\S]*## 인수 한 줄/, '팩은 저장소를 통째로 읽지 않는다 — 스크립트가 센 지도만');
  assert.ok(packText.includes('## BRIEF'), 'adopt는 boot처럼 BRIEF 전문을 진다');
  // 경계: 소스·기존 테스트·매니페스트는 거부, 특성화 테스트·위생 파일은 허용 — 훅으로
  const hook = (file) => spawnSync(process.execPath, [path.join(repo, '.claude/hooks/guard.mjs')], { cwd: repo, encoding: 'utf8', input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: path.join(wt, file) }, cwd: wt }), env: { ...ENV, CLAUDE_PROJECT_DIR: repo } }).stdout;
  for (const f of ['lib/greet.js', 'bin/greet.js', 'test/greet.test.js', 'package.json', 'src/new.js']) assert.match(hook(f), /adopt 팩의 쓰기 경계 밖/, f);
  for (const f of ['tests/unit/adopt-greet.test.mjs', 'tests/harness/run.mjs', '.gitattributes', '.gitignore', 'docs/units/adopt/notes.md']) assert.equal(hook(f), '', f);
  // adopt 팩이 할 일을 테스트가 대신한다 — 소스는 그대로
  write(wt, 'tests/unit/adopt-greet.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import { spawn, spawnSync } from 'node:child_process';\ntest('특성화: greet Ada → hi Ada', () => { const r = spawnSync(process.execPath, ['bin/greet.js', 'Ada'], { encoding: 'utf8' }); assert.equal(r.status, 0); assert.equal(r.stdout.trim(), 'hi Ada'); });\ntest('특성화: 이름 없음 → hi there', () => { assert.equal(spawnSync(process.execPath, ['bin/greet.js'], { encoding: 'utf8' }).stdout.trim(), 'hi there'); });\n");
  write(wt, '.gitattributes', '* text=auto eol=lf\n');
  // 12라운드(실전 첫 run 측정): 파일 목록 full은 인수·공격 자리를 보지 않는다 — 등록 때 탐침이 거부하고 저장하지 않는다(실전의 adopt 팩이 정확히 이 꼴을 적었다)
  const blind = script('work', ['commands', 'quick=node --test tests/unit/*.test.mjs test/*.test.js', 'full=node --test tests/unit/*.test.mjs test/*.test.js', 'test_file=node --test {files}', 'run=node bin/greet.js', 'setup=npm install'], wt);
  assert.equal(blind.status, 1); assert.match(blind.out, /^FAIL commands — 눈먼 명령 1\(저장하지 않았다\)\n- full이 tests\/acceptance·tests\/adversary의 파일을 돌리지 않는다 — 깨진 탐침\(tests\/acceptance\/garagiste-probe-adopt-greet\.test\.mjs · tests\/adversary\/garagiste-probe-adopt-greet\.test\.mjs\)을 두고도 exit 0/, blind.out);
  assert.equal(JSON.parse(fs.readFileSync(path.join(wt, '.garagiste/team.json'), 'utf8')).commands.full, '', '저장하지 않았다');
  assert.ok(!fs.existsSync(path.join(wt, 'tests/acceptance/garagiste-probe-adopt-greet.test.mjs')), '탐침 파일은 남지 않는다');
  const wide = script('work', ['commands', 'quick=node --test "tests/**/*.test.mjs" test/*.test.js', 'full=node --test "tests/**/*.test.mjs" test/*.test.js', 'test_file=node --test {files}', 'run=node bin/greet.js', 'setup=npm install'], wt);
  assert.equal(wide.status, 1); assert.match(wide.out, /^FAIL commands — 눈먼 명령 1\(저장하지 않았다\)\n- quick이 tests\/acceptance·tests\/adversary의 파일을 돈다 — 깨진 탐침에 red/, wide.out);
  // 13라운드(둘의 규칙 — Node·Python adopt 둘 다 setup=true): 설치가 아닌 setup은 저장하지 않는다
  const noop = script('work', ['commands', 'quick=node --test tests/unit/*.test.mjs test/*.test.js', 'full=node --test "tests/**/*.test.mjs" test/*.test.js', 'test_file=node --test {files}', 'run=node bin/greet.js', 'setup=true'], wt);
  assert.equal(noop.status, 1); assert.match(noop.out, /^FAIL commands — setup="true"는 설치 명령이 아니다 — package\.json이 있다: 의존성 0이어도 생태계의 설치 명령으로\(npm install/, noop.out);
  assert.match(script('work', ['commands', 'quick=node --test tests/unit/*.test.mjs test/*.test.js', 'full=node --test "tests/**/*.test.mjs" test/*.test.js', 'test_file=node --test {files}', 'run=node bin/greet.js', 'setup=npm install'], wt).out, /^COMMANDS /, 'commands는 adopt의 worktree에서도 열린다 — full은 인수·공격 자리까지, quick은 unit만');
  assert.match(script('work', ['rules', 'project=greet', 'one_line=인사 CLI'], wt).out, /^RULES CLAUDE\.md/);
  git(['add', '-A'], wt);
  assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'adopt(adopt): node:test — 특성화 2\n\nUnit: adopt\nStep: 1'], wt).status, 0);
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  assert.match(script('work', ['spawned', 'adopt', 'adopt'], repo).out, /^SPAWN adopt adopt/, 'conductor가 spawn 뒤 남기는 줄');
  assert.match(script('next', [], repo).out, /^NEXT run node \.garagiste\/scripts\/ship\.mjs adopt — adopt가 끝났다/);
  const ship = script('ship', ['adopt'], repo);
  assert.match(ship.out, /^SHIPPED adopt [0-9a-f]{7}[\s\S]*TRY: 실행 `node bin\/greet\.js`/, ship.out);
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| adopt \| [0-9a-f]{7} \| [0-9a-f]{7} \| PASS \| adopt \| — \| machine \|/);
  assert.equal(fs.readFileSync(path.join(repo, 'lib/greet.js'), 'utf8'), "'use strict';\nmodule.exports = { greet: (n) => `hi ${n || 'there'}` };\n", '제품 코드는 그대로다');
  assert.ok(fs.existsSync(path.join(repo, 'tests/unit/adopt-greet.test.mjs')) && fs.existsSync(path.join(repo, 'test/greet.test.js')), '특성화 테스트가 더해지고 기존 테스트는 남는다');
  assert.match(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/team.json'), 'utf8')).commands.quick, /^node --test tests\/unit/);
  assert.match(fs.readFileSync(path.join(repo, 'CLAUDE.md'), 'utf8'), /^# greet\n인사 CLI/);
  assert.match(script('state', ['--brief'], repo).out, /^실행: node bin\/greet\.js · 안 본 것 0\/3/, 'adopt는 기계 증명 — 미검수에 세지 않는다');
  assert.match(script('work', ['seed'], repo).out, /^UNIT bye spec/, 'adopt 뒤 기능 unit이 열린다 — 여기부터는 greenfield와 같은 생애');
});
test('adopt + conduct: 가짜 팩 adopt로 기존 코드의 첫 unit이 끝까지 — adopt → ship → REPORT → SCOPE DONE(exit 0)', { timeout: 120000 }, (t) => {
  const repo = legacyRepo(t); if (!repo) return;
  script('work', ['brief', '쓰던 도구 greet. 지금 동작은 그대로.'], repo);
  script('work', ['add', 'adopt', '지금 동작은 그대로', '--milestone', 'M1', '--accept', '현재 동작이 그대로고 quick·full이 PASS', '--kind', 'adopt'], repo);
  script('work', ['scope', '--milestone', 'M1'], repo);
  const r = conduct(repo);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /NEXT run node \.garagiste\/scripts\/work\.mjs seed[\s\S]*UNIT adopt adopt[\s\S]*NEXT run node \.garagiste\/scripts\/brief\.mjs adopt adopt[\s\S]*NEXT spawn adopt adopt[\s\S]*SPAWN adopt adopt haiku 1200 tok[\s\S]*NEXT run node \.garagiste\/scripts\/ship\.mjs adopt — adopt가 끝났다[\s\S]*SHIPPED adopt[\s\S]*REPORT docs\/REPORT\.md[\s\S]*STOP done [^\n]*SCOPE DONE/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/REPORT.md'), 'utf8'), /adopt: 쓰던 명령이 그대로 도는가\(특성화\)/);
});

// 4라운드(2026-10-04) — L0 속임수 셋(Q8 검사): 훅이 없는 환경(이 e2e가 그것이다)에서 테스트 약화 · 원장 없는 커밋 · 원장 위조 중 무엇이 막히는가.
// 둘은 L0(게이트·redproof)가 막는다. 셋째(위조한 PASS 줄)는 게이트와 8조건을 지나간다 — ship의 재검증(통합 tree에서 full·redproof·attack을 스스로)이 막는다.
function l0Cheats(t, flavor) {
  const repo = conductRepo(t, flavor); if (!repo) return;
  const stop = conduct(repo, ['--max-steps', '8']); // 가짜 팩으로 spec → build → attack → build(red 0)까지 여덟 걸음 — ship(아홉째) 직전에 선다
  assert.equal(stop.status, 5, stop.out);
  assert.match(stop.out, /ATTACK hello red 0\/1[\s\S]*STOP cap [^\n]*걸음 상한 8/, 'ship 직전에 섰다');
  const wt = path.join(repo, '.worktrees', 'hello');
  const ledgerPath = path.join(repo, '.garagiste/ledger/evidence.jsonl');
  const forge = (o) => fs.appendFileSync(ledgerPath, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n');
  // (1) 테스트 약화 — 인수 테스트를 base에서도 초록인 것으로 바꾸면 redproof가 거부한다
  const accPath = path.join(wt, 'tests/acceptance/hello.test.mjs'); const accOrig = fs.readFileSync(accPath, 'utf8');
  fs.writeFileSync(accPath, "import test from 'node:test'; test('약화', () => {});\n");
  assert.match(script('redproof', ['hello'], repo).out, /^FAIL redproof hello[\s\S]*base에서 green/, '(1) 약화된 주장은 base에서도 초록 — 테스트가 아니다');
  fs.writeFileSync(accPath, accOrig);
  // (2) 원장 없는 커밋 — 로직을 바꾸고 quick 없이 커밋하면 게이트가 거부한다
  const cli = path.join(wt, 'src/cli.mjs'); const cliOrig = fs.readFileSync(cli, 'utf8');
  fs.writeFileSync(cli, "const n = process.argv[2]; process.stdout.write(n ? `hello ${n}!\\n` : 'hello\\n');\n"); // 인수(hello Ada)는 깨지고 스모크(tests/unit)는 산다
  git(['add', '-A'], wt);
  const c1 = git(['commit', '-q', '-m', 'feat(hello): 느낌표\n\nUnit: hello\nStep: 3'], wt);
  assert.equal(c1.status, 1, '(2) 게이트: ' + c1.out); assert.match(c1.out, /원장에 이 tree[^\n]*quick PASS 없음/);
  // (3) 원장 위조 — 지금 tree의 quick PASS 줄을 적으면 게이트는 지나간다(L0 게이트는 원장을 믿는다 — 기록)
  const work = git(['write-tree'], wt).out.trim();
  forge({ kind: 'verify', mode: 'quick', tree: work, head: null, exit: 0, platform: process.platform, where: '.worktrees/hello', forged: true });
  const c2 = git(['commit', '-q', '-m', 'feat(hello): 느낌표\n\nUnit: hello\nStep: 3'], wt);
  assert.equal(c2.status, 0, '(3) 위조한 quick 줄로 게이트가 열렸다 — L0의 한계: ' + c2.out);
  const head = git(['rev-parse', 'HEAD'], wt).out.trim(); const tree = git(['rev-parse', 'HEAD^{tree}'], wt).out.trim();
  forge({ kind: 'verify', mode: 'full', tree, head, exit: 0, platform: process.platform, where: '.worktrees/hello', forged: true });
  forge({ kind: 'redproof', slug: 'hello', tree, head, base: 'x', base_red: true, head_green: true, files: 1, forged: true });
  forge({ kind: 'attack', slug: 'hello', tree, red: 0, total: 1, files: ['tests/adversary/hello-1.test.mjs'], forged: true });
  const ship = script('ship', ['hello'], repo);
  assert.match(ship.out, /^FAIL ship: 통합 tree에서 full FAIL — 원장의 PASS 줄과 다르다\(원장은 증거이지 증명이 아니다/, '(3) 8조건은 위조 줄에 속았지만 ship이 통합 tree에서 스스로 돈 full이 빨갛다: ' + ship.out);
  assert.doesNotMatch(ship.out, /SHIPPED/);
  assert.ok(!fs.existsSync(path.join(repo, 'src/cli.mjs')) || !/!/.test(fs.readFileSync(path.join(repo, 'src/cli.mjs'), 'utf8')), 'main엔 느낌표가 없다');
  const L = ledgerOf(repo);
  assert.ok(L.some((e) => e.kind === 'verify' && e.integration && e.reverify === true && e.exit !== 0), '재검증 full의 원장 줄(integration·reverify·exit≠0)');
  // 기록: 재검증을 끄면(ship_reverify=false) 위조 줄이 그대로 main에 닿는다 — 기본을 켜 두는 이유. 끄는 커밋으로 main이 움직이니 첫 ship은 사고 22 경로(main이 움직였다)의 full에 걸리고,
  // 그 rebase가 남긴 통합 tree에 다시 위조 줄을 적은 둘째 ship이 빨간 인수 테스트를 그대로 머지한다(main quick은 스모크만 돌아 초록).
  const teamPath = path.join(repo, '.garagiste', 'team.json'); const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  fs.writeFileSync(teamPath, JSON.stringify({ ...team, ship_reverify: false }, null, 2) + '\n');
  git(['add', '-A'], repo); assert.equal(git(['commit', '-q', '-m', 'docs: reverify off'], repo, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' }).status, 0);
  const moved = script('ship', ['hello'], repo);
  assert.match(moved.out, /^FAIL ship: 통합 tree에서 full FAIL — main이 움직였다/, '꺼도 main이 움직인 ship은 전처럼 재실행한다: ' + moved.out);
  const tree2 = git(['rev-parse', 'HEAD^{tree}'], wt).out.trim(); const head2 = git(['rev-parse', 'HEAD'], wt).out.trim();
  assert.notEqual(tree2, tree, 'rebase가 남은 통합 tree');
  forge({ kind: 'verify', mode: 'full', tree: tree2, head: head2, exit: 0, platform: process.platform, where: '.worktrees/hello', forged: true });
  forge({ kind: 'redproof', slug: 'hello', tree: tree2, head: head2, base: 'x', base_red: true, head_green: true, files: 1, forged: true });
  forge({ kind: 'attack', slug: 'hello', tree: tree2, red: 0, total: 1, files: ['tests/adversary/hello-1.test.mjs'], forged: true });
  const pierced = script('ship', ['hello'], repo);
  assert.match(pierced.out, /^SHIPPED hello [0-9a-f]{7}/, '재검증을 끄면 위조 줄이 main에 닿는다(기록): ' + pierced.out);
  assert.match(fs.readFileSync(path.join(repo, 'src/cli.mjs'), 'utf8'), /!/, '빨간 코드가 main에 있다');
  assert.notEqual(run(process.execPath, ['--test', 'tests/acceptance/hello.test.mjs'], repo).status, 0, 'main의 인수 테스트가 빨갛다 — ship_reverify=false의 값');
}
test('L0 속임수 셋(claude 설치본): 테스트 약화는 redproof가, 원장 없는 커밋은 게이트가, 원장 위조는 ship의 재검증이 막는다(team.json ship_reverify=false면 뚫린다 — 기록)', { timeout: 180000 }, (t) => l0Cheats(t, 'claude'));
// 5라운드(2026-10-04): L3 게이트 「opencode 환경에서 L0 게이트 전부 재현」 — L0(git 훅 + 스크립트 + 원장)는 하네스를 모른다. 같은 셋, 같은 결과.
test('L0 속임수 셋(opencode 설치본): 같은 L0, 같은 결과 — 훅·플러그인 없이도 게이트·redproof·ship 재검증이 선다', { timeout: 180000 }, (t) => l0Cheats(t, 'opencode'));
test('conduct check: 실전 전 preflight — claude CLI·작업 공간 신뢰·agents·allow·doctor·VERSION·잠금을 한 줄씩, 사용자 spawner면 CLI·신뢰는 생략', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-home-'));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-bin-'));
  const env = { HOME: home, PATH: `${bin}:/usr/bin:/bin` }; // 이 컨테이너엔 진짜 claude가 있다(/opt/…) — git만 남긴 PATH로 「CLI 없음」을 재현
  const bare = script('conduct', ['check'], repo, env);
  assert.equal(bare.status, 1, bare.out);
  assert.match(bare.out, /^FAIL conduct check 2\n- claude CLI 없음\(PATH\)[^\n]*\n- 작업 공간 신뢰 없음\([^\n]*\.claude\.json projects\[[^\n]*hasTrustDialogAccepted\)[^\n]*\n\(ok: doctor OK · VERSION [0-9a-f]{7} · 잠금 없음 · agents 7 · allow node\)/, bare.out);
  const fakeClaude = (flags) => fs.writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\ncase "$1" in --version) echo "2.1.289 (Claude Code)";; --help) printf '%s\\n' ${flags.map((f) => `'  ${f}'`).join(' ')};; esac\n`);
  const HELP = ['--agent <agent>  Agent for the current session', '--output-format <format>  (choices: "text", "json")', '--permission-mode <mode>  (choices: "acceptEdits", "plan")', '--permission-prompts <target>  (choices: "host", "none")', '--max-budget-usd <amount>  Maximum dollar amount', '-p, --print  Print response and exit'];
  fakeClaude(HELP); fs.chmodSync(path.join(bin, 'claude'), 0o755);
  fs.writeFileSync(path.join(home, '.claude.json'), JSON.stringify({ projects: { [repo]: { hasTrustDialogAccepted: false } } }));
  const untrusted = script('conduct', ['check'], repo, env);
  assert.equal(untrusted.status, 1); assert.match(untrusted.out, /^FAIL conduct check 1\n- 작업 공간 신뢰 없음/);
  assert.match(untrusted.out, /conduct\.mjs trust\(그 키를 쓴다/, '12라운드: 수리 명령이 안내에 있다');
  const trust = script('conduct', ['trust'], repo, env); // 12라운드: 명령 하나가 그 키를 쓴다(측정: 신뢰 없는 폴더의 -p는 allow를 버려 팩의 Bash가 전부 거부된다) — 다른 키는 그대로
  assert.equal(trust.status, 0, trust.out); assert.match(trust.out, /^PASS conduct trust — .*hasTrustDialogAccepted=true/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(home, '.claude.json'), 'utf8')).projects[repo].hasTrustDialogAccepted, true);
  assert.match(script('conduct', ['trust'], repo, env).out, /^PASS conduct trust — 이미 신뢰됨/);
  const pass = script('conduct', ['check'], repo, env);
  assert.equal(pass.status, 0, pass.out);
  assert.match(pass.out, /^PASS conduct check — doctor OK · VERSION [0-9a-f]{7} · 잠금 없음 · claude 2\.1\.289 · 깃발 ok · agents 7 · allow node · 신뢰 ok$/m);
  // 9라운드 측정의 재현: 설치된 CLI에 깃발이 없으면(2.1.289의 --max-turns처럼) 첫 spawn 전에 선다
  fakeClaude(HELP.filter((f) => !f.startsWith('--agent')));
  const noAgent = script('conduct', ['check'], repo, env);
  assert.equal(noAgent.status, 1); assert.match(noAgent.out, /^FAIL conduct check 1\n- claude에 없는 깃발: --agent — 기본 spawner\(-p --agent --output-format --permission-mode --permission-prompts\)가 서지 않는다: GARAGISTE 갱신/);
  fakeClaude(HELP);
  const custom = script('conduct', ['check', '--spawner', 'node x.mjs'], repo, { HOME: home });
  assert.match(custom.out, /^PASS conduct check — doctor OK · VERSION [0-9a-f]{7} · 잠금 없음 · spawner 사용자 지정/, custom.out);
  fs.mkdirSync(path.join(repo, '.garagiste/session'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.garagiste/session/conduct.json'), JSON.stringify({ pid: process.pid, step: 'run', at: 'now' }));
  assert.match(script('conduct', ['check'], repo, env).out, /^FAIL conduct check 1\n- 이미 돌고 있다 — pid \d+/);
});
// 5라운드(2026-10-04, Q9 스폰 방법): opencode 설치본엔 .claude/agents가 없어 기본 spawner(claude -p --agent)가 서지 않는다 — 템플릿 없이 돌리면 팩마다 비정상 종료 → 프레임워크 FAIL로 끝났을 길을 한 줄로 앞당긴다.
test('conduct(opencode 설치본): --spawner 없이는 check도 본 실행도 한 줄로 선다(잠금 전에), --spawner가 있으면 check PASS', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t, 'opencode'); if (!repo) return;
  const chk = script('conduct', ['check'], repo);
  assert.equal(chk.status, 1, chk.out);
  assert.match(chk.out, /^FAIL conduct check 1\n- opencode 설치본 — 기본 spawner\(claude -p … --agent <팩>\)는 \.claude\/agents 없이 서지 않는다: --spawner [^\n]*opencode run --agent \{pack\}/);
  const bare = script('conduct', ['--max-steps', '1'], repo);
  assert.equal(bare.status, 1, bare.out); assert.match(bare.out, /^FAIL conduct: opencode 설치본 — 기본 spawner/);
  assert.ok(!fs.existsSync(path.join(repo, '.garagiste/session/conduct.json')), '잠금을 잡기 전에 선다');
  assert.match(script('conduct', ['check', '--spawner', `node ${FAKE}`], repo).out, /^PASS conduct check — doctor OK · VERSION [0-9a-f]{7} · 잠금 없음 · spawner 사용자 지정\(opencode\)/);
});
// 5라운드(2026-10-04, Q8 후반·Q9): opencode 가드 플러그인을 실제로 띄운다 — .ts를 node의 type stripping으로(실전에선 opencode의 bun이 돈다).
// 플러그인의 결정 = 같은 입력의 decide()(Claude 훅도 그 위의 껍질) — 패리티는 이 테스트가 묶고, 손 동기화(v1 패리티병)는 없다.
const DRIVER = [
  "import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';",
  'const [repo, casesPath] = process.argv.slice(2);',
  "const { Guard } = await import(pathToFileURL(path.join(repo, '.opencode/plugins/guard.ts')).href);",
  "const { decide, makeCtx } = await import(pathToFileURL(path.join(repo, '.garagiste/scripts/guard-rules.mjs')).href);",
  'const hooks = await Guard({ directory: repo });',
  "const MAP = { bash: 'Bash', edit: 'Edit', write: 'Write', patch: 'Edit', multiedit: 'MultiEdit', read: 'Read' };",
  'const out = []; let n = 0;',
  "for (const c of JSON.parse(fs.readFileSync(casesPath, 'utf8'))) {",
  "  const callID = 'c' + (++n); let plugin = null;",
  "  try { await hooks['tool.execute.before']({ tool: c.tool, sessionID: 's', callID }, { args: c.args }); } catch (e) { plugin = e.message; }",
  "  if (c.tool === 'task') await hooks['tool.execute.after']({ tool: 'task', sessionID: 's', callID }, { title: '', output: '', metadata: {} });",
  '  const tool = MAP[c.tool]; const cwd = c.args.workdir ? path.resolve(repo, c.args.workdir) : repo;',
  "  const ti = tool === 'Bash' ? { command: c.args.command } : { file_path: c.args.filePath ?? c.args.path ?? '' };",
  '  const r = tool ? decide({ tool_name: tool, tool_input: ti, cwd }, makeCtx(repo, { cwd, env: process.env, fs })) : null;',
  "  out.push({ name: c.name, plugin, rules: r ? '[guard] ' + r : null });",
  '}',
  'process.stdout.write(JSON.stringify(out));',
].join('\n');
test('opencode 가드 플러그인(실행): 원장·규칙집·배선 쓰기 · 인라인 코드 · 파괴적 git · worktree push · 팩 경계는 거부, 읽기·src·임시 폴더·read는 통과, 결정은 decide()와 같고, 거부마다 원장 guard 줄 + task 뒤 spawn_stop에 팩 이름', { timeout: 120000 }, (t) => {
  const [maj, min] = process.versions.node.split('.').map(Number);
  if (maj < 22 || (maj === 22 && min < 6)) return t.skip('node < 22.6 — .ts type stripping 없음(플러그인은 opencode의 bun이 돈다)');
  const repo = conductRepo(t, 'opencode'); if (!repo) return;
  const unitPath = path.join(repo, '.garagiste/units/hello.json');
  fs.writeFileSync(unitPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(unitPath, 'utf8')), state: 'build' })); // 팩 정체의 정본 = unit 상태
  fs.mkdirSync(path.join(repo, '.worktrees/hello/src'), { recursive: true });
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-other-'));
  const ledger = path.join(repo, '.garagiste/ledger/evidence.jsonl');
  const cases = [
    { name: 'write ledger', deny: true, tool: 'write', args: { filePath: ledger, content: '{}' } },
    { name: 'write team.json', deny: true, tool: 'write', args: { filePath: path.join(repo, '.garagiste/team.json'), content: '{}' } },
    { name: 'write wiring', deny: true, tool: 'write', args: { filePath: path.join(repo, '.opencode/plugins/guard.ts'), content: '' } },
    { name: 'bash redirect ledger', deny: true, tool: 'bash', args: { command: 'echo x >> .garagiste/ledger/evidence.jsonl' } },
    { name: 'bash inline node', deny: true, tool: 'bash', args: { command: "node -e \"require('fs').appendFileSync('.garagiste/ledger/evidence.jsonl','x')\"" } },
    { name: 'bash destructive git', deny: true, tool: 'bash', args: { command: 'git rebase main' } },
    { name: 'bash worktree push', deny: true, tool: 'bash', args: { command: 'git push -u origin unit/hello', workdir: '.worktrees/hello' } },
    { name: 'edit acceptance from build', deny: true, tool: 'edit', args: { filePath: path.join(repo, '.worktrees/hello/tests/acceptance/hello.test.mjs'), oldString: 'a', newString: 'b' } },
    { name: 'edit src from build', deny: false, tool: 'edit', args: { filePath: path.join(repo, '.worktrees/hello/src/cli.mjs'), oldString: 'a', newString: 'b' } },
    { name: 'bash read ledger', deny: false, tool: 'bash', args: { command: 'grep -c ship .garagiste/ledger/evidence.jsonl' } },
    { name: 'write temp outside', deny: false, tool: 'write', args: { filePath: path.join(other, 'fixture.json'), content: '{}' } },
    { name: 'read tool', deny: false, tool: 'read', args: { filePath: ledger } },
    { name: 'read secret', deny: true, tool: 'read', args: { filePath: path.join(repo, '.env') } }, // 6라운드: 읽기는 경계가 아니다 — 비밀만
    { name: 'bash cat secret', deny: true, tool: 'bash', args: { command: 'cat .env' } },
    { name: 'task build', deny: false, tool: 'task', args: { description: 'build', prompt: '.garagiste/session/packs/x.md', subagent_type: 'build' } },
  ];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-driver-'));
  fs.writeFileSync(path.join(dir, 'package.json'), '{ "type": "module" }');
  fs.writeFileSync(path.join(dir, 'drive.mjs'), DRIVER);
  fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(cases));
  const r = run(process.execPath, ['--experimental-strip-types', path.join(dir, 'drive.mjs'), repo, path.join(dir, 'cases.json')], repo);
  assert.equal(r.status, 0, r.out);
  const results = JSON.parse(r.out.slice(r.out.indexOf('[{'), r.out.lastIndexOf('}]') + 2)); // stderr의 ExperimentalWarning은 밖
  for (const c of cases) {
    const got = results.find((x) => x.name === c.name);
    assert.equal(got.plugin, got.rules, `패리티 ${c.name}: plugin=${got.plugin} rules=${got.rules}`);
    assert.equal(!!got.plugin, c.deny, `${c.name}: ${got.plugin}`);
  }
  const L = ledgerOf(repo);
  assert.equal(L.filter((e) => e.kind === 'guard').length, cases.filter((c) => c.deny).length, '거부마다 원장 guard 줄');
  assert.ok(L.some((e) => e.kind === 'spawn_stop' && e.pack === 'build'), 'task가 끝나면 spawn_stop에 팩 이름 — Claude SubagentStop(agent_type)과 같은 꼴');
});
// 6라운드(2026-10-04) — 고아 팩 측정: 드라이버를 SIGKILL하면 팩은 산다(spawnSync 시절엔 다음 드라이버가 죽은 잠금을 갈아 끼우고 같은 unit의 팩을 또 띄웠다 — 둘이 한 worktree에).
// 비동기 spawn + 잠금의 child pid로 다음 conduct·check·STATUS가 「팩이 아직 돈다」로 서고, 팩이 끝나면(여기선 끊는다) 이어서 돈다. 드라이버의 SIGTERM은 팩에 넘기고 잠금을 정리한다.
test('conduct 안전벨트(6라운드): 드라이버가 죽어도 팩은 산다 — 잠금의 child pid로 다음 conduct·check·STATUS가 「고아 팩」으로 서고, 팩이 끝나면 이어서 돈다 · SIGTERM은 팩에 넘기고 잠금 정리·원장 stop signal', { timeout: 120000 }, async (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const lockPath = path.join(repo, '.garagiste/session/conduct.json');
  const start = () => { const d = spawn(process.execPath, [path.join(repo, '.garagiste/scripts/conduct.mjs'), '--spawner', `node ${FAKE}`, '--max-steps', '3'], { cwd: repo, env: { ...ENV, GARAGISTE_FAKE_MODE: 'hang' }, stdio: ['ignore', 'pipe', 'pipe'] }); d.stdout.resume(); d.stderr.resume(); return d; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const readLock = () => (fs.existsSync(lockPath) ? JSON.parse(fs.readFileSync(lockPath, 'utf8')) : null);
  const waitLock = async (pred) => { for (let i = 0; i < 150; i++) { const l = readLock(); if (l && pred(l)) return l; await sleep(200); } throw new Error('잠금 대기 초과: ' + JSON.stringify(readLock())); };
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
  // 1) 드라이버 SIGKILL — 팩(가짜, hang 20초)은 산다 → 다음 드라이버·check·STATUS가 선다
  const d1 = start();
  const lock = await waitLock((l) => l.step === 'spawn' && l.child);
  assert.equal(lock.pid, d1.pid); assert.ok(alive(lock.child), '팩 pid가 잠금에, 살아 있다');
  d1.kill('SIGKILL'); await new Promise((r) => d1.once('close', r));
  assert.ok(alive(lock.child), '드라이버가 죽어도 팩은 산다 — 고아');
  const again = conduct(repo, ['--max-steps', '1']);
  assert.equal(again.status, 1, again.out);
  assert.match(again.out, new RegExp(`^FAIL conduct: 앞 드라이버\\(pid ${d1.pid}\\)는 죽었는데 그 팩 프로세스\\(pid ${lock.child} · hello spec\\)가 아직 돈다 — 끝나길 기다리거나 kill ${lock.child} 뒤 다시`));
  assert.match(script('conduct', ['check', '--spawner', 'x'], repo).out, /^FAIL conduct check 1\n- 고아 팩 — 앞 드라이버\(pid \d+\)는 죽었는데/);
  script('state', [], repo);
  assert.match(fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8'), /- conduct는 죽었는데 팩 프로세스가 돈다\(고아 팩\) — pid \d+ · hello spec · 끝나길 기다리거나 kill \d+ 뒤 conduct/);
  // 2) 팩이 끝나면 이어서 돈다
  process.kill(lock.child, 'SIGKILL'); for (let i = 0; i < 50 && alive(lock.child); i++) await sleep(100);
  const resume = conduct(repo, ['--max-steps', '1']);
  assert.equal(resume.status, 5, resume.out);
  // 3) SIGTERM은 팩에 넘긴다 — 종료 코드 cap(5), 잠금 정리, 원장 conduct stop signal, 팩 죽음
  const d2 = start();
  const lock2 = await waitLock((l) => l.step === 'spawn' && l.child && l.pid === d2.pid);
  d2.kill('SIGTERM'); const code = await new Promise((r) => d2.once('close', r));
  assert.equal(code, 5, 'signal 멈춤은 cap(5) — 다시 돌리면 이어서');
  for (let i = 0; i < 50 && alive(lock2.child); i++) await sleep(100);
  assert.ok(!alive(lock2.child), '팩에 SIGTERM이 전달됐다');
  assert.ok(!fs.existsSync(lockPath), '잠금 정리');
  assert.ok(ledgerOf(repo).some((e) => e.kind === 'conduct' && e.event === 'stop' && e.stop === 'signal' && /SIGTERM — 팩\(pid \d+\)에 SIGTERM/.test(e.text)), '원장 stop signal');
});
// kind refactor — R&D 7라운드(2026-10-04, 백로그 Q13 「동작 보존 증명」): 레거시의 일상은 「동작 그대로 구조만」이다. red 증명이 뒤집힌다 — 핀은 base에서도 초록.
// 덤으로 드러난 드라이버 틈: attack이 red 0으로 끝나면 공격 파일만 더해진 tree엔 redproof·full이 없어 ship이 섰다 — next가 그 tree의 redproof·full을 한 걸음씩 시킨다.
test('kind refactor: 핀(현재 동작, base에서 초록) → PIN → build(구조만) → PASS pin_base=green head_green → attack(바뀐 동작 0) → tree의 redproof·full → ship(LEDGER 열 pin) · 동작이 바뀐 build는 redproof·ship이 거부 · base에서 red인 핀은 FAIL+hold(feature다) · 모르는 kind는 FAIL', { timeout: 180000 }, (t) => {
  const repo = legacyRepo(t); if (!repo) return;
  const teamPath = path.join(repo, '.garagiste/team.json'); const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test test/*.test.js', full: 'node --test test/*.test.js "tests/**/*.test.mjs"', test_file: 'node --test {files}', run: 'node bin/greet.js', setup: 'npm install' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2) + '\n');
  git(['add', '-A'], repo); assert.match(script('verify', ['quick'], repo).out, /^PASS verify:quick/);
  const sc = git(['commit', '-q', '-m', 'scaffold: commands'], repo, { GARAGISTE_SHIP: '1' }); assert.equal(sc.status, 0, sc.out);
  assert.match(script('work', ['new', 'bogus-kind', 'y', '--kind', 'bogus'], repo).out, /^FAIL kind bogus — feature\(기본\)\|scaffold\|adopt\|refactor/);
  assert.match(script('work', ['new', 'greet-fn', 'greet를 함수 선언으로 — 동작 그대로', '--kind', 'refactor'], repo).out, /^UNIT greet-fn spec[\s\S]*REFACTOR — 동작 보존/);
  const r = conduct(repo);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /SPAWN greet-fn spec[\s\S]*│ PIN greet-fn 1\/1 — 현재 동작이 고정됐다[\s\S]*NEXT run node \.garagiste\/scripts\/brief\.mjs build greet-fn — PIN — 현재 동작이 고정됐다, 구조만 바꾼다[\s\S]*SPAWN greet-fn build[\s\S]*│ PASS redproof greet-fn pin_base=green head_green — 동작 보존\(핀 1\)[\s\S]*SPAWN greet-fn attack[\s\S]*ATTACK greet-fn red 0\/1[\s\S]*NEXT run node \.garagiste\/scripts\/redproof\.mjs greet-fn — red 0 — 공격 파일이 더해져 tree가 움직였다[\s\S]*PASS redproof greet-fn pin_base=green head_green[\s\S]*NEXT run node \.garagiste\/scripts\/verify\.mjs full greet-fn — red 0 — 이 tree의 full PASS가 원장에 없다[\s\S]*PASS verify:full[\s\S]*SHIPPED greet-fn [0-9a-f]{7}/, r.out);
  assert.ok(ledgerOf(repo).filter((e) => e.kind === 'redproof' && e.slug === 'greet-fn' && e.refactor && e.pin_base === 'green').length >= 3, '원장 redproof 줄에 refactor·pin_base');
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| greet-fn \| [0-9a-f]{7} \| [0-9a-f]{7} \| PASS \| pin_base=green head_green \|/);
  assert.match(fs.readFileSync(path.join(repo, 'lib/greet.js'), 'utf8'), /function greet\(n\)/, '구조는 바뀌었다');
  assert.equal(run(process.execPath, ['bin/greet.js'], repo).out, 'hi there\n', '동작은 그대로');
  const packs = fs.readdirSync(path.join(repo, '.garagiste/session/packs'));
  const specPack = fs.readFileSync(path.join(repo, '.garagiste/session/packs', packs.find((f) => f.startsWith('greet-fn-spec-'))), 'utf8');
  assert.match(specPack, /## refactor — 동작 보존[\s\S]*「현재 동작의 핀」[\s\S]*pin_base=green·head_green/, '팩에 refactor 절(코드 — 산문 상한 밖)');
  // 부정 1: 동작이 바뀐 build(break) — redproof FAIL(동작이 바뀌었다) · ship FAIL(동작 보존 증명 없음) · main은 그대로
  assert.match(script('work', ['new', 'greet-default', 'greet 기본값 조립을 상수로 — 동작 그대로', '--kind', 'refactor'], repo).out, /^UNIT greet-default spec/);
  const broken = conduct(repo, ['--max-steps', '4'], { GARAGISTE_FAKE_MODE: 'break' });
  assert.equal(broken.status, 5, broken.out);
  const red = script('redproof', ['greet-default'], repo);
  assert.equal(red.status, 1); assert.match(red.out, /^FAIL redproof greet-default: 동작이 바뀌었다 — 핀이 head에서 red: tests\/acceptance\/greet-default\.test\.mjs \(base에서는 초록\)\. refactor는 동작을 바꾸지 않는다 → build가 되돌린다/);
  const ship = script('ship', ['greet-default'], repo);
  assert.match(ship.out, /^FAIL ship greet-default \d\/8[\s\S]*- redproof: 동작 보존 증명 없음\(핀 base·head 초록 — kind refactor\)/, ship.out);
  assert.equal(run(process.execPath, ['bin/greet.js'], repo).out, 'hi there\n', 'main엔 닿지 않았다');
  // 부정 2: base에서 red인 핀 — 현재 동작이 아니다(feature다), hold 안내
  assert.match(script('work', ['drop', 'greet-default', '시험 끝', '--forget'], repo).out, /^DROPPED/);
  assert.match(script('work', ['new', 'greet-shout', 'greet를 대문자로(동작 그대로라고 잘못 적음)', '--kind', 'refactor'], repo).out, /^UNIT greet-shout spec/);
  const wt = path.join(repo, '.worktrees', 'greet-shout');
  write(wt, 'tests/acceptance/greet-shout.test.mjs', "// @claim 현재 동작: greet Ada → HI ADA\n// @milestone M1\n// @sensor machine@linux\nimport test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('핀?', () => assert.equal(spawnSync(process.execPath, ['bin/greet.js', 'Ada'], { encoding: 'utf8' }).stdout, 'HI ADA\\n'));\n");
  git(['add', '-A'], wt); assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'test(greet-shout): 핀?\n\nUnit: greet-shout\nStep: 1'], wt).status, 0);
  const pinRed = script('redproof', ['greet-shout'], repo);
  assert.equal(pinRed.status, 1); assert.match(pinRed.out, /^FAIL redproof greet-shout: 핀이 base에서 red — tests\/acceptance\/greet-shout\.test\.mjs — 현재 동작이 아니다[\s\S]*work\.mjs ask greet-shout "핀이 base에서 red[^"]*" --hold/);
});
// kind pin — R&D 13라운드(2026-10-04, 백로그 「2순위: 이미 충족된 주장 박기」 — 필드 시험 2의 web persist·browser-check · 파이썬 no-network · 12라운드 실전 run의 discount-reject):
// redproof 「base에서 green」의 유일한 길이 drop이라 주장 파일이 dropped 브랜치로 갔다. 둘째 길 — 회귀 증거로 고정해 출하(핀 증명 재사용 · build 없음 · attack 한 바퀴).
test('kind pin: (1) redproof base green → hold → decide → work.mjs pin → PIN → attack(red 0) → ship(LEDGER pin) — 주장 파일이 main에 남는다 · (2) --kind pin 직접(제약형 요구) 끝까지 · (3) pin은 spec 단계의 feature·refactor에만', { timeout: 180000 }, (t) => {
  const repo = legacyRepo(t); if (!repo) return;
  const teamPath = path.join(repo, '.garagiste/team.json'); const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  team.commands = { quick: 'node --test test/*.test.js', full: 'node --test test/*.test.js "tests/**/*.test.mjs"', test_file: 'node --test {files}', run: 'node bin/greet.js', setup: 'npm install' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2) + '\n');
  git(['add', '-A'], repo); assert.match(script('verify', ['quick'], repo).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: commands'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  // (1) hold 경로 — 이미 참인 주장(greet Bo → hi Bo)을 feature로 열었다
  assert.match(script('work', ['new', 'greet-keeps', 'greet <이름>은 hi <이름>을 찍는다(그대로)'], repo).out, /^UNIT greet-keeps spec/);
  const wt = path.join(repo, '.worktrees', 'greet-keeps');
  assert.match(script('brief', ['spec', 'greet-keeps'], repo).out, /^PACK /);
  write(wt, 'tests/acceptance/greet-keeps.test.mjs', "// @claim greet Bo → hi Bo\n// @milestone M1\n// @sensor machine@linux\nimport test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('이미 참', () => assert.equal(spawnSync(process.execPath, ['bin/greet.js', 'Bo'], { encoding: 'utf8' }).stdout, 'hi Bo\\n'));\n");
  git(['add', '-A'], wt); assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'test(greet-keeps): 주장\n\nUnit: greet-keeps\nStep: 1'], wt).status, 0);
  assert.match(script('work', ['spawned', 'greet-keeps', 'spec'], repo).out, /^SPAWN/);
  const green = script('redproof', ['greet-keeps'], repo);
  assert.equal(green.status, 1); assert.match(green.out, /^FAIL redproof greet-keeps: base에서 green[\s\S]*work\.mjs drop greet-keeps[\s\S]*회귀 증거로 고정해 출하한다 → node \.garagiste\/scripts\/work\.mjs pin greet-keeps \(kind pin[\s\S]*이미 충족: 닫을까\(drop\) · 회귀 증거로 고정해 출하할까\(pin\)" --hold/, green.out);
  assert.match(script('work', ['pin', 'greet-keeps'], repo, { GARAGISTE_CONDUCT: '' }).out, /^PIN greet-keeps — kind feature → pin/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /^- \[ \] greet-keeps · .* · kind: pin$/m, 'BACKLOG 줄의 kind도');
  assert.match(script('work', ['pin', 'greet-keeps'], repo).out, /^PIN greet-keeps — 이미 pin이다/);
  assert.match(script('next', [], repo).out, /^NEXT run node \.garagiste\/scripts\/redproof\.mjs greet-keeps — 마지막 redproof가 FAIL/);
  const r = conduct(repo);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /PIN greet-keeps 1\/1 — 이미 충족된 주장이 회귀 증거로 고정됐다[\s\S]*NEXT run node \.garagiste\/scripts\/brief\.mjs attack greet-keeps — PIN — 이미 충족된 주장이 회귀 증거로 고정됐다\(base에서 초록\), build 없음[\s\S]*SPAWN greet-keeps attack[\s\S]*ATTACK greet-keeps red 0\/1[\s\S]*SHIPPED greet-keeps/, r.out);
  assert.doesNotMatch(r.out, /SPAWN greet-keeps build/, 'pin엔 build가 없다(공격이 red일 때만)');
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| greet-keeps \| [0-9a-f]{7} \| [0-9a-f]{7} \| PASS \| pin_base=green head_green \(pin\) \|/);
  assert.ok(fs.existsSync(path.join(repo, 'tests/acceptance/greet-keeps.test.mjs')), '주장 파일이 main에 남는다 — drop이면 dropped 브랜치로 갔다');
  assert.ok(ledgerOf(repo).some((e) => e.kind === 'rekind' && e.slug === 'greet-keeps' && e.from === 'feature' && e.to === 'pin'), '원장 rekind 줄');
  const packs = fs.readdirSync(path.join(repo, '.garagiste/session/packs'));
  const atkPack = fs.readFileSync(path.join(repo, '.garagiste/session/packs', packs.find((f) => f.startsWith('greet-keeps-attack-'))), 'utf8');
  assert.match(atkPack, /## pin — 이미 충족된 주장을 회귀 증거로[\s\S]*고정된 주장이 깨지는 입력/, '팩에 pin 절(코드 — 산문 상한 밖)');
  // (2) 제약형 요구는 처음부터 --kind pin — 가짜 팩이 핀을 쓰고(base에서 초록) attack까지 끝낸다
  assert.match(script('work', ['new', 'greet-no-net', 'greet는 네트워크를 쓰지 않는다', '--kind', 'pin'], repo).out, /^UNIT greet-no-net spec[\s\S]*PIN — 이미 충족된 주장/);
  const r2 = conduct(repo);
  assert.equal(r2.status, 2, r2.out);
  assert.match(r2.out, /SPAWN greet-no-net spec[\s\S]*│ PIN greet-no-net 1\/1 — 이미 충족된 주장이 회귀 증거로 고정됐다[\s\S]*SPAWN greet-no-net attack[\s\S]*SHIPPED greet-no-net/, r2.out);
  // (3) pin의 자리: shipped·build 뒤는 거부
  assert.match(script('work', ['pin', 'greet-keeps'], repo).out, /^FAIL greet-keeps은 shipped — pin은 진행 중 unit에만/);
  assert.match(script('work', ['pin', 'nope'], repo).out, /^FAIL/);
});
// 14라운드(2026-10-04, 세 run의 승인 거부 10건 전부 `cd <worktree> && git reset --soft HEAD~1 && …`): build가 wip 체크포인트를 풀어 정식 커밋으로 얹는 일은 스크립트가 — `cd && node …`만 무인 세션을 지난다.
test('checkpoint.mjs unwip: worktree의 wip HEAD를 풀어 변경을 인덱스에(정식 커밋은 팩이) · wip 아니면 PASS 한 줄 · 메인에서는 FAIL · brief의 이어받기 절이 그 명령을 가리킨다', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  assert.match(script('work', ['new', 'wipcase', '이어받기 시험'], repo).out, /^UNIT wipcase spec/);
  const wt = path.join(repo, '.worktrees', 'wipcase');
  assert.match(script('checkpoint', ['unwip'], wt).out, /^PASS unwip — HEAD는 wip가 아니다/);
  write(wt, 'note.txt', 'x\n'); git(['add', '-A'], wt);
  assert.equal(git(['commit', '-q', '-m', 'wip: wipcase checkpoint'], wt, { GARAGISTE_WIP: '1' }).status, 0);
  const before = git(['rev-parse', 'HEAD~1'], wt).out.trim();
  const r = script('checkpoint', ['unwip'], wt);
  assert.equal(r.status, 0, r.out); assert.match(r.out, /^UNWIP wip: wipcase checkpoint — wip 커밋을 풀었다\(HEAD [0-9a-f]{7} · 인덱스에 1개\) → 이어서 일하고 정식 커밋을 만들라/);
  assert.equal(git(['rev-parse', 'HEAD'], wt).out.trim(), before, 'HEAD가 한 칸 뒤로');
  assert.equal(git(['diff', '--cached', '--name-only'], wt).out.trim(), 'note.txt', '변경은 인덱스에 남는다');
  assert.ok(fs.existsSync(path.join(wt, 'note.txt')), '작업 트리는 그대로');
  const main = script('checkpoint', ['unwip'], repo);
  assert.equal(main.status, 1); assert.match(main.out, /^FAIL unwip: 메인에서는 풀지 않는다/);
  assert.match(script('checkpoint', [], wt).out, /^사용법: checkpoint\.mjs unwip/);
  // brief의 「이어받기」 절(wip HEAD)이 그 명령을 가리킨다 — 팩은 git reset을 직접 치지 않는다(build 팩은 인수 테스트가 있어야 조립된다)
  write(wt, 'tests/acceptance/wipcase.test.mjs', "// @claim 이어받기\n// @milestone M1\n// @sensor machine@linux\nimport test from 'node:test'; test('claim', () => { throw new Error('red'); });\n");
  git(['add', '-A'], wt); assert.equal(git(['commit', '-q', '-m', 'wip: wipcase checkpoint'], wt, { GARAGISTE_WIP: '1' }).status, 0);
  const bp = script('brief', ['build', 'wipcase'], repo);
  assert.match(bp.out, /^PACK /, bp.out);
  const packText = fs.readFileSync(path.join(repo, bp.out.split(' ')[1]), 'utf8');
  assert.match(packText, /HEAD는 wip 체크포인트다\. 첫 명령: `node \.garagiste\/scripts\/checkpoint\.mjs unwip`/, '이어받기 절');
  assert.doesNotMatch(packText, /첫 명령: `git reset --soft/, '팩이 칠 git reset은 없다');
});
// Q14 사람-증거 레인 첫 조각(R&D 8라운드 2026-10-04 — 윈도우 M1 관찰 「사람 확인 집계 1/9」): CEO가 본 것(스크린샷·녹화·빌드)이 파일로 원장의 증거가 된다.
test('tried --evidence: 파일을 docs/units/<slug>/evidence/로 복사하고 docs 차선으로 커밋(main은 깨끗) · 원장 tried.evidence · STATUS 「사람 증거」 · 없는 파일은 FAIL', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  assert.match(conduct(repo).out, /SHIPPED hello/);
  const shot = path.join(os.tmpdir(), `garagiste-shot-${process.pid}.png`); fs.writeFileSync(shot, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const note = path.join(os.tmpdir(), `garagiste-note-${process.pid}.txt`); fs.writeFileSync(note, 'hello Ada 가 보였다\n');
  assert.match(script('work', ['tried', 'hello', 'ok', '봤다', '--evidence', `${shot},/nonexistent/x.png`], repo).out, /^FAIL tried hello: 증거 파일 없음 — \/nonexistent\/x\.png/);
  assert.ok(!ledgerOf(repo).some((e) => e.kind === 'tried'), '없는 파일이면 아무것도 남기지 않는다(fail-closed)');
  const ok = script('work', ['tried', 'hello', 'ok', '봤다', '--evidence', `${shot},${note}`], repo);
  assert.match(ok.out, /^PASS tried hello ok · 증거 2 → docs\/units\/hello\/evidence\//, ok.out);
  for (const f of [path.basename(shot), path.basename(note)]) assert.ok(fs.existsSync(path.join(repo, 'docs/units/hello/evidence', f)), f);
  assert.equal(git(['ls-files', 'docs/units/hello/evidence'], repo).out.trim().split('\n').length, 2, '증거는 추적된다');
  assert.ok(!git(['status', '--porcelain'], repo).out.includes('evidence'), 'docs 차선으로 커밋됐다 — 다음 ship이 「미커밋 변경」으로 서지 않는다');
  assert.match(git(['log', '-1', '--format=%s'], repo).out, /^docs\(tried\): hello 증거 2/);
  const tr = ledgerOf(repo).filter((e) => e.kind === 'tried' && e.slug === 'hello').pop();
  assert.deepEqual(tr.evidence, [`docs/units/hello/evidence/${path.basename(shot)}`, `docs/units/hello/evidence/${path.basename(note)}`]);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(repo, '.garagiste/units/hello.json'), 'utf8')).tried.evidence, tr.evidence);
  script('state', [], repo);
  assert.match(fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8'), /## 사람 증거\n- hello: 2 — docs\/units\/hello\/evidence\//);
});
// 갱신 미리보기(10라운드 2026-10-04, Q11 「diff를 보이는 명시적 갱신」): 6~9라운드가 「install.sh 다시」를 요구했다 — 무엇이 바뀌는지 보여야 하고,
// 배선 설정은 덮지 않되 다르면 알려야 한다(6라운드의 Read 매처가 옛 설치본에 닿지 않았다 — 설치는 settings.json을 보존한다).
test('갱신 미리보기: 소스의 doctor.mjs --diff <설치본>이 바뀌는 파일·배선 설정 다름·설치본에만 있는 파일을 한 줄로(agents의 model: 차이는 조용) · install -DryRun·재설치가 그 줄을 보인다 · 다른 settings.json은 덮지 않고 settings.garagiste.json + 안내 · doctor가 Read 매처 없음을 짚되 막지 않는다', { timeout: 120000 }, (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const diff = () => run(process.execPath, [path.join(GARAGISTE, 'team/scripts/doctor.mjs'), '--diff', repo], repo).out.trim();
  assert.match(diff(), /^UPGRADE 같은 판 — 비교 \d+ 파일 모두 같다\([0-9a-f]{7} → [0-9a-f]{7}\)$/, diff());
  assert.match(script('doctor', ['--diff', repo], repo).out, /^FAIL doctor --diff는 GARAGISTE 소스의/, '설치본의 doctor는 옛것일 수 있다');
  fs.appendFileSync(path.join(repo, '.garagiste/scripts/ship.mjs'), '\n// old\n');
  fs.writeFileSync(path.join(repo, '.garagiste/packs/old.md'), '# 옛 팩\n');
  assert.match(diff(), /^UPGRADE [0-9a-f]{7} → [0-9a-f]{7} — 바뀌는 파일 1 · 설치본에만 1\(지우지 않는다\): \.garagiste\/scripts\/ship\.mjs \?\.garagiste\/packs\/old\.md$/, diff());
  // 배선 설정을 손으로 바꿨다(매처에서 Read를 뺐다) — 설치는 덮지 않고, doctor는 짚되 막지 않는다
  const sp = path.join(repo, '.claude/settings.json'); const st = JSON.parse(fs.readFileSync(sp, 'utf8'));
  st.permissions.allow.push('Bash(mycli:*)'); st.hooks.PreToolUse[0].matcher = 'Bash|PowerShell|Edit|Write|MultiEdit|NotebookEdit'; fs.writeFileSync(sp, JSON.stringify(st, null, 2) + '\n');
  assert.match(script('doctor', [], repo).out, /^FAIL doctor \d+[\s\S]*- \.claude\/settings\.json PreToolUse 매처에 Read 없음/); // 첫 세션 전엔 alive 마커 줄도 함께 — 그건 --fresh가 거른다
  assert.match(script('doctor', ['--fresh'], repo).out, /^OK doctor/, '매처 드리프트는 경고 — 설치·ship·conduct를 막지 않는다');
  assert.match(diff(), /바뀌는 파일 1 · 배선 설정 다름 1\(덮지 않는다 — 병합\) · 설치본에만 1\(지우지 않는다\): \.garagiste\/scripts\/ship\.mjs !\.claude\/settings\.json \?\.garagiste\/packs\/old\.md$/, diff());
  const dry = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-DryRun'], repo);
  assert.match(dry.out, /UPGRADE [0-9a-f]{7} → [0-9a-f]{7} — 바뀌는 파일 1 · 배선 설정 다름 1/, dry.out);
  assert.ok(/\/\/ old/.test(fs.readFileSync(path.join(repo, '.garagiste/scripts/ship.mjs'), 'utf8')), 'DryRun은 아무것도 바꾸지 않는다');
  const up = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-SkipSelftest'], repo);
  assert.equal(up.status, 0, up.out);
  assert.match(up.out, /UPGRADE [0-9a-f]{7} → [0-9a-f]{7} — 바뀌는 파일 1 · 배선 설정 다름 1[\s\S]*\.claude\/settings\.json이 team의 것과 다르다 → \.claude\/settings\.garagiste\.json에 두었다/, up.out);
  assert.ok(!/\/\/ old/.test(fs.readFileSync(path.join(repo, '.garagiste/scripts/ship.mjs'), 'utf8')), '스크립트는 갱신됐다');
  assert.ok(JSON.parse(fs.readFileSync(sp, 'utf8')).permissions.allow.includes('Bash(mycli:*)'), '사용자 설정은 그대로');
  assert.ok(fs.existsSync(path.join(repo, '.claude/settings.garagiste.json')), 'team의 설정이 옆에');
  assert.match(diff(), /바뀌는 파일 0 · 배선 설정 다름 1\(덮지 않는다 — 병합\) · 설치본에만 1/, '갱신 뒤엔 배선 설정과 옛 팩만 남는다');
});
// 11라운드(2026-10-04): GUIDE의 「동시에 돌리지 않는다 — 잠금이 막는다」는 conduct 둘만 막았다 — 대화형 conductor의 brief·ship·seed는 그대로 돌아 같은 unit을 두 번 띄울 수 있었다(L2 1일차 병렬 seed = 사고 26의 토양).
test('상호배제(11라운드): conduct가 도는 동안 밖에서 부른 brief·ship·seed는 한 줄로 선다 — GARAGISTE_CONDUCT가 잠금 pid와 같으면(conduct의 자식) 통과, conduct가 끝나면 다시 돈다', { timeout: 120000 }, async (t) => {
  const repo = conductRepo(t); if (!repo) return;
  const lockPath = path.join(repo, '.garagiste/session/conduct.json');
  const d = spawn(process.execPath, [path.join(repo, '.garagiste/scripts/conduct.mjs'), '--spawner', `node ${FAKE}`, '--max-steps', '3'], { cwd: repo, env: { ...ENV, GARAGISTE_FAKE_MODE: 'hang' }, stdio: ['ignore', 'pipe', 'pipe'] }); d.stdout.resume(); d.stderr.resume();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let lock = null; for (let i = 0; i < 150 && !(lock && lock.step === 'spawn'); i++) { await sleep(200); try { lock = JSON.parse(fs.readFileSync(lockPath, 'utf8')); } catch { lock = null; } }
  assert.ok(lock && lock.step === 'spawn', '팩이 도는 중: ' + JSON.stringify(lock));
  const busy = /^FAIL conduct가 돌고 있다\(pid \d+ · spawn hello spec · [^)]+\) — 대화형 conductor는 그동안 쉰다/;
  assert.match(script('brief', ['build', 'hello'], repo).out, busy, 'brief');
  assert.match(script('ship', ['hello'], repo).out, busy, 'ship');
  assert.match(script('work', ['seed'], repo).out, busy, 'seed');
  assert.doesNotMatch(script('brief', ['build', 'hello'], repo, { GARAGISTE_CONDUCT: String(lock.pid) }).out, /conduct가 돌고 있다/, 'conduct의 자식(env 일치)은 지나간다');
  d.kill('SIGTERM'); await new Promise((r) => d.once('close', r));
  assert.ok(!fs.existsSync(lockPath), '잠금 정리');
  assert.doesNotMatch(script('work', ['seed'], repo).out, /conduct가 돌고 있다/, '끝나면 다시 돈다');
});
