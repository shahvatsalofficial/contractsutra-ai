// Reproducible proof run: test suite counts, gold-corpus precision/recall, deterministic fuzzing, benchmark.
// Output: docs/proof/{environment,gold-corpus,fuzz-results,benchmark}.json and docs/proof/TEST-RESULTS.md
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {diffContracts} from '../src/core/compare.mjs';
import {inspectRefs,validateContract} from '../src/core/load.mjs';
import {toMarkdown,toHtml,toSarif,VERSION} from '../src/core/report.mjs';
import {generateCases} from '../src/core/cases.mjs';
const ROOT=path.resolve(import.meta.dirname,'..'),OUT=path.join(ROOT,'docs/proof');await mkdir(OUT,{recursive:true});
const sha=t=>createHash('sha256').update(t).digest('hex');
const base=JSON.parse(await readFile(path.join(ROOT,'fixtures/openapi/before.json'),'utf8'));
// ---------- 1. test suite ----------
const t=spawnSync(process.execPath,['--test',...(await readdir(path.join(ROOT,'tests'))).filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f)],{cwd:ROOT,encoding:'utf8'});const out=t.stdout+t.stderr;
const n=k=>Number((out.match(new RegExp('ℹ '+k+' (\\d+)'))??[0,0])[1]);
const suite={tests:n('tests'),pass:n('pass'),fail:n('fail'),skipped:n('skipped'),exit:t.status};
// ---------- 2. gold corpus ----------
const post=x=>x.paths['/invitations'].post,reqS=x=>post(x).requestBody.content['application/json'].schema,resS=x=>post(x).responses['201'].content['application/json'].schema;
const m=f=>{const x=structuredClone(base);f(x);return x;};
const rkey=Object.keys(resS(base).properties)[0],qkey=Object.keys(reqS(base).properties)[0];
const P={name:'token',in:'query',schema:{type:'string'}};
const GOLD=[
 ['remove operation',m(x=>{delete x.paths['/invitations'].post;}),'OPERATION_REMOVED','breaking'],
 ['add operation',m(x=>{x.paths['/invitations'].get={responses:{200:{description:'ok'}}};}),'OPERATION_ADDED','additive'],
 ['add required query param',m(x=>{post(x).parameters=[{...P,required:true}];}),'PARAMETER_ADDED','breaking'],
 ['add optional query param',m(x=>{post(x).parameters=[{...P,required:false}];}),'PARAMETER_ADDED','additive'],
 ['request field becomes required',m(x=>{reqS(x).required=[...new Set([...(reqS(x).required??[]),'role'])];}),'FIELD_REQUIRED_CHANGED','breaking'],
 ['response field removed',m(x=>{delete resS(x).properties[rkey];resS(x).required=(resS(x).required??[]).filter(k=>k!==rkey);}),'FIELD_REMOVED','breaking'],
 ['response optional field added',m(x=>{resS(x).properties.extraOptional={type:'string'};}),'FIELD_ADDED','additive'],
 ['request optional field added',m(x=>{reqS(x).properties.extraOptional={type:'string'};}),'FIELD_ADDED','info'],
 ['request required field added',m(x=>{reqS(x).properties.mustHave={type:'string'};reqS(x).required=[...(reqS(x).required??[]),'mustHave'];}),'FIELD_ADDED','breaking'],
 ['response type changed',m(x=>{resS(x).properties[rkey].type=resS(x).properties[rkey].type==='string'?'integer':'string';}),'TYPE_CHANGED','breaking'],
 ['response status removed',m(x=>{delete post(x).responses['201'];}),'RESPONSE_STATUS_REMOVED','breaking'],
 ['response status added',m(x=>{post(x).responses['409']={description:'conflict'};}),'RESPONSE_STATUS_ADDED','additive'],
 ['request media type removed',m(x=>{post(x).requestBody.content={'text/plain':{schema:{type:'string'}}};}),'MEDIA_REMOVED','breaking'],
 ['request maxLength tightened',m(x=>{reqS(x).properties[qkey].maxLength=10;}),'CONSTRAINT_TIGHTENED','breaking'],
 ['response enum expanded',m(x=>{resS(x).properties.kind={type:'string',enum:['a','b']};}),'FIELD_ADDED','additive'],
 ['composition introduced (unknown)',m(x=>{reqS(x).properties[qkey]={oneOf:[{type:'string'},{type:'integer'}]};}),'UNRESOLVED_SEMANTICS','risky'],
 ['external $ref (unknown)',m(x=>{reqS(x).properties[qkey]={$ref:'https://evil.example/s.json'};}),'UNRESOLVED_SEMANTICS','risky'],
 ['request body becomes required',base,'REQUEST_BODY_NOW_REQUIRED','breaking',m(x=>{post(x).requestBody.required=false;})],
 ['description-only change',m(x=>{post(x).summary='renamed summary';}),'__none__',null],
 ['no change',structuredClone(base),'__none__',null],
];
let tp=0,fp=0,fn=0,tn=0;const rows=[];
for(const [name,after,code,kind,before] of GOLD){const r=diffContracts(before??base,after);
 let ok;if(code==='__none__'){ok=r.findings.length===0;ok?tn++:fp++;}
 else if(code===null){ok=r.findings.some(f=>f.kind==='breaking'||f.kind==='additive');ok?tp++:fn++;}
 else{ok=r.findings.some(f=>f.code===code&&f.kind===kind);ok?tp++:fn++;if(r.findings.some(f=>f.kind==='breaking')&&kind!=='breaking')fp++;}
 rows.push({case:name,expected:code==='__none__'?'no findings':code?code+' / '+kind:'any classified change',observed:r.findings.map(f=>f.code+'/'+f.kind).join(', ')||'none',pass:ok});}
const gold={cases:GOLD.length,passed:rows.filter(r=>r.pass).length,truePositive:tp,falsePositive:fp,falseNegative:fn,trueNegative:tn,precision:tp+fp?tp/(tp+fp):1,recall:tp+fn?tp/(tp+fn):1,note:'Author-labelled synthetic corpus: it measures agreement with the author\'s own rules, not accuracy on real-world APIs.',rows};
// ---------- 3. deterministic fuzz ----------
let seed=0xC0FFEE;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
const pick=a=>a[Math.floor(rnd()*a.length)];
const JUNK=[null,true,0,-1,1e308,'','x'.repeat(5000),[],{},[[]],{$ref:'#/nope'},{$ref:'#/paths'},{$ref:'#'},{type:['string','null']},{allOf:[{}]},'__proto__',{__proto__:null}];
function mutate(o,depth=0){if(!o||typeof o!=='object'||depth>12)return;const keys=Object.keys(o);if(!keys.length)return;const k=pick(keys);const r=rnd();
 if(r<.25)delete o[k];else if(r<.5)o[k]=structuredClone(pick(JUNK));else if(r<.6&&Array.isArray(o)===false)o['k'+Math.floor(rnd()*9)]=structuredClone(pick(JUNK));else mutate(o[k],depth+1);}
let fuzzCases=2000,crashes=0,nondeterministic=0,renderFail=0,selfDiffNonZero=0;const crashSamples=[];
for(let i=0;i<fuzzCases;i++){const a=structuredClone(base),b=structuredClone(base);for(let j=0;j<1+Math.floor(rnd()*4);j++){mutate(rnd()<.5?a:b);}
 try{if(!a||!b)continue;const A={doc:a,refs:inspectRefs(a)},B={doc:b,refs:inspectRefs(b)};validateContract(a);validateContract(b);
  const r1=diffContracts(A,B),r2=diffContracts(A,B);if(JSON.stringify(r1)!==JSON.stringify(r2))nondeterministic++;
  if(diffContracts(A,A).findings.some(f=>f.code!=='UNRESOLVED_SEMANTICS'&&f.code!=='SCHEMA_UNKNOWN'))selfDiffNonZero++;
  const rep={...r1,consumerManifest:null,unknown:r1.unknown};try{toMarkdown(rep);toHtml(rep);toSarif(rep);generateCases(B);}catch(e){renderFail++;if(crashSamples.length<5)crashSamples.push('render:'+e.message);}
 }catch(e){crashes++;if(crashSamples.length<5)crashSamples.push(String(e.message).slice(0,120));}}
const fuzz={cases:fuzzCases,seed:'0xC0FFEE (LCG)',unhandledExceptions:crashes,nondeterministicDiffs:nondeterministic,renderFailures:renderFail,selfDiffUnexpectedFindings:selfDiffNonZero,crashSamples};
// ---------- 4. benchmark ----------
function big(nOps){const d={openapi:'3.1.0',info:{title:'b',version:'1'},paths:{}};for(let i=0;i<nOps;i++)d.paths['/r'+i]={get:{responses:{200:{description:'ok',content:{'application/json':{schema:{type:'object',required:['id'],properties:{id:{type:'string'},a:{type:'integer'},b:{type:'object',properties:{c:{type:'string'}}}}}}}}}}};return d;}
const bench=[];for(const nOps of [100,500,1000]){const a=big(nOps),b=big(nOps);b.paths['/r1'].get.responses[200].content['application/json'].schema.properties.z={type:'string'};const t0=performance.now();const r=diffContracts({doc:a,refs:[]},{doc:b,refs:[]});bench.push({operations:nOps,specBytes:JSON.stringify(a).length,findings:r.findings.length,ms:Math.round(performance.now()-t0)});}
// ---------- write ----------
const env={version:VERSION,recordedAt:new Date().toISOString(),node:process.version,platform:process.platform+' '+process.arch,cpus:os.cpus().length,fixtureHashes:{before:sha(await readFile(path.join(ROOT,'fixtures/openapi/before.json'),'utf8')),after:sha(await readFile(path.join(ROOT,'fixtures/openapi/after.json'),'utf8'))},suite,goldPassed:gold.passed,goldCases:gold.cases,fuzzCases:fuzz.cases,fuzzFailures:crashes+nondeterministic+renderFail+selfDiffNonZero};
await writeFile(path.join(OUT,'environment.json'),JSON.stringify(env,null,2)+'\n');await writeFile(path.join(OUT,'gold-corpus.json'),JSON.stringify(gold,null,2)+'\n');await writeFile(path.join(OUT,'fuzz-results.json'),JSON.stringify(fuzz,null,2)+'\n');await writeFile(path.join(OUT,'benchmark.json'),JSON.stringify({node:process.version,platform:env.platform,note:'Single process, synthetic specs, wall-clock of diffContracts only',runs:bench},null,2)+'\n');
const md=['# ContractSutra AI — Test results and proof','',`Generated ${env.recordedAt} · v${VERSION} · Node ${env.node} · ${env.platform}`,'','## Test suite','',`| Tests | Passed | Failed | Skipped |`,'| ---: | ---: | ---: | ---: |',`| ${suite.tests} | ${suite.pass} | ${suite.fail} | ${suite.skipped} |`,'',`## Gold corpus (${gold.passed}/${gold.cases} cases agree)`,'',`Precision ${gold.precision.toFixed(3)} · Recall ${gold.recall.toFixed(3)} · FP ${fp} · FN ${fn}`,'',`> ${gold.note}`,'','| Case | Expected | Observed | Result |','| --- | --- | --- | --- |',...rows.map(r=>`| ${r.case} | ${r.expected} | ${r.observed} | ${r.pass?'PASS':'FAIL'} |`),'',`## Deterministic fuzz (${fuzz.cases} mutated spec pairs, seed ${fuzz.seed})`,'',`- Unhandled exceptions: ${crashes}`,`- Non-deterministic diffs: ${nondeterministic}`,`- Report render failures: ${renderFail}`,`- Self-diff produced unexpected findings: ${selfDiffNonZero}`,'','## Benchmark','','| Operations | Spec bytes | Findings | ms |','| ---: | ---: | ---: | ---: |',...bench.map(b=>`| ${b.operations} | ${b.specBytes} | ${b.findings} | ${b.ms} |`),'','## Not proven','','- Behaviour on real production specs, YAML, GraphQL, AsyncAPI, protobuf.','- Any live consumer or Pact verification.','- Independent third-party security audit.',''].join('\n');
await writeFile(path.join(OUT,'TEST-RESULTS.md'),md);
console.log(JSON.stringify(env,null,2));
if(suite.fail||gold.passed!==gold.cases||env.fuzzFailures)process.exitCode=1;
