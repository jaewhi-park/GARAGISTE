---
description: Parallel development — create a worktree and branch per approved plan and print the command to open a new session there. Integrate with /integrate
agent: team-lead
---
Prepare plans to run in parallel in separate worktrees: $ARGUMENTS (plan file paths, space-separated)

0. Apply the branches-and-sync rule (on main, synced); if not on main, or in a linked worktree, stop and ask the CEO (worktrees must branch from main so /integrate stays simple). Precondition: each plan is approved and committed on main (`git status --porcelain <path>` prints nothing — `??` means untracked, ` M`/`A ` uncommitted; an uncommitted plan is committed first by team-implementer as `docs(plan): NNNN-<slug>`, because worktrees are cut from HEAD and would not see it).

For each plan:
1. Check that the plan's "files touched" set does not overlap with other plans in progress. If it does, do not create the worktree; report to the CEO.
2. `git worktree add ../<repo>-<slug> -b plan/<slug>` (repo = current directory name). If untracked files such as .env are needed, tell the CEO which to copy.
3. Record plan path · slug · branch · path under the "Parallel in progress" list in docs/STATUS.md, and set the Now block to `Plan: parallel — <n> plans · Branch: main · Shipped: —`, `Step: none`, Next actions: 1. `/integrate` (after the worktree sessions finish) — so a resumed session never re-runs a plan a worktree session is building.
4. Give the CEO the command to run in a new terminal: `cd ../<repo>-<slug> && opencode`, then `/build <plan path>` in that session (it stays on plan/<slug>; the worktree has no board).

A session inside a worktree is independent of this one. Finished branches are integrated here with /integrate.
Precondition: .opencode/ and opencode.json must be committed so worktree sessions also have the team (or install with --global).
