# Changelog

v3(kit)의 기록. 최근 것부터, 채용은 CEO의 말로. v2 「증거 팀」(2026-09-29 ~ 10-05, R&D 27라운드 · 사고 1~88)과 v1의 기록은 브랜치 `v2`의 CHANGELOG.md와 docs/changelog/에 그대로 있다 — 날짜나 사고 번호를 찾을 때만 그 브랜치를 본다.

## v3 — 2026-10-31 · 키트 (unreleased, `kit/`)

v2의 팀을 잇지 않는 새 판. 팀을 만들지 않고, 하네스 하나가 저장소에서 덜 헤매고 덜 거짓말하게 하는 사실과 도구만 둔다 — `AGENTS.md` 템플릿 · `kit/check.mjs` · `kit/tests-for.mjs` · `kit/flaky.txt` · opencode 에이전트 둘. `team/`(v2)은 그대로 두고 두 판을 같은 프로젝트에 섞어 설치하지 않는다. 근거는 docs/DECISIONS.md 2026-10-31, 설명은 kit/README.md.

### Removed — 2026-10-31 v2 트리 삭제(CEO 「v3랑 관계없는 파일들은 이제 deprecate니까 지우자」)
- `team/` · `install.sh` · `install.ps1` · v2 테스트(unit · e2e · field · fakes · field/) · v2 문서(HANDOFF · BIRTH · PRINCIPLES · GUIDE · V2-REPAIR-BACKLOG · catalogue · changelog · measurements)를 지웠다. v1 선례대로 백업 브랜치 `v2`가 삭제 직전 main(b08485c)을 가리킨다. 남긴 것: `kit/` · `tests/kit.test.mjs` · 이 파일의 v3 절 · `docs/DECISIONS.md` 전체(결정의 이력은 v3의 근거) · README 둘 · CLAUDE.md · LICENSE. 루트 문서는 v3만 말하게 다시 썼다.

### Added — 2026-10-31 v3 키트(CEO 「GARAGISTE에 이걸로 새 판 만들어보자」 — 정비 세션의 설계 대화에서)
- `kit/AGENTS.md.template`: 지도(코드에 없는 사실만) · 검사 · 요청 양식(무엇을 · 아는 위치 · 끝의 기준) · 작업 방식 여섯 줄 · 지도 유지 두 줄. 모든 줄은 세 필터(에이전트가 지금 관찰 가능 · 하네스가 말하지 않음 · 맞춰야 하는 숫자 없음)를 지난 것만 — 지도 크기 상한 · 재시도 횟수 · 「다음 달에도 참인가」는 떨어졌다.
- `kit/scripts/tests-for.mjs`: 변경 파일 → 테스트 파일(패턴 대입 · 디스크 확인 · 매핑 없음은 stderr · 인자 없으면 작업 트리 변경). `kit/scripts/check.mjs`: quick · module · full을 돌리고 `PASS <층>` 또는 `FAIL <층> <테스트> 기대= 실제= at file:line log=` 한 줄 — node:test(TAP · spec) · jest · vitest · pytest · go test의 실패 꼴을 읽고 모르는 꼴은 종료 코드로. module에 매핑이 없으면 full로 내려가며 그 사실을 줄에 적는다. `flaky.txt`(사람 관리)의 테스트는 셈에서 빼고 `격리 n`으로 표시. 빈 명령은 `FAIL <층> kit/check.json layers.<층> 비어 있음`.
- 배선: Claude Code는 `CLAUDE.md`=`@AGENTS.md` + settings allow 두 줄(훅 0 · 커스텀 에이전트 0 — built-in Explore · plan mode · /code-review를 쓴다). opencode는 `.opencode/agents/` build(primary · 위임 기준 다섯 줄 · task는 explore · review만) · review(읽기 전용 · diff와 요청과 끝의 기준만) — 탐색은 opencode built-in explore(읽기 전용). opencode 문서(docs 원본 dev 브랜치)로 확인: 폴더 `.opencode/agents/` · `tools` deprecated → `permission` · AGENTS.md가 있으면 CLAUDE.md는 읽지 않음.
- `kit/install.mjs`(node, 두 OS 공통): 소유 파일(스크립트 · 에이전트)은 덮고 첫 설치 파일(AGENTS.md · check.json · flaky.txt · CLAUDE.md · settings)은 두며 settings는 allow만 합친다. git에 손대지 않는다. `--dry`.
- 세 층의 원클릭(같은 날 후속, CEO 「매번 TDD로 일해라 · 쪼개라를 치는 게 더미하다」): `install.mjs global`이 홈에 일하는 방식 블록(`kit/global/CLAUDE.md` — `~/.claude/CLAUDE.md`를 두 하네스가 읽는다, 마커로 한 번만 덧붙임)과 첫 분석 스킬 `kit-init`(`~/.claude/skills/` — check.json → docs/ARCHITECTURE.md → 지도, 사용자가 부를 때만)과 opencode 명령 `/kit-init`을 놓는다. 템플릿 작업 방식에 「큰 요청은 끝의 기준이 하나인 조각으로」한 줄, 지도 유지에 「한 줄로 적히지 않는 사실은 docs에, 지도에는 가리키는 한 줄만」(지도의 나가는 문 셋째 — CEO 「CLAUDE.md는 커질 염려 없나」). opencode 문서로 확인: 스킬 경로는 `~/.claude/skills/*/SKILL.md`를 opencode도 읽고, `~/.config/opencode/AGENTS.md`가 있으면 `~/.claude/CLAUDE.md`는 읽지 않는다.
- 기본은 지침만(같은 날 후속, CEO 「키트를 지침만으로 — 모델 성장세를 보면 훅은 뜻을 잃는다」): 템플릿의 검사 절이 두 판(마커 블록)이 되고 `install.mjs`가 고른 판만 남긴다 — 기본은 명령 슬롯 셋 · 한 줄 보고 · 원본은 kit/log/ · 사람이 적는 불안정 목록, `--with-scripts`면 check · tests-for · check.json · flaky.txt와 settings allow. 기본 설치는 Claude Code에 파일 셋(AGENTS.md · CLAUDE.md · .gitignore). 작업 방식의 검사 줄은 스크립트 이름 대신 「가장 좁은 검사(검사 절의 module)」. 스크립트를 켜는 조건은 kit/README 「스크립트는 사고가 나면 켠다」.
- `tests/kit.test.mjs` 21건: 순수 함수(매핑 · 다섯 러너의 실패 파싱 · 격리 · 결과 줄 · 설치 계획 · allow 병합) + 임시 저장소에서 설치 → check PASS / 빈 명령 FAIL / 실패 줄 / full 내려가기 / 격리 / 재설치 보존, opencode 설치 · --dry.
