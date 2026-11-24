# Architecture

@@diagram:pipeline@@

```text
 before.json --+                                     +--> contract-diff.json / .sarif.json
 after.json  --+--> load --> normalize --> compare --+--> compatibility.md / .html
 consumers   --+   (bounded,  (resolve $ref,  (rules, +--> release-note-draft.md
                    validate)  summarize)     stable  +--> generated-cases.json (NOT_RUN)
                                              IDs)    +--> audit.jsonl (hash chain + report hashes)
                                                              |
              audit --dir  <----------------------------------+   recompute everything
                  `--> audit-report.json / .md / .html  (sealed with SHA-256)
```

## Modules (`src/`)

@@html:layers@@
| Module | Responsibility |
| --- | --- |
| `core/utils.mjs` | SHA-256, JSON-pointer escaping, HTML escaping, bounded file reads, atomic writes |
| `core/load.mjs` | JSON parse (BOM tolerant), structural validation, local `$ref` resolution, cycle and depth guard |
| `core/normalize.mjs` | Reduces a spec to operations, parameters, request body, responses and schema summaries; records every unresolved fragment |
| `core/compare.mjs` | Direction-aware rules; finding ID = `CS-` + first 12 hex of SHA-256(code, pointer, description) |
| `core/consumers.mjs` | Loads the manifest, maps operations, labels `USER_DECLARED_UNVERIFIED` |
| `core/cases.mjs` | Deterministic positive and negative sample templates, `NOT_RUN` |
| `core/report.mjs` | Markdown, HTML (CSP, no scripts), SARIF, migration plan |
| `core/audit.mjs` | Append-only SHA-256 hash chain (`prevHash`, `hash`) |
| `core/assure.mjs` | Independent replay audit AUD-01..AUD-12 and report seal |
| `core/run.mjs` | One orchestration path shared by CLI, demo and tests |
| `cli/main.mjs` | Strict flag parsing and exit codes |
| `server/index.mjs` | Read-only loopback HTTP, bearer token of 32+ chars, rate limit, realpath containment |
| `mcp/stdio.mjs` | Experimental read-only MCP (protocol `2025-11-25`), root-contained paths |
| `adapters/ide.mjs` | Project-local copy of instruction packs; rejects symlinks |

## Design decisions
1. **Local-first / offline**: specs are sensitive, so nothing leaves the machine.
2. **Fail closed**: unknown semantics produce a *needs review* finding, never silence.
3. **Direction matters**: the same schema change is breaking in a request and safe in a response, or the reverse.
4. **Evidence over assertion**: every report names its input hashes; the audit recomputes rather than trusts.
5. **Zero dependencies**: no runtime supply-chain surface.

## Trust boundaries
Input files are untrusted: bounded size and depth, no remote `$ref`. Reports are rendered with escaping and a restrictive CSP. The HTTP and MCP servers confine reads to a root via `realpath`.

## Data model: a finding
```json
{
  "id": "CS-1A2B3C4D5E6F",
  "kind": "breaking",
  "code": "FIELD_REMOVED",
  "pointer": "#/paths/~1invitations/post/responses/201/content/application~1json/schema/properties/role",
  "description": "Schema field removed: role",
  "direction": "response",
  "evidence": "static-contract-diff",
  "verification": "OBSERVED_IN_SPEC",
  "consumerImpact": "UNKNOWN",
  "affectedConsumers": []
}
```
