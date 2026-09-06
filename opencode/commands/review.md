---
description: Review a diff — 2 lenses (correctness/security) or 4 depending on risk, in parallel → fix loop
agent: team-lead
---
Review the current branch's changes. Base branch: $ARGUMENTS (if empty, whichever of main or master exists)

1. Check scope and risk with `git diff --stat`. Default lenses: correctness + security. Add performance + maintainability (4 lenses) for risk:high (escalation criteria touched), a logic diff over 300 lines, or hot-path / data-processing changes. Launch one team-reviewer per lens in parallel, each told its lens and the diff range.
2. Collect blocker/major findings and merge duplicates. Conflicting findings go to the CEO.
3. Have team-implementer fix and team-verifier confirm (max 3 rounds).
4. When every lens is APPROVE, report the findings and how they were handled. Then suggest `/ship` to the CEO in a sentence.
