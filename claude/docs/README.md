# docs/ — the company's operating system

If the code is the product, this directory is the company. Agents forget when a session ends; what is written here remains.

| File | Function | Written by | When |
|---|---|---|---|
| BRIEF.md | Product — the brief (기획서): direction, decided / later / rejected, non-goals, success metric, sketches | /brainstorm (via the planner) | before kickoff or assess; revised on a pivot |
| CHARTER.md | Governance — the constitution, derived from BRIEF.md | /kickoff, /assess | at kickoff or assess; when the brief is revised |
| BACKLOG.md | Product — what and why | /backlog (seeded by /brainstorm `req:` items and /kickoff) | when ideas or requests appear |
| specs/F<nn>-*.md, SPEC.md | Product — what exactly and when done: one file (F<n>) per feature and the index; the team's expansion of the brief | /kickoff (via the planner: the index, every row pending); /plan writes the file when a row's turn comes or a feature arrives | the index at kickoff; a file per feature when its turn comes; revised via `/plan F<n> 수정:` (rev n) |
| plans/NNNN-*.md | Engineering — how (sections 1–2 from the spec section) | /plan | every piece of work except a /hotfix (its commit body carries the why); amended via `/plan <plan> 수정:` (rev n, from the step after the last PASS) |
| adr/NNNN-*.md | Architecture decisions — why this design; 0001-stack also names the design foundation (one line) and the security baseline's scaffold lines; the rest is decided by the first plan that needs it | planner | every hard-to-reverse decision |
| screens/<plan-slug>/*.png | Evidence — a screenshot per screen and state named by a UI step's `shows:` lines (git-ignored; the `screenshots:` command regenerates them) | implementer, verifier | every UI step; before the ux lens |
| DECISIONS.md | Decisions that are hard to reverse or that the CEO made or overturned — one line each; a default lives in its plan or section | planner | when such a decision is taken |
| DEBT.md | Technical debt — reviewers' minor findings and cleanups nobody needs yet, one line each; /backlog promotes a line that grew into work | implementer (fix round or ship), planner | every review with minor findings |
| archive/BACKLOG-<year>.md, archive/DECISIONS-<year>.md | Settled lines moved out of BACKLOG.md and DECISIONS.md (shipped, dropped, merged or stale items; a shipped plan's internal decisions) — nothing is deleted, a line moves back when its item reopens | planner (the backlog skill's Archive rule) | /release; /backlog when BACKLOG.md is over 300 lines |
| memory/team-planner.md, memory/team-reviewer.md | The agents' long-term memory (under 60 lines each): architecture facts and recurring defect patterns | planner, reviewer (its only writable file) | at the end of their calls |
| ARCHITECTURE.md | The architecture map (directories, responsibilities, entry points) and notes on the commands — kept out of CLAUDE.md so the rules file stays small | planner | kickoff, assess; when the layout changes |
| measurements/NNNN-*.md | The record of an experiment step (under 80 lines): conditions, N, the table, the verdict against the threshold fixed before the run | implementer | every experiment step |
| STATUS.md | The CEO's page of the board: Mode, Try it (one script per iteration), For you (at most three lines), Decided by default; under 1,800 characters, enforced by the hook | lead | every step, verdict, decision; committed at the approval commits, ship, a question waiting on the CEO, handoff, a compaction stop |
| STATUS-team.md | The team's pointer of the board: Iteration, Now (plan, step, verifier, findings, counts), Awaiting integration, Next actions, Notes; under 40 lines | lead | with STATUS.md |
| METRICS.md | Governance — one line per plan or hotfix (`hotfix:<slug>`) | /ship, /hotfix | every ship (/retro reads it) |
| prs/NNNN-*.md, prs/hotfix-*.md | PR description when there is no remote | /ship, /hotfix (local mode) | every local-mode ship |
| releases/<ver>.md | Operations — release notes | /release | every release |
| roles/team-*.md | Role prompt of a recruited agent (permissions come from the preset) | /recruit | when the CEO approves a new role |
| ASSESSMENT.md, REBUILD_PLAN.md, PARITY.md | Legacy only | /assess | rebuild projects |

CHARTER.md, STATUS.md and STATUS-team.md are injected into every session and again after every compaction (via the SessionStart hook). The board is committed at the cut points and changes uncommitted between them: the repository is the truth and the board the pointer, so a stale board is rewritten from git at the first turn of a session (the resume procedure). It belongs to the main checkout — a linked worktree carries a copy it must not edit; milestone commits (docs(brief), docs(plan), docs(kickoff), …) carry the durable state. BRIEF.md is never injected: the commands that need it name it.
