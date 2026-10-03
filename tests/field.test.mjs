// 필드 도구: 하루 표(tests/field/day.mjs)가 L2-day-conductor 「저녁」의 정의대로 세는가 — 합성 원장으로.
// Q6 스트림 세션(tests/field/stream.mjs)이 등록문(L2-TRIAL-3 4일)의 원장 시점에 네 말을 넣고 컴파일을 세는가.
// 5판(L2-TRIAL-5): day.mjs의 5판 칸(미검수 사람 셈 · fail/guard · kept · 이음새 공격·보고) · stream의 방향전환 대상 · 시계 검사 도구(clock.mjs)가 자식 node의 시계·시간대를 옮기고 full을 한 줄씩 내는가.
// CEO-분 기계 셈(L2-TRIAL-5 「CEO-분」): 출처 셋(턴 기록 · 스트림 · 전사)에서 말과 턴 끝을 읽어 창의 벽시계 · 대기 · 카드 시간(try → tried) · 원장만의 하한을 내는가.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { answerWaits, bounds, ceoMinutes, ceoSources, cwdSlug, dayTable, dedupe, parseTranscript, render, stopsBySlug } from './field/day.mjs';
import { bystanders, childEnv, choice, compile, due, loadPlan, objectLine, pick } from './field/stream.mjs';
import { PRELOAD, childEnv as clockEnv, configs, preloadArg } from './field/clock.mjs';

const T = (hms, d = '2026-10-02') => `${d}T${hms.length === 5 ? `${hms}:00` : hms}.000Z`;
const D2 = '2026-10-03';
const e = (ts, kind, x = {}) => ({ ts, kind, ...x });
const work = (slug, packs, at) => packs.flatMap(([pack, a, b, tokens]) => [
  e(T(a, at), 'pack', { slug, pack }), e(T(b, at), 'spawn', { slug, pack, tokens }), e(T(`${b}:10`, at), 'spawn_stop', { pack }),
]);
// 1일차: 아침 창(decide·scope) → boot·add·edit 출하, list는 Q2에 걸려 멈춤 → 저녁 창(tried 셋 · Q2 답 → respec)
// 2일차: 아침 접점 없이 list 재개·출하 → add-fix 출하 → 저녁 창
const L = [
  e(T('10:00'), 'decide', { q: 1, answer: '예' }), e(T('10:01'), 'scope', {}),
  e(T('10:02'), 'unit', { slug: 'boot' }), ...work('boot', [['boot', '10:02:30', '10:05', 30000]]), e(T('10:06'), 'ship', { slug: 'boot' }),
  e(T('10:07'), 'unit', { slug: 'add' }), ...work('add', [['spec', '10:07:30', '10:09', 20000], ['build', '10:10', '10:15', 40000], ['attack', '10:16', '10:20', 30000]]), e(T('10:22'), 'ship', { slug: 'add' }),
  e(T('10:23'), 'unit', { slug: 'list' }), ...work('list', [['spec', '10:23:30', '10:25', null]]),
  e(T('10:26'), 'unit', { slug: 'edit' }), ...work('edit', [['spec', '10:26:30', '10:28', 15000], ['build', '10:29', '10:33', 35000], ['attack', '10:34', '10:37', 25000]]), e(T('10:40'), 'ship', { slug: 'edit' }),
  e(T('11:00'), 'tried', { slug: 'boot', result: 'ok', note: '' }), e(T('11:01'), 'tried', { slug: 'add', result: 'fail', note: '빈 제목이 저장된다' }),
  e(T('11:01:01'), 'scope_fix', { slug: 'add-fix', from: 'add' }), e(T('11:02'), 'tried', { slug: 'edit', result: 'ok', note: '느리다' }),
  e(T('11:03'), 'decide', { q: 2, answer: '아니오' }), e(T('11:03:01'), 'respec', { slug: 'list', q: 2 }),
  ...work('list', [['spec', '09:05', '09:10', 20000], ['build', '09:12', '09:20', 50000], ['attack', '09:21', '09:25', 10000]], D2), e(T('09:30', D2), 'ship', { slug: 'list' }),
  e(T('09:31', D2), 'unit', { slug: 'add-fix' }), ...work('add-fix', [['spec', '09:31:30', '09:33', 10000]], D2),
  e(T('09:34', D2), 'needs', { slug: 'add-fix', from: [], to: ['add'] }), ...work('add-fix', [['build', '09:35', '09:40', 20000]], D2), e(T('09:45', D2), 'ship', { slug: 'add-fix' }),
  e(T('12:00', D2), 'tried', { slug: 'list', result: 'ok', note: '' }), e(T('12:01', D2), 'tried', { slug: 'add-fix', result: 'ok', note: '' }),
];
const units = [
  { slug: 'boot', kind: 'scaffold' }, { slug: 'add', kind: 'feature' }, { slug: 'list', kind: 'feature', questions: [2] },
  { slug: 'edit', kind: 'feature', defaults: [{ text: '빈 목록이면 안내 문구', at: T('10:35') }] }, { slug: 'add-fix', kind: 'feature' },
];
const ledgerMd = ['| 날짜 | unit | head | tree | full | redproof | attack 선발견→red/총 | sensor |', '|---|---|---|---|---|---|---|---|',
  '| 2026-10-02 | boot | a1 | t1 | PASS | scaffold | — | machine |', '| 2026-10-02 | add | a2 | t2 | PASS | base_red head_green | 2→0/3 | machine |',
  '| 2026-10-02 | edit | a3 | t3 | PASS | base_red head_green | 1→0/2 | machine |'].join('\n');
const brief = '# BRIEF\n\n## 2026-10-02 09:50\n원문\n\n## 2026-10-02 10:01\n아침 창 끝과 같은 분\n\n## 2026-10-02 10:30\n낮에 한 말\n';
const budgets = { unseen_max: 3, unattended_ship_max: 5 };
const day1 = () => dayTable({ L, units, ledgerMd, brief, until: T('09:00', D2), budgets });
const day2 = () => dayTable({ L, units, ledgerMd, brief, since: T('09:00', D2), budgets });

test('day 경계: 아침 창 끝 = 첫 ship 전 마지막 접점 · 저녁 창 시작 = 그 뒤 첫 tried · --since가 있으면 그 전의 접점은 아침 끝이 아니다(5판 라운드 — 접점 줄 없는 아침은 --since)', () => {
  const b1 = bounds(L, '', T('09:00', D2));
  assert.equal(b1.firstShip.slug, 'boot');
  assert.equal(b1.morningEnd, T('10:01'));
  assert.equal(b1.eveningStart, T('11:00'));
  const b2 = bounds(L, T('09:00', D2));
  assert.equal(b2.firstShip.slug, 'list');
  assert.equal(b2.morningEnd, T('09:00', D2), '전날 저녁의 tried(11:03)가 아니라 이 라운드의 --since — 리눅스 2라운드의 무인 84.6분(실제 31분)');
  assert.equal(bounds(L, '').morningEnd, T('10:01'), '--since 없이는 하한이 없다');
  assert.equal(b2.eveningStart, T('12:00', D2));
});

test('day 1일차 표 머리: 무인 분 · 낮 경과(세 번째 ship) · 낮 접점(BRIEF 절 포함) · 멈춘 때의 미검수·무인 출하', () => {
  const t = day1();
  const out = render(t, { name: 'f' });
  assert.match(out, /- 무인 59\.0분 · 낮 경과\(→ 낮의 세 번째 ship\) 39\.0분/);
  assert.match(out, /- 낮 접점 1\(목표 0\):\n {2}- BRIEF `## 2026-10-02 10:30`/);
  // 절 시각은 분 단위 — 아침 창 끝(10:01:00)과 같은 분인 절은 낮인지 가를 수 없어 세지 않고 따로 보인다(홀드아웃 3일차 08:25 절)
  assert.match(out, /경계 분[^\n]*BRIEF `## 2026-10-02 10:01`/);
  assert.match(out, /낮의 마지막 원장 줄 2026-10-02T10:40:00\.000Z \(ship edit\) · 그때 미검수 2\/3\(사람 센서 — 안 써본 출하 3, 기계 증명 1은 세지 않는다\) · 무인 출하 1\/5/); // boot는 scaffold라 세지 않는다(5판 — state.mjs humanNeeded와 같은 셈) · BRIEF 10:30이 접점이라 무인 출하는 edit 하나
  assert.match(out, /- 카드: 3 · ok 2 · fail 1/);
  assert.match(out, /- 팀이 정한 것 1:\n {2}- edit: 빈 목록이면 안내 문구/);
  assert.match(out, /DAY f · 무인 59\.0분 · 낮 접점 1 · 낮 ship 3 · 연장 0 · 미출하 1 · 토큰 195K · 카드 ok 2\/fail 1/);
});

test('day 1일차 unit 표: 출하 행 · 질문에 걸린 미출하 · 기록 안 한 spawn · tried fail의 말', () => {
  const rows = Object.fromEntries(day1().rows.map((r) => [r.slug, r]));
  assert.deepEqual(day1().rows.map((r) => r.slug), ['boot', 'add', 'list', 'edit']);
  assert.equal(rows.boot.raw, 4); assert.equal(rows.boot.redproof, 'scaffold'); assert.equal(rows.boot.comp, '—');
  assert.equal(rows.add.raw, 15); assert.equal(rows.add.packs, 3); assert.equal(rows.add.stops, 3); assert.equal(rows.add.tokens, 90000); assert.equal(rows.add.attack, '2→0/3');
  assert.equal(rows.list.raw, null); assert.equal(rows.list.stage, 'Q2'); assert.equal(rows.list.unrecorded, 1); assert.equal(rows.list.respec, 1);
  const out = render(day1(), { name: 'f' });
  assert.match(out, /\| 무인 \| add \| — \| 1 \| 15\.0 \| 15\.0 \| 3\/3 \| 90K \| 2→0\/3 \| base_red head_green \| fail\(CEO\) \| 1 — 빈 제목이 저장된다 \| — \| 0 \| 0 \|/);
  assert.match(out, /\| 무인 \| list \| — \| 1 \| 미출하 — Q2 \| — \| 1\/1 \| 0K · 미기록 1 \|/);
  assert.match(out, /\| 무인 \| edit \|.*\| ok\(CEO\) \| 0 — 메모: 느리다 \|/);
  assert.match(out, /\| 계 \| 4\(출하 3\) \| \| \| 33\.0 \| 33\.0 \| 8\/8 \| 195K \| 선발견 3 \| 3 \| ok 2 · fail 1 \| 1 \| — \| 1 \| 0 \|/);
});

test('day 2일차: 질문으로 넘어온 unit의 원시엔 밤이 들고, 답 대기(결정을 사이에 둔 공백)를 빼면 일한 시간만 남는다', () => {
  const t = day2();
  const rows = Object.fromEntries(t.rows.map((r) => [r.slug, r]));
  assert.deepEqual(t.rows.map((r) => r.slug), ['list', 'add-fix']);
  assert.equal(rows.list.raw, 1387); // 10:23 → 이튿날 09:30
  assert.equal(rows.list.wait, 1360); // 10:25(Q2 전 마지막 줄) → 이튿날 09:05(respec 기록 줄 말고 다시 움직인 첫 줄)
  assert.equal(rows.list.packs, 4); assert.equal(rows.list.stops, 4); assert.equal(rows.list.unrecorded, 1);
  assert.equal(rows['add-fix'].needs, 1);
  const out = render(t, { name: 'f' });
  assert.match(out, /\| 무인 \| list \| — \| 1 \| 1387\.0 \(대기 Q2 1360\.0\) · seed가 아침 창 끝 전 \| 27\.0 \| 4\/4 \| 80K · 미기록 1 \|/);
  assert.match(out, /- 경계: 아침 창 끝 2026-10-03T09:00:00\.000Z \(접점 줄 없음\)/);
  assert.match(out, /- 무인 180\.0분 · 낮 경과\(→ 낮의 세 번째 ship\) — \(낮 ship 2\)/); // --since(09:00) → 첫 tried(12:00); 전날 11:03부터 세면 1497분
  assert.match(out, /그때 미검수 2\/3 · 무인 출하 2\/5/);
  assert.match(out, /\| 계 \| 2\(출하 2\) \| \| \| 1401\.0 \| 41\.0 \| 6\/6 \| 110K \|/);
});

test('day 연장(유인)과 drop: 저녁 창 시작 뒤 seed된 unit · 버린 unit은 미출하 — drop · unit 없는 BACKLOG 줄 정정은 행이 아니다', () => {
  const M = [e(T('08:00'), 'scope'), e(T('08:01'), 'unit', { slug: 'a' }), e(T('08:02'), 'pack', { slug: 'a', pack: 'spec' }), e(T('08:10'), 'ship', { slug: 'a' }),
    e(T('08:11'), 'unit', { slug: 'z' }), e(T('08:12'), 'pack', { slug: 'z', pack: 'spec' }), e(T('08:20'), 'drop', { slug: 'z' }),
    e(T('08:30'), 'drop', { slug: 'typo', backlog_only: true, forget: true }),
    e(T('09:00'), 'tried', { slug: 'a', result: 'ok', note: '' }), e(T('09:05'), 'unit', { slug: 'late' }), e(T('09:30'), 'ship', { slug: 'late' })];
  const t = dayTable({ L: M });
  assert.deepEqual(t.rows.map((r) => [r.slug, r.span, r.stage]), [['a', '무인', null], ['z', '무인', 'drop'], ['late', '연장(유인)', null]]);
  assert.match(render(t, { name: 'm' }), /DAY m · 무인 60\.0분 · 낮 접점 0 · 낮 ship 1 · 연장 1 · 미출하 1/);
});

test('day spawn_stop: slug 없는 줄은 바로 앞 같은 팩의 slug로 · 같은 팩이 겹쳐 뜨면 ※', () => {
  assert.deepEqual(stopsBySlug([e('1', 'pack', { slug: 'a', pack: 'spec' }), e('2', 'spawn_stop', { pack: 'spec' }), e('3', 'pack', { slug: 'b', pack: 'spec' }), e('4', 'spawn_stop', { pack: 'spec' }), e('5', 'spawn_stop', { pack: null })]),
    [{ slug: 'a', ts: '2', odd: false }, { slug: 'b', ts: '4', odd: false }]);
  assert.deepEqual(stopsBySlug([e('1', 'pack', { slug: 'a', pack: 'build' }), e('2', 'pack', { slug: 'b', pack: 'build' }), e('3', 'spawn_stop', { pack: 'build' }), e('4', 'spawn_stop', { pack: 'build' })]).map((s) => [s.slug, s.odd]),
    [['b', true], ['b', true]]);
});

test('day 답 대기: 같은 공백에 걸린 질문 둘은 한 번만 뺀다 · 출하 뒤의 결정은 빼지 않는다', () => {
  const M = [e(T('10:00'), 'unit', { slug: 'u' }), e(T('10:05'), 'spawn', { slug: 'u' }), e(T('10:10'), 'decide', { q: 1 }), e(T('10:20'), 'decide', { q: 2 }),
    e(T('10:30'), 'pack', { slug: 'u' }), e(T('10:40'), 'ship', { slug: 'u' }), e(T('10:50'), 'decide', { q: 3 })];
  assert.deepEqual(answerWaits(M, 'u', [1, 2, 3], T('10:00'), T('10:40')), { minutes: 25, qs: [1, 2] });
});

test('day CLI: 폴더에서 표를 낸다 · 시각을 못 읽으면 FAIL 한 줄', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-day-'));
  try {
    fs.mkdirSync(path.join(dir, '.garagiste', 'ledger'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.garagiste', 'ledger', 'evidence.jsonl'), L.map((x) => JSON.stringify(x)).join('\n') + '\n{깨진 줄\n');
    fs.writeFileSync(path.join(dir, '.garagiste', 'team.json'), JSON.stringify({ budgets }));
    const cli = fileURLToPath(new URL('./field/day.mjs', import.meta.url));
    const r = spawnSync(process.execPath, [cli, dir, '--since', '2026-10-03T09:00:00Z'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /DAY garagiste-day-\S+ · 무인 180\.0분 · 낮 접점 0 · 낮 ship 2/); // --since(2일차 09:00)가 아침 창 끝의 하한 — 전날 11:03부터면 1497분
    const bad = spawnSync(process.execPath, [cli, dir, '--since', '어제'], { encoding: 'utf8' });
    assert.equal(bad.status, 1);
    assert.match(bad.stdout, /^FAIL day 시각을 읽지 못했다: 어제/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('day 팩 이유-차선(측정 H3): 원장의 large 팩을 표 아래에 센다 — 크기·상한·이유', () => {
  assert.match(render(day1(), { name: 'f' }), /\n- 팩 이유-차선 0\n/);
  const L3 = L.map((x) => (x.kind === 'pack' && x.slug === 'edit' && x.pack === 'build' ? { ...x, bytes: 34.5 * 1024, large: '공격 테스트 5개가 실렸다', cap_kb: 32 } : x));
  const out = render(dayTable({ L: L3, units, ledgerMd, brief, until: T('09:00', D2), budgets }), { name: 'f' });
  assert.match(out, /\n- 팩 이유-차선 1:\n {2}- edit build 34\.5KB\(상한 32KB\) — 「공격 테스트 5개가 실렸다」\n/);
});

// Q6 — 등록문의 네 시점: 첫 ship(버그) · 둘째 ship(추가) · 그 뒤 처음 build 팩이 조립된 unit(-fix 제외 · 수정) · 수정의 spec 재spawn(방향전환)
const Q6 = [
  { id: 'bug', when: { kind: 'ship', nth: 1 }, text: '순위표에서 … → …, 원문은 …', object: { kind: ['unit', 'scope_fix'], slug: '-fix$' }, call: 'work\\.mjs (new|add) \\S+-fix' },
  { id: 'add', when: { kind: 'ship', nth: 2 }, text: '팀 화면에 그 팀의 최근 5경기 결과(날짜·상대·점수)를 보여 줘.', object: { kind: ['unit'], fresh: true }, call: 'work\\.mjs (add|new) ' },
  { id: 'modify', when: { kind: 'pack', pack: 'build', after: 'add', exclude: '-fix$' }, texts: { standings: '이기면 2점으로 바꾸자', 'team-register': '팀 이름은 20자까지' }, object: { kind: ['pack'], pack: 'spec', slugOf: 'modify' } },
  { id: 'pivot', when: { kind: 'pack', pack: 'spec', after: 'modify', slugOf: 'modify' }, choices: [{ slug: 'csv-export', text: 'CSV 내려받기는 이번엔 빼자' }, { slug: 'match-move', text: '날짜 옮기기는 이번엔 빼자' }], object: { kind: ['scope', 'drop'], target: true } },
];
const Lq = [
  e(T('09:00'), 'ship', { slug: 'old' }), // 세션 전(since 앞) — 세지 않는다
  e(T('10:00'), 'unit', { slug: 'a' }), e(T('10:10'), 'ship', { slug: 'a' }),
  e(T('10:11'), 'unit', { slug: 'b' }), e(T('10:12'), 'unit', { slug: 'a-fix' }), e(T('10:20'), 'ship', { slug: 'b' }),
  e(T('10:21'), 'unit', { slug: 'recent5' }), e(T('10:22'), 'pack', { slug: 'a-fix', pack: 'build' }), e(T('10:25'), 'unit', { slug: 'standings' }),
  e(T('10:30'), 'pack', { slug: 'standings', pack: 'build' }), e(T('10:31'), 'pack', { slug: 'recent5', pack: 'spec' }), e(T('10:33'), 'pack', { slug: 'standings', pack: 'spec' }),
  e(T('10:35'), 'drop', { slug: 'csv-export' }), e(T('10:50'), 'pack', { slug: 'recent5', pack: 'build' }),
];
// 대리의 세션: 말을 넣는 시각은 원장 줄 뒤 몇 초
const play = (L, units = []) => {
  const sent = {}; const msgs = [];
  for (const x of L) {
    for (const d of due(Q6, L.filter((y) => y.ts <= x.ts), sent, units, T('09:30'))) {
      const m = { ts: d.line.ts.replace('.000Z', '.500Z'), id: d.item.id, text: d.text, line: d.line, object: d.item.object, call: d.item.call, backlog: ['a', 'b', 'standings', 'csv-export'], target: d.target };
      sent[m.id] = m; msgs.push(m);
    }
  }
  return msgs;
};

test('stream plan: 첫 ship → 버그 · 둘째 ship → 추가 · 그 뒤 처음 build 팩(-fix 제외) → 그 unit의 수정 · 그 unit의 spec 재spawn → 방향전환', () => {
  const msgs = play(Lq);
  assert.deepEqual(msgs.map((m) => [m.id, m.line.kind, m.line.slug]), [['bug', 'ship', 'a'], ['add', 'ship', 'b'], ['modify', 'pack', 'standings'], ['pivot', 'pack', 'standings']]);
  assert.equal(msgs[2].text, '이기면 2점으로 바꾸자');
  assert.equal(msgs[3].text, 'CSV 내려받기는 이번엔 빼자');
  // plan에 그 slug의 말이 없으면 null(HOLD — 대리가 손으로) · 이미 시작한 unit은 방향전환의 다음 이름으로
  assert.equal(pick(Q6[2], { slug: 'recent5' }), null);
  // 낮에 생긴 unit(띄울 때 BACKLOG에 없던 slug)은 texts['*new'] — BACKLOG에 있던 slug는 그 밖이라 HOLD
  const Qn = { ...Q6[2], texts: { ...Q6[2].texts, '*new': '최근 3경기만 보여 줘' } };
  assert.equal(pick(Qn, { slug: 'recent5' }, [], ['standings', 'roster-view']), '최근 3경기만 보여 줘');
  assert.equal(pick(Qn, { slug: 'roster-view' }, [], ['standings', 'roster-view']), null);
  assert.equal(pick(Q6[3], null, [{ slug: 'csv-export', state: 'spec' }]), '날짜 옮기기는 이번엔 빼자');
  assert.equal(pick(Q6[3], null, [{ slug: 'csv-export', state: 'dropped' }]), 'CSV 내려받기는 이번엔 빼자');
});

test('stream 컴파일: 넣은 시각 → 그 말의 객체 원장 줄(버그 -fix unit · 추가 = 넣을 때 BACKLOG에 없던 unit · 수정 = 그 unit의 spec 팩 · 방향전환 = drop)까지 도구 호출 수와 분', () => {
  const msgs = play(Lq);
  const tool = (hms, cmd) => ({ t: T(hms), e: { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: cmd } }] } } });
  const events = [tool('10:10:40', 'node .garagiste/scripts/work.mjs new a-fix "…"'), tool('10:11:30', 'node .garagiste/scripts/work.mjs seed'),
    tool('10:20:40', 'node .garagiste/scripts/work.mjs add recent5 "…"'), tool('10:20:50', 'node .garagiste/scripts/work.mjs new recent5 "…"'),
    { t: T('10:30:10'), e: { type: 'user', message: { content: [{ type: 'tool_result' }] } } }, tool('10:32', 'node .garagiste/scripts/brief.mjs spec standings')];
  const c = Object.fromEntries(compile(msgs, Lq, events).map((x) => [x.id, x]));
  assert.deepEqual([c.bug.obj.kind, c.bug.obj.slug, c.bug.calls, c.bug.minutes.toFixed(1)], ['unit', 'a-fix', 2, '2.0']);
  assert.deepEqual([c.add.obj.slug, c.add.calls, c.add.firstCalls], ['recent5', 2, 1]);
  assert.deepEqual([c.modify.obj.pack, c.modify.obj.slug, c.modify.calls], ['spec', 'standings', 1]);
  assert.deepEqual([c.pivot.obj.kind, c.pivot.obj.slug, c.pivot.calls], ['drop', 'csv-export', 0]);
});

test('stream 무관 unit: 말을 넣을 때 진행 중이던 unit마다 말 뒤 첫 원장 줄 — 없으면 null(멈춘 것)', () => {
  const b = Object.fromEntries(bystanders(play(Lq), Lq).map((x) => [x.id, x.units.map((u) => [u.slug, u.next?.kind ?? null])]));
  assert.deepEqual(b.bug, []);
  assert.deepEqual(b.add, [['a-fix', 'pack']]);
  assert.deepEqual(b.modify, [['a-fix', null], ['recent5', 'pack'], ['standings', 'pack']]);
});

test('stream 자식 환경: 부모 세션의 CLAUDE* 변수는 걷고 인증에 필요한 것만 남긴다(turn.sh와 같은 목록) · 커밋 이름은 ceo', () => {
  const env = childEnv({ CLAUDECODE: '1', CLAUDE_CODE_SESSION_ID: 'p', CLAUDE_CODE_ACCOUNT_UUID: 'u', CLAUDE_SESSION_INGRESS_TOKEN_FILE: '/t', PATH: '/bin' });
  assert.deepEqual(Object.keys(env).filter((k) => k.startsWith('CLAUDE')).sort(), ['CLAUDE_CODE_ACCOUNT_UUID', 'CLAUDE_SESSION_INGRESS_TOKEN_FILE']);
  assert.equal(env.PATH, '/bin'); assert.equal(env.GIT_AUTHOR_NAME, 'ceo');
});

// 5판(L2-TRIAL-5) — 7건 뒤의 정본을 재는 칸
test('day 5판 칸: 미검수는 사람 센서 unit만(공격 선발견 0 · @sensor human — scaffold·system은 세지 않는다) · 원장 fail/guard 줄과 되풀이 · decide/kept/RESPEC · 이음새 공격·출하 보고', () => {
  const extra = [
    e(T('10:21'), 'attack', { slug: 'add', red: 2, total: 2, files: ['tests/adversary/add-1.test.mjs'] }), // 선발견 2 — 기계 증명
    e(T('10:38'), 'attack', { slug: 'edit', red: 0, total: 1, files: [] }), // 선발견 0 — 사람 센서
    e(T('10:41'), 'fail', { script: 'ship.mjs', line: 'FAIL ship edit — 원장에 이 tree의 quick PASS가 없다' }),
    e(T('10:42'), 'fail', { script: 'ship.mjs', line: 'FAIL ship edit — 원장에 이 tree의 quick PASS가 없다' }),
    e(T('10:43'), 'guard', { tool: 'Bash', target: 'docs/STATUS.md', reason: 'conductor는 쓰지 않는다' }),
    e(T('10:44'), 'unit', { slug: 'system-1', state: 'attack' }), e(T('10:44'), 'system', { slug: 'system-1', units: ['add', 'edit'] }),
    e(T('10:45'), 'attack', { slug: 'system-1', red: 1, total: 1, files: ['tests/adversary/system-1-1.test.mjs'] }),
    e(T('10:47'), 'ship', { slug: 'system-1' }), e(T('10:48'), 'report', { path: 'docs/REPORT.md', order: ['add', 'edit'] }),
    e(T('11:03:02'), 'kept', { slug: 'list', q: 3, assumed: 'todo.json 한 파일' }),
  ];
  const L5 = [...L.filter((x) => x.ts < T('09:00', D2)), ...extra].sort((a, b) => a.ts.localeCompare(b.ts));
  const units5 = [...units, { slug: 'system-1', kind: 'system' }];
  const t = dayTable({ L: L5, units: units5, ledgerMd, brief, until: T('09:00', D2), budgets });
  const out = render(t, { name: 'f' });
  // 멈춘 때(낮의 마지막 줄 — 출하 보고) 안 써본 출하 넷(boot·add·edit·system-1) 중 사람 센서가 필요한 것은 edit 하나
  assert.match(out, /낮의 마지막 원장 줄 2026-10-02T10:48:00\.000Z \(report\) · 그때 미검수 1\/3\(사람 센서 — 안 써본 출하 4, 기계 증명 3은 세지 않는다\) · 무인 출하/);
  assert.match(out, /- 원장 FAIL 줄 2 · 가드 거부 1 · 되풀이\(같은 줄 2회 이상\) 1: ship\.mjs ×2 — 라운드 전체\(저녁 창 포함\)/);
  assert.match(out, /- 결정: decide 1 · 「예」 가정 그대로\(kept\) 1 · RESPEC 1/);
  assert.match(out, /- 범위 끝: 이음새 공격 system-1\(unit 2\) 발견 1 → ship · 출하 보고 docs\/REPORT\.md 2026-10-02T10:48:00\.000Z/);
  assert.match(out, /\| 무인 \| system-1 \| system \| 1 \| 3\.0 \|/);
  assert.match(out, /^DAY f · .* · FAIL줄 2 · 가드 1 · kept 1$/m);
  // 옛 규칙(budgets.unseen_machine_exempt: false)이면 전부 센다
  assert.equal(dayTable({ L: L5, units: units5, ledgerMd, brief, until: T('09:00', D2), budgets: { ...budgets, unseen_machine_exempt: false } }).unseen, 4);
});

test('stream 방향전환 객체(5판): choices로 고른 slug가 말과 함께 target으로 남고, 객체는 그 slug가 요청·선행에서 빠진 scope 줄 또는 그 slug의 drop — 그 slug가 아직 든 scope 줄은 객체가 아니다', () => {
  const msgs = play(Lq);
  const pivot = msgs.find((m) => m.id === 'pivot');
  assert.equal(pivot.target, 'csv-export');
  assert.deepEqual(choice(Q6[3], [{ slug: 'csv-export', state: 'spec' }]), { slug: 'match-move', text: '날짜 옮기기는 이번엔 빼자' });
  const base = Lq.filter((x) => x.kind !== 'drop');
  assert.equal(objectLine(pivot, [...base, e(T('10:36'), 'scope', { requested: ['a', 'b', 'standings', 'csv-export'], required: [] })], msgs), null);
  assert.equal(objectLine(pivot, [...base, e(T('10:36'), 'scope', { requested: ['a', 'b', 'standings'], required: [] })], msgs)?.kind, 'scope');
  assert.equal(objectLine(pivot, [...base, e(T('10:36'), 'drop', { slug: 'match-move' })], msgs), null); // 다른 slug의 drop은 아니다
  assert.equal(objectLine({ ...pivot, target: undefined }, Lq, msgs), null); // --target 없는 손 입력은 객체를 못 찾는다(HOLD 안내가 --target을 요구한다)
});

test('clock 설정 넷: C1 UTC+14 · C2 UTC−11 오늘 · C3 서울 +40일 · C4 서울 그해 12월 31일 23:59:50(+09:00) — 오프셋은 지금 기준', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  const c = Object.fromEntries(configs(now).map((x) => [x.id, x]));
  assert.deepEqual([c.C1.tz, c.C1.offsetMs, c.C2.tz, c.C2.offsetMs, c.C3.tz, c.C3.offsetMs], ['Pacific/Kiritimati', 0, 'Pacific/Pago_Pago', 0, 'Asia/Seoul', 40 * 86400000]);
  assert.equal(new Date(now.getTime() + c.C4.offsetMs).toISOString(), '2026-12-31T14:59:50.000Z');
  assert.equal(configs(new Date('2026-12-31T15:30:00Z')).find((x) => x.id === 'C4').label, '2027-12-31T23:59:50+09:00'); // 서울은 이미 1월 1일
});

test('clock preload: NODE_OPTIONS --require로 자식 node의 Date.now·new Date()·Date()가 오프셋만큼 옮겨지고 인자가 있는 Date·parse·instanceof·하위 클래스는 그대로 · TZ도 닿는다', () => {
  const env = clockEnv({ PATH: process.env.PATH, NODE_OPTIONS: '--no-warnings' }, { id: 'T', tz: 'Pacific/Kiritimati', offsetMs: 40 * 86400000 });
  assert.equal(env.NODE_OPTIONS, `--no-warnings --require "${PRELOAD.replace(/\\/g, '/')}"`, '구분자는 / — 윈도우의 백슬래시는 NODE_OPTIONS가 이스케이프로 먹는다');
  assert.equal(preloadArg('C:\\L2\\garagiste-5\\tests\\field\\clock-preload.cjs'), '--require "C:/L2/garagiste-5/tests/field/clock-preload.cjs"');
  const code = 'console.log(JSON.stringify({ now: Date.now(), d: new Date().getTime(), sub: new (class D extends Date {})().getTime(), fixed: new Date(0).toISOString(), p: Date.parse("2026-01-01T00:00:00Z"), inst: new Date() instanceof Date, str: typeof Date(), tz: new Date(2026, 0, 1).getTimezoneOffset(), id: process.env.GARAGISTE_CLOCK_ID }))';
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  const o = JSON.parse(r.stdout); const real = Date.now(); const near = (x) => Math.abs(x - 40 * 86400000 - real) < 60000;
  assert.ok(near(o.now) && near(o.d) && near(o.sub), JSON.stringify(o));
  assert.deepEqual([o.fixed, o.p, o.inst, o.str, o.id], ['1970-01-01T00:00:00.000Z', Date.UTC(2026, 0, 1), true, 'string', 'T']);
  if (process.platform !== 'win32') assert.equal(o.tz, -840);
});

test('clock 실행: 프로젝트의 full을 설정마다 그 시계로 돌려 한 줄씩 — 자식이 본 시각·시간대가 남고, 빨간 설정은 FAIL과 로그 · --only', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-clock-'));
  const logs = ['C1', 'C2', 'C3', 'C4'].map((id) => `${dir}-clock-${id}.log`);
  try {
    fs.mkdirSync(path.join(dir, '.garagiste'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'seen.mjs'), "import fs from 'node:fs';\nfs.writeFileSync(`seen-${process.env.GARAGISTE_CLOCK_ID}.json`, JSON.stringify({ now: Date.now(), tz: new Date(2026, 0, 1).getTimezoneOffset() }));\nprocess.exit(process.env.GARAGISTE_CLOCK_ID === 'C2' ? 1 : 0);\n");
    fs.writeFileSync(path.join(dir, '.garagiste', 'team.json'), JSON.stringify({ commands: { full: 'node seen.mjs' } }));
    const cli = fileURLToPath(new URL('./field/clock.mjs', import.meta.url));
    const r = spawnSync(process.execPath, [cli, dir], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stdout + r.stderr); // C2가 빨강
    const lines = r.stdout.trim().split('\n');
    assert.match(lines[0], /^CLOCK C1 TZ=Pacific\/Kiritimati UTC\+14 · 오늘 exit 0 PASS$/);
    assert.match(lines[1], /^CLOCK C2 TZ=Pacific\/Pago_Pago UTC-11 · 오늘 exit 1 FAIL — 로그 .*-clock-C2\.log$/);
    assert.match(lines[2], /^CLOCK C3 TZ=Asia\/Seoul \+40일 exit 0 PASS$/);
    assert.match(lines[4], /^CLOCK FAIL 1\/4 — C2 /);
    const seen = (id) => JSON.parse(fs.readFileSync(path.join(dir, `seen-${id}.json`), 'utf8'));
    const real = Date.now();
    assert.ok(Math.abs(seen('C1').now - real) < 120000 && Math.abs(seen('C3').now - 40 * 86400000 - real) < 120000);
    const c4 = new Date(seen('C4').now); assert.deepEqual([c4.getUTCMonth(), c4.getUTCDate()], [11, 31]);
    if (process.platform !== 'win32') assert.deepEqual([seen('C1').tz, seen('C2').tz, seen('C3').tz], [-840, 660, -540]);
    assert.match(fs.readFileSync(logs[1], 'utf8'), /^\$ node seen\.mjs\nTZ=Pacific\/Pago_Pago GARAGISTE_CLOCK_OFFSET_MS=0 \(UTC-11 · 오늘\)\nexit 1\n/);
    const only = spawnSync(process.execPath, [cli, dir, '--only', 'C1'], { encoding: 'utf8' });
    assert.equal(only.status, 0, only.stdout); assert.match(only.stdout, /CLOCK PASS 1\/1$/m);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); for (const l of logs) fs.rmSync(l, { force: true }); }
});

// CEO-분 기계 셈 — 출처 셋 · 창 배정 · 벽시계 · 대기 · 카드 시간 · 원장 하한
const L6 = [...L.filter((x) => x.ts < T('09:00', D2)), e(T('10:59:30'), 'try', { slug: 'boot' }), e(T('11:00:30'), 'try', { slug: 'add' }), e(T('11:01:30'), 'try', { slug: 'edit' })].sort((a, b) => a.ts.localeCompare(b.ts));
const SRC = {
  sources: ['턴 기록', '스트림'], slug: '-tmp-f',
  msgs: [{ ts: T('09:58'), text: '오늘은 L2 무인 하루다 …' }, { ts: T('10:00:30'), text: '범위는 M1 전부 — 가' }, { ts: T('10:59'), text: '저녁' }, { ts: T('11:00:20'), text: 'boot ok' }, { ts: T('11:01:20'), text: 'add fail — 빈 제목이 저장된다' }, { ts: T('11:02:20'), text: 'edit ok' }, { ts: T('11:03:20'), text: 'Q2 아니오' }],
  ends: [T('09:59'), T('10:01:30'), T('10:59:40'), T('11:00:50'), T('11:01:50'), T('11:02:50'), T('11:04')],
};
test('CEO-분 창 배정과 셈: 첫 ship 전의 말 = 아침 창(첫 말 → 「가」) · 「저녁」부터 = 저녁 창(→ 마지막 말의 턴 끝) · 대기 = 말 → 그 턴의 끝(「가」의 턴은 무인 구간이라 빼고) · 카드 시간 = 원장 try → tried · unit당 · 원장만의 하한', () => {
  const t = dayTable({ L: L6, units, ledgerMd, brief, until: T('09:00', D2), budgets });
  assert.equal(t.b.eveningStart, T('10:59:30'), '저녁 창 시작 = 첫 try(사본 열기) — tried보다 앞');
  const c = ceoMinutes({ L: L6, t, src: SRC, until: T('09:00', D2) });
  assert.deepEqual([c.morning.n, c.morning.minutes, c.morning.wait, c.morning.from, c.morning.to], [2, 2.5, 1, T('09:58'), T('10:00:30')]); // 대기 1.0 — 「가」(10:00:30)의 턴 끝은 무인 구간의 끝이라 세지 않는다
  assert.deepEqual([c.evening.n, c.evening.minutes, c.evening.from, c.evening.to, c.evening.cards, c.evening.decisions], [5, 5, T('10:59'), T('11:04'), 3, 1]);
  assert.equal(c.evening.wait.toFixed(2), '2.83'); // 0.67 + 0.5 + 0.5 + 0.5 + 0.67
  assert.deepEqual([c.day.n, c.cards.minutes, c.cards.n, c.cards.of, c.ledger.morning, c.ledger.evening, c.perUnit], [0, 1.5, 3, 3, 1, 3.5, 2.5]);
  const out = render(t, { name: 'f', ceo: c });
  assert.match(out, /- CEO-분\(기계 셈 — 출처: 턴 기록·스트림\): 아침 창 2\.5분\(말 2 · 09:58:00 → 10:00:30 · conductor 대기 1\.0\) · 저녁 창 5\.0분\(말 5 · 10:59:00 → 11:04:00 · 카드 3 · 결정 1 · 대기 2\.8\) · 낮의 말 0 · 카드 시간 합 1\.5분\(try → tried 3\/3\) · unit당 2\.5분\(낮 ship 3\)/);
  assert.match(out, /- CEO-분\(원장만 — 결정 구간, 하한\): 아침 1\.0분\(첫 접점 줄 → 아침 창 끝\) · 저녁 3\.5분\(저녁 창 시작 → 마지막 접점 줄\) · 카드 시간 합 1\.5분/);
  assert.match(out, /^DAY f · .* · CEO-분 2\.5\/5\.0$/m);
  // 출처가 없으면 하한만 — 「(CEO 기입)」은 없다
  const none = ceoMinutes({ L: L6, t, src: { sources: [], msgs: [], ends: [], slug: '-tmp-f' }, until: T('09:00', D2) });
  assert.deepEqual([none.morning.minutes, none.evening.minutes, none.perUnit, none.ledger.morning, none.ledger.evening, none.cards.minutes], [null, null, null, 1, 3.5, 1.5]);
  const out2 = render(t, { name: 'f', ceo: none });
  assert.match(out2, /- CEO-분\(기계 셈\): 출처 없음 — .*~\/\.claude\/projects\/-tmp-f\/\*\.jsonl/); assert.doesNotMatch(out2, /CEO 기입/);
  // 「저녁」 말이 없으면 첫 try·tried 전의 마지막 말이 저녁 창의 시작
  const quiet = ceoMinutes({ L: L6, t, src: { ...SRC, msgs: SRC.msgs.map((m) => (m.text === '저녁' ? { ...m, text: '돌아왔다' } : m)) }, until: T('09:00', D2) });
  assert.equal(quiet.evening.from, T('10:59'));
  // 2일차(since)엔 그날의 말만 — 전날 말은 세지 않는다
  const d2 = dayTable({ L, units, ledgerMd, brief, since: T('09:00', D2), budgets });
  const c2 = ceoMinutes({ L, t: d2, src: { ...SRC, msgs: [...SRC.msgs, { ts: T('09:01', D2), text: '상태 보여줘' }, { ts: T('09:03', D2), text: '가' }], ends: [...SRC.ends, T('09:02', D2), T('09:04', D2)] }, since: T('09:00', D2) });
  assert.deepEqual([c2.morning.n, c2.morning.minutes, c2.morning.wait, c2.evening.n], [2, 2, 1, 0]);
});

test('CEO-분 출처 셋: 턴 기록(<폴더>-turn<n>.msg의 mtime = 말 · .json = 턴 끝) · 스트림(.msgs.jsonl · .stream.jsonl의 result) · 전사(~/.claude/projects/<cwd 슬러그>/*.jsonl — cwd가 맞는 user 글만) — 시각순으로 합친다', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-ceo-'));
  const dir = path.join(root, 'bed'); fs.mkdirSync(dir);
  const home = path.join(root, 'home');
  try {
    const at = (p, ts) => { const d = new Date(ts); fs.utimesSync(p, d, d); };
    fs.writeFileSync(`${dir}-turn1.msg`, '오늘은 L2 무인 하루다\n'); at(`${dir}-turn1.msg`, T('09:58'));
    fs.writeFileSync(`${dir}-turn1.json`, '{}'); at(`${dir}-turn1.json`, T('09:59'));
    fs.writeFileSync(`${dir}-turn2.msg`, '범위는 M1 전부 — 가\n'); at(`${dir}-turn2.msg`, T('10:00:30'));
    fs.writeFileSync(`${dir}-day4.msgs.jsonl`, [{ ts: T('10:59'), id: 'say', text: '저녁' }, { ts: T('11:00:20'), id: 'say', text: 'boot ok' }].map((x) => JSON.stringify(x)).join('\n') + '\n');
    fs.writeFileSync(`${dir}-day4.stream.jsonl`, [{ t: T('10:59:10'), e: { type: 'assistant' } }, { t: T('10:59:40'), e: { type: 'result', subtype: 'success' } }].map((x) => JSON.stringify(x)).join('\n') + '\n');
    fs.writeFileSync(`${dir}-day4.in`, ''); // 이웃의 다른 파일은 무시
    const slug = cwdSlug(path.resolve(dir));
    fs.mkdirSync(path.join(home, '.claude', 'projects', slug), { recursive: true });
    fs.writeFileSync(path.join(home, '.claude', 'projects', slug, 's1.jsonl'), [
      { type: 'queue-operation', timestamp: T('11:01') },
      { type: 'user', timestamp: T('11:01:20'), cwd: path.resolve(dir), message: { role: 'user', content: 'add fail — 빈 제목' } },
      { type: 'assistant', timestamp: T('11:01:50'), cwd: path.resolve(dir), message: { role: 'assistant', content: [{ type: 'text', text: 'PASS tried' }] } },
      { type: 'user', timestamp: T('11:02'), cwd: path.resolve(dir), message: { role: 'user', content: [{ type: 'tool_result', content: 'x' }] } },
      { type: 'user', timestamp: T('11:02:20'), cwd: path.resolve(dir), message: { role: 'user', content: [{ type: 'text', text: 'edit ok' }] } },
      { type: 'user', timestamp: T('11:02:30'), cwd: path.resolve(dir), isSidechain: true, message: { role: 'user', content: '곁가지(서브에이전트)' } },
      { type: 'user', timestamp: T('11:02:40'), cwd: '/somewhere/else', message: { role: 'user', content: '다른 프로젝트' } },
      { type: 'user', timestamp: T('11:02:50'), cwd: path.resolve(dir), message: { role: 'user', content: '<local-command-caveat>…</local-command-caveat>' } },
    ].map((x) => JSON.stringify(x)).join('\n') + '\n{깨진 줄\n');
    const src = ceoSources(dir, { home });
    assert.deepEqual(src.sources, ['턴 기록', '스트림', '전사']);
    assert.deepEqual(src.msgs.map((m) => [m.ts, m.text, m.src]), [
      [T('09:58'), '오늘은 L2 무인 하루다', 'turn'], [T('10:00:30'), '범위는 M1 전부 — 가', 'turn'], [T('10:59'), '저녁', 'stream'], [T('11:00:20'), 'boot ok', 'stream'],
      [T('11:01:20'), 'add fail — 빈 제목', 'transcript'], [T('11:02:20'), 'edit ok', 'transcript'],
    ]);
    assert.deepEqual(src.ends, [T('09:59'), T('10:59:40'), T('11:01:50')]);
    assert.equal(src.slug, slug);
    // 같은 말이 두 출처에 들면 하나 — 1라운드에서 턴 기록 + 전사가 말 수를 두 배로 셌다
    fs.appendFileSync(path.join(home, '.claude', 'projects', slug, 's1.jsonl'), JSON.stringify({ type: 'user', timestamp: T('09:58:03'), cwd: path.resolve(dir), message: { role: 'user', content: '오늘은 L2 무인 하루다' } }) + '\n');
    assert.equal(ceoSources(dir, { home }).msgs.filter((m) => m.text === '오늘은 L2 무인 하루다').length, 1);
    assert.deepEqual(dedupe([{ ts: T('09:58'), text: 'a' }, { ts: T('09:58:30'), text: 'a' }, { ts: T('10:05'), text: 'a' }, { ts: T('10:05:10'), text: 'b' }]).map((m) => m.ts), [T('09:58'), T('10:05'), T('10:05:10')]);
    // 전사를 직접 주면 그 파일만 · 홈에 아무것도 없으면 전사 출처 없음
    assert.deepEqual(ceoSources(dir, { home: path.join(root, 'nohome'), transcript: path.join(home, '.claude', 'projects', slug, 's1.jsonl') }).sources, ['턴 기록', '스트림', '전사']);
    assert.deepEqual(ceoSources(dir, { home: path.join(root, 'nohome') }).sources, ['턴 기록', '스트림']);
    // parseTranscript 단독: cwd 없는 줄은 받는다(옛 전사), 빈 글은 아니다
    const r = parseTranscript([{ type: 'user', timestamp: T('12:00'), message: { content: '  ' } }, { type: 'user', timestamp: T('12:01'), message: { content: '가' } }], path.resolve(dir));
    assert.deepEqual(r.msgs.map((m) => m.text), ['가']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('CEO-분 CLI: 폴더 옆의 턴 기록을 스스로 찾아 표에 낸다 · --transcript', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-ceocli-'));
  const dir = path.join(root, 'bed');
  try {
    fs.mkdirSync(path.join(dir, '.garagiste', 'ledger'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.garagiste', 'ledger', 'evidence.jsonl'), L6.map((x) => JSON.stringify(x)).join('\n') + '\n');
    fs.writeFileSync(path.join(dir, '.garagiste', 'team.json'), JSON.stringify({ budgets }));
    const at = (p, ts) => { const d = new Date(ts); fs.utimesSync(p, d, d); };
    fs.writeFileSync(`${dir}-turn1.msg`, '오늘은 L2 무인 하루다\n'); at(`${dir}-turn1.msg`, T('09:58'));
    fs.writeFileSync(`${dir}-turn1.json`, '{}'); at(`${dir}-turn1.json`, T('09:59'));
    fs.writeFileSync(`${dir}-turn2.msg`, '가\n'); at(`${dir}-turn2.msg`, T('10:00:30'));
    fs.writeFileSync(path.join(root, 't.jsonl'), [{ type: 'user', timestamp: T('10:59'), cwd: path.resolve(dir), message: { content: '저녁' } }, { type: 'assistant', timestamp: T('11:05'), cwd: path.resolve(dir), message: { content: [{ type: 'text', text: '표' }] } }].map((x) => JSON.stringify(x)).join('\n') + '\n');
    const cli = fileURLToPath(new URL('./field/day.mjs', import.meta.url));
    const r = spawnSync(process.execPath, [cli, dir, '--since', T('09:00'), '--until', T('09:00', D2), '--transcript', path.join(root, 't.jsonl')], { encoding: 'utf8', env: { ...process.env, HOME: path.join(root, 'nohome') } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /- CEO-분\(기계 셈 — 출처: 턴 기록·전사\): 아침 창 2\.5분\(말 2 · 09:58:00 → 10:00:30 · conductor 대기 1\.0\) · 저녁 창 6\.0분\(말 1 · 10:59:00 → 11:05:00 · 카드 3 · 결정 1 · 대기 6\.0\)/);
    assert.match(r.stdout, /DAY bed · .* · CEO-분 2\.5\/6\.0$/m);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('stream plan 다시 읽기(5판 4라운드): plan 파일이 바뀌면 세션 중에도 새 항목을 쓴다 — 수정·방향전환의 slug는 아침 창의 intake 뒤에야 적을 수 있다', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-plan-'));
  try {
    const p = path.join(dir, 'plan.json');
    fs.writeFileSync(p, JSON.stringify([{ id: 'bug', when: { kind: 'ship', nth: 1 }, text: 'x' }]));
    const a = loadPlan(p);
    assert.equal(a.changed, true); assert.equal(a.plan.length, 1);
    const b = loadPlan(p, a.mtime);
    assert.deepEqual([b.changed, b.plan], [false, null], '같은 파일은 다시 읽지 않는다');
    fs.writeFileSync(p, JSON.stringify([{ id: 'bug' }, { id: 'modify', texts: { upcoming: '14일로' } }]));
    const later = new Date(a.mtime + 5000); fs.utimesSync(p, later, later);
    const c = loadPlan(p, a.mtime);
    assert.equal(c.changed, true); assert.deepEqual(c.plan.map((x) => x.id), ['bug', 'modify']);
    assert.deepEqual(loadPlan(''), { plan: [], mtime: 0, changed: false }, 'plan 없음');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
