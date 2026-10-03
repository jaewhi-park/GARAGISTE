// redproof — 인수 테스트가 base에서 red, head에서 green임을 기계가 증명한다. old code에서도 통과하는 테스트는 테스트가 아니다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { acceptanceFiles, appendLedger, ctx, fail, git, headSha, holdAsk, isMain, linkDeps, mergeBase, out, readJson, readLedger, rebaseAdvice, rebaseInProgress, slugRoot, systemFound, unitFile, unmergedFiles, withScratch, workTree } from './lib.mjs';
import { blindFiles, runFiles } from './verify.mjs';

export function verdict(baseResults, headResults) {
  const base_red = baseResults.length > 0 && baseResults.every((r) => r.exit !== 0);
  const head_green = headResults === null ? null : headResults.length > 0 && headResults.every((r) => r.exit === 0);
  return { base_red, head_green, ok: base_red && head_green !== false };
}
// 사고 24(4차 실기): 기존 코드 위의 re-spec(RESPEC·Flow 7 수정)에서 새 주장은 head에서 red가 정상이다 — spec 팩의 끝(RED)을
// 코드가 있다는 이유로 FAIL로 만들자 루프가 안내 없이 멈췄다. head red의 뜻은 unit 정체가 가른다: spec이면 새 주장, 그 밖이면 build 미완.
// 어느 쪽이든 원장엔 head_green:false가 남아 ship(조건 redproof: head_green === true)은 열리지 않는다.
// 사고 36(필드 시험 2): 앞 unit이 이미 만든 기능(save-memo가 data/memos.json에 써서 「재시작 뒤 보존」이 참)의 주장은 base에서 green이다 — spec은 옳게 red를 지어내지 않았지만
// FAIL엔 다음 할 일이 없었다. 둘 다 CEO 결정이다: 이미 충족으로 닫거나(drop --forget — 이 unit을 기다리는 unit의 선행이 풀린다), 원문을 더 말해 다시 spec.
// 사고 47(필드 벤치 넷): 먼저 출하된 unit이 주장의 일부만 채우면(BOM 처리) drop은 남은 red 주장(CEO가 정한 CP949)까지 닫는다 — 충족된 파일만 빼는 길
export function baseGreenAdvice(slug, files, red = []) {
  if (red.length) return `FAIL redproof ${slug}: 부분 충족 — base에서 green ${files.join(' ')} · base에서 red ${red.join(' ')} — drop은 red 주장까지 닫는다. CEO 결정(예/아니오로 묻는다): 이미 충족된 주장만 뺀다 → node .garagiste/scripts/brief.mjs spec ${slug} --met "<CEO 말 그대로>" → 팩 spawn(그 파일만 뺀다) → redproof 다시 · 아니면 CEO가 더 말한 것을 work.mjs brief로 받고 brief.mjs spec ${slug} 재spawn · ${holdAsk(slug, 'redproof 부분 충족 — 이미 충족된 주장만 뺄까')}`;
  return `FAIL redproof ${slug}: base에서 green — ${files.join(' ')} — 기존 코드가 이 주장을 이미 만족한다(old code에서도 통과하는 테스트는 테스트가 아니다). CEO 결정(예/아니오로 묻는다): 이미 충족으로 닫는다 → node .garagiste/scripts/work.mjs drop ${slug} "이미 충족 — <근거>" --forget (주장 파일은 dropped 브랜치에 남는다) · 아니면 CEO가 더 말한 것을 work.mjs brief로 받고 brief.mjs spec ${slug} 재spawn · ${holdAsk(slug, 'redproof base에서 green — 이미 충족으로 닫을까')}`;
}
// 사고 57(벤치 070f185 파이썬): base green이 눈먼 test_file(0건 실행)이면 이미 충족이 아니다 — drop은 만들지도 않은 기능을 닫는다. test_file·tests/harness는 boot의 것(R6)이라
// 이 unit에서는 못 고친다: 하네스를 고치는 scaffold unit을 먼저 출하하고(그 ship이 같은 탐침으로 본다) 이 unit은 그 뒤에 새로 연다.
export function blindAdvice(slug, files, unit = {}) {
  const fix = `${slug}-harness`; const m = unit.milestone || 'M?';
  return `FAIL redproof ${slug}: test_file이 이 파일을 실제로 돌리지 않는다 — ${files.join(' ')}: 같은 자리·같은 이름의 깨진 사본도 exit 0(0건 실행 — 예: 파일 이름을 모듈 이름으로 찾는 discover는 하이픈 이름을 건너뛴다). 이미 충족이 아니다 — 검증 명령의 결함이고 test_file·tests/harness는 boot의 것이다. CEO 결정(예/아니오로 묻는다): 하네스를 고치는 scaffold unit을 먼저 → node .garagiste/scripts/work.mjs drop ${slug} "test_file이 이 unit의 파일을 돌리지 않는다 — 하네스 먼저" (--forget 없이: 줄은 남아 새로 열린다) → node .garagiste/scripts/work.mjs add ${fix} "test_file이 ${files.join(' ')}을 돌리지 않는다 — 받은 경로의 파일을 그대로 돌리게" --kind scaffold --milestone ${m} → node .garagiste/scripts/work.mjs needs ${slug} ${[...(unit.needs || []), fix].join(',')} → node .garagiste/scripts/work.mjs scope --milestone ${m} → work.mjs seed (그 ship이 같은 탐침으로 본다) · ${holdAsk(slug, 'test_file이 이 unit의 파일을 돌리지 않는다 — 하네스 scaffold unit을 먼저 할까')}`;
}
const split = (res) => [res.filter((r) => r.exit === 0).map((r) => r.file), res.filter((r) => r.exit !== 0).map((r) => r.file)];
const greenRed = (res) => { const [g] = split(res); return g.length && g.length < res.length ? { base_green: g } : {}; }; // 부분 충족의 증거 — brief.mjs spec --met가 읽는다
export function outcome({ base_red, head_green, state }) {
  if (!base_red) return 'FAIL';
  if (head_green === false) return state === 'spec' ? 'RED' : 'FAIL';
  return head_green ? 'PASS' : 'RED';
}
function main() {
  const slug = process.argv[2];
  if (!slug) fail('사용법: redproof.mjs <slug>');
  const c0 = ctx();
  const c = { ...c0, root: slugRoot(c0, slug) }; // 사고 9: 어디서 불러도 unit worktree가 뿌리
  if (rebaseInProgress(c.root)) fail(rebaseAdvice(`redproof ${slug}`, slug, unmergedFiles(c.root), c.team.protected_branch)); // 사고 58: HEAD가 onto(main)라 base = head
  // 사고 63(L2 5판 리눅스 2라운드): 시스템 공격 unit(work.mjs system)엔 인수 테스트가 없다 — red 증명은 「공격이 결함을 찾았다」(ship 조건 redproof = 한 번이라도 red였던 공격 파일 ≥1).
  // 여기서 「acceptance 없음」 FAIL을 내자 build 팩이 막힌 것으로 보고하고 conductor가 next의 ship 대신 brief spec --return을 돌렸다(원장 fail 줄 둘 · 이탈 1턴).
  const unit = readJson(unitFile(c.main, c.team, slug), null);
  if (unit?.kind === 'system') {
    const found = systemFound(readLedger(c.main, c.team), slug, unit);
    if (!found.length) fail(`FAIL redproof ${slug}: 시스템 공격 발견 0(red였던 공격 파일 없음) — 초록 테스트는 산출물이 아니다: node .garagiste/scripts/work.mjs drop ${slug} "system-attack 발견 0" --forget`);
    return out(`PASS redproof ${slug}: system — 발견 ${found.length}(red였던 공격 파일 ${found.join(' ')}) — 인수 테스트 없음, 증명은 공격 파일의 red→green(ship 조건 redproof = 발견 ≥1)`);
  }
  const files = acceptanceFiles(c.root, c.team, slug);
  if (!files.length) fail(`FAIL redproof ${slug}: ${c.team.paths.acceptance}/${slug}* 없음`);
  const base = mergeBase(c.root, c.team.protected_branch);
  const codeChanged = base ? git(['diff', '--name-only', `${base}..HEAD`, '--', '.', `:!${c.team.paths.acceptance}`, ':!docs'], c.root).stdout.trim() !== '' : false;
  const tree = workTree(c.root);
  if (!base || !codeChanged) {
    // 아직 제품 코드가 없다: 지금 자리에서 red면 충분하다
    const res = runFiles(c, files);
    const v = verdict(res, null);
    const green = split(res)[0];
    const blind = green.length ? withScratch(c.root, 'HEAD', (d) => blindFiles(c.team.commands.test_file, green, d)) : [];
    appendLedger(c.main, c.team, { kind: 'redproof', slug, tree, head: headSha(c.root), base, base_red: v.base_red, head_green: null, files: files.length, ...greenRed(res), ...(blind.length ? { blind } : {}) });
    if (blind.length) fail(blindAdvice(slug, blind, readJson(unitFile(c.main, c.team, slug), null) || {}));
    return v.base_red ? out(`RED ${slug} ${files.length}/${files.length}`) : fail(baseGreenAdvice(slug, ...split(res)));
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-redproof-'));
  let baseRes; let blind = [];
  try {
    const add = git(['worktree', 'add', '--detach', '-q', tmp, base], c.root);
    if (add.status) fail(`FAIL redproof: base worktree 생성 실패 — ${add.stderr}`);
    for (const f of files) { fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.copyFileSync(path.join(c.root, f), path.join(tmp, f)); }
    linkDeps(c.root, tmp);
    baseRes = runFiles({ ...c, root: tmp }, files);
    const green = split(baseRes)[0];
    if (green.length) blind = blindFiles(c.team.commands.test_file, green, tmp); // 사고 57: base worktree는 버릴 checkout — 탐침은 그 자리에서
  } finally { git(['worktree', 'remove', '--force', tmp], c.root); }
  if (blind.length) {
    appendLedger(c.main, c.team, { kind: 'redproof', slug, tree, head: headSha(c.root), base, base_red: false, head_green: null, files: files.length, ...greenRed(baseRes), blind });
    fail(blindAdvice(slug, blind, readJson(unitFile(c.main, c.team, slug), null) || {}));
  }
  const headRes = runFiles(c, files);
  const v = verdict(baseRes, headRes);
  appendLedger(c.main, c.team, { kind: 'redproof', slug, tree, head: headSha(c.root), base, base_red: v.base_red, head_green: v.head_green, files: files.length, ...greenRed(baseRes) });
  const state = readJson(unitFile(c.main, c.team, slug), null)?.state;
  const o = outcome({ ...v, state });
  const redAtHead = headRes.filter((r) => r.exit !== 0).map((r) => r.file);
  if (o === 'PASS') return out(`PASS redproof ${slug} base_red head_green${state === 'spec' ? ' — 기존 코드가 새 주장을 이미 만족한다(re-spec): build 불필요, attack·ship은 새 tree에서 다시' : ''}`);
  if (o === 'RED') return out(`RED ${slug} ${redAtHead.length}/${files.length} — 기존 코드 위의 새 주장(re-spec): 다음은 build → node .garagiste/scripts/brief.mjs build ${slug}`);
  if (!v.base_red) fail(baseGreenAdvice(slug, ...split(baseRes)));
  fail(`FAIL redproof ${slug} base_red=true head_green=false — head에서 red: ${redAtHead.join(' ')} → build가 덜 끝났다: node .garagiste/scripts/brief.mjs build ${slug} 뒤 재spawn (build가 spec: 줄을 남겼으면 그 줄로: node .garagiste/scripts/brief.mjs spec ${slug} --return "<그 줄>")`);
}
if (isMain(import.meta.url)) main();
