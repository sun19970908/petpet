import os
import re
import io
import wave
import numpy as np
import sherpa_onnx
import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = r"G:\AI\Open-LLM-VTuber\models\sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17"
MODEL_PATH = os.path.join(MODEL_DIR, "model.int8.onnx")
TOKENS_PATH = os.path.join(MODEL_DIR, "tokens.txt")

print(f"[asr] 正在加载 SenseVoice 模型: {MODEL_PATH} ...", flush=True)
recognizer = sherpa_onnx.OfflineRecognizer.from_sense_voice(
    model=MODEL_PATH,
    tokens=TOKENS_PATH,
    num_threads=2,
    use_itn=True,
    debug=False
)
print("[asr] SenseVoice 模型加载完成，端口 9882 就绪！", flush=True)

def clean_tags(text: str) -> str:
    return re.sub(r'<\|.*?\|>', '', text).strip()

@app.get("/health")
async def health():
    return {"status": "ok", "model": "sense_voice"}

@app.post("/asr")
async def transcribe(request: Request):
    body = await request.body()
    if not body or len(body) < 44:
        return Response(content='{"error": "音频数据过短或为空"}', status_code=400, media_type="application/json")
    
    try:
        with wave.open(io.BytesIO(body), "rb") as wf:
            sr = wf.getframerate()
            num_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            frames = wf.readframes(wf.getnframes())
            
            if sampwidth == 2:
                samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
            elif sampwidth == 4:
                samples = np.frombuffer(frames, dtype=np.float32)
            else:
                return Response(content='{"error": "不支持的采样位宽"}', status_code=400, media_type="application/json")
            
            if num_channels > 1:
                samples = samples[::num_channels]
        
        stream = recognizer.create_stream()
        stream.accept_waveform(sr, samples)
        recognizer.decode_streams([stream])
        raw_text = stream.result.text
        text = clean_tags(raw_text)
        print(f"[asr] 识别完成: {text}", flush=True)
        return {"ok": True, "text": text}
    except Exception as e:
        print(f"[asr] 识别出错: {e}", flush=True)
        return Response(content=f'{{"ok": false, "error": "{str(e)}"}}', status_code=500, media_type="application/json")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9882, log_level="warning")
