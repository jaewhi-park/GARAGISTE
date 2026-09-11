---
name: integrate
description: Integrate finished branches one at a time into an integration branch cut from main — per-branch 4-lens review → merge → conflicts resolved by the implementer → verifier PASS → next (merge queue); /ship then ships that branch
argument-hint: "[branches, or empty for the STATUS.md queue]"
disable-model-invocation: true
---
Integrate branches: $ARGUMENTS (if empty, the completed entries of the "Awaiting integration" list in docs/STATUS.md, in order)

0. Branch: apply the branches-and-sync rule (on main, synced) and create the integration branch — `git switch -c integrate/<YYYY-MM-DD>` (suffix `-2`, `-3`… when it exists) — or stay on the integrate/* branch you are already on (a resumed integration). On a plan/* branch, or not synced, stop and ask the CEO. Record it in docs/STATUS.md (`Plan: integration of <n> plans · Branch: integrate/<date> · Shipped: —`, `Step: none`). Main never receives the merges directly: /ship opens the integration's PR or merges it locally, and the guardrail keeps blocking pushes to main.

For each branch, strictly one at a time:
1. Review `git diff <current>...<branch>` with team-reviewer across 4 lenses. If there are blockers/majors, have team-implementer fix and commit inside that branch's worktree (`cd <worktree path> && ...`), then re-review only the fix diff with the lenses that objected (max 3 rounds, as in /review); past that, leave the branch out of the integration and report it to the CEO.
2. `git merge --no-ff <branch>`. On conflict, hand team-implementer the conflicting files and both sides' intent (each plan file, and the shared spec if the plans reference one) to resolve and commit; then review the resolution diff once more with the correctness lens (on REQUEST_CHANGES, the same fix loop, max 3).
3. Note the merge commit's hash M (`git log -1 --format=%H` right after the merge). Quick verification with team-verifier. On FAIL, implementer fix loop (max 3); past that, undo the merge and its fixes — `git revert --no-edit M..HEAD` when fix commits exist, then `git revert --no-edit -m 1 M` — and report to the CEO.
4. On PASS, remove the worktree (`git worktree remove --force <path>`; the branch itself stays until /ship — a rejected integration must be able to retry it), mark the branch's entry on the board `merged @M` yourself (keep the entry; /ship reads it), and take the next branch.

When all are done, run full verification with team-verifier, record `Last verifier: PASS full @<hash>` in docs/STATUS.md so /ship reuses it, and do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/ship`" (it ships the integration branch as one PR or one local merge, with one METRICS line per integrated plan).
