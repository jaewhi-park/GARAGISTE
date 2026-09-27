// PreToolUse (matcher: Agent) and SubagentStop hook: one line per subagent start and end in .claude/session/spawns.jsonl
// (git-ignored) — the spawn count (the `start` lines: one per Agent call) and durations the next retro reads and /ship copies
// into docs/METRICS.md. A SubagentStop event that names no agent type, or names the session's main agent (settings.json
// `agent`), is not a subagent's end — one test project logged 1,024 such stops next to 100 real spawns — so it writes
// nothing. Written only inside a project (a .claude/ folder at cwd); the prompt is never logged; a failure to write changes
// nothing. Prints nothing, exit 0.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const GARAGISTE_VERSION = "2026-09-26";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch {}
const cwd = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();   // the project root: Claude Code sets CLAUDE_PROJECT_DIR; the event's cwd can be elsewhere after a cd
const ts = new Date().toISOString();
const dir = join(cwd, ".claude");
function mainAgent() { try { return String(JSON.parse(readFileSync(join(dir, "settings.json"), "utf8")).agent ?? ""); } catch { return ""; } }
let line = null;
if (String(input.hook_event_name ?? "") === "SubagentStop") {
  const agent = String(input.agent_type ?? "");
  if (agent && agent !== mainAgent()) line = { ts, event: "stop", agent, id: input.agent_id ?? null, session: input.session_id ?? null };
} else {
  line = { ts, event: "start", agent: input.tool_input?.subagent_type ?? null, task: String(input.tool_input?.description ?? "").slice(0, 80), session: input.session_id ?? null };
}
try {
  if (line && existsSync(dir)) { mkdirSync(join(dir, "session"), { recursive: true }); appendFileSync(join(dir, "session", "spawns.jsonl"), JSON.stringify(line) + "\n"); }
} catch {}
process.exit(0);
