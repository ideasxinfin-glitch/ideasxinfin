import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';
const directory = resolve(import.meta.dirname, '..', process.argv.includes('--dist') ? 'dist' : 'public');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };
const html = await readFile(resolve(directory, 'index.html'), 'utf8');
const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
const hash = createHash('sha256').update(jsonLd).digest('base64');
createServer(async (req, res) => {
  const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy': `default-src 'self'; script-src 'self' 'sha256-${hash}'; style-src 'self'; img-src 'self' data:; media-src 'self' https://xinfinlab.com; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action https://wa.me` };
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(directory + sep) || pathname.includes('\\') || pathname.split('/').some(segment => segment.startsWith('.')) || extname(file) === '' || pathname === '/_headers') throw new Error('Not found');
    const info = await stat(file); if (!info.isFile()) throw new Error('Not found');
    const body = await readFile(file);
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const contentType = types[extname(file)] || 'application/octet-stream';
    if (range) {
      const start = Number(range[1]); const end = Math.min(range[2] ? Number(range[2]) : body.length - 1, body.length - 1);
      if (start > end || start >= body.length) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${body.length}` }); res.end(); return; }
      res.writeHead(206, { ...headers, 'Content-Type': contentType, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' }); res.end(req.method === 'HEAD' ? undefined : body.subarray(start, end + 1));
    } else {
      res.writeHead(200, { ...headers, 'Content-Type': contentType, 'Content-Length': body.length, 'Accept-Ranges': 'bytes' }); res.end(req.method === 'HEAD' ? undefined : body);
    }
  } catch { res.writeHead(404, headers); res.end('Página no encontrada'); }
}).listen(port, '127.0.0.1', () => console.log(`Ideas Xinfin: http://localhost:${port}`));
