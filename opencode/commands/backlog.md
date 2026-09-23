---
description: Product function — turn ideas and requests into backlog items with completion criteria and prioritize them (docs/BACKLOG.md, optionally GitHub Issues)
agent: team-lead
---
Groom the backlog. Input: $ARGUMENTS

1. Have team-planner update docs/BACKLOG.md. Item format: title / one-sentence user value / completion criteria (verifiable) / size (S·M·L) / priority (P0–P2) / dependencies / spec (F<n>, or —) / req (the requirement ID the item came from, or —). Also sweep docs/BRIEF.md (its Later lines and appendix) and the spec sections (docs/specs/) for candidates: their "Not this time" items and any "Done when" line no shipped plan covers — and docs/DEBT.md for a line that grew into work the CEO could see (a line that keeps coming back is a /retro subject, not an item). BACKLOG holds work the CEO could see or try; a reviewer's minor finding stays in DEBT.
2. Prioritize against the charter's success metrics and non-goals; move anything that hits a non-goal to an "Excluded" section.
3. If the `gh` CLI is available and the CEO wants it, create GitHub Issues for P0/P1 items (issue body = completion criteria).
4. Propose the top three with reasons and the next iteration's items (written to the board's Next iteration line); the CEO changes the order by saying so — no question (an item with a `spec:` field is planned from its section; one without gets a section written by the planner first — no questions either way).
5. Remove a `Brief: … revised` line from the board yourself (the revision is groomed in) and commit docs/BACKLOG.md and the board yourself (`docs(backlog): groom <date>`) on the current branch.
