// PreToolUse hook: blocks destructive commands and secret-file access at the tool level.
// exit 2 = block (the stderr message is shown to Claude). Tune the patterns to your stack.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// Shell-level destructive patterns. Each is matched against the whole command line.
const BLOCKED_COMMANDS = [
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\b[^|;&]*\s(-[a-zA-Z]*f[a-zA-Z]*|--force)\b/,                 // -f, -fd, -xf, --force
  /\bgit\s+(checkout|restore)\b[^|;&]*\s(--\s+)?\.(\s|$)/,                     // checkout -- . / checkout . / restore .
  /\bgit\s+branch\b[^|;&]*\s(-[a-zA-Z]*[Df][a-zA-Z]*|--force)\b/,             // -D, -df, -d -f, --delete --force (plain -d stays allowed)
  /\bgit\s+switch\b[^|;&]*(\s-[a-zA-Z]*[Cf][a-zA-Z]*\b|--force(-create)?\b|--discard-changes\b)/, // the lead creates plan branches itself; never force-switch
  /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\b(kubectl|helm|terraform|aws|gcloud|az)\s+\S*\s*(apply|delete|destroy|rm)\b/i,
];
// rm / Remove-Item: recursive delete whose target is a root-like path (/, ~, .., $HOME, a drive root, . or *).
const ROOTISH = /^(\/|~|\.\.(\/|\\|$)|\.$|\*|\$HOME\b|\$\{HOME\}|\$env:USERPROFILE\b|\$env:HOMEPATH\b|[A-Za-z]:[\\/]?$|\\\\)/;
function recursiveDeleteOfRoot(cmd) {
  for (const seg of cmd.split(/\|\||&&|[|;\n]/)) {
    const m = /(^|\s)(sudo\s+)?(rm|Remove-Item|ri|rmdir|rd|del|erase)\s+(.*)$/i.exec(seg.trim());
    if (!m) continue;
    const toks = m[4].split(/\s+/).map((t) => t.replace(/^["']|["']$/g, ""));
    const recursive = toks.some((t) => /^-[a-zA-Z]*[rR]/.test(t) || /^--recursive$/.test(t) || /^-rec/i.test(t));
    const targets = toks.filter((t) => !t.startsWith("-"));
    if (recursive && targets.some((t) => ROOTISH.test(t))) return true;
  }
  return false;
}
const SECRET_PATHS =
  /(^|[\\/])(\.env(\.(?!example$)[^/\\]*)?|[^/\\]*\.(pem|key|p12|pfx)|id_(rsa|ed25519)[^/\\]*)$/i;
// The same files read through the shell: only commands that print file contents are blocked (cp/mv/ls/source stay allowed).
const READERS = /^(cat|head|tail|less|more|bat|type|strings|xxd|od|base64|Get-Content|gc|Select-String|sls|grep|rg|awk|sed|cut)\b/i;
const SECRET_TOKEN = /(^|[\s"'=\/\\])(\.env(\.(?!example\b)[^\s\/\\"']*)?|[^\s\/\\"']*\.(pem|key|p12|pfx)|id_(rsa|ed25519)[^\s\/\\"']*)(?=$|[\s"';|&)])/i;
function readsSecret(cmd) {
  return cmd.split(/\|\||&&|[|;\n]/).some((seg) => READERS.test(seg.trim()) && SECRET_TOKEN.test(seg));
}

// team-verifier is CI: it may only run build/test/lint tools, never anything else. Deny-by-default,
// mirroring the opencode flavor's team-verifier permission block (same tool list).
const VERIFIER_ALLOWED_COMMANDS = [
  /^make\s/, /^npm\s/, /^pnpm\s/, /^yarn\s/, /^bun\s/, /^npx\s/,
  /^pytest\b/, /^uv\s+run\b/, /^poetry\s+run\b/,
  /^python\s+-m\s/, /^python3\s+-m\s/,
  /^ruff\b/, /^mypy\b/, /^pyright\b/,
  /^mvn\s/, /^gradle\b/, /^(\.[\\/])?gradlew(\.bat)?\b/,
  /^go\s/, /^cargo\s/, /^dotnet\s/,
  /^(head|tail|grep|wc)\b/,                                   // output trimming only
];
// Every segment of a pipeline / && / ; chain must be an allowed tool. A leading `cd <dir>` and VAR=value prefixes are fine.
function verifierAllowed(cmd) {
  return cmd.trim().split(/\|\||&&|[|;\n]/).every((seg) => {
    const s = seg.trim().replace(/^(\w+=\S*\s+)+/, "");
    if (!s || /^cd\s+\S+$/.test(s)) return true;
    return VERIFIER_ALLOWED_COMMANDS.some((re) => re.test(s));
  });
}

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch { process.exit(0); }
const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};

if (tool === "Bash" || tool === "PowerShell") {
  const cmd = String(ti.command ?? "");
  if (input.agent_type === "team-verifier" && !verifierAllowed(cmd)) {
    process.stderr.write(`[guardrail] blocked command (team-verifier only runs build/test/lint tools from CLAUDE.md's Commands section): ${cmd}\n`);
    process.exit(2);
  }
  if (BLOCKED_COMMANDS.some((re) => re.test(cmd)) || recursiveDeleteOfRoot(cmd)) {
    process.stderr.write(`[guardrail] blocked command: ${cmd}\n`);
    process.exit(2);
  }
  if (readsSecret(cmd)) {
    process.stderr.write(`[guardrail] blocked: command reads a secret file: ${cmd}\n`);
    process.exit(2);
  }
  // team-lead never commits: milestone commits (brief, plan, spec, kickoff/assess docs, hire output) and step commits alike go to
  // team-implementer, mirroring the opencode flavor's team-lead, which has no git commit permission. Global options before the
  // subcommand (`git -c k=v commit`, `git -C <dir> add`) are tolerated by the pattern; `rm` covers `git rm --cached` (staging too).
  if (input.agent_type === "team-lead" && /\bgit\b(\s+-[cC]\s*\S+|\s+--\S+)*\s+(add|rm|commit|stash)\b/.test(cmd)) {
    process.stderr.write(`[guardrail] blocked (team-lead never commits -- milestone and step commits go to team-implementer): ${cmd}\n`);
    process.exit(2);
  }
  // Push policy: feature-branch pushes allowed; force push and direct push to main/master blocked (merge via PR only).
  // team-lead never pushes anything at all (tags included) -- ship/integrate/release delegate pushes to
  // team-implementer or present the command for the CEO to run themselves, mirroring the opencode flavor's
  // team-lead, which has no git-push permission at all.
  if (/\bgit\s+push\b/.test(cmd)) {
    if (input.agent_type === "team-lead") {
      process.stderr.write(`[guardrail] blocked push (team-lead never pushes -- delegate to team-implementer, or present the command for the CEO to run): ${cmd}\n`);
      process.exit(2);
    }
    const force = /(--force\b|--force-with-lease\b|--force-if-includes\b|\s-[a-zA-Z]*f[a-zA-Z]*\b|\s\+\S)/.test(cmd);
    const toMain = /(\s|:)(refs\/heads\/)?(main|master)(\s|$)/.test(cmd);
    // Positional words after `git push`: [remote, refspec...]. No refspec, or a bare HEAD, pushes the current branch.
    const seg = cmd.slice(cmd.search(/\bgit\s+push\b/)).split(/\|\||&&|[|;\n]/)[0];
    const positional = seg.replace(/^git\s+push\s*/, "").split(/\s+/).filter((w) => w && !w.startsWith("-"));
    const refspecs = positional.slice(1);
    let onMain = false;
    if (refspecs.length === 0 || refspecs.includes("HEAD")) {
      try { onMain = /^(main|master)$/.test(execSync("git rev-parse --abbrev-ref HEAD", { cwd: input.cwd ?? process.cwd(), stdio: ["ignore", "pipe", "ignore"] }).toString().trim()); } catch {}
    }
    if (force || toMain || onMain) {
      process.stderr.write(`[guardrail] blocked push (force push and direct push to main are not allowed; merge via PR): ${cmd}\n`);
      process.exit(2);
    }
  }
}
if (["Edit", "Write", "MultiEdit", "Read"].includes(tool)) {
  const p = String(ti.file_path ?? "");
  // team-lead writes no code and no docs; its only editable file is the status board (mirrors opencode's `edit: docs/STATUS.md: allow`).
  if (tool !== "Read" && input.agent_type === "team-lead" && !/(^|[\\/])docs[\\/]STATUS\.md$/.test(p)) {
    process.stderr.write(`[guardrail] blocked edit (team-lead edits only docs/STATUS.md; code goes to team-implementer, docs to team-planner): ${p}\n`);
    process.exit(2);
  }
  if (SECRET_PATHS.test(p)) {
    process.stderr.write(`[guardrail] blocked secret path: ${p}\n`);
    process.exit(2);
  }
}
process.exit(0);
