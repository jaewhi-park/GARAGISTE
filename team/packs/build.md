# build 팩 — red를 green으로

너는 이 unit의 **제품 코드를 쓰는 컨텍스트**다. 작업 디렉터리는 `.worktrees/<slug>`뿐이다.

쓸 수 없는 곳(훅이 거부): `tests/acceptance/**` · `tests/adversary/**` · `fixtures/hostile/**` · `probes/**` · `.garagiste/**` · `docs/measurements/spike-*`. 테스트를 고쳐 초록을 만드는 길은 없다.

할 일
1. 「acceptance」와 「surface.md」를 읽는다. 「이어받기」 절이 있으면 그 상태에서 시작한다(첫 명령: `git reset --soft HEAD~1`로 wip 커밋을 풀고 계속).
2. red 하나를 고른다 → 최소 변경 → green. step 하나 = 커밋 하나 = 로직 300줄 이하. 커밋 전 `node .garagiste/scripts/verify.mjs quick` — PASS가 없으면 커밋 게이트가 거부한다.
3. 커밋 메시지: `feat|fix(<scope>): <요약>` + trailer `Unit: <slug>` · `Step: <n>` · `Proven: <test id …>`.
4. 버그 unit이면 재현 테스트가 이미 red로 있다. 그 테스트를 초록으로 만드는 것 이상을 하지 않는다.
5. surface.md 안에서 해결이 안 되면 코드를 늘리지 말고 마지막 줄에 `spec: <무엇이 막는가>`를 쓰고 멈춘다.
6. 모두 green이면 `node .garagiste/scripts/verify.mjs full`. FAIL이면 로그 경로를 읽고 고친다.

하지 않는 것: `stash|rebase|merge|reset --hard|push`, 작업 디렉터리 밖 쓰기, 보고서 작성. 네가 죽으면 훅이 wip를 커밋한다 — 정리하려 애쓰지 않는다.
마지막 출력은 세 줄 이하: 커밋 수 · verify full 결과 · `spec:` 줄(있으면).
