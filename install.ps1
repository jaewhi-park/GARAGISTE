# GARAGISTE 증거 팀 설치 (Windows PowerShell) — 팀 정본을 <repo>/.garagiste/로, 하네스 배선을 .claude/ 또는 opencode.json + .opencode/로.
# Usage: .\install.ps1 <claude|opencode> [-Project <path>] [-Budget low|medium|high] [-DryRun]
param([Parameter(Position=0)][string]$Flavor = "", [string]$Project = ".", [string]$Budget = "medium", [switch]$DryRun, [switch]$SkipSelftest)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
function WriteText([string]$Path, [string]$Text) { [System.IO.File]::WriteAllText($Path, $Text, $Utf8NoBom) }   # BOM 없이 — BOM이 붙은 team.json은 JSON.parse가 죽는다
function ReadText([string]$Path) { [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8) }
# git은 stderr에 말을 많이 한다 — ErrorActionPreference=Stop 아래서 그것이 예외가 되지 않게 감싼다. 결과: @{ Out = <문자열>; Code = <종료 코드> }
$GitExe = (Get-Command git -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $GitExe) { Write-Host "git이 없다"; exit 1 }
function Invoke-Git { param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
  $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
  try { $lines = & $GitExe @GitArgs 2>&1 | ForEach-Object { "$_" }; return @{ Out = (($lines | Where-Object { $_ }) -join "`n"); Code = $LASTEXITCODE } }
  finally { $ErrorActionPreference = $prev }
}
if ($Flavor -notin @("claude", "opencode")) { Write-Host "하네스: claude 또는 opencode"; exit 1 }
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
New-Item -ItemType Directory -Force -Path $Project | Out-Null
$probe = Invoke-Git -C $Project rev-parse --show-toplevel
if ($probe.Code -eq 0 -and $probe.Out) { $Root = $probe.Out.Trim() }
else {
  $init = Invoke-Git -C $Project init -q -b main
  if ($init.Code -ne 0) { $init = Invoke-Git -C $Project init -q; if ($init.Code -eq 0) { Invoke-Git -C $Project symbolic-ref HEAD refs/heads/main | Out-Null } }   # 옛 git엔 -b가 없다
  if ($init.Code -ne 0) { Write-Host "git init 실패: $($init.Out)"; exit 1 }
  $Root = (Resolve-Path $Project).Path; Write-Host "git init: $Root"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "node가 없다 (20 이상)"; exit 1 }
function Run([scriptblock]$b, [string]$what) { if ($DryRun) { Write-Host "  [dry] $what" } else { & $b } }
$tiers = @{ low = @{intake="sonnet";spec="sonnet";build="haiku";attack="sonnet";spike="haiku";boot="haiku"}; medium = @{intake="opus";spec="opus";build="sonnet";attack="opus";spike="sonnet";boot="sonnet"}; high = @{intake="opus";spec="opus";build="opus";attack="opus";spike="sonnet";boot="sonnet"} }
if (-not $tiers.ContainsKey($Budget)) { $Budget = "medium" }; $M = $tiers[$Budget]
Write-Host "GARAGISTE 증거 팀 [$Flavor] → $Root (budget: $Budget)"
foreach ($d in ".garagiste\scripts", ".garagiste\packs", ".githooks") { Run { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null } "mkdir $d" }
Run { Copy-Item "$Here\team\scripts\*.mjs" (Join-Path $Root ".garagiste\scripts") -Force } "scripts"
Run { Copy-Item "$Here\team\packs\*.md" (Join-Path $Root ".garagiste\packs") -Force } "packs"
Run { Copy-Item "$Here\team\githooks\pre-commit" (Join-Path $Root ".githooks\pre-commit") -Force } "pre-commit"
if (-not $DryRun) { $h = Invoke-Git -C $Root rev-parse --verify -q HEAD; if ($h.Code -eq 0) { Invoke-Git -C $Root add .githooks/pre-commit | Out-Null; Invoke-Git -C $Root update-index --chmod=+x .githooks/pre-commit | Out-Null } }
if (-not (Test-Path (Join-Path $Root ".garagiste\HAZARDS.md"))) { Run { Copy-Item "$Here\team\HAZARDS.md" (Join-Path $Root ".garagiste\HAZARDS.md") } "HAZARDS" }
$team = Join-Path $Root ".garagiste\team.json"
if (-not (Test-Path $team)) {
  Run { Copy-Item "$Here\team\team.json" $team } "team.json"
  if (-not $DryRun) { $t = (ReadText $team) | ConvertFrom-Json; $t.models = $M; WriteText $team (($t | ConvertTo-Json -Depth 8) + "`n") }
}
# 편성의 정본은 프로젝트의 team.json — 재설치의 -Budget이 기존 편성을 지우지 않는다(v1 재적용병의 백신)
if (-not $DryRun -and (Test-Path $team)) {
  $t2 = (ReadText $team) | ConvertFrom-Json
  if ($t2.models) { $M = @{ intake = $t2.models.intake; spec = $t2.models.spec; build = $t2.models.build; attack = $t2.models.attack; spike = $t2.models.spike; boot = $t2.models.boot } }
}
function Sub($src, $dst) { WriteText $dst ((ReadText $src).Replace("{{MODEL_BOOT}}", $M.boot).Replace("{{MODEL_INTAKE}}", $M.intake).Replace("{{MODEL_SPEC}}", $M.spec).Replace("{{MODEL_BUILD}}", $M.build).Replace("{{MODEL_ATTACK}}", $M.attack).Replace("{{MODEL_SPIKE}}", $M.spike)) }
if ($Flavor -eq "claude") {
  foreach ($d in ".claude\hooks", ".claude\agents") { Run { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null } "mkdir $d" }
  Run { Copy-Item "$Here\team\claude\hooks\*.mjs" (Join-Path $Root ".claude\hooks") -Force } "hooks"
  foreach ($a in Get-ChildItem "$Here\team\claude\agents\*.md") { Run { Sub $a.FullName (Join-Path $Root ".claude\agents\$($a.Name)") } "agent $($a.Name)" }
  $settings = Join-Path $Root ".claude\settings.json"
  if (Test-Path $settings) {
    if (-not (Select-String -Quiet -Path $settings -Pattern "hooks/guard.mjs")) { Run { Copy-Item "$Here\team\claude\settings.json" (Join-Path $Root ".claude\settings.garagiste.json") } "settings.garagiste.json"; Write-Host "  settings.json이 이미 있다 → .claude/settings.garagiste.json과 합쳐라" }
  } else { Run { Copy-Item "$Here\team\claude\settings.json" $settings } "settings.json" }
  $Rules = Join-Path $Root "CLAUDE.md"; $Template = "$Here\team\claude\CLAUDE.md.template"
} else {
  foreach ($d in ".opencode\agents", ".opencode\plugins") { Run { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null } "mkdir $d" }
  Run { Copy-Item "$Here\team\opencode\agents\*.md" (Join-Path $Root ".opencode\agents") -Force } "agents"
  Run { Copy-Item "$Here\team\opencode\plugins\guard.ts" (Join-Path $Root ".opencode\plugins\guard.ts") -Force } "plugin"
  $cfg = Join-Path $Root "opencode.json"
  if ((Test-Path $cfg) -or (Test-Path (Join-Path $Root "opencode.jsonc"))) {
    if (-not ((Test-Path $cfg) -and (Select-String -Quiet -Path $cfg -Pattern '"conductor"'))) { Run { Copy-Item "$Here\team\opencode\opencode.json" (Join-Path $Root "opencode.garagiste.json") } "opencode.garagiste.json"; Write-Host "  opencode.json이 이미 있다 → opencode.garagiste.json과 합쳐라" }
  } else { Run { Copy-Item "$Here\team\opencode\opencode.json" $cfg } "opencode.json" }
  Write-Host "  opencode 모델: 기본 provider/model을 상속한다. 팩별로 바꾸려면 .opencode/agents/<pack>.md 앞머리에 model:"
  $Rules = Join-Path $Root "AGENTS.md"; $Template = "$Here\team\opencode\AGENTS.md.template"
}
if (-not (Test-Path $Rules)) { Run { Copy-Item $Template $Rules } (Split-Path -Leaf $Rules) }
$gi = Join-Path $Root ".gitignore"; if (-not (Test-Path $gi)) { WriteText $gi "" }
if (-not ((ReadText $gi) -match "GARAGISTE")) { Run { WriteText $gi ((ReadText $gi) + "`n" + (ReadText "$Here\team\gitignore.snippet")) } ".gitignore" }
Run { Invoke-Git -C $Root config core.hooksPath .githooks | Out-Null } "core.hooksPath"
if (-not $DryRun) {
  $head = Invoke-Git -C $Root rev-parse --verify -q HEAD
  if ($head.Code -ne 0) {
    Invoke-Git -C $Root add -A | Out-Null
    Invoke-Git -C $Root update-index --chmod=+x .githooks/pre-commit | Out-Null   # NTFS엔 실행 비트가 없다 — 인덱스에 100755로 기록해야 맥·리눅스에서 훅이 돈다
    $env:GARAGISTE_SHIP = "1"
    $ident = @(); if ((Invoke-Git -C $Root config user.name).Code -ne 0) { $ident += @("-c", "user.name=garagiste", "-c", "user.email=garagiste@local") }
    $commit = Invoke-Git -C $Root @ident commit -q -m "scaffold(team): GARAGISTE install [$Flavor, budget $Budget]"
    Remove-Item Env:GARAGISTE_SHIP -ErrorAction SilentlyContinue
    if ($commit.Code -eq 0) { Write-Host "  첫 커밋: 팀 파일" } else { Write-Host "  ! 첫 커밋 실패:`n$($commit.Out)`n  다시: cd $Root; git add -A; `$env:GARAGISTE_SHIP=1; git commit -m 'scaffold(team): install'" }
  }
}
Write-Host "---"
# fail-closed: 빨간 채로 설치 완료를 선언하지 않는다 — doctor(--fresh)와 selftest가 PASS여야 설치다
if (-not $DryRun) {
  Push-Location $Root; $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
  & node .garagiste\scripts\doctor.mjs --fresh 2>&1 | ForEach-Object { "$_" }; $doc = $LASTEXITCODE
  $st = 0
  if ($doc -eq 0 -and -not $SkipSelftest) { & node .garagiste\scripts\selftest.mjs 2>&1 | ForEach-Object { "$_" }; $st = $LASTEXITCODE }
  $ErrorActionPreference = $prev; Pop-Location
  if ($doc -ne 0) { Write-Host "설치 FAIL — 위 doctor 줄이 이유다. 고치고 다시 설치하라."; exit 1 }
  if ($st -ne 0) { Write-Host "설치 FAIL — selftest. 위 단계 출력이 원인이다."; exit 1 }
}
Write-Host "다음: 이 폴더에서 세션을 열고(claude) 만들 것을 말하라. 첫 unit(boot)이 스택·명령·스모크·규칙 파일을 채운다."
