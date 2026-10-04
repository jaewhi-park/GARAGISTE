#!/usr/bin/env bash
# setup-seed.sh <brief.md> <프로젝트 폴더> [budget] [-SkipSelftest] — brownfield 테스트 베드(L3 Q13): 기존 코드·테스트·데이터가 있는 저장소에 설치한다.
# seed = tests/field/seeds/parcel-desk(Node CommonJS 약 300줄). 실제 세상의 흠을 그대로 둔다: `node --test test/`(node 22에서 디렉터리 인자는 실패) · 오늘 날짜를 박은 테스트 · skip 1 · CRLF 파일 하나 · .gitignore 없음.
# 사람 이름의 커밋 다섯 위에 CEO가 BRIEF-draft를 커밋하고(여섯째) install.sh가 팀 파일을 커밋한다(일곱째 — 사고 70). 첫 말은 FIELD-BENCH 「L2 모드」 고정 말 그대로 — 「빈 폴더」를 말하지 않는다.
set -euo pipefail
BRIEF="$1"; DIR="$2"; BUDGET="${3:-medium}"; SKIP="${4:-}"
G="$(cd "$(dirname "$0")/../.." && pwd)"; SEED="$G/tests/field/seeds/parcel-desk"
[ -e "$DIR" ] && { echo "FAIL setup-seed: $DIR 이미 있음"; exit 1; }
mkdir -p "$DIR"; DIR="$(cd "$DIR" && pwd)"
git -C "$DIR" init -q -b main
git -C "$DIR" config core.autocrlf false
put() { for f in "$@"; do mkdir -p "$DIR/$(dirname "$f")"; cp "$SEED/$f" "$DIR/$f"; done; }
c() { # c <이름> <메일> <시각> <메시지> — 사람의 커밋(게이트 전이라 그대로 닫힌다)
  export GIT_AUTHOR_NAME="$1" GIT_AUTHOR_EMAIL="$2" GIT_COMMITTER_NAME="$1" GIT_COMMITTER_EMAIL="$2" GIT_AUTHOR_DATE="$3" GIT_COMMITTER_DATE="$3"
  git -C "$DIR" add -A && git -C "$DIR" commit -q -m "$4"
}
put package.json README.md;                    c "박경비" "guard@apt.local" "2026-04-02T09:12:00+09:00" "택배 대장 시작 — 명령 넷 적음"
put lib/store.js; sed -i 's/$/\r/' "$DIR/lib/store.js"; c "박경비" "guard@apt.local" "2026-04-03T18:40:00+09:00" "저장을 따로 — parcels.json"
put lib/commands.js bin/parcel.js;            c "김반장" "kim@apt.local"   "2026-04-05T10:05:00+09:00" "in/out/list/find"
put test/store.test.js test/commands.test.js; c "김반장" "kim@apt.local"   "2026-04-20T22:31:00+09:00" "테스트 — node:test"
put parcels.json;                              c "박경비" "guard@apt.local" "2026-10-01T08:50:00+09:00" "반년치 대장 백업"
mkdir -p "$DIR/docs"; cp "$BRIEF" "$DIR/docs/BRIEF-draft.md"; c "박경비" "guard@apt.local" "2026-10-03T09:00:00+09:00" "새 기능 메모(BRIEF-draft)"
unset GIT_AUTHOR_DATE GIT_COMMITTER_DATE
export GIT_AUTHOR_NAME=ceo GIT_AUTHOR_EMAIL=ceo@field GIT_COMMITTER_NAME=ceo GIT_COMMITTER_EMAIL=ceo@field
bash "$G/install.sh" claude -Project "$DIR" -Budget "$BUDGET" $SKIP > "$DIR.install.log" 2>&1 || { tail -5 "$DIR.install.log"; exit 1; }
# 헤드리스엔 신뢰 대화가 없다 — 신뢰 안 된 작업 공간은 프로젝트 허용 목록을 무시한다(setup.sh와 같다; 시험에선 GARAGISTE_NO_TRUST=1로 건너뛴다)
[ -n "${GARAGISTE_NO_TRUST:-}" ] || node -e "const fs=require('fs');const f=require('os').homedir()+'/.claude.json';const j=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};j.projects=j.projects||{};j.projects[process.argv[1]]={...(j.projects[process.argv[1]]||{}),hasTrustDialogAccepted:true};fs.writeFileSync(f,JSON.stringify(j,null,2))" "$DIR"
echo "SETUP-SEED $DIR · framework $(git -C "$G" rev-parse --short HEAD) · budget $BUDGET · commits $(git -C "$DIR" rev-list --count HEAD) · $(grep -o 'SELFTEST [A-Z]* [0-9/]*' "$DIR.install.log" | tail -1 || true)"
