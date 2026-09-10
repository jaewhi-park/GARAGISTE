---
name: build
description: Implement an approved plan step by step (implementer → verifier loop)
argument-hint: "[plan file path]"
---
This skill runs only when the CEO invoked it directly or when /run chains it via the Skill tool. Never invoke it on your own otherwise.

Execute the approved plan: $ARGUMENTS (plan file path)

0. Read the plan file (it is short). If the current branch is main/master, run `git switch -c plan/<slug>` yourself (slug from the plan filename; `git switch plan/<slug>` if it already exists). One plan = one branch. If docs/STATUS.md already names this plan and branch with PASSed steps, continue from the step after the last PASS instead of step 1.

For each step, in order (steps of one plan never run in parallel; only whole independent plans do, via the CEO's /parallel):
1. Assign exactly that step to team-implementer, naming the plan file path and step number and quoting the step's lines.
2. Run quick verification with team-verifier (CLAUDE.md: quick tests, lint, typecheck). Exception: when CLAUDE.md's "## Operating profile" says `per-step verifier: off`, skip it if the implementer's report lists every quick-verification command at exit 0 and the step touches no escalation criterion — the independent verdict is then the full verification below. On FAIL, pass the failure report verbatim to the implementer to fix (max 3 rounds; past that, stop and report to the CEO).
3. On PASS — or, with the verifier off, an all-exit-0 implementer report, recorded as `self-check quick` — update the Step line (state and Last verifier) of docs/STATUS.md yourself and move to the next step.

When all steps are done, run full verification with team-verifier once more. On PASS, record `Last verifier: PASS full @<hash>` (`git log -1 --format=%H`) in docs/STATUS.md so /ship can reuse it. On FAIL, pass the report verbatim to team-implementer together with the plan's step list (it locates the step by commit, fixes and commits); team-verifier confirms with full verification (max 3 rounds; past that, stop and report to the CEO). If the CEO invoked /build directly, do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/review`" (inside a /run chain, run continues).
