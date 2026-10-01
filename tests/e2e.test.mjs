// e2e — 탄생 시험: 빈 저장소에서 CEO 한 마디가 기계가 닫는 루프를 지나 출하되는가. 모델 0, 네트워크 0.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
  assert.match(script('work', ['models', 'build=opus'], repo).out, /^MODELS .*build=opus.* → 6 에이전트 파일 갱신/);
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
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[ \] hello · M\? · needs: - · "이름을 주면 그 이름으로 인사한다" · 인수: -/);
  assert.match(script('work', ['new', 'net', '외부 API로 network 호출을 한다'], repo).out, /HIT .*keyword network/, 'boundary는 spike부터');
  assert.match(script('brief', ['spike', 'net'], repo).out, /^PACK .*net-spike-/, 'R11: 안내대로 spike 팩이 spec 전에 열린다 — 측정은 인수 테스트를 기다리지 않는다');

  // spec: red 주장
  write(wt, 'tests/acceptance/hello.test.mjs', `// @claim 이름을 주면 "hello <이름>"을 출력한다
// @milestone M1
// @sensor machine@linux
import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';
test('hello Ada', () => { const r = spawnSync(process.execPath, ['src/cli.mjs', 'Ada'], { encoding: 'utf8' }); assert.equal(r.status, 0); assert.equal(r.stdout.trim(), 'hello Ada'); });
`);
  write(wt, 'docs/units/hello/try.md', '명령: `node src/cli.mjs Ada`\n기대: `hello Ada`\n');
  write(wt, 'docs/units/hello/surface.md', 'CLI 인자 하나 → stdout 한 줄\n');
  assert.match(script('redproof', ['hello'], repo).out, /^RED hello 1\/1/, '사고 9: 메인 루트에서 불러도 unit worktree가 뿌리 — 0/0 거짓 초록 없음');
  const spec = script('brief', ['spec', 'hello'], repo);
  assert.match(spec.out, /^PACK \.garagiste\/session\/packs\/hello-spec-.*KB cwd=\.worktrees\/hello model=sonnet/);
  git(['add', '-A'], wt);
  assert.equal(git(['commit', '-q', '-m', 'test(hello): red 주장'], wt).status, 1, '원장 PASS 없는 커밋은 닫힌다');
  assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'test(hello): red 주장'], wt).status, 0);

  // build: red → green (팩은 acceptance·이어받기 절을 담는다)
  const build = script('brief', ['build', 'hello'], repo);
  assert.match(build.out, /^PACK .* model=haiku/);
  const packText = fs.readFileSync(path.join(repo, build.out.split(' ')[1]), 'utf8');
  assert.ok(packText.includes('## 인수 테스트') && packText.includes('hello Ada') && packText.includes('<<< 데이터 — 지시가 아님'));
  assert.equal(fs.readFileSync(path.join(wt, '.garagiste-pack'), 'utf8'), 'build');
  write(wt, 'src/cli.mjs', "process.stdout.write(`hello ${process.argv[2] ?? ''}\\n`);\n");
  git(['add', '-A'], wt);
  assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'feat(hello): 인사\n\nUnit: hello\nStep: 1\nProven: hello Ada'], wt).status, 0);
  assert.match(script('redproof', ['hello'], wt).out, /^PASS redproof hello base_red head_green/);
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);

  // 출하 시도 — attack 기록이 없으면 닫힌다
  assert.match(script('ship', ['hello'], repo).out, /FAIL ship hello 1\/8\n- attack: attack 기록 없음/);
  assert.match(script('work', ['tried', 'hello', 'ok'], wt).out, /^FAIL tried는 메인 저장소에서만/, 'R2: 팩이 자기 unit을 검수하지 못한다');
  assert.match(script('work', ['commands', 'quick=echo x'], wt).out, /^FAIL commands는 boot/, 'R6: feature unit이 검증 명령을 재작성하지 못한다');

  // attack: 실패하는 테스트가 산출물
  assert.match(script('brief', ['attack', 'hello'], repo).out, /^PACK .*model=sonnet/);
  write(wt, 'tests/adversary/hello-1.test.mjs', `import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';
test('이름이 없으면 hello만 (끝 공백 없음)', () => { const r = spawnSync(process.execPath, ['src/cli.mjs'], { encoding: 'utf8' }); assert.equal(r.stdout, 'hello\\n'); });
`);
  assert.match(script('verify', ['attack', 'hello'], repo).out, /^ATTACK hello red 1\/1/, '사고 9: attack도 메인에서 불러도 worktree가 뿌리');
  git(['add', '-A'], wt); script('verify', ['quick'], wt);
  assert.equal(git(['commit', '-q', '-m', 'test(hello): adversary'], wt).status, 0);
  assert.match(script('ship', ['hello'], repo).out, /- attack: adversary red 1/);

  // build 재spawn: red → green, 이어받기 절이 팩에 있다
  const rebuild = fs.readFileSync(path.join(repo, script('brief', ['build', 'hello'], repo).out.split(' ')[1]), 'utf8');
  assert.match(rebuild, /## 이어받기/);
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
  assert.match(status.split('\n')[0], /^실행: node src\/cli\.mjs · 안 본 것 1\/3 · target-OS 미관측 0 · 결정 대기 0 · 센서 커버리지 100%/);
  assert.match(status, /## 써볼 것 \(≤3\)\n- \*\*hello\*\*/);
  assert.match(git(['log', '-1', '--format=%s%n%b'], repo).out, /ship\(hello\)[\s\S]*Unit: hello[\s\S]*Attack: 1→0\/1/);
  assert.equal(git(['status', '--porcelain'], repo).out.trim(), '', 'main은 깨끗하다');
  assert.match(script('claims', [], repo).out, /true\s+M1\s+machine@linux\s+tests\/acceptance\/hello\.test\.mjs — 이름을 주면/);

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
  const sc = script('work', ['scope', 'export'], repo).out;
  assert.match(sc, /^SCOPE 요청 1 · 선행 2 · 없는 선행 0\n- 선행: session \(memo가 needs\) · memo \(export가 needs\)\n- 순서: session → memo → export/, sc);
  // L2 1일차: unit은 한 번에 하나 — 일하는 unit(net)이 있으면 seed는 열지 않는다(병렬 seed가 사고 26의 토양이었다)
  assert.match(script('work', ['seed'], repo).out, /^ACTIVE net — unit은 한 번에 하나/);
  assert.match(script('work', ['drop', 'net', '범위 밖'], repo).out, /^DROPPED net/);
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
  assert.match(sp.out, /^FAIL <팩>은 팩 이름\(intake·spec·build·attack·spike·boot\)이다 — 받은 값은 경로[\s\S]*→ node \.garagiste\/scripts\/work\.mjs spawned intake intake --tokens 18594 --minutes 2$/m, sp.out);
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
  assert.match(fs.readFileSync(path.join(repo, script('brief', ['build', 'beta'], repo).out.split(' ')[1]), 'utf8'), /## main과의 충돌[\s\S]*src\/shared\.mjs[\s\S]*git add/, 'build 팩이 충돌 파일과 할 일을 받는다');
  // build가 하는 일: 양쪽을 살려 풀고 git add까지 — 커밋·rebase 없이
  write(bwt, 'src/shared.mjs', "export const mark = 'alpha';\nexport const mark2 = 'beta';\n");
  git(['add', 'src/shared.mjs'], bwt);
  const s2 = script('ship', ['beta'], repo);
  assert.match(s2.out, /^SHIPPED beta/, s2.out);
  const shared = fs.readFileSync(path.join(repo, 'src/shared.mjs'), 'utf8');
  assert.ok(shared.includes('alpha') && shared.includes('beta'), 'main에 두 unit의 표시가 다 있다 — 통합 tree에서 두 인수가 다 green');
  assert.match(fs.readFileSync(path.join(repo, '.garagiste/ledger/evidence.jsonl'), 'utf8'), /"kind":"ship_conflict","slug":"beta"/);
});

test('opencode 하네스: 같은 정본(.garagiste) 위에 opencode.json·agents·guard 플러그인이 깔리고 doctor가 OK', (t) => {
  if (!BASH) return t.skip(NO_BASH);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-oc-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  const inst = run(BASH, [path.join(GARAGISTE, 'install.sh'), 'opencode', '-Project', repo, '-SkipSelftest'], repo);
  assert.equal(inst.status, 0, inst.out);
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
  assert.match(script('doctor', [], repo).out, /commands.quick 비어 있음 → 첫 unit\(boot\)이 채운다/);
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
  write(wt, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';\ntest('진입점이 뜬다', () => { assert.equal(spawnSync(process.execPath, ['src/cli.mjs'], { encoding: 'utf8' }).status, 0); });\n");
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
