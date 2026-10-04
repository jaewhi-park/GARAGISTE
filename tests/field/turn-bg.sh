#!/usr/bin/env bash
# turn-bg.sh <프로젝트 폴더> <n> "<CEO의 말>" [session_id] — turn.sh를 자기 세션(setsid)으로 떼어 돌린다. 결과는 <폴더>-turn<n>.out(끝에 turn.sh의 exit= 줄).
# L2 6판 2라운드(2026-10-03): 정비 채널의 배경 실행 상한(2시간)에 「가」 턴이 밖에서 죽어 restore의 build 팩이 끊겼다(시험 장치 사고 — resume으로 이었다).
# 무인 하루가 2시간을 넘는 제품(데몬 — build 팩 17~36분)은 이 꼴로 띄우고, 기다림은 `until grep -q "^exit=" <폴더>-turn<n>.out; do sleep 60; done`.
set -u
DIR="$(cd "$1" && pwd)"; N="$2"; MSG="$3"; SID="${4:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
setsid nohup bash "$HERE/turn.sh" "$DIR" "$N" "$MSG" $SID > "$DIR-turn$N.out" 2>&1 < /dev/null &
echo "detached pid $! → $DIR-turn$N.out"
