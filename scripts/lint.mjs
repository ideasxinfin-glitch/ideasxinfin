import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
let errors = 0;
for (const folder of ['public', 'scripts', 'tests']) {
  for (const file of await readdir(resolve(root, folder))) {
    if (!/\.(m?js)$/.test(file)) continue;
    const path = resolve(root, folder, file);
    const syntax = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    if (syntax.status !== 0) { console.error(syntax.stderr); errors++; }
    const source = await readFile(path, 'utf8');
    if (/\beval\s*\(|\.innerHTML\s*=|document\.write\s*\(/.test(source)) { console.error('Unsafe DOM operation:', file); errors++; }
  }
}
const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
if (/<(?:script|style)[^>]*>/.test(html.replace(/<script[^>]*src=[^>]*><\/script>/g, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ''))) { console.error('Unexpected inline code'); errors++; }
if (/\son[a-z]+\s*=|\sstyle\s*=/.test(html)) { console.error('Inline event/style'); errors++; }
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) { console.error('Duplicate IDs'); errors++; }
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(id)) { console.error('Broken anchor:', id); errors++; }
if (errors) process.exit(1);
console.log('Lint completo: sintaxis, DOM seguro, anclas e identificadores.');
