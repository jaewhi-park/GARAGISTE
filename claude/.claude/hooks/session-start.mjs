// SessionStart hook: stdout is injected into the session context. Loads the charter and the status board every session and
// says where to start: a board -> /resume; only a charter -> /plan or /backlog (never /resume); neither -> /kickoff or /assess.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch {}
const cwd = input.cwd ?? process.cwd();

const hasCharter = existsSync(join(cwd, "docs/CHARTER.md"));
const hasStatus = existsSync(join(cwd, "docs/STATUS.md"));
const parts = [];
for (const f of ["docs/CHARTER.md", "docs/STATUS.md"]) {
  const p = join(cwd, f);
  if (existsSync(p)) {
    const lines = readFileSync(p, "utf8").trim().split("\n");
    const body = lines.length > 120 ? lines.slice(0, 120).join("\n") + `\n… (${lines.length - 120} lines omitted — read the file if needed)` : lines.join("\n");
    parts.push(`## ${f}\n${body}`);
  }
}
if (hasCharter || hasStatus) {
  // docs/STATUS.md is local and never committed: a fresh clone or a new worktree has a charter but no board.
  const tail = hasStatus
    ? "Start with /resume."
    : "No status board (fresh clone, new worktree, or nothing in progress): start with /plan <backlog item> or /backlog. /resume is not needed.";
  process.stdout.write(`# GARAGISTE context (SessionStart auto-injection)\n${parts.join("\n\n")}\n\n${tail}\n`);
} else {
  process.stdout.write("GARAGISTE: docs/CHARTER.md is missing. Start with /kickoff for a new project or /assess for a legacy codebase.\n");
}
