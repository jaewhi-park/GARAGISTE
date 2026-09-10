---
name: plan
description: Plan a piece of work — intake (one question call) → planner writes → critic reviews → CEO approval requested
argument-hint: "[backlog item, bug: line, or feature]"
disable-model-invocation: true
---
Plan the following work: $ARGUMENTS

0. Intake — one AskUserQuestion call before delegating anything, unless the request already carries a verifiable done-when: it quotes a docs/BACKLOG.md item by title or number (take the CEO's word; the planner pulls its completion criteria), describes a defect with a reproduction rather than new behaviour (`bug:` / `버그:`), names a docs/REBUILD_PLAN.md step (done-when is parity-harness PASS), re-plans an existing docs/plans/ file, or states done-when and not-this-time itself (in the argument or earlier this session). Three questions, 2–3 options each drawn from the request and the auto-injected charter, recommendation first, plus "your call" (recorded as unverified with the planner's default); the CEO can always type their own answer; no Explore call: (1) done when — verifiable completion criteria; (2) not this time — adjacent work left out; (3) fixed in advance — "nothing beyond the charter", or things to reuse or match (existing screen or component, library, design, deadline).
1. Have team-planner write docs/plans/NNNN-<slug>.md. Pass the request text and the intake answers verbatim under a "CEO requirements" heading: they become the plan's Source line and sections 1–2 as given, and anything the planner adds beyond them is marked unverified with a default. Make it reference the charter, CLAUDE.md, BACKLOG and ASSESSMENT/REBUILD_PLAN when they exist.
2. If the plan has 3+ steps or is risk:high, have team-critic review it (follow the operating profile's critic threshold if set); otherwise skip. On REVISE, pass the findings verbatim to the planner (max 2 rounds).
3. If any item meets the escalation criteria and the intake answers did not already decide it, ask the CEO with AskUserQuestion; decided items go in plan section 6 as "decided — per intake", not re-asked. If a step needs a capability no role has (a permission boundary or a separate judge), say so and suggest `/recruit <gap>` in a sentence.
4. Request approval with a summary (goal, step count, risks, expected diff, section 6 one line each). Once approved, do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/run`". Never start /build or /run yourself.
