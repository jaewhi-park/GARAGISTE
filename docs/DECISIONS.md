# DECISIONS — GARAGISTE

- 2026-09-29 · **v2 「증거 팀」으로 재시작.** v1(agents 7·skills 31·hooks 4·opencode 플레이버)은 역할극이었다: 측정 결과 결함을 잡은 것은 별도 컨텍스트의 correctness+security 리뷰와 「돌려 봄」 둘뿐(docs/catalogue/V1-ANALYSIS.md). v2는 v1 트리에서 한 파일도 물려받지 않는다. v1 트리(`claude/`·`opencode/`·`scripts/`·`assets/`)의 삭제는 CEO 결정으로 남긴다 — 삭제 명령: `git rm -r claude opencode scripts assets`.
- 2026-09-29 · **장치는 원장에서만 태어난다.** `docs/catalogue/DEVICES.md`(v2 설계 75 KB)는 계획이 아니라 후보 카탈로그다. 사고 없이 장치 없다(docs/BIRTH.md).
- 2026-09-29 · **둘의 규칙.** 스크립트는 프로젝트 안에서 태어나고 두 번째 프로젝트가 필요로 할 때 `team/`으로 올라온다. Day 0 안전벨트(deny·guard·verify·gate·ship·work·brief·redproof·boundary·claims·state·doctor)는 예외로 처음부터 `team/`에 있다.
- 2026-09-29 · **quick은 tests/acceptance·tests/adversary를 포함하지 않는다.** 둘은 red 상태로 커밋되는 것이 정상이라, 커밋 게이트의 quick PASS 요구와 충돌한다. full은 전부 포함하고 ship은 full을 요구한다.
- 2026-09-29 · **팩의 쓰기 경계는 worktree 마커(`.claude-pack`)로 판정한다.** 훅은 어느 에이전트가 도구를 부르는지 모른다. brief.mjs가 팩을 만들 때 마커를 쓰고, 한 unit에 한 팩만 동시에 산다는 규약이 그 판정을 정직하게 한다.
