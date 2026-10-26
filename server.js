'use strict';
// VORDO — servidor web (Node.js puro + SQLite integrado, sin dependencias externas)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { UPLOAD_DIR } = require('./lib/db');
const { HttpError, sendJson, serveFile, escapeHtml } = require('./lib/http');
const { handleApi, publicConfig, publicProducts } = require('./lib/api');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

// Página principal: se inyectan los datos del negocio (SEO + carga inicial sin parpadeo)
function renderIndex(req, res) {
  const tpl = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  const cfg = publicConfig();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
  const base = `${proto}://${host}`;
  const title = `${cfg.business_name} | Sublimación, estampados y personalizados`;
  const boot = JSON.stringify({ config: cfg, products: publicProducts() }).replace(/</g, '\\u003c');
  const html = tpl
    .replaceAll('{{TITLE}}', escapeHtml(title))
    .replaceAll('{{DESCRIPTION}}', escapeHtml(cfg.seo_description || cfg.slogan))
    .replaceAll('{{BUSINESS}}', escapeHtml(cfg.business_name))
    .replaceAll('{{SLOGAN}}', escapeHtml(cfg.slogan))
    .replaceAll('{{FAVICON}}', escapeHtml(cfg.favicon))
    .replaceAll('{{LOGO}}', escapeHtml(cfg.logo))
    .replaceAll('{{OG_IMAGE}}', escapeHtml(base + '/brand/og.jpg'))
    .replaceAll('{{URL}}', escapeHtml(base + '/'))
    .replace('{{BOOT}}', boot);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ...SECURITY_HEADERS });
  res.end(html);
}

function renderAdmin(req, res) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, 'admin', 'index.html'), 'utf8')
    .replaceAll('{{FAVICON}}', escapeHtml(publicConfig().favicon));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...SECURITY_HEADERS });
  res.end(html);
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://x'); } catch { res.writeHead(400); return res.end(); }
  const pathname = url.pathname;
  try {
    if (pathname.startsWith('/api/')) {
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
      return await handleApi(req, res, pathname, Object.fromEntries(url.searchParams));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Método no permitido.');

    if (pathname === '/' || pathname === '/index.html') return renderIndex(req, res);
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const rest = pathname.slice('/admin'.length);
      if (rest && rest !== '/' && /\.(css|js|png|svg)$/.test(rest) && serveFile(req, res, path.join(PUBLIC_DIR, 'admin'), rest, { cache: 'no-cache' })) return;
      return renderAdmin(req, res);
    }
    if (pathname.startsWith('/uploads/')) {
      const name = pathname.slice('/uploads/'.length);
      if (/^[\w.-]+$/.test(name) && serveFile(req, res, UPLOAD_DIR, name, { cache: 'public, max-age=604800, immutable' })) return;
      throw new HttpError(404, 'No encontrado.');
    }
    if (pathname === '/favicon.ico') {
      res.writeHead(302, { Location: publicConfig().favicon }); return res.end();
    }
    if (pathname === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('User-agent: *\nDisallow: /admin\nDisallow: /api/\n');
    }
    const cache = /^\/(js|css)\//.test(pathname) ? 'no-cache' : 'public, max-age=86400';
    if (serveFile(req, res, PUBLIC_DIR, pathname, { cache })) return;
    throw new HttpError(404, 'No encontrado.');
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    if (res.headersSent) return res.end();
    if (pathname.startsWith('/api/')) return sendJson(res, status, { error: status === 500 ? 'Error interno del servidor.' : err.message });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><meta charset="utf-8"><title>${status}</title><body style="background:#0a0a0a;color:#f3e7c9;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#d4a537">${status}</h1><p>${status === 404 ? 'Esta página no existe.' : 'Ocurrió un error.'}</p><a href="/" style="color:#f2c94c">Volver al inicio</a></div>`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  VORDO funcionando en  http://localhost:${PORT}`);
  console.log(`  Panel de administrador: http://localhost:${PORT}/admin\n`);
});
