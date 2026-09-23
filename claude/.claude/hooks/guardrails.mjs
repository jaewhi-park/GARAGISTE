// PreToolUse hook: blocks destructive commands, secret-file access and out-of-role actions at the tool level.
// exit 2 = block (the stderr message is shown to Claude). Tune the patterns to your stack.
// The rules that hold for every role come first (destructive commands, secret files, publishing, gh api mutations, the
// push policy). Then each role's boundary, read from `agent_type` (the hook input names the running agent). Role rules
// are deny-lists of what changes state, not allow-lists of tool names, so a new stack needs no new pattern:
//   team-lead      read-only commands, git branch/merge/sync commands, docs-only add/rm/commit, pushes, gh PR commands, the scripts;
//                  never runs code and never writes a file through the shell
//   team-planner   read-only commands (git status/diff/log/show, ls, cat, version and dependency listings); never runs code
//   Explore        the same read-only boundary
//   team-reviewer  read-only commands plus the toolchain (it may run the tests to check a claim); never edits or commits
//   team-verifier  the toolchain plus every command listed under "## Commands" in CLAUDE.md (an allow-list: it is CI)
//   team-builder   commits in its worktree and may push its branch; never merges, rebases, pulls or touches worktrees
// Other agents (team-implementer, team-critic, roles created by /recruit) get the generic rules only.
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const CHAIN_SEP = /;|&&|\|\||\n/;                                   // independent commands
const unq = (t) => t.replace(/^["'`]+|["'`]+$/g, "");                  // strip surrounding quotes
const words = (seg) => seg.trim().split(/\s+/).map(unq).filter(Boolean);
const stripEnv = (s) => s.trim().replace(/^(\w+=\S*\s+)+/, "");     // VAR=value prefixes
const pipeline = (chain) => chain.split("|").map((s) => stripEnv(s)).filter(Boolean);
// Wrappers that only run another command: the inner command is what gets judged (`time npm test` is `npm test`,
// `bash -c "npm test"` is its string). Without this a read-only role could run anything behind `time`.
const WRAPPERS = /^(time|env|nice|nohup|command|exec|stdbuf|timeout|unbuffer|caffeinate)$/i;
const SHELLS = /^(sh|bash|zsh|dash|ksh|fish|pwsh|powershell|cmd)$/i;
function unwrap(seg) {
  let s = stripEnv(seg).trim();
  for (let i = 0; i < 8; i++) {
    const w = words(s), name = base(w[0] ?? "");
    if (SHELLS.test(name)) {
      const t = tokens(s);
      const ci = t.findIndex((a, k) => k > 0 && (/^-[a-zA-Z]*c[a-zA-Z]*$/.test(a) || /^(-Command|\/c|\/k)$/i.test(a)));
      if (ci > 0 && t[ci + 1] !== undefined) { s = t.slice(ci + 1).join(" ").trim(); continue; }
      return s;
    }
    if (!WRAPPERS.test(name)) return s;
    const rest = w.slice(1);
    while (rest.length && (rest[0].startsWith("-") || /^\w+=/.test(rest[0]) || (/^timeout$/i.test(name) && /^\d/.test(rest[0])))) {
      const a = rest.shift();
      if (/^-(n|k|s|u|C|i|o|e)$/.test(a) && rest.length) rest.shift();   // an option that takes a separate value
    }
    if (!rest.length) return s;
    s = rest.join(" ");
  }
  return s;
}
// Shell-like tokens that keep a quoted string whole (a commit message is one token, not pathspecs).
function tokens(seg) {
  const out = []; let cur = "", q = null, has = false;
  for (const ch of seg) {
    if (q) { if (ch === q) q = null; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; has = true; continue; }
    if (/\s/.test(ch)) { if (cur || has) out.push(cur); cur = ""; has = false; continue; }
    cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}
const base = (t) => t.replace(/^.*[\\/](?=[^\\/]+$)/, "");            // /usr/bin/git → git

// ---------- destructive patterns (whole command line) ----------
const BLOCKED_COMMANDS = [
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\b[^|;&]*\s(-[a-zA-Z]*f[a-zA-Z]*|--force)\b/,                              // -f, -fd, -xf, --force
  /\bgit\s+(checkout|restore)\b[^|;&]*\s(--\s+)?["']?(\.|\.\/|:\/)["']?(\s|$)/,             // checkout -- . / ./ / :/ (quoted too)
  /\bgit\s+branch\b[^|;&]*\s(-[a-zA-Z]*[Df][a-zA-Z]*|--force)\b/,                          // -D, -df, -d -f, --delete --force (plain -d stays allowed)
  /\bgit\s+switch\b[^|;&]*(\s-[a-zA-Z]*[Cf][a-zA-Z]*\b|--force(-create)?\b|--discard-changes\b)/, // never force-switch
  /\bgit\s+stash\s+(drop|clear)\b/,
  /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\b(kubectl|helm|terraform|aws|gcloud|az)\s+\S*\s*(apply|delete|destroy|rm)\b/i,
  /\b(npm|pnpm|yarn|cargo|gem)\s+publish\b/i, /\bgem\s+push\b/, /\btwine\s+upload\b/, /\bdocker\s+push\b/, // publishing is the CEO's
];
// rm / Remove-Item / rd: recursive delete whose target is a root-like path (/, ~, .., $HOME, $PWD, a drive root, ., ./, ./*, :/, .git or *).
const ROOTISH = /^(\/|~|\.\.(\/|\\|$)|\.(\/\*?|\\\*?)?$|:\/$|\.git$|\*|\$HOME\b|\$\{HOME\}|\$PWD\b|\$\{PWD\}|\$env:USERPROFILE\b|\$env:HOMEPATH\b|[A-Za-z]:[\\/]?$|\\\\)/;
function recursiveDeleteOfRoot(cmd) {
  for (const seg of cmd.split(/\|\||&&|[|;\n]/)) {
    const m = /(^|\s)(sudo\s+)?(rm|Remove-Item|ri|rmdir|rd|del|erase)\s+(.*)$/i.exec(seg.trim());
    if (!m) continue;
    const toks = m[4].split(/\s+/).map(unq);
    const recursive = toks.some((t) => /^-[a-zA-Z]*[rR]/.test(t) || /^--recursive$/.test(t) || /^-rec/i.test(t) || /^\/s$/i.test(t));
    const targets = toks.filter((t) => !t.startsWith("-") && !/^\/[sq]$/i.test(t));
    if (recursive && targets.some((t) => ROOTISH.test(t))) return true;
  }
  return false;
}

// ---------- secrets ----------
const SECRET_PATHS =
  /(^|[\\/])(\.env(rc|\.(?!example$)[^/\\]*)?|[^/\\]*\.(pem|key|p12|pfx|jks|keystore|ppk|gpg|asc)|id_(rsa|dsa|ecdsa|ed25519)[^/\\]*|credentials(\.json)?|\.netrc|\.npmrc|\.pypirc|\.git-credentials)$/i;
// The same files named in a shell command. A command is blocked when, within one pipeline, a program that prints or evaluates
// files appears anywhere (also behind sudo, xargs, find -exec, $( ) or a path like /bin/cat) and a secret file is named.
// cp/mv/ls/source stay allowed (worktrees copy .env on purpose); a program that opens the file without naming it is not caught.
const READER_WORDS = /^(cat|tac|head|tail|less|more|bat|type|strings|xxd|od|base64|sort|uniq|nl|Get-Content|gc|Select-String|sls|grep|rg|awk|sed|cut|tee|openssl|git)$/i;
const EVAL_FLAGS = /^(-e|--eval|-p|--print|-c)$/;
const INTERPRETERS = /^(node|deno|bun|python|python3|ruby|perl|php)$/i;
const SECRET_TOKEN = /(^|[\s"'`=\/\\:<(])(\.env(rc|\.(?!example\b)[^\s\/\\"'`]*|\*)?|[^\s\/\\"'`]*\.(pem|key|p12|pfx|jks|keystore|ppk|gpg|asc)|id_(rsa|dsa|ecdsa|ed25519)[^\s\/\\"'`]*|credentials(\.json)?|\.netrc|\.npmrc|\.pypirc|\.git-credentials)(?=$|[\s"'`;|&)*])/i;
function readsSecret(cmd) {
  for (const chain of cmd.split(CHAIN_SEP)) {
    const segs = pipeline(chain);
    if (!segs.some((s) => SECRET_TOKEN.test(s))) continue;
    const reader = segs.some((s) => {
      const w = words(s).map((t) => t.replace(/^\$?\(|^\{|^`/, "").replace(/^.*[\\/](?=[^\\/]+$)/, ""));
      return w.some((t, i) => READER_WORDS.test(t) || (INTERPRETERS.test(t) && w.slice(i + 1).some((f) => EVAL_FLAGS.test(f))));
    });
    if (reader) return true;
  }
  return false;
}

const GH_API_MUTATION = /\bgh\s+api\b[^|;&]*(\s(-X|--method)\s+(?!GET\b)\S+|\s(-f|-F|--field|--raw-field|--input)\b)/;
const SHELL_WRITE = /(^|[^<>])>{1,2}(?!&|\s*(\/dev\/null|NUL)\b)|\btee\b|\b(sed|perl)\s+-[a-zA-Z]*i\b/; // redirection (except to /dev/null), tee, in-place edits

// ---------- read-only shell: what a non-executing role may run ----------
// Programs that change files or run other programs on the caller's behalf.
const MUTATING_PROGRAMS = /^(sudo|doas|rm|rmdir|rd|del|erase|mv|move|cp|copy|mkdir|md|touch|chmod|chown|chgrp|ln|mklink|dd|truncate|shred|install|patch|tee|xargs|Remove-Item|ri|Move-Item|mi|Copy-Item|cpi|New-Item|ni|Set-Content|sc|Add-Content|ac|Out-File|Rename-Item|rni|Clear-Content|clc)$/i;
// Programs that run code, builds or tests. A role without `runCode` may use them only for the read-only invocations below.
const CODE_RUNNERS = /^(node|deno|bun|python|python3|py|ruby|perl|php|java|dotnet|go|cargo|rustc|mvn|gradle|gradlew|gradlew\.bat|make|npm|pnpm|yarn|npx|pip|pip3|pytest|uv|poetry|ruff|mypy|pyright|tsc|eslint|prettier|vitest|jest|mocha|playwright|docker|docker-compose|kubectl|helm|terraform|sh|bash|zsh|pwsh|powershell|cmd)$/i;
// Version and dependency listings — the opencode flavor's explore allow-list.
const RUNNER_READ_ONLY = [
  /^\S+\s+(--version|-v|-V|version|--help|-h)$/,
  /^(npm|pnpm|yarn|bun)\s+(ls|list|view|show|info|why|outdated|root|prefix|config\s+get|pkg\s+get)\b/i, /^npm\s+audit(?!\s+fix)\b/i,
  /^pip3?\s+(list|show|freeze|check)\b/i, /^uv\s+pip\s+(list|show|freeze)\b/i, /^poetry\s+(show|env\s+info)\b/i,
  /^go\s+(version|list|env)\b/i, /^cargo\s+(tree|metadata)\b/i, /^dotnet\s+(--list-sdks|--list-runtimes|list)\b/i,
  /^mvn\s+(dependency:tree|help:)/i, /^gradle\s+(dependencies|projects|tasks)\b/i, /^make\s+-n\b/,
  /^docker\s+(compose\s+config|ps|images|version|info)\b/i,
];
const GIT_READ_SUBS = /^(status|diff|log|show|rev-parse|ls-files|ls-tree|ls-remote|cat-file|blame|describe|shortlog|rev-list|name-rev|merge-base|diff-tree|for-each-ref|check-ignore|count-objects|grep|reflog|show-ref|whatchanged|var|version|help)$/;
function gitSub(w) { let pi = 1; while (pi < w.length && w[pi].startsWith("-")) pi += /^-[cC]$/.test(w[pi]) ? 2 : 1; return pi; }   // global options: -c k=v, -C dir, --no-pager
// A git segment that only reads: the listing forms of branch/tag/remote/stash/worktree/config, and the read-only subcommands.
function gitReadOnly(w, pi) {
  const sub = w[pi] ?? "", rest = w.slice(pi + 1);
  const flags = rest.filter((a) => a.startsWith("-")), pos = rest.filter((a) => !a.startsWith("-"));
  const has = (re) => flags.some((f) => re.test(f));
  if (GIT_READ_SUBS.test(sub)) return true;
  switch (sub) {
    case "branch": return !has(/^(-[a-zA-Z]*[dDmMcCfu][a-zA-Z]*|--delete|--move|--copy|--force|--set-upstream-to(=.*)?|--unset-upstream|--edit-description|--track|--no-track)$/)
      && (pos.length === 0 || has(/^(-[a-zA-Z]*[rlav][a-zA-Z]*|--list|--all|--remotes|--show-current|--contains|--no-contains|--merged|--no-merged|--points-at|--verbose)$/));
    case "tag": return !has(/^(-[a-zA-Z]*[adfmsuF][a-zA-Z]*|--delete|--force|--annotate|--sign|--message(=.*)?|--file(=.*)?|--edit)$/)
      && (pos.length === 0 || has(/^(-[a-zA-Z]*[ln][a-zA-Z]*|--list|--contains|--no-contains|--points-at|--merged|--no-merged|--sort(=.*)?)$/));
    case "remote": return pos.length === 0 || /^(show|get-url)$/.test(pos[0]);
    case "stash": return /^(list|show)$/.test(pos[0] ?? "");
    case "worktree": return pos[0] === "list";
    case "config": return has(/^(--get|--get-all|--get-regexp|-l|--list|--show-origin|--show-scope)$/) && !has(/^(--unset|--unset-all|--add|--replace-all|--edit|-e|--rename-section|--remove-section)$/) && pos.length <= 1;
    case "notes": return /^(show|list)$/.test(pos[0] ?? "");
    default: return false;
  }
}
const GH_READ = /^(repo\s+view|pr\s+(view|list|checks|diff|status)|issue\s+(view|list)|run\s+(view|list)|release\s+(view|list)|api|auth\s+status|search)\b/;
// One pipeline segment. `runCode`: the role may run builds and tests (reviewer); otherwise only the read-only invocations.
function readOnlySegment(seg, runCode) {
  const s = unwrap(seg);
  if (!s || /^cd(\s|$)/.test(s)) return true;
  const w = words(s), name = base(w[0] ?? "");
  if (MUTATING_PROGRAMS.test(name)) return false;
  if (name === "git") return gitReadOnly(w, gitSub(w));
  if (name === "gh") return GH_READ.test(w.slice(1).join(" "));
  if (CODE_RUNNERS.test(name)) return runCode || RUNNER_READ_ONLY.some((re) => re.test([name, ...w.slice(1)].join(" ")));
  return true;   // ls, cat, grep, find, wc, jq, … — anything that neither writes nor runs code
}
const readOnly = (cmd, runCode) => !SHELL_WRITE.test(cmd) && cmd.split(CHAIN_SEP).every((chain) => pipeline(chain).every((s) => readOnlySegment(s, runCode)));

// ---------- team-lead ----------
// Branch/merge/sync work the skills give the lead; -D, force switches, force pushes and pushes to main are blocked above and below.
const LEAD_GIT = /^(fetch|merge|rebase|revert|worktree|switch|tag|branch|remote|push)$/;
const DOCS_ONLY = /^(\.[\\/])?(docs[\\/]|CLAUDE\.md$|\.claude[\\/]|\.gitignore$|CHANGELOG[^\\/]*$)/;
const GH_LEAD = /^(repo\s+view|pr\s+(view|list|checks|diff|status|create|merge|close|ready|edit|comment)|issue\s+(view|list)|run\s+(view|list)|api|auth\s+status|search)\b/;
const LEAD_SCRIPT = /\.claude[\\/]scripts[\\/](apply-models|set-language|new-agent|set-profile)\.mjs$/;
// A git segment the lead may run: read-only, LEAD_GIT, or add/rm/commit touching docs-only paths (docs/, CLAUDE.md, .claude/, .gitignore, CHANGELOG*).
function leadGit(seg) {
  const t = tokens(stripEnv(seg)), pi = gitSub(t), sub = t[pi] ?? "", rest = t.slice(pi + 1);
  if (gitReadOnly(t, pi) || LEAD_GIT.test(sub)) return true;
  if (sub === "add" || sub === "rm") {
    const dd = rest.indexOf("--");
    const flags = rest.filter((a, i) => a.startsWith("-") && a !== "--" && (dd < 0 || i < dd));
    const pos = rest.filter((a, i) => a !== "--" && (!a.startsWith("-") || (dd >= 0 && i > dd)));
    if (sub === "add" && flags.some((f) => /^(-[a-zA-Z]*[Aupi][a-zA-Z]*|--all|--update|--patch|--interactive)$/.test(f))) return false;
    return pos.length > 0 && pos.every((p) => DOCS_ONLY.test(p));
  }
  if (sub === "commit") {
    const specs = []; let after = false;
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i];
      if (after) { specs.push(a); continue; }
      if (a === "--") { after = true; continue; }
      if (/^(-m|-F|-t|-C|-c|--author|--date|--cleanup|--trailer|--fixup|--squash|--reuse-message|--reedit-message|--file|--message|--template)$/.test(a)) { i++; continue; }
      if (/^(-[mFtCc].|--(message|file|template|author|date|cleanup|trailer|fixup|squash|reuse-message|reedit-message)=)/.test(a)) continue;
      if (/^(-[a-zA-Z]*[aipno][a-zA-Z]*|--all|--amend|--include|--interactive|--patch|--no-verify|--only)$/.test(a)) return false;   // -a/--all and --amend commit code; --no-verify skips hooks
      if (a.startsWith("-")) continue;
      specs.push(a);
    }
    return specs.every((p) => DOCS_ONLY.test(p));
  }
  return false;
}
function leadSegment(seg) {
  const s = unwrap(seg);
  if (!s || /^cd(\s|$)/.test(s)) return true;
  const w = words(s), name = base(w[0] ?? "");
  if (name === "git") return leadGit(s);
  if (name === "gh") return GH_LEAD.test(w.slice(1).join(" "));
  if (/^node$/i.test(name) && LEAD_SCRIPT.test(w[1] ?? "")) return true;
  return readOnlySegment(s, false);
}
const leadOk = (cmd) => !SHELL_WRITE.test(cmd) && cmd.split(CHAIN_SEP).every((chain) => pipeline(chain).every(leadSegment));

// ---------- team-verifier ----------
// It is CI: an allow-list of build/test/lint tools (plus read-only git and output trimming), extended by whatever CLAUDE.md's
// "## Commands" section lists — the rules file is the contract, so a stack-specific runner needs no new pattern here.
// What an `npm run` script executes is not inspected.
const VERIFIER_TOOLCHAIN = [
  /^make\s/, /^npm\s/, /^pnpm\s/, /^yarn\s/, /^bun\s/, /^npx\s/, /^deno\s/,
  /^pytest\b/, /^uv\s+run\b/, /^poetry\s+run\b/, /^python\s+-m\s/, /^python3\s+-m\s/, /^ruff\b/, /^mypy\b/, /^pyright\b/,
  /^mvn\s/, /^gradle\b/, /^(\.[\\/])?gradlew(\.bat)?\b/, /^go\s/, /^cargo\s/, /^dotnet\s/,
  /^(jest|vitest|mocha|tsc|eslint|prettier|playwright|composer|rspec|rake|flutter|dart|swift|xcodebuild|nx|turbo|just)\b/, /^php\s+(artisan|vendor)\b/, /^bundle\s+exec\b/,
  /^git\s+(status|diff|log)\b/,                                // gen-commit checks (`git status --porcelain`)
  /^(head|tail|grep|wc|cat|ls)\b/,                             // output trimming and looking at results only
];
function rulesFileCommands(cwd) {
  let dir = resolve(cwd || process.cwd());
  for (let i = 0; i < 8; i++) {
    const p = join(dir, "CLAUDE.md");
    if (existsSync(p)) { try { return parseCommands(readFileSync(p, "utf8")); } catch { return []; } }
    const up = dirname(dir); if (up === dir) break; dir = up;
  }
  return [];
}
// "## Commands" entries: `- label: cmd` bullets (the text after the first ": "; a bare `- cmd` too) and fenced lines; chains split.
function parseCommands(text) {
  const out = []; let inSection = false, fenced = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (!fenced && /^##\s/.test(line)) { inSection = /^##\s+Commands\b/i.test(line); continue; }
    if (!inSection || !line) continue;
    let body = line;
    if (!fenced) {
      const m = /^[-*]\s+(.*)$/.exec(body); if (!m) continue;
      body = m[1]; const c = body.indexOf(": ");
      if (c >= 0) body = body.slice(c + 2); else if (/:$/.test(body)) continue;
      const bt = /`([^`]+)`/.exec(body); if (bt) body = bt[1];   // `cmd` (a note after it is prose, not part of the command)
    }
    body = body.replace(/\s+—\s+unverified\s*$/, "").replace(/`/g, "").trim();
    for (const chain of body.split(CHAIN_SEP)) for (const seg of pipeline(chain)) { const s = seg.trim(); if (s && !/^cd(\s|$)/.test(s)) out.push(s); }
  }
  return out;
}
const verifierOk = (cmd, listed) => cmd.split(CHAIN_SEP).every((chain) => pipeline(chain).every((seg) => {
  const s = unwrap(seg);
  return !s || /^cd\s+\S+$/.test(s) || VERIFIER_TOOLCHAIN.some((re) => re.test(s)) || listed.some((l) => s === l || s.startsWith(l + " "));
}));

// ---------- team-builder ----------
// It implements one plan in its worktree: commits there, may push its own branch (main and force are blocked below), never merges, rebases, pulls or touches worktrees.
const BUILDER_BLOCKED = /\bgit\b(\s+-[cC]\s*\S+|\s+--\S+)*\s+(merge|rebase|worktree|pull)\b/;

// ---------- the board ----------
// docs/STATUS.md is the CEO's page and stays short; docs/STATUS-team.md is the team's pointer. Both are the lead's.
const BOARD_FILES = /(^|[\\/])docs[\\/]STATUS(-team)?\.md$/;
const CEO_PAGE = /(^|[\\/])docs[\\/]STATUS\.md$/;
const CEO_PAGE_MAX_CHARS = 1800, CEO_PAGE_MAX_LINE = 200;
// The file as the tool call would leave it (Write: the content; Edit/MultiEdit: the replacement applied to the file).
function afterWrite(tool, ti, p) {
  if (tool === "Write") return String(ti.content ?? "");
  let cur; try { cur = readFileSync(p, "utf8"); } catch { return null; }
  const edits = tool === "MultiEdit" ? (ti.edits ?? []) : [ti];
  for (const e of edits) {
    const o = String(e.old_string ?? ""), n = String(e.new_string ?? "");
    if (!o) continue;
    cur = e.replace_all ? cur.split(o).join(n) : cur.replace(o, () => n);
  }
  return cur;
}
function ceoPageTooLong(text) {
  const t = text.replace(/\r\n/g, "\n");
  const chars = [...t.replace(/\n/g, "")].length;
  if (chars > CEO_PAGE_MAX_CHARS) return `${chars} characters, max ${CEO_PAGE_MAX_CHARS}`;
  const long = t.split("\n").find((l) => [...l].length > CEO_PAGE_MAX_LINE);
  return long ? `a line of ${[...long].length} characters, max ${CEO_PAGE_MAX_LINE}` : "";
}
const REVIEWER_MEMORY = /(^|[\\/])docs[\\/]memory[\\/]team-reviewer\.md$/;

function deny(msg) { process.stderr.write(`[guardrail] ${msg}\n`); process.exit(2); }

let input;
try { input = JSON.parse(readFileSync(0, "utf8")); } catch { deny("blocked: the hook could not read its input (fail closed)"); }
const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};
const role = input.agent_type ?? "";
const cwd = input.cwd ?? process.cwd();

if (tool === "Bash" || tool === "PowerShell") {
  const cmd = String(ti.command ?? "");
  if (role === "team-verifier" && !verifierOk(cmd, rulesFileCommands(cwd))) {
    deny(`blocked command (team-verifier runs build/test/lint tools and the commands listed under "## Commands" in CLAUDE.md, nothing else): ${cmd}`);
  }
  if (role === "team-lead" && !leadOk(cmd)) {
    deny(`blocked command (team-lead runs read-only commands, git branch/merge/sync commands, docs-only commits, pushes and gh PR commands; code goes to team-implementer, checks to team-verifier; no shell writes): ${cmd}`);
  }
  if ((role === "team-planner" || /^explore$/i.test(role)) && !readOnly(cmd, false)) {
    deny(`blocked command (${role} uses the shell read-only: git status/diff/log/show, listings, version checks; it never runs code or writes files): ${cmd}`);
  }
  if (role === "team-reviewer" && !readOnly(cmd, true)) {
    deny(`blocked command (team-reviewer uses the shell read-only, plus the toolchain to run tests; it never edits, commits or writes files): ${cmd}`);
  }
  if (role === "team-builder" && BUILDER_BLOCKED.test(cmd)) {
    deny(`blocked command (team-builder never merges, rebases, pulls or touches worktrees -- /integrate does that): ${cmd}`);
  }
  if (BLOCKED_COMMANDS.some((re) => re.test(cmd)) || recursiveDeleteOfRoot(cmd)) {
    deny(`blocked command: ${cmd}`);
  }
  if (readsSecret(cmd)) {
    deny(`blocked: command reads a secret file: ${cmd}`);
  }
  if (GH_API_MUTATION.test(cmd)) {
    deny(`blocked: gh api may only read (merges, branch protection and refs are changed by the CEO on GitHub): ${cmd}`);
  }
  // Push policy, every role: feature-branch pushes allowed; force push, mirror/all/delete pushes and any push to main/master blocked
  // (main changes only through a PR or the lead's approved local merge). Each `git push` segment is tokenised with quotes stripped.
  for (const chain of cmd.split(CHAIN_SEP)) for (const seg of pipeline(chain)) {
    const w = words(seg);
    const gi = w.indexOf("git");
    if (gi < 0) continue;
    let pi = gi + 1;
    while (pi < w.length && w[pi].startsWith("-")) pi += /^-[cC]$/.test(w[pi]) ? 2 : 1;   // global options: -c k=v, -C dir, --no-pager
    if (w[pi] !== "push") continue;
    const args = w.slice(pi + 1);
    const flags = args.filter((a) => a.startsWith("-"));
    const pos = args.filter((a) => !a.startsWith("-"));
    const force = flags.some((f) => /^(--force|--force-with-lease(=.*)?|--force-if-includes|--mirror|--all|--delete|-d|--prune)$/.test(f) || /^-[a-zA-Z]*[fd][a-zA-Z]*$/.test(f))
      || pos.slice(1).some((r) => r.startsWith("+"));
    const refspecs = pos.slice(1);
    const toMain = refspecs.some((r) => /^(main|master)$/i.test((r.includes(":") ? r.split(":").pop() : r).replace(/^refs\/heads\//, "")));
    let onMain = false;
    if (refspecs.length === 0 || refspecs.some((r) => /^HEAD$/.test(r))) {
      try { onMain = /^(main|master)$/.test(execSync("git rev-parse --abbrev-ref HEAD", { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString().trim()); } catch {}
    }
    if (force || toMain || onMain) deny(`blocked push (force push and direct push to main are not allowed; merge via PR): ${cmd}`);
  }
}
if (["Edit", "Write", "MultiEdit", "Read", "NotebookEdit"].includes(tool)) {
  const p = String(ti.file_path ?? ti.notebook_path ?? "");
  const writing = tool !== "Read";
  // team-lead writes no code and no docs; its only editable files are the two board files (mirrors opencode's `edit: docs/STATUS*.md: allow`).
  if (writing && role === "team-lead" && !BOARD_FILES.test(p)) {
    deny(`blocked edit (team-lead edits only docs/STATUS.md and docs/STATUS-team.md; code goes to team-implementer, docs to team-planner): ${p}`);
  }
  // The CEO's page stays readable in a minute: a write that would leave it over the cap is refused, whoever writes it.
  if (writing && CEO_PAGE.test(p)) {
    const after = afterWrite(tool, ti, resolve(cwd, p));
    const why = after === null ? "" : ceoPageTooLong(after);
    if (why) deny(`blocked edit (docs/STATUS.md is the CEO's page and stays short — ${why}; detail goes to docs/STATUS-team.md, a plan or git): ${p}`);
  }
  // team-reviewer writes only its own memory file.
  if (writing && role === "team-reviewer" && !REVIEWER_MEMORY.test(p)) {
    deny(`blocked edit (team-reviewer writes only docs/memory/team-reviewer.md; it never edits code or documents): ${p}`);
  }
  // team-planner writes documents only: docs/** and the rules file (mirrors opencode's `edit: docs/*, CLAUDE.md: allow`).
  if (writing && role === "team-planner" && !/(^|[\\/])docs[\\/]/.test(p) && !/(^|[\\/])CLAUDE\.md$/.test(p)) {
    deny(`blocked edit (team-planner writes only under docs/ and CLAUDE.md; code goes to team-implementer): ${p}`);
  }
  if (SECRET_PATHS.test(p)) deny(`blocked secret path: ${p}`);
}
if (tool === "Grep") {
  const p = String(ti.path ?? "");
  const g = String(ti.glob ?? "");
  if (SECRET_PATHS.test(p) || (g && SECRET_TOKEN.test(g))) deny(`blocked: search inside a secret file: ${p || g}`);
}
process.exit(0);
