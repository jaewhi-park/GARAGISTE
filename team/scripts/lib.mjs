// 공용 배선 — 판단 없음. 모든 스크립트가 여기서 저장소·팀 설정·원장·tree 해시를 얻는다.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return { status: r.status ?? 1, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}
export function git(args, cwd, env) { return sh('git', args, { cwd, env: env ? { ...process.env, ...env } : undefined }); }
// .garagiste/env.local — 이 기계에서만 쓰는 실행 환경(KEY=VALUE 줄, 추적 안 함). 예: GARAGISTE_RUNNER=setpriv --reuid=1000 …
export function parseLocalEnv(text) {
  const env = {};
  for (const line of (text || '').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].trim();
  }
  return env;
}
export function localEnv(cwd = process.cwd()) {
  try { return parseLocalEnv(fs.readFileSync(path.join(mainRoot(cwd), '.garagiste', 'env.local'), 'utf8')); } catch { return {}; }
}
// team.json의 명령은 프로젝트가 직접 쓴 셸 문자열이라 그대로 돌린다(제품 코드의 subprocess 규칙과는 다른 층). env.local이 있으면 그 값이 환경에 더해진다.
export function shell(cmdString, opts = {}) {
  const env = { ...process.env, ...localEnv(opts.cwd), ...(opts.env || {}) };
  const r = spawnSync(cmdString, { shell: true, encoding: 'utf8', ...opts, env });
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}
// 경로는 비교 전에 하나의 표기로 — git은 Windows에서도 슬래시(C:/…)를, path.resolve는 역슬래시(C:\…)를, 드라이브 문자는 호출한 셸에 따라 대소문자를 달리 내놓는다.
// realpath가 표기·대소문자·심볼릭 링크까지 디스크의 정본으로 맞춘다 (win32 사고: c.root!==c.main이 메인에서도 참이 되어 decide·drop·tried가 거부됐다)
const canon = (p) => { try { return fs.realpathSync.native(p); } catch { return path.resolve(p); } };
export function repoRoot(cwd = process.cwd()) {
  const r = git(['rev-parse', '--show-toplevel'], cwd);
  if (r.status) throw new Error('git 저장소가 아니다');
  return canon(r.stdout);
}
// worktree 안에서도 메인 저장소 루트 — 로컬 상태(원장·unit·팩)의 집
export function mainRoot(cwd = process.cwd()) {
  const r = git(['rev-parse', '--git-common-dir'], cwd);
  return canon(path.dirname(path.resolve(cwd, r.stdout)));
}
export const REQUIRED_TEAM_KEYS = ['version', 'protected_branch', 'models', 'commands', 'paths', 'boundary', 'budgets', 'sensors'];
export function loadTeam(root) {
  const p = path.join(root, '.garagiste', 'team.json');
  if (!fs.existsSync(p)) throw new Error(`team.json 없음: ${p} — install.sh를 먼저`);
  const t = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); // Windows PowerShell이 BOM을 붙일 수 있다
  const missing = REQUIRED_TEAM_KEYS.filter((k) => !(k in t));
  if (missing.length) throw new Error(`team.json 키 없음: ${missing.join(', ')}`);
  return t;
}
export function ctx(cwd = process.cwd()) {
  const root = repoRoot(cwd);
  const main = mainRoot(cwd);
  return { root, main, team: loadTeam(root) };
}
export function ledgerPath(main, team) { return path.join(main, team.paths.ledger); }
export function appendLedger(main, team, entry) {
  const p = ledgerPath(main, team);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const e = { ts: new Date().toISOString(), ...entry };
  fs.appendFileSync(p, JSON.stringify(e) + '\n');
  return e;
}
export function readLedger(main, team) {
  const p = ledgerPath(main, team);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
// 작업 트리(추적 + 미추적, .gitignore 존중)의 tree 해시 — 임시 인덱스로 계산, 실제 인덱스는 건드리지 않는다
export function workTree(cwd) {
  const tmp = path.join(os.tmpdir(), `garagiste-index-${process.pid}-${Date.now()}`);
  const env = { GIT_INDEX_FILE: tmp };
  try {
    if (!git(['rev-parse', '--verify', '-q', 'HEAD'], cwd).status) git(['read-tree', 'HEAD'], cwd, env);
    git(['add', '-A'], cwd, env);
    return git(['write-tree'], cwd, env).stdout;
  } finally { try { fs.unlinkSync(tmp); } catch { /* 없음 */ } }
}
export function indexTree(cwd) { return git(['write-tree'], cwd).stdout; }
export function headTree(cwd) { return git(['rev-parse', 'HEAD^{tree}'], cwd).stdout; }
export function headSha(cwd) { return git(['rev-parse', 'HEAD'], cwd).stdout; }
export function isClean(cwd) { return git(['status', '--porcelain'], cwd).stdout === ''; }
export function dirtyFiles(cwd) { return git(['status', '--porcelain', '-uall'], cwd).stdout.split('\n').filter(Boolean).map((l) => l.slice(3)); }
export function currentBranch(cwd) { return git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd).stdout; }
export function mergeBase(cwd, ref) { const r = git(['merge-base', 'HEAD', ref], cwd); return r.status ? null : r.stdout; }
export function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if ('.+^$(){}|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp(glob.includes('/') ? `^${re}$` : `(^|/)${re}$`);
}
export function matchAny(file, globs) { const f = file.replace(/\\/g, '/'); return globs.some((g) => globToRegex(g).test(f)); }
export function readJson(p, fallback) { try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch { return fallback; } }
export function writeJson(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); }
export function readText(p) { try { return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''); } catch { return ''; } }
// 설치된 스크립트의 저장소 루트: <root>/.garagiste/scripts/x.mjs → <root>. cwd가 다른 곳(설치기를 돌린 폴더)이어도 맞는다
export function scriptRoot(metaUrl) { return path.resolve(path.dirname(fileURLToPath(metaUrl)), '..', '..'); }
export function unitFile(main, team, slug) { return path.join(main, team.paths.units, `${slug}.json`); }
export function loadUnit(main, team, slug) {
  const u = readJson(unitFile(main, team, slug), null);
  if (!u) throw new Error(`unit 없음: ${slug} — work.mjs new 먼저`);
  return u;
}
export function saveUnit(main, team, u) { writeJson(unitFile(main, team, u.slug), u); }
export function listUnits(main, team) {
  const d = path.join(main, team.paths.units);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(d, f), null)).filter(Boolean);
}
export function worktreeDir(main, team, slug) { return path.join(main, team.paths.worktrees, slug); }
export function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base)); else out.push(path.relative(base, p).replace(/\\/g, '/'));
  }
  return out.sort();
}
export function acceptanceFiles(root, team, slug) {
  return listFiles(path.join(root, team.paths.acceptance)).filter((f) => path.basename(f).startsWith(slug)).map((f) => path.posix.join(team.paths.acceptance, f));
}
export function adversaryFiles(root, team, slug) {
  return listFiles(path.join(root, team.paths.adversary)).filter((f) => path.basename(f).startsWith(`${slug}-`)).map((f) => path.posix.join(team.paths.adversary, f));
}
export function touchCeo(main) {
  const p = path.join(main, '.garagiste', 'session', 'ceo-touch');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, new Date().toISOString());
}
export function ceoTouch(main) { return readText(path.join(main, '.garagiste', 'session', 'ceo-touch')).trim() || null; }
// 의존성 디렉터리(node_modules · .venv)는 .gitignore 밖이라 worktree에 없다 — 루트와 워크스페이스 패키지 것까지 심볼릭 링크로 재사용
export function depDirs(root, depth = 3) {
  const found = [];
  const walk = (dir, d) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith('.git') || e.name === '.worktrees') continue;
      const p = path.join(dir, e.name);
      if (e.name === 'node_modules' || e.name === '.venv') { found.push(path.relative(root, p)); continue; }
      if (d < depth && !e.name.startsWith('.')) walk(p, d + 1);
    }
  };
  walk(root, 0);
  return found.sort();
}
export function linkDeps(root, dest) {
  const linked = [];
  for (const rel of depDirs(root)) {
    const src = path.join(root, rel); const dst = path.join(dest, rel);
    if (fs.existsSync(dst)) continue;
    try { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.symlinkSync(src, dst, 'junction'); linked.push(rel); } catch { /* 링크 불가 — 프로젝트가 설치한다 */ }
  }
  return linked;
}
export function out(line) { process.stdout.write(line + '\n'); }
export function fail(line, code = 1) { out(line); process.exit(code); }
export function isMain(metaUrl) { return !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(metaUrl); }
export function short(sha) { return (sha || '').slice(0, 7); }
export function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }
