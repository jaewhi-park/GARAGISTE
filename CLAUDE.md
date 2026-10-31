# GARAGISTE
kit(v3) — 팀을 만들지 않고 하네스 하나(Claude Code · opencode)에 하네스가 모르는 것만 더한다: 사실(AGENTS.md 지도) · 요청 습관 · 한 줄 보고 · 일하는 방식(전역 한 번). 설명은 kit/README.md, 결정과 이유는 docs/DECISIONS.md. v2(증거 팀)는 브랜치 `v2`, v1은 브랜치 `v1` — v3는 어느 쪽 파일도 물려받지 않는다

## Language
- ko. 영어 기술 용어(harness · worktree · hook · skill …)는 그대로 쓴다

## Commands
- test: `node --test tests/kit.test.mjs` (= full)
- install, 한 기계에 한 번: `node kit/install.mjs global`
- install, 저장소마다: `node kit/install.mjs <claude|opencode> --project <repo> [--with-scripts]` — 기본은 지침만, 그 저장소의 첫 세션에서 `/kit-init`

## Conventions
- 스크립트는 `kit/scripts/*.mjs`(하네스 중립), 의존성 0, `export function` + main 가드로 순수 함수를 테스트한다. 출력은 한 줄(`PASS x` / `FAIL x <이유>`), 나머지는 로그 파일. 판단은 스크립트에 넣지 않는다
- 하네스가 행동을, 프로젝트가 사실을, 사람이 방식을. 템플릿에 행동 지침을 더할 때는 세 필터를 지난 줄만: 에이전트가 지금 관찰할 수 있는가 · 하네스가 이미 말하는가 · 맞춰야 하는 숫자인가. 상한은 에이전트가 받는 쪽에만, 탈출구와 함께
- 장치는 사고에서만. 스크립트 판(`--with-scripts`)을 켜는 조건은 kit/README.md 「스크립트는 사고가 나면 켠다」
- 하네스의 사실(경로 · frontmatter · 전역 파일)은 기억이 아니라 문서로 확인한다 — opencode는 github.com/anomalyco/opencode의 docs, Claude Code는 code.claude.com/docs
- 커밋: `type(scope): 요약` — type = feat | fix | test | docs | delete, scope = kit | docs | tests
- 큰 결정은 docs/DECISIONS.md에 한 항목(맥락 · 선택지 · 결정 · 이유), CHANGELOG.md는 v3 절만
