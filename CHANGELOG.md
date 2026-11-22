# Changelog

## 0.2.0 — 2026-11-23
- **Independent audit report**: `contractsutra audit --dir <reports> --out <dir>` replays 12 checks (AUD-01..AUD-12) and writes `audit-report.json`, `.md` and `.html`, sealed with SHA-256. `contractsutra verify` checks the seal.
- Reports rebuilt: verdict banner, severity cards, grouped findings, input hashes, dark mode, WCAG-minded colors; new SARIF 2.1.0 output (`contract-diff.sarif.json`).
- Audit log events now seal the SHA-256 of every generated report file, so edits after generation are detected.
- New comparison rules: numeric/string/array bounds, `pattern`, `uniqueItems`, `additionalProperties:false` with request/response direction.
- CLI: `--version`, `verify`, missing files now exit `3` (was `4`), UTF-8 BOM tolerated.
- Test fixes: symlink tests no longer fail on Windows hosts that deny symlink creation. 123 tests (was 101).
- Added `scripts/proof.mjs` (gold corpus, deterministic fuzz, benchmark) and `docs/proof/`.
- Packaging: published as `contractsutra-ai` with `contractsutra` and `contractsutra-ai` binaries; CI matrix, release (OIDC), Pages workflows; `llms.txt`, `CITATION.cff`, `NOTICE`.
- Server: rate-limit table is pruned (bounded memory).

## 0.1.0 — Local starter, 2026-11-22
- Bounded JSON OpenAPI 3.x structural parsing and common semantic rules.
- Source-hashed JSON pointer findings, user-declared consumer map, static case templates and six reports.
- CLI CI gate, append-only local hash chain, authenticated read-only loopback server, experimental root-scoped read-only MCP, portable agent/skill/rule/workflow packs.
