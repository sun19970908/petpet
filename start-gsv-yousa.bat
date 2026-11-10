@echo off
title GPT-SoVITS api_v2 - yousa v2 (3060 Ti)
set "CUDA_VISIBLE_DEVICES=1"
cd /d "G:\GPT-SoVITS-v2pro-20250604"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":9880" ^| findstr "LISTENING"') do (
  echo [!] Port 9880 already in use by PID %%p. GPT-SoVITS may already be running.
  goto :eof
)
echo Starting GPT-SoVITS api_v2 on GPU 1 (3060 Ti), port 9880 ...
runtime\python.exe api_v2.py -a 127.0.0.1 -p 9880 -c GPT_SoVITS/configs/tts_infer_yousa.yaml
