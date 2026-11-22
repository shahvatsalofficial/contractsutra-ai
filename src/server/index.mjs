import http from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {checkedPath} from '../core/utils.mjs';
const RESPONSE_FILES=new Map([['/v1/report','contract-diff.json'],['/v1/consumers','affected-consumers.json'],['/v1/cases','generated-cases.json']]);
function equalToken(given,expected){const a=Buffer.from(given||''),b=Buffer.from(expected||'');return a.length===b.length&&timingSafeEqual(a,b);}
export function createReportServer({directory,token,port=8765}={}){
 if(typeof token!=='string'||token.length<32)throw new Error('CONTRACTSUTRA_TOKEN must have at least 32 characters');
 if(!Number.isInteger(port)||port<0||port>65535)throw new Error('Invalid port');
 const root=checkedPath(directory??'examples/reports/demo');const clients=new Map();
 const server=http.createServer(async(req,res)=>{
  const send=(status,body,ctype='application/json')=>{res.writeHead(status,{'Content-Type':ctype,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'"});res.end(typeof body==='string'?body:JSON.stringify(body));};
  if(req.method!=='GET')return send(405,{error:'READ_ONLY'});
  const ip=req.socket.remoteAddress||'unknown',now=Date.now(),slot=clients.get(ip)||{start:now,count:0};if(now-slot.start>60000){slot.start=now;slot.count=0;}slot.count++;clients.set(ip,slot);if(clients.size>1000)for(const [k,v] of clients)if(now-v.start>60000)clients.delete(k);if(slot.count>100)return send(429,{error:'RATE_LIMITED'});
  const bearer=String(req.headers.authorization||'');if(!bearer.startsWith('Bearer ')||!equalToken(bearer.slice(7),token))return send(401,{error:'UNAUTHORIZED'});
  const route=(req.url||'').split('?')[0];if(route==='/v1/health')return send(200,{ok:true,mode:'loopback-readonly',release:false});
  const basename=RESPONSE_FILES.get(route);if(!basename)return send(404,{error:'NOT_FOUND'});
  const file=path.join(root,basename);try{const base=await realpath(root),resolved=await realpath(file);if(!resolved.startsWith(base+path.sep))return send(403,{error:'REPORT_PATH_OUTSIDE_ROOT'});const meta=await stat(resolved);if(!meta.isFile()||meta.size>2*1024*1024)return send(413,{error:'FILE_TOO_LARGE'});const content=await readFile(resolved,'utf8');JSON.parse(content);return send(200,content);}catch{return send(404,{error:'REPORT_NOT_AVAILABLE'});}
 });return {server,listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>resolve(server.address()));})};
}
