// day.mjs <프로젝트 폴더> [--since <ISO>] [--until <ISO>] — 원장 → L2 하루 표. docs/measurements/L2-day-conductor.md 「저녁」 2~5의 정의 그대로(판단 없는 산수)
// + 답 대기를 뺀 seed→ship(L1 수치를 같은 표에서). 정비 채널이 conductor와 독립으로 낸다 — 판단이 드는 칸(구성 ①/② · 프레임워크 FAIL · 멈춤 이유 · 참고)은 「표 밖」.
// --since = 그날 세션을 연 시각(그날의 첫 ship을 찾는 데만 쓴다) · --until = 다음 날의 --since(여러 날 원장에서 지난 날을 낼 때)
// 5판(7건 뒤의 정본 — L2-TRIAL-5): 미검수는 사람 센서 unit만(state.mjs humanNeeded와 같은 셈) · 원장 fail/guard 줄과 되풀이 · decide/kept/RESPEC · 이음새 공격·출하 보고 — 라운드 전체(저녁 창 포함)에서 센다
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const CONTACT = ['decide', 'scope', 'tried'];
const RECORD = ['respec', 'needs', 'tried']; // 그 unit이 다시 움직인 줄이 아니라 결정·검수가 남긴 기록 줄
const END = '￿';
const mins = (a, b) => (new Date(b) - new Date(a)) / 60000;
const f1 = (m) => m.toFixed(1);
const k = (n) => `${Math.round(n / 1000)}K`;

// 2. 경계 — 아침 창 끝엔 하한이 없다: 아침에 접점 줄이 없으면 전날 저녁의 마지막 tried다(2판 리눅스 2일차 15:37:58Z)
export function bounds(L, since = '', until = END) {
  const inWin = (e) => e.ts >= since && e.ts < until;
  const firstShip = L.find((e) => e.kind === 'ship' && inWin(e)) || null;
  const anchor = firstShip?.ts ?? L.find((e) => e.kind === 'pack' && inWin(e))?.ts ?? until;
  const morning = L.findLast((e) => CONTACT.includes(e.kind) && e.ts < anchor) || null;
  const morningEnd = morning?.ts ?? (since || L[0]?.ts || '');
  const evening = L.find((e) => e.kind === 'tried' && e.ts > morningEnd && e.ts < until) || null;
  return { firstShip, morning, morningEnd, evening, eveningStart: evening?.ts ?? null, end: evening?.ts ?? until };
}

// spawn_stop엔 slug가 없다 — 바로 앞 같은 pack 값 pack 줄의 slug로 센다. 그 앞의 같은 값 pack이 다른 slug이고 아직 stop이 없었으면 겹쳐 뜬 것(odd)
export function stopsBySlug(L) {
  const last = {}; const out = [];
  for (const e of L) {
    if (e.kind === 'pack') { const prev = last[e.pack]; last[e.pack] = { slug: e.slug, open: true, par: !!(prev && prev.open && prev.slug !== e.slug) }; }
    if (e.kind === 'spawn_stop' && e.pack && last[e.pack]) { const p = last[e.pack]; out.push({ slug: p.slug, ts: e.ts, odd: p.par }); p.open = false; }
  }
  return out;
}

// 답 대기 — 그 unit의 질문(unit.questions · needs의 Q<n>)마다 decide 줄을 사이에 둔 그 unit의 원장 공백:
// decide 직전 그 slug의 마지막 줄 → decide 뒤 그 slug가 다시 움직인 첫 줄. 묻는 시각은 원장에 없다(ask는 DECISIONS.md에만 쓴다). 겹치면 합친다.
export function answerWaits(L, slug, qs, from, to) {
  const mine = L.filter((e) => e.slug === slug && e.ts >= from && e.ts <= to);
  const iv = [];
  for (const n of qs) {
    const d = L.find((e) => e.kind === 'decide' && e.q === n);
    if (!d || d.ts <= from || d.ts >= to) continue;
    iv.push({ q: n, a: mine.findLast((e) => e.ts < d.ts)?.ts ?? from, b: mine.find((e) => e.ts > d.ts && !RECORD.includes(e.kind))?.ts ?? to });
  }
  iv.sort((x, y) => x.a.localeCompare(y.a));
  let total = 0; let cur = null;
  for (const v of iv) {
    if (cur && v.a <= cur.b) { if (v.b > cur.b) cur.b = v.b; continue; }
    if (cur) total += mins(cur.a, cur.b);
    cur = { a: v.a, b: v.b };
  }
  if (cur) total += mins(cur.a, cur.b);
  return { minutes: total, qs: iv.map((v) => v.q) };
}

// 4. unit 표의 한 행 — 시도 수 말고는 마지막 unit 줄(이번 시도) 뒤만 센다
function unitRow({ L, b, until, u, slug, stops, ledgerMd }) {
  const mine = L.filter((e) => e.slug === slug && e.ts < until);
  const seeds = mine.filter((e) => e.kind === 'unit');
  const seed = seeds.at(-1)?.ts ?? mine[0].ts;
  const now = mine.filter((e) => e.ts >= seed);
  const ship = now.find((e) => e.kind === 'ship') || null;
  const packs = now.filter((e) => e.kind === 'pack');
  const spawns = now.filter((e) => e.kind === 'spawn');
  const done = stops.filter((s) => s.slug === slug && s.ts >= seed && s.ts < until);
  const qs = [...new Set([...(u.questions || []), ...(u.needs || []).filter((n) => /^Q\d+$/.test(n)).map((n) => Number(n.slice(1)))])];
  const w = ship ? answerWaits(L, slug, qs, seed, ship.ts) : { minutes: 0, qs: [] };
  const open = qs.filter((n) => !L.some((e) => e.kind === 'decide' && e.q === n && e.ts < b.end));
  const t = ship ? L.find((e) => e.kind === 'tried' && e.slug === slug && e.ts > ship.ts && e.ts < until) || null : null;
  const cells = ledgerMd.split('\n').map((l) => l.split('|').map((x) => x.trim())).find((c) => c[2] === slug) || [];
  return {
    slug, seed, ship: ship?.ts ?? null, tries: seeds.length,
    span: b.eveningStart && (seed >= b.eveningStart || (ship && ship.ts >= b.eveningStart)) ? '연장(유인)' : '무인',
    comp: u.kind === 'scaffold' ? '—' : u.kind === 'system' ? 'system' : u.boundary?.hit ? '③ seed' : packs.some((p) => p.pack === 'spike') ? '③ ship' : '—',
    raw: ship ? mins(seed, ship.ts) : null, wait: w.minutes, waitQs: w.qs, early: seed < b.morningEnd,
    stage: ship ? null : now.some((e) => e.kind === 'drop') ? 'drop' : open.length ? open.map((n) => `Q${n}`).join(',') : packs.at(-1)?.pack ?? 'seed',
    packs: packs.length, stops: done.length, odd: done.some((s) => s.odd),
    tokens: spawns.reduce((s, e) => s + (Number.isFinite(e.tokens) ? e.tokens : 0), 0),
    unrecorded: Math.max(0, packs.length - spawns.filter((e) => Number.isFinite(e.tokens)).length),
    attack: cells[7] || '—', redproof: cells[6] || '—', tried: t?.result ?? null, note: t?.note || '',
    respec: mine.filter((e) => e.kind === 'respec').length, needs: mine.filter((e) => e.kind === 'needs').length,
  };
}

export function dayTable({ L, units = [], ledgerMd = '', brief = '', since = '', until = END, budgets = {} }) {
  const b = bounds(L, since, until);
  const inDay = (ts) => ts > b.morningEnd && (!b.eveningStart || ts < b.eveningStart);
  const stops = stopsBySlug(L);
  const unitLine = (e) => ['unit', 'pack', 'ship'].includes(e.kind) || (e.kind === 'drop' && !e.backlog_only); // unit 없는 BACKLOG 줄 정정(drop --forget)은 unit이 아니다
  const slugs = [...new Set(L.filter((e) => unitLine(e) && e.slug && e.slug !== 'intake' && e.ts > b.morningEnd && e.ts < until).map((e) => e.slug))];
  const rows = slugs.map((slug) => unitRow({ L, b, until, u: units.find((x) => x.slug === slug) || {}, slug, stops, ledgerMd })).sort((x, y) => x.seed.localeCompare(y.seed));
  // 3. 표 머리 — BRIEF의 절 시각은 work.mjs brief가 쓴 UTC 분: 그 분 전체가 낮 안이어야 낮 접점이고,
  // 창 경계와 같은 분이면 낮인지 가를 수 없어 세지 않고 따로 보인다(홀드아웃 3일차 — 저녁 창 08:25:53 뒤 같은 분의 CEO 답)
  const briefs = [...brief.matchAll(/^## (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}).*$/gm)].map((m) => ({ line: m[0], ts: `${m[1]}T${m[2]}:00.000Z`, end: `${m[1]}T${m[2]}:59.999Z` }));
  const inside = (x) => x.ts > b.morningEnd && (!b.eveningStart || x.end < b.eveningStart);
  const touches = (x) => x.end > b.morningEnd && (!b.eveningStart || x.ts < b.eveningStart);
  const last = L.filter((e) => inDay(e.ts)).at(-1) || null;
  // 멈춘 때의 계수 — state.mjs budgetStatus와 같은 셈을 그 시각으로(접점 = decide·scope·tried 줄 + BRIEF 절)
  const at = last?.ts ?? b.morningEnd;
  const shipsTo = L.filter((e) => e.kind === 'ship' && e.ts <= at);
  const untriedAt = [...new Set(shipsTo.map((e) => e.slug))].filter((s) => {
    const sh = shipsTo.findLast((e) => e.slug === s);
    return !L.some((e) => e.kind === 'tried' && e.slug === s && e.ts > sh.ts && e.ts <= at);
  });
  // 5판 — 상한은 사람 센서가 필요한 unit만 센다(state.mjs humanNeeded와 같은 셈): @sensor human · 공격 선발견 0(red>0 공격 줄의 files가 없다); scaffold·system은 세지 않는다. budgets.unseen_machine_exempt === false면 전부(옛 규칙)
  const humanNeeded = (s) => {
    const u = units.find((x) => x.slug === s) || {};
    if (budgets.unseen_machine_exempt === false) return true;
    if (u.sensor && String(u.sensor).startsWith('human')) return true;
    if (u.kind === 'scaffold' || u.kind === 'system') return false;
    const seed = L.findLast((e) => e.kind === 'unit' && e.slug === s && e.ts <= at)?.ts ?? '';
    return !L.some((e) => e.kind === 'attack' && e.slug === s && e.ts >= seed && e.ts <= at && e.red > 0 && (e.files || []).length);
  };
  const unseen = untriedAt.filter(humanNeeded).length;
  const touch = [...L.filter((e) => CONTACT.includes(e.kind) && e.ts <= at).map((e) => e.ts), ...briefs.filter((x) => x.ts <= at).map((x) => x.ts)].sort().at(-1) || '';
  // 5판 칸 — 라운드 전체(낮 + 저녁 창): 결정·FAIL 줄은 저녁 창에도 생긴다
  const inRound = (ts) => ts > b.morningEnd && ts < until;
  const fails = L.filter((e) => e.kind === 'fail' && inRound(e.ts));
  const groups = new Map();
  for (const e of fails) { const key = `${e.script} ${String(e.line || '').slice(0, 80)}`; groups.set(key, { script: e.script, n: (groups.get(key)?.n || 0) + 1 }); } // state.mjs repeatedFails와 같은 키
  const systems = L.filter((e) => e.kind === 'system' && inRound(e.ts)).map((sy) => ({
    slug: sy.slug, units: sy.units || [],
    found: new Set(L.filter((e) => e.kind === 'attack' && e.slug === sy.slug && e.ts > sy.ts && e.ts < until && e.red > 0).flatMap((e) => e.files || [])).size,
    end: L.find((e) => ['ship', 'drop'].includes(e.kind) && e.slug === sy.slug && e.ts > sy.ts && e.ts < until)?.kind ?? '진행 중',
  }));
  return {
    b, rows, budgets, last, unseen, untried: untriedAt.length, unattended: shipsTo.filter((e) => e.ts > touch).length,
    fails, guards: L.filter((e) => e.kind === 'guard' && inRound(e.ts)), repeated: [...groups.values()].filter((g) => g.n >= 2),
    decides: L.filter((e) => e.kind === 'decide' && inRound(e.ts)), kepts: L.filter((e) => e.kind === 'kept' && inRound(e.ts)), respecs: L.filter((e) => e.kind === 'respec' && inRound(e.ts)),
    systems, reports: L.filter((e) => e.kind === 'report' && inRound(e.ts)),
    dayShips: L.filter((e) => e.kind === 'ship' && inDay(e.ts)),
    contacts: L.filter((e) => CONTACT.includes(e.kind) && inDay(e.ts)),
    briefs: briefs.filter(inside),
    briefsEdge: briefs.filter((x) => !inside(x) && touches(x)),
    cards: b.eveningStart ? L.filter((e) => e.kind === 'tried' && e.ts >= b.eveningStart && e.ts < until) : [],
    defaults: units.flatMap((u) => (u.defaults || []).filter((d) => d.at > b.morningEnd && d.at < until).map((d) => ({ slug: u.slug, text: d.text }))),
    lanes: L.filter((e) => e.kind === 'pack' && e.large && e.ts > b.morningEnd && e.ts < until), // 팩 상한 이유-차선(측정 H3) — CEO 결정 대신 conductor의 이유로 지나간 팩
  };
}

export function render(t, { name = '', drift = null } = {}) {
  const { b, rows } = t;
  const who = (e) => (e ? `${e.kind} ${e.slug ?? (e.q ? `Q${e.q}` : '')}`.trim() : '');
  const third = t.dayShips[2];
  const unattended = b.eveningStart ? `${f1(mins(b.morningEnd, b.eveningStart))}분` : '— (저녁 창 없음)';
  const touches = t.contacts.length + t.briefs.length;
  const o = [`## ${name} 하루 표 — 원장으로(tests/field/day.mjs · L2-day-conductor 「저녁」 2~5)`, ''];
  o.push(`- 경계: 아침 창 끝 ${b.morningEnd} (${who(b.morning) || '접점 줄 없음'}) · 저녁 창 시작 ${b.eveningStart ?? '없음'}${b.evening ? ` (${who(b.evening)})` : ''} · 첫 ship ${b.firstShip ? `${b.firstShip.ts} (${b.firstShip.slug})` : '없음'}`);
  o.push(`- 무인 ${unattended} · 낮 경과(→ 낮의 세 번째 ship) ${third ? `${f1(mins(b.morningEnd, third.ts))}분` : `— (낮 ship ${t.dayShips.length})`}`);
  o.push(`- 낮 접점 ${touches}(목표 0)${touches ? ':' : ''}`, ...t.contacts.map((e) => `  - \`${JSON.stringify(e)}\``), ...t.briefs.map((x) => `  - BRIEF \`${x.line}\``));
  for (const x of t.briefsEdge || []) o.push(`  - (경계 분 — 절 시각이 분 단위라 낮인지 가를 수 없어 세지 않았다) BRIEF \`${x.line}\``);
  o.push(`- 멈춤: 낮의 마지막 원장 줄 ${t.last ? `${t.last.ts} (${who(t.last)})` : '없음'} · 그때 미검수 ${t.unseen}/${t.budgets.unseen_max ?? '?'}${t.untried !== t.unseen ? `(사람 센서 — 안 써본 출하 ${t.untried}, 기계 증명 ${t.untried - t.unseen}은 세지 않는다)` : ''} · 무인 출하 ${t.unattended}/${t.budgets.unattended_ship_max ?? '?'} — 이유(여섯 중 하나)는 conductor의 마지막 줄로(표 밖)`);
  if (drift) o.push(`- 규칙집 드리프트: ${drift.log || '없음'} · HEAD:.garagiste ${drift.tree || '—'}`);
  // 5판 칸(L2-TRIAL-5 「예측 — 7건마다」가 읽는 자리)
  o.push(`- 원장 FAIL 줄 ${t.fails.length} · 가드 거부 ${t.guards.length} · 되풀이(같은 줄 2회 이상) ${t.repeated.length}${t.repeated.length ? `: ${t.repeated.map((g) => `${g.script} ×${g.n}`).join(' · ')}` : ''} — 라운드 전체(저녁 창 포함)`);
  o.push(`- 결정: decide ${t.decides.length} · 「예」 가정 그대로(kept) ${t.kepts.length} · RESPEC ${t.respecs.length}`);
  o.push(`- 범위 끝: 이음새 공격 ${t.systems.length ? t.systems.map((sy) => `${sy.slug}(unit ${sy.units.length}) 발견 ${sy.found} → ${sy.end}`).join(' · ') : '없음'} · 출하 보고 ${t.reports.length ? t.reports.map((r) => `${r.path} ${r.ts}`).join(' · ') : '없음'}`);
  o.push('', '| 구간 | unit | 구성 | 시도 | seed→ship 원시(분) | 답 대기 뺀(분) | spawn 의도/완료 | 토큰 | attack | redproof | tried | green 후 CEO 발견 결함 | 프레임워크 FAIL | RESPEC | needs 수정 |', `|${'---|'.repeat(15)}`);
  for (const r of rows) {
    const raw = r.raw === null ? `미출하 — ${r.stage}` : `${f1(r.raw)}${r.wait ? ` (대기 ${r.waitQs.map((q) => `Q${q}`).join(',')} ${f1(r.wait)})` : ''}`;
    const found = r.tried === 'fail' ? `1 — ${r.note}` : r.note ? `0 — 메모: ${r.note}` : r.tried ? '0' : '—';
    o.push(`| ${r.span} | ${r.slug} | ${r.comp} | ${r.tries} | ${raw}${r.early ? ' · seed가 아침 창 끝 전' : ''} | ${r.raw === null ? '—' : f1(r.raw - r.wait)} | ${r.packs}/${r.stops}${r.odd ? '※' : ''} | ${k(r.tokens)}${r.unrecorded ? ` · 미기록 ${r.unrecorded}` : ''} | ${r.attack} | ${r.redproof} | ${r.tried ? `${r.tried}(CEO)` : '—'} | ${found} | — | ${r.respec} | ${r.needs} |`);
  }
  const shipped = rows.filter((r) => r.raw !== null);
  const sum = (list, f) => list.reduce((s, r) => s + f(r), 0);
  const ok = rows.filter((r) => r.tried === 'ok').length; const bad = rows.filter((r) => r.tried === 'fail').length;
  o.push(`| 계 | ${rows.length}(출하 ${shipped.length}) | | | ${f1(sum(shipped, (r) => r.raw))} | ${f1(sum(shipped, (r) => r.raw - r.wait))} | ${sum(rows, (r) => r.packs)}/${sum(rows, (r) => r.stops)} | ${k(sum(rows, (r) => r.tokens))} | 선발견 ${sum(rows, (r) => Number(/^(\d+)→/.exec(r.attack)?.[1] || 0))} | ${rows.filter((r) => r.redproof !== '—').length} | ok ${ok} · fail ${bad} | ${bad} | — | ${sum(rows, (r) => r.respec)} | ${sum(rows, (r) => r.needs)} |`);
  o.push('', `- 카드: ${t.cards.length} · ok ${t.cards.filter((e) => e.result === 'ok').length} · fail ${t.cards.filter((e) => e.result === 'fail').length}`);
  o.push('- CEO-분: 아침 창 (CEO 기입) · 저녁 창 (CEO 기입)');
  o.push(`- 팀이 정한 것 ${t.defaults.length}${t.defaults.length ? ':' : ''}`, ...t.defaults.map((d) => `  - ${d.slug}: ${d.text}`));
  o.push(`- 팩 이유-차선 ${t.lanes.length}${t.lanes.length ? ':' : ''}`, ...t.lanes.map((e) => `  - ${e.slug} ${e.pack} ${f1(e.bytes / 1024)}KB(상한 ${e.cap_kb}KB) — 「${e.large}」`));
  o.push('- 표 밖(판단 — conductor가 넘긴 줄·인수 파일·관찰로 채운다): 구성 ①/② · 프레임워크 FAIL 칸과 전문 · 멈춤 이유 · 참고');
  if (rows.some((r) => r.odd)) o.push('- ※ 같은 팩이 겹쳐 떠서 spawn_stop의 slug가 어긋날 수 있다(정의대로 바로 앞 같은 팩의 slug로 셌다)');
  o.push('', `DAY ${name} · 무인 ${unattended} · 낮 접점 ${touches} · 낮 ship ${t.dayShips.length} · 연장 ${rows.filter((r) => r.span !== '무인').length} · 미출하 ${rows.length - shipped.length} · 토큰 ${k(sum(rows, (r) => r.tokens))} · 카드 ok ${t.cards.filter((e) => e.result === 'ok').length}/fail ${t.cards.filter((e) => e.result === 'fail').length} · FAIL줄 ${t.fails.length} · 가드 ${t.guards.length} · kept ${t.kepts.length}`);
  return o.join('\n');
}

const readText = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

function main() {
  const [dir, ...rest] = process.argv.slice(2);
  const opt = (key) => { const i = rest.indexOf(key); return i < 0 ? undefined : rest[i + 1]; };
  const iso = (x) => {
    const d = new Date(x);
    if (Number.isNaN(d.getTime())) { console.log(`FAIL day 시각을 읽지 못했다: ${x} — ISO로(예: 2026-10-02T15:28:06Z)`); process.exit(1); }
    return d.toISOString();
  };
  if (!dir || !fs.existsSync(dir)) { console.log('사용법: node tests/field/day.mjs <프로젝트 폴더> [--since <ISO 시각>] [--until <ISO 시각>]'); process.exit(1); }
  const team = readJson(path.join(dir, '.garagiste', 'team.json'), {});
  const P = { ledger: '.garagiste/ledger/evidence.jsonl', units: '.garagiste/units', ledger_doc: 'docs/LEDGER.md', brief: 'docs/BRIEF.md', ...(team.paths || {}) };
  const L = readText(path.join(dir, P.ledger)).split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((e) => e && e.ts).sort((a, b) => a.ts.localeCompare(b.ts));
  if (!L.length) { console.log(`FAIL day 원장이 비었다: ${P.ledger}`); process.exit(1); }
  const ud = path.join(dir, P.units);
  const units = fs.existsSync(ud) ? fs.readdirSync(ud).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(ud, f), null)).filter(Boolean) : [];
  const since = opt('--since') === undefined ? '' : iso(opt('--since'));
  const until = opt('--until') === undefined ? END : iso(opt('--until'));
  const t = dayTable({ L, units, ledgerMd: readText(path.join(dir, P.ledger_doc)), brief: readText(path.join(dir, P.brief)), since, until, budgets: team.budgets || {} });
  const git = (args) => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
  // 정의는 --since만이다 — 저녁 창의 CEO 커밋(팩 상한 ① 등)도 그날의 드리프트다. --until은 지난 날을 다시 낼 때 다음 날 경계로만
  const log = git(['log', '--oneline', `--since=${t.b.morningEnd}`, ...(until !== END ? [`--until=${until}`] : []), '--', '.garagiste']);
  console.log(render(t, { name: path.basename(path.resolve(dir)), drift: { log: log === null ? '(git 실패)' : log.split('\n').filter(Boolean).join(' · '), tree: git(['rev-parse', 'HEAD:.garagiste']) } }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
