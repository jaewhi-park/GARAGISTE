# 로컬 테스트 가이드 — 증거 팀을 내 PC에서 돌려 보기

대상: CEO 한 사람. macOS·Linux(bash) 또는 Windows(PowerShell·Git Bash). 필요한 것: git · node 20 이상 · Claude Code(또는 opencode). GitHub Actions·CI·외부 서비스는 쓰지 않는다. 실제 모델 호출은 Claude Code 세션의 spawn만이다.

## 1. GARAGISTE 받기
```bash
git clone https://github.com/jaewhi-park/GARAGISTE.git ~/GARAGISTE
cd ~/GARAGISTE && node --test "tests/*.test.mjs"      # 단위 + e2e + 필드 도구 전부 통과해야 한다
```

## 2. 시험 저장소 만들기
빈 폴더 하나와 명령 한 줄. 사람이 채울 파일은 없다.
```bash
~/GARAGISTE/install.sh claude -Project ~/work/f1 -Budget medium     # Windows: ~\GARAGISTE\install.ps1 claude -Project ~\work\f1
```
설치기가 `git init`, 팀 파일 복사, 첫 커밋(팀 파일만), **자가 진단**(doctor → selftest: 이 기계에서 기계 루프 첫 커밋 → boot unit → 게이트 → ship이 닫히는지 30초 안에)까지 한 번에 한다 — 끝 줄이 `SELFTEST PASS n/n`이어야 설치다. FAIL이면 그 출력을 그대로 붙여 달라(설치기는 빨간 채로 끝내지 않는다 · 건너뛰기는 `-SkipSelftest`).

team.json의 명령과 CLAUDE.md의 자리는 비어 있는 것이 정상이다 — 첫 unit `boot`가 채운다. 기존 프로젝트(코드가 있는 저장소)에 설치할 때도 같은 명령이다 — 설치가 팀 파일을 커밋하고(사고 70), intake가 「저장소 상태: 코드 있음」을 받아 첫 unit을 `adopt`로 올리며, adopt 팩이 특성화 테스트·검증 명령·규칙 파일을 채운다(제품 코드는 그대로 — 2026-10-04 3라운드, 첫 측정은 parcel-desk 홀드아웃).

## 3. 세션 열기
권한: `.claude/settings.json`이 `defaultMode: acceptEdits`(파일 쓰기는 묻지 않음 — 경계는 guard 훅이 지킨다)와 allow 목록(`node .garagiste/scripts/*`·git 읽기·add·commit·worktree·npm/pnpm/python 등)을 갖는다. 그래도 프롬프트가 계속 뜨면 어떤 명령이었는지 붙여 달라 — allow 목록에 더한다.

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
4. **루프.** conductor는 `next.mjs`가 내는 한 걸음씩 돈다 — boot는 boot 팩 하나 → ship, 다음 unit은 spec → redproof → build → attack → verify attack → ship. 범위가 끝나면 이음새 공격 한 바퀴(`work.mjs system`)와 출하 보고(docs/REPORT.md)가 따른다. 네가 볼 것은 docs/STATUS.md 첫 줄과 「써볼 것」뿐이다.
5. **써봤다.** STATUS의 try 카드대로 명령을 쳐 보고 `node .garagiste/scripts/work.mjs tried <slug> ok|fail "<메모>"`.

## 5. 무엇을 재나 (판정선)
`.garagiste/ledger/evidence.jsonl`이 전부 기록한다. 판정선은 docs/BIRTH.md의 표(첫 3 unit 뒤)이고, 등록·실측은 docs/measurements/(L1·L2 시험 · 필드 벤치)에 남긴다 — 표는 손이 아니라 `tests/field/table.mjs`·`day.mjs`가 원장에서 낸다.

## 6. 모델 편성
설치 때 `-Budget low|medium|high`가 team.json과 `.claude/agents/*.md`의 `model:`을 함께 정한다. 바꾸기:
```bash
node .garagiste/scripts/work.mjs models              # 지금 편성
node .garagiste/scripts/work.mjs models low          # tier 통째로
node .garagiste/scripts/work.mjs models build=opus   # 팩 하나
```
| tier | intake | spec | build | attack | spike | boot | adopt |
|---|---|---|---|---|---|---|---|
| low | sonnet | sonnet | haiku | sonnet | haiku | haiku | haiku |
| medium | opus | opus | sonnet | opus | sonnet | sonnet | sonnet |
| high | opus | opus | opus | opus | sonnet | sonnet | sonnet |
opencode는 기본 provider/model을 상속한다. 팩별로 바꾸려면 같은 명령이 `.opencode/agents/<팩>.md`의 `model:`을 쓴다(값은 `provider/model`).

## 7. 막히면
- **설치 직후 doctor가 commands 비어 있음을 말한다.** 정상이다 — boot unit이 채운다. 세션을 열고 만들 것을 말하라.
- **커밋이 거부된다.** 원장에 그 tree의 quick PASS가 없다는 뜻이다. `node .garagiste/scripts/verify.mjs quick` 뒤 다시. `--no-verify`는 없다(설계).
- **"인덱스 ≠ 작업 트리".** 스테이지 안 한 파일이 있다. 전부 `git add -A` 하거나 되돌린다. 로컬 상태(`.garagiste/ledger·units·session·scope.json`, `.worktrees/`)는 .gitignore에 있어야 한다.
- **테스트가 root에서 다르게 돈다(컨테이너).** `.garagiste/env.local`(추적 안 함)에 `GARAGISTE_RUNNER=…`를 두면 verify가 그 환경으로 돈다. 맥에선 필요 없다.
- **pnpm 모노레포.** worktree에 패키지별 node_modules가 링크된다(자동). 안 되면 `pnpm install`을 worktree에서.
- **ship이 spike를 요구한다.** diff가 package.json·워크플로·설치기 등 boundary 파일을 건드렸다. spike 팩을 돌려 `docs/measurements/spike-<slug>.md`의 필수 행(wire·host·license·default·os·측정)을 채운다.
- **STOP ceo … unit 토큰 상한.** 그 unit이 spawn 토큰을 상한(team.json `budgets.unit_tokens_max`, 기본 1M)만큼 썼다 — attack↔build 진동의 예산 장치. 계속이면 `node .garagiste/scripts/work.mjs budget <slug> 2000000`, 아니면 `work.mjs drop <slug> "<사유>"`.
- **설치본이 어느 판인지.** `node .garagiste/scripts/doctor.mjs --version`이 GARAGISTE 커밋 sha·team/ tree·하네스를 말한다(2026-10-04부터 `.garagiste/VERSION`). 없으면 그 전 설치본 — `install.sh`를 다시 돌리면 갱신 커밋으로 적힌다(scripts·packs·훅·agents는 덮고 team.json·HAZARDS·규칙 파일은 남긴다).
- **에이전트가 경계 밖에 썼다.** 훅이 거부해야 정상이다. 거부 로그가 없는데 파일이 바뀌었으면 훅이 죽은 것이다 → doctor.

## 8. 무인으로 돌리기 — conduct.mjs (2026-10-04)
Flow 4(루프)는 모델이 아니라 스크립트가 돌 수 있다. conductor 세션이 `next.mjs`의 한 줄을 읽고 실행하던 자리를 `conduct.mjs`가 대신한다 — 팩은 헤드리스 세션(`claude -p <팩 경로> --agent <팩>`)으로 뜨고 `.claude/agents/<팩>.md`가 모델·도구·정체를, 훅이 경계를, 게이트가 증거를 그대로 지킨다. Flow 1~3·7(구상·답·범위·끼어들기)은 대화다.
```bash
cd ~/work/f1
node .garagiste/scripts/conduct.mjs check             # 실전 전 preflight: claude CLI · 작업 공간 신뢰 · agents · allow · doctor · VERSION · 잠금 — FAIL이면 고칠 길이 줄마다
node .garagiste/scripts/conduct.mjs intake          # Flow 2: brief.mjs intake → intake 팩 → work.mjs list (질문은 CEO가 work.mjs decide)
node .garagiste/scripts/work.mjs scope --milestone M1
node .garagiste/scripts/conduct.mjs                 # Flow 4: 멈출 때까지 — 「아침」 절의 멈춤과 같고 종료 코드가 멈춤이다
node .garagiste/scripts/conduct.mjs --max-usd 15 --pack-minutes 45   # 이 실행의 비용 상한 · 팩 하나의 시간 상한(기본 team.json budgets: run_usd_max 0=끔 · pack_minutes_max 60)
```
| 종료 코드 | 멈춤 | CEO가 할 일 |
|---|---|---|
| 0 | SCOPE DONE(이음새 공격·REPORT 뒤) | 다음 범위 `work.mjs scope` |
| 2 | ceo — hard 질문 · 미검수 3 · 무인 출하 5 · unit 토큰 상한 · 범위 없음 | docs/STATUS.md 첫 줄 · 카드(`work.mjs try` → `tried`) · `decide` · `budget` |
| 3 | wait — 선행 unit 또는 CEO 결정 | `decide` 뒤 다시 |
| 4 | 프레임워크 FAIL — 같은 FAIL 되풀이 · 팩 비정상 종료 2회 · worktree가 그대로인 팩 재spawn 2회 | 그 줄 전문을 정비 채널로(우회·스크립트 편집 없음), STATUS 「막힌 것」에 남는다 |
| 5 | 상한 — `--max-steps`(기본 200) · `--max-minutes` · `--max-usd` · `--once` | 다시 돌리면 이어서 |
| 1 | 이미 돌고 있다(잠금 `.garagiste/session/conduct.json`의 pid가 살아 있음) · **고아 팩**(앞 드라이버는 죽었는데 그 팩 프로세스가 돈다 — 6라운드) 또는 인자·doctor FAIL | 한 저장소에 드라이버 하나 — 기다리거나, 정말 죽었으면 잠금 파일을 지운다 · 고아 팩은 끝나길 기다리거나 `kill <pid>` 뒤 다시(Ctrl-C·SIGTERM으로 끊은 드라이버는 팩에도 넘기고 잠금을 정리한다) |
- 전제: 그 폴더에서 대화형 `claude`를 한 번 열어 작업 공간을 신뢰했을 것(헤드리스엔 신뢰 대화가 없다 — `conduct.mjs check`가 본다). 팩마다 `.garagiste/session/logs/conduct-<slug>-<팩>-<시각>.json`에 stdout·stderr가 남고, 원장 spawn 줄에 실측 토큰·분·비용이 적힌다(`work.mjs spawned`와 같은 줄).
- CEO 결정만 요구하는 FAIL(두 번째 spec 반려 · 팩 상한 2배 · 이미 충족)은 안내 끝의 `work.mjs ask … --hold`를 드라이버가 그대로 실행해 그 unit만 세운다 — 답은 저녁에 `decide`.
- 멈춘 팩은 `--pack-minutes`(기본 60)에 SIGTERM으로 끊긴다 — 비정상 종료 둘이면 프레임워크 FAIL로 멈춘다(밤새 걸리지 않는다). 돌아와서 STATUS 「진행 중」을 보면 살아 있는 conduct의 걸음·slug·팩·비용이 한 줄로 있다.
- 대화형 conductor와 같은 저장소에서 동시에 돌리지 않는다 — unit은 한 번에 하나다(잠금이 막는다). 다른 하네스·시험은 `--spawner "<명령 템플릿 {path} {pack} {slug} {model} {turns}>"`(모델 0 가짜 팩은 `tests/fakes/pack.mjs`).
- **opencode 설치본**: `.claude/agents`가 없어 기본 spawner가 서지 않는다 — `conduct.mjs check`와 본 실행이 잠금 전에 한 줄로 선다. `--spawner 'opencode run --agent {pack} "$(cat {path})"'` 꼴의 템플릿을 설치된 opencode 판에 맞춰 적는다(이 예는 모델 0 환경에서 검증되지 않았다 — 첫 실전 run이 검증이다). JSON이 아닌 출력은 토큰·비용 0으로 기록되니 예산 정지는 걸음·시간 상한으로 건다. 가드 플러그인·L0는 같은 법이다 — e2e가 같은 속임수 셋과 13 케이스 패리티로 묶는다(CHANGELOG 「R&D 5라운드」).

## 9. 누가 무엇을 보장하나 (2026-10-04 4라운드 측정)
| 층 | 보장 | 한계 |
|---|---|---|
| L0 — git 훅 + 스크립트 + 원장 | 원장 없는 커밋은 게이트가, 약화된 테스트는 redproof가, 출하는 8조건이 막는다. **ship은 머지 직전 통합 tree에서 full·redproof·attack을 스스로 다시 돈다**(team.json `ship_reverify`, 기본 켬) | 위조한 PASS 줄은 게이트를 지나간다 — 원장은 증거이지 증명이 아니다. main에 닿는 길은 ship뿐이라 재검증이 마지막 벽 |
| L1 — guard 훅·플러그인 | 규칙집·원장·배선 쓰기 거부(파일 도구·셸 리다이렉트·in-place verb·인라인 코드), 팩의 쓰기 경계, 파괴적 git, 게이트 우회 접두, 비밀 파일(.env·*.pem·*.key·credentials·id_rsa)은 읽기도(6라운드) | 정규식 — 최선 노력. 읽기는 막지 않는다(의도). OS 샌드박스는 백로그 후보 |
| L2 — 팩 산문 | 할 일·하지 않는 것 | 조언 — 모델이 따를 때만 |
