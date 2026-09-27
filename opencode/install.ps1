<#
GARAGISTE / opencode — installs .opencode\ and opencode.json into a git repository (Windows PowerShell)
Usage: .\install.ps1 [-Project <path>|.] [-Global] [-Budget inherit|unlimited|high|medium|low] [-Strong id] [-Fast id] [-Set agent=model,...] [-Model id] [-Uninstall] [-DryRun]
  -Project <path>  Install into that path (its git repo root). Default: current directory
  default   Install only into the current repo's .opencode\ and root opencode.json (global config untouched)
  -Global   Install into $HOME\.config\opencode instead, applying to every repo
  -Budget   Per-role model assignment profile (default inherit). unlimited/high/medium/low distribute -Strong/-Fast across roles
  -Strong/-Fast  Actual model IDs (required with -Budget; prefer /hire after installing if judgment is needed)
  -Set      Per-agent override, e.g. -Set team-reviewer=anthropic/claude-opus-4
  -Model    Only to overwrite the default model in opencode.json
  -DryRun   Preview without changes
  -Uninstall  Remove what this installer put there (the project's .opencode\ and opencode.json entries, or with -Global $HOME\.config\opencode); yours stay
#>
[CmdletBinding()]param([string]$Project = "", [string]$Model = "", [switch]$Global, [string]$Budget = "inherit", [string]$Strong = "", [string]$Fast = "", [string[]]$Set = @(), [switch]$DryRun, [switch]$Uninstall, [switch]$Help)
if ($Help) { Get-Content $MyInvocation.MyCommand.Path -TotalCount 13 | Select-Object -Skip 1 | Where-Object { $_ -ne "#>" }; exit 0 }
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
    if (-not $DryRun -and -not $Uninstall -and (Get-Command git -ErrorAction SilentlyContinue)) {
      $ans = Read-Host "  Run git init here (default branch main)? [Y/n]"
      if ($ans -eq "" -or $ans -match '^[Yy]') { git init | Out-Null; git symbolic-ref HEAD refs/heads/main; Write-Host "→ git init done (main)" }
    }
  }
  $Dest = Join-Path $Root ".opencode"; $Cfg = Join-Path $Root "opencode.json"; $BkBase = Join-Path $env:TEMP "garagiste-opencode-backup"
}
# ---------- uninstall (project or global) ----------
# Removes only what the installer put there — the template's agents, commands, skills, plugins and scripts, and the entries it
# merged into opencode.json (instructions, subagent_depth, permission keys, team agent entries) — and backs each removed path up
# first. Your own agents, commands, skills, config keys, docs\ and .gitignore stay; what is left in the team's folders is listed.
if ($Uninstall) {
  $Mode = if ($Global) {'global'} else {'project'}
  Write-Host "→ Uninstall [$Mode]: $Dest  (config: $Cfg)"
  if (-not (Test-Path $Dest) -and -not (Test-Path $Cfg)) { Write-Host "→ Nothing to remove: $Dest does not exist"; exit 0 }
  $Bk = "$BkBase.$(Get-Date -Format yyyyMMdd-HHmmss)"; $script:Removed = 0
  function Remove-Ours($rel) {   # $rel is relative to $Dest — copied under $Bk, then removed
    $p = Join-Path $Dest $rel
    if (-not (Test-Path $p)) { return }
    if ($DryRun) { Write-Host "- remove $p" }
    else { $to = Join-Path $Bk $rel; New-Item -ItemType Directory -Force -Path (Split-Path $to) | Out-Null; Copy-Item $p $to -Recurse -Force; Remove-Item $p -Recurse -Force; Write-Host "- removed $p" }
    $script:Removed++
  }
  foreach ($f in Get-ChildItem (Join-Path $Src "agents") -Filter *.md) { Remove-Ours "agents\$($f.Name)" }
  foreach ($f in Get-ChildItem (Join-Path $Src "commands") -Filter *.md) { Remove-Ours "commands\$($f.Name)" }
  foreach ($d in Get-ChildItem (Join-Path $Src "skills") -Directory) { Remove-Ours "skills\$($d.Name)" }
  foreach ($f in Get-ChildItem (Join-Path $Src "plugins") -File) { Remove-Ours "plugins\$($f.Name)" }
  foreach ($f in "apply-models.mjs","set-language.mjs","new-agent.mjs","set-profile.mjs") { Remove-Ours "scripts\$f" }
  $Jsonc = [IO.Path]::ChangeExtension($Cfg, ".jsonc")
  if (Test-Path $Jsonc) { Write-Host "! $Jsonc exists; the merge was by hand, so is the removal — drop these from it: instructions docs/CHARTER*.md · docs/STATUS*.md, subagent_depth, the permission block and the agent entries of $(Join-Path $Src 'opencode.json')" }
  elseif (Test-Path $Cfg) {
    $s = Get-Content (Join-Path $Src "opencode.json") -Raw | ConvertFrom-Json
    $d = Get-Content $Cfg -Raw | ConvertFrom-Json
    $changed = @()
    if ($d.PSObject.Properties['instructions']) {
      $cur = @($d.instructions); $new = @($cur | Where-Object { @($s.instructions) -notcontains $_ })
      if ($new.Count -ne $cur.Count) { $changed += "instructions: $($cur.Count - $new.Count) entries" }
      if ($new.Count -gt 0) { $d.instructions = $new } else { $d.PSObject.Properties.Remove('instructions') }
    }
    if ($s.PSObject.Properties['subagent_depth'] -and $d.PSObject.Properties['subagent_depth'] -and $d.subagent_depth -eq $s.subagent_depth) { $d.PSObject.Properties.Remove('subagent_depth'); $changed += "subagent_depth" }
    if ($d.PSObject.Properties['permission'] -and $d.permission -is [pscustomobject]) {
      foreach ($p in $s.permission.PSObject.Properties) { if ($d.permission.PSObject.Properties[$p.Name] -and ($d.permission.($p.Name) -eq $p.Value)) { $d.permission.PSObject.Properties.Remove($p.Name); $changed += "permission.$($p.Name)" } }
      if (@($d.permission.PSObject.Properties).Count -eq 0) { $d.PSObject.Properties.Remove('permission') }
    }
    if ($d.PSObject.Properties['agent'] -and $d.agent -is [pscustomobject]) {
      foreach ($a in $s.agent.PSObject.Properties) { if ($d.agent.PSObject.Properties[$a.Name]) { $d.agent.PSObject.Properties.Remove($a.Name); $changed += "agent.$($a.Name)" } }
      if (@($d.agent.PSObject.Properties).Count -eq 0) { $d.PSObject.Properties.Remove('agent') }
    }
    if ($changed.Count -eq 0) { Write-Host "→ $($Cfg): nothing of ours in it" }
    else {
      foreach ($c in $changed) { Write-Host "- $(if ($DryRun) {'remove'} else {'removed'}) from opencode.json: $c" }
      if (-not $DryRun) {
        New-Item -ItemType Directory -Force -Path $Bk | Out-Null; Copy-Item $Cfg (Join-Path $Bk "opencode.json") -Force
        $rest = @($d.PSObject.Properties | Where-Object { $_.Name -ne '$schema' })
        if ($rest.Count -gt 0) {
          [IO.File]::WriteAllText($Cfg, ($d | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding $false))
          if ($d.PSObject.Properties['model']) { Write-Host "→ Left in opencode.json: model — yours to keep or drop" }
        } else { Remove-Item $Cfg; Write-Host "- removed $Cfg (nothing else was in it)" }
      }
    }
  }
  if (-not $DryRun) {
    foreach ($dir in "agents","commands","skills","plugins","scripts") { $p = Join-Path $Dest $dir; if ((Test-Path $p) -and -not (Get-ChildItem $p -Force | Select-Object -First 1)) { Remove-Item $p } }
    if ((Test-Path $Dest) -and -not (Get-ChildItem $Dest -Force | Select-Object -First 1)) { Remove-Item $Dest }
  }
  if ($script:Removed -eq 0) { Write-Host "→ No template files under $Dest" }
  if (-not $DryRun -and $script:Removed -gt 0) { Write-Host "→ Backup of what was removed: $Bk" }
  foreach ($dir in "agents","commands","skills","plugins","scripts") {
    $p = Join-Path $Dest $dir
    if (Test-Path $p) { $left = @(Get-ChildItem $p -Force | ForEach-Object { $_.Name }); if ($left.Count -gt 0) { Write-Host "→ Left in $dir\ (yours, or an older GARAGISTE name — remove by hand if unwanted): $($left -join ' ')" } }
  }
  if ($Mode -eq "project") { Write-Host "→ docs\ and .gitignore (the installer added docs/screens/) stay; commit the removal yourself." }
  else { Write-Host "→ From now on a project's own .opencode\ and opencode.json are all opencode loads from the team." }
  exit 0
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
if ($Global -and -not $DryRun) {  # commands and the lead's bash allow-list name the scripts by a project-relative path; point them at $Dest
  $DestFwd = $Dest -replace '\\','/'
  foreach ($f in @(Get-ChildItem (Join-Path $Dest "commands") -Filter *.md) + @(Get-Item (Join-Path $Dest "agents\team-lead.md"))) {
    $t = [IO.File]::ReadAllText($f.FullName)
    $t = [regex]::Replace($t, 'node \.opencode/scripts/(apply-models|set-language|new-agent|set-profile)\.mjs', "node `"$DestFwd/scripts/`$1.mjs`"")
    [IO.File]::WriteAllText($f.FullName, $t, (New-Object System.Text.UTF8Encoding $false))
  }
}

if (-not $Global) {
  $DocsReadme = Join-Path (Split-Path $Dest) "docs\README.md"
  if (-not (Test-Path $DocsReadme) -and -not $DryRun) { New-Item -ItemType Directory -Force -Path (Split-Path $DocsReadme) | Out-Null; Copy-Item (Join-Path $Src "docs\README.md") $DocsReadme }
  # .gitignore (the status board docs/STATUS.md is committed; an older install git-ignored it — that line is removed)
  $Gi = Join-Path (Split-Path $Dest) ".gitignore"
  foreach ($line in "docs/screens/") {
    $has = (Test-Path $Gi) -and ((Get-Content $Gi) -contains $line)
    if (-not $has) { if ($DryRun) { Write-Host "+ append $line >> .gitignore" } else { if ((Test-Path $Gi) -and (Get-Item $Gi).Length -gt 0 -and -not ([IO.File]::ReadAllText($Gi)).EndsWith("`n")) { Add-Content $Gi "" }; Add-Content $Gi $line } }
  }
  if ((Test-Path $Gi) -and ((Get-Content $Gi) -contains "docs/STATUS.md")) {
    if ($DryRun) { Write-Host "- remove docs/STATUS.md from .gitignore (the board is committed now)" } else { (Get-Content $Gi) | Where-Object { $_ -ne "docs/STATUS.md" } | Set-Content $Gi; Write-Host "→ docs/STATUS.md removed from .gitignore: the board is committed from now on (the next milestone commit adds it)" }
  }
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
  2. Brief first: /brainstorm <idea or file>   New project: /kickoff   Legacy: /assess <target>   Continue: /resume
  3. Models: /hire at the end of kickoff/assess refines them; pass -Budget <tier> -Strong <id> -Fast <id> here so the first session already runs the verifier on the fast model
"@
