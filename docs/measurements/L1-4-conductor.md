# L1 4차 — conductor에게 준 말 (기록)

시험의 조건은 conductor가 받은 말이다. 표를 다시 읽을 사람을 위해 그대로 남긴다(2026-10-01, 시험대 G2_TEST5).

## 1. 개시 — CEO의 규칙 다섯 (첫 세션)
1. `node .garagiste/scripts/work.mjs brief --file C:\Users\woql1\Workspace\G2_TEST5\docs\BRIEF-draft.md` (2차와 같은 원문)
2. 이후 CLAUDE.md Flow 그대로: intake → 열린 Q 예/아니오 → `scope --milestone M1` → 서명 「가」부터 시계(원장 ts). unit 구성은 2차와 동일: ① 순수 로직 · ② 실기동 스모크 수용 포함 · ③ 경계 키워드 없으면 「구성 불가」로 기록.
3. try 위임 3규칙: 기계 판정 가능 카드만 위임 실행(표에 위임 표시), human@ 주장은 반드시 CEO, 표시 없는 위임 금지.
4. 프레임워크 FAIL이 나오면 그 줄 그대로 CEO에게 — 임의 우회·수리 금지. (예측: 0건)
5. 3 unit 출하 후 원장에서 2차와 같은 양식으로 표 산출.

## 2. 지시서 — 이전 양식을 모르는 conductor용 (정비 채널 작성, 개시 뒤 교체)
예측값은 일부러 뺐다 — 재는 쪽이 목표치를 알면 표가 그쪽으로 끌린다.

```text
[L1 4차 재시험 — conductor 지시서]
시험대: G2_TEST5 · 프레임워크 동결: GARAGISTE main 33c004a · 이 세션은 conductor다(CLAUDE.md Flow).
이미 끝낸 단계는 다시 하지 않는다. 특히 brief는 두 번 치면 원문이 두 번 쌓인다.

1. 원문 (아직 안 했으면 한 번만)
   node .garagiste/scripts/work.mjs brief --file docs/BRIEF-draft.md
   (절대 경로 C:\... 를 Bash에 따옴표 없이 쓰면 역슬래시가 사라진다 — 상대 경로를 쓴다)

2. 흐름 — CLAUDE.md Flow 그대로
   - intake 팩 spawn → 열린 Q를 CEO에게 한 줄씩 예/아니오로 묻는다. 답은 CEO가 준다.
     네가 추천·기본값으로 대신 답하지 않는다. 받은 답은 work.mjs decide <n> "<답>".
   - 서명 전 확인: docs/BACKLOG.md에서 각 unit의 needs에 걸린 Q<n>과 그 질문 문장
     (docs/DECISIONS.md)을 짝지어 CEO에게 보여 준다. CEO가 어긋났다고 하면
     work.mjs needs <slug> <목록>으로 고친다(고친 횟수는 표에 적는다).
   - work.mjs scope --milestone M1 → SCOPE 줄을 CEO에게. CEO의 「가」가 서명이고,
     시계는 여기서 시작한다(원장 scope 줄 ts).
   - seed 루프. unit 구성 라벨:
     ① 순수 로직(기계 수용) · ② 인수에 실제 기동 스모크 포함 · ①+② 둘 다 ·
     ③ boundary HIT(spike 경로). 범위에 경계 키워드 unit이 없으면 ③은 「구성 불가」로
     기록한다 — unit을 만들거나 원문을 고치지 않는다.
   - decide 출력에 RESPEC <slug> 줄이 나오면 그 unit은 brief.mjs spec <slug> 재spawn부터.
     이것은 정상 경로다(프레임워크 FAIL 아님).
   - 미검수 3에서 멈추는 것은 정상 동작이다 — CEO에게 try 카드를 내고 기다린다.

3. try 위임 3규칙
   - 기계로 판정할 수 있는 카드만 네가 대신 실행할 수 있다. 표에 「위임」으로 표시한다.
   - human@ 주장이 있는 unit은 반드시 CEO가 직접 한다.
   - 표시 없는 위임은 금지.

4. FAIL
   - 스크립트 출력이 FAIL이면 그 줄의 안내대로 한 번 한다(루프의 정상 단계:
     redproof, attack red>0 뒤 build 재spawn, 낡은 증거 재실행 등).
   - 안내대로 했는데 같은 FAIL이 반복되거나, 안내가 없거나 틀린 곳을 가리키면
     프레임워크 FAIL이다: 그 줄 전문을 그대로 CEO에게 넘기고 멈춘다.
     임의 우회·수리·스크립트 편집은 금지.

5. 끝 — 출하가 3개(boot 포함)가 되면 다음 seed를 하지 말고 아래 표를 낸다.
   원장 = .garagiste/ledger/evidence.jsonl(한 줄 = JSON 하나). 파일로 쓰지 말고 대화에
   마크다운으로 출력한다 — CEO가 정비 채널로 옮긴다.

   머리 줄: 서명 ts(scope 줄) · 세 번째 ship ts · 총 경과 분

   | unit | 구성 | 시도 | seed→ship 원시(분) | spawn 의도/완료 | 토큰 | CEO-분 | attack | redproof | tried | green 후 CEO 발견 결함 | 프레임워크 FAIL | RESPEC |
   마지막에 「계」 행.

   열 정의:
   - 구성: 위 ①/②/①+②/③ 라벨, boot은 scaffold.
   - 시도: 그 slug의 "kind":"unit" 줄 수.
   - seed→ship 원시: 그 slug의 마지막 "kind":"unit" 줄 ts → "kind":"ship" 줄 ts,
     분 소수 1자리. 아무것도 빼지 않는다. CEO를 기다린 구간이 있었으면 괄호에
     「대기 x분」만 덧붙인다.
   - spawn 의도/완료: 의도 = "kind":"pack" 줄(slug 일치, unit 줄 이후) 수.
     완료 = "kind":"spawn_stop" 줄 수 — 이 줄엔 slug가 없으니, 그 줄 바로 앞에 있는
     같은 pack 값의 "kind":"pack" 줄의 slug로 셈한다.
   - 토큰: "kind":"spawn" 줄(work.mjs spawned)의 tokens 합.
     기록 안 한 spawn이 있으면 「미기록 n」.
   - CEO-분: 「(CEO 기입)」으로 비운다.
   - attack · redproof: docs/LEDGER.md의 그 unit 행의 칸을 그대로 옮긴다
     (attack = 선발견→최종 red/총). 원장 "kind":"attack" 줄의 red/total은 실행 한 번의
     스냅숏이라 쓰지 않는다. boot은 —.
   - tried: "kind":"tried" 줄의 result + 「(위임)」 또는 「(CEO)」.
   - green 후 CEO 발견 결함: tried fail 수 + 그 메모 한 줄(없으면 0).
   - 프레임워크 FAIL: 4번 규칙으로 CEO에게 넘긴 FAIL 줄 수.
     안내대로 한 번에 풀린 FAIL은 세지 않는다.
   - RESPEC: "kind":"respec" 줄 수(slug 일치).

   표 아래 줄:
   - 측정만(판정 제외): boot과 그 밖에 출하된 unit — slug · 분 · spawn · tried
   - ③: 구성 불가면 사유 한 줄. ship 단계에서 diff로 spike 경로를 밟은 unit이 있으면 그 사실.
   - CEO 접점: decide 줄 수 · 서명 1 · tried 줄 수(그중 위임 n) · FAIL 넘김 수
   - needs 수정: "kind":"needs" 줄 수와 각 줄의 slug from→to (없으면 0)
   - 판정선 대조(사실만 ✓/✗): 각 판정 unit seed→ship ≤75분 · spawn 의도 ≤8 ·
     미검수 최대치 ≤3 (원장에서 ship 뒤 tried 전인 unit 수의 최대값)
   - 프레임워크 FAIL 전문: 넘긴 줄 그대로 나열(없으면 「없음」)
```

## 3. 시험 중 수리 반영 뒤 conductor에게 준 말
- 사고 24(5c22aaa): 「사고 24 수리가 반영됐다. 메인 루트에서 `node .garagiste/scripts/redproof.mjs time-model`을 쳐라. `RED` 줄이 나오면 Flow대로 `brief.mjs build time-model` → build spawn(Q10 수용 테스트와 attack red 1을 함께 green으로). 이 FAIL은 표의 프레임워크 FAIL 1로 세고, 넘긴 때부터 재개까지를 time-model의 대기로 적는다. 시도는 1 그대로.」
- 사고 25(722043d): 「사고 25 수리가 반영됐다(pack_kb_max 24 — CEO 결정). `brief.mjs build time-model`을 다시 쳐라. PACK이 나오면 build spawn. 이 FAIL은 표의 프레임워크 FAIL 2로 세고, 넘긴 때부터 재개까지를 time-model의 대기로 적는다. 시도는 1 그대로.」
