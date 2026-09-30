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
  assert.match(fs.readFileSync(path.join(repo, script('brief', ['build', 'hello'], repo).out.split(' ')[1]), 'utf8'), /## 이어받기/);
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
  assert.match(script('work', ['add', 'export', '메모는 내보낼 수 있다', '--milestone', 'M2', '--needs', 'memo,Q2'], repo).out, /^ADD export M2/);
  assert.match(script('work', ['ask', 'intake', '내보내기 형식은 CSV 하나로 충분한가?'], repo).out, /^Q2 queued/);
  assert.match(script('work', ['decide', '2', 'CSV 하나'], repo).out, /^PASS decide Q2/);
  const sc = script('work', ['scope', 'export'], repo).out;
  assert.match(sc, /^SCOPE 요청 1 · 선행 2 · 없는 선행 0\n- 선행: session \(memo가 needs\) · memo \(export가 needs\)\n- 순서: session → memo → export/, sc);
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
  assert.match(script('work', ['seed'], repo).out, /^WAIT memo needs session — 선행 unit이 먼저/, '진행 중인 선행이 끝나야 다음이 열린다');
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
  assert.match(script('ship', ['atom'], repo).out, /^SHIPPED atom/, '원인이 사라지면 같은 증거로 다시 ship된다');
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
  git(['add', '-A'], wt);
  assert.match(script('verify', ['quick'], wt).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'scaffold(boot): node 22 · node:test\n\nUnit: boot\nStep: 1'], wt).status, 0);
  assert.match(script('verify', ['full'], wt).out, /^PASS verify:full/);
  // 사고 6 회귀: models는 규칙집(team.json·agents)을 바꾸면 스스로 커밋한다 — main에 커밋 경로 없는 dirt를 남겨 ship을 막지 않는다
  assert.match(script('work', ['models', 'high'], repo).out, /scaffold\(team\) 커밋/);
  assert.equal(git(['status', '--porcelain', '--', '.garagiste/team.json', '.claude/agents'], repo).out.trim(), '', 'models 뒤 main은 깨끗하다');
  assert.match(git(['log', '-1', '--format=%s'], repo).out, /^scaffold\(team\): models high/);
  assert.ok(!script('work', ['models', 'high'], repo).out.includes('커밋'), '변경 없으면 커밋도 없다');
  // 사고 7 회귀: main의 models 커밋 × boot의 commands 커밋 = team.json rebase 충돌 — ship이 키 병합으로 통과하고 통합 full까지 스스로 돌린다
  const ship = script('ship', ['boot'], repo);
  assert.match(ship.out, /^SHIPPED boot [0-9a-f]{7}/, ship.out);
  assert.match(ship.out, /NOTE: 의존성 파일이 바뀐 출하/, '사고 10: 매니페스트가 바뀐 출하는 메인 설치를 안내한다');
  assert.ok(fs.existsSync(path.join(repo, '.garagiste', 'session', 'setup-ran')), '사고 21: 의존성 출하는 main quick 전에 commands.setup이 main에서 돈다');
  const team = JSON.parse(fs.readFileSync(path.join(repo, '.garagiste', 'team.json'), 'utf8'));
  assert.match(team.commands.quick, /^node --test/);
  assert.equal(team.models.build, 'opus', '사고 7: main의 models와 boot의 commands가 함께 살아남는다');
  assert.match(fs.readFileSync(path.join(repo, 'CLAUDE.md'), 'utf8'), /^# memo/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| boot \| .* \| PASS \| scaffold \| — \|/);
  assert.match(script('work', ['seed'], repo).out, /^UNIT memo-add spec/, 'boot 뒤 다음 unit이 열린다');
  git(['config', '--unset', 'core.hooksPath'], repo);
  assert.match(script('work', ['seed'], repo).out, /^FAIL doctor \d+[\s\S]*core\.hooksPath/, 'R8: 병든 설치(게이트 침묵 꺼짐)에서 seed는 이유 전문과 함께 멈춘다');
  git(['config', 'core.hooksPath', '.githooks'], repo);
  assert.match(script('doctor', [], repo).out, /^FAIL doctor 1\n- session-start alive/, '남은 건 첫 세션의 alive 마커뿐');
  const st = script('selftest', [], repo);
  assert.match(st.out, /SELFTEST PASS \d+\/\d+/, st.out);
});
