---
description: Resume a session — reconcile the status board, the plan and git, then continue from the next action. First command of a new session when a board exists
agent: team-lead
---
Resume previous work. Extra note: $ARGUMENTS

0. If docs/STATUS.md was not injected (fresh clone, new worktree, or nothing in progress), there is nothing to resume: say so; if `git branch -r --list 'origin/plan/*'` shows work pushed from another checkout, name it (`git switch <branch>` then `/run <its plan>` continues it); otherwise suggest in a sentence `/plan <top item of docs/BACKLOG.md>` (or `/backlog` when the backlog is empty; when there is no charter: `/brainstorm`, or `/kickoff` | `/assess <path>` per the Kind line of an approved docs/BRIEF.md). End.
1. Compare docs/STATUS.md (auto-injected) and the plan, spec or brief it points to against `git status`, `git log -5` and `git branch --show-current`. If the board and the repository disagree, trust the repository and fix the board yourself. A board whose Shipped line is a merge hash, or a PR link (or `PR pending`) whose state is MERGED (`gh pr view <branch> --json state -q .state`; without gh, ask the CEO in one line), is stale: apply the branches-and-sync rule (switch to main, sync, delete the merged branch) and rewrite the board — Now: none, next action `/plan <top BACKLOG item>`. A board with `Shipped: —` or no Plan line is open — never stale; on main with an open board, sync as well.
2. If the last verifier result was FAIL, or there is a wip commit touching anything beyond docs-only files, run team-verifier first to establish the current state.
3. If decisions are waiting on the CEO, ask them first.
4. Resume from the first "next action" (a board whose only Now line is a Brief line resumes with `/brainstorm` while it is brainstorm, draft or correction, and with `/kickoff` or `/assess <path>` once approved). If that action is a workflow command (/run etc.), suggest it to the CEO in a sentence.
