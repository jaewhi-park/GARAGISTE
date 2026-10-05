// next — Flow 4~7의 다음 한 걸음. 판단 없음: unit 상태·원장·worktree에서 다음 명령 한 줄(run·spawn·ceo·wait·done)을 낸다 — conductor는 이 줄만 따른다.
// L2 2판 윈도우(고칠 때마다 attack 팩을 새로 띄워 28·20바퀴)·3판(CEO의 「다 ok」를 Q10의 「예」로 · 부재 선언 뒤 루프 재개): 규율 이탈은 전부 Flow 4~7 산문의 빈칸에서 났다 — 빈칸을 코드로.
import fs from 'node:fs';
import path from 'node:path';
import { ceoTouch, ctx, fail, git, isMain, listUnits, mergeBase, out, readJson, readLedger, readText, rebaseInProgress, unmergedFiles, workTree, worktreeDir } from './lib.mjs';
import { blocking, diagnose } from './doctor.mjs';
import { budgetStatus } from './state.mjs';
import { attackRoundUsed } from './brief.mjs';
import { checkBoundary } from './boundary.mjs';
import { spikeComplete } from './ship.mjs';
import { parseBacklog, pickReady } from './work.mjs';

const S = 'node .garagiste/scripts';
const last = (arr, pred) => { for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return arr[i]; return null; };
const since = (e, ts) => (e.ts || '') >= (ts || '');

// 팩의 생애는 셋으로 센다: 조립(원장 pack) → 띄움(conductor의 spawned 또는 훅의 spawn_stop — 둘 중 먼저 온 것) → 증거(redproof·attack 줄이 팩 뒤에 있는가).
// 증거는 팩 조립 시각 뒤면 된다 — 팩 안의 에이전트가 스스로 남긴 redproof·verify attack을 다시 돌리지 않는다.
// 사고 84(24라운드 여덟째 날 · erp-lite): ship의 rebase 충돌이 인수 테스트 둘에 남았다 — build는 가드가 막아(tests/acceptance·adversary 쓰기 거부) 코드만 풀고 `spec: 충돌 <파일>`로 넘겼는데(brief의 충돌 절이 그렇게 시킨다)
// 그 줄을 받을 길이 없었다: conduct는 반려로 읽어 brief spec --return(둘째 반려 → hard 질문 Q13), next의 rebase 분기는 build → ship만 알아 ship FAIL 「충돌이 아직 남았다」가 되풀이됐다. 남은 표시가 테스트 파일에만 있으면 그 테스트의 주인 팩이 푼다 — 인수는 spec, 공격은 attack(인수 먼저); 코드가 섞여 남았으면 build의 일(ship이 FAIL로 말한다).
export function conflictOwner(files = [], paths = { acceptance: 'tests/acceptance', adversary: 'tests/adversary' }) {
  const under = (f, d) => f.startsWith(`${d}/`);
  if (!files.length || !files.every((f) => under(f, paths.acceptance) || under(f, paths.adversary))) return null;
  return files.some((f) => under(f, paths.acceptance)) ? 'spec' : 'attack';
}
export const conflictHandoff = (text) => /^충돌(\s|$)/.test(String(text || '').trim()); // build의 `spec: 충돌 <파일>`은 반려가 아니라 넘김 — conduct가 brief spec --return으로 읽지 않는다
export function nextStep({ units, ledger, decisionsText = '', scope = null, backlog = [], stops = [], tokenStops = [], systemAttack = false, wtOf = () => ({}), packPath = () => '<PACK 경로>', paths = { acceptance: 'tests/acceptance', adversary: 'tests/adversary' } }) {
  const open = new Set([...String(decisionsText).matchAll(/^- \[ \] Q(\d+)/gm)].map((m) => Number(m[1])));
  const run = (cmd, why) => ({ kind: 'run', cmd: `${S}/${cmd}`, why });
  const parked = (u) => [...(u.questions || []), ...(u.holds || [])].some((n) => open.has(Number(n))) || (u.needs || []).some((n) => /^Q\d+$/.test(n) && open.has(Number(n.slice(1))));
  const live = units.filter((u) => u.state !== 'shipped' && u.state !== 'dropped');
  const working = live.filter((u) => !parked(u)).sort((a, b) => (a.created || '').localeCompare(b.created || '')); // 한 번에 하나 — 먼저 연 unit부터(L2 1일차: 병렬 seed가 사고 26의 토양)
  if (!working.length) {
    if (stops.length) return { kind: 'ceo', text: `STOP ${stops.join('; ')} — 예산 정지: CEO에게 docs/STATUS.md 「써볼 것」·「정해 주세요」` };
    const held = live.filter(parked).map((u) => u.slug);
    const note = held.length ? ` (질문에 걸린 unit: ${held.join(', ')} — CEO 답을 기다린다)` : '';
    if (!backlog.length) return { kind: 'ceo', text: `BACKLOG 없음 — Flow 1·2: work.mjs brief → brief.mjs intake${note}` };
    if (!scope) return { kind: 'ceo', text: `범위 없음 — Flow 3: CEO와 범위를 정한다(work.mjs scope --milestone M1 | <slug…>)${note}` };
    const r = pickReady({ order: scope.order || [], items: backlog, units, decisionsText });
    if (r.kind === 'done') {
      // 범위(order)의 끝: 이음새 공격 한 바퀴(출하 둘 이상 — system-attack) → 출하 보고 한 장(state.mjs report) → done. 키는 order라 -fix로 범위가 자라면 둘 다 다시 돈다.
      const key = (scope.order || []).join(',');
      const shippedN = (scope.order || []).filter((s) => units.some((x) => x.slug === s && x.state === 'shipped')).length;
      if (systemAttack && scope.system_for !== key && shippedN >= 2) return run('work.mjs system', `범위가 끝났다 — 출하된 unit ${shippedN}개의 이음새 공격 한 바퀴(발견은 red 테스트, 발견 0이면 drop)`);
      if (scope.report_for !== key) return run('state.mjs report', '범위가 끝났다 — 출하 보고 한 장(docs/REPORT.md): 만든 것·증명한 것·정한 것·못 본 것·써볼 것');
      const untried = units.filter((x) => x.state === 'shipped' && !x.tried).map((x) => x.slug);
      return { kind: 'done', text: `SCOPE DONE — 범위의 unit이 전부 출하됐다. 다음 범위는 CEO가(work.mjs scope)${untried.length ? ` · 써볼 것 ${untried.length}: ${untried.join(', ')}(마일스톤 끝의 try)` : ''}${note}` };
    }
    if (r.kind === 'ready') return run('work.mjs seed', `다음 unit ${r.slug}를 연다${note}`);
    if (r.kind === 'wait') return { kind: 'wait', text: `${r.slug} needs ${r.unmet.join(',')} — ${r.unmet.some((n) => /^Q\d+$/.test(n)) ? 'CEO 결정이 먼저(work.mjs decide)' : '선행 unit이 먼저'}${note}` };
    return { kind: 'wait', text: `${(r.slugs || []).join(', ')} — 질문에 걸린 unit의 답이 와야 다음이 열린다${note}` };
  }
  const u = working[0];
  const slug = u.slug;
  const mine = ledger.filter((e) => e.slug === slug && since(e, u.created)); // 이 생애(drop 전은 세지 않는다)
  const packOf = (p) => last(mine, (e) => e.kind === 'pack' && e.pack === p);
  // 사고 79(19라운드 다섯째 날): 훅의 spawn_stop엔 slug가 없다(agent_type만 안다) — CEO가 세워 둔 X의 build 팩 뒤에 Y의 build가 돌자 X의 build가 「끝난 것」이 돼 attack이 안 지은 tree를 공격했다(공격이 스스로 「diff는 문서뿐」이라 적었다).
  // slug 없는 spawn_stop은 그 직전에 조립된 같은 팩(원장 pack 줄)의 주인이 이 unit일 때만 이 unit의 것 — conduct의 spawn_stop은 slug를 적는다.
  const stopIsMine = (e, p) => (e.slug ? e.slug === slug : last(ledger, (x) => x.kind === 'pack' && x.pack === p && (x.ts || '') <= (e.ts || ''))?.slug === slug);
  const doneAfter = (p, ts) => last(ledger, (e) => since(e, ts) && ((e.kind === 'spawn' && e.slug === slug && e.pack === p) || (e.kind === 'spawn_stop' && e.pack === p && stopIsMine(e, p))));
  const brief = (p, why) => run(`brief.mjs ${p} ${slug}`, why);
  const spawn = (p, why) => ({ kind: 'spawn', pack: p, slug, path: packPath(slug, p), why });
  // 사고 72(15라운드 넷째 run · erp-lite): unit 토큰 상한(1M)은 seed와 ship 직전(red 0)에만 보였다 — system-1이 attack↔build 진동으로 2.2M을 쓰는 동안 한 번도 서지 않았다(장치가 겨눈 바로 그 진동 — 선 것은 되풀이 규칙이었다). 걸음마다 그 unit의 상한을 본다: 팩을 띄우는 길은 전부 여기를 지난다.
  const over = tokenStops.find((t) => t.slug === slug);
  if (over) return { kind: 'ceo', text: `STOP ${over.text} — 예산 정지: ${slug}는 ${u.state} 뒤에 서 있다(상한은 걸음마다 — 진동 안에서도, 사고 72) — CEO에게 docs/STATUS.md 「정해 주세요」` };
  if ((u.respec || []).length) return brief('spec', `Q${u.respec.map((r) => r.q).join('·Q')}의 답이 진행 중에 왔다 — spec이 먼저 받는다(사고 17)`);
  const wt = wtOf(u) || {};
  // 사고 26·58: ship이 멈춰 둔 rebase — 표시가 남았으면 build가 풀고(git add까지), 다 풀렸으면 ship이 잇는다
  if (wt.rebase) {
    if (!wt.unmerged?.length) return run(`ship.mjs ${slug}`, 'rebase 도중 — 충돌 표시는 다 풀렸다, ship이 잇는다');
    const conflictAt = last(mine, (e) => e.kind === 'ship_conflict')?.ts || '';
    const bp = last(mine, (e) => e.kind === 'pack' && e.pack === 'build' && since(e, conflictAt));
    if (!bp) return brief('build', `main과 충돌 — ${wt.unmerged.join(' ')}: build가 표시를 풀고 git add까지`);
    if (!doneAfter('build', bp.ts)) return spawn('build', '충돌을 푸는 build');
    const owner = conflictOwner(wt.unmerged, paths); // 사고 84: 테스트 파일만 남았으면 주인 팩(인수 spec · 공격 attack)
    if (owner) {
      const ops = mine.filter((e) => e.kind === 'pack' && e.pack === owner && since(e, bp.ts)); // 한 번 더까지 — 둘이 다 풀지 못했으면 ship이 FAIL로 말한다(되풀이 → 멈춤)
      const op = ops[ops.length - 1];
      if (!op || (ops.length < 2 && doneAfter(owner, op.ts))) return brief(owner, `충돌이 ${owner === 'spec' ? '인수' : '공격'} 테스트에 남았다 — ${wt.unmerged.join(' ')}: ${owner}가 표시를 풀고 git add까지(build는 가드가 막는다, 사고 84)${op ? ' — 한 번 더(앞 팩이 다 풀지 못했다)' : ''}`);
      if (!doneAfter(owner, op.ts)) return spawn(owner, `충돌(${owner === 'spec' ? '인수' : '공격'} 테스트)을 푸는 ${owner}`);
    }
    return run(`ship.mjs ${slug}`, 'build가 표시를 풀었다 — ship이 rebase를 잇는다');
  }
  // 출하 직전의 검사 — 예산 정지 · 늦은 spike(사고 87) · 이 tree의 redproof·full(사고 85) · ship. finish(공격 red 0)와 늦은 spike 뒤(st === 'spike')가 같이 쓴다.
  const shipChecks = () => {
    // 사고 64(L2 5판 리눅스 4라운드): red 0인데 예산 정지(미검수 3)면 ship이 budget 조건으로 거부한다 — 예산 정지의 ceo는 seed 자리에만 있어 next가 ship을 계속 냈고
    // conductor가 ship의 FAIL 줄을 읽어 스스로 멈췄다. ship 직전에도 같은 ceo — 그 unit은 red 0으로 서 있고 CEO가 써봐야 출하가 열린다.
    if (stops.length) return { kind: 'ceo', text: `STOP ${stops.join('; ')} — 예산 정지: ${slug}는 red 0으로 ship 직전에 서 있다 — CEO에게 docs/STATUS.md 「써볼 것」·「정해 주세요」` };
    // 사고 87(25라운드 아홉째 날 · erp-lite system-4-f1): build가 카드의 데이터 폴더를 .gitignore에 더해 출하 때 diff-HIT(boundary) — ship은 「spike 필수 행 미완 → brief spike」로 FAIL했는데
    // next는 ship만 되풀이해 framework 멈춤(늦은 spike의 길은 st === 'spike'에만 있었다). 늦은 spike는 ship 전에 next가 띄운다 — 측정이 차면(spikeDone) 이 tree의 증거를 다시 묶고 ship.
    if (wt.diffHit?.hit && !wt.spikeDone && u.kind !== 'scaffold') {
      const sp = packOf('spike');
      if (!sp) return brief('spike', `출하 때 boundary HIT(${wt.diffHit.reasons.join(', ')}) — 늦은 spike: 측정(spike-${slug}.md의 필수 행)을 채운다(사고 87)`);
      if (!doneAfter('spike', sp.ts)) return spawn('spike', '늦은 spike(출하 때 diff-HIT)');
    }
    // 7라운드(refactor e2e가 드러냄): attack이 red 0으로 끝나면 공격 파일만 더해진 tree엔 redproof·full PASS가 없다 — ship이 「이전 tree의 것」·「full 없음」으로 서고 드라이버는 같은 FAIL 둘로 멈췄을 것(대화형 conductor는 FAIL 안내를 따랐다). 판단 없는 한 걸음씩.
    const tree = wt.tree || null; // computeNext의 wtOf가 센다 — nextStep은 조립된 입력만 받는다(판단 없음·순수)
    const proven = (e) => e.kind === 'redproof' && e.slug === slug && e.tree === tree && e.head_green === true && (u.kind === 'refactor' || u.kind === 'pin' ? e.refactor && e.pin_base === 'green' : e.base_red);
    if (tree && u.kind !== 'system' && !ledger.some(proven)) return run(`redproof.mjs ${slug}`, 'red 0 — 공격 파일이 더해져 tree가 움직였다: 이 tree의 redproof(ship 조건은 tree 단위)');
    // 사고 85(24라운드 여덟째 날 · erp-lite): ship이 main을 합친 뒤 통합 tree의 full이 FAIL(두 unit이 고친 공격 테스트가 자동 머지로 어긋남)인데 next는 「이 tree의 full PASS가 원장에 없다 → verify full」만 20번 되풀이했다(85초씩 · FAIL 줄이 로그 경로(시각)를 품어 되풀이 감지도 비껴갔다).
    // 이 tree의 마지막 full이 FAIL이면 build의 일이다 — 경계 밖 테스트(인수·공격)면 build가 spec: 줄로 넘긴다(가드가 막는다). 같은 tree에 두 번 돌면 진전 없음으로 멈춘다.
    const lastFull = tree ? last(ledger, (e) => e.kind === 'verify' && e.mode === 'full' && e.tree === tree) : null;
    if (lastFull && lastFull.exit !== 0) return brief('build', `이 tree의 full FAIL${lastFull.red?.length ? ` — ${lastFull.red.join(' ')}` : ''}: build가 고친다(main을 합친 뒤·공격 파일이 더해진 뒤 red — 경계 밖 테스트면 spec: 줄로, 사고 85)`);
    if (tree && !ledger.some((e) => e.kind === 'verify' && e.mode === 'full' && e.exit === 0 && e.tree === tree)) return run(`verify.mjs full ${slug}`, 'red 0 — 이 tree의 full PASS가 원장에 없다(공격 파일만 더해진 tree): ship 조건');
    return run(`ship.mjs ${slug}`, 'red 0 — 8조건 출하');
  };
  const st = u.state;
  const P = packOf(st);
  if (!P) return brief(st, `${slug}의 ${st} 팩이 아직 없다`);
  const D = doneAfter(st, P.ts);
  if (!D) return spawn(st, `${st} 팩이 조립됐다 — 띄운다`);
  const specPack = packOf('spec');
  if (st === 'boot') return run(`ship.mjs ${slug}`, 'boot이 끝났다 — scaffold는 boot 팩 하나로 출하');
  if (st === 'adopt') return run(`ship.mjs ${slug}`, 'adopt가 끝났다 — 기존 코드의 첫 unit은 adopt 팩 하나로 출하(특성화 테스트의 quick·full)');
  if (st === 'spike') { // 처음 spike(원문 HIT) 뒤엔 spec · 늦은 spike(출하 때 diff-HIT, 사고 87) 뒤엔 측정 파일이 tree를 움직였다 — 이 tree의 증거를 다시 묶고 ship
    if (!specPack && u.kind !== 'system') return brief('spec', 'spike 측정이 끝났다 — 다음은 spec');
    return shipChecks();
  }
  if (st === 'spec') {
    const rp = last(mine, (e) => e.kind === 'redproof' && since(e, P.ts));
    if (!rp) return run(`redproof.mjs ${slug}`, u.kind === 'refactor' ? 'spec이 끝났다 — PIN 증명(핀은 base에서 초록)' : 'spec이 끝났다 — RED 증명');
    if (u.kind === 'refactor' || u.kind === 'pin') { // 동작 보존(7라운드)·이미 충족(13라운드): 핀이 base에서 초록이면 refactor는 build(구조만), pin은 attack(build 없음). re-spec 분기는 둘엔 없다(핀은 본래 충족이다)
      if (rp.pin_base !== 'green') return run(`redproof.mjs ${slug}`, '마지막 redproof가 FAIL(핀이 base에서 red 또는 눈먼 test_file) — 그 줄의 안내대로(CEO 결정이면 ask --hold)');
      if (u.kind === 'pin') return brief('attack', 'PIN — 이미 충족된 주장이 회귀 증거로 고정됐다(base에서 초록), build 없음 — attack이 그 주장이 깨지는 입력을 찾는다');
      return brief('build', 'PIN — 현재 동작이 고정됐다, 구조만 바꾼다(동작 보존)');
    }
    if (!rp.base_red) return run(`redproof.mjs ${slug}`, '마지막 redproof가 FAIL(base에서 green 또는 눈먼 test_file) — 그 줄의 안내대로(CEO 결정이면 ask --hold)');
    if (rp.head_green === true) return brief('attack', 're-spec: 기존 코드가 새 주장을 이미 만족한다 — build 불필요, attack은 새 바퀴');
    return brief('build', 'RED — red를 green으로');
  }
  const A = last(mine, (e) => e.kind === 'attack' && since(e, P.ts)); // 이 팩 뒤의 공격 결과(팩 안의 에이전트가 남긴 것도)
  // system-attack: 발견(한 번이라도 red였던 공격)이 없으면 초록 테스트뿐 — 산출물이 아니라 drop(탐색은 원장 attack 줄에 남는다)
  const finish = () => {
    if (A.red > 0) return brief('build', `공격 red ${A.red} — build 다시`);
    // 사고 80(19라운드 다섯째 날): system-4의 첫 공격 red 3이 build의 반려(「카드끼리 어긋남」)로 attack에게 돌아가 철회됐다(파일 삭제 → total 0) — 「한 번이라도 red」만 보던 next는 ship을 냈고 ship은 「adversary 테스트 0개」로 두 번 서 framework 정지.
    // 마지막 공격이 파일을 안 남겼으면 발견은 없다 — drop(철회도 원장 attack 줄에 남는다).
    const everRed = mine.some((e) => e.kind === 'attack' && e.red > 0);
    if (u.kind === 'system' && (A.total === 0 || !everRed)) return run(`work.mjs drop ${slug} "system-attack 발견 0 — 공격 파일 ${A.total}${everRed ? '(red였던 공격을 attack이 철회)' : ''}" --forget`, '발견 0 — 초록 테스트는 산출물이 아니다(탐색은 원장에 남는다)');
    return shipChecks();
  };
  if (st === 'build') {
    if (!attackRoundUsed(ledger, slug, u.created)) return brief('attack', 'build가 끝났다 — spec 뒤 한 바퀴의 공격');
    if (!A) return run(`verify.mjs attack ${slug}`, 'build가 고쳤다 — 기존 공격 테스트만 다시(attack 팩은 spec 뒤 한 바퀴)');
    return finish();
  }
  if (st === 'attack') {
    if (!A) return run(`verify.mjs attack ${slug}`, 'attack이 끝났다 — red를 센다');
    return finish();
  }
  return { kind: 'ceo', text: `${slug}의 상태 ${st}를 모른다 — node .garagiste/scripts/doctor.mjs` };
}
export function render(r) {
  if (r.kind === 'run') return `NEXT run ${r.cmd} — ${r.why}`;
  if (r.kind === 'spawn') return `NEXT spawn ${r.pack} ${r.slug} ${r.path} — ${r.why} · Agent(subagent_type: "${r.pack}", prompt: "${r.path}")를 띄우고 끝나면 ${S}/work.mjs spawned ${r.slug} ${r.pack} --tokens N --minutes M`;
  return `NEXT ${r.kind} ${r.text}`;
}
// 입력 조립 — next.mjs(한 줄을 낸다)와 conduct.mjs(그 줄을 실행한다)가 같은 함수를 쓴다. 판단 없음.
export function computeNext(c) {
  const units = listUnits(c.main, c.team);
  const ledger = readLedger(c.main, c.team);
  const packsDir = path.join(c.main, c.team.paths.packs);
  const packPath = (slug, pack) => {
    const f = fs.existsSync(packsDir) ? fs.readdirSync(packsDir).filter((x) => x.startsWith(`${slug}-${pack}-`) && x.endsWith('.md')).sort().pop() : null;
    return f ? path.relative(c.main, path.join(packsDir, f)).replace(/\\/g, '/') : `(팩 파일 없음 — ${S}/brief.mjs ${pack} ${slug})`;
  };
  const wtOf = (u) => { const d = worktreeDir(c.main, c.team, u.slug); const exists = fs.existsSync(d); const rebase = exists && rebaseInProgress(d); const base = exists && !rebase ? mergeBase(d, c.team.protected_branch) : null; const changed = base ? git(['diff', '--name-only', `${base}..HEAD`], d).stdout.split('\n').filter(Boolean) : []; const diffHit = checkBoundary(c.team, { files: changed }); const spikeDone = exists ? spikeComplete(readText(path.join(d, c.team.paths.measurements, `spike-${u.slug}.md`))) : false; return { exists, rebase, diffHit, spikeDone, unmerged: rebase ? unmergedFiles(d) : [], tree: exists && !rebase ? workTree(d) : null }; };
  const budget = budgetStatus({ units, ledger, team: c.team, ceoTouchTs: ceoTouch(c.main) });
  return nextStep({
    units, ledger, decisionsText: readText(path.join(c.main, c.team.paths.decisions)), scope: readJson(path.join(c.main, '.garagiste', 'scope.json'), null),
    backlog: parseBacklog(readText(path.join(c.main, c.team.paths.backlog))), stops: budget.stops, tokenStops: budget.tokenStops, systemAttack: c.team.system_attack !== false, wtOf, packPath, paths: c.team.paths,
  });
}
// 설치가 병들었으면 한 걸음도 내지 않는다 — conduct도 같은 검사를 먼저 한다
export function doctorGate(c) {
  const probs = blocking(diagnose(c.main));
  if (probs.length) fail(`FAIL doctor ${probs.length} — 설치가 병든 채로 돌지 않는다\n${probs.map((x) => `- ${x}`).join('\n')}`);
}
function main() {
  const c = ctx();
  doctorGate(c);
  out(render(computeNext(c)));
}
if (isMain(import.meta.url)) main();
