# GARAGISTE — opencode flavor

Human manual: **GUIDE.md** (install, what to do in each situation). Artifact map: docs/README.md. This file is the configuration reference. 한국어: README.ko.md, GUIDE.ko.md.

The team's *character* (roles, permissions, procedures) lives in this template; the project's *facts* (commands, structure, decisions) live in the repo's AGENTS.md and docs/. The team onboards itself into a new repo with /kickoff or /assess.

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
| `/kickoff <idea>` | New project. Charter → stack ADR → skeleton → AGENTS.md → first plan → /hire |
| `/assess <target>` | Legacy. Inventory → parity harness → rebuild strategy ADR → AGENTS.md → /hire |
| `/backlog [idea]` | Product: spec-carrying backlog items with priority (docs/BACKLOG.md, optional GitHub Issues) |
| `/plan <item>` | Planner writes → critic reviews (3+ steps or risk:high) → approval requested |
| `/run <plan file>` | Default path: build → review → ship in one go, stopping only at gates |
| `/build <plan>` | Step-by-step implementer → verifier loop |
| `/review [base]` | Risk-proportional review (2 lenses by default, 4 for high risk) → fix loop |
| `/ship` | Full verification · docs · risk label · automatic merge-policy resolution → PR or local merge |
| `/release [version]` | Operations: version, CHANGELOG, release notes, tag commands |
| `/policy [value]` | Show the current merge-policy verdict and reason; optionally override |
| `/hire [note]` | Assign models per role from available models, budget and project character (CEO approves) |
| `/roster` | Table of agents, models and permissions, plus how to change them |
| `/lang [code]` | Set the working language: rewrites the `## Language` section of AGENTS.md via script, effective immediately |
| `/recruit <gap>` | Propose a new role (preset permissions, model taken from the sibling role in the roster); created by script on CEO approval |
| `/spawn <plans>` | Parallel: create a worktree and branch per plan, print the new-session command |
| `/integrate [branches]` | Merge queue: per-branch review → merge → conflict resolution → verifier, serially |
| `/retro <subject>` | Feed failures back into AGENTS.md rules, skills or guardrails |
| `/handoff [note]` | Wrap up: update STATUS.md, commit WIP, list pending decisions |
| `/resume [note]` | First command of a new session: reconcile STATUS.md, plan and git, then continue |

## Team
| Agent | mode | Can | Cannot |
|---|---|---|---|
| team-lead | primary | delegate, judge, ask the CEO, read git, edit docs/STATUS.md | edit other files, run code |
| team-planner | subagent | write docs/**, AGENTS.md | edit code |
| team-critic | subagent | plan pre-mortem | edit anything |
| team-implementer | subagent (hidden) | implement, test, commit; push and open PR in /ship | force push, push to main, ask the CEO |
| team-reviewer | subagent | per-lens review (git diff) | edit |
| team-verifier | subagent | run tests, lint, build | edit, delegate |
| explore | built-in | codebase and dependency research (bash limited to a read-only allowlist via opencode.json) | edit, anything not on the allowlist |

## Contracts between agents
- Every subagent reports in a fixed format (verifier: PASS/FAIL; reviewer/critic: last line APPROVE/REVISE).
- Only the lead asks the CEO. Format: one-sentence decision / options / recommendation / default if unanswered.
- Fix loops are capped at 3 rounds; past that, stop and report.
- Autonomous decisions go to docs/DECISIONS.md, architecture decisions to docs/adr/.

## Parallelism and merging
- Parallelism is session-level: `/spawn` creates a worktree (`../<repo>-<slug>`) and branch per plan; a separate `opencode` session runs `/build` in each worktree; `/integrate` in the main session reviews, merges and verifies branches one at a time (merge queue). opencode subagents have no worktree isolation, so in-session parallelism is not supported.
- The merge policy is resolved automatically by `/ship`: no remote → `local` (PR document + local merge into main after approval); remote + protected main + auto-merge → `auto-low-risk` (`risk:low` PRs auto-merge once CI passes; `risk:high` is human); otherwise → `manual` (PR only, human merges). Leave the "## Merge policy" line in AGENTS.md empty by default; writing a value overrides. `/policy` shows the verdict and reason. The plugin blocks force pushes and direct pushes to main in every case.

## Local-only (early build-up without a remote)
When `git remote` is empty, `/ship` writes the PR description to docs/prs/NNNN-<slug>.md and merges into local main with `git merge --no-ff` per policy (after CEO approval in manual). The gates stay: one plan = one branch, verifier, review, risk label, merge-commit rollback (`git revert -m 1`). `/release` creates a local tag after approval. When you add GitHub (`git remote add origin …`), the next `/ship` switches to the PR flow automatically, and enabling protection + auto-merge on main switches to auto-low-risk. No config edits.

## Models and budget
**The recommended path is `/hire`.** The lead lists available models (`opencode models`), asks budget tier, project character and parallel plans, and proposes a role × model table with reasons. On approval it applies via `scripts/apply-models.mjs` (which only changes `model:` lines) and leaves an "Operating profile" (default lenses, parallelism, critic threshold) in AGENTS.md. `/kickoff` and `/assess` end by suggesting it. The `--budget` profiles below are for non-interactive/scripted use.

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
- `agents/team-verifier.md` — trim the bash allow-list to your stack.
- `agents/team-lead.md` — escalation criteria (the charter's "Additional escalation items" are added).
- `plugins/guardrails.ts` — blocked-command patterns.
- `opencode.json` — `instructions` auto-injects docs/CHARTER*.md and docs/STATUS*.md every session. No model = inherit. `subagent_depth: 2` lets team-planner/implementer/reviewer/critic (subagents) each call the explore subagent themselves — opencode's default of 1 would block that and fail the call silently.
- Per-role models: add `model: provider/id` to the agent frontmatter (or use /hire). Subagents without a model follow the invoking primary agent.
- `temperature` and `steps` per agent are role-based starting values.

## Known caveats
- Edit-permission patterns are matched against the path relative to the repo root (`docs/plans/x.md`, `AGENTS.md`) and `*` is a plain `.*`. Write `docs/*`, never `**/docs/**`: the `**/` form demands a leading slash and matches nothing. On first use, check that the planner can write inside docs/ but not outside.
- The built-in explore agent has bash and would inherit the global `ask`, so every `ls` or `git rev-parse` during research prompted. `opencode.json` gives it a read-only allowlist under `agent.explore.permission.bash`; anything else is denied without a prompt and explore falls back to grep/glob/read. Extend the list for your stack.
- Agents may not load skills on their own, so commands name the skills to load explicitly.
- In headless runs (`opencode run`) permission prompts cannot appear. Team agents use explicit allow/deny; the built-in build/plan agents follow the global default (ask).
