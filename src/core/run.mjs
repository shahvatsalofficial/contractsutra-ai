import path from 'node:path';
import {loadSpec} from './load.mjs';
import {diffContracts} from './compare.mjs';
import {loadConsumers,mapConsumers} from './consumers.mjs';
import {generateCases} from './cases.mjs';
import {writeReports,VERSION} from './report.mjs';
import {appendAudit} from './audit.mjs';
import {fail} from './utils.mjs';
export const GATES=['breaking','risky','none'];
/** Compare two specs end to end. Writes reports + audit event when `out` is set. */
export async function runCompare({before,after,consumers,out,gate='risky',type='compare'}){
 if(!GATES.includes(gate))fail('--fail-on must be breaking|risky|none');
 const [b,a,c]=await Promise.all([loadSpec(before),loadSpec(after),loadConsumers(consumers)]);
 if(b.issues.length||a.issues.length)fail('Invalid OpenAPI specification: '+JSON.stringify({before:b.issues,after:a.issues}));
 const report=mapConsumers(diffContracts(b,a),c),cases=generateCases(a);
 let files=null;
 if(out){files=await writeReports(out,report,cases,{gate});
  await appendAudit(path.join(out,'audit.jsonl'),type,{tool:'contractsutra-ai@'+VERSION,beforeHash:b.hash,afterHash:a.hash,consumerHash:c.hash,counts:report.counts,gate,reportNames:[...files],reportHashes:files.hashes});}
 const exitCode=gate==='breaking'&&report.counts.breaking||gate==='risky'&&(report.counts.breaking||report.counts.risky)?2:0;
 return {report,cases,files,exitCode,gate};
}
