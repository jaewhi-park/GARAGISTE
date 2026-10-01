# 필드 시험 1·2 — 범용성 (Python CLI · 웹 앱)

2026-10-01 · 정비 채널 재량 시험(CEO 지시: 「1순위 2순위 둘다」) · 목적: 이 프레임워크가 G2(TS·Windows) 밖의 프로젝트에서도 굴러가는가 — CEO 문서 「대부분의 프로젝트에 범용적으로」.
등록 시험이 아니다(사전 등록·예측 없음, 동결 없음 — 결함은 나오는 대로 정본 수리 → 필드 반영). 표는 판정이 아니라 결함 목록의 근거다.

## 차림
- 장소: 정비 채널의 클라우드 컨테이너(linux · node 22.22.2 · python 3.11). conductor = 중첩 헤드리스 Claude Code(`claude -p --resume`, 2.1.286), 필드마다 세션 하나.
- CEO 대리 = 정비 채널: 원문(BRIEF-draft)을 쓰고, 예/아니오에 답하고, try 카드를 직접 써 본다(웹은 실제 Chromium으로). conductor에게 준 말은 매 턴 그대로(스크래치패드 `turn.sh`).
- 설치: `install.sh claude -Project <dir> -Budget medium`(intake·spec·attack opus · build·boot·spike sonnet). 프레임워크 출발점: main 6622dbb.
- 필드 1 「가계부 CLI」(파이썬, 6줄 원문): add · month · export · 깨진 줄 견딤 · 네트워크 없음. intake → unit 6(boot 포함) · Q 3.
- 필드 2 「웹 메모장」(Node, 외부 프레임워크 없음, 6줄 원문): 목록 · 저장 · 삭제 · 재시작 뒤 보존 · 실제 브라우저 확인. intake → unit 6 · Q 2.

## 하네스 메모 (프레임워크 결함 아님)
- 부모 세션의 `CLAUDE_*` 환경이 중첩 세션에 새면 세션 id가 합쳐지고 권한이 부모로 보류된다 — 인증 변수만 남기고 걷어 냈다.
- 신뢰 안 된 작업 공간에선 프로젝트 허용 목록이 무시된다(헤드리스는 신뢰 대화가 없다) — `~/.claude.json`의 작업 공간 신뢰로 풀었다. 실사용(대화형)은 첫 실행의 신뢰 대화가 같은 일을 한다. doctor 진단 후보(사고 아님).
- 정비 채널의 실수 1: 사고 29를 재현하려고 필드 1의 사본에서 돌린 `git worktree repair`가 원본 worktree의 링크를 사본으로 돌려놓았다 → 사본을 지우자 `.worktrees/boot`가 git 저장소가 아니게 됨. conductor가 원인을 정확히 짚고 멈췄다. CEO 쪽에서 `git worktree repair`로 복구, 프레임워크 FAIL로 세지 않음. 이때 verify는 FAIL 줄 대신 스택을 냈고(`git 저장소가 아니다`), doctor는 끊긴 worktree 링크를 보지 못한다 — 관찰(폴더를 옮기면 실사용에서도 난다).

## 사고 — 정본 수리 (커밋은 이 브랜치)
| 사고 | 필드 | 증상 | 수리 |
|---|---|---|---|
| 27 | 둘 다 | boot 팩이 `cd <wt> && git …`·`git -C <wt> …`로 커밋하려다 허용 목록 밖 → 헤드리스에서 거부, wip HEAD로 끝나 ship FAIL(안내도 scaffold에 「build를」) | 허용 목록 cd·git -C, 안내는 unit 정체의 팩 (86a56ed) |
| 28 | 탐침 | 가드의 git 검사가 전역 옵션을 못 봐 `git -C x reset --hard`·`commit --no-verify`·worktree push 통과, `-c core.hooksPath=`는 커밋 게이트를 통째로 끔 | 전역 옵션을 건너 하위 명령 판정, hooksPath는 게이트 우회로 거부 (86a56ed) |
| 29 | 1 | .gitignore 전 wip 체크포인트가 `__pycache__`를 담음 → ship rebase가 중간 커밋에서 「untracked would be overwritten」, FAIL은 첫 줄만 | ship이 unit 역사를 그 tree 한 커밋으로 접어 rebase, rebase 실패는 전문 (181c653) |
| 30 | 1 | 수용·공격 파일을 디렉터리 걷기로 모아 무시된 `.pyc`를 테스트로 셈 → redproof 「head red: …pyc」, attack 6/6(진짜 3) | git의 눈(추적 + 무시 안 된 미추적)으로 센다 (c1974a0) |
| 31 | 1 | worktree의 `.garagiste/scripts`는 갈라질 때의 사본 → main 정비가 진행 중 unit에 안 닿아 build가 옛 redproof로 같은 FAIL | worktree에서 불린 스크립트는 main의 법으로 넘긴다 (9db3303) |
| 32 | 1 | build 팩에 attack의 red가 없음 + 파이썬 discover는 `add-1.py`를 안 돌림 → build는 green만 보고 빈손, 「red>0 → build」 무한 | build 팩에 마지막 attack의 red 파일 전문, 끝 검사에 attack red 0 (13e73e3) |
| 33 | 1 | spec이 서로 어긋난 주장(-30000 ⊃ 3000)을 씀 → build의 `spec:` 줄을 받을 길이 Flow에 없고 redproof는 build 재spawn만 | `brief.mjs spec <slug> --return "<줄>"`, 두 번째 반려는 CEO (d18e671) |
| 34 | 2 | boot이 setup="true" → 뒤 unit의 dev 의존성이 main·worktree에 안 깔림, ship NOTE는 「돌렸다」 | 설치 명령 없는 의존성 출하는 머지 전 FAIL + CEO 한 줄, 메인 commands는 커밋·설치, verify가 의존성을 잇는다 (d18e671) |
| 35 | 2 | worktree의 node_modules 링크가 `.gitignore`의 `node_modules/`(디렉터리 패턴)에 안 걸려 커밋에 이 기계 경로가 들어감(사고 34 수리가 링크를 늘려 드러남) · try 산출물의 main dirt FAIL에 할 일 없음 | 링크는 로컬 제외(info/exclude)에 스스로 · 그 FAIL은 「CEO가 치운다」 (a1c7bc8) |
| 36 | 2 | 앞 unit이 이미 만든 기능(persist)의 주장이 base green → redproof FAIL에 다음 할 일 없음, conductor는 질문을 못 냄 | 그 FAIL이 CEO의 두 길(drop --forget · 다시 spec)을 명령으로 (628e730) |
| 37 | 2 | 맨 끝의 `--forget`이 다음 인자(없음)를 값으로 먹어 꺼짐 → 닫은 unit의 BACKLOG 줄이 열린 채, scope가 다시 잡음 | 불리언 플래그는 값을 먹지 않는다 (3bb2f20) |

## 관찰 (장치 아님 — 백로그 후보)
- **try 잔여물, 두 번째 프로젝트**: CEO가 카드대로 메인 루트에서 `npm start` → 저장 → `data/memos.json`이 main에 미추적으로 남았다. L2 1일차 eoren.sqlite에 이은 두 번째 — 「try 샌드박스」(L2 표 이후 1순위 후보)의 둘의 규칙이 찼다.
- 파이썬의 공격 파일(`<slug>-n.py`)은 프로젝트의 full(`unittest discover`·pytest 기본 패턴)에 안 들어간다 — 출하 뒤엔 회귀를 지키지 않는 일회성 증거가 된다. 웹(node --test glob)은 들어간다. 이름 규칙 또는 full 정의의 문제 — 둘의 규칙 대기.
- 웹 boot가 spawn마다 `node --test tests/unit/`(디렉터리 — node 22에선 실패)를 먼저 쓰고 verify를 보고 glob으로 고쳤다. 팩이 직전 commands를 보여 주면 줄어든다.
- boot이 고른 것: 파이썬은 의존성 0 · unittest · `pip install -e .`(설치기는 main에서 시스템에 `ledger`를 깔았다), 웹은 의존성 0 · node:test · setup `true`(사고 34).
- `work.mjs list | head`에서 EPIPE 스택 — out()이 닫힌 파이프를 다루지 않는다(사소).
- **이미 충족된 주장을 증거로 박는 길이 없다**: 웹의 persist·browser-check, 파이썬의 no-network가 base green(앞 unit이 이미 만든 기능 · 검증 자체가 산출물 · 제약형 요구는 구조적으로 base red가 될 수 없다). 지금 길은 drop --forget뿐이라 spec이 쓴 재시작·실브라우저·네트워크 감시 테스트가 dropped 브랜치로 간다. 두 제품 — 둘의 규칙 충족, 백로그 2순위 후보(CEO 서명으로 「박기」), L2 동결 해제 뒤.
- conductor가 spec의 보고(「CEO 몫: drop 또는 원문 구체화」)를 질문으로 내지 못하고 「위 persist 질문」이라고만 했다 — 사고 36의 FAIL 안내 뒤엔 질문 문장을 그대로 냈다.
- 웹 build가 테스트가 쓴 `data/memos.json`과 node_modules 링크를 공격 결함으로 찾아 `.gitignore`에 넣었다 — 그 뒤 CEO try의 산출물도 무시되어 main을 더럽히지 않았다(프로젝트 몫의 해법).
- 공격이 「CSV 수식 주입」을 보안 항목으로 짚었지만 원문 밖이라 테스트로 남기지 않았고, conductor가 CEO 결정으로 올렸다 — CEO가 고치라 해 버그 unit(인터럽트 경로)으로.

## 표 — 정비 채널이 원장에서 독립 산출 (conductor 표와 대조해 일치)
seed→끝 원시는 그 unit의 마지막 `unit` 줄 → `ship`/`drop` 줄, 아무것도 빼지 않음 — **정비를 기다린 시간(사고 수리·반영)이 들어 있다**. 토큰은 `work.mjs spawned` 기록. attack은 docs/LEDGER.md 칸.

**필드 1 — 가계부 CLI(파이썬)** · scope → 마지막 ship/drop 58.2분 · 팩 29 · 토큰 695K(intake 10K 포함) · conductor 세션 비용 보고 $8.64(11턴 누적)

| unit | 끝 | seed→끝(분) | 팩 | 토큰 | attack | tried(CEO) | 멈춘 프레임워크 FAIL |
|---|---|---|---|---|---|---|---|
| boot | 출하 | 14.6 | 3 (boot 3) | 57K | — | ok | 27 · 29 (+정비 채널 실수 1, 세지 않음) |
| add | 출하 | 14.2 | 7 (spec 1 · build 5 · attack 1) | 154K | 6→0/3 (선발견 6엔 사고 30의 .pyc 3이 섞임 — 진짜 3) | ok | 30 · 31 · 32 |
| month | 출하 | 12.6 | 6 (spec 2 · build 3 · attack 1) | 134K | 2→0/2 | ok | 33 (반려 1) |
| export | 출하 | 3.6 | 4 | 94K | 2→0/2 | ok | 0 |
| jsonl-robust | 출하 | 6.3 | 4 | 133K | 3→0/4 | ok | 0 |
| export-fix (CEO 버그 — 인터럽트) | 출하 | 3.4 | 4 | 83K | 1→0/2 | ok | 0 |
| no-network | drop(이미 충족, CEO) | 2.2 | 1 (spec 1) | 30K | — | — | 0 (사고 36의 안내로 바로 질문) |

**필드 2 — 웹 메모장(Node)** · scope → 마지막 ship/drop 54.5분 · 팩 22 · 토큰 531K(intake 10K 포함) · conductor 세션 비용 보고 $6.96(8턴 누적)

| unit | 끝 | seed→끝(분) | 팩 | 토큰 | attack | tried(CEO) | 멈춘 프레임워크 FAIL |
|---|---|---|---|---|---|---|---|
| boot | 출하 | 8.1 | 3 (boot 3) | 56K | — | ok | 27 |
| serve-list | 출하 | 4.3 | 4 | 79K | 2→0/2 | ok | 0 |
| save-memo | 출하 | 10.1 | 5 (spike 1 포함) | 136K | 1→0/2 | ok(실 Chromium) | 0 |
| delete-memo | 출하 | 18.4 | 8 (spec 2 · build 3 · attack 2 · spike 1) | 188K | 2→0/2 | ok(실 Chromium) | 34 · 35(main dirt) (반려 1) |
| persist | drop(이미 충족, CEO) | 5.1 | 1 | 34K | — | — | 36 · 37 |
| browser-check | drop(이미 충족, CEO) | 3.7 | 1 | 28K | — | — | 0 |

## 판정 — 범용성
- **굴러간다, 단 수리 11건을 거쳐서.** 두 제품 모두 M1 SCOPE DONE, CEO try 10장 전부 ok — **green 후 CEO 발견 결함 0**(웹은 실제 브라우저로, CLI는 경계 입력까지). attack 선발견 합 19건(파이썬 16 중 .pyc 3 제외 13 · 웹 5)이 출하 전에 닫혔다 — 날짜 미검증, 대시 인자, 비UTF-8 인자 Traceback, 깨진 memos.json 덮어쓰기, `GET //`·null 항목 서버 다운, `.`·`..` id 삭제, 탭 뒤 `=` 수식 주입 등.
- **사고의 결**: 11건 중 9건이 「G2(TS·Windows·node)에선 안 보이던 것」 — 파이썬 산출물(29·30·32), 의존성 생애(34·35), 진행 중 unit의 법(31), 헤드리스 권한(27), 이미 충족된 주장(36), 반려 경로(33). 둘(28·37)은 원래 있던 구멍을 탐침·첫 사용이 찾았다. 전부 FAIL 줄이 막다른 길이거나(안내 없음·실행 불가) 거짓 안내였다 — 「FAIL은 다음 할 일을 말한다」는 계약이 범용성의 실제 경계였다.
- **conductor 규율**: 두 conductor 모두 프레임워크 FAIL에서 우회·스크립트 편집 없이 멈추고 원인을 정확히 짚었다(정비 채널 실수의 링크 고장까지). CEO 파일(try 산출물)엔 손대지 않고 물었다(a093919 가드 이후). 이탈 1: 웹 conductor가 spec의 질문을 CEO에게 내지 못함(사고 36의 안내 뒤 해소).
- **남은 것(장치 — L2 동결 해제 뒤)**: try 사본 · 이미 충족된 주장 박기 — 둘 다 두 제품에서 나와 둘의 규칙을 채웠다.
