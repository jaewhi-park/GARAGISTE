# HAZARDS — 사고 1건 = 검사 1개

줄 형식: `- \`<경로 패턴>\` … · <사고 한 줄> · 검사: <테스트·프로브·훅·스크립트>`. 경로 패턴이 없는 줄은 brief가 팩에 넣지 않고 doctor가 거부한다. 산문 규칙은 여기 쓰지 않는다 — 검사가 없으면 줄도 없다.

- `**/electron/**` `**/renderer/**` · 렌더러가 하얀 화면인데 ready 이벤트는 발화해 스모크가 통과했다 · 검사: probes/smoke — pageerror 0 + DOM 마커 + 페이지에서 시작한 IPC 왕복
- `**/package.json` `**/pyproject.toml` `build/**` · 패키징 산출물에 라이선스 미확인 의존성이 동봉됐고 설치 형태를 정한 사람이 없었다 · 검사: spike 필수 행 license·default + 산출물 스캔
- `**/subprocess*` `**/child_process*` `**/*spawn*` · 네트워크 0 규칙이 자식 프로세스에서 세 번 재발했다 — 가드 없는 자식은 트래픽을 시도하지 않아 센서가 침묵했다 · 검사: probes/child-env 양성 캐너리(막히지 않으면 FAIL) + Popen 감사
- `**/session*` `**/persist*` · 세션 영속화가 홈 디렉터리에 썼다 · 검사: verify full을 샌드박스에서 + 내용 캐너리
- `docs/**` `**/*.md` · 문서만 고친 커밋이 main을 빨갛게 했다(무검증 커밋) · 검사: 커밋 게이트 — 모든 커밋 tree↔quick PASS(verify.mjs gate)
- `.claude/hooks/**` `.claude/settings.json` · Windows에서 훅이 조용히 죽었다(상대 경로) · 검사: session-start alive 마커 + doctor 감별 진단 + `${CLAUDE_PROJECT_DIR}` 절대 경로
- `.worktrees/**` · 서브에이전트가 컨텍스트 상한으로 죽으며 미커밋 작업이 사라졌다 · 검사: SubagentStop wip 체크포인트(spawn-log.mjs) + 팩 이어받기 절(brief.mjs)
- `tests/**` `.claude/ledger/**` · 초록을 만들기 위해 테스트·설정·원장을 고쳤다 · 검사: 커밋 게이트 test-id red-proof + 원장은 스크립트만 쓴다(guard.mjs)
- `**/*install*` `**/*bundle*` · 출하물의 설치 형태가 조용한 기본값으로 정해졌다 · 검사: boundary 키워드 → spike 필수 행 default + `work.mjs default` → 「팀이 정한 것」
- `**` · 리눅스 관측이 Windows 기동을 대신 통과시켰다 · 검사: 원장 platform 필드 + `@sensor human@win32` 주장은 tried 전까지 참이 아니다(claims.mjs)
- `**` · 19시간 무인 실행이 규칙집을 완화해 드리프트했다 · 검사: guard `.claude/**` 쓰기 거부 + 무인 출하 예산 + CEO 접점 없는 unit 연속 상한(ship.mjs)
