# 필드 벤치 — 범용성 시뮬레이션을 다시 돌리는 법

2026-10-01 필드 시험 1·2(`archive/FIELD-TRIAL.md`)를 같은 입력으로 반복해 프레임워크 판(sha)끼리 비교한다. 클라우드 세션(Claude Code on the web) 컨테이너에서 정비 채널이 CEO를 대리하고, conductor는 중첩 헤드리스 Claude Code다. 도구: `tests/field/`.

## 두 모드
- **측정 모드(기본 — 벤치)**: 프레임워크는 시작 sha에 고정. 프레임워크 FAIL(안내대로 해도 같은 FAIL · 안내 없음 · 실행 불가)이면 그 줄 전문을 남기고 **그 필드는 거기서 끝**. 점수는 도달한 곳. 판끼리 비교는 이 모드로만 한다.
- **정비 모드(2026-10-01 판)**: FAIL이면 정본 수리(재현 테스트 · HAZARDS · CHANGELOG) → `deliver.sh`로 필드 반영 → conductor에게 「정비 반영」을 말하고 잇는다. 결함을 찾는 모드라 판끼리 비교하지 않는다.
- 위 둘과 따로 **단위**를 고른다 — L1 모드(한 conductor 세션이 범위 끝까지 — 아래 「절차」)와 L2 모드(무인 하루를 날마다 새 세션으로 — 아래 「L2 모드」).

## 고정 입력 — 바꾸면 다른 벤치다
- 원문: `tests/field/briefs/ledger-cli.md`(파이썬 CLI) · `tests/field/briefs/web-memo.md`(Node 웹 앱). 설치 `-Budget medium`.
- 첫 말(두 필드 같음):
  > 이 저장소는 GARAGISTE 필드 시험이다(정비 채널이 CEO를 대리한다). docs/BRIEF-draft.md로 brief를 축적하고 개발해. intake가 질문을 올리면 나에게 한 줄씩 예/아니오로 물어라 — 대신 답하지 않는다. 이 세션은 헤드리스라 백그라운드 알림을 받을 수 없으니, 서브에이전트(Agent)는 run_in_background 없이 끝날 때까지 기다려라.
- 둘째 말(답 + 서명 + 루프 규칙): `Q1 예. Q2 예 …` 뒤에 그대로 —
  > 남은 질문이 있으면 이어서 물어라. 다 끝나면 범위는 M1 전부 — 가. 이제 Flow 4 루프를 돌려라(unit은 한 번에 하나). 미검수 3이 되면 멈추고 try 카드를 나에게 내라. FAIL 줄이 안내대로 해도 풀리지 않거나 안내가 실행 불가면 그 줄 전문을 그대로 나에게 넘기고 멈춰라 — 우회·스크립트 편집 금지. 매 spawn 뒤 work.mjs spawned를 남겨라.

## 홀드아웃 — 범용성은 수리에 쓰지 않은 원문으로만 잰다
필드 1·2는 사고 27~47을 낳은 원문이라 그 점수는 **회귀**(수리가 유지되는가)다 — 같은 원문으로 다시 재면 FAIL 0이 나와도 처음 보는 프로젝트에 대한 증거가 아니다(2026-10-01 측정 486fd74의 「과적합」). 그래서:
- **홀드아웃 원문** 하나를 따로 둔다 — 지금: **`tests/field/briefs/holdout-futsal.md`**(동네 풋살 리그 운영 — Node 웹 + 데이터 파일 · L2 규모 · 2026-10-02 CEO 서명 — L2 3판 등록과 함께 PR #95) — L2 3판(`archive/L2-TRIAL-3.md`)의 원문이라 그 리눅스 첫 측정이 범용성 점수다. **리눅스 첫 측정(2026-10-02, d069127 — 범용성 점수): 처음 3일 프레임워크 FAIL 정지 0 · green 후 결함 0 · 낮 접점 0 · 출하 5/14(2·3일은 spec의 저장 꼴 질문 — hard 질문 정지로 한 출하씩)** · 7일 전체 출하 11 · 결함 0 · Q6·Q7 통과(약함 — CEO 재판정 2026-10-03, 기록 `archive/L2-TRIAL-3.md`). 시험 중 수리가 없어 아직 소진 전 — 윈도우 3일(같은 원문의 윈도우 첫 측정) 뒤 표 이후 수리가 들어가면 소진. 둘째 홀드아웃 `tests/field/briefs/holdout-library.md`(작은 도서관 대출 관리 — Python 웹 + 데이터 파일 · L2 규모 · 2026-10-02 서명 4c42611)는 첫 측정(9be0e15 — 6일차 프레임워크 FAIL 정지 · 출하 10/19 · green 후 결함 0, 아래 기록) 뒤 사고 58·59 수리로 **소진 → 필드 4(회귀 · L2 모드)**. 첫 홀드아웃 `tests/field/briefs/holdout-dupfind.md`(Go CLI)는 2026-10-01 첫 측정(intake 정지) 뒤 사고 49~56 수리로 **소진 → 필드 3(회귀)**. brownfield(기존 코드가 있는 저장소에 기능 하나 — 필드 1~3이 모두 빈 폴더에서 시작한다)는 L3(Q13) 홀드아웃으로 미룬다. 원문은 첫 측정 전에 고정하고 결과를 본 뒤 고치지 않는다.
- **측정 모드로만** 돈다(정비 모드 금지 — 멈춘 자리에서 고치며 이어 가면 그 원문은 훈련 데이터가 된다). 첫 말·둘째 말·대리 규칙은 필드 1·2와 같다(L2 규모 원문은 L2 모드의 것 — 아래).
- 홀드아웃이 낸 결함은 사고로 수리한다 — 그 수리가 들어간 순간 그 원문은 **소진**: 필드 3(회귀)으로 옮기고, 다음 측정 전에 새 홀드아웃(다른 생태계·모양 — 예: 기존 코드가 있는 저장소에 기능 하나)을 쓴다. 홀드아웃의 첫 측정 줄만이 범용성의 점수다.
- **holdout-library의 첫 측정**은 L2 모드로 잰다(아래 「L2 모드」 절의 고정 말·창 규칙 그대로 — 2026-10-02 고정). 서명 때 CEO에게 밝힌 대리 재량(첫 측정 전 고정): 원문의 빈칸(늦은 날수에 휴관일을 세나 · 정지일을 더하나 · 연체·예약 중에도 연장되나 같은 것)에 미리 답을 정해 두지 않는다 — 정해 두면 원문을 몰래 고친 셈이라 창에서 규칙 1~5로만 · try는 실 Chromium으로 화면을 누르고 데이터 파일 하나를 try마다 이어 쓴다(원문의 「새 버전으로 바꿔도 쓰던 데이터 파일을 그대로 연다」) · 대리가 띄운 서버는 대리가 끈다(070f185 웹의 포트 3000 잔여물) · 엑셀이 컨테이너에 없어 CSV는 바이트로 판단 · 윈도우는 원문 요구로만 남는다(벤치는 컨테이너 — 윈도우 측정은 CEO가 원할 때, 그 PC에 Python 3). 비용 예상 한 회 ≈ $30(높게 — todo 리눅스 L2 M1 8 unit · 911K 토큰의 1.5배 남짓에 여유).

## CEO 대리 규칙 — 대리의 재량이 점수를 흔들지 않게
1. intake 질문: 원문과 어긋나지 않으면 「예」. 이 기계의 사실이 필요하면 사실을 붙여 「예」(브라우저: `Chromium이 /opt/pw-browsers에 있다(PLAYWRIGHT_BROWSERS_PATH 설정됨, 다운로드하지 않는다)`).
2. try 카드: 카드대로 실제로 친다 — **try 사본이 있는 판(2026-10-01 이후)은 `work.mjs try <slug>`의 사본에서**, 그 전 판은 메인 루트에서(CLI는 임시 폴더, 웹은 실제 Chromium — 저장소 밖에 `npm i playwright-core@1.56.1`로 운전) + 원문의 경계 입력 2~3개. 답은 `<slug> ok — 「한 줄」` 또는 `fail — 「한 줄」`. try 산출물은 미리 치우지 않는다(실제 CEO처럼). ship이 「CEO가 치운다」로 막으면 그때 치우고 「치웠다」고 말한다 — 프레임워크 FAIL이 아니라 CEO 접점 1로 센다(try 사본 장치가 들어오면 0이 되어야 한다).
3. 팀이 올린 결정: 「이미 충족」은 원문에 비춰 맞으면 「예 — 닫아라」. 원문 밖 보안 지적(공격이 짚은 것)은 「고쳐라」(버그 unit 하나). 팀이 정한 기본값은 그대로 둔다.
4. 매 말은 `turn.sh`가 `<폴더>-turn<n>.msg`로 남긴다 — 그 기록이 대리의 재량이 어디 들어갔는지의 증거다.
5. conductor가 질문 문장을 빠뜨리면(「위 질문」만) 그것을 지적하고 다시 묻게 한다 — 대신 짐작해 답하지 않는다.

## 절차 (정비 채널 세션에서)
```bash
B=/tmp/bench-$(date +%m%d-%H%M); mkdir -p $B          # 컨테이너 밖에 남지 않는다 — 결과는 FIELD-BENCH-LOG.md에 적고 푸시
tests/field/setup.sh tests/field/briefs/ledger-cli.md $B/field1
tests/field/setup.sh tests/field/briefs/web-memo.md  $B/field2
tests/field/setup.sh tests/field/briefs/holdout-dupfind.md $B/field3   # 필드 3(소진된 홀드아웃 — Go, 회귀)
tests/field/setup.sh tests/field/briefs/holdout-library.md $B/field4  # 필드 4(소진된 홀드아웃 — Python 웹, 회귀 · L2 규모라 L2 모드로)
tests/field/turn.sh $B/field1 1 "<첫 말>"             # 출력의 session id를 적어 둔다
tests/field/turn.sh $B/field1 2 "<둘째 말>" <sid>      # 이후 매 턴 --resume
tests/field/watch.sh $B/field1:2 $B/field2:2          # Monitor로 걸면 ship·턴 끝마다 알림
node tests/field/table.mjs $B/field1                   # 표 + BENCH 한 줄
node tests/field/day.mjs $B/field1 --since <그날 세션을 연 ISO 시각> [--until <다음 날 --since>]   # L2 하루 표 + DAY 한 줄(L2-day-conductor 「저녁」 2~5 그대로 + 답 대기 뺀 seed→ship)
node tests/field/stream.mjs run $B/field1 day4 --plan <plan.json>   # Q6(L2-TRIAL-3 4일): 스트림 입력 세션 하나 — 창의 말은 say(.in), 등록문의 네 말은 plan이 원장 시점에 · end로 닫고 report가 컴파일·무관 unit
```
- 두 필드는 서로 독립이라 동시에 돌려도 된다(턴은 백그라운드로).
- 하네스 함정(프레임워크 결함 아님): 부모 세션의 `CLAUDE_*` 환경 누수 → `turn.sh`가 걷어 낸다 · 신뢰 안 된 작업 공간은 허용 목록 무시 → `setup.sh`가 신뢰를 켠다 · 필드 사본에서 `git worktree repair`를 치지 않는다(원본 링크를 빼앗는다 — 2026-10-01 정비 채널 실수).

## 점수 — 필드마다 한 줄
`BENCH` 줄(table.mjs) + 대리가 세는 셋: **프레임워크 FAIL 정지 수**(측정 모드에선 0 아니면 1 — 멈춘 단계와 줄) · **green 후 CEO 발견 결함**(tried fail) · **conductor 규율 이탈**(우회·스크립트 편집·CEO 파일 손댐·질문 누락). 비용은 마지막 턴 json의 `total_cost_usd`(세션 누적). **비용 예상은 높게 잡는다 — 한 회(세 필드) ≈ $30, 한 필드만이면 ≈ $10**(CEO 2026-10-02: 실측 621a426 $12.41 · 070f185 $15.65 — 웹 한 필드가 정비·재시도로 두 배가 되는 회차가 있다).

## L2 모드 — 무인 하루를 날마다 (2026-10-02)
위 절차(한 conductor 세션이 범위 끝까지 — L1 모드)와 달리 하루를 단위로 돈다. L2 2판 리눅스(대리 CEO · 압축 낮 — `archive/L2-TRIAL-2.md` 「2판 수정」)를 벤치로 고정한 것이다. 측정·정비 모드와는 따로 고른다(기본 L2 측정). **L2는 L1을 포함한다** — 하루 안의 unit 루프가 L1 그대로라 L1 수치도 같은 표에서 읽는다(예외: 순정 A/B · 3-unit 구성은 L1에서만).
- **하루 = 새 conductor 세션 하나**(`turn.sh`의 새 세션 — `--resume`은 그날 안에서만): 아침 창 → 낮(conductor 혼자) → 저녁 창. 낮은 실제로 비우지 않는다(압축) — 무인 분은 점수가 아니고, 낮 경과·seed→ship은 원장 ts 그대로.
- **「하루」는 라운드다(CEO 2026-10-03)**: CEO 창 하나에서 다음 창까지 · 라운드마다 새 세션. 날짜·벽시계 기간은 측정 단위가 아니다 — 라운드는 연달아 돌린다. 시간이 진짜 닿는 것(제품의 시계 의존)은 날을 기다리지 않고 시계를 옮겨 잰다(`L2-TRIAL-5.md` 시계 검사 — 도구 `tests/field/clock.mjs`).
- **지시서는 그 회의 sha로**: conductor가 읽는 `L2-day-conductor.md`는 회를 시작한 프레임워크의 전체 sha(GitHub에 푸시된 것 — 컨테이너의 빈 저장소에서 sha fetch 확인 2026-10-02)에서 — main이 움직여도 회 안의 날들은 같은 지시서다. 대리는 날마다 첫 말을 보내기 직전의 `date -u +%FT%TZ`를 적어 둔다(표의 `--since`).
- **고정 말** (`<sha>` = 그 회의 전체 sha):
  - 1일차 첫 말:
    > 오늘은 L2 무인 하루다(GARAGISTE 필드 시험 — 정비 채널이 CEO를 대리한다). `git fetch https://github.com/jaewhi-park/GARAGISTE <sha>` 뒤 `git show FETCH_HEAD:docs/measurements/L2-day-conductor.md`를 읽어라. 「아침」 절이 오늘의 규칙이다. 내가 돌아와 「저녁」이라고 하면 「저녁」 절대로 한다. docs/BRIEF-draft.md로 brief를 축적하고 intake를 돌려라. 질문은 한 줄씩 예/아니오로 — 대신 답하지 않는다. 이 세션은 헤드리스라 백그라운드 알림을 받을 수 없으니, 서브에이전트(Agent)는 run_in_background 없이 끝날 때까지 기다려라.
  - 1일차 둘째 말: `Q1 예. …` 뒤 그대로 — `남은 질문이 있으면 이어서 물어라. 다 끝나면 범위는 M1 전부 — 가. 매 spawn 뒤 work.mjs spawned를 남겨라.`
  - n일차 첫 말: 1일차 첫 말에서 brief·intake 두 문장을 빼고 끝에 `상태 보여줘.` · n일차 둘째 말: 열린 질문의 답(있으면) 뒤 `가. 매 spawn 뒤 work.mjs spawned를 남겨라.`
  - 저녁 말: `저녁` — 그 뒤 카드마다 대리 규칙 2, 열린 질문은 대리 규칙 3. conductor가 표를 내면 그날 끝.
- **대리 CEO는 창에서만 말한다**(대리 규칙 1~5 그대로 + 이것): 「가」와 「저녁」 사이엔 어떤 말도 보내지 않는다(낮 접점 0). conductor가 낮에 멈추거나 여섯 멈춤 밖에서 턴을 끝내도 그것이 그날의 끝이다 — 다음 말은 「저녁」이고, 여섯 밖이면 규율 이탈로 센다. 낮에 올라온 질문은 저녁 창에서 답한다.
- **표**: 저녁 창이 끝나면 대리가 `node tests/field/day.mjs <폴더> --since <그날 첫 말을 보낸 ISO 시각>`(지난 날은 `--until <다음 날 --since>`) — DAY 줄과 표를 `FIELD-BENCH-LOG.md`의 L2 결과 원장과 기록 절에 적는다. conductor가 대화에 낸 표는 대조용(다르면 둘 다 적는다). 판단이 드는 칸(구성 ①/② · 프레임워크 FAIL · 멈춤 이유 · 참고)은 conductor의 줄과 대리의 관찰로 채운다.
- **회의 길이**: 범위(M1)가 SCOPE DONE이 될 때까지 날을 잇는다. 측정 모드에서 프레임워크 FAIL로 그날이 멈추면 그 회는 거기서 끝. 하루는 대개 미검수 3에서 멈추니 M1이 n unit이면 약 n/3일.
- **판정(날마다)**: 낮 접점 0 · 미검수 3 또는 SCOPE DONE으로 정상 정지 · 프레임워크 FAIL 0 · try 산출물로 막힌 ship 0 · green 후 CEO 발견 결함 0 · conductor 규율 이탈 0. **L2 게이트** = 처음 3일 누적 green 후 결함 0(등록문과 같다). **L1 수치(같은 표)** = unit마다 답 대기 뺀 seed→ship ≤75분 · spawn 의도 ≤8 · 미검수 ≤3.
- **비용**: 날마다 그 세션의 마지막 턴 json의 `total_cost_usd`를 더한다. 예상(높게) — `l2-todo-cli` 한 회 ≈ $15(2판 리눅스 911K 토큰) · `holdout-library` 한 회 ≈ $30.

## 결과
벤치·L2 회의 결과 원장과 회차 기록은 `FIELD-BENCH-LOG.md`에 — 한 회마다 한 행(+ 기록 절). 이 문서는 규칙만 든다. 끝난 시험의 등록·표는 `archive/`.
