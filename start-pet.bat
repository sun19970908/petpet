@echo off
chcp 65001 >nul
title DeepSeek 娘桌宠

set "PET_THINK=pet_think"

rem === GPT-SoVITS 控制参数 ===
rem 用法:
rem   start-pet.bat                     (默认: 按需启动，120s 无请求自动杀死释放显存)
rem   start-pet.bat auto 180            (按需启动，自定义 180s 无请求休眠)
rem   start-pet.bat on                  (常驻模式: 开机即启动，不休眠)
rem   start-pet.bat off                 (不启动 GSV)
set "ARG1=%~1"
set "ARG2=%~2"

if "%ARG1%"=="" set "ARG1=auto"
if "%ARG2%"=="" set "ARG2=120"

if /i "%ARG1%"=="on" (
  set "PET_GSV_MODE=always"
) else if /i "%ARG1%"=="always" (
  set "PET_GSV_MODE=always"
) else if /i "%ARG1%"=="off" (
  set "PET_GSV_MODE=never"
) else if /i "%ARG1%"=="never" (
  set "PET_GSV_MODE=never"
) else (
  set "PET_GSV_MODE=auto"
)
set "PET_GSV_IDLE=%ARG2%"

echo [桌宠] GSV 语音模式: %PET_GSV_MODE% (空闲超时: %PET_GSV_IDLE%s)

cd /d "%~dp0"
start "" "%~dp0node_modules\electron\dist\electron.exe" .
