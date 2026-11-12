// 桌宠看门狗：保活 + 无限唤醒中止检测。常驻用法：node watchdog.js（detached 启动，不注册自启，重启电脑即停）
// 每 30s：
//   - 探 127.0.0.1:12400；不在线 → 重拉 start-pet.bat（1 小时最多 5 次，防连环崩）；若端口被僵死进程占住则先杀再拉
//   - 在线但 .wake-state.json 显示"无限唤醒开着、心跳却停了 >180s"或"同轮次无任何活动进展 >600s" → 杀掉重拉（重启后自动恢复无限唤醒）
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, execSync } = require('child_process');
const { appendLine } = require('./lib/logger');
const { loadConfig, parseCutoff } = require('./lib/config-store');
if (process.stdout && typeof process.stdout.on === 'function') process.stdout.on('error', () => {});
if (process.stderr && typeof process.stderr.on === 'function') process.stderr.on('error', () => {});

const ROOT = __dirname;
const STATE = path.join(ROOT, 'pet_space', '.wake-state.json');
const LOG = path.join(ROOT, 'logs', 'watchdog.log');
const PIDFILE = path.join(ROOT, 'logs', 'watchdog.pid');
const PETBAT = path.join(ROOT, 'start-pet.bat');
function getWatchdogGsvMode() {
  const cli = process.argv.slice(2).find((a) => ['auto', 'always', 'on', 'never', 'off'].includes(a.toLowerCase()));
  if (cli) return cli.toLowerCase();
  if (process.env.PET_GSV_MODE) return process.env.PET_GSV_MODE.toLowerCase();
  try {
    const cfg = loadConfig(ROOT);
    const m = cfg.ttsMode || cfg.gsvMode;
    if (m && ['auto', 'always', 'on', 'never', 'off'].includes(String(m).toLowerCase())) {
      return String(m).toLowerCase();
    }
  } catch {}
  return 'off';
}
const WATCHDOG_GSV_MODE = getWatchdogGsvMode();

function log(m) {
  const s = new Date().toISOString() + ' ' + m;
  appendLine(LOG, m, { maxBytes: 5 * 1024 * 1024 });
  try { console.log(s); } catch {}
}

// 单实例保护：避免同时跑两个看门狗互抢或双倍计入 5 次重启上限
try {
  if (fs.existsSync(PIDFILE)) {
    const oldPid = parseInt(fs.readFileSync(PIDFILE, 'utf8').trim(), 10);
    if (oldPid && oldPid !== process.pid) {
      let alive = false;
      try { process.kill(oldPid, 0); alive = true; } catch {}
      if (alive) {
        log(`已有看门狗实例在运行 (pid=${oldPid})，本实例退出`);
        process.exit(0);
      }
    }
  }
  fs.mkdirSync(path.dirname(PIDFILE), { recursive: true });
  fs.writeFileSync(PIDFILE, String(process.pid));
  const rmPid = () => { try { if (fs.readFileSync(PIDFILE, 'utf8').trim() === String(process.pid)) fs.unlinkSync(PIDFILE); } catch {} };
  process.on('exit', rmPid);
  process.on('SIGINT', () => { rmPid(); process.exit(0); });
  process.on('SIGTERM', () => { rmPid(); process.exit(0); });
} catch {}

function probe(cb) {
  let settled = false;
  const done = (ok, why) => { if (settled) return; settled = true; cb(ok, why); };
  const req = http.get({ host: '127.0.0.1', port: 12400, path: '/api/config', timeout: 6000 }, (r) => {
    r.resume();
    done(r.statusCode === 200, 'http-' + r.statusCode);
  });
  req.on('error', (e) => done(false, e && e.code || 'error'));
  req.on('timeout', () => { try { req.destroy(); } catch {} done(false, 'timeout'); });
}

function petPid() {
  try {
    const out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
    const line = out.split(/\r?\n/).find((l) => /:12400\b/.test(l) && /LISTEN/i.test(l));
    if (line) { const p = line.trim().split(/\s+/); return p[p.length - 1]; }
  } catch {}
  return null;
}

let restarts = [], lastLaunch = 0, busySince = 0, lastTurnSeq = 0, lastSeenActTs = 0, offlineStreak = 0;
let lastTickTs = Date.now(), pendingStopInfwake = false, stoppedCutoffKey = '';
function getCutoffConfig() {
  try {
    return parseCutoff(loadConfig(ROOT).infwakeCutoff);
  } catch {}
  return { hour: 12, min: 0, str: '12:00' };
}
function checkInfwakeCutoff() {
  const now = Date.now();
  const { hour, min, str } = getCutoffConfig();
  const d = new Date(now);
  const cutoffTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, min, 0, 0).getTime();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${str}`;
  if (lastTickTs < cutoffTs && now >= cutoffTs && stoppedCutoffKey !== key) {
    stoppedCutoffKey = key;
    pendingStopInfwake = true;
    log(`到达每日无限唤醒截止时间 (${str}) → 准备关闭无限唤醒`);
  }
  lastTickTs = now;
}
function stopInfwakeOnPet(cb) {
  const req = http.request({ host: '127.0.0.1', port: 12400, path: '/api/infwake/stop', method: 'POST', timeout: 5000 }, (r) => {
    const chunks = [];
    r.on('data', (c) => chunks.push(c));
    r.on('end', () => {
      try {
        const j = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        cb(r.statusCode === 200 && Boolean(j && j.sent));
      } catch { cb(false); }
    });
  });
  req.on('error', () => cb(false));
  req.on('timeout', () => { try { req.destroy(); } catch {} cb(false); });
  req.end();
}
function canRestart() { const n = Date.now(); restarts = restarts.filter((t) => n - t < 3600000); return restarts.length < 5; }
function launchPet(why) {
  if (Date.now() - lastLaunch < 45000) return; // 冷却：避免上一轮刚拉起尚未就绪又叠着拉一次
  if (!canRestart()) { log('需要重启但 1 小时内已 5 次，暂缓（防连环崩）：' + why); return; }
  restarts.push(Date.now()); lastLaunch = Date.now();
  const args = ['/c', PETBAT, WATCHDOG_GSV_MODE];
  if (pendingStopInfwake) args.push('--no-infwake');
  log(`重启宠物 start-pet.bat ${WATCHDOG_GSV_MODE}${pendingStopInfwake ? ' --no-infwake' : ''}（原因：${why}）`);
  try {
    const p = spawn('cmd', args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      cwd: ROOT,
      env: { ...process.env, PET_GSV_MODE: WATCHDOG_GSV_MODE },
    });
    p.unref();
  } catch (e) { log('重启失败：' + (e && e.message)); }
}
function killPet() {
  const pid = petPid();
  if (!pid) return;
  log('杀宠物进程 pid=' + pid);
  try { execSync('taskkill /PID ' + pid + ' /T /F'); } catch (e) { log('taskkill 失败：' + (e && e.message)); }
}

function tick() {
  checkInfwakeCutoff();
  probe((up, why) => {
    if (!up) {
      offlineStreak += 1;
      const hungPid = petPid();
      if (hungPid) {
        // 端口被占着却连续 >= 2 次探活失败（>=30s 假死/弹窗卡死）：先杀掉占端口的僵死进程再重启，否则 start-pet.bat 会 EADDRINUSE 秒退！
        if (offlineStreak >= 2 && Date.now() - lastLaunch >= 45000) {
          if (!canRestart()) { log(`12400 端口被 pid=${hungPid} 占住且无响应 (${why})，但 1 小时内已重启 5 次，暂缓`); return; }
          log(`12400 端口被 pid=${hungPid} 占住且连续 ${offlineStreak} 次无响应 (${why}) → 强杀僵死进程重拉`);
          killPet();
          offlineStreak = 0;
          setTimeout(() => launchPet('12400 假死无响应'), 1500);
        }
        return;
      }
      launchPet('12400 不在线 (' + why + ')');
      return;
    }
    offlineStreak = 0;
    if (pendingStopInfwake) {
      stopInfwakeOnPet((sent) => {
        if (sent) {
          pendingStopInfwake = false;
          log('已通过 /api/infwake/stop 关闭无限唤醒');
        }
      });
    }
    if (Date.now() - lastLaunch < 180000) return; // 刚拉起，先给时间上心跳
    let st = null;
    try { st = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch {}
    if (!st) return;

    // 进展检查：只有在同一轮次里超过 10 分钟毫无流式/工具/语音活动才判 busy 卡死（防止健康无限唤醒连播误杀）
    if (st.busy) {
      const seq = Number(st.turnSeq) || 0;
      const actTs = Number(st.lastActivityTs) || 0;
      if (actTs > 0) {
        const stallMs = Date.now() - actTs;
        if (stallMs > 600000) {
          log(`busy 且无任何活动进展已持续 ${Math.round(stallMs / 1000)}s（渲染层疑似卡死）→ 杀掉重拉`);
          busySince = 0;
          killPet();
          setTimeout(() => launchPet('busy 无进展卡死'), 1500);
          return;
        }
        lastTurnSeq = seq;
        lastSeenActTs = actTs;
      } else {
        if (seq && seq !== lastTurnSeq) { lastTurnSeq = seq; busySince = Date.now(); }
        if (!busySince) busySince = Date.now();
        if (Date.now() - busySince > 600000) {
          log('busy 持续超过 10 分钟（渲染层疑似卡死）→ 杀掉重拉');
          busySince = 0;
          killPet();
          setTimeout(() => launchPet('busy 卡死'), 1500);
          return;
        }
      }
    } else {
      busySince = 0;
    }

    if (!st.infwake) return;                // 无限唤醒没开 → 只做保活
    const age = Date.now() - (st.ts || 0);
    if (age > 180000) {
      log('无限唤醒心跳停了 ' + Math.round(age / 1000) + 's（渲染层疑似卡死）→ 杀掉重拉');
      killPet();
      setTimeout(() => launchPet('无限唤醒中止'), 1500);
    }
  });
}
log(`看门狗启动 pid=${process.pid}, gsv=${WATCHDOG_GSV_MODE}`);
tick();
setInterval(tick, 30000);
