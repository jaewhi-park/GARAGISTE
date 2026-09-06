---
description: Hiring — design per-role model assignments and an operating profile from available models, budget and project character; apply after CEO approval. Right after /kickoff or /assess, when the budget changes, or when the team is too slow or expensive
agent: team-lead
---
Hire the team (assign a model per role). Note: $ARGUMENTS

1. Candidates: run `opencode models` to list available models. For models you know by name, summarize strengths (reasoning, code, speed, cost, context). For models you do not know (e.g. in-house), do not guess — ask the CEO which is strongest, which is fastest, context length and cost constraints.
2. Conditions (one question-tool call): budget tier (unlimited / high / medium / low — sense of the usage cap), project character (see docs/CHARTER.md and ASSESSMENT.md — a legacy rebuild weights critic and reviewer; a prototype weights speed), whether parallel development is planned, and any role to make deliberately strong or cheap.
3. Proposal: a role × model table with a one-sentence reason per row and a note of where tokens concentrate. Principle: the strongest model where judgment happens (planner, critic, reviewer); the fastest model for verifier; implementer by budget. Also propose an operating profile: default review lenses (2 or 4), parallelism (none / session-level), minimum steps for critic.
4. After CEO approval, apply:
   - Models: `node .opencode/scripts/apply-models.mjs --flavor opencode --dest .opencode/agents --budget inherit --set team-lead=<id> --set team-planner=<id> --set team-critic=<id> --set team-implementer=<id> --set team-reviewer=<id> --set team-verifier=<id>`. The script changes only `model:` lines. Never edit agent files directly.
   - Operating profile: have team-planner write the "## Operating profile" section of AGENTS.md (budget tier / default review lenses / parallelism / critic minimum steps / hire date and one-line reason).
5. Show the result in /roster form and note that model assignments take effect from the next session.
