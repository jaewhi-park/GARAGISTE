// spawn-log — Claude Code SubagentStop → 더러운 worktree를 wip로 커밋(checkpoint.mjs).
import fs from 'node:fs';
import { checkpoint } from '../../.garagiste/scripts/checkpoint.mjs';

try { fs.readFileSync(0, 'utf8'); } catch { /* 입력 없음 */ }
checkpoint(process.env.CLAUDE_PROJECT_DIR || process.cwd());
