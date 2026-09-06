---
name: roster
description: Team roster — table of each agent's model, permissions and role, plus how to change budget profile or individual models (read-only)
argument-hint: ""
---
Read the frontmatter of .claude/agents/team-*.md and the `model` in .claude/settings.json and present a table: agent / model ("inherited" if absent) / effort / tools or permissions summary / one-line role.

Below the table, explain how to change assignments. The recommended way is `/hire` (re-assign with the situation in view). To do it directly with the script:
- Budget profile: `./install.sh claude -Budget unlimited|high|medium|low` or, without the template, `node .claude/scripts/apply-models.mjs --flavor claude --dest .claude/agents --settings .claude/settings.json --budget <tier>`
- Per-agent: add `--set team-reviewer=<model>:<effort>` (repeatable). Back to inheritance: `--budget inherit`
- Session model only: Claude Code's `/model`. Interactive editing: `/agents`. The session (lead) model is the `model` value in settings.json.
Never edit agent definition files yourself. Changes are made by a human through the commands above.
