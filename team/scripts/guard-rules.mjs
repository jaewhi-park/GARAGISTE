// guard-rules — 하네스 중립 경계 규칙. Claude 훅(.claude/hooks/guard.mjs)과 opencode 플러그인(.opencode/plugins/guard.ts)이 같은 함수를 부른다.
import os from 'node:os';
import path from 'node:path';

// git 전역 옵션(-C <경로>·-c <키=값>·--git-dir= 등)은 하위 명령 앞에 끼어든다 — 필드 시험: `git -C x reset --hard`·`--no-verify`가 붙은 형태만 보던 검사를 빠져나갔다
const GIT = String.raw`\bgit(?:\s+(?:-C|-c)\s+\S+|\s+--(?:git-dir|work-tree|namespace)=\S+)*\s+`;
const DESTRUCTIVE = new RegExp(GIT + String.raw`(reset\s+--hard|clean\s+-\S*f|checkout\s+--\s+\.|stash\b|rebase\b|merge\b|branch\s+-D|push\s+(\S+\s+)?(-f\b|--force)|push\s+\S+\s+(main|master)\b|commit\s+(.*\s)?(--no-verify|-n)\b)`);
// 명령 한 번짜리 훅 경로 변경은 커밋 게이트(.githooks)를 끈다 — --no-verify와 같은 우회다
const HOOK_BYPASS = /\bgit\b[^;&|\n]*\s-c\s+core\.hookspath\s*=/i;
const SECRET = /(^|[\\/])\.env(\.|$)|\.pem$|\.key$|credentials\.json$/i;
// 규칙집 = 팀 정본(.garagiste) + 하네스 배선(.claude settings·hooks·agents / opencode.json·.opencode agents·plugins / .githooks)
const RULEBOOK = /(^|[\\/])(\.garagiste[\\/](team\.json|HAZARDS\.md|VERSION|scripts[\\/]|packs[\\/]|ledger[\\/]|units[\\/])|\.claude[\\/](settings\.json|hooks[\\/]|agents[\\/])|opencode\.json|\.opencode[\\/](agents|plugins)[\\/]|\.githooks[\\/])/;
// 원장·unit 상태 — 향하는 쓰기만 거부한다(L2 1일차: 같은 줄의 sed -n·2>/dev/null까지 쓰기로 읽어 conductor의 표 산출이 막혔다 — 규칙집 읽기 오탐과 같은 수리)
const LEDGER_PATHS = '\\.garagiste[\\\\/](ledger|units)';
const LEDGER_SHELL = new RegExp(`(^|[\\s;&|])(rm|mv|cp|tee|truncate|sed\\s+(-\\S+\\s+)*-i\\S*)\\b[^;&|]*${LEDGER_PATHS}`);
const LEDGER_REDIR = new RegExp(`>{1,2}\\s*("[^"]*|'[^']*|[^\\s;&|<>]*)?${LEDGER_PATHS}`);
const MEMORY = /\/\.claude\/(?:.*\/)?memory\/|\/MEMORY\.md$/i;
// 규칙집 셸 쓰기 — 쓰기 verb(rm·mv·cp·tee·truncate·sed -i)는 그대로 거부, 읽기 verb(cat·sed -n·echo·printf)는 리다이렉트로 규칙집을 향할 때만.
// (첫 Windows 실기의 오탐: conductor가 진단하려고 cat으로 스크립트를 읽는 것까지 거부됐다 — 읽기는 경계가 아니다)
const RULEBOOK_PATHS = '(\\.garagiste[\\\\/](team\\.json|HAZARDS\\.md|VERSION|scripts|packs)|\\.claude[\\\\/](settings\\.json|hooks|agents)|opencode\\.json|\\.opencode[\\\\/](agents|plugins)|\\.githooks)';
const RULEBOOK_SHELL = new RegExp(`(^|[\\s;&|])(rm|mv|cp|tee|truncate|sed\\s+(-\\S+\\s+)*-i\\S*)\\b[^;&|]*${RULEBOOK_PATHS}`);
const RULEBOOK_REDIR = new RegExp(`>{1,2}\\s*("[^"]*|'[^']*|[^\\s;&|<>]*)?${RULEBOOK_PATHS}`);
// 게이트 우회 접두 — SHIP·WIP·ADMIN은 스크립트 내부(ship·checkpoint)와 CEO 세션만 쓴다. LARGE_STEP은 게이트가 받는 정상 경로라 막지 않는다.
const ENV_BYPASS = /(^|[\s;&|])(env\s+)?GARAGISTE_(SHIP|WIP|ADMIN)=/;
// conductor 전용 명령 — tried·decide는 CEO 접점(팩이 부르면 상한 자가 리셋), drop은 방향전환(팩이 자기를 버리지 않는다), needs는 선행 재배선(팩이 자기 WAIT를 풀지 않는다 — 사고 23)
const CEO_CMDS = /\bwork\.mjs\s+(tried|decide|drop|needs|budget)\b/;

export const PACK_RULES = {
  spec: { allow: [/^tests\/acceptance\//, /^docs\/units\/[^/]+\//] },
  build: { deny: [/^tests\/acceptance\//, /^tests\/adversary\//, /^fixtures\/hostile\//, /^probes\//, /^docs\/measurements\/spike-/] },
  attack: { allow: [/^tests\/adversary\//, /^fixtures\/hostile\//] },
  spike: { allow: [/^docs\/measurements\/spike-[^/]+\.md$/] },
  // boot(kind scaffold): 스택·진입점·스모크·규칙 파일. 테스트 폴더는 unit 하나·프로브 없음
  boot: { allow: [/^(package\.json|pnpm-workspace\.yaml|pnpm-lock\.yaml|package-lock\.json|pyproject\.toml|uv\.lock|requirements[^/]*\.txt|Cargo\.toml|go\.mod|\.node-version|\.python-version|\.nvmrc|\.tool-versions|\.gitignore|\.gitattributes|README(\.[a-z]{2})?\.md|CLAUDE\.md|AGENTS\.md|tsconfig[^/]*\.json|[^/]*\.config\.[a-z]+)$/, /^src\//, /^tests\/unit\//, /^tests\/harness\//, /^docs\/units\/[^/]+\//] },
};
const norm = (p) => p.replace(/\\/g, '/');
// 임시 폴더는 저장소 밖이다 — 팩이 fixture·임시 HOME·비교 파일을 두는 자리(5판 관찰 b · L2 6판 가드 거부 누적 6: /tmp 직접 쓰기 · \`T=$(mktemp -d)\`가 풀리지 않아 저장소 안 상대 경로로 읽혀 거부됐고, 팩은 매번 다른 길로 끝냈다).
// OS 임시 폴더(os.tmpdir() · TMPDIR)와 흔한 자리(/tmp · /var/tmp · /private/tmp)만 — 홈 디렉터리는 아니다(HAZARDS 「세션 영속화가 홈에 썼다」는 그대로).
export function tempDirs(env = process.env) {
  return [...new Set([os.tmpdir(), env.TMPDIR, env.TMP, env.TEMP, '/tmp', '/var/tmp', '/private/tmp'].filter(Boolean).map((d) => norm(path.resolve(d))))];
}
export function isTempPath(abs, env = process.env) {
  const a = norm(path.resolve(abs));
  return tempDirs(env).some((d) => a === d || a.startsWith(d.endsWith('/') ? d : d + '/'));
}
// 셸 명령 속의 임시 폴더 표현을 OS 임시 폴더로 — \`$(mktemp …)\`·백틱 mktemp는 그 안의 새 경로, $TMPDIR·${TMPDIR:-/tmp}·$TMP·$TEMP는 그 폴더. 저장소 안 경로로 오독되지 않게 쓰기 판정 전에 푼다.
export function expandTemp(command, env = process.env) {
  const tmp = norm(path.resolve(env.TMPDIR || os.tmpdir()));
  return String(command)
    .replace(/\$\(\s*mktemp\b[^)]*\)|\`\s*mktemp\b[^\`]*\`/g, `${tmp}/garagiste-mktemp`)
    .replace(/\$\{(TMPDIR|TMP|TEMP)(?::-[^}]*)?\}|\$(TMPDIR|TMP|TEMP)\b/g, tmp);
}
// 따옴표 안 텍스트는 셸에선 데이터다 — 커밋 메시지의 트레일러(`<noreply@…>`)·경로 언급이 리다이렉트·쓰기 verb로 오탐됐다(첫 Windows 실기).
// 큰따옴표 안에서도 $()·백틱은 실행되므로 그 내용만 남긴다. 우회 접두(ENV_BYPASS)·worktree 경로 추론은 따옴표로도 효력이 있어 원문을 본다.
export function stripQuoted(command) {
  const src = String(command)
    // heredoc 본문도 데이터다(L2 1일차: 커밋 메시지의 <noreply@…> trailer의 >가 리다이렉트로 읽혀 다음 줄이 쓰기 대상이 됐다 — 2차 실기 이후 두 번째).
    // 구분자 줄의 나머지(리다이렉트 등)는 셸로 남기고, 따옴표 없는 본문의 $()·백틱은 실행이라 그 내용만 남긴다.
    .replace(/<<-?[ \t]*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1([^\n]*)\n([\s\S]*?)\n[ \t]*\2[ \t]*(?=\n|$)/g, (_, q, tag, rest, body) => {
      const subs = q ? null : body.match(/\$\([^)]*\)|`[^`]*`/g);
      return ` ${rest}${subs ? ` ${subs.join(' ')}` : ''} `;
    });
  // 따옴표는 정규식이 아니라 한 글자씩 걷는다(사고 60 — L2 5판 리눅스 1라운드: 큰따옴표 안의 \`…\`를 백틱 치환으로 읽어 안의 <번호>의 >를 리다이렉트로, \`를 쓰기 대상으로 봤다 —
  // intake의 work.mjs add가 막히고 에이전트가 원문의 따옴표를 ”로 바꿔 적었다). 작은따옴표 안은 전부 데이터 · 큰따옴표 안도 데이터지만 이스케이프 안 된 $()·백틱은 실행이라 그 내용만 남긴다 · 따옴표 밖의 \x는 데이터다.
  let out = ''; let i = 0; const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === '\\') { out += ' '; i += 2; continue; }
    if (ch === "'") { const j = src.indexOf("'", i + 1); if (j < 0) { out += src.slice(i); break; } out += ' '; i = j + 1; continue; }
    if (ch === '"') {
      let j = i + 1; let subs = '';
      while (j < n && src[j] !== '"') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '$' && src[j + 1] === '(') { let d = 0; let k = j + 1; for (; k < n; k++) { if (src[k] === '(') d++; else if (src[k] === ')' && --d === 0) break; } subs += ` ${src.slice(j, k + 1)}`; j = k + 1; continue; }
        if (src[j] === '`') { const k = src.indexOf('`', j + 1); if (k < 0) { j = n; break; } subs += ` ${src.slice(j, k + 1)}`; j = k + 1; continue; }
        j++;
      }
      if (j >= n) { out += ` ${subs} ${src.slice(i)}`; break; } // 닫히지 않은 큰따옴표 — 나머지는 셸로 본다(fail-closed)
      out += ` ${subs} `; i = j + 1; continue;
    }
    out += ch; i++;
  }
  return out;
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
  // 명령 자리의 동사만 — slug·경로 속 rm(edit-rm-2.test.mjs · x.rm)은 verb가 아니다(사고 62 — L2 5판 리눅스 2라운드: build 팩의 `node --test tests/adversary/edit-rm-1… tests/adversary/edit-rm-2…`가
  // \brm\b에 걸려 「edit-rm-2.test.mjs에 쓴다」로 거부됐다). /bin/rm·git rm·&&rm은 그대로 verb다.
  const verb = /(?<![\w.-])(?:sed\s+(?:-\S+\s+)*-i\S*|tee|truncate|mv|cp|rm)\b([^;&|>]*)/g;
  while ((m = verb.exec(command))) {
    for (const raw of m[1].trim().split(/\s+/)) {
      const t = raw.replace(/^["']|["']$/g, '');
      if (t && !t.startsWith('-') && GUARDED_AREA.test(t)) out.push(t);
    }
  }
  return out;
}
// 한 명령 안의 `cd <dir> &&`는 그 뒤 상대 경로의 뿌리다 — 훅의 cwd는 명령 전의 위치라 `cd .worktrees/x && rm dist`가 저장소 루트의 dist로 읽힌다
// 사고 67(L2 6판): 팩은 `W=<worktree>; …\ncd $W\ncat > pyproject.toml` 처럼 줄 시작의 cd도 쓴다 — 첫 cd 문(줄·구분자 뒤)이 뿌리다
export function cdBase(command, cwd) {
  const m = /(?:^|[;&|\n])\s*cd\s+(?:"([^"]+)"|'([^']+)'|([^\s;&|]+))\s*(?:&&|;|\n|$)/.exec(String(command));
  return m ? path.resolve(cwd, m[1] ?? m[2] ?? m[3]) : cwd;
}
// 사고 67(L2 6판 세 라운드 — 가드 거부 9/9): 팩의 Bash heredoc 쓰기가 전부 `W=<worktree 절대 경로>; … cat > $W/src/x.py` 꼴이라 가드가 $W를 풀지 못해
// worktree 안 쓰기를 「밖」으로 거부했다(팩은 매번 다른 길로 끝냈다 — 턴 낭비). 같은 명령 안의 단순 대입(값이 $(…)·백틱·다른 변수가 아닌 것)만 풀고,
// 풀 수 없는 변수는 그대로 둔다(저장소 안 상대 경로로 읽혀 fail-closed). 쓰기 경계 자체는 그대로 — 풀린 경로에 같은 규칙이 붙는다.
export function expandAssignments(command) {
  const src = String(command);
  const vars = new Map();
  const re = /(?:^|[;&|\n]|\s)(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(?:"([^"\n]*)"|'([^'\n]*)'|([^\s;&|'"]+))/g;
  let m;
  while ((m = re.exec(src))) { const v = m[2] ?? m[3] ?? m[4]; if (/[`$]/.test(v)) vars.delete(m[1]); else vars.set(m[1], v); }
  // (mktemp·TMPDIR은 expandTemp가 먼저 풀어 여기 올 때는 경로다)
  if (!vars.size) return src;
  return src.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (all, a, b) => (vars.has(a ?? b) ? vars.get(a ?? b) : all));
}
// L2 1일차: conductor의 mv가 CEO의 파일을 옮겼다 — 리다이렉트처럼 rm·mv·cp·tee도 쓰기다. 명령 자리의 동사만 본다(경로 속 rm은 명령이 아니다).
// rm·mv·tee는 인자 전부가 쓰기 대상(mv의 원본은 사라진다), cp는 마지막 인자(목적지)만.
export function fileVerbTargets(command) {
  const out = [];
  const re = /(?:^|[\n;&|(])\s*(?:sudo\s+)?(?:git\s+)?(rm|mv|cp|tee)\b([^;&|>\n]*)/g;
  let m;
  while ((m = re.exec(command))) {
    const args = m[2].trim().split(/\s+/).filter((t) => t && !t.startsWith('-')).map((t) => t.replace(/^["']|["']$/g, ''));
    if (args.length) out.push(...(m[1] === 'cp' ? args.slice(-1) : args));
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
    const c = expandAssignments(expandTemp(String(ti.command || ''), ctx.env)); // 사고 67: 같은 명령의 단순 대입($W=…)을 먼저 푼다 · 임시 폴더 표현(mktemp·TMPDIR)은 그 전에
    const cq = stripQuoted(c); // 쓰기·파괴 판정은 따옴표 밖 텍스트로만
    if (DESTRUCTIVE.test(cq)) return '파괴적 git — stash·rebase·merge·reset --hard·force push·보호 브랜치 push·--no-verify는 없다. 머지는 ship.mjs만.';
    // DESTRUCTIVE의 push 정규식은 main|master 고정 — 보호 브랜치가 다른 이름이면 여기서 막는다 (L0 부검의 발견)
    const pb = ctx.protectedBranch;
    if (!admin && pb && pb !== 'main' && pb !== 'master'
      && new RegExp(`${GIT}push\\b[^;&|]*[\\s:]${pb.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&')}(\\s|$)`).test(c)) return `보호 브랜치(${pb}) push — 머지는 ship.mjs만, 원격 push는 CEO의 일이다.`;
    if (!admin && ENV_BYPASS.test(c)) return '게이트 우회 금지 — GARAGISTE_SHIP·WIP·ADMIN 접두는 스크립트 내부와 CEO(ADMIN 세션)만 쓴다.';
    if (!admin && HOOK_BYPASS.test(cq)) return '게이트 우회 금지 — git -c core.hooksPath=…는 커밋 게이트(.githooks)를 끈다.';
    if (LEDGER_SHELL.test(cq) || LEDGER_REDIR.test(cq)) return '원장·unit 상태는 스크립트만 쓴다.';
    if (!admin && (RULEBOOK_SHELL.test(cq) || RULEBOOK_REDIR.test(cq))) return '규칙집(.garagiste 정본·하네스 배선)은 hard 결정 뒤 CEO가 GARAGISTE_ADMIN=1로만 바꾼다. (읽기는 자유 — Read 툴이나 cat은 막지 않는다)';
    const w = worktreeOf(path.resolve(cwd), ctx.worktreesDir) || worktreeFromCommand(c, ctx.worktreesDir);
    if (w) {
      if (new RegExp(GIT + 'push\\b').test(c)) return 'worktree에서 push하지 않는다 — ship.mjs가 main으로 올린다.';
      if (CEO_CMDS.test(c)) return 'tried·decide(CEO 접점)·drop(방향전환)·needs(선행 재배선)·budget(토큰 상한)는 conductor의 일이다 — 팩은 부르지 않는다. conductor가 CEO의 말을 받아 메인에서 돌린다.';
      if (ctx.readMarker(w.dir) === 'spike' && new RegExp(GIT + 'commit\\b').test(c)) return 'spike는 커밋하지 않는다 — 측정 파일만 남긴다.';
    }
    const base = cdBase(c, cwd);
    for (const target of writeTargets(cq)) {
      const abs = path.resolve(base, target);
      const tw = worktreeOf(abs, ctx.worktreesDir);
      if (tw) { const r = packWriteReason(ctx.readMarker(tw.dir), norm(tw.rel)); if (r) return `Bash 쓰기: ${r}`; continue; }
      if (!admin && ctx.root && !norm(path.relative(ctx.root, abs)).startsWith('..')) return `Bash 쓰기(${target})가 worktree 밖이다 — 쓰기는 worktree 안 팩과 스크립트(work.mjs brief|add|…)만.`;
    }
    if (!admin) for (const target of fileVerbTargets(cq)) {
      const abs = path.resolve(base, target);
      if (worktreeOf(abs, ctx.worktreesDir)) continue; // 팩의 worktree 안은 위의 쓰기 경계가 맡는다
      if (ctx.root && !norm(path.relative(ctx.root, abs)).startsWith('..')) return `worktree 밖 저장소 파일(${target})은 옮기거나 지우지 않는다(mv·rm·cp·tee) — CEO가 만든 파일이면 그 경로를 CEO에게 말한다. 일반 편집 세션은 GARAGISTE_ADMIN=1.`;
    }
    return null;
  }
  if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    const p = ti.file_path || ti.notebook_path || ti.path || '';
    if (!p) return null;
    const abs = path.resolve(cwd, p);
    if (SECRET.test(abs)) return '비밀 파일(.env·*.pem·*.key·credentials)은 읽지도 쓰지도 않는다.';
    if (!admin && MEMORY.test(norm(abs))) return '메모리 파일은 쓰지 않는다 — 상태의 정본은 원장(.garagiste/ledger)과 docs/STATUS.md다(둘째 사본은 검토 없이 드리프트한다).';
    if (!admin && RULEBOOK.test(norm(abs))) return '규칙집·원장·unit 상태는 스크립트가 쓴다. 바꾸려면 hard 결정 → CEO가 GARAGISTE_ADMIN=1.';
    // 임시 폴더는 저장소 밖 — 팩의 fixture·임시 HOME 자리. 저장소 자체가 임시 폴더 아래에 살 수 있다(벤치·테스트) — 저장소 안이면 면제가 아니다
    if (isTempPath(abs, ctx.env) && (!ctx.root || norm(path.relative(ctx.root, abs)).startsWith('..'))) return null;
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
