---
name: security
description: The security baseline a product starts with, the threat-model lines a plan carries when it touches a Risk path, the negative-case `proves:` lines that make them testable, and the checklist the reviewer's security lens works through. Loaded at /kickoff for the baseline, by team-planner for a plan on a Risk path, by team-reviewer for the security lens, and by team-critic when it checks either.
user-invocable: false
---
# security

A diff review cannot see what is missing — an endpoint with no authentication looks fine in a diff. So security lives in three places: a baseline decided once, threat-model lines on every plan that touches a Risk path (auth, data, public interfaces, dependencies, CI/deploy), and negative-case tests that prove the plan's entry points refuse what they should. The reviewer's lens checks the diff against all three.

## Baseline — decided at /kickoff, in the stack ADR's "Security baseline" section, one line each
- Authentication and session model (who logs in how; token lifetime; where the session lives); authorization model (roles or ownership; where it is checked — one place, not per handler).
- Secrets: never in the repository (the guardrail blocks reading them, not committing them — .gitignore covers `.env*`, keys, credentials); loaded from the environment; a documented list of which ones exist.
- Input at every boundary validated with a schema (body, query, path, headers, file uploads: size and type); output encoded for its context (HTML, SQL through parameters, shell never).
- Transport and headers: HTTPS only, HSTS, CSP, frame and content-type options, CORS allow-list — whatever the stack's standard middleware provides, turned on in the skeleton.
- Rate limits on authentication and on anything that costs money or sends messages; a lockout or backoff on failed logins.
- Logging without secrets or personal data; errors to the user without stack traces or internal paths.
- Dependencies: the audit command (`npm audit`, `pip-audit`, `cargo audit`, …) in the rules file's full verification; a lockfile; a policy for the licence of new runtime dependencies (the lead's escalation list).
- Data: what personal data is stored, where, how it is deleted; backups if the brief names real users.
What the brief does not need (no accounts, no personal data, a local tool) is written as "not applicable — <why>", so the reviewer knows it was decided, not forgotten.

## Threat-model lines — on every plan whose files hit "## Risk paths" (section 5 of the plan, under "Threat model")
For each entry point the plan adds or changes (a route, a command, a file the product reads, a message it consumes): who may call it · with what · what must be refused. Three to eight lines; the planner writes them from the baseline and the spec section's Data and interfaces. Each "must be refused" becomes one negative-case `proves:` line on the step that builds the entry point — plain words, as always:
- `proves: an unauthenticated request to /api/orders is refused with 401`
- `proves: a user cannot read another user's order (404, not 403)`
- `proves: a 2 MB upload is refused before it is read`
- `proves: a malformed body is refused with 400 and no stack trace in the response`
A Risk-path plan with no negative-case proves line on an entry-point step is a critic blocker. `n/a` is not available for these lines.

## The security lens — what the reviewer works through, in this order
1. The baseline: does the diff bypass any of its lines (a handler outside the authorization check, a secret read from a file, a raw query, a header turned off, logging of a token)?
2. The threat-model lines of the plan: is every "must be refused" asserted by a test that fails without the change? An entry point with no negative test is major even when the code looks right.
3. Injection: SQL, command, path, template, header, log — anything that concatenates untrusted input.
4. Authentication and authorization on every new or changed entry point; ownership checks on every object fetched by an ID from the request.
5. Secrets and personal data: in code, in logs, in error messages, in test fixtures, in screenshots.
6. Dependencies: a new runtime dependency (the lead must have asked — check DECISIONS.md), a known vulnerability in the audit output, a lockfile change without a reason.
7. Denial of service by input: unbounded lists, uploads, regexes, recursion, pagination without a cap.
8. Client side, when the plan touches a UI: XSS through unescaped output, tokens in localStorage, sensitive data in the URL.
Findings carry the file:line and the input that exploits them; a finding without a reproduction is minor.

## Where it plugs in
- /kickoff: the stack ADR's "Security baseline" section; the skeleton turns on the stack's standard protections; the rules file's full verification runs the audit command; "## Risk paths" is seeded from the baseline (auth, schema, public API, dependency manifests, CI/deploy).
- /plan: a Risk-paths hit loads this skill; the planner writes the threat-model lines and the negative proves lines; the critic blocks a Risk-path plan without them.
- /review: the security lens is always on (2-lens default) and works through the checklist above; a Risk-paths hit makes the review 4 lenses as before.
- /retro: a `bug:` plan that is a security defect adds a line to the baseline or a glob to "## Risk paths".
