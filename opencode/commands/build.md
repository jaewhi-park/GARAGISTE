---
description: Implement an approved plan step by step (implementer → verifier loop)
agent: team-lead
---
Execute the approved plan: $ARGUMENTS (plan file path)

0. If the current branch is main/master, first have team-implementer run `git switch -c plan/<slug>` (slug from the plan filename). One plan = one branch.

For each step:
1. Assign exactly that step to team-implementer, naming the plan file path and step number.
2. Run quick verification with team-verifier (AGENTS.md: quick tests, lint, typecheck). On FAIL, pass the failure report verbatim to the implementer to fix (max 3 rounds; past that, stop and report to the CEO).
3. On PASS, update docs/STATUS.md and move to the next step. Only steps that are independent and touch different files may run in parallel.

When all steps are done, run full verification with team-verifier once more. Then suggest `/review` to the CEO in a sentence.
