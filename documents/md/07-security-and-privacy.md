# Security and privacy

## Privacy
- **No telemetry, no network calls, no API keys.** The analyzer reads the files you point it at and writes the report directory you choose.
- Spec files can describe internal systems. Keep them local. Never put credentials or customer data in fixtures.
- Reports contain pointers, field names and SHA-256 hashes of inputs, not the input bodies.

## Threat model (summary)
| Threat | Control | Evidence |
| --- | --- | --- |
| Oversized or deeply nested input (DoS) | 4 MiB file cap, `$ref` depth 40, schema nesting 6 | unit tests, fuzz |
| Cyclic or remote `$ref` | Local-only resolution, cycle detection, remote refs reported as unresolved | tests, fuzz |
| Prototype pollution via `__proto__` keys | Own-property checks (`Object.hasOwn`), no deep-merge of input | fuzz (`__proto__` payloads) |
| HTML/script injection through spec text | Escaping everywhere, CSP `default-src 'none'`, zero script tags (AUD-12) | HTML escape tests |
| Report tampering | SHA-256 chain plus per-file hashes; independent audit | `tests/assure.test.mjs` |
| Path traversal / symlink escape (server, MCP, IDE copier) | `realpath` containment, symlink rejection | server/MCP tests (self-skip on Windows hosts without symlink rights) |
| Unauthorized HTTP access | Loopback bind, bearer token 32+ chars, constant-time compare, read-only, rate limit | server tests |
| Over-claiming | `NOT_RUN`, `USER_DECLARED_UNVERIFIED`, `UNKNOWN`, AUD-08, AUD-11 | audit tests |

## What the hash chain is and is not
It makes after-the-fact edits **detectable**. It does not prove who produced the files, and an attacker who can rewrite the whole directory consistently can recompute it. For stronger guarantees, sign release artifacts and store audit output in write-once storage.

## Supply chain
No runtime dependencies. GitHub Actions are pinned to major versions; npm releases use trusted publishing (OIDC) with provenance, so no long-lived npm token is stored.

## Reporting a vulnerability
Use GitHub private vulnerability reporting on the repository (Security tab), or see `SECURITY.md`. Please include a minimal synthetic reproduction.

## Limits
Not penetration-tested by a third party. No security certification is claimed. See [Legal and governance](09-legal-and-governance.html).
