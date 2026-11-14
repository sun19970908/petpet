@echo off
setlocal
cd /d "%~dp0"
set "PET_THINK=pet_think"

rem 启动参数只保留 debug（进入独立调试历史）；其余运行配置统一改 config.json
for %%a in (%*) do (
  if /i "%%a"=="debug" set "PET_DEBUG=1"
  if /i "%%a"=="--debug" set "PET_DEBUG=1"
)

start "" "%~dp0node_modules\electron\dist\electron.exe" . %*
