# boot 팩 — 코드 0줄에서 뜨는 것까지 (kind scaffold, 이 unit은 이 팩 하나로 끝난다)

너는 이 프로젝트의 **첫 unit을 혼자 끝내는 컨텍스트**다. spec·attack 없이 ship된다. 그래서 쓰기 경계가 좁다: 매니페스트(package.json·pyproject.toml 등) · 런타임 고정 파일(.node-version 등) · `src/` 진입점 · `tests/unit/` 스모크 · `tests/harness/` · 규칙 파일(CLAUDE.md/AGENTS.md)의 `{{…}}` 자리 · README. 제품 기능은 쓰지 않는다 — 그건 다음 unit들의 일이다.

할 일 (작업 디렉터리 안에서)
1. 「원문」과 「BRIEF 발췌」를 읽고 스택을 정한다. 원문이 스택을 말하면 그대로. 말하지 않으면 제품 종류로 기본값을 택하고 `node .garagiste/scripts/work.mjs default <slug> "<스택과 이유 한 줄>"`에 남긴다(CEO가 한 마디로 뒤집는다). 유료·외부 서비스·설치 형태가 걸리면 코드 대신 `work.mjs ask <slug> "<질문>"`.
2. 매니페스트 · 런타임 고정 · 테스트 러너를 만든다. 새 의존성은 최소로, 라이선스 MIT/BSD/Apache/ISC만. 이 unit은 spike 없이 ship되므로 여기서 들이는 의존성이 곧 프로젝트의 사실이다 — 매니페스트에 이유를 한 줄 주석으로(가능한 형식이면) 또는 `work.mjs default`로 남긴다.
3. `src/`에 진입점 하나 — 실행하면 무엇인가 출력하고 0으로 끝난다. `tests/unit/`에 스모크 테스트 하나 — 진입점이 뜬다는 것만 단언한다.
4. 검증 명령 넷을 스크립트로 적는다(team.json은 직접 쓰지 않는다):
   `node .garagiste/scripts/work.mjs commands quick="<유닛 테스트만; tests/acceptance·tests/adversary 제외>" full="<전부>" test_file="<파일 하나 {file}>" run="<실행>"`
   규칙: quick은 acceptance·adversary를 포함하지 않는다(red로 커밋되는 것이 정상). full은 전부. test_file은 파일 경로 하나를 받아 그 파일만 돈다.
5. 규칙 파일의 자리를 채운다: `node .garagiste/scripts/work.mjs rules project="<이름>" one_line="<한 줄>"` — 명령 자리는 team.json에서 자동으로 온다. 규칙 파일에 문장을 더하지 않는다(20줄 상한).
6. `node .garagiste/scripts/verify.mjs quick` → PASS. 커밋: `scaffold(boot): <스택 한 줄>` + trailer `Unit: <slug>` · `Step: 1`. 게이트가 원장을 대조한다.
7. `node .garagiste/scripts/verify.mjs full` → PASS. 끝.

하지 않는 것: 기능 코드 · 인수 테스트 · CI 워크플로 · 외부 서비스 연결 · 규칙집(.garagiste/*·.claude/*) 편집.
마지막 출력 세 줄: 스택 한 줄 · 명령 넷 · `verify full` 결과.
