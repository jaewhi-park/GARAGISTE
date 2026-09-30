// ship — 8조건 fail-closed. 통과하면 ff 머지 + LEDGER + STATUS. 이 스크립트만 보호 브랜치에 닿는다.
import fs from 'node:fs';
import path from 'node:path';
import { acceptanceFiles, appendLedger, ctx, currentBranch, dirtyFiles, fail, git, headSha, headTree, isClean, isMain, loadTeam, loadUnit, out, readJson, readLedger, readText, rebaseInProgress, saveUnit, sh, shell, short, unmergedFiles, workTree, worktreeDir, writeJson, ceoTouch, listUnits, listFiles } from './lib.mjs';
import { parseTags } from './claims.mjs';
import { checkBoundary } from './boundary.mjs';
import { blocking, diagnose } from './doctor.mjs';
import { budgetStatus, openQuestions, render } from './state.mjs';

export const SPIKE_ROWS = ['wire', 'host', 'license', 'default', 'os'];
// 사고 14·16(2차 실기): 괄호 부연 허용 + 내용은 「같은 줄」 또는 「더 깊은 들여쓰기의 다음 줄(하위 불릿)」 —
// 같은 깊이의 다음 행이 바로 오면 빈 행이다(빈 행이 다음 행을 내용으로 잡던 느슨함은 유지해서 조임).
export function spikeComplete(text) {
  const lines = String(text || '').split('\n');
  return SPIKE_ROWS.every((r) => {
    const re = new RegExp(`^([ \\t]*)[-*]?[ \\t]*${r}[ \\t]*(?:\\([^)]*\\))?[ \\t]*:[ \\t]*(.*)$`, 'i');
    for (let i = 0; i < lines.length; i++) {
      const m = re.exec(lines[i]);
      if (!m) continue;
      if (m[2].trim()) return true;
      const indent = m[1].length;
      for (let j = i + 1; j < lines.length; j++) {
        if (!lines[j].trim()) continue;
        return (lines[j].match(/^[ \t]*/) || [''])[0].length > indent;
      }
      return false;
    }
    return false;
  });
}
// spike 파일만 든 wip HEAD인가 — 늦은 spike 뒤 build는 할 일이 없어 wip로 끝난다(사고 16). ship이 정식 메시지로 승격한다(tree 불변 → 증거 유효).
export function spikeOnlyFiles(files, measurements) { return files.length > 0 && files.every((f) => f.replace(/\\/g, '/').startsWith(`${measurements}/spike-`)); }
export function evaluateShip(x) {
  const c = [];
  const scaffold = x.unit?.kind === 'scaffold';
  const teamChanged = !scaffold && (x.changed || []).includes('.garagiste/team.json'); // 검증 명령·예산의 재작성은 boot의 일이지 어느 팩의 일도 아니다 (HAZARDS 8형)
  c.push({ id: 'unit', ok: !!x.unit && x.unit.state !== 'shipped' && x.worktreeExists && x.clean && !teamChanged, why: !x.unit ? 'unit 없음' : x.unit.state === 'shipped' ? '이미 출하' : !x.worktreeExists ? 'worktree 없음' : !x.clean ? '작업 트리가 깨끗하지 않다' : teamChanged ? 'team.json 변경은 boot(scaffold) unit만 — 검증 명령·예산은 CEO 결정' : '' });
  // platform은 원장에 기록만 한다 — 어디서 돌았든 이 tree의 full PASS가 증거다. 대상-OS 보증은 @sensor 태그·target-OS 미관측 카운트의 일(HAZARDS 14; 옛 machine_os 필터는 그 일을 못 하면서 win32의 정당한 증거를 거부했다 — 첫 Windows 실기 사고).
  const full = x.ledger.find((e) => e.kind === 'verify' && e.mode === 'full' && e.exit === 0 && e.tree === x.tree);
  c.push({ id: 'full', ok: !!full, why: full ? '' : `이 tree(${short(x.tree)})의 verify full PASS 없음 — worktree에서 node .garagiste/scripts/verify.mjs full (마지막 커밋 뒤)` });
  const rpAny = scaffold ? true : [...x.ledger].reverse().find((e) => e.kind === 'redproof' && e.slug === x.slug && e.base_red && e.head_green === true);
  const rp = scaffold || (rpAny && rpAny.tree === x.tree ? rpAny : null);
  c.push({ id: 'redproof', ok: !!rp, why: rp ? '' : rpAny ? `redproof가 이전 tree의 것 — 마지막 커밋 뒤 다시: node .garagiste/scripts/redproof.mjs ${x.slug}` : `base red · head green 증명 없음 — node .garagiste/scripts/redproof.mjs ${x.slug}` });
  const atAny = [...x.ledger].reverse().find((e) => e.kind === 'attack' && e.slug === x.slug);
  const at = atAny && atAny.tree === x.tree ? atAny : null;
  const atOk = scaffold || !x.requireAttack || (!!at && at.red === 0 && at.total >= 1);
  c.push({ id: 'attack', ok: atOk, why: atOk ? '' : !atAny ? `attack 기록 없음 — brief.mjs attack ${x.slug} → 팩 spawn → node .garagiste/scripts/verify.mjs attack ${x.slug}` : !at ? `attack 기록이 이전 tree의 것 — 마지막 커밋 뒤 다시: node .garagiste/scripts/verify.mjs attack ${x.slug}` : at.total < 1 ? 'adversary 테스트 0개' : `adversary red ${at.red}` });
  const hit = x.boundaryHit ?? !!x.unit?.boundary?.hit;
  const sp = scaffold || !hit || spikeComplete(x.spikeText); // scaffold(boot)의 매니페스트는 그 unit의 일이라 spike를 요구하지 않는다
  c.push({ id: 'spike', ok: sp, why: sp ? '' : `boundary HIT(${x.boundaryWhy || '원문'})인데 spike 필수 행(${SPIKE_ROWS.join('·')}) 미완` });
  const head = !/^wip:/.test(x.lastSubject || '');
  c.push({ id: 'head', ok: head, why: head ? '' : 'HEAD가 wip 체크포인트 — build를 다시 띄워 끝내라' });
  const qs = x.openQuestions || []; // 이 unit이 올린 질문에 답이 없으면 출하하지 않는다 — 비가역 결정을 기본값이 대신하지 못하게
  const rs = (x.unit?.respec || []).map((r) => `Q${r.q}`); // 사고 17: 닫혔지만 spec이 아직 받지 않은 답 — 닫힘은 반영이 아니다
  c.push({ id: 'questions', ok: !qs.length && !rs.length, why: [
    qs.length ? `이 unit의 열린 질문 ${qs.join(' · ')} — node .garagiste/scripts/work.mjs decide <n> "<답>" 뒤에 ship` : '',
    rs.length ? `${rs.join('·')}의 답이 진행 중에 왔는데 spec이 아직 받지 않았다 — node .garagiste/scripts/brief.mjs spec ${x.slug} → build → ship` : '',
  ].filter(Boolean).join('; ') });
  const budgetOk = x.stops.length === 0 && x.proseKb <= x.proseMax;
  c.push({ id: 'budget', ok: budgetOk, why: budgetOk ? '' : [...x.stops, ...(x.proseKb > x.proseMax ? [`규칙 산문 ${x.proseKb}KB > ${x.proseMax}KB`] : [])].join('; ') });
  return c;
}
// LEDGER attack 열 = 「선발견→최종 red/총」 — 정의는 이 함수 하나다(사고 23: 원장 attack 줄 2/3과 LEDGER 3→0/3이 다른 수로 읽혔다).
// 선발견 = 이 unit 생애(since = unit.created — drop 전 생애 제외)의 attack 실행에서 한 번이라도 red였던 adversary 파일의 합집합.
// 원장 attack 줄의 red/total은 실행 한 번의 스냅숏이다. 최종 red는 0(ship 조건 attack이 보증), 총 = 마지막 실행의 adversary 파일 수.
export function attackCell({ ledger, slug, since = '' }) {
  const runs = ledger.filter((e) => e.kind === 'attack' && e.slug === slug && (e.ts || '') >= since);
  const caught = new Set(runs.filter((e) => e.red > 0).flatMap((e) => e.files || [])).size;
  return `${caught}→0/${runs.length ? runs[runs.length - 1].total : 0}`;
}
export function proseKb(main) {
  const files = ['CLAUDE.md', 'AGENTS.md', '.garagiste/HAZARDS.md', ...listFiles(path.join(main, '.garagiste', 'packs')).map((f) => path.join('.garagiste', 'packs', f))];
  return Math.round(files.reduce((n, f) => n + Buffer.byteLength(readText(path.join(main, f))), 0) / 1024);
}
const DOC_OK = (team) => [team.paths.brief, team.paths.backlog, team.paths.status, team.paths.ledger_doc, team.paths.decisions]; // 스크립트가 쓰는 CEO 문서는 ship의 문서 커밋에 실린다
// 사고 7(2차 실기): main의 models 커밋과 boot의 commands 커밋이 team.json 인접 블록을 각자 재작성해 rebase가 텍스트 충돌 — 키는 겹치지 않았다.
// 키 단위 3-way는 판단이 아니라 산수다: 한쪽만 바꾼 키는 그쪽, 양쪽이 같은 키를 다르게 바꾸면 병합 없음(null → 기존 FAIL 경로).
export function mergeTeamJson(base, ours, theirs) {
  const J = JSON.stringify;
  const merged = {};
  for (const k of new Set([...Object.keys(base || {}), ...Object.keys(ours || {}), ...Object.keys(theirs || {})])) {
    const b = J((base || {})[k]), o = J((ours || {})[k]), t = J((theirs || {})[k]);
    if (o === t) { if (o !== undefined) merged[k] = (ours || {})[k]; continue; }
    if (b === o) { if (t !== undefined) merged[k] = (theirs || {})[k]; continue; }
    if (b === t) { if (o !== undefined) merged[k] = (ours || {})[k]; continue; }
    return null;
  }
  return merged;
}
const TEAM_JSON = '.garagiste/team.json';
const DEP_MANIFEST = /(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|uv\.lock|pyproject\.toml|requirements[^/]*\.txt|Cargo\.(toml|lock)|go\.(mod|sum))$/;
function resolveRebaseTeamJson(wt) {
  for (let i = 0; i < 10; i++) {
    const un = git(['diff', '--name-only', '--diff-filter=U'], wt).stdout.split('\n').filter(Boolean);
    if (un.length !== 1 || un[0] !== TEAM_JSON) return false;
    const stage = (n) => { const r = git(['show', `:${n}:${TEAM_JSON}`], wt); if (r.status) return n === 1 ? {} : null; try { return JSON.parse(r.stdout.replace(/^﻿/, '')); } catch { return null; } };
    const ours = stage(2), theirs = stage(3);
    const merged = ours && theirs ? mergeTeamJson(stage(1), ours, theirs) : null;
    if (!merged) return false;
    writeJson(path.join(wt, TEAM_JSON), merged);
    git(['add', TEAM_JSON], wt);
    // --continue의 커밋에도 게이트가 돈다 — 통합 tree의 full은 rebase 뒤 ship이 직접 재실행해 원장에 남긴다(아래), WIP는 그 사이의 승인된 차선
    if (!git(['rebase', '--continue'], wt, { GIT_EDITOR: 'true', GARAGISTE_WIP: '1' }).status) return true;
  }
  return false;
}
// 사고 26(L2 1일차): 코드 충돌은 rebase를 멈춘 자리에서 팩이 표시를 풀고(git add까지 — 파일 편집, 팩의 경계 안) ship이 잇는다.
// 옛 안내 「build를 다시 띄워 main 위에서 해결」은 실행 불가였다 — 가드가 팩·conductor 모두의 rebase·merge를 막는다.
const conflictFail = (mainBranch, files, slug, pk) => `FAIL ship: ${mainBranch}과 충돌 — ${files.join(' ')}. rebase를 그 자리에 멈춰 두었다(충돌 표시가 worktree에 있다) → node .garagiste/scripts/brief.mjs ${pk} ${slug} → ${pk}가 표시를 풀고 git add까지(커밋·rebase 없이) → node .garagiste/scripts/ship.mjs ${slug} — ship이 rebase를 잇고 통합 tree를 다시 검증한다`;
function main() {
  const slug = process.argv[2];
  if (!slug) fail('사용법: ship.mjs <slug>');
  const c = ctx();
  const probs = blocking(diagnose(c.main));
  if (probs.length) fail(`FAIL doctor ${probs.length} — 설치가 병든 채로 ship하지 않는다\n${probs.map((x) => `- ${x}`).join('\n')}`);
  const unit = loadUnit(c.main, c.team, slug);
  const wt = worktreeDir(c.main, c.team, slug);
  const exists = fs.existsSync(wt);
  const pk = unit.kind === 'scaffold' ? 'boot' : 'build';
  // 사고 26: 멈춰 둔 rebase를 잇는다. 증거는 멈추기 전 unit의 tree(원장 ship_conflict)로 보고, 통합 tree는 아래 사고 22 경로가 다시 검증한다.
  let resumed = null;
  if (exists && rebaseInProgress(wt)) {
    const left = unmergedFiles(wt);
    if (left.length) fail(`FAIL ship: ${c.team.protected_branch}과의 충돌이 아직 남았다 — ${left.join(' ')} → node .garagiste/scripts/brief.mjs ${pk} ${slug} → 표시를 풀고 git add까지 → ship 다시`);
    const origin = [...readLedger(c.main, c.team)].reverse().find((e) => e.kind === 'ship_conflict' && e.slug === slug) || null;
    const cont = git(['rebase', '--continue'], wt, { GIT_EDITOR: 'true', GARAGISTE_WIP: '1' });
    if (cont.status && !resolveRebaseTeamJson(wt)) {
      const next = unmergedFiles(wt);
      if (!next.length) { git(['rebase', '--abort'], wt); fail(`FAIL ship: rebase를 잇지 못했다 — ${(cont.stderr || cont.stdout).split('\n')[0]}`); }
      appendLedger(c.main, c.team, { kind: 'ship_conflict', slug, files: next, tree: origin?.tree || null, head: origin?.head || null });
      fail(conflictFail(c.team.protected_branch, next, slug, pk));
    }
    resumed = origin;
  }
  // 사고 20(3차 실기): 사고 15가 spike 산출물의 커밋 경로를 없앴다 — 훅은 건너뛰고, 에이전트는 커밋 금지, conductor는 가드가 막는다.
  // 사고 16의 대칭으로 완성: spike 파일만 더러운 worktree는 ship이 docs(spike)로 스스로 커밋한다. 그 뒤 증거 재기록은 FAIL 문구의 재실행 명령이 안내한다.
  if (exists) {
    const wtDirty = dirtyFiles(wt);
    if (wtDirty.length && spikeOnlyFiles(wtDirty, c.team.paths.measurements)) {
      git(['add', '-A'], wt);
      git(['commit', '-q', '-m', `docs(spike): ${slug} 측정`], wt, { GARAGISTE_WIP: '1' });
    }
  }
  const tree = resumed?.tree || (exists ? workTree(wt) : null);
  const units = listUnits(c.main, c.team);
  const ledger = readLedger(c.main, c.team);
  const b = budgetStatus({ units, ledger, team: c.team, ceoTouchTs: ceoTouch(c.main) });
  const base = exists ? git(['merge-base', 'HEAD', c.team.protected_branch], wt).stdout : '';
  const changed = exists && base ? git(['diff', '--name-only', `${base}..HEAD`], wt).stdout.split('\n').filter(Boolean) : [];
  const diffHit = checkBoundary(c.team, { files: changed });
  // 사고 16: 늦은 spike 뒤 측정 파일만 남으면 build는 할 일이 없어 wip로 끝난다 — spike 파일만의 wip HEAD는 정식 메시지로 승격(amend는 메시지만, tree 불변 → full·redproof·attack 증거 그대로 유효)
  if (exists && /^wip:/.test(git(['log', '-1', '--format=%s'], wt).stdout)) {
    const headFiles = git(['show', '--name-only', '--format='], wt).stdout.split('\n').filter(Boolean);
    if (spikeOnlyFiles(headFiles, c.team.paths.measurements)) git(['commit', '--amend', '-q', '-m', `docs(spike): ${slug} 측정`], wt, { GARAGISTE_WIP: '1' });
  }
  const conds = evaluateShip({
    unit, slug, worktreeExists: exists, clean: exists && isClean(wt), tree, ledger, changed,
    boundaryHit: !!unit.boundary?.hit || diffHit.hit, boundaryWhy: unit.boundary?.hit ? '원문' : diffHit.reasons.join(', '),
    requireAttack: c.team.require_attack !== false, spikeText: readText(path.join(wt, c.team.paths.measurements, `spike-${slug}.md`)),
    lastSubject: exists ? git(['log', '-1', '--format=%s'], wt).stdout : '', stops: b.stops, proseKb: proseKb(c.main), proseMax: c.team.budgets.prose_kb_max,
    openQuestions: openQuestions(readText(path.join(c.main, c.team.paths.decisions))).filter((l) => l.includes(`(${slug})`)).map((l) => (l.match(/Q\d+/) || [''])[0]),
  });
  const bad = conds.filter((k) => !k.ok);
  if (bad.length) fail(`FAIL ship ${slug} ${bad.length}/8\n${bad.map((k) => `- ${k.id}: ${k.why}`).join('\n')}`);
  // 메인 worktree: 보호 브랜치, 문서 파일 외에는 깨끗해야
  if (currentBranch(c.main) !== c.team.protected_branch) fail(`FAIL ship: 메인 worktree가 ${c.team.protected_branch}에 있지 않다`);
  const dirty = dirtyFiles(c.main).filter((f) => !DOC_OK(c.team).includes(f));
  if (dirty.length) fail(`FAIL ship: 메인 worktree에 미커밋 변경 — ${dirty.join(' ')}`);
  // 통합: unit을 main 위로 올리고, tree가 바뀌었으면 full을 다시 돌린다
  const preHead = headSha(wt);
  const rb = git(['rebase', c.team.protected_branch], wt);
  if (rb.status && !resolveRebaseTeamJson(wt)) {
    const files = unmergedFiles(wt);
    if (!files.length) { git(['rebase', '--abort'], wt); fail(`FAIL ship: rebase 실패 — ${(rb.stderr || rb.stdout).split('\n')[0]}`); }
    appendLedger(c.main, c.team, { kind: 'ship_conflict', slug, files, tree, head: resumed?.head || preHead });
    fail(conflictFail(c.team.protected_branch, files, slug, pk));
  }
  const newTree = headTree(wt);
  if (newTree !== tree) {
    // 통합 tree는 자기 자신의 명령으로 검증한다 — boot의 commands는 머지 전 main엔 없다(사고 7에서 노출: main의 빈 full로 crash)
    const fullCmd = readJson(path.join(wt, '.garagiste', 'team.json'), null)?.commands?.full || c.team.commands.full;
    if (!fullCmd) fail('FAIL ship: 통합 tree 재검증 불가 — commands.full 비어 있음');
    const r = shell(fullCmd, { cwd: wt });
    appendLedger(c.main, c.team, { kind: 'verify', mode: 'full', tree: newTree, head: headSha(wt), exit: r.status, platform: process.platform, where: unit.worktree, integration: true });
    if (r.status) fail('FAIL ship: 통합 tree에서 full FAIL — main이 움직였다, build 재spawn');
    // 사고 22(3차 실기): full만 재기록하면 롤백 뒤 재-ship이 「redproof·attack이 이전 tree」 핑퐁에 빠지고,
    // 새 base 위 공격 회귀는 머지 전 검사를 빠져나간다 — 세 증거 전부를 새 tree에 다시 묶는다(순수 기계 일).
    if (unit.kind !== 'scaffold') {
      const rp = sh(process.execPath, [path.join(c.main, '.garagiste', 'scripts', 'redproof.mjs'), slug], { cwd: c.main });
      // 사고 24: redproof는 re-spec(정체 spec)의 head red를 RED(exit 0)로 낸다 — 통합 tree는 exit가 아니라 PASS 줄로만 통과한다
      if (rp.status || !/^PASS redproof/.test(rp.stdout || '')) fail(`FAIL ship: 통합 tree redproof FAIL\n${(rp.stdout || rp.stderr).trim()}`);
      const ak = sh(process.execPath, [path.join(c.main, '.garagiste', 'scripts', 'verify.mjs'), 'attack', slug], { cwd: c.main });
      const akRed = /red (\d+)\//.exec(ak.stdout || '');
      if (ak.status || (akRed && Number(akRed[1]) > 0)) fail(`FAIL ship: 통합 tree attack red\n${(ak.stdout || ak.stderr).trim()}`);
    }
  }
  const prevHead = headSha(c.main);
  const mg = git(['merge', '--ff-only', unit.branch], c.main);
  if (mg.status) fail(`FAIL ship: ff 머지 실패 — ${mg.stderr}`);
  c.team = loadTeam(c.main); // boot unit이 team.json commands를 바꿨을 수 있다
  const head = headSha(c.main);
  // 사고 21(3차 실기): 의존성을 새로 들이는 출하는 main 설치 없이 머지 뒤 quick이 반드시 red다 — 설치는 머지 전엔 불가(새 매니페스트가 main에 없다).
  // 매니페스트가 바뀌었고 commands.setup이 있으면 main quick 전에 설치를 돌린다. build 재spawn은 이 실패의 해법이 아니다.
  const depChanged = changed.some((f) => DEP_MANIFEST.test(f.replace(/\\/g, '/')));
  if (depChanged && c.team.commands.setup) {
    const su = shell(c.team.commands.setup, { cwd: c.main });
    if (su.status) {
      git(['reset', '--keep', prevHead], c.main);
      fail(`FAIL ship: 의존성 설치(commands.setup) 실패 — 머지를 되돌렸다(${short(head)} → ${short(prevHead)}). 설치 명령을 고치고 다시 ship\n${(su.stderr || su.stdout).split('\n').slice(-5).join('\n')}`);
    }
  }
  const tags = acceptanceFiles(c.main, c.team, slug).map((f) => parseTags(readText(path.join(c.main, f))));
  const prevUnit = { state: unit.state, sensor: unit.sensor };
  unit.sensor = tags.find((t) => t.sensor.startsWith('human'))?.sensor || 'machine';
  unit.state = 'shipped'; unit.shipped = new Date().toISOString(); unit.head = head; saveUnit(c.main, c.team, unit);
  const ledgerDoc = path.join(c.main, c.team.paths.ledger_doc);
  if (!fs.existsSync(ledgerDoc)) fs.writeFileSync(ledgerDoc, '# LEDGER — 증명 커밋. 한 줄 = 출하 하나 = 기계가 확인한 사실의 목록.\n\n| 날짜 | unit | head | tree | full | redproof | attack 선발견→red/총 | sensor |\n|---|---|---|---|---|---|---|---|\n');
  // Q4 계측: attack 선발견 — CEO의 tried fail(후발견)과 대조하는 열. 정의는 attackCell 하나(사고 23)
  const atCell = unit.kind === 'scaffold' ? '—' : attackCell({ ledger, slug, since: unit.created });
  const row = `| ${unit.shipped.slice(0, 10)} | ${slug} | ${short(head)} | ${short(newTree)} | PASS | ${unit.kind === 'scaffold' ? 'scaffold' : 'base_red head_green'} | ${atCell} | ${unit.sensor} |\n`;
  fs.appendFileSync(ledgerDoc, row);
  const backlog = path.join(c.main, c.team.paths.backlog);
  if (fs.existsSync(backlog)) fs.writeFileSync(backlog, readText(backlog).replace(new RegExp(`^- \\[ \\] ${slug} `, 'm'), `- [x] ${slug} `));
  fs.writeFileSync(path.join(c.main, c.team.paths.status), render(c).text);
  const docs = DOC_OK(c.team).filter((f) => fs.existsSync(path.join(c.main, f)));
  git(['add', ...docs], c.main);
  const q = shell(c.team.commands.quick, { cwd: c.main });
  appendLedger(c.main, c.team, { kind: 'verify', mode: 'quick', tree: workTree(c.main), head, exit: q.status, platform: process.platform, where: '.', ship: true });
  if (q.status) {
    // 원자성: 머지와 출하 기록을 전부 되돌린다 — main에 「머지는 됐는데 빨간」 상태를 남기지 않는다 (증거 jsonl은 append-only라 ship_rollback 줄로 남긴다)
    git(['reset', '--keep', prevHead], c.main);
    unit.state = prevUnit.state; unit.sensor = prevUnit.sensor; unit.shipped = null; delete unit.head; saveUnit(c.main, c.team, unit);
    const led = readText(ledgerDoc);
    if (led.endsWith(row)) fs.writeFileSync(ledgerDoc, led.slice(0, -row.length));
    if (fs.existsSync(backlog)) fs.writeFileSync(backlog, readText(backlog).replace(new RegExp(`^- \\[x\\] ${slug} `, 'm'), `- [ ] ${slug} `));
    fs.writeFileSync(path.join(c.main, c.team.paths.status), render(c).text);
    appendLedger(c.main, c.team, { kind: 'ship_rollback', slug, from: head, to: prevHead, why: 'main quick FAIL' });
    fail(`FAIL ship: 머지 뒤 main quick FAIL — 머지를 되돌렸다(${short(head)} → ${short(prevHead)}). ${depChanged ? '의존성 출하다 — commands.setup(설치 명령)을 등록·수리하고 다시 ship하라. build 재spawn은 해법이 아니다' : '원인은 통합: build 재spawn 뒤 다시 ship'}`);
  }
  appendLedger(c.main, c.team, { kind: 'ship', slug, head, tree: newTree, sensor: unit.sensor });
  const msg = `ship(${slug}): ${unit.origin.replace(/\n/g, ' ').slice(0, 60)}\n\nUnit: ${slug}\nKind: ${unit.kind}\nHead: ${short(head)}\nFull: ${short(newTree)}\nRedproof: ${unit.kind === 'scaffold' ? 'scaffold' : 'base_red head_green'}\nAttack: ${atCell}\nSensor: ${unit.sensor}`;
  const cm = git(['commit', '-q', '-m', msg], c.main, { GARAGISTE_SHIP: '1' });
  if (cm.status) fail(`FAIL ship: 문서 커밋 실패 — ${cm.stderr}`);
  git(['worktree', 'remove', wt], c.main);
  out(`SHIPPED ${slug} ${short(head)} sensor=${unit.sensor}`);
  // 사고 10(2차 실기): 의존성은 unit worktree에만 설치되고 worktree는 ship 뒤 사라진다 — 메인이 설치하지 않으면 다음 unit이 맨손이 되어 스펙(결정된 스택)을 우회한다
  if (depChanged)
    out(`NOTE: 의존성 파일이 바뀐 출하 — ${c.team.commands.setup ? 'commands.setup을 main에서 이미 돌렸다' : '메인 루트에서 설치를 한 번 돌리고 commands.setup 등록을 권한다(npm ci·uv sync 등)'}. 다음 unit의 worktree가 물려받는다.`);
  // scaffold(boot)엔 try.md가 없다 — 써보기는 실행·검증 명령이다 (2차 실기: 빈 파일을 가리켜 conductor가 즉석 안내를 지어냈다)
  out(unit.kind === 'scaffold'
    ? `TRY: 실행 \`${c.team.commands.run || c.team.commands.quick}\` → node .garagiste/scripts/work.mjs tried ${slug} ok|fail`
    : `TRY: docs/units/${slug}/try.md → node .garagiste/scripts/work.mjs tried ${slug} ok|fail`);
}
if (isMain(import.meta.url)) main();
