// 本地 HTTP 路由：/api/* 与静态资源分发
const http = require('http');
const { loadTtsConfig } = require('../lib/config-store');
const { serveStaticAsset } = require('./static-assets');

function isApiRequestAllowed(req) {
  const port = String(req.socket.localPort || '');
  const host = String(req.headers.host || '').toLowerCase();
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return false;

  const origin = req.headers.origin;
  if (origin) {
    const o = String(origin).toLowerCase();
    if (o !== `http://127.0.0.1:${port}` && o !== `http://localhost:${port}`) return false;
  }

  const site = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (site && site !== 'same-origin' && site !== 'none') return false;
  return true;
}

function createHttpServer(deps) {
  const {
    APP_ROOT,
    llmConfigMgr,
    getConfig,
    getInfwakeCutoff,
    getInfwakePhaseId,
    getGsvModeLabel,
    getGsvIdleTimeoutMs,
    bedroomDisplay,
    getPetWin,
    roomStateLoad,
    roomStateSave,
    gpuUtil,
    memoryAdd,
    memorySearch,
    fstoolTail,
    getScreensInfo,
    captureScreenBy,
    historyLoad,
    historySave,
    runFsTool,
    checkComfy,
    checkPython,
    checkSearch,
    onLlmActivity,
    llmProxy,
    handleApi,
  } = deps;

  function handleRequest(req, res) {
    try {
      if (req.url.startsWith('/api/')) {
        handleApiRequest(req, res);
      } else {
        serveStaticAsset(req, res, APP_ROOT);
      }
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  }

  function handleApiRequest(req, res) {
    if (!isApiRequestAllowed(req)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }
    const apiPath = req.url.split('?')[0];
    if (apiPath === '/api/config') {
      const publicLlm = llmConfigMgr.getPublicConfig();
      const cfg = getConfig();
      const ttsCfg = loadTtsConfig(APP_ROOT);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        bedroom: Boolean(bedroomDisplay()),
        petOnlyBedroom: Boolean(cfg.petOnlyBedroom),
        splitWindows: cfg.splitWindows !== false,
        infwakeCutoff: getInfwakeCutoff().str,
        infwakePhase: getInfwakePhaseId(),
        ttsMode: getGsvModeLabel(),
        gsvMode: getGsvModeLabel(),
        gsvIdleSeconds: Math.round(getGsvIdleTimeoutMs() / 1000),
        ttsIdleSeconds: Math.round(getGsvIdleTimeoutMs() / 1000),
        watchdog: cfg.watchdog ?? false,
        infwakeReflectEvery: cfg.infwakeReflectEvery,
        characterPath: cfg.characterPath,
        llmProfile: publicLlm.activeProfile,
        tts: {
          url: ttsCfg.app.url,
          request: ttsCfg.request,
          shortTextLimit: ttsCfg.app.shortTextLimit,
          splitShort: ttsCfg.app.splitShort,
          splitLong: ttsCfg.app.splitLong,
        },
        llm: publicLlm,
      }));
      return;
    }
    if (apiPath === '/api/comfy-status') {
      Promise.resolve(checkComfy ? checkComfy() : false)
        .then((ok) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: Boolean(ok) }));
        })
        .catch((e) => { res.writeHead(500); res.end(String(e)); });
      return;
    }
    if (apiPath === '/api/python-status') {
      Promise.resolve(checkPython ? checkPython() : false)
        .then((ok) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: Boolean(ok) }));
        })
        .catch((e) => { res.writeHead(500); res.end(String(e)); });
      return;
    }
    if (apiPath === '/api/search-status') {
      Promise.resolve(checkSearch ? checkSearch() : false)
        .then((ok) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: Boolean(ok) }));
        })
        .catch((e) => { res.writeHead(500); res.end(String(e)); });
      return;
    }
    if (apiPath === '/api/infwake/stop' && req.method === 'POST') {
      let sent = false;
      try {
        const petWin = getPetWin();
        if (petWin && !petWin.isDestroyed()) {
          petWin.webContents.send('stop-infwake');
          sent = true;
        }
      } catch {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, sent }));
      return;
    }
    if (apiPath === '/api/room-state') {
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(roomStateLoad()));
        return;
      }
      if (req.method === 'POST') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          try { roomStateSave(JSON.parse(Buffer.concat(chunks).toString('utf8'))); res.writeHead(204); }
          catch (e) { res.writeHead(500); res.end(String(e)); }
          res.end();
        });
        return;
      }
    }
    if (apiPath === '/api/gpuutil') {
      gpuUtil().then((v) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(v === null ? 'null' : String(v));
      }).catch((e) => { res.writeHead(500); res.end(String(e)); });
      return;
    }
    if (apiPath === '/api/memory-add' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', async () => {
        let items = [], mode;
        try { const p = JSON.parse(Buffer.concat(chunks).toString('utf8')); items = p.items; mode = p.mode; } catch {}
        const out = await memoryAdd(items, mode);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      });
      return;
    }
    if (apiPath === '/api/memory-search' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', async () => {
        let query = '', mode, limit = 5;
        try { const p = JSON.parse(Buffer.concat(chunks).toString('utf8')); query = p.query; mode = p.mode; limit = p.limit; } catch {}
        const out = await memorySearch(query, mode, limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      });
      return;
    }
    if (apiPath === '/api/fstool-tail') {
      const n = parseInt(new URL(req.url, 'http://x').searchParams.get('n') || '10', 10);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fstoolTail(Number.isFinite(n) ? n : 10)));
      return;
    }
    if (apiPath === '/api/screens') {
      getScreensInfo().then((info) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info, null, 2));
      }).catch((e) => { res.writeHead(500); res.end(String(e)); });
      return;
    }
    if (apiPath === '/api/capture') {
      const which = new URL(req.url, 'http://127.0.0.1').searchParams.get('which') || 'main';
      captureScreenBy(which).then((b64) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(b64 === null ? 'null' : b64);
      }).catch((e) => { res.writeHead(500); res.end(String(e)); });
      return;
    }
    if (apiPath === '/api/history') {
      const mode = new URL(req.url, 'http://x').searchParams.get('mode');
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(historyLoad(mode)));
        return;
      }
      if (req.method === 'POST') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          try { historySave(JSON.parse(Buffer.concat(chunks).toString('utf8')), mode); res.writeHead(204); }
          catch (e) { res.writeHead(500); res.end(String(e)); }
          res.end();
        });
        return;
      }
    }
    if (apiPath === '/api/fstool' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', async () => {
        let call = {};
        try { call = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {}
        const out = await runFsTool(call);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      });
      return;
    }
    if (apiPath === '/api/llm') {
      onLlmActivity();
      llmProxy.handleLlmRequest(req, res);
      return;
    }
    handleApi(req, res);
  }

  return http.createServer(handleRequest);
}

module.exports = { createHttpServer, isApiRequestAllowed };
