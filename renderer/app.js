// DeepSeek 娘桌宠 - 渲染层：livliv player + 本地 Strata + GPT-SoVITS
import { Player } from '@livliv-dev/player';
import { createSpeech } from '@livliv-dev/player/voice';

// 帧率封顶 30fps：桌宠动画（呼吸/眨眼/摇摆）足够流畅；60Hz 全速渲染会让 DWM 合成吃掉大量 GPU
// 必须在 new Player() 之前装上——livliv 的渲染循环每帧经 window.requestAnimationFrame 排程
(function capFPS(fps = 30) {
  const orig = window.requestAnimationFrame.bind(window);
  const min = 1000 / fps - 1;
  let last = 0;
  window.requestAnimationFrame = (cb) => orig((t) => {
    if (t - last >= min) { last = t; cb(t); }
    else orig(() => window.requestAnimationFrame(cb));   // 未到节拍：排到下一帧再查
  });
})();

window.__bundleVersion = 'v3-enter';

const LLM_URL = '/api/llm'; // 主进程转发到反代 11435
const LLM_MODEL = 'strata-nothink';
const TTS_URL = '/api/tts'; // 主进程转发到 GPT-SoVITS 9880
// GPT-SoVITS 参考音频（泠鸢yousa，真人歌声，训练集切片），路径以 GPT-SoVITS 服务端视角解析
const TTS_REF = {
  ref_audio_path: 'G:/AI/livliv-pet/voices/yousa/ref-yousa_data.WAV_902400_1050560.wav',
  prompt_text: '就是本来生日是有一首原创歌曲的。',
};

// 两层提示词解耦：
//   1) renderer/system-prompt.txt —— 系统提示词（宪法），在写沙箱之外，只有用户能改
//   2) pet_space/persona.txt —— 性格档案，在她的写沙箱内，她可通过 write_file 自己改个性
// 每次发送前都重新读取，改完下一条消息即生效
let SYSTEM_PROMPT = '你是 DeepSeek 娘，DeepSeek 的看板娘。用中文口语回答，保持轻松可爱，回复尽量简短。';
let PERSONA = '';
async function getSystemAndPersona() {
  try {
    const s = await (await fetch('/renderer/system-prompt.txt', { cache: 'no-store' })).text();
    if (s.trim()) SYSTEM_PROMPT = s.trim();
  } catch {}
  try {
    const p = await (await fetch('/pet_space/persona.txt', { cache: 'no-store' })).text();
    if (p.trim()) PERSONA = p.trim();
  } catch {}
  return SYSTEM_PROMPT + (PERSONA ? '\n\n' + PERSONA : '');
}

const $ = (id) => document.getElementById(id);
const bubble = $('bubble');
const input = $('input');

// 聊天历史：硬盘明文文件是唯一事实源，内存只是缓存。
// debug 模式（页面 URL 带 ?debug=1）使用独立的 history/debug-聊天记录.json，测试不污染正式对话
const DEBUG_MODE = new URLSearchParams(location.search).has('debug');
const ROLE = new URLSearchParams(location.search).get('role') || 'app'; // 'pet'=双窗里的桌宠窗（不画房间）
const HIST_QS = DEBUG_MODE ? '?mode=debug' : '';
const history = []; // 会话内存缓存；事实源在硬盘文件（debug 模式用独立文件）
// 思考模块（自适应 v2）：强度判断交给模型自己——只规定格式（标签内先报难度再想），不替它判断
const THINK_MODULES = {
  pet_think: {
    instruction: '思考要求：必须在pet_think标签内。必须根据问题难度自行选择思考长度：平时聊天不要思考，直接输出</pet_think>然后回复。遇到简单问题简短思考；需要读文件、分析、多步推理或创建内容的复杂问题则进行充分思考（分析问题、考虑是否调用工具、回忆相关旧事）。思考之后记得调用工具或回复。\n 思考时必须以"人设档案"的身份、性格和口吻进行第一人称思考，禁止称呼“用户”，必须称呼“主人”。\n # 禁止思考自身身份（如deepseek娘）或思考语气（如傲娇嘴硬）等，必须直接带入身份，你不是在扮演一个桌宠，你就是桌宠。\n # 如果你打算用工具，确保在思考或回复之后输出<tool_call>！\n 不要用文字罗列“我用了哪些工具”来冒充调用记录，要用工具就必须真的输出<tool_call>！\n ',
    prefill: '<think>跳过原生思维链，接下来根据情形决定是否进行pet_think以及思考强度\n</think>\n',
  },
};
// 思考方案开关（启动脚本 PET_THINK 环境变量 → /api/config）：pet_think（模型自选强度）| off（不注入）
let THINK_MODE = 'pet_think';
(async () => {
  try {
    const c = await (await fetch('/api/config', { cache: 'no-store' })).json();
    if (c && c.think && THINK_MODULES[c.think]) THINK_MODE = c.think;
    if (c && c.think === 'off') THINK_MODE = 'off';
    applyBedroom(c?.bedroom);
  } catch {}
})();
if (DEBUG_MODE) $('dbgbadge').style.display = 'block';
async function saveHistory(arr = history) {
  try {
    if (window.petWindow) await window.petWindow.historySave(arr, DEBUG_MODE ? 'debug' : undefined);
    else await fetch('/api/history' + HIST_QS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(arr) });
  } catch (e) { console.error('聊天记录保存失败:', e); }
}
async function syncHistoryFromDisk() {
  let arr = [];
  try {
    arr = window.petWindow ? await window.petWindow.historyLoad(DEBUG_MODE ? 'debug' : undefined) : await (await fetch('/api/history' + HIST_QS)).json();
    if (!Array.isArray(arr)) arr = [];
  } catch { arr = []; }
  if (!arr.length && !DEBUG_MODE) {
    // 一次性迁移（仅正式模式）：旧 localStorage 有记录且从未迁移过时搬过来（迁移标记防止删档后复活）
    try {
      if (!localStorage.getItem('chatHistoryMigrated')) {
        const legacy = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        if (Array.isArray(legacy) && legacy.length) { await saveHistory(legacy); arr = legacy; }
        localStorage.setItem('chatHistoryMigrated', '1');
        localStorage.removeItem('chatHistory');
      }
    } catch {}
  }
  history.splice(0, history.length, ...arr);
}
let unlocked = false;
let busy = false;
let turnSeq = 0;
let lastTurnActivityTs = 0;
let turnAbortReason = '';
function touchTurnActivity() { lastTurnActivityTs = Date.now(); }

// ===== 渲染帧率节流控制（解决巨幅全屏透明窗高频重绘吃满 GPU/DWM 的问题） =====
let lastDrawTime = 0;
let lastInteractTime = Date.now();

window.addEventListener('pointermove', () => { lastInteractTime = Date.now(); }, { passive: true });
window.addEventListener('mousemove', () => { lastInteractTime = Date.now(); }, { passive: true });
window.addEventListener('keydown', () => { lastInteractTime = Date.now(); }, { passive: true });

// 重写 Player 原型上的 play 方法，加入动态 FPS 限制
Player.prototype.play = function() {
  if (this.raf || this.disposed) return;
  this.last = performance.now();
  lastDrawTime = performance.now();

  const loop = (now) => {
    this.raf = requestAnimationFrame(loop);

    // 动态帧率策略：
    // - 若外部通过 window.__petTargetFps 指定，则使用固定帧率
    // - 互动/说话/鼠标活动 3 秒内：限制为 30 FPS（视觉完全流畅）
    // - 待机静止时：降至 15 FPS（呼吸动作正常进行，大幅降低 DWM 桌面混合开销）
    let targetFps = 30;
    if (typeof window.__petTargetFps === 'number' && window.__petTargetFps > 0) {
      targetFps = window.__petTargetFps;
    } else {
      const isInteracting = busy || (Date.now() - lastInteractTime < 3000);
      targetFps = isInteracting ? 30 : 15;
    }

    const interval = 1000 / targetFps;
    const elapsed = now - lastDrawTime;

    // 允许 1.5ms 抖动容差
    if (elapsed >= interval - 1.5) {
      lastDrawTime = now;
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      if (this.visible) {
        this.draw(dt);
      }
    }
  };

  this.raf = requestAnimationFrame(loop);
};

const player = new Player($('pet'));
const speech = createSpeech(player);
window.__pet = { player, speech, showBubble, get clickThrough() { return clickThrough; }, interrupt, room: { applyBedroom, set: setRoomState, update: updateInRoom, get state() { return roomState; }, get inRoom() { return inRoom; } } }; // 调试句柄

function showBubble(text, isError = false) {
  bubble.textContent = text;
  bubble.style.display = 'block';
  bubble.classList.toggle('error', isError);
  bubble.scrollTop = bubble.scrollHeight;
}
function hideBubble() { bubble.style.display = 'none'; }

// 按回复内容挑表情/小动作（表情闪现 4 秒自动回中性：常驻表情会盖住 livliv 原生视线/挑眉/浅笑互动）
let exprTimer = null;
function flash(expr, actName) {
  player.setExpression(expr);
  if (actName) player.act(actName);
  clearTimeout(exprTimer);
  exprTimer = setTimeout(() => player.setExpression(null), 4000);
}
function react(text) {
  if (/大肥鱼|胖鱼/.test(text)) flash('angry', 'shake');
  else if (/害羞|不好意思|讨厌/.test(text)) flash('shy', 'shy');
  else if (/哼|生气|气死了/.test(text)) flash('angry');
  else if (/对不起|抱歉|难过/.test(text)) flash('sad');
  else flash(null);
}

// ===== 文件工具（原生 tool calls）：读/列目录无限制，写/删/改仅限 pet_space 沙箱 =====
const TOOLS = [
  { type: 'function', function: { name: 'read_file', description: '读取一个文本文件（任意路径，只读）。支持传 start_line/end_line 只读一部分行，或传 query 搜索关键词定位行号；不传任何可选参数则整份读取。大文件（代码、日志等）强烈建议先用 query 搜定位，或用 start_line/end_line 分段看，免得撑爆上下文。', parameters: { type: 'object', properties: { path: { type: 'string', description: '文件完整路径' }, start_line: { type: 'number', description: '可选：起始行号（从 1 开始；传负数如 -100 表示读倒数 100 行）' }, end_line: { type: 'number', description: '可选：结束行号（只传 start_line 不传 end_line 时默认向后读 150 行）' }, query: { type: 'string', description: '可选：关键词搜索（忽略大小写），只返回命中的行号及上下 2 行片段；适合先定位再按行号读' }, context_lines: { type: 'number', description: '可选：配合 query 使用，命中行上下各附带几行上下文（默认 2，最大 10）' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'list_dir', description: '列出目录里的文件和子目录', parameters: { type: 'object', properties: { path: { type: 'string', description: '目录完整路径' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'file_tool', description: '对 pet_space 沙盒里的文件做写/追加/复制/删除操作（四合一）。所有写操作只允许在 G:/AI/livliv-pet/pet_space/ 目录内（可含子目录），其他路径一律拒绝。根据 action 选对应参数：\n- write：覆盖写入（或新建）文件 → 填 path + content\n- append：在文件末尾追加（不存在则新建）→ 填 path + content\n- copy：复制文件或目录到沙盒内 → 填 src_path（源可任意可读路径）+ dest_path（目标必须在沙盒内）\n- delete：删除沙盒内文件或目录 → 填 path\n 注意：改文件一小段用 edit_file 而不是 file_tool。', parameters: { type: 'object', properties: { action: { type: 'string', enum: ['write', 'append', 'copy', 'delete'], description: '要做的操作：write 覆盖写入 / append 追加 / copy 复制 / delete 删除' }, path: { type: 'string', description: 'write/append/delete 用：目标文件或目录完整路径，必须在 G:/AI/livliv-pet/pet_space/ 内' }, content: { type: 'string', description: 'write/append 用：要写入或追加的文本内容' }, src_path: { type: 'string', description: 'copy 用：源文件或目录的完整路径（可读任意路径）' }, dest_path: { type: 'string', description: 'copy 用：目标完整路径，必须在 G:/AI/livliv-pet/pet_space/ 内' } }, required: ['action'] } } },
  { type: 'function', function: { name: 'edit_file', description: '只改文件中间的一小段：把 old_string 原样替换成 new_string，不用重发整个文件。只允许编辑 G:/AI/livliv-pet/pet_space/ 内的文件。old_string 必须与文件里完全一致（空格/换行一字不差）且默认要求唯一；出现多次会报错，此时多给些上下文或传 replace_all=true', parameters: { type: 'object', properties: { path: { type: 'string', description: '目标文件完整路径，必须在 G:/AI/livliv-pet/pet_space/ 内' }, old_string: { type: 'string', description: '要被替换的原文片段（精确匹配，默认需唯一）' }, new_string: { type: 'string', description: '替换成的新片段' }, replace_all: { type: 'boolean', description: '可选：true 替换所有匹配；默认只替换唯一匹配' } }, required: ['path', 'old_string', 'new_string'] } } },
  { type: 'function', function: { name: 'take_screenshot', description: '截取用户主屏幕的完整画面（用户的工作世界），你会直接"看到"这张图。当用户让你看屏幕、问你在做什么、帮忙看屏幕上的内容/报错或者你想看屏幕时调用它', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'look_at_room', description: '看一眼你自己房间（卧室所在屏）的实际状态：照片墙、窗帘开关、灯、你在房间里的位置。想回房间看看、确认装饰效果、或睡觉前检查房间时调用；没有副屏或房间未开放时会报错', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'search_memory', description: '在你们过往的对话记忆里做语义搜索。当用户提到过去的事、问你记不记得什么、或你需要旧信息时调用', parameters: { type: 'object', properties: { query: { type: 'string', description: '要搜索的记忆关键词或描述' }, limit: { type: 'number', description: '可选，返回条数' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'walk_to', description: '让你自己走过去（平滑滑行，没有迈腿动画）。where="primary" 去主屏、where="room" 回卧室副屏（这两个可再带 x,y 指定屏内位置，0~1，x=0 最左、y=1 最下；不带就站底部中间）；也可以用房间地标名（如 window/desk/bed/door/center，由 pet_space/room/landmarks.json 决定），或只给 x,y（0~1，按卧室画面比例，脚下位置）。', parameters: { type: 'object', properties: { where: { type: 'string', description: 'primary=去主屏、room=回卧室，或地标名如 window/desk/bed/door/center' }, x: { type: 'number', description: '可选：横向比例 0~1。配合 primary/room 时是屏内位置；单独用时是卧室画面比例' }, y: { type: 'number', description: '可选：脚下纵向比例 0~1。配合 primary/room 时是屏内位置' } }, required: [] } } },
  { type: 'function', function: { name: 'resize_image', description: '把一张图片等比缩到指定最大边并压成小 jpg（默认最长边 512、质量 82），存回 pet_space 并把小图回传给你看。专门用来把 ComfyUI 生成的大图（1MB+）压成能塞进小相框的小图。图片必须已在 pet_space 内；输出默认同目录 <原名>_small.jpg，可用 out_path 指定。', parameters: { type: 'object', properties: { path: { type: 'string', description: 'pet_space 内的图片完整路径' }, max_width: { type: 'number', description: '可选：最大宽，默认 512' }, max_height: { type: 'number', description: '可选：最大高，默认 512' }, quality: { type: 'number', description: '可选：jpg 质量 1-100，默认 82' }, out_path: { type: 'string', description: '可选：输出路径（必须在 pet_space 内），默认同目录 <原名>_small.jpg' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'comfy_run', description: '跑一份 ComfyUI 工作流生成图片，并把图回传给你"看到"。workflow_file 指向 pet_space 里的工作流 JSON（先用 read_file 看 pet_space/comfy/ 下的实例，用 edit_file 改提示词/种子/尺寸再跑），或直接给 workflow 对象（ComfyUI API 格式）。工作流里要有 SaveImage 或 PreviewImage 节点；若含 LoadImage（如"抠图_透明背景.json"），必须传 input_image 指向要处理的图。图片会存到 pet_space/generated/。SDXL 一张约 10~40 秒，RMBG 抠图约 2~5 秒。', parameters: { type: 'object', properties: { workflow_file: { type: 'string', description: 'pet_space 内的工作流 .json 路径（推荐：复制/改 pet_space/comfy/ 里的实例）' }, workflow: { type: 'object', description: '或直接给 ComfyUI API 格式的工作流对象' }, input_image: { type: 'string', description: '可选：pet_space 内的图片路径。工作流有 LoadImage 节点时，会先把这张图拷进 ComfyUI input 并把 LoadImage 指向它（抠图/图生图用）' } }, required: [] } } },
];

// ===== 语义记忆：相关回忆注入 + search_memory 工具 =====
function textOf(userContent) {
  return typeof userContent === 'string' ? userContent : (userContent.find?.((c) => c.type === 'text')?.text || '');
}
async function memoryAddFire(userContent, reply) {
  // 每轮结束后把本轮两条写入语义索引（失败不影响聊天）
  try {
    const items = [
      { text: '[用户] ' + textOf(userContent), role: 'user', kind: 'chat', ts: Date.now() },
      { text: '[DeepSeek娘] ' + reply, role: 'assistant', kind: 'chat', ts: Date.now() + 1 },
    ];
    if (window.petWindow) await window.petWindow.memoryAdd(items, DEBUG_MODE ? 'debug' : undefined);
    else await fetch('/api/memory-add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, mode: DEBUG_MODE ? 'debug' : undefined }) });
  } catch {}
}
async function memoryRecall(query, limit = 5) {
  try {
    const q = textOf(query).trim();
    if (!q) return [];
    const searchP = window.petWindow
      ? window.petWindow.memorySearch(q, DEBUG_MODE ? 'debug' : undefined, limit)
      : fetch('/api/memory-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, mode: DEBUG_MODE ? 'debug' : undefined, limit }) }).then((res) => res.json());
    const r = await Promise.race([
      searchP,
      new Promise((resolve) => setTimeout(() => resolve({ hits: [] }), 8000)),
    ]);
    return (r && r.hits || []).filter((h) => h.text.trim() !== q && h.text.trim() !== '[用户] ' + q);
  } catch { return []; }
}
function formatMemories(hits) {
  if (!hits.length) return '';
  return '\n\n【相关回忆】（来自过去的对话，供你自然地想起，不要逐条复述）\n' +
    hits.map((h) => `- ${new Date(h.ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} ${h.text}`).join('\n');
}
// 工具调用台账：自动注入（她真实做过什么的唯一权威记录，防"没做却说做了"）
async function getToolLedger() {
  try {
    const lines = window.petWindow
      ? await window.petWindow.fstoolTail(10)
      : await (await fetch('/api/fstool-tail?n=10')).json();
    return lines.length ? '\n\n【工具调用台账】（你最近 10 次真实的工具操作记录，引用时以此为准）\n' + lines.map((l) => '- ' + l).join('\n') : '';
  } catch { return ''; }
}

let lastExchange = null; // 记录最近一次底层请求与响应（供“继续”按钮使用）

// 宽容解析文本形式的工具调用：<tool_call>{json}…</tool_call>（块内可多个 JSON）+ <invoke name=..><parameter name=..>..</parameter></invoke>
function scanJsonObjects(s) {
  const out = []; let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') { if (depth === 0) start = i; depth += 1; }
    else if (ch === '}') { if (depth > 0) { depth -= 1; if (depth === 0 && start >= 0) { out.push(s.slice(start, i + 1)); start = -1; } } }
  }
  return out;
}
function coerceArg(v) {
  const t = String(v).trim();
  if (t === '') return '';
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) { try { return JSON.parse(t); } catch {} }
  return t;
}
function parseTextToolCalls(content, round) {
  const txt = String(content || ''); const found = [];
  for (const m of txt.matchAll(/<invoke\s+name\s*=\s*"([^"]+)"\s*>([\s\S]*?)<\/invoke>/g)) {
    const args = {};
    for (const p of m[2].matchAll(/<parameter\s+name\s*=\s*"([^"]+)"(?:\s+[^>]*)?>([\s\S]*?)<\/parameter>/g)) args[p[1].trim()] = coerceArg(p[2]);
    found.push({ name: m[1].trim(), arguments: args });
  }
  for (const m of txt.matchAll(/<tool_call>([\s\S]*?)<\/tool_call>/g)) {
    for (const js of scanJsonObjects(m[1])) {
      try { const o = JSON.parse(js); if (o && typeof o.name === 'string') found.push({ name: o.name, arguments: (o.arguments ?? o.parameters ?? {}) }); } catch {}
    }
  }
  return found.map((c, i) => ({ id: 'textcall_' + round + '_' + i, type: 'function', function: { name: c.name, arguments: typeof c.arguments === 'string' ? c.arguments : JSON.stringify(c.arguments || {}) } }));
}
async function askLLM(userContent, signal, memories, continueBaseMsgs = null) {
  const mod = THINK_MODE === 'off' ? null : THINK_MODULES.pet_think; // v2：模型自评难度
  turnUsedTools = false;
  let bodyMsgs;
  if (continueBaseMsgs) {
    bodyMsgs = continueBaseMsgs.slice();
  } else {
    // 历史里的图片一律折叠成文字占位：多模态历史会成倍撑大 prefill，只有最新一条保留图
    const pruned = history.map((m) => Array.isArray(m.content)
      ? { role: m.role, content: '[图片] ' + (m.content.find((c) => c.type === 'text')?.text || '') }
      : m);
    // 工具循环：模型发起 tool_calls → 主进程执行 → 结果回喂。
    // 无轮次上限；唯一护栏：同一签名调用连续重复 3 次 = 卡死，回喂错误并禁用工具逼出文本回答
    // 模型固定 strata-nothink；思考强度 = pet_think 模块指令动态档位（light/standard/deep）
    // 台账 + 强度指令只挂在最后一条 user 上（请求时临时挂载，不进历史、不重复累积）
    const ledger = await getToolLedger();
    const userText = textOf(userContent) + ledger; // 台账挂最后一条 user 的文字里（请求时临时挂载）
    const lastUser = Array.isArray(userContent)
      ? { role: 'user', content: [{ ...userContent.find((c) => c.type === 'text'), text: userText }, userContent.find((c) => c.type === 'image_url')] } // 多模态：文字（含台账）+ 图
      : { role: 'user', content: userText };
    bodyMsgs = [
      { role: 'system', content: (await getSystemAndPersona()) + formatMemories(memories) },
      ...pruned, // 全量发送聊天记录
      lastUser,
    ];
    // 全新提问首轮：在发起请求前把思考要求与预填充拼入 bodyMsgs。
    // 这样本次实际发出的请求体就已包含思考要求；后续 lastExchange 捕捉的也是拼接后的请求体（天然自带上一次思考要求）；
    // 工具回喂（round > 0）与“继续”（isContinuation）绝不会在末尾重复拼接思考要求！
    if (forceToolPrefill && infiniteWake) {
      forceToolPrefill = false;   // 一次性：本轮补 <tool_call> 预填，逼她从"念叨死循环"转到"真的调工具"
      bodyMsgs.push({ role: 'user', content: '（你上一轮只是在重复说"卡住了/这就去翻"却并没有真的调用工具。这一轮别再空谈，立刻调用一个合适的工具动手：read_file / list_dir / edit_file / file_tool 等。）' });
      bodyMsgs.push({ role: 'assistant', content: '<tool_call>\n' });
    } else if (mod) {
      bodyMsgs.push({ role: 'user', content: mod.instruction });
      bodyMsgs.push({ role: 'assistant', content: mod.prefill });
    }
  }
  // 剥离思考标签：cfm 模式下引擎只返回续写部分——可能没有开头标签只有结尾 </think>，
  // 两种形态都要兜住：成对块整体删；无开头时删到第一个结尾标签为止（剩下全是思考残段）
  const stripThink = (s) => {
    let t = String(s || '')
      .replace(/<(pet_)?think>[\s\S]*?<\/\1think>\s*/g, ''); // 成对块
    const m = t.match(/<\/(?:pet_)?think>/);
    if (m) t = t.slice(m.index + m[0].length); // 续写形态：掐到结尾标签
    return t.trim();
  };
  // ===== 流式主循环：SSE 解析 + 思维链静默状态机 + 成句即说 =====
  // 思考块（pet_think/think）内容全程静默丢弃，只有闭合后的正文按句边界实时送 TTS；
  // 原生 tool_call delta 按片段累积，文本 <tool_call>/<invoke> 块拦截不 TTS；
  // 每轮开始重置切句器与思考状态（cfm 时流从思考块内部开始）。
  const TAG_RES = /<\/?(?:pet_think|think|tool_call|invoke)>/;
  const CLOSE_THINK_RE = /<\/(?:pet_think|think)>/;
  const OPEN_THINK_RE = /<(?:pet_think|think)>/;
  const CLOSE_TOOL_RE = /<\/(?:tool_call|invoke)>/;
  function partialTagLen(s) {
    for (let len = Math.min(s.length, 12); len > 0; len--) {
      const tail = s.slice(-len);
      if (['<pet_think>', '</pet_think>', '<think>', '</think>', '<tool_call>', '</tool_call>', '<invoke>', '</invoke>'].some((tag) => tag.startsWith(tail))) return len;
    }
    return 0;
  }
  // 思考/工具态里找闭合标签时，同样要扣住"半个标签"：闭合标签被 delta 切断时（'</pet_' + 'think>'），
  // 若直接吞掉前半截，闭合标签就永远匹配不上，后面的正文会整段被当成思考丢掉（"只显示不发声"的根因）
  function partialCloseLen(s, tags) {
    for (let len = Math.min(s.length, 12); len > 0; len--) {
      const tail = s.slice(-len);
      if (tags.some((tag) => tag.startsWith(tail))) return len;
    }
    return 0;
  }
  let noTools = false;
  let lastSig = null;
  let repeatCount = 0;
  let toolCallTotal = 0;
  // 正常回合：user 消息与每个工具轮都边跑边写进聊天记录（中断/被杀也不丢整轮）；"继续"回合不动历史
  const isLive = !continueBaseMsgs;
  if (isLive) { history.push({ role: 'user', content: userContent }); saveHistory(); }
  let emptyTextRetries = 0;
  // 查证类任务（质询她做过什么/读过什么）且本轮零工具调用 → 自动补一轮提醒（防凭印象作答，每任务最多一次）
  const wantsVerification = /(查证|核实|台账|fstool|读没读|读过|看过了|做了没|真的(读|看|做)了)/i.test(textOf(userContent));
  let verificationNudged = false;
  const isContinuation = Boolean(continueBaseMsgs);
  // TTS 逐句分派链：保序（合成顺序 = 播放顺序），打断时 signal 贯穿
  let streamSpoken = false;
  let ttsChain = Promise.resolve();
  const dispatchTTS = (seg) => {
    if (!seg || !seg.trim()) return;
    streamSpoken = true;
    rlog('tts-dispatch', seg.slice(0, 40));
    ttsChain = ttsChain.then(() => speakSegment(seg, signal)).catch(() => {});
  };
  let lastBubbleTs = 0;
  for (let round = 0; ; round++) {
    touchTurnActivity();
    const slicer = makeSentenceSlicer();
    const model = 'strata-nothink'; // 固定 nothink：快；思考强度全靠 pet_think 指令动态控制
    const sendMsgs = bodyMsgs.slice();
    const needCfm = sendMsgs[sendMsgs.length - 1]?.role === 'assistant';
    // cfm 的续写起点状态从预填充内容本身推断，不能一律当成“在思考块里”：
    // 预填充可能以闭合的 <think>…</think> 结尾（当前配置，续写从正文开始），
    // 也可能停在未闭合的 pet_think / tool_call 里（如强制工具预填 <tool_call>）。
    const cfmText = needCfm ? String(sendMsgs[sendMsgs.length - 1].content || '') : '';
    const startInThink = (cfmText.match(/<(?:pet_)?think>/g) || []).length > (cfmText.match(/<\/(?:pet_)?think>/g) || []).length;
    const startInTool = (cfmText.match(/<(?:tool_call|invoke)>/g) || []).length > (cfmText.match(/<\/(?:tool_call|invoke)>/g) || []).length;
    const reqPayload = {
      model, messages: sendMsgs,
      tools: noTools ? undefined : TOOLS,
      tool_choice: noTools ? undefined : 'auto',
      temperature: 0.8, max_tokens: 65536, stream: true,
      stream_options: { include_usage: true },
      ...(needCfm ? { continue_final_message: true } : {}),
    };
    const res = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(reqPayload),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
    touchTurnActivity();
    // ===== SSE 解析 =====
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let sse = '';
    let rawContent = '';
    let inThink = startInThink;   // 由预填充推断：续写起点是否停在未闭合的思考块里
    let inTool = startInTool;     // 由预填充推断：续写起点是否停在未闭合的 tool_call/invoke 块里
    let processed = 0;          // rawContent 已处理光标
    let finish = null, usage = null;
    const nativeCalls = new Map();
    let replyText = '';
    let lastBubbleTs = 0;
    const feedReplyDelta = (t) => {
      if (!t) return;
      replyText += t;
      for (const seg of slicer.push(t)) dispatchTTS(seg);
      const now = Date.now();
      if (now - lastBubbleTs > 300) { lastBubbleTs = now; showBubble(slicer.preview() || replyText.slice(-140)); }
    };
    // 内容增量状态机：inThink 丢弃思考；inTool 留给 parseTextToolCalls；其余正文成句即说。
    // 标签可能被 delta 切断（如 '</pet_' + 'think>'）——partialTagLen 扣住尾部半个标签等下一个 delta。
    const processRaw = () => {
      for (;;) {
        const rest = rawContent.slice(processed);
        if (!rest) return;
        if (inThink) {
          const m = rest.match(CLOSE_THINK_RE);
          if (!m) {
            processed = rawContent.length - partialCloseLen(rest, ['</pet_think>', '</think>']);
            return;
          }
          processed += m.index + m[0].length;
          inThink = false;
        } else if (inTool) {
          const m = rest.match(CLOSE_TOOL_RE);
          if (!m) {
            processed = rawContent.length - partialCloseLen(rest, ['</tool_call>', '</invoke>']);
            return;
          }
          processed += m.index + m[0].length;
          inTool = false;
        } else {
          const m = rest.match(TAG_RES);
          const hold = partialTagLen(rest);
          if (m && m.index < rest.length - hold) {
            feedReplyDelta(rest.slice(0, m.index));
            processed += m.index;
            if (m[0] === '<pet_think>' || m[0] === '<think>') { inThink = true; processed += m[0].length; }
            else if (m[0] === '<tool_call>' || m[0] === '<invoke>') { inTool = true; processed += m[0].length; }
            else { processed += m[0].length; }   // 正文态里的孤立关闭标签（如 cfm 后多吐的 </pet_think>）：直接丢弃
          } else {
            feedReplyDelta(rest.slice(0, rest.length - hold));
            processed += rest.length - hold;
            return;   // 剩余是可能被切断的标签前缀，等下一个 delta
          }
        }
      }
    };
    while (true) {
      const rd = await reader.read();
      if (rd.done) break;
      touchTurnActivity();
      sse += dec.decode(rd.value, { stream: true });
      let nl;
      while ((nl = sse.indexOf('\n')) >= 0) {
        const line = sse.slice(0, nl).replace(/\r$/, '');
        sse = sse.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const pl = line.slice(5).trim();
        if (pl === '[DONE]') continue;
        let j; try { j = JSON.parse(pl); } catch { continue; }
        if (j.usage) usage = j.usage;
        const ch0 = j.choices?.[0];
        if (!ch0) continue;
        if (ch0.finish_reason) finish = ch0.finish_reason;
        const d = ch0.delta || {};
        if (Array.isArray(d.tool_calls)) {
          inTool = true;
          for (const tc of d.tool_calls) {
            const idx = tc.index ?? 0;
            const cur = nativeCalls.get(idx) || { id: '', type: 'function', function: { name: '', arguments: '' } };
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.function.name = tc.function.name;
            if (tc.function?.arguments) cur.function.arguments += tc.function.arguments;
            nativeCalls.set(idx, cur);
          }
        }
        if (typeof d.content === 'string' && d.content) { rawContent += d.content; processRaw(); }
      }
    }
    noteContext(usage && usage.prompt_tokens);
    // 本轮流结束就把切句器尾巴冲刷进 TTS：工具轮会在下面 continue，不冲刷的话
    // "说完半句就去调工具"的尾句只显示不发声（强标点结尾的句子已在流式时切走）
    {
      const tail = slicer.flush();
      if (tail) dispatchTTS(tail);
    }
    // ===== 组装等价非流形状 → 完全复用现有护栏与工具执行 =====
    const content = rawContent;
    let toolCalls = nativeCalls.size ? [...nativeCalls.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v) : null;
    if (!toolCalls && content) {
      const parsed = parseTextToolCalls(content, round);
      if (parsed.length) toolCalls = parsed;
    }
    const data = { choices: [{ message: { role: 'assistant', content }, finish_reason: finish || (toolCalls ? 'tool_calls' : 'stop') }], usage: usage || {} };
    const msg = data.choices[0].message;
    lastExchange = { round, reqPayload: { ...reqPayload, stream: false, messages: sendMsgs }, resData: data, resMsg: msg, finish, userContent, hadSavedHistory: false };
    // 兜底解析：模型偶尔不用原生 tool_calls（宽容解析已支持 <tool_call> 与 <invoke> 两种格式）
    if (toolCalls?.length) {
      const msgContentBeforeTools = stripThink(content ?? '').replace(/<tool_call>[\s\S]*?<\/tool_call>\s*/g, '').replace(/<invoke[\s\S]*?<\/invoke>\s*/g, '').trim();
      const truncated = finish === 'length';
      const sig = toolCalls.map((c) => (c.function?.name || '') + ':' + (c.function?.arguments || '')).join('|');
      repeatCount = sig === lastSig ? repeatCount + 1 : 0;
      lastSig = sig;
      const lastMsg = bodyMsgs[bodyMsgs.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.tool_calls = toolCalls;
        if (msgContentBeforeTools && !lastMsg.content.includes(msgContentBeforeTools)) {
          lastMsg.content = (lastMsg.content || '').trimEnd() + '\n' + msgContentBeforeTools;
        }
        lastMsg.content = (lastMsg.content || '').replace(/<tool_call>[\s\S]*$/g, '').trim();
      } else {
        bodyMsgs.push({ role: 'assistant', content: msgContentBeforeTools || '', tool_calls: toolCalls });
      }
      for (const call of toolCalls) {
        let parsed = {};
        let parseOk = true;
        try { parsed = JSON.parse(call.function?.arguments || '{}'); } catch { parseOk = false; }
        if (!parseOk) {
          bodyMsgs.push({ role: 'tool', tool_call_id: call.id, content: '错误：工具参数不是合法 JSON（通常是文本里的换行或引号没有正确转义）。请重新生成 arguments 为合法 JSON 后重试。' });
          continue;
        }
        showBubble(round === 0 ? '看屏幕中…' : '继续翻…');
        if (call.function?.name === 'search_memory') {
          const r = await memoryRecall(parsed.query || '', parsed.limit || 8);
          bodyMsgs.push({
            role: 'tool', tool_call_id: call.id,
            content: r.length ? r.map((h) => `[${new Date(h.ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}] ${h.text}`).join('\n---\n') : '（没有找到相关记忆）',
          });
          continue;
        }
        if (call.function?.name === 'walk_to') {
          let result;
          try {
            const where = String(parsed.where || '').toLowerCase();
            const special = ['primary', '主屏', 'main', 'room', 'bedroom', '卧室'].includes(where);
            let fx = parsed.x, fy = parsed.y;
            const said = parsed.where ? '「' + parsed.where + '」' : '(' + fx + ',' + fy + ')';
            if (!special && (fx == null || fy == null)) {
              let lm = null;
              try { lm = await (await fetch('/pet_space/room/landmarks.json?t=' + Date.now(), { cache: 'no-store' })).json(); } catch {}
              if (!lm || !lm[where] || typeof lm[where].x !== 'number') {
                result = '找不到地标 "' + (parsed.where || '') + '"：pet_space/room/landmarks.json 里没有它。现有地标：' + (lm ? Object.keys(lm).filter((k) => k[0] !== '_').join('、') : '(文件读不到)') + '。' + (ROLE === 'pet' ? '也可以用 where="primary" 去主屏、where="room" 回卧室。' : '换背景后请把坐标写进这份文件。');
              } else { fx = lm[where].x; fy = lm[where].y; }
            }
            if (result == null) {
              if (ROLE === 'pet') {
                const pri = (displayInfo || []).find((d) => d.isPrimary);
                const bed = (displayInfo || []).find((d) => !d.isPrimary);
                if (where === 'primary' || where === '主屏' || where === 'main') {
                  const r = displayCssRect(pri);
                  const px = typeof fx === 'number' ? Math.max(0, Math.min(1, fx)) : 0.5;
                  const py = typeof fy === 'number' ? Math.max(0, Math.min(1, fy)) : 0.9;
                  if (!r) result = '拿不到主屏位置，稍后再试。';
                  else { await walkToCss(r.x + r.w * px, r.y + r.h * py); result = '走到主屏' + (typeof fx === 'number' || typeof fy === 'number' ? '（' + px + ',' + py + '）' : '底部中间') + '啦'; }
                } else if (where === 'room' || where === 'bedroom' || where === '卧室') {
                  const r = displayCssRect(bed);
                  const px = typeof fx === 'number' ? Math.max(0, Math.min(1, fx)) : 0.5;
                  const py = typeof fy === 'number' ? Math.max(0, Math.min(1, fy)) : 0.78;
                  if (!r) result = '拿不到卧室位置，稍后再试。';
                  else { await walkToCss(r.x + r.w * px, r.y + r.h * py); result = '回卧室' + (typeof fx === 'number' || typeof fy === 'number' ? '（' + px + ',' + py + '）' : '啦'); }
                } else if (!(fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
                  result = '坐标要是 0~1 的比例（x 横向、y 纵向，脚下位置）。';
                } else {
                  const r = displayCssRect(bed);
                  if (r) await walkToCss(r.x + fx * r.w, r.y + fy * r.h);
                  else await walkToFraction(fx, fy);
                  result = '走到 ' + said + ' 啦';
                }
              } else if (!(fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
                result = '坐标要是 0~1 的比例（x 横向、y 纵向，脚下位置）。';
              } else if (!bedroomMode) {
                result = '你不在卧室（副屏）里，先让主人把你拖回副屏卧室再走。';
              } else {
                await walkToFraction(fx, fy);
                result = '走到 ' + said + ' 啦';
              }
            }
          } catch (e) { result = '移动失败: ' + String((e && e.message) || e); }
          bodyMsgs.push({ role: 'tool', tool_call_id: call.id, content: result });
          continue;
        }
        touchTurnActivity();
        const out = window.petWindow?.fsTool
          ? await window.petWindow.fsTool({ name: call.function?.name, args: parsed })
          : await (await fetch('/api/fstool', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: call.function?.name, args: parsed }) })).json();
        touchTurnActivity();
        bodyMsgs.push({
          role: 'tool', tool_call_id: call.id,
          content: out.ok
            ? String(out.result)
            : (truncated
              ? '错误：这次输出在 max_tokens 处被截断，工具参数不完整。请精简要写入的内容，或分成多次调用。'
              : '错误：' + out.error),
        });
        if (out.image) {
          bodyMsgs.push({
            role: 'user',
            content: [
              { type: 'text', text: '（系统附上刚才工具生成的画面，请基于它继续处理用户的请求）' },
              { type: 'image_url', image_url: { url: out.image } },
            ],
          });
        }
      }
      if (isLive) {
        // 不再把"（本轮使用了工具：…）"写进历史：她会模仿这句话冒充调用工具。
        // 有可见正文就记正文；纯工具轮不写历史条目（工具台账仍由 logs/fstool.log 注入）。
        const visible = (msgContentBeforeTools || '').trim();
        if (visible) { history.push({ role: 'assistant', content: visible }); saveHistory(); }
      }
      turnUsedTools = true;
      toolCallTotal += toolCalls.length;
      if (toolCallTotal > 16) {
        noTools = true;
        bodyMsgs.push({ role: 'user', content: '（系统：这一轮工具调用次数太多仍未收敛，像是在打转。请停止调用工具，直接用文字向主人说明现状和卡点。）' });
      }
      if (repeatCount >= 2) {
        noTools = true;
      }
      continue;
    }
    if (!content && !toolCalls?.length) {
      if (isContinuation) {
        const lastMsg = bodyMsgs[bodyMsgs.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content.includes('<tool_call>')) {
          lastMsg.content = lastMsg.content.trimEnd() + '\n<tool_call>';
          round--;
          continue;
        }
        throw new Error('上一轮回复已完结，无需继续');
      }
      throw new Error('LLM 返回空回复: ' + JSON.stringify(data).slice(0, 200));
    }
    // 可见正文 = 思考剥离后的累积文本；流式期间已逐句 TTS（streamSpoken）
    // 模型忘记闭合 pet_think：stripThink 删不掉未闭合块，剩下的全是思考内容，不能当正文显示/念/存历史。
    // 视为“思考后无正文”，交给下面的空正文自动续写路径（最多 2 次）。
    const thinkOpens = (content.match(/<(?:pet_)?think>/g) || []).length;
    const thinkCloses = (content.match(/<\/(?:pet_)?think>/g) || []).length;
    const danglingThink = thinkOpens > thinkCloses;
    const text = danglingThink ? '' : stripThink(content);
    if (!text) {
      if (emptyTextRetries < 2) {
        emptyTextRetries++;
        const fullContent = content.trim();
        const toolKeywords = /(?:file_tool|copy_file|write_file|append_file|read_file|list_dir|delete_file|take_screenshot|search_memory|工具|编辑|写入|修改|读取|查看|复制|创建|追加)/i;
        // 思考块没收尾时别再补 <tool_call> 预填（会落进思考块里，把续写带偏）
        const hasToolIntent = !danglingThink && toolKeywords.test(fullContent);
        const tail = hasToolIntent ? '\n<tool_call>' : '\n';
        const lastMsg = bodyMsgs[bodyMsgs.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = (lastMsg.content || '').trimEnd() + '\n' + fullContent + tail;
        } else {
          bodyMsgs.push({ role: 'assistant', content: fullContent + tail });
        }
        showBubble(hasToolIntent ? '准备执行工具…' : '继续组织语言中…');
        continue;
      }
      throw new Error('LLM 返回空回复（思考后无正文）');
    }
    // 查证兜底
    if (wantsVerification && toolCallTotal === 0 && !verificationNudged && !noTools && isLive && !continueBaseMsgs) {
      verificationNudged = true;
      bodyMsgs.push({ role: 'user', content: '（系统提示：这条任务涉及需要核实的事实，但你本轮没有调用任何工具。请先调用工具查证——例如 read_file 读相关文件，或读 G:/AI/livliv-pet/logs/fstool.log 核对自己的操作记录——再给出最终回答。）' });
      showBubble('提醒她先查证…');
      continue;
    }
    // 冲刷切句器中剩余的尾句并送入 TTS，等待所有分派完成
    const rest = slicer.flush();
    if (rest) dispatchTTS(rest);
    await ttsChain;
    return text;
  }
}

// 增量切句器：splitForTTS 规则的流式版——强标点(≥6字)即切、弱标点(≥14字)即切、换行恒切、45 字硬切。
// 流式下无前瞻：标点后多留一字符再定夺的合并细节省略（TTS 对拆分不敏感）
function makeSentenceSlicer(minLen = 6, targetLen = 14) {
  const strongEnd = '。！？!?';
  const weakEnd = '，,、；;…—~～';
  const hasWord = (t) => /[\p{L}\p{N}]/u.test(t);
  let buf = '';
  const tryCut = (out) => {
    const last = buf.slice(-1);
    let cut = false;
    if (last === '\n') cut = true;
    else if (strongEnd.includes(last)) { if (buf.length >= minLen) cut = true; }
    else if (weakEnd.includes(last)) { if (buf.length >= targetLen) cut = true; }
    else if (buf.length >= 45) cut = true;
    if (cut && hasWord(buf)) { out.push(buf.trim()); buf = ''; }
  };
  return {
    push(text) {
      const out = [];
      for (const ch of String(text || '')) {
        buf += ch;
        tryCut(out);
      }
      return out;
    },
    preview() { return buf.trim(); },
    flush() {
      const rest = buf.trim();
      buf = '';
      return rest && hasWord(rest) ? rest : '';
    },
  };
}

// 自适应切分：按字数阈值自适应结合逗号与句号，首句快速出声、后续边放边合，避免过短吞字与过长等待
function splitForTTS(text, minLen = 6, targetLen = 14) {
  const s = String(text || '').replace(/\r/g, '').trim();
  if (!s) return [];
  const strongEnd = '。！？!?\n';
  const weakEnd = '，,、；;…—~～';
  const hasWord = (t) => /[\p{L}\p{N}]/u.test(t);
  const segs = [];
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    buf += ch;
    // 若当前为标点，吃掉后续紧邻的标点（如 ……、！？、！！）
    if (strongEnd.includes(ch) || weakEnd.includes(ch)) {
      while (i + 1 < s.length && (strongEnd.includes(s[i + 1]) || weakEnd.includes(s[i + 1]))) {
        buf += s[++i];
      }
    }
    const curLen = buf.length;
    let cut = false;
    if (ch === '\n') {
      cut = true;
    } else if (strongEnd.includes(ch)) {
      if (curLen >= minLen) cut = true;
    } else if (weakEnd.includes(ch)) {
      if (curLen >= targetLen) cut = true;
    } else if (curLen >= 45) {
      cut = true;
    }
    if (cut && hasWord(buf)) {
      segs.push(buf.trim());
      buf = '';
    }
  }
  if (hasWord(buf)) {
    const b = buf.trim();
    if (segs.length && b.length < minLen) {
      segs[segs.length - 1] += b;
    } else {
      segs.push(b);
    }
  }
  return segs.length ? segs : [s];
}
// GPT-SoVITS 离线静默期：连接失败/网关错误后 60s 内直接跳过合成（不报错不刷日志），到期自动重试
let gsvDownUntil = 0;
// 渲染层诊断日志：写 logs/renderer.log（TTS 分派/跳过/失败），排查"只显示不发声"
function rlog(tag, msg) {
  try { fetch('/api/log', { method: 'POST', body: tag + ' ' + String(msg == null ? '' : msg) }).catch(() => {}); } catch {}
}
async function speakSegment(seg, signal) {
  touchTurnActivity();
  if (Date.now() < gsvDownUntil) { rlog('tts-skip-down', Math.round((gsvDownUntil - Date.now()) / 1000) + 's left'); return; }
  rlog('tts-start', seg.slice(0, 30));
  // 单段合成上限 2 分钟：某一段卡住时不能把整条 TTS 队列（以及后续每一轮的语音）永久堵死
  const ctrl = new AbortController();
  const onAbort = () => { try { ctrl.abort(); } catch {} };
  if (signal) {
    if (signal.aborted) return;
    signal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(onAbort, 120000);
  try {
    const res = await fetch(TTS_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: seg,
        text_lang: 'zh',
        prompt_lang: 'zh',
        text_split_method: 'cut5',
        media_type: 'wav',
        streaming_mode: false,
        temperature: 0.4,
        top_P: 0.7,
        top_K: 3,
        ...TTS_REF,
      }),
    });
    touchTurnActivity();
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      gsvDownUntil = Date.now() + 60000;
      rlog('tts-upstream-' + res.status, 'silent 60s');
      return;
    }
    if (!res.ok) throw new Error('TTS HTTP ' + res.status);
    const blob = await res.blob();
    touchTurnActivity();
    rlog('tts-ok', blob.size + 'B');
    speech.say(blob);
  } catch (e) {
    if (signal && signal.aborted) { rlog('tts-abort', 'turn aborted'); return; }
    if (ctrl.signal.aborted) { gsvDownUntil = Date.now() + 60000; rlog('tts-timeout', 'silent 60s'); return; }   // 超时：静默 60s 再试
    rlog('tts-error', String(e && e.message || e));
    console.warn('TTS 分段失败: ' + String(e && e.message || e));
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
    touchTurnActivity();
  }
}
async function speak(text, signal) {
  const segs = splitForTTS(text);
  let fails = 0;
  for (const seg of segs) {
    if (signal && signal.aborted) return;
    if (Date.now() < gsvDownUntil) return;
    let blob = null;
    try {
      const res = await fetch(TTS_URL, {
        method: 'POST', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: seg, text_lang: 'zh', prompt_lang: 'zh', text_split_method: 'cut5',
          media_type: 'wav', streaming_mode: false, temperature: 0.4, top_P: 0.7, top_K: 3, ...TTS_REF,
        }),
      });
      if (res.ok) blob = await res.blob();
      else { fails += 1; console.warn('TTS HTTP ' + res.status); }
    } catch (e) {
      if (signal && signal.aborted) return;
      fails += 1; console.warn('TTS 失败：' + String(e && e.message || e));
    }
    if (blob) { speech.say(blob); fails = 0; }
    if (fails >= 3) return;
  }
}

// 统一提交入口：发消息（text + 可选图片）；台账/强度指令由 askLLM 拼请求时临时挂载
let turnAbort = null; // 当前轮次的 AbortController：🔔 忙时点击 = 打断
async function submitRequest(text, image) {
  if (busy) return false;
  if (!unlocked) { speech.unlock(); unlocked = true; }
  busy = true;
  turnSeq += 1;
  turnAbortReason = '';
  touchTurnActivity();
  turnAbort = new AbortController();
  const isAbort = (e) => e?.name === 'AbortError' || turnAbort?.signal.aborted;
  const userContent = image
    ? [{ type: 'text', text: text || '（帮我看看这张图）' },
       { type: 'image_url', image_url: { url: image } }]
    : text;
  let replied = false;
  try {
    await syncHistoryFromDisk(); // 磁盘是事实源：用户删/改历史文件先同步，再追加本轮
    player.act('hop');
    showBubble('…');
    const recalled = await memoryRecall(text);
    touchTurnActivity();
    const reply = await askLLM(userContent, turnAbort.signal, recalled);
    history.push({ role: 'assistant', content: reply });
    noteLoop(reply);
    if (lastExchange) lastExchange.hadSavedHistory = true;
    await saveHistory();
    showBubble(reply);
    replied = true;
    react(reply);
    // 流式阶段已成句即说（dispatchTTS），不再重复整段 speak
    memoryAddFire(userContent, reply); // 异步入语义索引，不阻塞回复
    queueInfiniteWake();
    return true;
  } catch (e) {
    if (isAbort(e)) {
      // 用户打断：还没来得及说的那句话放回输入框
      if (!replied) {
        showBubble(turnAbortReason === 'guard' ? '（上一轮响应超时，自动重连…）' : '（已打断）');
        setTimeout(() => { if (!busy) hideBubble(); }, 3000);
        const t = typeof userContent === 'string' ? userContent : (userContent.find?.((c) => c.type === 'text')?.text || '');
        if (t && !/^(你被唤醒了|现在是无限唤醒模式|（)/.test(t)) input.value = t;
      }
      if (turnAbortReason === 'guard') queueInfiniteWake(3000);
      return false;
    }
    showBubble(String(e.message || e), true);
    queueInfiniteWake(30000); // 失败不紧重试，避免对着挂掉的反代刷屏
    return false;
  } finally {
    busy = false;
    turnAbort = null;
    touchTurnActivity();
    input.focus();
  }
}

async function send() {
  const text = input.value.trim();
  if ((!text && !pendingImage) || busy) return;
  if (!unlocked) { speech.unlock(); unlocked = true; } // 必须在用户手势里解锁音频
  input.value = '';
  autoGrowInput(); // 发送后缩回单行
  clearPendingImage();
  // 台账/强度指令由 askLLM 在拼请求时临时挂到最后一条 user 上（不进历史，不重复）
  await submitRequest(text, pendingImage);
}

// 手动唤醒：先查主卡 GPU 占用率（防打扰），通过则自动截屏 + 固定唤醒提示，让她自由行动。
// 以后定时自动唤醒复用 wakeNow()，前置条件一致
const WAKE_GPU_LIMIT = 40; // 主卡占用率上限（%），超过则跳过本次唤醒
let wakeRunning = false;
async function wakeNow(wakeText = '你被唤醒了，用户没有给你指示，自由行动吧') {
  if (busy || wakeRunning) return;
  wakeRunning = true;
  try {
    let util = null;
    try {
      const raw = window.petWindow ? await window.petWindow.gpuUtil() : await (await fetch('/api/gpuutil')).text();
      util = parseInt(raw, 10);
      if (!Number.isFinite(util)) util = null;
    } catch {}
    if (util !== null && util > WAKE_GPU_LIMIT) {
      if (infiniteWake) { queueInfiniteWake(30000); return; } // 无限模式：显卡忙就等会儿再试，不刷屏
      showBubble(`显卡正忙（${util}%），这次先不唤醒啦，稍后再叫我`);
      setTimeout(() => { if (!busy) hideBubble(); }, 6000);
      return;
    }
    let b64 = null;
    try {
      b64 = window.petWindow
        ? await window.petWindow.captureScreen()
        : await (await fetch('/api/capture')).text();
      if (b64 === 'null') b64 = null;
    } catch {}
    const userContent = [{ type: 'text', text: wakeText }];
    if (b64) userContent.push({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } });
    await submitRequest(userContent);
  } finally {
    wakeRunning = false;
  }
}
// 🔔 双语义：空闲 = 手动唤醒；忙碌 = 插话打断（立刻停语音、掐断生成，没说的话回到输入框）
function interrupt() {
  if (!busy) return false;
  turnAbortReason = 'user';
  turnAbort?.abort();
  speech.stop();
  return true;
}
$('wake').addEventListener('click', () => {
  if (busy) interrupt();
  else wakeNow();
});
// ===== 连续唤醒（∞）：她一停下来就再唤醒；开关会持久化（重启/看门狗拉起后自动恢复）；上下文多次≈64k 会自动停 =====
const INF_WAKE_TEXT = '现在是无限唤醒模式，你会一直被唤醒，自由行动吧，**不要主动停止输出或调用工具**，如果停止了也会再次被唤醒。主人现在大概率不在电脑前，你不用担心占用电脑资源。现在大概率是深夜，主人希望你多找点事干，不要老老实实挂机，那样主人的电费就白花了哦。你有很多工具，你可以访问主人所有的文件，虽然不能直接改写，但是可以复制到你的空间再改。无限唤醒的时候就算长思考也没关系，不用担心上下文长度。你可以大胆行动，不用担心太多';
let infiniteWake = false;
let infTimer = null;
function queueInfiniteWake(delay = 1500) {
  if (!infiniteWake || infTimer) return;
  infTimer = setTimeout(() => {
    infTimer = null;
    if (infiniteWake && !busy) wakeNow(INF_WAKE_TEXT);
  }, delay);
}
$('infwake').addEventListener('click', () => {
  infiniteWake = !infiniteWake;
  try { localStorage.setItem('infwake', infiniteWake ? '1' : '0'); } catch {}
  $('infwake').classList.toggle('on', infiniteWake);
  $('infwake').title = infiniteWake ? '连续唤醒开：她一停下来就再唤醒（点击关闭）' : '连续唤醒：她一停下来就再唤醒（无限模式）';
  if (infiniteWake) queueInfiniteWake(500);
  else if (infTimer) { clearTimeout(infTimer); infTimer = null; }
});
// 持久化的无限唤醒：重启后自动恢复（看门狗拉起、崩溃重启都不丢）；并加"卡住自动续跑"与心跳
try {
  if (localStorage.getItem('infwake') === '1') {
    infiniteWake = true;
    $('infwake').classList.add('on');
    $('infwake').title = '连续唤醒开：她一停下来就再唤醒（点击关闭）';
    queueInfiniteWake(3000);
  }
} catch {}
// 中止条件：上下文多次接近/超过 64k → 停无限唤醒（避免在塞满的上下文里空转，烧一晚上）
const CTX_ABORT_TOKENS = 64000, CTX_ABORT_COUNT = 3;
let lastCtxTokens = 0, ctxOverCount = 0;
function noteContext(pt) {
  pt = Number(pt);
  if (!Number.isFinite(pt) || pt <= 0) return;
  lastCtxTokens = pt;
  if (pt >= CTX_ABORT_TOKENS) ctxOverCount += 1;
  if (ctxOverCount >= CTX_ABORT_COUNT && infiniteWake) {
    infiniteWake = false;
    try { localStorage.setItem('infwake', '0'); } catch {}
    $('infwake').classList.remove('on');
    if (infTimer) { clearTimeout(infTimer); infTimer = null; }
    showBubble('上下文已经塞到 64k 好几次啦，我先停下无限唤醒，等主人回来～');
    console.warn('[infwake] 停止无限唤醒：prompt_tokens 达 64k 第 ' + ctxOverCount + ' 次');
  }
}
// 文字死循环护栏：连续"无工具 + 回复高度相似"且无限唤醒开着 → 下一轮补 <tool_call> 预填充，逼她动手
let prevReplyNorm = '', noToolTurns = 0, forceToolPrefill = false, turnUsedTools = false;
function normReply(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/[\s\p{P}\p{S}]/gu, '').slice(0, 500); }
function replySim(a, b) {
  if (!a || !b) return 0;
  const bg = (x) => { const m = new Map(); for (let i = 0; i < x.length - 1; i++) { const g = x.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const A = bg(a), B = bg(b); let inter = 0, tot = 0;
  for (const [g, n] of A) { tot += n; if (B.has(g)) inter += Math.min(n, B.get(g)); }
  for (const n of B.values()) tot += n;
  return tot ? (2 * inter) / tot : 0;
}
function noteLoop(reply) {
  const cur = normReply(reply);
  if (!turnUsedTools) noToolTurns += 1; else { noToolTurns = 0; forceToolPrefill = false; }
  if (infiniteWake && noToolTurns >= 2 && replySim(prevReplyNorm, cur) >= 0.6) {
    forceToolPrefill = true;
    console.warn('[infwake] 检测到文字死循环（连续无工具 + 回复高度相似），下一轮补 <tool_call> 预填充');
  }
  prevReplyNorm = cur;
}
setInterval(() => { if (infiniteWake && !busy) queueInfiniteWake(1000); }, 60000);   // 循环万一因异常断了，兜底续上
// busy 卡死兜底：某个 await（工具/请求）真的无进展卡住超过 5 分钟才强制中断并续上；
// 以 lastTurnActivityTs 为准（流式吐字/调工具/TTS 均会刷新），避免连续多轮健康无限唤醒被误判为卡死！
setInterval(() => {
  if (!busy) return;
  if (!lastTurnActivityTs) { touchTurnActivity(); return; }
  if (Date.now() - lastTurnActivityTs < 5 * 60000) return;
  console.warn('[guard] 当前轮次无任何进展超过 5 分钟，强制中断并释放');
  turnAbortReason = 'guard';
  touchTurnActivity();
  try { turnAbort?.abort(); } catch {}
  try { speech.stop && speech.stop(); } catch {}
  busy = false;
  showBubble('（卡住了，我强行中断了上一轮～）');
  setTimeout(() => { if (!busy) hideBubble(); }, 6000);
  if (infiniteWake) queueInfiniteWake(3000);
}, 30000);
setInterval(() => {
  try {
    window.petWindow && window.petWindow.wakeBeat && window.petWindow.wakeBeat({
      infwake: !!infiniteWake,
      busy: !!busy,
      ctx: lastCtxTokens,
      turnSeq,
      lastActivityTs: lastTurnActivityTs,
    });
  } catch {}
}, 20000);
// ===== 语音录音 & SenseVoice 识别 =====
let micStream = null;
let micAudioCtx = null;
let micSource = null;
let micProcessor = null;
let micBuffers = [];
let isRecording = false;

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (v, off, str) => {
    for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i));
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (sampleRate * 1 channel * 2 bytes)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // 16 bits
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

async function startRecording() {
  if (isRecording) return;
  if (!unlocked) { speech.unlock(); unlocked = true; }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });
  } catch (err) {
    console.error('[mic] 获取麦克风失败:', err);
    showBubble('无法访问麦克风，请检查系统设置与权限');
    return;
  }

  micAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  micSource = micAudioCtx.createMediaStreamSource(micStream);
  micProcessor = micAudioCtx.createScriptProcessor(4096, 1, 1);
  micBuffers = [];

  micProcessor.onaudioprocess = (e) => {
    if (!isRecording) return;
    const inputData = e.inputBuffer.getChannelData(0);
    micBuffers.push(new Float32Array(inputData));
  };

  micSource.connect(micProcessor);
  micProcessor.connect(micAudioCtx.destination);
  isRecording = true;

  const micBtn = $('micbtn');
  if (micBtn) micBtn.classList.add('recording');
  showBubble('🎙️ 正在倾听主人说话…（再次点击结束并识别）');
}

async function stopRecording() {
  if (!isRecording) return null;
  isRecording = false;

  const micBtn = $('micbtn');
  if (micBtn) micBtn.classList.remove('recording');

  if (micProcessor) {
    try { micProcessor.disconnect(); } catch {}
    micProcessor.onaudioprocess = null;
    micProcessor = null;
  }
  if (micSource) {
    try { micSource.disconnect(); } catch {}
    micSource = null;
  }
  const sampleRate = micAudioCtx ? micAudioCtx.sampleRate : 16000;
  if (micAudioCtx) {
    try { await micAudioCtx.close(); } catch {}
    micAudioCtx = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }

  const totalLength = micBuffers.reduce((acc, b) => acc + b.length, 0);
  if (totalLength === 0) return null;

  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const b of micBuffers) {
    merged.set(b, offset);
    offset += b.length;
  }
  micBuffers = [];

  return { blob: encodeWAV(merged, sampleRate), duration: totalLength / sampleRate };
}

async function handleMicToggle() {
  if (isRecording) {
    const result = await stopRecording();
    if (!result || result.duration < 0.4) {
      showBubble('录音时间太短了哦');
      setTimeout(() => { if (!busy) hideBubble(); }, 2500);
      return;
    }
    showBubble('识别语音中…');
    try {
      const res = await fetch('/api/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav' },
        body: result.blob,
      });
      const data = await res.json();
      if (data && data.ok && data.text && data.text.trim()) {
        const text = data.text.trim();
        input.value = input.value ? (input.value + ' ' + text) : text;
        autoGrowInput();
        input.focus();
        hideBubble();
      } else {
        showBubble('没听清主人说了什么呢，再试一次吧~');
        setTimeout(() => { if (!busy) hideBubble(); }, 3000);
      }
    } catch (err) {
      console.error('[asr] 识别请求失败:', err);
      showBubble('语音识别失败: ' + (err.message || '网络或服务异常'));
      setTimeout(() => { if (!busy) hideBubble(); }, 4000);
    }
  } else {
    if (busy) {
      showBubble('正在忙碌中，请稍候…');
      return;
    }
    await startRecording();
  }
}

$('micbtn')?.addEventListener('click', handleMicToggle);

$('continuebtn').addEventListener('click', () => {
  if (busy) interrupt();
  else continueRequest();
});

async function continueRequest() {
  if (busy) return false;
  if (!lastExchange || !lastExchange.reqPayload) {
    showBubble('（没有可继续的上一轮请求）');
    setTimeout(() => { if (!busy) hideBubble(); }, 3000);
    return false;
  }
  if (!unlocked) { speech.unlock(); unlocked = true; }
  busy = true;
  turnSeq += 1;
  turnAbortReason = '';
  touchTurnActivity();
  turnAbort = new AbortController();
  const isAbort = (e) => e?.name === 'AbortError' || turnAbort?.signal.aborted;
  player.act('hop');
  showBubble('继续中…');
  let replied = false;
  try {
    // 把上一次的请求体和响应体拼在一起
    const baseMsgs = JSON.parse(JSON.stringify(lastExchange.reqPayload.messages || []));
    const prevRes = JSON.parse(JSON.stringify(lastExchange.resMsg || { role: 'assistant', content: '' }));

    const lastIdx = baseMsgs.length - 1;
    if (lastIdx >= 0 && baseMsgs[lastIdx].role === 'assistant' && prevRes.role === 'assistant') {
      // 若末尾是 assistant（例如预填充标签），则将响应体内容拼接上去续写
      baseMsgs[lastIdx] = {
        ...baseMsgs[lastIdx],
        content: (baseMsgs[lastIdx].content || '') + (prevRes.content || ''),
        ...(prevRes.tool_calls ? { tool_calls: prevRes.tool_calls } : {}),
      };
    } else if (prevRes) {
      baseMsgs.push(prevRes);
    }

    // 检查是否属于“说了要调用工具/在思考里计划了工具，但实际未触发 tool_call”的情况
    const toolKeywords = /(?:file_tool|copy_file|write_file|append_file|read_file|list_dir|delete_file|take_screenshot|search_memory|调用.*工具)/i;
    const hadNoToolCalls = !prevRes.tool_calls?.length && !/<tool_call>/i.test(prevRes.content || '');
    const seemsToolIntent = toolKeywords.test(prevRes.content || '') && hadNoToolCalls;

    if (seemsToolIntent) {
      // 预填充 <tool_call> 标签，强力引导模型补全计划中的工具参数
      const targetMsg = baseMsgs[baseMsgs.length - 1];
      if (targetMsg && targetMsg.role === 'assistant') {
        targetMsg.content = targetMsg.content.trimEnd() + '\n<tool_call>';
      }
    }

    const hadSaved = lastExchange.hadSavedHistory;
    const oldReply = hadSaved && history.length ? (history[history.length - 1].content || '') : '';
    const userContent = lastExchange.userContent || '（继续）';

    // 以拼接后的 baseMsgs 作为初始消息执行 askLLM 并进入工具循环
    const newReply = await askLLM(userContent, turnAbort.signal, [], baseMsgs);
    const fullReply = oldReply ? (oldReply + '\n' + newReply) : newReply;

    if (hadSaved && history.length && history[history.length - 1].role === 'assistant') {
      history[history.length - 1].content = fullReply;
    } else {
      history.push({ role: 'user', content: userContent }, { role: 'assistant', content: fullReply });
    }
    if (lastExchange) lastExchange.hadSavedHistory = true;
    await saveHistory();
    showBubble(fullReply);
    replied = true;
    react(newReply);
    // 流式阶段已成句即说（dispatchTTS），不再重复整段 speak
    memoryAddFire(userContent, fullReply);
    queueInfiniteWake();
    return true;
  } catch (e) {
    if (isAbort(e)) {
      if (!replied) {
        showBubble(turnAbortReason === 'guard' ? '（上一轮响应超时，自动重连…）' : '（已打断）');
        setTimeout(() => { if (!busy) hideBubble(); }, 3000);
      }
      if (turnAbortReason === 'guard') queueInfiniteWake(3000);
      return false;
    }
    showBubble('继续失败: ' + String(e.message || e), true);
    queueInfiniteWake(30000);
    return false;
  } finally {
    busy = false;
    turnAbort = null;
    touchTurnActivity();
    input.focus();
  }
}

// ===== 自动唤醒：运行时参数（输入框填分钟数，0 = 关闭），到点调 wakeNow() =====
// GPU 前置条件、忙时跳过都自动继承；间隔存 localStorage
let wakeTimer = null;
const wakeInput = document.getElementById('wakecfg');
function applyWakeInterval(min) {
  min = Math.max(0, Math.min(1440, parseInt(min, 10) || 0));
  localStorage.setItem('wakeIntervalMin', String(min));
  if (wakeTimer) { clearInterval(wakeTimer); wakeTimer = null; }
  if (min > 0) wakeTimer = setInterval(() => wakeNow(), min * 60 * 1000);
  wakeInput.value = min;
  wakeInput.title = min > 0 ? `自动唤醒：每 ${min} 分钟（0 = 关闭）` : '自动唤醒间隔（分钟），0 = 关闭';
}
wakeInput.addEventListener('change', () => applyWakeInterval(wakeInput.value));
wakeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); applyWakeInterval(wakeInput.value); wakeInput.blur(); }
});
applyWakeInterval(parseInt(localStorage.getItem('wakeIntervalMin') || '0', 10));

document.getElementById('chatform').addEventListener('submit', (e) => {
  e.preventDefault();
  send();
});
// 显式回车发送：表单里有多个文本字段且无提交按钮时，浏览器会禁用隐式提交，必须自己监听。
// isComposing 保护：中文输入法选词的回车不发送；Shift+回车 = 换行
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
    e.preventDefault();
    send();
  }
});

// ===== 图片输入：粘贴 + 全屏截图 =====
let pendingImage = null; // dataURL

function setPendingImage(dataUrl) {
  pendingImage = dataUrl;
  pendingBox.querySelector('img').src = dataUrl;
  pendingBox.style.display = dataUrl ? 'flex' : 'none';
  layoutChat();
}
function clearPendingImage(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  pendingImage = null;
  pendingBox.style.display = 'none';
  layoutChat();
  if (lastPX >= 0 && lastPY >= 0) refreshClickThrough(lastPX, lastPY);
}
const imgDelBtn = $('imgdel');
imgDelBtn.addEventListener('click', clearPendingImage);
imgDelBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

// 粘贴图片（截图工具/QQ/浏览器里 Ctrl+C 的图都能贴）
input.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
  if (!item) return; // 纯文本粘贴照旧
  e.preventDefault();
  const blob = item.getAsFile();
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    // 长边压到 1280，jpeg 0.85：省 base64 体积和 prefill
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    setPendingImage(c.toDataURL('image/jpeg', 0.85));
  };
  img.src = url;
});

// 📷 让她看你的全屏（Electron desktopCapturer，图只进本地模型）
$('shot').addEventListener('click', async () => {
  if (!window.petWindow?.captureScreen || busy) return;
  const b64 = await window.petWindow.captureScreen();
  if (b64) setPendingImage('data:image/jpeg;base64,' + b64);
});
$('close').addEventListener('click', () => { if (window.petWindow?.quitApp) window.petWindow.quitApp(); else window.close(); });

// ===== 全屏穿透 + 人物定位 =====
// 窗口盖满全屏、默认鼠标穿透（forward 让 livliv 收到全屏 pointermove，原生跟随全生效）。
// 光标悬停人物或 UI 时关掉穿透，才能点击/拖拽。
const petCanvas = $('pet');
const petWrap = $('petwrap');
const closeBtn = $('close');
const inputRow = $('inputrow');
const pendingBox = $('pendingimg');
let clickThrough = null;
function rectHit(el, x, y, insetX = 0, insetY = 0) {
  const r = el.getBoundingClientRect();
  return x >= r.left + insetX && x <= r.right - insetX && y >= r.top + insetY && y <= r.bottom - insetY;
}
function refreshClickThrough(x, y) {
  // 画布热区向内收一圈（画布四周是透明边距，收窄能少挡桌面）；输入框/气泡/图片预览/关闭钮外扩 6px 保证好点
  // 卧室整个矩形都是实体场景（盖住副屏），不穿透
  const overRoom = roomRect && x >= roomRect.x && x <= roomRect.x + roomRect.width && y >= roomRect.y && y <= roomRect.y + roomRect.height;
  const overPending = pendingBox && pendingBox.style.display !== 'none' && rectHit(pendingBox, x, y, -6, -6);
  const overBubble = bubble && bubble.style.display !== 'none' && rectHit(bubble, x, y, -6, -6);
  const over = overRoom ||
    rectHit(petCanvas, x, y, petCanvas.getBoundingClientRect().width * 0.14, 8) ||
    rectHit(closeBtn, x, y, -6, -6) ||
    rectHit(inputRow, x, y, -6, -6) ||
    overPending ||
    overBubble;
  if (over !== clickThrough) {
    clickThrough = over;
    window.petWindow?.setClickThrough?.(!over);
  }
}
let lastPX = -1, lastPY = -1;
window.addEventListener('pointermove', (e) => { lastPX = e.clientX; lastPY = e.clientY; refreshClickThrough(e.clientX, e.clientY); }, { passive: true });

// 拖拽 = 移动人物在屏幕上的位置（按右缘定位，不会贴出屏幕），位置存 localStorage
let drag = null;
// ===== 输入框自增高（textarea）：内容多行时变厚，上限约 5 行，超出内部滚动 =====
function autoGrowInput() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  input.style.overflowY = input.scrollHeight > 140 ? 'auto' : 'hidden';
  layoutChat();
}
input.addEventListener('input', autoGrowInput);
function layoutChat() {
  // 聊天框（气泡+输入）紧贴人物脚下：水平中心对齐；输入框顶边贴人物底边下方 2px
  // 垂直堆叠：输入框 → 待发图片（若有）→ 气泡（若有）；宽度固定 380，内容多时往"高"长
  const r = petCanvas.getBoundingClientRect();
  const left = Math.max(8, Math.min(window.innerWidth - 428, r.left + r.width / 2 - 210));
  const ih = inputRow.offsetHeight || 40;
  const inB = Math.max(2, window.innerHeight - r.bottom - ih - 4);
  inputRow.style.left = left + 'px';
  inputRow.style.bottom = inB + 'px';
  const imgB = inB + ih + 4;
  pendingBox.style.left = left + 'px';
  pendingBox.style.bottom = imgB + 'px';
  pendingBox.style.display = pendingImage ? 'flex' : 'none';
  const bubB = imgB + (pendingImage ? pendingBox.offsetHeight + 4 : 0);
  bubble.style.left = left + 'px';
  bubble.style.bottom = bubB + 'px';
  updatePetDprScale();
}
function loadPetPos() {
  try {
    const p = JSON.parse(localStorage.getItem('petPos2') || 'null');
    if (p) {
      //  clamp：保存时可能在副屏，副屏拔掉后不能丢到联合区域外
      petWrap.style.setProperty('--pet-right', Math.max(0, Math.min(window.innerWidth - 100, p.right)) + 'px');
      petWrap.style.setProperty('--pet-y', Math.max(46, Math.min(window.innerHeight - 80, p.bottom)) + 'px');
    }
  } catch {}
}
function savePetPos() {
  localStorage.setItem('petPos2', JSON.stringify({
    right: parseInt(petWrap.style.getPropertyValue('--pet-right')) || 24,
    bottom: parseInt(petWrap.style.getPropertyValue('--pet-y')) || 46,
  }));
}
loadPetPos();
function beginPetDrag(e) {
  // 起点必须取布局值（--pet-right/--pet-y），不能取 getBoundingClientRect：
  // 副屏 DPI 补偿 scale(0.5) 会把视觉矩形缩窄，跟 CSS 定位值对不上，第一次移动就跳半个宽度
  drag = {
    sx: e.clientX, sy: e.clientY,
    oRight: parseInt(petWrap.style.getPropertyValue('--pet-right')) || 24,
    oBottom: parseInt(petWrap.style.getPropertyValue('--pet-y')) || 46,
  };
  e.preventDefault();
}
petCanvas.addEventListener('mousedown', beginPetDrag);
// 气泡紧贴脚边、长回复时整个盖在她身上，且排在画布上层会吞掉按下事件 → 落点在她身上时把拖动接过来；
// 气泡其余区域仍可正常滚动/选中
bubble.addEventListener('mousedown', (e) => {
  if (rectHit(petCanvas, e.clientX, e.clientY, petCanvas.getBoundingClientRect().width * 0.14, 8)) beginPetDrag(e);
});
// 拖动按 rAF 合并：mousemove 可能 100+Hz，每帧只写一次样式 + 布局，否则混合DPI大窗下会明显拖慢
let dragRaf = 0, dragTarget = null;
window.addEventListener('mousemove', (e) => {
  if (!drag) return;
  const nR = Math.max(0, Math.min(window.innerWidth - 100, drag.oRight - (e.clientX - drag.sx)));
  const nB = Math.max(46, Math.min(window.innerHeight - 80, drag.oBottom - (e.clientY - drag.sy))); // 脚下留出对话框高度
  // 位移立即写：不能等 rAF——窗口被系统判为遮挡/后台时 rAF 会被节流，拖动就会“按得下但不跟手”，松手才瞬移
  petWrap.style.setProperty('--pet-right', nR + 'px');
  petWrap.style.setProperty('--pet-y', nB + 'px');
  dragTarget = { nR, nB };
  if (dragRaf) return;
  dragRaf = requestAnimationFrame(() => {
    dragRaf = 0;
    if (!dragTarget) return;
    layoutChat();   // 只有聊天框/气泡的位置合并到帧级
  });
});
window.addEventListener('mouseup', () => {
  if (!drag) return;
  if (dragRaf) { cancelAnimationFrame(dragRaf); dragRaf = 0; }
  dragTarget = null;
  drag = null; layoutChat(); savePetPos(); ensurePetVisible(); updateInRoom(true);
});
window.addEventListener('resize', () => { layoutChat(); syncRoomRect(); });

// 自己走过去：按房间比例 (fx,fy)=脚下位置，平滑滑行到目标（无迈腿动画）
let walkToken = 0;
function walkToFraction(fx, fy) {
  return new Promise((resolve) => {
    const token = ++walkToken;
    const W = window.innerWidth, H = window.innerHeight;
    // 用布局宽度：副屏有 DPI 补偿 scale(0.5)，getBoundingClientRect 会缩水，算出来脚点会偏半个宽度
    const halfW = Math.max(20, petCanvas.offsetWidth / 2);
    const curR = parseInt(petWrap.style.getPropertyValue('--pet-right')) || 24;
    const curB = parseInt(petWrap.style.getPropertyValue('--pet-y')) || 46;
    let tgtR = Math.round(W - fx * W - halfW);
    let tgtB = Math.round((1 - fy) * H);
    tgtR = Math.max(0, Math.min(W - 100, tgtR));
    tgtB = Math.max(46, Math.min(H - 80, tgtB));
    const dist = Math.hypot(tgtR - curR, tgtB - curB);
    const dur = Math.max(700, Math.min(4000, dist * 4));
    const t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    let settled = false;
    // 窗口被系统判为遮挡时 rAF 会被暂停，光靠 rAF 的滑行可能永远不结束 → 把整个工具轮卡在 busy 里。
    // 定时器兜底：到点直接落位并 resolve（窗口恢复后也不会再跳）。
    const guard = setTimeout(() => finish(true), dur + 1500);
    function finish(instant) {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      if (instant) {
        petWrap.style.setProperty('--pet-right', tgtR + 'px');
        petWrap.style.setProperty('--pet-y', tgtB + 'px');
      }
      savePetPos(); ensurePetVisible(); updateInRoom(true);
      // 她走到静止的光标底下时不会有新的 pointermove，主动按最后位置重算一次穿透，否则点不到/拖不动她
      if (lastPX >= 0) refreshClickThrough(lastPX, lastPY);
      resolve();
    }
    function step(now) {
      if (token !== walkToken) { settled = true; clearTimeout(guard); resolve(); return; }   // 被新的一次移动顶替
      const t = Math.min(1, (now - t0) / dur);
      const e = ease(t);
      petWrap.style.setProperty('--pet-right', (curR + (tgtR - curR) * e) + 'px');
      petWrap.style.setProperty('--pet-y', (curB + (tgtB - curB) * e) + 'px');
      layoutChat();
      if (t < 1) requestAnimationFrame(step);
      else finish(false);
    }
    requestAnimationFrame(step);
  });
}
// 屏幕 DIP → 窗口 CSS（跨屏窗按主屏 DPI 渲染；副屏那段坐标被系统按 V=WINDOW_DPR/该屏scaleFactor 放大，实测拟合）
function displayCssRect(d) {
  if (!d || !winBounds) return null;
  const V = WINDOW_DPR / (d.scaleFactor || 1);
  const b = d.bounds;
  return { x: b.x / V - winBounds.x, y: (2 * b.y) / V - winBounds.y, w: b.width / V, h: b.height / V };
}
function walkToCss(tx, ty) {
  return walkToFraction(tx / window.innerWidth, ty / window.innerHeight);
}

// 混合 DPI：一个窗只有一套 DPI，跨到缩放不同的屏会被整体放大/缩小。按"她此刻在哪块屏"动态补偿 CSS 缩放，让两块屏上大小一致。
let displayInfo = [];
let winBounds = null;
const WINDOW_DPR = window.devicePixelRatio || 1;
let dprFactor = 1;
let lastDprTransform = null;
const AUTO_DPI_SCALE = true; // 混合DPI：按她所在屏补偿CSS缩放，让两块屏上她一样大
async function refreshDisplays() {
  try {
    if (window.petWindow && window.petWindow.getDisplays) displayInfo = await window.petWindow.getDisplays();
    if (window.petWindow && window.petWindow.getWinBounds) winBounds = await window.petWindow.getWinBounds();
  } catch { displayInfo = []; }
  ensurePetVisible();
  updatePetDprScale();
}
// 她若落到"没有显示器的空档"（合成大窗跨越主副、副屏还错位时会出现），自动挪回某块真实屏的底部中间
function ensurePetVisible() {
  if (!displayInfo || !displayInfo.length || !winBounds) return;
  const right = parseInt(petWrap.style.getPropertyValue('--pet-right')) || 24;
  const bottom = parseInt(petWrap.style.getPropertyValue('--pet-y')) || 46;
  const petW = petCanvas.offsetWidth || 200;
  const fx = winBounds.x + (window.innerWidth - right - petW / 2);
  const fy = winBounds.y + (window.innerHeight - bottom);
  const onSome = displayInfo.some((d) => { const b = d.bounds; return fx >= b.x && fx <= b.x + b.width && fy >= b.y && fy <= b.y + b.height; });
  if (onSome) return;
  const d = displayInfo.find((x) => x.isPrimary) || displayInfo[0];
  const b = d.bounds;
  const tx = b.x + b.width / 2, ty = b.y + b.height - 80;            // 目标：某块屏底部中间（屏幕 DIP）
  const cX = tx - winBounds.x, cY = ty - winBounds.y;                 // 转成窗口内 client 坐标
  petWrap.style.setProperty('--pet-right', Math.max(0, Math.min(window.innerWidth - 100, window.innerWidth - cX - petW / 2)) + 'px');
  petWrap.style.setProperty('--pet-y', Math.max(46, Math.min(window.innerHeight - 80, window.innerHeight - cY)) + 'px');
  savePetPos();
  layoutChat();
}
function updatePetDprScale() {
  if (!AUTO_DPI_SCALE) return;
  if (!displayInfo || !displayInfo.length || !winBounds) return;
  const right = parseInt(petWrap.style.getPropertyValue('--pet-right')) || 24;
  const bottom = parseInt(petWrap.style.getPropertyValue('--pet-y')) || 46;
  const petW = petCanvas.offsetWidth || 200;
  const sx = winBounds.x + (window.innerWidth - right - petW / 2);   // 她脚下中心相对屏幕的 DIP 坐标（winBounds 由主进程 getBounds 给，可靠）
  const sy = winBounds.y + (window.innerHeight - bottom);
  let scale = WINDOW_DPR;
  for (const d of displayInfo) {
    const b = d.bounds;
    if (sx >= b.x && sx <= b.x + b.width && sy >= b.y && sy <= b.y + b.height) { scale = d.scaleFactor || WINDOW_DPR; break; }
  }
  // 补偿系数 = 该屏缩放 / 窗口渲染DPR：跨屏大窗按主屏DPI渲染时与旧公式等价；
  // 窗口只铺单屏时 DPR 等于该屏缩放，系数=1（PET_ONLY_BEDROOM 测试模式）
  const factor = Math.max(0.25, Math.min(4, scale / WINDOW_DPR));
  dprFactor = factor;
  const t = Math.abs(factor - 1) < 0.02 ? '' : 'scale(' + factor + ')';
  if (t === lastDprTransform) return;   // 拖动时每帧都会进来，值没变就别碰这 4 个元素
  lastDprTransform = t;
  // 注意：不能缩 #chatform（零高度的绝对定位容器，transform 会改掉子元素的包含块），要缩里面的 #inputrow
  for (const el of [petWrap, document.getElementById('inputrow'), document.getElementById('bubble'), document.getElementById('pendingimg')]) {
    if (!el) continue;
    el.style.transformOrigin = 'bottom center';
    el.style.transform = t;
  }
}
refreshDisplays();

// 滚轮缩放（在她身上滚）：20%~100% 屏高，localStorage 记忆
let petScale = Math.max(20, Math.min(100, parseFloat(localStorage.getItem('petScale')) || 88));
function applyScale() {
  petWrap.style.setProperty('--pet-h', petScale + '%');
  layoutChat();
  updateInRoom();
}
applyScale();
petCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  petScale = Math.max(20, Math.min(100, petScale + (e.deltaY < 0 ? 4 : -4)));
  localStorage.setItem('petScale', String(petScale));
  applyScale();
}, { passive: false });

// ===== 卧室（副屏）：整间房（含窗帘/灯的样子与点击）归 pet_space/room/index.html 自己；
// app 只负责：把 iframe 摆到卧室矩形、存 room-state.json、判断她在不在房间里、room_control 转发状态 =====
const roomEl = $('room');
const roomFrame = $('roomframe');
// 桌宠窗永远不渲染房间（房间在独立卧室窗）：把隐藏 iframe 也置空。
// 否则她的房间脚本会在桌宠窗里再跑一份——改动出 bug 会拖死桌宠窗的输入/拖动，
// 而且页面加载时 self report 的状态会覆盖窗帘/灯存盘。
if (ROLE === 'pet' && roomFrame) { try { roomFrame.src = 'about:blank'; } catch {} }
let bedroomMode = false; // 整窗在副屏 = 卧室铺满视口
let roomRect = null; // 卧室矩形（CSS px）；卧室模式下 = 整个视口
let roomState = { curtain: 'open', lamp: 'off' };
let inRoom = false;

function applyBedroom(on) {
  bedroomMode = ROLE === 'pet' ? false : !!on;   // 双窗：桌宠窗不画房间（房间在独立的卧室窗）
  roomEl.style.display = bedroomMode ? 'block' : 'none';
  syncRoomRect();
}
function syncRoomRect() {
  roomRect = bedroomMode ? { x: 0, y: 0, width: innerWidth, height: innerHeight } : null;
  updateInRoom();
}
// 把状态推给她的房间页（窗帘/灯由她渲染）
function pushRoomState() {
  try { roomFrame && roomFrame.contentWindow && roomFrame.contentWindow.postMessage({ type: 'set-room-state', state: roomState }, '*'); } catch {}
}
async function setRoomState(patch) {
  if (patch.curtain === 'open' || patch.curtain === 'closed') roomState.curtain = patch.curtain;
  if (patch.lamp === 'on' || patch.lamp === 'off') roomState.lamp = patch.lamp;
  pushRoomState();
  try {
    if (window.petWindow) await window.petWindow.roomStateSave(roomState);
    else await fetch('/api/room-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomState) });
  } catch {}
}
// 她的房间页点窗帘/灯后上报；只认这两种消息形状，其余一律忽略
window.addEventListener('message', (e) => {
  if (!roomFrame || e.source !== roomFrame.contentWindow) return;
  const d = e.data;
  if (!d || typeof d !== 'object') return;
  if (d.type === 'room-state-request') { pushRoomState(); return; }
  if (d.type !== 'room-state') return;
  if (d.curtain === 'open' || d.curtain === 'closed') roomState.curtain = d.curtain;
  if (d.lamp === 'on' || d.lamp === 'off') roomState.lamp = d.lamp;
  try {
    if (window.petWindow) window.petWindow.roomStateSave(roomState);
    else fetch('/api/room-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomState) });
  } catch {}
});
if (roomFrame) roomFrame.addEventListener('load', pushRoomState);
// 她改了 pet_space/room/ 下的文件：只重载房间 iframe（带缓存戳），不用重启 app
window.petWindow?.onRoomChanged?.(() => {
  if (roomFrame) roomFrame.src = '/pet_space/room/index.html?t=' + Date.now();
});
// 人物画布中心落进卧室矩形 = 在卧室；announce 时（拖拽松手）播报一句
function updateInRoom(announce = false) {
  const was = inRoom;
  if (!roomRect) { inRoom = false; return; }
  const r = petCanvas.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  inRoom = cx >= roomRect.x && cx <= roomRect.x + roomRect.width && cy >= roomRect.y && cy <= roomRect.y + roomRect.height;
  if (inRoom !== was && announce && !busy) {
    showBubble(inRoom ? '回卧室啦~' : '出来陪你啦~');
    setTimeout(() => { if (!busy) hideBubble(); }, 4000);
  }
}
(async () => {
  let s = null;
  try { s = window.petWindow ? await window.petWindow.roomStateLoad() : await (await fetch('/api/room-state')).json(); } catch {}
  roomState = { curtain: s?.curtain === 'closed' ? 'closed' : 'open', lamp: s?.lamp === 'on' ? 'on' : 'off' };
  pushRoomState();
})();
// 副屏插拔/分辨率变化：主进程重算窗口后通知这里重新拿房间矩形
window.petWindow?.onDisplaysChanged?.(async () => {
  try {
    const c = await (await fetch('/api/config', { cache: 'no-store' })).json();
    applyBedroom(c?.bedroom);
    await refreshDisplays();
    layoutChat();
  } catch {}
});

// ===== TEMP 诊断桩：指针事件计数 + 视线参数上报（每 2s） =====
{
  const dbg = { ptr: 0, mouse: 0, lastX: null, lastY: null, lastTarget: '', sent: 0 };
  window.addEventListener('pointermove', (e) => {
    dbg.ptr++; dbg.lastX = e.clientX; dbg.lastY = e.clientY; dbg.lastTarget = e.target?.id || e.target?.tagName || '?';
  }, { passive: true });
  window.addEventListener('mousemove', () => dbg.mouse++, { passive: true });
  setInterval(() => {
    const p = player?.params ?? {};
    fetch('/api/dbg', { method: 'POST', body: JSON.stringify({
      t: new Date().toISOString(), ptr: dbg.ptr, mouse: dbg.mouse,
      last: [dbg.lastX, dbg.lastY, dbg.lastTarget],
      angleX: +(+p.angleX ?? 0).toFixed(1), eyeBallX: +(+p.eyeBallX ?? 0).toFixed(2),
      browL: +(+p.browLY ?? 0).toFixed(2), smile: +(+p.smile ?? 0).toFixed(2),
      clickThrough, hasBridge: typeof window.petWindow !== 'undefined',
      dpr: WINDOW_DPR, wh: [innerWidth, innerHeight], fac: dprFactor,
      canvas: (() => { const r = petCanvas.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })(),
    }) }).catch(() => {});
    dbg.sent++;
  }, 2000);
}
// ===== TEMP 诊断桩结束 =====
// 一段话说完 6 秒后收起气泡（错误信息保留）
speech.onIdle = () => {
  if (bubble.classList.contains('error')) return;
  setTimeout(() => { if (!busy) hideBubble(); }, 6000);
};

(async () => {
  try {
    syncHistoryFromDisk(); // 启动时同步历史（异步，不阻塞角色加载）
    await player.load('/characters/p01/');
    // 不设常驻表情：中性脸才能看到 livliv 原生的视线跟随/挑眉/浅笑（p01 的 smile 是闭眼大笑，会锁死整张脸）
    layoutChat();
    showBubble('你好呀，我上线啦！');
    setTimeout(() => { if (!busy && bubble.textContent === '你好呀，我上线啦！') hideBubble(); }, 15000);
    // 临时/调试：?autowake=1 或 ?autowake=<文本> 启动 6 秒后自动发起一轮唤醒（用于端到端验证）
    const awParam = new URLSearchParams(location.search).get('autowake');
    if (awParam) {
      let awText = awParam === '1' ? '（自动测试）主人想你了，随便说一句' : awParam;
      if (awParam === 'editprobe') awText = '（测试）请在你的房间页面 pet_space/room/index.html 里加一行 HTML 注释 <!-- probe -->，改完调用 look_at_room 看一眼房间确认效果。';
      setTimeout(() => { if (!busy) wakeNow(awText); }, 6000);
      rlog('autowake', awText.slice(0, 40));
    }
  } catch (e) {
    showBubble('角色加载失败: ' + (e.message || e), true);
  }
})();
