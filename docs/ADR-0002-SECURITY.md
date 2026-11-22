# ADR-0002 — Read-only and explicit consent

Decision: local CLI reads chosen specs and writes only explicit output paths; server is loopback read-only, MCP is root-scoped read-only; plugin metadata does not install tooling.

Rejected alternatives: automatic code changes, global skill installation, remote fuzzing by default, IDE session-token forwarding, assuming missing Pact evidence is passing.

Exceptions require named operator, time, artifact, scope, approver, expiry and independent review.
