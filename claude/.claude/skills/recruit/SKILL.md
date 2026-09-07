---
name: recruit
description: Recruit a new role — when no existing agent fits (a different permission boundary or a separate judgment is needed), propose one to the CEO together with its model and create it on approval. The lead suggests it from /plan or /retro, never mid-build
argument-hint: "[gap: what no current role can do]"
disable-model-invocation: true
---
Recruit a new team member. Gap: $ARGUMENTS

1. Justify or drop. A new role is warranted only when it needs (a) a permission boundary no current role has, or (b) a judgment separated from execution. If only knowledge is missing, propose a skill instead (team-planner writes .claude/skills/<name>/SKILL.md after approval) and stop here.
2. One proposal, one AskUserQuestion call: role name `team-<slug>`, one-line description, when you will invoke it, permission preset (researcher: read-only + web · author: docs/ only · engineer: edit + bash + commits · judge: read-only, report ends with a verdict line), and the model with effort. Take them from the current roster without asking a budget question again: the sibling role of the same kind (judge → team-reviewer, engineer → team-implementer, author → team-planner, researcher → team-verifier) and name it explicitly. Offer "skill only" as the alternative and give your recommendation with the reason.
3. After approval: have team-planner write the role prompt to docs/roles/team-<slug>.md (identity, procedure, report format; under 60 lines; no permissions — the preset carries them) and add one line to docs/DECISIONS.md.
4. Run `node .claude/scripts/new-agent.mjs --flavor claude --dest .claude/agents --name team-<slug> --preset <preset> --description "<one line>" --body docs/roles/team-<slug>.md --like team-<sibling>` (`--model <model>:<effort>` instead of `--like` when the CEO named one). The script writes the new agent file and adds the name to team-lead's Agent(...) tool list, nothing else. Never create or edit agent files yourself.
5. Show the new agent as a /roster row. It loads from the next session; a later /hire re-assigns it like any other role.
