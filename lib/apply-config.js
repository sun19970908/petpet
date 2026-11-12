// 自动读取被执行的 .bat 文件（如 set-config-night.bat），解析出顶部的配置项并改写 config.json
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const cfgPath = path.join(ROOT, 'config.json');
const llmCfgPath = path.join(ROOT, 'llm.config.json');

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
  // 如果读取文件失败，则从 process.env 回退获取
}

function parseBatVar(name) {
  if (batText) {
    const reg = new RegExp(`^\\s*set\\s+"?${name}=([^"\\r\\n]+)"?`, 'im');
    const m = batText.match(reg);
    if (m && m[1]) {
      let val = m[1].trim();
      val = val.split(/\s*(?:::|rem\b)/i)[0].trim();
      return val;
    }
  }
  return (process.env[name] || '').trim();
}

const rawProfile = parseBatVar('LLM_PROFILE');
const rawTtsMode = parseBatVar('TTS_MODE').toLowerCase();
const rawGsvIdle = parseBatVar('GSV_IDLE');
const rawWatchdog = parseBatVar('WATCHDOG').toLowerCase();

let cfg = {};
try {
  if (fs.existsSync(cfgPath)) {
    cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  }
} catch (e) {
  cfg = {};
}

// 映射常见别名
let llmProfile = rawProfile;
if (llmProfile.toLowerCase() === 'siliconflow' || llmProfile.toLowerCase() === 'sf') {
  llmProfile = '硅基流动';
}

if (llmProfile) {
  cfg.llmProfile = llmProfile;
}

if (rawTtsMode) {
  cfg.ttsMode = rawTtsMode;
}

const gsvIdle = parseInt(rawGsvIdle, 10);
if (!isNaN(gsvIdle) && gsvIdle > 0) {
  cfg.gsvIdleSeconds = gsvIdle;
}

if (rawWatchdog) {
  cfg.watchdog = rawWatchdog === 'on' || rawWatchdog === 'true' || rawWatchdog === '1';
}

// 安全写入 config.json
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');

// 同时同步 llm.config.json 的 activeProfile（如果档案存在）
try {
  if (fs.existsSync(llmCfgPath)) {
    const llmCfg = JSON.parse(fs.readFileSync(llmCfgPath, 'utf8'));
    if (llmProfile && (!llmCfg.profiles || llmCfg.profiles[llmProfile])) {
      llmCfg.activeProfile = llmProfile;
      fs.writeFileSync(llmCfgPath, JSON.stringify(llmCfg, null, 2), 'utf8');
    }
  }
} catch (e) {}

console.log('');
console.log('============================================================');
console.log(`  [OK] 已成功改写 config.json！(来源: ${path.basename(targetBat)})`);
console.log(`  - LLM 档案   : ${cfg.llmProfile || '(未变)'}`);
console.log(`  - 语音模式   : ${cfg.ttsMode || '(未变)'}`);
console.log(`  - 闲置保持   : ${cfg.gsvIdleSeconds || 120} 秒`);
console.log(`  - 看门狗状态 : ${cfg.watchdog ? '开启' : '关闭'}`);
console.log('============================================================');

// 尝试静默通知运行中的桌宠刷新配置（如果桌宠在线）
try {
  const req = http.request({ host: '127.0.0.1', port: 12400, path: '/api/config', method: 'GET', timeout: 800 }, () => {});
  req.on('error', () => {});
  req.end();
} catch (e) {}
