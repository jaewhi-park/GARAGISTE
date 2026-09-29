# GARAGISTE 증거 팀 설치 (Windows PowerShell) — 팀 정본을 <repo>/.garagiste/로, 하네스 배선을 .claude/ 또는 opencode.json + .opencode/로.
# Usage: .\install.ps1 <claude|opencode> [-Project <path>] [-Budget low|medium|high] [-DryRun]
param([Parameter(Position=0)][string]$Flavor = "", [string]$Project = ".", [string]$Budget = "medium", [switch]$DryRun)
$ErrorActionPreference = "Stop"
if ($Flavor -notin @("claude", "opencode")) { Write-Host "하네스: claude 또는 opencode"; exit 1 }
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (git -C $Project rev-parse --show-toplevel 2>$null); if (-not $Root) { Write-Error "git 저장소가 아니다: $Project"; exit 1 }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "node가 없다 (20 이상)"; exit 1 }
function Run([scriptblock]$b, [string]$what) { if ($DryRun) { Write-Host "  [dry] $what" } else { & $b } }
$tiers = @{ low = @{intake="sonnet";spec="sonnet";build="haiku";attack="sonnet";spike="haiku"}; medium = @{intake="opus";spec="opus";build="sonnet";attack="opus";spike="sonnet"}; high = @{intake="opus";spec="opus";build="opus";attack="opus";spike="sonnet"} }
if (-not $tiers.ContainsKey($Budget)) { $Budget = "medium" }; $M = $tiers[$Budget]
Write-Host "GARAGISTE 증거 팀 [$Flavor] → $Root (budget: $Budget)"
foreach ($d in ".garagiste\scripts", ".garagiste\packs", ".githooks") { Run { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null } "mkdir $d" }
Run { Copy-Item "$Here\team\scripts\*.mjs" (Join-Path $Root ".garagiste\scripts") -Force } "scripts"
Run { Copy-Item "$Here\team\packs\*.md" (Join-Path $Root ".garagiste\packs") -Force } "packs"
Run { Copy-Item "$Here\team\githooks\pre-commit" (Join-Path $Root ".githooks\pre-commit") -Force } "pre-commit"
if (-not (Test-Path (Join-Path $Root ".garagiste\HAZARDS.md"))) { Run { Copy-Item "$Here\team\HAZARDS.md" (Join-Path $Root ".garagiste\HAZARDS.md") } "HAZARDS" }
$team = Join-Path $Root ".garagiste\team.json"
if (-not (Test-Path $team)) {
  Run { Copy-Item "$Here\team\team.json" $team } "team.json"
  if (-not $DryRun) { $t = Get-Content $team -Raw | ConvertFrom-Json; $t.models = $M; $t | ConvertTo-Json -Depth 8 | Set-Content $team -Encoding UTF8 }
  Write-Host "  .garagiste/team.json — commands.quick·full·test_file·run을 채워라"
}
function Sub($src, $dst) { (Get-Content $src -Raw).Replace("{{MODEL_INTAKE}}", $M.intake).Replace("{{MODEL_SPEC}}", $M.spec).Replace("{{MODEL_BUILD}}", $M.build).Replace("{{MODEL_ATTACK}}", $M.attack).Replace("{{MODEL_SPIKE}}", $M.spike) | Set-Content $dst -Encoding UTF8 -NoNewline }
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
if (-not (Test-Path $Rules)) { Run { Copy-Item $Template $Rules } (Split-Path -Leaf $Rules); Write-Host "  $(Split-Path -Leaf $Rules) — {{...}} 자리를 채워라" }
$gi = Join-Path $Root ".gitignore"; if (-not (Test-Path $gi)) { New-Item $gi | Out-Null }
if (-not (Select-String -Quiet -Path $gi -Pattern "GARAGISTE 증거 팀")) { Run { Add-Content $gi ("`n" + (Get-Content "$Here\team\gitignore.snippet" -Raw)) } ".gitignore" }
Run { git -C $Root config core.hooksPath .githooks } "core.hooksPath"
Write-Host "---"
if (-not $DryRun) { node (Join-Path $Root ".garagiste\scripts\doctor.mjs") }
Write-Host "다음: team.json 명령 채우기 → 첫 unit: node .garagiste/scripts/work.mjs new <slug> `"<CEO 말 그대로>`""
