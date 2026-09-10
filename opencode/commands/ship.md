---
description: Ship — full verification, docs, risk label, automatic merge-policy resolution (local / manual / auto-low-risk), then PR creation or local merge
agent: team-lead
---
Ship. Target: $ARGUMENTS

1. If docs/STATUS.md records `Last verifier: PASS full @<hash>` and `<hash>` equals `git log -1 --format=%H` — or every commit since it touches only docs-only files (`git diff --stat <hash>..HEAD`) — reuse that verdict as the evidence. Otherwise run full verification with team-verifier (all commands in AGENTS.md; include the parity harness for legacy) and record the hash. On FAIL, go back to the /build loop.
2. **Resolve the merge policy automatically.** If AGENTS.md "## Merge policy" has an explicit value, use it (override; with no remote an `auto-low-risk` override still resolves to **local**, only without the approval question for `risk:low`); otherwise derive it from repository state:
   - `git remote` is empty → **local**
   - a remote exists, `gh repo view --json autoMergeAllowed -q .autoMergeAllowed` is true, and the default branch has a protection rule with required status checks (check `gh api repos/{owner}/{repo}/branches/<default>/protection` or `gh api repos/{owner}/{repo}/rules/branches/<default>`) → **auto-low-risk**
   - anything else (remote without protection/auto-merge, or no `gh`) → **manual**
   Report the verdict and its reason in one line, e.g. "manual — remote exists, no branch protection. Enabling protection + auto-merge on main would switch to auto-low-risk".
3. Write the PR description: summary / verification evidence (commands and results) / review findings and how they were handled / risks and rollback / decisions needed from the CEO. Set the risk label: `risk:high` if any escalation criterion was touched (schema, public interface, security, dependencies, migrations), otherwise `risk:low`.
4. One team-planner call (pass it the counts below and, when the verdict is local, the PR description): append the docs/METRICS.md line — date / slug (`<plan-slug> (spec NNNN)` when spec-backed) / logic diff lines / verifier failures / review blockers / CEO questions (the intake call, spec rounds and the merge-approval gate are expected and not counted) / plan-approval→ship duration (/retro reads this file); update ADRs, docs/DECISIONS.md and, if the plan references a spec, its Status line (`done` when every Done-when item is covered by a shipped plan — shipped plans are the `(spec NNNN)` lines in docs/METRICS.md, including the line just appended; otherwise keep `in progress — plans: …` and append `remaining: <uncovered Done-when items>`); when the verdict is local, also save the PR description as docs/prs/NNNN-<slug>.md. The planner does not commit.
5. One team-implementer call (pass it the PR description, the risk label and the verdict): update CHANGELOG and user docs, commit them together with the planner's uncommitted docs changes (`docs(<slug>): ship`), tidy commits, then per verdict:
   - **manual**: `git push -u origin <branch>` and `gh pr create --title "<summary>" --body "<PR description>" --label risk:<value>` (without `gh`, push only and report body and command). Report the PR link; do not merge.
   - **auto-low-risk**: the same, plus `gh pr merge --auto --squash` when `risk:low` (GitHub merges once required checks pass); for `risk:high`, report the link only.
   - **local**: nothing more.
   Never push to main directly.
6. **local** only: ask the CEO for merge approval with the evidence summary (skip the question only when the Merge-policy override says auto-low-risk and the label is `risk:low`); on approval run `git switch main && git merge --no-ff plan/<slug>` then `git branch -d plan/<slug>` yourself.
7. **manual** and **auto-low-risk**: `git switch main` yourself (in a linked worktree stay on the worktree branch; the plan branch keeps its PR; the next command's sync pulls the merge in) and tell the CEO in one line to merge before the next /plan.
8. Update docs/STATUS.md yourself: keep the Plan line with its Branch and set Shipped: PR <link> (manual, auto-low-risk; `PR pending — <branch> pushed` when the CEO opens the PR themselves) or merge <hash> (local); Step: none; Next actions: 1. merge the PR (manual, or auto-low-risk with risk:high) or wait for auto-merge (auto-low-risk, risk:low) — omitted for local, 2. `/plan <next BACKLOG item>`.
