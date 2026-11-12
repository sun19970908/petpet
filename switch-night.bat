@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo 正在一键切换为【夜间·挂机值班方案】并重启桌宠...
call "%~dp0set-config.bat" night
pause
