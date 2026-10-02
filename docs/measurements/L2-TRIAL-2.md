# L2 시험 — 재등록 (무인 하루, 2판)

2026-10-01 등록 · **머지가 CEO 서명** · 시험대: **새 빈 폴더 두 곳 — 리눅스(정비 채널의 클라우드 컨테이너, 대리 CEO) · 윈도우(CEO PC, CEO)**, 원문 공통 `tests/field/briefs/l2-todo-cli.md`(아래 「2판 수정」) · **프레임워크 동결: 9c677ec**(team/·install — 수정의 머지는 문서·원문뿐이라 프레임워크는 같다).
이 문서는 시험 **전에** 커밋된다. 1판(`L2-TRIAL.md`, 동결 3b8aede)의 1일차 통과는 그 판의 기록으로 남고, **게이트는 환경마다 0/3부터** 센다.

## 왜 재등록인가
1판은 시험 중 「결함 수리만, 장치 추가·흐름 변경은 표 뒤」로 동결했다. 그 뒤 필드 시험·필드 벤치·홀드아웃에서 사고 27~56을 수리했고, 장치도 들어갔다(try 사본 · full의 인수·공격 파일 · `{files}` · 부분 충족 `--met` · tried fail의 재현·`-fix` 범위 · `add --replace` · `GOFLAGS -count=1`) — 1판의 동결과 다른 판이다. 1판을 이어 세면 판이 다른 날들을 한 게이트에 섞는다(CEO 결정 2026-10-01, A안).

## 무엇을 재나 — 1판과 같다
- **Q5 무인 하루**: 아침 창 한 번(결정·범위·「가」) → 낮 CEO 접점 0 → 저녁 창에 try 카드 ≥3장.
- **L2 게이트**: 무인 하루 **3회**(한 주 평일) 누적 「green 이후 CEO 발견 결함」 0.
- 이 등록 밖: Q6 인터럽트 실사격 · Q7 우아한 정지(부재 3일) — 3일 표 뒤 따로 등록한다.
- 하루의 모양 · 시계·지표 · 판정은 `L2-TRIAL.md`의 그 절 그대로다. 저녁 지시서는 `L2-day-conductor.md`(이 등록과 함께 try 사본을 반영한 판).

## 1판과 달라진 시험 조건 (판이 바뀌어 하루의 흐름에 닿는 것만)
1. **try는 사본에서** — 저녁 창의 conductor가 카드마다 `work.mjs try <slug>`로 `.worktrees/try-<slug>`를 열어 준다. CEO는 그 폴더에서 치고 `tried`가 사본을 지운다. try 산출물이 main을 더럽혀 다음 ship을 막던 일(1일차 eoren.sqlite)이 0이어야 한다. **저녁 CEO-분은 1판과 직접 비교하지 않는다** — 저녁의 흐름이 바뀌었다.
2. **tried fail엔 CEO 말 한 줄**(사고 45) — 그 말이 `<slug>-fix`의 재현이고, `-fix`는 범위 맨 앞에 든다(사고 46): 저녁의 fail이 다음 아침의 첫 unit이다.
3. **full은 「전부」**(사고 44) — 프로젝트 러너 뒤에 모든 unit의 인수·공격 파일을 `test_file`로 다시 돈다. 러너가 이미 그 파일들을 집는 생태계면 두 번 돈다 — `test_file`이 `{files}`면 디렉터리마다 한 번에(사고 48·53). 표에 unit당 full 시간을 남긴다.
4. 안내가 늘었다 — 부분 충족 redproof의 `--met`(사고 47), BACKLOG 줄 정정 `add --replace`(사고 50), `--help`는 부작용 없음(사고 51), 예외도 한 줄 FAIL(사고 50). 프레임워크 FAIL로 셀 자리가 줄어든 것이지 멈춤 규칙이 바뀐 것은 아니다.

## 동결 규칙 — 1판과 같다
- 시험 중 프레임워크는 위 커밋에 고정. 결함 수리는 허용(정본 먼저 → 반영 블록 → HAZARDS·CHANGELOG), 장치 추가·흐름 변경은 금지 — 표가 나온 뒤에. 수리로 unit을 재시작하면 「시도 n」.
- 무인 날의 프레임워크 FAIL: conductor는 그 줄 전문을 남기고 그날 멈춘다.

## 준비 (첫 아침 전 1회 — 이것이 끝나야 1일차)
1. **Windows 점검** — 사고 38~56과 try 사본은 리눅스에서만 검증됐다. CEO PC에서 이 수정이 머지된 main의 GARAGISTE를 받아 `node --test "tests/*.test.mjs"` 전부 초록. 빨간 줄은 정비 채널로 — 수리하면 동결 커밋을 새로 정해 이 문서에 적는다(시험 전이라 허용).
2. **설치(두 환경 같게)** — 빈 폴더 + `docs/BRIEF-draft.md`(원문 그대로) → 이 수정이 머지된 main의 fresh clone에서 설치 `-Budget medium`(리눅스 `tests/field/setup.sh` · 윈도우 `install.ps1 claude -Project <폴더> -Budget medium`). 시험 중 재설치·models 변경 금지.
3. **정션 점검(윈도우)** — 의존성 링크는 정션이다. 프로젝트에 의존성 디렉터리가 생기면 그 뒤 첫 ship 직후 main의 그 디렉터리가 그대로인지 한 번 본다 — 사라졌으면 프레임워크 FAIL로 멈추고 정비 채널로.
4. **규칙집 기준선** — 설치 직후 `git rev-parse HEAD:.garagiste`를 1일차 표 머리에.

## 2판 수정 (2026-10-01 — 서명 뒤 첫 아침 전, CEO 결정)
- **처음부터, 두 환경** — G2_TEST5 대신 새 원문으로 빈 폴더에서 시작한다. 같은 원문이라 한 환경에서만 나는 문제(경로·줄바꿈·정션)가 갈린다. 원문은 수리에 쓰인 적 없는 것이라 첫 측정은 범용성 점수도 된다(FIELD-BENCH 홀드아웃 규칙 — 이 시험이 끝나면 소진).
- **게이트는 환경마다** — 리눅스·윈도우 각각 무인 하루 3회 누적 「green 후 CEO 발견 결함」 0. 둘 다 통과해야 L2 통과. CEO가 맥도 쓰므로 리눅스(POSIX)도 따로 센다.
- **1일차 아침 창은 intake부터** — CEO 첫 말: `L2-day-conductor.md`의 한 줄 + 「docs/BRIEF-draft.md로 brief를 축적하고 intake를 돌려라. 질문은 한 줄씩 예/아니오로 — 대신 답하지 않는다」 → 답 → 「범위는 M1 전부 — 가」 → 떠난다. 2·3일차 아침은 지시서 그대로(범위가 끝났으면 CEO가 다음 범위를 준다).
- **리눅스의 CEO는 대리다(CEO 위임)** — 정비 채널이 `FIELD-BENCH.md`의 대리 규칙 1~5대로 답하고 try한다(try는 사본에서 · 카드대로 + 원문의 경계 입력 2~3개 · 「이미 충족」은 원문에 비춰 · 팀 기본값은 그대로). conductor는 중첩 헤드리스(`tests/field/turn.sh`) — **날마다 새 세션**이고 낮은 실제로 비우지 않는다(압축): 낮 경과·seed→ship은 원장 ts 그대로, 무인 분은 적지 않는다. 표의 tried 열은 「(대리 CEO)」. 대리는 팀과 같은 모델 계열이라 green 후 결함을 덜 찾는 쪽으로 기울 수 있다 — 그 한계를 알고 센다.

## 2판 수정 2 (2026-10-02 — 윈도우 2일차 전, CEO 결정)
- **윈도우 침대의 팩 상한 24 → 32KB** — 정본 기본값(0ab3a05)과 맞춘다. 근거: 필드 벤치의 build 팩 상한 FAIL이 회차마다 CEO 결정 ①로 갔다(28·29·31KB). 윈도우 1일차 표엔 팩 상한 FAIL이 없고, 리눅스 게이트(통과)는 24로 끝났다 — 윈도우 2·3일차는 32 아래의 날이다. 반영은 CEO가 PowerShell 블록으로(정비 채널이 전달) · 확인은 2일차 표 머리의 `pack_kb_max`.
- 같은 날 정본의 사고 57 수리(test_file 0건 green)는 침대에 반영하지 않는다 — 원문이 Node(`node --test`)라 닿지 않는다.

## 예측 (채점 대상 — conductor에게는 주지 않는다)
1) 하루 3 unit 출하 뒤 미검수 3으로 정상 정지, 낮 경과(아침 창 끝 → 세 번째 ship) ≤90분 2) 낮 접점 0 3) 프레임워크 FAIL ≤1/일 4) 저녁의 try 산출물로 막힌 ship 0 5) 하루 green 후 CEO 발견 결함 0 — 다만 3일 누적 0은 이 판의 가장 큰 위험이다(필드 벤치의 파이썬 필드에서 attack이 경계 입력을 놓쳐 CEO try가 잡은 회차 7회 중 3회) 6) 저녁 창 CEO-분 ≤15(윈도우만 — 1판과 비교하지 않는다) 7) 환경마다 따로 채점한다 — 윈도우에서만 나는 프레임워크 FAIL이 1회 이상(사고 38~56·try 사본이 리눅스에서만 검증됐다: 경로·줄바꿈·정션).

## 표 이후 후보 — 이 등록에 넣지 않는다 (CEO 「가」 대기)
- 미검수 상한(무인 처리량 — 1판 1일차: 무인 376분 중 작업 ≈29분) · attack 보강(green 후 결함 ≠ 0이면: effort 재연 실험 → system-attack) · try 위임(가드가 사본 안 쓰기를 허용) · 팩 이유-차선 · session-start 주입 · Q6·Q7 등록.

## n일차 표·판정
(1일차부터 이 아래에 — 양식은 `L2-TRIAL.md` 1일차 표와 같다. 1판과 다른 열: unit당 full 시간(사고 44), 저녁 try 사본 수.)

### 리눅스 1일차 (2026-10-01 — 대리 CEO, 압축 낮)
폴더 /tmp/l2-linux/todo(컨테이너) · 설치 44f4d62(프레임워크 = 9c677ec) · 규칙집 기준선 00d7f16(설치 직후) → f96424c(저녁) · conductor 세션 1b5b47cb(1일차 하나)
- 아침 창: intake → unit 13(M1 8 · M2 5) · Q1~Q6 대리 답(Q4는 「보이는 번호 = 명령의 번호」 조건을 붙여 예) · 범위 M1 · 「가」. 아침 창 끝 15:28:06Z → 저녁 창 시작 15:37:08Z.
- 낮: 접점 0 · 멈춤 미검수 3(list ship 15:36:21Z) · 낮 경과(→ 세 번째 ship) 8.2분 · 프레임워크 FAIL 0(안내대로 한 번에 풀린 FAIL 2 — spawned의 팩 이름(사고 52 안내) · boot ship의 main stray package-lock.json → 되돌림·보존·재spawn이 lockfile 커밋(사고 38)).
- 규칙집 드리프트 1: bdb24c4 boot의 commands 기록(`.garagiste/team.json`) — 첫날 boot의 정상 일이지 완화가 아니다. 이후 날의 기준선은 f96424c.

| 구간 | unit | 시도 | seed→ship(분) | spawn | 토큰 | attack | redproof | tried | green 후 결함 | FAIL |
|---|---|---|---|---|---|---|---|---|---|---|
| 무인 | boot | 1 | 1.2 | 2/2 | 32K | — | scaffold | ok(대리 CEO) | 0 | 0 |
| 무인 | add | 1 | 3.2 | 4/4 | 76K | 1→0/1 | base_red head_green | ok(대리 CEO) | 0 — 메모: 없는 날짜·형식 틀린 날짜가 그대로 기록(원문 「잘못된 입력」 줄 = bad-input unit에서 닫히는지 본다) | 0 |
| 무인 | list | 1 | 3.8 | 4/4 | 91K | 1→0/1 | base_red head_green | ok(대리 CEO) | 0 | 0 |
| 계 | 3 | | 8.2 | 10/10 | 198K | | | 3 ok | 0 | 0 |

- 저녁: try 사본 3(카드마다 conductor가 열고 tried가 지움 — 저녁 뒤 `.worktrees` 비었고 main 깨끗) · 카드 3/3 ok · 팀이 정한 것 7.
- 참고(사실): 권한 훅이 `$변수` 확장이 든 Bash 몇 번을 막았다(「Contains simple_expansion」 — 하네스 권한, 사고 43의 이웃) · `brief.mjs build` 인자 없이 한 번.
- **판정: 리눅스 1일차 통과 — 게이트(리눅스) 1/3**, 누적 green 후 CEO 발견 결함 0.

### 리눅스 2일차 (2026-10-01 — 대리 CEO, 새 conductor 세션 feaad184)
- 아침 창: 새 세션이 원장·STATUS만으로 상태를 다시 읽었다(안 본 것 0/3 · 결정 대기 0 · M1 3/8) → 「가」. 아침 창 끝 15:37:58Z → 저녁 창 시작 16:03:07Z, 낮 경과(→ 세 번째 ship) 24.0분.
- 낮: 접점 0 · 멈춤 미검수 3(store-corrupt ship 16:01:56Z) · 프레임워크 FAIL 0 · 규칙집 드리프트 0(HEAD:.garagiste f96424c 그대로).
- **질문에 걸린 unit만 두고 다음으로**: list-filter가 낮에 팀이 올린 Q7(「--tag 되풀이는 하나라도/전부」)로 ship이 막히자 conductor는 그 unit만 두고 edit-rm을 seed했다(낮 규칙의 예외 그대로). 저녁에 Q7 「예(하나라도)」 → RESPEC list-filter(3일차로).

| 구간 | unit | seed→ship(분) | spawn | 토큰 | attack | redproof | tried | green 후 결함 | FAIL |
|---|---|---|---|---|---|---|---|---|---|
| 무인 | done-undo | 5.1 | 4/4 | 109K | 1→0/1 | base_red head_green | ok(대리 CEO) | 0 — 메모: 없는 번호의 거부 이유가 「번호가 필요하다」로 틀림(bad-input에서) | 0 |
| 무인 | list-filter | 미출하 — Q7 | 4/4 | 101K | — | — | — | — | 0 |
| 무인 | edit-rm | 5.2 | 4/4 | 110K | 1→0/1 | base_red head_green | ok(대리 CEO) | 0 — 메모: edit의 빈 제목을 exit 0으로 저장(bad-input에서) | 0 |
| 무인 | store-corrupt | 7.9 | 4/4 | 122K | 1→0/1 | base_red head_green | ok(대리 CEO) | 0 — 메모: BOM이 붙은 정상 파일도 깨졌다고 거부(원문은 손편집 읽기를 요구하지 않음 — cross-os에서) | 0 |
| 계 | 4(출하 3) | 18.2 | 16/16 | 442K | 선발견 3 | 3 PASS | 3 ok | 0 | 0 |

- 저녁: try 사본 3(저녁 뒤 남은 것은 list-filter의 unit worktree뿐) · 카드 3/3 ok · Q7 decide · 팀이 정한 것 8 · main 변경은 스크립트가 쓴 DECISIONS·STATUS뿐.
- **판정: 리눅스 2일차 통과 — 게이트(리눅스) 2/3**, 누적 green 후 CEO 발견 결함 0(메모 4 — 셋은 bad-input이 닫아야 한다).

### 리눅스 3일차 (2026-10-01 — 대리 CEO, 새 conductor 세션 ba67ec93)
- 아침 창: 새 세션이 상태를 다시 읽었다(M1 6/8 · list-filter 진행 중 · 결정 대기 0) → 범위 그대로 「가」. 아침 창 끝 16:04:27Z → 저녁 창 시작 16:20:45Z.
- 낮: 접점 0 · 멈춤 SCOPE DONE(bad-input ship 16:19:52Z) · 프레임워크 FAIL 0 · 규칙집 드리프트 0(f96424c 그대로).

| 구간 | unit | seed→ship(분) | spawn | 토큰 | attack | redproof | tried | green 후 결함 | FAIL |
|---|---|---|---|---|---|---|---|---|---|
| 무인 | list-filter | 27.7(Q7 대기 17.9 포함 — seed는 2일차 낮) | 9/9 | 221K | 2→0/2 | base_red head_green | ok(대리 CEO) | 0 | 0 |
| 무인 | bad-input | 7.3 | 4/4 | 137K | 1→0/1 | base_red head_green | ok(대리 CEO) | 0 — 1·2일차 메모 셋(없는·형식 틀린 날짜 · edit 빈 제목 · 없는 번호의 이유)이 여기서 닫혔다 | 0 |
| 계 | 2 | 35.0 | 13/13 | 358K | 선발견 3 | 2 PASS | 2 ok | 0 | 0 |

- 저녁: try 사본 2 · 카드 2/2 ok(SCOPE DONE의 규칙대로 정지라 3장 미만도 통과) · main 변경은 STATUS뿐.
- **판정: 리눅스 3일차 통과.**

### 리눅스 게이트 판정 — **통과** (대리 CEO)
- 무인 하루 3회 · 누적 「green 후 CEO 발견 결함」 0 · 낮 접점 0/0/0 · 프레임워크 FAIL 0/0/0 · 규칙집 드리프트(boot의 첫날 commands 기록 외) 0 · 멈춤 미검수 3 / 미검수 3 / SCOPE DONE.
- 계: ship 8(M1 전부) · tried 8 ok · 팩 35 · 토큰 911K · 질문 Q1~Q7(Q7은 낮에 팀이 올림 — 그 unit만 두고 진행) · RESPEC 1 · API 환산 ≈ $10.4(세 세션 합).
- 예측 채점(리눅스): 1) ✓ 미검수 3 정지 — 세 번째 ship까지 8.2분·24.0분(3일차는 SCOPE DONE) 2) ✓ 낮 접점 0 3) ✓ FAIL 0/일 4) ✓ try 산출물로 막힌 ship 0 5) ✓ green 후 결함 0 6) — (윈도우) 7) 윈도우 표 대기.
- 한계(등록문 그대로): 대리 CEO는 팀과 같은 모델 계열 · 낮은 압축(실제 부재 없음) · 저녁의 카드·경계 입력은 FIELD-BENCH 대리 규칙. 대리가 「결함 아님」으로 판단한 회색 하나(BOM 붙은 todo.json 거부 — cross-os M2)를 남긴다.
- 이 원문은 리눅스에서 측정됐다 — 윈도우 표가 나올 때까지 이 원문으로 정비하지 않는다(윈도우 쪽이 같은 원문의 처음 측정이어야 한다).

### 윈도우 1일차 (2026-10-01~02 — CEO, CEO PC · conductor 표를 정비 채널이 옮김)
- 아침 창 끝 15:47:56Z(scope) → 저녁 창 시작 22:24:03Z(tried boot) · **무인 396.1분** · 낮 경과(→ 세 번째 ship) **249.3분**.
- 낮: 접점 0(decide·tried·scope 0 · BRIEF 새 절 0) · 멈춤 미검수 3(add-due-tag ship 19:57:12Z 뒤 seed) · 프레임워크 FAIL 0(boot 첫 ship의 main stray package-lock.json은 안내대로 한 번에 — 리눅스와 같다) · 규칙집 드리프트 1: 5f6b752 boot의 commands 기록(`.garagiste/team.json` — 첫날 boot의 정상 일, JSON 재들여쓰기 포함) · 이후 기준선 e63af61.

| 구간 | unit | seed→ship(분) | spawn | 토큰 | attack(선발견→red/총) | redproof | tried | green 후 결함 | FAIL |
|---|---|---|---|---|---|---|---|---|---|
| 무인 | boot | 0.8 | 2/2 | 33K | — | scaffold | ok(CEO) | 0 | 0 |
| 무인 | add | 173.7 | 58/61※ | 1,852K | 34→0/35 (attack 28바퀴) | base_red head_green | ok(CEO) | 0 | 0 |
| 무인 | add-due-tag | 74.6 | 42/43※ | 1,337K | 33→0/33 (attack 20바퀴) | base_red head_green | ok(CEO) | 0 | 0 |
| 계 | 3 | 249.1 | 102/106 | **3,222K** | 선발견 67 | 2 PASS | 3 ok | 0 | 0 |

※ 끝난 build가 남긴 백그라운드 명령의 늦은 완료 알림이 spawn_stop으로 따로 찍혀 slug 귀속이 어긋났다(계측 빈틈).
- 저녁: CEO가 「저녁」 전에 직접 검수하고 「검수 완료 모두ok」 → conductor가 tried 3 ok. **try 사본은 열리지 않았다**(사본 흐름은 이날 미검증) · main 변경은 STATUS뿐 · 팀이 정한 것 3 · spec 반려 2(add — 테스트 정규식 이스케이프, 수용 · add-due-tag — 공격 파일 문법 오류, spec이 attack 소관으로 기각 → 다음 attack이 자기 파일을 고침).
- 참고(사실): build가 300줄 step을 `GARAGISTE_LARGE_STEP`(게이트의 정상 경로 — 이유 선언·원장 기록)으로 1회 넘김 · build 셋이 백그라운드 명령(python·heredoc 편집 시도)을 남겨 시간 제한으로 끝남 · 한 build의 `fix(add)` 커밋이 wip 체크포인트 둘로 남았다고 보고(원인 미확인) · attack의 platform 메모: PowerShell 5.1(cp949)에서 `todo list`를 파이프로 받으면 한글이 깨진다(콘솔 직접 출력은 정상 — 셸의 해독 문제).
- **판정: 윈도우 1일차 통과 — 게이트(윈도우) 1/3**, 누적 green 후 CEO 발견 결함 0.

#### 리눅스와의 차이 — 이 표의 첫 발견
- **같은 원문의 같은 몫(boot·add·그다음 하나)에 토큰 3,222K 대 198K(16배), 세 번째 ship까지 249분 대 8분.** 차이는 거의 전부 attack↔build 왕복이다: add 28바퀴(리눅스 1), add-due-tag 20바퀴, 선발견 67(리눅스 2).
- conductor의 기록: 「저장 방식(제자리 쓰기 ↔ 바꿔치기)과 잠금 문턱 결함이 방향을 바꿔 가며 되풀이됐다」 — 한 쪽을 고치면 다른 쪽이 깨지는 **진동**이다(윈도우에서 파일 바꿔치기·잠금의 의미가 POSIX와 다르다). 프레임워크엔 attack 바퀴 상한도 진동 감지도 없어, 수렴은 했지만 비용·시간 상한이 없다.
- 이것은 FAIL이 아니고 동결 중이라 수리하지 않는다 — 표 이후 후보 1순위로 올린다(attack 바퀴 상한 · 같은 파일의 반복 반전 감지 → CEO 질문). 예측 1(낮 경과 ≤90분)은 윈도우에서 ✗.
