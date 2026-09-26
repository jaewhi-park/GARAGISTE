// PreToolUse (matcher: Agent) and SubagentStop hook: one line per subagent start and end in .claude/session/spawns.jsonl
// (git-ignored) — the spawn count and durations the next retro reads and /ship copies into docs/METRICS.md. Written only inside
// a project (a .claude/ folder at cwd); the prompt is never logged; a failure to write changes nothing. Prints nothing, exit 0.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const GARAGISTE_VERSION = "2026-09-26";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch {}
const cwd = input.cwd ?? process.cwd();
const ts = new Date().toISOString();
const line = String(input.hook_event_name ?? "") === "SubagentStop"
  ? { ts, event: "stop", agent: input.agent_type ?? null, id: input.agent_id ?? null, session: input.session_id ?? null }
  : { ts, event: "start", agent: input.tool_input?.subagent_type ?? null, task: String(input.tool_input?.description ?? "").slice(0, 80), session: input.session_id ?? null };
try {
  const dir = join(cwd, ".claude");
  if (existsSync(dir)) { mkdirSync(join(dir, "session"), { recursive: true }); appendFileSync(join(dir, "session", "spawns.jsonl"), JSON.stringify(line) + "\n"); }
} catch {}
process.exit(0);
