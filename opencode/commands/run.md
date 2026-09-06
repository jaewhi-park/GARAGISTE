---
description: Default path — take an approved plan through build → review → ship. Stops only at escalation, fix-loop overflow and merge approval
agent: team-lead
---
Take the approved plan all the way: $ARGUMENTS (plan file path)

Stop only at three places: an escalation question, a fix loop exceeding 3 rounds, and merge approval (when the policy resolves to local/manual). Otherwise proceed without asking the CEO, and report once at the end in the final report format.

1. Branch: if the current branch is main/master, have team-implementer run `git switch -c plan/<slug>` first.
2. Implement (= /build): per step, assign it to team-implementer with plan path and step number, then quick verification with team-verifier. On FAIL, pass the report verbatim for a fix (max 3). On PASS, update the status board and continue. After the last step, full verification once more.
3. Review (= /review): 2 lenses (correctness, security) or 4 depending on risk, in parallel → collect blocker/major → implementer fixes → verifier (max 3) → all APPROVE.
4. Ship (= /ship): full verification → CHANGELOG, docs, ADR, DECISIONS → PR description → risk label → merge policy resolution (local / manual / auto-low-risk) → execute accordingly → update STATUS and METRICS.
