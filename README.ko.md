# GARAGISTE

> 영어 정본: [README.md](README.md). 에이전트 프롬프트는 영어이며, 응답·질문·문서 언어는 규칙 파일(AGENTS.md / CLAUDE.md)의 `## Language` 줄로 정합니다(`/kickoff`·`/assess` 시작 시 한 번 묻고, `/lang <code>`로 언제든 변경). 비어 있으면 당신이 쓰는 언어를 따릅니다.


> 나도 그들처럼 차고에서 시작하고 싶었지만, 우리 집엔 차고가 없다. 그래서 설정 파일 한 폴더로 차고를 지었다.

차고는 설정 파일 한 폴더, 엔진은 기성품 LLM, 공장은 없다. 그래도 계획·구현·검증·리뷰·출하를 도는 작은 소프트웨어 회사 하나가 돌아간다.

GARAGISTE 는 **opencode** 와 **Claude Code** 양쪽에서 거의 똑같이 동작하는 자율 개발 팀 템플릿이다. 핵심 에이전트 6개(lead · planner · critic · implementer · reviewer · verifier) — Claude Code 는 병렬 구현용(`/parallel`) team-builder 를 하나 더 둔다 — 회사의 운영 루프를 담은 커맨드(`/kickoff` `/plan` `/run` `/review` `/ship` `/release` `/retro` `/handoff` `/resume` …), 저장소 상태에서 추론되는 머지 정책, 세션을 넘어 이어지는 상태판, 그리고 **사람이 무엇을 해야 하는지** 적은 가이드로 되어 있다.

## 설치
```
./install.sh claude   -Project <레포 경로>      # Claude Code 판
./install.sh opencode -Project <레포 경로>      # opencode 판
.\install.ps1 claude  -Project <레포 경로>      # Windows PowerShell
```
`-Project` 를 생략하면 현재 경로, `-Global` 이면 전역. 옵션은 두 판이 같고 `--project`/`-Project` 두 표기를 모두 받는다.
설치 후 첫 세션에서 신규 프로젝트는 `/kickoff`, 레거시는 `/assess`, 그다음 `/hire` 로 역할별 모델을 배정한다.

## 구조
```
garagiste/
  install.sh / install.ps1     # 진입점: <opencode|claude> [옵션]
  opencode/                    # opencode 판 (.opencode/ 로 설치되는 agents·commands·skills·plugins + GUIDE.md)
  claude/                      # Claude Code 판 (.claude/ 로 설치되는 agents·skills·hooks + GUIDE.md)
```
각 판의 `GUIDE.md` 가 사람용 사용법(설치, 상황별 역할, 체크리스트)이고, `README.md` 가 설정 레퍼런스다.

## 원칙 여섯 줄
1. 판단하는 자와 실행하는 자를 분리한다 — implementer 는 자기 결과를 판정하지 않고, reviewer 는 고치지 않고, lead 는 코드를 쓰지 않는다.
2. 검증 수단이 없으면 팀은 "그럴듯한 코드" 생산기다 — 첫 작업은 1분 안에 도는 테스트다.
3. 상태는 세션이 아니라 레포에 산다 — 커밋과 계획 파일. 로컬 상태판(`docs/STATUS.md`, git-ignore)은 그것을 가리킬 뿐이다.
4. 게이트는 프롬프트가 아니라 저장소가 강제한다 — 머지 정책은 원격·브랜치 보호·auto-merge 에서 추론된다.
5. 기계적 변경과 논리 변경을 한 커밋에 섞지 않는다.
6. 실패는 `/retro` 로 규칙·스킬·훅에 환류한다. 기억하는 것은 사람이 아니라 저장소다.

## 상태
opinionated template, v0.x. 재료(계획 우선, 테스트 오라클, 작은 diff, worktree 격리, 별도 컨텍스트 리뷰)는 널리 검증된 것이고, 이 배치는 벤치마크된 적 없다. `docs/METRICS.md` 를 보며 잘라내라.
