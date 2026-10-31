# GARAGISTE
증거 팀 — AI-native 개발팀 프레임워크. `team/`(v2)이 프로젝트의 `.garagiste/`(정본) + `.claude/` 또는 `opencode.json`·`.opencode/`(배선)로 설치된다 (docs/PRINCIPLES.md · docs/BIRTH.md). `kit/`(v3)은 팀을 만들지 않는 새 판 — 하네스 하나에 사실(AGENTS.md)과 도구(check · tests-for)만 더한다 (kit/README.md · docs/DECISIONS.md 2026-10-31). 두 판은 한 프로젝트에 섞어 설치하지 않는다

## Language
- ko
- 문체: 영어 기술 용어(unit · ship · spawn · worktree · test bed · conductor …)는 그대로 쓴다 — 비유·순우리말로 옮기지 않는다(침대 · 꼴 · 이음새 같은 코인). 살아 있는 문서는 2026-10-03에 고쳤고, `team/` 산문(팩·HAZARDS·템플릿)의 남은 낱말(꼴 · 이음새 · 선발견 · 걸음 · 마디)과 금지어 unit 테스트는 L2 5판 뒤에(동결)

## Commands
- quick: `node --test tests/unit.test.mjs`
- full: `node --test "tests/*.test.mjs"`
- test one file: `node --test tests/<name>.test.mjs`
- kit(v3)만: `node --test tests/kit.test.mjs`
- install into a project: `./install.sh <claude|opencode> -Project <repo> [-Budget low|medium|high]` (v2) · `node kit/install.mjs global` + `node kit/install.mjs <claude|opencode> --project <repo> [--with-scripts]` (v3 — 기본은 지침만)

## Conventions
- 스크립트는 `team/scripts/*.mjs`(v2) · `kit/scripts/*.mjs`(v3)(하네스 중립), 의존성 0, `export function` + `isMain` 가드로 순수 함수를 테스트한다; 하네스 배선은 `team/claude/`(settings·hooks·agents)와 `team/opencode/`(opencode.json·agents·plugins) — 규칙은 배선에 두지 않고 `guard-rules.mjs` 하나에 둔다
- 출력은 한 줄(`PASS x` / `FAIL x <이유>`), 나머지는 로그 파일; 판단은 스크립트에 넣지 않는다
- 산문은 `team/packs/*.md`·`team/HAZARDS.md`·두 규칙 파일 템플릿 합계 40 KB 이하; 새 규칙은 코드(테스트·훅 케이스)로만
- 커밋: `type(scope): 요약` — type = feat | fix | test | docs | scaffold | delete, scope = scripts | claude | opencode | packs | install | docs | tests | kit
- 장치 추가는 사고(원장·HAZARDS 줄) 또는 측정에서만 — docs/BIRTH.md. kit의 지침 줄은 세 필터(에이전트가 지금 관찰할 수 있는가 · 하네스가 이미 말하는가 · 맞춰야 하는 숫자인가)를 지난 것만 — kit/README.md
- 정비 세션(수리·시험 기록·리뷰)은 `docs/HANDOFF.md`의 시작 절차대로 — 문서는 절 단위로 읽고 파일을 통째로 읽지 않는다; 끝난 기록(`docs/changelog/`·`docs/measurements/archive/`)은 찾을 때만 grep
