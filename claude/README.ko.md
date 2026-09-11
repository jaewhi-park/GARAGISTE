# garagiste/claude — GARAGISTE — Claude Code 판

> 영어 정본: [README.md](README.md). 에이전트 프롬프트는 영어이며, 응답·질문·문서 언어는 규칙 파일(AGENTS.md / CLAUDE.md)의 `## Language` 줄로 정합니다(`/brainstorm` 시작 시 한 번 묻고, `/lang <code>`로 언제든 변경). 비어 있으면 당신이 쓰는 언어를 따릅니다.


사람용 사용법은 **GUIDE.md**(설치·상황별 역할), 산출물 지도는 docs/README.md. 이 파일은 설정 레퍼런스다.

레포 하나를 작은 소프트웨어 회사처럼 돌린다. 사람은 CEO(전략·승인·머지), 에이전트는 팀.
회사는 조직도가 아니라 다섯 루프다: 제품(백로그) → 엔지니어링(계획·구현) → 품질(검증·리뷰) → 운영(출하·릴리즈) → 경영(결정 기록·회고).
각 루프는 `/스킬` 하나와 `docs/` 산출물 하나로 구현된다.

## 설치
저장소 루트에서 `./install.sh claude [-Project <경로>|.] [-Global]` / `.\install.ps1 claude [-Project <경로>] [-Global]`. (이 폴더의 install.sh 를 직접 실행하면 대상 인자 없이 동일) 기본은 현재 경로(가 속한 git 레포 루트). --global → ~/.claude (모든 레포; 기본 에이전트는 강제하지 않아 `claude --agent team-lead` 로 시작).

레포 루트에서:
```
./install.sh claude -Project <레포 경로>        # macOS / Linux / WSL
.\install.ps1 claude -Project <레포 경로>       # Windows PowerShell
```
`.claude/{agents,skills,hooks}`와 `docs/README.md`를 넣고 `.claude/settings.json`을 병합한다(기존 값 유지, 목록은 합집합).
전역(`~/.claude/`)은 건드리지 않는다. `.claude/`를 커밋하면 팀 구성이 레포와 함께 버전 관리된다.
첫 실행 때 폴더 신뢰 확인에 동의해야 훅이 동작한다. 모델은 세션 모델을 상속한다(에이전트 파일에 `model:` 없음).

## CEO 콘솔 (스킬 = 슬래시 커맨드, CEO만 호출 가능)
| 루프 | 커맨드 | 산출물 |
|---|---|---|
| 경영 | `/brainstorm <아이디어 또는 파일>` → `/kickoff` / `/assess <대상>` | BRIEF(기획서: 브레인스토밍 또는 직접 쓴 문서 → 빈 슬롯 → critic 사전 부검 → 승인), 그다음 CHARTER, ADR, CLAUDE.md, (레거시) ASSESSMENT·REBUILD_PLAN·parity harness 계획; 마무리 단계에서 /hire, 그다음 상태판 |
| 제품 | `/backlog [아이디어]` | docs/BACKLOG.md (+ GitHub Issues) |
| 엔지니어링 | `/plan <항목>` → `/run <계획>` (또는 `/build`); `/plan <사양서 또는 계획> 수정: …` | 접수 질문 1회(선택: 사양서 라운드 → docs/specs/*.md) → docs/plans/*.md, 단계별 커밋; 개정은 차이만 쓰고 진행 중 계획은 같은 브랜치에서 이어진다 |
| 병렬 | `/parallel <계획들>` → `/integrate` → `/ship` | worktree별 브랜치 → `integrate/<날짜>`로 직렬 머지 큐 → PR 하나 |
| 품질 | `/review` | 위험도 비례 리뷰(2렌즈 기본, 4렌즈) → 수정 루프 |
| 운영 | `/ship` → `/release [ver]` · `/policy` | PR(위험도 라벨; 사용자 대면 계획은 "직접 확인" 절, 자동 머지 제외) 또는 로컬 머지, CHANGELOG, docs/releases/*.md |
| 경영 | `/retro <대상>` | CLAUDE.md 규칙 / 스킬 / 훅 갱신 |
| 인수인계 | `/handoff`(단계 도중에만) / `/resume` | docs/STATUS.md(로컬, git-ignore) |
| 팀 관리 | `/hire` / `/roster` | 역할별 모델·effort 배정과 운영 프로필(둘 다 스크립트); 로스터 표 |
| 언어 | `/lang [code]` | 스크립트로 CLAUDE.md의 `## Language` 절만 고쳐 쓰고 즉시 적용 |
| 채용 | `/recruit <gap>` | 권한 프리셋과 형제 역할의 모델·effort로 새 역할 생성(승인 후 스크립트) |

## 팀 (.claude/agents/)
| 에이전트 | 역할 | 도구 | 특이사항 |
|---|---|---|---|
| team-lead | 테크리드/EM. 메인 세션 에이전트 | Agent(team-*, Explore), Read/Grep/Glob, Bash, Edit/Write, AskUserQuestion | Edit/Write는 docs/STATUS.md만(훅 강제). `settings.agent`로 기본 지정. 커밋 안 함(훅) |
| team-planner | 아키텍트. 문서·계획·사양서·ADR | Read/Grep/Glob, Edit/Write, Bash, Web* | `memory: project` — 아키텍처 지식 축적 |
| team-critic | 설계 리뷰(pre-mortem) | Read/Grep/Glob | 읽기 전용 |
| team-implementer | 시니어 엔지니어 (메인 체크아웃, 순차) | Read/Grep/Glob, Edit/Write, Bash | 커밋함, /ship 에서 브랜치 push·PR 생성 |
| team-builder | 시니어 엔지니어 (병렬용) | 동일 | `isolation: worktree` — 계획 하나를 자기 worktree에서 통째로 구현, 자체 검증 |
| team-reviewer | 렌즈별 코드 리뷰 | Read/Grep/Glob, Bash | `memory: project` — 반복 결함 패턴 축적 |
| team-verifier | CI | Bash, Read/Grep/Glob | CLAUDE.md의 명령만 실행 |
| Explore | 코드베이스 조사 (내장) | 읽기 전용 | |

## 회사처럼 돌리는 리듬
- 아침: `/backlog`로 오늘 할 항목 확정 → `/plan` 승인 → `/run` (병렬이면 아래 참고)
- 낮: lead의 AskUserQuestion에만 답한다. 그 외는 자율.
- 저녁: `/run`이 ship까지 끝내면 머지 정책대로. 주 1회 `/release`, 실패가 반복되면 `/retro`.
- 사람의 네 가지 일: 헌장·접수·사양서 질문에 답하기 / 계획 승인·에스컬레이션 결정 / PR 머지(정책에 따라) / 회고 승인.

## 머지 정책 — 자동 판정
`/ship`이 저장소 상태를 보고 정한다. 설정 파일을 고칠 일은 없다.
| 저장소 상태 | 판정 | 동작 |
|---|---|---|
| 원격 없음 | `local` | PR 설명을 docs/prs/에 저장, 승인 후 로컬 main에 `merge --no-ff` |
| 원격 있음, main 보호·auto-merge 없음 | `manual` | 브랜치 push + PR(risk 라벨). 사람이 머지 |
| 원격 있음 + main 보호(필수 체크) + auto-merge 허용 | `auto-low-risk` | `risk:low`는 `gh pr merge --auto`, `risk:high`는 사람 |
즉 "자동 머지를 켠다" = GitHub에서 main 보호와 auto-merge를 켜는 것이고, 그게 곧 안전 조건이다. `/policy`로 현재 판정과 근거를 확인하고, 정말 필요할 때만 CLAUDE.md에 override(`manual`/`auto-low-risk`)를 적는다. 훅은 어느 판정에서도 force push와 main 직접 push를 막는다.

## 작업 방식 — 순차가 기본, 병렬은 선택
기본(/build)은 한 세션에서 계획 하나를 메인 체크아웃에서 단계별로 순차 구현한다. 기능을 여러 개 의뢰하면 lead는 /plan 을 여러 번 만들고 하나씩 /build 한다. worktree도 머지도 없고, 충돌도 구조적으로 없다. 개인 프로젝트 대부분은 이걸로 충분하다.

병렬이 필요할 때는 세 가지, 위에서부터 시도한다:
1. **세션 병렬**: 터미널마다 `claude --worktree <기능명>` → 각 세션에서 /plan → /build → /review → /ship. 사람이 PR 순서대로 머지하고, 나중 브랜치는 그 세션에서 "main에 rebase 후 재검증"을 시킨다. 가장 단순하고 견고하다.
2. **세션 내 병렬** (/parallel → /integrate): lead가 team-builder를 계획마다 하나씩 동시에 띄운다. builder는 `isolation: worktree` 로 자기 worktree에서 계획 전체를 구현·자체 검증·커밋하고 브랜치를 보고한다. lead는 /integrate 로 main에서 딴 통합 브랜치에 브랜치를 **하나씩** 리뷰 → 머지 → (충돌은 implementer가 해소) → verifier → 다음, 그리고 /ship 이 그 브랜치를 PR 하나(또는 로컬 머지 하나)로 출하한다. `worktree.baseRef: head` 설정으로 builder는 세션의 현재 브랜치에서 분기한다.
3. **agent teams** (실험적): `settings.json`의 `env`에 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. 팀원 세션이 공유 태스크 목록을 두고 서로 통신한다. 모듈이 진짜 독립적이고 팀원끼리 조율이 필요할 때만.

규칙: 병렬 단위는 계획(기능)이지 단계가 아니다. `/plan` 의 "변경 파일" 집합이 겹치지 않는 계획만 동시에 돌린다. 통합은 항상 직렬(머지 큐)이고, 머지마다 verifier를 돌린다.

## 로컬 전용 (원격 없는 초기 빌드업)
`git remote`가 비어 있으면 `/ship`은 push·PR 대신 docs/prs/NNNN-<slug>.md 에 PR 설명을 남기고, 머지 정책대로 로컬 main에 `git merge --no-ff` 한다(manual이면 CEO 승인 후). 게이트는 그대로다 — 계획 하나 = 브랜치 하나, verifier, 4렌즈 리뷰, 위험도, 머지 커밋 단위 롤백. `/release`는 승인 후 로컬 태그를 만든다. GitHub를 붙이면(`git remote add origin …`) 다음 `/ship`부터 자동으로 PR 흐름이 되고, main 보호 + auto-merge를 켜면 자동으로 auto-low-risk가 된다. 설정 파일을 고칠 일은 없다.

## 모델과 예산
**권장 경로는 `/hire`** 다. lead 가 사용 가능한 모델을 확인하고(opencode: `opencode models`, Claude Code: 별칭), 예산 티어·프로젝트 성격·병렬 계획을 묻고, 역할 × 모델 표를 이유와 함께 제안한다. 승인하면 `scripts/apply-models.mjs`(model 줄만 바꾸는 스크립트)로 적용하고 CLAUDE.md 에 "운영 프로필"(기본 렌즈 수·병렬·critic 기준·단계별 verifier·단계 크기 목표)을 남긴다. `/kickoff`·`/assess`의 마무리 단계에서 실행된다. 아래 `--budget` 프로필은 비대화형·스크립트용이다. 설치할 때 `-Budget <티어>`를 주면 첫(kickoff/assess) 세션부터 verifier가 haiku로 돌고, `/hire`가 그 위에서 다듬는다.

기본은 `inherit`(model 줄 없음 → 세션 모델 상속). `--budget` 을 주면 역할별 모델 별칭(opus/sonnet/haiku)과 effort 를 기록한다. 별칭은 플랜이 제공하는 최신 모델로 풀리므로 "감지"는 필요 없고, 티어는 당신의 사용량 한도 선택이다: unlimited(API·사내) · high(Max 20x) · medium(Max 5x) · low(Pro). 플랜은 CLI 로 확인할 수 없어 사람이 지정한다.

| 역할 | unlimited | high | medium | low |
|---|---|---|---|---|
| 세션(lead) | opus · high | opus · high | opus · medium | sonnet · medium |
| planner | opus · high | opus · high | opus · medium | sonnet · high |
| critic | opus · high | opus · high | sonnet · high | sonnet · medium |
| implementer / builder | opus · medium | opus · medium | sonnet · medium | sonnet · medium |
| reviewer | opus · high | opus · medium | sonnet · high | sonnet · medium |
| verifier | haiku · low | haiku · low | haiku · low | haiku · low |

원칙은 같다: 판단하는 자리(계획·리뷰)에 강한 모델과 높은 effort, 볼륨 자리(구현)와 판정 자리(verifier)에서 아낀다. `low` 에서는 병렬 리뷰·`/parallel` 도 자제한다(한도가 5시간 창이다).
변경: `./install.sh claude -Budget <tier>` 재실행, 개별은 `--set team-implementer=sonnet:high`, 복귀는 `--budget inherit`. `/roster` 가 현재 배정을 보여주고, 세션 모델만은 Claude Code 의 `/model`, 대화식 편집은 `/agents`.

## 세션 수명주기
세션은 작업 기억, 레포가 장기 기억. 상태는 세 곳 — 단계마다의 커밋, 계획 파일(승인 시 커밋), `docs/STATUS.md`(로컬, git-ignore, SessionStart 훅으로 자동 주입; 전역 설치면 .gitignore에 직접 추가).
한 세션 = 한 계획(PR). `/ship`이나 `/plan`이 끝나면 상태판과 커밋이 이미 남아 있으니, 다음 세션은 상태판이 있으면 `/resume`으로, 없으면 제안받은 커맨드로 바로 시작한다. `/handoff`는 단계 도중에 멈출 때만. 짧게 끊긴 경우만 `claude --continue`.
에이전트별 장기 기억은 `.claude/agent-memory/<name>/`에 쌓인다(planner·reviewer). auto memory가 꺼져 있으면 동작하지 않는다.

## opencode 버전과의 차이
- 경로별 edit 권한은 훅이 강제하는 곳에만 있다: team-lead는 docs/STATUS.md만 수정할 수 있고(`guardrails.mjs`), 같은 훅이 `git add`/`git commit`도 막는다. planner의 "docs만 수정"은 프롬프트 규칙이고 리뷰어가 잡는다. 하드 차단이 필요하면 같은 훅에 경로 규칙을 추가한다.
- 비밀 파일 차단(`.env`, 키, 인증서)은 deny 규칙과 훅을 통해 파일 도구(Read/Edit/Write)에 적용되고, 훅은 그 파일을 출력하는 셸 명령(`cat .env`, `Get-Content .env.local`, `grep KEY .env`)도 막는다. 프로그램이 직접 파일을 읽는 경우(`node -e`, `python -c`)는 못 잡으니 비밀은 저장소 밖에 둔다.
- `permissions.deny`는 세션 전체에 걸린다. force push와 main 직접 push를 deny와 훅으로 막고, 기능 브랜치 push는 허용한다.
- 메인 세션 에이전트(`--agent`/`settings.agent`)의 `Agent(...)` 목록은 lead가 부를 수 있는 subagent 허용 목록이다. subagent 정의 안에서는 괄호 목록이 무시된다.
- `memory: project`로 역할별 장기 기억이 생긴다. opencode에는 없는 기능이라 회사의 "경험 축적"에 해당한다.

## 주의
- 워크플로우 스킬은 `disable-model-invocation: true`라 Claude가 임의로 호출하지 못한다. 예외는 다섯 개 — `build`·`review`·`ship`(`/run` 체인), `hire`(`/kickoff`·`/assess`의 마무리 단계), `roster`(읽기 전용). 모델 호출을 허용하고 프롬프트로 "CEO 호출 또는 해당 체인 안에서만"으로 묶는다. 나머지는 lead 가 "`/명령` 을 실행하세요"라고 문장으로 제안만 한다. 지식 스킬은 `user-invocable: false`라 메뉴에 안 보이고 에이전트가 필요할 때 로드한다.
- Pro/Max 기본 권한 모드(auto)에서는 subagent가 부모의 모드를 그대로 따른다. 팀의 안전장치는 도구 목록·deny 규칙·훅이다.
- 훅은 Node로 작성되어 Windows에서도 그대로 동작한다. 정규식은 초안이니 스택에 맞게 다듬을 것.
