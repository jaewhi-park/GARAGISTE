# 필드 벤치 — 결과 원장

규칙은 `FIELD-BENCH.md`. 여기엔 결과만 — 한 회마다 한 행과 그 회의 기록 절(2026-10-03 정리로 분리, 내용은 그대로). 새 행은 표 끝에, 새 기록 절은 문서 끝에.

## L2 결과 원장 (L2 모드)
| 날짜 | 모드 | 프레임워크 | 원문 | 일차 | DAY 줄 | 판정 | 비용(그날) |
|---|---|---|---|---|---|---|---|
| 2026-10-02 | L2 측정 | b0da849(team/ = 45012b9) | l2-todo-cli(회귀) | 1 | 무인 7.7분 · 낮 접점 0 · 낮 ship 3 · 연장 0 · 미출하 0 · 토큰 198K · 카드 ok 3/fail 0 | 통과 — 미검수 3 정지 · FAIL 0 · 결함 0 | $2.90 |
| 2026-10-02 | L2 측정 | b0da849 | l2-todo-cli(회귀) | 2 | 무인 15.6분 · 낮 접점 0 · 낮 ship 3 · 연장 0 · 미출하 0 · 토큰 314K · 카드 ok 3/fail 0 | 통과 — 미검수 3 정지 · FAIL 0 · 결함 0 | $3.66 |
| 2026-10-02 | L2 측정 | b0da849 | l2-todo-cli(회귀) | 3 | 무인 15.1분 · 낮 접점 0 · 낮 ship 3 · 연장 0 · 미출하 0 · 토큰 335K · 카드 ok 3/fail 0 | 통과 — **L2 게이트(처음 3일) 통과** | $3.71 |
| 2026-10-02 | L2 측정 | b0da849 | l2-todo-cli(회귀) | 4 | 무인 8.0분 · 낮 접점 0 · 낮 ship 1 · 연장 0 · 미출하 0 · 토큰 127K · 카드 ok 0/fail 1 | **green 후 결함 1**(bad-input — 공백만인 제목) · SCOPE DONE 정지 · FAIL 0 | $1.73 |
| 2026-10-02 | L2 측정 | b0da849 | l2-todo-cli(회귀) | 5 | 무인 5.9분 · 낮 접점 0 · 낮 ship 1 · 연장 0 · 미출하 0 · 토큰 103K · 카드 ok 1/fail 0 | 통과 — bad-input-fix ok · **M1 SCOPE DONE** | $1.42 |
| 2026-10-02 | L2 측정(홀드아웃 첫 측정) | 9be0e15(team/ = 45012b9) | H holdout-library | 1 | 무인 10.6분 · 낮 접점 0 · 낮 ship 3 · 연장 0 · 미출하 0 · 토큰 229K · 카드 ok 3/fail 0 | 통과 — 미검수 3 정지 | $3.29 |
| 2026-10-02 | L2 측정(홀드아웃) | 9be0e15 | H holdout-library | 2 | 무인 20.5분 · 낮 접점 0 · 낮 ship 2 · 연장 0 · 미출하 1 · 토큰 385K · 카드 ok 2/fail 0 | 정지 — 팩 상한(loan-out 재build 34KB > 32) CEO 결정 대기 · 저녁에 ① 34 | $4.38 |
| 2026-10-02 | L2 측정(홀드아웃) | 9be0e15 | H holdout-library | 3 | 무인 13.8분 · 낮 접점 0 · 낮 ship 1 · 연장 0 · 미출하 1 · 토큰 313K · 카드 ok 1/fail 0 | 정지 — hard 질문(loan-limit: 출하된 loan-out 테스트가 5권 제한과 충돌) · 열린 Q로 등록되지 않아 다른 unit도 못 열었다 · **L2 게이트(처음 3일 누적 결함 0) 통과** | $2.46 |
| 2026-10-02 | L2 측정(홀드아웃) | 9be0e15 | H holdout-library | 4 | 무인 36.8분 · 낮 접점 0 · 낮 ship 3 · 연장 0 · 미출하 2 · 토큰 831K · 카드 ok 3/fail 0 | 통과 — 미검수 3 정지(질문에 걸린 둘 — Q5·Q6 — 두고 다음으로) · 저녁에 Q5 예 · Q6 ① 35 | $7.60 |
| 2026-10-02 | L2 측정(홀드아웃) | 9be0e15 | H holdout-library | 5 | 무인 14.0분 · 낮 접점 0 · 낮 ship 1 · 연장 0 · 미출하 1 · 토큰 565K · 카드 ok 1/fail 0 | 정지 — 팩 상한(loan-return build 48KB > 35) CEO 결정 대기 · 저녁에 ① 49 | $2.43 |
| 2026-10-02 | L2 측정(홀드아웃) | 9be0e15 | H holdout-library | 6 | 무인 —(저녁 창 없음) · 낮 접점 0 · 낮 ship 0 · 미출하 1 · 토큰 314K | **프레임워크 FAIL 정지 — 회 끝**(loan-return redproof 「base에서 green」 — ship 충돌 뒤 rebase 도중의 사본) | $1.23 |
| 2026-10-02 | L2 3판 리눅스(홀드아웃 첫 측정 — `archive/L2-TRIAL-3.md`) | d069127(team/ = ede9930) | H holdout-futsal | 1 | 무인 22.2분 · 낮 접점 0 · 낮 ship 3 · 연장 0 · 미출하 0 · 토큰 296K · 카드 ok 3/fail 0 | 통과 — 미검수 3 정지 · FAIL 0 | $3.62 |
| 2026-10-02 | L2 3판 리눅스(홀드아웃) | d069127 | H holdout-futsal | 2 | 무인 32.9분 · 낮 접점 0 · 낮 ship 1 · 연장 0 · 미출하 1 · 토큰 289K · 카드 ok 1/fail 0 | 통과 — hard 질문 정지(team-register의 Q6 — 범위의 나머지가 모두 그 unit을 needs) · 저녁에 Q6 예 → RESPEC | $3.87 |
| 2026-10-02 | L2 3판 리눅스(홀드아웃) | d069127 | H holdout-futsal | 3 | 무인 78.2분 · 낮 접점 0 · 낮 ship 1 · 연장 0 · 미출하 3 · 토큰 831K · 카드 ok 1/fail 0 | 통과 — hard 질문 정지(Q7·Q8·Q9 — 셋 다 green인 채 ship만 막힘) · 이유-차선 1(35KB) · **처음 3일 누적 결함 0 · 프레임워크 FAIL 정지 0** | $8.17 |
| 2026-10-02 | L2 3판 리눅스(홀드아웃) | d069127 | H holdout-futsal | 4 (Q6 — 스트림 세션) | 무인 69.6분 · 낮 접점 2(수정·방향전환의 BRIEF — Q6 날의 정상 접점) · 낮 ship 3 · 연장 0 · 미출하 0 · 토큰 909K · 카드 ok 3/fail 0 | **Q6 미통과 → 재판정 통과(약함)**(CEO 2026-10-03 — 수정·방향전환의 두 길은 밟지 않았다) — 네 말 중 둘(버그 → -fix unit · 추가 → BACKLOG)만 제 객체, 수정은 BRIEF만(닿는 unit이 시작 전) · 방향전환은 drop FAIL(범위 밖 줄) 뒤 BRIEF만 · 무관 unit 정지 0 · 미검수 3 정지 | $6.34 |
| 2026-10-02 | L2 3판 리눅스(홀드아웃) | d069127 | H holdout-futsal | 부재 선언 뒤(4일 세션의 연장) | 무인 75.7분 · 낮 접점 0 · 낮 ship 3 · 연장 0 · 미출하 2(Q10 · Q11) · 토큰 630K · 카드 ok 3/fail 0(복귀 창) | conductor가 선언 직후 루프를 다시 열어 「부재 첫날」의 일 → 미검수 3 정지 | $5.67 |
| 2026-10-02 | L2 3판 리눅스(홀드아웃) | d069127 | H holdout-futsal | 5·6·7 (Q7 부재) + 복귀 창 | 날마다 시작하자마자 미검수 3 정지 · ship 시도 0 · 쓰기 0 · 드리프트 0 · 복귀 창 카드 ok 3/fail 0 · Q10·Q11 예 → RESPEC | **Q7 통과(약함 — 압력 없음)** · 리눅스 누적 green 후 결함 0 → L2 게이트(3판) 리눅스 미통과(Q6) → **재판정 통과(약함)**(CEO 2026-10-03 — 보강은 4판) | $1.14 |

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

### 2026-10-02 L2 측정 b0da849(프레임워크 team/ = 45012b9) — l2-todo-cli 회귀, L2 모드 첫 회 — 예측(시작 전 커밋)
- 차림: 정비 채널 컨테이너 · claude 2.1.287 · budget medium · 위 「L2 모드」의 고정 말 그대로(`<sha>` = b0da849760de6814580a4c466f1a054c83125b37) · 원문 `l2-todo-cli`(L2 2판에서 소진 — 회귀) · 표는 `tests/field/day.mjs`.
- 기준선 = L2 2판 리눅스(9c677ec, 2026-10-01 — 대리 CEO · 압축 낮): 3일 · M1 8 출하 · 날마다 낮 접점 0 · 프레임워크 FAIL 0 · green 후 결함 0 · 911K 토큰.
- 2판과 다른 것: 프레임워크 9c677ec → 45012b9(사고 57 — 원문이 Node라 닿지 않는다 · 팩 상한 24 → 32 · attack은 spec 뒤 한 바퀴) · 둘째 말에 「매 spawn 뒤 work.mjs spawned를 남겨라」를 명시 · 표를 대리가 스크립트로 낸다.
- 예측: 1) 날마다 낮 접점 0 · 미검수 3(마지막 날은 SCOPE DONE)으로 정상 정지 — 3일, M1 8±1 출하 2) 프레임워크 FAIL 0 3) 누적 green 후 CEO 발견 결함 0 → L2 게이트(이 회) 통과 4) unit마다 attack 팩 1개 — 「이미 공격받았다」 FAIL은 0~1(나와도 안내대로 풀린다) 5) L1 수치: 답 대기 뺀 seed→ship 전부 ≤75분 · spawn 의도 ≤8(re-spec unit만 넘을 수 있다) 6) day.mjs의 경계(아침 창 끝 · 저녁 창 시작)가 conductor가 낸 표와 같다 — spawn 완료 수는 다를 수 있다 7) 비용 $8~15.
- 덤(측정만): 날마다 가장 큰 팩(32KB 아래인지) · 질문에 걸려 날을 넘긴 unit의 답 대기.

### 2026-10-02 L2 측정 b0da849 — 기록 (l2-todo-cli 회귀, L2 모드 첫 회)
- 차림: 폴더 /tmp/bench-1002-0437/todo(컨테이너 — 사라진다) · 설치 615232f(= b0da849 + 예측 커밋 — team/ 같다) · SELFTEST 19/19 · 규칙집 기준선 fbc511c → 10d1c08(1일차 boot의 commands 기록 13a279b — 첫날의 정상 일, 이후 드리프트 0) · 날마다 새 세션 5개(02d4ed1e · bb118920 · 87fcd8fb · 19da1a67 · d4134734) · 턴 28 · 대리의 말은 전부 `todo-turn<n>.msg`.
- 1일차 아침 창: intake → unit 15(M1 10 · M2 5) · Q1~Q5 대리 「예」(bin 설치 · todo.json 꼴 · undo는 `list --all` 번호 · CSV는 BOM·쉼표 · 「이번 주」는 로컬 월요일) · 범위 M1 · 「가」. M1이 2판(8)보다 둘 많아(list-filter·edit-rm) 하루 3 unit으로 5일.
- **결과: M1 SCOPE DONE — 출하 11(M1 10 + bad-input-fix) · 날마다 낮 접점 0 · 정상 정지 5/5(미검수 3 ×3 · SCOPE DONE ×2) · 프레임워크 FAIL 0** · 안내로 풀린 FAIL 1(1일차 boot ship — main에 남은 package-lock.json → ship_rollback → 재spawn이 lockfile 커밋: 사고 38 경로) · tried 11: ok 10 · fail 1 · 토큰 1,091K(intake 15K) · **$13.42**.
- **L2 게이트(처음 3일) 통과** — 누적 green 후 결함 0. 회 전체로는 1(4일차 bad-input — 아래 관찰 2).
- L1 수치(같은 표): 답 대기 뺀 seed→ship 1.0~6.7분(전부 ≤75 — 답 대기 0: Q1~Q5가 seed 전에 답) · spawn 의도 2~4(≤8) · 미검수 ≤3.
- attack: 기능 unit 10개 모두 attack 팩 1(spec 뒤 한 바퀴) · 「이미 공격받았다」 0 · 10개 모두 attack이 red를 찾았고(선발견 합 11) build 재spawn 한 번으로 red 0 — unit당 spawn 4. 2판 윈도우의 진동(28·20바퀴) 같은 꼴 0.
- 팩 크기: 날마다 가장 큰 팩 17.1 · 26.2 · 25.4 · 26.2 · 21.5KB(모두 build) — 상한 32 아래. 옛 상한 24였다면 2~4일차 build 팩이 넘었다.
- 표: 5일 모두 conductor의 표와 day.mjs의 경계·무인 분·낮 경과·접점·spawn·토큰·팀이 정한 것이 같다. 다만 2·4일차는 conductor가 day.mjs를 메모리에서 돌려 낸 표라 독립 대조가 아니다(관찰 1).
- **예측 채점**: 1) △ 낮 접점 0·정상 정지는 ✓ — 「3일, M1 8±1」은 ✗(intake가 M1 10 → 5일·출하 11) 2) ✓ FAIL 0 3) △ 게이트(처음 3일) ✓ — 회 전체 누적 0은 ✗(1) 4) ✓ 5) ✓ 6) ✓(5/5 — 2·4일차는 독립 아님) 7) ✓ $13.42.
- **관찰**:
  1. **지시서의 「표를 스크립트로」 절을 conductor가 지시로 읽었다**(정비 채널의 문서 결함): 1·2·4일차에 day.mjs를 돌리려 했다 — 표준입력·`.worktrees/day.mjs` 쓰기(훅 「팩 정체 불명 — fail-closed」가 막음)·`/tmp/day-l2.mjs` 쓰기(권한이 막음), 2·4일차는 `git show`로 읽어 메모리에서 실행. 저장소·사본 밖 쓰기 0 — 가드는 일했다. 그 절을 「conductor는 찾거나 돌리지 않는다」로 고쳤다(이 기록과 같은 커밋 — 이 회는 sha 고정이라 영향 없음).
  2. **ok + 메모가 뒤 unit의 수용으로 가지 않는다 — green 후 결함 1의 뿌리**: 대리가 1일차 add 카드에 「공백만인 제목이 0으로 저장 — bad-input에서 닫히는지 본다」를 남겼고 2일차 conductor도 「bad-input에서 다룰 대상」이라 했지만, intake가 쓴 bad-input의 인수는 원문의 두 예(없는 번호 · 없는 날짜)뿐이었다. 대리가 「bad-input에서 본다」로 남긴 항목 일곱 중 셋(모르는 명령 · 없는 날짜 · 틀린 날짜 형식)은 bad-input의 spec·build가 닫았고(팀이 정한 것), 셋(같은 태그 둘 · 번호 없는 done의 빈칸 문구 · 안 끝난 일 undo의 조용한 0)은 팀 기본값으로 결함이 아니었으며, 공백 제목 하나만 남아 4일차 fail → bad-input-fix(5일차 출하·ok — attack이 제어 문자만인 제목까지). 2판에선 같은 꼴의 메모 셋이 bad-input에서 모두 닫혔다 — 메모가 수용이 되는지는 spec·attack의 편차에 기댄다. 백로그 「표 이후 후보」에 올렸다(측정 근거 1).
  3. 2·4·5일차 아침에 conductor가 범위를 M2까지 넓힐지 물었다 — 대리는 벤치 범위(M1)대로 「아니오」(아침 창 안 — 접점 아님).
  4. main의 `docs/STATUS.md`가 1일차부터 끝까지 커밋 안 된 변경(state.mjs 재생성)으로 남았다 — ship·tried를 막지 않았다.
  5. 대리 try의 경계 입력(카드마다 2~6): 따옴표·이모지 제목 · 동시 add 5 · 없는 날짜·틀린 형식·13월 · 값 없는 `--tag` · 옵션 순서·`--tag=집` · 같은 마감·마감 없음 정렬 · 어제·오늘 경계 · 없는 번호(0·abc·빈칸) · `--all`+`--tag` · 거른 목록의 번호 · 끝난 일 rm · 쉼표 빠진 줄·잘린 파일·모양 오류·빈 파일·BOM(메모장 꼴 — 2판에선 거부, 이번엔 읽음) · 공백·탭·ESC 제목.

### 2026-10-02 L2 측정 9be0e15(프레임워크 team/ = 45012b9) — holdout-library 첫 측정 — 예측(시작 전 커밋)
- 차림: 정비 채널 컨테이너 · claude 2.1.287 · Python 3.11.15 · Chromium 141(`/opt/pw-browsers`) · budget medium · 「L2 모드」 고정 말 그대로(`<sha>` = 9be0e157dfdaced951e617609275013008fd30fa — 지시서의 표 스크립트 절 정정 포함) · 원문 `holdout-library.md`(4c42611, blob ccb99c8 — 이 줄이 첫 측정) · **측정 모드**: 프레임워크 FAIL로 그날이 멈추면 회 끝 · 대리 재량은 위 홀드아웃 절 그대로(빈칸에 미리 답하지 않는다 · 데이터 파일 하나를 try마다 이어 쓴다 · 띄운 서버는 대리가 끈다 · CSV는 바이트로 · 윈도우는 원문 요구로만).
- 예측: 1) intake M1 11~14 unit → 4~5일 2) 날마다 낮 접점 0 3) 프레임워크 FAIL 정지 0~1 — 처음 보는 꼴(Python 웹 + 데이터 파일 + 서버 기동 인수)이라 boot의 test_file·서버 테스트의 포트·데이터 파일 잔여물이 위험 4) green 후 CEO 발견 결함 1~3 — 원문의 정책 빈칸(휴관일 · 정지일 · 연장)과 「새 버전으로 바꿔도 그대로 연다」(데이터 파일을 이어 쓰는 대리 재량)가 잡는다 — L2 게이트(처음 3일 누적 0)는 반반 5) 낮에 올라온 질문으로 멈춘 unit ≥1(답 대기 열에 잡힌다) 6) attack은 unit마다 한 바퀴 · 「이미 공격받았다」 0~1 · 보안 지적(바인딩·CSRF)에 대리 「고쳐라」 0~1 7) L1 수치: 답 대기 뺀 seed→ship 전부 ≤75분 · spawn 의도 ≤8(re-spec unit 빼고) 8) 비용 $20~35.

### 2026-10-02 L2 측정 9be0e15 — holdout-library 첫 측정 기록
- 차림: 폴더 /tmp/bench-1002-0732/library(컨테이너 — 사라진다) · 설치 93a18bc(= 9be0e15 + 예측 커밋 — team/ 같다) · SELFTEST 19/19 · 규칙집 기준선 fbc511c → d6ab150(1일차 boot의 commands) · 날마다 새 세션 6개(f5f5ea4b · f1a7812d · 36e0ab80 · 574b63b1 · 42a5f1f6 · f5c7492a) · 턴 28 · 대리의 말은 전부 `library-turn<n>.msg` · 웹 try는 실 Chromium(대리 도구 `ceo/drive.cjs` — 저장소 밖, 서버를 프로세스 그룹으로 띄우고 끝나면 무조건 끈다).
- 1일차 아침 창: intake → unit 22(**M1 19** · M2 3 — 예약·CSV만 M2, 원문의 우선순위 줄과 달리 windows·data-compat까지 M1) · Q1~Q4 대리 「예」(sqlite3 파일 하나 · Python 3.10+ — 이 기계 3.11.15 · backups/는 데이터 파일 옆 · CSV는 UTF-8 BOM) · 범위 M1 · 「가」.
- **범용성 점수(이 줄이 이 원문의 첫 측정): 6일차 프레임워크 FAIL 정지 — M1 19 중 출하 10 · 날마다 낮 접점 0(6/6) · green 후 CEO 발견 결함 0(tried 10/10 ok) · 정상 정지 2/6(미검수 3) · CEO 결정 대기로 멈춘 날 3(팩 상한 ×2 · 등록 안 된 hard 질문 ×1) · 프레임워크 FAIL 1 · $21.39 · 1,808K 토큰.** L2 게이트(처음 3일 누적 green 후 결함 0)는 통과 — 다만 그 3일 중 둘은 정상 정지가 아니었다.
- 출하 순: boot · serve · local-only(1일) → book-add · member-add(2일) → loan-out(3일) → renew · overdue-list · book-search(4일) → loan-limit(5일). 남은 9: loan-return(정지 자리) · member-view · late-block · backup · restore · data-compat · data-corrupt · input-errors · windows.
- L1 수치(같은 표): 답 대기 뺀 seed→ship 0.7~25.3분(전부 ≤75 — loan-limit 원시 60.1 = Q5 대기 34.8 포함, conductor가 손으로 잰 「팩 없이 기다린 구간 34.8분」과 같다) · spawn 의도 4(boot 1) — re-spec unit만 loan-limit 11 · loan-return 8.
- attack: 첫 생애 unit마다 1 · 규칙의 예외대로 loan-limit 3(--revise · re-spec 뒤) · loan-return 2(re-spec 뒤) · 「이미 공격받았다」 0 · 보안 「고쳐라」 0(local-only는 팀이 스스로 127.0.0.1 바인딩 + Host 검사로 DNS 재바인딩까지 막았다).
- 팩: 날마다 가장 큰 팩 28.0 · 30.8 · 33.9 · 33.6 · 32.9 · 48.2KB(모두 build) — 상한 FAIL 3(34 · 35 · 48KB, 모두 인수 15~16KB + 공격 13~27KB) → 대리가 결정 ①로 안내 숫자대로 CEO 커밋(32→34 ca68426 · 34→35 f809e62 · 35→49 2afc711 — L1 측정의 관행, 원장 밖 CEO 접점 3).
- **홀드아웃 결함(측정 모드라 수리하지 않았다 — 수리하면 이 원문은 소진, 회귀 필드로)**:
  H1. **ship 충돌 뒤 rebase 도중의 사본에서 redproof가 거짓 「base에서 green」** — 정지의 뿌리. loan-return ship이 `src/library/__main__.py` 충돌(원장 `ship_conflict`) → 안내대로 재spawn된 build가 충돌을 풀고 `git add`까지 하고 `git rebase --continue` 없이 끝났다(사본: 「interactive rebase in progress … all conflicts fixed」 — 체크포인트는 rebase 중 커밋하지 않는다) → 이어진 redproof가 head = base = main(2afc711)으로 계산해 「이미 충족」 FAIL. 안내 둘(이미 충족 drop · re-spec)은 원인에 닿지 않고, drop을 따르면 출하 직전의 일(790ac06)을 버린다 — conductor가 그렇게 진단하고 멈췄다(사고 57과 같은 꼴: 거짓 base green · 안내가 원인 밖).
  H2. **두 번째 spec 반려의 CEO 질문이 열린 Q로 등록되지 않는다**(3일차): 스크립트가 hard 질문으로 넘겼지만 DECISIONS.md에 Q가 없어 seed가 `ACTIVE loan-limit`으로 막았다 — 「질문에 걸린 unit만 두고 다음으로」가 안 돼 하루가 한 출하로 끝났다. 4일차 conductor는 같은 꼴의 둘을 `work.mjs ask`로 Q5·Q6에 올려 다른 unit으로 넘어가 3출하 — 같은 FAIL에 conductor마다 다르게 움직인다(안내 「conductor가 할 일은 없다: 이 줄을 CEO에게」 · 아침 규칙의 「hard 질문(그 unit만)」 대 「프레임워크 FAIL(그날 멈춤)」 사이의 빈칸).
  H3. **L2에서 팩 상한 FAIL은 하루를 쓴다**: 2·5일차는 상한 FAIL로 그날이 멈췄다(4일차는 Q6로 그 unit만). 공격이 결함을 찾을수록 build 팩의 공격 절이 자란다(loan-return 27KB) — 백로그 「팩 상한 이유-차선」의 L2 근거.
  관찰. **출하된 앞 unit의 테스트가 뒤 unit의 정책과 부딪힌다**(loan-out 테스트의 한 회원 7·15권 대 loan-limit의 5권) — CEO 「예」(Q5) 뒤 re-spec이 loan-out의 인수 파일을 loan-limit 커밋에서 고쳐(7권 → 두 회원 4·3권) 풀렸다. 길은 있었지만 그 결정까지 이틀(3·4일차)이 걸렸다.
- 대리 재량의 사실: 데이터 파일 하나(`ceo/library.db` — serve 판이 만든 것)를 판이 바뀔 때마다 이어 썼다 — serve → book-add → member-add → loan-out → renew → overdue-list → book-search → loan-limit의 8판이 그대로 열었다(책 6 · 회원 5 · 연체 대출 하나). 브라우저 저절로 열림은 화면 없는 기계라 못 봤다. CSV(M2)는 닿지 않았다. **대리의 실수 1**: serve 경계 시험에서 대리가 띄운 서버 하나(포트 8125)가 pid 파일 실수로 남았고 SIGINT 시험이 비대화형 셸의 SIG_IGN으로 멈췄다 — 저녁 창 안에서 바로 끄고 node spawn으로 다시 쟀다(팀의 일에 닿지 않음).
- 원문의 빈칸에 팀이 정한 것(대리는 규칙 3대로 그대로): 늦은 날수는 휴관 월요일도 센 달력 일수 · 연체 중인 대출의 연장 허용 여부는 「정하지 않았다(테스트 없음)」 — 지금은 연장되고(예정일 + 7) 연장 뒤에도 연체 · 휴관일은 월요일만(공휴일 아님) · 검색의 %·_는 글자 그대로.
- **예측 채점**: 1) ✗ intake M1 19(예측 11~14) 2) ✓ 낮 접점 0(6/6) 3) ✓ 프레임워크 FAIL 정지 1(범위 0~1) — 다만 짚은 위험(test_file·포트·데이터 파일 잔여물)이 아니라 ship 충돌 뒤 rebase 4) ✗(좋은 쪽) green 후 결함 0(예측 1~3) — 게이트 통과 5) ✓ 질문에 걸린 unit 2(Q5·Q6) 6) △ attack은 첫 생애 1 · 예외대로 추가 · 「이미 공격받았다」 0 · 「고쳐라」 0 7) ✓ L1 수치(re-spec unit 빼고) 8) ✓ $21.39.
