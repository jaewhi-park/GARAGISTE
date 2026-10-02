# 세션 인수인계 — 프레임워크 정비 채널

정비 세션(GARAGISTE를 붙인 클라우드 Claude 세션)의 컨텍스트가 차면, 새 세션은 이 문서 하나로 재개한다. 작업 상태는 전부 저장소에 있다 — 이 문서는 「어디를 읽고 어떤 규칙으로 움직이는지」만 든다.

## 시작 절차
1. 레포는 **GARAGISTE 하나만** 붙인다. 시험대(침대)는 CEO PC의 로컬 폴더라 세션에 붙이지 않는다.
2. 읽는 순서: 이 문서 → `docs/BED-BLOCK.md`(CEO가 아직 실행하지 않은 침대 블록 — 있으면 첫 보고에서 실행 여부를 묻는다) → `docs/measurements/L2-TRIAL-2.md`(끝난 시험 — 2판 통과의 등록·표·판정) → `docs/V2-REPAIR-BACKLOG.md`(대기 작업 — 끝의 「표 이후 후보」) → `docs/measurements/FIELD-BENCH.md`(벤치 결과 원장·홀드아웃 규칙) → `CHANGELOG.md` 최근 절 → `team/HAZARDS.md`. 옛 시험: `L1-TRIAL.md` · `L2-TRIAL.md`(1판).
3. `node --test "tests/*.test.mjs"` 전부 초록을 확인한 뒤 작업을 시작하고, 현재 상태를 CEO에게 한 줄로 보고한다.
4. CEO가 「필드 벤치」를 말하면 `docs/measurements/FIELD-BENCH.md` 그대로(기본 측정 모드, 도구 `tests/field/`) — 결과는 그 문서의 결과 원장에 한 행씩 적고 푸시한다(컨테이너의 필드 폴더는 사라진다).

## 상시 규칙
- 역할: 정본 수리 · 시험 기록 · 백로그 처리. 침대(conductor 세션)에서 릴레이된 FAIL은 **그 줄 그대로** 받는다 — 임의 우회 · 침대에서만의 수리 금지.
- 수리는 항상 **정본 먼저**: 재현 테스트(red→green) + `team/HAZARDS.md` 한 줄 + `CHANGELOG.md` — 그 다음에 침대 반영.
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — `docs/BIRTH.md`. 수리와 장치를 구분한다.
- 침대 반영은 CEO가 PowerShell에 붙여넣는 블록으로 전달한다: `git fetch https://github.com/jaewhi-park/GARAGISTE <branch>` → `cmd /c "git show FETCH_HEAD:team/scripts/<f>.mjs > .garagiste\scripts\<f>.mjs"` → 커밋. 블록엔 **검증 줄 필수** — `git log -1 FETCH_HEAD --format=%h`(기대 해시를 블록에 명기) · `findstr /m "<마커 문자열>" <대상 파일>`. 수리가 main에 머지된 뒤에는 main에서 fetch가 기본.
- CEO 환경: Windows PowerShell(`X=1 cmd` 같은 env 접두·heredoc 불가). 출력·저장되는 상대 경로는 전부 `/`, 플랫폼 표기는 계산용 절대 경로에만.

## 상태 스냅샷 (2026-10-02 — 이후의 정본은 L2-TRIAL-2·백로그·CHANGELOG)
- **프레임워크**: 사고 1~57 수리 + try 사본 + attack 한 바퀴 · 테스트 90(`node --test "tests/*.test.mjs"`) · 설치 산문 28KB/40KB(HAZARDS 32줄 — 팩에 닿지 않는 줄은 테스트가 막는다). L2 2판이 끝나 **동결(9c677ec)은 풀렸다** — 정본 main은 45012b9(사고 57 · 팩 상한 기본 32 · attack은 spec 뒤 한 바퀴). 윈도우 침대는 아직 9c677ec — 반영 블록(attack 한 바퀴 + 상한 32)이 `docs/BED-BLOCK.md`에서 CEO 실행을 기다린다(57은 원문이 Node라 넣지 않는다).
- **L2 2판 — 통과(2026-10-02, 리눅스·윈도우 — 머지가 CEO 서명)**(`L2-TRIAL-2.md`): 원문 `tests/field/briefs/l2-todo-cli.md`로 빈 폴더 두 곳, 게이트는 환경마다.
  - **리눅스(정비 채널 컨테이너, 대리 CEO) — 게이트 통과** 3/3 · 누적 green 후 결함 0 · FAIL 0 · M1 8 출하 · 911K 토큰. 컨테이너의 필드 폴더는 세션과 함께 사라졌다 — 기록은 문서에만.
  - **윈도우(CEO PC, 폴더 예: `C:\L2\todo-win`) — 게이트 통과** 3/3 · M1 9 출하 · tried 9 ok · CEO 버그 보고 0 · 4.10M 토큰. 한계: 2·3일차는 일차 표 없이 conductor의 M1 집계 보고로(낮 접점·무인 분 못 잼) · 약 3시간 압축 · conductor 규율 이탈 2(「다 ok」를 Q10 「예」로 · 「저녁」 오독) · try 사본 흐름의 윈도우 검증 기록 없음.
  - **윈도우의 큰 발견**: 1일차 두 unit에 토큰 16배(add 28·add-due-tag 20바퀴) — 2·3일차 6 unit은 같은 conductor가 전부 1바퀴. 원인은 Flow 4의 빈칸(고친 뒤 attack 팩을 새로 띄우나) — 백로그 1순위(코드로: unit당 1바퀴 · 2바퀴째는 CEO 질문). 윈도우에서만 난 것: CRLF(4 unit) · Q9 글자 빠짐(추정 인코딩).
  - 이 원문은 소진 — 정비·회귀에 쓸 수 있다. 다음 범용성 측정의 홀드아웃은 `holdout-library.md`(아래 필드 벤치).
- **CEO 대기 결정**: 장치 채용(백로그 표 이후 후보 — 1순위 attack 바퀴는 채용: spec 뒤 한 바퀴, CEO 질문 없이) · Q9 원문 줄(인코딩 재현용) · 윈도우 프로젝트의 CRLF 수정 unit(conductor 권고 — 정비 채널: 예) · 윈도우 add의 공격 테스트 35개 목록(리눅스 결과물에 돌려 측정만) · 윈도우 침대 반영 블록 실행(`docs/BED-BLOCK.md` 1 — CEO 환경 대기, M2 conductor 세션 전).
- **필드 벤치**: 필드 1(파이썬)·2(웹)·3(Go, 소진된 홀드아웃) 모두 회귀용 — 마지막 측정 070f185(2026-10-02, try 사본의 첫 벤치): 웹·Go FAIL 0 · SCOPE DONE · try 사본 13 · main 깨끗, 파이썬은 add-entry redproof에서 정지(boot의 test_file이 하이픈 파일을 0건 실행·exit 0 → 거짓 base green) → 사고 57 수리 0ab3a05 → 파이썬 재측정 SCOPE DONE · FAIL 0 · $3.30. 비용 예상은 한 회(세 필드) ≈ $30 · 한 필드 ≈ $10(CEO). **홀드아웃**: `tests/field/briefs/holdout-library.md`(작은 도서관 대출 관리 — Python 실행 무의존 웹 앱 + 데이터 파일 하나, L2 규모) · 2026-10-02 CEO 서명, 4c42611로 고정 · 아직 안 쟀다 — 첫 측정 전엔 수리에 쓰지 않는다.
- **다음 세션의 첫 일**: 시작 절차대로 보고하면서 BED-BLOCK의 미실행 블록을 CEO에게 묻는다 — CEO가 결과(마지막 커밋 줄)를 붙이면 BED-BLOCK에서 그 블록을 지우고 L2-TRIAL-2 「2판 수정 2」 끝에 「침대 반영 <해시>」 한 줄 · 멈춤(throw) 줄이면 그 줄 그대로 받아 원인부터. 그 다음은 **L2 벤치**(CEO 2026-10-02 「좋아」 — L2는 L1을 포함한다: 하루 안의 unit 루프가 L1 그대로라 L1 수치가 L2 표에서 나온다, 예외는 순정 A/B·3-unit 구성과 답 대기가 섞인 seed→출하): ① 날짜별 표 스크립트(원장 → 표 머리·unit 표, `L2-day-conductor.md` 「저녁」 절의 정의 그대로, 답 대기를 뺀 seed→출하도 — 판단 없는 산수) ② `FIELD-BENCH.md`를 L2 모드로(날마다 새 conductor 세션 · 아침 창/저녁 창 · 대리 CEO는 창에서만 답 · 낮 접점 0 · L1 수치는 같은 표에서) ③ 회귀 원문은 `l2-todo-cli`(소진 — 이미 L2 규모: M1 8~9 unit = 3일, 리눅스·윈도우 기준선 있음)로 회귀 한 회 ④ **홀드아웃 첫 측정** — `holdout-library.md`(2026-10-02 서명·고정)를 ②의 L2 모드·측정 모드로: 정비 채널이 대리 CEO(창에서만 · 재량은 `FIELD-BENCH.md` 홀드아웃 절에 서명 때 밝힌 그대로 — 빈칸에 미리 답을 정하지 않는다), 윈도우는 원문 요구로만(벤치는 컨테이너 — 윈도우 측정은 CEO가 원할 때, 그 PC에 Python 3). brownfield는 L3(Q13) 홀드아웃으로. 그 밖엔 CEO가 고르는 것(표 이후 후보 · 필드 벤치).
- **반영 블록의 교훈**(2026-10-01): fetch가 실패하면 `cmd /c "git show FETCH_HEAD:… > 파일"`이 규칙집을 빈 파일로 덮는다 — 블록은 반드시 `git log -1 FETCH_HEAD --format=%h`가 기대 해시인지 확인하고 아니면 throw한 뒤에 복사한다. 정본 커밋은 SHA로 fetch한다(`git fetch <url> <전체 SHA>` — main이 움직여도 블록이 낡지 않는다, 2026-10-02). 템플릿 변경(CLAUDE.md)은 그 줄만 바꾸는 스크립트로(boot가 채운 나머지 보존), 파일 쓰기는 UTF-8 BOM 없이·원래 줄끝 유지.
