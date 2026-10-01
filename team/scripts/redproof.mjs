// redproof — 인수 테스트가 base에서 red, head에서 green임을 기계가 증명한다. old code에서도 통과하는 테스트는 테스트가 아니다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { acceptanceFiles, appendLedger, ctx, fail, git, headSha, isMain, linkDeps, mergeBase, out, readJson, slugRoot, unitFile, workTree } from './lib.mjs';
import { runFiles } from './verify.mjs';

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
export function baseGreenAdvice(slug, files) {
  return `FAIL redproof ${slug}: base에서 green — ${files.join(' ')} — 기존 코드가 이 주장을 이미 만족한다(old code에서도 통과하는 테스트는 테스트가 아니다). CEO 결정(예/아니오로 묻는다): 이미 충족으로 닫는다 → node .garagiste/scripts/work.mjs drop ${slug} "이미 충족 — <근거>" --forget (주장 파일은 dropped 브랜치에 남는다) · 아니면 CEO가 더 말한 것을 work.mjs brief로 받고 brief.mjs spec ${slug} 재spawn`;
}
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
  const files = acceptanceFiles(c.root, c.team, slug);
  if (!files.length) fail(`FAIL redproof ${slug}: ${c.team.paths.acceptance}/${slug}* 없음`);
  const base = mergeBase(c.root, c.team.protected_branch);
  const codeChanged = base ? git(['diff', '--name-only', `${base}..HEAD`, '--', '.', `:!${c.team.paths.acceptance}`, ':!docs'], c.root).stdout.trim() !== '' : false;
  const tree = workTree(c.root);
  if (!base || !codeChanged) {
    // 아직 제품 코드가 없다: 지금 자리에서 red면 충분하다
    const res = runFiles(c, files);
    const v = verdict(res, null);
    appendLedger(c.main, c.team, { kind: 'redproof', slug, tree, head: headSha(c.root), base, base_red: v.base_red, head_green: null, files: files.length });
    return v.base_red ? out(`RED ${slug} ${files.length}/${files.length}`) : fail(baseGreenAdvice(slug, res.filter((r) => r.exit === 0).map((r) => r.file)));
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'garagiste-redproof-'));
  let baseRes;
  try {
    const add = git(['worktree', 'add', '--detach', '-q', tmp, base], c.root);
    if (add.status) fail(`FAIL redproof: base worktree 생성 실패 — ${add.stderr}`);
    for (const f of files) { fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.copyFileSync(path.join(c.root, f), path.join(tmp, f)); }
    linkDeps(c.root, tmp);
    baseRes = runFiles({ ...c, root: tmp }, files);
  } finally { git(['worktree', 'remove', '--force', tmp], c.root); }
  const headRes = runFiles(c, files);
  const v = verdict(baseRes, headRes);
  appendLedger(c.main, c.team, { kind: 'redproof', slug, tree, head: headSha(c.root), base, base_red: v.base_red, head_green: v.head_green, files: files.length });
  const state = readJson(unitFile(c.main, c.team, slug), null)?.state;
  const o = outcome({ ...v, state });
  const redAtHead = headRes.filter((r) => r.exit !== 0).map((r) => r.file);
  if (o === 'PASS') return out(`PASS redproof ${slug} base_red head_green${state === 'spec' ? ' — 기존 코드가 새 주장을 이미 만족한다(re-spec): build 불필요, attack·ship은 새 tree에서 다시' : ''}`);
  if (o === 'RED') return out(`RED ${slug} ${redAtHead.length}/${files.length} — 기존 코드 위의 새 주장(re-spec): 다음은 build → node .garagiste/scripts/brief.mjs build ${slug}`);
  if (!v.base_red) fail(baseGreenAdvice(slug, baseRes.filter((r) => r.exit === 0).map((r) => r.file)));
  fail(`FAIL redproof ${slug} base_red=true head_green=false — head에서 red: ${redAtHead.join(' ')} → build가 덜 끝났다: node .garagiste/scripts/brief.mjs build ${slug} 뒤 재spawn (build가 spec: 줄을 남겼으면 그 줄로: node .garagiste/scripts/brief.mjs spec ${slug} --return "<그 줄>")`);
}
if (isMain(import.meta.url)) main();
