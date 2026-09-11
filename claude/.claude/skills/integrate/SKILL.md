---
name: integrate
description: Integrate finished branches one at a time into an integration branch cut from main — per-branch 4-lens review → merge → conflicts resolved by the implementer → verifier PASS → next (merge queue); /ship then ships that branch
argument-hint: "[branches, or empty for the STATUS.md queue]"
disable-model-invocation: true
---
Integrate branches: $ARGUMENTS (if empty, the completed entries of the "Awaiting integration" list in docs/STATUS.md, in order)

0. Branch: apply the branches-and-sync rule (on main, synced) and create the integration branch — `git switch -c integrate/<YYYY-MM-DD>` (suffix `-2`, `-3`… when it exists) — or stay on the integrate/* branch you are already on (a resumed integration). On a plan/* branch, or not synced, stop and ask the CEO. Record it in docs/STATUS.md (`Plan: integration of <n> plans · Branch: integrate/<date> · Shipped: —`). Main never receives the merges directly: /ship opens the integration's PR or merges it locally, and the guardrail keeps blocking pushes to main.

For each branch, strictly one at a time:
1. Review `git diff <current>...<branch>` with team-reviewer across 4 lenses. If there are blockers/majors, have team-implementer fix and commit inside that branch's worktree (`cd <worktree path> && ...`).
2. `git merge --no-ff <branch>`. On conflict, hand team-implementer the conflicting files and both sides' intent (each plan file, and the shared spec if the plans reference one) to resolve and commit; then review the resolution diff once more with the correctness lens.
3. Quick verification with team-verifier. On FAIL, implementer fix loop (max 3); past that, `git revert -m 1 HEAD` to undo the merge and report to the CEO.
4. On PASS, clean up with `git worktree remove <path>` and `git branch -d <branch>`, update STATUS.md yourself, and take the next branch.

When all are done, run full verification with team-verifier, record `Last verifier: PASS full @<hash>` in docs/STATUS.md so /ship reuses it, and do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/ship`" (it ships the integration branch as one PR or one local merge, with one METRICS line per integrated plan).
