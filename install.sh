#!/usr/bin/env bash
# GARAGISTE 증거 팀 설치 — 팀 정본(team/)을 <repo>/.garagiste/로, 하네스 배선을 .claude/ 또는 opencode.json + .opencode/로.
# Usage: ./install.sh <claude|opencode> [-Project <path>] [-Budget low|medium|high] [-DryRun]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLAVOR="${1:-}"; [ $# -gt 0 ] && shift
case "$FLAVOR" in claude|opencode) ;; ""|-h|--help|help) sed -n '2,3p' "$0"; exit 0 ;; *) echo "하네스: claude 또는 opencode (받은 값: $FLAVOR)" >&2; exit 1 ;; esac
PROJECT="."; BUDGET="medium"; DRY=0; SKIP_SELFTEST=0
while [ $# -gt 0 ]; do
  case "$1" in
    -Project|--project) PROJECT="$2"; shift 2 ;;
    -Budget|--budget) BUDGET="$2"; shift 2 ;;
    -DryRun|--dry-run) DRY=1; shift ;;
    -SkipSelftest|--skip-selftest) SKIP_SELFTEST=1; shift ;;
    *) echo "알 수 없는 옵션: $1" >&2; exit 1 ;;
  esac
done
mkdir -p "$PROJECT"
if ! ROOT="$(cd "$PROJECT" && git rev-parse --show-toplevel 2>/dev/null)"; then git -C "$PROJECT" init -q -b main; ROOT="$(cd "$PROJECT" && pwd)"; echo "git init: $ROOT"; fi
command -v node >/dev/null || { echo "node가 없다 (20 이상)" >&2; exit 1; }
# 설치 전의 상태 — 기존 저장소(HEAD 있음)가 깨끗했으면 팀 파일을 설치가 커밋한다(사고 70: brownfield에선 팀 파일이 미커밋으로 남아 첫 ship이 「메인 worktree에 미커밋 변경」으로 막혔다)
PRE_HEAD=0; PRE_DIRTY=0; PRE_INSTALLED=0
if git -C "$ROOT" rev-parse --verify -q HEAD >/dev/null 2>&1; then PRE_HEAD=1; [ -n "$(git -C "$ROOT" status --porcelain)" ] && PRE_DIRTY=1; fi
[ -f "$ROOT/.garagiste/team.json" ] && PRE_INSTALLED=1
run() { if [ "$DRY" = 1 ]; then echo "  [dry] $*"; else "$@"; fi; }
# 갱신 미리보기(Q11 — 10라운드): 이미 설치돼 있으면 복사 전에 무엇이 바뀌는지 한 줄 — 소스의 doctor가 센다(설치본의 doctor는 옛것일 수 있다). 배선 설정(settings.json·opencode.json)은 설치가 덮지 않는다.
if [ "$PRE_INSTALLED" = 1 ]; then node "$HERE/team/scripts/doctor.mjs" --diff "$ROOT" 2>/dev/null | sed 's/^/  /' || true; fi
case "$BUDGET" in
  low)    M_INTAKE=sonnet; M_SPEC=sonnet; M_BUILD=haiku;  M_ATTACK=sonnet; M_SPIKE=haiku;  M_BOOT=haiku;  M_ADOPT=haiku ;;
  high)   M_INTAKE=opus;   M_SPEC=opus;   M_BUILD=opus;   M_ATTACK=opus;   M_SPIKE=sonnet; M_BOOT=sonnet; M_ADOPT=sonnet ;;
  *)      M_INTAKE=opus;   M_SPEC=opus;   M_BUILD=sonnet; M_ATTACK=opus;   M_SPIKE=sonnet; M_BOOT=sonnet; M_ADOPT=sonnet; BUDGET=medium ;;
esac
echo "GARAGISTE 증거 팀 [$FLAVOR] → $ROOT (budget: $BUDGET)"
# 1. 팀 정본 — 하네스 중립
run mkdir -p "$ROOT/.garagiste/scripts" "$ROOT/.garagiste/packs" "$ROOT/.githooks"
run cp "$HERE"/team/scripts/*.mjs "$ROOT/.garagiste/scripts/"
run cp "$HERE"/team/packs/*.md "$ROOT/.garagiste/packs/"
run cp "$HERE/team/githooks/pre-commit" "$ROOT/.githooks/pre-commit"
run chmod +x "$ROOT/.githooks/pre-commit"
# 인덱스에도 실행 비트를 — Windows에서 만든 저장소를 맥·리눅스가 받았을 때 훅이 무시되지 않게
[ "$DRY" = 0 ] && git -C "$ROOT" rev-parse --verify -q HEAD >/dev/null 2>&1 && { git -C "$ROOT" add .githooks/pre-commit >/dev/null 2>&1; git -C "$ROOT" update-index --chmod=+x .githooks/pre-commit >/dev/null 2>&1; }
[ -f "$ROOT/.garagiste/HAZARDS.md" ] || run cp "$HERE/team/HAZARDS.md" "$ROOT/.garagiste/HAZARDS.md"
# 설치본의 판(L3 Q11): 어느 GARAGISTE 커밋의 team/인가 — 날짜는 적지 않는다(같은 판의 재설치가 diff를 만들지 않게; 날짜는 커밋이 안다)
PREV_SHA="$(node -e 'try{process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).garagiste||"")}catch{}' "$ROOT/.garagiste/VERSION" 2>/dev/null || true)"
GSHA="$(git -C "$HERE" rev-parse HEAD 2>/dev/null || echo unknown)"; GTREE="$(git -C "$HERE" rev-parse HEAD:team 2>/dev/null || echo unknown)"
[ "$DRY" = 1 ] || printf '{ "garagiste": "%s", "team_tree": "%s", "flavor": "%s" }\n' "$GSHA" "$GTREE" "$FLAVOR" > "$ROOT/.garagiste/VERSION"
if [ ! -f "$ROOT/.garagiste/team.json" ]; then
  run cp "$HERE/team/team.json" "$ROOT/.garagiste/team.json"
  [ "$DRY" = 0 ] && node -e '
    const fs=require("fs"); const [p,i,s,b,a,k,o,d]=process.argv.slice(1); const t=JSON.parse(fs.readFileSync(p,"utf8"));
    t.models={intake:i,spec:s,build:b,attack:a,spike:k,boot:o,adopt:d}; fs.writeFileSync(p, JSON.stringify(t,null,2)+"\n");' "$ROOT/.garagiste/team.json" "$M_INTAKE" "$M_SPEC" "$M_BUILD" "$M_ATTACK" "$M_SPIKE" "$M_BOOT" "$M_ADOPT"
fi
# 편성의 정본은 프로젝트의 team.json — 재설치의 -Budget이 기존 편성을 지우지 않는다(v1 재적용병의 백신). 에이전트 model:도 여기서 나온다.
if [ "$DRY" = 0 ] && [ -f "$ROOT/.garagiste/team.json" ]; then
  MODELS_LINE="$(node -e 'const fs=require("fs");const t=JSON.parse(fs.readFileSync(process.argv[1],"utf8").replace(/^﻿/,""));const m=t.models||{};process.stdout.write([m.intake,m.spec,m.build,m.attack,m.spike,m.boot,m.adopt||m.boot].join(" "))' "$ROOT/.garagiste/team.json" 2>/dev/null || true)"
  if [ "$(printf %s "$MODELS_LINE" | wc -w)" = 7 ]; then read -r M_INTAKE M_SPEC M_BUILD M_ATTACK M_SPIKE M_BOOT M_ADOPT <<<"$MODELS_LINE"; fi # adopt(2026-10-04)이 없는 옛 team.json은 boot의 모델로
fi
# 2. 하네스 배선
sub() { sed -e "s/{{MODEL_BOOT}}/$M_BOOT/; s/{{MODEL_ADOPT}}/$M_ADOPT/; s/{{MODEL_INTAKE}}/$M_INTAKE/; s/{{MODEL_SPEC}}/$M_SPEC/; s/{{MODEL_BUILD}}/$M_BUILD/; s/{{MODEL_ATTACK}}/$M_ATTACK/; s/{{MODEL_SPIKE}}/$M_SPIKE/" "$1" > "$2"; }
if [ "$FLAVOR" = claude ]; then
  run mkdir -p "$ROOT/.claude/hooks" "$ROOT/.claude/agents"
  run cp "$HERE"/team/claude/hooks/*.mjs "$ROOT/.claude/hooks/"
  for a in "$HERE"/team/claude/agents/*.md; do if [ "$DRY" = 1 ]; then echo "  [dry] agent $(basename "$a")"; else sub "$a" "$ROOT/.claude/agents/$(basename "$a")"; fi; done
  if [ -f "$ROOT/.claude/settings.json" ]; then
    # 배선 설정은 덮지 않는다(사용자 병합 보호) — team의 것과 다르면 옆에 두고 알린다(10라운드: 6라운드의 Read 매처가 옛 설치본에 닿지 않았다)
    if ! cmp -s "$HERE/team/claude/settings.json" "$ROOT/.claude/settings.json"; then
      run cp "$HERE/team/claude/settings.json" "$ROOT/.claude/settings.garagiste.json"
      echo "  .claude/settings.json이 team의 것과 다르다 → .claude/settings.garagiste.json에 두었다. 매처·allow·deny를 비교해 합쳐라(doctor가 빠진 매처를 짚는다)."
    fi
  else run cp "$HERE/team/claude/settings.json" "$ROOT/.claude/settings.json"; fi
  RULES="$ROOT/CLAUDE.md"; TEMPLATE="$HERE/team/claude/CLAUDE.md.template"
else
  run mkdir -p "$ROOT/.opencode/agents" "$ROOT/.opencode/plugins"
  run cp "$HERE"/team/opencode/agents/*.md "$ROOT/.opencode/agents/"
  run cp "$HERE/team/opencode/plugins/guard.ts" "$ROOT/.opencode/plugins/guard.ts"
  if [ -f "$ROOT/opencode.json" ] || [ -f "$ROOT/opencode.jsonc" ]; then
    if ! cmp -s "$HERE/team/opencode/opencode.json" "$ROOT/opencode.json" 2>/dev/null; then
      run cp "$HERE/team/opencode/opencode.json" "$ROOT/opencode.garagiste.json"
      echo "  opencode.json이 team의 것과 다르다 → opencode.garagiste.json에 두었다. permission·default_agent·instructions를 비교해 합쳐라."
    fi
  else run cp "$HERE/team/opencode/opencode.json" "$ROOT/opencode.json"; fi
  echo "  opencode 모델: 기본 provider/model을 상속한다. 팩별로 바꾸려면 .opencode/agents/<pack>.md 앞머리에 model: <provider/model>"
  RULES="$ROOT/AGENTS.md"; TEMPLATE="$HERE/team/opencode/AGENTS.md.template"
fi
if [ ! -f "$RULES" ]; then run cp "$TEMPLATE" "$RULES"; fi
GI_WROTE=0; touch "$ROOT/.gitignore"
if ! grep -q 'GARAGISTE 증거 팀' "$ROOT/.gitignore"; then
  if [ "$DRY" = 1 ]; then echo "  [dry] .gitignore += team/gitignore.snippet"; else { echo; cat "$HERE/team/gitignore.snippet"; } >> "$ROOT/.gitignore"; GI_WROTE=1; fi
fi
run git -C "$ROOT" config core.hooksPath .githooks
run git -C "$ROOT" config core.autocrlf false # 게이트의 법은 tree 바이트 동일성 — 사용자 전역 개행 변환(win32 autocrlf=true)이 유령 diff를 만든다(사고 18)
# 첫 커밋이 없으면 설치기가 만든다(첫 커밋은 원장이 있을 수 없어 게이트가 통과시킨다) — 그 뒤 main에 닿는 것은 ship.mjs뿐
if [ "$DRY" = 0 ] && ! git -C "$ROOT" rev-parse --verify -q HEAD >/dev/null 2>&1; then
  git -C "$ROOT" add -A && git -C "$ROOT" update-index --chmod=+x .githooks/pre-commit
  # 사고 19(win32 원격 검증): 첫 커밋 실패를 경고로 삼키면 설치가 '전부 스테이징된 채 HEAD 없음/어긋남'으로 성공을 선언한다 — fail-closed
  if GARAGISTE_SHIP=1 git -C "$ROOT" -c user.name="${GIT_AUTHOR_NAME:-garagiste}" -c user.email="${GIT_AUTHOR_EMAIL:-garagiste@local}" commit -m "scaffold(team): GARAGISTE 증거 팀 설치 [$FLAVOR, budget $BUDGET]"; then echo "  첫 커밋: 팀 파일"; else echo "설치 FAIL — 첫 커밋이 닫히지 않았다. 위 git 출력이 이유다." >&2; exit 1; fi
elif [ "$DRY" = 0 ] && [ "$PRE_HEAD" = 1 ]; then
  # 기존 저장소: 설치가 쓴 팀 파일만 커밋한다(생성물 차선 GARAGISTE_SHIP·WIP — models·commands·report 커밋과 같다). 사람의 미커밋 변경은 건드리지 않는다.
  # 사고 70은 「더러우면 손대지 않는다」였다 — 사고 74(16라운드 운영 둘째 날): 팀이 쓰는 docs 차선(STATUS·BACKLOG)만 더러워도 갱신의 팀 파일이 미커밋으로 남아 다음 ship이 「메인 worktree에 미커밋 변경」으로 막혔다(STOP framework).
  WHAT="설치"; if [ "$PRE_INSTALLED" = 1 ]; then if [ -n "$PREV_SHA" ] && [ "$PREV_SHA" != "$GSHA" ]; then WHAT="갱신 ${PREV_SHA:0:7}→${GSHA:0:7}"; else WHAT="갱신(같은 판 ${GSHA:0:7})"; fi; fi
  # 설치가 늘 쓰는 경로는 변경을 전부, 첫 설치에만 쓰는 파일(team.json·HAZARDS·규칙 파일·배선 설정)은 아직 추적되지 않을 때만, .gitignore는 이번에 덧붙였을 때만 — 사람이 고친 것을 쓸어 담지 않는다
  OWNED=(.garagiste/scripts .garagiste/packs .garagiste/VERSION .githooks); FIRST=(.garagiste/team.json .garagiste/HAZARDS.md)
  if [ "$FLAVOR" = claude ]; then OWNED+=(.claude/hooks .claude/agents .claude/settings.garagiste.json); FIRST+=(.claude/settings.json CLAUDE.md); else OWNED+=(.opencode/agents .opencode/plugins opencode.garagiste.json); FIRST+=(opencode.json AGENTS.md); fi
  [ "$GI_WROTE" = 1 ] && OWNED+=(.gitignore)
  for p in "${OWNED[@]}"; do [ -e "$ROOT/$p" ] && git -C "$ROOT" add -A -- "$p"; done
  for p in "${FIRST[@]}"; do [ -e "$ROOT/$p" ] && [ -z "$(git -C "$ROOT" ls-files -- "$p")" ] && git -C "$ROOT" add -- "$p"; done
  git -C "$ROOT" update-index --chmod=+x .githooks/pre-commit
  if ! git -C "$ROOT" diff --cached --quiet; then
    if GARAGISTE_SHIP=1 GARAGISTE_WIP=1 git -C "$ROOT" -c user.name="${GIT_AUTHOR_NAME:-garagiste}" -c user.email="${GIT_AUTHOR_EMAIL:-garagiste@local}" commit -q -m "scaffold(team): GARAGISTE 증거 팀 $WHAT [$FLAVOR, budget $BUDGET]"; then echo "  팀 파일 커밋($WHAT — 기존 저장소, 생성물 차선)"; else echo "설치 FAIL — 팀 파일 커밋이 닫히지 않았다" >&2; exit 1; fi
  fi
  if [ "$PRE_DIRTY" = 1 ]; then echo "  설치 전의 미커밋 변경은 그대로 두었다(팀의 것이 아니다): $(git -C "$ROOT" status --porcelain | wc -l | tr -d ' ')개 — docs 차선(STATUS·BACKLOG·DECISIONS·LEDGER·REPORT)은 ship이 싣고, 나머지는 첫 ship 전에 CEO가 치운다"; fi
fi
echo "---"
# fail-closed: 빨간 채로 설치 완료를 선언하지 않는다 — doctor(--fresh: alive·빈 commands는 정상)와 selftest가 PASS여야 설치다
if [ "$DRY" = 0 ]; then
  (cd "$ROOT" && node .garagiste/scripts/doctor.mjs --fresh) || { echo "설치 FAIL — 위 doctor 줄이 이유다. 고치고 다시 설치하라." >&2; exit 1; }
  if [ "$SKIP_SELFTEST" = 0 ]; then
    (cd "$ROOT" && node .garagiste/scripts/selftest.mjs) || { echo "설치 FAIL — selftest. 위 단계 출력이 원인이다." >&2; exit 1; }
  fi
fi
echo "다음: 이 폴더에서 세션을 열고(claude) 만들 것을 말하라. 첫 unit(boot — 기존 코드가 있으면 adopt)이 스택·명령·스모크·규칙 파일을 채운다. 사람이 채울 파일은 없다."
