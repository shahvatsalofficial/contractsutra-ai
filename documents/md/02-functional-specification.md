# Functional specification

## Capabilities (acceptance view)
| ID | Capability | Status | Evidence |
| --- | --- | --- | --- |
| F01 | Parse and validate JSON OpenAPI 3.0-3.2 with exact JSON-pointer locations | Implemented (subset) | validation tests in `tests/core.test.mjs` |
| F02 | Semantic, direction-aware diff | Implemented (subset) | gold corpus {{GOLD}}/{{GOLDN}}, unit tests |
| F03 | Consumer mapping | **Partial**: self-declared only | consumer tests; Pact not integrated |
| F04 | Test-case generation | **Partial**: templates, all `NOT_RUN` | audit check AUD-11 |
| F05 | CI gate | Implemented | exit-code tests, CI workflow |
| F06 | Migration / release-note draft | Implemented (draft; owner must approve) | `release-note-draft.md` |
| F07 | Independent audit report (MD / HTML / JSON) | Implemented | `tests/assure.test.mjs` |
| F08 | SARIF 2.1.0 export | Implemented | SARIF test |

## Inputs
- `--before` / `--after`: JSON OpenAPI files, at most 4 MiB each.
- `--consumers`: optional JSON `{"consumers":[{"name":"...","operations":["POST /invitations"]}]}`, at most 250 consumers.

## Outputs
`compare --out dir` writes `contract-diff.json`, `contract-diff.sarif.json`, `compatibility.md`, `compatibility.html`, `release-note-draft.md`, `generated-cases.json`, `affected-consumers.json` and `audit.jsonl`.

`audit --out dir` writes `audit-report.json`, `audit-report.md` and `audit-report.html`.

## Severity vocabulary
- **breaking**: an old valid request is rejected, or an old guaranteed response is no longer delivered.
- **risky / needs review**: cannot be decided statically, or may affect strict clients.
- **additive**: new capability that old clients can ignore.
- **info**: noted, low risk.

## Exit codes
`0` success, `2` gate failed, `3` invalid input, `4` internal error or failed audit.

## Non-functional requirements
Offline. Deterministic (same inputs give byte-identical findings). Bounded input size and nesting. Atomic file writes. No network.

## Out of scope today
YAML, GraphQL SDL, AsyncAPI, protobuf, live endpoint probing, real Pact verification, executing generated cases, multi-tenant server, signed attestations.
