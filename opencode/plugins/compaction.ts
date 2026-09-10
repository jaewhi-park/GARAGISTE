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
- On resume, re-read AGENTS.md, docs/CHARTER.md, docs/STATUS.md and the current plan or spec file
`)
  },
})
