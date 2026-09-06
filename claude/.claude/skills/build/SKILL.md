---
name: build
description: Implement an approved plan step by step (implementer → verifier loop)
argument-hint: "[plan file path]"
---
This skill runs only when the CEO invoked it directly or when /run chains it via the Skill tool. Never invoke it on your own otherwise.

Execute the approved plan: $ARGUMENTS (plan file path)

0. If the current branch is main/master, first have team-implementer run `git switch -c plan/<slug>` (slug from the plan filename). One plan = one branch.

For each step:
1. Assign exactly that step to team-implementer, naming the plan file path and step number.
2. Run quick verification with team-verifier (CLAUDE.md: quick tests, lint, typecheck). On FAIL, pass the failure report verbatim to the implementer to fix (max 3 rounds; past that, stop and report to the CEO).
3. On PASS, have team-planner update STATUS.md and move to the next step. Only steps that are independent and touch different files may run in parallel.

When all steps are done, run full verification with team-verifier once more. If the CEO invoked /build directly, do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/review`" (inside a /run chain, run continues).
