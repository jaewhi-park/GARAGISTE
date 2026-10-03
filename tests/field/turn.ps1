# turn.ps1 <프로젝트 폴더> <n> "<CEO의 말>" [session_id] — 헤드리스 conductor 한 턴(윈도우 — turn.sh와 같은 기록 이름). 말은 <폴더>-turn<n>.msg, 결과는 <폴더>-turn<n>.json
# 5판 윈도우: 대화형 claude는 팩(Agent)이 늘 백그라운드라 끝나도 모델이 깨어나지 않아 무인 하루가 멈췼다(1라운드 시운전). -p(헤드리스)는 팩을 포그라운드로 기다린다
# (subagent_stats.requested.foreground 1) — 리눅스 다섯 라운드와 같은 길. PowerShell 5.1·7 모두.
param([Parameter(Mandatory = $true, Position = 0)][string]$Dir, [Parameter(Mandatory = $true, Position = 1)][int]$N, [Parameter(Mandatory = $true, Position = 2)][string]$Msg, [Parameter(Position = 3)][string]$Sid = "")
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Utf8 = New-Object System.Text.UTF8Encoding($false)
$Dir = (Resolve-Path $Dir).Path.TrimEnd('\')
$Out = "$Dir-turn$N.json"; $Err = "$Out.err"
[System.IO.File]::WriteAllText("$Dir-turn$N.msg", $Msg + "`n", $Utf8)   # mtime = 말한 시각(day.mjs CEO-분)
$env:GIT_AUTHOR_NAME = "ceo"; $env:GIT_AUTHOR_EMAIL = "ceo@field"; $env:GIT_COMMITTER_NAME = "ceo"; $env:GIT_COMMITTER_EMAIL = "ceo@field"
# 부모 세션의 CLAUDE* 변수가 새면 세션이 합쳐진다 — 인증에 필요한 것만 두고 걷는다(turn.sh와 같은 목록)
$Keep = @('CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST', 'CLAUDE_CODE_PROXY_RESOLVES_HOSTS', 'CLAUDE_SESSION_INGRESS_TOKEN_FILE', 'CLAUDE_CODE_ACCOUNT_UUID', 'CLAUDE_CODE_ORGANIZATION_UUID', 'CLAUDE_CODE_USER_EMAIL')
Get-ChildItem Env: | Where-Object { $_.Name -match '^(CLAUDE[A-Z_]*|CLAUDECODE)$' -and ($Keep -notcontains $_.Name) } | ForEach-Object { Remove-Item ("Env:" + $_.Name) }
$CliArgs = @('-p', $Msg, '--output-format', 'json', '--max-turns', '400'); if ($Sid) { $CliArgs += @('--resume', $Sid) }
Push-Location $Dir
try {
  $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'   # claude의 stderr가 예외가 되지 않게
  $stdout = & claude @CliArgs 2> $Err
  $code = $LASTEXITCODE; $ErrorActionPreference = $prev
} finally { Pop-Location }
[System.IO.File]::WriteAllText($Out, (($stdout | Out-String).TrimEnd() + "`n"), $Utf8)   # mtime = 턴 끝
Write-Output "exit=$code out=$Out"
try {
  $j = Get-Content $Out -Raw -Encoding UTF8 | ConvertFrom-Json
  Write-Output "session $($j.session_id) turns $($j.num_turns) cost $($j.total_cost_usd) subtype $($j.subtype)"
  Write-Output "---"
  Write-Output $j.result
} catch { Write-Output "결과 JSON을 읽지 못했다 — $Out 과 $Err 를 보라" }
