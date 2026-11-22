import readline from 'node:readline';
import {realpath} from 'node:fs/promises';
import path from 'node:path';
import {loadSpec} from '../core/load.mjs';
import {diffContracts} from '../core/compare.mjs';
import {generateCases} from '../core/cases.mjs';
import {mapConsumers} from '../core/consumers.mjs';
const LEGACY_PROTOCOL='2025-11-25';
const capabilities={tools:{listChanged:false}};
const TOOLS=[
 {name:'contractsutra_compare',description:'Read-only local OpenAPI JSON compatibility diff, no endpoint probing, no output writes',inputSchema:{type:'object',properties:{before:{type:'string'},after:{type:'string'}},required:['before','after'],additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}},
 {name:'contractsutra_cases',description:'Generate static, unexecuted mock test-case templates from local OpenAPI JSON',inputSchema:{type:'object',properties:{spec:{type:'string'}},required:['spec'],additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}}
];
export function createMcpHandler({root}){
 let allowed;
 async function inside(p){if(typeof p!=='string'||p.length>500)throw new Error('Path must be a short local string');if(!allowed)allowed=await realpath(root);const full=await realpath(path.resolve(allowed,p));if(full!==allowed&&!full.startsWith(allowed+path.sep))throw new Error('File is outside the authorized project root');return full;}
 return async function handle(msg){if(!msg||msg.jsonrpc!=='2.0'||typeof msg.method!=='string')return null;
  const base={jsonrpc:'2.0',id:msg.id};const method=msg.method;if(!Object.hasOwn(msg,'id'))return null;
  if(method==='initialize'){if(msg.params?.protocolVersion!==LEGACY_PROTOCOL)return {...base,error:{code:-32602,message:'Unsupported MCP protocol: this experimental server only supports '+LEGACY_PROTOCOL}};return {...base,result:{protocolVersion:LEGACY_PROTOCOL,capabilities,serverInfo:{name:'contractsutra-ai',version:'0.1.0',description:'Local only; compatibility mode for legacy MCP. Native IDE integration not verified.'}}};}
  if(method==='ping')return {...base,result:{}};
  if(method==='tools/list')return {...base,result:{tools:TOOLS}};
  if(method==='tools/call'){
   try{const args=msg.params?.arguments??{};let result;
    if(msg.params?.name==='contractsutra_compare'){
     const [old,current]=await Promise.all([loadSpec(await inside(args.before)),loadSpec(await inside(args.after))]);if(old.issues.length||current.issues.length)throw new Error('Invalid OpenAPI fixture');result=mapConsumers(diffContracts(old,current),{consumers:[],hash:null});
    }else if(msg.params?.name==='contractsutra_cases'){
     const source=await loadSpec(await inside(args.spec));if(source.issues.length)throw new Error('Invalid OpenAPI fixture');result=generateCases(source);
    }else throw new Error('Unknown tool');
    return {...base,result:{content:[{type:'text',text:JSON.stringify(result).slice(0,500000)}],isError:false}};
   }catch(e){return {...base,result:{content:[{type:'text',text:'Local read-only tool failed: '+e.message}],isError:true}};}
  }
  return {...base,error:{code:-32601,message:'Method not found'}};
 };
}
export function startMcp(root){const handle=createMcpHandler({root});const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});rl.on('line',async line=>{if(line.length>1024*1024)return;try{const response=await handle(JSON.parse(line));if(response)process.stdout.write(JSON.stringify(response)+'\n');}catch{process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}})+'\n');}});}
