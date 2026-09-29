// e2e — 탄생 시험: 빈 저장소에서 CEO 한 마디가 기계가 닫는 루프를 지나 출하되는가. 모델 0, 네트워크 0.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const GARAGISTE = path.resolve(HERE, '..');
const ENV = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', CLAUDE_PROJECT_DIR: undefined };
delete ENV.CLAUDE_PROJECT_DIR; delete ENV.NODE_TEST_CONTEXT; delete ENV.NODE_OPTIONS; // 중첩 node --test는 exit code를 바꾼다
const run = (cmd, args, cwd, env = {}) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...ENV, ...env } });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const script = (name, args, cwd, env) => run(process.execPath, [path.join(cwd, '.garagiste', 'scripts', `${name}.mjs`), ...args], cwd, env);
const write = (root, rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
const git = (args, cwd, env) => run('git', args, cwd, env);

test('탄생 시험: 한 마디 → red 주장 → green → 공격 → 7조건 출하 → 써봤다, 전부 기계가 닫는다', { timeout: 120000 }, () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-e2e-'));
  assert.equal(git(['init', '-q', '-b', 'main'], repo).status, 0);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  write(repo, 'tests/unit/smoke.test.mjs', "import test from 'node:test'; test('unit smoke', () => {});\n");
  git(['add', '-A'], repo); assert.equal(git(['commit', '-q', '-m', 'init'], repo).status, 0);

  // 설치 — 세 파일이 팀이다
  const inst = run('bash', [path.join(GARAGISTE, 'install.sh'), 'claude', '-Project', repo, '-Budget', 'low'], repo);
  assert.equal(inst.status, 0, inst.out);
  const teamPath = path.join(repo, '.garagiste', 'team.json');
  const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  assert.equal(team.models.build, 'haiku', 'budget low가 모델 편성에 반영');
  assert.match(fs.readFileSync(path.join(repo, '.claude/agents/build.md'), 'utf8'), /^model: haiku$/m, '에이전트 파일은 팩의 spawn 설정 — 모델은 예산에서');
  assert.ok(fs.existsSync(path.join(repo, '.claude/hooks/guard.mjs')) && fs.existsSync(path.join(repo, '.garagiste/scripts/guard-rules.mjs')));
  assert.match(script('work', ['models', 'build=opus'], repo).out, /^MODELS .*build=opus.* → 5 에이전트 파일 갱신/);
  assert.match(fs.readFileSync(path.join(repo, '.claude/agents/build.md'), 'utf8'), /^model: opus$/m, 'work models가 team.json과 에이전트 파일을 함께 바꾼다');
  assert.match(script('work', ['models', 'low'], repo).out, /build=haiku/);
  team.commands = { quick: 'node --test "tests/unit/**/*.test.mjs"', full: 'node --test "tests/**/*.test.mjs"', test_file: 'node --test {file}', run: 'node src/cli.mjs' };
  fs.writeFileSync(teamPath, JSON.stringify(team, null, 2));
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '# p\n');
  git(['add', '-A'], repo);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 1, '설치 뒤 첫 커밋도 원장 PASS 없이는 닫힌다');
  assert.match(script('verify', ['quick'], repo).out, /^PASS verify:quick/);
  assert.equal(git(['commit', '-q', '-m', 'scaffold: team'], repo, { GARAGISTE_SHIP: '1' }).status, 0);
  const doc = script('doctor', [], repo).out;
  assert.match(doc, /FAIL doctor 1\n- session-start alive 마커 없음/, '첫 세션 전엔 alive만 빠진다: ' + doc);

  // CEO 한 마디
  const nw = script('work', ['new', 'hello', '이름을 주면 그 이름으로 인사한다'], repo);
  assert.match(nw.out, /^UNIT hello spec \.worktrees\/hello/);
  const wt = path.join(repo, '.worktrees', 'hello');
  assert.equal(fs.readFileSync(path.join(wt, '.garagiste-pack'), 'utf8'), 'spec');
  assert.match(fs.readFileSync(path.join(repo, 'docs/BACKLOG.md'), 'utf8'), /- \[ \] hello · M\? · needs: - · "이름을 주면 그 이름으로 인사한다" · 인수: -/);
  assert.match(script('work', ['new', 'net', '외부 API로 network 호출을 한다'], repo).out, /HIT .*keyword network/, 'boundary는 spike부터');

  // spec: red 주장
  write(wt, 'tests/acceptance/hello.test.mjs', `// @claim 이름을 주면 "hello <이름>"을 출력한다
// @milestone M1
// @sensor machine@linux
import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';
test('hello Ada', () => { const r = spawnSync(process.execPath, ['src/cli.mjs', 'Ada'], { encoding: 'utf8' }); assert.equal(r.status, 0); assert.equal(r.stdout.trim(), 'hello Ada'); });
`);
  write(wt, 'docs/units/hello/try.md', '명령: `node src/cli.mjs Ada`\n기대: `hello Ada`\n');
  write(wt, 'docs/units/hello/surface.md', 'CLI 인자 하나 → stdout 한 줄\n');
  assert.match(script('redproof', ['hello'], wt).out, /^RED hello 1\/1/);
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
  assert.match(script('ship', ['hello'], repo).out, /FAIL ship hello 1\/7\n- attack: attack 기록 없음/);

  // attack: 실패하는 테스트가 산출물
  assert.match(script('brief', ['attack', 'hello'], repo).out, /^PACK .*model=sonnet/);
  write(wt, 'tests/adversary/hello-1.test.mjs', `import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process';
test('이름이 없으면 hello만 (끝 공백 없음)', () => { const r = spawnSync(process.execPath, ['src/cli.mjs'], { encoding: 'utf8' }); assert.equal(r.stdout, 'hello\\n'); });
`);
  assert.match(script('verify', ['attack', 'hello'], wt).out, /^ATTACK hello red 1\/1/);
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

  // ship: 7조건 통과 → main ff 머지 + LEDGER + STATUS
  const ship = script('ship', ['hello'], repo);
  assert.match(ship.out, /^SHIPPED hello [0-9a-f]{7} sensor=machine/, ship.out);
  assert.ok(fs.existsSync(path.join(repo, 'src/cli.mjs')) && !fs.existsSync(wt));
  assert.match(fs.readFileSync(path.join(repo, 'docs/LEDGER.md'), 'utf8'), /\| hello \| [0-9a-f]{7} \| [0-9a-f]{7} \| PASS \| base_red head_green \| 0\/1 \| machine \|/);
  const status = fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8');
  assert.match(status.split('\n')[0], /^실행: node src\/cli\.mjs · 안 본 것 1\/3 · target-OS 미관측 0 · 결정 대기 0 · 센서 커버리지 100%/);
  assert.match(status, /## 써볼 것 \(≤3\)\n- \*\*hello\*\*/);
  assert.match(git(['log', '-1', '--format=%s%n%b'], repo).out, /ship\(hello\)[\s\S]*Unit: hello[\s\S]*Attack: 0\/1/);
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

  // 입구: 구상 원문 → intake 팩 → (intake가 할 일을 테스트가 대신) unit 줄 → 범위와 선행 역제안 → seed
  assert.match(script('work', ['brief', '로그인한 사람만 메모를 쓰고, 메모는 내보낼 수 있다.'], repo).out, /^BRIEF \+1줄/);
  const ip = script('brief', ['intake'], repo);
  assert.match(ip.out, /^PACK \.garagiste\/session\/packs\/intake-.* cwd=\. model=sonnet/);
  assert.match(fs.readFileSync(path.join(repo, ip.out.split(' ')[1]), 'utf8'), /## BRIEF \(전문\)[\s\S]*로그인한 사람만/);
  assert.match(script('work', ['add', 'session', '로그인한 사람만', '--milestone', 'M1', '--accept', 'POST /login → 200'], repo).out, /^ADD session M1/);
  assert.match(script('work', ['add', 'memo', '메모를 쓴다', '--milestone', 'M1', '--needs', 'session'], repo).out, /needs=session/);
  assert.match(script('work', ['add', 'export', '메모는 내보낼 수 있다', '--milestone', 'M2', '--needs', 'memo,Q2'], repo).out, /^ADD export M2/);
  assert.match(script('work', ['ask', 'intake', '내보내기 형식은 CSV 하나로 충분한가?'], repo).out, /^Q2 queued/);
  const sc = script('work', ['scope', 'export'], repo).out;
  assert.match(sc, /^SCOPE 요청 1 · 선행 2 · 없는 선행 0\n- 선행: session \(memo가 needs\) · memo \(export가 needs\)\n- 순서: session → memo → export/, sc);
  assert.match(script('work', ['seed'], repo).out, /^UNIT session spec \.worktrees\/session/, '선행이 먼저 열린다');
  assert.match(script('work', ['seed'], repo).out, /^WAIT memo needs session — 선행 unit이 먼저/, '진행 중인 선행이 끝나야 다음이 열린다');
  assert.match(script('state', [], repo).out, /안 본 것 0\/3/);
  assert.match(fs.readFileSync(path.join(repo, 'docs/STATUS.md'), 'utf8'), /## 범위\n- 요청 1 · 선행 2 · 출하 0\/3\n- 순서: session → memo → export/);
});

test('opencode 하네스: 같은 정본(.garagiste) 위에 opencode.json·agents·guard 플러그인이 깔리고 doctor가 OK', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-oc-'));
  git(['init', '-q', '-b', 'main'], repo);
  write(repo, 'package.json', '{ "name": "p", "type": "module", "private": true }\n');
  git(['add', '-A'], repo); git(['commit', '-q', '-m', 'init'], repo);
  const inst = run('bash', [path.join(GARAGISTE, 'install.sh'), 'opencode', '-Project', repo], repo);
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
