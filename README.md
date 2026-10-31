# GARAGISTE — kit

A small kit that makes one coding-agent harness (Claude Code or opencode) work better in your repositories, without building a team around it. It adds only what the harness cannot know by itself: a thin `AGENTS.md` map of facts, a three-field request habit, a one-line check report, and your personal working style installed once per machine. No hooks, no state machine, no ledger, no personas.

Instructions only by default. Two scripts (`check`, `tests-for`: one-line test results with raw output in a log, changed files → tests) are kept for the day an incident asks for them (`--with-scripts`).

## Install — three layers
```
node <GARAGISTE>/kit/install.mjs global                       # once per machine: working style + the /kit-init skill
node <GARAGISTE>/kit/install.mjs claude   --project <repo>    # once per repository: AGENTS.md · CLAUDE.md(@AGENTS.md) · .gitignore
node <GARAGISTE>/kit/install.mjs opencode --project <repo>    #                      AGENTS.md · .opencode/agents/{build,review}.md · .gitignore
```
Then, in that repository's first session, `/kit-init`: it fills the check commands, writes `docs/ARCHITECTURE.md`, and moves into the map only what almost every request needs. After that, each request is three fields: what, where you know it lives, and what "done" looks like.

## Read
- [kit/README.md](kit/README.md) — every file and its job, the three filters every instruction line passes, what is deliberately absent, when to turn the scripts on (Korean)
- [docs/DECISIONS.md](docs/DECISIONS.md) — the reasoning, newest entries dated 2026-10-31 (Korean)

## Verify
```
node --test tests/kit.test.mjs
```

## History
v2, the "evidence team" (seven packs, hooks and a plugin, a ledger, a conductor, a commit gate), lived in `team/` from 2026-09-29 to 2026-10-31 and is kept whole on branch `v2`. v1 is on branch `v1`. v3 inherits no file from either; why is in `docs/DECISIONS.md` under 2026-10-31.
