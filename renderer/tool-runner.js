// 单次工具调用执行：参数解析、桌宠内置工具、主进程文件工具
export function createToolRunner({ petTools, showBubble, touchTurnActivity }) {
  async function run(call, bodyMsgs, { round, truncated }) {
    let parsed = {};
    let parseOk = true;
    try { parsed = JSON.parse(call.function?.arguments || '{}'); } catch { parseOk = false; }
    if (!parseOk) {
      bodyMsgs.push({ role: 'tool', tool_call_id: call.id, content: '错误：工具参数不是合法 JSON（通常是文本里的换行或引号没有正确转义）。请重新生成 arguments 为合法 JSON 后重试。' });
      return;
    }
    showBubble(round === 0 ? '看屏幕中…' : '继续翻…');
    if (call.function?.name === 'search_memory') {
      bodyMsgs.push({ role: 'tool', tool_call_id: call.id, content: await petTools.searchMemory(parsed) });
      return;
    }
    if (call.function?.name === 'walk_to') {
      bodyMsgs.push({ role: 'tool', tool_call_id: call.id, content: await petTools.walkTo(parsed) });
      return;
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
  return { run };
}
