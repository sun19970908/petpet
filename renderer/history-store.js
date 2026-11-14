// 对话历史：内存缓存、按模式落盘、启动同步
import { INF_WAKE_TEXT, textOf } from './prompt-builder.js';
import { REFLECT_TEXT } from './infinite-wake.js';

export function createHistoryStore({ debugMode }) {
  const history = []; // 主对话内存缓存（只读背景源，无限唤醒不写入它）
  const infHistory = []; // 当前阶段无限唤醒记录（按截止时间分文件，唤醒提示词本身不写入）

  function getHistMode(isInf = false) {
    if (isInf) return debugMode ? 'debug-infwake' : 'infwake';
    return debugMode ? 'debug' : undefined;
  }

  async function saveHistory(arr = history, isInf = false) {
    const mode = getHistMode(isInf);
    const qs = mode ? '?mode=' + mode : '';
    try {
      if (window.petWindow) await window.petWindow.historySave(arr, mode);
      else await fetch('/api/history' + qs, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(arr) });
    } catch (e) { console.error('聊天记录保存失败:', e); }
  }

  function isInternalPrompt(m) {
    if (m?.role !== 'user') return false;
    const text = typeof m.content === 'string' ? m.content : textOf(m.content);
    return text === INF_WAKE_TEXT || text === REFLECT_TEXT;
  }

  async function saveMessages(isInf, messages, replaceLast = false) {
    const target = isInf ? infHistory : history;
    const last = messages[messages.length - 1];
    let changed = false;
    if (replaceLast && last && target.length && target[target.length - 1].role === 'assistant') {
      target[target.length - 1].content = last.content;
      changed = true;
    } else {
      for (const m of messages) {
        if (isInternalPrompt(m)) continue;
        target.push(m); changed = true;
      }
    }
    if (changed) return saveHistory(target, isInf);
  }

  async function syncHistoryFromDisk(isInf = false) {
    const mode = getHistMode(isInf);
    const qs = mode ? '?mode=' + mode : '';
    let arr = [];
    try {
      arr = window.petWindow ? await window.petWindow.historyLoad(mode) : await (await fetch('/api/history' + qs)).json();
      if (!Array.isArray(arr)) arr = [];
    } catch { arr = []; }
    if (!isInf && !arr.length && !debugMode) {
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

  return { history, infHistory, getHistMode, saveHistory, saveMessages, syncHistoryFromDisk };
}
