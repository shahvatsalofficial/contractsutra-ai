import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {sha,escapeHtml,checkedPath,atomicWrite} from './utils.mjs';
import {verifyAudit} from './audit.mjs';
import {REPORT_FILES,VERSION,page} from './report.mjs';
export const AUDIT_SCHEMA='contractsutra.audit-report/1';
const CONSUMER_IMPACT=new Set(['UNKNOWN','DECLARED_CONSUMERS_MATCHED_UNVERIFIED']);
async function read(dir,name){try{return await readFile(path.join(dir,name),'utf8');}catch{return null;}}
const chk=(id,title,pass,detail)=>({id,title,status:pass?'PASS':'FAIL',detail});
/** Independent replay: recompute everything it can from the raw report files; trust nothing printed in them. */
export async function auditReportDir(dirArg){const dir=checkedPath(dirArg);const checks=[];const raw={};
 for(const f of [...REPORT_FILES,'audit.jsonl'])raw[f]=await read(dir,f);
 const missing=Object.entries(raw).filter(([,v])=>v===null).map(([k])=>k);
 checks.push(chk('AUD-01','All report files present',!missing.length,missing.length?'Missing: '+missing.join(', '):REPORT_FILES.length+' report files and audit.jsonl found'));
 let report=null;try{report=JSON.parse(raw['contract-diff.json']);}catch{}
 checks.push(chk('AUD-02','contract-diff.json parses',Boolean(report&&Array.isArray(report.findings)),report?'Parsed':'Unreadable or missing'));
 const chain=raw['audit.jsonl']===null?{ok:false,error:'audit.jsonl missing'}:await verifyAudit(path.join(dir,'audit.jsonl'));
 checks.push(chk('AUD-03','Audit hash chain intact',chain.ok,chain.ok?chain.events+' event(s), head '+chain.lastHash.slice(0,12):chain.error));
 let last=null;if(chain.ok){for(const l of raw['audit.jsonl'].split('\n').filter(Boolean)){const e=JSON.parse(l);if(e.metadata?.reportHashes)last=e;}}
 if(last){const bad=Object.entries(last.metadata.reportHashes).filter(([n,h])=>raw[n]===null||sha(raw[n])!==h).map(([n])=>n);
  checks.push(chk('AUD-04','Report bytes match hashes sealed in the audit log',!bad.length,bad.length?'Modified after generation: '+bad.join(', '):Object.keys(last.metadata.reportHashes).length+' files verified'));
  checks.push(chk('AUD-05','Input spec hashes match audit event',Boolean(report)&&report.beforeHash===last.metadata.beforeHash&&report.afterHash===last.metadata.afterHash,'before '+String(last.metadata.beforeHash).slice(0,12)+' after '+String(last.metadata.afterHash).slice(0,12)));}
 else checks.push(chk('AUD-04','Report bytes match hashes sealed in the audit log',false,'No audit event carries report hashes (log empty or from an older version)'));
 if(report){const f=report.findings;const recount={breaking:0,risky:0,additive:0,info:0};for(const x of f)recount[x.kind]=(recount[x.kind]??0)+1;
  checks.push(chk('AUD-06','Severity counts recompute',JSON.stringify(recount)===JSON.stringify(report.counts),JSON.stringify(recount)));
  const badIds=f.filter(x=>x.id!=='CS-'+sha([x.code,x.pointer,x.description]).slice(0,12).toUpperCase());
  checks.push(chk('AUD-07','Finding IDs recompute from content',!badIds.length,badIds.length?badIds.length+' ID(s) do not match content':f.length+' ID(s) verified'));
  const inflated=f.filter(x=>!CONSUMER_IMPACT.has(x.consumerImpact)||x.verification!=='OBSERVED_IN_SPEC');
  checks.push(chk('AUD-08','No claim inflation (no finding claims verified consumer impact)',!inflated.length,inflated.length?inflated.length+' finding(s) over-claim':'All findings static-only'));
  checks.push(chk('AUD-09','Disclaimer present',/NOT proof/.test(report.disclaimer??'')&&/NOT proof|not a universal/i.test(raw['compatibility.md']??''),'JSON and Markdown carry the static-analysis disclaimer'));
  const md=raw['compatibility.md']??'',html=raw['compatibility.html']??'';const notInMd=f.filter(x=>!md.includes(x.id)),notInHtml=f.filter(x=>!html.includes(escapeHtml(x.id)));
  checks.push(chk('AUD-10','Markdown and HTML list every finding',!notInMd.length&&!notInHtml.length,'md missing '+notInMd.length+', html missing '+notInHtml.length));
  const gen=raw['generated-cases.json']?JSON.parse(raw['generated-cases.json']):{cases:[]};const ran=gen.cases.filter(c=>c.execution!=='NOT_RUN');
  checks.push(chk('AUD-11','Generated cases are all NOT_RUN',!ran.length,gen.cases.length+' case(s), '+ran.length+' claim execution'));
  checks.push(chk('AUD-12','HTML report is inert (CSP, no scripts)',/Content-Security-Policy/.test(html)&&!/<script/i.test(html),'CSP meta present, zero script tags'));}
 const failed=checks.filter(c=>c.status==='FAIL').length;
 const body={schema:AUDIT_SCHEMA,tool:'contractsutra-ai@'+VERSION,directory:path.basename(dir),checks,passed:checks.length-failed,failed,
  verdict:failed?'FAIL':'PASS',assurance:'LOCAL_STARTER_VERIFIED',counts:report?.counts??null,
  limits:['Hash chain proves tamper-evidence, not authorship; it is not a signature.','Static spec comparison only: no consumer traffic, Pact verification or runtime test was executed.','Unsupported OpenAPI constructs are reported as UNRESOLVED_SEMANTICS, not as compatible.','This audit is automated self-verification, not an independent human audit or certification.']};
 return {...body,seal:sha(JSON.stringify(body))};}
export function verifySeal(rep){const {seal,...body}=rep;return Boolean(seal)&&seal===sha(JSON.stringify(body));}
export function auditToMarkdown(r){const L=['# ContractSutra AI — Independent Audit Report','',`**Verdict: ${r.verdict}** · ${r.passed}/${r.checks.length} checks passed · assurance level \`${r.assurance}\``,'',`Seal (SHA-256 of body): \`${r.seal}\``,'','| Check | Result | Title | Detail |','| --- | --- | --- | --- |',...r.checks.map(c=>`| ${c.id} | ${c.status} | ${c.title} | ${String(c.detail).replace(/\|/g,'\\|')} |`),'','## Limits of this audit','',...r.limits.map(x=>'- '+x),''];return L.join('\n');}
export function auditToHtml(r){const rows=r.checks.map(c=>`<tr><td><code>${c.id}</code></td><td><span class="badge b-${c.status==='PASS'?'pass':'fail'}">${c.status}</span></td><td>${escapeHtml(c.title)}</td><td>${escapeHtml(c.detail)}</td></tr>`).join('');
 return page('ContractSutra independent audit report',`<h1>ContractSutra AI — Independent Audit Report</h1><div class="verdict ${r.verdict==='PASS'?'pass':'fail'}" role="status">Verdict: ${r.verdict} — ${r.passed}/${r.checks.length} checks passed</div><p class="note">Assurance level <code>${escapeHtml(r.assurance)}</code> · seal <code>${escapeHtml(r.seal)}</code></p><h2>Checks</h2><div class="wrap"><table><thead><tr><th>ID</th><th>Result</th><th>Check</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table></div><h2>Limits of this audit</h2><ul>${r.limits.map(x=>'<li>'+escapeHtml(x)+'</li>').join('')}</ul>`,'Independent replay audit of ContractSutra compatibility reports');}
export async function writeAuditReport(r,outArg){const out=checkedPath(outArg);await mkdir(out,{recursive:true});
 await atomicWrite(path.join(out,'audit-report.json'),JSON.stringify(r,null,2)+'\n');await atomicWrite(path.join(out,'audit-report.md'),auditToMarkdown(r));await atomicWrite(path.join(out,'audit-report.html'),auditToHtml(r));return ['audit-report.json','audit-report.md','audit-report.html'];}
