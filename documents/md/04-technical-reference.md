# Technical reference

## CLI
```text
contractsutra validate --spec <openapi.json>
contractsutra compare  --before <a.json> --after <b.json> [--consumers c.json] [--out dir] [--fail-on breaking|risky|none]
contractsutra cases    --spec <openapi.json> [--out cases.json]
contractsutra audit    [--dir reports] [--out audit-out]
contractsutra audit    --file reports/audit.jsonl
contractsutra verify   --report audit-out/audit-report.json
contractsutra install-ide --host <claude|cursor|codex|gemini|copilot|windsurf|cline|roo|continue> --target <project>
contractsutra serve    [--dir reports] [--port 8765]     # env CONTRACTSUTRA_TOKEN, 32+ chars
contractsutra mcp      --root <project-dir>
contractsutra doctor | version
```
Options are strict: unknown or duplicate options and missing values exit `3`.

## Finding codes
| Code | Meaning |
| --- | --- |
| `OPERATION_REMOVED` / `OPERATION_ADDED` | Method + path disappeared / appeared |
| `PARAMETER_ADDED` / `PARAMETER_REMOVED` / `PARAMETER_NOW_REQUIRED` / `PARAMETER_NOW_OPTIONAL` | Parameter changes keyed by `in:name` |
| `REQUEST_BODY_NOW_REQUIRED` / `REQUEST_BODY_NOW_OPTIONAL` | Body requiredness |
| `MEDIA_REMOVED` / `MEDIA_ADDED` | Content types |
| `RESPONSE_STATUS_REMOVED` / `RESPONSE_STATUS_ADDED` | Documented statuses |
| `FIELD_ADDED` / `FIELD_REMOVED` / `FIELD_REQUIRED_CHANGED` | Object properties |
| `TYPE_CHANGED` / `NULLABILITY_CHANGED` / `FORMAT_CHANGED` | Primitive shape |
| `ENUM_VALUES_ADDED` / `ENUM_VALUES_REMOVED` / `ENUM_DECLARATION_CHANGED` | Enumerations |
| `CONSTRAINT_TIGHTENED` / `CONSTRAINT_RELAXED` / `CONSTRAINT_CHANGED` | Bounds, pattern, uniqueItems, additionalProperties:false |
| `ARRAY_ITEMS_CHANGED` | Item schema presence |
| `SCHEMA_UNKNOWN` / `UNRESOLVED_SEMANTICS` / `NESTED_SCHEMA_LIMIT` | The tool could not decide: review manually |

## Audit checks
| ID | Check |
| --- | --- |
| AUD-01 | All report files present |
| AUD-02 | `contract-diff.json` parses |
| AUD-03 | Audit hash chain intact |
| AUD-04 | Report bytes match hashes sealed in the audit log |
| AUD-05 | Input spec hashes match the audit event |
| AUD-06 | Severity counts recompute |
| AUD-07 | Finding IDs recompute from content |
| AUD-08 | No claim inflation (no finding claims verified consumer impact) |
| AUD-09 | Disclaimer present |
| AUD-10 | Markdown and HTML list every finding |
| AUD-11 | Generated cases are all `NOT_RUN` |
| AUD-12 | HTML report is inert (CSP, zero script tags) |

`audit-report.json` carries `seal = SHA-256(JSON of the body)`. `verify` recomputes it.

## Audit log format (`audit.jsonl`)
One JSON object per line: `{v, type, at, prevHash, metadata, hash}` where `hash = SHA-256(JSON of the event without hash)` and the first `prevHash` is `GENESIS`. `compare` events record `reportHashes` for every generated file.

## HTTP API (loopback only)
`GET /v1/health`, `/v1/report`, `/v1/consumers`, `/v1/cases` with `Authorization: Bearer <token>`. Other methods return 405; 100 requests per minute per client; files larger than 2 MiB or resolving outside the report directory are refused.

## MCP tools (experimental)
`contractsutra_compare` and `contractsutra_cases`, both read-only, paths confined to `--root`. Only protocol `2025-11-25` is accepted.

## Limits
| Limit | Value |
| --- | --- |
| Spec file size | 4 MiB |
| Consumer manifest | 512 KiB, 250 consumers, 200 operations each |
| `$ref` chain depth | 40 |
| Schema nesting | 6 levels, then `unknown` |
| Generated example depth | 5 |

## Programmatic use
```js
import {runCompare} from 'contractsutra-ai/src/core/run.mjs';
const {report, exitCode} = await runCompare({before:'v1.json', after:'v2.json', out:'reports', gate:'breaking'});
```
