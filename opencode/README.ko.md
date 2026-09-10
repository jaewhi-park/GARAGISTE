# GARAGISTE — opencode 판

> 영어 정본: [README.md](README.md). 에이전트 프롬프트는 영어이며, 응답·질문·문서 언어는 규칙 파일(AGENTS.md / CLAUDE.md)의 `## Language` 줄로 정합니다(`/kickoff`·`/assess` 시작 시 한 번 묻고, `/lang <code>`로 언제든 변경). 비어 있으면 당신이 쓰는 언어를 따릅니다.


사람용 사용법은 **GUIDE.md**(설치·상황별 역할), 산출물 지도는 docs/README.md. 이 파일은 설정 레퍼런스다.

신규 제품이든 레거시 리빌드든 같은 팀이 맡는다. 팀의 "성격"(역할·권한·절차)은 여기 글로벌 설정에,
프로젝트의 "사실"(명령·구조·결정)은 각 레포의 AGENTS.md와 docs/에 둔다. 팀은 /kickoff 또는 /assess로
자기 자신을 새 레포에 온보딩한다.

## 설치
저장소 루트에서 `./install.sh opencode [-Project <경로>|.] [-Global]` / `.\install.ps1 opencode [-Project <경로>] [-Global]`. (이 폴더의 install.sh 를 직접 실행하면 대상 인자 없이 동일) 기본은 현재 경로(가 속한 git 레포 루트). --global  → ~/.config/opencode (모든 레포).

```
./install.sh opencode -Project <레포 경로>        # macOS / Linux / WSL
.\install.ps1 opencode -Project <레포 경로>       # Windows PowerShell
```
스크립트가 하는 일: 기존 `~/.config/opencode/` 백업 → agents/commands/skills/plugins 복사(같은 이름만 덮어씀)
→ `opencode.json` 병합(instructions 합집합, permission·agent 항목은 없는 키만 추가, subagent_depth는 없을 때만 설정). provider·model은 건드리지 않는다 —
템플릿은 model을 지정하지 않으므로 기존 opencode 설정의 provider/model을 그대로 상속한다. 바꾸고 싶을 때만 `--model`/`-Model`.
`--project`/`-Project`를 주면 글로벌 대신 현재 레포의 `.opencode/`와 루트 `opencode.json`에 설치한다.
`--dry-run`/`-DryRun`으로 먼저 확인할 수 있다. 기존 설정이 `.jsonc`면 병합을 건너뛰고 수동 안내를 출력한다.

설치 후 레포에서 `opencode` 실행 → Tab으로 `team-lead` 선택.

## CEO 콘솔
| 커맨드 | 언제 |
|---|---|
| `/kickoff <아이디어>` | 신규 프로젝트. 헌장 → 스택 ADR → 골격 → AGENTS.md → 첫 계획 → /hire |
| `/assess <대상>` | 레거시. 인벤토리 → 보존/수정 방침 → 리빌드 전략 ADR → AGENTS.md → 첫 seam의 parity harness 계획 → /hire |
| `/plan <항목>` | 접수 질문 1회(선택: 사양서 라운드 → docs/specs/) → planner 작성 → critic 리뷰(3단계 이상 또는 risk:high) → 승인 요청 |
| `/build <계획파일>` | 단계별 implementer → verifier 루프 |
| `/run <계획파일>` | 기본 경로: build → review → ship 한 번에, 게이트에서만 정지 |
| `/review [기준브랜치]` | 위험도 비례 리뷰(2렌즈 기본, 4렌즈) → 수정 루프 |
| `/ship` | 전체 검증 · 문서 · 브랜치 push · PR 생성(risk 라벨) · 머지는 정책대로 |
| `/retro <대상>` | 실패를 AGENTS.md 규칙/스킬/가드레일로 환류 |
| `/backlog [아이디어]` | PM: 완료 조건이 있는 백로그 항목·우선순위 (docs/BACKLOG.md, 선택적 GitHub Issues) |
| `/release [버전]` | 운영: 버전·CHANGELOG·릴리즈 노트, 태그 명령 제시 |
| `/hire [메모]` | 사용 가능한 모델·예산·프로젝트 성격에 맞춰 역할별 모델 배정과 운영 프로필(CEO 승인, 둘 다 스크립트) |
| `/roster` | 에이전트별 모델·권한 표와 변경 방법 |
| `/lang [code]` | 작업 언어 설정: 스크립트로 AGENTS.md의 `## Language` 절만 고쳐 쓰고 즉시 적용 |
| `/recruit <gap>` | 새 역할 제안(프리셋 권한, 모델은 로스터의 형제 역할에서 복사); CEO 승인 후 스크립트가 생성 |
| `/policy [값]` | 머지 정책의 현재 자동 판정과 근거 확인, 필요 시 override |
| `/spawn <계획들>` | 병렬: 계획별 worktree·브랜치 생성, 새 세션 명령 제시 |
| `/integrate [브랜치들]` | 머지 큐: 브랜치별 리뷰 → 머지 → 충돌 해소 → verifier, 직렬 |
| `/handoff [메모]` | 세션 마무리: STATUS.md 갱신, WIP 커밋, 대기 결정 정리 |
| `/resume [메모]` | 새 세션 첫 커맨드: STATUS.md·계획·git 대조 후 재개 |

## 팀
| 에이전트 | mode | 할 수 있는 것 | 못 하는 것 |
|---|---|---|---|
| team-lead | primary | 위임·판정·CEO 질의, git 조회, docs/STATUS.md 갱신 | 그 외 파일 수정, 코드 실행 |
| team-planner | subagent | docs/**, AGENTS.md 작성 | 코드 수정 |
| team-critic | subagent | 계획 pre-mortem | 모든 수정 |
| team-implementer | subagent(hidden) | 구현·테스트·커밋, /ship 에서 push·PR | force push, main push, 질문 |
| team-reviewer | subagent | 렌즈별 리뷰 (git diff) | 수정 |
| team-verifier | subagent | 테스트·lint·빌드 실행 | 수정, 위임 |
| explore | 내장 | 코드베이스·의존성 조사 (bash는 opencode.json의 읽기 전용 allowlist로 제한) | 수정, allowlist 밖 명령 |

## 에이전트 간 계약
- 모든 subagent는 고정된 보고 형식으로 lead에 답한다 (verifier: PASS/FAIL, reviewer/critic: 마지막 줄 APPROVE/REVISE).
- lead만 CEO에게 질문한다. 형식: 결정 1문장 / 선택지 / 추천 / 무응답 시 기본값. 예외는 /plan의 사양서 라운드로, 여기서는 열린 질문과 자유 서술 답이 허용된다.
- 수정 루프는 3회 상한. 넘으면 멈추고 보고한다.
- 자율 결정은 docs/DECISIONS.md, 아키텍처 결정은 docs/adr/.

## 세션 수명주기
세션은 작업 기억, 레포가 장기 기억이다. 상태는 세 곳에 남는다: 단계마다의 커밋, 계획 파일, `docs/STATUS.md`(상태판, 매 세션 자동 주입).
- 한 세션 = 한 계획(PR). 다른 작업은 새 세션에서 시작한다.
- 끝낼 때: `/handoff` → 종료. 자연스러운 종료 시점은 `/ship` 직후, 계획 승인 직후, 컴팩션이 2회 이상 일어났을 때.
- 이어갈 때: 새 세션 → `/resume`. 같은 날 잠깐 끊긴 경우만 `opencode -c`(마지막 세션 이어서)를 쓴다. 길게 이어진 세션은 요약 위에 요약이 쌓여 품질이 떨어진다.
- 중간 컴팩션은 `plugins/compaction.ts`가 상태판 항목을 요약에 강제로 남긴다.

## 병렬과 머지
- 병렬은 세션 단위다: `/spawn` 이 계획별 worktree(`../<레포>-<slug>`)와 브랜치를 만들고, 각 worktree에서 별도 `opencode` 세션이 `/build` 한다. 메인 세션의 `/integrate` 가 브랜치를 하나씩 리뷰·머지·검증한다(머지 큐). opencode subagent에는 worktree 격리가 없어 세션 내 병렬은 지원하지 않는다.
- 머지 정책은 `/ship`이 저장소 상태로 자동 판정한다: 원격 없음→`local`(PR 문서 + 로컬 main 머지, 승인 후), 원격+main 보호+auto-merge→`auto-low-risk`(`risk:low`는 CI 통과 시 자동 머지, `risk:high`는 사람), 그 외→`manual`(PR까지, 머지는 사람). AGENTS.md의 "머지 정책" 줄은 비워 두는 게 기본이고, 적으면 override다. `/policy`로 현재 판정과 근거를 본다. 플러그인은 어느 경우에도 force push와 main 직접 push를 막는다.

## 로컬 전용 (원격 없는 초기 빌드업)
`git remote`가 비어 있으면 `/ship`은 push·PR 대신 docs/prs/NNNN-<slug>.md 에 PR 설명을 남기고, 머지 정책대로 로컬 main에 `git merge --no-ff` 한다(manual이면 CEO 승인 후). 게이트는 그대로다 — 계획 하나 = 브랜치 하나, verifier, 4렌즈 리뷰, 위험도, 머지 커밋 단위 롤백(`git revert -m 1`). `/release`는 승인 후 로컬 태그를 만든다. GitHub를 붙이면(`git remote add origin …`) 다음 `/ship`부터 자동으로 PR 흐름이 되고, main 보호 + auto-merge를 켜면 자동으로 auto-low-risk가 된다. 설정 파일을 고칠 일은 없다.

## 모델과 예산
**권장 경로는 `/hire`** 다. lead 가 사용 가능한 모델을 확인하고(opencode: `opencode models`, Claude Code: 별칭), 예산 티어·프로젝트 성격·병렬 계획을 묻고, 역할 × 모델 표를 이유와 함께 제안한다. 승인하면 `scripts/apply-models.mjs`(model 줄만 바꾸는 스크립트)로 적용하고 AGENTS.md 에 "운영 프로필"(기본 렌즈 수·병렬·critic 기준·단계별 verifier·단계 크기 목표)을 남긴다. `/kickoff`·`/assess` 끝에 자동으로 제안된다. 아래 `--budget` 프로필은 비대화형·스크립트용이다. 설치할 때 `-Budget <티어> -Strong <id> -Fast <id>`를 주면 첫(kickoff/assess) 세션부터 verifier가 빠른 모델로 돌고, `/hire`가 그 위에서 다듬는다.

기본은 `inherit`(에이전트에 model 줄 없음 → 세션의 provider/model 상속). `--budget` 을 주면 두 모델(strong/fast)을 역할별로 배분한다. 설치 시 `opencode models` 로 사용 가능한 모델을 감지해 strong/fast 를 제안하고, 터미널이면 확인을 받는다.

| 역할 | unlimited | high | medium | low |
|---|---|---|---|---|
| lead / planner / critic | strong | strong | strong | planner·critic strong, lead fast |
| implementer | strong | strong | fast | fast |
| reviewer | strong | strong | strong | fast |
| verifier | fast | fast | fast | fast |

판단이 필요한 자리(계획·설계 리뷰·코드 리뷰)에 강한 모델을 끝까지 남기고, 볼륨이 큰 자리(구현)와 판정만 하는 자리(verifier)에서 아낀다.
변경: `./install.sh opencode -Budget <tier> -Strong <id> -Fast <id>` 재실행, 개별은 `--set team-reviewer=<id>`, 복귀는 `--budget inherit`. `/roster` 가 현재 배정을 보여준다.

## 커스터마이즈 포인트
- `agents/team-verifier.md` — bash allow-list를 실제 스택에 맞게 줄인다.
- `agents/team-lead.md` — 에스컬레이션 기준. 헌장의 "에스컬레이션 추가 항목"이 여기에 더해진다.
- `plugins/guardrails.ts` — 차단 명령 정규식.
- `opencode.json` — `instructions`로 docs/CHARTER*.md, docs/STATUS*.md를 매 세션 자동 주입한다. model 미지정 = 상속. `subagent_depth: 2`는 team-planner/implementer/reviewer/critic(모두 subagent)이 각자 explore를 부를 수 있게 하는 값 — opencode 기본값 1이면 이 호출이 조용히 막힌다.
- 역할별로 다른 모델을 쓰고 싶으면 해당 `agents/*.md` frontmatter에 `model: provider/id`만 추가한다. subagent는 미지정 시 호출한 primary의 모델을 따른다.
- 각 에이전트의 `temperature`/`steps`는 역할 기준 초기값이다. 모델에 맞게 조정.

## 알려진 주의점
- edit 권한 패턴은 저장소 루트 기준 상대 경로(`docs/plans/x.md`, `AGENTS.md`)와 비교되고 `*`는 단순 `.*`다. `**/docs/**`가 아니라 `docs/*`로 쓸 것: `**/` 형태는 앞에 `/`를 요구해서 아무것도 매칭되지 않는다. 첫 사용 시 planner가 docs/ 밖은 못 쓰고 docs/ 안은 쓸 수 있는지 한 번 확인할 것.
- 내장 explore 에이전트는 bash를 가지며 전역 `ask`를 상속하므로 조사 중 `ls`, `git rev-parse` 하나하나에 프롬프트가 떴다. `opencode.json`의 `agent.explore.permission.bash`에 읽기 전용 allowlist를 두어 그 밖의 명령은 프롬프트 없이 거부되고 explore는 grep/glob/read로 대신한다. 스택에 맞게 목록을 늘릴 것.
- 스킬은 에이전트가 자발적으로 로드하지 않을 수 있어 커맨드에서 이름을 명시해 로드시킨다.
- 헤드리스 실행(`opencode run`)에서는 permission 프롬프트가 뜰 수 없다. 팀 에이전트는 모두 명시적
  allow/deny로 되어 있으나, 내장 build/plan은 글로벌 기본값(ask)을 따른다.
