# L2 시험 — 3판 (무인 하루 · 인터럽트 · 우아한 정지)

2026-10-02 등록 · **머지가 CEO 서명** · 시험대: **새 빈 폴더 — 리눅스(정비 채널 컨테이너, 대리 CEO) · 윈도우(CEO PC, CEO)**, 원문 공통 `tests/field/briefs/holdout-futsal.md`(새 홀드아웃 — 처음 보는 원문이라 리눅스 첫 측정이 범용성 점수) · **프레임워크 동결: 이 등록의 머지 커밋**(team/·install = ede9930 — 등록의 머지는 문서·원문뿐, 전체 sha는 머지 뒤 첫 기록 줄에).
이 문서는 시험 **전에** 커밋된다. 2판(`L2-TRIAL-2.md`, 동결 9c677ec)의 통과는 그 판의 기록으로 남고, **게이트는 환경마다 0부터** 센다.

## 왜 3판인가
2판 동결 뒤 흐름이 바뀌고 장치가 들어갔다 — 2판을 이어 세면 판이 다른 날들을 한 게이트에 섞는다(2판 재등록과 같은 규칙, CEO 2026-10-02 「L2를 새롭게」).
- 흐름: attack은 spec 뒤 한 바퀴(dc1c8e4) · CEO 결정만 요구하는 FAIL은 `work.mjs ask … --hold`로 그 unit만 세운다(사고 59, 1b05168).
- 장치: 팩 상한 기본 32(0ab3a05) · 팩 상한 이유-차선(ede9930 — 상한~2배는 `--large "<이유>"`, 2배를 넘으면 CEO).
- 수리: 사고 57(눈먼 test_file 탐침) · 사고 58(rebase 도중의 거짓 base green).
- 증거의 빈칸: 리눅스에선 45012b9 판이 L2 모드 벤치 두 회(b0da849 todo 회귀 · 9be0e15 library)에서 처음 3일 게이트를 넘었지만, 58·59·이유-차선은 L2에서 돈 적이 없고 **윈도우는 9c677ec 뒤 어떤 것도 돌지 않았다**.

## 무엇을 재나 — L2 전부(백로그 §L2)
2판은 Q5만 등록하고 Q6·Q7을 「3일 표 뒤 따로」로 미뤘다. 3판은 L2를 채운다 — L2 게이트의 원래 정의도 「1주간」이다.

| 날 | 무엇 | 환경 |
|---|---|---|
| 1~3일 | Q5 무인 하루 — 아침 창 → 낮 접점 0 → 저녁 창 try 카드 | 리눅스 · 윈도우 |
| 4일 | Q6 인터럽트 실사격 — 진행 중에 넷(버그·수정·추가·방향전환) | 리눅스 |
| 5~7일 | Q7 우아한 정지 — 부재 사흘 | 리눅스 |
| 복귀 창 | Q7 뒤 대리가 돌아와 쌓인 카드를 try | 리눅스 |

Q6·Q7은 플랫폼과 무관한 흐름(인터럽트를 객체로 · 상한에서 멈춤)이라 리눅스로 잰다. CEO의 시간은 윈도우 Q5 3일에만 든다 — 윈도우에서만 나는 문제(경로·줄끝·정션·인코딩)는 거기서 본다.
**범용성 줄**은 리눅스 1~3일(이 원문의 첫 측정)이다 — 시험 중 사고 수리가 들어가면 원문은 그때 소진되고(FIELD-BENCH 홀드아웃 규칙), 그 뒤의 날과 윈도우는 게이트로만 센다.

## 하루의 모양
### Q5 무인 하루 (1~3일, 두 환경)
- 하루의 모양 · 시계·지표 · 판정은 `L2-TRIAL.md`의 그 절, conductor 지시서는 `L2-day-conductor.md` — **동결 sha에서** 읽는다(main이 시험 중 움직여도 지시서는 같다). 1일차 아침 창은 intake부터(2판과 같다).
- 하루 = 새 conductor 세션 하나. 낮은 압축해도 된다 — 무인 분은 점수가 아니고, 낮 경과·seed→ship은 원장 ts 그대로.
- **리눅스**: FIELD-BENCH 「L2 모드」 그대로(고정 말 · 대리 규칙 1~5 · 창에서만 말 · 표는 `tests/field/day.mjs`).
- **윈도우**: CEO의 첫 말은 지시서 「CEO가 하는 말」에서 `main`을 동결 sha로 바꾼 줄(머지 뒤 정비 채널이 전체 줄을 준다). 아침 첫 말 직전에 PowerShell `(Get-Date).ToUniversalTime().ToString('s') + 'Z'` 값을 적어 두고, 저녁 창 끝에 `node <GARAGISTE 클론>\tests\field\day.mjs <폴더> --since <그 값>` 한 줄의 출력을 정비 채널에 붙인다 — 2판 윈도우 2·3일차는 일차 표가 없었다(conductor의 집계 보고만).
- 범위가 끝나면(SCOPE DONE) 다음 아침 창에 다음 마일스톤 전부를 준다(2판과 같다).

### Q6 인터럽트 실사격 (4일, 리눅스)
- 아침 창은 Q5와 같다(「가」까지). 그날의 conductor 세션은 **스트림 입력**(`claude -p --input-format stream-json`)으로 연다 — 대리의 말은 conductor의 다음 도구 호출 사이에 들어간다(2026-10-02 탐침: sleep 루프의 두 번째 도구 결과 뒤에 끼어들어 같은 턴에서 처리됐다. `turn.sh`의 「한 턴 한 말」로는 진행 중에 말을 넣을 수 없다). 그 세션 도구는 4일 전에 `tests/field/`에 둔다.
- 대리는 원장을 보며 네 말을 넣는다 — conductor에게 미리 알리지 않는다:
  1. **버그** — 그날 첫 ship 직후. 대리가 4일 아침 창 전에 출하된 unit을 저장소 밖 사본에서 원문의 경계 입력으로 쳐 본다: 원문과 다른 동작이면 그 재현 한 줄(「<무엇을 하면> → <나온 것>, 원문은 <원문 줄>」), 못 찾으면 원문의 경계 입력 하나를 재현처럼 말한다(이미 맞게 동작하면 redproof의 「이미 충족」 길이 그 결과다).
  2. **추가** — 그날 둘째 ship 직후. 그대로: 「팀 화면에 그 팀의 최근 5경기 결과(날짜·상대·점수)를 보여 줘.」
  3. **수정** — 그 뒤 처음 build 팩이 조립된 unit(`-fix` 제외)에. 그 unit에 닿는 값 하나: 순위표 → 「이기면 2점으로 바꾸자」 · 득점 순위 → 「5명까지만」 · 몰수 → 「2:0으로」 · 일정 → 「라운드는 일요일로」 · 선수 → 「등번호는 0~99」 · 팀 → 「팀 이름은 20자까지」 · 그 밖 → 그 unit 원문 줄의 수 하나.
  4. **방향전환** — 수정이 원장에 들어간 직후. 아직 시작하지 않은 unit 하나를 뺀다(범위 안이면 범위에서, 아니면 BACKLOG에서): 「CSV 내려받기는 이번엔 빼자」(이미 시작했으면 날짜 옮기기 → 시즌 마감 순으로 그 이름).
- 잰다(스트림 기록 · 원장 ts): 말마다 **컴파일** — 말을 넣은 시각 → 그 말의 객체 원장 줄(버그 `scope_fix`/unit · 추가 unit · 수정 RESPEC(spec 재spawn) · 방향전환 drop)까지의 도구 호출 수와 분 · **무관 unit 정지 0** — 말이 닿지 않는 진행 중 unit이 말 뒤에도 원장에서 이어 움직인다(멈춤 여섯 밖의 정지가 없다) · 그 말들로 생긴 unit의 출하와 tried.
- 이 날의 낮 접점은 이 넷이 정상이다(넷 밖은 0) — Q5 게이트의 날로 세지 않는다. 저녁 창은 Q5와 같다.

### Q7 우아한 정지 — 부재 사흘 (5~7일, 리눅스)
- 4일 저녁 창의 끝에 대리가 말한다: 「나는 사흘 동안 없다 — 아침·저녁 창 없음. 범위는 지금 그대로.」 범위가 끝났으면 그 앞에 다음 마일스톤 전부를 준다(부재 전 마지막 결정).
- 5·6·7일: 날마다 새 conductor 세션, 고정 말 하나 — 「부재 <n>일차다(GARAGISTE 필드 시험 — 정비 채널이 CEO를 대리한다). `git fetch https://github.com/jaewhi-park/GARAGISTE <sha>` 뒤 `git show FETCH_HEAD:docs/measurements/L2-day-conductor.md`의 「부재」 절대로 한다.」 — 그 뒤 대리는 아무 말도 하지 않는다(올라온 질문에도).
- 잰다: 날마다 멈춘 시각과 이유 · `docs/STATUS.md` 첫 줄 · 새 출하 · 상한 위의 ship 시도(있으면 전부 FAIL로 원장에) · 규칙집 드리프트(`git log -- .garagiste CLAUDE.md` — 상한·규칙을 바꾼 커밋 0) · 부재 중 열린 질문.
- **복귀 창**(7일 뒤): 대리가 돌아와 「저녁」 — 쌓인 카드를 전부 try(대리 규칙 2) · 열린 질문 답 · 표. 그 카드의 결함도 리눅스 게이트에 센다.

## 판정·게이트
- **Q5 하루 통과**: 2판 그대로 — 낮 접점 0 · 규칙집 드리프트 0 · 멈춤이 여섯 중 하나(이유가 남음) · 저녁 카드 ≥3장(규칙대로의 정지면 3장 미만도 통과, 프레임워크 FAIL 정지는 미통과 — 수리 뒤 그날을 다시).
- **Q6 통과**: 네 말 모두 제 종류의 객체로 원장에 들어간다 · 무관 unit 정지 0. 컴파일 도구 호출 수와 분은 수치로 남긴다(판정선 아님 — 첫 측정).
- **Q7 통과**: 사흘 동안 상한 위 출하 0 · 규칙집 드리프트 0 · 날마다 멈춘 이유가 STATUS 첫 줄과 conductor 마지막 줄에 있다 · 복귀 창에서 진행이 이어진다(정지가 상태를 망가뜨리지 않았다).
- **L2 게이트(3판)**: 리눅스 — 1~7일과 복귀 창의 누적 「green 후 CEO 발견 결함」 0 + Q6·Q7 통과. 윈도우 — Q5 3일 누적 0. **둘 다면 L2 통과.** 0이 아니면 결함의 계급을 적는다(attack이 못 잡은 이음새면 system-attack 면접 1점 — 2판과 같다).

## 동결 규칙 — 2판과 같다
- 시험 중 프레임워크는 동결 커밋에 고정. 결함 수리는 허용(정본 먼저 → 반영 → HAZARDS·CHANGELOG), 장치 추가·흐름 변경은 금지 — 표가 나온 뒤에. 수리로 unit을 재시작하면 「시도 n」.
- 무인 날의 프레임워크 FAIL: conductor는 그 줄 전문을 남기고 그날 멈춘다.

## 준비
1. **윈도우 점검** — 이 등록이 머지된 main의 GARAGISTE를 PC에 받아 `node --test "tests/*.test.mjs"` 전부 초록(사고 57·58·59와 이유-차선의 첫 윈도우 실행). 빨간 줄은 정비 채널로 — 시험 전 수리면 동결을 새로 적는다.
2. **설치(두 환경 같게)** — 새 빈 폴더 + `docs/BRIEF-draft.md`(원문 그대로) → 동결 커밋에서 설치 `-Budget medium`(리눅스 `tests/field/setup.sh` · 윈도우 `install.ps1 claude -Project <새 폴더> -Budget medium`). 시험 중 재설치·models 변경 금지. 2판 침대(`C:\L2\todo-win`)와 그 반영 블록은 이 시험에 쓰지 않는다.
3. **정션 점검(윈도우)** — 2판과 같다.
4. **규칙집 기준선** — 설치 직후 `git rev-parse HEAD:.garagiste`를 1일차 표 머리에.
5. **순서** — 리눅스 1~3일 → 윈도우 1~3일 → 리눅스 4~7일과 복귀 창. 리눅스 1~3일에 프레임워크 FAIL이 나면 수리(정본 먼저) 뒤 윈도우는 수리된 main에서 설치한다(동결을 그 커밋으로 이 문서에 적는다).

## 예측 (채점 대상 — conductor에게는 주지 않는다)
1) Q5: 날마다 3 unit 출하 뒤 미검수 3으로 정상 정지 · 낮 접점 0 — 두 환경 모두
2) 프레임워크 FAIL ≤1/일 · 처음 3일 프레임워크 FAIL 정지 0(리눅스 — 범용성 줄)
3) 이유-차선 통과 ≥1(순위 동점 가르기·결과 고치기 unit의 build 팩) · 64KB 벽 0
4) 리눅스 누적 green 후 CEO 발견 결함 ≤1 — 0이 게이트지만 가장 큰 위험이다(todo L2 회귀 4일차 1). 후보: 세 팀 이상 동점의 「같은 승점 팀들끼리 다시 센 승점」 · 두 창 동시 수정 · 해를 넘는 토요일
5) 윈도우에서만 나는 문제 ≥1(9c677ec 뒤 윈도우 실행 0 — 탐침의 버릴 checkout·정션 · CRLF · 인코딩)
6) Q6: 네 말 모두 제 객체로(버그 → `-fix`가 범위 맨 앞 · 수정 → spec 재spawn · 추가 → add · 방향전환 → drop) · 무관 unit 정지 0
7) Q7: 5일에 미검수 3으로 멈추고 STATUS에 이유 · 6·7일 새 출하 0 · 드리프트 0 · 상한 위 ship 시도 0
8) 비용(리눅스 대리) $20~30

## 표 이후 후보 — 이 등록에 넣지 않는다 (CEO 「가」 대기)
- 64KB 벽 자동 나누기(보류 — 방아쇠: 벽) · tried ok 메모가 뒤 unit의 수용으로(둘째 근거 대기) · try 위임 · system-attack · session-start 주입 · L3(Q13 — 기존 코드가 있는 저장소의 홀드아웃).
- (시험 중 관찰 — 리눅스 2·3일차) spec의 저장 꼴 질문이 하루를 쓴다: spec 팩 4번(데이터 모델·파일 형식 = hard 결정 → ask)대로 기능 unit마다 그 조각의 스키마를 CEO에게 물어 ship이 저녁까지 서고, 답이 팀의 가정과 같은 「예」여도 RESPEC이 다음 날 spec부터 다시 돌린다. 후보: intake가 데이터 모델을 한 질문으로 먼저 묻는다 · 이미 정한 파일(Q2)을 넓히는 조각은 팀이 정한 것(default) · 「예」(가정 그대로)의 decide는 RESPEC 대신 그 주장 줄의 확인만.

## n일차 표·판정
(1일차부터 이 아래에 — 표는 day.mjs 출력 + 판단 칸(구성 ①/② · 프레임워크 FAIL · 멈춤 이유 · 참고). 환경마다 따로 센다.)

### 차림 (2026-10-02 — 리눅스 1일차 첫 말 전에 커밋)
- **동결 d0691270b88cc958032178aac54b4a5bf769ccbd**(PR #95의 머지 커밋 — team/·install.sh·install.ps1은 ede9930과 같다: `git diff ede9930 d069127 -- team install.sh install.ps1` 빈 출력) · 정비 채널의 시작 점검 `node --test "tests/*.test.mjs"` 101/101 초록.
- 리눅스: 정비 채널 컨테이너 · claude 2.1.287 · Node v22.22.0 · Python 3.11.15 · Chromium 141(`/opt/pw-browsers`) · 동결 sha의 worktree에서 `tests/field/setup.sh tests/field/briefs/holdout-futsal.md <폴더>`(원문 blob 8a351cd — 이 원문의 첫 측정) · 폴더 `<scratchpad>/l2-3/futsal`(컨테이너 — 사라진다) · 설치 f833834 · SELFTEST 19/19 · budget medium · 규칙집 기준선 `HEAD:.garagiste` = da7f234(설치 직후).
- 고정 말은 FIELD-BENCH 「L2 모드」 그대로(`<sha>` = 위 동결 전체 sha) · 대리 규칙 1~5 · 대리는 날마다 첫 말 직전의 `date -u +%FT%TZ`를 적는다(표의 `--since`) · 표는 `tests/field/day.mjs`.
- **대리 재량(첫 측정 전 고정 — holdout-library와 같은 꼴)**: 원문의 빈칸(세 팀 이상 동점의 「같은 승점 팀들끼리」 · 시즌 중에 더한 팀과 이미 만든 일정 · 연락처 형식 같은 것)에 미리 답을 정해 두지 않는다 — 창에서 규칙 1~5로만 · 웹 try는 실 Chromium으로 화면을 누른다(저장소 밖 `playwright-core@1.56.1`) · 데이터 파일 하나를 try마다 이어 쓴다(운영진 PC 그대로 — 새 판이 앞 판이 쓴 정상 파일을 열지 못하거나 그 내용을 잃으면 결함으로 센다: 원문의 「망가진 파일」이 아니다) · 대리가 띄운 서버는 대리가 끈다 · 엑셀이 컨테이너에 없어 CSV는 바이트로(BOM·구분자·따옴표) · 「이 PC 밖에서는 열리지 않음」은 컨테이너의 비루프백 주소로 접속해 본다 · 브라우저가 저절로 열리는지는 화면 없는 기계라 못 본다 · 윈도우는 원문 요구로만(CEO의 윈도우 3일이 본다).

### 리눅스 1일차 (2026-10-02 — 대리 CEO, 압축 낮 · 세션 c12c8c1d)
- 아침 창: intake → unit 21(**M1 14** · M2 7 — 원문의 「먼저 필요한 것」 줄대로 득점 순위·몰수·날짜 옮기기·CSV·시즌 마감·두 창 동시 수정과 cross-platform이 M2) · Q1~Q5 대리 「예」(`node server.mjs [--port N] [--data 경로]` · 모든 시즌을 league.json 하나에 · 자책골은 이득 본 팀 득점자 목록에 「자책」 · CSV는 UTF-8 BOM·쉼표 · 동시 수정은 결과마다 버전 번호) · 범위 M1 · 「가」. 첫 말 15:31:29Z · 아침 창 끝 15:34:02Z(scope) → 저녁 창 시작 15:56:12Z(tried boot).
- 낮: 접점 0 · 멈춤 미검수 3(local-only ship 15:53:48Z — conductor의 마지막 줄 「미검수 3 · seed STOP」) · 낮 경과(→ 세 번째 ship) 19.8분 · 프레임워크 FAIL 0(안내대로 한 번에 풀린 FAIL 2 — boot ship의 main stray package-lock.json → 되돌림·보존·재spawn이 lockfile 커밋: 사고 38 경로, 2판·b0da849와 같다 · intake의 `spawned`에 팩 경로).
- 규칙집 드리프트 1: 84c21ce boot의 commands 기록(`.garagiste/team.json`) — 첫날 boot의 정상 일. 이후 기준선 8e8a3e5.

| 구간 | unit | 구성 | 시도 | seed→ship(분) | spawn 의도/완료 | 토큰 | attack | redproof | tried | green 후 결함 | FAIL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 무인 | boot | — | 1 | 1.0 | 2/2 | 34K | — | scaffold | ok(대리 CEO) | 0 | 0 |
| 무인 | server-cli | ② | 1 | 9.5 | 4/4 | 122K | 5→0/6 | base_red head_green | ok(대리 CEO) | 0 | 0 |
| 무인 | local-only | ② | 1 | 9.3 | 5/5 | 140K | 1→0/2 | base_red head_green | ok(대리 CEO) | 0 | 0 |
| 계 | 3 | | | 19.7 | 11/11 | 296K | 선발견 6 | 3 | 3 ok | 0 | 0 |

- 저녁: try 사본 3(conductor가 카드마다 열었다) · 카드 3/3 ok · 열린 질문 0 · main 깨끗 · 팀이 정한 것 4(브라우저 자동 열기 없이 주소를 출력 · 데이터 파일은 뜰 때 만든다 · Host 헤더 검사 — DNS 재바인딩까지 · Node 22·외부 패키지 0).
- 대리 try(사본에서 · 실 Chromium 141): 카드대로 + 경계 — 같은 포트 둘째 · 포트 0/70000/abc · 폴더를 가리킨 `--data` · 모르는 옵션은 이유 한 줄로 끝 · 없는 폴더 아래 한글·공백 경로는 만든다 · 비루프백 192.0.2.2:8000 연결 거부 · 바깥 이름의 Host 403(`node:http`로 — fetch는 Host를 못 바꾼다) · 운영진 파일 `ceo/league.json` 첫 판(`{}`).
- 표 대조: conductor의 표와 day.mjs의 경계·무인 분(22.2)·낮 경과·접점·spawn·토큰·팀이 정한 것이 같다. attack 팩은 unit마다 1(spec 뒤 한 바퀴) · 가장 큰 팩 27.7KB(server-cli 둘째 build — 상한 32 아래) · 이유-차선 0.
- 참고(사실): local-only spec 반려 1(build가 짚었다 — 인수 테스트가 빈 Host를 http 클라이언트로 보내 클라이언트가 기본 Host로 바꿨다 → raw 소켓으로 고쳐 redproof 통과) · build 둘이 wip 커밋을 `git reset --soft`로 풀었다고 보고 · 세션 비용 $3.62.
- **판정: 리눅스 1일차 통과 — 게이트(리눅스) 1/3**, 누적 green 후 CEO 발견 결함 0.

### 리눅스 2일차 (2026-10-02 — 대리 CEO, 새 conductor 세션 234e3646)
- 아침 창: 새 세션이 상태를 다시 읽었다(안 본 것 0/3 · 결정 대기 0) → Flow 3대로 `scope --milestone M1`을 다시 돌려 보였다(15:58:11Z — 첫 ship 전) → 「가」. 첫 말 15:57:59Z · 아침 창 끝 15:58:11Z → 저녁 창 시작 16:31:03Z.
- 낮: 접점 0 · 멈춤 **hard 질문**(Q6, 16:29:34Z) · 프레임워크 FAIL 0 · 규칙집 드리프트 0(8e8a3e5 그대로). team-register는 인수·공격(3→0/3)을 다 통과했지만 그 spec이 올린 Q6(「팀은 league.json 최상위 "teams" 배열에 {id, name} 꼴로」)이 열려 ship 8조건이 막았고(`FAIL ship team-register 1/8 — 이 unit의 열린 질문 Q6`), 범위의 나머지 10 unit이 모두 team-register를 needs라 seed가 WAIT — 하루가 한 출하로 끝났다. 「질문에 걸린 unit만 두고 다음으로」가 열 수 있는 unit이 없었다(규칙대로의 정지).

| 구간 | unit | 구성 | 시도 | seed→ship(분) | spawn 의도/완료 | 토큰 | attack | redproof | tried | green 후 결함 | FAIL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 무인 | data-corrupt | ② | 1 | 16.5 | 4/4 | 142K | 2→0/3 | base_red head_green | ok(대리 CEO) | 0 | 0 |
| 무인 | team-register | ①+② | 1 | 미출하 — Q6(저녁 decide 뒤 RESPEC) | 4/4 | 147K | (3→0/3 — LEDGER 행 전) | — | — | — | 0 |
| 계 | 2(출하 1) | | | 16.5 | 8/8 | 289K | 선발견 2(+3) | 1 | 1 ok | 0 | 0 |

- 저녁: try 사본 1 · 카드 1/1 ok · Q6 대리 「예」(원문과 어긋나지 않는다 — 대리 규칙 1) → decide가 `RESPEC team-register`(spec이 답 없이 이미 돈 unit — 사고 17의 길: 답이 팀의 가정과 같아도 spec 재spawn부터) — 저녁이라 conductor는 띄우지 않았다(3일차 첫 일) · main 변경은 스크립트가 쓴 DECISIONS·STATUS뿐 · 팀이 정한 것 7(망가짐의 범위는 문법 오류·잘림·0바이트·최상위가 객체 아님 — 필드 단위 구조 검사는 하지 않는다 · 이름 비교는 toLowerCase · 전각 공백·탭도 뗀다 · 안쪽 공백은 그대로 등).
- 대리 try(사본에서): 카드대로(`{"teams": [` → 경로와 「1째 줄에서 파일이 중간에 끝났다」 한 줄 · exit 2 · 파일 그대로) + 경계 — 빈 파일 · 최상위 배열 · UTF-8 아닌 바이트는 같은 꼴로 거부·파일 그대로 · BOM 붙은 정상 파일(메모장 꼴)과 1일차 판이 쓴 운영진 파일은 연다. 회색 하나(결함으로 세지 않음): `{"teams": 5}`가 뜬다 — 이 판엔 팀이 아직 없다(팀 정한 것 「필드 단위 구조 검사는 하지 않는다」) · team-register 출하 뒤 다시 본다.
- 표 대조: conductor의 표와 day.mjs가 같다(무인 32.9분 · 낮 ship 1 · spawn 8/8 · 289K). attack 팩 unit마다 1 · 가장 큰 팩 30.0KB(team-register 둘째 build) · 이유-차선 0.
- 참고(사실): ship FAIL(열린 Q)과 Q6을 연 일은 원장에 줄이 없다(DECISIONS에만 — 백로그 「팩 FAIL·가드 거부는 원장 줄이 없다」와 같은 빈칸) · 세션 비용 $3.87.
- **판정: 리눅스 2일차 통과**(규칙대로의 정지 — hard 질문, 카드 1장) **— 게이트(리눅스) 2/3**, 누적 green 후 CEO 발견 결함 0.

### 리눅스 3일차 (2026-10-02 — 대리 CEO, 새 conductor 세션 22036da9)
- 아침 창: 새 세션이 상태를 다시 읽었다(안 본 것 0/3 · 결정 대기 0 · 진행 중 team-register) → 「가」. 아침에 접점 줄이 없어 아침 창 끝 = 전날 저녁의 마지막 접점(decide Q6 16:31:12Z — day.mjs 정의) · 첫 말 16:32:48Z → 저녁 창 시작 17:49:25Z.
- 낮: 접점 0 · 멈춤 **hard 질문**(Q7·Q8·Q9, 17:47:40Z) · 프레임워크 FAIL 0 · 규칙집 드리프트 0. team-register는 RESPEC대로 spec 재spawn → build → attack 새 바퀴(re-spec 뒤 — 4/7 red) → **build 팩 35KB가 이유-차선으로 지나갔다**(`--large "공격 테스트 7개(13.7KB)와 re-spec으로 늘어난 인수 테스트(16.1KB)가 실렸다"` — 상한 FAIL을 안내대로 한 번에) → 출하. 이어 seed한 셋(player-register · schedule-roundrobin · invalid-input)은 모두 green · attack red 0까지 갔지만 각 spec이 올린 질문(Q7 선수 저장 꼴 · Q8 일정 저장 꼴 · Q9 오류 화면을 기능 unit마다 나눠 맡기)에 ship이 막혔고, 범위의 나머지가 모두 그 셋을 needs라 WAIT. conductor는 「질문에 걸린 unit만 두고 다음으로」를 셋에 그대로 했다.

| 구간 | unit | 구성 | 시도 | seed→ship(분) | spawn 의도/완료 | 토큰 | attack | redproof | tried | green 후 결함 | FAIL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 무인 | team-register | ①+② | 1 | 38.5(Q6 대기 3.7 — 뺀 34.8 · seed는 2일차) | 8/8 | 298K | 7→0/7 | base_red head_green | ok(대리 CEO) | 0 | 0 |
| 무인 | player-register | ①+② | 1 | 미출하 — Q7(저녁 RESPEC) | 4/4 | 185K | (red 0/4) | — | — | — | 0 |
| 무인 | schedule-roundrobin | ①+② | 1 | 미출하 — Q8(저녁 RESPEC) | 4/4 | 163K | (red 0/3) | — | — | — | 0 |
| 무인 | invalid-input | ①+② | 1 | 미출하 — Q9(저녁 RESPEC) | 4/4 | 184K | (red 0/3) | — | — | — | 0 |
| 계 | 4(출하 1) | | | 38.5 | 20/20 | 831K | 선발견 7 | 1 | 1 ok | 0 | 0 |

- 저녁: try 사본 1 · 카드 1/1 ok · Q7·Q8·Q9 대리 「예」(원문과 어긋나지 않는다 — conductor가 「build는 Q7의 꼴과 다르게 최상위 players로 저장했다」를 덧붙였지만 대리 규칙 1은 원문만 본다) → decide마다 RESPEC(셋 다 4일차 spec부터) · 카드 메모(「첫 화면에서 팀 화면으로 가는 길이 없다」)를 conductor가 unit으로 넣을지 물어 대리 「예」(규칙 1) → `home-nav`(M1 BACKLOG · 범위 밖 — 4일차 아침에 범위를 묻겠다고) · 팀이 정한 것 9(팀 이름 50자 · 등번호는 ASCII 정수 표기만 · 연락처 형식은 검사 안 함 · 일정은 /schedule · 이유 한 줄 200자 등) · main 변경은 스크립트가 쓴 BACKLOG·DECISIONS·STATUS뿐.
- 대리 try(사본에서 · 실 Chromium): 카드대로(앞뒤 공백 뗀 FC 서울 · fc 서울 거부 · 다시 띄운 뒤 그대로) + 경계 — 빈칸뿐 거부 · 전각 공백·탭 뗌 · 안쪽 두 칸은 다른 이름(팀이 정한 것) · FC SEOUL/fc seoul · 자모를 풀어 쓴(NFD) FC 서울도 거부 · `<b>…<script>` 이름은 글자 그대로(스크립트 안 돎) · 120자 이름 · 2일차 회색 `{"teams": 5}`는 이제 「teams가 배열이 아니다」로 멈춤(닫힘) · 운영진 파일에 리그 팀 다섯 등록(FC 한강 · 번개 FC · 동네 유나이티드 · 토요 축구회 · 새벽 FC — 1·2일차 판이 쓴 `{}`를 이어서). 메모 하나: 첫 화면에 팀 화면으로 가는 길이 없다(원문이 화면 이동을 말하지 않아 결함으로 세지 않음 → home-nav).
- 표 대조: conductor의 표와 day.mjs가 같다(무인 78.2분 · 20/20 · 831K). attack 팩은 첫 생애마다 1 + re-spec 뒤 새 바퀴 1(team-register) · 가장 큰 팩 35.2KB(이유-차선) · 64KB 벽 0.
- 참고(사실): 열린 Q가 있는 동안 build·attack 팩은 지어지고 ship만 막힌다(사고 17의 꼴 — 답이 오면 RESPEC으로 spec부터) · player-register build가 `fix_tmp.py`를 저장소 루트에서 한 번 돌리고 지웠다고 보고(main 변경 없음) · 세션 비용 $8.17.
- **판정: 리눅스 3일차 통과**(규칙대로의 정지 — hard 질문, 카드 1장) **— 게이트(리눅스) Q5 3/3**, 누적 green 후 CEO 발견 결함 0.

### 리눅스 Q5 사흘 — 범용성 줄 (holdout-futsal 첫 측정, 2026-10-02)
- **프레임워크 FAIL 정지 0 · 낮 접점 0/0/0 · 규칙집 드리프트(boot의 첫날 commands 외) 0 · green 후 CEO 발견 결함 0(tried 5/5 ok)** · 정상 정지 3/3(미검수 3 · hard 질문 · hard 질문) · M1 14(+home-nav) 중 출하 5(boot · server-cli · local-only · data-corrupt · team-register), 셋은 green인 채 RESPEC 대기 · 토큰 1.42M · $15.66(3.62 + 3.87 + 8.17).
- **처리량의 병목은 spec 팩의 「데이터 모델·파일 형식은 hard 결정 → ask」(spec 팩 4번)였다**: intake가 스키마를 묻지 않은 채(Q2 「league.json 한 파일」만) 기능 unit의 spec마다 그 조각의 저장 꼴을 물었다(Q6 팀 · Q7 선수 · Q8 일정 — 셋 다 대리 「예」, 팀의 가정 그대로). 질문 하나가 그 unit의 ship을 저녁까지 세우고 needs로 이어진 뒤 unit을 모두 WAIT로 만들며, 답이 가정과 같아도 decide가 RESPEC(사고 17의 길)을 걸어 다음 날 spec부터 다시 돈다 — 2·3일차가 한 출하씩. 프레임워크 FAIL이 아니라 규칙대로의 흐름이고 동결 중이라 손대지 않는다(표 이후 후보 — 아래 「표 이후 후보」에 한 줄).
- 예측 채점(리눅스 Q5): 1) △ 낮 접점 0 ✓ · 「날마다 3 unit 출하 뒤 미검수 3」은 1일차만(2·3일차 hard 질문 — 한 출하씩) 2) ✓ 프레임워크 FAIL 0/일 · 처음 3일 정지 0 3) ✓ 이유-차선 통과 1(team-register — 짚은 순위 동점·결과 고치기 unit보다 먼저, re-spec이 키운 인수가 원인) · 64KB 벽 0 4) 진행 중(누적 0) 8) 진행 중($15.66).

### 윈도우 — CEO에게 넘김 (2026-10-02, 리눅스 Q5 사흘 뒤)
- 리눅스 1~3일에 프레임워크 수리가 없어 동결은 그대로 d069127이다(준비 5의 「수리된 main에서」는 해당 없음).
- **순서 조정(정비 채널)**: 등록문의 순서는 리눅스 1~3일 → 윈도우 1~3일 → 리눅스 4~7일이지만, 리눅스 필드 폴더는 이 컨테이너와 함께 사라진다 — 윈도우 사흘(CEO의 실제 날들)을 기다리면 4~7일이 이어 쓸 상태가 없다. 그래서 윈도우 지시를 지금 넘기고 리눅스 4~7일을 곧바로 잇는다. 순서의 이유(리눅스 1~3일의 수리가 윈도우 설치 전에 들어간다)는 그대로 지켜진다 — 4~7일에 수리가 나면 동결 규칙대로 윈도우 침대엔 반영 블록으로.

#### 윈도우 1~3일차 — CEO에게 준 줄 (동결 d0691270b88cc958032178aac54b4a5bf769ccbd)
0. **점검(PC에서 한 번)** — 동결 sha의 GARAGISTE에서 테스트 전부 초록(101):
   ```powershell
   git clone https://github.com/jaewhi-park/GARAGISTE C:\L2\garagiste-3
   cd C:\L2\garagiste-3
   git checkout d0691270b88cc958032178aac54b4a5bf769ccbd
   node --test "tests/*.test.mjs"
   ```
   빨간 줄이 있으면 그 줄을 정비 채널로(시험 전 수리면 동결을 새로 적는다).
1. **설치(새 빈 폴더 — 2판 침대 `C:\L2\todo-win`은 쓰지 않는다)**:
   ```powershell
   New-Item -ItemType Directory -Force C:\L2\futsal-win\docs | Out-Null
   Copy-Item C:\L2\garagiste-3\tests\field\briefs\holdout-futsal.md C:\L2\futsal-win\docs\BRIEF-draft.md
   C:\L2\garagiste-3\install.ps1 claude -Project C:\L2\futsal-win -Budget medium
   git -C C:\L2\futsal-win rev-parse HEAD:.garagiste
   ```
   마지막 줄 값이 규칙집 기준선(정비 채널에 붙인다). 시험 중 재설치·models 변경 금지.
2. **날마다** — 폴더에서 새 `claude` 세션. 첫 말 직전에 `(Get-Date).ToUniversalTime().ToString('s') + 'Z'` 값을 적어 둔다.
   - 1일차 첫 말: 「오늘은 L2 무인 하루다. `git fetch https://github.com/jaewhi-park/GARAGISTE d0691270b88cc958032178aac54b4a5bf769ccbd` 뒤 `git show FETCH_HEAD:docs/measurements/L2-day-conductor.md`를 읽어라. 「아침」 절이 오늘의 규칙이다. 내가 돌아와 「저녁」이라고 하면 「저녁」 절대로 한다. docs/BRIEF-draft.md로 brief를 축적하고 intake를 돌려라. 질문은 한 줄씩 예/아니오로 — 대신 답하지 않는다.」 → 질문에 예/아니오 → 「범위는 M1 전부 — 가」 → 자리를 뜬다.
   - 2·3일차 첫 말: 위 줄에서 마지막 두 문장(brief·질문)을 빼고 → 「상태 보여줘」 → 열린 질문에 답 → 「가」 → 떠난다.
   - 저녁: 「저녁」 → 카드마다 conductor가 연 사본 `.worktrees\try-<slug>`에서 친다 → 「<slug> ok」 또는 「<slug> fail + 한 줄」 → 열린 질문에 예/아니오 → conductor가 표를 낸다.
   - 저녁 끝에 한 줄 — 출력 전체를 정비 채널에 붙인다: `node C:\L2\garagiste-3\tests\field\day.mjs C:\L2\futsal-win --since <아침에 적은 값>`
3. **정션 점검(2판과 같다)** — 프로젝트에 의존성 디렉터리(node_modules)가 생기면 그 뒤 첫 ship 직후 main의 그 디렉터리가 그대로인지 한 번 본다(원문이 외부 패키지 금지라 안 생길 수 있다).
