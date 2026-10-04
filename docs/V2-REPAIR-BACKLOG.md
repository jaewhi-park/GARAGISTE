# v2 수리·요구 백로그 — 6개 레포 부검에서

2026-09-29 · 대상: v2 「증거 팀」(브랜치 `claude/garagiste-process-efficiency-qygydj`) · 근거: G1 3주 부검(GARAGISTE 120c · LACUNA 257c · AX_PLATFORM 246c · tacit 13c) + 2026-09-29 설치본 코드 감사

- 규칙 1: 모든 항목에 「검사」 한 줄 — 고쳐졌는지 기계 또는 사람이 아는 방법. 검사를 못 쓰는 항목은 싣지 않았다.
- 규칙 2: 항목 하나 = unit 하나 크기(60~90분). ID: **R** = 수리(있는 것의 결함), **Q** = 요구(이번에 새로 등록).
- 규칙 3: 제거 대칭 — 이 백로그가 낳는 장치도 검출 실적이 3 unit 연속 0이면 제거 후보다.

---

## 완료 기록은 옮겼다 (2026-10-03)
L0 수리와 L1 진입 조건은 2026-09-29에 끝났다 — 상태 표·항목(P0·P1·P2 · Q1~Q4)·설계 변경·근거 위치(부록 B)는 `docs/changelog/backlog-L0-L1-2026-09-29.md`에 원문 그대로. 여기엔 살아 있는 것만: L2~L4 요구 · 헌법 · 표 이후 후보.

---

## L2 — 부재. 팀이 안 보는 시간에 신뢰를 번다.

- **Q5. 무인 하루 프로토콜.** 아침 brief/scope 한 번 → 저녁 try 카드 ≥3장, 낮 접점 0. 검사: 원장의 CEO 접점 타임스탬프로 증명(R1이 전제).
- **Q6. 인터럽트 실사격.** 4종을 진행 중에 의도적으로 주입, 컴파일 소요 턴·무관 unit 정지 0을 측정해 docs/measurements에 기록.
- **Q7. 우아한 정지 실증.** 부재 3일 시뮬레이션 — 상한 도달 후 STATUS 첫 줄에 멈춘 이유를 남기고 정지, 규칙 완화 드리프트 0(HAZARDS 11: 19시간 무인 완화 사고의 재발 방지). 검사: 상한 초과 상태의 ship 시도가 전부 FAIL 로그.

**L2 게이트: 세 라운드 누적 「green 이후 CEO 발견 결함」 0 — 날짜는 측정 단위가 아니다(CEO 2026-10-03). 라운드·시계 검사·Q6 두 길·Q7 압력의 정의는 `docs/measurements/L2-TRIAL-5.md`.**

---

## L3 — 다중·회사(on-prem + opencode). 약한 모델일수록 하네스가 번다.

- **Q8. 3층 이식성 명문화 — 법은 Layer 0.** **→ 검사 완료 2026-10-04(R&D 4·5라운드)**: 훅 0 환경(e2e)에서 속임수 셋 — 약화·원장 없는 커밋은 L0가 막고, 원장 위조는 ship 재검증(통합 tree에서 스스로)이 막는다(e2e). 5라운드: 같은 셋을 opencode 설치본에서 재현 — 같은 결과(e2e), 가드 플러그인은 실행 패리티 e2e(결정 = decide()).
  Layer 0(git 훅 + node 스크립트 + 원장): 어느 하네스·모델·인간에게도 동작, 신뢰는 전부 여기서 성립. Layer 1(Claude 훅·opencode 플러그인): fail-loud 최적화일 뿐, 전멸해도 신뢰 유지. Layer 2(팩 markdown): 보편. redproof의 성질 — 약화된 테스트는 old code에서도 통과해 base_red가 깨진다 — 을 negative test로 기계화.
  검사: 훅 0 환경에서 속임수 3종이 게이트 FAIL(L0 게이트의 재확인을 opencode에서).
- **Q9. opencode 어댑터 — 스폰 방법 + guard 플러그인 + agents 6파일만.** **→ 부분 채용 2026-10-04(R&D 5라운드)**: guard 플러그인 실행 패리티(e2e 13 케이스 · task→spawn_stop 팩 이름) · conductor task 허용 = 팩 전부(adopt 누락 수리 — 패리티병의 재발을 unit이 막는다) · conduct는 .claude/agents 없는 설치본에서 --spawner 없이 서지 않는다(한 줄) · selftest가 두 하네스의 L1 거부 1건을 돈다. 남은 것: 실제 opencode CLI로 spawner 템플릿 검증(모델 0 환경 밖).
  guard-rules는 이미 하네스 중립(`guard-rules.mjs:1`), models도 .opencode 경로 인지(`work.mjs:255`). 금지 조항: 커맨드·스킬 트리 복제 없음 — v1 패리티병(두 flavor 손 동기화, parity-check가 그 증상)의 재발 금지. AX의 가짜 끝점·replay 인프라를 하네스 테스트에 재사용(네트워크 0, 비용 0).
  검사: opencode 환경에서 selftest + L0 속임수 시나리오 재현.
- **Q10. provider-per-pack.** models 개념을 provider까지 확장 — 집: spec/attack=최강 모델, 회사: spec=온프렘+CEO 서명 강화(약한 모델은 「잘 고정된 스펙의 실행자」, 판단은 사람이 더 잡는다). 검사: team.json 프로파일 한 줄로 두 환경 전환. **→ 채용 2026-10-04(R&D 11라운드)**: `team.json profiles` + `work.mjs models <이름>`(tier와 같은 자리). 검사(한 줄로 두 환경 전환)는 unit.
- **Q11. 버전 고정.** 제품 레포에 설치된 v2 버전 기록, 업그레이드는 diff를 보이는 명시적 unit — 자동 재설치 금지. 검사: 업그레이드 회귀 테스트(R15와 공유). **→ 부분 채용 2026-10-04(R&D 2라운드)**: `.garagiste/VERSION`(garagiste sha · team tree · flavor) + 갱신 커밋 제목의 old→new + `doctor.mjs --version`; 업그레이드의 unit화는 남았다. **→ 10라운드**: 갱신 미리보기 `doctor.mjs --diff`(바뀌는 파일 한 줄) + 설치기가 복사 전에 보인다 · 배선 설정은 덮지 않되 다르면 옆에 두고 알린다. 남은 것: 업그레이드 회귀 테스트(R15와 공유)는 e2e 「갱신 미리보기」·「사고 70」이 절반.
- **Q12. 포트폴리오 — CEO 주의력이 전 제품의 스케줄링 자원.**
  전역 미검수 상한 + 제품 관통 인박스(각 레포 STATUS 첫 줄 수집) + 공유 HAZARDS(프레임워크 제공 + 제품 오버레이 — 이미 그 구조). 제품 2개 이상일 때만 구현.
  검사: 전역 상한 도달 시 모든 레포의 seed 정지.
- **Q13. 레거시 팩 — 회사 투입의 전제.** **→ 입구 채용 2026-10-04(R&D 3라운드)**: adopt 팩(기존 코드의 첫 unit — 특성화·commands·rules, 소스 불변) + intake 「저장소 상태」 + brief `repoMap`(폴더·매니페스트·기존 테스트·README — map.mjs의 최소형). 특성화 대량 고정·관심 영역 지도·`kind: refactor`(동작 보존 증명)는 parcel-desk 첫 측정의 멈춘 자리에서. **→ 둘째 조각 2026-10-04(R&D 7라운드)**: `kind: refactor`(동작 보존 증명 — 핀은 base·head 모두 초록, redproof·ship·next·brief가 안다) + 드라이버 틈 수리(attack red 0 뒤 tree의 redproof·full). 남은 조각: 특성화 대량 고정 · 관심 영역 지도.
  v1에서 살아남을 자격이 있는 것(assess·parity — 대상이 사람 마음이 아니라 코드): 현행 동작의 characterization 테스트 = 수용 기준, redproof 그대로 작동. incremental intake(오프셋 재개)는 있음 — LACUNA 레거시 intake 팩 151KB가 반례 근거.
  검사: 기존 코드베이스 1개에서 boot 없이 첫 unit 출하.

**L3 게이트: unit당 CEO-분(기계 셈 — `docs/measurements/L2-TRIAL-5.md` 「CEO-분」; 기준선은 L2 5판의 첫 수치 — L1 표의 CEO-분 칸은 한 번도 채워지지 않았다) 비악화 + opencode 환경에서 L0 게이트 전부 재현.** **→ 후반 충족 2026-10-04(R&D 5라운드)**: opencode 설치본에서 L0 속임수 셋 재현(e2e) — 전반(CEO-분 비악화)은 L2 5판 수치 뒤.

---

## L4 — 영역 확장(웹 → 데스크톱 → 게임·슈퍼앱). 확장 축은 검증 가능성.

- **Q14. 사람-증거 레인.** `@sensor human`을 일급으로: 스크린샷·녹화·플레이 빌드가 원장 증거, STATUS의 「안 본 것」과 별도 집계(`state.mjs:31`에 싹 있음). claims의 미태그 기본값(machine, `claims.mjs:8`)을 unknown으로 바꿔 누락이 보이게. 검사: human 센서 unit이 CEO 판정 전 done으로 집계되지 않음. **→ 첫 조각 2026-10-04(R&D 8라운드)**: `tried --evidence <파일,…>` — docs/units/<slug>/evidence/ + docs 차선 커밋 + 원장 tried.evidence + STATUS 「사람 증거」·REPORT 「증거 n」. 남은 것: 「안 본 것」과 별도 집계 · @sensor human 주장과 증거의 연결.
- **Q15. 플랫폼 센서 일반화 — 센서 없는 플랫폼엔 주장도 없다.** 대상 플랫폼 목록(신규 설계 — 옛 `machine_os`는 검증 platform의 허용 목록이라 이 일을 못 했고 win32 오탐으로 2026-09-29 제거됨)에 대해, 대상 플랫폼의 verify 기록 없으면 ship FAIL(tacit의 Linux 계획·AX 0046 존재하지 않는 zip의 재발 방지). 재료는 원장의 `platform` 필드. 검사: Windows 타깃 unit이 linux full만으로 ship 시도 시 FAIL.
- **Q16. 멀티모달 능력 매트릭스.** provider별 입력 능력(이미지 등)을 team.json에 — 불가 provider에서 디자인 자산 unit은 사람 주석을 요구하고 그렇게 말한다. 검사: 온프렘 프로파일에서 이미지 첨부 intake가 명시적 안내 출력.

**L4 게이트: 자동화 불가 수용이 있는 도메인(UI 중심 앱 1개)에서 L2 신뢰 지표 유지.**

---

## 부록 A — 이 백로그의 헌법(6줄)

1. 실행 증거만 전진을 허가한다 — 문서 승인·의견 APPROVE는 통화가 아니다.
2. 조직을 나누지 말고 컨텍스트를 나눈다 — 분리는 읽기 fan-out·격리 검증·권한 경계에만. 에이전트끼리 말하지 않는다.
3. 법은 코드, 산문은 조언 — 장치는 사고에서 태어나고, 검출 실적 0이면 죽는다(추가·제거 대칭).
4. CEO는 결재자가 아니라 첫 사용자 — 증분 = 써볼 수 있는 것, 질문은 기본값과 함께.
5. 기계 검증은 스크립트($0), 판단 검증은 최강 두뇌 — v1은 정반대로 배치했었다.
6. 프레임워크는 제품의 그림자 — 측정 표 이전의 모든 수치는 주장이다. 백지 재설계는 이번이 마지막(다음부턴 장치 단위 수리).

## 표 이후 후보 (시험 중 등록 — 장치는 동결 해제 뒤)
- **1순위 — try 사본(CEO 합의, 2026-10-01) → 구현(2026-10-01 — L2 재등록 A안으로 3일 표 뒤에서 앞당김, CHANGELOG 「try 사본」)**: try는 저장소 본체가 아니라 버릴 checkout에서 — `work.mjs try <slug>`가 main 현재 커밋을 `.worktrees/try-<slug>`로 열고(linkDeps), CEO는 거기서 카드를 치고, `tried`가 사본을 지운다. 생성·변형 파일을 「복구」하지 않고 처음부터 main에 닿지 않게 — 제품 종류와 무관한 범용 해법(사후 감지·복구는 CEO의 의도된 파일을 지울 위험, 카드 작성 규칙은 제품마다 달라 범용이 아님). 덤: 파일을 만드는 기계 판정 카드의 위임이 가능해진다(L1 4차 위임 1/3). 한계: 저장소 밖 부작용(홈·AppData·네트워크)은 범위 밖 — HAZARDS 홈 쓰기 줄과 attack이 맡는다. 근거: L2 1일차 eoren.sqlite ship FAIL + conductor 개입, L1 4차 위임 불가. 시점: L2 3일 표 뒤(저녁 흐름이 바뀌어 CEO-분 비교가 깨지므로). **둘의 규칙 충족(2026-10-01 필드 시험 2)**: 웹 메모장에서 CEO가 카드대로 메인 루트에서 `npm start` → 저장 → `data/memos.json`이 main에 남아 delete-memo ship FAIL — 두 번째 제품. (이번엔 conductor가 손대지 않고 CEO에게 물었다 — a093919 가드가 작동.)
- 팩 상한 이유-차선: LARGE_STEP 패턴을 brief.mjs에 이식 — 상한~2×는 이유 선언(원장 기록)으로 통과, 2×는 벽. 모양 휴리스틱(팩·step·산문)은 밴드, 증거 게이트·예산 정지는 벽이라는 구분의 성문화. 사고 8의 후속 (2026-09-29, CEO 발의). → **채용·구현 2026-10-02(CEO — 측정 H3)**: `brief.mjs <팩> <slug> --large "<이유>"`(상한~2배, 원장 large) · 2배를 넘으면 CEO 결정 그대로 · 하루 표가 센다.
- session-start 주입에 state 첫 줄 + 「써볼 것」·「정해 주세요」 카운트 추가 — 새 세션이 CEO 대기 항목을 산문 규칙 없이 기계적으로 재인식(CEO 발의 "inbox" 아이디어의 정착지; 별도 inbox/ 폴더는 같은 진실의 둘째 사본이라 기각). 사고 없인 장치 금지 — L2(무인 하루·재개)에서. (2026-09-30)
- 이음새(e2e) 검증의 성장 경로 성문화 — 누적 full + tryable-outcome 절단이 주는 통합은 유지하되, 표의 「green 후 CEO 발견 결함」이 0이 아니게 유지되면 flow unit 컨벤션(교차 흐름의 인수를 가진 unit)·상시 조립 스모크를 장치화. desktop류 프로젝트는 UI unit의 인수에 실기동 왕복 한 줄을 요구(CEO 발의, 2026-09-30).
- system-attack 팩(CEO 발의 "e2e tester") 설계 — attack의 스코프 일반화: 입력 = shipped unit 전체의 surface·try + 실행 명령, 쓰기 경계 = tests/adversary/system-*(기존 배관이 pseudo-slug system으로 수용: verify attack system), 산출 = 이음새 red 테스트(발견) 또는 「탐색 경로 N·발견 0」 원장 기록 — 초록 생산은 산출물이 아니다(green theater 금지). 리듬 = N unit 출하마다·무인 세션 끝·CEO 호출, 판단 역할이라 상위 모델, 테스트는 결정론(고정 fixture·타이밍 금지 — flaky 공장 방지). 채용 방아쇠 = L1 표 「green 후 CEO 발견 결함」 열이 0이 아니게 지속되면 L2에서 채용, 0이면 보류. (2026-09-30) → **채용·구현 2026-10-03(CEO 「하나씩 수정」 — 방아쇠는 벤치 파이썬 날짜 ×2 · todo 4일차 · library loan-limit로 당겨졌다)**: `work.mjs system`(범위 끝에 next가 낸다) · attack 팩에 출하된 unit 전체의 표면·try · 발견은 build가 고쳐 ship, 발견 0은 drop(CHANGELOG 「system-attack」).
- 사고 17 후보(2차 실기, 표 이후 확정): ship이 unit의 결정이 닫혔는지만 확인하고 반영됐는지는 못 본다 — Q11이 build 뒤 닫혀 미구현 출하, CEO try가 나중에 찾았다. 수리 방향: 진행 중 unit의 Q를 decide하면 unit 상태를 spec으로 되돌려 답을 red 수용 테스트로 박게 강제(기계 규칙, re-spec 경로 재사용). green후발견 열 ≠ 0 → system-attack 채용 면접에 1점. (2026-09-30) → **수리 a7a5fb2** — decide가 spec이 답 없이 이미 돈 진행 중 unit에 RESPEC을 걸고, build·attack 팩과 ship이 spec 팩이 그 답을 실을 때까지 거부(가드가 읽는 팩 정체는 불변 — 돌고 있는 build의 쓰기 경계 보호).
- 사고 23 후보(3차): intake가 Q 번호를 한 칸 밀려 매겨 needs가 잘못 걸린 unit 6 — ask의 반환 번호를 쓰게 팩 지시 강화 + `work.mjs needs <slug> <목록>` 수정 명령 신설. attack 원장(2/3)과 LEDGER(3→0/3) 집계 정의 명문화도 함께. (2026-09-30 — 날짜 정정, 원래 10-01) → **수리 ca26d12** — 팩 지시 강화 대신 코드로: DECISIONS에 없는 Q는 add·needs가 거부 + `ask intake --for`가 번호를 needs에 잇는다 + `work.mjs needs`(메인 전용·원장) + attack 열 정의는 attackCell 하나.
- 관찰(L1 4차, 1회 — 사고 아님, 안내대로 한 번에 풀림): intake mark가 팩 **조립** 때 전진한다 — 조립 뒤 spawn 없이 세션이 끝나면 다음 intake가 「더해진 BRIEF가 없다」로 `--all` 우회를 요구. 반복되면 사고로 — mark를 intake의 첫 add 때로 옮기는 수리. (2026-10-01)
- 관찰(L1 4차): try 위임은 파일을 만드는 카드에서 불가 — conductor 쓰기는 가드가 worktree 밖을 거부(위임 1/3, 나머지 CEO-분). spec이 try용 fixture를 docs/units/<slug>/에 두면 카드가 파일 생성 없이 돈다 — L2 저녁 창 CEO-분 측정 뒤 판단. (2026-10-01)
- 관찰(L1 4차): 팩 FAIL(brief.mjs)·가드 거부는 원장 줄이 없다 — FAIL 대기의 시작점을 이웃 ts로 추정했다. L2 표에서도 같으면 원장 `fail` 줄 후보(측정 빈틈). (2026-10-01) → **채용 2026-10-03(CEO 「하나씩 수정」)**: FAIL 줄·가드 거부가 원장 `fail`·`guard` 줄로 남고, 같은 FAIL이 되풀이되면 STATUS 「막힌 것」·첫 줄 「반복 FAIL n」(CHANGELOG).
- 관찰(L2 1일차): 가드 LEDGER_SHELL이 원장 경로와 한 줄에 있는 `sed`(읽기)·`2>/dev/null`을 쓰기로 거부 — conductor의 표 산출을 방해했다. 규칙집 읽기 오탐(첫 Windows 실기)과 같은 수리 후보: 원장을 향한 쓰기 verb·리다이렉트만 거부. 반복되면 사고로. (2026-10-01) → **수리 a093919**(향하는 쓰기만 거부)
- 관찰(L2 1일차): conductor가 seed를 병렬로(22:47 두 번) — Flow 4는 순차인데 pickReady·가드는 병렬을 막지 않는다. 결과: spawn_stop(slug 없음) 귀속 어긋남(6/5·5/6), 같은 파일 충돌(사고 26을 낳은 조건). 둘 중 하나로 정한다 — 병렬을 계측까지 지원(spawn_stop에 slug) 또는 seed가 진행 중 unit이 있으면 WAIT. (2026-10-01) → **수리 a093919**(CEO 결정: 순차 — seed가 ACTIVE, CEO 질문에 걸린 unit만 예외. 병렬은 미검수 상한을 올려 팀 속도가 병목이 될 때 계측과 함께 재논의)
- 관찰(L2 1일차): seed가 예산 정지(미검수 3) 중에도 unit을 연다 — effect-conflict가 16:52에 열린 채 6시간 유휴, seed→ship 시계가 부풀고 base가 낡는다. 후보: 예산 정지면 seed도 STOP. (2026-10-01) → **수리 a093919**
- 관찰(L2 1일차): try 카드가 저장소 안에 만든 파일(eoren.sqlite)이 main을 더럽혀 ship FAIL — conductor가 CEO의 파일을 옮겼다(판단 개입). 둘로 나눈다(CEO 지적): **프로젝트 몫** — 카드 작성법(입력 파일은 docs/units/<slug>/ 아래 미리, 산출은 저장소 밖)은 이 제품(파일을 읽고 DB를 쓰는 CLI)의 성질이라 CEO의 말(BRIEF)로 둔다, 둘의 규칙(BIRTH): 두 번째 제품에서 같은 일이 나면 spec 팩으로. **프레임워크 몫** — 가드가 conductor의 리다이렉트는 worktree 밖이면 거부하면서 `mv`·`rm`·`cp`는 보호 구역에서만 검사해 CEO 파일 이동이 통과했다(재현 확인) — 「conductor는 쓰지 않는다」의 구멍, 수리 후보. (2026-10-01) → 프레임워크 몫 **수리 a093919**(mv·rm·cp·tee도 worktree 밖이면 거부)
- 관찰(L2 1일차): 커밋 trailer 줄이 쓰기 경계에 막혀 빠짐 — 2차 실기(vault-load) 이후 두 번째. 셋째면 사고로. (2026-10-01) → **수리 a093919**(원인 확정: heredoc 본문의 <…>를 리다이렉트로 읽음 — heredoc 본문은 데이터)
- **2순위 후보 — 이미 충족된 주장 박기(필드 시험, 둘의 규칙 충족)**: base에서 green인 주장(앞 unit이 이미 만든 기능 · 제약형 요구 「네트워크를 쓰지 않는다」 · 검증 자체가 산출물인 「실제 브라우저에서 확인」)은 redproof가 테스트로 인정하지 않아 지금 길은 drop --forget뿐 — spec이 쓴 회귀 테스트가 dropped 브랜치로 간다. 웹 persist·browser-check, 파이썬 no-network(두 제품). 방향: CEO 서명(예/아니오)으로 base green 주장을 회귀 증거로 출하(원장 redproof `pinned`, LEDGER 칸 「pinned(CEO)」, attack은 그대로). 특히 제약형 요구는 구조적으로 base red가 될 수 없다. 시점: L2 동결 해제 뒤(새 증거 범주라 장치). (2026-10-01)
- 관찰(필드 시험 1): 파이썬의 공격 파일(`<slug>-n.py`)은 프로젝트 full(unittest discover·pytest 기본 패턴)에 안 들어가 출하 뒤 회귀를 지키지 않는다 — 웹(node --test glob)은 들어간다. 사고 32의 수리는 출하 전(build·ship)만 닫는다. 둘째 언어에서 같으면 attack 파일 이름 규칙을 러너 친화로(예: `test_<slug>_n.py`) 또는 boot가 full에 adversary를 포함하게. (2026-10-01)
- 관찰(필드 시험 2): boot가 spawn마다 같은 오답 명령(`node --test tests/unit/` — node 22에서 디렉터리는 실패)을 먼저 쓰고 verify로 고쳤다 — boot 팩에 직전 commands·verify 결과가 없다. 비용 작음, 반복되면 팩에 「현재 commands」 절. (2026-10-01)
- 관찰(필드 시험): `work.mjs new`로 연 버그 unit의 milestone이 `M?` — 원 unit의 마일스톤을 잇지 않는다. 범위·표에서 빠질 수 있다. (2026-10-01)
- 관찰(필드 시험, 정비 채널의 실수가 드러냄): 끊긴 worktree 링크(폴더 이동·복사)를 doctor가 못 보고 verify는 FAIL 줄 대신 스택을 낸다. 실사용에선 프로젝트 폴더를 옮기면 난다 — doctor에 `git worktree list` 점검 후보. (2026-10-01)
- **1순위(L2 2판 윈도우 1일차, 측정) — attack↔build 진동 상한**: 같은 몫에 토큰 16배 · 세 번째 ship까지 249분(리눅스 8분). attack이 결함을 찾으면 build가 고치고 다음 attack이 그 수정이 만든 반대 결함을 짚는 왕복(저장 방식 제자리 쓰기 ↔ 바꿔치기 · 잠금 문턱 — 윈도우의 파일 의미)이 28·20바퀴 돌았다. 후보: attack 바퀴 상한(넘으면 그 unit만 CEO 질문 — 「이 계열의 결함을 어디까지 막을까」) · 같은 파일·같은 단언의 반복 반전 감지. 시점: L2 2판 3일 표 뒤. (2026-10-02) → **재진단(윈도우 2·3일차)**: 같은 conductor가 2·3일차 6 unit은 전부 1바퀴로 돌렸다 — Flow 4의 「verify attack red>0이면 build 다시」가 고친 뒤 attack 팩을 새로 띄울지를 말하지 않아 해석이 갈렸다(벤치 attack unit 14개도 1바퀴). 수리 방향: attack 팩은 unit당 1바퀴, 고친 뒤엔 `verify.mjs attack`만, 2바퀴째는 CEO 질문 — brief.mjs attack이 원장의 attack 팩 수로 막는다(산문이 아니라 코드). → **채용(CEO 2026-10-02): spec 뒤 한 바퀴** — 2바퀴째 CEO 질문은 두지 않는다(정비 채널 권고, CHANGELOG 「attack은 spec 뒤 한 바퀴」).
- 보류(CEO, 2026-10-01): attack effort 재연 실험 — 놓친 사례(벤치의 없는 날짜 · CSV 수식)를 그때의 코드·팩으로 기본 vs high effort 각 5회, 포착률·토큰. Claude Code 에이전트 정의에 effort 필드가 있다(CLI에서 확인 — 동작은 구현 때 확인). 재료(벤치 폴더)는 컨테이너와 함께 사라졌으니 할 때 벤치를 새로 돌려 만든다.
- try 위임(try 사본의 덤): 가드가 사본(`.worktrees/try-*`) 안 쓰기를 fail-closed로 막아 conductor가 파일을 만드는 카드를 대신 칠 수 없다 — 사본 마커를 두고 PACK_RULES에 try를 더하는 모양. (2026-10-01)
- 정션 점검(윈도우): try 사본은 지우기 전에 의존성 링크를 끊지만(unlinkDeps) unit worktree를 지우는 ship·drop·redproof는 그러지 않는다 — 윈도우에서 첫 ship 뒤 main 의존성이 남는지 L2 2판 준비 3으로 본다. 사라지면 사고로. (2026-10-01)
- 관찰(벤치 621a426): 파이썬 export의 CSV 수식(`=1+1`)을 attack이 놓쳤다(1·3회차는 짚었다 — attack 편차) · month-summary try 카드의 부호 오류(「급여 5000」 → 실제 -5000이 맞다 — 카드 품질). (2026-10-01)
- 관찰(L2 2판 리눅스): BOM이 붙은 정상 todo.json을 「깨졌다」로 거부 — 원문이 손편집 읽기를 요구하지 않아 결함으로 세지 않았다(cross-os M2에서) · 권한 훅이 `$변수` 확장이 든 Bash를 막음(하네스, 사고 43의 이웃) · 윈도우: build가 남긴 백그라운드 명령이 시간 제한으로 끝남 · 늦은 완료 알림이 spawn_stop으로 찍혀 귀속 어긋남(계측 빈틈). (2026-10-02)
- 관찰(필드 3 Go): spec 반려 카운트가 사고 55(스모크)로 생긴 첫 반려까지 세어 두 번째 반려가 CEO에게 갔다 — 「팀 안에서 안 풀린 둘」이 아니었다. 반복되면 반려 사유가 다를 때 셈을 다시 볼 것. (2026-10-01)
- 미검수 상한(무인 처리량): 1판 1일차 무인 376분 중 작업 ≈29분, 윈도우 2판 1일차 396분 중 249분(진동 탓) — 상한은 정책 결정, L2 2판 3일 표 뒤. → **채용 2026-10-03(CEO 「하나씩 수정」)**: 사람 센서가 필요한 unit만 센다 — @sensor human 또는 공격 선발견 0; 기계 증명 unit은 마일스톤 끝 try(CHANGELOG 「미검수 상한」).
- **결함 후보(벤치 070f185, 측정 — 필드 1 정지)**: test_file 0건 green — boot의 하네스(`run.py {files}` → `unittest discover(pattern=<파일 이름>)`)가 하이픈 모듈 이름을 건너뛰어 `Ran 0 tests · exit 0` → redproof가 거짓 base green, 안내(drop · re-spec)는 원인에 닿지 않는다. 같은 하네스면 사고 44의 full도 0건 green. 46a53ca 후보 4(0건 exit 1 → 거짓 base_red)와 같은 뿌리: 프레임워크는 test_file이 받은 파일을 실제로 돌리는지 모른다. 수리 방향 후보: commands 등록 때 탐침(boot가 그 생태계로 쓴 「반드시 red」 하이픈 이름 파일을 test_file로 돌려 exit≠0인지) · redproof base green 안내에 「0건 실행」 원인. 동결 중 수리 여부는 CEO 결정(윈도우 L2 원문은 Node — 닿지 않는다). (2026-10-02) → **수리 0ab3a05**(CEO 「수리」 — 깨진 탐침: scaffold ship의 redproof 자리 + redproof의 base green, 원장 runner_blind·blind) · 재측정 0ab3a05 파이썬 SCOPE DONE · FAIL 0. 덤: 팩 상한 기본 24→32(벤치 실측 28·29·31KB).
- 관찰(L2 2판 윈도우 M1, 윈도우에서만): build가 저장한 `src/cli.mjs`가 CRLF — 첫 줄 검사(shebang)가 4 unit에서 깨져 에이전트가 매번 되돌렸다. 추정 원인 Git for Windows의 `core.autocrlf=true`(새 worktree 체크아웃) — 확인 전. 후보: boot가 `.gitattributes`(`* text=auto eol=lf`)를 만든다. (2026-10-02) → **채용 2026-10-03(CEO 「하나씩 수정」)**: boot 팩 「생태계별 검증된 꼴」 + 가드가 boot의 `.gitattributes` 쓰기를 연다(CHANGELOG 「환경의 긴 꼬리를 boot에서 선불」).
- 관찰(윈도우 M1): Q9 질문 줄이 글자가 빠진 채 저장됐다 — 윈도우 한글 인자의 인코딩 추정. DECISIONS의 원문 줄을 받아 재현부터. (2026-10-02)
- 관찰(윈도우 M1): conductor가 CEO의 「다 ok」(try)를 열린 Q10의 「예」로 받았다(결정 대리) · 「저녁」을 쉬겠다는 뜻으로 오독했다 — 「대신 답하지 않는다」가 산문뿐이다. 반복되면 사고로. (2026-10-02)
- 관찰(윈도우 M1): conductor가 저녁 지시서의 일차 표 대신 M1 집계 보고를 냈다 — 2·3일차의 낮 접점·무인 분을 재지 못했다(측정 빈틈). 후보: 일차 표를 스크립트가 원장에서 낸다(판단 없는 산수 — tests/field/table.mjs의 L2판). (2026-10-02) → **`tests/field/day.mjs`**(2026-10-02, 테스트 `tests/field.test.mjs`) — 정비 채널이 원장에서 독립 산출, 판단이 드는 칸(구성 ①/② · 프레임워크 FAIL · 멈춤 이유 · 참고)은 표 밖. 테스트 베드 conductor가 직접 돌리게 할지는 L2 모드 벤치(HANDOFF ②)와 함께.
- 관찰(윈도우 M1): store-corrupt build의 정식 커밋을 wip 체크포인트가 가로챘다 — 수정 단계에서 바로잡혔다(사고 15·16·41 계열). · 사람 확인 집계 1/9 — tried ok는 사람 센서로 세지 않는다(Q14 사람-증거 레인과 함께). (2026-10-02)
- 후보(L2 측정 b0da849, 측정 근거 1 — 회의 유일한 green 후 결함): **tried ok의 메모가 뒤 unit의 수용으로 가지 않는다** — 대리가 add 카드에 「공백만인 제목이 0으로 저장 — bad-input에서 닫히는지 본다」를 남겼고 conductor도 그렇게 말했지만, intake가 쓴 bad-input의 인수는 원문의 두 예뿐이라 4일차 fail → bad-input-fix. 2판에선 같은 모양의 메모 셋이 모두 닫혔다(spec·attack 편차). 후보: ok 메모가 「<slug>에서」를 짚으면 그 unit의 BACKLOG 인수 줄에 붙는 길(work.mjs tried의 인자 하나) — 둘째 근거가 나오면 채용 검토. (2026-10-02)
- **결함 후보(홀드아웃 holdout-library 첫 측정 9be0e15, 측정 — 6일차 정지) H1**: ship 충돌 뒤 rebase 도중의 사본에서 redproof가 거짓 「base에서 green」 — 재spawn된 build가 충돌을 풀고 `git add`까지 하고 `git rebase --continue` 없이 끝났고(체크포인트는 rebase 중 커밋하지 않는다), redproof가 head = base = main으로 계산했다. 안내(이미 충족 drop · re-spec)는 원인에 닿지 않고 drop은 일을 버린다(사고 57과 같은 모양). 수리 방향: redproof·ship·팩 조립이 unit 사본의 rebase 도중(rebase-merge·rebase-apply)을 보고 「rebase 도중 — build 재spawn이 rebase를 끝낸다」 FAIL로 · 충돌 build 팩의 끝 조건에 rebase 완료. **수리하면 이 홀드아웃은 소진**(CEO 결정 대기). (2026-10-02) → **수리 2026-10-02(CEO) — 사고 58**: redproof·팩 조립이 rebase 도중을 FAIL로(표시가 남았으면 build · 다 풀렸으면 ship) — holdout-library 소진
- 후보(같은 측정 H2): CEO 결정만 요구하는 FAIL(두 번째 spec 반려 · 팩 상한)이 열린 Q로 등록되지 않는다 — 3일차는 seed가 `ACTIVE`로 막아 하루가 한 출하, 4일차 conductor는 스스로 `work.mjs ask`로 Q5·Q6을 올려 다른 unit으로 넘어갔다. 후보: 그 FAIL의 안내에 `work.mjs ask <slug> "<그 줄>"`(또는 스크립트가 직접 Q 등록) + L2 아침 규칙에 「CEO 결정만 요구하는 FAIL은 hard 질문(그 unit만)」. (2026-10-02) → **수리 2026-10-02(CEO) — 사고 59**: 그 FAIL 다섯의 안내 끝에 `work.mjs ask <slug> … --hold`(답이 와도 re-spec 없음) + 아침 규칙 한 줄
- 근거 추가(같은 측정 H3) → 「팩 상한 이유-차선」: L2에서 상한 FAIL은 하루를 쓴다 — 2·5일차가 그 FAIL로 멈췄다(34 · 48KB, 공격 절이 결함마다 자라 27KB). 대리의 결정 ① 3회(32→34→35→49). (2026-10-02) → 채용(이유-차선, 위)
- 후보(CEO 발의 2026-10-02 — **보류**, CEO 「너의 판단대로」: 근거가 생길 때까지): 팩이 2배 벽(64KB)을 넘으면 unit을 자동으로 나눈다. 보류 이유 — 관측 최대 49KB(벽은 한 번도 안 났다) · 나누기는 판단(어느 주장끼리 · 순서 · 선행)이라 스크립트 몫이 아니고 범위·원문(CEO의 것)에 닿는다 · 넘치는 자리는 대개 build라 코드가 이미 있다 · 64KB를 넘는 법은 이상 신호(예: 테스트에 박은 큰 데이터)일 수 있다. 방아쇠: 벽이 처음 나면 절별로 — 공격 절이면 build 팩을 공격 테스트 묶음으로 나눠 두 번 도는 길(범위 불변·기계적), 인수 절이면 intake 때 unit 크기를 보는 길.
- **후보(L2 3판 리눅스, 측정 — `docs/measurements/archive/L2-TRIAL-3.md` 「L2 3판 리눅스 판정」)**: (a) Flow 7 수정 — 닿는 unit이 아직 시작 전이면 `add --replace`로 BACKLOG 원문을 고친다(Q6: 「라운드는 일요일로」가 BRIEF에만 남아 schedule-dates 원문 「토요일」과 어긋났다 — 그 spec이 Q10으로 확인을 물어 효과는 닿았다) (b) Flow 7 방향전환 — 범위 밖 BACKLOG 줄이면 drop FAIL의 `--forget`이 길이다(conductor가 「이번엔」을 범위로 읽어 줄을 남겼다) (c) 부재 선언 뒤 같은 세션이 루프를 다시 열었다 — 저녁 지시서의 「그날은 여기까지」와 CEO의 새 말 사이의 빈칸 (d) 스트림의 말은 도구 호출 사이에만 든다 — 서브에이전트 안에 넣은 말은 그 호출 끝까지(수정 10.1분) (e) **spec의 저장 형식 질문이 하루를 쓴다** — spec 팩 4번(데이터 모델·파일 형식 = hard 결정 → ask)대로 질문 6개(Q6~Q11)가 모두 그 unit의 ship을 저녁까지 세우고 「예」(가정 그대로)에도 RESPEC을 낳았다 — 2·3일이 한 출하씩. 후보: intake가 데이터 모델을 한 질문으로 먼저 · 이미 정한 파일(Q2)을 넓히는 조각은 팀이 정한 것 · 가정 그대로의 「예」는 RESPEC 대신 확인만. Q6을 다시 잴지는 CEO 결정(①/②). (2026-10-02) → **CEO 결정(2026-10-03)**: 「하루」는 라운드(날짜·기간은 측정 단위가 아니다) · 3판 Q6·Q7은 재판정 통과(약함) · 보강은 L2 5판(`L2-TRIAL-5.md` · 4판 초안 `archive/L2-TRIAL-4.md` — Q6 목표를 진행 중 unit·범위 안 unit으로 · Q7은 막힌 세션의 반복 압력 · 시계 검사). → **(e) 채용·구현 2026-10-03(CEO 「하나씩 수정」)**: spec 팩 4 — 저장 형식의 안쪽(키·필드)은 `work.mjs default` · 주장 뒤의 확인형 질문은 `ask --assumed` · 맨 「예」는 RESPEC 없음(CHANGELOG 「질문은 기본값으로」).
- **채용(R&D 2026-10-04, CHANGELOG 「2026-10-04 R&D」)**: 임시 폴더 쓰기 거부(5판 관찰 b · 6판 누적 6) → 가드가 mktemp·TMPDIR·OS 임시 폴더를 저장소 밖으로 · 끊긴 spawn의 원장 꼴(6판 (7)) → `conduct.mjs`가 spawn_stop·spawned(실측)를 남긴다 · 끊긴 worktree 링크(2026-10-01 관찰) → doctor · attack↔build 진동의 예산(2판 윈도우 1일차) → `budgets.unit_tokens_max` + `work.mjs budget` · L3 Q13 측정 장치 → `tests/field/setup-seed.sh` + seed(서명·첫 측정은 CEO) · 사고 70(기존 저장소 설치 커밋).
- **후보(종이에서 — 사고 없이 장치 없음, CEO 「가」 대기)**: (a) 경계를 OS에 — 팩마다 자기 worktree·임시 폴더만 쓰기 가능한 샌드박스(컨테이너·사용자 분리), guard는 이중 방어로(사고 60·62·67의 정규식 오탐 계급 — 엔터프라이즈 보안 검토가 정규식을 경계로 보지 않는다) (b) ship을 PR + 원격 필수 검사로 — 8조건은 그대로, 머지 주체만 원격(카탈로그 D11; CI 미사용은 CEO 결정 26d3e94를 되돌리는 일) (c) 병렬 seed — needs와 예상 쓰기 집합이 겹치지 않는 unit(a093919 「미검수 상한을 올려 팀 속도가 병목이 될 때 계측과 함께」) (d) `conduct.mjs`를 selftest에(설치가 드라이버까지 검증) — 다음 홀드아웃 뒤 (e) 벤치의 conductor를 `conduct.mjs`로(구성 ③) — 모델 conductor 판과 비교하지 않고 따로 잰다.
- **채용(R&D 2라운드 2026-10-04)**: (d) conduct를 selftest에 → 채용(20단계) · 무인 안전벨트 셋(팩 시간 상한 · 비용 상한 · 잠금/heartbeat — DEVICES 4.6 「무인 폭주는 예산으로」의 자리) · Q11 부분(VERSION). 남은 종이 후보: (a) 샌드박스 (b) PR ship (c) 병렬 seed (e) 벤치 구성 ③ · Q11의 unit화.
- **채용(R&D 3라운드 2026-10-04)**: Q13의 입구 — adopt 팩. 투입 판정(HANDOFF 「2026-10-04 R&D 3라운드」): 신규(기계 검증 가능)만 가능, 레거시는 입구가 생겼을 뿐 — 첫 측정 전.
- **채용(R&D 4라운드 2026-10-04)**: ship 재검증(`ship_reverify` 기본 true) · 가드 인라인 코드 쓰기 거부 · `conduct.mjs check`. Q8 검사의 리눅스 몫.
- **채용(R&D 5라운드 2026-10-04)**: opencode 레인 패리티 — 가드 플러그인 실행 테스트 · task spawn_stop 팩 이름 · conductor task 허용 adopt · 팩 목록 하나(unit) · conduct spawnerGap · selftest L1 거부 1건. Q8 검사 완료, L3 게이트 후반.
- **채용(R&D 6라운드 2026-10-04)**: 고아 팩(측정 → conduct 비동기 spawn · 잠금 child pid · 신호 전달) · 비밀 파일 읽기 거부(측정 → Bash 토큰·Read 매처·opencode read). 둘 다 「무인 안전벨트」(DEVICES 4.6)와 가드의 약속을 코드로.
- **채용(R&D 7라운드 2026-10-04)**: kind refactor(Q13 둘째 조각 — 뒤집힌 red 증명 = 핀) · next의 attack 뒤 redproof·full 한 걸음(드라이버 틈) · verify.mjs quick|full [<slug>].
- **채용(R&D 8라운드 2026-10-04)**: install.ps1 패리티(VERSION · 기존 저장소 커밋 · 정적 패리티 unit) · Q14 첫 조각(tried --evidence).
- **채용(R&D 9라운드 2026-10-04)**: 기본 spawner에서 --max-turns 제거(측정: claude 2.1.289에 없다) · `pack_usd_max`(claude --max-budget-usd) · `conduct check`의 깃발 검사(--help) · doctor의 agents {{MODEL_}} 잔재 검사 · 원장 깨진 줄 건너뛰기를 unit으로 잠금.
- **채용(R&D 10라운드 2026-10-04)**: Q11 「diff를 보이는 명시적 갱신」 — `doctor.mjs --diff`(소스에서) + 설치기 미리보기 · 배선 설정 드리프트(settings.garagiste.json + doctor Read 매처 경고) · 기본 spawner --permission-prompts none.
- **채용(R&D 11라운드 2026-10-04)**: Windows spawn(shell)·kill(taskkill /T) · 대화형/무인 상호배제(conductRunning · GARAGISTE_CONDUCT) · Q10 프로파일.
