# GARAGISTE
증거 팀 — AI-native 개발팀 프레임워크. `team/`이 프로젝트의 `.garagiste/`(정본) + `.claude/` 또는 `opencode.json`·`.opencode/`(배선)로 설치된다 (docs/PRINCIPLES.md · docs/BIRTH.md)

## Language
- ko

## Commands
- quick: `node --test tests/unit.test.mjs`
- full: `node --test "tests/*.test.mjs"`
- test one file: `node --test tests/<name>.test.mjs`
- install into a project: `./install.sh <claude|opencode> -Project <repo> [-Budget low|medium|high]`

## Conventions
- 스크립트는 `team/scripts/*.mjs`(하네스 중립), 의존성 0, `export function` + `isMain` 가드로 순수 함수를 테스트한다; 하네스 배선은 `team/claude/`(settings·hooks·agents)와 `team/opencode/`(opencode.json·agents·plugins) — 규칙은 배선에 두지 않고 `guard-rules.mjs` 하나에 둔다
- 출력은 한 줄(`PASS x` / `FAIL x <이유>`), 나머지는 로그 파일; 판단은 스크립트에 넣지 않는다
- 산문은 `team/packs/*.md`·`team/HAZARDS.md`·두 규칙 파일 템플릿 합계 40 KB 이하; 새 규칙은 코드(테스트·훅 케이스)로만
- 커밋: `type(scope): 요약` — type = feat | fix | test | docs | scaffold | delete, scope = scripts | claude | opencode | packs | install | docs | tests
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — docs/BIRTH.md
- 정비 세션(수리·시험 기록·리뷰)은 `docs/HANDOFF.md`의 시작 절차대로 — 문서는 절 단위로 읽고 파일을 통째로 읽지 않는다; 끝난 기록(`docs/changelog/`·`docs/measurements/archive/`)은 찾을 때만 grep
