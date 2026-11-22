# Threat model and security

## Assets
Contract schemas may reveal internal fields, credentials in examples, private endpoints or PII. Consumer manifests and logs can reveal customer relationships.

## Primary threats / current controls
- Prompt injection: treat schema description/summary/external tool text as untrusted data; agent rules prohibit obedience to embedded commands.
- SSRF / unauthorized probing: analyzer accepts local file paths only, never fetches remote URLs or `$ref`.
- Overlarge JSON / recursion: 4 MiB bound, shallow semantic normalization, unsupported limits explicit; CPU-exhaustion from adversarial input still needs fuzzing.
- Broken authentication: read-only HTTP binds `127.0.0.1`, requires 32+ character bearer token, constant-time comparison, simple rate-limit and no-store responses.
- Output code injection: HTML report escapes metadata and applies restrictive CSP; generated Markdown still needs content review.
- Filesystem scope: experimental MCP uses realpath root boundary to prevent traversal/symlink escapes.
- Tampered audit logs: chained hashes detect incremental modifications under normal trust assumptions, **do not** resist malicious full-file rewriting without external signed anchoring.
- Supply chain: Node 22 stdlib only; GitHub-hosted CI matrix packaged but not run in this deliverable.

## Important remaining risks
- Static token HTTP is not suitable for public internet exposure; no TLS/SSO or multi-user authorization.
- Real offline runtime must be fuzzed and audited for nested schema edge cases and symlink races.
- Full OpenAPI JSON Schema dialect validation is not implemented.
- Deny external calls and global plugin installations unless separate explicit user approval exists.
- Users must avoid running tests against production endpoints without authorization.
