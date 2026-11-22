# Integrations and plugins

No external SaaS connectors are pre-authorized or installed. All integrations are optional and require user consent, pinned versions, token scoping and independent verification.

- **Spectral** — API lint. **PLANNED**. Lint adapter, pinned ruleset, offline rules.
- **Pact Broker** — Consumer-driven verification. **NOT_CONNECTED**. Read-only can-i-deploy evidence, explicit environment/version mapping.
- **Schemathesis** — Property-based API tests. **NOT_CONNECTED**. Mock or approved test endpoint only; no default fuzzing.
- **Buf** — Protobuf compatibility. **NOT_CONNECTED**. Descriptor-aware breaking check from pinned toolchain.
- **GraphQL Inspector** — GraphQL schema changes. **NOT_CONNECTED**. SDL schema diff and usage-aware impact.
- **AsyncAPI Parser** — Event schemas. **NOT_CONNECTED**. Versioned 3.1 message/channel semantics.
- **OpenAPI diff libraries** — Supplemental diff. **EVALUATE**. Feature parity and license assessment.
- **GitHub Actions** — CI report publishing. **TEMPLATE_ONLY**. Three-OS workflow packaged; not run on GitHub.
- **GitLab CI** — CI integration. **PLANNED**. CI adapter after evidence-based test.
- **Jira** — Ticket context. **NOT_CONNECTED**. Read-only scoped issue link.
- **ClickUp** — Work management. **NOT_CONNECTED**. Read-only scoped task link.
- **OpenTelemetry** — Telemetry. **PLANNED**. Opt-in privacy-preserving instrumentation.
- **MCP stdio** — Read-only local MCP. **EXPERIMENTAL_LOCAL**. Two locally testable tools; legacy 2025-11-25; host unverified.
- **HTTP report server** — Read-only loopback HTTP. **IMPLEMENTED_LOCAL**. Token-gated loopback GET-only; not production SSO.
- **Local CLI** — Deterministic offline core. **IMPLEMENTED_LOCAL**. Local JSON OpenAPI 3.x limited parser and semantic diff.

Do not claim the presence of an integration merely because a JSON descriptor or agent prompt mentions it.
