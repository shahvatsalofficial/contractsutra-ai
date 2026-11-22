# ContractSutra AI

**Know if your OpenAPI change will break consumers — before you ship. Offline, deterministic, and honest about what it cannot prove.**

[![CI](https://github.com/shahvatsalofficial/contractsutra-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/contractsutra-ai/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/contractsutra-ai)](https://www.npmjs.com/package/contractsutra-ai)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
![Node](https://img.shields.io/badge/node-%E2%89%A522-green)
![Dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)

ContractSutra AI is a zero-dependency Node.js CLI that compares two **JSON OpenAPI 3.0 / 3.1 / 3.2** documents and classifies every difference with **direction-aware** rules (providers must keep accepting old requests and keep honoring old responses). Each finding carries a stable ID, a JSON pointer, a severity, the declared consumers it touches, and an explicit `UNKNOWN` where it cannot decide. It then writes the evidence as **Markdown, HTML, JSON and SARIF**, seals it in a **hash-chained audit log**, and ships an **independent replay audit** that re-checks the reports and tells you if anyone edited them.

Created and maintained by **[Vatsal Shah](https://github.com/shahvatsalofficial)** · Apache-2.0 · [Docs site](https://shahvatsalofficial.github.io/contractsutra-ai/) · [Test results](docs/proof/TEST-RESULTS.md)

## Why use it

| You need to… | ContractSutra gives you |
| --- | --- |
| Stop breaking API changes in CI | `--fail-on breaking\|risky\|none`, exit code `2` on a failed gate, SARIF for GitHub code scanning |
| Show reviewers *why* | Per-finding JSON pointer, direction (request/response), rule code, severity, plain-English description |
| Know who may be hit | Declared-consumer mapping, always labelled `USER_DECLARED_UNVERIFIED` |
| Trust the output | 12-check independent audit, SHA-256 sealed reports, tamper detection, `NOT_RUN` for anything not executed |
| Keep data private | Fully offline. No telemetry, no network calls, no API keys |

## Quick start (Node.js 22+)

```bash
npx contractsutra-ai doctor
npx contractsutra-ai compare --before v1.json --after v2.json --out reports
npx contractsutra-ai audit --dir reports --out reports/audit      # audit-report.md / .html / .json
npx contractsutra-ai verify --report reports/audit/audit-report.json
```

From a clone (no install step, no dependencies):

```powershell
npm test          # 123 tests
npm run demo      # builds examples/reports/demo including the audit report
npm run proof     # test suite + gold corpus + 2,000-case fuzz + benchmark
```

## What you get (sample output)

Running the bundled fixtures (`fixtures/openapi/before.json` → `after.json`) produces:

| Severity | Count | Example |
| --- | ---: | --- |
| Breaking | 2 | New **required** request field; **removed** response field |
| Additive | 2 | New optional response field; new optional request field |
| Informational | 1 | Optional request property added |

Browse the real generated files in [`examples/reports/demo`](examples/reports/demo): [`compatibility.md`](examples/reports/demo/compatibility.md), [`compatibility.html`](examples/reports/demo/compatibility.html), [`contract-diff.sarif.json`](examples/reports/demo/contract-diff.sarif.json), and the independent [`audit/audit-report.md`](examples/reports/demo/audit/audit-report.md) / [`.html`](examples/reports/demo/audit/audit-report.html).

## Commands

```text
contractsutra validate --spec <openapi.json>
contractsutra compare --before <a.json> --after <b.json> [--consumers c.json] [--out dir] [--fail-on breaking|risky|none]
contractsutra cases --spec <openapi.json> [--out cases.json]
contractsutra audit [--dir reports] [--out audit-out]     # independent replay audit (MD + HTML + JSON)
contractsutra audit --file reports/audit.jsonl             # hash-chain check only
contractsutra verify --report audit-out/audit-report.json  # check the seal
contractsutra install-ide --host claude|cursor|codex|gemini|copilot|windsurf|cline|roo|continue --target ./project
contractsutra serve --dir reports --port 8765              # needs CONTRACTSUTRA_TOKEN (>= 32 chars), loopback only
contractsutra mcp --root .                                 # experimental read-only MCP over stdio
```

Exit codes: `0` success · `2` gate failed · `3` invalid input · `4` internal error or failed audit.

### Use as a GitHub Actions gate

```yaml
- uses: actions/setup-node@v7
  with: { node-version: '24' }
- run: npx contractsutra-ai compare --before base/openapi.json --after openapi.json --out reports --fail-on breaking
- run: npx contractsutra-ai audit --dir reports --out reports/audit
- uses: github/codeql-action/upload-sarif@v3
  with: { sarif_file: reports/contract-diff.sarif.json }
```

## Compatibility rules in brief

* **Request** (consumers send): new required field/param, removed field, tightened bound (`maxLength` ↓, `minimum` ↑), added `pattern`, `additionalProperties:false`, narrowed enum → **breaking**. Relaxations → additive.
* **Response** (consumers read): removed field, required→optional, type change, nullable introduced, removed status code or media type → **breaking**. Added optional fields → additive; enum expansion and relaxed guarantees → **needs review**.
* **Anything undecidable** (`oneOf/anyOf/allOf`, external `$ref`, cycles, nesting >6) → `UNRESOLVED_SEMANTICS`, severity *needs review*. It never silently passes.

Full matrix: [`docs/COMPATIBILITY-POLICY.md`](docs/COMPATIBILITY-POLICY.md).

## Proof and trust

Everything below is regenerated by `npm run proof` and committed under [`docs/proof`](docs/proof):

* **123 automated tests**, all passing locally, on a CI matrix of Ubuntu / Windows / macOS × Node 22 / 24.
* **Gold corpus**: 20 labelled change scenarios, 20/20 agree (precision 1.00, recall 1.00 — measured on the author's own synthetic corpus, *not* a claim about real-world APIs).
* **Deterministic fuzz**: 2,000 randomly mutated spec pairs, 0 crashes, 0 non-deterministic results.
* **Tamper tests**: editing a report, a finding ID, a severity count, or the audit log makes the audit **FAIL** (see `tests/assure.test.mjs`).
* **Benchmark**: [`docs/proof/benchmark.json`](docs/proof/benchmark.json).

### What it does **not** do (read this)

* It compares **specifications**, not running services. A green gate is **not** proof of runtime compatibility.
* JSON only (no YAML), OpenAPI only (no GraphQL SDL, AsyncAPI, protobuf yet). Composition keywords are reported as unknown, not analysed.
* Consumer mapping uses a **self-declared** manifest. It is not Pact verification and is never labelled as verified.
* Generated test cases are **templates** marked `NOT_RUN`; nothing is executed.
* The hash chain and seal are tamper-**evidence**, not digital signatures. The audit is automated self-verification, **not** an independent human audit or certification.
* The MCP server is experimental and speaks protocol `2025-11-25` only; native IDE loading of the agent packs is authored, not verified.

## Agents, skills, and IDE packs

22 specialist agent role definitions (`agents/`, `.claude/agents/`), 29 portable `SKILL.md` skills (`skills/`), 8 workflows, 10 guardrail rules (`INT-001`…`INT-010`) and adapter packs for 9 IDE hosts. They are instructions for AI assistants; they are **artifacts, not verified autonomous execution**. Install a pack with `contractsutra install-ide`.

## Documentation

Detailed executive, functional, architecture, technical, user, security, legal and test documents (Markdown + HTML) live in [`documents/`](documents/) and on the [docs site](https://shahvatsalofficial.github.io/contractsutra-ai/).

## Legal, privacy, security

Apache-2.0 ([LICENSE](LICENSE), [NOTICE](NOTICE)). No telemetry; spec contents never leave your machine. Report vulnerabilities per [SECURITY.md](SECURITY.md). Output is engineering evidence, **not legal advice or a compliance certification**. See [`documents/md/09-legal-and-governance.md`](documents/md/09-legal-and-governance.md).

## Citation

See [CITATION.cff](CITATION.cff). If you use ContractSutra AI in research or tooling, please cite it.
