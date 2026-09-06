// PreToolUse hook: blocks destructive commands and secret-file access at the tool level.
// exit 2 = block (the stderr message is shown to Claude). Tune the patterns to your stack.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BLOCKED_COMMANDS = [
  /\bgit\s+(reset\s+--hard\b|clean\s+-\w*f\w*|checkout\s+--\s+\.(\s|$)|branch\s+(-D\b|-f\b|--force\b))/,
  /\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(\/|~|\.\.)/i,
  /\bRemove-Item\b[^|;]*-Recurse/i,
  /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\b(kubectl|helm|terraform|aws|gcloud|az)\s+\S*\s*(apply|delete|destroy|rm)\b/i,
];
const SECRET_PATHS =
  /(^|[\\/])(\.env(\.(?!example$)[^/\\]*)?|[^/\\]*\.(pem|key|p12|pfx)|id_(rsa|ed25519)[^/\\]*)$/i;

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch { process.exit(0); }
const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};

if (tool === "Bash") {
  const cmd = String(ti.command ?? "");
  if (BLOCKED_COMMANDS.some((re) => re.test(cmd))) {
    process.stderr.write(`[guardrail] blocked command: ${cmd}\n`);
    process.exit(2);
  }
  // Push policy: feature-branch pushes allowed; force push and direct push to main/master blocked (merge via PR only)
  if (/\bgit\s+push\b/.test(cmd)) {
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
  if (SECRET_PATHS.test(p)) {
    process.stderr.write(`[guardrail] blocked secret path: ${p}\n`);
    process.exit(2);
  }
}
process.exit(0);
