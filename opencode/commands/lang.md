---
description: Set the team's working language — writes the "## Language" section of AGENTS.md via script and switches responses immediately. Use when the team answers in the wrong language or you want to change it
agent: team-lead
---
Set the team's working language. Requested: $ARGUMENTS

1. If no language was given, ask the CEO with the question tool (options: ko / en / other as free text; default: the language of the CEO's latest message). Do not infer it from the codebase or from command text.
2. Run `node .opencode/scripts/set-language.mjs <code>`. It creates AGENTS.md if missing or rewrites only its "## Language" section. Never edit AGENTS.md yourself.
3. From this turn on, respond in that language and write every subagent brief in it. Confirm in one sentence, in the new language. Subagents started from now on read AGENTS.md; nothing else changes.
