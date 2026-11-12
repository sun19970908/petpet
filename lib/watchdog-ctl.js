// 看门狗启停唯一入口：main.js、apply-config.js 和命令行都走这里，不再依赖 .ps1/.bat 外壳
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'watchdog.js');
const PIDFILE = path.join(ROOT, 'logs', 'watchdog.pid');

// Electron 主进程里 process.execPath 是 electron.exe，需要另找 node.exe
function findNode() {
  if (process.env.PET_NODE && fs.existsSync(process.env.PET_NODE)) return process.env.PET_NODE;
  if (!process.versions.electron) return process.execPath;
  const candidates = [
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, 'nodejs', 'node.exe') : null,
    'D:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files\\nodejs\\node.exe',
  ].filter(Boolean);
  for (const p of candidates) if (fs.existsSync(p)) return p;
  try {
    const out = execSync('where node', { encoding: 'utf8' });
    const first = out.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
    if (first && fs.existsSync(first)) return first;
  } catch {}
  return 'node';
}

function readPid() {
  try {
    const pid = parseInt(fs.readFileSync(PIDFILE, 'utf8').trim(), 10);
    return Number.isFinite(pid) && pid > 0 ? pid : 0;
  } catch {
    return 0;
  }
}

function isAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function status() {
  const pid = readPid();
  if (!pid) return { running: false, pid: 0 };
  if (isAlive(pid)) return { running: true, pid };
  try { fs.unlinkSync(PIDFILE); } catch {}
  return { running: false, pid: 0 };
}

function start() {
  const st = status();
  if (st.running) return { ok: true, already: true, pid: st.pid };
  if (!fs.existsSync(SCRIPT)) return { ok: false, error: 'watchdog.js 不存在' };
  try {
    const node = findNode();
    const p = spawn(node, [SCRIPT], { detached: true, stdio: 'ignore', windowsHide: true, cwd: ROOT });
    p.unref();
    return { ok: true, already: false, pid: p.pid };
  } catch (e) {
    return { ok: false, error: e && e.message };
  }
}

function stop() {
  const st = status();
  if (!st.running) return { ok: true, stopped: false, pid: 0 };
  try { execSync('taskkill /PID ' + st.pid + ' /T /F', { stdio: 'ignore' }); } catch {}
  try { process.kill(st.pid); } catch {}
  try { fs.unlinkSync(PIDFILE); } catch {}
  return { ok: true, stopped: true, pid: st.pid };
}

module.exports = { status, start, stop, findNode, PIDFILE };

if (require.main === module) {
  const cmd = String(process.argv[2] || 'status').toLowerCase();
  const map = { start, stop, status };
  const fn = map[cmd];
  if (!fn) { console.log('用法: node lib/watchdog-ctl.js start|stop|status'); process.exit(1); }
  const r = fn();
  const text = cmd === 'status'
    ? (r.running ? `watchdog 运行中 (pid=${r.pid})` : 'watchdog 未运行')
    : (cmd === 'start'
      ? (r.ok ? (r.already ? `watchdog 已在运行 (pid=${r.pid})` : `watchdog 已启动 (pid=${r.pid})`) : `启动失败: ${r.error}`)
      : (r.stopped ? `watchdog 已停止 (pid=${r.pid})` : 'watchdog 未运行'));
  console.log(text);
  process.exit(r.ok === false ? 1 : 0);
}
