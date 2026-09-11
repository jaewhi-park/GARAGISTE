---
name: parallel
description: Run several approved, independent plans concurrently — one team-builder per plan in its own isolated worktree. Integrate afterwards with /integrate
argument-hint: "[plan file paths, space-separated]"
disable-model-invocation: true
---
Implement plans in parallel: $ARGUMENTS

0. Apply the branches-and-sync rule (on main, synced); if not on main, or in a linked worktree, stop and ask the CEO (builders branch from the session HEAD, so starting on main keeps /integrate simple). Preconditions: each plan is approved and committed on main (`git status --porcelain <path>` prints nothing — `??` means untracked, ` M`/`A ` uncommitted; an uncommitted plan is committed first by team-implementer as `docs(plan): NNNN-<slug>`, because worktrees are cut from HEAD and would not see it), and their "files touched" sets do not overlap. If a pair overlaps, run those two sequentially (/build) or ask the CEO.
1. Rewrite the board's Now block yourself first — `Plan: parallel — <n> plans · Branch: main · Shipped: —`, `Step: none`, Next actions: 1. `/integrate` — so a resumed session never re-runs a plan a builder is building. Then launch one team-builder subagent per plan, all in the same turn. Tell each its plan file path and "implement this whole plan".
2. Start no new work while waiting. As each completion report arrives, record plan path · branch · worktree path · result under the "Awaiting integration" list in docs/STATUS.md yourself (the entries stay until /ship clears them).
3. When all are done, do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/integrate`". Leave failed builders' branches out of the integration list and report them to the CEO.
