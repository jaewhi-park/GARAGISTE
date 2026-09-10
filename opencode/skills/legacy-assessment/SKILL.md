---
name: legacy-assessment
description: "Checklist for assessing a legacy codebase: inventory, risk register, seam identification, rebuild-strategy comparison and the docs/ASSESSMENT.md format. Load when starting a rebuild, modernization or large refactor of an existing system, or before changing an unfamiliar codebase substantially."
---
# legacy-assessment

Without a written spec (docs/specs/), current behaviour is the spec. The goal of assessment is to know what must be preserved.

## Inventory (send Explore out per area, in parallel)
- Entry points: executables, schedulers, APIs, UI, batch jobs — call flow
- Module boundaries and dependency direction (mark cycles)
- Data: stores, schemas, file formats, presence of migrations
- External integrations: APIs, queues, file exchange, authentication
- Configuration and secret locations, per-environment branching
- Test status: kinds, whether they run, rough coverage
- Dead code and duplication candidates
- Build and deployment method

## Risk register
| Item | Impact | Likelihood | Signal (how we would know) | Mitigation |

## Seam identification
Boundaries that can serve as replacement units: stable interfaces, data contracts, process boundaries.
For each seam, judge: "can a new implementation sit beside it and take over traffic?"

## Strategy comparison (record as an ADR)
- strangler fig: when boundaries are clear and old and new can run side by side. The default.
- module-by-module replacement: when coupling is low and modules can be tested in isolation
- full rewrite: only when the code is small or the parity harness is nearly complete. Demand evidence.

## Output — docs/ASSESSMENT.md
Inventory / risk register / seams / test status / current behaviour that looks like bugs / unknowns (need CEO confirmation)
