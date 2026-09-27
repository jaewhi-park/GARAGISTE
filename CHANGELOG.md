# Changelog

Releases are dated; each hook and plugin carries the date as `GARAGISTE_VERSION`, and `session-start.mjs` names it in the injected context. A running project keeps the release it was installed with until its CEO decides to upgrade — the "Breaking for running projects" list of a release is the migration checklist; re-run `install.sh <flavor> -Project <repo>` afterwards.

## Unreleased

### Added
- The deny log (`.claude/session/denies.jsonl`) records the rule that fired and the command or path it refused (`rule`, `what`) instead of the prose reason, whose boilerplate alone exceeded the 200-character cut and hid the command — the next retro can see what was refused, not only how often.
- The verifier may use output and check-only words between commands — `echo`, `printf`, `test`, `[`, `true`, `false`, `set`, `pwd`, `date` — as long as nothing is redirected into a file, substituted or expanded from a secret-looking variable (the two test projects logged 28 refusals of `echo` banners around listed commands, each one a re-run). The lead may `gh label list` and `gh label create` (the risk labels /ship attaches); read-only roles may list labels. Both flavors.
- `--uninstall` / `-Uninstall` on every installer (both flavors, sh and ps1, a project or `--global`): removes what the installer put there — the team's agents, skills, hooks and scripts (opencode: agents, commands, skills, plugins, scripts) and the entries it merged into settings.json / opencode.json — after backing each path up; your own files and settings, docs/ and .gitignore stay, and what is left in the team's folders is listed. `--dry-run` previews it.

### Added (METRICS)
- Two more columns on the METRICS line, written by /ship from the next ship on: `majors per 100 logic lines` (review blockers ÷ logic diff lines × 100) and `plan-budget refusals` (deny-log lines with rule `doc-budget` on a docs/plans path since the approval commit). /retro reads both: a rising density means the self-check and the reviewer memory are not biting; refusals above one per plan mean the plan budget binds.

### Fixed
- The installer carries `worktree.baseRef: head` into the project's settings.json (both sh and ps1; kept when the project already sets `worktree`). The merge only copied `agent`, `permissions` and `hooks`, so no project ever had it: with Claude Code's default `fresh`, a /parallel builder branches from the remote default branch instead of the session HEAD, and the uninstall removes it again. Verified in the installer test runs.

### Changed
- **The verifier's turn cap is 40** (was 20; `steps` in opencode) and it runs a rules-file command line as written — a chain is one call. At the cap Claude Code returns the report as partial; the test projects' lead had to split full verification into two or three calls to stay under it.
- **/ship merges with a merge commit, never a squash** (both flavors, hotfix too): the plan and board commits the lead makes on local main are ancestors of the plan branch, so a merge commit lets local main fast-forward after every ship — a squash rewrote them and both test projects had to rebase or switch merge methods by hand. The PR description is saved to docs/prs/NNNN-<slug>.md at every ship and passed with `--body-file` (a long `--body` with `$(…)`, `->` or a word like credentials tripped the lead's shell guard), and the lead creates the two risk labels once when the repository lacks them (`gh label create`; before, `gh pr create --label` failed and both projects put the label in the title).
- **The plan budget is 16 KB** (was 12 KB; both flavors). In the two test projects every plan written after the budget landed sat within 300 bytes of 12 KB and one iteration logged 22 refusals of plan writes — each one a planner rewriting the file to fit. The other budgets are unchanged; the plan-budget refusal count is now a METRICS column, so a binding budget shows up at the next retro.

### Removed
- **The global install** (`--global` / `-Global`, both flavors): the team lives in the repository — `.claude/` (opencode: `.opencode/` and `opencode.json`) is committed with the project, so every checkout and collaborator runs the same release and nothing under the user's home can shadow it. `-Global` is accepted only together with `-Uninstall`, which removes an older global install; the installers' absolute-path rewriting of skills and commands went with it. `session-start.mjs` now also warns when a same-named skill, agent or hook of this project is still under `~/.claude`, and points at `-Global -Uninstall`.

### Changed
- Upgrade order for a running project, step (2): an older *global* install is removed with `./install.sh <flavor> -Global -Uninstall` before the project is re-installed — Claude Code loads a same-named skill from `~/.claude/skills` in preference to the project's, and a guardrails hook registered in both `~/.claude/settings.json` and the project's runs twice with the older one deciding.

## 2026-09-26

### Breaking for running projects
- **Document budgets are enforced by the guardrail** (both flavors): docs/STATUS.md 1,800 characters and 200 per line (as before), docs/STATUS-team.md 40 lines, docs/CHARTER.md 60 lines, the rules file (CLAUDE.md / AGENTS.md) 8 KB, a plan (docs/plans/*.md) 12 KB — a write that would leave a file over its budget is refused, whoever writes it. Before upgrading: split an over-long CEO page into the two board files, move the rules file's architecture map to docs/ARCHITECTURE.md and its history to docs/, archive settled BACKLOG and DECISIONS lines (the `backlog` skill's Archive rule).
- **The iteration runs to an unattended cap, not to 2–4 plans**: the operating profile's `iteration cap` line becomes `unattended cap: <n> plans | <m> sections` (default `8 plans | 2 sections`) — run `/hire` once (or `set-profile.mjs`) to rewrite the line. A new screen, a first run or a decision taken by default is a checkpoint on the CEO's page, never a stop; only the four escalation items stop a plan, and the lead parks that plan and takes the next independent item.
- **The board's Iteration block has two new lines** (`cap:` on the Plans line, `Tried (last review):`) and the METRICS line three new columns (`spawns · denies`, `acceptance`) — the lead writes them from the next ship on; older lines are left as they are.
- **The iteration review ends with a question the CEO answers in one line** — `써봤다 · <result>` or `안 써봤다` — recorded in METRICS; two reviews in a row `not tried` are said out loud before the next plan.
- **A new hook, `spawn-log.mjs`, and two new settings entries** (PreToolUse matcher `Agent`, `SubagentStop`): the installer adds them; a hand-maintained settings.json needs the two entries.
- **Upgrade order for a running project.** (1) Close its sessions. (2) If the user's `~/.claude` also carries a guardrails hook, remove those hook entries from `~/.claude/settings.json` or upgrade the global install too — an older global hook refuses the new board file and the run stalls at the first board write. (3) Re-run the installer for the project: it overwrites the agent files, so the `/hire` model and effort lines are lost — re-run `/hire` (the previous lines are in the `chore(hire)` commit). (4) In the first session, tell the lead the template was upgraded: the planner archives the old CEO page under docs/archive/, the lead writes the two board files under their budgets, the planner moves the rules file's map and history out (rules stay), and `/ship` adds the METRICS columns from the next line on. Whole-file writes pass the budgets; partial edits of an over-budget file are refused.

### Added
- `GARAGISTE_VERSION` in `guardrails.mjs`, `session-start.mjs`, `spawn-log.mjs` and `guardrails.ts`; `session-start.mjs` warns when the user's `~/.claude` and the project's `.claude` both register a guardrails hook (every tool call runs both and the older one decides), naming each install's release.
- Deny log: every guardrail refusal appends one line to `.claude/session/denies.jsonl` (git-ignored); spawn log: `spawn-log.mjs` appends a line per subagent start and end to `.claude/session/spawns.jsonl`. `/ship` copies both counts into the METRICS line — the cost signal `/retro` and `/hire` read.
- `set-language.mjs --settings <file>` writes Claude Code's `language` key next to the rules file's "## Language" section (`/lang`, `/kickoff`, `/brainstorm` and `/assess` pass it); `session-start.mjs` writes its tail in the team's language (Korean strings for `ko`, English plus one line naming the code otherwise) so the last thing before the CEO's first word is in the right language.
- The runtime smoke: plan 0001's last step starts the real entry point from the build/run line and asserts one round trip; the Definition of Done keeps it green; a UI plan names one `shows:` line captured from the running product, not a catalog.
- The environment probe in plan 0001's scaffold step (OS, shell, line endings, runtime versions, security software → docs/ENVIRONMENT.md).
- The implementer reads `docs/memory/team-reviewer.md` and the lens checklist before coding and reports a `Self-check:` line; a review fix round is one commit; a minor finding is never fixed in the round; round 1 with more than 10 majors is a retro trigger; `/build` takes the step size from git and refuses a step over 2× the target.
- The mini retro applies a one-line countermeasure (a rule line, a memory line, a path glob) at once and lists it under Decided by default; only skill, agent and hook changes wait for the CEO's number.
- The headless rule in `deliver`: nobody may be watching, so a question mid-run is never asked — defaults are taken and logged, a hard stop is parked, the board carries the question.
- A permissive, offline, audit-clean runtime dependency no longer asks the CEO (decision log only); `rg` joins the verifier's output-trimming allow-list.

### Changed
- `hook-check.mjs`: cases for every budget (both flavors) and for `rg`.
- README, GUIDE and the workflow map describe the unattended cap instead of "2–4 plans per session".
