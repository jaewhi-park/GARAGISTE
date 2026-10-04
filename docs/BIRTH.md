# 탄생 프로토콜 — 0 base에서 증거 팀이 태어나는 방법

역할극과 진짜 팀의 차이는 이름이나 구조가 아니다. **장치가 종이에서 태어나느냐, 원장에서 태어나느냐**다.

## Day 0 — 팀은 세 파일이다
1. 경계 — Claude Code는 `.claude/settings.json`(deny 목록 + 훅 셋), opencode는 `opencode.json` + `.opencode/plugins/guard.ts`. 둘 다 규칙은 `.garagiste/scripts/guard-rules.mjs` 하나. 역할극이 아니라 안전벨트.
2. `.garagiste/scripts/verify.mjs` — 검증을 돌리고 원장에 `{tree, exit}`를 남기고, 커밋 게이트로 원장과 tree를 대조한다.
3. 규칙 파일 20줄(`CLAUDE.md` 또는 `AGENTS.md`) — 명령과 Flow.

페르소나 없음. conductor는 Claude Code에선 메인 세션, opencode에선 edit 권한 없는 primary agent다. 팩 일곱(boot·adopt·intake·spec·build·attack·spike)은 10줄 spawn 설정 + 쓰기 경계로만 존재한다 — adopt(2026-10-04)는 기존 코드의 첫 unit, boot과 같은 생애에 다른 경계(소스·기존 테스트·매니페스트를 쓰지 않는다).

## Unit 1 — 기계가 닫은 첫 루프
CEO 한 문장 → `work.mjs new` → spec 팩이 red 주장을 쓴다 → `redproof.mjs`가 RED를 확인 → build 팩이 green으로 → 커밋 게이트 → attack 팩이 실패하는 테스트를 남긴다 → build 재spawn → red 0 → `ship.mjs` 8조건 → LEDGER 한 줄 → try.md → CEO 「써봤다」.
`tests/e2e.test.mjs`가 이 루프를 모델 0·네트워크 0으로 재현한다. 그것이 이 프레임워크의 탄생 시험이다.

## 탄생 규칙 셋
- **사고 없이 장치 없다.** 원장에 기록된 실패나 `metrics`로 측정된 비용에서만 장치가 태어난다. `docs/catalogue/DEVICES.md`에 있어도 사고가 없으면 만들지 않는다.
- **둘의 규칙.** 스크립트는 프로젝트 안(`.garagiste/scripts/`)에서 태어나고, 두 번째 프로젝트가 같은 것을 필요로 할 때만 `team/`으로 올라온다. 예외는 Day 0의 안전벨트뿐.
- **이름은 쓰기 경계다.** 새 역할이 필요해서 팩을 만드는 일은 없다. 새 경계가 필요할 때만 팩이 생긴다.

## 탄생 시험 — v1 사고 재생
`team/HAZARDS.md`의 앞 줄들은 v1 세 프로젝트에서 실제로 난 사고고, 그 뒤는 v2의 실기·시험·벤치에서 난 사고다(번호와 수리는 CHANGELOG). 갓 태어난 팀에 그 사고를 재생해 뚫리는 것마다 장치 하나를 만든다 — 종이 설계 없이 센서를 얻는 가장 정직한 길이다.

## 첫 3 unit 뒤의 판정
| 지표 | v1 실측 | 판정선 |
|---|---|---|
| 승인→출하 활성 분 | 97~133 | ≤75 |
| 첫 코드까지 | ≈30분 | 기능 ≤15 · 버그 ≤5 |
| spawn/unit | 21~32 | ≤8 |
| 미검수 출하물 | 9~12 | ≤3 상시 |
| adversary red / 100 로직줄 | v1 majors 기준 | 그 1/1.5 아래로 떨어지지 않음 |
선을 넘지 못하면 그 자리에서 멈춘다. 이 표가 나오기 전까지 v2의 모든 수치는 주장이고, 실행되지 않은 주장은 믿지 않는다.

## 어디서
GARAGISTE 저장소가 아니라 프로젝트 안에서. 첫 프로젝트는 코드 0줄에 Windows 사고 이력이 있는 것이 좋다.
