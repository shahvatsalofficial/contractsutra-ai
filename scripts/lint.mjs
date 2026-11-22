// Syntax-check every .mjs under src, scripts, tests and documents (node --check), no dependencies.
import {readdirSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const ROOT=path.resolve(import.meta.dirname,'..');let bad=0,n=0;
function walk(d){for(const e of readdirSync(d)){if(e==='node_modules'||e.startsWith('.git'))continue;const p=path.join(d,e);if(statSync(p).isDirectory())walk(p);else if(p.endsWith('.mjs')){n++;const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status){bad++;console.error(p+'\n'+r.stderr);}}}}
for(const d of ['src','scripts','tests','documents'])try{walk(path.join(ROOT,d));}catch{}
console.log(JSON.stringify({checked:n,failed:bad}));process.exitCode=bad?1:0;
