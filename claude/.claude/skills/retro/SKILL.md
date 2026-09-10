---
name: retro
description: Retrospective — feed the causes of rework, failures, CEO intervention and incidents back into rules, skills or guardrails
argument-hint: "[plan slug, session or incident]"
disable-model-invocation: true
---
Run a retrospective. Subject: $ARGUMENTS (plan slug, session or incident)

1. Look at the recent trend in docs/METRICS.md first (rework, questions, duration), then pinpoint at most three places where rework, verification failures, review blockers, CEO intervention or incidents occurred, and write the root cause of each. The intake call of /plan is expected, not intervention; a plan whose sections 1–2 diverged from its intake answers is a retro subject.
2. Propose a countermeasure per cause and say where it belongs: one line in CLAUDE.md / a skill change / a guardrail hook (hard block) / the plan format / agent memory / a new role via `/recruit` (only for a new permission boundary or a separate judge).
3. Have team-planner apply only what the CEO approves. Add rules only for things that actually went wrong.
