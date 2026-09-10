---
description: Review a diff — 2 lenses (correctness/security) or 4 depending on risk, in parallel → fix loop
agent: team-lead
---
Review the current branch's changes. Base branch: $ARGUMENTS (if empty, whichever of main or master exists)

1. Check scope and risk: `git log --oneline <base>..HEAD`, then `git diff --stat` over the logic commits only (skip commits labelled scaffold/gen/mechanical/deps/delete; ignore test and doc files). Default lenses: correctness + security. Add performance + maintainability (4 lenses) for risk:high (escalation criteria touched), a logic diff over 600 lines, or hot-path / data-processing changes; the operating profile may override. Launch one team-reviewer per lens in parallel, each told its lens and the diff range.
2. Collect blocker/major findings and merge duplicates. Conflicting findings go to the CEO.
3. Note HEAD (`git log -1 --format=%H`), then have team-implementer fix and team-verifier confirm (quick). Re-review only the fix diff (`git diff <noted HEAD>..HEAD`) with the lenses that returned REQUEST_CHANGES; a lens that returned APPROVE stands unless the fix touched files outside its findings, in which case it re-reviews the fix diff too. Max 3 rounds; past that, stop and report to the CEO.
4. When every lens is APPROVE: if the CEO invoked /review directly, report the findings and how they were handled, then suggest `/ship` to the CEO in a sentence. Inside a /run chain, carry them into the final report and continue.
