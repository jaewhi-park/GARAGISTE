# L1 시험 — 사전 등록 (pass line 표의 생산)

2026-09-29 등록 · 시험대: jaewhi-park/G2_TEST2 (Lacuna 재도전, docs/BRIEF-draft.md) · **프레임워크 동결: GARAGISTE 59bb724** (레포 설치 커밋 475c4a1)
이 문서는 시험 **전에** 커밋된다. 표가 나오기 전까지 v2의 모든 수치는 주장이다(docs/BIRTH.md).

## 동결 규칙
- 시험 중 프레임워크는 위 sha에 고정. **결함 수리는 허용**(원장·HAZARDS 기록 + 그 unit 재시작), **장치 추가·흐름 변경은 금지** — 표가 나온 뒤에.
- 수리로 재시작한 unit은 표에 「시도 n회」로 적는다. 예쁜 표를 위해 각색하지 않는다 — 정직한 기록이 이 표의 존재 이유다.

## 조건
- 티어 **high**(build=opus): 첫 표는 루프의 고정비 측정이라 모델 품질 노이즈를 뺀다. medium(build=sonnet) 재실행은 두 번째 실험(약모델 논제의 첫 데이터).
- conductor는 **G2_TEST2 안에서 연 새 세션**(훅·커밋 게이트 활성). 이 조건 밖에서 돌린 unit은 표에 넣지 않는다.
- N = **3 unit** (boot 제외 — 측정은 하되 판정 제외): ① 순수 로직(기계 수용) · ② 실제 기동 스모크가 수용에 든 것(하얀 화면 사고의 검사) · ③ boundary HIT(spike 경로). scope에서 이 구성이 되게 고른다.

## 시계 정의 (전부 원장 ts — 손 기록은 CEO-분뿐)
- **unit 시간** = `unit` 줄(seed) → `ship` 줄, `decide`·`tried`를 기다린 구간 제외.
- **CEO-분** = 서명(intake 결과 검토→scope)·decide·tried에 실제 쓴 분. 자가 스톱워치 — N=3이라 수용.
- **spawn** = `pack` 줄(의도) · `spawn_stop` 줄(완료), unit별.

## 표 (시험 후 이 자리에 기입)
| unit | 시도 | seed→ship(분) | spawn 의도/완료 | CEO-분 | attack 선발견 | tried | green 후 CEO 발견 결함 |
|---|---|---|---|---|---|---|---|
| ① |  |  |  |  |  |  |  |
| ② |  |  |  |  |  |  |  |
| ③ |  |  |  |  |  |  |  |

## 판정 (BIRTH pass line)
- **승인→출하 ≤75분 · unit당 spawn ≤8 · 미검수 ≤3 상시** — 셋 다 충족이면 L1 게이트 통과, L2(무인 하루)로.
- 부기: attack 선발견 대 tried fail 후발견의 비(Q4 — cs 리뷰 대체 가설의 판정), 순정 대비 3지표(unit당 CEO-분·done 후 결함·재브리핑 분)는 **기록만** — 정식 비교는 L2에서.
- 미충족이면: 원장 ts로 병목 구간(팩 조립·spawn·검증·재시도)을 지목하고, 장치를 더하는 게 아니라 그 구간을 수리한 뒤 재시험.

## 실행 절차 (conductor 세션에 그대로)
0. G2_TEST2 폴더에서 새 세션. `node .garagiste/scripts/work.mjs brief --file docs/BRIEF-draft.md`
1. CLAUDE.md Flow 2~4 그대로: intake spawn → 열린 Q 예/아니오 → `scope`(CEO 서명 — 여기부터 시계) → seed 루프. 인터럽트는 Flow 7.
2. 각 ship 뒤 CEO가 try 카드 → `tried ok|fail`. 미검수 3이면 멈춘다 — 그것이 정상 동작이다.
3. 3 unit 출하 후: 이 표를 원장(`.garagiste/ledger/evidence.jsonl`)에서 채워 커밋. 판정과 다음 걸음은 표가 정한다.
