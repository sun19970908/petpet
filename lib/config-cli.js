// 命令行与交互式配置管理工具（供 set-config.bat 调用）
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(ROOT, 'config.json');
const LLM_CONFIG_FILE = path.join(ROOT, 'llm.config.json');

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

function printSummary() {
  const c = getEffectiveConfig();
  const ttsLabel = c.ttsMode === 'always' || c.ttsMode === 'on' ? 'on (常驻开启)'
    : c.ttsMode === 'never' || c.ttsMode === 'off' ? 'off (静音关闭)'
    : 'auto (按需拉起，闲置自动释放)';
  const wdLabel = c.watchdog ? '开启 (开机同步拉起看门狗)' : '关闭 (开机主动杀死残留看门狗)';
  const gpuLabel = c.wakeGpuLimit >= 100 ? `${c.wakeGpuLimit}% (跳过显卡占用率判定)` : `${c.wakeGpuLimit}% (占用超标时推迟唤醒)`;

  console.log('');
  console.log('===============================================================');
  console.log('                 DeepSeek 娘桌宠 - 配置管理面板                  ');
  console.log('===============================================================');
  console.log(`  [1] 当前 LLM 档案   : ${c.activeProfile}`);
  console.log(`  [2] 语音合成模式    : ${ttsLabel}`);
  console.log(`  [3] 语音闲置保持秒数: ${c.gsvIdleSeconds} 秒`);
  console.log(`  [4] 同步启动看门狗  : ${wdLabel}`);
  console.log(`  [5] 唤醒显卡占用阈值: ${gpuLabel}`);
  console.log(`  [6] 无限唤醒截止时间: ${c.infwakeCutoff}`);
  console.log(`  [7] SiliconFlow Key : ${maskKey(c.siliconflowKey)}`);
  console.log('---------------------------------------------------------------');
  console.log('  [R] 保存并立即重启桌宠应用生效');
  console.log('  [0] 保存并退出');
  console.log('===============================================================');
}

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans.trim())));
}

async function interactiveMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  for (;;) {
    printSummary();
    const opt = await ask(rl, '请输入选项编号 [0-7, R]: ');
    if (opt === '0') {
      console.log('已退出配置面板。\n');
      break;
    }
    if (opt.toUpperCase() === 'R') {
      restartPet();
      continue;
    }

    if (opt === '1') {
      const { cfg, llmCfg, activeProfile } = getEffectiveConfig();
      const profiles = Object.keys(llmCfg.profiles || {});
      console.log('\n当前可选的 LLM 档案:');
      profiles.forEach((p, i) => {
        const cur = p === activeProfile ? ' (当前生效)' : '';
        console.log(`  ${i + 1}. ${p}${cur}`);
      });
      console.log(`  ${profiles.length + 1}. 手动输入新名称`);
      const sel = await ask(rl, `请选择或输入新名称 (默认 ${activeProfile}): `);
      let target = sel;
      const num = parseInt(sel, 10);
      if (Number.isFinite(num) && num >= 1 && num <= profiles.length) {
        target = profiles[num - 1];
      }
      if (target && target !== String(profiles.length + 1)) {
        cfg.llmProfile = target;
        llmCfg.activeProfile = target;
        saveJson(CONFIG_FILE, cfg);
        saveJson(LLM_CONFIG_FILE, llmCfg);
        console.log(`\n✅ 已切换 LLM 档案为: "${target}"`);
      } else if (target === String(profiles.length + 1)) {
        const custom = await ask(rl, '请输入自定义档案名称: ');
        if (custom) {
          cfg.llmProfile = custom;
          llmCfg.activeProfile = custom;
          saveJson(CONFIG_FILE, cfg);
          saveJson(LLM_CONFIG_FILE, llmCfg);
          console.log(`\n✅ 已切换 LLM 档案为: "${custom}"`);
        }
      }
    } else if (opt === '2') {
      const { cfg, ttsMode } = getEffectiveConfig();
      console.log('\n请选择语音合成 (TTS) 模式:');
      console.log('  1. auto  (推荐：按需拉起 GPT-SoVITS，闲置后自动释放显存)');
      console.log('  2. on    (常驻：启动后一直保持运行)');
      console.log('  3. off   (静音：彻底关闭语音合成，不占显存)');
      const sel = await ask(rl, `请输入选项编号或名称 [1-3] (当前: ${ttsMode}): `);
      let newMode = null;
      if (sel === '1' || sel.toLowerCase() === 'auto') newMode = 'auto';
      else if (sel === '2' || sel.toLowerCase() === 'on') newMode = 'on';
      else if (sel === '3' || sel.toLowerCase() === 'off') newMode = 'off';
      if (newMode) {
        cfg.ttsMode = newMode;
        saveJson(CONFIG_FILE, cfg);
        console.log(`\n✅ 已将语音模式设置为: ${newMode}`);
      }
    } else if (opt === '3') {
      const { cfg, gsvIdleSeconds } = getEffectiveConfig();
      const val = await ask(rl, `\n请输入闲置自动释放显存秒数 (当前: ${gsvIdleSeconds}): `);
      const sec = parseInt(val, 10);
      if (Number.isFinite(sec) && sec > 0) {
        cfg.gsvIdleSeconds = sec;
        saveJson(CONFIG_FILE, cfg);
        console.log(`\n✅ 已将闲置保持秒数设置为: ${sec} 秒`);
      } else if (val) {
        console.log('⚠️ 无效的秒数，保持原值。');
      }
    } else if (opt === '4') {
      const { cfg, watchdog } = getEffectiveConfig();
      console.log('\n请选择开机是否同步开启看门狗:');
      console.log('  1. 关闭 (false) - 推荐白班：启动桌宠时主动杀死残留看门狗');
      console.log('  2. 开启 (true)  - 夜间值班：启动桌宠时同步拉起看门狗保活');
      const sel = await ask(rl, `请输入 [1/2] (当前: ${watchdog ? '开启' : '关闭'}): `);
      if (sel === '1' || sel.toLowerCase() === 'false' || sel.toLowerCase() === 'off') {
        cfg.watchdog = false;
        saveJson(CONFIG_FILE, cfg);
        console.log('\n✅ 已设置为: 关闭看门狗');
      } else if (sel === '2' || sel.toLowerCase() === 'true' || sel.toLowerCase() === 'on') {
        cfg.watchdog = true;
        saveJson(CONFIG_FILE, cfg);
        console.log('\n✅ 已设置为: 开启看门狗');
      }
    } else if (opt === '5') {
      const { cfg, llmCfg, activeProfile, wakeGpuLimit } = getEffectiveConfig();
      console.log('\n设置唤醒时的显卡占用率上限判定:');
      console.log('  - 输入 40  : 显卡占用 > 40% 时跳过本次唤醒（默认防打扰模式）');
      console.log('  - 输入 100 : 跳过占用率判定，随时随地直接唤醒（云端模型推荐）');
      const val = await ask(rl, `请输入显卡阈值 (0-100，当前: ${wakeGpuLimit}): `);
      const num = parseInt(val, 10);
      if (Number.isFinite(num) && num >= 0 && num <= 100) {
        cfg.wakeGpuLimit = num;
        if (!llmCfg.profiles) llmCfg.profiles = {};
        if (!llmCfg.profiles[activeProfile]) llmCfg.profiles[activeProfile] = {};
        llmCfg.profiles[activeProfile].wakeGpuLimit = num;
        saveJson(CONFIG_FILE, cfg);
        saveJson(LLM_CONFIG_FILE, llmCfg);
        console.log(`\n✅ 已将显卡占用率阈值设置为: ${num}%${num >= 100 ? ' (跳过判定)' : ''}`);
      } else if (val) {
        console.log('⚠️ 请输入 0-100 之间的整数。');
      }
    } else if (opt === '6') {
      const { cfg, infwakeCutoff } = getEffectiveConfig();
      const val = await ask(rl, `\n请输入无限唤醒每日截止时间 HH:MM (当前: ${infwakeCutoff}): `);
      if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(val)) {
        cfg.infwakeCutoff = val;
        saveJson(CONFIG_FILE, cfg);
        console.log(`\n✅ 已将截止时间设置为: ${val}`);
      } else if (val) {
        console.log('⚠️ 格式无效，必须为 HH:MM（例如 12:00 或 06:30）。');
      }
    } else if (opt === '7') {
      const { cfg, siliconflowKey } = getEffectiveConfig();
      console.log(`\n当前 Key: ${maskKey(siliconflowKey)}`);
      const val = await ask(rl, '请输入新的 SiliconFlow API Key（直接回车取消）: ');
      if (val) {
        cfg.siliconflowKey = val;
        saveJson(CONFIG_FILE, cfg);
        console.log('\n✅ SiliconFlow API Key 已更新');
      }
    }
  }
  rl.close();
}

function handleCli(args) {
  const cmd = (args[0] || '').toLowerCase();
  const val = args[1];

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

  const { cfg, llmCfg, activeProfile } = getEffectiveConfig();

  if (cmd === 'llm' || cmd === 'profile') {
    if (!val) { console.error('用法: set-config.bat llm <profile-name>'); process.exit(1); }
    cfg.llmProfile = val;
    llmCfg.activeProfile = val;
    saveJson(CONFIG_FILE, cfg);
    saveJson(LLM_CONFIG_FILE, llmCfg);
    console.log(`[config] llmProfile 已设置为: "${val}"`);
    return;
  }

  if (cmd === 'tts') {
    const m = (val || '').toLowerCase();
    if (!['auto', 'on', 'off', 'always', 'never'].includes(m)) {
      console.error('用法: set-config.bat tts <auto|on|off>'); process.exit(1);
    }
    const target = (m === 'always' || m === 'on') ? 'on' : (m === 'never' || m === 'off') ? 'off' : 'auto';
    cfg.ttsMode = target;
    saveJson(CONFIG_FILE, cfg);
    console.log(`[config] ttsMode 已设置为: "${target}"`);
    return;
  }

  if (cmd === 'idle') {
    const sec = parseInt(val, 10);
    if (!Number.isFinite(sec) || sec <= 0) { console.error('用法: set-config.bat idle <seconds>'); process.exit(1); }
    cfg.gsvIdleSeconds = sec;
    saveJson(CONFIG_FILE, cfg);
    console.log(`[config] gsvIdleSeconds 已设置为: ${sec}`);
    return;
  }

  if (cmd === 'watchdog') {
    const w = (val || '').toLowerCase();
    if (!['on', 'off', 'true', 'false', '1', '0'].includes(w)) {
      console.error('用法: set-config.bat watchdog <on|off|true|false>'); process.exit(1);
    }
    const boolVal = ['on', 'true', '1'].includes(w);
    cfg.watchdog = boolVal;
    saveJson(CONFIG_FILE, cfg);
    console.log(`[config] watchdog 已设置为: ${boolVal}`);
    return;
  }

  if (cmd === 'gpu') {
    const g = parseInt(val, 10);
    if (!Number.isFinite(g) || g < 0 || g > 100) { console.error('用法: set-config.bat gpu <0-100>'); process.exit(1); }
    cfg.wakeGpuLimit = g;
    if (!llmCfg.profiles) llmCfg.profiles = {};
    if (!llmCfg.profiles[activeProfile]) llmCfg.profiles[activeProfile] = {};
    llmCfg.profiles[activeProfile].wakeGpuLimit = g;
    saveJson(CONFIG_FILE, cfg);
    saveJson(LLM_CONFIG_FILE, llmCfg);
    console.log(`[config] wakeGpuLimit 已设置为: ${g}%${g >= 100 ? ' (跳过判定)' : ''}`);
    return;
  }

  if (cmd === 'cutoff') {
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(val || '')) { console.error('用法: set-config.bat cutoff <HH:MM>'); process.exit(1); }
    cfg.infwakeCutoff = val;
    saveJson(CONFIG_FILE, cfg);
    console.log(`[config] infwakeCutoff 已设置为: "${val}"`);
    return;
  }

  console.log('未知子命令。用法示例:');
  console.log('  set-config.bat                (打开交互式菜单)');
  console.log('  set-config.bat show           (查看当前全部配置)');
  console.log('  set-config.bat llm 硅基流动   (切换 LLM 档案)');
  console.log('  set-config.bat tts auto|on|off(切换语音模式)');
  console.log('  set-config.bat idle 120       (设置语音闲置保持秒数)');
  console.log('  set-config.bat watchdog on|off(设置开机是否同步看门狗)');
  console.log('  set-config.bat gpu 100        (设置显卡占用判定，100为跳过)');
  console.log('  set-config.bat cutoff 12:00   (设置每日无限唤醒截止时间)');
  console.log('  set-config.bat restart        (重启桌宠程序生效)');
}

handleCli(process.argv.slice(2));
