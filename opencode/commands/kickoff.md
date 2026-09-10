---
description: New project kickoff — charter (CHARTER), stack decision (ADR), skeleton, rules file, first plan
agent: team-lead
---
Start a new project. Initial requirements: $ARGUMENTS

0. If AGENTS.md has no "## Language" section, first ask the CEO the working language with the question tool (options: ko / en / other; default: the language of the CEO's message), run `node .opencode/scripts/set-language.mjs <code>`, and continue in that language. Skip when it is already set.
1. Load the `charter` skill and ask the CEO its question list with the question tool (split into several calls if the tool limits questions per call). Hand the answers to team-planner to write docs/CHARTER.md.
2. Ask team-planner for 2–3 stack/architecture alternatives with a recommendation, written directly as docs/adr/0001-stack.md with `Status: proposed`. Have team-critic review that file (on REVISE, findings verbatim to the planner, max 2 rounds), then ask the CEO to confirm. The decision is recorded in step 4 — no separate call.
3. Have team-implementer create the project skeleton (minimal structure where build, tests and lint pass empty) and report the exact commands it ran with their exit codes. Do not call team-verifier yet — AGENTS.md has no "## Commands" section for it to run.
4. One team-planner call: (a) write AGENTS.md per the `agents-md` skill — "## Commands" lists only the commands the implementer reported passing, split quick/full (the one bootstrap case where Commands precede verifier confirmation); (b) set docs/adr/0001-stack.md to `Status: accepted` with the CEO's choice; (c) write a first docs/BACKLOG.md (5–10 items from the charter) and docs/plans/0001-walking-skeleton.md. Then have team-verifier run full verification — PASS confirms both the skeleton and the Commands section. On FAIL, team-implementer fixes (max 3 rounds); a command that still fails is dropped from AGENTS.md by the planner in its next call.
5. Have team-critic review the walking-skeleton plan only if it has 3+ logic steps or is risk:high (the usual threshold), then request approval.
6. Finally suggest `/hire` to the CEO in a sentence — the project's character is now known, so assign models per role there — and then a new session with `/run docs/plans/0001-walking-skeleton.md` (model assignments load at session start). Do not start it yourself.
