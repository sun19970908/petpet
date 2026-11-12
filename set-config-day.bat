@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

rem =======================================================
rem  [白天配置卡片] 用记事本修改下方参数，保存后双击运行即可应用
rem  (此脚本将自动改写 config.json，无需重启桌宠即时生效)
rem  =======================================================

rem 1. 当前 LLM 档案名称 (对应 llm.config.json 中的 profile 名称，例如：硅基流动 或 strata)
set "LLM_PROFILE=硅基流动"

rem 2. 语音合成模式：
rem    auto = 按需启动 (闲置超时自动释放显存，推荐)
rem    on   = 常驻显存 (响应最快，但一直占显存)
rem    off  = 完全静音
set "TTS_MODE=on"

rem 3. 语音闲置保持秒数 (仅在 auto 模式下有效，默认 120 秒)
set "GSV_IDLE=120"

rem 4. 是否同步开启看门狗守护进程：
rem    on  = 开启看门狗 (若未运行则拉起保活)
rem    off = 关闭看门狗 (立即杀掉运行中的看门狗残留)
set "WATCHDOG=off"

rem =======================================================
rem  下方为配置改写与同步逻辑，无需修改
rem =======================================================

set "NODE_CMD=node"
where node >nul 2>&1
if errorlevel 1 (
  if exist "D:\Program Files\nodejs\node.exe" set "NODE_CMD=D:\Program Files\nodejs\node.exe"
  if exist "C:\Program Files\nodejs\node.exe" set "NODE_CMD=C:\Program Files\nodejs\node.exe"
)

"%NODE_CMD%" "%~dp0lib\apply-config.js" "%~f0"
if errorlevel 1 (
  echo [WARN] Node 改写失败，尝试 PowerShell 备用通道...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='%~dp0config.json'; $c=Get-Content -Raw $p | ConvertFrom-Json; if('%LLM_PROFILE%') { $c.llmProfile='%LLM_PROFILE%' }; if('%TTS_MODE%') { $c.ttsMode='%TTS_MODE%' }; if('%GSV_IDLE%') { $c.gsvIdleSeconds=[int]'%GSV_IDLE%' }; $c.watchdog=('%WATCHDOG%' -eq 'on'); [IO.File]::WriteAllText($p, ($c | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding $false)); Write-Host '[OK] 已通过备用通道成功改写 config.json！'"
)

if /i "%WATCHDOG%"=="on" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-watchdog.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-watchdog.ps1"
)

echo.
echo 提示：已成功改写 config.json，桌宠无需重启即可即时生效。
echo.
pause