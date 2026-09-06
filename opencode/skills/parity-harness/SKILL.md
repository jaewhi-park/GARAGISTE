---
name: parity-harness
description: Procedure for pinning current behaviour before a legacy rebuild with a characterization-test / golden-output harness, and the docs/PARITY.md format. Load as the first step of any replacement, rewrite or migration of legacy code, and use it for regression verdicts at every rebuild step.
---
# parity-harness

## Principles
- No rebuild step starts without the harness.
- Bugs are recorded as current behaviour for now. Preserve-or-fix is the CEO's decision and goes in the decision log.
- Normalization rules (timestamps, ordering, floating-point tolerance, temporary IDs) are documented explicitly.

## Procedure
1. Collect representative inputs: real-data samples (sensitive data masked), boundary values, failure cases, one large case
2. Run the legacy system and store outputs as golden files — tests/golden/<case>/{input,expected}
3. Write a runner: select an implementation (legacy|new), feed the same inputs, diff against golden. Put normalization rules in the runner as code.
4. Validate the runner against legacy — everything must PASS for the harness to be valid.
5. Judge the new implementation with the same runner. Intentional differences: update the golden file and record the reason in docs/DECISIONS.md.

## Output
- tests/golden/ and the runner, registered under "Commands" in the rules file
- docs/PARITY.md: covered scenarios / known differences and reasons / uncovered areas
