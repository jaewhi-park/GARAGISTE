# 침대 반영 블록 — CEO가 아직 실행하지 않은 것

정비 채널이 CEO에게 준 PowerShell 블록 중 **아직 실행되지 않은 것**만 둔다. CEO가 실행하면 출력의 마지막 커밋 줄을 정비 채널에 붙여 주고, 정비 채널이 그 블록의 「상태」를 바꾼 뒤 이 문서에서 지운다(실행 기록은 L2-TRIAL-2 · CHANGELOG에 남는다). 블록은 정본 커밋을 **SHA로** fetch한다 — main이 그 뒤 움직여도 블록은 그대로 쓴다.

## 1. attack은 spec 뒤 한 바퀴 + 팩 상한 32 — 정본 45012b9 (2026-10-02)
- 상태: **미실행** — CEO 환경 대기(2026-10-02 블록 전달, CEO가 그 자리에서 실행할 수 없었다).
- 대상: 윈도우 침대(L2 2판의 `C:\L2\todo-win` — 폴더가 다르면 블록 첫 줄만 고친다).
- 하는 일: `.garagiste/scripts/brief.mjs` · `.garagiste/packs/attack.md`를 정본 45012b9로(내용 해시로 대조) · `CLAUDE.md`의 Flow 4 한 줄만 새 템플릿 줄로(옛 템플릿 9c677ec의 그 줄이 정확히 하나일 때만 — boot가 채운 나머지와 줄끝은 그대로) · `.garagiste/team.json`의 `pack_kb_max` 24→32(이미 32면 그대로) · CEO 커밋 하나.
- 하지 않는 것: 사고 57 수리(원문이 Node라 닿지 않는다) · CRLF(`.gitattributes`)는 프로젝트의 수정 unit으로 — M2를 시작할 때 conductor에게 「CRLF 수정 unit 예」.
- 언제: M2 conductor 세션을 열기 전(conductor는 세션 시작 때 CLAUDE.md를 읽는다 — 열려 있던 세션은 새로 연다).
- 정상 출력: `git diff --stat`에 파일 3~4개 · `PASS gate wip` · 새 커밋 한 줄(「LF will be replaced by CRLF」 경고는 무해). 멈춤(throw)이면 아무것도 커밋되지 않았다 — 그 줄을 정비 채널로.
- 검증한 것: Flow 4 줄 치환을 boot가 채운 실제 CLAUDE.md 둘에 LF·CRLF로 돌려 정확히 한 줄만 바뀜 · SHA fetch로 FETCH_HEAD = 45012b9이고 9c677ec가 함께 온다. PowerShell 자체로는 실행해 보지 못했다(정비 채널 컨테이너에 pwsh 없음).

```powershell
# GARAGISTE 침대(윈도우) 반영 — attack은 spec 뒤 한 바퀴 + 팩 상한 32 · 정본 45012b9(SHA로 fetch)
$bed = 'C:\L2\todo-win'
$expect = '45012b9cc945ed6bddb74f64249582b09412c0cf'
Set-Location $bed
git fetch https://github.com/jaewhi-park/GARAGISTE $expect
$got = (git rev-parse FETCH_HEAD).Trim()
if ($got -ne $expect) { throw "멈춤: FETCH_HEAD $got ≠ 기대 $expect — 아무것도 바꾸지 않았다" }

# 1) 스크립트·팩 — cmd로 바이트 그대로 쓰고, 정본 blob과 해시 대조
cmd /c "git show FETCH_HEAD:team/scripts/brief.mjs > .garagiste\scripts\brief.mjs"
cmd /c "git show FETCH_HEAD:team/packs/attack.md > .garagiste\packs\attack.md"
foreach ($f in 'scripts/brief.mjs', 'packs/attack.md') {
  if ((git rev-parse "FETCH_HEAD:team/$f").Trim() -ne (git hash-object ".garagiste/$f").Trim()) { throw "검증 실패: .garagiste/$f 가 정본과 다르다" }
}

# 2) CLAUDE.md — Flow 4 한 줄만(옛 템플릿 줄 → 새 템플릿 줄 · boot가 채운 나머지는 그대로)
cmd /c "git show 9c677ec:team/claude/CLAUDE.md.template > .garagiste\session\g_old.md"
cmd /c "git show FETCH_HEAD:team/claude/CLAUDE.md.template > .garagiste\session\g_new.md"
$o = [IO.File]::ReadAllText("$bed\.garagiste\session\g_old.md") -split "`n"
$n = [IO.File]::ReadAllText("$bed\.garagiste\session\g_new.md") -split "`n"
$d = @(0..($o.Count - 1) | Where-Object { $o[$_] -ne $n[$_] })
if ($o.Count -ne $n.Count -or $d.Count -ne 1) { throw "멈춤: 템플릿 차이가 한 줄이 아니다" }
$old = $o[$d[0]]; $new = $n[$d[0]]
$c = "$bed\CLAUDE.md"; $t = [IO.File]::ReadAllText($c)
$k = ([regex]::Matches($t, [regex]::Escape($old))).Count
if ($k -ne 1) { throw "멈춤: CLAUDE.md의 옛 Flow 4 줄이 $k 개" }
[IO.File]::WriteAllText($c, $t.Replace($old, $new), (New-Object System.Text.UTF8Encoding $false))

# 3) 팩 상한 24 → 32 (이미 32면 그대로)
$p = "$bed\.garagiste\team.json"; $j = [IO.File]::ReadAllText($p)
if ($j -match '"pack_kb_max":\s*24\b') { [IO.File]::WriteAllText($p, [regex]::Replace($j, '("pack_kb_max":\s*)24\b', '${1}32'), (New-Object System.Text.UTF8Encoding $false)) }
if (-not (Select-String -Path $p -Pattern '"pack_kb_max":\s*32\b' -Quiet)) { throw "검증 실패: pack_kb_max가 32가 아니다" }

# 4) CEO 커밋
git diff --stat
$env:GARAGISTE_SHIP = '1'; $env:GARAGISTE_WIP = '1'
git commit -m "scaffold(team): GARAGISTE 45012b9 - attack one round after spec (brief.mjs, attack.md, CLAUDE.md Flow 4) + pack_kb_max 32" -- .garagiste/scripts/brief.mjs .garagiste/packs/attack.md CLAUDE.md .garagiste/team.json
Remove-Item Env:GARAGISTE_SHIP, Env:GARAGISTE_WIP
git log -1 --format="%h %s"
git status --short
```
