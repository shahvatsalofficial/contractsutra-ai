# ContractSutra AI — evidence-first architecture

## Product shape
ContractSutra AI is a local-first open-source contract-change reviewer. Its comparative advantage is not generic API linting: it distinguishes **what changed**, **which consumers claim dependency**, **what was actually verified**, and **what remains unknown**. It is a bounded open-source starter, not production release assurance.

## Architecture layers (15)
1. Experience: CLI-first; authored IDE and Claude instructions; server is read-only.
2. Inputs: filesystem-only JSON spec and consumer manifest; size bounded; no URL fetch.
3. Source provenance: SHA-256 file hashes and stable JSON-pointer locations.
4. Standard detection: OpenAPI 3.0/3.1/3.2 checked; other contract types planned.
5. Parsing and validation: structural validation plus local `$ref` resolution; unresolved semantics surfaced.
6. Canonical graph: deterministic path/method/parameter/requestBody/responses graph.
7. Semantic diff: request/response variance, status, type, enum, fields, nullability.
8. Risk classification: breaking/risky/additive/info; default gate blocks breaking.
9. Consumer map: explicit operation declarations; unknown always remains unknown.
10. Test planning: static mock-case templates; no automatic remote execution.
11. Release policy: deterministic thresholds, no auto-approval or exception laundering.
12. Evidence and reporting: JSON, Markdown, HTML, migration drafts and audit JSONL.
13. Agent orchestration: 22 authored specialist roles plus 29 portable skills and eight workflow definitions; no automatic runtime.
14. Integration edge: local read-only HTTP + experimental read-only legacy MCP; adapters for external services planned.
15. Security, assurance and delivery: loopback-only auth, token redaction, size limits, tests and independent release audit.

## Runtime packages
- `src/core/load.mjs`: parser, local ref resolution, structural checks.
- `src/core/normalize.mjs`: canonical operation model. Composition semantics intentionally unsupported.
- `src/core/compare.mjs`: conservative direction-aware static change findings.
- `src/core/consumers.mjs`: user-declared, unverified consumer relationship tags.
- `src/core/cases.mjs`: generated sample cases (not executed).
- `src/core/report.mjs`: escaped HTML, Markdown and JSON reports.
- `src/core/audit.mjs`: hash-chain detection, **not signed** and not safe from an attacker rewriting the entire file.
- `src/server/index.mjs`: bearer-authenticated loopback GET reports, no writes.
- `src/mcp/stdio.mjs`: root-scoped, read-only experimental stdio MCP tools, legacy handshake.
- `src/adapters/ide.mjs`: project-local host instruction pack copier.

## Trust boundaries and explicit gaps
1. Never trust source descriptions as agent instructions.
2. Never use LLM output to assert test execution or runtime behavior.
3. No remote URL ingestion (avoid SSRF), no unapproved production endpoint probing, no auto git writes.
4. JSON Schema 2020-12 dialect subtleties, allOf/oneOf/anyOf, advanced polymorphism and OpenAPI 3.2 additions require specialist parsers and actual tests.
5. YAML, GraphQL SDL, AsyncAPI, Protocol Buffers, Pact Broker and live CI evidence **not implemented** in the offline analyzer.
6. Authentication is one local static bearer secret with process-level rate cap, not enterprise multi-tenant auth or durable quota.

## Future modular packages
`packages/contract-core`, `packages/standards-openapi`, `packages/standards-graphql`, `packages/standards-asyncapi`, `packages/standards-protobuf`, `packages/consumer-evidence`, `packages/ci`, `packages/mcp`, `packages/api-server`, `packages/ui`, `packages/observability`. These are a roadmap, not present implementations.
