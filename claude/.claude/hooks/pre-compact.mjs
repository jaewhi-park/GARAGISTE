// PreCompact hook: counts this session's compactions in .claude/session/compactions (git-ignored; SessionStart resets it
// to 0 at a real start and keeps it after a compaction). The lead reads the file before starting a plan and before each
// step: below 3 a compaction only re-injects the board and the lead continues; at 3 or more it finishes the step in
// progress, commits the board and ends the session — three summaries stacked degrade the work, and a fresh session
// resumes from the board. Prints nothing; a failure to write only loses the count.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch {}
const cwd = input.cwd ?? process.cwd();
const dir = join(cwd, ".claude/session"), file = join(dir, "compactions");
try {
  mkdirSync(dir, { recursive: true });
  let n = 0;
  try { n = parseInt(readFileSync(file, "utf8"), 10) || 0; } catch {}
  writeFileSync(file, `${n + 1}\n`);
} catch {}
process.exit(0);
