// askLLM 的两个桌宠专用工具（search_memory / walk_to）：与模型循环解耦，屏幕与坐标信息通过注入的取值器获取
const WALK_SPECIAL = ['primary', '主屏', 'main', 'room', 'bedroom', '卧室'];

export function createPetTools({ ROLE, getDisplayInfo, isBedroomMode, displayCssRect, walkToCss, walkToFraction, memoryRecall }) {
  async function searchMemory(parsed = {}) {
    const r = await memoryRecall(parsed.query || '', parsed.limit || 8);
    return r.length
      ? r.map((h) => `[${new Date(h.ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}] ${h.text}`).join('\n---\n')
      : '（没有找到相关记忆）';
  }

  async function walkTo(parsed = {}) {
    let result;
    try {
      const where = String(parsed.where || '').toLowerCase();
      const special = WALK_SPECIAL.includes(where);
      let fx = parsed.x, fy = parsed.y;
      const said = parsed.where ? '「' + parsed.where + '」' : '(' + fx + ',' + fy + ')';
      if (!special && (fx == null || fy == null)) {
        let lm = null;
        try { lm = await (await fetch('/pet_space/room/landmarks.json?t=' + Date.now(), { cache: 'no-store' })).json(); } catch {}
        if (!lm || !lm[where] || typeof lm[where].x !== 'number') {
          result = '找不到地标 "' + (parsed.where || '') + '"：pet_space/room/landmarks.json 里没有它。现有地标：' + (lm ? Object.keys(lm).filter((k) => k[0] !== '_').join('、') : '(文件读不到)') + '。' + (ROLE === 'pet' ? '也可以用 where="primary" 去主屏、where="room" 回卧室。' : '换背景后请把坐标写进这份文件。');
        } else {
          fx = lm[where].x;
          fy = lm[where].y;
        }
      }
      if (result == null) {
        if (ROLE === 'pet') {
          const displays = getDisplayInfo() || [];
          const pri = displays.find((d) => d.isPrimary);
          const bed = displays.find((d) => !d.isPrimary);
          if (where === 'primary' || where === '主屏' || where === 'main') {
            const r = displayCssRect(pri);
            const px = typeof fx === 'number' ? Math.max(0, Math.min(1, fx)) : 0.5;
            const py = typeof fy === 'number' ? Math.max(0, Math.min(1, fy)) : 0.9;
            if (!r) result = '拿不到主屏位置，稍后再试。';
            else {
              await walkToCss(r.x + r.w * px, r.y + r.h * py);
              result = '走到主屏' + (typeof fx === 'number' || typeof fy === 'number' ? '（' + px + ',' + py + '）' : '底部中间') + '啦';
            }
          } else if (where === 'room' || where === 'bedroom' || where === '卧室') {
            const r = displayCssRect(bed);
            const px = typeof fx === 'number' ? Math.max(0, Math.min(1, fx)) : 0.5;
            const py = typeof fy === 'number' ? Math.max(0, Math.min(1, fy)) : 0.78;
            if (!r) result = '拿不到卧室位置，稍后再试。';
            else {
              await walkToCss(r.x + r.w * px, r.y + r.h * py);
              result = '回卧室' + (typeof fx === 'number' || typeof fy === 'number' ? '（' + px + ',' + py + '）' : '啦');
            }
          } else if (!(fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
            result = '坐标要是 0~1 的比例（x 横向、y 纵向，脚下位置）。';
          } else {
            const r = displayCssRect(bed);
            if (r) await walkToCss(r.x + fx * r.w, r.y + fy * r.h);
            else await walkToFraction(fx, fy);
            result = '走到 ' + said + ' 啦';
          }
        } else if (!(fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
          result = '坐标要是 0~1 的比例（x 横向、y 纵向，脚下位置）。';
        } else if (!isBedroomMode()) {
          result = '你不在卧室（副屏）里，先让主人把你拖回副屏卧室再走。';
        } else {
          await walkToFraction(fx, fy);
          result = '走到 ' + said + ' 啦';
        }
      }
    } catch (e) {
      result = '移动失败: ' + String((e && e.message) || e);
    }
    return result;
  }

  return { searchMemory, walkTo };
}
