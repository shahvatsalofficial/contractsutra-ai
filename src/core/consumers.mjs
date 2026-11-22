import {readBounded,record,fail,sha} from './utils.mjs';
// Manifest is user-declared, not independently verified Pact evidence.
export async function loadConsumers(filepath){if(!filepath)return {consumers:[],source:'none',hash:null};const text=await readBounded(filepath,512*1024);let doc;try{doc=JSON.parse(text);}catch{fail('Consumer manifest must be JSON','PARSE_ERROR');}
 if(!record(doc)||!Array.isArray(doc.consumers)||doc.consumers.length>250)fail('Expected {"consumers": [...]}, max 250');
 const consumers=doc.consumers.map((c,i)=>{if(!record(c)||typeof c.name!=='string'||!c.name.trim()||c.name.length>80||!Array.isArray(c.operations)||c.operations.length>200||c.operations.some(op=>typeof op!=='string'||op.length>200))fail('Invalid consumer entry at index '+i);return {name:c.name,operations:[...new Set(c.operations)],evidence:'USER_DECLARED_UNVERIFIED'};});
 return {consumers,source:filepath,hash:sha(text)};
}
export function mapConsumers(report,manifest){return {...report,consumerManifest:{sourceHash:manifest.hash,entries:manifest.consumers.length,confidence:'USER_DECLARED_UNVERIFIED'},findings:report.findings.map(f=>{
  const m=f.pointer.match(/^#\/paths\/([^/]+)\/(get|post|put|patch|delete|options|head|trace)/);let op=null;
  if(m)op=m[2].toUpperCase()+' '+m[1].replaceAll('~1','/').replaceAll('~0','~');
  const impacted=op?manifest.consumers.filter(c=>c.operations.includes(op)).map(c=>c.name):[];
  return {...f,operation:op,affectedConsumers:impacted,consumerImpact:impacted.length?'DECLARED_CONSUMERS_MATCHED_UNVERIFIED':'UNKNOWN'};
 })};}
