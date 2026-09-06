---
description: Parallel development — create a worktree and branch per approved plan and print the command to open a new session there. Integrate with /integrate
agent: team-lead
---
Prepare plans to run in parallel in separate worktrees: $ARGUMENTS (plan file paths, space-separated)

0. Confirm the current branch is main. If not, stop and ask the CEO (worktrees must branch from main so /integrate stays simple).

For each plan:
1. Check that the plan's "files touched" set does not overlap with other plans in progress. If it does, do not create the worktree; report to the CEO.
2. `git worktree add ../<repo>-<slug> -b plan/<slug>` (repo = current directory name). If untracked files such as .env are needed, tell the CEO which to copy.
3. Record slug · branch · path under a "Parallel in progress" list in docs/STATUS.md.
4. Give the CEO the command to run in a new terminal: `cd ../<repo>-<slug> && opencode`, then `/build <plan path>` in that session.

A session inside a worktree is independent of this one. Finished branches are integrated here with /integrate.
Precondition: .opencode/ and opencode.json must be committed so worktree sessions also have the team (or install with --global).
