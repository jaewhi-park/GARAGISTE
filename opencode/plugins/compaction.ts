import type { Plugin } from "@opencode-ai/plugin"

// Keeps the team's operating state in the summary when a long session is compacted, and numbers the compactions of a
// session: the summary is the compaction signal for the lead's cut rule — below the third the lead continues from the
// board, at the third it stops (the Claude Code flavor counts compactions in a file; opencode has no session-start hook).
const counts = new Map<string, number>()
export const TeamCompaction: Plugin = async () => ({
  "experimental.session.compacting": async (input, output) => {
    const id = String((input as { sessionID?: string }).sessionID ?? "session")
    const n = (counts.get(id) ?? 0) + 1
    counts.set(id, n)
    output.context.push(`
## GARAGISTE state (must survive compaction) — compaction #${n} of this session
- Current plan file path (or the board's `hotfix — <one line>` and its branch), step number in progress, state of each step (pending/implementing/verifying/done)
- Spec-section revision in progress, if any: F<n>, its draft rev, discussion fragments not yet handed to the planner — quote them verbatim
- Brief in progress, if any: docs/BRIEF.md and its state (brainstorm or revision checkpoint k / draft / correction k / awaiting approval); brainstorm fragments not yet checkpointed to the planner — quote them verbatim
- Revision in progress, if any (/plan 수정: path): the spec or plan file, its draft rev, discussion fragments not yet handed to the planner — quote them verbatim
- Last team-verifier result (PASS/FAIL) and failing items
- Open review findings (blocker/major) and their lens
- The board's Counts line (verifier FAIL / review blockers / CEO questions / corrections) — carry the numbers verbatim
- Decisions waiting on the CEO and the default if unanswered
- On resume, re-read the current plan file; for a spec or brief in progress have team-planner report its open slots (the lead never reads them). AGENTS.md, docs/CHARTER.md and, when it exists, docs/STATUS.md are already injected
- docs/STATUS.md is committed at the cut points and changes uncommitted between them; milestone commits made this session (plan, spec, docs) and what is still uncommitted
- This is compaction #${n} of this session. ${n < 3 ? "Below the third the lead continues: reconcile the board with git (the resume procedure) and carry on with the step in progress; do not wait for the CEO." : "At the third or later the lead's compaction cut applies: finish the step in progress (never leave one half-verified), commit the board, report what is committed and end the turn telling the CEO to start a new session; do not start another step or plan on top of this summary."}
`)
  },
})
