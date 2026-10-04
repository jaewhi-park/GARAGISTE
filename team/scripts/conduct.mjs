// conduct — Flow 4의 conductor를 모델 밖으로. next.mjs가 낸 한 걸음을 그대로 실행하고(run은 그 명령 · spawn은 팩을 헤드리스로), 멈춤에서 멈춘다. 판단 없음.
// L2 2판 윈도우(고칠 때마다 attack 팩 28·20바퀴) · 3판(「다 ok」를 Q10의 「예」로 · 부재 선언 뒤 루프 재개) · 5판(ship FAIL 줄로 자가 정지):
// 규율 이탈은 전부 모델이 Flow 산문의 빈칸을 읽는 자리에서 났고, 수리는 매번 그 빈칸을 next.mjs로 옮기는 것이었다 — 남은 자리(한 줄을 읽고 그대로 실행하는 것)도 스크립트로.
// 헤드리스엔 SubagentStop 훅이 없다 — 팩이 끝나면 드라이버가 체크포인트·spawn_stop·spawned(실측 토큰·분·비용)를 남긴다(끊긴 spawn의 원장 꼴 — L2 6판 (7)).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { appendLedger, CONDUCT_LOCK, ctx, fail, headSha, isMain, out, pidAlive, readJson, shell, stamp, worktreeDir, writeJson } from './lib.mjs';
import { computeNext, doctorGate, render } from './next.mjs';
import { blocking, diagnose, harnesses, versionLine } from './doctor.mjs';
import { spawnStop } from './checkpoint.mjs';

const S = 'node .garagiste/scripts';
// 멈춤 여섯이 종료 코드다 — 밖(cron·래퍼)이 판단 없이 읽는다
// 셸 인자는 작은따옴표로 — 큰따옴표 안의 $0.01·백틱은 셸이 푼다(비용 문구·모델이 남긴 반려 줄은 데이터다)
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
export const EXIT = { done: 0, fail: 1, ceo: 2, wait: 3, framework: 4, cap: 5 };
// packMinutes·maxUsd가 null이면 team.json budgets(pack_minutes_max 60 · run_usd_max 0=끔)에서 — 무인 안전벨트: 멈춘 팩(L2 6판 2라운드의 끊긴 세션 · 2판 윈도우의 시간 제한에 끝난 배경 명령)과 비용 초과(6판 2라운드 예측 초과)
export const DEFAULTS = { maxSteps: 200, maxMinutes: 0, turns: 200, spawner: '', packMinutes: null, maxUsd: null, packUsd: null }; // packUsd: 팩 하나의 비용 상한(claude --max-budget-usd) — null이면 team.json budgets.pack_usd_max(0=끔)
export const TODO = {
  done: '다음 범위는 CEO가 — work.mjs scope <slug…>|--milestone M<n> 뒤 다시 conduct',
  ceo: 'docs/STATUS.md 「써볼 것」(work.mjs try → tried) · 「정해 주세요」(work.mjs decide) · 「멈춘 이유」 — 접점 하나면 다시 conduct',
  wait: 'CEO 결정(work.mjs decide) 또는 선행 unit — 그 뒤 다시 conduct',
  framework: '그 줄 전문을 정비 채널로 — 우회·수리·스크립트 편집 없이(STATUS 「막힌 것」에 남았다)',
  cap: '상한에 닿았다 — 다시 돌리면 이어서 돈다(--max-steps·--max-minutes·--max-usd)',
};

export function parseArgs(argv) {
  const o = { ...DEFAULTS, once: false, intake: false, check: false, trust: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === 'intake') o.intake = true;
    else if (a === 'check') o.check = true;
    else if (a === 'trust') o.trust = true;
    else if (a === '--once') o.once = true;
    else if (a === '--max-steps') o.maxSteps = Number(argv[++i]);
    else if (a === '--max-minutes') o.maxMinutes = Number(argv[++i]);
    else if (a === '--turns') o.turns = Number(argv[++i]);
    else if (a === '--spawner') o.spawner = argv[++i] || '';
    else if (a === '--pack-minutes') o.packMinutes = Number(argv[++i]);
    else if (a === '--max-usd') o.maxUsd = Number(argv[++i]);
    else if (a === '--pack-usd') o.packUsd = Number(argv[++i]);
    else return { error: `알 수 없는 인자 ${a}` };
  }
  for (const k of ['maxSteps', 'maxMinutes', 'turns', 'packMinutes', 'maxUsd', 'packUsd']) if (o[k] !== null && (!Number.isFinite(o[k]) || o[k] < 0)) return { error: `${k}는 0 이상의 수 — 받은 값 ${o[k]}` };
  return o;
}
// 중첩 세션의 환경 누수(tests/field/turn.sh와 같다): 부모 Claude 세션의 CLAUDE* 변수가 새면 세션 id가 합쳐지고 권한이 부모로 보류된다 — 인증에 필요한 것만 남긴다
const KEEP = new Set(['CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST', 'CLAUDE_CODE_PROXY_RESOLVES_HOSTS', 'CLAUDE_SESSION_INGRESS_TOKEN_FILE', 'CLAUDE_CODE_ACCOUNT_UUID', 'CLAUDE_CODE_ORGANIZATION_UUID', 'CLAUDE_CODE_USER_EMAIL']);
export function headlessEnv(env, extra = {}) {
  const e = {};
  for (const [k, v] of Object.entries(env)) if (!/^(CLAUDE[A-Z_]*|CLAUDECODE)$/.test(k) || KEEP.has(k)) e[k] = v;
  return { ...e, ...extra };
}
// 팩 하나 = 헤드리스 세션 하나. 기본은 Claude Code(`claude -p <팩 경로> --agent <팩>` — .claude/agents/<팩>.md가 모델·도구·정체를 정하고, 훅이 경계를 지킨다).
// --spawner "<템플릿>"은 다른 하네스·시험용({path} {pack} {slug} {model} {turns}) — 셸로 돈다. 결과는 stdout의 JSON(claude -p --output-format json 꼴)이면 토큰·분·비용을 읽고, 아니면 글만.
// 깃발 호환(9라운드 2026-10-04, 측정): claude 2.1.289엔 --max-turns가 없다 — 기본 spawner가 첫 spawn마다 unknown option으로 죽고 드라이버는 「두 번 비정상 종료」로 멈췄을 것.
// 가짜 spawner로 돈 e2e는 이걸 못 본다. --help의 텍스트에서 기본 argv의 깃발을 찍어 본다(모델 0·네트워크 0).
export function missingFlags(helpText, argv) {
  const help = String(helpText || '');
  const miss = argv.filter((a) => /^--[a-z]/.test(a)).filter((f) => !new RegExp(`(^|[\\s,])${f.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&')}(?=[\\s,<=]|$)`, 'm').test(help));
  if (argv.includes('-p') && !/(^|\s)-p,|--print\b/.test(help)) miss.unshift('-p');
  return miss;
}
export function spawnerCommand({ template, pack, slug, packPath, model, turns, packUsd = 0 }) {
  if (template) {
    const vars = { path: packPath, pack, slug, model: model || '', turns: String(turns) };
    const cmd = template.replace(/\{(path|pack|slug|model|turns)\}/g, (_, k) => vars[k]);
    // 셸 메타문자가 없는 템플릿은 argv로 직접 띄운다 — 시간 상한의 kill이 셸이 아니라 그 프로세스에 닿는다
    return /[|&;<>$`"'\\*?(){}[\]]/.test(cmd) ? { shell: cmd } : { argv: cmd.trim().split(/\s+/) };
  }
  // --max-turns는 claude 2.1.289에 없다(9라운드 측정) — 팩의 상한은 시간(--pack-minutes)과 비용(--max-budget-usd, team budgets.pack_usd_max)으로. {turns}는 템플릿용으로 남긴다.
  return { argv: ['claude', '-p', packPath, '--agent', pack, '--output-format', 'json', '--permission-mode', 'acceptEdits', '--permission-prompts', 'none', ...(packUsd > 0 ? ['--max-budget-usd', String(packUsd)] : [])] }; // prompts none(10라운드): 무인엔 답할 사람이 없다 — 묻는 건 거부(기본 host는 호스트 없는 -p에서 암묵이었다)
}
export function parseResult(stdout) {
  const raw = String(stdout || '');
  let j = null;
  try { j = JSON.parse(raw); } catch { const m = raw.lastIndexOf('\n{'); if (m >= 0) { try { j = JSON.parse(raw.slice(m + 1)); } catch { j = null; } } }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { json: null, text: raw.trim(), tokens: null, minutes: null, cost: null, turns: null, isError: false, model: null, reason: null };
  const u = j.usage || {};
  // 측정(12라운드 2026-10-04, claude 2.1.289): 예산 초과(error_max_budget_usd)로 끝난 결과는 usage가 전부 0이고 modelUsage에만 실측이 있다 — usage가 0이면 modelUsage 합으로
  const mu = j.modelUsage && typeof j.modelUsage === 'object' ? Object.values(j.modelUsage) : [];
  const fromUsage = ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'].reduce((a, k) => a + (Number(u[k]) || 0), 0);
  const fromModels = mu.reduce((a, m) => a + ['inputTokens', 'outputTokens', 'cacheCreationInputTokens', 'cacheReadInputTokens'].reduce((b, k) => b + (Number(m?.[k]) || 0), 0), 0);
  const tokens = fromUsage || fromModels || null;
  const minutes = Number(j.duration_ms) > 0 ? Math.round(j.duration_ms / 6000) / 10 : null;
  const model = j.modelUsage && typeof j.modelUsage === 'object' ? Object.keys(j.modelUsage).join('+') || null : null; // 실측 모델 — 편성(team.json)이 실제로 적용됐는지가 원장에 남는다
  const isError = !!j.is_error || (!!j.subtype && j.subtype !== 'success');
  const reason = [isError && j.subtype && j.subtype !== 'success' ? j.subtype : '', ...(Array.isArray(j.errors) ? j.errors.map(String) : [])].filter(Boolean).join(': ') || null;
  return { json: j, text: String(j.result ?? ''), tokens, minutes, cost: j.total_cost_usd ?? null, turns: j.num_turns ?? null, isError, model, reason };
}
// build·attack의 반려 — 마지막 줄들의 `spec: <한 줄>`(팩 규칙). Flow 4: brief.mjs spec <slug> --return "<그 줄>"
export function specReturn(text) {
  const lines = String(text || '').trim().split('\n').slice(-5).reverse();
  for (const l of lines) { const m = /^\s*spec:\s*(.+?)\s*$/.exec(l); if (m) return m[1]; }
  return null;
}
// 같은 FAIL의 열쇠 — 첫 FAIL 줄과 그 다음 줄(ship은 「FAIL ship x 1/8」 아래 줄이 조건이다). state.mjs repeatedFails와 같은 뜻(되풀이 = 2).
export function failKey(output) {
  const lines = String(output || '').split('\n').filter((l) => l.trim());
  const i = lines.findIndex((l) => /^FAIL /.test(l));
  return i < 0 ? null : lines.slice(i, i + 2).join(' | ').slice(0, 160);
}
// 진전 없는 팩: 같은 unit·같은 팩이 worktree HEAD를 바꾸지 못한 채 거듭 돌면 멈춘다(한 번은 우연, 두 번은 패턴). spike는 커밋하지 않는 팩이라 세지 않는다.
export function noProgress(history, { slug, pack, before, after }) {
  if (pack === 'spike' || pack === 'intake') return 0;
  const key = `${slug} ${pack}`;
  const n = before && before === after ? (history.get(key) || 0) + 1 : 0;
  history.set(key, n);
  return n;
}
// CEO 결정만 요구하는 FAIL(두 번째 spec 반려 · 팩 상한 2배 · 이미 충족 — 사고 59)은 안내 끝에 `work.mjs ask <slug> "<질문>" --hold`를 준다 — L2 아침 규칙: 그 줄대로 올리고 그 unit만 세운 채 다음 seed.
export function holdCommand(text) {
  const m = /node \.garagiste\/scripts\/work\.mjs ask (\S+) "((?:[^"\\]|\\.)*)" --hold/.exec(String(text || ''));
  return m ? { slug: m[1], question: m[2], cmd: `${S}/work.mjs ask ${m[1]} ${q(m[2])} --hold` } : null;
}
// 사고 71(15라운드 넷째 run): 반려 전달(brief.mjs spec --return)이 FAIL이면(system unit — spec이 없다) 팩은 「빈손 + 반려」로 정당해 보여 진전 없음에도 되풀이에도 안 세어졌다 — build 30회·$2.87.
// 그 FAIL은 run 걸음의 FAIL과 같은 열쇠(failKey)로 센다(되풀이 = 2). held는 CEO에게 간 것(열쇠 없음) · FAIL 줄 없는 비정상 종료도 열쇠 하나.
export function handOffKey(rc) { return rc && rc.status && !rc.held ? (failKey(rc.text) || 'brief spec --return 비정상 종료(FAIL 줄 없음)') : null; }
// 잠금 = heartbeat: 한 저장소에 드라이버 하나(unit은 한 번에 하나 — 둘이면 같은 unit을 두 번 띄우거나 ship이 겹친다). 살아 있는 pid면 거부, 죽은 pid의 잠금은 그 자리에서 교체.
export function lockAlive(lock, { isAlive = pidAlive } = {}) { return !!(lock && lock.pid && isAlive(lock.pid)); }
function writeLock(main, started, data = {}) { writeJson(path.join(main, CONDUCT_LOCK), { pid: process.pid, started, at: new Date().toISOString(), ...data }); }
function clearLock(main) { try { fs.rmSync(path.join(main, CONDUCT_LOCK), { force: true }); } catch { /* 없음 */ } }
// 작업 공간 신뢰(12라운드 2026-10-04, 측정 — claude 2.1.289 `-p --agent build`, 신뢰 없는 폴더): stderr 「Ignoring 66 permissions.allow entries from .claude/settings.json: this workspace has not been trusted」 +
// Bash 한 번이 permission_denials로 거부 — 팩은 스크립트 하나도 못 돈다(-p는 신뢰 대화를 건너뛰지만 allow 목록도 버린다). CLI가 권하는 수리가 바로 그 키다 — 손으로 JSON을 고치게 하지 않고 명령 하나로.
const realOf = (p) => { try { return fs.realpathSync.native(p); } catch { return p; } };
export function trustedIn(cj, root) {
  const keys = cj && cj.projects ? Object.keys(cj.projects) : [];
  const real = realOf(root);
  return keys.some((k) => { try { return (k === root || k === real || fs.realpathSync.native(k) === real) && cj.projects[k]?.hasTrustDialogAccepted === true; } catch { return false; } });
}
export function trustWorkspace(root, { home = os.homedir() } = {}) {
  const file = path.join(home, '.claude.json');
  if (!fs.existsSync(file)) return { error: `${file} 없음 — Claude Code에 로그인한 기계에서만(대화형 claude를 한 번 열면 생긴다)` };
  const cj = readJson(file, null);
  if (!cj || typeof cj !== 'object' || Array.isArray(cj)) return { error: `${file}을 읽지 못했다(JSON 아님) — 손대지 않는다` };
  if (trustedIn(cj, root)) return { ok: true, already: true, file, keys: [root] };
  cj.projects = cj.projects && typeof cj.projects === 'object' && !Array.isArray(cj.projects) ? cj.projects : {};
  const keys = [...new Set([root, realOf(root)])]; // claude는 cwd 그대로를 키로 쓴다 — 심볼릭 링크면 둘 다
  for (const k of keys) cj.projects[k] = { ...(cj.projects[k] || {}), hasTrustDialogAccepted: true };
  const tmp = `${file}.garagiste-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(cj, null, 2)); fs.renameSync(tmp, file); // 원자적 — 다른 키는 그대로. 대화형 claude가 떠 있으면 그쪽이 덮을 수 있다(안내)
  return { ok: true, already: false, file, keys };
}
// 실전 전 preflight(4라운드 2026-10-04): 헤드리스 spawner의 전제를 한 줄씩 — 모델 없이 확인할 수 있는 것은 전부 여기서. 실패는 fail-closed(exit 1), 고칠 길과 함께.
export function preflight(root, { env = process.env, home = os.homedir(), spawn = spawnSync, team = null, customSpawner = false } = {}) {
  const probs = []; const ok = [];
  const d = blocking(diagnose(root));
  if (d.length) probs.push(...d.map((x) => `doctor: ${x}`)); else ok.push('doctor OK');
  ok.push(versionLine(root).startsWith('VERSION garagiste') ? versionLine(root).replace(/^VERSION garagiste (\S{7})\S* .*$/, 'VERSION $1') : 'VERSION 없음(옛 설치본 — install.sh 다시)');
  const lock = readJson(path.join(root, CONDUCT_LOCK), null);
  if (lock && lock.pid && pidAlive(lock.pid)) probs.push(`이미 돌고 있다 — pid ${lock.pid} · ${[lock.step, lock.slug, lock.pack].filter(Boolean).join(' ')} · ${lock.at} (한 저장소에 드라이버 하나)`);
  else { const orphan = orphanOf(lock); if (orphan) probs.push(`고아 팩 — ${orphan}`); else ok.push('잠금 없음'); }
  const gap = spawnerGap(root, customSpawner);
  if (gap) { probs.push(gap); return { probs, ok }; }
  if (customSpawner) { ok.push(`spawner 사용자 지정(${harnesses(root).join('+') || '배선 없음'}) — claude CLI·신뢰 검사 생략`); return { probs, ok }; }
  const v = spawn('claude', ['--version'], spawnOpts({ encoding: 'utf8', env }));
  if (v.error || v.status !== 0) probs.push('claude CLI 없음(PATH) — 기본 spawner는 `claude -p --agent`다: Claude Code를 설치하거나 --spawner "<명령 템플릿>"');
  else ok.push(`claude ${(v.stdout || '').trim().split(/\s+/)[0] || '?'}`);
  if (!v.error && v.status === 0) {
    const h = spawn('claude', ['--help'], spawnOpts({ encoding: 'utf8', env }));
    const help = `${h.stdout || ''}${h.stderr || ''}`;
    const argv = spawnerCommand({ pack: 'build', slug: 'x', packPath: 'p.md', model: '', turns: 0, packUsd: Number(team?.budgets?.pack_usd_max ?? 0) }).argv; // 기본 spawner의 깃발 그대로
    const miss = missingFlags(help, argv);
    if (miss.length) probs.push(`claude에 없는 깃발: ${miss.join(' ')} — 기본 spawner(${argv.filter((a) => /^-/.test(a)).join(' ')})가 서지 않는다: GARAGISTE 갱신(install.sh 다시) 또는 --spawner "<명령 템플릿>"`);
    else if (!/acceptEdits/.test(help)) probs.push('claude --permission-mode에 acceptEdits가 없다 — 헤드리스 팩의 파일 쓰기마다 승인이 막힌다: Claude Code 판을 확인');
    else ok.push('깃발 ok');
  }
  const agents = ['intake', 'spec', 'build', 'attack', 'spike', 'boot', 'adopt'].filter((a) => !fs.existsSync(path.join(root, '.claude', 'agents', `${a}.md`)));
  if (agents.length) probs.push(`.claude/agents 없음: ${agents.join(', ')} — install.sh claude 다시(--agent <팩>이 읽는 파일)`); else ok.push('agents 7');
  const settings = readJson(path.join(root, '.claude', 'settings.json'), null);
  if (!settings || !(settings.permissions?.allow || []).some((x) => /^Bash\(node/.test(x))) probs.push('.claude/settings.json allow에 Bash(node…) 없음 — 헤드리스엔 승인 대화가 없어 팩의 스크립트 호출이 전부 막힌다: team/claude/settings.json으로'); else ok.push('allow node');
  // 신뢰 안 된 작업 공간은 프로젝트 허용 목록을 무시한다 — 12라운드 측정(trustWorkspace 주석): -p는 신뢰 대화를 건너뛰지만 allow도 버려 팩의 Bash가 전부 거부된다
  if (!trustedIn(readJson(path.join(home, '.claude.json'), null), root)) probs.push(`작업 공간 신뢰 없음(${path.join(home, '.claude.json')} projects[${root}].hasTrustDialogAccepted) — 신뢰 없는 폴더의 claude -p는 .claude/settings.json의 allow 목록을 무시해 --permission-prompts none 아래 팩의 Bash가 전부 거부된다(측정 2026-10-04): node .garagiste/scripts/conduct.mjs trust(그 키를 쓴다 — 대화형 claude가 떠 있지 않을 때) 또는 그 폴더에서 대화형 claude를 한 번`); else ok.push('신뢰 ok');
  return { probs, ok };
}
// 5라운드(2026-10-04, Q9 스폰 방법): 기본 spawner는 claude -p --agent <팩> — .claude/agents가 없는 설치본(opencode만)에선 서지 않는다. 템플릿 없이 돌리면 팩 spawn이 전부 비정상 종료로 세어 프레임워크 FAIL(exit 4)로 끝났을 것 — 그 전에 한 줄로 선다.
export function spawnerGap(root, customSpawner) {
  if (customSpawner) return null;
  const hs = harnesses(root);
  if (hs.includes('claude')) return null;
  return (hs.includes('opencode') ? 'opencode 설치본' : '하네스 배선 없음') + ' — 기본 spawner(claude -p … --agent <팩>)는 .claude/agents 없이 서지 않는다: --spawner "<팩을 띄우는 명령 템플릿 {path} {pack} {slug} {model} {turns}>" (opencode 예: opencode run --agent {pack} "$(cat {path})" — 설치된 opencode 판에 맞춰 조정, JSON이 아닌 출력은 토큰·비용 0으로 기록된다)';
}
export function stopLine(kind, text, at = new Date().toISOString()) { return `STOP ${kind} ${at} — ${String(text).split('\n')[0]}\nCEO: ${TODO[kind]}`; }

function runCmd(c, cmd, { hold = true } = {}) {
  const r = shell(cmd, { cwd: c.main });
  const text = `${r.stdout}${r.stderr ? (r.stdout.endsWith('\n') || !r.stdout ? '' : '\n') + r.stderr : ''}`.trim();
  out(text.split('\n').map((l) => `  ${l}`).join('\n'));
  const h = r.status && hold ? holdCommand(text) : null;
  if (h) { out(`  → hard 질문으로 세운다(그 unit만): ${h.cmd}`); runCmd(c, h.cmd, { hold: false }); }
  return { status: r.status, text, held: !!h };
}
function logSpawn(c, slug, pack, record) {
  try {
    const dir = path.join(c.main, c.team.paths.logs || '.garagiste/session/logs');
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, `conduct-${slug}-${pack}-${stamp()}.json`);
    fs.writeFileSync(f, JSON.stringify(record, null, 2));
    return path.relative(c.main, f).replace(/\\/g, '/');
  } catch { return null; }
}
// 팩 프로세스 하나 — 비동기 spawn(6라운드 2026-10-04, 고아 팩 측정): spawnSync로 띄운 팩은 드라이버가 죽어도(SIGKILL·OOM) 살아 남고, 다음 드라이버는 죽은 잠금을 갈아 끼우고 같은 unit의 팩을 또 띄웠다 —
// 둘이 한 worktree에 쓴다(사고 26 꼴의 충돌·원장 귀속 어긋남). 비동기로 띄워 child pid를 잠금에 적고(onSpawn), 드라이버의 SIGINT/SIGTERM은 팩에 넘긴다(installSignals).
// Windows(11라운드 2026-10-04 — CEO의 환경): npm으로 깐 Claude Code는 claude.cmd 셸 심이다 — Node의 spawn()은 셸 없이 .cmd를 못 찾는다(ENOENT → 「claude CLI 없음」 거짓 음성, 팩 spawn 전부 실패).
// win32는 shell: true로 띄운다(인자에 공백·메타문자가 없다 — 팩 경로·깃발뿐). 그러면 자식은 cmd.exe라 kill이 셸만 죽이고 팩이 고아가 된다 — 종료는 taskkill /T(트리)로.
export function spawnOpts(opts, platform = process.platform) { return platform === 'win32' ? { ...opts, shell: true } : opts; }
export function killPlan(pid, platform = process.platform, signal = 'SIGTERM') { return platform === 'win32' ? { cmd: 'taskkill', args: ['/pid', String(pid), '/T', '/F'] } : { signal }; }
function killChild(child, signal = 'SIGTERM') {
  const k = killPlan(child.pid, process.platform, signal);
  if (k.cmd) { try { spawnSync(k.cmd, k.args, { stdio: 'ignore' }); } catch { /* 이미 끝났다 */ } } else { try { child.kill(k.signal); } catch { /* 이미 끝났다 */ } }
}
let CHILD = null;
export function runChild(cmd, { cwd, env, timeoutMs = 0, onSpawn = null, spawner = spawn, killAfterMs = 5000 } = {}) {
  return new Promise((resolve) => {
    const opts = { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] };
    const child = cmd.argv ? spawner(cmd.argv[0], cmd.argv.slice(1), spawnOpts(opts)) : spawner(cmd.shell, { ...opts, shell: true });
    let stdout = ''; let stderr = ''; let error = null; let timedOut = false; let settled = false; let timer = null; let killer = null;
    const done = (status, signal) => { if (settled) return; settled = true; if (timer) clearTimeout(timer); if (killer) clearTimeout(killer); if (CHILD === child) CHILD = null; resolve({ status, signal, stdout, stderr, error, timedOut, pid: child.pid ?? null }); };
    // 13라운드: SIGTERM을 무시하는(또는 정리에 오래 걸리는) 팩이 드라이버를 영원히 세우지 않게 — installSignals와 같은 5초 뒤 SIGKILL
    if (timeoutMs > 0) timer = setTimeout(() => { timedOut = true; killChild(child, 'SIGTERM'); killer = setTimeout(() => killChild(child, 'SIGKILL'), killAfterMs); }, timeoutMs);
    const cap = 64 * 1024 * 1024;
    if (child.stdout) { child.stdout.setEncoding('utf8'); child.stdout.on('data', (d) => { if (stdout.length < cap) stdout += d; }); }
    if (child.stderr) { child.stderr.setEncoding('utf8'); child.stderr.on('data', (d) => { if (stderr.length < cap) stderr += d; }); }
    child.on('error', (e) => { error = e; done(null, null); });
    child.on('close', (status, signal) => done(status, signal));
    CHILD = child;
    if (child.pid && onSpawn) onSpawn(child.pid);
  });
}
// 고아 팩: 앞 드라이버는 죽었는데(잠금 pid 죽음) 그 팩 프로세스(잠금 child)가 아직 돈다 — 끝나길 기다리거나 CEO가 끊는다. 다음 드라이버는 그 자리에서 선다.
export function orphanOf(lock, { isAlive = pidAlive } = {}) {
  if (!lock || !lock.child || (lock.pid && isAlive(lock.pid)) || !isAlive(lock.child)) return null;
  return `앞 드라이버(pid ${lock.pid})는 죽었는데 그 팩 프로세스(pid ${lock.child} · ${[lock.slug, lock.pack].filter(Boolean).join(' ')})가 아직 돈다 — 끝나길 기다리거나 kill ${lock.child} 뒤 다시(둘이 같은 worktree에 쓰면 충돌·원장 귀속이 어긋난다)`;
}
function installSignals(c) {
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => {
    const child = CHILD;
    try { appendLedger(c.main, c.team, { kind: 'conduct', event: 'stop', stop: 'signal', usd: Math.round(USD * 1000) / 1000, text: `${sig}${child ? ` — 팩(pid ${child.pid})에 SIGTERM` : ''}` }); } catch { /* 원장 없음 */ }
    clearLock(c.main);
    out(`STOP signal ${new Date().toISOString()} — ${sig}${child ? ` → 팩 pid ${child.pid}에 SIGTERM, 끝나면 나간다` : ''}\nCEO: ${TODO.cap}`);
    if (!child) process.exit(EXIT.cap);
    killChild(child, 'SIGTERM');
    const t = setTimeout(() => { killChild(child, 'SIGKILL'); process.exit(EXIT.cap); }, 5000);
    child.once('close', () => { clearTimeout(t); process.exit(EXIT.cap); });
  });
}
// 팩을 띄우고 끝까지 기다린다 → 체크포인트·spawn_stop → spawned(실측) → 반려 전달. 반환: { ok, text, tokens, minutes }
export async function spawnPack(c, { pack, slug, path: packPath }, o, { spawner = spawn, onSpawn = null } = {}) {
  const wt = slug === 'intake' ? c.main : worktreeDir(c.main, c.team, slug);
  const model = c.team.models[pack] || '';
  const cmd = spawnerCommand({ template: o.spawner, pack, slug, packPath, model, turns: o.turns, packUsd: o.packUsd || 0 });
  const env = headlessEnv(process.env, { GARAGISTE_PACK: pack, GARAGISTE_SLUG: slug, GARAGISTE_PACK_PATH: packPath, GARAGISTE_WORKTREE: wt, GARAGISTE_MODEL: model });
  const t0 = Date.now();
  const r = await runChild(cmd, { cwd: c.main, env, timeoutMs: o.packMinutes > 0 ? Math.round(o.packMinutes * 60000) : 0, onSpawn, spawner });
  const timedOut = r.timedOut;
  const wall = Math.round((Date.now() - t0) / 6000) / 10;
  const p = parseResult(r.stdout);
  const status = r.status ?? 1;
  const log = logSpawn(c, slug, pack, { cmd: cmd.argv || cmd.shell, pid: r.pid, status, signal: r.signal, timed_out: timedOut, error: r.error ? String(r.error) : null, stdout: r.stdout || '', stderr: r.stderr || '' });
  spawnStop(c.main, { agent_type: pack }); // 헤드리스엔 SubagentStop 훅이 없다 — 더러운 worktree는 wip로, 원장엔 spawn_stop
  const flags = [p.tokens ? `--tokens ${p.tokens}` : '', `--minutes ${p.minutes ?? wall}`, (p.model || model) ? `--model ${p.model || model}` : '', `--note ${q(`conduct${p.cost != null ? ` $${p.cost}` : ''}${p.turns != null ? ` turns ${p.turns}` : ''} exit ${status}${p.reason ? ` ${p.reason}` : ''}${log ? ` log ${log}` : ''}`)}`].filter(Boolean).join(' ');
  runCmd(c, `${S}/work.mjs spawned ${slug} ${pack} ${flags}`);
  const tail = p.text.trim().split('\n').slice(-3).map((l) => `  │ ${l}`).join('\n');
  if (tail.trim()) out(tail);
  const ok = status === 0 && !p.isError && !r.error;
  const returned = ok && (pack === 'build' || pack === 'attack') ? specReturn(p.text) : null; // 반려는 정당한 「빈손」 — 진전 없음으로 세지 않는다
  let held = false; let returnFail = null;
  if (!ok) out(timedOut ? `  팩 시간 상한 ${o.packMinutes}분 — 끊었다(SIGTERM)${log ? ` · ${log}` : ''}` : `  팩 종료 비정상 — exit ${status}${p.reason ? ` · ${p.reason}` : p.isError ? ' · is_error' : ''}${r.error ? ` · ${r.error}` : ''}${log ? ` · ${log}` : ''}`);
  else if (returned) { const rc = runCmd(c, `${S}/brief.mjs spec ${slug} --return ${q(returned)}`); held = rc.held; returnFail = handOffKey(rc); } // system unit이면 brief가 attack 팩으로 돌린다(사고 71)
  return { ok, text: p.text, tokens: p.tokens, minutes: p.minutes ?? wall, cost: Number(p.cost) || 0, status, log, returned: !!returned, held, returnFail, timedOut };
}
let USD = 0;
function stop(c, kind, text) {
  appendLedger(c.main, c.team, { kind: 'conduct', event: 'stop', stop: kind, usd: Math.round(USD * 1000) / 1000, text: String(text).split('\n')[0].slice(0, 300) });
  clearLock(c.main);
  const st = shell(`${S}/state.mjs`, { cwd: c.main }); // STATUS를 다시 낸다 — 첫 줄이 CEO가 보는 전부
  out(stopLine(kind, text));
  if (st.stdout.trim()) out(`STATUS: ${st.stdout.trim().split('\n')[0]}`);
  process.exit(EXIT[kind]);
}
async function intake(c, o) {
  const b = runCmd(c, `${S}/brief.mjs intake`);
  if (b.status) return stop(c, 'framework', failKey(b.text) || 'brief intake FAIL');
  const packPath = (/^PACK (\S+)/m.exec(b.text) || [])[1];
  if (!packPath) return stop(c, 'framework', `PACK 줄 없음 — ${b.text.split('\n')[0]}`);
  const r = await spawnPack(c, { pack: 'intake', slug: 'intake', path: packPath }, o, { onSpawn: (pid) => writeLock(c.main, o.startedAt, { step: 'spawn', slug: 'intake', pack: 'intake', child: pid }) });
  USD += r.cost || 0;
  if (!r.ok) return stop(c, 'framework', `intake 팩 비정상 종료 — exit ${r.status}${r.log ? ` · ${r.log}` : ''}`);
  runCmd(c, `${S}/work.mjs list`);
  return stop(c, 'ceo', 'intake 끝 — docs/BACKLOG.md의 unit 줄과 docs/DECISIONS.md 「정해 주세요」를 CEO에게 한 줄씩(예/아니오) → work.mjs decide → work.mjs scope → 「가」 = conduct');
}
async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.error) fail(`FAIL conduct: ${o.error} — 사용법: conduct.mjs [check|trust|intake] [--once] [--max-steps N] [--max-minutes M] [--max-usd D] [--pack-usd D] [--pack-minutes P] [--turns T] [--spawner "<템플릿 {path} {pack} {slug} {model} {turns}>"]`);
  let c = ctx();
  if (c.root !== c.main) fail('FAIL conduct는 메인 저장소에서만 — worktree 안에서 돌리지 않는다');
  if (o.check) {
    const r = preflight(c.main, { customSpawner: !!o.spawner, team: c.team });
    if (r.probs.length) fail(`FAIL conduct check ${r.probs.length}\n${r.probs.map((x) => `- ${x}`).join('\n')}${r.ok.length ? `\n(ok: ${r.ok.join(' · ')})` : ''}`);
    return out(`PASS conduct check — ${r.ok.join(' · ')}`);
  }
  if (o.trust) { // 신뢰 키 하나 — 대화형 claude를 열 수 없는 자리(서버·WSL·cron)에서 preflight의 「신뢰 없음」을 닫는다
    const r = trustWorkspace(c.main);
    if (r.error) fail(`FAIL conduct trust: ${r.error}`);
    return out(r.already ? `PASS conduct trust — 이미 신뢰됨(${r.file} projects[${c.main}])` : `PASS conduct trust — ${r.file} projects[${r.keys.join(' · ')}].hasTrustDialogAccepted=true — claude -p가 이 폴더의 .claude/settings.json allow를 읽는다(대화형 claude가 떠 있었다면 그쪽이 덮을 수 있다 — conduct.mjs check로 확인)`);
  }
  doctorGate(c);
  const gap = spawnerGap(c.main, !!o.spawner);
  if (gap) fail(`FAIL conduct: ${gap}`);
  o.packMinutes ??= Number(c.team.budgets.pack_minutes_max ?? 60);
  o.maxUsd ??= Number(c.team.budgets.run_usd_max ?? 0);
  o.packUsd ??= Number(c.team.budgets.pack_usd_max ?? 0);
  const lock = readJson(path.join(c.main, CONDUCT_LOCK), null);
  const orphan = orphanOf(lock);
  if (orphan) fail(`FAIL conduct: ${orphan}`);
  if (lockAlive(lock)) fail(`FAIL conduct: 이미 돌고 있다 — pid ${lock.pid} · ${[lock.step, lock.slug, lock.pack].filter(Boolean).join(' ')} · ${lock.at} (한 저장소에 드라이버 하나 — unit은 한 번에 하나다. 정말 죽었으면 ${CONDUCT_LOCK}을 지운다)`);
  const startedAt = new Date().toISOString(); o.startedAt = startedAt;
  writeLock(c.main, startedAt, { step: 'start' });
  process.env.GARAGISTE_CONDUCT = String(process.pid); // 11라운드: 내 자식(runCmd의 스크립트·팩)은 잠금을 지나간다 — 밖의 대화형 conductor는 선다(lib.conductRunning)
  installSignals(c);
  appendLedger(c.main, c.team, { kind: 'conduct', event: 'start', spawner: o.spawner ? 'custom' : 'claude', max_steps: o.maxSteps, max_minutes: o.maxMinutes, pack_minutes: o.packMinutes, max_usd: o.maxUsd, pack_usd: o.packUsd });
  if (o.intake) { writeLock(c.main, startedAt, { step: 'intake' }); return await intake(c, o); }
  const started = Date.now();
  const fails = new Map(); const history = new Map();
  for (let steps = 0; ; steps++) {
    if (steps >= o.maxSteps) return stop(c, 'cap', `걸음 상한 ${o.maxSteps}`);
    if (o.maxMinutes && (Date.now() - started) / 60000 >= o.maxMinutes) return stop(c, 'cap', `시간 상한 ${o.maxMinutes}분`);
    if (o.maxUsd > 0 && USD >= o.maxUsd) return stop(c, 'cap', `비용 상한 $${o.maxUsd} — 이 실행 $${Math.round(USD * 1000) / 1000}`);
    c = ctx(); // team.json·unit 상태는 걸음마다 다시 읽는다(boot가 commands를 채운다)
    const r = computeNext(c);
    out(render(r));
    writeLock(c.main, startedAt, { step: r.kind, slug: r.slug || null, pack: r.pack || null, steps, usd: Math.round(USD * 1000) / 1000 });
    if (r.kind === 'ceo' || r.kind === 'wait' || r.kind === 'done') return stop(c, r.kind, r.text);
    if (r.kind === 'run') {
      const x = runCmd(c, r.cmd);
      const key = x.status && !x.held ? failKey(x.text) : null;
      if (key) { const n = (fails.get(key) || 0) + 1; fails.set(key, n); if (n >= 2) return stop(c, 'framework', `같은 FAIL 되풀이 — ${key}`); }
    } else if (r.kind === 'spawn') {
      const wt = worktreeDir(c.main, c.team, r.slug);
      const before = fs.existsSync(wt) ? headSha(wt) : null;
      const x = await spawnPack(c, r, o, { onSpawn: (pid) => writeLock(c.main, startedAt, { step: 'spawn', slug: r.slug, pack: r.pack, steps, usd: Math.round(USD * 1000) / 1000, child: pid }) });
      USD += x.cost || 0;
      const after = fs.existsSync(wt) ? headSha(wt) : null;
      if (!x.ok) { const key = `spawn ${r.slug} ${r.pack}`; const n = (fails.get(key) || 0) + 1; fails.set(key, n); if (n >= 2) return stop(c, 'framework', `팩이 두 번 비정상 종료 — ${key}(exit ${x.status})${x.log ? ` · ${x.log}` : ''}`); }
      else if (x.returnFail) { const n = (fails.get(x.returnFail) || 0) + 1; fails.set(x.returnFail, n); if (n >= 2) return stop(c, 'framework', `반려를 받을 길이 없다(사고 71) — 같은 FAIL 되풀이: ${x.returnFail}`); } // 반려 전달의 FAIL — run 걸음의 FAIL과 같은 열쇠·규칙
      else if (!x.returned && noProgress(history, { slug: r.slug, pack: r.pack, before, after }) >= 2) return stop(c, 'framework', `${r.pack} 팩이 ${r.slug}에서 두 번 돌았는데 worktree가 그대로다(HEAD ${(after || '').slice(0, 7)}) — 팩 로그 ${x.log || '없음'}`);
    } else return stop(c, 'framework', `모르는 걸음 ${r.kind} — ${render(r)}`);
    if (o.once) return stop(c, 'cap', '--once');
  }
}
if (isMain(import.meta.url)) main().catch((e) => fail(`FAIL conduct: ${(e && e.stack) || e}`));
