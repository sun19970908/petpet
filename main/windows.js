// 窗口生命周期、副屏卧室、跨屏置顶守卫
const { BrowserWindow, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function createWindowManager({ APP_ROOT, winLog, getConfig, getNoInfwake, getSplitWindows }) {
  let petWin = null;
  let bedroomWin = null;
  let quitting = false;
  let topmostGuard = null;
  const respawnTimes = { pet: [], bedroom: [] };

  function bedroomDisplay() {
    if (getConfig().hasBedroom === false) return null;
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
  function petArea() {
    if (getConfig().petOnlyBedroom === true) {
      const bedroom = bedroomDisplay();
      if (bedroom) return bedroom.workArea;
    }
    return unionBounds();
  }

  function baseWin(area, opts = {}) {
    const win = new BrowserWindow({
      x: area.x, y: area.y, width: area.width, height: area.height,
      transparent: opts.transparent !== false, frame: false, hasShadow: false, alwaysOnTop: opts.topmost !== false, skipTaskbar: true, resizable: false,
      focusable: opts.focusable !== false,
      ...(opts.backgroundColor ? { backgroundColor: opts.backgroundColor } : {}),
      webPreferences: {
        contextIsolation: true, nodeIntegration: false, preload: path.join(APP_ROOT, 'preload.js'),
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
    if (getNoInfwake()) qs.push('noinfwake=1');
    win.loadURL(`http://127.0.0.1:${port}/` + (qs.length ? '?' + qs.join('&') : ''));
    return win;
  }
  function createPetOverlay(port, area) {
    const win = baseWin(area);
    win.setIgnoreMouseEvents(true, { forward: true });
    const qs = ['role=pet'];
    if (process.env.PET_DEBUG) qs.push('debug=1');
    if (process.env.PET_AUTOWAKE) qs.push('autowake=' + encodeURIComponent(process.env.PET_AUTOWAKE_TEXT || '1'));
    if (getNoInfwake()) qs.push('noinfwake=1');
    win.loadURL(`http://127.0.0.1:${port}/?` + qs.join('&'));
    return win;
  }
  function createBedroomWindow(port, area) {
    const win = baseWin(area, { focusable: true, topmost: false, transparent: false, backgroundColor: '#0e1628' });
    win.setIgnoreMouseEvents(false);
    win.loadURL(`http://127.0.0.1:${port}/renderer/room.html`);
    return win;
  }

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

  function startTopmostGuard() {
    if (topmostGuard) return;
    try {
      const ps1 = path.join(APP_ROOT, 'topmost-guard.ps1');
      if (!fs.existsSync(ps1)) return;
      topmostGuard = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-PetPid', String(process.pid)], { windowsHide: true, stdio: 'ignore' });
      topmostGuard.on('error', () => { topmostGuard = null; });
      topmostGuard.on('exit', () => { topmostGuard = null; });
    } catch {}
  }

  function spawnMainWindow(port) {
    petWin = createWindow(port);
    wireLife(petWin, 'pet', null);
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

  function onDisplaysChanged() {
    winLog('displays changed: ' + JSON.stringify(screen.getAllDisplays().map((d) => [d.id, d.bounds.x, d.bounds.y, d.bounds.width, d.bounds.height, d.scaleFactor])));
    if (petWin) {
      if (getSplitWindows() && bedroomDisplay()) {
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
  }

  function bindDisplayEvents() {
    screen.on('display-added', onDisplaysChanged);
    screen.on('display-removed', onDisplaysChanged);
    screen.on('display-metrics-changed', onDisplaysChanged);
  }

  function beginQuit() { quitting = true; }

  return {
    get petWin() { return petWin; },
    get bedroomWin() { return bedroomWin; },
    get quitting() { return quitting; },
    bedroomDisplay,
    targetWorkArea,
    petArea,
    spawnMainWindow,
    spawnPetOverlay,
    spawnBedroom,
    bindDisplayEvents,
    beginQuit,
  };
}

module.exports = { createWindowManager };
