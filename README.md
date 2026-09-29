# GARAGISTE — the evidence team

> Coding is making claims true. Claims are tests, probes and invariants; the team is a scheduler over that graph; the human supplies direction, reality and accountability — and keeps the windows.

GARAGISTE v2 is an **AI-native development team that runs on Claude Code and on opencode**. No roles imitate a human company (planner, critic, reviewer). There are five packs that hand off only through files (intake · spec · build · attack · spike), twelve judgment-free scripts, a boundary hook or plugin, and a ledger.

- **Nothing unexecuted is believed.** The spec is a red acceptance test, approval is an exit code, the output of review is a failing test.
- **Machines close every loop.** The commit gate matches the ledger against the tree; `ship` touches main only when all seven conditions hold.
- **The human gives one sentence, yes/no, and "tried it".** The first line of STATUS is all they read each day.

## There are agents — there are no personas
The five packs are the agents. Each is defined by a ten-line spawn config (`.claude/agents/<pack>.md` or `.opencode/agents/<pack>.md`) and a write boundary. The prompt is one line, the pack file's path; the pack file is the whole spawn. The model comes from the budget (`-Budget`). Nowhere does it say "you are a senior engineer".

## Install
```
./install.sh claude   -Project <repo> [-Budget low|medium|high]    # Claude Code
./install.sh opencode -Project <repo> [-Budget low|medium|high]    # opencode
.\install.ps1 claude|opencode -Project <repo>                       # Windows PowerShell
```
The team's canon is harness-neutral in `<repo>/.garagiste/` (scripts · packs · HAZARDS · team.json · ledger · unit state); only the wiring differs:

| | Claude Code | opencode |
|---|---|---|
| rules file | `CLAUDE.md` (20 lines) | `AGENTS.md` (20 lines) |
| boundary | `.claude/hooks/guard.mjs` (PreToolUse) | `.opencode/plugins/guard.ts` (tool.execute.before) |
| the rules themselves | both call `.garagiste/scripts/guard-rules.mjs` | |
| spawn configs | `.claude/agents/{spec,build,attack,spike}.md` | `.opencode/agents/{conductor,spec,build,attack,spike}.md` |
| wip of a dead agent | SubagentStop hook → `checkpoint.mjs` | plugin after `task` → `checkpoint.mjs` |
| conductor | the main session (CLAUDE.md Flow) | the `conductor` primary agent (no edit permission) |
| models | budget → `model:` in the agent files | inherits the default provider/model; per-pack `model:` by hand |

Then fill `commands` (quick · full · test_file · run) in `.garagiste/team.json`. `quick` must exclude `tests/acceptance` and `tests/adversary` (they are committed red by design); `full` includes everything.

## The entrance — from conversation to scope
You do not speak one sentence at a time; the unit of input is the whole conversation.
```
conversation ─▶ work.mjs brief "<verbatim>" | --file PRD.md   accumulated verbatim in docs/BRIEF.md (no summarising)
"build it"   ─▶ brief.mjs intake → intake pack spawn           BACKLOG lines: slug · milestone · needs · "one sentence" · one acceptance line
                                                               hard-to-reverse choices become yes/no cards (work.mjs ask intake) → needs: Q<n>
scope        ─▶ work.mjs scope login share | --milestone M1 | --range a..b
                SCOPE requested 2 · prerequisites 2 · missing 0   ← the counter-proposal: the closure over `needs`, computed
                - prerequisites: db (needed by session) · session (needed by login)
                - order: db → session → login → share
loop         ─▶ work.mjs seed → UNIT | WAIT <slug> needs … | SCOPE DONE
```
`needs` is not a human-team convention; it is an edge in the claim graph. "This needs that first" is the output of `closure()`, not a meeting, and the CEO either accepts (`seed`) or drops the prerequisites (`--no-needs`, recorded in the ledger).

## Life of a unit
```
CEO sentence ─▶ work.mjs new <slug> "<verbatim>"      (boundary HIT → spike pack first)
             ─▶ brief.mjs spec  → red acceptance tests · try.md · surface.md → redproof.mjs = RED
             ─▶ brief.mjs build → red→green, verify quick per commit, the gate checks the ledger
             ─▶ brief.mjs attack → failing tests in tests/adversary → build respawn → red 0
             ─▶ ship.mjs <slug> → 7 conditions → ff merge to main · LEDGER row · STATUS
CEO "tried it" ─▶ work.mjs tried <slug> ok|fail
```
Agents receive one pack file and never talk to each other. Build has never met attack — it only meets failing test files.

## Scripts (zero judgment)
| script | does |
|---|---|
| `work` | entrance and unit lifecycle: brief (verbatim) · add · scope (closure over needs) · seed · new · ask · decide · default · tried · list |
| `brief` | pack assembly ≤8 KB (intake 32 KB) — verbatim text fenced as data, HAZARDS matched by path, resume section, worktree marker |
| `verify` | quick · full · red · attack · **gate** (ledger↔tree per commit, test floor, 300 logic lines) |
| `redproof` | proves acceptance tests are red on base and green on head |
| `boundary` | dependency · workflow · IPC · permission · egress keywords → spike required |
| `ship` | 7 fail-closed conditions → ff merge · docs/LEDGER.md · STATUS |
| `claims` | the claim graph: true · false · unsensed · unknown, sensor coverage, next |
| `state` | generates docs/STATUS.md (first line is everything) · unattended stop budgets |
| `doctor` | differential diagnosis — detects the harness, says what died and what to fix |
| `guard-rules` · `checkpoint` | the boundary rules and wip checkpoint both harnesses share |

## Documents
- [docs/PRINCIPLES.md](docs/PRINCIPLES.md) — four sentences, eight tenets, the human's windows (Korean)
- [docs/BIRTH.md](docs/BIRTH.md) — the zero-base birth protocol and the verdict line after the first 3 units (Korean)
- [docs/catalogue/](docs/catalogue/) — candidate devices (the v2 design), the v1 measurements, discussion additions. **Not a plan**: a device is built only when an incident in the ledger asks for it

## Verify this repository
```
node --test tests/unit.test.mjs   # 22 pure-function tests
node --test tests/e2e.test.mjs    # birth test (claude) + opencode install: empty repo → shipped unit, zero model calls, zero network
```

## v1
v1 (the role-play: 7 agents, 31 skills, the opencode flavor) was deleted on 2026-09-29. Its history is on main before `0fdfa28`; the measured diagnosis stays in docs/catalogue/V1-ANALYSIS.md.
