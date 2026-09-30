# HAZARDS — 사고 1건 = 검사 1개

줄 형식: `- \`<경로 패턴>\` … · <사고 한 줄> · 검사: <테스트·프로브·훅·스크립트>`. 경로 패턴이 없는 줄은 brief가 팩에 넣지 않고 doctor가 거부한다. 산문 규칙은 여기 쓰지 않는다 — 검사가 없으면 줄도 없다.

- `**/electron/**` `**/renderer/**` · 렌더러가 하얀 화면인데 ready 이벤트는 발화해 스모크가 통과했다 · 검사: boot 스모크는 실제 진입점 실행 + 이 줄이 팩에 뜨면 attack이 실제 기동 부정 테스트(pageerror 0·DOM 마커)를 tests/adversary에 남긴다(attack 팩 4)
- `**/package.json` `**/pyproject.toml` `build/**` · 패키징 산출물에 라이선스 미확인 의존성이 동봉됐고 설치 형태를 정한 사람이 없었다 · 검사: spike 필수 행 license·default + 산출물 스캔
- `**/subprocess*` `**/child_process*` `**/*spawn*` · 네트워크 0 규칙이 자식 프로세스에서 세 번 재발했다 — 가드 없는 자식은 트래픽을 시도하지 않아 센서가 침묵했다 · 검사: 이 줄이 팩에 뜨면 attack이 자식 프로세스 양성 캐너리(막히지 않으면 red)를 tests/adversary에 남긴다(attack 팩 4)
- `**/session*` `**/persist*` · 세션 영속화가 홈 디렉터리에 썼다 · 검사: 이 줄이 팩에 뜨면 attack이 홈 디렉터리 쓰기 부정 테스트를 남긴다(attack 팩 4) + verify 로그의 산출 경로 확인
- `docs/**` `**/*.md` · 문서만 고친 커밋이 main을 빨갛게 했다(무검증 커밋) · 검사: 커밋 게이트 — 모든 커밋 tree↔quick PASS(verify.mjs gate)
- `.claude/hooks/**` `.claude/settings.json` `.opencode/plugins/**` `opencode.json` · Windows에서 훅이 조용히 죽었다(상대 경로) — 경계가 없는 세션이 정상처럼 돌았다 · 검사: session-start alive 마커 + doctor 감별 진단 + `${CLAUDE_PROJECT_DIR}` 절대 경로
- `.worktrees/**` · 서브에이전트가 컨텍스트 상한으로 죽으며 미커밋 작업이 사라졌다 · 검사: SubagentStop wip 체크포인트(spawn-log.mjs) + 팩 이어받기 절(brief.mjs)
- `tests/**` `.garagiste/ledger/**` · 초록을 만들기 위해 테스트·설정·원장을 고쳤다 · 검사: ship redproof(base red·head green, tree 단위) + 커밋 게이트 tree↔원장 대조 + guard의 원장·규칙집·commands·마커 쓰기 거부
- `**/*install*` `**/*bundle*` · 출하물의 설치 형태가 조용한 기본값으로 정해졌다 · 검사: boundary 키워드 → spike 필수 행 default + `work.mjs default` → 「팀이 정한 것」
- `**` · 리눅스 관측이 Windows 기동을 대신 통과시켰다 · 검사: 원장 platform 필드 + `@sensor human@win32` 주장은 tried 전까지 참이 아니다(claims.mjs)
- `**` · 19시간 무인 실행이 규칙집을 완화해 드리프트했다 · 검사: guard `.garagiste/**` 쓰기 거부 + 무인 출하 예산 + CEO 접점 없는 unit 연속 상한(ship.mjs)
- `.garagiste/scripts/**` · ship의 machine_os 필터가 win32의 정당한 full PASS를 거부했다(첫 Windows 실기) · 검사: platform은 원장 기록만, 대상-OS 보증은 @sensor 태그(claims.mjs) — 필터 부재를 unit 테스트가 고정
- `.garagiste/scripts/**` · Windows에서 repoRoot(git, 슬래시)와 mainRoot(path.resolve, 역슬래시)가 달라 decide·drop·tried가 메인 저장소에서도 거부됐다 · 검사: 경로는 비교 전 realpath 정본화 — repoRoot===mainRoot 불변식 테스트
- `.garagiste/scripts/**` · 가드가 규칙집 읽기(cat·sed -n)까지 쓰기로 오탐해 conductor의 진단을 막았다(첫 Windows 실기) · 검사: 쓰기 verb·리다이렉트만 거부 — guard 단위 테스트(cat·sed -n 허용, sed -i·리다이렉트 거부)
- `.garagiste/scripts/**` · boot 팩에 CEO의 닫힌 결정(Q1)과 BRIEF 부록(40줄 컷 밖)이 빠져 확정된 스택 대신 기본값이 깔렸다(첫 Windows 실기) · 검사: 모든 팩에 닫힌 결정 전체 + BRIEF는 전문(boot 상한은 intake처럼 4×) — e2e가 팩 내용을 고정
- `.garagiste/scripts/**` · 가드가 커밋 메시지 트레일러(<…>)의 >를 리다이렉트로 오탐해 커밋을 거부했다(첫 Windows 실기) · 검사: 따옴표 안은 데이터, $()·백틱만 실행으로 남김(stripQuoted) — guard 단위 테스트
- `.garagiste/scripts/**` · models가 규칙집(team.json·agents)을 main에 고쳐 두고 커밋 경로가 없어 ship이 막혔다(2차 실기) · 검사: models는 산출물을 스스로 scaffold(team) 커밋(내부 SHIP·WIP 차선) — e2e(models 뒤 main 깨끗)
- `.garagiste/scripts/**` · main의 models 커밋과 boot의 commands 커밋이 team.json에서 rebase 충돌 — FAIL 문구가 scaffold에 없는 build 팩을 가리켜 spawn 1회를 낭비시켰다(2차 실기) · 검사: 키 단위 3-way 기계 병합(mergeTeamJson) + kind 맞는 팩 이름 — unit·e2e 테스트
- `.garagiste/scripts/**` `.garagiste/team.json` · 첫 실제 build 팩(12KB)이 상한 8KB를 넘어 루프가 멈췄다 — 상한은 실측 없는 추정이었고, 초과분은 법(인수 5.4KB)이 아니라 부대물이었다(2차 실기) · 검사: 기본 상한 16KB + fit이 이어받기·try·surface를 포인터로 강등(법은 불가침) — unit 테스트
- `.garagiste/scripts/**` · redproof·verify attack을 메인 루트에서 돌리면 인수·adversary 파일이 0개라 red 0/0 거짓 초록이 나왔다(2차 실기 — ship 8조건이 막긴 했지만 라운드를 낭비) · 검사: slug 작업은 어디서 불러도 unit worktree가 뿌리(slugRoot) — e2e가 메인 루트 호출을 고정
- `**/vitest.config*` `**/*.config.*` `.garagiste/packs/boot.md` · 메인 full이 `.worktrees/` 아래 진행 중 unit의 red 테스트까지 쓸어 담았고, 의존성은 사라진 unit worktree에만 설치돼 다음 unit이 결정된 스택(zod)을 맨손으로 우회했다(2차 실기) · 검사: boot 팩의 러너 exclude 규칙 + ship이 매니페스트 변경 출하에 메인 설치 NOTE — e2e
- `.garagiste/scripts/**` · globToRegex가 `**/`의 /를 삼켜 `**/schema/**`가 vault-schema/처럼 schema로 끝나는 폴더까지 물었다 — 거짓 boundary HIT가 순수 로직 unit의 ship을 spike 미완으로 막았다(2차 실기) · 검사: `**/`는 `(.*/)?`(온전한 세그먼트) — glob 단위 테스트(vault-schema 재현 포함)
- `.garagiste/scripts/**` · sh()의 stdout trim이 porcelain 첫 줄( M …)의 선행 공백을 지워 dirtyFiles가 경로 첫 글자를 먹었다(ocs/BACKLOG.md) — DOC_OK인 파일이 목록 밖으로 보여 ship을 거짓으로 막았다(2차 실기) · 검사: dirtyFiles는 원문 stdout — 비스테이징 수정 재현 단위 테스트
- `.garagiste/scripts/**` · '닫힌 결정 전체를 모든 팩에'(사고 4의 수리)가 프로젝트 나이에 비례해 팩을 키웠다 — 선행 사슬이 길수록 상한에 닿는다(2차 실기, build 팩 15.7/16KB) · 검사: 결정은 스코프(전역 intake + 이 unit + needs의 unit·Q; boot·intake 팩만 전체) — 단위·e2e 테스트
- `.garagiste/scripts/**` `.garagiste/packs/spike.md` · spike가 「default (팀이 정한 것 후보):」처럼 부연을 붙이자 내용 있는 행이 미완으로 읽혔다 — 재spawn해도 같은 형식이라 루프가 돌 수 없었다(2차 실기) · 검사: spikeComplete가 괄호 부연 허용 + 팩에 행 형식 명시 — unit 테스트
- `.garagiste/scripts/**` · 커밋 금지 팩(spike)의 worktree를 체크포인트 훅이 wip로 커밋해 tree가 바뀌었다 — full·redproof·attack 증거가 전부 낡고 HEAD가 wip이 됐다(2차 실기) · 검사: checkpoint는 unit 상태 spike를 건너뛴다(측정은 초 단위 재실행이 싸다) — unit 테스트
- `.garagiste/scripts/**` · 사고 14·15 수리의 후속 — 하위 불릿에 내용을 둔 spike 행이 미완으로 읽혔고, 늦은 spike 뒤 build는 할 일이 없어 측정 파일을 다시 wip로 커밋해 ship이 같은 두 줄로 반복 실패했다(2차 실기) · 검사: 행 내용은 같은 줄 또는 더 깊은 들여쓰기 줄 + spike 파일만의 wip HEAD는 ship이 docs(spike)로 amend 승격(tree 불변·증거 유효) — unit 테스트
- `tests/**` `.garagiste/scripts/lib.mjs` · 정본 테스트가 win32 원격 클론에서 6건 거짓 실패 — e2e의 bash 미탐색(spawn null)·URL.pathname 경로(/C:/…)·depDirs 역슬래시·폴더 이름(GARAGISTE) 가정(3차 준비 검증이 잡음) · 검사: bash 탐색 + 없으면 명시 SKIP, fileURLToPath, 구분자 정규화, 경로 비교 — win32 재실행이 확인
- `.garagiste/scripts/lib.mjs` · workTree의 씨앗이 read-tree HEAD라 filemode=false(NTFS)에서 HEAD에 없는 chmod 파일(755)이 임시 인덱스에 644로 들어가 「인덱스 ≠ 작업 트리」 유령 불일치 — 내용 diff 0인데 게이트가 거부(win32 원격 검증) · 검사: 실제 인덱스 복사본을 씨앗으로 — filemode=false 재현 unit 테스트
- `install.sh` `install.ps1` · 설치기가 첫 커밋 실패를 경고로 삼키고 성공을 선언했다(fail-open — doctor·selftest만 fail-closed였다) · 검사: 첫 커밋 실패 = 설치 FAIL(exit 1), git 출력이 이유로 남는다
