# GARAGISTE 증거 팀 설치 (Windows PowerShell) — team/을 <repo>/.claude/로.
# Usage: .\install.ps1 [-Project <path>] [-Budget low|medium|high] [-DryRun]
param([string]$Project = ".", [string]$Budget = "medium", [switch]$DryRun)
$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (git -C $Project rev-parse --show-toplevel 2>$null); if (-not $Root) { Write-Error "git 저장소가 아니다: $Project"; exit 1 }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "node가 없다 (20 이상)"; exit 1 }
function Run([scriptblock]$b, [string]$what) { if ($DryRun) { Write-Host "  [dry] $what" } else { & $b } }
Write-Host "GARAGISTE 증거 팀 → $Root (budget: $Budget)"
foreach ($d in ".claude\scripts", ".claude\hooks", ".claude\packs", ".githooks") { Run { New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null } "mkdir $d" }
Run { Copy-Item "$Here\team\scripts\*.mjs" (Join-Path $Root ".claude\scripts") -Force } "scripts"
Run { Copy-Item "$Here\team\hooks\*.mjs" (Join-Path $Root ".claude\hooks") -Force } "hooks"
Run { Copy-Item "$Here\team\packs\*.md" (Join-Path $Root ".claude\packs") -Force } "packs"
Run { Copy-Item "$Here\team\githooks\pre-commit" (Join-Path $Root ".githooks\pre-commit") -Force } "pre-commit"
if (-not (Test-Path (Join-Path $Root ".claude\HAZARDS.md"))) { Run { Copy-Item "$Here\team\HAZARDS.md" (Join-Path $Root ".claude\HAZARDS.md") } "HAZARDS" }
$settings = Join-Path $Root ".claude\settings.json"
if (Test-Path $settings) {
  if (-not (Select-String -Quiet -Path $settings -Pattern "hooks/guard.mjs")) { Run { Copy-Item "$Here\team\settings.json" (Join-Path $Root ".claude\settings.garagiste.json") } "settings.garagiste.json"; Write-Host "  settings.json이 이미 있다 → .claude/settings.garagiste.json과 합쳐라" }
} else { Run { Copy-Item "$Here\team\settings.json" $settings } "settings.json" }
$team = Join-Path $Root ".claude\team.json"
if (-not (Test-Path $team)) {
  Run { Copy-Item "$Here\team\team.json" $team } "team.json"
  if (-not $DryRun) {
    $t = Get-Content $team -Raw | ConvertFrom-Json
    $tiers = @{ low = @{spec="sonnet";build="haiku";attack="sonnet";spike="haiku"}; medium = @{spec="opus";build="sonnet";attack="opus";spike="sonnet"}; high = @{spec="opus";build="opus";attack="opus";spike="sonnet"} }
    $t.models = $tiers[$Budget]; $t | ConvertTo-Json -Depth 8 | Set-Content $team -Encoding UTF8
  }
  Write-Host "  .claude/team.json — commands.quick·full·test_file을 채워라"
}
if (-not (Test-Path (Join-Path $Root "CLAUDE.md"))) { Run { Copy-Item "$Here\team\CLAUDE.md.template" (Join-Path $Root "CLAUDE.md") } "CLAUDE.md"; Write-Host "  CLAUDE.md — {{...}} 자리를 채워라" }
$gi = Join-Path $Root ".gitignore"; if (-not (Test-Path $gi)) { New-Item $gi | Out-Null }
if (-not (Select-String -Quiet -Path $gi -Pattern "GARAGISTE 증거 팀")) { Run { Add-Content $gi ("`n" + (Get-Content "$Here\team\gitignore.snippet" -Raw) + "/.claude-pack`n.worktrees/*/.claude-pack`n") } ".gitignore" }
Run { git -C $Root config core.hooksPath .githooks } "core.hooksPath"
Write-Host "---"
if (-not $DryRun) { node (Join-Path $Root ".claude\scripts\doctor.mjs"); }
Write-Host "다음: team.json 명령 채우기 → 첫 unit: node .claude/scripts/work.mjs new <slug> `"<CEO 말 그대로>`""
