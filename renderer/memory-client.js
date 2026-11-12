// 语义记忆与工具台账的渲染层客户端：优先走 preload 桥（petWindow），没有桥时落回 HTTP
import { textOf } from './prompt-builder.js';

export function createMemoryClient({ debugMode = false } = {}) {
  const mode = () => (debugMode ? 'debug' : undefined);

  // 每轮结束后把本轮两条写入语义索引（失败不影响聊天）
  async function add(userContent, reply) {
    try {
      const items = [
        { text: '[用户] ' + textOf(userContent), role: 'user', kind: 'chat', ts: Date.now() },
        { text: '[DeepSeek娘] ' + reply, role: 'assistant', kind: 'chat', ts: Date.now() + 1 },
      ];
      if (window.petWindow) await window.petWindow.memoryAdd(items, mode());
      else await fetch('/api/memory-add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, mode: mode() }) });
    } catch {}
  }

  async function recall(query, limit = 5, rawText = '') {
    try {
      const q = textOf(query).trim();
      if (!q) return [];
      const selfText = textOf(rawText).trim() || q;
      const searchP = window.petWindow
        ? window.petWindow.memorySearch(q, mode(), limit)
        : fetch('/api/memory-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, mode: mode(), limit }) }).then((res) => res.json());
      const r = await Promise.race([
        searchP,
        new Promise((resolve) => setTimeout(() => resolve({ hits: [] }), 8000)),
      ]);
      return ((r && r.hits) || []).filter((h) => h.text.trim() !== selfText && h.text.trim() !== '[用户] ' + selfText);
    } catch { return []; }
  }

  // 工具调用台账：自动注入（她真实做过什么的唯一权威记录，防"没做却说做了"）
  async function ledger() {
    try {
      const lines = window.petWindow
        ? await window.petWindow.fstoolTail(10)
        : await (await fetch('/api/fstool-tail?n=10')).json();
      return lines.length ? '\n\n【工具调用台账】（你最近 10 次真实的工具操作记录，引用时以此为准）\n' + lines.map((l) => '- ' + l).join('\n') : '';
    } catch { return ''; }
  }

  return { add, recall, ledger };
}
