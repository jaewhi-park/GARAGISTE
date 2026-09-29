#!/usr/bin/env bash
# GARAGISTE 증거 팀 설치 — team/을 <repo>/.claude/로. 팀은 저장소 안에 산다.
# Usage: ./install.sh [-Project <path>] [-Budget low|medium|high] [-DryRun]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="."; BUDGET="medium"; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    -Project|--project) PROJECT="$2"; shift 2 ;;
    -Budget|--budget) BUDGET="$2"; shift 2 ;;
    -DryRun|--dry-run) DRY=1; shift ;;
    -h|--help|help) sed -n '2,3p' "$0"; exit 0 ;;
    *) echo "알 수 없는 옵션: $1" >&2; exit 1 ;;
  esac
done
ROOT="$(cd "$PROJECT" && git rev-parse --show-toplevel 2>/dev/null)" || { echo "git 저장소가 아니다: $PROJECT" >&2; exit 1; }
command -v node >/dev/null || { echo "node가 없다 (20 이상)" >&2; exit 1; }
run() { if [ "$DRY" = 1 ]; then echo "  [dry] $*"; else "$@"; fi; }
echo "GARAGISTE 증거 팀 → $ROOT (budget: $BUDGET)"
run mkdir -p "$ROOT/.claude/scripts" "$ROOT/.claude/hooks" "$ROOT/.claude/packs" "$ROOT/.githooks"
run cp "$HERE"/team/scripts/*.mjs "$ROOT/.claude/scripts/"
run cp "$HERE"/team/hooks/*.mjs "$ROOT/.claude/hooks/"
run cp "$HERE"/team/packs/*.md "$ROOT/.claude/packs/"
run cp "$HERE/team/githooks/pre-commit" "$ROOT/.githooks/pre-commit"
run chmod +x "$ROOT/.githooks/pre-commit"
[ -f "$ROOT/.claude/HAZARDS.md" ] || run cp "$HERE/team/HAZARDS.md" "$ROOT/.claude/HAZARDS.md"
if [ -f "$ROOT/.claude/settings.json" ]; then
  if ! grep -q 'hooks/guard.mjs' "$ROOT/.claude/settings.json"; then
    run cp "$HERE/team/settings.json" "$ROOT/.claude/settings.garagiste.json"
    echo "  .claude/settings.json이 이미 있다 → team 설정을 .claude/settings.garagiste.json에 두었다. permissions.deny와 hooks를 합쳐라."
  fi
else
  run cp "$HERE/team/settings.json" "$ROOT/.claude/settings.json"
fi
if [ ! -f "$ROOT/.claude/team.json" ]; then
  run cp "$HERE/team/team.json" "$ROOT/.claude/team.json"
  if [ "$DRY" = 0 ]; then
    node -e '
      const fs=require("fs"); const p=process.argv[1]; const t=JSON.parse(fs.readFileSync(p,"utf8"));
      const tiers={low:{spec:"sonnet",build:"haiku",attack:"sonnet",spike:"haiku"},medium:{spec:"opus",build:"sonnet",attack:"opus",spike:"sonnet"},high:{spec:"opus",build:"opus",attack:"opus",spike:"sonnet"}};
      t.models=tiers[process.argv[2]]||tiers.medium; fs.writeFileSync(p, JSON.stringify(t,null,2)+"\n");' "$ROOT/.claude/team.json" "$BUDGET"
  fi
  echo "  .claude/team.json — commands.quick·full·test_file을 프로젝트 명령으로 채워라"
fi
if [ ! -f "$ROOT/CLAUDE.md" ]; then
  run cp "$HERE/team/CLAUDE.md.template" "$ROOT/CLAUDE.md"
  echo "  CLAUDE.md — {{...}} 자리를 채워라(20줄, 그 이상은 규칙집 팽창이다)"
fi
touch "$ROOT/.gitignore"
if ! grep -q 'GARAGISTE 증거 팀' "$ROOT/.gitignore"; then
  if [ "$DRY" = 1 ]; then echo "  [dry] .gitignore += team/gitignore.snippet"; else { echo; cat "$HERE/team/gitignore.snippet"; echo "/.claude-pack"; echo ".worktrees/*/.claude-pack"; } >> "$ROOT/.gitignore"; fi
fi
run git -C "$ROOT" config core.hooksPath .githooks
echo "---"
if [ "$DRY" = 0 ]; then node "$ROOT/.claude/scripts/doctor.mjs" || true; fi
echo "다음: team.json 명령 채우기 → 첫 unit: node .claude/scripts/work.mjs new <slug> \"<CEO 말 그대로>\""
