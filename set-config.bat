@echo off
setlocal
cd /d "%~dp0"

rem =======================================================
rem  [桌宠配置] 用记事本修改下方参数，保存后双击运行即可应用
rem  (此脚本仅修改配置并同步看门狗，不会重启桌宠；可复制多份作为不同配置方案)
rem =======================================================

rem 1. 当前 LLM 档案名称 (对应 llm.config.json 中的 profile 名称，例如：硅基流动 或 strata)
set "LLM_PROFILE=硅基流动"

rem 2. 语音合成模式：
rem    auto = 按需启动 (闲置超时自动释放显存，推荐)
rem    on   = 常驻显存 (响应最快，但一直占显存)
rem    off  = 完全静音
set "TTS_MODE=auto"

rem 3. 语音闲置保持秒数 (仅在 auto 模式下有效，默认 120 秒)
set "GSV_IDLE=120"

rem 4. 是否同步开启看门狗守护进程：
rem    on  = 开启看门狗 (若未运行则拉起保活)
rem    off = 关闭看门狗 (立即杀掉运行中的看门狗残留)
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
echo 提示：配置已保存至 config.json，桌宠无需重启即可即时生效。
echo.
pause
