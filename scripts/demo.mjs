import path from 'node:path';
import {runCompare} from '../src/core/run.mjs';
import {auditReportDir,writeAuditReport} from '../src/core/assure.mjs';
const root=path.resolve(import.meta.dirname,'..');const out=path.join(root,'examples/reports/demo');
const r=await runCompare({before:path.join(root,'fixtures/openapi/before.json'),after:path.join(root,'fixtures/openapi/after.json'),consumers:path.join(root,'fixtures/consumers/consumers.json'),out,gate:'none',type:'demo'});
const audit=await auditReportDir(out);const auditFiles=await writeAuditReport(audit,path.join(out,'audit'));
console.log(JSON.stringify({counts:r.report.counts,files:[...r.files,...auditFiles],auditVerdict:audit.verdict,dir:out,warning:'STATIC DEMO ONLY; no server or consumer verification performed'},null,2));
