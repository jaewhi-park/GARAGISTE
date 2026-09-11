// SessionStart hook: stdout is injected into the session context. Loads the charter and the status board every session and
// says where to start: a board -> /resume; only a charter -> /plan or /backlog (never /resume); neither -> /brainstorm, or
// /kickoff | /assess when docs/BRIEF.md is already approved (the brief itself is never injected).
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
  // No charter and no board: the product brief decides the first command. Only its Status and Kind lines are read.
  const briefPath = join(cwd, "docs/BRIEF.md");
  if (!existsSync(briefPath)) {
    process.stdout.write("GARAGISTE: no product brief yet (docs/BRIEF.md). Start with /brainstorm <idea, or the path of a document you wrote>.\n");
  } else {
    const head = readFileSync(briefPath, "utf8").split("\n").slice(0, 20);
    const status = (head.find((l) => /^Status:/.test(l)) ?? "Status: ?").replace(/^Status:\s*/, "").trim();
    const kind = (head.find((l) => /^Kind:/.test(l)) ?? "Kind: ?").replace(/^Kind:\s*/, "").trim();
    if (/\(rev \d+ draft\)/.test(status)) {
      process.stdout.write(`GARAGISTE: docs/BRIEF.md has a revision in progress (${status}). Start with /brainstorm to finish it.\n`);
    } else if (/^(approved|revised)/.test(status)) {
      const next = /^레거시|^legacy/i.test(kind) ? `/assess ${(kind.match(/\((.+)\)/) ?? [])[1] ?? "<path>"}` : "/kickoff";
      process.stdout.write(`GARAGISTE: docs/BRIEF.md is ${status} (Kind: ${kind}) and docs/CHARTER.md is missing. Start with ${next}.\n`);
    } else {
      process.stdout.write(`GARAGISTE: docs/BRIEF.md is still ${status || "unfinished"}. Start with /brainstorm to continue it.\n`);
    }
  }
}
