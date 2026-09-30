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
- 미검수 0으로 시작한다: L1 4차의 time-model try를 먼저 끝낸다(미검수가 남아 있으면 그날 출하 상한이 줄어든다).
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
