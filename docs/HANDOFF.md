# 세션 인수인계 — 프레임워크 정비 채널

정비 세션(GARAGISTE를 붙인 클라우드 Claude 세션)의 컨텍스트가 차면, 새 세션은 이 문서 하나로 재개한다. 작업 상태는 전부 저장소에 있다 — 이 문서는 「어디를 읽고 어떤 규칙으로 움직이는지」만 든다.

## 시작 절차
1. 레포는 **GARAGISTE 하나만** 붙인다. 시험대(침대)는 CEO PC의 로컬 폴더라 세션에 붙이지 않는다.
2. 읽는 순서: 이 문서 → `docs/V2-REPAIR-BACKLOG.md`(대기 작업) → `docs/measurements/L1-TRIAL.md`(시험 이력·판정) → `CHANGELOG.md` 최근 절 → `team/HAZARDS.md` 끝부분(사고 목록).
3. `node --test "tests/*.test.mjs"` 전부 초록을 확인한 뒤 작업을 시작하고, 현재 상태를 CEO에게 한 줄로 보고한다.

## 상시 규칙
- 역할: 정본 수리 · 시험 기록 · 백로그 처리. 침대(conductor 세션)에서 릴레이된 FAIL은 **그 줄 그대로** 받는다 — 임의 우회 · 침대에서만의 수리 금지.
- 수리는 항상 **정본 먼저**: 재현 테스트(red→green) + `team/HAZARDS.md` 한 줄 + `CHANGELOG.md` — 그 다음에 침대 반영.
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — `docs/BIRTH.md`. 수리와 장치를 구분한다.
- 침대 반영은 CEO가 PowerShell에 붙여넣는 블록으로 전달한다: `git fetch https://github.com/jaewhi-park/GARAGISTE <branch>` → `cmd /c "git show FETCH_HEAD:team/scripts/<f>.mjs > .garagiste\scripts\<f>.mjs"` → 커밋. 블록엔 **검증 줄 필수** — `git log -1 FETCH_HEAD --format=%h`(기대 해시를 블록에 명기) · `findstr /m "<마커 문자열>" <대상 파일>`. 수리가 main에 머지된 뒤에는 main에서 fetch가 기본.
- CEO 환경: Windows PowerShell(`X=1 cmd` 같은 env 접두·heredoc 불가). 출력·저장되는 상대 경로는 전부 `/`, 플랫폼 표기는 계산용 절대 경로에만.

## 상태 스냅샷 (2026-10-01, L1 4차 종료 시점 — 이후의 정본은 백로그·CHANGELOG)
- **L1 게이트 원시값 통과 — 3차·4차(재현)** (`docs/measurements/L1-TRIAL.md`). 사고 원장 1~25 전부 수리 + 테스트 봉인(24·25는 4차 중 — 사고 17 수리가 연 RESPEC 경로의 잠복 결함). 테스트 53개 초록.
- 다음 걸음: **L2(무인 하루)** — 사전 등록 `docs/measurements/L2-TRIAL.md`(머지가 CEO 서명), 시험대 G2_TEST5, 동결 3b8aede. CEO 「가」 대기 장치: pack reason-lane(사고 25가 첫 근거) · system-attack · session-start CEO 대기 항목 주입(L2 재개에서 사고가 나면).
