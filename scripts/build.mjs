import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { renderEnglishHome } from './en-home.mjs';
const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'dist/en'), { recursive: true });
await cp(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });
// Authorize only the JSON-LD block by hash; all executable JavaScript stays external.
const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
const english = renderEnglishHome(html);
await writeFile(resolve(root, 'dist/en/index.html'), english);
const hash = page => `'sha256-${createHash('sha256').update(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]).digest('base64')}'`;
const headers = (await readFile(resolve(root, 'public/_headers'), 'utf8')).replace("script-src 'self'", `script-src 'self' ${hash(html)} ${hash(english)}`);
await writeFile(resolve(root, 'dist/_headers'), headers);
console.log('Build completo: dist/ · sin dependencias · preview noindex');
