# GARAGISTE — Claude Code flavor

Human manual: **GUIDE.md** (install, what to do in each situation). Artifact map: docs/README.md. This file is the configuration reference. 한국어: README.ko.md, GUIDE.ko.md.

Run one repository like a small software company. The human is the CEO (strategy, approvals, merges); the agents are the team. A company is not an org chart but five loops: product (backlog) → engineering (plan, implement) → quality (verify, review) → operations (ship, release) → governance (decision records, retros). Each loop is one `/skill` and one `docs/` artifact.

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
| Governance | `/kickoff <idea>` / `/assess <target>` | CHARTER, ADR, CLAUDE.md, (legacy) ASSESSMENT · REBUILD_PLAN · parity-harness plan; ends with /hire |
| Product | `/backlog [idea]` | docs/BACKLOG.md (+ GitHub Issues) |
| Engineering | `/plan <item>` → `/run <plan>` (or `/build`) | one intake call (optional spec rounds → docs/specs/*.md) → docs/plans/*.md, one commit per step |
| Parallel | `/parallel <plans>` → `/integrate` | one branch per worktree → serial merge queue |
| Quality | `/review` | risk-proportional review (2 lenses by default, 4 for high risk) → fix loop |
| Operations | `/ship` → `/release [ver]` · `/policy` | PR (risk label) or local merge, CHANGELOG, docs/releases/*.md |
| Governance | `/retro <subject>` | CLAUDE.md rules / skills / hooks updated |
| Handoff | `/handoff` / `/resume` | docs/STATUS.md |
| Team | `/hire` / `/roster` | per-role model and effort assignment and the operating profile, both via script; roster table |
| Language | `/lang [code]` | rewrites the `## Language` section of CLAUDE.md via script, effective immediately |
| Recruiting | `/recruit <gap>` | new role from a permission preset, model and effort copied from the sibling role; created by script on approval |

## Team (.claude/agents/)
| Agent | Role | Tools | Notes |
|---|---|---|---|
| team-lead | tech lead / EM; main-session agent | Agent(team-*, Explore), Read/Grep/Glob, Bash, Edit/Write, AskUserQuestion | Edit/Write on docs/STATUS.md only (hook-enforced); default via `settings.agent` |
| team-planner | architect; docs, plans, specs, ADRs | Read/Grep/Glob, Edit/Write, Bash, Web* | `memory: project` — accumulates architecture knowledge |
| team-critic | design review (pre-mortem) | Read/Grep/Glob | read-only |
| team-implementer | senior engineer (main checkout, sequential) | Read/Grep/Glob, Edit/Write, Bash | commits; pushes and opens the PR in /ship |
| team-builder | senior engineer (parallel) | same | `isolation: worktree` — implements a whole plan in its own worktree, self-verifies |
| team-reviewer | per-lens code review | Read/Grep/Glob, Bash | `memory: project` — accumulates recurring defect patterns |
| team-verifier | CI | Bash, Read/Grep/Glob | runs only the commands listed in CLAUDE.md |
| Explore | codebase research (built-in) | read-only | |

## Running it like a company
- Morning: confirm today's items with `/backlog` → approve `/plan` → `/run` (see parallelism below)
- Day: answer only the lead's AskUserQuestion prompts. Everything else is autonomous.
- Evening: `/run` finishes with ship → merge per policy. Weekly `/release`; `/retro` when failures repeat.
- The human's four jobs: answer charter, intake and spec questions / approve plans and decide escalations / merge PRs (per policy) / approve retro rules.

## Workflow — sequential by default, parallel by choice
The default (`/build`, inside `/run`) implements one plan in one session, step by step, in the main checkout. Ask for several features and the lead makes several `/plan`s and runs them one after another. No worktrees, no merges, no conflicts by construction. Most personal projects need nothing more.

When you do need parallelism, try in this order:
1. **Session-level**: one terminal per feature with `claude --worktree <feature>` → each session runs /plan → /run. You merge PRs in order; ask later branches to "rebase on main and re-verify". Simplest and most robust.
2. **In-session** (`/parallel` → `/integrate`): the lead launches one team-builder per plan; builders implement, self-verify and commit in isolated worktrees and report their branches. `/integrate` reviews, merges (conflicts resolved by the implementer), and verifies **one branch at a time**. `worktree.baseRef: head` makes builders branch from the session's current branch.
3. **Agent teams** (experimental): set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `settings.json` → `env`. Teammates share a task list and talk to each other. Only when modules are truly independent and teammates need to coordinate.

Rule: the unit of parallelism is a plan (feature), not a step. Run only plans whose "files touched" sets do not overlap. Integration is always serial, with the verifier after every merge. Add `docs/STATUS.md` to .gitignore when running parallel sessions.

## Merge policy — resolved automatically
`/ship` decides from repository state. No config edits needed.
| Repository state | Verdict | Behaviour |
|---|---|---|
| no remote | `local` | PR description saved to docs/prs/, local `merge --no-ff` into main after approval |
| remote, no main protection / auto-merge | `manual` | push branch + PR (risk label); human merges |
| remote + protected main (required checks) + auto-merge allowed | `auto-low-risk` | `risk:low` → `gh pr merge --auto`; `risk:high` → human |
"Turning on auto-merge" therefore means enabling protection and auto-merge on GitHub — which is exactly the safety condition. `/policy` shows the verdict and reason; write an override (`manual`/`auto-low-risk`) into CLAUDE.md only when you really need to. Hooks block force pushes and direct pushes to main under every verdict.

## Local-only (early build-up without a remote)
When `git remote` is empty, `/ship` writes the PR description to docs/prs/NNNN-<slug>.md and merges into local main with `git merge --no-ff` per policy. The gates stay: one plan = one branch, verifier, review, risk label, merge-commit rollback. `/release` creates a local tag after approval. Adding GitHub switches the next `/ship` to the PR flow automatically.

## Models and budget
**The recommended path is `/hire`.** The lead confirms candidates (aliases opus/sonnet/haiku, plus API model IDs you name), asks budget tier, project character and parallel plans, and proposes a role × model × effort table with reasons. On approval it applies via `scripts/apply-models.mjs` (which only changes model/effort lines) and leaves an "Operating profile" in CLAUDE.md. `/kickoff` and `/assess` end by running it. The `--budget` profiles below are for non-interactive use; pass `-Budget <tier>` at install time so the first (kickoff/assess) session already runs the verifier on haiku, and `/hire` refines it.

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
The session is working memory; the repo is long-term memory. State lives in three places — one commit per step, the plan file, `docs/STATUS.md` (auto-injected by the SessionStart hook). One session = one plan (PR). End with `/handoff`, continue in a new session with `/resume`. Use `claude --continue` only for short interruptions. Planner and reviewer accumulate long-term knowledge in `.claude/agent-memory/<name>/` (requires auto memory enabled).

## Differences from the opencode flavor
- Per-path edit permissions exist only where the hook enforces them: team-lead may edit docs/STATUS.md and nothing else (`guardrails.mjs`). The planner's "docs only" rule is prompt-level and caught by the reviewer; for a hard block, add a path rule to the same hook.
- Secret-file blocking (`.env`, keys, certificates) applies to the file tools (Read/Edit/Write) via deny rules and the hook, and the hook also blocks shell commands that print such files (`cat .env`, `Get-Content .env.local`, `grep KEY .env`). A program reading the file itself (`node -e`, `python -c`) is not caught — keep secrets out of the repo.
- `permissions.deny` is session-wide. Force pushes and direct pushes to main are blocked by deny rules and hooks; feature-branch pushes are allowed.
- The `Agent(...)` list on the main-session agent (`--agent` / `settings.agent`) is the allowlist of subagents the lead may call. Inside a subagent definition the parenthesized list is ignored.
- `memory: project` gives roles long-term memory — the company's accumulated experience.

## Notes
- Workflow skills carry `disable-model-invocation: true`, so Claude cannot call them on its own. Five exceptions — `build`·`review`·`ship` (the `/run` chain), `hire` (end of `/kickoff`·`/assess`), `roster` (read-only) — allow model invocation and are bound by prompt to "CEO call or that chain only". For everything else the lead only suggests "run `/command`" in a sentence. Knowledge skills carry `user-invocable: false`: hidden from the menu, loaded by agents when needed.
- Under the default permission mode on Pro/Max (auto), subagents inherit the parent's mode. The team's safety comes from tool lists, deny rules and hooks.
- Hooks are written in Node and run unchanged on Windows. The patterns are a starting set; tune them to your stack.
