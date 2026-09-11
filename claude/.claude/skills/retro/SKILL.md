---
name: retro
description: Retrospective — feed the causes of rework, failures, CEO intervention and incidents back into rules, skills or guardrails
argument-hint: "[plan slug, session or incident]"
disable-model-invocation: true
---
Run a retrospective. Subject: $ARGUMENTS (plan slug, session or incident)

1. Look at the recent trend in docs/METRICS.md first (rework, questions, duration, and `bug:` plans that name a shipped slug — a failed acceptance; `hotfix:` lines piling up — three or more since the last retro means the plans' verification lets small defects through), then pinpoint at most three places where rework, verification failures, review blockers, CEO intervention or incidents occurred, and write the root cause of each. The intake call and spec rounds of /plan are expected, not intervention; retro subjects are a spec or a brief that whose `Corrections:` line reached 2 with items sent to Undecided, a plan amended more than once (`rev 3` or higher in docs/METRICS.md), or a plan whose sections 1–2 diverged from its intake answers or spec.
2. Propose a countermeasure per cause and say where it belongs: one line in CLAUDE.md / a skill change / a guardrail hook (hard block) / a "## Risk paths" glob / the plan format / agent memory / a new role via `/recruit` (only for a new permission boundary or a separate judge).
3. Have team-planner apply only what the CEO approves. Add rules only for things that actually went wrong. Then have team-implementer commit the changes by path (`docs(retro): <subject>`) on the current branch.
