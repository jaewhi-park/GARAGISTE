// claims — 팀이 보는 것: 주장 그래프. 주장 = 인수 테스트·프로브 파일 하나. 상태는 참·거짓·미검수(사람 센서 대기)·불명.
import fs from 'node:fs';
import path from 'node:path';
import { ctx, isMain, listFiles, listUnits, out, readLedger, readText, worktreeDir, headTree } from './lib.mjs';

export function parseTags(content) {
  const g = (re) => { const m = content.match(re); return m ? m[1].trim() : null; };
  return { claim: g(/@claim\s+(.+)/), milestone: g(/@milestone\s+(\S+)/) || 'M?', sensor: g(/@sensor\s+(\S+)/) || 'machine' };
}
export function coverage(claims) {
  const total = claims.length;
  const machine = claims.filter((c) => c.sensor.startsWith('machine')).length;
  return { total, machine, human: total - machine, pct: total ? Math.round((machine / total) * 100) : 100 };
}
const mKey = (m) => { const n = Number((m || '').replace(/\D/g, '')); return Number.isFinite(n) && n > 0 ? n : 999; };
export function pickNext(claims) {
  return claims.filter((c) => c.status === 'false').sort((a, b) => mKey(a.milestone) - mKey(b.milestone) || a.file.localeCompare(b.file))[0] || null;
}
export function collect(c) {
  const units = listUnits(c.main, c.team);
  const ledger = readLedger(c.main, c.team);
  const mainTree = headTree(c.main);
  const mainFull = ledger.some((e) => e.kind === 'verify' && e.mode === 'full' && e.exit === 0 && e.tree === mainTree);
  const claims = [];
  const scan = (root, dir, mk) => {
    for (const f of listFiles(path.join(root, dir))) {
      const rel = path.posix.join(dir, f);
      claims.push({ file: rel, ...parseTags(readText(path.join(root, rel))), ...mk(rel) });
    }
  };
  // 출하된 진실: 메인 worktree
  scan(c.main, c.team.paths.acceptance, (rel) => {
    const u = units.find((x) => x.state === 'shipped' && path.basename(rel).startsWith(x.slug));
    if (!u) return { status: mainFull ? 'true' : 'unknown', unit: null };
    const human = u.sensor && u.sensor.startsWith('human');
    if (human && !u.tried) return { status: 'unsensed', unit: u.slug };
    if (u.tried && u.tried.result === 'fail') return { status: 'false', unit: u.slug };
    return { status: 'true', unit: u.slug };
  });
  scan(c.main, c.team.paths.probes, () => ({ status: mainFull ? 'true' : 'unknown', unit: null }));
  // 진행 중: 각 unit worktree의 인수 테스트는 아직 거짓
  for (const u of units.filter((x) => x.state !== 'shipped')) {
    const wt = worktreeDir(c.main, c.team, u.slug);
    if (!fs.existsSync(wt)) continue;
    scan(wt, c.team.paths.acceptance, (rel) => (path.basename(rel).startsWith(u.slug) ? { status: 'false', unit: u.slug } : null));
  }
  const seen = new Set();
  return claims.filter((x) => x.status && !seen.has(x.file + x.unit) && seen.add(x.file + x.unit));
}
function main() {
  const c = ctx();
  const claims = collect(c);
  if (process.argv.includes('--json')) return out(JSON.stringify({ claims, coverage: coverage(claims), next: pickNext(claims) }));
  const cov = coverage(claims);
  out(`주장 ${cov.total} · 참 ${claims.filter((x) => x.status === 'true').length} · 거짓 ${claims.filter((x) => x.status === 'false').length} · 미검수 ${claims.filter((x) => x.status === 'unsensed').length} · 불명 ${claims.filter((x) => x.status === 'unknown').length} · 기계 센서 ${cov.pct}%`);
  for (const x of claims) out(`${x.status.padEnd(8)} ${x.milestone.padEnd(4)} ${x.sensor.padEnd(14)} ${x.file}${x.claim ? ' — ' + x.claim : ''}`);
  const n = pickNext(claims);
  out(n ? `NEXT ${n.file}${n.claim ? ' — ' + n.claim : ''}` : 'NEXT 없음 — 거짓 주장이 없다: CEO 한 마디가 필요하다');
}
if (isMain(import.meta.url)) main();
