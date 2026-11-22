# Practical release roadmap

## M0 — locally verified starter (this repo)
JSON OpenAPI 3.x structural subset, selected semantic diff, consumer declaration imports, mock-case templates, six report artifacts, CLI CI gate, audit chain, loopback read-only API, experimental MCP and authored host packs. No paid keys required.

## M1 — full contract semantic correctness
Standards-compliant YAML/JSON parsers; OpenAPI 3.0, 3.1 and 3.2 dialect-aware schema handling; safe local `$ref` graph; `allOf`, `oneOf`, `anyOf` and discriminators; request/response JSON Schema compatibility semantics, richer enum/constraint rules, property access modes, auth/security changes.

## M2 — actual consumer evidence
Pact Broker read-only import with verified version/environment correlation; consumer assumption registry, signed provenance, source-controlled acceptance; semantics for consumer behavior unknown.

## M3 — other protocols
GraphQL Inspector with schema evolution, usage evidence; AsyncAPI 3.1 messages/channels; Buf/protobuf breaking checks; webhooks and event schema registries.

## M4 — safe test execution
Mock runner, pinned property-based testing, opt-in target-scoped test endpoints, isolation/timeouts, test artifact store, policy exemptions and audit trails.

## M5 — product-level service and IDEs
Official MCP 2026 protocol, hosted API with OIDC/SSO, tenant isolation, workspaces, RBAC, retention controls, UI dashboard, evidence graph and verified native host adapters.

## M6 — public beta and release
Cross-OS CI actual run results, schema semantic fixture corpus, fuzzing, secure code review, versioned docs, transparent licensing and real end-to-end consumer rollout study; public GitHub/npm publishing only on owner approval.
