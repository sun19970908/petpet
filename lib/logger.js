// 统一轻量日志工具（main.js 与 watchdog.js 共用）：按体积自动轮转 + 尾部快速读取
const fs = require('fs');
const path = require('path');

const ensuredDirs = new Set();

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (ensuredDirs.has(dir)) return;
  fs.mkdirSync(dir, { recursive: true });
  ensuredDirs.add(dir);
}

function rotateIfNeeded(filePath, maxBytes = 5 * 1024 * 1024) {
  try {
    if (!fs.existsSync(filePath)) return;
    if (fs.statSync(filePath).size > maxBytes) {
      fs.renameSync(filePath, filePath + '.bak');
    }
  } catch {}
}

function appendLine(filePath, msg, { maxBytes = 5 * 1024 * 1024, stamp = true } = {}) {
  try {
    ensureDir(filePath);
    rotateIfNeeded(filePath, maxBytes);
    const line = (stamp ? new Date().toISOString() + ' ' : '') + String(msg == null ? '' : msg) + '\n';
    fs.appendFileSync(filePath, line, 'utf8');
  } catch {}
}

function createRotatingStream(filePath, maxBytes = 5 * 1024 * 1024) {
  ensureDir(filePath);
  rotateIfNeeded(filePath, maxBytes);
  const stream = fs.createWriteStream(filePath, { flags: 'a' });
  stream.on('error', () => {});
  return stream;
}

function readChunkTailLines(filePath, maxBytes = 64 * 1024) {
  if (!fs.existsSync(filePath)) return [];
  const size = fs.statSync(filePath).size;
  if (!size) return [];
  const readSize = Math.min(size, maxBytes);
  const start = size - readSize;
  const buf = Buffer.allocUnsafe(readSize);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, buf, 0, readSize, start);
  } finally {
    fs.closeSync(fd);
  }
  let text = buf.toString('utf8');
  if (start > 0) {
    const firstNl = text.indexOf('\n');
    if (firstNl >= 0) text = text.slice(firstNl + 1);
  }
  return text.trim() ? text.trim().split(/\r?\n/) : [];
}

function readLastLines(filePath, n = 10, maxTailBytes = 64 * 1024) {
  try {
    let lines = readChunkTailLines(filePath, maxTailBytes);
    if (lines.length < n && fs.existsSync(filePath + '.bak')) {
      const prev = readChunkTailLines(filePath + '.bak', maxTailBytes);
      lines = prev.concat(lines);
    }
    return lines.slice(-n);
  } catch {
    return [];
  }
}

module.exports = {
  rotateIfNeeded,
  appendLine,
  createRotatingStream,
  readLastLines,
};
