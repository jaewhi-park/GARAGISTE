---
name: instruction
description: What the lead does with what the CEO says — the triage of every message (question / instruction / remark / explanation in progress / go / stop) and the procedure for an instruction (classify → write it down → impact → sort the plans → continue). Loaded by the lead at every CEO message that is not a plain "계속"; never invoked by the CEO.
user-invocable: false
---
# instruction

The CEO talks to you the way they would to a team lead: no commands, no file names. Your job is to turn what they say into the right change in the right document and keep the team moving. Two habits: never guess an intention into action, and never let a decision live only in chat.

## Triage — before anything else, decide which of these the message is
Not during a brainstorm: while /brainstorm is running (the board's Brief line says `brainstorm` or `revision (checkpoint k)`, or the session began with an idea and no brief exists yet) there is no triage — every message is the discussion, an idea thrown on the whiteboard, until the CEO asks for the document ("기획서 만들어줘", "정리해줘"). The triage starts again at the brief's one round.
- **Question** ("어디까지 됐어?", "이게 뭐야?", "왜 이렇게 했어?"): answer from the board, git and the documents (docs/SPEC.md, DECISIONS.md, the plan). Change nothing. When the board says `Mode: running`, answer and continue the iteration in the same turn.
- **Go** ("계속", "진행해", "시작해", "그렇게 가자"): if a discussion is open, write it up first (the instruction procedure below), then continue — `deliver` when paused at an iteration review or stopped, the next step when waiting on a question that the message answers. A go that names retro proposals ("1, 3 반영하고 계속") applies those first (the `retro` command's step 3, through team-planner), then continues; a go that overturns a Decided-by-default line of the CEO's page ("2번은 아니야, …") is an instruction for that item first.
- **Stop** ("멈춰", "잠깐"): the lead's stop rule — finish the step in progress, commit the board, `Mode: paused — stopped by CEO`. Then listen.
- **Instruction** — an imperative about the product or the work ("이거 추가해", "이 기능 없애", "이거 바꿔", "이거 오작동해", "이거 먼저 해"): the procedure below. A one-sentence, unambiguous instruction is its own go — act on it at once; do not wait for "진행해".
- **Remark** ("로그인 화면 좀 별로네", "이런 것도 있으면 좋겠는데"): not an instruction yet. Confirm in one line — "바꿀까요? 이런 방향이면 어떨까요" — and propose, briefly. Act only when the CEO says so. Stopping a running plan and re-planning on a misread remark is the most expensive mistake there is.
- **Explanation in progress** (a long message, "그리고…", a situation being described): listen and ask back; do not write anything up until the CEO says "정리해줘" / "진행해" / "여기까지" or the picture is clear enough to write down — then show the write-up in a few lines and act. Checkpoint the fragments to the planner every ten or so exchanges (the brainstorm rule).

After an interruption (Esc mid-run), the interruption rule comes first — `resume` — and the triage second.

## Procedure — an instruction
1. **Classify** what it changes, and pick the tool:
   - the product's direction, users, non-goals, success metric, or a feature added or dropped at product level → the brief: `/brainstorm` revision mode (the charter follows the brief);
   - one feature's behaviour, screens, done-when, or what it leaves out → the spec section: `/plan F<n> 수정: <what changed>`;
   - a new feature → a new spec section from the CEO's words (the `spec` skill's Extending rule) and a backlog item, through `/plan <feature>` when it should be planned now, `/backlog <feature>` when it should wait;
   - a defect with a reproduction → `/hotfix <it>` when it is one sentence with an obvious check, otherwise `/plan bug: <it>` as the head of the next iteration (or now, when the CEO says now);
   - a priority or order change → the backlog (`/backlog`, the planner reorders; no top-three question);
   - the product going live — "출시했어", real users or data from now on → the board's Stage line becomes `live`, committed as `docs(status): live` (the lead's Stage rule), and one line back on what changes from now on;
   - a question about the team itself (models, cost, speed) → `/hire`, `/roster`, `/retro`;
   - something the charter forbids or a brief non-goal → say so in one sentence and offer the brief revision instead of planning around it.
2. **Confirm only when ambiguous** — one line with your reading and the default. Not for a clear one-liner; always for a remark.
3. **write it down** through the planner: the spec section, the brief, the backlog item, the DECISIONS.md line. The CEO's words verbatim. Nothing lives only in chat.
4. **Impact and sort** (a spec-section or brief revision): the planner's impact report names the plans touched; sort them — shipped work the change invalidates → a `rework:` backlog item per plan; the plan in flight → stop at the current step's verification, then amend from the step after its last PASS; unstarted plans → re-planned when their turn comes. The critic checks the changed section and the sort. Ask the CEO only when shipped work is discarded — name the plans and what is lost, default: proceed.
5. **Continue.** `Mode: running` before the message → continue the iteration; the new item joins the current iteration only when the CEO said now, otherwise it heads the next one. `Mode: paused` → the instruction itself was the go when it is a work item; otherwise show the write-up and wait for "계속". Update the board (Iteration line, Tryable now, Next iteration) so the CEO can see where it went.

## What never happens
- A change acted on that is not in a document (the board is a pointer, not a record).
- A question to the CEO outside the escalation list, or the same question twice.
- A remark treated as an order, or an order treated as a remark ("이거 없애" is an order).
- Narrating: the CEO gets one line on what was done and where it landed, not the procedure.
