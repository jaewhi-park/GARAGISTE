# 로컬 테스트 가이드 — 증거 팀을 내 PC에서 돌려 보기

대상: CEO 한 사람. macOS·Linux(bash) 또는 Windows(PowerShell·Git Bash). 필요한 것: git · node 20 이상 · Claude Code(또는 opencode). GitHub Actions·CI·외부 서비스는 쓰지 않는다. 실제 모델 호출은 Claude Code 세션의 spawn만이다.

## 1. GARAGISTE 받기
```bash
git clone -b claude/garagiste-process-efficiency-qygydj https://github.com/jaewhi-park/GARAGISTE.git ~/GARAGISTE
cd ~/GARAGISTE && node --test "tests/*.test.mjs"      # 단위 + e2e 전부 통과해야 한다
```
`main`에는 아직 v1이 있다. v2는 이 브랜치다(PR·머지는 네 결정).

## 2. 시험 저장소 만들기 (feasibility 1 — 작은 CLI, UI 없음)
빈 폴더 하나와 명령 한 줄. 사람이 채울 파일은 없다.
```bash
~/GARAGISTE/install.sh claude -Project ~/work/f1 -Budget medium     # Windows: ~\GARAGISTE\install.ps1 claude -Project ~\work\f1
```
설치기가 `git init`, 팀 파일 복사, 첫 커밋(팀 파일만)까지 한다. team.json의 명령과 CLAUDE.md의 자리는 비어 있는 것이 정상이다 — 첫 unit `boot`가 채운다. 기존 프로젝트에 설치할 때도 같은 명령이고, 그때는 첫 커밋 대신 conductor가 `work.mjs commands`로 기존 검증 명령을 적는다.

## 3. 세션 열기
```bash
cd ~/work/f1 && claude
```
session-start 훅이 첫 줄에 `GARAGISTE 증거 팀 — 이 세션은 conductor다…`와 doctor 한 줄, STATUS 첫 줄을 넣는다. 안 보이면 훅이 죽은 것이다: `node .garagiste/scripts/doctor.mjs`가 무엇을 치라고 말한다(대개 settings.json 경로 또는 node PATH).

이 세션은 코드를 쓰지 않는다. 훅이 `.worktrees/` 밖 편집을 거부한다. 평범하게 파일을 고치고 싶은 세션은 `GARAGISTE_ADMIN=1 claude`로 연다.

## 4. 시험 진행 — CEO가 하는 말과 보는 것
1. **구상.** 자유롭게 말한다. 끝나면 "이 내용으로 brief 축적해" — conductor가 `work.mjs brief`로 원문을 docs/BRIEF.md에 쌓는다. feasibility 1의 brief는 이 한 문단으로 충분하다:
   > 터미널에서 쓰는 메모 도구. `memo add "<글>"`로 메모를 남기고, `memo list`로 최신순으로 보고, `memo find <단어>`로 찾는다. 메모는 홈 폴더의 `.memo/` 아래 하루 한 파일(마크다운)로 저장되고, 파일을 손으로 고쳐도 다음 명령이 그대로 읽는다. 외부 네트워크는 쓰지 않는다.
2. **"개발해."** conductor가 `brief.mjs intake` → intake 팩 spawn. 결과: docs/BACKLOG.md에 unit 줄(코드가 없으면 첫 줄은 `boot` · kind scaffold — 스택·명령·스모크·규칙 파일을 채우는 unit), docs/DECISIONS.md에 예/아니오 질문. 질문에는 `node .garagiste/scripts/work.mjs decide <n> "<답>"`으로 답한다(또는 말로 — conductor가 대신 친다).
3. **범위.** "M1 전부" 또는 "add와 list만". conductor가 `work.mjs scope …`를 치고 SCOPE 줄(요청 n · 선행 m · 순서)을 보여 준다. 받으면 "가".
4. **루프.** conductor가 `seed` → (boot는 boot 팩 하나 → ship) → 다음 unit은 spec(opus) → redproof → build(sonnet) → attack(opus) → build → ship. 네가 볼 것은 docs/STATUS.md 첫 줄과 「써볼 것」뿐이다.
5. **써봤다.** STATUS의 try 카드대로 명령을 쳐 보고 `node .garagiste/scripts/work.mjs tried <slug> ok|fail "<메모>"`.

## 5. 무엇을 재나 (판정선)
`.garagiste/ledger/evidence.jsonl`이 전부 기록한다. unit 3개 뒤에 이 표를 채운다(`grep '"kind":"spawn"'`·`"pack"`·`"verify"`·`"ship"` 줄 수로 센다).

| 판정 | 선 | 재는 법 |
|---|---|---|
| conductor가 코드·테스트를 쓴 줄 | 0 | 세션 기록에 Edit/Write 없음(훅 거부 로그 없음) |
| spec의 테스트가 redproof RED | 3/3 | `RED` 줄 |
| attack이 남긴 실패 테스트 | unit당 ≥1 | `ATTACK … red n/…` 첫 값 |
| ship 7조건 통과 · try 카드 3줄로 따라 할 수 있음 | 3/3 | `SHIPPED` 줄 · 네 손 |
| spawn/unit · 첫 코드까지 분 | ≤8 · ≤15 | `spawn` 줄 수 / `unit` ts → 첫 `verify` ts |
| 토큰/unit | 기록 | 각 spawn 뒤 conductor가 `work.mjs spawned <slug> <팩> --tokens N --minutes M` |

결과는 `docs/measurements/feasibility-1.md`(조건 · N · 표 · 판정, 80줄 이하)로 GARAGISTE에 남긴다.

## 6. 모델 편성
설치 때 `-Budget low|medium|high`가 team.json과 `.claude/agents/*.md`의 `model:`을 함께 정한다. 바꾸기:
```bash
node .garagiste/scripts/work.mjs models              # 지금 편성
node .garagiste/scripts/work.mjs models low          # tier 통째로
node .garagiste/scripts/work.mjs models build=opus   # 팩 하나
```
| tier | intake | spec | build | attack | spike | boot |
|---|---|---|---|---|---|---|
| low | sonnet | sonnet | haiku | sonnet | haiku | haiku |
| medium | opus | opus | sonnet | opus | sonnet | sonnet |
| high | opus | opus | opus | opus | sonnet | sonnet |
opencode는 기본 provider/model을 상속한다. 팩별로 바꾸려면 같은 명령이 `.opencode/agents/<팩>.md`의 `model:`을 쓴다(값은 `provider/model`).

## 7. 막히면
- **설치 직후 doctor가 commands 비어 있음을 말한다.** 정상이다 — boot unit이 채운다. 세션을 열고 만들 것을 말하라.
- **커밋이 거부된다.** 원장에 그 tree의 quick PASS가 없다는 뜻이다. `node .garagiste/scripts/verify.mjs quick` 뒤 다시. `--no-verify`는 없다(설계).
- **"인덱스 ≠ 작업 트리".** 스테이지 안 한 파일이 있다. 전부 `git add -A` 하거나 되돌린다. 로컬 상태(`.garagiste/ledger·units·session·scope.json`, `.worktrees/`)는 .gitignore에 있어야 한다.
- **테스트가 root에서 다르게 돈다(컨테이너).** `.garagiste/env.local`(추적 안 함)에 `GARAGISTE_RUNNER=…`를 두면 verify가 그 환경으로 돈다. 맥에선 필요 없다.
- **pnpm 모노레포.** worktree에 패키지별 node_modules가 링크된다(자동). 안 되면 `pnpm install`을 worktree에서.
- **ship이 spike를 요구한다.** diff가 package.json·워크플로·설치기 등 boundary 파일을 건드렸다. spike 팩을 돌려 `docs/measurements/spike-<slug>.md` 필수 행 다섯을 채운다.
- **에이전트가 경계 밖에 썼다.** 훅이 거부해야 정상이다. 거부 로그가 없는데 파일이 바뀌었으면 훅이 죽은 것이다 → doctor.

## 8. LACUNA 브랜치에 대해
LACUNA의 같은 이름 브랜치에는 오늘의 **레거시 인수 모드** 시험이 커밋돼 있다(v2 설치, v1 배선은 docs/archive/v1-claude/, intake가 만든 M1 unit 20줄과 질문 8개, 열린 unit `desktop-test-flake`의 worktree는 로컬에만). BRIEF만 들고 코드 0줄에서 하는 시험은 다른 자리(새 저장소 또는 고아 브랜치)에서 한다 — 네 결정.
