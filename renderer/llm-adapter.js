// 通用 LLM 协议与桌宠适配层：只处理标准 OpenAI 请求格式、模型能力与尾缀续写策略，不耦合具体厂商

export const DEFAULT_PROMPT_POLICY = {
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
};

export const DEFAULT_CAPABILITIES = {
  vision: true,
  nativeTools: true,
  keepVisionToolsWhenTextOnly: false,
  preserveReasoningInHistory: false,
  prefixMode: 'continue_final_message',
};

export const DEFAULT_REQUEST_DEFAULTS = {
  temperature: 0.8,
  max_tokens: 65536,
};

export const DEFAULT_LLM_CONFIG = {
  activeProfile: 'strata',
  model: 'strata-nothink',
  requestDefaults: DEFAULT_REQUEST_DEFAULTS,
  capabilities: DEFAULT_CAPABILITIES,
  promptPolicy: DEFAULT_PROMPT_POLICY,
};

export function normalizeLlmConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const reqSrc = src.requestDefaults && typeof src.requestDefaults === 'object' ? src.requestDefaults : {};
  const capSrc = src.capabilities && typeof src.capabilities === 'object' ? src.capabilities : {};
  const policySrc = src.promptPolicy && typeof src.promptPolicy === 'object' ? src.promptPolicy : {};
  return {
    activeProfile: src.activeProfile || DEFAULT_LLM_CONFIG.activeProfile,
    model: src.model || DEFAULT_LLM_CONFIG.model,
    hasApiKey: Boolean(src.hasApiKey),
    requestDefaults: {
      ...DEFAULT_REQUEST_DEFAULTS,
      ...reqSrc,
    },
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      ...capSrc,
    },
    promptPolicy: {
      ...DEFAULT_PROMPT_POLICY,
      ...policySrc,
    },
  };
}

export function sanitizeMessagesForVision(messages, visionSupported = true) {
  if (visionSupported !== false || !Array.isArray(messages)) return messages;
  return messages.map((m) => {
    if (!m || !Array.isArray(m.content)) return m;
    const hasImg = m.content.some((c) => c && c.type === 'image_url');
    if (!hasImg) return m;
    const text = m.content
      .filter((c) => c && c.type === 'text')
      .map((c) => c.text || '')
      .join('\n')
      .trim();
    const note = '（系统注：附带了一张屏幕/房间截图，但当前纯文本模型不支持查看图片）';
    return { ...m, content: text ? `${text}\n${note}` : note };
  });
}

export function filterToolsForConfig(tools, llmConfig) {
  const cfg = normalizeLlmConfig(llmConfig);
  const caps = cfg.capabilities;
  if (!caps.nativeTools || !Array.isArray(tools) || !tools.length) return undefined;
  if (caps.vision || caps.keepVisionToolsWhenTextOnly) return tools;
  return tools.filter((t) => {
    const name = t?.function?.name;
    return name !== 'take_screenshot' && name !== 'look_at_room';
  });
}

export function getPrefillState(messages) {
  const last = Array.isArray(messages) ? messages[messages.length - 1] : null;
  const hasTrailingAssistant = last?.role === 'assistant';
  const cfmText = hasTrailingAssistant ? String(last.content || '') : '';
  return {
    hasTrailingAssistant,
    startInThink: (cfmText.match(/<(?:pet_)?think>/g) || []).length > (cfmText.match(/<\/(?:pet_)?think>/g) || []).length,
    startInTool: (cfmText.match(/<(?:tool_call|invoke)>/g) || []).length > (cfmText.match(/<\/(?:tool_call|invoke)>/g) || []).length,
  };
}

export function applyContinuationToMessages(messages, prefixMode = 'continue_final_message') {
  const out = Array.isArray(messages) ? messages.slice() : [];
  const lastIdx = out.length - 1;
  const last = lastIdx >= 0 ? out[lastIdx] : null;
  if (!last || last.role !== 'assistant') {
    return { messages: out, extraPayload: {} };
  }
  if (prefixMode === 'message_prefix') {
    out[lastIdx] = { ...last, prefix: true };
    return { messages: out, extraPayload: {} };
  }
  if (prefixMode === 'none') {
    out.push({ role: 'user', content: '请接着上面的内容继续。' });
    return { messages: out, extraPayload: {} };
  }
  return { messages: out, extraPayload: { continue_final_message: true } };
}

export function buildChatPayload({
  llmConfig,
  messages,
  tools,
  noTools = false,
  forceRequiredTool = false,
} = {}) {
  const cfg = normalizeLlmConfig(llmConfig);
  const caps = cfg.capabilities;
  const visionClean = sanitizeMessagesForVision(messages, caps.vision);
  const { messages: adaptedMsgs, extraPayload } = applyContinuationToMessages(visionClean, caps.prefixMode);
  const activeTools = noTools ? undefined : filterToolsForConfig(tools, cfg);
  const toolChoice = activeTools?.length ? (forceRequiredTool ? 'required' : 'auto') : undefined;

  return {
    ...cfg.requestDefaults,
    model: cfg.model,
    messages: adaptedMsgs,
    ...(activeTools ? { tools: activeTools, tool_choice: toolChoice } : {}),
    stream: true,
    stream_options: { include_usage: true },
    ...extraPayload,
  };
}
