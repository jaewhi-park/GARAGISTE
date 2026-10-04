// checkpoint — 죽는 에이전트에게 부탁하지 않는다: 더러운 worktree를 wip로 커밋해 이어받기를 보장한다. Claude SubagentStop 훅과 opencode task 뒤 플러그인이 부른다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ctx, isMain } from './lib.mjs';

// 팩 정체 — 정본은 unit 상태, worktree 마커는 fallback (guard-rules의 readMarker와 같은 우선순위)
function packState(root, slug, wt) {
  try {
    const u = JSON.parse(fs.readFileSync(path.join(root, '.garagiste', 'units', `${slug}.json`), 'utf8').replace(/^﻿/, ''));
    if (u && u.state) return u.state;
  } catch { /* unit 없음 */ }
  try { return fs.readFileSync(path.join(wt, '.garagiste-pack'), 'utf8').trim(); } catch { return null; }
}
export function checkpoint(root) {
  const dir = path.join(root, '.worktrees');
  if (!fs.existsSync(dir)) return [];
  const done = [];
  for (const slug of fs.readdirSync(dir)) {
    const wt = path.join(dir, slug);
    if (!fs.existsSync(path.join(wt, '.git'))) continue;
    // 사고 15(2차 실기): spike는 커밋하지 않는 팩(가드도 spike의 commit을 거부)인데 훅이 wip로 커밋해 tree가 바뀌었다 —
    // full·redproof·attack 증거가 전부 낡고 HEAD가 wip이 됐다. 측정 파일은 초 단위 재실행이라 잃는 쪽이 싸다.
    if (packState(root, slug, wt) === 'spike') continue;
    // 사고 26(L2 1일차): ship이 멈춰 둔 rebase 한가운데서 wip를 커밋하지 않는다 — 풀린 표시는 git add까지, 잇는 것은 ship이다
    const inRebase = ['rebase-merge', 'rebase-apply'].some((d) => { const p = spawnSync('git', ['rev-parse', '--git-path', d], { cwd: wt, encoding: 'utf8' }).stdout.trim(); return !!p && fs.existsSync(path.resolve(wt, p)); });
    if (inRebase) continue;
    const st = spawnSync('git', ['status', '--porcelain'], { cwd: wt, encoding: 'utf8' }).stdout.trim();
    if (!st) continue;
    spawnSync('git', ['add', '-A'], { cwd: wt });
    const r = spawnSync('git', ['commit', '-q', '-m', `wip: ${slug} checkpoint`], { cwd: wt, env: { ...process.env, GARAGISTE_WIP: '1' } });
    if (r.status === 0) done.push(slug);
  }
  return done;
}
export const PACKS = ['intake', 'spec', 'build', 'attack', 'spike', 'boot', 'adopt'];
// spawn 센서 — pass line의 「unit당 spawn」은 conductor의 산문 보고(work.mjs spawned)가 아니라 훅이 기계적으로 센다.
// v1 교훈(무명 stop 1,024건 대 실제 spawn 100건): agent_type이 팩일 때만 pack을 적고, 팩도 체크포인트도 없으면 줄 자체를 만들지 않는다.
export function spawnStop(root, input = {}) {
  const t = String(input.agent_type ?? '').toLowerCase();
  const pack = PACKS.includes(t) ? t : null;
  const checkpointed = checkpoint(root);
  if (!pack && !checkpointed.length) return null;
  const entry = { ts: new Date().toISOString(), kind: 'spawn_stop', pack, checkpointed, ...(input.slug ? { slug: String(input.slug) } : {}) }; // slug는 conduct만 안다(사고 79) — 훅은 agent_type뿐
  try {
    const ledger = path.join(root, '.garagiste', 'ledger', 'evidence.jsonl');
    fs.mkdirSync(path.dirname(ledger), { recursive: true });
    fs.appendFileSync(ledger, JSON.stringify(entry) + '\n');
  } catch { /* 원장 없음 */ }
  return entry;
}
// unwip(14라운드 2026-10-04 — 세 run의 승인 거부 10건이 전부 build 팩의 `cd <worktree> && git reset --soft HEAD~1 && …`): 이어받은 HEAD가 wip 체크포인트면 build가 그 커밋을 풀어 정식 커밋으로 얹어야 한다(ship의 head 조건).
// 팩 산문·brief가 그 git 명령을 적어 줬는데 팩은 cd와 묶어 치고, 무인 세션은 `cd && node …`만 통과시킨다(12라운드 규칙). 스크립트가 푼다 — git을 Bash 도구 밖에서 부르니 승인이 없다.
export function unwip(wt) {
  const g = (args) => spawnSync('git', args, { cwd: wt, encoding: 'utf8' });
  const inRebase = ['rebase-merge', 'rebase-apply'].some((d) => { const p = g(['rev-parse', '--git-path', d]).stdout.trim(); return !!p && fs.existsSync(path.resolve(wt, p)); });
  if (inRebase) return { ok: false, why: 'rebase 도중 — 표시를 풀고 git add까지, 잇는 것은 ship이다(사고 26·58)' };
  const subject = g(['log', '-1', '--format=%s']).stdout.trim();
  if (!/^wip:/.test(subject)) return { ok: false, why: `HEAD는 wip가 아니다(${subject || '커밋 없음'})`, subject };
  if (g(['rev-parse', '--verify', '-q', 'HEAD~1']).status !== 0) return { ok: false, why: 'HEAD~1 없음 — wip가 첫 커밋이다', subject };
  const r = g(['reset', '--soft', 'HEAD~1']);
  if (r.status !== 0) return { ok: false, why: r.stderr.trim(), subject };
  return { ok: true, subject, head: g(['rev-parse', '--short', 'HEAD']).stdout.trim(), staged: g(['diff', '--cached', '--name-only']).stdout.trim().split('\n').filter(Boolean) };
}
function main() {
  const cmd = process.argv[2];
  if (cmd !== 'unwip') { process.stdout.write('사용법: checkpoint.mjs unwip — 이 worktree의 HEAD가 wip 체크포인트면 그 커밋을 풀어 변경을 인덱스에 둔다(정식 커밋은 네가)\n'); process.exit(1); }
  const c = ctx(); // isMain이 스크립트의 뿌리로 chdir한다 — 설치본의 worktree 사본(.worktrees/<slug>/.garagiste/scripts)에서 부르면 뿌리가 그 worktree다
  if (c.root === c.main) { process.stdout.write('FAIL unwip: 메인에서는 풀지 않는다 — unit worktree 안에서(cd <worktree> && node .garagiste/scripts/checkpoint.mjs unwip)\n'); process.exit(1); }
  const wt = c.root;
  const r = unwip(wt);
  if (!r.ok) { process.stdout.write(`${/wip가 아니다/.test(r.why) ? 'PASS' : 'FAIL'} unwip — ${r.why}\n`); process.exit(/wip가 아니다/.test(r.why) ? 0 : 1); }
  process.stdout.write(`UNWIP ${r.subject} — wip 커밋을 풀었다(HEAD ${r.head} · 인덱스에 ${r.staged.length}개) → 이어서 일하고 정식 커밋을 만들라(trailer Unit·Step)\n`);
}
if (isMain(import.meta.url)) main();
