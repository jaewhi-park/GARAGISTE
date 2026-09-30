# v2 수리·요구 백로그 — 6개 레포 부검에서

2026-09-29 · 대상: v2 「증거 팀」(브랜치 `claude/garagiste-process-efficiency-qygydj`) · 근거: G1 3주 부검(GARAGISTE 120c · LACUNA 257c · AX_PLATFORM 246c · tacit 13c) + 2026-09-29 설치본 코드 감사

- 줄 번호는 설치본 `G2_TEST/.garagiste` 기준(= 프레임워크 `team/scripts`·`team/packs` 미러, 10:39Z 설치). 11:11Z 이후 수정 3건(allow 목록·selftest·pre-commit 모드)은 미반영 상태였으므로 적용 전 대조.
- 규칙 1: 모든 항목에 「검사」 한 줄 — 고쳐졌는지 기계 또는 사람이 아는 방법. 검사를 못 쓰는 항목은 싣지 않았다.
- 규칙 2: 항목 하나 = unit 하나 크기(60~90분). ID: **R** = 수리(있는 것의 결함), **Q** = 요구(이번에 새로 등록).
- 규칙 3: 제거 대칭 — 이 백로그가 낳는 장치도 검출 실적이 3 unit 연속 0이면 제거 후보다.

---

## 상태 — L0 수리 완료 (2026-09-29)

| 항목 | 커밋 | 항목 | 커밋 |
|---|---|---|---|
| R1·R3 | 6e0877f | R8 | 99ec1a5 |
| R2·R7 | 97166fc | R9 | 015a864 |
| R4·R5 | 060e511 | R15 | 7bbe7dc |
| R6 | 9787623 | R14 | 이 문서의 커밋 |
| R12·R10 | a053a0d · 1ebd7f7 | R13 | 두 테스트 레포의 재설치 커밋 |
| R11 | 6f5b183 | | |

백로그와 구현의 차이(설계 변경):
- **R2**: 「non-admin 거부」 대신 「팩(worktree 컨텍스트) 거부 + tried·decide 메인 전용」 — 비동기 CEO(Q2)의 conductor 중계를 살리기 위해. 잔여 위험(conductor의 허위 중계)은 CEO가 보는 세션 전사에 남는 것으로 수용.
- **R1 검사**: seed→ship×5 통합 시험 대신 합성 증명(카운터 수식은 기존 unit 테스트, seed 전후 접점 불변은 e2e) — e2e 비용 절약.
- **R12**: 7조건 → **8조건**(questions). 가역/비가역 구분은 L1 Q2의 몫.
- **R9**: 롤백 = `reset --keep` + 문서(LEDGER 행·BACKLOG·STATUS·unit 상태) 복원. 증거 jsonl은 append-only 유지(`ship_rollback` 줄); ship 원장 줄을 quick PASS 뒤로 옮겨 유령 출하가 무인 카운터에 안 잡힌다.
- **R4**: 완전한 셸 파싱은 하지 않는다 — 리다이렉트 전수 + 보호 구역을 명시한 in-place verb만(3층 원칙: 훅은 최선 노력, 법은 게이트).
- **R8 부속(doctor 참조 경로)**: 오탐 — install.sh 등 언급은 치료법 안내 문자열이지 파일 검사가 아니었다.
- **발견(미수리, L1 전 소수리 후보)**: guard DESTRUCTIVE의 보호 브랜치 push 정규식이 main|master 고정 — protected_branch가 다른 이름인 레포에선 push 차단이 약하다.

## 상태 2 — L1 진입 조건 구현 완료 (2026-09-29)

- **Q1 `drop`** (edfca85) — kill-and-respawn: wip 커밋 → `dropped/<slug>-<ts>` 브랜치 보존 → worktree 제거, dropped는 seed 자리를 막지 않아 같은 slug 재생성, `--forget`이면 BACKLOG도 닫음. conductor 전용(가드 + 메인 검사).
- **Q1 re-spec** (aa69608) — 기계 경로는 R5의 상태 기계로 이미 성립(brief spec 재실행 → 정체 spec 복귀), e2e로 고정. Flow 7(인터럽트 4종 착지)과 spec 팩 re-spec 규칙 명문화.
- **spawn 센서** (d7b957e) — SubagentStop의 agent_type이 팩이면 원장 `spawn_stop`(무명 stop은 기록 안 함 — v1 1,024건 사고 백신). unit당 spawn = `pack` 줄(의도) + `spawn_stop`(완료); `spawned`(토큰·분)는 보조.
- **Q4 열** (6d2abaf) — LEDGER attack 칸이 「선발견→최종red/총」. 후발견은 `tried fail` 원장 줄 — 3 unit 뒤 두 수의 비가 Q4의 표.
- **소수리** (4464fcb) — 보호 브랜치 push 차단을 protected_branch 동적으로(L0의 발견 항목 해소).

L1 시험 준비 완료: 사전 등록 = **docs/measurements/L1-TRIAL.md**(동결 59bb724·시계 정의·3-unit 구성·빈 표·conductor 절차) · G2_TEST2 재설치(475c4a1). 시험은 G2_TEST2 안에서 연 새 conductor 세션이 그 문서대로 돈다 — 이 세션(훅 밖)이 돌리면 표가 오염된다.

---

## L0 — 수리. 이 레벨을 닫기 전의 어떤 시험도 v2의 기록이 아니다.

### P0 · 신뢰 구멍 — 게이트가 거짓말할 수 있는 길

- **R1. 무인 출하 상한이 절대 발동하지 않는다.**
  seed가 unit마다 `from:'ceo'`를 넘겨(`work.mjs:175`) touchCeo가 찍히고(`:135`), 카운터는 마지막 CEO 접점 이후의 ship만 센다(`state.mjs:15-17`) — 매 seed가 리셋. 설계가 스스로 병목이라 부른 「미검수 누적」의 감시가 허구.
  수리: touchCeo는 CEO 발화가 실린 명령(brief·decide·tried·scope)에서만. seed는 `from:'seed'`.
  검사: seed→ship 5연속 뒤 6번째 ship이 budget FAIL.
- **R2. tried를 팀이 자가 인증할 수 있다.**
  `work.mjs:209-217` 호출자 제한 없음 — 미검수 3 상한이 conductor의 정직에 의존. tried가 touchCeo도 찍어(`:214`) R1 고리에 물려 있다.
  수리: 가드가 non-admin 세션의 `work.mjs tried`를 거부(GARAGISTE_ADMIN 패턴 재사용 — CEO 세션에서만).
  검사: non-admin Bash에서 tried 거부되는 negative test.
- **R3. 팀 자발 unit 상한(no_ceo_units)이 사문(死文)이다.**
  `origin_kind:'team'`은 `new --from team`만 만드는데(`work.mjs:129`) 아무도 그 플래그를 쓰라고 배우지 않는다(`state.mjs:18-20`).
  수리: origin_kind 의미를 「원문이 CEO 문장인가」로 고정 — `new`의 기본값을 team으로 뒤집고, brief 경유·BACKLOG(intake) 경유만 ceo.
  검사: 팀 발의 unit 2연속 출하 뒤 3번째에서 stop.
- **R4. Bash가 쓰기 경계를 우회한다.**
  Bash 분기(`guard-rules.mjs:35-45`)는 파괴적 git·원장·규칙집만 보고 제품·테스트 경로를 안 본다 — build가 `sed -i tests/acceptance/…`, conductor가 `cat > src/…` 가능. 「정체성 = 쓰기 경계」의 구멍.
  수리: worktree 안 Bash의 쓰기 verb(`>`·`>>`·`sed -i`·`tee`·`rm`·`mv`) 대상 경로에 PACK_RULES 적용. 완전 차단은 불가능함을 명시하고(Q8) 최종 방어는 게이트임을 문서화.
  검사: build worktree에서 `sed -i tests/acceptance/x` 거부되는 negative test.
- **R5. 팩 마커가 무방비다.**
  `.garagiste-pack`은 RULEBOOK(`guard-rules.mjs:7`)에도 build deny(`:13`)에도 없고 gitignore 대상 — build가 스스로를 spec으로 바꿔 수용 테스트를 고칠 수 있다.
  수리: 마커 파일을 없애고 가드가 `units/<slug>.json`의 state(스크립트 전용·RULEBOOK 보호)에서 팩을 읽는다 — 출처 단일화.
  검사: build 세션이 마커/state 변조 후에도 acceptance 쓰기 거부.
- **R6. 어느 에이전트든 검증 명령을 재작성할 수 있다.**
  `work.mjs commands`(`:220-232`)는 RULEBOOK_SHELL(verb 목록에 node 없음)에 안 걸리고, worktree의 team.json을 고쳐 그대로 ship된다. HAZARDS 8(「설정을 고쳐 초록」)의 재발 통로. 원장에 남지만(`:231`) 막히지 않는다.
  수리: commands는 boot 상태의 worktree 또는 ADMIN에서만. ship이 diff에 team.json 변경이 있으면 boot unit 외 FAIL.
  검사: build worktree에서 commands 호출 FAIL + team.json 변경 실은 feature unit의 ship FAIL.
- **R7. 게이트의 env 우회를 가드가 안 막는다.**
  `GARAGISTE_WIP=1`·`GARAGISTE_SHIP=1 git commit`이 커밋 게이트 검사를 건너뛰는데 가드의 DESTRUCTIVE(`guard-rules.mjs:4`)는 env 접두를 안 본다.
  수리: non-admin Bash에서 `GARAGISTE_(SHIP|WIP)=` 접두 거부(ship.mjs는 node 자식 env로 넘기므로 영향 없음).
  검사: 에이전트 Bash의 `GARAGISTE_SHIP=1 git commit` 거부.

### P1 · 조용한 죽음과 마찰 — tacit을 죽인 종류

- **R8. 훅 사망이 침묵한다 + doctor가 이유를 숨긴다.**
  session-start가 doctor의 첫 줄("FAIL doctor N")만 주입(`session-start.mjs:16`). v1 최대 사인(HAZARDS 10: Windows 훅 침묵사)의 방어가 표시 한 줄.
  수리: seed·ship이 실행 전 doctor를 fail-closed로 강제(훅이 죽어도 스크립트 경로는 살아 있으므로 Layer 0에서 잡힘) + doctor 이유 전문 출력 + doctor의 참조 경로(설치본에 없는 install.sh 등, `doctor.mjs:17,30,49`) 정합.
  검사: 훅 제거 상태에서 seed 실행 시 FAIL doctor에 이유 전문.
- **R9. ship이 원자적이지 않다.**
  ff 머지·shipped 마크(`ship.mjs:71,77`)가 머지 후 quick(`:88-90`)보다 먼저 — quick 실패 시 main에 머지는 남고 unit은 shipped로 남는다.
  수리: shipped 마크·LEDGER·worktree 제거를 quick PASS 뒤로; 실패 시 unit state를 `ship-failed`로 명시.
  검사: quick 실패 주입 시 unit이 shipped로 집계되지 않음.
- **R10. 최종 tree에서 증거를 다시 만들라는 안내가 없다.**
  redproof·attack이 tree 단위라 마지막 커밋 뒤 재실행이 필수인데, 그걸 배우는 곳이 ship FAIL 문구뿐(`ship.mjs:18,21`).
  수리: build 팩 말미에 재실행 지시 한 줄 + ship FAIL 문구가 복붙 가능한 정확한 명령 출력.
  검사: 정상 루프에서 첫 ship 시도가 evidence-stale로 FAIL하지 않음.
- **R11. spike 순서가 자기모순이다.**
  boundary HIT면 「spike 팩부터」(`work.mjs:127,139`)인데 brief.mjs는 수용 테스트 없인 spike 팩을 거부(감사: `brief.mjs:84-86`) — 실제 순서는 spec→spike.
  수리: 안내·unit 초기 state·brief.mjs 중 한쪽으로 통일.
  검사: boundary HIT unit에서 안내문대로 실행하면 첫 팩이 FAIL 없이 열림.
- **R12. unit의 열린 질문이 ship을 막지 않는다.**
  `ask <slug>`는 DECISIONS와 STATUS에 보이지만(`work.mjs:188-190`) ship 7조건 어디에도 없다 — 질문 걸린 unit이 그대로 출하 가능.
  수리: ship 조건에 「이 unit의 열린 Q 없음」 추가(Q2의 가역/비가역 구분과 연동).
  검사: ask 후 ship FAIL → decide 후 PASS.

### P2 · 위생

- **R13. 테스트 레포 2개가 수정 전 상태로 설치돼 있다.**
  G2_TEST·G2_TEST2 공통 4결함(확인 완료): `permissions.allow` 부재 → 모든 node·git 호출이 승인 프롬프트(자율성 사망) / pre-commit 100644 / `core.hooksPath` 미설정 → 커밋 게이트 침묵 꺼짐 / 체크아웃이 main이 아니라 `ship.mjs:59`에서 거부.
  수리: 수정 3커밋(9b61685·37e7ed0·0066e50) 이후 판으로 재설치.
  검사: doctor PASS + 임의 node 호출이 프롬프트 없이 실행 + 시험 커밋에 게이트 로그.
- **R14. 문서와 HAZARDS가 자기 규칙을 어긴다.**
  README:32(team.json commands를 채워라) ↔ :35(「사람이 채울 파일은 없다」) 모순 / CHANGELOG:7·16이 삭제된 v1 트리·CI를 여전히 서술 / HAZARDS의 검사열이 존재하지 않는 검사·프로브를 가리킴(:5·:7·:8·:12 — 「검사가 없으면 줄도 없다」를 등록부 자신에게).
  검사: doctor가 HAZARDS 각 줄의 검사를 실행 가능한 명령·게이트 조건으로 해석 가능.
- **R15. 설치가 fail-closed 원샷이 아니다.**
  첫날 설치기 버그 3건(BOM·git stderr·재귀 함수)이 그 증거.
  수리: `install → doctor → selftest`를 한 명령으로, 빨간 채 완료 선언 금지. mac/linux/win 빈 폴더 설치 e2e를 릴리스 전제로(Actions가 없으면 수동 체크리스트라도). 재설치·업그레이드가 team.json·models를 보존하는 회귀 테스트(v1 「재적용」병).
  검사: 3-OS 설치 e2e green이 릴리스 조건.

**L0 게이트: R1~R15 닫힘 + selftest·설치 e2e green + 훅 전멸 상태에서 속임수 시나리오(테스트 약화·마커 변조·명령 재작성)가 전부 게이트 FAIL.**

---

## L1 — 신뢰. 실제 제품 하나(G2_TEST2의 Lacuna 재도전)에서 3 unit.

- **Q1. 인터럽트 컴파일러 — CEO 발화 4종은 한 턴 안에 네이티브 객체가 되고, 안 닿는 unit은 멈추지 않는다.**

  | 발화 | 객체 | 경로 |
  |---|---|---|
  | "여기 버그 있더라" | 재현 red 테스트 = 새 unit | `tried fail`의 자동 `-fix` 라인(`work.mjs:216`)을 일반화 — spec 팩이 재현 테스트부터 |
  | "저게 낫겠더라" | 진행 중 unit의 수용 테스트 수정 | spec 팩 재실행 절차 신설(redproof 기준 갱신 포함) |
  | "이런 기능도" | BACKLOG 한 줄 | `work.mjs new` — 이미 있음 |
  | "방향 바꾸자" | scope 리셋 + 활성 unit 폐기 | `work.mjs drop <slug>` 신설(worktree 제거·state=dropped — 현재 폐기 명령 부재), 원장은 남는다 |

  검사: 4종 각각에 절차 1개 + negative test 1개(폐기가 다른 unit의 seed를 막지 않음).
- **Q2. 질문 이원화 — 부재·수면 중에도 팀이 안 막힌다.**
  가역: `default`로 진행 + STATUS 노출 + 원장(전부 있음 — v1의 「질문 80%가 추천 수락」이 근거). 비가역(데이터 모델·돈·외부 효과·삭제): ask → 그 unit만 WAIT(=R12), 만료 없음. intake·spec 팩이 질문에 가역/비가역을 표시.
  검사: 비가역 열린 채 ship FAIL / 가역 default는 ship 통과 + STATUS에 노출.
- **Q3. 입력물 서명 게이트 — PRD·초안·메모·이미지가 유실 없이 unit이 된다.**
  경로는 있음(BRIEF 원문 축적 → intake → 예/아니오 → scope). 추가: intake 산출(unit 한 줄 + 수용 한 줄)을 CEO가 훑고 scope로 받는 것을 명시적 서명으로 규정 — 약한 모델 환경에서 품질 하한을 지키는 자리. G2_TEST2의 BRIEF-draft(134줄)+디자인 PNG 8장이 첫 시험 재료.
  검사: 첫 intake에서 CEO 검토 ≤5분에 범위 확정, 원문 대비 누락 항목 0(CEO 판정).
- **Q4. attack 검출률 계측 — v1에서 유일하게 작동한 읽기 게이트(correctness+security 리뷰 A급 56%)를 attack이 대체했다는 건 아직 가설이다.**
  LEDGER에 「attack 선발견 / CEO(tried) 선발견」 대조 열 추가.
  검사: 3 unit 후 그 비율이 표로 나옴 — attack이 못 잡는 계급이 보이면 그때 장치 논의(선제 추가 금지).

**L1 게이트: BIRTH pass line(승인→출하 ≤75분 · unit당 spawn ≤8 · 미검수 ≤3) + 순정 Claude Code A/B 3지표(출하-시도가능 unit당 CEO 분 · "됐다" 이후 CEO 발견 결함 · 세션당 재브리핑 분). 이 표가 나오기 전까지 v2의 모든 수치는 주장이다.**

---

## L2 — 부재. 팀이 안 보는 시간에 신뢰를 번다.

- **Q5. 무인 하루 프로토콜.** 아침 brief/scope 한 번 → 저녁 try 카드 ≥3장, 낮 접점 0. 검사: 원장의 CEO 접점 타임스탬프로 증명(R1이 전제).
- **Q6. 인터럽트 실사격.** 4종을 진행 중에 의도적으로 주입, 컴파일 소요 턴·무관 unit 정지 0을 측정해 docs/measurements에 기록.
- **Q7. 우아한 정지 실증.** 부재 3일 시뮬레이션 — 상한 도달 후 STATUS 첫 줄에 멈춘 이유를 남기고 정지, 규칙 완화 드리프트 0(HAZARDS 11: 19시간 무인 완화 사고의 백신). 검사: 상한 초과 상태의 ship 시도가 전부 FAIL 로그.

**L2 게이트: 1주간 「green 이후 CEO 발견 결함」 0.**

---

## L3 — 다중·회사(on-prem + opencode). 약한 모델일수록 하네스가 번다.

- **Q8. 3층 이식성 명문화 — 법은 Layer 0.**
  Layer 0(git 훅 + node 스크립트 + 원장): 어느 하네스·모델·인간에게도 동작, 신뢰는 전부 여기서 성립. Layer 1(Claude 훅·opencode 플러그인): fail-loud 최적화일 뿐, 전멸해도 신뢰 유지. Layer 2(팩 markdown): 보편. redproof의 성질 — 약화된 테스트는 old code에서도 통과해 base_red가 깨진다 — 을 negative test로 기계화.
  검사: 훅 0 환경에서 속임수 3종이 게이트 FAIL(L0 게이트의 재확인을 opencode에서).
- **Q9. opencode 어댑터 — 스폰 방법 + guard 플러그인 + agents 6파일만.**
  guard-rules는 이미 하네스 중립(`guard-rules.mjs:1`), models도 .opencode 경로 인지(`work.mjs:255`). 금지 조항: 커맨드·스킬 트리 복제 없음 — v1 패리티병(두 flavor 손 동기화, parity-check가 그 증상)의 재발 금지. AX의 가짜 끝점·replay 인프라를 하네스 테스트에 재사용(네트워크 0, 비용 0).
  검사: opencode 환경에서 selftest + L0 속임수 시나리오 재현.
- **Q10. provider-per-pack.** models 개념을 provider까지 확장 — 집: spec/attack=최강 모델, 회사: spec=온프렘+CEO 서명 강화(약한 모델은 「잘 고정된 스펙의 실행자」, 판단은 사람이 더 잡는다). 검사: team.json 프로파일 한 줄로 두 환경 전환.
- **Q11. 버전 고정.** 제품 레포에 설치된 v2 버전 기록, 업그레이드는 diff를 보이는 명시적 unit — 자동 재설치 금지. 검사: 업그레이드 회귀 테스트(R15와 공유).
- **Q12. 포트폴리오 — CEO 주의력이 전 제품의 스케줄링 자원.**
  전역 미검수 상한 + 제품 관통 인박스(각 레포 STATUS 첫 줄 수집) + 공유 HAZARDS(프레임워크 제공 + 제품 오버레이 — 이미 그 구조). 제품 2개 이상일 때만 구현.
  검사: 전역 상한 도달 시 모든 레포의 seed 정지.
- **Q13. 레거시 팩 — 회사 투입의 전제.**
  v1에서 살아남을 자격이 있는 것(assess·parity — 대상이 사람 마음이 아니라 코드): 현행 동작의 characterization 테스트 = 수용 기준, redproof 그대로 작동. incremental intake(오프셋 재개)는 있음 — LACUNA 레거시 intake 팩 151KB가 반례 근거.
  검사: 기존 코드베이스 1개에서 boot 없이 첫 unit 출하.

**L3 게이트: unit당 CEO 분이 L1 대비 비악화 + opencode 환경에서 L0 게이트 전부 재현.**

---

## L4 — 영역 확장(웹 → 데스크톱 → 게임·슈퍼앱). 확장 축은 검증 가능성.

- **Q14. 사람-증거 레인.** `@sensor human`을 일급으로: 스크린샷·녹화·플레이 빌드가 원장 증거, STATUS의 「안 본 것」과 별도 집계(`state.mjs:31`에 싹 있음). claims의 미태그 기본값(machine, `claims.mjs:8`)을 unknown으로 바꿔 누락이 보이게. 검사: human 센서 unit이 CEO 판정 전 done으로 집계되지 않음.
- **Q15. 플랫폼 센서 일반화 — 센서 없는 플랫폼엔 주장도 없다.** 대상 플랫폼 목록(신규 설계 — 옛 `machine_os`는 검증 platform의 허용 목록이라 이 일을 못 했고 win32 오탐으로 2026-09-29 제거됨)에 대해, 대상 플랫폼의 verify 기록 없으면 ship FAIL(tacit의 Linux 계획·AX 0046 존재하지 않는 zip의 재발 방지). 재료는 원장의 `platform` 필드. 검사: Windows 타깃 unit이 linux full만으로 ship 시도 시 FAIL.
- **Q16. 멀티모달 능력 매트릭스.** provider별 입력 능력(이미지 등)을 team.json에 — 불가 provider에서 디자인 자산 unit은 사람 주석을 요구하고 그렇게 말한다. 검사: 온프렘 프로파일에서 이미지 첨부 intake가 명시적 안내 출력.

**L4 게이트: 자동화 불가 수용이 있는 도메인(UI 중심 앱 1개)에서 L2 신뢰 지표 유지.**

---

## 부록 A — 이 백로그의 헌법(6줄)

1. 실행 증거만 전진을 허가한다 — 문서 승인·의견 APPROVE는 통화가 아니다.
2. 조직을 나누지 말고 컨텍스트를 나눈다 — 분리는 읽기 fan-out·격리 검증·권한 경계에만. 에이전트끼리 말하지 않는다.
3. 법은 코드, 산문은 조언 — 장치는 사고에서 태어나고, 검출 실적 0이면 죽는다(추가·제거 대칭).
4. CEO는 결재자가 아니라 첫 사용자 — 증분 = 써볼 수 있는 것, 질문은 기본값과 함께.
5. 기계 검증은 스크립트($0), 판단 검증은 최강 두뇌 — v1은 정반대로 배치했었다.
6. 프레임워크는 제품의 그림자 — 측정 표 이전의 모든 수치는 주장이다. 백지 재설계는 이번이 마지막(다음부턴 장치 단위 수리).

## 부록 B — 근거 위치

- V1 측정: v2 브랜치 `docs/catalogue/V1-ANALYSIS.md`(2026-09-28) — plan당 고정비 ~70분, 코딩 41~47%, 결함을 잡은 것은 cs 리뷰(56%)와 「돌려 봄」(최고가 rework 4/4) 둘뿐, critic 15%·step-verifier 0, 규칙집 44→212KB, retro 제거 0, 질문 80% 추천 수락.
- 제품 부검: LACUNA(`docs/DECISIONS.md:30` 하얀 화면 — 3 plan × 4~5렌즈 APPROVE 뒤 CEO 발견), AX(`docs/METRICS.md:51` plan 0046 — 22 blocker 해결·4렌즈 APPROVE 머지 후 당일 CEO 거부·삭제, `:47` logic 212줄에 spawn 753), tacit(마지막 커밋 "hook error" — 상대 경로 훅 침묵사).
- v2 코드 감사 기준: 설치 커밋 95e9292(G2_TEST)·b0341cf(G2_TEST2), 2026-09-29.

## 표 이후 후보 (시험 중 등록 — 장치는 동결 해제 뒤)
- 팩 상한 이유-차선: LARGE_STEP 패턴을 brief.mjs에 이식 — 상한~2×는 이유 선언(원장 기록)으로 통과, 2×는 벽. 모양 휴리스틱(팩·step·산문)은 밴드, 증거 게이트·예산 정지는 벽이라는 구분의 성문화. 사고 8의 후속 (2026-09-29, CEO 발의).
- session-start 주입에 state 첫 줄 + 「써볼 것」·「정해 주세요」 카운트 추가 — 새 세션이 CEO 대기 항목을 산문 규칙 없이 기계적으로 재인식(CEO 발의 "inbox" 아이디어의 정착지; 별도 inbox/ 폴더는 같은 진실의 둘째 사본이라 기각). 사고 없인 장치 금지 — L2(무인 하루·재개)에서. (2026-09-30)
- 이음새(e2e) 검증의 성장 경로 성문화 — 누적 full + tryable-outcome 절단이 주는 통합은 유지하되, 표의 「green 후 CEO 발견 결함」이 0이 아니게 유지되면 flow unit 컨벤션(교차 흐름의 인수를 가진 unit)·상시 조립 스모크를 장치화. desktop류 프로젝트는 UI unit의 인수에 실기동 왕복 한 줄을 요구(CEO 발의, 2026-09-30).
- system-attack 팩(CEO 발의 "e2e tester") 설계 — attack의 스코프 일반화: 입력 = shipped unit 전체의 surface·try + 실행 명령, 쓰기 경계 = tests/adversary/system-*(기존 배관이 pseudo-slug system으로 수용: verify attack system), 산출 = 이음새 red 테스트(발견) 또는 「탐색 경로 N·발견 0」 원장 기록 — 초록 생산은 산출물이 아니다(green theater 금지). 리듬 = N unit 출하마다·무인 세션 끝·CEO 호출, 판단 역할이라 상위 모델, 테스트는 결정론(고정 fixture·타이밍 금지 — flaky 공장 방지). 채용 방아쇠 = L1 표 「green 후 CEO 발견 결함」 열이 0이 아니게 지속되면 L2에서 채용, 0이면 보류. (2026-09-30)
