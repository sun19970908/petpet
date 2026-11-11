@echo off
setlocal
cd /d "%~dp0"
set "PET_THINK=pet_think"

rem 截屏屏幕指定（可在此直接修改，也可启动时传参如 --cap-main=1）
rem 默认：PET_CAP_MAIN=1（主屏 / 屏幕 2），PET_CAP_ROOM=0（副屏卧室 / 屏幕 1）
rem 支持填数字下标（0 或 1），也支持填名称（如 "屏幕 2"、"屏幕 1"）
if not defined PET_CAP_MAIN set "PET_CAP_MAIN=1"
if not defined PET_CAP_ROOM set "PET_CAP_ROOM=0"

rem Usage: start-pet.bat [auto|on|off] [idle_seconds] [--cap-main=1] [--cap-room=0]
rem Examples:
rem   start-pet.bat
rem   start-pet.bat --cap-main=1 --cap-room=0
rem   start-pet.bat auto 180 --cap-main=1

start "" "%~dp0node_modules\electron\dist\electron.exe" . %*
