// conduct — Flow 4의 conductor를 모델 밖으로. next.mjs가 낸 한 걸음을 그대로 실행하고(run은 그 명령 · spawn은 팩을 헤드리스로), 멈춤에서 멈춘다. 판단 없음.
// L2 2판 윈도우(고칠 때마다 attack 팩 28·20바퀴) · 3판(「다 ok」를 Q10의 「예」로 · 부재 선언 뒤 루프 재개) · 5판(ship FAIL 줄로 자가 정지):
// 규율 이탈은 전부 모델이 Flow 산문의 빈칸을 읽는 자리에서 났고, 수리는 매번 그 빈칸을 next.mjs로 옮기는 것이었다 — 남은 자리(한 줄을 읽고 그대로 실행하는 것)도 스크립트로.
// 헤드리스엔 SubagentStop 훅이 없다 — 팩이 끝나면 드라이버가 체크포인트·spawn_stop·spawned(실측 토큰·분·비용)를 남긴다(끊긴 spawn의 원장 꼴 — L2 6판 (7)).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { appendLedger, ctx, fail, headSha, isMain, out, shell, stamp, worktreeDir } from './lib.mjs';
import { computeNext, doctorGate, render } from './next.mjs';
import { spawnStop } from './checkpoint.mjs';

const S = 'node .garagiste/scripts';
// 멈춤 여섯이 종료 코드다 — 밖(cron·래퍼)이 판단 없이 읽는다
// 셸 인자는 작은따옴표로 — 큰따옴표 안의 $0.01·백틱은 셸이 푼다(비용 문구·모델이 남긴 반려 줄은 데이터다)
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
export const EXIT = { done: 0, fail: 1, ceo: 2, wait: 3, framework: 4, cap: 5 };
export const DEFAULTS = { maxSteps: 200, maxMinutes: 0, turns: 200, spawner: '' };
export const TODO = {
  done: '다음 범위는 CEO가 — work.mjs scope <slug…>|--milestone M<n> 뒤 다시 conduct',
  ceo: 'docs/STATUS.md 「써볼 것」(work.mjs try → tried) · 「정해 주세요」(work.mjs decide) · 「멈춘 이유」 — 접점 하나면 다시 conduct',
  wait: 'CEO 결정(work.mjs decide) 또는 선행 unit — 그 뒤 다시 conduct',
  framework: '그 줄 전문을 정비 채널로 — 우회·수리·스크립트 편집 없이(STATUS 「막힌 것」에 남았다)',
  cap: '상한에 닿았다 — 다시 돌리면 이어서 돈다(--max-steps·--max-minutes)',
};

export function parseArgs(argv) {
  const o = { ...DEFAULTS, once: false, intake: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === 'intake') o.intake = true;
    else if (a === '--once') o.once = true;
    else if (a === '--max-steps') o.maxSteps = Number(argv[++i]);
    else if (a === '--max-minutes') o.maxMinutes = Number(argv[++i]);
    else if (a === '--turns') o.turns = Number(argv[++i]);
    else if (a === '--spawner') o.spawner = argv[++i] || '';
    else return { error: `알 수 없는 인자 ${a}` };
  }
  for (const k of ['maxSteps', 'maxMinutes', 'turns']) if (!Number.isFinite(o[k]) || o[k] < 0) return { error: `${k}는 0 이상의 수 — 받은 값 ${o[k]}` };
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
export function spawnerCommand({ template, pack, slug, packPath, model, turns }) {
  if (template) {
    const vars = { path: packPath, pack, slug, model: model || '', turns: String(turns) };
    return { shell: template.replace(/\{(path|pack|slug|model|turns)\}/g, (_, k) => vars[k]) };
  }
  return { argv: ['claude', '-p', packPath, '--agent', pack, '--output-format', 'json', '--permission-mode', 'acceptEdits', '--max-turns', String(turns)] };
}
export function parseResult(stdout) {
  const raw = String(stdout || '');
  let j = null;
  try { j = JSON.parse(raw); } catch { const m = raw.lastIndexOf('\n{'); if (m >= 0) { try { j = JSON.parse(raw.slice(m + 1)); } catch { j = null; } } }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { json: null, text: raw.trim(), tokens: null, minutes: null, cost: null, turns: null, isError: false };
  const u = j.usage || {};
  const tokens = ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'].reduce((a, k) => a + (Number(u[k]) || 0), 0) || null;
  const minutes = Number(j.duration_ms) > 0 ? Math.round(j.duration_ms / 6000) / 10 : null;
  return { json: j, text: String(j.result ?? ''), tokens, minutes, cost: j.total_cost_usd ?? null, turns: j.num_turns ?? null, isError: !!j.is_error || (!!j.subtype && j.subtype !== 'success') };
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
// 팩을 띄우고 끝까지 기다린다 → 체크포인트·spawn_stop → spawned(실측) → 반려 전달. 반환: { ok, text, tokens, minutes }
export function spawnPack(c, { pack, slug, path: packPath }, o, { spawner = spawnSync } = {}) {
  const wt = slug === 'intake' ? c.main : worktreeDir(c.main, c.team, slug);
  const model = c.team.models[pack] || '';
  const cmd = spawnerCommand({ template: o.spawner, pack, slug, packPath, model, turns: o.turns });
  const env = headlessEnv(process.env, { GARAGISTE_PACK: pack, GARAGISTE_SLUG: slug, GARAGISTE_PACK_PATH: packPath, GARAGISTE_WORKTREE: wt, GARAGISTE_MODEL: model });
  const t0 = Date.now();
  const r = cmd.argv
    ? spawner(cmd.argv[0], cmd.argv.slice(1), { cwd: c.main, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 })
    : spawner(cmd.shell, { shell: true, cwd: c.main, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  const wall = Math.round((Date.now() - t0) / 6000) / 10;
  const p = parseResult(r.stdout);
  const status = r.status ?? 1;
  const log = logSpawn(c, slug, pack, { cmd: cmd.argv || cmd.shell, status, error: r.error ? String(r.error) : null, stdout: r.stdout || '', stderr: r.stderr || '' });
  spawnStop(c.main, { agent_type: pack }); // 헤드리스엔 SubagentStop 훅이 없다 — 더러운 worktree는 wip로, 원장엔 spawn_stop
  const flags = [p.tokens ? `--tokens ${p.tokens}` : '', `--minutes ${p.minutes ?? wall}`, model ? `--model ${model}` : '', `--note ${q(`conduct${p.cost != null ? ` $${p.cost}` : ''}${p.turns != null ? ` turns ${p.turns}` : ''} exit ${status}${log ? ` log ${log}` : ''}`)}`].filter(Boolean).join(' ');
  runCmd(c, `${S}/work.mjs spawned ${slug} ${pack} ${flags}`);
  const tail = p.text.trim().split('\n').slice(-3).map((l) => `  │ ${l}`).join('\n');
  if (tail.trim()) out(tail);
  const ok = status === 0 && !p.isError && !r.error;
  const returned = ok && (pack === 'build' || pack === 'attack') ? specReturn(p.text) : null; // 반려는 정당한 「빈손」 — 진전 없음으로 세지 않는다
  let held = false;
  if (!ok) out(`  팩 종료 비정상 — exit ${status}${p.isError ? ' · is_error' : ''}${r.error ? ` · ${r.error}` : ''}${log ? ` · ${log}` : ''}`);
  else if (returned) held = runCmd(c, `${S}/brief.mjs spec ${slug} --return ${q(returned)}`).held;
  return { ok, text: p.text, tokens: p.tokens, minutes: p.minutes ?? wall, status, log, returned: !!returned, held };
}
function stop(c, kind, text) {
  appendLedger(c.main, c.team, { kind: 'conduct', event: 'stop', stop: kind, text: String(text).split('\n')[0].slice(0, 300) });
  const st = shell(`${S}/state.mjs`, { cwd: c.main }); // STATUS를 다시 낸다 — 첫 줄이 CEO가 보는 전부
  out(stopLine(kind, text));
  if (st.stdout.trim()) out(`STATUS: ${st.stdout.trim().split('\n')[0]}`);
  process.exit(EXIT[kind]);
}
function intake(c, o) {
  const b = runCmd(c, `${S}/brief.mjs intake`);
  if (b.status) return stop(c, 'framework', failKey(b.text) || 'brief intake FAIL');
  const packPath = (/^PACK (\S+)/m.exec(b.text) || [])[1];
  if (!packPath) return stop(c, 'framework', `PACK 줄 없음 — ${b.text.split('\n')[0]}`);
  const r = spawnPack(c, { pack: 'intake', slug: 'intake', path: packPath }, o);
  if (!r.ok) return stop(c, 'framework', `intake 팩 비정상 종료 — exit ${r.status}${r.log ? ` · ${r.log}` : ''}`);
  runCmd(c, `${S}/work.mjs list`);
  return stop(c, 'ceo', 'intake 끝 — docs/BACKLOG.md의 unit 줄과 docs/DECISIONS.md 「정해 주세요」를 CEO에게 한 줄씩(예/아니오) → work.mjs decide → work.mjs scope → 「가」 = conduct');
}
function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.error) fail(`FAIL conduct: ${o.error} — 사용법: conduct.mjs [intake] [--once] [--max-steps N] [--max-minutes M] [--turns T] [--spawner "<템플릿 {path} {pack} {slug} {model} {turns}>"]`);
  let c = ctx();
  if (c.root !== c.main) fail('FAIL conduct는 메인 저장소에서만 — worktree 안에서 돌리지 않는다');
  doctorGate(c);
  appendLedger(c.main, c.team, { kind: 'conduct', event: 'start', spawner: o.spawner ? 'custom' : 'claude', max_steps: o.maxSteps, max_minutes: o.maxMinutes });
  if (o.intake) return intake(c, o);
  const started = Date.now();
  const fails = new Map(); const history = new Map();
  for (let steps = 0; ; steps++) {
    if (steps >= o.maxSteps) return stop(c, 'cap', `걸음 상한 ${o.maxSteps}`);
    if (o.maxMinutes && (Date.now() - started) / 60000 >= o.maxMinutes) return stop(c, 'cap', `시간 상한 ${o.maxMinutes}분`);
    c = ctx(); // team.json·unit 상태는 걸음마다 다시 읽는다(boot가 commands를 채운다)
    const r = computeNext(c);
    out(render(r));
    if (r.kind === 'ceo' || r.kind === 'wait' || r.kind === 'done') return stop(c, r.kind, r.text);
    if (r.kind === 'run') {
      const x = runCmd(c, r.cmd);
      const key = x.status && !x.held ? failKey(x.text) : null;
      if (key) { const n = (fails.get(key) || 0) + 1; fails.set(key, n); if (n >= 2) return stop(c, 'framework', `같은 FAIL 되풀이 — ${key}`); }
    } else if (r.kind === 'spawn') {
      const wt = worktreeDir(c.main, c.team, r.slug);
      const before = fs.existsSync(wt) ? headSha(wt) : null;
      const x = spawnPack(c, r, o);
      const after = fs.existsSync(wt) ? headSha(wt) : null;
      if (!x.ok) { const key = `spawn ${r.slug} ${r.pack}`; const n = (fails.get(key) || 0) + 1; fails.set(key, n); if (n >= 2) return stop(c, 'framework', `팩이 두 번 비정상 종료 — ${key}(exit ${x.status})${x.log ? ` · ${x.log}` : ''}`); }
      else if (!x.returned && noProgress(history, { slug: r.slug, pack: r.pack, before, after }) >= 2) return stop(c, 'framework', `${r.pack} 팩이 ${r.slug}에서 두 번 돌았는데 worktree가 그대로다(HEAD ${(after || '').slice(0, 7)}) — 팩 로그 ${x.log || '없음'}`);
    } else return stop(c, 'framework', `모르는 걸음 ${r.kind} — ${render(r)}`);
    if (o.once) return stop(c, 'cap', '--once');
  }
}
if (isMain(import.meta.url)) main();
