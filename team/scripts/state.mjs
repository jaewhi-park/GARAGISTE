// state — docs/STATUS.md는 생성물이다. 첫 줄이 CEO가 매일 보는 전부. 손편집 없음.
import fs from 'node:fs';
import path from 'node:path';
import { collect, coverage } from './claims.mjs';
import { ceoTouch, ctx, isMain, listUnits, out, readJson, readLedger, readText } from './lib.mjs';

export function firstLine({ run, unseen, unseenMax, unobservedOs, decisionsOpen, coveragePct, uncertain }) {
  return `실행: ${run || '—'} · 안 본 것 ${unseen}/${unseenMax} · target-OS 미관측 ${unobservedOs} · 결정 대기 ${decisionsOpen} · 센서 커버리지 ${coveragePct}% · 불확실: ${uncertain || '없음'}`;
}
export function budgetStatus({ units, ledger, team, ceoTouchTs }) {
  const stops = [];
  const shipped = units.filter((u) => u.state === 'shipped').sort((a, b) => (a.shipped || '').localeCompare(b.shipped || ''));
  const unseen = shipped.filter((u) => !u.tried);
  if (unseen.length >= team.budgets.unseen_max) stops.push(`미검수 ${unseen.length} ≥ ${team.budgets.unseen_max} — CEO가 써봐야 출하가 열린다`);
  const since = ceoTouchTs || '';
  const unattended = ledger.filter((e) => e.kind === 'ship' && e.ts > since).length;
  if (unattended >= team.budgets.unattended_ship_max) stops.push(`CEO 접점 없이 출하 ${unattended} ≥ ${team.budgets.unattended_ship_max}`);
  let trailing = 0;
  for (let i = shipped.length - 1; i >= 0 && shipped[i].origin_kind === 'team'; i--) trailing++;
  if (trailing >= team.budgets.no_ceo_units_max) stops.push(`팀이 스스로 뜬 unit 연속 ${trailing} ≥ ${team.budgets.no_ceo_units_max}`);
  return { stops, unseen: unseen.length, unattended };
}
export function openQuestions(decisionsText) { return [...decisionsText.matchAll(/^- \[ \] Q\d+.*$/gm)].map((m) => m[0]); }
export function render(c) {
  const units = listUnits(c.main, c.team);
  const ledger = readLedger(c.main, c.team);
  const claims = collect(c);
  const cov = coverage(claims);
  const b = budgetStatus({ units, ledger, team: c.team, ceoTouchTs: ceoTouch(c.main) });
  const shippedUnseen = units.filter((u) => u.state === 'shipped' && !u.tried).sort((a, b2) => (a.shipped || '').localeCompare(b2.shipped || ''));
  const unobservedOs = shippedUnseen.filter((u) => u.sensor && u.sensor.includes('@') && u.sensor.startsWith('human')).length;
  const questions = openQuestions(readText(path.join(c.main, c.team.paths.decisions)));
  const uncertain = claims.find((x) => x.status === 'unsensed') || claims.find((x) => x.status === 'unknown');
  const line = firstLine({ run: c.team.commands.run, unseen: b.unseen, unseenMax: c.team.budgets.unseen_max, unobservedOs, decisionsOpen: questions.length, coveragePct: cov.pct, uncertain: uncertain ? `${uncertain.file}${uncertain.claim ? ' — ' + uncertain.claim : ''}` : '' });
  const parts = [line, ''];
  parts.push('## 써볼 것 (≤3)');
  for (const u of shippedUnseen.slice(0, 3)) {
    const tryMd = readText(path.join(c.main, c.team.paths.units_docs, u.slug, 'try.md')).trim();
    const fallback = u.kind === 'scaffold' ? `  실행: \`${c.team.commands.run || c.team.commands.quick}\`` : u.kind === 'system' ? `  이음새 공격이 고친 흐름: tests/adversary/${u.slug}-* 가 가리키는 대로` : '  (try.md 없음)'; // scaffold(boot)·system(이음새 공격)엔 try.md가 없다
    parts.push(`- **${u.slug}** — "${u.origin}"`, ...(tryMd ? tryMd.split('\n').slice(0, 6).map((l) => `  ${l}`) : [fallback]), `  → \`node .garagiste/scripts/work.mjs try ${u.slug}\`(main을 더럽히지 않는 사본 — 카드는 거기서) → \`node .garagiste/scripts/work.mjs tried ${u.slug} ok|fail "<말>"\``);
  }
  if (!shippedUnseen.length) parts.push('- 없음');
  parts.push('', '## 정해 주세요', ...(questions.length ? questions : ['- 없음']));
  parts.push('', '## 팀이 정한 것 (뒤집으려면 한 마디)');
  const defaults = units.flatMap((u) => u.defaults.map((d) => `- ${u.slug}: ${d.text}`)).slice(-10);
  parts.push(...(defaults.length ? defaults : ['- 없음']));
  parts.push('', '## 멈춘 이유', ...(b.stops.length ? b.stops.map((s) => `- ${s}`) : ['- 없음 — 팀은 돈다']));
  const sc = readJson(path.join(c.main, '.garagiste', 'scope.json'), null);
  parts.push('', '## 범위');
  if (sc) { const done = sc.order.filter((s2) => units.some((u) => u.slug === s2 && u.state === 'shipped')).length; parts.push(`- 요청 ${sc.requested.length} · 선행 ${sc.required.length} · 출하 ${done}/${sc.order.length}${sc.missing.length ? ` · 없는 선행: ${sc.missing.join(', ')}` : ''}${sc.noNeeds ? ' · 선행 무시' : ''}`, `- 순서: ${sc.order.join(' → ')}`); }
  else parts.push('- 없음 — work.mjs scope로 정한다');
  parts.push('', '## 진행 중');
  const open = units.filter((u) => u.state !== 'shipped' && u.state !== 'dropped');
  parts.push(...(open.length ? open.map((u) => `- ${u.slug} (${u.state}${u.boundary.hit ? ', boundary' : ''}) — "${u.origin}"`) : ['- 없음']));
  parts.push('', `_생성: state.mjs ${new Date().toISOString()} · 주장 ${cov.total} · 손편집 없음_`, '');
  return { text: parts.join('\n'), line, stops: b.stops };
}
function main() {
  const c = ctx();
  const r = render(c);
  if (process.argv.includes('--brief')) return out(r.line);
  const p = path.join(c.main, c.team.paths.status);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, r.text);
  out(r.line);
}
if (isMain(import.meta.url)) main();
