---
name: agents-md
description: How to write and update the repository's AGENTS.md (commands, architecture map, conventions, Definition of Done, forbidden actions) and its template. Read by team-planner at kickoff and legacy assessment, when a retro adds a rule, or when AGENTS.md is missing or its commands no longer match reality; the lead names it in the call and never loads it.
---
# AGENTS.md

AGENTS.md is injected into every session. It must be short and true.

## Principles
- Under 150 lines and 8 KB — the guardrail refuses a write over 8 KB — it is injected into every session and every subagent spawn. Procedures go in skills; facts go here; the architecture map lives in docs/ARCHITECTURE.md with a one-line pointer here; history (what a plan changed, what a measurement found) lives in docs/, never here.
- Commands are one line each — `- <label>: \`<command>\`` — with nothing after the closing backtick but the ` — unverified` marker; a note about a command (what it covers, how long it takes) goes to docs/ARCHITECTURE.md. The verifier runs the backtick span as the command; a note after it is prose, never part of the command.
- List only commands that were actually run and passed (confirmed by team-verifier). At kickoff and at assess each command line ends with ` — unverified` until team-verifier has run it: at assess the verifier runs them at once and the planner removes the marker before the rebuild plan is written; after a kickoff, the full verification at the end of plan 0001's build does (the planner drops the marker from what passed and the commands that failed, per the `build` command). The guardrail strips the marker when it reads the list; the implementer and the verifier run the command without it.
- Add rules only when something actually went wrong (retro output). No generalities.
- Always separate quick verification (under one minute) from full verification.
- "## Risk paths" is the one judgment-free input to risk, and "## UI paths" the one to the ux lens: a path match, not an opinion. "## Risk paths (live)" holds the globs that count only once the board's Stage is `live` — dependency manifests and CI/deploy config; pre-launch a hit there alone leaves the risk low. Keep all three short and concrete.

## Template
````
# <Project>
One-line summary (details: docs/CHARTER.md · legacy: docs/ASSESSMENT.md, docs/REBUILD_PLAN.md)

## Language
- <ko | en | ...>  (responses, questions and documents; set with /lang; agents mirror the CEO's language when unset)

## Commands
- setup:
- quick verification (under one minute — relevant tests, lint, typecheck):
- run one test file (the PR's Proven section names its command):
- full verification:
- parity harness (legacy):
- build/run:
- screenshots (UI stacks; registered by the design-foundation step, not at kickoff, as a command the verifier's bash allow-list covers — a package script such as `npm run screenshots`, a make target or `uv run …`, never a bare `node script.mjs`; renders each screen in each state to docs/screens/<plan-slug>/<screen>-<state>.png, git-ignored):
- bench (only when the stack ADR has an Experiment baseline — the runner experiment steps call; records go to docs/measurements/):

## Architecture map
- see docs/ARCHITECTURE.md (directories, responsibilities, entry points — kept there so this file stays small)

## Conventions
- naming, error handling, logging, configuration, commit messages

## Definition of Done
- quick verification passes; every logic step's `proves:` lines have a test that was red before the change and green after (the implementer's Proven lines; `n/a` only where the plan says so)
- the product starts: the full verification runs a runtime smoke that starts the real entry point from the build/run line and asserts one round trip through it (plan 0001 registers it; every later plan keeps it green)
- a logic-change step diff is within the operating profile's step-size target (default 300 changed lines of logic: `git diff --stat` insertions + deletions, test files and mechanical changes excluded); a larger step states why, never beyond 2×
- a plan holds at most the plan-size target of logic steps (default 4) or says why; bigger work is split by tryable outcome, the later parts in BACKLOG
- mechanical changes (scaffold/gen/mechanical/deps) are separate commits with kind and reproduction command; regeneration diff is zero
- docs updated; an ADR for a hard-to-reverse choice; a docs/DECISIONS.md line only for a decision that is hard to reverse or that the CEO made; an experiment step's record (docs/measurements/, under 80 lines) carries the conditions, N, the table and the verdict against the threshold the plan fixed before the run
- review APPROVE (lenses scale with risk: default correctness+security; 4 lenses over 600 logic lines, for integration diffs, and for risk:high — a "## Risk paths" hit or an escalation item — once the board's Stage is live; the ux lens whenever a "## UI paths" glob is hit and the `screenshots:` command is in)
- a UI step's `shows:` lines have screenshots (the `screenshots:` command) and the ux lens saw them — once that command is in; before it, the first UI plan after the walking skeleton starts with the design-foundation step; a Risk-path plan's threat-model lines each have a negative-case test

## Operating profile
- (filled by /hire via set-profile.mjs: budget tier / default review lenses 2|4 / parallelism none|session / plan-size target (logic steps, default 4) / per-step verifier on|off / step-size target / unattended cap (plans shipped or spec sections done per "계속", default 8 plans | 2 sections) / hire date)

## Merge policy
- (leave empty for automatic resolution by /ship: no remote→local, protection+auto-merge→auto-low-risk, otherwise→manual. Write manual | auto-low-risk to force)

## UI paths
- (globs of screens, components, templates and styles — e.g. src/components/**, app/**/*.tsx, src/**/*.vue, templates/**, **/*.css. A hit adds the ux lens to /review and `shows:` lines to the plan's UI steps; /kickoff seeds it, /retro extends it)

## Risk paths
- (globs of files whose change is risk:high — migrations, schemas, auth, public API definitions; e.g. migrations/**, **/schema*, **/auth/**, openapi*, *.proto. /review and /ship match `git diff --name-only` against this list and the planner sets each plan's Risk line from it; /kickoff and /assess seed it, /retro extends it)

## Risk paths (live)
- (globs that join the list above only once the board's Stage is live — dependency manifests and CI/deploy config; e.g. package.json, pnpm-lock.yaml, requirements*.txt, Cargo.toml, go.mod, Dockerfile, .github/workflows/**. Pre-launch a hit here alone leaves the risk low: a scaffold or a version bump is not a supply-chain event before there are users)

## Forbidden
- passing by weakening, skipping or deleting tests
- committing secrets, touching production resources, force push, direct push to main
- scope creep outside the plan

## Additional escalation items
````
