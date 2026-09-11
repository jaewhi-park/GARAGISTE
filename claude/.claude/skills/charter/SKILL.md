---
name: charter
description: Slot list and template for the project charter (docs/CHARTER.md), derived from the product brief. Load at /kickoff and /assess when the charter is written, or whenever goals, scope or non-goals are unclear or drifting.
user-invocable: false
---
# charter

The charter is the company's constitution. Every backlog item, plan and review is judged against it. Keep it to 1–2 pages.

## Slots — filled from docs/BRIEF.md (the `brief` skill); the CEO is asked only what the brief leaves undecided
1. What problem is being solved, and who has it
2. How success is measured (a number or an observable fact)
3. At least three things this will NOT do (non-goals)
4. Constraints: language/runtime, deployment target, external integrations, data/security/regulation, cost ceiling, deadline
5. Quality bar: expected test level, performance targets, supported platforms, how it will be operated
6. Existing assets: code, libraries, infrastructure to reuse
7. Areas the CEO wants to decide personally (added to the default escalation criteria)

## Template — docs/CHARTER.md
````
# <Project> Charter
Source: docs/BRIEF.md (approved <date>)
## Problem
## Users
## Success metrics
## Non-goals
## Constraints
## Quality bar
## Reused assets
## Additional escalation items
## References
- Backlog: docs/BACKLOG.md · Decisions: docs/adr/, docs/DECISIONS.md
````

## Writing rules
- Leave unanswered items as "undecided — <when>". Never fill them with guesses.
- Derived, not re-asked: every line traces to a brief slot; a slot the brief leaves undecided stays "undecided — <when>". When /brainstorm revises the brief, the planner applies the charter lines it listed after approval.
- Non-goals must be concrete (e.g. "no multi-tenancy", "not real-time").
- If a success metric cannot be measured, ask again.
