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
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.environ.get("ASR_MODEL_DIR", "").strip()
if not MODEL_DIR:
    raise SystemExit("[asr] 未配置 ASR_MODEL_DIR（config.json 的 asrModelDir）")
MODEL_PATH = os.path.join(MODEL_DIR, "model.int8.onnx")
TOKENS_PATH = os.path.join(MODEL_DIR, "tokens.txt")
PORT = int(os.environ.get("ASR_PORT", "9882"))
MAX_ASR_BYTES = int(os.environ.get("ASR_MAX_BYTES", str(20 * 1024 * 1024)))

@app.middleware("http")
async def local_only(request: Request, call_next):
    if request.url.path == "/asr":
        host = request.headers.get("host", "").lower()
        if host not in (f"127.0.0.1:{PORT}", f"localhost:{PORT}"):
            return Response(status_code=403)
        if request.headers.get("origin") is not None:
            return Response(status_code=403)
        if request.headers.get("sec-fetch-site") is not None:
            return Response(status_code=403)
    return await call_next(request)


print(f"[asr] 正在加载 SenseVoice 模型: {MODEL_PATH} ...", flush=True)
recognizer = sherpa_onnx.OfflineRecognizer.from_sense_voice(
    model=MODEL_PATH,
    tokens=TOKENS_PATH,
    num_threads=2,
    use_itn=True,
    debug=False
)
print(f"[asr] SenseVoice 模型加载完成，端口 {PORT} 就绪！", flush=True)

def clean_tags(text: str) -> str:
    return re.sub(r'<\|.*?\|>', '', text).strip()

@app.get("/health")
async def health():
    return {"status": "ok", "model": "sense_voice"}

@app.post("/asr")
async def transcribe(request: Request):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            size = int(content_length)
        except ValueError:
            return Response(content='{"error": "Content-Length 无效"}', status_code=400, media_type="application/json")
        if size > MAX_ASR_BYTES:
            return Response(content='{"error": "音频数据过大"}', status_code=413, media_type="application/json")

    body = await request.body()
    if len(body) > MAX_ASR_BYTES:
        return Response(content='{"error": "音频数据过大"}', status_code=413, media_type="application/json")
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
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
