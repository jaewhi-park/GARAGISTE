#!/usr/bin/env bash
# setup.sh <brief.md> <프로젝트 폴더> [budget] — 빈 폴더 + docs/BRIEF-draft.md → install.sh(첫 커밋이 원문을 담는다) → 작업 공간 신뢰
set -euo pipefail
BRIEF="$1"; DIR="$2"; BUDGET="${3:-medium}"
G="$(cd "$(dirname "$0")/../.." && pwd)"
[ -e "$DIR" ] && { echo "FAIL setup: $DIR 이미 있음"; exit 1; }
mkdir -p "$DIR/docs"; cp "$BRIEF" "$DIR/docs/BRIEF-draft.md"; DIR="$(cd "$DIR" && pwd)"
export GIT_AUTHOR_NAME=ceo GIT_AUTHOR_EMAIL=ceo@field GIT_COMMITTER_NAME=ceo GIT_COMMITTER_EMAIL=ceo@field
bash "$G/install.sh" claude -Project "$DIR" -Budget "$BUDGET" > "$DIR.install.log" 2>&1 || { tail -5 "$DIR.install.log"; exit 1; }
# 헤드리스엔 신뢰 대화가 없다 — 신뢰 안 된 작업 공간은 프로젝트 허용 목록을 무시한다(하네스 메모)
node -e "const fs=require('fs');const f=require('os').homedir()+'/.claude.json';const j=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};j.projects=j.projects||{};j.projects[process.argv[1]]={...(j.projects[process.argv[1]]||{}),hasTrustDialogAccepted:true};fs.writeFileSync(f,JSON.stringify(j,null,2))" "$DIR"
echo "SETUP $DIR · framework $(git -C "$G" rev-parse --short HEAD) · budget $BUDGET · $(grep -o 'SELFTEST [A-Z]* [0-9/]*' "$DIR.install.log" | tail -1)"
