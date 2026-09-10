---
name: backlog
description: Product function — turn ideas and requests into backlog items with completion criteria and prioritize them (docs/BACKLOG.md, optionally GitHub Issues)
argument-hint: "[idea, or empty to groom only]"
disable-model-invocation: true
---
Groom the backlog. Input: $ARGUMENTS

1. Have team-planner update docs/BACKLOG.md. Item format: title / one-sentence user value / completion criteria (verifiable) / size (S·M·L) / priority (P0–P2) / dependencies / spec (docs/specs/NNNN-<slug>.md or —). Also sweep specs with Status approved, in progress or done for candidates: their "Not this time" items and any "Done when" item no shipped plan covers.
2. Prioritize against the charter's success metrics and non-goals; move anything that hits a non-goal to an "Excluded" section.
3. If the `gh` CLI is available and the CEO wants it, create GitHub Issues for P0/P1 items (issue body = completion criteria).
4. Propose the top three with reasons and one candidate to `/plan` this week (an item with a spec link is planned with `/plan docs/specs/…` and draws no questions; a size-L item without one is offered a spec at intake).
