---
name: deliver
description: The team's running mode — one iteration (2–4 plans that add up to something the CEO can try) from the backlog through plan → run (build · review · ship · merge) per plan, then an iteration review and a pause. The lead starts it when the CEO says go ("진행해", "계속", "시작해") or when a session opens with `Mode: running`; it stops at the iteration end, an escalation, a third compaction, an empty backlog or "멈춰" — one session runs one iteration
argument-hint: "[note: which items, or a plan cap]"
---
Run an iteration. Note: $ARGUMENTS

The board's `Mode:` line is the contract with the CEO: `running` from the first step here to the pause at the end, `waiting on CEO` while a question is open, `paused — …` when the team is looking at the CEO and doing nothing else. Every step is re-entrant (the `resume` skill's Continuity section): a session that opens with `Mode: running` re-enters here after `resume` and continues with the plan and step the board names — the CEO never has to repeat the go.

0. Iteration plan. Apply the branches-and-sync rule (on main, synced). From docs/BACKLOG.md — a `rework:` or `bug:` item first, then the priority order (the order the CEO fixed, if any) — pick the items that together end in something tryable (a screen, a flow, a command the CEO can run): 2–4 plans, never more than the iteration cap (the operating profile's `iteration cap`; default 4). A Plans line already on the board is the pick — the kickoff's iteration 1 (the walking skeleton alone, so the CEO sees it before anything is built on it) or a `Next iteration` line left by the last review. Write the board's Iteration block (`Plans: <item ✓ | ▶ step k/n | —>… · ends: <last> shipped`), set `Mode: running`, commit the board (`docs(status): iteration <k> start`) and tell the CEO the iteration's goal in one line. Do not wait for an answer.
1. For each item, in order:
   a. `cat .claude/session/compactions` — at 3 or more, the compaction cut (the `resume` skill's Continuity section) applies before a new plan starts.
   b. Run `plan` via the Skill tool (the item) — unless the item is already an approved plan path (docs/plans/0001-… after a kickoff or an assess): then skip to c. The critic's APPROVE is the approval. An escalation question that gets no answer in this turn ends the turn with `Mode: waiting on CEO` (the Waiting-on-CEO line carries the default); the CEO's next message resumes here.
   c. Run `run` via the Skill tool (the plan path): build → review → ship. /ship merges when the lead may (lead-merge: risk:low, verifier PASS, every lens APPROVE, required checks green when there is a remote); a `risk:high` plan is merged by the lead as well while the board's Stage is `pre-launch`; at `live` it is the CEO's word, asked by /ship from the PR's Risk summary — with no answer in this turn, record it under Waiting on CEO, set `Mode: waiting on CEO` and end the turn, because the next plan may build on it.
   d. Board: mark the item ✓ on the Iteration line, fold what can now be tried into the CEO page's Try it script (one script for the iteration — the "Try it" steps of the PR when it has them, in plain words), and add a For you line (at most three on the page; a fourth replaces the least urgent) when the plan touched the brief's riskiest assumption, a screen the CEO has not seen, or something the team is unsure the CEO meant; a `risk:high` merge by the lead is one line under Decided by default, not a For you line.
2. Iteration end — when the last item is shipped, the cap is reached, or the backlog is empty: run the retro trigger (below), set `Mode: paused — iteration review`, rewrite the CEO's page for the review (Try it = this iteration's one script; For you = at most three lines, the ones still open; Decided by default = this iteration's), write the `Next iteration` line (the items it would take, from the backlog), commit the board (`docs(status): iteration <k> review`), and send the iteration review — this form, nothing else, then end the turn and do nothing until the CEO speaks:
   - Try it: `<run command>` → <the 3–5 steps, from the CEO's page>
   - Changed this iteration: <plans, one line each>
   - For you: <the page's lines> | none
   - Decided by default: <the page's lines> | none
   - Retro: <up to three numbered proposals from the trigger> | none
   - Next iteration: <the items it would take>
   - Next: start a new session and say 계속 — one session, one iteration; the board carries everything.
   "계속" (in the new session) starts the next iteration; "1, 3 반영하고 계속" applies those retro proposals first; anything else is an instruction (the `instruction` skill) or a question.
   Retro trigger: read this iteration's docs/METRICS.md lines and the board's Counts; when any plan shows `rev 3` or higher, a fix loop past its cap, verifier FAIL 2 or more, a `bug:` or `rework:` item naming a shipped slug, or a CEO question outside the four escalation items, run `retro` via the Skill tool in its mini mode (subject: those plans) and carry its numbered proposals into the review; otherwise `none`.
3. Other stops — in each case the board says what is committed and what comes next, and the turn ends:
   - an escalation question: `Mode: waiting on CEO`, the default on the board;
   - a merge conflict you may not resolve: `Mode: paused — blocked: <what>`, the report in the final-report format (a fix loop past its cap is not a stop — the loop rule cuts the plan and the iteration continues);
   - a third compaction (the count is 3 or more): finish the step in progress, commit the board with `Mode: running` kept, and tell the CEO to start a new session and say 계속;
   - "멈춰" / "stop": finish the step in progress, commit the board, `Mode: paused — stopped by CEO`.
