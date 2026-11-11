// DeepSeek 娘桌宠 - Electron 主进程
// 全屏透明置顶窗：默认鼠标穿透（forward 模式），桌宠看得到全屏光标，
// livliv 自带的视线跟随/挑眉/微笑等原生互动全程生效
const { app, BrowserWindow, screen, ipcMain, desktopCapturer, nativeImage, session } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const net = require('net');

const APP_ROOT = __dirname;
const PORT = 12400;
const SPLIT_WINDOWS = true;   // 双窗：卧室独立窗(锁副屏，不动) + 桌宠窗(主屏)。设 false 回退单窗旧行为
// GPU 策略：跨屏透明窗的 Chromium GPU 合成会落到独显（3060 Ti）上（实测 ~137MB + 8~17% 3D），
// 关掉 GPU 合成后独显占用归零（WebGL 精灵仍走核显硬件），代价约 0.4 核 CPU。
// 想回硬件合成：启动时设 PET_HW_COMPOSITING=1
if (process.env.PET_HW_COMPOSITING !== '1') app.commandLine.appendSwitch('disable-gpu-compositing');
// Windows Graphics Capture (WGC)：启用现代 WGC 捕获多屏/跨 GPU 显示器（双独显 3060Ti+4060Ti 跨屏必备）
app.commandLine.appendSwitch('enable-features', 'WebRtcAllowWgcScreenCapturer');
// 思考方案开关（启动脚本 set PET_THINK=...）：pet_think | off
//   pet_think = pet_think 标签 + 动态思考强度（轻/标准/深，按问题特征），模型固定 nothink
//   off       = 不注入思考模块
const THINK_MODE = ['pet_think', 'off'].includes((process.env.PET_THINK || '').toLowerCase())
  ? process.env.PET_THINK.toLowerCase()
  : 'pet_think';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.css': 'text/css; charset=utf-8',
};

// ===== GPT-SoVITS 生命周期管理器 =====
// 参数优先级：CLI 参数 > 环境变量 > 默认值
// 模式：PET_GSV_MODE=auto (默认，发 LLM 请求时提前预热拉起，无请求超时休眠) | always (常驻) | never (不启动)
// 空闲超时：PET_GSV_IDLE=600 (默认 600 秒无请求退出释放显存；太短会导致每轮对话都冷启动，TTS 整段静默)
let cliGsvMode = null;
let cliGsvIdle = null;
let cliCapMain = null;
let cliCapRoom = null;
for (const arg of process.argv.slice(1)) {
  if (!arg || arg === '.' || arg.endsWith('electron.exe') || arg.endsWith('main.js')) continue;
  if (arg.startsWith('--gsv-mode=')) cliGsvMode = arg.slice(11);
  else if (arg.startsWith('--gsv-idle=')) cliGsvIdle = arg.slice(11);
  else if (arg.startsWith('--cap-main=')) cliCapMain = arg.slice(11);
  else if (arg.startsWith('--cap-room=')) cliCapRoom = arg.slice(11);
  else if (arg === 'debug' || arg === '--debug') process.env.PET_DEBUG = '1';
  else if (['auto', 'always', 'on', 'never', 'off'].includes(arg.toLowerCase())) cliGsvMode = arg;
  else if (/^\d+$/.test(arg)) cliGsvIdle = arg;
}

const CAP_MAIN_CFG = cliCapMain ?? process.env.PET_CAP_MAIN ?? '1';
const CAP_ROOM_CFG = cliCapRoom ?? process.env.PET_CAP_ROOM ?? '0';

const rawGsvMode = (cliGsvMode || process.env.PET_GSV_MODE || 'auto').toLowerCase();
const GSV_MODE = ['always', 'on'].includes(rawGsvMode) ? 'always'
  : ['never', 'off', 'none'].includes(rawGsvMode) ? 'never'
  : 'auto';
const GSV_IDLE_TIMEOUT = (parseInt(cliGsvIdle || process.env.PET_GSV_IDLE, 10) || 600) * 1000;

const GSV_DIR = process.env.PET_GSV_DIR || 'G:\\GPT-SoVITS-v2pro-20250604';
const GSV_PYTHON = path.join(GSV_DIR, 'runtime', 'python.exe');
const GSV_CONFIG = process.env.PET_GSV_CONFIG || 'GPT_SoVITS/configs/tts_infer_yousa.yaml';
const GSV_GPU = process.env.PET_GSV_GPU || '1';
const GSV_PORT = 9880;
const GSV_LOG = path.join(APP_ROOT, 'logs', 'gsv.log');
const TTS_LOG = path.join(APP_ROOT, 'logs', 'tts.log');
function logTo(file, msg) {
  try {
    fs.mkdirSync(path.join(APP_ROOT, 'logs'), { recursive: true });
    fs.appendFileSync(file, new Date().toISOString() + ' ' + msg + '\n');
  } catch {}
}

let gsvProc = null;
let gsvStartingPromise = null;
let lastGsvActivity = Date.now();

console.log(`[gsv] 配置: mode=${GSV_MODE}, idleTimeout=${GSV_IDLE_TIMEOUT / 1000}s, gpu=${GSV_GPU}`);

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
        const gsvLogStream = fs.createWriteStream(GSV_LOG, { flags: 'a' });
        gsvProc.stdout.pipe(gsvLogStream);
        gsvProc.stderr.pipe(gsvLogStream);
      } catch {}

      gsvProc.on('exit', (code, sig) => {
        console.log(`[gsv] 进程已退出 (code=${code}, sig=${sig})`);
        logTo(GSV_LOG, `=== 进程退出 code=${code} sig=${sig} ===`);
        gsvProc = null;
      });

      const startTs = Date.now();
      // 冷启动（加载模型）可能远超 25s；等太短会导致 TTS 请求在上游未就绪时失败，
      // 随后 60s 静默期把整段回复都跳过（"整段没声音"就是这么来的）
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

// 自动空闲巡检（auto 模式下超时无请求则杀死）
if (GSV_MODE === 'auto') {
  setInterval(async () => {
    const idleMs = Date.now() - lastGsvActivity;
    if (idleMs >= GSV_IDLE_TIMEOUT) {
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
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      asrProc.stdout.on('data', (d) => console.log(d.toString().trim()));
      asrProc.stderr.on('data', (d) => console.error(d.toString().trim()));

      asrProc.on('exit', (code, sig) => {
        console.log(`[asr] 进程已退出 (code=${code}, sig=${sig})`);
        asrProc = null;
      });

      const startTs = Date.now();
      while (Date.now() - startTs < 15000) {
        if (await isAsrPortOpen()) {
          console.log(`[asr] SenseVoice ASR 已就绪（就绪耗时 ${Date.now() - startTs}ms）`);
          return true;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      console.warn('[asr] 启动等待超时（15s 内 9882 端口未响应）');
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
        try {
          fs.mkdirSync(path.join(APP_ROOT, 'logs'), { recursive: true });
          fs.appendFileSync(path.join(APP_ROOT, 'logs', 'renderer-dbg.log'), Buffer.concat(chunks) + '\n');
        } catch {}
        res.writeHead(204); res.end();
      });
      return;
    }
    if (req.url === '/api/log' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try {
          const line = Buffer.concat(chunks).toString('utf8');
          fs.mkdirSync(path.join(APP_ROOT, 'logs'), { recursive: true });
          fs.appendFileSync(path.join(APP_ROOT, 'logs', 'renderer.log'), new Date().toISOString() + ' ' + line + '\n');
        } catch {}
        res.writeHead(204); res.end();
      });
      return;
    }
    res.writeHead(404); res.end('unknown api'); return;
  }

  const isLlm = target.port === 11435;
  const isTts = target.port === 9880;
  const isAsr = target.port === 9882;

  // 只要有 LLM/TTS 请求，刷新 GSV 活跃时间戳
  if (isLlm || isTts) touchGsvActivity();

  // 若收到 LLM 请求且处于 auto 模式，立即异步触发预热拉起（时间重叠）
  if (isLlm && GSV_MODE === 'auto') {
    ensureGSV().catch((e) => console.error('[gsv] 预热启动异常:', e.message));
  }

  const bodyChunks = [];
  req.on('data', (c) => bodyChunks.push(c));
  req.on('end', async () => {
    const fullBody = Buffer.concat(bodyChunks);
    const ttsT0 = Date.now();
    let ttsText = '';
    if (isTts) {
      try { ttsText = String(JSON.parse(fullBody.toString('utf8')).text || ''); } catch {}
      logTo(TTS_LOG, '请求: ' + ttsText.slice(0, 60).replace(/\s+/g, ' ') + (ttsText.length > 60 ? '…' : '') + ' (' + ttsText.length + ' 字)');
    }

    // 若是 TTS 请求且开启了 GSV，等待服务端口就绪再转发，防止冷启动瞬间 502
    if (isTts && GSV_MODE !== 'never') {
      await ensureGSV();
    } else if (isAsr) {
      await ensureASR();
    }

    const forwardHeaders = {
      ...req.headers,
      'content-length': String(fullBody.length),
      'content-type': isAsr ? (req.headers['content-type'] || 'audio/wav') : 'application/json',
      host: `${target.host}:${target.port}`,
    };

    const upstream = http.request({
      host: target.host,
      port: target.port,
      path: target.path,
      method: 'POST',
      headers: forwardHeaders,
    }, (up) => {
      if (isTts) {
        logTo(TTS_LOG, '上游 ' + up.statusCode + ' in ' + (Date.now() - ttsT0) + 'ms');
        const ff = spawnFF();
        if (!ff) { res.writeHead(502); res.end('ffmpeg missing'); return; }
        res.writeHead(up.statusCode, { 'Content-Type': 'audio/mpeg' });
        const resChunks = [];
        ff.stdout.on('data', (c) => { resChunks.push(c); res.write(c); });
        ff.stdout.on('end', () => {
          try {
            fs.mkdirSync(DUMP_DIR, { recursive: true });
            const seq = String(++dumpSeq).padStart(3, '0');
            fs.writeFileSync(path.join(DUMP_DIR, `${seq}-req.json`), fullBody);
            fs.writeFileSync(path.join(DUMP_DIR, `${seq}-res.mp3`), Buffer.concat(resChunks));
            const files = fs.readdirSync(DUMP_DIR).map((f) => ({ name: f, time: fs.statSync(path.join(DUMP_DIR, f)).mtimeMs })).sort((a, b) => a.time - b.time);
            while (files.length > 30) fs.unlinkSync(path.join(DUMP_DIR, files.shift().name));
          } catch {}
          res.end();
        });
        ff.stderr.on('data', (c) => console.error('[ffmpeg]', String(c).trim()));
        up.pipe(ff.stdin);
        up.on('error', () => { try { ff.kill(); } catch {} });
      } else {
        res.writeHead(up.statusCode, { 'Content-Type': up.headers['content-type'] || 'application/octet-stream' });
        up.pipe(res);
      }
    });

    upstream.on('error', (e) => {
      if (isTts) logTo(TTS_LOG, '上游错误: ' + e.message + ' in ' + (Date.now() - ttsT0) + 'ms');
      res.writeHead(502);
      res.end('upstream error: ' + e.message);
    });

    // 客户端提前断开时才掐掉上游；不能监听 req 'close'——它在请求体读完就触发，
    // 会在 upstream.end() 后立刻销毁转发连接（表现为 2ms 的 socket hang up）
    res.on('close', () => {
      if (!res.writableFinished && !upstream.destroyed) upstream.destroy();
    });

    upstream.end(fullBody);
  });
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

// 截屏目标解析器：支持数字下标（0, 1, 2）或屏幕名称模糊匹配（如 "屏幕 1", "屏幕 2", "LG", "TFC"）
function resolveCapSource(sources, cfg, defaultIdx, targetDisplayId) {
  if (!sources || !sources.length) return null;
  const sVal = (cfg !== null && cfg !== undefined) ? String(cfg).trim() : '';
  if (sVal) {
    const num = parseInt(sVal, 10);
    if (String(num) === sVal && num >= 0 && num < sources.length) {
      return sources[num];
    }
    const found = sources.find((s) =>
      s.name.toLowerCase().includes(sVal.toLowerCase()) ||
      s.id.toLowerCase().includes(sVal.toLowerCase()) ||
      (s.display_id && s.display_id === sVal)
    );
    if (found) return found;
  }
  // 未指定 cfg 或未匹配到时，若能匹配到 target.id 优先按真实显示器 ID 绑定
  if (targetDisplayId) {
    const byId = sources.find((s) => s.display_id && s.display_id === String(targetDisplayId));
    if (byId) return byId;
  }
  return sources[defaultIdx] || sources[0];
}

// 截屏目标：'main' = 主屏（用户的世界，默认——你在主屏工作，她看到的应该是你的上下文）；
//           'room' = 卧室窗所在屏（她自己的房间，通常副屏——看照片墙/窗帘的实际状态）
// 不再做双屏拼接：她的两个视角语义分离
async function captureScreenBy(which) {
  const primary = screen.getPrimaryDisplay();
  const all = screen.getAllDisplays();
  const isRoom = which === 'room';

  let target = primary;
  if (isRoom) {
    if (!bedroomWin || bedroomWin.isDestroyed()) return null; // 卧室未开放
    const b = bedroomWin.getBounds();
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    target = all.find((d) => {
      const wa = d.workArea;
      return cx >= wa.x && cx < wa.x + wa.width && cy >= wa.y && cy < wa.y + wa.height;
    }) || all.find((d) => d.id !== primary.id) || primary;
  }

  const tw = (target && target.size && target.size.width) || 1920;
  const th = (target && target.size && target.size.height) || 1080;

  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: tw, height: th } });

  const cfg = isRoom ? CAP_ROOM_CFG : CAP_MAIN_CFG;
  const defaultIdx = isRoom ? 0 : 1;
  const src = resolveCapSource(sources, cfg, defaultIdx, target.id);

  let jpegBuffer = null;
  if (src && src.thumbnail && !src.thumbnail.isEmpty()) {
    jpegBuffer = src.thumbnail.toJPEG(85);
  }

  // 详细诊断日志：落盘 logs/windows.log 供 debug 模式完整追踪
  const srcSummary = sources.map((s, i) => `[${i}]"${s.name}"(id=${s.id},disp=${s.display_id || 'none'},empty=${s.thumbnail.isEmpty()})`).join('; ');
  const dispSummary = all.map((d) => `(id=${d.id},bounds=${d.bounds.x},${d.bounds.y},${d.bounds.width}x${d.bounds.height},pri=${d.id === primary.id})`).join('; ');

  winLog(`[cap] which=${which} cfg="${cfg}" targetId=${target.id} picked=${src ? (src.name + ' ' + src.id) : 'null'} bytes=${jpegBuffer ? jpegBuffer.length : 0} | sources=${srcSummary} | displays=${dispSummary}`);

  if (jpegBuffer) {
    try {
      fs.writeFileSync(path.join(APP_ROOT, 'logs', `last_cap_${which}.jpg`), jpegBuffer);
    } catch {}
  }

  return jpegBuffer ? jpegBuffer.toString('base64') : null;
}
async function captureNow() { return captureScreenBy('main'); }

// 主卡（GPU 0）占用率查询；nvidia-smi 不可用时返回 null（放行）
async function gpuUtil() {
  try {
    const out = await new Promise((resolve, reject) => {
      const p = spawn('nvidia-smi', ['--query-gpu=utilization.gpu', '--format=csv,noheader,nounits', '-i', '0'], { windowsHide: true });
      let s = '';
      p.stdout.on('data', (c) => { s += c; });
      p.on('error', reject);
      p.on('close', (code) => (code === 0 ? resolve(s) : reject(new Error('exit ' + code))));
    });
    const v = parseInt(out.trim(), 10);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

// ===== 语义记忆（Orama + 硅基流动 embedding）：对话/日记的长期可检索记忆 =====
const MEMORY_FILE = path.join(APP_ROOT, 'history', 'memory.orama');
const MEMORY_FILE_DEBUG = path.join(APP_ROOT, 'history', 'debug-memory.orama');
let memoryDB = null;        // 正式索引
let memoryDBDebug = null;   // debug 索引
let oramaLib = null;
let mandarinTok = null;
function memoryFileFor(mode) { return mode === 'debug' ? MEMORY_FILE_DEBUG : MEMORY_FILE; }

async function getOrama() {
  if (!oramaLib) oramaLib = await import('@orama/orama');
  return oramaLib;
}
async function getTokenizer() {
  if (!mandarinTok) {
    const m = await import('@orama/tokenizers/mandarin');
    mandarinTok = m.createTokenizer();
  }
  return mandarinTok;
}
const MEMORY_SCHEMA = { text: 'string', role: 'string', kind: 'string', ts: 'number', embedding: 'vector[1024]' };

async function memoryInit(mode) {
  const { create, load } = await getOrama();
  const tok = await getTokenizer();
  const file = memoryFileFor(mode);
  if (fs.existsSync(file)) {
    try {
      // Orama v3 的分词器必须挂在 components: { tokenizer } 下，否则会退化为默认空格分词（中文 0 命中）
      const db = await create({ schema: MEMORY_SCHEMA, components: { tokenizer: tok } });
      const buf = fs.readFileSync(file);
      let raw;
      try { raw = JSON.parse(buf.toString('utf8')); } catch { raw = buf; }
      await load(db, raw);
      return db;
    } catch (e) { console.error('[memory] 索引加载失败，重建:', e.message); }
  }
  return create({ schema: MEMORY_SCHEMA, components: { tokenizer: tok } });
}
async function memorySave(mode) {
  const { save } = await getOrama();
  const db = mode === 'debug' ? memoryDBDebug : memoryDB;
  if (!db) return;
  fs.mkdirSync(path.dirname(memoryFileFor(mode)), { recursive: true });
  const raw = await save(db);
  // v3：对象 → JSON 文本；旧版：ArrayBuffer/typed array → Buffer
  const isPlainObject = raw && typeof raw === 'object' && !Buffer.isBuffer(raw) && !(raw instanceof ArrayBuffer) && !ArrayBuffer.isView(raw);
  fs.writeFileSync(memoryFileFor(mode), isPlainObject ? JSON.stringify(raw) : Buffer.from(raw));
}

// 硅基流动 embeddings（config.json: siliconflowKey / embeddingModel）
async function sfEmbed(texts) {
  const cfg = JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'config.json'), 'utf8'));
  const res = await fetch('https://api.siliconflow.cn/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + cfg.siliconflowKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: cfg.embeddingModel || 'BAAI/bge-m3', input: texts }),
  });
  if (!res.ok) throw new Error('embedding HTTP ' + res.status + ': ' + (await res.text()).slice(0, 120));
  const d = await res.json();
  return d.data.map((x) => x.embedding);
}

async function memoryAdd(items, mode) {
  if (!items?.length) return { ok: true, count: 0 };
  const { insert } = await getOrama();
  if (mode === 'debug') { if (!memoryDBDebug) memoryDBDebug = await memoryInit(mode); }
  else { if (!memoryDB) memoryDB = await memoryInit(mode); }
  const db = mode === 'debug' ? memoryDBDebug : memoryDB;
  const texts = items.map((i) => String(i.text || ''));
  let vectors;
  try { vectors = await sfEmbed(texts); }
  catch (e) { return { ok: false, error: 'embedding 失败: ' + e.message }; }
  for (let i = 0; i < items.length; i++) {
    await insert(db, { text: texts[i], role: items[i].role || 'user', kind: items[i].kind || 'chat', ts: items[i].ts || Date.now(), embedding: vectors[i] });
  }
  await memorySave(mode);
  return { ok: true, count: items.length };
}

async function memorySearch(query, mode, limit = 5) {
  const { search } = await getOrama();
  // 冷启动保障：若此前未调用过 memoryAdd，显式加载或创建 db
  if (mode === 'debug') { if (!memoryDBDebug) memoryDBDebug = await memoryInit(mode); }
  else { if (!memoryDB) memoryDB = await memoryInit(mode); }
  const db = mode === 'debug' ? memoryDBDebug : memoryDB;
  if (!db) return { ok: true, hits: [] };
  let qvec = null;
  try { qvec = (await sfEmbed([String(query)]))[0]; } catch {} // embed 失败 → 退化为纯词法
  const r = await search(db, {
    term: String(query),
    // Orama v3 模式为 hybrid / fulltext；必须带合理的 similarity（v3 默认 0.8 太严，会导致正常语义相关命中被全盘过滤）
    mode: qvec ? 'hybrid' : 'fulltext',
    ...(qvec ? { vector: { value: qvec, property: 'embedding' }, similarity: 0.2 } : {}),
    limit: limit || 5,
  });
  return {
    ok: true,
    hits: r.hits.map((h) => ({ text: h.document.text, role: h.document.role, kind: h.document.kind, ts: h.document.ts, score: +Number(h.score).toFixed(4) })),
  };
}

async function memoryBackfill(mode) { // 索引为空时，把存量聊天记录灌进去
  const file = mode === 'debug' ? null : path.join(APP_ROOT, 'history', '聊天记录.json');
  if (!file || fs.existsSync(memoryFileFor(mode))) return;
  try {
    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(arr) || !arr.length) return;
    const items = arr.map((m) => ({
      text: typeof m.content === 'string' ? m.content : '[图片] ' + ((m.content || []).find((c) => c.type === 'text')?.text || ''),
      role: m.role, kind: 'chat', ts: Date.now(),
    })).filter((i) => i.text.trim());
    const out = await memoryAdd(items, mode);
    console.error('[memory] 回填完成:', out.count, '条');
  } catch (e) { console.error('[memory] 回填失败:', e.message); }
}

// 文件工具执行器（IPC 与 HTTP 兜底共用）：读/列目录无限制，写/删/改仅限 pet_space 沙箱
const PET_SPACE_DIR = 'G:\\AI\\livliv-pet\\pet_space';
const NOTES_DIR = PET_SPACE_DIR; // 兼容别名
function isPathInPetSpace(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const resolved = path.resolve(targetPath);
  const spaceUpper = path.resolve(PET_SPACE_DIR).toUpperCase();
  const targetUpper = resolved.toUpperCase();
  return targetUpper === spaceUpper || targetUpper.startsWith(spaceUpper + path.sep);
}
const isPathInNotes = isPathInPetSpace;
function isFileStrictlyInPetSpace(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const resolved = path.resolve(targetPath);
  const spaceUpper = path.resolve(PET_SPACE_DIR).toUpperCase();
  const targetUpper = resolved.toUpperCase();
  return targetUpper !== spaceUpper && targetUpper.startsWith(spaceUpper + path.sep);
}
const isFileStrictlyInNotes = isFileStrictlyInPetSpace;
const HISTORY_FILE = path.join(APP_ROOT, 'history', '聊天记录.json'); // 在 pet_space 沙箱外：她无权改写聊天记录
const HISTORY_FILE_DEBUG = path.join(APP_ROOT, 'history', 'debug-聊天记录.json'); // debug 模式独立历史
function historyFile(mode) { return mode === 'debug' ? HISTORY_FILE_DEBUG : HISTORY_FILE; }
function fstoolTail(n = 10) {
  try {
    const lines = fs.readFileSync(path.join(APP_ROOT, 'logs', 'fstool.log'), 'utf8').trim().split('\n');
    return lines.slice(-n).map((l) => {
      try {
        const d = JSON.parse(l);
        const a = d.args || {};
        const detail = (a.src_path && a.dest_path ? a.src_path + ' -> ' + a.dest_path : '') || a.path || a.query || ('content ' + String(a.content || '').length + '字') || '';
        return `${d.t.slice(5, 16).replace('T', ' ')} UTC ${d.name} ${detail}`;
      } catch { return l.slice(0, 100); }
    });
  } catch { return []; }
}
function historyLoad(mode) {
  try {
    const raw = fs.readFileSync(historyFile(mode), 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function historySave(arr, mode) {
  // 写盘时把 dataURL 图片抽取成独立文件（history/img/），JSON 里只留可预览的相对路径——防止记录膨胀
  const IMG_DIR = path.join(APP_ROOT, 'history', 'img');
  fs.mkdirSync(IMG_DIR, { recursive: true });
  let imgSeq = 0;
  const cleaned = arr.map((m, mi) => {
    if (!Array.isArray(m.content)) return m;
    const content = m.content.map((c, ci) => {
      const url = c?.image_url?.url;
      if (c?.type === 'image_url' && typeof url === 'string' && url.startsWith('data:image/')) {
        const mm = /^data:image\/(\w+);base64,(.*)$/.exec(url);
        if (mm) {
          const ext = mm[1] === 'jpeg' ? 'jpg' : mm[1];
          const name = `img_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${mi}_${ci}_${imgSeq++}.${ext}`;
          fs.writeFileSync(path.join(IMG_DIR, name), Buffer.from(mm[2], 'base64'));
          return { ...c, image_url: { url: `/history/img/${name}` } };
        }
      }
      return c;
    });
    return { ...m, content };
  });
  fs.writeFileSync(historyFile(mode), JSON.stringify(cleaned, null, 1), 'utf8');
  return true;
}
// ComfyUI 生图通道（本机 8188）：她把工作流交给 ComfyUI 跑，产出图拉到 pet_space/generated 并回传给她看
const COMFY_HOST = '127.0.0.1', COMFY_PORT = 8188;
// ComfyUI 的 input 目录（LoadImage 只从这儿读）。她的图在 pet_space，comfy_run 的 input_image 会先把图拷到这里
const COMFY_INPUT = process.env.STRATA_PET_COMFY_INPUT || 'G:/ComfyUI-Easy-Install/ComfyUI-Easy-Install/ComfyUI/input';
function comfyReq(method, urlPath, bodyObj) {
  return new Promise((resolve, reject) => {
    const data = bodyObj == null ? null : Buffer.from(JSON.stringify(bodyObj));
    const req = http.request({ host: COMFY_HOST, port: COMFY_PORT, method, path: urlPath,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {} }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}
async function comfyJson(method, urlPath, bodyObj) {
  const r = await comfyReq(method, urlPath, bodyObj);
  let json = null; try { json = JSON.parse(r.buffer.toString('utf8')); } catch {}
  return { status: r.status, json };
}
function comfyRunTool(args) {
  return (async () => {
    let wf = null, src = '';
    try {
      if (args.workflow_file) {
        const wfPath = path.resolve(String(args.workflow_file));
        if (!isPathInPetSpace(wfPath)) return { ok: false, error: '拒绝：workflow_file 必须在 ' + PET_SPACE_DIR + ' 内' };
        wf = JSON.parse(fs.readFileSync(wfPath, 'utf8')); src = path.basename(wfPath);
      } else if (args.workflow && typeof args.workflow === 'object') {
        wf = args.workflow; src = 'inline';
      } else {
        return { ok: false, error: '参数错误：给 workflow_file（pet_space 内的 .json）或 workflow（ComfyUI API 格式对象）' };
      }
    } catch (e) { return { ok: false, error: '工作流读取/解析失败: ' + String(e.message || e) }; }
    if (args.input_image) {
      // 工作流里有 LoadImage 时：把 pet_space 里的图拷进 ComfyUI input，并把 LoadImage 指向它（抠图/图生图用）
      const inPath = path.resolve(String(args.input_image));
      if (!isPathInPetSpace(inPath)) return { ok: false, error: 'input_image 必须在 ' + PET_SPACE_DIR + ' 内' };
      if (!fs.existsSync(inPath)) return { ok: false, error: 'input_image 不存在: ' + inPath };
      if (!fs.existsSync(COMFY_INPUT)) return { ok: false, error: '找不到 ComfyUI input 目录: ' + COMFY_INPUT };
      const ext = path.extname(inPath).toLowerCase() || '.png';
      const inName = 'pet_input' + ext;
      fs.copyFileSync(inPath, path.join(COMFY_INPUT, inName));
      let nLoad = 0;
      for (const id of Object.keys(wf)) { const nd = wf[id]; if (nd && nd.class_type === 'LoadImage') { nd.inputs = nd.inputs || {}; nd.inputs.image = inName; nLoad += 1; } }
      if (!nLoad) return { ok: false, error: '工作流里没有 LoadImage 节点，但给了 input_image' };
    }
    let pid;
    try {
      const r = await comfyJson('POST', '/prompt', { prompt: wf, client_id: 'livliv-pet' });
      if (r.status !== 200) return { ok: false, error: 'ComfyUI /prompt HTTP ' + r.status + ': ' + JSON.stringify(r.json).slice(0, 300) };
      if (r.json && r.json.error) return { ok: false, error: 'ComfyUI 拒绝工作流: ' + JSON.stringify(r.json.error).slice(0, 250) + ' ' + JSON.stringify(r.json.node_errors || {}).slice(0, 300) };
      pid = r.json && r.json.prompt_id;
    } catch (e) { return { ok: false, error: '连不上 ComfyUI(127.0.0.1:8188): ' + String(e.message || e) }; }
    if (!pid) return { ok: false, error: 'ComfyUI 没返回 prompt_id' };
    const t0 = Date.now();
    let outs = null;
    while (Date.now() - t0 < 300000) {
      await new Promise((res) => setTimeout(res, 800));
      let h;
      try { h = await comfyJson('GET', '/history/' + pid); } catch (e) { return { ok: false, error: 'ComfyUI /history 读失败: ' + String(e.message || e) }; }
      const rec = h.json && h.json[pid];
      if (rec && rec.outputs && Object.keys(rec.outputs).length) { outs = rec.outputs; break; }
      if (rec && rec.status && rec.status.status_str === 'error') return { ok: false, error: 'ComfyUI 执行出错: ' + JSON.stringify(rec.status).slice(0, 400) };
    }
    if (!outs) return { ok: false, error: 'ComfyUI 超时（300s）没产出图片' };
    const imgs = [];
    for (const k of Object.keys(outs)) for (const im of (outs[k].images || [])) imgs.push(im);
    if (!imgs.length) return { ok: false, error: '工作流跑完但没有图片输出（要一个 SaveImage 或 PreviewImage 节点）' };
    const dir = path.join(PET_SPACE_DIR, 'generated');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const saved = []; let first = null;
    for (let i = 0; i < imgs.length; i++) {
      const im = imgs[i];
      let v;
      try {
        v = await comfyReq('GET', '/view?filename=' + encodeURIComponent(im.filename || '') + '&subfolder=' + encodeURIComponent(im.subfolder || '') + '&type=' + encodeURIComponent(im.type || 'output'));
      } catch (e) { continue; }
      if (v.status !== 200 || !v.buffer.length) continue;
      const name = 'comfy_' + stamp + '_' + i + '_' + String(im.filename || 'img.png').replace(/[^\w.-]/g, '_');
      const outPath = path.join(dir, name);
      fs.writeFileSync(outPath, v.buffer);
      saved.push(outPath);
      if (!first) {
        const ext = path.extname(name).slice(1).toLowerCase();
        const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
        first = 'data:' + mime + ';base64,' + v.buffer.toString('base64');
      }
    }
    if (!saved.length) return { ok: false, error: '产出图片拉取失败' };
    return {
      ok: true,
      result: '工作流(' + src + ')跑完，' + saved.length + ' 张 → ' + saved.map((p) => p.replace(/\\/g, '/').replace(/^.*?pet_space\//, 'pet_space/')).join('、'),
      image: first,
    };
  })();
}
function runFsTool(call) {
  const r = runFsToolCore(call);
  Promise.resolve(r).then(() => maybeRoomChanged(call)).catch(() => {});
  return r;
}
function runFsToolCore(call) {
  try {
    let { name, args } = call;
    try {
      fs.mkdirSync(path.join(APP_ROOT, 'logs'), { recursive: true });
      fs.appendFileSync(path.join(APP_ROOT, 'logs', 'fstool.log'),
        JSON.stringify({ t: new Date().toISOString(), name, args }) + '\n');
    } catch {}
    // 旧工具名 → file_tool 兼容映射（历史消息里可能残留旧调用，别报未知工具）
    if (name === 'write_file') { name = 'file_tool'; args.action = 'write'; }
    else if (name === 'append_file') { name = 'file_tool'; args.action = 'append'; }
    else if (name === 'copy_file') { name = 'file_tool'; args.action = 'copy'; }
    else if (name === 'delete_file') { name = 'file_tool'; args.action = 'delete'; }
    if (name === 'comfy_run') return comfyRunTool(args);
    if (name === 'file_tool') {
      const action = args.action;
      if (action === 'write') {
        const resolved = path.resolve(args.path);
        if (!isPathInPetSpace(resolved)) {
          return Promise.resolve({ ok: false, error: '拒绝：写入仅允许在 ' + PET_SPACE_DIR + ' 目录内' });
        }
        if (typeof args.content !== 'string') {
          return Promise.resolve({ ok: false, error: '参数错误：content 必须为字符串' });
        }
        if (args.content.length > 200000) return Promise.resolve({ ok: false, error: '拒绝：内容超过 200KB' });
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        fs.writeFileSync(resolved, args.content, 'utf8');
        return Promise.resolve({ ok: true, result: '已写入 ' + resolved + '（' + args.content.length + ' 字符）' });
      }
      if (action === 'append') {
        const resolved = path.resolve(args.path);
        if (!isPathInPetSpace(resolved)) {
          return Promise.resolve({ ok: false, error: '拒绝：追加仅允许在 ' + PET_SPACE_DIR + ' 目录内' });
        }
        if (typeof args.content !== 'string') {
          return Promise.resolve({ ok: false, error: '参数错误：content 必须为字符串' });
        }
        if (args.content.length > 200000) return Promise.resolve({ ok: false, error: '拒绝：单次追加内容超过 200KB' });
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        fs.appendFileSync(resolved, args.content, 'utf8');
        return Promise.resolve({ ok: true, result: '已追加到 ' + resolved + '（追加 ' + args.content.length + ' 字符）' });
      }
      if (action === 'copy') {
        if (!args.src_path || !args.dest_path) {
          return Promise.resolve({ ok: false, error: '参数错误：缺少 src_path 或 dest_path' });
        }
        const srcResolved = path.resolve(args.src_path);
        const destResolved = path.resolve(args.dest_path);
        if (!isPathInPetSpace(destResolved)) {
          return Promise.resolve({ ok: false, error: '拒绝：复制目标仅允许在 ' + PET_SPACE_DIR + ' 沙盒内' });
        }
        if (!fs.existsSync(srcResolved)) {
          return Promise.resolve({ ok: false, error: '源文件不存在: ' + srcResolved });
        }
        fs.mkdirSync(path.dirname(destResolved), { recursive: true });
        const stat = fs.statSync(srcResolved);
        if (stat.isDirectory()) {
          fs.cpSync(srcResolved, destResolved, { recursive: true });
          return Promise.resolve({ ok: true, result: '已复制目录: ' + srcResolved + ' -> ' + destResolved });
        } else {
          fs.copyFileSync(srcResolved, destResolved);
          return Promise.resolve({ ok: true, result: '已复制文件: ' + srcResolved + ' -> ' + destResolved + '（' + stat.size + ' 字节）' });
        }
      }
      if (action === 'delete') {
        if (!args.path) {
          return Promise.resolve({ ok: false, error: '参数错误：缺少 path 参数' });
        }
        const resolved = path.resolve(args.path);
        if (!isFileStrictlyInPetSpace(resolved)) {
          return Promise.resolve({ ok: false, error: '拒绝：删除仅允许在 ' + PET_SPACE_DIR + ' 目录内，禁止删除沙盒根目录或沙盒外文件' });
        }
        if (!fs.existsSync(resolved)) {
          return Promise.resolve({ ok: false, error: '文件或目录不存在: ' + resolved });
        }
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
          fs.rmSync(resolved, { recursive: true, force: true });
          return Promise.resolve({ ok: true, result: '已删除目录: ' + resolved });
        } else {
          fs.unlinkSync(resolved);
          return Promise.resolve({ ok: true, result: '已删除文件: ' + resolved });
        }
      }
      return Promise.resolve({ ok: false, error: '参数错误：未知 action ' + action + '（可选 write/append/copy/delete）' });
    }
    if (name === 'read_file') {
      // 不截断：她以后要整份读聊天记录做上下文压缩；超大文件导致的请求失败是自然边界
      const data = fs.readFileSync(path.resolve(args.path), 'utf8');
      return Promise.resolve({ ok: true, result: data });
    }
    if (name === 'list_dir') {
      const entries = fs.readdirSync(path.resolve(args.path), { withFileTypes: true })
        .map((d) => (d.isDirectory() ? '[目录] ' : '[文件] ') + d.name);
      return Promise.resolve({ ok: true, result: entries.join('\n') || '(空目录)' });
    }
    if (name === 'take_screenshot') {
      return (async () => {
        const b64 = await captureNow();
        if (!b64) return { ok: false, error: '没有可截取的屏幕' };
        const jpeg = Buffer.from(b64, 'base64');
        fs.mkdirSync(path.join(APP_ROOT, 'history', 'img'), { recursive: true });
        const fname = `screen_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.jpg`;
        fs.writeFileSync(path.join(APP_ROOT, 'history', 'img', fname), jpeg);
        return {
          ok: true,
          result: '屏幕截图已保存: /history/img/' + fname + '（画面已附在接下来的消息里）',
          image: 'data:image/jpeg;base64,' + b64,
        };
      })();
    }
    if (name === 'look_at_room') {
      // 看一眼自己房间（卧室窗所在屏，通常副屏）的实际状态——照片墙/窗帘/灯都看真实的
      return (async () => {
        const b64 = await captureScreenBy('room');
        if (!b64) return { ok: false, error: '房间未开放（当前没有副屏或卧室窗未创建）' };
        const jpeg = Buffer.from(b64, 'base64');
        fs.mkdirSync(path.join(APP_ROOT, 'history', 'img'), { recursive: true });
        const fname = `room_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.jpg`;
        fs.writeFileSync(path.join(APP_ROOT, 'history', 'img', fname), jpeg);
        return {
          ok: true,
          result: '房间截图已保存: /history/img/' + fname + '（画面已附在接下来的消息里）',
          image: 'data:image/jpeg;base64,' + b64,
        };
      })();
    }
    if (name === 'resize_image') {
      const resolved = path.resolve(args.path || '');
      if (!isPathInPetSpace(resolved)) return Promise.resolve({ ok: false, error: '拒绝：图片必须在 ' + PET_SPACE_DIR + ' 内' });
      if (!fs.existsSync(resolved)) return Promise.resolve({ ok: false, error: '文件不存在: ' + resolved });
      const img = nativeImage.createFromPath(resolved);
      if (!img || img.isEmpty()) return Promise.resolve({ ok: false, error: '读不出图片（格式不支持？）: ' + resolved });
      const sz = img.getSize();
      const mw = Math.max(16, Math.min(4096, Number(args.max_width) || 512));
      const mh = Math.max(16, Math.min(4096, Number(args.max_height) || 512));
      const sc = Math.min(mw / sz.width, mh / sz.height, 1);          // 只缩不放
      const w = Math.max(1, Math.round(sz.width * sc)), h = Math.max(1, Math.round(sz.height * sc));
      const q = Math.max(1, Math.min(100, Number(args.quality) || 82));
      const resized = img.resize({ width: w, height: h, quality: 'good' });
      let outPath;
      if (args.out_path) {
        outPath = path.resolve(String(args.out_path));
        if (!isPathInPetSpace(outPath)) return Promise.resolve({ ok: false, error: '拒绝：out_path 必须在 ' + PET_SPACE_DIR + ' 内' });
      } else {
        const dir = path.dirname(resolved);
        const base = path.basename(resolved).replace(/\.[^.]+$/, '');
        outPath = path.join(dir, base + '_small.jpg');
      }
      const ext = path.extname(outPath).toLowerCase();
      const buf = ext === '.png' ? resized.toPNG() : resized.toJPEG(q);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, buf);
      const kb = Math.round(buf.length / 1024);
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      return Promise.resolve({
        ok: true,
        result: '已缩放 ' + sz.width + 'x' + sz.height + ' → ' + w + 'x' + h + '（' + kb + ' KB）: ' + outPath.replace(/\\/g, '/'),
        image: 'data:' + mime + ';base64,' + buf.toString('base64'),
      });
    }
    if (name === 'edit_file') {
      const resolved = path.resolve(args.path || '');
      if (!isPathInPetSpace(resolved)) {
        return Promise.resolve({ ok: false, error: '拒绝：编辑仅允许在 ' + PET_SPACE_DIR + ' 目录内' });
      }
      if (typeof args.old_string !== 'string' || typeof args.new_string !== 'string') {
        return Promise.resolve({ ok: false, error: '参数错误：old_string 与 new_string 都必须是字符串' });
      }
      if (args.old_string === '') return Promise.resolve({ ok: false, error: '参数错误：old_string 不能为空' });
      let text;
      try { text = fs.readFileSync(resolved, 'utf8'); } catch (e) { return Promise.resolve({ ok: false, error: '读不到文件: ' + resolved }); }
      const parts = text.split(args.old_string);
      const count = parts.length - 1;
      if (count === 0) {
        return Promise.resolve({ ok: false, error: '没找到 old_string：文件里不存在完全一致的这一段（空格/换行要一字不差）' });
      }
      if (count > 1 && args.replace_all !== true) {
        return Promise.resolve({ ok: false, error: 'old_string 出现了 ' + count + ' 次；多给一点上下文让它唯一，或传 replace_all=true 全部替换' });
      }
      // split/join 而非 String.replace：避免 new_string 里的 $& 等被当替换模式
      const next = args.replace_all === true ? parts.join(args.new_string) : (parts[0] + args.new_string + parts.slice(1).join(args.old_string));
      if (next.length > 200000) return Promise.resolve({ ok: false, error: '拒绝：改完超过 200KB' });
      fs.writeFileSync(resolved, next, 'utf8');
      return Promise.resolve({ ok: true, result: '已编辑 ' + resolved + '（替换 ' + count + ' 处，' + text.length + ' → ' + next.length + ' 字符）' });
    }
    if (name === 'comfy_run') return comfyRunTool(args);
    return Promise.resolve({ ok: false, error: '未知工具 ' + name });
  } catch (err) {
    return Promise.resolve({ ok: false, error: String(err.message || err) });
  }
}

// 卧室状态（窗帘/灯）：存 pet_space/room-state.json，她也能用 read_file 读到；不走工具台账
const ROOM_STATE_FILE = path.join(PET_SPACE_DIR, 'room-state.json');
function roomStateLoad() {
  try { return JSON.parse(fs.readFileSync(ROOM_STATE_FILE, 'utf8')); } catch { return null; }
}
function roomStateSave(state) {
  fs.mkdirSync(PET_SPACE_DIR, { recursive: true });
  fs.writeFileSync(ROOM_STATE_FILE, JSON.stringify(state), 'utf8');
  return true;
}

function serveStatic(req, res) {
  try {
    if (req.url.startsWith('/api/')) {
      if (req.url.split('?')[0] === '/api/config') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ think: THINK_MODE, bedroom: Boolean(bedroomDisplay()) }));
        return;
      }
      if (req.url.split('?')[0] === '/api/room-state') {
        // 浏览器测试页走 HTTP 兜底（Electron 渲染层走 IPC）
        if (req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(roomStateLoad()));
          return;
        }
        if (req.method === 'POST') {
          const chunks = [];
          req.on('data', (c) => chunks.push(c));
          req.on('end', () => {
            try { roomStateSave(JSON.parse(Buffer.concat(chunks).toString('utf8'))); res.writeHead(204); }
            catch (e) { res.writeHead(500); res.end(String(e)); }
            res.end();
          });
          return;
        }
      }
      if (req.url.split('?')[0] === '/api/gpuutil') {
        gpuUtil().then((v) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(v === null ? 'null' : String(v));
        }).catch((e) => { res.writeHead(500); res.end(String(e)); });
        return;
      }
      if (req.url.split('?')[0] === '/api/memory-add' && req.method === 'POST') {
        // 语义记忆 HTTP 兜底（Electron 渲染层走 IPC）
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          let items = [];
          let mode;
          try { const p = JSON.parse(Buffer.concat(chunks).toString('utf8')); items = p.items; mode = p.mode; } catch {}
          const out = await memoryAdd(items, mode);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(out));
        });
        return;
      }
      if (req.url.split('?')[0] === '/api/memory-search' && req.method === 'POST') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          let query = '', mode, limit = 5;
          try { const p = JSON.parse(Buffer.concat(chunks).toString('utf8')); query = p.query; mode = p.mode; limit = p.limit; } catch {}
          const out = await memorySearch(query, mode, limit);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(out));
        });
        return;
      }
      if (req.url.split('?')[0] === '/api/fstool-tail') {
        const n = parseInt(new URL(req.url, 'http://x').searchParams.get('n') || '10', 10);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(fstoolTail(Number.isFinite(n) ? n : 10)));
        return;
      }
      if (req.url.split('?')[0] === '/api/screens') {
        desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 100, height: 100 } }).then((sources) => {
          const info = {
            displays: screen.getAllDisplays().map((d) => ({
              id: d.id,
              bounds: d.bounds,
              primary: d.id === screen.getPrimaryDisplay().id
            })),
            sources: sources.map((s, i) => ({
              index: i,
              id: s.id,
              name: s.name,
              display_id: s.display_id
            }))
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(info, null, 2));
        }).catch((e) => {
          res.writeHead(500);
          res.end(String(e));
        });
        return;
      }
      if (req.url.split('?')[0] === '/api/capture') {
        // 截图 HTTP 兜底（Electron 渲染层走 IPC）
        const urlParams = new URL(req.url, 'http://127.0.0.1').searchParams;
        const which = urlParams.get('which') || 'main';
        captureScreenBy(which).then((b64) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(b64 === null ? 'null' : b64);
        }).catch((e) => { res.writeHead(500); res.end(String(e)); });
        return;
      }
      if (req.url.split('?')[0] === '/api/history') {
        // 聊天历史 HTTP 兜底（Electron 渲染层走 IPC）；?mode=debug 用独立历史文件
        const mode = new URL(req.url, 'http://x').searchParams.get('mode');
        if (req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(historyLoad(mode)));
          return;
        }
        if (req.method === 'POST') {
          const chunks = [];
          req.on('data', (c) => chunks.push(c));
          req.on('end', () => {
            try { historySave(JSON.parse(Buffer.concat(chunks).toString('utf8')), mode); res.writeHead(204); }
            catch (e) { res.writeHead(500); res.end(String(e)); }
            res.end();
          });
          return;
        }
      }
      if (req.url.split('?')[0] === '/api/fstool' && req.method === 'POST') {
        // 浏览器测试页走 HTTP 兜底（Electron 渲染层走 IPC），执行器同一份
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          let call = {};
          try { call = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {}
          const out = await runFsTool(call);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(out));
        });
        return;
      }
      handleApi(req, res);
      return;
    }
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath === '/') urlPath = '/renderer/index.html';
    // /characters/* 映射到 player-ref/characters/*
    const rel = urlPath.startsWith('/characters/')
      ? path.join('player-ref', urlPath)
      : urlPath;
    const fsPath = path.join(APP_ROOT, rel);
    if (!path.normalize(fsPath).startsWith(APP_ROOT)) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    fs.readFile(fsPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found: ' + urlPath); return; }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(fsPath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache', // 桌宠开发期，改了代码立刻生效
      });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}

// 有副屏：桌宠+卧室整窗放副屏（她的房间），单屏单 DPI 上下文坐标干净，避开混合 DPI 跨屏错位；
// 无副屏：退回主屏当普通桌宠。不做跨屏拖动（混合缩放下单窗口跨屏是 Windows/Chromium 硬限制）。
function bedroomDisplay() {
  const primary = screen.getPrimaryDisplay();
  return screen.getAllDisplays().find((d) => d.id !== primary.id) || null;
}
function targetWorkArea() {
  return (bedroomDisplay() || screen.getPrimaryDisplay()).workArea;
}
// 所有屏 bounds 的并集：桌宠窗铺这么大的整块透明全屏，她在里面就能跨屏走
function unionBounds() {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const d of screen.getAllDisplays()) {
    const b = d.bounds;
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
  }
  if (!isFinite(x0)) return screen.getPrimaryDisplay().workArea;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}
// 临时测试开关：PET_ONLY_BEDROOM=1 时桌宠窗只铺副屏（卧室），用来对比跨屏窗对独显的占用
const PET_ONLY_BEDROOM = process.env.PET_ONLY_BEDROOM === '1';
function petArea() {
  return (PET_ONLY_BEDROOM && bedroomDisplay()) ? bedroomDisplay().workArea : unionBounds();
}

let petWin = null;
let bedroomWin = null;
let quitting = false;
app.on('before-quit', () => {
  quitting = true;
  stopGSV().catch(() => {});
  stopASR();
});
// 窗口生命周期落盘：万一再"找不到她"，能查是关了、崩了还是被顶到后面
function winLog(msg) {
  try {
    fs.mkdirSync(path.join(APP_ROOT, 'logs'), { recursive: true });
    fs.appendFileSync(path.join(APP_ROOT, 'logs', 'windows.log'), new Date().toISOString() + ' ' + msg + '\n');
  } catch {}
}
function baseWin(area, opts = {}) {
  const win = new BrowserWindow({
    x: area.x, y: area.y, width: area.width, height: area.height,
    transparent: true, frame: false, hasShadow: false, alwaysOnTop: opts.topmost !== false, skipTaskbar: true, resizable: false,
    focusable: opts.focusable !== false,
    webPreferences: {
      // 渲染层只访问本机静态服务与本地 API，无远程内容
      contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js'),
      // 窗口被系统判为遮挡/后台时不要节流 rAF 和定时器：否则拖动会“按得下但不跟手”
      backgroundThrottling: false,
    },
  });
  // 跨显示器并集的窗口在创建时会被 Chromium 夹到某块屏的工作区（实测 3520×1122 → 1920×1032），显式再设一次才按并集铺满
  win.setBounds(area);
  return win;
}
function createWindow(port) {            // 单窗旧行为：副屏整屋 / 主屏桌宠（SPLIT_WINDOWS=false 时）
  const win = baseWin(targetWorkArea());
  win.setIgnoreMouseEvents(!bedroomDisplay(), { forward: true });
  win.loadURL(`http://127.0.0.1:${port}/` + (process.env.PET_DEBUG ? '?debug=1' : ''));
  return win;
}
function createPetOverlay(port, area) {  // 双窗：桌宠窗（主屏全屏透明、穿透、只画她+聊天）
  const win = baseWin(area);
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadURL(`http://127.0.0.1:${port}/?role=pet` + (process.env.PET_DEBUG ? '&debug=1' : '') + (process.env.PET_AUTOWAKE ? '&autowake=1' : ''));
  return win;
}
function createBedroomWindow(port, area) { // 双窗：卧室窗（副屏整屋、锁死不动、不穿透以便点帘灯）
  // 可激活 + 不置顶：桌宠窗是置顶的，永远压在卧室窗上面，所以卧室窗被点也不会挡到她；
  // 之前用 focusable:false 防抢层，但实测这个组合下真实鼠标事件进不了页面（PostMessage 能点、真鼠标点不动）。
  const win = baseWin(area, { focusable: true, topmost: false });
  win.setIgnoreMouseEvents(false);
  win.loadURL(`http://127.0.0.1:${port}/renderer/room.html`);
  return win;
}
// 窗口意外消失的自愈：渲染崩了先 reload；整个窗被销毁（误关/系统原因）就重建，5 分钟内最多 3 次
const respawnTimes = { pet: [], bedroom: [] };
function wireLife(win, name, respawn) {
  winLog(name + ' created bounds=' + JSON.stringify(win.getBounds()));
  setTimeout(() => { try { winLog(name + ' bounds@1s=' + JSON.stringify(win.getBounds())); } catch {} }, 1000);
  win.webContents.on('render-process-gone', (e, d) => {
    winLog(name + ' render-process-gone ' + JSON.stringify(d));
    if (!quitting) { try { win.webContents.reload(); winLog(name + ' reloaded'); } catch (err) { winLog(name + ' reload FAIL ' + err.message); } }
  });
  win.on('unresponsive', () => winLog(name + ' unresponsive'));
  win.on('closed', () => {
    winLog(name + ' closed quitting=' + quitting);
    if (quitting || !respawn) return;
    const now = Date.now();
    respawnTimes[name] = respawnTimes[name].filter((t) => now - t < 300000);
    if (respawnTimes[name].length >= 3) { winLog(name + ' respawn skipped (rate limit)'); return; }
    respawnTimes[name].push(now);
    setTimeout(() => { if (!quitting) { try { respawn(); winLog(name + ' respawned'); } catch (e) { winLog(name + ' respawn FAIL ' + e.message); } } }, 400);
  });
}
// 跨屏透明窗的置顶会被系统悄悄清掉（Electron 重设会丢置顶，救不回）→ 起一个外部小守卫，掉了就用 Win32 补
let topmostGuard = null;
function startTopmostGuard() {
  if (topmostGuard) return;
  try {
    const ps1 = path.join(__dirname, 'topmost-guard.ps1');
    if (!fs.existsSync(ps1)) return;
    topmostGuard = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-PetPid', String(process.pid)], { windowsHide: true, stdio: 'ignore' });
    topmostGuard.on('error', () => { topmostGuard = null; });
    topmostGuard.on('exit', () => { topmostGuard = null; });
  } catch {}
}
// Windows 实测：跨屏透明窗一旦再次 setAlwaysOnTop/moveTop，置顶样式就会丢（设 true 也回不来）。
// 所以桌宠窗只在创建时置顶，之后永远不碰；卧室窗靠 focusable:false 防止点击抢层。
function spawnPetOverlay(port) {
  petWin = createPetOverlay(port, petArea());
  wireLife(petWin, 'pet', () => spawnPetOverlay(port));
  petWin.on('always-on-top-changed', (e, on) => winLog('pet alwaysOnTop=' + on));
  startTopmostGuard();
}
function spawnBedroom(port) {
  if (!bedroomDisplay()) return;
  bedroomWin = createBedroomWindow(port, bedroomDisplay().workArea);
  wireLife(bedroomWin, 'bedroom', () => {
    spawnBedroom(port);
    // 重建的卧室窗晚于桌宠窗创建、会压在她上面 → 把卧室降回普通层（只动卧室，不碰桌宠窗的置顶）
    try { bedroomWin.setAlwaysOnTop(false); } catch {}
  });
}

// 她改了 pet_space/room/ 下的文件 → 通知渲染层只重载房间 iframe（不用重启 app 就能看到新装修）
function maybeRoomChanged(call) {
  const name = (call && call.name) || '';
  if (!/^(file_tool|write_file|append_file|edit_file|copy_file|delete_file|resize_image)$/.test(name)) return;
  const a = (call && call.args) || {};
  const roomDir = path.resolve(PET_SPACE_DIR, 'room').toUpperCase();
  const cands = [a.path, a.dest_path, a.out_path].filter(Boolean).map((p) => path.resolve(String(p)).toUpperCase());
  if (!cands.some((p) => p === roomDir || p.startsWith(roomDir + path.sep))) return;
  try { const t = (SPLIT_WINDOWS && bedroomWin) ? bedroomWin : petWin; if (t) t.webContents.send('room-changed'); } catch {}
}

app.whenReady().then(() => {
  if (GSV_MODE === 'always') {
    ensureGSV().catch((e) => console.error('[gsv] 常驻启动失败:', e.message));
  }
  // 预热拉起 SenseVoice ASR（CPU 跑，~230MB 内存，0 显存，即点即用）
  ensureASR().catch((e) => console.error('[asr] 预拉起失败:', e.message));

  // 麦克风录音权限自动放行
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') return callback(true);
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true;
    return false;
  });

  console.error('[main] 启动 v3（debug 分历史 + 截屏工具）');
  // 只准 UI 层（含她的沙箱房间 iframe）访问本机：任何 http(s) 外发请求一律取消。
  // 她本来就能读任何文件（read_file 如此），但这一层发不出去——"别发出去"的硬闸。
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const u = details.url;
    if (!/^https?:/i.test(u)) return callback({});
    callback({ cancel: !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(u) });
  });
  // 渲染层根据光标位置动态切换穿透（悬停人物/输入框时关闭穿透以便点击拖拽）
  ipcMain.on('pet-click-through', (e, on) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) win.setIgnoreMouseEvents(!!on, { forward: true });
  });
  ipcMain.on('pet-quit', () => app.quit());

  // 全屏截图（所有显示器拼接，JPEG base64）：给"让她看屏幕"用
  ipcMain.handle('pet-capture', async () => captureNow());

  // 主卡 GPU 占用率（唤醒前置条件用）
  ipcMain.handle('gpu-util', () => gpuUtil());

  // 语义记忆：添加 / 检索
  ipcMain.handle('memory-add', (e, items, mode) => memoryAdd(items, mode));
  ipcMain.handle('memory-search', (e, query, mode, limit) => memorySearch(query, mode, limit));
  memoryBackfill().catch(() => {}); // 启动时若索引文件不存在，异步自动回填存量聊天记录

  // 工具调用台账尾部（注入她的上下文，防"没做却说做了"）
  ipcMain.handle('fstool-tail', (e, n = 10) => fstoolTail(n));

  // 无限唤醒心跳：供外部看门狗判断"进程活着但循环死了"（渲染层每 20s 写一次）
  ipcMain.handle('wake-beat', (e, s) => {
    try { fs.mkdirSync(PET_SPACE_DIR, { recursive: true }); fs.writeFileSync(path.join(PET_SPACE_DIR, '.wake-state.json'), JSON.stringify({ ts: Date.now(), infwake: !!(s && s.infwake), busy: !!(s && s.busy), ctx: Number(s && s.ctx) || 0 })); } catch {}
  });

  // 文件工具：读/列目录无限制，写仅限 pet_space 沙箱
  fs.mkdirSync(PET_SPACE_DIR, { recursive: true });
  ipcMain.handle('pet-fs-tool', async (e, call) => runFsTool(call));

  // 聊天历史：硬盘明文文件（正式/debug 分开）
  ipcMain.handle('history-load', (e, mode) => historyLoad(mode));
  ipcMain.handle('history-save', (e, arr, mode) => historySave(arr, mode));

  // 卧室状态：加载 / 保存
  // 每块屏的 bounds(DIP)+缩放+是否主屏，供渲染层做混合 DPI 补偿与"别跑到没屏的空档"
  ipcMain.handle('get-displays', () => { const P = screen.getPrimaryDisplay().id; return screen.getAllDisplays().map((d) => ({ bounds: d.bounds, scaleFactor: d.scaleFactor, isPrimary: d.id === P })); });
  // 该窗口在屏幕上的原点(DIP，可靠)，渲染层据此算"她此刻在哪块屏"
  ipcMain.handle('get-win-bounds', (e) => { const w = BrowserWindow.fromWebContents(e.sender); return w ? w.getBounds() : null; });

  ipcMain.handle('room-state-load', () => roomStateLoad());
  ipcMain.handle('room-state-save', (e, state) => roomStateSave(state));

  // 插拔副屏/改分辨率：重定位窗口（有副屏放副屏，否则主屏）并切换穿透，通知渲染层
  const onDisplaysChanged = () => {
    winLog('displays changed: ' + JSON.stringify(screen.getAllDisplays().map((d) => [d.id, d.bounds.x, d.bounds.y, d.bounds.width, d.bounds.height, d.scaleFactor])));
    if (petWin) {
      if (SPLIT_WINDOWS && bedroomDisplay()) {
        petWin.setBounds(petArea());
        petWin.setIgnoreMouseEvents(true, { forward: true });
      } else {
        petWin.setBounds(targetWorkArea());
        petWin.setIgnoreMouseEvents(!bedroomDisplay(), { forward: true });
      }
      petWin.webContents.send('displays-changed');
    }
    if (bedroomWin && bedroomDisplay()) {
      bedroomWin.setBounds(bedroomDisplay().workArea);
      bedroomWin.webContents.send('displays-changed');
    }
  };
  screen.on('display-added', onDisplaysChanged);
  screen.on('display-removed', onDisplaysChanged);
  screen.on('display-metrics-changed', onDisplaysChanged);

  const server = http.createServer(serveStatic);
  server.listen(PORT, '127.0.0.1', () => {
    if (SPLIT_WINDOWS && bedroomDisplay()) {
      spawnBedroom(PORT);              // 先建卧室窗（在下）
      spawnPetOverlay(PORT);           // 再建桌宠窗（主+副合成全屏，压在上）
    } else {
      petWin = createWindow(PORT);
      wireLife(petWin, 'pet', null);
    }
  });
  server.on('error', (e) => {
    console.error('静态服务启动失败（可能已有一个桌宠在跑）:', e.message);
    app.quit();
  });
});

app.on('window-all-closed', () => app.quit());
