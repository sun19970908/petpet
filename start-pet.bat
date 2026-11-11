@echo off
setlocal
cd /d "%~dp0"
set "PET_THINK=pet_think"

rem 截屏屏幕指定（可在此直接修改，也可启动时传参如 --cap-main=0）
rem 0 = 屏幕 1，1 = 屏幕 2（支持填数字下标 0/1/2，也支持填名称如 "屏幕 1"）
if not defined PET_CAP_MAIN set "PET_CAP_MAIN=0"
if not defined PET_CAP_ROOM set "PET_CAP_ROOM=1"

rem Usage: start-pet.bat [auto|on|off] [idle_seconds] [--cap-main=0] [--cap-room=1]
rem Examples:
rem   start-pet.bat
rem   start-pet.bat --cap-main=0 --cap-room=1
rem   start-pet.bat auto 180 --cap-main=0

start "" "%~dp0node_modules\electron\dist\electron.exe" . %*
