---
description: Team roster — table of each agent's model, permissions and role, plus how to change budget profile or individual models (read-only)
agent: team-lead
---
Read the frontmatter of .opencode/agents/team-*.md and present a table: agent / mode / model ("inherited" if absent) / tools or permissions summary / one-line role.

Below the table, explain how to change assignments. The recommended way is `/hire` (re-assign with the situation in view). To do it directly with the script:
- Budget profile: `./install.sh opencode -Budget unlimited|high|medium|low -Strong <provider/model> -Fast <provider/model>` or, without the template, `node .opencode/scripts/apply-models.mjs --flavor opencode --dest .opencode/agents --budget <tier> -Strong <provider/model> -Fast <provider/model>`
- Per-agent: add `--set team-reviewer=<model>` (repeatable). Back to inheritance: `--budget inherit`
- Available models: `opencode models`. The session model is switched with `/models`.
Never edit agent definition files yourself. Changes are made by a human through the commands above.
