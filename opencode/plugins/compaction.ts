import type { Plugin } from "@opencode-ai/plugin"

// Keeps the team's operating state in the summary when a long session is compacted. The summary is also the compaction
// signal for the lead's cut rule (the Claude Code flavor counts compactions in a file; opencode has no session-start hook).
export const TeamCompaction: Plugin = async () => ({
  "experimental.session.compacting": async (_input, output) => {
    output.context.push(`
## GARAGISTE state (must survive compaction)
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
- A compaction has now happened in this session — this summary is the evidence. The lead's compaction rule applies: finish the step in progress (never leave one half-verified), commit the board, report what is committed and end the turn telling the CEO to start a new session; do not start another step or plan on top of a summary
`)
  },
})
