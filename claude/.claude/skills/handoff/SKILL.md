---
name: handoff
description: Wrap up a session that stops mid-flight — write the status board (docs/STATUS.md, local), commit WIP, list pending decisions. A finished /ship or /plan already leaves board and commits in place; use this when ending mid-step, after repeated compaction, or when the team spins
argument-hint: "[note]"
disable-model-invocation: true
---
Wrap up the session. Note: $ARGUMENTS

1. If a brainstorm, a spec round or a `수정:` revision discussion is open and answers not yet handed to team-planner are in context, checkpoint them first — one team-planner call with every fragment verbatim, in order (a brainstorm: the CEO's messages and your accepted proposals, quoted). Then update docs/STATUS.md yourself in the status-board format: plan and branch (or, while no plan exists yet, the brief or spec in progress: path and state), step progress and last verifier result, open review findings, the Counts line, decisions waiting on the CEO, next three actions — the first is the command this session ended by suggesting, or `/run <plan path>` for a step in progress (build continues after the last recorded PASS), or `/hotfix <its one line>` for a hotfix not yet shipped, or `/plan docs/specs/NNNN-<slug>.md` for a spec that has no plan yet (interrupted, draft or approved), or `/brainstorm` for a brief that is not yet approved, or `/plan <spec or plan path> 수정:` for a revision still in draft. The board is local and never committed.
2. Check uncommitted changes with git status/diff. If any, have team-implementer commit them by path: `wip(<scope>): <state>` when code is involved — even with failing tests, and describe the failure in the body; `docs(<scope>): <what>` when only docs-only files changed.
3. Report to the CEO: what this session finished / decisions waiting / the first action of the next session. Start no new work afterwards.
