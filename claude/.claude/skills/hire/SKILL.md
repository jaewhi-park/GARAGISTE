---
name: hire
description: Hiring — design per-role model assignments and an operating profile from available models, budget and project character; apply after CEO approval. Right after /kickoff or /assess, when the budget changes, or when the team is too slow or expensive
argument-hint: "[note: budget, preferences]"
---
This skill runs only when the CEO invoked it directly or from the closing step of /kickoff or /assess via the Skill tool. Either way, assignments are applied only after CEO approval.

Hire the team (assign a model and effort per role). Note: $ARGUMENTS

1. Candidates: the default candidates are the aliases opus / sonnet / haiku (they resolve to the plan's latest models). Include other model IDs (API, Bedrock, Vertex) only if the CEO names them. Plan and usage caps cannot be read from the CLI — ask, do not guess.
2. Conditions (one AskUserQuestion call): budget tier (unlimited = API/in-house / high = Max 20x / medium = Max 5x / low = Pro), project character (see docs/BRIEF.md, docs/CHARTER.md and ASSESSMENT.md — a legacy rebuild weights critic and reviewer; a prototype weights speed), whether parallel development is planned, and any role to make deliberately strong or cheap.
3. Proposal: a role × model × effort table with a one-sentence reason per row and a note of where tokens concentrate. Principle: strong model and high effort where judgment happens (planner, critic, reviewer); verifier on haiku·low; implementer by budget. Also propose an operating profile: default review lenses (2 or 4), parallelism (none / session-level / /parallel), minimum logic steps for critic, per-step verifier (on | off — keep on for risk:high plans and legacy), step-size target (default 300 changed lines). On the low tier, drop parallelism and 4 lenses from the defaults.
4. After CEO approval, apply:
   - Models and effort: `node .claude/scripts/apply-models.mjs --flavor claude --dest .claude/agents --settings .claude/settings.json --budget inherit --set team-lead=<model>:<effort> --set team-planner=... --set team-critic=... --set team-implementer=... --set team-builder=... --set team-reviewer=... --set team-verifier=...`. The session (lead) model is written to settings.json from the team-lead value. The script changes only model/effort lines. Never edit agent files directly.
   - Operating profile: `node .claude/scripts/set-profile.mjs --file CLAUDE.md "budget tier: <tier>" "default review lenses: <2|4>" "parallelism: <none|session|parallel>" "critic minimum steps: <n>" "per-step verifier: <on|off>" "step-size target: <n>" "hired: <date> — <one-line reason>"`. The script rewrites only the "## Operating profile" section; no planner call.
   - Commit: have team-implementer commit the files the scripts changed inside the repository (agent files under .claude/, .claude/settings.json, CLAUDE.md), by path, as `chore(hire): <tier> — models and operating profile` on the current branch.
5. Show the result in /roster form and note that model assignments take effect from the next session.
