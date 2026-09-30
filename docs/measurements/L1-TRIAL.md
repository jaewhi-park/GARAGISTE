# L1 시험 — 사전 등록 (pass line 표의 생산)

2026-09-29 등록 · 시험대: jaewhi-park/G2_TEST2 (Lacuna 재도전, docs/BRIEF-draft.md) · **프레임워크 동결: GARAGISTE 59bb724** (레포 설치 커밋 475c4a1)
이 문서는 시험 **전에** 커밋된다. 표가 나오기 전까지 v2의 모든 수치는 주장이다(docs/BIRTH.md).

## 동결 규칙
- 시험 중 프레임워크는 위 sha에 고정. **결함 수리는 허용**(원장·HAZARDS 기록 + 그 unit 재시작), **장치 추가·흐름 변경은 금지** — 표가 나온 뒤에.
- 수리로 재시작한 unit은 표에 「시도 n회」로 적는다. 예쁜 표를 위해 각색하지 않는다 — 정직한 기록이 이 표의 존재 이유다.

## 조건
- 티어 **high**(build=opus): 첫 표는 루프의 고정비 측정이라 모델 품질 노이즈를 뺀다. medium(build=sonnet) 재실행은 두 번째 실험(약모델 논제의 첫 데이터).
- conductor는 **G2_TEST2 안에서 연 새 세션**(훅·커밋 게이트 활성). 이 조건 밖에서 돌린 unit은 표에 넣지 않는다.
- N = **3 unit** (boot 제외 — 측정은 하되 판정 제외): ① 순수 로직(기계 수용) · ② 실제 기동 스모크가 수용에 든 것(하얀 화면 사고의 검사) · ③ boundary HIT(spike 경로). scope에서 이 구성이 되게 고른다.

## 시계 정의 (전부 원장 ts — 손 기록은 CEO-분뿐)
- **unit 시간** = `unit` 줄(seed) → `ship` 줄, `decide`·`tried`를 기다린 구간 제외.
- **CEO-분** = 서명(intake 결과 검토→scope)·decide·tried에 실제 쓴 분. 자가 스톱워치 — N=3이라 수용.
- **spawn** = `pack` 줄(의도) · `spawn_stop` 줄(완료), unit별.

## 표 (2026-09-30 기입 — 원장에서, conductor 산출)
| unit | 시도 | seed→ship(분) | spawn 의도/완료 | CEO-분 | attack 선발견 | tried | green 후 CEO 발견 결함 |
|---|---|---|---|---|---|---|---|
| ① vault-schema | 1 | 48.2 (수리 대기 제외 ≈9.8) | 4/4 | (CEO 기입) | 3 (__proto__·정상 입력 거부·null 통과) | ok | 0 |
| ② vault-open-ui | 1 | 696.5 (수리 대기 제외 ≈16.5) | 7/7 (+지연 종료 1) | (CEO 기입) | 3 (LACUNA_HOME·쓰기 불가 무창·BOM 소실) | ok (human@win32) | 0 |
| ③ | — | 구성 불가: BACKLOG 원문에 boundary 키워드 없음(CEO 결정) — 단 ②가 ship 단계 diff-HIT로 spike 경로를 실제로 밟음 | | | | | |

측정만 한 unit (판정 제외): boot 시도1·spawn2·tried ok(결함 1: vitest .worktrees 누출→boot-fix) · vault-load 7.0분/4spawn/ok(위임) · fixture-eoren 11.8분/4/ok(위임) · index-sqlite 33.0분/4/**fail(위임 — Q11 미반영→index-sqlite-fix)** · worlds-isolation 7.0분/4/ok(위임)

## 판정 기록 (2026-09-30)
- **L1 게이트: 원시값 미통과.** ① 48.2분 충족 · ② 696.5분 미충족(그중 671분은 사고 14~16 수리를 CEO가 처리하기를 기다린 구간). spawn ≤8 충족(4·7) · 미검수 ≤3 상시 충족(3에서 정상 정지). 시계 정의가 빼 주는 것은 decide·tried 대기뿐이므로 원시값으로 판정한다 — 각색하지 않는다.
- **병목 지목(원장 ts)**: 팩 조립·spawn·검증이 아니라 **프레임워크 결함 수리 대기**(시험 중 사고 6~16, 11건 — 전부 정본 수리 + 테스트 봉인, 재시작 unit 0). 에이전트 실작업은 unit당 7~17분.
- **부기**: attack 선발견 — 표 unit 6, 전체 21. tried 후발견 2(boot vitest 누출, index-sqlite Q11 미반영 — 둘 다 표 밖). Q4(attack의 선발견 우위) 데이터는 강함.
- **처방(사전 등록 규칙대로)**: 장치를 더하지 않고 그 구간을 수리한 뒤 재시험 — 수리는 이미 끝났으므로(사고 16까지), **머지된 main + 새 클린룸에서 3차 재시험**이 다음 걸음. 예측: 수리 대기 0이면 unit당 원시 10~20분대.
- **새 사고 후보(17)**: ship이 결정이 닫혔는지만 보고 반영됐는지는 못 본다 — Q11이 build 뒤에 닫혀 미구현 출하(try가 잡음). 수리 방향: 진행 중 unit의 Q를 decide하면 그 unit은 spec 재개(답을 red 수용으로 박기)가 기계 규칙. 백로그 등록.
- 비고: tried 위임 4건(카드 실행, 표시 명기) · vault-load 커밋 trailer 누락(훅 heredoc 차단) · ② 첫 build 잔여 프로세스로 수명 64분/실작업 4.7분 · index-sqlite build의 배경 cat(무해).

## 판정 (BIRTH pass line)
- **승인→출하 ≤75분 · unit당 spawn ≤8 · 미검수 ≤3 상시** — 셋 다 충족이면 L1 게이트 통과, L2(무인 하루)로.
- 부기: attack 선발견 대 tried fail 후발견의 비(Q4 — cs 리뷰 대체 가설의 판정), 순정 대비 3지표(unit당 CEO-분·done 후 결함·재브리핑 분)는 **기록만** — 정식 비교는 L2에서.
- 미충족이면: 원장 ts로 병목 구간(팩 조립·spawn·검증·재시도)을 지목하고, 장치를 더하는 게 아니라 그 구간을 수리한 뒤 재시험.

## 재등록 — 2차 시험대 (2026-09-29)
1차 시험대(재사용 레포)는 폐기한다. R13 재설치 실험 잔재 · 1차 시험 잔재 · 수리 커밋이 뒤섞인 이력과 문서(유령 기억)가 에이전트 판단을 오염시켰고, 미커밋 규칙집 변경이 ship을 막는 어중간 상태가 반복됐다 — CEO가 빈 폴더 + git init으로 재시작.
- **1차의 수확**: 실기 사고 5건(machine_os·경로 표기·읽기 오탐·팩 조립·따옴표 오탐) 전부 수리 + 테스트 + HAZARDS로 프레임워크에 등록(#43·#44 머지). 1차의 시험 수치는 오염이라 표에 넣지 않는다.
- **2차 동결: GARAGISTE main 3c3345e**(수리 5건 포함). 시험대는 빈 폴더 탄생(클린룸) — 레포 재사용 금지, 시험 중 remote 없는 로컬 머지 모드 허용.
- 시도 카운트 리셋(전부 「시도 1」부터). 나머지 규칙·시계·판정선은 위와 동일.

## 실행 절차 (conductor 세션에 그대로)
0. G2_TEST2 폴더에서 새 세션. `node .garagiste/scripts/work.mjs brief --file docs/BRIEF-draft.md`
1. CLAUDE.md Flow 2~4 그대로: intake spawn → 열린 Q 예/아니오 → `scope`(CEO 서명 — 여기부터 시계) → seed 루프. 인터럽트는 Flow 7.
2. 각 ship 뒤 CEO가 try 카드 → `tried ok|fail`. 미검수 3이면 멈춘다 — 그것이 정상 동작이다.
3. 3 unit 출하 후: 이 표를 원장(`.garagiste/ledger/evidence.jsonl`)에서 채워 커밋. 판정과 다음 걸음은 표가 정한다.

## 재등록 — 3차 (2026-09-30)
- 목적: 2차의 처방 그대로 — 수리 대기 0 조건에서 pass line **원시값** 판정. 예측: unit당 원시 10~25분, 표 완성은 반나절 안, 프레임워크 FAIL 0건.
- 동결: 94abdc7(사고 18·19 수리)을 포함한 머지 직후의 main. **설치 원본 = 원격 fresh clone**(로컬 드리프트 0) — 클론에서 `node --test "tests/*.test.mjs"` 전부 초록이 시험 개시 조건.
- 시험대: 새 빈 폴더(클린룸 — 재사용 금지·remote 없음), `-Budget high`로 설치(이후 models 변경 금지 — 사고 6·7 경로 차단). 시험 중 재설치·수동 스크립트 편집 금지.
- 입력: 2차와 동일 원문(BRIEF-draft)·동일 intake 답. unit 구성 ①②③ 규칙, tried 위임 3규칙(기계 판정 카드만·human@은 CEO·표시 명기), 시계·판정선은 1차 등록과 동일.

## 3차 표·판정 (2026-09-30 기입 — conductor가 원장에서 산출. 날짜는 기입 커밋 82c2e9a 시각으로 정정, 원래 10-01)
| unit | 구성 | 승인→출하 | spawn | 토큰 | attack | redproof | tried |
|---|---|---|---|---|---|---|---|
| boot | scaffold+실기동 스모크 | 0:58 | 1 | 23K | — | scaffold | ok(위임) |
| fixture-eoren | ① 순수 로직 | 14:31 | 4 | 191K | 3→0/3 | base_red head_green | ok(CEO) |
| vault-schema | ①+②(인수가 실제 CLI 기동, machine@win32) | 62:06 (개발 11분+게이트 36분=사고 20~22 처리) | 5(spike 1) | 204K | 3→0/4 | base_red head_green | ok(위임) |
| 계 | ③은 diff-HIT spike 경로로 1회 실주행 | 62:06 | 11 | 451K | 선발견 6 | | 위임 2·CEO 1 |

- **판정: L1 통과 — 원시값.** 3/3 전부 ≤75분(최악 62:06, 프레임워크 사고 3건 처리 포함) · spawn ≤5/8 · 미검수 0/3 상시 · 수동 개입 0 · 임의 우회 0 · LARGE_STEP 1회는 사유 기록된 정상 차선.
- 예측 채점: 시간·반나절 표 ✓ (2차 696분 → 62분 — 수리 대기가 사라지자 루프의 본색) · 「FAIL 0건」 ✗ — 진짜 결함 3건(사고 20·21·22, 전부 「늦은 spike→의존성 출하」 복도 하나의 연쇄, 수리+테스트 봉인) + 배달 사고 1(동기화 fetch 무검증 — 머지 후 소멸하는 구조물).
- CEO 접점: 결정 16 · 서명 1 · try 1 · D2~D6(전부 FAIL 처리). 새 빈틈: intake의 Q 번호 한 칸 밀림으로 needs 오연결 6 unit(결정 전부로 해소) + needs 수정 명령 부재 → 사고 23 후보, 백로그.
- 다음 걸음: 대기 커밋 머지 → **L2(무인 하루)** — 남은 SCOPE 11 unit이 그대로 시험 재료다.

## 재등록 — 4차 (2026-09-30)
- 목적: 3차 통과의 재현 — 3차 중 수리(사고 20~22)와 3차 뒤 수리(사고 17·23)를 담은 정본이 같은 입력에서 프레임워크 FAIL 없이 pass line을 넘는가. 이 정본이 그대로 L2(무인 하루)에 들어간다 — 측정 없이 L2에 들어가는 수리가 없게(CEO 결정: 17·23 수리 후 동결).
- 동결: 사고 23·17 수리(ca26d12·a7a5fb2)와 이 등록을 머지한 직후의 main. **설치 원본 = 원격 fresh clone** — 클론에서 `node --test "tests/*.test.mjs"` 51개 전부 초록이 시험 개시 조건, 그 sha를 표 머리에 적는다.
- 시험대: 새 빈 폴더(클린룸 — 재사용 금지·remote 없음), `-Budget high`(이후 models 변경 금지). 시험 중 재설치·수동 스크립트 편집 금지 — 결함이 나면 동결 규칙대로(정본 수리 → 반영 블록 → 그 unit 재시작, 「시도 n」). 통과하면 이 시험대가 남은 SCOPE unit을 가진 L2 후보다 — 보존.
- 입력: 3차와 동일 원문(BRIEF-draft)·동일 intake 답. unit 구성 ①②③ 규칙(가능하면 3차와 같은 unit — 짝 비교), tried 위임 3규칙, 시계·판정선(BIRTH pass line 원시값)은 1차 등록과 동일 — 골대는 움직이지 않는다.
- 예측(채점 대상 — 판정선이 아니다): 1) 프레임워크 FAIL 0건(3차 ✗의 재채점 — 20~22의 복도는 수리됨) 2) ① unit ≤20분 · ①+② unit ≤30분(3차 62:06 중 36분이 사고 20~22 처리) 3) intake의 needs 오연결 0 · `work.mjs needs` 사용 0(사고 23 — 번호는 `ask --for`가 잇는다) 4) CEO 접점 중 FAIL 처리(D) 0 5) RESPEC이 나면 그 unit은 spec 재spawn 뒤에만 출하 — 미구현 출하 0(사고 17).
- 표에 더할 열: needs 수정 수 · RESPEC 수. attack 열은 LEDGER 값(정의는 attackCell — 선발견 = unit 생애에서 한 번이라도 red였던 adversary 파일의 합집합).
