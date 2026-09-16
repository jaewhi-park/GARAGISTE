# GARAGISTE — Claude Code flavor

Human manual: **GUIDE.md** (install, what to do in each situation). Artifact map: docs/README.md. This file is the configuration reference. 한국어: README.ko.md, GUIDE.ko.md.

Run one repository like a small software company. The human is the CEO (direction, the product's acceptance, the word on `risk:high` merges once live); the agents are the team, and the team runs itself in iterations. A company is not an org chart but five loops: product (backlog) → engineering (plan, implement) → quality (verify, review) → operations (ship, release) → governance (decision records, retros). Each loop is one `/skill` and one `docs/` artifact.

## Install
From the repository root: `./install.sh claude [-Project <path>|.] [-Global]` / `.\install.ps1 claude [-Project <path>] [-Global]`. Default is the current directory (its git repo root). `-Global` → ~/.claude (every repo; no default agent is forced, start with `claude --agent team-lead`). Running `claude/install.sh` directly works too.

```
./install.sh claude -Project <repo path>        # macOS / Linux / WSL
.\install.ps1 claude -Project <repo path>       # Windows PowerShell
```
Installs `.claude/{agents,skills,hooks,scripts}` and `docs/README.md`, and merges `.claude/settings.json` (existing values kept, lists unioned). Accept the folder-trust prompt on first run so hooks are enabled. Models are inherited from the session (no `model:` in agent files). Commit `.claude/`.

## CEO console (skills = slash commands)
| Loop | Command | Artifact |
|---|---|---|
| Governance | `/brainstorm <idea or file>` → `/kickoff` / `/assess <target>` | docs/BRIEF.md (the product brief: brainstorm or your document → one round of non-goals, defaults and the critic's pre-mortem → approval), then docs/CHARTER.md, docs/adr/, docs/specs/, docs/BACKLOG.md, CLAUDE.md, (legacy) docs/ASSESSMENT.md · docs/REBUILD_PLAN.md · parity-harness plan; /hire in the closing step, then the board |
| Running mode | (no command — say "계속") / `deliver` | one iteration: 2–4 plans through plan → run → merge, then an iteration review; docs/STATUS.md carries Mode, Iteration, Tryable now; `instruction` (a knowledge skill) is how the lead turns what the CEO says into the right procedure |
| Product | `/backlog [idea]` | docs/BACKLOG.md (+ GitHub Issues) |
| Engineering | `/plan <item>` → `/run <plan>` (or `/build`); `/plan <F<n> or plan> 수정: …` | no questions: docs/plans/*.md from its spec section (docs/specs/) (one to four `proves` lines per logic step, at most 4 logic steps per plan), the critic's APPROVE is the approval, one commit per step with its tests first (red → green); a revision writes only the differences, sorts the plans, and a running plan continues on its branch |
| Hotfix | `/hotfix <what and why>` | one pass on hotfix/<slug>, no plan file: implement + regression test → full verification → one correctness lens → PR (never auto-merged) or local merge; over 3 files / 50 logic lines or on a Risk path it stops and points at /plan; one docs/METRICS.md line marked `hotfix:` |
| Parallel | `/parallel <plans>` → `/integrate` → `/ship` | one branch per worktree → serial merge queue into `integrate/<date>` → one PR |
| Quality | `/review` | test-file floor (a logic commit with no test file stops it), then risk-proportional review (2 lenses by default, 4 for high risk) → fix loop |
| Operations | `/ship` → `/release [ver]` · `/policy` | PR (risk label; a "Proven" section first — the tests, red → green, and the command to run them; a "Try it" section for user-facing plans, never auto-merged) or local merge, CHANGELOG, docs/releases/*.md |
| Governance | `/retro <subject>` | CLAUDE.md rules / skills / hooks updated |
| Handoff | `/handoff` (mid-flight only) / `/resume` (the lead runs it itself at session start) | docs/STATUS.md (committed at the cut points) |
| Team | `/hire` / `/roster` | per-role model and effort assignment and the operating profile, both via script; roster table |
| Language | `/lang [code]` | rewrites the `## Language` section of CLAUDE.md via script, effective immediately |
| Recruiting | `/recruit <gap>` | new role from a permission preset, model and effort copied from the sibling role; created by script on approval |

## Team (.claude/agents/)
| Agent | Role | Tools | Notes |
|---|---|---|---|
| team-lead | tech lead / EM; main-session agent | Agent(team-*, Explore), Read/Grep/Glob, Bash, Edit/Write, AskUserQuestion | Edit/Write on docs/STATUS.md only; shell read-only plus git branch/merge/sync commands, docs-only `git add`/`commit` (docs/, CLAUDE.md, .claude/, .gitignore, CHANGELOG), branch pushes, gh PR commands and the scripts; never runs code, never writes through the shell, never commits a code path — all hook-enforced; default via `settings.agent` |
| team-planner | architect; docs, plans, specs, ADRs | Read/Grep/Glob, Edit/Write, Bash, Web* | `memory: project` — accumulates architecture knowledge; shell read-only (hook) |
| team-critic | design review (pre-mortem) | Read/Grep/Glob | read-only |
| team-implementer | senior engineer (main checkout, sequential) | Read/Grep/Glob, Edit/Write, Bash | commits; pushes and opens the PR in /ship |
| team-builder | senior engineer (parallel) | same | `isolation: worktree` — implements a whole plan in its own worktree, self-verifies; may push its branch, never merges, rebases or pulls (hook) |
| team-reviewer | per-lens code review (correctness · security · performance · maintainability · ux) | Read/Grep/Glob, Bash | `memory: project` — accumulates recurring defect patterns; shell read-only plus the toolchain to run a test (hook) |
| team-verifier | CI | Bash, Read/Grep/Glob | hook allow-list: build/test/lint tools, read-only git, and every command listed under CLAUDE.md "## Commands" (the hook reads the file); what an `npm run` script executes is not inspected |
| Explore | codebase research (built-in) | read-only | |

## Contracts between agents
- Every subagent reports in a fixed format (implementer: a Proven line per proves line, red → green; verifier: PASS/FAIL; reviewer/critic: last line APPROVE/REVISE).
- Only the lead asks the CEO. Format: one-sentence decision / options / recommendation / default if unanswered — except /brainstorm and the revision discussions, where open questions and free-text answers are allowed.
- Fix loops are capped at 3 rounds; past that, stop and report.
- Autonomous decisions go to docs/DECISIONS.md, architecture decisions to docs/adr/.

## Running it like a company
- Morning: confirm today's items with `/backlog` → approve `/plan` → `/run` (see parallelism below)
- Day: answer only the lead's AskUserQuestion prompts. Everything else is autonomous.
- Evening: `/run` finishes with ship → merge per policy. Weekly `/release`; `/retro` when failures repeat.
- The human's three jobs: brainstorm and approve the brief / look at the product and say what they want / answer escalations and say merge or hold on live `risk:high` PRs. Plans are approved by the critic, `risk:low` work is merged by the lead, the spec (docs/specs/) is the team's.

## Workflow — sequential by default, parallel by choice
The default (`/build`, inside `/run`) implements one plan in one session, step by step, in the main checkout. Ask for several features and the lead makes several `/plan`s and runs them one after another. No worktrees, no merges, no conflicts by construction. Most personal projects need nothing more.

When you do need parallelism, try in this order:
1. **Session-level**: one terminal per feature with `claude --worktree <feature>` → each session runs /plan → /run. You merge PRs in order; ask later branches to "rebase on main and re-verify". Simplest and most robust.
2. **In-session** (`/parallel` → `/integrate`): the lead launches one team-builder per plan; builders implement, self-verify and commit in isolated worktrees and report their branches. `/integrate` reviews, merges (conflicts resolved by the implementer), and verifies **one branch at a time** into an integration branch cut from main; `/ship` then ships it as one PR (or one local merge). `worktree.baseRef: head` makes builders branch from the session's current branch.
3. **Agent teams** (experimental): set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `settings.json` → `env`. Teammates share a task list and talk to each other. Only when modules are truly independent and teammates need to coordinate.

Rule: the unit of parallelism is a plan (feature), not a step. Run only plans whose "files touched" sets do not overlap. Integration is always serial, with the verifier after every merge.

## Merge policy — resolved automatically
`/ship` decides from repository state. No config edits needed.
| Repository state | Verdict | Behaviour |
|---|---|---|
| no remote | `local` | PR description saved to docs/prs/, local `merge --no-ff` into main after approval |
| remote, no main protection / auto-merge | `manual` | push branch + PR (risk label); human merges |
| remote + protected main (required checks) + auto-merge allowed | `auto-low-risk` | `risk:low` → `gh pr merge --auto`; `risk:high` → the lead pre-launch, the CEO's word once live |
"Turning on auto-merge" therefore means enabling protection and auto-merge on GitHub — which is exactly the safety condition. `/policy` shows the verdict and reason; write an override (`manual`/`auto-low-risk`) into CLAUDE.md only when you really need to. Hooks block force pushes and direct pushes to main under every verdict.

## Local-only (early build-up without a remote)
When `git remote` is empty, `/ship` writes the PR description to docs/prs/NNNN-<slug>.md and merges into local main with `git merge --no-ff` per policy. The gates stay: one plan = one branch, verifier, review, risk label, merge-commit rollback. `/release` creates a local tag after approval. Adding GitHub switches the next `/ship` to the PR flow automatically.

## Models and budget
**The recommended path is `/hire`.** The lead confirms candidates (aliases opus/sonnet/haiku, plus API model IDs you name), asks budget tier, project character and parallel plans, and proposes a role × model × effort table with reasons. On approval it applies via `scripts/apply-models.mjs` (which only changes model/effort lines) and leaves an "Operating profile" in CLAUDE.md. `/kickoff` and `/assess` run it in their closing step. The `--budget` profiles below are for non-interactive use; pass `-Budget <tier>` at install time so the first (kickoff/assess) session already runs the verifier on haiku, and `/hire` refines it.

Default is `inherit`. Aliases resolve to the plan's latest models, so no detection is needed; the tier is your choice of usage cap: unlimited (API/in-house) · high (Max 20x) · medium (Max 5x) · low (Pro). The plan cannot be read from the CLI, so a human chooses.

| Role | unlimited | high | medium | low |
|---|---|---|---|---|
| session (lead) | opus · high | opus · high | opus · medium | sonnet · medium |
| planner | opus · high | opus · high | opus · medium | sonnet · high |
| critic | opus · high | opus · high | sonnet · high | sonnet · medium |
| implementer / builder | opus · medium | opus · medium | sonnet · medium | sonnet · medium |
| reviewer | opus · high | opus · medium | sonnet · high | sonnet · medium |
| verifier | haiku · low | haiku · low | haiku · low | haiku · low |

Same principle: strong model and high effort where judgment happens; save on volume (implementation) and verdicts (verifier). On `low`, avoid parallel review and `/parallel` (the cap is a 5-hour window).
Change: re-run `./install.sh claude -Budget <tier>`, per-agent with `-Set team-implementer=sonnet:high`, back with `-Budget inherit`. `/roster` shows the assignment; Claude Code's `/model` changes the session model only and `/agents` edits interactively.

## Session lifecycle
The session is working memory; the repo is long-term memory. State lives in three places — one commit per step, the plan file (committed at approval), `docs/STATUS.md` (the board: auto-injected by the SessionStart hook, committed at the cut points — the approval commits, ship, a question waiting on the CEO, handoff, a compaction stop — and changed uncommitted between them; the repository is the truth and the board the pointer). One session = one plan (PR). A finished /ship or /plan leaves board and commits in place; when a board exists the lead runs `resume` itself at the first turn (board against git, worktrees and PR state — the repository wins), so the CEO just talks; `/handoff` only when stopping mid-flight. Interruptions (Esc, an error, a usage cap) cost at most the step in progress: step commits are the checkpoints, /build continues an interrupted step from the uncommitted changes and /parallel relaunches an interrupted builder on its branch. Compactions are counted by the PreCompact hook (`.claude/session/compactions`); at one or more the lead finishes the step, commits the board and ends the session. Use `claude --continue` only for short interruptions. Planner and reviewer accumulate long-term knowledge in `.claude/agent-memory/<name>/` (requires auto memory enabled).

## Differences from the opencode flavor
- Role rules are enforced by `guardrails.mjs` from the hook's `agent_type`, mirroring the opencode permission blocks but as deny-lists of what changes state rather than allow-lists of tool names (a new stack needs no new pattern): team-lead edits docs/STATUS.md only, its shell is read-only plus git branch/merge/sync, docs-only `git add`/`commit` (the hook refuses a code path), branch pushes and gh PR commands — no code runs, no shell writes; team-planner (and Explore) edit only docs/** and CLAUDE.md and their shell is read-only (git status/diff/log/show, listings, version and dependency checks); team-reviewer's shell is read-only plus the toolchain, so it can run a test to check a claim; team-builder may push its branch but cannot merge, rebase, pull or touch worktrees; team-verifier runs the toolchain plus whatever CLAUDE.md's "## Commands" lists — an allow-list, because it is CI. team-implementer and team-critic are scoped by their tools line and the generic rules; a role created by /recruit gets the generic rules only — add an `agent_type` branch to the hook for a hard boundary.
- Secret-file blocking (`.env*`, `.envrc`, keys, certificates, `credentials`, `.netrc`, `.npmrc`, `.git-credentials`) applies to Read/Edit/Write/Grep via the hook and deny rules, and the hook blocks shell commands that name such a file next to a program that prints or evaluates files — also behind `sudo`, `xargs`, `find -exec`, `$( )`, pipelines, `git show <rev>:.env`, and `node -e` / `python -c` one-liners. Best effort: a program that opens the file without naming it (a script, `env`) is not caught — keep secrets out of the repo.
- `permissions.deny` is session-wide. Force pushes, direct pushes to main and publishing (`npm publish`, `cargo publish`, `docker push`, …) are blocked by deny rules and hooks; feature-branch pushes are allowed. `permissions.allow` pre-approves the stack's build/test tools and the git/gh commands the team uses, so the default permission mode does not prompt for every implementer test run; a command outside the list still prompts.
- The `Agent(...)` list on the main-session agent (`--agent` / `settings.agent`) is the allowlist of subagents the lead may call. Inside a subagent definition the parenthesized list is ignored.
- `memory: project` gives roles long-term memory — the company's accumulated experience.

## Notes
- No command skill is CEO-only: the lead runs any of them as a procedure when the CEO's words call for it (the `instruction` skill's triage) or the running loop does (`deliver`); the CEO may still type any. Knowledge skills carry `user-invocable: false`: hidden from the menu, loaded by agents when needed.
- Under the default permission mode on Pro/Max (auto), subagents inherit the parent's mode. The team's safety comes from tool lists, deny rules and hooks, not from prompts: run the session in a mode that does not stop for each allowed tool call (`claude --permission-mode acceptEdits`, or accept the tool prompts once), otherwise every implementer edit and test run waits on you.
- Hooks are written in Node and run unchanged on Windows. The patterns are a starting set; tune them to your stack.
