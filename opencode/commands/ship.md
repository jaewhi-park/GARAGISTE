---
description: Ship — full verification, docs, risk label, automatic merge-policy resolution (local / manual / auto-low-risk), then PR creation or local merge
agent: team-lead
---
Ship. Target: $ARGUMENTS

1. Run full verification with team-verifier (all commands in AGENTS.md; include the parity harness for legacy). On FAIL, go back to the /build loop.
2. Have team-implementer update CHANGELOG and user docs and tidy commits; have team-planner update ADRs, docs/DECISIONS.md and, if the plan references a spec, its Status line (done when every Done-when item is covered by a shipped plan; otherwise list what remains).
3. Write the PR description: summary / verification evidence (commands and results) / review findings and how they were handled / risks and rollback / decisions needed from the CEO.
4. Set the risk label: `risk:high` if any escalation criterion was touched (schema, public interface, security, dependencies, migrations), otherwise `risk:low`.
5. **Resolve the merge policy automatically.** If AGENTS.md "## Merge policy" has an explicit value, use it (override); otherwise derive it from repository state:
   - `git remote` is empty → **local**
   - a remote exists, `gh repo view --json autoMergeAllowed -q .autoMergeAllowed` is true, and the default branch has a protection rule with required status checks (check `gh api repos/{owner}/{repo}/branches/<default>/protection` or `gh api repos/{owner}/{repo}/rules/branches/<default>`) → **auto-low-risk**
   - anything else (remote without protection/auto-merge, or no `gh`) → **manual**
   Report the verdict and its reason in one line, e.g. "manual — remote exists, no branch protection. Enabling protection + auto-merge on main would switch to auto-low-risk".
6. Execute per verdict:
   - **local**: have team-planner save the PR description as docs/prs/NNNN-<slug>.md. Ask the CEO for merge approval with the evidence summary (skip the question if the override is auto-low-risk and the label is `risk:low`); on approval run `git switch main && git merge --no-ff plan/<slug>` then `git branch -d plan/<slug>`.
   - **manual**: have team-implementer run `git push -u origin <branch>` and `gh pr create --title "<summary>" --body "<PR description>" --label risk:<value>` (without `gh`, push only and report body and command). Report the PR link; do not merge.
   - **auto-low-risk**: push and create the PR as above; if `risk:low`, run `gh pr merge --auto --squash` (GitHub merges once required checks pass); if `risk:high`, report the link only.
   Never push to main directly.
7. Update docs/STATUS.md and have team-planner append one line to docs/METRICS.md: date / slug (`<plan-slug> (spec NNNN)` when spec-backed) / logic diff lines / verifier failures / review blockers / CEO questions (the intake call and spec rounds are expected and not counted) / plan-approval→ship duration. (/retro reads this file)
