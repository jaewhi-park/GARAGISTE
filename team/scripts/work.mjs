// work — unit의 생애와 입구: brief(구상 원문 축적) · add(BACKLOG unit 줄) · scope(범위 + 선행 닫힘) · seed(다음 unit 자동) · new · ask/decide · default · tried · list
import fs from 'node:fs';
import path from 'node:path';
import { checkBoundary } from './boundary.mjs';
import { blocking, diagnose } from './doctor.mjs';
import { appendLedger, ctx, fail, git, isMain, linkDeps, listUnits, loadUnit, out, readJson, readText, saveUnit, stamp, touchCeo, unitFile, worktreeDir, writeJson } from './lib.mjs';

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
export function nextQuestionNumber(text) {
  const nums = [...text.matchAll(/^- \[[ x]\] Q(\d+)/gm)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) + 1 : 1;
}
export function decideLine(text, n, answer, date) {
  const re = new RegExp(`^- \\[ \\] Q${n}\\b(.*)$`, 'm');
  if (!re.test(text)) return null;
  return text.replace(re, (_, rest) => `- [x] Q${n}${rest} → ${answer} (${date})`);
}

const backlogPath = (c) => path.join(c.main, c.team.paths.backlog);
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
  if (parseBacklog(readBacklog(c)).some((i) => i.slug === slug)) fail(`FAIL BACKLOG에 있음: ${slug}`);
  const needs = (flags.needs || '-') === '-' ? [] : flags.needs.split(',').map((s) => s.trim()).filter(Boolean);
  appendBacklog(c, backlogLine({ slug, milestone: flags.milestone || 'M?', needs, origin, accept: flags.accept || '-', kind: flags.kind }));
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
  fs.writeFileSync(path.join(wt, '.garagiste-pack'), kind === 'scaffold' ? 'boot' : boundary.hit ? 'spike' : 'spec');
  const unit = {
    slug, kind, origin, origin_kind: from, milestone: opts.milestone || 'M?', needs: opts.needs || [], accept: opts.accept || '-',
    created: new Date().toISOString(), state: kind === 'scaffold' ? 'boot' : boundary.hit ? 'spike' : 'spec', branch, worktree: path.relative(c.main, wt).replace(/\\/g, '/'), boundary, // 저장 경로는 /로 — listFiles와 같은 법(사고 18)
    defaults: [], questions: [], tried: null, shipped: null, sensor: null,
  };
  saveUnit(c.main, c.team, unit);
  if (!parseBacklog(readBacklog(c)).some((i) => i.slug === slug)) appendBacklog(c, backlogLine({ slug, origin, kind }));
  // unit 생성은 CEO 접점이 아니다 — 접점은 brief·scope·decide·tried뿐. 여기서 touchCeo하면 매 seed가 무인 출하 상한을 리셋한다.
  appendLedger(c.main, c.team, { kind: 'unit', slug, state: unit.state, origin_kind: unit.origin_kind, milestone: unit.milestone });
  out(`UNIT ${slug} ${unit.state} ${unit.worktree}`);
  if (kind === 'scaffold') out('SCAFFOLD — boot 팩 하나로 끝난다(스택·명령·스모크·규칙 파일), spec·attack 없음');
  else if (boundary.hit) out(`HIT ${boundary.reasons.join(', ')} — spike 팩부터`);
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
  const r = pickReady({ order: sc.order, items, units: listUnits(c.main, c.team), decisionsText: readText(path.join(c.main, c.team.paths.decisions)) });
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
function ask(c, slug, question) {
  if (!question) fail('FAIL 질문이 없다');
  const u = slug === 'intake' ? null : loadUnit(c.main, c.team, slug);
  const p = decisionsFile(c);
  const text = readText(p);
  const n = nextQuestionNumber(text);
  const line = `- [ ] Q${n} (${slug}): ${q(question)}`;
  fs.writeFileSync(p, text.includes('## 정해 주세요') ? text.replace('## 정해 주세요\n', `## 정해 주세요\n${line}\n`) : text + `\n## 정해 주세요\n${line}\n`);
  if (u) { u.questions.push(n); saveUnit(c.main, c.team, u); }
  out(`Q${n} queued — ${slug === 'intake' ? `needs: Q${n}으로 기대는 unit은 답이 올 때까지 WAIT` : `${slug}은 답이 올 때까지 이 질문 밖에서만 진행`}`);
}
function decide(c, n, answer) {
  if (c.root !== c.main) fail('FAIL decide는 메인 저장소에서만 — 질문의 답은 CEO 접점이다, 팩이 만들지 않는다');
  if (!answer) fail('FAIL 답이 없다: work.mjs decide <n> "<답>"');
  const p = decisionsFile(c);
  const updated = decideLine(readText(p), Number(n), answer, new Date().toISOString().slice(0, 10));
  if (!updated) fail(`FAIL Q${n} 열린 질문 없음`);
  fs.writeFileSync(p, updated);
  touchCeo(c.main);
  appendLedger(c.main, c.team, { kind: 'decide', q: Number(n), answer });
  out(`PASS decide Q${n}`);
}
// 방향전환의 원자 연산 — 작업을 버리되 잃지 않는다: wip 커밋 → 브랜치를 dropped/로 개명 → worktree 제거. BACKLOG 줄은 열려 있어 seed가 새로 연다(--forget이면 닫는다).
function drop(c, slug, reason = '', flags = {}) {
  if (c.root !== c.main) fail('FAIL drop은 메인에서만 — 방향전환은 conductor의 일이다');
  const u = loadUnit(c.main, c.team, slug);
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
  u.tried = { result, note, at: new Date().toISOString() }; saveUnit(c.main, c.team, u);
  touchCeo(c.main);
  appendLedger(c.main, c.team, { kind: 'tried', slug, result, note });
  if (result === 'fail') appendBacklog(c, backlogLine({ slug: `${slug}-fix`, milestone: u.milestone, origin: note || '써봤는데 실패 — 스펙 정정', accept: '-' }));
  out(`PASS tried ${slug} ${result}`);
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
    const m = /^(quick|full|test_file|run)=([\s\S]*)$/.exec(a);
    if (!m) fail(`사용법: work.mjs commands quick="…" full="…" test_file="… {file}" run="…" — 받은 값: ${a}`);
    if (m[1] === 'test_file' && !m[2].includes('{file}')) fail('FAIL test_file에는 {file} 자리표시자가 있어야 한다');
    t.commands[m[1]] = m[2];
  }
  writeJson(teamPath, t);
  appendLedger(c.main, c.team, { kind: 'commands', commands: t.commands, where: path.relative(c.main, c.root).replace(/\\/g, '/') || '.' });
  out(`COMMANDS ${Object.entries(t.commands).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ')}`);
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
  if (!slug || !PACKS.includes(pack || '')) fail('사용법: work.mjs spawned <slug|intake> <팩> [--tokens N] [--minutes M] [--model m] [--note "…"]');
  const e = appendLedger(c.main, c.team, { kind: 'spawn', slug, pack, model: flags.model || c.team.models[pack], tokens: flags.tokens ? Number(flags.tokens) : null, minutes: flags.minutes ? Number(flags.minutes) : null, note: flags.note || '' });
  out(`SPAWN ${slug} ${pack} ${e.model}${e.tokens ? ` ${e.tokens} tok` : ''}${e.minutes ? ` ${e.minutes} min` : ''}`);
}
function list(c) {
  const units = listUnits(c.main, c.team);
  if (!units.length) return out('unit 없음');
  for (const u of units) out(`${u.slug.padEnd(24)} ${u.state.padEnd(8)} ${(u.milestone || 'M?').padEnd(4)} tried=${u.tried ? u.tried.result : '-'} ${u.boundary.hit ? 'HIT' : ''}`);
}
function main() {
  const [cmd, ...raw] = process.argv.slice(2);
  const c = ctx();
  const flags = {}; const pos = [];
  for (let i = 0; i < raw.length; i++) { if (raw[i].startsWith('--') && !['brief', 'scope', 'models', 'commands', 'rules'].includes(cmd)) flags[raw[i].slice(2)] = raw[++i]; else pos.push(raw[i]); }
  if (cmd === 'brief') return brief(c, raw);
  if (cmd === 'add') return add(c, pos[0], pos[1], flags);
  if (cmd === 'scope') return scope(c, raw);
  if (cmd === 'seed') return seed(c);
  if (cmd === 'new') return createUnit(c, pos[0], pos[1], flags);
  if (cmd === 'ask') return ask(c, pos[0], pos[1]);
  if (cmd === 'decide') return decide(c, pos[0], pos[1]);
  if (cmd === 'default') return setDefault(c, pos[0], pos[1]);
  if (cmd === 'drop') return drop(c, pos[0], pos[1], flags);
  if (cmd === 'tried') return tried(c, pos[0], pos[1], pos[2]);
  if (cmd === 'list') return list(c);
  if (cmd === 'models') return models(c, raw);
  if (cmd === 'commands') return commands(c, raw);
  if (cmd === 'rules') return rules(c, raw);
  if (cmd === 'spawned') return spawned(c, pos[0], pos[1], flags);
  fail('사용법: work.mjs brief "<원문>"|--file <경로> · add <slug> "<원문>" [--milestone M1] [--needs a,b] [--accept "<한 줄>"] [--kind scaffold] · scope <slug…>|--milestone M1|--range a..b [--no-needs] · seed · new <slug> "<원문>" · ask <slug|intake> "<질문>" · decide <n> "<답>" · default <slug> "<정한 것>" · drop <slug> ["사유"] [--forget] · tried <slug> ok|fail · list · models [<tier>|<팩>=<모델>…] · commands quick=… full=… test_file=… run=… · rules project=… one_line=… · spawned <slug> <팩> [--tokens N --minutes M]');
}
if (isMain(import.meta.url)) main();
