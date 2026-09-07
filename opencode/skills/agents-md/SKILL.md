---
name: agents-md
description: How to write and update the repository's AGENTS.md (commands, architecture map, conventions, Definition of Done, forbidden actions) and its template. Load at kickoff, legacy assessment, when a retro adds a rule, or when AGENTS.md is missing or its commands no longer match reality.
---
# AGENTS.md

AGENTS.md is injected into every session. It must be short and true.

## Principles
- Under 300 lines. Procedures go in skills; facts go here.
- List only commands that were actually run and passed (confirmed by team-verifier).
- Add rules only when something actually went wrong (retro output). No generalities.
- Always separate quick verification (under one minute) from full verification.

## Template
````
# <Project>
One-line summary (details: docs/CHARTER.md · legacy: docs/ASSESSMENT.md, docs/REBUILD_PLAN.md)

## Language
- <ko | en | ...>  (responses, questions and documents; set with /lang; agents mirror the CEO's language when unset)

## Commands
- setup:
- quick verification (under one minute — relevant tests, lint, typecheck):
- full verification:
- parity harness (legacy):
- build/run:

## Architecture map
- <directory> — responsibility, entry points

## Conventions
- naming, error handling, logging, configuration, commit messages

## Definition of Done
- quick verification passes; new logic has tests
- a logic-change step diff is 300 lines or less (state the split reason if exceeded)
- mechanical changes (scaffold/gen/mechanical/deps) are separate commits with kind and reproduction command; regeneration diff is zero
- docs, ADRs and docs/DECISIONS.md updated
- review APPROVE (lenses scale with risk: default correctness+security; 4 lenses for risk:high, large or integration diffs)

## Operating profile
- (filled by /hire: budget tier / default review lenses 2|4 / parallelism none|session / critic minimum steps / hire date)

## Merge policy
- (leave empty for automatic resolution by /ship: no remote→local, protection+auto-merge→auto-low-risk, otherwise→manual. Write manual | auto-low-risk to force)

## Forbidden
- passing by weakening, skipping or deleting tests
- committing secrets, touching production resources, force push, direct push to main
- scope creep outside the plan

## Additional escalation items
````
