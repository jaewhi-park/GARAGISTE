// doctor — 감별 진단. 무엇이 죽었고 무엇을 치면 되는지 한 줄씩. 훅·플러그인이 조용히 죽는 일을 막는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REQUIRED_TEAM_KEYS, fail, git, hasFileSlot, isMain, out, readJson, readText, scriptRoot } from './lib.mjs';

export const SCRIPTS = ['lib', 'verify', 'redproof', 'work', 'brief', 'boundary', 'ship', 'state', 'claims', 'doctor', 'guard-rules', 'checkpoint', 'selftest', 'next', 'conduct'];
// 갓 설치된 저장소에서 정상인 항목 — 이것만 빼고 전부가 설치(--fresh)·seed·ship을 fail-closed로 막는다(훅 침묵사 계열이 여기 들어오면 안 된다)
export const FRESH_OK = [/alive 마커 없음/, /commands\.(quick|full|test_file) 비어 있음/, /PreToolUse 매처에 Read 없음/]; // 매처 드리프트(10라운드)는 L1 경고 — 설치·ship·conduct를 막지 않고 doctor가 보인다
export function blocking(problems) { return problems.filter((p) => !FRESH_OK.some((re) => re.test(p))); }
export function harnesses(root) {
  const h = [];
  if (fs.existsSync(path.join(root, '.claude', 'settings.json'))) h.push('claude');
  if (fs.existsSync(path.join(root, 'opencode.json'))) h.push('opencode');
  return h;
}
export function diagnose(root, { nodeVersion = process.versions.node, now = Date.now() } = {}) {
  const p = [];
  if (Number(nodeVersion.split('.')[0]) < 20) p.push(`node ${nodeVersion} < 20 → node 20 이상 설치`);
  const team = readJson(path.join(root, '.garagiste', 'team.json'), null);
  if (!team) p.push('.garagiste/team.json 없음 또는 JSON 오류 → install.sh <claude|opencode> 다시');
  else {
    for (const k of REQUIRED_TEAM_KEYS.filter((k2) => !(k2 in team))) p.push(`team.json 키 없음: ${k} → team.json 확인`);
    for (const k of ['quick', 'full', 'test_file']) if (!team.commands?.[k]) p.push(`team.json commands.${k} 비어 있음 → 첫 unit(boot — 기존 코드가 있으면 adopt)이 채운다: 세션을 열고 만들 것을 말하라`);
    if (team.commands?.test_file && !hasFileSlot(team.commands.test_file)) p.push('commands.test_file에 {file}·{files} 자리표시자 없음');
  }
  for (const s of SCRIPTS) if (!fs.existsSync(path.join(root, '.garagiste', 'scripts', `${s}.mjs`))) p.push(`.garagiste/scripts/${s}.mjs 없음 → install.sh 다시`);
  for (const k of ['intake', 'spec', 'build', 'attack', 'spike', 'boot', 'adopt']) if (!fs.existsSync(path.join(root, '.garagiste', 'packs', `${k}.md`))) p.push(`.garagiste/packs/${k}.md 없음 → install.sh 다시`);
  const hs = harnesses(root);
  if (!hs.length) p.push('하네스 배선 없음(.claude/settings.json도 opencode.json도 없다) → install.sh claude 또는 install.sh opencode');
  if (hs.includes('claude')) {
    const settings = readJson(path.join(root, '.claude', 'settings.json'), {});
    if (!Array.isArray(settings.permissions?.allow) || !settings.permissions.allow.length) p.push('.claude/settings.json에 permissions.allow 없음 → 모든 node·git 호출이 승인 프롬프트를 띄운다: team/claude/settings.json으로 교체');
    if (settings.permissions?.defaultMode !== 'acceptEdits') p.push('.claude/settings.json permissions.defaultMode가 acceptEdits가 아님 → 팩의 파일 쓰기마다 승인을 묻는다(경계는 guard 훅이 지킨다)');
    const cmds = JSON.stringify(settings.hooks || {});
    for (const h of ['session-start.mjs', 'guard.mjs', 'spawn-log.mjs']) {
      if (!cmds.includes(h)) p.push(`.claude/settings.json hooks에 ${h} 없음 → team/claude/settings.json과 비교`);
      if (!fs.existsSync(path.join(root, '.claude', 'hooks', h))) p.push(`.claude/hooks/${h} 없음 → install.sh claude 다시`);
    }
    if (cmds.includes('hooks/') && !cmds.includes('${CLAUDE_PROJECT_DIR}')) p.push('hooks 경로가 상대 경로 → ${CLAUDE_PROJECT_DIR} 절대 경로로(Windows에서 조용히 죽는다)');
    // 10라운드: 배선 설정은 설치가 덮지 않는다(사용자 병합 보호) — 그래서 매처 변경(6라운드 Read)이 옛 설치본에 닿지 않았다. 규칙이 조용히 안 드는 것은 침묵사 — 짚는다(FRESH_OK: 막지는 않는다)
    if (cmds.includes('guard.mjs') && !/\bRead\b/.test(JSON.stringify(settings.hooks?.PreToolUse || []))) p.push('.claude/settings.json PreToolUse 매처에 Read 없음 → 비밀 파일 읽기 거부(guard)가 Read 도구엔 안 든다: team/claude/settings.json(설치가 둔 .claude/settings.garagiste.json)과 매처를 맞춘다');
    // 9라운드(2026-10-04): 모델 치환이 실패한 agents 파일({{MODEL_…}} 잔재)은 --agent <팩>이 서지 않는다 — 설치 때 잡는다
    for (const a of ['intake', 'spec', 'build', 'attack', 'spike', 'boot', 'adopt']) { const t = readText(path.join(root, '.claude', 'agents', `${a}.md`)); if (/\{\{MODEL_/.test(t)) p.push(`.claude/agents/${a}.md에 {{MODEL_…}} 자리표시자가 남았다(모델 치환 실패 — --agent ${a}가 서지 않는다) → install.sh claude 다시`); else if (t && !/^model:\s*\S+/m.test(t)) p.push(`.claude/agents/${a}.md에 model: 줄 없음 → install.sh claude 다시`); }
    for (const a of ['intake', 'spec', 'build', 'attack', 'spike', 'boot', 'adopt']) if (!fs.existsSync(path.join(root, '.claude', 'agents', `${a}.md`))) p.push(`.claude/agents/${a}.md 없음 → install.sh claude 다시`);
    const alive = readJson(path.join(root, '.garagiste', 'session', 'alive'), null);
    if (!alive) p.push('session-start alive 마커 없음 → 훅이 한 번도 돌지 않았다: settings.json 경로·node PATH 확인(첫 세션이면 정상)');
    else if (now - Date.parse(alive.ts) > 7 * 86400e3) p.push('alive 마커 7일 이상 → 훅이 죽었는지 확인');
  }
  if (hs.includes('opencode')) {
    if (!fs.existsSync(path.join(root, '.opencode', 'plugins', 'guard.ts'))) p.push('.opencode/plugins/guard.ts 없음 → install.sh opencode 다시');
    for (const a of ['conductor', 'intake', 'spec', 'build', 'attack', 'spike', 'boot', 'adopt']) if (!fs.existsSync(path.join(root, '.opencode', 'agents', `${a}.md`))) p.push(`.opencode/agents/${a}.md 없음 → install.sh opencode 다시`);
    if (!fs.existsSync(path.join(root, 'AGENTS.md'))) p.push('AGENTS.md 없음 → team/opencode/AGENTS.md.template');
  }
  const hooksPath = git(['config', 'core.hooksPath'], root).stdout;
  if (hooksPath !== '.githooks') p.push(`core.hooksPath=${hooksPath || '(없음)'} → git config core.hooksPath .githooks (커밋 게이트가 안 돈다)`);
  if (!fs.existsSync(path.join(root, '.githooks', 'pre-commit'))) p.push('.githooks/pre-commit 없음 → install.sh 다시');
  else { const mode = git(['ls-files', '-s', '.githooks/pre-commit'], root).stdout.split(' ')[0]; if (mode && mode !== '100755') p.push(`.githooks/pre-commit이 인덱스에 ${mode}(실행 비트 없음) → git update-index --chmod=+x .githooks/pre-commit — 맥·리눅스에서 게이트가 조용히 무시된다`); }
  if (team && git(['rev-parse', '--verify', '-q', team.protected_branch], root).status) p.push(`보호 브랜치 ${team.protected_branch} 없음 → 첫 커밋을 만들어라`);
  // 끊긴 worktree(2026-10-01 관찰 — 프로젝트 폴더를 옮기거나 unit 폴더를 손으로 지우면 링크가 깨지고 verify는 FAIL 줄 대신 스택을 냈다)
  const wl = git(['worktree', 'list', '--porcelain'], root);
  if (!wl.status) for (const block of wl.stdout.split(/\n\s*\n/)) if (/^prunable/m.test(block)) p.push(`worktree ${(/^worktree (.+)$/m.exec(block) || [])[1] || '?'} 끊김(prunable — 폴더가 없거나 링크가 깨졌다) → git worktree prune 뒤 .garagiste/units의 그 unit 상태를 확인(진행 중이면 work.mjs drop 뒤 다시 new)`);
  const gi = readText(path.join(root, '.gitignore'));
  for (const l of ['/.garagiste/ledger/', '/.garagiste/units/', '/.garagiste/session/', '/.garagiste/scope.json', '/.worktrees/', '.garagiste-pack']) if (!gi.includes(l)) p.push(`.gitignore에 ${l} 없음 → team/gitignore.snippet 추가`);
  const hz = readText(path.join(root, '.garagiste', 'HAZARDS.md'));
  if (!hz) p.push('.garagiste/HAZARDS.md 없음 → install.sh 다시');
  else for (const line of hz.split('\n').filter((l) => l.startsWith('- '))) if (!/`[^`]+`/.test(line)) p.push(`HAZARDS 경로 없는 줄: ${line.slice(0, 40)}… → 경로 패턴을 붙이거나 지워라`);
  return p;
}
// 설치본의 판(L3 Q11) — install.sh가 .garagiste/VERSION에 적는다(garagiste sha · team/ tree · flavor). 2026-10-04 전 설치본엔 없다.
export function versionLine(root) {
  const v = readJson(path.join(root, '.garagiste', 'VERSION'), null);
  return v && v.garagiste ? `VERSION garagiste ${v.garagiste} · team ${v.team_tree || '?'} · ${v.flavor || '?'}` : 'VERSION 없음 — 2026-10-04 전 설치본: install.sh를 다시 돌리면 적힌다(갱신 커밋)';
}
// 갱신 미리보기(10라운드 2026-10-04, Q11 「diff를 보이는 명시적 갱신」): 소스 체크아웃의 team/와 설치본을 파일 단위로 비교한다 — 설치기는 복사 전에 이 줄을 보인다.
// 비교 밖: team.json·HAZARDS.md·CLAUDE.md/AGENTS.md(프로젝트의 것 — 설치가 보존한다). agents는 model: 줄을 뺀 채 비교(모델 치환은 설치본의 편성이다).
// 배선 설정(settings.json·opencode.json)은 설치가 덮지 않는다(사용자 병합 보호) — 다르면 따로 알린다(6라운드의 Read 매처가 옛 설치본에 닿지 않았던 길).
export function upgradeDiff(srcTeam, root) {
  const read = (p) => { try { return fs.readFileSync(p); } catch { return null; } };
  const noModel = (t) => t.replace(/^model:.*$/m, 'model:');
  const same = (a, b, strip) => { let x = read(a); let y = read(b); if (x === null || y === null) return x === y; if (strip) { x = Buffer.from(strip(x.toString('utf8'))); y = Buffer.from(strip(y.toString('utf8'))); } return x.equals(y); };
  const list = (dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => re.test(f)).sort() : []);
  const hs = harnesses(root);
  const pairs = []; // [소스 상대, 설치본 상대, strip, wiring]
  for (const f of list(path.join(srcTeam, 'scripts'), /\.mjs$/)) pairs.push([`scripts/${f}`, `.garagiste/scripts/${f}`]);
  for (const f of list(path.join(srcTeam, 'packs'), /\.md$/)) pairs.push([`packs/${f}`, `.garagiste/packs/${f}`]);
  pairs.push(['githooks/pre-commit', '.githooks/pre-commit']);
  if (hs.includes('claude')) {
    for (const f of list(path.join(srcTeam, 'claude', 'hooks'), /\.mjs$/)) pairs.push([`claude/hooks/${f}`, `.claude/hooks/${f}`]);
    for (const f of list(path.join(srcTeam, 'claude', 'agents'), /\.md$/)) pairs.push([`claude/agents/${f}`, `.claude/agents/${f}`, noModel]);
    pairs.push(['claude/settings.json', '.claude/settings.json', null, true]);
  }
  if (hs.includes('opencode')) {
    for (const f of list(path.join(srcTeam, 'opencode', 'agents'), /\.md$/)) pairs.push([`opencode/agents/${f}`, `.opencode/agents/${f}`]);
    pairs.push(['opencode/plugins/guard.ts', '.opencode/plugins/guard.ts'], ['opencode/opencode.json', 'opencode.json', null, true]);
  }
  const changed = []; const added = []; const wiring = [];
  for (const [s, d, strip, isWiring] of pairs) {
    const dp = path.join(root, d);
    if (!fs.existsSync(dp)) { added.push(d); continue; }
    if (!same(path.join(srcTeam, s), dp, strip)) (isWiring ? wiring : changed).push(d);
  }
  const extra = [...list(path.join(root, '.garagiste', 'scripts'), /\.mjs$/).filter((f) => !fs.existsSync(path.join(srcTeam, 'scripts', f))).map((f) => `.garagiste/scripts/${f}`),
    ...list(path.join(root, '.garagiste', 'packs'), /\.md$/).filter((f) => !fs.existsSync(path.join(srcTeam, 'packs', f))).map((f) => `.garagiste/packs/${f}`)];
  return { changed, added, wiring, extra, compared: pairs.length };
}
export function upgradeLine(srcTeam, root) {
  const d = upgradeDiff(srcTeam, root);
  const ver = readJson(path.join(root, '.garagiste', 'VERSION'), null);
  const from = ver?.garagiste ? String(ver.garagiste).slice(0, 7) : '판 기록 없음';
  const g = git(['rev-parse', 'HEAD'], path.dirname(srcTeam)); const to = g.status ? 'unknown' : g.stdout.trim().slice(0, 7);
  if (!d.changed.length && !d.added.length && !d.wiring.length && !d.extra.length) return `UPGRADE 같은 판 — 비교 ${d.compared} 파일 모두 같다(${from} → ${to})`;
  const parts = [`바뀌는 파일 ${d.changed.length}`];
  if (d.added.length) parts.push(`새 파일 ${d.added.length}`);
  if (d.wiring.length) parts.push(`배선 설정 다름 ${d.wiring.length}(덮지 않는다 — 병합)`);
  if (d.extra.length) parts.push(`설치본에만 ${d.extra.length}(지우지 않는다)`);
  return `UPGRADE ${from} → ${to} — ${parts.join(' · ')}: ${[...d.changed, ...d.added.map((f) => `+${f}`), ...d.wiring.map((f) => `!${f}`), ...d.extra.map((f) => `?${f}`)].join(' ')}`;
}
function main() {
  if (process.argv[2] === '--diff') { // 소스 체크아웃에서: node <GARAGISTE>/team/scripts/doctor.mjs --diff <설치본> — 설치본의 doctor는 옛것일 수 있다
    const srcTeam = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    if (path.basename(srcTeam) !== 'team' || !fs.existsSync(path.join(srcTeam, 'team.json'))) fail('FAIL doctor --diff는 GARAGISTE 소스의 team/scripts/doctor.mjs로 돌린다 — 설치본의 doctor는 옛것일 수 있다: node <GARAGISTE>/team/scripts/doctor.mjs --diff <설치본 루트>');
    const target = process.argv[3] ? path.resolve(process.argv[3]) : null;
    if (!target || !fs.existsSync(path.join(target, '.garagiste', 'team.json'))) fail('사용법: node <GARAGISTE>/team/scripts/doctor.mjs --diff <설치본 루트> (.garagiste/team.json이 있는 곳)');
    return out(upgradeLine(srcTeam, target));
  }
  const root = process.env.CLAUDE_PROJECT_DIR || scriptRoot(import.meta.url); // cwd가 아니라 이 스크립트가 설치된 저장소
  if (process.argv.includes('--version')) return out(versionLine(root));
  const p = process.argv.includes('--fresh') ? blocking(diagnose(root)) : diagnose(root);
  if (!p.length) return out(`OK doctor (${harnesses(root).join('+') || '하네스 없음'})`);
  out(`FAIL doctor ${p.length}\n${p.map((x) => `- ${x}`).join('\n')}`);
  process.exit(1);
}
if (isMain(import.meta.url)) main();
