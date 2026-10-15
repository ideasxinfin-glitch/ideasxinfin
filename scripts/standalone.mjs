import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const destination = resolve(process.argv[2] || resolve(root, 'dist/vista-previa.html'));
await mkdir(dirname(destination), { recursive: true });
const read = file => readFile(resolve(root, 'public', file), 'utf8');
const [html, css, theme, app, contact, analytics, privacy] = await Promise.all(['index.html', 'styles.css', 'theme.js', 'app.js', 'contact.js', 'analytics.js', 'privacidad.html'].map(read));
const assets = new Map();
for (const file of ['mark.svg', 'infinity-mark-v1.svg', 'scene-light.webp', 'scene-dark.webp', 'editorial-atlas.webp', 'branding-v3.webp', 'property-v3.webp', 'automation-v3.webp']) {
  const bytes = await readFile(resolve(root, 'public/assets', file));
  assets.set('/assets/' + file, `data:${file.endsWith('.svg') ? 'image/svg+xml' : 'image/webp'};base64,${bytes.toString('base64')}`);
}
const embed = value => { for (const [path, url] of assets) value = value.replaceAll(path, url); return value; };
const combined = contact.replaceAll('export ', '') + '\n' + analytics.replaceAll('export ', '') + '\n' + app.replace(/^import .*;\r?\n/gm, '');
const prepare = value => embed(value.replace('<link rel="stylesheet" href="/styles.css">', '<style>' + css + '</style>').replace('<script src="/theme.js"></script>', '<script>' + theme + '</script>'));
const standalone = prepare(html).replace('<script type="module" src="/app.js"></script>', '<script type="module">' + combined + '</script>').replaceAll('/privacidad.html', './privacidad.html');
await writeFile(destination, standalone);
await writeFile(resolve(dirname(destination), 'privacidad.html'), prepare(privacy).replaceAll('href="/"', `href="./${basename(destination)}"`).replaceAll('href="/#contacto"', `href="./${basename(destination)}#contacto"`));
console.log('Vista navegable autónoma: ' + destination);
