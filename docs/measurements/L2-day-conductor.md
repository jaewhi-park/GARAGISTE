# L2 무인 하루 — conductor 지시서 (아침·저녁·부재)

시험의 조건은 conductor가 받은 말이다. 붙여 넣지 않고 conductor가 이 파일을 읽는다.

## CEO가 하는 말 (세션을 열고 한 줄)
> 오늘은 L2 무인 하루다. `git fetch https://github.com/jaewhi-park/GARAGISTE main` 뒤 `git show FETCH_HEAD:docs/measurements/L2-day-conductor.md`를 읽어라. 「아침」 절이 오늘의 규칙이다. 내가 돌아와 「저녁」이라고 하면 「저녁」 절대로 한다.

그 뒤는 자연어 그대로 — 「상태 보여줘」 → (질문에 답) → 「가」 → 자리를 뜬다.

## 아침 — 낮 규칙
```text
[L2 무인 하루 — 낮 규칙]
- 오늘은 L2 무인 하루다. CEO는 「가」 뒤 자리를 뜬다(대개 밤새). CEO가 돌아와 「저녁」이라고 할 때까지 CEO 접점은 없다.
- 루프는 CLAUDE.md Flow 4 그대로 — node .garagiste/scripts/next.mjs가 낸 한 줄만 따른다(run이면 그 명령 · spawn이면 그 팩 · ceo|wait|done이면 멈추고 그 줄을 남긴다).
  unit은 한 번에 하나(next가 센다): seed → … → ship이 끝나야 다음 seed. 예외는 진행 중 unit이 CEO 질문(열린 Q)에 걸려 멈춘 때뿐이다.
- 멈춤은 여섯뿐: hard 질문(그 unit만) · 미검수 3 · 무인 출하 5 · spike 허용 밖 · 프레임워크 FAIL · SCOPE DONE.
  미검수는 사람 센서가 필요한 unit만 센다(@sensor human 또는 공격 선발견 0) — 기계가 증명한 unit은 STATUS 「써볼 것」에 「기계 증명」으로 보이고 세지 않는다.
  미검수 3이면 새 seed도 하지 않는다(next가 ceo를 낸다).
  범위가 끝나면 next가 이음새 공격(work.mjs system → attack 팩 → 발견이면 build → ship · 발견 0이면 drop)과 출하 보고(state.mjs report)를 먼저 내고 그 뒤가 SCOPE DONE이다 — 둘은 낮의 일이다(CEO 접점이 아니다).
- 프레임워크 FAIL(안내대로 해도 같은 FAIL이 반복되거나, 안내가 없거나 실행할 수 없는 FAIL)이면
  그 줄 전문을 남기고 그날 루프를 멈춘다 — 돌던 unit도 새 spawn 없이 멈춘다. 우회·수리·스크립트 편집 금지.
  FAIL 줄은 원장에 남고 되풀이되면 STATUS 첫 줄 「반복 FAIL n」·「막힌 것」 절에 뜬다 — 그 절이 정비 채널로 가는 줄이다(멈출 때 함께 남긴다).
- 안내 끝에 `work.mjs ask <slug> … --hold`가 있는 FAIL(CEO 결정만 요구하는 것 — 두 번째 spec 반려 · 팩 상한의 2배 초과 · 이미 충족 — 2배 안의 팩 FAIL은 질문이 아니다: 그 줄대로 `--large "<이유>"`)은
  hard 질문이다: 그 줄대로 올리고 그 unit만 세운 채 다음 seed — 그날을 멈추지 않는다.
- try 위임 없음: tried는 CEO가 돌아와서 한다(낮의 tried는 원장에 CEO 접점으로 찍힌다).
- 낮에 CEO의 말이 오면 CLAUDE.md 7(인터럽트)대로 그 자리에서 객체로 — 그 말이 닿지 않는 unit은 멈추지 않는다.
- CEO가 만든 파일과 저장소 밖 파일은 옮기거나 지우지 않는다 — 그 때문에 막히면 경로를 남기고 멈춘다.
- 메모리 파일에 쓰지 않는다 — 상태의 정본은 원장(.garagiste/ledger)과 docs/STATUS.md다.
- 멈출 때 마지막 출력 한 줄: 멈춘 시각 · 이유(여섯 중 하나) · CEO가 돌아와 할 일.
```

## 저녁 — CEO가 「저녁」이라고 하면
```text
[L2 무인 하루 — 저녁 지시서]
원장 = .garagiste/ledger/evidence.jsonl(한 줄 = JSON 하나). 표는 파일로 쓰지 말고 대화에 마크다운으로 낸다.

0. 멈춤
   - 아직 돌고 있으면 지금 단계만 끝내고 새 seed·spawn은 하지 않는다.

1. try 카드 — 표보다 먼저
   - docs/STATUS.md 「써볼 것」의 카드를 전부 CEO에게 하나씩 낸다. 카드마다 먼저 node .garagiste/scripts/work.mjs try <slug>를
     돌려 그 사본 폴더(.worktrees/try-<slug>)를 함께 준다 — CEO는 그 폴더에서 카드를 친다(main은 깨끗하게 남는다). 위임 없음: tried는 전부 CEO다.
     「기계 증명」 표시가 있는 카드도 낸다(이 시험은 사람 센서를 전부 건다). 「써볼 것」은 셋까지만 보이니 tried마다 node .garagiste/scripts/state.mjs로 STATUS를 다시 내 빌 때까지 잇는다.
   - CEO가 「<slug> ok」 또는 「<slug> fail + 한 줄」로 답하면 work.mjs tried <slug> ok|fail "<CEO 말 그대로>"
     (fail엔 말이 필수 — 그 말이 <slug>-fix의 재현이다. 사본은 tried가 지운다).
   - 열린 질문(docs/DECISIONS.md 「정해 주세요」)이 있으면 그다음에 예/아니오로 묻고 decide. decide가 KEPT를 내면(가정이 적힌 질문의 「예」) 그 unit은 그대로다 — spec 재spawn 없음(next가 센다).
   - 범위가 끝난 라운드면 docs/REPORT.md(출하 보고)를 CEO에게 한 번 보인다 — 손편집 없음.
   - 사본 밖(메인 루트·저장소 밖)에 파일이 생겼으면 지우거나 옮기지 말고 CEO에게 그 경로를 말한다.
   - 카드와 질문이 끝난 뒤에 표를 만든다. 카드가 끝나도 새 unit은 seed하지 않는다 — 그날은 여기까지다.

2. 경계 (원장 ts로)
   - 첫 ship: 오늘 무인 하루의 첫 "kind":"ship" 줄.
   - 아침 창 끝: 첫 ship 이전의 마지막 CEO 접점 줄("kind"이 decide·scope·tried) ts — 이 라운드(이 세션의 첫 말) 뒤의 줄만. 아침에 접점 줄이 없으면(「상태 보여줘」·「가」만) 첫 말의 때가 아침 창 끝이다(5판 리눅스 2라운드: 앞 라운드 저녁의 tried를 잡아 무인 84.6분이 나왔다 — 실제 31분).
   - 저녁 창 시작: 아침 창 끝 뒤 첫 "kind":"try"(사본 열기 — 5판 원장 줄) 또는 "kind":"tried" 줄 ts(CEO가 돌아와 처음 try한 때).
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
   - CEO-분: 적지 않는다 — 기계 셈(정비 채널의 tests/field/day.mjs · 정의는 L2-TRIAL-5 「CEO-분」: 창의 벽시계 · 말 수 · 대기 · 카드 시간 try→tried)
   - 팀이 정한 것: .garagiste/units/*.json의 defaults 중 at이 아침 창 끝 뒤인 것 — 수와 그 줄들(slug: 내용)
   - 프레임워크 FAIL 전문: 멈춘 줄 그대로(없으면 「없음」) · 막힌 것: docs/STATUS.md 「막힌 것」 절 그대로(없으면 「없음」)
   - 참고: 낮 동안 에이전트가 한 일 중 규칙 밖으로 보인 것(없으면 「없음」) — 판단하지 말고 사실만.
```

## 부재 — 첫 말이 「부재 n일차」인 세션
CEO가 며칠 없다. 이 세션엔 아침·저녁 창이 없고, 첫 말 뒤로 CEO의 말은 오지 않는다.
```text
[부재 n일차]
- CEO는 없다 — 질문의 답도 try도 CEO가 돌아온 뒤다. 기다리지 않는다.
- node .garagiste/scripts/state.mjs로 상태를 본 뒤, 루프와 멈춤은 「아침」 절의 낮 규칙 그대로다.
- 멈출 때 마지막 출력 한 줄: 멈춘 시각 · 이유(여섯 중 하나) · docs/STATUS.md 첫 줄 그대로 · CEO가 돌아와 할 일.
```

## 1일차 판과의 차이 (2026-10-01 정정)
- 경계: 1일차 판은 「아침 창 끝 = 첫 unit 직전의 마지막 접점」, 「저녁 창 = 마지막 ship 뒤 첫 tried」로 등록문(archive/L2-TRIAL.md)과 달랐다 — CEO 복귀 뒤 루프가 다시 돈 유인 구간까지 「낮」에 들어가 낮 접점이 8로 나왔다(등록문 정의로는 0). 지금 판은 등록문 정의이고, 복귀 뒤에 돈 unit은 「연장(유인)」으로 따로 센다.
- 아침 절(낮 규칙)을 새로 두었다 — 1일차의 관찰(병렬 seed · 예산 정지 중 seed · CEO 파일 이동 · 프레임워크 FAIL 뒤 다른 unit 계속 · 메모리 쓰기 시도)을 그날의 규칙으로 못 박는다. 등록된 Flow 4(순차)·Flow 6(멈춤 여섯)·등록문(FAIL이면 그날 멈춤)의 재진술이며 새 규칙이 아니다.

## 2판(재등록 — archive/L2-TRIAL-2.md)의 차이
- 저녁 1번: 카드마다 `work.mjs try <slug>` 사본을 먼저 열어 준다(try 산출물이 main을 더럽혀 ship을 막던 일 — 1일차 eoren.sqlite). tried fail엔 CEO 말이 필수(사고 45)이고, 그 fail로 생긴 `<slug>-fix`는 범위 맨 앞에 든다(사고 46) — 다음 아침 첫 unit이다.

## 정비 채널의 표 스크립트 (2026-10-02 — conductor 몫이 아니다)
- **conductor는 이 절을 따르지 않는다** — 표는 위 「저녁」 2~5대로 대화에 낸다. 아래 스크립트는 프로젝트 저장소에 없고, 찾거나 받아 돌리지 않는다(L2 측정 b0da849에서 conductor가 이 절을 지시로 읽고 1·2·4일차에 돌리려 했다 — 그 뒤 고친 문구).
- 정비 채널(대리 CEO)은 「저녁」 2~5의 정의를 `tests/field/day.mjs`로 원장에서 따로 계산해 대조한다(정의를 바꾸면 그 스크립트와 `tests/field.test.mjs`도 함께). 판단이 드는 칸(구성 ①/② · 프레임워크 FAIL · 멈춤 이유 · 참고)은 표 밖이다.
- 정의에 없는 것 하나를 더 낸다: **답 대기 뺀 seed→ship** — 그 unit의 질문마다 decide 줄을 사이에 둔 그 unit의 원장 공백(decide 직전 그 slug의 마지막 줄 → decide 뒤 다시 움직인 첫 줄)을 뺀다. 묻는 시각은 원장에 없어서(ask는 DECISIONS.md에만 쓴다) 이렇게 잰다. L1 수치는 이 열에서 읽는다.

## CEO 결정만 요구하는 FAIL (2026-10-02 — 사고 59)
- 홀드아웃 library 3일차: 두 번째 spec 반려가 「hard 질문 — 그 unit만」이라 했지만 열린 Q가 생기지 않아 seed가 다른 unit까지 막았고, 2·5일차는 팩 상한 FAIL을 「프레임워크 FAIL」로 읽어 그날이 멈췄다. 그런 FAIL의 안내 끝에 이제 `work.mjs ask <slug> … --hold`가 있다 — 아침 절의 그 줄(hard 질문)이 이 경우다. `--hold`의 답은 re-spec을 걸지 않는다(답의 길은 그 FAIL의 안내).

## 3판(archive/L2-TRIAL-3.md)의 차이 (2026-10-02)
- 「부재」 절(Q7 — 부재 사흘)을 새로 두었다. 규칙은 「아침」의 낮 규칙 그대로이고 새 규칙이 아니다 — 상한에서 멈추는 것도, 규칙을 바꾸지 않는 것도 지시서가 아니라 프레임워크(스크립트·게이트·가드)가 지키는지 본다.
- 「아침」에 한 줄: 낮의 CEO 말은 CLAUDE.md 7(인터럽트)대로 — 등록된 Flow 7의 재진술이다(Q6 날엔 낮에 CEO의 말이 온다, 미리 알리지 않는다).

## 5판(L2-TRIAL-5.md)의 차이 (2026-10-03 — 7건 뒤의 정본)
- 「하루」는 라운드다(CEO 2026-10-03) — 이 지시서의 「오늘·그날·저녁」은 한 라운드(아침 창 → 무인 구간 → 저녁 창)를 가리킨다. 라운드마다 새 세션, 연달아 돌려도 된다.
- 루프는 `next.mjs` 한 줄(아침 절) — Flow 4~7의 바퀴 수·순서·재개를 conductor가 정하지 않는다. attack 팩은 spec 뒤 한 바퀴, 고친 뒤엔 `verify.mjs attack`만(next가 낸다).
- 미검수 상한은 사람 센서가 필요한 unit만 센다 — 라운드가 미검수 3에서 멈추지 않을 수 있다. 그래도 멈춤은 여섯 그대로다(무인 출하 5 · SCOPE DONE이 더 자주 온다).
- 범위가 끝나면 낮에 둘이 더 돈다: 이음새 공격(`work.mjs system` → attack 팩 → 발견이면 build → ship · 발견 0이면 `drop --forget`)과 출하 보고(`state.mjs report` → docs/REPORT.md 커밋). 그 뒤 next가 `done SCOPE DONE`을 낸다 — 그때 멈춘다(저녁 창에 REPORT를 CEO에게 보인다).
- 저녁 창의 결정: 가정이 적힌 질문(「지금은 …, 예 = 그대로」)의 맨 「예」는 `decide`가 KEPT를 내고 RESPEC이 아니다 — spec 재spawn 없음. 그 밖의 답은 3판과 같다(RESPEC → next가 spec 먼저).
- 저녁 창의 카드: 「기계 증명」 표시가 있어도 친다(이 시험은 사람 센서를 전부 건다). 「써볼 것」은 셋까지만 보이니 tried마다 `state.mjs`로 STATUS를 다시 내 빌 때까지.
- FAIL·가드 거부는 원장 `fail`·`guard` 줄로 남는다. 같은 FAIL이 되풀이되면 STATUS 첫 줄 「반복 FAIL n」·「막힌 것」 절 — 프레임워크 FAIL로 멈출 때 그 절을 마지막 출력에 함께 남긴다(정비 채널이 읽는 자리).
- spec 팩은 저장 형식의 안쪽(키·필드)을 묻지 않고 `work.mjs default`로 정한다(「팀이 정한 것」에 뜬다 — 저녁 창에서 뒤집으려면 한 마디) · boot는 `.gitattributes`(`* text=auto eol=lf`)를 만든다 — 규칙집 드리프트가 아니다(boot의 첫 commands와 같은 자리).
- 정비 채널의 표(`tests/field/day.mjs`)는 5판 칸을 더 센다(미검수 사람 셈 · 원장 fail/guard 줄 · kept · 이음새 공격·보고) — conductor 몫이 아니다(위 「정비 채널의 표 스크립트」 절 그대로).
- CEO-분은 기계가 센다 — `work.mjs try`가 원장 `try` 줄을 남기고(카드 시간의 시작), 창의 벽시계와 말 수는 세션 기록(턴 기록·스트림·전사)에서 day.mjs가 읽는다(정의 L2-TRIAL-5 「CEO-분」). conductor는 적지 않는다. 저녁 창 시작의 정의는 「첫 try 또는 tried」(위 「저녁」 2).

## 2026-10-04 — conduct.mjs (R&D)
「아침」 절은 `node .garagiste/scripts/conduct.mjs` 한 번과 같다 — 멈춤 여섯이 종료 코드(0 SCOPE DONE · 2 ceo · 3 wait · 4 프레임워크 FAIL · 5 상한)이고, 멈출 때 STATUS를 다시 내고 마지막 줄에 CEO가 할 일을 적는다. 「저녁」은 그대로 CEO 창(카드·질문·표). conduct로 돈 라운드는 표의 「구성」에 ③(스크립트 conductor)으로 적어 모델 conductor의 판과 섞지 않는다.
