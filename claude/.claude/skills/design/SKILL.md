---
name: design
description: What a user-facing change must have to be finished — screens and their four states, layout and hierarchy, copy, responsiveness, keyboard and focus, consistency with the design foundation — and how it is proven (the `shows:` lines of a UI step, screenshots from the rules file's screenshots command). Loaded by team-planner when a plan touches a UI path, by team-implementer and team-builder for a UI step, and by team-reviewer for the ux lens; at /kickoff for the design foundation.
user-invocable: false
---
# design

Nobody on the team is a designer, so the design is a checklist and a foundation, not taste. A screen that passes the checklist looks like the rest of the product and does not embarrass the CEO in front of a user; that is the bar. Taste comes from the CEO's own words in the brief's appendix and from "이거 별로네" after they try it.

## The design foundation (decided at /kickoff, in the stack ADR's "Design foundation" section; built by the foundation step — step 1 of the first UI plan after the walking skeleton)
- A component library or a small set of primitives (button, input, list, card, dialog, toast) — never one-off styling per screen.
- Tokens: colour, spacing, type scale, radius — a single file the whole product reads. Dark mode only if the brief says so.
- A layout shell: navigation, page frame, empty page — every screen lives inside it.
- The screenshots command (a headless browser script that renders each screen in each state to docs/screens/<plan-slug>/<screen>-<state>.png; docs/screens/ is git-ignored) registered under "## Commands" as `screenshots:`. The foundation step writes it and runs it as its verification; a working `screenshots:` line — no ` — unverified` marker — is what turns on `shows:` lines and the ux lens.

## The checklist — every screen a step adds or changes
1. **Four states**, each designed, not defaulted: empty (first use — what the user does next), loading (no layout jump), error (what went wrong, what to do; never a stack trace), success (the content). A list also needs its one-item and many-items case.
2. **Hierarchy**: one primary action per screen, visible without scrolling on a phone; secondary actions look secondary; destructive actions confirm.
3. **Copy**: labels say what happens ("저장" not "확인"); error text says what to do; no developer words (null, undefined, 500, "unexpected").
4. **Responsive**: usable at 360px wide and at 1280px; no horizontal scroll; touch targets at least 40px.
5. **Keyboard and focus**: every action reachable by keyboard, visible focus, Escape closes what Enter opened, focus returns after a dialog.
6. **Feedback**: every action acknowledges within a second — a spinner, a toast, a state change; nothing "just happens".
7. **Consistency**: the foundation's components and tokens only; the same words for the same thing across screens; the same place for the same control.
8. **Accessibility basics**: contrast 4.5:1 for text, alt text for images that mean something, form fields with labels, no colour as the only signal.

## How a UI step is proven
- The plan step carries, besides its `proves:` lines (behaviour, asserted by a test), one `shows:` line per screen it adds or changes: `shows: <screen> — empty · loading · error · success` (list the states that apply; a state that does not apply says so: `shows: settings — success · error (no empty: always has defaults)`).
- The implementer, after the tests are green, runs the screenshots command from the rules file for those screens and states, and reports a `Shown:` line per `shows:` line naming the PNG files. A plan on a UI-less stack never carries `shows:` lines. No working screenshots command in the rules file yet (the line is missing or still ` — unverified`) → the foundation is not in: the walking skeleton's UI steps say `shows: n/a — no design foundation yet` and skip the ux lens, and the first UI plan after it begins with the foundation step (kind: scaffold, `proves: n/a`, verified by running the screenshots command) before any screen step — the way a missing test harness becomes step 1.
- The ux lens reads the PNGs (the Read tool renders images) and the component code against the checklist; a missing state, a stack trace on screen or an unreachable action is major; a broken layout at phone width is a blocker.
- The plan's "Try it" section names the same screens, so the CEO tries what the team looked at.

## Where it plugs in
- /kickoff: the stack ADR gets a "Design foundation" section (library or primitives, tokens, shell, the screenshots command); plan 0001's scaffold step includes the shell and the tokens; the rules file gets "## UI paths" (the globs of screens, components and styles) and the `screenshots:` command.
- /plan: a plan whose files hit "## UI paths" loads this skill; without a working `screenshots:` command its first step is the foundation step (the walking skeleton excepted: `shows: n/a`); with it every UI step gets `shows:` lines; the critic blocks a UI step without them.
- /review: a "## UI paths" hit adds the ux lens to the review once the `screenshots:` command is in — mechanically, like risk.
- The rules file's Definition of Done: a UI step is done when its `shows:` lines have screenshots and the ux lens said APPROVE.
