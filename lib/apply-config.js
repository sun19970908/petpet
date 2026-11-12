// 自动读取 set-config.bat（或传入的 .bat 路径），解析出顶部的配置项并安全写入 config.json
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfgPath = path.join(ROOT, 'config.json');
const llmCfgPath = path.join(ROOT, 'llm.config.json');

// 如果作为参数传入了指定 bat 路径，则使用传入的；否则使用根目录的 set-config.bat
const targetBat = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'set-config.bat');

let batText = '';
try {
  const buf = fs.readFileSync(targetBat);
  // 智能识别 UTF-8 或 GBK
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
  // 如果读取失败，回退到从 process.env 获取
}

function parseBatVar(name) {
  if (batText) {
    const reg = new RegExp(`^\\s*set\\s+"?${name}=([^"\\r\\n]+)"?`, 'im');
    const m = batText.match(reg);
    if (m && m[1]) return m[1].trim();
  }
  return (process.env[name] || '').trim();
}

const rawProfile = parseBatVar('LLM_PROFILE');
const rawTtsMode = parseBatVar('TTS_MODE').toLowerCase();
const rawGsvIdle = parseBatVar('GSV_IDLE');
const rawWatchdog = parseBatVar('WATCHDOG').toLowerCase();

let cfg = {};
try {
  cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
} catch (e) {
  cfg = {};
}

// 映射常用别名
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

fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');

// 同步 llm.config.json 的 activeProfile（如果档案存在）
try {
  if (fs.existsSync(llmCfgPath)) {
    const llmCfg = JSON.parse(fs.readFileSync(llmCfgPath, 'utf8'));
    if (llmProfile && (!llmCfg.profiles || llmCfg.profiles[llmProfile])) {
      llmCfg.activeProfile = llmProfile;
      fs.writeFileSync(llmCfgPath, JSON.stringify(llmCfg, null, 2), 'utf8');
    }
  }
} catch (e) {}

console.log('[OK] 配置已成功写入 config.json:');
console.log(`  - LLM 档案   : ${cfg.llmProfile || '(未变)'}`);
console.log(`  - 语音模式   : ${cfg.ttsMode || '(未变)'}`);
console.log(`  - 闲置保持   : ${cfg.gsvIdleSeconds || 120} 秒`);
console.log(`  - 看门狗状态 : ${cfg.watchdog ? '开启' : '关闭'}`);
