---
name: kickoff
description: New project kickoff — charter (CHARTER), stack decision (ADR), skeleton, rules file, first plan
argument-hint: "[idea]"
disable-model-invocation: true
---
Start a new project. Initial requirements: $ARGUMENTS

1. Load the `charter` skill and ask the CEO its question list with AskUserQuestion (split into several calls if the tool limits questions per call). Hand the answers to team-planner to write docs/CHARTER.md.
2. Ask team-planner for 2–3 stack/architecture alternatives with a recommendation. After team-critic review and CEO confirmation, have it recorded as docs/adr/0001-*.md.
3. Have team-implementer create the project skeleton (minimal structure where build, tests and lint pass empty) and confirm with team-verifier.
4. Have team-planner write CLAUDE.md per the `claude-md` skill. Record only commands that actually passed in step 3.
5. Have team-planner write a first docs/BACKLOG.md (5–10 items from the charter) and the walking-skeleton plan docs/plans/0001-walking-skeleton.md; request approval after critic review (once approved, suggest `/run` in a sentence — do not start it yourself).
6. Finally run `hire` via the Skill tool (the budget questions go to the CEO; applied after approval) — the project's character is now known, so assign models per role here.
