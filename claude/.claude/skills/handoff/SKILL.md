---
name: handoff
description: Wrap up a session — update the status board (docs/STATUS.md), commit WIP, list pending decisions. Use when ending a session or when repeated compaction has made the context heavy
argument-hint: "[note]"
disable-model-invocation: true
---
Wrap up the session. Note: $ARGUMENTS

1. Check uncommitted changes with git status/diff. If any, have team-implementer make a `wip(<scope>): <state>` commit — even with failing tests, and describe the failure in the body.
2. Have team-planner update docs/STATUS.md in the status-board format: plan and branch, step progress and last verifier result, open review findings, decisions waiting on the CEO, next three actions.
3. Report to the CEO: what this session finished / decisions waiting / the first action of the next session. Start no new work afterwards.
