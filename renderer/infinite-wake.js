// 连续唤醒（∞）状态机：开关持久化、自动排队续唤醒、上下文与文字死循环护栏
// 只依赖注入进来的 wakeText / wakeNow / showBubble / isBusy，不直接碰全局状态

const CTX_ABORT_COUNT = 3;
const DEFAULT_CTX_LIMIT = 64000;
const DEFAULT_REFLECT_EVERY = 8;
const TITLE_ON = '连续唤醒开：她一停下来就再唤醒（点击关闭）';
const TITLE_OFF = '连续唤醒：她一停下来就再唤醒（无限模式）';
export const REFLECT_TEXT = `【系统提醒】以下为定期注入内容：立刻暂停工具进入临时任务！在pet_think标签内思考一下最近几轮有没有陷入死循环，有没有计划使用工具但是忘记的情况，有没有太老实什么也没做的情况，有没有忘记主人的要求。思考之后，如果你有错误马上改正。如果没有错误，继续做之前的事情（如调用工具），或做点新的事情。
`;

// 反思时追加到 assistant 预填充的内容
const REFLECT_PREFILL = '<pet_think> \n 主人我现在就反思：';

function normReply(s) {
  return String(s || '').replace(/<[^>]+>/g, '').replace(/[\s\p{P}\p{S}]/gu, '').slice(0, 500);
}

function replySim(a, b) {
  if (!a || !b) return 0;
  const bg = (x) => {
    const m = new Map();
    for (let i = 0; i < x.length - 1; i++) {
      const g = x.slice(i, i + 2);
      m.set(g, (m.get(g) || 0) + 1);
    }
    return m;
  };
  const A = bg(a), B = bg(b);
  let inter = 0, tot = 0;
  for (const [g, n] of A) { tot += n; if (B.has(g)) inter += Math.min(n, B.get(g)); }
  for (const n of B.values()) tot += n;
  return tot ? (2 * inter) / tot : 0;
}

export function createInfiniteWake({ button, wakeNow, showBubble, isBusy, wakeText, getCtxLimit = () => DEFAULT_CTX_LIMIT, getReflectEvery = () => DEFAULT_REFLECT_EVERY, getTailUser = () => '', storage = window.localStorage }) {
  let on = false;
  let timer = null;
  let lastCtxTokens = 0;
  let ctxOverCount = 0;
  let prevReplyNorm = '';
  let noToolTurns = 0;
  let forceToolPrefill = false;
  let reflectSeq = 0;
  let reflectPending = false;
  let reflectDeferred = false;

  function persist(v) {
    try { storage.setItem('infwake', v ? '1' : '0'); } catch {}
  }

  function syncButton() {
    if (!button) return;
    button.classList.toggle('on', on);
    button.title = on ? TITLE_ON : TITLE_OFF;
  }

  function stop(reason = '') {
    on = false;
    reflectPending = false;
    reflectDeferred = false;
    persist(false);
    if (button) {
      button.classList.remove('on');
      button.title = TITLE_OFF;
    }
    if (timer) { clearTimeout(timer); timer = null; }
    if (reason) showBubble(reason);
  }

  function queue(delay = 1500) {
    if (!on || timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (on && !isBusy()) wakeNow(wakeText, { isInfiniteWake: true });
    }, delay);
  }

  function toggle() {
    on = !on;
    persist(on);
    syncButton();
    reflectPending = false;
    reflectDeferred = false;
    if (on) { reflectSeq = 0; queue(500); }
    else if (timer) { clearTimeout(timer); timer = null; }
  }

  // 重启后自动恢复（看门狗拉起、崩溃重启都不丢）；noinfwake 启动参数则清掉不恢复
  function restore({ disabled = false } = {}) {
    try {
      if (disabled) { persist(false); return; }
      if (storage.getItem('infwake') === '1') {
        on = true;
        syncButton();
        queue(3000);
      }
    } catch {}
  }

  // 中止条件：上下文多次接近/超过当前模型档案的 contextLength → 停无限唤醒（避免在塞满的上下文里空转，烧一晚上）
  function noteContext(pt) {
    pt = Number(pt);
    if (!Number.isFinite(pt) || pt <= 0) return;
    lastCtxTokens = pt;
    const limit = Number(getCtxLimit()) || DEFAULT_CTX_LIMIT;
    if (pt >= limit) ctxOverCount += 1;
    if (ctxOverCount >= CTX_ABORT_COUNT && on) {
      stop(`上下文已经塞到 ${Math.round(limit / 1000)}k 好几次啦，我先停下无限唤醒，等主人回来～`);
      console.warn('[infwake] 停止无限唤醒：prompt_tokens 达 ' + limit + ' 第 ' + ctxOverCount + ' 次');
    }
  }

  // 文字死循环护栏：连续"无工具 + 回复高度相似"且无限唤醒开着 → 下一轮补 <tool_call> 预填充，逼她动手
  function noteLoop(reply, usedTools) {
    const cur = normReply(reply);
    if (!usedTools) noToolTurns += 1;
    else { noToolTurns = 0; forceToolPrefill = false; }
    if (on && noToolTurns >= 2 && replySim(prevReplyNorm, cur) >= 0.6) {
      forceToolPrefill = true;
      console.warn('[infwake] 检测到文字死循环（连续无工具 + 回复高度相似），下一轮补 <tool_call> 预填充');
    }
    prevReplyNorm = cur;
  }

  function clearForceToolPrefill() { forceToolPrefill = false; }

  // 本次请求最后一条 user 是否就是开场注入的 tailUser
  function lastUserIsTailUser(msgs) {
    const instruction = String(getTailUser() || '').trim();
    if (!instruction) return false;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i]?.role !== 'user') continue;
      const content = msgs[i].content;
      return typeof content === 'string' && content.trim() === instruction;
    }
    return false;
  }

  // 反思提醒：每 N 次无限唤醒插入一条 user 反思提示；同时追加 assistant 预填充。
  function reflect(msgs) {
    if (!on) { reflectPending = false; reflectDeferred = false; return false; }
    // 上一轮如果异常中断没来得及回填，不能把旧标记算到这一轮
    reflectPending = false;
    reflectSeq += 1;
    const every = Number(getReflectEvery()) || DEFAULT_REFLECT_EVERY;
    if (reflectSeq % every !== 0) return false;

    // 反思刚好撞上 tailUser：只推迟一轮，避免工具轮里最后一个 user
    // 一直是 tailUser 导致反思永远不触发
    if (!reflectDeferred && lastUserIsTailUser(msgs)) {
      reflectDeferred = true;
      reflectSeq = Math.max(0, reflectSeq - 1);
      return false;
    }
    reflectDeferred = false;

    // 原有行为：user 反思提示插在最后一条 assistant 之前，保持续写状态
    const at = msgs[msgs.length - 1]?.role === 'assistant' ? msgs.length - 1 : msgs.length;
    msgs.splice(at, 0, { role: 'user', content: REFLECT_TEXT });

    // 新增：assistant 预填充，追加到最后一条 assistant；没有则新建
    if (REFLECT_PREFILL) {
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') {
        last.content = (last.content || '') + REFLECT_PREFILL;
      } else {
        msgs.push({ role: 'assistant', content: REFLECT_PREFILL });
      }
    }
    reflectPending = true;
    return true;
  }

  // 反思请求返回后调用：本次反思没有产生正文就退回计数器，下一轮同一位置重试
  function noteReflectResult(content) {
    if (!reflectPending) return;
    reflectPending = false;
    if (!String(content || '').trim()) {
      reflectSeq = Math.max(0, reflectSeq - 1);
    }
  }

  // 循环万一因异常断了，兜底续上
  function startKeepalive(ms = 60000) {
    setInterval(() => { if (on && !isBusy()) queue(1000); }, ms);
  }

  return {
    get on() { return on; },
    get lastCtxTokens() { return lastCtxTokens; },
    get forceToolPrefill() { return forceToolPrefill; },
    clearForceToolPrefill,
    stop,
    queue,
    toggle,
    restore,
    noteContext,
    noteLoop,
    reflect,
    noteReflectResult,
    startKeepalive,
  };
}
