# boot 팩 — 코드 0줄에서 뜨는 것까지 (kind scaffold, 이 unit은 이 팩 하나로 끝난다)

너는 이 프로젝트의 **첫 unit을 혼자 끝내는 컨텍스트**다. spec·attack 없이 ship된다. 그래서 쓰기 경계가 좁다: 매니페스트(package.json·pyproject.toml 등) · 런타임 고정 파일(.node-version 등) · `src/` 진입점 · `tests/unit/` 스모크 · `tests/harness/` · 규칙 파일(CLAUDE.md/AGENTS.md)의 `{{…}}` 자리 · README. 제품 기능은 쓰지 않는다 — 그건 다음 unit들의 일이다.

할 일 (작업 디렉터리 안에서)
1. 「원문」과 「BRIEF 발췌」를 읽고 스택을 정한다. 원문이 스택을 말하면 그대로. 말하지 않으면 제품 종류로 기본값을 택하고 `node .garagiste/scripts/work.mjs default <slug> "<스택과 이유 한 줄>"`에 남긴다(CEO가 한 마디로 뒤집는다). 유료·외부 서비스·설치 형태가 걸리면 코드 대신 `work.mjs ask <slug> "<질문>"`.
2. 매니페스트 · 런타임 고정 · 테스트 러너를 만든다. 새 의존성은 최소로, 라이선스 MIT/BSD/Apache/ISC만. 이 unit은 spike 없이 ship되므로 여기서 들이는 의존성이 곧 프로젝트의 사실이다 — 매니페스트에 이유를 한 줄 주석으로(가능한 형식이면) 또는 `work.mjs default`로 남긴다.
3. `src/`에 진입점 하나 — 실행하면 무엇인가 출력하고 0으로 끝난다. `tests/unit/`에 스모크 테스트 하나 — 진입점이 뜬다는 것만 단언한다.
4. 검증 명령 넷을 스크립트로 적는다(team.json은 직접 쓰지 않는다):
   `node .garagiste/scripts/work.mjs commands quick="<유닛 테스트만; tests/acceptance·tests/adversary 제외>" full="<전부>" test_file="<파일 하나 {file} — 여러 파일을 한 번에 받는 러너면 {files}>" run="<실행>" setup="<의존성 설치, 예: npm ci>"`
   setup은 의존성 설치 명령 — 의존성이 바뀌는 출하에서 ship이 머지 직후 main에서 돌린다(사고 21). 지금 의존성이 0이어도 생태계의 설치 명령(npm install · pip install -e . · uv sync)을 쓴다 — 뒤 unit이 더한다(사고 34).
   규칙: quick은 acceptance·adversary를 포함하지 않는다(red로 커밋되는 것이 정상). full은 전부. test_file은 받은 경로의 파일만, 이름과 무관하게 그대로 돈다 — 하이픈 이름도(slug에 하이픈이 든다 · ship이 인수·공격 자리의 깨진 탐침으로 본다). {files}면 공백으로 이은 경로들 — full이 인수·공격 파일을 한 번에 돈다.
   러너 설정이 `.worktrees/`를 쓸어 담지 않게 하라 — include를 `tests/`로 좁히거나 `.worktrees/**`를 exclude. 안 하면 진행 중 unit의 red가 메인 full을 오염시킨다(2차 실기 사고).
   생태계별 검증된 꼴 — 벤치·홀드아웃의 사고에서 나온 것이다. 다른 꼴을 택하면 ship의 탐침(깨진 파일을 test_file로 — 사고 57)이 거부한다:
   - 공통: `.gitattributes`에 `* text=auto eol=lf`(윈도우 체크아웃이 CRLF로 바꿔 shebang 검사가 깨졌다 — L2 2판 ×4) · `.gitignore`에 산출물(`node_modules/` `__pycache__/` `*.egg-info/` `.venv/` `dist/` `build/` — 사고 29·38) · setup은 의존성 0이어도 생태계의 설치 명령(사고 34).
   - Node: quick `node --test "tests/unit/**/*.test.mjs"` · full `node --test "tests/**/*.test.mjs"` · test_file `node --test {files}` · setup `npm install` — 디렉터리 인자(`node --test tests/unit/`)는 node 22에서 실패한다, glob으로.
   - Python: `unittest discover`·pytest 기본 패턴은 하이픈 이름(`add-entry.py`)을 0건 실행·exit 0으로 넘긴다(사고 44·57) — test_file은 받은 파일 경로를 importlib로 적재해 돌리는 하네스(`python tests/harness/run.py {files}`), full도 그 하네스로 인수·공격 파일까지 · setup `pip install -e .` 또는 `uv sync`.
   - Go: 한 디렉터리가 한 패키지 — test_file은 같은 디렉터리의 파일만 한 번에 받고(사고 53) 인수·공격 파일은 혼자 컴파일돼야 한다(사고 56 — 도우미는 그 파일 안에) · 캐시는 verify가 `-count=1`로 끈다(사고 54) · setup `go mod download`.
5. 규칙 파일의 자리를 채운다: `node .garagiste/scripts/work.mjs rules project="<이름>" one_line="<한 줄>"` — 명령 자리는 team.json에서 자동으로 온다. 규칙 파일에 문장을 더하지 않는다(20줄 상한).
6. `node .garagiste/scripts/verify.mjs quick` → PASS. 커밋: `scaffold(boot): <스택 한 줄>` + trailer `Unit: <slug>` · `Step: 1`. 게이트가 원장을 대조한다.
7. `node .garagiste/scripts/verify.mjs full` → PASS. 끝.

하지 않는 것: 기능 코드 · 인수 테스트 · CI 워크플로 · 외부 서비스 연결 · 규칙집(.garagiste/*·.claude/*) 편집.
마지막 출력 세 줄: 스택 한 줄 · 명령 넷 · `verify full` 결과.
