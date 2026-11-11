@echo off
rem Tail GPT-SoVITS output (logs\gsv.log) and TTS request log (logs\tts.log).
start "TTS logs" powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path '%~dp0logs\gsv.log','%~dp0logs\tts.log' -Wait -Tail 40"
