import {sha,sorted} from './utils.mjs';
import {normalize} from './normalize.mjs';
const TYPES=new Set(['breaking','risky','additive','info']);
function makeFinder(findings){return function(kind,code,where,description,detail={}){if(!TYPES.has(kind))throw new Error('Invalid severity');const id='CS-'+sha([code,where,description]).slice(0,12).toUpperCase();findings.push({id,kind,code,pointer:where,description,...detail,evidence:'static-contract-diff',verification:'OBSERVED_IN_SPEC',consumerImpact:'UNKNOWN'});};}
function enumKey(x){return JSON.stringify(x);}
const LOWER=new Set(['minimum','exclusiveMinimum','minLength','minItems','minProperties']);
const BOUNDS=['minimum','exclusiveMinimum','minLength','minItems','minProperties','maximum','exclusiveMaximum','maxLength','maxItems','maxProperties'];
function constraintDiff(b,a,where,side,emit){const x=b.constraints??{},y=a.constraints??{};
 for(const k of BOUNDS){if(x[k]===y[k])continue;
  if(typeof x[k]==='boolean'||typeof y[k]==='boolean'){emit('risky','CONSTRAINT_CHANGED',where,'Constraint '+k+' changed (non-numeric form)',{direction:side,constraint:k});continue;}
  const tight=y[k]!==undefined&&(x[k]===undefined||(LOWER.has(k)?y[k]>x[k]:y[k]<x[k]));
  if(side==='request')emit(tight?'breaking':'additive',tight?'CONSTRAINT_TIGHTENED':'CONSTRAINT_RELAXED',where,'Request constraint '+k+(tight?' tightened':' relaxed'),{direction:side,constraint:k});
  else emit(tight?'additive':'risky',tight?'CONSTRAINT_TIGHTENED':'CONSTRAINT_RELAXED',where,'Response constraint '+k+(tight?' tightened (stronger guarantee)':' relaxed (weaker guarantee)'),{direction:side,constraint:k});}
 for(const k of ['pattern','uniqueItems','additionalProperties']){if(x[k]===y[k])continue;
  const restricting=y[k]!==undefined&&x[k]===undefined;
  emit(side==='request'&&restricting?'breaking':'risky','CONSTRAINT_CHANGED',where,'Constraint '+k+' changed',{direction:side,constraint:k});}
}
function schemaDiff(before,after,where,side,emit,limit=0){
 if(limit>8)return emit('risky','NESTED_SCHEMA_LIMIT',where,'Nested change requires manual review');
 if(before.unknown||after.unknown)return emit('risky','SCHEMA_UNKNOWN',where,'Unsupported or unresolved schema; compatibility cannot be established');
 if(before.type!==after.type)emit('breaking','TYPE_CHANGED',where,'Schema type changed: '+before.type+' → '+after.type,{direction:side});
 if(before.nullable!==after.nullable){const breaking=side==='response' ? (!before.nullable&&after.nullable) : (before.nullable&&!after.nullable);emit(breaking?'breaking':'additive','NULLABILITY_CHANGED',where,'Nullability changed from '+before.nullable+' to '+after.nullable,{direction:side});}
 if(before.format!==after.format)emit('risky','FORMAT_CHANGED',where,'Format annotation changed',{direction:side});
 constraintDiff(before,after,where,side,emit);
 if(before.enum||after.enum){const a=new Set((before.enum??[]).map(enumKey)), b=new Set((after.enum??[]).map(enumKey));if(!before.enum||!after.enum)emit('risky','ENUM_DECLARATION_CHANGED',where,'Enum constraint added or removed',{direction:side});else{
 const removed=[...a].filter(x=>!b.has(x)),added=[...b].filter(x=>!a.has(x));if(removed.length)emit(side==='request'?'breaking':'risky','ENUM_VALUES_REMOVED',where,'Enum options removed: '+removed.length,{direction:side});if(added.length)emit(side==='response'?'risky':'additive','ENUM_VALUES_ADDED',where,'Enum options added: '+added.length,{direction:side});
 }}
 const oldReq=new Set(before.required),newReq=new Set(after.required);
 for(const key of sorted(before.properties)){
  const child=where+'/properties/'+key.replaceAll('~','~0').replaceAll('/','~1');
  if(!Object.hasOwn(after.properties,key)){emit(side==='response'?'breaking':'risky','FIELD_REMOVED',child,'Schema field removed: '+key,{direction:side,oldRequired:oldReq.has(key)});continue;}
  if(oldReq.has(key)!==newReq.has(key)){
   const breaking=side==='response' ? oldReq.has(key)&&!newReq.has(key) : !oldReq.has(key)&&newReq.has(key);
   emit(breaking?'breaking':'additive','FIELD_REQUIRED_CHANGED',child,'Required status changed: '+oldReq.has(key)+' → '+newReq.has(key),{direction:side});
  }
  schemaDiff(before.properties[key],after.properties[key],child,side,emit,limit+1);
 }
 for(const key of sorted(after.properties))if(!Object.hasOwn(before.properties,key)){
  const child=where+'/properties/'+key.replaceAll('~','~0').replaceAll('/','~1');const breaking=side==='request'&&newReq.has(key);
  emit(breaking?'breaking':side==='response'?'additive':'info','FIELD_ADDED',child,'Schema field added: '+key+(newReq.has(key)?' (required)':' (optional)'),{direction:side,newRequired:newReq.has(key)});
 }
 if(before.items&&after.items)schemaDiff(before.items,after.items,where+'/items',side,emit,limit+1);
 else if(Boolean(before.items)!==Boolean(after.items))emit('risky','ARRAY_ITEMS_CHANGED',where,'Array item schema changed',{direction:side});
}
function contentDiff(oldContent,newContent,where,side,emit){
 for(const media of sorted(oldContent)){
  const loc=where+'/'+media.replaceAll('~','~0').replaceAll('/','~1');
  if(!Object.hasOwn(newContent,media)){emit('breaking','MEDIA_REMOVED',loc,'Previously supported media type removed: '+media,{direction:side});continue;}
  schemaDiff(oldContent[media].schema,newContent[media].schema,loc+'/schema',side,emit);
 }
 for(const media of sorted(newContent))if(!Object.hasOwn(oldContent,media))emit('additive','MEDIA_ADDED',where+'/'+media.replaceAll('~','~0').replaceAll('/','~1'),'Media type added: '+media,{direction:side});
}
function compareParams(b,a,base,emit){for(const id of sorted(b)){
 const p=b[id],loc=base+'/parameters/'+id.replaceAll('~','~0').replaceAll('/','~1');
 if(!a[id]){emit(p.required?'breaking':'risky','PARAMETER_REMOVED',loc,'Parameter removed: '+id);continue;}
 if(!p.required&&a[id].required)emit('breaking','PARAMETER_NOW_REQUIRED',loc,'Parameter became required: '+id);
 else if(p.required&&!a[id].required)emit('additive','PARAMETER_NOW_OPTIONAL',loc,'Parameter became optional: '+id);
 schemaDiff(p.schema,a[id].schema,loc+'/schema','request',emit);
 }
 for(const id of sorted(a))if(!b[id])emit(a[id].required?'breaking':'additive','PARAMETER_ADDED',base+'/parameters/'+id.replaceAll('~','~0').replaceAll('/','~1'),(a[id].required?'Required':'Optional')+' parameter added: '+id);
}
function compareOperation(b,a,emit){const base=a.base;
 compareParams(b.parameters,a.parameters,base,emit);
 if(!b.requestBody.required&&a.requestBody.required)emit('breaking','REQUEST_BODY_NOW_REQUIRED',base+'/requestBody','Request body became required');
 if(b.requestBody.required&&!a.requestBody.required)emit('additive','REQUEST_BODY_NOW_OPTIONAL',base+'/requestBody','Request body became optional');
 contentDiff(b.requestBody.content,a.requestBody.content,base+'/requestBody/content','request',emit);
 for(const status of sorted(b.responses)){
  const where=base+'/responses/'+status;
  if(!a.responses[status]){emit('breaking','RESPONSE_STATUS_REMOVED',where,'Documented response status removed: '+status);continue;}
  contentDiff(b.responses[status].content,a.responses[status].content,where+'/content','response',emit);
 }
 for(const status of sorted(a.responses))if(!b.responses[status])emit('additive','RESPONSE_STATUS_ADDED',base+'/responses/'+status,'Response status added: '+status);
}
export function diffContracts(before,after){const old=normalize(before.doc??before),curr=normalize(after.doc??after),findings=[];const emit=makeFinder(findings);
 for(const op of sorted(old.operations)){if(!curr.operations[op])emit('breaking','OPERATION_REMOVED',old.operations[op].base,'Operation removed: '+op);else compareOperation(old.operations[op],curr.operations[op],emit);}
 for(const op of sorted(curr.operations))if(!old.operations[op])emit('additive','OPERATION_ADDED',curr.operations[op].base,'Operation added: '+op);
 const unresolvedRefs=[...(before.refs??[]).map(x=>({...x,version:'before'})),...(after.refs??[]).map(x=>({...x,version:'after'}))];
 const unknown=[...old.unknown.map(x=>({...x,version:'before'})),...curr.unknown.map(x=>({...x,version:'after'})),...unresolvedRefs];
 for(const x of unknown)emit('risky','UNRESOLVED_SEMANTICS',x.pointer,'Manual review required: '+x.issue,{version:x.version});
 findings.sort((a,b)=>a.pointer.localeCompare(b.pointer)||a.code.localeCompare(b.code)||a.id.localeCompare(b.id));
 const counts={breaking:0,risky:0,additive:0,info:0};for(const f of findings)counts[f.kind]++;
 return {schemaVersion:'1.0.0',engine:'contractsutra-offline-openapi-json-subset-v0.1',beforeHash:before.hash??sha(before),afterHash:after.hash??sha(after),findings,counts,unknown,disclaimer:'Static specification comparison; NOT proof of actual consumer or runtime compatibility. Unresolved semantics require review.'};
}
