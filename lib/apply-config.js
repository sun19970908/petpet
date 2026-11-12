// 读取被执行的 .bat（配置卡片），解析顶部参数并应用：写 config.json、同步 LLM 档案与看门狗状态
const fs = require('fs');
const path = require('path');
const http = require('http');
const store = require('./config-store');
const watchdogCtl = require('./watchdog-ctl');

const ROOT = path.resolve(__dirname, '..');

// 获取当前被执行的 bat 路径（默认为根目录 set-config.bat）
const targetBat = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'set-config.bat');

let batText = '';
try {
  const buf = fs.readFileSync(targetBat);
  const utf8 = buf.toString('utf8');
  if (!utf8.includes('\ufffd')) {
    batText = utf8;
  } else {
    try {
      batText = new TextDecoder('gbk').decode(buf);
    } catch {
      batText = utf8;
    }
  }
} catch (e) {
  // 读不到文件时回退到环境变量
}

function parseBatVar(name) {
  if (batText) {
    const reg = new RegExp(`^\\s*set\\s+"?${name}=([^"\\r\\n]+)"?`, 'im');
    const m = batText.match(reg);
    if (m && m[1]) {
      return m[1].trim().split(/\s*(?:::|rem\b)/i)[0].trim();
    }
  }
  return (process.env[name] || '').trim();
}

const rawProfile = parseBatVar('LLM_PROFILE');
const rawTtsMode = parseBatVar('TTS_MODE').toLowerCase();
const rawGsvIdle = parseBatVar('GSV_IDLE');
const rawWatchdog = parseBatVar('WATCHDOG').toLowerCase();

// 常见别名映射
let llmProfile = rawProfile;
if (/^(siliconflow|sf)$/i.test(llmProfile)) llmProfile = '硅基流动';

const patch = {};
if (llmProfile) patch.llmProfile = llmProfile;
if (rawTtsMode) patch.ttsMode = rawTtsMode;
const gsvIdle = parseInt(rawGsvIdle, 10);
if (!isNaN(gsvIdle) && gsvIdle > 0) patch.gsvIdleSeconds = gsvIdle;
if (rawWatchdog) patch.watchdog = ['on', 'true', '1'].includes(rawWatchdog);

const cfg = store.updateConfig(ROOT, patch);

// 档案名两处同时写，避免 config.json 与 llm.config.json 分叉
if (patch.llmProfile && !store.saveActiveProfile(ROOT, cfg.llmProfile)) {
  console.log(`  [WARN] llm.config.json 里没有档案 "${cfg.llmProfile}"，仅写入了 config.json`);
}

// 看门狗状态跟随配置：开就拉起，关就停掉
const dog = cfg.watchdog ? watchdogCtl.start() : watchdogCtl.stop();
const dogText = cfg.watchdog
  ? (dog.ok ? (dog.already ? `已在运行 (pid=${dog.pid})` : `已启动 (pid=${dog.pid})`) : `启动失败 (${dog.error})`)
  : (dog.stopped ? `已关闭 (pid=${dog.pid})` : '未运行');

console.log('');
console.log('============================================================');
console.log(`  [OK] 已成功改写 config.json！(来源: ${path.basename(targetBat)})`);
console.log(`  - LLM 档案   : ${cfg.llmProfile || '(未变)'}`);
console.log(`  - 语音模式   : ${cfg.ttsMode || '(未变)'}`);
console.log(`  - 闲置保持   : ${cfg.gsvIdleSeconds || 120} 秒`);
console.log(`  - 看门狗状态 : ${cfg.watchdog ? '开启' : '关闭'} (${dogText})`);
console.log('============================================================');

// 静默通知运行中的桌宠刷新配置（如果桌宠在线）
try {
  const req = http.request({ host: '127.0.0.1', port: 12400, path: '/api/config', method: 'GET', timeout: 800 }, () => {});
  req.on('error', () => {});
  req.end();
} catch (e) {}
