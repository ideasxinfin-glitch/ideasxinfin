import { cp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';

// Separate output: the preview remains noindex and never shares deployment settings.
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist-production');
const origin = 'https://ideasxinfin.com';
const routes = ['/'];
// The user approved one new landing, not the previous site's page templates.
if (relative(root, out) !== 'dist-production') throw new Error('Unsafe production output path');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(resolve(root, 'public'), out, { recursive: true });
await cp(resolve(root, 'migration/assets'), resolve(out, 'legacy'), { recursive: true });
const media = (await readdir(resolve(root, 'migration/assets'), { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => new URL('/' + resolve(entry.parentPath, entry.name).slice(resolve(root, 'migration/assets').length + 1).replaceAll('\\', '/'), origin).pathname);
await writeFile(resolve(root, 'migration/media-routes.json'), JSON.stringify(media));

const hash = value => `'sha256-${createHash('sha256').update(value).digest('base64')}'`;
const policies = {};
for (const route of routes) {
  const file = resolve(out, '.' + route, 'index.html');
  let html = await readFile(file, 'utf8');
  if (route === '/') {
    html = html.replace(/<title>[^<]+<\/title>/, '<title>Ideas Xinfin | Landing pages e inteligencia artificial en México</title>');
    html = html.replace('</head>', `<meta property="og:image" content="${origin}/assets/service-platforms-landing.webp"></head>`);
    html = html.replace('content="noindex,nofollow"', 'content="index,follow,max-image-preview:large"');
    html = html.replace('</head>', `<link rel="canonical" href="${origin}/"><meta property="og:url" content="${origin}/"><link rel="alternate" hreflang="es" href="${origin}/"><link rel="alternate" hreflang="x-default" href="${origin}/"></head>`);
    html = html.replace('"name":"Ideas Xinfin","telephone"', `"name":"Ideas Xinfin","url":"${origin}/","alternateName":"Xinfin Lab","telephone"`);
  }
  await writeFile(file, html);
}
let app = await readFile(resolve(out, 'app.js'), 'utf8');
app = app.replace('https://xinfinlab.com/img/pilar-landings.mp4', '/legacy/img/pilar-landings.mp4')
  .replace('Solo se conecta al sitio de origen al reproducir.', 'Se reproduce únicamente cuando lo solicitas.');
await writeFile(resolve(out, 'app.js'), app);
let privacy = await readFile(resolve(out, 'privacidad.html'), 'utf8');
privacy = privacy.replace('se solicita a xinfinlab.com, que recibe los datos técnicos de la conexión;', 'se sirve desde este mismo sitio;');
await writeFile(resolve(out, 'privacidad.html'), privacy);
await writeFile(resolve(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r => `<url><loc>${origin}${r}</loc></url>`).join('')}</urlset>`);
await writeFile(resolve(out, '404.html'), '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Página no encontrada · Ideas Xinfin</title><link rel="stylesheet" href="/styles.css"><body><main class="section"><h1>No encontramos esta página.</h1><p><a href="/">Volver a Ideas Xinfin →</a></p></main></body></html>');

// Per-page hashes permit the preserved scripts without allowing arbitrary inline JS.
for (const route of [...routes, '/privacidad.html']) {
  const file = route.endsWith('.html') ? resolve(out, '.' + route) : resolve(out, '.' + route, 'index.html');
  const html = await readFile(file, 'utf8');
  const scripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => hash(m[1]));
  const handlers = [...html.matchAll(/\son\w+="([^"]+)"/g)].map(m => hash(m[1]));
  const legacy = route !== '/' && !route.endsWith('.html');
  policies[route] = `default-src 'self'; script-src 'self' ${[...new Set(scripts)].join(' ')}${handlers.length ? " 'unsafe-hashes' " + [...new Set(handlers)].join(' ') : ''}; style-src 'self'${legacy ? " 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com" : ''}; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action https://wa.me`;
}
await writeFile(resolve(root, 'migration/policies.json'), JSON.stringify(policies));
await writeFile(resolve(out, '_headers'), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(self), geolocation=()\n/assets/*\n  Cache-Control: public, max-age=86400\n/legacy/*\n  Cache-Control: public, max-age=86400\n");
console.log(`Production build: ${routes.length} pages, separate from preview, canonical ${origin}`);
