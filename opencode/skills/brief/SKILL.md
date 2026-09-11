---
name: brief
description: Template, slots and writing rules for the product brief (docs/BRIEF.md, the 기획서) — product level, in the CEO's words, never injected. Loaded by /brainstorm; read by team-planner when writing, normalizing or revising the brief, and by /kickoff and /assess when they derive the charter from it.
---
# brief

The brief is the product-level document: what is being built, for whom, what is in and out, how success is measured, and why the rejected ideas were rejected. team-planner writes it in the CEO's words from a brainstorm or from a document the CEO brought. It says what, never how (no stack, schema or library — ADR material) and never feature detail (a flow, a screen, an API — spec material; one line per idea under the appendix is the most it holds). 2–4 pages; link, never paste. It is not injected into sessions: docs/CHARTER.md (under 60 lines) is derived from it and is the injected yardstick.

## Slots — the completeness check, asked after the brainstorm, never before
1. Who has the problem, and how they cope today
2. What changes for them when this exists; why now
3. Decided — the MVP capabilities, one line each (3–7)
4. Later, and Rejected with the reason
5. Non-goals — at least three, concrete ("no multi-tenancy", "not real-time")
6. First milestone, and the kill criterion (what would make the CEO stop)
7. Constraints: language/runtime, deployment target, integrations, data/security/regulation, cost ceiling, deadline
8. Success metric — a number or an observable fact; if it cannot be measured, ask again
9. Riskiest assumption and the cheapest way to test it; why existing tools do not solve it
10. Quality bar stricter than the default; existing assets to reuse; areas the CEO decides personally
11. Kind: 신규 (a new project → /kickoff) or 레거시 (<path> → /assess)

## Template — docs/BRIEF.md
````
# <Project> Brief
Status: whiteboard | draft | approved <date> | revised <date> (rev n) — a revision in progress keeps this line and appends ` (rev n draft)`; the original approval is rev 1
Kind: 신규 | 레거시 (<path>)
Source: brainstorm <date> (checkpoints: n) | <path of the CEO's document>
## Direction (who, the problem today, what changes, why now)
## Decided — MVP capabilities (one line each)
## Later
## Rejected (with the reason)
## Non-goals
## Milestone and kill criterion
## Constraints
## Success metric
## Risks and validation (riskiest assumption, cheapest test, why not existing tools)
## Quality, reuse, CEO-only decisions
## Appendix — sketches from the brainstorm (one line each; spec rounds read this)
## Requirements (only when a requirement list with IDs came in: a pointer to the docs/BACKLOG.md `req:` items)
## Undecided (item — when it will be decided; "planner default: <x>; confirm at the /kickoff ADR question")
## Revision history (date — what changed — charter lines touched)
````

## Writing rules
- Verbatim: sort the CEO's words, do not rephrase them; a lead proposal enters only when the CEO accepted it.
- Never fill a slot with a guess: report it as Open and leave `undecided — <when>` in the file.
- Decided items are one line each; when a line starts to describe a flow, a screen or an API, cut it to one line and move the rest to the appendix.
- A requirement list with IDs (a requirements document, an RFP, a 과제 제안서) goes to docs/BACKLOG.md as items — title, value, completion criteria from the requirement text, size and priority `undecided — next /backlog`, `req: <ID>` — and the brief keeps the product-level summary and a pointer; the ID follows the item into the plan's Source line and the METRICS line.
- Normalizing a document the CEO brought (entrance B): keep their wording and headings where they map, `Source:` = the path, never paste the original; what the document does not say stays Open (most such documents lack non-goals, the kill criterion and a measurable metric).
- Whiteboard (during the brainstorm): append each checkpoint under "## Whiteboard" (create mode, `Status: whiteboard`) or "## Whiteboard (revision)" (revision mode; the Status line keeps its date and carries `(rev n draft)`) as decided / later / rejected (reason) / open, in order; the compile step replaces the whiteboard with the template or the differences.
- Revision: write only the differences, add a Revision-history line, bump the rev (the original approval is rev 1, the first revision rev 2), and list every charter line the change touches (Users, Success metrics, Non-goals, Constraints); apply them to docs/CHARTER.md only after approval, when the Status becomes `revised <date> (rev n)`.
- Report line (the Summary of the planner's report): `Brief: docs/BRIEF.md · Status: <s> · Kind: <k> · decided <n> · later <n> · rejected <n> · Open: <slots> · Undecided: <items>` — a revision adds `· changes <n> · charter: <lines> · plans affected: <paths or none>`.
- Lifecycle: /brainstorm creates it (approved) and revises it (revised); /kickoff and /assess derive docs/CHARTER.md from it and settle its Undecided items at their confirmation question; /backlog sweeps Later and the appendix; spec rounds reference the appendix by path; /hire reads it for the project's character.
