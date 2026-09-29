# GARAGISTE — 증거 팀

> 코딩은 주장을 참으로 만드는 일이다. 주장은 테스트·프로브·불변식이고, 팀은 그 그래프 위의 스케줄러이며, 사람은 방향·현실·책임 — 그리고 창이다.

GARAGISTE v2는 Claude Code 위에서 도는 **AI-native 개발팀**이다. 사람 회사를 흉내 내는 역할(기획자·비평가·리뷰어)이 없다. 있는 것은 파일로만 인수인계하는 네 팩(spec·build·attack·spike), 판단 없는 스크립트 열 개, 훅 셋, 그리고 원장이다.

- **실행되지 않은 것은 믿지 않는다.** 스펙은 red 인수 테스트, 승인은 exit code, 리뷰의 산출물은 실패하는 테스트.
- **루프는 기계가 끝낸다.** 커밋 게이트가 원장과 tree를 대조하고, `ship`은 7조건이 전부 참일 때만 main에 닿는다.
- **사람은 한 마디 · 예/아니오 · 「써봤다」.** STATUS 첫 줄이 매일 보는 전부다.

## 설치
```
./install.sh -Project <repo> [-Budget low|medium|high]     # macOS · Linux · Git Bash
.\install.ps1 -Project <repo> [-Budget low|medium|high]    # Windows PowerShell
```
`team/`이 `<repo>/.claude/`로 들어가고, `.githooks/pre-commit`이 커밋 게이트가 된다. 그 뒤 `.claude/team.json`의 `commands`(quick·full·test_file·run)를 채우면 팀이 산다. `quick`은 `tests/acceptance`·`tests/adversary`를 빼고(red 상태로 커밋되므로), `full`은 전부 포함한다.

## 한 unit의 생애
```
CEO 한 마디 ─▶ work.mjs new <slug> "<원문>"          (boundary HIT면 spike 팩부터)
           ─▶ brief.mjs spec  → red 인수 테스트 · try.md · surface.md → redproof.mjs = RED
           ─▶ brief.mjs build → red→green, 커밋마다 verify quick, 게이트가 원장 대조
           ─▶ brief.mjs attack → 실패하는 테스트 (tests/adversary) → build 재spawn → red 0
           ─▶ ship.mjs <slug> → 7조건 → main ff 머지 · LEDGER 한 줄 · STATUS 생성
CEO 「써봤다」 ─▶ work.mjs tried <slug> ok|fail
```
에이전트는 팩 파일 하나만 받고 서로 말하지 않는다. build는 attack을 만난 적이 없다 — 실패하는 테스트 파일을 만날 뿐이다.

## 스크립트 (판단 0)
| 스크립트 | 하는 일 |
|---|---|
| `work` | unit 생애: new · ask(hard 결정 큐) · decide · default(팀이 정한 것) · tried · list |
| `brief` | 팩 조립 ≤8 KB — 원문은 데이터 펜스, HAZARDS는 경로 매칭, 이어받기 절 |
| `verify` | quick · full · red · attack · **gate**(커밋마다 원장↔tree, 테스트 floor, step 300줄) |
| `redproof` | 인수 테스트가 base에서 red · head에서 green임을 증명 |
| `boundary` | 의존성·워크플로·IPC·권한·유출 키워드 → spike 필수 |
| `ship` | 7조건 fail-closed → ff 머지 · docs/LEDGER.md · STATUS |
| `claims` | 주장 그래프: 참·거짓·미검수·불명, 센서 커버리지, 다음 거짓 |
| `state` | docs/STATUS.md 생성(첫 줄 = 전부) · 무인 정지 예산 |
| `doctor` | 감별 진단 — 무엇이 죽었고 무엇을 치면 되는지 한 줄씩 |

훅: `guard`(파괴적 git·비밀·규칙집·팩별 쓰기 경계) · `spawn-log`(SubagentStop → wip 체크포인트) · `session-start`(alive + STATUS 첫 줄).

## 문서
- [docs/PRINCIPLES.md](docs/PRINCIPLES.md) — 네 문장과 뼈대 여덟, 사람의 창
- [docs/BIRTH.md](docs/BIRTH.md) — 0 base 탄생 프로토콜, 탄생 규칙 셋, 첫 3 unit 뒤의 판정선
- [docs/catalogue/](docs/catalogue/) — 후보 장치 카탈로그(v2 설계), v1 측정 진단, 토의 추가분. **계획이 아니다** — 사고가 나면 여기서 찾아 만든다
- [docs/DECISIONS.md](docs/DECISIONS.md)

## 이 저장소 검증
```
node --test tests/unit.test.mjs   # 순수 함수 17
node --test tests/e2e.test.mjs    # 탄생 시험: 빈 저장소 → 출하까지, 모델 0 · 네트워크 0
```

## v1
`claude/`·`opencode/`·`scripts/`·`assets/`는 v1(역할극) 트리다. v2는 이 트리에서 한 파일도 물려받지 않는다. 삭제는 CEO 결정(docs/DECISIONS.md).
