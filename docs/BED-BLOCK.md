# 침대 반영 블록 — CEO가 아직 실행하지 않은 것

정비 채널이 CEO에게 준 PowerShell 블록 중 **아직 실행되지 않은 것**만 둔다. CEO가 실행하면 출력의 마지막 커밋 줄을 정비 채널에 붙여 주고, 정비 채널이 그 블록의 「상태」를 바꾼 뒤 이 문서에서 지운다(실행 기록은 L2-TRIAL-2 · CHANGELOG에 남는다). 블록은 정본 커밋을 **SHA로** fetch한다 — main이 그 뒤 움직여도 블록은 그대로 쓴다. 블록 전체는 `& { … }` 하나다(안에 빈 줄 없이) — 붙여넣기가 줄마다 실행돼도 멈춤(throw)이 블록 전체를 멈춘다.

## 1. 사고 58·59(+ 그 바탕 57) · attack은 spec 뒤 한 바퀴 · 팩 상한 32 · 이유-차선 — 정본 ede9930 (2026-10-02)
- 상태: **미실행 · 선택** — L2 3판(`L2-TRIAL-3.md`)의 윈도우는 새 빈 폴더에 새로 설치하므로 이 블록은 2판 침대(todo-win)로 M2를 이어 쓸 때만 쓴다. 같은 날 전달한 앞 블록 둘(정본 45012b9 · attack 한 바퀴 + 상한 32 / 정본 1b05168 · 사고 58·59, 둘 다 미실행)을 대체한다(CEO 2026-10-02 「침대 블록도 새로」 · 이유-차선 채용 뒤 「너의 판단대로」). 앞 블록 중 하나를 이미 실행한 침대에서도 그대로 돈다(바뀌는 파일 10 → 7 · 1).
- 대상: 윈도우 침대(L2 2판의 `C:\L2\todo-win` — 폴더가 다르면 블록의 `$bed` 줄만 고친다).
- 하는 일: `.garagiste/scripts/*.mjs` 13 · `.garagiste/packs/*.md` 6을 정본 1b05168로(설치기와 같은 범위 · blob 해시로 대조 — 실제로 바뀌는 것은 brief·lib·redproof·ship·verify·work · attack.md·boot.md, brief에는 팩 상한 이유-차선: 상한~2배는 conductor가 `--large "<이유>"`로, 2배를 넘어야 CEO) · `CLAUDE.md`의 Flow 4 한 줄만 새 템플릿 줄로(옛 템플릿 9c677ec의 그 줄이 정확히 하나일 때 — 이미 새 줄이면 그대로 · boot가 채운 나머지와 줄끝은 그대로) · `.garagiste/team.json`의 `pack_kb_max` 32 미만이면 32(그 이상이면 CEO 값 그대로) · **selftest**(새 스크립트로 이 기계에서 boot unit을 끝까지 — 57의 탐침이 윈도우에서 처음 돈다) · CEO 커밋 하나.
- 사고 57이 함께 온다: 2판 수정 2는 「원문이 Node라 넣지 않는다」였지만 58·59가 57 위에 지어져(redproof·lib·ship이 57의 탐침을 부른다) 떼어 낼 수 없다. Node 원문(`node --test {file}`)에선 깨진 탐침이 늘 red라 무해 — 탐침이 도는 자리는 redproof의 base green과 scaffold ship뿐이다.
- 하지 않는 것: `.garagiste/HAZARDS.md`(설치기도 덮지 않는다 — 설치 뒤엔 프로젝트의 것이라 새 줄 넷(57 · attack 한 바퀴 · 58 · 59)은 침대 팩에 안 든다) · CRLF(`.gitattributes`)는 프로젝트의 수정 unit으로 — M2를 시작할 때 conductor에게 「CRLF 수정 unit 예」.
- 언제: M2 conductor 세션을 열기 전(conductor는 세션 시작 때 CLAUDE.md를 읽는다 — 열려 있던 세션은 닫고 새로 연다).
- 정상 출력: fetch 두 줄 · `SELFTEST PASS 19/19` · `git diff --stat`에 파일 10개(45012b9 블록을 실행했으면 7개 · 1b05168 블록을 실행했으면 1개) · `PASS gate wip` · 새 커밋 한 줄 · `git status --short`엔 `docs/STATUS.md`쯤(「LF will be replaced by CRLF」 경고는 무해). 다시 붙이면 `PASS 이미 정본 ede9930과 같다 — 커밋할 것 없음`.
- 멈춤: 「멈춤: …」 줄이면 아무것도 바뀌지 않았다 — 사전 점검(0)에서 멈췄거나 쓰던 것을 되돌렸다(「되돌렸다: …」 줄). 그 줄과 위 출력(selftest면 FAIL 단계와 그 출력)을 정비 채널로.
- 검증한 것(정비 채널, 2026-10-02): PowerShell 7.4(리눅스)와 cmd 대역으로 이 블록 그대로 — 모의 침대는 L2 회귀(b0da849)의 실제 todo 프로젝트(boot가 채운 CLAUDE.md · 원장)를 9c677ec로 되돌린 것, fetch는 GitHub에서 SHA로. 통과(ede9930판): LF · CRLF(줄끝 유지 · 한 줄만) · 45012b9 블록 뒤(7개) · 1b05168 블록 뒤(1개) · 다시 붙임(커밋 없음) — 19개 파일 모두 정본 blob과 같다. 멈춤은 아무것도 바꾸지 않았다: 커밋 안 된 CLAUDE.md(줄마다 붙여넣기) · 빈 파일 주입(되돌림). 같은 몸통의 1b05168판에서: 상한 36(그대로) · main 아닌 브랜치 · 없는 SHA · selftest 실패(되돌림). **줄마다 실행되는 붙여넣기**(stdin)에서 감싸지 않은 판은 사전 점검의 멈춤 뒤에도 계속 돌아 CEO의 커밋 안 된 줄까지 커밋했다 — 감싼 판은 같은 조건에서 멈췄다. 윈도우 PowerShell 5.1 자체로는 못 돌렸다(정비 채널 컨테이너엔 윈도우가 없다).

```powershell
# GARAGISTE 침대(윈도우) 반영 — 정본 ede9930(SHA로 fetch): 사고 58·59(+ 그 바탕 57) · attack은 spec 뒤 한 바퀴 · 팩 상한 32 · 이유-차선
# 블록 전체가 & { … } 하나다 — 붙여넣기가 줄마다 실행돼도 멈춤(throw)이 블록 전체를 멈춘다
& {
$bed = 'C:\L2\todo-win'
$expect = 'ede993049a8fc0baf6663fea3218c644bf022f69'
$from = '9c677ecbb1a969b17c9238791b4423b66ed850bb' # 침대를 설치한 정본 — 옛 CLAUDE.md 템플릿
$paths = '.garagiste/scripts', '.garagiste/packs', 'CLAUDE.md', '.garagiste/team.json'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8 # install.ps1과 같다 — node·git 출력의 한글
Set-Location $bed
# 0) 사전 점검 — 여기서 멈추면 아무것도 바꾸지 않았다
if ((git rev-parse --abbrev-ref HEAD).Trim() -ne 'main') { throw "멈춤: main이 아니다 — 아무것도 바꾸지 않았다" }
if (git status --porcelain -- $paths) { throw "멈춤: 커밋 안 된 변경이 있다(git status) — 아무것도 바꾸지 않았다" }
git fetch https://github.com/jaewhi-park/GARAGISTE $expect
$got = (git rev-parse FETCH_HEAD).Trim()
if ($got -ne $expect) { throw "멈춤: FETCH_HEAD $got ≠ 기대 $expect — 아무것도 바꾸지 않았다" }
New-Item -ItemType Directory -Force -Path .garagiste/session | Out-Null
cmd /c "git show ${from}:team/claude/CLAUDE.md.template > .garagiste\session\g_old.md"
cmd /c "git show FETCH_HEAD:team/claude/CLAUDE.md.template > .garagiste\session\g_new.md"
$o = [IO.File]::ReadAllText("$bed/.garagiste/session/g_old.md") -split "`n"
$n = [IO.File]::ReadAllText("$bed/.garagiste/session/g_new.md") -split "`n"
Remove-Item .garagiste/session/g_old.md, .garagiste/session/g_new.md
$d = @(0..($o.Count - 1) | Where-Object { $o[$_] -cne $n[$_] })
if ($o.Count -ne $n.Count -or $d.Count -ne 1) { throw "멈춤: 템플릿 차이가 한 줄이 아니다 — 아무것도 바꾸지 않았다" }
$old = $o[$d[0]]; $new = $n[$d[0]]
$c = "$bed/CLAUDE.md"; $t = [IO.File]::ReadAllText($c)
$ko = [regex]::Matches($t, [regex]::Escape($old)).Count; $kn = [regex]::Matches($t, [regex]::Escape($new)).Count
if (-not (($ko -eq 1 -and $kn -eq 0) -or ($ko -eq 0 -and $kn -eq 1))) { throw "멈춤: CLAUDE.md의 Flow 4 줄 — 옛 줄 $ko 개 · 새 줄 $kn 개 — 아무것도 바꾸지 않았다" }
$p = "$bed/.garagiste/team.json"; $j = [IO.File]::ReadAllText($p)
$m = [regex]::Match($j, '"pack_kb_max":\s*(\d+)')
if (-not $m.Success) { throw "멈춤: team.json에 pack_kb_max가 없다 — 아무것도 바꾸지 않았다" }
$files = @(git ls-tree --name-only FETCH_HEAD team/scripts/ team/packs/ | Where-Object { $_ -match '^team/(scripts/[^/]+\.mjs|packs/[^/]+\.md)$' })
if ($files.Count -ne 19) { throw "멈춤: 정본의 스크립트·팩이 19개가 아니다($($files.Count)) — 아무것도 바꾸지 않았다" }
# 1) 스크립트 13·팩 6을 전부 정본으로(설치기와 같은 범위 — 실제로 바뀌는 것은 8) · 2) CLAUDE.md Flow 4 한 줄 · 3) 팩 상한 32 미만이면 32 · 4) selftest
#    1~4 어디서 멈추든 되돌린다
$utf8 = New-Object System.Text.UTF8Encoding $false
try {
  foreach ($f in $files) {
    $rel = '.garagiste/' + $f.Substring(5)
    cmd /c "git show FETCH_HEAD:$f > $($rel.Replace('/', '\'))"
    if ((git rev-parse "FETCH_HEAD:$f").Trim() -ne (git hash-object -- $rel).Trim()) { throw "멈춤: $rel 이 정본과 다르다" }
  }
  if ($ko -eq 1) { [IO.File]::WriteAllText($c, $t.Replace($old, $new), $utf8) }
  if ([int]$m.Groups[1].Value -lt 32) { [IO.File]::WriteAllText($p, [regex]::Replace($j, '("pack_kb_max":\s*)\d+', '${1}32'), $utf8) }
  node .garagiste/scripts/selftest.mjs
  if ($LASTEXITCODE -ne 0) { throw "멈춤: selftest FAIL — 위 출력을 정비 채널로" }
} catch { git checkout -- $paths; Write-Host "되돌렸다: $($paths -join ' ')"; throw }
# 5) CEO 커밋 — 이미 정본과 같으면 커밋하지 않는다
git diff --stat -- $paths
if (git status --porcelain -- $paths) {
  $env:GARAGISTE_SHIP = '1'; $env:GARAGISTE_WIP = '1'
  git commit -m "scaffold(team): GARAGISTE ede9930 - incidents 57-59 + attack one round after spec + pack_kb_max 32 + pack reason lane" -- $paths
  $rc = $LASTEXITCODE
  Remove-Item Env:GARAGISTE_SHIP, Env:GARAGISTE_WIP
  if ($rc -ne 0) { git checkout -- $paths; throw "멈춤: 커밋 실패(되돌렸다) — 위 게이트 줄을 정비 채널로" }
} else { 'PASS 이미 정본 ede9930과 같다 — 커밋할 것 없음' }
git log -1 --format="%h %s"
git status --short
}
```
