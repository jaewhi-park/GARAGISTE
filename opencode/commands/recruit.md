---
description: Recruit a new role — when no existing agent fits (a different permission boundary or a separate judgment is needed), propose one to the CEO together with its model and create it on approval. The lead suggests it from /plan or /retro, never mid-build
agent: team-lead
---
Recruit a new team member. Gap: $ARGUMENTS

1. Justify or drop. A new role is warranted only when it needs (a) a permission boundary no current role has, or (b) a judgment separated from execution. If only knowledge is missing, propose a skill instead (team-planner writes .opencode/skills/<name>/SKILL.md after approval) and stop here.
2. One proposal, one question-tool call: role name `team-<slug>`, one-line description, when you will invoke it, permission preset (researcher: read-only + explore · author: docs/ only · engineer: edit + bash + commits · judge: read-only, report ends with a verdict line), and the model. Take the model from the current roster without asking a budget question again: the sibling role of the same kind (judge → team-reviewer, engineer → team-implementer, author → team-planner, researcher → team-verifier) and name it explicitly. Offer "skill only" as the alternative and give your recommendation with the reason.
3. After approval: have team-planner write the role prompt to docs/roles/team-<slug>.md (identity, procedure, report format; under 60 lines; no permissions — the preset carries them) and add one line to docs/DECISIONS.md.
4. Run `node .opencode/scripts/new-agent.mjs --flavor opencode --dest .opencode/agents --name team-<slug> --preset <preset> --description "<one line>" --body docs/roles/team-<slug>.md --like team-<sibling>` (`--model <id>` instead of `--like` when the CEO named a model). The script writes only the new agent file. Never create or edit agent files yourself. Then have team-implementer commit the new agent file, docs/roles/team-<slug>.md and the DECISIONS line (`chore(recruit): team-<slug>`) on the current branch.
5. Show the new agent as a /roster row. It loads from the next session; a later /hire re-assigns it like any other role.
