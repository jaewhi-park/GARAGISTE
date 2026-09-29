// doctor — 감별 진단. 무엇이 죽었고 무엇을 치면 되는지 한 줄씩. 훅·플러그인이 조용히 죽는 일을 막는다.
import fs from 'node:fs';
import path from 'node:path';
import { REQUIRED_TEAM_KEYS, git, isMain, out, readJson, readText, scriptRoot } from './lib.mjs';

export const SCRIPTS = ['lib', 'verify', 'redproof', 'work', 'brief', 'boundary', 'ship', 'state', 'claims', 'doctor', 'guard-rules', 'checkpoint', 'selftest'];
// 갓 설치된 저장소에서 정상인 항목 — 이것만 빼고 전부가 설치(--fresh)·seed·ship을 fail-closed로 막는다(훅 침묵사 계열이 여기 들어오면 안 된다)
export const FRESH_OK = [/alive 마커 없음/, /commands\.(quick|full|test_file) 비어 있음/];
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
    for (const k of ['quick', 'full', 'test_file']) if (!team.commands?.[k]) p.push(`team.json commands.${k} 비어 있음 → 첫 unit(boot)이 채운다: 세션을 열고 만들 것을 말하라`);
    if (team.commands?.test_file && !team.commands.test_file.includes('{file}')) p.push('commands.test_file에 {file} 자리표시자 없음');
  }
  for (const s of SCRIPTS) if (!fs.existsSync(path.join(root, '.garagiste', 'scripts', `${s}.mjs`))) p.push(`.garagiste/scripts/${s}.mjs 없음 → install.sh 다시`);
  for (const k of ['intake', 'spec', 'build', 'attack', 'spike', 'boot']) if (!fs.existsSync(path.join(root, '.garagiste', 'packs', `${k}.md`))) p.push(`.garagiste/packs/${k}.md 없음 → install.sh 다시`);
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
    for (const a of ['intake', 'spec', 'build', 'attack', 'spike', 'boot']) if (!fs.existsSync(path.join(root, '.claude', 'agents', `${a}.md`))) p.push(`.claude/agents/${a}.md 없음 → install.sh claude 다시`);
    const alive = readJson(path.join(root, '.garagiste', 'session', 'alive'), null);
    if (!alive) p.push('session-start alive 마커 없음 → 훅이 한 번도 돌지 않았다: settings.json 경로·node PATH 확인(첫 세션이면 정상)');
    else if (now - Date.parse(alive.ts) > 7 * 86400e3) p.push('alive 마커 7일 이상 → 훅이 죽었는지 확인');
  }
  if (hs.includes('opencode')) {
    if (!fs.existsSync(path.join(root, '.opencode', 'plugins', 'guard.ts'))) p.push('.opencode/plugins/guard.ts 없음 → install.sh opencode 다시');
    for (const a of ['conductor', 'intake', 'spec', 'build', 'attack', 'spike', 'boot']) if (!fs.existsSync(path.join(root, '.opencode', 'agents', `${a}.md`))) p.push(`.opencode/agents/${a}.md 없음 → install.sh opencode 다시`);
    if (!fs.existsSync(path.join(root, 'AGENTS.md'))) p.push('AGENTS.md 없음 → team/opencode/AGENTS.md.template');
  }
  const hooksPath = git(['config', 'core.hooksPath'], root).stdout;
  if (hooksPath !== '.githooks') p.push(`core.hooksPath=${hooksPath || '(없음)'} → git config core.hooksPath .githooks (커밋 게이트가 안 돈다)`);
  if (!fs.existsSync(path.join(root, '.githooks', 'pre-commit'))) p.push('.githooks/pre-commit 없음 → install.sh 다시');
  else { const mode = git(['ls-files', '-s', '.githooks/pre-commit'], root).stdout.split(' ')[0]; if (mode && mode !== '100755') p.push(`.githooks/pre-commit이 인덱스에 ${mode}(실행 비트 없음) → git update-index --chmod=+x .githooks/pre-commit — 맥·리눅스에서 게이트가 조용히 무시된다`); }
  if (team && git(['rev-parse', '--verify', '-q', team.protected_branch], root).status) p.push(`보호 브랜치 ${team.protected_branch} 없음 → 첫 커밋을 만들어라`);
  const gi = readText(path.join(root, '.gitignore'));
  for (const l of ['/.garagiste/ledger/', '/.garagiste/units/', '/.garagiste/session/', '/.garagiste/scope.json', '/.worktrees/', '.garagiste-pack']) if (!gi.includes(l)) p.push(`.gitignore에 ${l} 없음 → team/gitignore.snippet 추가`);
  const hz = readText(path.join(root, '.garagiste', 'HAZARDS.md'));
  if (!hz) p.push('.garagiste/HAZARDS.md 없음 → install.sh 다시');
  else for (const line of hz.split('\n').filter((l) => l.startsWith('- '))) if (!/`[^`]+`/.test(line)) p.push(`HAZARDS 경로 없는 줄: ${line.slice(0, 40)}… → 경로 패턴을 붙이거나 지워라`);
  return p;
}
function main() {
  const root = process.env.CLAUDE_PROJECT_DIR || scriptRoot(import.meta.url); // cwd가 아니라 이 스크립트가 설치된 저장소
  const p = process.argv.includes('--fresh') ? blocking(diagnose(root)) : diagnose(root);
  if (!p.length) return out(`OK doctor (${harnesses(root).join('+') || '하네스 없음'})`);
  out(`FAIL doctor ${p.length}\n${p.map((x) => `- ${x}`).join('\n')}`);
  process.exit(1);
}
if (isMain(import.meta.url)) main();
