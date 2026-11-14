// 本地静态资源：只暴露页面、角色、性格档案和房间沙箱
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.css': 'text/css; charset=utf-8',
};

const STATIC_DIRS = ['renderer/', 'characters/', 'pet_space/room/'];
const STATIC_FILES = new Set(['pet_space/persona.txt']);

function isStaticAssetAllowed(relPath) {
  return STATIC_FILES.has(relPath) || STATIC_DIRS.some((dir) => relPath.startsWith(dir));
}

function serveStaticAsset(req, res, APP_ROOT) {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath === '/') urlPath = '/renderer/index.html';
    if (urlPath.includes('\\')) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    const relPath = path.posix.normalize(urlPath).replace(/^\/+/, '');
    if (!isStaticAssetAllowed(relPath)) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    const fsRel = relPath.startsWith('characters/') ? path.join('characters', relPath) : relPath;
    const fsPath = path.join(APP_ROOT, fsRel);
    const relToRoot = path.relative(APP_ROOT, fsPath);
    if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    fs.readFile(fsPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found: ' + urlPath); return; }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(fsPath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}

module.exports = { serveStaticAsset, isStaticAssetAllowed };
