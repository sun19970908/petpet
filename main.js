// DeepSeek 娘桌宠 - Electron 主进程（窗口、路由与各子模块装配）
// 全屏透明置顶窗：默认鼠标穿透（forward 模式），桌宠看得到全屏光标，
// livliv 自带的视线跟随/挑眉/微笑等原生互动全程生效
const { app, BrowserWindow, screen, ipcMain, desktopCapturer, nativeImage, session } = require('electron');
const fs = require('fs');
const path = require('path');
const { appendLine, createRotatingStream, readLastLines } = require('./lib/logger');
const { createVoiceAndApi } = require('./main/voice');
const { createLlmConfigManager } = require('./main/llm-config');
const { createLlmProxy } = require('./main/llm-proxy');
const { createScreenTools } = require('./main/screen');
const { createStorage } = require('./main/storage');
const { createFsTools } = require('./main/fs-tools');
const { createHttpServer } = require('./main/http-server');
const { createWindowManager } = require('./main/windows');
const watchdogCtl = require('./lib/watchdog-ctl');
const { loadConfig, loadTtsConfig } = require('./lib/config-store');

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
const PET_SPACE_DIR = path.join(APP_ROOT, 'pet_space');

// GPU 策略：在多 GPU（如 AMD 核显 + NVIDIA 独显）跨卡多显环境下，必须启用独显上下文并首选高性能 GPU，
// 否则 Chromium 软件合成器或核显模式无法通过 DXGI / WGC 抓取接在独显上的主屏。
// config.json 的 hwCompositing=false 可退回软件合成（占用 CPU、GPU 基本为 0）。
const BOOT_CONFIG = loadConfig(APP_ROOT);
const PORT = Number(BOOT_CONFIG.serverPort) || 12400;
const SPLIT_WINDOWS = BOOT_CONFIG.splitWindows !== false;
const BOOT_TTS_CONFIG = loadTtsConfig(APP_ROOT);
if (BOOT_CONFIG.hwCompositing === false) {
  app.commandLine.appendSwitch('disable-gpu-compositing');
} else {
  app.commandLine.appendSwitch('gpu-preference', '2');
  app.commandLine.appendSwitch('force_high_performance_gpu');
}
app.commandLine.appendSwitch('enable-features', 'WebRtcAllowWgcScreenCapturer');

// ===== 启动参数解析（只保留 debug；--no-infwake 由看门狗内部重启时使用） =====
let cliNoInfwake = false;
for (const arg of process.argv.slice(1)) {
  if (!arg || arg === '.' || arg.endsWith('electron.exe') || arg.endsWith('main.js')) continue;
  if (arg === '--no-infwake') cliNoInfwake = true;
  else if (arg === 'debug' || arg === '--debug') process.env.PET_DEBUG = '1';
}

// 截屏认屏：config.json 的 capMain/capRoom
const CAP_MAIN_CFG = BOOT_CONFIG.capMain ?? 'main';
const CAP_ROOM_CFG = BOOT_CONFIG.capRoom ?? 'room';

function winLog(msg) {
  appendLine(path.join(APP_ROOT, 'logs', 'windows.log'), msg, { maxBytes: 2 * 1024 * 1024 });
}

// ===== 子模块装配 =====
const {
  getConfig, getInfwakeCutoff, getInfwakePhaseId, historyLoad, historySave,
  memoryAdd, memorySearch, memoryBackfill, roomStateLoad, roomStateSave, fstoolTail,
} = createStorage({ APP_ROOT, PET_SPACE_DIR, readLastLines });

const windows = createWindowManager({
  APP_ROOT,
  winLog,
  getConfig,
  getNoInfwake: () => cliNoInfwake,
  getSplitWindows: () => SPLIT_WINDOWS,
});

const normalizeGsvMode = (v) => {
  const m = String(v || 'auto').toLowerCase().trim();
  if (['always', 'on', 'true', '1'].includes(m)) return 'always';
  if (['never', 'off', 'none', 'false', '0'].includes(m)) return 'never';
  return 'auto';
};

const getGsvMode = () => normalizeGsvMode(loadConfig(APP_ROOT).ttsMode);

const getGsvModeLabel = () => {
  const m = getGsvMode();
  return m === 'always' ? 'on' : m === 'never' ? 'off' : 'auto';
};

const getGsvIdleTimeoutMs = () => loadTtsConfig(APP_ROOT).app.idleSeconds * 1000;

const { ensureGSV, stopGSV, ensureASR, stopASR, onLlmActivity, handleApi } = createVoiceAndApi({
  APP_ROOT, GSV_MODE: getGsvMode(), getGsvMode, GSV_IDLE_TIMEOUT: getGsvIdleTimeoutMs(), getGsvIdleTimeoutMs,
  ttsServer: BOOT_TTS_CONFIG.app.server,
  asrConfig: { python: BOOT_CONFIG.asrPython, modelDir: BOOT_CONFIG.asrModelDir, port: BOOT_CONFIG.asrPort },
  appendLine, createRotatingStream,
});

const llmConfigMgr = createLlmConfigManager({
  APP_ROOT,
  getConfig,
  envNoTail: process.env.PET_THINK === 'off',
});
const llmProxy = createLlmProxy({
  getServerConfig: () => llmConfigMgr.getServerConfig(),
  logError: (m) => console.error(m),
});

const { captureScreenBy, captureNow, gpuUtil, getScreensInfo } = createScreenTools({
  APP_ROOT, capMainCfg: CAP_MAIN_CFG, capRoomCfg: CAP_ROOM_CFG, getBedroomWin: () => windows.bedroomWin, screen, desktopCapturer, winLog,
});

function maybeRoomChanged(call) {
  const name = (call && call.name) || '';
  if (!/^(file_tool|write_file|append_file|edit_file|copy_file|delete_file|resize_image)$/.test(name)) return;
  const a = (call && call.args) || {};
  const roomDir = path.resolve(PET_SPACE_DIR, 'room').toUpperCase();
  const cands = [a.path, a.dest_path, a.out_path].filter(Boolean).map((p) => path.resolve(String(p)).toUpperCase());
  if (!cands.some((p) => p === roomDir || p.startsWith(roomDir + path.sep))) return;
  try {
    const t = (SPLIT_WINDOWS && windows.bedroomWin && !windows.bedroomWin.isDestroyed()) ? windows.bedroomWin : windows.petWin;
    if (!t || t.isDestroyed()) return;
    if (t === windows.bedroomWin) {
      if (t.isMinimized()) t.restore();
      if (!t.isVisible()) t.showInactive();
    }
    t.webContents.send('room-changed');
    if (t === windows.bedroomWin) t.webContents.invalidate();
  } catch {}
}

const { runFsTool } = createFsTools({
  APP_ROOT, PET_SPACE_DIR, nativeImage, captureNow, captureScreenBy, appendLine, onRoomChanged: maybeRoomChanged,
  comfyHost: BOOT_CONFIG.comfyHost, comfyPort: BOOT_CONFIG.comfyPort, comfyInputDir: BOOT_CONFIG.comfyInputDir,
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

// ===== 窗口管理、显示器与跨屏置顶守卫已抽至 main/windows.js =====

app.on('before-quit', () => {
  windows.beginQuit();
  stopGSV().catch(() => {});
  stopASR();
});

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
    if (windows.petWin && !windows.petWin.isDestroyed()) windows.petWin.webContents.send('pet-recenter');
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

  windows.bindDisplayEvents();

  const server = createHttpServer({
    APP_ROOT,
    llmConfigMgr,
    getConfig,
    getInfwakeCutoff,
    getInfwakePhaseId,
    getGsvModeLabel,
    getGsvIdleTimeoutMs,
    bedroomDisplay: windows.bedroomDisplay,
    getPetWin: () => windows.petWin,
    roomStateLoad,
    roomStateSave,
    gpuUtil,
    memoryAdd,
    memorySearch,
    fstoolTail,
    getScreensInfo,
    captureScreenBy,
    historyLoad,
    historySave,
    runFsTool,
    onLlmActivity,
    llmProxy,
    handleApi,
  });
  server.listen(PORT, '127.0.0.1', () => {
    if (SPLIT_WINDOWS && windows.bedroomDisplay()) {
      windows.spawnBedroom(PORT);
      windows.spawnPetOverlay(PORT);
    } else {
      windows.spawnMainWindow(PORT);
    }
  });
  server.on('error', (e) => {
    console.error('静态服务启动失败（可能已有一个桌宠在跑）:', e.message);
    app.quit();
  });
});

app.on('window-all-closed', () => app.quit());
