---
name: run
description: Default path — take an approved plan through build → review → ship. Stops only at escalation, fix-loop overflow and merge approval
argument-hint: "[plan file path]"
disable-model-invocation: true
---
Take the approved plan all the way: $ARGUMENTS (plan file path)

Stop only at three places: an escalation question, a fix loop exceeding 3 rounds, and merge approval (when the policy resolves to local/manual). Otherwise proceed without asking the CEO.

1. Run `build` via the Skill tool (argument: $ARGUMENTS). Do not continue until it finishes.
2. Run `review` via the Skill tool (argument: base branch, normally main).
3. Run `ship` via the Skill tool (argument: plan slug).

If a skill's stop condition triggers, stop there and report what is blocked. When all three finish, report once in the final report format (what / how verified / remaining risks / decisions needed).
