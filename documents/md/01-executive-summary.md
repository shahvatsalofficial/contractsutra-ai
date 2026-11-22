# Executive summary

**ContractSutra AI v{{VERSION}}** tells engineering teams whether a change to an OpenAPI document can break the clients that call it, and produces evidence a reviewer can check without trusting the tool.

## The problem
APIs break clients quietly: a response field disappears, a request field becomes required, an enum shrinks. Reviewers read diffs of 2,000-line JSON files and miss it. Existing differs either hide uncertainty or need a server and a network.

## What it does
- Compares two OpenAPI 3.0 / 3.1 / 3.2 JSON files and classifies each change as **breaking**, **needs review**, **additive** or **informational**, using rules that depend on *direction* (request vs response).
- Maps findings to **declared consumers** and says `UNKNOWN` when it does not know.
- Fails a CI pipeline with **exit code 2** when the chosen gate (`breaking` or `risky`) is crossed.
- Writes the evidence as **Markdown, HTML, JSON and SARIF** and seals it in a **hash-chained audit log**.
- Runs an **independent replay audit** (12 checks) that recomputes counts, IDs and hashes and fails if any report was edited after generation.

## Why you can trust it
| Evidence | Result |
| --- | --- |
| Automated tests | **{{PASS}} of {{TESTS}} passed**, {{FAIL}} failed |
| Gold corpus (labelled change scenarios) | **{{GOLD}}/{{GOLDN}}** agree |
| Deterministic fuzz | **{{FUZZ}}** mutated spec pairs, **{{FUZZFAIL}}** failures |
| Tamper tests | Edited report, forged ID, forged counts and altered log are all caught |
| Runtime dependencies | **0** (Node.js built-ins only) |
| Network access | **None** (no telemetry, no API keys) |

Measured on Node {{NODE}}, {{PLATFORM}}, recorded {{DATE}}. Reproduce with `npm run proof`.

## What it deliberately does not claim
It analyses **specifications**, not live services. A passing gate is not proof of runtime compatibility. YAML, GraphQL, AsyncAPI and protobuf are not yet supported. Consumer mapping is self-declared. The audit is automated self-verification, not an independent human audit or a certification.

## Who it is for
Backend platform teams, API owners, release managers, security and compliance reviewers (as an evidence source), and AI coding assistants (via 22 agent roles and 29 skills).

## Decision summary
Adopt it as a **pre-merge gate and evidence generator**. Keep consumer-driven contract tests (for example Pact) and runtime tests for anything that must be *proven*, not merely *flagged*.
