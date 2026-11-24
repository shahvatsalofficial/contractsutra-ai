# Real-world scenarios

Six situations teams actually hit, with the **real output** of ContractSutra AI v{{VERSION}}. Every terminal block below is produced by running the CLI at documentation build time, not typed by hand.

## 1. A pull request removes a response field

**Who:** a backend developer on the invitations service. **Situation:** a refactor drops `role` from the `POST /invitations` response and makes `locale` a required input. The mobile app still reads `role`.

@@diagram:pipeline@@

@@term:s1@@

The gate exits with code **2**, so the pipeline stops before merge. Each finding names the exact JSON pointer to open:

@@findings@@

> **Why it matters:** a field removed from a *response* breaks clients that read it. A field added as *required* in a *request* breaks clients that do not send it. The engine applies the opposite rules for each direction.

## 2. A release manager checks who is affected

**Who:** a release manager. **Situation:** the diff shows two breaking changes, but "who calls this?" is not in the spec. A consumer manifest lists the teams that declared they use each operation.

@@term:s2@@

Matches are labelled `DECLARED_CONSUMERS_MATCHED_UNVERIFIED`. A finding with no match stays `UNKNOWN`: an operation missing from the manifest does **not** mean nobody calls it.

## 3. A harmless change should not block the release

**Who:** an API owner. **Situation:** the team only adds a new optional response field. The gate must stay green.

@@term:s3@@

Exit code **0**. Additive changes are reported so reviewers can see them, but they do not fail the gate. Strict clients that reject unknown fields are the one caveat, and that is why consumer mapping exists.

## 4. The spec uses `oneOf` and the tool cannot decide

**Who:** a platform engineer. **Situation:** a property becomes `oneOf: [string, integer]`. A static tool cannot prove that is compatible.

@@term:s4@@

ContractSutra **fails closed**: it reports `UNRESOLVED_SEMANTICS` as *needs review* and the default gate (`risky`) stops the pipeline. Use `--fail-on breaking` only when you have decided that unknowns are acceptable.

@@diagram:decision@@

## 5. Someone edits the report after the fact

**Who:** a compliance reviewer. **Situation:** a report is shared for sign-off. Before it arrives, a line in `compatibility.md` is changed to hide a finding. The independent audit replays the evidence.

@@term:s5@@

The audit log sealed the SHA-256 of every generated file at creation time, so the edit is caught (`AUD-04`). The hash chain proves *tampering*, not *who* did it: it is tamper-evidence, not a signature.

@@diagram:chain@@

## 6. Run it in GitHub Actions and see findings in the Security tab

**Who:** a DevOps engineer. **Situation:** every pull request should be compared against `main`, fail on breaking changes, and show findings as code-scanning alerts.

@@diagram:ci@@

```yaml
name: API contract
on: pull_request
permissions: { contents: read, security-events: write }
jobs:
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v7
        with: { node-version: '24' }
      - run: git show origin/main:openapi.json > base.json
      - run: npx contractsutra-ai compare --before base.json --after openapi.json --out reports --fail-on breaking
      - run: npx contractsutra-ai audit --dir reports --out reports/audit
        if: always()
      - uses: github/codeql-action/upload-sarif@v4
        if: always()
        with: { sarif_file: reports/contract-diff.sarif.json }
      - uses: actions/upload-artifact@v7
        if: always()
        with: { name: contract-evidence, path: reports }
```

`if: always()` keeps the evidence even when the gate fails, which is exactly when reviewers need it.

## What these scenarios do not prove
They show how the *static* analysis behaves on the bundled fixtures and small synthetic variants. They do not show behaviour on your production spec, YAML input, GraphQL or AsyncAPI, or any live consumer. Treat a green gate as "no known static break", then confirm with consumer contract tests.
