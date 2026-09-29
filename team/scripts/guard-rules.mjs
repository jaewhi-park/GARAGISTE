// guard-rules — 하네스 중립 경계 규칙. Claude 훅(.claude/hooks/guard.mjs)과 opencode 플러그인(.opencode/plugins/guard.ts)이 같은 함수를 부른다.
import path from 'node:path';

const DESTRUCTIVE = /\bgit\s+(reset\s+--hard|clean\s+-\S*f|checkout\s+--\s+\.|stash\b|rebase\b|merge\b|branch\s+-D|push\s+(\S+\s+)?(-f\b|--force)|push\s+\S+\s+(main|master)\b|commit\s+(.*\s)?(--no-verify|-n)\b)/;
const SECRET = /(^|[\\/])\.env(\.|$)|\.pem$|\.key$|credentials\.json$/i;
// 규칙집 = 팀 정본(.garagiste) + 하네스 배선(.claude settings·hooks·agents / opencode.json·.opencode agents·plugins / .githooks)
const RULEBOOK = /(^|[\\/])(\.garagiste[\\/](team\.json|HAZARDS\.md|scripts[\\/]|packs[\\/]|ledger[\\/]|units[\\/])|\.claude[\\/](settings\.json|hooks[\\/]|agents[\\/])|opencode\.json|\.opencode[\\/](agents|plugins)[\\/]|\.githooks[\\/])/;
const LEDGER_SHELL = /\.garagiste[\\/](ledger|units)[\\/]/;
const RULEBOOK_SHELL = /(^|[\s;&|>])(rm|mv|cp|sed|tee|truncate|echo|cat|printf)\b[^;&|]*(\.garagiste[\\/](team\.json|HAZARDS\.md|scripts|packs)|\.claude[\\/](settings\.json|hooks|agents)|opencode\.json|\.opencode[\\/](agents|plugins)|\.githooks)/;

export const PACK_RULES = {
  spec: { allow: [/^tests\/acceptance\//, /^docs\/units\/[^/]+\//] },
  build: { deny: [/^tests\/acceptance\//, /^tests\/adversary\//, /^fixtures\/hostile\//, /^probes\//, /^docs\/measurements\/spike-/] },
  attack: { allow: [/^tests\/adversary\//, /^fixtures\/hostile\//] },
  spike: { allow: [/^docs\/measurements\/spike-[^/]+\.md$/] },
  // boot(kind scaffold): 스택·진입점·스모크·규칙 파일. 테스트 폴더는 unit 하나·프로브 없음
  boot: { allow: [/^(package\.json|pnpm-workspace\.yaml|pnpm-lock\.yaml|package-lock\.json|pyproject\.toml|uv\.lock|requirements[^/]*\.txt|Cargo\.toml|go\.mod|\.node-version|\.python-version|\.nvmrc|\.tool-versions|\.gitignore|README(\.[a-z]{2})?\.md|CLAUDE\.md|AGENTS\.md|tsconfig[^/]*\.json|[^/]*\.config\.[a-z]+)$/, /^src\//, /^tests\/unit\//, /^tests\/harness\//, /^docs\/units\/[^/]+\//] },
};
const norm = (p) => p.replace(/\\/g, '/');
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
    if (DESTRUCTIVE.test(c)) return '파괴적 git — stash·rebase·merge·reset --hard·force push·보호 브랜치 push·--no-verify는 없다. 머지는 ship.mjs만.';
    if (LEDGER_SHELL.test(c) && /(>|>>|\brm\b|\bsed\b|\btee\b|\btruncate\b|\bmv\b)/.test(c)) return '원장·unit 상태는 스크립트만 쓴다.';
    if (!admin && RULEBOOK_SHELL.test(c)) return '규칙집(.garagiste 정본·하네스 배선)은 hard 결정 뒤 CEO가 GARAGISTE_ADMIN=1로만 바꾼다.';
    const w = worktreeOf(path.resolve(cwd), ctx.worktreesDir) || worktreeFromCommand(c, ctx.worktreesDir);
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
    if (!w) return admin ? null : 'conductor는 쓰지 않는다 — 쓰기는 worktree 안의 팩과 스크립트(work.mjs brief|add)만. 일반 편집 세션은 GARAGISTE_ADMIN=1.';
    {
      const marker = ctx.readMarker(w.dir);
      const rule = PACK_RULES[marker];
      if (rule?.deny && rule.deny.some((re) => re.test(w.rel))) return `${marker} 팩은 ${w.rel}에 쓸 수 없다 — 테스트·프로브·hostile은 다른 팩의 경계다.`;
      if (rule?.allow && !rule.allow.some((re) => re.test(w.rel))) return `${marker} 팩의 쓰기 경계 밖: ${w.rel}`;
    }
    return null;
  }
  return null;
}
export function makeCtx(root, { cwd, env = process.env, fs }) {
  return {
    cwd, env, worktreesDir: path.join(root, '.worktrees'),
    readMarker: (dir) => { try { return fs.readFileSync(path.join(dir, '.garagiste-pack'), 'utf8').trim(); } catch { return null; } },
  };
}
