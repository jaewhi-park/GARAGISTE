// checkpoint — 죽는 에이전트에게 부탁하지 않는다: 더러운 worktree를 wip로 커밋해 이어받기를 보장한다. Claude SubagentStop 훅과 opencode task 뒤 플러그인이 부른다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function checkpoint(root) {
  const dir = path.join(root, '.worktrees');
  if (!fs.existsSync(dir)) return [];
  const done = [];
  for (const slug of fs.readdirSync(dir)) {
    const wt = path.join(dir, slug);
    if (!fs.existsSync(path.join(wt, '.git'))) continue;
    const st = spawnSync('git', ['status', '--porcelain'], { cwd: wt, encoding: 'utf8' }).stdout.trim();
    if (!st) continue;
    spawnSync('git', ['add', '-A'], { cwd: wt });
    const r = spawnSync('git', ['commit', '-q', '-m', `wip: ${slug} checkpoint`], { cwd: wt, env: { ...process.env, GARAGISTE_WIP: '1' } });
    if (r.status === 0) done.push(slug);
  }
  return done;
}
export const PACKS = ['intake', 'spec', 'build', 'attack', 'spike', 'boot'];
// spawn 센서 — pass line의 「unit당 spawn」은 conductor의 산문 보고(work.mjs spawned)가 아니라 훅이 기계적으로 센다.
// v1 교훈(무명 stop 1,024건 대 실제 spawn 100건): agent_type이 팩일 때만 pack을 적고, 팩도 체크포인트도 없으면 줄 자체를 만들지 않는다.
export function spawnStop(root, input = {}) {
  const t = String(input.agent_type ?? '').toLowerCase();
  const pack = PACKS.includes(t) ? t : null;
  const checkpointed = checkpoint(root);
  if (!pack && !checkpointed.length) return null;
  const entry = { ts: new Date().toISOString(), kind: 'spawn_stop', pack, checkpointed };
  try {
    const ledger = path.join(root, '.garagiste', 'ledger', 'evidence.jsonl');
    fs.mkdirSync(path.dirname(ledger), { recursive: true });
    fs.appendFileSync(ledger, JSON.stringify(entry) + '\n');
  } catch { /* 원장 없음 */ }
  return entry;
}
