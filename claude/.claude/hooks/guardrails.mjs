// PreToolUse hook: blocks destructive commands and secret-file access at the tool level.
// exit 2 = block (the stderr message is shown to Claude). Tune the patterns to your stack.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BLOCKED_COMMANDS = [
  /\bgit\s+(reset\s+--hard\b|clean\s+-\w*f\w*|checkout\s+--\s+\.(\s|$)|branch\s+(-D\b|-f\b|--force\b))/,
  /\bgit\s+switch\b[^|;&]*(\s-[Cf]\b|--force(-create)?\b|--discard-changes\b)/,   // the lead creates plan branches itself; never force-switch
  /\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(\/|~|\.\.)/i,
  /\bRemove-Item\b[^|;]*-Recurse/i,
  /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\b(kubectl|helm|terraform|aws|gcloud|az)\s+\S*\s*(apply|delete|destroy|rm)\b/i,
];
const SECRET_PATHS =
  /(^|[\\/])(\.env(\.(?!example$)[^/\\]*)?|[^/\\]*\.(pem|key|p12|pfx)|id_(rsa|ed25519)[^/\\]*)$/i;

// team-verifier is CI: it may only run build/test/lint tools, never anything else. Deny-by-default,
// mirroring the opencode flavor's team-verifier permission block exactly (same tool list).
const VERIFIER_ALLOWED_COMMANDS = [
  /^make\s/, /^npm\s/, /^pnpm\s/, /^yarn\s/, /^bun\s/, /^npx\s/,
  /^pytest\b/, /^uv\s+run\b/, /^poetry\s+run\b/,
  /^python\s+-m\s/, /^python3\s+-m\s/,
  /^ruff\b/, /^mypy\b/, /^pyright\b/,
  /^mvn\s/, /^gradle\b/, /gradlew/,
  /^go\s/, /^cargo\s/, /^dotnet\s/,
];

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch { process.exit(0); }
const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};

if (tool === "Bash") {
  const cmd = String(ti.command ?? "");
  if (input.agent_type === "team-verifier" && !VERIFIER_ALLOWED_COMMANDS.some((re) => re.test(cmd.trim()))) {
    process.stderr.write(`[guardrail] blocked command (team-verifier only runs build/test/lint tools from CLAUDE.md's Commands section): ${cmd}\n`);
    process.exit(2);
  }
  if (BLOCKED_COMMANDS.some((re) => re.test(cmd))) {
    process.stderr.write(`[guardrail] blocked command: ${cmd}\n`);
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
    const force = /(--force\b|--force-with-lease\b|\s-f\b|\s\+\S)/.test(cmd);
    const toMain = /(\s|:)(main|master)(\s|$)/.test(cmd);
    let onMain = false;
    if (!/\bgit\s+push\b[^|;&]*\s\S+\s+\S+/.test(cmd)) {          // no explicit refspec → check the current branch
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
