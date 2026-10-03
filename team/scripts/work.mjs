// work — unit의 생애와 입구: brief(구상 원문 축적) · add(BACKLOG unit 줄) · needs(선행 수정) · scope(범위 + 선행 닫힘) · seed(다음 unit 자동) · new · ask/decide · default · tried · list
import fs from 'node:fs';
import path from 'node:path';
import { checkBoundary } from './boundary.mjs';
import { blocking, diagnose } from './doctor.mjs';
import { appendLedger, ceoTouch, ctx, fail, git, hasFileSlot, isMain, linkDeps, unlinkDeps, listUnits, loadUnit, out, readJson, readLedger, readText, saveUnit, shell, stamp, touchCeo, unitFile, worktreeDir, writeJson } from './lib.mjs';
import { budgetStatus } from './state.mjs';

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;
export const PACKS = ['intake', 'spec', 'build', 'attack', 'spike', 'boot'];
export const TIERS = {
  low: { intake: 'sonnet', spec: 'sonnet', build: 'haiku', attack: 'sonnet', spike: 'haiku', boot: 'haiku' },
  medium: { intake: 'opus', spec: 'opus', build: 'sonnet', attack: 'opus', spike: 'sonnet', boot: 'sonnet' },
  high: { intake: 'opus', spec: 'opus', build: 'opus', attack: 'opus', spike: 'sonnet', boot: 'sonnet' },
};
// 편성 한 곳: team.json.models가 정본, 하네스의 에이전트 파일 앞머리 `model:`은 거기서 재생성
export function resolveModels(current, args) {
  if (args.length === 1 && TIERS[args[0]]) return { ...current, ...TIERS[args[0]] };
  const next = { ...current };
  for (const a of args) {
    const m = /^([a-z]+)=([a-z0-9._/-]+)$/i.exec(a);
    if (!m || !PACKS.includes(m[1])) throw new Error(`형식: <low|medium|high> 또는 <팩>=<모델> (팩: ${PACKS.join('·')}) — 받은 값: ${a}`);
    next[m[1]] = m[2];
  }
  return next;
}
export function setFrontmatterModel(text, model) {
  if (!text.startsWith('---')) return text;
  if (/^model:\s.*$/m.test(text.split('\n---')[0] + '\n---')) return text.replace(/^model:\s.*$/m, `model: ${model}`);
  return text.replace(/^---\n/, `---\nmodel: ${model}\n`);
}
export const DECISIONS_TEMPLATE = '# DECISIONS\n\n## 정해 주세요\n\n## 정한 것\n';
const BACKLOG_HEAD = '# BACKLOG — 한 줄 = 한 unit. 형식: `- [ ] <slug> · M<n> · needs: <a,b|Q<n>|-> · "<원문 한 문장>" · 인수: <기계가 확인할 한 줄>`. 쓰기는 work.mjs만.\n\n';
const q = (s) => String(s).replace(/"/g, '”').replace(/\n/g, ' ');

export function backlogLine({ slug, milestone = 'M?', needs = [], origin, accept = '-', kind }) {
  return `- [ ] ${slug} · ${milestone} · needs: ${needs.length ? needs.join(',') : '-'} · "${q(origin)}" · 인수: ${q(accept)}${kind && kind !== 'feature' ? ` · kind: ${kind}` : ''}`;
}
export function parseBacklog(text) {
  const items = [];
  for (const line of (text || '').split('\n')) {
    const m = /^- \[( |x)\] ([a-z0-9][a-z0-9-]*) · (\S+) · needs: (\S+) · "(.*)" · 인수: (.*?)(?: · kind: ([a-z]+))?$/.exec(line);
    if (m) items.push({ done: m[1] === 'x', slug: m[2], milestone: m[3], needs: m[4] === '-' ? [] : m[4].split(',').map((s) => s.trim()).filter(Boolean), origin: m[5], accept: m[6], kind: m[7] || 'feature' });
  }
  return items;
}
// 범위 닫힘: 요청한 unit들이 기대는 선행을 끝까지 따라가 순서(선행 먼저, BACKLOG 순 안정)와 없는 선행을 낸다.
export function closure(items, requested, { noNeeds = false } = {}) {
  const by = new Map(items.map((i) => [i.slug, i]));
  const order = []; const missing = new Set(); const seen = new Set(); const stack = new Set(); let cycle = null;
  const visit = (slug) => {
    if (seen.has(slug)) return; if (stack.has(slug)) { cycle = slug; return; }
    const it = by.get(slug);
    if (!it) { if (!/^Q\d+$/.test(slug)) missing.add(slug); return; }
    stack.add(slug);
    if (!noNeeds) for (const n of it.needs) visit(n);
    stack.delete(slug); seen.add(slug);
    if (!it.done) order.push(slug);
  };
  for (const r of requested) visit(r);
  const required = order.filter((s) => !requested.includes(s));
  return { requested: requested.filter((r) => by.has(r)), unknown: requested.filter((r) => !by.has(r)), required, missing: [...missing], order, cycle };
}
// 다음 unit: 순서상 첫 미완·미착수 unit 중 선행(unit 출하 또는 BACKLOG [x], Q<n>은 DECISIONS [x])이 전부 끝난 것
export function pickReady({ order, items, units, decisionsText = '' }) {
  const by = new Map(items.map((i) => [i.slug, i]));
  const shipped = new Set(units.filter((u) => u.state === 'shipped').map((u) => u.slug));
  const active = new Set(units.filter((u) => u.state !== 'shipped' && u.state !== 'dropped').map((u) => u.slug)); // dropped는 자리를 막지 않는다
  const closedQ = new Set([...decisionsText.matchAll(/^- \[x\] (Q\d+)/gm)].map((m) => m[1]));
  const satisfied = (n) => (/^Q\d+$/.test(n) ? closedQ.has(n) : shipped.has(n) || by.get(n)?.done === true);
  const remaining = order.filter((s) => !shipped.has(s) && !(by.get(s)?.done));
  if (!remaining.length) return { kind: 'done' };
  for (const s of remaining) {
    if (active.has(s)) continue;
    const unmet = (by.get(s)?.needs || []).filter((n) => !satisfied(n));
    if (!unmet.length) return { kind: 'ready', slug: s, item: by.get(s) };
  }
  const first = remaining.find((s) => !active.has(s));
  if (!first) return { kind: 'active', slugs: remaining.filter((s) => active.has(s)) };
  return { kind: 'wait', slug: first, unmet: (by.get(first)?.needs || []).filter((n) => !satisfied(n)) };
}
// L2 1일차: unit은 한 번에 하나(Flow 4) — 병렬 seed가 같은 파일 충돌(사고 26)과 spawn 귀속 어긋남의 토양이었다. 예외는 CEO 질문(열린 Q)에 걸려 멈춘 unit(Flow 6).
// 예산 정지 중엔 seed도 STOP — 그때 연 unit은 몇 시간 유휴하며 base가 낡았다(effect-conflict).
export function seedGate({ units, decisionsText = '', stops = [] }) {
  if (stops.length) return { kind: 'stop', why: stops };
  const open = new Set([...String(decisionsText).matchAll(/^- \[ \] Q(\d+)/gm)].map((m) => Number(m[1])));
  const parked = (u) => [...(u.questions || []), ...(u.holds || [])].some((n) => open.has(Number(n))) || (u.needs || []).some((n) => /^Q\d+$/.test(n) && open.has(Number(n.slice(1)))); // holds: 사고 59
  const working = units.filter((u) => u.state !== 'shipped' && u.state !== 'dropped' && !parked(u)).map((u) => u.slug);
  return working.length ? { kind: 'active', slugs: working } : null;
}
export function nextQuestionNumber(text) {
  const nums = [...text.matchAll(/^- \[[ x]\] Q(\d+)/gm)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) + 1 : 1;
}
export function decideLine(text, n, answer, date) {
  const re = new RegExp(`^- \\[ \\] Q${n}\\b(.*)$`, 'm');
  if (!re.test(text)) return null;
  return text.replace(re, (_, rest) => `- [x] Q${n}${rest} → ${answer} (${date})`);
}
// 사고 23(3차 실기): intake가 Q 번호를 짐작해 한 칸 밀려 적었다 — needs의 Q<n>은 DECISIONS에 있는 번호(ask가 준 것)만
export function unknownQuestions(needs, decisionsText) {
  const known = new Set([...String(decisionsText || '').matchAll(/^- \[[ x]\] (Q\d+)/gm)].map((m) => m[1]));
  return needs.filter((n) => /^Q\d+$/.test(n) && !known.has(n));
}
// 사고 17(2차 실기): 닫힘은 반영이 아니다 — Q<n>에 기대는 진행 중 unit 중 이번 생애(created 이후)에 spec이 답 없이 이미 돈 것.
// 첫 spec 전이면 그 팩이 답을 담으므로 대상이 아니다. 출하·dropped는 끝났고, scaffold(boot)엔 spec이 없다.
export function respecTargets({ units, ledger, n }) {
  return units.filter((u) => u.state !== 'shipped' && u.state !== 'dropped' && u.kind !== 'scaffold'
    && ((u.questions || []).includes(n) || (u.needs || []).includes(`Q${n}`))
    && ledger.some((e) => e.kind === 'pack' && e.pack === 'spec' && e.slug === u.slug && (e.ts || '') >= (u.created || '')))
    .map((u) => u.slug);
}
// L2 3판 리눅스 2·3라운드 측정 (e): spec이 올린 저장 꼴 질문(Q6~Q9·Q11)이 모두 「예」였는데 각각 RESPEC을 걸어 다음 라운드의 spec이 「고칠 주장 없음」으로 끝났다 — 라운드당 출하 1.
// 가정을 적은 질문(ask --assumed)의 맨 「예」는 지금 주장 그대로라 re-spec이 아니다. 가정 없는 「예」는 무엇을 가정했는지 기계가 모르니 사고 17대로 RESPEC, 다른 답도 RESPEC.
const CONFIRM = /^\s*(예|네|응|그래|그렇다|맞다|맞아|그대로|ok|okay|yes|y)\s*[.!。]?\s*$/i;
export function keepsAssumption(unit, n, answer) {
  const a = (unit?.assumed || []).find((x) => Number(x.q) === Number(n));
  return a && CONFIRM.test(String(answer || '')) ? a.text : null;
}
// BACKLOG 열린 줄 하나의 needs만 바꾼다 — 다른 줄은 바이트 그대로, 닫힌 줄·없는 줄은 null
export function setNeeds(text, slug, needs) {
  const re = new RegExp(`^(- \\[ \\] ${slug} · \\S+ · needs: )\\S+( · .*)$`, 'm');
  if (!re.test(text)) return null;
  return text.replace(re, (_, head, tail) => `${head}${needs.length ? needs.join(',') : '-'}${tail}`);
}

const backlogPath = (c) => path.join(c.main, c.team.paths.backlog);
const NO_GUESS = 'DECISIONS에 없는 질문 — 번호를 짐작하지 않는다: unit을 먼저 add하고 work.mjs ask intake "<질문>" --for <slug,…>가 번호를 needs에 잇는다';
function readBacklog(c) { return readText(backlogPath(c)); }
function appendBacklog(c, line) {
  const p = backlogPath(c); fs.mkdirSync(path.dirname(p), { recursive: true });
  if (!fs.existsSync(p)) fs.writeFileSync(p, BACKLOG_HEAD);
  fs.appendFileSync(p, line + '\n');
}
function brief(c, args) {
  const p = path.join(c.main, c.team.paths.brief); fs.mkdirSync(path.dirname(p), { recursive: true });
  let text = '';
  if (args[0] === '--file') { text = readText(args[1]); if (!text) fail(`FAIL 파일 없음: ${args[1]}`); }
  else text = args.join(' ');
  if (!text.trim()) fail('사용법: work.mjs brief "<CEO 말 그대로>" | --file <PRD 경로>');
  if (!fs.existsSync(p)) fs.writeFileSync(p, '# BRIEF — CEO의 말 그대로. 요약·해석 없음. 팩은 이 파일을 데이터로 받는다.\n');
  fs.appendFileSync(p, `\n## ${new Date().toISOString().slice(0, 16).replace('T', ' ')}${args[0] === '--file' ? ` (${path.basename(args[1])})` : ''}\n${text.trim()}\n`);
  touchCeo(c.main);
  out(`BRIEF +${text.trim().split('\n').length}줄 ${Buffer.byteLength(text)}B → ${c.team.paths.brief}`);
}
function add(c, slug, origin, flags) {
  if (!SLUG_RE.test(slug || '')) fail('FAIL slug: 소문자·숫자·하이픈 2~41자');
  if (!origin) fail('FAIL 원문이 없다: work.mjs add <slug> "<원문 한 문장>" [--milestone M1] [--needs a,b] [--accept "<한 줄>"]');
  const prev = parseBacklog(readBacklog(c)).find((i) => i.slug === slug);
  // 사고 50(홀드아웃): 잘못 쓴 BACKLOG 줄을 고칠 길이 없었다 — add는 중복을 거부했고 drop은 unit을 요구했다. 열린 unit이 없는 열린 줄은 제자리에서 바꾼다
  if (prev && !flags.replace) fail(`FAIL BACKLOG에 있음: ${slug} — 고치려면 같은 명령에 --replace(열린 unit이 없는 열린 줄만), 지우려면 work.mjs drop ${slug} "<사유>" --forget`);
  if (flags.replace && !prev) fail(`FAIL --replace는 BACKLOG에 있는 줄만: ${slug}`);
  if (prev?.done) fail(`FAIL ${slug}은 닫힌 줄 — 새 일은 새 slug다`);
  const live = readJson(unitFile(c.main, c.team, slug), null);
  if (prev && live && live.state !== 'dropped') fail(`FAIL ${slug}은 unit이 열려 있다 — 진행 중 unit의 수용은 re-spec: work.mjs brief "<CEO 말>" → brief.mjs spec ${slug}`);
  const needs = (flags.needs || '-') === '-' ? [] : flags.needs.split(',').map((s) => s.trim()).filter(Boolean);
  const unknownQ = unknownQuestions(needs, readText(path.join(c.main, c.team.paths.decisions)));
  if (unknownQ.length) fail(`FAIL needs ${unknownQ.join(',')}: ${NO_GUESS}`);
  const line = backlogLine({ slug, milestone: flags.milestone || 'M?', needs, origin, accept: flags.accept || '-', kind: flags.kind });
  if (prev) {
    const p = backlogPath(c); const text = readText(p);
    const old = text.split('\n').find((l) => l.startsWith(`- [ ] ${slug} · `));
    fs.writeFileSync(p, text.replace(old, () => line));
    appendLedger(c.main, c.team, { kind: 'backlog_replace', slug, from: old, to: line });
    return out(`REPLACE ${slug} ${flags.milestone || 'M?'} needs=${needs.join(',') || '-'}`);
  }
  appendBacklog(c, line);
  out(`ADD ${slug} ${flags.milestone || 'M?'} needs=${needs.join(',') || '-'}${flags.kind && flags.kind !== 'feature' ? ` kind=${flags.kind}` : ''}`);
}
function createUnit(c, slug, origin, opts = {}) {
  if (!SLUG_RE.test(slug || '')) fail('FAIL slug: 소문자·숫자·하이픈 2~41자');
  if (!origin) fail('FAIL 원문이 없다');
  // origin_kind = 이 unit이 어디서 왔나: seed(범위의 BACKLOG 경유) · ceo(CEO 본인 = ADMIN 세션) · team(팀 발의 — 연속 상한이 센다)
  const from = opts.from || (process.env.GARAGISTE_ADMIN ? 'ceo' : 'team');
  if (!['ceo', 'team', 'seed'].includes(from)) fail(`FAIL --from은 ceo|team (받은 값: ${from})`);
  if (from === 'ceo' && opts.from === 'ceo' && !process.env.GARAGISTE_ADMIN) fail('FAIL --from ceo는 GARAGISTE_ADMIN=1(CEO 세션)에서만 — 팀 발의는 team이다');
  const prev = readJson(unitFile(c.main, c.team, slug), null);
  if (prev && prev.state !== 'dropped') fail(`FAIL unit 있음: ${slug}`); // dropped 위에는 같은 slug가 새로 열린다 (kill-and-respawn)
  const wt = worktreeDir(c.main, c.team, slug);
  const branch = `unit/${slug}`;
  const addWt = git(['worktree', 'add', '-q', '-b', branch, wt, c.team.protected_branch], c.main);
  if (addWt.status) fail(`FAIL worktree: ${addWt.stderr}`);
  linkDeps(c.main, wt);
  const boundary = checkBoundary(c.team, { text: origin });
  const kind = opts.kind || 'feature';
  const state0 = kind === 'scaffold' ? 'boot' : kind === 'system' ? 'attack' : boundary.hit ? 'spike' : 'spec'; // system(이음새 공격): spec·spike 없이 attack부터
  fs.writeFileSync(path.join(wt, '.garagiste-pack'), state0);
  const unit = {
    slug, kind, origin, origin_kind: from, milestone: opts.milestone || 'M?', needs: opts.needs || [], accept: opts.accept || '-',
    created: new Date().toISOString(), state: state0, branch, worktree: path.relative(c.main, wt).replace(/\\/g, '/'), boundary: kind === 'system' ? { hit: false, reasons: [] } : boundary, // 저장 경로는 /로 — listFiles와 같은 법(사고 18)
    defaults: [], questions: [], tried: null, shipped: null, sensor: null,
  };
  saveUnit(c.main, c.team, unit);
  if (!parseBacklog(readBacklog(c)).some((i) => i.slug === slug)) appendBacklog(c, backlogLine({ slug, origin, kind }));
  // unit 생성은 CEO 접점이 아니다 — 접점은 brief·scope·decide·tried뿐. 여기서 touchCeo하면 매 seed가 무인 출하 상한을 리셋한다.
  appendLedger(c.main, c.team, { kind: 'unit', slug, state: unit.state, origin_kind: unit.origin_kind, milestone: unit.milestone });
  out(`UNIT ${slug} ${unit.state} ${unit.worktree}`);
  if (kind === 'scaffold') out('SCAFFOLD — boot 팩 하나로 끝난다(스택·명령·스모크·규칙 파일), spec·attack 없음');
  else if (kind !== 'system' && boundary.hit) out(`HIT ${boundary.reasons.join(', ')} — spike 팩부터`);
}
// system-attack(백로그 「system-attack 팩」 · 채용 2026-10-03 — 방아쇠: green 후 CEO 발견 결함이 벤치 파이썬 날짜 ×2 · todo 4일차 · 홀드아웃 library loan-limit로 0이 아니었다):
// 공격이 unit 안에서만 돌아 이음새가 새어 나갔다. 범위가 끝나면(next가 낸다) 출하된 unit 전체를 한 제품으로 공격 한 바퀴 — 입력은 diff가 아니라 표면·try·실행 명령.
function system(c) {
  if (c.root !== c.main) fail('FAIL system은 메인 저장소에서만 — 이음새 공격을 여는 것은 conductor의 일이다');
  const sc = readJson(scopePath(c), null);
  if (!sc) fail('FAIL scope 없음 — 이음새 공격은 범위가 끝난 뒤(work.mjs scope → … → SCOPE DONE)');
  const units = listUnits(c.main, c.team);
  const shipped = units.filter((u) => u.state === 'shipped' && u.kind !== 'system').sort((a, b) => (a.shipped || '').localeCompare(b.shipped || ''));
  if (shipped.length < 2) fail(`FAIL 출하된 unit ${shipped.length} — 이음새는 둘부터(한 unit의 결함은 그 unit의 attack이 본다)`);
  const slug = `system-${units.filter((u) => u.kind === 'system').length + 1}`;
  const origin = `이음새 공격 — 출하된 unit ${shipped.length}개(${shipped.map((u) => u.slug).join(', ')})의 표면·try·실행 명령을 한 제품으로 공격한다`;
  createUnit(c, slug, origin, { kind: 'system', from: 'seed', milestone: shipped[shipped.length - 1].milestone });
  writeJson(scopePath(c), { ...sc, system: slug, system_for: (sc.order || []).join(',') }); // 이 범위(order)에 한 바퀴 — -fix로 범위가 자라면 next가 다시 낸다
  appendLedger(c.main, c.team, { kind: 'system', slug, units: shipped.map((u) => u.slug) });
  out(`SYSTEM ${slug} — 출하된 unit ${shipped.length}개의 이음새: node .garagiste/scripts/brief.mjs attack ${slug} (발견은 red 테스트 → build가 고친다 · 발견 0이면 drop)`);
}
const scopePath = (c) => path.join(c.main, '.garagiste', 'scope.json');
function scope(c, args) {
  const items = parseBacklog(readBacklog(c));
  if (!items.length) fail('FAIL BACKLOG가 비었다 — work.mjs brief → intake 팩 → work.mjs add');
  const noNeeds = args.includes('--no-needs');
  const rest = args.filter((a) => a !== '--no-needs');
  let requested = [];
  if (rest[0] === '--milestone') requested = items.filter((i) => i.milestone === rest[1]).map((i) => i.slug);
  else if (rest[0] === '--range') {
    const [a, b] = (rest[1] || '').split('..'); const ia = items.findIndex((i) => i.slug === a); const ib = items.findIndex((i) => i.slug === b);
    if (ia < 0 || ib < 0) fail(`FAIL range: ${a}..${b} — BACKLOG에 없는 slug`);
    requested = items.slice(Math.min(ia, ib), Math.max(ia, ib) + 1).map((i) => i.slug);
  } else requested = rest;
  // L2 5판 리눅스 4라운드: `scope export-import --milestone M3`이 「BACKLOG에 없는 slug: --milestone, M3」 — 원인(혼용)을 말하지 않았다
  if (rest.slice(rest[0]?.startsWith('--') ? 2 : 0).some((a) => a.startsWith('--'))) fail('FAIL scope: slug 목록과 --milestone/--range는 함께 쓸 수 없다 — 둘 중 하나로(work.mjs scope <slug…> | --milestone M3 | --range a..b)');
  if (!requested.length) fail('사용법: work.mjs scope <slug…> | --milestone M1 | --range a..b [--no-needs]');
  const cl = closure(items, requested, { noNeeds });
  if (cl.unknown.length) fail(`FAIL BACKLOG에 없는 slug: ${cl.unknown.join(', ')}`);
  if (cl.cycle) fail(`FAIL needs 순환: ${cl.cycle}`);
  writeJson(scopePath(c), { ...cl, noNeeds, at: new Date().toISOString() });
  touchCeo(c.main);
  appendLedger(c.main, c.team, { kind: 'scope', requested: cl.requested, required: cl.required, missing: cl.missing, noNeeds });
  out(`SCOPE 요청 ${cl.requested.length} · 선행 ${cl.required.length} · 없는 선행 ${cl.missing.length}${noNeeds ? ' · 선행 무시(--no-needs)' : ''}`);
  if (cl.required.length) { const by = new Map(items.map((i) => [i.slug, i])); out(`- 선행: ${cl.required.map((s) => `${s} (${items.filter((i) => i.needs.includes(s) && cl.order.includes(i.slug)).map((i) => i.slug).join(',')}가 needs)`).join(' · ')}`); void by; }
  if (cl.missing.length) out(`- 없는 선행: ${cl.missing.join(', ')} — intake가 추가하거나 needs를 고쳐라`);
  out(`- 순서: ${cl.order.join(' → ')}`);
  out('받으려면 work.mjs seed. 선행을 빼려면 --no-needs (CEO 결정, 원장에 남는다).');
}
function seed(c) {
  // 병든 설치(훅 침묵·게이트 꺼짐)에서 unit을 만들지 않는다 — tacit을 죽인 조용한 죽음의 백신. fresh 항목(alive·빈 commands)은 통과.
  const probs = blocking(diagnose(c.main));
  if (probs.length) fail(`FAIL doctor ${probs.length} — 설치가 병든 채로 seed하지 않는다\n${probs.map((x) => `- ${x}`).join('\n')}`);
  const sc = readJson(scopePath(c), null);
  if (!sc) fail('FAIL scope 없음 — work.mjs scope <slug…>|--milestone M1|--range a..b');
  const items = parseBacklog(readBacklog(c));
  const units = listUnits(c.main, c.team);
  const decisionsText = readText(path.join(c.main, c.team.paths.decisions));
  const g = seedGate({ units, decisionsText, stops: budgetStatus({ units, ledger: readLedger(c.main, c.team), team: c.team, ceoTouchTs: ceoTouch(c.main) }).stops });
  if (g?.kind === 'stop') return out(`STOP ${g.why.join('; ')} — 예산 정지 중엔 새 unit을 열지 않는다(열어도 낡은 base 위에서 기다린다). CEO에게: docs/STATUS.md 「써볼 것」`);
  if (g?.kind === 'active') return out(`ACTIVE ${g.slugs.join(', ')} — unit은 한 번에 하나: 출하되거나 CEO 질문(열린 Q)에 걸려야 다음이 열린다`);
  const r = pickReady({ order: sc.order, items, units, decisionsText });
  if (r.kind === 'done') return out('SCOPE DONE — 범위의 unit이 전부 출하됐다. 다음 범위를 정해라(work.mjs scope).');
  if (r.kind === 'active') return out(`ACTIVE ${r.slugs.join(', ')} — 진행 중인 unit이 끝나야 다음이 열린다`);
  if (r.kind === 'wait') return out(`WAIT ${r.slug} needs ${r.unmet.join(',')} — ${r.unmet.some((n) => /^Q\d+$/.test(n)) ? '결정이 먼저(work.mjs decide)' : '선행 unit이 먼저'}`);
  createUnit(c, r.slug, r.item.origin, { milestone: r.item.milestone, needs: r.item.needs, accept: r.item.accept, kind: r.item.kind, from: 'seed' });
}
function decisionsFile(c) {
  const p = path.join(c.main, c.team.paths.decisions);
  if (!fs.existsSync(p)) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, DECISIONS_TEMPLATE); }
  return p;
}
// 사고 23: 기대는 unit을 --for로 받으면 번호는 스크립트가 그 needs에 잇는다 — 에이전트가 번호를 옮겨 적지 않는다(짐작은 한 칸 밀렸다)
function ask(c, slug, question, flags = {}) {
  if (!question) fail('FAIL 질문이 없다');
  const u = slug === 'intake' ? null : loadUnit(c.main, c.team, slug);
  // 사고 59(홀드아웃 library): CEO 결정만 요구하는 FAIL은 그 unit만 세운다 — --hold는 답이 와도 re-spec하지 않는다(답의 길은 그 FAIL의 안내)
  if (flags.hold && !u) fail('FAIL --hold는 진행 중 unit의 질문에만 — work.mjs ask <slug> "<질문>" --hold');
  // L2 3판 리눅스 2·3라운드 측정 (e): 주장을 쓴 뒤의 확인형 질문은 「예」가 곧 지금 주장이다 — --assumed에 그 가정을 적으면 decide의 맨 「예」가 RESPEC을 걸지 않는다(keepsAssumption)
  const assumed = typeof flags.assumed === 'string' ? flags.assumed.trim() : '';
  if ('assumed' in flags && (!u || !assumed)) fail('FAIL --assumed는 진행 중 unit의 질문에 가정 한 줄 — work.mjs ask <slug> "<질문>" --assumed "<지금 주장이 가정한 것>"');
  const forSlugs = flags.for ? flags.for.split(',').map((s) => s.trim()).filter(Boolean) : [];
  let bl = readBacklog(c);
  const items = parseBacklog(bl);
  const bad = forSlugs.filter((s) => !items.some((i) => i.slug === s && !i.done));
  if (bad.length) fail(`FAIL --for ${bad.join(',')}: BACKLOG의 열린 unit이 아니다 — work.mjs add 먼저`);
  const p = decisionsFile(c);
  const text = readText(p);
  const n = nextQuestionNumber(text);
  const line = `- [ ] Q${n} (${slug}): ${q(question)}${assumed ? ` — 지금은 「${q(assumed)}」, 예 = 그대로` : ''}`;
  fs.writeFileSync(p, text.includes('## 정해 주세요') ? text.replace('## 정해 주세요\n', `## 정해 주세요\n${line}\n`) : text + `\n## 정해 주세요\n${line}\n`);
  if (u) { if (flags.hold) u.holds = [...(u.holds || []), n]; else u.questions.push(n); if (assumed) u.assumed = [...(u.assumed || []), { q: n, text: assumed }]; saveUnit(c.main, c.team, u); }
  for (const s of forSlugs) {
    const needs = [...new Set([...items.find((i) => i.slug === s).needs, `Q${n}`])];
    bl = setNeeds(bl, s, needs); syncUnitNeeds(c, s, needs);
  }
  if (forSlugs.length) fs.writeFileSync(backlogPath(c), bl);
  out(`Q${n} queued — ${forSlugs.length ? `needs에 연결: ${forSlugs.join(',')} (답이 올 때까지 WAIT)` : slug === 'intake' ? `needs: Q${n}으로 기대는 unit은 답이 올 때까지 WAIT` : flags.hold ? `${slug}은 답이 올 때까지 세워 둔다(다른 unit은 seed가 연다) — 답이 와도 re-spec 없음, 답의 길은 그 FAIL의 안내` : assumed ? `${slug}은 답이 올 때까지 이 질문 밖에서만 진행 — 「예」면 가정 그대로(RESPEC 없음), 다른 답이면 spec 재spawn` : `${slug}은 답이 올 때까지 이 질문 밖에서만 진행`}`);
}
// seed된 unit의 needs 사본도 맞춘다 — 팩의 결정 스코프(scopedDecisions)가 unit.needs를 읽는다
function syncUnitNeeds(c, slug, needs) {
  const u = readJson(unitFile(c.main, c.team, slug), null);
  if (u && u.state !== 'shipped' && u.state !== 'dropped') { u.needs = needs; saveUnit(c.main, c.team, u); }
}
// 사고 23(3차 실기): 번호 밀림으로 needs가 6 unit에 잘못 걸렸는데 고칠 명령이 없어 결정 전부로 우회했다 — 어긋난 선행은 conductor가 고치고 원장에 남는다
function needsCmd(c, slug, list) {
  if (c.root !== c.main) fail('FAIL needs는 메인 저장소에서만 — 선행 재배선은 conductor의 일이다, 팩이 자기 WAIT를 풀지 않는다');
  if (!slug || list === undefined) fail('사용법: work.mjs needs <slug> <a,b|Q<n>|->');
  const needs = list === '-' ? [] : [...new Set(list.split(',').map((s) => s.trim()).filter(Boolean))];
  const text = readBacklog(c);
  const items = parseBacklog(text);
  const it = items.find((i) => i.slug === slug && !i.done);
  if (!it) fail(`FAIL needs ${slug}: BACKLOG의 열린 unit이 아니다`);
  const unknownQ = unknownQuestions(needs, readText(path.join(c.main, c.team.paths.decisions)));
  if (unknownQ.length) fail(`FAIL needs ${unknownQ.join(',')}: ${NO_GUESS}`);
  const unknownU = needs.filter((n) => !/^Q\d+$/.test(n) && !items.some((i) => i.slug === n));
  if (unknownU.length) fail(`FAIL needs ${unknownU.join(',')}: BACKLOG에 없는 unit`);
  const next = setNeeds(text, slug, needs);
  const cl = closure(parseBacklog(next), [slug]);
  if (cl.cycle) fail(`FAIL needs 순환: ${cl.cycle}`);
  fs.writeFileSync(backlogPath(c), next);
  syncUnitNeeds(c, slug, needs);
  appendLedger(c.main, c.team, { kind: 'needs', slug, from: it.needs, to: needs });
  out(`NEEDS ${slug} ${it.needs.join(',') || '-'} → ${needs.join(',') || '-'}`);
}
function decide(c, n, answer) {
  if (c.root !== c.main) fail('FAIL decide는 메인 저장소에서만 — 질문의 답은 CEO 접점이다, 팩이 만들지 않는다');
  n = String(n ?? '').replace(/^[Qq]/, ''); // 사고 61(L2 5판 리눅스 1라운드): CEO의 말은 「Q1 예」라 conductor가 `decide Q1 "예"`로 FAIL ×4 — 번호는 Q를 떼고 받는다
  if (!/^\d+$/.test(n)) fail(`FAIL 번호가 아니다: ${n || '(없음)'} — work.mjs decide <n|Q<n>> "<답>"`);
  if (!answer) fail('FAIL 답이 없다: work.mjs decide <n> "<답>"');
  const p = decisionsFile(c);
  const updated = decideLine(readText(p), Number(n), answer, new Date().toISOString().slice(0, 10));
  if (!updated) fail(`FAIL Q${n} 열린 질문 없음`);
  fs.writeFileSync(p, updated);
  touchCeo(c.main);
  appendLedger(c.main, c.team, { kind: 'decide', q: Number(n), answer });
  out(`PASS decide Q${n}`);
  // 사고 17: 진행 중에 온 답은 spec이 먼저 받는다 — build·attack 팩과 ship은 spec 팩이 다시 열릴 때까지 닫힌다(re-spec 경로 재사용)
  const units = listUnits(c.main, c.team);
  for (const slug of respecTargets({ units, ledger: readLedger(c.main, c.team), n: Number(n) })) {
    const u = units.find((x) => x.slug === slug);
    const kept = keepsAssumption(u, Number(n), answer);
    if (kept) { appendLedger(c.main, c.team, { kind: 'kept', slug, q: Number(n), assumed: kept }); out(`KEPT ${slug} — Q${n} 「예」는 가정 그대로(${kept}): spec 재spawn 없음, build·attack·ship은 그대로 열려 있다`); continue; }
    u.respec = [...(u.respec || []), { q: Number(n), at: new Date().toISOString() }]; saveUnit(c.main, c.team, u);
    appendLedger(c.main, c.team, { kind: 'respec', slug, q: Number(n) });
    out(`RESPEC ${slug} — Q${n}의 답이 진행 중에 왔다: spec이 답을 red 수용 테스트로 박는다 → node .garagiste/scripts/brief.mjs spec ${slug} (build·attack·ship은 그 뒤에 열린다)`);
  }
}
// 방향전환의 원자 연산 — 작업을 버리되 잃지 않는다: wip 커밋 → 브랜치를 dropped/로 개명 → worktree 제거. BACKLOG 줄은 열려 있어 seed가 새로 연다(--forget이면 닫는다).
function drop(c, slug, reason = '', flags = {}) {
  if (c.root !== c.main) fail('FAIL drop은 메인에서만 — 방향전환은 conductor의 일이다');
  const u = readJson(unitFile(c.main, c.team, slug), null);
  if (!u) { // 사고 50: unit 없는 BACKLOG 줄 — drop이 loadUnit의 예외(스택)로 죽었다
    const item = parseBacklog(readBacklog(c)).find((i) => i.slug === slug && !i.done);
    if (!item) fail(`FAIL unit도 BACKLOG 줄도 없음: ${slug}`);
    if (flags.forget === undefined) fail(`FAIL ${slug}은 unit이 없는 BACKLOG 줄이다 — 닫으려면 --forget: work.mjs drop ${slug} "<사유>" --forget · 고치려면 work.mjs add ${slug} "<원문>" [--milestone …] --replace`);
    const p = backlogPath(c); fs.writeFileSync(p, readText(p).replace(new RegExp(`^- \\[ \\] ${slug} `, 'm'), `- [x] ${slug} `));
    appendLedger(c.main, c.team, { kind: 'drop', slug, reason, backlog_only: true, forget: true });
    return out(`DROPPED ${slug}${reason ? ` — ${reason}` : ''} · BACKLOG 줄 닫음(unit은 없었다)`);
  }
  if (u.state === 'shipped') fail(`FAIL ${slug}은 이미 출하 — 되돌리기는 새 unit이다`);
  if (u.state === 'dropped') fail(`FAIL ${slug}은 이미 dropped`);
  const wt = worktreeDir(c.main, c.team, slug);
  if (fs.existsSync(wt)) {
    if (git(['status', '--porcelain'], wt).stdout.trim()) { git(['add', '-A'], wt); git(['commit', '-q', '-m', `wip: ${slug} drop checkpoint`], wt, { GARAGISTE_WIP: '1' }); }
    git(['worktree', 'remove', '--force', wt], c.main);
  }
  const graveyard = `dropped/${slug}-${stamp()}`;
  if (!git(['rev-parse', '--verify', '-q', u.branch], c.main).status) git(['branch', '-m', u.branch, graveyard], c.main);
  u.state = 'dropped'; u.dropped = { at: new Date().toISOString(), reason, branch: graveyard }; saveUnit(c.main, c.team, u);
  if (flags.forget !== undefined) { const p = backlogPath(c); if (fs.existsSync(p)) fs.writeFileSync(p, readText(p).replace(new RegExp(`^- \\[ \\] ${slug} `, 'm'), `- [x] ${slug} `)); }
  appendLedger(c.main, c.team, { kind: 'drop', slug, reason, branch: graveyard, forget: flags.forget !== undefined });
  out(`DROPPED ${slug}${reason ? ` — ${reason}` : ''} · 작업은 ${graveyard}에 남았다${flags.forget !== undefined ? ' · BACKLOG 줄 닫음' : ' · BACKLOG 줄은 열려 있어 seed가 새로 연다'}`);
}
function setDefault(c, slug, text) {
  if (!text) fail('FAIL 내용이 없다');
  const u = loadUnit(c.main, c.team, slug);
  u.defaults.push({ text, at: new Date().toISOString() }); saveUnit(c.main, c.team, u);
  out(`DEFAULT ${slug}: ${text} — CEO가 한 마디로 뒤집는다`);
}
function tried(c, slug, result, note = '') {
  if (c.root !== c.main) fail('FAIL tried는 메인 저장소에서만 — 팩이 자기 unit을 검수하지 않는다(CEO 접점)');
  if (!['ok', 'fail'].includes(result)) fail('사용법: work.mjs tried <slug> ok|fail ["메모"]');
  const u = loadUnit(c.main, c.team, slug);
  if (u.state !== 'shipped') fail(`FAIL ${slug} 아직 출하 전(${u.state})`);
  // 사고 45(필드 벤치 넷): 말 없는 fail은 -fix의 원문을 「써봤는데 실패」로 비워 spec이 재현을 CEO에게 되물었다
  if (result === 'fail' && !note.trim()) fail(`FAIL tried ${slug} fail에는 CEO의 말이 있어야 한다 — 무엇이 달랐는지 그대로: node .garagiste/scripts/work.mjs tried ${slug} fail "<CEO 말 그대로>" (그 줄이 ${slug}-fix의 원문·재현이다)`);
  u.tried = { result, note, at: new Date().toISOString() }; saveUnit(c.main, c.team, u);
  touchCeo(c.main);
  appendLedger(c.main, c.team, { kind: 'tried', slug, result, note });
  const gone = removeTry(c, slug) ? ' · try 사본을 지웠다' : '';
  if (result !== 'fail') return out(`PASS tried ${slug} ${result}${gone}`);
  const fix = `${slug}-fix`;
  appendBacklog(c, backlogLine({ slug: fix, milestone: u.milestone, origin: note, accept: '-' }));
  // 사고 46: scope는 slug 목록이라 -fix가 범위 밖에 남았다 — CEO의 fail이 곧 「고쳐라」, 새 기능보다 먼저
  const sc = readJson(scopePath(c), null);
  if (sc) {
    writeJson(scopePath(c), { ...sc, requested: [fix, ...sc.requested.filter((s) => s !== fix)], order: [fix, ...sc.order.filter((s) => s !== fix)] });
    appendLedger(c.main, c.team, { kind: 'scope_fix', slug: fix, from: slug });
  }
  out(`PASS tried ${slug} fail · ${fix}${sc ? '이 범위 맨 앞에 — 다음 seed가 연다' : ' BACKLOG에 — 범위는 work.mjs scope'}${gone}`);
}
// try 사본(L2 1일차 eoren.sqlite · 필드 벤치 웹 data/memos.json ×3): CEO가 메인 루트에서 친 try의 산출물이 main을 더럽혀 다음 ship이 「CEO가 치운다」로 막혔다.
// 남은 파일을 찾아 지우면 CEO의 의도된 파일을 지울 수 있고 카드 작성 규칙은 제품마다 다르다 — 처음부터 main에 닿지 않게: main 현재 커밋을 버릴 checkout으로 열고 tried가 지운다.
// 한계: 저장소 밖 부작용(홈·네트워크)은 범위 밖.
const tryDir = (c, slug) => path.join(c.main, '.worktrees', `try-${slug}`);
function removeTry(c, slug) {
  const dir = tryDir(c, slug);
  if (!fs.existsSync(dir)) return false;
  unlinkDeps(c.main, dir);
  if (git(['worktree', 'remove', '--force', dir], c.main).status) { fs.rmSync(dir, { recursive: true, force: true }); git(['worktree', 'prune'], c.main); }
  return true;
}
function tryCopy(c, slug) {
  if (c.root !== c.main) fail('FAIL try는 메인 저장소에서만 — 써보는 것은 CEO의 일이다(팩은 자기 unit을 검수하지 않는다)');
  const u = readJson(unitFile(c.main, c.team, slug), null);
  if (!u) fail(`FAIL unit 없음: ${slug}`);
  if (u.state !== 'shipped') fail(`FAIL ${slug} 아직 출하 전(${u.state}) — try는 출하된 unit을 main 위에서 쓴다`);
  if (readJson(unitFile(c.main, c.team, `try-${slug}`), null)) fail(`FAIL .worktrees/try-${slug}는 unit try-${slug}의 자리다`);
  removeTry(c, slug); // 다시 열면 새 사본 — main이 움직였을 수 있다
  const dir = tryDir(c, slug);
  const r = git(['worktree', 'add', '--detach', '-q', dir, c.team.protected_branch], c.main);
  if (r.status) fail(`FAIL try 사본 생성 실패 — ${(r.stderr || '').trim()}`);
  linkDeps(c.main, dir);
  const head = git(['rev-parse', '--short', 'HEAD'], dir).stdout.trim();
  appendLedger(c.main, c.team, { kind: 'try', slug, head }); // CEO-분 카드 시간의 시작점(try → tried) — L1 1차부터 비어 있던 칸을 기계가 센다(L2-TRIAL-5 「CEO-분」, 측정 빈틈)
  out(`TRY ${slug} → .worktrees/try-${slug} (main ${head}) — 카드(${c.team.paths.units_docs}/${slug}/try.md)는 이 폴더에서 친다: 만든 파일은 사본에 남고 main은 깨끗하다 · 끝나면 메인에서 node .garagiste/scripts/work.mjs tried ${slug} ok|fail "<말>" (사본은 tried가 지운다)`);
}
// boot 팩의 쓰기 경로: team.json commands는 스크립트만 쓴다 — 그리고 boot(scaffold) 컨텍스트만. 다른 팩이 검증 명령을 바꾸는 것은 초록 조작이다.
function commands(c, args) {
  const teamPath = path.join(c.root, '.garagiste', 'team.json');
  const t = readJson(teamPath, null);
  if (!args.length) return out(`COMMANDS ${Object.entries(t.commands).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ')}`);
  if (!process.env.GARAGISTE_ADMIN) {
    const rel = path.relative(c.main, c.root).replace(/\\/g, '/');
    const wtPrefix = c.team.paths.worktrees.replace(/^\.?\//, '') + '/';
    const slug = rel.startsWith(wtPrefix) ? rel.slice(wtPrefix.length).split('/')[0] : null;
    const u = slug ? readJson(unitFile(c.main, c.team, slug), null) : null;
    if (!u || u.kind !== 'scaffold') fail('FAIL commands는 boot(scaffold) unit의 worktree 또는 GARAGISTE_ADMIN=1(CEO)에서만 — 검증 명령의 변경은 CEO 결정이다');
  }
  for (const a of args) {
    const m = /^(quick|full|test_file|run|setup)=([\s\S]*)$/.exec(a); // setup: 의존성 설치(사고 21 — ship이 의존성 출하의 머지 직후 main에서 돌린다)
    if (!m) fail(`사용법: work.mjs commands quick="…" full="…" test_file="… {file}" run="…" setup="…" — 받은 값: ${a}`);
    if (m[1] === 'test_file' && !hasFileSlot(m[2])) fail('FAIL test_file에는 {file}(파일 하나) 또는 {files}(여러 파일을 한 번에) 자리표시자가 있어야 한다');
    t.commands[m[1]] = m[2];
  }
  writeJson(teamPath, t);
  appendLedger(c.main, c.team, { kind: 'commands', commands: t.commands, where: path.relative(c.main, c.root).replace(/\\/g, '/') || '.' });
  // 사고 34(필드 시험 2): 메인 루트의 CEO 변경은 boot의 커밋이 없다 — models처럼 스스로 커밋하고(ship이 main dirt로 막히지 않게), 바뀐 설치 명령은 main에서 한 번 돌린다(다음 worktree가 그 의존성을 잇는다)
  let tail = '';
  if (c.root === c.main) {
    const cm = git(['commit', '-q', '-m', `scaffold(team): commands ${args.map((a) => a.split('=')[0]).join(' ')}`, '--', '.garagiste/team.json'], c.main, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' });
    if (!cm.status) tail += ' · scaffold(team) 커밋';
    if (args.some((a) => a.startsWith('setup=')) && t.commands.setup) tail += ` · setup을 main에서 돌렸다 exit=${shell(t.commands.setup, { cwd: c.main }).status}`;
  }
  out(`COMMANDS ${Object.entries(t.commands).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ')}${tail}`);
}
// 규칙 파일의 {{…}} 자리 — boot 팩이 채운다(CLAUDE.md 또는 AGENTS.md)
function rules(c, args) {
  const file = ['CLAUDE.md', 'AGENTS.md'].map((f) => path.join(c.root, f)).find((f) => fs.existsSync(f));
  if (!file) fail('FAIL 규칙 파일 없음(CLAUDE.md·AGENTS.md)');
  let text = readText(file);
  const t = readJson(path.join(c.root, '.garagiste', 'team.json'), { commands: {} });
  const vals = { QUICK: t.commands.quick, FULL: t.commands.full, TEST_FILE: t.commands.test_file, RUN: t.commands.run };
  for (const a of args) { const m = /^(project|one_line)=([\s\S]*)$/.exec(a); if (!m) fail(`사용법: work.mjs rules project="<이름>" one_line="<한 줄>"`); vals[m[1].toUpperCase()] = m[2]; }
  const left = [];
  text = text.replace(/\{\{([A-Z_]+)\}\}/g, (all, k) => (vals[k] ? vals[k] : (left.push(k), all)));
  fs.writeFileSync(file, text);
  out(`RULES ${path.basename(file)}${left.length ? ` 남은 자리: ${[...new Set(left)].join(', ')}` : ' 자리 전부 채움'}`);
}
function models(c, args) {
  const teamPath = path.join(c.main, '.garagiste', 'team.json');
  const t = readJson(teamPath, null);
  if (!args.length) return out(`MODELS ${Object.entries(t.models).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  let next; try { next = resolveModels(t.models, args); } catch (e) { fail(`FAIL models: ${e.message}`); }
  t.models = next; writeJson(teamPath, t);
  const touched = [];
  for (const [pack, model] of Object.entries(next)) {
    for (const f of [path.join(c.main, '.claude', 'agents', `${pack}.md`), path.join(c.main, '.opencode', 'agents', `${pack}.md`)]) {
      if (!fs.existsSync(f)) continue;
      fs.writeFileSync(f, setFrontmatterModel(readText(f), model)); touched.push(path.relative(c.main, f).replace(/\\/g, '/'));
    }
  }
  appendLedger(c.main, c.team, { kind: 'models', models: next });
  // 규칙집 변경엔 커밋 경로가 있어야 한다 — 2차 실기 사고 6: models가 main을 더럽혀 ship이 막혔고 conductor에겐 커밋 수단이 없다.
  // 내부 SHIP·WIP는 drop의 wip 커밋과 같은 승인된 차선(기계적 재생성 — 원장 PASS 불요). pathspec 커밋이라 다른 변경은 쓸려 들어가지 않는다.
  const files = ['.garagiste/team.json', ...touched];
  let committed = false;
  if (git(['status', '--porcelain', '--', ...files], c.main).stdout.trim()) {
    git(['add', '--', ...files], c.main);
    const cm = git(['commit', '-q', '-m', `scaffold(team): models ${args.join(' ')}`, '--', ...files], c.main, { GARAGISTE_SHIP: '1', GARAGISTE_WIP: '1' });
    if (cm.status) fail(`FAIL models 커밋: ${(cm.stderr || cm.stdout).split('\n')[0]}`);
    committed = true;
  }
  out(`MODELS ${Object.entries(next).map(([k, v]) => `${k}=${v}`).join(' ')} → ${touched.length} 에이전트 파일 갱신${committed ? ' · scaffold(team) 커밋' : ''}`);
}
function spawned(c, slug, pack, flags) {
  // 사고 52(홀드아웃 · 486fd74 필드 1): conductor가 <팩>에 팩 파일 경로를 넣고 같은 사용법을 두 번 받고 포기했다 — 받은 값을 말하고 고친 명령을 준다
  if (slug && /[/\\]|\.md$/.test(pack || '')) {
    const name = (new RegExp(`(?:^|-)(${PACKS.join('|')})-\\d{4}-`).exec(path.basename(pack)) || [])[1] || '<팩 이름>';
    const rest = Object.entries(flags).map(([k, v]) => `--${k} ${/\s/.test(v) ? JSON.stringify(v) : v}`).join(' ');
    fail(`FAIL <팩>은 팩 이름(${PACKS.join('·')})이다 — 받은 값은 경로: ${pack} → node .garagiste/scripts/work.mjs spawned ${slug} ${name}${rest ? ` ${rest}` : ''}`);
  }
  if (!slug || !PACKS.includes(pack || '')) fail(`사용법: work.mjs spawned <slug|intake> <팩 이름: ${PACKS.join('|')}> [--tokens N] [--minutes M] [--model m] [--note "…"]`);
  const e = appendLedger(c.main, c.team, { kind: 'spawn', slug, pack, model: flags.model || c.team.models[pack], tokens: flags.tokens ? Number(flags.tokens) : null, minutes: flags.minutes ? Number(flags.minutes) : null, note: flags.note || '' });
  out(`SPAWN ${slug} ${pack} ${e.model}${e.tokens ? ` ${e.tokens} tok` : ''}${e.minutes ? ` ${e.minutes} min` : ''}`);
}
// 필드 시험(두 프로젝트 공통): intake 직후 list가 「unit 없음」이었다 — Flow 2는 intake 뒤 list를 보라 하는데 seed 전 BACKLOG 줄이 안 보였다.
// seed된 unit 다음에, 열린 unit이 없는 BACKLOG 열린 줄을 backlog로 덧붙인다(dropped의 열린 줄은 다시 열릴 backlog다).
// 사고 37(필드 시험 2): 값 없는 플래그가 맨 끝이면 「다음 인자」가 없어 undefined가 됐다 — `drop persist "<사유>" --forget`의 forget이 꺼져 BACKLOG 줄이 열린 채 남았다
const BOOL_FLAGS = new Set(['forget', 'replace', 'hold']);
// 사고 49(홀드아웃 — Go CLI): 원문·질문은 무엇으로든 시작한다 — `--min-size 1M처럼…`이 플래그로 먹혀 원문이 「M1」, 마일스톤이 M?가 됐다.
// 명령마다 아는 플래그만 플래그, 한 낱말 플래그 꼴(--milestne)은 오타라 FAIL로(원문은 문장이다), 나머지는 원문.
export const FLAGS = { add: ['milestone', 'needs', 'accept', 'kind', 'replace'], new: ['milestone', 'needs', 'accept', 'kind', 'from'], ask: ['for', 'hold', 'assumed'], drop: ['forget'], spawned: ['tokens', 'minutes', 'model', 'note'] };
export function parseArgs(raw, cmd) {
  const flags = {}; const pos = []; const unknown = [];
  const known = FLAGS[cmd] || [];
  for (let i = 0; i < raw.length; i++) {
    const k = raw[i].startsWith('--') ? raw[i].slice(2) : null;
    if (k !== null && known.includes(k)) flags[k] = BOOL_FLAGS.has(k) ? true : raw[++i];
    else if (FLAGS[cmd] && /^--[a-z][a-z-]*$/.test(raw[i])) unknown.push(raw[i]);
    else pos.push(raw[i]);
  }
  return { flags, pos, unknown };
}
export function listLines({ units, items }) {
  const live = new Set(units.filter((u) => u.state !== 'dropped').map((u) => u.slug));
  const lines = units.map((u) => `${u.slug.padEnd(24)} ${u.state.padEnd(8)} ${(u.milestone || 'M?').padEnd(4)} tried=${u.tried ? u.tried.result : '-'}${u.boundary?.hit ? ' HIT' : ''}`);
  for (const i of items) if (!i.done && !live.has(i.slug)) lines.push(`${i.slug.padEnd(24)} ${'backlog'.padEnd(8)} ${(i.milestone || 'M?').padEnd(4)} needs=${i.needs.join(',') || '-'}`);
  return lines.length ? lines : ['unit 없음 · BACKLOG 없음 — work.mjs brief 뒤 intake'];
}
function list(c) {
  for (const l of listLines({ units: listUnits(c.main, c.team), items: parseBacklog(readBacklog(c)) })) out(l);
}
function main() {
  const [cmd, ...raw] = process.argv.slice(2);
  const c = ctx();
  // 사고 51: conductor의 탐침 `brief --help`가 「--help」를 CEO 원문에 쌓았다 — --help는 어느 명령이든 부작용 없이 사용법
  if (raw.includes('--help') || raw.includes('-h')) return out(USAGE);
  const { flags, pos, unknown } = parseArgs(raw, cmd);
  if (unknown.length) fail(`FAIL 알 수 없는 플래그 ${unknown.join(' ')} — ${cmd}가 받는 것: ${FLAGS[cmd].map((f) => `--${f}`).join(' ')} (원문·질문이면 따옴표로 묶은 문장 그대로)`);
  if (cmd === 'brief') return brief(c, raw);
  if (cmd === 'add') return add(c, pos[0], pos[1], flags);
  if (cmd === 'scope') return scope(c, raw);
  if (cmd === 'seed') return seed(c);
  if (cmd === 'system') return system(c);
  if (cmd === 'new') return createUnit(c, pos[0], pos[1], flags);
  if (cmd === 'ask') return ask(c, pos[0], pos[1], flags);
  if (cmd === 'needs') return needsCmd(c, pos[0], pos[1]);
  if (cmd === 'decide') return decide(c, pos[0], pos[1]);
  if (cmd === 'default') return setDefault(c, pos[0], pos[1]);
  if (cmd === 'drop') return drop(c, pos[0], pos[1], flags);
  if (cmd === 'tried') return tried(c, pos[0], pos[1], pos[2]);
  if (cmd === 'try') return tryCopy(c, pos[0]);
  if (cmd === 'list') return list(c);
  if (cmd === 'models') return models(c, raw);
  if (cmd === 'commands') return commands(c, raw);
  if (cmd === 'rules') return rules(c, raw);
  if (cmd === 'spawned') return spawned(c, pos[0], pos[1], flags);
  fail(USAGE);
}
const USAGE = '사용법: work.mjs brief "<원문>"|--file <경로> · add <slug> "<원문>" [--milestone M1] [--needs a,b] [--accept "<한 줄>"] [--kind scaffold] [--replace] · scope <slug…>|--milestone M1|--range a..b [--no-needs] · seed · system · new <slug> "<원문>" · ask <slug|intake> "<질문>" [--for a,b] [--hold] [--assumed "<지금 주장이 가정한 것>"] · needs <slug> <a,b|Q<n>|-> · decide <n> "<답>" · default <slug> "<정한 것>" · drop <slug> ["사유"] [--forget] · try <slug> · tried <slug> ok|fail ["<말>"] · list · models [<tier>|<팩>=<모델>…] · commands quick=… full=… test_file=… run=… · rules project=… one_line=… · spawned <slug|intake> <팩 이름> [--tokens N --minutes M]';
if (isMain(import.meta.url)) main();
