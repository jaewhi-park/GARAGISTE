# Changelog

v2엔 릴리스 태그도 버전 기록도 아직 없다. 설치본의 정체는 설치한 GARAGISTE 커밋의 `team/` 사본이고, 프로젝트 쪽 기준선은 규칙집 tree — `git rev-parse HEAD:.garagiste`(시험 등록·반영 블록이 이 값으로 대조한다)다. `install.sh <flavor> -Project <repo>`를 다시 돌리면 scripts·packs·훅·agents·pre-commit은 덮고, team.json(편성·commands)·HAZARDS(제품 오버레이)·규칙 파일(CLAUDE.md/AGENTS.md)·settings는 남긴다 — 그 뒤 doctor·selftest가 PASS여야 설치다. 설치본에 버전을 적고 업그레이드를 diff가 보이는 unit으로 하는 것은 백로그 L3 Q11이다. 아래 절은 최근 것부터 — 수리는 사고 번호로, 채용은 CEO의 말로.

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

### Changed — 2026-10-03 문체 — 살아 있는 문서의 코인·비유를 평이한 말로 (CEO 「무리해서 모든 단어를 한국어로 번역하지 말자」)
- 레포의 산문은 코드 명사(unit · ship · spawn · worktree · conductor · scope …)는 영어로 두고 설명은 순우리말·비유로 쓰는 문체였다 — 「침대」(test bed, 2026-09-30 HANDOFF부터 · docs 8파일 40회) · 「꼴」(형식 · docs 75회, team/ 8회) · 「이음새」 · 「선발견」 · 토양 · 백신 · 걷어 내다 같은 코인. CEO가 어색하다고 짚었다.
- 살아 있는 문서(HANDOFF · FIELD-BENCH · L2-TRIAL-5 · L2-day-conductor · 백로그 · 후보 README)에서 바꿨다: 침대·시험대 → **테스트 베드** · 저장 꼴 → **저장 형식** · 같은 꼴 → 같은 모양 · boot 꼴 → boot 생태계별 설정 · 토양 → 낳은 조건 · 백신 → 재발 방지 · 걷어 낸다 → 제거한다 · 후발견 → 나중에 찾았다. 끝난 기록(archive · changelog · FIELD-BENCH-LOG의 행)은 그대로(기록은 고치지 않는다).
- `team/` 산문과 그 출력을 인용한 자리(팩 절 제목 「생태계별 검증된 꼴」 · LEDGER 열 「선발견」 · STATUS 「막힌 것」의 「되풀이」 · `work.mjs system`의 「이음새」)는 그대로 — L2 5판 동결이 끝나면 팩·HAZARDS·템플릿·스크립트 문구를 함께 바꾸고 금지어 unit 테스트를 둔다(규칙은 코드로만). CLAUDE.md Language 절에 문체 한 줄.

### Changed — 2026-10-03 낡은 문장 둘 정정 (정비 채널 리뷰 — 코드에 없는 장치를 말하던 문장)
- 이 파일의 머리말: v1의 문장이었다 — 「훅·플러그인이 `GARAGISTE_VERSION`을 지니고 session-start가 그 값을 주입한다 · Breaking 목록이 이행 체크리스트」는 v2 코드 어디에도 없다(`docs/changelog/v1.md`에만 Breaking 절이 있다). v2의 사실로 바꿨다: 버전 기록 없음 · 설치본의 정체 = 설치 커밋의 `team/` 사본 · 기준선 = `HEAD:.garagiste` · 재설치가 덮는 것(scripts·packs·훅·agents·pre-commit)과 남기는 것(team.json·HAZARDS·규칙 파일·settings) · 버전 기록은 L3 Q11.
- 백로그 L2 게이트 「1주간 green 후 결함 0」 → 세 라운드 누적(CEO 「날짜는 측정 단위가 아니다」) — 5판 등록 커밋에서 이미 고쳤다(116396a).
- 그 밖의 버전·업그레이드·재설치 문장(install.sh·install.ps1의 「재설치의 -Budget이 기존 편성을 지우지 않는다」)은 코드와 맞아 그대로다.

### Added — 2026-10-03 CEO-분 기계 셈 — 「시간은 공짜, 주의는 비싸다」의 주의를 처음 잰다 (L1 1차부터 비어 있던 「(CEO 기입)」 · 정비 채널 제안 → CEO 「진행」)
- 정의(`docs/measurements/L2-TRIAL-5.md` 「CEO-분」): 창의 벽시계(아침 창 = CEO의 첫 말 → 마지막 말 「가」 · 저녁 창 = 「저녁」 → 마지막 말의 턴 끝(표)) · 말 수 · conductor 대기(말 → 그 턴의 끝) · 낮의 말 · 카드 시간(원장 `try` → 그 slug의 `tried`) · unit당(두 창의 합 ÷ 낮 ship) · 원장만일 때의 하한(결정 구간). 판단 없음 — 「저녁」은 프로토콜의 고정 말. 대리 CEO의 수치는 「절차가 요구하는 최소 주의」, 윈도우 라운드가 사람의 수치.
- 출처 셋(`tests/field/day.mjs` `ceoSources` — 자동 발견 · `--transcript <파일>`): 턴 기록(`<폴더>-turn<n>.msg/.json`) · 스트림(`<폴더>-<tag>.msgs.jsonl` + `.stream.jsonl`의 result) · claude 세션 전사(`~/.claude/projects/<cwd 슬러그>/*.jsonl` — user 줄의 글이 말, tool_result 줄·곁가지·`<`로 시작하는 하네스 줄은 아니다, assistant 줄이 턴 끝). 없으면 원장 하한만 — 「(CEO 기입)」은 지시서·표에서 지웠다.
- `work.mjs try`가 원장 `try` 줄(slug·head)을 남긴다 — 카드 시간의 시작점(측정 빈틈 — 규칙집 경로라 HAZARDS 줄 없음). 저녁 창 시작의 정의는 「첫 try 또는 tried」(지시서 「저녁」 2 · day.mjs bounds). 5판 동결에 든 7건 밖의 유일한 변경 — 등록문 머리에 적었다.
- 백로그 L3 게이트 문장: 「unit당 CEO 분이 L1 대비 비악화」 → 기계 셈 기준, 기준선은 L2 5판의 첫 수치. HANDOFF CEO 대기 결정에서 뺐다. 5판 예측 9(CEO-분 첫 수치의 범위 · 윈도우 출처는 전사).
- 검사: field(창 배정·벽시계·대기·카드 시간·하한 · 출처 셋과 전사 줄 가르기 · CLI의 자동 발견과 --transcript) · e2e(try 사본 → 원장 try 줄).
- 1라운드 뒤 도구 수리(2026-10-03 — 동결 아님): 두 출처(턴 기록·전사)에 든 같은 말은 하나(`dedupe` — 글이 같고 2분 안) · 아침의 「가」 턴은 무인 구간이라 대기에서 뺀다 — 5판 리눅스 1라운드의 첫 산출이 말 수 두 배 · 아침 대기 32분으로 나왔다. 검사: field.

### Added — 2026-10-03 홀드아웃 후보 셋 — 다음 범용성 원문은 지금까지 없던 자리에서 (서명 대기 · CEO 「새 홀드아웃 원문 후보」)
- `tests/field/briefs/candidates/`: `notes.md`(메모 색인 CLI — Rust 표준 라이브러리만: 컴파일 언어·`target/`·cargo 테스트 레이아웃·rename 원자성·오늘 날짜가 처음) · `snap.md`(폴더 스냅샷 백업 — Python 백그라운드 데몬: 프로세스 수명·7일/30일/1년 보관 규칙·잠긴 파일·원자적 쓰기·로그 돌리기가 처음) · `parcel-desk.md`(택배 보관 대장 — Node 기존 코드에 기능 넷: brownfield, L3 Q13 「boot 없이 첫 unit 출하」의 자리 — seed 요건·`setup-seed.sh` 필요는 README에). 홀드아웃 여섯이 전부 소진된 뒤의 첫 후보 — 지금까지의 자리(Node·Python·Go의 CLI·웹, 빈 폴더 시작) 밖에서 골랐다. 브라우저만 쓰는 앱(L4)과 Java·PHP·Ruby는 미룬 이유와 함께 README에.
- 서명 = CEO가 하나를 `holdout-<이름>.md`로 옮기는 머지(FIELD-BENCH 「홀드아웃」 후보 줄 · HANDOFF). 서명 전까지 측정·수리에 쓰지 않는다 — 원문이 훈련 데이터가 되면 점수가 아니다.

### Added — 2026-10-03 L2 5판 등록 — 7건 뒤의 정본을 처음부터 다시 잰다 (라운드 기준 · 7건마다 예측 · 시계 검사 도구) (CEO 「L2는 처음부터 다시」)
- `docs/measurements/L2-TRIAL-5.md`(시험 전에 커밋 — 머지가 CEO 서명·동결): 4판 초안의 설계(라운드 단위 · Q6 두 길 · Q7 막힌 세션의 압력 · 시계 검사 · 윈도우 지시)를 이어받고, 3판 Q5 라운드는 옮겨 세지 않는다(정본이 다르다). 7건이 한 묶음으로 들어갔으므로 변화마다 보는 곳·예측·틀리면 뜻하는 것을 따로 둔다 — 채점이 변화를 가른다. 리눅스 Q5 세 라운드(todo 회귀 — 미검수 셈이 바뀌어 라운드가 무인 출하 5 또는 SCOPE DONE에서 멈출 것으로 예측) · Q6 · Q7 · 저녁마다 시계 검사 · 윈도우 Q5 세 라운드(futsal — 소진된 홀드아웃이라 회귀, 윈도우에서만 나는 문제를 본다). 4판 초안은 `docs/measurements/archive/L2-TRIAL-4.md`.
- 도구(`tests/field/` — 프레임워크가 아니다): `clock.mjs`(+`clock-preload.cjs`) — TZ와 `Date` 오프셋을 NODE_OPTIONS preload로 모든 node 자식에 넣어 프로젝트 full을 시계 넷(UTC+14 · UTC−11 · 서울 +40일 · 서울 12월 31일 23:59:50)으로 돌리고 설정마다 한 줄 · `stream.mjs`가 방향전환의 대상 slug를 말과 함께 기록하고(`say --target`) 객체를 「그 slug가 빠진 scope 줄 또는 그 slug의 drop」으로 센다 · `day.mjs`가 5판 칸을 더 낸다 — 미검수는 사람 센서 unit만(state.mjs humanNeeded와 같은 셈) · 원장 fail/guard 줄과 되풀이 · decide/kept/RESPEC · 이음새 공격·출하 보고.
- `L2-day-conductor.md` 「5판의 차이」 + 아침·저녁 절의 그 줄(next 한 줄 · 미검수 사람 셈 · 범위 끝 system → report → SCOPE DONE · 반복 FAIL은 「막힌 것」 · KEPT · 기계 증명 카드도 친다 · REPORT를 저녁에 보인다) — 지시서는 그 회의 sha로 읽힌다.
- 백로그 L2 게이트 문장 「1주간」 → 세 라운드 누적(CEO 「날짜는 측정 단위가 아니다」 — 정의는 등록문) · HANDOFF 시작 절차·스냅샷(CEO 대기 결정에 「CEO-분의 기계 셈」 — 표의 「(CEO 기입)」은 L1 1차부터 한 번도 채워지지 않았다) · FIELD-BENCH 시계 검사 포인터.
- 검사: `tests/field.test.mjs`(clock 설정 넷 · preload가 자식 node의 시계·시간대를 옮긴다 · 실행 한 줄씩·`--only` · stream target 객체 · day 5판 칸 — 1일차 표의 미검수 기대값도 사람 센서 셈으로).

### Changed — 2026-10-03 HAZARDS에서 팩에 닿지 않는 7줄을 더 걷어 냈다 (산문 예산 36.9KB → 34.3KB) · 낡은 문서 정정 (CEO 「정리」)
- 재개 비용(CEO 「이미 완료되거나 필요 없는 문장은 컨텍스트에 올리지 않는다」): CHANGELOG는 최근 절만(102KB → 14KB) — 2026-09-29~10-02의 수리 기록은 `docs/changelog/2026-09-29-to-10-02.md`, v1 절은 `docs/changelog/v1.md` · 끝난 시험 기록 여섯(L1-TRIAL · L1-4-conductor · L2-TRIAL 1·2·3판 · FIELD-TRIAL)은 `docs/measurements/archive/` · 백로그의 L0·L1 완료 기록(상태 표 · P0~P2 · Q1~Q4 · 부록 B)은 `docs/changelog/backlog-L0-L1-2026-09-29.md` · FIELD-BENCH는 규칙(`FIELD-BENCH.md`)과 결과 원장(`FIELD-BENCH-LOG.md`)으로 · HANDOFF는 절 단위 포인터와 「파일을 통째로 읽지 않는다」 · CLAUDE.md에 정비 세션 한 줄(HANDOFF 시작 절차대로 — 자동으로 읽히는 유일한 파일). 재개에 읽는 양 ≈300KB → ≈60KB. 지운 기록은 없다 — 옮겼다.
- 문서 정리: GUIDE(main 클론 · 설치기가 doctor·selftest까지 한 번에 · 루프는 next.mjs · 판정선은 BIRTH·measurements로 · LACUNA 절 삭제) · BIRTH·PRINCIPLES·README(팩 여섯 · ship 8조건 · HAZARDS 줄 수 · spawn 설정 목록) · `docs/BED-BLOCK.md` 삭제(2판 윈도우 침대의 미실행 블록 — L2를 처음부터 다시 재기로 해 쓸 데가 없다, 교훈은 HANDOFF에) · HANDOFF 스냅샷 2026-10-03(동결 없음 · L2 재등록이 다음 일 · futsal 홀드아웃 소진) · L2-TRIAL-4에 「시작 전에 닫혔다」 줄.
- 2026-10-01의 기준(규칙집·main 전용 문서만 가리키는 줄은 팩에 영영 안 뜬다)을 배선(`.claude/**`·`.opencode/**`·`opencode.json`·`.githooks/**` — 가드가 막는다)과 `.worktrees/**`(팩의 바뀐 파일은 worktree 상대 경로라 맞을 수 없다)까지 넓혔고, 프레임워크 자신의 사고(이 저장소의 테스트·설치기)라 프로젝트 팩에 뜨면 소음인 두 줄도 걷었다. 기록은 여기: 훅의 침묵사(Windows 상대 경로, v1 — session-start alive 마커 + doctor + `${CLAUDE_PROJECT_DIR}` 절대 경로) · 서브에이전트가 컨텍스트 상한으로 죽으며 미커밋 작업이 사라짐(v1 — SubagentStop wip 체크포인트 + 팩 이어받기 절) · 정본 테스트의 win32 거짓 실패 6건(사고 18 — bash 탐색·fileURLToPath·구분자 정규화) · 설치기가 첫 커밋 실패를 삼킴(사고 19 — 첫 커밋 실패 = 설치 FAIL) · 가드의 원장 읽기·heredoc 오탐과 통과된 conductor의 mv·rm·cp(L2 1일차 — guard 단위 테스트) · 허용 목록에 없던 `cd <wt> && git …`·`git -C`(사고 27) · worktree의 스크립트 사본에 main의 정비가 닿지 않음(사고 31 — main의 같은 스크립트로 넘긴다). 검사: unit(HAZARDS 줄의 경로 — 배선·.worktrees도 닿지 않는 경로로 센다).

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

### 이전 절 — 옮겨 둔 기록 (2026-10-03, 재개에 읽는 양을 줄이려고 — 지운 줄은 없다)
- 2026-09-29~10-02의 수리·채용 기록(사고 1~59 · L0 수리 · L1 진입 · 필드 시험·벤치 · 홀드아웃 · HAZARDS 35줄 정리): `docs/changelog/2026-09-29-to-10-02.md`
- v1(역할극 트리, 2026-09-26~)의 절: `docs/changelog/v1.md`

### Removed from the install path
- 계획·비평·리뷰 라운드, per-step verifier, self-check, 메모리 파일, STATUS-team·METRICS 12열, hotfix·kickoff·brainstorm·retro 스킬, 문서 예산 훅, opencode 패리티. 근거: docs/catalogue/V1-ANALYSIS.md.
