#!/usr/bin/env bash
# turn.sh <프로젝트 폴더> <n> "<CEO의 말>" [session_id] — 중첩 헤드리스 conductor 한 턴. 말은 <폴더>-turn<n>.msg, 결과는 <폴더>-turn<n>.json
set -u
DIR="$(cd "$1" && pwd)"; N="$2"; MSG="$3"; SID="${4:-}"
OUT="$DIR-turn$N.json"; printf '%s\n' "$MSG" > "$DIR-turn$N.msg"
export GIT_AUTHOR_NAME=ceo GIT_AUTHOR_EMAIL=ceo@field GIT_COMMITTER_NAME=ceo GIT_COMMITTER_EMAIL=ceo@field
cd "$DIR"
# 부모 세션의 환경이 새면 세션 id가 합쳐지고 권한이 부모로 보류된다 — 인증에 필요한 것만 남기고 CLAUDE* 변수를 걷어 낸다
UNSET=""; for v in $(env | grep -oE "^(CLAUDE[A-Z_]*|CLAUDECODE)=" | tr -d '='); do case $v in CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST|CLAUDE_CODE_PROXY_RESOLVES_HOSTS|CLAUDE_SESSION_INGRESS_TOKEN_FILE|CLAUDE_CODE_ACCOUNT_UUID|CLAUDE_CODE_ORGANIZATION_UUID|CLAUDE_CODE_USER_EMAIL) ;; *) UNSET="$UNSET -u $v";; esac; done
if [ -n "$SID" ]; then env $UNSET claude -p "$MSG" --resume "$SID" --output-format json --max-turns 400 > "$OUT" 2>"$OUT.err"
else env $UNSET claude -p "$MSG" --output-format json --max-turns 400 > "$OUT" 2>"$OUT.err"; fi
echo "exit=$? out=$OUT"
node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));console.log('session',j.session_id,'turns',j.num_turns,'cost',j.total_cost_usd,'subtype',j.subtype);console.log('---');console.log(j.result)" "$OUT" 2>&1 | tail -80
