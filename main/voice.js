// GPT-SoVITS + SenseVoice ASR 生命周期管理器，以及 /api/llm /api/tts /api/asr /api/dbg /api/log 转发
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const net = require('net');

function createVoiceAndApi({ APP_ROOT, GSV_MODE, GSV_IDLE_TIMEOUT = 600000, getGsvIdleTimeoutMs, appendLine, createRotatingStream }) {
  const GSV_DIR = process.env.PET_GSV_DIR || 'G:\\GPT-SoVITS-v2pro-20250604';
  const GSV_PYTHON = path.join(GSV_DIR, 'runtime', 'python.exe');
  const GSV_CONFIG = process.env.PET_GSV_CONFIG || 'GPT_SoVITS/configs/tts_infer_yousa.yaml';
  const GSV_GPU = process.env.PET_GSV_GPU || '1';
  const GSV_PORT = 9880;
  const GSV_LOG = path.join(APP_ROOT, 'logs', 'gsv.log');
  const TTS_LOG = path.join(APP_ROOT, 'logs', 'tts.log');

  function logTo(file, msg) {
    appendLine(file, msg, { maxBytes: file === GSV_LOG ? 5 * 1024 * 1024 : 2 * 1024 * 1024 });
  }

  let gsvProc = null;
  let gsvStartingPromise = null;
  let lastGsvActivity = Date.now();
  const resolveIdleMs = () => {
    const v = typeof getGsvIdleTimeoutMs === 'function' ? getGsvIdleTimeoutMs() : GSV_IDLE_TIMEOUT;
    return Number.isFinite(v) && v > 0 ? v : 600000;
  };

  console.log(`[gsv] 配置: mode=${GSV_MODE}, idleTimeout=${resolveIdleMs() / 1000}s, gpu=${GSV_GPU}`);

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
    if (GSV_MODE === 'never') return false;
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

        gsvProc.on('exit', (code, sig) => {
          console.log(`[gsv] 进程已退出 (code=${code}, sig=${sig})`);
          logTo(GSV_LOG, `=== 进程退出 code=${code} sig=${sig} ===`);
          gsvProc = null;
        });

        const startTs = Date.now();
        while (Date.now() - startTs < 90000) {
          if (await isGsvPortOpen()) {
            console.log(`[gsv] GPT-SoVITS 已就绪（就绪耗时 ${Date.now() - startTs}ms）`);
            logTo(GSV_LOG, `=== 就绪，耗时 ${Date.now() - startTs}ms ===`);
            return true;
          }
          await new Promise((r) => setTimeout(r, 400));
        }
        console.warn('[gsv] 启动等待超时（90s 内 9880 端口未响应）');
        logTo(GSV_LOG, '=== 启动超时（90s） ===');
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
      try {
        if (gsvProc.pid) exec(`taskkill /F /T /PID ${gsvProc.pid}`, () => {});
      } catch {}
    }
    gsvProc = null;
    console.log('[gsv] GPT-SoVITS 已关闭');
  }

  // 自动空闲巡检（auto 模式下超时无请求则杀死，动态读取 config.json 生效）
  if (GSV_MODE === 'auto') {
    setInterval(async () => {
      const idleMs = Date.now() - lastGsvActivity;
      if (idleMs >= resolveIdleMs()) {
        if (await isGsvPortOpen()) {
          await stopGSV();
        }
      }
    }, 10000);
  }

  // ===== Sherpa-ONNX / SenseVoice ASR 生命周期管理器 =====
  const ASR_PYTHON = 'G:\\AI\\Open-LLM-VTuber\\.venv\\Scripts\\python.exe';
  const ASR_SCRIPT = path.join(APP_ROOT, 'asr_server.py');
  const ASR_PORT = 9882;

  let asrProc = null;
  let asrStartingPromise = null;

  function isAsrPortOpen() {
    return new Promise((resolve) => {
      const s = net.createConnection({ host: '127.0.0.1', port: ASR_PORT }, () => {
        s.destroy();
        resolve(true);
      });
      s.setTimeout(350);
      s.on('timeout', () => { s.destroy(); resolve(false); });
      s.on('error', () => { s.destroy(); resolve(false); });
    });
  }

  async function ensureASR() {
    if (await isAsrPortOpen()) return true;
    if (asrStartingPromise) return asrStartingPromise;

    asrStartingPromise = (async () => {
      try {
        console.log(`[asr] 正在拉起 SenseVoice ASR (port ${ASR_PORT})...`);
        asrProc = spawn(ASR_PYTHON, [ASR_SCRIPT], {
          cwd: APP_ROOT,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        asrProc.on('error', (err) => {
          console.error(`[asr] 进程启动/运行错误: ${err.message}`);
          asrProc = null;
        });
        if (asrProc.stdout) {
          asrProc.stdout.on('error', () => {});
          asrProc.stdout.on('data', (d) => console.log(d.toString('utf8').trim()));
        }
        if (asrProc.stderr) {
          asrProc.stderr.on('error', () => {});
          asrProc.stderr.on('data', (d) => console.error(d.toString('utf8').trim()));
        }

        asrProc.on('exit', (code, sig) => {
          console.log(`[asr] 进程已退出 (code=${code}, sig=${sig})`);
          asrProc = null;
        });

        const startTs = Date.now();
        while (Date.now() - startTs < 35000) {
          if (await isAsrPortOpen()) {
            console.log(`[asr] SenseVoice ASR 已就绪（就绪耗时 ${Date.now() - startTs}ms）`);
            return true;
          }
          await new Promise((r) => setTimeout(r, 300));
        }
        console.warn('[asr] 启动等待超时（35s 内 9882 端口未响应）');
        return false;
      } catch (e) {
        console.error('[asr] 启动异常:', e.message);
        asrProc = null;
        return false;
      } finally {
        asrStartingPromise = null;
      }
    })();

    return asrStartingPromise;
  }

  function stopASR() {
    if (asrProc && !asrProc.killed) {
      console.log('[asr] 正在关闭 ASR 进程...');
      try {
        if (asrProc.pid) exec(`taskkill /F /T /PID ${asrProc.pid}`, () => {});
      } catch {}
      asrProc = null;
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

  function handleApi(req, res) {
    const routes = {
      '/api/llm': { host: '127.0.0.1', port: 11435, path: '/v1/chat/completions' },
      '/api/tts': { host: '127.0.0.1', port: 9880, path: '/tts' },
      '/api/asr': { host: '127.0.0.1', port: 9882, path: '/asr' },
    };
    const target = routes[req.url.split('?')[0]];
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

    const isLlm = target.port === 11435;
    const isTts = target.port === 9880;
    const isAsr = target.port === 9882;

    if (isLlm || isTts) touchGsvActivity();

    if (isLlm && GSV_MODE === 'auto') {
      ensureGSV().catch((e) => console.error('[gsv] 预热启动异常:', e.message));
    }

    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      const fullBody = Buffer.concat(chunks);
      const ttsT0 = isTts ? Date.now() : 0;
      let ttsText = '';
      if (isTts) {
        try { ttsText = String(JSON.parse(fullBody.toString('utf8')).text || ''); } catch {}
        logTo(TTS_LOG, '请求: ' + ttsText.slice(0, 60).replace(/\s+/g, ' ') + (ttsText.length > 60 ? '…' : '') + ' (' + ttsText.length + ' 字)');
      }

      if (isTts) {
        if (GSV_MODE === 'never') {
          if (!res.headersSent) res.writeHead(503);
          res.end('TTS disabled (GSV_MODE=never)');
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

      if (isAsr) {
        const ok = await ensureASR();
        if (!ok) {
          if (!res.headersSent) res.writeHead(502);
          res.end('SenseVoice ASR not ready');
          return;
        }
      }

      const forwardHeaders = {
        ...req.headers,
        'content-length': String(fullBody.length),
        'content-type': isAsr ? (req.headers['content-type'] || 'audio/wav') : 'application/json',
        host: `${target.host}:${target.port}`,
      };

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
              try {
                fs.mkdirSync(DUMP_DIR, { recursive: true });
                const seq = String(++dumpSeq).padStart(3, '0');
                fs.writeFileSync(path.join(DUMP_DIR, `${seq}-req.json`), fullBody);
                fs.writeFileSync(path.join(DUMP_DIR, `${seq}-res.mp3`), Buffer.concat(resChunks));
                const files = fs.readdirSync(DUMP_DIR).map((f) => ({ name: f, time: fs.statSync(path.join(DUMP_DIR, f)).mtimeMs })).sort((a, b) => a.time - b.time);
                while (files.length > 30) fs.unlinkSync(path.join(DUMP_DIR, files.shift().name));
              } catch {}
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

  return { ensureGSV, stopGSV, ensureASR, stopASR, touchGsvActivity, handleApi };
}

module.exports = { createVoiceAndApi };
