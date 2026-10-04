# conduct 실전 첫 run — 리눅스 · 진짜 claude 2.1.289 · 진짜 모델 (2026-10-04 R&D 12라운드)

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

## 첫 run — intake
`conduct.mjs intake --pack-usd 3 --pack-minutes 15`: brief → PACK 4.1KB → intake 팩(opus) 4턴 · 31,928 토큰 · 0.2분 · **$0.099** · 거부 0 → unit 3(adopt · discount · discount-reject, M1, needs adopt) · 질문 0 → `STOP ceo`(exit 2) 14초. 관찰: 인수 줄의 따옴표가 `”`(U+201D) — 팩이 셸 인용을 피해 둥근 따옴표를 썼다(spec이 테스트로 바꿔 쓰니 해롭지 않지만 복붙은 안 된다).

## 첫 run — 루프
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

## 비용 합계
| 무엇 | $ |
|---|---|
| 계약 탐침 3(1은 fable 기본 모델 — 상한 $0.05에 $0.43) | 0.479 |
| 권한 탐침 10 | 0.159 |
| intake | 0.099 |
| 루프 1(adopt → discount 출하 → discount-reject hold) | 1.242 |
| 루프 2(system-1 → REPORT → SCOPE DONE) | 0.317 |
| **합계** | **2.30**(그중 run 1.658 · 팩 8 · 토큰 991K · 팩 시간 5.6분 · 기계 벽시계 ≈6분) |

## 판정
- **① 신규·기계 검증 가능(CLI·웹·데몬·API) + 리눅스 + `conduct.mjs`: 투입 가능(실측)** — 설치부터 SCOPE DONE까지 사람 접점 1(hold 결정), 프레임워크 FAIL 0, unit당 ≈$0.7(spec·build·attack·수리). 조건: `conduct check`가 PASS일 것(신뢰 없음이면 `conduct trust`) · 팩 비용 상한은 바닥값(시스템 프롬프트 캐시 — sonnet ≈$0.02~0.1 · opus ≈$0.1~0.3)의 몇 배 · hold·ceo 멈춤은 사람이 `decide` 뒤 FAIL의 안내대로(drop --forget 또는 재spawn).
- **③ 레거시 입구(adopt)**: 첫 측정 통과 — 특성화 8 · 제품 코드 불변 · 공격이 「지금과 똑같다」 위반(TypeError)을 잡아 수리까지. 다만 소규모 Node 하나(파일 3 · 테스트 1). 특성화 대량·관심 영역 지도(큰 레거시)는 미측정.
- **② UI 중심·DB·마이그레이션·멀티서비스**: 변화 없음 — 아직(Q14 사람-증거 레인 첫 조각만, 하네스 kit 없음).
- **Windows**: 변화 없음 — CEO PC 검증 대기(install.ps1 · `conduct check` 「claude <판> · 깃발 ok」 · 팩 하나 spawn) + `conduct trust`(대화형을 열 수 없을 때).
- 이 측정이 못 본 것: 긴 팩(시간 상한) · 비용 상한 정지 · 충돌 rebase · 사람 센서 unit(UI) · opencode 레인 · 이틀 이상의 운영(원장·worktree 누적).
