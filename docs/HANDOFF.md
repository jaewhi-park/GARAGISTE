# 세션 인수인계 — 프레임워크 정비 채널

정비 세션(GARAGISTE를 붙인 클라우드 Claude 세션)의 컨텍스트가 차면, 새 세션은 이 문서 하나로 재개한다. 작업 상태는 전부 저장소에 있다 — 이 문서는 「어디를 읽고 어떤 규칙으로 움직이는지」만 든다.

## 시작 절차
1. 레포는 **GARAGISTE 하나만** 붙인다. 시험대(침대)는 CEO PC의 로컬 폴더라 세션에 붙이지 않는다.
2. 읽는 순서: 이 문서 → `docs/measurements/L2-TRIAL-2.md`(진행 중인 시험 — 등록·표·판정) → `docs/V2-REPAIR-BACKLOG.md`(대기 작업 — 끝의 「표 이후 후보」) → `docs/measurements/FIELD-BENCH.md`(벤치 결과 원장·홀드아웃 규칙) → `CHANGELOG.md` 최근 절 → `team/HAZARDS.md`. 옛 시험: `L1-TRIAL.md` · `L2-TRIAL.md`(1판).
3. `node --test "tests/*.test.mjs"` 전부 초록을 확인한 뒤 작업을 시작하고, 현재 상태를 CEO에게 한 줄로 보고한다.
4. CEO가 「필드 벤치」를 말하면 `docs/measurements/FIELD-BENCH.md` 그대로(기본 측정 모드, 도구 `tests/field/`) — 결과는 그 문서의 결과 원장에 한 행씩 적고 푸시한다(컨테이너의 필드 폴더는 사라진다).

## 상시 규칙
- 역할: 정본 수리 · 시험 기록 · 백로그 처리. 침대(conductor 세션)에서 릴레이된 FAIL은 **그 줄 그대로** 받는다 — 임의 우회 · 침대에서만의 수리 금지.
- 수리는 항상 **정본 먼저**: 재현 테스트(red→green) + `team/HAZARDS.md` 한 줄 + `CHANGELOG.md` — 그 다음에 침대 반영.
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — `docs/BIRTH.md`. 수리와 장치를 구분한다.
- 침대 반영은 CEO가 PowerShell에 붙여넣는 블록으로 전달한다: `git fetch https://github.com/jaewhi-park/GARAGISTE <branch>` → `cmd /c "git show FETCH_HEAD:team/scripts/<f>.mjs > .garagiste\scripts\<f>.mjs"` → 커밋. 블록엔 **검증 줄 필수** — `git log -1 FETCH_HEAD --format=%h`(기대 해시를 블록에 명기) · `findstr /m "<마커 문자열>" <대상 파일>`. 수리가 main에 머지된 뒤에는 main에서 fetch가 기본.
- CEO 환경: Windows PowerShell(`X=1 cmd` 같은 env 접두·heredoc 불가). 출력·저장되는 상대 경로는 전부 `/`, 플랫폼 표기는 계산용 절대 경로에만.

## 상태 스냅샷 (2026-10-02 — 이후의 정본은 L2-TRIAL-2·백로그·CHANGELOG)
- **프레임워크**: 사고 1~56 수리 + try 사본 · 테스트 85(`node --test "tests/*.test.mjs"`) · 설치 산문 26KB/40KB(HAZARDS 29줄 — 팩에 닿지 않는 줄은 테스트가 막는다). **동결 9c677ec**(L2 2판 — 결함 수리만, 장치·흐름 변경은 표 뒤).
- **L2 2판 진행 중**(`L2-TRIAL-2.md`): 원문 `tests/field/briefs/l2-todo-cli.md`로 빈 폴더 두 곳, 게이트는 환경마다.
  - **리눅스(정비 채널 컨테이너, 대리 CEO) — 게이트 통과** 3/3 · 누적 green 후 결함 0 · FAIL 0 · M1 8 출하 · 911K 토큰. 컨테이너의 필드 폴더는 세션과 함께 사라졌다 — 기록은 문서에만.
  - **윈도우(CEO PC, 폴더 예: `C:\L2\todo-win`) — 1/3**. 2·3일차는 CEO가 돌리고 conductor의 저녁 표를 정비 채널에 붙여 준다 → 정비 채널이 L2-TRIAL-2.md에 같은 꼴(일차 절 · unit 표 · 판정)로 옮기고 PR·머지. 2일차엔 CEO가 「저녁」을 먼저 말해 try 사본 흐름을 윈도우에서 검증한다(1일차엔 사본이 안 열렸다).
  - **윈도우 1일차의 큰 발견**: 같은 몫에 토큰 16배(3,222K 대 198K) — attack↔build 진동(저장 방식 제자리 쓰기 ↔ 바꿔치기 · 잠금, add 28·add-due-tag 20바퀴). 동결이라 수리 안 함 — 백로그 표 이후 후보 1순위.
  - 이 원문은 윈도우 3일 표가 나올 때까지 정비에 쓰지 않는다(같은 원문의 처음 측정 유지). 끝나면 소진 → 다음 범용성 측정엔 새 홀드아웃(제안: 기존 코드가 있는 저장소 — brownfield).
- **CEO 대기 결정**: 윈도우 2·3일차 실행 · 윈도우 add의 공격 테스트 35개 목록(플랫폼 공통 결함이 섞였으면 리눅스 attack이 얕았다는 뜻 — 리눅스 결과물에 돌려 측정만) · 3일 표 뒤 장치 채용(백로그 1~).
- **필드 벤치**: 필드 1(파이썬)·2(웹)·3(Go, 소진된 홀드아웃) 모두 회귀용 — 마지막 측정 621a426 세 필드 FAIL 0. 홀드아웃은 비었다.
- **반영 블록의 교훈**(2026-10-01): fetch가 실패하면 `cmd /c "git show FETCH_HEAD:… > 파일"`이 규칙집을 빈 파일로 덮는다 — 블록은 반드시 `git log -1 FETCH_HEAD --format=%h`가 기대 해시인지 확인하고 아니면 throw한 뒤에 복사한다. 템플릿 변경(CLAUDE.md)은 그 줄만 바꾸는 스크립트로(boot가 채운 나머지 보존), 파일 쓰기는 UTF-8 BOM 없이·원래 줄끝 유지.
