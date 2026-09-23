---
name: handoff
description: Wrap up a session that stops mid-flight — write and commit the board (docs/STATUS.md and docs/STATUS-team.md), commit WIP, list pending decisions. A finished /ship or /plan already leaves board and commits in place; use this when ending mid-step, after repeated compaction, or when the team spins
argument-hint: "[note]"
---
Wrap up the session. Note: $ARGUMENTS

1. If a brainstorm or a `수정:` revision discussion is open and answers not yet handed to team-planner are in context, checkpoint them first — one team-planner call with every fragment verbatim, in order (a brainstorm: the CEO's messages and your accepted proposals, quoted). Then update the board (both files) yourself in the Board format: `Mode: paused — stopped by CEO` (kept `running` when this is the compaction stop), plan and branch (or, while no plan exists yet, the brief in progress or the spec section under revision: its state), step progress and last verifier result, open review findings, the Counts line, decisions waiting on the CEO, next three actions — the first is the command this session ended by suggesting, or `/run <plan path>` for a step in progress (build continues after the last recorded PASS), or `/hotfix <its one line>` for a hotfix not yet shipped, or `/brainstorm` for a brief that is not yet approved, or `/plan <F<n> or plan path> 수정:` for a revision still open. Commit the board by path as `docs(handoff): <state>` on the current branch (in a linked worktree the board is the main checkout's: skip it and report only).
2. Check uncommitted changes with git status/diff. If any: when only docs-only files changed, commit them yourself by path as `docs(<scope>): <what>`; when code is involved, have team-implementer commit them by path as `wip(<scope>): <state>` — even with failing tests, and describe the failure in the body.
3. Report to the CEO: what this session finished / decisions waiting / the first action of the next session. Start no new work afterwards.
