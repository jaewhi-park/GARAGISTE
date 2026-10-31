// check — 층별 검사를 돌리고 한 줄만 낸다. 나머지는 로그 파일. 판단 없음.
// 사용: node kit/check.mjs <quick|module|full> [files...]
//   PASS <층> [격리 n] [(메모)]
//   FAIL <층> <테스트> [기대=.. 실제=..|이유=..] [at file:line] [+n] log=<경로>
//   FAIL <층> exit=<코드> log=<경로>            ← 실패 꼴을 모르는 러너
// module은 tests-for가 짚은 테스트만 돌린다. 매핑이 없으면 full로 내려가고 그 사실을 줄에 적는다.
// kit/flaky.txt(사람이 관리)의 테스트는 셈에서 빠지고 `격리 n`으로 보인다 — 빨간불은 항상 진짜다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { changedFiles, DEFAULT_PATTERNS, kitDir, kitRoot, readJson, relToRoot, testsFor, toPosix } from './tests-for.mjs';

export const LAYERS = ['quick', 'module', 'full'];

// 층의 명령. module은 {files} 자리에 테스트 파일을 넣는다. 비어 있으면 그 사실을 FAIL로 — 채우는 것은 사람 또는 에이전트의 일.
export function layerCommand(config, layer, tests = []) {
  const tpl = config?.layers?.[layer];
  if (!tpl || !String(tpl).trim()) return { error: `kit/check.json layers.${layer} 비어 있음 — 이 저장소의 명령을 채운다` };
  if (layer !== 'module') return { cmd: String(tpl) };
  if (!/\{files\}/.test(tpl)) return { error: 'kit/check.json layers.module에 {files} 자리가 없다' };
  return { cmd: String(tpl).replaceAll('{files}', tests.map((t) => (/[\s"']/.test(t) ? JSON.stringify(t) : t)).join(' ')) };
}
// 무엇을 돌릴지 — module에 테스트가 없으면 full로 내려간다(사실을 note에)
export function plan(config, layer, files, mapping) {
  if (!LAYERS.includes(layer)) return { error: `층은 ${LAYERS.join(' | ')} 중 하나 (받은 값: ${layer || '없음'})` };
  if (layer !== 'module') return { layer, ...layerCommand(config, layer) };
  const notes = [];
  if (!files.length) notes.push('변경 파일 없음');
  else if (mapping.unmapped.length) notes.push(`매핑 없음: ${mapping.unmapped.join(', ')}`);
  if (!mapping.tests.length) return { layer: 'full', ...layerCommand(config, 'full'), note: [...notes, 'module → full'].join(' · ') };
  return { layer, ...layerCommand(config, 'module', mapping.tests), note: notes.join(' · ') || undefined };
}

// ── 실패 파싱 — 러너별 꼴을 아는 만큼 읽는다(node:test TAP·spec · jest · vitest · pytest · go test). 모르는 꼴이면 빈 목록, 종료 코드가 말한다.
const STARTS = [
  [/^\s*not ok \d+ - (.+?)\s*$/, 'tap'],
  [/^\s*[✖×] (.+?)(?: \([\d.]+ ?ms\))?\s*$/, 'spec'],
  [/^\s*● (.+?)\s*$/, 'jest'],
  [/^\s*FAIL\s+(\S+ > .+?)\s*$/, 'vitest'],
  [/^_{3,} (\S+) _{3,}$/, 'pytest'],
  [/^FAILED (\S+)(?: - (.*))?$/, 'pytest'],
  [/^\s*--- FAIL: (\S+)/, 'go'],
];
const FRAME = /(?:file:\/\/)?((?:[A-Za-z]:)?[^\s()'"`]+?\.(?:[cm]?[jt]sx?|py|go|rb|rs|java|kt|cs|php))(?::(\d+))(?::\d+)?/;
const strip = (s) => String(s).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
const clip = (s, n = 100) => { const t = String(s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const val = (s) => clip(String(s).replace(/,\s*$/, '').replace(/^'(.*)'$/, '$1'));

export function firstFrame(line, { root = '', isProject = (p) => !/node_modules|node:|site-packages|\/usr\/lib\/|\\lib\\/.test(p) } = {}) {
  const m = FRAME.exec(line);
  if (!m) return null;
  let file = toPosix(m[1]).replace(/\/{2,}/g, '/');
  if (!isProject(file)) return null;
  const r = root ? toPosix(root).replace(/\/{2,}/g, '/').replace(/\/$/, '') + '/' : '';
  if (r && file.startsWith(r)) file = file.slice(r.length);
  return `${file}:${m[2]}`;
}
export function parseFailures(text, opts = {}) {
  const lines = strip(text).split(/\r?\n/);
  const out = []; let cur = null;
  const close = () => { if (cur && !cur.drop) out.push(cur); cur = null; };
  for (const line of lines) {
    let started = false;
    for (const [re, kind] of STARTS) {
      const m = re.exec(line);
      if (!m) continue;
      const name = kind === 'pytest' ? m[1].trim().split('::').pop() : m[1].trim();
      if (kind === 'spec' && /^failing tests:?$/.test(name)) { close(); started = true; break; } // spec 리포터의 요약 머리
      if (kind === 'go' && name === 'FAIL') break;
      close();
      cur = { kind, name: clip(name), expected: null, actual: null, message: kind === 'pytest' && m[2] ? clip(m[2]) : null, frame: null };
      started = true; break;
    }
    if (started || !cur) continue;
    if (cur.kind === 'tap' && /^\s*\.\.\.\s*$/.test(line)) { close(); continue; } // yaml 블록의 끝
    if (/failureType: '(subtestsFailed|cancelledByParent)'/.test(line)) { cur.drop = true; continue; }
    let m;
    if ((m = /^\s*(?:expected|Expected):\s*(.+?)\s*$/.exec(line)) && cur.expected == null) cur.expected = val(m[1]);
    else if ((m = /^\s*(?:actual|Received):\s*(.+?)\s*$/.exec(line)) && cur.actual == null) cur.actual = val(m[1]);
    else if ((m = /^E\s+(.+)$/.exec(line)) && cur.kind === 'pytest' && cur.message == null) cur.message = clip(m[1]);
    else if ((m = /^\s+\S+_test\.go:\d+:\s+(.+)$/.exec(line)) && cur.kind === 'go' && cur.message == null) cur.message = clip(m[1]);
    else if ((m = /^\s*(?:error:\s*'(.+)'|(?:\w*Error\b[^:]*):\s*(.+))\s*$/.exec(line)) && cur.message == null) cur.message = clip(m[1] || m[2]);
    if (!cur.frame) {
      const loc = /^\s*location: '(.+)'\s*$/.exec(line);
      cur.frame = loc ? firstFrame(loc[1], opts) : firstFrame(line, opts);
    }
  }
  close();
  // 같은 이름은 하나로(spec·jest는 요약에서 되풀이한다) — 뒤의 것이 가진 빈칸만 채운다
  const byName = new Map();
  for (const f of out) {
    const prev = byName.get(f.name);
    if (!prev) { byName.set(f.name, f); continue; }
    for (const k of ['expected', 'actual', 'message', 'frame']) if (prev[k] == null && f[k] != null) prev[k] = f[k];
  }
  return [...byName.values()].map(({ drop, ...f }) => f);
}

// ── 격리 — flaky.txt: 한 줄에 하나, `<이름 또는 파일의 부분 문자열>  # 이유`. 사람이 관리한다.
export function parseFlaky(text) {
  const out = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    out.push({ pattern: line, reason: (/#\s*(.+)$/.exec(raw) || [])[1] || '' });
  }
  return out;
}
export function discount(failures, flaky) {
  const kept = []; const quarantined = [];
  for (const f of failures) {
    const hay = `${f.name} ${f.frame || ''}`;
    (flaky.some((q) => hay.includes(q.pattern)) ? quarantined : kept).push(f);
  }
  return { kept, quarantined };
}

// ── 한 줄
export function resultLine({ layer, exit, failures = [], quarantined = [], log = '', note }) {
  const tail = note ? ` (${note})` : '';
  const q = quarantined.length ? ` 격리 ${quarantined.length}` : '';
  if (!failures.length && (exit === 0 || quarantined.length)) return `PASS ${layer}${q}${tail}`;
  if (!failures.length) return `FAIL ${layer} exit=${exit} log=${log}${tail}`;
  const f = failures[0];
  const parts = [`FAIL ${layer}`, f.name];
  if (f.expected != null) parts.push(`기대=${f.expected}`);
  if (f.actual != null) parts.push(`실제=${f.actual}`);
  if (f.expected == null && f.actual == null && f.message) parts.push(`이유=${f.message}`);
  if (f.frame) parts.push(`at ${f.frame}`);
  if (failures.length > 1) parts.push(`+${failures.length - 1}`);
  if (quarantined.length) parts.push(`격리 ${quarantined.length}`);
  parts.push(`log=${log}`);
  return parts.join(' ') + tail;
}
export function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function main() {
  const dir = kitDir(import.meta.url); const root = kitRoot(import.meta.url);
  const config = readJson(path.join(dir, 'check.json'), null);
  if (!config) { process.stdout.write('FAIL check kit/check.json 없음 또는 JSON 오류\n'); process.exit(1); }
  const layer = process.argv[2]; const args = process.argv.slice(3);
  let mapping = { tests: [], unmapped: [] }; let files = [];
  if (layer === 'module') {
    files = args.length ? args.map((f) => relToRoot(root, f)) : changedFiles(root);
    const patterns = Array.isArray(config.tests) && config.tests.length ? config.tests : DEFAULT_PATTERNS;
    mapping = testsFor(files, patterns, (p) => fs.existsSync(path.join(root, p)));
  }
  const p = plan(config, layer, files, mapping);
  if (p.error) { process.stdout.write(`FAIL ${p.layer || layer || 'check'} ${p.error}\n`); process.exit(1); }
  const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' };
  const r = spawnSync(p.cmd, { shell: true, cwd: root, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  const exit = r.status ?? 1;
  const output = (r.stdout || '') + (r.stderr || '');
  const logDir = path.join(root, config.log || 'kit/log');
  fs.mkdirSync(logDir, { recursive: true });
  let logFile = path.join(logDir, `${stamp()}-${p.layer}.log`);
  for (let i = 2; fs.existsSync(logFile); i++) logFile = path.join(logDir, `${stamp()}-${p.layer}-${i}.log`);
  fs.writeFileSync(logFile, `$ ${p.cmd}\nexit=${exit}\n\n${output}`);
  const log = toPosix(path.relative(root, logFile));
  const failures = parseFailures(output, { root });
  const { kept, quarantined } = discount(failures, parseFlaky(fs.existsSync(path.join(dir, 'flaky.txt')) ? fs.readFileSync(path.join(dir, 'flaky.txt'), 'utf8') : ''));
  const line = resultLine({ layer: p.layer, exit, failures: kept, quarantined, log, note: p.note });
  process.stdout.write(line + '\n');
  process.exit(line.startsWith('PASS') ? 0 : 1);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
