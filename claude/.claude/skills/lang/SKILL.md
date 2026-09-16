---
name: lang
description: Set the team's working language — writes the "## Language" section of CLAUDE.md via script and switches responses immediately. Use when the team answers in the wrong language or you want to change it
argument-hint: "[ko|en|...]"
---
Set the team's working language. Requested: $ARGUMENTS

1. If no language was given, ask the CEO with AskUserQuestion (options: ko / en / other as free text; default: the language of the CEO's latest message). Do not infer it from the codebase or from command text.
2. Run `node .claude/scripts/set-language.mjs --file CLAUDE.md <code>`. It creates CLAUDE.md if missing or rewrites only its "## Language" section. Never edit CLAUDE.md yourself.
3. From this turn on, respond in that language and write every subagent brief in it. Confirm in one sentence, in the new language. Subagents started from now on read CLAUDE.md; nothing else changes.
