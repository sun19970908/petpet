@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo 正在一键切换为【静音·免扰方案】并重启桌宠...
call "%~dp0set-config.bat" silent
pause
