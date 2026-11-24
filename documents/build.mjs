#!/usr/bin/env node
// Builds documents/html from documents/md with zero dependencies.
// Run: node documents/build.mjs  (after `npm run demo` and `npm run proof`). Scenario terminals are produced by running the real CLI.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {esc,icon,logo,FAVICON,flow,decision,bars,layers,direction,terminal} from './site/diagrams.mjs';
const HERE=import.meta.dirname,PROJECT=path.resolve(HERE,'..'),MD=path.join(HERE,'md'),OUT=path.join(HERE,'html');
const SITE='https://shahvatsalofficial.github.io/contractsutra-ai/',REPO='https://github.com/shahvatsalofficial/contractsutra-ai';
const env=JSON.parse(fs.readFileSync(path.join(PROJECT,'docs/proof/environment.json'),'utf8'));
const V={VERSION:env.version,TESTS:env.suite.tests,PASS:env.suite.pass,FAIL:env.suite.fail,SKIPPED:env.suite.skipped,GOLD:env.goldPassed,GOLDN:env.goldCases,FUZZ:env.fuzzCases,FUZZFAIL:env.fuzzFailures,NODE:env.node,PLATFORM:env.platform,DATE:env.recordedAt.slice(0,10)};
const sub=t=>t.replace(/\{\{(\w+)\}\}/g,(m,k)=>k in V?String(V[k]):m);
const slug=s=>s.toLowerCase().replace(/<[^>]+>/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

// ---------- real CLI runs for the scenarios ----------
const CLI=path.join(PROJECT,'src/cli/main.mjs'),FX=p=>path.join(PROJECT,'fixtures',p);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cs-docs-'));
const cli=(...a)=>{const r=spawnSync(process.execPath,[CLI,...a],{cwd:PROJECT,encoding:'utf8'});return {code:r.status,out:r.stdout,err:r.stderr};};
const readJ=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const base=readJ(FX('openapi/before.json'));
const variant=(name,fn)=>{const x=structuredClone(base);fn(x);const f=path.join(tmp,name);fs.writeFileSync(f,JSON.stringify(x));return f;};
const brief=o=>({counts:o.counts,unresolved:o.unknown,gate:o.gate,passed:o.passed});
const cmd=a=>{const p=a.split(' --');return p.map((x,i)=>(i?'    --':'$ contractsutra ')+x+(i<p.length-1?' \\':''));};
const show=(args,r)=>[...cmd(args),...JSON.stringify(brief(JSON.parse(r.out)),null,2).split('\n'),'exit code: '+r.code];
const SCN={};
const o1=path.join(tmp,'r1');
const r1=cli('compare','--before',FX('openapi/before.json'),'--after',FX('openapi/after.json'),'--out',o1,'--fail-on','breaking');
SCN.s1=show('compare --before v1.json --after v2.json --out reports --fail-on breaking',r1);
const rep1=readJ(path.join(o1,'contract-diff.json'));
const o2=path.join(tmp,'r2');
const r2=cli('compare','--before',FX('openapi/before.json'),'--after',FX('openapi/after.json'),'--consumers',FX('consumers/consumers.json'),'--out',o2,'--fail-on','none');
const aff=readJ(path.join(o2,'affected-consumers.json'));
SCN.s2=[...cmd('compare --before v1.json --after v2.json --consumers consumers.json --out reports --fail-on none'),'exit code: '+r2.code,'',...aff.findings.flatMap(f=>[f.id,'  '+f.consumerImpact,'  consumers: '+(f.affectedConsumers.join(', ')||'none declared'),''])];
const addOpt=variant('add-optional.json',x=>{x.paths['/invitations'].post.responses['201'].content['application/json'].schema.properties.invitedAt={type:'string'};});
const o3=path.join(tmp,'r3'),r3=cli('compare','--before',FX('openapi/before.json'),'--after',addOpt,'--out',o3);
SCN.s3=show('compare --before v1.json --after v2-additive.json --out reports',r3);
const oneOf=variant('oneof.json',x=>{x.paths['/invitations'].post.requestBody.content['application/json'].schema.properties.role={oneOf:[{type:'string'},{type:'integer'}]};});
const o4=path.join(tmp,'r4'),r4=cli('compare','--before',FX('openapi/before.json'),'--after',oneOf,'--out',o4);
const rep4=readJ(path.join(o4,'contract-diff.json'));
SCN.s4=show('compare --before v1.json --after v2-oneof.json --out reports',r4).concat(['',...rep4.findings.filter(f=>f.kind==='risky').map(f=>f.code+'  '+f.kind+'\n  '+f.pointer.replace('#/paths/~1invitations/post/requestBody/content/application~1json/schema','…')).join('\n').split('\n')]);
const o5=path.join(tmp,'r5');cli('compare','--before',FX('openapi/before.json'),'--after',FX('openapi/after.json'),'--out',o5,'--fail-on','none');
const clean=cli('audit','--dir',o5);
fs.appendFileSync(path.join(o5,'compatibility.md'),'\nNo breaking changes found.\n');
const bad=cli('audit','--dir',o5);const bj=JSON.parse(bad.out);
SCN.s5=['$ contractsutra audit --dir reports','verdict: '+JSON.parse(clean.out).verdict+'   (exit '+clean.code+')','','# someone appends a reassuring line to compatibility.md','$ echo "No breaking changes found." >> reports/compatibility.md','$ contractsutra audit --dir reports','verdict: '+bj.verdict+'   (exit '+bad.code+')',...bj.checks.filter(c=>/ FAIL /.test(c)).map(c=>c)];
SCN.hero=SCN.s1.slice(0,1).concat(SCN.s1.slice(1));
fs.rmSync(tmp,{recursive:true,force:true});

// ---------- figures ----------
const proofBars=()=>bars([
 {label:'Automated tests passing',value:V.PASS,total:V.TESTS,k:'ok'},
 {label:'Gold-corpus scenarios agree',value:V.GOLD,total:V.GOLDN,k:'ok'},
 {label:'Fuzz cases without failure',value:V.FUZZ-V.FUZZFAIL,total:V.FUZZ,k:'ok',text:`${V.FUZZ-V.FUZZFAIL} / ${V.FUZZ}`},
 {label:'Independent audit checks passing (demo)',value:12,total:12,k:'ok'}
],`Measured ${V.DATE} on Node ${V.NODE}. Reproduce with npm run proof.`);
const DIA={
 pipeline:()=>flow([{t:'Two specs',s:'before.json, after.json',k:'brand'},{t:'Normalize',s:'resolve $ref, summarize'},{t:'Compare',s:'direction-aware rules'},{t:'Report',s:'MD · HTML · JSON · SARIF',k:'ok'},{t:'Audit',s:'12 checks, sealed',k:'ok'}],'From two OpenAPI files to sealed evidence'),
 decision:()=>decision([
  {q:'Can the engine decide?',s:'oneOf, external $ref, cycles?',on:'no',out:'NEEDS REVIEW',k:'warn'},
  {q:'Request rejects what it accepted?',s:'new required field, tighter bound',on:'yes',out:'BREAKING',k:'bad'},
  {q:'Response stops promising something?',s:'field removed, type changed',on:'yes',out:'BREAKING',k:'bad'},
  {q:'Could a strict client be surprised?',s:'enum added, guarantee relaxed',on:'yes',out:'NEEDS REVIEW',k:'warn'}],'ADDITIVE / INFO','How one change is classified'),
 chain:()=>flow([{t:'GENESIS',s:'prevHash of event 1',k:'neutral'},{t:'Event 1: compare',s:'hash = SHA-256(event)',k:'brand'},{t:'Event 2: demo',s:'prevHash = hash 1',k:'brand'},{t:'Edit anything',s:'chain or report hash breaks',k:'bad'}],'Each audit event commits to the one before it'),
 ci:()=>flow([{t:'Pull request',s:'openapi.json changes',k:'brand'},{t:'compare vs main',s:'--fail-on breaking'},{t:'Gate',s:'exit 0 or 2',k:'warn'},{t:'Audit + SARIF',s:'evidence kept',k:'ok'},{t:'Security tab',s:'alerts with pointers',k:'ok'}],'Contract check in GitHub Actions')
};
const HTMLF={layers,direction};
const findingsTable=()=>{const cls={breaking:'bad',risky:'warn',additive:'ok',info:'info'},lab={breaking:'Breaking',risky:'Needs review',additive:'Additive',info:'Info'};
 return `<div class="tw"><table><thead><tr><th>ID</th><th>Severity</th><th>Code</th><th>Where (JSON pointer)</th></tr></thead><tbody>${rep1.findings.map(f=>`<tr><td><code>${esc(f.id)}</code></td><td><span class="sev ${cls[f.kind]}">${lab[f.kind]}</span></td><td><code>${esc(f.code)}</code></td><td><code>${esc(f.pointer.replace(/^#\/paths\/~1invitations\/post\//,'…/'))}</code></td></tr>`).join('')}</tbody></table></div>`;};
function directive(l){const m=l.match(/^@@(\w+)(?::(\w+))?@@$/);if(!m)return null;const [,k,n]=m;
 if(k==='diagram')return DIA[n]();if(k==='html')return HTMLF[n]();if(k==='term')return terminal(SCN[n],'bash');if(k==='bars')return proofBars();if(k==='findings')return findingsTable();throw new Error('unknown directive '+l);}

// ---------- markdown ----------
function inline(s){const codes=[];s=s.replace(/`([^`]+)`/g,(m,c)=>{codes.push(c);return '\u0000'+(codes.length-1)+'\u0000';});s=esc(s);
 s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(m,t,u)=>{if(!u.startsWith('samples/'))u=u.replace(/\.md(#|$)/,'.html$1');return `<a href="${u}"${/^https?:/.test(u)?' rel="noopener"':''}>${t}</a>`;});
 s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g,'$1<em>$2</em>');
 return s.replace(/\u0000(\d+)\u0000/g,(m,i)=>'<code>'+esc(codes[i])+'</code>');}
function render(md){const lines=md.split('\n'),out=[],toc=[];let i=0,first=true;
 const BRK=/^(#{1,4} |```|\||[-*] |\d+\. |> |@@)/;
 while(i<lines.length){const l=lines[i];
  if(l.startsWith('```')){const lang=l.slice(3).trim(),buf=[];i++;while(i<lines.length&&!lines[i].startsWith('```'))buf.push(lines[i++]);i++;out.push(`<div class="codewrap"${lang&&lang!=='text'?` data-lang="${esc(lang)}"`:''}><pre><code>${esc(buf.join('\n'))}</code></pre></div>`);continue;}
  const d=directive(l.trim());if(d!==null){out.push(d);i++;continue;}
  let m=l.match(/^(#{1,4}) (.*)/);if(m){const n=m[1].length,id=slug(m[2]);if(n===1&&first){first=false;out.push(`<h1>${inline(m[2])}</h1>`);i++;continue;}if(n===2)toc.push([id,m[2].replace(/`/g,'')]);out.push(`<h${n} id="${id}">${inline(m[2])}${n<4?`<a class="anc" href="#${id}" aria-label="Link to this section">#</a>`:''}</h${n}>`);i++;continue;}
  if(l.startsWith('|')&&lines[i+1]?.match(/^\|[\s:|-]+\|$/)){const rows=[];while(i<lines.length&&lines[i].startsWith('|'))rows.push(lines[i++]);const cells=r=>r.replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|'));
   out.push(`<div class="tw"><table><thead><tr>${cells(rows[0]).map(h=>`<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map(r=>`<tr>${cells(r).map(c=>`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue;}
  if(/^[-*] /.test(l)){const it=[];while(i<lines.length&&/^[-*] /.test(lines[i]))it.push(lines[i++].slice(2));out.push('<ul>'+it.map(x=>`<li>${inline(x)}</li>`).join('')+'</ul>');continue;}
  if(/^\d+\. /.test(l)){const it=[];while(i<lines.length&&/^\d+\. /.test(lines[i]))it.push(lines[i++].replace(/^\d+\. /,''));out.push('<ol>'+it.map(x=>`<li>${inline(x)}</li>`).join('')+'</ol>');continue;}
  if(l.startsWith('> ')){const b=[];while(i<lines.length&&lines[i].startsWith('> '))b.push(lines[i++].slice(2));out.push(`<blockquote><p>${inline(b.join(' '))}</p></blockquote>`);continue;}
  if(!l.trim()){i++;continue;}
  const p=[];while(i<lines.length&&lines[i].trim()&&!BRK.test(lines[i]))p.push(lines[i++]);out.push(`<p>${inline(p.join(' '))}</p>`);}
 return {html:out.join('\n'),toc};}

// ---------- site structure ----------
const GROUPS=[['Start here',['05-user-guide','12-real-world-scenarios','01-executive-summary']],['Concepts',['02-functional-specification','03-architecture','06-compatibility-rules']],['Reference',['04-technical-reference','07-security-and-privacy','08-test-report']],['Project',['09-legal-and-governance','10-operations-and-release','11-roadmap-and-faq']]];
const ORDER=GROUPS.flatMap(g=>g[1]);
const docs=Object.fromEntries(fs.readdirSync(MD).filter(f=>f.endsWith('.md')).map(f=>{const k=f.replace('.md','');const raw=sub(fs.readFileSync(path.join(MD,f),'utf8'));return [k,{k,out:k+'.html',title:raw.match(/^# (.*)/)[1],raw}];}));
for(const k of ORDER)if(!docs[k])throw new Error('missing doc '+k);
const lede=raw=>raw.split('\n').find(l=>l&&!/^(#|\||`|-|>|@@|\d\.)/.test(l))?.replace(/[*`]/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').slice(0,180)??'';
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'assets'),{recursive:true});fs.mkdirSync(path.join(OUT,'samples'));
for(const f of ['site.css','site.js'])fs.copyFileSync(path.join(HERE,'site',f),path.join(OUT,'assets',f));
const themeJs=fs.readFileSync(path.join(HERE,'site/theme.js'),'utf8').replace(/\/\/.*\n/g,'\n');
const NAV=[['index.html','Home'],['05-user-guide.html','Docs'],['12-real-world-scenarios.html','Scenarios'],['samples/index.html','Samples']];
const LD=(title,desc,url)=>`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'SoftwareApplication',name:'ContractSutra AI',applicationCategory:'DeveloperApplication',operatingSystem:'Windows, macOS, Linux (Node.js 22+)',softwareVersion:V.VERSION,license:'https://www.apache.org/licenses/LICENSE-2.0',url:SITE,codeRepository:REPO,author:{'@type':'Person',name:'Vatsal Shah',url:'https://github.com/shahvatsalofficial'},offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},description:'Local-first OpenAPI breaking-change detector with independent audit reports.'},{'@type':'TechArticle',headline:title,description:desc,url,author:{'@type':'Person',name:'Vatsal Shah'},dateModified:V.DATE}]})}</script>`;
function shell({file,title,desc,body,cur,landing=false,toc=[],side=true}){const rel=file.includes('/')?'../':'',url=SITE+(file==='index.html'?'':file);
 const nav=`<header class="nav"><div class="nav-in"><button class="icon-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="side">${icon('menu',20).replace('class="ic"','class="ic i-menu"')}${icon('close',20).replace('class="ic"','class="ic i-close"')}</button><a class="brand" href="${rel}index.html">${logo(30)}<span class="wm">Contract<b>Sutra</b> AI</span><small>v${V.VERSION}</small></a><nav class="nav-links" aria-label="Primary">${NAV.map(([h,t])=>`<a href="${rel}${h}"${cur===h||(cur&&cur!=='index.html'&&h==='05-user-guide.html'&&!['12-real-world-scenarios.html','samples/index.html'].includes(cur))?' aria-current="page"':''}>${t}</a>`).join('')}</nav><span class="sp"></span><a class="icon-btn" href="${REPO}" rel="noopener" aria-label="GitHub repository">${icon('github',20)}</a><button class="icon-btn" id="theme-btn" aria-label="Switch to dark theme" aria-pressed="false">${icon('moon',20).replace('class="ic"','class="ic i-moon"')}${icon('sun',20).replace('class="ic"','class="ic i-sun"')}</button></div></header><div class="scrim"></div>`;
 const sidebar=`<aside class="side" id="side" aria-label="Documentation"><div class="side-top">${NAV.map(([h,t])=>`<a href="${rel}${h}">${t}</a>`).join('')}</div>${GROUPS.map(([g,ks])=>`<h4>${g}</h4>${ks.map(k=>`<a href="${rel}${docs[k].out}"${cur===docs[k].out?' aria-current="page"':''}>${esc(docs[k].title)}</a>`).join('')}`).join('')}<h4>Evidence</h4><a href="${rel}samples/index.html"${cur==='samples/index.html'?' aria-current="page"':''}>Sample reports</a><a href="${rel}llms.txt">llms.txt</a></aside>`;
 const foot=`<footer class="site"><div class="container"><div class="foot"><div><a class="brand" href="${rel}index.html">${logo(28)}<span class="wm">Contract<b>Sutra</b> AI</span></a><p>Offline OpenAPI breaking-change detection with sealed, independently replayable evidence.</p></div><div><h5>Learn</h5><a href="${rel}05-user-guide.html">User guide</a><a href="${rel}12-real-world-scenarios.html">Real-world scenarios</a><a href="${rel}06-compatibility-rules.html">Compatibility rules</a><a href="${rel}11-roadmap-and-faq.html">FAQ</a></div><div><h5>Trust</h5><a href="${rel}08-test-report.html">Test report</a><a href="${rel}07-security-and-privacy.html">Security</a><a href="${rel}09-legal-and-governance.html">Legal</a><a href="${rel}samples/index.html">Sample reports</a></div><div><h5>Project</h5><a href="${REPO}" rel="noopener">GitHub</a><a href="https://www.npmjs.com/package/contractsutra-ai" rel="noopener">npm</a><a href="${REPO}/releases" rel="noopener">Releases</a><a href="${REPO}/issues" rel="noopener">Issues</a></div></div><p class="legal">Apache-2.0 &middot; Created by Vatsal Shah &middot; Static analysis only: not proof of runtime compatibility, not legal advice, not a certification. Built ${V.DATE} from ${V.TESTS} passing tests.</p></div></footer>`;
 const tocHtml=toc.length?`<nav class="toc-r" aria-label="On this page"><strong>On this page</strong>${toc.map(([id,t])=>`<a href="#${id}">${esc(t)}</a>`).join('')}</nav>`:'<div></div>';
 const main=landing?`<main id="main">${body}</main>`:`<div class="doc">${sidebar}<main class="prose" id="main">${body}</main>${tocHtml}</div>`;
 return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}${title.includes('ContractSutra')?'':' | ContractSutra AI'}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#ffffff"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary"><meta name="author" content="Vatsal Shah"><meta name="keywords" content="OpenAPI, breaking changes, API compatibility, openapi diff, SARIF, CI gate, audit report, consumer impact"><script>${themeJs}</script><link rel="icon" type="image/svg+xml" href="${FAVICON}"><link rel="stylesheet" href="${rel}assets/site.css">${LD(title,desc,url)}</head><body${landing?' class="landing"':''}><a class="skip" href="#main">Skip to content</a>${nav}${landing?`<div class="doc">${sidebar}</div>`:''}${main}${landing?'':'<div class="page-foot">Static analysis only: not proof of runtime compatibility, not legal advice, not a certification.</div>'}${foot}<script src="${rel}assets/site.js" defer></script></body></html>`;}

// doc pages
ORDER.forEach((k,i)=>{const d=docs[k],{html,toc}=render(d.raw),prev=docs[ORDER[i-1]],next=docs[ORDER[i+1]];
 const grp=GROUPS.find(g=>g[1].includes(k))[0];
 const body=`<div class="crumbs"><a href="index.html">Home</a> / ${esc(grp)}</div>${html}<div class="pager">${prev?`<a href="${prev.out}"><small>Previous</small>${esc(prev.title)}</a>`:'<span></span>'}${next?`<a class="nx" href="${next.out}"><small>Next</small>${esc(next.title)}</a>`:'<span></span>'}</div><div class="edit"><a href="${REPO}/edit/main/documents/md/${k}.md" rel="noopener">Edit this page on GitHub</a><a href="${REPO}/issues/new" rel="noopener">Report a problem</a></div>`;
 fs.writeFileSync(path.join(OUT,d.out),shell({file:d.out,title:d.title,desc:lede(d.raw)||d.title,body,cur:d.out,toc}));});

// landing
const ic=(n,c='')=>`<div class="ico ${c}">${icon(n,24)}</div>`;
const card=(href,n,t,p,c='')=>`<a class="card" href="${href}">${ic(n,c)}<h3>${t}</h3><p>${p}</p><span class="more">Read more ${icon('arrow',16)}</span></a>`;
const heroTerm=terminal(SCN.s1,'bash — real output');
const landing=`<section class="hero"><div class="container hero-in"><div><span class="badge"><b>v${V.VERSION}</b> Apache-2.0 &middot; zero dependencies &middot; fully offline</span><h1>Catch <span class="grad">breaking API changes</span> before your users do.</h1><p class="lead">Compare two OpenAPI specs. Get direction-aware findings with exact JSON pointers, a CI gate, and Markdown/HTML audit reports that anyone can re-verify.</p><div class="cta"><a class="btn primary" href="05-user-guide.html">Get started ${icon('arrow',18)}</a><a class="btn" href="12-real-world-scenarios.html">See real scenarios</a></div><div class="install"><code>npx contractsutra-ai compare --before v1.json --after v2.json</code><button class="copy" type="button" data-copy="npx contractsutra-ai compare --before v1.json --after v2.json" aria-label="Copy command">${icon('copy',16)}<span class="lbl">Copy</span></button></div></div><div class="hero-term">${heroTerm}</div></div></section>`
+`<section class="container" style="margin-top:-6px"><div class="stats"><div class="stat"><b>${V.PASS}/${V.TESTS}</b><span>tests passing</span></div><div class="stat"><b>${V.GOLD}/${V.GOLDN}</b><span>gold scenarios agree</span></div><div class="stat"><b>${V.FUZZ.toLocaleString('en-US')}</b><span>fuzz cases, ${V.FUZZFAIL} failures</span></div><div class="stat"><b>0</b><span>runtime dependencies</span></div></div></section>`
+`<section class="section"><div class="container"><span class="eyebrow">How it works</span><h2>From two spec files to sealed evidence</h2><p class="sub">One command compares the versions, classifies every change, and writes reports you can hand to a reviewer. A second command re-checks the evidence independently.</p>${DIA.pipeline()}<div class="steps"><div class="step"><h3>Compare</h3><p>Point it at the old and new spec.</p><div class="codewrap"><pre><code>contractsutra compare \\\n  --before v1.json --after v2.json \\\n  --out reports</code></pre></div></div><div class="step"><h3>Gate</h3><p>Exit code 2 stops the pipeline when the gate is crossed.</p><div class="codewrap"><pre><code>--fail-on breaking\n--fail-on risky   # default\n--fail-on none</code></pre></div></div><div class="step"><h3>Audit</h3><p>Replay 12 checks and verify the seal.</p><div class="codewrap"><pre><code>contractsutra audit --dir reports \\\n  --out reports/audit\ncontractsutra verify --report \\\n  reports/audit/audit-report.json</code></pre></div></div></div></div></section>`
+`<section class="section alt"><div class="container"><span class="eyebrow">Why it is different</span><h2>Honest by construction</h2><p class="sub">Most differs tell you what changed. ContractSutra also tells you what it could not decide and what it did not verify.</p><div class="grid g3">${card('06-compatibility-rules.html','diff','Direction-aware rules','The same schema change is breaking in a request and safe in a response, or the reverse. Rules follow that.')}${card('12-real-world-scenarios.html','alert','Fails closed','oneOf, external refs and cycles become "needs review", never a silent pass.','warn')}${card('04-technical-reference.html','chain','Sealed evidence','Every report file is hashed into an audit chain. Edit one byte and the audit fails.','ok')}${card('05-user-guide.html','users','Consumer mapping','Declare who uses which operation. Matches stay labelled unverified; absence stays UNKNOWN.')}${card('05-user-guide.html','flag','SARIF + CI gate','Findings appear as code-scanning alerts with the exact JSON pointer.')}${card('07-security-and-privacy.html','lock','Private by design','No network, no telemetry, no API keys. Specs never leave your machine.','ok')}</div></div></section>`
+`<section class="section"><div class="container"><span class="eyebrow">Understand a change</span><h2>Request and response are judged differently</h2><p class="sub">A provider must keep accepting old requests and keep delivering old responses. That one idea drives every rule.</p>${direction()}</div></section>`
+`<section class="section alt"><div class="container"><span class="eyebrow">Real-world scenarios</span><h2>See it on situations you recognise</h2><p class="sub">Each scenario shows real CLI output generated when this site was built.</p><div class="grid g3">${card('12-real-world-scenarios.html#1-a-pull-request-removes-a-response-field','gate','A PR removes a field','Gate fails with exit code 2; findings point at the exact line.','warn')}${card('12-real-world-scenarios.html#4-the-spec-uses-oneof-and-the-tool-cannot-decide','eye','The tool cannot decide','Unknown semantics are escalated for human review.')}${card('12-real-world-scenarios.html#5-someone-edits-the-report-after-the-fact','shield','A report gets edited','The independent audit catches the change and fails.','ok')}</div><p style="margin-top:22px"><a class="btn" href="12-real-world-scenarios.html">All six scenarios ${icon('arrow',18)}</a></p></div></section>`
+`<section class="section"><div class="container"><span class="eyebrow">Proof</span><h2>Evidence you can reproduce</h2><p class="sub">Run <code>npm run proof</code> to regenerate everything below.</p>${proofBars()}<div class="honest"><h3>${icon('alert',22)} What it does not do</h3><ul><li>It compares <strong>specifications</strong>, not running services. A green gate is not proof of runtime compatibility.</li><li>JSON OpenAPI only for now: no YAML, GraphQL, AsyncAPI or protobuf.</li><li>Consumers are self-declared. Generated test cases are <code>NOT_RUN</code> templates.</li><li>The audit is automated self-verification, not a certification or a signature.</li></ul></div></div></section>`
+`<section class="section alt"><div class="container"><span class="eyebrow">Documentation</span><h2>Everything in one place</h2><div class="grid g4">${ORDER.map(k=>`<a class="card" href="${docs[k].out}"><h3>${esc(docs[k].title)}</h3><p>${esc(lede(docs[k].raw).slice(0,95))}…</p></a>`).join('')}</div></div></section>`
+`<section class="section"><div class="container"><div class="band"><h2>Try it in two minutes</h2><p>Node.js 22+ is all you need. No account, no API key, no network.</p><a class="btn" href="05-user-guide.html">Open the user guide</a></div></div></section>`;
fs.writeFileSync(path.join(OUT,'index.html'),shell({file:'index.html',title:'ContractSutra AI: offline OpenAPI breaking-change detector',desc:'Compare two OpenAPI specs with direction-aware rules, gate CI, and get sealed Markdown, HTML, JSON and SARIF audit evidence. Zero dependencies, fully offline.',body:landing,cur:'index.html',landing:true}));

// samples
const SAMP=path.join(OUT,'samples'),copied=[];
const cp=(src,name)=>{if(fs.existsSync(src)){fs.copyFileSync(src,path.join(SAMP,name));copied.push(name);}};
const demo=path.join(PROJECT,'examples/reports/demo');
for(const f of ['compatibility.md','compatibility.html','contract-diff.json','contract-diff.sarif.json','release-note-draft.md','generated-cases.json','affected-consumers.json','audit.jsonl'])cp(path.join(demo,f),f);
for(const f of ['audit-report.md','audit-report.html','audit-report.json'])cp(path.join(demo,'audit',f),f);
for(const f of ['TEST-RESULTS.md','environment.json','gold-corpus.json','fuzz-results.json','benchmark.json'])cp(path.join(PROJECT,'docs/proof',f),f);
cp(FX('openapi/before.json'),'input-before.json');cp(FX('openapi/after.json'),'input-after.json');
const D={'compatibility.html':['Compatibility report','HTML'],'compatibility.md':['Compatibility report','Markdown'],'audit-report.html':['Independent audit report','HTML'],'audit-report.md':['Independent audit report','Markdown'],'audit-report.json':['Sealed audit report','JSON'],'contract-diff.sarif.json':['SARIF 2.1.0 for GitHub code scanning','SARIF'],'contract-diff.json':['Findings with stable IDs and pointers','JSON'],'release-note-draft.md':['Migration / release-note draft','Markdown'],'generated-cases.json':['Unexecuted test templates (NOT_RUN)','JSON'],'affected-consumers.json':['Declared consumer impact','JSON'],'TEST-RESULTS.md':['Tests, gold corpus, fuzz, benchmark','Markdown'],'environment.json':['Machine-readable run record','JSON'],'gold-corpus.json':['Labelled scenarios and results','JSON'],'fuzz-results.json':['Fuzz summary','JSON'],'benchmark.json':['Timing on synthetic specs','JSON'],'audit.jsonl':['Hash-chained audit log','JSONL'],'input-before.json':['Input: API v1','JSON'],'input-after.json':['Input: API v2','JSON']};
const sbody=`<div class="crumbs"><a href="../index.html">Home</a> / Evidence</div><h1>Sample reports and results</h1><p>Real output generated by ContractSutra AI v${V.VERSION} from the bundled fixtures, plus the proof run. Nothing here is hand-edited. Verify any report folder with <code>contractsutra audit --dir &lt;folder&gt;</code>.</p><div class="grid g2" style="margin-top:20px">${['compatibility.html','audit-report.html'].map(n=>`<a class="card" href="${n}"><span class="chip s">Open in browser</span><h3>${D[n][0]}</h3><p>${n}</p></a>`).join('')}</div><h2>All files</h2><div class="tw"><table><thead><tr><th>File</th><th>What it is</th><th>Format</th></tr></thead><tbody>${copied.map(n=>`<tr><td><a href="${n}">${esc(n)}</a></td><td>${esc(D[n]?.[0]??'')}</td><td><span class="chip">${esc(D[n]?.[1]??'')}</span></td></tr>`).join('')}</tbody></table></div>`;
fs.writeFileSync(path.join(SAMP,'index.html'),shell({file:'samples/index.html',title:'Sample reports and results',desc:'Real generated compatibility, SARIF and audit reports plus test, gold corpus, fuzz and benchmark results.',body:sbody,cur:'samples/index.html'}));
fs.copyFileSync(path.join(PROJECT,'llms.txt'),path.join(OUT,'llms.txt'));fs.writeFileSync(path.join(OUT,'.nojekyll'),'');
const urls=['',...ORDER.map(k=>docs[k].out),'samples/index.html'];
fs.writeFileSync(path.join(OUT,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${SITE}${u}</loc><lastmod>${V.DATE}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
console.log(JSON.stringify({pages:ORDER.length+2,samples:copied.length,out:OUT}));
