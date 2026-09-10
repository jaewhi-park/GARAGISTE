---
name: spec
description: Procedure, question rounds and template for a feature specification (docs/specs/NNNN-<slug>.md). Loaded by /plan step 0a when the CEO opts in at intake or re-enters with a docs/specs file; never for bugs, rebuild steps or re-plans.
user-invocable: false
---
# spec

A spec says **what** and **when it is done**, in the CEO's words. It never chooses how: no stack, schema design, library or alternatives — those are ADR material written during /plan. Two pages or less; link rather than paste.

## When
Offered at /plan step 0 (question 1). Warranted for a new page or screen, a new API or data model, several flows, or anything the CEO cannot state as one done-when line.
Never for: bugs (the reproduction is the spec), docs/REBUILD_PLAN.md steps (docs/PARITY.md is the spec), re-plans.

## Rounds
The intake answers (done when / not this time / fixed in advance) — or, for a BACKLOG item, its completion criteria and dependencies — already seed the spec. The rounds are asked in plain chat — the one place open questions and long answers are allowed; AskUserQuestion is used only for the approval.
1. Structure — one message, numbered: who uses it and when (trigger) / the core flow in 3–7 steps / why now (one line).
2. Detail — only the slots still open after round 1: screens and states incl. empty and error (if UI) / data in and out and validation / interfaces touched — which, not their design (API, schema, file format, events) / quality stricter than the charter / reuse and references (existing screen, design file, similar feature, external doc — paths and links, never pasted).
An answer may arrive in several messages. A round closes only when the CEO says it is complete ("that's all", "여기까지", "됐다") or asks a question back; until then acknowledge in one line and do not re-ask. Hand the planner every fragment verbatim, in order, in one call per round; if about ten or more fragments pile up before the round closes, checkpoint them to the planner mid-round (a compaction must not lose them) and keep collecting — a /handoff mid-round checkpoints the same way. A CEO who opens with a description of their own is answering round 1. Rounds are not capped; only the corrections after the approval question are.
After each round: hand the answers verbatim to team-planner, which writes or updates the spec and reports, as the Summary of its usual report, one line: `Spec: <path> · Status: <s> · Filled: <sections> · Open: <sections> · Undecided: <items>`; then update docs/STATUS.md yourself (`Spec: <path> · round <k> | correction <k> | draft | approved`; next action `/plan docs/specs/NNNN-<slug>.md`). Compose the next round from the planner's report line only; never read the file yourself. If the round answers are no longer in context (compaction), have team-planner report the open slots.
3. Correction — after round 2 name the file path and go straight to the approval question; on "correct" the CEO reads the draft file and corrects in plain chat, team-planner revises, and the approval question is asked again. Max 2 correction rounds; what is still disputed goes under Undecided.
4. Approval — one AskUserQuestion: approve, plan now / approve, plan next session (the spec is committed and the board written — /plan step 0a) / correct / stop here (stays draft). On approval team-planner sets `Status: approved <date>` and writes `spec: docs/specs/NNNN-<slug>.md` into the source BACKLOG item, if any.

## Template — docs/specs/NNNN-<slug>.md
Own NNNN sequence (next free number in docs/specs/). The first plan from a spec reuses its slug; split parts use `<slug>-<part>`.
````
# <Feature> Spec
Status: draft | approved <date> | in progress — plans: docs/plans/… | done | superseded by …
Source: BACKLOG item <title> | CEO request <date>
## Purpose and users (who, when, why now)
## Core flow
## Screens and states (if UI; incl. empty and error)
## Data and interfaces (what goes in and out; which interfaces are touched, not their design)
## Exceptions and errors
## Done when (verifiable)
## Not this time
## Quality (only where stricter than the charter)
## Reuse and references (paths and links; attachments under docs/specs/assets/<slug>/)
## Undecided (item — when it will be decided; "decided in the plan's ADR" for how-questions)
````

## Writing rules
- Leave unanswered items as "undecided — <when>". Never fill them with guesses. A "your call" answer becomes "undecided — planner default: <x>; confirm at plan approval".
- A hard-to-reverse choice surfaced in a round goes under Undecided as "decided in the plan's ADR", not into the spec.
- Lifecycle: /plan (spec-backed) sets Status to `in progress — plans: …`, appending each later part's plan path; /ship marks it done when every Done-when item is covered by a shipped plan; /backlog sweeps specs that are approved, in progress or done for candidates.
