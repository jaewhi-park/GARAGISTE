// ship — 7조건 fail-closed. 통과하면 ff 머지 + LEDGER + STATUS. 이 스크립트만 보호 브랜치에 닿는다.
import fs from 'node:fs';
import path from 'node:path';
import { acceptanceFiles, appendLedger, ctx, currentBranch, dirtyFiles, fail, git, headSha, headTree, isClean, isMain, loadUnit, out, readLedger, readText, saveUnit, shell, short, workTree, worktreeDir, ceoTouch, listUnits, listFiles } from './lib.mjs';
import { parseTags } from './claims.mjs';
import { budgetStatus, render } from './state.mjs';

export const SPIKE_ROWS = ['wire', 'host', 'license', 'default', 'os'];
export function spikeComplete(text) { return SPIKE_ROWS.every((r) => new RegExp(`^\\s*[-*]?\\s*${r}\\s*:\\s*\\S`, 'mi').test(text || '')); }
export function evaluateShip(x) {
  const c = [];
  c.push({ id: 'unit', ok: !!x.unit && x.unit.state !== 'shipped' && x.worktreeExists && x.clean, why: !x.unit ? 'unit 없음' : x.unit.state === 'shipped' ? '이미 출하' : !x.worktreeExists ? 'worktree 없음' : !x.clean ? '작업 트리가 깨끗하지 않다' : '' });
  const full = x.ledger.find((e) => e.kind === 'verify' && e.mode === 'full' && e.exit === 0 && e.tree === x.tree && x.machineOs.includes(e.platform));
  c.push({ id: 'full', ok: !!full, why: full ? '' : `이 tree(${short(x.tree)})의 verify full PASS(machine OS) 없음` });
  const rp = x.ledger.find((e) => e.kind === 'redproof' && e.slug === x.slug && e.base_red && e.head_green === true && e.tree === x.tree);
  c.push({ id: 'redproof', ok: !!rp, why: rp ? '' : 'base red · head green 증명 없음 — redproof.mjs' });
  const at = [...x.ledger].reverse().find((e) => e.kind === 'attack' && e.slug === x.slug && e.tree === x.tree);
  const atOk = !x.requireAttack || (!!at && at.red === 0 && at.total >= 1);
  c.push({ id: 'attack', ok: atOk, why: atOk ? '' : !at ? 'attack 기록 없음 — attack 팩을 돌려라' : at.total < 1 ? 'adversary 테스트 0개' : `adversary red ${at.red}` });
  const sp = !x.unit?.boundary?.hit || spikeComplete(x.spikeText);
  c.push({ id: 'spike', ok: sp, why: sp ? '' : `boundary HIT인데 spike 필수 행(${SPIKE_ROWS.join('·')}) 미완` });
  const head = !/^wip:/.test(x.lastSubject || '');
  c.push({ id: 'head', ok: head, why: head ? '' : 'HEAD가 wip 체크포인트 — build를 다시 띄워 끝내라' });
  const budgetOk = x.stops.length === 0 && x.proseKb <= x.proseMax;
  c.push({ id: 'budget', ok: budgetOk, why: budgetOk ? '' : [...x.stops, ...(x.proseKb > x.proseMax ? [`규칙 산문 ${x.proseKb}KB > ${x.proseMax}KB`] : [])].join('; ') });
  return c;
}
export function proseKb(main) {
  const files = ['CLAUDE.md', 'AGENTS.md', '.garagiste/HAZARDS.md', ...listFiles(path.join(main, '.garagiste', 'packs')).map((f) => path.join('.garagiste', 'packs', f))];
  return Math.round(files.reduce((n, f) => n + Buffer.byteLength(readText(path.join(main, f))), 0) / 1024);
}
const DOC_OK = (team) => [team.paths.backlog, team.paths.status, team.paths.ledger_doc, team.paths.decisions];
function main() {
  const slug = process.argv[2];
  if (!slug) fail('사용법: ship.mjs <slug>');
  const c = ctx();
  const unit = loadUnit(c.main, c.team, slug);
  const wt = worktreeDir(c.main, c.team, slug);
  const exists = fs.existsSync(wt);
  const tree = exists ? workTree(wt) : null;
  const units = listUnits(c.main, c.team);
  const ledger = readLedger(c.main, c.team);
  const b = budgetStatus({ units, ledger, team: c.team, ceoTouchTs: ceoTouch(c.main) });
  const conds = evaluateShip({
    unit, slug, worktreeExists: exists, clean: exists && isClean(wt), tree, ledger, machineOs: c.team.sensors.machine_os,
    requireAttack: c.team.require_attack !== false, spikeText: readText(path.join(wt, c.team.paths.measurements, `spike-${slug}.md`)),
    lastSubject: exists ? git(['log', '-1', '--format=%s'], wt).stdout : '', stops: b.stops, proseKb: proseKb(c.main), proseMax: c.team.budgets.prose_kb_max,
  });
  const bad = conds.filter((k) => !k.ok);
  if (bad.length) fail(`FAIL ship ${slug} ${bad.length}/7\n${bad.map((k) => `- ${k.id}: ${k.why}`).join('\n')}`);
  // 메인 worktree: 보호 브랜치, 문서 파일 외에는 깨끗해야
  if (currentBranch(c.main) !== c.team.protected_branch) fail(`FAIL ship: 메인 worktree가 ${c.team.protected_branch}에 있지 않다`);
  const dirty = dirtyFiles(c.main).filter((f) => !DOC_OK(c.team).includes(f));
  if (dirty.length) fail(`FAIL ship: 메인 worktree에 미커밋 변경 — ${dirty.join(' ')}`);
  // 통합: unit을 main 위로 올리고, tree가 바뀌었으면 full을 다시 돌린다
  const rb = git(['rebase', c.team.protected_branch], wt);
  if (rb.status) { git(['rebase', '--abort'], wt); fail(`FAIL ship: rebase 충돌 — build 팩을 다시 띄워 ${c.team.protected_branch} 위에서 해결`); }
  const newTree = headTree(wt);
  if (newTree !== tree) {
    const r = shell(c.team.commands.full, { cwd: wt });
    appendLedger(c.main, c.team, { kind: 'verify', mode: 'full', tree: newTree, head: headSha(wt), exit: r.status, platform: process.platform, where: unit.worktree, integration: true });
    if (r.status) fail('FAIL ship: 통합 tree에서 full FAIL — main이 움직였다, build 재spawn');
  }
  const mg = git(['merge', '--ff-only', unit.branch], c.main);
  if (mg.status) fail(`FAIL ship: ff 머지 실패 — ${mg.stderr}`);
  const head = headSha(c.main);
  const tags = acceptanceFiles(c.main, c.team, slug).map((f) => parseTags(readText(path.join(c.main, f))));
  unit.sensor = tags.find((t) => t.sensor.startsWith('human'))?.sensor || 'machine';
  unit.state = 'shipped'; unit.shipped = new Date().toISOString(); unit.head = head; saveUnit(c.main, c.team, unit);
  appendLedger(c.main, c.team, { kind: 'ship', slug, head, tree: newTree, sensor: unit.sensor });
  const ledgerDoc = path.join(c.main, c.team.paths.ledger_doc);
  if (!fs.existsSync(ledgerDoc)) fs.writeFileSync(ledgerDoc, '# LEDGER — 증명 커밋. 한 줄 = 출하 하나 = 기계가 확인한 사실의 목록.\n\n| 날짜 | unit | head | tree | full | redproof | attack | sensor |\n|---|---|---|---|---|---|---|---|\n');
  const at = [...ledger].reverse().find((e) => e.kind === 'attack' && e.slug === slug);
  fs.appendFileSync(ledgerDoc, `| ${unit.shipped.slice(0, 10)} | ${slug} | ${short(head)} | ${short(newTree)} | PASS | base_red head_green | 0/${at ? at.total : 0} | ${unit.sensor} |\n`);
  const backlog = path.join(c.main, c.team.paths.backlog);
  if (fs.existsSync(backlog)) fs.writeFileSync(backlog, readText(backlog).replace(new RegExp(`^- \\[ \\] ${slug} `, 'm'), `- [x] ${slug} `));
  fs.writeFileSync(path.join(c.main, c.team.paths.status), render(c).text);
  const docs = DOC_OK(c.team).filter((f) => fs.existsSync(path.join(c.main, f)));
  git(['add', ...docs], c.main);
  const q = shell(c.team.commands.quick, { cwd: c.main });
  appendLedger(c.main, c.team, { kind: 'verify', mode: 'quick', tree: workTree(c.main), head, exit: q.status, platform: process.platform, where: '.', ship: true });
  if (q.status) fail('FAIL ship: 머지 뒤 main quick FAIL — 문서 커밋을 멈춤(원인은 통합)');
  const msg = `ship(${slug}): ${unit.origin.replace(/\n/g, ' ').slice(0, 60)}\n\nUnit: ${slug}\nHead: ${short(head)}\nFull: ${short(newTree)}\nRedproof: base_red head_green\nAttack: 0/${at ? at.total : 0}\nSensor: ${unit.sensor}`;
  const cm = git(['commit', '-q', '-m', msg], c.main, { GARAGISTE_SHIP: '1' });
  if (cm.status) fail(`FAIL ship: 문서 커밋 실패 — ${cm.stderr}`);
  git(['worktree', 'remove', wt], c.main);
  out(`SHIPPED ${slug} ${short(head)} sensor=${unit.sensor}`);
  out(`TRY: docs/units/${slug}/try.md → node .garagiste/scripts/work.mjs tried ${slug} ok|fail`);
}
if (isMain(import.meta.url)) main();
