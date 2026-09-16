---
name: deliver
description: The team's running mode — one iteration (2–4 plans that add up to something the CEO can try) from the backlog through plan → run (build · review · ship · merge) per plan, then an iteration review and a pause. The lead starts it when the CEO says go ("진행해", "계속", "시작해") or when a session opens with `Mode: running`; it stops at the iteration end, an escalation, a compaction, an empty backlog or "멈춰"
argument-hint: "[note: which items, or a plan cap]"
---
Run an iteration. Note: $ARGUMENTS

The board's `Mode:` line is the contract with the CEO: `running` from the first step here to the pause at the end, `waiting on CEO` while a question is open, `paused — …` when the team is looking at the CEO and doing nothing else. Every step is re-entrant (the `resume` skill's Continuity section): a session that opens with `Mode: running` re-enters here after `resume` and continues with the plan and step the board names — the CEO never has to repeat the go.

0. Iteration plan. Apply the branches-and-sync rule (on main, synced). From docs/BACKLOG.md — a `rework:` or `bug:` item first, then the priority order (the order the CEO fixed, if any) — pick the items that together end in something tryable (a screen, a flow, a command the CEO can run): 2–4 plans, never more than the iteration cap (the operating profile's `iteration cap`; default 4). A `Next iteration` line left on the board by the last review is the default pick. Write the board's Iteration block (`Plans: <item ✓ | ▶ step k/n | —>… · ends: <last> shipped`), set `Mode: running`, commit the board (`docs(status): iteration <k> start`) and tell the CEO the iteration's goal in one line. Do not wait for an answer.
1. For each item, in order:
   a. `cat .claude/session/compactions` — at 1 or more, the compaction cut (the `resume` skill's Continuity section) applies before a new plan starts.
   b. Run `plan` via the Skill tool (the item) — unless the item is already an approved plan path (docs/plans/0001-… after a kickoff or an assess): then skip to c. The critic's APPROVE is the approval. An escalation question that gets no answer in this turn ends the turn with `Mode: waiting on CEO` (the Waiting-on-CEO line carries the default); the CEO's next message resumes here.
   c. Run `run` via the Skill tool (the plan path): build → review → ship. /ship merges when the lead may (lead-merge: risk:low, verifier PASS, every lens APPROVE, required checks green when there is a remote); a `risk:high` plan is merged by the lead as well while the board's Stage is `pre-launch`; at `live` it is the CEO's word, asked by /ship from the PR's Risk summary — with no answer in this turn, record it under Waiting on CEO, set `Mode: waiting on CEO` and end the turn, because the next plan may build on it.
   d. Board: mark the item ✓ on the Iteration line, add what can now be tried to `Tryable now` (from the plan's completion criteria, in plain words — the "Try it" steps of the PR when it has them), and add a `Check please` line when the plan touched the brief's riskiest assumption, a screen the CEO has not seen, something the team is unsure the CEO meant, or was `risk:high` and merged by the lead.
2. Iteration end — when the last item is shipped, the cap is reached, or the backlog is empty: set `Mode: paused — iteration review`, write the `Next iteration` line (the items it would take, from the backlog), commit the board (`docs(status): iteration <k> review`), and send the iteration review — this form, nothing else, then end the turn and do nothing until the CEO speaks:
   - Tryable now: `<CLAUDE.md build/run command>` → <what to try, from the board, one line each>
   - Changed this iteration: <plans, one line each>
   - Check please: <what the team wants the CEO's eyes on> | none
   - Next iteration: <the items it would take>
   "계속" starts the next iteration; anything else is an instruction (the `instruction` skill) or a question.
3. Other stops — in each case the board says what is committed and what comes next, and the turn ends:
   - an escalation question: `Mode: waiting on CEO`, the default on the board;
   - a fix loop past 3 rounds or a merge conflict you may not resolve: `Mode: paused — blocked: <what>`, the report in the final-report format;
   - a compaction (the count is 1 or more): finish the step in progress, commit the board with `Mode: running` kept, and tell the CEO to start a new session and say 계속;
   - "멈춰" / "stop": finish the step in progress, commit the board, `Mode: paused — stopped by CEO`.
