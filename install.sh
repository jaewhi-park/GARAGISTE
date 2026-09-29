#!/usr/bin/env bash
# GARAGISTE 증거 팀 설치 — 팀 정본(team/)을 <repo>/.garagiste/로, 하네스 배선을 .claude/ 또는 opencode.json + .opencode/로.
# Usage: ./install.sh <claude|opencode> [-Project <path>] [-Budget low|medium|high] [-DryRun]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLAVOR="${1:-}"; [ $# -gt 0 ] && shift
case "$FLAVOR" in claude|opencode) ;; ""|-h|--help|help) sed -n '2,3p' "$0"; exit 0 ;; *) echo "하네스: claude 또는 opencode (받은 값: $FLAVOR)" >&2; exit 1 ;; esac
PROJECT="."; BUDGET="medium"; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    -Project|--project) PROJECT="$2"; shift 2 ;;
    -Budget|--budget) BUDGET="$2"; shift 2 ;;
    -DryRun|--dry-run) DRY=1; shift ;;
    *) echo "알 수 없는 옵션: $1" >&2; exit 1 ;;
  esac
done
mkdir -p "$PROJECT"
if ! ROOT="$(cd "$PROJECT" && git rev-parse --show-toplevel 2>/dev/null)"; then git -C "$PROJECT" init -q -b main; ROOT="$(cd "$PROJECT" && pwd)"; echo "git init: $ROOT"; fi
command -v node >/dev/null || { echo "node가 없다 (20 이상)" >&2; exit 1; }
run() { if [ "$DRY" = 1 ]; then echo "  [dry] $*"; else "$@"; fi; }
case "$BUDGET" in
  low)    M_INTAKE=sonnet; M_SPEC=sonnet; M_BUILD=haiku;  M_ATTACK=sonnet; M_SPIKE=haiku;  M_BOOT=haiku ;;
  high)   M_INTAKE=opus;   M_SPEC=opus;   M_BUILD=opus;   M_ATTACK=opus;   M_SPIKE=sonnet; M_BOOT=sonnet ;;
  *)      M_INTAKE=opus;   M_SPEC=opus;   M_BUILD=sonnet; M_ATTACK=opus;   M_SPIKE=sonnet; M_BOOT=sonnet; BUDGET=medium ;;
esac
echo "GARAGISTE 증거 팀 [$FLAVOR] → $ROOT (budget: $BUDGET)"
# 1. 팀 정본 — 하네스 중립
run mkdir -p "$ROOT/.garagiste/scripts" "$ROOT/.garagiste/packs" "$ROOT/.githooks"
run cp "$HERE"/team/scripts/*.mjs "$ROOT/.garagiste/scripts/"
run cp "$HERE"/team/packs/*.md "$ROOT/.garagiste/packs/"
run cp "$HERE/team/githooks/pre-commit" "$ROOT/.githooks/pre-commit"
run chmod +x "$ROOT/.githooks/pre-commit"
[ -f "$ROOT/.garagiste/HAZARDS.md" ] || run cp "$HERE/team/HAZARDS.md" "$ROOT/.garagiste/HAZARDS.md"
if [ ! -f "$ROOT/.garagiste/team.json" ]; then
  run cp "$HERE/team/team.json" "$ROOT/.garagiste/team.json"
  [ "$DRY" = 0 ] && node -e '
    const fs=require("fs"); const [p,i,s,b,a,k,o]=process.argv.slice(1); const t=JSON.parse(fs.readFileSync(p,"utf8"));
    t.models={intake:i,spec:s,build:b,attack:a,spike:k,boot:o}; fs.writeFileSync(p, JSON.stringify(t,null,2)+"\n");' "$ROOT/.garagiste/team.json" "$M_INTAKE" "$M_SPEC" "$M_BUILD" "$M_ATTACK" "$M_SPIKE" "$M_BOOT"
fi
# 2. 하네스 배선
sub() { sed -e "s/{{MODEL_BOOT}}/$M_BOOT/; s/{{MODEL_INTAKE}}/$M_INTAKE/; s/{{MODEL_SPEC}}/$M_SPEC/; s/{{MODEL_BUILD}}/$M_BUILD/; s/{{MODEL_ATTACK}}/$M_ATTACK/; s/{{MODEL_SPIKE}}/$M_SPIKE/" "$1" > "$2"; }
if [ "$FLAVOR" = claude ]; then
  run mkdir -p "$ROOT/.claude/hooks" "$ROOT/.claude/agents"
  run cp "$HERE"/team/claude/hooks/*.mjs "$ROOT/.claude/hooks/"
  for a in "$HERE"/team/claude/agents/*.md; do if [ "$DRY" = 1 ]; then echo "  [dry] agent $(basename "$a")"; else sub "$a" "$ROOT/.claude/agents/$(basename "$a")"; fi; done
  if [ -f "$ROOT/.claude/settings.json" ]; then
    if ! grep -q 'hooks/guard.mjs' "$ROOT/.claude/settings.json"; then
      run cp "$HERE/team/claude/settings.json" "$ROOT/.claude/settings.garagiste.json"
      echo "  .claude/settings.json이 이미 있다 → team 설정을 .claude/settings.garagiste.json에 두었다. permissions.deny와 hooks를 합쳐라."
    fi
  else run cp "$HERE/team/claude/settings.json" "$ROOT/.claude/settings.json"; fi
  RULES="$ROOT/CLAUDE.md"; TEMPLATE="$HERE/team/claude/CLAUDE.md.template"
else
  run mkdir -p "$ROOT/.opencode/agents" "$ROOT/.opencode/plugins"
  run cp "$HERE"/team/opencode/agents/*.md "$ROOT/.opencode/agents/"
  run cp "$HERE/team/opencode/plugins/guard.ts" "$ROOT/.opencode/plugins/guard.ts"
  if [ -f "$ROOT/opencode.json" ] || [ -f "$ROOT/opencode.jsonc" ]; then
    if ! grep -q '"conductor"' "$ROOT/opencode.json" 2>/dev/null; then
      run cp "$HERE/team/opencode/opencode.json" "$ROOT/opencode.garagiste.json"
      echo "  opencode.json이 이미 있다 → team 설정을 opencode.garagiste.json에 두었다. permission·default_agent·instructions를 합쳐라."
    fi
  else run cp "$HERE/team/opencode/opencode.json" "$ROOT/opencode.json"; fi
  echo "  opencode 모델: 기본 provider/model을 상속한다. 팩별로 바꾸려면 .opencode/agents/<pack>.md 앞머리에 model: <provider/model>"
  RULES="$ROOT/AGENTS.md"; TEMPLATE="$HERE/team/opencode/AGENTS.md.template"
fi
if [ ! -f "$RULES" ]; then run cp "$TEMPLATE" "$RULES"; fi
touch "$ROOT/.gitignore"
if ! grep -q 'GARAGISTE 증거 팀' "$ROOT/.gitignore"; then
  if [ "$DRY" = 1 ]; then echo "  [dry] .gitignore += team/gitignore.snippet"; else { echo; cat "$HERE/team/gitignore.snippet"; } >> "$ROOT/.gitignore"; fi
fi
run git -C "$ROOT" config core.hooksPath .githooks
# 첫 커밋이 없으면 설치기가 만든다(첫 커밋은 원장이 있을 수 없어 게이트가 통과시킨다) — 그 뒤 main에 닿는 것은 ship.mjs뿐
if [ "$DRY" = 0 ] && ! git -C "$ROOT" rev-parse --verify -q HEAD >/dev/null 2>&1; then
  git -C "$ROOT" add -A && GARAGISTE_SHIP=1 git -C "$ROOT" -c user.name="${GIT_AUTHOR_NAME:-garagiste}" -c user.email="${GIT_AUTHOR_EMAIL:-garagiste@local}" commit -q -m "scaffold(team): GARAGISTE 증거 팀 설치 [$FLAVOR, budget $BUDGET]" && echo "  첫 커밋: 팀 파일"
fi
echo "---"
[ "$DRY" = 0 ] && { node "$ROOT/.garagiste/scripts/doctor.mjs" || true; }
echo "다음: 이 폴더에서 세션을 열고(claude) 만들 것을 말하라. 첫 unit(boot)이 스택·명령·스모크·규칙 파일을 채운다. 사람이 채울 파일은 없다."
