# What is and is not verified

**Implemented and locally testable:** bounded JSON OpenAPI 3.x structural parsing; local `$ref` review; selected request/response semantic rules; stable JSON-pointer findings; user-declared consumer matches (self-attested only); deterministic unexecuted sample cases; CI-style exit gate; reports; local hash-chained audit; local report HTTP service; experimental MCP read tools; project-local IDE pack installation.

**Do not claim implemented:** full OpenAPI 3.2 conformance; YAML parsing; comprehensive JSON Schema 2020-12; `allOf/oneOf/anyOf` semantics; GraphQL SDL semantic diff; AsyncAPI 3.1 channel diff; protobuf/Buf; actual Pact provider verification; authorized Schemathesis invocation; real live endpoint probing; active native skills in all IDEs; GitHub release; hosted CI; independent third-party security audit; scalable multi-tenant service.

An authored agent, skill, workflow, plugin descriptor or IDE pack is an **artifact**, not verified autonomous execution. An offline green CI gate describes only the supported static rules. The independently audited release decision belongs to humans with complete consumer evidence.
