@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"

set "NODE_BIN=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "D:\Program Files\nodejs\node.exe" (
    set "NODE_BIN=D:\Program Files\nodejs\node.exe"
  )
)

"%NODE_BIN%" "%~dp0lib\config-cli.js" %*
