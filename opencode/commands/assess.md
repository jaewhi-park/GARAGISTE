---
description: Legacy assessment — inventory, risks, parity harness, rebuild strategy (ADR). Rebuild only after the harness exists
agent: team-lead
---
Assess an existing codebase and set a rebuild/modernization strategy. Target and context: $ARGUMENTS

1. Load the `legacy-assessment` skill. Send explore out per area in parallel to gather the inventory, and have team-planner compile docs/ASSESSMENT.md.
2. Report unknowns and "current behaviour that looks like a bug" to the CEO and get a preserve/fix policy per item.
3. Following the `parity-harness` skill, have team-implementer build the characterization-test / golden-output harness and confirm with team-verifier. No rebuild step starts without the harness.
4. Have team-planner compare strategies (strangler fig / module-by-module replacement / full rewrite) with a recommendation; after team-critic review and CEO confirmation, record an ADR and docs/REBUILD_PLAN.md.
5. Have AGENTS.md written/updated per the `agents-md` skill (including the harness command).
6. Propose the first rebuild step in plan-document form (do not invoke `/plan` via the Skill tool).
7. Suggest `/hire` to the CEO in a sentence — a rebuild weights critic and reviewer heavily, so assign in that direction.
