# ContractSutra AI — Independent Audit Report

**Verdict: PASS** · 12/12 checks passed · assurance level `LOCAL_STARTER_VERIFIED`

Seal (SHA-256 of body): `6f37599111775fe2b0388d84998ec8fdf826fd0f9a5d310a2af08478b1c4eeba`

| Check | Result | Title | Detail |
| --- | --- | --- | --- |
| AUD-01 | PASS | All report files present | 7 report files and audit.jsonl found |
| AUD-02 | PASS | contract-diff.json parses | Parsed |
| AUD-03 | PASS | Audit hash chain intact | 2 event(s), head 1ed3e7988f39 |
| AUD-04 | PASS | Report bytes match hashes sealed in the audit log | 7 files verified |
| AUD-05 | PASS | Input spec hashes match audit event | before 0c5d70b0865a after 539d74151a03 |
| AUD-06 | PASS | Severity counts recompute | {"breaking":2,"risky":0,"additive":2,"info":1} |
| AUD-07 | PASS | Finding IDs recompute from content | 5 ID(s) verified |
| AUD-08 | PASS | No claim inflation (no finding claims verified consumer impact) | All findings static-only |
| AUD-09 | PASS | Disclaimer present | JSON and Markdown carry the static-analysis disclaimer |
| AUD-10 | PASS | Markdown and HTML list every finding | md missing 0, html missing 0 |
| AUD-11 | PASS | Generated cases are all NOT_RUN | 2 case(s), 0 claim execution |
| AUD-12 | PASS | HTML report is inert (CSP, no scripts) | CSP meta present, zero script tags |

## Limits of this audit

- Hash chain proves tamper-evidence, not authorship; it is not a signature.
- Static spec comparison only: no consumer traffic, Pact verification or runtime test was executed.
- Unsupported OpenAPI constructs are reported as UNRESOLVED_SEMANTICS, not as compatible.
- This audit is automated self-verification, not an independent human audit or certification.
