# Start the pet watchdog (hidden, single instance). ASCII-only output for PS 5.1.
$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSCommandPath
$script = Join-Path $root 'watchdog.js'
if (-not (Test-Path $script)) { Write-Output 'watchdog.js not found next to this script'; exit 1 }

$running = Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'watchdog\.js' }
if ($running) {
  Write-Output ("watchdog already running, pid=" + (($running | Select-Object -First 1).ProcessId))
  exit 0
}

$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = 'D:\Program Files\nodejs\node.exe' }
if (-not (Test-Path $node)) { Write-Output 'node.exe not found'; exit 1 }

Start-Process -FilePath $node -ArgumentList 'watchdog.js' -WorkingDirectory $root -WindowStyle Hidden
Start-Sleep -Milliseconds 900

$now = Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'watchdog\.js' }
if ($now) {
  Write-Output ("watchdog started, pid=" + (($now | Select-Object -First 1).ProcessId))
  exit 0
}
Write-Output 'watchdog failed to start (check logs/watchdog.log)'
exit 1
