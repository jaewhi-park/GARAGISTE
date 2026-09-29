// guard — Claude Code PreToolUse. 규칙은 .garagiste/scripts/guard-rules.mjs 하나(opencode 플러그인과 공유).
import fs from 'node:fs';
import path from 'node:path';
import { decide, makeCtx } from '../../.garagiste/scripts/guard-rules.mjs';

let raw = ''; try { raw = fs.readFileSync(0, 'utf8'); } catch { /* 입력 없음 */ }
let input = {}; try { input = JSON.parse(raw || '{}'); } catch { input = {}; }
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const reason = decide(input, makeCtx(path.resolve(root), { cwd: input.cwd, fs }));
if (reason) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
