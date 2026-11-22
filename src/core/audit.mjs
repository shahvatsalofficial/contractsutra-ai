import {readFile,appendFile,mkdir,stat} from 'node:fs/promises';
import {sha,checkedPath,fail} from './utils.mjs';
import path from 'node:path';
export async function verifyAudit(filepath,{allowMissing=false}={}){const file=checkedPath(filepath);let raw;try{raw=await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return allowMissing?{ok:true,events:0,lastHash:'GENESIS'}:{ok:false,events:0,error:'AUDIT_NOT_FOUND'};throw e;}
 const lines=raw.split('\n').filter(Boolean);let prev='GENESIS';for(let i=0;i<lines.length;i++){let event;try{event=JSON.parse(lines[i]);}catch{return {ok:false,error:'Malformed JSON at line '+(i+1),events:i};}
 const {hash,...entry}=event;const expected=sha(JSON.stringify(entry));if(entry.prevHash!==prev||hash!==expected)return {ok:false,error:'Hash chain mismatch at line '+(i+1),events:i};prev=hash;
 }return {ok:true,events:lines.length,lastHash:prev};}
export async function appendAudit(filepath,type,metadata){const file=checkedPath(filepath);const prior=await verifyAudit(file,{allowMissing:true});if(!prior.ok)fail('Cannot append to tampered audit log: '+prior.error,'AUDIT_TAMPERED');
 const event={v:1,type,at:new Date().toISOString(),prevHash:prior.lastHash,metadata};const hash=sha(JSON.stringify(event));await mkdir(path.dirname(file),{recursive:true});await appendFile(file,JSON.stringify({...event,hash})+'\n',{mode:0o600});return hash;}
