// 필드 도구: 하루 표(tests/field/day.mjs)가 L2-day-conductor 「저녁」의 정의대로 세는가 — 합성 원장으로.
// Q6 스트림 세션(tests/field/stream.mjs)이 등록문(L2-TRIAL-3 4일)의 원장 시점에 네 말을 넣고 컴파일을 세는가.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { answerWaits, bounds, dayTable, render, stopsBySlug } from './field/day.mjs';
import { bystanders, childEnv, compile, due, pick } from './field/stream.mjs';

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

test('day 경계: 아침 창 끝 = 첫 ship 전 마지막 접점 · 저녁 창 시작 = 그 뒤 첫 tried · 2일차 아침에 접점이 없으면 전날 저녁의 마지막 접점', () => {
  const b1 = bounds(L, '', T('09:00', D2));
  assert.equal(b1.firstShip.slug, 'boot');
  assert.equal(b1.morningEnd, T('10:01'));
  assert.equal(b1.eveningStart, T('11:00'));
  const b2 = bounds(L, T('09:00', D2));
  assert.equal(b2.firstShip.slug, 'list');
  assert.equal(b2.morningEnd, T('11:03'));
  assert.equal(b2.eveningStart, T('12:00', D2));
});

test('day 1일차 표 머리: 무인 분 · 낮 경과(세 번째 ship) · 낮 접점(BRIEF 절 포함) · 멈춘 때의 미검수·무인 출하', () => {
  const t = day1();
  const out = render(t, { name: 'f' });
  assert.match(out, /- 무인 59\.0분 · 낮 경과\(→ 낮의 세 번째 ship\) 39\.0분/);
  assert.match(out, /- 낮 접점 1\(목표 0\):\n {2}- BRIEF `## 2026-10-02 10:30`/);
  // 절 시각은 분 단위 — 아침 창 끝(10:01:00)과 같은 분인 절은 낮인지 가를 수 없어 세지 않고 따로 보인다(홀드아웃 3일차 08:25 절)
  assert.match(out, /경계 분[^\n]*BRIEF `## 2026-10-02 10:01`/);
  assert.match(out, /낮의 마지막 원장 줄 2026-10-02T10:40:00\.000Z \(ship edit\) · 그때 미검수 3\/3 · 무인 출하 1\/5/); // BRIEF 10:30이 접점이라 무인 출하는 edit 하나
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
  assert.match(out, /- 무인 1497\.0분 · 낮 경과\(→ 낮의 세 번째 ship\) — \(낮 ship 2\)/);
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
    assert.match(r.stdout, /DAY garagiste-day-\S+ · 무인 1497\.0분 · 낮 접점 0 · 낮 ship 2/);
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
  { id: 'pivot', when: { kind: 'pack', pack: 'spec', after: 'modify', slugOf: 'modify' }, choices: [{ slug: 'csv-export', text: 'CSV 내려받기는 이번엔 빼자' }, { slug: 'match-move', text: '날짜 옮기기는 이번엔 빼자' }], object: { kind: ['drop'] } },
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
      const m = { ts: d.line.ts.replace('.000Z', '.500Z'), id: d.item.id, text: d.text, line: d.line, object: d.item.object, call: d.item.call, backlog: ['a', 'b', 'standings', 'csv-export'] };
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
