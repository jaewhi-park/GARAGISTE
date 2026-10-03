#!/usr/bin/env bash
# deliver.sh <프로젝트 폴더> "<커밋 메시지>" — 정본(team/)의 scripts·packs·HAZARDS를 필드 main에 반영하고 바뀐 경로만 커밋(CEO의 정비 반영 블록과 같은 일). 정비 모드에서만.
set -e
F="$1"; MSG="$2"; G="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$F"
cp "$G"/team/scripts/*.mjs .garagiste/scripts/
cp "$G"/team/packs/*.md .garagiste/packs/
cp "$G"/team/HAZARDS.md .garagiste/HAZARDS.md
cp "$G"/team/claude/settings.json .claude/settings.json
[ -d .claude/hooks ] && cp "$G"/team/claude/hooks/*.mjs .claude/hooks/  # 훅도 정본이다(사고 60의 원장 줄 절단은 훅 파일에 있었다)
CH=$(git status --porcelain -- .garagiste/scripts .garagiste/packs .garagiste/HAZARDS.md .claude/settings.json .claude/hooks | awk '{print $2}')
[ -z "$CH" ] && { echo "no change"; exit 0; }
GIT_AUTHOR_NAME=ceo GIT_AUTHOR_EMAIL=ceo@field GIT_COMMITTER_NAME=ceo GIT_COMMITTER_EMAIL=ceo@field GARAGISTE_SHIP=1 GARAGISTE_WIP=1 git commit -q -m "$MSG" -- $CH
echo "DELIVERED $(git log --oneline -1) · $(echo $CH | tr '\n' ' ')"
echo "주의: 템플릿(CLAUDE.md Flow) 변경은 설치된 CLAUDE.md에 손으로 — boot이 채운 파일이다"
