# ADR-0001 — Local-first deterministic contracts

Decision: ship a dependency-free Node.js 22 executable rather than requiring credentials, a server or installing third-party tooling during bootstrap.

Rationale: versioned contract diffs need reproducible evidence. Bounded JSON, explicit unknowns and a local-only CLI are safer than silently fetching `$ref` or testing unknown endpoints.

Consequences: YAML, complex JSON Schema, multi-protocol and enterprise workflows are roadmap items; confidence must never exceed parser coverage.
