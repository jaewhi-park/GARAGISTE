// SessionStart hook: stdout is injected into the session context. Loads the charter and the board (the CEO's page and the
// team's pointer) every session and after every compaction, keeps the session's compaction counter (.claude/session/compactions
// — the PreCompact hook increments it, this hook resets it at a real start and leaves it alone after a compaction, the lead's
// compaction rule reads it) and says where to start: a board -> the lead reconciles it first (the resume procedure; the CEO
// types nothing); a linked worktree -> the board belongs to the main checkout; only a charter -> /plan or /backlog; neither
// -> /brainstorm, or /kickoff | /assess when docs/BRIEF.md is already approved (the brief itself is never injected).
// The tail is written in the team's language — the "## Language" code in CLAUDE.md (ko has its own strings; any other code gets
// English plus one line naming the code): it is the last thing before the CEO's first word, so it decides the reply's language.
// It also warns when two guardrails installs run at once (the user's ~/.claude and this project's .claude): every tool call
// runs both hooks and the older one decides what is refused.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

const GARAGISTE_VERSION = "2026-09-26";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8")); } catch {}
const cwd = input.cwd ?? process.cwd();

// ---------- the team's language ----------
function languageCode(dir) {
  try {
    const m = /^##\s+Language\s*\r?\n\s*-\s*([^\s(,]+)/m.exec(readFileSync(join(dir, "CLAUDE.md"), "utf8"));
    return m ? m[1] : "";
  } catch { return ""; }
}
const EN = {
  worktree: "This is a linked worktree: the board above belongs to the main checkout. Do not edit or commit docs/STATUS.md here — this branch's commits are its record. Start with /plan or `/run <plan>` on this branch; integration happens from the main checkout.",
  running: "The board says Mode: running — answer the CEO's message, then continue the run (the `deliver` skill) in the same turn; do not wait for a go.",
  review: "The board says Mode: paused — iteration review: give the iteration review again (from the board) and wait for the CEO.",
  waiting: "The board says Mode: waiting on CEO: ask the open question again in one line, with its default.",
  paused: (mode) => `The board says Mode: ${mode}: say why in one line and wait.`,
  next: "Continue from the board's next action.",
  compact: (n) => `A compaction just happened — this session's count is ${n}. The board above is current: reconcile it with git (the \`resume\` procedure) and continue the step in progress; do not wait for the CEO. At 3 or more compactions the lead's compaction cut applies: finish the step, commit the board, end the turn and tell the CEO to start a new session.`,
  reconcile: (next) => `Reconcile first: run the \`resume\` procedure (the Skill tool) before answering the CEO — compare the board with git, worktrees and PR state, trust the repository. ${next} The CEO does not type /resume.`,
  noBoard: "No status board (a project from before the board was committed, or nothing in progress): start with /plan <backlog item> or /backlog.",
  noBrief: "GARAGISTE: no product brief yet (docs/BRIEF.md). Start with /brainstorm <idea, or the path of a document you wrote>.",
  briefDraft: (status) => `GARAGISTE: docs/BRIEF.md has a revision in progress (${status}). Start with /brainstorm to finish it.`,
  briefApproved: (status, kind, next) => `GARAGISTE: docs/BRIEF.md is ${status} (Kind: ${kind}) and docs/CHARTER.md is missing. Start with ${next}.`,
  briefUnfinished: (status) => `GARAGISTE: docs/BRIEF.md is still ${status || "unfinished"}. Start with /brainstorm to continue it.`,
  language: (code) => `Reply, ask and write documents in the team's language — "## Language" in CLAUDE.md says ${code} — never in the English of these instructions.`,
  twoHooks: (list) => `Two guardrails hooks are installed — ${list}: every tool call runs both and the older one decides what is refused. Keep one (remove the other settings file's PreToolUse entry) or update both to the same release; tell the CEO in one line.`,
};
const KO = {
  worktree: "이 체크아웃은 linked worktree다: 위의 보드는 main 체크아웃의 것이다. 여기서 docs/STATUS.md를 고치거나 커밋하지 않는다 — 이 브랜치의 커밋이 기록이다. 이 브랜치에서 /plan 또는 `/run <plan>`으로 시작한다; 통합은 main 체크아웃에서 한다.",
  running: "보드의 Mode가 running이다 — CEO의 메시지에 답한 뒤 같은 턴에서 가동(`deliver` 스킬)을 이어 간다; 시작 신호를 기다리지 않는다.",
  review: "보드의 Mode가 paused — iteration review다: 보드에서 iteration review를 다시 보이고 CEO를 기다린다.",
  waiting: "보드의 Mode가 waiting on CEO다: 열린 질문을 기본값과 함께 한 줄로 다시 묻는다.",
  paused: (mode) => `보드의 Mode가 ${mode}이다: 이유를 한 줄로 말하고 기다린다.`,
  next: "보드의 다음 행동부터 이어 간다.",
  compact: (n) => `방금 compaction이 일어났다 — 이 세션의 횟수는 ${n}이다. 위의 보드가 현재 상태다: git과 대조해(\`resume\` 절차) 진행 중인 step을 이어 간다; CEO를 기다리지 않는다. compaction이 3회 이상이면 lead의 compaction 컷이 적용된다: step을 끝내고 보드를 커밋한 뒤 턴을 끝내고 CEO에게 새 세션을 열라고 말한다.`,
  reconcile: (next) => `먼저 대조한다: CEO에게 답하기 전에 \`resume\` 절차(Skill 도구)를 돌려 보드를 git · worktree · PR 상태와 비교하고 저장소를 믿는다. ${next} CEO는 /resume을 치지 않는다.`,
  noBoard: "상태판이 없다(보드를 커밋하기 전의 프로젝트이거나 진행 중인 일이 없다): /plan <백로그 항목> 또는 /backlog로 시작한다.",
  noBrief: "GARAGISTE: 기획서(docs/BRIEF.md)가 아직 없다. /brainstorm <아이디어, 또는 직접 쓴 문서의 경로>로 시작한다.",
  briefDraft: (status) => `GARAGISTE: docs/BRIEF.md에 진행 중인 개정이 있다(${status}). /brainstorm으로 마무리한다.`,
  briefApproved: (status, kind, next) => `GARAGISTE: docs/BRIEF.md는 ${status}(Kind: ${kind})이고 docs/CHARTER.md가 없다. ${next}으로 시작한다.`,
  briefUnfinished: (status) => `GARAGISTE: docs/BRIEF.md는 아직 ${status || "미완성"}이다. /brainstorm으로 이어 간다.`,
  language: (code) => `응답 · 질문 · 문서는 팀의 언어로 쓴다 — CLAUDE.md의 "## Language"는 ${code}다 — 이 지시문의 영어가 아니라.`,
  twoHooks: (list) => `guardrails 훅이 둘 설치돼 있다 — ${list}: 모든 도구 호출에 둘 다 돌고 더 낡은 쪽이 거부를 정한다. 하나만 남기거나(다른 settings 파일의 PreToolUse 항목을 지운다) 둘을 같은 릴리스로 맞춘다; CEO에게 한 줄로 알린다.`,
};
const lang = languageCode(cwd);
const T = /^ko\b/i.test(lang) ? KO : EN;

// ---------- two installs at once ----------
// The user's ~/.claude/settings.json and this project's .claude/settings.json can each register a guardrails hook; Claude Code
// runs both. Name each with the release its hook file carries (a file without the stamp predates 2026-09-26).
function guardrailInstalls(dir) {
  const out = [];
  for (const [scope, file] of [["user ~/.claude", join(homedir(), ".claude", "settings.json")], ["project .claude", join(dir, ".claude", "settings.json")]]) {
    let s; try { s = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    for (const e of s.hooks?.PreToolUse ?? []) for (const h of e.hooks ?? []) {
      const m = /"([^"]*guardrails\.mjs)"|(\S*guardrails\.mjs)/.exec(String(h.command ?? ""));
      if (!m) continue;
      const p = m[1] ?? m[2];
      let version = "unreadable";
      try { version = (/GARAGISTE_VERSION\s*=\s*"([^"]+)"/.exec(readFileSync(isAbsolute(p) ? p : resolve(dir, p), "utf8")) ?? [])[1] ?? "before 2026-09-26"; } catch {}
      out.push(`${scope} (${version})`);
    }
  }
  return out;
}
const installs = guardrailInstalls(cwd);
const warning = installs.length >= 2 ? `${T.twoHooks(installs.join(", "))}\n` : "";

// ---------- compaction counter ----------
// A real start (startup, resume, clear) resets it to 0; after a compaction (source "compact") it keeps the count the PreCompact
// hook wrote, so the lead can see how many summaries this session already stacks. Best effort — a read-only checkout only loses the counter.
const source = String(input.source ?? "startup");
const counter = join(cwd, ".claude/session/compactions");
let compactions = 0;
if (source === "compact") { try { compactions = parseInt(readFileSync(counter, "utf8"), 10) || 0; } catch {} }
else { try { mkdirSync(join(cwd, ".claude/session"), { recursive: true }); writeFileSync(counter, "0\n"); } catch {} }

// A linked worktree (`claude --worktree`, a /parallel checkout) has a `.git` file, not a directory.
let linked = false;
try { linked = statSync(join(cwd, ".git")).isFile(); } catch {}

const hasCharter = existsSync(join(cwd, "docs/CHARTER.md"));
const hasStatus = existsSync(join(cwd, "docs/STATUS.md"));
const parts = [];
for (const f of ["docs/CHARTER.md", "docs/STATUS.md", "docs/STATUS-team.md"]) {
  const p = join(cwd, f);
  if (existsSync(p)) {
    const lines = readFileSync(p, "utf8").trim().split("\n");
    const body = lines.length > 120 ? lines.slice(0, 120).join("\n") + `\n… (${lines.length - 120} lines omitted — read the file if needed)` : lines.join("\n");
    parts.push(`## ${f}\n${body}`);
  }
}
const languageLine = lang ? `\n${T.language(lang)}` : "";
if (hasCharter || hasStatus) {
  let tail;
  if (hasStatus && linked) {
    // The board is committed, so a linked worktree carries the main checkout's copy: it describes that checkout, not this branch.
    tail = T.worktree;
  } else if (hasStatus) {
    // The board is a pointer and may be stale (a session that died mid-turn, a PR merged since): the repository is the truth. Its Mode line says what to do after reconciling.
    const mode = (readFileSync(join(cwd, "docs/STATUS.md"), "utf8").match(/^Mode:\s*(.+)$/m) ?? [])[1]?.trim() ?? "";
    const next = /^running/.test(mode) ? T.running : /iteration review/.test(mode) ? T.review : /waiting on CEO/.test(mode) ? T.waiting : /^paused/.test(mode) ? T.paused(mode) : T.next;
    tail = source === "compact" ? T.compact(compactions) : T.reconcile(next);
  } else {
    tail = T.noBoard;
  }
  process.stdout.write(`# GARAGISTE context (SessionStart auto-injection, ${GARAGISTE_VERSION})\n${warning}${parts.join("\n\n")}\n\n${tail}${languageLine}\n`);
} else {
  // No charter and no board: the product brief decides the first command. Only its Status and Kind lines are read.
  const briefPath = join(cwd, "docs/BRIEF.md");
  let line;
  if (!existsSync(briefPath)) {
    line = T.noBrief;
  } else {
    const head = readFileSync(briefPath, "utf8").split("\n").slice(0, 20);
    const status = (head.find((l) => /^Status:/.test(l)) ?? "Status: ?").replace(/^Status:\s*/, "").trim();
    const kind = (head.find((l) => /^Kind:/.test(l)) ?? "Kind: ?").replace(/^Kind:\s*/, "").trim();
    if (/\(rev \d+ draft\)/.test(status)) line = T.briefDraft(status);
    else if (/^(approved|revised)/.test(status)) line = T.briefApproved(status, kind, /^레거시|^legacy/i.test(kind) ? `/assess ${(kind.match(/\((.+)\)/) ?? [])[1] ?? "<path>"}` : "/kickoff");
    else line = T.briefUnfinished(status);
  }
  process.stdout.write(`${warning}${line}${languageLine}\n`);
}
