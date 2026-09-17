---
name: spec
description: Structure, file template and revision rules of the product spec — docs/specs/F<nn>-<slug>.md, one file per feature, with docs/SPEC.md as the index. The index is written by team-planner from the brief at /kickoff and each section file at /plan when its row's turn comes, never through CEO rounds; a new feature extends it; revised through /plan's `수정:` path. read by team-planner before writing or revising it and by team-critic when reviewing it.
user-invocable: false
---
# spec

The product spec is the team's: **what** each feature does and **when it is done**. One file per feature under docs/specs/ (`F01-<slug>.md`, `F02-<slug>.md`, …) and one index, docs/SPEC.md, with a line per feature. The team writes it; the CEO does not have to read it — the brief (docs/BRIEF.md) is what the CEO approved, and the spec is the team's expansion of it. When the CEO looks at the product later and says "이거 아닌데", the section changes and the plans follow (revision below). It never chooses how: no stack, schema design, library or alternatives — those are ADR material, decided in /plan. Link rather than paste; a section file is one to two pages at most. A section is referenced by its ID (F3) everywhere — plans, backlog, METRICS, chat; the index resolves the ID to the file, so the planner and the critic read only the file they need.

## Sources, in order of authority
1. docs/BRIEF.md — Decided lines (one section each), Non-goals (nothing crosses them), Constraints, Quality bar, the appendix (the CEO's own words about flows and screens: use them verbatim as the section's core flow and screens; they are the closest thing to a CEO round).
2. docs/CHARTER.md and docs/DECISIONS.md — earlier decisions stand; never re-decide them.
3. The planner's own defaults — every slot the sources leave open is decided with a default, written as `decided by default: <x> — <reason>` in the section's Undecided list and logged as one line in docs/DECISIONS.md. Never a guess presented as fact, never a question to the CEO: only an item on the lead's escalation list (money, security or user data, a conflict with the brief's non-goals) goes to the CEO, through the lead.

## Template — docs/SPEC.md (the index; one line per feature, nothing else)
````
# <Project> Spec
Source: docs/BRIEF.md (approved <date>) · Sections: F1–F<n>

| ID | Feature | Status | Rev | File |
|---|---|---|---|---|
| F1 | <name> | pending · planned · in progress — plans: … · done · dropped | 1 | docs/specs/F01-<slug>.md (— while pending) |
````

## Template — docs/specs/F<nn>-<slug>.md (one per feature; the ID is two digits in the file name, `F3` in prose)
````
# F3 <Feature name>
Status: planned | in progress — plans: docs/plans/… | done | dropped (<reason>) · rev n
Backlog: <item title(s)>
## Purpose and users (who, when, why now)
## Core flow (3–7 steps)
## Screens and states (if UI; every screen lists empty, loading, error and success)
## Data and interfaces (what goes in and out; which interfaces are touched, not their design)
## Exceptions and errors
## Done when (verifiable statements — each becomes a plan's completion criterion)
## Not this time
## Quality (only where stricter than the charter)
## Reuse and references (paths and links; attachments under docs/specs/assets/F<nn>/)
## Undecided (item — decided by default: <x> — <reason> | decided in the plan's ADR | escalated: <question>)
## Revision history (date — rev n — what changed — plans affected)
````

## Writing rules
- One section per Decided line of the brief; a brief item that is really two features becomes two sections, and the brief's appendix sketches are placed in the section they belong to, verbatim.
- Done-when lines are the contract: each one must be checkable by a test, a command or an observable fact. A section whose Done-when cannot be stated that way is not ready — say so in the report.
- A UI section names every screen with its four states. A section that touches an interface names it (API, schema, file format, event) without designing it.
- Not-this-time is never empty: what a reader would expect and is deliberately left out.
- A hard-to-reverse choice surfaced while writing goes under Undecided as "decided in the plan's ADR", not into the section.
- Section IDs are permanent: a dropped feature keeps its number with `Status: dropped`; a new feature takes the next free number. A file is never renamed (the slug is only a reading aid). Plans reference the ID (`Source: spec F3`), BACKLOG items carry `spec: F3`, METRICS lines carry `(F3)`; the index row's Status and Rev mirror the file's Status line and are updated together with it.
- Report line (the Summary of the planner's report): `Spec: F1–F<n> (docs/specs/, index docs/SPEC.md) · not ready: <ids> | none · escalated: <items> | none · defaults: <n> (in DECISIONS.md)`; for one section: `Spec: F<n> · rev n · <file> · …`.

## Extending — a section written after kickoff
An index row the kickoff left `pending` (every Decided line of the brief: it has an ID and a backlog item, no file yet) gets its file from the planner when the item's turn comes — at /plan, before the plan is written from it, keeping the row's ID and turning its Status to `planned`. A new capability from the CEO (in chat, a backlog item without a section, a `/plan <feature>` request) gets a new section file the same way, written from the CEO's words verbatim plus defaults — with a new index row; creating docs/specs/ and docs/SPEC.md when they do not exist yet (a legacy project has none until its first new feature). Reported with the same line; the critic reviews the new section with the plan.

## Revision — `/plan F<n> 수정: <what changed>`
The lead discusses the change with the CEO (brainstorm mode, short: what changed, the options, what it touches and costs), then hands the discussion to the planner verbatim. The planner rewrites only the section's differences (Done-when, Not-this-time, Screens, Undecided), bumps `rev n` (in the file and the index row), appends a Revision-history line, and reports the impact as its Summary: `Spec: F<n> · rev n · Done-when ±<k> · plans in flight: <path (step k/n)> | none · shipped: <slugs from docs/METRICS.md lines carrying (F<n>)> | none · charter/brief conflict: <item> | none`. From that report the lead sorts the plans: shipped work that the change invalidates becomes a BACKLOG rework item; the plan in flight is amended from the step after its last PASS; unstarted plans are re-planned. The critic checks the changed section and the sort. The CEO is asked only when shipped work is discarded (the one expensive step); otherwise the team proceeds.

## Lifecycle
- /kickoff: the planner writes the index only — a row per Decided line of the brief, every row `pending`, no section files (each is written at /plan when its row's turn comes, from the Decided line and the appendix); the critic checks the rows against the brief; BACKLOG gets one item per row (`spec: F<n>`, completion criteria = the brief's Decided line, `pending section`).
- /plan: sections 1–2 of a plan are the section's Done-when and Not-this-time verbatim; the section's Status becomes `in progress — plans: …` (file and index).
- /ship: a section is `done` when every Done-when line is covered by a shipped plan (the `(F<n>)` lines in docs/METRICS.md); otherwise `remaining: <uncovered lines>` is appended to its Status.
- /backlog sweeps the sections for uncovered Done-when lines and Not-this-time candidates.
- /brainstorm revising the brief: the planner lists the sections the revision touches; each is revised as above.
