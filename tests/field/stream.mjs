// stream.mjs — Q6 인터럽트 실사격(L2-TRIAL-3 4일)의 conductor 세션 하나. 스트림 입력이라 conductor가 일하는 중에도 말이 들어간다
// (2026-10-02 탐침 — 다음 도구 호출 사이에 들어가 같은 턴에서 처리된다. turn.sh는 한 턴 한 말이라 진행 중에 넣을 수 없다).
//   run <폴더> <tag> [--plan <plan.json>] — 세션을 띄우고 <폴더>-<tag>.in에 붙는 줄(창의 말)과 plan의 원장 시점 말(등록문의 네 말)을 넣는다
//   say <폴더> <tag> "<말>" [--id <plan id>] — .in에 한 줄 · end <폴더> <tag> — 입력을 닫는다(세션은 지금 턴을 끝내고 나간다)
//   report <폴더> <tag> — 넣은 말마다 컴파일(→ 그 말의 객체 원장 줄까지 도구 호출 수·분)과 그때 진행 중이던 무관 unit의 다음 원장 줄
// 기록(폴더 옆): -<tag>.stream.jsonl(받은 시각 t · 이벤트 e) · -<tag>.msgs.jsonl(넣은 시각 · id · 말 · 까닭 줄) · -<tag>-result<n>.txt(턴 끝 결과 전문)
// 표준 출력은 한 줄씩(Monitor용): INIT · SENT · SHIP · HOLD · RESULT · END. 판단은 하지 않는다 — 말과 시점은 plan(대리가 그날 전에 커밋)이 정한다.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const mins = (a, b) => (new Date(b) - new Date(a)) / 60000;
const re = (s) => (s ? new RegExp(s) : null);

// plan 한 항목이 지금 넣을 때인가 — when: { kind, nth?, pack?, after?(id), slugOf?(id), exclude?(slug 정규식) }.
// after가 있으면 그 말을 넣은 뒤의 줄만 · slugOf면 그 말을 부른 줄의 slug와 같은 줄만 · nth는 그 조건을 만족한 n번째 줄(기본 1)
export function trigger(item, L, sent, since = '') {
  const w = item.when || {};
  if (w.after && !sent[w.after]) return null;
  const from = w.after ? sent[w.after].ts : since;
  const ex = re(w.exclude);
  const hits = L.filter((e) => e.ts > from && e.ts >= since && e.kind === w.kind && (!w.pack || e.pack === w.pack)
    && (!ex || !ex.test(e.slug || '')) && (!w.slugOf || e.slug === sent[w.slugOf]?.line?.slug));
  return hits[(w.nth || 1) - 1] || null;
}

// 말 고르기 — text(고정) · texts{slug: 말}(그 줄의 slug로, 없으면 text — 둘 다 없으면 null: HOLD로 대리가 손으로)
// · choices[{slug, text}](아직 시작하지 않은 unit의 첫 것 — unit 파일이 없거나 dropped)
export function pick(item, line, units = []) {
  if (item.choices) {
    const started = new Set(units.filter((u) => u.state !== 'dropped').map((u) => u.slug));
    return item.choices.find((c) => !started.has(c.slug))?.text ?? null;
  }
  if (item.texts) return item.texts[line?.slug] ?? item.text ?? null;
  return item.text ?? null;
}

// 지금 넣을 말들 — 원장 순서대로(앞 말을 넣은 시각이 뒤 말의 after가 되므로 한 번에 하나씩 정한다)
export function due(plan, L, sent, units = [], since = '') {
  const out = [];
  for (const item of plan) {
    if (sent[item.id]) continue;
    const line = trigger(item, L, sent, since);
    if (!line) continue;
    out.push({ item, line, text: pick(item, line, units) });
  }
  return out;
}

// 그 말의 객체 원장 줄 — object: { kind: [...], slug?(정규식), pack?, slugOf?(id), fresh?(넣을 때 BACKLOG에 없던 slug) }
export function objectLine(msg, L, msgs) {
  const o = msg.object;
  if (!o) return null;
  const sl = re(o.slug);
  const of = o.slugOf ? msgs.find((m) => m.id === o.slugOf)?.line?.slug : null;
  return L.find((e) => e.ts > msg.ts && o.kind.includes(e.kind) && (!sl || sl.test(e.slug || '')) && (!o.pack || e.pack === o.pack)
    && (!o.slugOf || e.slug === of) && (!o.fresh || !(msg.backlog || []).includes(e.slug))) || null;
}

// 스트림의 도구 호출 — assistant 이벤트의 tool_use 블록(받은 시각 t)
export function toolCalls(events) {
  return events.flatMap(({ t, e }) => (e?.type === 'assistant' ? (e.message?.content || []).filter((b) => b.type === 'tool_use')
    .map((b) => ({ t, name: b.name, cmd: b.input?.command ?? b.input?.description ?? '' })) : []));
}

// 컴파일 — 넣은 시각 → 객체 원장 줄: 도구 호출 수와 분 · call 정규식에 맞는 첫 호출(add처럼 원장 줄이 늦게 생기는 말의 참고)
export function compile(msgs, L, events) {
  const calls = toolCalls(events);
  return msgs.filter((m) => m.object).map((m) => {
    const obj = objectLine(m, L, msgs);
    const cr = re(m.call);
    const first = cr ? calls.find((c) => c.t > m.ts && cr.test(c.cmd)) || null : null;
    return {
      id: m.id, ts: m.ts, obj, minutes: obj ? mins(m.ts, obj.ts) : null,
      calls: obj ? calls.filter((c) => c.t > m.ts && c.t <= obj.ts).length : null,
      first, firstCalls: first ? calls.filter((c) => c.t > m.ts && c.t <= first.t).length : null,
    };
  });
}

// 무관 unit — 그 말을 넣을 때 진행 중이던(unit 줄 뒤 ship·drop 없음) unit마다 말 뒤의 첫 원장 줄. 없으면 멈춘 것(멈춤 여섯인지는 대리가 본다)
export function bystanders(msgs, L) {
  return msgs.map((m) => {
    const live = [...new Set(L.filter((e) => e.kind === 'unit' && e.ts < m.ts).map((e) => e.slug))].filter((s) => {
      const seed = L.findLast((e) => e.kind === 'unit' && e.slug === s && e.ts < m.ts);
      return !L.some((e) => ['ship', 'drop'].includes(e.kind) && e.slug === s && e.ts > seed.ts && e.ts < m.ts);
    });
    return { id: m.id, ts: m.ts, units: live.map((s) => ({ slug: s, next: L.find((e) => e.slug === s && e.ts > m.ts) || null })) };
  });
}

const readLines = (p) => { try { return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
const files = (dir, tag) => { const b = `${path.resolve(dir)}-${tag}`; return { in: `${b}.in`, stream: `${b}.stream.jsonl`, msgs: `${b}.msgs.jsonl`, result: (n) => `${b}-result${n}.txt` }; };
const ledgerOf = (dir) => readLines(path.join(dir, '.garagiste', 'ledger', 'evidence.jsonl')).filter((e) => e.ts);
const unitsOf = (dir) => { const d = path.join(dir, '.garagiste', 'units'); try { return fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))); } catch { return []; } };
const backlogSlugs = (dir) => { try { return [...fs.readFileSync(path.join(dir, 'docs', 'BACKLOG.md'), 'utf8').matchAll(/^- \[[ x]\] (\S+) · /gm)].map((m) => m[1]); } catch { return []; } };
const one = (s, n = 160) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// 부모 세션의 CLAUDE* 환경을 걷어 낸다 — turn.sh와 같은 목록(인증에 필요한 것만 남긴다)
const KEEP = new Set(['CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST', 'CLAUDE_CODE_PROXY_RESOLVES_HOSTS', 'CLAUDE_SESSION_INGRESS_TOKEN_FILE', 'CLAUDE_CODE_ACCOUNT_UUID', 'CLAUDE_CODE_ORGANIZATION_UUID', 'CLAUDE_CODE_USER_EMAIL']);
export function childEnv(env) {
  const out = Object.fromEntries(Object.entries(env).filter(([k]) => !/^(CLAUDE[A-Z_]*|CLAUDECODE)$/.test(k) || KEEP.has(k)));
  return { ...out, GIT_AUTHOR_NAME: 'ceo', GIT_AUTHOR_EMAIL: 'ceo@field', GIT_COMMITTER_NAME: 'ceo', GIT_COMMITTER_EMAIL: 'ceo@field' };
}

function run(dir, tag, planPath) {
  const F = files(dir, tag);
  const plan = planPath ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : [];
  const since = new Date().toISOString();
  if (!fs.existsSync(F.in)) fs.writeFileSync(F.in, '');
  const child = spawn('claude', ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--max-turns', '400'],
    { cwd: dir, env: childEnv(process.env), stdio: ['pipe', 'pipe', 'pipe'] });
  const sent = Object.fromEntries(readLines(F.msgs).filter((m) => m.id !== 'say').map((m) => [m.id, m]));
  // .in은 읽은 자리를 옆 파일에 남긴다 — 띄우기 전에 넣어 둔 첫 말도 가고, 다시 띄워도 지난 말을 두 번 넣지 않는다
  let open = true; let n = 0; let buf = ''; let inOff = Number(fs.existsSync(`${F.in}.off`) ? fs.readFileSync(`${F.in}.off`, 'utf8') : 0); let ledN = ledgerOf(dir).length;
  const send = (id, text, extra = {}) => {
    if (!open) return;
    const m = { ts: new Date().toISOString(), id, text, ...extra };
    child.stdin.write(JSON.stringify({ type: 'user', message: { role: 'user', content: text } }) + '\n');
    fs.appendFileSync(F.msgs, JSON.stringify(m) + '\n');
    if (id !== 'say') sent[id] = m;
    console.log(`SENT ${id} ${m.ts} — ${one(text)}${extra.line ? ` (원장 ${extra.line.kind} ${extra.line.slug ?? ''} ${extra.line.ts})` : ''}`);
  };
  child.stdout.on('data', (d) => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const l = buf.slice(0, i); buf = buf.slice(i + 1);
      if (!l.trim()) continue;
      let e; try { e = JSON.parse(l); } catch { e = { raw: l }; }
      fs.appendFileSync(F.stream, JSON.stringify({ t: new Date().toISOString(), e }) + '\n');
      if (e.type === 'system' && e.subtype === 'init') console.log(`INIT session=${e.session_id} model=${e.model}`);
      if (e.type === 'result') { n += 1; fs.writeFileSync(F.result(n), String(e.result ?? '')); console.log(`RESULT ${n} ${e.subtype} turns=${e.num_turns} cost=${e.total_cost_usd} — ${one(e.result)}`); }
    }
  });
  child.stderr.on('data', (d) => fs.appendFileSync(`${F.stream}.err`, d));
  const tick = () => {
    const size = fs.statSync(F.in).size;
    if (size > inOff) {
      const fd = fs.openSync(F.in, 'r'); const b = Buffer.alloc(size - inOff); fs.readSync(fd, b, 0, b.length, inOff); fs.closeSync(fd);
      const text = b.toString('utf8'); const cut = text.lastIndexOf('\n') + 1; inOff += Buffer.byteLength(text.slice(0, cut)); fs.writeFileSync(`${F.in}.off`, String(inOff));
      for (const l of text.slice(0, cut).split('\n').filter(Boolean)) {
        let m; try { m = JSON.parse(l); } catch { m = { text: l }; }
        if (m.end) { open = false; child.stdin.end(); console.log('CLOSED 입력을 닫았다 — 지금 턴이 끝나면 나간다'); continue; }
        const item = plan.find((p) => p.id === m.id);
        const line = sent[m.id]?.held ? sent[m.id].line : undefined; // HOLD된 말을 손으로 넣으면 그 시점의 줄(slugOf가 읽는다)을 잇는다
        send(m.id || 'say', m.text, item ? { line, object: item.object, call: item.call, backlog: backlogSlugs(dir), manual: true } : {});
      }
    }
    const L = ledgerOf(dir);
    for (const e of L.slice(ledN)) if (e.kind === 'ship') console.log(`SHIP ${e.slug} ${e.ts}`);
    ledN = L.length;
    for (const d of due(plan, L, sent, unitsOf(dir), since)) {
      if (d.text === null) { if (!sent[d.item.id]?.held) { sent[d.item.id] = { held: true, line: d.line }; console.log(`HOLD ${d.item.id} ${d.line.slug ?? ''} — plan에 그 slug의 말이 없다: say --id ${d.item.id} "<말>"`); } continue; }
      send(d.item.id, d.text, { line: d.line, object: d.item.object, call: d.item.call, backlog: backlogSlugs(dir) });
    }
  };
  const timer = setInterval(tick, 1000);
  child.on('exit', (code) => { clearInterval(timer); console.log(`END exit=${code}`); process.exit(code ?? 1); });
}

function report(dir, tag) {
  const F = files(dir, tag);
  const msgs = readLines(F.msgs); const L = ledgerOf(dir); const events = readLines(F.stream);
  const o = [`## ${tag} — 넣은 말 ${msgs.length} · 도구 호출 ${toolCalls(events).length} · 턴 끝 ${events.filter((x) => x.e?.type === 'result').length}`, '',
    '| 말 | 넣은 시각 | 객체 원장 줄 | 도구 호출 | 분 | 첫 명령(참고) |', '|---|---|---|---|---|---|'];
  for (const c of compile(msgs, L, events)) {
    const obj = c.obj ? `${c.obj.kind} ${c.obj.pack ?? ''} ${c.obj.slug ?? ''} ${c.obj.ts}`.replace(/\s+/g, ' ') : '없음';
    o.push(`| ${c.id} | ${c.ts} | ${obj} | ${c.calls ?? '—'} | ${c.minutes === null ? '—' : c.minutes.toFixed(1)} | ${c.first ? `${c.firstCalls}번째 \`${one(c.first.cmd, 80)}\`` : '—'} |`);
  }
  o.push('', '무관 unit(넣을 때 진행 중 → 말 뒤 첫 원장 줄):');
  for (const b of bystanders(msgs.filter((m) => m.id !== 'say'), L)) o.push(`- ${b.id}: ${b.units.map((u) => `${u.slug} → ${u.next ? `${u.next.kind}${u.next.pack ? ` ${u.next.pack}` : ''} ${u.next.ts}` : '없음'}`).join(' · ') || '없음'}`);
  console.log(o.join('\n'));
}

function main() {
  const [cmd, dir, tag, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i < 0 ? undefined : rest[i + 1]; };
  if (!['run', 'say', 'end', 'report'].includes(cmd) || !dir || !tag || !fs.existsSync(dir)) {
    console.log('사용법: node tests/field/stream.mjs run|say|end|report <프로젝트 폴더> <tag> [--plan <plan.json>] ["<말>" --id <id>]'); process.exit(1);
  }
  const F = files(dir, tag);
  if (cmd === 'run') return run(path.resolve(dir), tag, opt('--plan'));
  if (cmd === 'say') { const text = rest.find((x, i) => !x.startsWith('--') && rest[i - 1] !== '--id'); if (!text) { console.log('FAIL say 말이 없다'); process.exit(1); } fs.appendFileSync(F.in, JSON.stringify({ id: opt('--id'), text }) + '\n'); return console.log(`QUEUED ${opt('--id') || 'say'} — ${one(text)}`); }
  if (cmd === 'end') { fs.appendFileSync(F.in, JSON.stringify({ end: true }) + '\n'); return console.log('QUEUED end'); }
  return report(path.resolve(dir), tag);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
