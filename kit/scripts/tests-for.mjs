// tests-for — 변경 파일에서 돌릴 테스트 파일을 낸다. 판단 없음: 패턴을 대입하고 디스크에 있는 것만 남긴다.
// 사용: node kit/tests-for.mjs [files...]   (인자가 없으면 작업 트리의 변경 파일)
// 출력: 테스트 파일 한 줄에 하나(stdout) · 매핑 없는 파일은 `매핑 없음: <file>`(stderr) · 종료 코드는 항상 0 — 사실만 낸다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// 슬롯: {dir} 파일의 폴더 · {rel} 첫 세그먼트(src 등)를 뗀 폴더 · {name} 확장자 없는 이름 · {ext} 확장자
export const DEFAULT_PATTERNS = [
  '{dir}/{name}.test.{ext}', '{dir}/{name}.spec.{ext}', '{dir}/__tests__/{name}.test.{ext}',
  'tests/{rel}/{name}.test.{ext}', 'test/{rel}/{name}.test.{ext}', 'tests/unit/{name}.test.{ext}',
  'tests/{name}.test.mjs', 'tests/{name}.test.js',
  'tests/{rel}/test_{name}.py', '{dir}/test_{name}.py', '{dir}/tests/test_{name}.py',
  '{dir}/{name}_test.go',
];

export const toPosix = (p) => String(p).replace(/\\/g, '/').replace(/^\.\//, '');
// 테스트 파일인가 — 이름 꼴로만 본다(변경된 파일이 테스트면 그 자체가 돌릴 대상)
export const isTestFile = (file) => /(^|\/)(test_[^/]+\.py|[^/]+_test\.(go|py)|[^/]+\.(test|spec)\.[^/.]+)$/.test(toPosix(file));

export function slots(file) {
  const f = toPosix(file);
  const dir = path.posix.dirname(f);
  const base = path.posix.basename(f);
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1) : '';
  const name = dot > 0 ? base.slice(0, dot) : base;
  const d = dir === '.' ? '' : dir;
  return { dir: d, rel: d.split('/').slice(1).join('/'), name, ext };
}
export function candidates(file, patterns = DEFAULT_PATTERNS) {
  const s = slots(file);
  const out = [];
  for (const p of patterns) {
    let c = p.replaceAll('{dir}', s.dir).replaceAll('{rel}', s.rel).replaceAll('{name}', s.name).replaceAll('{ext}', s.ext);
    if (c.includes('{')) continue; // 모르는 슬롯은 건너뛴다
    c = c.replace(/\/{2,}/g, '/').replace(/^\/+/, ''); // 빈 슬롯이 남긴 이중 슬래시
    if (c && c !== toPosix(file) && !out.includes(c)) out.push(c);
  }
  return out;
}
// 파일 → 돌릴 테스트와 매핑 없는 파일. exists는 주입(테스트에서 디스크 없이)
export function testsFor(files, patterns = DEFAULT_PATTERNS, exists = () => false) {
  const tests = []; const unmapped = [];
  const add = (t) => { if (!tests.includes(t)) tests.push(t); };
  for (const f0 of files) {
    const f = toPosix(f0);
    if (!f) continue;
    if (isTestFile(f)) { if (exists(f)) add(f); continue; } // 지워진 테스트 파일은 돌릴 수 없다
    const hit = candidates(f, patterns).filter(exists);
    if (!hit.length) unmapped.push(f);
    hit.forEach(add);
  }
  return { tests, unmapped };
}
// 작업 트리의 변경 파일(스테이지 · 미스테이지 · 추적 안 됨). git이 없으면 빈 목록.
export function changedFiles(root) {
  const r = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) return [];
  return parsePorcelain(r.stdout);
}
export function parsePorcelain(text) {
  const files = [];
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) continue;
    let p = line.slice(3).trim();
    if (p.includes(' -> ')) p = p.split(' -> ').pop(); // 이름 바꿈은 새 이름
    if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
    if (line[0] === 'D' || line[1] === 'D') continue; // 지워진 파일
    files.push(toPosix(p));
  }
  return files;
}
// 인자로 온 절대 경로는 저장소 상대 경로로(패턴과 exists는 상대 경로로 돈다)
export const relToRoot = (root, f) => (path.isAbsolute(f) ? toPosix(path.relative(root, f)) : toPosix(f));
export const kitDir = (metaUrl) => path.dirname(fileURLToPath(metaUrl));
export const kitRoot = (metaUrl) => path.dirname(kitDir(metaUrl));
export function readJson(p, fallback) { try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, '')); } catch { return fallback; } }

function main() {
  const root = kitRoot(import.meta.url);
  const config = readJson(path.join(kitDir(import.meta.url), 'check.json'), {});
  const patterns = Array.isArray(config.tests) && config.tests.length ? config.tests : DEFAULT_PATTERNS;
  const files = process.argv.slice(2).length ? process.argv.slice(2).map((f) => relToRoot(root, f)) : changedFiles(root);
  if (!files.length) { process.stderr.write('변경 파일 없음\n'); return; }
  const { tests, unmapped } = testsFor(files, patterns, (p) => fs.existsSync(path.join(root, p)));
  for (const u of unmapped) process.stderr.write(`매핑 없음: ${u}\n`);
  if (tests.length) process.stdout.write(tests.join('\n') + '\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
