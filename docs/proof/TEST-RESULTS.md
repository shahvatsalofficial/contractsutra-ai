# ContractSutra AI — Test results and proof

Generated 2026-11-22T19:08:21.946Z · v0.2.0 · Node v24.15.0 · win32 x64

## Test suite

| Tests | Passed | Failed | Skipped |
| ---: | ---: | ---: | ---: |
| 123 | 123 | 0 | 0 |

## Gold corpus (20/20 cases agree)

Precision 1.000 · Recall 1.000 · FP 0 · FN 0

> Author-labelled synthetic corpus: it measures agreement with the author's own rules, not accuracy on real-world APIs.

| Case | Expected | Observed | Result |
| --- | --- | --- | --- |
| remove operation | OPERATION_REMOVED / breaking | OPERATION_REMOVED/breaking | PASS |
| add operation | OPERATION_ADDED / additive | OPERATION_ADDED/additive | PASS |
| add required query param | PARAMETER_ADDED / breaking | PARAMETER_ADDED/breaking | PASS |
| add optional query param | PARAMETER_ADDED / additive | PARAMETER_ADDED/additive | PASS |
| request field becomes required | FIELD_REQUIRED_CHANGED / breaking | FIELD_REQUIRED_CHANGED/breaking | PASS |
| response field removed | FIELD_REMOVED / breaking | FIELD_REMOVED/breaking | PASS |
| response optional field added | FIELD_ADDED / additive | FIELD_ADDED/additive | PASS |
| request optional field added | FIELD_ADDED / info | FIELD_ADDED/info | PASS |
| request required field added | FIELD_ADDED / breaking | FIELD_ADDED/breaking | PASS |
| response type changed | TYPE_CHANGED / breaking | TYPE_CHANGED/breaking | PASS |
| response status removed | RESPONSE_STATUS_REMOVED / breaking | RESPONSE_STATUS_REMOVED/breaking | PASS |
| response status added | RESPONSE_STATUS_ADDED / additive | RESPONSE_STATUS_ADDED/additive | PASS |
| request media type removed | MEDIA_REMOVED / breaking | MEDIA_REMOVED/breaking, MEDIA_ADDED/additive | PASS |
| request maxLength tightened | CONSTRAINT_TIGHTENED / breaking | CONSTRAINT_TIGHTENED/breaking | PASS |
| response enum expanded | FIELD_ADDED / additive | FIELD_ADDED/additive | PASS |
| composition introduced (unknown) | UNRESOLVED_SEMANTICS / risky | SCHEMA_UNKNOWN/risky, UNRESOLVED_SEMANTICS/risky | PASS |
| external $ref (unknown) | UNRESOLVED_SEMANTICS / risky | SCHEMA_UNKNOWN/risky, UNRESOLVED_SEMANTICS/risky | PASS |
| request body becomes required | REQUEST_BODY_NOW_REQUIRED / breaking | REQUEST_BODY_NOW_REQUIRED/breaking | PASS |
| description-only change | no findings | none | PASS |
| no change | no findings | none | PASS |

## Deterministic fuzz (2000 mutated spec pairs, seed 0xC0FFEE (LCG))

- Unhandled exceptions: 0
- Non-deterministic diffs: 0
- Report render failures: 0
- Self-diff produced unexpected findings: 0

## Benchmark

| Operations | Spec bytes | Findings | ms |
| ---: | ---: | ---: | ---: |
| 100 | 25654 | 1 | 7 |
| 500 | 128454 | 1 | 38 |
| 1000 | 256954 | 1 | 87 |

## Not proven

- Behaviour on real production specs, YAML, GraphQL, AsyncAPI, protobuf.
- Any live consumer or Pact verification.
- Independent third-party security audit.
