@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

rem =======================================================
rem  [关闭看门狗] 停掉正在运行的看门狗进程，并把 config.json 的 watchdog 置为 false
rem  只动看门狗本身：不重启、也不启动桌宠
rem =======================================================

set "NODE_CMD=node"
where node >nul 2>&1
if errorlevel 1 (
  if exist "D:\Program Files\nodejs\node.exe" set "NODE_CMD=D:\Program Files\nodejs\node.exe"
  if exist "C:\Program Files\nodejs\node.exe" set "NODE_CMD=C:\Program Files\nodejs\node.exe"
)

"%NODE_CMD%" -e "const path=require('path');const p=path.resolve(process.argv[1]);require(path.join(p,'lib','config-store')).updateConfig(p,{watchdog:false});console.log('[OK] config.json 已设为 watchdog=false');" "%~dp0."
if errorlevel 1 echo [WARN] 写入 config.json 失败，仍会尝试停止看门狗进程...

"%NODE_CMD%" "%~dp0lib\watchdog-ctl.js" stop
if errorlevel 1 (
  echo [WARN] 停止看门狗失败，可手动执行: node lib\watchdog-ctl.js stop
)

echo.
echo 提示：看门狗已关闭，下次启动桌宠也不会自动拉起；需要恢复请把 config.json 的 watchdog 改回 true。
echo.
pause
