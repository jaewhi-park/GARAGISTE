// guard — Claude Code PreToolUse. 규칙은 .garagiste/scripts/guard-rules.mjs 하나(opencode 플러그인과 공유).
import fs from 'node:fs';
import path from 'node:path';
import { decide, makeCtx } from '../../.garagiste/scripts/guard-rules.mjs';

let raw = ''; try { raw = fs.readFileSync(0, 'utf8'); } catch { /* 입력 없음 */ }
let input = {}; try { input = JSON.parse(raw || '{}'); } catch { input = {}; }
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const reason = decide(input, makeCtx(path.resolve(root), { cwd: input.cwd, fs }));
if (reason) {
  // 측정 빈틈(L1 4차·L2 관찰): 가드 거부는 원장 줄이 없었다 — 최선 노력으로 남긴다(원장이 없으면 조용히). 되풀이는 state.mjs 「막힌 것」이 센다.
  try {
    const team = JSON.parse(fs.readFileSync(path.join(root, '.garagiste', 'team.json'), 'utf8').replace(/^\uFEFF/, ''));
    const p = path.join(root, team.paths?.ledger || '.garagiste/ledger/evidence.jsonl');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, JSON.stringify({ ts: new Date().toISOString(), kind: 'guard', tool: input.tool_name, target: String(input.tool_input?.file_path || input.tool_input?.notebook_path || input.tool_input?.command || '').slice(0, 1000), reason }) + '\n'); // 1000자 — 200자 절단은 사고 60의 재현을 막았다
  } catch { /* 원장 없음 */ }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
}
