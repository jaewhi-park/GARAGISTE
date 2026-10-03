// clock.mjs <프로젝트 폴더(main의 clone — 저장소 밖)> [--only C1,C3] [--cmd "<full 명령>"] — 프로젝트의 full을 시계 넷으로 돌린다(L2-TRIAL-5 「시계 검사」).
// 날을 기다리지 않고 시계를 옮긴다: TZ(env)로 시간대 · GARAGISTE_CLOCK_OFFSET_MS로 「지금」 — clock-preload.cjs가 NODE_OPTIONS --require로 모든 node 자식에 든다(node 밖의 자식 — 파이썬·Go — 엔 TZ만 닿는다).
// 출력: 설정마다 한 줄 CLOCK <id> …, 끝에 CLOCK PASS n/n 또는 FAIL — 나머지는 <폴더>-clock-<id>.log. 판단 없음(red의 계급 — 제품/테스트만 — 은 대리가 적는다).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PRELOAD = fileURLToPath(new URL('./clock-preload.cjs', import.meta.url));
const DAY = 86400000;

// 넷: C1 UTC+14 · C2 UTC−11(지구의 양 끝 — 「오늘」이 다른 날) · C3 서울 +40일(달이 바뀌고 요일이 돈다) · C4 서울 그해 12월 31일 23:59:50(full 도중 해가 바뀐다)
export function configs(now = new Date()) {
  const year = new Date(now.getTime() + 9 * 3600000).getUTCFullYear(); // 서울의 올해
  const target = Date.UTC(year, 11, 31, 14, 59, 50); // 23:59:50+09:00
  return [
    { id: 'C1', tz: 'Pacific/Kiritimati', offsetMs: 0, label: 'UTC+14 · 오늘' },
    { id: 'C2', tz: 'Pacific/Pago_Pago', offsetMs: 0, label: 'UTC-11 · 오늘' },
    { id: 'C3', tz: 'Asia/Seoul', offsetMs: 40 * DAY, label: '+40일' },
    { id: 'C4', tz: 'Asia/Seoul', offsetMs: target - now.getTime(), label: `${year}-12-31T23:59:50+09:00` },
  ];
}

// 자식 환경 — 있는 NODE_OPTIONS 뒤에 preload를 잇는다(공백이 든 경로는 큰따옴표)
export function childEnv(env, { id = '', tz, offsetMs, preload = PRELOAD }) {
  return { ...env, TZ: tz, GARAGISTE_CLOCK_ID: id, GARAGISTE_CLOCK_OFFSET_MS: String(offsetMs), NODE_OPTIONS: [env.NODE_OPTIONS, `--require "${preload}"`].filter(Boolean).join(' ') };
}

export function runOne(dir, cmd, cfg, log) {
  const t0 = Date.now();
  const r = spawnSync(cmd, { cwd: dir, shell: true, encoding: 'utf8', env: childEnv(process.env, cfg), maxBuffer: 64 * 1024 * 1024 });
  fs.writeFileSync(log, `$ ${cmd}\nTZ=${cfg.tz} GARAGISTE_CLOCK_OFFSET_MS=${cfg.offsetMs} (${cfg.label})\nexit ${r.status}\n\n${r.stdout || ''}\n${r.stderr || ''}`);
  return { ...cfg, exit: r.status, minutes: (Date.now() - t0) / 60000, log };
}
export const line = (x) => `CLOCK ${x.id} TZ=${x.tz} ${x.label} exit ${x.exit} ${x.exit === 0 ? 'PASS' : `FAIL — 로그 ${x.log}`}`;
export function summary(results) {
  const bad = results.filter((x) => x.exit !== 0);
  return bad.length ? `CLOCK FAIL ${bad.length}/${results.length} — ${bad.map((x) => x.id).join(',')} (red면 그 unit의 카드 fail 또는 다음 아침 창의 버그 말 · 계급 제품/테스트만 — L2-TRIAL-5 「시계 검사」)` : `CLOCK PASS ${results.length}/${results.length}`;
}

const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
function main() {
  const [dir, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i < 0 ? undefined : rest[i + 1]; };
  if (!dir || !fs.existsSync(dir)) { console.log('사용법: node tests/field/clock.mjs <프로젝트 폴더(main의 clone)> [--only C1,C3] [--cmd "<full 명령>"]'); process.exit(1); }
  const abs = path.resolve(dir);
  const cmd = opt('--cmd') || readJson(path.join(abs, '.garagiste', 'team.json'), {}).commands?.full;
  if (!cmd) { console.log('FAIL clock full 명령이 없다 — .garagiste/team.json commands.full 또는 --cmd "<명령>"'); process.exit(1); }
  const only = opt('--only')?.split(',');
  const results = [];
  for (const c of configs().filter((x) => !only || only.includes(x.id))) { const r = runOne(abs, cmd, c, `${abs}-clock-${c.id}.log`); console.log(line(r)); results.push(r); }
  console.log(summary(results));
  process.exit(results.every((x) => x.exit === 0) ? 0 : 1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
