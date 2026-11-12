// 多 GPU 跨屏截屏 + 主卡 GPU 占用率查询
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function createScreenTools({ APP_ROOT, capMainCfg, capRoomCfg, getBedroomWin, screen, desktopCapturer, winLog }) {
  const SCREENCAP_EXE = path.join(APP_ROOT, 'tools', 'ScreenCap.exe');
  let capTmpSeq = 0;
  const inFlightCapture = {};

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
    if (targetDisplayId) {
      const byId = sources.find((s) => s.display_id && s.display_id === String(targetDisplayId));
      if (byId) return byId;
    }
    return sources[defaultIdx] || sources[0];
  }

  async function captureWithScreenCap(targetArg, which) {
    if (!fs.existsSync(SCREENCAP_EXE)) return null;
    const logDir = path.join(APP_ROOT, 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const tmpPath = path.join(logDir, `.tmp_cap_${which}_${process.pid}_${++capTmpSeq}.jpg`);
    const finalPath = path.join(logDir, `last_cap_${which}.jpg`);
    return new Promise((resolve) => {
      const p = spawn(SCREENCAP_EXE, ['cap', tmpPath, String(targetArg), '85'], { windowsHide: true });
      let stdout = '';
      let stderr = '';
      p.stdout.on('data', (d) => { stdout += d; });
      p.stderr.on('data', (d) => { stderr += d; });
      p.on('close', (code) => {
        if (code === 0 && fs.existsSync(tmpPath)) {
          try {
            const buf = fs.readFileSync(tmpPath);
            try { fs.writeFileSync(finalPath, buf); } catch {}
            try { fs.unlinkSync(tmpPath); } catch {}
            resolve({ ok: true, buffer: buf, stdout: stdout.trim() });
            return;
          } catch (e) {
            stderr += ' ' + e.message;
          }
        }
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
        resolve({ ok: false, code, stderr: stderr.trim() });
      });
      p.on('error', (err) => {
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
        resolve({ ok: false, error: err.message });
      });
    });
  }

  async function _doCaptureScreenBy(which) {
    const isRoom = which === 'room';
    const bedroomWin = getBedroomWin ? getBedroomWin() : null;
    if (isRoom && (!bedroomWin || bedroomWin.isDestroyed())) return null;

    const cfg = isRoom ? capRoomCfg : capMainCfg;
    const targetArg = cfg || (isRoom ? 'room' : 'main');

    // 1. 优先使用跨多 GPU 高可靠原生工具 ScreenCap
    try {
      const scRes = await captureWithScreenCap(targetArg, which);
      if (scRes && scRes.ok && scRes.buffer && scRes.buffer.length > 0) {
        winLog(`[cap] which=${which} engine=ScreenCap cfg="${cfg}" targetArg="${targetArg}" info="${scRes.stdout}" bytes=${scRes.buffer.length}`);
        return scRes.buffer.toString('base64');
      } else if (scRes) {
        winLog(`[cap:warn] ScreenCap failed code=${scRes.code} err="${scRes.stderr || scRes.error}", falling back to desktopCapturer`);
      }
    } catch (err) {
      winLog(`[cap:err] ScreenCap exception: ${err.message}, falling back to desktopCapturer`);
    }

    // 2. 回退机制：Electron desktopCapturer
    const primary = screen.getPrimaryDisplay();
    const all = screen.getAllDisplays();
    let target = primary;
    if (isRoom) {
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
    const defaultIdx = isRoom ? 0 : 1;
    const src = resolveCapSource(sources, cfg, defaultIdx, target.id);

    let jpegBuffer = null;
    if (src && src.thumbnail && !src.thumbnail.isEmpty()) {
      jpegBuffer = src.thumbnail.toJPEG(85);
    }

    const srcSummary = sources.map((s, i) => `[${i}]"${s.name}"(id=${s.id},disp=${s.display_id || 'none'},empty=${s.thumbnail.isEmpty()})`).join('; ');
    const dispSummary = all.map((d) => `(id=${d.id},bounds=${d.bounds.x},${d.bounds.y},${d.bounds.width}x${d.bounds.height},pri=${d.id === primary.id})`).join('; ');
    winLog(`[cap] which=${which} engine=desktopCapturer cfg="${cfg}" targetId=${target.id} picked=${src ? (src.name + ' ' + src.id) : 'null'} bytes=${jpegBuffer ? jpegBuffer.length : 0} | sources=${srcSummary} | displays=${dispSummary}`);

    if (jpegBuffer) {
      try {
        fs.writeFileSync(path.join(APP_ROOT, 'logs', `last_cap_${which}.jpg`), jpegBuffer);
      } catch {}
    }

    return jpegBuffer ? jpegBuffer.toString('base64') : null;
  }

  async function captureScreenBy(which) {
    if (inFlightCapture[which]) return inFlightCapture[which];
    inFlightCapture[which] = (async () => {
      try {
        return await _doCaptureScreenBy(which);
      } finally {
        inFlightCapture[which] = null;
      }
    })();
    return inFlightCapture[which];
  }

  async function captureNow() {
    return captureScreenBy('main');
  }

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

  async function getScreensInfo() {
    const getPhys = new Promise((resolve) => {
      if (!fs.existsSync(SCREENCAP_EXE)) return resolve([]);
      const p = spawn(SCREENCAP_EXE, ['list'], { windowsHide: true });
      let out = '';
      p.stdout.on('data', (d) => { out += d; });
      p.on('close', (code) => {
        if (code === 0) {
          try { resolve(JSON.parse(out.trim())); return; } catch {}
        }
        resolve([]);
      });
      p.on('error', () => resolve([]));
    });
    const [sources, phys] = await Promise.all([
      desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 100, height: 100 } }).catch(() => []),
      getPhys,
    ]);
    return {
      physicalScreens: phys,
      displays: screen.getAllDisplays().map((d) => ({
        id: d.id,
        bounds: d.bounds,
        primary: d.id === screen.getPrimaryDisplay().id,
      })),
      sources: sources.map((s, i) => ({
        index: i,
        id: s.id,
        name: s.name,
        display_id: s.display_id,
      })),
    };
  }

  return { captureScreenBy, captureNow, gpuUtil, getScreensInfo };
}

module.exports = { createScreenTools };
