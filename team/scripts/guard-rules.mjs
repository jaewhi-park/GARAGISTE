// guard-rules — 하네스 중립 경계 규칙. Claude 훅(.claude/hooks/guard.mjs)과 opencode 플러그인(.opencode/plugins/guard.ts)이 같은 함수를 부른다.
import path from 'node:path';

const DESTRUCTIVE = /\bgit\s+(reset\s+--hard|clean\s+-\S*f|checkout\s+--\s+\.|stash\b|rebase\b|merge\b|branch\s+-D|push\s+(\S+\s+)?(-f\b|--force)|push\s+\S+\s+(main|master)\b|commit\s+(.*\s)?(--no-verify|-n)\b)/;
const SECRET = /(^|[\\/])\.env(\.|$)|\.pem$|\.key$|credentials\.json$/i;
// 규칙집 = 팀 정본(.garagiste) + 하네스 배선(.claude settings·hooks·agents / opencode.json·.opencode agents·plugins / .githooks)
const RULEBOOK = /(^|[\\/])(\.garagiste[\\/](team\.json|HAZARDS\.md|scripts[\\/]|packs[\\/]|ledger[\\/]|units[\\/])|\.claude[\\/](settings\.json|hooks[\\/]|agents[\\/])|opencode\.json|\.opencode[\\/](agents|plugins)[\\/]|\.githooks[\\/])/;
const LEDGER_SHELL = /\.garagiste[\\/](ledger|units)[\\/]/;
// 규칙집 셸 쓰기 — 쓰기 verb(rm·mv·cp·tee·truncate·sed -i)는 그대로 거부, 읽기 verb(cat·sed -n·echo·printf)는 리다이렉트로 규칙집을 향할 때만.
// (첫 Windows 실기의 오탐: conductor가 진단하려고 cat으로 스크립트를 읽는 것까지 거부됐다 — 읽기는 경계가 아니다)
const RULEBOOK_PATHS = '(\\.garagiste[\\\\/](team\\.json|HAZARDS\\.md|scripts|packs)|\\.claude[\\\\/](settings\\.json|hooks|agents)|opencode\\.json|\\.opencode[\\\\/](agents|plugins)|\\.githooks)';
const RULEBOOK_SHELL = new RegExp(`(^|[\\s;&|])(rm|mv|cp|tee|truncate|sed\\s+(-\\S+\\s+)*-i\\S*)\\b[^;&|]*${RULEBOOK_PATHS}`);
const RULEBOOK_REDIR = new RegExp(`>{1,2}\\s*("[^"]*|'[^']*|[^\\s;&|<>]*)?${RULEBOOK_PATHS}`);
// 게이트 우회 접두 — SHIP·WIP·ADMIN은 스크립트 내부(ship·checkpoint)와 CEO 세션만 쓴다. LARGE_STEP은 게이트가 받는 정상 경로라 막지 않는다.
const ENV_BYPASS = /(^|[\s;&|])(env\s+)?GARAGISTE_(SHIP|WIP|ADMIN)=/;
// conductor 전용 명령 — tried·decide는 CEO 접점(팩이 부르면 상한 자가 리셋), drop은 방향전환(팩이 자기를 버리지 않는다), needs는 선행 재배선(팩이 자기 WAIT를 풀지 않는다 — 사고 23)
const CEO_CMDS = /\bwork\.mjs\s+(tried|decide|drop|needs)\b/;

export const PACK_RULES = {
  spec: { allow: [/^tests\/acceptance\//, /^docs\/units\/[^/]+\//] },
  build: { deny: [/^tests\/acceptance\//, /^tests\/adversary\//, /^fixtures\/hostile\//, /^probes\//, /^docs\/measurements\/spike-/] },
  attack: { allow: [/^tests\/adversary\//, /^fixtures\/hostile\//] },
  spike: { allow: [/^docs\/measurements\/spike-[^/]+\.md$/] },
  // boot(kind scaffold): 스택·진입점·스모크·규칙 파일. 테스트 폴더는 unit 하나·프로브 없음
  boot: { allow: [/^(package\.json|pnpm-workspace\.yaml|pnpm-lock\.yaml|package-lock\.json|pyproject\.toml|uv\.lock|requirements[^/]*\.txt|Cargo\.toml|go\.mod|\.node-version|\.python-version|\.nvmrc|\.tool-versions|\.gitignore|README(\.[a-z]{2})?\.md|CLAUDE\.md|AGENTS\.md|tsconfig[^/]*\.json|[^/]*\.config\.[a-z]+)$/, /^src\//, /^tests\/unit\//, /^tests\/harness\//, /^docs\/units\/[^/]+\//] },
};
const norm = (p) => p.replace(/\\/g, '/');
// 따옴표 안 텍스트는 셸에선 데이터다 — 커밋 메시지의 트레일러(`<noreply@…>`)·경로 언급이 리다이렉트·쓰기 verb로 오탐됐다(첫 Windows 실기).
// 큰따옴표 안에서도 $()·백틱은 실행되므로 그 내용만 남긴다. 우회 접두(ENV_BYPASS)·worktree 경로 추론은 따옴표로도 효력이 있어 원문을 본다.
export function stripQuoted(command) {
  return String(command)
    .replace(/\\["']/g, ' ')
    .replace(/'[^']*'/g, ' ')
    .replace(/"([^"]*)"/g, (_, inner) => { const subs = inner.match(/\$\([^)]*\)|`[^`]*`/g); return subs ? ` ${subs.join(' ')} ` : ' '; });
}
// Bash도 쓰기다 — 리다이렉트 표적은 전부, in-place verb(sed -i·tee·mv·cp·rm·truncate)는 보호 구역 이름이 보일 때. 완전 차단이 아니라 최선 노력 — 법은 게이트(redproof·원장 tree 대조)다.
const GUARDED_AREA = /(^|[\\/])(tests[\\/](acceptance|adversary)|fixtures[\\/]hostile|probes([\\/]|$)|docs[\\/]measurements[\\/]spike-)/;
export function writeTargets(command) {
  const out = [];
  const redir = /(?:^|[^<>=-])>{1,2}\s*(?:"([^"]+)"|'([^']+)'|([^\s;&|<>]+))/g;
  let m;
  while ((m = redir.exec(command))) {
    const t = m[1] ?? m[2] ?? m[3];
    if (!t || t.startsWith('&') || t.startsWith('/dev/') || t.includes('"') || t.includes("'")) continue;
    out.push(t);
  }
  const verb = /\b(?:sed\s+(?:-\S+\s+)*-i\S*|tee|truncate|mv|cp|rm)\b([^;&|>]*)/g;
  while ((m = verb.exec(command))) {
    for (const raw of m[1].trim().split(/\s+/)) {
      const t = raw.replace(/^["']|["']$/g, '');
      if (t && !t.startsWith('-') && GUARDED_AREA.test(t)) out.push(t);
    }
  }
  return out;
}
function packWriteReason(marker, rel) {
  const rule = PACK_RULES[marker];
  if (!rule) return `팩 정체 불명(${marker || '없음'}) — unit 상태가 없으면 worktree에도 쓰지 않는다(fail-closed)`;
  if (rule.deny && rule.deny.some((re) => re.test(rel))) return `${marker} 팩은 ${rel}에 쓸 수 없다 — 테스트·프로브·hostile은 다른 팩의 경계다.`;
  if (rule.allow && !rule.allow.some((re) => re.test(rel))) return `${marker} 팩의 쓰기 경계 밖: ${rel}`;
  return null;
}
export function worktreeOf(abs, worktreesDir) {
  const rel = norm(path.relative(worktreesDir, abs));
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  const [slug, ...rest] = rel.split('/');
  return { slug, dir: path.join(worktreesDir, slug), rel: rest.join('/') };
}
export function worktreeFromCommand(command, worktreesDir) {
  const m = /\.worktrees[\\/]([a-z0-9][a-z0-9-]*)/.exec(command);
  return m ? { slug: m[1], dir: path.join(worktreesDir, m[1]), rel: '' } : null;
}
// input: { tool_name, tool_input, cwd } (Claude 훅 형식) · ctx: { cwd, env, worktreesDir, readMarker(dir) }
export function decide(input, ctx) {
  const { tool_name: tool, tool_input: ti = {} } = input;
  const cwd = input.cwd || ctx.cwd || process.cwd();
  const admin = !!ctx.env.GARAGISTE_ADMIN;
  if (tool === 'Bash' || tool === 'PowerShell') {
    const c = String(ti.command || '');
    const cq = stripQuoted(c); // 쓰기·파괴 판정은 따옴표 밖 텍스트로만
    if (DESTRUCTIVE.test(cq)) return '파괴적 git — stash·rebase·merge·reset --hard·force push·보호 브랜치 push·--no-verify는 없다. 머지는 ship.mjs만.';
    // DESTRUCTIVE의 push 정규식은 main|master 고정 — 보호 브랜치가 다른 이름이면 여기서 막는다 (L0 부검의 발견)
    const pb = ctx.protectedBranch;
    if (!admin && pb && pb !== 'main' && pb !== 'master'
      && new RegExp(`\\bgit\\s+push\\b[^;&|]*[\\s:]${pb.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&')}(\\s|$)`).test(c)) return `보호 브랜치(${pb}) push — 머지는 ship.mjs만, 원격 push는 CEO의 일이다.`;
    if (!admin && ENV_BYPASS.test(c)) return '게이트 우회 금지 — GARAGISTE_SHIP·WIP·ADMIN 접두는 스크립트 내부와 CEO(ADMIN 세션)만 쓴다.';
    if (LEDGER_SHELL.test(cq) && /(>|>>|\brm\b|\bsed\b|\btee\b|\btruncate\b|\bmv\b)/.test(cq)) return '원장·unit 상태는 스크립트만 쓴다.';
    if (!admin && (RULEBOOK_SHELL.test(cq) || RULEBOOK_REDIR.test(cq))) return '규칙집(.garagiste 정본·하네스 배선)은 hard 결정 뒤 CEO가 GARAGISTE_ADMIN=1로만 바꾼다. (읽기는 자유 — Read 툴이나 cat은 막지 않는다)';
    const w = worktreeOf(path.resolve(cwd), ctx.worktreesDir) || worktreeFromCommand(c, ctx.worktreesDir);
    if (w) {
      if (/\bgit\s+push\b/.test(c)) return 'worktree에서 push하지 않는다 — ship.mjs가 main으로 올린다.';
      if (CEO_CMDS.test(c)) return 'tried·decide(CEO 접점)·drop(방향전환)·needs(선행 재배선)는 conductor의 일이다 — 팩은 부르지 않는다. conductor가 CEO의 말을 받아 메인에서 돌린다.';
      if (ctx.readMarker(w.dir) === 'spike' && /\bgit\s+commit\b/.test(c)) return 'spike는 커밋하지 않는다 — 측정 파일만 남긴다.';
    }
    for (const target of writeTargets(cq)) {
      const abs = path.resolve(cwd, target);
      const tw = worktreeOf(abs, ctx.worktreesDir);
      if (tw) { const r = packWriteReason(ctx.readMarker(tw.dir), norm(tw.rel)); if (r) return `Bash 쓰기: ${r}`; continue; }
      if (!admin && ctx.root && !norm(path.relative(ctx.root, abs)).startsWith('..')) return `Bash 쓰기(${target})가 worktree 밖이다 — 쓰기는 worktree 안 팩과 스크립트(work.mjs brief|add|…)만.`;
    }
    return null;
  }
  if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    const p = ti.file_path || ti.notebook_path || ti.path || '';
    if (!p) return null;
    const abs = path.resolve(cwd, p);
    if (SECRET.test(abs)) return '비밀 파일(.env·*.pem·*.key·credentials)은 읽지도 쓰지도 않는다.';
    if (!admin && RULEBOOK.test(norm(abs))) return '규칙집·원장·unit 상태는 스크립트가 쓴다. 바꾸려면 hard 결정 → CEO가 GARAGISTE_ADMIN=1.';
    const w = worktreeOf(abs, ctx.worktreesDir);
    if (!w) return admin ? null : 'conductor는 쓰지 않는다 — 쓰기는 worktree 안의 팩과 스크립트(work.mjs brief|add)만. 일반 편집 세션은 GARAGISTE_ADMIN=1.';
    return packWriteReason(ctx.readMarker(w.dir), norm(w.rel));
  }
  return null;
}
export function makeCtx(root, { cwd, env = process.env, fs }) {
  const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
  let protectedBranch = null;
  try { protectedBranch = JSON.parse((read(path.join(root, '.garagiste', 'team.json')) || 'null').replace(/^﻿/, ''))?.protected_branch ?? null; } catch { /* team.json 없음 — main|master 규칙만 */ }
  return {
    cwd, env, root, protectedBranch, worktreesDir: path.join(root, '.worktrees'),
    // 팩 정체의 정본은 unit 상태(.garagiste/units — 스크립트만 쓴다). worktree 안 마커 파일은 unit 상태가 없을 때의 fallback일 뿐이라, 변조해도 정체가 바뀌지 않는다.
    readMarker: (dir) => {
      const raw = read(path.join(root, '.garagiste', 'units', `${path.basename(dir)}.json`));
      if (raw !== null) { try { const u = JSON.parse(raw.replace(/^﻿/, '')); return u?.state && u.state !== 'shipped' ? u.state : null; } catch { return null; } }
      return (read(path.join(dir, '.garagiste-pack')) || '').trim() || null;
    },
  };
}
