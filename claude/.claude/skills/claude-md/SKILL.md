---
name: claude-md
description: How to write and update the repository's CLAUDE.md (commands, architecture map, conventions, Definition of Done, forbidden actions) and its template. Load at kickoff, legacy assessment, when a retro adds a rule, or when CLAUDE.md is missing or its commands no longer match reality.
user-invocable: false
---
# CLAUDE.md

CLAUDE.md is injected into every session and every subagent. It must be short and true.

## Principles
- Under 300 lines. Procedures go in skills; facts go here.
- List only commands that were actually run and passed (confirmed by team-verifier; at kickoff the implementer's report seeds them and the verifier confirms right after; at assess each command line ends with ` — unverified` until the verifier has run it; /assess step 4 removes the marker).
- Add rules only when something actually went wrong (retro output). No generalities.
- Always separate quick verification (under one minute) from full verification.
- "## Risk paths" is the one judgment-free input to risk: a path match, not an opinion. Keep it short and concrete.

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

## Architecture map
- <directory> — responsibility, entry points

## Conventions
- naming, error handling, logging, configuration, commit messages

## Definition of Done
- quick verification passes; every logic step's `proves:` lines have a test that was red before the change and green after (the implementer's Proven lines; `n/a` only where the plan says so)
- a logic-change step diff is within the operating profile's step-size target (default 300 changed lines of logic: `git diff --stat` insertions + deletions, test files and mechanical changes excluded); a larger step states why, never beyond 2×
- a plan holds at most the plan-size target of logic steps (default 4) or says why; bigger work is split by tryable outcome, the later parts in BACKLOG
- mechanical changes (scaffold/gen/mechanical/deps) are separate commits with kind and reproduction command; regeneration diff is zero
- docs, ADRs and docs/DECISIONS.md updated
- review APPROVE (lenses scale with risk: default correctness+security; 4 lenses for risk:high — a "## Risk paths" hit or an escalation item — over 600 logic lines, or integration diffs)

## Operating profile
- (filled by /hire via set-profile.mjs: budget tier / default review lenses 2|4 / parallelism none|session|parallel / plan-size target (logic steps, default 4) / per-step verifier on|off / step-size target / hire date)

## Merge policy
- (leave empty for automatic resolution by /ship: no remote→local, protection+auto-merge→auto-low-risk, otherwise→manual. Write manual | auto-low-risk to force)

## Risk paths
- (globs of files whose change is risk:high — migrations, schemas, auth, public API definitions, dependency manifests, CI/deploy config; e.g. migrations/**, **/schema*, **/auth/**, openapi*, *.proto, package.json, .github/workflows/**. /review and /ship match `git diff --name-only` against this list and the planner sets each plan's Risk line from it; /kickoff and /assess seed it, /retro extends it)

## Forbidden
- passing by weakening, skipping or deleting tests
- committing secrets, touching production resources, force push, direct push to main
- scope creep outside the plan

## Additional escalation items
````
