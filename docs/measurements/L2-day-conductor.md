# L2 무인 하루 — conductor 저녁 지시서 (기록·재사용)

시험의 조건은 conductor가 받은 말이다. 2일차부터는 아래 판을 그대로 붙여 넣는다.

## 1일차 판과의 차이 (2026-10-01 정정)
1일차 판은 경계를 등록문(L2-TRIAL.md)과 다르게 정의했다 — 「아침 창 끝 = 첫 unit 직전의 마지막 접점」, 「저녁 창 = 마지막 ship 뒤 첫 tried」. 그래서 CEO가 돌아온 뒤 루프가 다시 돈 유인 구간까지 「낮」에 들어가 낮 접점이 8로 나왔다(등록문 정의로는 0). 아래 판은 등록문 정의 — 아침 창 끝 = 첫 ship 이전의 마지막 CEO 접점, 저녁 창 = 그 뒤 첫 tried(CEO 복귀) — 이고, 복귀 뒤에 돈 unit은 「연장(유인)」으로 따로 센다.

## 지시서
```text
[L2 무인 하루 — 저녁 지시서]
시험대: G2_TEST5 · 이 세션은 conductor다(CLAUDE.md Flow).
원장 = .garagiste/ledger/evidence.jsonl(한 줄 = JSON 하나). 표는 파일로 쓰지 말고 대화에 마크다운으로 낸다.

0. 멈춤
   - 아직 돌고 있으면 지금 단계만 끝내고 새 seed·spawn은 하지 않는다.

1. try 카드 — 표보다 먼저
   - docs/STATUS.md 「써볼 것」의 카드를 전부 CEO에게 하나씩 낸다. 위임 없음: tried는 전부 CEO다.
   - CEO가 「<slug> ok」 또는 「<slug> fail + 한 줄」로 답하면 work.mjs tried <slug> ok|fail "<메모>".
   - 열린 질문(docs/DECISIONS.md 「정해 주세요」)이 있으면 그다음에 예/아니오로 묻고 decide.
   - try 카드가 저장소 안에 파일을 만들었으면 지우거나 옮기지 말고 CEO에게 그 경로를 말한다.
   - 카드와 질문이 끝난 뒤에 표를 만든다. 카드가 끝나도 새 unit은 seed하지 않는다 — 그날은 여기까지다.

2. 경계 (원장 ts로)
   - 첫 ship: 오늘 무인 하루의 첫 "kind":"ship" 줄.
   - 아침 창 끝: 첫 ship 이전의 마지막 CEO 접점 줄("kind"이 decide·scope·tried) ts.
   - 저녁 창 시작: 아침 창 끝 뒤 첫 "kind":"tried" 줄 ts(CEO가 돌아와 처음 try한 때).
   - 낮 = 아침 창 끝 → 저녁 창 시작. 저녁 창 시작 뒤에 seed되거나 출하된 unit은 「연장(유인)」.

3. 표 머리 (한 줄씩)
   - 아침 창 끝 ts · 저녁 창 시작 ts · 무인 분(그 사이) · 낮 경과(아침 창 끝 → 낮의 세 번째 ship, 분)
   - 낮 접점: 낮 안의 decide·tried·scope 줄 수(목표 0) + 낮 안에 docs/BRIEF.md에 생긴
     「## YYYY-MM-DD HH:MM」 절 수. 0이 아니면 그 줄들을 그대로 나열.
   - 멈춤: 낮의 마지막 원장 줄 ts와 이유 — 여섯 중 하나(hard 질문 · 미검수 3 · 무인 출하 5 ·
     spike 허용 밖 · 프레임워크 FAIL · SCOPE DONE).
   - 규칙집 드리프트: git log --oneline --since="<아침 창 끝 ts>" -- .garagiste 의 출력
     (없어야 한다 — 있으면 그 커밋을 그대로, 수리 반영이면 「수리 반영」). 그리고 git rev-parse HEAD:.garagiste 값.

4. unit 표 — 낮과 연장의 unit 전부(출하 안 된 것도 한 행), 첫 열에 「무인」·「연장(유인)」
   | 구간 | unit | 구성 | 시도 | seed→ship 원시(분) | spawn 의도/완료 | 토큰 | attack | redproof | tried | green 후 CEO 발견 결함 | 프레임워크 FAIL | RESPEC | needs 수정 |
   마지막에 「계」 행.

   열 정의:
   - 구성: ① 순수 로직(기계 수용) · ② 인수에 실제 기동 스모크 포함 · ①+② · ③ boundary HIT(spike 경로 —
     seed 때가 아니라 ship 때 diff로 밟았으면 그렇게 적는다).
   - 시도: 그 slug의 "kind":"unit" 줄 수.
   - seed→ship 원시: 그 slug의 마지막 "kind":"unit" 줄 ts → "kind":"ship" 줄 ts, 분 소수 1자리.
     아무것도 빼지 않는다. seed 뒤 팩 없이 기다린 구간이 있으면 괄호로 적는다. 출하 전이면 「미출하 — <멈춘 단계>」.
   - spawn 의도/완료: 의도 = "kind":"pack" 줄(slug 일치, unit 줄 이후) 수. 완료 = "kind":"spawn_stop" 줄 수 —
     이 줄엔 slug가 없으니 바로 앞의 같은 pack 값 "kind":"pack" 줄의 slug로 센다(병렬이면 어긋날 수 있다 — 표시).
   - 토큰: "kind":"spawn" 줄의 tokens 합(기록 안 한 spawn은 「미기록 n」).
   - attack · redproof: docs/LEDGER.md의 그 unit 행 칸 그대로(원장 attack 줄의 red/total은 쓰지 않는다).
   - tried: "kind":"tried" 줄의 result + (CEO).
   - green 후 CEO 발견 결함: tried fail 수 + 메모 한 줄(없으면 0).
   - 프레임워크 FAIL: 안내대로 해도 풀리지 않아 멈춘 FAIL 줄 수. 안내대로 한 번에 풀린 FAIL은 세지 않는다.
   - RESPEC: "kind":"respec" 줄 수(slug 일치). needs 수정: "kind":"needs" 줄 수(slug 일치).

5. 표 아래
   - 카드: 낸 카드 수 · ok · fail
   - CEO-분: 아침 창 「(CEO 기입)」 · 저녁 창 「(CEO 기입)」
   - 팀이 정한 것: .garagiste/units/*.json의 defaults 중 at이 아침 창 끝 뒤인 것 — 수와 그 줄들(slug: 내용)
   - 프레임워크 FAIL 전문: 멈춘 줄 그대로(없으면 「없음」)
   - 참고: 낮 동안 에이전트가 한 일 중 규칙 밖으로 보인 것(없으면 「없음」) — 판단하지 말고 사실만.
```
