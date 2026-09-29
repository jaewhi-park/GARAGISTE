// doctor — 감별 진단. 무엇이 죽었고 무엇을 치면 되는지 한 줄씩. 훅이 조용히 죽는 일(I9)을 막는다.
import fs from 'node:fs';
import path from 'node:path';
import { REQUIRED_TEAM_KEYS, git, isMain, out, readJson, readText, repoRoot } from './lib.mjs';

export function diagnose(root, { nodeVersion = process.versions.node, now = Date.now() } = {}) {
  const problems = [];
  if (Number(nodeVersion.split('.')[0]) < 20) problems.push(`node ${nodeVersion} < 20 → node 20 이상 설치`);
  const teamPath = path.join(root, '.claude', 'team.json');
  const team = readJson(teamPath, null);
  if (!team) problems.push('.claude/team.json 없음 또는 JSON 오류 → install.sh 다시');
  else {
    for (const k of REQUIRED_TEAM_KEYS.filter((k2) => !(k2 in team))) problems.push(`team.json 키 없음: ${k} → team.json 확인`);
    for (const k of ['quick', 'full', 'test_file']) if (!team.commands?.[k]) problems.push(`team.json commands.${k} 비어 있음 → 프로젝트의 검증 명령을 적어라`);
    if (team.commands?.test_file && !team.commands.test_file.includes('{file}')) problems.push('commands.test_file에 {file} 자리표시자 없음');
  }
  const settings = readJson(path.join(root, '.claude', 'settings.json'), null);
  if (!settings) problems.push('.claude/settings.json 없음 → install.sh 다시');
  else {
    const cmds = JSON.stringify(settings.hooks || {});
    for (const h of ['session-start.mjs', 'guard.mjs', 'spawn-log.mjs']) {
      if (!cmds.includes(h)) problems.push(`settings.json hooks에 ${h} 없음 → team/settings.json과 비교`);
      if (!fs.existsSync(path.join(root, '.claude', 'hooks', h))) problems.push(`.claude/hooks/${h} 파일 없음 → install.sh 다시`);
    }
    if (cmds.includes('hooks/') && !cmds.includes('${CLAUDE_PROJECT_DIR}')) problems.push('hooks 경로가 상대 경로 → ${CLAUDE_PROJECT_DIR} 절대 경로로(Windows에서 조용히 죽는다)');
  }
  for (const s of ['verify', 'redproof', 'work', 'brief', 'boundary', 'ship', 'state', 'claims', 'doctor', 'lib']) if (!fs.existsSync(path.join(root, '.claude', 'scripts', `${s}.mjs`))) problems.push(`.claude/scripts/${s}.mjs 없음 → install.sh 다시`);
  const hooksPath = git(['config', 'core.hooksPath'], root).stdout;
  if (hooksPath !== '.githooks') problems.push(`core.hooksPath=${hooksPath || '(없음)'} → git config core.hooksPath .githooks (커밋 게이트가 안 돈다)`);
  if (!fs.existsSync(path.join(root, '.githooks', 'pre-commit'))) problems.push('.githooks/pre-commit 없음 → install.sh 다시');
  if (team && git(['rev-parse', '--verify', '-q', team.protected_branch], root).status) problems.push(`보호 브랜치 ${team.protected_branch} 없음 → 첫 커밋을 만들어라`);
  const gi = readText(path.join(root, '.gitignore'));
  for (const l of ['/.claude/ledger/', '/.claude/units/', '/.claude/session/', '/.worktrees/', '.claude-pack']) if (!gi.includes(l)) problems.push(`.gitignore에 ${l} 없음 → team/gitignore.snippet 추가`);
  const alive = readJson(path.join(root, '.claude', 'session', 'alive'), null);
  if (!alive) problems.push('session-start alive 마커 없음 → 훅이 한 번도 돌지 않았다: settings.json 경로·node PATH 확인(첫 세션이면 정상)');
  else if (now - Date.parse(alive.ts) > 7 * 86400e3) problems.push('alive 마커 7일 이상 → 훅이 죽었는지 확인');
  if (!readText(path.join(root, '.claude', 'HAZARDS.md'))) problems.push('.claude/HAZARDS.md 없음 → install.sh 다시');
  else for (const line of readText(path.join(root, '.claude', 'HAZARDS.md')).split('\n').filter((l) => l.startsWith('- '))) if (!/`[^`]+`/.test(line)) problems.push(`HAZARDS 경로 없는 줄: ${line.slice(0, 40)}… → 경로 패턴을 붙이거나 지워라`);
  return problems;
}
function main() {
  const root = process.env.CLAUDE_PROJECT_DIR || repoRoot();
  const p = diagnose(root);
  if (!p.length) return out('OK doctor');
  out(`FAIL doctor ${p.length}\n${p.map((x) => `- ${x}`).join('\n')}`);
  process.exit(1);
}
if (isMain(import.meta.url)) main();
