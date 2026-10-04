# GARAGISTE — 증거 팀

> 코딩은 주장을 참으로 만드는 일이다. 주장은 테스트·프로브·불변식이고, 팀은 그 그래프 위의 스케줄러이며, 사람은 방향·현실·책임 — 그리고 창이다.

GARAGISTE v2는 **Claude Code와 opencode 위에서 도는 AI-native 개발팀**이다. 사람 회사를 흉내 내는 역할(기획자·비평가·리뷰어)이 없다. 있는 것은 파일로만 인수인계하는 여섯 팩(boot·intake·spec·build·attack·spike), 판단 없는 스크립트 열다섯, 경계를 지키는 훅/플러그인, 그리고 원장이다.

- **실행되지 않은 것은 믿지 않는다.** 스펙은 red 인수 테스트, 승인은 exit code, 리뷰의 산출물은 실패하는 테스트.
- **루프는 기계가 끝낸다.** 커밋 게이트가 원장과 tree를 대조하고, `ship`은 8조건이 전부 참일 때만 main에 닿는다.
- **사람은 한 마디 · 예/아니오 · 「써봤다」.** STATUS 첫 줄이 매일 보는 전부다.

## 에이전트는 있다 — 페르소나가 없을 뿐
팩 여섯(boot·intake·spec·build·attack·spike)이 에이전트다. 각 팩은 spawn 설정 한 장(`.claude/agents/<pack>.md` 또는 `.opencode/agents/<pack>.md`, 10줄)과 쓰기 경계로만 정의된다. 프롬프트는 팩 파일 경로 한 줄이고, 팩 파일이 그 spawn의 전부다. 모델은 예산(`-Budget`)이 정한다. "너는 시니어 엔지니어다" 같은 문장은 어디에도 없다.

## 설치
```
./install.sh claude   -Project <repo> [-Budget low|medium|high]    # Claude Code
./install.sh opencode -Project <repo> [-Budget low|medium|high]    # opencode
.\install.ps1 claude|opencode -Project <repo>                       # Windows PowerShell
```
팀 정본은 하네스와 무관하게 `<repo>/.garagiste/`(scripts·packs·HAZARDS·team.json·원장·unit 상태)로, 하네스 배선만 갈린다:

| | Claude Code | opencode |
|---|---|---|
| 규칙 파일 | `CLAUDE.md` (20줄) | `AGENTS.md` (20줄) |
| 경계 | `.claude/hooks/guard.mjs` (PreToolUse) | `.opencode/plugins/guard.ts` (tool.execute.before) |
| 규칙 본체 | 둘 다 `.garagiste/scripts/guard-rules.mjs` 하나 | |
| spawn 설정 | `.claude/agents/{boot,intake,spec,build,attack,spike}.md` | `.opencode/agents/{conductor,boot,intake,spec,build,attack,spike}.md` |
| 죽은 에이전트의 wip | SubagentStop 훅 → `checkpoint.mjs` | `task` 뒤 플러그인 → `checkpoint.mjs` |
| conductor | 메인 세션 (CLAUDE.md Flow) | `conductor` primary agent (edit 권한 없음) |
| 모델 | 예산 → agents 앞머리 `model:` | 기본 provider/model 상속, 팩별 `model:`은 앞머리에 직접 |

검증 명령(`commands`: quick·full·test_file·run)은 첫 unit `boot`가 `work.mjs commands`로 채운다 — 사람이 채울 파일은 없다. 규칙: `quick`은 `tests/acceptance`·`tests/adversary`를 빼고(red 상태로 커밋되므로), `full`은 전부 포함한다.

## 입구 — 빈 폴더에서 범위까지
설치는 명령 한 줄(`install.sh claude -Project <빈 폴더>`: git init · 팀 파일 · 첫 커밋). 그 뒤 사람이 채울 파일은 없다 — 첫 unit `boot`(kind scaffold)가 스택·검증 명령·스모크·규칙 파일을 채우고 ship한다. 한 문장씩 말하지 않는다. 입력 단위는 대화 전체다.
```
구상(대화) ─▶ work.mjs brief "<원문>" | --file PRD.md      원문 그대로 docs/BRIEF.md에 축적 (요약 금지)
"개발해"   ─▶ brief.mjs intake → intake 팩 spawn          BACKLOG에 unit 줄: slug · 마일스톤 · needs · "원문 한 문장" · 인수 한 줄
                                                          되돌리기 어려운 것은 예/아니오 카드(work.mjs ask intake) → needs: Q<n>
범위       ─▶ work.mjs scope login share | --milestone M1 | --range a..b
              SCOPE 요청 2 · 선행 2 · 없는 선행 0            ← 역제안: needs 간선의 닫힘을 기계가 계산한 것
              - 선행: db (session가 needs) · session (login가 needs)
              - 순서: db → session → login → share
루프       ─▶ work.mjs seed → UNIT | WAIT <slug> needs … | SCOPE DONE
           (무인이면 conduct.mjs가 이 루프를 멈춤까지 돈다 — conductor 세션 없이, 종료 코드가 멈춤)
```
`needs`는 인간 관례가 아니라 주장 그래프의 간선이다. "이걸 하려면 저게 먼저"는 회의가 아니라 `closure()`의 출력이고, CEO는 받거나(`seed`) 선행을 빼거나(`--no-needs`, 원장에 남는다) 둘 중 하나만 한다.

## 한 unit의 생애
```
CEO 한 마디 ─▶ work.mjs new <slug> "<원문>"          (boundary HIT면 spike 팩부터)
           ─▶ brief.mjs spec  → red 인수 테스트 · try.md · surface.md → redproof.mjs = RED
           ─▶ brief.mjs build → red→green, 커밋마다 verify quick, 게이트가 원장 대조
           ─▶ brief.mjs attack → 실패하는 테스트 (tests/adversary) → build 재spawn → red 0
           ─▶ ship.mjs <slug> → 8조건 → main ff 머지 · LEDGER 한 줄 · STATUS 생성
CEO 「써봤다」 ─▶ work.mjs tried <slug> ok|fail
```
에이전트는 팩 파일 하나만 받고 서로 말하지 않는다. build는 attack을 만난 적이 없다 — 실패하는 테스트 파일을 만날 뿐이다.

## 스크립트 (판단 0)
| 스크립트 | 하는 일 |
|---|---|
| `next` | 루프의 다음 한 걸음을 한 줄로: run · spawn · ceo · wait · done — conductor는 이 줄만 따른다(seed → spec → redproof → build → attack → ship, re-spec·늦은 spike·충돌·한 번에 하나) |
| `conduct` | Flow 4를 스크립트가 돈다 — next의 한 줄을 그대로 실행(run은 그 명령, spawn은 팩을 헤드리스 `claude -p --agent <팩>` 세션으로), 팩마다 spawned(실측 토큰·분·비용)·spawn_stop·체크포인트, `spec:` 반려 전달, CEO 결정만 요구하는 FAIL은 `ask --hold`로 그 unit만 세움. 멈춤이 종료 코드(0 done · 2 ceo · 3 wait · 4 프레임워크 FAIL · 5 상한) · `intake` · 다른 하네스는 `--spawner` |
| `work` | 입구와 unit 생애: brief · add · scope(선행 닫힘) · seed · system(범위 끝의 이음새 공격) · new · ask(`--assumed`) · decide · default · tried · list · models(편성 한 곳) · spawned(원장 기록) |
| `brief` | 팩 조립 ≤8 KB(intake는 32 KB) — 원문은 데이터 펜스, HAZARDS는 경로 매칭, 이어받기 절, worktree 마커 |
| `verify` | quick · full · red · attack · **gate**(커밋마다 원장↔tree, 테스트 floor, step 300줄) |
| `redproof` | 인수 테스트가 base에서 red · head에서 green임을 증명 |
| `boundary` | 의존성·워크플로·IPC·권한·유출 키워드 → spike 필수 |
| `ship` | 8조건 fail-closed → ff 머지 · docs/LEDGER.md · STATUS(quick FAIL이면 머지 롤백) |
| `claims` | 주장 그래프: 참·거짓·미검수·불명, 센서 커버리지, 다음 거짓 |
| `state` | docs/STATUS.md 생성(첫 줄 = 전부) · 무인 정지 예산 · `report`: SCOPE DONE의 출하 보고 한 장(만든 것·증명·정한 것·못 본 것·써볼 것) |
| `doctor` | 감별 진단 — 하네스를 감지해 무엇이 죽었고 무엇을 치면 되는지 한 줄씩 |
| `guard-rules` · `checkpoint` | 두 하네스가 공유하는 경계 규칙과 wip 체크포인트 |

## 문서
- [docs/GUIDE.md](docs/GUIDE.md) — 내 PC에서 돌려 보는 테스트 가이드(클론 · 설치 · 세션 · CEO가 하는 말과 보는 것 · 판정선 · 모델 편성 · 막히면)
- [docs/PRINCIPLES.md](docs/PRINCIPLES.md) — 네 문장과 뼈대 여덟, 사람의 창
- [docs/BIRTH.md](docs/BIRTH.md) — 0 base 탄생 프로토콜, 탄생 규칙 셋, 첫 3 unit 뒤의 판정선
- [docs/catalogue/](docs/catalogue/) — 후보 장치 카탈로그(v2 설계), v1 측정 진단, 토의 추가분. **계획이 아니다** — 사고가 나면 여기서 찾아 만든다
- [docs/DECISIONS.md](docs/DECISIONS.md)

## 이 저장소 검증
```
node --test tests/unit.test.mjs   # 순수 함수
node --test tests/e2e.test.mjs    # 탄생 시험(claude) + 출하 원자성 + opencode 설치: 빈 저장소 → 출하까지, 모델 0 · 네트워크 0
```

## v1
v1(역할극: agents 7 · skills 31 · opencode 플레이버)은 2026-09-29에 지웠다. 이력은 main의 `0fdfa28` 이전에 있고, 측정 진단은 docs/catalogue/V1-ANALYSIS.md에 남는다.
