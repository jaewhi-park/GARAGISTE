<#
GARAGISTE / Claude Code — installs .claude\ and docs\README.md into a git repository (Windows PowerShell)
Usage: .\install.ps1 [-Project <path>|.] [-Global] [-Budget inherit|unlimited|high|medium|low] [-Set agent=model[:effort],...] [-DryRun]
  -Project <path>  Install into that path (its git repo root). Default: current directory
  -Global          Install into $HOME\.claude for every repo. No default agent is forced; start with `claude --agent team-lead`
  -Budget  Per-role model (opus/sonnet/haiku) and effort assignment. unlimited (API) · high (Max 20x) · medium (Max 5x) · low (Pro)
  -Set     Per-agent override, e.g. -Set team-implementer=sonnet:high
#>
param([string]$Project = "", [switch]$Global, [string]$Budget = "inherit", [string[]]$Set = @(), [switch]$DryRun)
$ErrorActionPreference = "Stop"
$Src = Split-Path -Parent $MyInvocation.MyCommand.Path
function Set-Prop($obj, $name, $value) {
  if ($obj.PSObject.Properties[$name]) { $obj.$name = $value } else { $obj | Add-Member -NotePropertyName $name -NotePropertyValue $value }
}

# ---------- global install ----------
if ($Global) {
  $Dest = Join-Path $HOME ".claude"; $Cfg = Join-Path $Dest "settings.json"
  Write-Host "→ Global install: $Dest"
  if (-not $DryRun) {
    foreach ($d in "agents","skills","hooks") { $to = Join-Path $Dest $d; New-Item -ItemType Directory -Force -Path $to | Out-Null; Copy-Item (Join-Path $Src ".claude\$d\*") $to -Recurse -Force }
    New-Item -ItemType Directory -Force -Path (Join-Path $Dest "scripts") | Out-Null; Copy-Item (Join-Path $Src "scripts\apply-models.mjs") (Join-Path $Dest "scripts\apply-models.mjs") -Force
    $DestFwd = $Dest -replace '\\','/'
    $s = Get-Content (Join-Path $Src ".claude\settings.json") -Raw | ConvertFrom-Json
    foreach ($ev in $s.hooks.PSObject.Properties) { foreach ($e in $ev.Value) { foreach ($h in $e.hooks) { $h.command = $h.command.Replace("node .claude/hooks/", "node `"$DestFwd/hooks/") + '"' } } }  # quoted: $HOME may contain spaces
    $d = if (Test-Path $Cfg) { Get-Content $Cfg -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
    if (-not $d.PSObject.Properties['permissions']) { Set-Prop $d 'permissions' ([pscustomobject]@{}) }
    foreach ($k in "allow","deny") {
      $cur = @(); if ($d.permissions.PSObject.Properties[$k]) { $cur += $d.permissions.$k }
      foreach ($r in $s.permissions.$k) { if ($cur -notcontains $r) { $cur += $r } }
      Set-Prop $d.permissions $k $cur
    }
    if (-not $d.PSObject.Properties['hooks']) { Set-Prop $d 'hooks' ([pscustomobject]@{}) }
    foreach ($ev in $s.hooks.PSObject.Properties) { if (-not $d.hooks.PSObject.Properties[$ev.Name]) { Set-Prop $d.hooks $ev.Name $ev.Value } }
    New-Item -ItemType Directory -Force -Path (Split-Path $Cfg) | Out-Null
    [IO.File]::WriteAllText($Cfg, ($d | ConvertTo-Json -Depth 12), (New-Object System.Text.UTF8Encoding $false))
    Write-Host "→ Merged: $Cfg (hook paths absolute, no default agent)"
    if (($Budget -ne "inherit" -or $Set.Count -gt 0) -and (Get-Command node -ErrorAction SilentlyContinue)) {
      $a = @("--flavor","claude","--dest",(Join-Path $Dest "agents"),"--settings",$Cfg,"--budget",$Budget); foreach ($x in $Set) { $a += @("--set",$x) }
      node (Join-Path $Src "scripts\apply-models.mjs") @a
    }
  }
  Write-Host "`nNext: in any repo run claude --agent team-lead → /kickoff or /assess. (To make it the default for one repo, set ""agent"": ""team-lead"" in that repo's .claude\settings.json.)"
  exit 0
}

# ---------- project install ----------
if ($Project) {
  if (-not (Test-Path $Project -PathType Container)) { throw "Path not found: $Project" }
  Set-Location (Resolve-Path $Project).Path
}
function Get-GitRoot {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return $null }
  $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
  $out = & git rev-parse --show-toplevel 2>&1
  $ErrorActionPreference = $prev
  if ($LASTEXITCODE -eq 0) { return "$out".Trim() } else { return $null }
}
$Root = Get-GitRoot
if ($Root -and ((Resolve-Path $Root).Path.TrimEnd('\') -ne (Get-Location).Path.TrimEnd('\'))) { Write-Host "→ Using git root: $Root" }
if (-not $Root) {
  $Root = (Get-Location).Path
  Write-Host "! Not a git repository: $Root"
  Write-Host "  The team relies on branches, commits and worktrees, so git is required."
  if (-not $DryRun -and (Get-Command git -ErrorAction SilentlyContinue)) {
    $ans = Read-Host "  Run git init here (default branch main)? [Y/n]"
    if ($ans -eq "" -or $ans -match '^[Yy]') { git init | Out-Null; git symbolic-ref HEAD refs/heads/main; Write-Host "→ git init done (main)" }
  }
}
$InPlace = ((Resolve-Path $Src).Path.TrimEnd('\') -eq (Resolve-Path $Root).Path.TrimEnd('\'))
if ($InPlace) { Write-Host "→ Template is extracted directly in the repo root; skipping file copy, merging settings only." }
$Dest = Join-Path $Root ".claude"
Write-Host "→ Install location: $Dest"

if ((Test-Path $Dest) -and -not $InPlace) {
  $Bk = Join-Path $env:TEMP "garagiste-claude-backup.$(Get-Date -Format yyyyMMdd-HHmmss)"
  Write-Host "→ Backing up existing .claude to: $Bk"
  if (-not $DryRun) { Copy-Item $Dest $Bk -Recurse }
}
foreach ($d in "agents","skills","hooks") {
  $to = Join-Path $Dest $d
  if ($InPlace) { continue }
  if ($DryRun) { Write-Host "+ copy $d -> $to"; continue }
  New-Item -ItemType Directory -Force -Path $to | Out-Null
  Copy-Item (Join-Path $Src ".claude\$d\*") $to -Recurse -Force
}
if (-not $DryRun) { New-Item -ItemType Directory -Force -Path (Join-Path $Dest "scripts") | Out-Null; Copy-Item (Join-Path $Src "scripts\apply-models.mjs") (Join-Path $Dest "scripts\apply-models.mjs") -Force }
$DocsReadme = Join-Path $Root "docs\README.md"
if (-not (Test-Path $DocsReadme) -and -not $DryRun) {
  New-Item -ItemType Directory -Force -Path (Join-Path $Root "docs") | Out-Null
  Copy-Item (Join-Path $Src "docs\README.md") $DocsReadme
}

$Cfg = Join-Path $Dest "settings.json"
if ($DryRun) { Write-Host "+ merge settings.json -> $Cfg" }
else {
  $s = Get-Content (Join-Path $Src ".claude\settings.json") -Raw | ConvertFrom-Json
  $d = if (Test-Path $Cfg) { Get-Content $Cfg -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
  Set-Prop $d 'agent' $s.agent
  if (-not $d.PSObject.Properties['permissions']) { Set-Prop $d 'permissions' ([pscustomobject]@{}) }
  foreach ($k in "allow","deny") {
    $cur = @(); if ($d.permissions.PSObject.Properties[$k]) { $cur += $d.permissions.$k }
    foreach ($r in $s.permissions.$k) { if ($cur -notcontains $r) { $cur += $r } }
    Set-Prop $d.permissions $k $cur
  }
  if (-not $d.PSObject.Properties['hooks']) { Set-Prop $d 'hooks' ([pscustomobject]@{}) }
  foreach ($ev in $s.hooks.PSObject.Properties) {
    if (-not $d.hooks.PSObject.Properties[$ev.Name]) { Set-Prop $d.hooks $ev.Name $ev.Value }
  }
  [IO.File]::WriteAllText($Cfg, ($d | ConvertTo-Json -Depth 12), (New-Object System.Text.UTF8Encoding $false))
  Write-Host "→ Merged: $Cfg"
}

if ($Budget -ne "inherit" -or $Set.Count -gt 0) {
  if (Get-Command node -ErrorAction SilentlyContinue) {
    $a = @("--flavor","claude","--dest",(Join-Path $Dest "agents"),"--settings",$Cfg,"--budget",$Budget)
    foreach ($s in $Set) { $a += @("--set",$s) }
    if ($DryRun) { Write-Host "+ node apply-models.mjs $a" } else { node (Join-Path $Src "scripts\apply-models.mjs") @a }
  } else { Write-Host "! node not found; skipping model assignment." }
}

$Gi = Join-Path $Root ".gitignore"
foreach ($line in ".claude/worktrees/", ".claude/agent-memory-local/") {
  $has = (Test-Path $Gi) -and ((Get-Content $Gi) -contains $line)
  if (-not $has) { if ($DryRun) { Write-Host "+ append $line >> .gitignore" } else { Add-Content $Gi $line } }
}
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Write-Host "! 'claude' not found on PATH." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "! node not found. Hooks require Node.js." }
Write-Host @"

Next steps:
  1. Run claude in the repo (team-lead is the main agent). Accept the folder-trust prompt so hooks are enabled.
  2. New project: /kickoff <idea>   Legacy: /assess <target>   Continue: /resume
  3. Model assignment (hiring): /hire
"@
