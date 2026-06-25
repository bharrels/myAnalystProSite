#!/usr/bin/env node
/*
 * myAnalyst local edit server
 * --------------------------------
 * Serves the static site from the repo root and injects a click-to-comment
 * overlay into every HTML page (only when viewed locally — your real .html
 * files are never modified). Comments are saved to tools/comments.json so
 * Claude Code can read exactly what you clicked on and what you want changed.
 *
 * Run:  node tools/edit-server.js          (or double-click edit-site.cmd)
 * Then: open http://localhost:4321
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = path.resolve(__dirname, '..');        // repo root = site root
const TOOLS = __dirname;
const COMMENTS_FILE = path.join(TOOLS, 'comments.json');
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 4321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

// ---- comment storage ----------------------------------------------------
function readComments() {
  try {
    const raw = fs.readFileSync(COMMENTS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function writeComments(list) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(list, null, 2) + '\n', 'utf8');
}
let _seq = 0;
function newId() {
  _seq += 1;
  return 'c_' + Date.now().toString(36) + '_' + _seq.toString(36);
}

// ---- live reload (Server-Sent Events) -----------------------------------
const sseClients = new Set();
function broadcastReload() {
  for (const res of sseClients) {
    try { res.write('event: reload\ndata: 1\n\n'); } catch {}
  }
}
let reloadTimer = null;
try {
  fs.watch(ROOT, { recursive: true }, (_evt, file) => {
    if (!file) return;
    const f = String(file).replace(/\\/g, '/');
    // ignore our own tooling + dotfiles so saving a comment never reloads
    if (f.startsWith('tools/') || f.startsWith('.git/') || f.startsWith('.claude/')) return;
    if (!/\.(html|css|js|svg|png|jpe?g|webp|gif)$/i.test(f)) return;
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(broadcastReload, 120);
  });
} catch (e) {
  console.warn('[edit-server] file watching unavailable:', e.message);
}

// ---- helpers ------------------------------------------------------------
function send(res, status, body, headers = {}) {
  res.writeHead(status, Object.assign({ 'Cache-Control': 'no-store' }, headers));
  res.end(body);
}
function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8' });
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
  });
}
// Resolve a URL pathname to a safe file inside ROOT (strips query, blocks ..)
function resolveFile(pathname) {
  let p = decodeURIComponent(pathname.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  if (p.endsWith('/')) p += 'index.html';
  const abs = path.normalize(path.join(ROOT, p));
  if (!abs.startsWith(ROOT)) return null;            // path traversal guard
  return abs;
}

const INJECT = `
<link rel="stylesheet" href="/__edit/overlay.css">
<script src="/__edit/overlay.js" defer></script>
`;

// ---- request handler ----------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // ---- API + overlay assets under /__edit ----
  if (pathname === '/__edit/ping') return sendJson(res, 200, { ok: true });

  if (pathname === '/__edit/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 1000\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (pathname === '/__edit/overlay.js' || pathname === '/__edit/overlay.css') {
    const file = path.join(TOOLS, pathname.replace('/__edit/', ''));
    return fs.readFile(file, (err, buf) => {
      if (err) return send(res, 404, 'not found');
      send(res, 200, buf, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
    });
  }

  if (pathname === '/__edit/comments') {
    if (req.method === 'GET') return sendJson(res, 200, readComments());

    if (req.method === 'POST') {
      const body = await readBody(req);
      const list = readComments();
      const item = {
        id: newId(),
        status: 'open',
        createdAt: new Date().toISOString(),
        page: body.page || 'index.html',
        url: body.url || '/',
        comment: String(body.comment || '').trim(),
        selector: body.selector || '',
        tag: body.tag || '',
        elemId: body.elemId || '',
        classes: body.classes || '',
        text: body.text || '',
        attrs: body.attrs || {},
        outerHTML: body.outerHTML || '',
        nearbyHeading: body.nearbyHeading || '',
        rect: body.rect || null,
        viewport: body.viewport || null,
      };
      list.push(item);
      writeComments(list);
      return sendJson(res, 200, item);
    }

    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const list = readComments();
      const idx = list.findIndex((c) => c.id === body.id);
      if (idx === -1) return sendJson(res, 404, { error: 'not found' });
      list[idx] = Object.assign(list[idx], body, { id: list[idx].id });
      writeComments(list);
      return sendJson(res, 200, list[idx]);
    }

    if (req.method === 'DELETE') {
      let list = readComments();
      if (url.searchParams.get('all') === '1') list = [];
      else list = list.filter((c) => c.id !== url.searchParams.get('id'));
      writeComments(list);
      return sendJson(res, 200, { ok: true, count: list.length });
    }
  }

  // ---- static file serving (with HTML injection) ----
  const file = resolveFile(pathname);
  if (!file) return send(res, 403, 'forbidden');

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, `Not found: ${pathname}`);
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';

    if (ext === '.html') {
      fs.readFile(file, 'utf8', (e, html) => {
        if (e) return send(res, 500, 'read error');
        const out = /<\/body>/i.test(html)
          ? html.replace(/<\/body>/i, INJECT + '</body>')
          : html + INJECT;
        send(res, 200, out, { 'Content-Type': type });
      });
    } else {
      fs.readFile(file, (e, buf) => {
        if (e) return send(res, 500, 'read error');
        send(res, 200, buf, { 'Content-Type': type });
      });
    }
  });
});

server.listen(PORT, () => {
  if (!fs.existsSync(COMMENTS_FILE)) writeComments([]);
  const link = `http://localhost:${PORT}`;
  console.log('\n  myAnalyst edit server running');
  console.log('  -----------------------------');
  console.log('  Open:     ' + link);
  console.log('  Comments: tools/comments.json');
  console.log('  Stop:     Ctrl+C\n');
  if (process.platform === 'win32') exec(`start "" "${link}"`);
  else if (process.platform === 'darwin') exec(`open "${link}"`);
});
