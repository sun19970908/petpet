// 通用 LLM 配置层（主进程）：只保存标准 OpenAI 兼容 API 字段与桌宠适配参数，不绑定特定厂商逻辑
const fs = require('fs');
const path = require('path');

const DEFAULT_PROFILE = {
  baseUrl: 'http://127.0.0.1:11435/v1/chat/completions',
  apiKey: '',
  model: 'strata-nothink',
  requestDefaults: {
    temperature: 0.8,
    max_tokens: 65536,
  },
  capabilities: {
    vision: true,
    nativeTools: true,
    keepVisionToolsWhenTextOnly: false,
    preserveReasoningInHistory: false,
    prefixMode: 'continue_final_message',
  },
  promptPolicy: {
    thinkMode: 'pet_think',
    tailMode: 'prefill_assistant',
    tailInstruction:
      '思考要求：必须在pet_think标签内。必须根据问题难度自行选择思考长度：平时聊天不要思考，直接输出</pet_think>然后回复。遇到简单问题简短思考；需要读文件、分析、多步推理或创建内容的复杂问题则进行充分思考（分析问题、考虑是否调用工具、回忆相关旧事）。思考之后记得调用工具或回复。\n 思考时必须以"人设档案"的身份、性格和口吻进行第一人称思考，禁止称呼“用户”，必须称呼“主人”。\n # 禁止思考自身身份（如deepseek娘）或思考语气（如傲娇嘴硬）等，必须直接带入身份，你不是在扮演一个桌宠，你就是桌宠。',
    toolPrompt:
      '\n # 如果你打算用工具，确保在思考或回复之后输出<tool_call>！\n 不要用文字罗列“我用了哪些工具”来冒充调用记录，要用工具就必须真的输出<tool_call>！\n ',
    tailPrefill:
      '<think>跳过原生思维链，接下来根据情形决定是否进行pet_think以及思考强度\n</think>\n',
    parseTextToolCalls: true,
    forceToolMode: 'prefill_tag',
    forceToolNudge:
      '（你上一轮只是在重复说"卡住了/这就去翻"却并没有真的调用工具。这一轮别再空谈，立刻调用一个合适的工具动手：read_file / list_dir / edit_file / file_tool 等。）',
    forceToolPrefillText: '<tool_call>\n',
  },
};

function mergeProfile(base, override) {
  const b = base || {};
  const o = override || {};
  return {
    ...b,
    ...o,
    headers: {
      ...(b.headers || {}),
      ...(o.headers || {}),
    },
    requestDefaults: {
      ...(b.requestDefaults || {}),
      ...(o.requestDefaults || {}),
    },
    capabilities: {
      ...(b.capabilities || {}),
      ...(o.capabilities || {}),
    },
    promptPolicy: {
      ...(b.promptPolicy || {}),
      ...(o.promptPolicy || {}),
    },
  };
}

function createLlmConfigManager({ APP_ROOT, getConfig, cliProfile = null, envThinkMode = null }) {
  const LLM_CONFIG_FILE = path.join(APP_ROOT, 'llm.config.json');

  function readLlmFile() {
    try {
      return JSON.parse(fs.readFileSync(LLM_CONFIG_FILE, 'utf8'));
    } catch {
      return {};
    }
  }

  function getServerConfig() {
    const fileCfg = readLlmFile();
    const appCfg = typeof getConfig === 'function' ? (getConfig() || {}) : {};
    const profileName = String(
      cliProfile ||
      process.env.PET_LLM_PROFILE ||
      appCfg.llmProfile ||
      fileCfg.activeProfile ||
      'strata'
    ).trim() || 'strata';

    const fileProfile = fileCfg.profiles && typeof fileCfg.profiles === 'object' ? fileCfg.profiles[profileName] : null;
    const appInline = appCfg.llm && typeof appCfg.llm === 'object' ? appCfg.llm : null;

    let merged = mergeProfile(DEFAULT_PROFILE, fileProfile);
    if (appInline) merged = mergeProfile(merged, appInline);

    if (envThinkMode === 'off') {
      merged.promptPolicy.thinkMode = 'off';
    }

    let apiKey = String(merged.apiKey || '').trim();
    if (/^your-.*-key-here$/i.test(apiKey)) apiKey = '';
    if (!apiKey && process.env.LLM_API_KEY) {
      apiKey = String(process.env.LLM_API_KEY).trim();
    }

    const baseUrl = String(merged.baseUrl || DEFAULT_PROFILE.baseUrl).trim();

    return {
      ...merged,
      activeProfile: profileName,
      apiKey,
      baseUrl,
      hasApiKey: Boolean(apiKey),
    };
  }

  function getPublicConfig() {
    const full = getServerConfig();
    const { apiKey, baseUrl, headers, ...safe } = full;
    return safe;
  }

  return {
    getServerConfig,
    getPublicConfig,
    DEFAULT_PROFILE,
  };
}

module.exports = { createLlmConfigManager, DEFAULT_PROFILE };
