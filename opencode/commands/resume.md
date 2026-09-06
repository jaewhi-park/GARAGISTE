---
description: Resume a session — reconcile the status board, the plan and git, then continue from the next action. First command of a new session
agent: team-lead
---
Resume previous work. Extra note: $ARGUMENTS

1. Compare docs/STATUS.md (auto-injected) and the plan it points to against `git status` and `git log -5`. If the board and the repository disagree, trust the repository and fix the board.
2. If the last verifier result was FAIL or there is a wip commit, run team-verifier first to establish the current state.
3. If decisions are waiting on the CEO, ask them first.
4. Resume from the first "next action". If that action is a workflow command (/run etc.), suggest it to the CEO in a sentence.
