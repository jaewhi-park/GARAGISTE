# GARAGISTE — opencode flavor

Human manual: **GUIDE.md** (install, what to do in each situation). Artifact map: docs/README.md. This file is the configuration reference. 한국어: README.ko.md, GUIDE.ko.md.

The team's *character* (roles, permissions, procedures) lives in this template; the project's *facts* (commands, structure, decisions) live in the repo's AGENTS.md and docs/. The team onboards itself into a new repo with /brainstorm, then /kickoff or /assess.

## Install
From the repository root: `./install.sh opencode [-Project <path>|.] [-Global]` / `.\install.ps1 opencode [-Project <path>] [-Global]`. Default is the current directory (its git repo root). `-Global` → ~/.config/opencode (every repo). Running `opencode/install.sh` directly works too (without the flavor argument).

```
./install.sh opencode -Project <repo path>        # macOS / Linux / WSL
.\install.ps1 opencode -Project <repo path>       # Windows PowerShell
```
What the script does: back up existing config (project mode: to a temp dir) → copy team files (overwrites same-named files only) → merge `opencode.json` (union of `instructions`, `permission` and `agent` entries only for missing keys; `subagent_depth` set only if absent). It never touches provider or model — the template specifies no model, so the existing opencode provider/model is inherited. `--model` only if you want to override. `-DryRun` previews. If the existing config is `.jsonc`, the merge is skipped with manual instructions.

Precedence: when both global and project define an agent or command of the same name, the project wins.

Then run `opencode` in the repo → Tab to select `team-lead`.

## CEO console
| Command | When |
|---|---|
| `/brainstorm <idea or file>` | Product brief (docs/BRIEF.md): free brainstorming with the lead, or a document you wrote → one round of non-goals, defaults and the critic's pre-mortem → approval → commit. Run it again to revise the brief (pivot) |
| `/kickoff` | New project, from the approved brief, documents only. Charter → stack ADR → one question → AGENTS.md, spec index (docs/SPEC.md; the docs/specs/ files come with /plan), backlog, plan 0001 (the scaffold and at most two steps) → one critic pass → /hire |
| `/assess <target>` | Legacy, from the approved brief. Inventory (docs/ASSESSMENT.md) and AGENTS.md, its commands run by the verifier → preserve/fix policy → charter and strategy ADR → one question → docs/REBUILD_PLAN.md and the parity-harness plan for the first seam → one critic pass → /hire |
| `/backlog [idea]` | Product: backlog items with completion criteria and priority (docs/BACKLOG.md, optional GitHub Issues) |
| `/plan <item>` | No questions: planner writes from the spec section (docs/specs/), the bug line or your words (one to four `proves` lines per logic step, at most 4 logic steps per plan) → critic reviews every plan and its APPROVE is the approval; `/plan <F<n> or plan> 수정: …` revises a spec section or amends a running plan (differences only, the plans sorted, same branch) |
| (no command — say "계속") / `/deliver` | One iteration: 2–4 plans through plan → run → merge, then an iteration review; docs/STATUS.md carries Mode, Iteration, Tryable now. The lead turns what the CEO says into the right procedure per the `instruction` skill |
| `/run <plan file>` | Default path: build → review → ship in one go, stopping only at gates |
| `/build <plan>` | Step by step: the implementer proves each step red → green (tests in the step's commit); the verifier gives the full verdict at the end |
| `/hotfix <what and why>` | Small, well-specified change without a plan: implement + regression test → full verification → one correctness lens → PR (never auto-merged) or local merge on hotfix/<slug>; over 3 files / 50 logic lines or on a Risk path it stops and points at /plan; one docs/METRICS.md line marked `hotfix:` |
| `/review [base]` | Risk-proportional review (2 lenses by default, 4 for high risk) → fix loop |
| `/ship` | Full verification · docs · risk label · a "Proven" section first (the tests, red → green, and the command to run them) · a "Try it" section for user-facing plans (never auto-merged) · automatic merge-policy resolution → PR or local merge |
| `/release [version]` | Operations: version, CHANGELOG, release notes (docs/releases/*.md), tag commands |
| `/policy [value]` | Show the current merge-policy verdict and reason; optionally override |
| `/hire [note]` | Assign models per role and the operating profile from available models, budget and project character (applied from the kickoff/assess budget answer, no approval question; both via script) |
| `/roster` | Table of agents, models and permissions, plus how to change them |
| `/lang [code]` | Set the working language: rewrites the `## Language` section of AGENTS.md via script, effective immediately |
| `/recruit <gap>` | Propose a new role (preset permissions, model taken from the sibling role in the roster); created by script on CEO approval |
| `/spawn <plans>` | Parallel: create a worktree and branch per plan, print the new-session command |
| `/integrate [branches]` | Merge queue into `integrate/<date>`: per-branch review → merge → conflict resolution → verifier, serially; `/ship` then ships that branch as one PR |
| `/retro <subject>` | Feed failures back into AGENTS.md rules, skills or guardrails |
| `/handoff [note]` | Wrap up a session that stops mid-flight: write and commit STATUS.md, commit WIP, list pending decisions |
| `/resume [note]` | Reconcile STATUS.md, plan, worktrees and git, then continue; the lead does it itself at the first turn when a board exists, and after any interruption |

## Team
| Agent | mode | Can | Cannot |
|---|---|---|---|
| team-lead | primary | delegate, judge, ask the CEO, read git, edit docs/STATUS.md | edit other files, run code, commit |
| team-planner | subagent | write docs/**, AGENTS.md | edit code |
| team-critic | subagent | plan pre-mortem | edit anything |
| team-implementer | subagent (hidden) | implement, test, commit; push and open PR in /ship | force push, push to main, ask the CEO |
| team-reviewer | subagent | per-lens review (correctness · security · performance · maintainability · ux; git diff, tests, screenshots) | edit |
| team-verifier | subagent | run tests, lint, build | edit, delegate |
| explore | built-in | codebase and dependency research (bash limited to a read-only allowlist via opencode.json) | edit, anything not on the allowlist |

## Contracts between agents
- Every subagent reports in a fixed format (implementer: a Proven line per proves line, red → green; verifier: PASS/FAIL; reviewer/critic: last line APPROVE/REVISE).
- Only the lead asks the CEO. Format: one-sentence decision / options / recommendation / default if unanswered — except /brainstorm and the revision discussions, where open questions and free-text answers are allowed.
- Fix loops are capped at 3 rounds; past that, stop and report.
- Autonomous decisions go to docs/DECISIONS.md, architecture decisions to docs/adr/.

## Session lifecycle
The session is working memory; the repo is long-term memory. State lives in three places — one commit per step, the plan file (committed at approval), `docs/STATUS.md` (the board — auto-injected every session, committed at the cut points: the approval commits, ship, a question waiting on the CEO, handoff, a compaction stop; changed uncommitted between them, and the repository is the truth). When a board exists the lead reconciles it at the first turn, so the CEO just talks; an interruption costs at most the step in progress (step commits are the checkpoints). A compaction summary in the lead's context is its signal to finish the step, commit the board and end the session.
- One session = one plan (PR). Start other work in a new session.
- Ending: a finished `/ship` or `/plan` already leaves the board and the commits in place — just close. `/handoff` only when stopping mid-step, after two or more compactions, or when the team is going in circles.
- Continuing: with a board, new session → `/resume`; without one (fresh clone, worktree, nothing in progress) go straight to `/plan <backlog item>`. Use `opencode -c` (continue the last session) only for a short interruption the same day. Long sessions stack summaries on summaries and degrade.
- Mid-session compaction: `plugins/compaction.ts` forces the board's items into the summary.

## Parallelism and merging
- Parallelism is session-level: `/spawn` creates a worktree (`../<repo>-<slug>`) and branch per plan; a separate `opencode` session runs `/build` in each worktree; `/integrate` in the main session reviews, merges and verifies branches one at a time (merge queue) into an integration branch cut from main, which `/ship` then ships as one PR (or one local merge). opencode subagents have no worktree isolation, so in-session parallelism is not supported.
- The merge policy is resolved automatically by `/ship`: no remote → `local` (PR document + local merge into main after approval); remote + protected main + auto-merge → `auto-low-risk` (`risk:low` PRs auto-merge once CI passes; `risk:high`: the lead pre-launch, the CEO's word once live); otherwise → `manual` (the team opens the PR and merges by the same rule). Leave the "## Merge policy" line in AGENTS.md empty by default; writing a value overrides. `/policy` shows the verdict and reason. The plugin blocks force pushes and direct pushes to main in every case.

## Local-only (early build-up without a remote)
When `git remote` is empty, `/ship` writes the PR description to docs/prs/NNNN-<slug>.md and merges into local main with `git merge --no-ff` per policy (after CEO approval in manual). The gates stay: one plan = one branch, verifier, review, risk label, merge-commit rollback (`git revert -m 1`). `/release` creates a local tag after approval. When you add GitHub (`git remote add origin …`), the next `/ship` switches to the PR flow automatically, and enabling protection + auto-merge on main switches to auto-low-risk. No config edits.

## Models and budget
**The recommended path is `/hire`.** The lead lists available models (`opencode models`), asks budget tier, project character and parallel plans, and proposes a role × model table with reasons. On approval it applies via `scripts/apply-models.mjs` (which only changes `model:` lines) and leaves an "Operating profile" (default lenses, parallelism, critic threshold, per-step verifier, step-size target) in AGENTS.md. `/kickoff` and `/assess` run it in their closing step. The `--budget` profiles below are for non-interactive/scripted use; pass `-Budget <tier> -Strong <id> -Fast <id>` at install time so the first (kickoff/assess) session already runs the verifier on the fast model, and `/hire` refines it.

Default is `inherit` (no model lines → session provider/model). `-Budget` distributes two models (strong/fast) across roles; `-Strong`/`-Fast` are required.

| Role | unlimited | high | medium | low |
|---|---|---|---|---|
| lead / planner / critic | strong | strong | strong | planner·critic strong, lead fast |
| implementer | strong | strong | fast | fast |
| reviewer | strong | strong | strong | fast |
| verifier | fast | fast | fast | fast |

Keep the strongest model where judgment happens (planning, design review, code review); save on volume (implementation) and on the verdict-only role (verifier).
Change: re-run `./install.sh opencode -Budget <tier> -Strong <id> -Fast <id>`, per-agent with `-Set team-reviewer=<id>`, back to inheritance with `-Budget inherit`. `/roster` shows the current assignment.

## Customization points
- `agents/team-verifier.md` — the bash allow-list of build/test/lint tools; add your stack's runner when it is missing (it restricts which tools run, not what their scripts execute). The Claude Code flavor reads the rules file's "## Commands" instead; opencode's permission blocks cannot, so the list is explicit here. Register project commands — the `screenshots:` command included — as package scripts or make targets, so the list covers them without a bare `node …` entry.
- `agents/team-lead.md` — escalation criteria (the charter's "Additional escalation items" are added).
- `plugins/guardrails.ts` — blocked-command patterns.
- `opencode.json` — `instructions` auto-injects docs/CHARTER*.md and docs/STATUS*.md every session. No model = inherit. `subagent_depth: 2` lets team-planner/implementer/reviewer/critic (subagents) each call the explore subagent themselves — opencode's default of 1 would block that and fail the call silently. docs/STATUS.md is the board: committed at the cut points (the installer removes an older `.gitignore` line for it) and injected every session.
- Per-role models: add `model: provider/id` to the agent frontmatter (or use /hire). Subagents without a model follow the invoking primary agent.
- `temperature` and `steps` per agent are role-based starting values.

## Known caveats
- Edit-permission patterns are matched against the path relative to the repo root (`docs/plans/x.md`, `AGENTS.md`) and `*` is a plain `.*`. Write `docs/*`, never `**/docs/**`: the `**/` form demands a leading slash and matches nothing. On first use, check that the planner can write inside docs/ but not outside. The same `.*` applies to the lead's `git add docs/*`: it is a prefix match, so a code path appended after a docs path is not caught here — the lead's prompt carries that rule (the Claude Code hook checks every path).
- The built-in explore agent has bash and would inherit the global `ask`, so every `ls` or `git rev-parse` during research prompted. `opencode.json` gives it a read-only allowlist under `agent.explore.permission.bash`; anything else is denied without a prompt and explore falls back to grep/glob/read. Extend the list for your stack.
- Agents may not load skills on their own, so commands name the skills to load explicitly.
- In headless runs (`opencode run`) permission prompts cannot appear. Team agents use explicit allow/deny; the built-in build/plan agents follow the global default (ask).
