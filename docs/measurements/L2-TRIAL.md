# L2 시험 — 사전 등록 (무인 하루)

2026-10-01 등록 · **머지가 CEO 서명** · 시험대: G2_TEST5(L1 4차 시험대 그대로 — 남은 SCOPE unit이 재료) · **프레임워크 동결: GARAGISTE main 3b8aede**(L1 4차 중 수리 24·25 포함)
이 문서는 시험 **전에** 커밋된다. 진입 조건은 L1 통과(4차 재현, 원시값 — docs/measurements/L1-TRIAL.md)였다.

## 무엇을 재나 (백로그 §L2)
- **Q5 무인 하루**: 아침 창 한 번(결정·범위·「가」) → 낮 CEO 접점 0 → 저녁 창에 try 카드 ≥3장. 팀이 안 보는 시간에 무엇을 출하했고, CEO가 써서 결함을 찾는가.
- **L2 게이트**: 무인 하루 **3회**(한 주 평일) 누적 「green 이후 CEO 발견 결함」 0.
- 이 등록 밖: Q6 인터럽트 실사격 · Q7 우아한 정지(부재 3일) — 무인 하루 첫 표 뒤 따로 등록한다(한 번에 한 변수).

## 동결 규칙 — L1과 같다
- 시험 중 프레임워크는 위 sha에 고정. 결함 수리는 허용(정본 먼저 → 반영 블록 → HAZARDS·CHANGELOG), 장치 추가·흐름 변경은 금지 — 표가 나온 뒤에. 수리로 unit을 재시작하면 「시도 n」.
- 무인 날의 프레임워크 FAIL: conductor는 그 줄 전문을 남기고 **멈춘다**(L1 규칙 4 그대로). 그날 카드가 줄어드는 것이 정직한 비용이다.

## 준비 (첫 아침 전 1회)
- 시험대를 동결에 맞춘다: L1 4차 중 반영한 넷(redproof·ship·brief·team.json 상한)에 더해 `.garagiste/HAZARDS.md`(사고 24·25 두 줄)만 남았다 — 반영 블록(fetch main → HAZARDS.md 교체 → 경로 지정 커밋).
- 미검수 0으로 시작한다(미검수가 남아 있으면 그날 출하 상한이 줄어든다) — L1 4차의 time-model try가 끝나 지금 0이다.
- 규칙집 기준선: `git rev-parse HEAD:.garagiste`를 그날 표 머리에 적는다 — 저녁에 같은 값이면 규칙 완화 드리프트 0(HAZARDS 11: 19시간 무인 완화 사고).

## 하루의 모양
- **아침 창(CEO)**: G2_TEST5에서 새 conductor 세션 → `state.mjs` 첫 줄 → 열린 Q decide → scope(기존 범위면 그대로) → 「가」 → 떠난다. 아침 창의 끝 = 원장의 마지막 CEO 접점 줄(decide·scope) ts.
- **낮(무인)**: conductor는 Flow 4 루프만. 멈춤은 규칙의 여섯뿐 — hard 질문(그 unit만) · 미검수 3 · 무인 출하 5 · spike 허용 밖 · 프레임워크 FAIL · SCOPE DONE. 멈추면 마지막 출력에 이유 한 줄.
- **try 위임 없음**: 무인 날의 tried는 전부 저녁의 CEO다 — 낮의 tried는 원장상 CEO 접점(touchCeo)이라 「낮 접점 0」을 깬다.
- **저녁 창(CEO)**: STATUS 「써볼 것」 카드를 전부 직접 try → `tried` · 열린 Q decide · FAIL 줄은 정비 채널로 · conductor에게 L1 4차 양식의 표(docs/measurements/L1-4-conductor.md 5번)에 아래 열을 더해 산출.

## 시계·지표 (원장 ts — 손 기록은 CEO-분뿐)
- 낮 접점: 아침 창 끝 → 저녁 첫 tried 사이의 decide·tried·scope 줄 수(목표 0) + 그 사이 docs/BRIEF.md의 `## <시각>` 절 수(brief는 원장에 줄이 없다).
- 무인 출하: 그 사이 ship 줄과 unit별 seed→ship 원시 · spawn · 토큰 · attack · RESPEC · needs 수정 · 프레임워크 FAIL(L1 4차 양식).
- 멈춤: 낮의 마지막 원장 줄 ts와 conductor 마지막 출력의 이유.
- 저녁: 카드 수 · tried ok/fail · **green 후 CEO 발견 결함**(tried fail 수 + 메모) · CEO-분(아침 창·저녁 창 따로).
- 규칙집 드리프트: 아침·저녁 `HEAD:.garagiste` 값(수리 반영 커밋이 있었으면 그 커밋만 예외, 표에 명기).

## 판정
- **무인 하루 1회 통과**: 낮 접점 0 · 규칙집 드리프트 0 · 멈춤이 규칙 여섯 중 하나(이유가 남음) · 저녁 카드 ≥3장. 카드가 3장 미만이면 멈춘 이유가 가른다 — 규칙대로의 정지(hard 질문·SCOPE DONE)는 통과, 프레임워크 FAIL로 인한 정지는 미통과(수리 뒤 그날을 다시).
- **L2 게이트**: 무인 하루 3회 누적 「green 후 CEO 발견 결함」 0. 0이 아니면 결함의 계급을 적는다 — attack이 못 잡은 이음새면 system-attack 채용 면접에 1점(백로그 방아쇠).
- 미통과면 원장 ts로 병목을 지목 → 수리 → 재시험. 장치는 사고에서만.

## 예측 (채점 대상 — conductor에게는 주지 않는다)
1) 하루 3 unit 출하 뒤 미검수 3으로 정상 정지, 낮 경과(아침 창 끝 → 세 번째 ship) ≤90분 2) 낮 접점 0 3) 프레임워크 FAIL ≤1/일 4) green 후 CEO 발견 결함 0 5) 저녁 창 CEO-분 ≤15.

## 표 이후 후보 — 이 등록에 넣지 않는다 (CEO 「가」 대기)
- 팩 이유-차선(사고 25가 첫 사고 근거) · system-attack(방아쇠: green 후 결함 ≠ 0 지속) · session-start CEO 대기 항목 주입(무인 하루 재개에서 사고가 나면) · L1 4차 관찰 셋(intake mark · try fixture · 팩 FAIL 원장 줄 — 백로그).

## 1일차 표·판정 (2026-10-01 기입 — conductor가 원장에서 산출, 저녁 지시서: docs/measurements/L2-day-conductor.md)
시험대 G2_TEST5 · 동결 3b8aede · 시험 중 수리 1(사고 26 105f512 — 저녁 창 연장 중, 반영 c0f4ec6 · HAZARDS 24·25·26 함께) · 규칙집 `HEAD:.garagiste` = dc8a67f(반영 뒤)

**경계(등록문 정의)**: 아침 창 끝 16:22:32Z — decide Q11(seed 5분 뒤 팀이 올린 질문에 자리에 있던 CEO가 답), 같은 자리의 BRIEF 16:22 「이제부터는 대부분의 결정은 팀에게 위임한다」 → 저녁 첫 tried 22:38:54Z. **무인 376.4분.**
- 정비 채널의 저녁 지시서가 경계를 등록문과 다르게 정의했다(아침 창 끝 = 첫 unit 직전, 저녁 창 = 마지막 ship 뒤 첫 tried) — CEO 복귀 뒤의 유인 구간까지 「낮」에 들어가 conductor 표의 낮 접점은 8. 등록문 정의로는 0. 판정은 등록문으로, 두 값을 함께 남긴다. 2일차 지시서는 등록문 정의로 고쳤다.

| 구간 | unit | 구성 | seed→ship 원시(분) | spawn 의도/완료 | 토큰 | attack | tried | green 후 CEO 발견 결함 | 프레임워크 FAIL | RESPEC |
|---|---|---|---|---|---|---|---|---|---|---|
| 무인 | fixture-eoren | ① | 16.2 | 5/5 | 254K | 1→0/2 | ok(CEO) | 0 | 0 | 1 |
| 무인 | indexer-sqlite | ① | 8.8 | 4/4 | 174K | 2→0/2 | ok(CEO) | 0 | 0 | 0 |
| 무인 | fold-state | ① | 9.6 | 4/4 | 192K | 1→0/1 | ok(CEO) | 0 | 0 | 0 |
| 연장(유인) | record-layer | ① | 8.6 | 4/4 | 188K | 1→0/1 | ok(CEO) | 0 | 0 | 0 |
| 연장(유인) | agent-read-tools | ① | 8.2 | 4/4 | 152K | 1→0/1 | ok(CEO) | 0 | 0 | 0 |
| 연장(유인) | vault-open | ①+② · ③(ship 때 diff-HIT) | 22.5 | 5/6* | 231K | 1→0/2 | ok(CEO, human@win32) | 0 | 0 | 0 |
| 연장(유인) | effect-conflict | ① | 400.1(16:52 seed 뒤 예산 정지로 22:55까지 유휴 포함) | 6/5* | 234K | 1→0/1 | ok(CEO) | 0 | 1(사고 26) | 0 |
| 계 | 7 | | | 32/32 | 1.42M | 선발견 8 | 7 ok | 0 | 1 | 1 |

\* 병렬 build 중 spawn_stop(slug 없음)이 같은 팩의 최근 pack 줄에 붙은 귀속 어긋남 — 합계는 맞다. redproof 7/7 base_red head_green · needs 수정 0.

- **판정: 1일차 통과.** 낮 접점 0 · 규칙집 드리프트 0(c0f4ec6은 저녁 창의 수리 반영 — 등록된 예외) · 멈춤 16:52 미검수 3(규칙) · 저녁 카드 3(연장 포함 7) 전부 ok. **L2 게이트 1/3** — 누적 green 후 CEO 발견 결함 0.
- 예측 채점: 1) ✓ 3 unit 출하 뒤 미검수 3으로 정지, 낮 경과(아침 창 끝 → 세 번째 ship) ≈29분 2) ✓ 낮 접점 0(등록문 정의) 3) ✓ 프레임워크 FAIL 1(연장 구간, 사고 26) 4) ✓ 0 5) CEO-분 기입 대기.
- **구조적 발견**: 무인 376분 중 팀이 일한 것은 첫 ≈29분 — 나머지 ≈347분은 미검수 3 정지로 CEO를 기다렸다. 무인 하루의 처리량은 설계상 CEO 검수 3장에 묶인다(백로그 Q12 「CEO 주의력이 스케줄링 자원」의 실측). 상한 조정은 정책 결정 — 3일 표 뒤에.
- 관찰(장치 아님 — 백로그 후보 등록): 가드 원장 읽기 오탐(원장 경로와 한 줄의 sed·`2>/dev/null`을 쓰기로 거부 — 표 산출 방해) · conductor의 병렬 seed(22:47 두 번 — Flow 4는 순차, seed·가드는 병렬을 막지 않는다: spawn_stop 귀속 어긋남과 사고 26의 토양) · seed가 예산 정지 중에도 unit을 연다(effect-conflict 6시간 유휴·오래된 base) · try 카드 잔여물(eoren.sqlite)이 main을 더럽혀 ship FAIL → conductor가 CEO의 파일을 scratchpad로 옮김(판단 개입) · 커밋 trailer가 쓰기 경계에 막힘(2차 실기 이후 두 번째) · vault-open 앱 테스트가 일괄 실행에서 4건 실패·재실행 통과(flaky 의심) · conductor 메모리 파일 쓰기 거부 2.
- 규약 이탈 1(연장 구간): 프레임워크 FAIL 때 그 unit만 멈추고 돌던 vault-open을 끝까지 마쳤다(등록문: 그날 멈춤) — 결과엔 영향 없음, 사실로 남긴다.
- CEO의 BRIEF 「대부분의 결정은 팀에게 위임」 뒤 decide는 0 — 팀이 정한 것(STATUS 「팀이 정한 것」)을 CEO가 저녁에 훑는 것이 Q2(가역 기본값)의 짝이다.
