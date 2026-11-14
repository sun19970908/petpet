// 配置读写唯一入口：config.json（运行配置）与 llm.config.json（模型档案）
// 约定：config.json 的 llmProfile 是唯一权威档案名；llm.config.json 只存档案表，不再存 activeProfile。
const fs = require('fs');
const path = require('path');

const DEFAULT_PROFILE_NAME = 'strata';

const DEFAULT_CONFIG = {
  siliconflowKey: '',
  embeddingModel: 'BAAI/bge-m3',
  embeddingDim: 1024,
  infwakeCutoff: '12:00',
  infwakeReflectEvery: 8,
  ttsMode: 'auto',
  gsvIdleSeconds: 600,
  watchdog: false,
  petOnlyBedroom: false,
  llmProfile: DEFAULT_PROFILE_NAME,
};

const TTS_MODES = ['auto', 'always', 'on', 'never', 'off'];

function configPath(root) { return path.join(root, 'config.json'); }
function llmConfigPath(root) { return path.join(root, 'llm.config.json'); }

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

// 原子写入：先写 .tmp 再 rename，避免半个文件；不带 BOM，Node 与 PowerShell 都能直接解析
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, file);
}

function toBool(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  const s = String(v ?? '').toLowerCase().trim();
  if (['on', 'true', '1', 'always', 'yes'].includes(s)) return true;
  if (['off', 'false', '0', 'never', 'no'].includes(s)) return false;
  return null;
}

// 解析 "HH:MM"，非法值退回 12:00
function parseCutoff(raw) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(raw ?? '').trim());
  const hour = m ? Math.max(0, Math.min(23, Number(m[1]))) : 12;
  const min = m ? Math.max(0, Math.min(59, Number(m[2]))) : 0;
  return { hour, min, str: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
}

// 只校正已出现的字段，不凭空补齐；未知字段原样保留
function normalizeConfig(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = { ...src };

  if ('ttsMode' in out) {
    const mode = String(out.ttsMode ?? '').toLowerCase().trim();
    out.ttsMode = TTS_MODES.includes(mode) ? mode : DEFAULT_CONFIG.ttsMode;
  }
  if ('gsvIdleSeconds' in out) {
    const n = parseInt(out.gsvIdleSeconds, 10);
    out.gsvIdleSeconds = Number.isFinite(n) && n > 0 ? Math.min(n, 86400) : DEFAULT_CONFIG.gsvIdleSeconds;
  }
  if ('watchdog' in out) {
    const b = toBool(out.watchdog);
    out.watchdog = b === null ? DEFAULT_CONFIG.watchdog : b;
  }
  if ('petOnlyBedroom' in out) {
    const b = toBool(out.petOnlyBedroom);
    out.petOnlyBedroom = b === null ? DEFAULT_CONFIG.petOnlyBedroom : b;
  }
  if ('infwakeCutoff' in out) {
    out.infwakeCutoff = parseCutoff(out.infwakeCutoff).str;
  }
  if ('infwakeReflectEvery' in out) {
    const n = parseInt(out.infwakeReflectEvery, 10);
    out.infwakeReflectEvery = Number.isFinite(n) && n > 0 ? Math.min(n, 1000) : DEFAULT_CONFIG.infwakeReflectEvery;
  }
  if ('llmProfile' in out) {
    out.llmProfile = String(out.llmProfile ?? '').trim() || DEFAULT_PROFILE_NAME;
  }
  return out;
}

// 读 config.json：缺省项用默认值补齐，只影响内存，不回写文件
function loadConfig(root) {
  return normalizeConfig({ ...DEFAULT_CONFIG, ...readJson(configPath(root), {}) });
}

function loadLlmConfig(root) {
  return readJson(llmConfigPath(root), {});
}

function saveConfig(root, cfg) {
  const data = normalizeConfig(cfg);
  writeJson(configPath(root), data);
  return data;
}

// 写入只基于原始 config.json + patch；不把内存里的默认值落盘
function updateConfig(root, patch) {
  return saveConfig(root, { ...readJson(configPath(root), {}), ...(patch || {}) });
}

// 档案名唯一来源：cli > 环境变量 > config.json.llmProfile > 兼容旧字段 config.activeProfile > 默认
// llm.config.json 不参与档案名优先级（不再读它的 activeProfile）
function resolveActiveProfile({ config, llmConfig, cliProfile, envProfile } = {}) {
  const sources = [cliProfile, envProfile, config?.llmProfile, config?.activeProfile];
  const name = sources.map((v) => String(v ?? '').trim()).find(Boolean);
  return name || DEFAULT_PROFILE_NAME;
}

function profileExists(llmConfig, name) {
  const profiles = llmConfig?.profiles;
  if (!profiles || typeof profiles !== 'object') return true; // 没有档案表时不拦
  return Boolean(profiles[name]);
}

// 切换档案：只写 config.json.llmProfile；若 llm.config.json 里还残留旧的 activeProfile，顺手清掉
function saveActiveProfile(root, name) {
  const profile = String(name ?? '').trim();
  if (!profile) return false;
  const llm = loadLlmConfig(root);
  if (!profileExists(llm, profile)) return false;
  const cfg = updateConfig(root, { llmProfile: profile });
  if (Object.keys(llm).length && 'activeProfile' in llm) {
    const { activeProfile, ...rest } = llm;
    writeJson(llmConfigPath(root), rest);
  }
  return cfg.llmProfile === profile;
}

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_PROFILE_NAME,
  TTS_MODES,
  configPath,
  llmConfigPath,
  readJson,
  writeJson,
  loadConfig,
  loadLlmConfig,
  normalizeConfig,
  saveConfig,
  updateConfig,
  resolveActiveProfile,
  profileExists,
  saveActiveProfile,
  parseCutoff,
  toBool,
};
