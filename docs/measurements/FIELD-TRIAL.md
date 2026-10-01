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

## 관찰 (장치 아님 — 백로그 후보)
- **try 잔여물, 두 번째 프로젝트**: CEO가 카드대로 메인 루트에서 `npm start` → 저장 → `data/memos.json`이 main에 미추적으로 남았다. L2 1일차 eoren.sqlite에 이은 두 번째 — 「try 샌드박스」(L2 표 이후 1순위 후보)의 둘의 규칙이 찼다.
- 파이썬의 공격 파일(`<slug>-n.py`)은 프로젝트의 full(`unittest discover`·pytest 기본 패턴)에 안 들어간다 — 출하 뒤엔 회귀를 지키지 않는 일회성 증거가 된다. 웹(node --test glob)은 들어간다. 이름 규칙 또는 full 정의의 문제 — 둘의 규칙 대기.
- 웹 boot가 spawn마다 `node --test tests/unit/`(디렉터리 — node 22에선 실패)를 먼저 쓰고 verify를 보고 glob으로 고쳤다. 팩이 직전 commands를 보여 주면 줄어든다.
- boot이 고른 것: 파이썬은 의존성 0 · unittest · `pip install -e .`(설치기는 main에서 시스템에 `ledger`를 깔았다), 웹은 의존성 0 · node:test · setup `true`(사고 34).
- `work.mjs list | head`에서 EPIPE 스택 — out()이 닫힌 파이프를 다루지 않는다(사소).
