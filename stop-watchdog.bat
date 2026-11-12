@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

rem =======================================================
rem  [临时关闭看门狗] 只杀掉当前正在运行的看门狗进程，不改 config.json
rem  下次启动桌宠时，若 config.json 的 watchdog 仍为 true，看门狗会重新拉起
rem  只动看门狗本身：不重启、也不启动桌宠
rem =======================================================

set "NODE_CMD=node"
where node >nul 2>&1
if errorlevel 1 (
  if exist "D:\Program Files\nodejs\node.exe" set "NODE_CMD=D:\Program Files\nodejs\node.exe"
  if exist "C:\Program Files\nodejs\node.exe" set "NODE_CMD=C:\Program Files\nodejs\node.exe"
)

"%NODE_CMD%" "%~dp0lib\watchdog-ctl.js" stop
if errorlevel 1 (
  echo [WARN] 停止看门狗失败，可手动执行: node lib\watchdog-ctl.js stop
)

echo.
echo 提示：本次看门狗已停止；config.json 未改动，watchdog=true 时下次启动桌宠会重新拉起。
echo.
pause
