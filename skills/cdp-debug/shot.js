#!/usr/bin/env node
// 真机截图：通过 CDP Page.captureScreenshot 截真实运行窗口（不是网页副本）。
// 用法: node skills/cdp-debug/shot.js [pet|room|iframe|all] [--port=9222] [--out=前缀]
//   pet    桌宠窗（透明置顶窗）
//   room   卧室窗（room.html 宿主）
//   iframe 房间场景本体（iframe target 不支持 Page 域，自动改从宿主窗截取 iframe 区域）
//   all    以上全部（默认）
// 输出: 每张 PNG 的绝对路径逐行打印——拿到路径后务必用读图工具打开看。
'use strict';

const path = require('path');
const fs = require('fs');

const arg = (name, dft) => {
  const a = process.argv.find((s) => s.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : dft;
};
const want = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'all';
const PORT = arg('port', process.env.CDP_PORT || '9222');
const OUT = arg('out', 'shot');
const BASE = `http://127.0.0.1:${PORT}`;

const PICK = {
  pet: (t) => t.url.includes('role=pet'),
  room: (t) => t.url.includes('/renderer/room.html'),
};
if (!['pet', 'room', 'iframe', 'all'].includes(want)) {
  console.error('[shot] 未知目标: ' + want + '（可选 pet|room|iframe|all）');
  process.exit(2);
}

main().catch((e) => {
  console.error('[shot] ' + e.message);
  console.error('  排查: 桌宠在跑吗？config.debugPort 开了吗（本机建议 9222，提交默认是 0）？');
  process.exit(1);
});

async function main() {
  let pages;
  try {
    const r = await fetch(BASE + '/json/list', { signal: AbortSignal.timeout(3000) });
    pages = (await r.json()).filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  } catch (e) {
    throw new Error(`连不上 CDP ${BASE}: ${e.message}`);
  }
  if (!pages.length) throw new Error('一个窗口 target 都没有');

  // 组装截取计划：页面整截 + iframe 从宿主窗 clip
  const plan = [];
  if (want === 'all') pages.forEach((t) => plan.push({ label: 'page', t }));
  else if (want === 'pet') pages.filter(PICK.pet).forEach((t) => plan.push({ label: 'pet', t }));
  else if (want === 'room') pages.filter(PICK.room).forEach((t) => plan.push({ label: 'room', t }));
  if (want === 'all' || want === 'iframe') {
    for (const t of pages) {
      const rect = await iframeRect(t);
      if (rect) plan.push({ label: 'iframe', t, clip: rect });
    }
  }
  if (!plan.length) throw new Error(`没有匹配 "${want}" 的可截目标`);

  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  let n = 0;
  for (const item of plan) {
    let b64;
    try {
      b64 = await capture(item.t.webSocketDebuggerUrl, item.clip);
    } catch (e) {
      console.warn('[shot] 跳过 ' + (item.t.title || item.t.url).slice(0, 50) + ': ' + e.message);
      continue;
    }
    const tag = (item.t.title || item.t.url).replace(/[\/\\?*:;<>|\s.\-_]+/g, '_').slice(0, 24) || 'x';
    const file = path.resolve(`${OUT}-${item.label}-${stamp}-${++n}-${tag}.png`);
    fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    console.log(file);
  }
  if (!n) throw new Error('匹配到目标但一张都没截成');
}

// 在宿主页面里找 iframe 的可见矩形；没有（或 0x0，如分屏模式下桌宠窗的装修层）返回 null
async function iframeRect(t) {
  const ws = await open(t.webSocketDebuggerUrl);
  try {
    const rpc = makeRpc(ws);
    const out = await rpc('Runtime.evaluate', {
      expression: '(()=>{const f=document.querySelector("iframe");if(!f)return null;const r=f.getBoundingClientRect();return JSON.stringify({x:r.x,y:r.y,width:r.width,height:r.height})})()',
      returnByValue: true,
    });
    const v = out.result && out.result.value;
    if (!v) return null;
    const rect = JSON.parse(v);
    return rect.width > 2 && rect.height > 2 ? rect : null;
  } catch {
    return null;
  } finally {
    ws.close();
  }
}

async function capture(url, clip) {
  const ws = await open(url);
  try {
    const rpc = makeRpc(ws);
    await rpc('Page.enable', {});
    const params = { format: 'png' };
    if (clip) params.clip = { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 1 };
    const res = await rpc('Page.captureScreenshot', params, 10000);
    return res.data;
  } finally {
    ws.close();
  }
}

async function open(url) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws 握手失败')); });
  return ws;
}

function makeRpc(ws) {
  let id = 0;
  const pend = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const p = pend.get(m.id);
    if (p) {
      pend.delete(m.id);
      clearTimeout(p.t);
      m.error ? p.rej(new Error(m.method + ': ' + m.error.message)) : p.res(m.result);
    }
  };
  return (method, params, ms = 8000) => new Promise((res, rej) => {
    const i = ++id;
    pend.set(i, { res, rej, t: setTimeout(() => { pend.delete(i); rej(new Error(method + ' 超时')); }, ms) });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
