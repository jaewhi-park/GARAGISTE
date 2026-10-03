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

### Added — 2026-10-03 FAIL·가드 거부가 원장에 남고, 되풀이되면 STATUS 「막힌 것」 (측정 빈틈 — L1 4차·L2 관찰 · CEO 「하나씩 수정」)
- 모든 스크립트의 `FAIL …` 줄은 원장 `fail` 줄(스크립트·첫 줄)로, Claude 훅·opencode 플러그인의 거부는 `guard` 줄(도구·대상·이유)로 남는다 — 최선 노력(원장이 없으면 조용히). FAIL 대기의 시작점을 이웃 ts로 추정하던 측정 빈틈이 닫힌다.
- `state.mjs`: 마지막 CEO 접점 뒤 같은 FAIL 줄이 두 번 이상이면(「안내대로 해도 같은 FAIL」의 기계 쪽 정의) STATUS 첫 줄에 「반복 FAIL n」, 「막힌 것」 절에 그 줄·횟수·가드 거부 수 — 정비 채널이 읽는 자리. 원격 전달은 두지 않았다(네트워크 0 — CEO 결정). 규칙집 경로의 장치라 HAZARDS 줄은 없다(팩에 닿지 않는다 — 기록은 여기).
- 검사: unit(repeatedFails · firstLine) · e2e(같은 FAIL 두 번 → 원장·STATUS · 훅 거부 → 원장 guard 줄).

### Added — 2026-10-03 state.mjs report — SCOPE DONE의 출하 보고 한 장 (CEO 「결과물 가져오는 그림」 — 「하나씩 수정」)
- `node .garagiste/scripts/state.mjs report`(범위가 끝나면 next가 낸다 — 이음새 공격 뒤): `docs/REPORT.md` 한 장 — 만든 것(원문 그대로·출하일·공격 선발견·써봤는가) · 기계가 증명한 것(LEDGER 행) · 팀이 정한 것 · 못 본 것(사람 센서 대기·결정 대기) · 써볼 것(마일스톤 끝의 try 카드) · 이음새 공격. 생성물이라 손편집 없음, 스크립트가 pathspec 커밋한다(models·commands와 같은 차선). 범위(order)마다 한 장 — -fix로 범위가 자라면 다시(scope.json `report_for` · 이음새 공격도 `system_for`).
- team.json paths.report · ship의 문서 목록에 REPORT · README.
- 검사: unit(reportText · next의 범위 끝 순서) · e2e(system-attack 시험의 끝: 보고 → 커밋 → done) · HAZARDS 한 줄.

### Changed — 2026-10-03 미검수 상한은 사람 센서가 필요한 unit만 센다 — 기계가 증명한 출하물은 마일스톤 끝에 써본다 (L2 1판 1일차 무인 376분 중 작업 ≈29분 · 거의 모든 라운드의 멈춤이 미검수 3 — CEO 「하나씩 수정」)
- `state.mjs budgetStatus`: 미검수 = 출하 뒤 안 써본 unit 중 사람 센서가 필요한 것 — `@sensor human` 주장이 있거나 공격 선발견이 0인 unit. 기계가 증명한 unit(인수 전부 machine · 공격 선발견 ≥ 1)과 scaffold·system은 세지 않고 STATUS 「써볼 것」에 「기계 증명 — 마일스톤 끝에」로 표시된다. next의 SCOPE DONE 줄이 써볼 unit을 나열한다. 무인 출하 5·팀 자발 2 상한은 그대로(back-pressure).
- `team.json budgets.unseen_machine_exempt: false`면 옛 규칙(전부 센다). PRINCIPLES의 「미검수 3」 문장을 맞췄다.
- 검사: unit(budgetStatus · humanNeeded) · e2e(탄생 시험: hello는 선발견 1이라 안 본 것 0/3, 카드엔 표시) · HAZARDS 한 줄.

### Changed — 2026-10-03 환경의 긴 꼬리를 boot에서 선불 — 생태계별 검증된 꼴 · attack이 놓친 계급은 HAZARDS 줄로 (CEO 「하나씩 수정」)
- boot 팩 4에 「생태계별 검증된 꼴」: 공통(`.gitattributes` `* text=auto eol=lf` — L2 2판 윈도우 CRLF ×4 · 산출물 .gitignore — 사고 29·38 · setup — 34) · Node(glob 러너·`{files}`·npm install) · Python(discover는 하이픈 이름을 0건 실행 — 사고 44·57, importlib 하네스) · Go(한 디렉터리 한 패키지 — 53·56, -count=1 — 54). 가드가 boot의 `.gitattributes` 쓰기를 연다.
- HAZARDS 두 줄: boot의 첫 선택이 낳은 사고들(경로 .gitattributes·.gitignore·tests/harness·매니페스트) · attack이 두 판 연속 놓친 계급(`**` — 없는 날짜·공백만인 제목·CSV 수식: 모든 attack 팩에 떠 attack 팩 4가 테스트로 남긴다).
- 검사: unit(팩 본문 · 가드 · HAZARDS 줄).

### Added — 2026-10-03 system-attack — 범위가 끝나면 이음새 공격 한 바퀴 (백로그 「system-attack 팩」 · 방아쇠: green 후 CEO 발견 결함이 0이 아니었다 — 벤치 파이썬 날짜 ×2 · todo 4일차 · 홀드아웃 library loan-limit — CEO 「하나씩 수정」)
- `work.mjs system`: 출하된 unit이 둘 이상인 범위가 끝나면(next가 낸다) kind `system` unit을 연다 — spec·spike 없이 attack부터. attack 팩은 diff 대신 출하된 unit 전체의 surface·try·실행 명령을 받고(「시스템 공격」 절 · HAZARDS는 제품 파일 전부로 매칭), 발견은 `tests/adversary/system-<n>-*`의 red 테스트. red가 있으면 build가 고치고 ship(LEDGER의 red 증명 자리는 `system`, 선발견→0/총), 발견 0이면 `drop --forget`(초록 테스트는 산출물이 아니다 — ship도 거부). 한 범위에 한 바퀴(scope.json `system`). `team.json system_attack: false`로 끈다.
- 검사: unit(nextStep · evaluateShip) · e2e(둘 출하 → system-1 발견 1 → build → ship · system-2 발견 0 → drop) · HAZARDS 한 줄.

### Added — 2026-10-03 next.mjs — Flow 4~7의 다음 한 걸음을 스크립트가 낸다 (L2 2판 윈도우 28·20바퀴 · 3판 규율 이탈 — CEO 「하나씩 수정」)
- `node .garagiste/scripts/next.mjs`: unit 상태·원장·worktree에서 다음 한 줄 — `NEXT run <명령>` · `NEXT spawn <팩> <slug> <PACK 경로>` · `NEXT ceo|wait|done`. 순서(seed → spec → redproof → build → attack → verify attack → ship), RESPEC은 spec 먼저, 늦은 spike 뒤엔 ship, 충돌은 build가 풀고 ship이 잇는다, 한 번에 하나(먼저 연 unit), 질문에 걸린 unit은 자리를 막지 않는다, 예산 정지·SCOPE DONE은 CEO에게. 팩은 조립(원장 pack) → 띄움(spawned 또는 훅의 spawn_stop) → 증거(redproof·attack 줄이 팩 뒤에 있는가)로 센다.
- CLAUDE.md·AGENTS.md 템플릿 Flow 4가 next 한 줄로 줄었다 — 규율 이탈이 났던 산문 빈칸(바퀴 수·대리 답·재개)이 코드로. settings 허용 목록·doctor SCRIPTS·README에 next.
- 검사: unit(nextStep의 분기) · e2e(탄생 시험의 매 걸음에서 next가 그 걸음을 말한다) · HAZARDS 한 줄.

### Changed — 2026-10-03 질문은 기본값으로 — 저장 안쪽 꼴은 default, 확인형 질문의 「예」는 RESPEC이 아니다 (L2 3판 리눅스 2·3라운드 측정 (e) — CEO 「하나씩 수정」)
- spec 팩 4: 이미 결정된 저장(파일·DB) 안쪽의 꼴(키·필드)은 `work.mjs default`로 정하고 계속한다 — ask는 되돌리기 어려운 것(새 저장소·외부 서비스·돈·삭제·유출·설치 형태)과 원문·결정의 충돌뿐. intake 팩 5: 저장은 저장소 하나에 질문 하나, 팀의 제안을 질문에 담는다.
- `work.mjs ask <slug> "<질문>" --assumed "<지금 주장이 가정한 것>"`: 질문 줄에 가정이 보이고(「지금은 …, 예 = 그대로」), `decide`의 맨 「예」(예·네·yes·ok·그대로…)는 원장 `kept` 줄만 남기고 RESPEC을 걸지 않는다(KEPT). 가정 없는 「예」와 가정과 다른 답은 사고 17대로 RESPEC. 근거: 3판 2·3라운드의 Q6~Q9·Q11이 전부 「예」, RESPEC 뒤 spec은 「고칠 주장 없음」 — 라운드당 출하 1.
- 4판 동결(team/ = ede9930) 뒤의 흐름 변경이다 — 머지는 4판 표 뒤 또는 5판 재등록으로. 검사: unit(keepsAssumption · 팩 본문) · e2e.

### Added — 2026-10-02 팩 상한 이유-차선 (측정 H3 — CEO 채용)
- 팩 상한 FAIL의 CEO 결정은 측정마다 ①(상한을 올린다)뿐이었다 — 기본 상한 8→16(사고 8)→24(사고 25)→32(벤치), 벤치 웹 24→25→29→31, 홀드아웃 library 32→34→35→49. ②(unit 나누기)를 고른 기록은 없다. 넘는 것은 대개 build 팩의 공격 절이다 — attack이 결함을 찾을수록 자란다(library loan-return 27KB). L2에서 이 FAIL은 그날을 멈췄다(library 2·5일차 — 사고 59 뒤로는 그 unit만).
- 장치: 커밋 게이트의 LARGE_STEP과 같은 모양. 상한~2배는 conductor가 이유 한 줄과 함께 같은 명령을 다시 — `brief.mjs <팩> <slug> --large "<이유>"` → 팩이 지어지고 원장 pack 줄에 `large`·`cap_kb`, PACK 줄에 이유. 2배를 넘으면 벽 — 지금의 CEO 결정 둘과 `--hold`(사고 59) 그대로. 이유는 스크립트가 판단하지 않는다(기록만). 상한 안에서 준 `--large`는 원장에 남기지 않는다. 하루 표(`tests/field/day.mjs`)가 차선으로 지나간 팩을 센다(크기·상한·이유).
- 검사: 단위(경계 32/32+1/64/64+1KB · library의 34·35·48·49KB는 모두 차선 · 안내에 CEO 결정·--hold 없음 · 같은 명령을 따옴표째) + e2e(인수 36KB → 이유 FAIL → `--large`로 PACK·원장 large · 70KB는 이유가 있어도 벽 · 이유 없는 `--large`는 FAIL · 상한 안의 `--large`는 기록 없음) + 하루 표. 옛 판에서 셋 다 red.

### Fixed — 2026-10-02 rebase 도중의 사본에서 redproof가 거짓 「base에서 green」을 냈다 (홀드아웃 library 6일차의 사고 58)
- 홀드아웃 첫 측정(L2 측정 9be0e15)이 6일차에 멈췄다: loan-return ship이 main과 충돌(원장 `ship_conflict`) → 안내대로 재spawn된 build가 충돌 표시를 풀고 `git add`까지 한 뒤(잇는 것은 ship — 사고 26) 공격 테스트가 main의 5권 제한과 어긋난다는 `spec:` 반려를 남겼다 → 그 자리(rebase 도중)에서 spec 팩과 redproof가 돌았다. rebase 도중의 HEAD는 onto(main)라 merge-base = HEAD — redproof는 「제품 코드가 아직 없다」 갈래로 스테이징된 고친 코드에서 인수를 돌려 green → `FAIL redproof loan-return: base에서 green … 이미 충족으로 닫는다 → drop`. 안내 둘(drop · re-spec)은 원인에 닿지 않고 drop은 출하 직전의 일(790ac06)을 버린다 — conductor가 그렇게 진단하고 멈췄다(사고 57과 같은 꼴).
- 수리: rebase 도중의 길은 둘뿐이다 — 표시가 남았으면 build(표시를 풀고 git add), 다 풀렸으면 ship(잇고 통합 tree를 다시 검증). redproof는 rebase 도중이면 비교하지 않고 그 둘 중 하나를 말한다(`lib.rebaseAdvice`). 팩 조립(brief.mjs)은 풀 표시가 남았으면 짓고(conflict 절 — 사고 26·42의 길 그대로), 다 풀렸으면 「ship이 먼저」 FAIL — 반려도 ship이 잇은 뒤 그 출력이 다시 낸다.
- 재현: e2e 사고 26 시나리오에 — 표시가 남은 자리의 redproof · 다 푼 자리의 redproof · `spec --return` · build가 각각 rebase FAIL이고 원장에 거짓 base green·반려가 남지 않는다(옛 판: 거짓 base green · PACK).

### Fixed — 2026-10-02 CEO 결정만 요구하는 FAIL이 열린 Q가 되지 않아 다른 unit까지 막았다 (홀드아웃 library 3·4·5일차의 사고 59)
- 3일차: 두 번째 spec 반려 FAIL은 「hard 질문 — 그 unit만 멈춘다」라 했지만 열린 Q가 생기지 않아 seed가 그 unit을 일하는 중(ACTIVE)으로 보고 다음 unit을 열지 않았다 — 하루가 한 출하. 4일차 conductor는 같은 꼴 둘을 스스로 `work.mjs ask`로 올려 다른 unit으로 넘어갔지만(3출하) 팩 상한 질문(Q6)의 답이 re-spec을 걸어 5일차에 loan-return이 spec부터 다시 돌았다. 2·5일차는 팩 상한 FAIL(「conductor가 할 일은 없다」)로 그날이 멈췄다.
- 수리: CEO 결정만 요구하는 FAIL 다섯(두 번째 spec 반려 · 팩 상한 · 이미 충족 · 부분 충족 · 눈먼 test_file)의 안내 끝에 그 unit만 세우는 명령 `work.mjs ask <slug> "<요지>" --hold`(`lib.holdAsk`). `--hold`는 그 unit을 세우되(seed가 다른 unit을 연다) 답이 와도 re-spec하지 않는다 — 답의 길은 그 FAIL의 안내가 정한다. L2 지시서의 아침 규칙에 「그 줄을 주는 FAIL은 hard 질문(그 unit만)」.
- 재현: 단위(안내 다섯 · seedGate의 hold · respecTargets가 hold를 세지 않음) + e2e 탄생 시험(두 번째 반려의 안내 · `ask --hold` → seed가 그 unit을 비켜 감 · decide에 RESPEC 없음 · 답 뒤 다시 ACTIVE).
- 사고 58·59 수리로 holdout-library는 소진 — 회귀 필드(필드 4)가 된다.

### Changed — 2026-10-02 attack은 spec 뒤 한 바퀴 (L2 2판 윈도우의 진동 — 백로그 1순위, CEO 결정)
- 윈도우 1일차: conductor가 고칠 때마다 attack 팩을 새로 띄워 add 28·add-due-tag 20바퀴 — 바퀴마다 고침이 만든 반대 결함을 짚어 같은 몫에 토큰 16배(3,222K 대 198K). 같은 conductor가 2·3일차 6 unit은 1바퀴로 돌았다(벤치 attack unit 14개도 1바퀴, 모두 green 후 CEO 발견 결함 0) — Flow 4의 「verify attack이 red>0이면 build 다시」가 고친 뒤 attack 팩을 새로 띄울지를 말하지 않았다. 빈칸을 코드로: `brief.mjs attack`은 마지막 spec 팩 뒤에 attack 팩과 그 뒤의 verify attack이 있으면 FAIL(고친 뒤엔 `verify.mjs attack` → red 0이면 ship · 남으면 build). 끊긴 attack(verify 전)은 다시 띄울 수 있고, re-spec(spec 팩) 뒤엔 새 바퀴, CEO의 `--revise`는 예외. 2바퀴째에 CEO 질문은 두지 않는다(정비 채널 권고 — CEO가 판단할 근거가 없는 질문이고, 둘째 그물은 CEO의 try와 tried fail → -fix다; 「green 후 CEO 발견 결함」이 0이 아니게 되면 system-attack 후보). Flow 4(두 규칙 파일 템플릿) · attack 팩 머리 한 문장. 검사: unit(attackRoundUsed — attack 전 · 끊긴 attack · 쓴 바퀴 · re-spec · 다른 unit · drop 전 생애) + e2e(탄생 시험: attack → build 재spawn 뒤 두 번째 attack 팩은 FAIL과 다음 명령).

### Fixed — 2026-10-02 test_file이 파일을 0건 실행하고 exit 0이면 「이미 충족」으로 읽혔다 (벤치 070f185 파이썬의 사고 57)
- 측정 모드 벤치(070f185)의 파이썬 필드가 boot 다음 첫 unit(add-entry)의 redproof에서 멈췄다: `FAIL redproof add-entry: base에서 green … 이미 충족으로 닫는다 → drop … --forget`. boot의 test_file `python3 tests/harness/run.py {files}`는 파일 인자를 `unittest discover(pattern=<파일 이름>)`로 찾아 하이픈 이름(`add-entry_cli.py` — 모듈 이름이 될 수 없다)을 0건 실행·exit 0으로 넘겼고(직접 실행하면 4건 FAIL), redproof는 exit만 보고 이미 충족으로 읽었다 — 안내 둘(drop · re-spec)은 원인에 닿지 않아 conductor가 멈췄다. 같은 하네스면 공격 파일(`<slug>-<n>`)과 사고 44의 full도 0건 green이 된다. 46a53ca 결함 후보 4(0건 exit 1 → 거짓 base_red)와 같은 뿌리: 프레임워크는 test_file이 받은 파일을 실제로 돌리는지 몰랐다. 앞 회차들은 boot가 파일을 직접 실행하는 하네스를 골라 드러나지 않았다.
- 수리: 탐침 — 같은 자리·같은 이름에 깨진 파일(어느 언어로도 문법 오류)을 두고 같은 test_file을 돌려 그래도 exit 0이면 그 명령은 그 파일을 돌리지 않는다(버릴 checkout에서만 — `withScratch`, 작업 트리는 건드리지 않는다). (1) scaffold의 ship: 비어 있던 redproof 자리가 러너 자신의 red 증명이다 — boot의 tests/unit 파일 이름에 slug 꼴 머리(`garagiste-probe-`)를 붙인 탐침을 인수·공격 자리에서 돌려 exit 0이면 FAIL(8조건 그대로), 원장 `runner_blind`, boot 팩이 그 목록을 받는다 (2) redproof의 base green: 눈먼 파일이면 「이미 충족」 대신 그 진단과 CEO의 길(이 unit을 drop — 줄은 남는다 → 하네스를 고치는 scaffold unit add · needs · scope → seed)을 주고 원장 redproof에 `blind` (3) boot 팩의 test_file 규칙: 「받은 경로의 파일을 이름과 무관하게 그대로 — 하이픈도」. 검사: unit(blindFiles — discover 꼴은 눈멂·직접 실행은 아님·흔적 없음 · probeNames · scaffold 조건 · blindAdvice) + e2e(벤치 꼴 하네스에서 redproof가 눈먼 명령을 말한다 — 제품 코드 전·후 둘 다 → 안내대로 scaffold unit → 하네스를 안 고치면 ship FAIL·boot 팩에 목록 → 고치면 SHIPPED → 원래 unit이 새로 열려 진짜 RED).

### Changed — 2026-10-02 팩 상한 기본값 24 → 32KB (벤치 실측)
- build 팩 상한 FAIL(CEO 결정 ①)이 벤치마다 CEO에게 갔다: 070f185 웹 memo-delete·Go unreadable-symlink 둘 다 28KB(24→29 · 24→28), cfbcf3a 웹은 24→25→29→31의 사슬, 46a53ca 웹 28KB(24→29). 상한은 실측으로 정한다(사고 8의 16 · 사고 20의 24) — 실측 최대 31 위로 32. 설치된 프로젝트의 team.json은 그대로다(재설치도 보존) — 올리려면 CEO 커밋 한 줄. 검사: unit(기본 상한 ≥ 실측 31).

### Changed — 2026-10-01 try 사본이 지우기 전에 의존성 링크를 먼저 끊는다 · L2 재등록(2판)
- Windows에서 linkDeps의 링크는 정션이다 — 사본을 지우는 도구(`git worktree remove --force`·재귀 삭제)가 정션을 따라가면 main의 의존성이 지워진다. 이 컨테이너에선 확인할 수 없어, try 사본은 지우기 전에 링크 자리만 먼저 끊는다(`unlinkDeps` — 실물 디렉터리는 건드리지 않는다). unit worktree를 지우는 ship 경로는 그대로 두고 L2 2판 준비의 정션 점검으로 본다. 검사: unit(링크만 끊고 main 의존성·사본의 실물은 남음).
- L2 재등록: `docs/measurements/L2-TRIAL-2.md`(동결 = 이 등록의 머지 커밋, 게이트 0/3부터, 1판 1일차는 기록) · 저녁 지시서(`L2-day-conductor.md`)가 카드마다 try 사본을 열어 주고 tried fail엔 CEO 말을 그대로.

### Added — 2026-10-01 try 사본 — CEO의 try는 버릴 checkout에서 (백로그 1순위 · L2 재등록 A안)
- CEO가 try 카드를 메인 루트에서 치면 산출물이 main 작업 트리에 남아 다음 ship이 「메인 worktree에 미커밋 변경 — CEO가 치운다」로 막혔다: L2 1일차(eoren.sqlite — conductor가 CEO의 파일을 옮기는 판단 개입까지), 필드 벤치 웹 486fd74 · 621a426과 필드 시험 2(data/memos.json). 남은 파일을 찾아 지우는 사후 복구는 CEO의 의도된 파일을 지울 위험이 있고, 카드 작성 규칙은 제품마다 달라 범용이 아니다.
- 추가: `work.mjs try <slug>`(메인에서만 · 출하된 unit만)가 main 현재 커밋을 `.worktrees/try-<slug>`에 버릴 checkout으로 열고(main의 의존성 링크 — linkDeps), CEO는 카드를 그 폴더에서 친다 — 만든 파일은 사본에 남고 main은 깨끗하다(`.worktrees/`는 무시 목록). 다시 열면 새 사본. `tried`가 사본을 지운다(링크만 — main의 의존성은 그대로). STATUS 「써볼 것」 카드와 ship의 main dirt FAIL이 이 명령을 말하고, 두 규칙 파일 템플릿의 try 줄도 그렇다. 한계: 저장소 밖 부작용(홈·네트워크)은 범위 밖. 덤으로 기대한 위임(conductor가 파일을 만드는 카드를 치기)은 가드가 사본 안 쓰기를 fail-closed로 막아 아직 아니다.
- 시점: 백로그는 「L2 3일 표 뒤」였으나 CEO가 L2를 이 판으로 재등록(A안 — 게이트 0/3부터)하기로 해 앞당겼다. 검사: e2e(메인 밖 FAIL · 출하 전 FAIL · 사본 = main 커밋 + 의존성 링크 · 사본에 쓴 파일은 main에 없음 · STATUS 카드의 명령 · 다시 열면 새 사본 · tried가 사본을 지우고 main 의존성은 남음).

### Changed — 2026-10-01 HAZARDS에서 팩에 닿지 않는 35줄을 걷어 냈다 (산문 예산 39KB → 26KB)
- HAZARDS 줄은 경로 패턴이 unit의 바뀐 파일과 맞을 때만 팩(「HAZARDS — 이 경로에서 난 사고」 절)에 뜬다(`matchHazards`). 경로가 규칙집(`.garagiste/scripts/**`·`.garagiste/packs/**` 등)이나 main 전용 문서(`docs/BACKLOG.md` 등)뿐인 줄은 팩이 그 경로를 바꾸지 못해(가드) 영영 뜨지 않는다 — 프레임워크 자신의 사고 기록 35줄(약 15KB)이 산문 예산(40KB)만 먹어 설치본이 39KB, 다음 사고 한두 줄이면 ship의 budget 조건이 막힐 참이었다. 그 사고들의 기록은 이 CHANGELOG에 그대로 있다(첫 Windows 실기 · 2차 실기 · L2 · 필드 시험 · 필드 벤치 · 홀드아웃). `.garagiste/team.json`이 든 줄은 남겼다 — boot가 worktree에서 `work.mjs commands`로 바꾸는 경로다. 검사: unit(HAZARDS의 모든 줄에 팩에 닿는 경로가 있다 — 옛 파일에서 red) + HAZARDS 머리말.

### Fixed — 2026-10-01 인수 파일이 혼자 돌지 않았다 — Go의 패키지 (홀드아웃 정비의 사고 56)
- 사고 54·55 반영 뒤 필드 3(Go)의 sort-waste: build가 스모크를 고쳐 quick·full PASS까지 갔지만 redproof의 파일 단위 실행(`go test tests/acceptance/sort-waste_test.go`)이 `undefined: findDupsFixture`로 컴파일 실패 — spec이 쓴 인수 파일이 출하된 `find-dups_test.go`의 도우미를 썼다. Go는 한 디렉터리가 한 패키지라 파일끼리 이름을 공유하지만, 프레임워크의 증명(redproof·attack·full의 판정)은 파일 하나씩이다. build는 인수 파일을 못 고쳐 `spec:` 반려 — 앞의 반려(사고 55의 스모크)와 합쳐 두 번째라 CEO에게 갔다(안내는 실행 가능 — 정지는 아님). 수리: spec·attack 팩의 명령 절, test_file 줄에 「증명은 파일 하나씩(이 명령에 그 파일 하나): 네가 쓰는 테스트 파일은 혼자 돈다, 다른 테스트 파일의 도우미에 기대지 않는다(필요한 도우미는 그 파일 안에)」 — 실제 명령 옆에 brief.mjs가 싣는다. 검사: e2e(spec 팩 · attack 팩의 test_file 줄).

### Fixed — 2026-10-01 go test의 결과 캐시가 빨간 스모크를 가렸고, build는 스모크를 고칠 수 없다고 읽었다 (홀드아웃 정비의 사고 54·55)
- 사고 53 반영 뒤 필드 3(Go)의 sort-waste build가 커밋하지 못했다: boot의 스모크(`tests/unit/smoke_test.go` — 인자 없는 `go run ../../src`가 exit 0)가 red인데, 앞서 출하된 find-dups가 「인자 없으면 사용법·exit 2」로 바꾼 동작(attack이 「인자가 틀려도 exit 0」을 결함으로 짚었다)과 어긋났다. find-dups의 worktree quick 기록은 fresh FAIL → fresh ok(0.278s — build가 처음엔 exit 0을 맞췄다) → **`ok (cached)`** — exit 2로 바꾼 뒤의 quick은 캐시가 돌려준 낡은 ok였고, ship의 main quick도 같은 캐시로 통과해 main quick이 빨간 채 출하됐다(사고 54). go test의 결과 캐시는 테스트 바이너리와 테스트 프로세스가 연 파일만 열쇠로 삼는다 — 테스트가 부른 프로세스(go run)가 읽는 src는 모른다. 그리고 sort-waste의 build는 build.md의 「테스트를 고쳐 초록을 만드는 길은 없다」를 스모크까지로 읽고 `spec:` 반려 → spec 기각(자기 파일 아님) → conductor가 smoke-fix unit을 CEO에게 물었다 — 훅은 build의 `tests/unit/` 쓰기를 막지 않는다(사고 55: 산문이 코드보다 넓게 막았다).
- 수리: (1) 프레임워크가 부르는 모든 명령(lib `shell` — verify·redproof·attack·ship의 main quick·setup)에 `GOFLAGS=-count=1`(go test 밖의 go 명령은 이 플래그를 무시한다 · 이미 정한 `-count`는 둔다) — 증거는 지금 tree의 실행이다 (2) build.md: 「인수·공격 테스트를 고쳐 초록을 만드는 길은 없다. `tests/unit/`(스모크 포함)은 네 것 — 이 unit의 동작과 어긋난 기존 단언은 그 동작에 맞게 고치고 커밋 메시지에 이유」. 검사: unit(GOFLAGS 주입·보존 · build.md의 「쓸 수 없는 곳」 목록이 훅의 거부와 같고 tests/unit은 허용·산문도 그렇게 말한다) + e2e(Go가 있으면: 스모크가 부른 프로세스의 입력이 바뀌면 verify quick이 FAIL — 수리 전엔 「ok (cached)」로 PASS).

### Fixed — 2026-10-01 {files}를 한 번에 넘기자 Go 러너가 거부했다 (홀드아웃 정비의 사고 53 — 사고 48의 후속)
- 사고 49~52 반영 뒤 필드 3(소진된 홀드아웃, Go CLI)의 boot는 `test_file="go test {files}"`를 골랐다(사고 48의 선택지). find-dups의 ship이 `full: 이 tree의 verify full PASS 없음`에서 멈췄다 — full이 `tests/acceptance`·`tests/adversary`의 파일을 한 번에 넘기자 go test가 `named files must all be in one directory`로 거부했고, 하나씩은 전부 green이라 사고 48의 「함께 돌리면 red(하나씩은 green)」가 FAIL을 냈다. build의 spec 반려는 기각됐고(테스트는 원문과 맞다) 두 번째 반려가 CEO에게 「test_file을 패키지 경로(go test ./tests/...)로 바꿔도 되나」로 올라왔다 — 파일 단위 계약을 깨는 길. 수리: (1) `{files}`의 한 번에는 디렉터리마다 (2) 한 번에는 빠른 길일 뿐 — 판정은 파일 단위(사고 44의 계약): 한 번에가 실패하면 그 디렉터리의 파일을 하나씩 돌려 그 결과로 판정한다(러너의 제약인지 파일끼리의 간섭인지 exit로는 모른다 — 간섭은 프로젝트 러너의 full이 본다). 빠른 길의 실패는 로그에 남는다. 검사: 사고 44 e2e 확장(디렉터리마다 한 번 · red면 그 파일 · go test 꼴의 디렉터리 제약 → PASS · 함께면 exit≠0인 러너 → 파일 단위로 PASS·로그) + 필드 3의 find-dups worktree에서 2.9초 PASS(디렉터리 둘).

### Fixed — 2026-10-01 처음 보는 원문에서 intake가 막다른 길에 섰다 (홀드아웃 Go CLI의 사고 49~52)
- 필드 1·2가 두 회 연속 FAIL 0이던 판(0ae7c70)으로 수리에 쓰지 않은 원문(`tests/field/briefs/holdout-dupfind.md` — Go CLI)을 처음 측정했더니 boot 전, intake에서 멈췄다. CLI 도구의 원문은 흔히 옵션을 말하는데 필드 1의 원문엔 `--`로 시작하는 줄이 없었다.
- 사고 49: `work.mjs add min-size "--min-size 1M처럼…" --milestone M1`의 원문이 플래그로 먹혀 원문 「M1」·마일스톤 `M?`가 됐다(json-out 같음 · `ask`의 질문 「--json …」도 먹혀 Q1이 「json-out」 한 단어). 수리: 명령마다 아는 플래그만 플래그(`add`·`new`·`ask`·`drop`·`spawned`), 한 낱말 플래그 꼴(`--milestne`)은 오타라 `FAIL 알 수 없는 플래그 — <명령>이 받는 것: …`, 나머지는 원문.
- 사고 50: 그 줄을 고칠 길이 없었다 — `add`는 중복을 거부했고 `drop`은 unit을 요구하며 `loadUnit`의 예외(스택 여러 줄)로 죽었다(실행 불가 — 정지 줄). 수리: `add … --replace`는 열린 unit이 없는 열린 줄을 제자리에서 바꾸고 원장에 `backlog_replace`(전·후 줄), 중복 FAIL이 두 길(--replace · drop --forget)을 말한다 · unit 없는 줄의 `drop`은 `--forget`이면 줄을 닫고(원장 `backlog_only`) 아니면 두 길을 말한다 · 모든 스크립트의 잡히지 않은 예외는 `FAIL <이유> (던진 자리)` 한 줄(isMain).
- 사고 51: conductor의 탐침 `work.mjs brief --help`가 「--help」를 CEO 원문(BRIEF)에 쌓았다 — 팀은 BRIEF를 못 지워 CEO가 치웠다. 수리: `--help`·`-h`는 어느 명령이든 부작용 없이 사용법 한 줄. CEO의 말은 `--`로 시작해도 원문이다(`brief "--json이면 …"`).
- 사고 52: `spawned intake <팩 파일 경로>`가 같은 사용법을 두 번 받고 포기(486fd74 필드 1도 한 번). 수리: 경로를 받으면 「<팩>은 팩 이름이다 — 받은 값은 경로」와 고친 명령(파일 이름에서 팩 이름 · 받은 플래그 그대로)을 준다, 사용법은 팩 이름 목록을 말한다.
- 검사: unit(parseArgs — 원문·질문이 --로 시작 · 오타 플래그) + e2e(--help 탐침은 부작용 없음 · --로 시작하는 원문·질문 · 중복 FAIL의 두 길 · --replace 제자리·원장 · 열린 unit의 줄은 거부 · unit 없는 줄 drop · 예외 한 줄 · spawned의 고친 명령).

### Changed — 2026-10-01 사고 44의 비용: 여러 파일을 받는 러너는 인수·공격 파일을 한 번에 (필드 벤치 4 웹 측정 — 사고 48)
- 측정 모드 벤치(486fd74)의 웹 필드: 사고 44의 full은 프로젝트 러너(`node --test` glob, 병렬 — 20.5초) 뒤에 인수·공격 파일 10개를 파일 하나씩 직렬로 다시 돌려(브라우저를 매번 띄운다 · 50.8초) full이 약 3.5배가 됐다 — full은 unit마다 두 번(worktree · 통합)이고 파일 수는 unit 수만큼 자라 비용은 unit 수의 제곱으로 는다. `test_file`의 계약은 「파일 하나」라 그냥 여러 파일을 넘길 수는 없다(인자 하나만 읽는 래퍼면 거짓 green). 수리: 자리표시자 `{files}`(공백으로 이은 경로들 — 하나여도 된다)를 boot가 고를 수 있다 — `{files}` 러너면 full은 그 파일들을 한 번에 돌리고, red일 때만 파일별로 다시 돌려 어느 파일인지 말한다(함께일 때만 red면 「함께 돌리면 red」로 FAIL — 간섭도 「전부」의 red). `{file}` 러너는 그대로 파일마다. redproof·attack의 파일 단위 실행은 `{files}`에 파일 하나를 넣는다. work.mjs commands·doctor가 둘 다 받고, boot 팩이 그 선택을 말한다. 측정: 벤치 4 웹 필드 main에서 full 66.6초 → 37.2초(사고 44 전 약 20초). 검사: unit(fileCmd·hasFileSlot) + 사고 44 e2e 확장({file} 파일마다 · {files} 전부 green이면 한 번 · red면 그 파일 · 함께일 때만 red · redproof가 {files}에 파일 하나).

### Fixed — 2026-10-01 일부 주장만 이미 충족된 unit에 drop밖에 없었다 (필드 벤치 4 파이썬의 사고 47)
- 측정 모드 벤치(486fd74)의 파이썬 필드: jsonl-store(손편집·BOM 읽기 + CEO가 Q4로 정한 CP949·UTF-16 읽기)의 ship이 통합 tree redproof에서 `jsonl-store_handedit.py` base green으로 FAIL — 먼저 출하된 broken-lines가 BOM 처리를 main에 넣었다. FAIL의 길은 사고 36의 둘(이미 충족 → `work.mjs drop --forget` · 아니면 CEO가 더 말하고 re-spec)뿐이었는데, drop은 base에서 아직 red인 CP949 주장까지 닫는다. 대리가 「아니오 — 이미 main에 있는 주장은 빼고 CP949를 남겨라」로 답해 re-spec이 그 파일을 빼고 출하했다(안내대로 풀려 정지는 아니지만 옳은 길이 안내에 없었다). 수리: (1) redproof는 일부만 base green이면 「부분 충족 — green 목록 · red 목록」을 내고 drop을 주지 않는다 — CEO 결정(예/아니오): 충족된 주장만 뺀다 → `brief.mjs spec <slug> --met "<CEO 말 그대로>"` → 팩 spawn → redproof 다시, 아니면 더 말하고 re-spec (2) 원장의 redproof 줄에 `base_green`(부분 충족일 때) (3) `--met`는 spec 팩에만, 마지막 redproof가 부분 충족일 때만 열리고(주장을 빼는 것은 테스트 약화의 길 — 증거와 CEO 말이 있어야), 팩에 「이미 충족 — CEO가 빼라고 한 주장」 절(CEO 말 + 파일 목록 + 그 파일만 뺀다·새 주장 없음·끝은 redproof)을 싣고 원장에 `claims_met`을 남긴다. 검사: unit(부분 충족 안내에 drop 없음) + e2e(증거 없는 --met 거부 → redproof 부분 충족 FAIL·원장 base_green → spec 외 --met 거부 → 팩 절·원장 claims_met → 그 파일을 빼면 RED).

### Fixed — 2026-10-01 tried fail의 재현이 버려지고 -fix가 범위 밖에 남았다 (필드 벤치 4 파이썬의 사고 45·46)
- 측정 모드 벤치(486fd74)의 파이썬 필드: CEO가 「ledger-add fail — 없는 날짜 2026-02-30이 오류 없이 기록된다」고 했는데 conductor가 `work.mjs tried ledger-add fail`을 note 없이 남겼다 — 프레임워크는 빈 note를 받아 -fix의 원문을 「써봤는데 실패 — 스펙 정정」으로 채웠고, spec은 재현을 Q5로 CEO에게 되물었다(팩 2 · CEO 접점 1 — 46a53ca 정비의 Q5와 같은 꼴, 사고 45). 그리고 scope는 slug 목록이라 tried fail이 만든 ledger-add-fix(M1)는 범위 밖 — seed가 SCOPE DONE을 낸 뒤 CEO가 범위를 다시 줘야 했다(cfbcf3a에선 conductor가 `work.mjs new`로 우회해 버그 unit이 중복됐던 자리, 사고 46). 수리: (1) `tried <slug> fail`은 CEO의 말이 없으면 FAIL하고 명령(`tried <slug> fail "<CEO 말 그대로>"`)을 준다 — 그 말이 -fix의 원문·재현이다 (2) 범위가 있으면 -fix를 그 범위의 맨 앞에 넣고(CEO의 fail이 곧 「고쳐라」, 새 기능보다 먼저) 원장에 `scope_fix`를 남긴다. 검사: e2e(말 없는 fail → FAIL·아무것도 안 남김, 말 있는 fail → -fix 원문 = CEO 말, 다음 seed가 -fix를 연다, 원장 줄).

### Fixed — 2026-10-01 full이 하이픈 slug의 인수·공격 파일을 돌리지 않았다 (필드 벤치 1·3 파이썬의 사고 44)
- 측정 모드 벤치(79c3ebf)의 파이썬 필드는 FAIL 0으로 SCOPE DONE이었지만, 그 full(`tests/harness/run_all.py` — unittest discover)은 1건(unit 스모크)만 돌았다: discover는 `test*.py`·식별자 모듈 이름만 집어 `add-expense.py`·`add-expense-1.py` 꼴의 인수·공격 파일 17개를 한 번도 돌리지 않았다. 출하 전 증거(redproof·attack·통합 재검증)는 파일 단위(test_file)라 게이트는 속지 않았지만, 출하 뒤 다음 unit들의 full은 앞 기능의 회귀를 지키지 않았다(1회차의 관찰 「공격 파일이 full에 안 들어간다」가 인수 파일까지 — conductor가 두 번 「확인하지 않은 위험」으로 올렸다). 수리: full은 「전부」다 — `verify.mjs full`과 ship의 통합 재검증이 프로젝트의 full 뒤에 모든 unit의 인수·공격 파일(unit slug로 고른 git의 눈 — 도우미 파일은 빼고)을 `commands.test_file`로 돌리고, red가 있으면 FAIL 끝에 `인수·공격 파일 red n/N: <파일>`을 단다. 러너가 이미 집는 생태계(node --test glob)에선 그 파일들이 두 번 돈다 — 판단 없이 「전부」를 보장하는 값. 검사: e2e(full이 tests/unit만 집는 프로젝트에서 red 인수·공격 파일 → FAIL·파일 이름, 도우미 파일은 돌리지 않음, 전부 green → PASS) + 벤치 3 파이썬 필드의 main에서 17개가 돌고 green.

### Fixed — 2026-10-01 헤드리스에서 환경 변수 접두 명령이 막혔다 (필드 벤치 2 웹 정비의 사고 43)
- 웹 필드의 browser-reload: build가 Playwright를 dev 의존성으로 들이려고 `cd <worktree> && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install …`, 이어 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --prefix <worktree> …`를 쳤는데 둘 다 승인 대기로 막혔다 — 명령 앞 환경 변수 접두는 허용 목록(`Bash(npm:*)`)과 맞지 않고, 헤드리스엔 승인 대화가 없다. 그 변수는 컨테이너 환경에 이미 설정돼 있었다. build는 커밋 없이 끝났고 conductor는 CEO에게 넘기고 멈췄다. 사고 27(cd·git -C)·40(스크립트 경로)과 같은 계급의 세 번째. 수리: 모든 팩의 작업 디렉터리 줄에 막히는 꼴(`cd <dir> && …` · `X=1 cmd`)과 막히지 않는 꼴(`git -C <wt>` · `npm --prefix <wt>` · 스크립트는 경로로 · 환경 변수는 이미 설정된 것, 기계별 값은 `.garagiste/env.local`)을 brief.mjs가 싣는다. 검사: 탄생 e2e(build 팩에 그 줄과 worktree 절대 경로).

### Fixed — 2026-10-01 출하된 unit의 공격 테스트를 고치라는 CEO 답을 실행할 길이 없었다 (필드 벤치 2 웹 정비의 사고 42)
- 사고 41 반영 뒤 웹 필드의 memo-delete: 출하된 memo-save의 공격 테스트(memo-save-3·8)가 「<li> 안쪽 HTML == 메모 본문」을 단언해 memo-delete의 수용(메모 옆 「삭제」 폼)과 함께 성립할 수 없었다. build의 반려를 spec이 기각했고 두 번째 반려는 설계대로 CEO에게 갔다 — CEO는 「공격 테스트를 본문 텍스트 기준으로 고쳐라」. 그런데 그 답이 갈 길이 없었다: conductor가 연 `brief.mjs spec memo-save`는 출하된 unit이라 `FAIL worktree 없음`, 공격 테스트를 쓸 수 있는 정체는 attack뿐인데 attack 팩에 그 결정을 실을 길이 없었다(실행 불가 — 필드 정지). 수리(사고 33의 반려 길과 같은 꼴): (1) 두 번째 반려 FAIL이 CEO의 두 답을 명령으로 준다 — 수용을 바꾸라면 `work.mjs brief` → `brief.mjs spec <slug>`, 기존 공격 테스트(출하된 unit의 것 포함)를 고치라면 `work.mjs brief` → `brief.mjs attack <slug> --revise "<CEO 말 그대로>"` (2) `--revise`는 spec 반려가 있었던 unit에서만 열리고(기존 공격 테스트를 고치는 것은 테스트 약화의 길 — CEO 결정뿐), attack 팩에 「고쳐 쓰기」 절(CEO 말 그대로 + 반려 줄 + 결정 범위만·지우지 않는다)을 싣고 원장에 `adversary_revise`를 남긴다 (3) 출하된 unit의 팩을 열면 「이미 출하 — 진행 중 unit의 팩이 고친다」와 두 길을 말한다. 검사: 탄생 e2e(두 번째 반려의 두 명령 · 출하된 unit FAIL · 반려 없는 --revise 거부 · attack 외 --revise 거부 · 팩의 고쳐 쓰기 절 · 원장 줄).

### Fixed — 2026-10-01 공격 파일만 든 wip HEAD에서 ship이 멈췄다 (필드 벤치 2 웹의 사고 41)
- 측정 모드 벤치(cfbcf3a)의 웹 필드: serve-list의 마지막 attack이 공격 파일 하나(`serve-list-13.test.mjs`, red 0/13)를 더하고 끝나자 SubagentStop 체크포인트가 그것을 wip로 커밋했다. ship은 `head: HEAD가 wip 체크포인트 — build를 다시 띄워 끝내라`, build는 고칠 것이 없어 wip만 풀고 커밋 없이 끝났고 체크포인트가 다시 덮었다 — 안내대로 해도 같은 FAIL로 필드가 멈췄다. 공격 파일은 대개 build의 다음 커밋에 실려 왔는데, build가 할 일이 없는 마지막 attack에선 커밋할 주체가 없었다. 수리: 사고 16(spike 파일만 든 wip HEAD 승격)을 넓혀 증거 파일(spike 측정 · `paths.adversary` · `paths.hostile`)만 든 wip HEAD는 ship이 `test(<slug>): attack 산출물`로 승격한다 — amend는 메시지만이라 tree가 같고 full·redproof·attack 증거가 그대로 유효하다. 제품 코드가 섞이면 승격하지 않는다(build의 일). 검사: evidenceCommitMessage 단위 테스트 + e2e(R9 시험대에서 공격 파일만 든 wip → SHIPPED, main 역사에 wip 없음).

### Fixed — 2026-10-01 worktree 스크립트를 밖에서 부르면 main을 검증했다 (필드 벤치 1 정비의 사고 40)
- 사고 38·39 반영 뒤 필드 1의 버그 unit(ledger-add-fix)이 `FAIL ship … - head: HEAD가 wip 체크포인트`에서 멈췄다. 헤드리스에선 `cd <worktree> && git …`·`cd … && ls … 2>&1`이 승인 대기로 막혀 build가 `git -C <worktree>`와 `node <worktree>/.garagiste/scripts/verify.mjs quick`로 돌아갔는데, 셸의 cwd는 main 루트였다 — 스크립트는 뿌리를 cwd로 정해 main을 검증하고 `PASS verify:quick <main의 tree>`를 남겼고, build는 자기 worktree를 검증했다고 믿었다. worktree 커밋의 게이트는 `원장에 이 tree의 quick PASS 없음`으로 두 번 거부했고 체크포인트가 wip로 덮었다(조용한 오검증). 수리: 스크립트 진입(isMain)에서 cwd가 그 스크립트의 저장소 밖이면 그 저장소로 옮긴다 — 경로가 의도다. cwd가 안이면 그대로(main의 스크립트를 worktree에서 부르면 worktree가 뿌리, 사고 31의 위임도 그대로). 검사: lib 단위 테스트(worktree 스크립트를 main·저장소 밖에서 → worktree, main 스크립트를 worktree에서 → worktree).

### Fixed — 2026-10-01 spike 미완 FAIL에 다음 할 일이 없었다 (필드 벤치 1의 사고 39)
- 측정 모드 벤치(46a53ca)의 파이썬 필드: build가 `.gitignore`에 `__pycache__/`를 더하자(boot의 무시 목록에 파이썬 산출물이 없었다) `.gitignore`가 boundary 파일이라 ship이 `spike: boundary HIT(file .gitignore)인데 spike 필수 행(…) 미완`으로 막혔다. 줄에도 Flow에도 다음 할 일이 없었고 Flow 6은 「spike 허용 밖」을 멈춤으로 둔다 — conductor는 Flow 5(출력 밖 추측 금지)대로 멈췄고 필드는 거기서 끝났다. 수리(안내만): 그 FAIL이 `brief.mjs spike <slug>` → 팩 spawn(채울 측정 파일) → `ship.mjs <slug>` 다시를 명령으로 주고, 측정 파일은 ship이 커밋하며 측정이 허용 밖일 때만 CEO에게 간다고 말한다. boundary 목록은 그대로 둔다(무시 줄은 증거에서 파일을 숨길 수 있다). 검사: evaluateShip 단위 테스트 + e2e(무시 줄 → spike FAIL의 명령 → spike → 증거 재기록 → SHIPPED).

### Fixed — 2026-10-01 main에서 돈 setup·quick의 산출물이 반쪽 출하를 남기고 CEO 몫으로 읽혔다 (필드 벤치 두 곳의 사고 38)
- 측정 모드 벤치(46a53ca)의 두 필드가 첫 ship(boot)에서 같은 줄을 냈다: `FAIL ship: 문서 커밋 실패 — FAIL gate - 인덱스 ≠ 작업 트리`. ship이 머지 뒤 main에서 돌린 setup(`npm install` · `pip install -e .` — 사고 21·34의 길)과 quick이 미추적 산출물(package-lock.json · src/*.egg-info · __pycache__)을 남겨 ship 자신의 문서 커밋을 게이트가 거부했다. 머지·shipped·ship 줄은 남고 문서는 스테이지 채, worktree 잔류, TRY 줄 없음 — 안내대로 스테이지 → 다시 ship은 「이미 출하」. 남은 package-lock.json은 다음 ship을 `메인 worktree에 미커밋 변경 — … 팀의 것이 아니다 … CEO가 치운다`로 막았다(오귀속 — 벤치 대리는 CEO 접점으로 셌다). 수리: (1) 머지 뒤 되돌리기를 한 곳(undo)으로 — setup FAIL · main quick FAIL · 남은 것 · 문서 커밋 실패가 모두 머지·출하 기록을 되돌리고 `ship_rollback` 줄을 남긴다, ship 줄은 문서 커밋 뒤에만 (2) quick 뒤 main에 CEO 문서 밖의 것이 남으면 출하하지 않는다 — 그 경로(새 디렉터리는 git이 접은 그대로)를 `.garagiste/session/ship-stray/<slug>-<시각>/`으로 옮기고(지우지 않는다 · 바뀐 추적 파일은 사본을 두고 되돌린다 · 옮기지 못한 것은 그 자리에 두고 말한다) unit에게 「무시할 산출물이면 .gitignore, 저장소에 둘 것이면 커밋 → brief.mjs boot|build 재spawn」을 말한다 (3) boot·build 팩이 가장 최근 되돌림의 목록을 할 일로 받는다. main은 ship 전 그대로라 다음 ship이 그것을 CEO의 것으로 읽지 않는다. 검사: strayPaths·quarantineStray 단위 테스트 + e2e(setup 산출물 → 되돌림·보존·팩 → 무시 줄 → SHIPPED, main 깨끗).

### Fixed — 2026-10-01 맨 끝의 `--forget`이 꺼졌다 (필드 시험 2의 사고 37)
- 사고 36의 안내대로 conductor가 `work.mjs drop persist "이미 충족 — …" --forget`을 쳤는데 출력은 「BACKLOG 줄은 열려 있어 seed가 새로 연다」, 원장은 `forget:false` — 플래그 파서가 모든 `--x`에 다음 인자를 값으로 먹였고 맨 끝이라 undefined였다. `scope --milestone M1`이 persist를 다시 잡았고 conductor는 browser-check의 needs를 고쳐 비켜 갔다. `--forget`은 출시 이래 시험된 적이 없었다. 수리: 파서를 `parseArgs`로 꺼내 불리언 플래그(`forget`)는 값을 먹지 않게(앞에 와도 사유를 삼키지 않는다). 검사: parseArgs 단위 테스트.

### Fixed — 2026-10-01 이미 충족된 unit의 redproof 막다른 길 (필드 시험 2의 사고 36)
- 웹 필드의 persist(「서버를 다시 켜도 남는다」): save-memo가 이미 `data/memos.json`에 쓰고 있어 spec이 쓴 재시작 주장 3개가 base에서 green — spec은 원문에 없는 요구로 red를 지어내지 않았고 「CEO 몫: drop 또는 원문 구체화」를 보고했지만, redproof FAIL(`base에서 green인 테스트가 있다 — 테스트가 아니다`)엔 다음 할 일이 없었고 conductor는 그 질문을 CEO에게 내지 못한 채 「위 persist 질문」만 말했다. intake가 기능을 unit으로 쪼개면 앞 unit이 뒤 unit의 일을 겸하는 것은 흔하다. 수리(안내만, 장치 없음): 두 base-green FAIL이 green 파일과 CEO의 두 길을 명령으로 준다 — 이미 충족이면 `work.mjs drop <slug> "이미 충족 — <근거>" --forget`(BACKLOG 줄이 닫혀 이 unit을 기다리는 unit의 선행이 풀린다, 주장 파일은 dropped 브랜치에), 아니면 CEO의 말을 brief로 받고 spec 재spawn. 검사: baseGreenAdvice 단위 테스트.

### Fixed — 2026-10-01 의존성 링크가 커밋에 들어갔다 · try 산출물의 main dirt FAIL에 할 일이 없었다 (필드 시험 2의 사고 35)
- 사고 34 수리로 main에 node_modules가 깔리자 worktree의 verify가 그것을 링크했는데, 링크는 디렉터리가 아니라 프로젝트의 `.gitignore`(`node_modules/`)에 안 걸렸다 — 미추적으로 보여 커밋(체크포인트의 `git add -A`)에 이 기계 경로의 링크가 들어갔다. build가 다음 공격 결함으로 발견해 프로젝트 .gitignore를 고쳤다. 수리: `linkDeps`가 무시되지 않는 링크를 저장소의 로컬 제외(`info/exclude` — 모든 worktree 공용, 커밋 안 됨)에 스스로 둔다; 저장소 규칙은 건드리지 않는다. 검사: unit 테스트(`node_modules/` 규칙의 저장소 → 링크 뒤 worktree·main 모두 깨끗).
- 같은 필드: CEO가 save-memo 카드대로 메인 루트에서 `npm start` → 저장 → `data/memos.json`이 main에 미추적으로 남아 delete-memo의 ship이 `FAIL ship: 메인 worktree에 미커밋 변경 — data/memos.json`으로 막혔다(L2 1일차 eoren.sqlite에 이은 두 번째 프로젝트). 이번엔 conductor가 a093919의 규칙대로 손대지 않고 CEO에게 물었다. 수리(안내만): 그 FAIL이 「팀의 것이 아니다 — CEO가 치운다(try 산출물이면 지우거나 옮기거나 .gitignore) → ship 다시」를 말한다. try 샌드박스(L2 표 이후 1순위 후보)는 이로써 둘의 규칙이 찼다 — 장치는 L2 동결 해제 뒤. 검사: e2e(메인 루트의 미추적 파일 → 그 FAIL).

### Fixed — 2026-10-01 설치 명령 없는 의존성 출하 (필드 시험 2의 사고 34)
- 웹 필드: boot이 의존성 0이라 `commands.setup="true"`를 두었고, save-memo가 브라우저 확인용 `playwright-core`를 dev 의존성으로 더해 출하됐다. ship의 NOTE는 「commands.setup을 main에서 이미 돌렸다 … 다음 unit의 worktree가 물려받는다」 — 실제로는 무동작이라 main에 node_modules가 없었고, 다음 unit(delete-memo)의 worktree도 없어 full이 `ERR_MODULE_NOT_FOUND`로 막혔다(redproof의 RED도 모듈 부재 때문이었다). build는 설치를 시도했지만 팩의 일이 아니고, setup을 고칠 수 있는 것은 boot·ADMIN뿐이다(R6). 수리: (1) 의존성 매니페스트가 바뀐 출하에 설치 명령이 없거나 무동작(`true`·`:`·`exit 0`)이면 머지 전에 FAIL하고 CEO의 한 줄을 준다(`GARAGISTE_ADMIN=1 … work.mjs commands setup="…"`; boot은 자기 worktree의 setup으로 본다) (2) 메인 루트의 `commands`는 models처럼 스스로 커밋하고 바뀐 setup을 main에서 한 번 돌린다 (3) worktree의 verify가 main의 의존성 디렉터리(node_modules·.venv)를 없는 것만 잇는다 — seed 뒤 깔린 의존성도 열린 unit에 닿는다 (4) boot 팩: 의존성이 0이어도 생태계의 설치 명령을 쓴다. selftest의 boot 고정물은 매니페스트 없이(설치할 것이 없다). 검사: setupGap 단위 테스트 + e2e(CEO 한 줄 → 커밋·main 설치 → 열린 worktree의 verify가 잇는다).

### Fixed — 2026-10-01 팩의 `spec:` 줄을 받을 길이 없었다 (필드 시험 1의 사고 33)
- 파이썬 필드의 month: spec이 쓴 인수 테스트가 서로 어긋났다 — 합계 `-30000`이 찍혀야 한다는 주장과 다른 달 금액 `3000`이 출력에 없어야 한다는 주장(`-30000`이 `3000`을 품는다). build는 build.md 5번대로 `spec: …`을 남기고 멈췄지만, Flow에는 그 줄을 받는 단계가 없고 redproof FAIL은 「build가 덜 끝났다 → 재spawn」만 말했다 — 두 번째 build도 같은 줄. conductor는 spec 재spawn을 CEO의 「수정」 길로만 알아 멈췄다. 수리: `brief.mjs spec <slug> --return "<그 줄>"` — spec 팩이 「반려」 절로 받는다(그 주장들이 서로·원문과 정말 어긋나는지부터, 어긋나면 그 주장만 — 원문 요구를 약하게 해서 초록을 만들지 않는다, 아니면 `반려 기각`); 원장 `spec_return`; 같은 unit 생애의 두 번째 반려는 FAIL로 CEO에게(핑퐁 한 번). Flow 4에 그 길 한 줄, redproof의 head red FAIL이 그 길도 말한다. 검사: e2e(반려 팩 · 원장 줄 · 두 번째 FAIL · build엔 --return 거부).

### Fixed — 2026-10-01 build 팩이 attack의 red를 받지 못했다 (필드 시험 1의 사고 32)
- 파이썬 필드의 add: attack이 결함 3(날짜 미검증 · `-`로 시작하는 메모 거부 · `0xff`에서 Traceback)을 `tests/adversary/add-{1,2,3}.py`로 남겼는데, build를 두 번 다시 띄워도 커밋 0 — build 팩의 할 일 절엔 인수 테스트만 있었고, 프로젝트의 full(`unittest discover`, 기본 패턴 test*.py)은 공격 파일을 돌리지 않아 build는 green만 봤다. 웹 필드(node --test "tests/**/*.test.js")는 full이 공격 파일을 집어 같은 틈이 가려져 있었다. 수리: build 팩이 마지막 attack 줄의 red 파일 전문을 「공격 테스트 — 지금 red」 절로 받고, build.md의 끝 검사에 `verify.mjs attack <slug>` red 0을 더한다(full이 그 파일을 안 돌릴 수 있다). 검사: e2e(attack red 1 → 다시 조립한 build 팩에 그 파일과 내용).

### Fixed — 2026-10-01 진행 중 unit에 정비가 닿지 않았다 (필드 시험 1의 사고 31)
- 사고 30의 수리를 main에 반영했는데 add의 build가 같은 FAIL을 다시 봤다 — 팩은 worktree에서 `node .garagiste/scripts/redproof.mjs`를 치고, 그 파일은 `unit/add`가 갈라질 때의 사본(옛 법)이다. main에서 돌린 redproof는 PASS, worktree의 것은 FAIL — 법이 둘이었다. 시험대의 정비 반영(L1 4차·L2)은 「메인 루트에서 치라」는 지시로 비켜 갔었다. 수리: 모든 스크립트의 입구(`isMain`)가 worktree에서 불렸고 main의 같은 스크립트와 내용이 다르면 main의 것으로 넘긴다(인자·cwd·종료 코드 그대로 — cwd가 worktree라 ctx는 그대로 그 unit을 본다). 같은 법이면 넘기지 않는다. 이 수리를 가진 lib.mjs에서 갈라진 worktree부터 효력이 있다 — 그 전에 갈라진 진행 중 unit은 한 번 main 위로 올려야 한다(정비 반영 때 CEO 쪽 일). 검사: unit 테스트(main 정비 뒤 worktree 사본 호출 → main의 법, 인자·cwd·종료 코드 보존).

### Fixed — 2026-10-01 무시 파일이 수용·공격 테스트로 셌다 (필드 시험 1의 사고 30)
- 파이썬 필드의 add: spec의 redproof와 attack이 테스트를 돌리면 파이썬이 `tests/acceptance/__pycache__/*.pyc`·`tests/adversary/__pycache__/*.pyc`를 남긴다(.gitignore가 무시). `acceptanceFiles`·`adversaryFiles`는 디렉터리를 걸어 그것까지 slug 접두로 집어 — redproof는 `FAIL … head에서 red: tests/acceptance/__pycache__/add_test.cpython-311.pyc → build가 덜 끝났다 … 재spawn`(build의 경계 밖이라 두 번 띄워도 빈손), attack은 진짜 3 대신 `red 6/6`. 수리: 셋(수용·공격·claims의 주장 스캔)을 `repoFiles` — `git ls-files --cached --others --exclude-standard` 중 디스크에 있는 것 — 로 모은다. 막 쓴 미커밋 주장은 들어오고 무시 파일·지운 파일은 빠진다; git 밖이면 옛 걷기. 검사: unit 테스트(추적 · 무시된 pyc · 미커밋 새 주장 · 지운 파일).

### Fixed — 2026-10-01 unit 역사의 중간 커밋이 rebase를 막았다 (필드 시험 1의 사고 29)
- 파이썬 필드의 boot: 체크포인트(SubagentStop 훅의 `git add -A`)가 .gitignore가 생기기 전 테스트 산출물 `__pycache__/*.pyc`를 wip로 커밋했고, boot의 정식 커밋이 .gitignore에 넣으며 추적을 뺐다 — 파일은 worktree에 무시 파일로 남는다. 그 사이 main이 움직였고(정비 반영 커밋), ship의 `git rebase main`이 역사를 한 커밋씩 다시 놓다 첫 wip에서 「The following untracked working tree files would be overwritten by merge」로 멈췄다. FAIL 줄은 첫 줄만 내 파일 이름이 잘렸고 할 일이 없었다 → 프레임워크 FAIL. 마지막 tree는 깨끗했다 — 막은 것은 증거가 아닌 중간 역사다. 수리: ship이 조건 통과 뒤 rebase 전에 unit의 역사를 그 tree 한 커밋으로 접는다(메시지 = 마지막 커밋 + 접힌 subject 목록, tree 불변이라 full·redproof·attack 증거 그대로 유효; 멈춰 둔 rebase를 잇는 사고 26 경로는 접지 않는다). 덤으로 main 역사에 wip 체크포인트가 오지 않고, 충돌은 unit당 한 번만 멈춘다. rebase 실패 FAIL은 hint 줄만 빼고 전문. 검사: e2e(boot의 wip가 산출물을 담고 정식 커밋이 무시 목록으로 뺀 뒤 main 이동 → 수리 전 시험대와 같은 FAIL, 수리 뒤 SHIPPED · main에 산출물·wip 없음).

### Fixed — 2026-10-01 필드 시험(Python CLI · 웹 앱) — boot 커밋 막힘 · 가드의 git 전역 옵션 구멍 · list (사고 27·28)
- 사고 27: 두 필드 모두 첫 unit boot에서 멈췄다 — boot 팩은 worktree에서 `cd <wt> && git add …`·`git -C <wt> commit …`로 일하는데 settings.json 허용 목록에 `cd`·`git -C`가 없어 하위 에이전트의 명령이 승인 대기가 됐고(헤드리스는 거부), 체크포인트의 wip 커밋만 남아 `FAIL ship boot 1/8 - head: HEAD가 wip 체크포인트 — build를 다시 띄워 끝내라`. 그 안내도 scaffold에 build를 가리켰다(사고 7의 rebase 문구와 같은 결함). 수리: 허용 목록에 `Bash(cd:*)`·`Bash(git -C:*)`(쓰기 경계·파괴 명령은 가드 훅이 그대로 본다), wip HEAD 안내는 `boot`/`build`를 unit 정체로. 검사: settings·evaluateShip 단위 테스트.
- 사고 28: 허용을 넓히기 전 가드 탐침 — `git -C x reset --hard`·`git -C x commit --no-verify`·worktree의 `git -C x push`가 통과했다(검사가 `git\s+<하위명령>`만 봤다). `git -c core.hooksPath=/dev/null commit`은 커밋 게이트(.githooks)를 통째로 껐다. 수리: 파괴·보호 push·worktree push·spike commit 검사가 전역 옵션(`-C <경로>`·`-c <키=값>`·`--git-dir=`·`--work-tree=`·`--namespace=`)을 건너 하위 명령을 본다; `-c core.hooksPath=`는 ADMIN 밖에서 「게이트 우회」로 거부. 검사: guard 단위 테스트(수리 전 red).
- `work.mjs list`가 intake 뒤 「unit 없음」만 냈다 — Flow 2는 intake 뒤 list를 보라 하는데 seed 전 BACKLOG 줄이 안 보였다(두 필드 공통). 수리: 열린 BACKLOG 줄을 `backlog` 상태로 함께 보인다(dropped unit의 줄 포함). 검사: listLines 단위 테스트.

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
