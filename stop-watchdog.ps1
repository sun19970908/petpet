# Stop the pet watchdog (only node.exe running watchdog.js). ASCII-only output for PS 5.1.
$ErrorActionPreference = 'SilentlyContinue'
$procs = Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'watchdog\.js' }
if (-not $procs) { Write-Output 'watchdog not running'; exit 0 }
foreach ($p in $procs) {
  Stop-Process -Id $p.ProcessId -Force
  Write-Output ("stopped watchdog pid=" + $p.ProcessId)
}
Start-Sleep -Milliseconds 300
$left = Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'watchdog\.js' }
if ($left) { Write-Output 'some watchdog processes still alive'; exit 1 }
Write-Output 'watchdog stopped (pet app keeps running)'
exit 0
