// 提示词组装层：统一管理 System / 人设 / 回忆 / 主历史 / 无限唤醒阶段历史 / 台账 / 思考与工具预填充
// 后续调整提示词结构、历史裁剪或补充上下文注入段，只需修改本模块即可。

export const THINK_MODULES = {
  pet_think: {
    instruction: '思考要求：必须在pet_think标签内。必须根据问题难度自行选择思考长度：平时聊天不要思考，直接输出</pet_think>然后回复。遇到简单问题简短思考；需要读文件、分析、多步推理或创建内容的复杂问题则进行充分思考（分析问题、考虑是否调用工具、回忆相关旧事）。思考之后记得调用工具或回复。\n 思考时必须以"人设档案"的身份、性格和口吻进行第一人称思考，禁止称呼“用户”，必须称呼“主人”。\n # 禁止思考自身身份（如deepseek娘）或思考语气（如傲娇嘴硬）等，必须直接带入身份，你不是在扮演一个桌宠，你就是桌宠。\n # 如果你打算用工具，确保在思考或回复之后输出<tool_call>！\n 不要用文字罗列“我用了哪些工具”来冒充调用记录，要用工具就必须真的输出<tool_call>！\n ',
    prefill: '<think>跳过原生思维链，接下来根据情形决定是否进行pet_think以及思考强度\n</think>\n',
  },
};

export const INF_WAKE_TEXT = '现在是无限唤醒模式，你会一直被唤醒，自由行动吧，**不要主动停止输出或调用工具**，如果停止了也会再次被唤醒。主人现在大概率不在电脑前，你不用担心占用电脑资源。现在大概率是深夜，主人希望你多找点事干，不要老老实实挂机，那样主人的电费就白花了哦。你有很多工具，你可以访问主人所有的文件，虽然不能直接改写，但是可以复制到你的空间再改。无限唤醒的时候就算长思考也没关系，不用担心上下文长度。你可以大胆行动，不用担心太多';

export const FORCE_TOOL_NUDGE = '（你上一轮只是在重复说"卡住了/这就去翻"却并没有真的调用工具。这一轮别再空谈，立刻调用一个合适的工具动手：read_file / list_dir / edit_file / file_tool 等。）';

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

export function buildSystemMessage({ systemPrompt = '', persona = '', extraSections = [] } = {}) {
  const parts = [String(systemPrompt || '').trim()];
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

export function buildUserTurn(userContent, toolLedger = '') {
  const userText = textOf(userContent) + String(toolLedger || '');
  if (Array.isArray(userContent)) {
    const textPart = userContent.find((c) => c && c.type === 'text');
    const imgPart = userContent.find((c) => c && c.type === 'image_url');
    const parts = [{ ...(textPart || { type: 'text' }), text: userText }];
    if (imgPart) parts.push(imgPart);
    return { role: 'user', content: parts };
  }
  return { role: 'user', content: userText };
}

export function assemblePrompt({
  systemPrompt = '',
  persona = '',
  memories = [],
  memoryBackTurns = 5,
  extraSystemSections = [],
  mainHistory = [],
  infHistory = [],
  isInfiniteWake = false,
  userContent = '',
  toolLedger = '',
  thinkMode = 'pet_think',
  forceToolPrefill = false,
  continueBaseMsgs = null,
} = {}) {
  if (Array.isArray(continueBaseMsgs)) {
    return { messages: continueBaseMsgs.slice(), consumedForceToolPrefill: false };
  }

  // system 保持纯静态（不含动态召回记忆），最大化复用首段 KV 缓存
  const systemMsg = buildSystemMessage({
    systemPrompt,
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
  const lastUser = buildUserTurn(userContent, toolLedger);

  const messages = [
    systemMsg,
    ...combinedHistory,
    lastUser,
  ];

  // 全新提问首轮：拼入思考指令与预填充（或反死循环强制 <tool_call> 预填充）
  let consumedForceToolPrefill = false;
  const mod = thinkMode === 'off' ? null : THINK_MODULES.pet_think;
  if (forceToolPrefill && isInfiniteWake) {
    consumedForceToolPrefill = true;
    messages.push({ role: 'user', content: FORCE_TOOL_NUDGE });
    messages.push({ role: 'assistant', content: '<tool_call>\n' });
  } else if (mod) {
    messages.push({ role: 'user', content: mod.instruction });
    messages.push({ role: 'assistant', content: mod.prefill });
  }

  return { messages, consumedForceToolPrefill };
}
