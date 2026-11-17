#!/usr/bin/env node
// 真机状态探针：通过 CDP 连正在运行的桌宠实例，调 window.__pet.snapshot()。
// 用法: node skills/cdp-debug/snapshot.js [--port=9222]
// 输出: 实时状态 JSON（busy/turnSeq/气泡/房间状态/视口/最近对话等）。
// 退出码非 0 = CDP 不可达或调用失败（先查应用在不在跑、config.debugPort 开没开）。
'use strict';

const arg = (name, dft) => {
  const a = process.argv.find((s) => s.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : dft;
};
const PORT = arg('port', process.env.CDP_PORT || '9222');
const BASE = `http://127.0.0.1:${PORT}`;

main().catch((e) => {
  console.error('[snapshot] ' + e.message);
  console.error('  排查: 桌宠在跑吗？config.debugPort 开了吗（本机建议 9222，提交默认是 0）？');
  process.exit(1);
});

async function main() {
  let targets;
  try {
    const r = await fetch(BASE + '/json/list', { signal: AbortSignal.timeout(3000) });
    targets = await r.json();
  } catch (e) {
    throw new Error(`连不上 CDP ${BASE}: ${e.message}`);
  }
  const pet = targets.find((t) => t.type === 'page' && t.url.includes('role=pet'));
  if (!pet) {
    throw new Error('没找到桌宠窗 target（url 含 role=pet 的 page）。当前 targets: ' + targets.map((t) => t.url.slice(0, 60)).join(' | '));
  }
  const ws = new WebSocket(pet.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws 握手失败')); });
  try {
    const rpc = makeRpc(ws);
    const out = await rpc('Runtime.evaluate', {
      expression: 'window.__pet && window.__pet.snapshot ? JSON.stringify(window.__pet.snapshot()) : String(window.__pet)',
      returnByValue: true,
    });
    if (out.exceptionDetails) {
      throw new Error('snapshot() 抛错: ' + (out.exceptionDetails.exception?.description || out.exceptionDetails.text));
    }
    const v = out.result.value;
    if (v == null) throw new Error('window.__pet 不存在（页面还没加载完？）');
    console.log(typeof v === 'string' && v[0] === '{' ? JSON.stringify(JSON.parse(v), null, 2) : String(v));
  } finally {
    ws.close();
  }
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
