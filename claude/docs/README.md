# docs/ — the company's operating system

If the code is the product, this directory is the company. Agents forget when a session ends; what is written here remains.

| File | Function | Written by | When |
|---|---|---|---|
| CHARTER.md | Governance — the constitution | /kickoff, /assess (minimal) | at kickoff, when scope drifts |
| BACKLOG.md | Product — what and why | /backlog | when ideas or requests appear |
| specs/NNNN-*.md | Product — what exactly and when done (complex features) | /plan (spec rounds, via the planner) | when the CEO opts in at intake |
| plans/NNNN-*.md | Engineering — how (sections 1–2 from the intake or spec) | /plan | every piece of work |
| adr/NNNN-*.md | Architecture decisions — why this design | planner | every hard-to-reverse decision |
| DECISIONS.md | Autonomous decision log | planner | whenever the lead decides without the CEO |
| STATUS.md | Status board (session pointer; local, git-ignored, never committed) | lead | every step, verdict, decision, spec round; end of kickoff/assess/plan/ship |
| METRICS.md | Governance — one line per plan | /ship | every ship (/retro reads it) |
| prs/NNNN-*.md | PR description when there is no remote | /ship (local mode) | every local-mode ship |
| releases/<ver>.md | Operations — release notes | /release | every release |
| roles/team-*.md | Role prompt of a recruited agent (permissions come from the preset) | /recruit | when the CEO approves a new role |
| ASSESSMENT.md, REBUILD_PLAN.md, PARITY.md | Legacy only | /assess | rebuild projects |

CHARTER.md and STATUS.md are injected into every session (via the SessionStart hook). STATUS.md is local to the checkout — each worktree has its own — and is never committed (the project installer git-ignores it; after a global install add the line yourself); milestone commits (docs(plan), docs(kickoff), …) carry the durable state.
