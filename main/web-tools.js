// 联网工具：SearXNG 搜索 + 受控网页正文读取
// 只允许 http/https；fetch_url 拒绝本机、私有网段和重定向到这些地址，避免模型借网页读取访问本地 API。
const dns = require('dns').promises;
const net = require('net');

const MAX_SEARCH_BYTES = 2 * 1024 * 1024;
const MAX_FETCH_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function normalizeBaseUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString();
  } catch {
    return '';
  }
}

function searchEndpoint(baseUrl) {
  const u = new URL(baseUrl);
  u.hash = '';
  u.search = '';
  if (!/\/search\/?$/i.test(u.pathname)) {
    u.pathname = u.pathname.replace(/\/+$/, '') + '/search';
  }
  return u;
}

function isPrivateIp(ip) {
  if (net.isIP(ip) === 4) {
    const [a, b, c] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 192 && b === 0 && c === 0) return true;
    return false;
  }
  if (net.isIP(ip) === 6) {
    const s = ip.toLowerCase();
    if (s.startsWith('::ffff:')) return isPrivateIp(s.slice(7));
    const first = parseInt(s.split(':')[0] || '0', 16);
    if (s === '::' || s === '::1') return true;
    if ((first & 0xff00) === 0xfc00 || (first & 0xff00) === 0xfd00) return true;
    if ((first & 0xffc0) === 0xfe80) return true;
    if ((first & 0xff00) === 0xff00) return true;
    return false;
  }
  return true;
}

function parseHttpUrl(raw) {
  let u;
  try { u = new URL(String(raw ?? '').trim()); } catch { throw new Error('URL 格式不正确'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('只允许 http/https URL');
  if (!u.hostname) throw new Error('URL 缺少主机名');
  return u;
}

async function assertPublicHttpUrl(raw) {
  const u = parseHttpUrl(raw);
  const addresses = await dns.lookup(u.hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error('无法解析主机名');
  for (const item of addresses) {
    if (isPrivateIp(item.address)) throw new Error('拒绝访问本机或私有网络地址');
  }
  return u;
}

function normalizeHeaders(extra = {}) {
  return {
    'User-Agent': 'livliv-pet/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/json,text/plain,application/xml;q=0.9,*/*;q=0.5',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    ...extra,
  };
}

async function readLimitedBody(res, maxBytes) {
  const length = Number(res.headers.get('content-length') || 0);
  if (length > maxBytes) throw new Error('响应超过大小上限');
  if (!res.body) return Buffer.alloc(0);
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new Error('响应超过大小上限');
      chunks.push(Buffer.from(value));
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  return Buffer.concat(chunks);
}

async function fetchWithRedirects(rawUrl, { timeoutMs, maxBytes, allowPrivate = false, headers } = {}) {
  if (typeof fetch !== 'function') throw new Error('当前 Node 运行时没有 fetch');
  let current = allowPrivate ? parseHttpUrl(rawUrl) : await assertPublicHttpUrl(rawUrl);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let res;
      try {
        res = await fetch(current, { method: 'GET', redirect: 'manual', signal: controller.signal, headers: normalizeHeaders(headers) });
      } catch (e) {
        if (e?.name === 'AbortError') throw new Error('请求超时');
        throw new Error('请求失败: ' + String(e.message || e));
      }
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        try { await res.body?.cancel(); } catch {}
        if (!location) throw new Error('重定向缺少 Location');
        if (i === MAX_REDIRECTS) throw new Error('重定向次数过多');
        const next = new URL(location, current);
        current = allowPrivate ? parseHttpUrl(next.href) : await assertPublicHttpUrl(next.href);
        continue;
      }
      let buffer;
      try {
        buffer = await readLimitedBody(res, maxBytes);
      } catch (e) {
        if (e?.name === 'AbortError') throw new Error('请求超时');
        throw e;
      }
      return { res, url: current, buffer };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('重定向次数过多');
}

function decodeEntities(text) {
  const map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…' };
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => {
      try { return String.fromCodePoint(parseInt(h, 16)); } catch { return m; }
    })
    .replace(/&#(\d+);/g, (m, d) => {
      try { return String.fromCodePoint(parseInt(d, 10)); } catch { return m; }
    })
    .replace(/&([a-z][a-z0-9]+);/gi, (m, name) => map[name.toLowerCase()] ?? m);
}

function htmlToText(html) {
  let s = String(html)
    .replace(/<head\b[\s\S]*?<\/head>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|section|article|li|tr|h[1-6]|blockquote|pre|table)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  return s
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTitle(html) {
  const m = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(String(html));
  return m ? htmlToText(m[1]).replace(/\s+/g, ' ').trim().slice(0, 300) : '';
}

function truncate(text, maxChars) {
  const s = String(text ?? '');
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + `\n\n[内容已截断，共 ${s.length} 字符]`;
}

function createWebTools({ apiUrl, apiKey, timeoutMs = 15000, maxResults = 8 } = {}) {
  const baseUrl = normalizeBaseUrl(apiUrl);
  let endpoint = null;
  try { if (baseUrl) endpoint = searchEndpoint(baseUrl); } catch {}
  const enabled = Boolean(endpoint);
  const timeout = Math.max(1000, Math.min(60000, Number(timeoutMs) || 15000));
  const resultLimit = Math.max(1, Math.min(20, Number(maxResults) || 8));

  async function webSearch(args = {}) {
    if (!enabled) return { ok: false, error: '未配置 webSearchApiUrl，联网搜索不可用' };
    const query = String(args.query ?? '').trim();
    if (!query) return { ok: false, error: '参数错误：缺少 query' };
    const limit = Math.max(1, Math.min(20, parseInt(args.max_results, 10) || resultLimit));
    const u = new URL(endpoint.href);
    u.searchParams.set('q', query);
    u.searchParams.set('format', 'json');
    u.searchParams.set('language', 'zh-CN');
    const headers = { Accept: 'application/json' };
    if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
    try {
      const { res, buffer } = await fetchWithRedirects(u.href, { timeoutMs: timeout, maxBytes: MAX_SEARCH_BYTES, allowPrivate: true, headers });
      if (res.status < 200 || res.status >= 300) return { ok: false, error: `搜索 API HTTP ${res.status}` };
      let data;
      try { data = JSON.parse(buffer.toString('utf8')); } catch { return { ok: false, error: '搜索 API 返回的不是 JSON' }; }
      const items = Array.isArray(data.results) ? data.results : [];
      if (!items.length) return { ok: true, result: `[搜索: ${query}]\n没有找到结果` };
      const lines = [`[搜索: ${query}]`, `共 ${items.length} 条，返回前 ${Math.min(limit, items.length)} 条：`];
      items.slice(0, limit).forEach((item, index) => {
        const title = String(item.title ?? '').replace(/\s+/g, ' ').trim() || '(无标题)';
        const url = String(item.url ?? '').trim();
        const content = String(item.content ?? '').replace(/\s+/g, ' ').trim();
        lines.push('', `${index + 1}. ${title}`, url, content ? content.slice(0, 500) : '(无摘要)');
      });
      return { ok: true, result: lines.join('\n') };
    } catch (e) {
      return { ok: false, error: '搜索失败: ' + String(e.message || e) };
    }
  }

  async function fetchUrl(args = {}) {
    if (!enabled) return { ok: false, error: '未配置 webSearchApiUrl，网页读取不可用' };
    const raw = String(args.url ?? '').trim();
    if (!raw) return { ok: false, error: '参数错误：缺少 url' };
    const maxChars = Math.max(500, Math.min(30000, parseInt(args.max_chars, 10) || 12000));
    try {
      const { res, url, buffer } = await fetchWithRedirects(raw, {
        timeoutMs: timeout,
        maxBytes: MAX_FETCH_BYTES,
        allowPrivate: false,
        headers: { Accept: 'text/html,application/xhtml+xml,application/json,text/plain,application/xml;q=0.9,*/*;q=0.5' },
      });
      if (res.status < 200 || res.status >= 300) return { ok: false, error: `网页 HTTP ${res.status}` };
      const type = String(res.headers.get('content-type') || '').toLowerCase();
      const text = buffer.toString('utf8');
      const isHtml = type.includes('text/html') || type.includes('application/xhtml') || (!type && /<html|<body/i.test(text));
      const isText = isHtml || type.startsWith('text/') || type.includes('json') || type.includes('xml');
      if (!isText) return { ok: false, error: `不支持的内容类型: ${type || '(未知)'}` };
      let body = text;
      let title = '';
      if (isHtml) {
        title = extractTitle(text);
        body = htmlToText(text);
      } else if (type.includes('json')) {
        try { body = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      }
      const head = [`[网页: ${url.href}]`, title ? `[标题] ${title}` : '', `[状态] ${res.status}${type ? ' · ' + type : ''}`].filter(Boolean).join('\n');
      return { ok: true, result: head + '\n\n' + truncate(body, maxChars) };
    } catch (e) {
      return { ok: false, error: '网页读取失败: ' + String(e.message || e) };
    }
  }

  return {
    enabled,
    checkSearch: async () => enabled,
    webSearch,
    fetchUrl,
  };
}

module.exports = { createWebTools, isPrivateIp };
