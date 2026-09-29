// verify — 실행이 승인이다. quick|full은 원장에 {tree, exit}를 남기고, gate는 커밋 때 원장과 tree를 대조한다.
import fs from 'node:fs';
import path from 'node:path';
import {
  acceptanceFiles, adversaryFiles, appendLedger, ctx, currentBranch, fail, git, headSha, indexTree, isMain, matchAny,
  mergeBase, out, readLedger, shell, short, stamp, workTree,
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
export function gateDecision({ index, work, ledger, staged, branchFiles = [], numstat, branch, protectedBranch, env = {}, budgets }) {
  const reasons = [];
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

function runMode(mode, c) {
  const cmd = c.team.commands[mode];
  if (!cmd) fail(`FAIL verify:${mode} commands.${mode} 비어 있음 — .garagiste/team.json`);
  const logDir = path.join(c.main, c.team.paths.logs); fs.mkdirSync(logDir, { recursive: true });
  const log = path.join(logDir, `verify-${mode}-${stamp()}.log`);
  const r = shell(cmd, { cwd: c.root });
  fs.writeFileSync(log, `$ ${cmd}\n${r.stdout}\n${r.stderr}`);
  const tree = workTree(c.root);
  appendLedger(c.main, c.team, { kind: 'verify', mode, tree, head: headSha(c.root), exit: r.status, log: path.relative(c.main, log), platform: process.platform, where: path.relative(c.main, c.root) || '.' });
  if (r.status === 0) return out(`PASS verify:${mode} ${short(tree)}`);
  const tail = (r.stdout + '\n' + r.stderr).trim().split('\n').slice(-3).join('\n');
  out(`FAIL verify:${mode} ${short(tree)} ${path.relative(c.main, log)}\n${tail}`);
  process.exit(1);
}
export function runFiles(c, files) {
  const tpl = c.team.commands.test_file;
  if (!tpl) fail('FAIL commands.test_file 비어 있음 — .garagiste/team.json ({file} 자리표시자)');
  return files.map((file) => ({ file, exit: shell(tpl.replaceAll('{file}', file), { cwd: c.root }).status }));
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
function gate(c) {
  const base = mergeBase(c.root, c.team.protected_branch);
  const d = gateDecision({
    index: indexTree(c.root), work: workTree(c.root), ledger: readLedger(c.main, c.team),
    staged: git(['diff', '--cached', '--name-only'], c.root).stdout.split('\n').filter(Boolean),
    branchFiles: base ? git(['diff', '--name-only', `${base}..HEAD`], c.root).stdout.split('\n').filter(Boolean) : [],
    numstat: git(['diff', '--cached', '--numstat'], c.root).stdout,
    branch: currentBranch(c.root), protectedBranch: c.team.protected_branch, env: process.env, budgets: c.team.budgets,
  });
  if (!d.ok) fail(`FAIL gate\n${d.reasons.map((r) => `- ${r}`).join('\n')}`);
  appendLedger(c.main, c.team, { kind: 'gate', tree: indexTree(c.root), branch: currentBranch(c.root), logic: d.logic, wip: d.wip, large: process.env.GARAGISTE_LARGE_STEP || null, ship: !!process.env.GARAGISTE_SHIP });
  out(`PASS gate${d.wip ? ' wip' : ''}`);
}
function main() {
  const [mode, arg] = process.argv.slice(2);
  const c = ctx();
  if (mode === 'quick' || mode === 'full') return runMode(mode, c);
  if (mode === 'red' && arg) return red(arg, c);
  if (mode === 'attack' && arg) return attack(arg, c);
  if (mode === 'gate') return gate(c);
  fail('사용법: verify.mjs quick | full | red <slug> | attack <slug> | gate');
}
if (isMain(import.meta.url)) main();
