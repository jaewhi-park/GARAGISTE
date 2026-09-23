---
name: backlog
description: Product function — turn ideas and requests into backlog items with completion criteria and prioritize them (docs/BACKLOG.md, optionally GitHub Issues)
argument-hint: "[idea, or empty to groom only]"
---
Groom the backlog. Input: $ARGUMENTS

1. Have team-planner update docs/BACKLOG.md. Item format: title / one-sentence user value / completion criteria (verifiable) / size (S·M·L) / priority (P0–P2) / dependencies / spec (F<n>, or —) / req (the requirement ID the item came from, or —). Also sweep docs/BRIEF.md (its Later lines and appendix) and the spec sections (docs/specs/) for candidates: their "Not this time" items and any "Done when" line no shipped plan covers — and docs/DEBT.md for a line that grew into work the CEO could see (a line that keeps coming back is a /retro subject, not an item). BACKLOG holds work the CEO could see or try; a reviewer's minor finding stays in DEBT. When docs/BACKLOG.md is over 300 lines, the same call applies the Archive rule below before grooming.
2. Prioritize against the charter's success metrics and non-goals; move anything that hits a non-goal to an "Excluded" section.
3. If the `gh` CLI is available and the CEO wants it, create GitHub Issues for P0/P1 items (issue body = completion criteria).
4. Propose the top three with reasons and the next iteration's items (written to the board's Next iteration line); the CEO changes the order by saying so — no question (an item with a `spec:` field is planned from its section; one without gets a section written by the planner first — no questions either way). Stale items — open, and the newest date in the item's text (or `git blame` on its lines when it has none) is over 90 days old — are archived by default (the Archive rule, under a "stale" heading) and named in one line on the CEO's page under Decided by default; the CEO revives one by naming it.
5. Remove a `Brief: … revised` line from the board yourself (the revision is groomed in) and commit docs/BACKLOG.md and the board yourself (`docs(backlog): groom <date>`) on the current branch — the archive files and docs/DECISIONS.md too when the Archive rule moved anything (`docs(archive): <n> backlog items · <m> decisions`).


## Archive rule (the planner's; step 1's 300-line check, step 4's stale items and /release call it)
Settled lines move out of the files the team reads every time; nothing is deleted. docs/archive/BACKLOG-<year>.md takes every item that is shipped (✓ with its plan slug), dropped or merged into another item — the whole item block, under a heading with the date of the move — and the stale items step 4 flagged; docs/archive/DECISIONS-<year>.md takes every docs/DECISIONS.md line that records a shipped plan's internal choice (a critic or review round, a step decision: the line names a plan that has shipped and the CEO did not make the decision) unless an ADR, docs/CONTRACTS.md or a spec section cites it. Open items, product-level decisions and the CEO's decisions stay. An archive file keeps the source's format, newest move first. The planner reports `archived: <n> backlog items · <m> decisions`; a line moves back when its item reopens.
