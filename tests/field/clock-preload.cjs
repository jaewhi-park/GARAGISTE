// clock-preload.cjs — Date를 옮기는 preload(tests/field/clock.mjs가 NODE_OPTIONS --require로 넣는다 — 모든 node 자식에 든다).
// GARAGISTE_CLOCK_OFFSET_MS만큼 「지금」만 옮긴다: Date.now() · new Date() · Date(). 인자가 있는 new Date(…)·Date.parse·Date.UTC·prototype은 그대로 — 박아 둔 날짜의 테스트는 그대로 돈다.
'use strict';
const OFFSET = Number(process.env.GARAGISTE_CLOCK_OFFSET_MS || 0);
if (Number.isFinite(OFFSET) && OFFSET !== 0) {
  const RealDate = Date;
  const now = () => RealDate.now() + OFFSET;
  globalThis.Date = new Proxy(RealDate, {
    construct: (target, args, newTarget) => Reflect.construct(target, args.length ? args : [now()], newTarget),
    apply: () => String(new RealDate(now())),
    get: (target, key, receiver) => (key === 'now' ? now : Reflect.get(target, key, receiver)),
  });
}
