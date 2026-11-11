@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-watchdog.ps1"
if /i not "%~1"=="nopause" pause
