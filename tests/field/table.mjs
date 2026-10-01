// table.mjs <프로젝트 폴더> — 필드 원장 → unit 표 + 벤치 요약 한 줄(정비 채널이 conductor와 독립으로 산출한다)
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const L = fs.readFileSync(path.join(dir, '.garagiste/ledger/evidence.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const ledgerMd = fs.readFileSync(path.join(dir, 'docs/LEDGER.md'), 'utf8');
const units = fs.readdirSync(path.join(dir, '.garagiste/units')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, '.garagiste/units', f), 'utf8')));
units.sort((a, b) => a.created.localeCompare(b.created));
const min = (a, b) => ((new Date(b) - new Date(a)) / 60000).toFixed(1);
const count = (kind) => L.filter((e) => e.kind === kind).length;

console.log('| unit | 끝 | seed→끝 원시(분) | 팩(종류별) | 토큰 | attack(LEDGER) | tried |');
console.log('|---|---|---|---|---|---|---|');
let packs = 0; let tokens = 0;
for (const u of units) {
  const ul = L.filter((e) => e.kind === 'unit' && e.slug === u.slug);
  const start = ul[ul.length - 1]?.ts;
  const end = L.find((e) => (e.kind === 'ship' || e.kind === 'drop') && e.slug === u.slug && e.ts >= start);
  const ps = L.filter((e) => e.kind === 'pack' && e.slug === u.slug && e.ts >= start);
  const by = {}; for (const p of ps) by[p.pack] = (by[p.pack] || 0) + 1;
  const tok = L.filter((e) => e.kind === 'spawn' && e.slug === u.slug).reduce((s, e) => s + (e.tokens || 0), 0);
  const row = ledgerMd.split('\n').find((l) => l.split('|').map((x) => x.trim())[2] === u.slug);
  packs += ps.length; tokens += tok;
  console.log(`| ${u.slug} | ${end ? end.kind : u.state} | ${end ? min(start, end.ts) : '—'} | ${ps.length} (${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(' · ')}) | ${Math.round(tok / 1000)}K | ${row ? row.split('|').map((x) => x.trim())[7] : '—'} | ${u.tried ? u.tried.result : '—'} |`);
}
tokens += L.filter((e) => e.kind === 'spawn' && e.slug === 'intake').reduce((s, e) => s + (e.tokens || 0), 0);
const scope = L.find((e) => e.kind === 'scope')?.ts;
const last = [...L].reverse().find((e) => e.kind === 'ship' || e.kind === 'drop')?.ts;
const tried = L.filter((e) => e.kind === 'tried');
const backlog = fs.readFileSync(path.join(dir, 'docs/BACKLOG.md'), 'utf8');
const open = (backlog.match(/^- \[ \] /gm) || []).length;
console.log(`\nBENCH ${path.basename(dir)} · ship ${count('ship')} · drop ${count('drop')} · BACKLOG 열린 줄 ${open}${open ? '' : '(SCOPE DONE)'} · tried ok ${tried.filter((e) => e.result === 'ok').length}/fail ${tried.filter((e) => e.result === 'fail').length} · CEO 접점(decide ${count('decide')}·scope ${count('scope')}·tried ${tried.length}) · spec 반려 ${count('spec_return')} · RESPEC ${count('respec')} · needs 수정 ${count('needs')} · 팩 ${packs} · 토큰 ${Math.round(tokens / 1000)}K · scope→마지막 ship/drop ${scope && last ? min(scope, last) : '—'}분`);
