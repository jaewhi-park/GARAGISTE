# 세션 인수인계 — 프레임워크 정비 채널

정비 세션(GARAGISTE를 붙인 클라우드 Claude 세션)의 컨텍스트가 차면, 새 세션은 이 문서 하나로 재개한다. 작업 상태는 전부 저장소에 있다 — 이 문서는 「어디를 읽고 어떤 규칙으로 움직이는지」만 든다.

## 시작 절차
1. 레포는 **GARAGISTE 하나만** 붙인다. 시험대(침대)는 CEO PC의 로컬 폴더라 세션에 붙이지 않는다.
2. 읽는 순서: 이 문서 → `docs/V2-REPAIR-BACKLOG.md`(대기 작업) → `docs/measurements/L1-TRIAL.md`(시험 이력·판정) → `CHANGELOG.md` 최근 절 → `team/HAZARDS.md` 끝부분(사고 목록).
3. `node --test "tests/*.test.mjs"` 전부 초록을 확인한 뒤 작업을 시작하고, 현재 상태를 CEO에게 한 줄로 보고한다.
4. CEO가 「필드 벤치」를 말하면 `docs/measurements/FIELD-BENCH.md` 그대로(기본 측정 모드, 도구 `tests/field/`) — 결과는 그 문서의 결과 원장에 한 행씩 적고 푸시한다(컨테이너의 필드 폴더는 사라진다).

## 상시 규칙
- 역할: 정본 수리 · 시험 기록 · 백로그 처리. 침대(conductor 세션)에서 릴레이된 FAIL은 **그 줄 그대로** 받는다 — 임의 우회 · 침대에서만의 수리 금지.
- 수리는 항상 **정본 먼저**: 재현 테스트(red→green) + `team/HAZARDS.md` 한 줄 + `CHANGELOG.md` — 그 다음에 침대 반영.
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — `docs/BIRTH.md`. 수리와 장치를 구분한다.
- 침대 반영은 CEO가 PowerShell에 붙여넣는 블록으로 전달한다: `git fetch https://github.com/jaewhi-park/GARAGISTE <branch>` → `cmd /c "git show FETCH_HEAD:team/scripts/<f>.mjs > .garagiste\scripts\<f>.mjs"` → 커밋. 블록엔 **검증 줄 필수** — `git log -1 FETCH_HEAD --format=%h`(기대 해시를 블록에 명기) · `findstr /m "<마커 문자열>" <대상 파일>`. 수리가 main에 머지된 뒤에는 main에서 fetch가 기본.
- CEO 환경: Windows PowerShell(`X=1 cmd` 같은 env 접두·heredoc 불가). 출력·저장되는 상대 경로는 전부 `/`, 플랫폼 표기는 계산용 절대 경로에만.

## 상태 스냅샷 (2026-10-01, 필드 시험 1·2 종료 시점 — 이후의 정본은 백로그·CHANGELOG)
- **L1 통과**(3차·4차 재현) · **L2 1일차 통과 — 게이트 1/3**, 누적 green 후 CEO 발견 결함 0 (`docs/measurements/L2-TRIAL.md`). 사고 원장 1~37 전부 수리 + 테스트 봉인(26은 L2 1일차 — 병렬 unit의 코드 충돌, 27~37은 필드 시험). 테스트 67개 초록.
- **필드 시험 1·2**(파이썬 CLI · Node 웹 앱, 클라우드 컨테이너의 중첩 헤드리스 conductor — `docs/measurements/FIELD-TRIAL.md`): 둘 다 M1 SCOPE DONE, CEO try 10장 전부 ok(green 후 결함 0), 그 길에서 프레임워크 사고 11건(27~37) — G2(TS·Windows)가 가리던 범용성 결함(파이썬 산출물·의존성 설치·이미 충족된 주장·진행 중 unit의 낡은 법). 표 이후 후보 둘이 둘의 규칙을 채웠다: try 사본 · 이미 충족된 주장 박기.
- (2026-10-01 갱신) 다음 걸음: **L2 재등록(2판) — `docs/measurements/L2-TRIAL-2.md`, 게이트 0/3부터**. 첫 아침 전 준비 다섯(Windows 점검 · 정션 점검 · 시험대 반영 · 미검수 0 · 규칙집 기준선)이 먼저다. 그 뒤 사고 38~56·try 사본은 CHANGELOG, 필드 벤치는 `docs/measurements/FIELD-BENCH.md`. 옛 기록: L2 2일차 — 시험대 G2_TEST5, 저녁 지시서는 `docs/measurements/L2-day-conductor.md`(등록문 정의로 고친 판). 구조적 발견: 무인 처리량은 미검수 3에 묶인다(376분 중 29분 작업) — 상한 조정은 3일 표 뒤 CEO 정책 결정. CEO 「가」 대기 장치: pack reason-lane · system-attack · session-start 주입, 백로그 관찰(병렬 seed·예산 중 seed·가드 원장 읽기 오탐 등).
