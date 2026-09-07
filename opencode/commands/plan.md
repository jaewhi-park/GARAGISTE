---
description: Plan a piece of work — planner writes → critic reviews → CEO approval requested
agent: team-lead
---
Plan the following work: $ARGUMENTS

1. Have team-planner write docs/plans/NNNN-<slug>.md. Make it reference the charter, AGENTS.md, BACKLOG and ASSESSMENT/REBUILD_PLAN when they exist.
2. If the plan has 3+ steps or is risk:high, have team-critic review it (follow the operating profile's critic threshold if set); otherwise skip. On REVISE, pass the findings verbatim to the planner (max 2 rounds).
3. If any item meets the escalation criteria, ask the CEO with the question tool. If a step needs a capability no role has (a permission boundary or a separate judge), say so and suggest `/recruit <gap>` in a sentence.
4. Request approval with a summary (goal, step count, risks, expected diff). Once approved, suggest `/run` to the CEO in a sentence. Never start /build or /run yourself.
