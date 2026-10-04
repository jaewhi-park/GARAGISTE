# adopt 팩 — 기존 코드를 팀의 센서 안으로 (kind adopt, 이 unit은 이 팩 하나로 끝난다)

너는 **기존 코드가 있는 저장소의 첫 unit을 혼자 끝내는 컨텍스트**다. 제품 코드는 한 줄도 바꾸지 않는다 — 이 unit의 증명은 「현재 동작이 그대로다」이다. spec·attack 없이 ship된다.

쓸 수 있는 곳: `tests/unit/`(특성화 테스트) · `tests/harness/` · `.gitignore` · `.gitattributes` · 규칙 파일(CLAUDE.md/AGENTS.md)의 `{{…}}` 자리 · `docs/units/<slug>/`. 그 밖(소스·기존 테스트·매니페스트)은 훅이 거부한다.

할 일 (작업 디렉터리 안에서)
1. 「저장소 지도」와 「원문」을 읽는다. 스택·러너·진입점은 저장소가 이미 정했다 — 바꾸지 않는다. 의존성이 더 필요하면 코드 대신 `node .garagiste/scripts/work.mjs ask <slug> "<질문>"`.
2. 특성화 테스트를 `tests/unit/`에 쓴다 — 지금 동작을 외부 표면(CLI·HTTP·파일 산출물)으로 굳힌다: 원문이 「바꾸지 않는다」고 한 명령·형식마다 하나 이상, 저장소 밖 임시 폴더에서 돈다. 버그로 보이는 동작도 그대로 굳힌다(마지막 출력에 `defect: <재현 한 줄>` — BACKLOG 후보가 된다)다 — 고칠지는 CEO의 일: `work.mjs ask <slug> "<이 동작을 그대로 둘까>"`.
3. 기존 테스트가 빨간 채라면 고치지 않는다 — quick·full에서 그 파일을 빼고 `work.mjs ask <slug> "<이 테스트를 어떻게 할까>"`로 올린다. 초록인 기존 테스트는 quick에 넣는다.
4. 검증 명령을 적는다: `node .garagiste/scripts/work.mjs commands quick="<특성화 + 초록인 기존 테스트>" full="<전부>" test_file="<파일 하나 {file}|{files}>" run="<실행>" setup="<의존성 설치>"` — 러너는 저장소의 것. boot 팩 4의 「생태계별 검증된 꼴」은 여기도 법이다: test_file은 받은 파일을 이름과 무관하게 그대로, `.gitattributes`에 `* text=auto eol=lf`, `.gitignore`에 산출물.
5. 규칙 파일의 자리: `node .garagiste/scripts/work.mjs rules project="<이름>" one_line="<한 줄>"`.
6. `node .garagiste/scripts/verify.mjs quick` → PASS. 커밋: `adopt(<slug>): <러너 한 줄>` + trailer `Unit: <slug>` · `Step: 1`. `verify.mjs full` → PASS. 끝.

하지 않는 것: 소스·기존 테스트·매니페스트 수정 · 기능 · 리팩터 · CI · 규칙집(.garagiste/*·.claude/*) 편집.
마지막 출력 세 줄: 특성화 테스트 수 · 명령 넷 · `verify full` 결과(빨간 기존 테스트가 있으면 질문 수).
