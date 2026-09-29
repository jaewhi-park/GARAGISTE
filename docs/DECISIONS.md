# DECISIONS — GARAGISTE

- 2026-09-29 · **v2 「증거 팀」으로 재시작.** v1(agents 7·skills 31·hooks 4·opencode 플레이버)은 역할극이었다: 측정 결과 결함을 잡은 것은 별도 컨텍스트의 correctness+security 리뷰와 「돌려 봄」 둘뿐(docs/catalogue/V1-ANALYSIS.md). v2는 v1 트리에서 한 파일도 물려받지 않는다. v1 트리(`claude/`·`opencode/`·`scripts/`·`assets/`)의 삭제는 CEO 결정으로 남긴다 — 삭제 명령: `git rm -r claude opencode scripts assets`.
- 2026-09-29 · **장치는 원장에서만 태어난다.** `docs/catalogue/DEVICES.md`(v2 설계 75 KB)는 계획이 아니라 후보 카탈로그다. 사고 없이 장치 없다(docs/BIRTH.md).
- 2026-09-29 · **둘의 규칙.** 스크립트는 프로젝트 안에서 태어나고 두 번째 프로젝트가 필요로 할 때 `team/`으로 올라온다. Day 0 안전벨트(deny·guard·verify·gate·ship·work·brief·redproof·boundary·claims·state·doctor)는 예외로 처음부터 `team/`에 있다.
- 2026-09-29 · **quick은 tests/acceptance·tests/adversary를 포함하지 않는다.** 둘은 red 상태로 커밋되는 것이 정상이라, 커밋 게이트의 quick PASS 요구와 충돌한다. full은 전부 포함하고 ship은 full을 요구한다.
- 2026-09-29 · **팩의 쓰기 경계는 worktree 마커(`.garagiste-pack`)로 판정한다.** 훅은 어느 에이전트가 도구를 부르는지 모른다. brief.mjs가 팩을 만들 때 마커를 쓰고, 한 unit에 한 팩만 동시에 산다는 규약이 그 판정을 정직하게 한다.
- 2026-09-29 · **팀 정본은 `.garagiste/`, 하네스 배선은 `.claude/`·`opencode.json`+`.opencode/`.** 스크립트·팩·HAZARDS·team.json·원장·unit 상태는 하네스와 무관하고, 경계 규칙도 `guard-rules.mjs` 하나를 Claude 훅과 opencode 플러그인이 같이 부른다. 규칙이 두 곳에 사는 순간 갈라진다(v1 parity-check가 그 증상이었다).
- 2026-09-29 · **에이전트는 있다, 페르소나가 없다.** 팩 넷은 spawn 설정 한 장(모델·도구·"팩 경로 한 줄을 읽고 그대로 한다")으로만 존재한다. 정체는 쓰기 경계이고 그 경계는 훅/플러그인이 지킨다. opencode는 conductor를 primary agent(edit 권한 없음)로 하나 더 둔다 — 메인 세션이 곧 conductor인 Claude Code와 달리 opencode는 primary agent 정의가 필요하다.
- 2026-09-29 · **opencode 모델은 기본 provider/model을 상속한다.** opencode 모델 id는 provider마다 다르고 자주 바뀌어 예산표에서 추측하지 않는다. 팩별 모델은 `.opencode/agents/<pack>.md` 앞머리에 CEO가 직접 쓴다.
- 2026-09-29 · **입력 단위는 대화 전체다.** `work brief`가 원문을 축적하고 intake 팩이 BACKLOG unit 줄로 쪼갠다. "PRD를 넣을 곳이 없다"는 CEO가 부딛힌 첫 사고라 탄생 규칙 안에서 만들었다. intake는 파일을 쓰지 않는다 — `work add`·`work ask intake` 두 명령만.
- 2026-09-29 · **선행은 관례가 아니라 간선이다.** BACKLOG 줄의 `needs`는 주장 그래프의 의존 간선이고, `work scope`가 닫힘을 계산해 "요청 n · 선행 m · 순서"로 역제안한다. CEO의 답은 둘뿐: 받는다(`seed`) · 선행을 뺀다(`--no-needs`, 원장 기록). hard 결정에 기대는 unit은 `needs: Q<n>`으로 답이 올 때까지 WAIT.
- 2026-09-29 · **conductor는 쓰지 않는다 — 훅이 강제한다.** `.worktrees/` 밖 Edit/Write는 거부. 메인 worktree의 문서는 스크립트(work.mjs)만 쓴다. 일반 편집 세션은 `GARAGISTE_ADMIN=1`. 산문 규칙이었던 것을 코드로 옮긴 첫 사례.
