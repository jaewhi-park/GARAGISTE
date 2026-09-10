import type { Plugin } from "@opencode-ai/plugin"

// Keeps the team's operating state in the summary when a long session is compacted.
export const TeamCompaction: Plugin = async () => ({
  "experimental.session.compacting": async (_input, output) => {
    output.context.push(`
## GARAGISTE state (must survive compaction)
- Current plan file path, step number in progress, state of each step (pending/implementing/verifying/done)
- Spec in progress, if any: docs/specs/NNNN-<slug>.md, current round (1 structure / 2 detail / correction k / awaiting approval), slots still open; intake answers not yet written to a file — quote them verbatim
- Last team-verifier result (PASS/FAIL) and failing items
- Open review findings (blocker/major) and their lens
- Decisions waiting on the CEO and the default if unanswered
- On resume, re-read the current plan or spec file (AGENTS.md, docs/CHARTER.md and, when it exists, docs/STATUS.md are already injected)
- docs/STATUS.md is local (git-ignored) and never committed; milestone commits made this session (plan, spec, docs) and what is still uncommitted
`)
  },
})
