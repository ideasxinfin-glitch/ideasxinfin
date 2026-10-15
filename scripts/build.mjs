import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });
// Authorize only the JSON-LD block by hash; all executable JavaScript stays external.
const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
const hash = createHash('sha256').update(jsonLd).digest('base64');
const headers = (await readFile(resolve(root, 'public/_headers'), 'utf8')).replace("script-src 'self'", `script-src 'self' 'sha256-${hash}'`);
await writeFile(resolve(root, 'dist/_headers'), headers);
console.log('Build completo: dist/ · sin dependencias · preview noindex');
