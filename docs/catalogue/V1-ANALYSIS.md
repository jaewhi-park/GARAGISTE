# GARAGISTE 프로세스 효율 종합 분석 — "코드까지 단계가 너무 많다"에 대한 답

작성 2026-09-28 · 대상: GARAGISTE(프레임워크) + AX_PLATFORM(48 plan) + LACUNA(24 plan) + tacit(kickoff만)
방법: 프레임워크 정의 전수 독해 → git 이력·METRICS·PR·plan 문서로 시간·결함 계량 → 4개 렌즈 독립 판정 → 종합 → 제안마다 3표 반박(증거·안전·실현성). 반박에 걸린 제안은 수정본으로 실었고, 근거가 무너진 제안은 버렸다.

---

## 1. 판정 (TL;DR)

**의구심은 절반 맞다.** 절차가 많은 것 자체보다 **"plan 하나당 크기와 무관한 고정비 약 70분"**이 문제다. AX·LACUNA 둘 다 회귀 절편이 70분(AX `70 + 11분/100줄`, LACUNA `70 + 7.5분/100줄`). 그래서 6줄짜리 버그도 41분, 24줄 plan도 34분이 들고, 1,245줄 plan과 24줄 plan의 시간 차이는 4.7배뿐이다. 코드를 실제로 쓰는 시간은 활성 시간의 **41~47 %**, 나머지 53~59 %가 계획·비평·리뷰 대기·수정·출하 문서·보드다.

**결함을 실제로 잡은 것은 둘뿐이다.**
- correctness + security 2렌즈 리뷰: finding 237건 중 제품·보안 결함(A급) 56 % — RCE(gray-matter `---js`)·TOCTOU·심링크 탈출·env 재주입·연결 누출 등 진짜 것들.
- **"돌려 봄"**(CEO가 앱을 켬, 실 키로 bench 실행, 빌드 명령 실행): 하얀 화면·B01·B02·0046 라이선스 — 가장 비싼 rework 4건 전부. 게이트 5개(critic·2~5렌즈·2~3라운드·verifier·self-check)를 다 통과한 뒤에 잡혔다.

**값을 거의 못 낸 것**: critic(A급 15 %, 형식·규칙 준수 46 %), per-step verifier(제품 결함 검출 0 — AX 0045·0046에서 7회 실행 전부 PASS), self-check 보고 줄(효과를 관측할 방법 자체가 없음), performance 렌즈(hot-path major 0; tmp 누수 2건은 잡았으나 correctness 체크리스트 한 줄로 대체 가능), 3라운드 리뷰(2,000줄급 초기 plan에서만 A급, 후기 plan에선 문구 수정·fix 재발).

**새 프로젝트 시작은 특히 나쁘다.** tacit: 설치 → 92분 동안 문서 13개 794줄, 코드 0줄, 그다음 "새 세션 열고 계속" 강제 → Windows 훅 오류로 10시간 정지. LACUNA: 브리프 승인 → 첫 코드까지 벽시계 7h13m(그중 CEO 취침 4h44m — kickoff가 코드 없이 세션을 끝냈기 때문에 CEO가 깨기 전에 골격이 만들어질 기회를 잃었다).

**프레임워크 자체가 축적형이다.** 3주간 규칙집 44 KB → 212 KB(4.8배), 규칙 추가 ≈45 대 제거 ≈14, 프레임워크 커밋의 ≈61 %가 테스트 프로젝트 사건에 반응한 패치, retro가 절차를 **제거한 사례 0**. 예산은 "줄 규칙 → 긴 줄로 회피 → 바이트 규칙 → 상향"의 순환(memory 파일이 16 KB 예산의 4배인 54~63 KB로 매 spawn에 통째로 로드됨).

**벽시계상 최대 손실은 야간 idle**(AX 2,256분 = 활성 시간의 106 %)이지만, 그 시간에 출하된 것을 CEO가 못 봐서(AX pending 9, LACUNA not tried 5 + pending 7) 결함이 3~7 plan 뒤에야 드러났다. 병목은 "팀이 CEO를 기다림"이 아니라 **"CEO가 못 본 출하물의 누적"**이다.

**답**: 값 없는 게이트를 지우고(per-step verifier·self-check 보고·performance/maintainability 렌즈), critic을 조건부 1라운드로, hotfix를 실제로 쓰이는 레인으로, kickoff를 같은 세션에서 첫 코드까지, 그리고 검증의 무게를 "리뷰 라운드"에서 "실제 실행 1회 + CEO가 본 출하물 수"로 옮긴다. 안전 속성(비밀·쓰기 경계·네트워크 0·red→green)은 하나도 잃지 않는다. 기대 상한은 plan당 활성 시간 30~40 % 단축(코드 쓰기 41~47 %와 야간 idle은 이 안으로 안 줄어든다).

---

## 2. 당신이 느낀 것의 실체 — "계획에 리뷰에 비평에 다시 수정에"

| 느낌 | 측정된 사실 |
|---|---|
| 계획 → 비평 → 수정 반복 | AX plan 파일에 `rev 2` 27회·`rev 3` 16회·`rev 4` 5회·`rev 5` 1회. LACUNA는 plan당 critic round 1 REVISE가 표준. 빌드 시작 뒤 plan 재승인 3건(0030 rev 3·0044 rev 1·0039 rev 1) — 루프가 코드 시작 뒤에도 재발 |
| 리뷰 → 수정 → 또 리뷰 | AX 후반 plan 전부 2~3라운드·4~5렌즈; LACUNA 24 plan 중 11개가 2라운드 이상. 초기 3 plan은 리뷰+수정(73·123·132분)이 코딩(86·101·102분)보다 길었다 |
| 코드까지 너무 오래 | 보통 기능 plan: 첫 코드 전 순차 hop 12(그중 lead 자체 hop 8 — sync·`cat compactions`·보드·커밋·switch), PLAN 구간 중앙값 AX 24분·LACUNA 21분. 새 프로젝트: hop ≈22, spawn 10~11, CEO 답변 4~5회, 코드 0 |
| 뭐 하나 얘기하면 절차부터 | Small mode(critic 생략) 실측 AX 20 %·LACUNA 9 % — 그것도 대부분 테스트·실험 plan. hotfix 경로 사용 **0/71**(cap 3파일/50줄 + BACKLOG `bug:`는 무조건 plan으로 라우팅). 6줄 버그(LACUNA 0005)가 plan+critic 경로로 41분 |
| 예외가 기본이 됨 | risk:high 비율 AX 70 %·LACUNA 87 % — 세 제품 모두 도메인 코어·도구·Electron main이 Risk path라 제품 로직의 60~80 %가 "위험 경로". 그래서 "기본 off"인 per-step verifier·critic 필수·threat-model이 사실상 기본 경로 |

한 줄 지시가 곧바로 plan이 된 사례는 이미 있다: AX 0040 15분, 0038 33분, 0037 41분(지시→출하). 의식을 벗은 경로가 작동한다는 증거다.

---

## 3. 수치 (측정 중앙값)

| 지표 | AX (21 run 측정) | LACUNA (24 plan) | 뜻 |
|---|---|---|---|
| plan당 활성 시간 | 97분 | 133분 | 90분 넘는 공백은 idle로 제외 |
| 고정비 + 한계비용 (OLS) | 70분 + 11분/100줄 | 70분 + 7.5분/100줄 | 고정비가 지배 |
| 코드 쓰기(STEPS) 비중 | 41 % | 47 % | 나머지가 절차 |
| PLAN(계획+critic) | 24분 (29 %) | 21분 (17 %) | critic 생략 plan 바닥: 0020 6분·0037 13분 |
| 리뷰어 읽기 → 첫 fix | 12분 (14 %) | 19분 (15 %) | 리뷰 비용의 실체는 수정(4·13 %)이 아니라 읽기·판정 |
| SHIP(full 재검증 + 문서 + 머지) | 8분 | 9분 | spawn 3·문서 touch 13 |
| spawn/plan (신뢰 가능한 행만) | (기록 무효) | 21~32 | spawn-log 버그로 AX 753 등은 무효 |
| docs-only 커밋 비율 | 55 % | 32 % | `docs(status)`가 커밋 5개 중 1개 |
| 리뷰 fix 라운드 ≥2 | 후반 plan 전부 | 11/24 | |
| risk:high 비율 | 70 % | 87 % | |
| Small mode(critic 생략) | 20 % | 9 % | |
| hotfix 사용 | 0/48 | 0/23 | |
| 야간 idle | 2,256분 | 1,952분 | 전부 iteration review 뒤 |
| 미검수 출하물 | pending 9(실제 6) | not tried 5 + pending 7 | 그 아래 하얀 화면·B02 |
| 새 프로젝트 → 첫 코드 | — | 활성 149분·벽시계 7h13m | tacit 92분·문서 13개·코드 0 |

### 게이트별 적중 (finding 분류: A 제품·보안 결함 / B 공허한 테스트 / C 형식·문서 / D 취향)

| 게이트 | 표본 | A | B | C | D | 실제로 잡은 것 | 비용 |
|---|---|---|---|---|---|---|---|
| critic | ≈52 | 15 % | 35 % | 46 % | 5 % | A 8건 — persistSession 볼트 유출(L-0013), 데이터 모델(L-0022), 사용자 폴더에서 git 실행(L-0023), run_python 자식 DB import(AX-0004), uv 다운로드 금지(AX-0048). **8건 중 4건은 glob 밖**(리드 지정·Risk low spec)에서 나옴 | opus 40~50 KB × 1~3라운드 |
| review correctness+security | ≈237 | 56 % | 28 % | 12 % | 5 % | RCE·TOCTOU·심링크·env 재주입·연결 누출 | opus 80 KB × 렌즈 |
| performance 렌즈 | — | hot-path 0 | | | | tmp/.app 누수 2건(0042·0044) — correctness 항목 한 줄로 대체 가능 | opus 80 KB |
| maintainability 렌즈 | — | | 1 | 대부분 | | 0045 r2 "순서를 spy로 직접 증명"(B급) 외엔 C·D | opus 80 KB |
| per-step verifier | 7회(AX 0045·0046) | 0 | | | | 전부 PASS. ruff format 2건은 **full**이 잡음(quick에 format 검사가 없었을 뿐) | +4~8 spawn/plan |
| verifier full (build 끝·ship 전) | 10 FAIL | 3 실질 | | | | L-0003 경합·AX-0034 main 빨강·AX-0044 회귀; 나머지 flake 4·환경 1·format 2 | haiku 10 KB |
| self-check 보고 줄 | — | 관측 불가 | | | | 보고서가 어디에도 저장되지 않아 효과를 알 수 없음; majors/100 기준선 없음 | memory 54~63 KB 재독 × 8~11 |
| "돌려 봄" | — | 4/4 | | | | 하얀 화면·B01·B02·0046 | 수 분 |

제품 코드 0줄인 실험 plan(AX 0032·0035·0036·0038·0039)에도 리뷰 major 15건 — A급 0, 전부 기록 문구·테스트 판별력. 0038은 측정 메모 문구 때문에 리뷰 3라운드.

---

## 4. 왜 이렇게 됐나 — 구조 진단

1. **Risk path 시딩이 너무 넓다.** 세 제품 모두 코어·도구·Electron main = Risk path → risk:high 70~87 %. 프레임워크 저자도 09-17에 "nearly always risk:high for the wrong reason"으로 인식했으나 (live) 목록 분리만 했다. 결과: "off by default"인 장치 전부가 켜진다.
2. **plan당 고정비 구조.** 문서 touch 13개(spec·SPEC.md·DECISIONS·BACKLOG·plan·STATUS×2·memory×2·DEBT·METRICS·prs·CHANGELOG), spawn 최소 11~12(실측 21~32), lead tool call 70~110(추정), 보드 Edit 10~14회, sync 2회, `cat compactions` 5회, 검증 실행 4~7회. 같은 속성(`proves:` 존재)을 9~10곳에서 검사하고, 같은 내용(Done-when → plan §1 → PR Proven → prs 사본 → METRICS → STATUS → review 메시지)을 10곳에 복사한다.
3. **lead가 판단 없는 배선만 한다.** lead(sonnet)가 ≈100 KB 절차 텍스트(에이전트 17.7 KB + 사이클 스킬 59.8 KB + 주입 14 KB + CLAUDE.md 8 KB)를 안고 "format only, no judgment". 판단 역할(opus)은 spawn마다 50~120 KB를 다시 읽고, 그중 최대 항목은 memory 파일(54~63 KB, 예산 16 KB의 4배 — 60줄 규칙을 줄당 1 KB로 회피).
4. **반응형 축적.** 사건 1건당 규칙·훅·METRICS 열이 1개 이상 추가(리뷰어 memory 미사용 사건 → 트리거 3개 + 열 2개). retro 트리거 10개는 조건(majors>10·FAIL≥2)이 이미 충족됐는데도 실행 흔적 0. retro의 실제 출력은 규칙 추가 방향으로만 작동.
5. **hotfix 레인이 죽어 있다.** cap 3파일/50줄 + `deliver` 1b가 BACKLOG `bug:`를 무조건 `plan`으로 보냄(bug plan 8건 중 6건이 BACKLOG 경유). 실제 hotfix 크기(≤50줄)인 버그 4건도 plan+critic 경로.
6. **시작부 의식.** brainstorm(5단계) → brief 승인 → kickoff(문서 13개) → critic → hire → "새 세션 열고 계속"(모델 편성 로드 때문) → resume → deliver → build. 설치기의 `-Budget` 옵션을 쓰면 재시작이 필요 없는데 GUIDE 첫 실행 절차에 없다.
7. **CEO 루프.** AskUserQuestion 답의 ≈80 %가 추천 수락(AX 4/4·LACUNA 4/5·tacit 5/5). 진짜 결정(v1 엔진·번들 거부·fixtures 정답치·키 폴백)은 에스컬레이션 항목이거나 CEO가 써 본 뒤 낸 새 입력. 주간 CEO 대기는 1~18분뿐 — 팀은 CEO를 거의 안 기다리고, CEO는 12시간분 출하물을 못 본 채 쌓인다(LACUNA 09-28: 팀 활성 18.5h, 7 plan 전부 pending).

**정정해 둘 것(반박 단계에서 드러남)**: 0046 번들 폐기는 "planner가 CEO의 '그냥 복사' 말을 덮은 것"이 아니다. CEO 원문은 BACKLOG에 그대로 있었고, lead가 트레이드오프를 제시한 AskUserQuestion에서 **CEO 본인이 번들을 골랐으며**(DECISIONS 2026-09-28), 폐기 원인은 빌드 중 발견된 wheel 라이선스 3건이다. 이 사건의 교훈은 "CEO 원문 원장"이 아니라 **"패키징·의존성 plan은 코드 전에 산출물을 한 번 내려받아 라이선스를 보는 spike"**다.

---

## 5. 게이트별 판정

| 게이트 | 판정 | 근거·조건 |
|---|---|---|
| critic | **조건부 1라운드** | 기본 생략. 트리거: (a) 보안 경계 파일 히트 (b) 데이터 모델·스키마·파일 형식 (c) 외부 프로세스 실행·SDK/auth 진입점·사용자 폴더 쓰기/삭제·새 IPC 진입점 (d) 에스컬레이션 항목 (e) 판정·게이트·골든 규칙 변경. **lead의 상향권 유지**(L-0023은 glob 0인데 lead가 올려서 A급이 나옴). REVISE 상한 2→1, REVISE 사유는 A급(threat-model·negative proves 부재, Done-when 이탈, 헌장·데이터 모델 충돌)만; 나머지는 APPROVE-with-notes를 `docs(plan)` 커밋 본문에 싣고 build 때 해당 step에 인용. "전 step 재작성"은 blocker 없이 금지. 형식 검사(proves 존재·n/a 형식·shows·mechanical 혼입·part 목록·바이트)는 `.claude/scripts/plan-lint.mjs`로 |
| review 2렌즈 | **유지** | A 56 %. security는 Risk 히트 시, correctness 항상 |
| performance·maintainability 렌즈 | **삭제, 항목만 흡수** | correctness 체크리스트에 "테스트·빌드가 tmp 밖에 파일·프로세스를 남기지 않는가(major)"·"proves가 주장하는 순서·경로를 시험이 직접 증명하는가(major)" 두 줄 추가. `>600줄 → 4렌즈` 규칙은 삭제(4 step × 300 = 1,200이라 상시 경로였음); 대신 diff를 반으로 갈라 correctness 2 spawn |
| ux 렌즈 | **유지 (UI plan만)** | L-0018 Shell 높이 blocker·0019·0023 실질 결함 |
| 리뷰 라운드 | **risk:low는 상한 2, risk:high·600줄 초과는 3 유지** | r2 범위는 "마지막 fix diff"가 아니라 r1 HEAD부터의 누적 diff + Risk-path 파일(L-0001 r3의 A급 3건은 r2 fix diff 밖 파일에 있었다). 범위 밖 새 발견은 A급만 finding. **carry-over(열린 major를 안고 ship) 도입 안 함** — 근거 사례 0005의 잔여 finding이 보안 major였고 팀 판단이 옳았다 |
| per-step verifier | **삭제** (legacy rebuild·parity harness 제외) | 검출 0. quick verification에 스택에 있는 포맷터의 check(`ruff format --check`; prettier는 설치된 저장소만)를 넣으면 implementer 단계에서 spawn 0으로 같은 검출 |
| verifier full | **유지** (build 끝·ship 전 HEAD 이동 시) | 실질 3건, haiku 10 KB로 가장 싼 spawn. **lead로 옮기지 않는다**(테스트 출력이 lead 컨텍스트에 쌓임) |
| self-check 보고 줄 | **삭제, memory 읽기는 유지** | 관측 불가. 삭제 후 2 plan의 majors/100을 retro 트리거로 |
| test-file floor | **유지** | git 한 줄, 비용 0. CEO 하드스톱은 제거하고 implementer 재작업으로 |
| "실행 1회" | **기존 규칙의 구멍 메우기** | 09-26판에 이미 runtime smoke DoD("the product starts")가 있다 — AX·LACUNA는 구판 kickoff라 미적용. (a) 업그레이드 절차에 "DoD에 그 줄이 없는 프로젝트는 다음 plan step 1로 runtime smoke 등록" (b) `build:15`의 ` — unverified` 제거를 "첫 build만"에서 "이 plan이 Commands에 추가·변경한 줄마다"로(AX `build win — unverified`가 0046 출하까지 잔존) (c) 패키징·의존성 plan step 1 = 산출물 1회 내려받아 라이선스·크기 확인 spike (d) build/dist가 허용 밖 라이선스를 내면 그 자리에서 ship 차단 + 에스컬레이션(다음 plan으로 미루기 금지 — 0046이 실제로 빠진 조항). GUI·Windows·실 키 명령은 `try-it: manual` |

---

## 6. 권고 — 반박 검증을 통과한 것

우선순위는 "규칙 줄만 바꿔 오늘 적용 가능"(1차) → "스크립트 필요"(2차) → "축소"(3차). 각 항목의 기대치는 측정 근거가 있는 것만 적고, 없는 것은 "측정 예정"으로 남겼다.

### 1차 — 규칙 줄만 (반나절)

| # | 권고 | 바꾸는 곳 (`claude/.claude/` 기준) | 반박 결과 |
|---|---|---|---|
| **P1** | per-step verifier 강제 삭제 + self-check 보고 줄 삭제 + quick에 포맷 검사 | `skills/build/SKILL.md:12`(risk:high 트리거만 삭제, legacy 유지), `agents/team-lead.md:19`, `agents/team-implementer.md:15`, `agents/team-builder.md:14`, `skills/hire/SKILL.md:10,13`, `skills/resume/SKILL.md:51`(`proven (self-check)` 라벨), `skills/retro/SKILL.md:10`, `skills/hotfix/SKILL.md:8`, `claude/GUIDE.md:228`, `skills/claude-md/SKILL.md` quick 템플릿, 세 프로젝트 CLAUDE.md quick 줄 | 3/3 생존. 근거는 오히려 강해짐(검출 0) |
| **P2** | critic 조건부 1라운드 (§5 표대로) | `skills/plan/SKILL.md:17,19,22`, `agents/team-critic.md:22-29`, `agents/team-lead.md:26`, `agents/team-planner.md:39`(Steps 줄에 `Critic: none | (a)…(e) — 근거` 자기 선언) | 3/3 생존. 단 critic 생략이 새로 적용되는 plan은 현행 Risk 시딩에선 6/70뿐 — 절감은 REVISE 1회 상한·체크리스트 축소·**P7과 결합**에서 나옴. PLAN 24→12분 같은 수치는 근거 없음(critic 시작·종료 시각을 먼저 기록해 분해할 것) |
| **P3** | kickoff는 같은 세션에서 첫 코드까지 | `skills/kickoff/SKILL.md:16`("Do not start… 새 세션" 삭제 → 마지막에 `deliver` 호출), `claude/GUIDE.md` 첫 실행 절차에 `install.sh claude -Budget <tier>` 기본(재시작 0회), planner 2병렬 → 1, critic은 ADR+plan 0001 한 번(blocker 재독 삭제). 코드 전 문서 = BRIEF·CLAUDE.md·CHARTER(≤60줄)·짧은 ADR(스택 + Security baseline scaffold 줄 + Risk paths 시드)·plans/0001; SPEC·BACKLOG·ARCHITECTURE·README·DECISIONS는 골격 ship 뒤 planner 1 spawn | 3/3 생존(수정). CHARTER는 코드 전에 남겨야 함(`session-start.mjs`·`team-lead:32`가 CHARTER 존재를 "시작됨" 신호로 씀). ADR을 통째로 미루면 plan 0001의 negative proves 출처가 사라짐. 기대치 "20~30분"은 미측정 → "30~40분(측정 예정)" |
| **P4** | 렌즈 2 고정·라운드 상한 (§5 표대로) | `skills/review/SKILL.md:9,11`, `agents/team-lead.md:21`, `agents/team-reviewer.md` Lenses·Second-round 절 신설, `scripts/set-profile.mjs`의 `2|4` 옵션, 세 프로젝트 CLAUDE.md DoD "4 lenses" 줄, AX CLAUDE.md:45 DoD 줄의 "once live" 누락 시딩 오류 수정 | 원안 3/3 반박 → 수정본. carry-over 삭제, r2 범위 누적 diff, 상한 2는 risk:low만, performance 항목 흡수 |
| **P5** | hotfix를 살아 있는 레인으로 | `skills/hotfix/SKILL.md:12` cap을 "1 logic 커밋으로 끝나는 변경(≈100줄, Small 상한과 동일) + 재현 테스트 1개"로, 파일 수 제한 삭제; **`skills/deliver/SKILL.md:13`**(1b)에 "BACKLOG `bug:` 항목이 한 줄 재현이면 `hotfix` 먼저, implementer가 설계 판단으로 무커밋 중단하면 `plan bug:`"; security 렌즈는 glob뿐 아니라 implementer 보고(키·env·자식 프로세스·SQL/경로·세션 격리)로도 켬; 기존 테스트 교체·Decided-by-default 뒤집기는 설계 판단으로 강등; `retro:10`·`GUIDE:125`의 "hotfix 3건 = 검증 구멍"을 "같은 영역 3건"으로 | 원안 2/3 반박 → 수정본(P1→P1). 50~300줄 버그 4/4가 설계 판단·다단계였으므로 cap 300은 위험. 첫 iteration은 옵트인 시범 2~3건, hotfix 시작→plan 강등이 3건당 1건 넘으면 되돌림 |
| **P6** | 미검수 출하물 상한 | `skills/deliver/SKILL.md` step 0: plans 항 기본 8→3~4(hours 12는 유지 — 야간은 시간이 끊음), iteration 1 "1 plan" 유지; `Tried (last review)`가 `not tried`면 다음 iteration plans 항 절반; review 첫 줄 고정 `Try it: <run 명령> · 안 본 출하물 N개`; **"써봤다"는 plan 단위**(`써봤다 · <slug> · <결과>` 줄마다, 이름 없는 plan은 pending 유지 — LACUNA에서 한 줄 "잘 되는 것 같아"가 8 plan을 일괄 ok로 찍었고 그중 2개가 B02로 깨져 있었다) | 원안 2/3 반박 → 수정본. METRICS `pending` 열은 ship이 갱신 안 해 장부가 틀림(AX 9 중 3은 실제 tried) — 새 카운터 대신 기존 cap 항으로. 멈춘 동안 demo run 허용 조항 삭제(실 API 회차는 CEO 승인 필요) |
| **P7** | Risk path 두 급 | `skills/claude-md/SKILL.md` 시딩 규칙: (a) **보안 경계 = 파일 단위 목록**(예 AX `platform/tools/{deliver,save_procedure,run_python,guard,pyguard}.py`·`providers/direct.py`·`app/electron/**`·`.githooks/**`; 함수 단위 표현 금지) → critic 필수·threat-model·negative proves·security 렌즈; (b) `## Core paths` → security 렌즈만. 판정은 지금처럼 planner(§4 파일)와 review(`git diff --name-only`) 2곳, `Risk: high — 지정: <이유>` 채널(lead·critic 상향, 에스컬레이션 히트) 유지, "올릴 수만 있고 내리지 못함" 그대로. AX·LACUNA·tacit CLAUDE.md 재시딩 | 원안 3/3 반박 → 수정본. "스크립트가 git diff로 1회 판정"은 plan 시점에 diff가 없어 성립 불가·리드 지정 채널(critic A 8건 중 4건의 출처)을 없앰. 기대치: risk:high AX 70→약 40 %, LACUNA 87→약 55 %(리드 지정·에스컬레이션 포함해 다시 셈) |
| **P8** | 실행 1회 — 구멍 메우기 (§5 마지막 행) | `skills/build/SKILL.md:15`, `skills/claude-md/SKILL.md` 업그레이드 절차, `agents/team-planner.md`(spike 규칙 1줄), `skills/ship/SKILL.md`(라이선스 발견 시 차단) | 원안("새 게이트 + Safety checks 절") 3/3 반박 → 축소본. 새 CLAUDE.md 절은 AX가 8,184/8,192 B라 훅이 거부하고, 0034 "main 빨강"이 바로 CLAUDE.md 압축 커밋에서 났음 |
| **P9** | kickoff 질문 통보화 (부분) | `skills/kickoff/SKILL.md:11`: 스택·예산 등급·참조 모델은 "추천값 적용 + Decided by default 1줄" 통보; **돈·라이선스·보안·사용자 데이터·비목표 질문은 유지**; `agents/team-planner.md`에 "기본값 전에 DECISIONS `CEO 결정`·BACKLOG `CEO 원문`을 대상 ID로 grep — 있으면 옵션 A" 1줄 | R10(CEO facts 원장)에서 살아남은 조각. 원장 슬롯·critic blocker는 근거 오귀속으로 폐기 |

### 2차 — 스크립트 (1~2일, 1차 3 plan 측정 뒤)

| # | 권고 | 조건 |
|---|---|---|
| **S1** | `scripts/step-check.mjs`(테스트 파일 ≥1·numstat ≤2×·커밋 본문 plan/step 줄) · `scripts/ship.mjs`(METRICS 12열 생성·정책 판정 1벌·CHANGELOG) · `scripts/board.mjs`(STATUS-team Iteration·Plans·Shipped·duration 생성) · `scripts/verdict.mjs`(reviewer·verifier·critic 판정을 `.claude/session/verdicts.jsonl`에 — Counts·Open findings·Last verifier의 원천) | **fail-closed**: 훅 전용이 아니라 lead가 review step 0·ship에서 직접 실행(tacit에서 훅이 통째로 죽은 사건). `Proven:` 줄은 implementer 커밋 본문에 싣도록 보고 형식 변경(지금은 채팅 보고서에만 있어 셀 수 없음). PostToolUse는 커밋을 못 막으므로 복구 명령을 메시지에. 선행: `1c3ceb1`(`CLAUDE_PROJECT_DIR` 등록) 릴리스 + 세 저장소 `grep -c CLAUDE_PROJECT_DIR .claude/settings.json` = 5 확인. DECISIONS 자동 줄은 hard-to-reverse 표시가 있을 때만(§6 기본값 전부는 안 됨 — DECISIONS 이미 284줄/198 KB) |
| **S2** | lead 배선 축소 | `skills/build/SKILL.md:8` sync 재적용은 `deliver:10`이 같은 세션에서 했으면 생략; 보드 갱신은 verifier·review 판정·CEO 결정·ship 시점만(step 진행은 git이 진실); `cat compactions` 5회 → SessionStart 주입. **lead=opus는 README medium 기본값 그대로**(LACUNA는 이미 opus lead였는데도 spawn·deny 최다 — 효과는 모델이 아니라 `team-lead:15,19`·`build:12` 문구에서 남). 검증은 lead로 옮기지 않음. `Approved-by` trailer 불가(lead `--amend` 거부 = 쓰기 경계) → 머지 커밋 메시지에 step sha 목록 |
| **S3** | memory 읽기 축소 | 네 agent 파일의 memory 읽기를 `Read(limit: 20)`(상단 `## Top` 15줄)로, 나머지는 grep — 이것만으로 spawn당 −50 KB. planner는 `## Architecture facts` ≤3 KB + Top. 1회 통합 커밋(AX 58행 같은 다중-plan 재발 사슬은 200 B로 자르지 말고 plan 히트당 한 줄로 분할; `security:` 태그·Risk glob 언급 줄은 Top 고정·아카이브 제외). 자동 아카이브는 줄에 `plan NNNN` 스탬프가 강제된 뒤 S1 ship.mjs가 "최근 5 plan 참조 0"인 줄만 이동 |

### 3차 — 축소 (2차가 자리잡은 뒤)

| # | 권고 | 조건 |
|---|---|---|
| **C1** | 규칙집 축소·단일 flavor | `opencode/` 삭제(세 프로젝트 모두 Claude 판만 사용; parity 51쌍·hook-check 390 케이스 유지비), team-builder 삭제(`/parallel` 사용 0회; `isolation: worktree`는 implementer 인자로), skills 31 → ≈11(build+review+ship → run, deliver → resume, parallel·integrate·policy·roster·lang·recruit·handoff·release·backlog·instruction·charter·brief·claude-md는 스크립트·템플릿·다른 스킬의 절로). **team-verifier는 유지**(full 검증 실질 3건, 가장 싼 spawn). guardrails.mjs 축소 시 **push-policy(refspec 파싱 + onMain·force·mirror)·wrapper unwrap·`gh api` 비-GET 차단은 남김** — LACUNA가 원격 보호 없는 무료 플랜에서 실제로 기댄 방어이고 settings.json deny로는 표현 불가. hook-check는 삭제가 아니라 남는 규칙 ≈40 케이스로. "259→100 KB"·"lead 100→35 KB" 같은 목표치는 근거 없는 투영이므로 축소 후 측정치로 대체 |

### 버린 제안과 이유

| 제안 | 반박 |
|---|---|
| CEO facts 원장 + "CEO 방식 = 옵션 A" critic blocker | 핵심 근거(0046 '그냥 복사')가 오귀속 — 그 말은 R37 zip 내보내기 메모였고 번들은 CEO 본인 선택. 규칙대로면 v1 게이트 stop(network-0 위반·지시문 주입을 잡은 기본값)이 "CEO facts 충돌"로 뒤집힘. DECISIONS·BACKLOG가 이미 CEO 원문을 verbatim 보존 |
| DECISIONS 줄당 200자 훅 + For you 2회 연속 → P2 강등 + 설계 질문 금지 | LACUNA의 "3일째 같은 부탁(bench $10)"이 바로 B01·B02를 잡은 유일한 신호(실 키가 필요해 팀이 대신 못 함). "설계 질문" 2건은 LACUNA CLAUDE.md 에스컬레이션 항목(데이터 모델·새 런타임 의존성). 200자 축약은 비밀·유출 경계 조항(persistSession false, 로그인 모드 자식 env)을 결론에서 떨어뜨림. 276줄 변환은 mechanical이 될 수 없음(재생성 diff 0 불가) |
| `gate hits` 열 + "두 iteration 연속 A 적중 0 → 게이트 축소" + one-in-one-out | 예방 게이트는 정상 작동할수록 적중 0이라 정확히 잘못된 대상을 고름(LACUNA critic은 iteration 2·3 A 0 → 바로 다음 0013에서 persistSession 유출 catch). 죽은 retro 메커니즘에 11번째 트리거를 얹는 것은 §4-4가 비판한 패턴의 반복. 살아남은 조각: reviewer 보고에 `[A|T|C]` 태그, 축소 knob는 `## Operating profile` 한 줄 토글로(`critic: skip under <n>`, `review rounds` 등) |
| carry-over(열린 major 안고 ship) | 근거 사례 0005의 잔여 finding이 보안 major. lead-merge 전제 "every lens APPROVE" 위반 |
| Risk 등급 스크립트 1회 판정 | plan 시점에 diff 없음; 리드 지정 채널 소멸 |
| 검증을 lead 직접 실행으로 | 가장 싼 일회용 컨텍스트(haiku 10 KB)를 가장 비싼 상주 컨텍스트로 바꾸는 일; 출력이 lead 컨텍스트에 쌓여 compaction 유발 |

---

## 7. 유지할 것 — 증거가 남기라는 것과 가장 싼 형태

| 유지 | 근거 | 가장 싼 형태 |
|---|---|---|
| review correctness + security 병렬 | A 56 %; security 렌즈가 RCE·TOCTOU·심링크·env 재주입 | 그대로 |
| "테스트가 old code에서도 통과하면 major"(`team-reviewer.md:12`) | 공허 테스트 66건의 실제 거름막 | 그대로 |
| implementer test-first red→green + `Proven:` 줄 | 테스트 파일이 산출물; 리뷰 판정의 근거 | 줄 수 세기는 S1 스크립트 |
| verifier full 1회 (build 끝·ship 전) | 실질 3건, haiku 10 KB | 그대로 |
| critic의 A급 판정 (Risk-path·헌장·데이터 모델·외부 프로세스) | A 8건 전부 이 영역 | 트리거 히트 시 1라운드 |
| negative `proves:` → 테스트 ("must be refused") | security A의 대부분이 경로·권한·env | plan-lint가 (a)급 step에 ≥1 요구 |
| step-size 300 / plan-size 4 | r3에서 A가 나온 유일한 사례가 2,000줄+ plan; 1,245줄 0046은 통째로 폐기 | 그대로 |
| runtime smoke DoD ("the product starts") | 하얀 화면·B01의 구멍을 이미 메운 규칙 | 구판 프로젝트에 소급(P8) |
| 기계화된 안전 속성 (leakcheck·socket 차단·`gate/**` 밖 쓰기 grep·엔진 경계 grep·Electron 보호 설정 부정 테스트) | 전부 훅·fixture·grep — 비용 0에 가까움 | 이미 테스트로 있는 것은 그대로, 없는 것만 저장소 스크립트 하나로 full 체인 끝에 |
| 역할별 쓰기 경계 훅 + push-policy | 기계적이고 쌈; LACUNA가 실제로 기댄 방어 | 이 부분만 남기고 shell 정규식 축소 |
| STATUS.md 1,800자 CEO 페이지 | 105 리비전 중 초과 1 — 유일하게 읽히는 문서 | 첫 줄 `<run> · 마지막 확인 <시각> · 안 본 출하물 N` |
| 브리프 1라운드 + 승인 | tacit 30분·corrections 1; 진짜 결정(v1·1.18.32)이 여기서 나옴 | 그대로 |
| 에스컬레이션 4항목 + 하드스톱 parking | CEO가 실제로 판단한 질문($0.50·번들 거부·Electron zip)이 전부 여기 | 그대로 |
| one plan = one branch + pre-launch lead-merge | CEO 답 80 %가 추천 수락 → 머지 게이트를 CEO에게 두지 않은 판단이 옳았음 | 그대로 |
| 무인 연속 실행 | LACUNA 19h03m 8 plan, 최대 공백 57분 | 제한은 미검수 출하물만(P6) |
| iteration review "써봤다/안 써봤다" + acceptance 열 | B02·하얀 화면·0020은 이 답으로만 드러남 | plan 단위 답(P6) |
| 한 줄 지시 → plan 최단 경로 | 0040 15분·0038 33분 | P5로 기본 경로 승격 |

---

## 8. 현행 vs 목표

| 작업 단위 | 단계 수 | spawn | 문서 touch | CEO 접점 | 첫 코드까지(활성) |
|---|---|---|---|---|---|
| 새 프로젝트 시작 | 16 → 6 (brainstorm 1라운드 → kickoff 문서 5 → scaffold+smoke, 같은 세션) | 코드 전 10~11 → 5~6 | 코드 전 15 → 5 | 5~6 → 4 | 149분 + 재시작 + CEO 착석 → 30~40분(측정 예정) |
| 보통 기능 (4 step, risk:low) | ≈20 → ≈8 | 최소 11~12·실측 21~32 → 6~8 | 13 → 5~6 | 0 → 0 | hop 12·≈30분 → hop 4~6·≈12분 |
| 위험 경로 기능 (a급) | ≈24 → ≈12 (critic 1라운드·negative proves·security 렌즈) | 15~16·실측 21~32 → 8~10 | 15 → 6 | 0 (live 머지 1) → 동일 | hop 12·24~38분 → hop 5·≈15분 |
| 버그 (≤100줄·재현 있음) | plan 경로 ≈20 → hotfix 5 | 11~12 → 4 | 13 → 2~3 | 0 → 0 | 25분 → ≈5분 |
| 스펙 변경 | 8 → 4 (토론 → planner 1: 섹션 diff + plan rev 동시 → critic 0~1 → run) | 4~8 → 1~2 | 6~7 → 3 | 폐기 시 1 → 동일 | hop 9 → 4 |

목표 경로 한 줄: 지시 → plan(planner 1, plan-lint) → [critic 1라운드: 트리거 히트 시만] → build(implementer, step = 커밋, step-check) → verifier full → review(correctness + security 병렬, UI면 ux; r2는 누적 diff, risk:low 상한 2) → ship(스크립트 + lead 커밋 1) → 안 본 출하물 ≤3~4면 다음 plan.

---

## 9. 이행 순서와 측정

**1차 순서**: P1 → P2 → P5 → P6 → P4 → P8 → P7 → P3 → P9. 전부 규칙 줄 변경. GARAGISTE에서 고친 뒤 세 프로젝트 재설치(hire 재적용 필요 — 또는 `install.sh -Budget`으로 보존). tacit은 kickoff가 이미 끝났으므로 P3 대신: `1c3ceb1`(settings.json `CLAUDE_PROJECT_DIR`)을 먼저 적용해 훅을 살린 뒤, 컨테이너 세션(훅 정상)에서 plan 0001을 시작.

**측정 — 1차 적용 뒤 프로젝트마다 plan 3개**:

| 지표 | 현재 | 3 plan 뒤 목표 | 어느 권고의 효과 |
|---|---|---|---|
| `approval→ship` 중앙값 | AX 97분·LACUNA 133분 | ≤75분 | 전체 |
| 새 열 `first code` (`docs(plan)` 커밋 → 첫 step 커밋; hotfix는 지시 → fix 커밋) | ≈30분 / 25분 | 기능 ≤15, hotfix ≤5 | P2·P5 |
| PLAN 구간 (직전 ship → `docs(plan)`) | 24분 | ≤12 | P2 (critic 시작·종료 시각을 먼저 기록해 planner·critic·CEO로 분해) |
| `spawns · denies` (spawn-log 수정판) | 21~32 · 9~14 | ≤10 · ≤5 | P1·S2 |
| `review blockers`, `majors/100 logic lines` | 2.9~6.6/plan, 1.3~4.9 | **오르지 않음** — 떨어지면 안 되는 값 | P4가 A 검출을 잃지 않는지 |
| `verifier FAIL` | format 2 + flake 5 + 실질 3 | 실질만 (format 0) | P1 |
| `acceptance` | pending 9 / 12 | 상시 pending ≤3, tried 비율 ≥2/3 | P6 |
| hotfix 시작 → plan 강등 | — | 3건당 1건 이하 | P5 |
| git: docs-only 커밋 비율·`docs(status)` 비율 | 55 %/32 %, 1/5 | ≤35 %, ≤1/10 | S1·S2 |
| shipped slug를 지목하는 `bug:`/`rework:` | 0046→0048, B02, 0004·0005 | 3 plan 창에서 0 | P8·P6 |

**정지 규칙**: 3 plan 뒤 `approval→ship`이 안 줄었거나 `majors/100`이 1.5배 이상 오르면 P2·P4를 되돌리고 원인을 본다. 축소 knob(`critic: skip under <n>`·`review rounds`·`per-step verifier`)는 `## Operating profile` 한 줄이라 되돌리기가 싸다.

---

## 10. 방법의 한계

- AX는 shallow clone(0001~0027 git에 없음) → 21 run만 측정, 앞 27개는 METRICS 문장만. LACUNA는 별도 full clone으로 보완.
- 커밋 시각은 작업 **끝**만 기록 → critic 라운드는 승인 커밋 하나에 접혀 PLAN 안에서만 보임(≥1은 하한); 리뷰어 읽기와 implementer fix 작성이 분리 안 됨; PLAN 안의 CEO 대화(90분 미만)는 팀 시간에 섞임.
- spawn 열은 spawn-log 버그로 LACUNA 0012~0015만 유효. deny의 역할별 귀속은 없음.
- finding 분류(A/B/C/D)는 PR 요약·fix 커밋·DEBT에서 재구성(원 리뷰 보고서 미보존) → 건수 ±15 %, 인용문은 측정.
- AX 후반 plan 시간 상승(37 → 104분)은 GARAGISTE 09-26판 설치와 내용 변화(risk:high 4~5렌즈·opencode v1 실측·패키징)가 겹쳐 인과 단정 불가.
- 90분 idle 임계는 임의값.
