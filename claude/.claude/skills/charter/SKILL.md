---
name: charter
description: Procedure, question list and template for a new project charter (docs/CHARTER.md). Load at project kickoff, when starting a new product/service/tool, or whenever goals, scope or non-goals are unclear or drifting.
user-invocable: false
---
# charter

The charter is the company's constitution. Every backlog item, plan and review is judged against it. Keep it to 1–2 pages.

## Questions for the CEO (ask together)
1. What problem is being solved, and who has it?
2. How is success measured (a number or an observable fact)?
3. At least three things this will NOT do (non-goals)
4. Constraints: language/runtime, deployment target, external integrations, data/security/regulation, cost ceiling, deadline
5. Quality bar: expected test level, performance targets, supported platforms, how it will be operated
6. Existing assets: code, libraries, infrastructure to reuse
7. Areas the CEO wants to decide personally (added to the default escalation criteria)
8. Working language for responses and documents (e.g. ko, en)

## Template — docs/CHARTER.md
````
# <Project> Charter
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
- Non-goals must be concrete (e.g. "no multi-tenancy", "not real-time").
- If a success metric cannot be measured, ask again.
