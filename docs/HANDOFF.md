# 세션 인수인계 — 프레임워크 정비 채널

정비 세션(GARAGISTE를 붙인 클라우드 Claude 세션)의 컨텍스트가 차면, 새 세션은 이 문서 하나로 재개한다. 작업 상태는 전부 저장소에 있다 — 이 문서는 「어디를 읽고 어떤 규칙으로 움직이는지」만 든다.

## 시작 절차
1. 레포는 **GARAGISTE 하나만** 붙인다. 시험대(침대)는 CEO PC의 로컬 폴더라 세션에 붙이지 않는다.
2. **절 단위로 읽는다 — 파일을 통째로 읽지 않는다**(`grep -n '^## '`로 절 제목을 보고 필요한 절만 `sed -n`). 순서와 범위:
   - `CHANGELOG.md` — 전체(최근 절만 남아 ≈14KB). 옛 수리 기록(2026-09-29~10-02, 사고 1~59)과 v1은 `docs/changelog/` — 사고 번호·날짜를 찾을 때만 grep.
   - `docs/measurements/L2-TRIAL-5.md` — 「왜 5판인가」「단위」「무엇을 재나」「라운드의 모양」「판정·게이트」「예측」 절(이번 회의 등록 — 시험 중엔 「라운드 표·판정」만 자란다). 「윈도우 — CEO가 할 일」은 윈도우 일을 할 때만. 4판 초안은 `archive/L2-TRIAL-4.md`.
   - `docs/V2-REPAIR-BACKLOG.md` — 끝의 「표 이후 후보」 절만(앞은 L2~L4 요구와 헌법). L0·L1 완료 기록은 `docs/changelog/backlog-L0-L1-2026-09-29.md`.
   - `docs/measurements/FIELD-BENCH.md` — 규칙 전체(≈15KB). 결과는 `FIELD-BENCH-LOG.md` — 표의 마지막 행과 마지막 기록 절만.
   - `team/HAZARDS.md` — 머리말만. 줄은 수리할 경로로 grep.
   - 끝난 시험(L1 1~4차 · L2 1~3판 · 필드 시험 1·2)은 `docs/measurements/archive/`. 결론은 L2-TRIAL-5 「왜 5판인가」(4판 초안은 `archive/L2-TRIAL-4.md`)와 FIELD-BENCH 「홀드아웃」에 있다 — 날짜·수치를 인용할 때만 그 절을 grep.
3. `node --test "tests/*.test.mjs"` 전부 초록을 확인한 뒤 작업을 시작하고, 현재 상태를 CEO에게 한 줄로 보고한다.
4. CEO가 「필드 벤치」를 말하면 `docs/measurements/FIELD-BENCH.md` 그대로(기본 측정 모드, 도구 `tests/field/`) — 결과는 `FIELD-BENCH-LOG.md`에 한 행씩 적고 푸시한다(컨테이너의 필드 폴더는 사라진다).

## 상시 규칙
- 역할: 정본 수리 · 시험 기록 · 백로그 처리. 침대(conductor 세션)에서 릴레이된 FAIL은 **그 줄 그대로** 받는다 — 임의 우회 · 침대에서만의 수리 금지. 같은 FAIL의 되풀이는 침대의 STATUS 「막힌 것」과 원장 `fail`·`guard` 줄에 남는다(2026-10-03).
- 수리는 항상 **정본 먼저**: 재현 테스트(red→green) + `team/HAZARDS.md` 한 줄(팩에 닿는 경로가 있을 때만 — 머리말과 unit 테스트가 센다) + `CHANGELOG.md` — 그 다음에 침대 반영.
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — `docs/BIRTH.md`. 수리와 장치를 구분한다.
- **문서는 자리를 가른다**: 읽는 자리에는 살아 있는 것(규칙·대기 작업·다음 일)만 둔다. 끝난 것(수리 기록·끝난 시험·결과 원장)은 `docs/changelog/`·`docs/measurements/archive/`·`FIELD-BENCH-LOG.md`로 — 시험이 끝나면 등록문도 archive로 옮기고 결론 한 줄만 남긴다. 기록은 지우지 않고 옮긴다(CEO 2026-10-03 「완료된 문장은 컨텍스트에 올리지 않는다」).
- 침대 반영은 CEO가 PowerShell에 붙여넣는 블록으로 전달한다: `git fetch https://github.com/jaewhi-park/GARAGISTE <branch>` → `cmd /c "git show FETCH_HEAD:team/scripts/<f>.mjs > .garagiste\scripts\<f>.mjs"` → 커밋. 블록엔 **검증 줄 필수** — `git log -1 FETCH_HEAD --format=%h`(기대 해시를 블록에 명기) · `findstr /m "<마커 문자열>" <대상 파일>`. 수리가 main에 머지된 뒤에는 main에서 fetch가 기본.
- CEO 환경: Windows PowerShell(`X=1 cmd` 같은 env 접두·heredoc 불가). 출력·저장되는 상대 경로는 전부 `/`, 플랫폼 표기는 계산용 절대 경로에만.

## 상태 스냅샷 (2026-10-03 — 이후의 정본은 CHANGELOG·백로그·measurements)
- **프레임워크**: 사고 1~59 수리 + 2026-10-03 CEO 「하나씩 수정」 7건(CHANGELOG 같은 날의 절 일곱 — 질문은 기본값으로(`work.mjs default` · `ask --assumed` · 맨 「예」는 RESPEC 없음) · `next.mjs`(Flow 4~7의 다음 한 걸음) · system-attack(`work.mjs system` — 범위 끝의 이음새 공격 한 바퀴) · boot 팩 「생태계별 검증된 꼴」 · 미검수 상한은 사람 센서가 필요한 unit만 · `state.mjs report`(SCOPE DONE의 docs/REPORT.md) · FAIL·가드 거부 원장 줄 + STATUS 「막힌 것」) + 원장 `try` 줄(2026-10-03 — CEO-분 카드 시간, `L2-TRIAL-5.md` 「CEO-분」). 스크립트 14 · 팩 6 · 테스트 123(`node --test "tests/*.test.mjs"` — 필드 도구 포함) · 설치 산문 34.3KB/40KB(HAZARDS 34줄 — 팩에 닿지 않는 줄은 unit 테스트가 막는다). **동결 없음** — 정본 team/은 main(브랜치 `ccr-710eea99-ed3c3w`의 머지 뒤). 침대 반영 블록 문서(BED-BLOCK)는 지웠다 — 열린 침대가 없다(아래 L2).
- **L2**: 1판(`archive/L2-TRIAL.md`) → 2판 통과(리눅스·윈도우, `archive/L2-TRIAL-2.md`) → 3판 닫힘(리눅스 Q5 통과 · Q6·Q7 재판정 통과(약함), `archive/L2-TRIAL-3.md`) → 4판은 등록 초안에서 닫힘(라운드 0, `archive/L2-TRIAL-4.md`) → **5판 등록(2026-10-03, `L2-TRIAL-5.md` — CEO 「L2는 처음부터 다시 잰다」: 7건 뒤의 정본 · 라운드 단위 · Q6 두 길 · Q7 압력 · 시계 검사 · 7건마다 예측 · 동결 = 등록의 머지 커밋, 머지가 CEO 서명)**. 3판 Q5 라운드는 옮겨 세지 않는다(정본이 다르다). 2판 윈도우 침대(todo-win)는 잇지 않는다 — 새 침대는 동결 sha로 새로 설치(`install.sh`가 doctor·selftest까지 돈다).
- **다음 세션의 첫 일**: 5판 머지 뒤 동결 sha(머지 커밋 전체 값)를 `L2-TRIAL-5.md` 「라운드 표·판정」 첫 줄에 적고 리눅스 1라운드(FIELD-BENCH 「L2 모드」 고정 말, `<sha>` = 동결 · 저녁 창마다 `tests/field/clock.mjs`) — 윈도우 세 라운드는 CEO가 「윈도우 — CEO가 할 일」대로. 등록·지시서(7건 반영 — 「5판의 차이」)·도구(clock.mjs · stream --target · day.mjs 5판 칸)는 2026-10-03에 들어갔다. 7건 뒤 필드 벤치(L1 모드 세 필드)는 아직 돌지 않았다 — L2 5판 뒤.
- **홀드아웃**: `holdout-futsal.md`(3판 리눅스 원문)는 측정 (e)가 수리(질문은 기본값으로)의 근거가 됐으니 FIELD-BENCH 규칙대로 **소진 → 회귀** — 윈도우에서 돌려도 범용성 점수가 아니다. library(필드 4)·dupfind(필드 3)·l2-todo-cli·ledger-cli·web-memo 전부 회귀용. 다음 범용성 측정엔 새 홀드아웃 원문이 필요하다 — **후보 셋이 `tests/field/briefs/candidates/`에 있다(2026-10-03 — notes: Rust CLI · snap: Python 데몬 · parcel-desk: Node brownfield/L3 Q13, 그 폴더 README에 무엇이 새로운지·seed 요건). CEO가 하나를 `holdout-<이름>.md`로 옮기는 머지가 서명.** 서명 전까지 측정·수리에 쓰지 않는다.
- **CEO 대기 결정(백로그 「표 이후 후보」의 남은 것)**: Flow 7의 두 길(시작 전 unit의 수정 → `add --replace` · 범위 밖 줄의 방향전환 → drop `--forget`) · 스트림의 말이 드는 자리 · 64KB 벽 자동 나누기(보류) · tried ok 메모가 뒤 unit의 수용으로(둘째 근거 대기) · try 위임 · session-start 주입 · L3(Q13 — 기존 코드가 있는 저장소) · 윈도우 Q9 인코딩 재현(원문 줄 대기) · attack effort 실험(보류) · 윈도우 add의 공격 테스트 35개 목록(리눅스 결과물에 돌려 측정만). (CEO-분의 기계 셈은 2026-10-03 채용 — `L2-TRIAL-5.md` 「CEO-분」.)
- **필드 벤치**: 필드 1(파이썬)·2(웹)·3(Go)·4(파이썬 웹, L2 모드) 전부 회귀용 — 마지막 측정 070f185(웹·Go FAIL 0 · SCOPE DONE) · 0ab3a05(파이썬 SCOPE DONE · FAIL 0 · $3.30). 비용 예상은 높게: 한 회(세 필드) ≈ $30 · 한 필드 ≈ $10 · L2 한 회(todo) ≈ $15.
- **반영 블록의 교훈**(2026-10-01): fetch가 실패하면 `cmd /c "git show FETCH_HEAD:… > 파일"`이 규칙집을 빈 파일로 덮는다 — 블록은 반드시 `git log -1 FETCH_HEAD --format=%h`가 기대 해시인지 확인하고 아니면 throw한 뒤에 복사한다. 정본 커밋은 SHA로 fetch한다(`git fetch <url> <전체 SHA>` — main이 움직여도 블록이 낡지 않는다, 2026-10-02). 템플릿 변경(CLAUDE.md)은 그 줄만 바꾸는 스크립트로(boot가 채운 나머지 보존), 파일 쓰기는 UTF-8 BOM 없이·원래 줄끝 유지. 블록 전체는 `& { … }` 하나로(안에 빈 줄 없이 — 2026-10-02): 붙여넣기가 줄마다 실행되면 맨 위 throw는 그 줄만 멈춰, 감싸지 않은 블록이 사전 점검의 멈춤 뒤에도 돌아 CEO의 커밋 안 된 줄까지 커밋했다(정비 채널 재현). 사전 점검은 쓰기 전에 전부, 쓰기·selftest는 try로 묶어 멈추면 되돌린다. 블록은 정비 채널에서 PowerShell 7(리눅스, 압축 tarball)과 cmd 대역으로 모의 침대에 돌려 보고 전달한다.
