# Changelog

Releases are dated; each hook and plugin carries the date as `GARAGISTE_VERSION`, and `session-start.mjs` names it in the injected context. A running project keeps the release it was installed with until its CEO decides to upgrade — the "Breaking for running projects" list of a release is the migration checklist; re-run `install.sh <flavor> -Project <repo>` afterwards.

## v2 — 2026-09-29 · 증거 팀 (unreleased)

v1의 역할극(agents 7 · skills 31 · hooks 4 · opencode 플레이버)을 잇지 않는 재시작. `team/`이 새 정본이고 `install.sh <claude|opencode>`가 정본을 `.garagiste/`로, 배선을 `.claude/` 또는 `opencode.json`+`.opencode/`로 설치한다. v1 트리는 2026-09-29 삭제(be39c4a, CEO 결정) — 이력은 main의 `0fdfa28` 이전에 있고 백업 브랜치 `v1`이 그 지점을 가리킨다.

### Added
- `team/scripts/` 열둘(판단 0, 하네스 중립): work · brief · verify(+gate) · redproof · boundary · ship · claims · state · doctor · guard-rules · checkpoint · lib. 팩 넷: spec · build · attack · spike(쓰기 경계로 정의, 페르소나 없음).
- Claude Code 배선 `team/claude/`: settings.json(deny + 훅 3) · hooks(guard · spawn-log · session-start — 규칙은 guard-rules.mjs를 부른다) · agents 넷(10줄 spawn 설정, 모델은 -Budget) · CLAUDE.md 템플릿.
- opencode 배선 `team/opencode/`: opencode.json(default_agent conductor) · agents 다섯(conductor primary, edit 권한 없음 + 팩 넷 subagent) · plugins/guard.ts(tool.execute.before → 같은 guard-rules, task 뒤 → checkpoint) · AGENTS.md 템플릿.
- 커밋 게이트(`.githooks/pre-commit` → `verify.mjs gate`): 모든 커밋은 원장에 그 tree의 quick PASS가 있어야 하고, 로직 변경엔 테스트 파일이, step은 로직 300줄(2×는 이유로도 불가), 보호 브랜치엔 ship만.
- `ship.mjs` 8조건 fail-closed: unit·full·redproof·attack red 0·spike 필수 행·wip 아님·열린 질문 없음·예산(미검수 3·무인 출하 5·팀 자발 unit 연속 2·산문 40 KB).
- `docs/PRINCIPLES.md` · `docs/BIRTH.md` · `docs/catalogue/`(v2 설계는 계획이 아니라 후보 카탈로그) · `team/HAZARDS.md`(v1 사고 11건, 줄마다 경로와 검사).
- `tests/unit.test.mjs`(순수 함수) · `tests/e2e.test.mjs` 탄생 시험(claude: 빈 저장소 → 출하 → 써봤다) + 출하 원자성 + opencode 설치·doctor, 모델 0 · 네트워크 0. CI 없음 — 검증은 로컬 quick/full(Actions 미사용은 CEO 결정 26d3e94).

- 입구: `work brief`(원문 축적) · intake 팩(BRIEF → BACKLOG unit 줄 + 예/아니오) · `work add` · `work scope`(needs 닫힘 → 선행 역제안, `--milestone`·`--range`·`--no-needs`) · `work seed`(다음 unit 자동, Q<n> 게이트, WAIT/DONE) · STATUS `## 범위`.
- conductor 가드: `.worktrees/` 밖 Edit/Write 거부(GARAGISTE_ADMIN=1 예외). 팩 다섯(intake 추가), -Budget에 intake 모델.
- 설치 한 줄: 빈 폴더면 `git init` + 첫 커밋(게이트는 HEAD 없는 첫 커밋을 통과시킨다). 첫 unit `boot`(kind scaffold, boot 팩 하나)가 스택·검증 명령(`work commands`)·스모크·규칙 파일 자리(`work rules`)를 채우고 redproof·attack 없이 ship — 사람이 채울 파일은 없다. BACKLOG 줄에 `kind:`.
- `work models <tier>|<팩>=<모델>`: team.json이 정본, 두 하네스의 에이전트 `model:`을 재생성. `work spawned`·brief의 `pack` 원장 줄로 spawn 모델·토큰을 기록. ship은 diff 파일로도 boundary를 봐 spike를 요구한다. `.garagiste/env.local`(기계별 실행 환경). docs/GUIDE.md(로컬 테스트 가이드).

### Fixed — 2026-09-29 L0 수리 (6-레포 부검의 백로그 docs/V2-REPAIR-BACKLOG.md)
- R1·R3: seed가 매 unit을 CEO 접점으로 찍어 무인 출하 상한이 절대 발동하지 않던 것 — 접점은 brief·scope·decide·tried만, origin_kind는 seed·ceo(ADMIN 세션)·team(기본).
- R2·R7: tried·decide는 메인 전용이고 팩(worktree 컨텍스트)의 호출은 가드가 거부; GARAGISTE_SHIP·WIP·ADMIN env 접두는 ADMIN 밖에서 거부(LARGE_STEP은 정상 경로).
- R4·R5: Bash 리다이렉트·in-place 편집(sed -i 등)도 팩 쓰기 경계를 지키고 worktree 밖 Bash 쓰기는 거부(최선 노력 — 법은 게이트); 팩 정체의 정본은 unit 상태라 마커 변조가 무효, 정체 불명 worktree는 fail-closed.
- R6: 검증 명령(team.json)의 재작성은 boot(scaffold) worktree·ADMIN만, ship이 scaffold 아닌 diff의 team.json 변경을 거부.
- R8: seed·ship 전 doctor fail-closed(구조 결함; alive·빈 commands는 FRESH_OK), session-start가 doctor 이유 전문을 주입, doctor --fresh 추가.
- R9: 머지 뒤 main quick FAIL이면 머지·shipped 마크·LEDGER 행·BACKLOG 체크를 롤백(원장은 append-only — ship_rollback 줄), ship 원장 줄은 quick PASS 뒤에만.
- R10·R11·R12: 낡은(이전 tree) 증거의 FAIL 문구에 복붙 가능한 재실행 명령; spike 팩은 인수 테스트 없이 열림(boundary HIT의 spike-first 복원); unit의 열린 질문이 8번째 ship 조건.
- R15: 설치는 install→doctor(--fresh)→selftest 원샷 fail-closed(-SkipSelftest로 생략), 재설치에서 team.json 편성이 -Budget을 이기고 에이전트 model:도 team.json에서 나온다(v1 재적용병 백신).
- R14: README의 「commands를 사람이 채운다」 모순 제거, HAZARDS 검사열을 실존 검사로 정합, 이 CHANGELOG의 낡은 사실(v1 트리·CI) 정정.

### Added — 2026-09-29 L1 진입 조건 (docs/V2-REPAIR-BACKLOG.md §L1)
- `work drop <slug> ["사유"] [--forget]` — 방향전환의 원자 연산: wip 커밋 → `dropped/<slug>-<ts>` 브랜치 보존 → worktree 제거. dropped는 seed 자리를 막지 않아 같은 slug가 새로 열린다. conductor 전용.
- Flow 7 — 인터럽트 4종(버그·수정·추가·방향전환)의 착지 절차, spec 팩의 re-spec 규칙(어긋나는 주장만 고친다).
- spawn 센서 — SubagentStop의 agent_type이 팩이면 원장 `spawn_stop`(무명 stop은 기록하지 않는다: v1 무명 stop 1,024건 사고의 백신). unit당 spawn은 `pack` 줄(의도)과 `spawn_stop`(완료)이 기계로 센다.
- LEDGER attack 열이 「선발견→최종red/총」(예 1→0/1) — attack 검출률(Q4)을 tried fail과 대조하는 계측.
- guard가 team.json `protected_branch`로의 push를 브랜치 이름과 무관하게 거부(main|master 고정이던 구멍).

### Fixed — 2026-09-29 win32 경로 표기 (첫 Windows 실기의 사고 2)
- Windows에서 repoRoot(git 출력, `C:/…`)와 mainRoot(`path.resolve`, `C:\…`)의 표기가 달라 `c.root !== c.main` 검사(decide·drop·tried의 메인 전용, L0 R2)가 **메인 저장소에서도** 참이 됐다 — L1 시험의 decide 9건이 기록되지 못했다. repoRoot가 `path.resolve`로 플랫폼 표기를 정규화한다. 검사: repoRoot===mainRoot 불변식 unit 테스트(red는 win32에서만 관측 — 사고 재현이 그 red) + HAZARDS에 실기 사고 2줄 등록.

### Removed — 2026-09-29 sensors.machine_os와 ship의 platform 필터 (첫 Windows 실기의 사고)
- Windows 첫 설치에서 selftest가 ship 조건 2에 막혔다: verify full은 PASS인데 platform `win32`가 기본 목록(`["linux","darwin"]`)에 없어 증거가 거부됐다. 이 필터는 「어디서 검증해도 되는가」의 허용 목록일 뿐 대상-OS 보증(HAZARDS 14)은 하지 못하면서 정당한 증거만 거부했다 — 검출 0·오탐 1로 제거. 대상-OS 보증은 `@sensor` 태그·STATUS의 target-OS 미관측 카운트가 계속 맡고, verify의 `platform`은 원장 필드로 계속 기록된다(L4 플랫폼 센서의 재료). 기존 설치본의 team.json에 남은 `machine_os` 키는 무해하게 무시된다 — 수정 불필요, 스크립트 재설치만 하면 된다.

### Fixed — 2026-09-29 팩 조립이 CEO 결정과 BRIEF 부록을 떨어뜨렸다 (첫 Windows 실기의 사고 4)
- boot 팩에 닫힌 결정(Q1 「부록 스택 확정: 예」)과 BRIEF 부록(40줄 컷 밖)이 들어가지 않아, 에이전트가 스택 미지정으로 판단하고 기본값(Node + node:test)을 깔았다 — 에이전트 잘못이 아니라 조립 결함. 수리: 모든 팩(unit·intake)에 `## 결정된 것`(DECISIONS의 `- [x]` 전체), BRIEF는 40줄 컷 없이 전문(넘치면 fit이 「파일에서 직접 읽어라」로 대체), boot 팩 상한은 intake처럼 4×(BRIEF 전문을 지는 두 팩). 검사: e2e가 boot·re-spec·intake 팩 내용을 고정 + closedDecisions unit 테스트.

### Fixed — 2026-09-29 가드가 따옴표 안 텍스트를 쓰기·파괴로 오탐 (첫 Windows 실기의 사고 5)
- 커밋 메시지 트레일러(`<noreply@…>`)의 `>`가 리다이렉트로 읽혀 커밋이 거부됐다(에이전트는 트레일러를 빼는 우회로 통과). 수리: 쓰기·파괴 판정(DESTRUCTIVE·원장·규칙집·writeTargets)은 stripQuoted — 따옴표 안은 데이터, 단 큰따옴표 안 `$()`·백틱은 실행이라 그 내용만 남긴다. 우회 접두(GARAGISTE_* env)·worktree 경로 추론은 따옴표로도 효력이 있어 계속 원문을 본다. 검사: guard 단위 테스트(트레일러 커밋 허용, `"$(… > 규칙집)"` 거부).

### Fixed — 2026-09-29 models 산출물에 커밋 경로가 없었다 (2차 실기의 사고 6)
- `work.mjs models`가 team.json과 에이전트 `model:` 줄을 main에 고쳐 두기만 해서, ship의 「메인 미커밋 변경」 검사에 걸리고 conductor에겐 커밋 수단이 없었다(보호 브랜치 게이트가 직접 커밋을 거부 — 둘 다 정상 작동). 수리: models가 바꾼 파일만 pathspec으로 `scaffold(team): models <args>` 자기-커밋(내부 SHIP·WIP 차선 — drop의 wip 커밋과 같은 선례, 기계적 재생성이라 원장 PASS 불요). 변경이 없으면 커밋도 없다. 검사: e2e(models 뒤 main 깨끗 + 커밋 메시지 + no-op 무커밋).

### Fixed — 2026-09-29 team.json rebase 충돌과 kind 안 맞는 FAIL 안내 (2차 실기의 사고 7)
- main의 models 커밋(build=opus)과 boot 브랜치의 commands 커밋이 team.json의 인접 블록을 각자 재작성해 ship의 rebase가 텍스트 충돌로 죽었고, FAIL 문구는 scaffold unit에 존재하지 않는 build 팩을 가리켜 conductor가 boot 팩 spawn 1회를 낭비했다. 수리: 충돌 파일이 team.json 하나면 키 단위 3-way 기계 병합(`mergeTeamJson` — 한쪽만 바꾼 키는 그쪽, 같은 키가 갈리면 병합 없이 기존 FAIL) 후 rebase 계속, 통합 tree의 full은 기존대로 ship이 재실행해 원장에 남긴다; FAIL 문구는 unit kind에 맞는 팩 이름. 검사: mergeTeamJson unit 테스트 + boot e2e가 models 커밋 × commands 커밋 충돌을 그대로 재현해 SHIPPED와 두 변경의 공존을 고정.

### Fixed — 2026-09-29 팩 상한이 실측보다 작았다 (2차 실기의 사고 8)
- 첫 실제 build 팩(vault-schema)이 12KB로 상한 8KB를 넘어 루프가 멈췄다. 초과분은 법(인수 테스트 5.4KB)이 아니라 부대물(규칙·try/surface·이어받기·결정)이었다 — 상한은 실측 없이 정한 추정치. 수리: 기본 `pack_kb_max` 8→16(기존 설치는 team.json 한 줄을 CEO가 갱신), fit의 강등 순서를 diff→hazards→brief→이어받기→try→surface로 확장(전부 worktree·git에서 복구 가능한 절 — 포인터 문구가 어디서 읽을지 말한다), 법(acceptance·원문·규칙·결정)은 불가침 유지. 이어받기 절 제목을 「이 브랜치에 이미 있는 것」으로(스펙 커밋도 담으므로). 덤: scaffold(boot)의 TRY 안내가 없는 try.md 대신 실행·검증 명령을 가리킨다(ship 출력·STATUS 써볼 것).

### Fixed — 2026-09-29 위치 의존 스크립트와 의존성 승계 (2차 실기의 사고 9·10)
- 사고 9: `redproof.mjs`·`verify.mjs red|attack`을 메인 루트에서 돌리면 대상 파일이 0개라 red 0/0 거짓 초록(ship 8조건이 막긴 했지만 라운드 낭비). 수리: slug 작업은 어디서 불러도 그 unit의 worktree가 뿌리(`slugRoot`) — 위치 규칙을 문서에 적는 대신 스크립트가 위치를 무의미하게 만든다.
- 사고 10: 의존성이 unit worktree에만 설치되고 worktree는 ship 뒤 사라져, 메인이 설치하지 않으면 다음 unit이 맨손이 된다(2차 실기: build가 zod 없이 직접 파서를 짰고 attack이 그 파서에서 결함 3건을 찾았다). 수리: ship이 매니페스트 변경 출하에 「메인 설치를 돌려라」 NOTE + boot 팩에 러너 `.worktrees/` exclude 규칙(메인 full 오염 방지).

### Fixed — 2026-09-29 glob `**/`가 세그먼트 경계를 삼켰다 (2차 실기의 사고 11)
- `globToRegex`가 `**/`를 `.*`로 바꾸며 뒤의 `/`를 삼켜, `**/schema/**`가 `docs/units/vault-schema/…`처럼 schema로 **끝나는** 폴더까지 물었다 — 거짓 boundary HIT가 순수 로직 unit의 ship을 「spike 미완」으로 막았고, slug 이름(vault-schema)이 지뢰가 되는 구조였다. 수리: `**/` → `(.*/)?`(0개 이상의 온전한 세그먼트; `a/**/b`가 `a/b`도 맞고 `a/xb`는 안 맞는다). boundary·HAZARDS 매칭·LOGIC_EXCLUDE가 같은 함수를 쓰므로 전부 함께 바로잡힌다. 검사: vault-schema 재현 포함 glob 단위 테스트.

### Fixed — 2026-09-29 porcelain 선행 공백 절단 (2차 실기의 사고 12)
- `sh()`가 stdout 전체를 trim해 `git status --porcelain` 첫 줄이 비스테이징 수정(` M …`)이면 선행 공백이 사라지고, `dirtyFiles`의 `slice(3)`이 경로 첫 글자를 먹었다(`ocs/BACKLOG.md`·`garagiste/HAZARDS.md`) — DOC_OK에 있는 파일이 목록 밖 파일로 보여 ship을 거짓으로 막았고, 앞선 FAIL 문구의 경로 표기도 왜곡했다. 수리: dirtyFiles가 trim 없는 원문 stdout을 직접 읽는다. 검사: 비스테이징 수정 재현 단위 테스트.

### Fixed — 2026-09-29 결정 절이 프로젝트 나이만큼 팩을 키웠다 (2차 실기의 사고 13)
- 사고 4의 수리('닫힌 결정 **전체**를 모든 팩에')가 단조 증가 벡터였다 — 결정이 쌓일수록·선행 사슬이 길수록 팩이 커져 build 팩이 15.7/16KB까지 닿았다. 당시 conductor의 원안(needs에 걸린 Q만)이 옳았다. 수리: unit 팩의 결정은 스코프로 — 전역(intake 슬러그) + 이 unit + needs의 unit·Q<n>; 슬러그를 못 읽는 줄은 버리지 않는다(결정을 떨어뜨리는 쪽이 더 위험). boot(세계 정의)·intake(전 그림) 팩은 전체 유지. 검사: scopedDecisions 단위 테스트 + e2e(남의 unit 결정 제외·전역 포함).

### Fixed — 2026-09-30 spike 행 형식 불일치와 spike의 wip 체크포인트 (2차 실기의 사고 14·15)
- 사고 14: spike가 「default (팀이 정한 것 후보): …」처럼 부연을 붙이자 `spikeComplete` 정규식(`행이름:`만 인정)이 내용 있는 행을 미완으로 봤다 — 팩에 형식 지시도 없어 재spawn해도 같은 형식이라 루프가 돌 수 없었다. 수리: 정규식이 괄호 부연 허용 + spike 팩에 행 형식 한 줄 명시(약한 모델 대비 이중 방어).
- 사고 15: 커밋 금지 팩(spike — 가드도 spike의 commit을 거부)의 worktree를 체크포인트 훅이 wip로 커밋해 tree가 바뀌었다 — full·redproof·attack 증거가 전부 낡고 HEAD가 wip이 되어 build 한 라운드가 추가로 필요했다. 수리: checkpoint가 unit 상태 spike인 worktree를 건너뛴다(측정 파일은 초 단위 재실행이라 잃는 쪽이 싸다 — 늦은 boundary HIT로 spike가 뒤에 오면 재검증 비용은 tree 법의 정직한 비용으로 남는다).

### Fixed — 2026-09-30 사고 14·15 수리의 후속 두 건 (2차 실기의 사고 16)
- 하위 불릿 내용: 사고 14 수리가 「같은 줄 내용」을 요구하자, 내용을 하위 불릿에 둔 정당한 spike 행이 미완으로 읽혔다. spikeComplete를 줄 단위 파서로 — 내용은 같은 줄 또는 **더 깊은 들여쓰기의 다음 줄**, 같은 깊이의 다음 행이 바로 오면 빈 행(조임 유지).
- wip 재발: 늦은 spike 뒤 build는 제품 변경이 없어 측정 파일을 다시 wip로 커밋했고 ship이 같은 두 줄로 반복 실패했다(재spawn 루프). ship이 **spike 파일만 든 wip HEAD를 `docs(spike): <slug> 측정`으로 amend 승격** — 메시지만 바뀌고 tree는 불변이라 이미 기록된 full·redproof·attack 증거가 그대로 유효하고, build 재spawn 자체가 불필요해진다. 검사: spikeComplete 하위 불릿 케이스 + spikeOnlyFiles 단위 테스트.

### Fixed — 2026-10-01 L2 1일차 관찰 여섯 — 순차 seed · 예산 중 seed · 가드 오탐 둘 · conductor 파일 이동 · 메모리 문구
- **unit은 한 번에 하나**: conductor가 seed를 병렬로 열었다(22:47 두 번) — Flow 4는 순차인데 seed·가드가 막지 않았고, 같은 파일 충돌(사고 26)·spawn_stop 귀속 어긋남(6/5·5/6)의 토양이 됐다. 처리량은 미검수 3에 묶여 병렬의 이득은 없었다(순차로 3 unit 29분 뒤 6시간 대기). 수리: `seedGate` — 일하는 unit(출하·dropped 아님, CEO 질문에 걸리지 않음)이 있으면 `ACTIVE … 한 번에 하나`; 예외는 CEO 질문(열린 Q — 질문·needs)에 걸린 unit(Flow 6). 사고 26의 충돌 재개는 질문에 걸린 unit 뒤로 main이 움직이는 경우의 안전망으로 남는다.
- **예산 정지 중엔 seed도 STOP**: 미검수 3인데 seed가 effect-conflict를 열어 6시간 유휴 — seed→ship 시계가 부풀고 base가 낡았다. 수리: seed가 ship과 같은 예산(budgetStatus)을 보고 `STOP <이유>`.
- **가드 오탐 둘**: (1) 원장 경로와 한 줄의 `sed -n`·`2>/dev/null`을 쓰기로 거부해 conductor의 표 산출이 막혔다 — 원장·unit 상태를 **향하는** 쓰기 verb·리다이렉트만 거부(규칙집 읽기 오탐과 같은 수리). (2) heredoc 커밋 메시지의 `<noreply@…>` trailer의 `>`를 리다이렉트로 읽어 다음 줄(Claude-Session:)을 쓰기 대상으로 거부 — 2차 실기 이후 두 번째: heredoc 본문은 데이터(구분자 줄의 나머지는 셸, 따옴표 없는 본문의 `$()`·백틱만 실행으로 남김).
- **conductor 파일 이동 구멍**: 리다이렉트는 worktree 밖이면 거부하면서 `mv`·`rm`·`cp`는 보호 구역에서만 검사해, conductor가 CEO의 try 산출 파일(eoren.sqlite)을 옮겼다 — 명령 자리의 `rm`·`mv`·`cp`·`tee`도 worktree 밖 저장소 파일이면 거부(cp는 목적지만). 덤: 한 명령 안의 `cd <dir> &&`를 상대 경로의 뿌리로 — 훅의 cwd는 명령 전 위치라 팩의 `cd .worktrees/x && rm dist`가 루트의 dist로 읽혔다(리다이렉트 검사에도 같은 한계가 있었다).
- **메모리 문구**: 메모리 파일 쓰기 거부는 그대로(검토 없는 둘째 사본), 이유를 말해 재시도를 멈춘다.
- try 산출 파일의 「복구」는 이 수리에 없다 — 설계(try 사본: 버릴 checkout에서 써본다)는 L2 표 이후 1순위 후보로 백로그에. 검사: seedGate·가드 단위 테스트 + e2e(일하는 unit이 있으면 ACTIVE → drop 뒤 UNIT, 진행 중엔 ACTIVE).

### Fixed — 2026-10-01 코드 충돌 rebase의 막다른 길 (L2 1일차의 사고 26)
- L2 무인 하루 1일차: effect-conflict가 갈라진 뒤 record-layer·agent-read-tools가 main에서 같은 파일(packages/core/src/cli.ts)을 고쳐, ship의 rebase가 텍스트 충돌로 죽었다. ship은 rebase를 버리고 「build 팩을 다시 띄워 main 위에서 해결」이라 했지만 가드가 팩과 conductor 모두의 rebase·merge를 막는다 — build 재spawn은 새 커밋 없이 끝났고 같은 FAIL이 두 번 났다(conductor는 규칙대로 멈춤). L1은 unit이 하나씩 돌아 드러나지 않았고, 병렬 unit이 도는 L2에서 처음 밟혔다. 수리: ship은 코드 충돌이면 rebase를 **그 자리에 멈춰 두고**(원장 `ship_conflict` — 충돌 파일과 멈추기 전 tree) 충돌 파일과 다음 할 일을 말한다; build(scaffold면 boot) 팩은 「main과의 충돌」 절로 파일을 받아 표시를 풀고 `git add`까지만 한다(파일 편집 — 팩의 경계 안, 커밋·rebase 없음); 다시 부른 ship이 남은 충돌을 확인하고 `rebase --continue`로 잇는다(team.json 기계 병합과 같은 내부 WIP 차선). 증거는 멈추기 전 unit의 tree로 보고, 통합 tree는 사고 22 경로(full·redproof·attack 재기록)가 다시 검증한다 — 「ship 두 번」으로 닫힌다. 체크포인트 훅은 rebase가 멈춰 있는 worktree를 커밋하지 않는다. 검사: e2e(같은 파일을 만드는 unit 둘 → 수리 전엔 시험대와 같은 FAIL 줄 재현, 수리 후 충돌 표시·남은 충돌 FAIL·build 팩 절·git add 뒤 SHIPPED, main에 양쪽이 다 있음) + 체크포인트 단위 테스트.

### Fixed — 2026-10-01 팩 상한 FAIL의 실행 불가 안내와 실측 미달 기본값 (4차 실기의 사고 25)
- 4차 시험의 time-model: 사고 24 수리로 re-spec이 RED로 풀린 뒤 build 팩이 `FAIL 팩 17KB > 16KB`로 막혔다(절별 합 21KB — acceptance 12.1KB, RESPEC이 인수 파일을 셋으로 늘렸다). FAIL은 fit이 부대물(diff·hazards·brief·이어받기·try·surface)을 전부 포인터로 줄인 **뒤에만** 나므로 넘는 것은 언제나 법이다 — 옛 안내의 「부대물이면 상한을 올려라」는 그 자리에서 참일 수 없었고, 「unit을 나누라(unit split)」는 명령이 없어 conductor가 따를 길이 없었다(conductor는 규칙대로 멈추고 넘겼다). 수리: `overflowAdvice` — FAIL이 법 초과임을 말하고 conductor 몫이 없음을 밝힌 뒤 CEO 결정 둘을 명령으로 준다(① `pack_kb_max`를 실측 숫자 이상으로 — boot의 4×는 나눠 센다, ② `work.mjs drop` 뒤 `add`로 나누는 방향전환). 기본 `pack_kb_max` 16 → 24(사고 8 선례대로 실측으로 — 이 팩 전문 21KB가 강등 없이 들어간다); 기존 설치는 team.json 한 줄을 CEO가 갱신한다. 이유-차선(CEO 발의, 상한~2×는 이유 선언으로 통과)은 여전히 표 이후 후보 — 이 수리는 장치를 더하지 않는다. 검사: overflowAdvice 단위 테스트 + 기본값 실측 이상 고정.

### Fixed — 2026-10-01 기존 코드 위 re-spec의 redproof 막다른 길 (4차 실기의 사고 24)
- 4차 시험의 time-model: build 뒤에 Q10이 닫혀 RESPEC → spec 재spawn이 수용 테스트를 더했고, spec 팩의 끝(`redproof` → `RED`)에서 `FAIL redproof time-model base_red=true head_green=false`가 났다. redproof는 제품 코드가 있으면 head green을 요구하는데, 기존 코드 위의 re-spec에서 새 주장은 **head에서 red가 정상**이다 — 계약(RED)이 도달 불가였고 FAIL 줄엔 다음 할 일이 없었다. Flow 7 「수정」의 re-spec(aa69608) 이래 잠복했고, 사고 17의 수리가 re-spec을 상시 경로로 만들며 첫 실기에서 밟혔다(17의 e2e가 re-spec 뒤 redproof를 돌리지 않았다). 수리: head red의 뜻은 unit 정체가 가른다(`outcome`) — spec이면 `RED <slug> n/m — 기존 코드 위의 새 주장(re-spec): 다음은 build`(exit 0), 그 밖이면 `FAIL … head에서 red: <파일> → build가 덜 끝났다: … 재spawn`, base green이면 그 파일을 이름 짓는다. 원장엔 어느 쪽이든 head_green:false라 ship의 redproof 조건(head_green === true)은 그대로 닫혀 있다; ship의 통합 tree 재검은 exit가 아니라 `PASS redproof` 줄로만 통과한다(RED의 exit 0이 통합 검사를 새지 않게). 검사: outcome 단위 테스트 + e2e(build 코드 커밋 → RESPEC → re-spec 새 red 주장 → `RED session 2/2 …` → build 정체에서 `FAIL … → build가 덜 끝났다`) — 수리 전엔 시험대와 같은 줄이 재현됐다.

### Fixed — 2026-09-30 닫힌 질문의 답이 spec을 건너뛰었다 (2차 실기의 사고 17)
- ship 8번째 조건은 「이 unit의 질문이 닫혔는가」만 봤다 — index-sqlite의 Q11이 build 뒤에 닫혀 답이 구현되지 않은 채 출하됐고 CEO의 try가 후발견했다(green 후 CEO 발견 결함). 닫힘은 반영이 아니다. 수리(백로그에 등록된 방향 그대로, re-spec 경로 재사용): `decide`가 Q<n>에 기대는(unit의 질문 또는 needs) 진행 중 unit 중 이번 생애에 spec이 **답 없이 이미 돈** 것에 RESPEC을 걸고(`RESPEC <slug>` 출력 · 원장 `respec` 줄), 그 unit은 build·attack 팩과 ship이 spec 팩이 다시 열릴 때까지 거부된다. spec 팩은 「재-spec — 진행 중에 온 답」 절로 그 답을 받고(어긋나는 주장만 고친다 — 끝은 redproof RED), 그 팩이 조립되면 걸림이 풀린다. 첫 spec 전이면 그 팩이 답을 담으므로 걸지 않는다; 가드가 읽는 팩 정체(unit.state)는 바꾸지 않는다 — 돌고 있는 build의 쓰기 경계를 중간에 뒤집지 않기 위해. 검사: respecTargets 단위 테스트 + ship 조건 단위 테스트 + e2e(ask → build → decide → RESPEC → build·attack·ship 거부 → spec 팩에 답 → build 열림).

### Fixed — 2026-09-30 intake의 Q 번호 밀림·needs 수정 명령 부재·attack 집계 정의 (3차 실기의 사고 23)
- intake가 질문 번호를 짐작해(ask 전 add, 또는 계획 번호) 한 칸 밀려 적어 needs가 6 unit에 잘못 걸렸고, BACKLOG를 고칠 명령이 없어 CEO가 결정 전부로 우회했다. e2e 탄생 시험도 같은 꼴(`--needs memo,Q2`를 ask 전에)을 담고 있었다 — 그것이 재현 red. 수리: `add`·`needs`는 DECISIONS에 없는 Q<n>을 거부하고, `ask intake "<질문>" --for <slug,…>`가 받은 번호를 그 unit들의 needs에 스크립트로 잇는다(에이전트가 번호를 옮겨 적지 않는다 — 위치를 무의미하게 만든 사고 9와 같은 처방). 어긋난 선행은 `work.mjs needs <slug> <a,b|Q<n>|->`로 conductor가 고친다: 메인 전용(가드도 팩의 호출을 거부 — 팩이 자기 WAIT를 풀지 않는다), 없는 unit·Q·순환 거부, seed된 unit의 needs 사본 동기화, 원장 `needs` 줄(from·to).
- attack 집계: 원장 attack 줄의 red/total(실행 한 번의 스냅숏, 예 2/3)과 LEDGER 열(선발견→최종 red/총, 예 3→0/3)이 다른 수로 읽혔다. 정의를 `attackCell` 하나로 고정 — 선발견 = 이 unit 생애(unit.created 이후, drop 전 생애 제외)의 attack 실행에서 한 번이라도 red였던 adversary 파일의 합집합, 최종 red = 0(ship 조건), 총 = 마지막 실행의 파일 수. LEDGER 머리 열 이름이 정의를 말한다. 검사: unknownQuestions·setNeeds·attackCell 단위 테스트 + e2e(짐작 번호 거부 → ask --for 연결 → needs 수정·거부 4종·원장 줄) + 가드 단위 테스트.

### Fixed — 2026-09-30 rebase 뒤 증거의 반쪽 재기록 (3차 실기의 사고 22)
- ship의 rebase가 tree를 바꾸면 통합 full만 새 tree에 재기록됐다 — 롤백이 rebase된 worktree를 남기면 다음 ship이 「redproof·attack이 이전 tree」로 막히는 핑퐁이 되고(main이 또 움직이면 반복), 더 나쁘게는 **새 base 위에서 생긴 공격 회귀가 머지 전 검사를 빠져나갈 수 있었다**. 수리: tree 변경 시 ship이 redproof·attack도 스스로 재실행·재기록하고, 통합 tree의 attack red>0·redproof 실패는 머지 전에 FAIL — 「ship 한 번」이 main 이동과 무관하게 참이 된다. 검사: e2e(증거 기록 뒤 main 커밋 삽입 → ship 한 번에 SHIPPED).

### Fixed — 2026-09-30 의존성 출하의 닭·달걀 (3차 실기의 사고 21)
- 의존성을 새로 들이는 unit은 머지 뒤 main quick이 설치 없이는 반드시 red인데, 설치는 머지 전엔 불가능하다(새 매니페스트가 main에 없다) — R9 원자성이 매번 머지를 되돌리고, FAIL 안내는 「build 재spawn」이라는 오진까지 했다. 수리: `commands.setup`(의존성 설치 명령 — boot 팩이 등록, `work.mjs commands setup="npm ci"`) + **ship이 매니페스트 변경 출하의 머지 직후 main에서 setup을 실행**한 뒤 quick을 검사(설치 실패도 롤백·이유 출력). 롤백 문구는 의존성 출하일 때 setup 등록·수리를 안내한다. 검사: boot e2e(.setup-ran 마커 — setup이 main quick 전에 돈다).

### Fixed — 2026-09-30 spike 산출물의 커밋 막다른 길 (3차 실기의 사고 20)
- 사고 15(체크포인트의 spike 제외)가 spike 측정 파일의 합법적 커밋 경로를 전부 닫았다: 훅은 건너뛰고, spike 팩은 커밋 금지, conductor의 대리 커밋은 가드("spike는 커밋하지 않는다")가 막는다 — 늦은 boundary HIT 뒤 ship이 「작업 트리가 깨끗하지 않다 + full·redproof·attack 낡음」의 막다른 길. 사고 16(wip 승격)은 이미 커밋된 경우만 구제하는 반쪽이었다. 수리: **spike 파일만 더러운 worktree는 ship이 `docs(spike): <slug> 측정`으로 스스로 커밋**(내부 WIP 차선) — 이후 낡은 증거는 FAIL 문구의 재실행 명령 3개(full·redproof·attack)가 안내하고, 그 tree에서 ship이 닫힌다. 늦은 spike의 재검증 비용은 tree 법의 정직한 비용으로 유지.

### Fixed — 2026-09-30 workTree의 모드 비트 유령 불일치와 설치기 fail-open (사고 19)
- win32 원격 검증의 「인덱스 ≠ 작업 트리」 확정 원인: workTree()가 임시 인덱스를 `read-tree HEAD`로 시작해, filemode=false(NTFS)에선 HEAD에 없는 chmod 파일(설치기가 실제 인덱스에 기록한 `.githooks/pre-commit` 755)이 임시엔 644로 들어갔다 — 내용 diff 0(unstaged 비어 있음)인데 tree만 달라 게이트가 거부. 수리: 임시 인덱스를 **실제 인덱스 복사본**으로 씨앗해 모드 기록을 물려받는다. 검사: `core.filemode=false` 강제 + chmod 재현 unit 테스트(리눅스에서 win32 재현).
- 덤으로 드러난 독립 구멍: install(sh·ps1)이 첫 커밋 실패를 경고로 삼키고 설치 성공을 선언했다(fail-open). 첫 커밋 실패 = 설치 FAIL(exit 1), git 출력이 이유로 남는다. (직전의 autocrlf 고정·진단 첨부는 원인은 아니었지만 각각 결정론 강화·자기 진단으로 유효해 유지.)

### Fixed — 2026-09-30 게이트의 tree 동일성 vs 사용자 전역 개행 설정 (사고 18 계속)
- win32 원격 클론 e2e에서 quick PASS 뒤 커밋이 「인덱스 ≠ 작업 트리」로 거부됐다(메인 저장소·비-WIP 커밋에서만). 게이트의 법은 tree 바이트 동일성인데, 프로젝트가 사용자 전역 `core.autocrlf`(Git for Windows 기본 true)의 개행 변환에 노출돼 유령 diff가 가능했다. 수리: install(sh·ps1)이 저장소-로컬 `core.autocrlf false`를 고정 — 개행은 쓰인 바이트 그대로가 정본. e2e 실패 메시지에 status·unstaged·autocrlf 출처를 첨부해 재발 시 원인이 바로 보인다.

### Fixed — 2026-09-30 테스트 스위트의 win32 이식성 (사고 18 — 3차 준비의 원격 클론 검증이 잡음)
- 원격 fresh 클론에서 `node --test`가 win32 최초 실행에서 6건 거짓 실패했다(원격 내용 결함 아님): e2e가 `bash`를 PATH에서만 찾아 spawn null(4건), e2e의 `URL.pathname`이 win32에서 `/C:/…`를 내놓아 경로 오염 가능, `depDirs`가 역슬래시 반환(기능 정상·테스트 실패), BOM 테스트가 저장소 폴더 이름을 'GARAGISTE'로 가정(fresh 클론·scratch worktree에서 거짓 실패 — 구 'v2check' 사건과 동일 결함). 수리: Git for Windows bash 탐색 + 정말 없으면 이유를 말하는 명시 SKIP, `fileURLToPath`, depDirs 구분자 정규화(listFiles와 동일), 폴더 이름 대신 경로 비교. Windows가 1급 대상인 이상 스위트도 크로스 플랫폼이 법이다.

### Removed from the install path
- 계획·비평·리뷰 라운드, per-step verifier, self-check, 메모리 파일, STATUS-team·METRICS 12열, hotfix·kickoff·brainstorm·retro 스킬, 문서 예산 훅, opencode 패리티. 근거: docs/catalogue/V1-ANALYSIS.md.

## v1 — Unreleased (역할극 트리, 유지 보수 없음)

### Breaking for running projects
- **Two more document budgets** (both flavors): `docs/memory/*.md` 16 KB each and `docs/DEBT.md` 300 lines — a write that would leave one over is refused. The planner and reviewer read their memory files whole at every spawn, and the test projects' files had grown to 27–46 KB (60 lines of 400–750 bytes: the line rule was gamed by long lines); AX_PLATFORM's DEBT stood at 315 lines. Before upgrading: the planner archives resolved DEBT lines (the `backlog` skill's Archive rule now covers DEBT), and each memory owner consolidates its file under 16 KB — one pattern per line with a `×n` count — moving retired lines to `docs/archive/memory-<role>-<year>.md` (the reviewer may write that file too).

### Added
- The deny log (`.garagiste/session/denies.jsonl`) records the rule that fired and the command or path it refused (`rule`, `what`) instead of the prose reason, whose boilerplate alone exceeded the 200-character cut and hid the command — the next retro can see what was refused, not only how often.
- The verifier may use output and check-only words between commands — `echo`, `printf`, `test`, `[`, `true`, `false`, `set`, `pwd`, `date` — as long as nothing is redirected into a file, substituted or expanded from a secret-looking variable (the two test projects logged 28 refusals of `echo` banners around listed commands, each one a re-run). The lead may `gh label list` and `gh label create` (the risk labels /ship attaches); read-only roles may list labels. Both flavors.
- Two more columns on the METRICS line, written by /ship from the next ship on: `majors per 100 logic lines` (review blockers ÷ logic diff lines × 100) and `plan-budget refusals` (deny-log lines with rule `doc-budget` on a docs/plans path since the approval commit). /retro reads both: a rising density means the self-check and the reviewer memory are not biting; refusals above one per plan mean the plan budget binds.
- `--uninstall` / `-Uninstall` on every installer (both flavors, sh and ps1, a project or `--global`): removes what the installer put there — the team's agents, skills, hooks and scripts (opencode: agents, commands, skills, plugins, scripts) and the entries it merged into settings.json / opencode.json — after backing each path up; your own files and settings, docs/ and .gitignore stay, and what is left in the team's folders is listed. `--dry-run` previews it.

### Fixed
- `install.sh` (both flavors) looks for Python 3 as `python3` or `python` before touching anything and stops with one line when neither runs — Windows Git Bash usually has `python` only, or a Microsoft Store stub named `python3`, so the script died at the settings merge after copying the files: hooks and skills new, settings entries old.
- The three `install.sh` (root, claude, opencode) carry the executable bit — they were mode 644 since the first release, so `./install.sh <flavor>` and the root script's `exec` of a flavor script failed with `Permission denied` on macOS and Linux unless run through `bash`.
- **Hook entries name their scripts by `${CLAUDE_PROJECT_DIR}`**, and every hook takes the project root from that variable (falling back to the event's cwd). The relative `node .claude/hooks/x.mjs` failed on a Windows PC with `Cannot find module` — exit 1, which Claude Code treats as a non-blocking hook error, so the session ran with no guardrail, no board injection and no logs at all. The installer now replaces an older GARAGISTE hook entry (any path form) instead of keeping it next to the new one; the uninstall and the double-install warning read both forms. Re-run the installer on a running project; a hand-maintained settings.json needs the five commands changed.
- The spawn count is the `start` lines of `.garagiste/session/spawns.jsonl` (one per Agent call), and `spawn-log.mjs` no longer writes a stop line for a SubagentStop event that names no agent type or names the session's main agent: LACUNA logged 1,024 such stops next to 100 real spawns, so its METRICS carried spawns of 340, 256 and 865 for plans that spawned about 30 subagents each.
- The installer carries `worktree.baseRef: head` into the project's settings.json (both sh and ps1; kept when the project already sets `worktree`). The merge only copied `agent`, `permissions` and `hooks`, so no project ever had it: with Claude Code's default `fresh`, a /parallel builder branches from the remote default branch instead of the session HEAD, and the uninstall removes it again. Verified in the installer test runs.

### Changed
- **Three more retro triggers** at the iteration end: a major density of 0.5 or more per 100 logic lines on two plans, plan-budget refusals above one on a plan, and a pattern recorded against two plans (a `×n` count that rose in the reviewer's memory, or the board's Notes' retro-material line, which the mini retro takes as its subject). LACUNA's board carried three defect patterns repeated across two plans as "retro material, no trigger met" — the reviewer had written them to memory and nothing acted on them.
- **The unattended cap takes an hours term** — `unattended cap: <n> plans | <m> sections | <h> h` (default `8 plans | 2 sections | 12 h`): the iteration also ends at the first ship after <h> hours since its start commit, so the review is waiting when the CEO is back instead of the team waiting for the CEO — both test projects idled nine to ten hours overnight between a review and the next 계속. A profile line without the term keeps counting plans and sections only; /hire sets the hours from the CEO's rhythm (overnight ≈ 12 h, a workday ≈ 8 h).
- **The verifier's turn cap is 40** (was 20; `steps` in opencode) and it runs a rules-file command line as written — a chain is one call. At the cap Claude Code returns the report as partial; the test projects' lead had to split full verification into two or three calls to stay under it.
- **/ship merges with a merge commit, never a squash** (both flavors, hotfix too): the plan and board commits the lead makes on local main are ancestors of the plan branch, so a merge commit lets local main fast-forward after every ship — a squash rewrote them and both test projects had to rebase or switch merge methods by hand. The PR description is saved to docs/prs/NNNN-<slug>.md at every ship and passed with `--body-file` (a long `--body` with `$(…)`, `->` or a word like credentials tripped the lead's shell guard), and the lead creates the two risk labels once when the repository lacks them (`gh label create`; before, `gh pr create --label` failed and both projects put the label in the title).
- **The plan budget is 16 KB** (was 12 KB; both flavors). In the two test projects every plan written after the budget landed sat within 300 bytes of 12 KB and one iteration logged 22 refusals of plan writes — each one a planner rewriting the file to fit. The other budgets are unchanged; the plan-budget refusal count is now a METRICS column, so a binding budget shows up at the next retro.
- Upgrade order for a running project, step (2): an older *global* install is removed with `./install.sh <flavor> -Global -Uninstall` before the project is re-installed — Claude Code loads a same-named skill from `~/.claude/skills` in preference to the project's, and a guardrails hook registered in both `~/.claude/settings.json` and the project's runs twice with the older one deciding.

### Removed
- **The global install** (`--global` / `-Global`, both flavors): the team lives in the repository — `.claude/` (opencode: `.opencode/` and `opencode.json`) is committed with the project, so every checkout and collaborator runs the same release and nothing under the user's home can shadow it. `-Global` is accepted only together with `-Uninstall`, which removes an older global install; the installers' absolute-path rewriting of skills and commands went with it. `session-start.mjs` now also warns when a same-named skill, agent or hook of this project is still under `~/.claude`, and points at `-Global -Uninstall`.

## 2026-09-26

### Breaking for running projects
- **Document budgets are enforced by the guardrail** (both flavors): docs/STATUS.md 1,800 characters and 200 per line (as before), docs/STATUS-team.md 40 lines, docs/CHARTER.md 60 lines, the rules file (CLAUDE.md / AGENTS.md) 8 KB, a plan (docs/plans/*.md) 12 KB — a write that would leave a file over its budget is refused, whoever writes it. Before upgrading: split an over-long CEO page into the two board files, move the rules file's architecture map to docs/ARCHITECTURE.md and its history to docs/, archive settled BACKLOG and DECISIONS lines (the `backlog` skill's Archive rule).
- **The iteration runs to an unattended cap, not to 2–4 plans**: the operating profile's `iteration cap` line becomes `unattended cap: <n> plans | <m> sections` (default `8 plans | 2 sections`) — run `/hire` once (or `set-profile.mjs`) to rewrite the line. A new screen, a first run or a decision taken by default is a checkpoint on the CEO's page, never a stop; only the four escalation items stop a plan, and the lead parks that plan and takes the next independent item.
- **The board's Iteration block has two new lines** (`cap:` on the Plans line, `Tried (last review):`) and the METRICS line three new columns (`spawns · denies`, `acceptance`) — the lead writes them from the next ship on; older lines are left as they are.
- **The iteration review ends with a question the CEO answers in one line** — `써봤다 · <result>` or `안 써봤다` — recorded in METRICS; two reviews in a row `not tried` are said out loud before the next plan.
- **A new hook, `spawn-log.mjs`, and two new settings entries** (PreToolUse matcher `Agent`, `SubagentStop`): the installer adds them; a hand-maintained settings.json needs the two entries.
- **Upgrade order for a running project.** (1) Close its sessions. (2) If the user's `~/.claude` also carries a guardrails hook, remove those hook entries from `~/.claude/settings.json` or upgrade the global install too — an older global hook refuses the new board file and the run stalls at the first board write. (3) Re-run the installer for the project: it overwrites the agent files, so the `/hire` model and effort lines are lost — re-run `/hire` (the previous lines are in the `chore(hire)` commit). (4) In the first session, tell the lead the template was upgraded: the planner archives the old CEO page under docs/archive/, the lead writes the two board files under their budgets, the planner moves the rules file's map and history out (rules stay), and `/ship` adds the METRICS columns from the next line on. Whole-file writes pass the budgets; partial edits of an over-budget file are refused.

### Added
- `GARAGISTE_VERSION` in `guardrails.mjs`, `session-start.mjs`, `spawn-log.mjs` and `guardrails.ts`; `session-start.mjs` warns when the user's `~/.claude` and the project's `.claude` both register a guardrails hook (every tool call runs both and the older one decides), naming each install's release.
- Deny log: every guardrail refusal appends one line to `.garagiste/session/denies.jsonl` (git-ignored); spawn log: `spawn-log.mjs` appends a line per subagent start and end to `.garagiste/session/spawns.jsonl`. `/ship` copies both counts into the METRICS line — the cost signal `/retro` and `/hire` read.
- `set-language.mjs --settings <file>` writes Claude Code's `language` key next to the rules file's "## Language" section (`/lang`, `/kickoff`, `/brainstorm` and `/assess` pass it); `session-start.mjs` writes its tail in the team's language (Korean strings for `ko`, English plus one line naming the code otherwise) so the last thing before the CEO's first word is in the right language.
- The runtime smoke: plan 0001's last step starts the real entry point from the build/run line and asserts one round trip; the Definition of Done keeps it green; a UI plan names one `shows:` line captured from the running product, not a catalog.
- The environment probe in plan 0001's scaffold step (OS, shell, line endings, runtime versions, security software → docs/ENVIRONMENT.md).
- The implementer reads `docs/memory/team-reviewer.md` and the lens checklist before coding and reports a `Self-check:` line; a review fix round is one commit; a minor finding is never fixed in the round; round 1 with more than 10 majors is a retro trigger; `/build` takes the step size from git and refuses a step over 2× the target.
- The mini retro applies a one-line countermeasure (a rule line, a memory line, a path glob) at once and lists it under Decided by default; only skill, agent and hook changes wait for the CEO's number.
- The headless rule in `deliver`: nobody may be watching, so a question mid-run is never asked — defaults are taken and logged, a hard stop is parked, the board carries the question.
- A permissive, offline, audit-clean runtime dependency no longer asks the CEO (decision log only); `rg` joins the verifier's output-trimming allow-list.

### Changed
- `hook-check.mjs`: cases for every budget (both flavors) and for `rg`.
- README, GUIDE and the workflow map describe the unattended cap instead of "2–4 plans per session".
