# 홀드아웃 후보 — 서명 대기 (2026-10-03 · snap은 같은 날 서명되어 옮겨졌다 — 남은 후보 둘)

범용성은 수리에 쓰지 않은 원문으로만 잰다(FIELD-BENCH 「홀드아웃」). 지금까지의 원문 여섯(ledger-cli · web-memo · dupfind · library · futsal · l2-todo-cli)은 Node·Python·Go의 CLI와 웹, 전부 빈 폴더에서 시작했고 전부 소진됐다. 여기 셋은 그 밖의 자리에서 골랐다. **서명 = CEO가 하나를 골라 `../holdout-<이름>.md`로 옮기는 머지** — 그 뒤 원문은 고치지 않고, 첫 측정 줄만이 범용성 점수다. 이 폴더의 원문은 서명 전까지 어떤 측정·수리에도 쓰지 않는다.

| 후보 | 생태계 · 모양 | 지금까지 없던 것 | 어느 레벨의 점수인가 |
|---|---|---|---|
| `notes.md` 메모 색인 CLI | **Rust**(표준 라이브러리만) · 파일 트리를 읽고 둘만 쓰는 CLI | 컴파일 언어·빌드 산출물(`target/`)·cargo의 테스트 레이아웃(`tests/*.rs`는 크레이트 루트 — `tests/acceptance/`·`tests/adversary/` 폴더가 그대로 들어가지 않는다) · 색인 캐시의 일관성 · rename의 원자성(윈도우 파일 의미) · 오늘 날짜·요일(시계 검사 C1~C3이 닿는다) | L2 범용성(컨테이너 — cargo 1.97 있음; CEO PC는 Rust 없음 → 윈도우 측정은 원문 요구로만) |
| ~~`snap.md`~~ → **서명 2026-10-03 → `../holdout-snap.md`(L2 6판 — `docs/measurements/L2-TRIAL-6.md`)** 폴더 스냅샷 백업 | **Python** · **백그라운드 데몬**(터미널을 닫아도 돈다) | 프로세스 수명(start/stop/pid · 윈도우 분리 실행) · 폴링 감시 · 시간 보관 규칙(7일·30일·1년 — 시계 검사 C3·C4가 닿는다) · 잠긴 파일·사라진 백업 폴더 · 원자적 쓰기(임시 이름 → 바꾸기) · 로그 돌리기. build가 남긴 백그라운드 명령(L2 2판 관찰)이 제품 자체인 모양 | L2 범용성 |
| `parcel-desk.md` 택배 보관 대장 | **Node** · **기존 코드가 있는 저장소에 기능 넷**(brownfield) | boot 없는 시작(기존 명령·테스트를 그대로 쓴다) · characterization(「지금 동작은 그대로」가 인수) · 데이터 파일 형식 바꾸기와 원본 보존 · 기존 테스트가 전부 통과 | **L3 Q13**(「기존 코드베이스 1개에서 boot 없이 첫 unit 출하」) — 지금 정본은 빈 폴더만 안다. 첫 측정은 멈춘 자리가 점수다 |

## parcel-desk의 seed 요건 — 만들었다(2026-10-04: `tests/field/seeds/parcel-desk` + `tests/field/setup-seed.sh`; 원문이 아니라 테스트 베드의 일부 — 서명 전엔 측정·수리에 쓰지 않는다)
- `tests/field/seeds/parcel-desk/`: Node CommonJS 약 300줄 — `bin/parcel.js` · `lib/store.js` · `lib/commands.js` · `test/*.test.js`(node:test · skip 1개 · 오늘 날짜를 박은 테스트 1개) · `package.json`(`scripts.test`가 `node --test test/` — node 22에서 디렉터리는 실패하는, 실제 세상의 흠) · `README.md`(명령 넷) · `parcels.json` 샘플 30건(한글 택배사 · 글자가 든 호수 포함) · `.gitignore` 없음 · 한 파일은 CRLF.
- 테스트 베드 설치: `tests/field/setup.sh`는 빈 폴더만 받는다 — `tests/field/setup-seed.sh <brief> <폴더> [budget]`이 seed를 복사해 `git init`·사람 이름의 커밋 다섯·CEO의 BRIEF-draft 커밋을 만든 뒤 `install.sh`를 건다(기존 저장소가 깨끗하면 설치가 팀 파일을 커밋한다 — 사고 70). 검사: `tests/field.test.mjs`의 setup-seed 테스트.
- 첫 말은 FIELD-BENCH 「L2 모드」 고정 말 그대로 — 「빈 폴더」를 말하지 않는다. 지금 정본의 첫 unit boot(kind scaffold)가 기존 코드 위에서 무엇을 하는지가 첫 관측이다.

## 미루는 모양 — 후보가 아니다
- 브라우저만 쓰는 앱(서버 없음 · 저장은 브라우저 안 · UI 중심): L4 게이트(「자동화 불가 수용이 있는 도메인」)의 원문이다. 지금은 「실제 브라우저에서 확인」 주장을 redproof가 받지 못해(백로그 2순위 「이미 충족된 주장 박기」) 멈춘 자리가 뻔하다 — 그 장치 뒤에.
- Java·PHP·Ruby: 컨테이너에 있지만, 새 생태계 하나는 Rust로 충분하다(둘을 동시에 열면 사고의 뿌리가 섞인다). 다음 소진 뒤의 후보.
