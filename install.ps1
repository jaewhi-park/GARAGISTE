<#
GARAGISTE installer entry point
Usage: .\install.ps1 <opencode|claude> [options]
  Options are shared by both flavors:
    -Project <path>|.   Install into that path (its git repo root). Default: current directory
    -Global             Global install
    -Budget <tier>      Model assignment profile (recommended: /hire after installing)
    -Set agent=model    Per-agent model override (comma-separated for several)
    -DryRun             Preview without changes
  Examples: .\install.ps1 claude -Project C:\work\myapp
            .\install.ps1 opencode -Global
#>
param(
  [Parameter(Position = 0)][string]$Flavor = "",
  [Parameter(ValueFromRemainingArguments = $true)][object[]]$Rest = @()
)
$map = @{ opencode = "opencode"; oc = "opencode"; claude = "claude"; "claude-code" = "claude"; cc = "claude" }
if (-not $Flavor -or -not $map.ContainsKey($Flavor.ToLower())) {
  Get-Content $MyInvocation.MyCommand.Path -TotalCount 12 | Select-Object -Skip 1 | Where-Object { $_ -ne "#>" }
  if ($Flavor) { Write-Host "! Unknown target: $Flavor (use opencode or claude)"; exit 1 } else { exit 0 }
}
# Re-bind remaining tokens as named parameters (-Project x, --dry-run, -Global ...)
$named = @{}
for ($i = 0; $i -lt $Rest.Count; $i++) {
  $t = "$($Rest[$i])"
  if ($t -match '^-{1,2}([A-Za-z][A-Za-z0-9-]*)$') {
    $name = $Matches[1] -replace '-', ''
    $hasValue = ($i + 1 -lt $Rest.Count) -and -not ("$($Rest[$i+1])" -match '^-{1,2}[A-Za-z]')
    if ($hasValue) { $named[$name] = $Rest[$i + 1]; $i++ } else { $named[$name] = $true }
  } else { Write-Host "! Cannot parse argument: $t"; exit 1 }
}
& (Join-Path $PSScriptRoot "$($map[$Flavor.ToLower()])\install.ps1") @named
