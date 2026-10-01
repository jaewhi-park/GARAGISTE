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
// 작업 트리(추적 + 미추적, .gitignore 존중)의 tree 해시 — 임시 인덱스로 계산, 실제 인덱스는 건드리지 않는다.
// 사고 19(win32 원격 검증): 씨앗을 read-tree HEAD로 하면 filemode=false(NTFS)에서 HEAD에 없는 chmod 파일(.githooks/pre-commit 755)이
// 임시 인덱스엔 644로 들어가 내용 diff 0인데 tree만 다른 유령 불일치가 났다 — 실제 인덱스 복사본을 씨앗으로 모드 기록을 물려받는다.
export function workTree(cwd) {
  const tmp = path.join(os.tmpdir(), `garagiste-index-${process.pid}-${Date.now()}`);
  const env = { GIT_INDEX_FILE: tmp };
  try {
    const idx = git(['rev-parse', '--git-path', 'index'], cwd).stdout;
    const idxAbs = idx ? path.resolve(cwd, idx) : '';
    if (idxAbs && fs.existsSync(idxAbs)) fs.copyFileSync(idxAbs, tmp);
    else if (!git(['rev-parse', '--verify', '-q', 'HEAD'], cwd).status) git(['read-tree', 'HEAD'], cwd, env);
    git(['add', '-A'], cwd, env);
    return git(['write-tree'], cwd, env).stdout;
  } finally { try { fs.unlinkSync(tmp); } catch { /* 없음 */ } }
}
export function indexTree(cwd) { return git(['write-tree'], cwd).stdout; }
export function headTree(cwd) { return git(['rev-parse', 'HEAD^{tree}'], cwd).stdout; }
export function headSha(cwd) { return git(['rev-parse', 'HEAD'], cwd).stdout; }
export function isClean(cwd) { return git(['status', '--porcelain'], cwd).stdout === ''; }
// 사고 26(L2 1일차): ship이 멈춰 둔 rebase — worktree의 git dir에 rebase-merge·rebase-apply가 있으면 진행 중이다
export function rebaseInProgress(cwd) {
  return ['rebase-merge', 'rebase-apply'].some((d) => { const p = git(['rev-parse', '--git-path', d], cwd).stdout; return !!p && fs.existsSync(path.resolve(cwd, p)); });
}
export function unmergedFiles(cwd) { return git(['diff', '--name-only', '--diff-filter=U'], cwd).stdout.split('\n').filter(Boolean); }
// 사고 12(2차 실기): sh()는 stdout을 trim한다 — porcelain 첫 줄이 ' M …'(비스테이징 수정)이면 선행 공백이 지워져 slice(3)이 경로 첫 글자를 먹는다(ocs/BACKLOG.md). 여기선 원문을 쓴다.
export function dirtyFiles(cwd) {
  const r = spawnSync('git', ['status', '--porcelain', '-uall'], { cwd, encoding: 'utf8' });
  return (r.stdout || '').split('\n').filter(Boolean).map((l) => l.slice(3));
}
// 사고 38(필드 벤치 두 곳): ship이 main에서 돌린 setup·quick이 남긴 것 — 바뀐 추적 파일과 추적 안 된 새 경로(git이 접은 디렉터리 그대로).
// keep(스크립트가 쓰는 CEO 문서)은 빼고, 그 문서가 접힌 디렉터리 안에 있으면 그 디렉터리만 펼친다. -z: 한글 경로가 따옴표로 바뀌지 않게.
function statusEntries(cwd, extra = []) {
  const parts = (spawnSync('git', ['status', '--porcelain', '-z', ...extra], { cwd, encoding: 'utf8' }).stdout || '').split('\0');
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    out.push({ code: parts[i].slice(0, 2), path: parts[i].slice(3) });
    if (/^[RC]/.test(parts[i])) i++; // 이름 바꿈의 옛 경로
  }
  return out;
}
export function strayPaths(cwd, keep = []) {
  const res = [];
  for (const e of statusEntries(cwd)) {
    if (keep.includes(e.path)) continue;
    if (e.code === '??' && e.path.endsWith('/') && keep.some((k) => k.startsWith(e.path))) res.push(...statusEntries(cwd, ['-uall', '--', e.path]).filter((f) => !keep.includes(f.path)));
    else res.push(e);
  }
  return res;
}
// 지우지 않고 옮긴다 — 같은 순간 CEO가 메인 루트에 만든 파일이 섞여도 잃지 않는다. 바뀐 추적 파일은 사본을 두고 HEAD로 되돌린다.
// 옮기지 못한 것(win32: 켜 둔 서버가 잡은 파일)은 그 자리에 두고 돌려준다 — 되돌리기 도중에 죽으면 반쪽 출하가 다시 생긴다.
export function quarantineStray(cwd, entries, dest) {
  const left = [];
  for (const { code, path: rel } of entries) {
    const src = path.join(cwd, rel.replace(/\/$/, '')); const dst = path.join(dest, rel.replace(/\/$/, ''));
    try {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      if (code === '??') { fs.renameSync(src, dst); continue; }
      if (fs.existsSync(src)) fs.cpSync(src, dst, { recursive: true });
      if (code[0] === 'A') { git(['rm', '-q', '--cached', '--', rel], cwd); if (fs.existsSync(src)) fs.rmSync(src, { recursive: true }); }
      else git(['checkout', 'HEAD', '--', rel], cwd);
    } catch { left.push(rel); }
  }
  return left;
}
export function currentBranch(cwd) { return git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd).stdout; }
export function mergeBase(cwd, ref) { const r = git(['merge-base', 'HEAD', ref], cwd); return r.status ? null : r.stdout; }
export function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      // `**/`는 0개 이상의 "온전한 세그먼트" — /를 삼켜 `.*`로 만들면 `**/schema/**`가 vault-schema/처럼 schema로 끝나는 폴더까지 문다(2차 실기 사고 11: 거짓 boundary HIT가 ship을 막았다)
      if (glob[i + 1] === '*') { i++; if (glob[i + 1] === '/') { re += '(.*/)?'; i++; } else re += '.*'; } else re += '[^/]*';
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
// slug 작업(redproof·verify red·attack)의 뿌리는 그 unit의 worktree다 — 메인 루트에서 불러도 스스로 찾아간다.
// (2차 실기 사고 9: 메인에서 돌리면 인수·adversary 파일이 0개라 red 0/0 거짓 초록 — ship 8조건이 막긴 했지만 라운드를 낭비시켰다)
export function slugRoot(c, slug) {
  const wt = worktreeDir(c.main, c.team, slug);
  return fs.existsSync(wt) ? wt : c.root;
}
export function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base)); else out.push(path.relative(base, p).replace(/\\/g, '/'));
  }
  return out.sort();
}
// 사고 30(필드 시험 1): 디렉터리 걷기는 무시 파일(__pycache__/*.pyc)까지 수용·공격 테스트로 셌다 — redproof가 head red, attack이 6/6.
// 저장소의 눈으로 본다: 추적 + 무시 안 된 미추적(spec이 막 쓴 주장), 지금 디스크에 있는 것만. git 밖이면 옛 걷기.
export function repoFiles(root, dir) {
  const r = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', dir], root);
  if (r.status !== 0) return listFiles(path.join(root, dir));
  const pre = dir.replace(/\/+$/, '') + '/';
  return [...new Set(r.stdout.split('\0').filter((f) => f.startsWith(pre) && fs.existsSync(path.join(root, f))).map((f) => f.slice(pre.length)))].sort();
}
export function acceptanceFiles(root, team, slug) {
  return repoFiles(root, team.paths.acceptance).filter((f) => path.basename(f).startsWith(slug)).map((f) => path.posix.join(team.paths.acceptance, f));
}
export function adversaryFiles(root, team, slug) {
  return repoFiles(root, team.paths.adversary).filter((f) => path.basename(f).startsWith(`${slug}-`)).map((f) => path.posix.join(team.paths.adversary, f));
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
      if (e.name === 'node_modules' || e.name === '.venv') { found.push(path.relative(root, p).replace(/\\/g, '/')); continue; } // 구분자는 /로 정규화 — listFiles와 동일(사고 18: win32에서 테스트 거짓 실패)
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
  // 사고 35(필드 시험 2): 링크는 디렉터리가 아니라 `.gitignore`의 `node_modules/`에 안 걸린다 — 미추적으로 보여 체크포인트(git add -A)가 이 기계의 경로를 커밋했다.
  // 링크는 프레임워크의 것: 저장소 규칙을 고치지 않고 로컬 제외(info/exclude — 모든 worktree 공용, 커밋 안 됨)에 둔다.
  const loose = linked.filter((rel) => git(['check-ignore', '-q', rel], dest).status !== 0);
  if (loose.length) {
    const ex = git(['rev-parse', '--git-path', 'info/exclude'], dest);
    if (!ex.status) {
      const p = path.resolve(dest, ex.stdout);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      const have = readText(p);
      const lines = loose.map((rel) => `/${rel}`).filter((l) => !have.split('\n').includes(l));
      if (lines.length) fs.appendFileSync(p, `${have && !have.endsWith('\n') ? '\n' : ''}# GARAGISTE 의존성 링크(사고 35)\n${lines.join('\n')}\n`);
    }
  }
  return linked;
}
export function out(line) { process.stdout.write(line + '\n'); }
export function fail(line, code = 1) { out(line); process.exit(code); }
export function isMain(metaUrl) {
  if (!process.argv[1] || path.resolve(process.argv[1]) !== fileURLToPath(metaUrl)) return false;
  lawFromMain(metaUrl);
  return true;
}
// 사고 31(필드 시험 1): worktree의 .garagiste/scripts는 그 브랜치가 갈라질 때의 사본이다 — main에 든 정비가 진행 중 unit에 닿지 않아
// build가 옛 redproof로 고쳐진 FAIL을 다시 봤다. 법은 하나: worktree에서 불린 스크립트는 main의 같은 스크립트로 넘긴다(인자·cwd·종료 코드 그대로).
function lawFromMain(metaUrl) {
  const self = fileURLToPath(metaUrl);
  const root = scriptRoot(metaUrl);
  const r = git(['rev-parse', '--git-common-dir'], root);
  if (r.status) return;
  const target = path.join(path.dirname(path.resolve(root, r.stdout)), path.relative(root, self));
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') === fs.readFileSync(self, 'utf8')) return; // main 자신이거나 같은 법
  const run = spawnSync(process.execPath, [target, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(run.status ?? 1);
}
export function short(sha) { return (sha || '').slice(0, 7); }
export function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }
