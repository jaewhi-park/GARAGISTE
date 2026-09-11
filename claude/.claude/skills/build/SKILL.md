---
name: build
description: Implement an approved plan step by step (implementer → verifier loop)
argument-hint: "[plan file path]"
---
This skill runs only when the CEO invoked it directly or when /run chains it via the Skill tool. Never invoke it on your own otherwise.

Execute the approved plan: $ARGUMENTS (plan file path)

0. Read the plan file (it is short). If the current branch is already plan/<slug> (a /parallel or `claude --worktree` checkout, or the board names it), stay on it and continue from the step after the last PASS the board records (a plan amended with `Revised: <date> (from step k)` continues at step k — the steps before it are unchanged and already committed; a header still marked `draft` is not approved: stop and say so) — or, without a board, after the last step commit on the branch (`git log --format=%s%n%b main..HEAD` names plan and step); step 1 when there is neither. In a linked worktree on any other branch, stay on it too — the branch was cut when the worktree was made. Otherwise, on main: apply the branches-and-sync rule (synced), make sure the plan file is committed (`git status --porcelain <plan path>` prints nothing; if not, team-implementer commits it as `docs(plan): NNNN-<slug>` first), then `git switch -c plan/<slug>` yourself (slug from the plan filename). If that branch already exists locally or as origin/plan/<slug>: `git switch plan/<slug>` when its PR is not MERGED (`gh pr view plan/<slug> --json state -q .state`, or no remote) — an abandoned earlier run continues there; when it is MERGED, stop and ask the CEO to delete it first. One plan = one branch. Record the plan and branch in docs/STATUS.md (Shipped: —).

For each step, in order (steps of one plan never run in parallel; only whole independent plans do, via the CEO's /parallel):
1. Assign exactly that step to team-implementer, naming the plan file path and step number and quoting the step's lines.
2. Run quick verification with team-verifier (CLAUDE.md: quick tests, lint, typecheck). Exception: when CLAUDE.md's "## Operating profile" says `per-step verifier: off`, skip it if the implementer's report lists every quick-verification command at exit 0 and the step touches no escalation criterion — the independent verdict is then the full verification below. On FAIL, add one to the board's `verifier FAIL` count and pass the failure report verbatim to the implementer to fix (max 3 rounds; past that, stop and report to the CEO).
3. On PASS — or, with the verifier off, an all-exit-0 implementer report, recorded as `self-check quick` — update the Step line (state and Last verifier) of docs/STATUS.md yourself and move to the next step.

When all steps are done, run full verification with team-verifier once more. On PASS, record `Last verifier: PASS full @<hash>` (`git log -1 --format=%H`) in docs/STATUS.md so /ship can reuse it. On FAIL, add one to the board's `verifier FAIL` count and pass the report verbatim to team-implementer together with the plan's step list (it locates the step by commit, fixes and commits); team-verifier confirms with full verification (max 3 rounds; past that, stop and report to the CEO). If the CEO invoked /build directly, do not call it via the Skill tool — suggest to the CEO in a sentence: "run `/review`" (inside a /run chain, run continues).
