# docs/ — the company's operating system

If the code is the product, this directory is the company. Agents forget when a session ends; what is written here remains.

| File | Function | Written by | When |
|---|---|---|---|
| BRIEF.md | Product — the brief (기획서): direction, decided / later / rejected, non-goals, success metric, sketches | /brainstorm (via the planner) | before kickoff or assess; revised on a pivot |
| CHARTER.md | Governance — the constitution, derived from BRIEF.md | /kickoff, /assess | at kickoff or assess; when the brief is revised |
| BACKLOG.md | Product — what and why | /backlog (seeded by /brainstorm `req:` items and /kickoff) | when ideas or requests appear |
| specs/F<nn>-*.md, SPEC.md | Product — what exactly and when done: one file (F<n>) per feature and the index; the team's expansion of the brief | /kickoff (via the planner); /plan adds a file for a new feature | at kickoff; extended when a feature arrives; revised via `/plan F<n> 수정:` (rev n) |
| plans/NNNN-*.md | Engineering — how (sections 1–2 from the spec section) | /plan | every piece of work except a /hotfix (its commit body carries the why); amended via `/plan <plan> 수정:` (rev n, from the step after the last PASS) |
| adr/NNNN-*.md | Architecture decisions — why this design; 0001-stack also carries the design foundation and the security baseline | planner | every hard-to-reverse decision |
| screens/<plan-slug>/*.png | Evidence — a screenshot per screen and state named by a UI step's `shows:` lines (git-ignored; the `screenshots:` command regenerates them) | implementer, verifier | every UI step; before the ux lens |
| DECISIONS.md | Autonomous decision log | planner | whenever the lead decides without the CEO |
| STATUS.md | Status board (Mode, Iteration, Tryable now, the session pointer; committed at the cut points) | lead | every step, verdict, decision, brainstorm checkpoint; committed at the approval commits, ship, a question waiting on the CEO, handoff, a compaction stop |
| METRICS.md | Governance — one line per plan or hotfix (`hotfix:<slug>`) | /ship, /hotfix | every ship (/retro reads it) |
| prs/NNNN-*.md, prs/hotfix-*.md | PR description when there is no remote | /ship, /hotfix (local mode) | every local-mode ship |
| releases/<ver>.md | Operations — release notes | /release | every release |
| roles/team-*.md | Role prompt of a recruited agent (permissions come from the preset) | /recruit | when the CEO approves a new role |
| ASSESSMENT.md, REBUILD_PLAN.md, PARITY.md | Legacy only | /assess | rebuild projects |

CHARTER.md and STATUS.md are injected into every session (via `instructions` in opencode.json). STATUS.md is committed at the cut points and changes uncommitted between them: the repository is the truth and the board the pointer, so a stale board is rewritten from git at the first turn of a session (the resume procedure). It belongs to the main checkout — a linked worktree carries a copy it must not edit; milestone commits (docs(brief), docs(plan), docs(kickoff), …) carry the durable state. BRIEF.md is never injected: the commands that need it name it.
