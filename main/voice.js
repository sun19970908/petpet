// GPT-SoVITS + SenseVoice ASR 生命周期管理器，以及 /api/llm /api/tts /api/asr /api/dbg /api/log 转发
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const net = require('net');

function createVoiceAndApi({ APP_ROOT, GSV_MODE, getGsvMode, GSV_IDLE_TIMEOUT = 600000, getGsvIdleTimeoutMs, ttsServer, asrConfig, appendLine, createRotatingStream, getAppQuitting }) {
  const GSV = ttsServer || {};
  const GSV_DIR = GSV.dir;
  const GSV_PYTHON = path.isAbsolute(GSV.python) ? GSV.python : path.join(GSV_DIR, GSV.python);
  const GSV_CONFIG = GSV.config;
  const GSV_GPU = GSV.gpu;
  const GSV_PORT = Number(GSV.port);
  const GSV_START_TIMEOUT = Number(GSV.startTimeoutMs);
  const GSV_LOG = path.join(APP_ROOT, 'logs', 'gsv.log');
  const TTS_LOG = path.join(APP_ROOT, 'logs', 'tts.log');

  function logTo(file, msg) {
    appendLine(file, msg, { maxBytes: file === GSV_LOG ? 5 * 1024 * 1024 : 2 * 1024 * 1024 });
  }

  const isAppQuitting = () => typeof getAppQuitting === 'function' && getAppQuitting();

  function killChildProcess(proc) {
    if (!proc || !proc.pid || proc.killed) return Promise.resolve();
    if (process.platform === 'win32') {
      return new Promise((resolve) => {
        let done = false;
        let timer = null;
        const finish = () => { if (!done) { done = true; if (timer) clearTimeout(timer); resolve(); } };
        timer = setTimeout(finish, 3000);
        try { exec(`taskkill /F /T /PID ${proc.pid}`, finish); } catch { finish(); }
      });
    }
    return new Promise((resolve) => {
      let done = false;
      let timer = null;
      const finish = () => { if (!done) { done = true; if (timer) clearTimeout(timer); resolve(); } };
      timer = setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch {}
        finish();
      }, 1500);
      proc.once('exit', finish);
      try { proc.kill('SIGTERM'); } catch { finish(); }
    });
  }

  let gsvProc = null;
  let gsvStartingPromise = null;
  let lastGsvActivity = Date.now();
  const resolveIdleMs = () => {
    const v = typeof getGsvIdleTimeoutMs === 'function' ? getGsvIdleTimeoutMs() : GSV_IDLE_TIMEOUT;
    return Number.isFinite(v) && v > 0 ? v : 600000;
  };
  const resolveGsvMode = () => {
    const raw = typeof getGsvMode === 'function' ? getGsvMode() : GSV_MODE;
    const m = String(raw || 'auto').toLowerCase().trim();
    if (['always', 'on'].includes(m)) return 'always';
    if (['never', 'off', 'none'].includes(m)) return 'never';
    return 'auto';
  };

  console.log(`[gsv] 配置: mode=${resolveGsvMode()}, idleTimeout=${resolveIdleMs() / 1000}s, gpu=${GSV_GPU}`);

  function touchGsvActivity() {
    lastGsvActivity = Date.now();
  }

  function isGsvPortOpen() {
    return new Promise((resolve) => {
      const s = net.createConnection({ host: '127.0.0.1', port: GSV_PORT }, () => {
        s.destroy();
        resolve(true);
      });
      s.setTimeout(350);
      s.on('timeout', () => { s.destroy(); resolve(false); });
      s.on('error', () => { s.destroy(); resolve(false); });
    });
  }

  async function ensureGSV() {
    if (resolveGsvMode() === 'never') return false;
    if (isAppQuitting()) return false;
    touchGsvActivity();

    if (await isGsvPortOpen()) return true;
    if (gsvStartingPromise) return gsvStartingPromise;

    gsvStartingPromise = (async () => {
      try {
        console.log(`[gsv] 正在拉起 GPT-SoVITS (GPU ${GSV_GPU}, port ${GSV_PORT})...`);
        logTo(GSV_LOG, `=== 拉起 GPT-SoVITS (CUDA_VISIBLE_DEVICES=${GSV_GPU}) ===`);
        const gsvArgs = ['api_v2.py', '-a', '127.0.0.1', '-p', String(GSV_PORT), '-c', GSV_CONFIG];
        const gsvEnv = { ...process.env, CUDA_VISIBLE_DEVICES: GSV_GPU };
        gsvProc = spawn(GSV_PYTHON, gsvArgs, {
          cwd: GSV_DIR,
          env: gsvEnv,
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        // 必须消费子进程输出：GPT-SoVITS 的 tqdm 进度条输出很多，管道写满后子进程会卡死（TTS 偶发卡住的元凶）。
        // 顺便落到 logs/gsv.log，方便看"控制台"。
        try {
          const gsvLogStream = createRotatingStream(GSV_LOG, 5 * 1024 * 1024);
          gsvProc.stdout.pipe(gsvLogStream);
          gsvProc.stderr.pipe(gsvLogStream);
        } catch {}

        gsvProc.on('error', (err) => {
          logTo(GSV_LOG, `=== 进程错误 ${err.message} ===`);
          gsvProc = null;
        });
        if (gsvProc.stdout) gsvProc.stdout.on('error', () => {});
        if (gsvProc.stderr) gsvProc.stderr.on('error', () => {});

        if (isAppQuitting()) {
          await killChildProcess(gsvProc);
          gsvProc = null;
          return false;
        }

        gsvProc.on('exit', (code, sig) => {
          console.log(`[gsv] 进程已退出 (code=${code}, sig=${sig})`);
          logTo(GSV_LOG, `=== 进程退出 code=${code} sig=${sig} ===`);
          gsvProc = null;
        });

        const startTs = Date.now();
        while (Date.now() - startTs < GSV_START_TIMEOUT) {
          if (await isGsvPortOpen()) {
            console.log(`[gsv] GPT-SoVITS 已就绪（就绪耗时 ${Date.now() - startTs}ms）`);
            logTo(GSV_LOG, `=== 就绪，耗时 ${Date.now() - startTs}ms ===`);
            return true;
          }
          await new Promise((r) => setTimeout(r, 400));
        }
        console.warn(`[gsv] 启动等待超时（${Math.round(GSV_START_TIMEOUT / 1000)}s 内 ${GSV_PORT} 端口未响应）`);
        logTo(GSV_LOG, `=== 启动超时（${Math.round(GSV_START_TIMEOUT / 1000)}s） ===`);
        return false;
      } catch (e) {
        console.error('[gsv] 启动异常:', e.message);
        gsvProc = null;
        return false;
      } finally {
        gsvStartingPromise = null;
      }
    })();

    return gsvStartingPromise;
  }

  async function stopGSV() {
    const isOpen = await isGsvPortOpen();
    if (!isOpen && !gsvProc) return;

    console.log('[gsv] 空闲超时或退出，正在关闭 GPT-SoVITS 释放显存...');
    try {
      await new Promise((resolve) => {
        const r = http.get(`http://127.0.0.1:${GSV_PORT}/control?command=exit`, { timeout: 1500 }, () => resolve());
        r.on('error', () => resolve());
        r.on('timeout', () => { r.destroy(); resolve(); });
      });
    } catch {}

    await new Promise((r) => setTimeout(r, 800));
    if (gsvProc && !gsvProc.killed) {
      await killChildProcess(gsvProc);
    }
    gsvProc = null;
    console.log('[gsv] GPT-SoVITS 已关闭');
  }

  // 自动空闲巡检（auto 模式下超时无请求则杀死，动态读取 config.json 生效）
  setInterval(async () => {
    const mode = resolveGsvMode();
    if (mode === 'never') {
      if (await isGsvPortOpen()) {
        await stopGSV();
      }
      return;
    }
    if (mode === 'auto') {
      const idleMs = Date.now() - lastGsvActivity;
      if (idleMs >= resolveIdleMs()) {
        if (await isGsvPortOpen()) {
          await stopGSV();
        }
      }
    }
  }, 10000);

  // ===== SenseVoice ASR：主进程内通过 sherpa-onnx-node 运行 =====
  const ASR = asrConfig || {};
  const ASR_MODEL_DIR = ASR.modelDir ? path.resolve(APP_ROOT, ASR.modelDir) : '';
  const ASR_MODEL_PATH = ASR_MODEL_DIR ? path.join(ASR_MODEL_DIR, 'model.int8.onnx') : '';
  const ASR_TOKENS_PATH = ASR_MODEL_DIR ? path.join(ASR_MODEL_DIR, 'tokens.txt') : '';
  const ASR_MAX_BYTES = 20 * 1024 * 1024;

  let asrRecognizer = null;
  let asrLoadingPromise = null;
  let asrMissingWarned = false;

  function loadSherpa() {
    if (process.platform === 'linux' || process.platform === 'darwin') {
      const pkg = `sherpa-onnx-${process.platform}-${process.arch}`;
      const libDir = path.join(APP_ROOT, 'node_modules', pkg);
      if (fs.existsSync(libDir)) {
        const envName = process.platform === 'darwin' ? 'DYLD_LIBRARY_PATH' : 'LD_LIBRARY_PATH';
        const old = process.env[envName] || '';
        if (!old.split(path.delimiter).includes(libDir)) {
          process.env[envName] = libDir + (old ? path.delimiter + old : '');
        }
      }
    }
    return require('sherpa-onnx-node');
  }

  function asrModelAvailable() {
    return Boolean(ASR_MODEL_DIR && fs.existsSync(ASR_MODEL_PATH) && fs.existsSync(ASR_TOKENS_PATH));
  }

  async function ensureASR() {
    if (isAppQuitting()) return null;
    if (asrRecognizer) return asrRecognizer;
    if (asrLoadingPromise) return asrLoadingPromise;
    if (!asrModelAvailable()) {
      if (!asrMissingWarned) {
        console.warn('[asr] 未配置可用模型，跳过启动（需要 model.int8.onnx 和 tokens.txt）');
        asrMissingWarned = true;
      }
      return null;
    }

    asrLoadingPromise = (async () => {
      try {
        console.log(`[asr] 正在加载 SenseVoice 模型: ${ASR_MODEL_DIR}`);
        const sherpa = loadSherpa();
        const recognizer = await sherpa.OfflineRecognizer.createAsync({
          featConfig: { sampleRate: 16000, featureDim: 80 },
          modelConfig: {
            senseVoice: { model: ASR_MODEL_PATH, useInverseTextNormalization: 1 },
            tokens: ASR_TOKENS_PATH,
            numThreads: 2,
            provider: 'cpu',
            debug: 0,
          },
        });
        if (!isAppQuitting()) {
          asrRecognizer = recognizer;
          console.log('[asr] SenseVoice 模型加载完成');
          return asrRecognizer;
        }
        return null;
      } catch (e) {
        console.error('[asr] 模型加载失败:', e.message);
        asrRecognizer = null;
        return null;
      } finally {
        asrLoadingPromise = null;
      }
    })();

    return asrLoadingPromise;
  }

  async function stopASR() {
    asrRecognizer = null;
  }

  function readWavSamples(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < 44) {
      throw Object.assign(new Error('音频数据过短或为空'), { statusCode: 400 });
    }
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
      throw Object.assign(new Error('不是有效的 WAV 文件'), { statusCode: 400 });
    }

    let fmt = null;
    let dataOffset = -1;
    let dataSize = 0;
    let offset = 12;
    while (offset + 8 <= buf.length) {
      const id = buf.toString('ascii', offset, offset + 4);
      const size = buf.readUInt32LE(offset + 4);
      const body = offset + 8;
      if (id === 'fmt ' && size >= 16) {
        fmt = {
          audioFormat: buf.readUInt16LE(body),
          channels: buf.readUInt16LE(body + 2),
          sampleRate: buf.readUInt32LE(body + 4),
          bits: buf.readUInt16LE(body + 14),
        };
      } else if (id === 'data') {
        dataOffset = body;
        dataSize = Math.min(size, buf.length - body);
      }
      offset = body + size + (size & 1);
    }

    if (!fmt || fmt.audioFormat !== 1 || fmt.bits !== 16) {
      throw Object.assign(new Error('只支持 16-bit PCM WAV'), { statusCode: 400 });
    }
    if (fmt.channels < 1 || !fmt.sampleRate || dataOffset < 0 || dataSize < 2) {
      throw Object.assign(new Error('WAV 音频数据为空'), { statusCode: 400 });
    }

    const frameCount = Math.floor(dataSize / (2 * fmt.channels));
    if (!frameCount) {
      throw Object.assign(new Error('WAV 音频数据为空'), { statusCode: 400 });
    }
    const samples = new Float32Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
      samples[i] = buf.readInt16LE(dataOffset + i * 2 * fmt.channels) / 32768;
    }
    return { sampleRate: fmt.sampleRate, samples };
  }

  function cleanAsrText(text) {
    return String(text || '').replace(/<\|.*?\|>/g, '').trim();
  }

  function readBodyLimited(req, maxBytes) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let total = 0;
      let done = false;
      const fail = (err) => {
        if (done) return;
        done = true;
        reject(err);
      };
      req.on('data', (chunk) => {
        if (done) return;
        total += chunk.length;
        if (total > maxBytes) {
          fail(Object.assign(new Error('音频数据过大'), { statusCode: 413 }));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        if (done) return;
        done = true;
        resolve(Buffer.concat(chunks));
      });
      req.on('error', (err) => { fail(err); });
    });
  }

  function sendJson(res, status, data) {
    try {
      if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    } catch {}
  }

  async function handleAsrRequest(req, res) {
    if (isAppQuitting()) {
      sendJson(res, 503, { ok: false, error: '应用正在退出' });
      return;
    }
    const contentLength = Number(req.headers['content-length'] || 0);
    if (Number.isFinite(contentLength) && contentLength > ASR_MAX_BYTES) {
      req.resume();
      sendJson(res, 413, { ok: false, error: '音频数据过大' });
      return;
    }

    let body;
    try {
      body = await readBodyLimited(req, ASR_MAX_BYTES);
    } catch (e) {
      sendJson(res, e.statusCode || 400, { ok: false, error: e.message || '读取音频失败' });
      return;
    }

    try {
      const wave = readWavSamples(body);
      const recognizer = await ensureASR();
      if (!recognizer) {
        sendJson(res, 503, { ok: false, error: 'SenseVoice ASR 未就绪' });
        return;
      }
      const stream = recognizer.createStream();
      stream.acceptWaveform({ sampleRate: wave.sampleRate, samples: wave.samples });
      const result = await recognizer.decodeAsync(stream);
      const text = cleanAsrText(result && result.text);
      console.log(`[asr] 识别完成: ${text}`);
      sendJson(res, 200, { ok: true, text });
    } catch (e) {
      console.error('[asr] 识别失败:', e.message);
      sendJson(res, e.statusCode || 500, { ok: false, error: e.message || '识别失败' });
    }
  }

  let ffmpegWarned = false;
  function spawnFF() {
    try {
      return spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-qscale:a', '4', '-f', 'mp3', 'pipe:1'], { windowsHide: true });
    } catch (e) {
      if (!ffmpegWarned) { console.error('[ffmpeg] 启动失败:', e.message); ffmpegWarned = true; }
      return null;
    }
  }

  // 同源转发：渲染层只打本服务的 /api/*，由主进程转发到本地 LLM/TTS，绕开浏览器跨域
  const DUMP_DIR = path.join(APP_ROOT, 'logs', 'tts-dump');
  let dumpSeq = 0;

  function onLlmActivity() {
    touchGsvActivity();
    const mode = resolveGsvMode();
    if (mode === 'auto' || mode === 'always') {
      ensureGSV().catch((e) => console.error('[gsv] 预热启动异常:', e.message));
    }
  }

  function handleApi(req, res) {
    const pathname = req.url.split('?')[0];
    if (pathname === '/api/asr' && req.method === 'POST') {
      handleAsrRequest(req, res);
      return;
    }
    const routes = {
      '/api/tts': { host: '127.0.0.1', port: GSV_PORT, path: '/tts' },
    };
    const target = routes[pathname];
    if (!target || req.method !== 'POST') {
      if (req.url === '/api/dbg' && req.method === 'POST') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          if (process.env.PET_DEBUG || req.headers['x-pet-debug'] === '1') {
            appendLine(path.join(APP_ROOT, 'logs', 'renderer-dbg.log'), Buffer.concat(chunks).toString('utf8'), { stamp: false, maxBytes: 5 * 1024 * 1024 });
          }
          res.writeHead(204); res.end();
        });
        return;
      }
      if (req.url === '/api/log' && req.method === 'POST') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          const line = Buffer.concat(chunks).toString('utf8');
          appendLine(path.join(APP_ROOT, 'logs', 'renderer.log'), line, { maxBytes: 2 * 1024 * 1024 });
          res.writeHead(204); res.end();
        });
        return;
      }
      res.writeHead(404); res.end('unknown api'); return;
    }

    const isTts = target.path === '/tts';

    if (isTts) touchGsvActivity();

    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      const fullBody = Buffer.concat(chunks);
      const dumpTtsPair = (reqBuf, resBuf, ext) => {
        try {
          fs.mkdirSync(DUMP_DIR, { recursive: true });
          const seq = String(++dumpSeq).padStart(3, '0');
          fs.writeFileSync(path.join(DUMP_DIR, `${seq}-req.json`), reqBuf);
          fs.writeFileSync(path.join(DUMP_DIR, `${seq}-res.${ext}`), resBuf);
          const files = fs.readdirSync(DUMP_DIR).map((f) => ({ name: f, time: fs.statSync(path.join(DUMP_DIR, f)).mtimeMs })).sort((a, b) => a.time - b.time);
          while (files.length > 30) fs.unlinkSync(path.join(DUMP_DIR, files.shift().name));
        } catch {}
      };
      const ttsT0 = isTts ? Date.now() : 0;
      let ttsText = '';
      let ttsStreamWav = false;
      if (isTts) {
        let reqBody = {};
        try { reqBody = JSON.parse(fullBody.toString('utf8')) || {}; } catch {}
        ttsText = String(reqBody.text || '');
        const mediaType = String(reqBody.media_type || 'wav').toLowerCase();
        ttsStreamWav = Boolean(reqBody.streaming_mode) && reqBody.streaming_mode !== 'false' && reqBody.streaming_mode !== '0' && mediaType === 'wav';
        logTo(TTS_LOG, '请求: ' + ttsText.slice(0, 60).replace(/\s+/g, ' ') + (ttsText.length > 60 ? '…' : '') + ' (' + ttsText.length + ' 字' + (ttsStreamWav ? ', stream-wav' : '') + ')');
      }

      if (isTts) {
        if (resolveGsvMode() === 'never') {
          if (!res.headersSent) res.writeHead(503);
          res.end('TTS disabled (mode=never/off)');
          return;
        }
        const ok = await ensureGSV();
        if (!ok) {
          logTo(TTS_LOG, 'GSV 启动失败/超时');
          if (!res.headersSent) res.writeHead(502);
          res.end('GPT-SoVITS not ready');
          return;
        }
      }

      const forwardHeaders = {
        ...req.headers,
        'content-length': String(fullBody.length),
        'content-type': 'application/json',
        host: `${target.host}:${target.port}`,
      };
      delete forwardHeaders.origin;
      delete forwardHeaders['sec-fetch-site'];

      let activeFf = null;
      const upstream = http.request({
        host: target.host,
        port: target.port,
        path: target.path,
        method: 'POST',
        headers: forwardHeaders,
      }, (up) => {
        if (isTts) {
          logTo(TTS_LOG, '上游 ' + up.statusCode + ' in ' + (Date.now() - ttsT0) + 'ms');
          if (up.statusCode >= 400) {
            if (!res.headersSent) res.writeHead(up.statusCode, { 'Content-Type': up.headers['content-type'] || 'application/json' });
            up.on('error', () => { try { if (!res.destroyed && !res.writableEnded) res.end(); } catch {} });
            up.pipe(res);
            return;
          }
          if (ttsStreamWav) {
            if (!res.headersSent) res.writeHead(up.statusCode, { 'Content-Type': up.headers['content-type'] || 'audio/wav' });
            const wavChunks = [];
            up.on('data', (c) => {
              wavChunks.push(c);
              if (!res.destroyed && !res.writableEnded) {
                try { res.write(c); } catch {}
              }
            });
            up.on('end', () => {
              dumpTtsPair(fullBody, Buffer.concat(wavChunks), 'wav');
              if (!res.destroyed && !res.writableEnded) try { res.end(); } catch {}
            });
            up.on('error', () => {
              if (!res.destroyed && !res.writableEnded) try { res.end(); } catch {}
            });
            return;
          }
          const ff = spawnFF();
          activeFf = ff;
          if (!ff) {
            if (!res.headersSent) res.writeHead(502);
            if (!res.destroyed && !res.writableEnded) res.end('ffmpeg missing');
            return;
          }
          const cleanupFf = () => {
            try { up.unpipe(ff.stdin); } catch {}
            try { if (!ff.killed) ff.kill(); } catch {}
          };
          if (!res.headersSent) res.writeHead(up.statusCode, { 'Content-Type': 'audio/mpeg' });
          const resChunks = [];
          ff.on('error', (err) => {
            console.error('[ffmpeg] 进程错误:', err.message);
            cleanupFf();
            if (!res.destroyed && !res.writableEnded) try { res.end(); } catch {}
          });
          if (ff.stdin) ff.stdin.on('error', () => { try { up.unpipe(ff.stdin); } catch {} });
          if (ff.stdout) {
            ff.stdout.on('error', () => cleanupFf());
            ff.stdout.on('data', (c) => {
              resChunks.push(c);
              if (!res.destroyed && !res.writableEnded) {
                try { res.write(c); } catch {}
              }
            });
            ff.stdout.on('end', () => {
              dumpTtsPair(fullBody, Buffer.concat(resChunks), 'mp3');
              if (!res.destroyed && !res.writableEnded) try { res.end(); } catch {}
            });
          }
          if (ff.stderr) {
            ff.stderr.on('error', () => {});
            ff.stderr.on('data', (c) => console.error('[ffmpeg]', String(c).trim()));
          }
          up.on('error', () => cleanupFf());
          up.pipe(ff.stdin);
        } else {
          if (!res.headersSent) res.writeHead(up.statusCode, { 'Content-Type': up.headers['content-type'] || 'application/octet-stream' });
          up.on('error', () => { try { if (!res.destroyed && !res.writableEnded) res.end(); } catch {} });
          up.pipe(res);
        }
      });

      res.on('error', () => {});
      upstream.on('error', (e) => {
        if (isTts) logTo(TTS_LOG, '上游错误: ' + e.message + ' in ' + (Date.now() - ttsT0) + 'ms');
        if (!res.headersSent) {
          try { res.writeHead(502); } catch {}
        }
        if (!res.destroyed && !res.writableEnded) {
          try { res.end('upstream error: ' + e.message); } catch {}
        }
      });

      // 客户端提前断开时才掐掉上游；不能监听 req 'close'——它在请求体读完就触发，
      // 会在 upstream.end() 后立刻销毁转发连接（表现为 2ms 的 socket hang up）
      res.on('close', () => {
        if (!res.writableFinished) {
          if (!upstream.destroyed) upstream.destroy();
          if (activeFf && !activeFf.killed) try { activeFf.kill(); } catch {}
        }
      });

      upstream.end(fullBody);
    });
  }

  return { ensureGSV, stopGSV, ensureASR, stopASR, touchGsvActivity, onLlmActivity, handleApi };
}

module.exports = { createVoiceAndApi };
