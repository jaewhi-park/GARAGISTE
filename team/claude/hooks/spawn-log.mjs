// spawn-log — Claude Code SubagentStop → 더러운 worktree를 wip로 커밋하고, agent_type이 팩이면 원장에 spawn_stop을 남긴다(spawnStop).
import fs from 'node:fs';
import { spawnStop } from '../../.garagiste/scripts/checkpoint.mjs';

let input = {};
try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { input = {}; }
spawnStop(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd(), input);
