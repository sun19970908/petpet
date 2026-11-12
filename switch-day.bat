@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo 正在一键切换为【白天·日常/游戏方案】并重启桌宠...
call "%~dp0set-config.bat" day
pause
