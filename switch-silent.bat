@echo off
setlocal
cd /d "%~dp0"

rem =======================================================
rem  [完全静音预设] 右键记事本可自由修改下方参数，双击运行即可应用
rem  (此脚本仅修改配置并同步看门狗，不会重启桌宠)
rem =======================================================

rem 1. 当前 LLM 档案名称 (对应 llm.config.json 中的 profile 名称)
set "LLM_PROFILE=硅基流动"

rem 2. 语音合成模式：auto (按需释放) / on (常驻) / off (静音)
set "TTS_MODE=off"

rem 3. 语音闲置保持秒数 (仅在 auto 模式下有效，默认 120 秒)
set "GSV_IDLE=120"

rem 4. 是否同步开启看门狗：on (开启保活) / off (关闭并清理残留)
set "WATCHDOG=off"

rem =======================================================
rem  下方为配置写入与同步逻辑，无需修改
rem =======================================================

node "%~dp0lib\apply-config.js" "%~f0"

if /i "%WATCHDOG%"=="on" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-watchdog.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-watchdog.ps1"
)

echo.
echo 提示：已切换为【完全静音预设】，桌宠无需重启即可即时生效。
echo.
pause
