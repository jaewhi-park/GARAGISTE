# GARAGISTE User Guide — opencode flavor

This document is for the human. It does not describe what the team does; it describes **what you do, and when**.
Configuration reference: README.md. Where artifacts live: docs/README.md. 한국어: GUIDE.ko.md.

## 0. One-page summary

You have three jobs: **set the direction / look at the product / say what you want.**
The team does the rest — it writes the spec, plans, builds, reviews and merges low-risk work on its own, in iterations of 2–4 plans, and stops to look at you after each one. You never have to type a command: say it, and the lead runs the procedure. You read a diff only when the team asks you to merge `risk:high` work (data, interfaces, security).

![The workflow in one picture: the start line joins the main line every piece of work takes; the hotfix line skips the plan; the parallel branch rejoins at /ship; the after-merge loop returns to /plan; double rings are where you answer or approve](../assets/workflow-map.svg)

| You say | What the team does | What you do, in one line |
|---|---|---|
| (first session) an idea, or the path of a document you wrote | Brainstorms with you, compiles docs/BRIEF.md, asks the open slots once, runs the pre-mortem | Talk freely; answer the slots honestly; approve the brief — the one document you approve |
| "진행해" after the brief | `/kickoff` (or `/assess` for legacy): one question — the stack and the budget — then charter, spec, backlog, first plan and hire; the board says `Mode: running` | Answer the one question; open a new session and say 계속 |
| "어디까지 됐어?" | Reconciles the board with git and answers: what is tryable, what changed, what waits on you | Nothing; try the product from main (the board's Run line) |
| "계속" | Runs the next iteration (2–4 plans: plan → build → review → ship → merge), then stops with an iteration review | Read the review, try what it lists, say what you want |
| "이거 추가하자" (a feature, in your words) | Writes a spec section and a backlog item from your words; plans it now if you say now, else next iteration | Say as much as you want; you are asked only what costs money or touches security |
| "이거 바꿔" / "이거 없애" | Revises the spec section, sorts the plans (rework · amend · re-plan), continues | Talk it through; you are asked only when shipped work is discarded |
| "이거 버그야" | A hotfix when it is one sentence with an obvious check, else a `bug:` plan at the head of the next iteration | Give the reproduction |
| "이거 먼저" | Reorders the backlog and the next iteration | Nothing else |
| "멈춰" | Finishes the step in progress, commits the board, waits (`Mode: paused`) | Say what you want next |
| (the team asks) | An escalation: money, security or user data, a non-goal conflict, a fix loop past 3 rounds, `risk:high` work to merge | Answer in the decision / options / recommendation / default form; read the `risk:high` diff and merge |
| (the team stops on its own) | The iteration review: tryable now · changed · check please · next iteration | Try it; then "계속" or an instruction |
| (a session died mid-turn) | Reconciles the board with git at your first message and continues; at most one step is redone | Open a session and say anything |
| `/spawn <plans>` → `/integrate` | Worktree and branch per plan, a session each, serial integration, one PR | Only when files do not overlap; not in the first two weeks |
| `/release [version]` | Version, CHANGELOG, release notes, the tag command | Push the tag |
| `/retro <subject>` | Causes → rules, skills, hooks | Approve only one-line rules backed by an incident |
| `/hire`, `/roster`, `/recruit <gap>`, `/lang <code>` | Models and budget, the roster, a new role, the working language | Only when something is wrong or the budget changes |
| any slash command | The same procedure the lead would run for your words | Optional — typing it is never required |

What you will be asked, and nothing else: the stack and the budget once at kickoff; anything that costs money (a paid service, a new runtime dependency); anything that touches security, authentication or user data; a request that crosses the brief's non-goals; a change that discards shipped work; a fix loop the team could not close in three rounds; and `risk:high` work to merge. Everything else the team decides with a default and writes into docs/DECISIONS.md, where you can read it.

## 1. Install and first run


Three install targets. Give the flavor (opencode) to the entry point at the repository root:
```
./install.sh opencode                       # current directory (its git repo root)
./install.sh opencode -Project <path>       # install into that path (--project works too)
./install.sh opencode -Global               # global
.\install.ps1 opencode -Project <path>      # Windows PowerShell — same options
```
`opencode/install.sh` does the same without the flavor argument.
- If the path is a subfolder of a repo, the script walks up to the git root and tells you. If it is not a git repository, it offers `git init`.
- `-Global` → ~/.config/opencode (every repo). A global install cannot touch a project's .gitignore; if an older install git-ignored `docs/STATUS.md` there, remove that line yourself — the board is committed.

**Windows execution policy**: if `.\install.ps1` is blocked with "cannot be loaded because running scripts is disabled", either
- once: `powershell -ExecutionPolicy Bypass -File .\install.ps1 …`
- permanently (recommended): `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then `Unblock-File .\install.ps1` (removes the downloaded-file mark)

**Korean text garbled on Windows**: depends on where it breaks.
- Only `install.ps1` output → script encoding. This bundle's .ps1 files are saved as UTF-8 with BOM, which Windows PowerShell 5.1 reads correctly. If you edited them, save as UTF-8 with BOM.
- The whole terminal (claude/opencode output, git log) → console encoding. Put two lines in `$PROFILE`: `[Console]::InputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)` / `$OutputEncoding = [Console]::OutputEncoding`. Temporarily, `chcp 65001`.
- Characters show as □ → font. Use Windows Terminal with a font that has Hangul glyphs (D2Coding, Sarasa Mono K). Legacy conhost with raster fonts cannot draw Hangul.
- Root fix: Settings → Time & Language → Language → Administrative language settings → Change system locale → check "Beta: Use Unicode UTF-8 for worldwide language support" (reboot). Some old Korean programs may break; if so, use the profile method.

**Where to extract**: unpack the template zip outside the project (e.g. `~/garagiste`) and call `~/garagiste/install.sh opencode -Project .` from the project root. Extracting inside the project also works (the script detects it and skips copying), but the template's README.md then occupies the project README slot.

**Not a git repository**: the team relies on branches, commits and worktrees. The installer offers `git init` (default branch main); accept it.

First run: run `opencode` in the repo → Tab to select `team-lead` → say your idea (or give the path of a document you wrote): the lead brainstorms with you, compiles the brief and asks you to approve it → say "진행해": one question (the stack and the budget), then the team writes the charter, the spec, the backlog and the first plan, and leaves the board at `Mode: running` → open a new session (model assignments load at session start) and say "계속".
Check: `/kickoff` etc. appear in the command list, and once docs/CHARTER.md and docs/STATUS.md exist they are injected at session start (`instructions` in opencode.json).

**Permissions**: the team's safety is the agents' permission blocks and the guardrail plugin, not a prompt. Team agents carry explicit allow/deny, so nothing inside the team asks you; the built-in build/plan agents follow the global default (ask). In headless runs (`opencode run`) prompts cannot appear. Never widen a permission block for something the guardrail message says is blocked — that is the boundary working.

### Models and budget — `/hire`
When `/kickoff` or `/assess` finishes, the lead suggests `/hire`; run it and it takes the budget tier you gave there and the project's character from the brief: it confirms available models (`opencode models`), proposes a role × model table with reasons and applies it — no second question. The roster is shown; change a line by saying so. Run `/hire` yourself when the budget changes (then it asks the tier). Principle: the strongest model where judgment happens (planner, critic, reviewer), the fastest model for the verifier, the implementer by budget. A script changes only the `model:` lines and an "Operating profile" is left in AGENTS.md; it takes effect from the next session. `/roster` shows the current assignment.

### Language
Agent prompts are English. Responses, questions and documents follow the `## Language` line in AGENTS.md. The lead asks for it once at the first brainstorm; `/lang <code>` changes it any time (a script rewrites only that section). When unset, agents mirror the language of your latest message, but an English command template can still tip the lead into English: if that happens, say so or run `/lang`.

## 2. How the team works without you

- **One document is yours: the brief.** docs/BRIEF.md is what you approved. The team derives the charter (the constitution every plan is judged against) and writes the spec — docs/specs/, one file per feature (F1, F2, …) with docs/SPEC.md as the index — from the brief and from your own words in its appendix. Open slots get a default and a line in docs/DECISIONS.md, never a question, unless the escalation list says otherwise.
- **Work runs in iterations.** The lead picks 2–4 backlog items that add up to something you can try, and for each: a plan from the spec section (the critic reviews every plan; its APPROVE is the approval), then build → review → ship → merge. At the end it writes the iteration review and stops. A `risk:high` PR pauses the iteration until you merge it, because the next plan may build on it.
- **Every step is proven before the next.** A logic step has one to four `proves:` lines in plain words; each becomes a test that is red before the change and green after. A UI step also has `shows:` lines — the screens and their four states (empty, loading, error, success) — proven by screenshots the reviewer looks at. The verifier runs the whole suite at the end of a build, after review fixes and before shipping.
- **Review is by lens, and lenses are mechanical.** Correctness and security always; performance and maintainability when the risk is high or the diff is big; the ux lens whenever the diff touches a UI path. Risk is a file match against the rules file's "Risk paths", never an opinion; the team can raise it, never lower a hit.
- **Merging follows the repository.** No remote → a local merge; a remote → a PR. In every case `risk:low` work whose verification, review and checks are green is merged by the lead; `risk:high` waits for you. Main is always runnable: the board's Run line is how you start the product.
- **The board is your window.** docs/STATUS.md (injected at every session start, committed at each cut point) carries Mode, the iteration, what is tryable now, what the team wants your eyes on, what waits on you and what comes next. Git is the truth when they disagree.
- **Sessions end; the work does not.** The lead reconciles the board with git at the first message of every session and continues on its own when Mode is running. An interruption costs at most the step in progress. A compaction summary in the lead's context makes it finish the step, commit the board and ask for a new session.
- **Failures feed back.** Metrics per plan (rework, questions, tests, duration) go to docs/METRICS.md; `/retro` turns repeated failures into one-line rules, skills or hooks — only the ones with an incident behind them.

## 3. Situations

Every entry has the same shape: when / what you say / what the team does / **what you do** / what to watch for.

### 3.1 Starting a product
- When: the repo is empty, or the idea precedes the code.
- You say: your idea, in a first session — or "여기 문서 있어: <path>" for a document you wrote.
- Team: brainstorms (the lead proposes and pushes back; no agenda) or normalizes your document → "기획서 만들어줘" → docs/BRIEF.md compiled (decided / later / rejected with reasons; your words about flows and screens kept verbatim in the appendix) → the slots the brainstorm left open are asked once → critic pre-mortem, presented to you as a correction round → your approval → docs commit. Then "진행해": `/kickoff` — charter derived (defaults logged), stack ADR with a design foundation and a security baseline (critic-reviewed), the one question (stack, budget, and only the undecided items that cost money or touch security), skeleton with one smoke test, AGENTS.md, the spec, the backlog, the walking-skeleton plan, critic review of spec and plan, the hire applied from your budget answer, the board at `Mode: running`.
- You: talk the way you would in a chat, and say everything you have about features — it is kept and becomes the spec, and nobody asks you again. Answer the open slots honestly: **three non-goals**, a **measurable success metric** and the **kill criterion** are what brainstorms skip and what every later verdict is judged against. Read the pre-mortem findings (each comes with a default). Approve the brief. At kickoff read the ADR's "why not the alternatives" and answer the one question. Then open a new session and say "계속".
- Watch for: a success metric that is not a number or an observable fact; a brief that does not say what was rejected and why; handing the stack decision to the team wholesale — it is the most expensive decision to reverse. When the direction changes later, say so: the lead revises the brief, and the charter and the spec follow.

### 3.2 Taking over legacy code
- When: there is existing code to fix or replace.
- You say: why the rebuild happens, the target state, what must not change, the deadline — one paragraph and "기획서 만들어줘" is enough; then "진행해" and, if the lead asks for it, the path.
- Team: a short rebuild brief (Kind: 레거시) → `/assess`: inventory (docs/ASSESSMENT.md; "looks like a bug" items that conflict with the brief are marked) → the preserve/fix policy in one call → strategy and first seam (ADR, docs/REBUILD_PLAN.md, AGENTS.md), the charter derived and logged → the one question (the strategy and the budget) → a plan for the first seam's parity harness (critic-reviewed) → docs commit → the hire → the board at `Mode: running`. Every later rebuild step extends the harness to its seam first.
- You: two decisions. (1) Preserve or fix each "current behaviour that looks like a bug" — one call with defaults: accept them or name the items to fix. (2) The strategy (strangler fig / module-by-module / full rewrite), with the budget on the same question. The default is strangler fig; a full rewrite needs evidence from the team.
- Watch for: a rebuild step without a parity harness that passes against legacy (docs/PARITY.md lists what it covers) — the team refuses to start one, and so should you. In legacy without a written spec, the only spec is current behaviour; what should change beyond it is said by the brief and nothing else.

### 3.3 Watching the work
- When: any time.
- You say: "어디까지 됐어?" — or nothing: open the board (docs/STATUS.md) or run the product from main with the board's Run line.
- Team: at the end of every iteration, the review — Tryable now (the run command and what to try), Changed this iteration, Check please (what it wants your eyes on: a screen you have not seen, the brief's riskiest assumption now testable, something it is unsure you meant), Next iteration. Between reviews the board's Tryable now grows with every merged plan.
- You: try the product. You do not read plans, PRs or the spec unless you want to; the critic, the reviewers and the verifier did. Then say what you want — "계속", or an instruction.
- Watch for: a Check-please line — it is the team asking for judgment it cannot make itself; answer it before "계속". A Tryable-now line you cannot make work is a bug report: say what you did and what happened.

### 3.4 Adding or changing a feature
- When: after trying the product, or whenever an idea arrives.
- You say: "이거 추가하자", "이거 바꿔", "이거 없애", "이 화면 이렇게 말고 저렇게" — in your words, at any length. A one-sentence, unambiguous instruction is acted on at once; a longer explanation is listened to until you say "정리해줘" or "진행해".
- Team: classifies it (product direction → the brief; a feature's behaviour or screens → its spec section; a new feature → a new section and backlog item; a priority → the backlog), writes it down through the planner in your words, reports the impact — which shipped work it invalidates, which plan in flight it touches, which unstarted plans change — sorts the plans (rework items, an amendment after the last passed step, re-plans), has the critic check the changed section, and continues: now if you said now, otherwise at the head of the next iteration.
- You: talk it through when the lead asks back (it proposes options and costs); confirm the one-line reading when it asks. You are asked one question only when shipped work would be discarded — the plans and what is lost, default: proceed.
- Watch for: a remark ("이 화면 좀 별로네") is not an order — the lead asks "바꿀까요?" and waits; if you meant it, say so. A change that crosses the brief's non-goals gets "that is a brief revision" instead of a plan: run the brainstorm again in that case.

### 3.5 Bugs
- When: something does not work.
- You say: "이거 버그야" with what you did, what happened and what you expected — input, environment, since when. "가끔 이상함" cannot be planned.
- Team: one sentence with an obvious check (a defect with a reproduction, a wrong string, value or default) → `/hotfix`: a regression test that fails before the fix, the fix, full verification, one review lens, merged as `risk:low`, before the iteration goes on. Anything else → `/plan bug: …` at the head of the next iteration (or now, if you say now): investigation → hypothesis → a failing reproduction test → the fix → review.
- You: give the reproduction. If the team goes straight to a fix without a failing test, send it back.
- Watch for: three hotfixes in the same area — that is a plan and a retro subject (the METRICS `hotfix:` lines pile up). A fix that only hides the symptom.

### 3.6 Priorities and the backlog
- When: you know what matters next.
- You say: "이거 먼저", "이건 나중에", "이건 빼" — or nothing: the team takes the backlog in its own order (rework and bug items first, then priority against the charter).
- Team: docs/BACKLOG.md holds every item with completion criteria and a `spec:` link; the planner grooms it (sweeping the brief's Later lines and the spec sections for uncovered Done-when lines), and the board's Next iteration line says what comes next.
- You: change the order by saying so. If an item looks bigger than a day, say "split it" — the planner cuts by what can be tried, never by layer.
- Watch for: keeping the backlog in your head instead of the team's — then nobody catches conflicts with the charter.

### 3.7 When the team asks you
- When: an escalation — the list in section 0 — or a `risk:high` PR.
- Team: one question at a time, in the form decision / 2–3 options / recommendation with reason / default if you do not answer; the board's Waiting-on-CEO line carries it, so a new session asks it again. For a `risk:high` PR: verification evidence, the review findings and how they were handled, risks and rollback, and the diff.
- You: follow the recommendation or change it with a reason. For the PR, use the checklist in section 4 and merge it yourself; the iteration waits for it.
- Watch for: the same question twice — decisions live in docs/DECISIONS.md and the lead must follow them; if it asks again, that is a retro subject. A question outside the escalation list is one too.

### 3.8 Merging and releasing
- Lead-merge: in every policy below, `risk:low` work whose verification, review and checks are green is merged by the lead without asking; only `risk:high` (a Risk-paths hit, an escalation item) waits for you — the one diff you read.
- Main merges follow the repository state (`/ship` resolves it; `/policy` shows the verdict and why):
  - No remote → `local`: the PR description is saved under docs/prs/NNNN-<slug>.md and the lead merges locally with `merge --no-ff` (`risk:high`: after your approval).
  - Remote, no protection → `manual`: the team pushes, opens the PR and merges `risk:low` once checks pass; `risk:high` waits for you.
  - Remote + main protected (required checks = CI) + auto-merge allowed → `auto-low-risk`: `risk:low` merges automatically when CI passes.
- The team can never force-push or push directly to main (hooks). Every merge goes through a PR or a local merge on the rules above.
- **The day you attach GitHub**: `git remote add origin …` and the first push; `/ship` switches to the PR flow by itself. Turn branch protection on: the lead's `risk:low` merge is a prompt rule, and protection with required checks is what makes it a repository rule.
- `/release [version]`: version proposal → full verification → CHANGELOG finalized → docs/releases/<version>.md → the tag command, which you run. A major/minor question comes when interfaces changed. Release notes are user-facing — what changes for them, known issues, rollback.
- Watch for: enabling auto-merge without branch protection; a conflict resolution merged without its correctness re-review (the team re-reviews it; check).

### 3.9 Sessions: stopping, resuming, interruptions
- Ending: say "멈춰" — the team finishes the step in progress, commits the board (`Mode: paused — stopped by CEO`) and waits. `/handoff` does the same and also commits work in progress as `wip:`. After a finished iteration nothing is needed: the board and the commits are already there.
- Resuming: open a session and say anything. The lead reconciles the board with git, worktrees and PR state first (the repository wins), then acts on the board's Mode: running → continues the iteration; paused → the iteration review again and waits; waiting on you → the question again.
- Interruptions (Esc, an error, a usage cap, a closed window): every finished step is a commit and the board is committed at each cut point, so the next session recovers from git and redoes at most the step in progress. If you interrupt to say something, the lead reconciles first and then listens.
- Compaction: the compaction plugin marks the summary and the lead treats it as the signal — it finishes the step, commits the board and asks for a new session. Summaries stacked on summaries degrade the work, so the default is a fresh session — one session = one iteration. Use `opencode -c` only for a short interruption.
- Upgrading a project that git-ignored docs/STATUS.md under the old flow: re-run the installer (it removes the .gitignore line); the next milestone commit adds the board to the repository.

### 3.10 When the team spins
- Signals: the same failure three times, repeated questions, a diff growing beyond the plan.
- What you do, in order:
  1. Say "멈춰". Do not try to talk it back on track.
  2. Open a fresh session and say what you saw — the lead reconciles first and then listens.
  3. If it stalls at the same place again, the plan is wrong: say "이 계획 다시 짜, 단계를 더 잘게".
  4. Environment problems (dependencies, permissions, mismatched commands) show up in the verifier report as "environmental" — fix those yourself.
  5. On the second recurrence, `/retro`. If speed or cost is the problem, `/hire` to reassign.
- Watch for: repeating "다시 해봐" in a spinning session. A polluted context gets worse the longer you keep it alive.

### 3.11 Retrospectives
- When: the same mistake twice, a change that discarded shipped work, after an incident, after a release.
- You say: `/retro <plan slug | session | incident>` — or "회고 하자".
- Team: reads the docs/METRICS.md trend first (rework, questions, tests per plan, duration; `bug:` plans naming a shipped slug; `hotfix:` lines piling up) → pinpoints at most three places where rework, verification failures, review blockers or your intervention occurred, with root causes → proposes a countermeasure per cause and where it belongs (one rule line in AGENTS.md / a skill / a hook, which blocks physically / a "Risk paths" or "UI paths" glob / the plan format / agent memory) → applies only what you approve.
- You: approve **only rules with a violation behind them**. Reject generalities ("always be careful"). When AGENTS.md passes 300 lines, ask for procedures to move into skills.
- Watch for: repeating the same prompt instead of a retro; approving a pile of rules that bloats AGENTS.md.

### 3.12 Parallel work (advanced)
- When: two or more features that are independent at the file level, and sequential is too slow. **Not in the first two weeks.**
- The one way: `/spawn <plan files>` creates a worktree and branch per approved plan and prints the command to open a session there; in that session `/build <plan>` implements it on its own branch; the board belongs to the main checkout and the worktree session never edits it.
- Then, from the main session, `/integrate` reviews and merges the finished branches one at a time into an integration branch and `/ship` ships that branch as one PR. opencode has no in-session builder: every parallel plan is its own session, and a session interrupted mid-plan continues on its branch from the step after its last commit.
- Prerequisites: `.opencode/` and `opencode.json` committed so worktree sessions have the team (or a global install); copy untracked files such as `.env` yourself.
- You: check that the plans' "files touched" sets do not overlap; decide the integration order (dependencies first). Zero overlapping files, or run them sequentially.
- Watch for: splitting one feature's steps across workers (steps are sequential); integrating several branches at once (always one at a time).

### 3.13 Expert commands
Every slash command still works and runs the same procedure the lead would run for your words. Useful when you want one step alone:

| Command | What it does |
|---|---|
| `/plan <item or F<n> or bug: …>` · `/plan <F<n> or plan file> 수정: …` | One plan from the spec section, the critic's APPROVE as approval · a section or plan revision |
| `/run <plan>` · `/build` · `/review` · `/ship` | The plan to the end · one stage at a time |
| `/hotfix <what and why>` | One pass, no plan file |
| `/backlog [idea]` · `/policy [verdict]` · `/roster` | Groom · merge-policy verdict or override · the team table |
| `/handoff [note]` · `/resume [note]` | Stop mid-flight · reconcile by hand (the lead does it itself at session start) |
| `/brainstorm`, `/kickoff`, `/assess <path>`, `/deliver` | The procedures behind the first session, "진행해" and "계속" |

## 4. Checklists

Before approving the brief:
- [ ] the success metric is a number or an observable fact
- [ ] at least three concrete non-goals, and a kill criterion
- [ ] "decided" holds capabilities one line each; the flows and screens you described are in the appendix, verbatim
- [ ] every rejected idea has its reason
- [ ] each undecided item says when it will be decided
- [ ] Kind says 신규 or 레거시 (path), so the next step is clear

What the critic holds every plan to (you do not approve plans — this is what its APPROVE means):
- [ ] completion criteria are verifiable statements (commands, tests, numbers)
- [ ] every logic step has one to four "proves" lines in plain words (or a reasoned `n/a`) and a verification command; a UI step has "shows" lines with the four states; a Risk-path plan has threat-model lines and a negative-case test per entry point
- [ ] logic-change steps are within the step-size target (default 300 changed lines, tests excluded) or state why not; mechanical changes are separate steps
- [ ] at most the plan-size target of logic steps (default 4), or the Steps line says why; a split is cut by what can be tried, not by layer
- [ ] no conflict with non-goals or the charter
- [ ] a rollback method is written down
- [ ] sections 1–2 are the spec section's Done-when and Not-this-time verbatim

Before merging a `risk:high` PR (the only PRs you merge):
- [ ] the verification evidence lists the commands run and zero failures (refuse if the test count is zero)
- [ ] the "Proven" section names a test per proves line with its red → green; run its command yourself if you doubt it
- [ ] review findings and how they were handled are listed
- [ ] you read the schema / interface / security diff yourself
- [ ] the test-file diff contains no skip, deletion or weakening
- [ ] mechanical commits (scaffold/gen/mechanical/deps) contain no logic change, and gen regenerates with a zero diff
- [ ] a rollback method is written down

## 5. Where tokens leak and how to stop it
- Repeatedly checking subagent status: forbidden by the lead's rules (synchronous calls, wait for completion). If you still see it, it is a `/retro` subject.
- Progress narration ("I will now…"): forbidden by rule. Results and decisions only.
- Auto-injected documents growing: CHARTER 60 lines, STATUS 40 lines. The lead keeps STATUS within the cap; the planner splits CHARTER when exceeded — there is no hard cap in opencode, so a file that grows past this is injected in full every session.
- A plan draws no questions: its source is the spec section, the bug line or your words, and the planner's defaults are logged. If a `/plan` still asks you something outside the escalation list, it is a `/retro` subject.
- Verifier per step: off by default — the implementer's red → green report carries each step and the verifier runs in full at the end of a build, after a review fix and before shipping. Turn it on in the operating profile (`/hire`) when you want an independent quick run per step; high-risk and legacy plans get it regardless.
- Lenses: two by default, four for high risk or a big diff, the ux lens on a UI-paths hit; all mechanical, all adjustable in the operating profile.
- Compaction: the compaction plugin marks the summary and the lead ends the session after the step in progress — you never have to notice it.
- The brainstorm and the revision discussions are the exception to short chats: say everything, and give paths and links rather than pasting documents (the planner reads them); the planner checkpoints the whiteboard every ten or so exchanges, so nothing is lost.
- On your side: do not re-ask the same question every session — decisions are in docs/DECISIONS.md and the lead follows them. One iteration per session. When the context gets heavy, "멈춰" and start fresh — the board is committed, so nothing is lost between sessions.

## 6. Do not
- Order large work in chat without a plan (say `/plan <it>` — the team writes the section and the plan)
- Merge a `risk:high` PR on a green light without reading the diff and the evidence
- Treat a remark as an order, or expect the team to (say "바꿔" when you mean it)
- Change direction in chat while the team is working (say "멈춰", then say what changed)
- Fix reviewer findings yourself (tell the lead; the implementer fixes)
- Keep a spinning session alive
- Enable auto-merge without branch protection
- Approve generalities in a retro
- Leave the verification commands in AGENTS.md out of sync with reality
