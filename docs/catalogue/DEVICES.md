# GARAGISTE v2 — AI-native 개발팀 설계 (「증거 팀」)

> **이 문서는 계획이 아니라 후보 카탈로그다.** 장치는 원장에 기록된 사고나 측정된 비용에서만 태어난다(docs/BIRTH.md). 사고가 나면 여기서 찾아 그때 만든다. 아래 수치는 전부 목표치이며 실행되지 않은 주장이다.


2026-09-29 · 백지에서 다시 설계한 안 · 근거: v1 4일·72 plan·3 프로젝트 측정(garagiste-process-analysis.md) → 서로 다른 제1원리의 독립 설계 6안 → 심사 3편 → 종합 → 실제 사고 12건·에이전트 고유 실패 5종으로 스트레스 테스트 17건 → 보강. v1 수치는 측정값, v2 수치는 목표치(「측정 예정」)다.

---

## 0. 한 장 요약

v1은 사람 회사를 에이전트에게 입혔다 — 문서로 확신을 쌓고(brief→charter→spec→plan→critic), 읽기로 판정하고(2~5 렌즈·3라운드·verifier·self-check), 회고로 규칙을 더했다. 재 보니 결함을 실제로 잡은 것은 **둘**이었다: 다른 컨텍스트가 diff를 읽는 correctness+security 리뷰(A급 56 %), 그리고 **「돌려 봄」**(하얀 화면·B01·B02·0046 — 가장 비싼 rework 4/4). 나머지는 활성 시간의 53~59 %를 먹고 아무것도 못 봤다.

v2는 네 문장으로 요약된다.

1. **실행되지 않은 것은 믿지 않는다.** 스펙은 red 상태의 인수 테스트, 승인은 exit code, 리뷰의 산출물은 실패하는 테스트.
2. **팀이 경험할 수 없는 것은 제품이 스스로 관측하고, 남는 것만 CEO가 센서다.** 프로브 4종 + 스모크가 첫 코드이고, CEO가 못 본 출하물 수가 팀의 유일한 처리량 상한이다.
3. **기억은 컨텍스트가 아니라 저장소에 있다.** 상태는 git과 원장(jsonl)에만, 문서는 생성물, 세션과 에이전트는 소모품.
4. **규칙은 코드로만 늘어난다.** 산문 40 KB 상한, 사고 1건 = 검사 1개(테스트·프로브·훅 케이스), 산문 규칙 추가 금지.

역할은 넷(그중 하나는 세션 자체), 스크립트 15개가 판단 없는 배선을 전부 맡고, 보통 기능 하나에 spawn 3~5·활성 60~90분·첫 코드까지 ≈12분(v1: spawn 21~32·97~133분·≈30분)을 목표로 한다. 새 프로젝트는 브리프 승인 뒤 같은 세션에서 첫 코드 ≤30분·첫 try-card ≤90분(v1: 문서 13개·92분·코드 0·세션 재시작).

---

## 1. 제1원리와 철학 — 왜 이렇게 되는가

에이전트 팀의 비용 구조는 인간 팀과 뒤집혀 있다: **쓰기 쌈 · 읽기(컨텍스트) 비쌈 · 기억 없음 · 판단 불안정**. 인간 조직의 최적화(문서로 공유, 회의로 정렬, 리뷰로 품질)는 이 구조에서 전부 역최적이다. 그래서 다음 원리가 나온다.

| # | 원리 | 왜 에이전트 팀에서 성립하나 | v1의 무엇을 대체하나 |
|---|---|---|---|
| P1 | **실행이 승인이다.** 「tests pass」는 주장, exit code만 증거 | 에이전트는 자기 일을 확인해 줄 수 없고(자기 확신) 인간처럼 신뢰로 보완할 수도 없다; 실행은 결정론적이라 스크립트가 tree sha와 함께 기록하면 0비용 대조 | critic APPROVE·verifier 보고·self-check·METRICS 손기록·lead의 「판단 없는 형식 검사」 |
| P2 | **스펙은 실행 가능한 것만.** 작업 단위 = red 인수 테스트 + try.md 10줄 | 에이전트는 산문을 서로 다르게 읽고 기본값으로 메우지만 테스트는 해석 여지가 없고 green이 곧 Done | SPEC 인덱스·specs/F<nn>·plan §1 verbatim 복사 사슬·critic의 「Done-when ⊂ plan」 검사 |
| P3 | **사실은 코드보다 먼저.** 외부 SDK·엔진·패키징·새 의존성·파서는 30분 spike로 측정한 뒤에만 스펙을 쓴다 | I3·I4·I5·I11은 전부 「지어 보니 5분」이었던 사실이 문서 토론과 리뷰 3라운드를 지나 빌드·실 키에서 드러난 사건 | critic 1~3라운드, 계획 문서 |
| P4 | **판정은 다른 컨텍스트 + 기계 재실행으로만.** 스펙을 쓰는 컨텍스트 ≠ 구현 ≠ 판정, 판정 입력은 스크립트가 조립한 팩(구현자 보고 없음) | 독립성은 사람 수가 아니라 컨텍스트 격리에서 나온다; 역할 이름이 아니라 「저자의 추론을 볼 수 없음」이 독립성 | Proven 산문·9~10곳의 형식 검사 |
| P5 | **제품이 곧 센서, CEO는 나머지 센서.** 프로브를 첫 코드로 짓고(한 번 지으면 매 커밋 0비용), 남는 것은 try-card로 CEO 손에 보내되 그 손을 로그로 바꾼다 | 팀은 GUI·Windows·실 키·취향을 경험할 수 없다(F4) | 8 plan·12 h cap·iteration review 의식 |
| P6 | **기억은 저장소, 컨텍스트는 1회용.** 어떤 세션이든 첫 명령 doctor → state ≤40줄이면 이어 간다 | 컴팩션·세션 사망은 사건이 아니라 평상; 「담당자 머릿속」이 없다는 것은 bus factor ∞ | memory 54~63 KB 재독·보드 Edit 10~14회·resume 11.8 KB·「새 세션 열고 계속」 |
| P7 | **규칙은 코드로만 늘어난다.** 산문 ≤40 KB 훅 강제, 사고의 유일한 기록 형식은 HAZARDS 한 줄 + 검사 경로 | 산문 규칙은 3주에 4.8배로 불고 재발을 못 막았다(I7: memory 줄이 있었는데 재발) | retro 스킬·트리거 10종·memory 줄 |
| P8 | **절차가 아니라 불변식으로 통제한다.** 「무엇이 항상 참이어야 하는가」(main은 뜬다·비밀은 저장소 밖·네트워크 0·볼트 밖 쓰기 없음)만 기계가 상시 검사하고, 절차는 에이전트가 자유롭게 | 인간 조직은 절차로 통제하지만 에이전트에게 절차 준수 검사는 낭비(critic 소견 46 %가 형식) | critic 형식 검사·plan 형식 규칙 |
| P9 | **결정론적인 것과 확률적인 것을 분리한다.** 판단 없는 일(형식·크기·라벨·보드·머지 정책·지표)은 스크립트, 에이전트는 판단이 필요한 곳에만 | 확률적 기계에게 결정론적 배선을 시키면 비싸고 불안정(lead 100 KB 절차·tool call 70~110) | lead의 배선 hop 전부 |
| P10 | **되돌림 비용이 통제 강도를 정한다.** 코드는 게이트 0(실행으로 검증), 데이터 모델·공개 인터페이스·돈·라이선스·데이터 반출만 느리게 | 위험을 「파일 경로」로 정의하면 70~87 %가 high가 된다 | Risk path glob |
| P11 | **기본값은 실행하고 드러낸다.** soft는 즉시 실행 + 한 줄 기록(한 마디로 뒤집힘), hard(돈·라이선스·보안 경계·데이터 반출·데이터 모델·출하물 형태·폐기·모델 교체)만 정지 — 그것도 실물(표·로그·스크린샷)을 붙여서 | CEO 답의 80 %가 추천 수락 | AskUserQuestion 추천 메뉴 |
| P12 | **역할보다 계약.** 「너는 시니어 엔지니어」 대신 입력·출력·불변식·증거 형식 | 페르소나는 인간의 동기부여 언어 | 7 agent 파일 55 KB |
| P13 | **시간은 무료, 주의는 유료.** 야간은 탐색·정리·공격·부채 상환 시간; 처리량은 CEO가 검수할 수 있는 양에 묶인다 | 팀은 24시간 돌 수 있고 CEO의 주의만 희소 | 근무시간 개념·plan 수 cap |
| P14 | **제품을 에이전트 친화적으로 다듬는 것이 정당한 투자.** 작은 모듈·명시적 계약·빠른 테스트·한 줄 검증·결정론적 빌드·구조화 로그·가역성 | 에이전트는 사람보다 훨씬 많은 변경을 내므로 가역성 투자의 수익이 크다 | 「리팩터는 사치」 |

---

## 2. 팀 구조 — 역할과 컨텍스트 경계

역할은 넷이고 그중 conductor는 에이전트 파일이 아니라 메인 세션이다. 판단이 없는 일은 전부 스크립트(모델 0)가 한다.

| 역할 | 모델 | 하는 것 | 절대 안 하는 것(훅·permissions가 막음) | 받는 입력 |
|---|---|---|---|---|
| **conductor** (메인 세션) | 프로필 기본(판단이 없어 모델은 비용만 정함) | CEO 대화·triage, 스크립트 호출(`doctor/work/verify/ship/state`), spawn 발주, 결정 큐 기록. 절차의 전부 = CLAUDE.md `## Flow` 20줄 | 코드·테스트·문서 본문 쓰기, 판정, `git merge`/`gh pr merge`/main push(ship.mjs만 머지), `.claude/**` 수정(hard 결정 뒤 커밋만) | CEO 말, 스크립트 한 줄 출력, spawn의 마지막 ≤5줄 |
| **specifier** (1회용, opus) | opus | CEO 말(+spike 측정 파일)을 `tests/acceptance/<slug>.*`(red) · `try.md` · `surface.md`(≤10줄: 부를 인터페이스·설계 노트) · `@default(id, noun)` 태그로 번역. 새 프로젝트에선 team.json·ADR·smoke·프로브 골격·BACKLOG 시드(BRIEF 인용 ≤10줄)도 | 제품 코드 쓰기, 네트워크 | brief.mjs 팩(BRIEF·team.json·측정 파일[데이터 펜스]·매칭 hazard ≤10줄) |
| **builder** (1회용, sonnet) | sonnet | red→green; 커밋 = step(≤300 logic 줄); 커밋마다 `verify quick`; 커밋 trailer `Unit/Step/Proven`; `spike:` 인자면 일회용 worktree에서 30분 측정만; 버그는 재현 테스트부터 | 자기 worktree(`.worktrees/<slug>`) 밖 쓰기, `tests/acceptance/**`·`tests/adversary/**`·`fixtures/hostile/**`·`probes/**`·`.claude/**` 쓰기, `stash|restore|reset --hard|clean|merge|rebase|pull`, main push, spike 경로에서 commit | brief.mjs 팩(acceptance·try.md·surface.md·Commands·매칭 hazard·직전 verify 로그 경로·**이어받기 절**) |
| **adversary** (1회용, opus, 렌즈당 1) | opus | diff + acceptance를 읽고 결함을 **실패하는 테스트**(`tests/adversary/<slug>-<n>`) 또는 **hostile fixture**로 커밋. 테스트로 못 쓰는 것만 `security:|license:|taste:|spec:|platform:` 한 줄. 렌즈: correctness 항상, security(boundary 히트), ux(UI paths + 스크린샷) | 제품 코드 수정, 위 두 경로 밖 쓰기 | brief.mjs 팩(누적 diff·acceptance·try.md·BRIEF 원문·hazard·verify 결과·스크린샷) — **builder 보고서는 절대 없음** |

**스크립트(모델 0)**: `doctor · work · verify · redproof · spike · boundary · deps-gate · lint · ship · state · brief · try · showcase · wait · metrics · replay · redact` — v1 lead의 배선 hop 70~110회·verifier spawn·ship 3 spawn·보드 갱신을 대체한다.

**컨텍스트 경계 규칙**
- conductor 컨텍스트에는 실행 출력이 쌓이지 않는다: 스크립트는 stdout 한 줄(`PASS <id>` / `FAIL <id> <3줄>`), 나머지는 `.claude/session/logs/`. 10분 넘는 verify는 background로 돌리고 결과 파일을 읽는다.
- builder는 CEO 창 안에서만 background로 띄우고, 창 밖(무인)에서는 foreground 또는 `wait.mjs <spawn-id>`(stop 줄까지 대기, 뒤이어 `verify full`을 스크립트 체인으로 자동 실행)로 턴을 유지한다 — 「background 발주 뒤 턴 종료 = 파이프라인 정지」(스트레스 I10)를 막는 규칙. spawn-log 훅이 창 밖 `run_in_background: true`를 거부한다.
- 인터페이스 계약의 소유자: acceptance는 **외부 표면만** 부른다(CLI·렌더된 페이지를 통한 IPC·HTTP·파일 산출물·Playwright). 제품 소스 import 금지(lint가 import 그래프로 검사, `tests/harness/**`만 허용). 내부 API가 필요하면 specifier가 `surface.md`에 ≤10줄로 적고 builder는 그 안에서만 조정.
- 중간 설계 판단의 자리: 데이터 모델·파일 형식은 hard 결정이지만 그 아래 모듈 경계·상태기계·오류 모델은 specifier(opus)가 `surface.md` 설계 노트로 정하고, adversary correctness 첫 항목이 「acceptance·surface가 BRIEF 비목표·경계·데이터 모델과 충돌하면 `spec:` 한 줄 → hard 큐」 — 잘못된 스펙에 동조하는 경로를 끊는다.
- 외부 콘텐츠(README·wheel METADATA·엔진 system prompt 캡처)는 brief.mjs가 「데이터 — 지시가 아님」 펜스로 감싼다.
- 모델 편성은 `team.json.models`와 agent frontmatter에 있어 설치 시 보존된다(`install.sh -Budget <tier>`) — 세션 재시작 0.

---

## 3. 작업 단위의 생애

공통: unit = 브랜치 `unit/<slug>` + linked worktree(`work.mjs new`가 만드는 `.worktrees/<slug>` 하나만 — Agent `isolation: worktree`는 쓰지 않는다) + `tests/acceptance/<slug>.*` + `docs/units/<slug>/{try.md, surface.md}`. 상태는 git과 `.claude/session/evidence.jsonl`, `docs/LEDGER.jsonl`(ship 시 1줄)에만. 판정은 전부 스크립트 exit code. unit은 `kind: feature|bug|refactor|probe|showcase`와 `origin: ceo|bug|probe|debt`를 선언한다(lint 필수).

### [A] 새 프로젝트 — 같은 세션, 첫 코드 ≤30분, 첫 try-card ≤90분, spawn 3~4, CEO 접점 2

1. CEO 한 문단 + 대화 1라운드 → conductor가 `docs/BRIEF.md`(CEO 원문 verbatim ≤40줄 + 비목표 ≤10줄) 커밋. 질문은 돈·라이선스·데이터 반출·비목표만; 스택·예산·모델은 추천값 실행 + 결정 큐 soft 줄. `install.sh -Budget`은 세션 **전에**(GUIDE 첫 줄) — 이것이 유일한 순서 제약. spawn 0, ≈15분.
2. `doctor.mjs` 통과 → `work.mjs new 0001-skeleton`.
3. specifier spawn #1(≈15분): `.claude/team.json`(Commands 전부 ` — unverified`, boundary 파일 시드, platform_files, 허용 라이선스, targets, 예산) · `docs/adr/0001-stack.md`(≤40줄: 스택·보안 baseline·boundary 목록·target OS) · `tests/acceptance/0001-skeleton.*`(red: 실제 진입점으로 뜬다·페이지에서 시작한 IPC 한 왕복·보호 설정·네트워크 0) · `probes/` 골격 · smoke 계약 · `try.md` · **BACKLOG 시드 ≤10줄(BRIEF 문장 인용 + sensor 태그 + 크기)** — 밤에 이어갈 unit의 출처.
4. builder spawn #2(worktree, 20~40분): scaffold mechanical 커밋 → 초록까지 구현 → **캐너리 집합 확인**: 진입점·preload·IPC·렌더·DB 다섯 패치를 임시 worktree에 적용해 smoke가 각각 FAIL하는지 `verify canary`가 자동 확인(run-id 5개를 커밋 trailer에) → 프로브 4종을 가드 끈 상태에서 FAIL 확인(프로브 red-proof).
5. `verify.mjs full`(spawn 0, 3~8분) → 원장에 `full PASS @tree`; ` — unverified` 마커는 원장에 PASS가 있을 때만 스크립트가 지운다.
6. adversary security spawn #3(scaffold는 boundary를 치므로 1개): negative test 또는 hostile fixture. red면 builder spawn #4.
7. `ship.mjs 0001` → 머지 → LEDGER → try-card → STATUS 재생성(첫 줄 `실행: <run> · 안 본 것 1/3`). 세션은 그대로 BACKLOG 첫 줄로 간다. CHARTER·SPEC·ARCHITECTURE·README는 만들지 않는다.

v1: 문서 15·92분·코드 0·spawn 10~11·세션 재시작·LACUNA 7h13m.

### [B] 보통 기능(≈300줄, boundary 미히트) — spawn 3~5, 활성 60~90분, 코딩 ≥60 %

1. conductor(1~3분): CEO 한 마디 또는 BACKLOG 한 줄 → `work.mjs new <slug>`(브랜치·worktree·포트/HOME env·`boundary.mjs --files <후보> --text <원문>` 1차 판정·kind·origin).
2. specifier #1(8~15분): acceptance red 2~5개(외부 표면) + try.md + surface.md + `@default(id, noun)`(=결정 큐 줄과 1:1; noun으로 BRIEF·BACKLOG를 grep해 CEO 원문 히트면 soft→hard 강제).
3. builder #2(worktree, 30~60분): red→green, 커밋 = step. `git commit` 매처가 **스테이지 tree의 quick PASS가 원장에 있는지** 대조(역할·경로 무관, wip 커밋만 면제) + 테스트 파일 ≥1·numstat ≤2×·trailer. 300줄 넘으면 새 spawn이 마지막 커밋에서 잇는다(SubagentStop 훅이 미커밋을 `wip(<slug>)`로 자동 체크포인트).
4. `verify.mjs full`(0 spawn): quick(포맷 check 포함) + smoke(계약 JSON 검사) + probes + red-proof(test-id 단위, merge-base에서 재실행; 변경된 기존 테스트가 base·HEAD 모두 PASS면 「약화 의심」) + deps-gate(해당 시) + lint. **전체가 `unshare -m` 샌드박스(HOME·XDG·TMP 덮기) 안에서** 돈다. FAIL → builder 재spawn(로그 경로 한 줄). 라운드 상한 없음; `fix_minutes`(builder 활성 분, 스크립트가 셈) 초과 시 **soft 「같은 브랜치에서 계속」** + 큐 1줄(CEO 한 마디로 `work.mjs split`).
5. adversary #3(correctness; UI면 ux 병렬): 실패 테스트 커밋 → 원장 red → builder #4 → full 재실행. `taste:`는 DEBT 자동 append(unit이 되지는 않음 — F5 보강).
6. `ship.mjs <slug>`: 7조건 → main 위 ff-rebase(wip autosquash) → **통합 sha에서 full 재실행** → 머지(원격+보호면 PR·auto-merge) → LEDGER → try-card → STATUS → 커밋 1(커밋 직전 `quick --tree` 한 번 더) → worktree 정리.

v1: spawn 21~32·문서 touch 13·활성 97~133분(코딩 41~47 %).

### [C] 위험 변경(boundary 파일 히트 · 트리거: SDK·엔진·번들·설치·인증·subprocess·파서·lockfile·외부 실행물 이름 · platform 파일) — spawn 5~7, 활성 90~130분

0. **spike 먼저**: `spike.mjs <slug>` → builder `spike:` spawn(일회용 worktree, 30분 SIGTERM, 커밋 거부, 네트워크 허용) → `docs/measurements/<slug>-spike.md` ≤40줄 + `<slug>-deps.json`(전체 표) + fixture. 측정 템플릿의 **필수 행**: 실제 wire tool 이름 배열 · 산출물(target platform 실물) 라이선스 표(METADATA + 동봉 LICENSE + DLL 벤더) · 접속 호스트 · system prompt 꼬리(canary 경로는 `strings <binary>`로 뽑은 후보 전부 + HOME·XDG·cwd) · 자식 env 키 · SDK Options의 디스크·네트워크 기본값 표(persistSession·settingSources…) · 파서 eval/engines 옵션(`--sinks` 스캔) · **샌드박스 HOME 밖 새 파일 목록(0이어야)** · **실행 OS / target OS 미실행 여부**. 허용 밖은 코드 0줄에 hard 큐로.
1. specifier: 측정 파일 근거로 acceptance + **negative acceptance ≥1**(lint 강제) + surface.md.
2~4. [B]와 같음. full은 해당 프로브 4종 필수 + platform 판정.
5. adversary ×2 병렬(correctness + security). security 산출물 = hostile fixture(실행 페이로드형 시드 + 샌드박스 캐너리 부재 단언) 또는 negative test.
6. ship: deps-gate 재실행(산출물 기준); live 단계면 머지가 CEO 결정 큐 항목(그 unit만 정지).

「만들 수 있는 hard 결정」(출하물 형태: 패키징·설치·배포 형식·target OS)은 `artifact_form` 클래스로 자동 판정되어 **showcase**로 간다(§4 D21) — soft `@default` 금지.

### [D] 버그(CEO 한 줄 · `써봤다 fail` · 프로브 FAIL · CI main 빨강 · `base_red`) — spawn 1~3, 활성 10~25분

1. conductor: `work.mjs bug <slug>`(fail 로그·`escaped_from` 자동). plan·specifier 없음.
2. builder #1: 재현 테스트 red(red-proof 강제) → fix → 커밋 1~2. 설계 판단이 필요하면 무커밋 중단 + 한 줄 → [B]로 승격(같은 브랜치).
3. `verify full`. boundary 히트 시 adversary security 1.
4. ship. `escaped_from`이 있으면 HAZARDS 한 줄 + 검사 경로 필수, 그 검사가 사고 커밋 red·fix green임을 red-proof가 확인해야 ship(incident 컴파일러). 보안 red를 닫는 fix는 크기 상한 면제(시간 상한만).

v1: hotfix 0/71, 6줄 버그 41분.

### [E] 방향 변경(CEO가 말을 바꿈) — spawn 1~2

specifier 1: 영향받는 acceptance를 고치거나 지운다(tests의 git diff가 impact report). shipped된 것이 무효가 되면 hard 「폐기?」 1줄 → [B].

### [F] 리팩터(`kind: refactor`) — spawn 2~3

acceptance 대신 「기존 스위트 전체 + surface.md 불변 + 테스트 파일 numstat 0」이 완료 조건(lint가 kind별로 요구 조건을 바꾼다 — D6 모순 해소). origin은 CEO 한 마디(「부채 정리해」) 또는 프로브 FAIL만; DEBT 줄은 스스로 unit이 되지 않는다.

---

## 4. 장치 목록

장치마다 하네스로 짓는 법·담당 사고·스트레스 뒤 보강을 적는다. 그룹: 증거 / 센서 / 스펙·판정 / 상태·기억 / CEO / 안전·정지 / 규칙·진화.

### 4.1 증거 — 「돌린 것만 믿는다」

- **D1 team.json — 기계가 읽는 규칙집(정본)** [I8·F5]. `.claude/team.json` 한 파일: commands(setup/quick/full/smoke/screenshots/try/docs_quick) · boundary.files(파일 단위 ≤25) · boundary.triggers · boundary.externals(외부 실행물 이름·sha) · platform_files · ui_paths · owners · licenses.allow/exceptions · escalation(hard 클래스: 돈·라이선스·보안 경계·데이터 반출·데이터 모델·**artifact_form**·폐기·모델 교체) · budgets · targets · models · profile(ceo_window·tz·routine_hours·night_routine·parallelism) · probes · writes_allowed · bundles(addopts·exclude의 모든 제외 마커를 선언). 훅·스크립트·CI·테스트는 이것만 읽고, **verify·ship은 unit worktree 사본이 아니라 `git show main:.claude/team.json`을 읽는다**(F5 보강). CLAUDE.md ≤4 KB, Commands 절은 생성물. 테스트가 CLAUDE.md·STATUS·BACKLOG·DECISIONS를 문자열로 읽으면 lint FAIL(I8).
- **D2 verify.mjs + evidence.jsonl — 모델 없는 CI** [F2·I1·I2·I8]. `quick|full|smoke|probes|canary [--tree]`를 순서대로 실행, `{ts,unit,scope,head,tree,cmd,exit,dur_s,log,flake,platform,base_red}` 기록, stdout 한 줄. `git status --porcelain` 비어야 full. smoke 미등록이면 fail-closed FAIL. flake 1회 재시도, 2회 연속 flake는 bug unit. **full 전체가 샌드박스**(Linux `unshare -m` + bind-mount로 HOME·XDG·TMP 덮기; macOS/Windows는 env + 실제 `.claude/projects` 전후 스냅샷) 안에서 돈다(I5 보강). probes 스코프에서 「0 tests·skip>0·수집 실패」는 FAIL. `--only`·재시도는 원장에 그대로 표기(부분 실행을 전체로 기록 금지). CI는 push마다 경로 필터 없이 같은 스크립트.
- **D5 redproof.mjs — 주장을 기계가 재검** [F2·B급 28 %]. diff의 새·변경 테스트를 merge-base 임시 worktree에서 **test-id 단위**(junit/json 리포터)로 실행: 새 테스트가 base에서 단언 실패가 아니면 「공허」 FAIL(import 실패는 새 제품 모듈일 때만 red 인정); 변경된 기존 테스트가 base·HEAD 모두 PASS면 「약화 의심」 FAIL; base에서 **이미 FAIL**이던 테스트 변경은 red로 인정하지 않고 `unproven: base already red` → base_red bug unit 경로(I8). adversary 테스트는 merge-base가 아니라 **adversary가 본 r1 HEAD**에서 재실행(I12). `skip|only|xfail|exclude|--ignore|-k` 토큰이 diff·설정에 늘면 lint FAIL.
- **D28 커밋 게이트 — 모든 커밋은 원장 대조** [I8·F2]. PreToolUse `git commit` 매처가 `git write-tree`로 스테이지 tree를 계산해 evidence에 그 tree의 `quick PASS`(≤10분 전)가 없으면 exit 2 — **역할·경로 무관**(docs·team.json·CLAUDE.md 포함; 예외는 `wip(` 커밋과 spike 경로 거부). trailer의 green run-id는 그 줄이어야 하고 red run-id의 tree는 부모 tree. 불일치는 `denies.jsonl`에 `fake-trailer` 사건 줄(metrics 열). docs 커밋 비용은 `commands.docs_quick`(lint + `reads:config` 태그 테스트, 30초). 스크립트 커밋(ship·work decide|tried)은 커밋 직전 스스로 `quick --tree`.

### 4.2 센서 — 「팀이 경험할 수 없는 것을 제품이 관측한다」

- **D3 runtime smoke 계약 + 캐너리 집합** [I1·I2·F4]. smoke는 team.json 스키마로 고정된 JSON을 낸다: `{launched, ready_marker, pageerrors, console_errors, wires:{ipc,tool}, dom_marker, pixels_pct, window, child_exe}`. 필수 조건 = pageerror 0 ∧ console.error 0(allowlist) ∧ **IPC ≥1이 렌더된 페이지에서 시작**(Playwright `page.evaluate`→preload, 수신은 main 카운터) ∧ 첫 main 응답 뒤에만 그리는 `[data-smoke-ready]` DOM 마커 visible ∧ 선언된 wire마다 ≥1 ∧ `child_exe` 기록(tool wire는 가짜 끝점에 실제 자식이 보낸 요청만 인정); 픽셀은 보조. **진입점 동일성**: `commands.run`(CEO가 치는 명령)과 smoke 기동 줄이 같은 스크립트(`--smoke` 분기); dev/build 두 기동 모드를 선언하면 둘 다 매트릭스(LACUNA 0005형). `smoke: manual`은 `target_os ≠ platform`이고 대상이 packaged artifact일 때만 허용 — 진입점 smoke는 manual 불가, 컨테이너는 `xvfb-run` 기본. **캐너리 집합**: `probes/canaries/{entry,preload,ipc,render,db}.patch`를 `verify canary`가 임시 worktree에 적용해 smoke exit≠0을 단언, run-id 5개를 trailer `Canary:`에; smoke·preload·CSP·index.html·vite config가 diff에 있으면 full에서 재실행; CI canary-kill job 포함. 「초록으로 태어난 센서」를 구조적으로 막는다.
- **D4 probes/ 4종 + guard-kill CI + 양성 캐너리 + Popen 감사** [I3·I5·I7·I11]. (a) network-0: socket fixture + 127.0.0.1 **기록** 프록시 + Linux `unshare -rn` 안에 loopback DNS/HTTP sink(`resolv.conf`를 mount ns로 바꿔 **이름을 기록** — 막기만 하는 netns 금지) + 자식 env passthrough 키를 team.json에 선언. (b) tool-wire: `probes.tool_wire = {registry:"<모듈>#<export>", canary:true, level:"http"}` — 등록 이름은 제품의 살아 있는 등록 배열을 import해 읽고(fixture 목록 금지), **canary 툴**(점·특수문자 이름)을 프로브가 하나 더 등록해 wire에 실린 모양을 fixture로 굳힌 뒤 「변환 함수 출력 ⊆ wire」·「대본 tool_use → 핸들러 ≥1」·「요청 수 = 기대 수(덧 호출 0)」 단언; 목은 반드시 `ANTHROPIC_BASE_URL` 127.0.0.1 Messages 끝점이고 실제 SDK가 CLI 자식을 띄워야 한다(`queryFn` 주입 seam 교체는 lint 거부). 툴 등록 배열 파일은 boundary+트리거 → 새 툴이 추가되는 unit마다 fixture diff가 곧 측정. (c) file-egress: full 전체 샌드박스 전후 diff + **내용 캐너리**(픽스처에 nonce를 심어 allowlist 경로까지 전 파일 grep — 「경로 밖」과 「내용 유출」을 별개 단언). (d) child-env를 **「가드가 스스로 존재를 증명하는 양성 캐너리 + 관측 전용 Popen 감사」**로 재정의(I7 보강): `sitecustomize`가 import 시 `GUARD_CANARY_FILE`에 한 줄 append; 루트 conftest가 `sys.addaudithook`으로 `subprocess.Popen`을 읽기 전용 관측해 python/uv 자식마다 `{test_id, PYTHONPATH has netblock}` 기록; 함수 스코프 autouse `_guard_alive`가 teardown(monkeypatch 복원 전)에서 「이 테스트가 띄운 자식 수 == 캐너리 줄 수」·`guard_problems()==[]`·`key_present 0` 단언 — 0027·0035형(호출 지점 누락)은 첫 quick에서, 0036형(`undo`)은 그 테스트 끝에서 FAIL. canary-kill CI 뮤턴트: 가드 코드 제거 · `sitecustomize` import 삭제 · 임의 테스트에 `monkeypatch.undo()` 삽입 — 셋 다 red여야 프로브 등록. 프로브 red-proof는 **행동 오라클**: 가드 끈 실행의 FAIL 메시지에 spike가 캡처한 호스트/canary 문자열이 포함되고 그 문자열이 가드·프로브 코드에 리터럴로 없을 것(산출물 단언 게이밍 차단). 제외 묶음(`-m opencode` 등)은 team.json `bundles`에 선언·해당 OS에서 캐너리 켠 채 실행, 못 도는 OS는 STATUS 「미실행 묶음 N」.
- **D22 UI 센서층** [F4(UI)]. UI paths 히트 unit은 `shows:`마다 4상태 스크린샷을 **실제 프로세스에서**(Vite+mock harness 인정 안 함) 찍고 baseline pixelmatch diff + DOM 단언을 acceptance에 포함; diff 이미지가 ux adversary 입력과 try-card에 붙는다.
- **D25 platform 차원** [F4 — 스트레스에서 missed]. evidence·LEDGER·sensor에 `platform`. `target_os`를 team.json에; sensor 태그는 `machine@<os>` — target_os 전부에 원장 관측이 있어야 machine, 아니면 자동 `human@<os>`. ship 카운터는 `shipped ∧ ¬observed@target_os`를 세고 STATUS 첫 줄에 「target-OS 미관측 N」을 「안 본 것」과 별도로 — 상한 3은 이 수에도 걸린다. `platform_files`(engines/**·subprocess·electron main·build/**) + 토큰 트리거(`killpg|setsid|fcntl|fork|/tmp|HOME|\.npmrc|chmod|symlink|posix`) 히트면 `human@target` 필수 + try-card 자동. 0비용 정적 프로브 `probes/posix_only`(POSIX 전용 API AST grep, red-proof = killpg 삽입 → FAIL). hostile 시드에 Windows 경로(`C:\Program Files\a b\x.exe`·UNC·백슬래시·CRLF·대소문자 충돌). spike 필수 행 「실행 OS / target OS 미실행」. **CEO PC를 headless 검증기로**: PC 세션 루틴이 `git pull && verify full --platform win32`를 routine_hours마다 돌려 evidence를 `tries` 브랜치로 push → work.mjs가 pull해 `observed@win32`로 뒤집는다(CEO 손 0, PC 켜둠만). adversary 산출물에 `platform:` 줄 추가. 재현 불가 버그의 몽키패치 red는 정본 검사로 등록 금지.
- **D16 try-card + try 스크립트 + try-all + redaction + replay 승격** [F4·I1·I3]. ship이 카드(명령 1줄·단계 ≤3·기대·비용·답 형식)를 생성; CEO PC의 `npm run try <slug>`가 smoke + acceptance를 실환경에서 돌려 `redact.mjs` 뒤 `docs/tries/<slug>.log`를 남기고 붙여넣을 한 줄을 출력(엔진 `--version`·sha도 기록 → spike 버전과 다르면 version-mismatch bug unit 자동). fail은 로그 첨부 bug unit. `try --real`은 실 키 회차를 wire 수준으로 녹음해 `fixtures/replay/`로 승격(human→machine). try-all은 창당 ≤5장. leakcheck 범위를 `docs/tries`·`measurements`·`.claude/session`·`fixtures/replay`로 확장.

### 4.3 스펙·판정 — 「스펙은 테스트, 리뷰는 테스트」

- **D6 acceptance = 스펙 + surface.md + lint** [F3·I3·F5]. unit 정의 = red acceptance + try.md + surface.md + `@default(id, noun)`. `lint.mjs`(ship + `git commit` 매처): kind별 완료 조건(feature: acceptance ≥1·base red·HEAD green; bug: 재현 테스트; refactor: 기존 스위트 + surface 불변; probe: red-proof; showcase: 표) · boundary면 negative ≥1 · `@default` ↔ 큐 1:1 · **acceptance는 `tests/harness/**`만 import**(제품 소스 import 금지, import 그래프 정적 검사) · 제품 diff 중 acceptance가 안 덮는 파일은 「범위 밖」 표시 · owners 위반 커밋 FAIL.
- **D7 spike.mjs — 계획 대신 30분 측정** [I3·I4·I5·I11·F3]. 트리거 히트 시 일회용 worktree → builder `spike:` → 측정 파일(§3 [C]의 필수 행 템플릿, 스크립트가 골격을 찍음) + `-deps.json` + fixture → worktree 삭제. `boundary.mjs`는 `--files`뿐 아니라 **`--text`(CEO 원문·BACKLOG 줄·slug·surface)**를 받고, `boundary.externals`가 비어 있지 않은 프로젝트는 원문에 그 이름이 나오면 파일 후보 없이도 spike 필수(I11 보강). `--sinks`: 새 직접 dep의 소스에서 `eval|new Function|vm.|child_process|process.env|fs.write|net|http` 히트를 파일:줄 표로(I6 — gray-matter engines.js 즉시 히트); boundary 파일이 import하는 dep의 히트는 negative acceptance 또는 `@default` 줄 필수. metrics가 「acceptance에 인용되지 않은 spike 수」를 센다(남용 방지).
- **D8 boundary.mjs — 파일 단위 위험 판정** [risk:high 70~87 %·I6]. glob 대신 파일 목록(≤25) + 트리거 키워드 + diff 본문 토큰(`env=\{|PYTHONPATH|monkeypatch.undo|Popen\(|yaml.safe_load|json.loads|tomllib|frontmatter|parse\(`)으로 unit 작성 시와 review 전 두 번 판정, 결과는 **위로만**(conductor·adversary 상향 채널 유지 — critic A 8건 중 4건의 출처). 기본 시드에 `tests/conftest.py`·`tests/netblock/**`·`probes/**`·smoke·**`.claude/**`·`docs/HAZARDS.md`** 포함. boundary ⇒ spike(트리거 시)·negative ≥1·security adversary·HAZARDS 매칭 주입. 기대: 히트 30~45 %.
- **D9 adversary = 실패 테스트 + hostile 코퍼스 + 라운드 cap 폐지** [F2·I6·I12]. 산출물 규칙: `tests/adversary/<slug>-<n>` 또는 `fixtures/hostile/<parser>/<name>`; 못 쓰면 `security:|license:|taste:|spec:|platform:` 한 줄. **코퍼스 계약**: 시드는 「깨진 입력」이 아니라 **실행 페이로드** — 각 시드가 캐너리 행동(`globalThis.__HOSTILE__`·`$HOME/hostile-<id>` 쓰기·127.0.0.1 접속)을 품고 템플릿 테스트는 샌드박스 안에서 캐너리 부재를 단언; 파서 종류별 시드(frontmatter opener 언어 `---js|JS|javascript|coffee|json`, js-yaml `!!js/function`, python `!!python/object/apply`, toml/ini 보간, 템플릿 `{{}}`, `..`·심링크·UNC·BOM·NUL·비문자열 키·거대 입력·순환); 코퍼스 red-proof = 래퍼 없는 원 라이브러리에서 시드 ≥1 red. 파서 호출 지점은 `fixtures/hostile/registry.json`에 래퍼 등록 필수(lint). fix loop = red→green, 횟수 cap 없음; `fix_minutes`(builder 활성 분, 스크립트 계산) 초과는 정지가 아니라 soft 「계속」 + 큐 1줄, 크기 상한 `max(2×원 diff, 120줄)`·`security:` red 닫는 fix는 면제(I12). r2 범위 = r1 HEAD부터 누적 diff + boundary 파일. carry-over 없음. builder는 adversary·acceptance·hostile 경로를 쓸 수 없다(훅 + numstat lint). metrics가 문장 finding 비율을 재고 50 % 넘으면 렌즈 재검토.
- **D10 deps-gate.mjs** [I4]. 트리거 둘: (a) lockfile 변경 (b) unit 트리거가 번들·설치·패키징이거나 diff가 build/dist 스크립트를 건드리면 **산출물 실물 스캔**(`--artifact dist/* --platform <target>`; `pip download --platform` / npm tarball) — lock 불변이어도 돈다. 판독 대상 = dist-info `licenses/**`·`LICEN[CS]E*`·`COPYING*`·PE VersionInfo CompanyName·동봉 배포판 LICENSE(METADATA 분류자는 제외 — 0046의 MSVC/BSL/PSF는 동봉물에서 나왔다). 허용 밖이면 FAIL + hard Q 자동(미루기 불가, ship 차단). 승인은 `work.mjs decide Q<n> --scope`가 team.json `licenses.exceptions[{pkg,license,scope,decision}]`에 기록해 재질문 루프 차단. 산출 = `<slug>-deps.json`(전체) + md(허용 밖 행만). `pip-audit`·`npm audit` 포함; 주간 루틴이 변경 없이도 audit → CVE는 bug unit. hook-check에 numpy·pyarrow win wheel fixture.
- **D21 showcase — 「만들 수 있는 hard 결정」** [I4·F3·F4]. team.json `escalation.artifact_form`(keywords: 설치·패키징·배포·번들·installer·zip·exe·msi·dmg·.app·더블클릭·비프로그래머; files: electron-builder.*·build/**·winapp/**) 히트면 `work.mjs new`가 unit을 `kind: showcase`로 만들고 `@default`를 거부(Q만 가능) — Flow 4 「artifact_form → showcase」. `showcase.mjs`가 target_os·스택으로 표준 후보 3(런타임 번들 / 기존 설치 재사용 / 공식 배포본 + 얇은 실행기)을 worktree에 만들고 후보당 builder `spike:` 1(공유 30분, 병렬) → 샌드박스 아래 실제 빌드 → 표(≤6열: 산출물·크기·기동 시간·**라이선스(D10 json)**·**최종 사용자 사전 준비**·스크린샷; 허용 밖 회색+이유) → STATUS 「정해 주세요」에 번호 → CEO 답 = 번호. 일반 기능엔 쓰지 않는다. 미답이면 첫 회색 아닌 후보로 진행 + 되돌리기 한 마디.

### 4.4 상태·기억 — 「저장소가 기억, 컨텍스트는 1회용」

- **D14 state.mjs + SessionStart ≤40줄 + PreCompact 카운터** [F1·I10]. 상태 = git(브랜치·worktree·trailer) + evidence + LEDGER + DECISIONS Queue. `state.mjs`가 STATUS(≤1,800자)·PR 본문·try-card·CHANGELOG 줄·**Commands 절**을 생성; `--brief` ≤40줄만 주입(진행 중 unit·step·마지막 verify·**모든 `.worktrees/*`의 porcelain(미커밋 N파일 @slug)**·start-without-stop spawn·미검수 N·target-OS 미관측 N·hard 대기·다음 행동). 컴팩션은 종료 조건이 아니다. 손편집 보드·memory·resume·docs(status) 커밋 삭제.
- **D15 brief.mjs + HAZARDS.md** [F1·F5·I7]. spawn 프롬프트를 스크립트가 ≤8 KB로 조립(첫 줄 `cwd: <abs worktree> · branch: unit/<slug>`; Commands·acceptance·try.md·surface·변경 파일·glob 매칭 hazard ≤10줄·직전 로그 경로·BRIEF 원문). **이어받기 절 ≤15줄**: `git log main..HEAD` ≤10줄 + 마지막 커밋이 `wip(`이면 `show --stat`·`diff --stat`·직전 quick 로그 tail 5 + 고정 문장 「wip은 전임자의 미완 상태다: 이어서 green으로 만들고 다음 step trailer에 `Covers: <wip sha>`」. HAZARDS ≤40줄, 각 줄 `<날짜> · <사건> · paths: <glob> · → <check 경로>`(경로 없으면 커밋 거부; check는 코퍼스 테스트 + import-grep 테스트 두 겹 가능). `.claude/session/doctor-ok`가 없으면 팩을 만들지 않는다(spawn 전 doctor 강제). memory 파일 없음.
- **D23 worktree 격리 키트 + 자동 체크포인트** [F1·병렬]. `work.mjs new`가 `.worktrees/<slug>`(unit/<slug>)를 만들고 `.claude/session/worktrees/<slug>.env`(포트 대역·샌드박스 HOME·캐시)를 배정 — **유일한 작업 위치**(Agent `isolation: worktree` 사용 금지; spawn-log가 프롬프트 cwd 줄과 env 불일치를 거부). builder `maxTurns 80`(컴팩션 대신 재spawn이 기본 경로). **SubagentStop 훅이 builder 종료 시 porcelain이 비지 않으면 `git add -A && git commit --no-verify -m "wip(<slug>): checkpoint <agent_id>"`** + evidence `{scope:"wip", files, reason}` — maxTurns·rate-limit·컨텍스트 상한을 덮는다(「턴 종료 전 wip」 규약 삭제). 프로세스 사망은 다음 세션 `state --brief`가 porcelain을 표시하고 `work.mjs resume <slug>`가 wip 커밋 → 그 커밋에서 재spawn. `stash|checkout -- |restore|reset --hard|clean -f` 거부. ship의 ff-rebase가 wip를 다음 step에 autosquash(rebase 권한은 ship.mjs만); 마지막 커밋이 wip이면 ship FAIL 「미완 — 재spawn」. parallelism(기본 1)만큼 독립 unit 동시; 통합은 ship이 하나씩. 클라우드 conductor는 step 커밋마다 `git push -u origin unit/<slug>`(컨테이너 회수 대비).
- **D13 doctor.mjs + alive 마커 + 감별 진단** [I9]. SessionStart가 `alive{nonce, ts, platform, CLAUDE_PROJECT_DIR, session_id}`, PreToolUse가 `touched{ts, sha256(command), session_id}`를 쓴다. 세션 첫 명령 doctor: (i) 자기 호출의 touched(argv sha 대조, 5초 안)가 없으면 「PreToolUse 사망」 별도 FAIL; (ii) settings.json의 훅 command 문자열을 프로젝트 밖 cwd에서 OS 셸(Windows는 Git Bash·pwsh 둘 다)로 실행해 exit·stderr를 그대로 출력 — 성공이면 「훅 파일 정상, 하네스가 실행하지 않음 → `/hooks`·`claude --debug`·`~/.claude/settings.json` 충돌 확인」, 실패면 stderr 첫 줄 + 「`install.ps1 claude` 재실행 → 새 세션 → doctor」; (iii) 고치는 한 줄은 항상 재설치 명령 + 「훅 파일을 편집하지 마라」; (iv) 「훅 설정은 세션 시작 시 고정 — 수정 뒤 새 세션 필수」; (v) `agent_type`·`CLAUDE_PROJECT_DIR`가 실제로 오는지 시험 입력으로 확인; (vi) team.json 파싱·node·probes.requires. verify/ship/brief는 doctor-ok 없이는 거부. 설치기·Windows CI는 `ANTHROPIC_BASE_URL=127.0.0.1`(가짜 끝점) 아래 `claude -p 'ok'`로 마커를 assert(실 키·실 호출 0). 설치기가 `.claude/manifest`(파일 sha)를 남겨 손패치 감지.

### 4.5 CEO — 「센서이자 방향, 결재자가 아니다」

- **D17 미검수 상한 + sensor 태그 — 정지 장치** [F4·F5·I1·I3]. `sensor: machine@<os>|human@<os>`(machine은 원장 관측 파일 경로가 target_os마다 있어야 유효). `shipped ∧ human ∧ untried` ≥ `unseen_max`(3) 또는 `target-OS 미관측` ≥3이면 **정지**(machine-only redirect가 아니라 — F5 보강) + STATUS 첫 줄 + 푸시. CEO 답은 slug 단위만(`써봤다 <slug> ok|<증상>`); slug 없는 「잘 되는 것 같아」는 아무것도 바꾸지 않는다(LACUNA 8 plan 일괄 ok 아래 B02). 카드가 2창 pending이면 팀은 그 기준을 machine으로 바꾸는 unit을 먼저 올린다.
- **D18 결정 큐 + hard lint + question-as-artifact** [F3·I4]. `docs/DECISIONS.md ## Queue`: soft `d<n>`(기본값 즉시 실행·만료 없음·한 마디로 뒤집기) / hard `Q<n>`(기본값 없음·그 unit만 정지·**실물 경로 필수** — spike 산출물·표·로그·스크린샷). hard/soft는 team.json 키워드·파일 lint. `@default(id, noun)`의 noun으로 BRIEF·BACKLOG의 CEO 원문을 grep해 히트면 `d`→`Q` 강제(질문 필수까지만 — 원문을 옵션으로 강제하거나 카드를 거부하지 않는다: 0046은 CEO 본인의 선택이었고 v1의 게이트 stop 기본값은 옳았다). 이력은 CEO가 답한 것만 ≤200자.
- **D19 루틴 3종 + 알림 + 쿼터 원장** [I10·F5]. (a) CEO 창 30분 전 try·결정 큐 컴파일 + 푸시 1줄. (b) 창 밖 `routine_hours`마다 `claude -p resume`(doctor → state → 미검수 <3인 한 BACKLOG 다음 줄; 실 API 회차 절대 시작 안 함; `night_routine` 기본 off, 첫 측정 뒤 on). (c) 주간 deps audit·boundary 머지 있으면 hostile fuzz 1 spawn·metrics 표. 알림: 미검수 3·hard 대기·훅 죽음·main 빨강·쿼터 소진. 쿼터: `claude -p --output-format json` usage와 종료 코드를 원장에; 대화형 Agent 도구의 rate-limit 오류는 재시도 금지·STATUS 첫 줄·정지. 실행 환경 계약: 원격 프로젝트는 conductor가 도는 곳(클라우드 trigger 또는 CEO PC 세션 루틴)에서 돌고 git으로 상태 공유; CEO PC 루틴은 D25의 headless 검증기 역할도.
- **STATUS.md** (생성물, ≤1,800자):
```
실행: npm run dev · 안 본 것 2/3 · target-OS 미관측 1 · 결정 대기 1(hard 1) · 보호 ok · 진행 중 0012 step 2/4 · 마지막 확인 09-28 07:10
## 써볼 것 (≤3, 예상 6분)
- 0011-save-card · `npm run try 0011` · 저장 → 카드 → 재시작 뒤에도 남는다 · 답: 써봤다 0011 ok|<증상>
## 정해 주세요 (hard만)
- Q3 · Windows 설치 형태 · 표: docs/measurements/0046-showcase.md (후보 3 · 라이선스 · 사전 준비) · 답: 번호
## 팀이 정한 것 (뒤집으려면 한 마디)
- d7 · 저장 카드 기본 접힘 · 0011
## 멈춘 이유
- (없음)
```
CEO가 하는 것 셋, 전부 한 줄: 방향(자연어 → 같은 턴에 BRIEF/BACKLOG 원문 + unit) · 써보기(`npm run try <slug>` → 한 줄 붙여넣기) · hard 결정(번호). 새 PC에서 치는 유일한 명령은 doctor. CEO가 하지 않는 것: 커맨드 입력, plan·PR·spec 읽기, 추천값 수락, 세션 재시작, 보드 손질, 같은 부탁을 이틀째 듣기.

### 4.6 안전·정지 — 「fail-closed, 그리고 무인 폭주는 예산으로」

- **D11 ship.mjs — 출하는 스크립트 한 번(fail-closed 7조건)** [I8·I4]. (1) alive·doctor-ok가 이 세션 것 (2) HEAD tree `full PASS` (3) boundary면 adversary security 종료·red 0 (4) red-proof PASS (5) deps-gate PASS(해당 시) (6) lint PASS(kind별 조건·owners·**unit 브랜치의 `.claude/**` numstat 0**) (7) 이 unit의 미해결 Q 0·마지막 커밋이 wip 아님. 통과 시 main 위 ff-rebase(wip autosquash; 충돌은 builder 1) → **통합 sha에서 full 재실행** → ff 머지 / PR + auto-merge(정책 판정 1벌; live boundary는 CEO 한 마디) → LEDGER 1줄(`origin`·`sensor`·`platform`·spawns·minutes·first_code_min) → try-card → STATUS → 커밋 1(직전 quick --tree) → worktree 정리. `ship.mjs revert <slug|sha>`로 되감기(main 빨강·try fail·base_red) + 원장 `reverted`.
- **D12 guardrails-lite(≈200줄) + 층 구분** [안전 속성·F5]. **하네스 네이티브 `permissions.deny`(훅 무관 층)**: force push·`rm -rf`·`.env*`/credentials 읽기·`gh api` 비-GET·`git merge`·`gh pr merge`·main push. **guardrails.mjs(훅 층)**: 역할별 쓰기 경계(owners: `tests/acceptance/**`=specifier, `tests/adversary/**`·`fixtures/hostile/**`=adversary, `probes/**`·smoke·`.claude/**`=team, builder는 자기 worktree 안 나머지) · spike 경로 commit 거부 · 파괴적 git(stash·restore·reset --hard·clean) 거부 · push 정책(refspec·onMain·mirror) · wrapper unwrap · 산문 예산 · `git commit` 매처(D28) · 창 밖 background spawn 거부 · 무인 spawn 예산(D26). `agent_type` 부재 시 가장 제한적 역할. 거부는 `denies.jsonl`. hook-check ≈40(Windows 경로 포함).
- **D26 무인 정지 예산 + 규칙집 보호** [F5 — 스트레스에서 made_worse]. `budgets.unattended_ships_max`(마지막 CEO 접점 — 말·tried·decide — 이후 ship 총수, human+machine, 기본 5) · `ceo_free_streak_max: 2`(origin이 ceo·bug·probe 어느 것도 아닌 unit 연속) · `night_spawns_max`(예 20)·`night_opus_max`(예 8) — 초과 시 spawn-log PreToolUse가 Agent 호출을 exit 2로 거부, STATUS 첫 줄 + 푸시. machine-only 레인 자격 = origin ∈ {BACKLOG CEO 줄, escaped bug, 프로브·CI FAIL, human→machine 전환}; DEBT·`taste:` 줄은 CEO 한 마디 없이는 unit이 되지 않는다(자기 급식 루프 차단). **규칙집 보호**: `.claude/team.json`·`hooks/**`·`scripts/**`·`docs/HAZARDS.md`는 boundary 기본 시드 + `.claude/**` diff = 자동 hard(Q) — 변경은 CEO 답 뒤 conductor 커밋으로만; builder·specifier(kickoff 뒤)·adversary의 `.claude/**` 쓰기 거부; verify·ship은 team.json을 main sha에서 읽는다(builder가 `writes_allowed`를 넓혀 프로브를 초록으로 만드는 경로 차단). state.mjs가 매 ship마다 cost 합을 STATUS 둘째 줄에.

### 4.7 규칙·진화 — 「규칙은 코드로만 늘어난다」

- **D20 rule-as-code: 산문 예산 + incident 컴파일러 + metrics 표 + 정지 규칙** [F5·I7·I8]. (1) agents 3×≤4 KB + skills 3×≤3 KB + CLAUDE.md 템플릿 ≤4 KB 합계 ≤40 KB — 훅·CI 거부; Conventions ≤10줄 밖 규칙 줄은 `→ tests/…|probe:<name>|hook:<case>|scripts/…` 참조 없으면 CI 실패. 단 **산문 예산이 압축 진동(I8)의 방아쇠였다**는 점을 인정: 예산 대상은 팀 절차 산문만이고 프로젝트 지식(ARCHITECTURE·ADR)은 밖; 예산 초과는 「거부」가 아니라 「경고 + 다음 unit에 축소 unit 자동 생성」(fail-loud, 진동 없음). (2) 사고 = HAZARDS 한 줄 + check 경로; `escaped_from` bug unit은 사고 커밋 red·fix green 증명 필수. (3) 스크립트 파일당 hook-check ≥3, 총 LOC 상한은 초기 실측 뒤 1.3×로 설정(초기 추정치와 같게 두지 않는다). (4) `metrics.mjs`가 10 unit마다 표(첫 코드 분·approval→ship·spawn·A급 위치(spike/adversary/red-proof/try)·미검수·target-OS 미관측 체류·문장 finding 비율·가짜 trailer 수·산문 KB·미인용 spike 수) + **삭제 후보 1개 필수**(단 예방 게이트는 적중 0으로 삭제 후보가 되지 않는다 — 삭제 후보는 실행 비용 게이트와 profile knob에 한정). 정지 규칙: 3 unit 뒤 고정비가 안 줄었거나 red 검출이 v1 majors/100의 1/1.5 아래면 security 렌즈·spike 트리거를 넓힌다. retro 스킬·트리거 10종·게이트 적중 on/off·규칙 반감기는 없다.
- **D24 replay.mjs — 사건 재현 스위트** [v2 자체 검증]. LACUNA 0001(I1·I5)·0009(I3)·0023(I6)·AX 0027/0036(I7)·0034(I8)·0046 승인 직전 `a9bc29c^`(I4, target win_amd64)·0012형(builder가 writes_allowed 완화) 시점에 v2를 설치해 게이트가 FAIL하는지 확인 → `docs/measurements/v2-replay.md`. 장치 변경마다 재실행. GARAGISTE 저장소 CI에 상설.

---

## 5. 에이전트 팀이라서 가능한 구조

- **계획을 「지어 보고 버리기」로 대체**(D7·D21) — 사람에게 30분 프로토타입 폐기는 매몰비용이지만 스크립트가 worktree를 지우면 잔여물 0.
- **요구·구현·판정 컨텍스트의 완전 격리**(§2·D9) — 인간 팀원은 서로의 가정을 「모를 수」 없지만 별도 spawn은 공유 지식 0; B02형(등록 이름=wire 이름을 3 plan이 같이 믿음)이 구조적으로 준다.
- **모든 주장을 exit code로**(D2·D28·D11) — 사람에겐 모욕, 에이전트에겐 sycophancy 대책이고 비용 0.
- **새 테스트를 과거 커밋에서 매번 재실행**(D5) — 리뷰어의 「공허하지 않나」 직관을 매 커밋 기계 실행으로.
- **리뷰 산출물이 문장이 아니라 실패하는 테스트**(D9) — 에이전트는 문장보다 테스트를 빨리 쓰고 그것이 영구 회귀 방어.
- **센서의 mutation testing**(D3 캐너리 집합·D4 canary-kill·프로브 red-proof) — 「가드가 살아 있음」을 매 머지마다 공격으로 증명; 인간 조직은 가드가 꺼진 것을 사고 뒤에 안다.
- **amnesia를 기본으로**(D14·D15·D23) — 회의·보드·인수인계 문서 없이 git에서 재구성; 체크포인트는 죽는 에이전트가 아니라 훅이 찍는다.
- **제품이 스스로를 관측하는 프로브가 QA 인력**(D4) — 한 번 짓고 매 커밋 0비용.
- **여러 방식을 실제로 지어 보이고 고르게 하기**(D21) — 인간 팀은 하나를 고른 뒤 빌드해 보고 폐기한다(0046).
- **CEO의 손을 기계 로그로, 실 키 회차를 영구 센서로**(D16) — 사람 QA는 말로 보고하지만 팀은 로그를 읽어 bug unit을 만들고, 녹음해 replay로 승격.
- **CEO의 PC를 잠든 사이 검증기로**(D25) — 팀 OS ≠ 제품 OS의 틈을 CEO 손 0으로 메움.
- **인간의 수면을 빌드 창으로, 상한은 시간이 아니라 「못 본 출하물 수」와 「CEO 접점 없는 ship 수」**(D17·D26).
- **규칙집에 바이트 상한, 규칙은 실행 코드로만**(D20) — 산문은 매 spawn 비용, 테스트는 무료.

---

## 6. 에이전트의 한계 → 장치

| 한계 | 장치 | 정직한 잔여 |
|---|---|---|
| F1 컨텍스트 소실 | 상태 = git + jsonl(D14), 팩 ≤8 KB + 이어받기 절(D15), worktree 단일화 + SubagentStop 자동 wip + 파괴적 git 거부(D23), maxTurns 80 → 재spawn 기본 | conductor는 CEO 대화로 자란다 — 종료는 cap·쿼터·health로만 |
| F2 자기 확신·아첨 | 세 컨텍스트 격리(입력에 builder 보고 없음), exit code 원장(D2), 커밋 게이트 tree↔원장(D28), test-id 단위 red-proof·약화 의심(D5), 산출물 = 테스트(D9), owners 쓰기 경계, skip/only lint, fail-closed ship(D11) | 훅 정규식은 우회 가능 — F2는 적대가 아니므로 감수; 진짜 방어는 「스크립트만 원장을 쓰고 실제 명령을 실행한다」 + CI |
| F3 조용한 기본값 | `@default(noun)` ↔ 큐 1:1 + 원문 grep → Q 강제(D18), artifact_form → showcase 자동(D21), question-as-artifact, adversary `spec:`, STATUS 「팀이 정한 것」 | 새 종류의 hard를 키워드가 놓칠 수 있음 |
| F4 제품을 경험 못 함 | smoke 계약(D3)·프로브(D4)·UI diff(D22)가 기계 센서를 늘리고, platform 차원(D25)·try-card(D16)·미검수 상한(D17)이 남는 것을 CEO 손으로, 그 손을 로그·replay로 | 취향·GUI 상호작용은 CEO; Windows 기동은 CEO PC 검증기 |
| F5 드리프트·축적 | 무인 정지 예산·origin·규칙집 보호(D26), 산문 예산·incident 컴파일러·metrics 삭제 후보·정지 규칙(D20), 범위 밖 표시(D6), 쿼터 원장(D19) | 축적은 산문에서 스크립트로 옮겨갈 수 있음 — LOC 상한·hook-check·doctor fail-loud |
| 외부 세계 오해(모르는 것을 모름) | spike 필수 행 템플릿(D7)·`--sinks`·프로브 red-proof 행동 오라클 | 첫 발견은 여전히 opus 추론 — 발견은 실행 자산으로 남아 재발 0 |
| 판단 불안정 | 결정론적 것은 전부 스크립트(P9), 중요한 판정은 다른 컨텍스트 재실행, 골든·replay | — |
| 동일 모델 맹점 | 비-LLM 검증기(타입체커·린터·프로브·코퍼스·pixelmatch) 최대 활용 | 다른 모델 섞기는 예산 뒤 |

---

## 7. 인간(CEO)이 팀 완성도에 기여하는 것과 그 배선

| CEO의 기여 | v2 배선 |
|---|---|
| 현실의 센서(실 PC·실 키·실 사용자) | try-card·try-all·`try --real` 녹음(D16), PC headless 검증기(D25), 미검수 상한이 팀의 처리량(D17) |
| 목적 함수(무엇이 좋은가·무엇을 안 만드나) | BRIEF 원문 verbatim + 비목표 10줄이 헌장; adversary `spec:`가 충돌을 큐로 |
| 되돌리기 어려운 결정의 책임 | hard 클래스만 질문, 실물 첨부, 그 unit만 정지(D18); 라이선스 승인은 team.json 예외로 기록(D10) |
| 분포 밖 판단·문제 재정의 | 「방향」 한 마디가 같은 턴에 unit이 된다; 방향 변경은 acceptance diff([E]) |
| 암묵지·사정 공급 | 결정 큐 soft 줄을 한 마디로 뒤집기; 원문 grep이 질문을 강제 |
| 취향·문화 맥락 | UI diff 이미지가 붙은 2분 답(D22); `taste:`는 DEBT로만 |
| 정지 권한 | 「멈춰」 + 무인 예산(D26)이 CEO 없는 폭주를 미리 끊음 |
| 주의 = 우선순위 신호 | 무엇을 써봤고 무엇을 무시했는지가 LEDGER `tried`에 남아 metrics로 |
| 학습의 앵커 | CEO가 뒤집은 것(큐 이력)만 DECISIONS에 남는다 — 팀의 오차 신호 |
| 한 사람의 장점(합의 비용 0) | 추천 수락 80 % → 스택·예산은 통보; 단일 실패점은 adversary가 반대 의견을 테스트로 |

---

## 8. 세 모드에서의 모습

**신규 프로젝트** — 첫날의 산출물은 문서가 아니라 「돌아가는 뼈대 + 팀 자신의 센서(smoke 계약·프로브 4종·캐너리)」다([A]). 스택처럼 되돌리기 비싼 결정은 텍스트 질문이 아니라 showcase(후보 2~3 실제 빌드). 아키텍처는 처음부터 에이전트 친화적으로(작은 모듈·한 줄 검증·결정론적 빌드 — P14). 기획서는 CEO 원문 + 비목표 + BACKLOG 시드 ≤10줄로 최소화하고, 스펙은 뼈대 위에서 unit마다 acceptance로 자란다. 위험: 에이전트가 기본값을 조용히 채움 → 되돌리기 어려운 것(데이터 모델·인증·공개 인터페이스·출하물 형태)만 hard.

**레거시 인수** — 에이전트의 약점(모르는 것을 모름·컨텍스트 유한)이 가장 크게 드러나지만 강점(지치지 않는 전수 조사·특성화 테스트 대량 생성)도 있다. 방식은 「이해보다 관측」: (1) unit 0001 = 현재 동작을 골든·특성화 테스트로 대량 고정(v1 parity harness 개념 유지)하고 그것을 프로브·smoke와 함께 팀의 센서로; (2) 모듈·의존·진입점·위험 지도를 스크립트가 생성·유지(`map.mjs` — 기계가 읽는 지도, 사람용 문서 아님; brief 팩의 「관심 영역」이 여기서 나옴); (3) 변경 전 계측(로그·추적 삽입으로 실제 사용 경로 파악); (4) strangler fig 기본, 접합면(seam)마다 계약 테스트, 동작 보존 증명(특성화 green + surface 불변)이 있는 리팩터만 자동 머지(`kind: refactor`); (5) 컨텍스트 한계는 「코드베이스 전체를 읽지 않고 지도 + 관련 파일만」으로. 인간이 필수인 한 지점: 「버그로 보이는 현재 동작」을 보존할지 고칠지는 CEO만 판정 — 특성화 테스트가 그 동작을 그대로 굳히므로 질문은 「이 테스트를 그대로 둘까」로 실물이 붙는다.

**유지보수·기능개발** — 지속 운영 모드. 백로그 문서가 아니라 **신호**로 구동: `써봤다 fail`·프로브 FAIL·CI main 빨강·주간 audit(CVE)·`base_red`가 자동으로 bug unit을 만들고, 기능은 CEO 한 마디가 unit이 된다. 회귀 방지가 최우선(모든 버그는 재현 테스트부터, escaped bug는 HAZARDS 한 줄 + 검사). main은 항상 배포 가능(smoke가 머지 조건), 릴리스는 지속적(CHANGELOG는 생성물). 부채 상환은 CEO 한 마디로만 unit이 되고(F5), 의존성 업그레이드는 주간 루틴이 자동 시도 → 테스트 통과 시 머지. 장기 운영의 위험은 규칙 누적과 드리프트이므로 D20·D26이 여기서 가장 중요하다.

세 모드의 공통 구조는 「센서 먼저」다 — 신규는 만들고, 레거시는 특성화로 얻고, 유지보수는 운영 신호에서 얻는다. 통제는 되돌림 비용으로, 인간은 방향·현실·책임으로.

---

## 9. 물리적 형태

```
<project>/
  CLAUDE.md                     ≤4 KB · Language · ## Flow 20줄 · 아키텍처 포인터 · Conventions ≤10줄 (Commands 절은 생성물)
  .claude/
    settings.json               훅 5개 전부 "node \"${CLAUDE_PROJECT_DIR}/.claude/hooks/x.mjs\"" · permissions.deny(훅 무관 층) · allow(scripts)
    team.json                   정본 (§4.1 D1)
    manifest                    설치기가 남기는 파일 sha (손패치 감지)
    agents/{specifier,builder,adversary}.md   각 ≤4 KB · frontmatter model·maxTurns (builder 80)
    skills/{start,security,design}/SKILL.md   각 ≤3 KB
    hooks/{session-start,guardrails,spawn-log,pre-compact}.mjs
    scripts/{doctor,work,verify,redproof,spike,boundary,deps-gate,lint,ship,state,brief,try,showcase,wait,metrics,replay,redact,map}.mjs
    session/ (git-ignored)      alive · touched · doctor-ok · evidence.jsonl · denies.jsonl · spawns.jsonl · cost.jsonl · logs/ · worktrees/<slug>.env
  docs/
    BRIEF.md                    CEO 원문 verbatim ≤40줄 + 비목표 ≤10줄
    BACKLOG.md                  BRIEF 인용 줄 ≤10 + CEO 한 마디 줄 (origin: ceo)
    adr/0001-stack.md           ≤40줄 · 스택 · 보안 baseline · boundary 시드 · target OS
    DECISIONS.md                ## Queue (d<n> soft · Q<n> hard) + 이력(CEO 답만)
    HAZARDS.md                  ≤40줄 · <날짜> · <사건> · paths · → <check 경로>
    LEDGER.jsonl                ship당 1줄
    STATUS.md                   생성물 ≤1,800자
    units/<slug>/{try.md,surface.md}
    measurements/<slug>-spike.md · <slug>-deps.json · <slug>-showcase.md
    tries/<slug>.log            redaction 뒤
    DEBT.md                     adversary taste:·범위 밖 자동 append (unit이 되지 않음)
  tests/acceptance/<slug>.*  tests/adversary/<slug>-<n>.*  tests/harness/**  probes/{network0,tool_wire,file_egress,child_env,posix_only}.*  probes/canaries/*.patch
  fixtures/hostile/<parser>/*  fixtures/hostile/registry.json  fixtures/replay/<slug>/*
  .worktrees/<slug>/ · .worktrees/spike-<slug>/ · .worktrees/showcase-<slug>-<n>/ (git-ignored)
```

**스키마**
- evidence.jsonl: `{"ts","unit","scope":"quick|full|smoke|probes|canary|redproof|depsgate|lint|wip","head","tree","cmd","exit","dur_s","log","flake","platform","base_red"}`
- LEDGER.jsonl: `{"unit","kind","origin","shipped_at","head","tree","logic_lines","tests_added","adversary_red","spawns":{…},"minutes_active","first_code_min","boundary":[…],"spike":path|null,"sensor":"machine@os|human@os","observed":[os…],"tried":null|{…},"decisions":[…],"reverted":null|sha,"cost":{in,out}}`
- 커밋 trailer(builder): `Unit:` · `Step:` · `Proven: <test-id> red=<run> green=<run>` · `Canary: entry=<run> …`(smoke 변경 시) · `Covers: <wip sha>` · `Probe-change:`(probes 수정 시 — security adversary 필수); mechanical은 `Kind:` + 재현 명령.

**훅**: SessionStart → alive + `state --brief` ≤40줄 · PreToolUse(Bash|Edit|Write|…) → guardrails(D12·D28) · PreToolUse(Agent) + SubagentStop → spawn-log(창 밖 background 거부·무인 예산·usage 합산·**자동 wip 체크포인트**) · PreCompact → 카운터. 하네스 사실: PreToolUse exit 2만 막는다(PostToolUse는 못 막음); 훅 로드 실패는 non-blocking(→ D13); Bash 10분(→ background); Agent는 `maxTurns`·`model` frontmatter.

**CI**: `verify.yml`(push마다 full + canary-kill, 경로 필터 없음, 체크아웃 폴더 이름 랜덤화) · `windows-hooks.yml`(hooks selftest + doctor + 가짜 끝점 `claude -p`) · `weekly.yml`(deps audit·metrics). GARAGISTE 저장소: hook-check ≈40·산문 예산·스크립트 LOC·fixture 저장소 통합 테스트·**사건 재현 스위트(D24)**·도그푸딩(v2를 v2 절차로 짓는다).

**CLAUDE.md `## Flow`** (conductor 절차의 전부):
```
1 세션 첫 명령 node .claude/scripts/doctor.mjs — 실패면 unit 시작 금지, CEO에게 한 줄(재설치 명령).
2 CEO 말 triage: 방향→work.mjs new(+specifier) · 버그/써봤다 fail/base_red→work.mjs bug(+builder) · 써봤다 ok <slug>→work.mjs tried · 결정 <id>→work.mjs decide · 질문→답.
3 코드·테스트·문서 본문을 쓰지 않고 판정하지 않는다. 스크립트 한 줄 출력과 spawn 마지막 5줄만 읽는다.
4 boundary+trigger 히트면 spike.mjs 먼저; artifact_form 히트면 showcase; 측정 파일 뒤 specifier.
5 unit: specifier → builder(worktree; 창 밖이면 foreground 또는 wait.mjs) → verify full → adversary(boundary면 +security, UI면 +ux) → red면 builder → ship.mjs.
6 ship 뒤 BACKLOG 다음 줄로 — 미검수·target-OS 미관측 ≥3, 무인 ship ≥5, CEO 접점 없는 unit 연속 2면 정지 + 첫 줄 + 알림.
7 실 API 회차는 CEO 한 마디 없이 시작하지 않는다. .claude/** 변경은 Q.
8 컴팩션·세션 사망은 사건이 아니다: 다음 세션은 1부터.
```

---

## 10. v1에서 버리는 것과 남기는 것

**버린다(증거)**: critic 역할·REVISE 라운드(A 15 %·형식 46 % — A의 영역은 spike + negative acceptance + security adversary + hard lint가 맡음) · per-step verifier(7회 검출 0)·verifier 에이전트(스크립트가 같은 검출)·self-check 보고(관측 불가)·memory 54~63 KB(I7 재발) · performance·maintainability 렌즈·`>600줄 → 4렌즈`·3라운드 cap(I12)·carry-over · 산문 스펙 사슬·plan 파일·CHARTER·ARCHITECTURE·SPEC 인덱스 · STATUS-team·METRICS 12열·prs/ 사본·docs(status) 커밋·DECISIONS 산문 · hotfix 스킬(0/71)·`bug:→plan` 라우팅 · kickoff 문서 13개·brainstorm 5단계·「새 세션 열고 계속」·hire 재적용·iteration review 의식·8 plan|12 h cap·AskUserQuestion 추천 메뉴 · opencode flavor·team-builder·/parallel·/integrate·31 skills → 3 · Risk path glob · 컴팩션 3회 종료 규칙 · guardrails 427줄 중 역할 deny 대부분. 6안 중 기각한 장치: N후보 기본 병렬(토큰 N배·B02형은 N이 늘어도 공유 가정), held-out 오라클 훅, owner=메인 세션, 게이트 적중 통계 on/off·규칙 반감기(예방 게이트는 정상일수록 적중 0), HMAC 원장(극장), CEO 원문 grep 카드 거부(0046 오귀속), 결정 큐 만료 자동확정, 매일 opus red-team, 실 키 probe lane 자동.

**남긴다(가장 싼 형태)**: correctness+security 별도 컨텍스트 판정(A 56 %) → adversary, 산출물만 테스트로 · 「old code에서도 통과하면 major」 → red-proof 기계화 · test-first red→green + Proven → trailer + run-id · full 검증 1회 → verify.mjs, 통합 sha 재실행 · negative proves → boundary lint 필수 · step 300 / 작업 단위 크기 · runtime smoke DoD → 계약 JSON + 캐너리 집합 · 기계화된 안전 속성(leakcheck·socket 차단·쓰기 경계 grep·Electron 보호 설정 부정 테스트) → 프로브·canary-kill · 역할별 쓰기 경계·push-policy·wrapper unwrap·`gh api` 차단·비밀 파일 차단 → 층 구분 · STATUS ≤1,800자 → 생성물 · 브리프 1라운드 + 승인 · 에스컬레이션 항목 + 그 unit만 정지 · one unit = one branch + pre-launch 머지 · 무인 연속 실행(상한만 미검수·무인 예산) · 「써봤다」 slug 단위 · 한 줄 지시 → 최단 경로 · `install.sh -Budget`·`${CLAUDE_PROJECT_DIR}` 절대 경로 · parity harness 개념(레거시).

---

## 11. 스트레스 테스트 결과 — 종합안 → 보강 뒤

| 시나리오 | 종합안 판정 | 보강 뒤 | 잡는 장치(보강 뒤) |
|---|---|---|---|
| I1 LACUNA 하얀 화면 | 늦게(ready는 하얀 페이지에서도 발화, in-process IPC 테스트가 lint 통과, 캐너리 1종) | **조기** | D3 smoke 계약(pageerror 0·페이지에서 시작한 IPC·DOM 마커·진입점 동일성·dev/build 매트릭스) + 캐너리 5종 + D6 harness-only import lint |
| I2 AX B01 | 조기(단 `smoke: manual` 탈출구) | 조기 | D3 manual은 packaged artifact + OS 불일치만·xvfb 기본·구조화 JSON |
| I3 LACUNA B02 | 조기(단 프로브가 공허하게 태어날 틈) | 조기 | D4(b) registry import + canary 툴 + http 층 + 등록 배열 파일 트리거 + `Probe-change:` |
| I4 AX 0046 | 조기(단 트리거 텍스트·target·예외 기록 미명세) | 조기 | D7 `--text`·targets·D10 산출물 스캔·exceptions·D21 자동 showcase |
| I5 persistSession | 조기(단 샌드박스가 env 의존·team.json 완화 가능) | 조기 | D2 full 전체 `unshare -m` 샌드박스·내용 캐너리·child_exe·`.claude/**` hard·spike 필수 행 |
| I6 gray-matter RCE | 조기(단 코퍼스에 항목 있어야) | 조기 | D7 `--sinks` + D9 실행 페이로드 시드 + registry + builder deny |
| I7 network-0 재발 ×3 | **놓침**(고정 지점 센서·가드 없는 자식은 트래픽을 안 시도·제외 묶음 미실행) | **조기** | D4(d) 양성 캐너리 + Popen 관측 감사 + `_guard_alive` teardown 단언 + canary-kill 뮤턴트 3종 + bundles 선언·해당 OS 실행 |
| I8 docs 커밋 main 빨강 | 늦게(conductor docs 커밋·ship 마지막 커밋이 무검증, 산문 예산이 방아쇠) | **조기** | D28 커밋 게이트(모든 커밋 tree↔quick PASS)·`base_red`·no-doc-read lint·예산은 경고+축소 unit |
| I9 Windows 훅 사망 | 조기(단 「왜」를 모름·마커가 하네스에 안 묶임) | 조기 | D13 감별 진단·touched↔argv sha·가짜 끝점 `claude -p`·permissions.deny 층·manifest |
| I10 세션 경계·취침 4h44m | 늦게(background 뒤 턴 종료·다음 unit 출처 없음·worktree 이중) | **조기** | wait.mjs·창 밖 foreground·BACKLOG 시드·worktree 단일화·SubagentStop wip·push 규약 |
| I11 opencode v1 외부 접속·주입 | 조기(단 키워드 추상·canary 경로 미상) | 조기 | externals 트리거·canary 경로 `strings`·DNS sink 기록·프로브 행동 오라클·요청 수 단언 |
| I12 15줄 보안 수정 cap | 조기(단 30분 시계 소유자 없음·2× 상한이 소형 diff에서 교착) | 조기 | fix_minutes = builder 활성 분(스크립트)·soft 계속·`split`·하한 120줄·security 면제·r1 HEAD red-proof |
| F1 컨텍스트 소실 | 늦게(wip 규약 실행 불가·worktree 이중·이어받기 없음) | **조기** | D23 SubagentStop 자동 wip·단일 worktree·파괴적 git 거부·D15 이어받기 절·Covers trailer·maxTurns 80 |
| F2 아첨 | 조기(단 테스트·설정·원장을 고쳐 초록 만드는 경로) | 조기 | D28 tree↔원장·D5 test-id·약화 의심·owners·skip lint·`--only` 표기 |
| F3 조용한 기본값(설치 형태) | 늦게(hard 목록에 출하물 형태 없음·showcase 진입점 없음) | **조기** | D21 artifact_form 자동·showcase.mjs 표준 후보·D10 산출물 기준·`@default(noun)`·ship 조건 7 |
| F4 실환경 부재(Windows 엔진) | **놓침**(증거 모델에 platform 없음 → 리눅스 관측이 machine으로 통과, CEO에게 가는 경로 자체가 끊김) | **늦게→CEO 창** | D25 platform 차원·`machine@os`·target-OS 미관측 카운터·platform_files·posix_only 프로브·CEO PC headless 검증기 — 잔여: Windows 기동은 다음 CEO 창(v1: 3~7 plan 뒤) |
| F5 19시간 무인 드리프트 | **악화**(cap 도달 시 machine-only redirect → DEBT 자기 급식·builder가 team.json 완화 → fail-open) | **조기** | D26 무인 정지 예산·origin·규칙집 보호(`.claude/**` hard·main sha 읽기)·night spawn 예산·`taste:`는 unit 불가 |

---

## 12. v1 → v2 이행 (첫 2주)

GARAGISTE `claude/.claude/`를 v2로 재작성(v1은 태그로 남김; `opencode/`·agents 7·skills 28 삭제는 delete 커밋). 매일 산출물은 hook-check 케이스와 함께 커밋. 1인·Max 5x·하루 4~6시간 기준.

**1주 — 프레임워크**
- Day 1 정본·게이트: `team.json` 스키마 + 로더, `verify.mjs`(scope·porcelain·evidence·flake·platform·background 안내·`unshare -m` 샌드박스), `doctor.mjs`(감별 진단), `session-start.mjs`(alive + state --brief), settings.json 절대 경로 5개 + permissions.deny 층. hook-check 15.
- Day 2 실행 증명: `redproof.mjs`(test-id·약화 의심·base_red·r1-head 모드), `deps-gate.mjs`(산출물·target·동봉 라이선스·DLL 벤더·exceptions·audit·`--sinks`), `lint.mjs`(kind별 조건·harness-only import·owners·skip 토큰·no-doc-read·HAZARDS 경로·산문 예산), D28 커밋 게이트, CI 템플릿(verify + canary-kill·windows-hooks·weekly).
- Day 3 역할·훅: `guardrails.mjs` ≈200줄(층 구분·역할 경계·파괴적 git·spike commit 거부·창 밖 background 거부·무인 예산), `spawn-log.mjs`(usage·자동 wip 체크포인트), `pre-compact.mjs`, agents 3(≤4 KB, builder maxTurns 80), skills 3, CLAUDE.md 템플릿 + Flow, `brief.mjs`(팩·데이터 펜스·이어받기 절·doctor-ok 검사). v1 삭제 커밋.
- Day 4 센서: smoke 계약 템플릿(Electron·stdio·CLI) + `verify canary`(패치 5종), `probes/` 4종 × 2 스택(양성 캐너리·Popen 감사·`_guard_alive`·DNS sink·tool_wire registry/canary 툴·file-egress 내용 캐너리) + `posix_only`, `fixtures/hostile/` 실행 페이로드 시드 20종 + registry, `spike.mjs`(필수 행 템플릿), `boundary.mjs`(--files/--text/--diff·본문 토큰·platform_files·externals), `showcase.mjs`.
- Day 5 출하·상태·CEO: `work.mjs`(new|bug|tried|decide|resume|split·kind·origin·worktree env), `ship.mjs`(7조건·ff-rebase·autosquash·통합 full·정책·LEDGER·try-card·STATUS·revert), `state.mjs`, `try.mjs` + `redact.mjs` + `--real`, `wait.mjs`, `metrics.mjs`, DECISIONS Queue·HAZARDS 형식, 루틴 3종 정의, `install.sh -Budget` 기본 + manifest + 가짜 끝점 `claude -p` assert. GARAGISTE CI 등록.

**2주 — 적용과 측정**
- Day 6 tacit(훅이 죽었던 Windows 케이스, 코드 0): `1c3ceb1` 경로 수정 먼저 → CEO Windows PC에서 doctor 1회(감별 진단 확인) → 컨테이너 세션에서 [A] 전 과정(BRIEF 재사용). Windows 산출물은 `smoke: manual`·`human@win32`; CEO PC 세션 루틴을 headless 검증기로 등록. 측정: 첫 코드 분·첫 try-card 분·spawn.
- Day 7 LACUNA 소급: 설치, v1 문서는 `docs/archive/`로 delete 커밋(변환 안 함), CLAUDE.md regex 테스트를 team.json 로더로 재작성, boundary 파일 재시딩(≈12), BACKLOG open + pending → try 큐 시딩(미검수 즉시 12 → 첫 일은 try-all 창당 ≤5). unit 1 = smoke 계약 + 프로브 4종 + 캐너리(persistSession·wire 이름이 FAIL로 재현되는지 = D24 일부).
- Day 8 AX 소급: 같은 절차(미검수 9), unit 1 = smoke + child-env 양성 캐너리·Popen 감사(I7 재현) + canary-kill, `bundles` 선언(`-m opencode`·replay·golden), 라이선스 spike로 0046 표 재생(I4 재현, target win_amd64).
- Day 9 사건 재현: `replay.mjs`로 8 시점 게이트 FAIL 확인 → `docs/measurements/v2-replay.md`. 실패한 재현은 그 자리에서 장치 수정.
- Day 10~12 세 프로젝트 각 3 unit(기능·버그·boundary) 실측 → `metrics.mjs` 표(`v2-week2.md`). 정지 규칙 적용. 이 측정 뒤에만 `night_routine: on`.
- Day 13~14 정리: 삭제 후보 1개 실행, GUIDE ≤80줄(「CEO는 STATUS 한 장·세 종류 한 줄·새 PC는 doctor·설치는 세션 전에」), CHANGELOG 「v2」, hook-check 최종 ≈40, 스크립트 LOC 실측 → 상한 1.3× 설정.

**측정(3 unit 뒤 프로젝트마다)**: `approval→ship` 97/133 → ≤75분 · `first_code_min` ≈30 → 기능 ≤15·버그 ≤5 · spawn 21~32 → ≤8 · `adversary_red`·red-proof FAIL 수는 **v1 majors/100의 1/1.5 아래로 떨어지지 않음** · 미검수 상시 ≤3, target-OS 미관측 ≤3 · 가짜 trailer 0 · docs 커밋 비율 55/32 % → ≤30 % · 산문 ≤40 KB. 정지 규칙: 고정비 미감소 또는 red 검출 하락 → security 렌즈·spike 트리거 확대(team.json 한 줄, 되돌리기 싸다).

---

## 13. 남는 위험과 정직한 한계

- **센서 초기 비용이 첫 주에 몰린다**(smoke 계약·캐너리 5종·프로브 4종·양성 캐너리·Popen 감사 × 스택 2). 프로브 red-proof(행동 오라클)를 등록 조건으로 둬 공허한 프로브를 막지만, 웹서버·모바일 스택 템플릿은 첫 필요 시 작성.
- **acceptance가 산문 스펙을 대체하면 CEO는 「무엇을 만들기로 했나」를 try.md와 STATUS 한 줄로만 본다.** 부족하면 테스트 파일 상단 10줄 요약.
- **spike·showcase 남용**으로 고정비가 재생성될 수 있다 — 트리거는 파일·키워드·externals 히트로만, metrics가 미인용 spike를 센다.
- **fail-closed의 반대 방향 마찰**: doctor가 자주 거부하면 CEO가 짜증난다(I9의 반대). 감별 진단이 「무엇을 치라」를 한 줄로 내고, Windows CI·설치 자가 실행으로 줄이되 tacit 첫 주에 실측.
- **adversary가 테스트로 못 쓰는 결함(경합·성능·라이선스·취향)을 문장으로 남기면** 그 경로는 v1과 같다 — 비율 50 % 넘으면 렌즈 재검토.
- **I6형(문서를 읽어야 아는 실행 옵션)의 첫 발견은 여전히 opus 추론**이다 — `--sinks`가 후보를 좁히지만 최저선은 v1과 같고, 발견은 코퍼스 항목으로 남아 재발 0.
- **F4 Windows 기동은 CEO 창까지 기다린다** — CEO PC headless 검증기가 PC를 켜둔 시간에만 돌고, GUI 상호작용은 여전히 CEO의 손.
- **full이 10분을 넘으면** 커밋마다 quick만 돌고 full은 브랜치 끝에서만 — 원인 커밋 찾기가 느려진다(bisect 스크립트로 보완).
- **hard/soft 키워드 lint가 새 종류의 hard를 놓치면** F3가 재발 — adversary `spec:`과 CEO의 「팀이 정한 것」 읽기가 보조.
- **축적이 산문에서 스크립트로 옮겨간다**(17개 ≈1,500~2,000줄) — LOC 상한·파일당 hook-check·metrics 삭제 후보로 방어하지만 스크립트 버그는 훅 침묵(I9형)으로 나타날 수 있어 doctor·alive·touched가 fail-loud를 보장해야 한다.
- **Max 5x 쿼터**: 루틴·opus adversary·spike·showcase가 5시간 창을 잠식할 수 있다 — `night_routine` 기본 off, 무인 spawn 예산, 주간 fuzz는 boundary 머지가 있을 때만.
- **미검수 3·무인 ship 5 상한은 CEO 부재 며칠이면 출하를 세운다** — 의도된 back-pressure. 첫 줄에 이유.
- **훅 정규식은 우회 가능**(git plumbing·`node -e`) — F2는 아첨이지 적대가 아니므로 감수; 진짜 방어는 「스크립트만 원장을 쓰고 실제 명령을 실행한다」 + CI + 규칙집 main sha 읽기.
- **측정 없이 성립하는 수치가 없다**: spawn 3~5·고정비 ≤25분·첫 코드 ≤15분은 목표치. 3 unit 뒤 metrics 표가 v2의 첫 판정이고, 정지 규칙이 v2 자체가 축적형이 되는 것을 막는다.
