# GARAGISTE
증거 팀 — AI-native 개발팀 프레임워크. `team/`이 프로젝트의 `.claude/`로 설치된다 (docs/PRINCIPLES.md · docs/BIRTH.md)

## Language
- ko

## Commands
- quick: `node --test tests/unit.test.mjs`
- full: `node --test "tests/*.test.mjs"`
- test one file: `node --test tests/<name>.test.mjs`
- install into a project: `./install.sh -Project <repo> [-Budget low|medium|high]`

## Conventions
- 스크립트는 `team/scripts/*.mjs`, 의존성 0, `export function` + `isMain` 가드로 순수 함수를 테스트한다; 훅은 `team/hooks/`, stdin JSON → deny JSON 또는 침묵
- 출력은 한 줄(`PASS x` / `FAIL x <이유>`), 나머지는 로그 파일; 판단은 스크립트에 넣지 않는다
- 산문은 `team/packs/*.md`·`team/HAZARDS.md`·`team/CLAUDE.md.template` 합계 40 KB 이하; 새 규칙은 코드(테스트·훅 케이스)로만
- 커밋: `type(scope): 요약` — type = feat | fix | test | docs | scaffold | delete, scope = scripts | hooks | packs | install | docs | tests
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — docs/BIRTH.md
