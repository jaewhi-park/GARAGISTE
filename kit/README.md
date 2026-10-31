# kit — GARAGISTE v3

v2(`team/`)는 팀을 만들고 통제했다. kit은 팀을 만들지 않는다. 하네스 하나(Claude Code 또는 opencode)가 이 저장소에서 덜 헤매고 덜 거짓말하게 하는 **사실과 도구**만 둔다. 규칙이 있던 자리에 구조와 도구가 들어간다 — 「하네스가 행동을, 프로젝트가 사실을」(docs/DECISIONS.md 2026-10-31).

하네스가 이미 가진 범용 절반(읽기 전용 탐색 보조 · 좁게 읽는 도구 · 비용 설명 어조의 지침 · 컨텍스트 관리)은 다시 만들지 않는다. 프로젝트 쪽은 하네스가 모르는 절반만 더한다: 지도의 내용 · 변경 파일→테스트 · 검사 출력 깎기 · 불안정 테스트 격리 · 요청 양식.

## 무엇이 들어 있나
| 파일 | 역할 |
|---|---|
| `AGENTS.md.template` | 지도(코드에 없는 사실만) · 검사 명령 · 요청 양식(무엇을 · 아는 위치 · 끝의 기준) · 작업 방식 여섯 줄 · 지도 유지 두 줄. Claude Code는 `CLAUDE.md`가 `@AGENTS.md` 한 줄로 이것을 읽는다 |
| `scripts/tests-for.mjs` | 변경 파일 → 돌릴 테스트 파일. 패턴 대입, 디스크에 있는 것만. 매핑 없는 파일은 stderr에 |
| `scripts/check.mjs` | 층별 검사(quick · module · full)를 돌리고 한 줄만 낸다 — `PASS <층>` 또는 `FAIL <층> <테스트> 기대= 실제= at file:line log=`. 원본 출력은 `kit/log/`. node:test(TAP · spec) · jest · vitest · pytest · go test의 실패 꼴을 읽고, 모르는 꼴은 종료 코드로 말한다. module에 매핑이 없으면 full로 내려가며 그 사실을 줄에 적는다 |
| `scripts/check.json` | 이 저장소의 층별 명령과 테스트 패턴. 처음엔 비어 있고 에이전트나 사람이 채운다(`FAIL quick kit/check.json layers.quick 비어 있음`이 그 신호) |
| `scripts/flaky.txt` | 격리된 불안정 테스트. 셈에서 빠지고 `격리 n`으로 보인다. 사람이 관리한다 |
| `claude/` | `CLAUDE.md`(`@AGENTS.md`) · `settings.json`(kit 스크립트 실행 허용 두 줄). 훅 없음, 커스텀 에이전트 없음 — built-in Explore · plan mode · /code-review를 그대로 쓴다 |
| `opencode/agents/` | `build`(primary — 위임 기준 다섯 줄, task는 explore · review만) · `review`(읽기 전용 · diff와 요청과 끝의 기준만 받음). 탐색은 opencode built-in `explore`(읽기 전용)를 쓰고 반환 형식은 build가 질문에 적는다 — 하네스가 이미 주는 것은 다시 만들지 않는다. frontmatter는 `permission`(`tools`는 deprecated), 폴더는 `.opencode/agents/` — opencode 문서(2026-10-31, docs 원본 dev 브랜치)로 확인 |
| `install.mjs` | 설치기. 두 OS 공통 |

## 설치
```
node <GARAGISTE>/kit/install.mjs claude   --project <repo>
node <GARAGISTE>/kit/install.mjs opencode --project <repo>
```
스크립트와 opencode 에이전트는 덮고, AGENTS.md · check.json · flaky.txt · CLAUDE.md · settings는 있으면 둔다(settings는 `permissions.allow`만 합친다). git에는 손대지 않는다. `--dry`로 계획만 본다. opencode는 AGENTS.md가 있으면 CLAUDE.md를 읽지 않으므로 두 하네스 파일이 한 저장소에 있어도 부딪히지 않는다. 설치 뒤 할 일은 둘 — AGENTS.md의 지도와 `kit/check.json`의 명령을 채우는 것이고, 세션을 열고 에이전트에게 시켜도 된다.

한 프로젝트에 v2(`.garagiste/`)와 kit을 섞어 설치하지 않는다.

## 지침의 세 필터
AGENTS.md의 줄은 셋을 통과한 것만 남겼다. 에이전트가 **지금 관찰할 수 있는 것**으로 판정되는가(「다음 달에도 참인가」는 떨어졌다). 하네스가 **이미 말하고 있지 않은가**(겹치는 두 줄은 두 하네스에 같은 파일을 쓰기 위해 남겼다). **맞춰야 하는 숫자**가 아닌가(지도 크기 상한 · 재시도 횟수는 떨어졌다). 상한은 에이전트가 받는 쪽(check의 출력 깎기)에만 있고, 로그 파일이라는 탈출구가 붙어 있다.

## 일부러 없는 것
상태 기계 · 단계 정의 · 역할별 권한 훅 · 핸드오프 규약 · 원장 · 토큰 측정 · 지도 크기 상한 · 재시도 횟수 · 대화용과 작업용 에이전트의 분리(정제는 역할이 아니라 단계다 — plan mode). kit이 Claude Code를 나쁘게 만들 수 있는 경로는 스크립트가 틀릴 때뿐이라, 코드는 둘이고 그 둘에 테스트가 붙어 있다.

## 어떻게 자라나
v2의 「사고 없이 장치 없다」는 그대로다. 줄이 늘어도 되는 신호는 사용자가 느낀 두 가지뿐이다 — 에이전트에게 「그 파일 아니야」라고 말한 횟수, 「끝났다」가 거짓이었던 횟수. 둘이 줄지 않으면 kit이 일을 안 하는 것이다.

## 검증
```
node --test tests/kit.test.mjs
```
