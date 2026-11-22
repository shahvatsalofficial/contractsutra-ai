import {readBounded,record,fail,sha,ptr} from './utils.mjs';
const MAX_DEPTH=40;
export function validateContract(doc){
 const issues=[];if(!record(doc))return [{code:'ROOT_OBJECT_REQUIRED',pointer:'#',message:'Root must be a JSON object'}];
 if(typeof doc.openapi !== 'string'||!/^3\.(0|1|2)(?:\.|$)/.test(doc.openapi))issues.push({code:'OPENAPI_VERSION_UNSUPPORTED',pointer:'#/openapi',message:'JSON OpenAPI 3.0, 3.1 or 3.2 documents only in this starter'});
 if(!record(doc.paths))issues.push({code:'PATHS_REQUIRED',pointer:'#/paths',message:'paths must be an object'});
 const names=['get','post','put','delete','patch','options','head','trace'];
 for(const route of Object.keys(record(doc.paths)?doc.paths:{})){
  if(!route.startsWith('/'))issues.push({code:'INVALID_PATH',pointer:ptr(['paths',route]),message:'Path must start with /'});
  const item=doc.paths[route];if(!record(item)){issues.push({code:'INVALID_PATH_ITEM',pointer:ptr(['paths',route]),message:'Path item must be an object'});continue;}
  for(const verb of names){if(!(verb in item))continue;const operation=item[verb];if(!record(operation)){issues.push({code:'INVALID_OPERATION',pointer:ptr(['paths',route,verb]),message:'Operation must be object'});continue;}
   if(!record(operation.responses))issues.push({code:'RESPONSES_REQUIRED',pointer:ptr(['paths',route,verb,'responses']),message:'Responses object required'});
  }
 }
 return issues;
}
function jsonSafe(txt){try{return JSON.parse(txt);}catch(e){fail('Unable to parse JSON: '+e.message+' (YAML requires an optional parser in a future release)','PARSE_ERROR');}}
export function resolveLocal(doc,ref,seen=new Set()){
 if(typeof ref!=='string'||!ref.startsWith('#/'))return {value:null,issue:'External or unsupported $ref is not resolved'};
 if(seen.has(ref)||seen.size>MAX_DEPTH)return {value:null,issue:'Cyclic/too-deep $ref is not resolved'};
 let cur=doc;for(const seg of ref.slice(2).split('/').map(v=>v.replaceAll('~1','/').replaceAll('~0','~'))){if(!record(cur)||!Object.hasOwn(cur,seg))return {value:null,issue:'Unresolvable local $ref'};cur=cur[seg];}
 if(record(cur)&&typeof cur.$ref==='string')return resolveLocal(doc,cur.$ref,new Set([...seen,ref]));
 return {value:cur};
}
export function inspectRefs(doc){const out=[];const seen=new WeakSet();function walk(x,path=[],depth=0){if(!record(x)&&!Array.isArray(x))return;if(depth>MAX_DEPTH){out.push({pointer:ptr(path),issue:'Max depth exceeded'});return;}if(seen.has(x))return;seen.add(x);
 if(record(x)&&typeof x.$ref==='string'){const r=resolveLocal(doc,x.$ref);if(r.issue)out.push({pointer:ptr([...path,'$ref']),ref:x.$ref,issue:r.issue});}
 for(const [k,v] of Object.entries(x))if(k!=='example'&&k!=='examples'&&k!=='default')walk(v,[...path,k],depth+1);
 }walk(doc);return out;}
export async function loadSpec(filepath){let text=await readBounded(filepath);const doc=jsonSafe(text);const issues=validateContract(doc);const refs=inspectRefs(doc);return {doc,issues,refs,hash:sha(text),source:filepath};}
