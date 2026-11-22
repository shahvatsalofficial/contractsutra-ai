import {normalize} from './normalize.mjs';
import {sorted,sha} from './utils.mjs';
function exampleOf(schema,depth=0){if(!schema||depth>5)return null;if(Array.isArray(schema.enum)&&schema.enum.length)return schema.enum[0];
 if(schema.type==='object')return Object.fromEntries(sorted(schema.properties).filter(k=>schema.required.includes(k)).map(k=>[k,exampleOf(schema.properties[k],depth+1)]));
 if(schema.type==='array')return schema.items?[exampleOf(schema.items,depth+1)]:[];
 if(schema.type==='integer'||schema.type==='number')return 0;
 if(schema.type==='boolean')return false;
 if(schema.type==='string')return 'example';return null;}
export function generateCases(doc){const {operations,unknown}=normalize(doc.doc??doc);const cases=[];
 for(const id of sorted(operations)){
  const op=operations[id];for(const status of sorted(op.responses)){for(const media of sorted(op.responses[status].content)){const schema=op.responses[status].content[media].schema;if(schema.unknown)continue;
   const base={operation:id,status,mediaType:media,schemaPointer:op.base+'/responses/'+status+'/content/'+media.replaceAll('~','~0').replaceAll('/','~1')+'/schema',execution:'NOT_RUN',scope:'LOCAL_MOCK_CASE_TEMPLATE'};
   const sample=exampleOf(schema);cases.push({...base,id:'CASE-'+sha([id,status,media,'positive']).slice(0,10),kind:'positive',sample,expect:'Matches declared schema; not validated against a running service'});
   if(schema.type==='object'&&schema.required.length){const missing=schema.required[0];const invalid={...(sample??{})};delete invalid[missing];cases.push({...base,id:'CASE-'+sha([id,status,media,'negative']).slice(0,10),kind:'negative',sample:invalid,expect:'Missing required field '+missing+' should fail validation'});}
  }}
 }
 return {schemaVersion:'1.0.0',generatedAt:null,cases,unknown,disclaimer:'Generated examples are NOT executed tests; do not infer live service behavior.'};}
