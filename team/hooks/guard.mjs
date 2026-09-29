// guard — PreToolUse. 판단 없는 경계: 파괴적 git · 비밀 · 규칙집·원장 보호 · 팩별 쓰기 경계(worktree 마커).
import fs from 'node:fs';
import path from 'node:path';

const DESTRUCTIVE = /\bgit\s+(reset\s+--hard|clean\s+-\S*f|checkout\s+--\s+\.|stash\b|rebase\b|merge\b|branch\s+-D|push\s+(\S+\s+)?(-f\b|--force)|push\s+\S+\s+(main|master)\b|commit\s+(.*\s)?(--no-verify|-n)\b)/;
const SECRET = /(^|[\\/])\.env(\.|$)|\.pem$|\.key$|credentials\.json$/i;
const RULEBOOK = /(^|[\\/])\.claude[\\/](team\.json|settings\.json|hooks[\\/]|scripts[\\/]|packs[\\/]|HAZARDS\.md|ledger[\\/]|units[\\/])/;
const LEDGER_SHELL = /\.claude[\\/](ledger|units)[\\/]/;
const RULEBOOK_SHELL = /(^|[\s;&|>])(rm|mv|cp|sed|tee|truncate|echo|cat|printf)\b[^;&|]*\.claude[\\/](team\.json|settings\.json|hooks|scripts|packs|HAZARDS\.md)/;

export const PACK_RULES = {
  spec: { allow: [/^tests\/acceptance\//, /^docs\/units\/[^/]+\//] },
  build: { deny: [/^tests\/acceptance\//, /^tests\/adversary\//, /^fixtures\/hostile\//, /^probes\//, /^docs\/measurements\/spike-/] },
  attack: { allow: [/^tests\/adversary\//, /^fixtures\/hostile\//] },
  spike: { allow: [/^docs\/measurements\/spike-[^/]+\.md$/] },
};
const norm = (p) => p.replace(/\\/g, '/');
export function worktreeOf(abs, worktreesDir) {
  const rel = norm(path.relative(worktreesDir, abs));
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  const [slug, ...rest] = rel.split('/');
  return { slug, dir: path.join(worktreesDir, slug), rel: rest.join('/') };
}
export function decide(input, ctx) {
  const { tool_name: tool, tool_input: ti = {} } = input;
  const cwd = input.cwd || ctx.cwd || process.cwd();
  const admin = !!ctx.env.GARAGISTE_ADMIN;
  if (tool === 'Bash' || tool === 'PowerShell') {
    const c = String(ti.command || '');
    if (DESTRUCTIVE.test(c)) return '파괴적 git — stash·rebase·merge·reset --hard·force push·보호 브랜치 push·--no-verify는 없다. 머지는 ship.mjs만.';
    if (LEDGER_SHELL.test(c) && /(>|>>|\brm\b|\bsed\b|\btee\b|\btruncate\b|\bmv\b)/.test(c)) return '원장·unit 상태는 스크립트만 쓴다.';
    if (!admin && RULEBOOK_SHELL.test(c)) return '규칙집(.claude/team.json·settings·hooks·scripts·packs·HAZARDS)은 hard 결정 뒤 CEO가 GARAGISTE_ADMIN=1로만 바꾼다.';
    const w = worktreeOf(path.resolve(cwd), ctx.worktreesDir);
    if (w) {
      if (/\bgit\s+push\b/.test(c)) return 'worktree에서 push하지 않는다 — ship.mjs가 main으로 올린다.';
      if (ctx.readMarker(w.dir) === 'spike' && /\bgit\s+commit\b/.test(c)) return 'spike는 커밋하지 않는다 — 측정 파일만 남긴다.';
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
    if (w) {
      const marker = ctx.readMarker(w.dir);
      const rule = PACK_RULES[marker];
      if (rule?.deny && rule.deny.some((re) => re.test(w.rel))) return `${marker} 팩은 ${w.rel}에 쓸 수 없다 — 테스트·프로브·hostile은 다른 팩의 경계다.`;
      if (rule?.allow && !rule.allow.some((re) => re.test(w.rel))) return `${marker} 팩의 쓰기 경계 밖: ${w.rel}`;
    }
    return null;
  }
  return null;
}
function main() {
  let raw = ''; try { raw = fs.readFileSync(0, 'utf8'); } catch { /* 입력 없음 */ }
  let input = {}; try { input = JSON.parse(raw || '{}'); } catch { input = {}; }
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const reason = decide(input, {
    cwd: input.cwd, env: process.env, worktreesDir: path.join(root, '.worktrees'),
    readMarker: (dir) => { try { return fs.readFileSync(path.join(dir, '.claude-pack'), 'utf8').trim(); } catch { return null; } },
  });
  if (reason) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')) main();
