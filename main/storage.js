// 语义记忆（Orama + 硅基流动 embedding）、配置、聊天历史（主历史与无限唤醒分文件）及房间状态读写
const fs = require('fs');
const path = require('path');

function createStorage({ APP_ROOT, PET_SPACE_DIR, readLastLines }) {
  const MEMORY_FILE = path.join(APP_ROOT, 'history', 'memory.orama');
  const MEMORY_FILE_DEBUG = path.join(APP_ROOT, 'history', 'debug-memory.orama');
  let memoryDB = null;
  let memoryDBDebug = null;
  let oramaLib = null;
  let mandarinTok = null;

  function memoryFileFor(mode) { return mode === 'debug' ? MEMORY_FILE_DEBUG : MEMORY_FILE; }
  async function getOrama() {
    if (!oramaLib) oramaLib = await import('@orama/orama');
    return oramaLib;
  }
  async function getTokenizer() {
    if (!mandarinTok) {
      const m = await import('@orama/tokenizers/mandarin');
      mandarinTok = m.createTokenizer();
    }
    return mandarinTok;
  }
  const MEMORY_SCHEMA = { text: 'string', role: 'string', kind: 'string', ts: 'number', embedding: 'vector[1024]' };

  async function memoryInit(mode) {
    const { create, load } = await getOrama();
    const tok = await getTokenizer();
    const file = memoryFileFor(mode);
    if (fs.existsSync(file)) {
      try {
        // Orama v3 的分词器必须挂在 components: { tokenizer } 下，否则会退化为默认空格分词（中文 0 命中）
        const db = await create({ schema: MEMORY_SCHEMA, components: { tokenizer: tok } });
        const buf = await fs.promises.readFile(file);
        let raw;
        try { raw = JSON.parse(buf.toString('utf8')); } catch { raw = buf; }
        await load(db, raw);
        return db;
      } catch (e) { console.error('[memory] 索引加载失败，重建:', e.message); }
    }
    return create({ schema: MEMORY_SCHEMA, components: { tokenizer: tok } });
  }

  const memSaveState = {};
  async function memorySaveNow(mode) {
    const { save } = await getOrama();
    const db = mode === 'debug' ? memoryDBDebug : memoryDB;
    if (!db) return;
    const target = memoryFileFor(mode);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    const raw = await save(db);
    const isPlainObject = raw && typeof raw === 'object' && !Buffer.isBuffer(raw) && !(raw instanceof ArrayBuffer) && !ArrayBuffer.isView(raw);
    const data = isPlainObject ? JSON.stringify(raw) : Buffer.from(raw);
    const tmp = target + '.tmp';
    await fs.promises.writeFile(tmp, data);
    await fs.promises.rename(tmp, target);
  }
  async function memorySave(mode) {
    const k = mode === 'debug' ? 'debug' : 'prod';
    if (memSaveState[k]) clearTimeout(memSaveState[k]);
    memSaveState[k] = setTimeout(() => {
      memSaveState[k] = null;
      memorySaveNow(mode).catch((e) => console.error('[memory] 索引异步落盘失败:', e.message));
    }, 5000);
  }

  async function sfEmbed(texts) {
    const cfg = JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'config.json'), 'utf8'));
    const res = await fetch('https://api.siliconflow.cn/v1/embeddings', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { 'Authorization': 'Bearer ' + cfg.siliconflowKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: cfg.embeddingModel || 'BAAI/bge-m3', input: texts }),
    });
    if (!res.ok) throw new Error('embedding HTTP ' + res.status + ': ' + (await res.text()).slice(0, 120));
    const d = await res.json();
    return d.data.map((x) => x.embedding);
  }

  const memInitPromise = {};
  async function ensureMemoryDB(mode) {
    const k = mode === 'debug' ? 'debug' : 'prod';
    if (mode === 'debug' && memoryDBDebug) return memoryDBDebug;
    if (mode !== 'debug' && memoryDB) return memoryDB;
    if (memInitPromise[k]) return memInitPromise[k];
    memInitPromise[k] = memoryInit(mode).then((db) => {
      if (mode === 'debug') memoryDBDebug = db;
      else memoryDB = db;
      return db;
    }).finally(() => { memInitPromise[k] = null; });
    return memInitPromise[k];
  }

  async function memoryAdd(items, mode) {
    if (!items?.length) return { ok: true, count: 0 };
    const { insert } = await getOrama();
    const db = await ensureMemoryDB(mode);
    const texts = items.map((i) => String(i.text || ''));
    let vectors;
    try { vectors = await sfEmbed(texts); }
    catch (e) { return { ok: false, error: 'embedding 失败: ' + e.message }; }
    for (let i = 0; i < items.length; i++) {
      await insert(db, { text: texts[i], role: items[i].role || 'user', kind: items[i].kind || 'chat', ts: items[i].ts || Date.now(), embedding: vectors[i] });
    }
    await memorySave(mode);
    return { ok: true, count: items.length };
  }

  async function memorySearch(query, mode, limit = 5) {
    const { search } = await getOrama();
    const db = await ensureMemoryDB(mode);
    if (!db) return { ok: true, hits: [] };
    let qvec = null;
    try { qvec = (await sfEmbed([String(query)]))[0]; } catch {}
    const r = await search(db, {
      term: String(query),
      mode: qvec ? 'hybrid' : 'fulltext',
      ...(qvec ? { vector: { value: qvec, property: 'embedding' }, similarity: 0.2 } : {}),
      limit: limit || 5,
    });
    return {
      ok: true,
      hits: r.hits.map((h) => ({ text: h.document.text, role: h.document.role, kind: h.document.kind, ts: h.document.ts, score: +Number(h.score).toFixed(4) })),
    };
  }

  async function memoryBackfill(mode) {
    const file = mode === 'debug' ? null : path.join(APP_ROOT, 'history', '聊天记录.json');
    if (!file || fs.existsSync(memoryFileFor(mode))) return;
    try {
      const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(arr) || !arr.length) return;
      const items = arr.map((m) => ({
        text: typeof m.content === 'string' ? m.content : '[图片] ' + ((m.content || []).find((c) => c.type === 'text')?.text || ''),
        role: m.role, kind: 'chat', ts: Date.now(),
      })).filter((i) => i.text.trim());
      const out = await memoryAdd(items, mode);
      console.error('[memory] 回填完成:', out.count, '条');
    } catch (e) { console.error('[memory] 回填失败:', e.message); }
  }

  // ===== 历史记录与配置 =====
  const HISTORY_FILE = path.join(APP_ROOT, 'history', '聊天记录.json');
  const HISTORY_FILE_DEBUG = path.join(APP_ROOT, 'history', 'debug-聊天记录.json');
  const INFWAKE_DIR = path.join(APP_ROOT, 'history', 'infwake');

  function getConfig() {
    try { return JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'config.json'), 'utf8')); }
    catch { return {}; }
  }
  function getInfwakeCutoff() {
    const raw = String(getConfig().infwakeCutoff || '12:00').trim();
    const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
    const hour = m ? Math.max(0, Math.min(23, Number(m[1]))) : 12;
    const min = m ? Math.max(0, Math.min(59, Number(m[2]))) : 0;
    return { str: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`, hour, min };
  }
  function getInfwakePhaseId(now = new Date()) {
    const { hour, min } = getInfwakeCutoff();
    const shifted = new Date(now.getTime() - (hour * 60 + min) * 60000);
    const y = shifted.getFullYear();
    const mo = String(shifted.getMonth() + 1).padStart(2, '0');
    const d = String(shifted.getDate()).padStart(2, '0');
    return `${y}${mo}${d}`;
  }
  function historyFile(mode) {
    if (mode === 'debug') return HISTORY_FILE_DEBUG;
    if (mode === 'infwake') return path.join(INFWAKE_DIR, `${getInfwakePhaseId()}.json`);
    if (mode === 'debug-infwake') return path.join(INFWAKE_DIR, `debug-${getInfwakePhaseId()}.json`);
    return HISTORY_FILE;
  }

  function fstoolTail(n = 10) {
    return readLastLines(path.join(APP_ROOT, 'logs', 'fstool.log'), n).map((l) => {
      try {
        const d = JSON.parse(l);
        const a = d.args || {};
        const detail = (a.src_path && a.dest_path ? a.src_path + ' -> ' + a.dest_path : '') || a.path || a.query || ('content ' + String(a.content || '').length + '字') || '';
        return `${d.t.slice(5, 16).replace('T', ' ')} UTC ${d.name} ${detail}`;
      } catch { return l.slice(0, 100); }
    });
  }

  function historyLoad(mode) {
    try {
      const raw = fs.readFileSync(historyFile(mode), 'utf8');
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function historySave(arr, mode) {
    const targetFile = historyFile(mode);
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    const isInfwake = mode === 'infwake' || mode === 'debug-infwake';
    if (isInfwake) {
      // 无限唤醒独立记录：剔除一切 user 占位、唤醒提示词与截图引用，只保留纯 assistant 回复
      const cleaned = (Array.isArray(arr) ? arr : [])
        .filter((m) => m && m.role === 'assistant')
        .map((m) => {
          if (typeof m.content === 'string') return { role: 'assistant', content: m.content };
          if (Array.isArray(m.content)) {
            const text = m.content.filter((c) => c?.type === 'text').map((c) => c.text || '').join('');
            return { role: 'assistant', content: text };
          }
          return null;
        })
        .filter((m) => m && typeof m.content === 'string' && m.content.trim());
      fs.writeFileSync(targetFile, JSON.stringify(cleaned, null, 1), 'utf8');
      return true;
    }
    const IMG_DIR = path.join(APP_ROOT, 'history', 'img');
    fs.mkdirSync(IMG_DIR, { recursive: true });
    let imgSeq = 0;
    const cleaned = arr.map((m, mi) => {
      if (!Array.isArray(m.content)) return m;
      const content = m.content.map((c, ci) => {
        const url = c?.image_url?.url;
        if (c?.type === 'image_url' && typeof url === 'string' && url.startsWith('data:image/')) {
          const mm = /^data:image\/(\w+);base64,(.*)$/.exec(url);
          if (mm) {
            const ext = mm[1] === 'jpeg' ? 'jpg' : mm[1];
            const name = `img_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${mi}_${ci}_${imgSeq++}.${ext}`;
            fs.writeFileSync(path.join(IMG_DIR, name), Buffer.from(mm[2], 'base64'));
            return { ...c, image_url: { url: `/history/img/${name}` } };
          }
        }
        return c;
      });
      return { ...m, content };
    });
    fs.writeFileSync(targetFile, JSON.stringify(cleaned, null, 1), 'utf8');
    return true;
  }

  // 卧室状态（窗帘/灯）：存 pet_space/room-state.json
  const ROOM_STATE_FILE = path.join(PET_SPACE_DIR, 'room-state.json');
  function roomStateLoad() {
    try { return JSON.parse(fs.readFileSync(ROOM_STATE_FILE, 'utf8')); } catch { return null; }
  }
  function roomStateSave(state) {
    fs.mkdirSync(PET_SPACE_DIR, { recursive: true });
    fs.writeFileSync(ROOM_STATE_FILE, JSON.stringify(state), 'utf8');
    return true;
  }

  return {
    getConfig,
    getInfwakeCutoff,
    getInfwakePhaseId,
    historyLoad,
    historySave,
    memoryAdd,
    memorySearch,
    memoryBackfill,
    roomStateLoad,
    roomStateSave,
    fstoolTail,
  };
}

module.exports = { createStorage };
