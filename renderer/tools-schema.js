// 文件与桌面工具 Schema 定义 + 文本形式 <tool_call>/<invoke> 宽容解析器

export const TOOLS = [
  { type: 'function', function: { name: 'read_file', description: '读取一个文本文件（任意路径，只读）。支持传 start_line/end_line 只读一部分行，或传 query 搜索关键词定位行号；不传任何可选参数则整份读取。大文件（代码、日志等）强烈建议先用 query 搜定位，或用 start_line/end_line 分段看，免得撑爆上下文。', parameters: { type: 'object', properties: { path: { type: 'string', description: '文件完整路径' }, start_line: { type: 'number', description: '可选：起始行号（从 1 开始；传负数如 -100 表示读倒数 100 行）' }, end_line: { type: 'number', description: '可选：结束行号（只传 start_line 不传 end_line 时默认向后读 150 行）' }, query: { type: 'string', description: '可选：关键词搜索（忽略大小写），只返回命中的行号及上下 2 行片段；适合先定位再按行号读' }, context_lines: { type: 'number', description: '可选：配合 query 使用，命中行上下各附带几行上下文（默认 2，最大 10）' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'list_dir', description: '列出目录里的文件和子目录', parameters: { type: 'object', properties: { path: { type: 'string', description: '目录完整路径' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'file_tool', description: '对 pet_space 沙盒里的文件做写/追加/复制/删除操作（四合一）。所有写操作只允许在 G:/AI/livliv-pet/pet_space/ 目录内（可含子目录），其他路径一律拒绝。根据 action 选对应参数：\n- write：覆盖写入（或新建）文件 → 填 path + content\n- append：在文件末尾追加（不存在则新建）→ 填 path + content\n- copy：复制文件或目录到沙盒内 → 填 src_path（源可任意可读路径）+ dest_path（目标必须在沙盒内）\n- delete：删除沙盒内文件或目录 → 填 path\n 注意：改文件一小段用 edit_file 而不是 file_tool。', parameters: { type: 'object', properties: { action: { type: 'string', enum: ['write', 'append', 'copy', 'delete'], description: '要做的操作：write 覆盖写入 / append 追加 / copy 复制 / delete 删除' }, path: { type: 'string', description: 'write/append/delete 用：目标文件或目录完整路径，必须在 G:/AI/livliv-pet/pet_space/ 内' }, content: { type: 'string', description: 'write/append 用：要写入或追加的文本内容' }, src_path: { type: 'string', description: 'copy 用：源文件或目录的完整路径（可读任意路径）' }, dest_path: { type: 'string', description: 'copy 用：目标完整路径，必须在 G:/AI/livliv-pet/pet_space/ 内' } }, required: ['action'] } } },
  { type: 'function', function: { name: 'edit_file', description: '只改文件中间的一小段：把 old_string 原样替换成 new_string，不用重发整个文件。只允许编辑 G:/AI/livliv-pet/pet_space/ 内的文件。old_string 必须与文件里完全一致（空格/换行一字不差）且默认要求唯一；出现多次会报错，此时多给些上下文或传 replace_all=true', parameters: { type: 'object', properties: { path: { type: 'string', description: '目标文件完整路径，必须在 G:/AI/livliv-pet/pet_space/ 内' }, old_string: { type: 'string', description: '要被替换的原文片段（精确匹配，默认需唯一）' }, new_string: { type: 'string', description: '替换成的新片段' }, replace_all: { type: 'boolean', description: '可选：true 替换所有匹配；默认只替换唯一匹配' } }, required: ['path', 'old_string', 'new_string'] } } },
  { type: 'function', function: { name: 'take_screenshot', description: '截取用户主屏幕的完整画面（用户的工作世界），你会直接"看到"这张图。当用户让你看屏幕、问你在做什么、帮忙看屏幕上的内容/报错或者你想看屏幕时调用它', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'look_at_room', description: '看一眼你自己房间（卧室所在屏）的实际状态：照片墙、窗帘开关、灯、你在房间里的位置。想回房间看看、确认装饰效果、或睡觉前检查房间时调用；没有副屏或房间未开放时会报错', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'search_memory', description: '在你们过往的对话记忆里做语义搜索。当用户提到过去的事、问你记不记得什么、或你需要旧信息时调用', parameters: { type: 'object', properties: { query: { type: 'string', description: '要搜索的记忆关键词或描述' }, limit: { type: 'number', description: '可选，返回条数' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'walk_to', description: '让你自己走过去（平滑滑行，没有迈腿动画）。where="primary" 去主屏、where="room" 回卧室副屏（这两个可再带 x,y 指定屏内位置，0~1，x=0 最左、y=1 最下；不带就站底部中间）；也可以用房间地标名（如 window/desk/bed/door/center，由 pet_space/room/landmarks.json 决定），或只给 x,y（0~1，按卧室画面比例，脚下位置）。', parameters: { type: 'object', properties: { where: { type: 'string', description: 'primary=去主屏、room=回卧室，或地标名如 window/desk/bed/door/center' }, x: { type: 'number', description: '可选：横向比例 0~1。配合 primary/room 时是屏内位置；单独用时是卧室画面比例' }, y: { type: 'number', description: '可选：脚下纵向比例 0~1。配合 primary/room 时是屏内位置' } }, required: [] } } },
  { type: 'function', function: { name: 'resize_image', description: '把一张图片等比缩到指定最大边并压成小 jpg（默认最长边 512、质量 82），存回 pet_space 并把小图回传给你看。专门用来把 ComfyUI 生成的大图（1MB+）压成能塞进小相框的小图。图片必须已在 pet_space 内；输出默认同目录 <原名>_small.jpg，可用 out_path 指定。', parameters: { type: 'object', properties: { path: { type: 'string', description: 'pet_space 内的图片完整路径' }, max_width: { type: 'number', description: '可选：最大宽，默认 512' }, max_height: { type: 'number', description: '可选：最大高，默认 512' }, quality: { type: 'number', description: '可选：jpg 质量 1-100，默认 82' }, out_path: { type: 'string', description: '可选：输出路径（必须在 pet_space 内），默认同目录 <原名>_small.jpg' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'comfy_run', description: '跑一份 ComfyUI 工作流生成图片，并把图回传给你"看到"。workflow_file 指向 pet_space 里的工作流 JSON（先用 read_file 看 pet_space/comfy/ 下的实例，用 edit_file 改提示词/种子/尺寸再跑），或直接给 workflow 对象（ComfyUI API 格式）。工作流里要有 SaveImage 或 PreviewImage 节点；若含 LoadImage（如"抠图_透明背景.json"），必须传 input_image 指向要处理的图。图片会存到 pet_space/generated/。SDXL 一张约 10~40 秒，RMBG 抠图约 2~5 秒。', parameters: { type: 'object', properties: { workflow_file: { type: 'string', description: 'pet_space 内的工作流 .json 路径（推荐：复制/改 pet_space/comfy/ 里的实例）' }, workflow: { type: 'object', description: '或直接给 ComfyUI API 格式的工作流对象' }, input_image: { type: 'string', description: '可选：pet_space 内的图片路径。工作流有 LoadImage 节点时，会先把这张图拷进 ComfyUI input 并把 LoadImage 指向它（抠图/图生图用）' } }, required: [] } } },
];

// 宽容解析文本形式的工具调用：<tool_call>{json}…</tool_call>（块内可多个 JSON）+ <invoke name=..><parameter name=..>..</parameter></invoke>
function scanJsonObjects(s) {
  const out = []; let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') { if (depth === 0) start = i; depth += 1; }
    else if (ch === '}') { if (depth > 0) { depth -= 1; if (depth === 0 && start >= 0) { out.push(s.slice(start, i + 1)); start = -1; } } }
  }
  return out;
}

function coerceArg(v) {
  const t = String(v).trim();
  if (t === '') return '';
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) { try { return JSON.parse(t); } catch {} }
  return t;
}

export function parseTextToolCalls(content, round) {
  const txt = String(content || '');
  const found = [];
  for (const m of txt.matchAll(/<invoke\s+name\s*=\s*"([^"]+)"\s*>([\s\S]*?)<\/invoke>/g)) {
    const args = {};
    for (const p of m[2].matchAll(/<parameter\s+name\s*=\s*"([^"]+)"(?:\s+[^>]*)?>([\s\S]*?)<\/parameter>/g)) {
      args[p[1].trim()] = coerceArg(p[2]);
    }
    found.push({ name: m[1].trim(), arguments: args });
  }
  for (const m of txt.matchAll(/<tool_call>([\s\S]*?)<\/tool_call>/g)) {
    for (const js of scanJsonObjects(m[1])) {
      try {
        const o = JSON.parse(js);
        if (o && typeof o.name === 'string') found.push({ name: o.name, arguments: (o.arguments ?? o.parameters ?? {}) });
      } catch {}
    }
  }
  return found.map((c, i) => ({
    id: 'textcall_' + round + '_' + i,
    type: 'function',
    function: { name: c.name, arguments: typeof c.arguments === 'string' ? c.arguments : JSON.stringify(c.arguments || {}) },
  }));
}
