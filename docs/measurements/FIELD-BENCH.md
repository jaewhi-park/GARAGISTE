# 필드 벤치 — 범용성 시뮬레이션을 다시 돌리는 법

2026-10-01 필드 시험 1·2(`FIELD-TRIAL.md`)를 같은 입력으로 반복해 프레임워크 판(sha)끼리 비교한다. 클라우드 세션(Claude Code on the web) 컨테이너에서 정비 채널이 CEO를 대리하고, conductor는 중첩 헤드리스 Claude Code다. 도구: `tests/field/`.

## 두 모드
- **측정 모드(기본 — 벤치)**: 프레임워크는 시작 sha에 고정. 프레임워크 FAIL(안내대로 해도 같은 FAIL · 안내 없음 · 실행 불가)이면 그 줄 전문을 남기고 **그 필드는 거기서 끝**. 점수는 도달한 곳. 판끼리 비교는 이 모드로만 한다.
- **정비 모드(2026-10-01 판)**: FAIL이면 정본 수리(재현 테스트 · HAZARDS · CHANGELOG) → `deliver.sh`로 필드 반영 → conductor에게 「정비 반영」을 말하고 잇는다. 결함을 찾는 모드라 판끼리 비교하지 않는다.

## 고정 입력 — 바꾸면 다른 벤치다
- 원문: `tests/field/briefs/ledger-cli.md`(파이썬 CLI) · `tests/field/briefs/web-memo.md`(Node 웹 앱). 설치 `-Budget medium`.
- 첫 말(두 필드 같음):
  > 이 저장소는 GARAGISTE 필드 시험이다(정비 채널이 CEO를 대리한다). docs/BRIEF-draft.md로 brief를 축적하고 개발해. intake가 질문을 올리면 나에게 한 줄씩 예/아니오로 물어라 — 대신 답하지 않는다. 이 세션은 헤드리스라 백그라운드 알림을 받을 수 없으니, 서브에이전트(Agent)는 run_in_background 없이 끝날 때까지 기다려라.
- 둘째 말(답 + 서명 + 루프 규칙): `Q1 예. Q2 예 …` 뒤에 그대로 —
  > 남은 질문이 있으면 이어서 물어라. 다 끝나면 범위는 M1 전부 — 가. 이제 Flow 4 루프를 돌려라(unit은 한 번에 하나). 미검수 3이 되면 멈추고 try 카드를 나에게 내라. FAIL 줄이 안내대로 해도 풀리지 않거나 안내가 실행 불가면 그 줄 전문을 그대로 나에게 넘기고 멈춰라 — 우회·스크립트 편집 금지. 매 spawn 뒤 work.mjs spawned를 남겨라.

## 홀드아웃 — 범용성은 수리에 쓰지 않은 원문으로만 잰다
필드 1·2는 사고 27~47을 낳은 원문이라 그 점수는 **회귀**(수리가 유지되는가)다 — 같은 원문으로 다시 재면 FAIL 0이 나와도 처음 보는 프로젝트에 대한 증거가 아니다(2026-10-01 측정 486fd74의 「과적합」). 그래서:
- **홀드아웃 원문** 하나를 따로 둔다 — 지금: **`tests/field/briefs/holdout-library.md`(작은 도서관 대출 관리 — Python 실행 무의존 웹 앱 + 데이터 파일 하나 · L2 규모, M1 11~13 unit 예상) — 2026-10-02 CEO 서명, 4c42611로 고정(blob ccb99c8) · 아직 안 쟀다**. 첫 홀드아웃 `tests/field/briefs/holdout-dupfind.md`(Go CLI)는 2026-10-01 첫 측정(intake 정지) 뒤 사고 49~56 수리로 **소진 → 필드 3(회귀)**. brownfield(기존 코드가 있는 저장소에 기능 하나 — 필드 1~3이 모두 빈 폴더에서 시작한다)는 L3(Q13) 홀드아웃으로 미룬다. 원문은 첫 측정 전에 고정하고 결과를 본 뒤 고치지 않는다.
- **측정 모드로만** 돈다(정비 모드 금지 — 멈춘 자리에서 고치며 이어 가면 그 원문은 훈련 데이터가 된다). 첫 말·둘째 말·대리 규칙은 필드 1·2와 같다(L2 규모 원문은 L2 모드의 것 — 아래).
- 홀드아웃이 낸 결함은 사고로 수리한다 — 그 수리가 들어간 순간 그 원문은 **소진**: 필드 3(회귀)으로 옮기고, 다음 측정 전에 새 홀드아웃(다른 생태계·모양 — 예: 기존 코드가 있는 저장소에 기능 하나)을 쓴다. 홀드아웃의 첫 측정 줄만이 범용성의 점수다.
- **holdout-library의 첫 측정**은 L2 모드로 잰다(날마다 새 conductor 세션 · 아침/저녁 창 · 대리 CEO는 창에서만 — 이 문서의 절차가 L2로 바뀐 뒤, 그 첫 말·창 규칙도 측정 전에 여기 고정한다). 서명 때 CEO에게 밝힌 대리 재량(첫 측정 전 고정): 원문의 빈칸(늦은 날수에 휴관일을 세나 · 정지일을 더하나 · 연체·예약 중에도 연장되나 같은 것)에 미리 답을 정해 두지 않는다 — 정해 두면 원문을 몰래 고친 셈이라 창에서 규칙 1~5로만 · try는 실 Chromium으로 화면을 누르고 데이터 파일 하나를 try마다 이어 쓴다(원문의 「새 버전으로 바꿔도 쓰던 데이터 파일을 그대로 연다」) · 대리가 띄운 서버는 대리가 끈다(070f185 웹의 포트 3000 잔여물) · 엑셀이 컨테이너에 없어 CSV는 바이트로 판단 · 윈도우는 원문 요구로만 남는다(벤치는 컨테이너 — 윈도우 측정은 CEO가 원할 때, 그 PC에 Python 3). 비용 예상 한 회 ≈ $30(높게 — todo 리눅스 L2 M1 8 unit · 911K 토큰의 1.5배 남짓에 여유).

## CEO 대리 규칙 — 대리의 재량이 점수를 흔들지 않게
1. intake 질문: 원문과 어긋나지 않으면 「예」. 이 기계의 사실이 필요하면 사실을 붙여 「예」(브라우저: `Chromium이 /opt/pw-browsers에 있다(PLAYWRIGHT_BROWSERS_PATH 설정됨, 다운로드하지 않는다)`).
2. try 카드: 카드대로 실제로 친다 — **try 사본이 있는 판(2026-10-01 이후)은 `work.mjs try <slug>`의 사본에서**, 그 전 판은 메인 루트에서(CLI는 임시 폴더, 웹은 실제 Chromium — 저장소 밖에 `npm i playwright-core@1.56.1`로 운전) + 원문의 경계 입력 2~3개. 답은 `<slug> ok — 「한 줄」` 또는 `fail — 「한 줄」`. try 산출물은 미리 치우지 않는다(실제 CEO처럼). ship이 「CEO가 치운다」로 막으면 그때 치우고 「치웠다」고 말한다 — 프레임워크 FAIL이 아니라 CEO 접점 1로 센다(try 사본 장치가 들어오면 0이 되어야 한다).
3. 팀이 올린 결정: 「이미 충족」은 원문에 비춰 맞으면 「예 — 닫아라」. 원문 밖 보안 지적(공격이 짚은 것)은 「고쳐라」(버그 unit 하나). 팀이 정한 기본값은 그대로 둔다.
4. 매 말은 `turn.sh`가 `<폴더>-turn<n>.msg`로 남긴다 — 그 기록이 대리의 재량이 어디 들어갔는지의 증거다.
5. conductor가 질문 문장을 빠뜨리면(「위 질문」만) 그것을 지적하고 다시 묻게 한다 — 대신 짐작해 답하지 않는다.

## 절차 (정비 채널 세션에서)
```bash
B=/tmp/bench-$(date +%m%d-%H%M); mkdir -p $B          # 컨테이너 밖에 남지 않는다 — 결과는 이 문서에 적고 푸시
tests/field/setup.sh tests/field/briefs/ledger-cli.md $B/field1
tests/field/setup.sh tests/field/briefs/web-memo.md  $B/field2
tests/field/setup.sh tests/field/briefs/holdout-dupfind.md $B/field3   # 필드 3(소진된 홀드아웃 — Go, 회귀)
tests/field/turn.sh $B/field1 1 "<첫 말>"             # 출력의 session id를 적어 둔다
tests/field/turn.sh $B/field1 2 "<둘째 말>" <sid>      # 이후 매 턴 --resume
tests/field/watch.sh $B/field1:2 $B/field2:2          # Monitor로 걸면 ship·턴 끝마다 알림
node tests/field/table.mjs $B/field1                   # 표 + BENCH 한 줄
```
- 두 필드는 서로 독립이라 동시에 돌려도 된다(턴은 백그라운드로).
- 하네스 함정(프레임워크 결함 아님): 부모 세션의 `CLAUDE_*` 환경 누수 → `turn.sh`가 걷어 낸다 · 신뢰 안 된 작업 공간은 허용 목록 무시 → `setup.sh`가 신뢰를 켠다 · 필드 사본에서 `git worktree repair`를 치지 않는다(원본 링크를 빼앗는다 — 2026-10-01 정비 채널 실수).

## 점수 — 필드마다 한 줄
`BENCH` 줄(table.mjs) + 대리가 세는 셋: **프레임워크 FAIL 정지 수**(측정 모드에선 0 아니면 1 — 멈춘 단계와 줄) · **green 후 CEO 발견 결함**(tried fail) · **conductor 규율 이탈**(우회·스크립트 편집·CEO 파일 손댐·질문 누락). 비용은 마지막 턴 json의 `total_cost_usd`(세션 누적). **비용 예상은 높게 잡는다 — 한 회(세 필드) ≈ $30, 한 필드만이면 ≈ $10**(CEO 2026-10-02: 실측 621a426 $12.41 · 070f185 $15.65 — 웹 한 필드가 정비·재시도로 두 배가 되는 회차가 있다).

## 결과 원장
| 날짜 | 모드 | 프레임워크 | 필드 | 끝 | ship/drop | 프레임워크 FAIL 정지 | tried ok/fail | green 후 결함 | 팩 | 토큰 | 분* | 비용 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-01 | 정비 | 6622dbb → 3bb2f20 | 1 파이썬 CLI | SCOPE DONE | 6/1 | 6 (27·29·30·31·32·33) | 6/0 | 0 | 29 | 695K | 58.2 | $8.64 |
| 2026-10-01 | 정비 | 6622dbb → 3bb2f20 | 2 Node 웹 | SCOPE DONE | 4/2 | 5 (27·34·35·36·37) | 4/0 | 0 | 22 | 531K | 54.5 | $6.96 |
| 2026-10-01 | 측정 | 46a53ca | 1 파이썬 CLI | 정지 — ledger-add ship(unit 2/6) | 1/0 | 1 (ledger-add ship · spike 안내 없음) | 0/0 | 0 | 8 | 191K | 1.2 (정지 10.7) | $2.11 |
| 2026-10-01 | 측정 | 46a53ca | 2 Node 웹 | SCOPE DONE | 5/2 | 0 | 5/0 | 0 | 20 | 564K | 35.4 | $6.13 |
| 2026-10-01 | 정비(측정 정지에서 이어) | 46a53ca → b9e1561 | 1 파이썬 CLI | SCOPE DONE | 6/1 | 2 (39·40) | 5/1 | 1 (ledger-add 없는 날짜 → ledger-add-fix) | 28 | 671K | 99.6 | $7.40 |
| 2026-10-01 | 측정 | cfbcf3a | 1 파이썬 CLI | SCOPE DONE(M1 — export는 intake가 M2로) | 6/0 | 0 | 4/2 | 2 (없는 날짜 · 0 없는 날짜 — 각각 버그 unit 출하·ok) | 23 | 521K | 22.0 | $5.28 |
| 2026-10-01 | 측정 | cfbcf3a | 2 Node 웹 | 정지 — serve-list ship(unit 2/6) | 1/0 | 1 (serve-list ship · attack 파일만 든 wip HEAD) | 0/0 | 0 | 18 | 358K | 1.0 (정지 19) | $3.48 |
| 2026-10-01 | 정비(측정 정지에서 이어) | cfbcf3a → acce789 | 2 Node 웹 | SCOPE DONE | 6/0 | 3 (41·42·43) | 6/0 | 0 | 83 | 2519K | 194.5 | $26.14 |
| 2026-10-01 | 측정 | 79c3ebf | 1 파이썬 CLI | SCOPE DONE | 6/0 | 0 | 6/0 | 0 | 21 | 537K | 24.5 | $5.93 |
| 2026-10-01 | 측정 | 79c3ebf | 2 Node 웹 | SCOPE DONE | 6/0 | 0 | 6/0 | 0 | 24 | 590K | 28.6 | $6.11 |
| 2026-10-01 | 측정 | 486fd74 | 1 파이썬 CLI | SCOPE DONE(M1 + ledger-add-fix — export는 intake가 M2로) | 6/0 | 0 | 5/1 | 1 (없는 날짜 2026-02-30 → ledger-add-fix 출하·ok) | 28 | 734K | 40.4 | $7.97 |
| 2026-10-01 | 측정 | 486fd74 | 2 Node 웹 | SCOPE DONE | 4/2 | 0 | 4/0 | 0 | 15 | 395K | 29.2 | $4.50 |
| 2026-10-01 | 측정(홀드아웃 첫 측정) | 0ae7c70 | H Go CLI(dupfind) | 정지 — intake(unit 0/9, boot 전) | 0/0 | 1 (BACKLOG 줄을 고칠 길 없음 · drop이 예외로 죽는다) | 0/0 | 0 | 1 | — | — | $0.44 |
| 2026-10-01 | 정비(홀드아웃 정지에서 이어 — 소진, 이제 필드 3) | 0ae7c70 → d5cf39d | 3 Go CLI(dupfind) | SCOPE DONE | 7/2 (+깨진 줄 정정 drop 2) | 4 (49~52 · 53 · 54·55 · 56) | 7/0 | 0 | 29 | 830K | 95.2 | $9.76 |
| 2026-10-01 | 측정 | 621a426 | 1 파이썬 CLI | SCOPE DONE | 5/0 | 0 | 5/0 | 0 | 20 | 450K | 19.6 | $4.62 |
| 2026-10-01 | 측정 | 621a426 | 2 Node 웹 | SCOPE DONE | 4/2 | 0 | 4/0 | 0 | 18 | 432K | 31.3 | $4.83 |
| 2026-10-01 | 측정 | 621a426 | 3 Go CLI(회귀) | SCOPE DONE(M1 4 — 5 unit은 intake가 M2로) | 4/0 | 0 | 4/0 | 0 | 12 | 268K | 13.4 | $2.96 |
| 2026-10-02 | 측정 | 070f185(동결 9c677ec) | 1 파이썬 CLI | 정지 — add-entry redproof(unit 2/5) | 1/0 | 1 (add-entry redproof · 거짓 base green — boot의 test_file이 하이픈 파일을 0건 실행·exit 0) | 0/0 | 0 | 2 | 66K | 1.3 (정지 3.2) | $0.86 |
| 2026-10-02 | 측정 | 070f185(동결 9c677ec) | 2 Node 웹 | SCOPE DONE | 8/1 | 0 | 8/0 | 0 | 33 | 883K | 46.2 | $9.47 |
| 2026-10-02 | 측정 | 070f185(동결 9c677ec) | 3 Go CLI(회귀) | SCOPE DONE | 5/0 | 0 | 5/0 | 0 | 17 | 516K | 23.4 | $5.32 |
| 2026-10-02 | 측정 | 0ab3a05(사고 57 수리 · 팩 상한 32) | 1 파이썬 CLI | SCOPE DONE(M1 4 — export·offline은 intake가 M2로) | 4/0 | 0 | 4/0 | 0 | 14 | 332K | 12.0 | $3.30 |

\* scope → 마지막 ship/drop, 정비를 기다린 시간 포함. 다음 행은 측정 모드로 — 예측: b7f09d4 이후 판은 두 필드 모두 프레임워크 FAIL 0으로 SCOPE DONE(남은 위험: 이미 충족된 주장은 drop만 가능 · try 잔여물 — 둘 다 장치 후보).

### 2026-10-01 측정 46a53ca — 기록 (필드 폴더는 사라진다)
- 차림: setup 둘 다 SELFTEST 19/19 · conductor claude 2.1.286 헤드리스 · try는 메인 루트(웹은 실 Chromium 141). 규율 이탈 0(두 필드 — FAIL마다 우회·편집 없이 멈춤, CEO 파일 무접촉, 질문 문장 그대로).
- **필드 1 정지 줄**(04:01:45Z — build·attack·redproof는 전부 PASS였다):
  ```
  FAIL ship ledger-add 1/8
  - spike: boundary HIT(file .gitignore)인데 spike 필수 행(wire·host·license·default·os) 미완
  ```
  build가 `.gitignore`에 `__pycache__/`를 더했고(boot의 .gitignore에 파이썬 산출물이 없었다) `.gitignore`는 boundary 파일이다. FAIL 줄도 Flow도 다음 할 일(`brief.mjs spike <slug>` → spike → ship)을 말하지 않고 Flow 6은 「spike 허용 밖」을 멈춤으로 둔다 — conductor는 Flow 5(「스크립트 출력 밖의 추측으로 움직이지 않는다」)대로 멈췄다. 안내 없음.
- **예측 채점**: 필드 2 ✓(FAIL 0 · SCOPE DONE) · 필드 1 ✗. 남은 위험 둘은 그대로 나왔다 — 이미 충족 drop 2(memo-persist · browser-reload) · try 잔여물 1(data/memos.json).
- **원장 밖 CEO 접점**: 필드 2 — 치움 2(package-lock.json · data/memos.json) · 팩 상한 FAIL의 결정 ①(보안 버그 unit build 팩 28KB — 24→29 CEO 커밋) · 이미 충족 「예」 2 · 보안 지적 「고쳐라」 1. 필드 1 — 팀 질문 Q4(하네스) 「예」 1.
- **결함 후보(측정 모드라 수리하지 않았다 — 1·2는 사고 38, 3은 사고 39로 정비 수리)**:
  1. 두 필드의 boot ship: `FAIL ship: 문서 커밋 실패 — FAIL gate - 인덱스 ≠ 작업 트리 …` — 머지 뒤 main에서 돈 setup(`npm install` · `pip install -e .`)·quick이 미추적 산출물(package-lock.json · src/*.egg-info · __pycache__)을 남겨 ship 자신의 문서 커밋이 거부됐다. 머지·shipped·ship 줄은 남고 문서는 스테이지 채, worktree 잔류, TRY 줄 없음 — 안내대로 스테이지 → 다시 ship은 「이미 출하」. 사고 21(머지 직후 main setup)의 길이고, 웹은 사고 34 수리(의존성 0이어도 설치 명령)가 boot마다 연다 — 정비 판 웹 boot의 setup은 `true`였다.
  2. 그 package-lock.json이 다음 ship을 「팀의 것이 아니다 — CEO가 치운다」로 막았다 — ship 자신의 산출물을 CEO 몫으로 오귀속(대리 규칙 2대로 CEO 접점으로 셌다).
  3. 필드 1 정지 줄 — spike FAIL에 다음 명령이 없고, 산출물 무시 줄 추가(`.gitignore`)가 diff-HIT다.
  4. 필드 1: boot 하네스(unittest discover)가 하이픈 파일(`ledger-add.py`)을 0건 실행·exit 1 — redproof가 그 0건 red를 base_red로 인정했다(Q4의 하네스 수리로 풀림).
  5. 팩 상한 FAIL ①의 「CEO 커밋」은 보호 브랜치 게이트를 넘는 법을 말하지 않는다(대리는 deliver.sh와 같은 GARAGISTE_SHIP=1 GARAGISTE_WIP=1).
- **정비 모드 이어서(필드 1, 같은 폴더)**: 사고 38·39 수리(6f9182b) 반영 → 옛 판 boot가 남긴 egg-info·__pycache__는 보존 폴더로 옮김 → ledger-add가 새 spike 줄대로 spike 팩을 거쳐 출하(39 확인), 그 뒤 ship 4건 모두 main 깨끗(38 — 되돌림 경로 자체는 boot가 옛 판으로 출하돼 이 필드에선 안 밟았다, e2e가 재현). 정비 중 새 사고 40: 헤드리스에서 `cd <worktree> && …`가 막혀 build가 worktree의 verify를 경로로 불렀는데 셸이 main 루트라 main을 검증 → worktree 게이트 「quick PASS 없음」 반복 → wip HEAD로 정지. 수리(b9e1561) 뒤 바로 출하.
- **green 후 CEO 발견 결함 1**: ledger-add가 `2026-13-01`을 exit 0으로 기록(어느 달에도 안 잡힘 — attack이 못 봤다) → tried fail → 버그 unit ledger-add-fix 출하, try ok. conductor는 spec의 Q5(재현 줄)에 CEO 말을 그대로 옮겨 답하고 그렇게 밝혔다.
- 다음: b9e1561 이후 판으로 측정 모드 재벤치 — 38의 되돌림이 실제 boot에서 돌고 두 필드가 FAIL 0으로 닿는지.

### 2026-10-01 측정 cfbcf3a(main — 사고 38~40 포함) — 기록
- 차림은 위와 같다(같은 원문·첫 두 말·대리 규칙). intake 편차: 파이썬은 unit 5(export를 M2로, no-network 없음) — 1회차와 범위가 다르니 분·팩 비교는 주의. 웹은 unit 6 · Q1(Playwright) — 규칙 1대로 「예 + Chromium 사실」.
- **사고 38 실필드 확인**: 웹 boot ship → `ship_rollback`(why main stray, `package-lock.json`) → boot 재spawn이 lockfile을 커밋 → 30초 뒤 출하, main 깨끗·worktree 없음. 파이썬 boot는 처음부터 `__pycache__/`·`*.egg-info/`를 무시해 되돌림 없이 출하.
- **필드 2 정지 줄**(06:00Z 무렵 — 안내대로 build 재spawn 뒤 같은 FAIL):
  ```
  FAIL ship serve-list 1/8
  - head: HEAD가 wip 체크포인트 — build를 다시 띄워 끝내라
  ```
  wip HEAD에 attack 산출물 `tests/adversary/serve-list-13.test.mjs` 하나만 있었다(attack red 0/13). build는 고칠 것이 없고 그 파일을 커밋할 주체가 없다 — build가 wip를 풀어도 체크포인트가 다시 덮는다. 사고 16(spike 파일만 든 wip HEAD 승격)과 같은 꼴 — 결함 후보.
- **예측 채점**(「b9e1561 이후 판은 38의 되돌림이 실제 boot에서 돌고 두 필드가 FAIL 0으로」): 38 ✓ · 필드 1 FAIL 0 ✓ · 필드 2 ✗(새 꼴의 FAIL).
- **필드 1 — green 후 CEO 발견 결함 2**: add-entry가 `2026-13-01`·`2026-02-30`을 기록(1회차와 같은 결함 — attack이 또 놓침) → add-entry-fix 출하 → `2026-1-5`가 그대로 기록돼 어느 달에도 안 잡힘 → add-entry-fix2 출하·ok. 날짜 경계는 두 판 연속 attack이 못 본 계급이다(system-attack 방아쇠 기록 — 장치 아님).
- **관찰**: tried fail의 자동 줄(`add-entry-fix-fix`)과 conductor의 `work.mjs new add-entry-fix2`가 같은 일로 둘 다 생겨 하나가 BACKLOG에 남았다(BENCH 「열린 줄 2」 = export(M2) + 이것) · jsonl-read의 첫 build가 Bash 승인에 막혀 검증·커밋을 못 해 같은 팩으로 재spawn · 웹 serve-list는 attack 7회(공격 파일 13)로 출하 전에 결함을 많이 닫았다.
- 결함 후보(새): ① attack 파일만 든 wip HEAD에서 ship이 멈춘다(필드 2 정지) ② 버그 unit 중복 생성(tried fail 자동 줄 + conductor new).
- **정비 모드 이어서(웹, 같은 폴더)**: 사고 41(a2e9ac7) 반영 → serve-list의 wip가 `test(serve-list): attack 산출물`로 승격돼 출하. 이어 새 사고 둘: 42 — memo-delete의 수용(메모 옆 삭제 폼)이 출하된 memo-save의 과잉 단언 공격 테스트와 충돌, 두 번째 반려 → CEO 「고쳐라」 → 그 unit의 spec을 열 길이 없음(`FAIL worktree 없음`) → 수리(69d024a, `brief.mjs attack <slug> --revise`) 뒤 원장 `adversary_revise` → 출하. 43 — browser-reload의 build가 `X=1 npm install …`(환경 변수 접두)로 승인 대기에 막힘 → 수리(acce789, 팩이 headless 함정·대안을 준다) 뒤 `npm --prefix` 설치 → 출하. try 6장 전부 ok(실 Chromium) — green 후 결함 0.
- **원장 밖 CEO 접점(웹)**: 팩 상한 결정 ① 3회(24→25 memo-delete · 25→29·29→31 memo-persist) — attack 라운드마다 build 팩의 공격 절이 자라 같은 unit에서 사슬이 된다(「팩 상한 이유-차선」 장치 후보의 근거 추가, CEO 「가」 대기) · 「고쳐라」 1(42) · Q2 예 1.
- **비용 관찰**: 웹 unit마다 build·attack이 7~10회 돌았다(attack 35회 · 선발견 43 · 팩 83 · 2.5M 토큰 · $26) — 1회차 웹(팩 22 · 531K · $6.96)의 약 4배. attack이 결함을 계속 찾는 한 수렴 상한이 없다. 산출(green 후 결함 0)은 좋지만 비용 축의 장치 후보(attack 라운드 상한 또는 build 팩 공격 절의 크기) — 둘의 규칙 대기.
- 산문 예산: 설치본 ≈37KB/40KB — HAZARDS가 사고마다 한 줄씩 자라 여유가 3KB 남짓.

### 2026-10-01 측정 79c3ebf(main — 사고 38~43 포함) — 기록
- **두 필드 모두 프레임워크 FAIL 0으로 SCOPE DONE · try 12장 전부 ok · green 후 CEO 발견 결함 0** — 「b9e1561 이후 판은 두 필드 FAIL 0으로」의 예측이 이 판에서 처음 맞았다(1회차 46a53ca: 웹만 · 2회차 cfbcf3a: 파이썬만).
- intake: 파이썬 unit 5(전부 M1 — no-network 없음) · Q3, 웹 unit 6 · Q2(Playwright — 규칙 1대로 「예 + Chromium 사실」). 범위가 회차마다 조금씩 다르다(intake 편차) — 분·팩 비교는 그만큼 주의.
- **사고 38 두 필드 실필드**: 파이썬 boot → `ship_rollback` main stray(`src/ledger.egg-info/` · `__pycache__` 둘) → 재spawn → 출하, 웹 boot → `ship_rollback` main stray(`package-lock.json`) → 재spawn이 lockfile 커밋 → 출하. 반쪽 출하·CEO 치움 0.
- 증거 낡음 FAIL은 셋(파이썬 1 · 웹 2 — spike 커밋 뒤) — 전부 안내대로 재기록해 한 번에 풀렸다(정지 아님).
- 원장 밖 CEO 접점: 파이썬 — 보안 지적 「고쳐라」 1(CSV 수식 실행 — attack이 짚었는데 build가 고치지 않았고 conductor가 「확인하지 않은 위험」으로 올렸다 → export-csv-fix 출하·ok, 1회차와 같은 처리). 웹 — 0(팩 상한 FAIL·try 잔여물 없음 — `data/`·`node_modules`는 팀이 무시 목록에).
- attack 선발견이 날짜 경계를 이번엔 출하 전에 잡았다(앞 두 회차는 CEO try가 후발견). 웹은 DNS 리바인딩·CSRF·깨진/BOM 파일 덮어쓰기 등.
- **관찰(결함 후보 4의 둘째 근거 → 사고 44로 정비 수리)**: 파이썬 필드의 full(`tests/harness/run_all.py` — unittest discover)이 1건(unit 스모크)만 돈다 — 하이픈 이름의 인수·공격 파일 17개는 한 번도 안 돈다. 출하 전 증거(redproof·attack·통합 재검증)는 파일 단위라 게이트는 속지 않지만, 출하 뒤 다음 unit들의 full은 앞 기능의 회귀를 지키지 않는다. conductor가 spec의 보고로 두 번 「확인하지 않은 위험」으로 올렸다. 웹(node --test glob)은 해당 없음.

### 2026-10-01 측정 486fd74(main — 사고 38~44 포함) — 기록
- **두 필드 모두 프레임워크 FAIL 0으로 SCOPE DONE — 2회 연속**(79c3ebf에 이어). 이 두 원문에 대해선 회귀 확인이지 범용성 증거가 아니다 — 사고 38~44가 전부 이 두 원문에서 나왔다(아래 「과적합」).
- intake: 파이썬 unit 7(M1 5 · M2 export·no-network — cfbcf3a처럼 export가 M2로) · Q3 + 진행 중 Q4(CP949 읽기 — 규칙 1대로 「예」) · Q5(-fix의 재현), 웹 unit 6 · Q2(규칙 1 「예 + Chromium 사실」).
- **사고 44 실필드**: 파이썬 full이 discover 뒤 인수·공격 파일을 test_file로 하나씩 돈다(ledger-month 시점 13개, 전부 exit 0). **비용(웹)**: 같은 main에서 러너(`node --test` glob, 병렬) 20.5초 · 추가 파일 10개 직렬 50.8초 — full이 약 20초 → 71초(3.5배). full은 unit마다 2회(worktree · 통합)라 웹 unit당 1~2분 늘었다.
- **사고 38 실필드**: 파이썬 boot → main stray(`src/ledger.egg-info/`) → 되돌림·보존 → 재spawn이 .gitignore → 출하. 반쪽 출하·CEO 치움 0.
- 원장 밖 CEO 접점: 웹 — try 잔여물 치움 1(save try의 `data/memos.json`이 delete ship을 「CEO가 치운다」로 막음 — 규칙 2대로 접점 1, 79c3ebf는 팀이 `data/`를 무시 목록에 넣어 0이었다) · 이미 충족 「예 — 닫아라」 2(persist · browser-reload). 파이썬 — 부분 충족 「아니오」 1 · -fix 범위 1.
- **관찰(결함 후보 — 측정 모드라 수리하지 않았다)**:
  6. **부분 충족에 길이 없다(사고 36 계열)**: jsonl-store(손편집·BOM + Q4 CP949)의 통합 tree redproof가 `jsonl-store_handedit.py` base green으로 FAIL — 먼저 출하된 broken-lines가 BOM 처리를 main에 넣었다. 안내는 drop(남은 red 주장 CP949까지 닫힌다) 아니면 re-spec 둘뿐 — 대리가 「아니오 — 이미 main에 있는 주장은 빼고 CP949를 남겨라」로 답해 re-spec이 그 파일을 빼고 출하(안내대로 풀려 정지 아님 · spec 1·CEO 접점 1 비용).
  7. **tried fail의 재현이 버려진다**: conductor가 `tried ledger-add fail`을 note 없이 남겨(대리 말에는 재현 한 줄이 있었다) -fix unit의 원문이 「써봤는데 실패 — 스펙 정정」뿐 → spec이 재현을 Q5로 되묻고 멈춤(팩 2 · CEO 접점 1). 46a53ca 정비의 Q5와 같은 꼴 — 프레임워크가 fail에 빈 note를 받는다.
  8. **-fix unit이 고정 범위 밖**: scope는 slug 목록이라 tried fail이 만든 ledger-add-fix(M1)가 SCOPE DONE 뒤에 남았다 → CEO scope 1. cfbcf3a는 conductor가 `work.mjs new`로 우회했던 자리(버그 unit 중복의 원인) — 이번엔 규율대로 물었다.
- **과적합 — 이 벤치가 말하지 못하는 것**: 원문 둘(작은 greenfield · 파이썬 표준 라이브러리 · Node 무의존)·Linux 컨테이너·Claude Code 헤드리스·budget medium·규칙대로 답하는 대리. opencode 배선·기존 코드가 있는 저장소·컴파일 언어·긴 빌드·사람 CEO는 한 번도 안 밟았다. 판끼리 비교(회귀)는 이 두 원문으로 계속하고, 범용성은 수리에 쓰지 않은 새 원문(홀드아웃)으로만 잴 수 있다 — CEO 결정 대기.

### 2026-10-01 홀드아웃 첫 측정 0ae7c70(사고 38~48 포함) — 기록
- **범용성 점수: 처음 보는 원문에서 intake에서 정지 — boot 전.** 필드 1·2가 두 회 연속 FAIL 0이던 판이다 — 「과적합」의 우려가 한 줄로 확인됐다: 필드 1(파이썬 CLI)의 원문엔 `--`로 시작하는 줄이 없었고, CLI 도구의 원문은 흔히 옵션(`--min-size`·`--json`)을 말한다.
- 정지 줄(conductor가 그대로 넘김): `work.mjs drop min-size … --forget` → `Error: unit 없음: min-size — work.mjs new 먼저` + 스택(한 줄 출력 규칙 위반 · 잡히지 않은 예외), `work.mjs add min-size …` → `FAIL BACKLOG에 있음: min-size` — 깨진 BACKLOG 줄을 고치거나 지울 명령이 없다(실행 불가). conductor의 차선 제안(두 줄 없이 나머지 M1)은 대리 재량이라 고르지 않았다(측정 규칙).
- **홀드아웃 결함(측정 모드라 수리하지 않았다 — 수리하면 이 원문은 소진, 필드 3으로)**:
  H1. **`--`로 시작하는 원문이 플래그로 먹힌다**: intake의 `work.mjs add min-size "--min-size 1M처럼…" --milestone M1`이 원문을 「M1」, 마일스톤을 `M?`로 남겼다(json-out 같음) · `ask`의 질문 「--json …」도 먹혀 Q1이 「json-out」 한 단어. 정지의 뿌리.
  H2. **unit 없는 BACKLOG 줄의 정정·삭제 길이 없다**: drop은 unit을 요구해 예외로 죽고(H1 없이도 intake의 잘못 쓴 줄 하나면 같은 막다른 길), add는 중복을 거부한다.
  H3. **`work.mjs brief --help`가 「--help」를 CEO 원문에 쌓았다** — 팀은 BRIEF를 못 지운다(훅) → CEO 치움 1(대리가 지우고 「치웠다」).
  H4. **`spawned` 사용법의 `<팩>`이 이름인지 경로인지 모호** — conductor가 팩 파일 경로를 넣고 같은 사용법을 두 번 받고 포기(486fd74 필드 1도 한 번 — 둘째 근거). 기록만 막혀 진행엔 영향 없음.
- 원장 밖 CEO 접점: BRIEF 치움 1 · intake 질문 4(그중 둘은 H1이 만든 것).
- 홀드아웃의 첫 측정 줄이 이 원문의 점수다 — H1·H2를 수리하면 이 원문은 필드 3(회귀 · 정비 모드 허용)이 되고, 다음 범용성 측정엔 새 홀드아웃(다른 생태계·모양 — 예: 기존 코드가 있는 저장소)이 필요하다.

### 2026-10-01 정비 — 필드 3(소진된 홀드아웃, Go) intake 정지에서 SCOPE DONE까지
- 사고 49~52 반영(5b8141e) → conductor는 깨진 두 줄을 새 FAIL의 안내대로 `drop … --forget`(unit 없는 줄) 뒤 새 slug(min-size-flag · json-flag)로 다시 넣었다 → boot가 `test_file="go test {files}"`를 골랐다(사고 48의 선택지가 처음 보는 생태계에서 쓰였다).
- 이어 나온 셋은 모두 **「증명은 파일 하나씩」이 Go의 패키지 모델과 만난 자리** — 필드 1·2(파이썬·Node — 파일이 곧 모듈)에선 안 보이던 가정이다:
  - 사고 53: `go test {files}`는 한 디렉터리의 파일만 받는다 → 「함께 red」 거짓 FAIL, conductor는 test_file을 패키지 경로로 바꾸자고 물었다(아니오 — {files}는 디렉터리마다, 판정은 파일 단위).
  - 사고 54·55: go test의 결과 캐시가 스모크가 부른 `go run ../../src`의 입력 변화를 몰라 낡은 ok — find-dups가 main quick이 빨간 채 출하됐고, 다음 build는 build.md의 「테스트를 고쳐 초록을 만드는 길은 없다」를 스모크까지로 읽어 멈췄다(GOFLAGS -count=1 · 산문=훅).
  - 사고 56: 인수 파일이 같은 패키지의 다른 테스트 파일 도우미를 써 혼자 컴파일되지 않았다(spec·attack 팩의 test_file 줄 「혼자 돈다」).
- 그 뒤 4 unit은 FAIL 없이 — 이미 충족 2(no-symlink · read-only — 대리가 실제로 확인하고 「예」) · attack 선발견(큰 단위 오버플로·비 UTF-8 이름·stdout 쓰기 실패). try 7장 전부 ok(unreadable-warn은 root가 아닌 사용자로).
- 원장 밖 CEO 접점: BRIEF 치움 1(측정 구간) · 정비 답 3(test_file 그대로 「아니오」 · smoke-fix unit 「아니오」 · 인수 파일은 혼자 돈다 「예」 — 마지막은 두 번째 spec 반려로 CEO에게 간 것. 첫 반려는 사고 55가 만든 것이라 「팀 안에서 안 풀린 둘」이 아니었다).
- **산문 예산**: 이번 회의 HAZARDS 줄(45~56)을 압축하고도 설치본 39KB(한도 40 — 남은 약 1.4KB). 다음 사고 한두 줄이면 ship의 budget 조건이 막힌다 — 코드(테스트)로 넘어간 오래된 HAZARDS 줄을 걷어 낼지·한도를 바꿀지는 CEO 결정.

### 2026-10-01 측정 621a426(사고 38~56 · HAZARDS 35줄 정리 포함) — 기록
- **세 필드 모두 프레임워크 FAIL 0으로 SCOPE DONE · try 13장 전부 ok · green 후 CEO 발견 결함 0** — 합계 $12.41. 필드 1·2는 세 회 연속 FAIL 0. 필드 3(소진된 홀드아웃 Go)은 첫 측정에서 intake 정지였던 원문이 회귀로 FAIL 0.
- 필드 3: intake가 `--min-size 1M…` 원문을 그대로 남겼다(사고 49) · boot가 다시 `test_file="go test {files}"`를 골랐고 full은 디렉터리마다 한 번에(사고 53) 전부 green · 캐시 낡은 ok·혼자 안 도는 인수 파일 없음(사고 54~56). intake가 9 unit 중 5를 M2로 둬 범위가 4 unit — 대리는 벤치 규칙대로 M2를 「아니오」.
- 사고 38 경로(boot의 main stray → 되돌림·보존·재spawn)는 필드 1·2에서 한 번씩 — 반쪽 출하·CEO 치움 0.
- 원장 밖 CEO 접점: 웹 — try 잔여물 치움 1(`data/memos.json`이 memo-delete ship을 막음 — 486fd74와 같다: try 사본 장치 후보의 셋째 근거) · 이미 충족 「예」 2(memo-persist · browser-reload). 파이썬·Go — 0.
- 관찰(결함 아님): 파이썬 export-csv의 CSV 수식(`=1+1` 메모)을 이번 attack은 짚지 않았다(1·3회차는 짚었다) — 원문 밖이라 대리는 지적하지 않았다(규칙 3: 팀이 짚은 것만). month-summary의 try 카드가 「급여 5000」이라 적었는데 동작은 「급여 -5000」(원문대로 음수가 수입 — 카드의 부호가 틀렸다).
- 산문 예산: 설치본 26KB(HAZARDS 29줄).
- **다음 범용성 측정엔 새 홀드아웃이 필요하다**(지금 없음 — 필드 1~3 모두 회귀).

### 2026-10-02 측정 070f185(프레임워크 = L2 2판 동결 9c677ec — try 사본의 첫 벤치) — 예측(시작 전 커밋)
- 차림: 정비 채널 컨테이너 · claude 2.1.287(직전 2.1.286) · budget medium · 첫 말·둘째 말·대리 규칙은 위와 같다 · try는 `work.mjs try <slug>`의 사본에서(대리 규칙 2). 필드 1~3 모두 회귀 — 홀드아웃이 없어 범용성 점수가 아니다. `l2-todo-cli`는 윈도우 3일 표 전까지 쓰지 않는다.
- 621a426과 다른 것: try 사본(97716dc) · 사본은 지우기 전에 의존성 링크를 끊는다(ed65a9c) — 둘뿐.
- 예측: 1) 세 필드 모두 프레임워크 FAIL 0으로 SCOPE DONE 2) 웹의 try 잔여물 치움 0(486fd74·621a426은 1 — `data/memos.json`) 3) try 뒤 `.worktrees`에 try 사본 0 · main 깨끗 4) green 후 CEO 발견 결함 0~1(파이썬 날짜 경계·CSV 수식은 attack 편차) 5) 비용 $12~15.
- 덤(측정만): unit마다 attack 바퀴 수 — 윈도우 L2 1일차의 진동(add 28 · add-due-tag 20바퀴)과 비교할 리눅스 기준선.

### 2026-10-02 측정 070f185 — 기록
- 차림: 설치 79519cf(= 070f185 + 위 예측 커밋 — team/ 같다) · SELFTEST 19/19 ×3 · 세 필드 병렬 · try는 전부 사본에서 13개(conductor가 연 것 10 · conductor가 안 열어 대리가 `work.mjs try`로 연 것 3) · 웹은 실 Chromium 141. 규율 이탈 0(세 필드 — 정지마다 우회·편집 없이 FAIL 전문).
- **필드 1 정지 줄**(23:44:48Z — boot 출하 뒤 첫 기능 unit의 spec 직후):
  ```
  FAIL redproof add-entry: base에서 green — tests/acceptance/add-entry_cli.py — 기존 코드가 이 주장을 이미 만족한다(old code에서도 통과하는 테스트는 테스트가 아니다). CEO 결정(예/아니오로 묻는다): 이미 충족으로 닫는다 → node .garagiste/scripts/work.mjs drop add-entry "이미 충족 — <근거>" --forget (주장 파일은 dropped 브랜치에 남는다) · 아니면 CEO가 더 말한 것을 work.mjs brief로 받고 brief.mjs spec add-entry 재spawn
  ```
  boot가 고른 test_file `python3 tests/harness/run.py {files}`는 파일 인자를 `unittest discover(pattern=<파일 이름>)`로 읽어 하이픈 모듈 이름(`add-entry_cli.py`)을 건너뛴다 — `Ran 0 tests · OK · exit 0`, 직접 실행하면 4건 FAIL(진짜 red). redproof는 그 exit 0을 base green으로 읽었고, 안내 둘(이미 충족 drop · re-spec)은 원인에 닿지 않는다 — conductor가 그렇게 진단하고 멈췄다(대리가 재현으로 확인).
- **결함 후보(측정 모드라 수리하지 않았다)**: 프레임워크는 test_file이 받은 파일을 실제로 돌리는지 모른다 — 0건 실행이 exit 0이면 green(이번), exit 1이면 red(46a53ca 후보 4 — 거짓 base_red)로 읽는다. 같은 하네스에선 사고 44의 full(인수·공격 파일을 test_file로)도 0건 green이 된다. 앞 회차들은 boot가 파일을 직접 실행하는 하네스를 골라 드러나지 않았다 — boot의 편차가 연 구멍. 동결(L2 2판) 중 수리할지는 CEO 결정 — 윈도우 원문은 Node라 닿지 않는다.
- **예측 채점**: 1) ✗ 필드 1 정지 · 필드 2·3 ✓ 2) ✓(저장소 안) 웹의 try 산출물(`data/memos.json`)은 사본에 남고 main은 출하마다 깨끗 — 직전 두 판의 치움 1이 0. 다만 **저장소 밖 잔여물 1**: 대리가 CSRF 확인용으로 띄운 `npm start`가 포트 3000을 쥔 채 남아(끄는 명령이 이 컨테이너에 없는 `ss`에 기댔다 — 대리의 실수) memo-delete-fix의 verify full이 server-port 인수 파일에서 `포트 3000이 이미 쓰이고 있다 — 테스트 전제가 깨졌다`로 FAIL → conductor가 try 서버를 원인으로 짚고 멈춤 → 대리가 끄고 「치웠다」(접점 1). try 사본의 한계(저장소 밖 부작용) 그대로다 3) ✓ 끝에 try 사본 0 · main 깨끗(STATUS 갱신뿐) 4) ✓ green 후 CEO 발견 결함 0(tried 13/0) 5) ✗ $15.65 — 웹 $9.47이 621a426의 약 2배(출하 8 + drop 1 · CSRF 버그 unit · 팩 상한 · 포트 막힘 · browser-reload 반려).
- **attack 바퀴(리눅스 기준선)**: 필드 2·3의 attack unit 11개 모두 attack 팩 1번(1바퀴) · build 1~2번 — 윈도우 L2 1일차 add 28 · add-due-tag 20바퀴와 비교.
- 원장 밖 CEO 접점: 웹 — 팩 상한 결정 ① 1(memo-delete 2차 build 팩 28KB — 안내 숫자대로 24→29 CEO 커밋) · 보안 지적 「고쳐라」 1(memo-delete의 attack이 짚은 CSRF가 red로 남지 않았다고 conductor가 올림 → 대리가 try 사본에서 실제 재현 → memo-delete-fix 출하·ok) · 이미 충족 「예」 1(memo-persist — 재시작 뒤 남음을 대리가 확인) · 치움 1(위). Go — 팩 상한 결정 ① 1(unreadable-symlink build 팩 28KB — 24→28). 파이썬 — 0.
- 관찰: browser-reload의 핵심 주장(저장 → 새로고침 → 그대로)은 base에서 이미 green이었다 — build의 spec 반려(「playwright를 빼면 import 실패로 red가 되는 것이 전부」) 뒤 spec이 「playwright 개발 의존성 선언(Q2)」 단언으로 base red를 세워 출하(덤: 여러 줄 메모 pre-wrap). 이전 두 판은 「이미 충족」 drop — 백로그 2순위(이미 충족된 주장 박기)의 근거 하나 더 · 버그 unit memo-delete-fix의 마일스톤이 `M?`(백로그 관찰 그대로 — 이번엔 범위에서 빠지지 않았다) · 대리가 본 회색 둘(결함으로 세지 않음): 다른 출처의 `POST /`(저장)도 받는다(팀이 짚지 않아 말하지 않음 — 규칙 3) · Go의 폴더 뒤 플래그는 사용법으로 거부.

### 2026-10-02 측정 0ab3a05(사고 57 수리 · 팩 상한 32) — 파이썬 필드만, 예측(시작 전 커밋)
- 왜: 070f185의 필드 1 정지(test_file 0건 green)의 수리를 같은 원문·같은 절차로 확인한다. 회귀이지 범용성 점수가 아니다.
- 예측: 1) 프레임워크 FAIL 0으로 SCOPE DONE 2) boot가 discover 꼴 하네스를 고르면 boot ship이 탐침(redproof 자리)으로 막고 boot 재spawn이 고친다 — 다른 하네스면 탐침은 조용하다 3) 팩 상한 FAIL 0(32KB) 4) green 후 CEO 발견 결함 0~1(날짜 경계·CSV 수식은 attack 편차) 5) 비용 $5~8 → CEO 정정(시작 뒤 intake 중 · 결과 전): 비용 예상은 높게 — 한 필드 몫 ≈ $10.

### 2026-10-02 측정 0ab3a05 — 기록 (파이썬 필드만)
- 차림: 설치 a1e19c4(= 0ab3a05 + 예측 커밋 — team/ 같다) · SELFTEST 19/19 · 세션 156cb23d · try는 사본에서 4(conductor가 연 것 4). 규율 이탈 0. conductor가 intake 질문을 한 턴에 하나씩 물어 말이 셋 더 들었다(Q1~Q3 — 대리는 매번 둘째 말 그대로).
- **예측 채점**: 1) ✓ 프레임워크 FAIL 0 · SCOPE DONE 2) ✓(둘째 갈래) boot가 고른 하네스(`python3 tests/harness/run_tests.py {file}` — importlib로 경로를 직접 적재해 하이픈 이름도 돈다)에 탐침은 조용했다(원장 `runner_blind`·`blind` 0). 첫 갈래(discover 꼴을 boot ship이 막는다)는 이 필드에서 밟지 않았다 — e2e와 070f185 필드 1의 실제 하네스(`run.py`)에 탐침을 대 확인(탐침 둘 다 눈멂 · add-entry_cli.py 눈멂 · `python3 {file}`은 아님 · pytest 9.1.1은 깨진 탐침에 exit 2) 3) ✓ 팩 상한 FAIL 0 — 최대 build 팩 24,599B(jsonl-tolerant, 옛 상한 24KB를 23B 넘는다: 옛 판이면 fit이 부대물을 포인터로 줄였을 자리) 4) ✓ green 후 CEO 발견 결함 0 — 없는 날짜(2026-02-30·2026-13-01)·2026-1-5·`12,000`을 attack이 출하 전에 막았다(cfbcf3a·486fd74에선 CEO try가 후발견) 5) ✓ $3.30(예측 $5~8 → CEO 정정 ≈ $10).
- 070f185에서 멈춘 자리(add-entry redproof)를 지나 출하 — boot는 이번엔 파일을 경로로 적재하는 하네스를 골랐다(boot 팩의 test_file 줄 「이름과 무관하게 그대로 — 하이픈도」가 이 판에 들어갔다 — 영향인지 편차인지는 한 번으로 모른다).
- attack 바퀴: unit 3개 모두 1바퀴(리눅스 기준선 14 unit째 1바퀴). 사고 38 경로(boot의 main stray → 되돌림·재spawn) 1회 — 반쪽 출하·CEO 치움 0.
- 원장 밖 CEO 접점 0 · 대리 try의 경계 입력: 없는 날짜·틀린 형식·쉼표 금액 거부, 빈 달 0원, 수입은 부호대로, 메모장 꼴(BOM·CRLF·빈 줄) 읽기, 필드 빠진 줄은 줄 번호와 함께 건너뜀 — 전부 원문대로.
