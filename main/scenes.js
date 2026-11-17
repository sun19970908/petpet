// 场景注册表：pet_space/scenes/ 下「一个场景一个文件夹，扫到即存在」。
// 场景要素：index.html（必需入口）+ landmarks.json（地标，可选）+ meta.json（可选声明）。
// 没有 meta.json 的目录同样有效，按默认值上报（title=目录名）——鼓励先建目录再补元数据。
// meta.state 是场景的“声明初始态”，运行时当前态仍以 room-state 为准，故 API 字段名用 defaults。
const fs = require('fs');
const path = require('path');

const MAX_SCENES = 64;          // 防手滑：scenes/ 下不该有几百个目录
const MAX_META_BYTES = 64 * 1024;

function listScenes(scenesDir) {
  let entries;
  try {
    entries = fs.readdirSync(scenesDir, { withFileTypes: true });
  } catch (e) {
    return { ok: false, error: String(e.code || e.message), scenes: [] };
  }
  const scenes = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith('.') || ent.name.startsWith('_')) continue; // 隐藏/下划线前缀 = 不是场景（备份、素材草稿用）
    if (scenes.length >= MAX_SCENES) break;
    const dir = path.join(scenesDir, ent.name);
    const scene = {
      id: ent.name,
      title: ent.name,
      desc: '',
      links: [],
      defaults: {},
      files: {
        index: fs.existsSync(path.join(dir, 'index.html')),
        landmarks: fs.existsSync(path.join(dir, 'landmarks.json')),
      },
      meta: null, // null = 无 meta.json（走默认值）；'ok'；'bad:<原因>' = 有但没读成
    };
    try {
      const st = fs.statSync(path.join(dir, 'meta.json'));
      if (st.size > MAX_META_BYTES) {
        scene.meta = 'bad:too-large';
      } else {
        const raw = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          if (typeof raw.title === 'string' && raw.title.trim()) scene.title = raw.title.trim().slice(0, 60);
          if (typeof raw.desc === 'string') scene.desc = raw.desc.trim().slice(0, 500);
          if (Array.isArray(raw.links)) {
            scene.links = raw.links
              .filter((l) => l && typeof l === 'object' && typeof l.to === 'string' && l.to.trim())
              .slice(0, 16)
              .map((l) => ({ to: l.to.trim().slice(0, 64), label: typeof l.label === 'string' && l.label.trim() ? l.label.trim().slice(0, 60) : String(l.to).trim().slice(0, 60) }));
          }
          if (raw.state && typeof raw.state === 'object' && !Array.isArray(raw.state)) scene.defaults = raw.state;
          scene.meta = 'ok';
        } else {
          scene.meta = 'bad:not-object';
        }
      }
    } catch (e) {
      if (e.code === 'ENOENT') scene.meta = null;
      else scene.meta = 'bad:' + (e instanceof SyntaxError ? 'json-parse' : String(e.code || e.message));
    }
    scenes.push(scene);
  }
  scenes.sort((a, b) => a.id.localeCompare(b.id));
  return { ok: true, scenes };
}

module.exports = { listScenes };
