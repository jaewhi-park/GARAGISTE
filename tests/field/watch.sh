#!/usr/bin/env bash
# watch.sh <폴더>:<n> [<폴더>:<n> …] — 필드마다 ship 줄과 그 턴의 끝을 한 줄씩 낸다(Monitor·백그라운드 대기용). 모든 턴이 끝나면 종료.
declare -A seen done_ turn
for a in "$@"; do f="${a%:*}"; turn[$f]="${a##*:}"; n=$(grep -c '"kind":"ship"' "$f/.garagiste/ledger/evidence.jsonl" 2>/dev/null); seen[$f]=${n:-0}; done
while true; do
  all=1
  for f in "${!turn[@]}"; do
    L="$f/.garagiste/ledger/evidence.jsonl"
    n=$(grep -c '"kind":"ship"' "$L" 2>/dev/null); n=${n:-0}
    if [ "$n" != "${seen[$f]}" ]; then echo "$(basename "$f") ship #$n $(grep '"kind":"ship"' "$L" | tail -1 | grep -oE '"slug":"[^"]*"')"; seen[$f]=$n; fi
    lg="$f-turn${turn[$f]}.json"
    if [ -z "${done_[$f]:-}" ] && [ -s "$lg" ]; then echo "$(basename "$f") turn${turn[$f]} ended"; done_[$f]=1; fi
    [ -z "${done_[$f]:-}" ] && all=0
  done
  [ $all = 1 ] && exit 0
  sleep 20
done
