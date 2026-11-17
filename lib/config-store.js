// 配置读写入口：config.json（运行配置）、llm.config.json（每档案 app + llm.request）、tts.config.json（app + GPT-SoVITS 原生请求）
// 约定：config.json 的 llmProfile 是唯一权威档案名；llm.config.json 只存档案表，不再存 activeProfile。
const fs = require('fs');
const path = require('path');

const DEFAULT_PROFILE_NAME = 'default';

const TTS_MODES = ['auto', 'always', 'on', 'never', 'off'];

const DEFAULT_TTS_SERVER = {
  dir: '',
  python: process.platform === 'win32' ? 'runtime\\python.exe' : 'python3',
  config: 'GPT_SoVITS/configs/tts_infer.yaml',
  gpu: '0',
  port: 9880,
  startTimeoutMs: 90000,
};

const DEFAULT_TTS_APP = {
  idleSeconds: 120,
  url: '/api/tts',
  server: { ...DEFAULT_TTS_SERVER },
  shortTextLimit: 60,
  splitShort: 'cut0',
  splitLong: 'cut5',
};

// GPT-SoVITS /tts 原生请求体；text 由 renderer 每次注入，text_split_method 可按长度覆盖
const DEFAULT_TTS_REQUEST = {
  text_lang: 'zh',
  prompt_lang: 'zh',
  media_type: 'wav',
  streaming_mode: 2,
  temperature: 0.4,
  top_k: 3,
  top_p: 0.7,
  text_split_method: 'cut5',
  ref_audio_path: '',
  prompt_text: '',
};

const DEFAULT_TTS_CONFIG = {
  app: DEFAULT_TTS_APP,
  request: DEFAULT_TTS_REQUEST,
};

const DEFAULT_CONFIG = {
  siliconflowKey: '',
  embeddingModel: 'BAAI/bge-m3',
  embeddingDim: 1024,
  embeddingUrl: 'https://api.siliconflow.cn/v1/embeddings',
  infwakeCutoff: '12:00',
  infwakeReflectEvery: 8,
  watchdog: false,
  hasBedroom: false,
  petOnlyBedroom: false,
  splitWindows: true,
  serverPort: 12400,
  debugPort: 0,
  hwCompositing: true,
  capMain: 'main',
  capRoom: 'room',
  characterPath: '/characters/p01/',
  petReadScope: 'space',
  petReadBlacklist: ['config.json', 'llm.config.json', 'tts.config.json', '.git'],
  llmProfile: DEFAULT_PROFILE_NAME,
  ttsMode: 'off',
  asrModelDir: '',
  comfyHost: '127.0.0.1',
  comfyPort: 8188,
  comfyInputDir: '',
  webSearchApiUrl: '',
  webSearchApiKey: '',
  webSearchTimeoutMs: 15000,
  webSearchMaxResults: 8,
  pythonMode: 'docker',
  pythonDockerBin: '',
  pythonImage: 'python:3.12-slim',
  pythonTimeoutMs: 30000,
};

function configPath(root) { return path.join(root, 'config.json'); }
function llmConfigPath(root) { return path.join(root, 'llm.config.json'); }
function ttsConfigPath(root) {
  const json = path.join(root, 'tts.config.json');
  if (fs.existsSync(json)) return json;
  const legacy = path.join(root, 'tts.config');
  if (fs.existsSync(legacy)) return legacy;
  return json;
}

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

  if ('watchdog' in out) {
    const b = toBool(out.watchdog);
    out.watchdog = b === null ? DEFAULT_CONFIG.watchdog : b;
  }
  if ('hasBedroom' in out) {
    const b = toBool(out.hasBedroom);
    out.hasBedroom = b === null ? DEFAULT_CONFIG.hasBedroom : b;
  }
  if ('petOnlyBedroom' in out) {
    const b = toBool(out.petOnlyBedroom);
    out.petOnlyBedroom = b === null ? DEFAULT_CONFIG.petOnlyBedroom : b;
  }
  if ('splitWindows' in out) {
    const b = toBool(out.splitWindows);
    out.splitWindows = b === null ? DEFAULT_CONFIG.splitWindows : b;
  }
  if ('serverPort' in out) {
    const n = parseInt(out.serverPort, 10);
    out.serverPort = Number.isFinite(n) && n > 0 && n <= 65535 ? n : DEFAULT_CONFIG.serverPort;
  }
  if ('comfyPort' in out) {
    const n = parseInt(out.comfyPort, 10);
    out.comfyPort = Number.isFinite(n) && n > 0 && n <= 65535 ? n : DEFAULT_CONFIG.comfyPort;
  }
  if ('asrModelDir' in out) out.asrModelDir = String(out.asrModelDir ?? '').trim();
  if ('comfyHost' in out) out.comfyHost = String(out.comfyHost ?? '').trim() || DEFAULT_CONFIG.comfyHost;
  if ('comfyInputDir' in out) out.comfyInputDir = String(out.comfyInputDir ?? '').trim();
  if ('webSearchApiUrl' in out) out.webSearchApiUrl = String(out.webSearchApiUrl ?? '').trim();
  if ('webSearchApiKey' in out) out.webSearchApiKey = String(out.webSearchApiKey ?? '').trim();
  if ('webSearchTimeoutMs' in out) {
    const n = parseInt(out.webSearchTimeoutMs, 10);
    out.webSearchTimeoutMs = Number.isFinite(n) && n >= 1000 && n <= 60000 ? n : DEFAULT_CONFIG.webSearchTimeoutMs;
  }
  if ('webSearchMaxResults' in out) {
    const n = parseInt(out.webSearchMaxResults, 10);
    out.webSearchMaxResults = Number.isFinite(n) && n >= 1 && n <= 20 ? n : DEFAULT_CONFIG.webSearchMaxResults;
  }
  if ('pythonMode' in out) {
    const mode = String(out.pythonMode ?? '').trim().toLowerCase();
    out.pythonMode = mode === 'off' ? 'off' : 'docker';
  }
  if ('pythonDockerBin' in out) out.pythonDockerBin = String(out.pythonDockerBin ?? '').trim();
  if ('pythonImage' in out) out.pythonImage = String(out.pythonImage ?? '').trim() || DEFAULT_CONFIG.pythonImage;
  if ('pythonTimeoutMs' in out) {
    const n = parseInt(out.pythonTimeoutMs, 10);
    out.pythonTimeoutMs = Number.isFinite(n) && n >= 1000 && n <= 120000 ? n : DEFAULT_CONFIG.pythonTimeoutMs;
  }
  if ('embeddingUrl' in out) out.embeddingUrl = String(out.embeddingUrl ?? '').trim() || DEFAULT_CONFIG.embeddingUrl;
  if ('hwCompositing' in out) {
    const b = toBool(out.hwCompositing);
    out.hwCompositing = b === null ? DEFAULT_CONFIG.hwCompositing : b;
  }
  if ('capMain' in out) out.capMain = String(out.capMain ?? '').trim() || DEFAULT_CONFIG.capMain;
  if ('capRoom' in out) out.capRoom = String(out.capRoom ?? '').trim() || DEFAULT_CONFIG.capRoom;
  if ('debugPort' in out) {
    const n = parseInt(out.debugPort, 10);
    out.debugPort = Number.isFinite(n) && n > 0 && n <= 65535 ? n : 0;
  }
  if ('characterPath' in out) out.characterPath = String(out.characterPath ?? '').trim() || DEFAULT_CONFIG.characterPath;
  if ('petReadScope' in out) {
    const scope = String(out.petReadScope ?? '').trim().toLowerCase();
    out.petReadScope = ['all', 'global', '全部', '全部可读', '全盘'].includes(scope) ? 'all' : 'space';
  }
  if ('petReadBlacklist' in out) {
    const raw = Array.isArray(out.petReadBlacklist) ? out.petReadBlacklist : (out.petReadBlacklist == null ? [] : [out.petReadBlacklist]);
    out.petReadBlacklist = raw.map((p) => String(p ?? '').trim()).filter(Boolean);
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
  if ('ttsMode' in out) {
    const m = String(out.ttsMode ?? '').toLowerCase().trim();
    out.ttsMode = TTS_MODES.includes(m) ? m : DEFAULT_CONFIG.ttsMode;
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

function normalizeTtsServer(input) {
  const src = input && typeof input === 'object' ? input : {};
  const server = { ...DEFAULT_TTS_SERVER, ...src };
  const port = parseInt(server.port, 10);
  const startTimeout = parseInt(server.startTimeoutMs, 10);
  return {
    ...server,
    dir: String(server.dir ?? '').trim() || DEFAULT_TTS_SERVER.dir,
    python: String(server.python ?? '').trim() || DEFAULT_TTS_SERVER.python,
    config: String(server.config ?? '').trim() || DEFAULT_TTS_SERVER.config,
    gpu: String(server.gpu ?? '').trim() || DEFAULT_TTS_SERVER.gpu,
    port: Number.isFinite(port) && port > 0 && port <= 65535 ? port : DEFAULT_TTS_SERVER.port,
    startTimeoutMs: Number.isFinite(startTimeout) && startTimeout > 0 ? Math.min(startTimeout, 300000) : DEFAULT_TTS_SERVER.startTimeoutMs,
  };
}

// tts.config.json：app 放应用层设置，request 保持 GPT-SoVITS /tts 原生请求体
function normalizeTtsApp(input) {
  const src = input && typeof input === 'object' ? input : {};
  const idle = parseInt(src.idleSeconds, 10);
  const shortLimit = parseInt(src.shortTextLimit, 10);
  return {
    ...DEFAULT_TTS_APP,
    ...src,
    idleSeconds: Number.isFinite(idle) && idle > 0 ? Math.min(idle, 86400) : DEFAULT_TTS_APP.idleSeconds,
    url: String(src.url ?? DEFAULT_TTS_APP.url).trim() || DEFAULT_TTS_APP.url,
    server: normalizeTtsServer(src.server),
    shortTextLimit: Number.isFinite(shortLimit) && shortLimit > 0 ? Math.min(shortLimit, 1000) : DEFAULT_TTS_APP.shortTextLimit,
    splitShort: String(src.splitShort ?? DEFAULT_TTS_APP.splitShort).trim() || DEFAULT_TTS_APP.splitShort,
    splitLong: String(src.splitLong ?? DEFAULT_TTS_APP.splitLong).trim() || DEFAULT_TTS_APP.splitLong,
  };
}

function normalizeTtsRequest(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = { ...DEFAULT_TTS_REQUEST, ...src };
  const int = (v, fallback, min, max) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
  };
  const num = (v, fallback, min, max) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
  };
  out.text_lang = String(out.text_lang ?? '').trim() || DEFAULT_TTS_REQUEST.text_lang;
  out.prompt_lang = String(out.prompt_lang ?? '').trim() || DEFAULT_TTS_REQUEST.prompt_lang;
  out.media_type = String(out.media_type ?? '').trim() || DEFAULT_TTS_REQUEST.media_type;
  out.ref_audio_path = String(out.ref_audio_path ?? '').trim() || DEFAULT_TTS_REQUEST.ref_audio_path;
  out.prompt_text = String(out.prompt_text ?? '');
  out.text_split_method = String(out.text_split_method ?? '').trim() || DEFAULT_TTS_REQUEST.text_split_method;
  out.top_k = int(out.top_k, DEFAULT_TTS_REQUEST.top_k, 1, 100);
  out.top_p = num(out.top_p, DEFAULT_TTS_REQUEST.top_p, 0, 1);
  out.temperature = num(out.temperature, DEFAULT_TTS_REQUEST.temperature, 0, 2);
  if (![0, 1, 2, 3, true, false].includes(out.streaming_mode)) out.streaming_mode = DEFAULT_TTS_REQUEST.streaming_mode;
  return out;
}

function normalizeTtsConfig(input) {
  const src = input && typeof input === 'object' ? input : {};
  const hasSections = Boolean(src.app || src.request);
  return {
    app: normalizeTtsApp(hasSections ? src.app : {}),
    request: normalizeTtsRequest(hasSections ? src.request : src),
  };
}

function loadTtsConfig(root) {
  return normalizeTtsConfig(readJson(ttsConfigPath(root), {}));
}

function saveTtsConfig(root, cfg) {
  const data = normalizeTtsConfig(cfg);
  writeJson(path.join(root, 'tts.config.json'), data);
  return data;
}

function updateTtsConfig(root, patch) {
  const cur = normalizeTtsConfig(readJson(ttsConfigPath(root), {}));
  return saveTtsConfig(root, {
    app: { ...cur.app, ...(patch?.app || {}) },
    request: { ...cur.request, ...(patch?.request || {}) },
  });
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
  DEFAULT_TTS_CONFIG,
  DEFAULT_PROFILE_NAME,
  TTS_MODES,
  configPath,
  llmConfigPath,
  ttsConfigPath,
  readJson,
  writeJson,
  loadConfig,
  loadLlmConfig,
  loadTtsConfig,
  normalizeConfig,
  normalizeTtsConfig,
  saveConfig,
  saveTtsConfig,
  updateConfig,
  updateTtsConfig,
  resolveActiveProfile,
  profileExists,
  saveActiveProfile,
  parseCutoff,
  toBool,
};
