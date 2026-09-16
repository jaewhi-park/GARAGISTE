// SessionStart hook: stdout is injected into the session context. Loads the charter and the status board every session,
// resets the session's compaction counter (.claude/session/compactions — the PreCompact hook increments it, the lead's
// compaction rule reads it) and says where to start: a board -> the lead reconciles it first (the resume procedure; the CEO
// types nothing); a linked worktree -> the board belongs to the main checkout; only a charter -> /plan or /backlog; neither
// -> /brainstorm, or /kickoff | /assess when docs/BRIEF.md is already approved (the brief itself is never injected).
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch {}
const cwd = input.cwd ?? process.cwd();

// Compaction counter: a new session starts at 0. Best effort — a read-only checkout only loses the counter.
try { mkdirSync(join(cwd, ".claude/session"), { recursive: true }); writeFileSync(join(cwd, ".claude/session/compactions"), "0\n"); } catch {}

// A linked worktree (`claude --worktree`, a /parallel checkout) has a `.git` file, not a directory.
let linked = false;
try { linked = statSync(join(cwd, ".git")).isFile(); } catch {}

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
  let tail;
  if (hasStatus && linked) {
    // The board is committed, so a linked worktree carries the main checkout's copy: it describes that checkout, not this branch.
    tail = "This is a linked worktree: the board above belongs to the main checkout. Do not edit or commit docs/STATUS.md here — this branch's commits are its record. Start with /plan or `/run <plan>` on this branch; integration happens from the main checkout.";
  } else if (hasStatus) {
    // The board is a pointer and may be stale (a session that died mid-turn, a PR merged since): the repository is the truth.
    tail = "Reconcile first: run the `resume` procedure (the Skill tool) before answering the CEO — compare the board with git, worktrees and PR state, trust the repository, then continue from the board's next action. The CEO does not type /resume.";
  } else {
    tail = "No status board (a project from before the board was committed, or nothing in progress): start with /plan <backlog item> or /backlog.";
  }
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
