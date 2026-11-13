// DeepSeek 娘桌宠 - Electron 主进程（窗口、路由与各子模块装配）
// 全屏透明置顶窗：默认鼠标穿透（forward 模式），桌宠看得到全屏光标，
// livliv 自带的视线跟随/挑眉/微笑等原生互动全程生效
const { app, BrowserWindow, screen, ipcMain, desktopCapturer, nativeImage, session } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { appendLine, createRotatingStream, readLastLines } = require('./lib/logger');
const { createVoiceAndApi } = require('./main/voice');
const { createLlmConfigManager } = require('./main/llm-config');
const { createLlmProxy } = require('./main/llm-proxy');
const { createScreenTools } = require('./main/screen');
const { createStorage } = require('./main/storage');
const { createFsTools } = require('./main/fs-tools');
const watchdogCtl = require('./lib/watchdog-ctl');

// 防护 Windows 下脱钩控制台/管道关闭时 console.log / pipe 触发的 EPIPE/EOF 未捕获异常弹窗
if (process.stdout && typeof process.stdout.on === 'function') process.stdout.on('error', () => {});
if (process.stderr && typeof process.stderr.on === 'function') process.stderr.on('error', () => {});
process.on('uncaughtException', (err) => {
  const code = err && err.code;
  const msg = (err && (err.stack || err.message)) || String(err);
  appendLine(path.join(__dirname, 'logs', 'main-err.log'), `[uncaughtException] code=${code || 'none'} ${msg}`, { maxBytes: 2 * 1024 * 1024 });
  if (code === 'EOF' || code === 'EPIPE' || code === 'ECONNRESET' || code === 'ERR_STREAM_DESTROYED' || code === 'ERR_STREAM_WRITE_AFTER_END') {
    return;
  }
});
process.on('unhandledRejection', (reason) => {
  const msg = (reason && (reason.stack || reason.message)) || String(reason);
  appendLine(path.join(__dirname, 'logs', 'main-err.log'), `[unhandledRejection] ${msg}`, { maxBytes: 2 * 1024 * 1024 });
});

const APP_ROOT = __dirname;
const PET_SPACE_DIR = 'G:\\AI\\livliv-pet\\pet_space';
const PORT = 12400;
const SPLIT_WINDOWS = true;   // 双窗：卧室独立窗(锁副屏，不动) + 桌宠窗(主屏)。设 false 回退单窗旧行为

// GPU 策略：在多 GPU（如 AMD 核显 + NVIDIA 独显）跨卡多显环境下，必须启用独显上下文并首选高性能 GPU，
// 否则 Chromium 软件合成器或核显模式无法通过 DXGI / WGC 抓取接在独显上的主屏。
if (process.env.PET_HW_COMPOSITING === '0') {
  app.commandLine.appendSwitch('disable-gpu-compositing');
} else {
  app.commandLine.appendSwitch('gpu-preference', '2');
  app.commandLine.appendSwitch('force_high_performance_gpu');
}
app.commandLine.appendSwitch('enable-features', 'WebRtcAllowWgcScreenCapturer');

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

// ===== CLI 参数与环境变量解析 =====
let cliGsvMode = null;
let cliGsvIdle = null;
let cliCapMain = null;
let cliCapRoom = null;
let cliNoInfwake = false;
let cliLlmProfile = null;
let cliThinkMode = null;
for (const arg of process.argv.slice(1)) {
  if (!arg || arg === '.' || arg.endsWith('electron.exe') || arg.endsWith('main.js')) continue;
  if (arg.startsWith('--gsv-mode=')) cliGsvMode = arg.slice(11);
  else if (arg.startsWith('--gsv-idle=')) cliGsvIdle = arg.slice(11);
  else if (arg.startsWith('--cap-main=')) cliCapMain = arg.slice(11);
  else if (arg.startsWith('--cap-room=')) cliCapRoom = arg.slice(11);
  else if (arg.startsWith('--llm=')) cliLlmProfile = arg.slice(6);
  else if (arg.startsWith('--think=')) cliThinkMode = arg.slice(8);
  else if (arg === '--no-infwake') cliNoInfwake = true;
  else if (arg === 'debug' || arg === '--debug') process.env.PET_DEBUG = '1';
  else if (['auto', 'always', 'on', 'never', 'off'].includes(arg.toLowerCase())) cliGsvMode = arg;
  else if (/^\d+$/.test(arg)) cliGsvIdle = arg;
}

const CAP_MAIN_CFG = cliCapMain ?? process.env.PET_CAP_MAIN ?? 'main';
const CAP_ROOM_CFG = cliCapRoom ?? process.env.PET_CAP_ROOM ?? 'room';

let petWin = null;
let bedroomWin = null;
let quitting = false;

function winLog(msg) {
  appendLine(path.join(APP_ROOT, 'logs', 'windows.log'), msg, { maxBytes: 2 * 1024 * 1024 });
}

// ===== 子模块装配 =====
const {
  getConfig, getInfwakeCutoff, getInfwakePhaseId, historyLoad, historySave,
  memoryAdd, memorySearch, memoryBackfill, roomStateLoad, roomStateSave, fstoolTail,
} = createStorage({ APP_ROOT, PET_SPACE_DIR, readLastLines });

const normalizeGsvMode = (v) => {
  const m = String(v || 'auto').toLowerCase().trim();
  if (['always', 'on', 'true', '1'].includes(m)) return 'always';
  if (['never', 'off', 'none', 'false', '0'].includes(m)) return 'never';
  return 'auto';
};

const getGsvMode = () => {
  const cfg = getConfig();
  const raw = cliGsvMode ?? process.env.PET_GSV_MODE ?? cfg.ttsMode ?? cfg.gsvMode ?? 'auto';
  return normalizeGsvMode(raw);
};

const getGsvModeLabel = () => {
  const m = getGsvMode();
  return m === 'always' ? 'on' : m === 'never' ? 'off' : 'auto';
};

const getGsvIdleTimeoutMs = () => {
  const cfg = getConfig();
  const raw = cliGsvIdle ?? process.env.PET_GSV_IDLE ?? cfg.ttsIdleSeconds ?? cfg.gsvIdleSeconds;
  const sec = parseInt(raw, 10);
  return (Number.isFinite(sec) && sec > 0 ? sec : 600) * 1000;
};

const { ensureGSV, stopGSV, ensureASR, stopASR, onLlmActivity, handleApi } = createVoiceAndApi({
  APP_ROOT, GSV_MODE: getGsvMode(), getGsvMode, GSV_IDLE_TIMEOUT: getGsvIdleTimeoutMs(), getGsvIdleTimeoutMs, appendLine, createRotatingStream,
});

const llmConfigMgr = createLlmConfigManager({
  APP_ROOT,
  getConfig,
  cliProfile: cliLlmProfile,
  envThinkMode: cliThinkMode || (process.env.PET_THINK === 'off' ? 'off' : null),
});
const llmProxy = createLlmProxy({
  getServerConfig: () => llmConfigMgr.getServerConfig(),
  logError: (m) => console.error(m),
});

const { captureScreenBy, captureNow, gpuUtil, getScreensInfo } = createScreenTools({
  APP_ROOT, capMainCfg: CAP_MAIN_CFG, capRoomCfg: CAP_ROOM_CFG, getBedroomWin: () => bedroomWin, screen, desktopCapturer, winLog,
});

function maybeRoomChanged(call) {
  const name = (call && call.name) || '';
  if (!/^(file_tool|write_file|append_file|edit_file|copy_file|delete_file|resize_image)$/.test(name)) return;
  const a = (call && call.args) || {};
  const roomDir = path.resolve(PET_SPACE_DIR, 'room').toUpperCase();
  const cands = [a.path, a.dest_path, a.out_path].filter(Boolean).map((p) => path.resolve(String(p)).toUpperCase());
  if (!cands.some((p) => p === roomDir || p.startsWith(roomDir + path.sep))) return;
  try {
    const t = (SPLIT_WINDOWS && bedroomWin && !bedroomWin.isDestroyed()) ? bedroomWin : petWin;
    if (!t || t.isDestroyed()) return;
    if (t === bedroomWin) {
      if (t.isMinimized()) t.restore();
      if (!t.isVisible()) t.showInactive();
    }
    t.webContents.send('room-changed');
    if (t === bedroomWin) t.webContents.invalidate();
  } catch {}
}

const { runFsTool } = createFsTools({
  APP_ROOT, PET_SPACE_DIR, nativeImage, captureNow, captureScreenBy, appendLine, onRoomChanged: maybeRoomChanged,
});

// ===== 看门狗同步策略（根据 config.json 中的 watchdog 配置） =====
function stopWatchdogSync() {
  try {
    const r = watchdogCtl.stop();
    console.log(r.stopped
      ? '[watchdog] 已根据配置 watchdog=false/off 关闭看门狗 (pid=' + r.pid + ')'
      : '[watchdog] 配置为关闭，看门狗本来就没在运行');
  } catch (e) {
    console.error('[watchdog] 关闭看门狗异常:', e.message);
  }
}

function startWatchdogSync() {
  try {
    const r = watchdogCtl.start();
    if (!r.ok) {
      console.log('[watchdog] 启动失败: ' + r.error);
      return;
    }
    console.log(r.already
      ? '[watchdog] 看门狗已在运行 (pid=' + r.pid + ')'
      : '[watchdog] 已根据配置 watchdog=true/on 启动看门狗 (pid=' + r.pid + ')');
  } catch (e) {
    console.error('[watchdog] 启动看门狗异常:', e.message);
  }
}

function applyWatchdogPolicy() {
  const cfg = getConfig();
  const w = cfg.watchdog;
  if (w === false || w === 'off' || w === 'never' || w === 'false') {
    stopWatchdogSync();
  } else if (w === true || w === 'on' || w === 'always' || w === 'true') {
    startWatchdogSync();
  }
}

// ===== 本地 HTTP 静态资源 + API 兜底路由 =====
function serveStatic(req, res) {
  try {
    if (req.url.startsWith('/api/')) {
      const apiPath = req.url.split('?')[0];
      if (apiPath === '/api/config') {
        const publicLlm = llmConfigMgr.getPublicConfig();
        const cfg = getConfig();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          think: publicLlm.promptPolicy?.thinkMode || THINK_MODE,
          bedroom: Boolean(bedroomDisplay()),
          infwakeCutoff: getInfwakeCutoff().str,
          infwakePhase: getInfwakePhaseId(),
          ttsMode: getGsvModeLabel(),
          gsvMode: getGsvModeLabel(),
          gsvIdleSeconds: Math.round(getGsvIdleTimeoutMs() / 1000),
          ttsIdleSeconds: Math.round(getGsvIdleTimeoutMs() / 1000),
          watchdog: cfg.watchdog ?? false,
          llmProfile: publicLlm.activeProfile,
          llm: publicLlm,
        }));
        return;
      }
      if (apiPath === '/api/infwake/stop' && req.method === 'POST') {
        let sent = false;
        try {
          if (petWin && !petWin.isDestroyed()) {
            petWin.webContents.send('stop-infwake');
            sent = true;
          }
        } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sent }));
        return;
      }
      if (apiPath === '/api/room-state') {
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
      if (apiPath === '/api/gpuutil') {
        gpuUtil().then((v) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(v === null ? 'null' : String(v));
        }).catch((e) => { res.writeHead(500); res.end(String(e)); });
        return;
      }
      if (apiPath === '/api/memory-add' && req.method === 'POST') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          let items = [], mode;
          try { const p = JSON.parse(Buffer.concat(chunks).toString('utf8')); items = p.items; mode = p.mode; } catch {}
          const out = await memoryAdd(items, mode);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(out));
        });
        return;
      }
      if (apiPath === '/api/memory-search' && req.method === 'POST') {
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
      if (apiPath === '/api/fstool-tail') {
        const n = parseInt(new URL(req.url, 'http://x').searchParams.get('n') || '10', 10);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(fstoolTail(Number.isFinite(n) ? n : 10)));
        return;
      }
      if (apiPath === '/api/screens') {
        getScreensInfo().then((info) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(info, null, 2));
        }).catch((e) => { res.writeHead(500); res.end(String(e)); });
        return;
      }
      if (apiPath === '/api/capture') {
        const which = new URL(req.url, 'http://127.0.0.1').searchParams.get('which') || 'main';
        captureScreenBy(which).then((b64) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(b64 === null ? 'null' : b64);
        }).catch((e) => { res.writeHead(500); res.end(String(e)); });
        return;
      }
      if (apiPath === '/api/history') {
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
      if (apiPath === '/api/fstool' && req.method === 'POST') {
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
      if (apiPath === '/api/llm') {
        onLlmActivity();
        llmProxy.handleLlmRequest(req, res);
        return;
      }
      handleApi(req, res);
      return;
    }

    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath === '/') urlPath = '/renderer/index.html';
    const rel = urlPath.startsWith('/characters/') ? path.join('player-ref', urlPath) : urlPath;
    const fsPath = path.join(APP_ROOT, rel);
    if (!path.normalize(fsPath).startsWith(APP_ROOT)) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    fs.readFile(fsPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found: ' + urlPath); return; }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(fsPath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}

// ===== 窗口管理、显示器与跨屏置顶守卫 =====
function bedroomDisplay() {
  const primary = screen.getPrimaryDisplay();
  return screen.getAllDisplays().find((d) => d.id !== primary.id) || null;
}
function targetWorkArea() {
  return (bedroomDisplay() || screen.getPrimaryDisplay()).workArea;
}
function unionBounds() {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const d of screen.getAllDisplays()) {
    const b = d.bounds;
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
  }
  if (!isFinite(x0)) return screen.getPrimaryDisplay().workArea;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}
const PET_ONLY_BEDROOM = process.env.PET_ONLY_BEDROOM === '1';
function petArea() {
  return (PET_ONLY_BEDROOM && bedroomDisplay()) ? bedroomDisplay().workArea : unionBounds();
}

app.on('before-quit', () => {
  quitting = true;
  stopGSV().catch(() => {});
  stopASR();
});

function baseWin(area, opts = {}) {
  const win = new BrowserWindow({
    x: area.x, y: area.y, width: area.width, height: area.height,
    transparent: opts.transparent !== false, frame: false, hasShadow: false, alwaysOnTop: opts.topmost !== false, skipTaskbar: true, resizable: false,
    focusable: opts.focusable !== false,
    ...(opts.backgroundColor ? { backgroundColor: opts.backgroundColor } : {}),
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
    },
  });
  win.setBounds(area);
  return win;
}
function createWindow(port) {
  const win = baseWin(targetWorkArea());
  win.setIgnoreMouseEvents(!bedroomDisplay(), { forward: true });
  const qs = [];
  if (process.env.PET_DEBUG) qs.push('debug=1');
  if (cliNoInfwake) qs.push('noinfwake=1');
  win.loadURL(`http://127.0.0.1:${port}/` + (qs.length ? '?' + qs.join('&') : ''));
  return win;
}
function createPetOverlay(port, area) {
  const win = baseWin(area);
  win.setIgnoreMouseEvents(true, { forward: true });
  const qs = ['role=pet'];
  if (process.env.PET_DEBUG) qs.push('debug=1');
  if (process.env.PET_AUTOWAKE) qs.push('autowake=' + encodeURIComponent(process.env.PET_AUTOWAKE_TEXT || '1'));
  if (cliNoInfwake) qs.push('noinfwake=1');
  win.loadURL(`http://127.0.0.1:${port}/?` + qs.join('&'));
  return win;
}
function createBedroomWindow(port, area) {
  const win = baseWin(area, { focusable: true, topmost: false, transparent: false, backgroundColor: '#0e1628' });
  win.setIgnoreMouseEvents(false);
  win.loadURL(`http://127.0.0.1:${port}/renderer/room.html`);
  return win;
}

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
    try { bedroomWin.setAlwaysOnTop(false); } catch {}
  });
  bedroomWin.on('minimize', () => {
    winLog('bedroom minimized -> restore');
    try { bedroomWin.restore(); } catch {}
  });
}

// ===== 应用初始化与 IPC 绑定 =====
app.whenReady().then(() => {
  applyWatchdogPolicy();
  if (getGsvMode() === 'always') {
    ensureGSV().catch((e) => console.error('[gsv] 常驻启动失败:', e.message));
  }
  ensureASR().catch((e) => console.error('[asr] 预拉起失败:', e.message));

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media');
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => permission === 'media');

  console.error('[main] 启动 v3（debug 分历史 + 截屏工具）');
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const u = details.url;
    if (!/^https?:/i.test(u)) return callback({});
    callback({ cancel: !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(u) });
  });

  ipcMain.on('pet-click-through', (e, on) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) win.setIgnoreMouseEvents(!!on, { forward: true });
  });
  // 卧室里的铃铛：卧室窗只负责转发，真正走动的是桌宠窗
  ipcMain.on('pet-recenter', () => {
    if (petWin && !petWin.isDestroyed()) petWin.webContents.send('pet-recenter');
  });
  ipcMain.on('room-reloaded', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win && !win.isDestroyed()) {
      try { win.webContents.invalidate(); } catch {}
    }
  });
  ipcMain.on('pet-quit', () => app.quit());

  ipcMain.handle('pet-capture', async () => captureNow());
  ipcMain.handle('gpu-util', () => gpuUtil());

  ipcMain.handle('memory-add', (e, items, mode) => memoryAdd(items, mode));
  ipcMain.handle('memory-search', (e, query, mode, limit) => memorySearch(query, mode, limit));
  memoryBackfill().catch(() => {});

  ipcMain.handle('fstool-tail', (e, n = 10) => fstoolTail(n));

  ipcMain.handle('wake-beat', (e, s) => {
    try {
      fs.mkdirSync(PET_SPACE_DIR, { recursive: true });
      fs.writeFileSync(path.join(PET_SPACE_DIR, '.wake-state.json'), JSON.stringify({
        ts: Date.now(),
        infwake: !!(s && s.infwake),
        busy: !!(s && s.busy),
        ctx: Number(s && s.ctx) || 0,
        turnSeq: Number(s && s.turnSeq) || 0,
        lastActivityTs: Number(s && s.lastActivityTs) || 0,
      }));
    } catch {}
  });

  fs.mkdirSync(PET_SPACE_DIR, { recursive: true });
  ipcMain.handle('pet-fs-tool', async (e, call) => runFsTool(call));
  ipcMain.handle('history-load', (e, mode) => historyLoad(mode));
  ipcMain.handle('history-save', (e, arr, mode) => historySave(arr, mode));

  ipcMain.handle('get-displays', () => {
    const P = screen.getPrimaryDisplay().id;
    return screen.getAllDisplays().map((d) => ({ bounds: d.bounds, scaleFactor: d.scaleFactor, isPrimary: d.id === P }));
  });
  ipcMain.handle('get-win-bounds', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender);
    return w ? w.getBounds() : null;
  });
  ipcMain.handle('room-state-load', () => roomStateLoad());
  ipcMain.handle('room-state-save', (e, state) => roomStateSave(state));

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
      spawnBedroom(PORT);
      spawnPetOverlay(PORT);
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
