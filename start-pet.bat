@echo off
setlocal
cd /d "%~dp0"
set "PET_THINK=pet_think"

rem 截屏屏幕指定（可在此直接修改，也可启动时传参如 --cap-main=main 或 --cap-main=1）
rem 默认：PET_CAP_MAIN=main（主屏 / 工作台 LG 4K），PET_CAP_ROOM=room（副屏 / 卧室）
rem 支持填语义别名（main / room），也支持填数字下标（0 或 1）或屏幕名称（如 DISPLAY10, DISPLAY1）
if not defined PET_CAP_MAIN set "PET_CAP_MAIN=main"
if not defined PET_CAP_ROOM set "PET_CAP_ROOM=room"

rem 支持传 debug / --debug 参数进入独立调试历史
for %%a in (%*) do (
  if /i "%%a"=="debug" set "PET_DEBUG=1"
  if /i "%%a"=="--debug" set "PET_DEBUG=1"
)

rem Usage: start-pet.bat [debug] [auto|on|off] [idle_seconds] [--cap-main=1] [--cap-room=0]
rem Examples:
rem   start-pet.bat
rem   start-pet.bat debug
rem   start-pet.bat --cap-main=1 --cap-room=0
rem   start-pet.bat debug auto 180 --cap-main=1

start "" "%~dp0node_modules\electron\dist\electron.exe" . %*
