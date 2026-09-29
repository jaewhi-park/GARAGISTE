# v2 설계문서(garagiste-v2-design.md) 이후 토의에서 추가된 것 — 요약

- 자율 레벨 L1~L5: v2 = L3(사람은 방향·현실·hard 결정만). L4는 텔레메트리(제품 사용 신호)가 있어야.
- 장기 컨텍스트 = 층: 불변식(코드) · 생성된 모듈 지도(map.mjs) · surface.md(모듈 계약 ≤10줄) · 경로 매칭 HAZARDS · ADR(≤40줄) · measurements grep · BRIEF 원문 verbatim · 코드 grep. 팩 ≤8KB, 프롬프트 캐시 친화 접두(고정 부분 먼저).
- 아키텍처 층: `kind: architecture` unit, arch.json import lint(의존 방향), fitness function(모듈 수·결합도·최대 파일 크기·공개 표면 상한), 마일스톤 = acceptance 집합, 시스템 수준 acceptance.
- 게임 kit: 헤드리스 결정론 시뮬레이션, 리플레이 픽스처, 대량 시뮬레이션, 성능 예산. 스택 kit: desktop-electron · web-fullstack · mobile · service-batch-cli · game; egress allowlist·PII 경계 일반화; 프리뷰 배포 = try 카드.
- best-of-N 기본 아님; 조건부 `kind: tournament`만. 국소 루프는 기계가 끝낸다(원장 PASS·red 0·SIGTERM·wip 커밋).
- 테스트는 specifier가 쓴다; 사람은 예시와 예/아니오만.
- 프론티어 추가: 코딩 = 주장을 참으로 만드는 일(증거 그래프 스케줄링) · 센서 커버리지 KPI · 행동 diff · mutation 점수 · 스펙 adversary + 예/아니오 카드 · 리플레이 가능한 제품 · 불확실성을 출력으로 · 결정 만료 · 신뢰 캘리브레이션 · 모델 에스컬레이션 · 플릿 학습 코퍼스(HAZARDS·시드·프로브 → kit) · 프레임워크 red-team · 증명 커밋(proof-carrying) · 수동 사용 텔레메트리 · 모델 다양성 · "측정하거나 지운다".
- 사람의 렌즈 = 게이트가 아니라 창: 가독성 불변식(파일 ≤300줄·공개 표면 ≤12·의존 방향), 지도·ADR·surface.md, 주간 지형도(마일스톤 참/거짓·속도 기반 전망·적합도 추세·불확실·비용), "설명해줘"(explain <unit> 생성), cold-read 검사(신선한 컨텍스트가 15분 안에 아키텍처 설명), try 카드, STATUS 첫 줄, 정지·뒤집기.
