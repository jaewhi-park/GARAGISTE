// ship — 8조건 fail-closed. 통과하면 ff 머지 + LEDGER + STATUS. 이 스크립트만 보호 브랜치에 닿는다.
import fs from 'node:fs';
import path from 'node:path';
import { acceptanceFiles, appendLedger, ctx, currentBranch, dirtyFiles, fail, git, headSha, headTree, isClean, isMain, loadTeam, loadUnit, out, quarantineStray, readJson, readLedger, readText, rebaseInProgress, saveUnit, sh, shell, short, stamp, strayPaths, unmergedFiles, workTree, worktreeDir, writeJson, ceoTouch, listUnits, listFiles, repoFiles, withScratch, systemFound } from './lib.mjs';
import { parseTags } from './claims.mjs';
import { checkBoundary } from './boundary.mjs';
import { blocking, diagnose } from './doctor.mjs';
import { budgetStatus, openQuestions, render } from './state.mjs';
import { blindFiles, fullRun, probeNames } from './verify.mjs';

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
// 사고 41(필드 벤치 2 웹): 마지막 attack이 red 0의 공격 파일만 더하고 끝나면 체크포인트가 wip로 덮는다 — build는 고칠 것이 없고 그 파일을 커밋할 주체가 없어
// 「HEAD가 wip — build를 다시 띄워」가 반복됐다. 증거 파일(spike 측정·공격 테스트·적대 fixture)만 든 wip HEAD는 사고 16처럼 승격한다(메시지만, tree 불변 → 증거 유효).
export function evidenceCommitMessage(files, paths, slug) {
  const fs_ = files.map((f) => f.replace(/\\/g, '/'));
  if (spikeOnlyFiles(fs_, paths.measurements)) return `docs(spike): ${slug} 측정`;
  const under = (f, dir) => !!dir && f.startsWith(`${dir}/`);
  const ok = fs_.length > 0 && fs_.every((f) => under(f, paths.adversary) || under(f, paths.hostile) || f.startsWith(`${paths.measurements}/spike-`));
  return ok ? `test(${slug}): attack 산출물` : null;
}
export function evaluateShip(x) {
  const c = [];
  const scaffold = x.unit?.kind === 'scaffold';
  const teamChanged = !scaffold && (x.changed || []).includes('.garagiste/team.json'); // 검증 명령·예산의 재작성은 boot의 일이지 어느 팩의 일도 아니다 (HAZARDS 8형)
  c.push({ id: 'unit', ok: !!x.unit && x.unit.state !== 'shipped' && x.worktreeExists && x.clean && !teamChanged, why: !x.unit ? 'unit 없음' : x.unit.state === 'shipped' ? '이미 출하' : !x.worktreeExists ? 'worktree 없음' : !x.clean ? '작업 트리가 깨끗하지 않다' : teamChanged ? 'team.json 변경은 boot(scaffold) unit만 — 검증 명령·예산은 CEO 결정' : '' });
  // platform은 원장에 기록만 한다 — 어디서 돌았든 이 tree의 full PASS가 증거다. 대상-OS 보증은 @sensor 태그·target-OS 미관측 카운트의 일(HAZARDS 14; 옛 machine_os 필터는 그 일을 못 하면서 win32의 정당한 증거를 거부했다 — 첫 Windows 실기 사고).
  const full = x.ledger.find((e) => e.kind === 'verify' && e.mode === 'full' && e.exit === 0 && e.tree === x.tree);
  c.push({ id: 'full', ok: !!full, why: full ? '' : `이 tree(${short(x.tree)})의 verify full PASS 없음 — worktree에서 node .garagiste/scripts/verify.mjs full (마지막 커밋 뒤)` });
  // 사고 57(벤치 070f185 파이썬): scaffold의 redproof 자리는 러너 자신의 red 증명이다 — 인수·공격 자리의 slug 꼴(하이픈) 이름에 깨진 탐침을 두고 test_file이 exit≠0이어야 한다
  const blindRunner = scaffold ? (x.runnerBlind || []) : [];
  // system-attack(채용 2026-10-03): 이음새 공격 unit의 red 증명은 「공격이 결함을 찾았다」 — 이 생애에서 한 번이라도 red였던 공격 파일 ≥ 1(found). 발견 0이면 초록 테스트뿐이라 출하물이 아니다(drop).
  const system = x.unit?.kind === 'system';
  const rpAny = scaffold ? !blindRunner.length : system ? (x.found || 0) >= 1 : [...x.ledger].reverse().find((e) => e.kind === 'redproof' && e.slug === x.slug && e.base_red && e.head_green === true);
  const rp = scaffold || system ? rpAny : (rpAny && rpAny.tree === x.tree ? rpAny : null);
  c.push({ id: 'redproof', ok: !!rp, why: rp ? '' : scaffold ? `test_file이 인수·공격 자리의 하이픈 이름 파일을 돌리지 않는다 — 깨진 탐침도 exit 0: ${blindRunner.join(' ')} (0건 실행 — 예: 파일 이름을 모듈 이름으로 찾는 discover). slug에는 하이픈이 든다: test_file은 받은 경로의 파일을 그대로 돌려야 한다 → node .garagiste/scripts/brief.mjs boot ${x.slug} 재spawn(팩이 이 목록을 받는다) → ship 다시` : system ? `시스템 공격이 결함을 찾지 못했다(red였던 공격 파일 0) — 초록 테스트는 산출물이 아니다: node .garagiste/scripts/work.mjs drop ${x.slug} "system-attack 발견 0" --forget (탐색은 원장 attack 줄에 남는다)` : rpAny ? `redproof가 이전 tree의 것 — 마지막 커밋 뒤 다시: node .garagiste/scripts/redproof.mjs ${x.slug}` : `base red · head green 증명 없음 — node .garagiste/scripts/redproof.mjs ${x.slug}` });
  const atAny = [...x.ledger].reverse().find((e) => e.kind === 'attack' && e.slug === x.slug);
  const at = atAny && atAny.tree === x.tree ? atAny : null;
  const atOk = scaffold || !x.requireAttack || (!!at && at.red === 0 && at.total >= 1);
  c.push({ id: 'attack', ok: atOk, why: atOk ? '' : !atAny ? `attack 기록 없음 — brief.mjs attack ${x.slug} → 팩 spawn → node .garagiste/scripts/verify.mjs attack ${x.slug}` : !at ? `attack 기록이 이전 tree의 것 — 마지막 커밋 뒤 다시: node .garagiste/scripts/verify.mjs attack ${x.slug}` : at.total < 1 ? 'adversary 테스트 0개' : `adversary red ${at.red}` });
  const hit = x.boundaryHit ?? !!x.unit?.boundary?.hit;
  const sp = scaffold || !hit || spikeComplete(x.spikeText); // scaffold(boot)의 매니페스트는 그 unit의 일이라 spike를 요구하지 않는다
  // 사고 39(필드 벤치 1): build가 산출물 무시 줄(.gitignore)을 더한 diff-HIT에서 이 줄엔 다음 할 일이 없었다 — conductor는 Flow 5(출력 밖 추측 금지)대로 멈췄다
  c.push({ id: 'spike', ok: sp, why: sp ? '' : `boundary HIT(${x.boundaryWhy || '원문'})인데 spike 필수 행(${SPIKE_ROWS.join('·')}) 미완 → node .garagiste/scripts/brief.mjs spike ${x.slug} → 팩 spawn(${x.measurements || 'docs/measurements'}/spike-${x.slug}.md를 채운다) → node .garagiste/scripts/ship.mjs ${x.slug} 다시 — 측정 파일은 ship이 커밋한다, 측정이 허용 밖이면 그때 CEO에게` });
  const head = !/^wip:/.test(x.lastSubject || '');
  c.push({ id: 'head', ok: head, why: head ? '' : `HEAD가 wip 체크포인트 — ${scaffold ? 'boot' : 'build'}를 다시 띄워 끝내라` }); // 필드 시험: scaffold(boot)에 build를 가리켰다(사고 7의 rebase 문구와 같은 결함)
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
const DOC_OK = (team) => [team.paths.brief, team.paths.backlog, team.paths.status, team.paths.ledger_doc, team.paths.decisions, team.paths.report || 'docs/REPORT.md']; // 스크립트가 쓰는 CEO 문서는 ship의 문서 커밋에 실린다
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
// 사고 34(필드 시험 2): boot이 의존성 0이라 setup="true"를 두었는데 뒤 unit이 dev 의존성을 더했다 — ship은 「setup을 돌렸다, 다음 worktree가 물려받는다」고 했지만
// 아무것도 깔리지 않아 다음 unit의 full이 ERR_MODULE_NOT_FOUND로 막혔다. 설치 명령 없는 의존성 출하는 머지 전에 멈춘다 — 명령은 CEO 결정(R6).
export function setupGap({ depChanged, setup }) {
  if (!depChanged || !/^\s*(true|:|exit\s+0)?\s*$/.test(setup || '')) return null;
  return `FAIL ship: 의존성 출하인데 설치 명령이 없다(commands.setup=${JSON.stringify(setup || '')}) — 머지하면 main과 다음 worktree에 그 의존성이 없다(머지 전에 멈췄다). CEO 결정 한 줄(메인 루트): GARAGISTE_ADMIN=1 node .garagiste/scripts/work.mjs commands setup="<설치 명령 — npm install · pip install -e . · uv sync …>" → 다시 ship`;
}
// 사고 38: 남은 것은 CEO 몫이 아니다 — 프로젝트가 그 산출물을 무시하거나(.gitignore) 저장소에 담는(lockfile 커밋) 일은 unit의 것이고, 팩이 이 목록을 받는다
export function strayFail({ slug, pk, ran, stray, moved, span, leftNote = '' }) {
  return `FAIL ship: main에서 돈 ${ran}이 저장소에 파일을 남겼다 — ${stray.join(' ')} — 머지를 되돌리고(${span}) 그 파일은 ${moved}/로 옮겼다(지우지 않았다)${leftNote}. CEO 몫이 아니다 — unit의 일: 무시할 산출물(캐시·빌드 메타데이터·의존성 디렉터리)이면 .gitignore에${pk === 'boot' ? '' : '(boundary 파일이라 spike 행이 따른다)'}, 저장소에 둘 것(lockfile 등)이면 worktree에서 같은 명령으로 만들어 커밋 → node .garagiste/scripts/brief.mjs ${pk} ${slug} 재spawn(팩이 이 목록을 받는다) → ship 다시`;
}
// 사고 29(필드 시험 1): rebase는 unit의 역사를 한 커밋씩 다시 놓는다 — .gitignore 전의 wip 체크포인트가 담은 산출물(__pycache__)이
// worktree에 무시 파일로 남아 있으면 그 중간 커밋에서 「untracked would be overwritten」으로 멈췄다. 증거는 tree다: 역사를 그 tree 한 커밋으로 접고 올린다.
function squashUnit(wt, base) {
  const subjects = git(['log', '--reverse', '--format=%s', `${base}..HEAD`], wt).stdout.split('\n').filter(Boolean);
  if (subjects.length < 2) return;
  const orig = headSha(wt);
  const msg = `${git(['log', '-1', '--format=%B'], wt).stdout.trim()}\n\nSquashed: ${subjects.length}\n${subjects.map((x) => `- ${x}`).join('\n')}`;
  git(['reset', '-q', '--soft', base], wt);
  const cm = git(['commit', '-q', '-m', msg], wt, { GARAGISTE_WIP: '1' });
  if (cm.status) { git(['reset', '-q', '--soft', orig], wt); fail(`FAIL ship: unit 역사 접기 실패(되돌렸다) — ${(cm.stderr || cm.stdout).trim()}`); }
}
// 사고 57: scaffold의 명령은 아직 그 worktree에만 있다 — 탐침은 그 HEAD의 버릴 checkout에서
function runnerProbe(c, wt) {
  const tpl = readJson(path.join(wt, '.garagiste', 'team.json'), null)?.commands?.test_file;
  const names = probeNames(c.team.paths, repoFiles(wt, 'tests/unit').map((f) => `tests/unit/${f}`));
  return tpl && names.length ? withScratch(wt, 'HEAD', (d) => blindFiles(tpl, names, d)) : [];
}
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
  // 사고 16·41: 늦은 spike·마지막 attack 뒤 증거 파일만 남으면 build는 할 일이 없어 wip로 끝난다 — 그 wip HEAD는 정식 메시지로 승격(amend는 메시지만, tree 불변 → full·redproof·attack 증거 그대로 유효)
  if (exists && /^wip:/.test(git(['log', '-1', '--format=%s'], wt).stdout)) {
    const headFiles = git(['show', '--name-only', '--format='], wt).stdout.split('\n').filter(Boolean);
    const promoted = evidenceCommitMessage(headFiles, c.team.paths, slug);
    if (promoted) git(['commit', '--amend', '-q', '-m', promoted], wt, { GARAGISTE_WIP: '1' });
  }
  const runnerBlind = unit.kind === 'scaffold' && exists ? runnerProbe(c, wt) : [];
  const found = unit.kind === 'system' ? systemFound(ledger, slug, unit).length : 0; // 시스템 공격의 발견 — redproof.mjs의 system 분기와 같은 셈(사고 63)
  if (runnerBlind.length) appendLedger(c.main, c.team, { kind: 'runner_blind', slug, files: runnerBlind }); // boot 팩이 이 목록을 받는다
  const conds = evaluateShip({
    unit, slug, worktreeExists: exists, clean: exists && isClean(wt), tree, ledger, changed, runnerBlind, found,
    boundaryHit: !!unit.boundary?.hit || diffHit.hit, boundaryWhy: unit.boundary?.hit ? '원문' : diffHit.reasons.join(', '),
    requireAttack: c.team.require_attack !== false, spikeText: readText(path.join(wt, c.team.paths.measurements, `spike-${slug}.md`)), measurements: c.team.paths.measurements,
    lastSubject: exists ? git(['log', '-1', '--format=%s'], wt).stdout : '', stops: b.stops, proseKb: proseKb(c.main), proseMax: c.team.budgets.prose_kb_max,
    openQuestions: openQuestions(readText(path.join(c.main, c.team.paths.decisions))).filter((l) => l.includes(`(${slug})`)).map((l) => (l.match(/Q\d+/) || [''])[0]),
  });
  const bad = conds.filter((k) => !k.ok);
  if (bad.length) fail(`FAIL ship ${slug} ${bad.length}/8\n${bad.map((k) => `- ${k.id}: ${k.why}`).join('\n')}`);
  // 메인 worktree: 보호 브랜치, 문서 파일 외에는 깨끗해야
  if (currentBranch(c.main) !== c.team.protected_branch) fail(`FAIL ship: 메인 worktree가 ${c.team.protected_branch}에 있지 않다`);
  const dirty = dirtyFiles(c.main).filter((f) => !DOC_OK(c.team).includes(f));
  // 필드 시험 2(L2 1일차에 이은 둘째): CEO의 try가 메인 루트에 남긴 산출물(data/memos.json)이 출하를 막았는데 다음 할 일이 없었다 — conductor는 그 파일을 못 옮긴다(가드)
  if (dirty.length) fail(`FAIL ship: 메인 worktree에 미커밋 변경 — ${dirty.join(' ')} — 팀의 것이 아니다(팩·conductor는 main을 쓰지 않는다): CEO가 치운다(try 산출물이면 지우거나 옮기거나 .gitignore — CEO 결정) → ship 다시 · 다음 try는 node .garagiste/scripts/work.mjs try <slug>의 사본에서(main에 남지 않는다)`);
  // 통합: unit을 main 위로 올리고, tree가 바뀌었으면 full을 다시 돌린다
  // boot은 설치 명령을 자기 worktree의 team.json에 쓴다(머지 전 main엔 없다 — 사고 7의 통합 full과 같은 자리)
  const setupNow = unit.kind === 'scaffold' ? readJson(path.join(wt, '.garagiste', 'team.json'), null)?.commands?.setup : c.team.commands.setup;
  const gap = setupGap({ depChanged: changed.some((f) => DEP_MANIFEST.test(f.replace(/\\/g, '/'))), setup: setupNow });
  if (gap) fail(gap);
  if (!resumed) squashUnit(wt, base);
  const preHead = headSha(wt);
  const rb = git(['rebase', c.team.protected_branch], wt);
  if (rb.status && !resolveRebaseTeamJson(wt)) {
    const files = unmergedFiles(wt);
    // 필드 시험 1: 첫 줄만 내 파일 이름이 잘렸다 — git의 hint 줄만 빼고 전문
    if (!files.length) { git(['rebase', '--abort'], wt); fail(`FAIL ship: rebase 실패(되돌렸다 — worktree는 그대로) — ${(rb.stderr || rb.stdout).split('\n').filter((l) => l.trim() && !/^hint:/.test(l)).slice(0, 12).join('\n')}`); }
    appendLedger(c.main, c.team, { kind: 'ship_conflict', slug, files, tree, head: resumed?.head || preHead });
    fail(conflictFail(c.team.protected_branch, files, slug, pk));
  }
  const newTree = headTree(wt);
  if (newTree !== tree) {
    // 통합 tree는 자기 자신의 명령으로 검증한다 — boot의 commands는 머지 전 main엔 없다(사고 7에서 노출: main의 빈 full로 crash)
    const wtCmds = readJson(path.join(wt, '.garagiste', 'team.json'), null)?.commands || {};
    const fullCmd = wtCmds.full || c.team.commands.full;
    if (!fullCmd) fail('FAIL ship: 통합 tree 재검증 불가 — commands.full 비어 있음');
    const r = fullRun({ main: c.main, team: c.team, root: wt, cmd: fullCmd, testFile: wtCmds.test_file || c.team.commands.test_file }); // 사고 44: 통합 tree의 full도 「전부」
    appendLedger(c.main, c.team, { kind: 'verify', mode: 'full', tree: newTree, head: headSha(wt), exit: r.status, platform: process.platform, where: unit.worktree, integration: true });
    if (r.status) fail(`FAIL ship: 통합 tree에서 full FAIL — main이 움직였다, build 재spawn\n${r.tail}`);
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
  const ledgerDoc = path.join(c.main, c.team.paths.ledger_doc);
  const backlog = path.join(c.main, c.team.paths.backlog);
  const prevUnit = { state: unit.state, sensor: unit.sensor };
  let row = null;
  // 원자성(R9): 머지 뒤 어느 FAIL도 main에 「머지는 됐는데 …」를 남기지 않는다 — 되돌리기는 이 한 곳이다 (증거 jsonl은 append-only라 ship_rollback 줄로 남긴다).
  // 사고 38: main에서 돈 명령이 남긴 것은 먼저 보존 폴더로 옮긴다 — 남겨 두면 다음 ship이 그것을 CEO의 것으로 읽었다. 바뀐 추적 파일이 reset --keep을 막지도 않는다.
  const undo = (why) => {
    const stray = strayPaths(c.main, DOC_OK(c.team));
    const dir = path.join(c.main, '.garagiste', 'session', 'ship-stray', `${slug}-${stamp()}`);
    const left = stray.length ? quarantineStray(c.main, stray, dir) : [];
    const moved = stray.length ? path.relative(c.main, dir).replace(/\\/g, '/') : null;
    const rs = git(['reset', '--keep', prevHead], c.main);
    if (row) {
      unit.state = prevUnit.state; unit.sensor = prevUnit.sensor; unit.shipped = null; delete unit.head; saveUnit(c.main, c.team, unit);
      const led = readText(ledgerDoc);
      if (led.endsWith(row)) fs.writeFileSync(ledgerDoc, led.slice(0, -row.length));
      if (fs.existsSync(backlog)) fs.writeFileSync(backlog, readText(backlog).replace(new RegExp(`^- \\[x\\] ${slug} `, 'm'), `- [ ] ${slug} `));
      fs.writeFileSync(path.join(c.main, c.team.paths.status), render(c).text);
    }
    appendLedger(c.main, c.team, { kind: 'ship_rollback', slug, from: head, to: prevHead, why, ...(moved ? { stray: stray.map((e) => e.path), moved, left } : {}) });
    const span = `${short(head)} → ${short(prevHead)}`;
    const leftNote = `${left.length ? ` (옮기지 못해 그 자리에 둠: ${left.join(' ')} — 잡고 있는 프로세스를 닫고 지운다)` : ''}${rs.status ? ` — 단 reset --keep이 실패해 main은 머지된 채다(${short(head)}): ${(rs.stderr || rs.stdout).split('\n')[0]} — CEO가 git status로 본다` : ''}`;
    return { stray: stray.map((e) => e.path), moved, span, leftNote, back: `머지를 되돌렸다(${span})${moved ? ` · main에 남은 ${stray.map((e) => e.path).join(' ')}은 ${moved}/로 옮겼다` : ''}${leftNote}` };
  };
  // 사고 21(3차 실기): 의존성을 새로 들이는 출하는 main 설치 없이 머지 뒤 quick이 반드시 red다 — 설치는 머지 전엔 불가(새 매니페스트가 main에 없다).
  // 매니페스트가 바뀌었고 commands.setup이 있으면 main quick 전에 설치를 돌린다. build 재spawn은 이 실패의 해법이 아니다.
  const depChanged = changed.some((f) => DEP_MANIFEST.test(f.replace(/\\/g, '/')));
  const ranSetup = !!(depChanged && c.team.commands.setup);
  if (ranSetup) {
    const su = shell(c.team.commands.setup, { cwd: c.main });
    if (su.status) fail(`FAIL ship: 의존성 설치(commands.setup) 실패 — ${undo('setup FAIL').back}. 설치 명령을 고치고 다시 ship\n${(su.stderr || su.stdout).split('\n').slice(-5).join('\n')}`);
  }
  const tags = acceptanceFiles(c.main, c.team, slug).map((f) => parseTags(readText(path.join(c.main, f))));
  unit.sensor = tags.find((t) => t.sensor.startsWith('human'))?.sensor || 'machine';
  unit.state = 'shipped'; unit.shipped = new Date().toISOString(); unit.head = head; saveUnit(c.main, c.team, unit);
  if (!fs.existsSync(ledgerDoc)) fs.writeFileSync(ledgerDoc, '# LEDGER — 증명 커밋. 한 줄 = 출하 하나 = 기계가 확인한 사실의 목록.\n\n| 날짜 | unit | head | tree | full | redproof | attack 선발견→red/총 | sensor |\n|---|---|---|---|---|---|---|---|\n');
  // Q4 계측: attack 선발견 — CEO의 tried fail(후발견)과 대조하는 열. 정의는 attackCell 하나(사고 23)
  const atCell = unit.kind === 'scaffold' ? '—' : attackCell({ ledger, slug, since: unit.created });
  const rpCol = unit.kind === 'scaffold' ? 'scaffold' : unit.kind === 'system' ? 'system' : 'base_red head_green';
  row = `| ${unit.shipped.slice(0, 10)} | ${slug} | ${short(head)} | ${short(newTree)} | PASS | ${rpCol} | ${atCell} | ${unit.sensor} |\n`;
  fs.appendFileSync(ledgerDoc, row);
  if (fs.existsSync(backlog)) fs.writeFileSync(backlog, readText(backlog).replace(new RegExp(`^- \\[ \\] ${slug} `, 'm'), `- [x] ${slug} `));
  fs.writeFileSync(path.join(c.main, c.team.paths.status), render(c).text);
  const docs = DOC_OK(c.team).filter((f) => fs.existsSync(path.join(c.main, f)));
  git(['add', ...docs], c.main);
  const q = shell(c.team.commands.quick, { cwd: c.main });
  appendLedger(c.main, c.team, { kind: 'verify', mode: 'quick', tree: workTree(c.main), head, exit: q.status, platform: process.platform, where: '.', ship: true });
  if (q.status) fail(`FAIL ship: 머지 뒤 main quick FAIL — ${undo('main quick FAIL').back}. ${depChanged ? '의존성 출하다 — commands.setup(설치 명령)을 등록·수리하고 다시 ship하라. build 재spawn은 해법이 아니다' : '원인은 통합: build 재spawn 뒤 다시 ship'}`);
  // 사고 38(필드 벤치 두 곳): main에서 돈 setup·quick의 산출물(package-lock.json · *.egg-info · __pycache__)이 남아 문서 커밋이 게이트(인덱스 ≠ 작업 트리)에 막혔다 —
  // 머지·shipped·ship 줄만 남은 반쪽 출하였고(재ship은 「이미 출하」), 남은 것은 다음 ship을 「CEO가 치운다」로 막았다. 무시할지 커밋할지는 unit의 일이다.
  if (strayPaths(c.main, DOC_OK(c.team)).length) fail(strayFail({ slug, pk, ran: ranSetup ? 'setup·quick' : 'quick', ...undo('main stray') }));
  const msg = `ship(${slug}): ${unit.origin.replace(/\n/g, ' ').slice(0, 60)}\n\nUnit: ${slug}\nKind: ${unit.kind}\nHead: ${short(head)}\nFull: ${short(newTree)}\nRedproof: ${rpCol}\nAttack: ${atCell}\nSensor: ${unit.sensor}`;
  const cm = git(['commit', '-q', '-m', msg], c.main, { GARAGISTE_SHIP: '1' });
  if (cm.status) fail(`FAIL ship: 문서 커밋 실패 — ${undo('docs commit FAIL').back}\n${(cm.stderr || cm.stdout).trim()}`);
  appendLedger(c.main, c.team, { kind: 'ship', slug, head, tree: newTree, sensor: unit.sensor }); // 문서 커밋 뒤에만 — 유령 출하 줄이 무인 카운터에 잡히지 않게
  git(['worktree', 'remove', wt], c.main);
  out(`SHIPPED ${slug} ${short(head)} sensor=${unit.sensor}`);
  // 사고 10(2차 실기): 의존성은 unit worktree에만 설치되고 worktree는 ship 뒤 사라진다 — 메인이 설치하지 않으면 다음 unit이 맨손이 되어 스펙(결정된 스택)을 우회한다
  if (depChanged)
    out(`NOTE: 의존성 파일이 바뀐 출하 — ${c.team.commands.setup ? 'commands.setup을 main에서 이미 돌렸다' : '메인 루트에서 설치를 한 번 돌리고 commands.setup 등록을 권한다(npm ci·uv sync 등)'}. 다음 unit의 worktree가 물려받는다.`);
  // scaffold(boot)엔 try.md가 없다 — 써보기는 실행·검증 명령이다 (2차 실기: 빈 파일을 가리켜 conductor가 즉석 안내를 지어냈다)
  out(unit.kind === 'scaffold'
    ? `TRY: 실행 \`${c.team.commands.run || c.team.commands.quick}\` → node .garagiste/scripts/work.mjs tried ${slug} ok|fail`
    : unit.kind === 'system' ? `TRY: 이음새 공격이 고친 흐름 — tests/adversary/${slug}-* 가 가리키는 대로 → node .garagiste/scripts/work.mjs tried ${slug} ok|fail`
      : `TRY: docs/units/${slug}/try.md → node .garagiste/scripts/work.mjs tried ${slug} ok|fail`);
}
if (isMain(import.meta.url)) main();
