# Changelog

Releases are dated; each hook and plugin carries the date as `GARAGISTE_VERSION`, and `session-start.mjs` names it in the injected context. A running project keeps the release it was installed with until its CEO decides to upgrade — the "Breaking for running projects" list of a release is the migration checklist; re-run `install.sh <flavor> -Project <repo>` afterwards.

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
