// DeepSeek 娘桌宠 - 渲染层：livliv player + 本地 Strata + GPT-SoVITS
import { Player } from '@livliv-dev/player';
import { createSpeech } from '@livliv-dev/player/voice';
import { THINK_MODULES, INF_WAKE_TEXT, textOf, formatMemories, buildMemoryQuery, assemblePrompt } from './prompt-builder.js';
import { TOOLS, parseTextToolCalls } from './tools-schema.js';
import { makeSentenceSlicer, rlog, createTtsController } from './tts.js';
import { createAsrController } from './asr-recorder.js';

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
const NO_INFWAKE = new URLSearchParams(location.search).has('noinfwake');
const history = []; // 主对话内存缓存（只读背景源，无限唤醒不写入它）
const infHistory = []; // 当前阶段无限唤醒记录（按截止时间分文件，只存纯 assistant 回复）
function getHistMode(isInf = false) {
  if (isInf) return DEBUG_MODE ? 'debug-infwake' : 'infwake';
  return DEBUG_MODE ? 'debug' : undefined;
}
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
async function saveHistory(arr = history, isInf = false) {
  const mode = getHistMode(isInf);
  const qs = mode ? '?mode=' + mode : '';
  try {
    if (window.petWindow) await window.petWindow.historySave(arr, mode);
    else await fetch('/api/history' + qs, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(arr) });
  } catch (e) { console.error('聊天记录保存失败:', e); }
}
async function syncHistoryFromDisk(isInf = false) {
  const mode = getHistMode(isInf);
  const qs = mode ? '?mode=' + mode : '';
  let arr = [];
  try {
    arr = window.petWindow ? await window.petWindow.historyLoad(mode) : await (await fetch('/api/history' + qs)).json();
    if (!Array.isArray(arr)) arr = [];
  } catch { arr = []; }
  if (!isInf && !arr.length && !DEBUG_MODE) {
    // 一次性迁移（仅正式主历史）：旧 localStorage 有记录且从未迁移过时搬过来（迁移标记防止删档后复活）
    try {
      if (!localStorage.getItem('chatHistoryMigrated')) {
        const legacy = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        if (Array.isArray(legacy) && legacy.length) { await saveHistory(legacy, false); arr = legacy; }
        localStorage.setItem('chatHistoryMigrated', '1');
        localStorage.removeItem('chatHistory');
      }
    } catch {}
  }
  const target = isInf ? infHistory : history;
  target.splice(0, target.length, ...arr);
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
const { speakSegment, speak } = createTtsController({ ttsUrl: TTS_URL, ttsRef: TTS_REF, speech, touchTurnActivity });
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

// 工具列表与文本解析已抽至 renderer/tools-schema.js

// ===== 语义记忆：相关回忆注入 + search_memory 工具 =====
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
async function memoryRecall(query, limit = 5, rawText = '') {
  try {
    const q = textOf(query).trim();
    if (!q) return [];
    const selfText = textOf(rawText).trim() || q;
    const searchP = window.petWindow
      ? window.petWindow.memorySearch(q, DEBUG_MODE ? 'debug' : undefined, limit)
      : fetch('/api/memory-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, mode: DEBUG_MODE ? 'debug' : undefined, limit }) }).then((res) => res.json());
    const r = await Promise.race([
      searchP,
      new Promise((resolve) => setTimeout(() => resolve({ hits: [] }), 8000)),
    ]);
    return (r && r.hits || []).filter((h) => h.text.trim() !== selfText && h.text.trim() !== '[用户] ' + selfText);
  } catch { return []; }
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

async function askLLM(userContent, signal, memories, continueBaseMsgs = null, isInf = false) {
  const mod = THINK_MODE === 'off' ? null : THINK_MODULES.pet_think; // v2：模型自评难度
  turnUsedTools = false;
  let bodyMsgs;
  if (continueBaseMsgs) {
    bodyMsgs = continueBaseMsgs.slice();
  } else {
    // 台账 + 强度指令通过提示词组装层统一拼装；主历史只读，无限唤醒拼 mainHistory + infHistory
    const ledger = await getToolLedger();
    const sysAndPersona = await getSystemAndPersona();
    const assembled = assemblePrompt({
      systemPrompt: sysAndPersona,
      memories,
      mainHistory: history,
      infHistory,
      isInfiniteWake: isInf,
      userContent,
      toolLedger: ledger,
      thinkMode: THINK_MODE,
      forceToolPrefill,
    });
    bodyMsgs = assembled.messages;
    if (assembled.consumedForceToolPrefill) forceToolPrefill = false;
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
  // 正常回合（非无限唤醒）：user 消息与每个工具轮都边跑边写进主历史；无限唤醒绝不写 user 占位进历史
  const isLive = !continueBaseMsgs;
  if (isLive && !isInf) { history.push({ role: 'user', content: userContent }); saveHistory(history, false); }
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
    lastExchange = { round, reqPayload: { ...reqPayload, stream: false, messages: sendMsgs }, resData: data, resMsg: msg, finish, userContent, isInf, hadSavedHistory: false };
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
        if (visible) {
          if (isInf) { infHistory.push({ role: 'assistant', content: visible }); saveHistory(infHistory, true); }
          else { history.push({ role: 'assistant', content: visible }); saveHistory(history, false); }
        }
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

// 切句器与 TTS 语音调度已抽至 renderer/tts.js

// 统一提交入口：发消息（text + 可选图片）；台账/强度指令由 askLLM 拼请求时临时挂载
let turnAbort = null; // 当前轮次的 AbortController：🔔 忙时点击 = 打断
async function submitRequest(text, image, { isInfiniteWake: isInf = false } = {}) {
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
    await syncHistoryFromDisk(false); // 主历史只读同步
    if (isInf) await syncHistoryFromDisk(true); // 无限唤醒阶段独立历史同步（跨截止点自动换新文件）
    player.act('hop');
    showBubble('…');
    const memQuery = buildMemoryQuery({
      mainHistory: history,
      infHistory,
      isInfiniteWake: isInf,
      userContent,
    });
    const recalled = await memoryRecall(memQuery, 5, text);
    touchTurnActivity();
    const reply = await askLLM(userContent, turnAbort.signal, recalled, null, isInf);
    if (isInf) {
      if (reply && String(reply).trim()) {
        infHistory.push({ role: 'assistant', content: reply });
        await saveHistory(infHistory, true);
      }
    } else {
      history.push({ role: 'assistant', content: reply });
      await saveHistory(history, false);
    }
    noteLoop(reply);
    if (lastExchange) lastExchange.hadSavedHistory = true;
    showBubble(reply);
    replied = true;
    react(reply);
    // 流式阶段已成句即说（dispatchTTS），不再重复整段 speak
    if (!isInf) memoryAddFire(userContent, reply); // 无限唤醒不再进 memory.orama
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
async function wakeNow(wakeText = '你被唤醒了，用户没有给你指示，自由行动吧', { isInfiniteWake: isInf = false } = {}) {
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
    await submitRequest(userContent, null, { isInfiniteWake: isInf });
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
// ===== 连续唤醒（∞）：她一停下来就再唤醒；开关会持久化（重启/看门狗拉起后自动恢复）；上下文多次≈64k 或到截止时间自动停 =====
let infiniteWake = false;
let infTimer = null;
function stopInfiniteWake(reason = '') {
  infiniteWake = false;
  try { localStorage.setItem('infwake', '0'); } catch {}
  $('infwake').classList.remove('on');
  $('infwake').title = '连续唤醒：她一停下来就再唤醒（无限模式）';
  if (infTimer) { clearTimeout(infTimer); infTimer = null; }
  if (reason) showBubble(reason);
}
function queueInfiniteWake(delay = 1500) {
  if (!infiniteWake || infTimer) return;
  infTimer = setTimeout(() => {
    infTimer = null;
    if (infiniteWake && !busy) wakeNow(INF_WAKE_TEXT, { isInfiniteWake: true });
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
window.petWindow?.onStopInfwake?.(() => {
  stopInfiniteWake('到截止时间啦，我先停下无限唤醒，等主人回来～');
  console.log('[infwake] 收到看门狗截止指令，已关闭无限唤醒');
});
// 持久化的无限唤醒：重启后自动恢复（看门狗拉起、崩溃重启都不丢）；若带 --no-infwake 则清掉不恢复
try {
  if (NO_INFWAKE) {
    localStorage.setItem('infwake', '0');
  } else if (localStorage.getItem('infwake') === '1') {
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
    stopInfiniteWake('上下文已经塞到 64k 好几次啦，我先停下无限唤醒，等主人回来～');
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
// ===== 语音录音 & SenseVoice 识别（已抽至 renderer/asr-recorder.js） =====
const { handleMicToggle } = createAsrController({
  getMicBtn: () => $('micbtn'),
  showBubble,
  hideBubble,
  input,
  autoGrowInput,
  isBusy: () => busy,
  unlockSpeech: () => { if (!unlocked) { speech.unlock(); unlocked = true; } },
});
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

    const isInf = Boolean(lastExchange.isInf);
    const targetHist = isInf ? infHistory : history;
    const hadSaved = lastExchange.hadSavedHistory;
    const oldReply = hadSaved && targetHist.length ? (targetHist[targetHist.length - 1].content || '') : '';
    const userContent = lastExchange.userContent || '（继续）';

    // 以拼接后的 baseMsgs 作为初始消息执行 askLLM 并进入工具循环
    const newReply = await askLLM(userContent, turnAbort.signal, [], baseMsgs, isInf);
    const fullReply = oldReply ? (oldReply + '\n' + newReply) : newReply;

    if (hadSaved && targetHist.length && targetHist[targetHist.length - 1].role === 'assistant') {
      targetHist[targetHist.length - 1].content = fullReply;
    } else if (isInf) {
      if (fullReply && String(fullReply).trim()) targetHist.push({ role: 'assistant', content: fullReply });
    } else {
      targetHist.push({ role: 'user', content: userContent }, { role: 'assistant', content: fullReply });
    }
    if (lastExchange) lastExchange.hadSavedHistory = true;
    await saveHistory(targetHist, isInf);
    showBubble(fullReply);
    replied = true;
    react(newReply);
    // 流式阶段已成句即说（dispatchTTS），不再重复整段 speak
    if (!isInf) memoryAddFire(userContent, fullReply);
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

// ===== 诊断桩：仅在 ?debug=1 时每 2s 上报指针与视线参数（日常不写盘避免日志膨胀） =====
if (DEBUG_MODE) {
  const dbg = { ptr: 0, mouse: 0, lastX: null, lastY: null, lastTarget: '', sent: 0 };
  window.addEventListener('pointermove', (e) => {
    dbg.ptr++; dbg.lastX = e.clientX; dbg.lastY = e.clientY; dbg.lastTarget = e.target?.id || e.target?.tagName || '?';
  }, { passive: true });
  window.addEventListener('mousemove', () => dbg.mouse++, { passive: true });
  setInterval(() => {
    const p = player?.params ?? {};
    fetch('/api/dbg', { method: 'POST', headers: { 'X-Pet-Debug': '1' }, body: JSON.stringify({
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
// ===== 诊断桩结束 =====
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
