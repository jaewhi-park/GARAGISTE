---
description: New project kickoff — charter (CHARTER), stack decision (ADR), skeleton, rules file, first plan
agent: team-lead
---
Start a new project. Initial requirements: $ARGUMENTS

1. Load the `charter` skill and ask the CEO its question list with the question tool (split into several calls if the tool limits questions per call). Hand the answers to team-planner to write docs/CHARTER.md.
2. Ask team-planner for 2–3 stack/architecture alternatives with a recommendation. After team-critic review and CEO confirmation, have it recorded as docs/adr/0001-*.md.
3. Have team-implementer create the project skeleton (minimal structure where build, tests and lint pass empty) and confirm with team-verifier.
4. Have team-planner write AGENTS.md per the `agents-md` skill. Record only commands that actually passed in step 3.
5. Have team-planner write a first docs/BACKLOG.md (5–10 items from the charter) and the walking-skeleton plan docs/plans/0001-walking-skeleton.md; request approval after critic review (once approved, suggest `/run` in a sentence — do not start it yourself).
6. Finally suggest `/hire` to the CEO in a sentence — the project's character is now known, so assign models per role here.
