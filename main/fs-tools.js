// 文件工具执行器（read/list 无限制，写/改/删仅限 pet_space 沙箱）+ ComfyUI 生图工具
const http = require('http');
const fs = require('fs');
const path = require('path');

function createFsTools({ APP_ROOT, PET_SPACE_DIR, nativeImage, captureNow, captureScreenBy, appendLine, onRoomChanged }) {
  function isPathInPetSpace(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const resolved = path.resolve(targetPath);
    const spaceUpper = path.resolve(PET_SPACE_DIR).toUpperCase();
    const targetUpper = resolved.toUpperCase();
    return targetUpper === spaceUpper || targetUpper.startsWith(spaceUpper + path.sep);
  }
  function isFileStrictlyInPetSpace(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const resolved = path.resolve(targetPath);
    const spaceUpper = path.resolve(PET_SPACE_DIR).toUpperCase();
    const targetUpper = resolved.toUpperCase();
    return targetUpper !== spaceUpper && targetUpper.startsWith(spaceUpper + path.sep);
  }

  const COMFY_HOST = '127.0.0.1', COMFY_PORT = 8188;
  const COMFY_INPUT = process.env.STRATA_PET_COMFY_INPUT || 'G:/ComfyUI-Easy-Install/ComfyUI-Easy-Install/ComfyUI/input';

  function comfyReq(method, urlPath, bodyObj) {
    return new Promise((resolve, reject) => {
      const data = bodyObj == null ? null : Buffer.from(JSON.stringify(bodyObj));
      const req = http.request({ host: COMFY_HOST, port: COMFY_PORT, method, path: urlPath,
        headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {} }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks) }));
      });
      req.on('error', reject);
      req.setTimeout(15000, () => req.destroy(new Error('timeout')));
      if (data) req.write(data);
      req.end();
    });
  }
  async function comfyJson(method, urlPath, bodyObj) {
    const r = await comfyReq(method, urlPath, bodyObj);
    let json = null; try { json = JSON.parse(r.buffer.toString('utf8')); } catch {}
    return { status: r.status, json };
  }

  function comfyRunTool(args) {
    return (async () => {
      let wf = null, src = '';
      try {
        if (args.workflow_file) {
          const wfPath = path.resolve(String(args.workflow_file));
          if (!isPathInPetSpace(wfPath)) return { ok: false, error: '拒绝：workflow_file 必须在 ' + PET_SPACE_DIR + ' 内' };
          wf = JSON.parse(fs.readFileSync(wfPath, 'utf8')); src = path.basename(wfPath);
        } else if (args.workflow && typeof args.workflow === 'object') {
          wf = args.workflow; src = 'inline';
        } else {
          return { ok: false, error: '参数错误：给 workflow_file（pet_space 内的 .json）或 workflow（ComfyUI API 格式对象）' };
        }
      } catch (e) { return { ok: false, error: '工作流读取/解析失败: ' + String(e.message || e) }; }
      if (args.input_image) {
        const inPath = path.resolve(String(args.input_image));
        if (!isPathInPetSpace(inPath)) return { ok: false, error: 'input_image 必须在 ' + PET_SPACE_DIR + ' 内' };
        if (!fs.existsSync(inPath)) return { ok: false, error: 'input_image 不存在: ' + inPath };
        if (!fs.existsSync(COMFY_INPUT)) return { ok: false, error: '找不到 ComfyUI input 目录: ' + COMFY_INPUT };
        const ext = path.extname(inPath).toLowerCase() || '.png';
        const inName = 'pet_input' + ext;
        fs.copyFileSync(inPath, path.join(COMFY_INPUT, inName));
        let nLoad = 0;
        for (const id of Object.keys(wf)) { const nd = wf[id]; if (nd && nd.class_type === 'LoadImage') { nd.inputs = nd.inputs || {}; nd.inputs.image = inName; nLoad += 1; } }
        if (!nLoad) return { ok: false, error: '工作流里没有 LoadImage 节点，但给了 input_image' };
      }
      let pid;
      try {
        const r = await comfyJson('POST', '/prompt', { prompt: wf, client_id: 'livliv-pet' });
        if (r.status !== 200) return { ok: false, error: 'ComfyUI /prompt HTTP ' + r.status + ': ' + JSON.stringify(r.json).slice(0, 300) };
        if (r.json && r.json.error) return { ok: false, error: 'ComfyUI 拒绝工作流: ' + JSON.stringify(r.json.error).slice(0, 250) + ' ' + JSON.stringify(r.json.node_errors || {}).slice(0, 300) };
        pid = r.json && r.json.prompt_id;
      } catch (e) { return { ok: false, error: '连不上 ComfyUI(127.0.0.1:8188): ' + String(e.message || e) }; }
      if (!pid) return { ok: false, error: 'ComfyUI 没返回 prompt_id' };
      const t0 = Date.now();
      let outs = null;
      while (Date.now() - t0 < 300000) {
        await new Promise((res) => setTimeout(res, 800));
        let h;
        try { h = await comfyJson('GET', '/history/' + pid); } catch (e) { return { ok: false, error: 'ComfyUI /history 读失败: ' + String(e.message || e) }; }
        const rec = h.json && h.json[pid];
        if (rec && rec.outputs && Object.keys(rec.outputs).length) { outs = rec.outputs; break; }
        if (rec && rec.status && rec.status.status_str === 'error') return { ok: false, error: 'ComfyUI 执行出错: ' + JSON.stringify(rec.status).slice(0, 400) };
      }
      if (!outs) return { ok: false, error: 'ComfyUI 超时（300s）没产出图片' };
      const imgs = [];
      for (const k of Object.keys(outs)) for (const im of (outs[k].images || [])) imgs.push(im);
      if (!imgs.length) return { ok: false, error: '工作流跑完但没有图片输出（要一个 SaveImage 或 PreviewImage 节点）' };
      const dir = path.join(PET_SPACE_DIR, 'generated');
      fs.mkdirSync(dir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const saved = []; let first = null;
      for (let i = 0; i < imgs.length; i++) {
        const im = imgs[i];
        let v;
        try {
          v = await comfyReq('GET', '/view?filename=' + encodeURIComponent(im.filename || '') + '&subfolder=' + encodeURIComponent(im.subfolder || '') + '&type=' + encodeURIComponent(im.type || 'output'));
        } catch (e) { continue; }
        if (v.status !== 200 || !v.buffer.length) continue;
        const name = 'comfy_' + stamp + '_' + i + '_' + String(im.filename || 'img.png').replace(/[^\w.-]/g, '_');
        const outPath = path.join(dir, name);
        fs.writeFileSync(outPath, v.buffer);
        saved.push(outPath);
        if (!first) {
          const ext = path.extname(name).slice(1).toLowerCase();
          const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
          first = 'data:' + mime + ';base64,' + v.buffer.toString('base64');
        }
      }
      if (!saved.length) return { ok: false, error: '产出图片拉取失败' };
      return {
        ok: true,
        result: '工作流(' + src + ')跑完，' + saved.length + ' 张 → ' + saved.map((p) => p.replace(/\\/g, '/').replace(/^.*?pet_space\//, 'pet_space/')).join('、'),
        image: first,
      };
    })();
  }

  function runFsTool(call) {
    const r = runFsToolCore(call);
    if (onRoomChanged) Promise.resolve(r).then(() => onRoomChanged(call)).catch(() => {});
    return r;
  }

  function runFsToolCore(call) {
    try {
      let { name, args } = call;
      appendLine(path.join(APP_ROOT, 'logs', 'fstool.log'), JSON.stringify({ t: new Date().toISOString(), name, args }), { stamp: false, maxBytes: 5 * 1024 * 1024 });
      if (name === 'write_file') { name = 'file_tool'; args.action = 'write'; }
      else if (name === 'append_file') { name = 'file_tool'; args.action = 'append'; }
      else if (name === 'copy_file') { name = 'file_tool'; args.action = 'copy'; }
      else if (name === 'delete_file') { name = 'file_tool'; args.action = 'delete'; }
      if (name === 'comfy_run') return comfyRunTool(args);
      if (name === 'file_tool') {
        const action = args.action;
        if (action === 'write') {
          const resolved = path.resolve(args.path);
          if (!isPathInPetSpace(resolved)) return Promise.resolve({ ok: false, error: '拒绝：写入仅允许在 ' + PET_SPACE_DIR + ' 目录内' });
          if (typeof args.content !== 'string') return Promise.resolve({ ok: false, error: '参数错误：content 必须为字符串' });
          if (args.content.length > 200000) return Promise.resolve({ ok: false, error: '拒绝：内容超过 200KB' });
          fs.mkdirSync(path.dirname(resolved), { recursive: true });
          fs.writeFileSync(resolved, args.content, 'utf8');
          return Promise.resolve({ ok: true, result: '已写入 ' + resolved + '（' + args.content.length + ' 字符）' });
        }
        if (action === 'append') {
          const resolved = path.resolve(args.path);
          if (!isPathInPetSpace(resolved)) return Promise.resolve({ ok: false, error: '拒绝：追加仅允许在 ' + PET_SPACE_DIR + ' 目录内' });
          if (typeof args.content !== 'string') return Promise.resolve({ ok: false, error: '参数错误：content 必须为字符串' });
          if (args.content.length > 200000) return Promise.resolve({ ok: false, error: '拒绝：单次追加内容超过 200KB' });
          fs.mkdirSync(path.dirname(resolved), { recursive: true });
          fs.appendFileSync(resolved, args.content, 'utf8');
          return Promise.resolve({ ok: true, result: '已追加到 ' + resolved + '（追加 ' + args.content.length + ' 字符）' });
        }
        if (action === 'copy') {
          if (!args.src_path || !args.dest_path) return Promise.resolve({ ok: false, error: '参数错误：缺少 src_path 或 dest_path' });
          const srcResolved = path.resolve(args.src_path);
          const destResolved = path.resolve(args.dest_path);
          if (!isPathInPetSpace(destResolved)) return Promise.resolve({ ok: false, error: '拒绝：复制目标仅允许在 ' + PET_SPACE_DIR + ' 沙盒内' });
          if (!fs.existsSync(srcResolved)) return Promise.resolve({ ok: false, error: '源文件不存在: ' + srcResolved });
          fs.mkdirSync(path.dirname(destResolved), { recursive: true });
          const stat = fs.statSync(srcResolved);
          if (stat.isDirectory()) {
            fs.cpSync(srcResolved, destResolved, { recursive: true });
            return Promise.resolve({ ok: true, result: '已复制目录: ' + srcResolved + ' -> ' + destResolved });
          } else {
            fs.copyFileSync(srcResolved, destResolved);
            return Promise.resolve({ ok: true, result: '已复制文件: ' + srcResolved + ' -> ' + destResolved + '（' + stat.size + ' 字节）' });
          }
        }
        if (action === 'delete') {
          if (!args.path) return Promise.resolve({ ok: false, error: '参数错误：缺少 path 参数' });
          const resolved = path.resolve(args.path);
          if (!isFileStrictlyInPetSpace(resolved)) {
            return Promise.resolve({ ok: false, error: '拒绝：删除仅允许在 ' + PET_SPACE_DIR + ' 目录内，禁止删除沙盒根目录或沙盒外文件' });
          }
          if (!fs.existsSync(resolved)) return Promise.resolve({ ok: false, error: '文件或目录不存在: ' + resolved });
          const stat = fs.statSync(resolved);
          if (stat.isDirectory()) {
            fs.rmSync(resolved, { recursive: true, force: true });
            return Promise.resolve({ ok: true, result: '已删除目录: ' + resolved });
          } else {
            fs.unlinkSync(resolved);
            return Promise.resolve({ ok: true, result: '已删除文件: ' + resolved });
          }
        }
        return Promise.resolve({ ok: false, error: '参数错误：未知 action ' + action + '（可选 write/append/copy/delete）' });
      }
      if (name === 'read_file') {
        const resolved = path.resolve(args.path);
        const data = fs.readFileSync(resolved, 'utf8');
        const hasStart = args.start_line !== undefined && args.start_line !== null && args.start_line !== '';
        const hasEnd = args.end_line !== undefined && args.end_line !== null && args.end_line !== '';
        const hasQuery = typeof args.query === 'string' && args.query.trim() !== '';

        if (!hasStart && !hasEnd && !hasQuery) return Promise.resolve({ ok: true, result: data });

        const lines = data.split(/\r?\n/);
        const total = lines.length;

        if (hasQuery) {
          const q = args.query.trim().toLowerCase();
          const ctx = Math.max(0, Math.min(10, parseInt(args.context_lines, 10) || 2));
          const maxHits = 30;
          const hitIndices = [];
          for (let i = 0; i < total; i++) {
            if (lines[i].toLowerCase().includes(q)) {
              hitIndices.push(i);
              if (hitIndices.length >= maxHits) break;
            }
          }
          if (!hitIndices.length) {
            return Promise.resolve({ ok: true, result: `[文件: ${resolved} | 共 ${total} 行 | 搜索 "${args.query}" 无命中]` });
          }
          const out = [`[文件: ${resolved} | 共 ${total} 行 | 搜索 "${args.query}" 命中 ${hitIndices.length}${hitIndices.length >= maxHits ? '+' : ''} 处]`];
          const printed = new Set();
          for (const idx of hitIndices) {
            const from = Math.max(0, idx - ctx);
            const to = Math.min(total - 1, idx + ctx);
            if (out.length > 1) out.push('---');
            for (let j = from; j <= to; j++) {
              if (printed.has(j)) continue;
              printed.add(j);
              const mark = j === idx ? '>' : ' ';
              out.push(`${mark}L${j + 1}: ${lines[j]}`);
            }
          }
          return Promise.resolve({ ok: true, result: out.join('\n') });
        }

        const rawStart = hasStart ? parseInt(args.start_line, 10) : 1;
        let s = Number.isFinite(rawStart) ? rawStart : 1;
        if (s < 0) s = Math.max(1, total + s + 1);
        if (s < 1) s = 1;

        let e;
        if (hasEnd) {
          const rawEnd = parseInt(args.end_line, 10);
          e = Number.isFinite(rawEnd) ? rawEnd : Math.min(total, s + 149);
        } else if (hasStart && rawStart < 0) {
          e = total;
        } else {
          e = Math.min(total, s + 149);
        }
        if (e < s) e = Math.min(total, s + 149);
        if (e > total) e = total;

        if (s > total) {
          return Promise.resolve({ ok: true, result: `[文件: ${resolved} | 共 ${total} 行 | 起始行 ${s} 超出范围]` });
        }

        const slice = lines.slice(s - 1, e).join('\n');
        return Promise.resolve({ ok: true, result: `[文件: ${resolved} | 共 ${total} 行 | 当前第 ${s}-${e} 行]\n${slice}` });
      }
      if (name === 'list_dir') {
        const entries = fs.readdirSync(path.resolve(args.path), { withFileTypes: true })
          .map((d) => (d.isDirectory() ? '[目录] ' : '[文件] ') + d.name);
        return Promise.resolve({ ok: true, result: entries.join('\n') || '(空目录)' });
      }
      if (name === 'take_screenshot') {
        return (async () => {
          const b64 = await captureNow();
          if (!b64) return { ok: false, error: '没有可截取的屏幕' };
          const jpeg = Buffer.from(b64, 'base64');
          fs.mkdirSync(path.join(APP_ROOT, 'history', 'img'), { recursive: true });
          const fname = `screen_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.jpg`;
          fs.writeFileSync(path.join(APP_ROOT, 'history', 'img', fname), jpeg);
          return {
            ok: true,
            result: '屏幕截图已保存: /history/img/' + fname + '（画面已附在接下来的消息里）',
            image: 'data:image/jpeg;base64,' + b64,
          };
        })();
      }
      if (name === 'look_at_room') {
        return (async () => {
          const b64 = await captureScreenBy('room');
          if (!b64) return { ok: false, error: '房间未开放（当前没有副屏或卧室窗未创建）' };
          const jpeg = Buffer.from(b64, 'base64');
          fs.mkdirSync(path.join(APP_ROOT, 'history', 'img'), { recursive: true });
          const fname = `room_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.jpg`;
          fs.writeFileSync(path.join(APP_ROOT, 'history', 'img', fname), jpeg);
          return {
            ok: true,
            result: '房间截图已保存: /history/img/' + fname + '（画面已附在接下来的消息里）',
            image: 'data:image/jpeg;base64,' + b64,
          };
        })();
      }
      if (name === 'resize_image') {
        const resolved = path.resolve(args.path || '');
        if (!isPathInPetSpace(resolved)) return Promise.resolve({ ok: false, error: '拒绝：图片必须在 ' + PET_SPACE_DIR + ' 内' });
        if (!fs.existsSync(resolved)) return Promise.resolve({ ok: false, error: '文件不存在: ' + resolved });
        const img = nativeImage.createFromPath(resolved);
        if (!img || img.isEmpty()) return Promise.resolve({ ok: false, error: '读不出图片（格式不支持？）: ' + resolved });
        const sz = img.getSize();
        const mw = Math.max(16, Math.min(4096, Number(args.max_width) || 512));
        const mh = Math.max(16, Math.min(4096, Number(args.max_height) || 512));
        const sc = Math.min(mw / sz.width, mh / sz.height, 1);
        const w = Math.max(1, Math.round(sz.width * sc)), h = Math.max(1, Math.round(sz.height * sc));
        const q = Math.max(1, Math.min(100, Number(args.quality) || 82));
        const resized = img.resize({ width: w, height: h, quality: 'good' });
        let outPath;
        if (args.out_path) {
          outPath = path.resolve(String(args.out_path));
          if (!isPathInPetSpace(outPath)) return Promise.resolve({ ok: false, error: '拒绝：out_path 必须在 ' + PET_SPACE_DIR + ' 内' });
        } else {
          const dir = path.dirname(resolved);
          const base = path.basename(resolved).replace(/\.[^.]+$/, '');
          outPath = path.join(dir, base + '_small.jpg');
        }
        const ext = path.extname(outPath).toLowerCase();
        const buf = ext === '.png' ? resized.toPNG() : resized.toJPEG(q);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, buf);
        const kb = Math.round(buf.length / 1024);
        const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        return Promise.resolve({
          ok: true,
          result: '已缩放 ' + sz.width + 'x' + sz.height + ' → ' + w + 'x' + h + '（' + kb + ' KB）: ' + outPath.replace(/\\/g, '/'),
          image: 'data:' + mime + ';base64,' + buf.toString('base64'),
        });
      }
      if (name === 'edit_file') {
        const resolved = path.resolve(args.path || '');
        if (!isPathInPetSpace(resolved)) return Promise.resolve({ ok: false, error: '拒绝：编辑仅允许在 ' + PET_SPACE_DIR + ' 目录内' });
        if (typeof args.old_string !== 'string' || typeof args.new_string !== 'string') {
          return Promise.resolve({ ok: false, error: '参数错误：old_string 与 new_string 都必须是字符串' });
        }
        if (args.old_string === '') return Promise.resolve({ ok: false, error: '参数错误：old_string 不能为空' });
        let text;
        try { text = fs.readFileSync(resolved, 'utf8'); } catch { return Promise.resolve({ ok: false, error: '读不到文件: ' + resolved }); }
        const parts = text.split(args.old_string);
        const count = parts.length - 1;
        if (count === 0) {
          return Promise.resolve({ ok: false, error: '没找到 old_string：文件里不存在完全一致的这一段（空格/换行要一字不差）' });
        }
        if (count > 1 && args.replace_all !== true) {
          return Promise.resolve({ ok: false, error: 'old_string 出现了 ' + count + ' 次；多给一点上下文让它唯一，或传 replace_all=true 全部替换' });
        }
        const next = args.replace_all === true ? parts.join(args.new_string) : (parts[0] + args.new_string + parts.slice(1).join(args.old_string));
        if (next.length > 200000) return Promise.resolve({ ok: false, error: '拒绝：改完超过 200KB' });
        fs.writeFileSync(resolved, next, 'utf8');
        return Promise.resolve({ ok: true, result: '已编辑 ' + resolved + '（替换 ' + count + ' 处，' + text.length + ' → ' + next.length + ' 字符）' });
      }
      return Promise.resolve({ ok: false, error: '未知工具 ' + name });
    } catch (err) {
      return Promise.resolve({ ok: false, error: String(err.message || err) });
    }
  }

  return { runFsTool };
}

module.exports = { createFsTools };
