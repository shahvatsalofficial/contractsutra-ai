import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const ROOT=path.resolve(import.meta.dirname,'..'),HTML=path.join(ROOT,'documents/html');
test('docs site builds, light is the default theme, internal links resolve',()=>{
 const r=spawnSync(process.execPath,['documents/build.mjs'],{cwd:ROOT,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 const index=readFileSync(path.join(HTML,'index.html'),'utf8');assert.match(index,/<html lang="en" data-theme="light">/);assert.match(index,/id="theme-btn"/);
 for(const f of readdirSync(HTML).filter(x=>x.endsWith('.html')))for(const m of readFileSync(path.join(HTML,f),'utf8').matchAll(/href="([^"#:]+)(?:#[^"]*)?"/g))if(!/^(https?|mailto)/.test(m[1]))assert.ok(existsSync(path.join(HTML,m[1])),f+' -> '+m[1]);
 assert.match(readFileSync(path.join(HTML,'12-real-world-scenarios.html'),'utf8'),/exit code: 2/);
});
