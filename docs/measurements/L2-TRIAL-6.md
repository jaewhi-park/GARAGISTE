# L2 6판 — 홀드아웃 snap(파이썬 백그라운드 데몬) · 리눅스 · 측정 모드 (등록 2026-10-03)

## 왜 6판인가
- CEO(2026-10-03): 5판은 todo CLI(회귀)로 리눅스 통과(약함). 「더 난이도 있는 앱으로 L2를 한 번 더」 — 홀드아웃 후보 셋(notes · snap · parcel-desk) 중 **snap**(폴더 스냅샷 백업 — 파이썬 · 백그라운드 데몬, `tests/field/briefs/holdout-snap.md`)을 서명. 수리에 쓰지 않은 원문이라 **첫 측정 줄이 범용성 점수**다(FIELD-BENCH 「홀드아웃」).
- 리눅스만(5판 닫기 결정). 원문의 「리눅스·윈도우에서 똑같이」는 측정하지 않는다 — `human@win32` 카드가 나오면 보류로 남긴다.
- 무엇이 새로운가: 프로세스 수명(start/stop/pid · 터미널을 닫아도 돈다) · 1분 폴링 감시 · 보관 규칙(7일/30일/1년 — 시계 검사 C3·C4가 정면으로 닿는다) · 잠긴 파일·사라진 백업 폴더 · 원자적 쓰기(다 쓴 뒤 이름 붙이기) · 로그 돌리기 · 100MB 경계. build가 남긴 백그라운드 명령(L2 2판 관찰)이 제품 자체인 모양.

## 단위·정의 — 5판 그대로
- 라운드 = conductor 세션 하나(아침 창 → 무인 → 저녁 창) · 멈춤 여섯 · 지시서 `L2-day-conductor.md`(동결 sha로 읽는다) · 표 `tests/field/day.mjs`(라운드 하나 = `--since` 하나) · 시계 검사 `tests/field/clock.mjs` 저녁마다 · CEO-분 기계 셈 · 대리 CEO의 규칙 셋(원문과 어긋나지 않으면 **맨 「예」** · 원문에 없는 것은 팀이 정한 그대로 · 설명을 붙이지 않는다). 정의는 전부 `L2-TRIAL-5.md`(「단위」「무엇을 재나」「Q5 무인 라운드」「시계 검사」「CEO-분」)를 참조한다.
- **측정 모드 — 시험 중 프레임워크 수리 없음**(5판과 다른 점): 홀드아웃이라 수리가 들어가면 snap은 소진·회귀가 된다. 프레임워크 FAIL이 라운드를 멈추면 그 줄 전문과 STATUS 「막힌 것」을 기록하고(H1, H2 …), 다음 라운드는 새 세션으로 그 자리에서 잇는다(FIELD-BENCH 「L2 모드」 library 측정과 같다). 수리는 세 라운드 뒤 CEO 결정으로.
- 도구(`tests/field/`)는 프레임워크가 아니다 — 고쳐도 기록만.

## 라운드의 모양
- **Q5 무인 라운드 ×3**(1~3). 범위 끝이면 system-attack·REPORT는 낮의 일. Q6·Q7은 5판 통과 — 이 판에선 돌리지 않는다(CEO가 원하면 4라운드에 Q6 한 번, plan은 3라운드 뒤).
- 아침 창: 1라운드 — 고정 첫 말(동결 6 sha · 헤드리스 `turn.sh`) + 「docs/BRIEF-draft.md로 brief를 축적하고 intake를 돌려라. 질문은 한 줄씩 예/아니오로 — 대신 답하지 않는다」 → 맨 「예」/「아니오」 → 범위: 원문의 「먼저 필요한 것」 줄대로 **M1**(intake가 나눈 M1 그대로 — start·stop·status · 사본 남기기 · list · restore가 들어 있어야 한다) → 「가. 매 spawn 뒤 work.mjs spawned를 남겨라」. 2·3라운드 — 상태 → 답 → 「가」.
- 저녁 창: 시계 검사(main clone, C1~C4) → 「저녁」 → 카드(대리가 저장소 밖 폴더에서 원문 경계로 — 데몬은 start → 파일 바꾸기 → status → stop까지 끄고 끝낸다; 남은 프로세스는 카드 fail의 재료) → 열린 질문 → 표 → `day.mjs`.
- 라운드 끝에 `pgrep -af snap`으로 남은 프로세스를 센다(표 밖 참고 — 팩·카드가 남긴 데몬).

## 판정·게이트
- 라운드 통과: 5판 Q5와 같다 — 낮 접점 0 · 규칙집 드리프트 0(boot의 commands 외) · 멈춤 여섯 중 하나 · 카드 ≥3(규칙대로의 정지면 그 미만도) · 프레임워크 FAIL 정지 0(정지면 그 라운드 미통과 — 수리 없이 기록하고 다음 라운드).
- **6판 게이트: 세 라운드 누적 「green 후 CEO 발견 결함」(시계 포함 — 계급 제품 / 테스트만 / 검사 주입) 0 + 세 라운드 모두 정상 정지.** 홀드아웃 첫 측정 줄(멈춘 자리 · 출하 수 · 결함 · 비용)이 범용성 점수.

## 예측 (채점 대상 — conductor에게는 주지 않는다)
1. intake unit 12~16(M1 6~8 · M2 나머지) · 질문 2~4(사본 이름의 시각대 · 폴링 주기 · pid 파일 자리 · 100MB 경계의 「넘는다」).
2. 1라운드 멈춤 = 무인 출하 5 또는 미검수 3 — 데몬 unit(start/stop/status)의 「터미널을 닫아도 돈다」는 사람 센서 주장이 될 수 있다 → 미검수(사람) ≥1 · 1라운드 낮 ship 3~5.
3. 시계 검사 red ≥1 — 보관 규칙·사본 이름의 시각·「지워짐 시각」이 C3·C4에 걸린다(계급 제품 또는 테스트만). 사본 시각을 mtime으로 쓰면 5판의 「검사 주입」 계급도 다시 나온다.
4. 프레임워크 FAIL 정지 ≤1 — 위험: 팩이 남긴 데몬이 full을 막거나 worktree 삭제를 막는다 · 100MB fixture가 저장소에 들어가 ship·가드에 걸린다 · 시간 기반 테스트의 flake(1분 폴링을 테스트가 기다린다 — full이 길어진다) · attack 팩의 저장소 밖 임시 폴더 쓰기 거부(5판 관찰 b, 누적 5 — 데몬 제품은 임시 폴더가 더 필요하다).
5. 누적 green 후 결함 ≤2 — 계급: 데몬 수명·잠금·원자적 쓰기.
6. 비용(리눅스 sonnet conductor) 라운드당 $7~12 · 셋 $25~40 · CEO-분 아침 ≤5 · 저녁 ≤15 · unit당 ≤5.
7. 7건 장치는 5판처럼 작동 — FAIL 줄 되풀이 0 · 「예」→RESPEC 0(맨 「예」) · 미검수 셈이 멈춤의 모양을 가른다.

## 준비·차림
- **동결 6** = 이 등록(원문 서명 포함)의 머지 커밋. team/은 동결 5(9479a3c2)와 같다.
- 테스트 베드: `tests/field/setup.sh tests/field/briefs/holdout-snap.md <새 폴더>`(budget medium) — 정비 채널 컨테이너(python 3.11.15 · node 22 · claude 2.1.288). 설치 직후 `git rev-parse HEAD:.garagiste`와 SELFTEST 줄을 1라운드 표 머리에.
- 라운드마다 `round<n>.since` · 세션 id · 턴 번호(이어 센다) · 비용(턴 json 누적) · 시계 로그(`<clone>-clock-<id>.log`, 라운드마다 이름 바꿔 보관).

## 라운드 표·판정
(라운드마다 채운다 — 5판 「라운드 표·판정」의 꼴 그대로)

### 차림 (2026-10-03 — 리눅스 1라운드 첫 말 전에 커밋)
- **동결 6 `50b6f11957bd03de02226f30038c2729b6162fc2`**(PR #106 머지 커밋 — snap 서명 · team/ tree는 동결 5와 같다) · 리눅스 테스트 베드: 정비 채널 컨테이너 · claude 2.1.288 · node 22 · python 3.11.15 · `tests/field/setup.sh tests/field/briefs/holdout-snap.md <scratchpad>/bench-1003/snap medium` → 설치 커밋 `48d5f3e` · **규칙집 기준선 `HEAD:.garagiste` `3663aa8ba07a418ff6fbc98d7fa10ba4e261ea6a`** · SELFTEST PASS 19/19. 턴 기록 `snap-turn<n>.msg/.json` · 라운드 시작 `snap-round<n>.since`.

### 리눅스 1라운드 (2026-10-03 — 대리 CEO · conductor 세션 067ec727 · 턴 8 · 헤드리스 `turn.sh`)
- **아침 창**(`--since` 15:15:08Z): 고정 첫 말 → intake가 **M1 11**(boot·start-stop·copy-on-change·status·copy-dedupe·list-file·list-summary·deleted-mark·restore·restore-to·bad-input) + **M2 6**(exclude·backup-missing·locked-file·atomic-copy·resume·corrupt-record) + **M3 4**(retention·auto-prune·verify·log-rotate)를 올리고 Q1~Q3(파이썬 3.10+ 표준 라이브러리·`python -m snap`·저장소의 `snap` 셸 래퍼와 `snap.cmd` / 백업 폴더의 `snap-index.json` 하나 / `~/.snap/state.json`·감시 여럿·인수 없는 stop·status는 전부)을 올렸다(모든 unit이 Q1~Q3에 걸려 답 없이는 seed 0 — hard 질문 멈춤 15:17). 셋 다 원문과 어긋나지 않아 맨 「예」 → decide 3(RESPEC 0) → 범위 M1 11(원문의 「먼저 필요한 것」 여섯이 다 들어 있다) → 「가. 매 spawn 뒤 work.mjs spawned를 남겨라」.
- **무인**(15:20:18 → 16:40:32, 80.2분): ship 5(boot → start-stop → copy-on-change → status → copy-dedupe) → **멈춤 「무인 출하 5」**(그때 미검수 1/3 — start-stop만 human@win32 센서) · 낮 접점 0 · 팩 상한 FAIL 4(build 넷 전부 34~40KB > 32KB → `--large "<이유>"`로 각 한 번에) · `verify.mjs FAIL gate` 1(안내 없는 줄 — 다음 verify PASS, 정지 아님) · 가드 거부 3(관찰 c) · 데몬 잔류 0 · spawned 18/18(「매 spawn 뒤 spawned」 지킴).
- **표**(`day.mjs` — conductor의 표와 경계·무인·접점·출하·토큰·카드 일치): 아침 창 끝 15:20:18(scope) · 첫 ship 15:21:18(boot) · 저녁 창 시작 16:42:24(try boot) · **무인 82.1분** · 낮 경과(세 번째 ship) 38.4분 · **낮 접점 0** · 멈춤 16:40:32(ship copy-dedupe) · 규칙집 드리프트: `42e4939 scaffold(boot)` — 설치 → boot의 `.garagiste` diff는 team.json commands 다섯 칸만(quick·full·test_file·run·setup) · `HEAD:.garagiste` `3568d58e1764518942b515316ed6da5cbfd23735`(기준선 3663aa8b…에서 commands만).

| 구간 | unit | 구성 | 시도 | seed→ship(분) | spawn | 토큰 | attack | redproof | tried | green 후 결함 | FAIL | RESPEC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 무인 | boot | ② scaffold 스모크 | 1 | 1.0 | 1/1 | 25K | — | scaffold | **fail(CEO)** | **1** — Q1 「예」의 `snap` 셸 래퍼·`snap.cmd`가 저장소에 없다(`which snap` 빔) → 원문의 `snap start …`를 그대로 칠 수 없다. `python -m snap`은 뜬다(`snap 0.0.1` exit 0 · 모르는 명령·인수 없는 start는 한 줄·exit 2 · import 표준 라이브러리만) | 0 | 0 |
| 무인 | start-stop | ①+② | 1 | 8.4 | 4/4 | 157K | 3→0/4 | base_red head_green | ok(CEO) | 0 — 메모: 다른 지킬 폴더 둘이 같은 백업 폴더(한 snap-index.json)를 쓰도록 start가 받아 준다 — 원문 밖 | 0 | 0 |
| 무인 | copy-on-change | ①+② | 1 | 28.9 | 4/4 | 164K | 4→0/4 | base_red head_green | ok(CEO) | 0 — 메모: `.hidden/`의 파일도 사본이 남는다 → exclude(M2)에서 본다 · index의 `epoch` 필드(surface와 어긋남 — 팀이 정리) | 0 | 0 |
| 무인 | status | ①+② | 1 | 11.2 | 4/4 | 158K | 4→0/4 | base_red head_green | ok(CEO) | 0 | 0 | 0 |
| 무인 | copy-dedupe | ① | 1 | 30.5 | 4/4 | 171K | 2→0/2 | base_red head_green | ok(CEO) | 0 | 0 | 0 |
| 계 | 5 | | 5 | 80.1 | 17/17(+intake 1/1) | 675K(+intake 19K) | 선발견 13→0 | | ok 4 · fail 1 | **1** | 0 | 0 |

- 카드 5(ok 4 · fail 1) — 전부 저장소 밖 폴더에서 원문 경계로, 데몬은 start → 바꾸기 → status → stop까지: **boot fail**(위) · start-stop ok(가상 터미널 pty에서 치고 닫음 — start 0초에 돌아오고 감시는 ppid 1·자기 sid·tty 없음으로 살아 있다 · 같은 명령 「이미 돌고 있다: <폴더> (pid)」 exit 1 · 상대 경로·끝 슬래시도 같다 · stop 뒤 프로세스 0 · 돌지 않을 때 stop 「감시 0개를 끝냈다」 exit 0) · copy-on-change ok(사본은 2~3초 뒤 · 이름 `b.2026-10-03T16-47-31.txt` = mtime 로컬 · 고치면 둘째 사본, 앞 것 그대로 · 깊은 폴더·확장자 없음(`README.<시각>`)·빈 파일·공백/한글 이름 모두 사본) · status ok(여섯 줄 다 · 용량 = 백업 폴더 파일 합 검산 · 12초 뒤 마지막으로 본 시각 전진 · `status <폴더>` 하나만 · 모르는 폴더 한 줄 exit 1 · kill -9로 죽인 감시는 「상태: 멈춤」, stop이 치움 · stop 뒤 「돌고 있는 감시 없음」 exit 0) · copy-dedupe ok(touch·같은 내용 다시 저장 → 사본 1 · 한 글자 → 2 · A→B→A → 3(팀이 정한 대로) · 다른 파일 같은 내용 → 사본 · skipped 0).
- 열린 질문 0 · 팀이 정한 것 9(start-stop 2 · copy-on-change 3 · status 3 · copy-dedupe 1 — 전부 아침 창 끝 뒤, 뒤집은 것 0) · REPORT 없음(범위 5/11).
- **CEO-분(기계 셈 — 턴 기록·전사)**: 아침 창 5.1분(말 2 · 대기 1.7) · 저녁 창 10.0분(말 6 · 카드 5 · 대기 1.6) · 낮의 말 0 · 카드 시간 합 9.1분(try → tried 5/5) · **unit당 3.0분**.
- **시계 검사**(main d7d1f69 clone `snap-r1` · full = 38 tests 179초 · 파이썬엔 TZ만 닿는다 — clock.mjs 머리): `CLOCK C1·C2·C3·C4 exit 0` — **PASS 4/4**(718초). C3·C4의 날짜 이동(GARAGISTE_CLOCK_OFFSET_MS)은 node preload라 파이썬 자식에 닿지 않는다 — 넷은 사실상 시간대 검사(C1·C2 지구 양 끝 · C3·C4 서울). 보관 규칙(M3 retention)이 들어오면 파이썬의 날짜를 옮기는 다른 수단이 필요하다(표 밖 참고).
- 판단 칸: 구성 — boot ②(스모크), start-stop·copy-on-change·status ①+②(tests/adversary·acceptance가 subprocess로 `python -m snap start`를 실제 띄운다), copy-dedupe ①(conductor 판단) · **프레임워크 FAIL 정지 0**(팩 상한 FAIL 4는 안내대로 `--large` 한 번에 · `FAIL gate` 1은 다음 verify PASS) · 데몬 잔류 0(`pgrep -af snap` 빔 — 팩·카드·시계 검사 뒤).
- **판정: Q5 라운드 통과** — 낮 접점 0 · 드리프트 0(boot commands 외) · 멈춤 여섯 중 하나(무인 출하 5) · 카드 5 ≥3 · 프레임워크 FAIL 정지 0. **green 후 CEO 발견 결함 1**(boot — 계급 「결정→unit 누락」: Q1에 「예」한 산출물(래퍼 둘)이 어느 unit 인수에도 실리지 않았다 · 데몬 수명·잠금·원자적 쓰기 계급은 0) → **6판 게이트(세 라운드 누적 0)는 1라운드에서 이미 어긋났다** — 남은 두 라운드는 측정 줄을 채운다(홀드아웃 첫 측정 줄이 범용성 점수). 대리 판단 — CEO가 「boot의 인수(진입점·quick·full)는 섰고 래퍼는 unit 밖」으로 보면 결함 0으로 다시 적는다(5판 사고 65의 재분류처럼). `boot-fix`는 2라운드 첫 unit.
- 비용 **$8.64**(아침 턴 1 0.43 · 답·범위·「가」+무인 턴 2 7.67 · 저녁 0.54) · 토큰 695K(intake 포함).
- 예측 채점(1라운드 분): 1) **✗ unit 21**(예측 12~16 — M1 11은 원문 줄을 더 잘게 쪼갰다) · 질문 3 ✓(주제는 넷 다 빗나감 — 언어·실행 꼴·기록 파일·상태 파일) 2) **✓** 멈춤 = 무인 출하 5 · 미검수(사람) 1 · 낮 ship 5 3) **✗ 시계 red 0**(예측 ≥1 — 사본 이름·「마지막으로 본 시각」이 시간대에 흔들리지 않았다 · 다만 날짜 이동은 파이썬에 닿지 않았고 보관 규칙은 아직 범위 밖 — 「검사 주입」 계급은 M3에서 다시 본다) 4) **✓** 정지 0 — 「팩이 남긴 데몬」·「100MB fixture」·「시간 기반 flake」는 안 나왔다(폴링이 2~3초라 full 179초) · 임시 폴더 쓰기 거부 1(5판 관찰 b 되풀이) · 대신 **팩 상한 4**가 나왔다 5) 1라운드 결함 1 — 계급은 예측(데몬 수명·잠금·원자적 쓰기) 밖 6) **✓** 비용 $8.64(7~12) · CEO-분 아침 5.1(≤5 — 0.1 초과 ✗) · 저녁 10.0 ✓ · unit당 3.0 ✓ 7) **✓** FAIL 줄 되풀이 0 · 「예」→RESPEC 0 · 미검수 1/3은 멈춤을 가르지 않았다(무인 출하 5가 먼저).
- **관찰(장치 아님 — 측정 모드, 표 이후 후보)**:
  (a) **결정→unit 누락**: intake의 Q1에 산출물(`snap` 셸 래퍼·`snap.cmd`)이 들었고 「예」로 결정됐지만 BACKLOG의 어느 unit 인수에도 실리지 않았다(boot의 인수 = 「진입점이 뜨고 quick·full PASS」) → 1라운드의 결함 1. 후보: decide KEPT의 산출물 문장을 boot 또는 그 unit의 인수에 잇기(intake 팩 규칙 또는 `work.mjs decide`).
  (b) **팩 상한 32KB를 build 팩 넷이 전부 넘겼다**(34~40KB — 인수 테스트 18~24KB + 공격 테스트 9~16KB가 함께 실림) → `--large` 4회, 각 한 번에. 데몬 제품의 테스트 파일은 CLI(5판 라운드당 0~2회)보다 크다.
  (c) 가드 거부 3 — 전부 Bash heredoc 쓰기: boot 팩 `cd $W; cat > pyproject.toml`(cd 뒤 상대 경로) · copy-on-change attack `/tmp/claude-0/coc_base.txt`(저장소 밖 임시 파일 — 5판 관찰 b, 누적 6) · status spec `$W/docs/units/status/try.md`(변수 경로). 셋 다 팩이 우회해 끝냈다(try.md는 생겼다).
  (d) 원장 `verify.mjs FAIL gate` 줄(16:30:56, copy-dedupe build 뒤 quick PASS 다음)에 안내 문장이 없다 — conductor 「안내가 없어 조치하지 않았다」, 다음 verify full PASS → ship. 되풀이 0.
  (e) conductor가 팀 안의 어긋남(copy-dedupe build가 index에 `epoch` 필드 추가 — surface.md 「index 꼴을 바꾸지 않는다」)을 두 번(멈춤 보고·저녁 보고) CEO 확인으로 올렸다 — 대리는 「원문 밖 — 팀이 정리」로 돌려보냈다. 원문 밖 판단이 CEO에게 올라온 유일한 건.
  (f) try 사본의 `python -m snap`은 editable 설치(boot의 setup `pip install -e .`) 때문에 main의 src를 실행한다 — 사본과 main이 같은 커밋이라 카드엔 영향 없음(-fix도 머지 뒤 카드).
  (g) 원문 「1분 안에」 — 실제 폴링은 2~3초. `.hidden/` 폴더는 아직 복사된다(exclude M2).
- **다음**: 2라운드 아침 창(새 세션 「2일차」 — 상태 → 「가」) — 범위 순서 boot-fix → list-file → list-summary → deleted-mark → restore → restore-to → bad-input(7). 예측: 다시 무인 출하 5(human 센서는 start-stop만이라 미검수 3보다 먼저) · 낮 ship 5 · boot-fix 카드는 `snap`·`snap.cmd` 래퍼.

### 리눅스 2라운드 (2026-10-03 — 대리 CEO · conductor 세션 8b755a9a · 턴 9~14 · 헤드리스 `turn.sh`)
- **아침 창**(`--since` 16:59:25Z): 고정 첫 말(「상태 보여줘」) → 열린 질문 0 · 미검수 0 · 범위 순서 boot-fix → list-file → … → 「가. 매 spawn 뒤 work.mjs spawned를 남겨라」. 접점 줄 없음(decide·scope 0) — 아침 창 끝은 「가」의 때. 아침 창 CEO-분 1.0.
- **무인**(17:00 → 19:34:57, 157.5분): ship 5(boot-fix 17:19 → list-file 17:45 → list-summary 18:09 → deleted-mark 18:56 → restore 19:34) → **멈춤 「무인 출하 5」**(미검수 1/3 — boot-fix human@win32) · 낮 접점 0 · 팩 상한 FAIL 1(restore build 33.7KB → `--large` 한 번에) · `verify.mjs FAIL gate` 1(17:03, boot-fix spec 뒤 — 안내 없는 줄, 정지 아님) · 가드 거부 5(관찰 b) · spawned 20/20 · 데몬 잔류 0.
- **시험 장치 사고(프레임워크 아님 — 대리의 것)**: 「가」 턴을 정비 채널의 배경 상한(2시간)으로 돌려 19:00:4x에 `claude -p`가 밖에서 죽었다(restore의 첫 build 팩이 뜬 지 40초 — 그 spawn은 결과도 `spawned`도 없다). 19:01:41 같은 세션을 `--resume`으로 「CEO는 아직 없다. 세션이 밖에서 끊겼었다 — 「아침」 절대로 next.mjs 한 줄을 이어 따라라」로 이었다(낮의 말 1 — 결정 아님) → next가 같은 build 팩을 다시 내 restore가 19:34에 출하. 끊김 ≈1분이 무인 분에 든다. 뒤 턴은 `setsid`로 떼어 돌린다(`turn-bg.sh`).
- **표**(`day.mjs` — conductor의 표와 접점·출하·토큰·카드 일치, 무인 157.2 vs 157.5 — 아침 창 끝을 첫 말의 때(16:59:25)로 잡은 대리와 첫 state.mjs 생성(16:59:44)으로 잡은 conductor의 차이): 아침 창 끝 16:59:25(첫 말 — 접점 줄 없음) · 첫 ship 17:19:25(boot-fix) · 저녁 창 시작 19:36:54(try boot-fix) · **무인 157.5분** · 낮 경과(세 번째 ship) 70.5분 · **낮 접점 0** · 멈춤 19:34:57 · 규칙집 드리프트 0(`git log --since -- .garagiste` 빔 · `HEAD:.garagiste` 3568d58e… 그대로).

| 구간 | unit | 구성 | 시도 | seed→ship(분) | spawn | 토큰 | attack | redproof | tried | green 후 결함 | FAIL | RESPEC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 무인 | boot-fix | ①+② | 1 | 18.9 | 4/4 | 136K | 3→0/3 | base_red head_green | ok(CEO) | 0 | 0 | 0 |
| 무인 | list-file | ①+② | 1 | 26.1 | 4/4 | 153K | 5→0/5 | base_red head_green | ok(CEO) | 0 | 0 | 0 |
| 무인 | list-summary | ①+② | 1 | 24.3 | 4/4 | 141K | 2→0/3 | base_red head_green | ok(CEO) | 0 | 0 | 0 |
| 무인 | deleted-mark | ①+② | 1 | 46.4 | 4/4 | 176K | 4→0/4 | base_red head_green | ok(CEO) | 0 | 0 | 0 |
| 무인 | restore | ①+② | 1 | 38.2(끊김 ≈1 포함) | 4(+1 끊김)/4 | 185K | 3→0/3 | base_red head_green | ok(CEO) | 0 | 0 | 0 |
| 계 | 5 | | 5 | 153.9 | 20/20 | 791K | 선발견 17→0 | | ok 5 · fail 0 | **0** | 0 | 0 |

- 카드 5(ok 5 · fail 0) — 전부 저장소 밖 폴더에서 원문 경계로: boot-fix ok(PATH 앞에 사본 → /tmp에서 `which snap`이 사본의 래퍼 · `snap` → `snap 0.0.1` · frobnicate·인수 없는 start는 한 줄 exit 2 · 공백 든 지킬 폴더로 start → status → stop · 저장소 밖 symlink로도 돈다 · 래퍼는 자기 옆 src를 PYTHONPATH로 실행한다 — 사본 코드 · `snap.cmd`는 리눅스 단일이라 확인 안 함) · list-file ok(세 사본 → 「2026-10-03 19:38:22  a/b.2026-10-03T19-38-22.txt」 꼴 세 줄 오름차순, 폴더 안에서 상대 경로도 같다 · 사본 없는 파일 「사본 없음」 exit 0 · 지키지 않는 파일 한 줄 exit 1) · list-summary ok(파일 2 · 사본 3 · 건너뛴 수 0 = status · 감시 없으면 「지키는 폴더 없음」 exit 0) · deleted-mark ok(지운 2초 뒤 「지워짐 2026-10-03 19:41」 · 사본 그대로 · 폴더째 지우면 파일마다 · 다시 만든 파일은 새 사본 + 지워짐 줄이 역사로 · 요약의 파일 수에 지워진 파일도) · restore ok(첫 시각으로 → v1, 덧쓴 내용의 사본이 먼저 남는다 · latest → 그 직전 마지막 사본 · 사본 이름 꼴 시각도 받음 · 이른 시각 「되살릴 사본이 없다」 exit 1 · 틀린 꼴 exit 1 · 지운 파일도 latest로 되살아남 · 되살리기는 사본 수를 늘리지 않음).
- 열린 질문 0 · 팀이 정한 것 11(boot-fix 1 · list-file 1 · list-summary 4 · deleted-mark 3 · restore 2 — 뒤집은 것 0) · REPORT 없음(범위 10/12).
- **CEO-분(기계 셈)**: 아침 창 1.0분(말 2) · 저녁 창 8.8분(말 3 — 카드 셋·둘을 묶어 답함 · 카드 5 · 대기 3.3) · 낮의 말 1(끊김 뒤 resume 한 줄 — 결정 아님) · 카드 시간 합 15.4분(try → tried 5/5) · **unit당 2.0분**.
- **시계 검사**(main ce7bc34 clone `snap-r2` · full = 96 tests 328초(skipped 4 — 윈도우 몫)): `CLOCK C1·C2·C3·C4 exit 0` — **PASS 4/4**(1317초 — full이 96 tests 5.5분으로 자랐다). 1라운드와 같이 날짜 이동은 파이썬에 닿지 않는다(사실상 시간대 검사).
- 판단 칸: 구성 — 다섯 다 ①+②(인수·공격 테스트가 `python -m snap start`로 데몬을 실제 띄운다 · boot-fix는 래퍼 실행) · **프레임워크 FAIL 정지 0**(팩 상한 FAIL 1 — `--large` 한 번에 · `FAIL gate` 1 — 다음 verify PASS) · 데몬 잔류 0(팩·카드 뒤 `pgrep -af snap` — 시계 검사와 3라운드 팩이 임시 HOME에 띄운 테스트 데몬만 잠깐 보였다).
- **판정: Q5 라운드 통과** — 낮 접점 0 · 드리프트 0 · 멈춤 여섯 중 하나(무인 출하 5) · 카드 5 ≥3 · 프레임워크 FAIL 정지 0. **green 후 CEO 발견 결함 0**(누적 1 — 1라운드 boot). boot-fix가 1라운드의 결함을 닫았다(카드 ok).
- 비용 **$13.32**(세션 8b755a9a 누적 — 아침 턴 9 0.52 · 「가」 턴(끊긴 몫 포함)+resume 턴 11 끝 11.77 · 저녁 1.55) · 토큰 791K.
- 예측 채점(2라운드 분): 2) **✓** 멈춤 = 무인 출하 5(미검수 1 — human 센서는 boot-fix만) · 낮 ship 5 3) **✗ 시계 red 0**(list의 시각·「지워짐」 시각·restore의 시각 비교가 시간대에 흔들리지 않았다 — 날짜 이동은 파이썬에 닿지 않음) 4) **✓** 정지 0(팩 상한 1 · 가드 5 — 데몬·fixture·flake 없음) 5) 결함 0(누적 1) 6) 비용 $13.32(예측 7~12 — ✗ 12 초과 — 낮이 157분, 끊긴 턴의 몫이 든다) · CEO-분 아침 1.0 · 저녁 8.8 · unit당 2.0 7) **✓** FAIL 줄 되풀이 0 · RESPEC 0.
- **관찰(장치 아님 — 측정 모드, 표 이후 후보)**:
  (a) **낮이 1라운드보다 길다**: unit당 seed→ship 30.8분(1라운드 16.0) — build 팩이 7~16분(1라운드 2~10), deleted-mark 46분(spec 11분 · build 16분 ×2). 토큰 791K(1라운드 675K). 두 시간 배경 상한에 걸린 뿌리.
  (b) **가드 거부 5 — 다섯 다 `$W=…` 변수 경로의 Bash heredoc 쓰기**(boot-fix `T=$(mktemp -d)` · list-file `cat > $W/src/snap/…` · list-summary `cat >> $W/src/…`·`mkdir -p $W/te…` · restore `cat > $W/src/snap/restore.py`) — 전부 worktree 안을 가리키는데 가드가 변수를 풀지 못해 거부(1라운드 셋과 같은 계급 — 6판 누적 8). 팩은 매번 다른 길로 끝냈다.
  (c) `verify.mjs FAIL gate` 안내 없는 줄 — 2라운드에도 1(17:03 boot-fix) — 누적 2.
  (d) 1라운드 카드 메모 「.hidden/ 복사」·「같은 백업 폴더 공유」는 이번 라운드 unit에 닿지 않았다(exclude는 M2) — deleted-mark의 fix 커밋이 「같은 백업 폴더 공유를 바로잡는다」를 담았다(팀이 스스로).
  (e) 끊긴 spawn은 원장에 pack 줄만 남고 spawn/spawn_stop이 없다 — conductor가 「원장에는 그 pack 줄 하나에 spawn_stop이 둘일 수 있다」고 사실로 남겼다(실제: pack 20 · spawn 20 · spawn_stop 20 — 다시 띄운 팩이 새 pack 줄을 쓰지 않았다).
- **다음**: 3라운드 아침 창(새 세션 — 상태 → 「가」) — 남은 M1 둘(restore-to → bad-input) → **SCOPE DONE** 예상 → system-attack 한 바퀴 → REPORT(낮의 일). 멈춤 = SCOPE DONE 또는 system-1 뒤 미검수. 턴은 `turn-bg.sh`(setsid)로.

### 리눅스 3라운드 (2026-10-03 — 대리 CEO · conductor 세션 6b92e952 · 턴 15~18 · 헤드리스, 「가」 턴은 `turn-bg.sh`로 떼어)
- **아침 창**(`--since` 19:46:44Z): 「상태 보여줘」 → 열린 질문 0 · 미검수 0 · 남은 M1 둘(restore-to → bad-input) → 「가. 매 spawn 뒤 work.mjs spawned를 남겨라」. 접점 줄 0. 아침 창 CEO-분 1.0.
- **무인**(19:47:46 → 22:15:16, 147.5분): restore-to(20:39) → bad-input(21:46) → **SCOPE DONE**(M1 12/12) → system-1 이음새 공격(red 6 → fix a403172 「이음새 여섯 곳」 → ship 22:15) → REPORT(f5c2658) → **멈춤 SCOPE DONE** 22:15. 낮 접점 0 · 팩 상한 FAIL 2(bad-input build 34.7KB · system-1 build 52.0KB — 각 `--large` 한 번에) · 가드 거부 1(restore-to spec, `$W/tests/acceptance/restore-to.py` — 변수 경로) · spawned 10/10 · 데몬 잔류 0. 끊김 없음(분리 실행).
- **표**(`day.mjs` — conductor의 표와 접점·출하·토큰·카드·spawn 일치, 무인 150.2 vs 150.5 — 아침 창 끝을 첫 말의 때로 잡는 기준은 같고 초 단위(19:47:00 대 19:46:44)만 다르다): 아침 창 끝 19:46:44(첫 말 — 접점 줄 없음) · 첫 ship 20:39:53(restore-to) · 저녁 창 시작 22:17:11(try restore-to) · **무인 150.5분** · 낮 경과(세 번째 ship = system-1) 148.5분 · **낮 접점 0** · 멈춤 22:15:16(report) · 규칙집 드리프트 0(`HEAD:.garagiste` 3568d58e… 그대로).

| 구간 | unit | 구성 | 시도 | seed→ship(분) | spawn | 토큰 | attack | redproof | tried | green 후 결함 | FAIL | RESPEC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 무인 | restore-to | ①+② | 1 | 52.0 | 4/4 | 154K | 3→0/3 | base_red head_green | ok(CEO) | 0 — 메모: 없음 | 0 | 0 |
| 무인 | bad-input | ①+② | 1 | 66.6 | 4/4 | 218K | 4→0/4 | base_red head_green | ok(CEO) | 0 — 메모: `list --bogus`는 파일 경로로 읽혀 한 줄 exit 1(원문 안) | 0 | 0 |
| 무인 | system-1 | ③ 이음새 | 1 | 28.6 | 2/2 | 153K | 6→0/6 | system | ok(CEO) | 0 — 이음새 다섯을 손으로(서머타임은 테스트만) | 0 | 0 |
| 계 | 3(unit 2 + system 1) | | 3 | 147.2 | 10/10 | 525K | 선발견 13→0 | | ok 3 · fail 0 | 0 | 0 | 0 |

- 카드 3(ok 3 · fail 0) — 전부 저장소 밖 폴더에서 원문 경계로: restore-to ok(첫 시각 → `--to desk/b-old.txt`에 v1, 원래 자리는 v2 그대로 · 같은 명령은 「이미 있어서 덮지 않았다」 exit 1 · list 두 줄 그대로(copies 2) · `--to` 폴더면 원래 이름으로 · 없는 부모 폴더 생성 · 상대 경로는 친 폴더 기준 · 백업 폴더 안은 거절) · bad-input ok(`start ""` stderr 한 줄 exit 1 · 지킬 폴더 안 백업 폴더 거절에 폴더 안 생김 · 없는 날짜·숫자만 시각·인수 모자람·없는 폴더·모르는 폴더 stop·제어문자 경로 모두 한 줄·0 아닌 코드 · Traceback 0 · status에 감시 하나) · system-1 ok(가짜 `snap.py`가 든 지킬 폴더에서도 감시가 돈다 · 감시 중 망가뜨린 index는 덮지 않고 status·list가 「알 수 없음(…망가졌다)」 · stop 뒤·다른 폴더 start 뒤에도 list·restore · `--to` 다른 감시의 백업 폴더 안 거절 · 줄바꿈 든 경로의 status 덩어리 — 서머타임 겹침은 손으로 못 봄).
- REPORT(`docs/REPORT.md` 73줄 — 손편집 없음): 출하 12/12 · 팀이 정한 것 25 · 못 본 것 0 · 「써봤다」 열에 boot fail·나머지 ok, restore-to·bad-input 「안 써봄」(저녁 카드 전).
- 열린 질문 0 · 팀이 정한 것 5(restore-to 2 · bad-input 3 — 뒤집은 것 0).
- **CEO-분(기계 셈)**: 아침 창 1.0분(말 2) · 저녁 창 6.6분(말 2 — 카드 셋을 묶어 답함 · 카드 3 · 대기 2.6) · 낮의 말 0 · 카드 시간 합 13.2분(try → tried 3/3) · **unit당 2.5분**.
- **시계 검사**(main f5c2658 clone `snap-r3` · full = 125 tests 456초(skipped 4)): `CLOCK C1·C2·C3·C4 exit 0` — **PASS 4/4**(1819초). 세 라운드 12/12 — 날짜 이동은 파이썬에 닿지 않는다(시간대 검사).
- 판단 칸: 구성 — restore-to·bad-input ①+②(인수·공격이 데몬을 실제 띄움), system-1 ③(이음새 — 출하 unit 12개 사이, 공격 6 전부 red → fix 1 커밋) · **프레임워크 FAIL 정지 0**(팩 상한 FAIL 2 — `--large` 한 번에) · 데몬 잔류 0(팩·카드·시계 검사 뒤 `pgrep -af snap` 빔 — 6판 세 라운드 모두 0).
- **판정: Q5 라운드 통과** — 낮 접점 0 · 드리프트 0 · 멈춤 여섯 중 하나(SCOPE DONE) · 카드 3 ≥3 · 프레임워크 FAIL 정지 0. **green 후 CEO 발견 결함 0**(누적 1 — 1라운드 boot).
- 비용 **$9.43**(세션 6b92e952 누적 — 아침 턴 15 0.44 · 「가」 턴 16 끝 8.03 · 저녁 1.40) · 토큰 525K.
- 예측 채점(3라운드 분): 2) 멈춤 = **SCOPE DONE**(예측은 1라운드의 모양 — 3라운드엔 범위가 끝났다) 3) **✗ 시계 red 0**(세 라운드 12/12 PASS — 예측 ≥1) 4) **✓** 정지 0 — 다만 예측한 「시간 기반 테스트의 flake」가 모습을 보였다: build 팩 둘이 full 첫 실행에서 `tests/adversary/start-stop-1.py`·`-2.py`의 병렬 start 간헐 실패를 보고하고 재실행 PASS(팩이 스스로 넘김 — 정지 아님) 5) 결함 0(누적 1 — 1라운드 boot) 6) 비용 $9.43(7~12 — ✓) · CEO-분 아침 1.0 · 저녁 6.6 · unit당 2.5 7) **✓** FAIL 줄 되풀이 0 · RESPEC 0.
- **관찰(장치 아님 — 측정 모드)**:
  (a) **build 팩이 길다**: 17~36분(bad-input 2차 35.5분 · restore-to 2차 29.9분) — 1라운드 2~10분. unit당 seed→ship 59분(1라운드 16 · 2라운드 31). 낮 147분에 unit 둘 + system. 뿌리 후보: 인수·공격 테스트가 데몬을 실제 띄워 full이 5.5분+(96 tests)이고 build 팩이 full을 여러 번 돈다.
  (b) 팩 상한 FAIL 2 — system-1 build 52KB(상한의 1.6배 — 「2배 안이라 --large」). 6판 누적 7(1라운드 4 · 2라운드 1 · 3라운드 2).
  (c) 가드 거부 1(`$W` 변수 경로) — 6판 누적 9, 전부 같은 계급.
  (d) bad-input attack이 red 4를 두 번 적었다(21:10:38 · 21:11:25 같은 tree) — attack 줄 중복 1(사실만).
  (e) 병렬 start 테스트 flake(위 4)) — 팩 보고에만 있고 원장 FAIL 줄은 없다.
- **다음**: 6판 끝 — 아래 「6판 닫기」.

## 6판 닫기 — 세 라운드 끝 (2026-10-03)
- **게이트(등록: 세 라운드 누적 「green 후 CEO 발견 결함」 0 + 세 라운드 모두 정상 정지)**: 정상 정지 3/3(무인 출하 5 · 무인 출하 5 · SCOPE DONE) ✓ · **누적 결함 1**(1라운드 boot — Q1 「예」의 래퍼 둘이 어느 unit에도 실리지 않음, 계급 「결정→unit 누락」; 2라운드 boot-fix 카드 ok로 닫힘) → **등록한 그대로면 게이트 미통과**. 재분류는 CEO 결정(5판 사고 65처럼): 「boot의 인수(진입점·quick·full)는 섰고 래퍼는 unit 밖」으로 보면 결함 0 → 통과. 대리는 결함 1로 적는다 — 사용자는 원문의 `snap start …`를 하루 동안 그대로 칠 수 없었다.
- **홀드아웃 첫 측정 줄(범용성 점수)**: 멈춘 자리 — 1·2라운드 무인 출하 5(예산 상한, 그때 미검수 1/3) · 3라운드 SCOPE DONE(M1 12/12 + system-1 이음새 6→0 + REPORT) · 출하 unit 12 + fix 1 + system 1 · 낮 접점 0/0/0 · 드리프트 0 · 프레임워크 FAIL 정지 0 · CLOCK 12/12(파이썬엔 TZ만) · 카드 13(ok 12 · fail 1) · 비용 $31.39(8.64 · 13.32 · 9.43) · 토큰 2,011K · 무인 합 390.1분 · CEO-분 unit당 2.5 평균(3.0 · 2.0 · 2.5).
- **예측 채점(7)**: 1) ✗ unit 21(12~16) — 질문 수 3 ✓, 주제 넷 다 빗나감 2) ✓ 1라운드 멈춤 = 무인 출하 5 · 미검수(사람) 1 · 낮 ship 5 3) ✗ 시계 red 0/12(≥1) — 사본 시각이 mtime이어도 시간대에 흔들리지 않았고, 날짜 이동은 파이썬에 닿지 않았다(보관 규칙은 M3 — 범위 밖) 4) ✓ 정지 ≤1(실제 0) — 위험 목록 중 임시 폴더 쓰기 거부 1 · 병렬 start flake 1(팩 보고만), 데몬·100MB fixture 0 — 대신 **팩 상한 7**·**가드 변수 경로 9** 5) ✓ 누적 결함 1(≤2) — 계급은 예측 밖(결정→unit 누락, 데몬 수명·잠금·원자적 쓰기 0) 6) 비용 라운드당 $7~12 — 1·3 ✓ 2 ✗(13.32, 낮 157분) · 셋 $25~40 ✓ · CEO-분 아침 ≤5 — 1라운드 5.1 ✗(0.1) 2·3 ✓ · 저녁 ≤15 ✓✓✓ · unit당 ≤5 ✓✓✓ 7) ✓ 7건 장치 — FAIL 줄 되풀이 0 · 「예」→RESPEC 0 · 미검수 셈은 멈춤을 가르지 못했다(human 센서가 start-stop·boot-fix 둘뿐 → 무인 출하 5가 늘 먼저).
- **6판이 5판과 다른 것(사실만)**: 낮이 길다(unit당 seed→ship 16 → 31 → 59분, 1라운드 → 3라운드 — build 팩 7~36분, full 3 → 5.5분+) · 토큰 unit당 ≈ 140K(5판 ≈ 100K) · 팩 상한 FAIL 7(5판 라운드당 0~2) · 가드 거부 9 전부 `$W` 변수 경로(5판엔 백틱·임시 폴더) · 질문 3이 전부 저장 위치·실행 꼴(5판은 형식) · 대리의 시험 장치 사고 1(2시간 상한 → `turn-bg.sh`).
- **표 이후 후보(장치 아님 — 측정 모드가 끝났으니 CEO가 고른다; 사고 번호는 수리 때)**: (1) **결정→unit 누락** — decide KEPT의 산출물 문장을 unit 인수에 잇기(6판 결함 1의 뿌리) (2) **가드가 `$W=…` 변수 경로를 풀지 못한다** — 누적 9, 전부 worktree 안 (3) **팩 상한 32KB** — 데몬 제품의 build 팩은 인수+공격 테스트로 34~52KB, 7회 `--large` (4) `verify.mjs FAIL gate` 줄에 안내 없음 — 누적 2 (5) 정비 채널 도구: 배경 상한 2시간 → `turn-bg.sh`(setsid)를 `tests/field/`로 (6) conductor가 팀 안 어긋남(surface vs 구현)을 CEO 확인으로 올림 — 1회 (7) 끊긴 spawn의 원장 꼴(pack 줄 재사용 · spawned 미기록).
- **다음**: 6판 끝. CEO 결정 둘 — 게이트 재분류 여부 · 후보 (1)~(7) 중 수리할 것. 그 뒤는 시험이 아니라 실제 개발(HANDOFF).
- **수리 반영(2026-10-03, 6판 뒤 — 측정 모드 끝)**: 후보 (1) → 사고 66(decide의 답이 첫 needs unit의 인수에 「결정 Q<n> → 답: 질문」) · (2) → 사고 67(가드가 `$W` 대입과 줄 시작 cd를 푼다) · (3) → 사고 68(build 팩의 테스트 몫 초과는 자동 이유-차선) · (4) → 사고 69(FAIL gate 첫 줄에 첫 이유) · (5) → `tests/field/turn-bg.sh`. (6)·(7)은 남김(재현 없이는 장치 없음). 테스트 베드엔 반영하지 않는다(6판 끝) — 다음 머지가 동결 7. CHANGELOG 「사고 66~69」.
