import { cp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, dirname } from 'node:path';
import { renderPages, SEO_ROUTES, linksSection, homeSchema } from './seo-pages.mjs';

// Separate output: the preview remains noindex and never shares deployment settings.
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist-production');
const origin = 'https://ideasxinfin.com';
// The approved landing plus service and city pages built with its design (approved 30/10/2026).
// Nothing from the previous site's templates is published; other old routes keep redirecting home.
const routes = ['/', ...SEO_ROUTES];
if (relative(root, out) !== 'dist-production') throw new Error('Unsafe production output path');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(resolve(root, 'public'), out, { recursive: true });
await cp(resolve(root, 'migration/assets'), resolve(out, 'legacy'), { recursive: true });
const media = (await readdir(resolve(root, 'migration/assets'), { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => new URL('/' + resolve(entry.parentPath, entry.name).slice(resolve(root, 'migration/assets').length + 1).replaceAll('\\', '/'), origin).pathname);
await writeFile(resolve(root, 'migration/media-routes.json'), JSON.stringify(media));
for (const page of renderPages()) {
  const file = resolve(out, '.' + page.route, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, page.html);
}

const hash = value => `'sha256-${createHash('sha256').update(value).digest('base64')}'`;
const policies = {};
for (const route of routes) {
  const file = resolve(out, '.' + route, 'index.html');
  let html = await readFile(file, 'utf8');
  if (route === '/') {
    const faq = [...html.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map(m => [m[1].trim(), m[2].trim()]);
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${homeSchema(faq)}</script>`);
    html = html.replace('<!-- seo:links -->', linksSection('/'));
    html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Diseño web, landing pages e IA en México | Ideas Xinfin">');
    html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Landing pages desde $3,800 MXN, redes sociales y Google Business, agentes de IA y SEO para negocios de México y Latinoamérica.">');
    html = html.replace('</head>', `<meta property="og:image" content="${origin}/assets/service-platforms-landing.webp"></head>`);
    html = html.replace('content="noindex,nofollow"', 'content="index,follow,max-image-preview:large"');
    html = html.replace('</head>', `<link rel="canonical" href="${origin}/"><meta property="og:url" content="${origin}/"><link rel="alternate" hreflang="es" href="${origin}/"><link rel="alternate" hreflang="x-default" href="${origin}/"></head>`);
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
await writeFile(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r => `<url><loc>${origin}${r}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join('')}</urlset>`);
await writeFile(resolve(out, '404.html'), '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Página no encontrada · Ideas Xinfin</title><link rel="stylesheet" href="/styles.css"><body><main class="section"><h1>No encontramos esta página.</h1><p><a href="/">Volver a Ideas Xinfin →</a></p></main></body></html>');

// Per-page hashes permit the preserved scripts without allowing arbitrary inline JS.
for (const route of [...routes, '/privacidad.html']) {
  const file = route.endsWith('.html') ? resolve(out, '.' + route) : resolve(out, '.' + route, 'index.html');
  const html = await readFile(file, 'utf8');
  const scripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => hash(m[1]));
  const handlers = [...html.matchAll(/\son\w+="([^"]+)"/g)].map(m => hash(m[1]));
  const legacy = route !== '/' && !route.endsWith('.html') && !SEO_ROUTES.includes(route);
  // Cloudflare Web Analytics: cookieless beacon that Cloudflare injects on the zone.
  policies[route] = `default-src 'self'; script-src 'self' https://static.cloudflareinsights.com ${[...new Set(scripts)].join(' ')}${handlers.length ? " 'unsafe-hashes' " + [...new Set(handlers)].join(' ') : ''}; style-src 'self'${legacy ? " 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com" : ''}; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:; media-src 'self'; connect-src 'self' https://cloudflareinsights.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action https://wa.me`;
}
await writeFile(resolve(root, 'migration/policies.json'), JSON.stringify(policies));
await writeFile(resolve(out, '_headers'), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(self), geolocation=()\n/assets/*\n  Cache-Control: public, max-age=86400\n/legacy/*\n  Cache-Control: public, max-age=86400\n");
console.log(`Production build: ${routes.length} pages, separate from preview, canonical ${origin}`);
