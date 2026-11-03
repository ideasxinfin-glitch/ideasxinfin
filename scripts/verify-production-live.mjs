import fs from 'node:fs';
const routes=JSON.parse(fs.readFileSync('migration/routes.json','utf8'));const published=new Set(Object.keys(JSON.parse(fs.readFileSync('migration/policies.json','utf8'))));const expected=path=>'https://ideasxinfin.com'+(published.has(path)?path:'/');const checks=[];
for(const path of routes){const r=await fetch('https://xinfinlab.com'+path,{redirect:'manual'});checks.push({path,status:r.status,target:r.headers.get('location')});}
const r=await fetch('https://ideasxinfin.com/');const html=await r.text();const results={oldRoutes:checks.length,errors:checks.filter(c=>c.status!==301||c.target!==expected(c.path)),newLanding:r.status,approvedDesign:html.includes('class="device-stage"'),oldDirectoryPresent:html.includes('class="section coverage"')};console.log(results);
fs.mkdirSync(new URL('../outputs/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../outputs/migration-corrected-verification.json', import.meta.url),JSON.stringify({results,checks},null,2));
if (results.errors.length || results.newLanding !== 200 || !results.approvedDesign || results.oldDirectoryPresent) process.exitCode = 1;
