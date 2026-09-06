// SessionStart hook: stdout is injected into the session context. Loads the charter and the status board every session.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch {}
const cwd = input.cwd ?? process.cwd();

const parts = [];
for (const f of ["docs/CHARTER.md", "docs/STATUS.md"]) {
  const p = join(cwd, f);
  if (existsSync(p)) {
    const lines = readFileSync(p, "utf8").trim().split("\n");
    const body = lines.length > 120 ? lines.slice(0, 120).join("\n") + `\n… (${lines.length - 120} lines omitted — read the file if needed)` : lines.join("\n");
    parts.push(`## ${f}\n${body}`);
  }
}
if (parts.length) {
  process.stdout.write(`# GARAGISTE context (SessionStart auto-injection)\n${parts.join("\n\n")}\n\nIf there is work in progress, start with /resume.\n`);
} else {
  process.stdout.write("GARAGISTE: docs/CHARTER.md is missing. Start with /kickoff for a new project or /assess for a legacy codebase.\n");
}
