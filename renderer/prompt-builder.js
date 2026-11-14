// 提示词组装层：统一管理 System / 人设 / 回忆 / 主历史 / 无限唤醒阶段历史 / 台账 / 尾部思考与工具引导
// 所有协议与模型相关参数均由 llmConfig.promptPolicy 驱动，不再硬编码某一家模型的标签规范。
import { DEFAULT_PROMPT_POLICY, normalizeLlmConfig } from './llm-adapter.js';

export const THINK_MODULES = {
  pet_think: {
    instruction: DEFAULT_PROMPT_POLICY.tailInstruction + DEFAULT_PROMPT_POLICY.toolPrompt,
    prefill: DEFAULT_PROMPT_POLICY.tailPrefill,
  },
};

export const INF_WAKE_TEXT = '【系统提醒】现在是无限唤醒模式，你会一直被唤醒，自由行动吧，**不要主动停止输出或调用工具**，如果停止了也会再次被唤醒。主人现在大概率不在电脑前，你不用担心占用电脑资源。现在大概率是深夜，主人希望你多找点事干，不要老老实实挂机，那样主人的电费就白花了哦。你有很多工具，你可以访问主人所有的文件，虽然不能直接改写，但是可以复制到你的空间再改。无限唤醒的时候就算长思考也没关系，不用担心上下文长度。你可以大胆行动，不用担心太多';

export const FORCE_TOOL_NUDGE = DEFAULT_PROMPT_POLICY.forceToolNudge;

export function textOf(userContent) {
  if (typeof userContent === 'string') return userContent;
  if (Array.isArray(userContent)) {
    return userContent.find((c) => c && c.type === 'text')?.text || '';
  }
  return '';
}

export function formatMemories(hits) {
  if (!Array.isArray(hits) || !hits.length) return '';
  return '\n\n【相关回忆】（来自过去的对话，供你自然地想起，不要逐条复述）\n' +
    hits.map((h) => `- ${new Date(h.ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} ${h.text}`).join('\n');
}

// 历史里的图片一律折叠成文字占位：多模态历史会成倍撑大 prefill，只有最新一条保留图
export function pruneHistoryMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => Array.isArray(m?.content)
    ? { role: m.role, content: '[图片] ' + textOf(m.content) }
    : m);
}

export function buildSystemMessage({ systemPrompt = '', customPrompt = '', persona = '', extraSections = [] } = {}) {
  const parts = [String(systemPrompt || '').trim()];
  if (customPrompt && String(customPrompt).trim()) parts.push(String(customPrompt).trim());
  if (persona && String(persona).trim()) parts.push(String(persona).trim());
  if (Array.isArray(extraSections)) {
    for (const sec of extraSections) {
      if (sec && String(sec).trim()) parts.push(String(sec).trim());
    }
  }
  return { role: 'system', content: parts.filter(Boolean).join('\n\n') };
}

// 计算 Orama 回忆的插入下标（默认倒数第 5 轮会话位置：保留最近 4 轮历史 + 本轮共 5 轮在后，前面整段稳定命中 KV 缓存）
export function getMemoryInsertIndex(prunedMain = [], prunedInf = [], backTurns = 5) {
  const turnStarts = [];
  for (let i = 0; i < prunedMain.length; i++) {
    if (prunedMain[i]?.role === 'user' || turnStarts.length === 0) {
      turnStarts.push(i);
    }
  }
  for (let i = 0; i < prunedInf.length; i++) {
    turnStarts.push(prunedMain.length + i);
  }
  const keepHistTurns = Math.max(0, (Number(backTurns) || 5) - 1);
  if (turnStarts.length <= keepHistTurns) return 0;
  return turnStarts[turnStarts.length - keepHistTurns];
}

// 组装 Orama 检索 query：带上最近若干轮上下文（而不仅是一句话），优先保留最新内容并限制长度
export function buildMemoryQuery({
  mainHistory = [],
  infHistory = [],
  isInfiniteWake = false,
  userContent = '',
  recentTurns = 5,
  maxChars = 1200,
} = {}) {
  const currentText = textOf(userContent).trim();
  const combined = isInfiniteWake
    ? [
        ...(Array.isArray(mainHistory) ? mainHistory.slice(-4) : []),
        ...(Array.isArray(infHistory) ? infHistory.slice(-recentTurns) : []),
      ]
    : (Array.isArray(mainHistory) ? mainHistory.slice(-(recentTurns * 2)) : []);

  const lines = [];
  for (const m of combined) {
    const t = textOf(m?.content).trim();
    if (!t) continue;
    const tag = m.role === 'assistant' ? '[DeepSeek娘]' : '[用户]';
    lines.push(`${tag} ${t}`);
  }
  if (currentText && (!isInfiniteWake || !lines.length)) {
    lines.push(`[用户] ${currentText}`);
  }

  const kept = [];
  let total = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    let line = lines[i];
    if (line.length > maxChars) line = line.slice(0, maxChars);
    const nextTotal = total + line.length + (kept.length ? 1 : 0);
    if (nextTotal > maxChars && kept.length > 0) break;
    kept.unshift(line);
    total = nextTotal;
  }
  return kept.join('\n').trim();
}

export function buildUserTurn(userContent, toolLedger = '', { vision = true, extraInstruction = '' } = {}) {
  const extra = extraInstruction ? '\n\n' + String(extraInstruction).trim() : '';
  const userText = textOf(userContent) + String(toolLedger || '') + extra;
  if (Array.isArray(userContent)) {
    const textPart = userContent.find((c) => c && c.type === 'text');
    const imgPart = userContent.find((c) => c && c.type === 'image_url');
    if (imgPart && vision !== false) {
      return { role: 'user', content: [{ ...(textPart || { type: 'text' }), text: userText }, imgPart] };
    }
    const noVisionNote = imgPart && vision === false ? '\n（系统注：附带了一张截图，但当前纯文本模型无法看图）' : '';
    return { role: 'user', content: userText + noVisionNote };
  }
  return { role: 'user', content: userText };
}

export function buildTailMessages({
  policy = DEFAULT_PROMPT_POLICY,
  thinkMode,
  forceToolPrefill = false,
  isInfiniteWake = false,
} = {}) {
  const effectiveThink = thinkMode ?? policy.thinkMode ?? 'pet_think';
  if (forceToolPrefill && isInfiniteWake) {
    if (policy.forceToolMode === 'tool_choice_required') {
      return {
        tailMessages: [{ role: 'user', content: policy.forceToolNudge || FORCE_TOOL_NUDGE }],
        inlineLastUserInstruction: '',
        consumedForceToolPrefill: true,
        forceRequiredTool: true,
      };
    }
    const tailMessages = [{ role: 'user', content: policy.forceToolNudge || FORCE_TOOL_NUDGE }];
    if (policy.forceToolPrefillText) {
      tailMessages.push({ role: 'assistant', content: policy.forceToolPrefillText });
    }
    return {
      tailMessages,
      inlineLastUserInstruction: '',
      consumedForceToolPrefill: true,
      forceRequiredTool: false,
    };
  }

  if (effectiveThink === 'off' || policy.tailMode === 'none') {
    return {
      tailMessages: [],
      inlineLastUserInstruction: '',
      consumedForceToolPrefill: false,
      forceRequiredTool: false,
    };
  }

  const instruction = [policy.tailInstruction || '', policy.toolPrompt || ''].filter(Boolean).join('');
  if (policy.tailMode === 'user_instruction') {
    return {
      tailMessages: [],
      inlineLastUserInstruction: instruction,
      consumedForceToolPrefill: false,
      forceRequiredTool: false,
    };
  }

  // 默认 prefill_assistant：尾部追加指令 + assistant 预填充
  const tailMessages = [];
  if (instruction) tailMessages.push({ role: 'user', content: instruction });
  if (policy.tailPrefill) tailMessages.push({ role: 'assistant', content: policy.tailPrefill });
  return {
    tailMessages,
    inlineLastUserInstruction: '',
    consumedForceToolPrefill: false,
    forceRequiredTool: false,
  };
}

export function assemblePrompt({
  systemPrompt = '',
  customPrompt,
  persona = '',
  memories = [],
  memoryBackTurns = 5,
  extraSystemSections = [],
  mainHistory = [],
  infHistory = [],
  isInfiniteWake = false,
  userContent = '',
  toolLedger = '',
  thinkMode,
  llmConfig = null,
  forceToolPrefill = false,
  continueBaseMsgs = null,
} = {}) {
  if (Array.isArray(continueBaseMsgs)) {
    return {
      messages: continueBaseMsgs.slice(),
      consumedForceToolPrefill: false,
      forceRequiredTool: false,
    };
  }

  const cfg = normalizeLlmConfig(llmConfig);
  const policy = cfg.promptPolicy;
  const tail = buildTailMessages({
    policy,
    thinkMode: thinkMode ?? policy.thinkMode,
    forceToolPrefill,
    isInfiniteWake,
  });

  // system 保持纯静态（不含动态召回记忆），customPrompt 紧贴系统提示词下边、人设档案前边
  const systemMsg = buildSystemMessage({
    systemPrompt,
    customPrompt: customPrompt ?? cfg.customPrompt,
    persona,
    extraSections: extraSystemSections,
  });

  // 主历史始终可作为只读背景注入；开启无限唤醒时在其后接上本阶段纯 assistant 记录 infHistory
  const prunedMain = pruneHistoryMessages(mainHistory);
  const prunedInf = isInfiniteWake ? pruneHistoryMessages(infHistory) : [];
  const combinedHistory = [...prunedMain, ...prunedInf];
  const memText = formatMemories(memories).trim();
  if (memText) {
    const insertIdx = getMemoryInsertIndex(prunedMain, prunedInf, memoryBackTurns);
    combinedHistory.splice(insertIdx, 0, { role: 'user', content: memText });
  }
  const lastUser = buildUserTurn(userContent, toolLedger, {
    vision: cfg.capabilities.vision,
    extraInstruction: tail.inlineLastUserInstruction,
  });

  const messages = [
    systemMsg,
    ...combinedHistory,
    lastUser,
    ...tail.tailMessages,
  ];

  return {
    messages,
    consumedForceToolPrefill: tail.consumedForceToolPrefill,
    forceRequiredTool: tail.forceRequiredTool,
  };
}
