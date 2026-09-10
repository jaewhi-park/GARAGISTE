# GARAGISTE User Guide — opencode flavor

This document is for the human. It does not describe what the team does; it describes **what you must do, and when**.
Configuration reference: README.md. Where artifacts live: docs/README.md. 한국어: GUIDE.ko.md.

## 0. One-page summary

You have four jobs: **decide / read the evidence / set the quality bar / merge (per policy).**
The team does the rest. You do not type code (typo-level fixes excepted). You do read any diff that touches data, interfaces or security.

| Situation | Command | What you do, in one line |
|---|---|---|
| New project | `/kickoff <idea>` | Answer the charter questions honestly; approve the stack ADR |
| Legacy takeover | `/assess <target>` | Decide preserve-or-fix for "behaviour that looks like a bug"; approve the rebuild strategy |
| Hiring | `/hire` | Answer the budget-tier and character questions; approve the assignment table (right after kickoff/assess) |
| Grooming | `/backlog [idea]` | Fix only the order of the top three |
| Design | (inside `/plan`) | Read the ADR's alternatives and consequences; check reversibility |
| Single-track development | `/plan <item>` → `/run <plan>` | Answer the one intake call (or state "done when" yourself), approve the plan once, answer gate questions only, keep your hands off |
| Complex feature | `/plan <item>` → "yes, spec" at intake | Answer 2–3 rounds in your own words, approve the spec, then the plan |
| Parallel development | `/spawn <plans>` → `/build` in each session → `/integrate` | Check that file sets do not overlap; decide the integration order |
| Review | (inside `/run`) or `/review` | Rule only on conflicting findings |
| QA | (verifier, automatic) + try it yourself | Read the commands run and failure counts, not the green light |
| Debugging | `/plan "bug: … reproduction test first"` | Give the most concrete reproduction you can |
| Troubleshooting | 3-strike rule, drop the session | When the team spins, stop rather than fix |
| Merging | `/integrate` / `/policy` | Local integration is the team's; main merges follow the automatic verdict (local / manual / auto-low-risk) |
| Shipping and releasing | `/ship` → `/release` | Read the PR's verification evidence; read the diff yourself if `risk:high` |
| Ending a session | `/handoff` | Check that "first action next session" in the report is right |
| Resuming a session | `/resume` | If board and repo disagree, side with the repo |
| Retrospective | `/retro <subject>` | Approve only one-line rules backed by an incident; reject the rest |
| Team check | `/roster` | Confirm model and permission assignments |
| Wrong language | `/lang <code>` | Asked once at the start of `/kickoff` or `/assess`; change any time |
| Missing role | `/recruit <gap>` | Only for a new permission boundary or a separate judge; a missing skill is not a role. Model comes from the roster, no extra /hire |

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
- `-Global` → ~/.config/opencode (every repo).

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

First run: run `opencode` in the repo → Tab to select `team-lead` → `/kickoff` for a new project, `/assess` for legacy, `/resume` to continue.
Check: the planner can write inside docs/ but not outside (edit patterns are repo-relative: `docs/*`, never `**/docs/**`), and the plugin blocks `git push --force`.

### Models and budget — `/hire`
When `/kickoff` or `/assess` finishes, the lead suggests `/hire`. It confirms available models (`opencode models`), asks you for a budget tier (unlimited / high = Max 20x / medium = Max 5x / low = Pro), the project's character and parallel plans, and proposes a role × model table with reasons. You approve it or change a line or two. Principle: the strongest model where judgment happens (planner, critic, reviewer), the fastest model for the verifier, the implementer by budget. On approval a script changes only the `model:` lines and an "Operating profile" is left in AGENTS.md. Takes effect from the next session. Pass `-Budget <tier> -Strong <id> -Fast <id>` at install time so the kickoff/assess session itself already runs the verifier on the fast model; `/hire` then refines it. Re-run `/hire` when the budget changes; `/roster` shows the current assignment. The installer's `-Budget` profiles distribute mechanically without judgment, for non-interactive use.

### Language
Agent prompts are English. Responses, questions and documents follow the `## Language` line in AGENTS.md. `/kickoff` and `/assess` ask for it first when it is not set; `/lang <code>` changes it any time (a script rewrites only that section). When unset, agents mirror the language of your latest message, but an English command template can still tip the lead into English: if that happens, run `/lang`.

## 2. Situations

Every entry has the same shape: when / command / what the team does / **what you do** / approval criteria / common mistakes.

### 2.1 Planning a new project
- When: the repo is empty, or the idea precedes the code.
- Command: `/kickoff <one or two sentences>`
- Team: charter questions → docs/CHARTER.md → stack ADR (critic-reviewed) → skeleton → AGENTS.md, ADR decision, backlog and walking-skeleton plan in one pass → full verification → `/hire`. The first `/run` happens in a new session (model assignments load at session start).
- You: answer the seven questions. Do not wave through **three non-goals** and the **success metric** — the charter is the yardstick for every later verdict. Read the stack ADR's "why not the alternatives" and approve.
- Approval criteria: is the success metric a measurable statement; did the verification commands actually pass on the skeleton (verifier report).
- Common mistakes: putting a feature list in the charter (that is the backlog). Handing the stack decision to the team wholesale — it is the most expensive decision to reverse, so choose it yourself.

### 2.2 Legacy takeover / rebuild planning
- When: there is existing code to fix or replace.
- Command: `/assess <path or description>`
- Team: inventory (docs/ASSESSMENT.md) → preserve/fix policy in one call → strategy and first seam (ADR, docs/REBUILD_PLAN.md, AGENTS.md) → a plan for the first seam's parity harness → `/hire` (a rebuild weights critic and reviewer). The harness is built through `/run` as plan 0001 in a new session; every later rebuild step extends it to its seam first.
- You: two decisions only. (1) preserve or fix each "current behaviour that looks like a bug" — one call with defaults: accept them or name the items to fix. (2) the strategy (strangler fig / module-by-module / full rewrite). The default is strangler fig; a full rewrite needs evidence from the team.
- Approval criteria: does the parity harness PASS against legacy for the seam being rebuilt (docs/PARITY.md lists what it covers)? Without it, refuse to approve that step.
- Common mistakes: "let's just rewrite it" without a harness. In legacy without a written spec (docs/specs/), the only spec is current behaviour.

### 2.3 Design and architecture decisions
- When: hard-to-reverse decisions (data model, public interfaces, dependencies, stack).
- Command: none. During `/plan` the planner produces a comparison table and an ADR draft; the critic adds a pre-mortem; the lead asks when escalation criteria are hit. A spec, if any, is the input: it says what; the ADR answers how.
- You: follow the team's recommendation but **read the consequences and judge whether you can live with them**. Decide only the hard-to-reverse ones yourself; delegate the rest (they land in docs/DECISIONS.md).
- Approval criteria: does the ADR list two or more alternatives, each with a rejection reason?
- Common mistakes: intervening in every decision. Never reading the decision log — skim DECISIONS.md weekly so you know what the team decided on its own.

### 2.4 Backlog and priorities
- When: an idea arrives; you do not know what to do next.
- Command: `/backlog <idea>` or `/backlog` (groom only)
- Team: updates docs/BACKLOG.md, prioritizes against the charter, separates excluded items, proposes the top three.
- You: fix only the **order** of the top three. If an item looks bigger than a day, say "split it" or "spec it".
- Common mistakes: keeping the backlog in your head instead of the team's — then nobody catches conflicts with the charter.

### 2.5 Single-track development (the default)
- When: most work. One plan per session.
- Command: `/plan <backlog item or feature>` → intake (one call) → approve → `/run <plan file>`. For step-by-step control use `/build` → `/review` → `/ship` instead. For a complex feature answer "yes, spec" at intake: 2–3 chat rounds → docs/specs/NNNN-<slug>.md → approve the spec → the plan.
- Team: intake (one call: spec? / done when / not this time / fixed in advance — skipped when the request already says so, and for bug lines and re-plans; a backlog item skips all but the spec question, and only when it is size L or names a new page, screen, API or data model) → spec rounds if chosen (structure → detail → your corrections → approval; the planner writes docs/specs/NNNN-<slug>.md after every round) → plan (sections 1–2 are your answers or the spec verbatim) → critic review (3+ steps or high risk) → escalation questions → `/run`: branch → implement, verify and commit per step → review and fixes → ship and merge verdict. It stops only for escalation, a fix loop over 3 rounds, and merge approval.
- You: answer the intake in your own words when the options do not fit; the planner writes it down. The spec rounds are the one place you talk at length: answer in your own words, give paths and links (design file, similar screen, external doc) rather than pasting documents, and read the draft file yourself before correcting. Then **actually read the plan.** Are the completion criteria verifiable statements; are logic steps within the step-size target (300 by default; a larger step states why); does it stay inside the non-goals? After approval, keep your hands off. Questions arrive in the form decision / options / recommendation / default — take the recommendation or say why not.
- Approval criteria (plan): completion criteria · per-step verification command · rollback method — all three present.
- Common mistakes: ordering big work in chat without a plan. Two plans in one session. Changing direction while the team is working (stop and re-plan instead). Answering the intake with "your call" on the one thing you care about — you will reject the plan for it at approval. Ordering a complex feature with a one-liner and no spec.
- When a large diff is normal: scaffolding, generated code, lockfiles, bulk formatting/renames, deletions. If it is a separate commit labelled with its kind, the 300-line rule does not apply — but the review criteria differ: is it reproducible (regeneration diff zero), is logic mixed in, do build and tests pass. Do not read such commits line by line; check those three things.

### 2.6 Parallel development
- When: two or more features that are independent at the file level, and sequential is too slow. **Do not use it in the first two weeks.**
- Command: in the main session, `/spawn <plan files>` → the team creates a `../<repo>-<slug>` worktree and `plan/<slug>` branch per plan and prints the command for a new terminal → you open a terminal: `cd ../<repo>-<slug> && opencode` → `/build <plan>` in that session → finished branches are integrated in the main session with `/integrate`.
- Precondition: `.opencode/` and `opencode.json` must be committed so worktree sessions also have the team (or install with `-Global`). Copy untracked files such as `.env` into the worktree yourself.
- opencode subagents have no worktree isolation, so "in-session parallelism" is not supported. Parallel means session-level.
- You: check that the plans' "files touched" sets do not overlap, and decide the integration order (dependencies first). While it runs, answer each session's questions only.
- Approval criteria: zero overlapping files. If they overlap, run sequentially.
- Plans cut from one spec run in parallel only if the split proposal showed disjoint files and no depends-on; the spec's "done when" is checked as a whole after the last one ships.
- Common mistakes: parallelizing the steps of one feature (steps are sequential). Integrating several branches at once (always one at a time).

### 2.7 Review
- When: after `/build` finishes; before integrating each branch.
- Command: `/review [base branch]`
- Team: picks lenses by risk — correctness + security by default; performance + maintainability added for high risk, logic diffs over 600 lines or hot paths. Runs them in parallel → collects blocker/major → fix loop (max 3; only the fix diff is re-reviewed, by the lenses that objected) → all APPROVE.
- You: rule when findings conflict. Otherwise read the summary only. If a finding keeps recurring, note it as a `/retro` candidate.
- Common mistakes: approving without reading the review. Fixing reviewer findings yourself (have the implementer do it).

### 2.8 QA and verification
- When: always, automatically (verifier after every step by default; the operating profile can move it to the end of `/build`, where the full verification is the independent verdict). Human QA before shipping.
- Command: none. If needed, `@team-verifier full verification` directly.
- Team: runs the "quick" and "full" verification from AGENTS.md and reports PASS/FAIL with failure counts only.
- You: **do not trust the green light; read the evidence** — which commands ran, how many tests. Zero tests means PASS is meaningless. Before shipping, use the product once yourself (automation misses the user's view).
- If the repo has no tests: the first task is not a feature but a verification oracle. Start with `/plan "create a quick verification command"`. Without it the whole team is a plausible-code generator.
- Common mistakes: leaving stale commands in AGENTS.md. Missing that the team skipped a test to pass (the reviewer's correctness lens looks, but skim the test diff in the PR yourself).

### 2.9 Debugging (unknown cause)
- When: there is a symptom but no cause.
- Command: `/plan "bug: <symptom>. Write a reproduction test first, confirm the cause, then fix"` (no intake call: the reproduction is the specification)
- Team: Explore investigation → hypothesis → **failing reproduction test** → fix → test passes → review.
- You: give the most concrete reproduction you can (inputs, environment, logs, since when). "Sometimes weird" cannot become a plan. If the team jumps to a fix without a reproduction test, send it back.
- Approval criteria: does the diff contain a test that failed before the fix and passes after?
- Common mistakes: approving a symptom-suppressing patch. If the cause is in data or interfaces, an escalation question arrives — decide then.

### 2.10 Troubleshooting (when the team spins)
- Signals: the same failure three times, repeated questions, a diff growing beyond the plan, compaction two or more times.
- What you do, in order:
  1. Stop. Do not try to talk it back on track.
  2. `/handoff` to save state, then drop the session. `/resume` in a fresh one.
  3. If it stalls at the same place again, the plan is wrong. Redo `/plan` with finer steps.
  4. Environment problems (dependencies, permissions, mismatched commands) show up in the verifier report as "environmental" — fix those yourself.
  5. On the second recurrence, `/retro`. If speed or cost is the problem, `/hire` to reassign.
- Common mistakes: repeating "try again" in a spinning session. A polluted context gets worse the longer you keep it alive.

### 2.11 Merging
- Local integration (`/integrate`): parallel branches are reviewed → merged → conflicts resolved by the implementer and re-reviewed → verified, one at a time into the current branch. You decide only whether to revert when a failure is reported.
- Merging into main: `/ship` **resolves the policy automatically** from repository state. You never edit configuration for this.
  - No remote → `local`: the PR description lands in docs/prs/NNNN-<slug>.md and the lead asks for approval. Read it as you would a PR (verification evidence, review handling, rollback). On approval it merges into local main with `merge --no-ff`.
  - Remote, no protection → `manual`: the team pushes and opens the PR (`risk:low|high`). You read the PR and merge. For `risk:high`, read the diff yourself.
  - Remote + protected main (required checks = CI) + auto-merge → `auto-low-risk`: `risk:low` merges automatically once CI passes; only `risk:high` waits for you. So "turning on auto-merge" means enabling protection and auto-merge on GitHub.
  - `/policy` shows the current verdict and reason. Force a verdict only when you must: `/policy manual` or `/policy auto-low-risk` (recorded as an override in AGENTS.md); `/policy auto` returns to automatic.
- The team can never force-push or push directly to main (hooks). Every merge goes through a PR or an approved local merge.
- **The day you add GitHub**: `git remote add origin …` and the first push. The next `/ship` is a PR flow automatically. The moment you enable protection + auto-merge on main, it becomes auto-low-risk.
- Common mistakes: enabling auto-low-risk without branch protection. Waving through conflict-resolution diffs without review (a correctness re-review is configured, but check).

### 2.12 Shipping and releasing
- `/ship`: full verification → docs and CHANGELOG → PR description → push → PR (or local merge). You read the PR's "verification evidence" and "risks and rollback". If either is empty, do not merge.
- `/release [version]`: version proposal → full verification → finalized CHANGELOG → docs/releases/<ver>.md → tag commands. You push the tag. If interfaces changed, a major/minor question arrives.
- Common mistakes: release notes written from the team's view (what changed) — they must be the user's view (what is different, known issues, rollback).

### 2.13 Ending a session
- When: a plan is finished, right after `/ship`, after two or more compactions, when the team spins, at the end of the day.
- Command: `/handoff [note]`
- Team: `wip:` commit of uncommitted changes → docs/STATUS.md updated (including a spec in progress and its round) → report "finished / waiting / first action next session".
- You: check that the **first next action** matches your view. If not, correct it right there (the team fixes STATUS). Answer waiting decisions now or at the start of the next session.
- Common mistakes: closing the window without `/handoff` — uncommitted changes and reasoning are lost.

### 2.14 Resuming in a new session
- Command: new session → `/resume [note]`. Use `opencode -c` only for a short interruption. Long sessions stack summaries on summaries and degrade; the default is a fresh session.
- Team: reconciles the status board (auto-injected), the plan and git → trusts the repo and fixes the board on disagreement → verifier first if the last result was FAIL → asks about waiting decisions → continues from the next action (for a stopped spec: `/plan docs/specs/NNNN-<slug>.md`).
- You: answer waiting decisions. If the report says board and repo disagree, the repo is right.
- Rule: one session = one plan. Another plan means another session.


### 2.15 Retrospective
- When: the same mistake twice, frequent CEO intervention, after an incident, after a release.
- Command: `/retro <plan slug | session | incident>`
- Team: reads the docs/METRICS.md trend first (rework, questions, duration) → pinpoints at most three places where rework, verification failures, review blockers or CEO intervention occurred, with root causes → proposes a countermeasure per cause and where it belongs (one rule line / a skill / a hook (hard block) / the plan format) → the planner applies only what you approve. Intake and spec rounds are not counted as intervention; a spec that needed more than 2 correction rounds is a subject.
- Choosing the place: a fact or prohibition that applies every time → one line in AGENTS.md; a multi-step procedure → a skill; something the prompt cannot be trusted with → a hook; something missed at planning time → the plan format.
- You: approve **only rules with a violation behind them**. Reject generalities ("always be careful"). When AGENTS.md passes 300 lines, ask for procedures to move into skills.
- Common mistakes: repeating the same prompt without a retro. Approving many rules and bloating AGENTS.md.

### 2.16 Hiring (model assignment)
- When: right after `/kickoff` or `/assess` (the lead suggests it), when the budget tier changes, when the team feels too slow or too expensive.
- Command: `/hire [note]`
- Team: lists models with `opencode models`; asks budget tier, project character, parallel plans and roles to emphasize in one go → proposes a role × model table with reasons → also proposes the operating profile (default lenses 2/4, parallelism, critic threshold, per-step verifier, step-size target) → on approval, one script changes only model lines and another writes "## Operating profile" to AGENTS.md.
- You: answer the questions. For models the lead does not know (in-house models), **you must say which is strongest and which is fastest** — the lead does not guess. Approve the table or change a line or two.
- Approval criteria: did the strongest model go to planner, critic and reviewer? Is the verifier on the fastest model? On the low tier, are parallelism and 4 lenses out of the defaults?
- Common mistakes: cutting the reviewer first to save cost (quality collapses there first — cut the implementer first). Expecting the change to apply without opening a new session.

## 3. Rhythm

- Daily (1–2 hours): `/resume` → (one item from the backlog) answer the intake call (or the spec rounds), approve `/plan` → hands off during `/run` (answer gate questions only) → merge per verdict → `/handoff`.
- Weekly: `/backlog` for next week's top three, `/release`, skim docs/DECISIONS.md, `/retro` if needed.
- First week: day 1 `/kickoff` (or `/assess`) plus a "verification command that runs in under a minute" → days 2–3 walking skeleton → days 4–5 two features through plan→run → one `/retro`. Parallelism from week two.
- Three metrics: rework count / questions per session (the intake call and spec rounds are expected and not counted) / plan-approval→merge time. `/ship` appends one line per plan to docs/METRICS.md and `/retro` reads it. If they fall, the setup fits.

## 4. Approval checklists

Before approving a spec:
- [ ] every "done when" is a verifiable statement
- [ ] "not this time" is not empty
- [ ] each undecided item says when it will be decided
- [ ] no "how" inside (stack, schema design, libraries)
- [ ] two pages or less, links not pastes
- [ ] it says who uses it and when

Before approving a plan:
- [ ] completion criteria are verifiable statements (commands, tests, numbers)
- [ ] every step has a verification command; logic-change steps are within the step-size target (default 300 changed lines) or state why not (never beyond 2×); mechanical changes (scaffolding, generated code, lockfiles, formatting, deletions) are separate steps
- [ ] no conflict with non-goals or the charter
- [ ] a rollback method is written down
- [ ] sections 1–2 match your intake answers or the spec
- [ ] the critic said APPROVE (when it ran)

After approval, `/run` takes it to the end. You are called back only for escalation, a fix loop over 3 rounds, and merge approval.

Before merging a PR:
- [ ] the verification evidence lists the commands run and zero failures (refuse if the test count is zero)
- [ ] review findings and how they were handled are listed
- [ ] for `risk:high`, you read the schema / interface / security diff yourself
- [ ] the test-file diff contains no skip, deletion or weakening
- [ ] mechanical commits (scaffold/gen/mechanical/deps) contain no logic changes, and gen commits regenerate with zero diff
- [ ] a rollback method exists

## 5. Where tokens leak and how to stop it
- Repeatedly checking subagent status: forbidden by the lead's rules (synchronous calls, wait for completion). If you still see it, it is a `/retro` subject.
- Progress narration ("I will now…"): forbidden by rule. Results and decisions only.
- Auto-injected documents growing: CHARTER 60 lines, STATUS 30 lines. The lead keeps STATUS within the cap; the planner splits CHARTER when exceeded — there is no hard cap in opencode (unlike the Claude Code flavor's session-start hook), so a file that grows past this stays uncapped and is injected in full every session.
- Critic and 4 lenses on small plans: under 3 logic steps and risk:low the critic is skipped; review uses 2 lenses below 600 logic lines and risk:low. Adjust via the operating profile (/hire).
- Intake asks at most once per plan; if bug lines, re-plans or backlog items (beyond the one spec question for size L or a new page, screen, API or data model) still draw questions, it is a `/retro` subject.
- Spec rounds are the exception to short chats: give paths and links, never paste documents (the planner reads them); the file is the memory, so `/handoff` after a long spec session and re-enter with `/plan docs/specs/NNNN-<slug>.md`.
- On your side: do not re-ask the same question every session — record decisions in docs/DECISIONS.md and let the lead follow them. One plan per session. When the context gets heavy, `/handoff` and start fresh.

## 6. Do not
- Order large work in chat without a plan, or a complex feature with a one-liner and no spec
- Approve on the green light alone
- Change direction while the team is working (stop and re-plan)
- Fix reviewer findings yourself
- Try to rescue a spinning session
- Enable auto-merge without branch protection
- Approve generality rules in retros
- Leave verification commands in AGENTS.md that no longer match reality
