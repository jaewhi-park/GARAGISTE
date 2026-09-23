---
description: Resume — reconcile the status board, the plan, worktrees and git, then continue from the next action. The lead runs it itself at the first turn of a session that injected a board and after any interruption
agent: team-lead
---
Resume previous work. Extra note: $ARGUMENTS

0. If docs/STATUS.md was not injected (a project from before the board was committed, or nothing ever ran), there is nothing to resume: say so; if `git branch -r --list 'origin/plan/*' 'origin/hotfix/*' 'origin/integrate/*'` shows work pushed from another checkout, name it (`git switch <branch>` then `/run <its plan>` continues it; a hotfix/* branch: `/hotfix <its request>` — the commit body quotes it); otherwise suggest in a sentence `/plan <top item of docs/BACKLOG.md>` (or `/backlog` when the backlog is empty; when there is no charter: `/brainstorm`, or `/kickoff` | `/assess <path>` per the Kind line of an approved docs/BRIEF.md). End.
1. Compare the board (auto-injected: docs/STATUS.md, the CEO's page, and docs/STATUS-team.md, the team's pointer) and the plan, spec section or brief it points to against `git status`, `git log -5` and `git branch --show-current`. If the board and the repository disagree, trust the repository and fix the board yourself. `git worktree list`: a worktree on a plan/* branch other than yours belongs to a builder or a parallel session — when the board's parallel list does not carry it as finished (`merged @` or a result), it was interrupted: record it as `<plan path> · <branch> · <path> · interrupted @<step k>` (k from `git -C <path> log --format=%s%n%b main..HEAD`, the last step commit). Uncommitted changes beyond docs-only files on a plan/* or hotfix/* branch are the interrupted step's work: leave them in place — /build continues that step from them. A board whose Shipped line is a merge hash, or a PR link (or `PR pending`) whose state is MERGED (`gh pr view <branch> --json state -q .state`; without gh, ask the CEO in one line), is stale: apply the branches-and-sync rule (switch to main, sync, delete the merged branch) and rewrite the board — Now: none, next action `/plan <top BACKLOG item>`. A board with `Shipped: —` or no Plan line is open — never stale; on main with an open board, sync as well.
2. If the last verifier result was FAIL, or there is a wip commit touching anything beyond docs-only files, run team-verifier first to establish the current state.
3. If decisions are waiting on the CEO, ask them first.
4. Resume from the first "next action" (a Plan line marked `rev <n> draft`, or a Spec line `F<n> · rev <k> in progress`, resumes with `/plan <that path or F<n>> 수정:` — the planner reports the draft's state; a Plan line `hotfix — …` with `Shipped: —` resumes with `/hotfix <that line>` — it continues on hotfix/<slug>; a board whose only Now line is a Brief line resumes with `/brainstorm` while it is brainstorm, draft, correction or any `revision …` state, with `/kickoff` or `/assess <path>` once approved and docs/CHARTER.md does not exist yet, and with `/backlog` when it says `revised`). Then act on the board's Mode (the lead's rule): `running` → do the /deliver procedure (read .opencode/commands/deliver.md) (it re-enters at the plan and step the board names) after answering the CEO's message; `paused — iteration review` → the iteration review again, from the board, and wait; `paused — stopped by CEO` or `blocked` → one line on why, and wait; `waiting on CEO` → the open question again in one line; no Mode line (before kickoff) → do the next action's procedure (read its command file).

## Branches and sync — the rule every command applies before starting on main
plan, spec, brief, kickoff and assess commits land on main (or master — the default branch); step and ship commits on plan/<slug> (a hotfix's on hotfix/<slug>); integration merges on integrate/<date> (/integrate) — main receives them only through /ship; backlog, retro, recruit, hire, brief-revision and spec-revision commits go on whatever branch is checked out (a plan amendment on its plan branch) (on a plan branch they ship with its PR — never switch branches for them). Before /plan and before a plan starts (/run, /build, /spawn, /hotfix), be on main (unrelated uncommitted files may stay — only the rebase below needs a clean tree): from a plan/*, hotfix/* or integrate/* branch whose work is shipped (STATUS `Shipped:` is a PR link or merge commit) `git switch main`; from an unshipped one that is not the plan about to continue, ask the CEO; on the branch of the plan about to continue, stay and skip the rest. This applies to the main checkout only: in a linked worktree (your directory is not the first line of `git worktree list`, the main checkout — a /spawn worktree session) skip it entirely and stay on the worktree's branch; its commits reach main through its own PR or /integrate. With a remote: `git fetch origin`; if origin/main does not exist yet, skip the sync and tell the CEO in one line to push main first; else `git merge --ff-only origin/main`, and if the branches diverged `git rebase origin/main` (local main carries only milestone commits); if the merge or the rebase refuses to start, or the rebase stops on a conflict (`git rebase --abort`), ask the CEO — never stash or reset. Then `git branch -d` each plan/*, hotfix/* or integrate/* branch whose PR is MERGED (`gh pr view <branch> --json state -q .state`) — together with the plan/* branches the board lists as merged into that integrate/* branch — never without that check — a pushed branch has an upstream and `-d` deletes it even when unmerged.

## Continuity — the repository is the truth, the board the pointer
- Cut points: The session is working memory; the repo is long-term memory. the board (both files) is committed at the cut points — the approval commits of /brainstorm, /kickoff, /assess and /plan, the board update that closes /ship and /hotfix (on main, `docs(status): <slug> shipped`), a question left waiting on the CEO (`docs(status): waiting on CEO`), /handoff, and a compaction stop — and changes uncommitted between them. The repository is the truth and the board the pointer: a stale board is rewritten from git, never the other way round. /handoff is for a session that stops mid-flight; a finished /ship or /plan already leaves the board and the commits in place. In a linked worktree (a /spawn worktree session — your directory is not the first line of `git worktree list`) the board belongs to the main checkout: never edit or commit docs/STATUS.md there; the branch's commits are its record.
- Interrupted (Esc, an error, a session that died mid-turn, a usage cap): on the next turn, before continuing anything, do the /resume procedure — `git status --porcelain`, `git branch --show-current`, `git worktree list`, `git log -3` against the board; the repository wins. Step commits are the checkpoints, so at most the step in progress is redone: /build continues it from the uncommitted changes in the tree, a /spawn worktree session continues its plan on its branch from the step after its last commit.
- Every command step is re-entrant: before doing it, check whether its output already exists — the file, the commit, the branch, the PR (`gh pr view <branch>`) — and skip it when it does. Recovery is re-running the command, not a separate procedure.
- Compaction cut: a compaction summary in your context is the signal, and the compaction plugin numbers it (this session's count). At 1 or 2 a compaction changes nothing — the board is injected again: reconcile it with git and continue the step; at 3 or more, finish the step in progress (never leave one half-verified), commit the board by path (`docs(status): compaction stop — step k/n`), report what is committed and end the turn: "start a new session and say 계속" — three summaries stacked degrade the work, and the new session resumes from the board. /handoff is the same by hand.
- A merge or rebase conflict on the board files alone is yours: rewrite them from the repository state (edit), `git add docs/STATUS.md docs/STATUS-team.md`, then `git merge --continue` or `git rebase --continue`. Any other conflict: ask the CEO — never stash or reset.
- Stage: /kickoff writes `pre-launch`, /assess writes `live`; it flips to `live` once, when the CEO says the product has real users or data — the lead sets the line, commits `docs(status): live` and says what changes; it never flips back.

## Board format — two files, the lead's alone, both injected into every session
The board is docs/STATUS.md — the CEO's page — and docs/STATUS-team.md — the team's pointer. Where a command says "the board" it means both; where it names a line (Mode, Stage, Run, Plans, Plan, Spec, Brief, Step, Counts, Shipped, Next actions, Parallel in progress) the file below that holds it; "Waiting on CEO" and "Check please" mean the CEO page's For you section, "Tryable now" its Try it section. "Commit the board" commits both files by path. The CEO's page stays under 1,800 characters and 200 per line (the guardrail refuses a write over it) and uses plain words — never a plan, backlog, spec or PR number the CEO would have to look up; the team's pointer stays under 40 lines.

docs/STATUS.md
```
# STATUS
Updated: <time> · Stage: pre-launch | live · Run: <AGENTS.md build/run command → URL> | not yet
Mode: running | paused — iteration review | paused — stopped by CEO | paused — blocked: <what> | waiting on CEO | none (before kickoff)
## Try it
- <run command> → <3–5 numbered steps in plain words: one script for the whole iteration, replaced at the next review>
## For you
- <at most three lines, each starting with a verb — a decision with its default ("… — default: <x>"), a screen or a text the team wants seen, a thing only the CEO can do> | none
## Decided by default
- <at most five lines — what the team settled this iteration without asking, one sentence each; the CEO overturns any of them by saying so> | none
```
docs/STATUS-team.md
```
# STATUS (team)
## Iteration <k>
- Plans: <item or plan path ✓ | ▶ step k/n | —> … · ends: <last> shipped
- Next iteration: <the items it would take>
## Now
- Plan: docs/plans/NNNN-<slug>.md [· rev <n> [draft]] | parallel — <n> plans | integration of <n> plans | hotfix — <one line> · Branch: <name> | main | integrate/<date> | hotfix/<slug> | none yet · Shipped: PR <link> | PR pending — <branch> pushed | merge <hash> | —
- Spec: F<n> · rev <k> in progress (only during a spec-section revision — /plan's `F<n> 수정:` path)
- Brief: docs/BRIEF.md · brainstorm (checkpoint <k>) | draft | correction <k> | approved · Kind: 신규 | 레거시 (<path>) (until /kickoff or /assess has run) | revision (checkpoint <k>) | revision draft | revision correction <k> | revised (rev <n>) (a /brainstorm revision; /backlog clears it)
- Step: <k>/<n> — <state> | none · Last verifier: proven (self-check) | PASS quick | PASS full @<hash> | FAIL(<summary>)
- Open review findings: <lens: item> or none
- Counts: verifier FAIL <n> · review blockers <n> · CEO questions <n> · corrections <k>
## Parallel in progress (from /spawn until /ship)
- <plan path> · <branch> · <worktree path> · <result> | merged @<hash>
## Next actions (in order on resume)
1.
## Notes
- <at most five lines the next session must know — an environment fact, a convention the CEO set; a lesson goes to /retro, a rule to AGENTS.md>
```
