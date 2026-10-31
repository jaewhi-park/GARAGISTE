---
name: kit-init
description: kit을 막 설치한 저장소에서 처음 한 번 돌리는 첫 분석 — kit/check.json의 층별 명령을 채우고, 코드베이스를 훑어 docs/ARCHITECTURE.md를 쓰고, AGENTS.md 지도에는 거의 모든 요청에서 필요한 사실만 옮긴다. 사용자가 부를 때만 돈다.
disable-model-invocation: true
---

# kit-init — 첫 분석

이 저장소에 kit이 설치되어 있다(`AGENTS.md`, 스크립트 판이면 `kit/check.mjs` · `kit/tests-for.mjs` · `kit/check.json`도). 아래를 순서대로 한다. 각 단계의 끝은 검사 가능한 한 줄이다.

## 1. 검사 명령을 채운다
- 매니페스트(package.json · pyproject.toml · go.mod · Cargo.toml 등)와 기존 CI 설정에서 이 저장소가 **이미 쓰는** 테스트 · 타입체크 · lint 명령을 찾는다. 새로 발명하지 않는다.
- `AGENTS.md` 검사 절의 quick · module · full을 채운다. quick: 타입체크와 lint. module: `{files}` 자리가 있는, 파일을 받는 테스트 명령(예: `node --test {files}` · `pytest {files}` · `go test {files}`). full: 전부.
- 스크립트 판(`kit/check.json`이 있는 저장소)이면 그 파일의 `layers`도 같은 값으로 채우고, `node kit/tests-for.mjs <소스 파일 하나>`로 매핑이 나오는지 본다. 안 나오면 이 저장소의 테스트 배치에 맞는 패턴을 `tests` 배열에 적는다.
- 끝: full 명령이 통과한다. 결과는 `PASS full` 한 줄로 말하고 원본 출력은 `kit/log/`에 남긴다. 이미 빨간 테스트가 있으면 그 사실을 보고에 적는다. 불안정 테스트 목록(AGENTS.md의 목록 또는 `kit/flaky.txt`)에는 적지 않는다 — 사람이 관리한다.

## 2. docs/ARCHITECTURE.md를 쓴다
- 첫 줄에 날짜. 모듈과 책임, 진입점, 데이터 흐름, 코드에 없는 결정과 그 흔적(커밋 메시지 · 주석 · 이슈 링크).
- 파일 목록 · 함수 목록 · 시그니처는 적지 않는다. grep이 안다.
- 모르는 것은 「확인 못 함」으로 적는다. 추측을 사실처럼 적지 않는다.

## 3. AGENTS.md 지도를 채운다
- ARCHITECTURE.md에서 거의 모든 요청에 필요한 것만 옮긴다. 모듈의 책임과 경계, 진입점, 비슷한 둘 중 정본, 건드리면 안 되는 곳과 이유.
- 검사 절의 명령이 1단계와 맞는지 본다.
- ARCHITECTURE.md를 가리키는 한 줄을 넣는다. `@`로 끌어오지 않는다 — 매번 읽히면 docs에 뺀 뜻이 없다.
- 지도의 항목은 한 줄이다. 한 줄로 적히지 않는 사실은 ARCHITECTURE.md에 두고 지도에는 가리키는 한 줄만.
- 작업 방식 절은 손대지 않는다.

## 보고
돌린 명령과 그 한 줄 결과, 쓴 파일 셋, 확인 못 한 것. 그 이상은 적지 않는다.
