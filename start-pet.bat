@echo off
chcp 65001 >nul
title DeepSeek 娘桌宠
rem 前置：Strata(8081)、反代(11435)、GPT-SoVITS(9880，start-gsv-yousa.bat) 需先启动

set "PET_THINK=pet_think"

cd /d "%~dp0"
start "" "%~dp0node_modules\electron\dist\electron.exe" .

