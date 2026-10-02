# 세션 인수인계 — 프레임워크 정비 채널

정비 세션(GARAGISTE를 붙인 클라우드 Claude 세션)의 컨텍스트가 차면, 새 세션은 이 문서 하나로 재개한다. 작업 상태는 전부 저장소에 있다 — 이 문서는 「어디를 읽고 어떤 규칙으로 움직이는지」만 든다.

## 시작 절차
1. 레포는 **GARAGISTE 하나만** 붙인다. 시험대(침대)는 CEO PC의 로컬 폴더라 세션에 붙이지 않는다.
2. 읽는 순서: 이 문서 → `docs/BED-BLOCK.md`(CEO가 아직 실행하지 않은 침대 블록 — 3판 동안은 선택이라 묻지 않는다) → `docs/measurements/L2-TRIAL-3.md`(3판 — 등록·진행·표, 2026-10-02 서명 · 리눅스 1~7일과 복귀 창 기록 끝 · 윈도우는 CEO 대기) → `docs/measurements/L2-TRIAL-2.md`(끝난 시험 — 2판 통과의 등록·표·판정) → `docs/V2-REPAIR-BACKLOG.md`(대기 작업 — 끝의 「표 이후 후보」) → `docs/measurements/FIELD-BENCH.md`(벤치 결과 원장·홀드아웃 규칙) → `CHANGELOG.md` 최근 절 → `team/HAZARDS.md`. 옛 시험: `L1-TRIAL.md` · `L2-TRIAL.md`(1판).
3. `node --test "tests/*.test.mjs"` 전부 초록을 확인한 뒤 작업을 시작하고, 현재 상태를 CEO에게 한 줄로 보고한다.
4. CEO가 「필드 벤치」를 말하면 `docs/measurements/FIELD-BENCH.md` 그대로(기본 측정 모드, 도구 `tests/field/`) — 결과는 그 문서의 결과 원장에 한 행씩 적고 푸시한다(컨테이너의 필드 폴더는 사라진다).

## 상시 규칙
- 역할: 정본 수리 · 시험 기록 · 백로그 처리. 침대(conductor 세션)에서 릴레이된 FAIL은 **그 줄 그대로** 받는다 — 임의 우회 · 침대에서만의 수리 금지.
- 수리는 항상 **정본 먼저**: 재현 테스트(red→green) + `team/HAZARDS.md` 한 줄 + `CHANGELOG.md` — 그 다음에 침대 반영.
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — `docs/BIRTH.md`. 수리와 장치를 구분한다.
- 침대 반영은 CEO가 PowerShell에 붙여넣는 블록으로 전달한다: `git fetch https://github.com/jaewhi-park/GARAGISTE <branch>` → `cmd /c "git show FETCH_HEAD:team/scripts/<f>.mjs > .garagiste\scripts\<f>.mjs"` → 커밋. 블록엔 **검증 줄 필수** — `git log -1 FETCH_HEAD --format=%h`(기대 해시를 블록에 명기) · `findstr /m "<마커 문자열>" <대상 파일>`. 수리가 main에 머지된 뒤에는 main에서 fetch가 기본.
- CEO 환경: Windows PowerShell(`X=1 cmd` 같은 env 접두·heredoc 불가). 출력·저장되는 상대 경로는 전부 `/`, 플랫폼 표기는 계산용 절대 경로에만.

## 상태 스냅샷 (2026-10-02 늦게 — 이후의 정본은 L2-TRIAL-3·백로그·CHANGELOG)
- **프레임워크**: 사고 1~59 수리 + try 사본 + attack 한 바퀴 + 팩 상한 이유-차선(측정 H3 — 상한~2배는 `--large "<이유>"`, 2배 넘으면 CEO) · 테스트 105(`node --test "tests/*.test.mjs"` — 필드 도구 13 포함) · 설치 산문 31.5KB/40KB(HAZARDS 34줄 — 팩에 닿지 않는 줄은 테스트가 막는다). L2 2판이 끝나 **동결(9c677ec)은 풀렸다** — 정본 team/은 ede9930(사고 57 · 팩 상한 기본 32 · attack은 spec 뒤 한 바퀴 · 사고 58·59 · 팩 상한 이유-차선 — main에 머지). 윈도우 침대는 아직 9c677ec — 반영 블록(정본 ede9930: 사고 58·59와 그 바탕 57 · attack 한 바퀴 · 상한 32 · 이유-차선 · selftest)이 `docs/BED-BLOCK.md`에서 CEO 실행을 기다린다 — 선택: 3판은 새 폴더에 새 설치(같은 날의 45012b9 · 1b05168 블록을 대체 — 58·59가 57 위에 지어져 57도 온다).
- **L2 2판 — 통과(2026-10-02, 리눅스·윈도우 — 머지가 CEO 서명)**(`L2-TRIAL-2.md`): 원문 `tests/field/briefs/l2-todo-cli.md`로 빈 폴더 두 곳, 게이트는 환경마다.
  - **리눅스(정비 채널 컨테이너, 대리 CEO) — 게이트 통과** 3/3 · 누적 green 후 결함 0 · FAIL 0 · M1 8 출하 · 911K 토큰. 컨테이너의 필드 폴더는 세션과 함께 사라졌다 — 기록은 문서에만.
  - **윈도우(CEO PC, 폴더 예: `C:\L2\todo-win`) — 게이트 통과** 3/3 · M1 9 출하 · tried 9 ok · CEO 버그 보고 0 · 4.10M 토큰. 한계: 2·3일차는 일차 표 없이 conductor의 M1 집계 보고로(낮 접점·무인 분 못 잼) · 약 3시간 압축 · conductor 규율 이탈 2(「다 ok」를 Q10 「예」로 · 「저녁」 오독) · try 사본 흐름의 윈도우 검증 기록 없음.
  - **윈도우의 큰 발견**: 1일차 두 unit에 토큰 16배(add 28·add-due-tag 20바퀴) — 2·3일차 6 unit은 같은 conductor가 전부 1바퀴. 원인은 Flow 4의 빈칸(고친 뒤 attack 팩을 새로 띄우나) — 백로그 1순위(코드로: unit당 1바퀴 · 2바퀴째는 CEO 질문). 윈도우에서만 난 것: CRLF(4 unit) · Q9 글자 빠짐(추정 인코딩).
  - 이 원문은 소진 — 정비·회귀에 쓸 수 있다. 다음 범용성 측정의 홀드아웃은 `holdout-library.md`(아래 필드 벤치).
- **CEO 대기 결정**: 장치 채용(백로그 표 이후 후보 — 1순위 attack 바퀴는 채용: spec 뒤 한 바퀴, CEO 질문 없이 · 팩 상한 이유-차선도 채용 2026-10-02, 64KB 벽의 자동 나누기는 보류) · Q9 원문 줄(인코딩 재현용) · 윈도우 프로젝트의 CRLF 수정 unit(conductor 권고 — 정비 채널: 예) · 윈도우 add의 공격 테스트 35개 목록(리눅스 결과물에 돌려 측정만) · 윈도우 침대 반영 블록(`docs/BED-BLOCK.md` 1 — 선택: 3판 윈도우는 새 설치라 todo-win M2를 이어 쓸 때만).
- **필드 벤치**: 필드 1(파이썬)·2(웹)·3(Go, 소진된 홀드아웃) 모두 회귀용 — 마지막 측정 070f185(2026-10-02, try 사본의 첫 벤치): 웹·Go FAIL 0 · SCOPE DONE · try 사본 13 · main 깨끗, 파이썬은 add-entry redproof에서 정지(boot의 test_file이 하이픈 파일을 0건 실행·exit 0 → 거짓 base green) → 사고 57 수리 0ab3a05 → 파이썬 재측정 SCOPE DONE · FAIL 0 · $3.30. 비용 예상은 한 회(세 필드) ≈ $30 · 한 필드 ≈ $10(CEO). **홀드아웃**: `tests/field/briefs/holdout-library.md`(작은 도서관 대출 관리 — Python 실행 무의존 웹 앱 + 데이터 파일 하나, L2 규모) · 2026-10-02 CEO 서명, 4c42611로 고정 · 첫 측정 9be0e15(6일차 프레임워크 FAIL 정지 · 출하 10/19 · green 후 결함 0) 뒤 사고 58·59 수리로 **소진 → 필드 4(회귀)** — 다음 홀드아웃은 `holdout-futsal.md`(L2 3판 원문, 2026-10-02 서명 — PR #95).
- **L2 3판 — 리눅스 끝, 윈도우 대기**(`L2-TRIAL-3.md` · 동결 d0691270b88cc958032178aac54b4a5bf769ccbd = PR #95 머지, team/ = ede9930 · 시험 중 수리 0):
  - **리눅스(정비 채널 대리, 2026-10-02)**: Q5 1~3일 통과(낮 접점 0 · FAIL 정지 0 · 결함 0 — 범용성 점수, 출하 5/14: 2·3일은 spec 팩 4번 「데이터 모델·파일 형식 = hard 결정 → ask」대로 spec마다 저장 꼴을 물어 한 출하씩) · **Q6 미통과**(스트림 세션 — 네 말 중 버그 → -fix unit · 추가 → BACKLOG만 제 객체, 수정 「라운드는 일요일로」는 닿는 unit이 시작 전이라 BRIEF만 · 방향전환 「CSV…빼자」는 범위 밖 줄이라 drop FAIL 뒤 BRIEF만 · 무관 unit 정지 0) · **Q7 통과**(부재 선언 직후 같은 세션이 「부재 첫날」의 일을 하고 미검수 3에서 멈춤 → 5~7일 세션은 시작하자마자 멈춤 · ship 시도 0 · 드리프트 0 · 복귀 창 카드 3/3 ok) · 누적 green 후 결함 0(tried 11/11) · $28.80 → **리눅스 게이트 미통과(Q6)**. 필드 폴더는 컨테이너와 함께 사라졌다 — 기록은 문서에만.
  - **윈도우(CEO)**: 지시는 L2-TRIAL-3 「윈도우 — CEO에게 넘김」(점검 → 새 폴더 설치 → 날마다 첫 말 · 저녁 끝 `day.mjs` 출력 붙이기). 순서 조정: 리눅스 4~7일을 윈도우보다 먼저 돌렸다(필드 폴더의 수명 — 등록문의 순서 이유는 지켜졌다). **다음 세션의 첫 일 — CEO가 붙인 윈도우 일차 출력을 L2-TRIAL-3에 기록**하고, 윈도우 3일이 끝나면 L2 3판 전체 판정.
  - **CEO 결정 대기**: Q6을 어떻게 닫나(① 이 판정 그대로 두고 Flow 7 빈칸을 고친 판에서 Q6만 다시 잰다 — 정비 채널 권고 ② 대리 plan 몫을 빼고 다시 판정) · 표 이후 후보 다섯(L2-TRIAL-3 「L2 3판 리눅스 판정」 끝 — Flow 7의 시작 전 unit 수정 · 범위 밖 줄 방향전환 · 부재 선언 뒤 루프 · 스트림의 말이 드는 자리 · spec의 저장 꼴 질문).
  - 도구: Q6 스트림 세션 `tests/field/stream.mjs`(run · say · end · report — plan이 원장 시점에 말을 넣는다) · 필드 테스트 13(전체 105).
- **반영 블록의 교훈**(2026-10-01): fetch가 실패하면 `cmd /c "git show FETCH_HEAD:… > 파일"`이 규칙집을 빈 파일로 덮는다 — 블록은 반드시 `git log -1 FETCH_HEAD --format=%h`가 기대 해시인지 확인하고 아니면 throw한 뒤에 복사한다. 정본 커밋은 SHA로 fetch한다(`git fetch <url> <전체 SHA>` — main이 움직여도 블록이 낡지 않는다, 2026-10-02). 템플릿 변경(CLAUDE.md)은 그 줄만 바꾸는 스크립트로(boot가 채운 나머지 보존), 파일 쓰기는 UTF-8 BOM 없이·원래 줄끝 유지. 블록 전체는 `& { … }` 하나로(안에 빈 줄 없이 — 2026-10-02): 붙여넣기가 줄마다 실행되면 맨 위 throw는 그 줄만 멈춰, 감싸지 않은 블록이 사전 점검의 멈춤 뒤에도 돌아 CEO의 커밋 안 된 줄까지 커밋했다(정비 채널 재현). 사전 점검은 쓰기 전에 전부, 쓰기·selftest는 try로 묶어 멈추면 되돌린다. 블록은 정비 채널에서 PowerShell 7(리눅스, 압축 tarball)과 cmd 대역으로 모의 침대에 돌려 보고 전달한다.
