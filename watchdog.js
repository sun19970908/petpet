// 桌宠看门狗：保活 + 无限唤醒中止检测。常驻用法：node watchdog.js（detached 启动，不注册自启，重启电脑即停）
// 每 30s：
//   - 探 127.0.0.1:12400；不在线 → 重拉 start-pet.bat（1 小时最多 5 次，防连环崩）
//   - 在线但 .wake-state.json 显示"无限唤醒开着、心跳却停了 >180s"（renderer 卡死）→ 杀掉重拉（重启后自动恢复无限唤醒）
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, execSync } = require('child_process');
const ROOT = __dirname;
const STATE = path.join(ROOT, 'pet_space', '.wake-state.json');
const LOG = path.join(ROOT, 'logs', 'watchdog.log');
const PETBAT = path.join(ROOT, 'start-pet.bat');

function log(m) { const s = new Date().toISOString() + ' ' + m; try { fs.appendFileSync(LOG, s + '\n'); } catch {} console.log(s); }
function probe(cb) {
  const req = http.get({ host: '127.0.0.1', port: 12400, path: '/', timeout: 4000 }, (r) => { r.resume(); cb(r.statusCode === 200); });
  req.on('error', () => cb(false));
  req.on('timeout', () => { req.destroy(); cb(false); });
}
function petPid() {
  try {
    const out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
    const line = out.split(/\r?\n/).find((l) => /:12400\b/.test(l) && /LISTEN/i.test(l));
    if (line) { const p = line.trim().split(/\s+/); return p[p.length - 1]; }
  } catch {}
  return null;
}
let restarts = [], lastLaunch = 0, busySince = 0;
function canRestart() { const n = Date.now(); restarts = restarts.filter((t) => n - t < 3600000); return restarts.length < 5; }
function launchPet(why) {
  if (!canRestart()) { log('需要重启但 1 小时内已 5 次，暂缓（防连环崩）：' + why); return; }
  restarts.push(Date.now()); lastLaunch = Date.now();
  log('重启宠物 start-pet.bat（原因：' + why + '）');
  try { const p = spawn('cmd', ['/c', PETBAT], { detached: true, stdio: 'ignore', windowsHide: true, cwd: ROOT }); p.unref(); }
  catch (e) { log('重启失败：' + (e && e.message)); }
}
function killPet() {
  const pid = petPid();
  if (!pid) return;
  log('杀宠物进程 pid=' + pid);
  try { execSync('taskkill /PID ' + pid + ' /T /F'); } catch (e) { log('taskkill 失败：' + (e && e.message)); }
}
function tick() {
  probe((up) => {
    if (!up) { launchPet('12400 不在线'); return; }
    if (Date.now() - lastLaunch < 180000) return; // 刚拉起，先给时间上心跳
    let st = null;
    try { st = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch {}
    if (!st) return;
    // busy 卡死：心跳还活着但 busy 持续为 true（渲染层的 5 分钟兜底没救回来）→ 杀掉重拉
    if (st.busy) {
      if (!busySince) busySince = Date.now();
      if (Date.now() - busySince > 600000) {
        log('busy 持续超过 10 分钟（渲染层疑似卡死）→ 杀掉重拉');
        busySince = 0;
        killPet();
        setTimeout(() => launchPet('busy 卡死'), 1500);
        return;
      }
    } else busySince = 0;
    if (!st.infwake) return;                // 无限唤醒没开 → 只做保活
    const age = Date.now() - (st.ts || 0);
    if (age > 180000) {
      log('无限唤醒心跳停了 ' + Math.round(age / 1000) + 's（渲染层疑似卡死）→ 杀掉重拉');
      killPet();
      setTimeout(() => launchPet('无限唤醒中止'), 1500);
    }
  });
}
log('看门狗启动 pid=' + process.pid);
tick();
setInterval(tick, 30000);
