// 流式内容过滤：从 SSE 增量里剥掉思考/工具标签，只在正文处回调；标签被 delta 切断时扣住半个标签等下一片
const TAG_RE = /<\/?(?:pet_think|think|tool_call|invoke)>/;
const CLOSE_THINK_RE = /<\/(?:pet_think|think)>/;
const CLOSE_TOOL_RE = /<\/(?:tool_call|invoke)>/;
const THINK_TAGS = ['<pet_think>', '</pet_think>', '<think>', '</think>'];
const TOOL_TAGS = ['<tool_call>', '</tool_call>', '<invoke>', '</invoke>'];
const ALL_TAGS = THINK_TAGS.concat(TOOL_TAGS);

function partialTagLen(s, tags = ALL_TAGS) {
  for (let len = Math.min(s.length, 12); len > 0; len--) {
    const tail = s.slice(-len);
    if (tags.some((tag) => tag.startsWith(tail))) return len;
  }
  return 0;
}

// 剥离思考标签：cfm 模式下引擎只返回续写部分——可能没有开头标签只有结尾 </think>，
// 两种形态都要兜住：成对块整体删；无开头时删到第一个结尾标签为止（剩下全是思考残段）
export function stripThink(s) {
  let t = String(s || '')
    .replace(/<(pet_)?think>[\s\S]*?<\/\1think>\s*/g, ''); // 成对块
  const m = t.match(/<\/(?:pet_)?think>/);
  if (m) t = t.slice(m.index + m[0].length); // 续写形态：掐到结尾标签
  return t.trim();
}

// 增量状态机：inThink 丢弃思考；inTool 留给 parseTextToolCalls；其余正文按增量交给 onText。
// 原生 tool_calls 先到时用 markTool() 让后续文本不再当正文。
export function createContentFilter({ startInThink = false, startInTool = false, onText = () => {} } = {}) {
  let inThink = Boolean(startInThink);
  let inTool = Boolean(startInTool);
  let raw = '';
  let processed = 0;

  function process() {
    for (;;) {
      const rest = raw.slice(processed);
      if (!rest) return;
      if (inThink) {
        const m = rest.match(CLOSE_THINK_RE);
        if (!m) {
          processed = raw.length - partialTagLen(rest, ['</pet_think>', '</think>']);
          return;
        }
        processed += m.index + m[0].length;
        inThink = false;
      } else if (inTool) {
        const m = rest.match(CLOSE_TOOL_RE);
        if (!m) {
          processed = raw.length - partialTagLen(rest, ['</tool_call>', '</invoke>']);
          return;
        }
        processed += m.index + m[0].length;
        inTool = false;
      } else {
        const m = rest.match(TAG_RE);
        const hold = partialTagLen(rest);
        if (m && m.index < rest.length - hold) {
          const body = rest.slice(0, m.index);
          if (body) onText(body);
          processed += m.index;
          if (m[0] === '<pet_think>' || m[0] === '<think>') {
            inThink = true;
            processed += m[0].length;
          } else if (m[0] === '<tool_call>' || m[0] === '<invoke>') {
            inTool = true;
            processed += m[0].length;
          } else {
            processed += m[0].length; // 正文态里的孤立关闭标签（如 cfm 后多吐的 </pet_think>）：直接丢弃
          }
        } else {
          const body = rest.slice(0, rest.length - hold);
          if (body) onText(body);
          processed += rest.length - hold;
          return; // 剩余是可能被切断的标签前缀，等下一个 delta
        }
      }
    }
  }

  return {
    feed(delta) {
      if (!delta) return;
      raw += delta;
      process();
    },
    markTool() { inTool = true; },
    get content() { return raw; },
    get inThink() { return inThink; },
    get inTool() { return inTool; },
  };
}
