---
description: Integrate finished branches into main one at a time — per-branch 4-lens review → merge → conflicts resolved by the implementer → verifier PASS → next (merge queue)
agent: team-lead
---
Integrate branches: $ARGUMENTS (opencode has no way to mark a spawned branch "done" from this session — if empty, list the "Parallel in progress" section of docs/STATUS.md and ask the CEO which branches are ready)

0. Confirm the current branch is main (or the agreed integration branch). If you are on a plan/* branch, stop and ask the CEO.

For each branch, strictly one at a time:
1. Review `git diff <current>...<branch>` with team-reviewer across 4 lenses. If there are blockers/majors, have team-implementer fix and commit inside that branch's worktree (`cd <worktree path> && ...`).
2. `git merge --no-ff <branch>`. On conflict, hand team-implementer the conflicting files and both sides' intent (each plan file, and the shared spec if the plans reference one) to resolve and commit; then review the resolution diff once more with the correctness lens.
3. Quick verification with team-verifier. On FAIL, implementer fix loop (max 3); past that, `git revert -m 1 HEAD` to undo the merge and report to the CEO.
4. On PASS, clean up with `git worktree remove <path>` and `git branch -d <branch>`, update STATUS.md, and take the next branch.

When all are done, run full verification with team-verifier and suggest `/ship` to the CEO in a sentence.
