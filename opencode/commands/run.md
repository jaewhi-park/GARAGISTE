---
description: Default path — take an approved plan through build → review → ship. Stops only at escalation, fix-loop overflow and merge approval
agent: team-lead
---
Take the approved plan all the way: $ARGUMENTS (plan file path)

Stop only at three places: an escalation question, a fix loop exceeding 3 rounds, and merge approval (when the policy resolves to local/manual). Otherwise proceed without asking the CEO, and report once at the end in the final report format.

1. Branch: read the plan file; if the current branch is main/master, run `git switch -c plan/<slug>` yourself (`git switch plan/<slug>` if it already exists). If docs/STATUS.md already names this plan with PASSed steps, continue from the step after the last PASS.
2. Implement (= /build): per step, in order, assign it to team-implementer with plan path, step number and the step's lines, then quick verification with team-verifier (skipped only when the operating profile says `per-step verifier: off`, the implementer's report shows every quick command at exit 0 and the step touches no escalation criterion). On FAIL, pass the report verbatim for a fix (max 3). On PASS, update the status board and continue. After the last step, full verification once more and record `PASS full @<hash>` in STATUS.
3. Review (= /review): 2 lenses (correctness, security), or 4 for risk:high / over 600 logic lines / hot paths, in parallel → collect blocker/major → implementer fixes → verifier (max 3) → re-review only the fix diff with the lenses that objected → all APPROVE.
4. Ship (= /ship): reuse the recorded full PASS if HEAD is unchanged or only docs/ changed since, else full verification → merge-policy resolution (local / manual / auto-low-risk) → PR description + risk label → one planner call (METRICS line, ADRs, DECISIONS, spec Status, docs/prs if local) → one implementer call (CHANGELOG, user docs, commit incl. the planner's files, tidy, push / PR / auto-merge per verdict) → local merge after CEO approval → update STATUS.
