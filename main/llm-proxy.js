// 通用 OpenAI 兼容 LLM 上游转发层：按 baseUrl 自动选用 http/https，并注入 Bearer Key（不暴露给渲染层）
const http = require('http');
const https = require('https');

function createLlmProxy({ getServerConfig, logError }) {
  function handleLlmRequest(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Method Not Allowed' } }));
      return;
    }

    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const cfg = getServerConfig();
      let endpoint;
      try {
        endpoint = new URL(cfg.baseUrl);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Invalid LLM baseUrl: ' + e.message } }));
        return;
      }

      const isLocal = endpoint.hostname === '127.0.0.1' || endpoint.hostname === 'localhost';
      if (!isLocal && !cfg.apiKey) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: { message: `LLM profile "${cfg.activeProfile}" 缺少 apiKey，请在 llm.config.json（或 config.json / LLM_API_KEY）中配置。` },
        }));
        return;
      }

      let bodyBuf = Buffer.concat(chunks);
      try {
        const parsed = JSON.parse(bodyBuf.toString('utf8'));
        const next = { ...(cfg.requestDefaults || {}), ...parsed };
        if (!next.model && cfg.model) next.model = cfg.model;
        bodyBuf = Buffer.from(JSON.stringify(next), 'utf8');
      } catch {}

      const headers = {
        ...(cfg.headers || {}),
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
        'Content-Length': String(bodyBuf.length),
      };
      if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;

      const transport = endpoint.protocol === 'https:' ? https : http;
      const defaultPort = endpoint.protocol === 'https:' ? 443 : 80;
      const upstream = transport.request({
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port ? Number(endpoint.port) : defaultPort,
        path: endpoint.pathname + endpoint.search,
        method: 'POST',
        headers,
      }, (up) => {
        const ct = up.headers['content-type'] || 'application/octet-stream';
        if (!res.headersSent) res.writeHead(up.statusCode || 502, { 'Content-Type': ct });
        up.on('error', () => {
          try { if (!res.destroyed && !res.writableEnded) res.end(); } catch {}
        });
        up.pipe(res);
      });

      res.on('error', () => {});
      upstream.on('error', (e) => {
        if (logError) logError(`[llm-proxy] ${cfg.activeProfile} 上游错误: ${e.message}`);
        if (!res.headersSent) {
          try { res.writeHead(502, { 'Content-Type': 'application/json' }); } catch {}
        }
        if (!res.destroyed && !res.writableEnded) {
          try { res.end(JSON.stringify({ error: { message: 'upstream error: ' + e.message } })); } catch {}
        }
      });

      res.on('close', () => {
        if (!res.writableFinished && !upstream.destroyed) {
          upstream.destroy();
        }
      });

      upstream.end(bodyBuf);
    });
  }

  return { handleLlmRequest };
}

module.exports = { createLlmProxy };
