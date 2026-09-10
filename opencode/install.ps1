<#
GARAGISTE / opencode — installs .opencode\ and opencode.json into a git repository (Windows PowerShell)
Usage: .\install.ps1 [-Project <path>|.] [-Global] [-Budget inherit|unlimited|high|medium|low] [-Strong id] [-Fast id] [-Set agent=model,...] [-Model id] [-DryRun]
  -Project <path>  Install into that path (its git repo root). Default: current directory
  default   Install only into the current repo's .opencode\ and root opencode.json (global config untouched)
  -Global   Install into $HOME\.config\opencode instead, applying to every repo
  -Budget   Per-role model assignment profile (default inherit). unlimited/high/medium/low distribute -Strong/-Fast across roles
  -Strong/-Fast  Actual model IDs (required with -Budget; prefer /hire after installing if judgment is needed)
  -Set      Per-agent override, e.g. -Set team-reviewer=anthropic/claude-opus-4
  -Model    Only to overwrite the default model in opencode.json
  -DryRun   Preview without changes
#>
param([string]$Project = "", [string]$Model = "", [switch]$Global, [string]$Budget = "inherit", [string]$Strong = "", [string]$Fast = "", [string[]]$Set = @(), [switch]$DryRun)
$ErrorActionPreference = "Stop"
$Src = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($Global) {
  $Dest = Join-Path $HOME ".config\opencode"; $Cfg = Join-Path $Dest "opencode.json"; $BkBase = "$Dest.bak"
} else {
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
  $Dest = Join-Path $Root ".opencode"; $Cfg = Join-Path $Root "opencode.json"; $BkBase = Join-Path $env:TEMP "garagiste-opencode-backup"
}
Write-Host "→ Install location [$(if ($Global) {'global'} else {'project'})]: $Dest  (config: $Cfg)"

# 1. Backup
if ((Test-Path $Dest) -and (Get-ChildItem $Dest -Force | Select-Object -First 1)) {
  $Bk = "$BkBase.$(Get-Date -Format yyyyMMdd-HHmmss)"
  Write-Host "→ Backing up existing config to: $Bk"
  if (-not $DryRun) { Copy-Item $Dest $Bk -Recurse }
}

# 2. Copy team files
foreach ($d in "agents","commands","skills","plugins","scripts") {
  $to = Join-Path $Dest $d
  if ($DryRun) { Write-Host "+ copy $d -> $to"; continue }
  New-Item -ItemType Directory -Force -Path $to | Out-Null
  Copy-Item (Join-Path $Src "$d\*") $to -Recurse -Force
}

if (-not $Global) {
  $DocsReadme = Join-Path (Split-Path $Dest) "docs\README.md"
  if (-not (Test-Path $DocsReadme) -and -not $DryRun) { New-Item -ItemType Directory -Force -Path (Split-Path $DocsReadme) | Out-Null; Copy-Item (Join-Path $Src "docs\README.md") $DocsReadme }
}

# 2.5 Per-role model assignment
if ($Budget -ne "inherit" -or $Set.Count -gt 0) {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "! node not found; skipping model assignment." }
  else {
    if ($Budget -ne "inherit" -and (-not $Strong -or -not $Fast)) {
      if (Get-Command opencode -ErrorAction SilentlyContinue) { Write-Host "→ Available models:"; @(opencode models 2>$null) | Select-Object -First 40 | ForEach-Object { Write-Host "     $_" } }
      throw "-Budget requires -Strong and -Fast model IDs. If judgment is needed, use /hire in the first session instead."
    }
    $a = @("--flavor","opencode","--dest",(Join-Path $Dest "agents"),"--budget",$Budget)
    if ($Strong) { $a += @("--strong",$Strong) }; if ($Fast) { $a += @("--fast",$Fast) }
    foreach ($s in $Set) { $a += @("--set",$s) }
    if ($DryRun) { Write-Host "+ node apply-models.mjs $a" } else { node (Join-Path $Src "scripts\apply-models.mjs") @a }
  }
}

# 3. Merge opencode.json
$Jsonc = [IO.Path]::ChangeExtension($Cfg, ".jsonc")
if (Test-Path $Jsonc) {
  Write-Host "! $Jsonc exists; skipping automatic merge. Merge the following by hand:"
  Get-Content (Join-Path $Src "opencode.json")
} elseif ($DryRun) {
  Write-Host "+ merge opencode.json -> $Cfg$(if ($Model) {" (model=$Model)"})"
} else {
  $s = Get-Content (Join-Path $Src "opencode.json") -Raw | ConvertFrom-Json
  $d = if (Test-Path $Cfg) { Get-Content $Cfg -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
  function Set-Prop($obj, $name, $value) {
    if ($obj.PSObject.Properties[$name]) { $obj.$name = $value } else { $obj | Add-Member -NotePropertyName $name -NotePropertyValue $value }
  }
  if (-not $d.PSObject.Properties['$schema']) { Set-Prop $d '$schema' $s.'$schema' }
  if ($s.PSObject.Properties['subagent_depth'] -and -not $d.PSObject.Properties['subagent_depth']) { Set-Prop $d 'subagent_depth' $s.subagent_depth }
  $ins = @(); if ($d.PSObject.Properties['instructions']) { $ins += $d.instructions }
  foreach ($i in $s.instructions) { if ($ins -notcontains $i) { $ins += $i } }
  Set-Prop $d 'instructions' $ins
  if (-not $d.PSObject.Properties['permission']) { Set-Prop $d 'permission' $s.permission }
  elseif ($d.permission -is [pscustomobject]) {
    foreach ($p in $s.permission.PSObject.Properties) { if (-not $d.permission.PSObject.Properties[$p.Name]) { Set-Prop $d.permission $p.Name $p.Value } }
  }
  if ($s.PSObject.Properties['agent']) {
    if (-not $d.PSObject.Properties['agent']) { Set-Prop $d 'agent' $s.agent }
    elseif ($d.agent -is [pscustomobject]) {
      foreach ($a in $s.agent.PSObject.Properties) {
        if (-not $d.agent.PSObject.Properties[$a.Name]) { Set-Prop $d.agent $a.Name $a.Value; continue }
        $cur = $d.agent.($a.Name); if ($cur -isnot [pscustomobject]) { continue }
        foreach ($k in $a.Value.PSObject.Properties) {
          if ($k.Name -eq 'permission' -and $cur.PSObject.Properties['permission'] -and $cur.permission -is [pscustomobject]) {
            foreach ($p in $k.Value.PSObject.Properties) { if (-not $cur.permission.PSObject.Properties[$p.Name]) { Set-Prop $cur.permission $p.Name $p.Value } }
          } elseif (-not $cur.PSObject.Properties[$k.Name]) { Set-Prop $cur $k.Name $k.Value }
        }
      }
    }
  }
  if ($Model) { Set-Prop $d 'model' $Model }
  New-Item -ItemType Directory -Force -Path (Split-Path $Cfg) | Out-Null
  [IO.File]::WriteAllText($Cfg, ($d | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding $false))  # no BOM
  Write-Host "→ Merged: $Cfg (model = $(if ($d.PSObject.Properties['model']) {$d.model} else {'inherited'}))"
}

# 4. Next steps
if (-not (Get-Command opencode -ErrorAction SilentlyContinue)) { Write-Host "! 'opencode' not found on PATH." }
Write-Host @"

Next steps:
  1. Run opencode in the repo → press Tab to select team-lead
  2. New project: /kickoff <idea>   Legacy: /assess <target>   Continue: /resume
  3. Models: /hire at the end of kickoff/assess refines them; pass -Budget <tier> -Strong <id> -Fast <id> here so the first session already runs the verifier on the fast model
"@
