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
