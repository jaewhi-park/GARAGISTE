# conduct 실전 run — 리눅스 · 진짜 claude 2.1.289 · 진짜 모델 (2026-10-04 R&D 12라운드 Node · 13라운드 Python · 14라운드 중간 크기 레거시 + conductor 턴 · 15라운드 대규모 레거시 138파일 + 비용 상한 실발동 · 16라운드 운영 둘째 날 — 갱신·재개·M2)

## 왜
1~11라운드의 드라이버(`conduct.mjs`)·헤드리스 spawner(`claude -p <팩> --agent <팩> …`)는 가짜 팩(`tests/fakes/pack.mjs`)과 `--help` 텍스트로만 검증됐다 — 9라운드(`--max-turns` 없음)·11라운드(Windows 셸 심)의 벽은 둘 다 **읽어서** 찾은 것이고, 실제 CLI가 실제로 어떻게 끝나는지(JSON 꼴 · 권한 · 모델 선택 · 훅)는 한 번도 보지 않았다. 12라운드는 그 자리를 **측정**으로 채운다: 정비 자리(리눅스 컨테이너)에 설치된 claude 2.1.289로 기존 코드가 있는 저장소에 설치 → intake → conduct 끝까지. 테스트는 그대로 모델 0 · 네트워크 0 — 이 문서는 측정 기록이다(HANDOFF 「장치는 사고·측정에서만」).

## 자리
- 정비 채널 컨테이너(리눅스 · node 22.22 · claude 2.1.289 · OAuth · 프록시). 중첩 세션이라 `headlessEnv`가 CLAUDE* 44개를 벗긴다(KEEP 8 — 인증은 됐다).
- 테스트 베드 `legacy`(scratchpad — 세션이 끝나면 사라진다): Node CLI `invoice-tool 0.3.1`(`bin/invoice.js` · `lib/total.js` · 기존 테스트 1 · 원격 bare 저장소) · `install.sh claude -Project … -Budget medium`(설치 커밋 · SELFTEST 21/21) → 12라운드 스크립트로 갱신(`UPGRADE 661a9ed → 661a9ed — 바뀌는 파일 1: conduct.mjs` · 갱신 커밋).
- 원문(BRIEF 한 문단): 「지금 있는 invoice CLI는 그대로 둔다. 더할 것 하나: 항목에 discount(퍼센트, 0~100)가 있으면 그 항목 금액에서 그만큼 뺀 뒤 합산한다 … 범위를 벗어나거나 숫자가 아니면 종료 코드 1과 한 줄 오류 메시지(stderr)로 거부한다. 외부 네트워크는 쓰지 않는다.」

## 탐침 셋 (모델 1턴씩 — 드라이버가 기대하는 계약을 CLI에 직접 묻는다)
| # | 무엇을 | 명령(요지) | 결과 | 비용 |
|---|---|---|---|---|
| 1 | 신뢰 없는 폴더에서 `-p`가 도는가 · JSON 결과 꼴 · `--max-budget-usd`의 뜻 | 빈 저장소 · `claude -p "ok" --output-format json --permission-mode acceptEdits --permission-prompts none --max-budget-usd 0.05` | 돈다(신뢰 대화 없음 — CLI `--help`도 그렇게 적는다). 기본 모델은 세션 기본(fable). **예산은 첫 턴 뒤에 걸린다** — 상한 $0.05에 $0.43(시스템 프롬프트 캐시 생성 21,406 토큰이 한 턴) → `is_error: true` · `subtype: error_max_budget_usd` · `errors: ["Reached maximum budget ($0.05)"]` · `result` 없음 · **`usage`는 전부 0, 실측은 `modelUsage`에만** · exit 1 | $0.428 |
| 2 | `--agent build`가 agents 파일을 읽는가(모델) · 훅 · allow | legacy(신뢰 없음) · `claude -p "Bash로 doctor를 돌려 stdout 그대로" --agent build … --max-budget-usd 1` | 모델 **claude-sonnet-5-5**(agents의 `model: sonnet` 적용) · SessionStart 훅이 돌았다(doctor 줄을 봤다) · **Bash 거부 1(`permission_denials`)** — stderr 「Ignoring 66 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. … set projects[…].hasTrustDialogAccepted: true in ~/.claude.json」 · exit 0 · `subtype success` | $0.032 |
| 3 | 신뢰 뒤(`conduct.mjs trust`) 같은 팩을 conduct와 같은 환경(`headlessEnv`)으로 | 2와 같은 명령 | **거부 0** · doctor가 돌아 stdout이 그대로 왔다 · 모델 sonnet · 2턴 · CLAUDE* 44개를 벗겨도 인증 됨 | $0.019 |

탐침이 바꾼 것(코드): `conduct.mjs trust`(preflight 「신뢰 없음」의 수리 — 그 키를 쓴다, 대화형 claude를 열 수 없는 자리) · preflight 문구를 측정대로(「헤드리스엔 신뢰 대화가 없다」 → 「allow 목록을 버려 Bash가 전부 거부된다」) · `parseResult`가 `usage` 0이면 `modelUsage` 합 · 실측 모델(`spawned --model`) · 비정상 종료 줄에 `subtype: errors`.

## 첫 run(Node, 12라운드) — intake
`conduct.mjs intake --pack-usd 3 --pack-minutes 15`: brief → PACK 4.1KB → intake 팩(opus) 4턴 · 31,928 토큰 · 0.2분 · **$0.099** · 거부 0 → unit 3(adopt · discount · discount-reject, M1, needs adopt) · 질문 0 → `STOP ceo`(exit 2) 14초. 관찰: 인수 줄의 따옴표가 `”`(U+201D) — 팩이 셸 인용을 피해 둥근 따옴표를 썼다(spec이 테스트로 바꿔 쓰니 해롭지 않지만 복붙은 안 된다).

## 첫 run(Node, 12라운드) — 루프
`work.mjs scope --milestone M1`(adopt → discount → discount-reject) → `conduct.mjs --max-usd 8 --pack-usd 3 --pack-minutes 20`:

| 시각(UTC) | 걸음 | 팩·모델 | 턴 · 토큰 · 분 | $ | 결과 |
|---|---|---|---|---|---|
| 08:20:07 | seed → brief adopt → spawn | adopt · sonnet | 16턴 · 156K · 0.6분 | 0.138 | 특성화 테스트 8(기존 1 포함) · 명령 넷(quick·full=파일 목록 — 관찰 1 · setup=`true` — 관찰 2) · verify full PASS · 거부 1(`cd … && cat …; ls -a; …`) |
| 08:20:45 | ship adopt | — | — | — | SHIPPED 6d5077a sensor=machine(8조건 · 통합 tree 재검증) |
| 08:20:47 | seed discount → brief spec → spawn | spec · opus | 12턴 · 112K · 0.9분 | 0.272 | 인수 1 · human 0 · 질문 0 · `RED discount 1/1` · 거부 1(`cd …; ls -R … 2>/dev/null \| head …`) |
| 08:21:42 | brief build → spawn | build · sonnet | · 126K · 0.6분 | 0.122 | 커밋 1 · verify full PASS · redproof PASS(base_red → head_green) · 거부 1(`W=…; cd $W; cat > lib/total.js <<'E' …` — 쓰기는 Write 도구로 우회) |
| 08:22:20 | brief attack → spawn | attack · opus | · 125K · 0.8분 | 0.272 | adversary 1파일 5케이스 · **red 1/1(3 실패)** — 항목이 숫자·문자열·불리언이면 `'discount' in i`가 TypeError로 죽음(전엔 NaN·exit 0 — 「지금과 똑같다」 위반) · 거부 1(`cd … && ls …; git -C . log …`) |
| 08:23:12 | brief build(공격 red 1) → spawn | build · sonnet | · 130K · 0.6분 | 0.107 | `fix(discount)` 커밋 · verify attack red 0/1 · redproof PASS · full PASS · 거부 1(`cd … && git reset --soft HEAD~1 && …` — 이건 거부가 옳다) |
| 08:23:49 | ship discount | — | — | — | SHIPPED e26b722(공격 선발견 1→0/1) |
| 08:23:54 | seed discount-reject → brief spec → spawn | spec · opus | · 141K · 1.0분 | 0.329 | **redproof FAIL — base에서 green**: discount의 공격 수리가 범위 밖·숫자 아님 거부(exit 1·stderr 한 줄)를 이미 만들었다(main에서 CLI로 확인) · 팩은 red를 억지로 만들지 않았다 · 거부 1(`W=…; git -C $W status …; ls -R $W/tests …`) |
| 08:24:54 | redproof(next의 재시도) → `ask --hold` Q1 | — | — | — | hard 질문으로 그 unit만 세움 → **`STOP wait`(exit 3)** · 이 run $1.242 · 4분 47초 |
| 08:29:23 | 대리 CEO: `decide 1 "예 — 이미 충족"` → `drop discount-reject --forget` | — | — | — | DROPPED(작업은 dropped/ 브랜치) · decide가 `ACCEPT … (spec이 red 수용 테스트로)`를 냈다 — 관찰 4 |
| 08:29:23 | `conduct` 다시 → `work.mjs system` → brief attack → spawn | attack · opus | · 169K · 0.9분 | 0.317 | system-1: 새 테스트 0(발견 0) · 기존 24/24 · try 카드 3단계와 경계 입력(-0 · 1e400 · `Discount` 키 · 중복 키 · null · 배열 아님) 전부 surface와 일치 · 거부 1(묶음 셸) |
| 08:30:21 | drop system-1 --forget → `state.mjs report` → done | — | — | — | REPORT(출하 2/3 · 써볼 것 2 · docs(report) 커밋) → **`STOP done`(exit 0) — SCOPE DONE** · 이 run $0.317 · 58초 |

main의 끝: `f09746d invoice tool 0.3.1` → 설치 커밋 → 갱신 커밋 → `adopt(adopt)` → `ship(adopt)` → `fix(discount)` → `ship(discount)` → `docs(report)`. 제품 코드는 adopt에서 한 줄도 바뀌지 않았고(특성화 8), discount는 인수 1 + 공격 1(선발견 1 수리)로 출하됐다.

### 관찰 (번호는 CHANGELOG 12라운드와 같다)
1. **quick·full이 파일 목록**(`node --test tests/unit/invoice-cli.test.js tests/total.test.js`) — 인수(`tests/acceptance/discount.test.js`)·공격(`tests/adversary/discount-1.test.js`) 파일이 full에 안 든다. 출하는 redproof·attack이 test_file로 증명하니 막히지 않지만, **다음 unit의 full이 앞 unit의 인수·공격을 다시 돌리지 않는다**(출하 뒤 회귀 무방비 — 2026-10-01 파이썬 관찰과 같은 뿌리, 둘의 규칙 충족). → 장치: `work.mjs commands` 등록 때 탐침(full은 깨진 인수 파일에 red여야 · quick은 green이어야 · 탐침 전부터 red면 판단 않음) — 저장하지 않고 FAIL, 팩이 그 자리에서 고친다.
2. **`setup=true`** — boot 팩 4(「의존성 0이어도 생태계의 설치 명령」)를 adopt가 어겼다. 다음 unit이 의존성을 더하면 ship의 머지 직후 setup이 아무것도 안 한다(사고 21의 자리). 장치 없음(첫 번째) — 둘째면 `commands`가 매니페스트(package.json·pyproject·go.mod)로 setup의 꼴을 본다.
3. **승인 거부 — 팩 8 중 6이 첫 Bash에서 한 번씩**(원장 guard 줄 0 — 가드가 아니라 Claude Code의 승인; `--permission-prompts none`이 거부로 바꿨다). 탐침 10(아래 표)으로 가른 규칙: **`cd … && node …`는 통과, `cd … && cat|ls|git status …`는 거부**, cd 없는 `ls <경로>`·`cat …; ls -a`·`git -C … log`·`ls … 2>/dev/null | head`는 통과. 팩은 Read 도구로 우회해 한 턴(≈$0.02~0.05)을 잃었다. → `.claude/agents/<팩>.md` 6에 측정 한 줄(셸은 `cd && node` 꼴만 · 둘러보기는 Read·Glob·Grep · git은 `git -C`).
4. **decide의 ACCEPT 줄** — hold에 걸린 Q1의 답에 `ACCEPT discount-reject — 결정 Q1이 인수에 실렸다(spec이 red 수용 테스트로)`가 나왔다. 사고 59의 hold는 re-spec이 없는데 그 줄만 보면 conductor가 spec을 다시 띄운다. → `HOLD <slug> — re-spec 없음, 답의 길은 그 FAIL의 안내(drop --forget · brief.mjs <팩>)`가 먼저.
5. 인수 줄의 따옴표 `”`(intake가 셸 인용을 피했다) — 복붙은 안 되지만 spec이 테스트로 바꿔 쓴다. 장치 없음.
6. 이미 충족된 주장(discount-reject)의 인수 테스트(exit 1·stderr 한 줄 거부)는 dropped 브랜치로 갔다 — main의 회귀 지킴은 discount의 공격 파일에 기댄다(그 파일이 범위 밖 discount를 다루는지는 확인하지 않았다). 백로그 「2순위 — 이미 충족된 주장 박기」의 셋째 근거.
7. 중첩 세션에서 `headlessEnv`가 CLAUDE* 44개를 벗겨도 인증·프록시가 됐다(KEEP 8). CEO의 맨 셸엔 벗길 것이 없다.

### 권한 탐침 (10 × 1턴 · sonnet · $0.159)
| 꼴 | 결과 |
|---|---|
| `cd .worktrees/discount && ls -a` | 거부 |
| `ls -R bin tests 2>/dev/null \| head -5` | 통과 |
| `cat bin/invoice.js; ls -a` | 통과 |
| `W=.worktrees/discount; cd $W; ls -a` | 거부 |
| `git -C .worktrees/discount log --oneline -2` | 통과 |
| `cd .worktrees/discount && node -e "console.log(1)"` | **통과** |
| `cd .worktrees/discount && cat package.json` | 거부 |
| `ls -a .worktrees/discount` | 통과 |
| `cd .worktrees/discount && git status --short` | 거부 |
| `cd lib && ls -a`(worktree가 아닌 폴더) | 거부 |

## 둘째 run — Python (13라운드 2026-10-04 · 둘의 규칙: 둘째 생태계에서 같은 길)
테스트 베드 `pylegacy`(scratchpad): `ledger-tool 0.2.0` — `ledger/core.py`·`ledger/cli.py`(`python -m ledger.cli '<JSON>'` → 합계) · unittest 1 · pyproject · 원격 bare. 설치(동결 18 b835451 · SELFTEST 21/21) → `conduct trust` → `check` PASS. 원문 한 문단: 「기존 ledger CLI는 그대로 … `--by-category`를 주면 카테고리별 소계를 이름 순으로 … category 없는 항목은 etc … 외부 네트워크는 쓰지 않는다」.

| 시각(UTC) | 걸음 | 팩·모델 | 토큰 · 분 | $ | 결과 |
|---|---|---|---|---|---|
| 08:50:15 | intake | opus | 31K · 0.2 | 0.073 | unit 2(adopt · by-category) · 질문 0 · 12초 → `STOP ceo` |
| 08:50:27 | seed adopt → spawn | adopt · sonnet | 205K · 0.8 | 0.176 | **`FAIL commands — 눈먼 명령 1(저장하지 않았다)`(08:51:01 — 12라운드 탐침이 실제 팩 앞에서 섰다)** → 6초 뒤 하네스 `tests/harness/run_file.py`(하이픈 이름도 경로 그대로 · 0건이면 exit 1)로 quick·full·test_file 등록 → 특성화 10 + 기존 1 · `.gitattributes` · `setup=true`(관찰 — 12라운드와 같다, 둘의 규칙) · 거부 0 |
| 08:51:20 | ship adopt | — | — | — | SHIPPED 4cbe98f |
| 08:51:21 | seed by-category → spec | spec · opus | 126K · 0.9 | 0.282 | RED 1/1 · **Q1**(기존 특성화 「--by-category를 무시해 2.00」이 새 요구와 충돌 — `ask --assumed` 「대체된다」) → `STOP wait`(exit 3) · 이 run $0.458 · 1분 48초 |
| 08:54:57 | 대리 CEO `decide 1 "예"` | — | — | — | RESPEC(답이 진행 중에 — 사고 17) · ACCEPT |
| 08:54:57 | brief spec(RESPEC) → spawn | spec · opus | 90K · 0.4 | 0.189 | 질문 0(답이 가정과 같다) · RED 1/1 |
| 08:55:22 | build | build · sonnet | 176K · 0.7 | 0.143 | 구현 · verify full PASS · **`spec:` 반려 1** — 인수 테스트의 기대값 산술 오류(12.50 ≠ 2.5+10+1) → 드라이버가 `brief.mjs spec --return`으로 넘겼다 |
| 08:56:05 | spec(--return) | spec · opus | 52K · 0.4 | 0.141 | 테스트 수정 · redproof **PASS base_red head_green(re-spec — build가 이미 만들었다)** → next: build 불필요, attack |
| 08:56:34 | attack | attack · opus | 90K · 0.9 | 0.273 | 공격 1파일 8케이스 · **red 1/1 — 결함 2**(카테고리 이름의 개행 → 가짜 줄 · 숫자 category가 etc로 합쳐짐) |
| 08:57:26 | build(공격 red) | build · sonnet | 178K · 0.6 | 0.127 | `fix(core)` · attack red 0/1 · redproof PASS · full PASS · 거부 1(`cd … && git reset --soft HEAD~1 && …`) |
| 08:58:08 | ship by-category | — | — | — | SHIPPED d5c84f4(선발견 1→0/1) |
| 08:58:08 | `work.mjs system` → attack | attack · opus | 130K · 0.8 | 0.299 | system-1: 공격 1파일 2케이스 · **red 1/1 — 결함 2**(짝 없는 서로게이트 category → `--by-category`에서 UnicodeEncodeError · U+2028/2029·\x0b·\x0c·\x1c 줄 분리) |
| 08:58:58 | build(system-1) | build · sonnet | 124K · 0.5 | 0.111 | `fix(core)` 비출력 문자 이스케이프 · attack red 0/1 · 거부 1(같은 `git reset --soft`) |
| 08:59:31 | ship system-1 → REPORT → done | — | — | — | SHIPPED b2983fc · REPORT(출하 2/2 + 이음새 1) → **`STOP done` — SCOPE DONE** · 이 run $1.283 · 4분 35초 |

합계: 팩 10 · 토큰 1.20M · 팩 시간 6.2분 · **run $1.81** · 기계 벽시계 ≈7분 · 프레임워크 FAIL 0 · 사람 접점 1(Q1) · 공격이 찾은 결함 4(전부 수리·출하) · `spec:` 반려 1(산술 오류 — build가 잡았다). main: `ledger tool 0.2.0` → 설치 → adopt → ship(adopt) → fix → ship(by-category) → fix → ship(system-1) → docs(report).

### 관찰 (13라운드)
8. **`setup=true` 둘째**(Node adopt · Python adopt) → 장치: `work.mjs commands`가 매니페스트(package.json·pyproject·requirements·go.mod·Cargo.toml)가 있는데 setup이 `true`·`:`·`echo`·`exit 0`이면 저장하지 않는다(`setupNoop`).
9. **거부 3 — 전부 `cd <worktree> && git reset --soft HEAD~1 && …`**(build 팩이 wip 체크포인트 커밋을 풀어 정식 커밋으로 얹으려 했다 — ship의 head 조건이 요구하는 바로 그 일). 12라운드 Node run의 build도 같은 명령 1 → 넷. `git reset --soft`는 allow에 없었다(파괴적 reset --hard만 deny) → `.claude/settings.json` allow에 `Bash(git reset --soft:*)`(기존 설치본은 drift로 보인다 — `settings.garagiste.json`). 12라운드의 agents 한 줄(`cd && node`만) 뒤 Node run 6/8 → Python run 3/10 — 둘러보기 거부는 0이 됐다.
10. 이미 충족된 주장 → **kind pin**(13라운드 장치, 백로그 2순위 채용): 이 run엔 자리가 없었다(by-category의 re-spec PASS는 build 뒤라 정상). 검사는 e2e(hold 경로 · `--kind pin` 직접).

### 시간 상한 탐침 — SIGTERM (13라운드)
`claude -p "sleep 90 …" --agent build …`에 8초 뒤 SIGTERM: **1.9초 뒤 종료 · exit 143 · stdout 0바이트(JSON 없음) · stderr 없음**. 뜻: `--pack-minutes`의 SIGTERM은 든다(고아 없음) — 그러나 끊긴 팩의 비용·토큰은 원장에 남지 않는다(spawned 줄은 분만) → `--max-usd` 합계가 끊긴 팩의 지출을 못 본다(상한은 그만큼 느슨하다). SIGTERM을 무시하는 팩은 보지 못했지만 드라이버는 이제 5초 뒤 SIGKILL(runChild killAfterMs — installSignals와 같은 꼴).

## 셋째 run — 중간 크기 레거시(Node, 14라운드 2026-10-04) · 입구는 대화형 conductor 한 턴
테스트 베드 `biglegacy`(scratchpad): `inventory-svc 1.4.2` — 파일 19 · 소스 137줄(`src/` 7 모듈: config·store·validate·format·report·handlers·server · `bin/inv.js` CLI · `lib/legacy-utils.js`(죽은 코드 포함) · `scripts/migrate.js`) · 두 표면(HTTP API 5 라우트 + CSV · CLI 4 명령) · 기존 테스트 6(**빨간 것 1** — `test/date.test.js`가 2025년을 박았다) · `npm test`가 `node --test test/`(node 22에서 디렉터리 인자는 실패 — 실제 레거시의 흔한 꼴) · 원격 bare. 설치(동결 19 75826e5 · SELFTEST 21/21) → trust → check PASS. 원문: 「지금 있는 inventory 서비스(HTTP API … CLI …)는 그대로 둔다. 더할 것 하나: tag로 거르기 — GET /items?tag=<t> … CLI list --tag <t> … 없는 태그면 빈 목록 … 외부 네트워크는 쓰지 않는다」.

### 입구 — 대화형 conductor 턴(CLAUDE.md Flow 2, 헤드리스 `claude -p "개발해" --model sonnet`, R&D 뒤 첫 실제 모델)
| 사실 | 값 |
|---|---|
| 턴 · 모델 · 비용 · 시간 | 5턴 · conductor sonnet + 서브에이전트 opus · $0.20 · 50초 |
| 배선 | `brief.mjs intake` → **Agent(subagent_type: intake, prompt: 팩 경로)** → SubagentStop 훅 → 원장 `spawn_stop`(intake) → conductor가 `work.mjs spawned intake intake`(11,302 토큰 · 1분) — 훅·원장 줄 전부 들었다 |
| **서브에이전트의 거부** | intake 서브에이전트의 `work.mjs add` 네 개가 **전부 승인 거부**됐다 — 명령 텍스트가 `\`+줄바꿈으로 시작(`"\\\nnode .garagiste/scripts/work.mjs add adopt …"` — 긴 명령을 잇는 모델의 버릇). allow는 접두(`Bash(node .garagiste/scripts/work.mjs:*)`)로 맞춰 `\`로 시작하면 허용된 명령도 승인 요청 → `--permission-prompts none`이 거부. 서브에이전트는 「거부당해 unit을 하나도 못 넣었다」로 끝났다 |
| **conductor의 대리 실행** | conductor도 첫 시도는 같은 `\` 꼴로 거부 → 둘째 시도(`node …` 한 줄)는 통과 → **intake의 네 `add`를 conductor가 직접 쳤다**(원문과 대조해 그대로 — adopt · tag-filter-api · tag-filter-cli · **no-network(--kind pin — 13라운드의 intake 규칙 4 「제약형은 pin」을 썼다)**). 결과는 옳았지만 길은 Flow 밖(팩의 일을 conductor가) — L2 역사의 「빈칸은 모델이 메운다」 꼴. 질문 0 · 「M1로 진행할까요?」로 턴이 끝났다(Flow 2의 끝 — 옳다) |
| 가드 | 원장 guard 줄 0(거부는 Claude Code의 승인) |

→ 장치: `.claude/agents/<팩>.md` 7에 한 줄 — 「명령은 `node …`로 시작하는 한 줄로, 줄머리 `\`·빈 줄·줄 끝 `\` 잇기 없음」(측정). conductor의 대리 실행은 관찰로 남긴다(둘째 근거가 오면 장치 — 예: `brief.mjs intake` 뒤 다음 `work.mjs add`가 팩 밖(GARAGISTE_PACK 없음)에서 오면 한 줄 경고).

### 루프 — `work.mjs scope --milestone M1`(adopt → tag-filter-api → tag-filter-cli → no-network) → `conduct --max-usd 8 --pack-usd 3 --pack-minutes 20`
| 시각(UTC) | 걸음 | 팩·모델 | 토큰 · 분 | $ | 결과 |
|---|---|---|---|---|---|
| 09:27:24 | seed adopt → spawn | adopt · sonnet | 293K · 1.5 | 0.268 | **특성화 20(CLI 12 · HTTP 8)** · 소스 불변 · `?tag` 무시 동작은 다음 unit과 충돌해 굳히지 않았다 · **`setup=true` 거부**(13라운드 setupNoop — 09:28:36) → `npm install`로 재등록 · **빨간 기존 테스트(date.test.js)를 quick·full에서 빼고 Q1** · Q2(tag 필터는 다음 unit에서? — BACKLOG가 이미 답인 군질문) · 거부 0 → unit은 질문에 걸려 `STOP wait`(exit 3) |
| 09:29:47 | 대리 CEO `decide 1·2` | — | — | — | Q1 「그대로 제외」 · Q2 「예」 → ACCEPT 줄이 「spec이 red 수용 테스트로」(adopt엔 spec이 없다 — 관찰 → 수리) |
| 09:29:48 | ship adopt | — | — | — | SHIPPED d5974c8 |
| 09:29:50 | tag-filter-api spec → build → attack | opus · sonnet · opus | 103K·1.3 / 130K·0.5 / 269K·1.5 | 0.251 / 0.113 / 0.431 | RED 1/1 → `feat(items)` → 공격 9건 **red 0**(결함은 「이 diff 밖」 — tags가 문자열이면 /export.csv가 응답 도중 예외로 죽는다 — 테스트 안 함, 글로만: 관찰) → next의 tree redproof·full → SHIPPED 1d8522c |
| 09:33:27 | tag-filter-cli spec → build → attack → build | opus · sonnet · opus · sonnet | 102K·0.7 / 161K·0.6 / 181K·1.1 / 175K·0.6 | 0.282 / 0.116 / 0.410 / 0.136 | RED → `feat(cli)` → 공격 13건 **red 5**(값 없는 `--tag`·반복·`--tag=값`이 전체 목록으로 샌다 — API는 `[]`) → 수리 → red 0 → SHIPPED 6d919b6 |
| 09:36:38 | **no-network(kind pin)** spec → attack → build | opus · opus · sonnet | 179K·1.4 / 202K·1.6 / **429K**·1.0 | 0.396 / 0.483 / 0.233 | **PIN no-network 1/1(main에서도 통과)** — 핀: 서버 전 경로·CLI 전 명령이 바깥에 연결하지 않음을 감시자로 → build 없이 attack → 공격 7건 **red 1**(`listen(PORT)`가 0.0.0.0에 연다 — surface는 127.0.0.1만) + `platform:` 한 줄(Windows UNC 경로) → build가 127.0.0.1로 → **첫 실제 pin 출하** SHIPPED 23f2103 · LEDGER `pin_base=green head_green (pin)` |
| 09:40:49 | system-1 attack → build | opus · sonnet | 188K·1.1 / 203K·0.8 | 0.400 / 0.163 | 이음새 3건 **red 3/3**(`?tag=a&tag=b`는 API 첫 값·CLI 교집합 · `""`·`--beta` 태그를 API는 찾고 CLI는 빈 결과) → 수리 → SHIPPED 8750ee9 |
| 09:42:53 | next → `STOP ceo` | — | — | — | **「CEO 접점 없이 출하 5 ≥ 5 — 예산 정지」**(exit 2) — 무인 출하 상한이 처음 실발동했다(설계대로: REPORT 전에 사람이 써봐야 한다) · STATUS 「안 본 것 1/3」 |

합계: conductor 턴 $0.20 + 팩 13(conduct) $3.68 = **$3.88** · 토큰 2.6M · 팩 시간 14.7분 · 기계 벽시계 ≈15분 · 출하 5(adopt · api · cli · **pin** · system) · 공격이 찾은 결함 9건(cli 5 · pin 1 · 이음새 3) 전부 수리 · 프레임워크 FAIL 0 · 사람 접점 2(Q1·Q2) + 정지 1(출하 상한).

### 관찰 (14라운드)
11. **conductor 턴의 서브에이전트 거부와 대리 실행**(위 「입구」) → agents 7에 「한 줄 명령」. 대리 실행은 관찰(둘째 근거 대기).
12. **`cd … && git reset --soft HEAD~1 && …` 거부 6(build 팩 5개 중 5)** — 13라운드에 allow에 `git reset --soft`를 더했지만 `cd &&` 묶음은 그대로 거부된다(12라운드 규칙: `cd && node`만 통과). 세 run 합계 10건, 전부 같은 일(wip 체크포인트 커밋을 풀어 정식 커밋으로 — ship의 head 조건이 요구하는 일) → 장치: **`checkpoint.mjs unwip`**(스크립트가 푼다 — `cd && node …`는 통과) + brief가 HEAD가 wip인 build 팩에 그 명령을 적는다.
13. decide의 ACCEPT 줄이 adopt에 「spec이 red 수용 테스트로」 → kind를 알게(수리).
14. 공격이 **diff 밖 결함**을 글로만 남겼다(tag-filter-api: `/export.csv`가 문자열 tags에 죽는다) — 공격 규칙(「이 diff」)대로다. 이음새 공격이 뒤에 그 자리를 보지 않았다(태그 거르기만 봤다). 집은 없다 — 후보: 공격의 「diff 밖 결함」 줄을 BACKLOG 후보로 받는 길(판단이 들어 CEO 결정).
15. adopt의 **군질문**(Q2 — BACKLOG가 이미 답) — 질문 하나가 unit을 세운다(STOP wait). 관찰.
16. pin unit의 build 팩이 429K 토큰(가장 큼) — 감시자 기반 핀 테스트의 경합(기동 로그 vs listen 관측)을 고치느라. 공격 팩 7건이 네트워크 감시자를 만들었다 — pin의 공격은 「주장이 깨지는 입력」이라 제약형엔 환경(인터페이스·경로)으로 간다.

## 넷째 run — 대규모 레거시(Node, 15라운드 2026-10-04) · 비용 상한 실발동
테스트 베드 `biglegacy2`(scratchpad, 생성기 `r15/gen.mjs` — 결정론적): `erp-lite 2.3.0` — **파일 138 · JS 948줄** · 도메인 10(order·customer·product·invoice·shipment·payment·discount·tax·warehouse·supplier) × 모듈 6(model·validate·repo·rules·service·format) = 60 · HTTP 라우트 10 + router·server·respond · CLI 명령 모듈 10 + `bin/cli.js`(`<domain> list|get|add|rm`) · lib 8 · scripts 4 · 시드 데이터 10 · 기존 테스트 38 중 **빨간 것 2**(2024년을 박은 것 · CI의 PORT=9999를 가정한 것) · `npm test`는 `node --test test/`(node 22에서 깨진 꼴) · 원격 bare. 생성 코드지만 동작은 진짜다(검증·규칙·JSON 저장·표·CSV). 원문: 「erp-lite 서비스(도메인 10의 HTTP API·CLI·export-all)는 그대로 둔다. 더할 것 하나: 주문 상태 필터 — GET /orders?status=<s> … CLI order list --status <s> … 목록에 없는 상태면 빈 목록 … 외부 네트워크는 쓰지 않는다」.

질문 둘: (a) adopt 팩 하나가 파일 138·표면 20(라우트 10·명령 10)을 어디까지 특성화하는가 — 토큰·시간·팩 상한·unit 토큰 상한(1M)에 닿는가 (b) `--max-usd 1`의 비용 상한 정지가 실제로 서는가(지금까지 탐침·e2e만).

### 입구 — 설치 → trust → check → brief → `conduct intake` → 대리 CEO decide → scope
| 사실 | 값 |
|---|---|
| 설치·점검 | `install.sh claude`(selftest PASS 21/21) → `conduct trust` → `conduct check` PASS(doctor OK · VERSION 4c126a4 · claude 2.1.289 · 깃발 ok · agents 7 · 신뢰 ok) — 12·13라운드의 길 그대로, 사람 손 0 |
| intake | 팩 4.3KB · opus · 33K 토큰 · 18초 · **$0.112** · 6턴 → BACKLOG unit 4(adopt · order-status-http · order-status-cli · **no-network `--kind pin`** — 13라운드 intake 규칙 4가 셋째 run에 이어 다시 섰다) · 질문 0 · `scope --milestone M1` 요청 4 · 선행 0 |
| 질문 둘의 답 | (a) 아래 adopt 행 — 특성화 88 · 421K · 2.3분 · 팩 10.2KB(상한 32의 1/3) · unit 토큰 상한(1M)의 42% (b) 아래 `STOP cap` 행 — 선다, 걸음 사이에서 |

### 루프 — `conduct --max-usd 1`(비용 상한 실발동) → `conduct --max-usd 10`(끝까지)
| 시각(UTC) | 걸음 | 팩·모델 | 토큰 · 분 | $ | 결과 |
|---|---|---|---|---|---|
| 10:07:41 | seed adopt → spawn | adopt · sonnet | 421K · 2.3 | 0.313 | **특성화 88**(CLI 10 도메인 + HTTP + export-all · 30턴) · 소스 불변 · 빨간 기존 테스트 2(legacy.port · legacy.year)는 quick·full에서 빼고 **Q1** · **진짜 결함(add마다 id 0 → 같은 id 여럿, get/rm 1 실패)을 Q2로** · 명령 넷 등록(첫 `work.mjs commands`는 중괄호 글롭·이스케이프 따옴표 꼴로 **승인 거부**, 둘째 통과) → `STOP wait`(exit 3 — 질문 2가 adopt를 세웠다) |
| 10:10:49 | 대리 CEO `decide 1·2` | — | — | — | Q1 「그대로 제외」 · Q2 「예 — 지금은 그대로 굳힌다(id 0은 다음 범위의 unit)」 → ACCEPT 줄이 adopt를 안다(14라운드 수리 확인) → SHIPPED adopt 2eda7a9 |
| 10:10:57 | order-status-http spec → build → **`spec:` 반려** → re-spec → attack | opus · sonnet · opus · opus | 165K·1.0 / 139K·0.6 / 127K·0.5 / 202K·1.3 | 0.313 / 0.128 / 0.210 / 0.417 | RED 1/1 → build가 반려(인수 3번 「필터 결과의 각 주문은 GET /orders/:id와 같은 모양」은 주문마다 id가 달라야 하는데 Q2는 id 0을 그대로 두라 했다 — **CEO의 답과 어긋나는 인수를 반려로 잡았다**, 사고 33의 장치 첫 실전) → re-spec(기존 코드가 새 주장을 이미 만족 → build 없이 attack) → 공격 14건 **red 0** → **`STOP cap 2026-10-04T10:14:24 — 비용 상한 $1 — 이 실행 $1.067`(exit 5)** |
| 10:14:24 | `conduct --max-usd 10` | — | — | — | 그 자리에서 이어진다(원장·worktree 그대로): redproof → full → **SHIPPED b4a15a9** — 상한은 걸음 사이에서 선다, 넘긴 팩(attack $0.417)은 끝까지 돌고 비용은 든다 |
| 10:14:43 | order-status-cli spec → build → attack → build | opus · sonnet · opus · sonnet | 121K·0.9 / 130K·0.6 / 159K·0.9 / 265K·0.9 | 0.310 / 0.100 / 0.308 / 0.161 | RED → `feat` → 공격 6건 **red 3**(값 없는 `--status`·`--status --json`·`--status=paid`에 필터가 조용히 꺼져 6건 전체 — HTTP는 빈 목록) → 수리 → SHIPPED c4e87a7 |
| 10:18:25 | **no-network(kind pin)** spec → attack | opus · opus | 236K·2.3 / 204K·1.8 | 0.444 / 0.500 | **PIN 1/1(base에서도 초록)** → 공격 5건(절대 URL · CONNECT · 외부 Host · URL이 든 본문·데이터 · 깨진 데이터 — HTTP·CLI·export) **red 0** → redproof·full → SHIPPED 8f26e60 · spec의 `cd && node -e "<인라인 코드>"` 1건 **승인 거부**(둘러보기는 Read·Glob로 — agents 줄 밖) |
| 10:23:32 | system-1 attack | opus | 202K · 1.4 | 0.461 | 이음새 3건(파일 1) **red 1/1** — 1·2번은 **앞 unit들의 try 카드 기대를 그대로 단언**(cli 카드는 기본 data의 paid 75까지 세 줄 · http 카드는 「paid 하나·전체 3건」 — 기본 data와 어긋나는 카드) · 3번은 진짜 이음새(같은 상태를 두 번 주면 CLI는 마지막 값 · HTTP는 첫 값) |
| 10:24:59 → 10:35:37 | **system-1 build × 30** | sonnet | 2,005K · 9.7 | **2.867** | build가 `spec:` 반려(「공격 1·2번이 서로 어긋난다 — try 카드의 기대를 하나로 정해야」, 커밋 0)를 27번 남기고 → conduct가 `brief.mjs spec system-1 --return` → **`FAIL 시스템 공격 unit은 attack·build 팩만`** → 반려는 「정당한 빈손」이라 안 세어지고 next는 「공격 red 1 — build 다시」 → … 3번은 `spec:` 줄 없이 빈손으로 끝나 그 둘로 `STOP framework build 팩이 system-1에서 두 번 돌았는데 worktree가 그대로다(HEAD 937c798)`(exit 4). 승인 거부 4(`… unwip; git -C . status …` — `;`·파이프 묶음) · **unit 토큰 2.21M ≥ 상한 1M인데 서지 않았다** |

합계: 팩 43 · 토큰 4.41M · **$6.644**(되풀이 $2.87 · 그 밖 $3.78) · 팩 시간 24.5분 · 기계 벽시계 ≈28분(10:07 → 10:35) · 출하 4(adopt · http · cli · **pin**) · 공격이 찾은 결함 4(cli 3 · 이음새 1) + 카드 모순 1 · 프레임워크 FAIL 1(사고 71 — 27회) · 사람 접점 2(Q1·Q2) + 정지 2(비용 상한 · framework) · 승인 거부 7(adopt 2 · spec 1 · build 4).

### 관찰 (15라운드)
17. **사고 71 — system unit의 반려가 갈 곳이 없었다**(위 표의 마지막 행). spec이 없는 unit의 `spec:` 반려를 brief는 「attack·build 팩만」으로 거절했고, conduct는 반려를 정당한 빈손으로 보아(진전 없음도 되풀이도 세지 않음) 같은 build를 30번 띄웠다 — $2.87. → 수리 둘: brief가 `spec <slug> --return`을 system unit에선 **attack 팩으로 돌린다**(카드를 쓴 팩이 받는다 — PACK 줄 「반려 → attack」, 팩 절 「서로·기본 data와 어긋나는 카드의 기대를 바로잡는다, 결함을 잡는 단언은 그대로」, 둘째 반려는 spec과 같이 CEO hold) · conduct는 **반려 전달의 FAIL을 run 걸음의 FAIL과 같은 열쇠로 센다**(`handOffKey`, 되풀이 2 → `STOP framework 반려를 받을 길이 없다`). 가짜 팩 e2e: attack,build,attack,build → Q1 hold → SCOPE DONE.
18. **사고 72 — unit 토큰 상한이 진동 안에서 보이지 않았다**: system-1 spawn 토큰 2.21M(상한 1M)인데 next는 seed와 ship 직전(red 0)에만 stops를 봤다 — 「공격 red → build 다시」 길은 상한을 지나지 않았다(장치가 겨눈 바로 그 진동). → `budgetStatus.tokenStops`(unit별) + next가 **걸음마다 그 unit의 상한**을 본다(팩을 띄우는 길은 전부 지난다). e2e 갱신: 세 팩 3600 ≥ 3000에서 공격 red 1인데 build를 띄우지 않고 선다.
19. **비용 상한(`--max-usd 1`) 첫 실발동**: 걸음 사이에서 선다 — 넘긴 팩은 끝까지 돌고 그 비용은 합계에 든다($1.067) · 다시 `conduct`는 그 자리에서 이어진다. 설계대로 — 장치 없음. (사고 72의 토큰 상한이 섰다면 되풀이는 1M 근처 ≈ $1.3에서 섰을 것 — 두 상한은 다른 것을 센다: 비용은 run, 토큰은 unit.)
20. **승인 거부 7의 꼴**: `;`·`|`로 이어 붙인 명령 5(adopt 탐색 묶음 1 · build의 `unwip; git -C . status | head` 4 — 14라운드 unwip은 쳤지만 뒤에 git을 붙였다) → **agents 7 「한 줄에 명령 하나」**(측정 → 한 줄, 둘째 근거). 관찰(둘째 근거 대기): `work.mjs commands …{cli,…}…`(중괄호 글롭 + 이스케이프 따옴표 — 허용 접두인데 승인 요청, 둘째 시도 통과) · `cd && node -e "<인라인 코드>"`(12라운드 「`cd && node`는 통과」의 예외 — 인라인 코드).
21. **intake가 진짜 결함(id 0)을 unit이 아니라 adopt의 질문으로 올렸다** — CEO 「그대로」 뒤 spec이 그 결함과 어긋나는 인수를 썼고 build의 반려 1회로 풀렸다(사고 33의 장치가 처음 실전에서 섰다). 관찰: BACKLOG에 결함 unit 후보가 남지 않았다(Q2의 답 안에만) — 14라운드 관찰 14(공격의 diff 밖 결함에 집이 없다)와 같은 자리, 둘째 근거.
22. **adopt 팩 하나가 파일 138·표면 20을 특성화 88로**: 10.2KB 팩 · 421K 토큰 · 2.3분 · $0.31 — 파일 19(293K · 20)의 1.4배 토큰에 특성화 4.4배. 토큰은 파일 수가 아니라 **표면 수**(라우트 10 + 명령 10 + export)에 비례한다 — Q13 「대규모」 조각은 이 크기까지 측정됨. unit 토큰 상한(1M)엔 멀다.
23. **이음새 공격이 출하물(try 카드)의 모순을 결함으로 찍었다** — 카드는 CEO 접점의 문서(`docs/units/<slug>/try.md`)라 build가 고칠 수 없었다(반려의 진짜 이유). 반려가 attack에게 가면 attack은 **자기 단언**(tests/adversary)을 바로잡고 진짜 이음새(3번)만 남긴다 — 카드 자체를 고치는 것은 여전히 CEO(`--revise`). 수리 뒤의 실전 모양은 다음 run.

## 다섯째 run — 운영 둘째 날(같은 베드 erp-lite · 16라운드 2026-10-04) · 갱신 설치 → 멈춘 unit 재개 → REPORT → 다음 범위(M2)
질문 둘: (a) 15라운드가 멈춰 둔 상태(system-1 build 되풀이 뒤 STOP framework · main엔 팀이 쓴 docs 차선 2 파일이 미커밋)에 새 판(동결 21)을 **갱신 설치**하고 이어 돌릴 수 있나 — 갱신·토큰 상한(사고 72)·반려 → attack(사고 71) 장치의 실전 모양 (b) REPORT 뒤 **둘째 범위(M2)** 에서 레거시 동작 변경(id 0 → 증가)이 출하된 unit의 테스트와 어떻게 부딪히나.

### stage A — 갱신 설치(동결 21) → conduct
| 시각(UTC) | 걸음 | 팩·모델 | 토큰 · 분 | $ | 결과 |
|---|---|---|---|---|---|
| 11:28:48 | `install.sh claude`(main 더러움: docs 차선 2) | — | — | — | **UPGRADE 4c126a4 → feac1d9 — 바뀌는 파일 11** 미리보기 · selftest 21/21 · 「팀 파일은 커밋하지 않았다 — 설치 전에 미커밋 변경이 있었다」(→ 사고 74) |
| 11:28:52 | `conduct check` → `next` → `conduct` | — | — | — | PASS check(VERSION feac1d9) · **`STOP unit system-1 토큰 2207K ≥ 상한 1000K — CEO 결정: … budget …`(exit 2 — 사고 72 장치 첫 실발동, 15라운드엔 보이지 않던 정지)** |
| 11:28:52 | CEO `budget system-1 4000K` → conduct | — | — | — | PASS budget 1000000 → 4000000 |
| 11:29:11 | build system-1 | sonnet | 61K · 0.3 | 0.097 | 반려를 백틱으로 감쌌다(`\`spec: …\``) — **읽히지 않았다**(→ 사고 73) → 진전 없음 1 |
| 11:29:27 | build system-1 → **반려 → attack** | sonnet · opus | 60K · 0.2 / 246K · 1.1 | 0.090 / 0.404 | 반려(plain) → `PACK system-1-attack … · 반려 → attack(system unit엔 spec이 없다 …)` → **attack이 자기 카드 둘의 기대를 바로잡고(red 0/1) 진짜 이음새 단언은 그대로 — 사고 71 장치의 첫 실전, 설계대로** |
| 11:30:54 | verify full PASS → ship system-1 | — | — | — | **`FAIL ship: 메인 worktree에 미커밋 변경 — .claude/agents/… .garagiste/scripts/… .garagiste/VERSION`** ×2 → `STOP framework 같은 FAIL 되풀이`(exit 4) — 갱신 설치가 커밋하지 않은 팀 파일(→ 사고 74) |

### stage A2 — 사고 73·74 수리 뒤 갱신 → ship → REPORT
| 시각(UTC) | 걸음 | 결과 |
|---|---|---|
| 11:40:57 | `install.sh claude -SkipSelftest`(main 더러움 14 = 팀 파일 12 + docs 2) | **UPGRADE feac1d9 → ab0f62f — 바뀌는 파일 1** · **「팀 파일 커밋(갱신 feac1d9→ab0f62f — 기존 저장소, 생성물 차선)」 + 「설치 전의 미커밋 변경은 그대로 두었다(팀의 것이 아니다): 2개 — docs 차선은 ship이 싣고…」** |
| 11:40:57 | conduct → ship system-1 → report | SHIPPED system-1 c9ca65e · REPORT 출하 4/4 · 이음새 발견 1 → 고쳐 출하 · **SCOPE DONE**(exit 0) — 15라운드가 멈춘 자리에서 팩 셋·$0.59·12분 만에 범위가 닫혔다 |

### stage B — 다음 범위 M2: 「주문 id는 add마다 1씩 늘어난다 — CLI와 HTTP 둘 다. 기존 데이터의 id는 그대로 둔다.」(adopt가 Q2로 올렸던 진짜 결함을 CEO가 unit으로)
| 시각(UTC) | 걸음 | 팩·모델 | 토큰 · 분 | $ | 결과 |
|---|---|---|---|---|---|
| 11:41:22 | brief → `add order-id --milestone M2 --needs adopt` → `scope --milestone M2` → conduct | — | — | — | SCOPE 요청 1 · UNIT order-id spec — REPORT 뒤의 둘째 범위가 같은 명령으로 열린다 |
| 11:42:41 | spec order-id | opus | 209K · 1.3 | 0.456 | RED 1/1(CLI·HTTP 모두 max+1 · 기존 id 불변) |
| 11:44:10 | build → **`spec:` 반려** | sonnet | 266K · 1.5 | 0.178 | `fix(order): add마다 id를 max+1로`(repo.add가 item.id로 nextId를 덮던 것) + **adopt의 특성화 테스트(「프로세스마다 id가 0」) 갱신** → verify full FAIL: **출하된 order-status-cli의 인수 2 + 공격 1이 옛 동작(id 0)의 기대 표** → 반려 |
| 11:44:50 | re-spec | opus | 136K · 0.6 | 0.270 | 「반려 기각 — order-id 주장은 원문·주장끼리 맞다. 어긋나는 쪽은 order-status-cli 테스트인데 두 파일은 order-id spec이 쓸 수 없는 곳」 · redproof base red·head green → attack 새 바퀴 |
| 11:45:58 | attack | opus | 191K · 1.1 | 0.389 | 8건 **red 1/1(2건)** — **진짜 결함: repo.add가 파일을 잠그지 않아 동시 add에 id가 겹치고(1,1,1,1,2,2…) 주문이 사라진다(12 중 9 저장)** — adopt·M1 공격이 못 본 것 |
| 11:46:18 | build → 둘째 반려 | sonnet | 117K · 0.3 | 0.203 | 커밋 0 · 「그 테스트 3건은 내가 고칠 수 없는 경로」 → **`FAIL spec 반려가 두 번째` → Q3 hold → `STOP wait`(exit 3)** — 설계된 종착(CEO). 그런데 안내의 길에 **출하된 unit의 인수를 고칠 손이 없었다**(→ 사고 75) |

<!-- STAGE-C -->

### 관찰 (16라운드)
24. **사고 73 — 포장된 반려**: 모델은 `spec:` 줄을 백틱·불릿·굵게로 감싼다(넷째·다섯째 run의 system-1 build 32회 중 6회). 읽히지 않은 반려는 「빈손」으로 세어져 build가 다시 떴다 → `specReturn`이 포장을 벗긴다(unit 테스트는 실제 줄 둘).
25. **사고 74 — 갱신 설치와 더러운 main**: 사고 70의 「더러우면 손대지 않는다」가 운영 중엔 늘 참이다(팀이 쓰는 STATUS·BACKLOG가 ship 사이에 미커밋으로 남는다) → 갱신의 팀 파일이 미커밋으로 남아 다음 ship이 막혔다(STOP framework). 설치는 **자기가 쓴 팀 파일만** 커밋한다(첫 설치 전용 파일은 untracked일 때만 · .gitignore는 덧붙였을 때만) — install.ps1 패리티 · e2e 사고 70 → 70·74.
26. **사고 75 — 출하된 unit의 인수를 고칠 손**: 새 원문(id 증가)이 출하된 unit(order-status-cli)의 인수·공격 테스트와 어긋났다. 공격 테스트는 `attack --revise`(사고 42)가 있었지만 인수는 spec 팩이 「자기 slug의 것만」으로 알고 출하된 unit엔 spec이 없다 → CEO의 고쳐 쓰기 결정은 `brief.mjs spec <slug> --revise "<CEO 말>"`로 들어가 unit에 실리고(`unit.revise`), 이어지는 attack 팩이 `--revise` 없이도 같은 결정으로 공격 테스트를 고친다(둘이 받으면 지운다). 둘째 반려 FAIL의 안내에 그 길. 실전 모양은 stage C.
27. **사고 71·72 장치의 실전**: 토큰 상한은 재개 첫 걸음에 섰다(2207K ≥ 1000K — 15라운드엔 2.2M을 쓰는 동안 안 섰던 것) · 반려 → attack은 한 번에 끝났다(attack $0.40 — 카드 둘을 바로잡고 진짜 단언은 그대로, red 0) → ship. 장치 둘 다 설계대로.
28. **갱신 설치의 모양**: 미리보기(UPGRADE old → new — 바뀌는 파일 n)가 설치 전에 한 줄로 나오고, VERSION이 바뀌고, 갱신 커밋 제목에 old→new. 같은 판의 재설치는 커밋이 없다.
29. **REPORT 뒤 M2**: 같은 명령(brief → add → scope → conduct)으로 둘째 범위가 열렸다. adopt가 질문(Q2)으로 올렸던 진짜 결함을 CEO가 unit으로 올리는 데 사람의 손이 셋(brief·add·scope) — 결함의 집 장치(`defect:` → `work.mjs found` → BACKLOG 후보)의 둘째 근거 → 채용.
30. **레거시 동작 변경은 세 겹에 부딪힌다**: adopt의 특성화 테스트(build가 고친다 — 설계대로) · 출하된 unit의 인수(사고 75) · 출하된 unit의 공격 테스트(사고 42). 셋째 범위에서 또 나올 모양.
31. **M2 공격이 진짜 동시성 결함을 찍었다**(동시 add → id 겹침·주문 유실) — adopt(특성화)와 M1 공격(상태 필터)이 보지 못한 자리. 레거시 수리 unit의 공격은 그 자리의 다른 결함을 드러낸다 — `defect:` 후보의 자리이기도 하다.

## 비용 합계 (다섯 run)
| 무엇 | $ |
|---|---|
| 12라운드 탐침 13 + run(Node, 팩 8) | 2.30 |
| 13라운드 run(Python, 팩 10) + SIGTERM 탐침 | 1.83 |
| 14라운드 conductor 턴 + run(Node 중간 레거시, 팩 13) | 3.88 |
| 15라운드 run(Node 대규모 레거시 파일 138, 팩 43 — 되풀이 30 포함) | 6.64 |
| 16라운드 운영 둘째 날(같은 베드 — 갱신·재개·M2, 팩 <!-- STAGE-C-N -->) | <!-- STAGE-C-USD --> |
| **합계** | **<!-- STAGE-C-TOTAL -->** — unit 하나(spec·build·attack·수리) ≈ $0.6~1.1 · pin unit ≈ $0.9~1.1 · 이음새 공격 한 바퀴 ≈ $0.3~0.6(되풀이 제외) · adopt ≈ $0.14~0.31(파일 3 → 138 — 표면 수에 비례) · 사고 71의 되풀이 $2.87(수리됨 — 다음부턴 되풀이 2에서 선다, 사고 72의 토큰 상한이 먼저 서면 ≈ $1.3) |

## 판정 (16라운드 갱신)
- **운영 둘째 날(16라운드)**: 멈춘 베드에 새 판을 갱신 설치하고 이어 돌리는 길이 선다 — 미리보기 → 팀 파일만 커밋(더러운 main에서도) → 재개(토큰 상한이 먼저 선다 → CEO budget) → 반려 → attack → ship → REPORT → 다음 범위. 둘째 날이 드러낸 사고 셋(73 포장된 반려 · 74 갱신과 더러운 main · 75 출하된 인수를 고칠 손)은 전부 코드로 닫았다. **레거시 동작 변경(M2)은 출하된 unit의 테스트와 부딪히는 것이 정상이고, 그 종착은 CEO의 한 마디(spec --revise)다** — 실전 모양은 「다섯째 run」 stage C.
- **① 신규·기계 검증 가능(CLI·웹·데몬·API) + 리눅스 + `conduct.mjs`: 투입 가능(실측 4/4)** — 네 run이 설치부터 범위 끝(SCOPE DONE 둘 · 무인 출하 상한 하나 · 이음새 공격 직전까지 하나)까지, 공격이 unit마다 결함을 찾아 수리까지(합계 결함 18). 프레임워크 FAIL은 넷째 run의 사고 71 하나(system unit의 반려 — 수리됨: 되풀이 2에서 선다, 반려는 attack에게)와 그 뒤의 사고 72(토큰 상한이 진동 안에서 안 보임 — 수리됨). 사람 접점 run당 1~2(hold·질문·출하 상한·비용 상한 — 전부 설계된 멈춤). 조건은 12라운드와 같다 + 팩은 `cd && node …` 한 줄에 명령 하나(agents) + 끊긴 팩의 비용은 원장 밖 + `--max-usd`는 걸음 사이에서 선다(넘긴 팩 하나의 비용은 든다).
- **③ 레거시 입구(adopt)**: 네 크기(Node 3파일 · Python 3파일 · Node 19파일 두 표면 · **Node 138파일 표면 20**)에서 선다 — 특성화 8·10·20·**88**, 빨간 기존 테스트는 빼고 묻는다, 진짜 결함은 질문으로 올린다(unit 후보로는 아직 — 관찰 21), 탐침이 눈먼 full·노옵 setup을 등록 때 막는다. adopt 비용은 파일 수가 아니라 **표면 수에 비례**(421K · $0.31 · 2.3분 — 팩 10.2KB/32 · unit 토큰 1M의 42%). **여러 패키지(모노레포)·「관심 영역 지도」는 미측정.**
- **대화형 conductor(CLAUDE.md Flow)**: Flow 2 한 턴이 배선(Agent 서브에이전트 · SubagentStop 훅 · spawned)을 전부 지났다. 단 서브에이전트가 허용된 명령을 `\`+줄바꿈으로 시작해 거부되자 conductor가 팩의 일을 대신했다 — 무인 세션에선 사람이 모르는 채 결과만 옳다. agents 한 줄이 꼴을 막지만, 「conductor가 팩의 일을 대신한다」는 둘째 근거가 오면 장치.
- **상한 둘(15라운드 실측)**: 비용 상한(run)은 설계대로 선다 · 토큰 상한(unit)은 진동 안에서 안 섰다 → 걸음마다(사고 72). 둘이 다 선 뒤의 무인 운전 비용 꼴: unit당 $0.6~1.1 · 이음새 한 바퀴 ≤ 1M 토큰(≈ $1.3) 뒤 CEO.
- **② UI 중심·DB·마이그레이션·멀티서비스**: 변화 없음 — 아직. **Windows**: CEO PC 대기.
- 다섯 run이 못 본 것: 충돌 rebase(두 unit이 같은 파일 — 순차 운전에선 docs 차선 외엔 main이 안 움직인다) · 모노레포 · 사람 센서 unit · opencode 레인 · 사흘 이상의 운영 · `defect:` 후보가 실전에서 올라오는 모양(가짜 팩만) <!-- STAGE-C-UNSEEN -->.
