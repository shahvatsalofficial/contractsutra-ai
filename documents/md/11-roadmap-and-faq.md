# Roadmap and FAQ

## Roadmap (planned, not promised)
| Phase | Goal | Status |
| --- | --- | --- |
| Now (0.2) | JSON OpenAPI subset, direction-aware rules, MD/HTML/SARIF, independent audit | Done |
| Next | YAML input, `allOf`/`oneOf`/`anyOf` semantics, `readOnly`/`writeOnly`, headers and security schemes | Planned |
| Then | Pact Broker read-only evidence import, local mock runner that actually executes generated cases | Planned |
| Later | GraphQL SDL, AsyncAPI 3.x, protobuf/Buf adapters; MCP for the 2026 protocol; signed attestations | Planned |

## FAQ
**Is this an OpenAPI linter?** No. It compares two versions and reports compatibility risk.

**Does a PASS mean my API is backward compatible?** No. It means no finding at your chosen threshold within the supported rule set. Unsupported constructs are reported as needs review, which fails the default gate, precisely so they are not ignored.

**Why does it say consumer impact is UNKNOWN?** Because a spec cannot tell who calls it. Provide a manifest; matches are still labelled unverified.

**Why are generated test cases `NOT_RUN`?** They are templates. Marking an unexecuted test as passed would be a false claim.

**Can I use it without internet?** Yes; it never uses the network.

**YAML specs?** Not yet; convert to JSON first.

**Is the audit "independent"?** It independently replays the evidence from raw files and does not trust the generator's claims, but it is the same project's code. It is automated self-verification, not a third-party audit.

**Is the hash chain a signature?** No. It is tamper-evidence.

**Which AI tools are supported?** Instruction packs for Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, Windsurf, Cline, Roo Code and Continue. They are instructions; native activation is not verified.

**How do I contribute a spec pair?** Open an issue with a synthetic before/after pair and the expected classification; it can join the gold corpus.

**License?** Apache-2.0.
