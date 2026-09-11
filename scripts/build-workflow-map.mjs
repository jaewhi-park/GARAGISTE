#!/usr/bin/env node
// Draws the workflow map shown in the root README and the guides — assets/workflow-map.svg (English) and
// assets/workflow-map.ko.svg (Korean) — from one geometry and two label sets, so the two languages never drift.
// Edit the labels or the geometry here and run `node scripts/build-workflow-map.mjs`; never edit the SVG files by hand.
// The drawing is a transit map: the main line every piece of work takes, the hotfix line that skips the plan,
// the parallel branch that rejoins at /ship, and the after-merge loop back to /plan. Double rings are the stops
// where the CEO answers or approves. Self-contained SVG (own colours and background, system font stack), so it
// renders the same as a GitHub image and in the guides.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const LABELS = {
  en: {
    file: "workflow-map.svg",
    aria: "GARAGISTE workflow map. The start line (/brainstorm, /kickoff or /assess, /hire) joins the main line (/backlog, /plan, /build, /review, /ship, merge); the /hotfix line runs above it from /plan to a separate PR-merge stop with three team stops and no plan; the parallel branch leaves /plan through /parallel or /spawn and /integrate and rejoins at /ship; the after-merge loop goes through /release and /retro back to /plan. Double rings are the stops where the CEO answers or approves.",
    feederTitle: "start · once", expressTitle: "hotfix · one pass, no plan — up to 3 files / 50 logic lines; a Risk path stops it",
    returnLabel: "after the merge, the next backlog item → /plan", mainTitle: "main line · every piece of work",
    branchTitle: "parallel — plans whose files do not overlap", loopTitle: "after the merge · release and retro",
    runLabel: "/run — build · review · ship in one go; it stops only for an escalation, a fix loop past 3 rounds, merge approval",
    brainstorm: ["/brainstorm", "approve the brief"], kickoff: ["/kickoff · /assess", "new or legacy, one confirmation"], hire: ["/hire", "approve"],
    backlog: ["/backlog", "order the top three"], plan: ["/plan", "intake · approve"], build: ["/build", "implementer → verifier"],
    review: ["/review", "2 or 4 lenses → fix loop"], ship: ["/ship", "verdict → PR · METRICS"], merge: ["merge", "Try it, then merge"],
    hotfix: ["/hotfix", "one sentence, obvious check"], impl: "implementer · regression test", verify: "verifier, full", review1: "reviewer, one lens",
    prmerge: ["merge the PR", "read the diff · never auto-merged"],
    parallel: ["/parallel · /spawn", "worktree per plan, no overlap"], integrate: ["/integrate", "one at a time → /ship"],
    release: ["/release", "weekly — you push the tag"], retro: ["/retro", "METRICS → causes → rules · skills · hooks"],
    legend: ["start (once)", "main line (every piece of work)", "/hotfix", "parallel", "after the merge", "CEO answers or approves", "team only"],
  },
  ko: {
    file: "workflow-map.ko.svg",
    aria: "GARAGISTE 워크플로우 노선도. 시작 선(/brainstorm, /kickoff 또는 /assess, /hire)이 기본 경로(/backlog, /plan, /build, /review, /ship, 머지)에 합류하고, /hotfix 선은 그 위에서 /plan부터 별도의 PR 머지 역까지 계획 없이 팀 역 셋만 거치며, 병렬 선은 /plan에서 /parallel 또는 /spawn과 /integrate를 거쳐 /ship에 합류하고, 출하 뒤 선은 /release와 /retro를 거쳐 /plan으로 돌아온다. 겹친 원은 CEO가 답하거나 승인하는 역이다.",
    feederTitle: "시작 · 한 번", expressTitle: "핫픽스 · 계획 없이 한 번에 — 파일 3개·논리 50줄까지, Risk path 면 멈춤",
    returnLabel: "머지 뒤 다음 백로그 항목으로 → /plan", mainTitle: "기본 경로 · 작업마다",
    branchTitle: "병렬 — 파일이 겹치지 않는 계획들", loopTitle: "출하 뒤 · 릴리즈와 회고",
    runLabel: "/run — build · review · ship 을 한 번에, 멈추는 곳은 에스컬레이션 · 수정 루프 3회 초과 · 머지 승인뿐",
    brainstorm: ["/brainstorm", "기획서 승인"], kickoff: ["/kickoff · /assess", "신규 · 레거시, 확인 1회"], hire: ["/hire", "배정 승인"],
    backlog: ["/backlog", "상위 3개 순서만"], plan: ["/plan", "접수 1회 · 승인"], build: ["/build", "implementer → verifier"],
    review: ["/review", "2 | 4 렌즈 → 수정 루프"], ship: ["/ship", "정책 판정 → PR · METRICS"], merge: ["머지", "직접 확인 후 머지"],
    hotfix: ["/hotfix", "한 문장으로 말할 수 있는 수정"], impl: "implementer + 회귀 테스트, 커밋 1", verify: "verifier 전체 검증", review1: "reviewer 1렌즈",
    prmerge: ["PR 머지", "diff 읽고 머지 · 자동 머지 없음"],
    parallel: ["/parallel · /spawn", "계획별 worktree · 겹침만 확인"], integrate: ["/integrate", "하나씩 머지 → /ship"],
    release: ["/release", "주 1회 — 태그는 당신이 push"], retro: ["/retro", "METRICS → 원인 → 규칙 · 스킬 · 훅"],
    legend: ["시작 (한 번)", "기본 경로 (작업마다)", "/hotfix", "병렬", "출하 뒤 (릴리즈·회고)", "CEO 가 답하거나 승인하는 역", "팀만 거치는 역"],
  },
};

const C = { paper: "#FFFFFF", ink: "#1B1F24", muted: "#5C6570", main: "#1D5BBF", express: "#D2442C", branch: "#2A9D6A", loop: "#7A4FBF", feeder: "#2F8FA6" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// rough advance widths for placing the legend: CJK ≈ 1 em, everything else ≈ 0.55 em at 11.5px
const width = (s) => [...s].reduce((w, ch) => w + (/[ᄀ-ᇿ㄰-㆏가-힯　-〿]/.test(ch) ? 11.5 : 6.3), 0);

const text = (x, y, cls, s, anchor) => `<text x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ""} class="${cls}">${esc(s)}</text>`;
const ceo = (x, y) => `<circle cx="${x}" cy="${y}" r="9" class="ceo"/>`;
const stop = (x, y, line, r = 6.5) => `<circle cx="${x}" cy="${y}" r="${r}" class="st st-${line}"/>`;
const above = (x, y, [name, role]) => text(x, y - 38, "role", role, "middle") + text(x, y - 20, "name", name, "middle");
const below = (x, y, [name, role]) => text(x, y + 26, "name", name, "middle") + text(x, y + 42, "role", role, "middle");
const side = (x, y, [name, role]) => `<text x="${x + 20}" y="${y + 4}"><tspan class="name">${esc(name)}</tspan><tspan class="role" dx="8">${esc(role)}</tspan></text>`;

function legend(items, y) {
  const swatch = [["line", "feeder"], ["line", "main"], ["line", "express"], ["line", "branch"], ["line", "loop"], ["ceo"], ["dot"]];
  let x = 60; const out = [];
  items.forEach((label, i) => {
    const [kind, line] = swatch[i];
    if (kind === "line") out.push(`<rect x="${x}" y="${y - 3}" width="26" height="6" rx="3" fill="${C[line]}"/>`);
    else if (kind === "ceo") out.push(`<circle cx="${x + 13}" cy="${y}" r="6" class="ceo" style="stroke-width:3"/>`);
    else out.push(`<circle cx="${x + 13}" cy="${y}" r="4.5" fill="${C.muted}"/>`);
    out.push(text(x + 34, y + 4, "role", label));
    x += 34 + width(label) + 22;
  });
  return out.join("\n");
}

function svg(t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 610" width="1180" height="610" role="img" aria-label="${esc(t.aria)}">
<!-- generated by scripts/build-workflow-map.mjs — edit the script, not this file -->
<style>
  text { font-family: "IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", sans-serif; font-size: 11.5px; fill: ${C.ink}; }
  .name { font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, Menlo, monospace; font-size: 13px; font-weight: 500; }
  .role { fill: ${C.muted}; }
  .title { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; }
  .l { fill: none; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; }
  .thin { stroke-width: 3; }
  .st { stroke: ${C.paper}; stroke-width: 2.5; }
  .st-main { fill: ${C.main}; } .st-express { fill: ${C.express}; } .st-branch { fill: ${C.branch}; }
  .ceo { fill: ${C.paper}; stroke: ${C.ink}; stroke-width: 3.5; }
  .bracket { fill: none; stroke: ${C.muted}; stroke-width: 1.5; }
</style>
<rect width="1180" height="610" fill="${C.paper}"/>
<defs>
  <marker id="arr-main" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.main}"/></marker>
  <marker id="arr-loop" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.loop}"/></marker>
</defs>

<!-- lines -->
<path class="l" stroke="${C.feeder}" d="M60,100 V300"/>
<path class="l" stroke="${C.main}" d="M60,300 H1010"/>
<path class="l thin" stroke="${C.main}" d="M909,300 H970 Q990,300 990,280 V220 Q990,200 970,200 H235 Q215,200 215,220 V286" marker-end="url(#arr-main)"/>
<path class="l" stroke="${C.express}" d="M300,120 H900"/>
<path class="l" stroke="${C.branch}" d="M300,309 V360 Q300,400 340,400 H700 Q750,400 750,360 V309"/>
<path class="l" stroke="${C.loop}" d="M900,309 V440 Q900,490 850,490 H320 Q270,490 270,440 V312" marker-end="url(#arr-loop)"/>

<!-- /run bracket and line titles -->
<path class="bracket" d="M432,246 V240 H768 V246"/>
${text(600, 234, "role", t.runLabel, "middle")}
${text(78, 92, "title", t.feederTitle)}
${text(316, 142, "title", t.expressTitle)}
${text(600, 192, "role", t.returnLabel, "middle")}
${text(62, 332, "title", t.mainTitle)}
${text(350, 390, "title", t.branchTitle)}
${text(330, 480, "title", t.loopTitle)}

<!-- start line -->
${ceo(60, 120)}${side(60, 120, t.brainstorm)}
${ceo(60, 180)}${side(60, 180, t.kickoff)}
${ceo(60, 240)}${side(60, 240, t.hire)}

<!-- main line -->
${ceo(150, 300)}${above(150, 300, t.backlog)}
${ceo(300, 300)}${above(300, 300, t.plan)}
${stop(450, 300, "main")}${above(450, 300, t.build)}
${stop(600, 300, "main")}${above(600, 300, t.review)}
${stop(750, 300, "main")}${above(750, 300, t.ship)}
${ceo(900, 300)}${above(900, 300, t.merge)}

<!-- hotfix line -->
${ceo(300, 120)}${above(300, 120, t.hotfix)}
${stop(450, 120, "express", 4.5)}${text(450, 100, "role", t.impl, "middle")}
${stop(600, 120, "express", 4.5)}${text(600, 100, "role", t.verify, "middle")}
${stop(750, 120, "express", 4.5)}${text(750, 100, "role", t.review1, "middle")}
${ceo(900, 120)}${above(900, 120, t.prmerge)}

<!-- parallel branch -->
${ceo(450, 400)}${below(450, 400, t.parallel)}
${stop(630, 400, "branch")}${below(630, 400, t.integrate)}

<!-- after the merge -->
${ceo(750, 490)}${below(750, 490, t.release)}
${ceo(450, 490)}${below(450, 490, t.retro)}

<!-- legend -->
<line x1="60" y1="556" x2="1120" y2="556" stroke="#D9DDD6" stroke-width="1"/>
${legend(t.legend, 580)}
</svg>
`;
}

mkdirSync(join(ROOT, "assets"), { recursive: true });
for (const t of Object.values(LABELS)) {
  writeFileSync(join(ROOT, "assets", t.file), svg(t));
  console.log(`→ assets/${t.file}`);
}
