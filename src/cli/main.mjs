#!/usr/bin/env node
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {loadSpec} from '../core/load.mjs';
import {generateCases} from '../core/cases.mjs';
import {verifyAudit} from '../core/audit.mjs';
import {runCompare} from '../core/run.mjs';
import {auditReportDir,writeAuditReport,verifySeal} from '../core/assure.mjs';
import {VERSION} from '../core/report.mjs';
import {installIde} from '../adapters/ide.mjs';
import {createReportServer} from '../server/index.mjs';
import {startMcp} from '../mcp/stdio.mjs';
import {fail,readBounded,atomicWrite} from '../core/utils.mjs';
const help=`ContractSutra AI v${VERSION} — authored by Vatsal Shah

Usage:
  contractsutra validate --spec <openapi.json>
  contractsutra compare --before <v1.json> --after <v2.json> [--consumers consumers.json] [--out reports] [--fail-on breaking|risky|none]
  contractsutra cases --spec <openapi.json> [--out cases.json]
  contractsutra audit [--dir reports] [--out audit-out]   independent replay audit -> audit-report.json/.md/.html
  contractsutra audit --file reports/audit.jsonl          hash-chain check only
  contractsutra verify --report audit-out/audit-report.json
  contractsutra install-ide --host claude|cursor|codex|gemini|copilot|windsurf|cline|roo|continue --target <project>
  contractsutra serve [--dir reports] [--port 8765]   # requires CONTRACTSUTRA_TOKEN (>=32 chars)
  contractsutra mcp --root <project-dir>  # experimental legacy MCP stdio read-only
  contractsutra doctor | version

Scope: Offline JSON OpenAPI 3.0/3.1/3.2 subset. No URL ingestion or live probing.
Exit: 0 success; 2 gate failed; 3 invalid input; 4 internal error or failed audit.`;
const KEYS=['spec','before','after','consumers','out','fail-on','file','host','target','dir','port','root','report'];
function flags(argv){const out={};for(let i=0;i<argv.length;i++){const a=argv[i];if(!a.startsWith('--'))fail('Unknown positional argument: '+a);const key=a.slice(2);if(!KEYS.includes(key)||Object.hasOwn(out,key))fail('Unknown or duplicate option '+a);if(i+1>=argv.length||argv[i+1].startsWith('--'))fail('Option '+a+' requires a value');out[key]=argv[++i];}return out;}
function requireFlag(o,key){if(!o[key])fail('Missing --'+key);return o[key];}
const print=x=>console.log(JSON.stringify(x,null,2));
async function run(){const [command,...args]=process.argv.slice(2);if(!command||command==='help'||command==='--help'||command==='-h'){console.log(help);return;}
 if(command==='version'||command==='--version'||command==='-v'){console.log(VERSION);return;}
 const o=flags(args);
 if(command==='doctor'){console.log(JSON.stringify({version:VERSION,runtime:process.version,node22Plus:Number(process.versions.node.split('.')[0])>=22,platform:process.platform,offline:true,tokenConfigured:Boolean(process.env.CONTRACTSUTRA_TOKEN),remoteExecution:false}));return;}
 if(command==='validate'){const spec=await loadSpec(requireFlag(o,'spec'));print({valid:!spec.issues.length,issues:spec.issues,refs:spec.refs,sourceHash:spec.hash});if(spec.issues.length)process.exitCode=3;return;}
 if(command==='compare'){
  const r=await runCompare({before:requireFlag(o,'before'),after:requireFlag(o,'after'),consumers:o.consumers,out:o.out,gate:o['fail-on']??'risky'});
  console.log(JSON.stringify({counts:r.report.counts,unknown:r.report.unknown.length,files:o.out?path.resolve(o.out):null,gate:r.gate,passed:r.exitCode===0,disclaimer:r.report.disclaimer}));
  process.exitCode=r.exitCode;return;}
 if(command==='cases'){const spec=await loadSpec(requireFlag(o,'spec'));if(spec.issues.length)fail('Invalid specification: '+JSON.stringify(spec.issues));const result=generateCases(spec);if(o.out)await atomicWrite(o.out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({cases:result.cases.length,execution:'NOT_RUN',file:o.out??null}));return;}
 if(command==='audit'){
  if(o.file){const result=await verifyAudit(o.file);print(result);if(!result.ok)process.exitCode=4;return;}
  const dir=o.dir??'reports';const rep=await auditReportDir(dir);
  const files=o.out?await writeAuditReport(rep,o.out):null;
  print({verdict:rep.verdict,passed:rep.passed,failed:rep.failed,checks:rep.checks.map(c=>c.id+' '+c.status+' '+c.title),seal:rep.seal,files:files?files.map(f=>path.join(o.out,f)):null,limits:rep.limits});
  if(rep.verdict!=='PASS')process.exitCode=4;return;}
 if(command==='verify'){const text=await readBounded(requireFlag(o,'report'),8*1024*1024);let rep;try{rep=JSON.parse(text);}catch{fail('Audit report is not valid JSON','PARSE_ERROR');}const ok=verifySeal(rep);print({sealValid:ok,verdict:rep.verdict??null,note:ok?'Body hash matches seal (tamper-evidence only, not a signature).':'Seal mismatch: report was modified or is not a ContractSutra audit report.'});if(!ok)process.exitCode=4;return;}
 if(command==='install-ide'){print(await installIde(requireFlag(o,'host'),requireFlag(o,'target')));return;}
 if(command==='mcp'){startMcp(requireFlag(o,'root'));return;}
 if(command==='serve'){const port=Number(o.port??8765);const token=process.env.CONTRACTSUTRA_TOKEN;const {listen}=createReportServer({directory:o.dir,port,token});const addr=await listen();console.log(JSON.stringify({status:'listening',address:'127.0.0.1',port:addr.port,readOnly:true,tokenRedacted:true}));return;}
 fail('Unknown command: '+command);
}
run().catch(e=>{console.error(JSON.stringify({error:e.code??'ERROR',message:e.message}));process.exitCode=e.code==='INPUT_ERROR'||e.code==='PARSE_ERROR'?3:4;});
