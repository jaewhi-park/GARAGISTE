// redproof — 인수 테스트가 base에서 red, head에서 green임을 기계가 증명한다. old code에서도 통과하는 테스트는 테스트가 아니다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { acceptanceFiles, appendLedger, ctx, fail, git, headSha, isMain, linkDeps, mergeBase, out, workTree } from './lib.mjs';
import { runFiles } from './verify.mjs';

export function verdict(baseResults, headResults) {
  const base_red = baseResults.length > 0 && baseResults.every((r) => r.exit !== 0);
  const head_green = headResults === null ? null : headResults.length > 0 && headResults.every((r) => r.exit === 0);
  return { base_red, head_green, ok: base_red && head_green !== false };
}
function main() {
  const slug = process.argv[2];
  if (!slug) fail('사용법: redproof.mjs <slug>');
  const c = ctx();
  const files = acceptanceFiles(c.root, c.team, slug);
  if (!files.length) fail(`FAIL redproof ${slug}: ${c.team.paths.acceptance}/${slug}* 없음`);
  const base = mergeBase(c.root, c.team.protected_branch);
  const codeChanged = base ? git(['diff', '--name-only', `${base}..HEAD`, '--', '.', `:!${c.team.paths.acceptance}`, ':!docs'], c.root).stdout.trim() !== '' : false;
  const tree = workTree(c.root);
  if (!base || !codeChanged) {
    // 아직 제품 코드가 없다: 지금 자리에서 red면 충분하다
    const v = verdict(runFiles(c, files), null);
    appendLedger(c.main, c.team, { kind: 'redproof', slug, tree, head: headSha(c.root), base, base_red: v.base_red, head_green: null, files: files.length });
    return v.base_red ? out(`RED ${slug} ${files.length}/${files.length}`) : fail(`FAIL redproof ${slug}: base에서 green인 테스트가 있다 — 테스트가 아니다`);
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
  const v = verdict(baseRes, runFiles(c, files));
  appendLedger(c.main, c.team, { kind: 'redproof', slug, tree, head: headSha(c.root), base, base_red: v.base_red, head_green: v.head_green, files: files.length });
  if (v.ok) return out(`PASS redproof ${slug} base_red head_green`);
  fail(`FAIL redproof ${slug} base_red=${v.base_red} head_green=${v.head_green}`);
}
if (isMain(import.meta.url)) main();
