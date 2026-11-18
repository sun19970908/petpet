// 图片进模型前的统一缩放/编码：截图、view_image、resize_image 共用，最长边 1920
function shrinkNativeImage(img, { maxWidth, maxHeight, quality, defaultWidth = 1920, defaultHeight = 1920, limitWidth = 1920, limitHeight = 1920, png = false } = {}) {
  const sz = img.getSize();
  const mw = Math.max(16, Math.min(limitWidth, Number(maxWidth) || defaultWidth));
  const mh = Math.max(16, Math.min(limitHeight, Number(maxHeight) || defaultHeight));
  const sc = Math.min(mw / sz.width, mh / sz.height, 1);
  const w = Math.max(1, Math.round(sz.width * sc)), h = Math.max(1, Math.round(sz.height * sc));
  const q = Math.max(1, Math.min(100, Number(quality) || 85));
  const resized = img.resize({ width: w, height: h, quality: 'good' });
  const buf = png ? resized.toPNG() : resized.toJPEG(q);
  return {
    width: sz.width,
    height: sz.height,
    outWidth: w,
    outHeight: h,
    buf,
    mime: png ? 'image/png' : 'image/jpeg',
    kb: Math.round(buf.length / 1024),
  };
}

function shrinkBase64(nativeImage, b64, opts = {}) {
  const raw = Buffer.from(String(b64 || ''), 'base64');
  if (!raw.length) return null;
  const img = nativeImage.createFromBuffer(raw);
  if (!img || img.isEmpty()) return null;
  const out = shrinkNativeImage(img, { defaultWidth: 1920, defaultHeight: 1920, limitWidth: 1920, limitHeight: 1920, ...opts });
  return { ...out, base64: out.buf.toString('base64'), dataUrl: 'data:' + out.mime + ';base64,' + out.buf.toString('base64') };
}

module.exports = { shrinkNativeImage, shrinkBase64 };
