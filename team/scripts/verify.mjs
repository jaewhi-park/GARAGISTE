// verify — 실행이 승인이다. quick|full은 원장에 {tree, exit}를 남기고, gate는 커밋 때 원장과 tree를 대조한다.
import fs from 'node:fs';
import path from 'node:path';
import {
  acceptanceFiles, adversaryFiles, appendLedger, ctx, currentBranch, fail, fileCmd, git, headSha, indexTree, isMain, matchAny,
  linkDeps, listUnits, mergeBase, out, readLedger, shell, short, slugRoot, stamp, workTree,
} from './lib.mjs';

export const LOGIC_EXCLUDE = ['tests/**', 'test/**', '**/*.test.*', '**/*.spec.*', '**/*.config.*', '**/tsconfig*.json', 'docs/**', '.garagiste/**', '.claude/**', '.opencode/**', 'opencode.json', 'fixtures/**', 'probes/**',
  '**/package-lock.json', '**/pnpm-lock.yaml', '**/uv.lock', '**/*.md', '.githooks/**', '.gitignore'];
export const TEST_GLOBS = ['tests/**', 'test/**', '**/*.test.*', '**/*.spec.*', 'probes/**'];
export function isTestFile(f) { return matchAny(f, TEST_GLOBS); }
export function logicLines(numstat) {
  let n = 0;
  for (const line of numstat.split('\n').filter(Boolean)) {
    const [ins, del, file] = line.split('\t');
    if (!file || ins === '-' || matchAny(file, LOGIC_EXCLUDE)) continue;
    n += Number(ins) + Number(del);
  }
  return n;
}
export function gateDecision({ index, work, ledger, staged, branchFiles = [], numstat, branch, protectedBranch, env = {}, budgets, hasHead = true }) {
  const reasons = [];
  if (!hasHead) return { ok: true, reasons, wip: false, logic: 0, initial: true }; // 첫 커밋: 원장이 있을 수 없다 — 설치기가 만든다
  if (branch === protectedBranch && !env.GARAGISTE_SHIP) reasons.push(`보호 브랜치(${protectedBranch})에 직접 커밋 — ship.mjs만 머지한다`);
  if (env.GARAGISTE_WIP) return { ok: reasons.length === 0, reasons, wip: true, logic: 0 };
  if (index !== work) reasons.push('인덱스 ≠ 작업 트리 — 원장은 작업 트리를 증명한다: 전부 스테이지하거나 되돌려라');
  const pass = ledger.some((e) => e.kind === 'verify' && (e.mode === 'quick' || e.mode === 'full') && e.exit === 0 && e.tree === work);
  if (!pass) reasons.push(`원장에 이 tree(${short(work)})의 quick PASS 없음 — node .garagiste/scripts/verify.mjs quick`);
  const logic = logicLines(numstat);
  const logicFiles = staged.filter((f) => !matchAny(f, LOGIC_EXCLUDE));
  if (logicFiles.length && ![...staged, ...branchFiles].some(isTestFile)) reasons.push('로직 변경에 테스트 파일이 없다 — red 테스트가 먼저다');
  const max = budgets.step_logic_lines_max;
  if (logic > max * 2) reasons.push(`step 로직 ${logic}줄 > 상한 2×(${max * 2}) — split`);
  else if (logic > max && !env.GARAGISTE_LARGE_STEP) reasons.push(`step 로직 ${logic}줄 > ${max} — 이유가 있으면 GARAGISTE_LARGE_STEP="<이유>" git commit`);
  return { ok: reasons.length === 0, reasons, logic, wip: false };
}

// 사고 44(필드 벤치 셋): full은 「전부」다 — 파이썬 필드의 full(unittest discover)은 test*.py만 집어 하이픈 slug의 인수·공격 파일 17개를 한 번도 돌리지 않았다
// (출하 전 증거는 파일 단위라 게이트는 속지 않았지만, 출하 뒤 다음 unit들의 full이 앞 기능의 회귀를 지키지 않았다). 러너가 무엇을 집든 unit의 인수·공격 파일은 test_file로 돌린다.
export function unitTestFiles(main, team, root) {
  const files = new Set();
  for (const u of listUnits(main, team)) for (const f of [...acceptanceFiles(root, team, u.slug), ...adversaryFiles(root, team, u.slug)]) files.add(f);
  return [...files].sort();
}
export function fullRun({ main, team, root, cmd, testFile }) {
  const r = shell(cmd, { cwd: root });
  let log = `$ ${cmd}\n${r.stdout}\n${r.stderr}`;
  const files = testFile ? unitTestFiles(main, team, root) : [];
  const run1 = (fl) => { const x = shell(fileCmd(testFile, fl), { cwd: root }); log += `\n$ ${fileCmd(testFile, fl)} → exit ${x.status}\n${x.stdout}\n${x.stderr}`; return x.status; };
  // 사고 48(필드 벤치 넷 측정): 파일 하나씩 직렬로는 웹 full이 20초 → 71초(브라우저 테스트 10개) — {files} 러너는 한 번에, red일 때만 파일별로 다시(어느 파일인지).
  // 사고 53(홀드아웃 Go): go test는 한 디렉터리의 파일만 받는다 — 두 디렉터리를 한 번에 넘기자 러너가 거부해 「함께 red」 거짓 FAIL. 한 번에는 디렉터리마다,
  // 그리고 빠른 길일 뿐 — 판정은 파일 단위(사고 44의 계약): 러너의 제약인지 파일끼리의 간섭인지 exit로는 모른다.
  const groups = new Map();
  for (const f of files) { const d = path.posix.dirname(f); groups.set(d, [...(groups.get(d) || []), f]); }
  const reds = [];
  for (const g of groups.values()) {
    if (g.length > 1 && testFile.includes('{files}') && run1(g) === 0) continue;
    for (const f of g) if (run1([f])) reds.push(f);
  }
  const note = reds.length ? `인수·공격 파일 red ${reds.length}/${files.length}: ${reds.join(' ')}` : '';
  return { status: r.status || (reds.length ? 1 : 0), log, red: reds, tail: [(r.stdout + '\n' + r.stderr).trim().split('\n').slice(-3).join('\n'), note].filter(Boolean).join('\n') }; // red: 파일 단위 판정의 red 목록 — next가 full FAIL의 자리를 말한다(사고 85)
}

function runMode(mode, c) {
  const cmd = c.team.commands[mode];
  if (!cmd) fail(`FAIL verify:${mode} commands.${mode} 비어 있음 — .garagiste/team.json`);
  const logDir = path.join(c.main, c.team.paths.logs); fs.mkdirSync(logDir, { recursive: true });
  const log = path.join(logDir, `verify-${mode}-${stamp()}.log`);
  if (c.root !== c.main) linkDeps(c.main, c.root); // 사고 34: seed 뒤 main에 깔린 의존성(설치 명령 변경)도 열린 worktree가 잇는다 — 없는 것만 링크
  const r = mode === 'full' ? fullRun({ main: c.main, team: c.team, root: c.root, cmd, testFile: c.team.commands.test_file }) : shell(cmd, { cwd: c.root });
  fs.writeFileSync(log, r.log ?? `$ ${cmd}\n${r.stdout}\n${r.stderr}`);
  const tree = workTree(c.root);
  appendLedger(c.main, c.team, { kind: 'verify', mode, tree, head: headSha(c.root), exit: r.status, log: path.relative(c.main, log).replace(/\\/g, '/'), platform: process.platform, where: path.relative(c.main, c.root).replace(/\\/g, '/') || '.', ...(r.red?.length ? { red: r.red } : {}) }); // 원장 경로는 / — 팩의 「직전 verify」 매칭(where===unit.worktree)이 win32에서 어긋난다(사고 19 잔여)
  if (r.status === 0) return out(`PASS verify:${mode} ${short(tree)}`);
  const tail = r.tail ?? (r.stdout + '\n' + r.stderr).trim().split('\n').slice(-3).join('\n');
  out(`FAIL verify:${mode} ${short(tree)} ${path.relative(c.main, log).replace(/\\/g, '/')}\n${tail}`);
  process.exit(1);
}
export function runFiles(c, files) {
  const tpl = c.team.commands.test_file;
  if (!tpl) fail('FAIL commands.test_file 비어 있음 — .garagiste/team.json ({file} 자리표시자)');
  return files.map((file) => ({ file, exit: shell(fileCmd(tpl, [file]), { cwd: c.root }).status }));
}
// 사고 57(벤치 070f185 파이썬): exit 0만으로는 test_file이 그 파일을 돌렸는지 모른다 — boot의 하네스는 파일 인자를 unittest discover(pattern=<파일 이름>)로 찾아
// 하이픈 이름(add-entry_cli.py — 모듈 이름이 될 수 없다)을 0건 실행·exit 0으로 넘겼고, redproof가 그것을 「base에서 green — 이미 충족」으로 읽어 drop을 안내했다.
// 탐침: 같은 자리·같은 이름에 깨진 파일(어느 언어로도 문법 오류)을 두고 같은 명령을 돌린다 — 그래도 exit 0이면 이 명령은 그 파일을 돌리지 않는다.
// dir은 버릴 checkout이다(redproof의 base worktree · withScratch) — 작업 트리는 잠시도 바꾸지 않는다.
export const PROBE_TEXT = ')( garagiste probe: deliberately broken file\n';
export function blindFiles(tpl, files, dir) {
  return files.filter((f) => {
    const p = path.join(dir, f);
    const had = fs.existsSync(p) ? fs.readFileSync(p) : null;
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, PROBE_TEXT);
    try { return shell(fileCmd(tpl, [f]), { cwd: dir }).status === 0; } finally { if (had) fs.writeFileSync(p, had); else fs.rmSync(p, { force: true }); }
  });
}
// 12라운드(실전 첫 run 측정 2026-10-04 — docs/measurements/CONDUCT-FIRST-RUN.md): adopt 팩이 quick·full을 파일 목록으로 적었다 — 인수·공격 파일이 full에 안 들어 출하 뒤 회귀를 지키지 못한다(파이썬 관찰 2026-10-01과 같은 뿌리 — 둘의 규칙).
// 명령 하나를 탐침과 함께 돈다: 깨진 파일을 인수·공격 자리에 두기 전(before)과 둔 뒤(after)의 exit. full은 after가 red여야 하고(그 자리를 본다), quick은 after도 green이어야 한다(그 자리는 red로 커밋되는 자리 — 게이트의 quick이 막히지 않게). before가 red면 판단하지 않는다(verify가 말한다).
export function probeCommand(cmd, files, dir) {
  const before = shell(cmd, { cwd: dir }).status;
  if (before !== 0) return { before, after: null };
  const saved = files.map((f) => { const p = path.join(dir, f); const had = fs.existsSync(p) ? fs.readFileSync(p) : null; fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, PROBE_TEXT); return { p, had }; });
  try { return { before, after: shell(cmd, { cwd: dir }).status }; } finally { for (const { p, had } of saved) { if (had) fs.writeFileSync(p, had); else fs.rmSync(p, { force: true }); } }
}
// scaffold의 탐침 이름: boot의 tests/unit 파일(boot 팩 3의 스모크) 이름에 slug 꼴(하이픈) 머리 — 생태계의 접미사(test_*.py · _test.go · .test.mjs)를 빌린다
export function probeNames(paths, unitFiles) {
  const pick = unitFiles.find((f) => /test|spec|smoke/i.test(path.posix.basename(f))) || unitFiles[0];
  return pick ? [paths.acceptance, paths.adversary].map((d) => `${d}/garagiste-probe-${path.posix.basename(pick)}`) : [];
}
function red(slug, c) {
  const files = acceptanceFiles(c.root, c.team, slug);
  if (!files.length) fail(`FAIL red ${slug}: ${c.team.paths.acceptance}/${slug}* 없음`);
  const res = runFiles(c, files);
  const reds = res.filter((r) => r.exit !== 0).length;
  appendLedger(c.main, c.team, { kind: 'red', slug, tree: workTree(c.root), total: res.length, red: reds });
  if (reds === res.length) return out(`RED ${slug} ${reds}/${res.length}`);
  fail(`FAIL red ${slug} ${reds}/${res.length} — green인 파일: ${res.filter((r) => r.exit === 0).map((r) => r.file).join(' ')}`);
}
function attack(slug, c) {
  const files = adversaryFiles(c.root, c.team, slug);
  const res = runFiles(c, files);
  const reds = res.filter((r) => r.exit !== 0).length;
  appendLedger(c.main, c.team, { kind: 'attack', slug, tree: workTree(c.root), total: res.length, red: reds, files: res.filter((r) => r.exit !== 0).map((r) => r.file) });
  out(`ATTACK ${slug} red ${reds}/${res.length}`);
}
// 사고 69(L2 6판 2건): 원장 fail 줄은 첫 줄(300자)만 남아 「FAIL gate」엔 이유가 없었다 — conductor 「안내가 없어 조치하지 않았다」. 첫 이유를 첫 줄에, 나머지는 아래 줄.
export function gateFailLine(reasons) {
  return `FAIL gate — ${reasons[0]}${reasons.length > 1 ? ` (+${reasons.length - 1})` : ''}\n${reasons.map((r) => `- ${r}`).join('\n')}`;
}
function gate(c) {
  const base = mergeBase(c.root, c.team.protected_branch);
  const d = gateDecision({
    index: indexTree(c.root), work: workTree(c.root), ledger: readLedger(c.main, c.team),
    staged: git(['diff', '--cached', '--name-only'], c.root).stdout.split('\n').filter(Boolean),
    branchFiles: base ? git(['diff', '--name-only', `${base}..HEAD`], c.root).stdout.split('\n').filter(Boolean) : [],
    numstat: git(['diff', '--cached', '--numstat'], c.root).stdout,
    branch: currentBranch(c.root), protectedBranch: c.team.protected_branch, env: process.env, budgets: c.team.budgets,
    hasHead: !git(['rev-parse', '--verify', '-q', 'HEAD'], c.root).status,
  });
  if (!d.ok) fail(gateFailLine(d.reasons));
  appendLedger(c.main, c.team, { kind: 'gate', tree: indexTree(c.root), branch: currentBranch(c.root), logic: d.logic, wip: d.wip, initial: !!d.initial, large: process.env.GARAGISTE_LARGE_STEP || null, ship: !!process.env.GARAGISTE_SHIP });
  out(`PASS gate${d.wip ? ' wip' : ''}${d.initial ? ' initial' : ''}`);
}
function main() {
  const [mode, arg] = process.argv.slice(2);
  const c = ctx();
  if (mode === 'quick' || mode === 'full') return runMode(mode, arg ? { ...c, root: slugRoot(c, arg) } : c); // <slug>를 주면 그 unit의 worktree에서(7라운드: next가 attack 뒤 tree의 full을 메인에서 시킨다)
  // 사고 9: slug 작업은 어디서 불러도 그 unit의 worktree가 뿌리 — 메인에서 0/0 거짓 초록을 만들지 않는다
  if (mode === 'red' && arg) return red(arg, { ...c, root: slugRoot(c, arg) });
  if (mode === 'attack' && arg) return attack(arg, { ...c, root: slugRoot(c, arg) });
  if (mode === 'gate') return gate(c);
  fail('사용법: verify.mjs quick [<slug>] | full [<slug>] | red <slug> | attack <slug> | gate');
}
if (isMain(import.meta.url)) main();
