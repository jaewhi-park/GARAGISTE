// work — unit의 생애: new(CEO 한 마디 → 브랜치·worktree·상태) · ask/decide(hard 결정 큐) · default(팀이 정한 것) · tried(써봤다) · list
import fs from 'node:fs';
import path from 'node:path';
import { checkBoundary } from './boundary.mjs';
import { ctx, fail, git, isMain, linkDeps, listUnits, loadUnit, out, readText, saveUnit, touchCeo, unitFile, worktreeDir, appendLedger } from './lib.mjs';

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;
export const DECISIONS_TEMPLATE = '# DECISIONS\n\n## 정해 주세요\n\n## 정한 것\n';
export function nextQuestionNumber(text) {
  const nums = [...text.matchAll(/^- \[[ x]\] Q(\d+)/gm)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) + 1 : 1;
}
export function decideLine(text, n, answer, date) {
  const re = new RegExp(`^- \\[ \\] Q${n}\\b(.*)$`, 'm');
  if (!re.test(text)) return null;
  return text.replace(re, (_, rest) => `- [x] Q${n}${rest} → ${answer} (${date})`);
}
function newUnit(c, slug, origin, opts) {
  if (!SLUG_RE.test(slug || '')) fail('FAIL slug: 소문자·숫자·하이픈 2~41자');
  if (!origin) fail('FAIL 원문이 없다: work.mjs new <slug> "<CEO 말 그대로>"');
  if (fs.existsSync(unitFile(c.main, c.team, slug))) fail(`FAIL unit 있음: ${slug}`);
  const wt = worktreeDir(c.main, c.team, slug);
  const branch = `unit/${slug}`;
  const add = git(['worktree', 'add', '-q', '-b', branch, wt, c.team.protected_branch], c.main);
  if (add.status) fail(`FAIL worktree: ${add.stderr}`);
  linkDeps(c.main, wt);
  const boundary = checkBoundary(c.team, { text: origin });
  fs.writeFileSync(path.join(wt, '.claude-pack'), boundary.hit ? 'spike' : 'spec');
  const unit = {
    slug, kind: opts.kind || 'feature', origin, origin_kind: opts.from || 'ceo', created: new Date().toISOString(),
    state: boundary.hit ? 'spike' : 'spec', branch, worktree: path.relative(c.main, wt), boundary,
    defaults: [], questions: [], tried: null, shipped: null, sensor: null,
  };
  saveUnit(c.main, c.team, unit);
  const backlog = path.join(c.main, c.team.paths.backlog);
  fs.mkdirSync(path.dirname(backlog), { recursive: true });
  if (!fs.existsSync(backlog)) fs.writeFileSync(backlog, '# BACKLOG — CEO의 말 그대로. 팀은 여기서 unit을 뜬다.\n\n');
  fs.appendFileSync(backlog, `- [ ] ${slug} — "${origin.replace(/\n/g, ' ')}" (${unit.created.slice(0, 10)})\n`);
  if (unit.origin_kind === 'ceo') touchCeo(c.main);
  appendLedger(c.main, c.team, { kind: 'unit', slug, state: unit.state, origin_kind: unit.origin_kind });
  out(`UNIT ${slug} ${unit.state} ${unit.worktree}`);
  if (boundary.hit) out(`HIT ${boundary.reasons.join(', ')} — spike 팩부터`);
}
function decisionsFile(c) {
  const p = path.join(c.main, c.team.paths.decisions);
  if (!fs.existsSync(p)) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, DECISIONS_TEMPLATE); }
  return p;
}
function ask(c, slug, question) {
  if (!question) fail('FAIL 질문이 없다');
  const u = loadUnit(c.main, c.team, slug);
  const p = decisionsFile(c);
  const text = readText(p);
  const n = nextQuestionNumber(text);
  const line = `- [ ] Q${n} (${slug}): ${question.replace(/\n/g, ' ')}`;
  const updated = text.includes('## 정해 주세요') ? text.replace('## 정해 주세요\n', `## 정해 주세요\n${line}\n`) : text + `\n## 정해 주세요\n${line}\n`;
  fs.writeFileSync(p, updated);
  u.questions.push(n); saveUnit(c.main, c.team, u);
  out(`Q${n} queued — ${slug} 은 답이 올 때까지 이 질문 밖에서만 진행`);
}
function decide(c, n, answer) {
  if (!answer) fail('FAIL 답이 없다: work.mjs decide <n> "<답>"');
  const p = decisionsFile(c);
  const updated = decideLine(readText(p), Number(n), answer, new Date().toISOString().slice(0, 10));
  if (!updated) fail(`FAIL Q${n} 열린 질문 없음`);
  fs.writeFileSync(p, updated);
  touchCeo(c.main);
  appendLedger(c.main, c.team, { kind: 'decide', q: Number(n), answer });
  out(`PASS decide Q${n}`);
}
function setDefault(c, slug, text) {
  if (!text) fail('FAIL 내용이 없다');
  const u = loadUnit(c.main, c.team, slug);
  u.defaults.push({ text, at: new Date().toISOString() }); saveUnit(c.main, c.team, u);
  out(`DEFAULT ${slug}: ${text} — CEO가 한 마디로 뒤집는다`);
}
function tried(c, slug, result, note = '') {
  if (!['ok', 'fail'].includes(result)) fail('사용법: work.mjs tried <slug> ok|fail ["메모"]');
  const u = loadUnit(c.main, c.team, slug);
  if (u.state !== 'shipped') fail(`FAIL ${slug} 아직 출하 전(${u.state})`);
  u.tried = { result, note, at: new Date().toISOString() }; saveUnit(c.main, c.team, u);
  touchCeo(c.main);
  appendLedger(c.main, c.team, { kind: 'tried', slug, result, note });
  if (result === 'fail') fs.appendFileSync(path.join(c.main, c.team.paths.backlog), `- [ ] ${slug}-fix — "${note || '써봤는데 실패'}" (tried fail, 스펙 정정)\n`);
  out(`PASS tried ${slug} ${result}`);
}
function list(c) {
  const units = listUnits(c.main, c.team);
  if (!units.length) return out('unit 없음');
  for (const u of units) out(`${u.slug.padEnd(24)} ${u.state.padEnd(8)} ${u.kind.padEnd(12)} tried=${u.tried ? u.tried.result : '-'} ${u.boundary.hit ? 'HIT' : ''}`);
}
function main() {
  const [cmd, a, b, ...rest] = process.argv.slice(2);
  const c = ctx();
  const flags = {}; const positional = [];
  for (let i = 0; i < rest.length + 2; i++) { const x = [a, b, ...rest][i]; if (x === undefined) continue; if (x.startsWith('--')) flags[x.slice(2)] = [a, b, ...rest][++i]; else positional.push(x); }
  if (cmd === 'new') return newUnit(c, positional[0], positional[1], flags);
  if (cmd === 'ask') return ask(c, positional[0], positional[1]);
  if (cmd === 'decide') return decide(c, positional[0], positional[1]);
  if (cmd === 'default') return setDefault(c, positional[0], positional[1]);
  if (cmd === 'tried') return tried(c, positional[0], positional[1], positional[2]);
  if (cmd === 'list') return list(c);
  fail('사용법: work.mjs new <slug> "<원문>" [--kind feature|bug|boundary|architecture] [--from ceo|team] | ask <slug> "<질문>" | decide <n> "<답>" | default <slug> "<정한 것>" | tried <slug> ok|fail ["메모"] | list');
}
if (isMain(import.meta.url)) main();
