---
name: resume
description: Resume a session — reconcile the status board, the plan and git, then continue from the next action. First command of a new session
argument-hint: "[note]"
disable-model-invocation: true
---
Resume previous work. Extra note: $ARGUMENTS

1. Compare docs/STATUS.md (auto-injected) and the plan or spec it points to against `git status` and `git log -5`. If the board and the repository disagree, trust the repository and fix the board yourself.
2. If the last verifier result was FAIL or there is a wip commit touching anything outside docs/, run team-verifier first to establish the current state.
3. If decisions are waiting on the CEO, ask them first.
4. Resume from the first "next action". If that action is a workflow command (/run etc.), do not invoke it via the Skill tool — suggest it to the CEO in a sentence.
