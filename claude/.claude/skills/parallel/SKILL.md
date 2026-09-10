---
name: parallel
description: Run several approved, independent plans concurrently — one team-builder per plan in its own isolated worktree. Integrate afterwards with /integrate
argument-hint: "[plan file paths, space-separated]"
disable-model-invocation: true
---
Implement plans in parallel: $ARGUMENTS

0. Confirm the current branch is main; if not, stop and ask the CEO (builders branch from the session HEAD, so starting on main keeps /integrate simple). Preconditions: each plan is approved and their "files touched" sets do not overlap. If a pair overlaps, run those two sequentially (/build) or ask the CEO.
1. Launch one team-builder subagent per plan, all in the same turn. Tell each its plan file path and "implement this whole plan".
2. Start no new work while waiting. As each completion report arrives, record branch · worktree path · result under an "Awaiting integration" list in docs/STATUS.md yourself.
3. When all are done, do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/integrate`". Leave failed builders' branches out of the integration list and report them to the CEO.
