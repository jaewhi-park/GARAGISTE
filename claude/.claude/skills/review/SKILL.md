---
name: review
description: Review a diff — 2 lenses (correctness/security) or 4 depending on risk, in parallel → fix loop
argument-hint: "[base branch, default main]"
---
This skill runs only when the CEO invoked it directly or when /run chains it via the Skill tool. Never invoke it on your own otherwise.

Review the current branch's changes. Base branch: $ARGUMENTS (if empty, whichever of main or master exists)

1. Check scope and risk: `git log --oneline <base>..HEAD`; risk = a Risk-paths hit — `git diff --name-only <base>..HEAD` matched against the rules file's "## Risk paths" globs (name the files) — or the plan's `Risk: high` header; logic diff lines = insertions + deletions summed from `git show --numstat --format= <sha> -- . ':!docs/**'` over the logic commits only (skip commits labelled scaffold/gen/mechanical/deps/delete; ignore test files). Default lenses: correctness + security. Add performance + maintainability (4 lenses) for risk:high, a logic diff over 600 lines, or hot-path / data-processing changes; the operating profile may override, and you may raise but never lower a Risk-paths hit. Launch one team-reviewer per lens in parallel, each told its lens and the diff range.
2. Collect blocker/major findings and merge duplicates, and record them under the board's "Open review findings" yourself, adding their number to the Counts line's `review blockers`. Conflicting findings go to the CEO.
3. Note HEAD (`git log -1 --format=%H`), then have team-implementer fix and team-verifier confirm (quick). Re-review only the fix diff (`git diff <noted HEAD>..HEAD`) with the lenses that returned REQUEST_CHANGES; a lens that returned APPROVE stands unless the fix touched a file outside the diff range it reviewed, in which case it re-reviews the fix diff too, in the same turn. Max 3 rounds; past that, stop and report to the CEO.
4. When every lens is APPROVE (set the board's Open review findings to `none`): if the CEO invoked /review directly, report the findings and how they were handled, then do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/ship`". Inside a /run chain, carry them into the final report and continue.
