// PreToolUse hook: blocks destructive commands, secret-file access and out-of-role actions at the tool level.
// exit 2 = block (the stderr message is shown to Claude). Tune the patterns to your stack.
// Roles are read from `agent_type` (the hook input names the running agent): team-lead, team-planner, team-reviewer,
// team-builder and team-verifier get role rules mirroring the opencode flavor's permission blocks; other agents
// (team-implementer, team-critic, Explore, roles created by /recruit) get the generic rules only.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const CHAIN_SEP = /;|&&|\|\||\n/;                                   // independent commands
const unq = (t) => t.replace(/^["'`]+|["'`]+$/g, "");                  // strip surrounding quotes
const words = (seg) => seg.trim().split(/\s+/).map(unq).filter(Boolean);
const stripEnv = (s) => s.trim().replace(/^(\w+=\S*\s+)+/, "");     // VAR=value prefixes
const pipeline = (chain) => chain.split("|").map((s) => stripEnv(s)).filter(Boolean);

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

// ---------- role rules ----------
// team-verifier is CI: it may only run build/test/lint tools (plus read-only git), never anything else. Deny-by-default,
// mirroring the opencode flavor's team-verifier permission block. This is a tool-name allow-list: what an `npm run` script
// executes is not inspected — the CLAUDE.md Commands rule in the agent prompt is what limits that.
const VERIFIER_ALLOWED_COMMANDS = [
  /^make\s/, /^npm\s/, /^pnpm\s/, /^yarn\s/, /^bun\s/, /^npx\s/,
  /^pytest\b/, /^uv\s+run\b/, /^poetry\s+run\b/,
  /^python\s+-m\s/, /^python3\s+-m\s/,
  /^ruff\b/, /^mypy\b/, /^pyright\b/,
  /^mvn\s/, /^gradle\b/, /^(\.[\\/])?gradlew(\.bat)?\b/,
  /^go\s/, /^cargo\s/, /^dotnet\s/,
  /^git\s+(status|diff|log)\b/,                                // gen-commit checks (`git status --porcelain`)
  /^(head|tail|grep|wc)\b/,                                    // output trimming only
];
// team-lead runs no code and writes no files through the shell: git branch/merge/sync commands, gh reads, the four
// scripts and read-only helpers only — the opencode lead's allow-list. Commits, pushes, PR merges and shell writes are out.
const LEAD_ALLOWED_COMMANDS = [
  /^git\s+(status|diff|log|show|branch|fetch|merge|rebase|revert|worktree|switch|tag|remote|rev-parse|ls-files)\b/,
  /^gh\s+(repo\s+view|pr\s+(view|list)|api)\b/,               // gh api: reads only (mutations blocked below for everyone)
  /^node\s+"?[^"\s]*\.claude[\\/]scripts[\\/](apply-models|set-language|new-agent|set-profile)\.mjs\b/,
  /^(ls|dir|pwd|cat|head|tail|wc|grep|rg|find|echo|printf|type|date|which|where|true)\b/,
];
// team-planner writes documents, team-reviewer judges: read-only git in the shell (their edits are scoped separately).
const DOC_ROLE_ALLOWED_COMMANDS = [/^git\s+(status|diff|log|show)\b/];
// team-builder implements one plan in its worktree: it commits there but never pushes, merges, rebases or touches worktrees.
const BUILDER_BLOCKED = /\bgit\b(\s+-[cC]\s*\S+|\s+--\S+)*\s+(push|merge|rebase|worktree|pull)\b/;
function everySegment(cmd, allowed) {
  return cmd.split(CHAIN_SEP).every((chain) => pipeline(chain).every((s) => !s || /^cd\s+\S+$/.test(s) || allowed.some((re) => re.test(s))));
}
const GH_API_MUTATION = /\bgh\s+api\b[^|;&]*(\s(-X|--method)\s+(?!GET\b)\S+|\s(-f|-F|--field|--raw-field|--input)\b)/;
const SHELL_WRITE = /(^|[^<>])>{1,2}(?!&|\s*(\/dev\/null|NUL)\b)|\btee\b|\b(sed|perl)\s+-[a-zA-Z]*i\b/; // redirection (except to /dev/null), tee, in-place edits

function deny(msg) { process.stderr.write(`[guardrail] ${msg}\n`); process.exit(2); }

let input;
try { input = JSON.parse(readFileSync(0, "utf8")); } catch { deny("blocked: the hook could not read its input (fail closed)"); }
const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};
const role = input.agent_type ?? "";

if (tool === "Bash" || tool === "PowerShell") {
  const cmd = String(ti.command ?? "");
  if (role === "team-verifier" && !everySegment(cmd, VERIFIER_ALLOWED_COMMANDS)) {
    deny(`blocked command (team-verifier only runs build/test/lint tools from CLAUDE.md's Commands section): ${cmd}`);
  }
  if (role === "team-lead" && (!everySegment(cmd, LEAD_ALLOWED_COMMANDS) || SHELL_WRITE.test(cmd))) {
    deny(`blocked command (team-lead runs only git branch/merge/sync commands, gh reads, the scripts and read-only helpers; code goes to team-implementer, docs to team-planner, checks to team-verifier): ${cmd}`);
  }
  if ((role === "team-planner" || role === "team-reviewer") && !everySegment(cmd, DOC_ROLE_ALLOWED_COMMANDS)) {
    deny(`blocked command (${role} uses the shell only for git status/diff/log/show): ${cmd}`);
  }
  if (role === "team-builder" && BUILDER_BLOCKED.test(cmd)) {
    deny(`blocked command (team-builder never pushes, merges, rebases or touches worktrees -- /integrate does that): ${cmd}`);
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
  // team-lead never commits: milestone commits (brief, plan, spec, kickoff/assess docs, hire output) and step commits alike go to
  // team-implementer, mirroring the opencode flavor's team-lead, which has no git commit permission. Global options before the
  // subcommand (`git -c k=v commit`, `git -C <dir> add`) are tolerated by the pattern; `rm` covers `git rm --cached` (staging too).
  if (role === "team-lead" && /\bgit\b(\s+-[cC]\s*\S+|\s+--\S+)*\s+(add|rm|commit|stash|cherry-pick|am|apply|reset)\b/.test(cmd)) {
    deny(`blocked (team-lead never commits or rewrites history -- milestone and step commits go to team-implementer): ${cmd}`);
  }
  // Push policy: feature-branch pushes allowed; force push, mirror/all/delete pushes and any push to main/master blocked
  // (merge via PR only). team-lead never pushes anything at all -- ship/integrate/release delegate pushes to team-implementer
  // or present the command for the CEO to run themselves. Each `git push` segment is tokenised with quotes stripped.
  for (const chain of cmd.split(CHAIN_SEP)) for (const seg of pipeline(chain)) {
    const w = words(seg);
    const gi = w.indexOf("git");
    if (gi < 0) continue;
    let pi = gi + 1;
    while (pi < w.length && w[pi].startsWith("-")) pi += /^-[cC]$/.test(w[pi]) ? 2 : 1;   // global options: -c k=v, -C dir, --no-pager
    if (w[pi] !== "push") continue;
    if (role === "team-lead") deny(`blocked push (team-lead never pushes -- delegate to team-implementer, or present the command for the CEO to run): ${cmd}`);
    const args = w.slice(pi + 1);
    const flags = args.filter((a) => a.startsWith("-"));
    const pos = args.filter((a) => !a.startsWith("-"));
    const force = flags.some((f) => /^(--force|--force-with-lease(=.*)?|--force-if-includes|--mirror|--all|--delete|-d|--prune)$/.test(f) || /^-[a-zA-Z]*[fd][a-zA-Z]*$/.test(f))
      || pos.slice(1).some((r) => r.startsWith("+"));
    const refspecs = pos.slice(1);
    const toMain = refspecs.some((r) => /^(main|master)$/i.test((r.includes(":") ? r.split(":").pop() : r).replace(/^refs\/heads\//, "")));
    let onMain = false;
    if (refspecs.length === 0 || refspecs.some((r) => /^HEAD$/.test(r))) {
      try { onMain = /^(main|master)$/.test(execSync("git rev-parse --abbrev-ref HEAD", { cwd: input.cwd ?? process.cwd(), stdio: ["ignore", "pipe", "ignore"] }).toString().trim()); } catch {}
    }
    if (force || toMain || onMain) deny(`blocked push (force push and direct push to main are not allowed; merge via PR): ${cmd}`);
  }
}
if (["Edit", "Write", "MultiEdit", "Read", "NotebookEdit"].includes(tool)) {
  const p = String(ti.file_path ?? ti.notebook_path ?? "");
  const writing = tool !== "Read";
  // team-lead writes no code and no docs; its only editable file is the status board (mirrors opencode's `edit: docs/STATUS.md: allow`).
  if (writing && role === "team-lead" && !/(^|[\\/])docs[\\/]STATUS\.md$/.test(p)) {
    deny(`blocked edit (team-lead edits only docs/STATUS.md; code goes to team-implementer, docs to team-planner): ${p}`);
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
