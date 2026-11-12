// 命令行与交互式配置管理工具（供 set-config.bat / switch-day.bat / switch-night.bat 调用）
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(ROOT, 'config.json');
const LLM_CONFIG_FILE = path.join(ROOT, 'llm.config.json');

const DEFAULT_PRESETS = {
  day: {
    name: '白天·日常/游戏',
    desc: '硅基流动云端 + 关看门狗 + 显卡免检(100%) + 语音按需释放',
    llmProfile: '硅基流动',
    ttsMode: 'auto',
    gsvIdleSeconds: 120,
    watchdog: false,
    wakeGpuLimit: 100,
  },
  night: {
    name: '夜间·挂机值班',
    desc: 'strata本地大模型 + 开看门狗保活 + 显卡防打扰(40%) + 语音按需释放',
    llmProfile: 'strata',
    ttsMode: 'auto',
    gsvIdleSeconds: 120,
    watchdog: true,
    wakeGpuLimit: 40,
  },
  silent: {
    name: '静音·游戏免扰',
    desc: '彻底关闭语音合成 + 关看门狗 + 显卡免检(100%)',
    ttsMode: 'off',
    watchdog: false,
    wakeGpuLimit: 100,
  },
};

function loadJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return {}; }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function maskKey(k) {
  if (!k || typeof k !== 'string') return '(未配置)';
  if (k.length <= 12) return '***';
  return k.slice(0, 7) + '...' + k.slice(-4);
}

function getAllPresets() {
  const cfg = loadJson(CONFIG_FILE);
  return {
    ...DEFAULT_PRESETS,
    ...(cfg.presets && typeof cfg.presets === 'object' ? cfg.presets : {}),
  };
}

function getEffectiveConfig() {
  const cfg = loadJson(CONFIG_FILE);
  const llmCfg = loadJson(LLM_CONFIG_FILE);
  const activeProfile = cfg.llmProfile || llmCfg.activeProfile || 'strata';
  const profile = (llmCfg.profiles && llmCfg.profiles[activeProfile]) || {};
  const wakeGpuLimit = profile.wakeGpuLimit ?? cfg.wakeGpuLimit ?? llmCfg.wakeGpuLimit ?? 40;
  return {
    cfg,
    llmCfg,
    activeProfile,
    profile,
    ttsMode: cfg.ttsMode || cfg.gsvMode || 'auto',
    gsvIdleSeconds: cfg.gsvIdleSeconds ?? cfg.ttsIdleSeconds ?? 120,
    watchdog: Boolean(cfg.watchdog),
    wakeGpuLimit: Number(wakeGpuLimit),
    infwakeCutoff: cfg.infwakeCutoff || '12:00',
    siliconflowKey: cfg.siliconflowKey || '',
  };
}

function restartPet() {
  console.log('\n[正在重启桌宠应用...]');
  try {
    execSync('powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'electron.exe\'\\" | Where-Object { $_.ExecutablePath -like \'G:\\AI\\livliv-pet\\*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"', { stdio: 'ignore' });
  } catch {}
  try {
    execSync('schtasks /create /tn "LivLivPetStart" /tr "cmd /c cd /d G:\\AI\\livliv-pet && G:\\AI\\livliv-pet\\start-pet.bat" /sc once /st 23:59 /f /it', { stdio: 'ignore' });
    execSync('schtasks /run /tn "LivLivPetStart"', { stdio: 'ignore' });
    execSync('schtasks /delete /tn "LivLivPetStart" /f', { stdio: 'ignore' });
  } catch (e) {
    console.error('重启命令执行失败:', e.message);
    return false;
  }
  console.log('已发起桌宠启动任务。正在等待 12400 端口响应...');
  const t0 = Date.now();
  while (Date.now() - t0 < 8000) {
    try {
      const res = execSync('powershell.exe -NoProfile -Command "(Invoke-WebRequest -Uri http://127.0.0.1:12400/api/config -UseBasicParsing -TimeoutSec 2).StatusCode"', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (res === '200') {
        console.log('✅ 桌宠已成功重启并就绪 (HTTP 200)！\n');
        return true;
      }
    } catch {}
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
  console.log('⚠️ 启动任务已触发，但端口尚未返回 200，请稍后查看桌宠窗口。\n');
  return false;
}

function applyPreset(key, { restart = true } = {}) {
  const presets = getAllPresets();
  const alias = key === '1' ? 'day' : key === '2' ? 'night' : key === '3' ? 'silent' : key.toLowerCase();
  const preset = presets[alias] || presets[key];
  if (!preset) {
    console.error(`❌ 未找到方案: "${key}"。可用方案: ${Object.keys(presets).join(', ')}`);
    return false;
  }

  const cfg = loadJson(CONFIG_FILE);
  const llmCfg = loadJson(LLM_CONFIG_FILE);

  if (preset.llmProfile) {
    cfg.llmProfile = preset.llmProfile;
    llmCfg.activeProfile = preset.llmProfile;
  }
  if (preset.ttsMode) cfg.ttsMode = preset.ttsMode;
  if (preset.gsvIdleSeconds) cfg.gsvIdleSeconds = preset.gsvIdleSeconds;
  if (typeof preset.watchdog === 'boolean') cfg.watchdog = preset.watchdog;
  if (typeof preset.wakeGpuLimit === 'number') {
    cfg.wakeGpuLimit = preset.wakeGpuLimit;
    const prof = preset.llmProfile || cfg.llmProfile || llmCfg.activeProfile;
    if (prof) {
      if (!llmCfg.profiles) llmCfg.profiles = {};
      if (!llmCfg.profiles[prof]) llmCfg.profiles[prof] = {};
      llmCfg.profiles[prof].wakeGpuLimit = preset.wakeGpuLimit;
    }
  }
  if (preset.infwakeCutoff) cfg.infwakeCutoff = preset.infwakeCutoff;

  saveJson(CONFIG_FILE, cfg);
  saveJson(LLM_CONFIG_FILE, llmCfg);

  console.log('');
  console.log('===============================================================');
  console.log(`  🎉 已成功切换到方案: 【${preset.name || alias}】`);
  console.log(`  说明: ${preset.desc || '已应用全套预设'}`);
  console.log('---------------------------------------------------------------');
  console.log(`  • LLM 档案   : ${cfg.llmProfile || '(未变)'}`);
  console.log(`  • 语音模式   : ${cfg.ttsMode || '(未变)'} (${cfg.gsvIdleSeconds || 120}s 空闲回收)`);
  console.log(`  • 看门狗     : ${cfg.watchdog ? '开启' : '关闭'}`);
  console.log(`  • 显卡阈值   : ${cfg.wakeGpuLimit ?? 40}%${(cfg.wakeGpuLimit ?? 40) >= 100 ? ' (跳过判定)' : ''}`);
  console.log('===============================================================');

  if (restart) {
    restartPet();
  }
  return true;
}

function printSummary() {
  const c = getEffectiveConfig();
  const presets = getAllPresets();
  const presetKeys = Object.keys(presets);

  const ttsLabel = c.ttsMode === 'always' || c.ttsMode === 'on' ? 'on (常驻开启)'
    : c.ttsMode === 'never' || c.ttsMode === 'off' ? 'off (静音关闭)'
    : 'auto (按需拉起，闲置自动释放)';
  const wdLabel = c.watchdog ? '开启 (开机同步拉起看门狗)' : '关闭 (开机主动杀死残留看门狗)';
  const gpuLabel = c.wakeGpuLimit >= 100 ? `${c.wakeGpuLimit}% (跳过显卡占用率判定)` : `${c.wakeGpuLimit}% (占用超标时推迟唤醒)`;

  console.log('');
  console.log('===============================================================');
  console.log('                 DeepSeek 娘桌宠 - 方案一键切换                 ');
  console.log('===============================================================');
  console.log('  【当前运行中配置】');
  console.log(`    • LLM 档案   : ${c.activeProfile}`);
  console.log(`    • 语音合成   : ${ttsLabel}`);
  console.log(`    • 空闲保持   : ${c.gsvIdleSeconds} 秒`);
  console.log(`    • 看门狗     : ${wdLabel}`);
  console.log(`    • 显卡阈值   : ${gpuLabel}`);
  console.log(`    • 截止时间   : ${c.infwakeCutoff}`);
  console.log(`    • 硅基密钥   : ${maskKey(c.siliconflowKey)}`);
  console.log('---------------------------------------------------------------');
  console.log('  【点一下迅速切换整套方案 (按数字键立刻应用并重启)】');
  presetKeys.forEach((k, idx) => {
    const p = presets[k];
    console.log(`    [${idx + 1}] 方案【${p.name || k}】`);
    console.log(`        └─ ${p.desc || ''}`);
  });
  console.log('---------------------------------------------------------------');
  console.log('    [C] 进入逐项细调菜单 (手动修改单个参数)');
  console.log('    [R] 仅重启桌宠应用生效');
  console.log('    [0] 退出');
  console.log('===============================================================');
}

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans.trim())));
}

async function detailedCustomMenu(rl) {
  for (;;) {
    const c = getEffectiveConfig();
    console.log('\n--- 逐项细调菜单 ---');
    console.log(`  [1] LLM 档案   : ${c.activeProfile}`);
    console.log(`  [2] 语音模式   : ${c.ttsMode}`);
    console.log(`  [3] 闲置保持   : ${c.gsvIdleSeconds} 秒`);
    console.log(`  [4] 看门狗     : ${c.watchdog ? '开启' : '关闭'}`);
    console.log(`  [5] 显卡阈值   : ${c.wakeGpuLimit}%`);
    console.log(`  [6] 截止时间   : ${c.infwakeCutoff}`);
    console.log(`  [7] SiliconKey : ${maskKey(c.siliconflowKey)}`);
    console.log('  [0] 返回方案菜单');
    const opt = await ask(rl, '请选择要调整的单项 [0-7]: ');
    if (opt === '0') break;

    const { cfg, llmCfg, activeProfile } = getEffectiveConfig();
    if (opt === '1') {
      const profiles = Object.keys(llmCfg.profiles || {});
      console.log('\n可选 LLM: ' + profiles.map((p, i) => `${i + 1}.${p}`).join('  '));
      const sel = await ask(rl, '请输入编号或名称: ');
      const n = parseInt(sel, 10);
      const target = (n >= 1 && n <= profiles.length) ? profiles[n - 1] : sel;
      if (target) {
        cfg.llmProfile = target; llmCfg.activeProfile = target;
        saveJson(CONFIG_FILE, cfg); saveJson(LLM_CONFIG_FILE, llmCfg);
        console.log(`✅ 已设置为 ${target}`);
      }
    } else if (opt === '2') {
      const sel = await ask(rl, '请输入语音模式 (1.auto / 2.on / 3.off): ');
      const m = sel === '1' ? 'auto' : sel === '2' ? 'on' : sel === '3' ? 'off' : sel.toLowerCase();
      if (['auto', 'on', 'off'].includes(m)) {
        cfg.ttsMode = m; saveJson(CONFIG_FILE, cfg);
        console.log(`✅ 已设置为 ${m}`);
      }
    } else if (opt === '3') {
      const val = parseInt(await ask(rl, '请输入闲置释放秒数: '), 10);
      if (val > 0) { cfg.gsvIdleSeconds = val; saveJson(CONFIG_FILE, cfg); console.log(`✅ 已设置为 ${val}s`); }
    } else if (opt === '4') {
      const sel = await ask(rl, '看门狗 (1.关 / 2.开): ');
      cfg.watchdog = sel === '2' || sel === 'on'; saveJson(CONFIG_FILE, cfg);
      console.log(`✅ 已设置为 ${cfg.watchdog ? '开' : '关'}`);
    } else if (opt === '5') {
      const val = parseInt(await ask(rl, '显卡占用阈值 0-100 (100为跳过): '), 10);
      if (val >= 0 && val <= 100) {
        cfg.wakeGpuLimit = val;
        if (!llmCfg.profiles[activeProfile]) llmCfg.profiles[activeProfile] = {};
        llmCfg.profiles[activeProfile].wakeGpuLimit = val;
        saveJson(CONFIG_FILE, cfg); saveJson(LLM_CONFIG_FILE, llmCfg);
        console.log(`✅ 已设置为 ${val}%`);
      }
    } else if (opt === '6') {
      const val = await ask(rl, '截止时间 (HH:MM): ');
      if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(val)) { cfg.infwakeCutoff = val; saveJson(CONFIG_FILE, cfg); console.log(`✅ 已设置为 ${val}`); }
    } else if (opt === '7') {
      const val = await ask(rl, '新 SiliconFlow Key: ');
      if (val) { cfg.siliconflowKey = val; saveJson(CONFIG_FILE, cfg); console.log('✅ Key 已更新'); }
    }
  }
}

async function interactiveMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const presets = getAllPresets();
  const presetKeys = Object.keys(presets);

  for (;;) {
    printSummary();
    const opt = await ask(rl, `请选择 [1-${presetKeys.length}, C, R, 0]: `);
    if (opt === '0') {
      console.log('已退出配置管理。\n');
      break;
    }
    if (opt.toUpperCase() === 'R') {
      restartPet();
      continue;
    }
    if (opt.toUpperCase() === 'C') {
      await detailedCustomMenu(rl);
      continue;
    }

    const n = parseInt(opt, 10);
    if (Number.isFinite(n) && n >= 1 && n <= presetKeys.length) {
      const key = presetKeys[n - 1];
      applyPreset(key, { restart: true });
      break;
    }

    if (presets[opt.toLowerCase()]) {
      applyPreset(opt.toLowerCase(), { restart: true });
      break;
    }
  }
  rl.close();
}

function handleCli(args) {
  const cmd = (args[0] || '').toLowerCase();
  const presets = getAllPresets();

  if (!cmd || cmd === 'menu' || cmd === 'interactive') {
    return interactiveMenu();
  }

  if (cmd === 'show' || cmd === 'status' || cmd === 'get') {
    printSummary();
    return;
  }

  if (cmd === 'restart') {
    restartPet();
    return;
  }

  // 直接支持方案名：例如 set-config.bat day / night / silent / 1 / 2 / 3
  if (presets[cmd] || cmd === '1' || cmd === '2' || cmd === '3') {
    applyPreset(cmd, { restart: true });
    return;
  }

  const { cfg, llmCfg, activeProfile } = getEffectiveConfig();
  const val = args[1];

  if (cmd === 'llm' || cmd === 'profile') {
    if (!val) { console.error('用法: set-config.bat llm <profile-name>'); process.exit(1); }
    cfg.llmProfile = val; llmCfg.activeProfile = val;
    saveJson(CONFIG_FILE, cfg); saveJson(LLM_CONFIG_FILE, llmCfg);
    console.log(`[config] llmProfile 已设置为: "${val}"`);
    return;
  }

  if (cmd === 'tts') {
    const m = (val || '').toLowerCase();
    if (!['auto', 'on', 'off'].includes(m)) { console.error('用法: set-config.bat tts <auto|on|off>'); process.exit(1); }
    cfg.ttsMode = m; saveJson(CONFIG_FILE, cfg);
    console.log(`[config] ttsMode 已设置为: "${m}"`);
    return;
  }

  if (cmd === 'idle') {
    const sec = parseInt(val, 10);
    if (!Number.isFinite(sec) || sec <= 0) { console.error('用法: set-config.bat idle <seconds>'); process.exit(1); }
    cfg.gsvIdleSeconds = sec; saveJson(CONFIG_FILE, cfg);
    console.log(`[config] gsvIdleSeconds 已设置为: ${sec}`);
    return;
  }

  if (cmd === 'watchdog') {
    const boolVal = ['on', 'true', '1'].includes((val || '').toLowerCase());
    cfg.watchdog = boolVal; saveJson(CONFIG_FILE, cfg);
    console.log(`[config] watchdog 已设置为: ${boolVal}`);
    return;
  }

  if (cmd === 'gpu') {
    const g = parseInt(val, 10);
    if (!Number.isFinite(g) || g < 0 || g > 100) { console.error('用法: set-config.bat gpu <0-100>'); process.exit(1); }
    cfg.wakeGpuLimit = g;
    if (!llmCfg.profiles[activeProfile]) llmCfg.profiles[activeProfile] = {};
    llmCfg.profiles[activeProfile].wakeGpuLimit = g;
    saveJson(CONFIG_FILE, cfg); saveJson(LLM_CONFIG_FILE, llmCfg);
    console.log(`[config] wakeGpuLimit 已设置为: ${g}%`);
    return;
  }

  console.log('未知子命令。用法示例:');
  console.log('  set-config.bat                (打开方案切换面板)');
  console.log('  set-config.bat day            (一键切换为白天·日常/游戏方案)');
  console.log('  set-config.bat night          (一键切换为夜间·挂机值班方案)');
  console.log('  set-config.bat silent         (一键切换为静音免扰方案)');
  console.log('  set-config.bat show           (查看当前配置状态)');
}

handleCli(process.argv.slice(2));
