# GARAGISTE — the evidence team

> Coding is making claims true. Claims are tests, probes and invariants; the team is a scheduler over that graph; the human supplies direction, reality and accountability — and keeps the windows.

GARAGISTE v2 is an **AI-native development team** that runs on Claude Code. There are no roles that imitate a human company (planner, critic, reviewer). There are four packs that hand off only through files (spec · build · attack · spike), ten judgment-free scripts, three hooks, and a ledger.

- **Nothing unexecuted is believed.** The spec is a red acceptance test, approval is an exit code, the output of review is a failing test.
- **Machines close every loop.** The commit gate matches the ledger against the tree; `ship` touches main only when all seven conditions hold.
- **The human gives one sentence, yes/no, and "tried it".** The first line of STATUS is all they read each day.

## Install
```
./install.sh -Project <repo> [-Budget low|medium|high]     # macOS · Linux · Git Bash
.\install.ps1 -Project <repo> [-Budget low|medium|high]    # Windows PowerShell
```
`team/` lands in `<repo>/.claude/`, `.githooks/pre-commit` becomes the commit gate. Fill `commands` (quick · full · test_file · run) in `.claude/team.json`. `quick` must exclude `tests/acceptance` and `tests/adversary` (they are committed red by design); `full` includes everything.

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
| `work` | unit lifecycle: new · ask (hard-decision queue) · decide · default · tried · list |
| `brief` | pack assembly ≤8 KB — verbatim text fenced as data, HAZARDS matched by path, resume section |
| `verify` | quick · full · red · attack · **gate** (ledger↔tree per commit, test floor, 300 logic lines) |
| `redproof` | proves acceptance tests are red on base and green on head |
| `boundary` | dependency · workflow · IPC · permission · egress keywords → spike required |
| `ship` | 7 fail-closed conditions → ff merge · docs/LEDGER.md · STATUS |
| `claims` | the claim graph: true · false · unsensed · unknown, sensor coverage, next |
| `state` | generates docs/STATUS.md (first line is everything) · unattended stop budgets |
| `doctor` | differential diagnosis — what died and what to fix, one line each |

Hooks: `guard` (destructive git, secrets, rulebook, per-pack write boundary) · `spawn-log` (SubagentStop → wip checkpoint) · `session-start` (alive marker + STATUS first line).

## Documents
- [docs/PRINCIPLES.md](docs/PRINCIPLES.md) — four sentences, eight tenets, the human's windows (Korean)
- [docs/BIRTH.md](docs/BIRTH.md) — the zero-base birth protocol and the verdict line after the first 3 units (Korean)
- [docs/catalogue/](docs/catalogue/) — candidate devices (the v2 design), the v1 measurements, discussion additions. **Not a plan**: a device is built only when an incident in the ledger asks for it

## Verify this repository
```
node --test tests/unit.test.mjs   # 17 pure-function tests
node --test tests/e2e.test.mjs    # birth test: empty repo → shipped unit, zero model calls, zero network
```

## v1
`claude/`, `opencode/`, `scripts/` and `assets/` are the v1 tree (the role-play). v2 inherits no file from it. Deleting it is the CEO's call (docs/DECISIONS.md).
