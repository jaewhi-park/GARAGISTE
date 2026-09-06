---
description: Show/set the merge policy — current automatic verdict (local / manual / auto-low-risk) with its reason; with an argument, record an override in the rules file
agent: team-lead
---
Handle the merge policy. Input: $ARGUMENTS

1. Inspect the current state using the resolution rules of /ship: remote present (`git remote`), `gh` available, auto-merge allowed, default-branch protection with required status checks. Report "verdict — reason" in one line, plus one line on what repository change would alter the verdict.
2. If AGENTS.md "## Merge policy" holds an override, show it too.
3. If an argument is given, have team-planner write that value into the AGENTS.md "## Merge policy" line. `auto` clears it and returns to automatic resolution. If `auto-low-risk` is requested without branch protection on the remote, warn in one line (merges could happen without verification) and proceed only after CEO confirmation.
