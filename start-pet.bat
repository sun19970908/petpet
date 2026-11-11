@echo off
setlocal
cd /d "%~dp0"
set "PET_THINK=pet_think"

rem Usage: start-pet.bat [auto|on|off] [idle_seconds]
rem Examples:
rem   start-pet.bat           (default: auto mode, 120s idle timeout)
rem   start-pet.bat on        (always running)
rem   start-pet.bat off       (never start GSV)
rem   start-pet.bat auto 180  (auto mode, 180s idle timeout)

start "" "%~dp0node_modules\electron\dist\electron.exe" . %*
