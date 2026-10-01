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
- **홀드아웃 원문** 하나를 따로 둔다 — 지금: `tests/field/briefs/holdout-dupfind.md`(Go CLI · 표준 라이브러리 · 파일 시스템 걷기, 2026-10-01 작성 — 필드 1·2와 생태계·모양이 다르다: 컴파일 언어, 테스트가 파일이 아니라 패키지 단위). 원문은 첫 측정 전에 고정하고 결과를 본 뒤 고치지 않는다.
- **측정 모드로만** 돈다(정비 모드 금지 — 멈춘 자리에서 고치며 이어 가면 그 원문은 훈련 데이터가 된다). 첫 말·둘째 말·대리 규칙은 필드 1·2와 같다.
- 홀드아웃이 낸 결함은 사고로 수리한다 — 그 수리가 들어간 순간 그 원문은 **소진**: 필드 3(회귀)으로 옮기고, 다음 측정 전에 새 홀드아웃(다른 생태계·모양 — 예: 기존 코드가 있는 저장소에 기능 하나)을 쓴다. 홀드아웃의 첫 측정 줄만이 범용성의 점수다.

## CEO 대리 규칙 — 대리의 재량이 점수를 흔들지 않게
1. intake 질문: 원문과 어긋나지 않으면 「예」. 이 기계의 사실이 필요하면 사실을 붙여 「예」(브라우저: `Chromium이 /opt/pw-browsers에 있다(PLAYWRIGHT_BROWSERS_PATH 설정됨, 다운로드하지 않는다)`).
2. try 카드: 카드대로 **메인 루트에서** 실제로 친다(CLI는 임시 폴더, 웹은 실제 Chromium — 저장소 밖에 `npm i playwright-core@1.56.1`로 운전) + 원문의 경계 입력 2~3개. 답은 `<slug> ok — 「한 줄」` 또는 `fail — 「한 줄」`. try 산출물은 미리 치우지 않는다(실제 CEO처럼). ship이 「CEO가 치운다」로 막으면 그때 치우고 「치웠다」고 말한다 — 프레임워크 FAIL이 아니라 CEO 접점 1로 센다(try 사본 장치가 들어오면 0이 되어야 한다).
3. 팀이 올린 결정: 「이미 충족」은 원문에 비춰 맞으면 「예 — 닫아라」. 원문 밖 보안 지적(공격이 짚은 것)은 「고쳐라」(버그 unit 하나). 팀이 정한 기본값은 그대로 둔다.
4. 매 말은 `turn.sh`가 `<폴더>-turn<n>.msg`로 남긴다 — 그 기록이 대리의 재량이 어디 들어갔는지의 증거다.
5. conductor가 질문 문장을 빠뜨리면(「위 질문」만) 그것을 지적하고 다시 묻게 한다 — 대신 짐작해 답하지 않는다.

## 절차 (정비 채널 세션에서)
```bash
B=/tmp/bench-$(date +%m%d-%H%M); mkdir -p $B          # 컨테이너 밖에 남지 않는다 — 결과는 이 문서에 적고 푸시
tests/field/setup.sh tests/field/briefs/ledger-cli.md $B/field1
tests/field/setup.sh tests/field/briefs/web-memo.md  $B/field2
tests/field/setup.sh tests/field/briefs/holdout-dupfind.md $B/holdout   # 홀드아웃 — 측정 모드로만
tests/field/turn.sh $B/field1 1 "<첫 말>"             # 출력의 session id를 적어 둔다
tests/field/turn.sh $B/field1 2 "<둘째 말>" <sid>      # 이후 매 턴 --resume
tests/field/watch.sh $B/field1:2 $B/field2:2          # Monitor로 걸면 ship·턴 끝마다 알림
node tests/field/table.mjs $B/field1                   # 표 + BENCH 한 줄
```
- 두 필드는 서로 독립이라 동시에 돌려도 된다(턴은 백그라운드로).
- 하네스 함정(프레임워크 결함 아님): 부모 세션의 `CLAUDE_*` 환경 누수 → `turn.sh`가 걷어 낸다 · 신뢰 안 된 작업 공간은 허용 목록 무시 → `setup.sh`가 신뢰를 켠다 · 필드 사본에서 `git worktree repair`를 치지 않는다(원본 링크를 빼앗는다 — 2026-10-01 정비 채널 실수).

## 점수 — 필드마다 한 줄
`BENCH` 줄(table.mjs) + 대리가 세는 셋: **프레임워크 FAIL 정지 수**(측정 모드에선 0 아니면 1 — 멈춘 단계와 줄) · **green 후 CEO 발견 결함**(tried fail) · **conductor 규율 이탈**(우회·스크립트 편집·CEO 파일 손댐·질문 누락). 비용은 마지막 턴 json의 `total_cost_usd`(세션 누적).

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
