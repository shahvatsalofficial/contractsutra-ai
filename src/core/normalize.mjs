import {record,sorted,ptr} from './utils.mjs';
import {resolveLocal} from './load.mjs';
const VERBS=['get','post','put','delete','patch','options','head','trace'];
const MAX_NESTING=6;
const NUM_KEYS=['minimum','maximum','exclusiveMinimum','exclusiveMaximum','minLength','maxLength','minItems','maxItems','minProperties','maxProperties'];
function pickConstraints(s){const c={};for(const k of NUM_KEYS)if(typeof s[k]==='number'||typeof s[k]==='boolean')c[k]=s[k];
 if(typeof s.pattern==='string')c.pattern=s.pattern;if(s.uniqueItems===true)c.uniqueItems=true;if(s.additionalProperties===false)c.additionalProperties=false;return c;}
export function schemaSummary(raw,doc,path,unknown,depth=0){
 let s=raw;if(!record(s))return {type:'unknown',required:[],properties:{},unknown:true};
 if(typeof s.$ref==='string') {let r=resolveLocal(doc,s.$ref);if(r.issue){unknown.push({pointer:path,issue:r.issue,ref:s.$ref});return {type:'unknown',required:[],properties:{},unknown:true};}s=r.value;}
 if(!record(s))return {type:'unknown',required:[],properties:{},unknown:true};
 if(depth>MAX_NESTING){unknown.push({pointer:path,issue:'Schema nesting limit reached'});return {type:'unknown',required:[],properties:{},unknown:true};}
 let composite=['allOf','oneOf','anyOf'].filter(k=>Array.isArray(s[k])&&s[k].length);
 if(composite.length){unknown.push({pointer:path,issue:'Composition semantics not fully analyzed: '+composite.join(',')});return {type:'unknown',required:[],properties:{},unknown:true};}
 let type=Array.isArray(s.type)?s.type.join('|'):s.type||('properties'in s?'object':'unspecified');
 let nullable=Boolean(s.nullable)||Array.isArray(s.type)&&s.type.includes('null');
 let properties={};for(const k of sorted(s.properties)){properties[k]=schemaSummary(s.properties[k],doc,path+'/properties/'+k.replaceAll('~','~0').replaceAll('/','~1'),unknown,depth+1);}
 return {type,nullable,required:Array.isArray(s.required)?[...new Set(s.required.filter(x=>typeof x==='string'))].sort():[],properties,enum:Array.isArray(s.enum)?s.enum:undefined,format:typeof s.format==='string'?s.format:undefined,constraints:pickConstraints(s),items:record(s.items)?schemaSummary(s.items,doc,path+'/items',unknown,depth+1):undefined,unknown:false};
}
function normalizeParams(list,doc,path,unknown){const out={};for(let i=0;i<(Array.isArray(list)?list.length:0);i++){
 let p=list[i];if(record(p)&&typeof p.$ref==='string'){const r=resolveLocal(doc,p.$ref);if(r.issue){unknown.push({pointer:path+'/'+i,issue:r.issue});continue;}p=r.value;}
 if(!record(p)||typeof p.name!=='string'||typeof p.in!=='string'){unknown.push({pointer:path+'/'+i,issue:'Invalid parameter'});continue;}
 const id=p.in+':'+p.name;out[id]={name:p.name,in:p.in,required:p.in==='path'||p.required===true,schema:schemaSummary(p.schema,doc,path+'/'+i+'/schema',unknown)};
 }return out;}
function normalizeContent(content,doc,path,unknown){const o={};for(const media of sorted(content))if(record(content[media]))o[media]={schema:schemaSummary(content[media].schema,doc,path+'/'+media.replaceAll('~','~0').replaceAll('/','~1')+'/schema',unknown)};return o;}
export function normalize(doc){const operations={};const unknown=[];for(const route of sorted(doc.paths)){
 const entry=doc.paths[route];if(!record(entry))continue;
 if(typeof entry.$ref==='string'){unknown.push({pointer:ptr(['paths',route]),issue:'Path Item $ref not supported'});continue;}
 const inherited=normalizeParams(entry.parameters,doc,ptr(['paths',route,'parameters']),unknown);
 for(const method of VERBS){const op=entry[method];if(!record(op))continue;
 const base=ptr(['paths',route,method]);const params={...inherited,...normalizeParams(op.parameters,doc,base+'/parameters',unknown)};
 let body={required:false,content:{}};
 if(record(op.requestBody)){let b=op.requestBody;if(typeof b.$ref==='string'){let r=resolveLocal(doc,b.$ref);if(r.issue){unknown.push({pointer:base+'/requestBody',issue:r.issue});b={};}else b=r.value;}
 body={required:b.required===true,content:normalizeContent(b.content,doc,base+'/requestBody/content',unknown)};}
 const responses={};for(const status of sorted(op.responses)){
 let resp=op.responses[status];if(record(resp)&&typeof resp.$ref==='string'){let r=resolveLocal(doc,resp.$ref);if(r.issue){unknown.push({pointer:base+'/responses/'+status,issue:r.issue});continue;}resp=r.value;}
 if(record(resp))responses[status]={content:normalizeContent(resp.content,doc,base+'/responses/'+status+'/content',unknown)};
 }
 operations[method.toUpperCase()+' '+route]={route,method,base,parameters:params,requestBody:body,responses};
 }
 }return {operations,unknown};}
