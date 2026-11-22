# Optional integration architecture

Each future integration implements `detectCapabilities()`, `getScopedEvidence()`, `normalizeFindings()` and `reportPermissions()` without hardcoding provider sessions. Provider I/O must use an approved adapter, bounded timeout, least-privilege credentials and explicit safe operation scope.

- Spectral: secondary linting, not a substitute for semantic diff.
- Pact: broker verification evidence must include consumer/provider versions, environment and verification status; never transform an absent Pact result into PASS.
- Schemathesis: run against a mock server unless the owner explicitly authorizes target, method, rate and duration.
- Buf: require actual `.proto` files and pinned descriptor compilation before field-wire assertions.
- GraphQL/AsyncAPI: require real version-aware parsers; no JSON OpenAPI normalization shortcuts.
