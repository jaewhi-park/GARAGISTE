// state — docs/STATUS.md는 생성물이다. 첫 줄이 CEO가 매일 보는 전부. 손편집 없음.
import fs from 'node:fs';
import path from 'node:path';
import { collect, coverage } from './claims.mjs';
import { appendLedger, ceoTouch, ctx, fail, git, isMain, listUnits, out, readJson, readLedger, readText, writeJson } from './lib.mjs';

export function firstLine({ run, unseen, unseenMax, unobservedOs, decisionsOpen, coveragePct, uncertain, repeatedFails = 0 }) {
  return `실행: ${run || '—'} · 안 본 것 ${unseen}/${unseenMax} · target-OS 미관측 ${unobservedOs} · 결정 대기 ${decisionsOpen} · 센서 커버리지 ${coveragePct}% · 불확실: ${uncertain || '없음'}${repeatedFails > 0 ? ` · 반복 FAIL ${repeatedFails}` : ''}`;
}
// 프레임워크 FAIL 후보(측정 빈틈 — L1 4차·L2 관찰): 마지막 CEO 접점 뒤 같은 FAIL 줄(스크립트 + 첫 80자)이 두 번 이상 — 「안내대로 해도 같은 FAIL」의 기계 쪽 정의.
// STATUS 「막힌 것」에 뜨고 첫 줄이 센다 — 정비 채널이 읽는 자리(원격 전달은 두지 않았다: 네트워크 0은 CEO 결정).
export function repeatedFails(ledger, since = '') {
  const groups = new Map();
  for (const e of ledger) {
    if (e.kind !== 'fail' || (e.ts || '') <= (since || '')) continue;
    const key = `${e.script} ${String(e.line || '').slice(0, 80)}`;
    const g = groups.get(key) || { script: e.script, line: e.line, n: 0, last: '' };
    g.n++; g.last = e.ts || ''; groups.set(key, g);
  }
  return [...groups.values()].filter((g) => g.n >= 2);
}
// 미검수 상한(채용 2026-10-03): 미검수 3이 거의 모든 라운드의 멈춤 이유였다(L2 1판 1일차 무인 376분 중 작업 ≈29분) — 사람 센서가 필요한 unit만 센다:
// @sensor human 주장이 있거나 공격이 아무것도 못 잡은(선발견 0 — 적대 검증이 물지 않았다) unit. 기계가 증명한 unit은 STATUS에 표시되고 마일스톤 끝에 써본다. budgets.unseen_machine_exempt: false면 전부 센다(옛 규칙).
export function attackFound(ledger, u) { return new Set(ledger.filter((e) => e.kind === 'attack' && e.slug === u.slug && (e.ts || '') >= (u.created || '') && e.red > 0).flatMap((e) => e.files || [])).size; }
export function humanNeeded(u, ledger, team) {
  if (team.budgets.unseen_machine_exempt === false) return true;
  if (u.sensor && String(u.sensor).startsWith('human')) return true;
  if (u.kind === 'scaffold' || u.kind === 'system') return false;
  return attackFound(ledger, u) === 0;
}
export function budgetStatus({ units, ledger, team, ceoTouchTs }) {
  const stops = [];
  const shipped = units.filter((u) => u.state === 'shipped').sort((a, b) => (a.shipped || '').localeCompare(b.shipped || ''));
  const untried = shipped.filter((u) => !u.tried);
  const unseen = untried.filter((u) => humanNeeded(u, ledger, team));
  if (unseen.length >= team.budgets.unseen_max) stops.push(`미검수 ${unseen.length} ≥ ${team.budgets.unseen_max} — CEO가 써봐야 출하가 열린다${untried.length > unseen.length ? `(기계 증명 ${untried.length - unseen.length}은 세지 않았다)` : ''}`);
  const since = ceoTouchTs || '';
  const unattended = ledger.filter((e) => e.kind === 'ship' && e.ts > since).length;
  if (unattended >= team.budgets.unattended_ship_max) stops.push(`CEO 접점 없이 출하 ${unattended} ≥ ${team.budgets.unattended_ship_max}`);
  let trailing = 0;
  for (let i = shipped.length - 1; i >= 0 && shipped[i].origin_kind === 'team'; i--) trailing++;
  if (trailing >= team.budgets.no_ceo_units_max) stops.push(`팀이 스스로 뜬 unit 연속 ${trailing} ≥ ${team.budgets.no_ceo_units_max}`);
  return { stops, unseen: unseen.length, untried: untried.length, unattended };
}
export function openQuestions(decisionsText) { return [...decisionsText.matchAll(/^- \[ \] Q\d+.*$/gm)].map((m) => m[0]); }
export function render(c) {
  const units = listUnits(c.main, c.team);
  const ledger = readLedger(c.main, c.team);
  const claims = collect(c);
  const cov = coverage(claims);
  const b = budgetStatus({ units, ledger, team: c.team, ceoTouchTs: ceoTouch(c.main) });
  const rf = repeatedFails(ledger, ceoTouch(c.main));
  const gd = ledger.filter((e) => e.kind === 'guard' && (e.ts || '') > (ceoTouch(c.main) || ''));
  const shippedUnseen = units.filter((u) => u.state === 'shipped' && !u.tried).sort((a, b2) => (a.shipped || '').localeCompare(b2.shipped || ''));
  const unobservedOs = shippedUnseen.filter((u) => u.sensor && u.sensor.includes('@') && u.sensor.startsWith('human')).length;
  const questions = openQuestions(readText(path.join(c.main, c.team.paths.decisions)));
  const uncertain = claims.find((x) => x.status === 'unsensed') || claims.find((x) => x.status === 'unknown');
  const line = firstLine({ run: c.team.commands.run, unseen: b.unseen, unseenMax: c.team.budgets.unseen_max, unobservedOs, decisionsOpen: questions.length, coveragePct: cov.pct, repeatedFails: rf.length, uncertain: uncertain ? `${uncertain.file}${uncertain.claim ? ' — ' + uncertain.claim : ''}` : '' });
  const parts = [line, ''];
  parts.push('## 써볼 것 (≤3)');
  for (const u of shippedUnseen.slice(0, 3)) {
    const tryMd = readText(path.join(c.main, c.team.paths.units_docs, u.slug, 'try.md')).trim();
    const fallback = u.kind === 'scaffold' ? `  실행: \`${c.team.commands.run || c.team.commands.quick}\`` : u.kind === 'system' ? `  이음새 공격이 고친 흐름: tests/adversary/${u.slug}-* 가 가리키는 대로` : '  (try.md 없음)'; // scaffold(boot)·system(이음새 공격)엔 try.md가 없다
    parts.push(`- **${u.slug}** — "${u.origin}"${humanNeeded(u, ledger, c.team) ? '' : ` · 기계 증명(공격 선발견 ${attackFound(ledger, u)}) — 상한에 세지 않는다, 마일스톤 끝에 써봐도 된다`}`, ...(tryMd ? tryMd.split('\n').slice(0, 6).map((l) => `  ${l}`) : [fallback]), `  → \`node .garagiste/scripts/work.mjs try ${u.slug}\`(main을 더럽히지 않는 사본 — 카드는 거기서) → \`node .garagiste/scripts/work.mjs tried ${u.slug} ok|fail "<말>"\``);
  }
  if (!shippedUnseen.length) parts.push('- 없음');
  parts.push('', '## 정해 주세요', ...(questions.length ? questions : ['- 없음']));
  parts.push('', '## 팀이 정한 것 (뒤집으려면 한 마디)');
  const defaults = units.flatMap((u) => u.defaults.map((d) => `- ${u.slug}: ${d.text}`)).slice(-10);
  parts.push(...(defaults.length ? defaults : ['- 없음']));
  parts.push('', '## 멈춘 이유', ...(b.stops.length ? b.stops.map((s) => `- ${s}`) : ['- 없음 — 팀은 돈다']));
  parts.push('', '## 막힌 것 — 같은 FAIL이 되풀이됐다(정비 채널로)', ...(rf.length ? rf.map((g) => `- ${g.script} ×${g.n} (마지막 ${g.last.slice(0, 16)}): ${g.line}`) : ['- 없음']), ...(gd.length ? [`- 가드 거부 ${gd.length} — 마지막: ${gd[gd.length - 1].reason}`] : []));
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
// 출하 보고(채용 2026-10-03 — CEO 「결과물 가져오는 그림」): 범위가 끝나도 CEO가 받는 것은 STATUS 첫 줄과 카드 셋뿐이었다(L2 3판 복귀 창: 원장·LEDGER·DECISIONS를 따로 읽었다).
// 한 장 — 만든 것(원문 그대로) · 기계가 증명한 것(LEDGER 행) · 팀이 정한 것 · 못 본 것 · 써볼 것(마일스톤 끝의 try) · 이음새 공격. 생성물이라 손편집 없음.
export function reportText({ team, scope, units, ledger, ledgerMd = '', claims = [], decisionsText = '', now = new Date().toISOString() }) {
  const order = scope?.order || [];
  const inScope = order.map((s) => units.find((u) => u.slug === s)).filter(Boolean);
  const shipped = inScope.filter((u) => u.state === 'shipped');
  const untried = shipped.filter((u) => !u.tried);
  const systems = units.filter((u) => u.kind === 'system' && (u.state === 'shipped' || u.state === 'dropped'));
  const rows = ledgerMd.split('\n').filter((l) => l.startsWith('| ')).map((l) => l.split('|').map((x) => x.trim()));
  const row = (slug) => rows.find((c) => c[2] === slug);
  const unsensed = claims.filter((x) => x.status === 'unsensed');
  const open = openQuestions(decisionsText);
  const defaults = units.flatMap((u) => (u.defaults || []).map((d) => `- ${u.slug}: ${d.text}`));
  const run = team.commands.run || team.commands.quick || '—';
  const L = [`# 출하 보고 — ${order.join(' → ')}`, '', `실행: \`${run}\` · 출하 ${shipped.length}/${order.length} · 써볼 것 ${untried.length} · 결정 대기 ${open.length} · 팀이 정한 것 ${defaults.length} · 못 본 것 ${unsensed.length}`, '', '## 만든 것 — CEO의 말 그대로'];
  for (const u of inScope) L.push(`- **${u.slug}** (${u.milestone || 'M?'}) — "${u.origin}" · ${u.state === 'shipped' ? `출하 ${(u.shipped || '').slice(0, 10)} · 공격 선발견 ${attackFound(ledger, u)} · ${u.tried ? `써봤다 ${u.tried.result}` : '안 써봄'}` : u.state}`);
  L.push('', '## 기계가 증명한 것 — docs/LEDGER.md', '| unit | head | full | red 증명 | attack 선발견→red/총 | sensor |', '|---|---|---|---|---|---|');
  for (const u of shipped) { const c = row(u.slug); if (c) L.push(`| ${c[2]} | ${c[3]} | ${c[5]} | ${c[6]} | ${c[7]} | ${c[8]} |`); }
  L.push('', '## 팀이 정한 것 (뒤집으려면 한 마디)', ...(defaults.length ? defaults : ['- 없음']));
  const unseen = [...unsensed.map((x) => `- 사람 센서 대기: ${x.file}${x.claim ? ' — ' + x.claim : ''}`), ...open.map((q) => `- 결정 대기: ${q.replace(/^- \[ \] /, '')}`)];
  L.push('', '## 못 본 것', ...(unseen.length ? unseen : ['- 없음 — 기계가 다 봤다']));
  L.push('', '## 써볼 것 — 마일스톤 끝의 try', `- 실행: \`${run}\``);
  for (const u of untried) L.push(`- ${u.slug}: ${u.kind === 'scaffold' ? '실행이 뜨는가' : u.kind === 'system' ? `이음새 공격이 고친 흐름(tests/adversary/${u.slug}-*)` : `docs/units/${u.slug}/try.md`} → \`node .garagiste/scripts/work.mjs try ${u.slug}\` → \`tried ${u.slug} ok|fail "<말>"\``);
  if (!untried.length) L.push('- 없음 — 전부 써봤다');
  if (systems.length) L.push('', '## 이음새 공격', ...systems.map((s) => `- ${s.slug}: ${s.state === 'shipped' ? `발견 ${attackFound(ledger, s)} → 고쳐 출하` : '발견 0 — drop'}`));
  L.push('', `_생성: state.mjs report ${now} · 손편집 없음_`, '');
  return L.join('\n');
}
function report(c) {
  const sp = path.join(c.main, '.garagiste', 'scope.json');
  const sc = readJson(sp, null);
  if (!sc) fail('FAIL report: scope 없음 — 출하 보고는 범위가 끝난 뒤(work.mjs scope → … → SCOPE DONE)');
  const units = listUnits(c.main, c.team); const ledger = readLedger(c.main, c.team);
  const rel = c.team.paths.report || 'docs/REPORT.md';
  const text = reportText({ team: c.team, scope: sc, units, ledger, ledgerMd: readText(path.join(c.main, c.team.paths.ledger_doc)), claims: collect(c), decisionsText: readText(path.join(c.main, c.team.paths.decisions)) });
  const p = path.join(c.main, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text);
  const order = sc.order || [];
  writeJson(sp, { ...sc, report_for: order.join(',') }); // 이 범위에 한 장 — -fix로 범위가 자라면 next가 다시 낸다
  appendLedger(c.main, c.team, { kind: 'report', path: rel, order });
  // 생성물의 커밋 경로 — models·commands와 같은 승인된 차선(pathspec 커밋, 원장 PASS 불요)
  let tail = '';
  if (c.root === c.main && git(['status', '--porcelain', '--', rel], c.main).stdout.trim()) {
    git(['add', '--', rel], c.main);
    const cm = git(['commit', '-q', '-m', `docs(report): 출하 보고 — ${order.join(' → ')}`, '--', rel], c.main, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' });
    tail = cm.status ? ` · 커밋 실패: ${(cm.stderr || cm.stdout).split('\n')[0]}` : ' · docs(report) 커밋';
  }
  const shipped = order.filter((s) => units.some((u) => u.slug === s && u.state === 'shipped'));
  out(`REPORT ${rel} — 출하 ${shipped.length}/${order.length} · 써볼 것 ${shipped.filter((s) => !units.find((u) => u.slug === s)?.tried).length}${tail}`);
}
function main() {
  const c = ctx();
  if (process.argv[2] === 'report') return report(c);
  const r = render(c);
  if (process.argv.includes('--brief')) return out(r.line);
  const p = path.join(c.main, c.team.paths.status);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, r.text);
  out(r.line);
}
if (isMain(import.meta.url)) main();
