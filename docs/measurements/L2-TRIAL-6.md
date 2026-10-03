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
