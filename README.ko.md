# GARAGISTE — kit

팀을 만들지 않고, 하네스 하나(Claude Code 또는 opencode)가 당신의 저장소에서 덜 헤매고 덜 거짓말하게 하는 작은 키트. 하네스가 스스로 알 수 없는 것만 더한다 — 얇은 `AGENTS.md` 지도(코드에 없는 사실), 요청 세 칸의 습관, 검사 결과 한 줄, 그리고 한 기계에 한 번 놓는 당신의 일하는 방식. 훅 없음, 상태 기계 없음, 원장 없음, 페르소나 없음.

기본은 지침만이다. 스크립트 둘(`check` · `tests-for` — 검사 결과 한 줄과 로그, 변경 파일 → 테스트)은 사고가 나는 날을 위해 남겨 두었다(`--with-scripts`).

## 설치 — 세 층
```
node <GARAGISTE>/kit/install.mjs global                       # 한 기계에 한 번: 일하는 방식 + /kit-init 스킬
node <GARAGISTE>/kit/install.mjs claude   --project <repo>    # 저장소마다 한 번: AGENTS.md · CLAUDE.md(@AGENTS.md) · .gitignore
node <GARAGISTE>/kit/install.mjs opencode --project <repo>    #                  AGENTS.md · .opencode/agents/{build,review}.md · .gitignore
```
그 저장소의 첫 세션에서 `/kit-init`. 검사 명령을 채우고, `docs/ARCHITECTURE.md`를 쓰고, 지도에는 거의 모든 요청에서 필요한 것만 옮긴다. 그 뒤로는 요청마다 세 칸이다 — 무엇을, 아는 위치, 끝의 기준.

## 읽을 것
- [kit/README.md](kit/README.md) — 파일마다 하는 일, 지침의 세 필터, 일부러 없는 것, 스크립트를 켜는 조건
- [docs/DECISIONS.md](docs/DECISIONS.md) — 결정과 이유. 2026-10-31 항목들이 v3

## 검증
```
node --test tests/kit.test.mjs
```

## 이력
v2 「증거 팀」(팩 일곱 · 훅과 플러그인 · 원장 · conductor · 커밋 게이트)은 2026-09-29부터 2026-10-31까지 `team/`에 있었고 브랜치 `v2`에 통째로 남아 있다. v1은 브랜치 `v1`. v3는 어느 쪽 파일도 물려받지 않는다 — 이유는 `docs/DECISIONS.md`의 2026-10-31 항목에.
