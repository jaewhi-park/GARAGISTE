<#
GARAGISTE / Claude Code — installs .claude\ and docs\README.md into a git repository (Windows PowerShell)
Usage: .\install.ps1 [-Project <path>|.] [-Global] [-Budget inherit|unlimited|high|medium|low] [-Set agent=model[:effort],...] [-Uninstall] [-DryRun]
  -Project <path>  Install into that path (its git repo root). Default: current directory
  -Global          Only with -Uninstall: removes an older global install from $HOME\.claude (the team lives in the repository — install into a project)
  -Budget  Per-role model (opus/sonnet/haiku) and effort assignment. unlimited (API) · high (Max 20x) · medium (Max 5x) · low (Pro)
  -Set     Per-agent override, e.g. -Set team-implementer=sonnet:high
  -Uninstall  Remove what this installer put there (the project's .claude\ or, with -Global, $HOME\.claude): the team's agents, skills, hooks, scripts and settings entries; yours stay. -DryRun previews
#>
[CmdletBinding()]param([string]$Project = "", [switch]$Global, [string]$Budget = "inherit", [string[]]$Set = @(), [switch]$DryRun, [switch]$Uninstall, [switch]$Help)
if ($Help) { Get-Content $MyInvocation.MyCommand.Path -TotalCount 9 | Select-Object -Skip 1 | Where-Object { $_ -ne "#>" }; exit 0 }
$ErrorActionPreference = "Stop"
$Src = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($Global -and -not $Uninstall) { Write-Host "! No global install: the team lives in the repository (.claude\ is committed with the project). Install into a project — .\install.ps1 claude -Project <path>; an older global install is removed with -Global -Uninstall"; exit 1 }
function Set-Prop($obj, $name, $value) {
  if ($obj.PSObject.Properties[$name]) { $obj.$name = $value } else { $obj | Add-Member -NotePropertyName $name -NotePropertyValue $value }
}

# ---------- uninstall (project or global) ----------
# Removes only what the installer put there — the template's agents, skills, hooks and scripts, the hook and permission
# entries it merged into settings.json, the project's default agent — and backs each removed path up first. Your own
# agents, skills, hooks and settings, docs\ and .gitignore stay; what is left in the team's folders is listed at the end.
if ($Uninstall) {
  if ($Global) { $Mode = "global"; $Dest = Join-Path $HOME ".claude" }
  else {
    $Mode = "project"
    if ($Project) { if (-not (Test-Path $Project -PathType Container)) { throw "Path not found: $Project" }; Set-Location (Resolve-Path $Project).Path }
    $Root = $null
    if (Get-Command git -ErrorAction SilentlyContinue) { $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"; $out = & git rev-parse --show-toplevel 2>&1; $ErrorActionPreference = $prev; if ($LASTEXITCODE -eq 0) { $Root = "$out".Trim() } }
    if (-not $Root) { $Root = (Get-Location).Path }
    $Dest = Join-Path $Root ".claude"
  }
  $Cfg = Join-Path $Dest "settings.json"
  Write-Host "→ Uninstall [$Mode]: $Dest"
  if (-not (Test-Path $Dest)) { Write-Host "→ Nothing to remove: $Dest does not exist"; exit 0 }
  $InPlace = ($Mode -eq "project") -and ((Resolve-Path $Src).Path.TrimEnd('\') -eq (Resolve-Path $Root).Path.TrimEnd('\'))
  if ($InPlace) { Write-Host "→ Template is extracted directly in the repo root; its files stay, settings only." }
  $Bk = Join-Path $env:TEMP "garagiste-claude-backup.$(Get-Date -Format yyyyMMdd-HHmmss)"; $script:Removed = 0
  function Remove-Ours($rel) {   # $rel is relative to $Dest — copied under $Bk, then removed
    $p = Join-Path $Dest $rel
    if (-not (Test-Path $p)) { return }
    if ($DryRun) { Write-Host "- remove $p" }
    else { $to = Join-Path $Bk $rel; New-Item -ItemType Directory -Force -Path (Split-Path $to) | Out-Null; Copy-Item $p $to -Recurse -Force; Remove-Item $p -Recurse -Force; Write-Host "- removed $p" }
    $script:Removed++
  }
  if (-not $InPlace) {
    foreach ($f in Get-ChildItem (Join-Path $Src ".claude\agents") -Filter *.md) { Remove-Ours "agents\$($f.Name)" }
    foreach ($d in Get-ChildItem (Join-Path $Src ".claude\skills") -Directory) { Remove-Ours "skills\$($d.Name)" }
    foreach ($f in Get-ChildItem (Join-Path $Src ".claude\hooks") -Filter *.mjs) { Remove-Ours "hooks\$($f.Name)" }
  }
  foreach ($f in "apply-models.mjs","set-language.mjs","new-agent.mjs","set-profile.mjs") { Remove-Ours "scripts\$f" }
  if ($Mode -eq "project") { Remove-Ours "session" }   # git-ignored runtime logs: compactions, denies.jsonl, spawns.jsonl
  if (Test-Path $Cfg) {
    $s = Get-Content (Join-Path $Src ".claude\settings.json") -Raw | ConvertFrom-Json
    $d = Get-Content $Cfg -Raw | ConvertFrom-Json
    $changed = @()
    $hookNames = @(Get-ChildItem (Join-Path $Src ".claude\hooks") -Filter *.mjs | ForEach-Object { $_.Name })
    function Test-OurHook($cmd) { foreach ($n in $hookNames) { if ("$cmd" -match ('[\\/]hooks[\\/]' + [regex]::Escape($n) + '(?![\w.-])')) { return $true } }; return $false }
    if ($d.PSObject.Properties['hooks']) {
      foreach ($ev in @($d.hooks.PSObject.Properties)) {
        $keep = @()
        foreach ($e in @($ev.Value)) {
          $inner = @($e.hooks); $rest = @($inner | Where-Object { -not (Test-OurHook $_.command) })
          if ($inner.Count -gt 0 -and $rest.Count -eq 0) { $changed += "hooks.$($ev.Name): $($inner[0].command)"; continue }
          if ($rest.Count -ne $inner.Count) { $changed += "hooks.$($ev.Name): $($inner.Count - $rest.Count) of ours out of a mixed entry"; $e.hooks = $rest }
          $keep += $e
        }
        if ($keep.Count -gt 0) { $d.hooks.($ev.Name) = $keep } else { $d.hooks.PSObject.Properties.Remove($ev.Name) }
      }
      if (@($d.hooks.PSObject.Properties).Count -eq 0) { $d.PSObject.Properties.Remove('hooks') }
    }
    $DestFwd = $Dest -replace '\\','/'
    if ($d.PSObject.Properties['permissions']) {
      foreach ($k in "allow","deny") {
        $tpl = @($s.permissions.$k)   # the global install writes the script permissions with absolute paths: match both forms
        $mine = $tpl + @($tpl | ForEach-Object { if ($_ -like 'Bash(node .claude/scripts/*') { $_.Replace('node .claude/scripts/', "node `"$DestFwd/scripts/").Replace('.mjs:*', '.mjs":*') } else { $_ } })
        if ($d.permissions.PSObject.Properties[$k]) {
          $cur = @($d.permissions.$k); $new = @($cur | Where-Object { $mine -notcontains $_ })
          if ($new.Count -ne $cur.Count) { $changed += "permissions.$($k): $($cur.Count - $new.Count) entries" }
          if ($new.Count -gt 0) { $d.permissions.$k = $new } else { $d.permissions.PSObject.Properties.Remove($k) }
        }
      }
      if (@($d.permissions.PSObject.Properties).Count -eq 0) { $d.PSObject.Properties.Remove('permissions') }
    }
    if ($Mode -eq "project" -and $d.PSObject.Properties['agent'] -and $d.agent -eq $s.agent) { $d.PSObject.Properties.Remove('agent'); $changed += "agent: $($s.agent)" }
    if ($Mode -eq "project" -and $d.PSObject.Properties['worktree'] -and $s.PSObject.Properties['worktree'] -and (($d.worktree | ConvertTo-Json -Compress) -eq ($s.worktree | ConvertTo-Json -Compress))) { $d.PSObject.Properties.Remove('worktree'); $changed += "worktree" }
    if ($changed.Count -eq 0) { Write-Host "→ $($Cfg): nothing of ours in it" }
    else {
      foreach ($c in $changed) { Write-Host "- $(if ($DryRun) {'remove'} else {'removed'}) from settings.json: $c" }
      if (-not $DryRun) {
        New-Item -ItemType Directory -Force -Path $Bk | Out-Null; Copy-Item $Cfg (Join-Path $Bk "settings.json") -Force
        if (@($d.PSObject.Properties).Count -gt 0) {
          [IO.File]::WriteAllText($Cfg, ($d | ConvertTo-Json -Depth 12), (New-Object System.Text.UTF8Encoding $false))
          $left = @("model","language" | Where-Object { $d.PSObject.Properties[$_] })
          if ($left.Count -gt 0) { Write-Host "→ Left in settings.json: $($left -join ', ') — Claude Code settings written by /hire or /lang; yours to keep or drop" }
        } else { Remove-Item $Cfg; Write-Host "- removed $Cfg (nothing else was in it)" }
      }
    }
  }
  if (-not $DryRun) {
    foreach ($dir in "agents","skills","hooks","scripts") { $p = Join-Path $Dest $dir; if ((Test-Path $p) -and -not (Get-ChildItem $p -Force | Select-Object -First 1)) { Remove-Item $p } }
    if ((Test-Path $Dest) -and -not (Get-ChildItem $Dest -Force | Select-Object -First 1)) { Remove-Item $Dest }
  }
  if ($script:Removed -eq 0) { Write-Host "→ No template files under $Dest" }
  if (-not $DryRun -and $script:Removed -gt 0) { Write-Host "→ Backup of what was removed: $Bk" }
  foreach ($dir in "agents","skills","hooks","scripts") {
    $p = Join-Path $Dest $dir
    if (Test-Path $p) { $left = @(Get-ChildItem $p -Force | ForEach-Object { $_.Name }); if ($left.Count -gt 0) { Write-Host "→ Left in $dir\ (yours, or an older GARAGISTE name — remove by hand if unwanted): $($left -join ' ')" } }
  }
  if ($Mode -eq "project") { Write-Host "→ docs\, .gitignore (the installer added .claude/worktrees/, .claude/session/, docs/screens/) and .claude\worktrees\ stay; commit the removal yourself." }
  else { Write-Host "→ From now on a project's own .claude\ is all Claude Code loads (a same-named skill under ~\.claude used to win over the project's)." }
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
if (-not $DryRun) { New-Item -ItemType Directory -Force -Path (Join-Path $Dest "scripts") | Out-Null; foreach ($f in "apply-models.mjs","set-language.mjs","new-agent.mjs","set-profile.mjs") { Copy-Item (Join-Path $Src "scripts\$f") (Join-Path $Dest "scripts\$f") -Force } }
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
  if ($s.PSObject.Properties['worktree'] -and -not $d.PSObject.Properties['worktree']) { Set-Prop $d 'worktree' $s.worktree }   # /parallel builders branch from the session HEAD
  if (-not $d.PSObject.Properties['permissions']) { Set-Prop $d 'permissions' ([pscustomobject]@{}) }
  foreach ($k in "allow","deny") {
    $cur = @(); if ($d.permissions.PSObject.Properties[$k]) { $cur += $d.permissions.$k }
    foreach ($r in $s.permissions.$k) { if ($cur -notcontains $r) { $cur += $r } }
    Set-Prop $d.permissions $k $cur
  }
  if (-not $d.PSObject.Properties['hooks']) { Set-Prop $d 'hooks' ([pscustomobject]@{}) }
  foreach ($ev in $s.hooks.PSObject.Properties) {  # keep the repo's own hooks; add ours when absent
    if (-not $d.hooks.PSObject.Properties[$ev.Name]) { Set-Prop $d.hooks $ev.Name $ev.Value; continue }
    $cur = @($d.hooks.($ev.Name)); $have = @($cur | ForEach-Object { $_.hooks } | ForEach-Object { $_.command })
    foreach ($e in $ev.Value) { if (@($e.hooks | Where-Object { $have -notcontains $_.command }).Count -gt 0) { $cur += $e } }
    Set-Prop $d.hooks $ev.Name $cur
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

# .gitignore (the status board docs/STATUS.md is committed; an older install git-ignored it — that line is removed)
$Gi = Join-Path $Root ".gitignore"
foreach ($line in ".claude/worktrees/", ".claude/session/", "docs/screens/") {
  $has = (Test-Path $Gi) -and ((Get-Content $Gi) -contains $line)
  if (-not $has) { if ($DryRun) { Write-Host "+ append $line >> .gitignore" } else { if ((Test-Path $Gi) -and (Get-Item $Gi).Length -gt 0 -and -not ([IO.File]::ReadAllText($Gi)).EndsWith("`n")) { Add-Content $Gi "" }; Add-Content $Gi $line } }
}
if ((Test-Path $Gi) -and ((Get-Content $Gi) -contains "docs/STATUS.md")) {
  if ($DryRun) { Write-Host "- remove docs/STATUS.md from .gitignore (the board is committed now)" } else { (Get-Content $Gi) | Where-Object { $_ -ne "docs/STATUS.md" } | Set-Content $Gi; Write-Host "→ docs/STATUS.md removed from .gitignore: the board is committed from now on (the next milestone commit adds it)" }
}
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Write-Host "! 'claude' not found on PATH." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "! node not found. Hooks require Node.js." }
Write-Host @"

Next steps:
  1. Run claude in the repo (team-lead is the main agent). Accept the folder-trust prompt so hooks are enabled.
  2. Brief first: /brainstorm <idea or file>   New project: /kickoff   Legacy: /assess <target>   Continue: /resume
  3. Models: /hire at the end of kickoff/assess refines them; pass -Budget <tier> here so the first session already runs the verifier on the fast model
"@
