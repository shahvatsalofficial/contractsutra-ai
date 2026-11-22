# User guide

## 1. Install
```bash
node --version            # must be 22 or newer
npx contractsutra-ai doctor
```
Or `npm install -g contractsutra-ai`, then use `contractsutra`.

## 2. Compare two versions
```bash
contractsutra compare --before api-v1.json --after api-v2.json --out reports
```
Exit code `2` means the gate failed (default gate is `risky`: breaking or needs-review findings). Add `--fail-on breaking` to ignore needs-review findings, or `--fail-on none` to only report.

Open `reports/compatibility.html` in a browser, or read `reports/compatibility.md`.

## 3. Say who consumes the API (optional)
```json
{"consumers":[{"name":"mobile-app","operations":["GET /profile","POST /invitations"]}]}
```
Pass `--consumers consumers.json`. Matches appear as `DECLARED_CONSUMERS_MATCHED_UNVERIFIED`. Operations with no match stay `UNKNOWN`: absence from the manifest does not mean nobody uses it.

## 4. Audit the evidence
```bash
contractsutra audit --dir reports --out reports/audit
contractsutra verify --report reports/audit/audit-report.json
```
Share `audit-report.html` or `.md` with reviewers. `FAIL` means a file was altered after generation or the log was tampered with.

## 5. Use in CI
```yaml
- run: npx contractsutra-ai compare --before base/openapi.json --after openapi.json --out reports --fail-on breaking
- run: npx contractsutra-ai audit --dir reports --out reports/audit
- uses: github/codeql-action/upload-sarif@v4
  with: { sarif_file: reports/contract-diff.sarif.json }
```

## 6. Read a finding
Each finding shows: **ID** (stable across runs), **severity**, **code**, **JSON pointer** (exact location), **direction**, and **consumer impact**. Use the pointer to jump to the place in the spec.

## 7. Use with AI assistants
`contractsutra install-ide --host claude --target ./my-project` copies instruction packs to `./my-project/.contractsutra/ide-packs/claude`. Hosts: claude, cursor, codex, gemini, copilot, windsurf, cline, roo, continue. This installs instructions only.

## Troubleshooting
| Symptom | Fix |
| --- | --- |
| `Unable to parse JSON` | Convert YAML to JSON first (YAML not supported yet) |
| `OPENAPI_VERSION_UNSUPPORTED` | Use `openapi: 3.0.x`, `3.1.x` or `3.2.x` |
| Many `UNRESOLVED_SEMANTICS` | Spec uses `oneOf/anyOf/allOf` or external `$ref`; review those places by hand |
| Exit `3` | Input problem: missing file, bad JSON, bad flag |
| Exit `4` on audit | Report modified after generation, or audit log tampered |
