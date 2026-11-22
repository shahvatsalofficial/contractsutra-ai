import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import path from 'node:path';

export const sha = text => createHash('sha256').update(typeof text === 'string' ? text : JSON.stringify(text)).digest('hex');
export const ptr = segments => '#/' + segments.map(v=>String(v).replaceAll('~','~0').replaceAll('/','~1')).join('/');
export const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const record = o => Boolean(o) && typeof o === 'object' && !Array.isArray(o);
export function sorted(o){return Object.keys(record(o)?o:{}).sort();}
export function clone(o){return structuredClone(o);}
export function fail(message,code='INPUT_ERROR'){let e=new Error(message);e.code=code;throw e;}
export function checkedPath(filepath){if(typeof filepath!=='string'||!filepath.trim()||filepath.includes('\0'))fail('A local file path is required');return path.resolve(filepath);}
export async function readBounded(filepath,bytes=4*1024*1024){const abs=checkedPath(filepath);let s;try{s=await stat(abs);}catch(e){fail('Cannot read file: '+path.basename(abs)+' ('+(e.code??'error')+')');}if(!s.isFile()||s.size>bytes)fail('Input must be a file of at most '+bytes+' bytes: '+path.basename(abs));return (await readFile(abs,'utf8')).replace(/^﻿/,'');}
export async function atomicWrite(filepath,data){const dest=checkedPath(filepath);await mkdir(path.dirname(dest),{recursive:true});const tmp=dest+'.tmp-'+process.pid+'-'+sha(dest+Date.now()).slice(0,8);try{await writeFile(tmp,data,{flag:'wx',mode:0o600});await rename(tmp,dest);}catch(e){try{const fs=await import('node:fs/promises');await fs.unlink(tmp);}catch{}throw e;}}
export function assertSafeReportDir(out){let r=checkedPath(out);if(r===path.parse(r).root)fail('Output directory cannot be filesystem root');return r;}
export function safeSummary(s,n=180){return String(s||'').replace(/[\r\n\t]/g,' ').slice(0,n);}
